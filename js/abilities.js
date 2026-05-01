// Ability definitions for both roles. Each ability has cooldown, key, and execute().
import * as THREE from 'three';
import { audio } from './audio.js';

// HUNTER ABILITIES ----------------------------------------------------------

export function makeHunterAbilities(game) {
  return [
    {
      key: '1', name: 'ECHO PULSE', desc: 'Emit a wave that reveals recent movement trails',
      cooldown: 12, ready: 0,
      execute(now) {
        // Spawn an expanding pulse from hunter, then highlight prey trail breadcrumbs.
        const pos = game.hunter.pos.clone();
        spawnPulse(game.scene, pos, 0xff3b3b, 22, 1.4);
        audio.pulse(pos, 220, 1.0, 'sine');

        // Reveal prey trail (last 8 seconds) as a fading line
        if (game.prey && game.prey.trail.length > 1) {
          const recent = game.prey.trail.filter(p => (now - p.t) < 8);
          if (recent.length > 1) {
            const points = recent.map(p => new THREE.Vector3(p.x, 0.1, p.z));
            const geom = new THREE.BufferGeometry().setFromPoints(points);
            const mat = new THREE.LineBasicMaterial({ color: 0xff3b3b, transparent: true, opacity: 0.9 });
            const line = new THREE.Line(geom, mat);
            line.userData.spawn = now;
            line.userData.life = 4;
            line.userData.fading = true;
            game.scene.add(line);
            game.tempObjects.push(line);
          }
        }
      },
    },
    {
      key: '2', name: 'RESONANCE SCAN', desc: 'Highlight zones where sound recently occurred',
      cooldown: 9, ready: 0,
      execute(now) {
        const pos = game.hunter.pos.clone();
        spawnPulse(game.scene, pos, 0x6ae3ff, 30, 1.8);
        audio.pulse(pos, 880, 0.6, 'triangle');

        // Spawn beacons on every recent sound event within 30m
        for (const e of game.sound.events) {
          const dx = e.pos.x - pos.x, dz = e.pos.z - pos.z;
          if (dx*dx + dz*dz < 30*30 && e.owner !== 'hunter') {
            const beacon = makeBeacon(e.pos, 0x6ae3ff);
            beacon.userData.spawn = now; beacon.userData.life = 6;
            game.scene.add(beacon);
            game.tempObjects.push(beacon);
          }
        }
      },
    },
    {
      key: '3', name: 'SILENCE TRAP', desc: 'Place a zone that amplifies prey movement sound',
      cooldown: 18, ready: 0,
      execute(now) {
        const pos = game.hunter.pos.clone();
        const trap = makeTrap(pos);
        trap.userData.spawn = now; trap.userData.life = 30;
        trap.userData.kind = 'silence_trap';
        trap.userData.radius = 5;
        game.scene.add(trap);
        game.traps.push(trap);
        audio.pulse(pos, 320, 0.4, 'square');
      },
    },
  ];
}

// PREY ABILITIES ------------------------------------------------------------

export function makePreyAbilities(game) {
  return [
    {
      key: '1', name: 'GHOST STEP', desc: 'Move silently for 4 seconds',
      cooldown: 14, ready: 0,
      execute(now) {
        game.prey.silentUntil = now + 4;
        flashOverlay(0x6ae3ff, 0.2, 0.5);
        audio.confirm();
      },
    },
    {
      key: '2', name: 'SOUND DECOY', desc: 'Throw a decoy that creates fake footsteps',
      cooldown: 10, ready: 0,
      execute(now) {
        const dir = new THREE.Vector3(-Math.sin(game.prey.yaw), 0, -Math.cos(game.prey.yaw));
        const pos = game.prey.pos.clone().add(dir.multiplyScalar(8));
        const decoy = makeDecoy(pos);
        decoy.userData.spawn = now; decoy.userData.life = 6;
        decoy.userData.nextStep = now + 0.4;
        decoy.userData.kind = 'decoy';
        game.scene.add(decoy);
        game.decoys.push(decoy);
        audio.confirm();
      },
    },
    {
      key: '3', name: 'PHASE FADE', desc: 'Become harder to see for 3 seconds',
      cooldown: 16, ready: 0,
      execute(now) {
        game.prey.fadedUntil = now + 3;
        flashOverlay(0xff3b3b, 0.15, 0.4);
        audio.pulse(game.prey.pos, 660, 0.4, 'sine');
      },
    },
  ];
}

// ---------------------------------------------------------------------------
// helpers
function spawnPulse(scene, pos, color, maxRadius, duration) {
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false });
  const geom = new THREE.RingGeometry(0.5, 0.6, 64);
  geom.rotateX(-Math.PI/2);
  const m = new THREE.Mesh(geom, mat);
  m.position.copy(pos); m.position.y = 0.1;
  m.userData.spawn = performance.now()/1000;
  m.userData.life = duration;
  m.userData.maxRadius = maxRadius;
  m.userData.kind = 'pulse';
  scene.add(m);
  // attach for update
  return m;
}

function makeBeacon(pos, color) {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.4, 0.55, 32).rotateX(-Math.PI/2),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 })
  );
  ring.position.y = 0.05;
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 6, 8),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5 })
  );
  beam.position.y = 3;
  g.add(ring); g.add(beam);
  g.position.copy(pos);
  return g;
}

function makeTrap(pos) {
  const g = new THREE.Group();
  const inner = new THREE.Mesh(
    new THREE.RingGeometry(4.6, 5, 64).rotateX(-Math.PI/2),
    new THREE.MeshBasicMaterial({ color: 0xff3b3b, transparent: true, opacity: 0.4 })
  );
  inner.position.y = 0.02;
  const fill = new THREE.Mesh(
    new THREE.CircleGeometry(5, 64).rotateX(-Math.PI/2),
    new THREE.MeshBasicMaterial({ color: 0xff3b3b, transparent: true, opacity: 0.06, side: THREE.DoubleSide })
  );
  fill.position.y = 0.01;
  g.add(inner); g.add(fill);
  g.position.copy(pos);
  return g;
}

function makeDecoy(pos) {
  const g = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xffcc55 })
  );
  g.position.copy(pos);
  g.position.y = 0.18;
  return g;
}

function flashOverlay(color, opacity, dur) {
  const div = document.createElement('div');
  div.style.position = 'fixed';
  div.style.inset = '0';
  div.style.pointerEvents = 'none';
  div.style.background = `radial-gradient(ellipse at center, transparent 30%, #${color.toString(16).padStart(6,'0')} 120%)`;
  div.style.opacity = opacity;
  div.style.transition = `opacity ${dur}s ease-out`;
  div.style.zIndex = 20;
  document.body.appendChild(div);
  requestAnimationFrame(() => { div.style.opacity = 0; });
  setTimeout(() => div.remove(), dur * 1000 + 100);
}

export function updateTempObjects(scene, list, now) {
  for (let i = list.length - 1; i >= 0; i--) {
    const o = list[i];
    const t = now - o.userData.spawn;
    if (t > o.userData.life) {
      scene.remove(o);
      if (o.geometry) o.geometry.dispose?.();
      if (o.material) o.material.dispose?.();
      list.splice(i, 1);
      continue;
    }
    if (o.userData.kind === 'pulse') {
      const k = t / o.userData.life;
      const r = 0.5 + k * o.userData.maxRadius;
      o.scale.set(r, r, r);
      o.material.opacity = (1 - k) * 0.9;
    } else if (o.userData.fading) {
      const k = t / o.userData.life;
      o.material.opacity = (1 - k) * 0.9;
    } else if (o.children?.length) {
      // beacon pulse
      const k = (t / o.userData.life);
      const sc = 1 + Math.sin(t * 6) * 0.1;
      o.scale.set(sc, 1, sc);
      for (const c of o.children) {
        if (c.material && c.material.opacity !== undefined)
          c.material.opacity = Math.max(0, 0.8 * (1 - k));
      }
    }
  }
}
