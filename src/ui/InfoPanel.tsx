import { MapData } from '../types';

export default function InfoPanel({ map }: { map: MapData }) {
  const rooms = map.buildings.reduce((a,b)=>a+b.rooms.length,0);
  return (
    <div className="absolute top-20 right-6 z-20 max-w-[360px] backdrop-blur-md bg-panel/70 border border-line p-4 pointer-events-auto font-mono brackets">
      <div className="flex items-center gap-2 text-[10px] tracking-[0.5em] text-amber mb-3 pl-2 border-l-2 border-amber">
        ▌ BRIEFING //
        <span className="ml-auto text-phosphor animate-blink">●</span>
      </div>
      <div className="text-[20px] tracking-[0.2em] text-phosphor glow aberration">{map.name}</div>
      <div className="text-[9px] tracking-[0.3em] text-dim mt-1 uppercase">
        ░ {map.theme}
      </div>

      <p className="text-[11px] text-cyan/80 leading-relaxed mt-3 border-l border-line pl-3">
        {map.description}
      </p>

      <div className="mt-3 p-2 bg-bg/50 border border-line">
        <div className="text-[8px] tracking-[0.4em] text-amber mb-1">// AMBIENCE</div>
        <div className="text-[10px] text-cyan/80 leading-relaxed">{map.ambience}</div>
      </div>

      <div className="grid grid-cols-3 gap-1 mt-3">
        <Stat k="BLDG" v={map.buildings.length} />
        <Stat k="ROOM" v={rooms} />
        <Stat k="ZONE" v={map.outdoorZones.length} />
        <Stat k="EXIT" v={map.extractionZones.length} />
        <Stat k="TRAP" v={map.soundTraps?.length ?? 0} />
        <Stat k="SND×" v={map.soundModifier.toFixed(1)} />
      </div>

      {map.environmentalMechanics && (
        <div className="mt-3">
          <div className="text-[8px] tracking-[0.4em] text-amber mb-1">// MECHANICS</div>
          <ul className="space-y-0.5">
            {Object.keys(map.environmentalMechanics).map(k => (
              <li key={k} className="text-[10px] tracking-[0.2em] text-cyan/70 uppercase">
                ▸ {k.replace(/_/g,' ')}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string|number }) {
  return (
    <div className="bg-bg/60 border border-line p-2">
      <div className="text-[8px] tracking-[0.3em] text-dim">{k}</div>
      <div className="text-[14px] text-phosphor glow mt-0.5">{v}</div>
    </div>
  );
}
