import { useMemo, useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown, FilePlus, FolderPlus, RefreshCw, ChevronsDownUp, Folder, FolderOpen, X, Upload, Download } from 'lucide-react';
import { useIDE, basename, dirname, joinPath, isSpecialTab } from '../ide/types';
import { FileIcon } from './FileIcon';

interface Node { name: string; path: string; type: 'file' | 'folder'; children: Node[] }

function buildTree(files: Record<string, string>, folders: string[]): Node {
  const root: Node = { name: '', path: '', type: 'folder', children: [] };
  const ensure = (path: string): Node => {
    if (!path) return root;
    const parent = ensure(dirname(path));
    let n = parent.children.find((c) => c.name === basename(path) && c.type === 'folder');
    if (!n) { n = { name: basename(path), path, type: 'folder', children: [] }; parent.children.push(n); }
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

export function Explorer() {
  const ide = useIDE();
  const tree = useMemo(() => buildTree(ide.files, ide.folders), [ide.files, ide.folders]);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(['', ...ide.folders.filter((f) => !f.includes('/'))]));
  const [creating, setCreating] = useState<{ parent: string; type: 'file' | 'folder' } | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; node: Node } | null>(null);
  const [selected, setSelected] = useState<string>('');
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [openEditorsCollapsed, setOEC] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

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

  const toggle = (p: string) => setExpanded((s) => { const n = new Set(s); n.has(p) ? n.delete(p) : n.add(p); return n; });
  const targetFolder = () => {
    if (!selected) return '';
    return ide.files[selected] != null ? dirname(selected) : selected;
  };
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

  const renderNode = (n: Node, depth: number): React.ReactNode => {
    const isOpen = expanded.has(n.path);
    const pad = { paddingLeft: 8 + depth * 12 };
    const isActive = selected === n.path;
    const dirty = n.type === 'file' && ide.files[n.path] !== ide.saved[n.path];
    const gitState = n.type === 'file' ? (ide.head[n.path] == null ? 'U' : ide.head[n.path] !== ide.files[n.path] ? 'M' : '') : '';
    return (
      <div key={n.path}>
        {renaming === n.path ? (
          <div style={pad} className="py-0.5 pr-2"><InlineInput initial={n.name} onDone={(v) => { setRenaming(null); if (v && v !== n.name) ide.renamePath(n.path, joinPath(dirname(n.path), v)); }} /></div>
        ) : (
          <div
            style={pad}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('text/ide-path', n.path)}
            onDragOver={(e) => { if (n.type === 'folder') { e.preventDefault(); setDragOver(n.path); } }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => n.type === 'folder' && onDrop(e, n.path)}
            onClick={() => { setSelected(n.path); n.type === 'folder' ? toggle(n.path) : ide.openFile(n.path); }}
            onDoubleClick={() => n.type === 'file' && ide.openFile(n.path)}
            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setSelected(n.path); setMenu({ x: e.clientX, y: e.clientY, node: n }); }}
            className={`group flex items-center gap-1.5 h-[22px] pr-2 cursor-pointer text-[13px] select-none ${isActive ? 'bg-[var(--accent)]/25 outline outline-1 -outline-offset-1 outline-[var(--accent)]/60' : 'hover:bg-[var(--hover)]'} ${dragOver === n.path ? 'bg-[var(--accent)]/20' : ''}`}
          >
            {n.type === 'folder' ? (
              <>
                {isOpen ? <ChevronDown size={14} className="shrink-0 opacity-70" /> : <ChevronRight size={14} className="shrink-0 opacity-70" />}
                {isOpen ? <FolderOpen size={15} className="shrink-0 text-[#dcb67a]" /> : <Folder size={15} className="shrink-0 text-[#dcb67a]" />}
              </>
            ) : (
              <><span className="w-[14px] shrink-0" /><FileIcon path={n.path} /></>
            )}
            <span className={`truncate flex-1 ${gitState === 'M' ? 'text-amber-300' : gitState === 'U' ? 'text-emerald-400' : ''}`}>{n.name}</span>
            {dirty && <span className="w-2 h-2 rounded-full bg-[var(--fg)]/70" />}
            {gitState && <span className={`text-[10px] font-bold ${gitState === 'M' ? 'text-amber-300' : 'text-emerald-400'}`}>{gitState}</span>}
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

  return (
    <div className="flex flex-col h-full" onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDrop(e, '')}>
      <input ref={fileInput} type="file" multiple hidden onChange={(e) => { onUpload(e.target.files); e.target.value = ''; }} />
      <div className="border-b border-[var(--border)]">
        <button onClick={() => setOEC(!openEditorsCollapsed)} className="w-full flex items-center gap-1 px-2 h-6 text-[11px] font-bold uppercase tracking-wide hover:bg-[var(--hover)]">
          {openEditorsCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />} Open Editors <span className="ml-auto text-[var(--muted)] font-normal">{openTabs.length}</span>
        </button>
        {!openEditorsCollapsed && (
          <div className="max-h-40 overflow-auto pb-1">
            {openTabs.map((p) => (
              <div key={p} onClick={() => ide.openFile(p)} className={`group flex items-center gap-1.5 h-[22px] pl-5 pr-2 text-[13px] cursor-pointer hover:bg-[var(--hover)] ${ide.activeFile === p ? 'text-[var(--fg)]' : 'text-[var(--muted)]'}`}>
                <button onClick={(e) => { e.stopPropagation(); ide.closeTab(p); }} className="opacity-0 group-hover:opacity-100"><X size={12} /></button>
                {!isSpecialTab(p) && <FileIcon path={p} />}
                <span className="truncate">{isSpecialTab(p) ? p.replace(/^diff:/, 'Δ ').replace(/^__(\w+)__$/, '$1') : basename(p)}</span>
                <span className="text-[10px] opacity-50 truncate">{dirname(p)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-0.5 px-2 h-7 text-[11px] font-bold uppercase tracking-wide">
        <span className="flex-1">Workspace</span>
        <IconBtn title="New File" onClick={() => startCreate('file')}><FilePlus size={15} /></IconBtn>
        <IconBtn title="New Folder" onClick={() => startCreate('folder')}><FolderPlus size={15} /></IconBtn>
        <IconBtn title="Upload Files" onClick={() => fileInput.current?.click()}><Upload size={15} /></IconBtn>
        <IconBtn title="Export Workspace" onClick={() => ide.execCommand('workspace.export')}><Download size={15} /></IconBtn>
        <IconBtn title="Refresh" onClick={() => ide.toast('Explorer refreshed')}><RefreshCw size={14} /></IconBtn>
        <IconBtn title="Collapse All" onClick={() => setExpanded(new Set(['']))}><ChevronsDownUp size={15} /></IconBtn>
      </div>
      <div className="flex-1 overflow-auto pb-8" onClick={(e) => { if (e.target === e.currentTarget) setSelected(''); }} onContextMenu={(e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, node: tree }); }}>
        {creating && creating.parent === '' && <div className="pl-5 pr-2 py-0.5"><InlineInput initial="" placeholder={creating.type === 'file' ? 'filename.ext' : 'folder name'} onDone={commitCreate} /></div>}
        {tree.children.map((c) => renderNode(c, 0))}
        {Object.keys(ide.files).length === 0 && (
          <div className="p-4 text-xs text-[var(--muted)] space-y-2">
            <p>The workspace is empty.</p>
            <button onClick={() => startCreate('file')} className="w-full py-1.5 rounded bg-[var(--accent)] text-white">New File</button>
            <button onClick={() => ide.openPalette('template')} className="w-full py-1.5 rounded border border-[var(--border)]">Load Template</button>
          </div>
        )}
      </div>
      {menu && (
        <div className="fixed z-50 min-w-[200px] py-1 rounded-md shadow-2xl border border-[var(--border)] bg-[var(--side)] text-[13px]" style={{ left: Math.min(menu.x, window.innerWidth - 220), top: Math.min(menu.y, window.innerHeight - 320) }}>
          {(menu.node.type === 'folder'
            ? [
                ['New File…', () => startCreate('file', menu.node.path)],
                ['New Folder…', () => startCreate('folder', menu.node.path)],
                ['Upload Files…', () => { setSelected(menu.node.path); fileInput.current?.click(); }],
                ...(menu.node.path ? [['-'], ['Rename…', () => setRenaming(menu.node.path)], ['Copy Path', () => navigator.clipboard.writeText(menu.node.path)], ['Delete', () => ide.deletePath(menu.node.path)]] : []),
              ]
            : [
                ['Open', () => ide.openFile(menu.node.path)],
                ['Open to the Side', () => ide.openFile(menu.node.path, 1)],
                ['Run File', () => ide.run(menu.node.path)],
                ['Open Preview', () => ide.setPreviewPath(menu.node.path)],
                ['-'],
                ['Rename…', () => setRenaming(menu.node.path)],
                ['Duplicate', () => { const p = menu.node.path; const i = p.lastIndexOf('.'); const np = i > p.lastIndexOf('/') ? p.slice(0, i) + '-copy' + p.slice(i) : p + '-copy'; ide.createFile(np, ide.files[p], true); }],
                ['Download', () => download(menu.node.name, ide.files[menu.node.path])],
                ['Copy Path', () => navigator.clipboard.writeText(menu.node.path)],
                ['Copy Content', () => navigator.clipboard.writeText(ide.files[menu.node.path])],
                ['-'],
                ['Delete', () => ide.deletePath(menu.node.path)],
              ]
          ).map((item: any, i: number) =>
            item[0] === '-' ? <div key={i} className="my-1 border-t border-[var(--border)]" /> : (
              <button key={i} onClick={() => { item[1](); setMenu(null); }} className={`block w-full text-left px-4 py-1 hover:bg-[var(--accent)] hover:text-white ${item[0] === 'Delete' ? 'text-red-400' : ''}`}>{item[0]}</button>
            )
          )}
        </div>
      )}
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
