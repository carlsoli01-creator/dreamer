import { GameProvider, useGame } from './store';
import Menu from './ui/Menu';
import AvatarSelect from './ui/AvatarSelect';
import MapSelect from './ui/MapSelect';
import Loading from './ui/Loading';
import Settings from './ui/Settings';
import Controls from './ui/Controls';
import EndScreen from './ui/EndScreen';
import PlayLayer from './ui/PlayLayer';

export default function App() {
  return (
    <GameProvider>
      <Shell />
    </GameProvider>
  );
}

function Shell() {
  const g = useGame();
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      {/* Menus / screens */}
      {g.screen === 'menu'      && <Menu />}
      {g.screen === 'avatar'    && <AvatarSelect />}
      {g.screen === 'mapSelect' && <MapSelect />}
      {g.screen === 'loading'   && <Loading />}
      {g.screen === 'settings'  && <Settings />}
      {g.screen === 'controls'  && <Controls />}
      {g.screen === 'ended'     && <EndScreen />}

      {/* Game layer always-mounted while playing or paused */}
      {(g.screen === 'playing' || g.screen === 'paused') && <PlayLayer key={g.matchId} />}
    </div>
  );
}
