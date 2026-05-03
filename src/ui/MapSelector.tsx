import { MAP_IDS, NOISLESS_MAPS } from '../data/maps';

interface Props { selected: string; onSelect: (id: string) => void }

export default function MapSelector({ selected, onSelect }: Props) {
  return (
    <div className="absolute top-20 left-6 z-20 flex flex-col gap-2 pointer-events-auto font-mono">
      <div className="text-[10px] tracking-[0.5em] text-dim mb-1 pl-2 border-l-2 border-phosphor">
        ▌ MAP SELECT
      </div>
      {MAP_IDS.map((id, idx) => {
        const m = NOISLESS_MAPS[id];
        const isSel = id === selected;
        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={`text-left px-3 py-2 transition-all duration-150 backdrop-blur-md border ${
              isSel
                ? 'border-phosphor bg-phosphor/10 text-phosphor glow'
                : 'border-line bg-panel/60 hover:bg-panel hover:border-cyan text-cyan/70'
            } brackets`}
            style={{ minWidth: 280 }}
          >
            <div className="flex items-center gap-2 text-[10px] tracking-[0.3em]">
              <span className={isSel?'text-phosphor':'text-dim'}>[{String(idx+1).padStart(2,'0')}]</span>
              <span className="font-bold">{m.name}</span>
              {isSel && <span className="ml-auto text-[10px] animate-blink">◀ ACTIVE</span>}
            </div>
            <div className="text-[9px] tracking-[0.25em] text-dim mt-1 uppercase">
              {m.theme}
            </div>
            <div className="flex gap-2 mt-2 text-[9px] tracking-[0.2em] text-amber">
              <span>{m.size.width}×{m.size.depth}m</span>
              <span className="text-dim">|</span>
              <span>SND×{m.soundModifier}</span>
              <span className="text-dim">|</span>
              <span>{m.buildings.length}BLD</span>
              <span className="text-dim">|</span>
              <span>{m.extractionZones.length}EXT</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
