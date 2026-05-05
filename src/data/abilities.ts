import { Role } from '../store';

export interface AbilityDef {
  id: string;
  key: string;        // keyboard key
  name: string;
  short: string;      // 4-char tag for HUD
  desc: string;
  cooldown: number;   // seconds
  duration?: number;  // active duration if applicable
  color: string;
}

export const PREY_ABILITIES: AbilityDef[] = [
  { id: 'ghost_step', key: '1', name: 'GHOST STEP',  short: 'GHST', desc: 'Move silently for 4 seconds.',           cooldown: 14, duration: 4, color: '#66ccff' },
  { id: 'decoy',      key: '2', name: 'SOUND DECOY', short: 'DECY', desc: 'Throw a decoy that emits fake footsteps.', cooldown: 10, duration: 6, color: '#ffcc55' },
  { id: 'phase_fade', key: '3', name: 'PHASE FADE',  short: 'FADE', desc: 'Become harder to detect for 3 seconds.',  cooldown: 16, duration: 3, color: '#ff2244' },
];

export const HUNTER_ABILITIES: AbilityDef[] = [
  { id: 'echo_pulse',     key: '1', name: 'ECHO PULSE',      short: 'PULS', desc: 'Pulse reveals prey location for 1.2s.',           cooldown: 12, duration: 1.2, color: '#ff2244' },
  { id: 'resonance_scan', key: '2', name: 'RESONANCE SCAN',  short: 'SCAN', desc: 'Highlights recent sound origins for 4s.',         cooldown: 9,  duration: 4,   color: '#66ccff' },
  { id: 'silence_trap',   key: '3', name: 'SILENCE TRAP',    short: 'TRAP', desc: 'Place a zone that amplifies prey sound (30s).',   cooldown: 18, duration: 30,  color: '#ff9933' },
];

export function abilitiesFor(role: Role) {
  return role === 'prey' ? PREY_ABILITIES : HUNTER_ABILITIES;
}
