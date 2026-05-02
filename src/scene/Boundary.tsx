import { MapData } from '../types';

interface Props {
  map: MapData;
  centerOffset: [number, number];
}

// Renders the perimeter boundary based on the map's `boundary.positions` rectangles.
// Conventions follow the spec: each position has corner (x, z) and (width, depth) extent.
export default function Boundary({ map, centerOffset }: Props) {
  const [ox, oz] = centerOffset;
  const { palette, boundary } = map;
  const isForest = boundary.type === 'dense_forest_treeline';
  const isRail = boundary.type === 'platform_edge';

  return (
    <group>
      {boundary.positions.map((p, i) => {
        const cx = p.x + p.width / 2 - ox;
        const cz = p.z + p.depth / 2 - oz;
        const cy = boundary.height / 2;

        if (isForest) {
          // Forest treeline rendered as a procedural row of conical trees + dark base
          return (
            <group key={i}>
              <mesh position={[cx, 0.5, cz]}>
                <boxGeometry args={[p.width, 1, p.depth]} />
                <meshStandardMaterial color="#2a3024" roughness={0.95} />
              </mesh>
              <Treeline x={cx} z={cz} w={p.width} d={p.depth} />
            </group>
          );
        }

        if (isRail) {
          // Industrial railing — thin posts + horizontal bars
          const horizontal = p.width > p.depth;
          return (
            <group key={i}>
              {/* base toe board */}
              <mesh position={[cx, 0.1, cz]}>
                <boxGeometry args={[p.width, 0.2, p.depth]} />
                <meshStandardMaterial color="#0a0c10" metalness={0.7} roughness={0.4} />
              </mesh>
              {/* top rail */}
              <mesh position={[cx, boundary.height - 0.05, cz]}>
                <boxGeometry args={[
                  horizontal ? p.width : 0.08,
                  0.1,
                  horizontal ? 0.08 : p.depth,
                ]} />
                <meshStandardMaterial color="#ff3b3b" emissive="#ff3b3b" emissiveIntensity={0.4} />
              </mesh>
              {/* mid rail */}
              <mesh position={[cx, boundary.height / 2, cz]}>
                <boxGeometry args={[
                  horizontal ? p.width : 0.06,
                  0.06,
                  horizontal ? 0.06 : p.depth,
                ]} />
                <meshStandardMaterial color="#1a1d22" metalness={0.8} roughness={0.4} />
              </mesh>
              {/* posts */}
              {Array.from({ length: Math.max(2, Math.floor((horizontal ? p.width : p.depth) / 4)) }).map((_, j, arr) => {
                const t = arr.length === 1 ? 0.5 : j / (arr.length - 1);
                const px = horizontal ? cx - p.width / 2 + t * p.width : cx;
                const pz = horizontal ? cz : cz - p.depth / 2 + t * p.depth;
                return (
                  <mesh key={j} position={[px, boundary.height / 2, pz]}>
                    <boxGeometry args={[0.08, boundary.height, 0.08]} />
                    <meshStandardMaterial color="#0a0c10" metalness={0.8} roughness={0.4} />
                  </mesh>
                );
              })}
            </group>
          );
        }

        // Default concrete wall
        return (
          <mesh key={i} position={[cx, cy, cz]} castShadow receiveShadow>
            <boxGeometry args={[p.width, boundary.height, p.depth]} />
            <meshStandardMaterial color={palette.wall} roughness={0.92} metalness={0.05} />
          </mesh>
        );
      })}
    </group>
  );
}

function Treeline({ x, z, w, d }: { x: number; z: number; w: number; d: number }) {
  const horizontal = w > d;
  const length = horizontal ? w : d;
  const count = Math.max(4, Math.floor(length / 2.2));
  const trunks = [] as JSX.Element[];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const px = horizontal ? x - w / 2 + t * w : x + ((i % 2) - 0.5) * (d > 0 ? 1.2 : 0);
    const pz = horizontal ? z + ((i % 2) - 0.5) * (w > 0 ? 1.2 : 0) : z - d / 2 + t * d;
    const h = 9 + ((i * 13) % 7) * 0.6;
    trunks.push(
      <group key={i} position={[px, 0, pz]}>
        <mesh position={[0, h / 2, 0]}>
          <cylinderGeometry args={[0.25, 0.4, h, 8]} />
          <meshStandardMaterial color="#1a140e" roughness={0.95} />
        </mesh>
        <mesh position={[0, h * 0.7, 0]}>
          <coneGeometry args={[1.6, h * 0.9, 8]} />
          <meshStandardMaterial color="#eaf0f5" roughness={1} />
        </mesh>
      </group>
    );
  }
  return <>{trunks}</>;
}
