import { loader } from '@monaco-editor/react';
import { emmetHTML, emmetCSS, emmetJSX } from 'emmet-monaco-es';
import { defineMonacoThemes } from './themes';
import { SNIPPETS, loadCustomSnippets } from './snippets';
import { CUSTOM_LANGS, LANGUAGES, getLang, getLangById, type LangDef } from './languages';
import { toMonarch, toLanguageConfig, completionWords, W } from './lang/grammar';
import { extractSymbols, flattenSymbols, MONACO_SYMBOL_KIND, type Sym } from './symbols';
import type { IDE, Problem } from './types';

export const MONACO_VERSION = '0.52.2';
loader.config({ paths: { vs: `https://cdn.jsdelivr.net/npm/monaco-editor@${MONACO_VERSION}/min/vs` } });

export const ideRef: { current: IDE | null } = { current: null };

/** Monaco languages that ship real language services (symbols, completions, definitions). */
export const LANGUAGE_SERVICE_IDS = new Set(['typescript', 'javascript', 'css', 'scss', 'less', 'json', 'html']);

/** Monaco tokenizer id for a JotQoda language id. */
export const toMonacoLang = (id: string) => getLangById(id).monaco;

/** Resolve the JotQoda language of a Monaco model (honours language overrides). */
export function langOfModel(model: any): LangDef {
  const path = pathOfUri(model.uri);
  const ov = ideRef.current?.langOverride[path];
  if (ov) return getLangById(ov);
  const byPath = getLang(path);
  if (byPath.monaco === model.getLanguageId()) return byPath;
  return LANGUAGES.find((l) => l.id === model.getLanguageId()) ?? byPath;
}
export const pathOfUri = (uri: any) => decodeURIComponent(String(uri.path ?? '').replace(/^\//, ''));

// ---------------------------------------------------------------- CSV / TSV rainbow tokenizer
class CsvState {
  constructor() {}
  clone() { return this; }
  equals() { return true; }
}
function csvTokens(sep: string) {
  return {
    getInitialState: () => new CsvState(),
    tokenize(line: string, state: CsvState) {
      const tokens: { startIndex: number; scopes: string }[] = [];
      let col = 0;
      let i = 0;
      while (i <= line.length) {
        tokens.push({ startIndex: i, scopes: 'csv.c' + (col % 8) });
        if (line[i] === '"') {
          i++;
          while (i < line.length) {
            if (line[i] === '"' && line[i + 1] === '"') i += 2;
            else if (line[i] === '"') { i++; break; }
            else i++;
          }
        }
        const next = line.indexOf(sep, i);
        if (next < 0) break;
        tokens.push({ startIndex: next, scopes: 'delimiter' });
        i = next + 1;
        col++;
      }
      return { tokens, endState: state };
    },
  };
}

// ---------------------------------------------------------------- keyword lists of Monaco's own grammars
const BASIC_LANG_MODULE: Record<string, string> = { coffeescript: 'coffee', proto: 'protobuf', sol: 'solidity', aes: 'sophia', c: 'cpp', verilog: 'systemverilog' };
/** Grammar folders shipped in monaco-editor/min/vs/basic-languages (0.52.2). */
const BASIC_LANG_FOLDERS = new Set('abap apex azcli bat bicep cameligo clojure coffee cpp csharp csp css cypher dart dockerfile ecl elixir flow9 freemarker2 fsharp go graphql handlebars hcl html ini java javascript julia kotlin less lexon liquid lua m3 markdown mdx mips msdax mysql objective-c pascal pascaligo perl pgsql php pla postiats powerquery powershell protobuf pug python qsharp r razor redis redshift restructuredtext ruby rust sb scala scheme scss shell solidity sophia sparql sql st swift systemverilog tcl twig typescript typespec vb wgsl xml yaml'.split(' '));
const builtinWords = new Map<string, string[]>();
const builtinLoads = new Map<string, Promise<string[]>>();
function loadBuiltinWords(monacoId: string): Promise<string[]> {
  const hit = builtinLoads.get(monacoId);
  if (hit) return hit;
  const req = (window as any).require;
  const mod = BASIC_LANG_MODULE[monacoId] ?? monacoId;
  const p = new Promise<string[]>((resolve) => {
    if (typeof req !== 'function' || LANGUAGE_SERVICE_IDS.has(monacoId) || !BASIC_LANG_FOLDERS.has(mod)) return resolve([]);
    try {
      req([`vs/basic-languages/${mod}/${mod}`], (m: any) => {
        const lang = m?.language ?? {};
        const words = new Set<string>();
        for (const [k, v] of Object.entries(lang)) {
          if (!Array.isArray(v) || !/keyword|builtin|type|constant|function|directive|tag|attributes/i.test(k)) continue;
          for (const w of v) if (typeof w === 'string' && /^[A-Za-z_@$#][\w$.:-]*$/.test(w) && w.length > 1) words.add(w);
        }
        resolve([...words]);
      }, () => resolve([]));
    } catch {
      resolve([]);
    }
  }).then((w) => { builtinWords.set(monacoId, w); return w; });
  builtinLoads.set(monacoId, p);
  return p;
}

function documentWords(model: any, current: string): string[] {
  const text: string = model.getValue();
  if (text.length > 400_000) return [];
  const set = new Set<string>();
  const re = /[A-Za-z_$][\w$]{2,}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) && set.size < 1500) if (m[0] !== current) set.add(m[0]);
  return [...set];
}

// ---------------------------------------------------------------- workspace symbol index
export interface WorkspaceSymbol extends Sym { path: string; container: string }
export function workspaceSymbols(files: Record<string, string>, overrides: Record<string, string> = {}, limitFiles = 400): WorkspaceSymbol[] {
  const out: WorkspaceSymbol[] = [];
  const paths = Object.keys(files).slice(0, limitFiles);
  for (const p of paths) {
    const content = files[p];
    if (content.length > 400_000) continue;
    const lang = overrides[p] ? getLangById(overrides[p]) : getLang(p);
    for (const s of flattenSymbols(extractSymbols(content, lang, p))) out.push({ ...s, path: p });
  }
  return out;
}

/** Ensure a Monaco model exists for a workspace file (needed to peek/go to definitions in other files). */
export function ensureModel(monaco: any, path: string) {
  const uri = monaco.Uri.parse('file:///' + path);
  let m = monaco.editor.getModel(uri);
  const content = ideRef.current?.files[path];
  if (!m && content != null) {
    const ov = ideRef.current?.langOverride[path];
    m = monaco.editor.createModel(content, toMonacoLang(ov ?? getLang(path, content).id), uri);
  }
  return m;
}

// ---------------------------------------------------------------- pending reveals (cross-file navigation)
let pendingReveal: { path: string; range: any } | null = null;
export function setPendingReveal(path: string, range: any) {
  pendingReveal = { path, range };
}
export function applyPendingReveal(ed: any) {
  if (!pendingReveal) return;
  const model = ed?.getModel?.();
  if (!model || pathOfUri(model.uri) !== pendingReveal.path) return;
  const r = pendingReveal.range;
  pendingReveal = null;
  ed.setSelection(r);
  ed.revealRangeInCenterIfOutsideViewport?.(r) ?? ed.revealLineInCenter(r.startLineNumber);
  ed.focus();
}

let done = false;
let emmetDisposers: (() => void)[] = [];

/** Enable / disable Emmet abbreviations (HTML, CSS and optionally JSX). */
export function configureEmmet(monaco: any, enabled: boolean, jsx: boolean) {
  emmetDisposers.forEach((d) => { try { d(); } catch { /* ignore */ } });
  emmetDisposers = [];
  if (!monaco || !enabled) return;
  try {
    emmetDisposers.push(emmetHTML(monaco, ['html', 'php', 'handlebars', 'twig', 'razor', 'jinja', 'django', 'nunjucks', 'ejs', 'erb', 'blade', 'eex', 'gotemplate', 'mustache', 'smarty', 'velocity', 'liquid', 'freemarker2', 'xml']));
    emmetDisposers.push(emmetCSS(monaco, ['css', 'scss', 'less', 'sass', 'stylus']));
    if (jsx) emmetDisposers.push(emmetJSX(monaco, ['javascript', 'typescript']));
  } catch (e) {
    console.warn('Emmet failed to initialise', e);
  }
}

export function setupMonaco(monaco: any) {
  if (done) return;
  done = true;
  defineMonacoThemes(monaco);

  // ---- JotQoda grammars (compiled lazily the first time a language is used)
  for (const l of CUSTOM_LANGS) {
    monaco.languages.register({ id: l.id, aliases: [l.name, ...l.aliases] });
    monaco.languages.onLanguage(l.id, () => {
      try {
        if (l.id === 'csv' || l.id === 'tsv') monaco.languages.setTokensProvider(l.id, csvTokens(l.id === 'csv' ? ',' : '\t'));
        else monaco.languages.setMonarchTokensProvider(l.id, toMonarch(l.id, l.grammar!));
        monaco.languages.setLanguageConfiguration(l.id, toLanguageConfig(l.grammar!, l.comment, l.block));
      } catch (e) {
        console.warn(`[JotQoda] grammar for ${l.name} failed to compile`, e);
      }
    });
  }

  const ts = monaco.languages.typescript;
  if (ts) {
    const opts = {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      allowJs: true,
      allowNonTsExtensions: true,
      esModuleInterop: true,
      jsx: ts.JsxEmit.React,
      strict: true,
      lib: ['es2020', 'dom'],
      noEmitOnError: false,
    };
    ts.typescriptDefaults.setCompilerOptions(opts);
    ts.javascriptDefaults.setCompilerOptions({ ...opts, checkJs: false, strict: false });
    ts.typescriptDefaults.setEagerModelSync(true);
    ts.javascriptDefaults.setEagerModelSync(true);
    ts.typescriptDefaults.setDiagnosticsOptions({ diagnosticCodesToIgnore: [1375, 1378, 2792, 7016, 2307] });
    ts.typescriptDefaults.setInlayHintsOptions?.({ includeInlayParameterNameHints: 'literals', includeInlayFunctionLikeReturnTypeHints: false });
  }
  monaco.languages.json?.jsonDefaults?.setDiagnosticsOptions?.({ validate: true, allowComments: true, trailingCommas: 'ignore', enableSchemaRequest: false });

  const allMonacoIds = [...new Set(LANGUAGES.map((l) => l.monaco))];
  const K = monaco.languages.CompletionItemKind;

  // ---- snippets + keywords + document words
  monaco.languages.registerCompletionItemProvider(allMonacoIds, {
    provideCompletionItems: async (model: any, position: any) => {
      const lang = langOfModel(model);
      if (!lang.grammar && !LANGUAGE_SERVICE_IDS.has(lang.monaco) && !builtinWords.has(lang.monaco)) {
        await Promise.race([loadBuiltinWords(lang.monaco), new Promise((r) => setTimeout(r, 800))]);
      }
      const word = model.getWordUntilPosition(position);
      const range = { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn };
      const snippets = [...(SNIPPETS[lang.id] ?? []), ...(lang.monaco !== lang.id ? SNIPPETS[lang.monaco] ?? [] : []), ...loadCustomSnippets().filter((c) => c.lang === lang.id)];
      const suggestions: any[] = snippets.map((s) => ({
        label: s.prefix,
        kind: K.Snippet,
        detail: s.label,
        documentation: { value: '```\n' + s.body.replace(/\$\{\d+:?([^}]*)\}/g, '$1').replace(/\$\d/g, '') + '\n```' },
        insertText: s.body,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range,
        sortText: '0' + s.prefix,
      }));
      if (!LANGUAGE_SERVICE_IDS.has(lang.monaco)) {
        const seen = new Set(suggestions.map((s) => s.label));
        const add = (w: string, kind: number, detail: string, sort: string) => {
          if (seen.has(w) || !w) return;
          seen.add(w);
          suggestions.push({ label: w, kind, detail, insertText: w, range, sortText: sort + w });
        };
        if (lang.grammar) {
          const cw = completionWords(lang.grammar);
          cw.keywords.forEach((w) => add(w, K.Keyword, `${lang.name} keyword`, '1'));
          cw.types.forEach((w) => add(w, K.Class, `${lang.name} type`, '1'));
          cw.builtins.forEach((w) => add(w, K.Function, `${lang.name} builtin`, '1'));
          cw.consts.forEach((w) => add(w, K.Constant, `${lang.name} constant`, '1'));
          if (lang.grammar.regs) W(lang.grammar.regs).forEach((w) => add(w, K.Variable, 'register', '2'));
        } else {
          (builtinWords.get(lang.monaco) ?? []).forEach((w) => add(w, K.Keyword, `${lang.name} keyword`, '1'));
        }
        if (ideRef.current?.settings.wordBasedSuggestions !== 'off') {
          for (const s of flattenSymbols(extractSymbols(model.getValue(), lang, pathOfUri(model.uri)))) add(s.name, K.Reference, s.kind, '0');
          documentWords(model, word.word).forEach((w) => add(w, K.Text, 'document', '3'));
        }
      }
      return { suggestions };
    },
  });

  // ---- document symbols (outline, Ctrl+Shift+O, sticky scroll) for languages without a language service
  const symbolIds = allMonacoIds.filter((id) => !LANGUAGE_SERVICE_IDS.has(id));
  const toDocSymbol = (s: Sym, model: any): any => {
    const endLine = Math.min(Math.max(s.endLine, s.line), model.getLineCount());
    return {
      name: s.name,
      detail: s.detail ?? '',
      kind: MONACO_SYMBOL_KIND[s.kind] ?? 12,
      tags: [],
      range: { startLineNumber: s.line, startColumn: 1, endLineNumber: endLine, endColumn: model.getLineMaxColumn(endLine) },
      selectionRange: { startLineNumber: s.line, startColumn: Math.max(1, s.col), endLineNumber: s.line, endColumn: Math.max(1, s.col) + s.name.length },
      children: s.children.map((c) => toDocSymbol(c, model)),
    };
  };
  monaco.languages.registerDocumentSymbolProvider(symbolIds, {
    displayName: 'JotQoda symbols',
    provideDocumentSymbols: (model: any) => extractSymbols(model.getValue(), langOfModel(model), pathOfUri(model.uri)).map((s) => toDocSymbol(s, model)),
  });

  // ---- go to definition (current file first, then workspace) for languages without a language service
  monaco.languages.registerDefinitionProvider(symbolIds, {
    provideDefinition: (model: any, position: any) => {
      const w = model.getWordAtPosition(position);
      if (!w) return null;
      const name = w.word;
      const here = flattenSymbols(extractSymbols(model.getValue(), langOfModel(model), pathOfUri(model.uri))).filter((s) => s.name === name || s.name.endsWith('.' + name) || s.name.endsWith(':' + name));
      const loc = (uri: any, s: Sym) => ({ uri, range: { startLineNumber: s.line, startColumn: s.col, endLineNumber: s.line, endColumn: s.col + s.name.length } });
      if (here.length) return here.map((s) => loc(model.uri, s));
      const ide = ideRef.current;
      if (!ide) return null;
      const self = pathOfUri(model.uri);
      const lang = langOfModel(model);
      const hits = workspaceSymbols(ide.files, ide.langOverride).filter((s) => s.path !== self && s.name === name && getLang(s.path).monaco === lang.monaco).slice(0, 20);
      return hits.map((s) => {
        const m = ensureModel(monaco, s.path);
        return loc(m?.uri ?? monaco.Uri.parse('file:///' + s.path), s);
      });
    },
  });

  // ---- open other workspace files from go to definition / references / peek
  monaco.editor.registerEditorOpener?.({
    openCodeEditor(_source: any, resource: any, selectionOrPosition: any) {
      const ide = ideRef.current;
      if (!ide || resource.scheme !== 'file') return false;
      const path = pathOfUri(resource);
      if (ide.files[path] == null) return false;
      const sel = selectionOrPosition
        ? 'startLineNumber' in selectionOrPosition
          ? selectionOrPosition
          : { startLineNumber: selectionOrPosition.lineNumber, startColumn: selectionOrPosition.column, endLineNumber: selectionOrPosition.lineNumber, endColumn: selectionOrPosition.column }
        : { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 };
      ide.revealAt(path, sel.startLineNumber, sel.startColumn, sel.endLineNumber, sel.endColumn);
      return true;
    },
  });

  // warm up keyword lists of Monaco's own grammars for languages as soon as they are used
  const warm = (m: any) => { const id = m.getLanguageId?.(); if (id) loadBuiltinWords(id); };
  monaco.editor.getModels().forEach(warm);
  monaco.editor.onDidCreateModel(warm);
  monaco.editor.onDidChangeModelLanguage?.((e: any) => warm(e.model));

  monaco.editor.onDidChangeMarkers(() => {
    const ide = ideRef.current;
    if (!ide) return;
    const sev: Record<number, Problem['severity']> = { 8: 'error', 4: 'warning', 2: 'info', 1: 'info' };
    const problems: Problem[] = monaco.editor
      .getModelMarkers({})
      .filter((m: any) => m.resource.scheme === 'file')
      .map((m: any) => ({ path: pathOfUri(m.resource), line: m.startLineNumber, col: m.startColumn, message: m.message, severity: sev[m.severity] ?? 'info', source: m.source || m.owner }))
      .filter((p: Problem) => ide.files[p.path] != null);
    ide.setProblems(problems);
  });

  const s = ideRef.current?.settings;
  configureEmmet(monaco, s?.emmet ?? true, s?.emmetJsx ?? false);
}
