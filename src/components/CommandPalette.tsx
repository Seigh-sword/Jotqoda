import { useEffect, useMemo, useRef, useState } from 'react';
import { useIDE, basename, dirname, type PaletteMode, type QuickPickItem } from '../ide/types';
import { THEMES } from '../ide/themes';
import { LANGUAGES, getLang, getLangById } from '../ide/languages';
import { WORKSPACE_TEMPLATES } from '../ide/templates';
import { workspaceSymbols } from '../ide/monacoSetup';
import { documentSymbols } from '../ide/outline';
import { flattenSymbols, type Sym } from '../ide/symbols';
import { FileIcon, Kbd, SymbolIcon } from './FileIcon';

interface Item { id: string; label: string; detail?: string; key?: string; icon?: React.ReactNode; run: () => void; preview?: () => void; group?: string }

export function fuzzy(q: string, s: string): number[] | null {
  if (!q) return [];
  const ql = q.toLowerCase(), sl = s.toLowerCase();
  const idx = sl.indexOf(ql);
  if (idx >= 0) return Array.from({ length: ql.length }, (_, i) => idx + i);
  const out: number[] = [];
  let j = 0;
  for (let i = 0; i < sl.length && j < ql.length; i++) if (sl[i] === ql[j]) { out.push(i); j++; }
  return j === ql.length ? out : null;
}
/** Higher is better: contiguous & prefix matches first. */
function score(q: string, s: string) {
  if (!q) return 1;
  const sl = s.toLowerCase(), ql = q.toLowerCase();
  if (sl === ql) return 100;
  if (sl.startsWith(ql)) return 80 - sl.length / 100;
  const i = sl.indexOf(ql);
  if (i >= 0) return 60 - i / 10;
  return fuzzy(q, s) ? 20 - s.length / 100 : 0;
}

function Hl({ text, idx }: { text: string; idx: number[] }) {
  const set = new Set(idx);
  return <>{[...text].map((c, i) => (set.has(i) ? <b key={i} className="text-[var(--accent)]">{c}</b> : c))}</>;
}

const RECENT_KEY = 'jotqoda-recent-cmds';
const PREFIX: Record<string, PaletteMode> = { '>': 'commands', ':': 'line', '@': 'symbols', '#': 'workspaceSymbols' };

export function CommandPalette({ mode: initialMode, initial, onClose, onPick }: { mode: PaletteMode; initial?: string; onClose: () => void; onPick?: (item: QuickPickItem) => void }) {
  const ide = useIDE();
  const prefixFor: Partial<Record<PaletteMode, string>> = { commands: '>', line: ':', symbols: '@', workspaceSymbols: '#' };
  const [q, setQ] = useState(initial ?? prefixFor[initialMode] ?? '');
  const [sel, setSel] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const origTheme = useRef(ide.settings.theme);
  const [fixedMode] = useState<PaletteMode | null>(['theme', 'language', 'template', 'quickpick'].includes(initialMode) ? initialMode : null);
  const [docSyms, setDocSyms] = useState<Sym[] | null>(null);
  const origPos = useRef<{ ed: any; pos: any; top: number } | null>(null);

  const mode: PaletteMode = fixedMode ?? PREFIX[q[0]] ?? 'files';
  const query = fixedMode ? q : q.replace(/^[>:@#]/, '').trim();

  useEffect(() => {
    if (mode !== 'symbols' || docSyms) return;
    const f = ide.activeFile;
    const ed = ide.getEditor();
    if (ed && !origPos.current) origPos.current = { ed, pos: ed.getPosition(), top: ed.getScrollTop() };
    if (!f || ide.files[f] == null) { setDocSyms([]); return; }
    documentSymbols(ide, f).then(setDocSyms).catch(() => setDocSyms([]));
  }, [mode]);

  const wsSyms = useMemo(() => (mode === 'workspaceSymbols' ? workspaceSymbols(ide.files, ide.langOverride) : []), [mode, ide.files]);

  const items: (Item & { idx: number[] })[] = useMemo(() => {
    let base: Item[] = [];
    if (mode === 'quickpick') {
      const st = ide.quickPickState;
      base = (st?.items ?? []).map((it, i) => ({ id: it.id ?? String(i), label: it.label, detail: it.description ?? it.detail, icon: it.icon ? <span className="w-4 text-center">{it.icon}</span> : undefined, run: () => onPick?.(it) }));
    }
    if (mode === 'files') {
      const recent = ide.groups.flatMap((g) => g.tabs).filter((p) => ide.files[p] != null);
      const all = Object.keys(ide.files).sort((a, b) => (recent.indexOf(b) - recent.indexOf(a)) || a.localeCompare(b));
      base = all.map((p) => ({ id: p, label: basename(p), detail: dirname(p), icon: <FileIcon path={p} />, run: () => ide.openFile(p) }));
      if (query) {
        const [name, line] = query.split(':');
        return base
          .map((it) => ({ ...it, idx: fuzzy(name, it.label) ?? [], s: Math.max(score(name, it.label) * 2, score(name, it.id)) }))
          .filter((x) => x.s > 0)
          .sort((a, b) => b.s - a.s)
          .slice(0, 100)
          .map((x) => (line && /^\d+$/.test(line) ? { ...x, detail: `${x.detail ? x.detail + ' · ' : ''}line ${line}`, run: () => ide.revealAt(x.id, +line) } : x));
      }
      return base.slice(0, 100).map((b) => ({ ...b, idx: [] }));
    }
    if (mode === 'commands') {
      const recent: string[] = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
      base = ide.commands.filter((c) => !c.when || c.when()).map((c) => ({
        id: c.id, label: `${c.category}: ${c.label}`, key: c.key ?? c.hint, detail: recent.includes(c.id) && !query ? 'recently used' : undefined,
        run: () => { localStorage.setItem(RECENT_KEY, JSON.stringify([c.id, ...recent.filter((r) => r !== c.id)].slice(0, 8))); c.run(); },
      }));
      if (!query) base.sort((a, b) => { const ia = recent.indexOf(a.id), ib = recent.indexOf(b.id); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib); });
      else return base.map((it) => ({ ...it, idx: fuzzy(query, it.label) ?? [], s: score(query, it.label) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s);
    }
    if (mode === 'line') {
      const ed = ide.getEditor();
      const n = parseInt(query);
      const count = ed?.getModel()?.getLineCount() ?? 0;
      return [{
        id: 'line', idx: [], label: !ed ? 'Open a file first' : isNaN(n) ? `Type a line number between 1 and ${count} (optionally :col)` : `Go to line ${n}${query.includes(':') ? ', column ' + query.split(':')[1] : ''}`,
        run: () => { if (!ed || isNaN(n) || !ide.activeFile) return; const col = parseInt(query.split(':')[1]) || 1; ide.revealAt(ide.activeFile, Math.min(n, count), col); },
      }];
    }
    if (mode === 'symbols') {
      const f = ide.activeFile;
      if (!docSyms) return [{ id: 'loading', idx: [], label: 'Loading symbols…', run: () => {} }];
      const flat = flattenSymbols(docSyms);
      if (!flat.length) return [{ id: 'none', idx: [], label: f ? `No symbols found in ${basename(f)}` : 'Open a file first', run: () => {} }];
      const ed = ide.getEditor();
      base = flat.map((s, i) => ({
        id: `${s.name}:${s.line}:${i}`, label: s.name, detail: s.container || s.detail, icon: <SymbolIcon kind={s.kind} />, key: `:${s.line}`,
        run: () => f && ide.revealAt(f, s.line, s.col, s.line, s.col + s.name.length),
        preview: () => { if (ed) { ed.revealLineInCenterIfOutsideViewport(s.line); ed.setSelection({ startLineNumber: s.line, startColumn: s.col, endLineNumber: s.line, endColumn: s.col + s.name.length }); } },
      }));
      if (query) return base.map((it) => ({ ...it, idx: fuzzy(query, it.label) ?? [], s: score(query, it.label) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s);
    }
    if (mode === 'workspaceSymbols') {
      if (!query) return [{ id: 'hint', idx: [], label: `Type to search ${wsSyms.length} symbols across ${Object.keys(ide.files).length} files`, run: () => {} }];
      return wsSyms
        .map((s) => ({ s, sc: score(query, s.name) }))
        .filter((x) => x.sc > 0)
        .sort((a, b) => b.sc - a.sc)
        .slice(0, 200)
        .map(({ s }, i) => ({ id: `${s.path}:${s.line}:${i}`, label: s.name, idx: fuzzy(query, s.name) ?? [], detail: `${s.path}:${s.line}${s.container ? ' · ' + s.container : ''}`, icon: <SymbolIcon kind={s.kind} />, run: () => ide.revealAt(s.path, s.line, s.col, s.line, s.col + s.name.length) }));
    }
    if (mode === 'theme') {
      base = THEMES.map((t) => ({ id: t.id, label: t.name, detail: t.base === 'vs' ? 'light' : t.base === 'hc-black' ? 'high contrast' : 'dark', icon: <span className="w-4 h-4 rounded-sm border border-[var(--border)] flex overflow-hidden"><span className="flex-1" style={{ background: t.ui.bg }} /><span className="w-1.5" style={{ background: t.ui.accent }} /></span>, run: () => { origTheme.current = t.id; ide.setSetting('theme', t.id); }, preview: () => ide.setSetting('theme', t.id) }));
    }
    if (mode === 'language') {
      const f = ide.activeFile;
      const cur = f ? (ide.langOverride[f] ?? getLang(f, ide.files[f]).id) : '';
      const detected = f ? getLang(f, ide.files[f]) : null;
      base = [
        ...(f && ide.langOverride[f] ? [{ id: '__auto', label: `Auto Detect (${detected?.name})`, detail: 'remove the language override', run: () => ide.setLangOverride(f, '') }] : []),
        ...[...LANGUAGES].sort((a, b) => (a.id === cur ? -1 : b.id === cur ? 1 : a.name.localeCompare(b.name))).map((l) => ({
          id: l.id, label: l.name, detail: `${l.category}${l.exts.length ? ' · ' + l.exts.slice(0, 4).map((e) => '.' + e).join(' ') : ''}${l.id === cur ? ' · current' : ''}`,
          icon: <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: l.color }} />,
          run: () => f && ide.setLangOverride(f, l.id),
        })),
      ];
      if (query) return base.map((it) => ({ ...it, idx: fuzzy(query, it.label) ?? [], s: Math.max(score(query, it.label), score(query, getLangById(it.id).aliases.join(' ')) * 0.9, score(query, getLangById(it.id).exts.join(' ')) * 0.8) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s);
    }
    if (mode === 'template') {
      base = Object.entries(WORKSPACE_TEMPLATES).map(([k, t]) => ({ id: k, label: t.name, detail: t.desc, run: () => ide.execCommand('template.' + k) }));
    }
    return base.map((it) => ({ ...it, idx: fuzzy(query, it.label) as number[] })).filter((it) => it.idx !== null);
  }, [mode, query, ide.files, ide.commands, docSyms, wsSyms, ide.quickPickState]);

  useEffect(() => { setSel(0); }, [q]);
  useEffect(() => {
    listRef.current?.children[sel]?.scrollIntoView({ block: 'nearest' });
    items[sel]?.preview?.();
  }, [sel, items]);

  const restore = () => {
    const o = origPos.current;
    if (o && mode === 'symbols') { o.ed.setPosition(o.pos); o.ed.setScrollTop(o.top); }
  };
  const close = (revert = true) => { if (mode === 'theme' && revert) ide.setSetting('theme', origTheme.current); if (revert) restore(); onClose(); };
  const choose = (i: number) => {
    const it = items[i];
    if (!it) return;
    if (mode === 'quickpick') { it.run(); return; }
    onClose();
    setTimeout(it.run, 0);
  };

  const placeholder: Record<PaletteMode, string> = {
    files: 'Search files by name (append :line) · > commands · : line · @ symbols · # workspace symbols',
    commands: '', line: '', symbols: '', workspaceSymbols: '',
    theme: 'Select Color Theme (↑↓ to preview)', language: `Select Language Mode (${LANGUAGES.length} languages)`, template: 'Select a workspace template (replaces current files)',
    quickpick: ide.quickPickState?.placeholder ?? 'Select an option',
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center pt-[10vh]" onMouseDown={() => close()}>
      <div className="w-[680px] max-w-[92vw] h-fit rounded-lg shadow-2xl border border-[var(--border)] bg-[var(--side)] overflow-hidden" onMouseDown={(e) => e.stopPropagation()}>
        <div className="p-2">
          <input
            autoFocus
            value={q}
            placeholder={placeholder[mode]}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(items.length - 1, s + 1)); }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
              else if (e.key === 'PageDown') { e.preventDefault(); setSel((s) => Math.min(items.length - 1, s + 10)); }
              else if (e.key === 'PageUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 10)); }
              else if (e.key === 'Enter') { e.preventDefault(); if (mode === 'theme') { origTheme.current = items[sel]?.id ?? origTheme.current; } choose(sel); }
              else if (e.key === 'Escape') { e.preventDefault(); close(); }
            }}
            className="w-full h-8 px-2 text-[13px] bg-[var(--input)] border border-[var(--accent)] rounded-sm outline-none"
          />
        </div>
        <div ref={listRef} className="max-h-[50vh] overflow-auto pb-1">
          {items.map((it, i) => (
            <div
              key={it.id + i}
              onMouseMove={() => sel !== i && setSel(i)}
              onClick={() => { if (mode === 'theme') origTheme.current = it.id; choose(i); }}
              className={`flex items-center gap-2 px-3 h-[26px] cursor-pointer text-[13px] ${i === sel ? 'bg-[var(--accent)]/30 text-[var(--fg)]' : ''}`}
            >
              {it.icon}
              <span className="truncate shrink-0 max-w-[60%]"><Hl text={it.label} idx={it.idx} /></span>
              {it.detail && <span className="text-[11px] text-[var(--muted)] truncate">{it.detail}</span>}
              <span className="flex-1" />
              {it.key && (it.key.startsWith(':') ? <span className="text-[11px] text-[var(--muted)] font-mono">{it.key}</span> : <Kbd>{it.key}</Kbd>)}
            </div>
          ))}
          {!items.length && <div className="px-3 py-2 text-[13px] text-[var(--muted)]">No matching results</div>}
        </div>
        {mode === 'files' && !query && <div className="px-3 py-1.5 text-[11px] text-[var(--muted)] border-t border-[var(--border)]">{Object.keys(ide.files).length} files · {ide.activeFile ? getLang(ide.activeFile).name : 'no file open'} · {LANGUAGES.length} languages supported</div>}
      </div>
    </div>
  );
}
