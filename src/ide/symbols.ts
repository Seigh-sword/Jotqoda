/**
 * Lightweight, regex based symbol extraction for every language JotQoda knows.
 * Feeds the Outline view, breadcrumbs, "Go to Symbol" (@ / #), the document
 * symbol provider (Ctrl+Shift+O, sticky scroll) and Go to Definition for
 * languages that have no Monaco language service.
 */
import type { LangDef } from './languages';

export type SymKind =
  | 'file' | 'module' | 'namespace' | 'package' | 'class' | 'method' | 'property' | 'field' | 'constructor' | 'enum' | 'interface'
  | 'function' | 'variable' | 'constant' | 'string' | 'key' | 'struct' | 'event' | 'type' | 'heading' | 'selector' | 'target';

export interface Sym {
  name: string;
  kind: SymKind;
  /** 1-based line */
  line: number;
  /** 1-based column of the name */
  col: number;
  endLine: number;
  detail?: string;
  children: Sym[];
}

/** Monaco SymbolKind numbers */
export const MONACO_SYMBOL_KIND: Record<SymKind, number> = {
  file: 0, module: 1, namespace: 2, package: 3, class: 4, method: 5, property: 6, field: 7, constructor: 8, enum: 9, interface: 10,
  function: 11, variable: 12, constant: 13, string: 14, key: 19, struct: 22, event: 23, type: 25, heading: 14, selector: 4, target: 11,
};

interface Flat { name: string; kind: SymKind; line: number; col: number; level?: number; detail?: string }

const KW_KIND: Record<string, SymKind> = {
  fn: 'function', func: 'function', function: 'function', def: 'function', defp: 'function', defn: 'function', defun: 'function', fun: 'function',
  proc: 'function', procedure: 'function', sub: 'function', subroutine: 'function', method: 'method', macro: 'function', defmacro: 'function',
  iterator: 'function', converter: 'function', template: 'function', task: 'function', program: 'module', entry: 'function', action: 'function',
  rule: 'function', token: 'function', regex: 'function', submethod: 'method', operator: 'function', modifier: 'function', filter: 'function',
  class: 'class', struct: 'struct', record: 'struct', data: 'struct', union: 'struct', object: 'class', actor: 'class', contract: 'class',
  interface: 'interface', protocol: 'interface', trait: 'interface', typeclass: 'interface', signature: 'interface', sig: 'interface', role: 'interface', concept: 'interface',
  enum: 'enum', module: 'module', mod: 'module', defmodule: 'module', namespace: 'namespace', package: 'package', unit: 'module', library: 'module', grammar: 'module',
  impl: 'class', extension: 'class', instance: 'class', implementation: 'class', mixin: 'class', extend: 'class',
  type: 'type', typedef: 'type', newtype: 'type', typealias: 'type', alias: 'type', event: 'event', signal: 'event',
  message: 'struct', service: 'class', entity: 'class', architecture: 'class', model: 'class', component: 'class', resource: 'class', view: 'class',
  schema: 'module', table: 'struct', scalar: 'type', input: 'struct', fragment: 'function', query: 'function', mutation: 'function', subscription: 'function',
  rpc: 'method', exception: 'class', const: 'constant', let: 'variable', val: 'variable', var: 'variable', static: 'variable', global: 'variable', constant: 'constant',
  test: 'function', describe: 'module', it: 'function', validator: 'function', script: 'module', predicate: 'function', storage: 'struct',
};

const MODS = '(?:(?:pub(?:\\([^)]*\\))?|export|public|private|protected|internal|static|final|abstract|sealed|open|override|virtual|async|inline|extern|unsafe|default|partial|case|inner|lazy|suspend|tailrec|infix|external|mutating|fileprivate|declare|readonly|local|global|my|our|multi|proto|only|priv|noinline|comptime|threadlocal|synchronized|native|transient|strictfp|pure|impure|elemental|recursive|safe|nonmutating|dynamic|required|convenience|indirect|nonisolated|isolated|distributed|expect|actual|annotation|enum|value|data|companion|sealed|shared|entry|friend|payable|view|constexpr|consteval|explicit|volatile)\\s+)*';

/** Default declaration keywords used by the generic extractor */
const DEFAULT_KWS = 'fn func function def defp proc procedure sub subroutine method fun macro defmacro iterator converter template task program class struct record union object actor contract interface protocol trait typeclass enum module mod defmodule namespace package unit library impl extension instance implementation mixin type typedef newtype typealias event signal message service entity architecture component resource exception rpc schema scalar input fragment role grammar rule token submethod modifier';

const LANG_KWS: Record<string, string> = {
  python: 'def class', cython: 'def cdef cpdef class struct', mojo: 'def fn struct trait', starlark: 'def', gdscript: 'func class class_name signal enum const', vyper: 'def struct event interface enum flag',
  ruby: 'def class module', crystal: 'def class module struct lib enum macro annotation', rbs: 'def class module interface type',
  elixir: 'defmodule def defp defmacro defmacrop defstruct defprotocol defimpl defguard defdelegate', erlang: '', lfe: '',
  lua: 'function', luau: 'function type export', teal: 'function record enum type', moonscript: 'class',
  php: 'function class interface trait enum namespace', hack: 'function class interface trait enum namespace type newtype',
  perl: 'sub package', raku: 'sub method submethod class role grammar module token rule regex multi proto',
  go: 'func type', rust: 'fn struct enum trait impl mod type const static union macro_rules!', zig: 'fn test', odin: '', v: 'fn struct enum interface type const module', vlang: 'fn struct enum interface type const module',
  swift: 'func class struct enum protocol extension actor init typealias', kotlin: 'fun class interface object enum typealias', scala: 'def class object trait enum type given extension',
  groovy: 'def class interface trait enum', dart: 'class mixin extension enum typedef', julia: 'function struct module macro abstract mutable', nim: 'proc func method iterator template macro converter type',
  haskell: 'data newtype class instance type module', purescript: 'data newtype class instance type module foreign', elm: 'type module port', idris: 'data record interface implementation module namespace', agda: 'data record module postulate',
  lean: 'def theorem lemma structure class instance inductive namespace section abbrev axiom example', ocaml: 'let type module class exception val external', reason: 'let type module', rescript: 'let type module', sml: 'fun val structure signature functor datatype type exception',
  fsharp: 'let type module member namespace exception', clojure: '', racket: '', scheme: '', commonlisp: '', elisp: '', fennel: '', janet: '', hy: '',
  solidity: 'contract library interface function event modifier struct enum error', move: 'module fun struct', cairo: 'fn struct trait impl mod enum', sway: 'fn struct enum trait impl abi library contract script predicate storage',
  fortran: 'program module submodule subroutine function type interface', 'fortran-fixed': 'program module subroutine function', ada: 'procedure function package task protected type', pascal: 'procedure function program unit constructor destructor',
  vb: 'sub function class module property structure enum interface namespace event', powershell: 'function class filter workflow configuration enum', fish: 'function', shell: 'function', zsh: 'function', ksh: 'function', bat: '',
  tcl: 'proc namespace', r: '', matlab: 'function classdef', scilab: 'function', octave: 'function', wolfram: '',
  sql: '', graphql: 'type interface enum input union scalar schema query mutation subscription fragment directive extend', protobuf: 'message enum service rpc oneof extend', thrift: 'struct union exception enum service typedef const',
  capnp: 'struct union enum interface const annotation', flatbuffers: 'table struct enum union rpc_service', avro: 'protocol record error enum fixed', smithy: 'service resource operation structure union list map enum intEnum string', wit: 'package world interface record variant enum flags resource type func', webidl: 'interface dictionary enum typedef callback namespace mixin', prisma: 'model enum type view datasource generator',
  verilog: 'module function task class interface package program primitive', systemverilog: 'module function task class interface package program primitive covergroup property sequence', vhdl: 'entity architecture package function procedure component process', bluespec: 'module interface function method rule typedef',
  gleam: 'fn type const', roc: '', grain: 'let type enum record module', motoko: 'actor class func module type object', ballerina: 'function service class type record object', haxe: 'function class interface enum typedef abstract', actionscript: 'function class interface',
  koka: 'fun type effect struct alias module', unison: 'type ability', pony: 'actor class primitive trait interface struct fun be new', chapel: 'proc iter class record module enum', wren: 'class construct', squirrel: 'function class enum', angelscript: 'class interface enum funcdef namespace', gml: 'function',
  cobol: '', apex: 'class interface enum trigger', qml: 'function signal property', applescript: 'on to script', autohotkey: 'class', autoit: 'func', papyrus: 'function event state scriptname', unrealscript: 'function event state class struct enum',
  eiffel: 'class feature', modula2: 'procedure module', oberon: 'procedure module', smalltalk: '', forth: '', factor: '', prolog: '', mercury: 'pred func type module', logtalk: 'object protocol category',
  openqasm: 'gate def defcal', quil: 'DEFGATE DEFCIRCUIT DEFCAL', nix: '', dhall: '', puppet: 'class define node function type', terraform: '', hcl: '', nginx: '', makefile: '', cmake: '', just: '', starlark_: '',
};

const C_FAMILY = new Set(['c', 'cpp', 'java', 'csharp', 'objective-c', 'd', 'vala', 'cuda', 'opencl', 'glsl', 'hlsl', 'metal', 'ispc', 'apex', 'dart', 'groovy', 'angelscript', 'pawn', 'unrealscript', 'shaderlab', 'arduino', 'gdshader', 'cg', 'c3', 'carbon', 'processing', 'wgsl', 'hare', 'jai', 'nemerle', 'xtend', 'ceylon', 'fantom', 'haxe', 'actionscript']);
const HEADING_LANGS = new Set(['markdown', 'mdx', 'rmarkdown', 'quarto', 'livebook', 'julia-markdown', 'djot']);
const OFFSIDE = new Set(['python', 'cython', 'mojo', 'starlark', 'gdscript', 'vyper', 'nim', 'coffeescript', 'livescript', 'imba', 'civet', 'yaml', 'haml', 'slim', 'sass', 'stylus', 'fsharp', 'haskell', 'purescript', 'elm', 'idris', 'agda', 'lean', 'moonscript', 'xonsh', 'sage', 'snakemake', 'boo', 'pug', 'fe', 'koka', 'roc', 'unison', 'pyret', 'fennel']);
const CONTROL = new Set(['if', 'for', 'while', 'switch', 'catch', 'return', 'sizeof', 'new', 'delete', 'else', 'do', 'case', 'typeof', 'await', 'throw', 'using', 'lock', 'foreach', 'elif', 'when', 'match', 'with', 'yield', 'defined', 'alignof', 'decltype', 'static_assert', 'assert', 'print', 'println']);

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Strip strings and comments so braces inside them don't confuse the block matcher (keeps offsets). */
function maskCode(lines: string[], lineComment?: string): string[] {
  let inBlock = false;
  return lines.map((ln) => {
    let out = '';
    let i = 0;
    let q: string | null = null;
    while (i < ln.length) {
      const ch = ln[i];
      if (inBlock) {
        if (ch === '*' && ln[i + 1] === '/') { inBlock = false; out += '  '; i += 2; continue; }
        out += ' '; i++; continue;
      }
      if (q) {
        if (ch === '\\') { out += '  '; i += 2; continue; }
        if (ch === q) q = null;
        out += ' '; i++; continue;
      }
      if (ch === '/' && ln[i + 1] === '*') { inBlock = true; out += '  '; i += 2; continue; }
      if (lineComment && ln.startsWith(lineComment, i)) break;
      if (ch === '"' || ch === '\'' || ch === '`') { q = ch; out += ' '; i++; continue; }
      out += ch; i++;
    }
    return out;
  });
}

function braceEnd(masked: string[], start: number): number {
  let depth = 0;
  let seen = false;
  for (let i = start; i < masked.length && i < start + 5000; i++) {
    for (const ch of masked[i]) {
      if (ch === '{') { depth++; seen = true; }
      else if (ch === '}') { depth--; if (seen && depth <= 0) return i; }
    }
    if (!seen && i > start + 1) return start;
  }
  return seen ? masked.length - 1 : start;
}

function indentOf(s: string) {
  const m = /^[ \t]*/.exec(s)![0];
  return m.replace(/\t/g, '    ').length;
}

function indentEnd(lines: string[], start: number): number {
  const base = indentOf(lines[start]);
  let last = start;
  for (let i = start + 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    if (indentOf(lines[i]) <= base && !/^\s*(end\b|\}|\)|\]|#|\/\/|--)/.test(lines[i])) break;
    last = i;
    if (/^\s*end\b/.test(lines[i]) && indentOf(lines[i]) <= base) break;
  }
  return last;
}

function nest(flat: (Flat & { endLine: number })[]): Sym[] {
  const roots: Sym[] = [];
  const stack: Sym[] = [];
  const sorted = [...flat].sort((a, b) => a.line - b.line || b.endLine - a.endLine);
  for (const f of sorted) {
    const s: Sym = { name: f.name, kind: f.kind, line: f.line, col: f.col, endLine: Math.max(f.line, f.endLine), detail: f.detail, children: [] };
    while (stack.length && !(stack[stack.length - 1].line <= s.line && stack[stack.length - 1].endLine >= s.endLine && stack[stack.length - 1] !== s)) stack.pop();
    if (stack.length && stack[stack.length - 1].line < s.line) stack[stack.length - 1].children.push(s);
    else roots.push(s);
    stack.push(s);
  }
  return roots;
}

function nestByLevel(flat: Flat[], total: number): Sym[] {
  const roots: Sym[] = [];
  const stack: { s: Sym; level: number }[] = [];
  flat.forEach((f, i) => {
    const level = f.level ?? 1;
    let end = total;
    for (let j = i + 1; j < flat.length; j++) if ((flat[j].level ?? 1) <= level) { end = flat[j].line - 1; break; }
    const s: Sym = { name: f.name, kind: f.kind, line: f.line, col: f.col, endLine: Math.max(f.line, end), detail: f.detail, children: [] };
    while (stack.length && stack[stack.length - 1].level >= level) stack.pop();
    if (stack.length) stack[stack.length - 1].s.children.push(s);
    else roots.push(s);
    stack.push({ s, level });
  });
  return roots;
}

function headings(lines: string[], re: RegExp, level: (m: RegExpExecArray) => number, name: (m: RegExpExecArray) => string, fence?: RegExp): Sym[] {
  const flat: Flat[] = [];
  let inFence = false;
  lines.forEach((ln, i) => {
    if (fence && fence.test(ln)) { inFence = !inFence; return; }
    if (inFence) return;
    const m = re.exec(ln);
    if (m) flat.push({ name: name(m).trim() || '(untitled)', kind: 'heading', line: i + 1, col: (m.index ?? 0) + 1, level: level(m) });
  });
  return nestByLevel(flat, lines.length);
}

function lineMatches(lines: string[], rules: [RegExp, SymKind, number?][]): Flat[] {
  const out: Flat[] = [];
  lines.forEach((ln, i) => {
    for (const [re, kind, g = 1] of rules) {
      const m = re.exec(ln);
      if (m && m[g]) {
        out.push({ name: m[g], kind, line: i + 1, col: ln.indexOf(m[g], m.index) + 1 });
        break;
      }
    }
  });
  return out;
}

function withEnds(flat: Flat[], lines: string[], mode: 'brace' | 'indent' | 'line', lineComment?: string) {
  if (mode === 'line') return flat.map((f) => ({ ...f, endLine: f.line }));
  const masked = mode === 'brace' ? maskCode(lines, lineComment) : lines;
  return flat.map((f) => ({ ...f, endLine: mode === 'brace' ? braceEnd(masked, f.line - 1) + 1 : indentEnd(lines, f.line - 1) + 1 }));
}

function iniSections(lines: string[], keyRe: RegExp): Sym[] {
  const out: Sym[] = [];
  let cur: Sym | null = null;
  lines.forEach((ln, i) => {
    const sec = /^\s*\[([^\]]+)\]/.exec(ln);
    if (sec) {
      if (cur) cur.endLine = i;
      cur = { name: sec[1].trim(), kind: 'namespace', line: i + 1, col: ln.indexOf(sec[1]) + 1, endLine: lines.length, children: [] };
      out.push(cur);
      return;
    }
    const k = keyRe.exec(ln);
    if (k) {
      const s: Sym = { name: k[1].trim(), kind: 'key', line: i + 1, col: ln.indexOf(k[1]) + 1, endLine: i + 1, children: [] };
      (cur ? cur.children : out).push(s);
    }
  });
  return out;
}

function yamlKeys(lines: string[]): Sym[] {
  const flat: (Flat & { endLine: number })[] = [];
  lines.forEach((ln, i) => {
    const m = /^(\s*)(?:-\s+)?([A-Za-z0-9_.$@\-"'/ ]+?)\s*:(?:\s|$)/.exec(ln);
    if (!m || /^\s*#/.test(ln)) return;
    const ind = m[1].length;
    if (ind > 6) return;
    flat.push({ name: m[2].replace(/^["']|["']$/g, ''), kind: ind === 0 ? 'module' : 'key', line: i + 1, col: ind + 1, endLine: i + 1 });
  });
  return nest(flat.map((f) => ({ ...f, endLine: indentEnd(lines, f.line - 1) + 1 })));
}

function jsonKeys(text: string, lines: string[]): Sym[] {
  const out: Sym[] = [];
  try {
    const data = JSON.parse(text);
    if (!data || typeof data !== 'object' || Array.isArray(data)) return out;
    const find = (key: string, from: number, depth: number) => {
      const re = new RegExp(`^\\s{0,${depth * 8 + 8}}"${esc(key)}"\\s*:`);
      for (let i = from; i < lines.length; i++) if (re.test(lines[i])) return i;
      return -1;
    };
    let pos = 0;
    for (const [k, v] of Object.entries(data)) {
      const li = find(k, pos, 0);
      if (li < 0) continue;
      pos = li + 1;
      const s: Sym = { name: k, kind: v && typeof v === 'object' ? (Array.isArray(v) ? 'field' : 'module') : 'key', line: li + 1, col: lines[li].indexOf('"') + 1, endLine: li + 1, children: [] };
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        let p2 = li + 1;
        for (const k2 of Object.keys(v).slice(0, 200)) {
          const l2 = find(k2, p2, 1);
          if (l2 < 0) continue;
          p2 = l2 + 1;
          s.children.push({ name: k2, kind: 'key', line: l2 + 1, col: lines[l2].indexOf('"') + 1, endLine: l2 + 1, children: [] });
        }
        s.endLine = s.children.length ? s.children[s.children.length - 1].line : li + 1;
      }
      out.push(s);
    }
  } catch { /* invalid json: no outline */ }
  return out;
}

const cache = new Map<string, { text: string; syms: Sym[] }>();

/** Extract document symbols for `text` written in `lang`. Results are cached per (key, text). */
export function extractSymbols(text: string, lang: LangDef, cacheKey?: string): Sym[] {
  const key = (cacheKey ?? '') + '|' + lang.id;
  const hit = cache.get(key);
  if (hit && hit.text === text) return hit.syms;
  let syms: Sym[] = [];
  try {
    syms = compute(text, lang);
  } catch {
    syms = [];
  }
  if (cache.size > 400) cache.clear();
  cache.set(key, { text, syms });
  return syms;
}

function compute(text: string, lang: LangDef): Sym[] {
  if (text.length > 1_500_000) return [];
  const lines = text.split(/\r?\n/);
  const id = lang.id;
  const mono = lang.monaco;

  // ---------------------------------------------------------------- documents
  if (HEADING_LANGS.has(id) || mono === 'markdown') return headings(lines, /^(#{1,6})\s+(.+?)\s*#*\s*$/, (m) => m[1].length, (m) => m[2], /^\s*(```|~~~)/);
  switch (id) {
    case 'asciidoc': return headings(lines, /^(={1,6})\s+(.+)$/, (m) => m[1].length, (m) => m[2], /^(----|\.\.\.\.|```)\s*$/);
    case 'org': return headings(lines, /^(\*+)\s+(.+?)(\s+:[\w:@]+:)?\s*$/, (m) => m[1].length, (m) => m[2]);
    case 'textile': return headings(lines, /^h([1-6])\.\s+(.+)$/, (m) => +m[1], (m) => m[2]);
    case 'mediawiki': return headings(lines, /^(=+)\s*(.+?)\s*=+\s*$/, (m) => m[1].length, (m) => m[2]);
    case 'creole': return headings(lines, /^(=+)\s*(.+?)\s*=*\s*$/, (m) => m[1].length, (m) => m[2]);
    case 'typst': return headings(lines, /^\s*(=+)\s+(.+)$/, (m) => m[1].length, (m) => m[2]);
    case 'pod': return headings(lines, /^=head([1-6])\s+(.+)$/, (m) => +m[1], (m) => m[2]);
    case 'rdoc': return headings(lines, /^(=+)\s+(.+)$/, (m) => m[1].length, (m) => m[2]);
    case 'latex': case 'context': {
      const lv: Record<string, number> = { part: 1, chapter: 2, section: 3, subsection: 4, subsubsection: 5, paragraph: 6 };
      return headings(lines, /\\(part|chapter|section|subsection|subsubsection|paragraph)\*?\s*(?:\[[^\]]*\])?\{([^}]*)\}/, (m) => lv[m[1]], (m) => m[2]);
    }
    case 'texinfo': {
      const lv: Record<string, number> = { chapter: 1, unnumbered: 1, appendix: 1, section: 2, subsection: 3, subsubsection: 4 };
      return headings(lines, /^@(chapter|unnumbered|appendix|section|subsection|subsubsection)\s+(.+)$/, (m) => lv[m[1]], (m) => m[2]);
    }
    case 'groff': return headings(lines, /^\.(SH|SS)\s+"?([^"]+)"?/, (m) => (m[1] === 'SH' ? 1 : 2), (m) => m[2]);
    case 'restructuredtext': {
      const flat: Flat[] = [];
      const order: string[] = [];
      lines.forEach((ln, i) => {
        const nx = lines[i + 1];
        if (nx && ln.trim() && /^([=\-~^"'`#*+:.])\1{2,}\s*$/.test(nx) && nx.trim().length >= ln.trim().length - 1 && !/^([=\-~^"'`#*+:.])\1{2,}\s*$/.test(ln)) {
          const ch = nx.trim()[0];
          if (!order.includes(ch)) order.push(ch);
          flat.push({ name: ln.trim(), kind: 'heading', line: i + 1, col: 1, level: order.indexOf(ch) + 1 });
        }
      });
      return nestByLevel(flat, lines.length);
    }
    case 'gherkin': return headings(lines, /^\s*(Feature|Rule|Background|Scenario Outline|Scenario Template|Scenario|Example|Examples):\s*(.*)$/, (m) => (m[1] === 'Feature' ? 1 : m[1] === 'Rule' ? 2 : m[1] === 'Examples' ? 4 : 3), (m) => `${m[1]}: ${m[2]}`);
    case 'robot': {
      const flat: Flat[] = [];
      lines.forEach((ln, i) => {
        const sec = /^\*{3}\s*(.+?)\s*\*{3}/.exec(ln);
        if (sec) flat.push({ name: sec[1], kind: 'namespace', line: i + 1, col: 1, level: 1 });
        else if (/^[^\s#*|]/.test(ln)) flat.push({ name: ln.split(/\s{2,}|\t/)[0], kind: 'function', line: i + 1, col: 1, level: 2 });
      });
      return nestByLevel(flat, lines.length);
    }
  }

  // ---------------------------------------------------------------- config & data
  if (mono === 'json' || id === 'json5' || id === 'hjson') return jsonKeys(text, lines);
  if (mono === 'yaml') return yamlKeys(lines);
  if (['ini', 'toml', 'editorconfig', 'gitconfig', 'systemd', 'desktop', 'innosetup', 'regedit', 'ass'].includes(id)) return iniSections(lines, /^\s*([^\s=:#;\[][^=:]*?)\s*[=:]/);
  if (id === 'properties' || id === 'dotenv') return lineMatches(lines, [[/^\s*(?:export\s+)?([^#!\s=:][^=:\s]*)\s*[=:]/, 'key']]).map((f) => ({ ...f, endLine: f.line, children: [] }));
  if (mono === 'css' || mono === 'scss' || mono === 'less' || id === 'sass' || id === 'stylus' || id === 'postcss') {
    const flat = lineMatches(lines, [[/^\s*(@(?:media|supports|keyframes|layer|container|font-face|mixin|function|include)[^{]*?)\s*\{/, 'module'], [/^\s*([^{}@\s;/][^{};]*?)\s*\{/, 'selector'], [/^\s*(\$[\w-]+|--[\w-]+)\s*:/, 'variable']]);
    return nest(withEnds(flat, lines, id === 'sass' || id === 'stylus' ? 'indent' : 'brace'));
  }
  if (mono === 'sql' || mono === 'mysql' || mono === 'pgsql' || mono === 'redshift' || ['tsql', 'plsql', 'hiveql', 'cql', 'surrealql'].includes(id)) {
    const kinds: Record<string, SymKind> = { table: 'struct', view: 'interface', function: 'function', procedure: 'function', index: 'key', trigger: 'event', type: 'type', schema: 'namespace', database: 'module', sequence: 'constant', 'materialized view': 'interface', package: 'package', keyspace: 'module' };
    const out: Sym[] = [];
    lines.forEach((ln, i) => {
      const m = /\b(?:create|define)\s+(?:or\s+replace\s+)?(?:temp(?:orary)?\s+|unique\s+|external\s+)?(table|materialized\s+view|view|function|procedure|index|trigger|type|schema|database|sequence|package(?:\s+body)?|keyspace)\s+(?:if\s+not\s+exists\s+)?([\w."`\[\]]+)/i.exec(ln);
      if (m) out.push({ name: m[2].replace(/["`\[\]]/g, ''), kind: kinds[m[1].toLowerCase().replace(/\s+/g, ' ').replace(' body', '')] ?? 'struct', line: i + 1, col: ln.indexOf(m[2]) + 1, endLine: i + 1, detail: m[1].toLowerCase(), children: [] });
    });
    return out;
  }
  if (id === 'makefile') return lineMatches(lines, [[/^([A-Za-z0-9_.\-/%$(){}]+(?:\s+[A-Za-z0-9_.\-/%$(){}]+)*)\s*::?(?!=)/, 'target'], [/^([A-Za-z_][\w.]*)\s*(?::=|\?=|\+=|=)/, 'variable']]).filter((f) => !f.name.startsWith('.')).map((f) => ({ ...f, endLine: f.line, children: [] }));
  if (id === 'just') return lineMatches(lines, [[/^@?([A-Za-z_][\w-]*)[^:=\n]*:(?!=)/, 'function'], [/^(?:export\s+)?([A-Za-z_][\w-]*)\s*:=/, 'variable']]).map((f) => ({ ...f, endLine: f.line, children: [] }));
  if (mono === 'dockerfile') return lineMatches(lines, [[/^\s*FROM\s+\S+(?:\s+AS\s+(\S+))/i, 'module'], [/^\s*FROM\s+(\S+)/i, 'module']]).map((f) => ({ ...f, endLine: f.line, children: [] }));
  if (id === 'cmake') return lineMatches(lines, [[/^\s*(?:function|macro)\s*\(\s*([\w-]+)/i, 'function'], [/^\s*add_(?:executable|library|custom_target)\s*\(\s*([\w-]+)/i, 'target'], [/^\s*project\s*\(\s*([\w-]+)/i, 'module']]).map((f) => ({ ...f, endLine: f.line, children: [] }));
  if (id === 'nginx' || id === 'caddyfile' || id === 'apache') {
    const flat = lineMatches(lines, [[/^\s*((?:server|location|upstream|http|events|stream|map|if)\b[^{]*?)\s*\{/, 'module'], [/^\s*<(\w+[^>]*)>/, 'module'], [/^\s*([^\s#{][^{]*?)\s*\{/, 'module']]);
    return nest(withEnds(flat, lines, 'brace', '#'));
  }
  if (mono === 'hcl') return nest(withEnds(lineMatches(lines, [[/^\s*((?:resource|data|module|variable|output|provider|locals|terraform|job|group|task|job)\b(?:\s+"[^"]*")*)\s*\{/, 'module']]), lines, 'brace', '#'));
  if (id === 'crontab' || id === 'hosts' || id === 'csv' || id === 'tsv' || id === 'log' || id === 'diff' || id === 'plaintext') {
    if (id === 'diff') return lineMatches(lines, [[/^\+\+\+ (?:b\/)?(.+)$/, 'file'], [/^(@@[^@]*@@)/, 'function']]).map((f) => ({ ...f, endLine: f.line, children: [] }));
    return [];
  }

  // ---------------------------------------------------------------- code
  if (mono === 'html' || mono === 'xml' || id === 'svg') {
    return lineMatches(lines, [[/<(?:h([1-6]))[^>]*>([^<]+)</, 'string', 2], [/<([\w-]+)[^>]*\bid="([^"]+)"/, 'field', 2]]).map((f) => ({ ...f, endLine: f.line, children: [] }));
  }
  const flat: Flat[] = [];
  const lc = lang.comment;
  const lisp = lang.grammar?.mode === 'lisp' || ['clojure', 'scheme'].includes(id);
  if (lisp) {
    lines.forEach((ln, i) => {
      const m = /^\s*\((def[\w\-/!?*]*|define[\w\-/!?*]*|defun|defmacro|defn-?|fn|ns|module|struct|lambda|local|global|var)\s+\(?([^\s()\[\]{}"]+)/.exec(ln);
      if (m && !['lambda', 'fn'].includes(m[1])) flat.push({ name: m[2], kind: /class|struct|record|type|protocol/.test(m[1]) ? 'class' : m[1] === 'ns' || m[1].includes('module') || m[1].includes('package') ? 'module' : /var|param|const|def$/.test(m[1]) ? 'variable' : 'function', line: i + 1, col: ln.indexOf(m[2]) + 1, detail: m[1] });
    });
    return nest(withEnds(flat, lines, 'indent'));
  }
  if (lang.grammar?.mode === 'asm' || ['mips', 'nasm', 'gas', 'armasm', 'riscv', 'avrasm', 'asm6502', 'z80', 'm68k', 'ptx'].includes(id)) {
    return lineMatches(lines, [[/^\s*([A-Za-z_.$@?][\w.$@?]*):/, 'function'], [/^\s*section\s+(\S+)/i, 'namespace'], [/^\s*\.(?:section|text|data|bss)\b\s*(\S*)/, 'namespace']]).map((f) => ({ ...f, endLine: f.line, children: [] }));
  }
  if (id === 'wat') return lineMatches(lines, [[/\((?:func|global|memory|table|type)\s+(\$[\w.]+)/, 'function']]).map((f) => ({ ...f, endLine: f.line, children: [] }));
  if (id === 'llvm') return lineMatches(lines, [[/^define\b.*?(@[\w.$"]+)\s*\(/, 'function'], [/^(@[\w.$]+)\s*=/, 'variable'], [/^(%[\w.]+)\s*=\s*type/, 'struct']]).map((f) => ({ ...f, endLine: f.line, children: [] }));
  if (id === 'prolog' || id === 'mercury' || id === 'logtalk' || id === 'datalog') {
    const seen = new Set<string>();
    lines.forEach((ln, i) => {
      const m = /^([a-z][\w]*)\s*(\(|:-|-->|\.)/.exec(ln);
      if (m && !seen.has(m[1])) { seen.add(m[1]); flat.push({ name: m[1], kind: 'function', line: i + 1, col: 1 }); }
    });
    return flat.map((f) => ({ ...f, endLine: f.line, children: [] }));
  }
  if (id === 'erlang') {
    const seen = new Set<string>();
    lines.forEach((ln, i) => {
      const mod = /^-module\(([\w@]+)\)/.exec(ln);
      if (mod) { flat.push({ name: mod[1], kind: 'module', line: i + 1, col: 9 }); return; }
      const rec = /^-(record|type|opaque)\(([\w@]+)/.exec(ln);
      if (rec) { flat.push({ name: rec[2], kind: 'struct', line: i + 1, col: ln.indexOf(rec[2]) + 1 }); return; }
      const m = /^([a-z][\w@]*)\s*\(.*\)\s*(when\b.*)?->/.exec(ln);
      if (m && !seen.has(m[1])) { seen.add(m[1]); flat.push({ name: m[1], kind: 'function', line: i + 1, col: 1 }); }
    });
    return flat.map((f) => ({ ...f, endLine: f.line, children: [] }));
  }
  if (id === 'r') {
    return nest(withEnds(lineMatches(lines, [[/^\s*([\w.]+)\s*(?:<-|=)\s*function\b/, 'function'], [/^\s*([\w.]+)\s*<-\s*R6Class\(/, 'class'], [/^\s*setClass\(\s*["']([\w.]+)/, 'class']]), lines, 'brace', '#'));
  }
  if (id === 'cobol') {
    return lineMatches(lines, [[/^.{0,7}([A-Z0-9][A-Z0-9-]*)\s+(?:DIVISION|SECTION)\s*\./i, 'namespace'], [/^.{7}([A-Z0-9][A-Z0-9-]*)\.\s*$/i, 'function']]).map((f) => ({ ...f, endLine: f.line, children: [] }));
  }
  if (['shell', 'zsh', 'ksh', 'bash', 'tcsh'].includes(id)) {
    return nest(withEnds(lineMatches(lines, [[/^\s*function\s+([\w.:\-]+)/, 'function'], [/^\s*([\w.:\-]+)\s*\(\)\s*\{?/, 'function']]), lines, 'brace', '#'));
  }
  if (id === 'odin' || id === 'jai') {
    return nest(withEnds(lineMatches(lines, [[/^\s*([A-Za-z_]\w*)\s*::\s*(?:proc|#force_inline\s+proc|inline\s+proc)?\s*\(/, 'function'], [/^\s*([A-Za-z_]\w*)\s*::\s*(?:struct|union)\b/, 'struct'], [/^\s*([A-Za-z_]\w*)\s*::\s*enum\b/, 'enum'], [/^\s*([A-Za-z_]\w*)\s*::\s*/, 'constant']]), lines, 'brace'));
  }
  if (id === 'zig') {
    return nest(withEnds(lineMatches(lines, [[/^\s*(?:pub\s+)?(?:export\s+|extern\s+|inline\s+)?fn\s+([A-Za-z_]\w*)/, 'function'], [/^\s*(?:pub\s+)?const\s+([A-Za-z_]\w*)\s*=\s*(?:extern\s+|packed\s+)?(?:struct|union)\b/, 'struct'], [/^\s*(?:pub\s+)?const\s+([A-Za-z_]\w*)\s*=\s*enum\b/, 'enum'], [/^\s*test\s+"([^"]+)"/, 'function']]), lines, 'brace'));
  }
  if (['javascript', 'typescript', 'coffeescript', 'livescript', 'imba', 'civet', 'apps-script', 'qml'].includes(id) || mono === 'javascript' || mono === 'typescript') {
    const rules: [RegExp, SymKind, number?][] = [
      [/^\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)/, 'function'],
      [/^\s*(?:export\s+)?(?:default\s+)?(?:abstract\s+)?class\s+([A-Za-z_$][\w$]*)/, 'class'],
      [/^\s*(?:export\s+)?interface\s+([A-Za-z_$][\w$]*)/, 'interface'],
      [/^\s*(?:export\s+)?(?:declare\s+)?(?:const\s+)?enum\s+([A-Za-z_$][\w$]*)/, 'enum'],
      [/^\s*(?:export\s+)?type\s+([A-Za-z_$][\w$]*)\s*[=<]/, 'type'],
      [/^\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/, 'function'],
      [/^\s*([A-Za-z_$][\w$]*)\s*[:=]\s*(?:\([^)]*\)\s*)?[-=]>/, 'function'],
      [/^\s{2,}(?:static\s+|async\s+|get\s+|set\s+|public\s+|private\s+|protected\s+)*([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*(?::\s*[^{]+)?\{\s*$/, 'method'],
      [/^\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/, 'variable'],
    ];
    const f2 = lineMatches(lines, rules).filter((f) => !CONTROL.has(f.name));
    return nest(withEnds(f2, lines, OFFSIDE.has(id) ? 'indent' : 'brace', '//'));
  }

  // generic keyword based declarations
  const kwList = (LANG_KWS[id] ?? LANG_KWS[mono] ?? DEFAULT_KWS).trim();
  const ci = !!lang.grammar?.ci || ['vb', 'fortran', 'fortran-fixed', 'ada', 'pascal', 'sql', 'vhdl', 'qbasic', 'purebasic', 'blitzmax', 'autoit', 'autohotkey', 'papyrus', 'applescript', 'modula2', 'oberon'].includes(id);
  const rules: [RegExp, SymKind, number?][] = [];
  if (kwList) {
    const kws = kwList.split(/\s+/).sort((a, b) => b.length - a.length).map(esc).join('|');
    rules.push([new RegExp(`^\\s*${MODS}(${kws})\\s+(?:\\([^)]*\\)\\s*)?([A-Za-z_$@][\\w$!?'.]*)`, ci ? 'i' : ''), 'function', 2]);
  }
  if (id === 'go') rules.unshift([/^\s*func\s+\(([^)]*)\)\s*([A-Za-z_]\w*)/, 'method', 2]);
  if (id === 'lua' || id === 'luau' || id === 'teal') rules.unshift([/^\s*(?:local\s+)?function\s+([\w.:]+)/, 'function'], [/^\s*(?:local\s+)?([\w.]+)\s*=\s*function\b/, 'function']);
  if (id === 'matlab' || id === 'octave') rules.unshift([/^\s*function\s+(?:\[?[\w, ]*\]?\s*=\s*)?([A-Za-z_]\w*)/, 'function']);
  if (['haskell', 'purescript', 'elm', 'idris', 'agda'].includes(id)) rules.push([/^([a-z_][\w']*)\s*::/, 'function'], [/^([a-z_][\w']*)\s*:\s/, 'function']);
  if (C_FAMILY.has(id) || C_FAMILY.has(mono)) {
    rules.push([/^\s*(?:template\s*<[^>]*>\s*)?(?:[\w:<>,\[\]*&~]+\s+)+?[*&]*([A-Za-z_~][\w:~]*)\s*\([^;{}]*\)\s*(?:const\b|override\b|noexcept\b|final\b|throws\s+[\w., ]+|->\s*[\w:<>*&]+|:\s*[^{;]+)*\s*\{?\s*$/, 'function']);
    rules.push([/^\s*(?:typedef\s+)?(?:struct|union|enum(?:\s+class)?)\s+([A-Za-z_]\w*)\s*(?::[^{]*)?\{?\s*$/, 'struct']);
    rules.push([/^\s*#\s*define\s+([A-Za-z_]\w*)/, 'constant']);
  }
  const cStyle = C_FAMILY.has(id) || C_FAMILY.has(mono);
  const raw = lineMatches(lines, rules)
    .map((f) => ({ ...f, name: f.name.replace(/[.]+$/, '') }))
    .filter((f) => f.name && !(cStyle && CONTROL.has(f.name.toLowerCase()) && !new RegExp(`\\b(fn|func|function|def|sub|proc)\\s+${esc(f.name)}\\b`).test(lines[f.line - 1])));
  // refine kinds from the keyword that matched
  if (kwList) {
    const re = new RegExp(`^\\s*${MODS}([A-Za-z_!]+)\\s`, ci ? 'i' : '');
    for (const f of raw) {
      const m = re.exec(lines[f.line - 1]);
      const k = m?.[1]?.toLowerCase();
      if (k && KW_KIND[k] && f.kind !== 'method') {
        f.kind = KW_KIND[k];
        f.detail = k;
      } else if (k === 'macro_rules!') f.kind = 'function';
    }
    // nested functions inside classes are methods
  }
  const mode = OFFSIDE.has(id) || OFFSIDE.has(mono) ? 'indent' : (lang.grammar?.brackets ?? [['{', '}']]).some(([o]) => o === '{') && !['ruby', 'crystal', 'lua', 'elixir', 'julia', 'vb', 'fortran', 'fortran-fixed', 'ada', 'pascal', 'matlab', 'octave', 'scilab', 'tcl', 'qbasic', 'purebasic', 'blitzmax', 'autoit', 'papyrus', 'applescript', 'eiffel', 'modula2', 'oberon', 'vhdl', 'erlang', 'ocaml', 'sml', 'fish', 'teal', 'luau', 'moonscript', 'raku_'].includes(id) ? 'brace' : 'indent';
  const withEnd = withEnds(raw, lines, mode, lc);
  const tree = nest(withEnd);
  const markMethods = (list: Sym[], inClass: boolean) => list.forEach((s) => { if (inClass && s.kind === 'function') s.kind = 'method'; markMethods(s.children, ['class', 'struct', 'interface', 'enum'].includes(s.kind)); });
  markMethods(tree, false);
  return tree;
}

/** Flatten a symbol tree (depth first) with container names. */
export function flattenSymbols(syms: Sym[], container = ''): (Sym & { container: string })[] {
  const out: (Sym & { container: string })[] = [];
  for (const s of syms) {
    out.push({ ...s, container });
    out.push(...flattenSymbols(s.children, container ? container + '.' + s.name : s.name));
  }
  return out;
}

/** Symbol path (outermost → innermost) enclosing a 1-based line. */
export function symbolPathAt(syms: Sym[], line: number): Sym[] {
  const out: Sym[] = [];
  let list = syms;
  for (;;) {
    const hit = list.find((s) => s.line <= line && s.endLine >= line);
    if (!hit) break;
    out.push(hit);
    list = hit.children;
  }
  return out;
}

/** Convert a TypeScript NavigationTree (from the TS worker) into Sym[]. */
export function fromNavTree(tree: any, model: any): Sym[] {
  const kindMap: Record<string, SymKind> = {
    class: 'class', interface: 'interface', type: 'type', enum: 'enum', module: 'module', function: 'function', method: 'method', property: 'property',
    getter: 'property', setter: 'property', ['constructor' as string]: 'constructor' as SymKind, var: 'variable', let: 'variable', const: 'constant', alias: 'variable', 'local function': 'function', 'enum member': 'field', 'JSX attribute': 'field',
  };
  const conv = (n: any): Sym[] => {
    if (typeof n.text === 'string' && / callback$/.test(n.text)) return [];
    const kids = (n.childItems ?? []).flatMap(conv);
    if (!n.text || n.text.startsWith('<') || n.kind === 'script' || (n.kind === 'module' && n.text.startsWith('"'))) return kids;
    const span = n.nameSpan ?? n.spans?.[0];
    const full = n.spans?.[0];
    if (!span || !full) return kids;
    const start = model.getPositionAt(span.start);
    const end = model.getPositionAt(full.start + full.length);
    const s: Sym = { name: n.text, kind: kindMap[n.kind] ?? 'variable', line: model.getPositionAt(full.start).lineNumber, col: start.column, endLine: end.lineNumber, children: kids };
    if (s.kind === 'variable' && kids.length === 0 && s.line === s.endLine && (n.kindModifiers ?? '').includes('export') === false && !['let', 'const', 'var'].includes(n.kind)) return [];
    return [s];
  };
  return conv(tree);
}
