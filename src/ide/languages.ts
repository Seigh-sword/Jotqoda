export interface LangDef {
  id: string; // monaco language id
  name: string;
  exts: string[];
  color: string;
  label: string;
  runnable?: 'js' | 'ts' | 'python' | 'sql' | 'html' | 'markdown' | 'json' | 'svg' | 'css';
  comment?: string;
}

export const LANGUAGES: LangDef[] = [
  { id: 'javascript', name: 'JavaScript', exts: ['js', 'mjs', 'cjs', 'jsx'], color: '#f7df1e', label: 'JS', runnable: 'js', comment: '//' },
  { id: 'typescript', name: 'TypeScript', exts: ['ts', 'tsx', 'mts', 'cts'], color: '#3178c6', label: 'TS', runnable: 'ts', comment: '//' },
  { id: 'python', name: 'Python', exts: ['py', 'pyw', 'pyi'], color: '#4b8bbe', label: 'PY', runnable: 'python', comment: '#' },
  { id: 'html', name: 'HTML', exts: ['html', 'htm', 'xhtml'], color: '#e34c26', label: '<>', runnable: 'html' },
  { id: 'css', name: 'CSS', exts: ['css'], color: '#563d7c', label: '#', runnable: 'css' },
  { id: 'scss', name: 'SCSS', exts: ['scss'], color: '#c6538c', label: 'S' },
  { id: 'less', name: 'Less', exts: ['less'], color: '#1d365d', label: 'L' },
  { id: 'json', name: 'JSON', exts: ['json', 'jsonc', 'babelrc', 'eslintrc'], color: '#cbcb41', label: '{}', runnable: 'json' },
  { id: 'markdown', name: 'Markdown', exts: ['md', 'markdown', 'mdown'], color: '#519aba', label: 'M↓', runnable: 'markdown' },
  { id: 'mdx', name: 'MDX', exts: ['mdx'], color: '#f9ac00', label: 'MX' },
  { id: 'sql', name: 'SQL', exts: ['sql', 'sqlite'], color: '#e38c00', label: 'SQL', runnable: 'sql', comment: '--' },
  { id: 'mysql', name: 'MySQL', exts: ['mysql'], color: '#00758f', label: 'My' },
  { id: 'pgsql', name: 'PostgreSQL', exts: ['pgsql', 'psql'], color: '#336791', label: 'PG' },
  { id: 'java', name: 'Java', exts: ['java'], color: '#b07219', label: 'J', comment: '//' },
  { id: 'kotlin', name: 'Kotlin', exts: ['kt', 'kts'], color: '#a97bff', label: 'KT', comment: '//' },
  { id: 'scala', name: 'Scala', exts: ['scala', 'sc'], color: '#c22d40', label: 'SC', comment: '//' },
  { id: 'c', name: 'C', exts: ['c', 'h'], color: '#555555', label: 'C', comment: '//' },
  { id: 'cpp', name: 'C++', exts: ['cpp', 'cc', 'cxx', 'hpp', 'hh', 'hxx', 'ino'], color: '#f34b7d', label: 'C++', comment: '//' },
  { id: 'csharp', name: 'C#', exts: ['cs', 'csx'], color: '#178600', label: 'C#', comment: '//' },
  { id: 'fsharp', name: 'F#', exts: ['fs', 'fsi', 'fsx'], color: '#b845fc', label: 'F#' },
  { id: 'vb', name: 'Visual Basic', exts: ['vb', 'vbs'], color: '#945db7', label: 'VB' },
  { id: 'go', name: 'Go', exts: ['go'], color: '#00add8', label: 'GO', comment: '//' },
  { id: 'rust', name: 'Rust', exts: ['rs'], color: '#dea584', label: 'RS', comment: '//' },
  { id: 'swift', name: 'Swift', exts: ['swift'], color: '#f05138', label: 'SW', comment: '//' },
  { id: 'objective-c', name: 'Objective-C', exts: ['m', 'mm'], color: '#438eff', label: 'OC' },
  { id: 'dart', name: 'Dart', exts: ['dart'], color: '#00b4ab', label: 'DT', comment: '//' },
  { id: 'php', name: 'PHP', exts: ['php', 'phtml'], color: '#777bb4', label: 'PHP', comment: '//' },
  { id: 'ruby', name: 'Ruby', exts: ['rb', 'gemspec', 'rake'], color: '#cc342d', label: 'RB', comment: '#' },
  { id: 'perl', name: 'Perl', exts: ['pl', 'pm'], color: '#0298c3', label: 'PL', comment: '#' },
  { id: 'lua', name: 'Lua', exts: ['lua'], color: '#000080', label: 'LUA', comment: '--' },
  { id: 'r', name: 'R', exts: ['r', 'rmd'], color: '#198ce7', label: 'R', comment: '#' },
  { id: 'julia', name: 'Julia', exts: ['jl'], color: '#a270ba', label: 'JL', comment: '#' },
  { id: 'elixir', name: 'Elixir', exts: ['ex', 'exs'], color: '#6e4a7e', label: 'EX', comment: '#' },
  { id: 'clojure', name: 'Clojure', exts: ['clj', 'cljs', 'cljc', 'edn'], color: '#db5855', label: 'CLJ' },
  { id: 'scheme', name: 'Scheme', exts: ['scm', 'ss'], color: '#1e4aec', label: 'λ' },
  { id: 'coffeescript', name: 'CoffeeScript', exts: ['coffee'], color: '#244776', label: 'CS' },
  { id: 'shell', name: 'Shell / Bash', exts: ['sh', 'bash', 'zsh', 'fish'], color: '#89e051', label: '$_', comment: '#' },
  { id: 'powershell', name: 'PowerShell', exts: ['ps1', 'psm1', 'psd1'], color: '#012456', label: 'PS', comment: '#' },
  { id: 'bat', name: 'Batch', exts: ['bat', 'cmd'], color: '#c1f12e', label: 'BAT' },
  { id: 'yaml', name: 'YAML', exts: ['yml', 'yaml'], color: '#cb171e', label: 'YML', comment: '#' },
  { id: 'xml', name: 'XML', exts: ['xml', 'xsd', 'xsl', 'plist', 'csproj', 'svg'], color: '#0060ac', label: 'XML' },
  { id: 'ini', name: 'INI / TOML', exts: ['ini', 'toml', 'cfg', 'conf', 'properties', 'env'], color: '#9c4221', label: 'INI' },
  { id: 'dockerfile', name: 'Dockerfile', exts: ['dockerfile'], color: '#384d54', label: 'DK' },
  { id: 'graphql', name: 'GraphQL', exts: ['graphql', 'gql'], color: '#e10098', label: 'GQL' },
  { id: 'protobuf', name: 'Protobuf', exts: ['proto'], color: '#4285f4', label: 'PB' },
  { id: 'hcl', name: 'HCL / Terraform', exts: ['tf', 'hcl', 'tfvars'], color: '#5c4ee5', label: 'TF' },
  { id: 'solidity', name: 'Solidity', exts: ['sol'], color: '#aa6746', label: 'SOL' },
  { id: 'pug', name: 'Pug', exts: ['pug', 'jade'], color: '#a86454', label: 'PUG' },
  { id: 'handlebars', name: 'Handlebars', exts: ['hbs', 'handlebars'], color: '#f7931e', label: 'HBS' },
  { id: 'twig', name: 'Twig', exts: ['twig'], color: '#c1d026', label: 'TW' },
  { id: 'razor', name: 'Razor', exts: ['cshtml', 'razor'], color: '#512be4', label: 'RZ' },
  { id: 'liquid', name: 'Liquid', exts: ['liquid'], color: '#67b8de', label: 'LQ' },
  { id: 'pascal', name: 'Pascal', exts: ['pas', 'pp', 'dpr'], color: '#e3f171', label: 'PAS' },
  { id: 'tcl', name: 'Tcl', exts: ['tcl'], color: '#e4cc98', label: 'TCL' },
  { id: 'mips', name: 'MIPS Assembly', exts: ['s', 'asm', 'mips'], color: '#6e4c13', label: 'ASM' },
  { id: 'systemverilog', name: 'SystemVerilog', exts: ['sv', 'svh', 'v'], color: '#dae1c2', label: 'SV' },
  { id: 'wgsl', name: 'WGSL', exts: ['wgsl'], color: '#1a5e9a', label: 'WG' },
  { id: 'qsharp', name: 'Q#', exts: ['qs'], color: '#fed659', label: 'Q#' },
  { id: 'redis', name: 'Redis', exts: ['redis'], color: '#d82c20', label: 'RDS' },
  { id: 'cypher', name: 'Cypher', exts: ['cypher', 'cyp'], color: '#34b3ed', label: 'CY' },
  { id: 'sparql', name: 'SPARQL', exts: ['rq', 'sparql'], color: '#0c4597', label: 'SPQ' },
  { id: 'apex', name: 'Apex', exts: ['cls', 'trigger'], color: '#1797c0', label: 'APX' },
  { id: 'abap', name: 'ABAP', exts: ['abap'], color: '#e8274b', label: 'ABP' },
  { id: 'azcli', name: 'Azure CLI', exts: ['azcli'], color: '#0078d4', label: 'AZ' },
  { id: 'bicep', name: 'Bicep', exts: ['bicep'], color: '#519aba', label: 'BCP' },
  { id: 'restructuredtext', name: 'reStructuredText', exts: ['rst'], color: '#141414', label: 'RST' },
  { id: 'st', name: 'Structured Text', exts: ['st', 'iecst'], color: '#3f7fbf', label: 'ST' },
  { id: 'sb', name: 'Small Basic', exts: ['sb'], color: '#5c2d91', label: 'SB' },
  { id: 'msdax', name: 'DAX', exts: ['dax', 'msdax'], color: '#f2c811', label: 'DAX' },
  { id: 'powerquery', name: 'Power Query', exts: ['pq', 'pqm'], color: '#f2c811', label: 'PQ' },
  { id: 'typespec', name: 'TypeSpec', exts: ['tsp'], color: '#4a3665', label: 'TSP' },
  { id: 'freemarker2', name: 'FreeMarker', exts: ['ftl'], color: '#0050b2', label: 'FTL' },
  { id: 'plaintext', name: 'Plain Text', exts: ['txt', 'log', 'text', 'gitignore', 'license'], color: '#8a8a8a', label: 'TXT' },
];

const byExt = new Map<string, LangDef>();
LANGUAGES.forEach((l) => l.exts.forEach((e) => byExt.set(e, l)));

export const PLAIN = LANGUAGES[LANGUAGES.length - 1];

export function getLang(path: string): LangDef {
  const name = path.split('/').pop()!.toLowerCase();
  if (name === 'dockerfile') return LANGUAGES.find((l) => l.id === 'dockerfile')!;
  if (name === 'makefile') return { ...PLAIN, name: 'Makefile', label: 'MK', color: '#427819' };
  if (name.endsWith('.svg')) return { ...LANGUAGES.find((l) => l.id === 'xml')!, name: 'SVG', label: 'SVG', color: '#ffb13b', runnable: 'svg' };
  const ext = name.includes('.') ? name.split('.').pop()! : name.replace(/^\./, '');
  return byExt.get(ext) ?? PLAIN;
}

export function getLangById(id: string): LangDef {
  return LANGUAGES.find((l) => l.id === id) ?? PLAIN;
}

export const RUNNABLE_INFO: Record<string, string> = {
  js: 'Runs in an isolated Web Worker (CommonJS/ESM imports between workspace files supported)',
  ts: 'Transpiled by the TypeScript compiler, then executed in a Web Worker',
  python: 'Runs on CPython (Pyodide / WebAssembly). Auto-loads numpy, pandas, etc. from imports',
  sql: 'Executed on SQLite (sql.js / WebAssembly) — results rendered as tables',
  html: 'Live preview with linked CSS/JS from the workspace inlined',
  markdown: 'Rendered markdown preview',
  json: 'Validated & pretty printed',
  svg: 'Rendered SVG preview',
  css: 'Validated through the preview pane',
};
