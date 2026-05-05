import { useGame } from '../store';
import { Btn, Panel, SectionHeader } from './common';

export default function Controls() {
  const g = useGame();
  const groups: { title: string; rows: [string, string][] }[] = [
    {
      title: 'MOVEMENT',
      rows: [
        ['W A S D', 'Move'],
        ['MOUSE',   'Look'],
        ['SHIFT',   'Sprint  (loud)'],
        ['CTRL / C', 'Crouch (silent)'],
      ],
    },
    {
      title: 'ABILITIES',
      rows: [
        ['1', 'Ability slot 1'],
        ['2', 'Ability slot 2'],
        ['3', 'Ability slot 3'],
      ],
    },
    {
      title: 'SYSTEM',
      rows: [
        ['ESC',   'Pause'],
        ['CLICK', 'Engage pointer lock'],
      ],
    },
  ];

  return (
    <div className="absolute inset-0 z-30 crt boot flex items-center justify-center">
      <div className="vignette" />
      <div className="absolute top-4 left-6 font-mono text-[10px] tracking-[0.5em] text-amber">▌ CONTROLS REFERENCE</div>
      <div className="absolute top-4 right-6 font-mono text-[10px] tracking-[0.5em] text-cyan animate-blink">CHANNEL 7 ●</div>

      <div className="w-[640px] max-w-[92%]">
        <div className="text-phosphor glow font-pixel mb-6 aberration text-center" style={{ fontSize: 22, letterSpacing: '0.4em' }}>
          CONTROLS
        </div>

        {groups.map(gr => (
          <Panel key={gr.title} className="p-5 mb-4">
            <SectionHeader color="phosphor">{gr.title}</SectionHeader>
            <div className="space-y-1.5 font-mono">
              {gr.rows.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[180px_1fr] gap-3 text-[11px] tracking-[0.25em]">
                  <span className="text-amber">[{k}]</span>
                  <span className="text-cyan/80 uppercase">{v}</span>
                </div>
              ))}
            </div>
          </Panel>
        ))}

        <div className="flex justify-between mt-2">
          <Btn onClick={() => g.back()}>◀ DONE</Btn>
        </div>
      </div>
    </div>
  );
}
