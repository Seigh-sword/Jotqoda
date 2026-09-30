/**
 * Formatting pipeline used by "Format Document", format-on-save and the terminal
 * `format` command:
 *   Prettier (web languages, loaded on demand) → sql-formatter (SQL dialects) →
 *   built-in XML pretty printer → Monaco's own formatter (JSON/CSS/HTML/TS…) →
 *   brace-aware re-indenter (C-like languages) → whitespace cleanup.
 */
import { CDN, importUrl, loadGlobal } from './cdn';
import type { LangDef } from './languages';
import type { Settings } from './types';

type PrettierCfg = { parser: string; plugins: string[] };
const PRETTIER: Record<string, PrettierCfg> = {
  javascript: { parser: 'babel', plugins: ['babel', 'estree'] },
  'apps-script': { parser: 'babel', plugins: ['babel', 'estree'] },
  typescript: { parser: 'typescript', plugins: ['typescript', 'estree'] },
  json: { parser: 'json', plugins: ['babel', 'estree'] },
  jupyter: { parser: 'json', plugins: ['babel', 'estree'] },
  json5: { parser: 'json5', plugins: ['babel', 'estree'] },
  css: { parser: 'css', plugins: ['postcss'] },
  postcss: { parser: 'css', plugins: ['postcss'] },
  scss: { parser: 'scss', plugins: ['postcss'] },
  less: { parser: 'less', plugins: ['postcss'] },
  html: { parser: 'html', plugins: ['html', 'postcss', 'babel', 'estree'] },
  vue: { parser: 'vue', plugins: ['html', 'postcss', 'babel', 'estree', 'typescript'] },
  markdown: { parser: 'markdown', plugins: ['markdown'] },
  mdx: { parser: 'mdx', plugins: ['markdown'] },
  yaml: { parser: 'yaml', plugins: ['yaml'] },
  graphql: { parser: 'graphql', plugins: ['graphql'] },
  handlebars: { parser: 'glimmer', plugins: ['glimmer'] },
};

const SQL_DIALECT: Record<string, string> = {
  sql: 'sql', mysql: 'mysql', pgsql: 'postgresql', plsql: 'plsql', tsql: 'transactsql', redshift: 'redshift', hiveql: 'hive',
  soql: 'sql', cql: 'sql', surrealql: 'sql',
};

const XML_IDS = new Set(['xml', 'svg', 'xaml']);
const MONACO_FORMATTERS = new Set(['json', 'css', 'scss', 'less', 'html', 'typescript', 'javascript']);

export function formatterName(lang: LangDef, s: Pick<Settings, 'prettier'>): string | null {
  if (s.prettier && PRETTIER[lang.id]) return 'Prettier';
  if (SQL_DIALECT[lang.id]) return 'sql-formatter';
  if (XML_IDS.has(lang.id) || lang.monaco === 'xml') return 'XML';
  if (MONACO_FORMATTERS.has(lang.monaco)) return 'Monaco';
  if (isBraceLang(lang)) return 'Reindent';
  return null;
}

function isBraceLang(lang: LangDef) {
  if (lang.grammar) {
    if (lang.grammar.monarch || lang.grammar.mode === 'lisp' || lang.grammar.mode === 'asm' || lang.grammar.indent === 'offside') return false;
    return (lang.grammar.brackets ?? [['{', '}']]).some(([o]) => o === '{') && (lang.grammar.indent === 'brace' || !!lang.grammar.block?.some(([o]) => o === '/*'));
  }
  return ['c', 'cpp', 'java', 'csharp', 'go', 'rust', 'swift', 'kotlin', 'scala', 'dart', 'php', 'objective-c', 'solidity', 'apex', 'hcl', 'protobuf', 'wgsl', 'qsharp', 'typespec', 'bicep', 'cameligo', 'pascaligo', 'aes', 'cypher', 'ecl', 'flow9', 'msdax', 'powerquery', 'systemverilog', 'verilog', 'arduino', 'textproto'].includes(lang.id);
}

let prettierMod: any = null;
const pluginMods = new Map<string, any>();
async function prettierFormat(text: string, cfg: PrettierCfg, s: Settings, filepath: string) {
  prettierMod ??= await importUrl(`${CDN.prettier}/standalone.mjs`);
  const plugins = await Promise.all(cfg.plugins.map(async (n) => {
    if (!pluginMods.has(n)) pluginMods.set(n, await importUrl(`${CDN.prettier}/plugins/${n}.mjs`));
    return pluginMods.get(n);
  }));
  return prettierMod.format(text, {
    parser: cfg.parser,
    plugins,
    filepath,
    printWidth: s.prettierPrintWidth,
    tabWidth: s.tabSize,
    useTabs: !s.insertSpaces,
    semi: s.prettierSemi,
    singleQuote: s.prettierSingleQuote,
    trailingComma: s.prettierTrailingComma,
  }) as Promise<string>;
}

async function sqlFormat(text: string, dialect: string, s: Settings) {
  const lib = await loadGlobal<any>(CDN.sqlFormatter, 'sqlFormatter');
  return lib.format(text, { language: dialect, tabWidth: s.tabSize, useTabs: !s.insertSpaces, keywordCase: s.sqlKeywordCase, linesBetweenQueries: 1 }) as string;
}

/** Small, dependency-free XML/SVG pretty printer. */
export function formatXml(src: string, unit: string): string {
  const tokens = src.match(/<!\[CDATA\[[\s\S]*?\]\]>|<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<![^>]*>|<\/?[^>]+>|[^<]+/g) ?? [];
  const out: string[] = [];
  let depth = 0;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (!t.trim()) continue;
    const pad = unit.repeat(depth);
    if (/^<\//.test(t)) {
      depth = Math.max(0, depth - 1);
      out.push(unit.repeat(depth) + t.trim());
    } else if (/^<[A-Za-z_][^>]*[^/]>$|^<[A-Za-z_]>$/.test(t)) {
      const text = tokens[i + 1];
      const close = tokens[i + 2];
      if (text != null && close != null && !text.startsWith('<') && /^<\//.test(close) && !text.includes('\n') && text.trim().length < 80) {
        out.push(pad + t + text.trim() + close);
        i += 2;
        continue;
      }
      out.push(pad + t);
      depth++;
    } else if (t.startsWith('<')) {
      out.push(pad + t.trim());
    } else {
      for (const ln of t.split('\n')) if (ln.trim()) out.push(pad + ln.trim());
    }
  }
  return out.join('\n') + '\n';
}

/** Re-indent brace-delimited code (strings/comments aware); does not reflow lines. */
export function reindentBraces(text: string, unit: string): string {
  const lines = text.split('\n');
  const out: string[] = [];
  let depth = 0;
  let inBlock = false;
  let inRaw: string | null = null; // multi-line string delimiter (` or """)
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    const trimmed = line.trim();
    if (inRaw) {
      out.push(line);
      if (line.includes(inRaw)) inRaw = null;
      continue;
    }
    if (!trimmed) { out.push(''); continue; }
    if (inBlock) {
      out.push(unit.repeat(depth) + (trimmed.startsWith('*') ? ' ' : '') + trimmed);
      if (trimmed.includes('*/')) inBlock = false;
      continue;
    }
    let lead = 0;
    while (lead < trimmed.length && '})]'.includes(trimmed[lead])) lead++;
    out.push(unit.repeat(Math.max(0, depth - lead)) + trimmed);
    // scan for depth changes
    let q: string | null = null;
    for (let i = 0; i < trimmed.length; i++) {
      const c = trimmed[i];
      if (q) {
        if (c === '\\') { i++; continue; }
        if (c === q) q = null;
        continue;
      }
      if (c === '/' && trimmed[i + 1] === '/') break;
      if (c === '#' && i === 0) break;
      if (c === '/' && trimmed[i + 1] === '*') {
        const end = trimmed.indexOf('*/', i + 2);
        if (end < 0) { inBlock = true; break; }
        i = end + 1;
        continue;
      }
      if (c === '"' && trimmed.startsWith('"""', i)) {
        const end = trimmed.indexOf('"""', i + 3);
        if (end < 0) { inRaw = '"""'; break; }
        i = end + 2;
        continue;
      }
      if (c === '`') {
        const end = trimmed.indexOf('`', i + 1);
        if (end < 0) { inRaw = '`'; break; }
        i = end;
        continue;
      }
      if (c === '"' || (c === "'" && !/\w/.test(trimmed[i - 1] ?? ''))) { q = c; continue; }
      if ('{(['.includes(c)) depth++;
      else if ('})]'.includes(c)) depth = Math.max(0, depth - 1);
    }
  }
  return out.join('\n');
}

export function cleanupWhitespace(text: string, s: Pick<Settings, 'trimTrailingWhitespace' | 'insertFinalNewline' | 'trimFinalNewlines'>, markdown = false): string {
  let t = text;
  if (s.trimTrailingWhitespace) t = t.split('\n').map((l) => (markdown && /\S {2}$/.test(l) ? l : l.replace(/[ \t]+$/, ''))).join('\n');
  if (s.trimFinalNewlines) t = t.replace(/\n+$/, '\n');
  if (s.insertFinalNewline && t.length && !t.endsWith('\n')) t += '\n';
  return t;
}

/**
 * Format `text`. Returns `null` when the caller should fall back to Monaco's own
 * `editor.action.formatDocument`, otherwise the formatted text and formatter name.
 */
export async function formatText(text: string, lang: LangDef, s: Settings, filepath: string): Promise<{ text: string; formatter: string } | null> {
  const unit = s.insertSpaces ? ' '.repeat(s.tabSize) : '\t';
  const cfg = s.prettier ? PRETTIER[lang.id] : undefined;
  if (cfg) {
    try {
      return { text: await prettierFormat(text, cfg, s, filepath), formatter: 'Prettier' };
    } catch (e: any) {
      if (/Failed to (fetch|load)|dynamically imported module|NetworkError|importing a module script/i.test(String(e?.message ?? e))) {
        if (MONACO_FORMATTERS.has(lang.monaco)) return null;
      }
      throw new Error(`Prettier: ${String(e?.message ?? e).split('\n')[0]}`);
    }
  }
  if (SQL_DIALECT[lang.id]) return { text: await sqlFormat(text, SQL_DIALECT[lang.id], s), formatter: 'sql-formatter' };
  if (XML_IDS.has(lang.id) || lang.monaco === 'xml') return { text: formatXml(text, unit), formatter: 'XML' };
  if (MONACO_FORMATTERS.has(lang.monaco)) return null;
  if (isBraceLang(lang)) return { text: reindentBraces(text, unit), formatter: 'Reindent' };
  return { text: cleanupWhitespace(text, { trimTrailingWhitespace: true, insertFinalNewline: false, trimFinalNewlines: false }, lang.monaco === 'markdown'), formatter: 'Whitespace' };
}
