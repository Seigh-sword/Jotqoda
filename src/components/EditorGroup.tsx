import { useEffect, useMemo, useRef, useState } from 'react';
import Editor, { DiffEditor } from '@monaco-editor/react';
import { X, Play, Columns2, Eye, MoreHorizontal, ChevronRight, GitCompare, Square, Loader2, Zap, Code2, Pin, History, ArrowLeft, ArrowRight } from 'lucide-react';
import { useIDE, basename, isSpecialTab, type CompareSide } from '../ide/types';
import { getLang, getLangById } from '../ide/languages';
import { setupMonaco, toMonacoLang, ideRef, applyPendingReveal } from '../ide/monacoSetup';
import { canPreview } from '../ide/preview';
import { documentSymbols } from '../ide/outline';
import { symbolPathAt, type Sym } from '../ide/symbols';
import { formatterName } from '../ide/format';
import { FileIcon, SymbolIcon } from './FileIcon';
import { Welcome } from './Welcome';

export function useEditorOptions() {
  const s = useIDE().settings;
  return useMemo(() => ({
    fontSize: s.fontSize, fontFamily: s.fontFamily, fontWeight: s.fontWeight, letterSpacing: s.letterSpacing, lineHeight: s.lineHeight, tabSize: s.tabSize, insertSpaces: s.insertSpaces,
    wordWrap: s.wordWrap ? 'on' : 'off', wordWrapColumn: s.wordWrapColumn,
    minimap: { enabled: s.minimap, renderCharacters: s.minimapRenderCharacters, side: s.minimapSide }, lineNumbers: s.lineNumbers,
    rulers: s.rulers.split(/[,\s]+/).map(Number).filter((n) => n > 0),
    renderWhitespace: s.renderWhitespace, cursorStyle: s.cursorStyle, cursorBlinking: s.cursorBlinking, cursorSurroundingLines: s.cursorSurroundingLines,
    cursorSmoothCaretAnimation: s.smoothCaret ? 'on' : 'off', smoothScrolling: s.smoothScrolling, multiCursorModifier: s.multiCursorModifier,
    bracketPairColorization: { enabled: s.bracketPairs }, guides: { bracketPairs: s.bracketPairs, indentation: s.indentGuides, highlightActiveIndentation: true },
    stickyScroll: { enabled: s.stickyScroll }, fontLigatures: s.ligatures, formatOnPaste: s.formatOnPaste, formatOnType: s.formatOnType, folding: s.folding,
    autoClosingBrackets: s.autoClosingBrackets ? 'languageDefined' : 'never', autoClosingQuotes: s.autoClosingQuotes ? 'languageDefined' : 'never', autoSurround: s.autoSurround ? 'languageDefined' : 'never',
    mouseWheelZoom: s.mouseWheelZoom, renderLineHighlight: s.renderLineHighlight, scrollBeyondLastLine: s.scrollBeyondLastLine, linkedEditing: s.linkedEditing,
    quickSuggestions: s.quickSuggestions, parameterHints: { enabled: s.parameterHints }, colorDecorators: s.colorDecorators,
    renderControlCharacters: s.renderControlCharacters, occurrencesHighlight: s.occurrencesHighlight ? 'singleFile' : 'off', selectionHighlight: s.selectionHighlight,
    links: s.links, hover: { enabled: s.hover, delay: 300 }, glyphMargin: s.glyphMargin, acceptSuggestionOnEnter: s.acceptSuggestionOnEnter, tabCompletion: s.tabCompletion,
    wordBasedSuggestions: s.wordBasedSuggestions, snippetSuggestions: s.snippetSuggestions, copyWithSyntaxHighlighting: s.copyWithSyntaxHighlighting,
    automaticLayout: true, padding: { top: 8 }, fixedOverflowWidgets: true, suggest: { preview: true, showStatusBar: true },
    inlayHints: { enabled: 'on' }, 'semanticHighlighting.enabled': true, dragAndDrop: true, showFoldingControls: 'mouseover',
    unicodeHighlight: { ambiguousCharacters: false },
  } as any), [s]);
}

function sideContent(ide: ReturnType<typeof useIDE>, side: CompareSide): string {
  if (side.kind === 'file') return ide.files[side.path ?? ''] ?? side.content ?? '';
  if (side.kind === 'saved') return ide.saved[side.path ?? ''] ?? '';
  if (side.kind === 'head') return ide.head[side.path ?? ''] ?? '';
  return side.content ?? '';
}

export function EditorGroup({ index }: { index: number }) {
  const ide = useIDE();
  const group = ide.groups[index];
  const path = group?.active ?? null;
  const options = useEditorOptions();
  const [menu, setMenu] = useState<{ x: number; y: number; path: string } | null>(null);
  const [dropAt, setDropAt] = useState<string | null>(null);
  const [syms, setSyms] = useState<Sym[]>([]);
  const tabsRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(index);
  indexRef.current = index;
  const editorRef = useRef<any>(null);
  /** bookmark decoration ids per model (models outlive tab switches) */
  const decoIds = useRef(new Map<string, string[]>());
  const [modelTick, setModelTick] = useState(0);
  const focused = ide.activeGroup === index;

  useEffect(() => {
    const c = () => setMenu(null);
    window.addEventListener('click', c);
    return () => window.removeEventListener('click', c);
  }, []);

  useEffect(() => {
    tabsRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [path]);

  const isFile = !!path && !isSpecialTab(path) && ide.files[path] != null;
  const content = isFile ? ide.files[path!] : '';
  const lang = isFile ? (ide.langOverride[path!] ? getLangById(ide.langOverride[path!]) : getLang(path!, ide.settings.autoDetectLanguage ? content : undefined)) : null;

  // symbols for breadcrumbs (debounced)
  useEffect(() => { setSyms([]); }, [path]);
  useEffect(() => {
    if (!isFile || !ide.settings.showBreadcrumbs) { setSyms([]); return; }
    let live = true;
    const t = setTimeout(() => { documentSymbols(ide, path!).then((s) => live && setSyms(s)).catch(() => live && setSyms([])); }, 350);
    return () => { live = false; clearTimeout(t); };
  }, [path, content, isFile, ide.settings.showBreadcrumbs, ide.monaco]);

  // bookmark decorations (kept per model so switching tabs never leaves stale glyphs)
  useEffect(() => {
    const ed = editorRef.current;
    const monaco = ide.monaco;
    const model = ed?.getModel?.();
    if (!model || !monaco || !isFile || model.isDisposed?.()) return;
    const key = model.uri.toString();
    const marks = ide.bookmarks.filter((b) => b.path === path && b.line <= model.getLineCount());
    const decos = marks.map((b) => ({ range: new monaco.Range(b.line, 1, b.line, 1), options: { isWholeLine: false, glyphMarginClassName: 'jq-bookmark-glyph', glyphMarginHoverMessage: { value: 'Bookmark (Ctrl+Alt+K to toggle)' }, overviewRuler: { color: '#3b82f6', position: 4 } } }));
    decoIds.current.set(key, model.deltaDecorations(decoIds.current.get(key) ?? [], decos));
  }, [ide.bookmarks, path, isFile, ide.monaco, modelTick]);

  if (!group) return null;
  const pinned = group.pinned ?? [];

  const cmpLabel = (id: string) => { const c = ide.compares[id]; return c ? `${c.left.label} ↔ ${c.right.label}` : 'Comparison'; };
  const tabLabel = (p: string) => (p.startsWith('diff:') ? basename(p.slice(5)) + ' (Working Tree)' : p.startsWith('cmp:') ? cmpLabel(p.slice(4)) : p === '__welcome__' ? 'Welcome' : basename(p));

  const onMount = (ed: any, monaco: any) => {
    editorRef.current = ed;
    decoIds.current.clear();
    setModelTick((t) => t + 1);
    ide.editors.current[indexRef.current] = ed;
    ide.setMonaco(monaco);
    ed.onDidFocusEditorText(() => ideRef.current?.setActiveGroup(indexRef.current));
    ed.onDidChangeCursorSelection((e: any) => {
      const s = e.selection;
      const model = ed.getModel();
      const selText = model ? model.getValueInRange(s) : '';
      ideRef.current?.setCursor({ line: s.positionLineNumber, col: s.positionColumn, sel: selText.length, selLines: selText ? s.endLineNumber - s.startLineNumber + 1 : 0 });
    });
    ed.onDidChangeModel(() => { setModelTick((t) => t + 1); setTimeout(() => applyPendingReveal(ed), 0); });
    ed.onMouseDown((e: any) => {
      if (e.target?.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN && e.target.position) {
        const model = ed.getModel();
        if (model?.uri.scheme === 'file') ideRef.current?.toggleBookmark(decodeURIComponent(model.uri.path.slice(1)), e.target.position.lineNumber);
      }
    });
    ed.addAction({ id: 'jotqoda.run', label: 'Run File', contextMenuGroupId: '0_jotqoda', contextMenuOrder: 1, keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter], run: () => ideRef.current?.run() });
    ed.addAction({ id: 'jotqoda.preview', label: 'Open Preview', contextMenuGroupId: '0_jotqoda', contextMenuOrder: 2, run: () => { const i = ideRef.current!; i.setPreviewPath(i.activeFile); } });
    ed.addAction({ id: 'jotqoda.format', label: 'Format Document (JotQoda)', contextMenuGroupId: '1_modification', contextMenuOrder: 1, run: () => ideRef.current?.formatDocument() });
    ed.addAction({ id: 'jotqoda.bookmark', label: 'Toggle Bookmark', contextMenuGroupId: '0_jotqoda', contextMenuOrder: 3, run: () => ideRef.current?.toggleBookmark() });
    ed.addAction({ id: 'jotqoda.findRefsWorkspace', label: 'Find in Files (Selection)', contextMenuGroupId: '0_jotqoda', contextMenuOrder: 4, run: () => { const m = ed.getModel(); const sel = ed.getSelection(); const w = sel && !sel.isEmpty() ? m.getValueInRange(sel) : m.getWordAtPosition(ed.getPosition())?.word; ideRef.current?.openSearch({ query: w ?? '' }); } });
    ed.addAction({ id: 'jotqoda.save', label: 'Save File', keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS], run: () => ideRef.current?.saveFile() });
    ed.addAction({ id: 'jotqoda.palette', label: 'Command Palette', keybindings: [monaco.KeyCode.F1], run: () => ideRef.current?.openPalette('commands') });
    ed.addAction({ id: 'jotqoda.copyPath', label: 'Copy File Path', contextMenuGroupId: '9_cutcopypaste', contextMenuOrder: 9, run: () => navigator.clipboard.writeText(ideRef.current?.activeFile ?? '') });
    applyPendingReveal(ed);
    ed.focus();
  };

  const runnable = lang?.runnable && lang.runnable !== 'css';
  const dirty = (p: string) => ide.files[p] != null && ide.files[p] !== ide.saved[p];

  const onDropTab = (e: React.DragEvent, before: string | null) => {
    e.preventDefault();
    setDropAt(null);
    const d = e.dataTransfer.getData('text/ide-tab');
    if (d) {
      const { p, from } = JSON.parse(d);
      if (p === before) return;
      ide.moveTab(p, from, indexRef.current, before);
      return;
    }
    const file = e.dataTransfer.getData('text/ide-file');
    if (file) ide.openFile(file, indexRef.current);
  };

  const menuItems = (p: string): ([string, () => void] | ['-'])[] => {
    const file = ide.files[p] != null;
    const g = indexRef.current;
    return [
      ['Close', () => ide.closeTab(p, g)],
      ['Close Others', () => ide.closeOthers(p, g)],
      ['Close to the Right', () => ide.closeToRight(p, g)],
      ['Close Saved', () => ide.closeSaved(g)],
      ['Close All', () => ide.closeAll()],
      ['Reopen Closed Editor', () => ide.reopenClosed()],
      ['-'],
      [pinned.includes(p) ? 'Unpin' : 'Pin', () => ide.togglePin(p, g)],
      ['Split Right', () => ide.openFile(p, ide.groups.length)],
      ...(ide.groups.length > 1 ? [['Move to Next Group', () => ide.moveTab(p, g, (g + 1) % ide.groups.length)] as [string, () => void]] : []),
      ['-'],
      ...(file ? ([
        ['Compare with Saved', () => ide.openCompare({ label: basename(p) + ' (saved)', path: p, kind: 'saved' }, { label: basename(p), path: p, kind: 'file' })],
        ['Compare with HEAD', () => ide.openCompare({ label: basename(p) + ' (HEAD)', path: p, kind: 'head' }, { label: basename(p), path: p, kind: 'file' })],
        ide.compareTarget && ide.compareTarget !== p
          ? ['Compare with Selected', () => ide.openCompare({ label: basename(ide.compareTarget!), path: ide.compareTarget!, kind: 'file' }, { label: basename(p), path: p, kind: 'file' })]
          : ['Select for Compare', () => { ide.setCompareTarget(p); ide.toast(`Selected ${basename(p)} for compare`); }],
        ['Local History…', () => ide.execCommand('history.show')],
        ['-'],
        ['Run File', () => ide.run(p)],
        ['Open Preview', () => ide.setPreviewPath(p)],
        ['Save', () => ide.saveFile(p)],
        ['Copy Path', () => navigator.clipboard.writeText(p)],
        ['Reveal in Explorer', () => { ide.setSidebarView('explorer'); ide.setSidebarOpen(true); }],
        ['Open in Terminal', () => ide.requestTerminal({ cwd: p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '' })],
      ] as [string, () => void][]) : []),
    ];
  };

  const crumbSyms = isFile ? symbolPathAt(syms, ide.activeFile === path ? ide.cursor.line : 1) : [];

  return (
    <div className={`flex flex-col h-full min-w-0 ${focused ? '' : 'opacity-95'}`} onMouseDown={() => ide.setActiveGroup(indexRef.current)}>
      <div className="flex h-9 bg-[var(--side)] border-b border-[var(--border)] shrink-0">
        <div ref={tabsRef} className="flex flex-1 overflow-x-auto overflow-y-hidden tabs-scroll" onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
          {group.tabs.map((p) => {
            const active = p === path;
            const isPinned = pinned.includes(p);
            const d = dirty(p);
            const errs = ide.problems.filter((x) => x.path === p && x.severity === 'error').length;
            return (
              <div
                key={p}
                data-active={active}
                onClick={() => ide.openFile(p, indexRef.current)}
                onMouseDown={(e) => { if (e.button === 1) { e.preventDefault(); ide.closeTab(p, indexRef.current); } }}
                onDoubleClick={() => ide.togglePin(p, indexRef.current)}
                onContextMenu={(e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, path: p }); }}
                draggable
                onDragStart={(e) => { e.dataTransfer.setData('text/ide-tab', JSON.stringify({ p, from: indexRef.current })); e.dataTransfer.effectAllowed = 'move'; }}
                onDragOver={(e) => { e.preventDefault(); setDropAt(p); }}
                onDragLeave={() => setDropAt((x) => (x === p ? null : x))}
                onDrop={(e) => onDropTab(e, p)}
                title={p.startsWith('cmp:') ? tabLabel(p) : p + (isPinned ? ' (pinned)' : '')}
                className={`group relative flex items-center gap-1.5 pl-3 pr-1.5 min-w-fit cursor-pointer text-[13px] border-r border-[var(--border)] select-none ${active ? 'bg-[var(--bg)] text-[var(--fg)]' : 'text-[var(--muted)] hover:bg-[var(--hover)]'} ${dropAt === p ? 'shadow-[inset_2px_0_0_var(--accent)]' : ''}`}
              >
                {active && <div className={`absolute top-0 left-0 right-0 h-[2px] ${focused ? 'bg-[var(--accent)]' : 'bg-[var(--muted)]'}`} />}
                {p.startsWith('diff:') || p.startsWith('cmp:') ? <GitCompare size={13} className="text-amber-300" /> : p === '__welcome__' ? <Zap size={13} className="text-[var(--accent)]" /> : <FileIcon path={p} />}
                <span className={`whitespace-nowrap max-w-[260px] truncate ${errs ? 'text-red-400' : ''} ${isSpecialTab(p) && p !== '__welcome__' ? 'italic' : ''}`}>{tabLabel(p)}</span>
                {errs > 0 && <span className="text-[10px] text-red-400">{errs}</span>}
                {isPinned ? (
                  <button title="Unpin" onClick={(e) => { e.stopPropagation(); ide.togglePin(p, indexRef.current); }} className="w-5 h-5 flex items-center justify-center rounded hover:bg-[var(--hover)]">
                    {d ? <span className="w-2 h-2 rounded-full bg-[var(--fg)]" /> : <Pin size={11} className="rotate-45" />}
                  </button>
                ) : (
                  <button onClick={(e) => { e.stopPropagation(); ide.closeTab(p, indexRef.current); }} className={`w-5 h-5 flex items-center justify-center rounded hover:bg-[var(--hover)] ${d ? '' : active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {d ? <span className="w-2 h-2 rounded-full bg-[var(--fg)] group-hover:hidden" /> : null}
                    <X size={13} className={d ? 'hidden group-hover:block' : ''} />
                  </button>
                )}
              </div>
            );
          })}
          <div className={`flex-1 min-w-[40px] ${dropAt === '__end' ? 'shadow-[inset_2px_0_0_var(--accent)]' : ''}`} onDragOver={(e) => { e.preventDefault(); setDropAt('__end'); }} onDragLeave={() => setDropAt(null)} onDrop={(e) => onDropTab(e, null)} onDoubleClick={() => ide.execCommand('file.new')} />
        </div>
        <div className="flex items-center gap-0.5 px-1.5">
          {focused && <>
            <button title="Go Back (Alt+←)" onClick={ide.goBack} className="p-1 rounded text-[var(--muted)] hover:bg-[var(--hover)] hidden xl:block"><ArrowLeft size={14} /></button>
            <button title="Go Forward (Alt+→)" onClick={ide.goForward} className="p-1 rounded text-[var(--muted)] hover:bg-[var(--hover)] hidden xl:block"><ArrowRight size={14} /></button>
          </>}
          {runnable && (ide.running ? (
            <button title="Stop (Shift+F5)" onClick={ide.stop} className="p-1.5 rounded text-red-400 hover:bg-[var(--hover)] flex items-center gap-1"><Loader2 size={13} className="animate-spin" /><Square size={12} fill="currentColor" /></button>
          ) : (
            <button title={`Run ${lang?.name} File (F5)`} onClick={() => ide.run(path!)} className="p-1.5 rounded text-emerald-400 hover:bg-[var(--hover)]"><Play size={15} fill="currentColor" /></button>
          ))}
          {isFile && dirty(path!) && <button title="Compare with Saved" onClick={() => ide.openCompare({ label: basename(path!) + ' (saved)', path: path!, kind: 'saved' }, { label: basename(path!), path: path!, kind: 'file' })} className="p-1.5 rounded text-[var(--muted)] hover:bg-[var(--hover)]"><GitCompare size={14} /></button>}
          {isFile && ide.settings.localHistory && <button title="Local History" onClick={() => ide.execCommand('history.show')} className="p-1.5 rounded text-[var(--muted)] hover:bg-[var(--hover)]"><History size={14} /></button>}
          {isFile && canPreview(path!) && <button title="Toggle Preview (Ctrl+Shift+V)" onClick={() => ide.setPreviewPath(ide.previewPath ? null : path)} className={`p-1.5 rounded hover:bg-[var(--hover)] ${ide.previewPath ? 'text-[var(--accent)]' : 'text-[var(--muted)]'}`}><Eye size={15} /></button>}
          <button title="Split Editor Right (Ctrl+\)" onClick={ide.splitEditor} className="p-1.5 rounded text-[var(--muted)] hover:bg-[var(--hover)]"><Columns2 size={15} /></button>
          {ide.groups.length > 1 && <button title="Close Editor Group" onClick={() => ide.closeGroup(indexRef.current)} className="p-1.5 rounded text-[var(--muted)] hover:bg-[var(--hover)]"><X size={14} /></button>}
          <button title="More" onClick={(e) => { e.stopPropagation(); if (path) setMenu({ x: e.clientX - 200, y: e.clientY + 10, path }); }} className="p-1.5 rounded text-[var(--muted)] hover:bg-[var(--hover)]"><MoreHorizontal size={15} /></button>
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
          {crumbSyms.map((s, i) => (
            <span key={'s' + i} className="flex items-center gap-0.5 whitespace-nowrap min-w-0">
              <ChevronRight size={12} className="opacity-60 shrink-0" />
              <SymbolIcon kind={s.kind} />
              <span className="hover:text-[var(--fg)] cursor-pointer truncate" onClick={() => ide.revealAt(path!, s.line, s.col, s.line, s.col + s.name.length)}>{s.name}</span>
            </span>
          ))}
          <span className="ml-auto pl-3 text-[11px] opacity-70 whitespace-nowrap cursor-pointer hover:text-[var(--fg)]" title="Change Language Mode" onClick={() => ide.openPalette('language')}>{lang?.name}{lang && !lang.builtin ? ' · JotQoda grammar' : ''}</span>
        </div>
      )}

      <div className="flex-1 min-h-0 relative" onDragOver={(e) => { if (e.dataTransfer.types.includes('text/ide-tab') || e.dataTransfer.types.includes('text/ide-file')) e.preventDefault(); }} onDrop={(e) => onDropTab(e, null)}>
        {!path && <EmptyEditor />}
        {path === '__welcome__' && <Welcome />}
        {path?.startsWith('diff:') && (() => {
          const fp = path.slice(5);
          return (
            <DiffView
              key={'diff:' + fp}
              leftLabel="HEAD" rightLabel="Working Tree" original={ide.head[fp] ?? ''} modified={ide.files[fp] ?? ''} lang={toMonacoLang(getLang(fp).id)} modelKey={fp}
              actions={<><button className="underline text-[var(--accent)]" onClick={() => ide.openFile(fp)}>Open File</button><button className="underline text-[var(--muted)]" onClick={() => ide.discard(fp)}>Discard</button></>}
            />
          );
        })()}
        {path?.startsWith('cmp:') && (() => {
          const c = ide.compares[path.slice(4)];
          if (!c) return <div className="p-8 text-[var(--muted)]">This comparison is no longer available.</div>;
          const editablePath = c.right.kind === 'file' ? c.right.path : undefined;
          return (
            <DiffView
              key={'cmp:' + c.id}
              leftLabel={c.left.label} rightLabel={c.right.label} original={sideContent(ide, c.left)} modified={sideContent(ide, c.right)} lang={toMonacoLang(c.lang)} modelKey={c.id}
              editablePath={editablePath}
              actions={<>
                {c.left.kind === 'history' && c.left.path && c.left.content != null && <button className="underline text-[var(--accent)]" onClick={() => ide.writeFile(c.left.path!, c.left.content!, true)}>Restore This Version</button>}
                {c.right.path && <button className="underline text-[var(--muted)]" onClick={() => ide.openFile(c.right.path!)}>Open File</button>}
              </>}
            />
          );
        })()}
        {isFile && (
          <Editor
            path={'file:///' + path}
            defaultValue={ide.files[path!]}
            language={toMonacoLang(lang!.id)}
            theme={ide.settings.theme}
            options={options}
            beforeMount={setupMonaco}
            onMount={onMount}
            loading={<div className="flex items-center gap-2 text-[var(--muted)] text-sm"><Loader2 className="animate-spin" size={16} /> Loading Monaco engine…</div>}
            onChange={(v) => {
              const ed = ide.editors.current[indexRef.current];
              const uri = ed?.getModel()?.uri;
              if (uri && uri.scheme === 'file') ideRef.current?.writeFile(decodeURIComponent(uri.path.slice(1)), v ?? '');
            }}
          />
        )}
        {path && !isFile && !isSpecialTab(path) && <div className="p-8 text-[var(--muted)]">File not found: {path}</div>}
      </div>

      {menu && (
        <div className="fixed z-50 min-w-[220px] py-1 rounded-md shadow-2xl border border-[var(--border)] bg-[var(--side)] text-[13px] max-h-[80vh] overflow-auto" style={{ left: Math.max(4, Math.min(menu.x, window.innerWidth - 240)), top: Math.min(menu.y, window.innerHeight - 420) }}>
          {menuItems(menu.path).map((it, i) => it[0] === '-' ? <div key={i} className="my-1 border-t border-[var(--border)]" /> : (
            <button key={i} onClick={() => { (it as [string, () => void])[1](); setMenu(null); }} className="block w-full text-left px-4 py-1 hover:bg-[var(--accent)] hover:text-white">{it[0]}</button>
          ))}
          {ide.files[menu.path] != null && <div className="px-4 py-1 text-[11px] text-[var(--muted)] border-t border-[var(--border)] mt-1">{getLang(menu.path).name}{formatterName(getLang(menu.path), ide.settings) ? ` · formatter: ${formatterName(getLang(menu.path), ide.settings)}` : ''}</div>}
        </div>
      )}
    </div>
  );
}

function DiffView({ leftLabel, rightLabel, original, modified, lang, modelKey, actions, editablePath }: { leftLabel: string; rightLabel: string; original: string; modified: string; lang: string; modelKey: string; actions?: React.ReactNode; editablePath?: string }) {
  const ide = useIDE();
  const options = useEditorOptions();
  const [inline, setInline] = useState(false);
  const diffRef = useRef<any>(null);
  // @monaco-editor/react disposes the models before resetting the widget; keep them and dispose after unmount instead.
  const keyRef = useRef(modelKey);
  keyRef.current = modelKey;
  useEffect(() => () => {
    const m = ide.monaco;
    const d = diffRef.current;
    const key = keyRef.current;
    diffRef.current = null;
    setTimeout(() => {
      try { d?.setModel(null); } catch { /* already disposed */ }
      for (const scheme of ['diff-orig', 'diff-mod']) m?.editor.getModel(m.Uri.parse(`${scheme}:///${key}`))?.dispose();
    }, 0);
  }, []);
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 px-3 h-7 text-[12px] bg-[var(--side)] border-b border-[var(--border)] shrink-0">
        <span className="text-red-400 truncate">− {leftLabel}</span><span className="text-emerald-400 truncate">+ {rightLabel}</span>
        <span className="ml-auto" />
        <button className="text-[var(--muted)] hover:text-[var(--fg)]" title="Previous change" onClick={() => diffRef.current?.goToDiff?.('previous')}>↑</button>
        <button className="text-[var(--muted)] hover:text-[var(--fg)]" title="Next change" onClick={() => diffRef.current?.goToDiff?.('next')}>↓</button>
        <button className="underline text-[var(--muted)]" onClick={() => setInline((v) => !v)}>{inline ? 'Side by side' : 'Inline'}</button>
        {actions}
      </div>
      <div className="flex-1 min-h-0">
        <DiffEditor
          original={original}
          modified={modified}
          language={lang}
          theme={ide.settings.theme}
          beforeMount={setupMonaco}
          originalModelPath={'diff-orig:///' + modelKey}
          modifiedModelPath={'diff-mod:///' + modelKey}
          keepCurrentOriginalModel
          keepCurrentModifiedModel
          onMount={(ed: any) => {
            diffRef.current = ed;
            if (editablePath) {
              const m = ed.getModifiedEditor();
              m.onDidChangeModelContent(() => { const v = m.getValue(); if (ideRef.current?.files[editablePath] !== v) ideRef.current?.writeFile(editablePath, v); });
            }
          }}
          options={{ ...options, readOnly: !editablePath, renderSideBySide: !inline, originalEditable: false, glyphMargin: false, renderOverviewRuler: true, renderGutterMenu: false, renderMarginRevertIcon: false }}
        />
      </div>
    </div>
  );
}

function EmptyEditor() {
  const ide = useIDE();
  const rows: [string, string, string][] = [['Show All Commands', 'Ctrl+Shift+P', 'view.palette'], ['Go to File', 'Ctrl+P', 'view.quickOpen'], ['Go to Symbol in Workspace', 'Ctrl+Alt+O', 'go.workspaceSymbol'], ['New File', 'Ctrl+Alt+N', 'file.new'], ['Reopen Closed Editor', '', 'view.reopenClosed'], ['Toggle Terminal', 'Ctrl+`', 'view.terminal'], ['Find in Files', 'Ctrl+Shift+F', 'view.search']];
  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 select-none bg-[var(--bg)]">
      <Code2 className="text-7xl opacity-10" strokeWidth={1} />
      <div className="space-y-2 text-[13px]">
        {rows.map(([l, k, id]) => (
          <div key={l} className="flex gap-6 justify-between text-[var(--muted)] cursor-pointer hover:text-[var(--fg)]" onClick={() => ide.execCommand(id)}>
            <span>{l}</span>{k && <span className="font-mono text-[11px] px-1.5 rounded bg-[var(--input)]">{k}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
