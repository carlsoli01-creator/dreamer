import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { MapData } from '../types';
import { aStar, buildWorld, Graph, nearest } from '../ai/world';

type Mode = 'patrol'|'investigate'|'chase'|'extract'|'evade'|'caught';
interface Agent {
  pos: THREE.Vector3;
  yaw: number;
  speed: number;
  path: number[];
  pathIdx: number;
  mode: Mode;
  targetId: number;
  lastFootstepT: number;
  alertedAt: number;
  hearingRange: number;
  visionRange: number;
  visionFov: number;
  caughtAt: number;
  goalLabel: string;
}

interface FStep { x:number; z:number; t:number; emitter:'hunter'|'prey'; loud:number }

const CATCH_RADIUS = 2.0;
const FOOTSTEP_INTERVAL = 0.42;
const HUNTER_HEAR = 28;
const PREY_FLEE_DIST = 14;

export interface NPCStateView {
  hunter: Pick<Agent,'mode'|'goalLabel'|'pos'>;
  prey:   Pick<Agent,'mode'|'goalLabel'|'pos'>;
  detected: boolean;
  catches: number;
  escapes: number;
}

interface Props {
  map: MapData;
  centerOffset: [number, number];
  onState?: (s: NPCStateView) => void;
}

export default function Agents({ map, centerOffset, onState }: Props) {
  const [ox, oz] = centerOffset;
  const graph = useMemo<Graph>(() => buildWorld(map), [map]);

  const hunter = useRef<Agent>(makeHunter(map, graph));
  const prey   = useRef<Agent>(makePrey(map, graph));
  const stats  = useRef({ catches: 0, escapes: 0 });

  const footsteps = useRef<FStep[]>([]);
  const ringPool = useRef<THREE.Mesh[]>([]);
  const ringGroup = useRef<THREE.Group>(null);

  const hunterMesh = useRef<THREE.Group>(null);
  const preyMesh   = useRef<THREE.Group>(null);
  const visionCone = useRef<THREE.Mesh>(null);

  useEffect(() => {
    hunter.current = makeHunter(map, graph);
    prey.current   = makePrey(map, graph);
    stats.current  = { catches: 0, escapes: 0 };
    footsteps.current = [];
  }, [map.id, graph]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const t = performance.now() / 1000;

    updatePrey(prey.current, hunter.current, graph, map, dt, t, footsteps.current, stats.current);
    updateHunter(hunter.current, prey.current, graph, map, dt, t, footsteps.current);

    let detected = false;
    if (hunter.current.mode !== 'caught') {
      const dx = prey.current.pos.x - hunter.current.pos.x;
      const dz = prey.current.pos.z - hunter.current.pos.z;
      const d2 = dx*dx + dz*dz;
      if (d2 < CATCH_RADIUS*CATCH_RADIUS && prey.current.mode !== 'caught') {
        prey.current.mode = 'caught';
        prey.current.caughtAt = t;
        hunter.current.mode = 'patrol';
        stats.current.catches++;
        setTimeout(() => respawnPrey(prey.current, map, graph), 1400);
      }
      const inFov = inVisionCone(hunter.current, prey.current.pos, map);
      if (inFov && d2 < hunter.current.visionRange*hunter.current.visionRange) {
        hunter.current.alertedAt = t;
        hunter.current.mode = 'chase';
        const target = nearest(graph, prey.current.pos.x, prey.current.pos.z);
        if (target !== hunter.current.targetId) {
          hunter.current.targetId = target;
          hunter.current.path = aStar(graph, nearest(graph, hunter.current.pos.x, hunter.current.pos.z), target);
          hunter.current.pathIdx = 0;
          hunter.current.goalLabel = 'PREY [LOS]';
        }
        detected = true;
      }
    }

    if (hunterMesh.current) {
      hunterMesh.current.position.set(hunter.current.pos.x, 0, hunter.current.pos.z);
      hunterMesh.current.rotation.y = hunter.current.yaw + Math.PI;
    }
    if (preyMesh.current) {
      const isCaught = prey.current.mode === 'caught';
      preyMesh.current.position.set(prey.current.pos.x, 0, prey.current.pos.z);
      preyMesh.current.rotation.y = prey.current.yaw + Math.PI;
      preyMesh.current.scale.y = isCaught ? 0.4 : 1;
      preyMesh.current.visible = !isCaught;
    }

    if (visionCone.current) {
      visionCone.current.position.set(hunter.current.pos.x, 0.15, hunter.current.pos.z);
      visionCone.current.rotation.y = hunter.current.yaw;
      const mat = visionCone.current.material as THREE.MeshBasicMaterial;
      mat.opacity = hunter.current.mode === 'chase' ? 0.34 : 0.16;
      mat.color = new THREE.Color(hunter.current.mode === 'chase' ? '#ff2244' : '#66ccff');
    }

    advanceFootstepRings(footsteps.current, ringPool.current, ringGroup.current!, t);

    onState?.({
      hunter: { mode: hunter.current.mode, goalLabel: hunter.current.goalLabel, pos: hunter.current.pos },
      prey:   { mode: prey.current.mode,   goalLabel: prey.current.goalLabel,   pos: prey.current.pos },
      detected,
      catches: stats.current.catches,
      escapes: stats.current.escapes,
    });
  });

  return (
    <group>
      <group ref={ringGroup} position={[-ox, 0, -oz]} />
      <group position={[-ox, 0, -oz]}>
        <group ref={hunterMesh}><HunterModel /></group>
        <group ref={preyMesh}><PreyModel /></group>
        <mesh ref={visionCone} rotation={[-Math.PI/2, 0, 0]}>
          <ringGeometry args={[0.5, 18, 32, 1, -0.55, 1.1]} />
          <meshBasicMaterial color="#66ccff" transparent opacity={0.16} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

function HunterModel() {
  return (
    <group>
      <mesh position={[0, 1.05, 0]} castShadow>
        <capsuleGeometry args={[0.36, 0.95, 6, 12]} />
        <meshStandardMaterial color="#0a0c10" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[0, 1.78, 0]} castShadow>
        <sphereGeometry args={[0.26, 16, 12]} />
        <meshStandardMaterial color="#0a0c10" roughness={0.5} metalness={0.5} />
      </mesh>
      <mesh position={[0, 1.78, 0]} rotation={[Math.PI/2, 0, 0]}>
        <torusGeometry args={[0.27, 0.04, 8, 24]} />
        <meshStandardMaterial color="#66ccff" emissive="#66ccff" emissiveIntensity={1.1} />
      </mesh>
      <mesh position={[0, 1.55, -0.36]} rotation={[-0.4,0,0]}>
        <coneGeometry args={[0.08, 0.4, 6]} />
        <meshStandardMaterial color="#66ccff" emissive="#66ccff" emissiveIntensity={1} />
      </mesh>
    </group>
  );
}
function PreyModel() {
  return (
    <group>
      <mesh position={[0, 1.0, 0]} castShadow>
        <capsuleGeometry args={[0.32, 0.9, 6, 12]} />
        <meshStandardMaterial color="#202833" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.7, 0]} castShadow>
        <sphereGeometry args={[0.22, 16, 12]} />
        <meshStandardMaterial color="#202833" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.72, -0.18]}>
        <boxGeometry args={[0.36, 0.08, 0.05]} />
        <meshStandardMaterial color="#ff2244" emissive="#ff2244" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

function makeHunter(map: MapData, graph: Graph): Agent {
  const sp = map.spawnPoints.hunter;
  const start = nearest(graph, sp.x, sp.z);
  return {
    pos: new THREE.Vector3(sp.x, 0, sp.z),
    yaw: 0, speed: 4.6,
    path: [start], pathIdx: 0,
    mode: 'patrol',
    targetId: start,
    lastFootstepT: 0,
    alertedAt: -999,
    hearingRange: HUNTER_HEAR,
    visionRange: 22,
    visionFov: 0.55,
    caughtAt: 0,
    goalLabel: 'PATROL',
  };
}
function makePrey(map: MapData, graph: Graph): Agent {
  const sp = map.spawnPoints.prey;
  const start = nearest(graph, sp.x, sp.z);
  return {
    pos: new THREE.Vector3(sp.x, 0, sp.z),
    yaw: 0, speed: 5.2,
    path: [start], pathIdx: 0,
    mode: 'extract',
    targetId: start,
    lastFootstepT: 0,
    alertedAt: -999,
    hearingRange: 16,
    visionRange: 0,
    visionFov: 0,
    caughtAt: 0,
    goalLabel: 'EXTRACT',
  };
}
function respawnPrey(p: Agent, map: MapData, graph: Graph) {
  const sp = map.spawnPoints.prey;
  p.pos.set(sp.x, 0, sp.z);
  p.mode = 'extract';
  p.path = [nearest(graph, sp.x, sp.z)];
  p.pathIdx = 0;
  p.goalLabel = 'EXTRACT';
}

function updatePrey(p: Agent, h: Agent, graph: Graph, map: MapData, dt: number, t: number, fs: FStep[], stats: {catches:number; escapes:number}) {
  if (p.mode === 'caught') return;
  const dxh = p.pos.x - h.pos.x, dzh = p.pos.z - h.pos.z;
  const distH = Math.sqrt(dxh*dxh + dzh*dzh);

  if (distH < PREY_FLEE_DIST) {
    p.mode = 'evade'; p.goalLabel = 'EVADE';
    if (p.path.length - p.pathIdx < 2) {
      const extractions = graph.nodes.filter(n => n.tag === 'extraction');
      let best = extractions[0]; let bestD = 0;
      for (const e of extractions) {
        const d = (e.x - h.pos.x)**2 + (e.z - h.pos.z)**2;
        if (d > bestD) { bestD = d; best = e; }
      }
      const start = nearest(graph, p.pos.x, p.pos.z);
      p.path = aStar(graph, start, best.id);
      p.pathIdx = 0;
      p.targetId = best.id;
    }
  } else {
    p.mode = 'extract'; p.goalLabel = 'EXTRACT';
    if (p.path.length - p.pathIdx < 2) {
      const extractions = graph.nodes.filter(n => n.tag === 'extraction');
      const target = extractions[Math.floor(Math.random() * extractions.length)];
      const start = nearest(graph, p.pos.x, p.pos.z);
      p.path = aStar(graph, start, target.id);
      p.pathIdx = 0;
      p.targetId = target.id;
    }
  }

  followPath(p, graph, dt);
  emitFootstep(p, t, fs, 'prey', p.mode === 'evade' ? 0.85 : 0.55);

  const target = graph.nodes[p.targetId];
  if (target?.tag === 'extraction') {
    const dx = p.pos.x - target.x, dz = p.pos.z - target.z;
    if (dx*dx + dz*dz < 4) {
      stats.escapes++;
      respawnPrey(p, map, graph);
    }
  }
}

function updateHunter(h: Agent, p: Agent, graph: Graph, map: MapData, dt: number, t: number, fs: FStep[]) {
  const recent = fs.filter(f => f.emitter === 'prey' && (t - f.t) < 1.5);
  let heard: FStep | null = null;
  let bestScore = 0;
  for (const f of recent) {
    const dx = f.x - h.pos.x, dz = f.z - h.pos.z;
    const d = Math.sqrt(dx*dx + dz*dz);
    if (d > h.hearingRange) continue;
    const score = f.loud * (1 - d / h.hearingRange);
    if (score > bestScore) { bestScore = score; heard = f; }
  }

  if (h.mode === 'chase' && (t - h.alertedAt) > 4) {
    h.mode = 'investigate';
    h.goalLabel = 'INVESTIGATE';
  }
  if (h.mode !== 'chase' && heard) {
    h.mode = 'investigate'; h.goalLabel = 'INVESTIGATE [SOUND]';
    const idx = nearest(graph, heard.x, heard.z);
    if (idx !== h.targetId) {
      h.path = aStar(graph, nearest(graph, h.pos.x, h.pos.z), idx);
      h.pathIdx = 0;
      h.targetId = idx;
    }
  }

  if ((h.mode === 'patrol' || h.path.length - h.pathIdx < 2) && h.mode !== 'chase' && h.mode !== 'investigate') {
    const candidates = graph.nodes.filter(n => n.tag === 'building' || n.tag === 'zone');
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    h.path = aStar(graph, nearest(graph, h.pos.x, h.pos.z), pick.id);
    h.pathIdx = 0;
    h.targetId = pick.id;
    h.mode = 'patrol';
    h.goalLabel = 'PATROL';
  }

  if (h.mode === 'investigate' && h.path.length - h.pathIdx < 2) {
    h.mode = 'patrol'; h.goalLabel = 'PATROL';
  }

  const baseSpeed = h.mode === 'chase' ? 6.4 : (h.mode === 'investigate' ? 5.0 : 3.6);
  h.speed = baseSpeed;

  followPath(h, graph, dt);
  emitFootstep(h, t, fs, 'hunter', h.mode === 'chase' ? 0.7 : 0.45);
}

function followPath(a: Agent, graph: Graph, dt: number) {
  if (a.path.length === 0) return;
  if (a.pathIdx >= a.path.length - 1) return;
  const next = graph.nodes[a.path[a.pathIdx + 1]];
  const dx = next.x - a.pos.x, dz = next.z - a.pos.z;
  const dist = Math.sqrt(dx*dx + dz*dz);
  if (dist < 0.6) { a.pathIdx++; return; }
  const ux = dx / dist, uz = dz / dist;
  const step = Math.min(dist, a.speed * dt);
  a.pos.x += ux * step;
  a.pos.z += uz * step;
  const targetYaw = Math.atan2(-ux, -uz);
  a.yaw = lerpAngle(a.yaw, targetYaw, 1 - Math.pow(0.0001, dt));
}
function lerpAngle(a:number,b:number,t:number){ let d=b-a; while(d>Math.PI)d-=2*Math.PI; while(d<-Math.PI)d+=2*Math.PI; return a + d*t; }

function emitFootstep(a: Agent, t: number, fs: FStep[], emitter:'hunter'|'prey', loud: number) {
  if (t - a.lastFootstepT > FOOTSTEP_INTERVAL / Math.max(0.5, a.speed/4)) {
    a.lastFootstepT = t;
    fs.push({ x: a.pos.x, z: a.pos.z, t, emitter, loud });
    if (fs.length > 60) fs.shift();
  }
}

function inVisionCone(h: Agent, p: THREE.Vector3, map: MapData) {
  const dx = p.x - h.pos.x, dz = p.z - h.pos.z;
  const ang = Math.atan2(-dx, -dz);
  let diff = ang - h.yaw;
  while (diff >  Math.PI) diff -= 2*Math.PI;
  while (diff < -Math.PI) diff += 2*Math.PI;
  if (Math.abs(diff) > h.visionFov) return false;
  for (const b of map.buildings) {
    const min = { x: b.position.x - b.dimensions.width/2, z: b.position.z - b.dimensions.depth/2 };
    const max = { x: b.position.x + b.dimensions.width/2, z: b.position.z + b.dimensions.depth/2 };
    if (segHits(h.pos.x, h.pos.z, p.x, p.z, min, max)) return false;
  }
  return true;
}
function segHits(ax:number,az:number,bx:number,bz:number, mn:{x:number;z:number}, mx:{x:number;z:number}) {
  const inB = (x:number,z:number)=> x>mn.x&&x<mx.x&&z>mn.z&&z<mx.z;
  if (inB(ax,az)||inB(bx,bz)) return true;
  const dx=bx-ax, dz=bz-az;
  let t0=0,t1=1;
  const f=(p:number,q:number)=>{ if(p===0) return q>=0; const r=q/p; if(p<0){if(r>t1)return false;if(r>t0)t0=r;} else {if(r<t0)return false;if(r<t1)t1=r;} return true; };
  if (!f(-dx, ax-mn.x)) return false;
  if (!f( dx, mx.x-ax)) return false;
  if (!f(-dz, az-mn.z)) return false;
  if (!f( dz, mx.z-az)) return false;
  return true;
}

function advanceFootstepRings(fs: FStep[], pool: THREE.Mesh[], group: THREE.Group, now: number) {
  while (pool.length < 60) {
    const m = new THREE.Mesh(
      new THREE.RingGeometry(0.4, 0.5, 32),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide })
    );
    m.rotation.x = -Math.PI / 2;
    m.visible = false;
    group.add(m);
    pool.push(m);
  }
  for (let i = 0; i < pool.length; i++) {
    const m = pool[i];
    const f = fs[i];
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
    mat.color.set(f.emitter === 'hunter' ? '#66ccff' : '#ff2244');
    mat.opacity = (1 - k) * 0.55;
  }
}
