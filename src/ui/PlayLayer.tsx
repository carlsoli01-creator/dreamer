import { useEffect, useRef, useState } from 'react';
import { useGame } from '../store';
import GameScene, { RuntimeStateView } from '../scene/GameScene';
import HUD from './HUD';
import Pause from './Pause';
import { audio } from '../audio/engine';

export default function PlayLayer() {
  const g = useGame();
  const [state, setState] = useState<RuntimeStateView | null>(null);
  const [paused, setPaused] = useState(false);
  const [locked, setLocked] = useState(false);
  const lastEsc = useRef(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        const t = performance.now();
        if (t - lastEsc.current < 300) return;
        lastEsc.current = t;
        document.exitPointerLock?.();
        setPaused(p => !p);
      }
    };
    const onLock = () => setLocked(document.pointerLockElement !== null);
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerlockchange', onLock);
    return () => { window.removeEventListener('keydown', onKey); document.removeEventListener('pointerlockchange', onLock); };
  }, []);

  return (
    <>
      <div className="absolute inset-0 z-10">
        <GameScene
          paused={paused || g.screen !== 'playing'}
          onState={setState}
          onEnd={(outcome, reason, stats) => {
            audio.stopAmbient();
            if (outcome === 'victory') audio.confirm();
            else audio.detected();
            g.finishMatch({ outcome, reason, ...stats });
          }}
        />
      </div>
      <HUD state={state} locked={locked && !paused} />
      {paused && (
        <Pause
          onResume={() => { setPaused(false); }}
          onRestart={() => { setPaused(false); audio.stopAmbient(); g.startMatch(); }}
        />
      )}
    </>
  );
}
