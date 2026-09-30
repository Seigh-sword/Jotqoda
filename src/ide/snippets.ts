/** Built-in snippet library (shown in IntelliSense and the Snippets view). */
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


type Snip = { prefix: string; label: string; body: string };
const s = (prefix: string, label: string, body: string): Snip => ({ prefix, label, body });

/** Snippets for additional languages (prefix → IntelliSense, or click in the Snippets view). */
const MORE: Record<string, Snip[]> = {
  c: [s('main', 'main()', '#include <stdio.h>\n\nint main(void) {\n\t$0\n\treturn 0;\n}'), s('printf', 'printf', 'printf("${1:%d}\\n", ${2:value});'), s('for', 'for loop', 'for (int ${1:i} = 0; $1 < ${2:n}; $1++) {\n\t$0\n}'), s('struct', 'typedef struct', 'typedef struct {\n\t${2:int field};\n} ${1:Name};')],
  cpp: [s('main', 'main()', '#include <iostream>\n\nint main() {\n\t$0\n\treturn 0;\n}'), s('cout', 'std::cout', 'std::cout << ${1:value} << std::endl;'), s('forr', 'Range-based for', 'for (const auto& ${1:item} : ${2:items}) {\n\t$0\n}'), s('class', 'Class', 'class ${1:Name} {\npublic:\n\t$1();\n\t~$1();\nprivate:\n\t$0\n};'), s('vec', 'std::vector', 'std::vector<${1:int}> ${2:v};')],
  csharp: [s('cw', 'Console.WriteLine', 'Console.WriteLine(${1:value});'), s('prop', 'Auto property', 'public ${1:int} ${2:Name} { get; set; }'), s('class', 'Class', 'public class ${1:Name}\n{\n\t$0\n}'), s('foreach', 'foreach', 'foreach (var ${1:item} in ${2:items})\n{\n\t$0\n}'), s('record', 'Record', 'public record ${1:Name}(${2:string Value});')],
  kotlin: [s('main', 'main()', 'fun main() {\n\t$0\n}'), s('data', 'Data class', 'data class ${1:Name}(val ${2:id}: ${3:Int})'), s('when', 'when expression', 'when (${1:x}) {\n\t${2:1} -> $0\n\telse -> {}\n}'), s('fun', 'Function', 'fun ${1:name}(${2:args}): ${3:Unit} {\n\t$0\n}')],
  swift: [s('func', 'Function', 'func ${1:name}(${2:args}) -> ${3:Void} {\n\t$0\n}'), s('struct', 'Struct', 'struct ${1:Name} {\n\tvar ${2:value}: ${3:Int}\n}'), s('guard', 'guard let', 'guard let ${1:value} = ${2:optional} else { return }'), s('enum', 'Enum', 'enum ${1:Name} {\n\tcase ${2:a}, ${3:b}\n}')],
  dart: [s('main', 'main()', 'void main() {\n\t$0\n}'), s('class', 'Class', 'class ${1:Name} {\n\tfinal ${2:String} ${3:field};\n\t$1(this.$3);\n}'), s('async', 'Async function', 'Future<${1:void}> ${2:name}() async {\n\t$0\n}')],
  scala: [s('main', 'Main object', 'object Main extends App {\n\t$0\n}'), s('case', 'Case class', 'case class ${1:Name}(${2:value}: ${3:Int})'), s('match', 'match', '${1:x} match {\n\tcase ${2:_} => $0\n}'), s('def', 'Method', 'def ${1:name}(${2:args}): ${3:Unit} = {\n\t$0\n}')],
  groovy: [s('def', 'Method', 'def ${1:name}(${2:args}) {\n\t$0\n}'), s('pipeline', 'Jenkins pipeline', "pipeline {\n\tagent any\n\tstages {\n\t\tstage('${1:Build}') {\n\t\t\tsteps {\n\t\t\t\tsh '${2:make}'\n\t\t\t}\n\t\t}\n\t}\n}")],
  ruby: [s('def', 'Method', 'def ${1:name}(${2:args})\n\t$0\nend'), s('class', 'Class', 'class ${1:Name}\n\tattr_accessor :${2:name}\n\n\tdef initialize($2)\n\t\t@$2 = $2\n\tend\nend'), s('each', 'each block', '${1:items}.each do |${2:item}|\n\t$0\nend'), s('map', 'map block', '${1:items}.map { |${2:x}| $0 }')],
  php: [s('fn', 'Function', 'function ${1:name}(${2:\\$arg}) {\n\t$0\n}'), s('class', 'Class', 'class ${1:Name}\n{\n\tpublic function __construct(private ${2:string} \\$${3:value}) {}\n}'), s('foreach', 'foreach', 'foreach (\\$${1:items} as \\$${2:item}) {\n\t$0\n}'), s('echo', 'echo', 'echo ${1:\\$value}, PHP_EOL;')],
  lua: [s('fn', 'Function', 'local function ${1:name}(${2:args})\n\t$0\nend'), s('forp', 'for pairs', 'for ${1:k}, ${2:v} in pairs(${3:t}) do\n\t$0\nend'), s('fori', 'for ipairs', 'for ${1:i}, ${2:v} in ipairs(${3:t}) do\n\t$0\nend'), s('class', 'Class (metatable)', 'local ${1:Class} = {}\n$1.__index = $1\n\nfunction $1.new(${2:args})\n\tlocal self = setmetatable({}, $1)\n\t$0\n\treturn self\nend')],
  perl: [s('sub', 'Subroutine', 'sub ${1:name} {\n\tmy (${2:\\$arg}) = @_;\n\t$0\n}'), s('foreach', 'foreach', 'foreach my \\$${1:item} (@${2:items}) {\n\t$0\n}'), s('strict', 'use strict', 'use strict;\nuse warnings;\n')],
  r: [s('fn', 'Function', '${1:name} <- function(${2:args}) {\n\t$0\n}'), s('for', 'for loop', 'for (${1:i} in ${2:seq_along(x)}) {\n\t$0\n}'), s('df', 'data.frame', '${1:df} <- data.frame(${2:x} = c(1, 2, 3))')],
  julia: [s('fn', 'Function', 'function ${1:name}(${2:args})\n\t$0\nend'), s('for', 'for loop', 'for ${1:i} in ${2:1:10}\n\t$0\nend'), s('struct', 'Struct', 'struct ${1:Name}\n\t${2:field}::${3:Int}\nend')],
  elixir: [s('defmodule', 'Module', 'defmodule ${1:Name} do\n\t$0\nend'), s('def', 'Function', 'def ${1:name}(${2:args}) do\n\t$0\nend'), s('case', 'case', 'case ${1:value} do\n\t${2:pattern} -> $0\nend'), s('pipe', 'Pipeline', '${1:value}\n|> ${2:Enum.map(& &1)}')],
  erlang: [s('mod', 'Module', '-module(${1:name}).\n-export([${2:start/0}]).\n\n${3:start}() ->\n\t$0.')],
  haskell: [s('main', 'main', 'main :: IO ()\nmain = do\n\t$0'), s('fn', 'Function with signature', '${1:name} :: ${2:Int -> Int}\n$1 ${3:x} = $0'), s('data', 'Data type', 'data ${1:Name} = ${2:A} | ${3:B}\n\tderiving (Show, Eq)'), s('case', 'case', 'case ${1:x} of\n\t${2:_} -> $0')],
  ocaml: [s('let', 'let binding', 'let ${1:name} ${2:args} =\n\t$0'), s('match', 'match', 'match ${1:x} with\n| ${2:_} -> $0'), s('type', 'Variant type', 'type ${1:t} =\n\t| ${2:A}\n\t| ${3:B}')],
  fsharp: [s('let', 'Function', 'let ${1:name} ${2:args} =\n\t$0'), s('match', 'match', 'match ${1:x} with\n| ${2:_} -> $0'), s('type', 'Record type', 'type ${1:Name} = { ${2:Field}: ${3:int} }')],
  clojure: [s('defn', 'defn', '(defn ${1:name}\n\t"${2:docstring}"\n\t[${3:args}]\n\t$0)'), s('let', 'let', '(let [${1:x} ${2:value}]\n\t$0)'), s('ns', 'Namespace', '(ns ${1:app.core}\n\t(:require [${2:clojure.string} :as ${3:str}]))')],
  scheme: [s('define', 'define', '(define (${1:name} ${2:args})\n\t$0)'), s('let', 'let', '(let ((${1:x} ${2:value}))\n\t$0)'), s('lambda', 'lambda', '(lambda (${1:x}) $0)')],
  racket: [s('lang', '#lang racket', '#lang racket\n\n$0'), s('define', 'define', '(define (${1:name} ${2:args})\n\t$0)')],
  commonlisp: [s('defun', 'defun', '(defun ${1:name} (${2:args})\n\t"${3:doc}"\n\t$0)'), s('loop', 'loop', '(loop for ${1:i} from ${2:0} below ${3:10}\n\tdo $0)')],
  shell: [s('shebang', 'Bash shebang', '#!/usr/bin/env bash\nset -euo pipefail\n\n$0'), s('if', 'if', 'if [[ ${1:condition} ]]; then\n\t$0\nfi'), s('for', 'for loop', 'for ${1:f} in ${2:*}; do\n\t$0\ndone'), s('fn', 'Function', '${1:name}() {\n\t$0\n}'), s('case', 'case', 'case "${1:\\$1}" in\n\t${2:start}) $0 ;;\n\t*) echo "usage" ;;\nesac')],
  powershell: [s('fn', 'Function', 'function ${1:Verb-Noun} {\n\tparam([${2:string}]\\$${3:Name})\n\t$0\n}'), s('foreach', 'ForEach-Object', '${1:\\$items} | ForEach-Object {\n\t$0\n}')],
  yaml: [s('gha', 'GitHub Actions workflow', "name: ${1:CI}\non: [push, pull_request]\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: ${2:npm ci && npm test}"), s('service', 'docker compose service', "services:\n  ${1:app}:\n    image: ${2:node:20}\n    ports:\n      - \"${3:3000}:$3\"")],
  dockerfile: [s('node', 'Node.js image', 'FROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nCMD ["node", "${1:index.js}"]'), s('python', 'Python image', 'FROM python:3.12-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY . .\nCMD ["python", "${1:main.py}"]')],
  makefile: [s('phony', 'Phony target', '.PHONY: ${1:build}\n$1:\n\t${2:echo building}')],
  latex: [s('doc', 'Document', '\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\title{${1:Title}}\n\\author{${2:Author}}\n\n\\begin{document}\n\\maketitle\n\n$0\n\n\\end{document}'), s('eq', 'Equation', '\\begin{equation}\n\t$0\n\\end{equation}'), s('itemize', 'Itemize', '\\begin{itemize}\n\t\\item $0\n\\end{itemize}'), s('fig', 'Figure', '\\begin{figure}[h]\n\t\\centering\n\t\\includegraphics[width=0.8\\textwidth]{${1:image}}\n\t\\caption{${2:Caption}}\n\\end{figure}')],
  markdown: [s('table', 'Table', '| ${1:Column} | ${2:Column} |\n| --- | --- |\n| $0 |  |'), s('code', 'Code block', '```${1:js}\n$0\n```'), s('link', 'Link', '[${1:text}](${2:https://})'), s('todo', 'Task list', '- [ ] ${1:task}'), s('mermaid', 'Mermaid diagram', '```mermaid\nflowchart LR\n\tA[${1:Start}] --> B[${2:End}]\n```')],
  mermaid: [s('flow', 'Flowchart', 'flowchart TD\n\tA[${1:Start}] --> B{${2:Decision}}\n\tB -->|Yes| C[${3:OK}]\n\tB -->|No| D[${4:Retry}]'), s('seq', 'Sequence diagram', 'sequenceDiagram\n\tparticipant A as ${1:Client}\n\tparticipant B as ${2:Server}\n\tA->>B: ${3:request}\n\tB-->>A: ${4:response}')],
  dot: [s('digraph', 'Directed graph', 'digraph ${1:G} {\n\trankdir=LR;\n\t${2:a} -> ${3:b};\n}')],
  solidity: [s('contract', 'Contract', '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.24;\n\ncontract ${1:Name} {\n\t$0\n}'), s('fn', 'Function', 'function ${1:name}(${2:uint256 x}) public ${3:view} returns (${4:uint256}) {\n\t$0\n}'), s('event', 'Event', 'event ${1:Transfer}(address indexed ${2:from}, uint256 ${3:value});')],
  graphql: [s('type', 'Type', 'type ${1:Name} {\n\tid: ID!\n\t$0\n}'), s('query', 'Query', 'query ${1:Name} {\n\t${2:field} {\n\t\t$0\n\t}\n}')],
  prolog: [s('main', 'main with initialization', ':- initialization(main).\n\nmain :-\n\t${1:write(hello)}, nl.'), s('rule', 'Rule', '${1:head}(${2:X}) :-\n\t${3:body}($2).')],
  fortran: [s('program', 'Program', 'program ${1:main}\n\timplicit none\n\t$0\nend program $1'), s('sub', 'Subroutine', 'subroutine ${1:name}(${2:x})\n\timplicit none\n\t$0\nend subroutine $1')],
  ada: [s('proc', 'Procedure', 'with Ada.Text_IO; use Ada.Text_IO;\n\nprocedure ${1:Main} is\nbegin\n\t$0\nend $1;')],
  vhdl: [s('entity', 'Entity + architecture', 'library ieee;\nuse ieee.std_logic_1164.all;\n\nentity ${1:name} is\n\tport (\n\t\tclk : in std_logic\n\t);\nend entity;\n\narchitecture rtl of $1 is\nbegin\n\t$0\nend architecture;')],
  verilog: [s('module', 'Module', 'module ${1:name} (\n\tinput wire clk,\n\toutput reg ${2:q}\n);\n\talways @(posedge clk) begin\n\t\t$0\n\tend\nendmodule')],
  glsl: [s('frag', 'Fragment shader', '#version 300 es\nprecision highp float;\nout vec4 fragColor;\nuniform vec2 uResolution;\n\nvoid main() {\n\tvec2 uv = gl_FragCoord.xy / uResolution;\n\tfragColor = vec4(uv, ${1:0.5}, 1.0);\n}')],
  wat: [s('module', 'Module with export', '(module\n\t(func \\$${1:add} (export "${1:add}") (param \\$a i32) (param \\$b i32) (result i32)\n\t\tlocal.get \\$a\n\t\tlocal.get \\$b\n\t\ti32.add))')],
  hcl: [s('resource', 'Terraform resource', 'resource "${1:aws_s3_bucket}" "${2:name}" {\n\t$0\n}'), s('variable', 'Variable', 'variable "${1:name}" {\n\ttype    = ${2:string}\n\tdefault = ${3:""}\n}')],
  protobuf: [s('message', 'Message', 'message ${1:Name} {\n\t${2:string} ${3:field} = 1;\n}'), s('service', 'Service', 'service ${1:Name} {\n\trpc ${2:Get}(${3:Request}) returns (${4:Response});\n}')],
  jinja: [s('for', 'for loop', '{% for ${1:item} in ${2:items} %}\n\t$0\n{% endfor %}'), s('if', 'if', '{% if ${1:cond} %}\n\t$0\n{% endif %}'), s('block', 'block', '{% block ${1:content} %}\n\t$0\n{% endblock %}')],
  vue: [s('sfc', 'Single File Component', '<template>\n\t<div>{{ ${1:msg} }}</div>\n</template>\n\n<script setup>\nimport { ref } from "vue";\nconst $1 = ref("Hello");\n</script>\n\n<style scoped>\n</style>')],
  svelte: [s('comp', 'Component', '<script>\n\tlet ${1:count} = 0;\n</script>\n\n<button on:click={() => $1++}>\n\tClicked {$1} times\n</button>')],
  zig: [s('main', 'main', 'const std = @import("std");\n\npub fn main() !void {\n\t$0\n}'), s('fn', 'Function', 'fn ${1:name}(${2:x: i32}) ${3:i32} {\n\t$0\n}'), s('test', 'Test', 'test "${1:name}" {\n\ttry std.testing.expect(${2:true});\n}')],
  nim: [s('proc', 'Proc', 'proc ${1:name}(${2:x: int}): ${3:int} =\n\t$0'), s('type', 'Object type', 'type\n\t${1:Name} = object\n\t\t${2:field}: ${3:int}')],
  gleam: [s('fn', 'Function', 'pub fn ${1:name}(${2:x}) {\n\t$0\n}'), s('case', 'case', 'case ${1:x} {\n\t${2:_} -> $0\n}')],
  crystal: [s('def', 'Method', 'def ${1:name}(${2:args})\n\t$0\nend'), s('class', 'Class', 'class ${1:Name}\n\tdef initialize(@${2:value} : ${3:Int32})\n\tend\nend')],
  toml: [s('section', 'Table', '[${1:section}]\n${2:key} = "${3:value}"')],
  nginx: [s('server', 'Server block', 'server {\n\tlisten 80;\n\tserver_name ${1:example.com};\n\n\tlocation / {\n\t\tproxy_pass http://${2:127.0.0.1:3000};\n\t}\n}')],
  brainfuck: [s('hello', 'Hello World', '++++++++[>++++[>++>+++>+++>+<<<<-]>+>+>->>+[<]<-]>>.>---.+++++++..+++.>>.<-.<.+++.------.--------.>>+.>++.')],
};
for (const [lang, list] of Object.entries(MORE)) SNIPPETS[lang] = [...(SNIPPETS[lang] ?? []), ...list];

const CUSTOM_KEY = 'jotqoda-snippets';
export const loadCustomSnippets = (): { prefix: string; label: string; body: string; lang: string }[] => {
  try { return JSON.parse(localStorage.getItem(CUSTOM_KEY) || '[]'); } catch { return []; }
};
export const saveCustomSnippets = (list: { prefix: string; label: string; body: string; lang: string }[]) => localStorage.setItem(CUSTOM_KEY, JSON.stringify(list));
