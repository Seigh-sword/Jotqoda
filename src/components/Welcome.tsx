import { FilePlus, FolderOpen, Command, LayoutTemplate, Upload, Terminal, Play, Palette, Settings, Keyboard, GitBranch, Search, Wrench, Eye, Zap, Sparkles } from 'lucide-react';
import { useIDE } from '../ide/types';
import { LANGUAGES } from '../ide/languages';
import { WORKSPACE_TEMPLATES } from '../ide/templates';
import { THEMES } from '../ide/themes';

export function Welcome() {
  const ide = useIDE();
  const start: [any, string, string][] = [
    [FilePlus, 'New File…', 'file.new'],
    [FolderOpen, 'New Folder…', 'file.newFolder'],
    [Upload, 'Import Workspace (JSON)…', 'workspace.import'],
    [LayoutTemplate, 'Load Template…', 'workspace.template'],
    [Command, 'Command Palette', 'view.palette'],
    [Keyboard, 'Keyboard Shortcuts', 'help.shortcuts'],
  ];
  const features: [any, string, string][] = [
    [Play, 'Run Code', 'JS · TS · Python · SQL in-browser'],
    [Eye, 'Live Preview', 'HTML, Markdown & SVG'],
    [Terminal, 'Terminal', '30+ shell commands'],
    [GitBranch, 'Source Control', 'Commit, diff & discard'],
    [Search, 'Global Search', 'Regex find & replace'],
    [Wrench, 'Dev Tools', '11 built-in utilities'],
    [Palette, '13 Themes', 'Dracula, Nord, Tokyo…'],
    [Settings, '35+ Settings', 'Fully customizable'],
  ];
  return (
    <div className="h-full overflow-auto bg-[var(--bg)]">
      <div className="max-w-5xl mx-auto px-10 py-12">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-violet-900/40"><Zap size={28} fill="white" strokeWidth={1.5} /></div>
          <div>
            <h1 className="text-4xl font-light tracking-tight">Jot<span className="font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">Qoda</span></h1>
            <p className="text-[var(--muted)]">The powerful code editor that lives in your browser</p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-10 mt-10">
          <div>
            <h2 className="text-lg mb-3">Start</h2>
            <div className="space-y-1">
              {start.map(([I, l, c]) => (
                <button key={l} onClick={() => ide.execCommand(c)} className="flex items-center gap-2.5 text-[var(--accent)] hover:underline text-[14px] py-0.5"><I size={16} /> {l}</button>
              ))}
            </div>
            <h2 className="text-lg mt-8 mb-3">Templates</h2>
            <div className="space-y-1.5">
              {Object.entries(WORKSPACE_TEMPLATES).map(([k, t]) => (
                <button key={k} onClick={() => ide.execCommand('template.' + k)} className="block text-left group">
                  <span className="text-[var(--accent)] group-hover:underline text-[14px]">{t.name}</span>
                  <span className="text-[var(--muted)] text-[12px] ml-2">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-lg mb-3">Features</h2>
            <div className="grid grid-cols-2 gap-2">
              {features.map(([I, t, d]) => (
                <div key={t} className="p-3 rounded-lg bg-[var(--side)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors">
                  <I size={18} className="text-[var(--accent)] mb-1.5" />
                  <div className="text-[13px] font-semibold">{t}</div>
                  <div className="text-[11px] text-[var(--muted)]">{d}</div>
                </div>
              ))}
            </div>
            <h2 className="text-lg mt-8 mb-3">Theme</h2>
            <div className="flex flex-wrap gap-1.5">
              {THEMES.map((t) => (
                <button key={t.id} onClick={() => ide.setSetting('theme', t.id)} title={t.name} className={`w-8 h-8 rounded-md border-2 overflow-hidden flex ${ide.settings.theme === t.id ? 'border-[var(--accent)] scale-110' : 'border-transparent'}`}>
                  <span className="flex-1" style={{ background: t.ui.bg }} />
                  <span className="w-2" style={{ background: t.ui.accent }} />
                </button>
              ))}
            </div>
          </div>
        </div>
        <h2 className="text-lg mt-10 mb-3 flex items-center gap-2"><Sparkles size={16} className="text-[var(--accent)]" /> {LANGUAGES.length} Supported Languages</h2>
        <div className="flex flex-wrap gap-1.5">
          {LANGUAGES.map((l) => (
            <span key={l.id} className="px-2 py-0.5 rounded-full text-[11px] border inline-flex items-center gap-1" style={{ borderColor: l.color + '66', color: l.color === '#000080' || l.color === '#141414' || l.color === '#555555' ? 'var(--muted)' : l.color, background: l.color + '14' }}>
              {l.name}
              {l.runnable && ['js', 'ts', 'python', 'sql'].includes(l.runnable) && <Play size={9} fill="currentColor" />}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
