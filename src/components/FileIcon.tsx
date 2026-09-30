import { getLang } from '../ide/languages';
import type { SymKind } from '../ide/symbols';

function luminance(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return 0.5;
  const n = parseInt(m[1], 16);
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
}

export function FileIcon({ path, size = 'sm' }: { path: string; size?: 'sm' | 'md' }) {
  const l = getLang(path);
  const w = size === 'sm' ? 'w-[22px] h-[14px] text-[8px]' : 'w-8 h-5 text-[10px]';
  const dark = luminance(l.color) < 0.22;
  const base = dark ? '#9ca3af' : l.color;
  // mix towards the theme foreground so labels stay readable on light and dark themes
  const fg = `color-mix(in srgb, ${base} 72%, var(--fg))`;
  return (
    <span
      className={`${w} inline-flex shrink-0 items-center justify-center rounded-[3px] font-bold font-mono leading-none`}
      style={{ background: base + '26', color: fg, border: `1px solid ${base}66` }}
      title={l.name}
    >
      {l.label}
    </span>
  );
}

const PRETTY: Record<string, string> = { ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', Enter: '↵', Escape: 'Esc', Backspace: '⌫', Delete: 'Del' };
export const prettyKey = (k: string) => k.split('+').map((p) => PRETTY[p] ?? p).join('+');

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex gap-0.5">
      {prettyKey(String(children)).split('+').map((k, i) => (
        <kbd key={i} className="px-1.5 py-0.5 rounded text-[10px] font-mono border border-[var(--border)] bg-[var(--input)] text-[var(--muted)]">{k}</kbd>
      ))}
    </span>
  );
}

const SYM: Record<SymKind, [string, string]> = {
  file: ['F', '#9ca3af'], module: ['M', '#e5c07b'], namespace: ['N', '#e5c07b'], package: ['P', '#e5c07b'], class: ['C', '#ee9d28'], struct: ['S', '#ee9d28'],
  interface: ['I', '#75beff'], enum: ['E', '#ee9d28'], type: ['T', '#4ec9b0'], method: ['m', '#b180d7'], function: ['ƒ', '#b180d7'], constructor: ['c', '#b180d7'],
  property: ['p', '#75beff'], field: ['f', '#75beff'], variable: ['v', '#75beff'], constant: ['K', '#4fc1ff'], string: ['#', '#4fc1ff'], key: ['k', '#75beff'],
  event: ['e', '#ee9d28'], heading: ['H', '#519aba'], selector: ['{', '#d7ba7d'], target: ['▶', '#89d185'],
};

export function SymbolIcon({ kind }: { kind: SymKind }) {
  const [ch, color] = SYM[kind] ?? ['?', '#9ca3af'];
  return (
    <span className="w-4 h-4 shrink-0 inline-flex items-center justify-center rounded-[3px] text-[10px] font-bold font-mono leading-none" style={{ color, background: color + '22' }} title={kind}>
      {ch}
    </span>
  );
}
