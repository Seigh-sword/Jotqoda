import { useMemo, useState } from 'react';
import { FilePlus, FolderOpen, Command, LayoutTemplate, Upload, Terminal, Play, Palette, Settings, Keyboard, GitBranch, Search, Wrench, Eye, Zap, Sparkles, ListTree, History, Columns2, Wand2, FileArchive, Bookmark } from 'lucide-react';
import { useIDE } from '../ide/types';
import { LANGUAGES, CATEGORY_ORDER, RUNNABLE_LANGS, isExecutable } from '../ide/languages';
import { WORKSPACE_TEMPLATES } from '../ide/templates';
import { THEMES } from '../ide/themes';

function luminance(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return 0.5;
  const n = parseInt(m[1], 16);
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
}

export function Welcome() {
  const ide = useIDE();
  const [cat, setCat] = useState<string>('All');
  const [q, setQ] = useState('');
  const runnable = RUNNABLE_LANGS;
  const counts = useMemo(() => { const c: Record<string, number> = {}; LANGUAGES.forEach((l) => { c[l.category] = (c[l.category] ?? 0) + 1; }); return c; }, []);
  const shown = LANGUAGES.filter((l) => (cat === 'All' || l.category === cat) && (!q || (l.name + ' ' + l.exts.join(' ')).toLowerCase().includes(q.toLowerCase())));
  const start: [any, string, string][] = [
    [FilePlus, 'New File…', 'file.new'],
    [FolderOpen, 'Open Local Folder…', 'workspace.openFolder'],
    [FileArchive, 'Import ZIP Archive…', 'workspace.importZip'],
    [Upload, 'Import Workspace (JSON)…', 'workspace.import'],
    [LayoutTemplate, 'Load Template…', 'workspace.template'],
    [Command, 'Command Palette', 'view.palette'],
    [Keyboard, 'Keyboard Shortcuts', 'help.shortcuts'],
  ];
  const features: [any, string, string, string?][] = [
    [Play, 'Run Code', `${runnable.length} languages run in-browser: JS, TS, Python, SQL, Lua, Ruby, PHP, Scheme, Prolog…`, 'view.run'],
    [Sparkles, `${LANGUAGES.length} Languages`, 'Highlighting, outline, symbols & keyword IntelliSense', 'view.languages'],
    [ListTree, 'Outline & Symbols', 'Outline view, @ / # symbol search, go to definition', 'view.gotoSymbol'],
    [Wand2, 'Formatting & Emmet', 'Prettier, SQL & XML formatters, Emmet abbreviations', 'editor.format'],
    [Columns2, 'Editor Groups', 'Up to 4 splits, pinned & draggable tabs', 'view.split'],
    [History, 'Local History', 'Timeline snapshots, compare & restore', 'history.show'],
    [Eye, 'Live Preview', 'HTML, Markdown, SVG, Mermaid, Graphviz & CSV', 'view.preview'],
    [Terminal, 'Terminal', 'Multiple shells, pipes, redirection, 80+ commands', 'view.terminal'],
    [GitBranch, 'Source Control', 'Commit, diff & discard', 'view.git'],
    [Search, 'Global Search', 'Regex find & replace, find in folder', 'view.search'],
    [Bookmark, 'Bookmarks', 'Gutter bookmarks with next / previous', 'view.bookmarks'],
    [Wrench, 'Dev Tools', '11 built-in utilities', 'view.tools'],
    [Palette, `${THEMES.length} Themes`, 'Dracula, Gruvbox, Night Owl, Rosé Pine…', 'theme.select'],
    [Settings, '75+ Settings', 'Editable keybindings too', 'settings.open'],
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
          <div>
            <h2 className="text-lg mb-3">Features</h2>
            <div className="grid grid-cols-2 gap-2">
              {features.map(([I, t, d, cmd]) => (
                <button key={t} onClick={() => cmd && ide.execCommand(cmd)} className="text-left p-3 rounded-lg bg-[var(--side)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors">
                  <I size={18} className="text-[var(--accent)] mb-1.5" />
                  <div className="text-[13px] font-semibold">{t}</div>
                  <div className="text-[11px] text-[var(--muted)]">{d}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
        <h2 className="text-lg mt-10 mb-3 flex items-center gap-2 flex-wrap">
          <Sparkles size={16} className="text-[var(--accent)]" /> {LANGUAGES.length} Supported Languages
          <span className="text-[12px] text-[var(--muted)] font-normal">· <Play size={10} className="inline" fill="currentColor" /> = runs in the browser</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter languages…" className="ml-auto h-7 px-2 text-[12px] rounded-sm bg-[var(--input)] border border-[var(--border)] outline-none focus:border-[var(--accent)] w-48" />
        </h2>
        <div className="flex flex-wrap gap-1 mb-3">
          {['All', ...CATEGORY_ORDER.filter((c) => counts[c])].map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`px-2 py-0.5 rounded-sm text-[11px] border ${cat === c ? 'bg-[var(--accent)] text-white border-transparent' : 'border-[var(--border)] text-[var(--muted)] hover:text-[var(--fg)]'}`}>{c} {c === 'All' ? LANGUAGES.length : counts[c]}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {shown.map((l) => {
            const base = luminance(l.color) < 0.22 ? '#9ca3af' : l.color;
            return (
              <span key={l.id} title={`${l.category}${l.exts.length ? ' · ' + l.exts.slice(0, 6).map((e) => '.' + e).join(' ') : ''}`} className="px-2 py-0.5 rounded-full text-[11px] border inline-flex items-center gap-1" style={{ borderColor: base + '66', color: `color-mix(in srgb, ${base} 70%, var(--fg))`, background: base + '14' }}>
                {l.name}
                {isExecutable(l) && <Play size={9} fill="currentColor" />}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
