import { Building as BuildingT, MapData } from '../types';
import Room from './Room';

interface Props {
  building: BuildingT;
  centerOffset: [number, number];
  map: MapData;
}

export default function Building({ building, centerOffset, map }: Props) {
  const [ox, oz] = centerOffset;
  return (
    <group>
      {building.rooms.map((room, i) => (
        <Room key={`${building.id}-${i}`} room={room} centerOffset={centerOffset} map={map} />
      ))}

      {/* Stairwells visualised as a stepped slab */}
      {building.stairwells?.map((s, i) => (
        <Stair key={`stair-${i}`} x={s.position.x - ox} z={s.position.z - oz} floors={s.floors} width={s.width} />
      ))}

      {/* Ladders as a tall tube with rungs */}
      {building.ladders?.map((l, i) => (
        <Ladder key={`ladder-${i}`} x={l.position.x - ox} z={l.position.z - oz} floors={l.floors} />
      ))}

      {/* Building label floating above */}
      <BuildingLabel
        x={building.position.x - ox}
        z={building.position.z - oz}
        y={building.dimensions.height + 1.2}
        text={building.name}
      />
    </group>
  );
}

function Stair({ x, z, floors, width }: { x: number; z: number; floors: number[]; width: number }) {
  const FLOOR_H = 3.2;
  const stepCount = 8;
  const rise = FLOOR_H / stepCount;
  const minF = Math.min(...floors);
  const maxF = Math.max(...floors);
  const segments: JSX.Element[] = [];
  for (let f = minF; f < maxF; f++) {
    for (let s = 0; s < stepCount; s++) {
      const y = f * FLOOR_H + s * rise + rise / 2;
      const stepDepth = (width * 1.8) / stepCount;
      segments.push(
        <mesh key={`${f}-${s}`} position={[x, y, z - width * 0.9 + s * stepDepth]} castShadow>
          <boxGeometry args={[width, rise, stepDepth]} />
          <meshStandardMaterial color="#26292f" roughness={0.7} metalness={0.2} />
        </mesh>
      );
    }
  }
  return <>{segments}</>;
}

function Ladder({ x, z, floors }: { x: number; z: number; floors: number[] }) {
  const FLOOR_H = 3.2;
  const minF = Math.min(...floors);
  const maxF = Math.max(...floors);
  const totalH = (maxF - minF) * FLOOR_H;
  const rungs: JSX.Element[] = [];
  const rungCount = Math.floor(totalH / 0.4);
  for (let i = 0; i < rungCount; i++) {
    rungs.push(
      <mesh key={i} position={[x, minF * FLOOR_H + i * 0.4 + 0.2, z]}>
        <boxGeometry args={[0.5, 0.05, 0.06]} />
        <meshStandardMaterial color="#aaa" metalness={0.9} roughness={0.3} />
      </mesh>
    );
  }
  return (
    <group>
      {/* rails */}
      <mesh position={[x - 0.22, minF * FLOOR_H + totalH / 2, z]}>
        <boxGeometry args={[0.06, totalH, 0.06]} />
        <meshStandardMaterial color="#999" metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[x + 0.22, minF * FLOOR_H + totalH / 2, z]}>
        <boxGeometry args={[0.06, totalH, 0.06]} />
        <meshStandardMaterial color="#999" metalness={0.9} roughness={0.3} />
      </mesh>
      {rungs}
    </group>
  );
}

function BuildingLabel({ x, z, y, text }: { x: number; z: number; y: number; text: string }) {
  // simple floating sprite-like marker (text rendered via Html in Drei would be ideal,
  // but we keep dependencies minimal — render a small emissive disc + a bar).
  return (
    <group position={[x, y, z]}>
      <mesh>
        <sphereGeometry args={[0.18, 16, 8]} />
        <meshStandardMaterial color="#6ae3ff" emissive="#6ae3ff" emissiveIntensity={2} />
      </mesh>
      <mesh position={[0, -0.6, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 1.2, 8]} />
        <meshStandardMaterial color="#6ae3ff" emissive="#6ae3ff" emissiveIntensity={1.2} />
      </mesh>
    </group>
  );
}
