import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Mesh } from 'three';
import { ExtractionZone, SoundTrap, SpawnPoints } from '../types';

interface ExtractProps { zone: ExtractionZone; centerOffset: [number, number] }
export function ExtractionMarker({ zone, centerOffset }: ExtractProps) {
  const [ox, oz] = centerOffset;
  const cx = zone.position.x - ox;
  const cz = zone.position.z - oz;
  const ringRef = useRef<Mesh>(null);
  const beamRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ringRef.current) {
      const k = (t * 0.6) % 1;
      const s = 1 + k * 1.6;
      ringRef.current.scale.set(s, 1, s);
      const mat = ringRef.current.material as any;
      mat.opacity = (1 - k) * 0.7;
    }
    if (beamRef.current) {
      beamRef.current.rotation.y = t * 0.4;
    }
  });

  const isPrimary = zone.type === 'primary';
  const color = isPrimary ? '#6ae3ff' : '#5fffa6';

  return (
    <group position={[cx, 0, cz]}>
      {/* base disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]}>
        <circleGeometry args={[zone.radius, 48]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.4} transparent opacity={0.85} />
      </mesh>
      {/* ring outline */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.09, 0]}>
        <ringGeometry args={[zone.radius, zone.radius + 0.4, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </mesh>
      {/* expanding pulse */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
        <ringGeometry args={[zone.radius - 0.1, zone.radius + 0.1, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} />
      </mesh>
      {/* upward beam */}
      <mesh ref={beamRef} position={[0, 6, 0]}>
        <cylinderGeometry args={[0.06, 0.18, 12, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} />
      </mesh>
      <pointLight color={color} intensity={1.4} distance={zone.radius * 6} />
    </group>
  );
}

interface SpawnProps { spawns: SpawnPoints; centerOffset: [number, number] }
export function SpawnMarkers({ spawns, centerOffset }: SpawnProps) {
  const [ox, oz] = centerOffset;
  const items: { pos: [number, number]; color: string; label: string }[] = [
    { pos: [spawns.prey.x - ox, spawns.prey.z - oz], color: '#ff3b3b', label: 'P' },
    { pos: [spawns.hunter.x - ox, spawns.hunter.z - oz], color: '#6ae3ff', label: 'H' },
  ];

  return (
    <>
      {items.map((it, i) => (
        <group key={i} position={[it.pos[0], 0, it.pos[1]]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
            <ringGeometry args={[1, 1.2, 32]} />
            <meshBasicMaterial color={it.color} transparent opacity={0.9} />
          </mesh>
          <mesh position={[0, 1.2, 0]}>
            <coneGeometry args={[0.4, 1.4, 4]} />
            <meshStandardMaterial color={it.color} emissive={it.color} emissiveIntensity={1.0} transparent opacity={0.85} />
          </mesh>
        </group>
      ))}
    </>
  );
}

interface TrapProps { trap: SoundTrap; centerOffset: [number, number] }
export function SoundTrapMarker({ trap, centerOffset }: TrapProps) {
  const [ox, oz] = centerOffset;
  const cx = trap.position.x - ox;
  const cz = trap.position.z - oz;
  return (
    <group position={[cx, 0, cz]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]}>
        <circleGeometry args={[trap.radius, 32]} />
        <meshBasicMaterial color="#ffcc55" transparent opacity={0.18} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <ringGeometry args={[trap.radius - 0.1, trap.radius, 48]} />
        <meshBasicMaterial color="#ffcc55" transparent opacity={0.7} />
      </mesh>
      {/* small amber drum */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.7, 12]} />
        <meshStandardMaterial color="#ffcc55" emissive="#ffaa33" emissiveIntensity={0.5} metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  );
}
