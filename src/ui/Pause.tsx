import { useGame } from '../store';
import { Btn } from './common';
import { audio } from '../audio/engine';

interface Props { onResume: () => void; onRestart: () => void }

export default function Pause({ onResume, onRestart }: Props) {
  const g = useGame();
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-bg/80 backdrop-blur-md crt boot">
      <div className="w-[420px] p-6 border border-amber bg-panel/90 brackets text-center">
        <div className="text-amber font-pixel mb-4 aberration glow" style={{ fontSize: 18, letterSpacing: '0.4em' }}>SYSTEM HALT</div>
        <div className="text-[10px] tracking-[0.4em] text-cyan/70 font-mono mb-6">▌ MISSION SUSPENDED</div>

        <div className="flex flex-col gap-2">
          <Btn variant="primary" size="lg" onClick={() => { audio.confirm(); onResume(); }}>▶ RESUME</Btn>
          <Btn size="md" onClick={() => { audio.ui(); onRestart(); }}>↻ RESTART</Btn>
          <Btn size="md" onClick={() => { audio.ui(); g.goto('settings'); }}>SETTINGS</Btn>
          <Btn size="md" onClick={() => { audio.ui(); g.goto('controls'); }}>CONTROLS</Btn>
          <Btn variant="danger" size="md" onClick={() => { audio.ui(); audio.stopAmbient(); g.goto('menu'); }}>◀ QUIT TO MENU</Btn>
        </div>

        <div className="mt-6 text-[9px] tracking-[0.4em] text-dim font-mono">
          ESC TO RESUME
        </div>
      </div>
    </div>
  );
}
