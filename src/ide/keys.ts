/** Keyboard helpers shared by the global shortcut dispatcher and the keybinding editor. */
export function keyString(e: KeyboardEvent | { ctrlKey: boolean; metaKey: boolean; shiftKey: boolean; altKey: boolean; code: string; key: string }) {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
  if (e.shiftKey) parts.push('Shift');
  if (e.altKey) parts.push('Alt');
  const map: Record<string, string> = { Backquote: '`', Backslash: '\\', Equal: '=', Minus: '-', Comma: ',', Slash: '/', Period: '.', NumpadAdd: '=', NumpadSubtract: '-', BracketLeft: '[', BracketRight: ']', Semicolon: ';', Quote: "'" };
  let k = map[e.code] ?? (e.code.startsWith('Key') ? e.code.slice(3) : e.code.startsWith('Digit') ? e.code.slice(5) : e.key);
  if (k.length === 1) k = k.toUpperCase();
  parts.push(k);
  return parts.join('+');
}
export const normKey = (k: string) => { const p = k.split('+'); const mods = ['Ctrl', 'Shift', 'Alt'].filter((m) => p.includes(m)); return [...mods, p.filter((x) => !['Ctrl', 'Shift', 'Alt'].includes(x)).join('+')].join('+'); };

