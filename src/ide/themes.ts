export interface ThemeDef {
  id: string;
  name: string;
  base: 'vs' | 'vs-dark' | 'hc-black';
  ui: { bg: string; side: string; act: string; panel: string; border: string; fg: string; muted: string; accent: string; tab: string; hover: string; input: string; status: string; statusFg: string };
  tk: { comment: string; keyword: string; string: string; number: string; type: string; fn: string; variable: string; operator: string; tag: string; attr: string };
}

const dark = (id: string, name: string, ui: Partial<ThemeDef['ui']>, tk: ThemeDef['tk']): ThemeDef => ({
  id, name, base: 'vs-dark',
  ui: { bg: '#1e1e1e', side: '#252526', act: '#333333', panel: '#1e1e1e', border: '#2b2b2b', fg: '#cccccc', muted: '#858585', accent: '#0078d4', tab: '#2d2d2d', hover: '#2a2d2e', input: '#3c3c3c', status: '#007acc', statusFg: '#ffffff', ...ui },
  tk,
});

export const THEMES: ThemeDef[] = [
  dark('jotqoda-dark', 'JotQoda Dark', { bg: '#0d1117', side: '#010409', act: '#010409', panel: '#0d1117', border: '#21262d', fg: '#e6edf3', muted: '#7d8590', accent: '#8b5cf6', tab: '#010409', hover: '#161b22', input: '#161b22', status: '#6d28d9' },
    { comment: '6a737d', keyword: 'c084fc', string: 'a5d6ff', number: '79c0ff', type: 'ffa657', fn: 'd2a8ff', variable: 'e6edf3', operator: 'ff7b72', tag: '7ee787', attr: '79c0ff' }),
  dark('dark-plus', 'Dark+ (VS Code)', {}, { comment: '6a9955', keyword: '569cd6', string: 'ce9178', number: 'b5cea8', type: '4ec9b0', fn: 'dcdcaa', variable: '9cdcfe', operator: 'd4d4d4', tag: '569cd6', attr: '9cdcfe' }),
  dark('dracula', 'Dracula', { bg: '#282a36', side: '#21222c', act: '#343746', panel: '#282a36', border: '#191a21', fg: '#f8f8f2', muted: '#6272a4', accent: '#bd93f9', tab: '#21222c', hover: '#44475a', input: '#44475a', status: '#bd93f9', statusFg: '#282a36' },
    { comment: '6272a4', keyword: 'ff79c6', string: 'f1fa8c', number: 'bd93f9', type: '8be9fd', fn: '50fa7b', variable: 'f8f8f2', operator: 'ff79c6', tag: 'ff79c6', attr: '50fa7b' }),
  dark('monokai', 'Monokai Pro', { bg: '#2d2a2e', side: '#221f22', act: '#19181a', panel: '#2d2a2e', border: '#19181a', fg: '#fcfcfa', muted: '#939293', accent: '#ffd866', tab: '#221f22', hover: '#403e41', input: '#403e41', status: '#ffd866', statusFg: '#2d2a2e' },
    { comment: '727072', keyword: 'ff6188', string: 'ffd866', number: 'ab9df2', type: '78dce8', fn: 'a9dc76', variable: 'fcfcfa', operator: 'ff6188', tag: 'ff6188', attr: '78dce8' }),
  dark('one-dark', 'One Dark Pro', { bg: '#282c34', side: '#21252b', act: '#21252b', panel: '#282c34', border: '#181a1f', fg: '#abb2bf', muted: '#5c6370', accent: '#61afef', tab: '#21252b', hover: '#2c313a', input: '#1d1f23', status: '#21252b', statusFg: '#9da5b4' },
    { comment: '5c6370', keyword: 'c678dd', string: '98c379', number: 'd19a66', type: 'e5c07b', fn: '61afef', variable: 'e06c75', operator: '56b6c2', tag: 'e06c75', attr: 'd19a66' }),
  dark('tokyo-night', 'Tokyo Night', { bg: '#1a1b26', side: '#16161e', act: '#16161e', panel: '#1a1b26', border: '#101014', fg: '#c0caf5', muted: '#565f89', accent: '#7aa2f7', tab: '#16161e', hover: '#292e42', input: '#14141b', status: '#3d59a1' },
    { comment: '565f89', keyword: 'bb9af7', string: '9ece6a', number: 'ff9e64', type: '2ac3de', fn: '7aa2f7', variable: 'c0caf5', operator: '89ddff', tag: 'f7768e', attr: 'bb9af7' }),
  dark('nord', 'Nord', { bg: '#2e3440', side: '#2e3440', act: '#2e3440', panel: '#2e3440', border: '#3b4252', fg: '#d8dee9', muted: '#616e88', accent: '#88c0d0', tab: '#3b4252', hover: '#3b4252', input: '#3b4252', status: '#3b4252', statusFg: '#d8dee9' },
    { comment: '616e88', keyword: '81a1c1', string: 'a3be8c', number: 'b48ead', type: '8fbcbb', fn: '88c0d0', variable: 'd8dee9', operator: '81a1c1', tag: '81a1c1', attr: '8fbcbb' }),
  dark('catppuccin', 'Catppuccin Mocha', { bg: '#1e1e2e', side: '#181825', act: '#11111b', panel: '#1e1e2e', border: '#11111b', fg: '#cdd6f4', muted: '#6c7086', accent: '#cba6f7', tab: '#181825', hover: '#313244', input: '#313244', status: '#cba6f7', statusFg: '#11111b' },
    { comment: '6c7086', keyword: 'cba6f7', string: 'a6e3a1', number: 'fab387', type: 'f9e2af', fn: '89b4fa', variable: 'cdd6f4', operator: '89dceb', tag: 'f38ba8', attr: 'f9e2af' }),
  dark('solarized-dark', 'Solarized Dark', { bg: '#002b36', side: '#00212b', act: '#00212b', panel: '#002b36', border: '#073642', fg: '#93a1a1', muted: '#586e75', accent: '#2aa198', tab: '#00212b', hover: '#073642', input: '#073642', status: '#00212b', statusFg: '#93a1a1' },
    { comment: '586e75', keyword: '859900', string: '2aa198', number: 'd33682', type: 'b58900', fn: '268bd2', variable: '93a1a1', operator: '859900', tag: '268bd2', attr: '93a1a1' }),
  dark('synthwave', "Synthwave '84", { bg: '#262335', side: '#1e1a2e', act: '#171520', panel: '#262335', border: '#34294f', fg: '#ffffff', muted: '#848bbd', accent: '#ff7edb', tab: '#1e1a2e', hover: '#34294f', input: '#2a2139', status: '#ff7edb', statusFg: '#262335' },
    { comment: '848bbd', keyword: 'fede5d', string: 'ff8b39', number: 'f97e72', type: 'fe4450', fn: '36f9f6', variable: 'ff7edb', operator: 'fede5d', tag: '72f1b8', attr: 'fede5d' }),
  {
    id: 'github-light', name: 'GitHub Light', base: 'vs',
    ui: { bg: '#ffffff', side: '#f6f8fa', act: '#f6f8fa', panel: '#ffffff', border: '#d0d7de', fg: '#1f2328', muted: '#656d76', accent: '#0969da', tab: '#f6f8fa', hover: '#eaeef2', input: '#ffffff', status: '#0969da', statusFg: '#ffffff' },
    tk: { comment: '6e7781', keyword: 'cf222e', string: '0a3069', number: '0550ae', type: '953800', fn: '8250df', variable: '1f2328', operator: 'cf222e', tag: '116329', attr: '0550ae' },
  },
  {
    id: 'solarized-light', name: 'Solarized Light', base: 'vs',
    ui: { bg: '#fdf6e3', side: '#eee8d5', act: '#eee8d5', panel: '#fdf6e3', border: '#ddd6c1', fg: '#586e75', muted: '#93a1a1', accent: '#268bd2', tab: '#eee8d5', hover: '#e5dfc9', input: '#fdf6e3', status: '#eee8d5', statusFg: '#586e75' },
    tk: { comment: '93a1a1', keyword: '859900', string: '2aa198', number: 'd33682', type: 'b58900', fn: '268bd2', variable: '657b83', operator: '859900', tag: '268bd2', attr: '93a1a1' },
  },
  {
    id: 'high-contrast', name: 'High Contrast', base: 'hc-black',
    ui: { bg: '#000000', side: '#000000', act: '#000000', panel: '#000000', border: '#6fc3df', fg: '#ffffff', muted: '#cccccc', accent: '#f38518', tab: '#000000', hover: '#1a1a1a', input: '#000000', status: '#000000', statusFg: '#ffffff' },
    tk: { comment: '7ca668', keyword: '569cd6', string: 'ce9178', number: 'b5cea8', type: '4ec9b0', fn: 'dcdcaa', variable: '9cdcfe', operator: 'ffffff', tag: '569cd6', attr: '9cdcfe' },
  },
];

export function getTheme(id: string) {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export function defineMonacoThemes(monaco: any) {
  for (const t of THEMES) {
    const k = t.tk;
    monaco.editor.defineTheme(t.id, {
      base: t.base,
      inherit: true,
      rules: [
        { token: 'comment', foreground: k.comment, fontStyle: 'italic' },
        { token: 'keyword', foreground: k.keyword },
        { token: 'string', foreground: k.string },
        { token: 'number', foreground: k.number },
        { token: 'type', foreground: k.type },
        { token: 'type.identifier', foreground: k.type },
        { token: 'identifier', foreground: k.variable },
        { token: 'delimiter', foreground: k.operator },
        { token: 'operator', foreground: k.operator },
        { token: 'tag', foreground: k.tag },
        { token: 'attribute.name', foreground: k.attr },
        { token: 'attribute.value', foreground: k.string },
        { token: 'regexp', foreground: k.operator },
        { token: 'predefined', foreground: k.fn },
        { token: 'function', foreground: k.fn },
        { token: 'variable', foreground: k.variable },
        { token: 'constant', foreground: k.number },
        { token: 'key', foreground: k.attr },
        { token: 'string.key.json', foreground: k.attr },
        { token: 'string.value.json', foreground: k.string },
        { token: 'metatag', foreground: k.keyword },
      ],
      colors: {
        'editor.background': t.ui.bg,
        'editor.foreground': t.ui.fg,
        'editorLineNumber.foreground': t.ui.muted + '99',
        'editorLineNumber.activeForeground': t.ui.fg,
        'editorGutter.background': t.ui.bg,
        'minimap.background': t.ui.bg,
        'editorCursor.foreground': t.ui.accent,
        'editorWidget.background': t.ui.side,
        'editorSuggestWidget.background': t.ui.side,
        'editorHoverWidget.background': t.ui.side,
        'editorWidget.border': t.ui.border,
        'focusBorder': t.ui.accent,
      },
    });
  }
}

export function applyUiTheme(t: ThemeDef) {
  const r = document.documentElement.style;
  Object.entries(t.ui).forEach(([k, v]) => r.setProperty('--' + k, v));
  document.documentElement.style.colorScheme = t.base === 'vs' ? 'light' : 'dark';
}
