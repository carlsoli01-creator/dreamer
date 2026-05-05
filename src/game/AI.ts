import * as THREE from 'three';
import { MapData } from '../types';
import { aStar, buildWorld, Graph, nearest, WP } from '../ai/world';
import { AABB, segmentBlocked, moveAndSlide, clampToBounds } from './physics';
import { audio } from '../audio/engine';
import { FootstepEvent } from './Player';

export type AIMode = 'patrol'|'investigate'|'chase'|'extract'|'evade'|'idle';

export class AI {
  pos = new THREE.Vector3();
  yaw = 0;
  speed = 4.0;
  role: 'prey'|'hunter';   // role of the AI (opposite of player)
  radius = 0.4;
  graph: Graph;
  path: number[] = [];
  pathIdx = 0;
  mode: AIMode;
  goalLabel = 'IDLE';
  lastFootstepT = 0;
  alertedAt = -999;
  hearingRange = 28;
  visionRange = 22;
  visionFov = 0.55;
  caught = false;
  caughtAt = 0;
  skill: number;

  constructor(role: 'prey'|'hunter', map: MapData, skill = 1) {
    this.role = role;
    this.skill = skill;
    this.graph = buildWorld(map);
    const sp = role === 'hunter' ? map.spawnPoints.hunter : map.spawnPoints.prey;
    this.pos.set(sp.x, 0, sp.z);
    this.mode = role === 'hunter' ? 'patrol' : 'extract';
    this.hearingRange = (role === 'hunter' ? 28 : 16) * skill;
    this.visionRange = (role === 'hunter' ? 22 : 0) * skill;
  }

  update(dt: number, t: number, playerPos: THREE.Vector3, playerSilent: boolean, playerFaded: boolean,
         obstacles: AABB[], map: MapData, footsteps: FootstepEvent[], silenceTraps: { x:number; z:number; r:number }[]) {
    if (this.caught) return;
    if (this.role === 'hunter') this.updateHunter(dt, t, playerPos, playerSilent, playerFaded, obstacles, map, footsteps);
    else this.updatePrey(dt, t, playerPos, obstacles, map, footsteps, silenceTraps);
  }

  // ---- Hunter AI ----
  private updateHunter(dt:number, t:number, playerPos:THREE.Vector3, playerSilent:boolean, playerFaded:boolean,
                       obstacles:AABB[], map:MapData, fs:FootstepEvent[]) {
    // Hear player footsteps
    let heard: FootstepEvent | null = null;
    let bestScore = 0;
    if (!playerSilent) {
      for (let i = fs.length - 1; i >= 0 && i >= fs.length - 30; i--) {
        const f = fs[i];
        if (f.emitter !== 'player' && f.emitter !== 'decoy') continue;
        if (t - f.t > 1.6) break;
        const dx = f.x - this.pos.x, dz = f.z - this.pos.z;
        const d = Math.hypot(dx, dz);
        if (d > this.hearingRange) continue;
        const score = f.loud * (1 - d / this.hearingRange);
        if (score > bestScore) { bestScore = score; heard = f; }
      }
    }

    // LOS / FOV detection
    const dxp = playerPos.x - this.pos.x, dzp = playerPos.z - this.pos.z;
    const distP = Math.hypot(dxp, dzp);
    const inFov = this.inVisionCone(playerPos, obstacles);
    const visMul = playerFaded ? 0.5 : 1;
    if (inFov && distP < this.visionRange * visMul) {
      this.alertedAt = t;
      this.mode = 'chase';
      this.goalLabel = 'CHASE [LOS]';
      this.repath(nearest(this.graph, playerPos.x, playerPos.z));
    } else if (this.mode === 'chase' && t - this.alertedAt > 4) {
      this.mode = 'investigate';
      this.goalLabel = 'INVESTIGATE';
    }

    if (this.mode !== 'chase' && heard) {
      this.mode = 'investigate';
      this.goalLabel = 'INVESTIGATE [SOUND]';
      this.repath(nearest(this.graph, heard.x, heard.z));
    }

    // Patrol pick
    const pathExhausted = this.path.length - this.pathIdx < 2;
    if ((this.mode === 'patrol' || (this.mode !== 'chase' && this.mode !== 'investigate' && pathExhausted))) {
      const cands = this.graph.nodes.filter(n => n.tag === 'building' || n.tag === 'zone' || n.tag === 'corner');
      const pick = cands[Math.floor(Math.random() * cands.length)];
      this.repath(pick.id);
      this.mode = 'patrol';
      this.goalLabel = 'PATROL';
    }
    if (this.mode === 'investigate' && pathExhausted) {
      this.mode = 'patrol'; this.goalLabel = 'PATROL';
    }

    // Speed
    const baseSpeed = this.mode === 'chase' ? 5.6 : (this.mode === 'investigate' ? 4.6 : 3.4);
    this.speed = baseSpeed * this.skill;

    this.followPath(dt, obstacles, map);

    // Footsteps for hunter
    if (this.movingNow) {
      if (t - this.lastFootstepT > 0.5) {
        this.lastFootstepT = t;
        const surf = mapSurface(map);
        audio.footstep({ x: this.pos.x, y: 0, z: this.pos.z }, surf, this.mode === 'chase' ? 0.7 : 0.45);
      }
    }
  }

  // ---- Prey AI ----
  private updatePrey(dt:number, t:number, playerPos:THREE.Vector3, obstacles:AABB[], map:MapData, fs:FootstepEvent[], traps:{x:number;z:number;r:number}[]) {
    const dxh = this.pos.x - playerPos.x, dzh = this.pos.z - playerPos.z;
    const distH = Math.hypot(dxh, dzh);
    const FLEE = 14;

    if (distH < FLEE) {
      this.mode = 'evade'; this.goalLabel = 'EVADE';
      if (this.path.length - this.pathIdx < 2) {
        const ext = this.graph.nodes.filter(n => n.tag === 'extraction');
        let best = ext[0]; let bestD = -1;
        for (const e of ext) {
          const d = (e.x - playerPos.x)**2 + (e.z - playerPos.z)**2;
          if (d > bestD) { bestD = d; best = e; }
        }
        this.repath(best.id);
      }
    } else {
      this.mode = 'extract'; this.goalLabel = 'EXTRACT';
      if (this.path.length - this.pathIdx < 2) {
        const ext = this.graph.nodes.filter(n => n.tag === 'extraction');
        const t2 = ext[Math.floor(Math.random() * ext.length)];
        this.repath(t2.id);
      }
    }

    const baseSpeed = this.mode === 'evade' ? 5.4 : 4.2;
    this.speed = baseSpeed * this.skill;
    this.followPath(dt, obstacles, map);

    if (this.movingNow && t - this.lastFootstepT > 0.45) {
      this.lastFootstepT = t;
      const surf = mapSurface(map);
      let loud = this.mode === 'evade' ? 0.85 : 0.55;
      for (const tr of traps) { if ((this.pos.x-tr.x)**2 + (this.pos.z-tr.z)**2 < tr.r*tr.r) loud = Math.min(1, loud * 2); }
      fs.push({ x: this.pos.x, z: this.pos.z, t, emitter: 'ai', loud });
      if (fs.length > 80) fs.shift();
      audio.footstep({ x: this.pos.x, y: 0, z: this.pos.z }, surf, loud);
    }
  }

  movingNow = false;

  repath(toId: number) {
    const fromId = nearest(this.graph, this.pos.x, this.pos.z);
    this.path = aStar(this.graph, fromId, toId);
    this.pathIdx = 0;
  }

  followPath(dt: number, obstacles: AABB[], map: MapData) {
    this.movingNow = false;
    if (this.path.length === 0 || this.pathIdx >= this.path.length - 1) return;
    const next: WP = this.graph.nodes[this.path[this.pathIdx + 1]];
    const dx = next.x - this.pos.x, dz = next.z - this.pos.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.7) { this.pathIdx++; return; }
    const ux = dx / dist, uz = dz / dist;
    const step = Math.min(dist, this.speed * dt);
    moveAndSlide(this.pos, { x: ux * step, z: uz * step }, this.radius, obstacles);
    clampToBounds(this.pos, map, this.radius);
    this.movingNow = true;
    const targetYaw = Math.atan2(-ux, -uz);
    this.yaw = lerpAngle(this.yaw, targetYaw, 1 - Math.pow(0.0001, dt));
  }

  inVisionCone(p: THREE.Vector3, obstacles: AABB[]) {
    const dx = p.x - this.pos.x, dz = p.z - this.pos.z;
    const ang = Math.atan2(-dx, -dz);
    let diff = ang - this.yaw;
    while (diff >  Math.PI) diff -= 2*Math.PI;
    while (diff < -Math.PI) diff += 2*Math.PI;
    if (Math.abs(diff) > this.visionFov) return false;
    if (segmentBlocked(this.pos.x, this.pos.z, p.x, p.z, obstacles)) return false;
    return true;
  }
}

function lerpAngle(a:number,b:number,t:number){
  let d = b - a;
  while (d >  Math.PI) d -= 2*Math.PI;
  while (d < -Math.PI) d += 2*Math.PI;
  return a + d*t;
}
function mapSurface(map: MapData) {
  if (map.id === 'white_hollow') return 'snow';
  if (map.id === 'black_array') return 'metal';
  return 'concrete';
}
