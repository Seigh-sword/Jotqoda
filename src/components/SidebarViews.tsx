import { useMemo, useState } from 'react';
import { Play, Square, Search, Plus, Trash2, Zap, Check, Braces, Rows3, Pin, Grid2x2, Sparkles, Save, Link2, MousePointerClick, Tags, Palette, WrapText, Type, ZoomIn, Sigma, ChevronsDownUp, Bookmark, Wand2, Highlighter, History, Scissors } from 'lucide-react';
import { useIDE, basename, dirname, type Settings } from '../ide/types';
import { getLang, getLangById, RUNNABLE_INFO, LANGUAGES, CATEGORY_ORDER, RUNNABLE_LANGS, isExecutable, type LangDef } from '../ide/languages';
import { formatterName } from '../ide/format';
import { FileIcon } from './FileIcon';

export { SNIPPETS, loadCustomSnippets } from '../ide/snippets';
import { SNIPPETS, loadCustomSnippets, saveCustomSnippets } from '../ide/snippets';

export function insertSnippet(ide: ReturnType<typeof useIDE>, body: string) {
  const ed = ide.getEditor();
  if (!ed) return ide.toast('Open a file first', 'warn');
  ed.focus();
  const ctrl = ed.getContribution('snippetController2');
  if (ctrl) ctrl.insert(body);
  else ed.executeEdits('snip', [{ range: ed.getSelection(), text: body.replace(/\$\{\d+:?([^}]*)\}|\$\d/g, '$1') }]);
}


export function SnippetsView() {
  const ide = useIDE();
  const langId = ide.activeFile ? ide.langOverride[ide.activeFile] ?? getLang(ide.activeFile).id : 'javascript';
  const [lang, setLang] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [custom, setCustom] = useState(loadCustomSnippets);
  const cur = lang ?? (SNIPPETS[langId] ? langId : 'javascript');
  const list = [...custom.filter((c) => c.lang === cur).map((c) => ({ ...c, custom: true })), ...(SNIPPETS[cur] ?? [])].filter((s) => !q || (s.label + s.prefix).toLowerCase().includes(q.toLowerCase()));

  const saveSel = async () => {
    const ed = ide.getEditor();
    const sel = ed?.getModel()?.getValueInRange(ed.getSelection());
    if (!sel) return ide.toast('Select some code in the editor first', 'warn');
    const name = await ide.prompt('Snippet name', '', 'e.g. My helper');
    if (!name) return;
    const next = [...custom, { prefix: name.toLowerCase().replace(/\W+/g, ''), label: name, body: sel.replace(/\$/g, '\\$'), lang: langId }];
    setCustom(next);
    saveCustomSnippets(next);
    ide.toast('Snippet saved', 'success');
  };
  const del = (label: string) => {
    const next = custom.filter((c) => !(c.label === label && c.lang === cur));
    setCustom(next);
    saveCustomSnippets(next);
  };

  return (
    <div className="flex flex-col h-full text-[13px]">
      <div className="p-2 space-y-1.5">
        <div className="flex gap-1">
          <select value={cur} onChange={(e) => setLang(e.target.value)} className="flex-1 h-7 px-1 bg-[var(--input)] border border-[var(--border)] rounded-sm">
            {Object.keys(SNIPPETS).map((k) => <option key={k} value={k}>{LANGUAGES.find((l) => l.id === k)?.name ?? k}</option>)}
          </select>
          <button title="Save selection as snippet" onClick={saveSel} className="px-2 rounded-sm bg-[var(--accent)] text-white"><Plus size={14} /></button>
        </div>
        <div className="relative"><Search size={13} className="absolute left-2 top-2 text-[var(--muted)]" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter snippets" className="w-full h-7 pl-7 pr-2 bg-[var(--input)] border border-[var(--border)] rounded-sm outline-none focus:border-[var(--accent)]" /></div>
        <div className="text-[11px] text-[var(--muted)]">Click to insert · or type the prefix in the editor and pick from IntelliSense</div>
      </div>
      <div className="flex-1 overflow-auto">
        {list.map((s: any) => (
          <div key={s.label + s.prefix} onClick={() => insertSnippet(ide, s.body)} className="group px-3 py-1.5 cursor-pointer hover:bg-[var(--hover)] border-b border-[var(--border)]/50">
            <div className="flex items-center gap-2">
              <Zap size={12} className="text-[var(--accent)]" />
              <span className="flex-1 truncate">{s.label}</span>
              {s.custom && <button onClick={(e) => { e.stopPropagation(); del(s.label); }} className="opacity-0 group-hover:opacity-100 text-red-400"><Trash2 size={12} /></button>}
              <code className="text-[10px] px-1 rounded bg-[var(--input)] text-[var(--muted)]">{s.prefix}</code>
            </div>
            <pre className="mt-1 text-[10px] text-[var(--muted)] truncate font-mono">{s.body.split('\n')[0].replace(/\$\{\d+:?([^}]*)\}/g, '$1')}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RunView() {
  const ide = useIDE();
  const file = ide.activeFile && ide.files[ide.activeFile] != null ? ide.activeFile : null;
  const langOf = (p: string) => (ide.langOverride[p] ? getLangById(ide.langOverride[p]) : getLang(p));
  const lang = file ? langOf(file) : null;
  const runnable = Object.keys(ide.files).filter((p) => { const k = langOf(p).runnable; return k && k !== 'css'; });
  const runtimes = [...new Set(RUNNABLE_LANGS.map((l) => l.name.replace(/ \/.*$/, '')))];
  return (
    <div className="flex flex-col h-full text-[13px]">
      <div className="p-3 space-y-2">
        <div className="flex gap-1.5">
          <button disabled={!file} onClick={() => ide.run()} className="flex-1 h-8 flex items-center justify-center gap-1.5 rounded-sm bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40"><Play size={14} fill="currentColor" /> Run {file ? basename(file) : ''}</button>
          {ide.running && <button onClick={ide.stop} className="h-8 px-3 rounded-sm bg-red-600 text-white"><Square size={13} fill="currentColor" /></button>}
        </div>
        {lang && (
          <div className="text-[11px] text-[var(--muted)] p-2 rounded-sm bg-[var(--input)]">
            <div className="font-semibold text-[var(--fg)] mb-0.5 flex items-center gap-1.5"><FileIcon path={file!} /> {lang.name}</div>
            {lang.runnable ? RUNNABLE_INFO[lang.runnable] : `No in-browser runtime for ${lang.name}. Highlighting, outline, IntelliSense-lite, snippets & formatting still work. Runtimes: ${runtimes.join(', ')}.`}
          </div>
        )}
        <div className="grid grid-cols-2 gap-1 text-[11px]">
          <Toggle k="clearOutputOnRun" label="Clear on run" />
          <Toggle k="previewAutoRefresh" label="Live preview" />
        </div>
      </div>
      <div className="px-2 h-6 flex items-center text-[11px] font-bold uppercase tracking-wide border-t border-[var(--border)]">Runnable Files ({runnable.length})</div>
      <div className="flex-1 overflow-auto">
        {runnable.map((p) => (
          <div key={p} className="group flex items-center gap-1.5 px-3 h-[24px] hover:bg-[var(--hover)] cursor-pointer" onClick={() => ide.openFile(p)}>
            <FileIcon path={p} />
            <span className="truncate">{basename(p)}</span>
            <span className="text-[11px] text-[var(--muted)] truncate flex-1">{dirname(p)}</span>
            <button title="Run" onClick={(e) => { e.stopPropagation(); ide.run(p); }} className="opacity-0 group-hover:opacity-100 text-emerald-400"><Play size={13} fill="currentColor" /></button>
          </div>
        ))}
      </div>
      <div className="p-3 text-[11px] text-[var(--muted)] border-t border-[var(--border)] space-y-0.5">
        <div><b>F5</b> / <b>Ctrl+Enter</b> run · <b>Shift+F5</b> stop</div>
        <div><b>Ctrl+Shift+V</b> toggle preview</div>
        <div className="opacity-80">All runtimes execute locally in your browser (WebAssembly / Web Workers). Runtimes are downloaded from jsDelivr on first use.</div>
      </div>
    </div>
  );
}

function Toggle({ k, label }: { k: keyof Settings; label: string }) {
  const ide = useIDE();
  const v = ide.settings[k] as boolean;
  return (
    <label className="flex items-center gap-1.5 cursor-pointer">
      <input type="checkbox" checked={v} onChange={() => ide.setSetting(k, !v as any)} className="accent-[var(--accent)]" /> {label}
    </label>
  );
}

const FEATURES: { k: keyof Settings; name: string; desc: string; icon: any; color: string }[] = [
  { k: 'emmet', name: 'Emmet', desc: 'Abbreviation expansion in HTML, templates & CSS (e.g. ul>li*3)', icon: Scissors, color: '#9ec400' },
  { k: 'prettier', name: 'Prettier Formatter', desc: 'Formats JS, TS, JSON, CSS/SCSS/Less, HTML, Vue, Markdown, YAML & GraphQL', icon: Wand2, color: '#c596c7' },
  { k: 'formatOnSave', name: 'Format on Save', desc: 'Runs the formatter pipeline on Ctrl+S', icon: Sparkles, color: '#f472b6' },
  { k: 'localHistory', name: 'Local History', desc: 'Snapshots on save & before destructive edits (Timeline)', icon: History, color: '#22d3ee' },
  { k: 'bracketPairs', name: 'Bracket Pair Colorization', desc: 'Colorizes matching brackets for readability', icon: Braces, color: '#f59e0b' },
  { k: 'minimap', name: 'Minimap', desc: 'Bird’s-eye code overview', icon: Rows3, color: '#3b82f6' },
  { k: 'stickyScroll', name: 'Sticky Scroll', desc: 'Keeps the current scope headers pinned while scrolling', icon: Pin, color: '#ef4444' },
  { k: 'indentGuides', name: 'Indent Guides', desc: 'Vertical indentation guides', icon: Grid2x2, color: '#10b981' },
  { k: 'autoSave', name: 'Auto Save', desc: 'Persists every keystroke automatically', icon: Save, color: '#6366f1' },
  { k: 'ligatures', name: 'Font Ligatures', desc: 'Programming ligatures (=>, !==, >=)', icon: Link2, color: '#ec4899' },
  { k: 'smoothCaret', name: 'Smooth Caret', desc: 'Animated cursor movement', icon: MousePointerClick, color: '#14b8a6' },
  { k: 'linkedEditing', name: 'Linked Tag Editing', desc: 'Renames paired HTML/XML tags together', icon: Tags, color: '#e34c26' },
  { k: 'colorDecorators', name: 'Color Decorators', desc: 'Inline color swatches & picker for CSS colors', icon: Palette, color: '#8b5cf6' },
  { k: 'occurrencesHighlight', name: 'Highlight Occurrences', desc: 'Highlights other occurrences of the symbol under the cursor', icon: Highlighter, color: '#eab308' },
  { k: 'wordWrap', name: 'Word Wrap', desc: 'Wraps long lines to the viewport', icon: WrapText, color: '#0ea5e9' },
  { k: 'typeCheck', name: 'TypeScript Diagnostics', desc: 'Semantic type checking for TS', icon: Type, color: '#3178c6' },
  { k: 'mouseWheelZoom', name: 'Mouse Wheel Zoom', desc: 'Ctrl + scroll to zoom the editor', icon: ZoomIn, color: '#84cc16' },
  { k: 'parameterHints', name: 'Parameter Hints', desc: 'Signature help while typing function calls', icon: Sigma, color: '#f97316' },
  { k: 'folding', name: 'Code Folding', desc: 'Collapse regions & blocks', icon: ChevronsDownUp, color: '#64748b' },
];

/** "Extensions" view — an honest catalogue of built-in languages, runtimes and features. */
export function ExtensionsView() {
  const ide = useIDE();
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<'languages' | 'features'>('languages');
  const [cat, setCat] = useState<string>('All');
  const ql = q.toLowerCase();
  const langs = useMemo(() => LANGUAGES.filter((l) => (cat === 'All' || l.category === cat) && (!ql || (l.name + ' ' + l.exts.join(' ') + ' ' + l.aliases.join(' ')).toLowerCase().includes(ql))), [cat, ql]);
  const counts = useMemo(() => { const c: Record<string, number> = {}; LANGUAGES.forEach((l) => { c[l.category] = (c[l.category] ?? 0) + 1; }); return c; }, []);
  const features = FEATURES.filter((e) => (e.name + e.desc).toLowerCase().includes(ql));
  const badge = (l: LangDef) => {
    const out: [string, string][] = [];
    if (isExecutable(l)) out.push(['Run', 'text-emerald-400 border-emerald-400/40']);
    else if (l.runnable && l.runnable !== 'css') out.push(['Preview', 'text-sky-400 border-sky-400/40']);
    const f = formatterName(l, ide.settings);
    if (f && f !== 'Reindent') out.push([`format: ${f}`, 'text-fuchsia-300 border-fuchsia-300/40']);
    out.push([l.builtin ? 'Monaco grammar' : 'JotQoda grammar', 'text-[var(--muted)] border-[var(--border)]']);
    return out;
  };
  return (
    <div className="flex flex-col h-full text-[13px]">
      <div className="p-2 space-y-1.5">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tab === 'languages' ? `Search ${LANGUAGES.length} languages (name, extension…)` : 'Search features'} className="w-full h-7 px-2 bg-[var(--input)] border border-[var(--border)] rounded-sm outline-none focus:border-[var(--accent)]" />
        <div className="flex gap-1 text-[11px]">
          {(['languages', 'features'] as const).map((t) => <button key={t} onClick={() => setTab(t)} className={`px-2 py-0.5 rounded-sm capitalize ${tab === t ? 'bg-[var(--accent)] text-white' : 'border border-[var(--border)] text-[var(--muted)]'}`}>{t}</button>)}
          {tab === 'languages' && (
            <select value={cat} onChange={(e) => setCat(e.target.value)} className="ml-auto h-6 px-1 bg-[var(--input)] border border-[var(--border)] rounded-sm text-[11px]">
              <option value="All">All categories ({LANGUAGES.length})</option>
              {CATEGORY_ORDER.filter((c) => counts[c]).map((c) => <option key={c} value={c}>{c} ({counts[c]})</option>)}
            </select>
          )}
        </div>
      </div>
      {tab === 'languages' ? (
        <>
          <div className="px-2 h-6 flex items-center text-[11px] font-bold uppercase tracking-wide">{langs.length} languages · {RUNNABLE_LANGS.length} runnable</div>
          <div className="flex-1 overflow-auto">
            {langs.map((l) => (
              <div key={l.id} className="flex gap-2 px-3 py-1.5 hover:bg-[var(--hover)] cursor-default" title={l.exts.length ? l.exts.map((e) => '.' + e).join(' ') : l.files.join(' ')}>
                <span className="w-2.5 h-2.5 rounded-full mt-1 shrink-0" style={{ background: l.color }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5"><span className="font-semibold truncate">{l.name}</span><span className="text-[10px] text-[var(--muted)] truncate">{l.category}</span></div>
                  <div className="text-[11px] text-[var(--muted)] truncate">{[...l.exts.slice(0, 6).map((e) => '.' + e), ...l.files.slice(0, 3)].join(' ') || '—'}</div>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {badge(l).map(([t, c], i) => <span key={i + t} className={`text-[9px] px-1 rounded-sm border ${c}`}>{t}</span>)}
                    {ide.activeFile && ide.files[ide.activeFile] != null && <button onClick={() => ide.setLangOverride(ide.activeFile!, l.id)} className="text-[9px] px-1 rounded-sm border border-[var(--border)] text-[var(--muted)] hover:text-[var(--fg)] ml-auto">Use for current file</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="px-2 h-6 flex items-center text-[11px] font-bold uppercase tracking-wide">Built-in · {FEATURES.filter((e) => ide.settings[e.k]).length} enabled</div>
          <div className="flex-1 overflow-auto">
            {features.map((e) => {
              const on = !!ide.settings[e.k];
              const Icon = e.icon;
              return (
                <div key={e.k} className="flex gap-2.5 px-3 py-2 hover:bg-[var(--hover)]">
                  <div className="w-9 h-9 rounded-md shrink-0 flex items-center justify-center" style={{ background: e.color + '30', color: e.color }}><Icon size={17} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1"><span className="font-semibold truncate">{e.name}</span>{on && <Check size={12} className="text-emerald-400" />}</div>
                    <div className="text-[11px] text-[var(--muted)]">{e.desc}</div>
                  </div>
                  <button onClick={() => { ide.setSetting(e.k, !on as any); ide.toast(`${e.name} ${on ? 'disabled' : 'enabled'}`); }} className={`self-center px-2 py-0.5 rounded-sm text-[11px] ${on ? 'border border-[var(--border)] hover:bg-[var(--input)]' : 'bg-[var(--accent)] text-white'}`}>{on ? 'Disable' : 'Enable'}</button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export function BookmarksView() {
  const ide = useIDE();
  const byFile = useMemo(() => {
    const m = new Map<string, typeof ide.bookmarks>();
    [...ide.bookmarks].sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line).forEach((b) => m.set(b.path, [...(m.get(b.path) ?? []), b]));
    return [...m];
  }, [ide.bookmarks]);
  return (
    <div className="flex flex-col h-full text-[13px]">
      <div className="p-2 flex gap-1">
        <button onClick={() => ide.toggleBookmark()} className="flex-1 h-7 flex items-center justify-center gap-1.5 rounded-sm bg-[var(--accent)] text-white text-[12px]"><Bookmark size={13} /> Toggle at Cursor</button>
        <button onClick={() => ide.clearBookmarks()} disabled={!ide.bookmarks.length} className="h-7 px-2 rounded-sm border border-[var(--border)] text-[12px] disabled:opacity-40">Clear</button>
      </div>
      <div className="px-3 pb-2 text-[11px] text-[var(--muted)]">Ctrl+Alt+K toggle · Ctrl+Alt+L next · Ctrl+Alt+J previous · click the gutter to toggle</div>
      <div className="flex-1 overflow-auto">
        {!byFile.length && <div className="px-4 py-2 text-[12px] text-[var(--muted)]">No bookmarks yet.</div>}
        {byFile.map(([path, list]) => (
          <div key={path}>
            <div className="flex items-center gap-1.5 px-2 h-[22px] text-[12px] font-semibold"><FileIcon path={path} /> <span className="truncate">{basename(path)}</span><span className="text-[10px] text-[var(--muted)] truncate">{dirname(path)}</span><span className="ml-auto text-[10px] text-[var(--muted)]">{list.length}</span></div>
            {list.map((b) => (
              <div key={b.line} onClick={() => ide.revealAt(b.path, b.line)} className="group flex items-center gap-2 pl-7 pr-2 h-[22px] cursor-pointer hover:bg-[var(--hover)] text-[12px]">
                <Bookmark size={11} className="text-blue-400 shrink-0" fill="currentColor" />
                <span className="text-[var(--muted)] w-8 shrink-0">{b.line}</span>
                <span className="truncate font-mono text-[11px]">{(ide.files[b.path]?.split('\n')[b.line - 1] ?? b.label ?? '').trim() || '(empty line)'}</span>
                <button onClick={(e) => { e.stopPropagation(); ide.toggleBookmark(b.path, b.line); }} className="ml-auto opacity-0 group-hover:opacity-100 text-[var(--muted)] hover:text-red-400"><Trash2 size={11} /></button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

