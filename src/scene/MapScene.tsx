import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { Suspense, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { MapData } from '../types';
import Boundary from './Boundary';
import Building from './Building';
import OutdoorZone from './OutdoorZone';
import { ExtractionMarker, SoundTrapMarker, SpawnMarkers } from './Markers';
import Agents, { NPCStateView } from './Agents';

interface Props { map: MapData; onState?: (s: NPCStateView) => void }

export default function MapScene({ map, onState }: Props) {
  const centerOffset: [number, number] = [map.size.width/2, map.size.depth/2];
  const camDist = Math.max(map.size.width, map.size.depth) * 0.85;

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ position: [camDist*0.7, camDist*0.55, camDist*0.7], fov: 45, near: 0.1, far: 800 }}
    >
      <color attach="background" args={[map.palette.sky]} />
      <fog attach="fog" args={[map.palette.fog, map.palette.fogNear*1.4, map.palette.fogFar*1.6]} />

      <mesh rotation={[-Math.PI/2,0,0]} position={[0,-0.01,0]} receiveShadow>
        <planeGeometry args={[map.size.width*4, map.size.depth*4]} />
        <meshStandardMaterial color={map.palette.ground} roughness={0.95} metalness={0.04} />
      </mesh>
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,0,0]} receiveShadow>
        <planeGeometry args={[map.size.width, map.size.depth]} />
        <meshStandardMaterial color={map.palette.ground} roughness={0.9} />
      </mesh>

      <Suspense fallback={null}>
        <Boundary map={map} centerOffset={centerOffset} />
        {map.outdoorZones.map((z, i) => <OutdoorZone key={`z-${i}`} zone={z} centerOffset={centerOffset} map={map} />)}
        {map.buildings.map(b => <Building key={b.id} building={b} centerOffset={centerOffset} map={map} />)}
        <SpawnMarkers spawns={map.spawnPoints} centerOffset={centerOffset} />
        {map.extractionZones.map((e, i) => <ExtractionMarker key={`e-${i}`} zone={e} centerOffset={centerOffset} />)}
        {map.soundTraps?.map((t, i) => <SoundTrapMarker key={`t-${i}`} trap={t} centerOffset={centerOffset} />)}

        <Agents map={map} centerOffset={centerOffset} onState={onState} />
      </Suspense>

      <Lighting map={map} />

      {map.id === 'white_hollow' && <Snowfall />}
      {map.id === 'black_array' && <Stars radius={300} depth={80} count={2000} factor={4} fade speed={0.4} />}

      <OrbitControls target={[0, 4, 0]} enableDamping dampingFactor={0.08}
        maxPolarAngle={Math.PI/2 - 0.05} minDistance={10} maxDistance={camDist*1.6} />
    </Canvas>
  );
}

function Lighting({ map }: { map: MapData }) {
  const isSnow = map.id === 'white_hollow';
  const isPlatform = map.id === 'black_array';
  return (
    <>
      <ambientLight intensity={isSnow ? 0.55 : 0.35} color={isSnow ? '#9eaab9' : '#1a2030'} />
      <hemisphereLight args={[ isSnow?'#cad3df':'#3a4858', isPlatform?'#020202':'#080808', isSnow?0.7:0.45 ]} />
      <directionalLight
        position={isSnow ? [40,60,-20] : [60,80,40]}
        intensity={isSnow ? 0.7 : 0.5}
        color={isSnow ? '#dfe8f0' : '#ffe6c0'}
        castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048}
        shadow-camera-near={1} shadow-camera-far={300}
        shadow-camera-left={-100} shadow-camera-right={100}
        shadow-camera-top={100} shadow-camera-bottom={-100} />
    </>
  );
}

function Snowfall() {
  const ref = useRef<THREE.Points>(null);
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const N = 1500, p = new Float32Array(N*3);
    for (let i=0;i<N;i++){ p[i*3]=(Math.random()-0.5)*240; p[i*3+1]=Math.random()*60; p[i*3+2]=(Math.random()-0.5)*240; }
    g.setAttribute('position', new THREE.BufferAttribute(p,3));
    return g;
  }, []);
  useFrame((_, dt) => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i=0;i<pos.count;i++){ let y = pos.getY(i); y -= 4*dt; if (y<0) y=60; pos.setY(i,y); }
    pos.needsUpdate = true;
  });
  return (<points ref={ref} geometry={geom}>
    <pointsMaterial color="#ffffff" size={0.18} transparent opacity={0.85} sizeAttenuation />
  </points>);
}
