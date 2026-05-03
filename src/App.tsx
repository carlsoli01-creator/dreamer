import { useEffect, useState } from 'react';
import { NOISLESS_MAPS } from './data/maps';
import MapScene from './scene/MapScene';
import MapSelector from './ui/MapSelector';
import InfoPanel from './ui/InfoPanel';
import Legend from './ui/Legend';
import ControlsHint from './ui/ControlsHint';
import Header from './ui/Header';
import HUD from './ui/HUD';
import { NPCStateView } from './scene/Agents';

export default function App() {
  const [mapId, setMapId] = useState<string>('dead_signal');
  const [state, setState] = useState<NPCStateView | null>(null);
  const map = NOISLESS_MAPS[mapId];

  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(false); const t = setTimeout(() => setReady(true), 250); return () => clearTimeout(t); }, [mapId]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg crt">
      <div className="absolute inset-0">
        <MapScene key={mapId} map={map} onState={setState} />
      </div>
      <div className="vignette" />

      <Header />
      {ready && (
        <div className="boot">
          <MapSelector selected={mapId} onSelect={setMapId} />
          <InfoPanel map={map} />
          <ControlsHint />
          <Legend />
          <HUD state={state} />
        </div>
      )}
    </div>
  );
}
