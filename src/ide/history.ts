/**
 * Local History (Timeline): snapshots of file contents kept in localStorage,
 * independent of Source Control. Quota-safe — oldest snapshots are evicted when
 * the history budget is exceeded or the browser refuses to store more.
 */
import type { HistoryEntry } from './types';

const KEY = 'jotqoda-history';
/** Max characters kept in history (localStorage is ~5M UTF-16 chars per origin, shared with the workspace). */
const BUDGET = 1_200_000;
const MAX_FILE = 250_000;

type Store = Record<string, HistoryEntry[]>;
let store: Store | null = null;

function load(): Store {
  if (!store) {
    try {
      store = JSON.parse(localStorage.getItem(KEY) || '{}') ?? {};
    } catch {
      store = {};
    }
  }
  return store!;
}

function size(s: Store) {
  let n = 0;
  for (const list of Object.values(s)) for (const e of list) n += e.content.length + 64;
  return n;
}

function evictOldest(s: Store) {
  let oldest: { path: string; idx: number; time: number } | null = null;
  for (const [path, list] of Object.entries(s)) {
    list.forEach((e, idx) => {
      if (!oldest || e.time < oldest.time) oldest = { path, idx, time: e.time };
    });
  }
  if (!oldest) return false;
  const o = oldest as { path: string; idx: number };
  s[o.path].splice(o.idx, 1);
  if (!s[o.path].length) delete s[o.path];
  return true;
}

function persist() {
  const s = load();
  let total = size(s);
  while (total > BUDGET && evictOldest(s)) total = size(s);
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
      return;
    } catch {
      // quota exceeded: drop a chunk of the oldest snapshots and retry
      const n = Math.max(1, Math.ceil(Object.values(s).reduce((a, l) => a + l.length, 0) / 4));
      for (let i = 0; i < n; i++) if (!evictOldest(s)) break;
    }
  }
}

/** Snapshots for a file, newest first. */
export function historyOf(path: string): HistoryEntry[] {
  return [...(load()[path] ?? [])].sort((a, b) => b.time - a.time);
}

export function lastSnapshotTime(path: string): number {
  const list = load()[path];
  return list?.length ? Math.max(...list.map((e) => e.time)) : 0;
}

/** Add a snapshot. Returns false when skipped (identical to the latest or too large). */
export function addSnapshot(path: string, content: string, source: string, max: number): boolean {
  if (content.length > MAX_FILE) return false;
  const s = load();
  const list = (s[path] ??= []);
  const latest = list.reduce<HistoryEntry | null>((a, e) => (!a || e.time > a.time ? e : a), null);
  if (latest && latest.content === content) return false;
  list.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7), time: Date.now(), content, source });
  list.sort((a, b) => a.time - b.time);
  while (list.length > Math.max(1, max)) list.shift();
  persist();
  return true;
}

export function getSnapshot(path: string, id: string): HistoryEntry | undefined {
  return load()[path]?.find((e) => e.id === id);
}

export function removeSnapshot(path: string, id?: string) {
  const s = load();
  if (!s[path]) return;
  if (id) s[path] = s[path].filter((e) => e.id !== id);
  if (!id || !s[path].length) delete s[path];
  persist();
}

export function renameHistory(from: string, to: string) {
  const s = load();
  for (const key of Object.keys(s)) {
    if (key === from || key.startsWith(from + '/')) {
      const target = to + key.slice(from.length);
      s[target] = [...(s[target] ?? []), ...s[key]];
      delete s[key];
    }
  }
  persist();
}

/** Paths that have snapshots. */
export function historyPaths(): string[] {
  return Object.keys(load());
}

export function historyStats() {
  const s = load();
  return { files: Object.keys(s).length, snapshots: Object.values(s).reduce((a, l) => a + l.length, 0), chars: size(s) };
}

export function clearAllHistory() {
  store = {};
  persist();
}
