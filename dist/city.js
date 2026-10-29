// The city, drawn from OpenStreetMap (dist/map/delhi-map.js, made by tools/osm-import.mjs): the real streets of
// Connaught Place, Jantar Mantar Road and Sansad Marg at 0.6 scale, every building footprint, the parks, and the
// shop boards with their real names (dist/map/labels.js). Geometry is merged per material into tiles, so the
// renderer culls what is behind the camera; walls are collision boxes from the importer (MAP.solids).
import { MAP } from './map/delhi-map.js?v=1';
import { labels } from './map/labels.js?v=1';
import { PLACES, SPOTS } from './loop/rules.js?v=9';

const TILE = 96;
const CP = { x: 177, z: -385 }; // Rajiv Chowk Central Park, the middle of Connaught Place
// Where the day happens: kept clear of planted trees so crowds, the shuttle and the camera have room.
const KEEP_CLEAR = [...Object.values(PLACES).map((p) => ({ x: p.x, z: p.z, r: p.r + 3 })), { ...SPOTS.busCP, r: 12 }, { ...SPOTS.busJantar, r: 8 }];
// OSM gives the observatory's instruments one height; these are the real ones, scaled.
const HEIGHTS = { 'Samrat Yantra': 16, 'Misra Yantra': 8, 'Ram Yantra': 4.4, 'Jai Prakash Yantra': 1.6 };

let seed = 9137;
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const hash = (n) => { const s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s); };

/** Builds the city into the scene; pushes its walls into obstacles. Returns what main and the eval look at. */
export function buildCity(THREE, scene, obstacles) {
  seed = 9137;
  const tex = textures(THREE);
  const M = materials(THREE, tex);
  const B = new Map(); // `${material}|${tile}` -> { pos, nor, uv, idx }
  const bucket = (m, x, z) => {
    const k = `${m}|${Math.floor(x / TILE)},${Math.floor(z / TILE)}`;
    let b = B.get(k);
    if (!b) B.set(k, (b = { m, tx: (Math.floor(x / TILE) + 0.5) * TILE, tz: (Math.floor(z / TILE) + 0.5) * TILE, pos: [], nor: [], uv: [], idx: [] }));
    return b;
  };
  const vert = (b, x, y, z, nx, ny, nz, u, v) => { b.pos.push(x - b.tx, y, z - b.tz); b.nor.push(nx, ny, nz); b.uv.push(u, v); return b.pos.length / 3 - 1; };
  /** A triangle wound to face (nx, ny, nz), whatever order its corners came in. */
  const tri = (b, i, j, k, nx, ny, nz) => {
    const P = b.pos, ax = P[j * 3] - P[i * 3], ay = P[j * 3 + 1] - P[i * 3 + 1], az = P[j * 3 + 2] - P[i * 3 + 2];
    const bx = P[k * 3] - P[i * 3], by = P[k * 3 + 1] - P[i * 3 + 1], bz = P[k * 3 + 2] - P[i * 3 + 2];
    const d = (ay * bz - az * by) * nx + (az * bx - ax * bz) * ny + (ax * by - ay * bx) * nz;
    if (d >= 0) b.idx.push(i, j, k); else b.idx.push(i, k, j);
  };
  /** A flat polygon at height y (triangulated), UVs in metres / scale. */
  const flat = (m, poly, y, scale = 4) => {
    const pts = open(poly);
    if (pts.length < 3) return;
    const c = centroid(pts), b = bucket(m, c.x, c.z);
    const tris = THREE.ShapeUtils.triangulateShape(pts.map(([x, z]) => new THREE.Vector2(x, z)), []);
    const base = b.pos.length / 3;
    for (const [x, z] of pts) vert(b, x, y, z, 0, 1, 0, x / scale, z / scale);
    for (const [i, j, k] of tris) tri(b, base + i, base + j, base + k, 0, 1, 0);
  };
  /** A ribbon along a polyline, half-width hw at height y, with round joints. */
  const ribbon = (m, pts, hw, y, scale = 4) => {
    for (let i = 1; i < pts.length; i++) {
      const [ax, az] = pts[i - 1], [bx, bz] = pts[i], len = Math.hypot(bx - ax, bz - az);
      if (len < 0.01) continue;
      const nx = -(bz - az) / len * hw, nz = (bx - ax) / len * hw, b = bucket(m, (ax + bx) / 2, (az + bz) / 2);
      const v0 = b.pos.length / 3;
      for (const [x, z] of [[ax + nx, az + nz], [bx + nx, bz + nz], [bx - nx, bz - nz], [ax - nx, az - nz]]) vert(b, x, y, z, 0, 1, 0, x / scale, z / scale);
      tri(b, v0, v0 + 1, v0 + 2, 0, 1, 0); tri(b, v0, v0 + 2, v0 + 3, 0, 1, 0);
    }
    for (let i = 0; i < pts.length; i++) {
      const [x, z] = pts[i], b = bucket(m, x, z), c = vert(b, x, y, z, 0, 1, 0, x / scale, z / scale);
      for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; vert(b, x + Math.cos(a) * hw, y, z + Math.sin(a) * hw, 0, 1, 0, (x + Math.cos(a) * hw) / scale, (z + Math.sin(a) * hw) / scale); }
      for (let k = 0; k < 10; k++) tri(b, c, c + 1 + k, c + 1 + ((k + 1) % 10), 0, 1, 0);
    }
  };

  // Ground: the dusty Lutyens verge everywhere, a little beyond the map.
  const E = MAP.extent, pad = 160;
  {
    const ground = new THREE.PlaneGeometry(E.maxX - E.minX + pad * 2, E.maxZ - E.minZ + pad * 2, 1, 1);
    ground.rotateX(-Math.PI / 2);
    const uv = ground.attributes.uv, p = ground.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / 6, p.getZ(i) / 6);
    const g = new THREE.Mesh(ground, M.ground);
    g.position.set((E.minX + E.maxX) / 2, -0.02, (E.minZ + E.maxZ) / 2);
    g.receiveShadow = true; g.name = 'City ground';
    scene.add(g);
  }
  // Parks, parking, the gurdwara's sarovar.
  for (const a of MAP.areas) flat({ grass: 'grass', water: 'water', parking: 'parking', trees: 'grass', plaza: 'paving' }[a.kind] || 'paving', a.poly, a.kind === 'water' ? 0.06 : 0.015, a.kind === 'grass' ? 3 : 4);
  // Streets: a paved verge under every road, asphalt on top, footpaths in stone, lane dashes on the big roads.
  const roads = [...MAP.roads].sort((a, b) => (a.car === b.car ? 0 : a.car ? 1 : -1));
  for (const r of roads) if (r.car) ribbon('kerb', r.pts, r.w / 2 + 1.7, 0.025);
  for (const r of roads) {
    if (r.car) ribbon('asphalt', r.pts, r.w / 2, 0.04, 6);
    else ribbon(r.kind === 'steps' ? 'kerb' : 'paving', r.pts, Math.max(0.7, r.w / 2), 0.032);
  }
  for (const r of roads) {
    if (!r.car || r.w < 6) continue;
    walk(r.pts, 9, (x, z, ux, uz) => {
      const b = bucket('paint', x, z), v0 = b.pos.length / 3, hl = 1.5, hw = 0.08;
      for (const [s, t] of [[-hl, -hw], [hl, -hw], [hl, hw], [-hl, hw]]) vert(b, x + ux * s - uz * t, 0.05, z + uz * s + ux * t, 0, 1, 0, 0, 0);
      tri(b, v0, v0 + 1, v0 + 2, 0, 1, 0); tri(b, v0, v0 + 2, v0 + 3, 0, 1, 0);
    });
  }

  // Buildings: walls with a facade for their kind of block, flat roofs, and Connaught Place's white colonnade.
  const columns = [];
  for (const bl of MAP.buildings) {
    const pts = open(bl.poly);
    if (pts.length < 3) continue;
    const c = centroid(pts), style = styleOf(bl, c), h = HEIGHTS[bl.name] ?? (style === 'jm' ? 2.6 : bl.h);
    const ccw = signedArea(pts) > 0; // in x/z, positive area: walk the edges with the outside on the left
    let run = 0;
    for (let i = 0; i < pts.length; i++) {
      const [ax, az] = pts[i], [bx, bz] = pts[(i + 1) % pts.length], len = Math.hypot(bx - ax, bz - az);
      if (len < 0.05) continue;
      // Outward normal of edge a->b.
      let nx = (bz - az) / len, nz = -(bx - ax) / len;
      if (!ccw) { nx = -nx; nz = -nz; }
      const b = bucket('wall-' + style, (ax + bx) / 2, (az + bz) / 2), v0 = b.pos.length / 3;
      const U = style === 'cp' ? 6 : 3.2, V = style === 'cp' ? h : 3.6, u0 = run / U, u1 = (run + len) / U;
      vert(b, ax, 0, az, nx, 0, nz, u0, 0); vert(b, bx, 0, bz, nx, 0, nz, u1, 0);
      vert(b, bx, h, bz, nx, 0, nz, u1, h / V); vert(b, ax, h, az, nx, 0, nz, u0, h / V);
      tri(b, v0, v0 + 1, v0 + 2, nx, 0, nz); tri(b, v0, v0 + 2, v0 + 3, nx, 0, nz);
      run += len;
      if (style === 'cp' && len > 5) for (let t = 1.5; t < len - 1; t += 3) columns.push({ x: ax + ((bx - ax) * t) / len + nx * 0.15, z: az + ((bz - az) * t) / len + nz * 0.15, h: Math.min(4.2, h * 0.38) });
    }
    flat(style === 'jm' ? 'wall-jm' : style === 'cp' ? 'roof-cp' : 'roof', pts, h, 5);
    if (/Gurudwara|Bangla Sahib/.test(bl.name) && bl.kind === 'temple' && area(pts) > 300) dome(THREE, scene, M, c, h, Math.sqrt(area(pts)) * 0.22);
  }

  // Merge each bucket into one mesh, placed at its tile so it culls (and an eval sees it where it stands).
  for (const b of B.values()) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(b.nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2));
    g.setIndex(b.idx);
    g.computeBoundingSphere();
    const o = new THREE.Mesh(g, M[b.m]);
    o.position.set(b.tx, 0, b.tz);
    o.receiveShadow = true; o.castShadow = b.m.startsWith('wall');
    o.name = `City ${b.m}`;
    o.matrixAutoUpdate = false; o.updateMatrix();
    scene.add(o);
  }

  // The colonnade's columns, one instanced batch.
  instanced(THREE, scene, new THREE.CylinderGeometry(0.32, 0.36, 1, 10).translate(0, 0.5, 0), M.column, columns.map((p) => ({ x: p.x, y: 0, z: p.z, sx: 1, sy: p.h, sz: 1 })), 'Colonnade columns');

  // Trees: the ones OSM maps, avenues along the roads (Lutyens Delhi's jamun and neem rows), and the parks.
  const trees = treeSpots();
  const trunkGeo = new THREE.CylinderGeometry(0.16, 0.3, 1, 7).translate(0, 0.5, 0);
  const crownGeo = new THREE.IcosahedronGeometry(1, 1);
  instanced(THREE, scene, trunkGeo, M.trunk, trees.map((t) => ({ x: t.x, y: 0, z: t.z, sx: t.s, sy: t.h, sz: t.s })), 'Tree trunks');
  const crowns = [];
  for (const t of trees) for (let k = 0; k < 5; k++) {
    const a = k * 1.26 + t.x, r = t.s * (1.5 + hash(t.x * 7 + k) * 0.7), out = k === 4 ? 0 : t.s * 1.5;
    crowns.push({ x: t.x + Math.cos(a) * out, y: t.h + r * 0.3 + (k === 4 ? r * 0.6 : 0), z: t.z + Math.sin(a) * out, sx: r, sy: r * 0.7, sz: r });
  }
  instanced(THREE, scene, crownGeo, M.leaves, crowns, 'Tree crowns', (i) => new THREE.Color().setHSL(0.23 + hash(i) * 0.07, 0.38 + hash(i * 3) * 0.2, 0.16 + hash(i * 5) * 0.09));
  for (const t of trees) obstacles.push({ id: 'tree', x: t.x, z: t.z, w: 0.6, d: 0.6, h: 3 });

  // Street lamps along the big roads, every 30 m on one side.
  const lamps = [];
  for (const r of MAP.roads) if (r.car && r.w >= 6) walk(r.pts, 30, (x, z, ux, uz) => lamps.push({ x: x - uz * (r.w / 2 + 0.9), z: z + ux * (r.w / 2 + 0.9) }));
  instanced(THREE, scene, new THREE.CylinderGeometry(0.06, 0.1, 6, 6).translate(0, 3, 0), M.pole, lamps.map((p) => ({ ...p, y: 0, sx: 1, sy: 1, sz: 1 })), 'Street lamp poles');
  instanced(THREE, scene, new THREE.BoxGeometry(0.9, 0.12, 0.3).translate(0.35, 6, 0), M.lamp, lamps.map((p) => ({ ...p, y: 0, sx: 1, sy: 1, sz: 1 })), 'Street lamp heads');

  // The Central Park flag: India's tallest-in-its-day tricolour (63 m), at 0.6 scale.
  {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.45, 38, 12), M.pole);
    pole.position.set(CP.x, 19, CP.z); pole.castShadow = true; scene.add(pole);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(13, 8.7), new THREE.MeshStandardMaterial({ map: tex.flag, side: THREE.DoubleSide, roughness: 0.9 }));
    flag.position.set(CP.x + 6.6, 33, CP.z); flag.name = 'Central Park flag'; scene.add(flag);
  }

  // Signs: shop boards on the walls, gate and street boards on poles. One atlas texture per 84 boards.
  const L = labels(MAP);
  const signs = drawSigns(THREE, scene, L);
  const posts = L.filter((l) => l.post);
  instanced(THREE, scene, new THREE.CylinderGeometry(0.05, 0.05, 1, 6).translate(0, 0.5, 0), M.pole, posts.map((p) => ({ x: p.x, y: 0, z: p.z, sx: 1, sy: p.y, sz: 1 })), 'Sign posts');
  for (const p of posts) if (p.kind === 'metro') obstacles.push({ id: 'metro-gate', x: p.x, z: p.z, w: 0.3, d: 0.3, h: 3 });

  // Walls.
  for (const o of MAP.solids) obstacles.push(o);
  return { trees: trees.length, signs, labels: L, lamps, buildings: MAP.buildings.length, extent: E };
}

/** Which facade a building gets: Connaught Place's white blocks, the observatory, temples, or the city's mix. */
function styleOf(b, c) {
  if (HEIGHTS[b.name] !== undefined || (Math.hypot(c.x, c.z) < 45 && !b.name)) return 'jm';
  const d = Math.hypot(c.x - CP.x, c.z - CP.z);
  if (d > 70 && d < 215 && b.h < 22) return 'cp';
  if (b.kind === 'temple' || b.kind === 'mosque') return 'temple';
  if (b.h >= 22) return 'tower';
  return ['plaster', 'sandstone', 'brick', 'plaster'][Math.floor(hash(b.id % 100000) * 4)];
}

function treeSpots() {
  const out = [], occupied = (x, z) => MAP.solids.some((o) => Math.abs(x - o.x) < o.w / 2 + 1.2 && Math.abs(z - o.z) < o.d / 2 + 1.2);
  const grid = new Map(), key = (x, z) => `${Math.floor(x / 4)},${Math.floor(z / 4)}`;
  const near = (x, z) => { for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (const t of grid.get(`${Math.floor(x / 4) + i},${Math.floor(z / 4) + j}`) || []) if (Math.hypot(t.x - x, t.z - z) < 4) return true; return false; };
  const add = (x, z) => {
    if (near(x, z)) return;
    if (KEEP_CLEAR.some((p) => Math.hypot(x - p.x, z - p.z) < p.r)) return;
    const t = { x, z, h: 4 + hash(x * 3 + z) * 2, s: 0.75 + hash(x + z * 5) * 0.4 };
    out.push(t); const k = key(x, z); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(t);
  };
  for (const [x, z] of MAP.trees) add(x, z);
  const onRoad = (x, z) => MAP.roads.some((r) => r.car && r.pts.some((p, i) => i && segDist(x, z, r.pts[i - 1], p) < r.w / 2 + 0.6));
  for (const r of MAP.roads) {
    if (!r.car || !['secondary', 'tertiary', 'residential'].includes(r.kind)) continue;
    walk(r.pts, 13, (x, z, ux, uz) => {
      for (const side of [-1, 1]) {
        const off = r.w / 2 + 2.4, px = x - uz * off * side, pz = z + ux * off * side;
        if (!occupied(px, pz) && !onRoad(px, pz)) add(px, pz);
      }
    });
  }
  for (const a of MAP.areas) {
    if (a.kind !== 'grass' && a.kind !== 'trees') continue;
    const xs = a.poly.map((p) => p[0]), zs = a.poly.map((p) => p[1]);
    for (let x = Math.min(...xs) + 6; x < Math.max(...xs); x += 15) for (let z = Math.min(...zs) + 6; z < Math.max(...zs); z += 15) {
      const jx = x + (hash(x * 13 + z) - 0.5) * 5, jz = z + (hash(x + z * 17) - 0.5) * 5;
      if (inside(jx, jz, a.poly) && !occupied(jx, jz) && !onRoad(jx, jz) && Math.hypot(jx - CP.x, jz - CP.z) > 30) add(jx, jz);
    }
  }
  return out;
}

/** Board colours by what the place is: banks in blue, food in red, clothes in black, government in NDMC green. */
function boardColors(kind, text) {
  const known = [[/Haldiram/i, '#e2261c', '#ffe05a'], [/Starbucks/i, '#00704a', '#ffffff'], [/Keventers/i, '#ffffff', '#c8102e'], [/Wenger/i, '#2b2b2b', '#e6c27a'], [/Saravana/i, '#7b1e1e', '#ffd36b'], [/Khadi/i, '#f0e6d0', '#3a6b2a'], [/State Bank|SBI/i, '#1d4f91', '#ffffff'], [/PVR/i, '#ffd400', '#1a1a1a'], [/Odeon|Inox/i, '#1b1464', '#ffffff'], [/McDonald/i, '#da291c', '#ffc72c'], [/KFC/i, '#a3080c', '#ffffff'], [/Domino/i, '#006491', '#ffffff']];
  for (const [re, bg, fg] of known) if (re.test(text)) return [bg, fg];
  if (kind === 'metro') return ['#c8102e', '#ffffff'];
  if (kind === 'street' || kind === 'park' || kind.startsWith('office:government')) return ['#1f6b3a', '#ffffff'];
  if (/bank|atm|bureau/.test(kind)) return ['#1d4f91', '#ffffff'];
  if (/restaurant|fast_food|food_court|ice_cream|confectionery|bakery|pastry/.test(kind)) return [['#b3261e', '#2d2d2d', '#f2e3c6'][Math.floor(hash(text.length) * 3)], ['#ffffff', '#f6c343', '#7b1e1e'][Math.floor(hash(text.length) * 3)]];
  if (/cafe|coffee|tea/.test(kind)) return ['#2f4f3a', '#f3ead8'];
  if (/clothes|shoes|bag|fabric|jewelry|watches|cosmetics|perfumery|leather/.test(kind)) return ['#141414', '#ffffff'];
  if (/hotel|cinema|theatre|bar/.test(kind)) return ['#3b1f4a', '#f5d78e'];
  return [['#f4efe3', '#203a5c', '#7a3b20'][Math.floor(hash(text.charCodeAt(0)) * 3)], ['#1d1d1d', '#ffffff', '#fff3d6'][Math.floor(hash(text.charCodeAt(0)) * 3)]];
}

const CELL_W = 512, CELL_H = 96, COLS = 4, ROWS = 21;
function drawSigns(THREE, scene, L) {
  const perAtlas = COLS * ROWS, atlases = Math.ceil(L.length / perAtlas);
  for (let a = 0; a < atlases; a++) {
    const c = document.createElement('canvas');
    c.width = CELL_W * COLS; c.height = CELL_H * ROWS;
    const g = c.getContext('2d');
    const list = L.slice(a * perAtlas, (a + 1) * perAtlas);
    list.forEach((l, i) => {
      const x = (i % COLS) * CELL_W, y = Math.floor(i / COLS) * CELL_H, [bg, fg] = boardColors(l.kind, l.text);
      g.fillStyle = bg; g.fillRect(x, y, CELL_W, CELL_H);
      g.strokeStyle = fg; g.globalAlpha = 0.35; g.lineWidth = 4; g.strokeRect(x + 6, y + 6, CELL_W - 12, CELL_H - 12); g.globalAlpha = 1;
      const text = l.kind === 'street' || l.kind === 'metro' ? l.text : l.text.toUpperCase();
      let size = 58; g.font = `bold ${size}px sans-serif`;
      while (g.measureText(text).width > CELL_W - 36 && size > 14) { size -= 2; g.font = `bold ${size}px sans-serif`; }
      g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(text, x + CELL_W / 2, y + CELL_H / 2 + 2);
    });
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    const m = new THREE.MeshStandardMaterial({ name: 'Boards', map: t, roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -2 });
    // One mesh per tile, like the walls.
    const tiles = new Map();
    list.forEach((l, i) => {
      const k = `${Math.floor(l.x / TILE)},${Math.floor(l.z / TILE)}`;
      if (!tiles.has(k)) tiles.set(k, []);
      tiles.get(k).push([l, i]);
    });
    for (const [k, items] of tiles) {
      const [ti, tj] = k.split(',').map(Number), tx = (ti + 0.5) * TILE, tz = (tj + 0.5) * TILE;
      const pos = [], nor = [], uv = [], idx = [];
      // A board on a pole reads from both sides: a second face turned round.
      for (const [l, i] of items.flatMap(([l, i]) => (l.post ? [[l, i], [{ ...l, yaw: l.yaw + Math.PI }, i]] : [[l, i]]))) {
        const w = l.w, h = Math.max(0.42, (w * CELL_H) / CELL_W), ux = Math.cos(l.yaw), uz = -Math.sin(l.yaw), nx = Math.sin(l.yaw), nz = Math.cos(l.yaw);
        const u0 = (i % COLS) / COLS, u1 = u0 + 1 / COLS, v1 = 1 - Math.floor(i / COLS) / ROWS, v0 = v1 - 1 / ROWS;
        const base = pos.length / 3;
        for (const [s, t, u, v] of [[-w / 2, -h / 2, u0, v0], [w / 2, -h / 2, u1, v0], [w / 2, h / 2, u1, v1], [-w / 2, h / 2, u0, v1]]) {
          pos.push(l.x + ux * s - tx, l.y + t, l.z + uz * s - tz); nor.push(nx, 0, nz); uv.push(u, v);
        }
        idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      geo.setIndex(idx); geo.computeBoundingSphere();
      const o = new THREE.Mesh(geo, m);
      o.position.set(tx, 0, tz); o.name = 'Shop and street boards';
      o.matrixAutoUpdate = false; o.updateMatrix();
      scene.add(o);
    }
  }
  return L.length;
}

function instanced(THREE, scene, geo, material, items, name, colorOf = null) {
  // Split by tile so each batch culls on its own.
  const tiles = new Map();
  items.forEach((p, i) => { const k = `${Math.floor(p.x / (TILE * 2))},${Math.floor(p.z / (TILE * 2))}`; if (!tiles.has(k)) tiles.set(k, []); tiles.get(k).push([p, i]); });
  const d = new THREE.Object3D();
  for (const [k, list] of tiles) {
    const [ti, tj] = k.split(',').map(Number), cx = (ti + 0.5) * TILE * 2, cz = (tj + 0.5) * TILE * 2;
    const m = new THREE.InstancedMesh(geo, material, list.length);
    list.forEach(([p, i], n) => {
      d.position.set(p.x - cx, p.y, p.z - cz); d.rotation.set(0, hash(i) * 6.28, 0); d.scale.set(p.sx, p.sy, p.sz); d.updateMatrix();
      m.setMatrixAt(n, d.matrix);
      if (colorOf) m.setColorAt(n, colorOf(i));
    });
    m.position.set(cx, 0, cz); m.castShadow = m.receiveShadow = true; m.name = name;
    m.computeBoundingSphere();
    scene.add(m);
  }
}

function dome(THREE, scene, M, c, h, r) {
  const d = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.gold);
  d.position.set(c.x, h, c.z); d.scale.y = 1.25; d.castShadow = true; d.name = 'Gurdwara dome';
  scene.add(d);
  const spire = new THREE.Mesh(new THREE.ConeGeometry(r * 0.12, r * 0.9, 8), M.gold);
  spire.position.set(c.x, h + r * 1.25 + r * 0.4, c.z); scene.add(spire);
}

// --- materials and textures ---------------------------------------------------------------------

function materials(THREE, tex) {
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.92, metalness: 0, ...o });
  const M = {
    ground: std({ name: 'City ground', map: tex.dust, color: '#d8ccb0' }),
    grass: std({ name: 'Park grass', map: tex.grass, color: '#a6b878', polygonOffset: true, polygonOffsetFactor: -1 }),
    water: std({ name: 'Sarovar water', color: '#5b8fa6', roughness: 0.15, metalness: 0.2, polygonOffset: true, polygonOffsetFactor: -2 }),
    parking: std({ name: 'Parking', map: tex.asphalt, color: '#a7a399', polygonOffset: true, polygonOffsetFactor: -1 }),
    paving: std({ name: 'Paving', map: tex.pavers, color: '#d9cfba', polygonOffset: true, polygonOffsetFactor: -2 }),
    kerb: std({ name: 'Paving', map: tex.pavers, color: '#cfc4ad', polygonOffset: true, polygonOffsetFactor: -1 }),
    asphalt: std({ name: 'Asphalt', map: tex.asphalt, color: '#8d8d88', polygonOffset: true, polygonOffsetFactor: -3 }),
    paint: std({ name: 'Lane paint', color: '#efe9d6', polygonOffset: true, polygonOffsetFactor: -4 }),
    roof: std({ name: 'Roof', map: tex.roof, color: '#b7b0a3' }),
    'roof-cp': std({ name: 'Roof', map: tex.roof, color: '#d9d5cc' }),
    column: std({ name: 'Colonnade white', color: '#f1eee6', roughness: 0.8 }),
    trunk: std({ name: 'Bark', color: '#5e4c3a' }),
    leaves: std({ name: 'Leaves', color: '#ffffff', roughness: 0.85 }),
    pole: std({ name: 'Pole', color: '#3c4a44', metalness: 0.4, roughness: 0.6 }),
    lamp: std({ name: 'Lamp', color: '#f3ead0', emissive: '#ff9a3c', emissiveIntensity: 0 }),
    gold: std({ name: 'Gold', color: '#d9a838', metalness: 0.85, roughness: 0.32 }),
  };
  for (const s of ['cp', 'jm', 'temple', 'tower', 'plaster', 'sandstone', 'brick']) M['wall-' + s] = std({ name: 'Facade ' + s, map: tex['facade-' + s] });
  return M;
}

function textures(THREE) {
  const make = (w, h, draw, repeat = true) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return t;
  };
  const noise = (g, w, h, n, light, dark, alpha = 0.08) => { for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${rnd() > 0.5 ? light : dark},${rnd() * alpha})`; g.fillRect(rnd() * w, rnd() * h, rnd() * 3 + 1, rnd() * 3 + 1); } };
  const T = {};
  T.dust = make(256, 256, (g, w, h) => { g.fillStyle = '#cdbf9e'; g.fillRect(0, 0, w, h); noise(g, w, h, 9000, '255,250,230', '80,60,30', 0.1); });
  T.grass = make(256, 256, (g, w, h) => { g.fillStyle = '#7d9150'; g.fillRect(0, 0, w, h); noise(g, w, h, 12000, '200,220,120', '30,50,10', 0.18); });
  T.asphalt = make(256, 256, (g, w, h) => { g.fillStyle = '#5d5e5a'; g.fillRect(0, 0, w, h); noise(g, w, h, 14000, '220,220,210', '10,10,10', 0.12); });
  T.pavers = make(256, 256, (g, w, h) => {
    g.fillStyle = '#c9bd9d'; g.fillRect(0, 0, w, h); noise(g, w, h, 8000, '255,255,230', '30,35,20', 0.08);
    g.strokeStyle = '#9e947966'; g.lineWidth = 2;
    for (let y = 0; y <= h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); for (let x = ((y / 32) % 2) * 16; x < w; x += 32) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 32); g.stroke(); } }
  });
  T.roof = make(128, 128, (g, w, h) => { g.fillStyle = '#b5ada0'; g.fillRect(0, 0, w, h); noise(g, w, h, 3000, '255,255,255', '40,40,40', 0.15); });
  // Facades: u runs along the wall, v up it. One window bay per tile (3.2 m), one storey (3.6 m) per tile.
  const bay = (wall, frame, glass, opts = {}) => make(128, 144, (g, w, h) => {
    g.fillStyle = wall; g.fillRect(0, 0, w, h); noise(g, w, h, 1500, '255,255,255', '60,50,40', 0.1);
    g.fillStyle = frame; g.fillRect(w * 0.22, h * 0.18, w * 0.56, h * 0.52);
    g.fillStyle = glass; g.fillRect(w * 0.26, h * 0.22, w * 0.48, h * 0.44);
    if (opts.shade) { g.fillStyle = opts.shade; g.fillRect(w * 0.18, h * 0.14, w * 0.64, h * 0.06); }
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, h - 6, w, 6);
  });
  T['facade-plaster'] = bay('#e7dcc6', '#8a7a62', '#3d4a52', { shade: '#b8a88c' });
  T['facade-sandstone'] = bay('#c8a27a', '#8d6a48', '#36423f', { shade: '#a57f58' });
  T['facade-brick'] = bay('#a65a3e', '#e8dccb', '#2f3a40');
  T['facade-tower'] = make(128, 144, (g, w, h) => { g.fillStyle = '#9aa3a6'; g.fillRect(0, 0, w, h); g.fillStyle = '#2d4150'; g.fillRect(6, 14, w - 12, h - 40); g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(8, 16, (w - 16) / 3, h - 44); });
  T['facade-temple'] = make(128, 144, (g, w, h) => { g.fillStyle = '#f4efe6'; g.fillRect(0, 0, w, h); noise(g, w, h, 1500, '255,255,255', '120,100,60', 0.08); g.fillStyle = '#d3a23c'; g.fillRect(0, 4, w, 8); g.fillStyle = '#6e5a3a'; g.beginPath(); g.ellipse(w / 2, h * 0.55, w * 0.18, h * 0.28, 0, Math.PI, 0); g.fillRect(w * 0.32, h * 0.55, w * 0.36, h * 0.3); g.fill(); });
  // Jantar Mantar's lime plaster, salmon red with white edging.
  T['facade-jm'] = make(128, 128, (g, w, h) => { g.fillStyle = '#c4624a'; g.fillRect(0, 0, w, h); noise(g, w, h, 3000, '255,220,200', '90,30,20', 0.14); g.fillStyle = '#efe4d2'; g.fillRect(0, 0, w, 6); });
  // Connaught Place: whole-height facade. A deep colonnade below (dark arches between the white columns), two
  // storeys of tall shuttered windows above, a cornice on top.
  T['facade-cp'] = make(256, 256, (g, w, h) => {
    g.fillStyle = '#f2efe8'; g.fillRect(0, 0, w, h); noise(g, w, h, 4000, '255,255,255', '120,110,90', 0.07);
    g.fillStyle = '#d9d3c6'; g.fillRect(0, 0, w, 14); // cornice
    for (let i = 0; i < 2; i++) {
      const x = i * 128;
      g.fillStyle = '#c9c1b0'; g.fillRect(x + 34, 40, 60, 62); g.fillRect(x + 34, 112, 60, 40);
      g.fillStyle = '#4b5a5c'; g.fillRect(x + 40, 46, 48, 52); g.fillRect(x + 40, 116, 48, 32);
      g.fillStyle = '#2a2622'; g.beginPath(); g.moveTo(x + 14, 256); g.lineTo(x + 14, 196); g.quadraticCurveTo(x + 64, 156, x + 114, 196); g.lineTo(x + 114, 256); g.fill();
      g.fillStyle = 'rgba(255,200,120,0.18)'; g.fillRect(x + 22, 210, 84, 46); // shop light in the arcade
    }
  });
  T.flag = make(192, 128, (g, w, h) => {
    g.fillStyle = '#ff9933'; g.fillRect(0, 0, w, h / 3); g.fillStyle = '#ffffff'; g.fillRect(0, h / 3, w, h / 3); g.fillStyle = '#138808'; g.fillRect(0, (2 * h) / 3, w, h / 3);
    g.strokeStyle = '#000080'; g.lineWidth = 2; g.beginPath(); g.arc(w / 2, h / 2, h / 7, 0, Math.PI * 2); g.stroke();
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 + Math.cos(a) * h / 7, h / 2 + Math.sin(a) * h / 7); g.stroke(); }
  }, false);
  return T;
}

// --- geometry helpers ------------------------------------------------------------------------------

function open(poly) {
  const pts = poly.map(([x, z]) => [x, z]);
  if (pts.length > 1 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1]) pts.pop();
  return pts;
}
function signedArea(pts) { let s = 0; for (let i = 0; i < pts.length; i++) { const [ax, az] = pts[i], [bx, bz] = pts[(i + 1) % pts.length]; s += ax * bz - bx * az; } return s / 2; }
const area = (pts) => Math.abs(signedArea(pts));
function centroid(pts) { let x = 0, z = 0; for (const [px, pz] of pts) { x += px; z += pz; } return { x: x / pts.length, z: z / pts.length }; }
function inside(x, z, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c;
  }
  return c;
}
function segDist(x, z, [ax, az], [bx, bz]) {
  const dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L));
  return Math.hypot(x - ax - t * dx, z - az - t * dz);
}
/** Calls fn(x, z, ux, uz) every `every` metres along a polyline. */
function walk(pts, every, fn) {
  let carry = every / 2;
  for (let i = 1; i < pts.length; i++) {
    const [ax, az] = pts[i - 1], [bx, bz] = pts[i], len = Math.hypot(bx - ax, bz - az);
    if (!len) continue;
    const ux = (bx - ax) / len, uz = (bz - az) / len;
    let t = carry;
    for (; t < len; t += every) fn(ax + ux * t, az + uz * t, ux, uz);
    carry = t - len;
  }
}
