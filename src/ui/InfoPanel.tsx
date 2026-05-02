import { MapData } from '../types';

export default function InfoPanel({ map }: { map: MapData }) {
  const buildingsCount = map.buildings.length;
  const roomsCount = map.buildings.reduce((a, b) => a + b.rooms.length, 0);
  const trapsCount = map.soundTraps?.length ?? 0;

  return (
    <div className="absolute top-6 right-6 z-10 max-w-[340px] backdrop-blur-md bg-white/[0.04] border border-white/10 p-5 pointer-events-auto">
      <div className="text-[10px] tracking-[0.4em] text-white/50 font-mono pl-3 border-l-2 border-accent2 mb-3">
        BRIEFING
      </div>
      <div className="text-[24px] font-light tracking-[0.18em]">{map.name}</div>
      <div className="text-[10px] font-mono tracking-[0.2em] text-white/45 mt-1 uppercase">
        {map.theme}
      </div>

      <p className="text-[12px] text-white/70 leading-relaxed mt-4">{map.description}</p>

      <div className="mt-4 p-3 bg-black/30 border border-white/5">
        <div className="text-[9px] font-mono tracking-[0.3em] text-white/40 mb-1">AMBIENCE</div>
        <div className="text-[11px] text-white/75 leading-relaxed">{map.ambience}</div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4">
        <Stat k="BUILDINGS" v={buildingsCount} />
        <Stat k="ROOMS" v={roomsCount} />
        <Stat k="ZONES" v={map.outdoorZones.length} />
        <Stat k="EXITS" v={map.extractionZones.length} />
        <Stat k="TRAPS" v={trapsCount} />
        <Stat k="SOUND ×" v={map.soundModifier.toFixed(1)} />
      </div>

      {map.environmentalMechanics && (
        <div className="mt-4">
          <div className="text-[9px] font-mono tracking-[0.3em] text-white/40 mb-2">MECHANICS</div>
          <ul className="space-y-1">
            {Object.keys(map.environmentalMechanics).map((k) => (
              <li key={k} className="text-[10px] font-mono tracking-[0.15em] text-white/60 uppercase">
                · {k.replace(/_/g, ' ')}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string | number }) {
  return (
    <div className="bg-black/30 border border-white/5 p-2">
      <div className="text-[8px] font-mono tracking-[0.3em] text-white/40">{k}</div>
      <div className="text-[16px] font-light mt-0.5">{v}</div>
    </div>
  );
}
