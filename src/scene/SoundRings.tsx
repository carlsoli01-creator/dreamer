import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { FootstepEvent } from '../game/Player';

const POOL = 80;

interface Props { footstepsRef: React.MutableRefObject<FootstepEvent[]> }

export default function SoundRings({ footstepsRef }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const pool = useMemo(() => {
    const arr: THREE.Mesh[] = [];
    for (let i = 0; i < POOL; i++) {
      const g = new THREE.RingGeometry(0.4, 0.5, 32);
      g.rotateX(-Math.PI/2);
      const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(g, m);
      mesh.visible = false;
      arr.push(mesh);
    }
    return arr;
  }, []);

  useFrame(() => {
    const now = performance.now() / 1000;
    const fs = footstepsRef.current;
    for (let i = 0; i < pool.length; i++) {
      const m = pool[i];
      const f = fs[fs.length - 1 - i]; // newest first
      if (!f) { m.visible = false; continue; }
      const age = now - f.t;
      const life = 1.4 + f.loud;
      if (age > life) { m.visible = false; continue; }
      m.visible = true;
      m.position.set(f.x, 0.05, f.z);
      const k = age / life;
      const r = 0.5 + k * (3 + f.loud * 8);
      m.scale.set(r, r, r);
      const mat = m.material as THREE.MeshBasicMaterial;
      mat.color.set(f.emitter === 'ai' ? '#66ccff' : f.emitter === 'decoy' ? '#ffcc55' : '#ff2244');
      mat.opacity = (1 - k) * 0.55;
    }
  });

  return (
    <group ref={groupRef}>
      {pool.map((m, i) => <primitive key={i} object={m} />)}
    </group>
  );
}
