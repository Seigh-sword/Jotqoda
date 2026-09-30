import { useEffect, useRef, useState } from 'react';
import { useIDE, normPath, joinPath, dirname, basename } from '../ide/types';
import { THEMES } from '../ide/themes';
import { LANGUAGES } from '../ide/languages';
import { useChanges } from './GitView';

type Line = { text: string; cls?: string };

const HELP: [string, string][] = [
  ['help', 'Show this help'], ['ls [-la] [dir]', 'List directory'], ['cd <dir>', 'Change directory'], ['pwd', 'Print working directory'],
  ['tree [dir]', 'Show directory tree'], ['cat <file>', 'Print file'], ['head/tail <file> [n]', 'First/last n lines'],
  ['touch <file>', 'Create file'], ['mkdir <dir>', 'Create folder'], ['rm [-r] <path>', 'Delete'], ['mv <a> <b>', 'Move / rename'],
  ['cp <a> <b>', 'Copy file'], ['echo <text> [> file]', 'Print or write to file (>> append)'], ['grep <pattern> [file]', 'Search text'],
  ['wc <file>', 'Line/word/char count'], ['find <name>', 'Find files by name'], ['open|code <file>', 'Open in editor'],
  ['run|node|python|sql <file>', 'Execute a file'], ['js <expr>', 'Evaluate JavaScript expression'], ['calc <expr>', 'Calculator'],
  ['git status|log|commit -m "msg"|diff', 'Source control'], ['theme [name]', 'List/switch themes'], ['langs', 'List supported languages'],
  ['history', 'Command history'], ['date / whoami / uname', 'System info'], ['neofetch', 'System summary'], ['clear', 'Clear terminal (Ctrl+L)'], ['exit', 'Close panel'],
];

export function Terminal() {
  const ide = useIDE();
  const changes = useChanges();
  const [lines, setLines] = useState<Line[]>([
    { text: 'JotQoda Terminal v3.0 — type "help" for available commands', cls: 'text-[var(--accent)]' },
  ]);
  const [cwd, setCwd] = useState('');
  const [input, setInput] = useState('');
  const [hist, setHist] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('jotqoda-hist') || '[]'); } catch { return []; } });
  const [hi, setHi] = useState(-1);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView(); }, [lines]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const print = (text: string, cls?: string) => setLines((l) => [...l, ...text.split('\n').map((t) => ({ text: t, cls }))]);
  const resolve = (p: string) => normPath(p.startsWith('/') || p.startsWith('~') ? p.replace(/^~/, '') : joinPath(cwd, p));
  const isDir = (p: string) => p === '' || ide.folders.includes(p) || Object.keys(ide.files).some((f) => f.startsWith(p + '/'));
  const children = (dir: string) => {
    const set = new Map<string, boolean>();
    const pre = dir ? dir + '/' : '';
    [...ide.folders, ...Object.keys(ide.files)].forEach((p) => {
      if (!p.startsWith(pre) || p === dir) return;
      const rest = p.slice(pre.length).split('/');
      set.set(rest[0], rest.length > 1 || ide.files[p] == null);
    });
    return [...set.entries()].sort((a, b) => (a[1] === b[1] ? a[0].localeCompare(b[0]) : a[1] ? -1 : 1));
  };

  const exec = async (raw: string) => {
    const cmdline = raw.trim();
    print(`${cwd ? '~/' + cwd : '~'} $ ${cmdline}`, 'text-[var(--fg)] font-semibold');
    if (!cmdline) return;
    const nh = [...hist.filter((h) => h !== cmdline), cmdline].slice(-100);
    setHist(nh); localStorage.setItem('jotqoda-hist', JSON.stringify(nh));
    const args = (cmdline.match(/"[^"]*"|'[^']*'|\S+/g) || []).map((a) => a.replace(/^["']|["']$/g, ''));
    const [cmd, ...rest] = args;
    const err = (m: string) => print(m, 'text-red-400');
    try {
      switch (cmd) {
        case 'help': HELP.forEach(([c, d]) => print(`  ${c.padEnd(36)} ${d}`)); break;
        case 'clear': case 'cls': setLines([]); break;
        case 'pwd': print('/workspace' + (cwd ? '/' + cwd : '')); break;
        case 'cd': {
          const t = rest[0] ? resolve(rest[0]) : '';
          if (!isDir(t)) return err(`cd: no such directory: ${rest[0]}`);
          setCwd(t); break;
        }
        case 'ls': case 'dir': {
          const long = rest.some((r) => r.startsWith('-') && r.includes('l'));
          const target = resolve(rest.find((r) => !r.startsWith('-')) ?? '.');
          if (ide.files[target] != null) { print(basename(target)); break; }
          if (!isDir(target)) return err(`ls: cannot access '${target}'`);
          const items = children(target);
          if (long) items.forEach(([n, d]) => { const p = joinPath(target, n); print(`${d ? 'drwxr-xr-x' : '-rw-r--r--'}  ${String(d ? '-' : new Blob([ide.files[p] ?? '']).size).padStart(7)}  ${n}${d ? '/' : ''}`, d ? 'text-sky-400' : ''); });
          else setLines((l) => [...l, { text: items.map(([n, d]) => (d ? n + '/' : n)).join('   ') || '(empty)', cls: '' }]);
          break;
        }
        case 'tree': {
          const root = resolve(rest[0] ?? '.');
          const walk = (dir: string, pre: string) => {
            const items = children(dir);
            items.forEach(([n, d], i) => {
              const last = i === items.length - 1;
              print(pre + (last ? '└── ' : '├── ') + n + (d ? '/' : ''), d ? 'text-sky-400' : '');
              if (d) walk(joinPath(dir, n), pre + (last ? '    ' : '│   '));
            });
          };
          print(root || '.', 'text-sky-400'); walk(root, ''); break;
        }
        case 'cat': case 'type': {
          for (const f of rest) { const p = resolve(f); if (ide.files[p] == null) err(`cat: ${f}: No such file`); else print(ide.files[p]); }
          break;
        }
        case 'head': case 'tail': {
          const p = resolve(rest[0] ?? ''); const n = +(rest[1] ?? 10);
          if (ide.files[p] == null) return err(`${cmd}: ${rest[0]}: No such file`);
          const ls = ide.files[p].split('\n'); print((cmd === 'head' ? ls.slice(0, n) : ls.slice(-n)).join('\n')); break;
        }
        case 'touch': rest.forEach((f) => { const p = resolve(f); if (ide.files[p] == null) ide.createFile(p, '', false); }); break;
        case 'mkdir': rest.filter((r) => !r.startsWith('-')).forEach((f) => ide.createFolder(resolve(f))); break;
        case 'rm': case 'del': rest.filter((r) => !r.startsWith('-')).forEach((f) => { const p = resolve(f); if (ide.files[p] == null && !isDir(p)) err(`rm: ${f}: No such file`); else ide.deletePath(p, true); }); break;
        case 'mv': case 'rename': if (rest.length < 2) return err('usage: mv <src> <dst>'); { const a = resolve(rest[0]); let b = resolve(rest[1]); if (isDir(b) && !ide.files[b]) b = joinPath(b, basename(a)); ide.renamePath(a, b); } break;
        case 'cp': case 'copy': { const a = resolve(rest[0] ?? ''); let b = resolve(rest[1] ?? ''); if (ide.files[a] == null) return err('cp: source not found'); if (isDir(b)) b = joinPath(b, basename(a)); ide.createFile(b, ide.files[a], false); break; }
        case 'echo': {
          const gi = rest.findIndex((r) => r === '>' || r === '>>');
          if (gi >= 0) {
            const p = resolve(rest[gi + 1] ?? ''); const txt = rest.slice(0, gi).join(' ') + '\n';
            if (rest[gi] === '>>' && ide.files[p] != null) ide.writeFile(p, ide.files[p] + txt, true);
            else if (ide.files[p] != null) ide.writeFile(p, txt, true); else ide.createFile(p, txt, false);
          } else print(rest.join(' '));
          break;
        }
        case 'grep': {
          const [pat, f] = rest; if (!pat) return err('usage: grep <pattern> [file]');
          const re = new RegExp(pat, 'i');
          const targets = f ? [resolve(f)] : Object.keys(ide.files).filter((p) => p.startsWith(cwd));
          let n = 0;
          targets.forEach((p) => (ide.files[p] ?? '').split('\n').forEach((l, i) => { if (re.test(l)) { n++; print(`${p}:${i + 1}: ${l.trim()}`, 'text-amber-200'); } }));
          if (!n) print('(no matches)'); break;
        }
        case 'find': { const q = (rest[0] ?? '').replace(/\*/g, ''); Object.keys(ide.files).filter((p) => basename(p).includes(q)).forEach((p) => print(p)); break; }
        case 'wc': { const p = resolve(rest[0] ?? ''); const c = ide.files[p]; if (c == null) return err('wc: file not found'); print(`  ${c.split('\n').length} lines  ${(c.match(/\S+/g) || []).length} words  ${c.length} chars  ${p}`); break; }
        case 'open': case 'code': case 'vim': case 'nano': { const p = resolve(rest[0] ?? ''); if (ide.files[p] == null) ide.createFile(p, '', true); else ide.openFile(p); break; }
        case 'run': case 'node': case 'python': case 'python3': case 'py': case 'sql': case 'sqlite3': case 'ts-node': case 'deno': case 'bun': {
          if (cmd === 'node' && rest[0] === '-e') { print(String(new Function('return (' + rest.slice(1).join(' ') + ')')())); break; }
          const p = resolve(rest[0] ?? ide.activeFile ?? '');
          if (ide.files[p] == null) return err(`${cmd}: cannot find '${rest[0] ?? ''}'`);
          print(`Running ${p} — see OUTPUT tab`, 'text-emerald-400'); ide.run(p); break;
        }
        case 'js': case 'eval': { const r = new Function('return (' + rest.join(' ') + ')')(); print(typeof r === 'object' ? JSON.stringify(r, null, 2) : String(r), 'text-emerald-300'); break; }
        case 'calc': { const e = rest.join(' '); if (!/^[\d\s+\-*/%().^e,Math.a-z]+$/i.test(e)) return err('invalid expression'); print(String(Function(`with(Math){return (${e.replace(/\^/g, '**')})}`)()), 'text-emerald-300'); break; }
        case 'git': {
          const sub = rest[0];
          if (sub === 'status') {
            print('On branch main');
            if (!changes.length) print('nothing to commit, working tree clean');
            else { print('Changes not committed:'); changes.forEach((c) => print(`    ${({ M: 'modified: ', A: 'new file: ', D: 'deleted:  ' })[c.status]} ${c.path}`, c.status === 'D' ? 'text-red-400' : c.status === 'A' ? 'text-emerald-400' : 'text-amber-300')); }
          } else if (sub === 'log') {
            [...ide.commits].reverse().forEach((c) => { print(`commit ${c.id}`, 'text-amber-300'); print(`Date:   ${new Date(c.date).toString()}`); print(`\n    ${c.message}\n`); });
          } else if (sub === 'commit') {
            const mi = rest.indexOf('-m'); const msg = mi >= 0 ? rest.slice(mi + 1).join(' ') : 'Commit from terminal';
            if (!changes.length) print('nothing to commit'); else { ide.commit(msg); print(`[main] ${msg} — ${changes.length} file(s) changed`, 'text-emerald-400'); }
          } else if (sub === 'diff') {
            changes.filter((c) => c.status === 'M').forEach((c) => {
              print(`diff --git a/${c.path} b/${c.path}`, 'font-bold');
              const a = ide.head[c.path].split('\n'), b = ide.files[c.path].split('\n');
              const max = Math.max(a.length, b.length);
              for (let i = 0; i < max; i++) if (a[i] !== b[i]) { if (a[i] != null) print('- ' + a[i], 'text-red-400'); if (b[i] != null) print('+ ' + b[i], 'text-emerald-400'); }
            });
          } else if (sub === 'branch') print('* main', 'text-emerald-400');
          else print('usage: git status | log | commit -m "msg" | diff | branch');
          break;
        }
        case 'theme': {
          if (!rest[0]) { THEMES.forEach((t) => print(`  ${t.id === ide.settings.theme ? '●' : '○'} ${t.id.padEnd(18)} ${t.name}`)); break; }
          const t = THEMES.find((x) => x.id === rest[0]); if (!t) return err('unknown theme'); ide.setSetting('theme', t.id); print(`Theme set to ${t.name}`); break;
        }
        case 'langs': print(LANGUAGES.map((l) => l.name).join(', ')); print(`${LANGUAGES.length} languages`, 'text-[var(--accent)]'); break;
        case 'history': hist.forEach((h, i) => print(`  ${String(i + 1).padStart(4)}  ${h}`)); break;
        case 'date': print(new Date().toString()); break;
        case 'whoami': print('developer'); break;
        case 'uname': print('JotQodaOS 3.0 WebAssembly x86_64 ' + navigator.platform); break;
        case 'neofetch': {
          const art = ['  ╔███╗ ╔██╗╔═══╗', '  ╚███╔╝ ╚██╔╝██╗ ', '   ╚██╔╝  ╚██╔╝██║ ', '   ██╔╝   ██╔╝██║ ', '   ╚═╝    ╚═╝╚═╝ '];
          const info = [`developer@jotqoda`, '────────────────', `OS: JotQodaOS (browser)`, `Shell: jotqoda-sh 3.0`, `Theme: ${ide.settings.theme}`];
          art.forEach((a, i) => print(a + '  ' + info[i], i === 0 ? 'text-[var(--accent)]' : ''));
          print(`  Files: ${Object.keys(ide.files).length}  Commits: ${ide.commits.length}`);
          break;
        }
        case 'npm': case 'yarn': case 'pnpm': case 'pip': case 'cargo': case 'go': case 'gcc': case 'javac': case 'make':
          err(`${cmd}: not available in the browser sandbox. In-browser runtimes: node (JS/TS), python, sql.`); break;
        case 'exit': ide.setPanelOpen(false); break;
        default: err(`command not found: ${cmd}. Type "help" for a list of commands.`);
      }
    } catch (e: any) { err(String(e?.message ?? e)); }
  };

  const complete = () => {
    const parts = input.split(' ');
    const last = parts[parts.length - 1];
    const dir = last.includes('/') ? resolve(dirname(last) || '.') : cwd;
    const prefix = basename(last);
    const opts = children(dir).filter(([n]) => n.startsWith(prefix));
    if (opts.length === 1) {
      parts[parts.length - 1] = (last.includes('/') ? dirname(last) + '/' : '') + opts[0][0] + (opts[0][1] ? '/' : '');
      setInput(parts.join(' '));
    } else if (opts.length > 1) print(opts.map(([n, d]) => n + (d ? '/' : '')).join('   '), 'text-[var(--muted)]');
    else if (parts.length === 1) {
      const cmds = HELP.flatMap(([c]) => c.split(/[ |/]/)[0]).filter((c) => c.startsWith(last));
      if (cmds.length === 1) setInput(cmds[0] + ' ');
    }
  };

  return (
    <div className="h-full overflow-auto px-3 py-1 font-mono text-[12.5px] leading-[1.45] cursor-text" onClick={() => window.getSelection()?.toString() || inputRef.current?.focus()}>
      {lines.map((l, i) => <div key={i} className={`whitespace-pre-wrap break-all ${l.cls ?? 'text-[var(--fg)]/85'}`}>{l.text || '\u00a0'}</div>)}
      <div className="flex items-center">
        <span className="text-emerald-400 shrink-0">developer@jotqoda</span><span className="text-[var(--muted)] shrink-0">:</span>
        <span className="text-sky-400 shrink-0">{cwd ? '~/' + cwd : '~'}</span><span className="text-[var(--muted)] mr-2 shrink-0">$</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          className="flex-1 bg-transparent outline-none text-[var(--fg)] caret-[var(--accent)]"
          onKeyDown={(e) => {
            if (e.key === 'Enter') { exec(input); setInput(''); setHi(-1); }
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
}
