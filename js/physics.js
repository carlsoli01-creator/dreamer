// Lightweight collision: cylinder-vs-AABB sliding for player movement.
import * as THREE from 'three';

export function moveAndSlide(pos, delta, radius, height, walls) {
  const next = pos.clone().add(delta);

  // try X then Z separately for sliding
  const tryAxis = (axis) => {
    const test = pos.clone();
    test[axis] = next[axis];
    if (collides(test, radius, height, walls)) return false;
    pos[axis] = test[axis];
    return true;
  };
  tryAxis('x');
  tryAxis('z');
  // Y handled separately if needed
}

export function collides(pos, radius, height, walls) {
  const minY = pos.y;
  const maxY = pos.y + height;
  for (const w of walls) {
    if (maxY < w.min.y || minY > w.max.y) continue;
    const cx = Math.max(w.min.x, Math.min(pos.x, w.max.x));
    const cz = Math.max(w.min.z, Math.min(pos.z, w.max.z));
    const dx = pos.x - cx, dz = pos.z - cz;
    if (dx*dx + dz*dz < radius * radius) return true;
  }
  return false;
}

// Raycast for line of sight (2D, ignores Y)
export function rayBlocked(from, to, walls) {
  const dx = to.x - from.x, dz = to.z - from.z;
  const dist = Math.sqrt(dx*dx + dz*dz);
  const steps = Math.max(2, Math.ceil(dist * 2));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const x = from.x + dx * t;
    const z = from.z + dz * t;
    for (const w of walls) {
      if (1.4 < w.min.y || 1.6 > w.max.y) continue;
      if (x >= w.min.x && x <= w.max.x && z >= w.min.z && z <= w.max.z) return true;
    }
  }
  return false;
}
