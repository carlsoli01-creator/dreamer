import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { MapData } from '../types';
import { NOISLESS_MAPS } from '../data/maps';
import { useGame } from '../store';
import { AVATARS } from '../data/avatars';
import { abilitiesFor } from '../data/abilities';
import { audio } from '../audio/engine';
import Boundary from './Boundary';
import Building from './Building';
import OutdoorZone from './OutdoorZone';
import { ExtractionMarker, SoundTrapMarker, SpawnMarkers } from './Markers';
import PlayerAvatar from './PlayerAvatar';
import SoundRings from './SoundRings';
import { Player, FootstepEvent } from '../game/Player';
import { AI } from '../game/AI';
import { buildObstacles, segmentBlocked, snapToOpen } from '../game/physics';

export interface RuntimeStateView {
  remaining: number;
  detected: boolean;
  detection: number;
  abilities: { id: string; ready: number; cooldown: number; active: number; duration?: number; key: string; short: string; color: string; name: string }[];
  preyPos: { x: number; z: number };
  hunterPos: { x: number; z: number };
  playerHP: number;
  closestExtractionDist: number;
  silence: number;
}

interface Props {
  paused: boolean;
  onState: (s: RuntimeStateView) => void;
  onEnd: (outcome: 'victory'|'defeat'|'timeout', reason: string, stats: { detections:number; abilitiesUsed:number; soundEmitted:number; timeSec:number }) => void;
}

const MATCH_LENGTH = 180; // seconds

export default function GameScene(props: Props) {
  const { mapId, role, avatarId, settings } = useGame();
  const map = NOISLESS_MAPS[mapId];

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ fov: settings.fov, near: 0.05, far: 500, position: [0, 4, 0] }}
    >
      <color attach="background" args={[map.palette.sky]} />
      <fog attach="fog" args={[map.palette.fog, map.palette.fogNear * 1.4, map.palette.fogFar * 1.6]} />
      <Suspense fallback={null}>
        <SceneInner map={map} role={role} avatarId={avatarId} settings={settings} {...props} />
      </Suspense>
    </Canvas>
  );
}

function SceneInner({ map, role, avatarId, settings, paused, onState, onEnd }:
  Props & { map: MapData; role: 'prey'|'hunter'; avatarId: string; settings: any }) {

  const { camera, gl } = useThree();
  const centerOffset: [number, number] = [map.size.width/2, map.size.depth/2];

  const obstacles = useMemo(() => buildObstacles(map), [map]);
  const avatar = AVATARS[avatarId as keyof typeof AVATARS];
  const abilities = abilitiesFor(role);
  const footsteps = useRef<FootstepEvent[]>([]);
  const silenceTraps = useRef<{x:number;z:number;r:number; until:number}[]>([]);
  const decoys = useRef<{x:number;z:number; until:number; nextStep:number}[]>([]);

  // Build player + AI — snap both spawns out of any building footprint.
  const player = useMemo(() => {
    const raw = role === 'prey' ? map.spawnPoints.prey : map.spawnPoints.hunter;
    const sp = snapToOpen(raw.x, raw.z, 0.5, obstacles);
    const p = new Player(role, sp);
    if (avatar.id === 'p_runner')  { p.speedMul = 1.06; }
    if (avatar.id === 'p_phantom') { p.silentBoost = 2; p.loudnessMul = 0.8; }
    if (avatar.id === 'h_stalker') { p.chaseMul = 1.15; p.speedMul = 1.05; }
    if (avatar.id === 'h_warden')  { p.hearingMul = 1.25; }
    return p;
  }, [map.id, role, avatarId, obstacles]);

  const ai = useMemo(() => {
    const oppRole = role === 'prey' ? 'hunter' : 'prey';
    const a = new AI(oppRole, map, settings.botSkill);
    const raw = oppRole === 'hunter' ? map.spawnPoints.hunter : map.spawnPoints.prey;
    const sp = snapToOpen(raw.x, raw.z, 0.5, obstacles);
    a.pos.set(sp.x, 0, sp.z);
    return a;
  }, [map.id, role, settings.botSkill, obstacles]);

  // Input state
  const input = useRef({
    fwd: 0, strafe: 0, sprint: false, crouch: false,
    yaw: 0, pitch: 0,
  });
  const keys = useRef<Set<string>>(new Set());
  const locked = useRef(false);

  // mesh refs
  const playerMesh = useRef<THREE.Group>(null);
  const aiMesh = useRef<THREE.Group>(null);
  const visionConeRef = useRef<THREE.Mesh>(null);

  // game timing
  const startedRef = useRef(performance.now() / 1000);
  const stats = useRef({ detections: 0, abilitiesUsed: 0, soundEmitted: 0 });
  const ended = useRef(false);

  // ------ Pointer lock + mouse + keys ------
  useEffect(() => {
    audio.init(); audio.resume();
    audio.startAmbient(map.id);
    audio.setVolume(settings.volume);
    return () => { audio.stopAmbient(); };
  }, [map.id]);

  useEffect(() => { audio.setVolume(settings.volume); }, [settings.volume]);

  useEffect(() => {
    const canvas = gl.domElement;
    const onClick = () => {
      if (!paused && !locked.current) canvas.requestPointerLock();
    };
    const onLockChange = () => { locked.current = document.pointerLockElement === canvas; };
    const onMove = (e: MouseEvent) => {
      if (!locked.current || paused) return;
      const sens = settings.sensitivity * 0.0022;
      input.current.yaw   -= e.movementX * sens;
      input.current.pitch -= e.movementY * sens * (settings.invertY ? -1 : 1);
      input.current.pitch = Math.max(-1.2, Math.min(1.2, input.current.pitch));
    };
    canvas.addEventListener('click', onClick);
    document.addEventListener('pointerlockchange', onLockChange);
    document.addEventListener('mousemove', onMove);
    return () => {
      canvas.removeEventListener('click', onClick);
      document.removeEventListener('pointerlockchange', onLockChange);
      document.removeEventListener('mousemove', onMove);
    };
  }, [gl, paused, settings.sensitivity, settings.invertY]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current.add(e.code);
      if (paused) return;
      if (e.code === 'Digit1' || e.code === 'Digit2' || e.code === 'Digit3') {
        const idx = parseInt(e.code.slice(-1)) - 1;
        const a = abilities[idx];
        if (a) {
          const t = performance.now() / 1000;
          if (player.tryAbility(a.id, a.cooldown, a.duration ?? 0, t)) {
            stats.current.abilitiesUsed++;
            audio.confirm();
            // side effects
            if (a.id === 'decoy') {
              const dir = new THREE.Vector3(-Math.sin(input.current.yaw), 0, -Math.cos(input.current.yaw));
              const dx = player.pos.x + dir.x * 7;
              const dz = player.pos.z + dir.z * 7;
              decoys.current.push({ x: dx, z: dz, until: t + (a.duration ?? 6), nextStep: t + 0.2 });
            }
            if (a.id === 'silence_trap') {
              silenceTraps.current.push({ x: player.pos.x, z: player.pos.z, r: 5, until: t + (a.duration ?? 30) });
            }
            if (a.id === 'echo_pulse') {
              audio.pulse({ x: player.pos.x, y: 0, z: player.pos.z }, 220, 1, 'sine');
            }
            if (a.id === 'resonance_scan') {
              audio.pulse({ x: player.pos.x, y: 0, z: player.pos.z }, 880, 0.7, 'triangle');
            }
            if (a.id === 'phase_fade' || a.id === 'ghost_step') {
              audio.pulse({ x: player.pos.x, y: 0, z: player.pos.z }, 660, 0.4, 'sine');
            }
          }
        }
      }
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.code);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [paused, abilities, player]);

  // Reset start time
  useEffect(() => {
    startedRef.current = performance.now() / 1000;
    ended.current = false;
    stats.current = { detections: 0, abilitiesUsed: 0, soundEmitted: 0 };
  }, []);

  // ------ Game loop ------
  useFrame((_, dtRaw) => {
    if (paused || ended.current) return;
    const dt = Math.min(dtRaw, 0.05);
    const t = performance.now() / 1000;

    // input vector from keys
    let fwd = 0, strafe = 0;
    if (keys.current.has('KeyW')) fwd += 1;
    if (keys.current.has('KeyS')) fwd -= 1;
    if (keys.current.has('KeyA')) strafe -= 1;
    if (keys.current.has('KeyD')) strafe += 1;
    input.current.fwd = fwd;
    input.current.strafe = strafe;
    input.current.sprint = keys.current.has('ShiftLeft') || keys.current.has('ShiftRight');
    input.current.crouch = keys.current.has('ControlLeft') || keys.current.has('KeyC');

    // Update player
    const surf = map.id === 'white_hollow' ? 'snow' : map.id === 'black_array' ? 'metal' : 'concrete';
    const before = footsteps.current.length;
    player.update(dt, input.current, obstacles, map, footsteps.current, surf);
    if (footsteps.current.length > before) stats.current.soundEmitted++;

    // expire decoys + silence traps
    decoys.current = decoys.current.filter(d => t < d.until);
    silenceTraps.current = silenceTraps.current.filter(s => t < s.until);

    // decoys emit sound
    for (const d of decoys.current) {
      if (t >= d.nextStep) {
        d.nextStep = t + 0.4;
        footsteps.current.push({ x: d.x, z: d.z, t, emitter: 'decoy', loud: 0.55 });
        if (footsteps.current.length > 80) footsteps.current.shift();
        audio.footstep({ x: d.x, y: 0, z: d.z }, surf, 0.55);
      }
    }

    const playerSilent = t < player.silentUntil;
    const playerFaded = t < player.fadedUntil;

    // Update AI
    ai.update(dt, t, player.pos, playerSilent, playerFaded, obstacles, map,
              footsteps.current, silenceTraps.current);

    // Camera
    if (role === 'prey') {
      // 3rd person over shoulder
      const distance = 4.0;
      const height = 2.4 + input.current.pitch * 1.4;
      const cx = player.pos.x + Math.sin(input.current.yaw) * distance;
      const cz = player.pos.z + Math.cos(input.current.yaw) * distance;
      camera.position.set(cx, height, cz);
      camera.lookAt(
        player.pos.x - Math.sin(input.current.yaw) * 0.6,
        1.4 + input.current.pitch * 1.2,
        player.pos.z - Math.cos(input.current.yaw) * 0.6
      );
    } else {
      // first person
      camera.position.set(player.pos.x, 1.65, player.pos.z);
      const lx = player.pos.x - Math.sin(input.current.yaw) * Math.cos(input.current.pitch);
      const ly = 1.65 + Math.sin(input.current.pitch);
      const lz = player.pos.z - Math.cos(input.current.yaw) * Math.cos(input.current.pitch);
      camera.lookAt(lx, ly, lz);
    }

    // audio listener
    audio.setListener({ x: player.pos.x, y: 0, z: player.pos.z }, input.current.yaw);

    // mesh transforms
    if (playerMesh.current) {
      playerMesh.current.position.set(player.pos.x, 0, player.pos.z);
      playerMesh.current.rotation.y = input.current.yaw + Math.PI;
      playerMesh.current.visible = role === 'prey';
    }
    if (aiMesh.current) {
      aiMesh.current.position.set(ai.pos.x, 0, ai.pos.z);
      aiMesh.current.rotation.y = ai.yaw + Math.PI;
    }

    // hunter vision cone visualization (only if AI is hunter)
    if (visionConeRef.current && ai.role === 'hunter') {
      visionConeRef.current.position.set(ai.pos.x, 0.15, ai.pos.z);
      visionConeRef.current.rotation.y = ai.yaw;
      const inFov = ai.inVisionCone(player.pos, obstacles);
      const dist = Math.hypot(ai.pos.x - player.pos.x, ai.pos.z - player.pos.z);
      const detected = inFov && dist < ai.visionRange && !playerFaded;
      const mat = visionConeRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = detected ? 0.34 : (ai.mode === 'investigate' ? 0.22 : 0.16);
      mat.color.set(detected ? '#ff2244' : ai.mode === 'investigate' ? '#ff9933' : '#66ccff');
      if (detected) stats.current.detections++;
    }

    // ----- Win / loss -----
    const elapsed = t - startedRef.current;
    const remaining = Math.max(0, MATCH_LENGTH - elapsed);

    // Reach extraction (prey)
    let closestExtractDist = Infinity;
    if (role === 'prey') {
      for (const e of map.extractionZones) {
        const d = Math.hypot(player.pos.x - e.position.x, player.pos.z - e.position.z);
        if (d < closestExtractDist) closestExtractDist = d;
        if (d < e.radius) {
          ended.current = true;
          onEnd('victory', `EXTRACTED VIA ${e.name.toUpperCase()}`, { ...stats.current, timeSec: elapsed });
          return;
        }
      }
      // hunter catches player
      const dh = Math.hypot(player.pos.x - ai.pos.x, player.pos.z - ai.pos.z);
      if (dh < 1.6) {
        ended.current = true;
        onEnd('defeat', 'CAUGHT BY HUNTER', { ...stats.current, timeSec: elapsed });
        return;
      }
    } else {
      // player is hunter — catch the AI prey
      const dh = Math.hypot(player.pos.x - ai.pos.x, player.pos.z - ai.pos.z);
      if (dh < 1.6) {
        ended.current = true;
        onEnd('victory', 'PREY ELIMINATED', { ...stats.current, timeSec: elapsed });
        return;
      }
      // AI prey reaches extraction → defeat
      for (const e of map.extractionZones) {
        const d = Math.hypot(ai.pos.x - e.position.x, ai.pos.z - e.position.z);
        if (d < e.radius) {
          ended.current = true;
          onEnd('defeat', 'PREY ESCAPED', { ...stats.current, timeSec: elapsed });
          return;
        }
      }
      // closest extraction shown is irrelevant for hunter — show distance to prey
      closestExtractDist = Math.hypot(player.pos.x - ai.pos.x, player.pos.z - ai.pos.z);
    }

    if (remaining <= 0) {
      ended.current = true;
      const win = role === 'prey'; // prey survives = win
      onEnd(win ? 'victory' : 'defeat', win ? 'TIME EXPIRED — SURVIVED' : 'TIME EXPIRED — PREY ESCAPED', { ...stats.current, timeSec: elapsed });
      return;
    }

    // HUD state
    const recentLoud = footsteps.current.filter(f => f.emitter === 'player' && (t - f.t) < 1.5).reduce((a,b) => a + b.loud, 0);
    const silence = Math.max(0, 1 - recentLoud * 0.6);
    const detected = ai.mode === 'chase';
    const detection = detected ? 1 : (ai.mode === 'investigate' ? 0.5 : 0.1);

    onState({
      remaining,
      detected,
      detection,
      preyPos: role === 'prey' ? { x: player.pos.x, z: player.pos.z } : { x: ai.pos.x, z: ai.pos.z },
      hunterPos: role === 'hunter' ? { x: player.pos.x, z: player.pos.z } : { x: ai.pos.x, z: ai.pos.z },
      playerHP: 1,
      closestExtractionDist: isFinite(closestExtractDist) ? closestExtractDist : 0,
      silence,
      abilities: abilities.map(a => ({
        id: a.id, key: a.key, short: a.short, name: a.name, color: a.color,
        cooldown: a.cooldown, duration: a.duration,
        ready: player.abilities[a.id]?.ready ?? 0,
        active: player.abilities[a.id]?.active ?? 0,
      })),
    });
  });

  // Lighting
  const isSnow = map.id === 'white_hollow';
  const isPlatform = map.id === 'black_array';

  return (
    <>
      {/* Ground — centered on the map (raw world coords, NO offset group) */}
      <mesh rotation={[-Math.PI/2,0,0]} position={[map.size.width/2, -0.01, map.size.depth/2]} receiveShadow>
        <planeGeometry args={[map.size.width * 4, map.size.depth * 4]} />
        <meshStandardMaterial color={map.palette.ground} roughness={0.95} metalness={0.04} />
      </mesh>

      {/* Everything else lives in raw world coordinates, matching player.pos + camera */}
      <Boundary map={map} centerOffset={[0, 0]} />
      {map.outdoorZones.map((z, i) => <OutdoorZone key={`z-${i}`} zone={z} centerOffset={[0,0]} map={map} />)}
      {map.buildings.map(b => <Building key={b.id} building={b} centerOffset={[0,0]} map={map} />)}
      <SpawnMarkers spawns={map.spawnPoints} centerOffset={[0,0]} />
      {map.extractionZones.map((e, i) => <ExtractionMarker key={`e-${i}`} zone={e} centerOffset={[0,0]} />)}
      {map.soundTraps?.map((t, i) => <SoundTrapMarker key={`t-${i}`} trap={t} centerOffset={[0,0]} />)}

      <group ref={playerMesh}>
        <PlayerAvatar avatar={avatar} faded={false} />
      </group>

      <group ref={aiMesh}>
        <PlayerAvatar avatar={oppositeAvatar(avatar)} />
      </group>

      {ai.role === 'hunter' && (
        <mesh ref={visionConeRef} rotation={[-Math.PI/2, 0, 0]}>
          <ringGeometry args={[0.5, 18, 32, 1, -0.55, 1.1]} />
          <meshBasicMaterial color="#66ccff" transparent opacity={0.16} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}

      <Decoys list={decoys} />
      <SilenceTraps list={silenceTraps} />
      <SoundRings footstepsRef={footsteps} />

      {/* Lighting */}
      <ambientLight intensity={isSnow ? 0.55 : 0.4} color={isSnow ? '#9eaab9' : '#1a2030'} />
      <hemisphereLight args={[ isSnow?'#cad3df':'#3a4858', isPlatform?'#020202':'#080808', isSnow?0.7:0.5 ]} />
      <directionalLight
        position={isSnow ? [40,60,-20] : [60,80,40]}
        intensity={isSnow ? 0.7 : 0.55}
        color={isSnow ? '#dfe8f0' : '#ffe6c0'}
        castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048}
        shadow-camera-near={1} shadow-camera-far={300}
        shadow-camera-left={-100} shadow-camera-right={100}
        shadow-camera-top={100} shadow-camera-bottom={-100} />

      {map.id === 'white_hollow' && <Snowfall />}
      {map.id === 'black_array' && <Stars radius={300} depth={80} count={2000} factor={4} fade speed={0.4} />}
    </>
  );
}

function oppositeAvatar(a: any) {
  return a.role === 'prey'
    ? { ...AVATARS.h_stalker }
    : { ...AVATARS.p_runner };
}

function Decoys({ list }: { list: React.MutableRefObject<{x:number;z:number;until:number}[]> }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() / 1000;
    while (ref.current.children.length < 8) {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 16, 12),
        new THREE.MeshStandardMaterial({ color: '#ffcc55', emissive: '#ffcc55', emissiveIntensity: 0.6 })
      );
      m.visible = false;
      ref.current.add(m);
    }
    for (let i = 0; i < ref.current.children.length; i++) {
      const m = ref.current.children[i] as THREE.Mesh;
      const d = list.current[i];
      if (!d || t > d.until) { m.visible = false; continue; }
      m.visible = true;
      m.position.set(d.x, 0.25, d.z);
    }
  });
  return <group ref={ref} />;
}
function SilenceTraps({ list }: { list: React.MutableRefObject<{x:number;z:number;r:number;until:number}[]> }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() / 1000;
    while (ref.current.children.length < 6) {
      const ringGeo = new THREE.RingGeometry(4.6, 5, 64);
      ringGeo.rotateX(-Math.PI/2);
      const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: '#ff9933', transparent: true, opacity: 0.4, depthWrite: false }));
      m.visible = false;
      ref.current.add(m);
    }
    for (let i = 0; i < ref.current.children.length; i++) {
      const m = ref.current.children[i] as THREE.Mesh;
      const d = list.current[i];
      if (!d || t > d.until) { m.visible = false; continue; }
      m.visible = true;
      m.position.set(d.x, 0.05, d.z);
    }
  });
  return <group ref={ref} />;
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
