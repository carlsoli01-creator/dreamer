import * as THREE from 'three';
import { MapData } from '../types';

export interface AABB { min: THREE.Vector2; max: THREE.Vector2 }

const PAD = 0.4;

export function buildObstacles(map: MapData): AABB[] {
  const out: AABB[] = [];
  for (const b of map.buildings) {
    out.push({
      min: new THREE.Vector2(b.position.x - b.dimensions.width/2 - PAD, b.position.z - b.dimensions.depth/2 - PAD),
      max: new THREE.Vector2(b.position.x + b.dimensions.width/2 + PAD, b.position.z + b.dimensions.depth/2 + PAD),
    });
  }
  // boundary walls
  for (const w of map.boundary.positions) {
    out.push({
      min: new THREE.Vector2(w.x, w.z),
      max: new THREE.Vector2(w.x + w.width, w.z + w.depth),
    });
  }
  return out;
}

export function pointInAABB(x: number, z: number, a: AABB) {
  return x > a.min.x && x < a.max.x && z > a.min.y && z < a.max.y;
}

// Cylinder vs AABB sliding for player movement.
export function moveAndSlide(
  pos: { x: number; z: number },
  delta: { x: number; z: number },
  radius: number,
  obstacles: AABB[],
) {
  // try X
  const tryX = pos.x + delta.x;
  if (!collides(tryX, pos.z, radius, obstacles)) pos.x = tryX;
  // try Z
  const tryZ = pos.z + delta.z;
  if (!collides(pos.x, tryZ, radius, obstacles)) pos.z = tryZ;
}

export function collides(x: number, z: number, r: number, obstacles: AABB[]) {
  for (const a of obstacles) {
    const cx = Math.max(a.min.x, Math.min(x, a.max.x));
    const cz = Math.max(a.min.y, Math.min(z, a.max.y));
    const dx = x - cx, dz = z - cz;
    if (dx*dx + dz*dz < r*r) return true;
  }
  return false;
}

// Segment vs AABB blocked check
export function segmentBlocked(ax: number, az: number, bx: number, bz: number, obstacles: AABB[]) {
  for (const a of obstacles) {
    if (segmentAABB(ax, az, bx, bz, a)) return true;
  }
  return false;
}
function segmentAABB(ax: number, az: number, bx: number, bz: number, a: AABB) {
  if (pointInAABB(ax, az, a) || pointInAABB(bx, bz, a)) return true;
  const dx = bx - ax, dz = bz - az;
  let t0 = 0, t1 = 1;
  const test = (p: number, q: number) => {
    if (p === 0) return q >= 0;
    const r = q / p;
    if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; }
    else       { if (r < t0) return false; if (r < t1) t1 = r; }
    return true;
  };
  if (!test(-dx, ax - a.min.x)) return false;
  if (!test( dx, a.max.x - ax)) return false;
  if (!test(-dz, az - a.min.y)) return false;
  if (!test( dz, a.max.y - az)) return false;
  return true;
}

export function clampToBounds(pos: { x: number; z: number }, map: MapData, r: number) {
  pos.x = Math.max(r + 2, Math.min(map.size.width - r - 2, pos.x));
  pos.z = Math.max(r + 2, Math.min(map.size.depth - r - 2, pos.z));
}

// Snap an arbitrary spawn coordinate outwards until it's clear of all obstacles.
// Used at match init so player + AI never start inside a building footprint.
export function snapToOpen(x: number, z: number, r: number, obstacles: AABB[]) {
  if (!collides(x, z, r, obstacles)) return { x, z };
  // concentric ring search
  for (let radius = 1; radius <= 40; radius += 0.75) {
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const tx = x + Math.cos(a) * radius;
      const tz = z + Math.sin(a) * radius;
      if (!collides(tx, tz, r, obstacles)) return { x: tx, z: tz };
    }
  }
  return { x, z };
}
