import * as THREE from 'three';
import { MapData } from '../types';
import { AABB, clampToBounds, moveAndSlide } from './physics';
import { audio } from '../audio/engine';

export interface FootstepEvent { x:number; z:number; t:number; emitter:'player'|'ai'|'decoy'; loud:number }
export interface AbilityState { ready: number; active: number } // timestamps

export interface PlayerInput {
  fwd: number; strafe: number;
  sprint: boolean; crouch: boolean;
  yaw: number; pitch: number;
}

export class Player {
  pos = new THREE.Vector3();
  vel = new THREE.Vector3();
  yaw = 0; pitch = 0;
  height = 1.7;
  radius = 0.4;
  role: 'prey'|'hunter';
  speedBase = 4.6;
  sprintMult = 1.7;
  crouchMult = 0.5;
  lastFootstepT = 0;
  silentUntil = 0;     // ghost step
  fadedUntil = 0;      // phase fade
  caught = false; escaped = false;
  abilities: Record<string, AbilityState> = {};
  speedMul = 1;        // avatar perk
  silentBoost = 0;     // avatar perk extra ghost duration
  hearingMul = 1;
  chaseMul = 1;
  loudnessMul = 1;     // for stealth avatars

  constructor(role: 'prey'|'hunter', start: { x:number; z:number }) {
    this.role = role;
    this.pos.set(start.x, 0, start.z);
  }

  update(dt: number, input: PlayerInput, obstacles: AABB[], map: MapData, footsteps: FootstepEvent[], surface: string) {
    if (this.caught || this.escaped) return;
    const t = performance.now() / 1000;
    this.yaw = input.yaw; this.pitch = input.pitch;

    let speed = this.speedBase * this.speedMul;
    if (input.crouch) speed *= this.crouchMult;
    else if (input.sprint) speed *= this.sprintMult;

    const cos = Math.cos(this.yaw), sin = Math.sin(this.yaw);
    // forward = -Z when yaw=0 (matches camera's lookAt)
    const fx = -sin, fz = -cos;
    const rx = cos, rz = -sin;
    const dx = (fx * input.fwd + rx * input.strafe);
    const dz = (fz * input.fwd + rz * input.strafe);
    const len = Math.hypot(dx, dz);
    let mx = 0, mz = 0;
    if (len > 0) { mx = (dx / len) * speed * dt; mz = (dz / len) * speed * dt; }

    moveAndSlide(this.pos, { x: mx, z: mz }, this.radius, obstacles);
    clampToBounds(this.pos, map, this.radius);

    // Footsteps
    const moving = (mx*mx + mz*mz) > 1e-7;
    const inSilence = t < this.silentUntil;
    if (moving && !inSilence) {
      const baseLoud = input.crouch ? 0.18 : (input.sprint ? 0.85 : 0.45);
      const loud = baseLoud * this.loudnessMul;
      const interval = input.crouch ? 0.65 : (input.sprint ? 0.32 : 0.45);
      if (t - this.lastFootstepT > interval) {
        this.lastFootstepT = t;
        footsteps.push({ x: this.pos.x, z: this.pos.z, t, emitter: 'player', loud });
        if (footsteps.length > 80) footsteps.shift();
        audio.footstep({ x: this.pos.x, y: 0, z: this.pos.z }, surface, loud);
      }
    }
  }

  tryAbility(id: string, cooldown: number, duration: number, t: number) {
    const a = this.abilities[id] ?? { ready: 0, active: 0 };
    if (t < a.ready) return false;
    a.ready = t + cooldown;
    a.active = t + duration;
    this.abilities[id] = a;
    if (id === 'ghost_step')  this.silentUntil = a.active + this.silentBoost;
    if (id === 'phase_fade')  this.fadedUntil = a.active;
    return true;
  }
}
