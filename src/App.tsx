import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Minimize2, CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { IDEContext, DEFAULT_SETTINGS, normPath, dirname, isSpecialTab, type IDE, type Settings, type Group, type Commit, type OutputLine, type Problem, type SidebarView, type PanelTab, type PaletteMode } from './ide/types';
import { DEFAULT_WORKSPACE, FILE_TEMPLATES } from './ide/templates';
import { getLang, getLangById } from './ide/languages';
import { applyUiTheme, getTheme } from './ide/themes';
import { runJavaScript, runPython, runSQL, stopAll, compileTS, esmToCjs, type LogType } from './ide/runner';
import { ideRef } from './ide/monacoSetup';
import { buildCommands } from './ide/commands';
import { TitleBar, ActivityBar } from './components/Chrome';
import { Explorer } from './components/Explorer';
import { SearchView } from './components/SearchView';
import { GitView } from './components/GitView';
import { ToolsView } from './components/ToolsView';
import { SnippetsView, RunView, ExtensionsView } from './components/SidebarViews';
import { EditorGroup } from './components/EditorGroup';
import { Panel } from './components/Panel';
import { Preview } from './components/Preview';
import { StatusBar } from './components/StatusBar';
import { CommandPalette } from './components/CommandPalette';
import { SettingsModal, ShortcutsModal, PromptModal } from './components/Modals';

const STORE = 'jotqoda-v1';
const loadStore = () => { try { return JSON.parse(localStorage.getItem(STORE) || 'null'); } catch { return null; } };
const hashId = () => Array.from(crypto.getRandomValues(new Uint8Array(20)), (b) => b.toString(16).padStart(2, '0')).join('');
const parentsOf = (p: string) => { const out: string[] = []; let d = dirname(p); while (d) { out.push(d); d = dirname(d); } return out; };

type Toast = { id: number; msg: string; type: 'info' | 'success' | 'error' | 'warn' };

function startDrag(e: React.MouseEvent, cursor: string, onMove: (dx: number, dy: number) => void) {
  e.preventDefault();
  const sx = e.clientX, sy = e.clientY;
  document.body.style.cursor = cursor;
  document.body.classList.add('dragging');
  const mm = (ev: MouseEvent) => onMove(ev.clientX - sx, ev.clientY - sy);
  const mu = () => { document.body.style.cursor = ''; document.body.classList.remove('dragging'); window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', mu); };
  window.addEventListener('mousemove', mm);
  window.addEventListener('mouseup', mu);
}

function keyString(e: KeyboardEvent) {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
  if (e.shiftKey) parts.push('Shift');
  if (e.altKey) parts.push('Alt');
  const map: Record<string, string> = { Backquote: '`', Backslash: '\\', Equal: '=', Minus: '-', Comma: ',', Slash: '/', Period: '.', NumpadAdd: '=', NumpadSubtract: '-' };
  let k = map[e.code] ?? (e.code.startsWith('Key') ? e.code.slice(3) : e.code.startsWith('Digit') ? e.code.slice(5) : e.key);
  if (k.length === 1) k = k.toUpperCase();
  parts.push(k);
  return parts.join('+').replace('Ctrl+Alt', 'Ctrl+Alt').replace('Ctrl+Shift+Alt', 'Ctrl+Shift+Alt');
}
const normKey = (k: string) => { const p = k.split('+'); const mods = ['Ctrl', 'Shift', 'Alt'].filter((m) => p.includes(m)); return [...mods, p.filter((x) => !['Ctrl', 'Shift', 'Alt'].includes(x)).join('+')].join('+'); };

export default function App() {
  const stored = useMemo(loadStore, []);
  const [files, setFiles] = useState<Record<string, string>>(stored?.files ?? DEFAULT_WORKSPACE.files);
  const [folders, setFolders] = useState<string[]>(stored?.folders ?? DEFAULT_WORKSPACE.folders);
  const [saved, setSaved] = useState<Record<string, string>>(() => ({ ...(stored?.files ?? DEFAULT_WORKSPACE.files) }));
  const [head, setHead] = useState<Record<string, string>>(stored?.head ?? DEFAULT_WORKSPACE.files);
  const [commits, setCommits] = useState<Commit[]>(stored?.commits ?? [{ id: hashId(), message: 'Initial commit', date: Date.now(), files: {}, stats: { added: Object.keys(DEFAULT_WORKSPACE.files).length, modified: 0, deleted: 0 } }]);
  const [settings, setSettings] = useState<Settings>({ ...DEFAULT_SETTINGS, ...(stored?.settings ?? {}) });
  const [groups, setGroups] = useState<Group[]>(stored?.groups ?? [{ tabs: ['__welcome__', 'README.md', 'src/main.ts'], active: '__welcome__' }]);
  const [activeGroup, setActiveGroupState] = useState(0);
  const [langOverride, setLangOverrideState] = useState<Record<string, string>>(stored?.langOverride ?? {});
  const [output, setOutput] = useState<OutputLine[]>([]);
  const [running, setRunning] = useState(false);
  const [panelOpen, setPanelOpen] = useState(stored?.panelOpen ?? true);
  const [panelTab, setPanelTab] = useState<PanelTab>('terminal');
  const [sidebarView, setSidebarView] = useState<SidebarView>('explorer');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [previewPath, setPreviewPath] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [palette, setPalette] = useState<{ mode: PaletteMode; initial?: string } | null>(null);
  const [promptState, setPromptState] = useState<{ title: string; def?: string; placeholder?: string; resolve: (v: string | null) => void } | null>(null);
  const [cursor, setCursor] = useState({ line: 1, col: 1, sel: 0, selLines: 0 });
  const [problems, setProblems] = useState<Problem[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [zen, setZen] = useState(false);
  const [monaco, setMonacoState] = useState<any>(null);
  const [sidebarW, setSidebarW] = useState(270);
  const [panelH, setPanelH] = useState(240);
  const [previewW, setPreviewW] = useState(480);
  const [splitPct, setSplitPct] = useState(50);
  const [panelMax, setPanelMax] = useState(false);

  const editors = useRef<any[]>([]);
  const filesRef = useRef(files); filesRef.current = files;
  const settingsRef = useRef(settings); settingsRef.current = settings;
  const monacoRef = useRef<any>(null);
  const outId = useRef(0);
  const importRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  const activeFile = groups[activeGroup]?.active ?? groups[0]?.active ?? null;

  const toast = useCallback((msg: string, type: Toast['type'] = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-4), { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  const log = useCallback((type: LogType, text: string) => {
    setOutput((o) => [...o.slice(-3000), { id: ++outId.current, type, text, time: Date.now() }]);
  }, []);
  const setSetting = useCallback(<K extends keyof Settings>(k: K, v: Settings[K]) => setSettings((s) => ({ ...s, [k]: v })), []);
  const setMonaco = useCallback((m: any) => {
    if (monacoRef.current) return;
    monacoRef.current = m;
    setMonacoState(m);
    Object.entries(filesRef.current).forEach(([p, c]) => {
      if (!/\.(tsx?|jsx?|mjs|cjs)$/.test(p)) return;
      const uri = m.Uri.parse('file:///' + p);
      if (!m.editor.getModel(uri)) m.editor.createModel(c, /\.tsx?$/.test(p) ? 'typescript' : 'javascript', uri);
    });
  }, []);
  const uriOf = (p: string) => monacoRef.current?.Uri.parse('file:///' + p);
  const disposeModel = (p: string) => setTimeout(() => { const m = monacoRef.current?.editor.getModel(uriOf(p)); if (m && !editors.current.some((e) => e?.getModel?.() === m)) m.dispose(); }, 50);
  const syncModel = (p: string, content: string) => {
    const m = monacoRef.current?.editor.getModel(uriOf(p));
    if (m && m.getValue() !== content) m.pushEditOperations([], [{ range: m.getFullModelRange(), text: content }], () => null);
  };

  const setActiveGroup = useCallback((i: number) => setActiveGroupState(i), []);
  const openFile = useCallback((path: string, group?: number) => {
    setGroups((gs) => {
      const g = group ?? activeGroupRef.current;
      const next = gs.map((x) => ({ ...x, tabs: [...x.tabs] }));
      if (g >= next.length) next.push({ tabs: [], active: null });
      const idx = Math.min(g, next.length - 1);
      if (!next[idx].tabs.includes(path)) {
        const at = next[idx].active ? next[idx].tabs.indexOf(next[idx].active!) + 1 : next[idx].tabs.length;
        next[idx].tabs.splice(at, 0, path);
      }
      next[idx].active = path;
      setActiveGroupState(idx);
      return next;
    });
  }, []);
  const activeGroupRef = useRef(activeGroup); activeGroupRef.current = activeGroup;

  const closeTab = useCallback((path: string, group?: number) => {
    setGroups((gs) => {
      let next = gs.map((g, i) => {
        if (group != null && i !== group) return g;
        const idx = g.tabs.indexOf(path);
        if (idx < 0) return g;
        const tabs = g.tabs.filter((t) => t !== path);
        const active = g.active === path ? tabs[Math.min(idx, tabs.length - 1)] ?? null : g.active;
        return { tabs, active };
      });
      if (next.length > 1 && next[1].tabs.length === 0) { next = [next[0]]; setActiveGroupState(0); }
      return next;
    });
  }, []);
  const closeOthers = useCallback((path: string, group: number) => setGroups((gs) => gs.map((g, i) => (i === group ? { tabs: [path], active: path } : g))), []);
  const closeAll = useCallback(() => { setGroups([{ tabs: [], active: null }]); setActiveGroupState(0); }, []);
  const splitEditor = useCallback(() => {
    setGroups((gs) => {
      if (gs.length > 1) { setActiveGroupState(0); return [gs[0]]; }
      const a = gs[0].active;
      setActiveGroupState(1);
      return [gs[0], { tabs: a ? [a] : [], active: a }];
    });
  }, []);

  const writeFile = useCallback((path: string, content: string, external = false) => {
    setFiles((f) => (f[path] === content ? f : { ...f, [path]: content }));
    if (settingsRef.current.autoSave) setSaved((s) => ({ ...s, [path]: content }));
    if (external) { syncModel(path, content); setSaved((s) => ({ ...s, [path]: content })); }
    const parents = parentsOf(path);
    if (parents.length) setFolders((fs) => (parents.every((p) => fs.includes(p)) ? fs : [...new Set([...fs, ...parents])]));
  }, []);

  const createFile = useCallback((raw: string, content?: string, open = true) => {
    const path = normPath(raw);
    if (!path) return false;
    if (filesRef.current[path] != null) { toast(`"${path}" already exists`, 'error'); if (open) openFile(path); return false; }
    const c = content ?? FILE_TEMPLATES[getLang(path).id] ?? '';
    setFiles((f) => ({ ...f, [path]: c }));
    setSaved((s) => ({ ...s, [path]: c }));
    const parents = parentsOf(path);
    if (parents.length) setFolders((fs) => [...new Set([...fs, ...parents])]);
    if (open) openFile(path);
    return true;
  }, [openFile, toast]);

  const createFolder = useCallback((raw: string) => {
    const p = normPath(raw);
    if (p) setFolders((fs) => [...new Set([...fs, p, ...parentsOf(p)])]);
  }, []);

  const deletePath = useCallback((path: string, skip = false) => {
    const isFile = filesRef.current[path] != null;
    const affected = Object.keys(filesRef.current).filter((p) => p === path || p.startsWith(path + '/'));
    if (!skip && settingsRef.current.confirmDelete && !confirm(`Delete ${isFile ? 'file' : 'folder'} "${path}"${!isFile ? ` and its ${affected.length} file(s)` : ''}?`)) return;
    setFiles((f) => { const n = { ...f }; affected.forEach((p) => delete n[p]); return n; });
    setFolders((fs) => fs.filter((p) => p !== path && !p.startsWith(path + '/')));
    setGroups((gs) => {
      let next = gs.map((g) => { const tabs = g.tabs.filter((t) => !affected.includes(t) && !affected.includes(t.replace(/^diff:/, ''))); return { tabs, active: tabs.includes(g.active ?? '') ? g.active : tabs[tabs.length - 1] ?? null }; });
      if (next.length > 1 && !next[1].tabs.length) { next = [next[0]]; setActiveGroupState(0); }
      return next;
    });
    affected.forEach(disposeModel);
    toast(`Deleted ${path}`);
  }, [toast]);

  const renamePath = useCallback((from: string, rawTo: string) => {
    const to = normPath(rawTo);
    if (!to || to === from) return;
    const f = filesRef.current;
    if (f[to] != null) return toast(`"${to}" already exists`, 'error');
    const moves: [string, string][] = f[from] != null ? [[from, to]] : Object.keys(f).filter((p) => p.startsWith(from + '/')).map((p) => [p, to + p.slice(from.length)]);
    setFiles((cur) => { const n = { ...cur }; moves.forEach(([a, b]) => { n[b] = n[a]; delete n[a]; }); return n; });
    setSaved((cur) => { const n = { ...cur }; moves.forEach(([a, b]) => { n[b] = n[a]; delete n[a]; }); return n; });
    setFolders((fs) => [...new Set(fs.map((p) => (p === from ? to : p.startsWith(from + '/') ? to + p.slice(from.length) : p)).concat(parentsOf(to)))]);
    setGroups((gs) => gs.map((g) => { const map = (t: string) => moves.find(([a]) => a === t)?.[1] ?? t; return { tabs: g.tabs.map(map), active: g.active ? map(g.active) : null }; }));
    moves.forEach(([a]) => disposeModel(a));
    toast(`Renamed to ${to}`, 'success');
  }, [toast]);

  const getEditor = useCallback(() => {
    const g = activeGroupRef.current;
    const e = editors.current[g] ?? editors.current[0];
    try { if (e && e.getModel()) return e; } catch {}
    return null;
  }, []);

  const saveFile = useCallback((p?: string | null) => {
    const path = p ?? groupsRef.current[activeGroupRef.current]?.active;
    if (!path || filesRef.current[path] == null) return;
    const mark = () => setSaved((s) => ({ ...s, [path]: filesRef.current[path] }));
    const ed = getEditor();
    if (settingsRef.current.formatOnSave && ed) {
      const a = ed.getAction('editor.action.formatDocument');
      (a ? a.run() : Promise.resolve()).then(() => setTimeout(mark, 30));
    } else mark();
  }, [getEditor]);
  const groupsRef = useRef(groups); groupsRef.current = groups;
  const saveAll = useCallback(() => { setSaved({ ...filesRef.current }); toast('All files saved', 'success'); }, [toast]);

  const loadWorkspace = useCallback((fs: Record<string, string>, fo: string[]) => {
    Object.keys(filesRef.current).forEach(disposeModel);
    setFiles(fs); setSaved({ ...fs }); setFolders(fo); setHead({ ...fs });
    setCommits((c) => [...c, { id: hashId(), message: 'Load workspace', date: Date.now(), files: {}, stats: { added: Object.keys(fs).length, modified: 0, deleted: 0 } }]);
    const first = Object.keys(fs).find((p) => /readme|main|index/i.test(p)) ?? Object.keys(fs)[0];
    setGroups([{ tabs: first ? [first] : [], active: first ?? null }]);
    setActiveGroupState(0); setPreviewPath(null);
  }, []);

  const stop = useCallback(() => {
    if (!runningRef.current) return;
    stopAll(); setRunning(false); log('warn', 'Execution stopped by user');
  }, [log]);
  const runningRef = useRef(running); runningRef.current = running;

  const run = useCallback(async (p?: string) => {
    const path = p ?? groupsRef.current[activeGroupRef.current]?.active;
    if (!path || isSpecialTab(path) || filesRef.current[path] == null) return toast('Open a file to run', 'warn');
    const override = langOverrideRef.current[path];
    const lang = override ? getLangById(override) : getLang(path);
    const fs = filesRef.current;
    if (settingsRef.current.clearOutputOnRun) setOutput([]);
    const kind = lang.runnable;
    if (kind === 'html' || kind === 'markdown' || kind === 'svg' || kind === 'css') {
      setPreviewPath(path); log('system', `Opened live preview for ${path}`); return;
    }
    setPanelOpen(true); setPanelTab('output');
    if (kind === 'json') {
      try { JSON.parse(fs[path]); log('success', `${path} is valid JSON (${Object.keys(JSON.parse(fs[path]) ?? {}).length} top-level keys)`); }
      catch (e: any) { log('error', `Invalid JSON: ${e.message}`); }
      return;
    }
    if (!kind) { log('warn', `No in-browser runtime for ${lang.name}. Runnable: JavaScript, TypeScript, Python, SQL, HTML, Markdown, SVG, JSON.`); return; }
    log('system', `Running ${path} (${lang.name}) — ${new Date().toLocaleTimeString()}`);
    setRunning(true);
    const done = (ok: boolean, ms: number) => { setRunning(false); log(ok ? 'success' : 'error', ok ? `Finished in ${ms.toFixed(1)} ms` : `Process exited with errors (${ms.toFixed(1)} ms)`); };
    try {
      if (kind === 'js' || kind === 'ts') {
        const modules: Record<string, string> = {};
        const m = monacoRef.current;
        for (const [fp, c] of Object.entries(fs)) {
          if (/\.(tsx?|mts|cts)$/.test(fp)) {
            if (!m) throw new Error('TypeScript compiler not ready yet — open a file in the editor first');
            modules[fp] = await compileTS(m, fp, c);
          } else if (/\.(m?jsx?|cjs)$/.test(fp)) modules[fp] = esmToCjs(c);
          else if (fp.endsWith('.json')) modules[fp] = c;
        }
        runJavaScript(modules, path, log, done, () => setOutput([]));
      } else if (kind === 'python') {
        const pyFiles = Object.fromEntries(Object.entries(fs).filter(([k]) => /\.(py|txt|csv|json|md)$/.test(k)));
        runPython(pyFiles, path, log, done);
      } else if (kind === 'sql') runSQL(fs[path], log, done);
    } catch (e: any) { log('error', String(e?.message ?? e)); setRunning(false); }
  }, [log, toast]);

  const langOverrideRef = useRef(langOverride); langOverrideRef.current = langOverride;
  const setLangOverride = useCallback((p: string, l: string) => setLangOverrideState((o) => ({ ...o, [p]: l })), []);

  const commit = useCallback((message: string) => {
    const f = filesRef.current;
    const h = headRef.current;
    const stats = { added: Object.keys(f).filter((p) => h[p] == null).length, modified: Object.keys(f).filter((p) => h[p] != null && h[p] !== f[p]).length, deleted: Object.keys(h).filter((p) => f[p] == null).length };
    setCommits((c) => [...c, { id: hashId(), message, date: Date.now(), files: {}, stats }]);
    setHead({ ...f });
    setSaved({ ...f });
    toast(`Committed: ${message}`, 'success');
  }, [toast]);
  const headRef = useRef(head); headRef.current = head;
  const discard = useCallback((path: string) => {
    const h = headRef.current;
    if (h[path] == null) deletePath(path, true);
    else writeFile(path, h[path], true);
  }, [deletePath, writeFile]);

  const openPalette = useCallback((mode: PaletteMode, initial?: string) => setPalette({ mode, initial }), []);
  const prompt = useCallback((title: string, def?: string, placeholder?: string) => new Promise<string | null>((resolve) => setPromptState({ title, def, placeholder, resolve })), []);

  const ideBase = {
    files, folders, saved, head, commits, settings, setSetting, groups, activeGroup, setActiveGroup, activeFile, openFile, closeTab, closeOthers, closeAll, splitEditor,
    createFile, createFolder, deletePath, renamePath, writeFile, saveFile, saveAll, loadWorkspace, editors, monaco, setMonaco, getEditor, run, stop, running, output, log,
    clearOutput: () => setOutput([]), panelOpen, setPanelOpen, panelTab, setPanelTab, sidebarView, setSidebarView, sidebarOpen, setSidebarOpen, previewPath,
    setPreviewPath: (p: string | null) => setPreviewPath(p && !isSpecialTab(p) ? p : null), toast, openPalette, prompt, commit, discard, cursor, setCursor, problems, setProblems,
    langOverride, setLangOverride, setSettingsOpen, setShortcutsOpen, zen,
  } as Omit<IDE, 'commands' | 'execCommand'>;
  const ide = ideBase as IDE;
  ide.commands = buildCommands(ide, {
    zen, setZen,
    importWorkspace: () => importRef.current?.click(),
    uploadFiles: () => uploadRef.current?.click(),
  });
  ide.execCommand = (id: string) => ideRef.current?.commands.find((c) => c.id === id)?.run();
  ideRef.current = ide;

  useEffect(() => { applyUiTheme(getTheme(settings.theme)); monaco?.editor.setTheme(settings.theme); }, [settings.theme, monaco]);
  useEffect(() => {
    const ts = monaco?.languages.typescript;
    if (!ts) return;
    ts.typescriptDefaults.setDiagnosticsOptions({ noSemanticValidation: !settings.typeCheck, diagnosticCodesToIgnore: [1375, 1378, 2792, 7016, 2307] });
    ts.javascriptDefaults.setDiagnosticsOptions({ noSemanticValidation: true });
  }, [settings.typeCheck, monaco]);

  useEffect(() => {
    const t = setTimeout(() => {
      try { localStorage.setItem(STORE, JSON.stringify({ files, folders, head, commits, settings, groups, langOverride, panelOpen })); }
      catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [files, folders, head, commits, settings, groups, langOverride, panelOpen]);

  useEffect(() => {
    const h = (e: MessageEvent) => { if (e.data?.__ide) log(e.data.type === 'warn' ? 'warn' : e.data.type === 'error' ? 'error' : e.data.type === 'info' ? 'info' : 'log', '[preview] ' + e.data.text); };
    window.addEventListener('message', h);
    return () => window.removeEventListener('message', h);
  }, [log]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const i = ideRef.current;
      if (!i) return;
      if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;
      const k = keyString(e);
      const target = e.target as HTMLElement;
      const inForm = (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') && !target.closest('.monaco-editor');
      if (inForm && ['Ctrl+Enter', 'Alt+Z', 'Ctrl+=', 'Ctrl+-', 'Ctrl+0', 'Ctrl+G', 'Ctrl+K'].includes(k)) return;
      if (document.querySelector('[data-modal-open]') && k !== 'Ctrl+Shift+P' && k !== 'Ctrl+P') return;
      const cmd = i.commands.find((c) => c.key && normKey(c.key) === k);
      if (cmd) { e.preventDefault(); e.stopPropagation(); cmd.run(); }
    };
    window.addEventListener('keydown', h, true);
    return () => window.removeEventListener('keydown', h, true);
  }, []);

  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (Object.keys(filesRef.current).some((p) => filesRef.current[p] !== saved[p]) && !settingsRef.current.autoSave) { e.preventDefault(); } };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [saved]);

  const onImport = async (fl: FileList | null) => {
    const f = fl?.[0];
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (!data.files) throw new Error('Invalid workspace file');
      loadWorkspace(data.files, data.folders ?? []);
      toast(`Imported workspace with ${Object.keys(data.files).length} files`, 'success');
    } catch (e: any) { toast(e.message, 'error'); }
  };
  const onUpload = async (fl: FileList | null) => {
    if (!fl) return;
    for (const f of Array.from(fl)) createFile(f.name, await f.text(), fl.length === 1);
    toast(`Uploaded ${fl.length} file(s)`, 'success');
  };

  const sidebar = {
    explorer: ['Explorer', <Explorer />], search: ['Search', <SearchView />], git: ['Source Control', <GitView />], run: ['Run & Debug', <RunView />],
    tools: ['Developer Tools', <ToolsView />], snippets: ['Snippets', <SnippetsView />], extensions: ['Extensions', <ExtensionsView />],
  }[sidebarView] as [string, React.ReactNode];

  const modalOpen = !!(palette || promptState || settingsOpen || shortcutsOpen);

  return (
    <IDEContext.Provider value={ide}>
      <div className="h-screen w-screen flex flex-col bg-[var(--bg)] text-[var(--fg)] overflow-hidden" style={{ fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, sans-serif' }} {...(modalOpen ? { 'data-modal-open': '' } : {})}>
        <input ref={importRef} type="file" accept=".json" hidden onChange={(e) => { onImport(e.target.files); e.target.value = ''; }} />
        <input ref={uploadRef} type="file" multiple hidden onChange={(e) => { onUpload(e.target.files); e.target.value = ''; }} />
        {!zen && <TitleBar />}
        <div className="flex-1 flex min-h-0">
          {!zen && <ActivityBar />}
          {!zen && sidebarOpen && (
            <>
              <div className="flex flex-col bg-[var(--side)] shrink-0 min-w-0" style={{ width: sidebarW }}>
                <div className="h-9 flex items-center px-4 text-[11px] uppercase tracking-wider text-[var(--muted)] shrink-0">{sidebar[0]}</div>
                <div className="flex-1 min-h-0">{sidebar[1]}</div>
              </div>
              <div className="sash-v" onMouseDown={(e) => { const w = sidebarW; startDrag(e, 'col-resize', (dx) => setSidebarW(Math.max(170, Math.min(600, w + dx)))); }} onDoubleClick={() => setSidebarW(270)} />
            </>
          )}
          <div ref={mainRef} className="flex-1 flex flex-col min-w-0">
            {!(panelOpen && panelMax) && (
              <div className="flex-1 flex min-h-0">
                <div className="min-w-0 h-full" style={{ width: groups.length > 1 ? `${splitPct}%` : undefined, flex: groups.length > 1 ? undefined : 1 }}><EditorGroup index={0} /></div>
                {groups.length > 1 && (
                  <>
                    <div className="sash-v" onMouseDown={(e) => { const s = splitPct; const w = (e.currentTarget.parentElement as HTMLElement).clientWidth - (previewPath ? previewW : 0); startDrag(e, 'col-resize', (dx) => setSplitPct(Math.max(15, Math.min(85, s + (dx / w) * 100)))); }} />
                    <div className="flex-1 min-w-0 h-full border-l border-[var(--border)]"><EditorGroup index={1} /></div>
                  </>
                )}
                {previewPath && (
                  <>
                    <div className="sash-v" onMouseDown={(e) => { const w = previewW; startDrag(e, 'col-resize', (dx) => setPreviewW(Math.max(240, Math.min(1400, w - dx)))); }} />
                    <div className="shrink-0 h-full border-l border-[var(--border)]" style={{ width: previewW }}><Preview /></div>
                  </>
                )}
              </div>
            )}
            {!zen && panelOpen && (
              <>
                {!panelMax && <div className="sash-h" onMouseDown={(e) => { const h = panelH; startDrag(e, 'row-resize', (_, dy) => setPanelH(Math.max(100, Math.min(window.innerHeight - 200, h - dy)))); }} />}
                <div className={`border-t border-[var(--border)] ${panelMax ? 'flex-1' : 'shrink-0'}`} style={{ height: panelMax ? undefined : panelH }}><Panel maximized={panelMax} setMaximized={setPanelMax} /></div>
              </>
            )}
          </div>
        </div>
        {!zen && <StatusBar />}

        {zen && (
          <button onClick={() => setZen(false)} className="fixed top-3 right-5 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] bg-[var(--side)]/90 border border-[var(--border)] opacity-40 hover:opacity-100 transition-opacity">
            <Minimize2 size={13} /> Exit Zen (Ctrl+Alt+Z)
          </button>
        )}

        {palette && <CommandPalette mode={palette.mode} initial={palette.initial} onClose={() => { setPalette(null); setTimeout(() => getEditor()?.focus(), 10); }} />}
        {promptState && <PromptModal title={promptState.title} def={promptState.def} placeholder={promptState.placeholder} onDone={(v) => { promptState.resolve(v); setPromptState(null); }} />}
        {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
        {shortcutsOpen && <ShortcutsModal onClose={() => setShortcutsOpen(false)} />}

        <div className="fixed bottom-8 right-4 z-[70] flex flex-col gap-2 items-end pointer-events-none">
          {toasts.map((t) => {
            const I = { info: Info, success: CheckCircle2, error: AlertCircle, warn: AlertTriangle }[t.type];
            const c = { info: 'text-sky-400', success: 'text-emerald-400', error: 'text-red-400', warn: 'text-amber-400' }[t.type];
            return (
              <div key={t.id} className="toast-in pointer-events-auto flex items-center gap-2.5 min-w-[260px] max-w-[420px] px-3.5 py-2.5 rounded-md shadow-2xl border border-[var(--border)] bg-[var(--side)] text-[13px]">
                <I size={16} className={c} />
                <span className="flex-1">{t.msg}</span>
                <button onClick={() => setToasts((ts) => ts.filter((x) => x.id !== t.id))} className="text-[var(--muted)] hover:text-[var(--fg)]"><X size={13} /></button>
              </div>
            );
          })}
        </div>
      </div>
    </IDEContext.Provider>
  );
}
