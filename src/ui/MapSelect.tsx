import { MAP_IDS, NOISLESS_MAPS } from '../data/maps';
import { useGame } from '../store';
import { Btn, Panel, SectionHeader } from './common';
import { audio } from '../audio/engine';

export default function MapSelect() {
  const g = useGame();
  return (
    <div className="absolute inset-0 z-30 boot crt overflow-auto">
      <div className="vignette" />
      <div className="absolute top-4 left-6 font-mono text-[10px] tracking-[0.5em] text-amber">▌ STEP 2 / 3 · SELECT LOCATION</div>
      <div className="absolute top-4 right-6 font-mono text-[10px] tracking-[0.5em] text-cyan animate-blink">CHANNEL 7 ●</div>

      <div className="max-w-[1100px] mx-auto pt-20 px-6">
        <div className="text-phosphor glow font-pixel mb-6" style={{ fontSize: 22, letterSpacing: '0.4em' }}>
          <span className="aberration">SELECT LOCATION</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {MAP_IDS.map((id, i) => {
            const m = NOISLESS_MAPS[id];
            const sel = g.mapId === id;
            return (
              <button
                key={id}
                onClick={() => { audio.ui(); g.setMap(id); }}
                className={`relative text-left p-4 transition-all border bg-panel/70 backdrop-blur-md brackets ${
                  sel ? 'border-phosphor bg-phosphor/10 glow' : 'border-line hover:border-cyan'
                }`}
              >
                <div className="aspect-video mb-3 relative overflow-hidden bg-bg/70 border border-line">
                  <MiniMap mapId={id} />
                  <div className="absolute top-2 left-2 text-[8px] font-mono tracking-[0.4em] text-amber">[{String(i+1).padStart(2,'0')}]</div>
                  <div className="absolute bottom-2 right-2 text-[8px] font-mono tracking-[0.4em]" style={{ color: m.palette.accent }}>SECTOR {id.split('_')[0].toUpperCase()}</div>
                </div>
                <div className="text-[14px] font-mono tracking-[0.25em] text-phosphor">{m.name}</div>
                <div className="text-[9px] tracking-[0.25em] text-dim mt-1 uppercase">░ {m.theme}</div>
                <p className="text-[10px] text-cyan/70 leading-relaxed mt-2 font-mono">{m.description}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 text-[9px] tracking-[0.25em] font-mono">
                  <span className="text-amber">{m.size.width}×{m.size.depth}m</span>
                  <span className="text-dim">|</span>
                  <span className="text-cyan/80">SND×{m.soundModifier}</span>
                  <span className="text-dim">|</span>
                  <span className="text-cyan/80">{m.buildings.length}BLD</span>
                  <span className="text-dim">|</span>
                  <span className="text-cyan/80">{m.extractionZones.length}EXT</span>
                </div>
                {sel && <div className="absolute -top-2 left-2 text-[9px] tracking-[0.4em] bg-phosphor text-bg px-1">SELECTED</div>}
              </button>
            );
          })}
        </div>

        <Panel className="mt-6 p-4" glow="amber">
          <SectionHeader color="amber">MISSION PARAMETERS</SectionHeader>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-[11px] font-mono text-cyan/80">
            <div>▸ MATCH LENGTH · 3:00</div>
            <div>▸ EXTRACTION ZONES · {NOISLESS_MAPS[g.mapId].extractionZones.length}</div>
            <div>▸ AMBIENCE · {NOISLESS_MAPS[g.mapId].ambience}</div>
            <div>▸ SOUND TRAPS · {NOISLESS_MAPS[g.mapId].soundTraps?.length ?? 0}</div>
          </div>
        </Panel>

        <div className="flex justify-between mt-6 pb-12">
          <Btn onClick={() => g.goto('avatar')}>◀ BACK</Btn>
          <Btn variant="primary" onClick={() => { audio.confirm(); g.startMatch(); }}>DEPLOY ▶</Btn>
        </div>
      </div>
    </div>
  );
}

function MiniMap({ mapId }: { mapId: string }) {
  const m = NOISLESS_MAPS[mapId];
  // uniform-scale square viewport so geometry isn't distorted
  const VB = 200;
  const dim = Math.max(m.size.width, m.size.depth);
  const s = VB / dim;
  const ox = (VB - m.size.width * s) / 2;
  const oy = (VB - m.size.depth * s) / 2;
  const tx = (x: number) => ox + x * s;
  const ty = (z: number) => oy + z * s;

  return (
    <svg viewBox={`0 0 ${VB} ${VB}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full" style={{ background: m.palette.fog }}>
      <rect x={ox} y={oy} width={m.size.width * s} height={m.size.depth * s}
            fill="none" stroke={m.palette.accent} strokeWidth="0.7" opacity="0.5" />
      {m.outdoorZones.map((z, i) => (
        <rect key={i}
              x={tx(z.position.x - z.size.width/2)}
              y={ty(z.position.z - z.size.depth/2)}
              width={z.size.width * s} height={z.size.depth * s}
              fill="#fff" opacity="0.06" />
      ))}
      {m.buildings.map((b, i) => (
        <rect key={i}
              x={tx(b.position.x - b.dimensions.width/2)}
              y={ty(b.position.z - b.dimensions.depth/2)}
              width={b.dimensions.width * s}
              height={b.dimensions.depth * s}
              fill={m.palette.wall} stroke={m.palette.accent} strokeWidth="0.4" opacity="0.85" />
      ))}
      {m.extractionZones.map((e, i) => (
        <g key={i}>
          <circle cx={tx(e.position.x)} cy={ty(e.position.z)} r={e.radius * s}
                  fill={e.type === 'primary' ? '#00ffaa' : '#ff9933'} opacity="0.55" />
          <circle cx={tx(e.position.x)} cy={ty(e.position.z)} r={1.8}
                  fill={e.type === 'primary' ? '#00ffaa' : '#ff9933'} />
        </g>
      ))}
      <circle cx={tx(m.spawnPoints.prey.x)}   cy={ty(m.spawnPoints.prey.z)}   r={2.2} fill="#ff2244" />
      <circle cx={tx(m.spawnPoints.hunter.x)} cy={ty(m.spawnPoints.hunter.z)} r={2.2} fill="#66ccff" />
      <g opacity="0.18">
        {Array.from({ length: VB / 4 }).map((_, i) => (
          <line key={i} x1="0" x2={VB} y1={i*4} y2={i*4} stroke="#000" />
        ))}
      </g>
    </svg>
  );
}
