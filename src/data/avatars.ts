import { AvatarId, Role } from '../store';

export interface AvatarDef {
  id: AvatarId;
  role: Role;
  name: string;
  callsign: string;
  desc: string;
  bodyColor: string;
  accentColor: string;
  stats: { speed: number; stealth: number; control: number };
  perk: string;
}

export const AVATARS: Record<AvatarId, AvatarDef> = {
  p_runner: {
    id: 'p_runner', role: 'prey', name: 'RUNNER', callsign: 'PR-01',
    desc: 'High mobility evader. Sprints longer, recovers faster.',
    bodyColor: '#202833', accentColor: '#ff2244',
    stats: { speed: 90, stealth: 60, control: 40 },
    perk: '+15% sprint duration',
  },
  p_phantom: {
    id: 'p_phantom', role: 'prey', name: 'PHANTOM', callsign: 'PR-02',
    desc: 'Quiet operator. Lower footstep loudness, longer ghost step.',
    bodyColor: '#1a2030', accentColor: '#ffcc55',
    stats: { speed: 70, stealth: 95, control: 55 },
    perk: '+2s ghost step duration',
  },
  h_stalker: {
    id: 'h_stalker', role: 'hunter', name: 'STALKER', callsign: 'HU-01',
    desc: 'Aggressive pursuer. Faster chase speed.',
    bodyColor: '#0a0c10', accentColor: '#66ccff',
    stats: { speed: 80, stealth: 30, control: 75 },
    perk: '+15% chase speed',
  },
  h_warden: {
    id: 'h_warden', role: 'hunter', name: 'WARDEN', callsign: 'HU-02',
    desc: 'Detection specialist. Larger hearing range, faster echo pulse.',
    bodyColor: '#0a0c10', accentColor: '#00ffaa',
    stats: { speed: 65, stealth: 40, control: 95 },
    perk: '+25% hearing range',
  },
};

export const AVATAR_IDS: AvatarId[] = ['p_runner','p_phantom','h_stalker','h_warden'];
