import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Copy, ClipboardPaste, CornerDownLeft, Braces, ArrowRightLeft, ArrowUp, ArrowDown, Repeat, Hash, Zap, Regex, Palette, Clock, CaseSensitive, KeyRound, Sigma, BarChart3, RotateCw } from 'lucide-react';
import { useIDE } from '../ide/types';

const LOREM = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum'.split(' ');
export const lorem = (words: number) => {
  const w = Array.from({ length: words }, (_, i) => LOREM[(i * 7 + Math.floor(Math.random() * 5)) % LOREM.length]);
  const s = w.join(' ');
  return s.charAt(0).toUpperCase() + s.slice(1) + '.';
};
const b64e = (s: string) => btoa(unescape(encodeURIComponent(s)));
const b64d = (s: string) => decodeURIComponent(escape(atob(s.trim())));
const words = (s: string) => s.replace(/([a-z])([A-Z])/g, '$1 $2').split(/[\s_\-.]+/).filter(Boolean).map((w) => w.toLowerCase());
export const cases: Record<string, (s: string) => string> = {
  camelCase: (s) => words(s).map((w, i) => (i ? w[0].toUpperCase() + w.slice(1) : w)).join(''),
  PascalCase: (s) => words(s).map((w) => w[0].toUpperCase() + w.slice(1)).join(''),
  snake_case: (s) => words(s).join('_'),
  'kebab-case': (s) => words(s).join('-'),
  CONSTANT_CASE: (s) => words(s).join('_').toUpperCase(),
  'Title Case': (s) => words(s).map((w) => w[0].toUpperCase() + w.slice(1)).join(' '),
  'dot.case': (s) => words(s).join('.'),
};

async function hash(algo: string, s: string) {
  const buf = await crypto.subtle.digest(algo, new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const TA = 'w-full px-2 py-1 font-mono text-[12px] bg-[var(--input)] border border-[var(--border)] focus:border-[var(--accent)] outline-none rounded-sm resize-y';
const BTN = 'px-2 h-6 text-[11px] rounded-sm border border-[var(--border)] hover:bg-[var(--accent)] hover:text-white hover:border-transparent';

function Out({ value }: { value: string }) {
  const ide = useIDE();
  return (
    <div className="relative group">
      <textarea readOnly value={value} rows={Math.min(8, Math.max(2, value.split('\n').length))} className={TA} />
      <div className="absolute right-1 top-1 hidden group-hover:flex gap-1">
        <button title="Copy" className="p-1 rounded bg-[var(--side)]" onClick={() => { navigator.clipboard.writeText(value); ide.toast('Copied to clipboard', 'success'); }}><Copy size={12} /></button>
        <button title="Insert at cursor" className="p-1 rounded bg-[var(--side)]" onClick={() => { const ed = ide.getEditor(); if (!ed) return; ed.executeEdits('tools', [{ range: ed.getSelection(), text: value }]); ed.focus(); }}><CornerDownLeft size={12} /></button>
      </div>
    </div>
  );
}

function useSelectionInput(): [string, (s: string) => void, () => void] {
  const ide = useIDE();
  const [v, setV] = useState('');
  const grab = () => {
    const ed = ide.getEditor();
    if (!ed) return;
    const sel = ed.getModel()?.getValueInRange(ed.getSelection());
    setV(sel || ed.getValue());
  };
  return [v, setV, grab];
}

function In({ v, setV, grab, rows = 3, ph }: { v: string; setV: (s: string) => void; grab: () => void; rows?: number; ph?: string }) {
  return (
    <div className="relative">
      <textarea value={v} onChange={(e) => setV(e.target.value)} rows={rows} placeholder={ph ?? 'Input…'} className={TA} />
      <button title="Use editor selection" onClick={grab} className="absolute right-1 top-1 p-1 rounded bg-[var(--side)] opacity-60 hover:opacity-100"><ClipboardPaste size={12} /></button>
    </div>
  );
}

function JsonTool() {
  const [v, setV, grab] = useSelectionInput();
  const [mode, setMode] = useState<'pretty' | 'min' | 'ts'>('pretty');
  const out = useMemo(() => {
    if (!v.trim()) return '';
    try {
      const o = JSON.parse(v);
      if (mode === 'min') return JSON.stringify(o);
      if (mode === 'pretty') return JSON.stringify(o, null, 2);
      const toTs = (x: any, name: string, acc: string[]): string => {
        if (Array.isArray(x)) return x.length ? toTs(x[0], name.replace(/s$/, ''), acc) + '[]' : 'unknown[]';
        if (x === null) return 'null';
        if (typeof x === 'object') {
          const iname = name[0].toUpperCase() + name.slice(1);
          acc.push(`interface ${iname} {\n${Object.entries(x).map(([k, val]) => `  ${/^\w+$/.test(k) ? k : JSON.stringify(k)}: ${toTs(val, k, acc)};`).join('\n')}\n}`);
          return iname;
        }
        return typeof x;
      };
      const acc: string[] = [];
      toTs(o, 'Root', acc);
      return acc.reverse().join('\n\n');
    } catch (e: any) { return e.message; }
  }, [v, mode]);
  return (
    <div className="space-y-1.5">
      <In v={v} setV={setV} grab={grab} ph='{"paste": "json"}' />
      <div className="flex gap-1">{(['pretty', 'min', 'ts'] as const).map((m) => <button key={m} onClick={() => setMode(m)} className={BTN + (mode === m ? ' bg-[var(--accent)] text-white' : '')}>{m === 'ts' ? 'TS types' : m === 'min' ? 'Minify' : 'Prettify'}</button>)}</div>
      <Out value={out} />
    </div>
  );
}

function EncodeTool() {
  const [v, setV, grab] = useSelectionInput();
  const [mode, setMode] = useState('b64e');
  const modes: Record<string, [any, string, (s: string) => string]> = {
    b64e: [ArrowUp, 'Base64 Encode', b64e], b64d: [ArrowDown, 'Base64 Decode', b64d],
    urle: [ArrowUp, 'URL Encode', encodeURIComponent], urld: [ArrowDown, 'URL Decode', decodeURIComponent],
    htmle: [ArrowUp, 'HTML Encode', (s) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)],
    htmld: [ArrowDown, 'HTML Decode', (s) => { const t = document.createElement('textarea'); t.innerHTML = s; return t.value; }],
    hex: [ArrowUp, 'Hex Encode', (s) => [...new TextEncoder().encode(s)].map((b) => b.toString(16).padStart(2, '0')).join(' ')],
    bin: [ArrowUp, 'Binary Encode', (s) => [...new TextEncoder().encode(s)].map((b) => b.toString(2).padStart(8, '0')).join(' ')],
    rev: [Repeat, 'Reverse', (s) => [...s].reverse().join('')],
    esc: [Braces, 'JSON Stringify', (s) => JSON.stringify(s)],
  };
  let out = '';
  try { out = v ? modes[mode][2](v) : ''; } catch (e: any) { out = e.message; }
  return (
    <div className="space-y-1.5">
      <In v={v} setV={setV} grab={grab} />
      <div className="flex flex-wrap gap-1">{Object.entries(modes).map(([k, [I, l]]) => <button key={k} onClick={() => setMode(k)} className={BTN + ' inline-flex items-center gap-1' + (mode === k ? ' bg-[var(--accent)] text-white' : '')}><I size={12} /> {l}</button>)}</div>
      <Out value={out} />
    </div>
  );
}

function HashTool() {
  const [v, setV, grab] = useSelectionInput();
  const [res, setRes] = useState<Record<string, string>>({});
  useEffect(() => {
    let alive = true;
    Promise.all(['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'].map(async (a) => [a, await hash(a, v)])).then((r) => alive && setRes(Object.fromEntries(r)));
    return () => { alive = false; };
  }, [v]);
  return (
    <div className="space-y-1.5">
      <In v={v} setV={setV} grab={grab} rows={2} />
      {Object.entries(res).map(([k, h]) => (
        <div key={k}><div className="text-[10px] text-[var(--muted)]">{k}</div><div onClick={() => navigator.clipboard.writeText(h)} title="Click to copy" className="font-mono text-[10px] break-all cursor-pointer hover:text-[var(--accent)]">{h}</div></div>
      ))}
    </div>
  );
}

function GenTool() {
  const [n, setN] = useState(5);
  const [kind, setKind] = useState('uuid');
  const [len, setLen] = useState(20);
  const [seed, setSeed] = useState(0);
  const out = useMemo(() => {
    const gen: Record<string, () => string> = {
      uuid: () => crypto.randomUUID(),
      password: () => { const cs = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*-_=+'; return Array.from(crypto.getRandomValues(new Uint32Array(len)), (x) => cs[x % cs.length]).join(''); },
      hex: () => Array.from(crypto.getRandomValues(new Uint8Array(len)), (b) => b.toString(16).padStart(2, '0')).join(''),
      nanoid: () => Array.from(crypto.getRandomValues(new Uint8Array(21)), (b) => 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'[b & 63]).join(''),
      lorem: () => lorem(len),
      number: () => String(Math.floor(Math.random() * 10 ** Math.min(len, 15))),
      color: () => '#' + Array.from(crypto.getRandomValues(new Uint8Array(3)), (b) => b.toString(16).padStart(2, '0')).join(''),
      timestamp: () => new Date(Date.now() - Math.random() * 1e11).toISOString(),
    };
    return Array.from({ length: n }, gen[kind]).join('\n');
  }, [n, kind, len, seed]);
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1">{['uuid', 'password', 'nanoid', 'hex', 'lorem', 'number', 'color', 'timestamp'].map((k) => <button key={k} onClick={() => setKind(k)} className={BTN + (kind === k ? ' bg-[var(--accent)] text-white' : '')}>{k}</button>)}</div>
      <div className="flex items-center gap-2 text-[11px]">
        <label>Count <input type="number" min={1} max={100} value={n} onChange={(e) => setN(+e.target.value || 1)} className="w-12 px-1 bg-[var(--input)] border border-[var(--border)]" /></label>
        <label>Len <input type="number" min={1} max={200} value={len} onChange={(e) => setLen(+e.target.value || 1)} className="w-12 px-1 bg-[var(--input)] border border-[var(--border)]" /></label>
        <button className={`${BTN} inline-flex items-center gap-1`} onClick={() => setSeed(seed + 1)}><RotateCw size={12} /> Regenerate</button>
      </div>
      <Out value={out} />
    </div>
  );
}

function RegexTool() {
  const [pat, setPat] = useState('(\\w+)@(\\w+)\\.com');
  const [flags, setFlags] = useState('g');
  const [text, setText] = useState('contact: ada@math.com, linus@kernel.com\nbad: nope@x');
  const { html, list, err } = useMemo(() => {
    try {
      const re = new RegExp(pat, flags.includes('g') ? flags : flags + 'g');
      const list: string[] = [];
      let last = 0, html = '';
      const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
      for (const m of text.matchAll(re)) {
        if (m[0] === '') continue;
        html += esc(text.slice(last, m.index)) + `<mark class="bg-amber-400/40 text-inherit rounded-sm">${esc(m[0])}</mark>`;
        last = m.index! + m[0].length;
        list.push(`[${m.index}] ${m[0]}${m.length > 1 ? '  → groups: ' + m.slice(1).map((g) => JSON.stringify(g)).join(', ') : ''}`);
      }
      html += esc(text.slice(last));
      return { html, list, err: '' };
    } catch (e: any) { return { html: '', list: [], err: e.message }; }
  }, [pat, flags, text]);
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1 font-mono text-[12px]">
        <span className="text-[var(--muted)] self-center">/</span>
        <input value={pat} onChange={(e) => setPat(e.target.value)} className="flex-1 px-1 h-6 bg-[var(--input)] border border-[var(--border)] outline-none" />
        <span className="text-[var(--muted)] self-center">/</span>
        <input value={flags} onChange={(e) => setFlags(e.target.value.replace(/[^gimsuy]/g, ''))} className="w-10 px-1 h-6 bg-[var(--input)] border border-[var(--border)] outline-none" />
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className={TA} />
      {err ? <div className="text-red-400 text-xs">{err}</div> : (
        <>
          <div className="font-mono text-[12px] whitespace-pre-wrap p-2 rounded-sm bg-[var(--input)] border border-[var(--border)]" dangerouslySetInnerHTML={{ __html: html }} />
          <div className="text-[11px] text-[var(--muted)]">{list.length} match(es)</div>
          <div className="font-mono text-[11px] space-y-0.5">{list.map((l, i) => <div key={i}>{l}</div>)}</div>
        </>
      )}
    </div>
  );
}

function ColorTool() {
  const [c, setC] = useState('#8b5cf6');
  const rgb = /^#?([\da-f]{6})$/i.test(c) ? [0, 2, 4].map((i) => parseInt(c.replace('#', '').substr(i, 2), 16)) : [0, 0, 0];
  const [r, g, b] = rgb.map((x) => x / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  const lum = (x: number) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
  const L = 0.2126 * lum(r) + 0.7152 * lum(g) + 0.0722 * lum(b);
  const cw = (1.05 / (L + 0.05)).toFixed(2), cb = ((L + 0.05) / 0.05).toFixed(2);
  const vals = [c, `rgb(${rgb.join(', ')})`, `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`, `rgba(${rgb.join(', ')}, 1)`];
  return (
    <div className="space-y-1.5">
      <div className="flex gap-2 items-center">
        <input type="color" value={/^#[\da-f]{6}$/i.test(c) ? c : '#000000'} onChange={(e) => setC(e.target.value)} className="w-10 h-8 bg-transparent" />
        <input value={c} onChange={(e) => setC(e.target.value)} className="flex-1 px-2 h-7 font-mono text-[12px] bg-[var(--input)] border border-[var(--border)] outline-none" />
      </div>
      {vals.map((v) => <div key={v} onClick={() => navigator.clipboard.writeText(v)} className="font-mono text-[11px] cursor-pointer hover:text-[var(--accent)]">{v}</div>)}
      <div className="flex gap-1 text-[10px]">
        <div className="flex-1 p-1.5 rounded text-center" style={{ background: c, color: '#fff' }}>White {cw}:1</div>
        <div className="flex-1 p-1.5 rounded text-center" style={{ background: c, color: '#000' }}>Black {cb}:1</div>
      </div>
      <div className="flex h-5 rounded overflow-hidden">{[0.9, 0.75, 0.6, 0.45, 0.3, 0.15].map((ll) => { const col = `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${ll * 100}%)`; return <div key={ll} title={col} onClick={() => navigator.clipboard.writeText(col)} className="flex-1 cursor-pointer" style={{ background: col }} />; })}</div>
    </div>
  );
}

function TimeTool() {
  const [v, setV] = useState(String(Math.floor(Date.now() / 1000)));
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const n = Number(v);
  const d = isNaN(n) ? new Date(v) : new Date(v.length <= 10 ? n * 1000 : n);
  const ok = !isNaN(d.getTime());
  return (
    <div className="space-y-1.5 text-[12px]">
      <div className="text-[var(--muted)] text-[11px]">Now: <span className="font-mono text-[var(--fg)]">{Math.floor(now / 1000)}</span></div>
      <input value={v} onChange={(e) => setV(e.target.value)} placeholder="unix ts or date string" className="w-full px-2 h-7 font-mono bg-[var(--input)] border border-[var(--border)] outline-none" />
      {ok ? (
        <div className="font-mono text-[11px] space-y-0.5">
          <div>ISO: {d.toISOString()}</div><div>Local: {d.toLocaleString()}</div><div>UTC: {d.toUTCString()}</div><div>Unix: {Math.floor(d.getTime() / 1000)}</div><div>ms: {d.getTime()}</div>
          <div>Relative: {(() => { const s = Math.round((d.getTime() - now) / 1000); const a = Math.abs(s); const [val, unit] = a < 60 ? [a, 'sec'] : a < 3600 ? [a / 60, 'min'] : a < 86400 ? [a / 3600, 'hr'] : [a / 86400, 'day']; return `${s < 0 ? '' : 'in '}${Math.round(val)} ${unit}${Math.round(val) !== 1 ? 's' : ''}${s < 0 ? ' ago' : ''}`; })()}</div>
        </div>
      ) : <div className="text-red-400 text-xs">Invalid date</div>}
    </div>
  );
}

function CaseTool() {
  const [v, setV, grab] = useSelectionInput();
  return (
    <div className="space-y-1.5">
      <In v={v} setV={setV} grab={grab} rows={2} ph="some variable name" />
      {v && Object.entries(cases).map(([k, f]) => <div key={k} className="flex text-[11px] gap-2"><span className="w-24 text-[var(--muted)] shrink-0">{k}</span><span onClick={() => navigator.clipboard.writeText(f(v))} className="font-mono truncate cursor-pointer hover:text-[var(--accent)]">{f(v)}</span></div>)}
    </div>
  );
}

function JwtTool() {
  const [v, setV, grab] = useSelectionInput();
  let out = '';
  if (v.trim()) {
    try {
      const [h, p] = v.trim().split('.');
      const dec = (s: string) => JSON.parse(b64d(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)));
      const payload = dec(p);
      out = `// Header\n${JSON.stringify(dec(h), null, 2)}\n\n// Payload\n${JSON.stringify(payload, null, 2)}${payload.exp ? `\n\n// Expires: ${new Date(payload.exp * 1000).toLocaleString()} ${payload.exp * 1000 < Date.now() ? '(EXPIRED)' : ''}` : ''}`;
    } catch { out = 'Invalid JWT'; }
  }
  return <div className="space-y-1.5"><In v={v} setV={setV} grab={grab} ph="eyJhbGciOi..." /><Out value={out} /></div>;
}

function BaseTool() {
  const [v, setV] = useState('255');
  const [base, setBase] = useState(10);
  const n = parseInt(v, base);
  return (
    <div className="space-y-1.5 text-[12px]">
      <div className="flex gap-1">
        <input value={v} onChange={(e) => setV(e.target.value)} className="flex-1 px-2 h-7 font-mono bg-[var(--input)] border border-[var(--border)] outline-none" />
        <select value={base} onChange={(e) => setBase(+e.target.value)} className="bg-[var(--input)] border border-[var(--border)] px-1">{[2, 8, 10, 16, 36].map((b) => <option key={b} value={b}>base {b}</option>)}</select>
      </div>
      {isNaN(n) ? <div className="text-red-400 text-xs">Invalid number</div> : [[2, 'BIN'], [8, 'OCT'], [10, 'DEC'], [16, 'HEX'], [36, 'B36']].map(([b, l]) => <div key={b} className="flex gap-2 font-mono text-[11px]"><span className="w-8 text-[var(--muted)]">{l}</span><span className="break-all">{n.toString(b as number).toUpperCase()}</span></div>)}
    </div>
  );
}

function StatsTool() {
  const ide = useIDE();
  const content = ide.activeFile ? ide.files[ide.activeFile] ?? '' : '';
  const stats = [
    ['Lines', content.split('\n').length], ['Non-empty lines', content.split('\n').filter((l) => l.trim()).length],
    ['Words', (content.match(/\S+/g) || []).length], ['Characters', content.length], ['Bytes (UTF-8)', new TextEncoder().encode(content).length],
    ['Comments', content.split('\n').filter((l) => /^\s*(\/\/|#|--|\/\*|\*)/.test(l)).length], ['Functions (approx)', (content.match(/\bfunction\b|=>|\bdef\b|\bfn\b|\bfunc\b/g) || []).length],
    ['TODO / FIXME', (content.match(/\b(TODO|FIXME|HACK|XXX)\b/g) || []).length], ['Reading time', Math.max(1, Math.round((content.match(/\S+/g) || []).length / 200)) + ' min'],
  ];
  return <div className="text-[12px] space-y-0.5">{ide.activeFile ? stats.map(([k, v]) => <div key={k} className="flex"><span className="flex-1 text-[var(--muted)]">{k}</span><span className="font-mono">{v}</span></div>) : <div className="text-[var(--muted)]">Open a file</div>}</div>;
}

const TOOLS: [any, string, () => React.ReactElement][] = [
  [Braces, 'JSON Formatter & → TypeScript', JsonTool],
  [ArrowRightLeft, 'Encode / Decode', EncodeTool],
  [Hash, 'Hash Generator (SHA)', HashTool],
  [Zap, 'Generators (UUID, password…)', GenTool],
  [Regex, 'Regex Tester', RegexTool],
  [Palette, 'Color Converter & Contrast', ColorTool],
  [Clock, 'Timestamp Converter', TimeTool],
  [CaseSensitive, 'Case Converter', CaseTool],
  [KeyRound, 'JWT Decoder', JwtTool],
  [Sigma, 'Number Base Converter', BaseTool],
  [BarChart3, 'File Statistics', StatsTool],
];

export function ToolsView() {
  const [open, setOpen] = useState<Set<number>>(new Set([0]));
  return (
    <div className="h-full overflow-auto text-[13px] pb-8">
      {TOOLS.map(([Icon, name, C], i) => (
        <div key={name} className="border-b border-[var(--border)]">
          <button onClick={() => setOpen((s) => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; })} className="w-full flex items-center gap-2 px-2 h-8 hover:bg-[var(--hover)]">
            {open.has(i) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <Icon size={14} className="text-[var(--accent)] shrink-0" />
            <span className="truncate">{name}</span>
          </button>
          {open.has(i) && <div className="px-3 pb-3"><C /></div>}
        </div>
      ))}
    </div>
  );
}
