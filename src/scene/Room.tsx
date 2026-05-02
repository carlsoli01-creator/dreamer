import { Door, Room as RoomT, Side, MapData } from '../types';

const FLOOR_H = 3.2;
const WALL_T = 0.18;

interface Props {
  room: RoomT;
  centerOffset: [number, number];
  map: MapData;
}

const SURFACE_COLORS: Record<string, string> = {
  tile: '#3a3a40',
  raised_floor: '#2c3038',
  carpet: '#1f1a1c',
  metal_grating: '#1a1d22',
  metal_floor: '#2a2e36',
  metal_floor_with_padding: '#2a2326',
  metal_mesh: '#1a1d22',
  metal_containers: '#3a2a26',
  metal_deck: '#2a2e36',
  concrete: '#2a2e34',
  concrete_stairs: '#2a2e34',
  linoleum: '#3a3530',
  hardwood: '#2a1c14',
  asphalt: '#1a1c20',
  oil_stained_concrete: '#1f1d1a',
  wooden_planks: '#3a2a18',
  wooden_floor: '#3a2a18',
  wooden_stairs: '#2a1d10',
  ice: '#a0c8d8',
  snow: '#dde6ec',
  snow_over_gravel: '#c4ccd0',
  textured_metal: '#2a2e36',
  containment_deck: '#3a3530',
  cracked_asphalt: '#2a2c30',
  gravel: '#3a3630',
  packed_snow: '#d4dce4',
  deep_snow: '#e8eef4',
  non_slip_metal: '#26292f',
};

const LIGHT_PRESETS: Record<string, { color: string; intensity: number; flicker?: boolean }> = {
  flickering: { color: '#ffd0a0', intensity: 0.9, flicker: true },
  cyan_blink: { color: '#6ae3ff', intensity: 0.7, flicker: true },
  emergency: { color: '#ff5050', intensity: 1.0 },
  emergency_red: { color: '#ff3b3b', intensity: 1.2 },
  emergency_only: { color: '#ff5050', intensity: 0.5 },
  emergency_battery_powered: { color: '#aabbcc', intensity: 0.6 },
  amber: { color: '#ffaa55', intensity: 0.9 },
  natural: { color: '#cfd8e6', intensity: 0.6 },
  minimal: { color: '#88a0bb', intensity: 0.35 },
  dim: { color: '#aabbcc', intensity: 0.4 },
  dim_emergency: { color: '#ff7755', intensity: 0.5 },
  dark: { color: '#445566', intensity: 0.25 },
  shadow_heavy: { color: '#558899', intensity: 0.4 },
};

export default function Room({ room, centerOffset, map }: Props) {
  const [ox, oz] = centerOffset;
  const cx = room.position.x - ox;
  const cz = room.position.z - oz;
  const w = room.size.width;
  const d = room.size.depth;
  const yBase = room.floor * FLOOR_H;
  const surfaceColor = SURFACE_COLORS[room.soundSurface ?? 'concrete'] ?? '#2a2e34';
  const wallColor = map.palette.wall;

  const doorBySide: Record<Side, Door | undefined> = {
    north: room.doors?.find((dr) => dr.position === 'north'),
    south: room.doors?.find((dr) => dr.position === 'south'),
    east: room.doors?.find((dr) => dr.position === 'east'),
    west: room.doors?.find((dr) => dr.position === 'west'),
  };

  return (
    <group>
      {/* room floor */}
      <mesh position={[cx, yBase + 0.05, cz]} receiveShadow>
        <boxGeometry args={[w, 0.1, d]} />
        <meshStandardMaterial color={surfaceColor} roughness={0.85} metalness={0.08} />
      </mesh>

      {/* ceiling (skip for top-floor exposed rooms or open-roof platforms) */}
      {!room.exposed && (
        <mesh position={[cx, yBase + FLOOR_H - 0.05, cz]}>
          <boxGeometry args={[w, 0.1, d]} />
          <meshStandardMaterial color="#0a0c10" roughness={0.95} />
        </mesh>
      )}

      {/* walls with door cuts */}
      {/* North wall (negative Z side) */}
      <WallSide
        side="north"
        center={[cx, yBase + FLOOR_H / 2, cz - d / 2]}
        length={w}
        height={FLOOR_H}
        thickness={WALL_T}
        door={doorBySide.north}
        color={wallColor}
        horizontal
      />
      {/* South wall (+Z) */}
      <WallSide
        side="south"
        center={[cx, yBase + FLOOR_H / 2, cz + d / 2]}
        length={w}
        height={FLOOR_H}
        thickness={WALL_T}
        door={doorBySide.south}
        color={wallColor}
        horizontal
      />
      {/* West wall (-X) */}
      <WallSide
        side="west"
        center={[cx - w / 2, yBase + FLOOR_H / 2, cz]}
        length={d}
        height={FLOOR_H}
        thickness={WALL_T}
        door={doorBySide.west}
        color={wallColor}
        horizontal={false}
      />
      {/* East wall (+X) */}
      <WallSide
        side="east"
        center={[cx + w / 2, yBase + FLOOR_H / 2, cz]}
        length={d}
        height={FLOOR_H}
        thickness={WALL_T}
        door={doorBySide.east}
        color={wallColor}
        horizontal={false}
      />

      {/* room interior light (if specified) */}
      {room.lighting && LIGHT_PRESETS[room.lighting] && (
        <RoomLight
          position={[cx, yBase + FLOOR_H - 0.4, cz]}
          preset={LIGHT_PRESETS[room.lighting]}
        />
      )}

      {/* tactical highlight tile on floor */}
      {room.tacticalValue === 'very_high' && (
        <mesh position={[cx, yBase + 0.11, cz]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[Math.min(w, d) * 0.25, Math.min(w, d) * 0.28, 48]} />
          <meshBasicMaterial color="#6ae3ff" transparent opacity={0.35} />
        </mesh>
      )}

      {/* simple feature props for visual richness */}
      <Features room={room} cx={cx} cz={cz} yBase={yBase} />
    </group>
  );
}

function WallSide({
  center, length, height, thickness, door, color, horizontal,
}: {
  side: Side;
  center: [number, number, number];
  length: number;
  height: number;
  thickness: number;
  door?: Door;
  color: string;
  horizontal: boolean;
}) {
  const [cx, cy, cz] = center;
  const segments: Array<{ pos: [number, number, number]; size: [number, number, number]; isLintel?: boolean }> = [];

  if (!door) {
    segments.push({
      pos: [cx, cy, cz],
      size: horizontal ? [length, height, thickness] : [thickness, height, length],
    });
  } else {
    const dw = Math.max(0.5, Math.min(door.width, length - 0.2));
    const segLen = (length - dw) / 2;
    const lintelH = Math.max(0.3, height * 0.25);
    if (horizontal) {
      // left segment
      segments.push({
        pos: [cx - length / 2 + segLen / 2, cy, cz],
        size: [segLen, height, thickness],
      });
      // right segment
      segments.push({
        pos: [cx + length / 2 - segLen / 2, cy, cz],
        size: [segLen, height, thickness],
      });
      // lintel above door
      segments.push({
        pos: [cx, cy + height / 2 - lintelH / 2, cz],
        size: [dw, lintelH, thickness],
        isLintel: true,
      });
    } else {
      segments.push({
        pos: [cx, cy, cz - length / 2 + segLen / 2],
        size: [thickness, height, segLen],
      });
      segments.push({
        pos: [cx, cy, cz + length / 2 - segLen / 2],
        size: [thickness, height, segLen],
      });
      segments.push({
        pos: [cx, cy + height / 2 - lintelH / 2, cz],
        size: [thickness, lintelH, dw],
        isLintel: true,
      });
    }
  }

  return (
    <group>
      {segments.map((s, i) => (
        <mesh key={i} position={s.pos} castShadow receiveShadow>
          <boxGeometry args={s.size} />
          <meshStandardMaterial color={s.isLintel ? '#0a0c10' : color} roughness={0.85} metalness={0.08} />
        </mesh>
      ))}
    </group>
  );
}

function RoomLight({ position, preset }: { position: [number, number, number]; preset: typeof LIGHT_PRESETS[string] }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.5, 0.1, 0.5]} />
        <meshStandardMaterial color="#0a0c10" emissive={preset.color} emissiveIntensity={0.8} />
      </mesh>
      <pointLight color={preset.color} intensity={preset.intensity * 0.9} distance={14} decay={1.6} />
    </group>
  );
}

function Features({ room, cx, cz, yBase }: { room: RoomT; cx: number; cz: number; yBase: number }) {
  const features = room.features ?? [];
  const props: JSX.Element[] = [];
  const seed = (room.name.length * 7 + room.position.x * 3) % 1000;
  const rand = mulberry(seed);

  features.forEach((f, i) => {
    const px = cx + (rand() - 0.5) * room.size.width * 0.55;
    const pz = cz + (rand() - 0.5) * room.size.depth * 0.55;
    if (f.includes('desk') || f.includes('table') || f.includes('console')) {
      props.push(
        <mesh key={i} position={[px, yBase + 0.5, pz]} castShadow>
          <boxGeometry args={[1.4, 0.9, 0.7]} />
          <meshStandardMaterial color="#1a1c20" roughness={0.6} metalness={0.3} />
        </mesh>
      );
    } else if (f.includes('locker') || f.includes('cabinet') || f.includes('shelv') || f.includes('rack')) {
      props.push(
        <mesh key={i} position={[px, yBase + 1.0, pz]} castShadow>
          <boxGeometry args={[0.8, 2.0, 0.5]} />
          <meshStandardMaterial color="#161a20" metalness={0.6} roughness={0.5} />
        </mesh>
      );
    } else if (f.includes('bed') || f.includes('bunk')) {
      props.push(
        <mesh key={i} position={[px, yBase + 0.4, pz]} castShadow>
          <boxGeometry args={[2, 0.5, 1]} />
          <meshStandardMaterial color="#3a2820" roughness={0.85} />
        </mesh>
      );
    } else if (f.includes('container') || f.includes('crate') || f.includes('drum')) {
      props.push(
        <mesh key={i} position={[px, yBase + 0.6, pz]} castShadow>
          <boxGeometry args={[1.0, 1.2, 1.0]} />
          <meshStandardMaterial color="#3a2418" roughness={0.7} />
        </mesh>
      );
    } else if (f.includes('generator') || f.includes('drill') || f.includes('apparatus') || f.includes('antenna')) {
      props.push(
        <group key={i} position={[px, yBase, pz]}>
          <mesh position={[0, 1, 0]} castShadow>
            <boxGeometry args={[2.4, 2, 1.4]} />
            <meshStandardMaterial color="#0e1015" metalness={0.8} roughness={0.4} />
          </mesh>
          <mesh position={[0, 2.5, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.3, 3, 12]} />
            <meshStandardMaterial color="#1a1d22" metalness={0.85} roughness={0.4} />
          </mesh>
        </group>
      );
    } else if (f.includes('fireplace')) {
      props.push(
        <mesh key={i} position={[px, yBase + 1.2, pz]} castShadow>
          <boxGeometry args={[2.5, 2.4, 1]} />
          <meshStandardMaterial color="#444" roughness={0.95} />
        </mesh>
      );
    } else if (f.includes('window')) {
      // skip — handled by exposed flag at room level
    }
  });

  return <>{props}</>;
}

// tiny seedable RNG
function mulberry(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
