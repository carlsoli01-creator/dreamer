import { useEffect, useState } from 'react';
import { useGame } from '../store';
import { Btn } from './common';
import { audio } from '../audio/engine';

const FLAVOR_LINES = [
  '> SYS BOOT… OK',
  '> AUDIO LINK… OK',
  '> NETWORK… SECURED',
  '> THERMALS… NOMINAL',
  '> READY.',
];

export default function Menu() {
  const g = useGame();
  const [typed, setTyped] = useState<string[]>([]);

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i++;
      setTyped(FLAVOR_LINES.slice(0, i));
      if (i >= FLAVOR_LINES.length) clearInterval(id);
    }, 220);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center crt boot">
      {/* corner labels */}
      <div className="absolute top-4 left-6 font-mono text-[10px] tracking-[0.5em] text-amber flicker">▌ NOISLESS // OS v0.4</div>
      <div className="absolute top-4 right-6 font-mono text-[10px] tracking-[0.5em] text-cyan animate-blink">CHANNEL 7 ●</div>
      <div className="absolute bottom-4 left-6 font-mono text-[9px] tracking-[0.4em] text-dim">© 200X NULLSIGNAL INDUSTRIES</div>
      <div className="absolute bottom-4 right-6 font-mono text-[9px] tracking-[0.4em] text-dim">SECURE LINK · 256-BIT</div>

      <div className="vignette" />

      <div className="grid grid-cols-2 gap-12 max-w-[1080px] w-[92%]">
        {/* Left — branding */}
        <div className="flex flex-col justify-center">
          <div className="text-phosphor glow font-pixel" style={{ fontSize: 36, letterSpacing: '0.4em' }}>
            <span className="aberration">NOISLESS</span>
          </div>
          <div className="text-[10px] tracking-[0.5em] text-amber mt-3 font-mono">
            ░ SILENCE IS A WEAPON ░
          </div>
          <p className="text-[12px] text-cyan/60 leading-relaxed mt-6 font-mono max-w-[400px]">
            A tactical hunt simulator. Operate as PREY or HUNTER across three
            classified locations. Every footstep is data. Every silence is leverage.
          </p>

          <div className="mt-8 font-mono text-[11px] text-phosphor/80 space-y-1 min-h-[140px]">
            {typed.map((l, i) => (
              <div key={i} className="glow">{l}</div>
            ))}
            {typed.length >= FLAVOR_LINES.length && (
              <div className="text-amber animate-blink">█</div>
            )}
          </div>
        </div>

        {/* Right — menu */}
        <div className="flex items-center justify-center">
          <div className="flex flex-col gap-3 w-[280px]">
            <Btn variant="primary" size="lg" onClick={() => { audio.init(); audio.confirm(); g.goto('avatar'); }}>
              ▶ NEW MISSION
            </Btn>
            <Btn size="md" onClick={() => { audio.ui(); g.goto('controls'); }}>CONTROLS</Btn>
            <Btn size="md" onClick={() => { audio.ui(); g.goto('settings'); }}>SETTINGS</Btn>
            <Btn size="md" onClick={() => {
              audio.ui();
              alert('Quitting browser games is hard — close the tab when ready.');
            }}>QUIT</Btn>

            <div className="mt-4 text-[9px] tracking-[0.4em] font-mono text-dim border-t border-line pt-3">
              ▸ LAST SESSION · NULL<br/>
              ▸ OPERATIVE · ANONYMOUS<br/>
              ▸ CLEARANCE · ALPHA
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
