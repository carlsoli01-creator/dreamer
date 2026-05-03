const items = [
  { color: '#ff2244', label: 'Prey NPC / Spawn' },
  { color: '#66ccff', label: 'Hunter NPC / Vision' },
  { color: '#00ffaa', label: 'Primary Extraction' },
  { color: '#ff9933', label: 'Sound Trap / Investigate' },
];
export default function Legend() {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 backdrop-blur-md bg-panel/70 border border-line p-2 px-3 pointer-events-none font-mono brackets flex gap-4">
      <span className="text-[9px] tracking-[0.5em] text-dim">// LEGEND</span>
      {items.map(it => (
        <div key={it.label} className="flex items-center gap-2 text-[9px] tracking-[0.25em] uppercase text-cyan/80">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: it.color, boxShadow: `0 0 8px ${it.color}` }} />
          {it.label}
        </div>
      ))}
    </div>
  );
}
