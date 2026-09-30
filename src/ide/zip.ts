/** Workspace ZIP export/import and local folder import (JSZip is loaded on demand from the CDN). */
import { CDN, loadGlobal } from './cdn';

const SKIP_DIRS = /(^|\/)(node_modules|\.git|\.hg|\.svn|dist|build|out|target|\.next|\.nuxt|\.cache|\.venv|venv|__pycache__|\.idea|\.DS_Store)(\/|$)/;
const MAX_FILE = 2_000_000;
const MAX_FILES = 3000;

function isBinary(bytes: Uint8Array) {
  const n = Math.min(bytes.length, 8000);
  for (let i = 0; i < n; i++) if (bytes[i] === 0) return true;
  return false;
}

export function triggerDownload(name: string, data: Blob | string, type = 'text/plain') {
  const blob = typeof data === 'string' ? new Blob([data], { type }) : data;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export async function downloadWorkspaceZip(files: Record<string, string>, folders: string[], name: string, sub?: string) {
  const JSZip = await loadGlobal<any>(CDN.jszip, 'JSZip');
  const zip = new JSZip();
  const inScope = (p: string) => !sub || p === sub || p.startsWith(sub + '/');
  const rel = (p: string) => (sub ? p.slice(sub.length + 1) : p);
  for (const f of folders) if (inScope(f) && rel(f)) zip.folder(rel(f));
  let count = 0;
  for (const [p, c] of Object.entries(files)) {
    if (!inScope(p)) continue;
    zip.file(rel(p) || p, c);
    count++;
  }
  const blob: Blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  triggerDownload(name.endsWith('.zip') ? name : name + '.zip', blob);
  return count;
}

function stripCommonRoot(paths: string[]): string {
  if (!paths.length) return '';
  const first = paths[0].split('/')[0];
  if (!paths.every((p) => p.startsWith(first + '/'))) return '';
  return first + '/';
}

export interface ImportResult { files: Record<string, string>; folders: string[]; skipped: number }

export async function readZip(file: File | Blob): Promise<ImportResult> {
  const JSZip = await loadGlobal<any>(CDN.jszip, 'JSZip');
  const zip = await JSZip.loadAsync(file);
  const entries: any[] = Object.values(zip.files);
  const names = entries.filter((e) => !e.dir).map((e) => e.name as string);
  const root = stripCommonRoot(names);
  const files: Record<string, string> = {};
  const folders = new Set<string>();
  let skipped = 0;
  for (const e of entries) {
    const name = (e.name as string).slice(root.length).replace(/\/$/, '');
    if (!name || SKIP_DIRS.test(name) || name.startsWith('__MACOSX')) { if (!e.dir) skipped++; continue; }
    if (e.dir) { folders.add(name); continue; }
    if (Object.keys(files).length >= MAX_FILES) { skipped++; continue; }
    const bytes: Uint8Array = await e.async('uint8array');
    if (bytes.length > MAX_FILE || isBinary(bytes)) { skipped++; continue; }
    files[name] = new TextDecoder().decode(bytes);
    const parts = name.split('/');
    for (let i = 1; i < parts.length; i++) folders.add(parts.slice(0, i).join('/'));
  }
  return { files, folders: [...folders], skipped };
}

export async function readFolder(list: FileList): Promise<ImportResult> {
  const all = Array.from(list);
  const rels = all.map((f) => (f as any).webkitRelativePath as string || f.name);
  const root = stripCommonRoot(rels);
  const files: Record<string, string> = {};
  const folders = new Set<string>();
  let skipped = 0;
  for (let i = 0; i < all.length; i++) {
    const name = rels[i].slice(root.length);
    if (!name || SKIP_DIRS.test(name)) { skipped++; continue; }
    if (Object.keys(files).length >= MAX_FILES || all[i].size > MAX_FILE) { skipped++; continue; }
    const bytes = new Uint8Array(await all[i].arrayBuffer());
    if (isBinary(bytes)) { skipped++; continue; }
    files[name] = new TextDecoder().decode(bytes);
    const parts = name.split('/');
    for (let j = 1; j < parts.length; j++) folders.add(parts.slice(0, j).join('/'));
  }
  return { files, folders: [...folders], skipped };
}
