# JotQoda

![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript 5.9](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Vite 7](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![Monaco Editor](https://img.shields.io/badge/Editor-Monaco-007ACC?logo=visualstudiocode&logoColor=white)
![Source lines](https://img.shields.io/badge/source-3%2C963%2B%20lines-brightgreen)
![License](https://img.shields.io/badge/license-Apache--2.0-blue)

JotQoda is a browser-based coding workspace built with React, TypeScript, Vite, and the Monaco Editor. It brings editing, lightweight in-browser execution, previews, file management, and developer utilities together in a single-page interface.

> **Project size:** the application currently contains more than 2,000 lines of TypeScript, TSX, and CSS under `src/` (3,963 non-empty source lines when this README was written). The source-lines badge is a point-in-time count and should be refreshed if you want it to remain exact.

## Contents

- [Highlights](#highlights)
- [Screenshots and interface](#interface)
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

- **A full coding workspace in the browser:** an Explorer, editor tabs, split editors, a status bar, and resizable side and bottom panels.
- **Monaco Editor:** familiar editing features, language services, configurable editor behavior, and support for a broad range of source formats.
- **In-browser code execution:** run JavaScript, TypeScript, Python, and SQL without configuring a local project runtime.
- **Live previews:** preview HTML, Markdown, SVG, CSS, and JSON files, including local workspace stylesheets and scripts referenced by HTML.
- **Workspace tools:** global search, source-control-style change tracking, a workspace terminal, snippets, and developer utilities.
- **Quick navigation:** a command palette, file picker, line navigation, and theme, language, template, and symbol pickers.
- **Persistence in the browser:** files, folders, editor settings, and workspace state are saved in the current browser profile.
- **Portable workspaces:** import or export a workspace as a JSON file, and upload or download individual files.
- **Customizable appearance:** 13 built-in themes and a wide selection of editor settings.

## Interface

The main areas of the application are:

| Area | What it does |
| --- | --- |
| Title bar and menus | Opens commands, navigation pickers, settings, and workspace actions. |
| Activity bar | Switches between Explorer, Search, Source Control, Run & Debug, Developer Tools, Snippets, and Extensions. |
| Sidebar | Displays the currently selected activity, such as the file tree or search results. |
| Editor | Edits files with Monaco; supports tabs and split editor groups. |
| Preview | Renders supported workspace files in an embedded, sandboxed frame. |
| Bottom panel | Contains the simulated Terminal, execution Output, Problems, and TODO lists. |
| Status bar | Shows context for the active editor and provides access to editor options. |

Panel sizes can be adjusted by dragging the separators. Use Zen Mode to hide the surrounding interface and focus on the editor.

## Getting started

### Requirements

- Node.js **20.19 or newer**, or **22.12 or newer**.
- npm (the repository includes `package-lock.json`).
- A modern browser for using the application.
- An internet connection for loading browser-hosted dependencies such as Monaco, Pyodide, SQL.js, and web fonts.

### Install and run locally

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

- Use the Explorer to open, create, rename, duplicate, download, and delete workspace files and folders.
- Use `/` in a new file or folder name to create nested paths, for example `src/components/Panel.tsx`.
- Upload files from your computer through the file upload command. Uploaded content is read as text.
- Use the quick-open picker (`Ctrl+P`) to find workspace files.
- Save an individual file with `Ctrl+S`, or save all files with `Ctrl+Alt+S`. Auto-save is enabled by default.
- Deleted or renamed files affect the in-browser workspace; they do not modify files on your computer.

### Editing and navigation

Monaco provides syntax-aware editing for the supported languages and formats. Depending on the language and editor configuration, the workspace includes completions, diagnostics, code folding, bracket matching, snippets, and standard editor actions.

The command palette can search and execute application commands. Other quick pickers can locate files, switch themes or languages, load templates, navigate to a line, and browse symbols where Monaco provides them.

### Search

The Search activity searches workspace file contents and supports replacement. Search is limited to files in the current JotQoda workspace; it does not search your computer's filesystem.

### Source Control

The Source Control view tracks changes against an in-browser baseline. It can show changed files, open diffs, discard changes, and create local commits with messages.

This is an **IDE-local source-control simulation**, not a Git client. It does not create a `.git` directory, invoke Git, connect to a remote, or push commits to a server. Treat its history as part of the browser-stored workspace, not as a backup.

### Terminal

The Terminal is an application-provided command interface over the JotQoda workspace. It can list and inspect workspace files, create and move files, search workspace contents, run supported files, and perform other built-in utility actions.

It is **not** a system shell: it cannot access arbitrary operating-system paths, launch installed programs, or run commands such as a real `npm`, `git`, or `bash` process. Its working directory and file operations refer to the in-browser workspace.

### Output, Problems, and TODOs

- **Output** displays execution results, logs, and runtime errors. Output can be filtered, copied, cleared, and word-wrapped.
- **Problems** displays diagnostics reported by the editor language services.
- **TODOs** collects TODO-style markers from workspace files.

## Languages and execution

JotQoda uses Monaco's language support and recognizes more than 75 languages and file formats. This includes JavaScript, TypeScript, Python, HTML, CSS, JSON, Markdown, SQL, Java, C/C++, C#, Go, Rust, Ruby, PHP, Shell, YAML, XML, and many others. Recognition and syntax highlighting do **not** imply that a compiler or runtime is available for every language.

### Runnable formats

| Format | Behavior |
| --- | --- |
| JavaScript | Runs the selected file in a browser Web Worker. Workspace JavaScript modules and JSON files can be resolved by the lightweight workspace module loader. |
| TypeScript | Is transpiled with the TypeScript language service and then run using the JavaScript worker. |
| Python | Runs in Pyodide, a WebAssembly-based Python runtime loaded in a browser worker. Python workspace files and supported data/text files are made available to that runtime. |
| SQL | Runs against SQL.js, an in-browser SQLite implementation. |
| HTML | Opens the live preview. Local referenced workspace CSS and JavaScript files are inlined when they can be resolved. |
| Markdown | Opens a rendered Markdown preview. |
| SVG | Opens a rendered SVG preview. |
| CSS | Opens a preview page with sample elements styled by the active stylesheet. |
| JSON | Validates and pretty-prints the JSON content in the preview. |

For JavaScript and TypeScript, imports must resolve to files in the workspace. The lightweight module loader is not Node.js and does not provide Node built-ins, package installation, or arbitrary npm dependencies. Some language-service diagnostics are intentionally suppressed to accommodate the browser-based environment.

Execution support is intentionally limited to the formats listed above. Other recognized languages can be edited and highlighted, but they cannot be compiled or run by this application.

## Preview behavior

The Preview panel supports desktop, tablet-width, and mobile-width layouts. It can follow the active file, refresh manually, or open the rendered document in a new browser window.

- HTML files can reference workspace stylesheets and scripts by relative path; matching workspace files are inlined into the preview.
- Markdown uses JotQoda's built-in renderer for common headings, lists, tables, links, images, and fenced code blocks. It is not a complete replacement for every Markdown extension.
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
| Empty Workspace | A minimal starting point. |

Loading a template replaces the current workspace after confirmation when it contains files. Export work you want to keep before replacing a workspace.

## Settings and themes

The application provides a settings dialog for editor behavior and workspace preferences, including font family and size, line height, indentation, line numbers, word wrap, minimap, cursor behavior, bracket and whitespace rendering, auto-save, formatting options, preview refresh, deletion confirmation, and TypeScript diagnostics.

Thirteen themes are included: JotQoda Dark, Dark+ (VS Code), Dracula, Monokai Pro, One Dark Pro, Tokyo Night, Nord, Catppuccin Mocha, Solarized Dark, Synthwave '84, GitHub Light, Solarized Light, and High Contrast.

Settings persist in the current browser profile. The Settings dialog and Keyboard Shortcuts dialog are available from the menus and welcome screen.

## Keyboard shortcuts

Shortcuts are shown in the UI and can be reviewed in the Keyboard Shortcuts dialog. Common defaults include:

| Shortcut | Action |
| --- | --- |
| `Ctrl+Shift+P` | Open the command palette. |
| `Ctrl+P` | Quick-open workspace files. |
| `Ctrl+S` | Save the active file. |
| `Ctrl+Alt+S` | Save all files. |
| `Ctrl+B` | Toggle the sidebar. |
| `Ctrl+J` | Toggle the bottom panel. |
| `Ctrl+Shift+E` | Open Explorer. |
| `Ctrl+Shift+F` | Open workspace search. |
| `Ctrl+Shift+G` | Open Source Control. |
| `Ctrl+Shift+D` | Open Run & Debug. |
| `Ctrl+Shift+T` | Open Developer Tools. |
| `Ctrl+Shift+S` | Open Snippets. |
| `Ctrl+Shift+X` | Open Extensions. |
| ``Ctrl+` `` | Toggle the terminal. |
| `F5` or `Ctrl+Enter` | Run the active file. |
| `Ctrl+\` | Split the editor. |

The exact shortcut set can vary by command context and platform. Use the in-app shortcuts dialog as the authoritative list. On macOS, the application currently labels the primary modifier as `Ctrl`; browser and operating-system shortcuts may take precedence.

## Browser storage and workspace portability

The active workspace is stored in `localStorage` for the JotQoda origin. This means:

- Data stays in that browser profile and origin; it is not automatically synced between browsers or devices.
- Clearing site data, using private browsing, or changing origins can remove or separate the saved workspace.
- Browser storage is not a substitute for a source-control remote or a reliable backup.
- Workspace export produces a JSON file containing workspace files and folders. Keep exports in a safe location if you need a backup.
- Individual files can also be uploaded into or downloaded from the workspace.

No JotQoda application backend is configured in this repository.

## Architecture

The application is a client-rendered React application built by Vite. It keeps the workspace model in React state, shares IDE actions and state through a React context, and uses Monaco for editing.

```text
src/
├── App.tsx                 Workspace state, persistence, commands, and application layout
├── main.tsx                React application entry point
├── index.css               Global styles and Tailwind import
├── components/             Editor chrome, sidebar views, panels, dialogs, and previews
│   ├── Chrome.tsx          Menus and activity bar
│   ├── EditorGroup.tsx     Monaco editor tabs and editor options
│   ├── Explorer.tsx        Workspace file tree and file actions
│   ├── SearchView.tsx      Workspace text search and replacement
│   ├── GitView.tsx         In-browser change tracking and commit history
│   ├── Terminal.tsx        Workspace-scoped command interface
│   ├── Panel.tsx           Output, Problems, TODOs, and terminal panel
│   ├── Preview.tsx         Sandboxed preview frame
│   ├── ToolsView.tsx       Developer utilities
│   ├── SidebarViews.tsx    Snippets, run actions, and extension view
│   └── ...
├── ide/                    Editor, language, runner, theme, preview, and command logic
│   ├── commands.ts         Command registry and editor actions
│   ├── languages.ts        Language and file-extension metadata
│   ├── monacoSetup.ts      Monaco configuration and language providers
│   ├── preview.ts          Preview document generation
│   ├── runner.ts           JavaScript, Python, SQL, and TypeScript execution
│   ├── templates.ts        Default workspace, file templates, and starter projects
│   ├── themes.ts           Monaco and interface theme definitions
│   └── types.ts            Shared workspace, editor, and settings types
└── utils/
    └── cn.ts               Class-name utility
```

The production Vite configuration uses the React and Tailwind CSS plugins and `vite-plugin-singlefile` to generate a single HTML build entry point. Some editor/runtime dependencies are still loaded from external CDNs at runtime.

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

The HTML build is bundled as a single file by the Vite single-file plugin, but the application is **not fully offline**: Monaco is loaded from jsDelivr, Python uses Pyodide from jsDelivr, SQL.js and its WebAssembly file are loaded from cdnjs, and the page requests fonts from Google Fonts. A deployment with a restrictive Content Security Policy, blocked CDNs, or no network access may need additional self-hosting and policy configuration.

## Privacy and security notes

- Workspace content and settings are stored locally in the browser's `localStorage`; this project does not configure a server-side workspace service.
- Python, SQL.js, Monaco, and fonts are fetched from third-party CDNs. Review and pin/self-host dependencies as appropriate for your deployment requirements.
- Running code executes user-provided programs. JavaScript runs in a Web Worker, Python and SQL use browser workers, and previews use a sandboxed iframe, but these features should not be treated as a security guarantee for untrusted content.
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

### Python or SQL execution does not start

The first run may need to download Pyodide or SQL.js. Check network access to the configured CDN and the browser console/output panel for loading errors. These runtimes are not bundled as an offline installation.

### Changes are missing after a refresh

Confirm that site data is enabled and that the browser is using the same origin and profile. Export important workspaces regularly; browser storage can be cleared independently of the repository.

### A file can be highlighted but not run

Syntax support covers more languages than the runtime. Only the formats listed in [Languages and execution](#languages-and-execution) can be run or previewed.

## Contributing

Contributions are welcome. A good change should:

1. Keep the TypeScript types and existing component conventions consistent.
2. Update this README when user-visible behavior, setup, or supported runtime details change.
3. Build successfully with `npm run build`.
4. Run `npx tsc --noEmit` when making TypeScript changes.
5. Avoid introducing claims about testing, deployment, or runtime support that the code does not provide.

There is no contribution policy or issue/PR template configured in this repository yet.

## License

This project is licensed under the Apache License 2.0. See [LICENSE](./LICENSE) for the full license text. Copyright 2026 Seigh-sword.
