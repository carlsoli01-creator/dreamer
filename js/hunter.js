// Hunter: either player-controlled (1st person) or AI bot.
// AI version listens to the SoundSystem and chases the strongest recent sound source.

import * as THREE from 'three';
import { audio } from './audio.js';
import { moveAndSlide, rayBlocked } from './physics.js';

export class Hunter {
  constructor(scene, map, sound, opts = {}) {
    this.scene = scene;
    this.map = map;
    this.sound = sound;
    this.pos = map.hunterSpawn.clone();
    this.yaw = 0; this.pitch = 0;
    this.height = 1.75;
    this.radius = 0.35;
    this.lastStep = 0;
    this.dead = false;
    this.isAI = !!opts.ai;
    this.skill = opts.skill ?? 1.0;

    // AI memory
    this.targetPos = null;
    this.investigateUntil = 0;
    this.searchHeading = 0;
    this.lastDecisionAt = 0;

    // Visual mesh (only seen if hunter is AI / from prey's perspective)
    this.mesh = makeHunterMesh();
    this.mesh.position.copy(this.pos);
    if (this.isAI) scene.add(this.mesh);

    // Catch range
    this.catchRange = 1.6;
    this.detected = false;
    this.lostSightTimer = 0;
  }

  setLook(yaw, pitch) {
    this.yaw = yaw;
    this.pitch = Math.max(-0.9, Math.min(0.9, pitch));
  }

  // Player hunter update (manual control)
  updatePlayer(dt, input, walls) {
    if (this.dead) return;
    let speed = input.sprint ? 5.5 : 3.6;
    const cos = Math.cos(this.yaw), sin = Math.sin(this.yaw);
    const fwd = new THREE.Vector3(-sin, 0, -cos);
    const right = new THREE.Vector3(cos, 0, -sin);
    const move = new THREE.Vector3();
    move.addScaledVector(fwd, input.fwd);
    move.addScaledVector(right, input.strafe);
    if (move.lengthSq() > 0) move.normalize();
    move.multiplyScalar(speed * dt);
    moveAndSlide(this.pos, move, this.radius, this.height, walls);
    this._clamp();
    this.mesh.position.copy(this.pos);

    // hunter footsteps emit sound too (less to AI, more to other players in mp)
    const moving = move.lengthSq() > 1e-5;
    const now = performance.now()/1000;
    if (moving && now - this.lastStep > 0.46) {
      this.lastStep = now;
      const surf = this.map.surfaces(this.pos);
      audio.footstep(this.pos, surf, input.sprint ? 0.7 : 0.4);
      this.sound.emit({
        position: this.pos.clone().setY(0.05),
        loudness: input.sprint ? 0.6 : 0.3,
        surface: surf, owner: 'hunter', kind: 'step', visual: false
      });
    }
  }

  // AI hunter update — purely sound-driven
  updateAI(dt, prey, walls, decoys) {
    if (this.dead) return;
    const now = performance.now() / 1000;

    // Gather recent sound events (prey + decoys + hunter not relevant)
    let target = null; let bestScore = -1;
    for (const e of this.sound.events) {
      if (e.owner === 'hunter' || e.owner === 'env') continue;
      const age = now - e.time;
      const dx = e.pos.x - this.pos.x, dz = e.pos.z - this.pos.z;
      const d = Math.sqrt(dx*dx + dz*dz);
      // hearing range scales with loudness; trap amplification handled by emission
      const range = 28 + e.loudness * 14;
      if (d > range) continue;
      // decay older sounds
      const score = e.loudness * (1 - age / 4) * (1 - d / range);
      if (score > bestScore) { bestScore = score; target = e; }
    }

    // Direct line-of-sight to prey adds bonus
    const sightDist = this.pos.distanceTo(prey.pos);
    const inSight = sightDist < 22 && !rayBlocked(this.pos, prey.pos, walls) && this._inFov(prey.pos);
    const fadedNow = (performance.now()/1000) < prey.fadedUntil;
    if (inSight && !fadedNow) {
      this.targetPos = prey.pos.clone();
      this.investigateUntil = now + 4;
      this.detected = true;
      this.lostSightTimer = 0;
    } else {
      if (this.detected) {
        this.lostSightTimer += dt;
        if (this.lostSightTimer > 1.5) this.detected = false;
      }
      if (target && bestScore > 0) {
        // gradually update target — adds skill-based tracking error
        const err = (1.5 - this.skill) * 4;
        this.targetPos = target.pos.clone().add(new THREE.Vector3((Math.random()-0.5)*err, 0, (Math.random()-0.5)*err));
        this.investigateUntil = now + 3.5;
      }
    }

    // Movement
    let speed = (this.detected ? 5.3 : 3.4) * (0.85 + this.skill * 0.2);
    const move = new THREE.Vector3();
    if (this.targetPos && now < this.investigateUntil) {
      const d = this.targetPos.clone().sub(this.pos);
      const dist = d.length();
      if (dist > 0.5) {
        d.normalize();
        move.copy(d).multiplyScalar(speed * dt);
        // face target
        const desiredYaw = Math.atan2(-d.x, -d.z);
        this.yaw = lerpAngle(this.yaw, desiredYaw, 1 - Math.pow(0.001, dt));
      }
    } else {
      // wander/patrol slowly
      if (now - this.lastDecisionAt > 3 + Math.random()*2) {
        this.lastDecisionAt = now;
        this.searchHeading = Math.random() * Math.PI * 2;
      }
      const fwd = new THREE.Vector3(-Math.sin(this.searchHeading), 0, -Math.cos(this.searchHeading));
      move.copy(fwd).multiplyScalar(2.0 * dt);
      this.yaw = lerpAngle(this.yaw, this.searchHeading, 1 - Math.pow(0.05, dt));
    }

    moveAndSlide(this.pos, move, this.radius, this.height, walls);
    this._clamp();
    this.mesh.position.copy(this.pos);
    this.mesh.rotation.y = this.yaw + Math.PI;

    // hunter footsteps (only audible to player if player is prey — fed via audio engine)
    if (move.lengthSq() > 1e-5 && now - this.lastStep > 0.5) {
      this.lastStep = now;
      const surf = this.map.surfaces(this.pos);
      audio.footstep(this.pos, surf, this.detected ? 0.7 : 0.45);
    }

    // Catch
    if (sightDist < this.catchRange) {
      prey.dead = true;
      audio.detected();
    }
  }

  _inFov(p) {
    const dx = p.x - this.pos.x, dz = p.z - this.pos.z;
    const ang = Math.atan2(-dx, -dz);
    let diff = ang - this.yaw;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return Math.abs(diff) < 0.9;
  }

  _clamp() {
    const b = this.map.bounds;
    this.pos.x = Math.max(b.min.x + this.radius, Math.min(b.max.x - this.radius, this.pos.x));
    this.pos.z = Math.max(b.min.z + this.radius, Math.min(b.max.z - this.radius, this.pos.z));
  }

  cleanup() {
    if (this.mesh.parent) this.scene.remove(this.mesh);
  }
}

function lerpAngle(a, b, t) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

function makeHunterMesh() {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0a0c10, roughness: 0.4, metalness: 0.6 });
  const accent = new THREE.MeshStandardMaterial({ color: 0x6ae3ff, emissive: 0x6ae3ff, emissiveIntensity: 1.0 });

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.36, 0.95, 6, 12), bodyMat);
  torso.position.y = 1.05;
  torso.castShadow = true;
  g.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 12), bodyMat);
  head.position.y = 1.78; head.castShadow = true;
  g.add(head);

  // glowing eye band
  const visor = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.04, 8, 24), accent);
  visor.rotation.x = Math.PI / 2;
  visor.position.y = 1.78;
  g.add(visor);

  // shoulder spike
  const sp = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.4, 6), accent);
  sp.position.set(0, 1.55, -0.36);
  sp.rotation.x = -0.4;
  g.add(sp);

  return g;
}
