import { useMemo, useState } from 'react';
import { Check, Undo2, GitBranch, GitCommit, ChevronDown, ChevronRight, FileDiff, RotateCcw, CheckCircle2 } from 'lucide-react';
import { useIDE, basename, dirname } from '../ide/types';
import { FileIcon } from './FileIcon';
import { IconBtn } from './Explorer';

export function useChanges() {
  const { files, head } = useIDE();
  return useMemo(() => {
    const out: { path: string; status: 'M' | 'A' | 'D' }[] = [];
    for (const p of Object.keys(files)) {
      if (head[p] == null) out.push({ path: p, status: 'A' });
      else if (head[p] !== files[p]) out.push({ path: p, status: 'M' });
    }
    for (const p of Object.keys(head)) if (files[p] == null) out.push({ path: p, status: 'D' });
    return out.sort((a, b) => a.path.localeCompare(b.path));
  }, [files, head]);
}

export function GitView() {
  const ide = useIDE();
  const changes = useChanges();
  const [msg, setMsg] = useState('');
  const [showHist, setShowHist] = useState(true);
  const color = { M: 'text-amber-300', A: 'text-emerald-400', D: 'text-red-400' };

  const doCommit = () => {
    if (!changes.length) return ide.toast('Nothing to commit', 'warn');
    const m = msg.trim() || `Update ${changes.length} file(s)`;
    ide.commit(m);
    setMsg('');
  };

  return (
    <div className="flex flex-col h-full text-[13px]">
      <div className="p-2 space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]"><GitBranch size={13} /> main <span className="ml-auto">{ide.commits.length} commits</span></div>
        <textarea
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) doCommit(); }}
          placeholder="Message (Ctrl+Enter to commit)"
          rows={2}
          className="w-full px-2 py-1 bg-[var(--input)] border border-[var(--border)] focus:border-[var(--accent)] outline-none rounded-sm resize-none"
        />
        <button onClick={doCommit} className="w-full h-7 flex items-center justify-center gap-1.5 rounded-sm bg-[var(--accent)] text-white hover:brightness-110 disabled:opacity-50" disabled={!changes.length}>
          <Check size={14} /> Commit{changes.length ? ` (${changes.length})` : ''}
        </button>
      </div>
      <div className="flex items-center px-2 h-6 text-[11px] font-bold uppercase tracking-wide">
        <span className="flex-1">Changes</span>
        {changes.length > 0 && <IconBtn title="Discard All Changes" onClick={() => { if (confirm('Discard ALL changes since last commit?')) changes.forEach((c) => ide.discard(c.path)); }}><RotateCcw size={13} /></IconBtn>}
        <span className="px-1.5 rounded-full bg-[var(--input)] text-[10px] font-normal">{changes.length}</span>
      </div>
      <div className="overflow-auto max-h-[45%]">
        {changes.length === 0 && <div className="px-4 py-2 flex items-center gap-2 text-xs text-[var(--muted)]"><CheckCircle2 size={13} className="text-emerald-400" /> No changes. Working tree clean</div>}
        {changes.map((c) => (
          <div key={c.path} onClick={() => c.status !== 'D' && ide.openFile('diff:' + c.path)} className="group flex items-center gap-1.5 px-3 h-[22px] cursor-pointer hover:bg-[var(--hover)]">
            <FileIcon path={c.path} />
            <span className={`truncate ${c.status === 'D' ? 'line-through opacity-70' : ''}`}>{basename(c.path)}</span>
            <span className="text-[11px] text-[var(--muted)] truncate flex-1">{dirname(c.path)}</span>
            <span className="hidden group-hover:flex gap-0.5">
              {c.status !== 'D' && <IconBtn title="Open Diff" onClick={() => ide.openFile('diff:' + c.path)}><FileDiff size={13} /></IconBtn>}
              <IconBtn title="Discard Changes" onClick={() => ide.discard(c.path)}><Undo2 size={13} /></IconBtn>
            </span>
            <span className={`font-bold text-[11px] w-3 ${color[c.status]}`}>{c.status}</span>
          </div>
        ))}
      </div>
      <button onClick={() => setShowHist(!showHist)} className="flex items-center gap-1 px-2 h-6 mt-2 text-[11px] font-bold uppercase tracking-wide border-t border-[var(--border)]">
        {showHist ? <ChevronDown size={14} /> : <ChevronRight size={14} />} Commit Graph
      </button>
      {showHist && (
        <div className="flex-1 overflow-auto pb-4">
          {[...ide.commits].reverse().map((c, i) => (
            <div key={c.id} className="flex gap-2 px-3 py-1 hover:bg-[var(--hover)]">
              <div className="flex flex-col items-center pt-1">
                <GitCommit size={14} className={i === 0 ? 'text-[var(--accent)]' : 'text-[var(--muted)]'} />
                {i < ide.commits.length - 1 && <div className="w-px flex-1 bg-[var(--border)]" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate">{c.message} {i === 0 && <span className="ml-1 px-1 rounded text-[10px] bg-[var(--accent)]/30">HEAD</span>}</div>
                <div className="text-[11px] text-[var(--muted)] flex gap-2">
                  <span className="font-mono">{c.id.slice(0, 7)}</span>
                  <span>{new Date(c.date).toLocaleString()}</span>
                </div>
                <div className="text-[10px] flex gap-2"><span className="text-emerald-400">+{c.stats.added}</span><span className="text-amber-300">~{c.stats.modified}</span><span className="text-red-400">-{c.stats.deleted}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
