// Sound event system — the heartbeat of NOISLESS.
// Every gameplay-relevant noise is registered here. Hunter perception, AI decisions,
// and visual indicators all read from this stream.

import * as THREE from 'three';

export class SoundSystem {
  constructor(scene) {
    this.scene = scene;
    this.events = [];        // active sound events
    this.totalEmitted = 0;   // stat counter
    this.ringMeshes = [];    // visual ripples
    this.maxRings = 24;

    // ring geometry shared
    this._ringGeo = new THREE.RingGeometry(0.4, 0.5, 48);
    this._ringGeo.rotateX(-Math.PI / 2);
  }

  // Emit a sound at a world position with loudness 0..1.
  // owner: 'prey' | 'hunter' | 'env' | 'decoy'
  emit({ position, loudness, surface = 'concrete', owner = 'prey', kind = 'step', visual = true }) {
    const ev = {
      pos: position.clone(),
      loudness,
      surface, owner, kind,
      time: performance.now() / 1000,
      life: 0,
      maxLife: 1.4 + loudness * 0.8,
      heard: false,
    };
    this.events.push(ev);
    if (owner !== 'env') this.totalEmitted++;

    if (visual) this._spawnRing(ev);
    return ev;
  }

  _spawnRing(ev) {
    if (this.ringMeshes.length >= this.maxRings) {
      const old = this.ringMeshes.shift();
      this.scene.remove(old.mesh);
      old.mesh.material.dispose();
    }
    const color = ev.owner === 'hunter' ? 0x6ae3ff
              : ev.owner === 'decoy'   ? 0xffcc55
              : 0xff3b3b;
    const mat = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.7, depthWrite: false, side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(this._ringGeo, mat);
    mesh.position.copy(ev.pos);
    mesh.position.y = 0.05;
    mesh.userData.spawnTime = ev.time;
    mesh.userData.maxLife = ev.maxLife;
    mesh.userData.loudness = ev.loudness;
    this.scene.add(mesh);
    this.ringMeshes.push({ mesh, ev });
  }

  update(dt) {
    const now = performance.now() / 1000;

    // expire events
    this.events = this.events.filter(e => (now - e.time) < e.maxLife);

    // animate rings
    for (let i = this.ringMeshes.length - 1; i >= 0; i--) {
      const r = this.ringMeshes[i];
      const t = now - r.mesh.userData.spawnTime;
      const life = r.mesh.userData.maxLife;
      const loud = r.mesh.userData.loudness;
      if (t > life) {
        this.scene.remove(r.mesh);
        r.mesh.material.dispose();
        this.ringMeshes.splice(i, 1);
      } else {
        const k = t / life;
        const radius = 0.5 + k * (3 + loud * 12);
        r.mesh.scale.set(radius, radius, radius);
        r.mesh.material.opacity = (1 - k) * 0.6;
      }
    }
  }

  // Returns array of sounds heard by listener at pos+yaw, with bearings.
  // Hunter ability filters apply via owner/kind — this is the raw audible set.
  audibleFor(pos, range = 30) {
    const out = [];
    for (const e of this.events) {
      const dx = e.pos.x - pos.x;
      const dz = e.pos.z - pos.z;
      const d = Math.sqrt(dx*dx + dz*dz);
      const heardRange = range * (0.4 + e.loudness);
      if (d < heardRange) {
        out.push({
          ev: e,
          distance: d,
          bearing: Math.atan2(dx, -dz), // world-space; caller subtracts yaw
        });
      }
    }
    return out;
  }

  // Drop trail markers (Echo Pulse / footprints in snow)
  spawnTrail(scene, points, color = 0x6ae3ff, life = 4) {
    if (!points.length) return null;
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.85 });
    const line = new THREE.Line(geom, mat);
    line.userData.spawn = performance.now() / 1000;
    line.userData.life = life;
    scene.add(line);
    return line;
  }

  clear() {
    this.events.length = 0;
    for (const r of this.ringMeshes) {
      this.scene.remove(r.mesh);
      r.mesh.material.dispose();
    }
    this.ringMeshes.length = 0;
    this.totalEmitted = 0;
  }
}
