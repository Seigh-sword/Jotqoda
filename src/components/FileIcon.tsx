import { getLang } from '../ide/languages';

export function FileIcon({ path, size = 'sm' }: { path: string; size?: 'sm' | 'md' }) {
  const l = getLang(path);
  const w = size === 'sm' ? 'w-[22px] h-[14px] text-[8px]' : 'w-8 h-5 text-[10px]';
  return (
    <span
      className={`${w} inline-flex shrink-0 items-center justify-center rounded-[3px] font-bold font-mono leading-none`}
      style={{ background: l.color + '26', color: l.color === '#000080' || l.color === '#141414' || l.color === '#555555' ? '#9ca3af' : l.color, border: `1px solid ${l.color}55` }}
      title={l.name}
    >
      {l.label}
    </span>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex gap-0.5">
      {String(children).split('+').map((k, i) => (
        <kbd key={i} className="px-1.5 py-0.5 rounded text-[10px] font-mono border border-[var(--border)] bg-[var(--input)] text-[var(--muted)]">{k}</kbd>
      ))}
    </span>
  );
}
