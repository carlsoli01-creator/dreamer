// Map builders. Each map returns: { walls (array of BoxColliders), props, lights, extractionPos,
// preySpawn, hunterSpawn, surfaces (function(pos) => 'concrete'|'metal'|'snow'), bounds }

import * as THREE from 'three';

export function buildMap(name, scene, audio) {
  if (name === 'white_hollow') return buildWhiteHollow(scene);
  if (name === 'black_array') return buildBlackArray(scene);
  return buildDeadSignal(scene);
}

// ---------- shared helpers ----------
function makeWall(scene, x, y, z, sx, sy, sz, mat) {
  const g = new THREE.BoxGeometry(sx, sy, sz);
  const m = new THREE.Mesh(g, mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  scene.add(m);
  return { mesh: m, min: new THREE.Vector3(x - sx/2, y - sy/2, z - sz/2), max: new THREE.Vector3(x + sx/2, y + sy/2, z + sz/2) };
}

function flicker(light, base = 0.8) {
  light.userData.flicker = true;
  light.userData.base = base;
}

// ---------- Dead Signal ----------
function buildDeadSignal(scene) {
  const walls = [];
  const lights = [];
  const props = [];

  const floorMat = new THREE.MeshStandardMaterial({ color: 0x14171c, roughness: 0.95, metalness: 0.05 });
  const wallMat  = new THREE.MeshStandardMaterial({ color: 0x1c2026, roughness: 0.85, metalness: 0.1 });
  const accentMat= new THREE.MeshStandardMaterial({ color: 0x2a3038, roughness: 0.6, metalness: 0.3 });
  const trimMat  = new THREE.MeshStandardMaterial({ color: 0x0a0c10, roughness: 0.9 });

  // floor
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // ceiling
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), trimMat);
  ceil.rotation.x = Math.PI / 2; ceil.position.y = 4;
  scene.add(ceil);

  // outer walls
  const W = 40; const H = 4;
  walls.push(makeWall(scene, 0,  H/2, -W,  W*2, H, 1, wallMat));
  walls.push(makeWall(scene, 0,  H/2,  W,  W*2, H, 1, wallMat));
  walls.push(makeWall(scene, -W, H/2, 0,  1, H, W*2, wallMat));
  walls.push(makeWall(scene,  W, H/2, 0,  1, H, W*2, wallMat));

  // interior corridors (server room layout)
  const interior = [
    // long divider
    [-12, H/2, -8, 1, H, 26],
    [ 12, H/2,  8, 1, H, 26],
    // cross walls forming rooms
    [-22, H/2,  8, 14, H, 1],
    [ 22, H/2, -8, 14, H, 1],
    [  -2, H/2, -22, 16, H, 1],
    [   2, H/2,  22, 16, H, 1],
    // server racks (smaller)
    [-26, 1, -25, 2, 2, 6],
    [-26, 1, -16, 2, 2, 6],
    [ 26, 1,  16, 2, 2, 6],
    [ 26, 1,  25, 2, 2, 6],
    [  6, 1, -28, 6, 2, 2],
    [ -6, 1,  28, 6, 2, 2],
    // pillar columns
    [  0, H/2,  0, 1.5, H, 1.5],
    [-18, H/2,-18, 1.2, H, 1.2],
    [ 18, H/2, 18, 1.2, H, 1.2],
    [-18, H/2, 18, 1.2, H, 1.2],
    [ 18, H/2,-18, 1.2, H, 1.2],
  ];
  for (const w of interior) {
    walls.push(makeWall(scene, w[0], w[1], w[2], w[3], w[4], w[5], w[5] < 4 ? accentMat : wallMat));
  }

  // ambient lighting
  const amb = new THREE.AmbientLight(0x202833, 0.55); scene.add(amb);
  const hemi = new THREE.HemisphereLight(0x405060, 0x080808, 0.3); scene.add(hemi);

  // overhead point lights (some flickering)
  const lightSpots = [
    [-22, 3.4,-22, 0xff5555, 1.2, true],
    [ 22, 3.4,-22, 0x6ae3ff, 0.9, false],
    [-22, 3.4, 22, 0x6ae3ff, 0.9, false],
    [ 22, 3.4, 22, 0xff5555, 1.0, true],
    [  0, 3.6,  0, 0xffd0a0, 0.8, true],
    [-12, 3.4,  6, 0x90c0ff, 0.6, false],
    [ 12, 3.4, -6, 0x90c0ff, 0.6, false],
  ];
  for (const ls of lightSpots) {
    const l = new THREE.PointLight(ls[3], ls[4], 18, 1.6);
    l.position.set(ls[0], ls[1], ls[2]);
    if (ls[5]) flicker(l, ls[4]);
    scene.add(l);
    lights.push(l);

    // visible fixture
    const fix = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x111317, emissive: ls[3], emissiveIntensity: 0.6 }));
    fix.position.set(ls[0], 3.95, ls[2]);
    scene.add(fix);
    props.push(fix);
  }

  // extraction pad
  const padGeom = new THREE.CircleGeometry(2.2, 48); padGeom.rotateX(-Math.PI/2);
  const padMat = new THREE.MeshStandardMaterial({ color: 0x6ae3ff, emissive: 0x6ae3ff, emissiveIntensity: 1.4, transparent: true, opacity: 0.85 });
  const pad = new THREE.Mesh(padGeom, padMat);
  pad.position.set(28, 0.02, -28);
  scene.add(pad);
  props.push(pad);

  // pad ring
  const padRing = new THREE.Mesh(
    new THREE.RingGeometry(2.2, 2.6, 64).rotateX(-Math.PI/2),
    new THREE.MeshBasicMaterial({ color: 0x6ae3ff, transparent: true, opacity: 0.6 })
  );
  padRing.position.set(28, 0.04, -28);
  scene.add(padRing); props.push(padRing);

  return {
    name: 'DEAD SIGNAL',
    walls, lights, props,
    extractionPos: new THREE.Vector3(28, 0, -28),
    preySpawn: new THREE.Vector3(-30, 0, 30),
    hunterSpawn: new THREE.Vector3(0, 0, 0),
    surfaces: () => 'concrete',
    fogColor: 0x080a0e,
    fogNear: 8, fogFar: 36,
    skyColor: 0x05060a,
    bounds: { min: new THREE.Vector3(-W+1, 0, -W+1), max: new THREE.Vector3(W-1, 4, W-1) },
  };
}

// ---------- White Hollow ----------
function buildWhiteHollow(scene) {
  const walls = [];
  const lights = [];
  const props = [];

  const floorMat = new THREE.MeshStandardMaterial({ color: 0xdfe6ee, roughness: 1.0, metalness: 0 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x2a241c, roughness: 0.95 });
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x8a8e94, roughness: 0.9 });

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), floorMat);
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
  scene.add(floor);

  // outer ring of "wall" trees forming bounds
  const W = 40;
  // invisible bounding walls
  const invMat = new THREE.MeshStandardMaterial({ visible: false });
  walls.push(makeWall(scene, 0, 2, -W, W*2, 4, 1, invMat));
  walls.push(makeWall(scene, 0, 2,  W, W*2, 4, 1, invMat));
  walls.push(makeWall(scene, -W, 2, 0, 1, 4, W*2, invMat));
  walls.push(makeWall(scene,  W, 2, 0, 1, 4, W*2, invMat));

  // scatter trees (cylinders)
  const rng = mulberry32(424242);
  for (let i = 0; i < 80; i++) {
    const x = (rng()*2-1) * 36;
    const z = (rng()*2-1) * 36;
    if (Math.abs(x) < 4 && Math.abs(z) < 4) continue;
    const r = 0.4 + rng()*0.3;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(r, r*1.2, 6, 7), trunkMat);
    trunk.position.set(x, 3, z);
    trunk.castShadow = true;
    scene.add(trunk);
    walls.push({ mesh: trunk, min: new THREE.Vector3(x-r, 0, z-r), max: new THREE.Vector3(x+r, 6, z+r) });

    const cap = new THREE.Mesh(new THREE.ConeGeometry(r*4, 6, 8),
      new THREE.MeshStandardMaterial({ color: 0xeaf0f5, roughness: 1 }));
    cap.position.set(x, 7.5, z);
    scene.add(cap);
    props.push(cap);
  }
  // boulders
  for (let i = 0; i < 14; i++) {
    const x = (rng()*2-1) * 30;
    const z = (rng()*2-1) * 30;
    const s = 1 + rng()*1.5;
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), stoneMat);
    b.position.set(x, s*0.7, z);
    scene.add(b);
    walls.push({ mesh: b, min: new THREE.Vector3(x-s, 0, z-s), max: new THREE.Vector3(x+s, s*1.5, z+s) });
  }

  // soft moonlight
  const amb = new THREE.AmbientLight(0x6a7a90, 0.6); scene.add(amb);
  const moon = new THREE.DirectionalLight(0xc8d8ee, 0.6);
  moon.position.set(20, 30, 10); scene.add(moon);
  lights.push(moon);

  // extraction
  const pad = new THREE.Mesh(
    new THREE.CircleGeometry(2.2, 48).rotateX(-Math.PI/2),
    new THREE.MeshStandardMaterial({ color: 0x6ae3ff, emissive: 0x6ae3ff, emissiveIntensity: 1.5 })
  );
  pad.position.set(30, 0.02, 30);
  scene.add(pad); props.push(pad);

  return {
    name: 'WHITE HOLLOW',
    walls, lights, props,
    extractionPos: new THREE.Vector3(30, 0, 30),
    preySpawn: new THREE.Vector3(-30, 0, -30),
    hunterSpawn: new THREE.Vector3(0, 0, 0),
    surfaces: () => 'snow',
    fogColor: 0xc4ccd8,
    fogNear: 6, fogFar: 28,
    skyColor: 0x9eaab9,
    bounds: { min: new THREE.Vector3(-39, 0, -39), max: new THREE.Vector3(39, 6, 39) },
  };
}

// ---------- Black Array ----------
function buildBlackArray(scene) {
  const walls = [];
  const lights = [];
  const props = [];

  const platMat = new THREE.MeshStandardMaterial({ color: 0x161a20, roughness: 0.4, metalness: 0.7 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0xff3b3b, emissive: 0xff3b3b, emissiveIntensity: 0.7 });
  const beamMat = new THREE.MeshStandardMaterial({ color: 0x0e1015, roughness: 0.4, metalness: 0.9 });

  // central platform
  const W = 40;
  const main = new THREE.Mesh(new THREE.BoxGeometry(W*2, 0.6, W*2), platMat);
  main.position.set(0, -0.3, 0);
  main.receiveShadow = true;
  scene.add(main);

  // grate pattern (decorative)
  for (let i = -36; i <= 36; i += 4) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(W*2, 0.12, 0.12), beamMat);
    beam.position.set(0, 0.07, i);
    scene.add(beam); props.push(beam);
  }

  // outer bounds (low rails)
  walls.push(makeWall(scene, 0, 2, -W, W*2, 4, 1, platMat));
  walls.push(makeWall(scene, 0, 2,  W, W*2, 4, 1, platMat));
  walls.push(makeWall(scene, -W, 2, 0, 1, 4, W*2, platMat));
  walls.push(makeWall(scene,  W, 2, 0, 1, 4, W*2, platMat));

  // industrial blocks
  const blocks = [
    [-15, 1.5, -15, 6, 3, 6],
    [ 15, 1.5,  15, 6, 3, 6],
    [-15, 1.5,  15, 4, 3, 8],
    [ 15, 1.5, -15, 4, 3, 8],
    [  0, 2,    0, 8, 4, 2],
    [  0, 2,    0, 2, 4, 8],
    [-25, 2.5, 0, 2, 5, 6],
    [ 25, 2.5, 0, 2, 5, 6],
  ];
  for (const b of blocks) {
    walls.push(makeWall(scene, b[0], b[1], b[2], b[3], b[4], b[5], platMat));
  }

  // accent strips
  for (let i = 0; i < 6; i++) {
    const a = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.05, 6), accentMat);
    a.position.set(-10 + i*4, 0.1, -10 + (i%2)*20);
    scene.add(a); props.push(a);
  }

  const amb = new THREE.AmbientLight(0x1a1f28, 0.5); scene.add(amb);
  const dir = new THREE.DirectionalLight(0xffffff, 0.4);
  dir.position.set(10, 20, 5); scene.add(dir);

  const lightSpots = [
    [-20, 5, -20, 0xff3b3b, 1.0, false],
    [ 20, 5,  20, 0xff3b3b, 1.0, false],
    [-20, 5,  20, 0x6ae3ff, 0.8, false],
    [ 20, 5, -20, 0x6ae3ff, 0.8, false],
  ];
  for (const ls of lightSpots) {
    const l = new THREE.PointLight(ls[3], ls[4], 22);
    l.position.set(ls[0], ls[1], ls[2]); scene.add(l); lights.push(l);
  }

  const pad = new THREE.Mesh(
    new THREE.CircleGeometry(2.2, 48).rotateX(-Math.PI/2),
    new THREE.MeshStandardMaterial({ color: 0x6ae3ff, emissive: 0x6ae3ff, emissiveIntensity: 1.6 })
  );
  pad.position.set(-30, 0.05, -30);
  scene.add(pad); props.push(pad);

  return {
    name: 'BLACK ARRAY',
    walls, lights, props,
    extractionPos: new THREE.Vector3(-30, 0, -30),
    preySpawn: new THREE.Vector3(30, 0, 30),
    hunterSpawn: new THREE.Vector3(0, 0, 0),
    surfaces: () => 'metal',
    fogColor: 0x05060a,
    fogNear: 10, fogFar: 40,
    skyColor: 0x02030a,
    bounds: { min: new THREE.Vector3(-39, 0, -39), max: new THREE.Vector3(39, 4, 39) },
  };
}

// deterministic RNG
function mulberry32(seed) {
  return function() {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
