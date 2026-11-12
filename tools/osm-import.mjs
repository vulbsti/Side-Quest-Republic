// Turns the OpenStreetMap extract in research/osm/ into the game's map: dist/map/delhi-map.js.
// Real metres are compressed by SCALE (open-world games do this so walks stay fun) and laid out with x east and
// -z north, the same way the minimap and eval/lib/place.mjs read the game. Run: node tools/osm-import.mjs
// Map data © OpenStreetMap contributors, ODbL.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCALE, ORIGIN, EXTENT, project } from '../dist/map/geo.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const load = (f) => JSON.parse(readFileSync(join(root, 'research/osm', f), 'utf8')).elements;
const r1 = (n) => Math.round(n * 10) / 10;

// --- geometry of elements, whichever way Overpass wrote it ---------------------------------------------------
const nodeIndex = new Map();
const files = ['highway.json', 'buildings.json', 'pois.json', 'landuse.json'].map((f) => [f, load(f)]);
for (const [, els] of files) for (const e of els) if (e.type === 'node' && Number.isFinite(e.lat)) nodeIndex.set(e.id, e);
const wayGeom = (w) => w.geometry?.length ? w.geometry : (w.nodes || []).map((id) => nodeIndex.get(id)).filter(Boolean);
const wayIndex = new Map();
for (const [, els] of files) for (const e of els) if (e.type === 'way') wayIndex.set(e.id, e);
/** Outer rings of a way or multipolygon, as lat/lon lists. */
function rings(e) {
  if (e.type === 'way') return [wayGeom(e)];
  if (e.type !== 'relation') return [];
  const parts = (e.members || []).filter((m) => m.type === 'way' && (m.role === 'outer' || m.role === '')).map((m) => (m.geometry?.length ? m.geometry : wayGeom(wayIndex.get(m.ref) || {})));
  return joinRings(parts.filter((p) => p.length > 1));
}
function joinRings(parts) {
  const key = (p) => p.lat.toFixed(7) + ',' + p.lon.toFixed(7), out = [];
  const left = parts.map((p) => p.slice());
  while (left.length) {
    let ring = left.shift();
    for (let guard = 0; guard < 500 && key(ring[0]) !== key(ring[ring.length - 1]); guard++) {
      const end = key(ring[ring.length - 1]);
      const i = left.findIndex((p) => key(p[0]) === end || key(p[p.length - 1]) === end);
      if (i < 0) break;
      const p = left.splice(i, 1)[0];
      ring = ring.concat(key(p[0]) === end ? p.slice(1) : p.reverse().slice(1));
    }
    out.push(ring);
  }
  return out;
}
const inExtent = (x, z, pad = 0) => x >= EXTENT.minX - pad && x <= EXTENT.maxX + pad && z >= EXTENT.minZ - pad && z <= EXTENT.maxZ + pad;
const toGame = (pts) => pts.map((p) => { const q = project(p.lat, p.lon); return [r1(q.x), r1(q.z)]; });
function area(poly) { let a = 0; for (let i = 0; i < poly.length; i++) { const [x1, z1] = poly[i], [x2, z2] = poly[(i + 1) % poly.length]; a += x1 * z2 - x2 * z1; } return a / 2; }
function centroid(poly) { let x = 0, z = 0; for (const p of poly) { x += p[0]; z += p[1]; } return [x / poly.length, z / poly.length]; }
function inside(poly, x, z) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c;
  }
  return c;
}
const anyInside = (poly, pad) => poly.some(([x, z]) => inExtent(x, z, pad));
/** Drop the closing duplicate and points closer than 0.3 m. */
function clean(poly) {
  const out = [];
  for (const p of poly) if (!out.length || Math.hypot(p[0] - out[out.length - 1][0], p[1] - out[out.length - 1][1]) > 0.3) out.push(p);
  if (out.length > 2 && Math.hypot(out[0][0] - out[out.length - 1][0], out[0][1] - out[out.length - 1][1]) < 0.3) out.pop();
  return out;
}

// --- roads ------------------------------------------------------------------------------------------------
// Carriageway widths in real metres, before SCALE.
const ROAD_W = { motorway: 22, trunk: 20, primary: 18, secondary: 14, tertiary: 11, unclassified: 8, residential: 7, living_street: 6, service: 5, pedestrian: 8, footway: 2.5, path: 2.5, cycleway: 2.5, steps: 3, track: 4 };
const CAR = new Set(['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'unclassified', 'residential', 'living_street', 'service', 'motorway_link', 'trunk_link', 'primary_link', 'secondary_link', 'tertiary_link']);
const roads = [];
const graphWays = [];
for (const e of load('highway.json')) {
  if (e.type !== 'way' || !e.tags?.highway) continue;
  const kind = e.tags.highway.replace('_link', '');
  if (!(kind in ROAD_W) || e.tags.area === 'yes' || e.tags.access === 'private' || e.tags.service === 'driveway' && false) continue;
  const g = wayGeom(e), pts = toGame(g);
  if (!pts.some(([x, z]) => inExtent(x, z, 20))) continue;
  const lanes = Number(e.tags.lanes) || 0;
  const realW = Number.parseFloat(e.tags.width) || (lanes ? Math.max(ROAD_W[kind], lanes * 3.3) : ROAD_W[kind]);
  roads.push({ kind, car: CAR.has(e.tags.highway), name: e.tags.name || '', w: r1(realW * SCALE), oneway: e.tags.oneway === 'yes', pts });
  graphWays.push({ ids: e.nodes || g.map((p) => p.lat.toFixed(7) + ',' + p.lon.toFixed(7)), pts, kind, name: e.tags.name || '' });
}

// --- buildings ----------------------------------------------------------------------------------------------
const buildings = [];
for (const e of load('buildings.json')) {
  if (!e.tags?.building || Number.parseFloat(e.tags.layer) < 0 || e.tags.location === 'underground') continue; // Palika Bazaar and the metro are underground
  for (const ring of rings(e)) {
    let poly = clean(toGame(ring));
    if (poly.length < 3 || !anyInside(poly, 0)) continue;
    const a = area(poly);
    if (Math.abs(a) < 4) continue;
    if (a > 0) poly = poly.reverse(); // one winding for every footprint
    const t = e.tags, levels = Number.parseFloat(t['building:levels']);
    let h = Number.parseFloat(t.height) || (levels ? levels * 3.6 + 1 : 0);
    if (!h) h = t.building === 'roof' ? 4 : t.building === 'kiosk' ? 3 : Math.abs(a) > 1500 ? 14 : 9;
    buildings.push({ id: e.id, name: t.name || '', kind: t.building, h: r1(h * 0.85), roof: t.building === 'roof', poly });
  }
}

// --- open ground: parks, lawns, parking, water, plazas ------------------------------------------------------
const areas = [];
const areaKind = (t) => t.leisure === 'park' || t.leisure === 'garden' || t.landuse === 'grass' || t.landuse === 'recreation_ground' || t.natural === 'grassland' || t.landuse === 'village_green' ? 'grass'
  : t.natural === 'water' || t.water || t.leisure === 'fountain' || t.amenity === 'fountain' ? 'water'
  : t.amenity === 'parking' ? 'parking'
  : t.natural === 'wood' || t.landuse === 'forest' || t.natural === 'scrub' ? 'trees'
  : t.highway === 'pedestrian' || t.place === 'square' ? 'plaza' : null;
const trees = [];
for (const e of [...load('landuse.json'), ...load('highway.json').filter((x) => x.tags?.area === 'yes')]) {
  if (e.type === 'node') { if (e.tags?.natural === 'tree') { const q = project(e.lat, e.lon); if (inExtent(q.x, q.z)) trees.push([r1(q.x), r1(q.z)]); } continue; }
  const k = e.tags && areaKind(e.tags);
  if (!k) continue;
  for (const ring of rings(e)) {
    const poly = clean(toGame(ring));
    if (poly.length >= 3 && anyInside(poly, 30) && Math.abs(area(poly)) > 6) areas.push({ kind: k, name: e.tags.name || '', poly });
  }
}

// --- named places: shops, cafés, temples, metro gates ------------------------------------------------------------
const POI_KEYS = ['shop', 'amenity', 'tourism', 'historic', 'office', 'leisure', 'craft', 'healthcare', 'railway', 'public_transport', 'highway', 'building'];
const pois = [];
for (const e of load('pois.json')) {
  const t = e.tags || {};
  const isGate = t.railway === 'subway_entrance' || (t.entrance && t.railway);
  if (!t.name && !isGate) continue;
  const kindKey = POI_KEYS.find((k) => t[k]);
  if (!kindKey && !isGate) continue;
  let lat = e.lat, lon = e.lon;
  if (e.type !== 'node') { const g = rings(e)[0] || wayGeom(e); if (!g?.length) continue; lat = g.reduce((s, p) => s + p.lat, 0) / g.length; lon = g.reduce((s, p) => s + p.lon, 0) / g.length; }
  const q = project(lat, lon);
  if (!inExtent(q.x, q.z)) continue;
  pois.push({ name: t.name || (t.ref ? `Gate ${t.ref}` : 'Metro'), kind: isGate ? 'metro-gate' : `${kindKey}:${t[kindKey]}`, ref: t.ref || '', x: r1(q.x), z: r1(q.z) });
}

// --- signs: each named shop on the wall of the building it stands in or beside ---------------------------------------
const nearestEdge = (b, x, z) => {
  let best = null;
  for (let i = 0; i < b.poly.length; i++) {
    const [x1, z1] = b.poly[i], [x2, z2] = b.poly[(i + 1) % b.poly.length];
    const dx = x2 - x1, dz = z2 - z1, L = Math.hypot(dx, dz);
    if (L < 1.2) continue;
    const t = Math.max(0, Math.min(1, ((x - x1) * dx + (z - z1) * dz) / (L * L)));
    const px = x1 + dx * t, pz = z1 + dz * t, d = Math.hypot(px - x, pz - z);
    if (!best || d < best.d) best = { d, x: px, z: pz, nx: dz / L, nz: -dx / L, len: L };
  }
  return best;
};
const roadNear = (x, z) => { let best = Infinity; for (const r of roads) if (r.car || r.kind === 'pedestrian') for (const [px, pz] of r.pts) best = Math.min(best, Math.hypot(px - x, pz - z)); return best; };
const signs = [];
for (const p of pois) {
  if (p.kind === 'metro-gate' || !p.name) continue;
  let host = null;
  for (const b of buildings) {
    const e = nearestEdge(b, p.x, p.z);
    if (!e) continue;
    const within = inside(b.poly, p.x, p.z);
    const score = within ? e.d * 0.5 : e.d + 3;
    if (score < 15 && (!host || score < host.score)) host = { b, e, score };
  }
  if (!host) continue;
  // The footprint winds clockwise, so this normal points out of the building.
  const { e } = host;
  const out = { x: e.x + e.nx * 0.12, z: e.z + e.nz * 0.12 };
  // If the other face of this wall is nearer a road, the normal was inward: flip it.
  const flip = roadNear(e.x - e.nx * 3, e.z - e.nz * 3) + 1 < roadNear(e.x + e.nx * 3, e.z + e.nz * 3) && inside(host.b.poly, e.x + e.nx * 0.5, e.z + e.nz * 0.5);
  const nx = flip ? -e.nx : e.nx, nz = flip ? -e.nz : e.nz;
  signs.push({ name: p.name, kind: p.kind, building: host.b.id, x: r1(e.x + nx * 0.12), z: r1(e.z + nz * 0.12), yaw: Math.round(Math.atan2(nx, nz) * 1000) / 1000, w: r1(Math.min(e.len * 0.8, Math.max(2.2, p.name.length * 0.32))), y: Math.min(4.2, host.b.h - 0.6) });
}
// Several shops in one bay: keep signs at least 2.5 m apart on the same wall.
const kept = [];
for (const s of signs) if (!kept.some((k) => k.building === s.building && Math.hypot(k.x - s.x, k.z - s.z) < 2.5)) kept.push(s);

// --- collision: footprints as boxes, so the engine's wall tests (axis-aligned boxes) work unchanged -------------
const CELL = 0.8;
const solids = [];
for (const b of buildings) {
  if (b.roof) continue; // a canopy you walk under
  const xs = b.poly.map((p) => p[0]), zs = b.poly.map((p) => p[1]);
  const x0 = Math.floor(Math.min(...xs) / CELL), x1 = Math.ceil(Math.max(...xs) / CELL), z0 = Math.floor(Math.min(...zs) / CELL), z1 = Math.ceil(Math.max(...zs) / CELL);
  let prev = [];
  const open = new Map(); // "a,b" -> box being grown downwards
  for (let zi = z0; zi < z1; zi++) {
    const runs = [];
    let start = null;
    for (let xi = x0; xi <= x1; xi++) {
      const on = xi < x1 && inside(b.poly, (xi + 0.5) * CELL, (zi + 0.5) * CELL);
      if (on && start === null) start = xi;
      if (!on && start !== null) { runs.push([start, xi]); start = null; }
    }
    const next = new Map();
    for (const [a, c] of runs) {
      const k = a + ',' + c, box = open.get(k);
      if (box) { box.z1 = zi + 1; next.set(k, box); open.delete(k); }
      else next.set(k, { a, c, z0: zi, z1: zi + 1 });
    }
    for (const box of open.values()) prev.push(box);
    open.clear();
    for (const [k, v] of next) open.set(k, v);
  }
  for (const box of open.values()) prev.push(box);
  for (const q of prev) {
    const w = (q.c - q.a) * CELL, d = (q.z1 - q.z0) * CELL;
    solids.push({ id: `bldg:${b.id}`, x: r1(q.a * CELL + w / 2), z: r1(q.z0 * CELL + d / 2), w: r1(w), d: r1(d), h: b.h });
  }
}

// --- the street graph walkers and vehicles follow ---------------------------------------------------------------
const WALK = new Set(['primary', 'secondary', 'tertiary', 'unclassified', 'residential', 'living_street', 'service', 'pedestrian', 'footway', 'path', 'steps', 'trunk']);
const DRIVE = new Set(['primary', 'secondary', 'tertiary', 'unclassified', 'residential', 'living_street', 'service', 'trunk']);
const nodeId = new Map(), nodes = [], edges = new Map(); // "a,b" -> car?
for (const w of graphWays) {
  if (!WALK.has(w.kind)) continue;
  let prev = null;
  for (let i = 0; i < w.pts.length; i++) {
    const [x, z] = w.pts[i];
    if (!inExtent(x, z, 5)) { prev = null; continue; }
    const key = String(w.ids[i]);
    let n = nodeId.get(key);
    if (n === undefined) { n = nodes.length; nodeId.set(key, n); nodes.push([x, z]); }
    if (prev !== null && prev !== n) { const k = prev < n ? prev + ',' + n : n + ',' + prev; edges.set(k, edges.get(k) || DRIVE.has(w.kind)); }
    prev = n;
  }
}
const adj = nodes.map(() => new Map()); // neighbour -> car?
for (const [e, car] of edges) { const [a, b] = e.split(',').map(Number); adj[a].set(b, car); adj[b].set(a, car); }
// Collapse chains of two-edge nodes that run nearly straight (same kind of edge on both sides), to keep the graph small.
const removed = new Set();
for (let n = 0; n < nodes.length; n++) {
  if (adj[n].size !== 2) continue;
  const [[a, ca], [b, cb]] = [...adj[n]];
  if (ca !== cb || adj[a].has(b)) continue;
  const [ax, az] = nodes[a], [bx, bz] = nodes[b], [nx, nz] = nodes[n];
  const L = Math.hypot(bx - ax, bz - az) || 1, off = Math.abs((bx - ax) * (az - nz) - (ax - nx) * (bz - az)) / L;
  if (off > 0.6) continue;
  adj[a].delete(n); adj[b].delete(n); adj[a].set(b, ca); adj[b].set(a, ca); adj[n].clear(); removed.add(n);
}
// Keep the largest connected piece, so every node can reach every other.
const comp = new Array(nodes.length).fill(-1);
let biggest = -1, biggestSize = 0;
for (let i = 0, c = 0; i < nodes.length; i++) {
  if (comp[i] >= 0 || removed.has(i) || !adj[i].size) continue;
  const stack = [i]; comp[i] = c; let size = 0;
  while (stack.length) { const n = stack.pop(); size++; for (const m of adj[n].keys()) if (comp[m] < 0) { comp[m] = c; stack.push(m); } }
  if (size > biggestSize) { biggestSize = size; biggest = c; }
  c++;
}
const keep = nodes.map((_, i) => comp[i] === biggest), renum = new Map();
const gNodes = [];
nodes.forEach((p, i) => { if (keep[i]) { renum.set(i, gNodes.length); gNodes.push(p); } });
const gEdges = [];
adj.forEach((s, a) => { if (keep[a]) for (const [b, car] of s) if (b > a && keep[b]) gEdges.push(car ? [renum.get(a), renum.get(b), 1] : [renum.get(a), renum.get(b)]); });

const map = {
  about: 'Generated by tools/osm-import.mjs from research/osm (OpenStreetMap, © OpenStreetMap contributors, ODbL). Do not edit by hand.',
  scale: SCALE, origin: ORIGIN, extent: EXTENT,
  roads, buildings: buildings.map(({ id, name, kind, h, roof, poly }) => ({ id, name, kind, h, roof, poly })), areas, trees, pois, signs: kept,
  solids, streets: { nodes: gNodes, edges: gEdges },
};
mkdirSync(join(root, 'dist/map'), { recursive: true });
writeFileSync(join(root, 'dist/map/delhi-map.js'), '// ' + map.about + '\nexport const MAP = ' + JSON.stringify(map) + ';\n');
writeFileSync(join(root, 'dist/map/streets.js'), '// The walkable street graph from dist/map/delhi-map.js, small enough for the engine to import.\nexport const STREETS = ' + JSON.stringify(map.streets) + ';\n');
console.log(`roads ${roads.length} · buildings ${buildings.length} · areas ${areas.length} · trees ${trees.length} · pois ${pois.length} · signs ${kept.length} · solids ${solids.length} · street graph ${gNodes.length} nodes / ${gEdges.length} edges`);
