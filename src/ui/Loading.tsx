import { useGame } from '../store';
import { NOISLESS_MAPS } from '../data/maps';
import { AVATARS } from '../data/avatars';

export default function Loading() {
  const g = useGame();
  const m = NOISLESS_MAPS[g.mapId];
  const a = AVATARS[g.avatarId];
  const pct = Math.round(g.loadingProgress * 100);

  return (
    <div className="absolute inset-0 z-30 crt boot">
      <div className="vignette" />
      <div className="absolute top-4 left-6 font-mono text-[10px] tracking-[0.5em] text-amber animate-blink">▌ ESTABLISHING UPLINK...</div>
      <div className="absolute top-4 right-6 font-mono text-[10px] tracking-[0.5em] text-cyan">CHANNEL 7 ●</div>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[640px] max-w-[90%]">
          <div className="text-[10px] tracking-[0.5em] text-dim font-mono mb-2">▌ DEPLOYING TO</div>
          <div className="text-phosphor glow font-pixel" style={{ fontSize: 28, letterSpacing: '0.4em' }}>
            <span className="aberration">{m.name}</span>
          </div>
          <div className="text-[10px] tracking-[0.4em] text-cyan/60 font-mono mt-2 uppercase">░ {m.theme}</div>

          <div className="mt-8">
            <div className="flex justify-between text-[10px] font-mono tracking-[0.3em] text-dim">
              <span>LOAD</span>
              <span>{String(pct).padStart(3,'0')}%</span>
            </div>
            <div className="mt-2 h-3 bg-line/40 border border-line relative overflow-hidden">
              <div className="absolute inset-y-0 left-0 bg-phosphor transition-all duration-150"
                   style={{ width: `${pct}%`, boxShadow: '0 0 12px #00ffaa' }} />
              <div className="absolute inset-0 flex">
                {Array.from({ length: 40 }).map((_, i) => (
                  <div key={i} className="flex-1 border-r border-bg/40" />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2 font-mono text-[10px] tracking-[0.3em]">
            <Cell label="OPERATIVE" value={a.name} color={a.accentColor} />
            <Cell label="ROLE" value={a.role.toUpperCase()} color={a.role === 'prey' ? '#ff2244' : '#66ccff'} />
            <Cell label="MAP ID" value={m.id.toUpperCase()} color="#ff9933" />
          </div>

          <div className="mt-8 p-3 bg-panel/70 border border-amber brackets">
            <div className="text-[9px] tracking-[0.4em] text-amber mb-1 font-mono">▌ FIELD INTEL</div>
            <div className="text-[11px] text-cyan/80 font-mono leading-relaxed">{g.loadingTip}</div>
          </div>

          <div className="mt-6 font-mono text-[10px] text-phosphor/60 space-y-0.5">
            <Tick label="GEOMETRY" delay={0} />
            <Tick label="LIGHTING" delay={100} />
            <Tick label="AUDIO MIX" delay={200} />
            <Tick label="AI ROUTINES" delay={300} />
            <Tick label="UPLINK" delay={400} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Cell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="border border-line p-2 bg-bg/60">
      <div className="text-[8px] text-dim tracking-[0.4em]">{label}</div>
      <div className="text-[12px] mt-0.5" style={{ color }}>{value}</div>
    </div>
  );
}

function Tick({ label, delay }: { label: string; delay: number }) {
  return (
    <div className="flex items-center gap-3" style={{ opacity: 0, animation: `fadeIn 0.4s ${delay}ms ease forwards` }}>
      <span className="text-phosphor">[OK]</span>
      <span>{label}</span>
      <span className="flex-1 border-b border-dotted border-dim/30 mx-1" />
      <span className="text-amber">RDY</span>
    </div>
  );
}
