import { useGame } from '../store';
import { AVATARS, AVATAR_IDS } from '../data/avatars';
import { Btn, Panel, SectionHeader, StatBar } from './common';
import { audio } from '../audio/engine';

export default function AvatarSelect() {
  const g = useGame();

  return (
    <div className="absolute inset-0 z-30 boot crt overflow-auto">
      <div className="vignette" />
      <div className="absolute top-4 left-6 font-mono text-[10px] tracking-[0.5em] text-amber">▌ STEP 1 / 3 · SELECT OPERATIVE</div>
      <div className="absolute top-4 right-6 font-mono text-[10px] tracking-[0.5em] text-cyan animate-blink">CHANNEL 7 ●</div>

      <div className="max-w-[1100px] mx-auto pt-20 px-6">
        <div className="text-phosphor glow font-pixel mb-6" style={{ fontSize: 22, letterSpacing: '0.4em' }}>
          <span className="aberration">SELECT OPERATIVE</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {AVATAR_IDS.map(id => {
            const a = AVATARS[id];
            const sel = g.avatarId === id;
            return (
              <button
                key={id}
                onClick={() => { audio.ui(); g.setAvatar(id); g.setRole(a.role); }}
                className={`relative text-left p-4 transition-all border bg-panel/70 backdrop-blur-md brackets ${
                  sel ? 'border-phosphor bg-phosphor/10 glow' : 'border-line hover:border-cyan'
                }`}
              >
                <div className="aspect-[3/4] mb-3 relative bg-bg/70 border border-line overflow-hidden">
                  {/* simple silhouette */}
                  <svg viewBox="0 0 120 160" className="w-full h-full">
                    <defs>
                      <linearGradient id={`g-${id}`} x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={a.bodyColor} />
                        <stop offset="100%" stopColor="#000" />
                      </linearGradient>
                    </defs>
                    <rect x="0" y="0" width="120" height="160" fill={`url(#g-${id})`} />
                    {/* head */}
                    <circle cx="60" cy="44" r="14" fill={a.bodyColor} stroke={a.accentColor} strokeWidth="1" />
                    {/* visor */}
                    {a.role === 'prey'
                      ? <rect x="48" y="42" width="24" height="4" fill={a.accentColor} opacity="0.95" />
                      : <circle cx="60" cy="44" r="9" fill="none" stroke={a.accentColor} strokeWidth="1.6" />}
                    {/* body */}
                    <rect x="44" y="60" width="32" height="48" fill={a.bodyColor} stroke={a.accentColor} strokeWidth="0.8" />
                    {/* legs */}
                    <rect x="48" y="108" width="10" height="40" fill={a.bodyColor} />
                    <rect x="62" y="108" width="10" height="40" fill={a.bodyColor} />
                    {/* scanlines */}
                    <g opacity="0.18">
                      {Array.from({ length: 40 }).map((_, i) => (
                        <line key={i} x1="0" x2="120" y1={i*4} y2={i*4} stroke="#000" />
                      ))}
                    </g>
                  </svg>
                  <div className="absolute top-2 left-2 text-[8px] font-mono tracking-[0.4em] text-amber">{a.callsign}</div>
                  <div className="absolute bottom-2 right-2 text-[8px] font-mono tracking-[0.3em]" style={{ color: a.accentColor }}>{a.role.toUpperCase()}</div>
                </div>

                <div className="font-mono text-[14px] tracking-[0.25em] text-phosphor">{a.name}</div>
                <div className="text-[10px] text-cyan/70 leading-snug font-mono mt-1">{a.desc}</div>

                <div className="mt-3 space-y-1.5 font-mono text-[9px] tracking-[0.25em]">
                  <StatRow k="SPEED"   v={a.stats.speed} c={a.accentColor} />
                  <StatRow k="STEALTH" v={a.stats.stealth} c={a.accentColor} />
                  <StatRow k="CONTROL" v={a.stats.control} c={a.accentColor} />
                </div>

                <div className="mt-3 text-[9px] tracking-[0.3em] text-amber border-t border-line pt-2">
                  ★ PERK · {a.perk}
                </div>

                {sel && <div className="absolute -top-2 left-2 text-[9px] tracking-[0.4em] bg-phosphor text-bg px-1">SELECTED</div>}
              </button>
            );
          })}
        </div>

        <Panel className="mt-6 p-4" glow="amber">
          <SectionHeader color="amber">ROLE BRIEFING</SectionHeader>
          {AVATARS[g.avatarId].role === 'prey' ? (
            <p className="text-[11px] text-cyan/80 leading-relaxed font-mono">
              ▸ PREY · 3rd-person. Reach an EXTRACTION zone before the hunter catches you.
              Manage your sound output. Use Ghost Step, Decoy, and Phase Fade strategically.
            </p>
          ) : (
            <p className="text-[11px] text-cyan/80 leading-relaxed font-mono">
              ▸ HUNTER · 1st-person. Eliminate the prey before they extract.
              Use Echo Pulse to ping their location, Resonance Scan to find recent sounds,
              and Silence Trap to amplify their footsteps.
            </p>
          )}
        </Panel>

        <div className="flex justify-between mt-6 pb-12">
          <Btn onClick={() => g.goto('menu')}>◀ BACK</Btn>
          <Btn variant="primary" onClick={() => { audio.confirm(); g.goto('mapSelect'); }}>CONTINUE ▶</Btn>
        </div>
      </div>
    </div>
  );
}

function StatRow({ k, v, c }: { k: string; v: number; c: string }) {
  return (
    <div className="grid grid-cols-[60px_1fr_28px] items-center gap-2 text-dim">
      <span>{k}</span>
      <StatBar value={v / 100} color={c} />
      <span style={{ color: c }}>{v}</span>
    </div>
  );
}
