import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Trash2, ChevronUp, ChevronDown, Copy, AlertCircle, AlertTriangle, Info, ListTodo, WrapText, Lock, Unlock, CheckCircle2, Terminal as TerminalIcon, Circle, Plus } from 'lucide-react';
import { useIDE, basename, dirname } from '../ide/types';
import { Terminal, type TerminalHandle } from './Terminal';
import { FileIcon } from './FileIcon';
import { IconBtn } from './Explorer';

export function Panel({ maximized, setMaximized }: { maximized: boolean; setMaximized: (b: boolean) => void }) {
  const ide = useIDE();
  const errors = ide.problems.filter((p) => p.severity === 'error').length;
  const warns = ide.problems.filter((p) => p.severity === 'warning').length;
  const todos = useTodos();
  const [filter, setFilter] = useState('');
  const [wrap, setWrap] = useState(true);
  const [lock, setLock] = useState(false);

  const tabs: [typeof ide.panelTab, string, number?][] = [
    ['terminal', 'Terminal'], ['output', 'Output', ide.output.length], ['problems', 'Problems', errors + warns], ['todos', 'TODOs', todos.length],
  ];

  return (
    <div className="flex flex-col h-full bg-[var(--panel)]">
      <div className="flex items-center h-9 px-2 shrink-0 gap-1">
        {tabs.map(([id, label, n]) => (
          <button key={id} onClick={() => ide.setPanelTab(id)} className={`relative px-2.5 h-full text-[11px] uppercase tracking-wide flex items-center gap-1.5 ${ide.panelTab === id ? 'text-[var(--fg)]' : 'text-[var(--muted)] hover:text-[var(--fg)]'}`}>
            {label}
            {!!n && <span className={`px-1.5 rounded-full text-[10px] ${id === 'problems' && errors ? 'bg-red-500/80 text-white' : 'bg-[var(--input)]'}`}>{n}</span>}
            {ide.panelTab === id && <span className="absolute bottom-1 left-2 right-2 h-px bg-[var(--accent)]" />}
          </button>
        ))}
        <div className="flex-1" />
        {(ide.panelTab === 'output' || ide.panelTab === 'problems') && (
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter" className="h-6 w-40 px-2 text-[12px] bg-[var(--input)] border border-[var(--border)] rounded-sm outline-none focus:border-[var(--accent)]" />
        )}
        {ide.panelTab === 'output' && (
          <>
            <IconBtn title="Toggle Word Wrap" active={wrap} onClick={() => setWrap(!wrap)}><WrapText size={14} /></IconBtn>
            <IconBtn title={lock ? 'Unlock scroll' : 'Lock scroll'} active={lock} onClick={() => setLock(!lock)}>{lock ? <Lock size={14} /> : <Unlock size={14} />}</IconBtn>
            <IconBtn title="Copy Output" onClick={() => { navigator.clipboard.writeText(ide.output.map((o) => o.text).join('\n')); ide.toast('Output copied', 'success'); }}><Copy size={14} /></IconBtn>
            <IconBtn title="Clear Output" onClick={ide.clearOutput}><Trash2 size={14} /></IconBtn>
          </>
        )}
        <IconBtn title={maximized ? 'Restore' : 'Maximize'} onClick={() => setMaximized(!maximized)}>{maximized ? <ChevronDown size={15} /> : <ChevronUp size={15} />}</IconBtn>
        <IconBtn title="Close Panel" onClick={() => ide.setPanelOpen(false)}><X size={15} /></IconBtn>
      </div>
      <div className="flex-1 min-h-0 relative">
        <div className={`absolute inset-0 ${ide.panelTab === 'terminal' ? '' : 'hidden'}`}><TerminalHost visible={ide.panelTab === 'terminal' && ide.panelOpen} /></div>
        {ide.panelTab === 'output' && <Output filter={filter} wrap={wrap} lock={lock} />}
        {ide.panelTab === 'problems' && <Problems filter={filter} />}
        {ide.panelTab === 'todos' && <Todos todos={todos} />}
      </div>
    </div>
  );
}

const COLORS: Record<string, string> = { error: 'text-red-400 bg-red-500/5', warn: 'text-amber-300 bg-amber-500/5', info: 'text-sky-300', success: 'text-emerald-400', system: 'text-[var(--muted)] italic', log: 'text-[var(--fg)]' };
const GLYPHS: Record<string, any> = { error: AlertCircle, warn: AlertTriangle, info: Info, success: CheckCircle2, system: Circle, log: TerminalIcon };
const GLYPH_COLOR: Record<string, string> = { error: 'text-red-400', warn: 'text-amber-300', info: 'text-sky-300', success: 'text-emerald-400', system: 'text-[var(--muted)]', log: 'text-[var(--muted)]' };

function Output({ filter, wrap, lock }: { filter: string; wrap: boolean; lock: boolean }) {
  const ide = useIDE();
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { if (!lock) end.current?.scrollIntoView(); }, [ide.output, lock]);
  const lines = filter ? ide.output.filter((o) => o.text.toLowerCase().includes(filter.toLowerCase())) : ide.output;
  return (
    <div className="h-full overflow-auto font-mono text-[12.5px] py-1">
      {!lines.length && <div className="px-4 py-2 text-[var(--muted)] text-xs">No output yet. Press F5 to run the active file.</div>}
      {lines.map((o) => {
        if (o.type === 'table') {
          let t: { head: string[]; body: string[][] } = { head: [], body: [] };
          try { t = JSON.parse(o.text); } catch {}
          return (
            <div key={o.id} className="px-4 py-1 overflow-x-auto">
              <table className="text-[12px] border-collapse">
                <thead><tr>{t.head.map((h, i) => <th key={i} className="border border-[var(--border)] px-2 py-0.5 bg-[var(--input)] text-left font-semibold">{h}</th>)}</tr></thead>
                <tbody>{t.body.map((r, i) => <tr key={i} className="odd:bg-[var(--hover)]/40">{r.map((c, j) => <td key={j} className="border border-[var(--border)] px-2 py-0.5">{c}</td>)}</tr>)}</tbody>
              </table>
              <div className="text-[10px] text-[var(--muted)] mt-0.5">{t.body.length} row(s)</div>
            </div>
          );
        }
        const Glyph = GLYPHS[o.type] ?? TerminalIcon;
        return (
          <div key={o.id} className={`group flex gap-3 px-4 hover:bg-[var(--hover)] ${COLORS[o.type] ?? ''}`}>
            <span className="text-[10px] text-[var(--muted)] opacity-0 group-hover:opacity-100 shrink-0 pt-0.5 w-16">{new Date(o.time).toLocaleTimeString()}</span>
            <Glyph size={13} className={`shrink-0 mt-0.5 ${GLYPH_COLOR[o.type] ?? ''}`} />
            <span className={`${wrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'} flex-1`}>{o.text}</span>
          </div>
        );
      })}
      <div ref={end} />
    </div>
  );
}

function gotoLoc(ide: ReturnType<typeof useIDE>, path: string, line: number, col = 1) {
  ide.revealAt(path, line, col);
}

let termSeq = 1;
function TerminalHost({ visible }: { visible: boolean }) {
  const ide = useIDE();
  const [sessions, setSessions] = useState<{ id: number; name: string; cwd: string }[]>([{ id: 1, name: 'jotqoda-sh', cwd: '' }]);
  const [active, setActive] = useState(1);
  const refs = useRef<Record<number, TerminalHandle | null>>({});
  const handled = useRef<number | null>(null);
  const add = (cwd = '') => {
    const id = ++termSeq;
    setSessions((s) => [...s, { id, name: 'jotqoda-sh', cwd }]);
    setActive(id);
    return id;
  };
  const kill = (id: number) => {
    setSessions((s) => {
      const next = s.filter((x) => x.id !== id);
      if (!next.length) { const nid = ++termSeq; setActive(nid); return [{ id: nid, name: 'jotqoda-sh', cwd: '' }]; }
      if (active === id) setActive(next[next.length - 1].id);
      return next;
    });
  };
  useEffect(() => {
    const r = ide.terminalRequest;
    if (!r || handled.current === r.id) return;
    handled.current = r.id;
    let target = active;
    if (r.newTerminal || r.cwd != null) target = add(r.cwd ?? '');
    if (r.command) setTimeout(() => refs.current[target]?.exec(r.command!), 60);
    else setTimeout(() => refs.current[target]?.focus(), 60);
  }, [ide.terminalRequest]);
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-0.5 px-2 h-6 shrink-0 text-[11px] border-b border-[var(--border)]/60">
        {sessions.map((t, i) => (
          <div key={t.id} onClick={() => setActive(t.id)} className={`group flex items-center gap-1 pl-2 pr-1 h-5 rounded-sm cursor-pointer ${t.id === active ? 'bg-[var(--hover)] text-[var(--fg)]' : 'text-[var(--muted)] hover:text-[var(--fg)]'}`} title={t.cwd ? `/workspace/${t.cwd}` : '/workspace'}>
            <TerminalIcon size={11} /> {i + 1}: {t.name}{t.cwd ? ` (${t.cwd.split('/').pop()})` : ''}
            <button onClick={(e) => { e.stopPropagation(); kill(t.id); }} className="opacity-0 group-hover:opacity-100 hover:text-red-400" title="Kill Terminal"><X size={11} /></button>
          </div>
        ))}
        <button onClick={() => add()} title="New Terminal (Ctrl+Shift+`)" className="p-0.5 rounded hover:bg-[var(--hover)] text-[var(--muted)]"><Plus size={13} /></button>
      </div>
      <div className="flex-1 min-h-0 relative">
        {sessions.map((t, i) => (
          <div key={t.id} className={`absolute inset-0 ${t.id === active ? '' : 'hidden'}`}>
            <Terminal ref={(h) => { refs.current[t.id] = h; }} initialCwd={t.cwd} visible={visible && t.id === active} name={`${i + 1}: ${t.name}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Problems({ filter }: { filter: string }) {
  const ide = useIDE();
  const grouped = useMemo(() => {
    const g: Record<string, typeof ide.problems> = {};
    ide.problems.filter((p) => !filter || p.message.toLowerCase().includes(filter.toLowerCase())).forEach((p) => (g[p.path] ??= []).push(p));
    return g;
  }, [ide.problems, filter]);
  const Icon = { error: AlertCircle, warning: AlertTriangle, info: Info, todo: ListTodo };
  const col = { error: 'text-red-400', warning: 'text-amber-300', info: 'text-sky-400', todo: 'text-violet-400' };
  return (
    <div className="h-full overflow-auto text-[13px] py-1">
      {!Object.keys(grouped).length && <div className="px-4 py-2 flex items-center gap-2 text-[var(--muted)] text-xs"><CheckCircle2 size={14} className="text-emerald-400" /> No problems have been detected in the workspace.</div>}
      {Object.entries(grouped).map(([path, ps]) => (
        <div key={path}>
          <div className="flex items-center gap-1.5 px-3 h-[22px]"><FileIcon path={path} /> {basename(path)} <span className="text-[11px] text-[var(--muted)]">{dirname(path)}</span><span className="px-1.5 rounded-full bg-[var(--input)] text-[10px]">{ps.length}</span></div>
          {ps.map((p, i) => {
            const I = Icon[p.severity];
            return (
              <div key={i} onClick={() => gotoLoc(ide, p.path, p.line, p.col)} className="flex items-start gap-2 pl-8 pr-3 py-0.5 cursor-pointer hover:bg-[var(--hover)]">
                <I size={14} className={`${col[p.severity]} shrink-0 mt-0.5`} />
                <span className="flex-1">{p.message}</span>
                <span className="text-[11px] text-[var(--muted)] shrink-0">{p.source} [Ln {p.line}, Col {p.col}]</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function useTodos() {
  const { files } = useIDE();
  return useMemo(() => {
    const out: { path: string; line: number; tag: string; text: string }[] = [];
    for (const [p, c] of Object.entries(files)) {
      c.split('\n').forEach((l, i) => {
        const m = l.match(/\b(TODO|FIXME|HACK|XXX|BUG|NOTE)\b:?\s*(.*)/);
        if (m && /(\/\/|#|--|\/\*|\*|<!--)/.test(l.slice(0, m.index))) out.push({ path: p, line: i + 1, tag: m[1], text: m[2].replace(/\*\/|-->/, '').trim() });
      });
    }
    return out;
  }, [files]);
}

function Todos({ todos }: { todos: ReturnType<typeof useTodos> }) {
  const ide = useIDE();
  const tagCol: Record<string, string> = { TODO: 'bg-sky-500/20 text-sky-300', FIXME: 'bg-red-500/20 text-red-300', HACK: 'bg-amber-500/20 text-amber-300', XXX: 'bg-pink-500/20 text-pink-300', BUG: 'bg-red-500/20 text-red-300', NOTE: 'bg-emerald-500/20 text-emerald-300' };
  return (
    <div className="h-full overflow-auto text-[13px] py-1">
      {!todos.length && <div className="px-4 py-2 text-[var(--muted)] text-xs">No TODO / FIXME / HACK comments found.</div>}
      {todos.map((t, i) => (
        <div key={i} onClick={() => gotoLoc(ide, t.path, t.line)} className="flex items-center gap-2 px-4 py-0.5 cursor-pointer hover:bg-[var(--hover)]">
          <span className={`px-1.5 rounded text-[10px] font-bold ${tagCol[t.tag]}`}>{t.tag}</span>
          <span className="flex-1 truncate">{t.text || '(no description)'}</span>
          <FileIcon path={t.path} />
          <span className="text-[11px] text-[var(--muted)]">{t.path}:{t.line}</span>
        </div>
      ))}
    </div>
  );
}
