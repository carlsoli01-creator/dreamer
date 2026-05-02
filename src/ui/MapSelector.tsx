import { MAP_IDS, NOISLESS_MAPS } from '../data/maps';

interface Props {
  selected: string;
  onSelect: (id: string) => void;
}

export default function MapSelector({ selected, onSelect }: Props) {
  return (
    <div className="absolute top-6 left-6 z-10 flex flex-col gap-2 pointer-events-auto">
      <div className="text-[10px] tracking-[0.4em] text-white/50 mb-1 font-mono pl-3 border-l-2 border-accent">
        MAP
      </div>
      {MAP_IDS.map((id) => {
        const m = NOISLESS_MAPS[id];
        const isSelected = id === selected;
        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={`text-left px-4 py-3 border transition-all duration-200 backdrop-blur-md ${
              isSelected
                ? 'border-accent2 bg-accent2/10'
                : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20'
            }`}
            style={{ minWidth: 240 }}
          >
            <div className="text-[13px] tracking-[0.2em] font-semibold">{m.name}</div>
            <div className="text-[9px] tracking-[0.18em] text-white/45 font-mono mt-1 uppercase">
              {m.theme}
            </div>
            <div className="flex gap-2 mt-2 text-[8px] font-mono tracking-[0.18em] text-white/40">
              <span>{m.size.width}×{m.size.depth}</span>
              <span>·</span>
              <span>SOUND ×{m.soundModifier}</span>
              <span>·</span>
              <span>{m.buildings.length} BLDG</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
