export default function ControlsHint() {
  return (
    <div className="absolute top-14 right-6 z-20 backdrop-blur-md bg-panel/70 border border-line px-3 py-2 pointer-events-none font-mono brackets">
      <div className="text-[8px] tracking-[0.5em] text-dim mb-1">// CTRL</div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[9px] tracking-[0.25em] text-cyan/80 uppercase">
        <span className="text-amber">LMB</span><span>orbit</span>
        <span className="text-amber">RMB</span><span>pan</span>
        <span className="text-amber">SCRL</span><span>zoom</span>
      </div>
    </div>
  );
}
