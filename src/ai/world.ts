import { MapData } from '../types';

export interface WP { id: number; x: number; z: number; tag: string; meta?: any }
export interface Graph { nodes: WP[]; adj: number[][] }

const FOOTPRINT_PAD = 1.2;

function buildingBoxes(map: MapData) {
  return map.buildings.map(b => ({
    minX: b.position.x - b.dimensions.width/2 - FOOTPRINT_PAD,
    maxX: b.position.x + b.dimensions.width/2 + FOOTPRINT_PAD,
    minZ: b.position.z - b.dimensions.depth/2 - FOOTPRINT_PAD,
    maxZ: b.position.z + b.dimensions.depth/2 + FOOTPRINT_PAD,
    id: b.id,
  }));
}

function pointInBox(x:number, z:number, b:{minX:number;maxX:number;minZ:number;maxZ:number}) {
  return x > b.minX && x < b.maxX && z > b.minZ && z < b.maxZ;
}

function segmentHitsBox(ax:number,az:number, bx:number,bz:number, b:{minX:number;maxX:number;minZ:number;maxZ:number}) {
  if (pointInBox(ax,az,b) || pointInBox(bx,bz,b)) return true;
  const dx = bx - ax, dz = bz - az;
  let t0 = 0, t1 = 1;
  const test = (p:number, q:number) => {
    if (p === 0) return q >= 0;
    const r = q / p;
    if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; }
    else       { if (r < t0) return false; if (r < t1) t1 = r; }
    return true;
  };
  if (!test(-dx, ax - b.minX)) return false;
  if (!test( dx, b.maxX - ax)) return false;
  if (!test(-dz, az - b.minZ)) return false;
  if (!test( dz, b.maxZ - az)) return false;
  return true;
}

export function buildWorld(map: MapData): Graph {
  const wps: WP[] = [];
  const push = (x:number, z:number, tag:string, meta?:any) => wps.push({ id: wps.length, x, z, tag, meta });

  map.outdoorZones.forEach(z => push(z.position.x, z.position.z, 'zone', { name: z.name }));
  map.buildings.forEach(b => push(b.position.x, b.position.z, 'building', { id: b.id }));
  map.buildings.forEach(b => {
    const w = b.dimensions.width/2 + 3, d = b.dimensions.depth/2 + 3;
    push(b.position.x - w, b.position.z, 'corner', { id: b.id });
    push(b.position.x + w, b.position.z, 'corner', { id: b.id });
    push(b.position.x, b.position.z - d, 'corner', { id: b.id });
    push(b.position.x, b.position.z + d, 'corner', { id: b.id });
  });
  map.extractionZones.forEach(e => push(e.position.x, e.position.z, 'extraction', { name: e.name, type: e.type }));
  push(map.spawnPoints.prey.x,   map.spawnPoints.prey.z,   'spawn_prey');
  push(map.spawnPoints.hunter.x, map.spawnPoints.hunter.z, 'spawn_hunter');

  for (let x = 8; x < map.size.width - 8; x += 12)
    for (let z = 8; z < map.size.depth - 8; z += 12)
      push(x + (((x*z)%5)-2)*0.5, z + (((x+z)%5)-2)*0.5, 'grid');

  const boxes = buildingBoxes(map);
  const valid = wps.filter(w => !(w.tag === 'grid' && boxes.some(b => pointInBox(w.x, w.z, b))));
  valid.forEach((w, i) => (w.id = i));

  const adj: number[][] = valid.map(() => []);
  for (let i = 0; i < valid.length; i++) {
    for (let j = i+1; j < valid.length; j++) {
      const a = valid[i], b = valid[j];
      const dx = a.x - b.x, dz = a.z - b.z;
      const dist = Math.sqrt(dx*dx + dz*dz);
      if (dist > 24) continue;
      const aIsBldg = a.tag === 'building', bIsBldg = b.tag === 'building';
      const blocked = boxes.some(bx => {
        if (aIsBldg && a.meta?.id === bx.id) return false;
        if (bIsBldg && b.meta?.id === bx.id) return false;
        return segmentHitsBox(a.x, a.z, b.x, b.z, bx);
      });
      if (!blocked) { adj[i].push(j); adj[j].push(i); }
    }
  }
  return { nodes: valid, adj };
}

export function nearest(graph: Graph, x: number, z: number): number {
  let best = 0, bestD = Infinity;
  for (const n of graph.nodes) {
    const d = (n.x - x)**2 + (n.z - z)**2;
    if (d < bestD) { bestD = d; best = n.id; }
  }
  return best;
}

export function aStar(graph: Graph, fromId: number, toId: number): number[] {
  const N = graph.nodes.length;
  if (fromId === toId) return [fromId];
  const open: number[] = [fromId];
  const came: (number|undefined)[] = new Array(N);
  const g = new Float32Array(N).fill(Infinity);
  const f = new Float32Array(N).fill(Infinity);
  const h = (i:number) => {
    const a = graph.nodes[i], b = graph.nodes[toId];
    const dx = a.x - b.x, dz = a.z - b.z;
    return Math.sqrt(dx*dx + dz*dz);
  };
  g[fromId] = 0; f[fromId] = h(fromId);
  while (open.length) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (f[open[i]] < f[open[bi]]) bi = i;
    const cur = open.splice(bi, 1)[0];
    if (cur === toId) {
      const path: number[] = [cur];
      let p: number|undefined = came[cur];
      while (p !== undefined) { path.unshift(p); p = came[p]; }
      return path;
    }
    for (const nb of graph.adj[cur]) {
      const dx = graph.nodes[cur].x - graph.nodes[nb].x;
      const dz = graph.nodes[cur].z - graph.nodes[nb].z;
      const tg = g[cur] + Math.sqrt(dx*dx + dz*dz);
      if (tg < g[nb]) {
        came[nb] = cur;
        g[nb] = tg;
        f[nb] = tg + h(nb);
        if (!open.includes(nb)) open.push(nb);
      }
    }
  }
  return [];
}
