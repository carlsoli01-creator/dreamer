import { useGame } from '../store';
import { Btn, Panel, SectionHeader } from './common';
import { AVATARS } from '../data/avatars';
import { NOISLESS_MAPS } from '../data/maps';
import { audio } from '../audio/engine';

export default function EndScreen() {
  const g = useGame();
  const a = AVATARS[g.avatarId];
  const m = NOISLESS_MAPS[g.mapId];
  const win = g.stats.outcome === 'victory';
  const t = Math.floor(g.stats.timeSec);
  const tStr = `${Math.floor(t/60)}:${String(t%60).padStart(2,'0')}`;

  return (
    <div className="absolute inset-0 z-40 crt boot flex items-center justify-center">
      <div className="vignette" />
      <div className="absolute top-4 left-6 font-mono text-[10px] tracking-[0.5em] text-amber animate-blink">▌ MISSION DEBRIEF</div>
      <div className="absolute top-4 right-6 font-mono text-[10px] tracking-[0.5em] text-cyan">CHANNEL 7 ●</div>

      <div className="w-[720px] max-w-[92%]">
        <div className={`text-center font-pixel aberration glow mb-2`}
             style={{ fontSize: 56, letterSpacing: '0.4em', color: win ? '#00ffaa' : '#ff2244' }}>
          {win ? 'VICTORY' : 'DEFEAT'}
        </div>
        <div className="text-center text-[11px] tracking-[0.5em] font-mono text-cyan/70 mb-8">
          ░ {g.stats.reason} ░
        </div>

        <Panel className="p-5" glow={win ? 'phosphor' : 'alert'}>
          <SectionHeader color={win ? 'phosphor' : 'alert'}>OUTCOME</SectionHeader>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Stat k="OPERATIVE" v={a.name} />
            <Stat k="ROLE" v={a.role.toUpperCase()} />
            <Stat k="MAP" v={m.name} />
            <Stat k="TIME" v={tStr} />
            <Stat k="DETECTIONS" v={g.stats.detections} />
            <Stat k="ABILITIES" v={g.stats.abilitiesUsed} />
            <Stat k="SOUND EVENTS" v={g.stats.soundEmitted} />
            <Stat k="OUTCOME" v={(g.stats.outcome ?? '—').toUpperCase()} accent={win ? '#00ffaa' : '#ff2244'} />
          </div>
        </Panel>

        <div className="flex justify-center gap-3 mt-6">
          <Btn size="lg" onClick={() => { audio.ui(); g.goto('menu'); }}>◀ MAIN MENU</Btn>
          <Btn size="lg" variant="ghost" onClick={() => { audio.ui(); g.goto('mapSelect'); }}>CHANGE MAP</Btn>
          <Btn size="lg" variant="primary" onClick={() => { audio.confirm(); g.startMatch(); }}>↻ REMATCH ▶</Btn>
        </div>
      </div>
    </div>
  );
}

function Stat({ k, v, accent }: { k: string; v: string|number; accent?: string }) {
  return (
    <div className="border border-line bg-bg/50 p-3">
      <div className="text-[8px] tracking-[0.4em] text-dim font-mono">{k}</div>
      <div className="text-[16px] font-mono mt-1" style={{ color: accent ?? '#aaccdd' }}>{v}</div>
    </div>
  );
}
