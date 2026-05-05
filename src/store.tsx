import { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';

export type Screen =
  | 'menu' | 'avatar' | 'mapSelect' | 'loading'
  | 'playing' | 'paused' | 'ended' | 'settings' | 'controls';

export type Role = 'prey' | 'hunter';
export type AvatarId = 'p_runner' | 'p_phantom' | 'h_stalker' | 'h_warden';

export interface Settings {
  volume: number;          // 0..1
  sensitivity: number;     // 0.2..2
  botSkill: number;        // 0.6..1.4
  invertY: boolean;
  showCues: boolean;
  fov: number;             // 60..100
}

export interface MatchStats {
  outcome: 'victory' | 'defeat' | 'timeout' | null;
  reason: string;
  timeSec: number;
  detections: number;
  abilitiesUsed: number;
  soundEmitted: number;
}

interface GameState {
  screen: Screen;
  prevScreen: Screen;       // used to return from settings/pause
  role: Role;
  avatarId: AvatarId;
  mapId: string;
  settings: Settings;
  stats: MatchStats;
  loadingProgress: number;  // 0..1
  loadingTip: string;
  matchId: number;          // increment to force fresh game scene mount

  setScreen: (s: Screen) => void;
  goto: (s: Screen) => void;
  back: () => void;

  setRole: (r: Role) => void;
  setAvatar: (a: AvatarId) => void;
  setMap: (m: string) => void;
  patchSettings: (p: Partial<Settings>) => void;

  startMatch: () => void;
  finishMatch: (s: Partial<MatchStats>) => void;
  resetStats: () => void;
}

const TIPS = [
  'STILLNESS PRODUCES NO SOUND. USE IT TO BAIT.',
  'SPRINTING IS THE LOUDEST ACTION. RESERVE IT.',
  'GHOST STEP GIVES 4S OF TOTAL SILENCE.',
  'DECOYS GENERATE REAL FOOTSTEPS — REDIRECT THE HUNT.',
  'ECHO PULSE REVEALS THE PREY’S LAST 8S OF MOVEMENT.',
  'PHASE FADE LOWERS YOUR VISIBILITY FOR 3 SECONDS.',
  'ON SNOW MAPS YOU LEAVE FOOTPRINTS. WATCH YOUR LINE.',
  'METAL DECKS AMPLIFY EVERY STEP. STAY OFF THE GRATING.',
  'GENERATOR ROOMS MASK MOVEMENT — USE THEM TO REPOSITION.',
  'SOUND TRAPS BROADCAST YOUR LOCATION WITHIN THEIR RADIUS.',
];

const defaultSettings: Settings = {
  volume: 0.75,
  sensitivity: 1.0,
  botSkill: 1.0,
  invertY: false,
  showCues: true,
  fov: 75,
};
const emptyStats: MatchStats = {
  outcome: null, reason: '', timeSec: 0,
  detections: 0, abilitiesUsed: 0, soundEmitted: 0,
};

const Ctx = createContext<GameState | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [screen, _setScreen] = useState<Screen>('menu');
  const prevRef = useRef<Screen>('menu');

  const [role, setRole] = useState<Role>('prey');
  const [avatarId, setAvatar] = useState<AvatarId>('p_runner');
  const [mapId, setMap] = useState<string>('dead_signal');
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [stats, setStats] = useState<MatchStats>(emptyStats);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingTip, setLoadingTip] = useState(TIPS[0]);
  const [matchId, setMatchId] = useState(0);

  const setScreen = useCallback((s: Screen) => {
    _setScreen(prev => { prevRef.current = prev; return s; });
  }, []);

  const goto = useCallback((s: Screen) => setScreen(s), [setScreen]);
  const back = useCallback(() => setScreen(prevRef.current), [setScreen]);

  const patchSettings = useCallback((p: Partial<Settings>) =>
    setSettings(s => ({ ...s, ...p })), []);

  const resetStats = useCallback(() => setStats(emptyStats), []);

  const startMatch = useCallback(() => {
    setStats(emptyStats);
    setLoadingProgress(0);
    setLoadingTip(TIPS[Math.floor(Math.random() * TIPS.length)]);
    setMatchId(n => n + 1);
    _setScreen('loading');
    let p = 0;
    const tick = () => {
      p += 0.04 + Math.random() * 0.07;
      if (p >= 1) {
        setLoadingProgress(1);
        setTimeout(() => _setScreen('playing'), 350);
      } else {
        setLoadingProgress(p);
        setTimeout(tick, 60 + Math.random() * 90);
      }
    };
    tick();
  }, []);

  const finishMatch = useCallback((s: Partial<MatchStats>) => {
    setStats(prev => ({ ...prev, ...s }));
    _setScreen('ended');
  }, []);

  const value: GameState = {
    screen, prevScreen: prevRef.current,
    role, avatarId, mapId, settings, stats, loadingProgress, loadingTip, matchId,
    setScreen, goto, back,
    setRole, setAvatar, setMap, patchSettings,
    startMatch, finishMatch, resetStats,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGame() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useGame outside GameProvider');
  return v;
}
