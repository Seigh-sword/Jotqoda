/**
 * Generic grammar → Monaco Monarch tokenizer factory.
 *
 * Every custom JotQoda language is described by a compact `Grammar` object
 * (comment syntax, string delimiters, keyword lists …) and compiled here into
 * a Monarch definition plus a language configuration (comments, brackets,
 * auto-closing pairs, folding, indentation). Tokens only use names that the
 * JotQoda themes colour (see themes.ts → defineMonacoThemes).
 */

export type Rule = any[] | { include: string };

export interface Grammar {
  /** code (default) · lisp · asm · raw (use `monarch`) */
  mode?: 'code' | 'lisp' | 'asm';
  /** Line comment starters, e.g. ['//'] or ['#', ';'] */
  line?: string[];
  /** Line comments that only count at column 0 (e.g. Fortran 77 `C`) */
  line0?: string[];
  /** Block comment pairs, e.g. [['/*', '*\/']] */
  block?: [string, string][];
  /** Block comments nest (Haskell, OCaml, Rust, Swift, D `/+ +/` …) */
  nest?: boolean;
  /** Quote characters that start strings (default `"`) */
  str?: string;
  /** Backslash escapes inside strings (default true) */
  esc?: boolean;
  /** Doubled quote is an escape ('' in SQL / Pascal / Ada) */
  dbl?: boolean;
  /** Support """ and ''' triple quoted strings */
  triple?: boolean;
  /** Interpolation preset inside double-quoted strings */
  interp?: '$' | '${' | '#{' | '{' | '\\(';
  kw?: string;
  types?: string;
  builtins?: string;
  consts?: string;
  /** Case-insensitive keywords (SQL, Fortran, BASIC, Ada …) */
  ci?: boolean;
  /** Identifier regex source */
  ident?: string;
  /** Annotation / attribute regex source → `annotation` token */
  anno?: string;
  /** C preprocessor directives */
  pre?: boolean;
  /** Variable sigil characters, e.g. '$' or '$@%' */
  sigil?: string;
  /** Ruby/Elixir style :symbols */
  sym?: boolean;
  /** Capitalised identifiers are types */
  caps?: boolean;
  /** `ident(` is coloured as a function call (default true) */
  call?: boolean;
  /** Operator characters (character class body) */
  ops?: string;
  /** Rules inserted at the very beginning of root */
  extra?: Rule[];
  /** Rules inserted right before identifier rules */
  after?: Rule[];
  /** Extra tokenizer states */
  states?: Record<string, Rule[]>;
  /** Bracket pairs (default {} [] ()) */
  brackets?: [string, string][];
  /** Indentation style used for auto-indent */
  indent?: 'brace' | 'offside' | 'end' | 'none';
  /** Words that open an `end`-terminated block (indent: 'end') */
  openers?: string;
  /** Lisp: defining forms whose next symbol is a function name */
  defs?: string;
  /** Asm: register names */
  regs?: string;
  /** Raw Monarch definition (overrides everything above except comments meta) */
  monarch?: any;
  /** Custom word pattern */
  word?: RegExp;
}

const reEsc = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
const clsEsc = (s: string) => s.replace(/[\]\\^\-[]/g, '\\$&');
export const W = (s?: string) => (s ? s.split(/\s+/).filter(Boolean) : []);

const BRACKETS = [
  { open: '{', close: '}', token: 'delimiter.curly' },
  { open: '[', close: ']', token: 'delimiter.square' },
  { open: '(', close: ')', token: 'delimiter.parenthesis' },
  { open: '<', close: '>', token: 'delimiter.angle' },
];

const INTERP: Record<string, [string, string]> = {
  '$': ['\\$\\{[^}]*\\}|\\$[A-Za-z_]\\w*', '$'],
  '${': ['\\$\\{[^}]*\\}', '$'],
  '#{': ['#\\{[^}]*\\}', '#'],
  '{': ['\\{[^}]*\\}', '{'],
  '\\(': ['\\\\\\([^)]*\\)', '\\'],
};

const cases = (def: string) => ({
  cases: { '@keywords': 'keyword', '@types': 'type', '@builtins': 'predefined', '@consts': 'constant', '@default': def },
});

function commentRules(g: Grammar, root: Rule[], st: Record<string, Rule[]>) {
  (g.block ?? []).forEach(([o, c], i) => {
    const name = 'blockComment' + i;
    root.push([new RegExp(reEsc(o)), 'comment', '@' + name]);
    const chars = clsEsc([...new Set(o[0] + c[0])].join(''));
    st[name] = [
      [new RegExp(`[^${chars}]+`), 'comment'],
      ...(g.nest ? [[new RegExp(reEsc(o)), 'comment', '@push']] : []),
      [new RegExp(reEsc(c)), 'comment', '@pop'],
      [new RegExp(`[${chars}]`), 'comment'],
    ];
  });
  for (const t of g.line ?? []) {
    root.push([new RegExp(/^\w+$/.test(t) ? `${reEsc(t)}(?![\\w]).*$` : `${reEsc(t)}.*$`), 'comment']);
  }
  for (const t of g.line0 ?? []) root.push([new RegExp(`^${reEsc(t)}.*$`), 'comment']);
}

function stringRules(g: Grammar, root: Rule[], st: Record<string, Rule[]>) {
  const esc = g.esc !== false;
  for (const q of g.str ?? '"') {
    const n = 'string' + q.charCodeAt(0);
    const qe = reEsc(q);
    const qc = clsEsc(q);
    const ip = g.interp && q !== "'" ? INTERP[g.interp] : null;
    const ipRules: Rule[] = ip ? [[new RegExp(ip[0]), 'variable'], [new RegExp(reEsc(ip[1])), 'string']] : [];
    const notIn = `${esc ? '\\\\' : ''}${qc}${ip ? clsEsc(ip[1]) : ''}`;
    if (g.triple && (q === '"' || q === "'")) {
      root.push([new RegExp(qe.repeat(3)), 'string', '@' + n + 't']);
      st[n + 't'] = [
        [new RegExp(`[^${notIn}]+`), 'string'],
        ...(esc ? [[/\\./, 'string.escape']] : []),
        ...ipRules,
        [new RegExp(qe.repeat(3)), 'string', '@pop'],
        [new RegExp(qe), 'string'],
      ];
    }
    root.push([new RegExp(qe), 'string', '@' + n]);
    st[n] = [
      [new RegExp(`[^${notIn}]+`), 'string'],
      ...(g.dbl ? [[new RegExp(qe + qe), 'string.escape']] : []),
      ...(esc ? [[/\\./, 'string.escape'], [/\\$/, 'string.escape']] : []),
      ...ipRules,
      [new RegExp(qe), 'string', '@pop'],
    ];
  }
}

function lisp(id: string, g: Grammar) {
  const sym = `[^\\s()\\[\\]{}"',\`;#|\\\\][^\\s()\\[\\]{}"',\`;]*`;
  const root: Rule[] = [[/\s+/, 'white']];
  const st: Record<string, Rule[]> = {};
  root.push(...(g.extra ?? []));
  commentRules({ line: g.line ?? [';'], block: g.block, nest: true }, root, st);
  root.push(
    [/#;/, 'comment'],
    [/"/, 'string', '@lispString'],
    [/#\\(?:space|newline|tab|nul|null|return|linefeed|altmode|backspace|delete|escape|rubout|alarm|x[0-9a-fA-F]+|[^\s()])/, 'string'],
    [/#[tf](?:rue|alse)?(?![^\s()\[\]{}"])/, 'constant'],
    [/#[xX][0-9a-fA-F]+|#[bB][01]+|#[oO][0-7]+/, 'number'],
    [/[+-]?\d+(?:\/\d+|\.\d*)?(?:[eE][+-]?\d+)?(?=[\s()\[\]{}"';]|$)/, 'number'],
  );
  if (g.defs) root.push([new RegExp(`(\\(\\s*)(${W(g.defs).map(reEsc).join('|')})(\\s+)(${sym})`), ['delimiter.parenthesis', 'keyword', 'white', 'function']]);
  root.push(
    [new RegExp(`#?:${sym}`), 'constant'],
    [/['`,@^~]+|#(?=[([{])/, 'operator'],
    [/[()\[\]{}]/, '@brackets'],
    [new RegExp(sym), cases('identifier')],
  );
  st.lispString = [[/[^\\"]+/, 'string'], [/\\./, 'string.escape'], [/"/, 'string', '@pop']];
  return {
    defaultToken: '', tokenPostfix: '.' + id, ignoreCase: !!g.ci,
    keywords: W(g.kw), types: W(g.types), builtins: W(g.builtins), consts: W(g.consts), brackets: BRACKETS,
    tokenizer: { root, ...st, ...(g.states ?? {}) },
  };
}

function asm(id: string, g: Grammar) {
  const root: Rule[] = [[/\s+/, 'white']];
  const st: Record<string, Rule[]> = {};
  root.push(...(g.extra ?? []));
  commentRules(g, root, st);
  const word = { cases: { '@regs': 'variable.predefined', '@keywords': 'keyword', '@types': 'type', '@default': 'identifier' } };
  root.push(
    [/^\s*[A-Za-z_.$@?][\w.$@?]*:/, 'type.identifier'],
    [/^(\s*)([.%#][A-Za-z_]\w*)/, ['white', 'keyword.directive']],
    [/^(\s*)([A-Za-z_][\w.]*)(?=\s|$)/, ['white', { cases: { '@regs': 'variable.predefined', '@default': 'keyword' } }]],
    [/\.[A-Za-z_]\w*/, 'keyword.directive'],
    [/%[A-Za-z_]\w*/, 'variable.predefined'],
    [/"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/, 'string'],
    [/[#$]?-?(?:0[xX][0-9a-fA-F]+|\$[0-9a-fA-F]+|[0-9][0-9a-fA-F]*[hH]|0[bB][01]+|%[01]+|[01]+[bB]|\d+(?:\.\d+)?)(?![\w])/, 'number'],
    [/[A-Za-z_.$@?][\w.$@?]*/, word],
    [/[\[\](){}]/, '@brackets'],
    [/[+\-*\/,:!<>=&|^~#]/, 'operator'],
  );
  return {
    defaultToken: '', tokenPostfix: '.' + id, ignoreCase: true,
    keywords: W(g.kw), types: W(g.types), regs: W(g.regs), brackets: BRACKETS,
    tokenizer: { root, ...st, ...(g.states ?? {}) },
  };
}

/** Monarch treats `@name` inside regexes as attribute references and `@@` as a literal @ — double every @. */
function sanitize(def: any): any {
  const fix = (r: any): any => (r instanceof RegExp && r.source.includes('@') ? new RegExp(r.source.replace(/@/g, '@@'), r.flags) : r);
  for (const rules of Object.values(def.tokenizer ?? {}) as any[][]) {
    rules.forEach((rule, i) => {
      if (Array.isArray(rule)) rules[i] = [fix(rule[0]), ...rule.slice(1)];
      else if (rule && typeof rule === 'object' && 'regex' in rule) rule.regex = fix(rule.regex);
    });
  }
  return def;
}

export function toMonarch(id: string, g: Grammar): any {
  return sanitize(buildMonarch(id, g));
}

function buildMonarch(id: string, g: Grammar): any {
  if (g.monarch) {
    return { defaultToken: '', tokenPostfix: '.' + id, brackets: BRACKETS, keywords: [], ...g.monarch };
  }
  if (g.mode === 'lisp') return lisp(id, g);
  if (g.mode === 'asm') return asm(id, g);
  const ident = g.ident ?? '[A-Za-z_]\\w*';
  const root: Rule[] = [[/\s+/, 'white']];
  const st: Record<string, Rule[]> = {};
  root.push(...(g.extra ?? []));
  if (g.pre) {
    root.push(
      [/^(\s*#\s*(?:include|import)\s*)(<[^>]*>|"[^"]*")/, ['keyword.directive', 'string']],
      [/^\s*#\s*[A-Za-z_]\w*/, 'keyword.directive'],
    );
  }
  commentRules(g, root, st);
  stringRules(g, root, st);
  if (g.anno) root.push([new RegExp(g.anno), 'annotation']);
  if (g.sigil) root.push([new RegExp(`[${clsEsc(g.sigil)}]+\\{?[A-Za-z_]\\w*\\}?`), 'variable']);
  if (g.sym) root.push([/:[A-Za-z_]\w*[?!]?/, 'constant']);
  root.push(
    [/0[xX][0-9a-fA-F][\w]*/, 'number.hex'],
    [/0[bBoO][0-7][\w]*/, 'number'],
    [/\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?\w*/, 'number'],
  );
  root.push(...(g.after ?? []));
  if (g.call !== false) root.push([new RegExp(`${ident}(?=\\s*\\()`), cases('function')]);
  if (g.caps && !g.ci) root.push([new RegExp(`(?=[A-Z])${ident}`), cases('type.identifier')]);
  root.push(
    [new RegExp(ident), cases('identifier')],
    [/[{}()\[\]]/, '@brackets'],
    [new RegExp(`[${g.ops ?? '=><!~?:&|+\\-*\\/\\^%'}]+`), 'operator'],
    [/[;,.]/, 'delimiter'],
  );
  return {
    defaultToken: '', tokenPostfix: '.' + id, ignoreCase: !!g.ci,
    keywords: W(g.kw), types: W(g.types), builtins: W(g.builtins), consts: W(g.consts), brackets: BRACKETS,
    tokenizer: { root, ...st, ...(g.states ?? {}) },
  };
}

/** Monaco language configuration (Ctrl+/ comments, brackets, folding, indentation). */
export function toLanguageConfig(g: Grammar, comment?: string, block?: [string, string]): any {
  const brackets = g.brackets ?? (g.mode === 'lisp' ? [['(', ')'], ['[', ']'], ['{', '}']] : [['{', '}'], ['[', ']'], ['(', ')']]);
  const quotes = [...(g.str ?? '"')];
  const pairs = [
    ...brackets.map(([open, close]) => ({ open, close })),
    ...quotes.map((q) => ({ open: q, close: q, notIn: ['string', 'comment'] })),
  ];
  const lc = comment ?? g.line?.[0];
  const bc = block ?? g.block?.[0];
  const marker = reEsc(lc ?? '#');
  const conf: any = {
    comments: { ...(lc ? { lineComment: lc } : {}), ...(bc ? { blockComment: bc } : {}) },
    brackets,
    autoClosingPairs: g.mode === 'lisp' ? pairs.filter((p) => p.open !== "'") : pairs,
    surroundingPairs: pairs.map(({ open, close }) => ({ open, close })),
    folding: {
      markers: { start: new RegExp(`^\\s*(${marker}\\s*)?#?region\\b`), end: new RegExp(`^\\s*(${marker}\\s*)?#?endregion\\b`) },
      ...(g.indent === 'offside' ? { offSide: true } : {}),
    },
  };
  if (g.word) conf.wordPattern = g.word;
  else if (g.mode === 'lisp') conf.wordPattern = /[^\s()\[\]{}"',`;#|]+/;
  if (g.indent === 'brace' || (!g.indent && !g.mode && brackets.some(([o]) => o === '{'))) {
    conf.indentationRules = {
      increaseIndentPattern: /^.*(\{[^}"'`]*|\([^)"'`]*|\[[^\]"'`]*)$/,
      decreaseIndentPattern: /^\s*[}\])]/,
    };
  } else if (g.indent === 'end' && g.openers) {
    const o = W(g.openers).map(reEsc).join('|');
    conf.indentationRules = {
      increaseIndentPattern: new RegExp(`^\\s*(${o})\\b(?!.*\\bend\\b).*$|\\b(do|then)\\s*$`, g.ci ? 'i' : ''),
      decreaseIndentPattern: new RegExp(`^\\s*(end|else|elsif|elseif|elif|when|rescue|ensure|catch|finally|until|next|wend|loop)\\b`, g.ci ? 'i' : ''),
    };
  } else if (g.indent === 'offside') {
    conf.indentationRules = { increaseIndentPattern: /^.*:\s*$/, decreaseIndentPattern: /^\s*(else|elif|except|finally)\b.*:\s*$/ };
    conf.onEnterRules = [{ beforeText: /:\s*$/, action: { indentAction: 1 } }];
  }
  return conf;
}

/** Words offered by the keyword completion provider. */
export function completionWords(g: Grammar) {
  return {
    keywords: W(g.kw),
    types: W(g.types),
    builtins: W(g.builtins),
    consts: W(g.consts),
  };
}

// ---------------------------------------------------------------- presets

/** C-family: // and /* *\/ comments, " and ' strings */
export const C = (o: Grammar): Grammar => ({ line: ['//'], block: [['/*', '*/']], str: `"'`, indent: 'brace', ...o });
/** Hash-comment scripting languages */
export const H = (o: Grammar): Grammar => ({ line: ['#'], str: `"'`, ...o });
/** SQL dialects */
export const SQL = (o: Grammar): Grammar => ({
  line: ['--'], block: [['/*', '*/']], str: `'"`, esc: false, dbl: true, ci: true, call: true,
  consts: 'true false null unknown',
  types: 'int integer smallint bigint tinyint decimal numeric real float double precision char varchar nchar nvarchar text blob clob date time timestamp interval boolean bool binary varbinary uuid json jsonb xml serial bigserial money bit',
  ...o,
});
/** ML family: (* *) nested comments */
export const ML = (o: Grammar): Grammar => ({
  block: [['(*', '*)']], nest: true, str: '"', ident: "[A-Za-z_][\\w']*", caps: true,
  extra: [[/'(?:\\.|[^\\'])'/, 'string'], [/'[a-z_]\w*/, 'type']],
  ...o,
});
/** Haskell family: -- and {- -} */
export const HS = (o: Grammar): Grammar => ({
  line: ['--'], block: [['{-', '-}']], nest: true, str: '"', ident: "[A-Za-z_][\\w']*", caps: true,
  extra: [[/\{-#.*?#-\}/, 'annotation'], [/'(?:\\.|[^\\'])'/, 'string'], [/--[!#$%&*+./<=>?@\\^|~:]+/, 'operator']],
  ops: '=><!~?:&|+\\-*\\/\\^%$.@#\\\\',
  ...o,
});
/** Lisp family */
export const LISP = (o: Grammar): Grammar => ({ mode: 'lisp', line: [';'], ...o });
/** Assembly family */
export const ASM = (o: Grammar): Grammar => ({ mode: 'asm', line: [';'], ...o });
/** Numbered register helper, e.g. regs('r', 0, 15) → r0 … r15 */
export const regs = (prefix: string, from: number, to: number, suffixes: string[] = ['']) => {
  const out: string[] = [];
  for (let i = from; i <= to; i++) for (const s of suffixes) out.push(prefix + i + s);
  return out.join(' ');
};

// ---------------------------------------------------------------- raw builders

/** INI-like configuration files */
export const iniMonarch = (commentChars = ';#') => ({
  monarch: {
    tokenizer: {
      root: [
        [new RegExp(`^\\s*[${clsEsc(commentChars)}].*$`), 'comment'],
        [/^\s*\[[^\]]*\]/, 'type'],
        [/^(\s*)([^=:\s\[][^=:]*?)(\s*)([=:])/, ['white', 'key', 'white', 'delimiter']],
        [/"([^"\\]|\\.)*"|'[^']*'/, 'string'],
        [/\$\{[^}]*\}|%\([^)]*\)[sd]|%[A-Za-z_]+%|\$[A-Za-z_]\w*/, 'variable'],
        [/\b(true|false|yes|no|on|off|null|none)\b/, 'constant'],
        [/-?\b\d+(\.\d+)?\b/, 'number'],
      ],
    },
  },
  line: [commentChars[0]],
});

export interface TemplateSpec {
  /** [open, close, kind] */
  tags: [string, string, 'stmt' | 'expr' | 'comment'][];
  kw?: string;
  consts?: string;
  /** directive regex source (e.g. Blade `@\w+`, Velocity `#\w+`) */
  directive?: string;
  /** variable regex source outside tags (e.g. Velocity `$var`) */
  variable?: string;
  /** line comment outside tags (e.g. Velocity `##`) */
  line?: string;
  /** line statement prefix (Jinja line statements, Mako `%`) */
  lineStmt?: string;
}

/** HTML-ish template languages (Jinja, ERB, EJS, Blade, Smarty …) */
export function template(t: TemplateSpec): Grammar {
  const opens: Rule[] = [];
  const states: Record<string, Rule[]> = {};
  const specials = new Set<string>(['<', '&']);
  [...t.tags].sort((a, b) => b[0].length - a[0].length).forEach(([o, c, kind], i) => {
    specials.add(o[0]);
    const name = 'tmpl' + i;
    if (kind === 'comment') {
      opens.push([new RegExp(reEsc(o)), 'comment', '@' + name]);
      states[name] = [[new RegExp(reEsc(c)), 'comment', '@pop'], [new RegExp(`[^${clsEsc(c[0])}]+`), 'comment'], [/./, 'comment']];
    } else {
      opens.push([new RegExp(reEsc(o) + '[-=~+#!]?'), 'metatag', '@' + name]);
      states[name] = [
        [new RegExp('[-~+]?' + reEsc(c)), 'metatag', '@pop'],
        [/\s+/, 'white'],
        [/"([^"\\]|\\.)*"|'([^'\\]|\\.)*'|`[^`]*`/, 'string'],
        [/\d+(\.\d+)?/, 'number'],
        [/(\|)(\s*)([A-Za-z_]\w*)/, ['operator', 'white', 'function']],
        [/[A-Za-z_$@][\w$]*(?=\s*\()/, 'function'],
        [/[A-Za-z_$@][\w$]*/, { cases: { '@keywords': 'keyword', '@consts': 'constant', '@default': 'variable' } }],
        [/[()\[\]{}]/, '@brackets'],
        [/[=<>!+\-*\/%~.,:|?&]+/, 'operator'],
        [/./, ''],
      ];
    }
  });
  if (t.line) {
    specials.add(t.line[0]);
    opens.unshift([new RegExp(reEsc(t.line) + '.*$'), 'comment']);
  }
  if (t.directive) {
    specials.add(t.directive.replace(/^\\/, '')[0]);
    opens.push([new RegExp(t.directive), 'keyword']);
  }
  if (t.variable) {
    specials.add(t.variable.replace(/^\\/, '')[0]);
    opens.push([new RegExp(t.variable), 'variable']);
  }
  if (t.lineStmt) opens.unshift([new RegExp(`^\\s*${reEsc(t.lineStmt)}.*$`), 'metatag']);
  const sp = clsEsc([...specials].join(''));
  return {
    kw: t.kw, consts: t.consts ?? 'true false null none nil',
    monarch: {
      keywords: W(t.kw), consts: W(t.consts ?? 'true false null none nil'),
      tokenizer: {
        root: [
          ...opens,
          [/<!--/, 'comment', '@htmlComment'],
          [/<!DOCTYPE[^>]*>/i, 'metatag'],
          [/(<\/?)([\w\-:.]+)/, ['delimiter', { token: 'tag', next: '@tag' }]],
          [/&#?\w+;/, 'string.escape'],
          [new RegExp(`[^${sp}]+`), ''],
          [/./, ''],
        ],
        tag: [
          ...opens,
          [/\s+/, 'white'],
          [/[\w\-:.@#]+/, 'attribute.name'],
          [/=/, 'delimiter'],
          [/"/, 'attribute.value', '@attrDq'],
          [/'/, 'attribute.value', '@attrSq'],
          [/\/?>/, 'delimiter', '@pop'],
          [/./, ''],
        ],
        attrDq: [...opens, [new RegExp(`[^"${sp}]+`), 'attribute.value'], [/"/, 'attribute.value', '@pop'], [/./, 'attribute.value']],
        attrSq: [...opens, [new RegExp(`[^'${sp}]+`), 'attribute.value'], [/'/, 'attribute.value', '@pop'], [/./, 'attribute.value']],
        htmlComment: [[/-->/, 'comment', '@pop'], [/[^-]+/, 'comment'], [/./, 'comment']],
        ...states,
      },
    },
    brackets: [['<', '>'], ['{', '}'], ['(', ')'], ['[', ']']],
    str: `"'`,
  };
}

/** Markup / documentation languages built from a small rule set. */
export function markup(rules: Rule[], states: Record<string, Rule[]> = {}, extra: Partial<Grammar> = {}): Grammar {
  return { ...extra, monarch: { tokenizer: { root: rules, ...states } } };
}
