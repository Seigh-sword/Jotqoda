import { createContext, useContext } from 'react';
import type { LogType } from './runner';

export interface Settings {
  theme: string;
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  tabSize: number;
  insertSpaces: boolean;
  wordWrap: boolean;
  minimap: boolean;
  lineNumbers: 'on' | 'off' | 'relative';
  renderWhitespace: 'none' | 'boundary' | 'all';
  cursorStyle: 'line' | 'block' | 'underline' | 'line-thin';
  cursorBlinking: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid';
  smoothCaret: boolean;
  smoothScrolling: boolean;
  bracketPairs: boolean;
  indentGuides: boolean;
  stickyScroll: boolean;
  ligatures: boolean;
  autoSave: boolean;
  formatOnSave: boolean;
  formatOnPaste: boolean;
  folding: boolean;
  autoClosingBrackets: boolean;
  mouseWheelZoom: boolean;
  renderLineHighlight: 'all' | 'line' | 'none' | 'gutter';
  scrollBeyondLastLine: boolean;
  linkedEditing: boolean;
  quickSuggestions: boolean;
  parameterHints: boolean;
  colorDecorators: boolean;
  previewAutoRefresh: boolean;
  clearOutputOnRun: boolean;
  confirmDelete: boolean;
  showBreadcrumbs: boolean;
  typeCheck: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'jotqoda-dark',
  fontSize: 14,
  fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
  lineHeight: 22,
  tabSize: 2,
  insertSpaces: true,
  wordWrap: false,
  minimap: true,
  lineNumbers: 'on',
  renderWhitespace: 'none',
  cursorStyle: 'line',
  cursorBlinking: 'smooth',
  smoothCaret: true,
  smoothScrolling: true,
  bracketPairs: true,
  indentGuides: true,
  stickyScroll: true,
  ligatures: true,
  autoSave: true,
  formatOnSave: false,
  formatOnPaste: false,
  folding: true,
  autoClosingBrackets: true,
  mouseWheelZoom: true,
  renderLineHighlight: 'all',
  scrollBeyondLastLine: false,
  linkedEditing: true,
  quickSuggestions: true,
  parameterHints: true,
  colorDecorators: true,
  previewAutoRefresh: true,
  clearOutputOnRun: true,
  confirmDelete: true,
  showBreadcrumbs: true,
  typeCheck: true,
};

export interface Group { tabs: string[]; active: string | null }
export interface Commit { id: string; message: string; date: number; files: Record<string, string>; stats: { added: number; modified: number; deleted: number } }
export interface OutputLine { id: number; type: LogType; text: string; time: number }
export interface Problem { path: string; line: number; col: number; message: string; severity: 'error' | 'warning' | 'info' | 'todo'; source?: string }
export interface Command { id: string; label: string; category: string; key?: string; hint?: string; run: () => void; when?: () => boolean }
export type SidebarView = 'explorer' | 'search' | 'git' | 'run' | 'tools' | 'snippets' | 'extensions';
export type PanelTab = 'terminal' | 'output' | 'problems' | 'todos';
export type PaletteMode = 'files' | 'commands' | 'line' | 'theme' | 'language' | 'template' | 'symbols';

export interface IDE {
  files: Record<string, string>;
  folders: string[];
  saved: Record<string, string>;
  head: Record<string, string>;
  commits: Commit[];
  settings: Settings;
  setSetting: <K extends keyof Settings>(k: K, v: Settings[K]) => void;
  groups: Group[];
  activeGroup: number;
  setActiveGroup: (i: number) => void;
  activeFile: string | null;
  openFile: (path: string, group?: number) => void;
  closeTab: (path: string, group?: number) => void;
  closeOthers: (path: string, group: number) => void;
  closeAll: () => void;
  splitEditor: () => void;
  createFile: (path: string, content?: string, open?: boolean) => boolean;
  createFolder: (path: string) => void;
  deletePath: (path: string, skipConfirm?: boolean) => void;
  renamePath: (from: string, to: string) => void;
  writeFile: (path: string, content: string, external?: boolean) => void;
  saveFile: (path?: string | null) => void;
  saveAll: () => void;
  loadWorkspace: (files: Record<string, string>, folders: string[]) => void;
  editors: React.MutableRefObject<any[]>;
  monaco: any;
  setMonaco: (m: any) => void;
  getEditor: () => any;
  run: (path?: string) => void;
  stop: () => void;
  running: boolean;
  output: OutputLine[];
  log: (type: LogType, text: string) => void;
  clearOutput: () => void;
  panelOpen: boolean;
  setPanelOpen: (b: boolean) => void;
  panelTab: PanelTab;
  setPanelTab: (t: PanelTab) => void;
  sidebarView: SidebarView;
  setSidebarView: (v: SidebarView) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (b: boolean) => void;
  previewPath: string | null;
  setPreviewPath: (p: string | null) => void;
  toast: (msg: string, type?: 'info' | 'success' | 'error' | 'warn') => void;
  openPalette: (mode: PaletteMode, initial?: string) => void;
  prompt: (title: string, def?: string, placeholder?: string) => Promise<string | null>;
  commit: (msg: string) => void;
  discard: (path: string) => void;
  commands: Command[];
  execCommand: (id: string) => void;
  cursor: { line: number; col: number; sel: number; selLines: number };
  setCursor: (c: IDE['cursor']) => void;
  problems: Problem[];
  setProblems: (p: Problem[]) => void;
  langOverride: Record<string, string>;
  setLangOverride: (path: string, lang: string) => void;
  setSettingsOpen: (b: boolean) => void;
  setShortcutsOpen: (b: boolean) => void;
  zen: boolean;
}

export const IDEContext = createContext<IDE>(null as any);
export const useIDE = () => useContext(IDEContext);

export const dirname = (p: string) => (p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '');
export const basename = (p: string) => p.split('/').pop() ?? p;
export const joinPath = (...parts: string[]) => parts.filter(Boolean).join('/').replace(/\/+/g, '/').replace(/^\//, '');
export const normPath = (p: string) => {
  const out: string[] = [];
  for (const s of p.split('/')) { if (!s || s === '.') continue; if (s === '..') out.pop(); else out.push(s); }
  return out.join('/');
};
export const isSpecialTab = (p: string) => p.startsWith('diff:') || p.startsWith('__');
