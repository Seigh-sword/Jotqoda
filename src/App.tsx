import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Minimize2, CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import {
  IDEContext, DEFAULT_SETTINGS, normPath, dirname, basename, isSpecialTab,
  type IDE, type Settings, type Group, type Commit, type OutputLine, type Problem, type SidebarView, type PanelTab, type PaletteMode,
  type CompareSpec, type CompareSide, type QuickPickItem, type QuickPickRequest, type Notification, type NavLocation, type Bookmark, type TerminalRequest,
} from './ide/types';
import { DEFAULT_WORKSPACE, FILE_TEMPLATES } from './ide/templates';
import { getLang, getLangById, forgetDetectedLang, PREVIEW_KINDS } from './ide/languages';
import { applyUiTheme, getTheme } from './ide/themes';
import { runJavaScript, runPython, runSQL, runLanguage, stopAll, compileTS, esmToCjs, type LogType } from './ide/runner';
import { ideRef, setPendingReveal, applyPendingReveal, configureEmmet, pathOfUri } from './ide/monacoSetup';
import { buildCommands } from './ide/commands';
import { keyString, normKey } from './ide/keys';
import { formatText, cleanupWhitespace } from './ide/format';
import * as hist from './ide/history';
import { downloadWorkspaceZip, readZip, readFolder } from './ide/zip';
import { TitleBar, ActivityBar } from './components/Chrome';
import { Explorer } from './components/Explorer';
import { SearchView } from './components/SearchView';
import { GitView } from './components/GitView';
import { ToolsView } from './components/ToolsView';
import { SnippetsView, RunView, ExtensionsView, BookmarksView } from './components/SidebarViews';
import { EditorGroup } from './components/EditorGroup';
import { Panel } from './components/Panel';
import { Preview } from './components/Preview';
import { StatusBar } from './components/StatusBar';
import { CommandPalette } from './components/CommandPalette';
import { SettingsModal, ShortcutsModal, PromptModal } from './components/Modals';

const STORE = 'jotqoda-v1';
const MAX_GROUPS = 4;
const loadStore = () => { try { return JSON.parse(localStorage.getItem(STORE) || 'null'); } catch { return null; } };
const hashId = () => Array.from(crypto.getRandomValues(new Uint8Array(20)), (b) => b.toString(16).padStart(2, '0')).join('');
const parentsOf = (p: string) => { const out: string[] = []; let d = dirname(p); while (d) { out.push(d); d = dirname(d); } return out; };
const equalSizes = (n: number) => Array.from({ length: n }, () => 100 / n);

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

function sanitizeGroups(gs: Group[] | undefined, compares: Record<string, CompareSpec>): Group[] | null {
  if (!Array.isArray(gs) || !gs.length) return null;
  const out = gs.slice(0, MAX_GROUPS).map((g) => {
    const tabs = (g.tabs ?? []).filter((t) => !t.startsWith('cmp:') || compares[t.slice(4)]);
    return { tabs, active: g.active && tabs.includes(g.active) ? g.active : tabs[0] ?? null, pinned: (g.pinned ?? []).filter((p) => tabs.includes(p)) };
  });
  const nonEmpty = out.filter((g, i) => i === 0 || g.tabs.length);
  return nonEmpty.length ? nonEmpty : [{ tabs: [], active: null }];
}

export default function App() {
  const stored = useMemo(loadStore, []);
  const [files, setFiles] = useState<Record<string, string>>(stored?.files ?? DEFAULT_WORKSPACE.files);
  const [folders, setFolders] = useState<string[]>(stored?.folders ?? DEFAULT_WORKSPACE.folders);
  const [saved, setSaved] = useState<Record<string, string>>(() => ({ ...(stored?.files ?? DEFAULT_WORKSPACE.files) }));
  const [head, setHead] = useState<Record<string, string>>(stored?.head ?? DEFAULT_WORKSPACE.files);
  const [commits, setCommits] = useState<Commit[]>(stored?.commits ?? [{ id: hashId(), message: 'Initial commit', date: Date.now(), files: {}, stats: { added: Object.keys(DEFAULT_WORKSPACE.files).length, modified: 0, deleted: 0 } }]);
  const [settings, setSettings] = useState<Settings>({ ...DEFAULT_SETTINGS, ...(stored?.settings ?? {}) });
  const [compares, setCompares] = useState<Record<string, CompareSpec>>(stored?.compares ?? {});
  const [groups, setGroups] = useState<Group[]>(() => sanitizeGroups(stored?.groups, stored?.compares ?? {}) ?? [{ tabs: ['__welcome__', 'README.md', 'src/main.ts'], active: '__welcome__' }]);
  const [groupSizes, setGroupSizes] = useState<number[]>(() => (Array.isArray(stored?.groupSizes) && stored.groupSizes.length === (stored?.groups?.length ?? 1) ? stored.groupSizes : equalSizes(Math.max(1, stored?.groups?.length ?? 1))));
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [palette, setPalette] = useState<{ mode: PaletteMode; initial?: string } | null>(null);
  const [quickPickState, setQuickPickState] = useState<QuickPickRequest | null>(null);
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
  const [panelMax, setPanelMax] = useState(false);
  const [compareTarget, setCompareTarget] = useState<string | null>(null);
  const [historyVersion, setHistoryVersion] = useState(0);
  const [terminalRequest, setTerminalRequest] = useState<TerminalRequest | null>(null);
  const [searchRequest, setSearchRequest] = useState<{ query?: string; include?: string; id: number } | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(stored?.bookmarks ?? []);

  const editors = useRef<any[]>([]);
  const filesRef = useRef(files); filesRef.current = files;
  const savedRef = useRef(saved); savedRef.current = saved;
  const settingsRef = useRef(settings); settingsRef.current = settings;
  const groupsRef = useRef(groups); groupsRef.current = groups;
  const activeGroupRef = useRef(activeGroup); activeGroupRef.current = activeGroup;
  const langOverrideRef = useRef(langOverride); langOverrideRef.current = langOverride;
  const headRef = useRef(head); headRef.current = head;
  const monacoRef = useRef<any>(null);
  const outId = useRef(0);
  const importRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const zipRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const groupsBoxRef = useRef<HTMLDivElement>(null);
  const closedStack = useRef<string[]>([]);
  const navBack = useRef<NavLocation[]>([]);
  const navFwd = useRef<NavLocation[]>([]);
  const navigating = useRef(false);

  const activeFile = groups[activeGroup]?.active ?? groups[0]?.active ?? null;
  const sizes = groupSizes.length === groups.length ? groupSizes : equalSizes(groups.length);

  // ------------------------------------------------------------------ notifications
  const toast = useCallback((msg: string, type: Toast['type'] = 'info') => {
    const id = Date.now() + Math.random();
    setNotifications((n) => [{ id, msg, type, time: Date.now(), read: false }, ...n].slice(0, 100));
    if (settingsRef.current.doNotDisturb && type !== 'error') return;
    setToasts((t) => [...t.slice(-4), { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  const log = useCallback((type: LogType, text: string) => {
    setOutput((o) => [...o.slice(-3000), { id: ++outId.current, type, text, time: Date.now() }]);
  }, []);
  const setSetting = useCallback(<K extends keyof Settings>(k: K, v: Settings[K]) => setSettings((s) => ({ ...s, [k]: v })), []);

  // ------------------------------------------------------------------ monaco models
  const setMonaco = useCallback((m: any) => {
    if (monacoRef.current) return;
    monacoRef.current = m;
    setMonacoState(m);
    Object.entries(filesRef.current).forEach(([p, c]) => {
      if (!/\.(tsx?|jsx?|mjs|cjs|mts|cts)$/.test(p)) return;
      const uri = m.Uri.parse('file:///' + p);
      if (!m.editor.getModel(uri)) m.editor.createModel(c, /\.[mc]?tsx?$/.test(p) ? 'typescript' : 'javascript', uri);
    });
  }, []);
  const uriOf = (p: string) => monacoRef.current?.Uri.parse('file:///' + p);
  const disposeModel = (p: string) => setTimeout(() => { const m = monacoRef.current?.editor.getModel(uriOf(p)); if (m && !editors.current.some((e) => e?.getModel?.() === m)) m.dispose(); }, 50);
  const syncModel = (p: string, content: string) => {
    const m = monacoRef.current?.editor.getModel(uriOf(p));
    if (m && m.getValue() !== content) m.pushEditOperations([], [{ range: m.getFullModelRange(), text: content }], () => null);
  };

  // ------------------------------------------------------------------ local history
  const snapshot = useCallback((path: string, source: string, content?: string) => {
    const s = settingsRef.current;
    if (!s.localHistory) return;
    const c = content ?? filesRef.current[path];
    if (c == null) return;
    if (hist.addSnapshot(path, c, source, s.localHistoryMax)) setHistoryVersion((v) => v + 1);
  }, []);

  // ------------------------------------------------------------------ groups & tabs
  const setActiveGroup = useCallback((i: number) => setActiveGroupState(i), []);
  const getEditor = useCallback(() => {
    const g = activeGroupRef.current;
    const e = editors.current[g] ?? editors.current[0];
    try { if (e && e.getModel()) return e; } catch { /* disposed */ }
    return null;
  }, []);
  const currentLocation = useCallback((): NavLocation | null => {
    const g = groupsRef.current[activeGroupRef.current];
    const p = g?.active;
    if (!p || isSpecialTab(p)) return null;
    const ed = editors.current[activeGroupRef.current];
    const model = ed?.getModel?.();
    const pos = model && pathOfUri(model.uri) === p ? ed.getPosition() : null;
    return { path: p, line: pos?.lineNumber ?? 1, col: pos?.column ?? 1 };
  }, []);
  const pushNav = useCallback((loc: NavLocation | null) => {
    if (!loc || navigating.current) return;
    const top = navBack.current[navBack.current.length - 1];
    if (top && top.path === loc.path && Math.abs(top.line - loc.line) < 3) return;
    navBack.current.push(loc);
    if (navBack.current.length > 60) navBack.current.shift();
    navFwd.current = [];
  }, []);

  const openFile = useCallback((path: string, group?: number) => {
    const cur = groupsRef.current[activeGroupRef.current]?.active;
    if (cur && cur !== path) pushNav(currentLocation());
    setGroups((gs) => {
      const g = group ?? activeGroupRef.current;
      const next = gs.map((x) => ({ ...x, tabs: [...x.tabs] }));
      if (g >= next.length && next.length < MAX_GROUPS) next.push({ tabs: [], active: null });
      const idx = Math.min(g, next.length - 1);
      if (!next[idx].tabs.includes(path)) {
        const at = next[idx].active ? next[idx].tabs.indexOf(next[idx].active!) + 1 : next[idx].tabs.length;
        next[idx].tabs.splice(Math.max(at, next[idx].pinned?.length ?? 0), 0, path);
      }
      next[idx].active = path;
      setActiveGroupState(idx);
      if (next.length !== gs.length) setGroupSizes(equalSizes(next.length));
      return next;
    });
  }, [currentLocation, pushNav]);

  const removeEmptyGroups = (next: Group[]) => {
    if (next.length <= 1) return next.length ? next : [{ tabs: [], active: null }];
    const kept = next.filter((g, i) => g.tabs.length || (i === 0 && next.every((x) => !x.tabs.length)));
    if (kept.length !== next.length) {
      const final = kept.length ? kept : [{ tabs: [], active: null }];
      setActiveGroupState((a) => Math.min(a, final.length - 1));
      setGroupSizes(equalSizes(final.length));
      editors.current.length = final.length;
      return final;
    }
    return next;
  };

  const closeTab = useCallback((path: string, group?: number) => {
    closedStack.current.push(path);
    if (closedStack.current.length > 30) closedStack.current.shift();
    setGroups((gs) => removeEmptyGroups(gs.map((g, i) => {
      if (group != null && i !== group) return g;
      const idx = g.tabs.indexOf(path);
      if (idx < 0) return g;
      const tabs = g.tabs.filter((t) => t !== path);
      const active = g.active === path ? tabs[Math.min(idx, tabs.length - 1)] ?? null : g.active;
      return { tabs, active, pinned: (g.pinned ?? []).filter((p) => p !== path) };
    })));
  }, []);
  const closeWhere = (group: number, pred: (t: string, i: number, g: Group) => boolean) => {
    setGroups((gs) => removeEmptyGroups(gs.map((g, gi) => {
      if (gi !== group) return g;
      const drop = g.tabs.filter((t, i) => pred(t, i, g) && !(g.pinned ?? []).includes(t));
      closedStack.current.push(...drop);
      const tabs = g.tabs.filter((t) => !drop.includes(t));
      return { tabs, active: tabs.includes(g.active ?? '') ? g.active : tabs[tabs.length - 1] ?? null, pinned: g.pinned };
    })));
  };
  const closeOthers = useCallback((path: string, group: number) => closeWhere(group, (t) => t !== path), []);
  const closeToRight = useCallback((path: string, group: number) => closeWhere(group, (_t, i, g) => i > g.tabs.indexOf(path)), []);
  const closeSaved = useCallback((group?: number) => closeWhere(group ?? activeGroupRef.current, (t) => filesRef.current[t] == null || filesRef.current[t] === savedRef.current[t]), []);
  const closeAll = useCallback(() => {
    setGroups((gs) => {
      const keep = gs.map((g) => ({ tabs: (g.pinned ?? []).slice(), active: (g.pinned ?? [])[0] ?? null, pinned: g.pinned }));
      gs.forEach((g) => closedStack.current.push(...g.tabs.filter((t) => !(g.pinned ?? []).includes(t))));
      const kept = keep.filter((g) => g.tabs.length);
      const final = kept.length ? kept : [{ tabs: [], active: null }];
      setGroupSizes(equalSizes(final.length));
      editors.current.length = final.length;
      return final;
    });
    setActiveGroupState(0);
  }, []);
  const reopenClosed = useCallback(() => {
    while (closedStack.current.length) {
      const p = closedStack.current.pop()!;
      if (filesRef.current[p] != null || p === '__welcome__' || p.startsWith('diff:') || p.startsWith('cmp:')) { openFile(p); return; }
    }
    toast('No recently closed editors', 'info');
  }, [openFile, toast]);
  const togglePin = useCallback((path: string, group: number) => {
    setGroups((gs) => gs.map((g, i) => {
      if (i !== group) return g;
      const pinned = g.pinned ?? [];
      const nowPinned = pinned.includes(path) ? pinned.filter((p) => p !== path) : [...pinned, path];
      const tabs = [...nowPinned.filter((p) => g.tabs.includes(p)), ...g.tabs.filter((t) => !nowPinned.includes(t))];
      return { ...g, tabs, pinned: nowPinned };
    }));
  }, []);
  const moveTab = useCallback((path: string, from: number, to: number, before?: string | null) => {
    setGroups((gs) => {
      let next: Group[] = gs.map((g) => ({ ...g, tabs: [...g.tabs], pinned: [...(g.pinned ?? [])] }));
      if (to >= next.length) {
        if (next.length >= MAX_GROUPS) return gs;
        next.push({ tabs: [], active: null, pinned: [] });
      }
      const src = next[from];
      if (src && from !== to) {
        src.tabs = src.tabs.filter((t) => t !== path);
        src.pinned = (src.pinned ?? []).filter((t) => t !== path);
        if (src.active === path) src.active = src.tabs[src.tabs.length - 1] ?? null;
      }
      const dst = next[to];
      dst.tabs = dst.tabs.filter((t) => t !== path);
      const at = before ? dst.tabs.indexOf(before) : -1;
      dst.tabs.splice(at < 0 ? dst.tabs.length : at, 0, path);
      dst.active = path;
      next = removeEmptyGroups(next);
      const ti = next.indexOf(dst);
      setActiveGroupState(ti < 0 ? 0 : ti);
      if (next.length !== gs.length) setGroupSizes(equalSizes(next.length));
      return next;
    });
  }, []);
  const splitEditor = useCallback(() => {
    const gs = groupsRef.current;
    if (gs.length >= MAX_GROUPS) return toast(`At most ${MAX_GROUPS} editor groups`, 'warn');
    const a = gs[activeGroupRef.current]?.active;
    setGroups((cur) => {
      const next = [...cur];
      next.splice(activeGroupRef.current + 1, 0, { tabs: a ? [a] : [], active: a ?? null, pinned: [] });
      setGroupSizes(equalSizes(next.length));
      return next;
    });
    setActiveGroupState(activeGroupRef.current + 1);
  }, [toast]);
  const closeGroup = useCallback((group: number) => {
    setGroups((gs) => {
      closedStack.current.push(...(gs[group]?.tabs ?? []));
      if (gs.length <= 1) return [{ tabs: [], active: null }];
      const next = gs.filter((_, i) => i !== group);
      setGroupSizes(equalSizes(next.length));
      setActiveGroupState((a) => Math.max(0, Math.min(a >= group ? a - 1 : a, next.length - 1)));
      editors.current.splice(group, 1);
      return next;
    });
  }, []);
  const joinGroups = useCallback(() => {
    setGroups((gs) => {
      const tabs = [...new Set(gs.flatMap((g) => g.tabs))];
      const pinned = [...new Set(gs.flatMap((g) => g.pinned ?? []))];
      const active = gs[activeGroupRef.current]?.active ?? tabs[0] ?? null;
      setGroupSizes([100]);
      editors.current.length = 1;
      return [{ tabs: [...pinned, ...tabs.filter((t) => !pinned.includes(t))], active, pinned }];
    });
    setActiveGroupState(0);
  }, []);

  // ------------------------------------------------------------------ navigation
  const revealAt = useCallback((path: string, line: number, col = 1, endLine?: number, endCol?: number) => {
    const cur = currentLocation();
    if (cur && !(cur.path === path && Math.abs(cur.line - line) < 10)) pushNav(cur);
    const range = { startLineNumber: line, startColumn: col, endLineNumber: endLine ?? line, endColumn: endCol ?? col };
    setPendingReveal(path, range);
    const ed = editors.current[activeGroupRef.current];
    const model = ed?.getModel?.();
    if (model && pathOfUri(model.uri) === path && groupsRef.current[activeGroupRef.current]?.active === path) applyPendingReveal(ed);
    else {
      const wasNav = navigating.current;
      navigating.current = true;
      openFile(path);
      navigating.current = wasNav;
    }
  }, [currentLocation, pushNav, openFile]);
  const navigate = (from: React.MutableRefObject<NavLocation[]>, to: React.MutableRefObject<NavLocation[]>, label: string) => {
    let target = from.current.pop();
    while (target && filesRef.current[target.path] == null) target = from.current.pop();
    if (!target) return toast(`Nothing to go ${label}`, 'info');
    const cur = currentLocation();
    if (cur) to.current.push(cur);
    navigating.current = true;
    try { revealAt(target.path, target.line, target.col); } finally { navigating.current = false; }
  };
  const goBack = useCallback(() => navigate(navBack, navFwd, 'back to'), [revealAt]);
  const goForward = useCallback(() => navigate(navFwd, navBack, 'forward to'), [revealAt]);

  // ------------------------------------------------------------------ files
  const writeFile = useCallback((path: string, content: string, external = false) => {
    const prev = filesRef.current[path];
    if (external && prev != null && prev !== content) snapshot(path, 'Before external change', prev);
    setFiles((f) => (f[path] === content ? f : { ...f, [path]: content }));
    if (settingsRef.current.autoSave) {
      setSaved((s) => ({ ...s, [path]: content }));
      if (!external && prev !== content && Date.now() - hist.lastSnapshotTime(path) > 60_000) snapshot(path, 'Auto-saved', content);
    }
    if (external) { syncModel(path, content); setSaved((s) => ({ ...s, [path]: content })); }
    const parents = parentsOf(path);
    if (parents.length) setFolders((fs) => (parents.every((p) => fs.includes(p)) ? fs : [...new Set([...fs, ...parents])]));
  }, [snapshot]);

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
    if (!skip && settingsRef.current.confirmDelete && !confirm(`Delete ${isFile ? 'file' : 'folder'} "${path}"${!isFile ? ` and its ${affected.length} file(s)` : ''}?\nA copy is kept in Local History.`)) return;
    affected.forEach((p) => snapshot(p, 'Deleted', filesRef.current[p]));
    setFiles((f) => { const n = { ...f }; affected.forEach((p) => delete n[p]); return n; });
    setFolders((fs) => fs.filter((p) => p !== path && !p.startsWith(path + '/')));
    setGroups((gs) => removeEmptyGroups(gs.map((g) => {
      const tabs = g.tabs.filter((t) => !affected.includes(t) && !affected.includes(t.replace(/^diff:/, '')));
      return { tabs, active: tabs.includes(g.active ?? '') ? g.active : tabs[tabs.length - 1] ?? null, pinned: (g.pinned ?? []).filter((p) => tabs.includes(p)) };
    })));
    setBookmarks((b) => b.filter((x) => !affected.includes(x.path)));
    affected.forEach((p) => { disposeModel(p); forgetDetectedLang(p); });
    toast(`Deleted ${path}`);
  }, [toast, snapshot]);

  const renamePath = useCallback((from: string, rawTo: string) => {
    const to = normPath(rawTo);
    if (!to || to === from) return;
    const f = filesRef.current;
    if (f[to] != null) return toast(`"${to}" already exists`, 'error');
    const moves: [string, string][] = f[from] != null ? [[from, to]] : Object.keys(f).filter((p) => p.startsWith(from + '/')).map((p) => [p, to + p.slice(from.length)]);
    const map = (t: string) => moves.find(([a]) => a === t)?.[1] ?? t;
    setFiles((cur) => { const n = { ...cur }; moves.forEach(([a, b]) => { n[b] = n[a]; delete n[a]; }); return n; });
    setSaved((cur) => { const n = { ...cur }; moves.forEach(([a, b]) => { n[b] = n[a]; delete n[a]; }); return n; });
    setFolders((fs) => [...new Set(fs.map((p) => (p === from ? to : p.startsWith(from + '/') ? to + p.slice(from.length) : p)).concat(parentsOf(to)))]);
    setGroups((gs) => gs.map((g) => ({ tabs: g.tabs.map(map), active: g.active ? map(g.active) : null, pinned: (g.pinned ?? []).map(map) })));
    setBookmarks((b) => b.map((x) => ({ ...x, path: map(x.path) })));
    setLangOverrideState((o) => { const n = { ...o }; moves.forEach(([a, b]) => { if (n[a]) { n[b] = n[a]; delete n[a]; } }); return n; });
    hist.renameHistory(from, to);
    setHistoryVersion((v) => v + 1);
    moves.forEach(([a]) => { disposeModel(a); forgetDetectedLang(a); });
    toast(`Renamed to ${to}`, 'success');
  }, [toast]);

  /** Replace a file's text through its model when open (undoable), otherwise directly. */
  const applyText = useCallback((path: string, text: string) => {
    const m = monacoRef.current?.editor.getModel(uriOf(path));
    if (m) {
      if (m.getValue() !== text) {
        const ed = editors.current.find((e) => e?.getModel?.() === m);
        if (ed) { ed.pushUndoStop(); ed.executeEdits('jotqoda.format', [{ range: m.getFullModelRange(), text }]); ed.pushUndoStop(); }
        else m.pushEditOperations([], [{ range: m.getFullModelRange(), text }], () => null);
      }
      setFiles((f) => (f[path] === text ? f : { ...f, [path]: text }));
    } else writeFile(path, text, true);
  }, [writeFile]);

  const resolveLang = (p: string) => (langOverrideRef.current[p] ? getLangById(langOverrideRef.current[p]) : getLang(p, filesRef.current[p]));

  const formatDocument = useCallback(async (p?: string) => {
    const path = p ?? groupsRef.current[activeGroupRef.current]?.active;
    if (!path || filesRef.current[path] == null) { toast('Open a file to format', 'warn'); return false; }
    const lang = resolveLang(path);
    try {
      const res = await formatText(filesRef.current[path], lang, settingsRef.current, path);
      if (res === null) {
        const ed = editors.current.find((e) => { const m = e?.getModel?.(); return m && pathOfUri(m.uri) === path; });
        const action = ed?.getAction('editor.action.formatDocument');
        if (!action) { toast(`No formatter available for ${lang.name}`, 'warn'); return false; }
        await action.run();
        return true;
      }
      if (res.text !== filesRef.current[path]) applyText(path, res.text);
      return true;
    } catch (e: any) {
      toast(String(e?.message ?? e), 'error');
      return false;
    }
  }, [applyText, toast]);

  const saveFile = useCallback((p?: string | null) => {
    const path = p ?? groupsRef.current[activeGroupRef.current]?.active;
    if (!path || filesRef.current[path] == null) return;
    const s = settingsRef.current;
    const finish = () => {
      const content = filesRef.current[path];
      if (content == null) return;
      const cleaned = cleanupWhitespace(content, s, resolveLang(path).monaco === 'markdown');
      if (cleaned !== content) applyText(path, cleaned);
      setSaved((sv) => ({ ...sv, [path]: cleaned }));
      snapshot(path, 'Saved', cleaned);
    };
    if (s.formatOnSave) formatDocument(path).finally(() => setTimeout(finish, 40));
    else finish();
  }, [formatDocument, applyText, snapshot]);
  const saveAll = useCallback(() => {
    const f = filesRef.current;
    Object.keys(f).filter((p) => f[p] !== savedRef.current[p]).forEach((p) => snapshot(p, 'Saved', f[p]));
    setSaved({ ...f });
    toast('All files saved', 'success');
  }, [toast, snapshot]);

  const loadWorkspace = useCallback((fs: Record<string, string>, fo: string[]) => {
    Object.keys(filesRef.current).forEach(disposeModel);
    setFiles(fs); setSaved({ ...fs }); setFolders(fo); setHead({ ...fs });
    setCommits((c) => [...c, { id: hashId(), message: 'Load workspace', date: Date.now(), files: {}, stats: { added: Object.keys(fs).length, modified: 0, deleted: 0 } }]);
    const first = Object.keys(fs).find((p) => /readme|main|index/i.test(p)) ?? Object.keys(fs)[0];
    setGroups([{ tabs: first ? [first] : [], active: first ?? null }]);
    setGroupSizes([100]);
    editors.current.length = 1;
    setBookmarks([]);
    setActiveGroupState(0); setPreviewPath(null);
  }, []);

  // ------------------------------------------------------------------ run
  const stop = useCallback(() => {
    if (!runningRef.current) return;
    stopAll(); setRunning(false); log('warn', 'Execution stopped by user');
  }, [log]);
  const runningRef = useRef(running); runningRef.current = running;

  const run = useCallback(async (p?: string) => {
    const path = p ?? groupsRef.current[activeGroupRef.current]?.active;
    if (!path || isSpecialTab(path) || filesRef.current[path] == null) return toast('Open a file to run', 'warn');
    const lang = resolveLang(path);
    const fs = filesRef.current;
    if (settingsRef.current.clearOutputOnRun) setOutput([]);
    const kind = lang.runnable;
    if (kind && PREVIEW_KINDS.has(kind)) { setPreviewPath(path); log('system', `Opened live preview for ${path}`); return; }
    setPanelOpen(true); setPanelTab('output');
    if (kind === 'json') {
      try { JSON.parse(fs[path]); log('success', `${path} is valid JSON (${Object.keys(JSON.parse(fs[path]) ?? {}).length} top-level keys)`); }
      catch (e: any) { log('error', `Invalid JSON: ${e.message}`); }
      return;
    }
    if (!kind) { log('warn', `No in-browser runtime for ${lang.name}. Runnable: JavaScript, TypeScript, Python, SQL, Lua, Ruby, PHP, Scheme, Prolog, CoffeeScript, Clojure, WebAssembly Text and Brainfuck — plus previews for HTML, Markdown, SVG, Mermaid, Graphviz and CSV.`); return; }
    log('system', `Running ${path} (${lang.name}) — ${new Date().toLocaleTimeString()}`);
    setRunning(true);
    const done = (ok: boolean, ms: number) => { setRunning(false); log(ok ? 'success' : 'error', ok ? `Finished in ${ms.toFixed(1)} ms` : `Process exited with errors (${ms.toFixed(1)} ms)`); };
    try {
      if (kind === 'js' || kind === 'ts') {
        const modules: Record<string, string> = {};
        const m = monacoRef.current ?? (window as any).monaco;
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
      else await runLanguage(kind, path, fs, log, done, () => setOutput([]));
    } catch (e: any) { log('error', String(e?.message ?? e)); setRunning(false); }
  }, [log, toast]);

  const setLangOverride = useCallback((p: string, l: string) => setLangOverrideState((o) => { const n = { ...o }; if (l) n[p] = l; else delete n[p]; return n; }), []);

  // ------------------------------------------------------------------ source control
  const commit = useCallback((message: string) => {
    const f = filesRef.current;
    const h = headRef.current;
    const stats = { added: Object.keys(f).filter((p) => h[p] == null).length, modified: Object.keys(f).filter((p) => h[p] != null && h[p] !== f[p]).length, deleted: Object.keys(h).filter((p) => f[p] == null).length };
    setCommits((c) => [...c, { id: hashId(), message, date: Date.now(), files: {}, stats }]);
    setHead({ ...f });
    setSaved({ ...f });
    toast(`Committed: ${message}`, 'success');
  }, [toast]);
  const discard = useCallback((path: string) => {
    const h = headRef.current;
    if (filesRef.current[path] != null) snapshot(path, 'Before discard');
    if (h[path] == null) deletePath(path, true);
    else writeFile(path, h[path], true);
  }, [deletePath, writeFile, snapshot]);

  // ------------------------------------------------------------------ compare, pickers, history, workspace
  const openCompare = useCallback((left: CompareSide, right: CompareSide, lang?: string) => {
    const id = Math.random().toString(36).slice(2, 10);
    const langId = lang ?? (right.path ? resolveLang(right.path).id : left.path ? resolveLang(left.path).id : 'plaintext');
    setCompares((c) => ({ ...c, [id]: { id, left, right, lang: langId } }));
    openFile('cmp:' + id);
  }, [openFile]);
  const quickPick = useCallback((items: QuickPickItem[], placeholder?: string) => new Promise<QuickPickItem | null>((resolve) => setQuickPickState({ items, placeholder, resolve })), []);
  const restoreSnapshot = useCallback((path: string, id: string) => {
    const e = hist.getSnapshot(path, id);
    if (!e) return toast('Snapshot not found', 'error');
    if (filesRef.current[path] != null) { snapshot(path, 'Before restore'); writeFile(path, e.content, true); }
    else createFile(path, e.content, true);
    toast(`Restored ${basename(path)} from ${new Date(e.time).toLocaleString()}`, 'success');
  }, [snapshot, writeFile, createFile, toast]);
  const deleteSnapshot = useCallback((path: string, id?: string) => { hist.removeSnapshot(path, id); setHistoryVersion((v) => v + 1); }, []);

  const downloadZip = useCallback(async (folder?: string) => {
    try {
      toast('Preparing ZIP…');
      const n = await downloadWorkspaceZip(filesRef.current, foldersRef.current, folder ? basename(folder) : 'jotqoda-workspace', folder);
      toast(`Downloaded ${n} file(s) as ZIP`, 'success');
    } catch (e: any) { toast(e.message, 'error'); }
  }, [toast]);
  const foldersRef = useRef(folders); foldersRef.current = folders;
  const onZip = async (fl: FileList | null) => {
    const f = fl?.[0];
    if (!f) return;
    try {
      const r = await readZip(f);
      if (!Object.keys(r.files).length) throw new Error('The archive contains no text files');
      const replace = confirm(`Import ${Object.keys(r.files).length} file(s) from ${f.name}?\n\nOK = replace the workspace · Cancel = merge into it`);
      if (replace) loadWorkspace(r.files, r.folders);
      else { Object.entries(r.files).forEach(([p, c]) => writeFile(p, c, true)); setFolders((fo) => [...new Set([...fo, ...r.folders])]); }
      toast(`Imported ${Object.keys(r.files).length} file(s)${r.skipped ? `, skipped ${r.skipped} binary/large file(s)` : ''}`, 'success');
    } catch (e: any) { toast(e.message, 'error'); }
  };
  const onFolder = async (fl: FileList | null) => {
    if (!fl?.length) return;
    try {
      const r = await readFolder(fl);
      if (!Object.keys(r.files).length) throw new Error('No text files found in the folder');
      loadWorkspace(r.files, r.folders);
      toast(`Opened folder with ${Object.keys(r.files).length} file(s)${r.skipped ? ` (skipped ${r.skipped})` : ''}`, 'success');
    } catch (e: any) { toast(e.message, 'error'); }
  };

  const requestTerminal = useCallback((req: Omit<TerminalRequest, 'id'>) => {
    setTerminalRequest({ ...req, id: Date.now() + Math.random() });
    setPanelOpen(true); setPanelTab('terminal');
  }, []);
  const openSearch = useCallback((opts: { query?: string; include?: string }) => {
    setSearchRequest({ ...opts, id: Date.now() });
    setSidebarView('search'); setSidebarOpen(true);
  }, []);

  const toggleBookmark = useCallback((p?: string, line?: number) => {
    const path = p ?? groupsRef.current[activeGroupRef.current]?.active;
    if (!path || filesRef.current[path] == null) return toast('Open a file to bookmark', 'warn');
    const ln = line ?? getEditor()?.getPosition()?.lineNumber ?? 1;
    setBookmarks((b) => (b.some((x) => x.path === path && x.line === ln) ? b.filter((x) => !(x.path === path && x.line === ln)) : [...b, { path, line: ln, label: (filesRef.current[path].split('\n')[ln - 1] ?? '').trim().slice(0, 80) }]));
  }, [getEditor, toast]);
  const clearBookmarks = useCallback((p?: string) => setBookmarks((b) => (p ? b.filter((x) => x.path !== p) : [])), []);

  const openPalette = useCallback((mode: PaletteMode, initial?: string) => setPalette({ mode, initial }), []);
  const prompt = useCallback((title: string, def?: string, placeholder?: string) => new Promise<string | null>((resolve) => setPromptState({ title, def, placeholder, resolve })), []);

  const ideBase = {
    files, folders, saved, head, commits, settings, setSetting, groups, activeGroup, setActiveGroup, activeFile, openFile, closeTab, closeOthers, closeAll, splitEditor,
    createFile, createFolder, deletePath, renamePath, writeFile, saveFile, saveAll, loadWorkspace, editors, monaco, setMonaco, getEditor, run, stop, running, output, log,
    clearOutput: () => setOutput([]), panelOpen, setPanelOpen, panelTab, setPanelTab, sidebarView, setSidebarView, sidebarOpen, setSidebarOpen, previewPath,
    setPreviewPath: (p: string | null) => setPreviewPath(p && !isSpecialTab(p) ? p : null), toast, openPalette, prompt, commit, discard, cursor, setCursor, problems, setProblems,
    langOverride, setLangOverride, setSettingsOpen, setShortcutsOpen, zen,
    revealAt, goBack, goForward, togglePin, closeToRight, closeSaved, reopenClosed, moveTab, closeGroup, joinGroups, groupSizes: sizes,
    compares, openCompare, compareTarget, setCompareTarget, quickPick, quickPickState,
    notifications, clearNotifications: () => setNotifications([]), markNotificationsRead: () => setNotifications((n) => (n.some((x) => !x.read) ? n.map((x) => ({ ...x, read: true })) : n)),
    historyOf: hist.historyOf, snapshot, restoreSnapshot, deleteSnapshot, historyVersion,
    downloadZip, importZip: () => zipRef.current?.click(), importFolder: () => folderRef.current?.click(), formatDocument,
    terminalRequest, requestTerminal, searchRequest, openSearch, bookmarks, toggleBookmark, clearBookmarks,
  } as Omit<IDE, 'commands' | 'execCommand'>;
  const ide = ideBase as IDE;
  const kb = settings.keybindings ?? {};
  ide.commands = buildCommands(ide, {
    zen, setZen,
    importWorkspace: () => importRef.current?.click(),
    uploadFiles: () => uploadRef.current?.click(),
  }).map((c) => (Object.prototype.hasOwnProperty.call(kb, c.id) ? { ...c, defaultKey: c.key, key: kb[c.id] || undefined } : { ...c, defaultKey: c.key }));
  ide.execCommand = (id: string) => ideRef.current?.commands.find((c) => c.id === id)?.run();
  ideRef.current = ide;
  if (import.meta.env.DEV) (window as any).__jotqoda = ideRef;

  useEffect(() => { applyUiTheme(getTheme(settings.theme)); monaco?.editor.setTheme(settings.theme); }, [settings.theme, monaco]);
  useEffect(() => {
    const ts = monaco?.languages.typescript;
    if (!ts) return;
    ts.typescriptDefaults.setDiagnosticsOptions({ noSemanticValidation: !settings.typeCheck, diagnosticCodesToIgnore: [1375, 1378, 2792, 7016, 2307] });
    ts.javascriptDefaults.setDiagnosticsOptions({ noSemanticValidation: true });
  }, [settings.typeCheck, monaco]);
  useEffect(() => { if (monaco) configureEmmet(monaco, settings.emmet, settings.emmetJsx); }, [monaco, settings.emmet, settings.emmetJsx]);

  useEffect(() => {
    const t = setTimeout(() => {
      const slimCompares = Object.fromEntries(Object.entries(compares).filter(([id]) => groups.some((g) => g.tabs.includes('cmp:' + id))).map(([id, c]) => [id, { ...c, left: { ...c.left, content: (c.left.content ?? '').length > 100_000 ? undefined : c.left.content }, right: { ...c.right, content: (c.right.content ?? '').length > 100_000 ? undefined : c.right.content } }]));
      try { localStorage.setItem(STORE, JSON.stringify({ files, folders, head, commits, settings, groups, groupSizes: sizes, langOverride, panelOpen, compares: slimCompares, bookmarks })); }
      catch { toast('Browser storage is full — download your workspace as a ZIP to keep a backup', 'error'); }
    }, 400);
    return () => clearTimeout(t);
  }, [files, folders, head, commits, settings, groups, groupSizes, langOverride, panelOpen, compares, bookmarks]);

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
      if ((e.target as HTMLElement)?.closest?.('[data-key-capture]')) return;
      const k = keyString(e);
      const target = e.target as HTMLElement;
      const inForm = (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') && !target.closest('.monaco-editor');
      if (inForm && ['Ctrl+Enter', 'Alt+Z', 'Ctrl+=', 'Ctrl+-', 'Ctrl+0', 'Ctrl+G', 'Ctrl+K', 'Alt+ArrowLeft', 'Alt+ArrowRight'].includes(k)) return;
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
      if (/\.zip$/i.test(f.name)) return onZip(fl);
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
    tools: ['Developer Tools', <ToolsView />], snippets: ['Snippets', <SnippetsView />], extensions: ['Languages & Runtimes', <ExtensionsView />], bookmarks: ['Bookmarks', <BookmarksView />],
  }[sidebarView] as [string, React.ReactNode];

  const modalOpen = !!(palette || quickPickState || promptState || settingsOpen || shortcutsOpen);
  const right = settings.sidebarPosition === 'right';
  const centered = settings.centeredLayout && groups.length === 1 && !previewPath;

  const resizeGroups = (e: React.MouseEvent, i: number) => {
    const start = [...sizes];
    const w = (groupsBoxRef.current?.clientWidth ?? 1000);
    startDrag(e, 'col-resize', (dx) => {
      const d = (dx / w) * 100;
      const a = Math.max(10, start[i - 1] + d);
      const b = Math.max(10, start[i] - (a - start[i - 1]));
      const next = [...start];
      next[i - 1] = start[i - 1] + start[i] - b;
      next[i] = b;
      setGroupSizes(next);
    });
  };

  return (
    <IDEContext.Provider value={ide}>
      <div className="h-screen w-screen flex flex-col bg-[var(--bg)] text-[var(--fg)] overflow-hidden" style={{ fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, sans-serif' }} {...(modalOpen ? { 'data-modal-open': '' } : {})}>
        <input ref={importRef} type="file" accept=".json,.zip" hidden onChange={(e) => { onImport(e.target.files); e.target.value = ''; }} />
        <input ref={uploadRef} type="file" multiple hidden onChange={(e) => { onUpload(e.target.files); e.target.value = ''; }} />
        <input ref={zipRef} type="file" accept=".zip,application/zip" hidden onChange={(e) => { onZip(e.target.files); e.target.value = ''; }} />
        <input ref={folderRef} type="file" hidden multiple {...({ webkitdirectory: '', directory: '' } as any)} onChange={(e) => { onFolder(e.target.files); e.target.value = ''; }} />
        {!zen && <TitleBar />}
        <div className={`flex-1 flex min-h-0 ${right ? 'flex-row-reverse' : ''}`}>
          {!zen && settings.activityBar && <ActivityBar />}
          {!zen && sidebarOpen && (
            <>
              <div className="flex flex-col bg-[var(--side)] shrink-0 min-w-0" style={{ width: sidebarW }}>
                <div className="h-9 flex items-center px-4 text-[11px] uppercase tracking-wider text-[var(--muted)] shrink-0">{sidebar[0]}</div>
                <div className="flex-1 min-h-0">{sidebar[1]}</div>
              </div>
              <div className="sash-v" onMouseDown={(e) => { const w = sidebarW; startDrag(e, 'col-resize', (dx) => setSidebarW(Math.max(170, Math.min(600, w + (right ? -dx : dx))))); }} onDoubleClick={() => setSidebarW(270)} />
            </>
          )}
          <div ref={mainRef} className="flex-1 flex flex-col min-w-0">
            {!(panelOpen && panelMax) && (
              <div className="flex-1 flex min-h-0">
                <div ref={groupsBoxRef} className={`flex-1 flex min-w-0 min-h-0 ${centered ? 'justify-center bg-[var(--side)]' : ''}`}>
                  {groups.map((_, i) => (
                    <Fragment key={i}>
                      {i > 0 && <div className="sash-v" onMouseDown={(e) => resizeGroups(e, i)} onDoubleClick={() => setGroupSizes(equalSizes(groups.length))} />}
                      <div className={`min-w-0 h-full ${i > 0 ? 'border-l border-[var(--border)]' : ''}`} style={centered ? { width: 'min(100%, 1100px)' } : { flex: `${sizes[i]} 1 0%` }}><EditorGroup index={i} /></div>
                    </Fragment>
                  ))}
                </div>
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
        {!zen && settings.statusBar && <StatusBar />}

        {zen && (
          <button onClick={() => setZen(false)} className="fixed top-3 right-5 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] bg-[var(--side)]/90 border border-[var(--border)] opacity-40 hover:opacity-100 transition-opacity">
            <Minimize2 size={13} /> Exit Zen (Ctrl+Alt+Z)
          </button>
        )}

        {palette && !quickPickState && <CommandPalette mode={palette.mode} initial={palette.initial} onClose={() => { setPalette(null); setTimeout(() => getEditor()?.focus(), 10); }} />}
        {quickPickState && <CommandPalette mode="quickpick" onClose={() => { quickPickState.resolve(null); setQuickPickState(null); setTimeout(() => getEditor()?.focus(), 10); }} onPick={(item) => { setQuickPickState(null); quickPickState.resolve(item); }} />}
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
