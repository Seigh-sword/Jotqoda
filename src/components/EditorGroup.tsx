import { useEffect, useRef, useState } from 'react';
import Editor, { DiffEditor } from '@monaco-editor/react';
import { X, Play, Columns2, Eye, MoreHorizontal, ChevronRight, GitCompare, Square, Loader2, Zap, Code2 } from 'lucide-react';
import { useIDE, basename, isSpecialTab } from '../ide/types';
import { getLang } from '../ide/languages';
import { setupMonaco, toMonacoLang, ideRef } from '../ide/monacoSetup';
import { canPreview } from '../ide/preview';
import { FileIcon } from './FileIcon';
import { Welcome } from './Welcome';

export function useEditorOptions() {
  const s = useIDE().settings;
  return {
    fontSize: s.fontSize, fontFamily: s.fontFamily, lineHeight: s.lineHeight, tabSize: s.tabSize, insertSpaces: s.insertSpaces,
    wordWrap: s.wordWrap ? 'on' : 'off', minimap: { enabled: s.minimap, renderCharacters: false }, lineNumbers: s.lineNumbers,
    renderWhitespace: s.renderWhitespace, cursorStyle: s.cursorStyle, cursorBlinking: s.cursorBlinking,
    cursorSmoothCaretAnimation: s.smoothCaret ? 'on' : 'off', smoothScrolling: s.smoothScrolling,
    bracketPairColorization: { enabled: s.bracketPairs }, guides: { bracketPairs: s.bracketPairs, indentation: s.indentGuides, highlightActiveIndentation: true },
    stickyScroll: { enabled: s.stickyScroll }, fontLigatures: s.ligatures, formatOnPaste: s.formatOnPaste, folding: s.folding,
    autoClosingBrackets: s.autoClosingBrackets ? 'languageDefined' : 'never', mouseWheelZoom: s.mouseWheelZoom,
    renderLineHighlight: s.renderLineHighlight, scrollBeyondLastLine: s.scrollBeyondLastLine, linkedEditing: s.linkedEditing,
    quickSuggestions: s.quickSuggestions, parameterHints: { enabled: s.parameterHints }, colorDecorators: s.colorDecorators,
    automaticLayout: true, padding: { top: 8 }, fixedOverflowWidgets: true, suggest: { preview: true, showStatusBar: true },
    inlayHints: { enabled: 'on' }, 'semanticHighlighting.enabled': true, dragAndDrop: true, showFoldingControls: 'mouseover',
    unicodeHighlight: { ambiguousCharacters: false },
  } as any;
}

export function EditorGroup({ index }: { index: number }) {
  const ide = useIDE();
  const group = ide.groups[index];
  const path = group?.active ?? null;
  const options = useEditorOptions();
  const [menu, setMenu] = useState<{ x: number; y: number; path: string } | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const focused = ide.activeGroup === index;

  useEffect(() => {
    const c = () => setMenu(null);
    window.addEventListener('click', c);
    return () => window.removeEventListener('click', c);
  }, []);

  useEffect(() => {
    tabsRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [path]);

  if (!group) return null;
  const isFile = path && !isSpecialTab(path) && ide.files[path] != null;
  const lang = isFile ? getLang(path!) : null;
  const langId = isFile ? ide.langOverride[path!] ?? lang!.id : 'plaintext';

  const tabLabel = (p: string) => (p.startsWith('diff:') ? basename(p.slice(5)) + ' (diff)' : p === '__welcome__' ? 'Welcome' : basename(p));

  const onMount = (ed: any, monaco: any) => {
    ide.editors.current[index] = ed;
    ide.setMonaco(monaco);
    ed.onDidFocusEditorText(() => ideRef.current?.setActiveGroup(index));
    ed.onDidChangeCursorSelection((e: any) => {
      const s = e.selection;
      const model = ed.getModel();
      const selText = model ? model.getValueInRange(s) : '';
      ideRef.current?.setCursor({ line: s.positionLineNumber, col: s.positionColumn, sel: selText.length, selLines: selText ? s.endLineNumber - s.startLineNumber + 1 : 0 });
    });
    ed.addAction({ id: 'jotqoda.run', label: 'Run File', contextMenuGroupId: '0_jotqoda', contextMenuOrder: 1, keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter], run: () => ideRef.current?.run() });
    ed.addAction({ id: 'jotqoda.preview', label: 'Open Preview', contextMenuGroupId: '0_jotqoda', contextMenuOrder: 2, run: () => { const i = ideRef.current!; i.setPreviewPath(i.activeFile); } });
    ed.addAction({ id: 'jotqoda.save', label: 'Save File', keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS], run: () => ideRef.current?.saveFile() });
    ed.addAction({ id: 'jotqoda.palette', label: 'Command Palette', keybindings: [monaco.KeyCode.F1], run: () => ideRef.current?.openPalette('commands') });
    ed.addAction({ id: 'jotqoda.copyPath', label: 'Copy File Path', contextMenuGroupId: '9_cutcopypaste', contextMenuOrder: 9, run: () => navigator.clipboard.writeText(ideRef.current?.activeFile ?? '') });
    ed.focus();
  };

  const runnable = lang?.runnable && lang.runnable !== 'css';

  return (
    <div className={`flex flex-col h-full min-w-0 ${focused ? '' : 'opacity-95'}`} onMouseDown={() => ide.setActiveGroup(index)}>
      <div className="flex h-9 bg-[var(--side)] border-b border-[var(--border)] shrink-0">
        <div ref={tabsRef} className="flex flex-1 overflow-x-auto overflow-y-hidden tabs-scroll" onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
          {group.tabs.map((p) => {
            const active = p === path;
            const dirty = ide.files[p] != null && ide.files[p] !== ide.saved[p];
            const errs = ide.problems.filter((x) => x.path === p && x.severity === 'error').length;
            return (
              <div
                key={p}
                data-active={active}
                onClick={() => ide.openFile(p, index)}
                onMouseDown={(e) => { if (e.button === 1) { e.preventDefault(); ide.closeTab(p, index); } }}
                onContextMenu={(e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, path: p }); }}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/ide-tab', JSON.stringify({ p, from: index }))}
                title={p}
                className={`group relative flex items-center gap-1.5 pl-3 pr-1.5 min-w-fit cursor-pointer text-[13px] border-r border-[var(--border)] select-none ${active ? 'bg-[var(--bg)] text-[var(--fg)]' : 'text-[var(--muted)] hover:bg-[var(--hover)]'}`}
              >
                {active && <div className={`absolute top-0 left-0 right-0 h-[2px] ${focused ? 'bg-[var(--accent)]' : 'bg-[var(--muted)]'}`} />}
                {p.startsWith('diff:') ? <GitCompare size={13} className="text-amber-300" /> : p === '__welcome__' ? <Zap size={13} className="text-[var(--accent)]" /> : <FileIcon path={p} />}
                <span className={`whitespace-nowrap ${errs ? 'text-red-400' : ''} ${p.startsWith('diff:') ? 'italic' : ''}`}>{tabLabel(p)}</span>
                {errs > 0 && <span className="text-[10px] text-red-400">{errs}</span>}
                <button onClick={(e) => { e.stopPropagation(); ide.closeTab(p, index); }} className={`w-5 h-5 flex items-center justify-center rounded hover:bg-[var(--hover)] ${dirty ? '' : active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  {dirty ? <span className="w-2 h-2 rounded-full bg-[var(--fg)] group-hover:hidden" /> : null}
                  <X size={13} className={dirty ? 'hidden group-hover:block' : ''} />
                </button>
              </div>
            );
          })}
          <div className="flex-1" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { const d = e.dataTransfer.getData('text/ide-tab'); if (d) { const { p } = JSON.parse(d); ide.openFile(p, index); } }} onDoubleClick={() => ide.execCommand('file.new')} />
        </div>
        <div className="flex items-center gap-0.5 px-1.5">
          {runnable && (ide.running ? (
            <button title="Stop (Shift+F5)" onClick={ide.stop} className="p-1.5 rounded text-red-400 hover:bg-[var(--hover)] flex items-center gap-1"><Loader2 size={13} className="animate-spin" /><Square size={12} fill="currentColor" /></button>
          ) : (
            <button title="Run File (F5)" onClick={() => ide.run(path!)} className="p-1.5 rounded text-emerald-400 hover:bg-[var(--hover)]"><Play size={15} fill="currentColor" /></button>
          ))}
          {isFile && canPreview(path!) && <button title="Toggle Preview (Ctrl+Shift+V)" onClick={() => ide.setPreviewPath(ide.previewPath ? null : path)} className={`p-1.5 rounded hover:bg-[var(--hover)] ${ide.previewPath ? 'text-[var(--accent)]' : 'text-[var(--muted)]'}`}><Eye size={15} /></button>}
          {index === 0 && <button title="Split Editor (Ctrl+\)" onClick={ide.splitEditor} className="p-1.5 rounded text-[var(--muted)] hover:bg-[var(--hover)]"><Columns2 size={15} /></button>}
          <button title="More" onClick={(e) => { e.stopPropagation(); setMenu({ x: e.clientX - 180, y: e.clientY + 10, path: path ?? '' }); }} className="p-1.5 rounded text-[var(--muted)] hover:bg-[var(--hover)]"><MoreHorizontal size={15} /></button>
        </div>
      </div>

      {isFile && ide.settings.showBreadcrumbs && (
        <div className="flex items-center gap-0.5 h-6 px-3 text-[12px] text-[var(--muted)] bg-[var(--bg)] shrink-0 overflow-hidden">
          {path!.split('/').map((seg, i, arr) => (
            <span key={i} className="flex items-center gap-0.5 whitespace-nowrap">
              {i > 0 && <ChevronRight size={12} className="opacity-60" />}
              {i === arr.length - 1 && <FileIcon path={path!} />}
              <span className="hover:text-[var(--fg)] cursor-pointer" onClick={() => { ide.setSidebarView('explorer'); ide.setSidebarOpen(true); }}>{seg}</span>
            </span>
          ))}
          <span className="ml-auto text-[11px] opacity-70">{lang?.name}</span>
        </div>
      )}

      <div className="flex-1 min-h-0 relative">
        {!path && <EmptyEditor />}
        {path === '__welcome__' && <Welcome />}
        {path?.startsWith('diff:') && (() => {
          const fp = path.slice(5);
          return (
            <div className="h-full flex flex-col">
              <div className="flex items-center gap-3 px-3 h-7 text-[12px] bg-[var(--side)] border-b border-[var(--border)]">
                <span className="text-red-400">− HEAD</span><span className="text-emerald-400">+ Working Tree</span>
                <button className="ml-auto underline text-[var(--accent)]" onClick={() => ide.openFile(fp)}>Open File</button>
                <button className="underline text-[var(--muted)]" onClick={() => ide.discard(fp)}>Discard</button>
              </div>
              <div className="flex-1">
                <DiffEditor
                  original={ide.head[fp] ?? ''}
                  modified={ide.files[fp] ?? ''}
                  language={toMonacoLang(getLang(fp).id)}
                  theme={ide.settings.theme}
                  beforeMount={setupMonaco}
                  originalModelPath={'diff-orig:///' + fp}
                  modifiedModelPath={'diff-mod:///' + fp}
                  options={{ ...options, readOnly: true, renderSideBySide: true, originalEditable: false }}
                />
              </div>
            </div>
          );
        })()}
        {isFile && (
          <Editor
            path={'file:///' + path}
            defaultValue={ide.files[path!]}
            language={toMonacoLang(langId)}
            theme={ide.settings.theme}
            options={options}
            beforeMount={setupMonaco}
            onMount={onMount}
            loading={<div className="flex items-center gap-2 text-[var(--muted)] text-sm"><Loader2 className="animate-spin" size={16} /> Loading Monaco engine…</div>}
            onChange={(v) => {
              const ed = ide.editors.current[index];
              const uri = ed?.getModel()?.uri;
              if (uri && uri.scheme === 'file') ideRef.current?.writeFile(decodeURIComponent(uri.path.slice(1)), v ?? '');
            }}
          />
        )}
        {path && !isFile && !isSpecialTab(path) && <div className="p-8 text-[var(--muted)]">File not found: {path}</div>}
      </div>

      {menu && (
        <div className="fixed z-50 min-w-[200px] py-1 rounded-md shadow-2xl border border-[var(--border)] bg-[var(--side)] text-[13px]" style={{ left: Math.max(4, menu.x), top: menu.y }}>
          {[
            ['Close', () => ide.closeTab(menu.path, index)],
            ['Close Others', () => ide.closeOthers(menu.path, index)],
            ['Close All', () => ide.closeAll()],
            ['-'],
            ['Split Right', () => ide.openFile(menu.path, 1)],
            ['Run File', () => ide.run(menu.path)],
            ['Open Preview', () => ide.setPreviewPath(menu.path)],
            ['-'],
            ['Copy Path', () => navigator.clipboard.writeText(menu.path)],
            ['Reveal in Explorer', () => { ide.setSidebarView('explorer'); ide.setSidebarOpen(true); }],
            ['Save', () => ide.saveFile(menu.path)],
          ].map((it: any, i) => it[0] === '-' ? <div key={i} className="my-1 border-t border-[var(--border)]" /> : (
            <button key={i} onClick={() => { it[1](); setMenu(null); }} className="block w-full text-left px-4 py-1 hover:bg-[var(--accent)] hover:text-white">{it[0]}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyEditor() {
  const ide = useIDE();
  const rows: [string, string][] = [['Show All Commands', 'Ctrl+Shift+P'], ['Go to File', 'Ctrl+P'], ['New File', 'Ctrl+Alt+N'], ['Toggle Terminal', 'Ctrl+`'], ['Find in Files', 'Ctrl+Shift+F']];
  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 select-none bg-[var(--bg)]">
      <Code2 className="text-7xl opacity-10" strokeWidth={1} />
      <div className="space-y-2 text-[13px]">
        {rows.map(([l, k]) => (
          <div key={l} className="flex gap-6 justify-between text-[var(--muted)] cursor-pointer hover:text-[var(--fg)]" onClick={() => ide.execCommand(({ 'Show All Commands': 'view.palette', 'Go to File': 'view.quickOpen', 'New File': 'file.new', 'Toggle Terminal': 'view.terminal', 'Find in Files': 'view.search' } as any)[l])}>
            <span>{l}</span><span className="font-mono text-[11px] px-1.5 rounded bg-[var(--input)]">{k}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
