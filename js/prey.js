// Prey controller — third-person, mobility-focused, sound-emitting.
import * as THREE from 'three';
import { audio } from './audio.js';
import { moveAndSlide } from './physics.js';

export class Prey {
  constructor(scene, map, sound) {
    this.scene = scene;
    this.map = map;
    this.sound = sound;
    this.pos = map.preySpawn.clone();
    this.vel = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = 0;
    this.height = 1.7;
    this.radius = 0.35;

    this.crouch = false;
    this.sprint = false;
    this.silentUntil = 0;     // ghost step
    this.fadedUntil = 0;      // phase fade
    this.lastStep = 0;
    this.stepInterval = 0.45;
    this.dead = false;
    this.escaped = false;

    this.trail = []; // breadcrumbs for echo pulse
    this.lastTrailDrop = 0;

    // visual mesh (third person body)
    this.mesh = makePreyMesh();
    this.mesh.position.copy(this.pos);
    scene.add(this.mesh);

    // footprint trail group
    this.printGroup = new THREE.Group();
    scene.add(this.printGroup);
  }

  setLook(yaw, pitch) {
    this.yaw = yaw;
    this.pitch = Math.max(-0.4, Math.min(0.6, pitch));
  }

  // input vector in local space (-1..1 strafe / forward); jump bool
  update(dt, input, walls, traps) {
    if (this.dead || this.escaped) return;
    const now = performance.now() / 1000;

    // movement speeds
    let speed = 4.8;
    if (this.crouch) speed = 2.2;
    else if (this.sprint) speed = 8.0;

    // direction
    const cos = Math.cos(this.yaw), sin = Math.sin(this.yaw);
    const forward = new THREE.Vector3(-sin, 0, -cos);
    const right = new THREE.Vector3(cos, 0, -sin);
    const move = new THREE.Vector3();
    move.addScaledVector(forward, input.fwd);
    move.addScaledVector(right, input.strafe);
    if (move.lengthSq() > 0) move.normalize();
    move.multiplyScalar(speed * dt);

    moveAndSlide(this.pos, move, this.radius, this.height, walls);

    // bounds clamp
    const b = this.map.bounds;
    this.pos.x = Math.max(b.min.x + this.radius, Math.min(b.max.x - this.radius, this.pos.x));
    this.pos.z = Math.max(b.min.z + this.radius, Math.min(b.max.z - this.radius, this.pos.z));

    // mesh pose
    this.mesh.position.set(this.pos.x, this.pos.y, this.pos.z);
    this.mesh.rotation.y = this.yaw + Math.PI;

    // crouch visual
    const targetY = this.crouch ? 0.6 : 1.0;
    this.mesh.scale.y = THREE.MathUtils.lerp(this.mesh.scale.y, targetY, 1 - Math.pow(0.001, dt));

    // sound emission (footsteps)
    const moving = move.lengthSq() > 1e-5;
    const inSilence = now < this.silentUntil;
    if (moving && !inSilence) {
      // determine loudness
      let loud = this.crouch ? 0.18 : (this.sprint ? 0.85 : 0.45);

      // silence trap amplifies
      for (const t of traps) {
        if (t.userData.kind === 'silence_trap') {
          const dx = this.pos.x - t.position.x, dz = this.pos.z - t.position.z;
          if (dx*dx + dz*dz < t.userData.radius * t.userData.radius) {
            loud = Math.min(1, loud * 2.4 + 0.2);
          }
        }
      }

      const interval = this.crouch ? 0.65 : (this.sprint ? 0.32 : 0.45);
      if (now - this.lastStep > interval) {
        this.lastStep = now;
        const surf = this.map.surfaces(this.pos);
        this.sound.emit({
          position: this.pos.clone().setY(0.05),
          loudness: loud,
          surface: surf,
          owner: 'prey',
          kind: 'step',
          visual: true,
        });
        audio.footstep(this.pos, surf, loud);

        // snow footprints
        if (surf === 'snow') this._dropPrint();
      }
    }

    // breadcrumb trail
    if (now - this.lastTrailDrop > 0.25 && moving) {
      this.lastTrailDrop = now;
      this.trail.push({ x: this.pos.x, z: this.pos.z, t: now });
      if (this.trail.length > 200) this.trail.shift();
    }

    // phase fade visual
    const faded = now < this.fadedUntil;
    this.mesh.traverse((c) => {
      if (c.isMesh && c.material) {
        if (!c.material._origOpacity) c.material._origOpacity = c.material.opacity || 1;
        c.material.transparent = true;
        c.material.opacity = faded ? 0.18 : c.material._origOpacity;
      }
    });
  }

  _dropPrint() {
    const g = new THREE.Mesh(
      new THREE.CircleGeometry(0.2, 12).rotateX(-Math.PI/2),
      new THREE.MeshBasicMaterial({ color: 0x666666, transparent: true, opacity: 0.55, depthWrite: false })
    );
    g.position.set(this.pos.x, 0.02, this.pos.z);
    g.userData.spawn = performance.now()/1000;
    g.userData.life = 12;
    this.printGroup.add(g);
    if (this.printGroup.children.length > 80) {
      const old = this.printGroup.children.shift();
      old.material.dispose();
    }
  }

  cleanup() {
    this.scene.remove(this.mesh);
    this.scene.remove(this.printGroup);
  }
}

function makePreyMesh() {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x202833, roughness: 0.7 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0xff3b3b, emissive: 0xff3b3b, emissiveIntensity: 0.4 });

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.9, 6, 12), bodyMat);
  torso.position.y = 1.0;
  torso.castShadow = true;
  g.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), bodyMat);
  head.position.y = 1.7;
  head.castShadow = true;
  g.add(head);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.05), accentMat);
  visor.position.set(0, 1.72, -0.18);
  g.add(visor);

  // legs (visual)
  const legMat = bodyMat;
  const lA = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.5, 4, 8), legMat);
  lA.position.set(-0.15, 0.4, 0); g.add(lA);
  const lB = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.5, 4, 8), legMat);
  lB.position.set(0.15, 0.4, 0); g.add(lB);

  return g;
}
