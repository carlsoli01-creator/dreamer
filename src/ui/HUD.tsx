import { NPCStateView } from '../scene/Agents';

const BAR = (v: number, n = 12) => {
  const filled = Math.round(Math.max(0, Math.min(1, v)) * n);
  return '▮'.repeat(filled) + '▯'.repeat(n - filled);
};
const MODE_COLOR: Record<string,string> = {
  patrol:'text-cyan', investigate:'text-amber', chase:'text-alert',
  extract:'text-phosphor', evade:'text-amber', caught:'text-dim',
};

export default function HUD({ state }: { state: NPCStateView | null }) {
  return (
    <>
      <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
        <div className="relative w-40 h-40 brackets text-phosphor/70 glow">
          <div className="absolute inset-0 border border-phosphor/30" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-phosphor/30" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-phosphor/30" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 border border-phosphor" />
        </div>
      </div>

      <div className="absolute bottom-6 left-6 z-20 backdrop-blur-md bg-panel/70 border border-line p-3 font-mono brackets pointer-events-none min-w-[300px]">
        <div className="text-[9px] tracking-[0.5em] text-amber mb-2 pl-2 border-l-2 border-amber">
          ▌ NPC TELEMETRY
        </div>
        <Row label="HUNTER" mode={state?.hunter.mode ?? '—'} goal={state?.hunter.goalLabel ?? '—'} />
        <Row label="PREY"   mode={state?.prey.mode   ?? '—'} goal={state?.prey.goalLabel   ?? '—'} />
        <div className="hr-2k my-2 text-line" />
        <div className="grid grid-cols-2 gap-2 text-[9px] tracking-[0.3em]">
          <div className="text-dim">DETECTIONS</div>
          <div className="ascii-bar text-alert">{BAR(state?.detected ? 1 : 0, 8)}</div>
          <div className="text-dim">CATCHES</div>
          <div className="text-amber">[{String(state?.catches ?? 0).padStart(3,'0')}]</div>
          <div className="text-dim">ESCAPES</div>
          <div className="text-phosphor">[{String(state?.escapes ?? 0).padStart(3,'0')}]</div>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 z-20 backdrop-blur-md bg-panel/70 border border-line p-3 font-mono brackets pointer-events-none w-[200px]">
        <div className="text-[9px] tracking-[0.5em] text-cyan mb-2 pl-2 border-l-2 border-cyan">
          ▌ RADAR
        </div>
        <div className="relative w-[170px] h-[170px] mx-auto rounded-full border border-phosphor/40 overflow-hidden">
          <div className="absolute inset-0 border border-phosphor/15 rounded-full m-3" />
          <div className="absolute inset-0 border border-phosphor/15 rounded-full m-7" />
          <div className="radar-sweep" />
          {state && (
            <>
              <Dot x={(state.hunter.pos.x % 60) / 60} z={(state.hunter.pos.z % 60) / 60} color="#66ccff" />
              <Dot x={(state.prey.pos.x   % 60) / 60} z={(state.prey.pos.z   % 60) / 60} color="#ff2244" />
            </>
          )}
        </div>
        <div className="flex justify-between mt-2 text-[8px] tracking-[0.3em]">
          <span className="text-cyan">▲H</span>
          <span className="text-alert">▲P</span>
        </div>
      </div>

      {state?.detected && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 px-4 py-2 border border-alert text-alert font-mono text-[12px] tracking-[0.5em] glow animate-flicker pointer-events-none brackets bg-panel/70 backdrop-blur-md">
          ▌ TARGET LOCK: PREY DETECTED ◀
        </div>
      )}
    </>
  );
}

function Row({ label, mode, goal }: { label:string; mode:string; goal:string }) {
  const cls = MODE_COLOR[mode] ?? 'text-dim';
  return (
    <div className="flex items-center gap-2 text-[10px] tracking-[0.25em] mb-1">
      <span className="text-dim w-[60px]">[{label}]</span>
      <span className={`${cls} font-bold w-[110px]`}>{mode.toUpperCase()}</span>
      <span className="text-cyan/70 truncate">› {goal}</span>
    </div>
  );
}
function Dot({ x, z, color }: { x:number; z:number; color:string }) {
  const left = `${50 + (x - 0.5) * 80}%`;
  const top  = `${50 + (z - 0.5) * 80}%`;
  return (
    <div
      className="absolute w-2 h-2 rounded-full -translate-x-1/2 -translate-y-1/2"
      style={{ left, top, background: color, boxShadow: `0 0 10px ${color}` }}
    />
  );
}
