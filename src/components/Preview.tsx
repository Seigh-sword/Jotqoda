import { useEffect, useState } from 'react';
import { RefreshCw, X, ExternalLink, Smartphone, Tablet, Monitor, Link2, Eye } from 'lucide-react';
import { useIDE, basename } from '../ide/types';
import { buildPreview, canPreview } from '../ide/preview';
import { getTheme } from '../ide/themes';
import { IconBtn } from './Explorer';

export function Preview() {
  const ide = useIDE();
  const [follow, setFollow] = useState(true);
  const path = follow && ide.activeFile && canPreview(ide.activeFile) && ide.files[ide.activeFile] != null ? ide.activeFile : ide.previewPath!;
  const [doc, setDoc] = useState('');
  const [key, setKey] = useState(0);
  const [device, setDevice] = useState<'full' | 'tablet' | 'mobile'>('full');

  const target = path && /\.(css|js)$/i.test(path) && ide.previewPath && /\.html?$/i.test(ide.previewPath) ? ide.previewPath : path;
  const dark = getTheme(ide.settings.theme).base !== 'vs';

  useEffect(() => {
    if (!target) return;
    const t = setTimeout(() => setDoc(buildPreview(target, ide.files, { dark })), ide.settings.previewAutoRefresh ? 250 : 0);
    return () => clearTimeout(t);
  }, [target, dark, ide.settings.previewAutoRefresh ? ide.files : key]);

  const width = device === 'mobile' ? 375 : device === 'tablet' ? 768 : undefined;

  return (
    <div className="flex flex-col h-full bg-[var(--side)]">
      <div className="flex items-center gap-1 h-9 px-2 border-b border-[var(--border)] shrink-0">
        <span className="text-[12px] truncate flex-1 flex items-center gap-1.5"><Eye size={13} className="text-[var(--accent)]" /> Preview · <span className="text-[var(--muted)]">{target ? basename(target) : ''}</span></span>
        <IconBtn title="Follow active file" active={follow} onClick={() => setFollow(!follow)}><Link2 size={14} /></IconBtn>
        <IconBtn title="Desktop" active={device === 'full'} onClick={() => setDevice('full')}><Monitor size={14} /></IconBtn>
        <IconBtn title="Tablet (768px)" active={device === 'tablet'} onClick={() => setDevice('tablet')}><Tablet size={14} /></IconBtn>
        <IconBtn title="Mobile (375px)" active={device === 'mobile'} onClick={() => setDevice('mobile')}><Smartphone size={14} /></IconBtn>
        <IconBtn title="Refresh" onClick={() => { setKey((k) => k + 1); setDoc(buildPreview(target!, ide.files, { dark })); }}><RefreshCw size={14} /></IconBtn>
        <IconBtn title="Open in new window" onClick={() => { const w = window.open('', '_blank'); if (w) { w.document.write(doc); w.document.close(); } }}><ExternalLink size={14} /></IconBtn>
        <IconBtn title="Close" onClick={() => ide.setPreviewPath(null)}><X size={14} /></IconBtn>
      </div>
      <div className="flex-1 min-h-0 flex justify-center overflow-auto bg-[repeating-conic-gradient(var(--hover)_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]">
        <iframe key={key} title="preview" srcDoc={doc} sandbox="allow-scripts allow-modals allow-forms allow-popups" className="h-full bg-white border-0 shadow-lg transition-all" style={{ width: width ?? '100%' }} />
      </div>
    </div>
  );
}
