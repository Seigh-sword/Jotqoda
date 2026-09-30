# JotQoda

![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript 5.9](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Vite 7](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![Monaco Editor](https://img.shields.io/badge/Editor-Monaco-007ACC?logo=visualstudiocode&logoColor=white)
![Languages](https://img.shields.io/badge/languages-425-8b5cf6)
![Source lines](https://img.shields.io/badge/source-10%2C900%2B%20lines-brightgreen)
![License](https://img.shields.io/badge/license-Apache--2.0-blue)

JotQoda is a browser-based coding workspace built with React, TypeScript, Vite, and the Monaco Editor. It brings editing for 425 languages, in-browser execution for 13 of them, live previews, file management, and VS Code-style workbench features together in a single-page interface.

## Contents

- [Highlights](#highlights)
- [Interface](#interface)
- [Getting started](#getting-started)
- [Using the workspace](#using-the-workspace)
- [Languages and execution](#languages-and-execution)
- [Preview behavior](#preview-behavior)
- [Workspace templates](#workspace-templates)
- [Settings and themes](#settings-and-themes)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Browser storage and workspace portability](#browser-storage-and-workspace-portability)
- [Architecture](#architecture)
- [Development commands](#development-commands)
- [Build and deployment](#build-and-deployment)
- [Privacy and security notes](#privacy-and-security-notes)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Highlights

- **425 languages and file formats:**
  - 117 use Monaco's tokenizers.
  - 308 use JotQoda's own grammars, including Zig, Nim, Haskell, OCaml, Erlang, Gleam, Racket, and Common Lisp.
  - Also covered: Fortran, COBOL, VHDL, GLSL, x86/ARM/RISC-V assembly, TOML, Nix, Terraform, Makefiles, LaTeX, Mermaid, Jinja, SQL dialects, smart-contract languages, and more.
  - Every language gets comment toggling, brackets, folding, an outline, keyword IntelliSense, and go to definition.
- **Smart language detection:**
  - Extensions, compound extensions (`.blade.php`), and file names (`Makefile`, `Dockerfile.prod`, `go.mod`, `.gitignore`).
  - Shebangs (`#!/usr/bin/env python3`).
  - Content heuristics for ambiguous extensions such as `.m`, `.pl`, `.h`, `.v`, `.pp`, `.cls`, and `.s`.
- **In-browser code execution** for JavaScript, TypeScript, Python, SQL, Lua, Ruby, PHP, Scheme, Prolog, CoffeeScript, Clojure(Script), WebAssembly text, and Brainfuck. There is no server: everything runs in Web Workers or WebAssembly.
- **Live previews:** HTML, Markdown (including Mermaid blocks), SVG, CSS, JSON, Mermaid diagrams, Graphviz DOT graphs, and sortable CSV/TSV tables.
- **VS Code-style workbench:**
  - Up to 4 editor groups, with pinned and draggable tabs and a way to reopen closed editors.
  - Go Back/Forward navigation.
  - An Outline view, symbol breadcrumbs, and `@`/`#` symbol search.
  - Local History (Timeline), compare/diff views, bookmarks, and a notification center.
  - Editable keybindings, sidebar left/right, and a centered layout.
- **Formatting and Emmet:**
  - Prettier (JS/TS/JSON/CSS/SCSS/Less/HTML/Vue/Markdown/YAML/GraphQL), SQL and XML formatters, and a brace re-indenter for C-like languages.
  - Format-on-save, trim trailing whitespace, and insert final newline.
  - Emmet abbreviations for HTML, template languages, and CSS.
- **Workspace tools:**
  - Global search and replace with "find in folder".
  - Source-control-style change tracking.
  - A multi-session terminal with pipes, redirection, and 90+ commands.
  - 194 snippets in 62 languages, 118 new-file templates, and developer utilities.
- **Portable workspaces:** download the workspace or a folder as a ZIP, import a ZIP or a local folder, and import or export JSON.
- **Customizable appearance:** 31 themes (22 dark, 8 light, 1 high contrast) and 78 settings.

## Interface

The main areas of the application are:

| Area | What it does |
| --- | --- |
| Title bar and menus | Opens commands, navigation pickers, settings, and workspace actions. |
| Activity bar | Switches between Explorer, Search, Source Control, Run & Debug, Developer Tools, Snippets, Languages & Runtimes, and Bookmarks. |
| Sidebar | Shows the selected activity. The Explorer includes Open Editors, the file tree, an **Outline** of the active file, and a **Timeline** (local history). The sidebar can sit on the left or right. |
| Editor | Edits files with Monaco in up to four editor groups. Tabs can be pinned, dragged between groups, and reopened after closing. |
| Breadcrumbs | Show the file path and the symbol path under the cursor. Click a symbol to jump to it, or click the language name to change the language mode. |
| Preview | Renders supported workspace files in an embedded, sandboxed frame. |
| Bottom panel | Holds one or more Terminal sessions, execution Output, Problems, and TODO lists. |
| Status bar | Shows cursor position, the indentation picker, the end-of-line picker, the language mode, the active formatter, bookmarks, and the notification center. |

Panel sizes can be adjusted by dragging the separators; double-clicking the sidebar or editor-group separators resets them. Use Zen Mode or Centered Layout to focus on the editor.

## Getting started

You can install the editor locally.

### Requirements

- Node.js **20.19 or newer**, or **22.12 or newer**.
- npm (the repository includes `package-lock.json`).
- A modern browser for using the application.
- An internet connection for loading browser-hosted dependencies: Monaco, language runtimes, formatters, diagram renderers, and web fonts.

### Install and run locally

Clone the repository:

```sh
git clone https://github.com/Seigh-sword/Jotqoda/
```

From the repository root:

```sh
npm install
npm run dev
```

Vite prints the local development URL in the terminal; by default it is `http://localhost:5173/`. Open that URL in a browser.

### Build and serve a local production preview

```sh
npm run build
npm run preview
```

The production build is written to `dist/`. The preview command serves that build locally; it is not a replacement for the development server.

## Using the workspace

### Files and folders

- **Explorer actions:**
  - Open, create, rename, duplicate, download, cut/copy/paste, and delete workspace files and folders.
  - The context menu also offers **Open in Integrated Terminal**, **Find in Folder**, **Copy Relative Path**, **Select for Compare / Compare with Selected**, and **Download as ZIP**.
- **Keyboard navigation:** click the file tree to focus it, then use:
  - `↑`/`↓` to move and `←`/`→` to collapse or expand.
  - `Enter` to open, `F2` to rename, and `Delete` to delete.
  - `Ctrl+C`/`Ctrl+X`/`Ctrl+V` to copy, cut, and paste.
- Files with errors or warnings are highlighted in the tree, and folders show a dot when they contain problems.
- Use `/` in a new file or folder name to create nested paths, for example `src/components/Panel.tsx`.
- **Bringing files in:**
  - **Upload** individual files.
  - **Open Local Folder…** replaces the workspace with a folder from your computer.
  - **Import ZIP Archive…** imports a ZIP. Text files are imported; binaries, files over 2 MB, and `node_modules`/`.git`/`dist` folders are skipped.
- Use the quick-open picker (`Ctrl+P`) to find workspace files. Append `:line` to jump to a line, for example `main.ts:20`.
- Save an individual file with `Ctrl+S`, or save all files with `Ctrl+Alt+S`. Auto-save is enabled by default.
- Deleted or renamed files affect the in-browser workspace; they do not modify files on your computer.

### Editing, IntelliSense, and navigation

- **Language services:** Monaco supplies full language services for TypeScript, JavaScript, CSS/SCSS/Less, JSON, and HTML. JSON files may contain comments.
- **Every other language gets:**
  - Keyword, type, and builtin completions.
  - Symbol and document-word completions.
  - Snippets, bracket and auto-closing rules, and `Ctrl+/` comment toggling.
  - Folding, including `#region` markers.
  - A regex-based document symbol provider that powers the Outline, sticky scroll, `Ctrl+Shift+O`, and breadcrumbs.
- **Go to Definition** (`F12`) searches the current file first, then workspace symbols, and opens other files. Cross-file definitions from the TypeScript service open in JotQoda too.
- **Symbol search:**
  - `Ctrl+P` then `@` (or **Go to Symbol in Editor**) lists symbols in the active file.
  - `#` or `Ctrl+Alt+O` searches symbols across the workspace.
- **Go Back / Go Forward** (`Alt+←` / `Alt+→` outside macOS, or the arrows in the editor toolbar) moves through your navigation history.
- **Bookmarks:** `Ctrl+Alt+K` toggles a bookmark (or click the gutter), and `Ctrl+Alt+L` / `Ctrl+Alt+J` jump to the next or previous one. The Bookmarks view lists them all.
- **Emmet** expands abbreviations such as `ul>li*3` or `m10` in HTML, template languages, and CSS/SCSS/Less/Sass/Stylus. JSX support is optional in Settings.

### Editor groups and tabs

- `Ctrl+\` splits the active editor into a new group to the right, up to four groups. Groups can be resized, closed, or joined back together.
- Drag tabs to reorder them or to move them into another group. You can also drag files from the Explorer into a group.
- **Pin** a tab by double-clicking it or from the context menu. Pinned tabs stay first and survive **Close Others / Close All**.
- **Other tab actions:**
  - **Close to the Right** and **Close Saved**.
  - **Reopen Closed Editor**.
  - **Move to Next Group**.
  - **Compare with Saved** and **Compare with HEAD**.

### Local History and compare

- JotQoda keeps **local snapshots** of files, independent of Source Control:
  - on every save;
  - about once a minute while auto-saving;
  - before discarding changes, replacing text across files, restoring, or deleting a file.
- The Explorer's **Timeline** section lists the snapshots for the active file. You can compare a snapshot with the current file, restore it, or delete it.
- **Compare** views are available for:
  - the active file versus its saved version, HEAD, another file, or the clipboard;
  - any two files;
  - a file selected in the Explorer versus another file.
- Diff views support inline or side-by-side layouts and next/previous change navigation, and the right side can be edited.

### Formatting

**Format Document** (`Shift+Alt+F`) uses the first formatter that applies:

1. **Prettier** (loaded on demand) for JavaScript, TypeScript, JSON/JSON5, CSS/SCSS/Less, HTML, Vue, Markdown/MDX, YAML, GraphQL, and Handlebars.
2. **sql-formatter** for SQL dialects: SQLite, MySQL, PostgreSQL, T-SQL, PL/SQL, Redshift, and HiveQL.
3. JotQoda's **XML/SVG** pretty printer.
4. Monaco's built-in formatters.
5. A **brace-aware re-indenter** for C-like languages.

The status bar shows which formatter applies to the active file. **Format on save**, **trim trailing whitespace**, **insert final newline**, and **trim final newlines** are available under Settings → Files.

### Search

The Search activity searches workspace file contents and supports replacement. **Find in Folder** in the Explorer pre-fills the include pattern. Search is limited to files in the current JotQoda workspace; it does not search your computer's filesystem.

### Source Control

The Source Control view tracks changes against an in-browser baseline. It can show changed files, open diffs, discard changes, and create local commits with messages.

This is an **IDE-local source-control simulation**, not a Git client. It does not create a `.git` directory, invoke Git, connect to a remote, or push commits to a server. Treat its history as part of the browser-stored workspace, not as a backup.

### Terminal

The Terminal is an application-provided command interface over the JotQoda workspace.

- **Sessions:** open several at once with `+` or `Ctrl+Shift+``. **Open in Integrated Terminal** starts a session in the chosen folder.
- **Shell syntax:**
  - Pipes (`|`), redirection (`>`, `>>`, `<`, `2>`, `2>&1`), and chaining (`&&`, `||`, `;`).
  - Quoting, globs (`*.ts`), and `$VAR` expansion.
  - `export`/`env`/`alias`, history (`!!`, `!n`), and tab completion.
- **File commands:** `ls`, `cd`, `tree`, `cat`, `head`/`tail`, `touch`, `mkdir`, `rm`, `mv`, `cp`, `find`, `stat`, `du`, and `file` (shows the detected language).
- **Text commands:** `grep`, `wc`, `sort`, `uniq`, `rev`, `tac`, `nl`, `cut`, `tr`, `sed 's/…/…/g'`, `awk '{print $1}'`, `tee`, `diff`, `jq`, `base64`, and `sha1sum`/`sha256sum`/`sha512sum`.
- **Utilities:** `seq`, `sleep`, `uuid`, `curl`/`wget` (subject to CORS), `calc`, and `js`.
- **Workspace commands:**
  - `open` and `run`, plus runtime aliases (`node`, `python`, `lua`, `ruby`, `php`, …).
  - `format`, `preview`, `zip`, `git status|log|diff|commit`, `theme`, and `langs`.
- `path:line` references in the output (for example from `grep -n`) are clickable, and so are URLs.

It is **not** a system shell: it cannot access arbitrary operating-system paths, launch installed programs, or run a real `npm`, `git`, or `bash` process. Its working directory and file operations refer to the in-browser workspace.

### Output, Problems, and TODOs

- **Output** displays execution results, logs, and runtime errors. Output can be filtered, copied, cleared, and word-wrapped.
- **Problems** displays diagnostics reported by the editor language services.
- **TODOs** collects TODO-style markers from workspace files.

## Languages and execution

JotQoda recognizes **425 languages and file formats** in 26 categories. Browse them all in the **Languages & Runtimes** view (`Ctrl+Shift+X`), on the Welcome page, or with the terminal's `langs <query>`.

| Category | Examples |
| --- | --- |
| Web | JavaScript, TypeScript, HTML, CSS, SCSS, Less, Sass, Stylus, PostCSS, Vue, Svelte, Astro, LiveScript, Imba, Web IDL, HTTP requests |
| Systems | C, C++, Rust, Go, Zig, Nim, Odin, D, Ada, V, Carbon, Hare, C3, Jai, Vala |
| JVM / .NET / Mobile | Java, Kotlin, Scala, Groovy, Ceylon, Xtend, C#, F#, VB, XAML, CIL, Swift, Objective-C, Dart, Smali, AIDL |
| Scripting and shells | Python, Ruby, Perl, Raku, Lua, Luau, Teal, MoonScript, PHP, Hack, Crystal, Tcl, AppleScript, AutoHotkey, AutoIt, Bash, Zsh, Fish, Nushell, Elvish, Xonsh, PowerShell, Batch, AWK, sed, jq, Vim script |
| Functional, Lisp, and logic | Haskell, PureScript, Elm, Idris, Agda, Lean 4, OCaml, Reason, ReScript, Standard ML, Erlang, Gleam, Roc, Koka, Unison, Clojure, Racket, Common Lisp, Emacs Lisp, Fennel, Janet, Hy, Prolog, Mercury, Datalog, MiniZinc |
| Scientific and array | Julia, R, MATLAB/Octave, Fortran, Mojo, Chapel, Cython, Wolfram, Maxima, Scilab, SAS, Stata, GAMS, AMPL, Modelica, APL, J, K, BQN, Uiua, OpenQASM, Quil |
| Query | SQL, MySQL, PostgreSQL, T-SQL, PL/SQL, HiveQL, CQL, Kusto, PromQL, Flux, Splunk SPL, XQuery, Gremlin, EdgeQL, SurrealQL, PRQL, Malloy, LookML, GraphQL, SPARQL, Cypher |
| Data and config | JSON, JSON5, Hjson, JSON Lines, YAML, TOML, INI, Properties, Dotenv, EditorConfig, KDL, HOCON, RON, Pkl, CUE, Dhall, Jsonnet, Protocol Buffers, Thrift, Cap'n Proto, FlatBuffers, Avro, ASN.1, Smithy, Prisma, CSV/TSV, iCalendar, Gettext PO, subtitles |
| Build and DevOps | Dockerfile, Makefile, CMake, Meson, Ninja, Just, Bazel/Starlark, GN, BitBake, Nix, Terraform/HCL, Bicep, Puppet, Nginx, Apache, Caddyfile, HAProxy, SSH config, systemd units, crontab, DNS zones, go.mod, pip requirements, Cabal |
| Markup and docs | Markdown, MDX, reStructuredText, AsciiDoc, Org, LaTeX, BibTeX, Typst, Textile, MediaWiki, Creole, Djot, Roff/man, Texinfo, POD, RDoc |
| Templating | Jinja, Django, Nunjucks, Twig, Liquid, Handlebars, Mustache, EJS, ERB, EEx/HEEx, Blade, Smarty, Velocity, Go templates, FreeMarker, Razor, Pug, Haml, Slim |
| Diagrams | Mermaid, PlantUML, Graphviz DOT, D2, Structurizr |
| Shaders, hardware, and assembly | GLSL, HLSL, WGSL, Metal, CUDA, OpenCL, ShaderLab, Verilog, SystemVerilog, VHDL, Bluespec, Device Tree, SPICE, NASM/x86, GNU as, ARM/AArch64, RISC-V, MIPS, AVR, 6502, Z80, 68k, LLVM IR, MLIR, WebAssembly text, PTX |
| Smart contracts | Solidity, Vyper, Move, Cairo, Clarity, Michelson, Yul, Sway, Aiken, Motoko, LIGO, Fe |
| Legacy, game dev, and esoteric | COBOL, PL/I, RPG, Modula-2, Oberon, Eiffel, Smalltalk, Forth, PostScript, BASIC dialects, REXX, JCL, xBase, GDScript, GameMaker, Papyrus, UnrealScript, Squirrel, Wren, Brainfuck, Befunge, LOLCODE, Rockstar, ArnoldC |

What "support" means:

- **Every language:**
  - syntax highlighting, and comment toggling (`Ctrl+/`, block comments where they exist);
  - bracket matching and auto-closing, and folding;
  - an outline and symbols (regex-based), keyword completion, and go to definition within the workspace.
- **Selected languages:** 194 snippets in 62 languages, and new-file templates for 118 languages.
- **Grammars:** highlighting comes from Monaco's tokenizers where Monaco ships one, and otherwise from JotQoda grammars. Those are compact specs in `src/ide/lang/` that are compiled to Monarch tokenizers the first time a language is used.

Recognition and highlighting do **not** imply that a compiler or runtime is available for a language. Only the formats below can be run.

### Runnable formats

| Format | Behavior |
| --- | --- |
| JavaScript | Runs the selected file in a browser Web Worker. Workspace JavaScript modules and JSON files can be resolved by the lightweight workspace module loader. |
| TypeScript | Is transpiled with the TypeScript language service and then run using the JavaScript worker. |
| Python | Runs in Pyodide, a WebAssembly-based Python runtime loaded in a browser worker. Python workspace files and supported data/text files are made available to that runtime. |
| SQL | Runs against SQL.js, an in-browser SQLite implementation. |
| Lua | Runs on Lua 5.4 compiled to WebAssembly ([wasmoon](https://github.com/ceifa/wasmoon)) in a worker. Workspace `.lua` files can be `require`d. |
| Ruby | Runs on CRuby 3.4 ([ruby.wasm](https://github.com/ruby/ruby.wasm)) in a worker, including the standard library. The first run downloads about 30 MB, which the browser then caches. |
| PHP | Runs on PHP 8.4 ([php-wasm](https://github.com/seanmorris/php-wasm)) in a worker. The first run downloads about 15 MB. |
| Scheme | Runs on [BiwaScheme](https://www.biwascheme.org/), an R7RS subset, in a worker. The value of the last expression is shown. |
| Prolog | Runs on [Tau Prolog](http://tau-prolog.org/) in a worker. `:- initialization(main).` directives run, `?- Goal.` lines in the file are answered (up to 20 solutions each), or `main/0` is called. |
| CoffeeScript | Is compiled with the official CoffeeScript compiler and then run in the JavaScript worker. |
| Clojure / ClojureScript | Runs on SCI via [Scittle](https://github.com/babashka/scittle) in a hidden sandboxed iframe. This is a ClojureScript interpreter, not JVM Clojure. |
| WebAssembly text (`.wat`) | Is compiled with wabt.js and instantiated. Imported functions are stubbed to print their arguments, and `main`/`_start`/`run` is called. |
| Brainfuck | Is interpreted in a worker. Text after a `!` is used as the program's input. |
| HTML | Opens the live preview. Local referenced workspace CSS and JavaScript files are inlined when they can be resolved. |
| Markdown | Opens a rendered Markdown preview. Fenced `mermaid` blocks are rendered as diagrams. |
| SVG | Opens a rendered SVG preview. |
| CSS | Opens a preview page with sample elements styled by the active stylesheet. |
| JSON | Validates and pretty-prints the JSON content in the preview. |
| Mermaid (`.mmd`) | Renders the diagram with Mermaid. |
| Graphviz DOT (`.dot`, `.gv`) | Renders the graph with viz.js (Graphviz compiled to WebAssembly). |
| CSV / TSV | Renders a sortable, filterable table (the first 5,000 rows). |

Runtime notes:

- **JavaScript and TypeScript:** imports must resolve to files in the workspace. The lightweight module loader is not Node.js and does not provide Node built-ins, package installation, or arbitrary npm dependencies. Some language-service diagnostics are intentionally suppressed to accommodate the browser-based environment.
- **Loading:** the additional runtimes are downloaded from jsDelivr on first use and run locally. No code is sent to a remote execution service.
- **No input:** programs cannot read interactive standard input. `io.read` in Lua returns `nil`, and Brainfuck reads the text after `!`.
- **Stopping:** use **Stop** (`Shift+F5`) to terminate a runaway program; the worker or iframe is discarded.

The **Polyglot Runtimes** template contains one example per runtime.

## Preview behavior

The Preview panel supports desktop, tablet-width, and mobile-width layouts. It can follow the active file, refresh manually, or open the rendered document in a new browser window.

- HTML files can reference workspace stylesheets and scripts by relative path; matching workspace files are inlined into the preview.
- Markdown uses JotQoda's built-in renderer for common headings, lists, tables, links, images, and fenced code blocks. It is not a complete replacement for every Markdown extension.
- Mermaid and Graphviz previews load their renderers from jsDelivr and follow the light or dark style of the current theme.
- CSV and TSV previews parse quoted fields (RFC 4180) and let you sort by column or filter rows.
- CSS is applied to a small sample page so styles can be inspected without creating an HTML file.
- JSON is formatted for display; invalid JSON is shown with a parsing error.
- Preview JavaScript and markup run in an iframe with a restricted sandbox. This is a safety boundary, not a guarantee that arbitrary untrusted code is harmless.

External assets and links still depend on browser network access and their own hosting policies.

## Workspace templates

The welcome screen and template picker provide these starting points:

| Template | Contents |
| --- | --- |
| JotQoda Demo | A multi-language showcase with TypeScript, web, Python, SQL, and example files. |
| Web Starter | An HTML, CSS, and JavaScript starter configured for live preview. |
| Node-style Modules | A small JavaScript project demonstrating workspace-local modules and JSON imports. It does not provide the Node.js runtime. |
| Python Project | A multi-file Python example intended for the Pyodide runner. |
| SQL Sandbox | A SQLite example for the in-browser SQL runner. |
| Polyglot Runtimes | One runnable example each for Lua, Ruby, PHP, Scheme, Prolog, CoffeeScript, ClojureScript, WebAssembly text, and Brainfuck, plus Mermaid, Graphviz, and CSV previews. |
| Empty Workspace | A minimal starting point. |

Loading a template replaces the current workspace after confirmation when it contains files. Export work you want to keep before replacing a workspace.

## Settings and themes

The Settings dialog has 78 options in these sections:

| Section | Options |
| --- | --- |
| Appearance | Font family, size, weight, and letter spacing; ligatures; minimap side and characters; rulers; line numbers; whitespace and control characters; line highlight; breadcrumbs; glyph margin. |
| Workbench | Sidebar position, activity and status bar visibility, centered layout, terminal font size, Do Not Disturb. |
| Cursor | Cursor style and blinking, surrounding lines, multi-cursor modifier, smooth caret and scrolling, wheel zoom. |
| Editing | Indentation, word wrap and wrap column, auto-closing brackets and quotes, auto-surround, linked editing, Emmet, format on paste or type, folding, bracket colorization, guides, sticky scroll, occurrence and selection highlight, links. |
| IntelliSense | Quick suggestions, word-based suggestions, snippet placement, accept on Enter, Tab completion, parameter hints, hover, TypeScript checks. |
| Formatting | Prettier on/off, print width, semicolons, quotes, trailing commas; SQL keyword case. |
| Files | Auto-save, format on save, trim trailing whitespace, final newlines, content-based language detection, Local History and its size, delete confirmation. |
| Running | Clearing output on run, live preview refresh. |

The **Keyboard Shortcuts** dialog is also an editor: click a keybinding, press a new combination, and confirm with `Enter`. Conflicts are shown, and custom bindings can be reset individually or all at once. Keys reserved by the browser, such as `Ctrl+T`, `Ctrl+W`, and `Ctrl+N`, cannot be captured by a web page.

The 31 themes are:

- **Dark:** JotQoda Dark, Dark+ (VS Code), Dracula, Monokai Pro, Monokai Classic, One Dark Pro, Tokyo Night, Nord, Catppuccin Mocha, Solarized Dark, Synthwave '84, GitHub Dark Dimmed, Gruvbox Dark, Ayu Dark, Night Owl, Material Palenight, Cobalt2, Rosé Pine, Everforest Dark, Kanagawa, Horizon, Shades of Purple.
- **Light:** GitHub Light, Solarized Light, Light+ (VS Code), Atom One Light, Gruvbox Light, Catppuccin Latte, Rosé Pine Dawn, Ayu Light.
- **High contrast:** High Contrast.

Settings persist in the current browser profile.

## Keyboard shortcuts

Shortcuts are shown in the UI and can be reviewed and changed in the Keyboard Shortcuts dialog. Common defaults include:

| Shortcut | Action |
| --- | --- |
| `Ctrl+Shift+P` / `F1` | Open the command palette. |
| `Ctrl+P` | Quick-open workspace files. Prefix with `>` for commands, `:` for a line, `@` for a symbol, or `#` for a workspace symbol. |
| `Ctrl+Alt+O` | Go to a symbol in the workspace. |
| `Ctrl+G` | Go to a line. |
| `Alt+←` / `Alt+→` | Go back or forward (outside macOS). |
| `F12` / `Alt+F12` / `Shift+F12` | Go to definition, peek definition, or find references. |
| `Ctrl+S` | Save the active file. |
| `Ctrl+Alt+S` | Save all files. |
| `Shift+Alt+F` | Format the document. |
| `Ctrl+\` | Split the editor into a new group to the right. |
| `Ctrl+Alt+K` / `Ctrl+Alt+L` / `Ctrl+Alt+J` | Toggle, next, or previous bookmark. |
| `Ctrl+B` | Toggle the sidebar. |
| `Ctrl+J` | Toggle the bottom panel. |
| ``Ctrl+` `` | Toggle the terminal. |
| ``Ctrl+Shift+` `` | Create a new terminal. |
| `Ctrl+Shift+E` | Open Explorer. |
| `Ctrl+Shift+F` | Open workspace search. |
| `Ctrl+Shift+G` | Open Source Control. |
| `Ctrl+Shift+D` | Open Run & Debug. |
| `Ctrl+Shift+T` | Open Developer Tools. |
| `Ctrl+Shift+S` | Open Snippets. |
| `Ctrl+Shift+X` | Open Languages, Runtimes & Features. |
| `Ctrl+Alt+M` | Change the language mode. |
| `Ctrl+Alt+T` | Choose a color theme. |
| `F5` or `Ctrl+Enter` | Run the active file. |
| `Shift+F5` | Stop execution. |
| `Ctrl+K` | Open the Keyboard Shortcuts dialog. |

The exact shortcut set can vary by command context and platform. Use the in-app shortcuts dialog as the authoritative list. On macOS, the application currently labels the primary modifier as `Ctrl`, and `Alt+←`/`Alt+→` is left to Monaco's word navigation. Browser and operating-system shortcuts may take precedence.

## Browser storage and workspace portability

The active workspace is stored in `localStorage` for the JotQoda origin. This means:

- **Data location:** data stays in that browser profile and origin; it is not automatically synced between browsers or devices.
- **Keys:**
  - `jotqoda-v1` holds files, settings, groups, bookmarks, and compare tabs.
  - `jotqoda-history` holds Local History snapshots. It is capped at about 1.2 M characters, and the oldest snapshots are evicted first.
- **Durability:**
  - Clearing site data, using private browsing, or changing origins can remove or separate the saved workspace.
  - Browser storage is not a substitute for a source-control remote or a reliable backup.
  - JotQoda warns when storage is full.
- **Export and import:**
  - **Download Workspace as ZIP**, or right-click a folder and choose **Download as ZIP**, to keep a backup.
  - ZIP archives and whole folders can be imported.
  - JSON workspace export and import remains available, and individual files can be uploaded or downloaded.

No JotQoda application backend is configured in this repository.

## Architecture

The application is a client-rendered React application built by Vite. It keeps the workspace model in React state, shares IDE actions and state through a React context, and uses Monaco for editing.

```text
src/
├── App.tsx                 Workspace state, persistence, editor groups, navigation, history hooks, layout
├── main.tsx                React application entry point
├── index.css               Global styles and Tailwind import
├── components/             Editor chrome, sidebar views, panels, dialogs, and previews
│   ├── Chrome.tsx          Menus and activity bar
│   ├── CommandPalette.tsx  Files, commands, lines, @ symbols, # workspace symbols, pickers, quick pick
│   ├── EditorGroup.tsx     Tabs (pin/drag/reopen), breadcrumbs, Monaco editor, compare/diff views
│   ├── Explorer.tsx        File tree, keyboard navigation, context menus, Outline and Timeline
│   ├── SearchView.tsx      Workspace text search and replacement
│   ├── GitView.tsx         In-browser change tracking and commit history
│   ├── Terminal.tsx        Workspace shell: parser, pipes/redirection, 90+ commands
│   ├── Panel.tsx           Terminal sessions, Output, Problems, and TODOs
│   ├── Preview.tsx         Sandboxed preview frame
│   ├── StatusBar.tsx       Status items, indentation/EOL/formatter pickers, notification center
│   ├── Modals.tsx          Settings dialog, keybinding editor, prompts
│   ├── SidebarViews.tsx    Snippets, Run & Debug, Languages & Runtimes, Bookmarks
│   ├── ToolsView.tsx       Developer utilities
│   └── ...
├── ide/                    Editor, language, runner, theme, preview, and command logic
│   ├── lang/               Language catalogue
│   │   ├── grammar.ts      Grammar spec → Monarch tokenizer + language configuration
│   │   ├── specs-*.ts      300+ language specs (comments, strings, keywords, detection)
│   │   └── fileTemplates.ts New-file templates and the Polyglot workspace
│   ├── languages.ts        Language registry and detection (files, globs, shebangs, heuristics)
│   ├── symbols.ts          Regex symbol extraction for the Outline, breadcrumbs, and definitions
│   ├── outline.ts          Document symbols (TypeScript navigation tree or regex)
│   ├── monacoSetup.ts      Monaco config: grammars, completions, symbols, definitions, Emmet
│   ├── format.ts           Formatter pipeline (Prettier, SQL, XML, re-indent, whitespace)
│   ├── runner.ts           JavaScript, TypeScript, Python, and SQL execution
│   ├── runtimes.ts         Lua, Ruby, PHP, Scheme, Prolog, CoffeeScript, Clojure, WAT, Brainfuck
│   ├── history.ts          Local History storage (quota-safe)
│   ├── zip.ts              ZIP export/import and folder import
│   ├── cdn.ts              Pinned CDN URLs and lazy script/module loading
│   ├── preview.ts          Preview documents (HTML, Markdown, Mermaid, DOT, CSV …)
│   ├── commands.ts         Command registry (280+ commands)
│   ├── snippets.ts         Snippet library
│   ├── keys.ts             Keybinding helpers
│   ├── templates.ts        Default workspace, file templates, and starter projects
│   ├── themes.ts           Monaco and interface theme definitions
│   └── types.ts            Shared workspace, editor, and settings types
└── utils/
    └── cn.ts               Class-name utility
```

The production Vite configuration uses the React and Tailwind CSS plugins and `vite-plugin-singlefile` to generate a single HTML build entry point. Heavy optional dependencies (runtimes, formatters, diagram renderers, JSZip) are loaded from pinned jsDelivr URLs when first used, so they are not inlined into the build. Emmet (`emmet-monaco-es`) is bundled.

## Development commands

The npm scripts currently defined in `package.json` are:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Vite's local development server. |
| `npm run build` | Build the production app into `dist/`. |
| `npm run preview` | Serve the most recent production build locally. |

The TypeScript configuration enables strict checks and unused-local/parameter checks. To run the TypeScript compiler directly:

```sh
npx tsc --noEmit
```

There are currently no dedicated test, lint, or format scripts declared in `package.json`.

## Build and deployment

Build the application with:

```sh
npm run build
```

Deploy the generated `dist/` directory to a static host. Configure the host to serve the built `index.html` as the application entry point. Because this is a browser-only single-page application, no application server or database is required.

The HTML build is bundled as a single file by the Vite single-file plugin, but the application is **not fully offline**. These are loaded from external hosts:

- **jsDelivr:**
  - Monaco.
  - Pyodide (Python).
  - wasmoon (Lua), ruby.wasm (Ruby), php-wasm (PHP), BiwaScheme, Tau Prolog, the CoffeeScript compiler, Scittle, and wabt.js.
  - Prettier, sql-formatter, Mermaid, viz.js, and JSZip.
- **cdnjs:** SQL.js and its WebAssembly file.
- **Google Fonts:** the page's web fonts.

A deployment with a restrictive Content Security Policy, blocked CDNs, or no network access may need additional self-hosting and policy configuration. All URLs are pinned in `src/ide/cdn.ts`, `src/ide/runner.ts`, and `src/ide/monacoSetup.ts`.

## Privacy and security notes

- Workspace content, settings, and Local History are stored locally in the browser's `localStorage`; this project does not configure a server-side workspace service.
- **Third-party downloads:**
  - Runtimes, formatters, renderers, Monaco, and fonts are fetched from third-party CDNs when needed. Only the library files are downloaded; your code is not uploaded.
  - Review and pin or self-host dependencies as appropriate for your deployment requirements.
- **Running code:**
  - Running code executes user-provided programs. JavaScript, Python, SQL, and the additional runtimes use Web Workers; Scittle and previews use sandboxed iframes.
  - These features should not be treated as a security guarantee for untrusted content.
- **Network requests you trigger:** the terminal's `curl`/`wget` make network requests from your browser to the URLs you type, subject to CORS.
- Do not store secrets in workspace files or assume browser storage is encrypted.
- The app's workspace terminal is simulated and does not provide access to the host machine.
- If deploying publicly, review the generated HTML, external resource policy, and iframe sandbox settings against your threat model.

## Troubleshooting

### The development server does not start

Check your Node.js version and install the dependencies from the repository root:

```sh
node --version
npm install
npm run dev
```

### The editor stays blank or Monaco does not load

Monaco is loaded from jsDelivr. Check that the browser can reach the CDN, inspect the browser console for network or worker errors, and verify that any Content Security Policy permits the required resources.

### A runtime, formatter, or diagram does not load

The first run downloads the runtime or library from jsDelivr (cdnjs for SQL.js). Ruby is about 30 MB and PHP about 15 MB, so allow time on slow connections. Check network access and the Output panel or browser console for loading errors. If Prettier cannot be loaded, JSON/CSS/HTML/TS/JS fall back to Monaco's formatter.

### Changes are missing after a refresh

Confirm that site data is enabled and that the browser is using the same origin and profile. Export important workspaces regularly; browser storage can be cleared independently of the repository.

### A file is detected as the wrong language

Use **Change Language Mode** (`Ctrl+Alt+M`, or click the language in the status bar or breadcrumbs). **Auto Detect Language** removes the override again. Content-based detection can be turned off under Settings → Files.

### A file can be highlighted but not run

Syntax support covers more languages than the runtime. Only the formats listed in [Languages and execution](#languages-and-execution) can be run or previewed.

## Contributing

Contributions are welcome. A good change should:

1. Keep the TypeScript types and existing component conventions consistent.
2. Update this README when user-visible behavior, setup, or supported runtime details change.
3. Build successfully with `npm run build`.
4. Run `npx tsc --noEmit` when making TypeScript changes.
5. Avoid introducing claims about testing, deployment, or runtime support that the code does not provide.

### Adding a language

Add an entry to one of the `src/ide/lang/specs-*.ts` files:

```ts
{
  id: 'mylang', name: 'MyLang', ext: 'ml2 myl', color: '#ff8800', label: 'MY', cat: 'Scripting',
  files: 'Mylangfile', sh: 'mylang',          // optional: exact file names and shebang interpreters
  g: C({                                        // C = C-like preset; also H (hash comments), SQL, ML, HS, LISP, ASM
    kw: 'if else while fn return',             // keywords
    types: 'int str bool', builtins: 'print', consts: 'true false nil',
  }),
}
```

The grammar is compiled to a Monarch tokenizer and language configuration (comments, brackets, folding) on first use. The language automatically appears in the language picker, detection, the Outline, and keyword completion. Use `monaco: '<id>'` instead of `g` to reuse an existing tokenizer. Only add a `runnable` kind when there is a real runtime behind it.

There is no contribution policy or issue/PR template configured in this repository yet.

## License

This project is licensed under the Apache License 2.0. See [LICENSE](./LICENSE) for the full license text. Copyright 2026 Seigh-sword.
