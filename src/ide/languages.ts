import type { Grammar } from './lang/grammar';
import { CODE_SPECS, type Category, type LangSpec } from './lang/specs-code';
import { FUNC_SPECS } from './lang/specs-func';
import { DATA_SPECS } from './lang/specs-data';
import { MORE_SPECS } from './lang/specs-more';

export type { Category };

export type RunKind =
  | 'js' | 'ts' | 'python' | 'sql' | 'json'
  | 'lua' | 'ruby' | 'php' | 'scheme' | 'prolog' | 'coffee' | 'brainfuck' | 'clojure' | 'wat'
  // preview kinds
  | 'html' | 'markdown' | 'svg' | 'css' | 'mermaid' | 'dot' | 'csv';

export interface LangDef {
  /** JotQoda language id (stable, used for overrides, snippets and templates) */
  id: string;
  name: string;
  exts: string[];
  color: string;
  label: string;
  runnable?: RunKind;
  /** line comment token */
  comment?: string;
  /** block comment delimiters */
  block?: [string, string];
  category: Category;
  /** Monaco language id that provides tokenisation */
  monaco: string;
  /** JotQoda grammar (custom languages only) */
  grammar?: Grammar;
  files: string[];
  interpreters: string[];
  aliases: string[];
  /** true when Monaco ships the tokenizer, false for JotQoda grammars */
  builtin: boolean;
}

export const PREVIEW_KINDS = new Set<RunKind>(['html', 'markdown', 'svg', 'css', 'mermaid', 'dot', 'csv']);

type BuiltinSpec = Omit<LangSpec, 'g'> & { runnable?: RunKind };

/** Languages whose tokenizer ships with Monaco (ids are Monaco ids unless `monaco` is set). */
const BUILTINS: BuiltinSpec[] = [
  { id: 'javascript', name: 'JavaScript', ext: 'js mjs cjs jsx es6 jsm jss jake gs.js', color: '#f7df1e', label: 'JS', runnable: 'js', comment: '//', block: ['/*', '*/'], cat: 'Web', sh: 'node nodejs bun qjs', files: 'jakefile' },
  { id: 'typescript', name: 'TypeScript', ext: 'ts tsx mts cts', color: '#3178c6', label: 'TS', runnable: 'ts', comment: '//', block: ['/*', '*/'], cat: 'Web', sh: 'ts-node tsx deno' },
  { id: 'python', name: 'Python', ext: 'py pyw pyi rpy gyp gypi wsgi pyt', color: '#4b8bbe', label: 'PY', runnable: 'python', comment: '#', cat: 'Scripting', sh: 'python pypy jython ipython pythonw', files: 'sconstruct sconscript wscript .pythonrc .pythonstartup' },
  { id: 'html', name: 'HTML', ext: 'html htm xhtml shtml jshtm inc.html', color: '#e34c26', label: '<>', runnable: 'html', block: ['<!--', '-->'], cat: 'Web' },
  { id: 'css', name: 'CSS', ext: 'css', color: '#563d7c', label: '#', runnable: 'css', block: ['/*', '*/'], cat: 'Web' },
  { id: 'scss', name: 'SCSS', ext: 'scss', color: '#c6538c', label: 'S', comment: '//', block: ['/*', '*/'], cat: 'Web' },
  { id: 'less', name: 'Less', ext: 'less', color: '#1d365d', label: 'L', comment: '//', block: ['/*', '*/'], cat: 'Web' },
  { id: 'json', name: 'JSON', ext: 'json jsonc babelrc eslintrc jshintrc jscsrc swcrc prettierrc code-workspace code-snippets webmanifest har geojson topojson gltf jsonld avsc tfstate arb mcmeta sarif ndjson.schema', color: '#cbcb41', label: '{}', runnable: 'json', cat: 'Data & Config', files: '.babelrc .eslintrc .prettierrc .stylelintrc .swcrc .jshintrc .jscsrc .watchmanconfig .luaurc composer.lock flake.lock deno.lock package.resolved .all-contributorsrc .releaserc .bowerrc .jsbeautifyrc .htmlhintrc .csslintrc .markdownlintrc .nycrc .tern-project' },
  { id: 'markdown', name: 'Markdown', ext: 'md markdown mdown mkd mkdn mdwn mdtxt mdtext ronn workbook', color: '#519aba', label: 'M↓', runnable: 'markdown', block: ['<!--', '-->'], cat: 'Markup & Docs', files: 'contents.lr' },
  { id: 'mdx', name: 'MDX', ext: 'mdx', color: '#f9ac00', label: 'MX', block: ['{/*', '*/}'], cat: 'Markup & Docs' },
  { id: 'sql', name: 'SQL', ext: 'sql sqlite ddl dml', color: '#e38c00', label: 'SQL', runnable: 'sql', comment: '--', block: ['/*', '*/'], cat: 'Query' },
  { id: 'mysql', name: 'MySQL', ext: 'mysql', color: '#00758f', label: 'My', comment: '--', block: ['/*', '*/'], cat: 'Query' },
  { id: 'pgsql', name: 'PostgreSQL', ext: 'pgsql psql plpgsql', color: '#336791', label: 'PG', comment: '--', block: ['/*', '*/'], cat: 'Query' },
  { id: 'redshift', name: 'Amazon Redshift', ext: 'redshift', color: '#8c4fff', label: 'RS', comment: '--', block: ['/*', '*/'], cat: 'Query' },
  { id: 'java', name: 'Java', ext: 'java jav jsh', color: '#b07219', label: 'J', comment: '//', block: ['/*', '*/'], cat: 'JVM', sh: 'java jshell' },
  { id: 'kotlin', name: 'Kotlin', ext: 'kt kts ktm', color: '#a97bff', label: 'KT', comment: '//', block: ['/*', '*/'], cat: 'JVM', sh: 'kotlin kotlinc' },
  { id: 'scala', name: 'Scala', ext: 'scala sc sbt mill', color: '#c22d40', label: 'SC', comment: '//', block: ['/*', '*/'], cat: 'JVM', sh: 'scala scala-cli amm' },
  { id: 'clojure', name: 'Clojure', ext: 'clj cljs cljc cljx cljd edn boot', color: '#db5855', label: 'CLJ', runnable: 'clojure', comment: ';', cat: 'Lisp', sh: 'clojure clj bb', files: '.lein bb.edn' },
  { id: 'c', name: 'C', ext: 'c h', color: '#555555', label: 'C', comment: '//', block: ['/*', '*/'], cat: 'Systems', monaco: 'cpp', sh: 'tcc' },
  { id: 'cpp', name: 'C++', ext: 'cpp cc cxx c++ hpp hh hxx h++ ipp tpp txx inl ixx cppm mpp ccm cxxm', color: '#f34b7d', label: 'C++', comment: '//', block: ['/*', '*/'], cat: 'Systems' },
  { id: 'objective-c', name: 'Objective-C', ext: 'm mm', color: '#438eff', label: 'OC', comment: '//', block: ['/*', '*/'], cat: 'Mobile' },
  { id: 'csharp', name: 'C#', ext: 'cs csx cake', color: '#178600', label: 'C#', comment: '//', block: ['/*', '*/'], cat: '.NET', sh: 'dotnet-script' },
  { id: 'fsharp', name: 'F#', ext: 'fs fsi fsx fsscript', color: '#b845fc', label: 'F#', comment: '//', block: ['(*', '*)'], cat: '.NET' },
  { id: 'vb', name: 'Visual Basic / VBA / VBScript', ext: 'vb vbs vba frm vbhtml', color: '#945db7', label: 'VB', comment: "'", cat: '.NET', sh: 'cscript wscript', aliases: 'vba vbscript' },
  { id: 'go', name: 'Go', ext: 'go', color: '#00add8', label: 'GO', comment: '//', block: ['/*', '*/'], cat: 'Systems', sh: 'gorun' },
  { id: 'rust', name: 'Rust', ext: 'rs', color: '#dea584', label: 'RS', comment: '//', block: ['/*', '*/'], cat: 'Systems', sh: 'rust-script cargo-script' },
  { id: 'swift', name: 'Swift', ext: 'swift', color: '#f05138', label: 'SW', comment: '//', block: ['/*', '*/'], cat: 'Mobile', sh: 'swift' },
  { id: 'dart', name: 'Dart', ext: 'dart', color: '#00b4ab', label: 'DT', comment: '//', block: ['/*', '*/'], cat: 'Mobile', sh: 'dart' },
  { id: 'php', name: 'PHP', ext: 'php php3 php4 php5 php7 php8 phtml phps ctp', color: '#777bb4', label: 'PHP', runnable: 'php', comment: '//', block: ['/*', '*/'], cat: 'Web', sh: 'php' },
  { id: 'ruby', name: 'Ruby', ext: 'rb rbw rake gemspec podspec rbx rjs ru jbuilder rabl thor god irbrc', color: '#cc342d', label: 'RB', runnable: 'ruby', comment: '#', cat: 'Scripting', sh: 'ruby jruby macruby rbx truffleruby', files: 'gemfile rakefile podfile vagrantfile brewfile fastfile appfile matchfile pluginfile snapfile scanfile gymfile deliverfile guardfile berksfile capfile dangerfile thorfile steepfile appraisals puppetfile .pryrc .irbrc .simplecov config.ru' },
  { id: 'perl', name: 'Perl', ext: 'pl pm t psgi cgi plx al ph', color: '#0298c3', label: 'PL', comment: '#', cat: 'Scripting', sh: 'perl', files: 'cpanfile rexfile makefile.pl build.pl' },
  { id: 'lua', name: 'Lua', ext: 'lua rockspec wlua p8 nse', color: '#000080', label: 'LUA', runnable: 'lua', comment: '--', block: ['--[[', ']]'], cat: 'Scripting', sh: 'lua luajit texlua', files: '.luacheckrc' },
  { id: 'r', name: 'R', ext: 'r rhistory rprofile rt', color: '#198ce7', label: 'R', comment: '#', cat: 'Scientific', sh: 'rscript r', files: '.rprofile .rhistory' },
  { id: 'julia', name: 'Julia', ext: 'jl', color: '#a270ba', label: 'JL', comment: '#', block: ['#=', '=#'], cat: 'Scientific', sh: 'julia' },
  { id: 'elixir', name: 'Elixir', ext: 'ex exs', color: '#6e4a7e', label: 'EX', comment: '#', cat: 'Functional', sh: 'elixir', files: 'mix.lock .formatter.exs .credo.exs' },
  { id: 'scheme', name: 'Scheme', ext: 'scm ss sch sld', color: '#1e4aec', label: 'λ', runnable: 'scheme', comment: ';', block: ['#|', '|#'], cat: 'Lisp', sh: 'scheme chicken csi chez petite gsi mit-scheme' },
  { id: 'coffeescript', name: 'CoffeeScript', ext: 'coffee cson iced', color: '#244776', label: 'CS', runnable: 'coffee', comment: '#', block: ['###', '###'], cat: 'Web', sh: 'coffee', files: 'cakefile' },
  { id: 'shell', name: 'Shell / Bash', ext: 'sh bash bats ebuild eclass command', color: '#89e051', label: '$_', comment: '#', cat: 'Shell', sh: 'sh bash dash ash busybox', aliases: 'bash sh', files: '.bashrc .bash_profile .bash_aliases .bash_logout .bash_login .profile .envrc pkgbuild apkbuild configure gradlew mvnw .xinitrc .xprofile .xsession' },
  { id: 'powershell', name: 'PowerShell', ext: 'ps1 psm1 psd1 pssc psrc', color: '#012456', label: 'PS', comment: '#', block: ['<#', '#>'], cat: 'Shell', sh: 'pwsh powershell' },
  { id: 'bat', name: 'Batch', ext: 'bat cmd btm', color: '#c1f12e', label: 'BAT', comment: 'REM', cat: 'Shell' },
  { id: 'yaml', name: 'YAML', ext: 'yml yaml cff sls eyaml reek rviz syntax sublime-syntax', color: '#cb171e', label: 'YML', comment: '#', cat: 'Data & Config', files: '.clang-format .clang-tidy .gemrc .yamllint .condarc yarn.lock podfile.lock .gitlab-ci.yml pubspec.lock' },
  { id: 'xml', name: 'XML', ext: 'xml xsd xsl xslt plist csproj vbproj fsproj vcxproj sqlproj props targets nuspec resx config wsdl rss atom opml kml gpx xliff xlf tmx mxml fxml storyboard xib manifest xul wxs wxi wxl jelly jrxml launch urdf musicxml glade ui tld rng iml dtd ent mod.xml', color: '#0060ac', label: 'XML', block: ['<!--', '-->'], cat: 'Data & Config' },
  { id: 'ini', name: 'INI / Config', ext: 'ini cfg conf cnf prefs inf url npmrc pylintrc flake8 coveragerc hgrc', color: '#9c4221', label: 'INI', comment: ';', cat: 'Data & Config', files: '.npmrc .yarnrc .flake8 .pylintrc .coveragerc .hgrc .isort.cfg php.ini my.cnf setup.cfg tox.ini mypy.ini pytest.ini .pypirc .wgetrc .curlrc' },
  { id: 'dockerfile', name: 'Dockerfile', ext: 'dockerfile containerfile', color: '#384d54', label: 'DK', comment: '#', cat: 'Build & DevOps', files: 'dockerfile containerfile dockerfile.* containerfile.* *.dockerfile' },
  { id: 'graphql', name: 'GraphQL', ext: 'graphql gql graphqls', color: '#e10098', label: 'GQL', comment: '#', cat: 'Query' },
  { id: 'protobuf', name: 'Protocol Buffers', ext: 'proto', color: '#4285f4', label: 'PB', comment: '//', block: ['/*', '*/'], cat: 'Data & Config', monaco: 'proto' },
  { id: 'hcl', name: 'HCL / Terraform', ext: 'tf tfvars hcl nomad tftpl', color: '#5c4ee5', label: 'TF', comment: '#', block: ['/*', '*/'], cat: 'Build & DevOps', files: '.terraformrc terraform.rc' },
  { id: 'solidity', name: 'Solidity', ext: 'sol', color: '#aa6746', label: 'SOL', comment: '//', block: ['/*', '*/'], cat: 'Smart Contracts', monaco: 'sol' },
  { id: 'aes', name: 'Sophia (æternity)', ext: 'aes', color: '#de3f6b', label: 'AES', comment: '//', block: ['/*', '*/'], cat: 'Smart Contracts' },
  { id: 'cameligo', name: 'CameLIGO', ext: 'mligo', color: '#0e74ff', label: 'CML', comment: '//', block: ['(*', '*)'], cat: 'Smart Contracts' },
  { id: 'pascaligo', name: 'PascaLIGO', ext: 'ligo', color: '#0e74ff', label: 'PLG', comment: '//', block: ['(*', '*)'], cat: 'Smart Contracts' },
  { id: 'pug', name: 'Pug', ext: 'pug jade', color: '#a86454', label: 'PUG', comment: '//', cat: 'Templating' },
  { id: 'handlebars', name: 'Handlebars', ext: 'hbs handlebars', color: '#f7931e', label: 'HBS', block: ['{{!--', '--}}'], cat: 'Templating' },
  { id: 'twig', name: 'Twig', ext: 'twig', color: '#c1d026', label: 'TW', block: ['{#', '#}'], cat: 'Templating' },
  { id: 'razor', name: 'Razor', ext: 'cshtml razor', color: '#512be4', label: 'RZ', block: ['@*', '*@'], cat: 'Templating' },
  { id: 'liquid', name: 'Liquid', ext: 'liquid html.liquid', color: '#67b8de', label: 'LQ', block: ['{% comment %}', '{% endcomment %}'], cat: 'Templating' },
  { id: 'freemarker2', name: 'FreeMarker', ext: 'ftl ftlh ftlx', color: '#0050b2', label: 'FTL', block: ['<#--', '-->'], cat: 'Templating' },
  { id: 'pascal', name: 'Pascal / Delphi', ext: 'pas pp dpr dpk lpr p', color: '#e3f171', label: 'PAS', comment: '//', block: ['{', '}'], cat: 'Legacy', sh: 'instantfpc' },
  { id: 'm3', name: 'Modula-3', ext: 'm3 i3 mg ig', color: '#223388', label: 'M3', block: ['(*', '*)'], cat: 'Legacy' },
  { id: 'tcl', name: 'Tcl', ext: 'tcl tk itcl tm', color: '#e4cc98', label: 'TCL', comment: '#', cat: 'Scripting', sh: 'tclsh wish' },
  { id: 'mips', name: 'Assembly (MIPS)', ext: 'mips spim', color: '#6e4c13', label: 'MIP', comment: '#', cat: 'Assembly' },
  { id: 'systemverilog', name: 'SystemVerilog', ext: 'sv svh svi', color: '#dae1c2', label: 'SV', comment: '//', block: ['/*', '*/'], cat: 'Hardware' },
  { id: 'verilog', name: 'Verilog', ext: 'v vh vlg', color: '#b2b7f8', label: 'V', comment: '//', block: ['/*', '*/'], cat: 'Hardware' },
  { id: 'wgsl', name: 'WGSL (WebGPU)', ext: 'wgsl', color: '#1a5e9a', label: 'WG', comment: '//', block: ['/*', '*/'], cat: 'Shaders & GPU' },
  { id: 'qsharp', name: 'Q#', ext: 'qs', color: '#fed659', label: 'Q#', comment: '//', cat: 'Scientific' },
  { id: 'redis', name: 'Redis', ext: 'redis', color: '#d82c20', label: 'RDS', cat: 'Query' },
  { id: 'cypher', name: 'Cypher (Neo4j)', ext: 'cypher cyp', color: '#34b3ed', label: 'CY', comment: '//', block: ['/*', '*/'], cat: 'Query' },
  { id: 'sparql', name: 'SPARQL', ext: 'rq sparql', color: '#0c4597', label: 'SPQ', comment: '#', cat: 'Query' },
  { id: 'apex', name: 'Apex', ext: 'cls trigger apex', color: '#1797c0', label: 'APX', comment: '//', block: ['/*', '*/'], cat: 'JVM' },
  { id: 'abap', name: 'ABAP', ext: 'abap', color: '#e8274b', label: 'ABP', comment: '"', cat: 'Legacy' },
  { id: 'azcli', name: 'Azure CLI', ext: 'azcli', color: '#0078d4', label: 'AZ', comment: '#', cat: 'Build & DevOps' },
  { id: 'bicep', name: 'Bicep', ext: 'bicep bicepparam', color: '#519aba', label: 'BCP', comment: '//', block: ['/*', '*/'], cat: 'Build & DevOps' },
  { id: 'restructuredtext', name: 'reStructuredText', ext: 'rst', color: '#141414', label: 'RST', comment: '..', cat: 'Markup & Docs' },
  { id: 'st', name: 'Structured Text (IEC 61131)', ext: 'st iecst iecplc', color: '#3f7fbf', label: 'ST', comment: '//', block: ['(*', '*)'], cat: 'Hardware' },
  { id: 'sb', name: 'Small Basic', ext: 'sb', color: '#5c2d91', label: 'SB', comment: "'", cat: 'Legacy' },
  { id: 'msdax', name: 'DAX', ext: 'dax msdax', color: '#f2c811', label: 'DAX', comment: '//', block: ['/*', '*/'], cat: 'Query' },
  { id: 'powerquery', name: 'Power Query (M)', ext: 'pq pqm', color: '#f2c811', label: 'PQ', comment: '//', block: ['/*', '*/'], cat: 'Query' },
  { id: 'typespec', name: 'TypeSpec', ext: 'tsp', color: '#4a3665', label: 'TSP', comment: '//', block: ['/*', '*/'], cat: 'Data & Config' },
  { id: 'csp', name: 'Content Security Policy', ext: 'csp', color: '#2c8ebb', label: 'CSP', cat: 'Web' },
  { id: 'ecl', name: 'ECL (HPCC)', ext: 'ecl', color: '#8a1267', label: 'ECL', comment: '//', block: ['/*', '*/'], cat: 'Query' },
  { id: 'flow9', name: 'Flow9', ext: 'flow', color: '#4b0082', label: 'FLW', comment: '//', block: ['/*', '*/'], cat: 'Application' },
  { id: 'lexon', name: 'Lexon', ext: 'lexon', color: '#1b8a5a', label: 'LXN', comment: 'COMMENT', cat: 'Smart Contracts' },
  { id: 'pla', name: 'PLA (Logic Array)', ext: 'pla', color: '#708090', label: 'PLA', comment: '#', cat: 'Hardware' },
  { id: 'postiats', name: 'ATS', ext: 'dats sats hats', color: '#1ac620', label: 'ATS', comment: '//', block: ['(*', '*)'], cat: 'Functional' },
];

const PLAIN_SPEC: BuiltinSpec = { id: 'plaintext', name: 'Plain Text', ext: 'txt text nfo diz', color: '#8a8a8a', label: 'TXT', cat: 'Other', files: 'license licence copying authors contributors notice changes readme .nvmrc .node-version .python-version .ruby-version .tool-versions .mailmap' };

const W = (s?: string) => (s ? s.trim().split(/\s+/).filter(Boolean) : []);

function toDef(s: LangSpec | BuiltinSpec, builtin: boolean): LangDef {
  const g = 'g' in s ? s.g : undefined;
  const line = s.comment ?? g?.line?.[0];
  const block = s.block ?? g?.block?.[0];
  return {
    id: s.id,
    name: s.name,
    exts: W(s.ext),
    color: s.color,
    label: s.label,
    runnable: (s as BuiltinSpec).runnable,
    comment: line,
    block,
    category: s.cat,
    monaco: s.monaco ?? s.id,
    grammar: g,
    files: W(s.files).map((f) => f.toLowerCase()),
    interpreters: W(s.sh),
    aliases: W(s.aliases),
    builtin: builtin || !!s.monaco,
  };
}

const CUSTOM_SPECS: LangSpec[] = [...CODE_SPECS, ...FUNC_SPECS, ...DATA_SPECS, ...MORE_SPECS];

// Runtimes / previews for custom languages
const CUSTOM_RUNNABLE: Record<string, RunKind> = { brainfuck: 'brainfuck', prolog: 'prolog', wat: 'wat', mermaid: 'mermaid', dot: 'dot', csv: 'csv', tsv: 'csv' };

const builtinDefs = BUILTINS.map((b) => toDef(b, true));
const customDefs = CUSTOM_SPECS.map((s) => {
  const d = toDef(s, false);
  if (CUSTOM_RUNNABLE[d.id]) d.runnable = CUSTOM_RUNNABLE[d.id];
  return d;
}).sort((a, b) => a.name.localeCompare(b.name));

export const PLAIN = toDef(PLAIN_SPEC, true);
const SVG: LangDef = { ...builtinDefs.find((l) => l.id === 'xml')!, id: 'svg', name: 'SVG', exts: ['svg', 'svgz'], label: 'SVG', color: '#ffb13b', runnable: 'svg', category: 'Web', monaco: 'xml', files: [], aliases: [] };

/** All languages. Plain text is always last. */
export const LANGUAGES: LangDef[] = [...builtinDefs, SVG, ...customDefs, PLAIN];

/** Languages highlighted by JotQoda grammars (need Monaco registration). */
export const CUSTOM_LANGS: LangDef[] = customDefs.filter((l) => l.grammar && !l.builtin);

export const CATEGORY_ORDER: Category[] = [
  'Web', 'Systems', 'Application', 'JVM', '.NET', 'Mobile', 'Scripting', 'Functional', 'Lisp', 'Logic', 'Scientific', 'Query',
  'Data & Config', 'Markup & Docs', 'Templating', 'Diagrams', 'Shell', 'Build & DevOps', 'Shaders & GPU', 'Hardware', 'Assembly',
  'Smart Contracts', 'Game Dev', 'Legacy', 'Esoteric', 'Other',
];

// ------------------------------------------------------------------ lookup tables
const byId = new Map<string, LangDef>();
const byExt = new Map<string, LangDef>();
const byFile = new Map<string, LangDef>();
const byPathSuffix: [string, LangDef][] = [];
const byGlob: [RegExp, LangDef][] = [];
const byInterpreter = new Map<string, LangDef>();

for (const l of LANGUAGES) {
  if (!byId.has(l.id)) byId.set(l.id, l);
  for (const e of l.exts) byExt.set(e.toLowerCase(), l);
  for (const f of l.files) {
    if (f.includes('/')) byPathSuffix.push([f, l]);
    else if (f.includes('*')) byGlob.push([new RegExp('^' + f.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$'), l]);
    else byFile.set(f, l);
  }
  for (const i of l.interpreters) if (!byInterpreter.has(i)) byInterpreter.set(i, l);
}
// Built-in extension owners that custom grammars must not steal
for (const [ext, id] of Object.entries({ h: 'c', v: 'verilog', m: 'objective-c', pl: 'perl', pp: 'pascal', cls: 'apex', md: 'markdown', r: 'r', ts: 'typescript', fs: 'fsharp', st: 'st', conf: 'ini' })) byExt.set(ext, byId.get(id)!);

export function getLangById(id: string): LangDef {
  return byId.get(id) ?? PLAIN;
}

const ext = (name: string) => (name.includes('.') ? name.slice(name.lastIndexOf('.') + 1) : '');

/** Content based disambiguation for extensions shared by several languages. */
function heuristics(e: string, l: LangDef, c: string): LangDef {
  const pick = (id: string) => byId.get(id) ?? l;
  const head = c.slice(0, 4000);
  switch (e) {
    case 'm':
      if (/^\s*(#import|#include|@interface|@implementation|@protocol)\b/m.test(head)) return l;
      if (/^\s*(function\b|%|classdef\b|end\s*$)|^\s*\w+\s*=.*;\s*(%.*)?$/m.test(head)) return pick('matlab');
      return l;
    case 'pl':
      if (/^\s*(use\s+(strict|warnings|v?\d)|my\s|sub\s+\w|package\s+[\w:]+;|#!.*perl)/m.test(head)) return l;
      if (/:-|^\s*[a-z]\w*(\([^)]*\))?\s*\.\s*$/m.test(head)) return pick('prolog');
      return l;
    case 'v':
      if (/\b(module\s+\w+\s*[(;#]|endmodule|always\s*@|assign\s)/.test(head)) return l;
      if (/\bfn\s+\w+\s*\(|^\s*module\s+main\b|^\s*import\s+\w+\s*$/m.test(head)) return pick('vlang');
      return l;
    case 'cl':
      return /^\s*\((def(un|macro|var|parameter|package|class)|in-package)\b/m.test(head) ? pick('commonlisp') : l;
    case 'pp':
      return /\b(class|define|node)\s+[\w:'"]+\s*(\(|\{|inherits)|\b(file|package|service|exec|user)\s*\{\s*['"$]|=>/.test(head) ? pick('puppet') : l;
    case 'cls':
      return /\\(ProvidesClass|NeedsTeXFormat|LoadClass|documentclass|DeclareOption)\b/.test(head) ? pick('latex') : l;
    case 'tpl':
      if (/\{\{/.test(head)) return l;
      return /\{\$|\{(if|foreach|include|assign|block|extends)\b/.test(head) ? pick('smarty') : l;
    case 'mod':
      if (/^\s*(set|param|var|minimize|maximize|subject\s+to|s\.t\.)\b/m.test(head)) return pick('ampl');
      return l;
    case 'h':
      if (/@interface|@property|#import\b/.test(head)) return pick('objective-c');
      if (/\b(class\s+\w+\s*[:{]|namespace\s+\w+|template\s*<|public:|private:|std::|#include\s*<(iostream|vector|string|memory|map)>)/.test(head)) return pick('cpp');
      return l;
    case 'st':
      if (/\b(PROGRAM|FUNCTION_BLOCK|END_PROGRAM|VAR|END_VAR|END_IF)\b/.test(head)) return l;
      return /\bsubclass:|\^\s*self\b|^\s*\|\s*\w+(\s+\w+)*\s*\|/m.test(head) ? pick('smalltalk') : l;
    case 'fs':
      if (/^\s*(let|open|module|type|namespace|member)\b/m.test(head)) return l;
      if (/#version|gl_FragColor|\buniform\s/.test(head)) return pick('glsl');
      if (/^\s*:\s+\S+|\s;\s*$/m.test(head)) return pick('forth');
      return l;
    case 'l':
      return /^\s*\(/m.test(head) && !/^%%\s*$/m.test(head) ? pick('commonlisp') : l;
    case 'g':
      return /^\s*(grammar|lexer\s+grammar|parser\s+grammar)\s+\w+\s*;/m.test(head) ? pick('antlr') : l;
    case 'd':
      return /^[\w./-]+\.o\s*:/m.test(head) ? pick('makefile') : l;
    case 'bas':
      return /^Attribute VB_Name/m.test(head) ? pick('vb') : l;
    case 'conf':
    case 'cfg':
      if (/^\s*(server|http|events|upstream|location)\s*(\S+\s*)?\{/m.test(head)) return pick('nginx');
      if (/<VirtualHost|^\s*(LoadModule|ServerName|DocumentRoot|RewriteEngine)\b/m.test(head)) return pick('apache');
      return l;
    case 'asm':
    case 's':
      if (/\$(t\d|s\d|a\d|v\d|zero|ra|sp)\b|\bsyscall\b.*\n?.*\bli\s+\$v0/.test(head)) return pick('mips');
      if (/\b(ecall|jal|auipc)\b|\b(a[0-7]|t[0-6])\s*,/.test(head)) return pick('riscv');
      if (/\b(ldr|str|bl|bx|svc|adrp)\b|\b[xw]\d{1,2}\s*,/.test(head)) return pick('armasm');
      if (/\b(ldi|rjmp|rcall|brne)\b|\.include\s+"m\d+/.test(head)) return pick('avrasm');
      return l;
    default:
      return l;
  }
}

/** Resolve language from a shebang line (#!/usr/bin/env python3 …). */
export function langFromShebang(content: string): LangDef | null {
  const m = /^#!\s*(\S+)(.*)$/m.exec(content.slice(0, 300));
  if (!m || content.indexOf('#!') !== 0) return null;
  let prog = m[1].split('/').pop()!;
  if (prog === 'env') {
    const args = m[2].trim().split(/\s+/).filter((a) => a && !a.startsWith('-') && !a.includes('='));
    prog = args[0] ?? '';
  }
  prog = prog.toLowerCase();
  const cands = [prog, prog.replace(/[\d.]+$/, ''), prog.replace(/-[\d.]+$/, '')];
  for (const c of cands) {
    const l = byInterpreter.get(c);
    if (l) return l;
  }
  return null;
}

const detected = new Map<string, string>();

/**
 * Detect the language of a file. Order: exact file name → path suffix → glob → (compound) extension
 * (with content heuristics for ambiguous extensions) → shebang → plain text.
 */
export function getLang(path: string, content?: string): LangDef {
  const name = (path.split('/').pop() ?? path).toLowerCase();
  if (content == null) {
    const d = detected.get(path);
    if (d) return byId.get(d) ?? PLAIN;
  }
  let result: LangDef | undefined = byFile.get(name);
  if (!result) {
    const lp = '/' + path.toLowerCase();
    result = byPathSuffix.find(([s]) => lp.endsWith('/' + s))?.[1];
  }
  if (!result) result = byGlob.find(([re]) => re.test(name))?.[1];
  if (!result) {
    const parts = name.split('.');
    for (let i = 1; i < parts.length && !result; i++) {
      const e = parts.slice(i).join('.');
      const l = byExt.get(e);
      if (l) result = content != null && i === parts.length - 1 ? heuristics(e, l, content) : l;
    }
    if (!result && name.startsWith('.')) result = byExt.get(name.slice(1));
  }
  if (!result && content) result = langFromShebang(content) ?? undefined;
  result = result ?? PLAIN;
  if (content != null) {
    if (result !== PLAIN || !ext(name)) detected.set(path, result.id);
  }
  return result;
}

/** Forget cached content-based detection for a path (after rename/delete). */
export function forgetDetectedLang(path: string) {
  detected.delete(path);
}

export function resolveLang(path: string, override: string | undefined, content?: string): LangDef {
  return override ? getLangById(override) : getLang(path, content);
}

export const RUNNABLE_INFO: Record<RunKind, string> = {
  js: 'Runs in an isolated Web Worker (CommonJS/ESM imports between workspace files supported)',
  ts: 'Transpiled by the TypeScript compiler, then executed in a Web Worker',
  python: 'Runs on CPython (Pyodide / WebAssembly). Auto-loads numpy, pandas, etc. from imports',
  sql: 'Executed on SQLite (sql.js / WebAssembly) — results rendered as tables',
  json: 'Validated & pretty printed',
  lua: 'Runs on Lua 5.4 compiled to WebAssembly (wasmoon) in a Web Worker',
  ruby: 'Runs on CRuby 3.4 (ruby.wasm / WebAssembly) in a Web Worker — first run downloads ~30 MB',
  php: 'Runs on PHP 8.4 (php-wasm / WebAssembly) in a Web Worker — first run downloads ~15 MB',
  scheme: 'Runs on BiwaScheme (R7RS subset) in a Web Worker',
  prolog: 'Runs on Tau Prolog in a Web Worker — `:- initialization(main).`, `?- goal.` lines or main/0 are executed',
  coffee: 'Compiled by the official CoffeeScript compiler, then executed in the JavaScript worker',
  brainfuck: 'Interpreted in a Web Worker (30,000 cells, 8-bit wrap-around, `,` reads from the input box)',
  clojure: 'Runs on SCI via Scittle (ClojureScript interpreter) in a sandboxed iframe',
  wat: 'Compiled with wabt.js and instantiated with WebAssembly — exports are called and logged',
  html: 'Live preview with linked CSS/JS from the workspace inlined',
  markdown: 'Rendered markdown preview (with Mermaid diagrams)',
  svg: 'Rendered SVG preview',
  css: 'Validated through the preview pane',
  mermaid: 'Rendered diagram preview (Mermaid)',
  dot: 'Rendered graph preview (Graphviz / viz.js)',
  csv: 'Rendered as a sortable table preview',
};

/** True when the language really executes in the browser (not just a preview or JSON validation). */
export const isExecutable = (l: LangDef) => !!l.runnable && !PREVIEW_KINDS.has(l.runnable) && l.runnable !== 'json';
export const RUNNABLE_LANGS = LANGUAGES.filter(isExecutable);
