import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useIDE, normPath, joinPath, dirname, basename } from '../ide/types';
import { THEMES } from '../ide/themes';
import { LANGUAGES, getLang } from '../ide/languages';
import { ideRef } from '../ide/monacoSetup';
import { useChanges } from './GitView';

type Line = { text: string; cls?: string };
interface IO { stdin?: string; out: (text: string, cls?: string) => void; err: (text: string) => void }

const HELP: [string, string][] = [
  ['help [cmd]', 'Show help'], ['ls [-la] [dir]', 'List directory'], ['cd <dir>', 'Change directory'], ['pwd', 'Print working directory'],
  ['tree [dir]', 'Directory tree'], ['cat [files…]', 'Print files (or stdin)'], ['head/tail [-n N] [file]', 'First/last lines'],
  ['touch <file>', 'Create file'], ['mkdir [-p] <dir>', 'Create folder'], ['rm [-r] <path>', 'Delete'], ['mv <a> <b>', 'Move / rename'],
  ['cp [-r] <a> <b>', 'Copy'], ['echo [-n] <text>', 'Print text'], ['grep [-invcr] <re> [files]', 'Search text (or stdin)'],
  ['find [dir] [-name glob]', 'Find files'], ['wc [-lwc] [files]', 'Count lines/words/chars'], ['sort [-rnu]', 'Sort lines'],
  ['uniq [-c]', 'Collapse duplicate lines'], ['rev / tac / nl', 'Reverse chars / lines, number lines'], ['cut -d X -f N', 'Select fields'],
  ['tr [-d] <set1> [set2]', 'Translate characters'], ["sed 's/re/rep/g'", 'Substitute text'], ["awk [-F sep] '{print $1}'", 'Print fields'],
  ['tee <file>', 'Copy stdin to file'], ['diff <a> <b>', 'Compare files'], ['jq <filter> [file]', 'Query JSON (.a.b, .[0], keys, length)'],
  ['base64 [-d]', 'Encode / decode'], ['sha1sum|sha256sum|sha512sum', 'Hash files or stdin'], ['uuid · seq [a] b · sleep n', 'Utilities'],
  ['curl|wget <url> [-o file]', 'Fetch a URL (CORS permitting)'], ['stat · du · file <path>', 'File info & language detection'],
  ['env · export K=V · unset K', 'Environment variables'], ['alias k=v · unalias k · which <cmd>', 'Aliases'],
  ['open|code <file>', 'Open in editor'], ['run <file>', 'Execute a file with its runtime'], ['node|python|lua|ruby|php|… <file>', 'Run with a specific runtime'],
  ['format <file>', 'Format a file'], ['preview <file>', 'Open live preview'], ['zip [dir]', 'Download workspace / folder as ZIP'],
  ['js <expr> · calc <expr>', 'Evaluate'], ['git status|log|diff|commit -m', 'Source control'], ['theme [name] · langs [q]', 'Themes & languages'],
  ['history [-c] · !! · !n', 'Command history'], ['date · whoami · uname · neofetch', 'System info'], ['clear (Ctrl+L) · exit', 'Terminal'],
  ['cmd1 | cmd2 · > · >> · < · && · || · ;', 'Pipes, redirection & chaining'],
];
const COMMANDS = ['help', 'ls', 'dir', 'cd', 'pwd', 'tree', 'cat', 'head', 'tail', 'touch', 'mkdir', 'rm', 'mv', 'cp', 'echo', 'grep', 'find', 'wc', 'sort', 'uniq', 'rev', 'tac', 'nl', 'cut', 'tr', 'sed', 'awk', 'tee', 'diff', 'jq', 'base64', 'sha1sum', 'sha256sum', 'sha512sum', 'uuid', 'uuidgen', 'seq', 'sleep', 'curl', 'wget', 'stat', 'du', 'file', 'env', 'export', 'unset', 'alias', 'unalias', 'which', 'type', 'open', 'code', 'run', 'node', 'python', 'python3', 'lua', 'ruby', 'php', 'scheme', 'swipl', 'coffee', 'bf', 'sql', 'sqlite3', 'format', 'preview', 'zip', 'js', 'eval', 'calc', 'git', 'theme', 'langs', 'history', 'date', 'whoami', 'hostname', 'uname', 'neofetch', 'clear', 'cls', 'exit', 'true', 'false'];
const RUNNERS = new Set(['run', 'node', 'python', 'python3', 'py', 'lua', 'ruby', 'php', 'scheme', 'racket', 'swipl', 'prolog', 'coffee', 'bf', 'sql', 'sqlite3', 'ts-node', 'deno', 'bun', 'clj', 'wat2wasm']);

type Tok = { t: 'w'; v: string; q: boolean } | { t: 'op'; v: string };

function lex(line: string, env: Record<string, string>): Tok[] {
  const out: Tok[] = [];
  let cur = '';
  let has = false;
  let quoted = false;
  const expand = (s: string) => s.replace(/\$\{([^}]*)\}|\$([A-Za-z_]\w*|\?|\d)/g, (_, a, b) => env[a ?? b] ?? '');
  const push = () => { if (has) out.push({ t: 'w', v: cur, q: quoted }); cur = ''; has = false; quoted = false; };
  let i = 0;
  while (i < line.length) {
    const c = line[i];
    if (c === ' ' || c === '\t') { push(); i++; continue; }
    if (c === "'") { const j = line.indexOf("'", i + 1); cur += line.slice(i + 1, j < 0 ? line.length : j); has = true; quoted = true; i = j < 0 ? line.length : j + 1; continue; }
    if (c === '"') {
      let j = i + 1; let s = '';
      while (j < line.length && line[j] !== '"') { if (line[j] === '\\' && j + 1 < line.length && '"\\$`'.includes(line[j + 1])) { s += line[j + 1]; j += 2; } else s += line[j++]; }
      cur += expand(s); has = true; quoted = true; i = j + 1; continue;
    }
    if (c === '\\' && i + 1 < line.length) { cur += line[i + 1]; has = true; i += 2; continue; }
    if (line.startsWith('2>&1', i)) { push(); out.push({ t: 'op', v: '2>&1' }); i += 4; continue; }
    const two = line.slice(i, i + 2);
    if (['&&', '||', '>>', '2>'].includes(two)) { push(); out.push({ t: 'op', v: two }); i += 2; continue; }
    if ('|;<>'.includes(c)) { push(); out.push({ t: 'op', v: c }); i++; continue; }
    if (c === '$') { const m = /^\$(\{[^}]*\}|[A-Za-z_]\w*|\?|\d)/.exec(line.slice(i)); if (m) { cur += expand(m[0]); has = true; i += m[0].length; continue; } }
    if (c === '#' && !has) break;
    cur += c; has = true; i++;
  }
  push();
  return out;
}

interface Seg { argv: string[]; quoted: boolean[]; out?: { file: string; append: boolean }; inp?: string; errToOut?: boolean; errFile?: string }
function parse(toks: Tok[]): { segs: Seg[]; prev: string | null }[] {
  const chain: { segs: Seg[]; prev: string | null }[] = [];
  let segs: Seg[] = [];
  let seg: Seg = { argv: [], quoted: [] };
  let prev: string | null = null;
  const endSeg = () => { if (seg.argv.length) segs.push(seg); seg = { argv: [], quoted: [] }; };
  const endChain = (op: string | null) => { endSeg(); if (segs.length) chain.push({ segs, prev }); segs = []; prev = op; };
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    if (t.t === 'w') { seg.argv.push(t.v); seg.quoted.push(t.q); continue; }
    const next = toks[i + 1];
    if (t.v === '|') endSeg();
    else if (t.v === '&&' || t.v === '||' || t.v === ';') endChain(t.v);
    else if ((t.v === '>' || t.v === '>>') && next?.t === 'w') { seg.out = { file: next.v, append: t.v === '>>' }; i++; }
    else if (t.v === '<' && next?.t === 'w') { seg.inp = next.v; i++; }
    else if (t.v === '2>' && next?.t === 'w') { seg.errFile = next.v; i++; }
    else if (t.v === '2>&1') seg.errToOut = true;
  }
  endChain(null);
  return chain;
}

const globRe = (g: string) => new RegExp('^' + g.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*').replace(/\?/g, '[^/]') + '$');

function lineDiff(a: string[], b: string[]): string[] {
  const n = a.length, m = b.length;
  if (n * m > 4_000_000) return ['diff: files too large for an exact diff'];
  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: string[] = [];
  let i = 0, j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === b[j]) { out.push('  ' + a[i]); i++; j++; }
    else if (j < m && (i >= n || dp[i][j + 1] >= dp[i + 1][j])) { out.push('+ ' + b[j]); j++; }
    else { out.push('- ' + a[i]); i++; }
  }
  return out;
}

function jq(data: any, filter: string): any[] {
  const f = filter.trim();
  if (f === '.' || !f) return [data];
  if (f === 'keys') return [Object.keys(data ?? {})];
  if (f === 'length') return [Array.isArray(data) || typeof data === 'string' ? data.length : Object.keys(data ?? {}).length];
  const pipe = f.split('|').map((s) => s.trim());
  if (pipe.length > 1) return pipe.reduce<any[]>((vals, p) => vals.flatMap((v) => jq(v, p)), [data]);
  let vals = [data];
  const re = /\.([A-Za-z_$][\w$]*)|\.?\[(\d*)\]|\."([^"]+)"/g;
  let m: RegExpExecArray | null;
  let consumed = 0;
  while ((m = re.exec(f))) {
    consumed += m[0].length;
    if (m[1] || m[3]) vals = vals.map((v) => v?.[m![1] ?? m![3]]);
    else if (m[2] === '') vals = vals.flatMap((v) => (Array.isArray(v) ? v : Object.values(v ?? {})));
    else vals = vals.map((v) => v?.[+m![2]]);
  }
  if (consumed !== f.length) throw new Error(`jq: unsupported filter '${f}' (supported: . .key .a.b .[n] .[] keys length and pipes)`);
  return vals;
}

async function hash(algo: string, text: string) {
  const buf = await crypto.subtle.digest(algo, new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

export interface TerminalHandle { exec: (cmd: string) => void; focus: () => void }

export const Terminal = forwardRef<TerminalHandle, { initialCwd?: string; visible: boolean; name: string }>(function Terminal({ initialCwd = '', visible, name }, ref) {
  const ide = useIDE();
  const changes = useChanges();
  const changesRef = useRef(changes);
  changesRef.current = changes;
  const [lines, setLines] = useState<Line[]>([
    { text: `JotQoda Terminal v3.1 (${name}) — type "help" for commands · pipes, redirection & chaining supported`, cls: 'text-[var(--accent)]' },
  ]);
  const [cwd, setCwdState] = useState(initialCwd);
  const cwdRef = useRef(initialCwd);
  const setCwd = (c: string) => { cwdRef.current = c; setCwdState(c); };
  const env = useRef<Record<string, string>>({ HOME: '/workspace', USER: 'developer', SHELL: 'jotqoda-sh', PATH: '/workspace/bin', TERM: 'xterm-256color', '?': '0' });
  const aliases = useRef<Record<string, string>>({ ll: 'ls -la', la: 'ls -la', '..': 'cd ..' });
  const [input, setInput] = useState('');
  const [hist, setHist] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('jotqoda-hist') || '[]'); } catch { return []; } });
  const histRef = useRef(hist);
  histRef.current = hist;
  const [hi, setHi] = useState(-1);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = useRef(false);

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'nearest' }); }, [lines]);
  useEffect(() => { if (visible) setTimeout(() => inputRef.current?.focus(), 0); }, [visible]);

  const print = (text: string, cls?: string) => setLines((l) => [...l, ...(text.length > 1 && text.endsWith('\n') ? text.slice(0, -1) : text).split('\n').map((t) => ({ text: t, cls }))].slice(-5000));

  const run = async (raw: string) => {
    let cmdline = raw.trim();
    const prompt = `${cwdRef.current ? '~/' + cwdRef.current : '~'} $ `;
    if (/^!(!|\d+)$/.test(cmdline)) {
      const h = histRef.current;
      const rep = cmdline === '!!' ? h[h.length - 1] : h[+cmdline.slice(1) - 1];
      if (!rep) { print(prompt + cmdline, 'text-[var(--fg)] font-semibold'); print(`event not found: ${cmdline}`, 'text-red-400'); return; }
      cmdline = rep;
    }
    print(prompt + cmdline, 'text-[var(--fg)] font-semibold');
    if (!cmdline) return;
    const nh = [...histRef.current.filter((h) => h !== cmdline), cmdline].slice(-200);
    setHist(nh); histRef.current = nh; localStorage.setItem('jotqoda-hist', JSON.stringify(nh));
    busy.current = true;
    try { await runLine(cmdline); } finally { busy.current = false; }
  };

  const runLine = async (line: string) => {
    const I = () => ideRef.current ?? ide;
    // filesystem overlay so chained commands observe earlier writes before React re-renders
    const overlay = new Map<string, string | null>();
    const readFile = (p: string) => (overlay.has(p) ? overlay.get(p) : I().files[p]) ?? null;
    const fileList = () => { const s = new Set(Object.keys(I().files)); overlay.forEach((v, k) => (v == null ? s.delete(k) : s.add(k))); return [...s]; };
    const writeFile = (p: string, c: string) => { const exists = readFile(p) != null; overlay.set(p, c); if (exists) I().writeFile(p, c, true); else I().createFile(p, c, false); };
    const resolve = (p: string) => normPath(p.startsWith('/workspace') ? p.slice(10) : p.startsWith('/') || p.startsWith('~') ? p.replace(/^~/, '') : joinPath(cwdRef.current, p));
    const isDir = (p: string) => p === '' || I().folders.includes(p) || fileList().some((f) => f.startsWith(p + '/'));
    const children = (dir: string) => {
      const set = new Map<string, boolean>();
      const pre = dir ? dir + '/' : '';
      [...I().folders, ...fileList()].forEach((p) => {
        if (!p.startsWith(pre) || p === dir) return;
        const rest = p.slice(pre.length).split('/');
        set.set(rest[0], rest.length > 1 || readFile(p) == null);
      });
      return [...set.entries()].sort((a, b) => (a[1] === b[1] ? a[0].localeCompare(b[0]) : a[1] ? -1 : 1));
    };
    const expandGlobs = (argv: string[], quoted: boolean[]) => argv.flatMap((a, i) => {
      if (i === 0 || quoted[i] || !/[*?]/.test(a)) return [a];
      const full = resolve(a);
      const re = globRe(full);
      const hits = fileList().filter((f) => re.test(f)).map((f) => (cwdRef.current && f.startsWith(cwdRef.current + '/') ? f.slice(cwdRef.current.length + 1) : f)).sort();
      return hits.length ? hits : [a];
    });

    const cmd = async (argv: string[], io: IO): Promise<number> => {
      const [c0, ...rest] = argv;
      const ide = I();
      const out = io.out;
      const err = (m: string) => { io.err(m); return 1; };
      const flags = new Set(rest.filter((r) => /^-[A-Za-z]+$/.test(r)).flatMap((r) => [...r.slice(1)]));
      const pos = rest.filter((r) => !/^-[A-Za-z]+$/.test(r));
      const optVal = (flag: string) => { const i = rest.indexOf(flag); return i >= 0 ? rest[i + 1] : undefined; };
      const inputText = async (files: string[]) => {
        if (!files.length) return io.stdin ?? '';
        const parts: string[] = [];
        for (const f of files) { const t = readFile(resolve(f)); if (t == null) { io.err(`${c0}: ${f}: No such file`); continue; } parts.push(t); }
        return parts.join('\n');
      };
      const linesOf = (t: string) => { const l = t.split('\n'); if (l.length && l[l.length - 1] === '') l.pop(); return l; };
      const outLines = (ls: string[]) => { if (ls.length) out(ls.join('\n')); };
      switch (c0) {
        case 'help': {
          if (pos[0]) { const h = HELP.filter(([k]) => k.split(/[ |/·]/).includes(pos[0])); if (!h.length) return err(`help: no help for ${pos[0]}`); h.forEach(([k, d]) => out(`  ${k.padEnd(40)} ${d}`)); return 0; }
          HELP.forEach(([k, d]) => out(`  ${k.padEnd(40)} ${d}`));
          return 0;
        }
        case 'clear': case 'cls': setLines([]); return 0;
        case 'true': return 0;
        case 'false': return 1;
        case 'pwd': out('/workspace' + (cwdRef.current ? '/' + cwdRef.current : '')); return 0;
        case 'cd': {
          const t = pos[0] && pos[0] !== '~' ? (pos[0] === '-' ? env.current.OLDPWD ?? '' : resolve(pos[0])) : '';
          if (!isDir(t)) return err(`cd: no such directory: ${pos[0]}`);
          env.current.OLDPWD = cwdRef.current;
          setCwd(t);
          return 0;
        }
        case 'ls': case 'dir': {
          const target = resolve(pos[0] ?? '.');
          if (readFile(target) != null) { out(basename(target)); return 0; }
          if (!isDir(target)) return err(`ls: cannot access '${pos[0]}': No such file or directory`);
          const items = children(target).filter(([n]) => flags.has('a') || !n.startsWith('.'));
          if (flags.has('l')) items.forEach(([n, d]) => { const p = joinPath(target, n); out(`${d ? 'drwxr-xr-x' : '-rw-r--r--'}  ${String(d ? '-' : new Blob([readFile(p) ?? '']).size).padStart(7)}  ${n}${d ? '/' : ''}`, d ? 'text-sky-400' : ''); });
          else out(items.map(([n, d]) => (d ? n + '/' : n)).join('   ') || '(empty)');
          return 0;
        }
        case 'tree': {
          const root = resolve(pos[0] ?? '.');
          let nd = 0, nf = 0;
          const walk = (dir: string, pre: string) => {
            const items = children(dir);
            items.forEach(([n, d], i) => {
              const last = i === items.length - 1;
              out(pre + (last ? '└── ' : '├── ') + n + (d ? '/' : ''), d ? 'text-sky-400' : '');
              if (d) { nd++; walk(joinPath(dir, n), pre + (last ? '    ' : '│   ')); } else nf++;
            });
          };
          out(root || '.', 'text-sky-400'); walk(root, ''); out(`\n${nd} directories, ${nf} files`);
          return 0;
        }
        case 'cat': case 'type': { if (c0 === 'type' && pos[0] && COMMANDS.includes(pos[0])) { out(`${pos[0]} is a jotqoda-sh builtin`); return 0; } const t = await inputText(pos); if (t) out(flags.has('n') ? linesOf(t).map((l, i) => `${String(i + 1).padStart(6)}  ${l}`).join('\n') : t.replace(/\n$/, '')); return 0; }
        case 'head': case 'tail': {
          const n = +(optVal('-n') ?? (rest.find((r) => /^-\d+$/.test(r))?.slice(1)) ?? 10);
          const files = pos.filter((p) => p !== String(n));
          const ls = linesOf(await inputText(files));
          outLines(c0 === 'head' ? ls.slice(0, n) : ls.slice(-n));
          return 0;
        }
        case 'touch': pos.forEach((f) => { const p = resolve(f); if (readFile(p) == null) writeFile(p, ''); }); return 0;
        case 'mkdir': pos.forEach((f) => ide.createFolder(resolve(f))); return 0;
        case 'rm': case 'del': {
          let code = 0;
          for (const f of pos) { const p = resolve(f); if (readFile(p) == null && !isDir(p)) { if (!flags.has('f')) code = err(`rm: ${f}: No such file or directory`); continue; } if (readFile(p) == null && !flags.has('r') && !flags.has('R')) { code = err(`rm: ${f}: is a directory (use -r)`); continue; } ide.deletePath(p, true); overlay.set(p, null); }
          return code;
        }
        case 'mv': case 'rename': { if (pos.length < 2) return err('usage: mv <src> <dst>'); const a = resolve(pos[0]); let b = resolve(pos[1]); if (isDir(b) && readFile(b) == null) b = joinPath(b, basename(a)); ide.renamePath(a, b); if (readFile(a) != null) { overlay.set(b, readFile(a)); overlay.set(a, null); } return 0; }
        case 'cp': case 'copy': {
          if (pos.length < 2) return err('usage: cp [-r] <src> <dst>');
          const a = resolve(pos[0]); let b = resolve(pos[1]);
          if (readFile(a) != null) { if (isDir(b)) b = joinPath(b, basename(a)); writeFile(b, readFile(a)!); return 0; }
          if (isDir(a) && (flags.has('r') || flags.has('R'))) { fileList().filter((f) => f.startsWith(a + '/')).forEach((f) => writeFile(b + f.slice(a.length), readFile(f)!)); return 0; }
          return err(`cp: ${pos[0]}: No such file (use -r for folders)`);
        }
        case 'echo': { let t = pos.join(' '); if (flags.has('e')) t = t.replace(/\\n/g, '\n').replace(/\\t/g, '\t'); if (flags.has('n')) out(t); else out(t); return 0; }
        case 'grep': case 'egrep': {
          const recursive = flags.has('r') || flags.has('R');
          const [pat, ...files] = pos;
          if (pat == null) return err('usage: grep [-invcr] <pattern> [files]');
          let re: RegExp;
          try { re = new RegExp(pat, flags.has('i') ? 'i' : ''); } catch (e: any) { return err(`grep: ${e.message}`); }
          const multi = files.length > 1 || recursive || (!files.length && io.stdin == null);
          const targets: [string, string][] = [];
          if (files.length) for (const f of files) { const p = resolve(f); if (readFile(p) != null) targets.push([p, readFile(p)!]); else if (isDir(p) && recursive) fileList().filter((x) => x.startsWith(p ? p + '/' : '')).forEach((x) => targets.push([x, readFile(x)!])); else io.err(`grep: ${f}: No such file or directory`); }
          else if (io.stdin != null) targets.push(['(stdin)', io.stdin]);
          else fileList().filter((p) => !cwdRef.current || p.startsWith(cwdRef.current + '/')).forEach((p) => targets.push([p, readFile(p)!]));
          let total = 0;
          for (const [p, text] of targets) {
            let n = 0;
            linesOf(text).forEach((l, i) => {
              if (re.test(l) === flags.has('v')) return;
              n++; total++;
              if (flags.has('c') || flags.has('l')) return;
              const loc = p === '(stdin)' ? '' : multi || flags.has('n') ? `${p}:${flags.has('n') || multi ? i + 1 + ':' : ''}` : '';
              out(`${loc}${loc ? ' ' : ''}${l.length > 400 ? l.slice(0, 400) + '…' : l}`, loc ? 'text-amber-200' : undefined);
            });
            if (flags.has('c')) out(`${multi ? p + ':' : ''}${n}`);
            if (flags.has('l') && n) out(p);
          }
          return total ? 0 : 1;
        }
        case 'find': {
          const dir = resolve(pos[0] && !pos[0].startsWith('-') ? pos[0] : '.');
          const name = optVal('-name') ?? optVal('-iname');
          const re = name ? new RegExp(globRe(name).source, optVal('-iname') ? 'i' : '') : null;
          const typeD = optVal('-type') === 'd';
          const pool = typeD ? [...new Set([...I().folders, ...fileList().map(dirname)])].filter(Boolean) : fileList();
          pool.filter((p) => (!dir || p.startsWith(dir + '/') || p === dir) && (!re || re.test(basename(p)))).sort().forEach((p) => out(p));
          return 0;
        }
        case 'wc': {
          const files = pos.length ? pos : [null];
          for (const f of files) {
            const t = f ? readFile(resolve(f)) : io.stdin ?? '';
            if (t == null) { io.err(`wc: ${f}: No such file`); continue; }
            const l = t.split('\n').length - (t.endsWith('\n') ? 1 : 0), w = (t.match(/\S+/g) || []).length, ch = t.length;
            const parts = flags.size ? [flags.has('l') ? l : null, flags.has('w') ? w : null, flags.has('c') || flags.has('m') ? ch : null].filter((x) => x != null) : [l, w, ch];
            out(parts.map((x) => String(x).padStart(7)).join(' ') + (f ? '  ' + f : ''));
          }
          return 0;
        }
        case 'sort': {
          let ls = linesOf(await inputText(pos));
          ls = flags.has('n') ? ls.sort((a, b) => parseFloat(a) - parseFloat(b)) : ls.sort((a, b) => (flags.has('f') ? a.toLowerCase().localeCompare(b.toLowerCase()) : a < b ? -1 : a > b ? 1 : 0));
          if (flags.has('r')) ls.reverse();
          if (flags.has('u')) ls = [...new Set(ls)];
          outLines(ls);
          return 0;
        }
        case 'uniq': {
          const ls = linesOf(await inputText(pos));
          const res: [string, number][] = [];
          for (const l of ls) { const last = res[res.length - 1]; if (last && last[0] === l) last[1]++; else res.push([l, 1]); }
          out(res.filter(([, n]) => !flags.has('d') || n > 1).map(([l, n]) => (flags.has('c') ? `${String(n).padStart(7)} ${l}` : l)).join('\n'));
          return 0;
        }
        case 'rev': outLines(linesOf(await inputText(pos)).map((l) => [...l].reverse().join(''))); return 0;
        case 'tac': outLines(linesOf(await inputText(pos)).reverse()); return 0;
        case 'nl': outLines(linesOf(await inputText(pos)).map((l, i) => `${String(i + 1).padStart(6)}\t${l}`)); return 0;
        case 'cut': {
          const d = optVal('-d') ?? '\t';
          const fspec = optVal('-f') ?? optVal('-c');
          if (!fspec) return err('usage: cut -d <delim> -f <fields>   (e.g. -f 1,3 or -f 2-4)');
          const idx = fspec.split(',').flatMap((r) => { const [a, b] = r.split('-').map((x) => (x ? +x : NaN)); return b !== undefined ? Array.from({ length: (isNaN(b) ? 50 : b) - (isNaN(a) ? 1 : a) + 1 }, (_, k) => (isNaN(a) ? 1 : a) + k) : [a]; });
          const files = pos.filter((p) => p !== d && p !== fspec);
          const byChar = rest.includes('-c');
          out(linesOf(await inputText(files)).map((l) => (byChar ? idx.map((i) => l[i - 1] ?? '').join('') : idx.map((i) => l.split(d)[i - 1]).filter((x) => x != null).join(d))).join('\n'));
          return 0;
        }
        case 'tr': {
          const del = flags.has('d');
          const ex = (s: string) => s.replace(/(\w)-(\w)/g, (_, a, b) => { let r = ''; for (let i = a.charCodeAt(0); i <= b.charCodeAt(0); i++) r += String.fromCharCode(i); return r; }).replace(/\\n/g, '\n').replace(/\\t/g, '\t');
          const a = ex(pos[0] ?? ''), b = ex(pos[1] ?? '');
          const t = io.stdin ?? '';
          out([...t].filter((ch) => !(del && a.includes(ch))).map((ch) => (!del && a.includes(ch) ? b[Math.min(a.indexOf(ch), b.length - 1)] ?? '' : ch)).join('').replace(/\n$/, ''));
          return 0;
        }
        case 'sed': {
          const script = pos[0];
          const m = script && /^s(.)(.*?)\1(.*?)\1([gimI]*)$/.exec(script);
          const np = script && /^(\d+)(?:,(\d+))?p$/.exec(script);
          const files = pos.slice(1);
          const t = await inputText(files);
          if (np && flags.has('n')) { const ls = linesOf(t); out(ls.slice(+np[1] - 1, np[2] ? +np[2] : +np[1]).join('\n')); return 0; }
          if (!m) return err("sed: only substitutions are supported, e.g. sed 's/old/new/g' or sed -n '2,5p'");
          const re = new RegExp(m[2], (m[4].includes('g') ? 'g' : '') + (/[iI]/.test(m[4]) ? 'i' : '') + 'm');
          const res = linesOf(t).map((l) => l.replace(re, m[3].replace(/\\(\d)/g, '$$$1').replace(/&/g, '$$&'))).join('\n');
          if (flags.has('i') && files.length) { writeFile(resolve(files[0]), res + '\n'); return 0; }
          out(res);
          return 0;
        }
        case 'awk': {
          const sep = optVal('-F');
          const prog = pos.find((p) => p !== sep && /\{.*\}/.test(p)) ?? pos[0];
          const files = pos.filter((p) => p !== prog && p !== sep);
          const pm = prog && /^\s*(?:\/(.*)\/\s*)?\{\s*print\s*(.*?)\s*;?\s*\}\s*$/.exec(prog);
          if (!pm) return err("awk: supported form: awk [-F sep] '[/re/] { print $1, $3 }'");
          const re = pm[1] ? new RegExp(pm[1]) : null;
          const exprs = pm[2] ? pm[2].split(',').map((x) => x.trim()) : ['$0'];
          linesOf(await inputText(files)).forEach((l, i) => {
            if (re && !re.test(l)) return;
            const fields = sep ? l.split(sep === '\\t' ? '\t' : sep) : l.trim().split(/\s+/);
            const val = (tok: string): string => {
              if (/^".*"$/.test(tok)) return tok.slice(1, -1).replace(/\\t/g, '\t');
              if (tok === '$NF') return fields[fields.length - 1] ?? '';
              if (/^\$\d+$/.test(tok)) return +tok.slice(1) === 0 ? l : fields[+tok.slice(1) - 1] ?? '';
              if (tok === 'NR') return String(i + 1);
              if (tok === 'NF') return String(fields.length);
              return tok;
            };
            const evalExpr = (e: string) => {
              const toks = e.match(/"(?:[^"\\]|\\.)*"|\$NF|\$\d+|NR|NF|\d+(?:\.\d+)?|[-+*/%()]|\S+/g) ?? [];
              const arith = toks.length > 1 && toks.some((t) => /^[-+*/%]$/.test(t)) && toks.every((t) => /^[-+*/%()]$/.test(t) || !/^"/.test(t));
              if (arith) {
                const js = toks.map((t) => (/^[-+*/%()]$/.test(t) ? t : String(Number(val(t)) || 0))).join(' ');
                try { const r = Function(`return (${js})`)(); return String(Math.round(r * 1e10) / 1e10); } catch { /* fall back to concatenation */ }
              }
              return toks.map(val).join('');
            };
            out(exprs.map(evalExpr).join(' '));
          });
          return 0;
        }
        case 'tee': { const t = io.stdin ?? ''; for (const f of pos) { const p = resolve(f); writeFile(p, flags.has('a') && readFile(p) != null ? readFile(p)! + t : t); } out(t.replace(/\n$/, '')); return 0; }
        case 'diff': {
          if (pos.length < 2) return err('usage: diff <file1> <file2>');
          const a = readFile(resolve(pos[0])), b = readFile(resolve(pos[1]));
          if (a == null || b == null) return err(`diff: ${a == null ? pos[0] : pos[1]}: No such file`);
          if (a === b) return 0;
          out(`--- ${pos[0]}\n+++ ${pos[1]}`, 'font-bold');
          lineDiff(linesOf(a), linesOf(b)).forEach((l) => { if (l[0] !== ' ' || !flags.has('q')) out(l, l[0] === '+' ? 'text-emerald-400' : l[0] === '-' ? 'text-red-400' : 'text-[var(--muted)]'); });
          return 1;
        }
        case 'jq': {
          const filter = pos[0] ?? '.';
          const t = await inputText(pos.slice(1));
          let data: any;
          try { data = JSON.parse(t); } catch (e: any) { return err(`jq: invalid JSON input: ${e.message}`); }
          for (const v of jq(data, filter)) out(flags.has('r') && typeof v === 'string' ? v : JSON.stringify(v, null, 2) ?? 'null');
          return 0;
        }
        case 'base64': { const t = await inputText(pos); try { out(flags.has('d') ? decodeURIComponent(escape(atob(t.trim()))) : btoa(unescape(encodeURIComponent(t)))); } catch { return err('base64: invalid input'); } return 0; }
        case 'sha1sum': case 'sha256sum': case 'sha512sum': case 'shasum': {
          const algo = c0 === 'sha1sum' || c0 === 'shasum' ? 'SHA-1' : c0 === 'sha512sum' ? 'SHA-512' : 'SHA-256';
          if (!pos.length) { out(`${await hash(algo, io.stdin ?? '')}  -`); return 0; }
          for (const f of pos) { const t = readFile(resolve(f)); if (t == null) io.err(`${c0}: ${f}: No such file`); else out(`${await hash(algo, t)}  ${f}`); }
          return 0;
        }
        case 'uuid': case 'uuidgen': out(crypto.randomUUID()); return 0;
        case 'seq': { const nums = pos.map(Number); const [a, step, b] = nums.length >= 3 ? nums : nums.length === 2 ? [nums[0], 1, nums[1]] : [1, 1, nums[0] ?? 1]; if (!isFinite(a) || !isFinite(b) || !step) return err('usage: seq [first [step]] last'); const r: number[] = []; for (let x = a; step > 0 ? x <= b : x >= b; x += step) { r.push(x); if (r.length > 100000) break; } out(r.join('\n')); return 0; }
        case 'sleep': { const s = parseFloat(pos[0] ?? '1'); await new Promise((r) => setTimeout(r, Math.min(60, Math.max(0, s)) * 1000)); return 0; }
        case 'curl': case 'wget': {
          const url = pos.find((p) => /^https?:\/\//.test(p));
          if (!url) return err(`usage: ${c0} <url> [-o file]`);
          try {
            const res = await fetch(url);
            const text = await res.text();
            const o = optVal('-o') ?? optVal('-O') ?? (c0 === 'wget' ? basename(new URL(url).pathname) || 'index.html' : undefined);
            if (flags.has('I') || flags.has('i')) out(`HTTP ${res.status} ${res.statusText}\n` + [...res.headers].map(([k, v]) => `${k}: ${v}`).join('\n'));
            if (o) { writeFile(resolve(o), text); out(`Saved ${text.length} bytes to ${o}`, 'text-emerald-400'); }
            else if (!flags.has('I')) out(text.replace(/\n$/, ''));
            return res.ok ? 0 : 22;
          } catch (e: any) { return err(`${c0}: ${e.message} — the server must allow cross-origin (CORS) requests`); }
        }
        case 'stat': { const p = resolve(pos[0] ?? ''); const t = readFile(p); if (t == null) return isDir(p) ? (out(`  File: ${p || '.'}/\n  Type: directory\n  Entries: ${children(p).length}`), 0) : err(`stat: ${pos[0]}: No such file`); out(`  File: ${p}\n  Size: ${new Blob([t]).size} bytes\n Lines: ${t.split('\n').length}\n  Lang: ${getLang(p, t).name}\n Saved: ${I().saved[p] === t ? 'yes' : 'no (unsaved changes)'}\n   Git: ${I().head[p] == null ? 'untracked' : I().head[p] === t ? 'unmodified' : 'modified'}`); return 0; }
        case 'du': {
          const dir = resolve(pos[0] ?? '.');
          const sizes = new Map<string, number>();
          fileList().filter((f) => !dir || f.startsWith(dir + '/')).forEach((f) => { const n = new Blob([readFile(f)!]).size; let d = dirname(f); sizes.set(f, n); while (true) { sizes.set(d + '/', (sizes.get(d + '/') ?? 0) + n); if (!d || d === dir) break; d = dirname(d); } });
          const fmtSize = (n: number) => (flags.has('h') ? (n > 1048576 ? (n / 1048576).toFixed(1) + 'M' : n > 1024 ? (n / 1024).toFixed(1) + 'K' : n + 'B') : String(Math.ceil(n / 1024)));
          [...sizes].filter(([k]) => k.endsWith('/') || flags.has('a')).sort((a, b) => a[0].localeCompare(b[0])).forEach(([k, n]) => out(`${fmtSize(n).padStart(8)}  ${k === '/' ? '.' : k.replace(/\/$/, '') || '.'}`));
          return 0;
        }
        case 'file': { for (const f of pos) { const p = resolve(f); const t = readFile(p); if (t == null) { io.err(`file: ${f}: No such file`); continue; } const l = getLang(p, t); out(`${f}: ${l.name} (${l.category})${l.runnable ? ` — ${l.runnable === 'css' ? 'previewable' : 'runnable'}` : ''}, ${t.split('\n').length} lines`); } return 0; }
        case 'env': case 'printenv': Object.entries(env.current).filter(([k]) => k !== '?').forEach(([k, v]) => out(`${k}=${v}`)); return 0;
        case 'export': case 'set': for (const a of pos) { const m = /^([A-Za-z_]\w*)=(.*)$/.exec(a); if (m) env.current[m[1]] = m[2]; else if (!(a in env.current)) env.current[a] = ''; } return 0;
        case 'unset': pos.forEach((k) => delete env.current[k]); return 0;
        case 'alias': { if (!pos.length) { Object.entries(aliases.current).forEach(([k, v]) => out(`alias ${k}='${v}'`)); return 0; } for (const a of pos) { const m = /^([^=]+)=(.*)$/.exec(a); if (m) aliases.current[m[1]] = m[2]; else if (aliases.current[a]) out(`alias ${a}='${aliases.current[a]}'`); } return 0; }
        case 'unalias': pos.forEach((k) => delete aliases.current[k]); return 0;
        case 'which': for (const p of pos) { if (aliases.current[p]) out(`${p}: aliased to ${aliases.current[p]}`); else if (COMMANDS.includes(p) || RUNNERS.has(p)) out(`/workspace/bin/${p} (jotqoda-sh builtin)`); else { io.err(`${p} not found`); } } return 0;
        case 'open': case 'code': case 'vim': case 'nano': case 'edit': { if (!pos.length) return err(`usage: ${c0} <file>`); for (const f of pos) { const [p, ln] = f.split(':'); const full = resolve(p); if (readFile(full) == null) writeFile(full, ''); setTimeout(() => (ln ? I().revealAt(full, +ln) : I().openFile(full)), 0); } return 0; }
        case 'format': case 'prettier': { const p = resolve(pos[0] ?? I().activeFile ?? ''); if (readFile(p) == null) return err(`format: cannot find '${pos[0] ?? ''}'`); const ok = await I().formatDocument(p); out(ok ? `Formatted ${p}` : `Could not format ${p}`, ok ? 'text-emerald-400' : 'text-amber-300'); return ok ? 0 : 1; }
        case 'preview': { const p = resolve(pos[0] ?? I().activeFile ?? ''); if (readFile(p) == null) return err('preview: file not found'); I().setPreviewPath(p); return 0; }
        case 'zip': { const d = pos[0] ? resolve(pos[0]) : undefined; if (d && !isDir(d)) return err('zip: not a directory'); await I().downloadZip(d); return 0; }
        case 'js': case 'eval': { const r = new Function('return (' + pos.join(' ') + ')')(); out(typeof r === 'object' ? JSON.stringify(r, null, 2) : String(r), 'text-emerald-300'); return 0; }
        case 'calc': case 'bc': { const e = pos.join(' ') || (io.stdin ?? '').trim(); if (!/^[\d\s+\-*/%().^e,Math.a-z]+$/i.test(e)) return err('invalid expression'); out(String(Function(`with(Math){return (${e.replace(/\^/g, '**')})}`)()), 'text-emerald-300'); return 0; }
        case 'git': {
          const sub = pos[0];
          const ch = changesRef.current;
          if (sub === 'status') {
            out('On branch main');
            if (!ch.length) out('nothing to commit, working tree clean');
            else { out('Changes not committed:'); ch.forEach((c) => out(`    ${({ M: 'modified: ', A: 'new file: ', D: 'deleted:  ' })[c.status]} ${c.path}`, c.status === 'D' ? 'text-red-400' : c.status === 'A' ? 'text-emerald-400' : 'text-amber-300')); }
          } else if (sub === 'log') {
            const one = rest.includes('--oneline');
            [...I().commits].reverse().forEach((c) => { if (one) out(`${c.id.slice(0, 7)} ${c.message}`, 'text-amber-300'); else { out(`commit ${c.id}`, 'text-amber-300'); out(`Date:   ${new Date(c.date).toString()}`); out(`\n    ${c.message}\n`); } });
          } else if (sub === 'commit') {
            const mi = rest.indexOf('-m'); const msg = mi >= 0 ? rest.slice(mi + 1).join(' ') : 'Commit from terminal';
            if (!ch.length) out('nothing to commit'); else { I().commit(msg); out(`[main] ${msg} — ${ch.length} file(s) changed`, 'text-emerald-400'); }
          } else if (sub === 'diff') {
            ch.filter((c) => c.status === 'M' && (!pos[1] || c.path === resolve(pos[1]))).forEach((c) => {
              out(`diff --git a/${c.path} b/${c.path}`, 'font-bold');
              lineDiff(I().head[c.path].split('\n'), I().files[c.path].split('\n')).forEach((l) => { if (l[0] !== ' ') out(l, l[0] === '+' ? 'text-emerald-400' : 'text-red-400'); });
            });
          } else if (sub === 'branch') out('* main', 'text-emerald-400');
          else if (sub === 'add') out('(all changes are staged automatically in JotQoda)', 'text-[var(--muted)]');
          else out('usage: git status | log [--oneline] | diff [file] | commit -m "msg" | branch');
          return 0;
        }
        case 'theme': {
          if (!pos[0]) { THEMES.forEach((t) => out(`  ${t.id === I().settings.theme ? '●' : '○'} ${t.id.padEnd(20)} ${t.name}`)); return 0; }
          const t = THEMES.find((x) => x.id === pos[0] || x.name.toLowerCase() === pos.join(' ').toLowerCase()); if (!t) return err('unknown theme — run "theme" to list'); I().setSetting('theme', t.id); out(`Theme set to ${t.name}`); return 0;
        }
        case 'langs': case 'languages': {
          const q = pos.join(' ').toLowerCase();
          const list = LANGUAGES.filter((l) => !q || (l.name + ' ' + l.exts.join(' ') + ' ' + l.category).toLowerCase().includes(q));
          if (q) list.forEach((l) => out(`  ${l.name.padEnd(34)} ${l.category.padEnd(16)} ${l.exts.slice(0, 5).map((e) => '.' + e).join(' ')}${l.runnable && l.runnable !== 'css' ? '  ▶' : ''}`));
          else out(list.map((l) => l.name).join(', '));
          out(`${list.length} of ${LANGUAGES.length} languages`, 'text-[var(--accent)]');
          return 0;
        }
        case 'history': { if (flags.has('c')) { setHist([]); histRef.current = []; localStorage.setItem('jotqoda-hist', '[]'); return 0; } histRef.current.forEach((h, i) => out(`  ${String(i + 1).padStart(4)}  ${h}`)); return 0; }
        case 'date': out(new Date().toString()); return 0;
        case 'whoami': out('developer'); return 0;
        case 'hostname': out('jotqoda'); return 0;
        case 'uname': out(flags.has('a') ? 'JotQodaOS 3.1 jotqoda WebAssembly ' + navigator.platform : 'JotQodaOS'); return 0;
        case 'neofetch': {
          const art = ['  ╔███╗ ╔██╗╔═══╗', '  ╚███╔╝ ╚██╔╝██╗ ', '   ╚██╔╝  ╚██╔╝██║ ', '   ██╔╝   ██╔╝██║ ', '   ╚═╝    ╚═╝╚═╝ ', '                  '];
          const info = [`developer@jotqoda`, '────────────────', `OS: JotQodaOS (browser)`, `Shell: jotqoda-sh 3.1`, `Theme: ${I().settings.theme}`, `Languages: ${LANGUAGES.length}`];
          art.forEach((a, i) => out(a + '  ' + info[i], i === 0 ? 'text-[var(--accent)]' : ''));
          out(`  Files: ${fileList().length}  Commits: ${I().commits.length}`);
          return 0;
        }
        case 'npm': case 'yarn': case 'pnpm': case 'pip': case 'cargo': case 'go': case 'gcc': case 'g++': case 'clang': case 'javac': case 'java': case 'make': case 'rustc': case 'dotnet':
          return err(`${c0}: not available in the browser sandbox. In-browser runtimes: node/deno (JS/TS), python, sql, lua, ruby, php, scheme, prolog, coffee, clojure, wat, bf — try "run <file>".`);
        case 'exit': I().setPanelOpen(false); return 0;
        default: {
          if (RUNNERS.has(c0)) {
            if (c0 === 'node' && rest[0] === '-e') { out(String(new Function('return (' + rest.slice(1).join(' ') + ')')())); return 0; }
            const p = resolve(pos[0] ?? I().activeFile ?? '');
            if (readFile(p) == null) return err(`${c0}: cannot find '${pos[0] ?? ''}'`);
            out(`Running ${p} with the ${getLang(p, readFile(p)!).name} runtime — see OUTPUT`, 'text-emerald-400');
            setTimeout(() => I().run(p), 0);
            return 0;
          }
          return err(`command not found: ${c0}. Type "help" for a list of commands.`);
        }
      }
    };

    // split on && || ; first (quote aware) so $VARS expand when each command runs, like a real shell
    const parts: { text: string; prev: string | null }[] = [];
    {
      let cur = '', q: string | null = null, prev: string | null = null;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (q) { cur += c; if (c === '\\' && q === '"' && i + 1 < line.length) cur += line[++i]; else if (c === q) q = null; continue; }
        if (c === '"' || c === "'") { q = c; cur += c; continue; }
        if (c === '\\' && i + 1 < line.length) { cur += c + line[++i]; continue; }
        const two = line.slice(i, i + 2);
        if (two === '&&' || two === '||') { parts.push({ text: cur, prev }); prev = two; cur = ''; i++; continue; }
        if (c === ';') { parts.push({ text: cur, prev }); prev = ';'; cur = ''; continue; }
        cur += c;
      }
      parts.push({ text: cur, prev });
    }
    let status = 0;
    for (const part of parts) {
      if (!part.text.trim()) continue;
      if (part.prev === '&&' && status !== 0) continue;
      if (part.prev === '||' && status === 0) continue;
      const item = parse(lex(part.text, env.current))[0];
      if (!item) continue;
      let stdin: string | undefined;
      for (let i = 0; i < item.segs.length; i++) {
        const seg = item.segs[i];
        let argv = expandGlobs(seg.argv, seg.quoted);
        const al = aliases.current[argv[0]];
        if (al) argv = [...al.split(/\s+/), ...argv.slice(1)];
        if (seg.inp) { const t = readFile(resolve(seg.inp)); if (t == null) { print(`${seg.inp}: No such file`, 'text-red-400'); status = 1; break; } stdin = t; }
        const last = i === item.segs.length - 1;
        const buf: string[] = [];
        const toTerm = last && !seg.out;
        const errBuf: string[] = [];
        const io: IO = {
          stdin,
          out: (text, cls) => (toTerm ? print(text, cls) : buf.push(text)),
          err: (text) => (seg.errToOut ? (toTerm ? print(text, 'text-red-400') : buf.push(text)) : seg.errFile ? errBuf.push(text) : print(text, 'text-red-400')),
        };
        try { status = await cmd(argv, io); }
        catch (e: any) { io.err(String(e?.message ?? e)); status = 1; }
        stdin = buf.length ? buf.join('\n') + '\n' : '';
        if (seg.errFile) writeFile(resolve(seg.errFile), errBuf.join('\n') + (errBuf.length ? '\n' : ''));
        if (seg.out) {
          const p = resolve(seg.out.file);
          const prev = readFile(p);
          writeFile(p, seg.out.append && prev != null ? prev + stdin : stdin);
        }
      }
      env.current['?'] = String(status);
    }
  };

  useImperativeHandle(ref, () => ({ exec: (c: string) => { run(c); }, focus: () => inputRef.current?.focus() }));

  const complete = () => {
    const parts = input.split(' ');
    const last = parts[parts.length - 1];
    const I = ideRef.current ?? ide;
    if (parts.length === 1) {
      const cmds = [...new Set([...COMMANDS, ...RUNNERS, ...Object.keys(aliases.current)])].filter((c) => c.startsWith(last)).sort();
      if (cmds.length === 1) setInput(cmds[0] + ' ');
      else if (cmds.length > 1) print(cmds.join('   '), 'text-[var(--muted)]');
      return;
    }
    const dir = last.includes('/') ? normPath(joinPath(cwdRef.current, dirname(last))) : cwdRef.current;
    const prefix = basename(last);
    const pre = dir ? dir + '/' : '';
    const opts = new Map<string, boolean>();
    [...I.folders, ...Object.keys(I.files)].forEach((p) => { if (!p.startsWith(pre)) return; const r = p.slice(pre.length).split('/'); if (r[0].startsWith(prefix)) opts.set(r[0], r.length > 1 || I.files[p] == null); });
    const list = [...opts];
    if (list.length === 1) {
      parts[parts.length - 1] = (last.includes('/') ? dirname(last) + '/' : '') + list[0][0] + (list[0][1] ? '/' : '');
      setInput(parts.join(' '));
    } else if (list.length > 1) {
      const common = list.map(([n]) => n).reduce((a, b) => { let i = 0; while (i < a.length && a[i] === b[i]) i++; return a.slice(0, i); });
      if (common.length > prefix.length) { parts[parts.length - 1] = (last.includes('/') ? dirname(last) + '/' : '') + common; setInput(parts.join(' ')); }
      else print(list.map(([n, d]) => n + (d ? '/' : '')).join('   '), 'text-[var(--muted)]');
    }
  };

  const renderText = (text: string) => {
    const I = ideRef.current ?? ide;
    const parts: React.ReactNode[] = [];
    const re = /(https?:\/\/[^\s'"<>)]+)|((?:[\w.\-]+\/)*[\w.\-]+\.[A-Za-z0-9]+):(\d+)(?::(\d+))?/g;
    let last = 0;
    let m: RegExpExecArray | null;
    let k = 0;
    while ((m = re.exec(text))) {
      if (m[1]) { parts.push(text.slice(last, m.index)); parts.push(<a key={k++} href={m[1]} target="_blank" rel="noreferrer" className="underline decoration-dotted hover:text-[var(--accent)]">{m[1]}</a>); last = m.index + m[0].length; continue; }
      const p = normPath(m[2].startsWith('/') ? m[2] : joinPath(cwdRef.current, m[2]));
      const target = I.files[p] != null ? p : I.files[m[2]] != null ? m[2] : null;
      if (!target) continue;
      parts.push(text.slice(last, m.index));
      const ln = +m[3], col = m[4] ? +m[4] : 1;
      parts.push(<span key={k++} onClick={(e) => { e.stopPropagation(); I.revealAt(target, ln, col); }} className="underline decoration-dotted cursor-pointer hover:text-[var(--accent)]">{m[0]}</span>);
      last = m.index + m[0].length;
    }
    if (!parts.length) return text || '\u00a0';
    parts.push(text.slice(last));
    return parts;
  };

  return (
    <div className="h-full overflow-auto px-3 py-1 font-mono leading-[1.45] cursor-text" style={{ fontSize: ide.settings.terminalFontSize }} onClick={() => window.getSelection()?.toString() || inputRef.current?.focus()}>
      {lines.map((l, i) => <div key={i} className={`whitespace-pre-wrap break-all ${l.cls ?? 'text-[var(--fg)]/85'}`}>{l.text.length < 2000 ? renderText(l.text) : l.text}</div>)}
      <div className="flex items-center">
        <span className="text-emerald-400 shrink-0">developer@jotqoda</span><span className="text-[var(--muted)] shrink-0">:</span>
        <span className="text-sky-400 shrink-0">{cwd ? '~/' + cwd : '~'}</span><span className="text-[var(--muted)] mr-2 shrink-0">$</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          aria-label="Terminal input"
          className="flex-1 bg-transparent outline-none text-[var(--fg)] caret-[var(--accent)]"
          onKeyDown={(e) => {
            if (e.key === 'Enter') { run(input); setInput(''); setHi(-1); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); const n = hi < 0 ? hist.length - 1 : Math.max(0, hi - 1); if (hist[n] != null) { setHi(n); setInput(hist[n]); } }
            else if (e.key === 'ArrowDown') { e.preventDefault(); const n = hi + 1; if (hi >= 0 && n < hist.length) { setHi(n); setInput(hist[n]); } else { setHi(-1); setInput(''); } }
            else if (e.key === 'Tab') { e.preventDefault(); complete(); }
            else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); setLines([]); }
            else if (e.key === 'c' && e.ctrlKey && !window.getSelection()?.toString()) { print(`$ ${input}^C`); setInput(''); ide.stop(); }
          }}
        />
      </div>
      <div ref={endRef} />
    </div>
  );
});
