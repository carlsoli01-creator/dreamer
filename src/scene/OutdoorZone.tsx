import { OutdoorZone as OutdoorZoneT, MapData } from '../types';

const SURFACE_COLORS: Record<string, string> = {
  cracked_asphalt: '#262830',
  gravel: '#3a3630',
  asphalt: '#1a1c20',
  deep_snow: '#eaf0f4',
  ice: '#a8d0e4',
  packed_snow: '#d4dce4',
  non_slip_metal: '#26292f',
  metal_grating: '#1a1d22',
  containment_deck: '#3a3530',
  snow_over_gravel: '#c4ccd0',
};

interface Props {
  zone: OutdoorZoneT;
  centerOffset: [number, number];
  map: MapData;
}

export default function OutdoorZone({ zone, centerOffset, map }: Props) {
  const [ox, oz] = centerOffset;
  const cx = zone.position.x - ox;
  const cz = zone.position.z - oz;
  const w = zone.size.width;
  const d = zone.size.depth;
  const surfaceColor = SURFACE_COLORS[zone.surface] ?? '#222';

  return (
    <group>
      {/* surface patch */}
      <mesh position={[cx, 0.06, cz]} receiveShadow>
        <boxGeometry args={[w, 0.06, d]} />
        <meshStandardMaterial color={surfaceColor} roughness={0.95} metalness={0.05} />
      </mesh>

      {/* hazard tint */}
      {zone.hazard && (
        <mesh position={[cx, 0.085, cz]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[Math.min(w, d) * 0.45, Math.min(w, d) * 0.5, 64]} />
          <meshBasicMaterial color="#ffcc55" transparent opacity={0.25} />
        </mesh>
      )}

      {/* feature scatter — trees, vehicles, drums, fences */}
      <ZoneFeatures zone={zone} cx={cx} cz={cz} />

      {/* outdoor light if specified */}
      {zone.lighting?.includes('flood') && (
        <pointLight position={[cx, 8, cz]} color="#fff4d0" intensity={1.0} distance={26} decay={1.6} castShadow />
      )}
      {zone.lighting?.includes('spotlight') && (
        <spotLight position={[cx + 4, 8, cz + 4]} target-position={[cx, 0, cz]} angle={0.9} penumbra={0.4} color="#ffeed0" intensity={1.2} distance={30} decay={1.6} />
      )}
      {zone.lighting?.includes('streetlight') && (
        <pointLight position={[cx, 5, cz]} color="#fff0c8" intensity={0.6} distance={16} />
      )}
      {zone.lighting?.includes('caution_yellow') && (
        <pointLight position={[cx, 4, cz]} color="#ffaa33" intensity={0.8} distance={14} />
      )}
      {zone.lighting?.includes('moonlight') && (
        <pointLight position={[cx, 14, cz]} color="#c8d8ee" intensity={0.4} distance={28} />
      )}
    </group>
  );
}

function ZoneFeatures({ zone, cx, cz }: { zone: OutdoorZoneT; cx: number; cz: number }) {
  const props: JSX.Element[] = [];
  const seed = (zone.name.length * 11 + zone.position.x * 5) | 0;
  const rand = mulberry(seed);
  const { width: w, depth: d } = zone.size;

  (zone.features ?? []).forEach((f, i) => {
    const px = cx + (rand() - 0.5) * w * 0.7;
    const pz = cz + (rand() - 0.5) * d * 0.7;

    if (f.includes('tree') || f.includes('pine')) {
      // pine tree
      const h = 5 + rand() * 3;
      props.push(
        <group key={i} position={[px, 0, pz]}>
          <mesh position={[0, h / 2, 0]}>
            <cylinderGeometry args={[0.18, 0.3, h, 8]} />
            <meshStandardMaterial color="#1a140e" roughness={0.95} />
          </mesh>
          <mesh position={[0, h * 0.65, 0]}>
            <coneGeometry args={[1.4, h * 0.85, 8]} />
            <meshStandardMaterial color="#eaf0f5" roughness={1} />
          </mesh>
        </group>
      );
    } else if (f.includes('log') || f.includes('fallen_logs')) {
      props.push(
        <mesh key={i} position={[px, 0.3, pz]} rotation={[0, rand() * Math.PI, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 3, 10]} />
          <meshStandardMaterial color="#3a2a1c" roughness={0.95} />
        </mesh>
      );
    } else if (f.includes('vehicle') || f.includes('truck') || f.includes('snow_plow') || f.includes('snowmobile')) {
      props.push(
        <group key={i} position={[px, 0, pz]} rotation={[0, rand() * Math.PI, 0]}>
          <mesh position={[0, 0.7, 0]} castShadow>
            <boxGeometry args={[3, 1.4, 1.6]} />
            <meshStandardMaterial color="#26292f" metalness={0.5} roughness={0.6} />
          </mesh>
          <mesh position={[0, 1.4, -0.2]} castShadow>
            <boxGeometry args={[1.6, 1, 1.4]} />
            <meshStandardMaterial color="#1a1d22" metalness={0.4} roughness={0.6} />
          </mesh>
        </group>
      );
    } else if (f.includes('drum') || f.includes('fuel_tank') || f.includes('chemical_drum')) {
      props.push(
        <mesh key={i} position={[px, 0.55, pz]} castShadow>
          <cylinderGeometry args={[0.5, 0.5, 1.1, 16]} />
          <meshStandardMaterial color="#5a4220" roughness={0.6} metalness={0.4} />
        </mesh>
      );
    } else if (f.includes('fence') || f.includes('railing')) {
      props.push(
        <mesh key={i} position={[px, 1, pz]}>
          <boxGeometry args={[3, 2, 0.06]} />
          <meshStandardMaterial color="#3a3a3a" metalness={0.7} roughness={0.4} wireframe={false} transparent opacity={0.7} />
        </mesh>
      );
    } else if (f.includes('planter')) {
      props.push(
        <mesh key={i} position={[px, 0.4, pz]} castShadow>
          <boxGeometry args={[1.4, 0.8, 1.4]} />
          <meshStandardMaterial color="#3a3530" roughness={0.95} />
        </mesh>
      );
    } else if (f.includes('fountain')) {
      props.push(
        <mesh key={i} position={[px, 0.5, pz]} castShadow>
          <cylinderGeometry args={[1.4, 1.6, 1, 24]} />
          <meshStandardMaterial color="#444" roughness={0.85} />
        </mesh>
      );
    } else if (f.includes('bench')) {
      props.push(
        <mesh key={i} position={[px, 0.4, pz]} castShadow>
          <boxGeometry args={[1.6, 0.1, 0.4]} />
          <meshStandardMaterial color="#5a4a30" roughness={0.85} />
        </mesh>
      );
    } else if (f.includes('pallet')) {
      props.push(
        <mesh key={i} position={[px, 0.1, pz]} castShadow>
          <boxGeometry args={[1.2, 0.2, 1.2]} />
          <meshStandardMaterial color="#5a4220" roughness={0.95} />
        </mesh>
      );
    } else if (f.includes('pipe')) {
      props.push(
        <mesh key={i} position={[px, 0.4, pz]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.18, 0.18, 4, 12]} />
          <meshStandardMaterial color="#3a3a3a" metalness={0.85} roughness={0.4} />
        </mesh>
      );
    } else if (f.includes('valve_station') || f.includes('weather_instrument')) {
      props.push(
        <mesh key={i} position={[px, 0.5, pz]} castShadow>
          <cylinderGeometry args={[0.4, 0.5, 1, 12]} />
          <meshStandardMaterial color="#1a1d22" metalness={0.7} roughness={0.4} />
        </mesh>
      );
    } else if (f.includes('shack')) {
      props.push(
        <mesh key={i} position={[px, 1, pz]} castShadow>
          <boxGeometry args={[2.5, 2, 2.5]} />
          <meshStandardMaterial color="#3a2a18" roughness={0.95} />
        </mesh>
      );
    }
  });

  return <>{props}</>;
}

function mulberry(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
