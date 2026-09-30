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

const light = (id: string, name: string, ui: Partial<ThemeDef['ui']>, tk: ThemeDef['tk']): ThemeDef => ({
  id, name, base: 'vs',
  ui: { bg: '#ffffff', side: '#f3f3f3', act: '#f3f3f3', panel: '#ffffff', border: '#e5e5e5', fg: '#333333', muted: '#6f6f6f', accent: '#005fb8', tab: '#f3f3f3', hover: '#e8e8e8', input: '#ffffff', status: '#005fb8', statusFg: '#ffffff', ...ui },
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
  dark('github-dark-dimmed', 'GitHub Dark Dimmed', { bg: '#22272e', side: '#1c2128', act: '#1c2128', panel: '#22272e', border: '#444c56', fg: '#adbac7', muted: '#768390', accent: '#539bf5', tab: '#1c2128', hover: '#2d333b', input: '#2d333b', status: '#316dca' },
    { comment: '768390', keyword: 'f47067', string: '96d0ff', number: '6cb6ff', type: 'f69d50', fn: 'dcbdfb', variable: 'adbac7', operator: 'f47067', tag: '8ddb8c', attr: '6cb6ff' }),
  dark('gruvbox-dark', 'Gruvbox Dark', { bg: '#282828', side: '#1d2021', act: '#1d2021', panel: '#282828', border: '#3c3836', fg: '#ebdbb2', muted: '#928374', accent: '#fabd2f', tab: '#1d2021', hover: '#3c3836', input: '#3c3836', status: '#504945', statusFg: '#ebdbb2' },
    { comment: '928374', keyword: 'fb4934', string: 'b8bb26', number: 'd3869b', type: 'fabd2f', fn: '8ec07c', variable: 'ebdbb2', operator: 'fe8019', tag: 'fb4934', attr: 'fabd2f' }),
  dark('ayu-dark', 'Ayu Dark', { bg: '#0b0e14', side: '#0d1017', act: '#0d1017', panel: '#0b0e14', border: '#1b1f29', fg: '#bfbdb6', muted: '#565b66', accent: '#e6b450', tab: '#0d1017', hover: '#131721', input: '#131721', status: '#0d1017', statusFg: '#bfbdb6' },
    { comment: '5c6773', keyword: 'ff8f40', string: 'aad94c', number: 'd2a6ff', type: '59c2ff', fn: 'ffb454', variable: 'bfbdb6', operator: 'f29668', tag: '39bae6', attr: 'ffb454' }),
  dark('night-owl', 'Night Owl', { bg: '#011627', side: '#011627', act: '#011627', panel: '#011627', border: '#122d42', fg: '#d6deeb', muted: '#5f7e97', accent: '#7e57c2', tab: '#01111d', hover: '#0b2942', input: '#0b253a', status: '#011627', statusFg: '#d6deeb' },
    { comment: '637777', keyword: 'c792ea', string: 'ecc48d', number: 'f78c6c', type: 'ffcb8b', fn: '82aaff', variable: 'd6deeb', operator: '7fdbca', tag: '7fdbca', attr: 'addb67' }),
  dark('palenight', 'Material Palenight', { bg: '#292d3e', side: '#292d3e', act: '#292d3e', panel: '#292d3e', border: '#1f2233', fg: '#a6accd', muted: '#676e95', accent: '#80cbc4', tab: '#292d3e', hover: '#34324a', input: '#333747', status: '#292d3e', statusFg: '#a6accd' },
    { comment: '676e95', keyword: 'c792ea', string: 'c3e88d', number: 'f78c6c', type: 'ffcb6b', fn: '82aaff', variable: 'a6accd', operator: '89ddff', tag: 'f07178', attr: 'ffcb6b' }),
  dark('monokai-classic', 'Monokai Classic', { bg: '#272822', side: '#1e1f1c', act: '#1e1f1c', panel: '#272822', border: '#414339', fg: '#f8f8f2', muted: '#90908a', accent: '#a6e22e', tab: '#1e1f1c', hover: '#3e3d32', input: '#414339', status: '#414339', statusFg: '#f8f8f2' },
    { comment: '88846f', keyword: 'f92672', string: 'e6db74', number: 'ae81ff', type: '66d9ef', fn: 'a6e22e', variable: 'f8f8f2', operator: 'f92672', tag: 'f92672', attr: 'a6e22e' }),
  dark('cobalt2', 'Cobalt2', { bg: '#193549', side: '#15232d', act: '#15232d', panel: '#193549', border: '#0d3a58', fg: '#ffffff', muted: '#aaaaaa', accent: '#ffc600', tab: '#15232d', hover: '#1f4662', input: '#15232d', status: '#15232d', statusFg: '#ffc600' },
    { comment: '0088ff', keyword: 'ff9d00', string: '3ad900', number: 'ff628c', type: '80ffbb', fn: 'ffdd00', variable: 'ffffff', operator: 'ff9d00', tag: '9effff', attr: 'ffc600' }),
  dark('rose-pine', 'Rosé Pine', { bg: '#191724', side: '#1f1d2e', act: '#1f1d2e', panel: '#191724', border: '#26233a', fg: '#e0def4', muted: '#6e6a86', accent: '#c4a7e7', tab: '#1f1d2e', hover: '#26233a', input: '#26233a', status: '#1f1d2e', statusFg: '#e0def4' },
    { comment: '6e6a86', keyword: '31748f', string: 'f6c177', number: 'ebbcba', type: '9ccfd8', fn: 'ebbcba', variable: 'e0def4', operator: '908caa', tag: '9ccfd8', attr: 'c4a7e7' }),
  dark('everforest', 'Everforest Dark', { bg: '#2d353b', side: '#232a2e', act: '#232a2e', panel: '#2d353b', border: '#343f44', fg: '#d3c6aa', muted: '#859289', accent: '#a7c080', tab: '#232a2e', hover: '#343f44', input: '#343f44', status: '#343f44', statusFg: '#d3c6aa' },
    { comment: '859289', keyword: 'e67e80', string: 'a7c080', number: 'd699b6', type: 'dbbc7f', fn: '83c092', variable: 'd3c6aa', operator: 'e69875', tag: 'e67e80', attr: 'dbbc7f' }),
  dark('kanagawa', 'Kanagawa', { bg: '#1f1f28', side: '#16161d', act: '#16161d', panel: '#1f1f28', border: '#2a2a37', fg: '#dcd7ba', muted: '#727169', accent: '#7e9cd8', tab: '#16161d', hover: '#2a2a37', input: '#2a2a37', status: '#16161d', statusFg: '#c8c093' },
    { comment: '727169', keyword: '957fb8', string: '98bb6c', number: 'd27e99', type: '7aa89f', fn: '7e9cd8', variable: 'dcd7ba', operator: 'c0a36e', tag: 'e6c384', attr: 'e6c384' }),
  dark('horizon', 'Horizon', { bg: '#1c1e26', side: '#1a1c23', act: '#16161c', panel: '#1c1e26', border: '#232530', fg: '#d5d8da', muted: '#6c6f93', accent: '#e95678', tab: '#1a1c23', hover: '#2e303e', input: '#2e303e', status: '#1c1e26', statusFg: '#d5d8da' },
    { comment: '6c6f93', keyword: 'b877db', string: 'fab795', number: 'f09483', type: 'fac29a', fn: '25b0bc', variable: 'e95678', operator: 'bbbbbb', tag: 'e95678', attr: 'f09483' }),
  dark('shades-of-purple', 'Shades of Purple', { bg: '#2d2b55', side: '#222244', act: '#28284e', panel: '#2d2b55', border: '#1e1e3f', fg: '#ffffff', muted: '#a599e9', accent: '#fad000', tab: '#222244', hover: '#3b3872', input: '#1e1e3f', status: '#1e1e3f', statusFg: '#a599e9' },
    { comment: 'b362ff', keyword: 'ff9d00', string: 'a5ff90', number: 'ff628c', type: 'fb94ff', fn: 'fad000', variable: '9effff', operator: 'ff9d00', tag: '9effff', attr: 'fad000' }),
  light('light-plus', 'Light+ (VS Code)', {},
    { comment: '008000', keyword: '0000ff', string: 'a31515', number: '098658', type: '267f99', fn: '795e26', variable: '001080', operator: '000000', tag: '800000', attr: 'e50000' }),
  light('one-light', 'Atom One Light', { bg: '#fafafa', side: '#eaeaeb', act: '#eaeaeb', panel: '#fafafa', border: '#dbdbdc', fg: '#383a42', muted: '#a0a1a7', accent: '#526fff', tab: '#eaeaeb', hover: '#e5e5e6', input: '#ffffff', status: '#eaeaeb', statusFg: '#424243' },
    { comment: 'a0a1a7', keyword: 'a626a4', string: '50a14f', number: '986801', type: 'c18401', fn: '4078f2', variable: '383a42', operator: '0184bc', tag: 'e45649', attr: '986801' }),
  light('gruvbox-light', 'Gruvbox Light', { bg: '#fbf1c7', side: '#f2e5bc', act: '#ebdbb2', panel: '#fbf1c7', border: '#d5c4a1', fg: '#3c3836', muted: '#7c6f64', accent: '#af3a03', tab: '#f2e5bc', hover: '#ebdbb2', input: '#f9f5d7', status: '#d5c4a1', statusFg: '#3c3836' },
    { comment: '928374', keyword: '9d0006', string: '79740e', number: '8f3f71', type: 'b57614', fn: '427b58', variable: '3c3836', operator: 'af3a03', tag: '9d0006', attr: 'b57614' }),
  light('catppuccin-latte', 'Catppuccin Latte', { bg: '#eff1f5', side: '#e6e9ef', act: '#dce0e8', panel: '#eff1f5', border: '#dce0e8', fg: '#4c4f69', muted: '#8c8fa1', accent: '#8839ef', tab: '#e6e9ef', hover: '#ccd0da', input: '#ffffff', status: '#8839ef' },
    { comment: '8c8fa1', keyword: '8839ef', string: '40a02b', number: 'fe640b', type: 'df8e1d', fn: '1e66f5', variable: '4c4f69', operator: '04a5e5', tag: 'd20f39', attr: 'df8e1d' }),
  light('rose-pine-dawn', 'Rosé Pine Dawn', { bg: '#faf4ed', side: '#fffaf3', act: '#f2e9e1', panel: '#faf4ed', border: '#f2e9e1', fg: '#575279', muted: '#9893a5', accent: '#907aa9', tab: '#fffaf3', hover: '#f2e9e1', input: '#fffaf3', status: '#f2e9e1', statusFg: '#575279' },
    { comment: '9893a5', keyword: '286983', string: 'ea9d34', number: 'd7827e', type: '56949f', fn: 'd7827e', variable: '575279', operator: '797593', tag: '56949f', attr: '907aa9' }),
  light('ayu-light', 'Ayu Light', { bg: '#fcfcfc', side: '#f8f9fa', act: '#f3f4f5', panel: '#fcfcfc', border: '#e7eaed', fg: '#5c6166', muted: '#8a9199', accent: '#ffaa33', tab: '#f8f9fa', hover: '#ebeef0', input: '#ffffff', status: '#f8f9fa', statusFg: '#5c6166' },
    { comment: '9da2a6', keyword: 'fa8d3e', string: '86b300', number: 'a37acc', type: '399ee6', fn: 'f2ae49', variable: '5c6166', operator: 'ed9366', tag: '55b4d4', attr: 'f2ae49' }),
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
    const lt = t.base === 'vs';
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
        { token: 'annotation', foreground: k.fn },
        { token: 'keyword.directive', foreground: k.keyword },
        { token: 'variable.predefined', foreground: k.type },
        { token: 'string.escape', foreground: k.number },
        { token: 'string.link', foreground: k.fn, fontStyle: 'underline' },
        { token: 'number.hex', foreground: k.number },
        { token: 'strong', fontStyle: 'bold' },
        { token: 'emphasis', fontStyle: 'italic' },
        { token: 'invalid', foreground: lt ? 'cd3131' : 'f44747' },
        { token: 'diff.inserted', foreground: lt ? '22863a' : '89d185' },
        { token: 'diff.deleted', foreground: lt ? 'b31d28' : 'f14c4c' },
        { token: 'log.date', foreground: k.number },
        { token: 'log.error', foreground: lt ? 'cd3131' : 'f14c4c', fontStyle: 'bold' },
        { token: 'log.warn', foreground: lt ? 'bf8803' : 'cca700' },
        { token: 'log.info', foreground: k.fn },
        { token: 'log.debug', foreground: k.comment },
        ...[k.keyword, k.string, k.number, k.type, k.fn, k.attr, k.tag, k.operator].map((c, i) => ({ token: 'csv.c' + i, foreground: c })),
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
