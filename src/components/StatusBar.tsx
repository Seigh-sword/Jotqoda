import { useEffect, useState } from 'react';
import { GitBranch, AlertCircle, AlertTriangle, Bell, Check, Loader2, Radio, Zap, Palette, Circle } from 'lucide-react';
import { useIDE, isSpecialTab } from '../ide/types';
import { getLang, getLangById } from '../ide/languages';
import { getTheme } from '../ide/themes';
import { useChanges } from './GitView';

export function StatusBar() {
  const ide = useIDE();
  const changes = useChanges();
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 30000); return () => clearInterval(t); }, []);
  const errors = ide.problems.filter((p) => p.severity === 'error').length;
  const warns = ide.problems.filter((p) => p.severity === 'warning').length;
  const f = ide.activeFile && !isSpecialTab(ide.activeFile) && ide.files[ide.activeFile] != null ? ide.activeFile : null;
  const lang = f ? (ide.langOverride[f] ? getLangById(ide.langOverride[f]) : getLang(f)) : null;
  const langName = lang?.name;
  const content = f ? ide.files[f] : '';
  const dirty = f ? ide.files[f] !== ide.saved[f] : false;
  const eol = content.includes('\r\n') ? 'CRLF' : 'LF';

  const Item = ({ children, onClick, title, className = '' }: { children: React.ReactNode; onClick?: () => void; title?: string; className?: string }) => (
    <button title={title} onClick={onClick} className={`flex items-center gap-1 px-2 h-full hover:bg-white/15 whitespace-nowrap ${className}`}>{children}</button>
  );

  return (
    <div className="flex items-center h-[22px] text-[12px] shrink-0 select-none overflow-hidden" style={{ background: ide.running ? '#c2410c' : 'var(--status)', color: 'var(--statusFg)' }}>
      <Item title="Remote" className="bg-white/10 px-2.5"><Radio size={12} /> Browser</Item>
      <Item title="Source Control" onClick={() => { ide.setSidebarView('git'); ide.setSidebarOpen(true); }}><GitBranch size={13} /> main{changes.length ? '*' : ''}</Item>
      {changes.length > 0 && <Item title="Changes">↑0 ↓0 · {changes.length}Δ</Item>}
      <Item title="Problems" onClick={() => { ide.setPanelOpen(true); ide.setPanelTab('problems'); }}><AlertCircle size={13} /> {errors} <AlertTriangle size={13} className="ml-1" /> {warns}</Item>
      {ide.running && <Item title="Stop" onClick={ide.stop}><Loader2 size={12} className="animate-spin" /> Running… (click to stop)</Item>}
      <div className="flex-1" />
      {f && (
        <>
          <Item title="Go to Line (Ctrl+G)" onClick={() => ide.openPalette('line')}>Ln {ide.cursor.line}, Col {ide.cursor.col}{ide.cursor.sel ? ` (${ide.cursor.sel} selected${ide.cursor.selLines > 1 ? `, ${ide.cursor.selLines} lines` : ''})` : ''}</Item>
          <Item title="Indentation" onClick={() => ide.setSetting('insertSpaces', !ide.settings.insertSpaces)}>{ide.settings.insertSpaces ? 'Spaces' : 'Tab Size'}: {ide.settings.tabSize}</Item>
          <Item title="Encoding">UTF-8</Item>
          <Item title="End of Line">{eol}</Item>
          <Item title="Select Language Mode" onClick={() => ide.openPalette('language')}>{'{ }'} {langName}</Item>
          <Item title="Words / Lines">{(content.match(/\S+/g) || []).length}w · {content.split('\n').length}L</Item>
          <Item title={dirty ? 'Unsaved changes' : 'Saved'} onClick={() => ide.saveFile()}>{dirty ? <><Circle size={12} fill="currentColor" /> Unsaved</> : <><Check size={12} /> Saved</>}</Item>
        </>
      )}
      <Item title="Toggle Auto Save" onClick={() => ide.setSetting('autoSave', !ide.settings.autoSave)}><Zap size={12} /> AutoSave {ide.settings.autoSave ? 'On' : 'Off'}</Item>
      <Item title="Change Theme" onClick={() => ide.openPalette('theme')}><Palette size={12} /> {getTheme(ide.settings.theme).name}</Item>
      <Item title="Zoom (Ctrl+= / Ctrl+-)">{Math.round((ide.settings.fontSize / 14) * 100)}%</Item>
      <Item title="Time">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Item>
      <Item title="Notifications"><Bell size={12} /></Item>
    </div>
  );
}
