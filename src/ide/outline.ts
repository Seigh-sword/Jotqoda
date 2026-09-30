import { extractSymbols, fromNavTree, type Sym } from './symbols';
import { getLang, getLangById } from './languages';
import type { IDE } from './types';

const tsCache = new Map<string, { version: number; syms: Sym[] }>();

/**
 * Document symbols for a workspace file. TypeScript / JavaScript use the real
 * TypeScript navigation tree (from Monaco's TS worker); everything else uses
 * JotQoda's regex extractor.
 */
export async function documentSymbols(ide: IDE, path: string): Promise<Sym[]> {
  const content = ide.files[path];
  if (content == null) return [];
  const lang = ide.langOverride[path] ? getLangById(ide.langOverride[path]) : getLang(path, content);
  const monaco = ide.monaco;
  if (monaco && (lang.monaco === 'typescript' || lang.monaco === 'javascript')) {
    try {
      const uri = monaco.Uri.parse('file:///' + path);
      let model = monaco.editor.getModel(uri);
      if (!model) model = monaco.editor.createModel(content, lang.monaco, uri);
      const hit = tsCache.get(path);
      const version = model.getVersionId();
      if (hit && hit.version === version) return hit.syms;
      const ts = monaco.languages.typescript;
      const getWorker = lang.monaco === 'typescript' ? ts.getTypeScriptWorker : ts.getJavaScriptWorker;
      const worker = await getWorker();
      const client = await worker(uri);
      const tree = await client.getNavigationTree(uri.toString());
      const syms = tree ? fromNavTree(tree, model) : [];
      tsCache.set(path, { version, syms });
      return syms;
    } catch {
      /* fall back to regex extraction */
    }
  }
  return extractSymbols(content, lang, path);
}
