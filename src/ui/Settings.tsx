import { useGame } from '../store';
import { Btn, Panel, SectionHeader } from './common';
import { audio } from '../audio/engine';

export default function Settings() {
  const g = useGame();
  const s = g.settings;

  return (
    <div className="absolute inset-0 z-30 crt boot flex items-center justify-center">
      <div className="vignette" />
      <div className="absolute top-4 left-6 font-mono text-[10px] tracking-[0.5em] text-amber">▌ CONFIGURATION</div>
      <div className="absolute top-4 right-6 font-mono text-[10px] tracking-[0.5em] text-cyan animate-blink">CHANNEL 7 ●</div>

      <div className="w-[560px] max-w-[92%]">
        <div className="text-phosphor glow font-pixel mb-6 aberration text-center" style={{ fontSize: 22, letterSpacing: '0.4em' }}>
          SETTINGS
        </div>

        <Panel className="p-5">
          <SectionHeader color="phosphor">AUDIO</SectionHeader>
          <Slider label="MASTER VOLUME" value={s.volume * 100} min={0} max={100} step={1}
                  onChange={v => { g.patchSettings({ volume: v / 100 }); audio.setVolume(v / 100); }}
                  display={`${Math.round(s.volume * 100)}%`} />
        </Panel>

        <Panel className="p-5 mt-4">
          <SectionHeader color="cyan">INPUT</SectionHeader>
          <Slider label="MOUSE SENSITIVITY" value={s.sensitivity * 10} min={2} max={20} step={1}
                  onChange={v => g.patchSettings({ sensitivity: v / 10 })}
                  display={s.sensitivity.toFixed(1)} />
          <Toggle label="INVERT Y AXIS" value={s.invertY} onChange={v => g.patchSettings({ invertY: v })} />
          <Slider label="FIELD OF VIEW" value={s.fov} min={60} max={100} step={1}
                  onChange={v => g.patchSettings({ fov: v })}
                  display={`${s.fov}°`} />
        </Panel>

        <Panel className="p-5 mt-4">
          <SectionHeader color="amber">GAMEPLAY</SectionHeader>
          <Slider label="BOT SKILL" value={s.botSkill * 10} min={6} max={14} step={1}
                  onChange={v => g.patchSettings({ botSkill: v / 10 })}
                  display={s.botSkill < 0.85 ? 'RECRUIT' : s.botSkill > 1.15 ? 'GHOST' : 'OPERATOR'} />
          <Toggle label="SHOW DIRECTIONAL CUES" value={s.showCues} onChange={v => g.patchSettings({ showCues: v })} />
        </Panel>

        <div className="flex justify-between mt-6">
          <Btn onClick={() => { audio.ui(); g.back(); }}>◀ DONE</Btn>
        </div>
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange, display }:
  { label:string; value:number; min:number; max:number; step:number; onChange:(v:number)=>void; display:string }) {
  return (
    <div className="grid grid-cols-[160px_1fr_60px] items-center gap-3 py-2">
      <span className="text-[10px] tracking-[0.3em] font-mono text-dim">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
             onChange={e => onChange(parseFloat(e.target.value))}
             className="accent-phosphor"/>
      <span className="text-[11px] font-mono text-phosphor text-right">{display}</span>
    </div>
  );
}

function Toggle({ label, value, onChange }: { label:string; value:boolean; onChange:(v:boolean)=>void }) {
  return (
    <div className="grid grid-cols-[160px_1fr_60px] items-center gap-3 py-2">
      <span className="text-[10px] tracking-[0.3em] font-mono text-dim">{label}</span>
      <button onClick={() => { audio.ui(); onChange(!value); }}
              className={`text-[10px] tracking-[0.3em] font-mono px-3 py-1 border ${value ? 'border-phosphor text-phosphor bg-phosphor/10' : 'border-line text-dim'}`}>
        {value ? 'ENABLED' : 'DISABLED'}
      </button>
      <span />
    </div>
  );
}
