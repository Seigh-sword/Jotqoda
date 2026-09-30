import { loader } from '@monaco-editor/react';
import { defineMonacoThemes } from './themes';
import { SNIPPETS, loadCustomSnippets } from '../components/SidebarViews';
import type { IDE, Problem } from './types';

loader.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs' } });

export const ideRef: { current: IDE | null } = { current: null };

let done = false;
export function setupMonaco(monaco: any) {
  if (done) return;
  done = true;
  defineMonacoThemes(monaco);

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

  const langs = new Set([...Object.keys(SNIPPETS), 'javascript', 'typescript', 'python', 'html', 'css', 'sql']);
  langs.forEach((lang) => {
    monaco.languages.registerCompletionItemProvider(lang, {
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position);
        const range = { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn };
        const list = [...(SNIPPETS[lang] ?? []), ...loadCustomSnippets().filter((c) => c.lang === lang)];
        return {
          suggestions: list.map((s) => ({
            label: s.prefix,
            kind: monaco.languages.CompletionItemKind.Snippet,
            detail: s.label,
            documentation: { value: '```\n' + s.body.replace(/\$\{\d+:?([^}]*)\}/g, '$1').replace(/\$\d/g, '') + '\n```' },
            insertText: s.body,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            sortText: '0' + s.prefix,
          })),
        };
      },
    });
  });

  monaco.editor.onDidChangeMarkers(() => {
    const ide = ideRef.current;
    if (!ide) return;
    const sev: Record<number, Problem['severity']> = { 8: 'error', 4: 'warning', 2: 'info', 1: 'info' };
    const problems: Problem[] = monaco.editor
      .getModelMarkers({})
      .filter((m: any) => m.resource.scheme === 'file')
      .map((m: any) => ({ path: m.resource.path.slice(1), line: m.startLineNumber, col: m.startColumn, message: m.message, severity: sev[m.severity] ?? 'info', source: m.source || m.owner }))
      .filter((p: Problem) => ide.files[p.path] != null);
    ide.setProblems(problems);
  });
}

export const toMonacoLang = (id: string) => (id === 'c' ? 'cpp' : id);
