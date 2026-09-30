import type { Command, IDE, SidebarView, QuickPickItem } from './types';
import { DEFAULT_SETTINGS, basename } from './types';
import { getLang, getLangById, LANGUAGES, RUNNABLE_LANGS } from './languages';
import { historyStats, clearAllHistory, historyPaths } from './history';
import { THEMES } from './themes';
import { WORKSPACE_TEMPLATES, FILE_TEMPLATES } from './templates';
import { cases, lorem } from '../components/ToolsView';
import { download } from '../components/Explorer';

interface Ctx {
  zen: boolean;
  setZen: (b: boolean) => void;
  importWorkspace: () => void;
  uploadFiles: () => void;
}

export function buildCommands(ide: IDE, ctx: Ctx): Command[] {
  const ed = () => {
    const e = ide.getEditor();
    if (!e) ide.toast('No active editor', 'warn');
    return e;
  };
  const trig = (id: string) => () => { const e = ed(); if (!e) return; e.focus(); e.trigger('jotqoda', id, null); };
  const transform = (fn: (s: string) => string, wholeIfEmpty = false) => () => {
    const e = ed(); if (!e) return;
    const model = e.getModel();
    const sels = e.getSelections();
    const edits = sels.map((s: any) => {
      let range = s;
      if (s.isEmpty()) {
        if (wholeIfEmpty) range = model.getFullModelRange();
        else { const w = model.getWordAtPosition(s.getPosition()); if (!w) return null; range = { startLineNumber: s.startLineNumber, endLineNumber: s.startLineNumber, startColumn: w.startColumn, endColumn: w.endColumn }; }
      }
      try { return { range, text: fn(model.getValueInRange(range)) }; } catch (err: any) { ide.toast(err.message, 'error'); return null; }
    }).filter(Boolean);
    e.pushUndoStop(); e.executeEdits('jotqoda', edits); e.pushUndoStop(); e.focus();
  };
  const lines = (fn: (l: string[]) => string[]) => transform((s) => fn(s.split('\n')).join('\n'), true);
  const insert = (fn: () => string) => () => { const e = ed(); if (!e) return; e.executeEdits('jotqoda', [{ range: e.getSelection(), text: fn(), forceMoveMarkers: true }]); e.focus(); };
  const view = (v: SidebarView) => () => {
    if (ide.sidebarOpen && ide.sidebarView === v) ide.setSidebarOpen(false);
    else { ide.setSidebarView(v); ide.setSidebarOpen(true); }
  };
  const setFont = (n: number) => ide.setSetting('fontSize', Math.max(8, Math.min(40, n)));
  const toggle = (k: any, label: string) => () => { const v = !(ide.settings as any)[k]; ide.setSetting(k, v as any); ide.toast(`${label}: ${v ? 'On' : 'Off'}`); };
  const newFile = async (ext?: string) => {
    const name = await ide.prompt('New file name (use / for folders)', ext ? `untitled.${ext}` : '', 'e.g. src/app.ts');
    if (name) ide.createFile(name.trim(), undefined, true);
  };
  const activeLang = () => {
    const f = ide.activeFile;
    if (!f || ide.files[f] == null) return null;
    return ide.langOverride[f] ? getLangById(ide.langOverride[f]) : getLang(f, ide.files[f]);
  };
  const commentPrefix = () => {
    const l = activeLang();
    if (l?.comment) return l.comment + ' ';
    if (l?.block) return l.block[0] + ' ';
    return '// ';
  };
  const commentSuffix = () => { const l = activeLang(); return !l?.comment && l?.block ? ' ' + l.block[1] : ''; };
  const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
  const bookmarkJump = (dir: 1 | -1) => {
    const list = [...ide.bookmarks].sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line);
    if (!list.length) return ide.toast('No bookmarks — Ctrl+Alt+K toggles one', 'info');
    const f = ide.activeFile ?? '';
    const line = ide.cursor.line;
    const idx = list.findIndex((b) => (dir > 0 ? b.path > f || (b.path === f && b.line > line) : false));
    let target;
    if (dir > 0) target = idx >= 0 ? list[idx] : list[0];
    else { const before = list.filter((b) => b.path < f || (b.path === f && b.line < line)); target = before.length ? before[before.length - 1] : list[list.length - 1]; }
    ide.revealAt(target.path, target.line);
  };
  const pickFile = async (placeholder: string, exclude?: string) => {
    const items: QuickPickItem[] = Object.keys(ide.files).filter((p) => p !== exclude).sort().map((p) => ({ id: p, label: basename(p), description: p }));
    return (await ide.quickPick(items, placeholder))?.id ?? null;
  };
  const showHistory = async () => {
    const f = requireFile();
    if (!f) return;
    const entries = ide.historyOf(f);
    if (!entries.length) return ide.toast(ide.settings.localHistory ? `No local history for ${basename(f)} yet — save the file to create a snapshot` : 'Local History is disabled in Settings', 'info');
    const pick = await ide.quickPick(entries.map((e) => ({ id: e.id, label: `${e.source} · ${new Date(e.time).toLocaleString()}`, description: `${e.content.split('\n').length} lines` })), `Local history of ${basename(f)} — pick a snapshot to compare`);
    const e = entries.find((x) => x.id === pick?.id);
    if (e) ide.openCompare({ label: `${basename(f)} (${new Date(e.time).toLocaleTimeString()})`, path: f, kind: 'history', content: e.content }, { label: basename(f), path: f, kind: 'file' });
  };
  const activeExt = () => {
    const f = ide.activeFile ?? '';
    const i = f.lastIndexOf('.');
    return i > f.lastIndexOf('/') ? f.slice(i + 1) : '';
  };
  const requireFile = () => {
    const f = ide.activeFile;
    if (!f || ide.files[f] == null) { ide.toast('Open a file first', 'warn'); return null; }
    return f;
  };

  const C: Command[] = [
    { id: 'file.new', label: 'New File…', category: 'File', key: 'Ctrl+Alt+N', run: () => newFile() },
    { id: 'file.newFolder', label: 'New Folder…', category: 'File', run: async () => { const n = await ide.prompt('New folder name', '', 'e.g. src/components'); if (n) ide.createFolder(n.trim()); } },
    { id: 'file.save', label: 'Save', category: 'File', key: 'Ctrl+S', run: () => ide.saveFile() },
    { id: 'file.saveAll', label: 'Save All', category: 'File', key: 'Ctrl+Alt+S', run: () => ide.saveAll() },
    { id: 'file.close', label: 'Close Editor', category: 'File', key: 'Alt+W', run: () => ide.activeFile && ide.closeTab(ide.activeFile) },
    { id: 'file.closeAll', label: 'Close All Editors', category: 'File', key: 'Alt+Shift+W', run: () => ide.closeAll() },
    { id: 'file.rename', label: 'Rename Active File…', category: 'File', hint: 'F2 (explorer)', run: async () => { const f = ide.activeFile; if (!f || ide.files[f] == null) return; const n = await ide.prompt('Rename to', f); if (n && n !== f) ide.renamePath(f, n.trim()); } },
    { id: 'file.duplicate', label: 'Duplicate Active File', category: 'File', run: () => { const f = ide.activeFile; if (!f || ide.files[f] == null) return; const i = f.lastIndexOf('.'); ide.createFile(i > 0 ? f.slice(0, i) + '-copy' + f.slice(i) : f + '-copy', ide.files[f], true); } },
    { id: 'file.delete', label: 'Delete Active File', category: 'File', run: () => ide.activeFile && ide.files[ide.activeFile] != null && ide.deletePath(ide.activeFile) },
    { id: 'file.download', label: 'Download Active File', category: 'File', run: () => { const f = ide.activeFile; if (f && ide.files[f] != null) download(f.split('/').pop()!, ide.files[f]); } },
    { id: 'file.upload', label: 'Upload Files…', category: 'File', run: ctx.uploadFiles },
    { id: 'file.copyPath', label: 'Copy Path of Active File', category: 'File', run: () => { navigator.clipboard.writeText(ide.activeFile ?? ''); ide.toast('Path copied'); } },
    { id: 'file.revert', label: 'Revert File to Last Save', category: 'File', run: () => { const f = ide.activeFile; if (f && ide.saved[f] != null) ide.writeFile(f, ide.saved[f], true); } },
    { id: 'file.reveal', label: 'Reveal Active File in Explorer', category: 'File', run: () => { if (requireFile()) { ide.setSidebarView('explorer'); ide.setSidebarOpen(true); } } },
    { id: 'file.closeOthers', label: 'Close Other Editors', category: 'File', run: () => { const f = requireFile(); if (f) ide.closeOthers(f, ide.activeGroup); } },
    { id: 'file.copyContent', label: 'Copy Content of Active File', category: 'File', run: () => { const f = requireFile(); if (f) { navigator.clipboard.writeText(ide.files[f]); ide.toast('File content copied'); } } },
    { id: 'file.openInPreview', label: 'Open Active File in Live Preview', category: 'File', run: () => { const f = requireFile(); if (f) ide.setPreviewPath(f); } },
    { id: 'file.newFromLang', label: 'New File Using Active Language', category: 'File', run: () => newFile(activeExt()) },
    { id: 'file.createSibling', label: 'Create File Next to Active File…', category: 'File', run: async () => { const f = requireFile(); if (!f) return; const base = f.slice(0, f.lastIndexOf('/') + 1); const n = await ide.prompt('New file name', '', 'e.g. helper.ts'); if (n) ide.createFile(base + n.trim(), undefined, true); } },
    ...['ts', 'js', 'py', 'html', 'css', 'md', 'json', 'sql'].map((ext) => ({ id: 'file.new.' + ext, label: `New ${ext.toUpperCase()} File…`, category: 'File', run: () => newFile(ext) })),
    { id: 'workspace.export', label: 'Export Workspace (JSON)', category: 'Workspace', run: () => { download('workspace.jotqoda.json', JSON.stringify({ files: ide.files, folders: ide.folders }, null, 2), 'application/json'); ide.toast('Workspace exported', 'success'); } },
    { id: 'workspace.import', label: 'Import Workspace (JSON or ZIP)…', category: 'Workspace', run: ctx.importWorkspace },
    { id: 'workspace.downloadZip', label: 'Download Workspace as ZIP', category: 'Workspace', run: () => ide.downloadZip() },
    { id: 'workspace.importZip', label: 'Import ZIP Archive…', category: 'Workspace', run: () => ide.importZip() },
    { id: 'workspace.openFolder', label: 'Open Local Folder… (replaces workspace)', category: 'Workspace', run: () => ide.importFolder() },
    { id: 'workspace.template', label: 'Load Template…', category: 'Workspace', run: () => ide.openPalette('template') },
    ...Object.entries(WORKSPACE_TEMPLATES).map(([k, t]) => ({ id: 'template.' + k, label: `Load Template: ${t.name}`, category: 'Workspace', run: () => { if (Object.keys(ide.files).length && !confirm(`Replace current workspace with "${t.name}"?`)) return; ide.loadWorkspace(structuredClone(t.ws.files), [...t.ws.folders]); ide.toast(`Loaded ${t.name}`, 'success'); } })),
    { id: 'workspace.reset', label: 'Reset Everything (factory)', category: 'Workspace', run: () => { if (confirm('Erase all files, history and settings?')) { localStorage.removeItem('jotqoda-v1'); location.reload(); } } },
    { id: 'workspace.stats', label: 'Show Workspace Statistics', category: 'Workspace', run: () => { const fs = Object.values(ide.files); ide.log('info', `${fs.length} files · ${ide.folders.length} folders · ${fs.reduce((a, c) => a + c.split('\n').length, 0)} lines · ${(fs.reduce((a, c) => a + c.length, 0) / 1024).toFixed(1)} KB · ${ide.commits.length} commits`); ide.setPanelOpen(true); ide.setPanelTab('output'); } },
    { id: 'view.palette', label: 'Show All Commands', category: 'View', key: 'Ctrl+Shift+P', run: () => ide.openPalette('commands') },
    { id: 'view.paletteF1', label: 'Command Palette (F1)', category: 'View', key: 'F1', run: () => ide.openPalette('commands') },
    { id: 'view.quickOpen', label: 'Go to File…', category: 'View', key: 'Ctrl+P', run: () => ide.openPalette('files') },
    { id: 'view.gotoLine', label: 'Go to Line…', category: 'Go', key: 'Ctrl+G', run: () => ide.openPalette('line') },
    { id: 'view.gotoSymbol', label: 'Go to Symbol in Editor…', category: 'Go', hint: 'Ctrl+Shift+O', run: () => ide.openPalette('symbols') },
    { id: 'go.workspaceSymbol', label: 'Go to Symbol in Workspace…', category: 'Go', key: 'Ctrl+Alt+O', run: () => ide.openPalette('workspaceSymbols') },
    { id: 'go.back', label: 'Go Back', category: 'Go', key: IS_MAC ? undefined : 'Alt+ArrowLeft', run: () => ide.goBack() },
    { id: 'go.forward', label: 'Go Forward', category: 'Go', key: IS_MAC ? undefined : 'Alt+ArrowRight', run: () => ide.goForward() },
    { id: 'view.reopenClosed', label: 'Reopen Closed Editor', category: 'View', run: () => ide.reopenClosed() },
    { id: 'view.pinEditor', label: 'Pin / Unpin Editor', category: 'View', run: () => { const f = ide.activeFile; if (f) ide.togglePin(f, ide.activeGroup); } },
    { id: 'view.closeToRight', label: 'Close Editors to the Right', category: 'View', run: () => { const f = ide.activeFile; if (f) ide.closeToRight(f, ide.activeGroup); } },
    { id: 'view.closeSaved', label: 'Close Saved Editors', category: 'View', run: () => ide.closeSaved() },
    { id: 'view.closeGroup', label: 'Close Editor Group', category: 'View', run: () => ide.closeGroup(ide.activeGroup) },
    { id: 'view.joinGroups', label: 'Join All Editor Groups', category: 'View', run: () => ide.joinGroups() },
    ...[0, 1, 2, 3].map((i) => ({ id: `view.focusGroup${i + 1}`, label: `Focus Editor Group ${i + 1}`, category: 'View', run: () => { if (i < ide.groups.length) { ide.setActiveGroup(i); setTimeout(() => ide.editors.current[i]?.focus?.(), 0); } else ide.toast(`Editor group ${i + 1} does not exist`, 'info'); } })),
    { id: 'view.moveEditorNext', label: 'Move Editor into Next Group', category: 'View', run: () => { const f = ide.activeFile; if (f) ide.moveTab(f, ide.activeGroup, ide.activeGroup + 1); } },
    { id: 'view.moveEditorPrev', label: 'Move Editor into Previous Group', category: 'View', run: () => { const f = ide.activeFile; if (f && ide.activeGroup > 0) ide.moveTab(f, ide.activeGroup, ide.activeGroup - 1); } },
    { id: 'view.bookmarks', label: 'Show Bookmarks', category: 'View', run: view('bookmarks') },
    { id: 'view.languages', label: 'Show Supported Languages & Runtimes', category: 'Help', run: () => { ide.setSidebarView('extensions'); ide.setSidebarOpen(true); } },
    { id: 'view.toggleSidebar', label: 'Toggle Primary Sidebar', category: 'View', key: 'Ctrl+B', run: () => ide.setSidebarOpen(!ide.sidebarOpen) },
    { id: 'view.togglePanel', label: 'Toggle Panel', category: 'View', key: 'Ctrl+J', run: () => ide.setPanelOpen(!ide.panelOpen) },
    { id: 'view.terminal', label: 'Toggle Terminal', category: 'View', key: 'Ctrl+`', run: () => { if (ide.panelOpen && ide.panelTab === 'terminal') ide.setPanelOpen(false); else { ide.setPanelOpen(true); ide.setPanelTab('terminal'); } } },
    { id: 'view.output', label: 'Show Output', category: 'View', key: 'Ctrl+Shift+U', run: () => { ide.setPanelOpen(true); ide.setPanelTab('output'); } },
    { id: 'view.problems', label: 'Show Problems', category: 'View', key: 'Ctrl+Shift+M', run: () => { ide.setPanelOpen(true); ide.setPanelTab('problems'); } },
    { id: 'view.todos', label: 'Show TODOs', category: 'View', run: () => { ide.setPanelOpen(true); ide.setPanelTab('todos'); } },
    { id: 'view.explorer', label: 'Show Explorer', category: 'View', key: 'Ctrl+Shift+E', run: view('explorer') },
    { id: 'view.search', label: 'Search in Files', category: 'View', key: 'Ctrl+Shift+F', run: () => { ide.setSidebarView('search'); ide.setSidebarOpen(true); } },
    { id: 'view.git', label: 'Show Source Control', category: 'View', key: 'Ctrl+Shift+G', run: view('git') },
    { id: 'view.run', label: 'Show Run & Debug', category: 'View', key: 'Ctrl+Shift+D', run: view('run') },
    { id: 'view.extensions', label: 'Show Extensions', category: 'View', key: 'Ctrl+Shift+X', run: view('extensions') },
    { id: 'view.tools', label: 'Show Developer Tools', category: 'View', key: 'Ctrl+Shift+T', run: view('tools') },
    { id: 'view.snippets', label: 'Show Snippets', category: 'View', key: 'Ctrl+Shift+S', run: view('snippets') },
    { id: 'view.split', label: 'Split Editor Right', category: 'View', key: 'Ctrl+\\', run: () => ide.splitEditor() },
    { id: 'view.zen', label: 'Toggle Zen Mode', category: 'View', key: 'Ctrl+Alt+Z', run: () => ctx.setZen(!ctx.zen) },
    { id: 'view.fullscreen', label: 'Toggle Full Screen', category: 'View', key: 'Shift+F11', run: () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()) },
    { id: 'view.preview', label: 'Toggle Live Preview', category: 'View', key: 'Ctrl+Shift+V', run: () => ide.setPreviewPath(ide.previewPath ? null : ide.activeFile) },
    { id: 'view.zoomIn', label: 'Zoom In', category: 'View', key: 'Ctrl+=', run: () => setFont(ide.settings.fontSize + 1) },
    { id: 'view.zoomOut', label: 'Zoom Out', category: 'View', key: 'Ctrl+-', run: () => setFont(ide.settings.fontSize - 1) },
    { id: 'view.zoomReset', label: 'Reset Zoom', category: 'View', key: 'Ctrl+0', run: () => setFont(14) },
    { id: 'view.minimap', label: 'Toggle Minimap', category: 'View', run: toggle('minimap', 'Minimap') },
    { id: 'view.wordWrap', label: 'Toggle Word Wrap', category: 'View', key: 'Alt+Z', run: toggle('wordWrap', 'Word wrap') },
    { id: 'view.whitespace', label: 'Toggle Render Whitespace', category: 'View', run: () => ide.setSetting('renderWhitespace', ide.settings.renderWhitespace === 'all' ? 'none' : 'all') },
    { id: 'view.lineNumbers', label: 'Cycle Line Numbers (on/relative/off)', category: 'View', run: () => ide.setSetting('lineNumbers', ({ on: 'relative', relative: 'off', off: 'on' } as const)[ide.settings.lineNumbers]) },
    { id: 'view.stickyScroll', label: 'Toggle Sticky Scroll', category: 'View', run: toggle('stickyScroll', 'Sticky scroll') },
    { id: 'view.breadcrumbs', label: 'Toggle Breadcrumbs', category: 'View', run: toggle('showBreadcrumbs', 'Breadcrumbs') },
    { id: 'view.autoClosingBrackets', label: 'Toggle Auto Closing Brackets', category: 'View', run: toggle('autoClosingBrackets', 'Auto closing brackets') },
    { id: 'view.smoothScrolling', label: 'Toggle Smooth Scrolling', category: 'View', run: toggle('smoothScrolling', 'Smooth scrolling') },
    { id: 'view.smoothCaret', label: 'Toggle Smooth Caret', category: 'View', run: toggle('smoothCaret', 'Smooth caret') },
    { id: 'view.scrollBeyondLastLine', label: 'Toggle Scroll Beyond Last Line', category: 'View', run: toggle('scrollBeyondLastLine', 'Scroll beyond last line') },
    { id: 'view.formatOnPaste', label: 'Toggle Format on Paste', category: 'View', run: toggle('formatOnPaste', 'Format on paste') },
    { id: 'view.quickSuggestions', label: 'Toggle Quick Suggestions', category: 'View', run: toggle('quickSuggestions', 'Quick suggestions') },
    { id: 'view.renderLineHighlight', label: 'Cycle Current Line Highlight', category: 'View', run: () => ide.setSetting('renderLineHighlight', ({ all: 'line', line: 'none', none: 'gutter', gutter: 'all' } as const)[ide.settings.renderLineHighlight]) },
    { id: 'view.cursorBlinking', label: 'Cycle Cursor Blinking', category: 'View', run: () => ide.setSetting('cursorBlinking', ({ blink: 'smooth', smooth: 'phase', phase: 'expand', expand: 'solid', solid: 'blink' } as const)[ide.settings.cursorBlinking]) },
    { id: 'view.renderWhitespace', label: 'Cycle Render Whitespace', category: 'View', run: () => ide.setSetting('renderWhitespace', ({ none: 'boundary', boundary: 'all', all: 'none' } as const)[ide.settings.renderWhitespace]) },
    { id: 'view.welcome', label: 'Show Welcome Page', category: 'Help', run: () => ide.openFile('__welcome__') },
    { id: 'editor.format', label: 'Format Document', category: 'Editor', key: 'Shift+Alt+F', run: () => { ide.formatDocument().then((ok) => ok && ide.toast('Document formatted', 'success')); } },
    { id: 'editor.formatMonaco', label: 'Format Document (Monaco built-in formatter)', category: 'Editor', run: trig('editor.action.formatDocument') },
    { id: 'editor.changeIndent', label: 'Change Indentation…', category: 'Editor', run: async () => {
      const pick = await ide.quickPick([
        { id: 'spaces', label: 'Indent Using Spaces', description: ide.settings.insertSpaces ? 'current' : '' },
        { id: 'tabs', label: 'Indent Using Tabs', description: !ide.settings.insertSpaces ? 'current' : '' },
        ...[2, 4, 8].map((n) => ({ id: 'size' + n, label: `Tab Display Size: ${n}`, description: ide.settings.tabSize === n ? 'current' : '' })),
        { id: 'toSpaces', label: 'Convert Indentation to Spaces' },
        { id: 'toTabs', label: 'Convert Indentation to Tabs' },
        { id: 'detect', label: 'Detect Indentation from Content' },
      ], 'Select indentation action');
      if (!pick) return;
      if (pick.id === 'spaces') ide.setSetting('insertSpaces', true);
      else if (pick.id === 'tabs') ide.setSetting('insertSpaces', false);
      else if (pick.id?.startsWith('size')) ide.setSetting('tabSize', +pick.id.slice(4));
      else if (pick.id === 'toSpaces') trig('editor.action.indentationToSpaces')();
      else if (pick.id === 'toTabs') trig('editor.action.indentationToTabs')();
      else if (pick.id === 'detect') { const e = ed(); if (!e) return; const text = e.getValue(); const tabs = (text.match(/^\t/gm) ?? []).length; const sp = text.match(/^ +(?=\S)/gm) ?? []; const g = sp.length ? sp.map((x: string) => x.length).reduce((a: number, b: number) => { const gcd = (x: number, y: number): number => (y ? gcd(y, x % y) : x); return gcd(a, b); }) : 0; if (tabs > sp.length) { ide.setSetting('insertSpaces', false); ide.toast('Detected: tabs'); } else if (g) { ide.setSetting('insertSpaces', true); ide.setSetting('tabSize', Math.min(8, g)); ide.toast(`Detected: ${Math.min(8, g)} spaces`); } else ide.toast('Could not detect indentation', 'info'); }
    } },
    { id: 'editor.changeEol', label: 'Change End of Line Sequence…', category: 'Editor', run: async () => {
      const e = ed(); if (!e) return;
      const cur = e.getModel().getEOL() === '\r\n' ? 'CRLF' : 'LF';
      const pick = await ide.quickPick([{ id: 'LF', label: 'LF', description: cur === 'LF' ? 'current' : 'Unix / macOS' }, { id: 'CRLF', label: 'CRLF', description: cur === 'CRLF' ? 'current' : 'Windows' }], 'Select End of Line Sequence');
      if (pick && pick.id !== cur) { e.getModel().pushEOL(pick.id === 'CRLF' ? 1 : 0); ide.toast(`Line endings: ${pick.id}`); }
    } },
    { id: 'editor.toggleBookmark', label: 'Toggle Bookmark', category: 'Bookmarks', key: 'Ctrl+Alt+K', run: () => ide.toggleBookmark() },
    { id: 'editor.nextBookmark', label: 'Go to Next Bookmark', category: 'Bookmarks', key: 'Ctrl+Alt+L', run: () => bookmarkJump(1) },
    { id: 'editor.prevBookmark', label: 'Go to Previous Bookmark', category: 'Bookmarks', key: 'Ctrl+Alt+J', run: () => bookmarkJump(-1) },
    { id: 'editor.clearBookmarks', label: 'Clear Bookmarks in Active File', category: 'Bookmarks', run: () => ide.clearBookmarks(ide.activeFile ?? undefined) },
    { id: 'editor.clearAllBookmarks', label: 'Clear All Bookmarks', category: 'Bookmarks', run: () => ide.clearBookmarks() },
    { id: 'compare.saved', label: 'Compare Active File with Saved', category: 'Compare', run: () => { const f = requireFile(); if (f) ide.openCompare({ label: basename(f) + ' (saved)', path: f, kind: 'saved' }, { label: basename(f), path: f, kind: 'file' }); } },
    { id: 'compare.head', label: 'Compare Active File with HEAD (last commit)', category: 'Compare', run: () => { const f = requireFile(); if (f) ide.openCompare({ label: basename(f) + ' (HEAD)', path: f, kind: 'head' }, { label: basename(f), path: f, kind: 'file' }); } },
    { id: 'compare.file', label: 'Compare Active File With…', category: 'Compare', run: async () => { const f = requireFile(); if (!f) return; const o = await pickFile(`Compare ${basename(f)} with…`, f); if (o) ide.openCompare({ label: basename(o), path: o, kind: 'file' }, { label: basename(f), path: f, kind: 'file' }); } },
    { id: 'compare.clipboard', label: 'Compare Active File with Clipboard', category: 'Compare', run: async () => { const f = requireFile(); if (!f) return; try { const t = await navigator.clipboard.readText(); ide.openCompare({ label: 'Clipboard', kind: 'text', content: t }, { label: basename(f), path: f, kind: 'file' }); } catch { ide.toast('Clipboard access was denied by the browser', 'error'); } } },
    { id: 'compare.two', label: 'Compare Two Files…', category: 'Compare', run: async () => { const a = await pickFile('Select the first (left) file'); if (!a) return; const b = await pickFile('Select the second (right) file', a); if (b) ide.openCompare({ label: basename(a), path: a, kind: 'file' }, { label: basename(b), path: b, kind: 'file' }); } },
    { id: 'history.show', label: 'Local History: Show Snapshots of Active File…', category: 'Local History', run: showHistory },
    { id: 'history.snapshot', label: 'Local History: Create Snapshot Now', category: 'Local History', run: () => { const f = requireFile(); if (f) { ide.snapshot(f, 'Manual snapshot'); ide.toast('Snapshot created', 'success'); } } },
    { id: 'history.restoreLatest', label: 'Local History: Restore Previous Snapshot', category: 'Local History', run: () => { const f = requireFile(); if (!f) return; const e = ide.historyOf(f).find((x) => x.content !== ide.files[f]); if (!e) return ide.toast('No earlier snapshot differs from the current content', 'info'); ide.restoreSnapshot(f, e.id); } },
    { id: 'history.restoreDeleted', label: 'Local History: Restore Deleted File…', category: 'Local History', run: async () => {
      const gone = historyPaths().filter((p) => ide.files[p] == null).sort();
      if (!gone.length) return ide.toast('Local History has no snapshots of deleted files', 'info');
      const pick = await ide.quickPick(gone.map((p) => { const e = ide.historyOf(p)[0]; return { id: p, label: basename(p), description: `${p} · ${e ? new Date(e.time).toLocaleString() : ''}` }; }), 'Select a deleted file to restore (latest snapshot)');
      const e = pick?.id ? ide.historyOf(pick.id)[0] : undefined;
      if (pick?.id && e) ide.restoreSnapshot(pick.id, e.id);
    } },
    { id: 'history.clearFile', label: 'Local History: Delete Snapshots of Active File', category: 'Local History', run: () => { const f = requireFile(); if (f && confirm(`Delete all local history of ${f}?`)) ide.deleteSnapshot(f); } },
    { id: 'history.clearAll', label: 'Local History: Delete All Snapshots', category: 'Local History', run: () => { const st = historyStats(); if (confirm(`Delete ${st.snapshots} snapshot(s) of ${st.files} file(s)?`)) { clearAllHistory(); ide.toast('Local history cleared'); } } },
    { id: 'history.stats', label: 'Local History: Show Storage Usage', category: 'Local History', run: () => { const st = historyStats(); ide.toast(`${st.snapshots} snapshot(s) · ${st.files} file(s) · ${(st.chars / 1024).toFixed(0)} KB`, 'info'); } },
    { id: 'editor.formatSel', label: 'Format Selection', category: 'Editor', run: trig('editor.action.formatSelection') },
    { id: 'editor.find', label: 'Find', category: 'Edit', hint: 'Ctrl+F', run: trig('actions.find') },
    { id: 'editor.replace', label: 'Replace', category: 'Edit', hint: 'Ctrl+H', run: trig('editor.action.startFindReplaceAction') },
    { id: 'editor.undo', label: 'Undo', category: 'Edit', hint: 'Ctrl+Z', run: trig('undo') },
    { id: 'editor.redo', label: 'Redo', category: 'Edit', hint: 'Ctrl+Y', run: trig('redo') },
    { id: 'editor.selectAll', label: 'Select All', category: 'Edit', hint: 'Ctrl+A', run: trig('editor.action.selectAll') },
    { id: 'editor.comment', label: 'Toggle Line Comment', category: 'Editor', hint: 'Ctrl+/', run: trig('editor.action.commentLine') },
    { id: 'editor.blockComment', label: 'Toggle Block Comment', category: 'Editor', hint: 'Shift+Alt+A', run: trig('editor.action.blockComment') },
    { id: 'editor.foldAll', label: 'Fold All', category: 'Editor', run: trig('editor.foldAll') },
    { id: 'editor.unfoldAll', label: 'Unfold All', category: 'Editor', run: trig('editor.unfoldAll') },
    { id: 'editor.foldComments', label: 'Fold All Block Comments', category: 'Editor', run: trig('editor.foldAllBlockComments') },
    { id: 'editor.duplicate', label: 'Duplicate Line / Selection', category: 'Editor', hint: 'Shift+Alt+↓', run: trig('editor.action.copyLinesDownAction') },
    { id: 'editor.copyLineUp', label: 'Copy Line Up', category: 'Editor', hint: 'Shift+Alt+↑', run: trig('editor.action.copyLinesUpAction') },
    { id: 'editor.copyLineDown', label: 'Copy Line Down', category: 'Editor', hint: 'Shift+Alt+↓', run: trig('editor.action.copyLinesDownAction') },
    { id: 'editor.toggleTabFocus', label: 'Toggle Tab Focus Mode', category: 'Editor', run: trig('editor.action.toggleTabFocusMode') },
    { id: 'editor.toggleColumnSelection', label: 'Toggle Column Selection Mode', category: 'Selection', hint: 'Shift+Alt+drag', run: trig('editor.action.toggleColumnSelection') },
    { id: 'editor.gotoBracket', label: 'Go to Bracket', category: 'Go', run: trig('editor.action.goToBracket') },
    { id: 'editor.deleteLine', label: 'Delete Line', category: 'Editor', hint: 'Ctrl+Shift+K', run: trig('editor.action.deleteLines') },
    { id: 'editor.moveUp', label: 'Move Line Up', category: 'Editor', hint: 'Alt+↑', run: trig('editor.action.moveLinesUpAction') },
    { id: 'editor.moveDown', label: 'Move Line Down', category: 'Editor', hint: 'Alt+↓', run: trig('editor.action.moveLinesDownAction') },
    { id: 'editor.joinLines', label: 'Join Lines', category: 'Editor', run: trig('editor.action.joinLines') },
    { id: 'editor.transpose', label: 'Transpose Characters', category: 'Editor', run: trig('editor.action.transpose') },
    { id: 'editor.cursorAbove', label: 'Add Cursor Above', category: 'Selection', hint: 'Ctrl+Alt+↑', run: trig('editor.action.insertCursorAbove') },
    { id: 'editor.cursorBelow', label: 'Add Cursor Below', category: 'Selection', hint: 'Ctrl+Alt+↓', run: trig('editor.action.insertCursorBelow') },
    { id: 'editor.cursorsLineEnds', label: 'Add Cursors to Line Ends', category: 'Selection', hint: 'Shift+Alt+I', run: trig('editor.action.insertCursorAtEndOfEachLineSelected') },
    { id: 'editor.selectOcc', label: 'Select All Occurrences', category: 'Selection', hint: 'Ctrl+Shift+L', run: trig('editor.action.selectHighlights') },
    { id: 'editor.nextOcc', label: 'Add Next Occurrence', category: 'Selection', hint: 'Ctrl+D', run: trig('editor.action.addSelectionToNextFindMatch') },
    { id: 'editor.expand', label: 'Expand Selection', category: 'Selection', hint: 'Shift+Alt+→', run: trig('editor.action.smartSelect.expand') },
    { id: 'editor.shrink', label: 'Shrink Selection', category: 'Selection', hint: 'Shift+Alt+←', run: trig('editor.action.smartSelect.shrink') },
    { id: 'editor.rename', label: 'Rename Symbol', category: 'Editor', hint: 'F2', run: trig('editor.action.rename') },
    { id: 'editor.gotoDef', label: 'Go to Definition', category: 'Go', hint: 'F12', run: trig('editor.action.revealDefinition') },
    { id: 'editor.peekDef', label: 'Peek Definition', category: 'Go', hint: 'Alt+F12', run: trig('editor.action.peekDefinition') },
    { id: 'editor.refs', label: 'Find All References', category: 'Go', hint: 'Shift+F12', run: trig('editor.action.goToReferences') },
    { id: 'editor.nextProblem', label: 'Go to Next Problem', category: 'Go', hint: 'F8', run: trig('editor.action.marker.next') },
    { id: 'editor.quickFix', label: 'Quick Fix…', category: 'Editor', hint: 'Ctrl+.', run: trig('editor.action.quickFix') },
    { id: 'editor.suggest', label: 'Trigger Suggest', category: 'Editor', hint: 'Ctrl+Space', run: trig('editor.action.triggerSuggest') },
    { id: 'editor.hover', label: 'Show Hover', category: 'Editor', run: trig('editor.action.showHover') },
    { id: 'editor.indent', label: 'Indent Lines', category: 'Editor', run: trig('editor.action.indentLines') },
    { id: 'editor.outdent', label: 'Outdent Lines', category: 'Editor', run: trig('editor.action.outdentLines') },
    { id: 'editor.trim', label: 'Trim Trailing Whitespace', category: 'Editor', run: trig('editor.action.trimTrailingWhitespace') },
    { id: 'editor.indentToSpaces', label: 'Convert Indentation to Spaces', category: 'Editor', run: trig('editor.action.indentationToSpaces') },
    { id: 'editor.indentToTabs', label: 'Convert Indentation to Tabs', category: 'Editor', run: trig('editor.action.indentationToTabs') },
    { id: 'editor.monacoPalette', label: 'Show Monaco Native Command Palette', category: 'Editor', run: trig('editor.action.quickCommand') },
    { id: 'tx.upper', label: 'Transform to UPPERCASE', category: 'Transform', run: transform((s) => s.toUpperCase()) },
    { id: 'tx.lower', label: 'Transform to lowercase', category: 'Transform', run: transform((s) => s.toLowerCase()) },
    ...Object.entries(cases).map(([k, f]) => ({ id: 'tx.case.' + k, label: `Transform to ${k}`, category: 'Transform', run: transform(f) })),
    { id: 'tx.sortAsc', label: 'Sort Lines Ascending', category: 'Transform', run: lines((l) => [...l].sort((a, b) => a.localeCompare(b))) },
    { id: 'tx.sortDesc', label: 'Sort Lines Descending', category: 'Transform', run: lines((l) => [...l].sort((a, b) => b.localeCompare(a))) },
    { id: 'tx.sortLen', label: 'Sort Lines by Length', category: 'Transform', run: lines((l) => [...l].sort((a, b) => a.length - b.length)) },
    { id: 'tx.reverse', label: 'Reverse Lines', category: 'Transform', run: lines((l) => [...l].reverse()) },
    { id: 'tx.shuffle', label: 'Shuffle Lines', category: 'Transform', run: lines((l) => [...l].sort(() => Math.random() - 0.5)) },
    { id: 'tx.unique', label: 'Remove Duplicate Lines', category: 'Transform', run: lines((l) => [...new Set(l)]) },
    { id: 'tx.removeEmpty', label: 'Remove Empty Lines', category: 'Transform', run: lines((l) => l.filter((x) => x.trim())) },
    { id: 'tx.number', label: 'Number Lines', category: 'Transform', run: lines((l) => l.map((x, i) => `${i + 1}. ${x}`)) },
    { id: 'tx.jsonPretty', label: 'JSON: Prettify', category: 'Transform', run: transform((s) => JSON.stringify(JSON.parse(s), null, ide.settings.tabSize), true) },
    { id: 'tx.jsonMin', label: 'JSON: Minify', category: 'Transform', run: transform((s) => JSON.stringify(JSON.parse(s)), true) },
    { id: 'tx.jsonSort', label: 'JSON: Sort Keys', category: 'Transform', run: transform((s) => { const sortK = (o: any): any => (Array.isArray(o) ? o.map(sortK) : o && typeof o === 'object' ? Object.fromEntries(Object.keys(o).sort().map((k) => [k, sortK(o[k])])) : o); return JSON.stringify(sortK(JSON.parse(s)), null, ide.settings.tabSize); }, true) },
    { id: 'tx.b64e', label: 'Base64 Encode Selection', category: 'Transform', run: transform((s) => btoa(unescape(encodeURIComponent(s)))) },
    { id: 'tx.b64d', label: 'Base64 Decode Selection', category: 'Transform', run: transform((s) => decodeURIComponent(escape(atob(s)))) },
    { id: 'tx.urle', label: 'URL Encode Selection', category: 'Transform', run: transform(encodeURIComponent) },
    { id: 'tx.urld', label: 'URL Decode Selection', category: 'Transform', run: transform(decodeURIComponent) },
    { id: 'tx.escape', label: 'Escape as String Literal', category: 'Transform', run: transform((s) => JSON.stringify(s)) },
    { id: 'tx.wrapQuotes', label: 'Wrap Lines in Quotes', category: 'Transform', run: lines((l) => l.map((x) => `'${x}'`)) },
    { id: 'tx.toArray', label: 'Lines → JSON Array', category: 'Transform', run: transform((s) => JSON.stringify(s.split('\n').filter(Boolean)), true) },
    { id: 'tx.crlfToLf', label: 'Line Endings → LF', category: 'Transform', run: transform((s) => s.replace(/\r\n/g, '\n'), true) },
    { id: 'tx.lfToCrlf', label: 'Line Endings → CRLF', category: 'Transform', run: transform((s) => s.replace(/\r?\n/g, '\r\n'), true) },
    { id: 'tx.trimBlankEnds', label: 'Remove Leading & Trailing Blank Lines', category: 'Transform', run: transform((s) => s.replace(/^[\r\n]+/, '').replace(/[\r\n]+$/, ''), true) },
    { id: 'tx.trimTrailing', label: 'Strip Trailing Whitespace', category: 'Transform', run: lines((l) => l.map((x) => x.replace(/[ \t]+$/, ''))) },
    { id: 'tx.collapseBlankLines', label: 'Collapse Duplicate Blank Lines', category: 'Transform', run: lines((l) => l.filter((x, i) => !(x.trim() === '' && l[i - 1]?.trim() === ''))) },
    { id: 'tx.stripLineNumbers', label: 'Strip Leading Line Numbers', category: 'Transform', run: lines((l) => l.map((x) => x.replace(/^\s*\d+\s*[.):\-]?\s?/, ''))) },
    { id: 'tx.escapeRegex', label: 'Escape Regex Special Characters', category: 'Transform', run: transform((s) => s.replace(/[.*+?^${}()|[\]\\/-]/g, '\\$&'), true) },
    { id: 'tx.unescapeRegex', label: 'Unescape Regex Special Characters', category: 'Transform', run: transform((s) => s.replace(/\\([.*+?^${}()|[\]\\/-])/g, '$1'), true) },
    { id: 'tx.htmlEncode', label: 'HTML: Encode Entities', category: 'Transform', run: transform((s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)), true) },
    { id: 'tx.htmlDecode', label: 'HTML: Decode Entities', category: 'Transform', run: transform((s) => { const t = document.createElement('textarea'); t.innerHTML = s; return t.value; }, true) },
    { id: 'insert.date', label: 'Insert Date/Time (ISO)', category: 'Insert', run: insert(() => new Date().toISOString()) },
    { id: 'insert.timestamp', label: 'Insert Unix Timestamp', category: 'Insert', run: insert(() => String(Math.floor(Date.now() / 1000))) },
    { id: 'insert.uuid', label: 'Insert UUID', category: 'Insert', run: insert(() => crypto.randomUUID()) },
    { id: 'insert.lorem', label: 'Insert Lorem Ipsum', category: 'Insert', run: insert(() => lorem(40)) },
    { id: 'insert.color', label: 'Insert Random Color', category: 'Insert', run: insert(() => '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')) },
    { id: 'insert.template', label: 'Insert Language Boilerplate', category: 'Insert', run: () => { const e = ed(); if (!e) return; const l = activeLang(); const t = l ? FILE_TEMPLATES[l.id] ?? FILE_TEMPLATES[l.monaco] : undefined; if (!t) return ide.toast('No boilerplate for ' + (l?.name ?? 'this file'), 'warn'); e.executeEdits('jotqoda', [{ range: e.getSelection(), text: t }]); } },
    { id: 'insert.todo', label: 'Insert TODO Comment', category: 'Insert', run: insert(() => commentPrefix() + 'TODO: ' + commentSuffix()) },
    { id: 'insert.fixme', label: 'Insert FIXME Comment', category: 'Insert', run: insert(() => commentPrefix() + 'FIXME: ' + commentSuffix()) },
    { id: 'insert.separator', label: 'Insert Comment Separator', category: 'Insert', run: insert(() => commentPrefix() + '-'.repeat(60) + commentSuffix()) },
    { id: 'insert.banner', label: 'Insert File Banner', category: 'Insert', run: insert(() => commentPrefix() + (ide.activeFile ?? 'untitled') + '  ·  ' + new Date().toISOString().slice(0, 10) + commentSuffix()) },
    { id: 'run.run', label: 'Run Active File', category: 'Run', key: 'F5', run: () => ide.run() },
    { id: 'run.run2', label: 'Run Active File (Ctrl+Enter)', category: 'Run', key: 'Ctrl+Enter', run: () => ide.run() },
    { id: 'run.stop', label: 'Stop Execution', category: 'Run', key: 'Shift+F5', run: () => ide.stop() },
    { id: 'run.selection', label: 'Run Selected JavaScript', category: 'Run', run: () => { const e = ed(); if (!e) return; const s = e.getModel().getValueInRange(e.getSelection()); if (!s) return ide.toast('Select some JS first', 'warn'); ide.writeFile('.jotqoda/selection.js', s); ide.run('.jotqoda/selection.js'); } },
    { id: 'run.clear', label: 'Clear Output', category: 'Run', run: () => ide.clearOutput() },
    { id: 'terminal.new', label: 'Create New Terminal', category: 'Terminal', key: 'Ctrl+Shift+`', run: () => ide.requestTerminal({ newTerminal: true }) },
    { id: 'terminal.runFile', label: 'Run Active File in Terminal', category: 'Terminal', run: () => { const f = requireFile(); if (f) ide.requestTerminal({ command: `run ${f}` }); } },
    { id: 'terminal.runSelection', label: 'Run Selected Text in Terminal', category: 'Terminal', run: () => { const e = ed(); if (!e) return; const t = e.getModel().getValueInRange(e.getSelection()); if (!t.trim()) return ide.toast('Select a command first', 'warn'); ide.requestTerminal({ command: t.split('\n')[0] }); } },
    { id: 'terminal.here', label: "Open Terminal in Active File's Folder", category: 'Terminal', run: () => { const f = requireFile(); if (f) ide.requestTerminal({ cwd: f.includes('/') ? f.slice(0, f.lastIndexOf('/')) : '' }); } },
    { id: 'git.commit', label: 'Commit All…', category: 'Git', run: async () => { const m = await ide.prompt('Commit message', ''); if (m) ide.commit(m); } },
    { id: 'git.discardFile', label: 'Discard Changes in Active File', category: 'Git', run: () => ide.activeFile && ide.discard(ide.activeFile) },
    { id: 'git.diff', label: 'Open Diff for Active File', category: 'Git', run: () => ide.activeFile && ide.openFile('diff:' + ide.activeFile) },
    { id: 'git.history', label: 'Show Commit History', category: 'Git', run: () => { ide.setSidebarView('git'); ide.setSidebarOpen(true); } },
    { id: 'git.discardAll', label: 'Discard All Changes', category: 'Git', run: () => { const dirty = Object.keys(ide.files).filter((p) => ide.head[p] !== ide.files[p]); if (!dirty.length) return ide.toast('No changes to discard', 'warn'); if (!confirm(`Discard ${dirty.length} uncommitted change(s)?`)) return; dirty.forEach((p) => { if (ide.head[p] == null) ide.deletePath(p, true); else ide.writeFile(p, ide.head[p], true); }); ide.toast('All changes discarded', 'success'); } },
    { id: 'settings.open', label: 'Open Settings', category: 'Preferences', key: 'Ctrl+,', run: () => ide.setSettingsOpen(true) },
    { id: 'theme.select', label: 'Color Theme…', category: 'Preferences', key: 'Ctrl+Alt+T', run: () => ide.openPalette('theme') },
    ...THEMES.map((t) => ({ id: 'theme.' + t.id, label: `Theme: ${t.name}`, category: 'Preferences', run: () => ide.setSetting('theme', t.id) })),
    { id: 'language.change', label: 'Change Language Mode…', category: 'Preferences', key: 'Ctrl+Alt+M', run: () => ide.openPalette('language') },
    { id: 'language.detect', label: 'Auto Detect Language of Active File', category: 'Preferences', run: () => { const f = requireFile(); if (!f) return; ide.setLangOverride(f, ''); ide.toast(`Detected: ${getLang(f, ide.files[f]).name}`); } },
    { id: 'notifications.show', label: 'Notifications: Show Notification History', category: 'Notifications', run: async () => { ide.markNotificationsRead(); if (!ide.notifications.length) return ide.toast('No notifications', 'info'); await ide.quickPick(ide.notifications.map((n) => ({ id: String(n.id), label: n.msg, description: `${n.type} · ${new Date(n.time).toLocaleTimeString()}` })), 'Notification history'); } },
    { id: 'notifications.clear', label: 'Notifications: Clear All', category: 'Notifications', run: () => ide.clearNotifications() },
    { id: 'notifications.dnd', label: 'Notifications: Toggle Do Not Disturb', category: 'Notifications', run: toggle('doNotDisturb', 'Do Not Disturb') },
    { id: 'layout.sidebarPosition', label: 'Toggle Primary Sidebar Position (Left/Right)', category: 'Layout', run: () => ide.setSetting('sidebarPosition', ide.settings.sidebarPosition === 'left' ? 'right' : 'left') },
    { id: 'layout.activityBar', label: 'Toggle Activity Bar Visibility', category: 'Layout', run: toggle('activityBar', 'Activity bar') },
    { id: 'layout.statusBar', label: 'Toggle Status Bar Visibility', category: 'Layout', run: toggle('statusBar', 'Status bar') },
    { id: 'layout.centered', label: 'Toggle Centered Layout', category: 'Layout', run: toggle('centeredLayout', 'Centered layout') },
    { id: 'pref.emmet', label: 'Toggle Emmet', category: 'Preferences', run: toggle('emmet', 'Emmet') },
    { id: 'pref.prettier', label: 'Toggle Prettier Formatter', category: 'Preferences', run: toggle('prettier', 'Prettier') },
    { id: 'pref.localHistory', label: 'Toggle Local History', category: 'Preferences', run: toggle('localHistory', 'Local history') },
    { id: 'pref.trimWhitespace', label: 'Toggle Trim Trailing Whitespace on Save', category: 'Preferences', run: toggle('trimTrailingWhitespace', 'Trim trailing whitespace on save') },
    { id: 'pref.keybindings', label: 'Open Keyboard Shortcuts (editable)', category: 'Preferences', run: () => ide.setShortcutsOpen(true) },
    { id: 'pref.autoSave', label: 'Toggle Auto Save', category: 'Preferences', run: toggle('autoSave', 'Auto save') },
    { id: 'pref.formatOnSave', label: 'Toggle Format on Save', category: 'Preferences', run: toggle('formatOnSave', 'Format on save') },
    { id: 'pref.ligatures', label: 'Toggle Font Ligatures', category: 'Preferences', run: toggle('ligatures', 'Ligatures') },
    { id: 'pref.cursor', label: 'Cycle Cursor Style', category: 'Preferences', run: () => ide.setSetting('cursorStyle', ({ line: 'block', block: 'underline', underline: 'line-thin', 'line-thin': 'line' } as const)[ide.settings.cursorStyle]) },
    { id: 'pref.tabSize2', label: 'Indent Using 2 Spaces', category: 'Preferences', run: () => ide.setSetting('tabSize', 2) },
    { id: 'pref.tabSize4', label: 'Indent Using 4 Spaces', category: 'Preferences', run: () => ide.setSetting('tabSize', 4) },
    { id: 'pref.lineHeight', label: 'Increase Line Height', category: 'Preferences', run: () => ide.setSetting('lineHeight', Math.min(40, ide.settings.lineHeight + 2)) },
    { id: 'pref.reset', label: 'Reset All Settings to Defaults', category: 'Preferences', run: () => { if (!confirm('Reset every setting to its default value?')) return; (Object.keys(DEFAULT_SETTINGS) as (keyof typeof DEFAULT_SETTINGS)[]).forEach((k) => ide.setSetting(k, DEFAULT_SETTINGS[k])); ide.toast('Settings reset to defaults', 'success'); } },
    { id: 'help.shortcuts', label: 'Keyboard Shortcuts Reference', category: 'Help', key: 'Ctrl+K', run: () => ide.setShortcutsOpen(true) },
    { id: 'help.about', label: 'About JotQoda', category: 'Help', run: () => ide.toast(`JotQoda 3.1 — Monaco engine · ${LANGUAGES.length} languages · ${RUNNABLE_LANGS.length} runnable in-browser · ${THEMES.length} themes · ${C.length} commands`, 'info') },
  ];
  return C;
}
