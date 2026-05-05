import { useGame } from '../store';
import { AVATARS } from '../data/avatars';
import { NOISLESS_MAPS } from '../data/maps';
import { RuntimeStateView } from '../scene/GameScene';
import { AsciiBar, Crosshair, Panel, SectionHeader } from './common';

interface Props { state: RuntimeStateView | null; locked: boolean }

export default function HUD({ state, locked }: Props) {
  const g = useGame();
  const a = AVATARS[g.avatarId];
  const m = NOISLESS_MAPS[g.mapId];

  return (
    <div className="absolute inset-0 z-20 pointer-events-none font-mono text-cyan/85">
      {/* top bar */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
        <Panel className="px-3 py-1.5" glow={a.role === 'prey' ? 'alert' : 'cyan'}>
          <div className="flex items-center gap-3 text-[11px] tracking-[0.4em]">
            <span style={{ color: a.accentColor }}>● {a.callsign}</span>
            <span className="text-dim">|</span>
            <span className="text-phosphor">{a.role.toUpperCase()}</span>
            <span className="text-dim">|</span>
            <span className="text-amber">{a.name}</span>
          </div>
        </Panel>

        <Panel className="px-4 py-1.5">
          <div className="text-[14px] tracking-[0.4em] text-phosphor glow">
            {fmt(state?.remaining ?? 180)}
          </div>
        </Panel>

        <Panel className="px-3 py-1.5" glow="amber">
          <div className="text-[11px] tracking-[0.4em] text-amber">
            ▌ {a.role === 'prey' ? 'REACH EXTRACTION' : 'ELIMINATE PREY'}
          </div>
        </Panel>
      </div>

      <Crosshair />

      {/* bottom-left abilities */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-2">
        <Panel className="p-2 px-3" glow="cyan">
          <SectionHeader color="cyan">ABILITIES</SectionHeader>
          <div className="flex gap-2">
            {(state?.abilities ?? []).map(ab => {
              const t = performance.now() / 1000;
              const cdRemain = Math.max(0, ab.ready - t);
              const cdPct = ab.cooldown > 0 ? cdRemain / ab.cooldown : 0;
              const isActive = t < ab.active;
              return (
                <div key={ab.id} className="relative w-16 h-16 border border-line bg-bg/70 brackets overflow-hidden flex flex-col items-center justify-center">
                  <div className="absolute bottom-0 left-0 right-0 bg-alert/40" style={{ height: `${cdPct * 100}%` }} />
                  {isActive && (
                    <div className="absolute inset-0 border-2" style={{ borderColor: ab.color, boxShadow: `inset 0 0 12px ${ab.color}` }} />
                  )}
                  <div className="text-[9px] tracking-[0.3em]" style={{ color: cdRemain > 0 ? '#3a4a60' : ab.color }}>
                    [{ab.key}]
                  </div>
                  <div className="text-[10px] tracking-[0.2em] mt-0.5" style={{ color: cdRemain > 0 ? '#3a4a60' : '#aaccdd' }}>
                    {ab.short}
                  </div>
                  {cdRemain > 0 && (
                    <div className="text-[10px] text-amber mt-0.5">{cdRemain.toFixed(1)}</div>
                  )}
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel className="p-2 px-3 min-w-[260px]">
          <div className="text-[9px] tracking-[0.4em] text-amber font-mono">SILENCE</div>
          <div className="mt-1"><AsciiBar value={state?.silence ?? 1} n={20} color="text-phosphor" /></div>
          <div className="text-[9px] tracking-[0.4em] text-amber font-mono mt-1">DETECTION</div>
          <div className="mt-1"><AsciiBar value={state?.detection ?? 0} n={20} color={state?.detected ? 'text-alert' : 'text-cyan'} /></div>
        </Panel>
      </div>

      {/* bottom-right minimap */}
      <div className="absolute bottom-4 right-4">
        <Panel className="p-2" glow="phosphor">
          <SectionHeader color="phosphor">RADAR</SectionHeader>
          <Minimap state={state} />
          <div className="mt-2 text-[10px] tracking-[0.3em] font-mono">
            <div className="flex justify-between"><span className="text-dim">EXIT DIST</span><span className="text-phosphor">{(state?.closestExtractionDist ?? 0).toFixed(1)}m</span></div>
            <div className="flex justify-between"><span className="text-dim">MAP</span><span className="text-cyan">{m.name}</span></div>
          </div>
        </Panel>
      </div>

      {/* detection alert */}
      {state?.detected && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 px-4 py-2 border border-alert text-alert text-[12px] tracking-[0.5em] font-mono glow animate-flicker bg-panel/70 backdrop-blur-md brackets">
          ▌ TARGET LOCK · DETECTED ◀
        </div>
      )}

      {/* click to engage prompt */}
      {!locked && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-auto">
          <div className="bg-bg/80 backdrop-blur-md border border-phosphor px-8 py-6 text-center brackets">
            <div className="text-phosphor glow font-pixel text-[14px] tracking-[0.4em] mb-3 aberration">CLICK TO ENGAGE</div>
            <div className="text-[10px] font-mono tracking-[0.3em] text-cyan/70 leading-relaxed">
              WASD MOVE · MOUSE LOOK · SHIFT SPRINT · CTRL CROUCH<br/>
              [1][2][3] ABILITIES · ESC PAUSE
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function fmt(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function Minimap({ state }: { state: RuntimeStateView | null }) {
  const g = useGame();
  const m = NOISLESS_MAPS[g.mapId];
  const W = 180, H = 130;
  const sx = W / m.size.width, sz = H / m.size.depth;
  const px = state ? state.preyPos.x * sx : 0;
  const py = state ? state.preyPos.z * sz : 0;
  const hx = state ? state.hunterPos.x * sx : 0;
  const hy = state ? state.hunterPos.z * sz : 0;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block" style={{ background: '#040810' }}>
      <rect x="0.5" y="0.5" width={W-1} height={H-1} fill="none" stroke="#00ffaa" strokeWidth="0.4" opacity="0.4" />
      {m.buildings.map((b, i) => (
        <rect key={i}
              x={(b.position.x - b.dimensions.width/2) * sx}
              y={(b.position.z - b.dimensions.depth/2) * sz}
              width={b.dimensions.width * sx} height={b.dimensions.depth * sz}
              fill="#1a2638" stroke="#3a4a60" strokeWidth="0.3" />
      ))}
      {m.extractionZones.map((e, i) => (
        <circle key={i} cx={e.position.x * sx} cy={e.position.z * sz} r={e.radius * sx * 0.9}
                fill={e.type === 'primary' ? '#00ffaa' : '#ff9933'} opacity="0.45" />
      ))}
      <circle cx={hx} cy={hy} r={3} fill="#66ccff" />
      <circle cx={px} cy={py} r={3} fill="#ff2244" />
      <g opacity="0.18">
        {Array.from({ length: 32 }).map((_, i) => (
          <line key={i} x1="0" x2={W} y1={i*4} y2={i*4} stroke="#000" />
        ))}
      </g>
    </svg>
  );
}
