import { useEffect, useRef, useState } from 'react';
import { GitBranch, AlertCircle, AlertTriangle, Bell, BellOff, Check, Loader2, Radio, Zap, Palette, Circle, Wand2, Bookmark, CheckCheck, Trash2, Info, CheckCircle2 } from 'lucide-react';
import { useIDE, isSpecialTab } from '../ide/types';
import { getLang, getLangById } from '../ide/languages';
import { getTheme } from '../ide/themes';
import { formatterName } from '../ide/format';
import { useChanges } from './GitView';

function Item({ children, onClick, title, className = '' }: { children: React.ReactNode; onClick?: () => void; title?: string; className?: string }) {
  return <button title={title} onClick={onClick} className={`flex items-center gap-1 px-2 h-full hover:bg-white/15 whitespace-nowrap ${className}`}>{children}</button>;
}

export function StatusBar() {
  const ide = useIDE();
  const changes = useChanges();
  const [time, setTime] = useState(new Date());
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 30000); return () => clearInterval(t); }, []);
  useEffect(() => {
    if (!bellOpen) return;
    const h = (e: MouseEvent) => { if (!bellRef.current?.contains(e.target as Node)) setBellOpen(false); };
    window.addEventListener('mousedown', h);
    return () => window.removeEventListener('mousedown', h);
  }, [bellOpen]);
  const errors = ide.problems.filter((p) => p.severity === 'error').length;
  const warns = ide.problems.filter((p) => p.severity === 'warning').length;
  const f = ide.activeFile && !isSpecialTab(ide.activeFile) && ide.files[ide.activeFile] != null ? ide.activeFile : null;
  const content = f ? ide.files[f] : '';
  const lang = f ? (ide.langOverride[f] ? getLangById(ide.langOverride[f]) : getLang(f, content)) : null;
  const dirty = f ? ide.files[f] !== ide.saved[f] : false;
  const eol = content.includes('\r\n') ? 'CRLF' : 'LF';
  const fmt = lang ? formatterName(lang, ide.settings) : null;
  const unread = ide.notifications.filter((n) => !n.read).length;
  const marks = f ? ide.bookmarks.filter((b) => b.path === f).length : 0;
  const NIcon = { info: Info, success: CheckCircle2, error: AlertCircle, warn: AlertTriangle };
  const nColor = { info: 'text-sky-400', success: 'text-emerald-400', error: 'text-red-400', warn: 'text-amber-400' };

  return (
    <div className="relative flex items-center h-[22px] text-[12px] shrink-0 select-none" style={{ background: ide.running ? '#c2410c' : 'var(--status)', color: 'var(--statusFg)' }}>
      <div className="flex items-center h-full min-w-0 overflow-hidden flex-1">
        <Item title="Everything runs locally in your browser" className="bg-white/10 px-2.5"><Radio size={12} /> Browser</Item>
        <Item title="Source Control" onClick={() => { ide.setSidebarView('git'); ide.setSidebarOpen(true); }}><GitBranch size={13} /> main{changes.length ? '*' : ''}</Item>
        {changes.length > 0 && <Item title="Changes">↑0 ↓0 · {changes.length}Δ</Item>}
        <Item title="Problems" onClick={() => { ide.setPanelOpen(true); ide.setPanelTab('problems'); }}><AlertCircle size={13} /> {errors} <AlertTriangle size={13} className="ml-1" /> {warns}</Item>
        {ide.running && <Item title="Stop" onClick={ide.stop}><Loader2 size={12} className="animate-spin" /> Running… (click to stop)</Item>}
        {marks > 0 && <Item title="Bookmarks in this file" onClick={() => ide.execCommand('view.bookmarks')}><Bookmark size={12} /> {marks}</Item>}
        <div className="flex-1" />
        {f && (
          <>
            <Item title="Go to Line (Ctrl+G)" onClick={() => ide.openPalette('line')}>Ln {ide.cursor.line}, Col {ide.cursor.col}{ide.cursor.sel ? ` (${ide.cursor.sel} selected${ide.cursor.selLines > 1 ? `, ${ide.cursor.selLines} lines` : ''})` : ''}</Item>
            <Item title="Select Indentation" onClick={() => ide.execCommand('editor.changeIndent')}>{ide.settings.insertSpaces ? 'Spaces' : 'Tab Size'}: {ide.settings.tabSize}</Item>
            <Item title="Encoding">UTF-8</Item>
            <Item title="Select End of Line Sequence" onClick={() => ide.execCommand('editor.changeEol')}>{eol}</Item>
            <Item title="Select Language Mode" onClick={() => ide.openPalette('language')}>{'{ }'} {lang?.name}</Item>
            {fmt && <Item title={`Format Document with ${fmt} (Shift+Alt+F)`} onClick={() => ide.execCommand('editor.format')}><Wand2 size={11} /> {fmt}</Item>}
            <Item title="Words / Lines">{(content.match(/\S+/g) || []).length}w · {content.split('\n').length}L</Item>
            <Item title={dirty ? 'Unsaved changes' : 'Saved'} onClick={() => ide.saveFile()}>{dirty ? <><Circle size={12} fill="currentColor" /> Unsaved</> : <><Check size={12} /> Saved</>}</Item>
          </>
        )}
        <Item title="Toggle Auto Save" onClick={() => ide.setSetting('autoSave', !ide.settings.autoSave)}><Zap size={12} /> AutoSave {ide.settings.autoSave ? 'On' : 'Off'}</Item>
        <Item title="Change Theme" onClick={() => ide.openPalette('theme')}><Palette size={12} /> {getTheme(ide.settings.theme).name}</Item>
        <Item title="Zoom (Ctrl+= / Ctrl+-)">{Math.round((ide.settings.fontSize / 14) * 100)}%</Item>
        <Item title="Time">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Item>
      </div>
      <div ref={bellRef} className="h-full">
        <Item title={ide.settings.doNotDisturb ? 'Notifications (Do Not Disturb)' : 'Notifications'} onClick={() => { setBellOpen((o) => !o); ide.markNotificationsRead(); }}>
          {ide.settings.doNotDisturb ? <BellOff size={12} /> : <Bell size={12} />}{unread > 0 && <span className="text-[10px] font-bold">{unread}</span>}
        </Item>
        {bellOpen && (
          <div className="absolute bottom-[26px] right-1 z-[80] w-[380px] max-w-[95vw] rounded-md shadow-2xl border border-[var(--border)] bg-[var(--side)] text-[var(--fg)]">
            <div className="flex items-center gap-1 px-3 h-8 border-b border-[var(--border)] text-[11px] uppercase tracking-wide font-bold">
              <span className="flex-1">Notifications</span>
              <button title={ide.settings.doNotDisturb ? 'Turn off Do Not Disturb' : 'Do Not Disturb'} onClick={() => ide.setSetting('doNotDisturb', !ide.settings.doNotDisturb)} className="p-1 rounded hover:bg-[var(--hover)] text-[var(--muted)]">{ide.settings.doNotDisturb ? <BellOff size={13} /> : <Bell size={13} />}</button>
              <button title="Mark all read" onClick={ide.markNotificationsRead} className="p-1 rounded hover:bg-[var(--hover)] text-[var(--muted)]"><CheckCheck size={13} /></button>
              <button title="Clear all" onClick={ide.clearNotifications} className="p-1 rounded hover:bg-[var(--hover)] text-[var(--muted)]"><Trash2 size={13} /></button>
            </div>
            <div className="max-h-[50vh] overflow-auto py-1 normal-case">
              {!ide.notifications.length && <div className="px-3 py-3 text-[12px] text-[var(--muted)]">No new notifications{ide.settings.doNotDisturb ? ' · Do Not Disturb is on (errors still pop up)' : ''}</div>}
              {ide.notifications.map((n) => {
                const I = NIcon[n.type];
                return (
                  <div key={n.id} className="flex gap-2 px-3 py-1.5 text-[12px] hover:bg-[var(--hover)]">
                    <I size={14} className={`${nColor[n.type]} shrink-0 mt-0.5`} />
                    <span className="flex-1 break-words">{n.msg}</span>
                    <span className="text-[10px] text-[var(--muted)] whitespace-nowrap">{new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
