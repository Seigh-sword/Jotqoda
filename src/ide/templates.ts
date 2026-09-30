export type Workspace = { files: Record<string, string>; folders: string[] };

const README = `# 🚀 Welcome to JotQoda

A **blazing fast**, browser-based IDE powered by the Monaco engine (the heart of VS Code).

## Highlights
- 75+ languages with syntax highlighting
- Real execution for **JavaScript**, **TypeScript**, **Python**, **SQL**
- Live **HTML / Markdown / SVG** preview
- Integrated terminal, source control, global search & replace
- Command palette with 100+ commands (\`Ctrl+Shift+P\`)
- Split editors, Zen mode, 12 themes & tons of developer tools

## Try it
1. Open \`src/main.ts\` and press **F5** (or \`Ctrl+Enter\`)
2. Open \`web/index.html\` and press \`Ctrl+Shift+V\` for live preview
3. Open \`python/analysis.py\` and hit run
4. Type \`help\` in the terminal

> Tip: Everything is saved in your browser automatically.

| Shortcut | Action |
|---|---|
| Ctrl+P | Quick open |
| Ctrl+Shift+P | Command palette |
| Ctrl+B | Toggle sidebar |
| Ctrl+\` | Toggle terminal |
| Ctrl+\\\\ | Split editor |
`;

export const DEFAULT_WORKSPACE: Workspace = {
  folders: ['src', 'src/utils', 'web', 'python', 'data'],
  files: {
    'README.md': README,
    'src/main.ts': `import { fibonacci, isPrime } from './utils/math';
import { formatTable } from './utils/format';

interface User {
  id: number;
  name: string;
  role: 'admin' | 'dev' | 'guest';
}

const users: User[] = [
  { id: 1, name: 'Ada Lovelace', role: 'admin' },
  { id: 2, name: 'Linus Torvalds', role: 'dev' },
  { id: 3, name: 'Grace Hopper', role: 'dev' },
];

console.log('👋 Hello from TypeScript!');
console.log('Fibonacci(1..10):', Array.from({ length: 10 }, (_, i) => fibonacci(i + 1)));
console.log('Primes < 50:', Array.from({ length: 50 }, (_, i) => i).filter(isPrime));
console.log(formatTable(users));

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function countdown() {
  for (let i = 3; i > 0; i--) {
    console.info(\`⏳ \${i}...\`);
    await sleep(300);
  }
  console.log('🚀 Liftoff!');
}

countdown();
`,
    'src/utils/math.ts': `export function fibonacci(n: number): number {
  let [a, b] = [0, 1];
  for (let i = 0; i < n; i++) [a, b] = [b, a + b];
  return a;
}

export function isPrime(n: number): boolean {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
}

// TODO: add memoization helpers
export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
`,
    'src/utils/format.ts': `export function formatTable<T extends object>(rows: T[]): string {
  if (!rows.length) return '(empty)';
  const keys = Object.keys(rows[0]) as (keyof T)[];
  const widths = keys.map((k) => Math.max(String(k).length, ...rows.map((r) => String(r[k]).length)));
  const line = '+' + widths.map((w) => '-'.repeat(w + 2)).join('+') + '+';
  const fmt = (vals: string[]) => '| ' + vals.map((v, i) => v.padEnd(widths[i])).join(' | ') + ' |';
  return [line, fmt(keys.map(String)), line, ...rows.map((r) => fmt(keys.map((k) => String(r[k])))), line].join('\\n');
}
`,
    'src/algorithms.js': `// Classic algorithms playground — press F5 to run
const quickSort = (arr) =>
  arr.length <= 1 ? arr : [
    ...quickSort(arr.slice(1).filter((x) => x < arr[0])),
    arr[0],
    ...quickSort(arr.slice(1).filter((x) => x >= arr[0])),
  ];

function binarySearch(arr, target) {
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] === target) return mid;
    arr[mid] < target ? (lo = mid + 1) : (hi = mid - 1);
  }
  return -1;
}

const data = Array.from({ length: 15 }, () => Math.floor(Math.random() * 100));
const sorted = quickSort(data);
console.log('Input :', data.join(', '));
console.log('Sorted:', sorted.join(', '));
console.log('Index of', sorted[7], '=>', binarySearch(sorted, sorted[7]));
console.table(sorted.slice(0, 5).map((v, i) => ({ i, v, squared: v * v })));

console.time('loop');
let s = 0; for (let i = 0; i < 1e6; i++) s += i;
console.timeEnd('loop');
`,
    'web/index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Live Preview Demo</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <main class="card">
    <h1>⚡ JotQoda Live Preview</h1>
    <p>Edit <code>index.html</code>, <code>style.css</code> or <code>app.js</code> and watch this update instantly.</p>
    <button id="btn">Clicked 0 times</button>
  </main>
  <script src="app.js"></script>
</body>
</html>
`,
    'web/style.css': `:root { --accent: #7c3aed; }
* { box-sizing: border-box; }
body {
  margin: 0; min-height: 100vh; display: grid; place-items: center;
  font-family: system-ui, sans-serif;
  background: radial-gradient(circle at 30% 20%, #312e81, #0f172a 60%);
  color: #e2e8f0;
}
.card {
  padding: 2.5rem; border-radius: 1.25rem; max-width: 420px; text-align: center;
  background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12);
  backdrop-filter: blur(10px); box-shadow: 0 20px 60px rgba(0,0,0,.4);
}
code { color: #c4b5fd; }
button {
  margin-top: 1rem; padding: .75rem 1.5rem; border: 0; border-radius: 999px;
  background: var(--accent); color: white; font-weight: 600; cursor: pointer;
  transition: transform .15s;
}
button:hover { transform: scale(1.05); }
`,
    'web/app.js': `let count = 0;
const btn = document.getElementById('btn');
btn.addEventListener('click', () => {
  count++;
  btn.textContent = \`Clicked \${count} time\${count === 1 ? '' : 's'}\`;
  console.log('Button clicked', count);
});
console.log('app.js loaded ✅');
`,
    'python/analysis.py': `# Python runs natively in your browser via WebAssembly 🐍
from dataclasses import dataclass
from collections import Counter
import math, json

@dataclass
class Point:
    x: float
    y: float

    def dist(self, other: "Point") -> float:
        return math.hypot(self.x - other.x, self.y - other.y)

points = [Point(i, i ** 1.5) for i in range(6)]
for a, b in zip(points, points[1:]):
    print(f"{a} -> {b}: {a.dist(b):.3f}")

text = "the quick brown fox jumps over the lazy dog the end"
print("Top words:", Counter(text.split()).most_common(3))

squares = {n: n * n for n in range(1, 8)}
print(json.dumps(squares, indent=2))

def primes(limit):
    sieve = [True] * limit
    for i in range(2, int(limit ** .5) + 1):
        if sieve[i]:
            sieve[i*i::i] = [False] * len(sieve[i*i::i])
    return [i for i in range(2, limit) if sieve[i]]

print("Primes:", primes(60))
`,
    'data/queries.sql': `-- SQLite runs in-browser. Press F5 to execute!
CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, dept TEXT, salary INTEGER);

INSERT INTO employees (name, dept, salary) VALUES
  ('Alice', 'Engineering', 145000),
  ('Bob', 'Engineering', 128000),
  ('Carol', 'Design', 110000),
  ('Dave', 'Marketing', 98000),
  ('Eve', 'Engineering', 162000),
  ('Frank', 'Design', 104000);

SELECT dept, COUNT(*) AS headcount, AVG(salary) AS avg_salary, MAX(salary) AS top
FROM employees GROUP BY dept ORDER BY avg_salary DESC;

SELECT name, salary FROM employees WHERE salary > 120000 ORDER BY salary DESC;
`,
    'data/config.json': `{
  "name": "jotqoda-demo",
  "version": "1.0.0",
  "features": ["run", "preview", "terminal", "git"],
  "editor": { "tabSize": 2, "theme": "jotqoda-dark" }
}
`,
    'examples/Main.java': `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, Java!");
    }
}
`,
    'examples/main.rs': `fn main() {
    let nums: Vec<i32> = (1..=10).collect();
    let sum: i32 = nums.iter().sum();
    println!("Hello, Rust! Sum = {}", sum);
}
`,
    'examples/main.go': `package main

import "fmt"

func main() {
    fmt.Println("Hello, Go!")
}
`,
    'examples/logo.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#7c3aed"/><stop offset="1" stop-color="#06b6d4"/>
    </linearGradient>
  </defs>
  <rect width="200" height="200" rx="40" fill="url(#g)"/>
  <text x="100" y="125" font-size="72" text-anchor="middle" fill="white" font-family="monospace">&lt;/&gt;</text>
</svg>
`,
    '.gitignore': `node_modules\ndist\n.env\n`,
  },
};
DEFAULT_WORKSPACE.folders.push('examples');

export const WORKSPACE_TEMPLATES: Record<string, { name: string; desc: string; ws: Workspace }> = {
  demo: { name: 'JotQoda Demo', desc: 'Multi-language showcase', ws: DEFAULT_WORKSPACE },
  web: {
    name: 'Web Starter',
    desc: 'HTML + CSS + JS with live preview',
    ws: {
      folders: [],
      files: {
        'index.html': `<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="UTF-8" />\n  <title>Web Starter</title>\n  <link rel="stylesheet" href="styles.css" />\n</head>\n<body>\n  <h1>Hello Web 👋</h1>\n  <div id="app"></div>\n  <script src="script.js"></script>\n</body>\n</html>\n`,
        'styles.css': `body { font-family: system-ui; padding: 2rem; background: #0f172a; color: #f8fafc; }\nh1 { color: #38bdf8; }\n`,
        'script.js': `document.getElementById('app').innerHTML = '<p>Rendered at ' + new Date().toLocaleTimeString() + '</p>';\nconsole.log('ready');\n`,
      },
    },
  },
  node: {
    name: 'Node-style Modules',
    desc: 'JS modules with require/import',
    ws: {
      folders: ['lib'],
      files: {
        'index.js': `import { greet } from './lib/greet';\nconst pkg = require('./package.json');\n\nconsole.log(greet('Developer'));\nconsole.log('Package:', pkg.name, pkg.version);\n`,
        'lib/greet.js': `export function greet(name) {\n  return \`Hello, \${name}! 🎉\`;\n}\n`,
        'package.json': `{\n  "name": "node-style",\n  "version": "0.1.0"\n}\n`,
      },
    },
  },
  python: {
    name: 'Python Project',
    desc: 'Multi-module Python package',
    ws: {
      folders: [],
      files: {
        'main.py': `from helpers import banner, stats\n\nbanner("Python Project")\nprint(stats([3, 1, 4, 1, 5, 9, 2, 6]))\n`,
        'helpers.py': `import statistics as st\n\ndef banner(title):\n    print("=" * 30)\n    print(title.center(30))\n    print("=" * 30)\n\ndef stats(xs):\n    return {"mean": st.mean(xs), "median": st.median(xs), "stdev": round(st.stdev(xs), 3)}\n`,
      },
    },
  },
  sql: {
    name: 'SQL Sandbox',
    desc: 'SQLite playground',
    ws: {
      folders: [],
      files: {
        'schema.sql': `CREATE TABLE products(id INTEGER PRIMARY KEY, name TEXT, price REAL, stock INT);\nINSERT INTO products(name, price, stock) VALUES ('Keyboard', 99.9, 12), ('Mouse', 49.5, 30), ('Monitor', 329, 5);\nSELECT * FROM products ORDER BY price DESC;\nSELECT SUM(price * stock) AS inventory_value FROM products;\n`,
      },
    },
  },
  empty: { name: 'Empty Workspace', desc: 'Start from scratch', ws: { folders: [], files: { 'untitled.txt': '' } } },
};

export const FILE_TEMPLATES: Record<string, string> = {
  javascript: `console.log('Hello, JavaScript!');\n`,
  typescript: `const greet = (name: string): string => \`Hello, \${name}!\`;\nconsole.log(greet('TypeScript'));\n`,
  python: `def main():\n    print("Hello, Python!")\n\nif __name__ == "__main__":\n    main()\n`,
  html: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>Document</title>\n</head>\n<body>\n  <h1>Hello, HTML!</h1>\n</body>\n</html>\n`,
  css: `body {\n  margin: 0;\n  font-family: system-ui, sans-serif;\n}\n`,
  json: `{\n  \n}\n`,
  markdown: `# Title\n\nWrite something **awesome**.\n`,
  sql: `SELECT 'Hello, SQL!' AS greeting;\n`,
  java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, Java!");\n    }\n}\n`,
  c: `#include <stdio.h>\n\nint main(void) {\n    printf("Hello, C!\\n");\n    return 0;\n}\n`,
  cpp: `#include <iostream>\n\nint main() {\n    std::cout << "Hello, C++!" << std::endl;\n    return 0;\n}\n`,
  csharp: `using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, C#!");\n    }\n}\n`,
  go: `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, Go!")\n}\n`,
  rust: `fn main() {\n    println!("Hello, Rust!");\n}\n`,
  kotlin: `fun main() {\n    println("Hello, Kotlin!")\n}\n`,
  swift: `print("Hello, Swift!")\n`,
  php: `<?php\necho "Hello, PHP!\\n";\n`,
  ruby: `puts "Hello, Ruby!"\n`,
  lua: `print("Hello, Lua!")\n`,
  shell: `#!/usr/bin/env bash\necho "Hello, Bash!"\n`,
  dart: `void main() {\n  print('Hello, Dart!');\n}\n`,
  scala: `object Main extends App {\n  println("Hello, Scala!")\n}\n`,
  r: `print("Hello, R!")\n`,
  yaml: `name: example\nversion: 1.0.0\n`,
  dockerfile: `FROM node:20-alpine\nWORKDIR /app\nCOPY . .\nRUN npm install\nCMD ["npm", "start"]\n`,
  perl: `print "Hello, Perl!\\n";\n`,
  elixir: `IO.puts "Hello, Elixir!"\n`,
  julia: `println("Hello, Julia!")\n`,
  graphql: `type Query {\n  hello: String!\n}\n`,
  solidity: `// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n\ncontract Hello {\n    string public greeting = "Hello, Solidity!";\n}\n`,
};
