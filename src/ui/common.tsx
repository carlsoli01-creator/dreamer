import { ReactNode, ButtonHTMLAttributes } from 'react';

export function Panel({ children, className = '', glow }: { children: ReactNode; className?: string; glow?: 'phosphor'|'amber'|'cyan'|'alert' }) {
  const border = glow === 'amber' ? 'border-amber'
                : glow === 'cyan' ? 'border-cyan'
                : glow === 'alert' ? 'border-alert'
                : 'border-line';
  return (
    <div className={`relative bg-panel/85 backdrop-blur-md border ${border} brackets text-cyan/80 ${className}`}>
      {children}
    </div>
  );
}

export function SectionHeader({ children, color = 'phosphor' }: { children: ReactNode; color?: 'phosphor'|'amber'|'cyan'|'alert' }) {
  const cls = color === 'amber' ? 'text-amber border-amber'
            : color === 'cyan' ? 'text-cyan border-cyan'
            : color === 'alert' ? 'text-alert border-alert'
            : 'text-phosphor border-phosphor';
  return (
    <div className={`text-[10px] tracking-[0.5em] mb-3 pl-2 border-l-2 ${cls} font-mono`}>
      ▌ {children}
    </div>
  );
}

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary'|'ghost'|'danger';
  size?: 'sm'|'md'|'lg';
}
export function Btn({ children, variant = 'ghost', size = 'md', className = '', ...rest }: BtnProps) {
  const sz = size === 'lg' ? 'px-6 py-3 text-[12px]' : size === 'sm' ? 'px-2 py-1 text-[10px]' : 'px-4 py-2 text-[11px]';
  const v = variant === 'primary'
    ? 'border-phosphor text-phosphor hover:bg-phosphor/10 glow'
    : variant === 'danger'
    ? 'border-alert text-alert hover:bg-alert/10'
    : 'border-line text-cyan/80 hover:border-cyan hover:bg-cyan/5';
  return (
    <button {...rest} className={`font-mono tracking-[0.3em] uppercase border bg-panel/60 brackets transition-all ${sz} ${v} ${className} disabled:opacity-30 disabled:cursor-not-allowed`}>
      {children}
    </button>
  );
}

export function StatBar({ value, max = 1, color = '#00ffaa' }: { value: number; max?: number; color?: string }) {
  const pct = Math.max(0, Math.min(1, value / max)) * 100;
  return (
    <div className="h-[3px] w-full bg-line/50 relative">
      <div className="absolute left-0 top-0 bottom-0" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}` }} />
    </div>
  );
}

export function AsciiBar({ value, n = 12, color = 'text-phosphor' }: { value: number; n?: number; color?: string }) {
  const filled = Math.round(Math.max(0, Math.min(1, value)) * n);
  return <span className={`ascii-bar ${color}`}>{'▮'.repeat(filled)}{'▯'.repeat(n - filled)}</span>;
}

export function Crosshair() {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
      <div className="relative w-32 h-32 brackets text-phosphor/70 glow">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-phosphor/20" />
        <div className="absolute top-1/2 left-0 right-0 h-px bg-phosphor/20" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 border border-phosphor" />
      </div>
    </div>
  );
}
