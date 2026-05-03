export default function Header() {
  return (
    <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between pt-4 px-6 pointer-events-none font-mono">
      <div className="flex items-center gap-3 text-phosphor glow flicker">
        <div className="w-2 h-2 rounded-full bg-alert animate-rec" />
        <span className="text-[11px] tracking-[0.5em]">REC</span>
        <span className="text-[11px] tracking-[0.5em] text-cyan">// LIVE FEED</span>
      </div>

      <div className="flex items-baseline gap-2 aberration">
        <span className="text-phosphor glow font-pixel" style={{fontSize:14, letterSpacing:'0.2em'}}>
          NOISLESS
        </span>
        <span className="text-[10px] tracking-[0.4em] text-dim">// TACTICAL ATLAS</span>
        <span className="text-[10px] tracking-[0.4em] text-amber">v0.3</span>
      </div>

      <div className="flex items-center gap-3 text-cyan">
        <span className="text-[10px] tracking-[0.4em]">SYS:OK</span>
        <span className="text-[10px] tracking-[0.4em] text-phosphor animate-blink">●</span>
        <span className="text-[10px] tracking-[0.4em] text-amber">UPLINK</span>
      </div>
    </div>
  );
}
