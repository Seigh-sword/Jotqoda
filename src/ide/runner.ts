import { runExtra, stopRuntimes } from './runtimes';

export type LogType = 'log' | 'info' | 'warn' | 'error' | 'success' | 'system' | 'table';
export type LogFn = (type: LogType, text: string) => void;

const JS_WORKER = `
const fmt = (v, d = 0) => {
  if (typeof v === 'string') return d ? JSON.stringify(v) : v;
  if (v === undefined) return 'undefined';
  if (typeof v === 'function') return '[Function ' + (v.name || 'anonymous') + ']';
  if (typeof v === 'symbol' || typeof v === 'bigint') return v.toString() + (typeof v === 'bigint' ? 'n' : '');
  if (v instanceof Error) return v.stack || v.message;
  if (v instanceof Map) return 'Map(' + v.size + ') ' + fmt(Object.fromEntries(v), 1);
  if (v instanceof Set) return 'Set(' + v.size + ') ' + fmt([...v], 1);
  try {
    const seen = new WeakSet();
    return JSON.stringify(v, (k, x) => {
      if (typeof x === 'object' && x !== null) { if (seen.has(x)) return '[Circular]'; seen.add(x); }
      if (typeof x === 'function') return '[Function]';
      if (typeof x === 'bigint') return x.toString() + 'n';
      if (x === undefined) return '__undef__';
      return x;
    }, 2).replace(/"__undef__"/g, 'undefined');
  } catch (e) { return String(v); }
};
const send = (type, args) => postMessage({ type, text: args.map((a) => fmt(a)).join(' ') });
const timers = {}; const counts = {};
console.log = (...a) => send('log', a);
console.info = (...a) => send('info', a);
console.debug = (...a) => send('log', a);
console.warn = (...a) => send('warn', a);
console.error = (...a) => send('error', a);
console.clear = () => postMessage({ type: 'clear' });
console.time = (l = 'default') => { timers[l] = performance.now(); };
console.timeEnd = (l = 'default') => send('info', [l + ': ' + (performance.now() - (timers[l] || 0)).toFixed(3) + 'ms']);
console.count = (l = 'default') => { counts[l] = (counts[l] || 0) + 1; send('log', [l + ': ' + counts[l]]); };
console.assert = (c, ...a) => { if (!c) send('error', ['Assertion failed:', ...a]); };
console.table = (data) => {
  try {
    const rows = Array.isArray(data) ? data : Object.values(data);
    const keys = Array.isArray(data) ? Object.keys(data) : Object.keys(data);
    const cols = [...new Set(rows.flatMap((r) => (typeof r === 'object' && r ? Object.keys(r) : ['Value'])))];
    const head = ['(index)', ...cols];
    const body = rows.map((r, i) => [keys[i], ...cols.map((c) => (typeof r === 'object' && r ? fmt(r[c], 1) : c === 'Value' ? fmt(r, 1) : ''))]);
    postMessage({ type: 'table', text: JSON.stringify({ head, body }) });
  } catch (e) { send('log', [data]); }
};
self.addEventListener('unhandledrejection', (e) => send('error', ['Uncaught (in promise)', e.reason]));
self.addEventListener('error', (e) => send('error', ['Uncaught', e.message]));
const dirname = (p) => { const i = p.lastIndexOf('/'); return i < 0 ? '' : p.slice(0, i); };
const norm = (p) => { const out = []; for (const s of p.split('/')) { if (!s || s === '.') continue; if (s === '..') out.pop(); else out.push(s); } return out.join('/'); };
onmessage = async (e) => {
  const { modules, entry } = e.data;
  const cache = {};
  const resolve = (from, req) => {
    const base = norm((req.startsWith('/') ? '' : dirname(from) + '/') + req);
    for (const c of [base, base + '.ts', base + '.tsx', base + '.js', base + '.jsx', base + '.mjs', base + '.cjs', base + '.json', base + '.coffee', base + '/index.ts', base + '/index.js'])
      if (c in modules) return c;
    return null;
  };
  const makeRequire = (from) => (req) => {
    const p = resolve(from, req);
    if (p == null) throw new Error("Cannot find module '" + req + "' (only workspace files are available)");
    return load(p);
  };
  const load = (path) => {
    if (cache[path]) return cache[path].exports;
    const module = { exports: {} }; cache[path] = module;
    if (path.endsWith('.json')) { module.exports = JSON.parse(modules[path]); return module.exports; }
    new Function('require', 'module', 'exports', '__filename', '__dirname', modules[path] + '\\n//# sourceURL=' + path)(makeRequire(path), module, module.exports, path, dirname(path));
    return module.exports;
  };
  const t0 = performance.now();
  try {
    const AsyncFn = Object.getPrototypeOf(async function () {}).constructor;
    const module = { exports: {} }; cache[entry] = module;
    await new AsyncFn('require', 'module', 'exports', '__filename', '__dirname', modules[entry] + '\\n//# sourceURL=' + entry)(makeRequire(entry), module, module.exports, entry, dirname(entry));
    postMessage({ type: 'done', ms: performance.now() - t0 });
  } catch (err) {
    postMessage({ type: 'error', text: (err && err.stack) ? err.stack.split('\\n').filter((l) => !l.includes('blob:')).join('\\n') : String(err) });
    postMessage({ type: 'done', failed: true, ms: performance.now() - t0 });
  }
};
`;

const PY_WORKER = `
importScripts('https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js');
let py;
const ready = loadPyodide().then((p) => {
  py = p;
  p.setStdout({ batched: (s) => postMessage({ type: 'log', text: s }) });
  p.setStderr({ batched: (s) => postMessage({ type: 'error', text: s }) });
  postMessage({ type: 'system', text: 'Python ' + p.runPython('import sys; sys.version.split()[0]') + ' ready (Pyodide ' + p.version + ')' });
}).catch((e) => postMessage({ type: 'error', text: 'Failed to load Python runtime: ' + e }));
onmessage = async (e) => {
  await ready;
  const { files, code, entry } = e.data;
  const t0 = performance.now();
  try {
    const root = '/home/pyodide/ws';
    for (const [p, c] of Object.entries(files)) {
      const full = root + '/' + p;
      py.FS.mkdirTree(full.slice(0, full.lastIndexOf('/')));
      py.FS.writeFile(full, c);
    }
    const dir = root + '/' + (entry.includes('/') ? entry.slice(0, entry.lastIndexOf('/')) : '');
    py.runPython("import os, sys, importlib\\nos.chdir(" + JSON.stringify(dir) + ")\\nif " + JSON.stringify(dir) + " not in sys.path: sys.path.insert(0, " + JSON.stringify(dir) + ")\\nfor _m in [k for k,v in list(sys.modules.items()) if getattr(v,'__file__',None) and str(v.__file__).startswith('/home/pyodide/ws')]: del sys.modules[_m]\\nimportlib.invalidate_caches()");
    await py.loadPackagesFromImports(code, { messageCallback: (m) => postMessage({ type: 'system', text: m }) });
    await py.runPythonAsync(code, { filename: entry });
    postMessage({ type: 'done', ms: performance.now() - t0 });
  } catch (err) {
    postMessage({ type: 'error', text: String(err.message || err) });
    postMessage({ type: 'done', failed: true, ms: performance.now() - t0 });
  }
};
`;

const SQL_WORKER = `
importScripts('https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.js');
const ready = initSqlJs({ locateFile: (f) => 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/' + f });
onmessage = async (e) => {
  const t0 = performance.now();
  try {
    const SQL = await ready;
    const db = new SQL.Database();
    const res = db.exec(e.data.code);
    if (!res.length) postMessage({ type: 'success', text: 'Query OK — no rows returned. ' + db.getRowsModified() + ' row(s) modified.' });
    for (const r of res) postMessage({ type: 'table', text: JSON.stringify({ head: r.columns, body: r.values.map((row) => row.map((v) => v === null ? 'NULL' : String(v))) }) });
    db.close();
    postMessage({ type: 'done', ms: performance.now() - t0 });
  } catch (err) {
    postMessage({ type: 'error', text: 'SQL Error: ' + (err.message || err) });
    postMessage({ type: 'done', failed: true, ms: performance.now() - t0 });
  }
};
`;

const blobUrl = (src: string) => URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));

let current: Worker | null = null;
let pyWorker: Worker | null = null;

export function stopAll() {
  stopRuntimes();
  if (current) { current.terminate(); current = null; }
  if (pyWorker && (pyWorker as any).__busy) { pyWorker.terminate(); pyWorker = null; }
}

function attach(w: Worker, log: LogFn, onDone: (ok: boolean, ms: number) => void, onClear: () => void) {
  w.onmessage = (e) => {
    const d = e.data;
    if (d.type === 'done') { (w as any).__busy = false; onDone(!d.failed, d.ms ?? 0); }
    else if (d.type === 'clear') onClear();
    else log(d.type, d.text);
  };
  w.onerror = (e) => { log('error', e.message || 'Worker error'); (w as any).__busy = false; onDone(false, 0); };
}

export function esmToCjs(code: string): string {
  const exported: string[] = [];
  let out = code
    .replace(/^\s*import\s+([\w$]+)\s*,\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"];?/gm, (_, d, n, m) => `const ${d} = (require('${m}').default ?? require('${m}')); const {${n.replace(/\s+as\s+/g, ': ')}} = require('${m}');`)
    .replace(/^\s*import\s+\*\s+as\s+([\w$]+)\s+from\s*['"]([^'"]+)['"];?/gm, (_, n, m) => `const ${n} = require('${m}');`)
    .replace(/^\s*import\s+\{([^}]*)\}\s*from\s*['"]([^'"]+)['"];?/gm, (_, n, m) => `const {${n.replace(/\s+as\s+/g, ': ')}} = require('${m}');`)
    .replace(/^\s*import\s+([\w$]+)\s+from\s*['"]([^'"]+)['"];?/gm, (_, n, m) => `const ${n} = (require('${m}').default ?? require('${m}'));`)
    .replace(/^\s*import\s*['"]([^'"]+)['"];?/gm, (_, m) => `require('${m}');`)
    .replace(/^\s*export\s+default\s+/gm, 'module.exports.default = ')
    .replace(/^\s*export\s+\{([^}]*)\};?/gm, (_, n: string) => n.split(',').map((s) => s.trim()).filter(Boolean).map((s) => { const [a, b] = s.split(/\s+as\s+/); return `exports.${b ?? a} = ${a};`; }).join(' '))
    .replace(/^(\s*)export\s+(async\s+function\*?|function\*?|class|const|let|var)\s+([\w$]+)/gm, (_, sp, kw, name) => { exported.push(name); return `${sp}${kw} ${name}`; });
  if (exported.length) out += '\n' + exported.map((n) => `exports.${n} = ${n};`).join('\n');
  return out;
}

export function runJavaScript(modules: Record<string, string>, entry: string, log: LogFn, onDone: (ok: boolean, ms: number) => void, onClear: () => void) {
  stopAll();
  const w = new Worker(blobUrl(JS_WORKER));
  current = w;
  attach(w, log, onDone, onClear);
  w.postMessage({ modules, entry });
}

export function runPython(files: Record<string, string>, entry: string, log: LogFn, onDone: (ok: boolean, ms: number) => void) {
  if (pyWorker && (pyWorker as any).__busy) { pyWorker.terminate(); pyWorker = null; }
  if (!pyWorker) {
    log('system', 'Loading Python runtime (first run downloads ~10MB, cached afterwards)…');
    pyWorker = new Worker(blobUrl(PY_WORKER));
  }
  (pyWorker as any).__busy = true;
  attach(pyWorker, log, onDone, () => {});
  pyWorker.postMessage({ files, code: files[entry], entry });
}

export function runSQL(code: string, log: LogFn, onDone: (ok: boolean, ms: number) => void) {
  stopAll();
  const w = new Worker(blobUrl(SQL_WORKER));
  current = w;
  attach(w, log, onDone, () => {});
  w.postMessage({ code });
}

export async function compileTS(monaco: any, path: string, content: string): Promise<string> {
  const uri = monaco.Uri.parse('file:///' + path);
  let model = monaco.editor.getModel(uri);
  if (!model) model = monaco.editor.createModel(content, 'typescript', uri);
  const ts = monaco.languages.typescript ?? monaco.typescript;
  const getWorker = await ts.getTypeScriptWorker();
  const worker = await getWorker(uri);
  const out = await worker.getEmitOutput(uri.toString());
  const js = out.outputFiles.find((f: any) => f.name.endsWith('.js'));
  return js ? js.text : content;
}

/** Run a file with one of the additional runtimes (Lua, Ruby, PHP, Scheme, Prolog, CoffeeScript, Brainfuck, Clojure, WAT). */
export async function runLanguage(kind: string, path: string, files: Record<string, string>, log: LogFn, onDone: (ok: boolean, ms: number) => void, onClear: () => void) {
  if (current) { current.terminate(); current = null; }
  return runExtra(kind, path, files, log, onDone, (modules, entry) => runJavaScript(modules, entry, log, onDone, onClear));
}
