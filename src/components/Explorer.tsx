import { useMemo, useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown, FilePlus, FolderPlus, ChevronsDownUp, Folder, FolderOpen, X, Upload, FileArchive, RotateCcw, Trash2, GitCompare, ListTree } from 'lucide-react';
import { useIDE, basename, dirname, joinPath, isSpecialTab } from '../ide/types';
import { documentSymbols } from '../ide/outline';
import { symbolPathAt, type Sym } from '../ide/symbols';
import { FileIcon, SymbolIcon } from './FileIcon';

interface Node { name: string; path: string; type: 'file' | 'folder'; children: Node[] }

function buildTree(files: Record<string, string>, folders: string[]): Node {
  const root: Node = { name: '', path: '', type: 'folder', children: [] };
  const index = new Map<string, Node>([['', root]]);
  const ensure = (path: string): Node => {
    const hit = index.get(path);
    if (hit) return hit;
    const parent = ensure(dirname(path));
    const n: Node = { name: basename(path), path, type: 'folder', children: [] };
    parent.children.push(n);
    index.set(path, n);
    return n;
  };
  folders.forEach(ensure);
  Object.keys(files).forEach((p) => ensure(dirname(p)).children.push({ name: basename(p), path: p, type: 'file', children: [] }));
  const sort = (n: Node) => { n.children.sort((a, b) => (a.type !== b.type ? (a.type === 'folder' ? -1 : 1) : a.name.localeCompare(b.name))); n.children.forEach(sort); };
  sort(root);
  return root;
}

export function download(name: string, content: string, mime = 'text/plain') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type: mime }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export const timeAgo = (t: number) => {
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 45) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return new Date(t).toLocaleDateString();
};

export function Explorer() {
  const ide = useIDE();
  const tree = useMemo(() => buildTree(ide.files, ide.folders), [ide.files, ide.folders]);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(['', ...ide.folders.filter((f) => !f.includes('/'))]));
  const [creating, setCreating] = useState<{ parent: string; type: 'file' | 'folder' } | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; node: Node } | null>(null);
  const [selected, setSelected] = useState<string>('');
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ openEditors: false, outline: false, timeline: true });
  const [clip, setClip] = useState<{ path: string; cut: boolean } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const treeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = () => setMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  useEffect(() => {
    if (!ide.activeFile || isSpecialTab(ide.activeFile)) return;
    setSelected(ide.activeFile);
    setExpanded((s) => {
      const n = new Set(s);
      let d = dirname(ide.activeFile!);
      while (d) { n.add(d); d = dirname(d); }
      return n;
    });
  }, [ide.activeFile]);

  // problems per file / folder
  const problemMap = useMemo(() => {
    const m = new Map<string, { e: number; w: number }>();
    for (const p of ide.problems) {
      if (p.severity !== 'error' && p.severity !== 'warning') continue;
      let key = p.path;
      for (;;) {
        const cur = m.get(key) ?? { e: 0, w: 0 };
        if (p.severity === 'error') cur.e++; else cur.w++;
        m.set(key, cur);
        if (!key) break;
        key = dirname(key);
      }
    }
    return m;
  }, [ide.problems]);

  const toggle = (p: string) => setExpanded((s) => { const n = new Set(s); n.has(p) ? n.delete(p) : n.add(p); return n; });
  const targetFolder = () => (!selected ? '' : ide.files[selected] != null ? dirname(selected) : selected);
  const startCreate = (type: 'file' | 'folder', parent = targetFolder()) => {
    setExpanded((s) => new Set(s).add(parent));
    setCreating({ parent, type });
  };

  const commitCreate = (name: string) => {
    if (!creating) return;
    const n = name.trim();
    if (n) {
      const p = joinPath(creating.parent, n);
      if (creating.type === 'file') ide.createFile(p, undefined, true);
      else { ide.createFolder(p); setExpanded((s) => new Set(s).add(p)); }
    }
    setCreating(null);
  };

  const onUpload = async (fl: FileList | null, parent = targetFolder()) => {
    if (!fl) return;
    for (const f of Array.from(fl)) {
      const text = await f.text();
      ide.createFile(joinPath(parent, (f as any).webkitRelativePath || f.name), text, false);
    }
    ide.toast(`Imported ${fl.length} file(s)`, 'success');
  };

  const onDrop = (e: React.DragEvent, folder: string) => {
    e.preventDefault(); e.stopPropagation();
    setDragOver(null);
    const src = e.dataTransfer.getData('text/ide-path');
    if (src) {
      const to = joinPath(folder, basename(src));
      if (to !== src && !to.startsWith(src + '/')) ide.renamePath(src, to);
    } else if (e.dataTransfer.files.length) onUpload(e.dataTransfer.files, folder);
  };

  const paste = (folder: string) => {
    if (!clip) return;
    const src = clip.path;
    const isFile = ide.files[src] != null;
    let to = joinPath(folder, basename(src));
    if (clip.cut) {
      if (to !== src && !to.startsWith(src + '/')) ide.renamePath(src, to);
      setClip(null);
      return;
    }
    const uniq = (p: string) => { if (ide.files[p] == null && !ide.folders.includes(p)) return p; const i = p.lastIndexOf('.'); const hasExt = isFile && i > p.lastIndexOf('/'); let n = 1; let c: string; do { c = hasExt ? `${p.slice(0, i)}-copy${n > 1 ? n : ''}${p.slice(i)}` : `${p}-copy${n > 1 ? n : ''}`; n++; } while (ide.files[c] != null || ide.folders.includes(c)); return c; };
    to = uniq(to);
    if (isFile) ide.createFile(to, ide.files[src], false);
    else Object.keys(ide.files).filter((p) => p.startsWith(src + '/')).forEach((p) => ide.createFile(to + p.slice(src.length), ide.files[p], false));
    ide.toast(`Pasted ${basename(to)}`, 'success');
  };

  // flattened visible nodes for keyboard navigation
  const visible = useMemo(() => {
    const out: Node[] = [];
    const walk = (n: Node) => { for (const c of n.children) { out.push(c); if (c.type === 'folder' && expanded.has(c.path)) walk(c); } };
    walk(tree);
    return out;
  }, [tree, expanded]);

  const onKey = (e: React.KeyboardEvent) => {
    if (renaming || creating) return;
    const i = visible.findIndex((n) => n.path === selected);
    const cur = visible[i];
    const sel = (n?: Node) => { if (n) { setSelected(n.path); setTimeout(() => treeRef.current?.querySelector(`[data-path="${CSS.escape(n.path)}"]`)?.scrollIntoView({ block: 'nearest' }), 0); } };
    const mod = e.ctrlKey || e.metaKey;
    if (e.key === 'ArrowDown') { e.preventDefault(); sel(visible[Math.min(visible.length - 1, i + 1)] ?? visible[0]); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel(visible[Math.max(0, i - 1)] ?? visible[0]); }
    else if (e.key === 'ArrowRight' && cur?.type === 'folder') { e.preventDefault(); if (!expanded.has(cur.path)) toggle(cur.path); else sel(cur.children[0]); }
    else if (e.key === 'ArrowLeft' && cur) { e.preventDefault(); if (cur.type === 'folder' && expanded.has(cur.path)) toggle(cur.path); else sel(visible.find((n) => n.path === dirname(cur.path))); }
    else if (e.key === 'Enter' && cur) { e.preventDefault(); cur.type === 'folder' ? toggle(cur.path) : ide.openFile(cur.path); }
    else if (e.key === ' ' && cur?.type === 'file') { e.preventDefault(); ide.openFile(cur.path); }
    else if (e.key === 'F2' && cur) { e.preventDefault(); setRenaming(cur.path); }
    else if (e.key === 'Delete' && cur) { e.preventDefault(); ide.deletePath(cur.path); }
    else if (mod && e.key.toLowerCase() === 'c' && cur) { e.preventDefault(); setClip({ path: cur.path, cut: false }); ide.toast(`Copied ${cur.name}`); }
    else if (mod && e.key.toLowerCase() === 'x' && cur) { e.preventDefault(); setClip({ path: cur.path, cut: true }); ide.toast(`Cut ${cur.name}`); }
    else if (mod && e.key.toLowerCase() === 'v') { e.preventDefault(); paste(cur ? (cur.type === 'folder' ? cur.path : dirname(cur.path)) : ''); }
    else if (e.key === 'Home') { e.preventDefault(); sel(visible[0]); }
    else if (e.key === 'End') { e.preventDefault(); sel(visible[visible.length - 1]); }
  };

  const renderNode = (n: Node, depth: number): React.ReactNode => {
    const isOpen = expanded.has(n.path);
    const pad = { paddingLeft: 8 + depth * 12 };
    const isActive = selected === n.path;
    const dirty = n.type === 'file' && ide.files[n.path] !== ide.saved[n.path];
    const gitState = n.type === 'file' ? (ide.head[n.path] == null ? 'U' : ide.head[n.path] !== ide.files[n.path] ? 'M' : '') : '';
    const prob = problemMap.get(n.path);
    const isCut = clip?.cut && (clip.path === n.path || n.path.startsWith(clip.path + '/'));
    const isCmp = ide.compareTarget === n.path;
    return (
      <div key={n.path}>
        {renaming === n.path ? (
          <div style={pad} className="py-0.5 pr-2"><InlineInput initial={n.name} onDone={(v) => { setRenaming(null); if (v && v !== n.name) ide.renamePath(n.path, joinPath(dirname(n.path), v)); treeRef.current?.focus(); }} /></div>
        ) : (
          <div
            style={pad}
            data-path={n.path}
            draggable
            onDragStart={(e) => { e.dataTransfer.setData('text/ide-path', n.path); if (n.type === 'file') e.dataTransfer.setData('text/ide-file', n.path); }}
            onDragOver={(e) => { if (n.type === 'folder') { e.preventDefault(); setDragOver(n.path); } }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => n.type === 'folder' && onDrop(e, n.path)}
            onClick={() => { setSelected(n.path); n.type === 'folder' ? toggle(n.path) : ide.openFile(n.path); }}
            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setSelected(n.path); setMenu({ x: e.clientX, y: e.clientY, node: n }); }}
            title={n.path + (prob ? ` — ${prob.e} error(s), ${prob.w} warning(s)` : '')}
            className={`group flex items-center gap-1.5 h-[22px] pr-2 cursor-pointer text-[13px] select-none ${isActive ? 'bg-[var(--accent)]/25 outline outline-1 -outline-offset-1 outline-[var(--accent)]/60' : 'hover:bg-[var(--hover)]'} ${dragOver === n.path ? 'bg-[var(--accent)]/20' : ''} ${isCut ? 'opacity-50' : ''}`}
          >
            {n.type === 'folder' ? (
              <>
                {isOpen ? <ChevronDown size={14} className="shrink-0 opacity-70" /> : <ChevronRight size={14} className="shrink-0 opacity-70" />}
                {isOpen ? <FolderOpen size={15} className="shrink-0 text-[#dcb67a]" /> : <Folder size={15} className="shrink-0 text-[#dcb67a]" />}
              </>
            ) : (
              <><span className="w-[14px] shrink-0" /><FileIcon path={n.path} /></>
            )}
            <span className={`truncate flex-1 ${prob?.e ? 'text-red-400' : prob?.w ? 'text-amber-300' : gitState === 'M' ? 'text-amber-300' : gitState === 'U' ? 'text-emerald-400' : ''} ${isCmp ? 'underline decoration-dotted' : ''}`}>{n.name}</span>
            {dirty && <span className="w-2 h-2 rounded-full bg-[var(--fg)]/70" />}
            {prob && n.type === 'file' && <span className={`text-[10px] font-bold ${prob.e ? 'text-red-400' : 'text-amber-300'}`}>{prob.e || prob.w}</span>}
            {prob && n.type === 'folder' && !isOpen && <span className={`w-1.5 h-1.5 rounded-full ${prob.e ? 'bg-red-400' : 'bg-amber-300'}`} />}
            {gitState && !prob && <span className={`text-[10px] font-bold ${gitState === 'M' ? 'text-amber-300' : 'text-emerald-400'}`}>{gitState}</span>}
          </div>
        )}
        {n.type === 'folder' && isOpen && (
          <div className="relative">
            <div className="absolute top-0 bottom-0 border-l border-[var(--border)] opacity-60" style={{ left: 15 + depth * 12 }} />
            {creating && creating.parent === n.path && (
              <div style={{ paddingLeft: 20 + (depth + 1) * 12 }} className="py-0.5 pr-2"><InlineInput initial="" placeholder={creating.type === 'file' ? 'filename.ext' : 'folder name'} onDone={commitCreate} /></div>
            )}
            {n.children.map((c) => renderNode(c, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const openTabs = Array.from(new Set(ide.groups.flatMap((g) => g.tabs)));
  const tabName = (p: string) => (p.startsWith('diff:') ? 'Δ ' + basename(p.slice(5)) : p.startsWith('cmp:') ? '↔ ' + (ide.compares[p.slice(4)] ? `${ide.compares[p.slice(4)].left.label} ↔ ${ide.compares[p.slice(4)].right.label}` : 'comparison') : p === '__welcome__' ? 'Welcome' : basename(p));

  const fileMenu = (n: Node): ([string, () => void, string?] | ['-'])[] => {
    const p = n.path;
    const folder = dirname(p);
    return [
      ['Open', () => ide.openFile(p)],
      ['Open to the Side', () => ide.openFile(p, ide.groups.length)],
      ['Run File', () => ide.run(p)],
      ['Open Preview', () => ide.setPreviewPath(p)],
      ['-'],
      ide.compareTarget && ide.compareTarget !== p
        ? ['Compare with Selected', () => ide.openCompare({ label: basename(ide.compareTarget!), path: ide.compareTarget!, kind: 'file' }, { label: basename(p), path: p, kind: 'file' })]
        : ['Select for Compare', () => { ide.setCompareTarget(p); ide.toast(`Selected ${n.name} for compare — right-click another file to compare`); }],
      ['Compare with Saved', () => ide.openCompare({ label: n.name + ' (saved)', path: p, kind: 'saved' }, { label: n.name, path: p, kind: 'file' })],
      ['Open Timeline (Local History)', () => { ide.openFile(p); setCollapsed((c) => ({ ...c, timeline: false })); }],
      ['-'],
      ['Cut', () => setClip({ path: p, cut: true }), 'Ctrl+X'],
      ['Copy', () => setClip({ path: p, cut: false }), 'Ctrl+C'],
      ...(clip ? [['Paste', () => paste(folder), 'Ctrl+V'] as [string, () => void, string]] : []),
      ['Rename…', () => setRenaming(p), 'F2'],
      ['Duplicate', () => { const i = p.lastIndexOf('.'); const np = i > p.lastIndexOf('/') ? p.slice(0, i) + '-copy' + p.slice(i) : p + '-copy'; ide.createFile(np, ide.files[p], true); }],
      ['Download', () => download(n.name, ide.files[p])],
      ['-'],
      ['Copy Path', () => navigator.clipboard.writeText(p)],
      ['Copy Relative Path', () => navigator.clipboard.writeText('./' + p)],
      ['Copy Content', () => navigator.clipboard.writeText(ide.files[p])],
      ['Open in Integrated Terminal', () => ide.requestTerminal({ cwd: folder })],
      ['Find in Folder…', () => ide.openSearch({ include: folder ? folder + '/**' : '' })],
      ['-'],
      ['Delete', () => ide.deletePath(p), 'Del'],
    ];
  };
  const folderMenu = (n: Node): ([string, () => void, string?] | ['-'])[] => [
    ['New File…', () => startCreate('file', n.path)],
    ['New Folder…', () => startCreate('folder', n.path)],
    ['Upload Files…', () => { setSelected(n.path); fileInput.current?.click(); }],
    ...(clip ? [['Paste', () => paste(n.path), 'Ctrl+V'] as [string, () => void, string]] : []),
    ['-'],
    ['Find in Folder…', () => ide.openSearch({ include: n.path ? n.path + '/**' : '' })],
    ['Open in Integrated Terminal', () => ide.requestTerminal({ cwd: n.path })],
    ['Download as ZIP', () => ide.downloadZip(n.path || undefined)],
    ...(n.path
      ? ([['-'], ['Cut', () => setClip({ path: n.path, cut: true }), 'Ctrl+X'], ['Copy', () => setClip({ path: n.path, cut: false }), 'Ctrl+C'], ['Rename…', () => setRenaming(n.path), 'F2'], ['Copy Path', () => navigator.clipboard.writeText(n.path)], ['Delete', () => ide.deletePath(n.path), 'Del']] as ([string, () => void, string?] | ['-'])[])
      : ([['-'], ['Open Folder… (replace workspace)', () => ide.importFolder()], ['Import ZIP Archive…', () => ide.importZip()], ['Collapse All', () => setExpanded(new Set(['']))]] as ([string, () => void, string?] | ['-'])[])),
  ];

  return (
    <div className="flex flex-col h-full" onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDrop(e, '')}>
      <input ref={fileInput} type="file" multiple hidden onChange={(e) => { onUpload(e.target.files); e.target.value = ''; }} />
      <div className="border-b border-[var(--border)] shrink-0">
        <button onClick={() => setCollapsed((c) => ({ ...c, openEditors: !c.openEditors }))} className="w-full flex items-center gap-1 px-2 h-6 text-[11px] font-bold uppercase tracking-wide hover:bg-[var(--hover)]">
          {collapsed.openEditors ? <ChevronRight size={14} /> : <ChevronDown size={14} />} Open Editors <span className="ml-auto text-[var(--muted)] font-normal">{openTabs.length}</span>
        </button>
        {!collapsed.openEditors && (
          <div className="max-h-40 overflow-auto pb-1">
            {openTabs.map((p) => (
              <div key={p} onClick={() => ide.openFile(p)} className={`group flex items-center gap-1.5 h-[22px] pl-5 pr-2 text-[13px] cursor-pointer hover:bg-[var(--hover)] ${ide.activeFile === p ? 'text-[var(--fg)]' : 'text-[var(--muted)]'}`}>
                <button onClick={(e) => { e.stopPropagation(); ide.closeTab(p); }} className="opacity-0 group-hover:opacity-100"><X size={12} /></button>
                {!isSpecialTab(p) && <FileIcon path={p} />}
                <span className="truncate">{tabName(p)}</span>
                {ide.files[p] != null && ide.files[p] !== ide.saved[p] && <span className="w-1.5 h-1.5 rounded-full bg-[var(--fg)]/70 shrink-0" />}
                <span className="text-[10px] opacity-50 truncate">{isSpecialTab(p) ? '' : dirname(p)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-0.5 px-2 h-7 text-[11px] font-bold uppercase tracking-wide shrink-0">
        <span className="flex-1">Workspace</span>
        <IconBtn title="New File" onClick={() => startCreate('file')}><FilePlus size={15} /></IconBtn>
        <IconBtn title="New Folder" onClick={() => startCreate('folder')}><FolderPlus size={15} /></IconBtn>
        <IconBtn title="Upload Files" onClick={() => fileInput.current?.click()}><Upload size={15} /></IconBtn>
        <IconBtn title="Download Workspace as ZIP" onClick={() => ide.downloadZip()}><FileArchive size={15} /></IconBtn>
        <IconBtn title="Collapse All" onClick={() => setExpanded(new Set(['']))}><ChevronsDownUp size={15} /></IconBtn>
      </div>
      <div
        ref={treeRef}
        tabIndex={0}
        onKeyDown={onKey}
        className="flex-1 overflow-auto pb-4 outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[var(--accent)]/50 min-h-[80px]"
        onClick={(e) => { if (e.target === e.currentTarget) setSelected(''); }}
        onContextMenu={(e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, node: tree }); }}
      >
        {creating && creating.parent === '' && <div className="pl-5 pr-2 py-0.5"><InlineInput initial="" placeholder={creating.type === 'file' ? 'filename.ext' : 'folder name'} onDone={commitCreate} /></div>}
        {tree.children.map((c) => renderNode(c, 0))}
        {Object.keys(ide.files).length === 0 && (
          <div className="p-4 text-xs text-[var(--muted)] space-y-2">
            <p>The workspace is empty.</p>
            <button onClick={() => startCreate('file')} className="w-full py-1.5 rounded bg-[var(--accent)] text-white">New File</button>
            <button onClick={() => ide.openPalette('template')} className="w-full py-1.5 rounded border border-[var(--border)]">Load Template</button>
            <button onClick={() => ide.importFolder()} className="w-full py-1.5 rounded border border-[var(--border)]">Open Folder…</button>
          </div>
        )}
      </div>
      <Section id="outline" collapsed={!!collapsed.outline} onToggle={() => setCollapsed((c) => ({ ...c, outline: !c.outline }))} title="Outline" grow actions={<IconBtn title="Go to Symbol in Editor (@)" onClick={() => ide.openPalette('symbols')}><ListTree size={13} /></IconBtn>}>
        <OutlineList />
      </Section>
      <Section id="timeline" collapsed={!!collapsed.timeline} onToggle={() => setCollapsed((c) => ({ ...c, timeline: !c.timeline }))} title="Timeline" count={ide.activeFile && !isSpecialTab(ide.activeFile) ? ide.historyOf(ide.activeFile).length : undefined}>
        <TimelineList />
      </Section>
      {menu && (
        <div className="fixed z-50 min-w-[230px] py-1 rounded-md shadow-2xl border border-[var(--border)] bg-[var(--side)] text-[13px] max-h-[85vh] overflow-auto" style={{ left: Math.min(menu.x, window.innerWidth - 250), top: Math.max(4, Math.min(menu.y, window.innerHeight - 520)) }}>
          {(menu.node.type === 'folder' ? folderMenu(menu.node) : fileMenu(menu.node)).map((item, i) =>
            item[0] === '-' ? <div key={i} className="my-1 border-t border-[var(--border)]" /> : (
              <button key={i} onClick={() => { (item as [string, () => void])[1](); setMenu(null); }} className={`flex w-full text-left px-4 py-1 hover:bg-[var(--accent)] hover:text-white ${item[0] === 'Delete' ? 'text-red-400' : ''}`}>
                <span className="flex-1">{item[0]}</span>{item[2] && <span className="text-[11px] opacity-60 ml-4">{item[2]}</span>}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, count, children, actions, grow, collapsed, onToggle }: { id: string; title: string; count?: number | string; children: React.ReactNode; actions?: React.ReactNode; grow?: boolean; collapsed: boolean; onToggle: () => void }) {
  return (
    <div className={`border-t border-[var(--border)] flex flex-col min-h-0 ${collapsed ? '' : grow ? 'max-h-[40%]' : 'max-h-[30%]'}`}>
      <div className="w-full flex items-center gap-1 px-2 h-6 text-[11px] font-bold uppercase tracking-wide hover:bg-[var(--hover)] cursor-pointer shrink-0" onClick={onToggle}>
        {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />} {title}
        <span className="ml-auto flex items-center gap-0.5 font-normal normal-case" onClick={(e) => e.stopPropagation()}>{actions}{count != null && <span className="text-[var(--muted)] ml-1">{count}</span>}</span>
      </div>
      {!collapsed && <div className="overflow-auto min-h-0 pb-1">{children}</div>}
    </div>
  );
}

function OutlineList() {
  const ide = useIDE();
  const f = ide.activeFile && !isSpecialTab(ide.activeFile) && ide.files[ide.activeFile] != null ? ide.activeFile : null;
  const [syms, setSyms] = useState<Sym[]>([]);
  const [filter, setFilter] = useState('');
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const content = f ? ide.files[f] : '';
  useEffect(() => { setSyms([]); }, [f]);
  useEffect(() => {
    if (!f) { setSyms([]); return; }
    let live = true;
    const t = setTimeout(() => documentSymbols(ide, f).then((s) => live && setSyms(s)).catch(() => live && setSyms([])), 250);
    return () => { live = false; clearTimeout(t); };
  }, [f, content, ide.monaco]);
  if (!f) return <div className="px-4 py-2 text-[12px] text-[var(--muted)]">Open a file to see its outline.</div>;
  if (!syms.length) return <div className="px-4 py-2 text-[12px] text-[var(--muted)]">No symbols found in {basename(f)}.</div>;
  const here = new Set(symbolPathAt(syms, ide.cursor.line));
  const q = filter.toLowerCase();
  const matches = (s: Sym): boolean => !q || s.name.toLowerCase().includes(q) || s.children.some(matches);
  const render = (list: Sym[], depth: number, prefix: string): React.ReactNode => list.filter(matches).map((s, i) => {
    const key = `${prefix}/${s.name}:${i}`;
    const open = !closed.has(key) || !!q;
    return (
      <div key={key}>
        <div
          onClick={() => ide.revealAt(f, s.line, s.col, s.line, s.col + s.name.length)}
          className={`flex items-center gap-1 h-[22px] pr-2 cursor-pointer text-[13px] hover:bg-[var(--hover)] ${here.has(s) ? 'text-[var(--fg)] bg-[var(--accent)]/10' : 'text-[var(--muted)]'}`}
          style={{ paddingLeft: 8 + depth * 12 }}
          title={`${s.kind} · line ${s.line}${s.detail ? ' · ' + s.detail : ''}`}
        >
          {s.children.length ? (
            <button onClick={(e) => { e.stopPropagation(); setClosed((c) => { const n = new Set(c); n.has(key) ? n.delete(key) : n.add(key); return n; }); }} className="shrink-0">
              {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>
          ) : <span className="w-[13px] shrink-0" />}
          <SymbolIcon kind={s.kind} />
          <span className="truncate">{s.name}</span>
          <span className="ml-auto text-[10px] opacity-50">{s.line}</span>
        </div>
        {s.children.length > 0 && open && render(s.children, depth + 1, key)}
      </div>
    );
  });
  return (
    <div>
      <div className="px-2 pb-1"><input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter symbols" className="w-full h-6 px-2 text-[12px] rounded-sm bg-[var(--input)] border border-[var(--border)] outline-none focus:border-[var(--accent)]" /></div>
      {render(syms, 0, '')}
    </div>
  );
}

function TimelineList() {
  const ide = useIDE();
  const f = ide.activeFile && !isSpecialTab(ide.activeFile) ? ide.activeFile : null;
  void ide.historyVersion;
  if (!ide.settings.localHistory) return <div className="px-4 py-2 text-[12px] text-[var(--muted)]">Local History is disabled in Settings → Files.</div>;
  if (!f) return <div className="px-4 py-2 text-[12px] text-[var(--muted)]">Open a file to see its local history.</div>;
  const entries = ide.historyOf(f);
  if (!entries.length) return <div className="px-4 py-2 text-[12px] text-[var(--muted)]">No snapshots yet — they are taken when you save, every minute while auto-saving, and before destructive changes.</div>;
  return (
    <div>
      {entries.map((e) => (
        <div key={e.id} className="group flex items-center gap-1.5 h-[22px] pl-4 pr-2 text-[12px] cursor-pointer hover:bg-[var(--hover)]" title={new Date(e.time).toLocaleString()}
          onClick={() => ide.openCompare({ label: `${basename(f)} (${timeAgo(e.time)})`, path: f, kind: 'history', content: e.content }, { label: basename(f), path: f, kind: 'file' })}>
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" />
          <span className="truncate">{e.source}</span>
          <span className="ml-auto text-[var(--muted)] whitespace-nowrap">{timeAgo(e.time)}</span>
          <span className="hidden group-hover:flex gap-0.5">
            <IconBtn title="Compare with current" onClick={() => ide.openCompare({ label: `${basename(f)} (${timeAgo(e.time)})`, path: f, kind: 'history', content: e.content }, { label: basename(f), path: f, kind: 'file' })}><GitCompare size={12} /></IconBtn>
            <IconBtn title="Restore this version" onClick={() => ide.restoreSnapshot(f, e.id)}><RotateCcw size={12} /></IconBtn>
            <IconBtn title="Delete snapshot" onClick={() => ide.deleteSnapshot(f, e.id)}><Trash2 size={12} /></IconBtn>
          </span>
        </div>
      ))}
    </div>
  );
}

export function IconBtn({ children, title, onClick, active }: { children: React.ReactNode; title: string; onClick: () => void; active?: boolean }) {
  return (
    <button title={title} onClick={(e) => { e.stopPropagation(); onClick(); }} className={`p-1 rounded hover:bg-[var(--hover)] ${active ? 'bg-[var(--accent)]/30 text-[var(--fg)]' : 'text-[var(--muted)] hover:text-[var(--fg)]'}`}>
      {children}
    </button>
  );
}

function InlineInput({ initial, placeholder, onDone }: { initial: string; placeholder?: string; onDone: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const done = useRef(false);
  useEffect(() => {
    const el = ref.current!;
    el.focus();
    const dot = initial.lastIndexOf('.');
    el.setSelectionRange(0, dot > 0 ? dot : initial.length);
  }, [initial]);
  const finish = (v: string) => { if (done.current) return; done.current = true; onDone(v); };
  return (
    <input
      ref={ref}
      defaultValue={initial}
      placeholder={placeholder}
      onKeyDown={(e) => { if (e.key === 'Enter') finish(e.currentTarget.value); if (e.key === 'Escape') finish(''); e.stopPropagation(); }}
      onBlur={(e) => finish(e.currentTarget.value)}
      className="w-full h-[20px] px-1 text-[13px] bg-[var(--input)] border border-[var(--accent)] outline-none"
    />
  );
}
