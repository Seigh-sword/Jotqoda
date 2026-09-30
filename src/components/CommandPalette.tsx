import { useEffect, useMemo, useRef, useState } from 'react';
import { useIDE, basename, dirname, type PaletteMode } from '../ide/types';
import { THEMES } from '../ide/themes';
import { LANGUAGES, getLang } from '../ide/languages';
import { WORKSPACE_TEMPLATES } from '../ide/templates';
import { FileIcon, Kbd } from './FileIcon';

interface Item { id: string; label: string; detail?: string; key?: string; icon?: React.ReactNode; run: () => void; preview?: () => void }

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

function Hl({ text, idx }: { text: string; idx: number[] }) {
  const set = new Set(idx);
  return <>{[...text].map((c, i) => (set.has(i) ? <b key={i} className="text-[var(--accent)]">{c}</b> : c))}</>;
}

const RECENT_KEY = 'jotqoda-recent-cmds';

export function CommandPalette({ mode: initialMode, initial, onClose }: { mode: PaletteMode; initial?: string; onClose: () => void }) {
  const ide = useIDE();
  const prefixFor: Partial<Record<PaletteMode, string>> = { commands: '>', line: ':', symbols: '@' };
  const [q, setQ] = useState(initial ?? prefixFor[initialMode] ?? '');
  const [sel, setSel] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const origTheme = useRef(ide.settings.theme);
  const [fixedMode] = useState<PaletteMode | null>(['theme', 'language', 'template'].includes(initialMode) ? initialMode : null);

  const mode: PaletteMode = fixedMode ?? (q.startsWith('>') ? 'commands' : q.startsWith(':') ? 'line' : q.startsWith('@') ? 'symbols' : 'files');
  const query = fixedMode ? q : q.replace(/^[>:@]/, '').trim();

  const items: (Item & { idx: number[] })[] = useMemo(() => {
    let base: Item[] = [];
    if (mode === 'files') {
      const recent = ide.groups.flatMap((g) => g.tabs).filter((p) => ide.files[p] != null);
      const all = Object.keys(ide.files).sort((a, b) => (recent.indexOf(b) - recent.indexOf(a)) || a.localeCompare(b));
      base = all.map((p) => ({ id: p, label: basename(p), detail: dirname(p), icon: <FileIcon path={p} />, run: () => ide.openFile(p) }));
      if (query) {
        return base.map((it) => ({ ...it, idx: fuzzy(query, it.label) ?? [], score: fuzzy(query, it.label) ? 2 : fuzzy(query, it.id) ? 1 : 0 }))
          .filter((x: any) => x.score).sort((a: any, b: any) => b.score - a.score).slice(0, 100);
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
    }
    if (mode === 'line') {
      const ed = ide.getEditor();
      const n = parseInt(query);
      const count = ed?.getModel()?.getLineCount() ?? 0;
      return [{
        id: 'line', idx: [], label: !ed ? 'Open a file first' : isNaN(n) ? `Type a line number between 1 and ${count} (optionally :col)` : `Go to line ${n}${query.includes(':') ? ', column ' + query.split(':')[1] : ''}`,
        run: () => { if (!ed || isNaN(n)) return; const col = parseInt(query.split(':')[1]) || 1; ed.setPosition({ lineNumber: n, column: col }); ed.revealLineInCenter(n); ed.focus(); },
      }];
    }
    if (mode === 'symbols') {
      return [{ id: 'sym', idx: [], label: 'Open symbol outline for the current file', run: () => { const ed = ide.getEditor(); ed?.focus(); setTimeout(() => ed?.trigger('palette', 'editor.action.quickOutline', null), 50); } }];
    }
    if (mode === 'theme') {
      base = THEMES.map((t) => ({ id: t.id, label: t.name, detail: t.base === 'vs' ? 'light' : 'dark', icon: <span className="w-4 h-4 rounded-sm border border-[var(--border)] flex overflow-hidden"><span className="flex-1" style={{ background: t.ui.bg }} /><span className="w-1.5" style={{ background: t.ui.accent }} /></span>, run: () => { origTheme.current = t.id; ide.setSetting('theme', t.id); }, preview: () => ide.setSetting('theme', t.id) }));
    }
    if (mode === 'language') {
      base = LANGUAGES.map((l) => ({ id: l.id, label: l.name, detail: l.exts.map((e) => '.' + e).join(' '), icon: <span className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />, run: () => ide.activeFile && ide.setLangOverride(ide.activeFile, l.id) }));
    }
    if (mode === 'template') {
      base = Object.entries(WORKSPACE_TEMPLATES).map(([k, t]) => ({ id: k, label: t.name, detail: t.desc, run: () => ide.execCommand('template.' + k) }));
    }
    return base.map((it) => ({ ...it, idx: fuzzy(query, it.label) as number[] })).filter((it) => it.idx !== null);
  }, [mode, query, ide.files, ide.commands]);

  useEffect(() => { setSel(0); }, [q]);
  useEffect(() => {
    listRef.current?.children[sel]?.scrollIntoView({ block: 'nearest' });
    items[sel]?.preview?.();
  }, [sel, items]);

  const close = (revert = true) => { if (mode === 'theme' && revert) ide.setSetting('theme', origTheme.current); onClose(); };
  const choose = (i: number) => { const it = items[i]; if (!it) return; onClose(); setTimeout(it.run, 0); };

  const placeholder = { files: 'Search files by name (> commands, : line, @ symbols)', commands: '', line: '', symbols: '', theme: 'Select Color Theme (↑↓ to preview)', language: 'Select Language Mode', template: 'Select a workspace template (replaces current files)' }[mode];

  return (
    <div className="fixed inset-0 z-50 flex justify-center pt-[10vh]" onMouseDown={() => close()}>
      <div className="w-[640px] max-w-[92vw] h-fit rounded-lg shadow-2xl border border-[var(--border)] bg-[var(--side)] overflow-hidden" onMouseDown={(e) => e.stopPropagation()}>
        <div className="p-2">
          <input
            autoFocus
            value={q}
            placeholder={placeholder}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(items.length - 1, s + 1)); }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
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
              <span className="truncate"><Hl text={it.label} idx={it.idx} /></span>
              {it.detail && <span className="text-[11px] text-[var(--muted)] truncate">{it.detail}</span>}
              <span className="flex-1" />
              {it.key && <Kbd>{it.key}</Kbd>}
            </div>
          ))}
          {!items.length && <div className="px-3 py-2 text-[13px] text-[var(--muted)]">No matching results</div>}
        </div>
        {mode === 'files' && !query && <div className="px-3 py-1.5 text-[11px] text-[var(--muted)] border-t border-[var(--border)]">{Object.keys(ide.files).length} files · {getLang(ide.activeFile ?? '').name}</div>}
      </div>
    </div>
  );
}
