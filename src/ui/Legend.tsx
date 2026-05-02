export default function Legend() {
  const items = [
    { color: '#ff3b3b', label: 'Prey Spawn' },
    { color: '#6ae3ff', label: 'Hunter Spawn / Primary Extraction' },
    { color: '#5fffa6', label: 'Secondary Extraction' },
    { color: '#ffcc55', label: 'Sound Trap' },
  ];
  return (
    <div className="absolute bottom-6 left-6 z-10 backdrop-blur-md bg-white/[0.04] border border-white/10 p-4 pointer-events-auto">
      <div className="text-[9px] tracking-[0.4em] font-mono text-white/50 mb-3 pl-3 border-l-2 border-good">
        LEGEND
      </div>
      <ul className="space-y-2">
        {items.map((it) => (
          <li key={it.label} className="flex items-center gap-3 text-[11px] font-mono tracking-[0.15em] text-white/75 uppercase">
            <span
              className="w-3 h-3 rounded-full"
              style={{ background: it.color, boxShadow: `0 0 10px ${it.color}` }}
            />
            {it.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
