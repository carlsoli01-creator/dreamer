export default function ControlsHint() {
  return (
    <div className="absolute bottom-6 right-6 z-10 backdrop-blur-md bg-white/[0.04] border border-white/10 px-4 py-3 pointer-events-none">
      <div className="text-[9px] tracking-[0.4em] font-mono text-white/50 mb-2">CONTROLS</div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[10px] font-mono tracking-[0.15em] text-white/70 uppercase">
        <span>LMB DRAG</span><span>orbit</span>
        <span>RMB DRAG</span><span>pan</span>
        <span>SCROLL</span><span>zoom</span>
      </div>
    </div>
  );
}
