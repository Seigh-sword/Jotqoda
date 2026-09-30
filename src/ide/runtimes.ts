/**
 * Additional in-browser runtimes. Every runtime is loaded lazily from a pinned
 * jsDelivr URL and executes inside a Web Worker (or a sandboxed iframe for
 * Scittle) — code never leaves the browser. Protocol (worker → page):
 *   { type: 'log' | 'info' | 'warn' | 'error' | 'system' | 'success', text }
 *   { type: 'done', ms, failed? }
 */
import { CDN, loadGlobal } from './cdn';
import type { LogFn, LogType } from './runner';

type Done = (ok: boolean, ms: number) => void;

/** Shared helpers injected into every worker: line-buffered stdout/stderr. */
const PRELUDE = `
const __buf = { log: '', error: '' };
const __flush = (kind, force) => {
  let b = __buf[kind];
  let i;
  while ((i = b.indexOf('\\n')) >= 0) { postMessage({ type: kind, text: b.slice(0, i) }); b = b.slice(i + 1); }
  if (force && b) { postMessage({ type: kind, text: b }); b = ''; }
  __buf[kind] = b;
};
const __out = (s) => { __buf.log += String(s); __flush('log', false); };
const __err = (s) => { __buf.error += String(s); __flush('error', false); };
const __end = (t0, failed) => { __flush('log', true); __flush('error', true); postMessage({ type: 'done', ms: performance.now() - t0, failed: !!failed }); };
self.addEventListener('unhandledrejection', (e) => postMessage({ type: 'error', text: 'Uncaught (in promise) ' + (e.reason && e.reason.message || e.reason) }));
`;

const LUA_WORKER = `${PRELUDE}
importScripts('${CDN.wasmoon}/index.js');
const factory = new wasmoon.LuaFactory('${CDN.wasmoon}/glue.wasm');
let announced = false;
onmessage = async (e) => {
  const { files, entry, code } = e.data;
  const t0 = performance.now();
  let lua;
  try {
    for (const [p, c] of Object.entries(files)) if (p.endsWith('.lua')) await factory.mountFile('/ws/' + p, c);
    lua = await factory.createEngine();
    if (!announced) { announced = true; postMessage({ type: 'system', text: (await lua.doString('return _VERSION')) + ' ready (wasmoon / WebAssembly)' }); }
    lua.global.set('__jq_out', (s) => __out(s));
    lua.global.set('__jq_err', (s) => __err(s));
    const dir = entry.includes('/') ? entry.slice(0, entry.lastIndexOf('/')) : '';
    await lua.doString([
      'package.path = "/ws/' + (dir ? dir + '/' : '') + '?.lua;/ws/?.lua;/ws/?/init.lua;" .. package.path',
      'function print(...) local t = {} for i = 1, select("#", ...) do t[i] = tostring((select(i, ...))) end __jq_out(table.concat(t, "\\\\t") .. "\\\\n") end',
      'io.write = function(...) for i = 1, select("#", ...) do __jq_out(tostring((select(i, ...)))) end return io end',
      'io.stderr = { write = function(self, ...) for i = 1, select("#", ...) do __jq_err(tostring((select(i, ...)))) end return self end }',
      'io.read = function() return nil end',
    ].join('\\n'));
    await lua.doString(code);
    __end(t0);
  } catch (err) {
    __flush('log', true);
    postMessage({ type: 'error', text: String(err && err.message || err) });
    __end(t0, true);
  } finally {
    try { lua && lua.global.close(); } catch (_) {}
  }
};
`;

const RUBY_WORKER = `${PRELUDE}
importScripts('${CDN.rubyWasi}');
// Ruby single-quoted literal (no interpolation): only \\ and \' are escapes
const rq = (s) => "'" + String(s).replace(/\\\\/g, '\\\\\\\\').replace(/'/g, "\\\\'") + "'";
let modP = null;
console.log = (s) => __out(s);
console.warn = (s) => __err(s);
onmessage = async (e) => {
  const { files, entry, code } = e.data;
  const t0 = performance.now();
  try {
    if (!modP) {
      postMessage({ type: 'system', text: 'Loading CRuby (ruby.wasm, ~30 MB on first run, cached by the browser)…' });
      modP = WebAssembly.compileStreaming(fetch('${CDN.rubyWasm}'));
    }
    const mod = await modP;
    const { vm } = await self['ruby-wasm-wasi'].DefaultRubyVM(mod, { consolePrint: true });
    vm.eval('$stdout.sync = true; $stderr.sync = true');
    const dir = entry.includes('/') ? entry.slice(0, entry.lastIndexOf('/')) : '';
    const rb = Object.entries(files).filter(([p]) => /\\.rb$/.test(p));
    if (rb.length) {
      vm.eval('require "fileutils" rescue nil');
      for (const [p, c] of rb) {
        try { vm.eval('FileUtils.mkdir_p(File.dirname(' + rq('/ws/' + p) + ')); File.write(' + rq('/ws/' + p) + ', ' + rq(c) + ')'); } catch (_) {}
      }
      try { vm.eval('Dir.chdir(' + rq('/ws/' + dir) + '); $LOAD_PATH.unshift(Dir.pwd)'); } catch (_) {}
    }
    vm.eval('eval(' + rq(code) + ', TOPLEVEL_BINDING, ' + rq('/ws/' + entry) + ')');
    __end(t0);
  } catch (err) {
    __flush('log', true);
    postMessage({ type: 'error', text: String(err && err.message || err) });
    __end(t0, true);
  }
};
`;

const PHP_WORKER = `${PRELUDE}
// php-wasm's web build expects a browser main thread; provide the few globals it touches.
self.window = self;
self.screen = self.screen || {};
self.document = { currentScript: null, querySelector: () => null, getElementById: () => null, body: null, documentElement: { style: {} }, addEventListener() {}, removeEventListener() {} };
let phpP = null;
const getPhp = async () => {
  const { PhpWeb } = await import('${CDN.php}/PhpWeb.mjs');
  const php = new PhpWeb({ autoTransaction: false });
  php.addEventListener('output', (e) => __out([].concat(e.detail).join('')));
  php.addEventListener('error', (e) => __err([].concat(e.detail).join('')));
  await php.binary;
  return php;
};
onmessage = async (e) => {
  const { code } = e.data;
  const t0 = performance.now();
  try {
    if (!phpP) { postMessage({ type: 'system', text: 'Loading PHP (php-wasm, ~15 MB on first run)…' }); phpP = getPhp(); }
    const php = await phpP;
    const src = /^\\s*<\\?php|<\\?=/.test(code) ? code : '<?php\\n' + code;
    const exit = await php.run(src);
    __end(t0, typeof exit === 'number' && exit !== 0);
  } catch (err) {
    __flush('log', true);
    postMessage({ type: 'error', text: String(err && err.message || err) });
    __end(t0, true);
  }
};
`;

const SCHEME_WORKER = `${PRELUDE}
self.window = self;
self.document = { querySelector: () => null, querySelectorAll: () => [], getElementById: () => null, createElement: () => ({ style: {}, appendChild() {}, addEventListener() {} }), addEventListener() {}, body: null };
let B = null;
onmessage = async (e) => {
  const { code } = e.data;
  const t0 = performance.now();
  try {
    if (!B) {
      B = (await import('${CDN.biwascheme}')).default;
      postMessage({ type: 'system', text: 'BiwaScheme ' + (B.Version || '') + ' ready' });
    }
    B.Port.current_output = new B.Port.CustomOutput((s) => __out(s));
    B.Port.current_error = new B.Port.CustomOutput((s) => __err(s));
    let failed = false;
    const intp = new B.Interpreter((err) => { failed = true; __flush('log', true); postMessage({ type: 'error', text: String(err && err.message || err) }); __end(t0, true); });
    intp.evaluate(code, (result) => {
      if (failed) return;
      if (result !== undefined && result !== B.undef && result !== null) {
        const shown = B.to_write ? B.to_write(result) : String(result);
        if (shown && shown !== '#<undef>') { __flush('log', true); postMessage({ type: 'info', text: '=> ' + shown }); }
      }
      __end(t0);
    });
  } catch (err) {
    __flush('log', true);
    postMessage({ type: 'error', text: String(err && err.message || err) });
    __end(t0, true);
  }
};
`;

const PROLOG_WORKER = `${PRELUDE}
self.window = self;
self.document = { getElementById: () => null, querySelector: () => null };
importScripts('${CDN.tauProlog}/core.js', '${CDN.tauProlog}/lists.js', '${CDN.tauProlog}/charsio.js', '${CDN.tauProlog}/format.js', '${CDN.tauProlog}/random.js', '${CDN.tauProlog}/statistics.js');
console.log = (s) => __out(s);
console.error = (s) => __err(s);
const promisify = (fn) => new Promise((resolve) => fn(resolve));
onmessage = async (e) => {
  const { code } = e.data;
  const t0 = performance.now();
  try {
    const queries = [];
    const program = code.replace(/^\\s*\\?-\\s*([\\s\\S]*?)\\.\\s*$/gm, (_, q) => { queries.push(q.trim() + '.'); return ''; });
    const session = pl.create(200000);
    const ok = await promisify((res) => session.consult(program, { script: false, html: false, success: () => res(true), error: (err) => { __flush('log', true); postMessage({ type: 'error', text: session.format_answer(err) }); res(false); } }));
    if (!ok) return __end(t0, true);
    const hasInit = /:-\\s*initialization\\(/.test(program);
    if (!queries.length && !hasInit && /^main\\s*(:-|\\.)/m.test(program)) queries.push('main.');
    for (const q of queries) {
      __flush('log', true);
      postMessage({ type: 'system', text: '?- ' + q });
      const started = await promisify((res) => session.query(q, { success: () => res(true), error: (err) => { postMessage({ type: 'error', text: session.format_answer(err) }); res(false); } }));
      if (!started) continue;
      let n = 0;
      for (;;) {
        const a = await promisify((res) => session.answer({ success: (ans) => res({ ans }), fail: () => res({ fail: true }), error: (err) => res({ err }), limit: () => res({ limit: true }) }));
        __flush('log', true);
        if (a.fail) { if (!n) postMessage({ type: 'warn', text: 'false.' }); break; }
        if (a.err) { postMessage({ type: 'error', text: session.format_answer(a.err) }); break; }
        if (a.limit) { postMessage({ type: 'warn', text: 'Inference limit reached' }); break; }
        n++;
        postMessage({ type: 'info', text: session.format_answer(a.ans) });
        if (n >= 20) { postMessage({ type: 'system', text: '… (first 20 answers shown)' }); break; }
      }
    }
    __end(t0);
  } catch (err) {
    __flush('log', true);
    postMessage({ type: 'error', text: String(err && err.message || err) });
    __end(t0, true);
  }
};
`;

const BF_WORKER = `${PRELUDE}
onmessage = (e) => {
  const t0 = performance.now();
  const raw = e.data.code;
  const bang = raw.indexOf('!');
  const src = (bang >= 0 ? raw.slice(0, bang) : raw).replace(/[^+\\-<>.,\\[\\]]/g, '');
  const input = bang >= 0 ? raw.slice(bang + 1).replace(/^\\n/, '') : '';
  const jump = new Int32Array(src.length);
  const stack = [];
  for (let i = 0; i < src.length; i++) {
    if (src[i] === '[') stack.push(i);
    else if (src[i] === ']') { if (!stack.length) { postMessage({ type: 'error', text: 'Unmatched ] at instruction ' + i }); return __end(t0, true); } const j = stack.pop(); jump[i] = j; jump[j] = i; }
  }
  if (stack.length) { postMessage({ type: 'error', text: 'Unmatched [ at instruction ' + stack.pop() }); return __end(t0, true); }
  const mem = new Uint8Array(30000);
  let ptr = 0, ip = 0, inp = 0, steps = 0, out = '';
  try {
    while (ip < src.length) {
      switch (src.charCodeAt(ip)) {
        case 43: mem[ptr]++; break;
        case 45: mem[ptr]--; break;
        case 62: if (++ptr >= mem.length) throw new Error('Pointer moved past cell 29999'); break;
        case 60: if (--ptr < 0) throw new Error('Pointer moved before cell 0'); break;
        case 46: out += String.fromCharCode(mem[ptr]); if (out.length > 256 || mem[ptr] === 10) { __out(out); out = ''; } break;
        case 44: mem[ptr] = inp < input.length ? input.charCodeAt(inp++) : 0; break;
        case 91: if (!mem[ptr]) ip = jump[ip]; break;
        case 93: if (mem[ptr]) ip = jump[ip]; break;
      }
      ip++;
      if (++steps % 5000000 === 0 && out) { __out(out); out = ''; }
    }
    __out(out);
    postMessage({ type: 'system', text: steps.toLocaleString() + ' instructions executed' });
    __end(t0);
  } catch (err) {
    __out(out);
    postMessage({ type: 'error', text: String(err.message || err) });
    __end(t0, true);
  }
};
`;

const WAT_WORKER = `${PRELUDE}
importScripts('${CDN.wabt}');
let wabtP = null;
const fmt = (v) => typeof v === 'bigint' ? v.toString() + 'n' : String(v);
onmessage = async (e) => {
  const { code, entry } = e.data;
  const t0 = performance.now();
  try {
    const wabt = await (wabtP ??= WabtModule());
    const mod = wabt.parseWat(entry, code, { mutable_globals: true, sat_float_to_int: true, sign_extension: true, bulk_memory: true, multi_value: true, simd: true, reference_types: true });
    mod.resolveNames();
    mod.validate();
    const { buffer } = mod.toBinary({ log: false });
    mod.destroy();
    postMessage({ type: 'system', text: 'Compiled ' + entry + ' → ' + buffer.byteLength + ' bytes of WebAssembly' });
    const module = await WebAssembly.compile(buffer);
    let memory = null;
    const readStr = (ptr, len) => { const m = memory || (inst && inst.exports.memory); if (!m) return '[no memory]'; const bytes = new Uint8Array(m.buffer, ptr, len === undefined ? undefined : len); let end = len === undefined ? bytes.indexOf(0) : len; if (end < 0) end = bytes.length; return new TextDecoder().decode(bytes.subarray(0, end)); };
    const imports = {};
    for (const imp of WebAssembly.Module.imports(module)) {
      imports[imp.module] ??= {};
      if (imp.kind === 'function') {
        imports[imp.module][imp.name] = (...args) => {
          if (/str|string|puts|text/i.test(imp.name)) __out(readStr(args[0], args[1]) + (/ln|puts/i.test(imp.name) ? '\\n' : ''));
          else __out(args.map(fmt).join(' ') + '\\n');
          return 0;
        };
      } else if (imp.kind === 'memory') imports[imp.module][imp.name] = memory = new WebAssembly.Memory({ initial: 1, maximum: 65536 });
      else if (imp.kind === 'table') imports[imp.module][imp.name] = new WebAssembly.Table({ initial: 16, element: 'anyfunc' });
      else if (imp.kind === 'global') imports[imp.module][imp.name] = new WebAssembly.Global({ value: 'i32', mutable: false }, 0);
    }
    var inst = await WebAssembly.instantiate(module, imports);
    const ex = inst.exports;
    const names = Object.keys(ex);
    postMessage({ type: 'system', text: 'Exports: ' + (names.map((n) => n + (typeof ex[n] === 'function' ? '()' : '')).join(', ') || '(none)') });
    const main = ['main', '_start', 'run', 'start'].find((n) => typeof ex[n] === 'function');
    if (main) {
      const r = ex[main]();
      __flush('log', true);
      if (r !== undefined) postMessage({ type: 'info', text: main + '() → ' + fmt(r) });
    } else {
      for (const n of names) if (typeof ex[n] === 'function' && ex[n].length === 0) { const r = ex[n](); __flush('log', true); postMessage({ type: 'info', text: n + '() → ' + fmt(r) }); }
    }
    __end(t0);
  } catch (err) {
    __flush('log', true);
    postMessage({ type: 'error', text: String(err && err.message || err) });
    __end(t0, true);
  }
};
`;

const blobUrl = (src: string) => URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));

const pool = new Map<string, Worker>();
let busy: { kind: string; w: Worker } | null = null;
let scittleFrame: HTMLIFrameElement | null = null;

export function stopRuntimes() {
  if (busy) { busy.w.terminate(); pool.delete(busy.kind); busy = null; }
  if (scittleFrame) { scittleFrame.remove(); scittleFrame = null; }
}

function workerFor(kind: string, src: string, module = false) {
  let w = pool.get(kind);
  if (!w) {
    w = new Worker(blobUrl(src), module ? { type: 'module' } : undefined);
    pool.set(kind, w);
  }
  return w;
}

function runInWorker(kind: string, src: string, payload: any, log: LogFn, done: Done, module = false) {
  if (busy) stopRuntimes();
  const w = workerFor(kind, src, module);
  busy = { kind, w };
  w.onmessage = (e) => {
    const d = e.data;
    if (d.type === 'done') { busy = null; done(!d.failed, d.ms ?? 0); }
    else log(d.type as LogType, d.text);
  };
  w.onerror = (e) => {
    log('error', (e.message || 'Worker error') + (e.message ? '' : ' — the runtime could not be downloaded (offline?)'));
    busy = null;
    pool.delete(kind);
    w.terminate();
    done(false, 0);
  };
  w.postMessage(payload);
}

function runScittle(code: string, log: LogFn, done: Done) {
  stopRuntimes();
  const t0 = performance.now();
  const frame = document.createElement('iframe');
  frame.setAttribute('sandbox', 'allow-scripts');
  frame.style.display = 'none';
  const html = `<!doctype html><html><head><script>
    const post = (type, text) => parent.postMessage({ __jqrun: 'scittle', type, text: String(text) }, '*');
    const fmt = (a) => a.map((x) => typeof x === 'string' ? x : (() => { try { return JSON.stringify(x); } catch { return String(x); } })()).join(' ');
    console.log = (...a) => post('log', fmt(a)); console.info = (...a) => post('info', fmt(a)); console.warn = (...a) => post('warn', fmt(a)); console.error = (...a) => post('error', fmt(a));
    window.onerror = (m) => { post('error', m); post('done-failed', ''); };
  <\/script><script src="${CDN.scittle}"><\/script></head><body><script>
    window.addEventListener('message', (e) => {
      if (!e.data || e.data.__jqeval == null) return;
      try {
        const r = scittle.core.eval_string(e.data.__jqeval);
        if (r !== undefined && r !== null) post('info', '=> ' + (typeof r === 'object' && r.toString ? r.toString() : String(r)));
        post('done', '');
      } catch (err) { post('error', (err && err.message) || err); post('done-failed', ''); }
    });
    post('ready', '');
  <\/script></body></html>`;
  const onMsg = (e: MessageEvent) => {
    if (e.source !== frame.contentWindow || e.data?.__jqrun !== 'scittle') return;
    const { type, text } = e.data;
    if (type === 'ready') { log('system', 'Scittle (SCI ClojureScript interpreter) ready'); frame.contentWindow?.postMessage({ __jqeval: code }, '*'); }
    else if (type === 'done' || type === 'done-failed') { window.removeEventListener('message', onMsg); done(type === 'done', performance.now() - t0); }
    else log(type as LogType, text);
  };
  window.addEventListener('message', onMsg);
  frame.srcdoc = html;
  document.body.appendChild(frame);
  scittleFrame = frame;
}

/** Run a file with one of the additional runtimes. */
export async function runExtra(kind: string, path: string, files: Record<string, string>, log: LogFn, done: Done, runJs: (modules: Record<string, string>, entry: string) => void) {
  const code = files[path];
  switch (kind) {
    case 'lua': return runInWorker('lua', LUA_WORKER, { files, entry: path, code }, log, done);
    case 'ruby': return runInWorker('ruby', RUBY_WORKER, { files, entry: path, code }, log, done);
    case 'php': return runInWorker('php', PHP_WORKER, { code }, log, done, true);
    case 'scheme': return runInWorker('scheme', SCHEME_WORKER, { code }, log, done, true);
    case 'prolog': return runInWorker('prolog', PROLOG_WORKER, { code }, log, done);
    case 'brainfuck': return runInWorker('brainfuck', BF_WORKER, { code }, log, done);
    case 'wat': return runInWorker('wat', WAT_WORKER, { code, entry: path }, log, done);
    case 'clojure': return runScittle(code, log, done);
    case 'coffee': {
      const CS = await loadGlobal<any>(CDN.coffeescript, 'CoffeeScript');
      const modules: Record<string, string> = {};
      for (const [p, c] of Object.entries(files)) {
        if (p.endsWith('.coffee')) {
          try { modules[p] = CS.compile(c, { bare: true, filename: p }); }
          catch (e: any) { if (p === path) throw new Error(`CoffeeScript: ${e.message}${e.location ? ` (line ${e.location.first_line + 1})` : ''}`); }
        } else if (/\.(m?js|cjs|json)$/.test(p)) modules[p] = c;
      }
      log('system', `Compiled with CoffeeScript ${CS.VERSION}`);
      return runJs(modules, path);
    }
    default:
      log('warn', `No runtime for ${kind}`);
      done(false, 0);
  }
}
