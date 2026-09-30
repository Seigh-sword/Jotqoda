import { useState } from 'react';
import { X, Search, RotateCcw } from 'lucide-react';
import { useIDE, DEFAULT_SETTINGS, type Settings } from '../ide/types';
import { THEMES } from '../ide/themes';
import { Kbd } from './FileIcon';

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4" onMouseDown={onClose}>
      <div className={`${wide ? 'w-[860px]' : 'w-[440px]'} max-w-full max-h-[86vh] flex flex-col rounded-lg shadow-2xl border border-[var(--border)] bg-[var(--side)]`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center px-4 h-11 border-b border-[var(--border)] shrink-0">
          <span className="font-semibold text-[14px] flex-1">{title}</span>
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--hover)]"><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

type Field = { k: keyof Settings; label: string; desc: string; type: 'bool' | 'num' | 'select' | 'text'; opts?: string[]; min?: number; max?: number };
const SECTIONS: [string, Field[]][] = [
  ['Appearance', [
    { k: 'theme', label: 'Color Theme', desc: 'Workbench & editor theme', type: 'select', opts: THEMES.map((t) => t.id) },
    { k: 'fontSize', label: 'Font Size', desc: 'Editor font size in pixels', type: 'num', min: 8, max: 40 },
    { k: 'lineHeight', label: 'Line Height', desc: 'Line height in pixels', type: 'num', min: 12, max: 60 },
    { k: 'fontFamily', label: 'Font Family', desc: 'Editor font stack', type: 'text' },
    { k: 'ligatures', label: 'Font Ligatures', desc: 'Enable programming ligatures', type: 'bool' },
    { k: 'minimap', label: 'Minimap', desc: 'Show the minimap', type: 'bool' },
    { k: 'lineNumbers', label: 'Line Numbers', desc: 'Line number style', type: 'select', opts: ['on', 'off', 'relative'] },
    { k: 'renderWhitespace', label: 'Render Whitespace', desc: 'How whitespace is rendered', type: 'select', opts: ['none', 'boundary', 'all'] },
    { k: 'renderLineHighlight', label: 'Line Highlight', desc: 'Current line highlight', type: 'select', opts: ['all', 'line', 'gutter', 'none'] },
    { k: 'showBreadcrumbs', label: 'Breadcrumbs', desc: 'Show file path breadcrumbs', type: 'bool' },
  ]],
  ['Cursor', [
    { k: 'cursorStyle', label: 'Cursor Style', desc: 'Shape of the cursor', type: 'select', opts: ['line', 'block', 'underline', 'line-thin'] },
    { k: 'cursorBlinking', label: 'Cursor Blinking', desc: 'Cursor animation style', type: 'select', opts: ['blink', 'smooth', 'phase', 'expand', 'solid'] },
    { k: 'smoothCaret', label: 'Smooth Caret Animation', desc: 'Animate cursor movement', type: 'bool' },
    { k: 'smoothScrolling', label: 'Smooth Scrolling', desc: 'Animate scrolling', type: 'bool' },
    { k: 'mouseWheelZoom', label: 'Mouse Wheel Zoom', desc: 'Ctrl+wheel zooms the font', type: 'bool' },
  ]],
  ['Editing', [
    { k: 'tabSize', label: 'Tab Size', desc: 'Number of spaces per tab', type: 'num', min: 1, max: 8 },
    { k: 'insertSpaces', label: 'Insert Spaces', desc: 'Use spaces instead of tabs', type: 'bool' },
    { k: 'wordWrap', label: 'Word Wrap', desc: 'Wrap long lines', type: 'bool' },
    { k: 'autoClosingBrackets', label: 'Auto Close Brackets', desc: 'Auto insert closing brackets', type: 'bool' },
    { k: 'linkedEditing', label: 'Linked Editing', desc: 'Rename paired HTML tags together', type: 'bool' },
    { k: 'formatOnPaste', label: 'Format On Paste', desc: 'Format pasted content', type: 'bool' },
    { k: 'folding', label: 'Code Folding', desc: 'Enable folding', type: 'bool' },
    { k: 'scrollBeyondLastLine', label: 'Scroll Beyond Last Line', desc: 'Allow scrolling past the end', type: 'bool' },
    { k: 'bracketPairs', label: 'Bracket Pair Colorization', desc: 'Color matching brackets', type: 'bool' },
    { k: 'indentGuides', label: 'Indent Guides', desc: 'Show indentation guides', type: 'bool' },
    { k: 'stickyScroll', label: 'Sticky Scroll', desc: 'Pin scope headers when scrolling', type: 'bool' },
    { k: 'colorDecorators', label: 'Color Decorators', desc: 'Inline color swatches', type: 'bool' },
  ]],
  ['IntelliSense', [
    { k: 'quickSuggestions', label: 'Quick Suggestions', desc: 'Show suggestions while typing', type: 'bool' },
    { k: 'parameterHints', label: 'Parameter Hints', desc: 'Signature help popups', type: 'bool' },
    { k: 'typeCheck', label: 'TypeScript Semantic Checks', desc: 'Report type errors in Problems', type: 'bool' },
  ]],
  ['Files & Running', [
    { k: 'autoSave', label: 'Auto Save', desc: 'Save automatically after each change', type: 'bool' },
    { k: 'formatOnSave', label: 'Format On Save', desc: 'Format document when saving', type: 'bool' },
    { k: 'confirmDelete', label: 'Confirm Delete', desc: 'Ask before deleting files', type: 'bool' },
    { k: 'clearOutputOnRun', label: 'Clear Output On Run', desc: 'Clear the output before each run', type: 'bool' },
    { k: 'previewAutoRefresh', label: 'Preview Auto Refresh', desc: 'Refresh live preview on each change', type: 'bool' },
  ]],
];

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const ide = useIDE();
  const [q, setQ] = useState('');
  const [sec, setSec] = useState(SECTIONS[0][0]);
  const filtered = SECTIONS.map(([n, fs]) => [n, fs.filter((f) => !q || (f.label + f.desc + f.k).toLowerCase().includes(q.toLowerCase()))] as [string, Field[]]).filter(([n, fs]) => fs.length && (q || n === sec));
  const input = 'h-7 px-2 text-[13px] bg-[var(--input)] border border-[var(--border)] rounded-sm outline-none focus:border-[var(--accent)]';
  return (
    <Modal title="Settings" onClose={onClose} wide>
      <div className="p-3 border-b border-[var(--border)] flex gap-2">
        <div className="relative flex-1"><Search size={14} className="absolute left-2 top-2 text-[var(--muted)]" /><input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search settings" className={input + ' w-full pl-7'} /></div>
        <button onClick={() => { if (confirm('Reset all settings to defaults?')) Object.entries(DEFAULT_SETTINGS).forEach(([k, v]) => ide.setSetting(k as any, v as any)); }} className="flex items-center gap-1 px-3 text-[12px] rounded-sm border border-[var(--border)] hover:bg-[var(--hover)]"><RotateCcw size={13} /> Reset</button>
      </div>
      <div className="flex flex-1 min-h-0">
        {!q && (
          <div className="w-44 border-r border-[var(--border)] py-2 shrink-0">
            {SECTIONS.map(([n]) => <button key={n} onClick={() => setSec(n)} className={`block w-full text-left px-4 py-1.5 text-[13px] ${sec === n ? 'bg-[var(--accent)]/25 text-[var(--fg)]' : 'text-[var(--muted)] hover:text-[var(--fg)]'}`}>{n}</button>)}
          </div>
        )}
        <div className="flex-1 overflow-auto p-4 space-y-5">
          {filtered.map(([n, fs]) => (
            <div key={n}>
              <h3 className="text-[15px] font-semibold mb-2">{n}</h3>
              <div className="space-y-3">
                {fs.map((f) => {
                  const v = ide.settings[f.k] as any;
                  const changed = v !== (DEFAULT_SETTINGS as any)[f.k];
                  return (
                    <div key={f.k} className={`pl-3 border-l-2 ${changed ? 'border-[var(--accent)]' : 'border-transparent'}`}>
                      <div className="text-[13px] font-semibold">{f.label} <span className="font-mono text-[10px] text-[var(--muted)] font-normal">editor.{f.k}</span></div>
                      {f.type === 'bool' ? (
                        <label className="flex items-center gap-2 text-[12px] text-[var(--muted)] mt-1 cursor-pointer"><input type="checkbox" checked={v} onChange={() => ide.setSetting(f.k, !v as any)} className="accent-[var(--accent)]" /> {f.desc}</label>
                      ) : (
                        <>
                          <div className="text-[12px] text-[var(--muted)] mb-1">{f.desc}</div>
                          {f.type === 'select' && <select value={v} onChange={(e) => ide.setSetting(f.k, e.target.value as any)} className={input + ' min-w-[200px]'}>{f.opts!.map((o) => <option key={o} value={o}>{THEMES.find((t) => t.id === o)?.name ?? o}</option>)}</select>}
                          {f.type === 'num' && <input type="number" min={f.min} max={f.max} value={v} onChange={(e) => ide.setSetting(f.k, Math.max(f.min ?? 0, Math.min(f.max ?? 999, +e.target.value || 0)) as any)} className={input + ' w-24'} />}
                          {f.type === 'text' && <input value={v} onChange={(e) => ide.setSetting(f.k, e.target.value as any)} className={input + ' w-full'} />}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

const EDITOR_SHORTCUTS: [string, string][] = [
  ['Toggle line comment', 'Ctrl+/'], ['Toggle block comment', 'Shift+Alt+A'], ['Find', 'Ctrl+F'], ['Replace', 'Ctrl+H'],
  ['Add cursor above / below', 'Ctrl+Alt+↑/↓'], ['Select next occurrence', 'Ctrl+D'], ['Select all occurrences', 'Ctrl+Shift+L'],
  ['Move line up / down', 'Alt+↑/↓'], ['Copy line up / down', 'Shift+Alt+↑/↓'], ['Delete line', 'Ctrl+Shift+K'],
  ['Go to definition', 'F12'], ['Peek definition', 'Alt+F12'], ['Rename symbol', 'F2'], ['Go to symbol', 'Ctrl+Shift+O'],
  ['Trigger suggest', 'Ctrl+Space'], ['Quick fix', 'Ctrl+.'], ['Fold / Unfold', 'Ctrl+Shift+[ / ]'], ['Expand selection', 'Shift+Alt+→'],
  ['Column (box) selection', 'Shift+Alt+Drag'], ['Indent / Outdent', 'Tab / Shift+Tab'], ['Next problem', 'F8'],
];

export function ShortcutsModal({ onClose }: { onClose: () => void }) {
  const ide = useIDE();
  const [q, setQ] = useState('');
  const rows: [string, string, string][] = [
    ...ide.commands.filter((c) => c.key || c.hint).map((c) => [c.category, c.label, (c.key ?? c.hint)!] as [string, string, string]),
    ...EDITOR_SHORTCUTS.map(([l, k]) => ['Editor', l, k] as [string, string, string]),
  ].filter((r) => !q || r.join(' ').toLowerCase().includes(q.toLowerCase()));
  return (
    <Modal title="Keyboard Shortcuts" onClose={onClose} wide>
      <div className="p-3 border-b border-[var(--border)]"><input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type to search keybindings" className="w-full h-7 px-2 text-[13px] bg-[var(--input)] border border-[var(--border)] rounded-sm outline-none focus:border-[var(--accent)]" /></div>
      <div className="overflow-auto">
        <table className="w-full text-[13px]">
          <thead className="sticky top-0 bg-[var(--side)]"><tr className="text-left text-[11px] uppercase text-[var(--muted)]"><th className="px-4 py-1.5">Command</th><th className="px-4">Keybinding</th><th className="px-4">Category</th></tr></thead>
          <tbody>{rows.map((r, i) => <tr key={i} className="hover:bg-[var(--hover)] odd:bg-[var(--bg)]/40"><td className="px-4 py-1">{r[1]}</td><td className="px-4"><Kbd>{r[2]}</Kbd></td><td className="px-4 text-[var(--muted)]">{r[0]}</td></tr>)}</tbody>
        </table>
      </div>
    </Modal>
  );
}

export function PromptModal({ title, def, placeholder, onDone }: { title: string; def?: string; placeholder?: string; onDone: (v: string | null) => void }) {
  const [v, setV] = useState(def ?? '');
  return (
    <div className="fixed inset-0 z-[60] flex justify-center pt-[12vh]" onMouseDown={() => onDone(null)}>
      <div className="w-[520px] max-w-[92vw] h-fit p-2 rounded-lg shadow-2xl border border-[var(--border)] bg-[var(--side)]" onMouseDown={(e) => e.stopPropagation()}>
        <div className="text-[12px] text-[var(--muted)] px-1 pb-1.5">{title}</div>
        <input
          autoFocus
          value={v}
          placeholder={placeholder}
          onFocus={(e) => { const d = e.target.value.lastIndexOf('.'); const s = e.target.value.lastIndexOf('/') + 1; e.target.setSelectionRange(s, d > s ? d : e.target.value.length); }}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onDone(v); if (e.key === 'Escape') onDone(null); }}
          className="w-full h-8 px-2 text-[13px] bg-[var(--input)] border border-[var(--accent)] rounded-sm outline-none"
        />
        <div className="text-[11px] text-[var(--muted)] px-1 pt-1.5">Press Enter to confirm or Escape to cancel</div>
      </div>
    </div>
  );
}
