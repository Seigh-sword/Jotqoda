import { useState } from 'react';
import { Play, Square, Search, Plus, Trash2, Zap, Check, Braces, Rows3, Pin, Grid2x2, Sparkles, Save, Link2, MousePointerClick, Tags, Palette, WrapText, Type, ZoomIn, Sigma, ChevronsDownUp, Download, Star } from 'lucide-react';
import { useIDE, basename, dirname, type Settings } from '../ide/types';
import { getLang, RUNNABLE_INFO, LANGUAGES } from '../ide/languages';
import { FileIcon } from './FileIcon';

export const SNIPPETS: Record<string, { prefix: string; label: string; body: string }[]> = {
  javascript: [
    { prefix: 'log', label: 'console.log', body: "console.log('${1:label}', ${2:value});" },
    { prefix: 'afn', label: 'Arrow function', body: 'const ${1:name} = (${2:params}) => {\n\t$0\n};' },
    { prefix: 'asyncfn', label: 'Async function', body: 'async function ${1:name}(${2:params}) {\n\ttry {\n\t\t$0\n\t} catch (err) {\n\t\tconsole.error(err);\n\t}\n}' },
    { prefix: 'fetchjson', label: 'Fetch JSON', body: "const res = await fetch('${1:https://api.example.com}');\nif (!res.ok) throw new Error(res.statusText);\nconst ${2:data} = await res.json();" },
    { prefix: 'class', label: 'Class', body: 'class ${1:Name} {\n\tconstructor(${2:args}) {\n\t\t$0\n\t}\n}' },
    { prefix: 'forof', label: 'for…of loop', body: 'for (const ${1:item} of ${2:items}) {\n\t$0\n}' },
    { prefix: 'reduce', label: 'Array reduce', body: 'const ${1:result} = ${2:arr}.reduce((acc, ${3:x}) => {\n\t$0\n\treturn acc;\n}, ${4:{}});' },
    { prefix: 'debounce', label: 'Debounce helper', body: 'function debounce(fn, ms = ${1:300}) {\n\tlet t;\n\treturn (...args) => {\n\t\tclearTimeout(t);\n\t\tt = setTimeout(() => fn(...args), ms);\n\t};\n}' },
    { prefix: 'sleep', label: 'Sleep promise', body: 'const sleep = (ms) => new Promise((r) => setTimeout(r, ms));' },
    { prefix: 'trycatch', label: 'try / catch', body: 'try {\n\t$1\n} catch (${2:err}) {\n\tconsole.error($2);\n}' },
    { prefix: 'iife', label: 'Async IIFE', body: '(async () => {\n\t$0\n})();' },
    { prefix: 'rfc', label: 'React component', body: "export function ${1:Component}({ ${2:props} }) {\n\tconst [${3:state}, set${4:State}] = useState(${5:null});\n\treturn <div>$0</div>;\n}" },
  ],
  python: [
    { prefix: 'def', label: 'Function', body: 'def ${1:name}(${2:args}):\n\t"""${3:Docstring}"""\n\t$0' },
    { prefix: 'class', label: 'Class', body: 'class ${1:Name}:\n\tdef __init__(self, ${2:args}):\n\t\t$0' },
    { prefix: 'dataclass', label: 'Dataclass', body: 'from dataclasses import dataclass\n\n@dataclass\nclass ${1:Name}:\n\t${2:field}: ${3:str}' },
    { prefix: 'main', label: 'Main guard', body: 'if __name__ == "__main__":\n\t${1:main()}' },
    { prefix: 'lc', label: 'List comprehension', body: '[${1:x} for ${1:x} in ${2:items} if ${3:cond}]' },
    { prefix: 'with', label: 'With open', body: "with open('${1:file.txt}', '${2:r}') as f:\n\t${3:data = f.read()}" },
    { prefix: 'try', label: 'try / except', body: 'try:\n\t$1\nexcept ${2:Exception} as e:\n\tprint(e)' },
    { prefix: 'timeit', label: 'Timer', body: 'import time\nstart = time.perf_counter()\n$0\nprint(f"Elapsed: {time.perf_counter() - start:.4f}s")' },
  ],
  html: [
    { prefix: '!', label: 'HTML5 boilerplate', body: '<!DOCTYPE html>\n<html lang="en">\n<head>\n\t<meta charset="UTF-8" />\n\t<meta name="viewport" content="width=device-width, initial-scale=1.0" />\n\t<title>${1:Document}</title>\n</head>\n<body>\n\t$0\n</body>\n</html>' },
    { prefix: 'link', label: 'Stylesheet link', body: '<link rel="stylesheet" href="${1:style.css}" />' },
    { prefix: 'script', label: 'Script tag', body: '<script src="${1:app.js}"></script>' },
    { prefix: 'form', label: 'Form', body: '<form>\n\t<label for="${1:name}">${2:Name}</label>\n\t<input id="$1" name="$1" type="${3:text}" />\n\t<button type="submit">Submit</button>\n</form>' },
    { prefix: 'table', label: 'Table', body: '<table>\n\t<thead><tr><th>${1:Header}</th></tr></thead>\n\t<tbody><tr><td>${2:Cell}</td></tr></tbody>\n</table>' },
    { prefix: 'tw', label: 'Tailwind CDN', body: '<script src="https://cdn.tailwindcss.com"></script>' },
  ],
  css: [
    { prefix: 'center', label: 'Flex center', body: 'display: flex;\nalign-items: center;\njustify-content: center;' },
    { prefix: 'grid', label: 'Responsive grid', body: 'display: grid;\ngrid-template-columns: repeat(auto-fill, minmax(${1:200px}, 1fr));\ngap: ${2:1rem};' },
    { prefix: 'media', label: 'Media query', body: '@media (max-width: ${1:768px}) {\n\t$0\n}' },
    { prefix: 'keyframes', label: 'Keyframes', body: '@keyframes ${1:fade} {\n\tfrom { opacity: 0; }\n\tto { opacity: 1; }\n}' },
    { prefix: 'glass', label: 'Glassmorphism', body: 'background: rgba(255, 255, 255, 0.08);\nbackdrop-filter: blur(12px);\nborder: 1px solid rgba(255, 255, 255, 0.15);\nborder-radius: 16px;' },
  ],
  sql: [
    { prefix: 'sel', label: 'SELECT', body: 'SELECT ${1:*}\nFROM ${2:table}\nWHERE ${3:condition};' },
    { prefix: 'join', label: 'INNER JOIN', body: 'SELECT a.*, b.*\nFROM ${1:a}\nJOIN ${2:b} ON b.${3:a_id} = a.id;' },
    { prefix: 'ct', label: 'CREATE TABLE', body: 'CREATE TABLE ${1:name} (\n\tid INTEGER PRIMARY KEY,\n\t${2:col} TEXT NOT NULL\n);' },
    { prefix: 'ins', label: 'INSERT', body: 'INSERT INTO ${1:table} (${2:cols}) VALUES (${3:vals});' },
    { prefix: 'cte', label: 'WITH (CTE)', body: 'WITH ${1:cte} AS (\n\t${2:SELECT 1}\n)\nSELECT * FROM $1;' },
  ],
  go: [
    { prefix: 'func', label: 'Function', body: 'func ${1:name}(${2:args}) ${3:error} {\n\t$0\n}' },
    { prefix: 'iferr', label: 'if err != nil', body: 'if err != nil {\n\treturn ${1:err}\n}' },
  ],
  rust: [
    { prefix: 'fn', label: 'Function', body: 'fn ${1:name}(${2:args}) -> ${3:()} {\n\t$0\n}' },
    { prefix: 'struct', label: 'Struct', body: '#[derive(Debug, Clone)]\nstruct ${1:Name} {\n\t${2:field}: ${3:String},\n}' },
  ],
  java: [
    { prefix: 'psvm', label: 'main method', body: 'public static void main(String[] args) {\n\t$0\n}' },
    { prefix: 'sout', label: 'System.out.println', body: 'System.out.println(${1});' },
  ],
};
SNIPPETS.typescript = [
  ...SNIPPETS.javascript,
  { prefix: 'interface', label: 'Interface', body: 'interface ${1:Name} {\n\t${2:key}: ${3:string};\n}' },
  { prefix: 'type', label: 'Type alias', body: 'type ${1:Name} = ${2:string};' },
  { prefix: 'enum', label: 'Enum', body: 'enum ${1:Name} {\n\t${2:A},\n\t${3:B},\n}' },
  { prefix: 'generic', label: 'Generic function', body: 'function ${1:name}<T>(${2:arg}: T): T {\n\treturn $2;\n}' },
];

export function insertSnippet(ide: ReturnType<typeof useIDE>, body: string) {
  const ed = ide.getEditor();
  if (!ed) return ide.toast('Open a file first', 'warn');
  ed.focus();
  const ctrl = ed.getContribution('snippetController2');
  if (ctrl) ctrl.insert(body);
  else ed.executeEdits('snip', [{ range: ed.getSelection(), text: body.replace(/\$\{\d+:?([^}]*)\}|\$\d/g, '$1') }]);
}

const CUSTOM_KEY = 'jotqoda-snippets';
export const loadCustomSnippets = (): { prefix: string; label: string; body: string; lang: string }[] => {
  try { return JSON.parse(localStorage.getItem(CUSTOM_KEY) || '[]'); } catch { return []; }
};

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
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(next));
    ide.toast('Snippet saved', 'success');
  };
  const del = (label: string) => {
    const next = custom.filter((c) => !(c.label === label && c.lang === cur));
    setCustom(next);
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(next));
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
  const lang = file ? getLang(file) : null;
  const runnable = Object.keys(ide.files).filter((p) => getLang(p).runnable && getLang(p).runnable !== 'css');
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
            {lang.runnable ? RUNNABLE_INFO[lang.runnable] : `No in-browser runtime for ${lang.name}. Full editing, highlighting, snippets & formatting are available. Executable runtimes: JS, TS, Python, SQL, HTML, Markdown, SVG, JSON.`}
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

const EXTENSIONS: { k: keyof Settings; name: string; author: string; desc: string; icon: any; color: string; installs: string }[] = [
  { k: 'bracketPairs', name: 'Bracket Pair Colorizer', author: 'jotqoda', desc: 'Colorizes matching brackets for readability', icon: Braces, color: '#f59e0b', installs: '12.4M' },
  { k: 'minimap', name: 'Minimap', author: 'jotqoda', desc: 'Bird’s-eye code overview on the right', icon: Rows3, color: '#3b82f6', installs: '9.1M' },
  { k: 'stickyScroll', name: 'Sticky Scroll', author: 'jotqoda', desc: 'Keeps current scope headers pinned while scrolling', icon: Pin, color: '#ef4444', installs: '5.6M' },
  { k: 'indentGuides', name: 'Indent Rainbow Guides', author: 'jotqoda', desc: 'Vertical indentation guides', icon: Grid2x2, color: '#10b981', installs: '8.8M' },
  { k: 'formatOnSave', name: 'Prettier — Format on Save', author: 'jotqoda', desc: 'Auto-formats documents on Ctrl+S', icon: Sparkles, color: '#c596c7', installs: '41.2M' },
  { k: 'autoSave', name: 'Auto Save', author: 'jotqoda', desc: 'Persists every keystroke automatically', icon: Save, color: '#6366f1', installs: '7.2M' },
  { k: 'ligatures', name: 'Font Ligatures', author: 'jotqoda', desc: 'Beautiful programming ligatures (=>, !==, >=)', icon: Link2, color: '#ec4899', installs: '3.3M' },
  { k: 'smoothCaret', name: 'Smooth Caret', author: 'jotqoda', desc: 'Animated cursor movement', icon: MousePointerClick, color: '#14b8a6', installs: '2.1M' },
  { k: 'linkedEditing', name: 'Auto Rename Tag', author: 'jotqoda', desc: 'Renames paired HTML/XML tags together', icon: Tags, color: '#e34c26', installs: '18.9M' },
  { k: 'colorDecorators', name: 'Color Highlight', author: 'jotqoda', desc: 'Inline color swatches & picker for CSS colors', icon: Palette, color: '#8b5cf6', installs: '6.4M' },
  { k: 'wordWrap', name: 'Word Wrap', author: 'jotqoda', desc: 'Wraps long lines to the viewport', icon: WrapText, color: '#0ea5e9', installs: '4.0M' },
  { k: 'typeCheck', name: 'TypeScript Diagnostics', author: 'jotqoda', desc: 'Semantic type checking for JS/TS', icon: Type, color: '#3178c6', installs: '30.5M' },
  { k: 'mouseWheelZoom', name: 'Mouse Wheel Zoom', author: 'jotqoda', desc: 'Ctrl + scroll to zoom the editor', icon: ZoomIn, color: '#84cc16', installs: '1.2M' },
  { k: 'parameterHints', name: 'Parameter Hints', author: 'jotqoda', desc: 'Signature help while typing function calls', icon: Sigma, color: '#f97316', installs: '11.0M' },
  { k: 'folding', name: 'Code Folding', author: 'jotqoda', desc: 'Collapse regions & blocks', icon: ChevronsDownUp, color: '#64748b', installs: '15.7M' },
];

export function ExtensionsView() {
  const ide = useIDE();
  const [q, setQ] = useState('');
  const list = EXTENSIONS.filter((e) => (e.name + e.desc).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="flex flex-col h-full text-[13px]">
      <div className="p-2"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Extensions" className="w-full h-7 px-2 bg-[var(--input)] border border-[var(--border)] rounded-sm outline-none focus:border-[var(--accent)]" /></div>
      <div className="px-2 h-6 flex items-center text-[11px] font-bold uppercase tracking-wide">Built-in · {EXTENSIONS.filter((e) => ide.settings[e.k]).length} enabled</div>
      <div className="flex-1 overflow-auto">
        {list.map((e) => {
          const on = !!ide.settings[e.k];
          const Icon = e.icon;
          return (
            <div key={e.k} className="flex gap-2.5 px-3 py-2 hover:bg-[var(--hover)]">
              <div className="w-10 h-10 rounded-md shrink-0 flex items-center justify-center" style={{ background: e.color + '30', color: e.color }}><Icon size={19} /></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1"><span className="font-semibold truncate">{e.name}</span>{on && <Check size={12} className="text-emerald-400" />}</div>
                <div className="text-[11px] text-[var(--muted)] truncate">{e.desc}</div>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-[var(--muted)]">
                  <span className="inline-flex items-center gap-1"><Download size={11} /> {e.installs}</span>
                  <span className="inline-flex items-center gap-0.5 text-amber-400" title="5 stars">{[0, 1, 2, 3, 4].map((i) => <Star key={i} size={10} fill="currentColor" />)}</span>
                  <button onClick={() => { ide.setSetting(e.k, !on as any); ide.toast(`${e.name} ${on ? 'disabled' : 'enabled'}`); }} className={`ml-auto px-2 py-0.5 rounded-sm text-[11px] ${on ? 'border border-[var(--border)] hover:bg-[var(--input)]' : 'bg-[var(--accent)] text-white'}`}>{on ? 'Disable' : 'Enable'}</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
