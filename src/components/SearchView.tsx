import { useEffect, useMemo, useRef, useState } from 'react';
import { CaseSensitive, Regex, WholeWord, ChevronRight, ChevronDown, Replace, ReplaceAll } from 'lucide-react';
import { useIDE, basename, dirname } from '../ide/types';
import { FileIcon } from './FileIcon';
import { IconBtn } from './Explorer';

export function SearchView() {
  const ide = useIDE();
  const [q, setQ] = useState('');
  const [rep, setRep] = useState('');
  const [showRep, setShowRep] = useState(false);
  const [cs, setCs] = useState(false);
  const [ww, setWw] = useState(false);
  const [rx, setRx] = useState(false);
  const [include, setInclude] = useState('');
  const [exclude, setExclude] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const qRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const r = ide.searchRequest;
    if (!r) return;
    if (r.query != null) setQ(r.query);
    if (r.include != null) setInclude(r.include);
    setTimeout(() => { qRef.current?.focus(); qRef.current?.select(); }, 30);
  }, [ide.searchRequest?.id]);

  const { re, err } = useMemo(() => {
    if (!q) return { re: null, err: '' };
    try {
      let src = rx ? q : q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (ww) src = `\\b${src}\\b`;
      return { re: new RegExp(src, cs ? 'g' : 'gi'), err: '' };
    } catch (e: any) { return { re: null, err: e.message }; }
  }, [q, cs, ww, rx]);

  const results = useMemo(() => {
    if (!re) return [];
    const globToRe = (g: string) => new RegExp(g.split(',').map((s) => s.trim()).filter(Boolean).map((s) => s.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.')).join('|') || '$^');
    const inc = include ? globToRe(include) : null;
    const exc = exclude ? globToRe(exclude) : null;
    const out: { path: string; matches: { line: number; col: number; text: string; len: number }[] }[] = [];
    for (const [path, content] of Object.entries(ide.files)) {
      if (inc && !inc.test(path)) continue;
      if (exc && exc.test(path)) continue;
      const matches: { line: number; col: number; text: string; len: number }[] = [];
      content.split('\n').forEach((text, i) => {
        re.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = re.exec(text)) && matches.length < 500) {
          matches.push({ line: i + 1, col: m.index + 1, text, len: m[0].length || 1 });
          if (!m[0].length) re.lastIndex++;
        }
      });
      if (matches.length) out.push({ path, matches });
    }
    return out;
  }, [re, ide.files, include, exclude]);

  const total = results.reduce((a, r) => a + r.matches.length, 0);

  const goto = (path: string, line: number, col: number, len: number) => ide.revealAt(path, line, col, line, col + len);

  const replaceIn = (path: string) => {
    if (!re) return;
    ide.snapshot(path, 'Before replace');
    ide.writeFile(path, ide.files[path].replace(re, rep), true);
  };
  const replaceAll = () => {
    results.forEach((r) => replaceIn(r.path));
    ide.toast(`Replaced ${total} occurrence(s) in ${results.length} file(s)`, 'success');
  };

  const input = 'w-full h-7 px-2 text-[13px] bg-[var(--input)] border border-[var(--border)] focus:border-[var(--accent)] outline-none rounded-sm';

  return (
    <div className="flex flex-col h-full text-[13px]">
      <div className="p-2 space-y-1.5">
        <div className="flex gap-1">
          <button onClick={() => setShowRep(!showRep)} className="text-[var(--muted)] hover:text-[var(--fg)]">{showRep ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</button>
          <div className="flex-1 space-y-1.5">
            <div className="relative">
              <input ref={qRef} autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className={input + ' pr-20'} />
              <div className="absolute right-1 top-0.5 flex">
                <IconBtn title="Match Case" active={cs} onClick={() => setCs(!cs)}><CaseSensitive size={14} /></IconBtn>
                <IconBtn title="Match Whole Word" active={ww} onClick={() => setWw(!ww)}><WholeWord size={14} /></IconBtn>
                <IconBtn title="Use Regular Expression" active={rx} onClick={() => setRx(!rx)}><Regex size={14} /></IconBtn>
              </div>
            </div>
            {showRep && (
              <div className="flex gap-1">
                <input value={rep} onChange={(e) => setRep(e.target.value)} placeholder="Replace" className={input} />
                <IconBtn title="Replace All" onClick={replaceAll}><ReplaceAll size={16} /></IconBtn>
              </div>
            )}
          </div>
        </div>
        <input value={include} onChange={(e) => setInclude(e.target.value)} placeholder="files to include (e.g. *.ts, src/**)" className={input} />
        <input value={exclude} onChange={(e) => setExclude(e.target.value)} placeholder="files to exclude" className={input} />
        {err && <div className="text-red-400 text-xs">{err}</div>}
        {q && !err && <div className="text-xs text-[var(--muted)]">{total} result{total !== 1 && 's'} in {results.length} file{results.length !== 1 && 's'}</div>}
      </div>
      <div className="flex-1 overflow-auto">
        {results.map((r) => (
          <div key={r.path}>
            <div onClick={() => setCollapsed((s) => { const n = new Set(s); n.has(r.path) ? n.delete(r.path) : n.add(r.path); return n; })} className="group flex items-center gap-1.5 px-2 h-[22px] cursor-pointer hover:bg-[var(--hover)]">
              {collapsed.has(r.path) ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
              <FileIcon path={r.path} />
              <span className="truncate">{basename(r.path)}</span>
              <span className="text-[11px] text-[var(--muted)] truncate flex-1">{dirname(r.path)}</span>
              {showRep && <button title="Replace in file" onClick={(e) => { e.stopPropagation(); replaceIn(r.path); }} className="opacity-0 group-hover:opacity-100"><Replace size={13} /></button>}
              <span className="px-1.5 rounded-full bg-[var(--input)] text-[10px]">{r.matches.length}</span>
            </div>
            {!collapsed.has(r.path) && r.matches.map((m, i) => {
              const start = Math.max(0, m.col - 1 - 20);
              return (
                <div key={i} onClick={() => goto(r.path, m.line, m.col, m.len)} className="pl-9 pr-2 h-[22px] flex items-center cursor-pointer hover:bg-[var(--hover)] whitespace-pre overflow-hidden text-[12px]">
                  <span className="text-[var(--muted)] mr-2 text-[10px] w-6 text-right shrink-0">{m.line}</span>
                  <span className="truncate">
                    {start > 0 && '…'}{m.text.slice(start, m.col - 1).trimStart()}
                    <span className={showRep && rep !== undefined ? 'bg-red-500/30 line-through' : 'bg-amber-400/40 rounded-sm'}>{m.text.substr(m.col - 1, m.len)}</span>
                    {showRep && <span className="bg-emerald-500/30">{rep}</span>}
                    {m.text.slice(m.col - 1 + m.len, m.col + 80)}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
