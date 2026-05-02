import { useState } from 'react';
import { NOISLESS_MAPS } from './data/maps';
import MapScene from './scene/MapScene';
import MapSelector from './ui/MapSelector';
import InfoPanel from './ui/InfoPanel';
import Legend from './ui/Legend';
import ControlsHint from './ui/ControlsHint';
import Header from './ui/Header';

export default function App() {
  const [mapId, setMapId] = useState<string>('dead_signal');
  const map = NOISLESS_MAPS[mapId];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg vignette scanlines">
      <div className="absolute inset-0">
        <MapScene key={mapId} map={map} />
      </div>

      <Header />
      <MapSelector selected={mapId} onSelect={setMapId} />
      <InfoPanel map={map} />
      <Legend />
      <ControlsHint />
    </div>
  );
}
