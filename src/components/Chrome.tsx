import { useEffect, useState } from 'react';
import { Files, Search, GitBranch, Play, Wrench, Puzzle, Settings, Keyboard, Zap, PanelLeft, PanelBottom, Columns2, Eye, Command as CmdIcon } from 'lucide-react';
import { useIDE, basename, isSpecialTab, type SidebarView } from '../ide/types';
import { useChanges } from './GitView';
import { Kbd } from './FileIcon';

const MENUS: [string, (string | '-')[]][] = [
  ['File', ['file.new', 'file.newFolder', 'file.newFromLang', '-', 'file.new.ts', 'file.new.py', 'file.new.html', '-', 'file.openInPreview', 'file.save', 'file.saveAll', 'file.revert', '-', 'file.rename', 'file.duplicate', 'file.delete', 'file.download', 'file.upload', 'file.copyPath', 'file.copyContent', 'file.reveal', '-', 'workspace.import', 'workspace.export', '-', 'workspace.template', 'workspace.stats', '-', 'file.close', 'file.closeOthers', 'file.closeAll', 'workspace.reset']],
  ['Edit', ['editor.undo', 'editor.redo', '-', 'editor.find', 'editor.replace', 'view.search', '-', 'editor.comment', 'editor.blockComment', '-', 'editor.format', 'editor.formatSel', 'editor.trim', 'tx.trimTrailing', 'tx.trimBlankEnds', '-', 'insert.date', 'insert.uuid', 'insert.lorem', 'insert.template', 'insert.todo', 'insert.fixme', 'insert.separator', 'insert.banner']],
  ['Selection', ['editor.selectAll', 'editor.expand', 'editor.shrink', '-', 'editor.duplicate', 'editor.copyLineUp', 'editor.copyLineDown', 'editor.moveUp', 'editor.moveDown', 'editor.deleteLine', '-', 'editor.cursorAbove', 'editor.cursorBelow', 'editor.cursorsLineEnds', 'editor.toggleColumnSelection', 'editor.nextOcc', 'editor.selectOcc', '-', 'tx.upper', 'tx.lower', 'tx.sortAsc', 'tx.unique']],
  ['View', ['view.palette', 'view.quickOpen', '-', 'view.explorer', 'view.search', 'view.git', 'view.run', 'view.extensions', 'view.tools', 'view.snippets', '-', 'view.terminal', 'view.output', 'view.problems', 'view.todos', '-', 'view.split', 'view.preview', 'view.zen', 'view.fullscreen', '-', 'view.zoomIn', 'view.zoomOut', 'view.zoomReset', '-', 'view.minimap', 'view.wordWrap', 'view.stickyScroll', 'view.breadcrumbs', 'view.renderLineHighlight', 'view.renderWhitespace', 'view.autoClosingBrackets', 'view.smoothScrolling', 'view.formatOnPaste']],
  ['Go', ['view.quickOpen', 'view.gotoLine', 'view.gotoSymbol', '-', 'editor.gotoDef', 'editor.peekDef', 'editor.refs', 'editor.gotoBracket', '-', 'editor.nextProblem']],
  ['Run', ['run.run', 'run.selection', 'run.stop', '-', 'view.preview', 'run.clear', 'view.run']],
  ['Terminal', ['view.terminal', 'view.output', 'view.togglePanel']],
  ['Help', ['view.welcome', 'help.shortcuts', 'view.palette', 'settings.open', 'theme.select', 'pref.reset', '-', 'help.about']],
];

export function TitleBar() {
  const ide = useIDE();
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    const c = () => setOpen(null);
    window.addEventListener('click', c);
    return () => window.removeEventListener('click', c);
  }, []);
  const byId = Object.fromEntries(ide.commands.map((c) => [c.id, c]));
  const title = ide.activeFile ? (isSpecialTab(ide.activeFile) ? ide.activeFile.replace(/^diff:/, '').replace(/__/g, '') : basename(ide.activeFile)) : 'workspace';

  return (
    <div className="flex items-center h-[34px] bg-[var(--act)] border-b border-[var(--border)] text-[13px] shrink-0 select-none">
      <div className="flex items-center gap-1.5 px-3">
        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center"><Zap size={12} className="text-white" fill="white" /></div>
      </div>
      {MENUS.map(([name, items]) => (
        <div key={name} className="relative h-full">
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(open === name ? null : name); }}
            onMouseEnter={() => open && setOpen(name)}
            className={`px-2 h-full rounded-sm ${open === name ? 'bg-[var(--hover)]' : 'hover:bg-[var(--hover)]'} text-[var(--fg)]/90`}
          >{name}</button>
          {open === name && (
            <div className="absolute left-0 top-full z-50 min-w-[280px] py-1 rounded-md shadow-2xl border border-[var(--border)] bg-[var(--side)] max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
              {items.map((id, i) => {
                if (id === '-') return <div key={i} className="my-1 mx-2 border-t border-[var(--border)]" />;
                const c = byId[id];
                if (!c) return null;
                return (
                  <button key={id} onClick={() => { setOpen(null); c.run(); }} className="flex items-center w-full px-4 h-[26px] text-left hover:bg-[var(--accent)] hover:text-white gap-6">
                    <span className="flex-1 truncate">{c.label}</span>
                    {(c.key ?? c.hint) && <span className="text-[11px] opacity-60">{c.key ?? c.hint}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
      <div className="flex-1 flex justify-center px-4 min-w-0">
        <button onClick={() => ide.openPalette('files')} className="flex items-center gap-2 w-full max-w-[460px] h-[24px] px-3 rounded-md border border-[var(--border)] bg-[var(--input)] hover:border-[var(--muted)] text-[var(--muted)] text-[12px]">
          <Search size={13} /><span className="flex-1 text-center truncate">{title} — JotQoda</span><Kbd>Ctrl+P</Kbd>
        </button>
      </div>
      <div className="flex items-center gap-0.5 px-2 text-[var(--muted)]">
        {[
          [PanelLeft, 'Toggle Sidebar (Ctrl+B)', ide.sidebarOpen, () => ide.setSidebarOpen(!ide.sidebarOpen)],
          [PanelBottom, 'Toggle Panel (Ctrl+J)', ide.panelOpen, () => ide.setPanelOpen(!ide.panelOpen)],
          [Columns2, 'Split Editor', ide.groups.length > 1, ide.splitEditor],
          [Eye, 'Toggle Preview', !!ide.previewPath, () => ide.setPreviewPath(ide.previewPath ? null : ide.activeFile)],
          [CmdIcon, 'Command Palette', false, () => ide.openPalette('commands')],
        ].map(([I, t, a, fn]: any, i) => (
          <button key={i} title={t} onClick={fn} className={`p-1.5 rounded hover:bg-[var(--hover)] ${a ? 'text-[var(--fg)]' : ''}`}><I size={15} /></button>
        ))}
      </div>
    </div>
  );
}

export function ActivityBar() {
  const ide = useIDE();
  const changes = useChanges();
  const errors = ide.problems.filter((p) => p.severity === 'error').length;
  const items: [SidebarView, any, string, number?][] = [
    ['explorer', Files, 'Explorer (Ctrl+Shift+E)'],
    ['search', Search, 'Search (Ctrl+Shift+F)'],
    ['git', GitBranch, 'Source Control (Ctrl+Shift+G)', changes.length],
    ['run', Play, 'Run & Debug (Ctrl+Shift+D)', errors],
    ['tools', Wrench, 'Developer Tools (Ctrl+Shift+T)'],
    ['snippets', Zap, 'Snippets (Ctrl+Shift+S)'],
    ['extensions', Puzzle, 'Extensions (Ctrl+Shift+X)'],
  ];
  return (
    <div className="w-12 flex flex-col items-center bg-[var(--act)] border-r border-[var(--border)] shrink-0 py-1">
      {items.map(([v, I, t, badge]) => {
        const active = ide.sidebarOpen && ide.sidebarView === v;
        return (
          <button key={v} title={t} onClick={() => { if (active) ide.setSidebarOpen(false); else { ide.setSidebarView(v); ide.setSidebarOpen(true); } }} className={`relative w-12 h-12 flex items-center justify-center ${active ? 'text-[var(--fg)]' : 'text-[var(--muted)] hover:text-[var(--fg)]'}`}>
            {active && <span className="absolute left-0 top-2 bottom-2 w-[2px] bg-[var(--accent)]" />}
            <I size={23} strokeWidth={1.5} />
            {!!badge && <span className={`absolute bottom-2 right-2 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center text-white ${v === 'run' ? 'bg-red-500' : 'bg-[var(--accent)]'}`}>{badge > 99 ? '99+' : badge}</span>}
          </button>
        );
      })}
      <div className="flex-1" />
      <button title="Keyboard Shortcuts" onClick={() => ide.setShortcutsOpen(true)} className="w-12 h-12 flex items-center justify-center text-[var(--muted)] hover:text-[var(--fg)]"><Keyboard size={22} strokeWidth={1.5} /></button>
      <button title="Settings (Ctrl+,)" onClick={() => ide.setSettingsOpen(true)} className="w-12 h-12 flex items-center justify-center text-[var(--muted)] hover:text-[var(--fg)]"><Settings size={22} strokeWidth={1.5} /></button>
    </div>
  );
}
