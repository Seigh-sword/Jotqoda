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
  // editor (extended)
  rulers: string;
  wordWrapColumn: number;
  fontWeight: 'normal' | '300' | '500' | '600' | 'bold';
  letterSpacing: number;
  cursorSurroundingLines: number;
  multiCursorModifier: 'alt' | 'ctrlCmd';
  renderControlCharacters: boolean;
  occurrencesHighlight: boolean;
  selectionHighlight: boolean;
  autoClosingQuotes: boolean;
  autoSurround: boolean;
  links: boolean;
  hover: boolean;
  glyphMargin: boolean;
  minimapSide: 'right' | 'left';
  minimapRenderCharacters: boolean;
  acceptSuggestionOnEnter: 'on' | 'smart' | 'off';
  tabCompletion: 'off' | 'on' | 'onlySnippets';
  wordBasedSuggestions: 'off' | 'currentDocument' | 'matchingDocuments' | 'allDocuments';
  snippetSuggestions: 'top' | 'bottom' | 'inline' | 'none';
  formatOnType: boolean;
  copyWithSyntaxHighlighting: boolean;
  // files
  trimTrailingWhitespace: boolean;
  insertFinalNewline: boolean;
  trimFinalNewlines: boolean;
  autoDetectLanguage: boolean;
  localHistory: boolean;
  localHistoryMax: number;
  // formatting
  prettier: boolean;
  prettierPrintWidth: number;
  prettierSemi: boolean;
  prettierSingleQuote: boolean;
  prettierTrailingComma: 'all' | 'es5' | 'none';
  sqlKeywordCase: 'upper' | 'lower' | 'preserve';
  emmet: boolean;
  emmetJsx: boolean;
  // workbench
  sidebarPosition: 'left' | 'right';
  activityBar: boolean;
  statusBar: boolean;
  centeredLayout: boolean;
  terminalFontSize: number;
  doNotDisturb: boolean;
  keybindings: Record<string, string>;
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
  rulers: '',
  wordWrapColumn: 80,
  fontWeight: 'normal',
  letterSpacing: 0,
  cursorSurroundingLines: 0,
  multiCursorModifier: 'alt',
  renderControlCharacters: true,
  occurrencesHighlight: true,
  selectionHighlight: true,
  autoClosingQuotes: true,
  autoSurround: true,
  links: true,
  hover: true,
  glyphMargin: true,
  minimapSide: 'right',
  minimapRenderCharacters: false,
  acceptSuggestionOnEnter: 'on',
  tabCompletion: 'off',
  wordBasedSuggestions: 'matchingDocuments',
  snippetSuggestions: 'inline',
  formatOnType: false,
  copyWithSyntaxHighlighting: true,
  trimTrailingWhitespace: false,
  insertFinalNewline: false,
  trimFinalNewlines: false,
  autoDetectLanguage: true,
  localHistory: true,
  localHistoryMax: 30,
  prettier: true,
  prettierPrintWidth: 80,
  prettierSemi: true,
  prettierSingleQuote: false,
  prettierTrailingComma: 'all',
  sqlKeywordCase: 'upper',
  emmet: true,
  emmetJsx: false,
  sidebarPosition: 'left',
  activityBar: true,
  statusBar: true,
  centeredLayout: false,
  terminalFontSize: 13,
  doNotDisturb: false,
  keybindings: {},
};

export interface Group { tabs: string[]; active: string | null; pinned?: string[] }
export interface Commit { id: string; message: string; date: number; files: Record<string, string>; stats: { added: number; modified: number; deleted: number } }
export interface OutputLine { id: number; type: LogType; text: string; time: number }
export interface Problem { path: string; line: number; col: number; message: string; severity: 'error' | 'warning' | 'info' | 'todo'; source?: string }
export interface Command { id: string; label: string; category: string; key?: string; defaultKey?: string; hint?: string; run: () => void; when?: () => boolean }
export type SidebarView = 'explorer' | 'search' | 'git' | 'run' | 'tools' | 'snippets' | 'extensions' | 'bookmarks';
export type PanelTab = 'terminal' | 'output' | 'problems' | 'todos';
export type PaletteMode = 'files' | 'commands' | 'line' | 'theme' | 'language' | 'template' | 'symbols' | 'workspaceSymbols' | 'quickpick';

export interface QuickPickItem { id?: string; label: string; description?: string; detail?: string; icon?: string; picked?: boolean; run?: () => void }
export interface QuickPickRequest { placeholder?: string; items: QuickPickItem[]; resolve: (item: QuickPickItem | null) => void }
export interface Notification { id: number; msg: string; type: 'info' | 'success' | 'error' | 'warn'; time: number; read: boolean }
export interface HistoryEntry { id: string; time: number; content: string; source: string }
/** A side of a comparison: workspace file, saved/HEAD version, local history snapshot, clipboard or literal text. */
export interface CompareSide { label: string; path?: string; kind: 'file' | 'saved' | 'head' | 'history' | 'text'; content?: string }
export interface CompareSpec { id: string; left: CompareSide; right: CompareSide; lang: string }
export interface NavLocation { path: string; line: number; col: number }
export interface Bookmark { path: string; line: number; label?: string }
export interface TerminalRequest { id: number; cwd?: string; command?: string; newTerminal?: boolean }

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
  // navigation
  revealAt: (path: string, line: number, col?: number, endLine?: number, endCol?: number) => void;
  goBack: () => void;
  goForward: () => void;
  // tabs & groups
  togglePin: (path: string, group: number) => void;
  closeToRight: (path: string, group: number) => void;
  closeSaved: (group?: number) => void;
  reopenClosed: () => void;
  moveTab: (path: string, from: number, to: number, before?: string | null) => void;
  closeGroup: (group: number) => void;
  joinGroups: () => void;
  groupSizes: number[];
  // compare
  compares: Record<string, CompareSpec>;
  openCompare: (left: CompareSide, right: CompareSide, lang?: string) => void;
  compareTarget: string | null;
  setCompareTarget: (p: string | null) => void;
  // pickers & notifications
  quickPick: (items: QuickPickItem[], placeholder?: string) => Promise<QuickPickItem | null>;
  quickPickState: QuickPickRequest | null;
  notifications: Notification[];
  clearNotifications: () => void;
  markNotificationsRead: () => void;
  // local history
  historyOf: (path: string) => HistoryEntry[];
  snapshot: (path: string, source: string, content?: string) => void;
  restoreSnapshot: (path: string, id: string) => void;
  deleteSnapshot: (path: string, id?: string) => void;
  historyVersion: number;
  // workspace
  downloadZip: (folder?: string) => void;
  importZip: () => void;
  importFolder: () => void;
  formatDocument: (path?: string) => Promise<boolean>;
  // terminal & search
  terminalRequest: TerminalRequest | null;
  requestTerminal: (req: Omit<TerminalRequest, 'id'>) => void;
  searchRequest: { query?: string; include?: string; id: number } | null;
  openSearch: (opts: { query?: string; include?: string }) => void;
  // bookmarks
  bookmarks: Bookmark[];
  toggleBookmark: (path?: string, line?: number) => void;
  clearBookmarks: (path?: string) => void;
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
export const isSpecialTab = (p: string) => p.startsWith('diff:') || p.startsWith('cmp:') || p.startsWith('__');
