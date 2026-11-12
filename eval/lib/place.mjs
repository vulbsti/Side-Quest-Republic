// How close the map is to the real place: the size of the walkable world, how far apart landmarks are against
// the real distances, whether they sit where they really are (after the best rotation, scale and shift), and
// how many real places stand in the world rather than in dialogue.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const M_PER_DEG_LAT = 111_320;
/** Real lat/lon to metres east (x) and north (y) of the first point. */
export function toMetres(points) {
  const lat0 = points[0].lat, lon0 = points[0].lon, k = Math.cos((lat0 * Math.PI) / 180) * M_PER_DEG_LAT;
  return points.map((p) => ({ x: (p.lon - lon0) * k, y: (p.lat - lat0) * M_PER_DEG_LAT }));
}

/**
 * Best similarity fit of game points onto real points (rotation, uniform scale, shift; a mirror is allowed,
 * since the game's axes may be flipped). Returns { scale, error }: scale is game metres per real metre, error is
 * the leftover distance (RMS) as a share of the real points' spread, so 0 is a true map and ~1 is unrelated.
 */
export function fit(game, real) {
  const n = game.length;
  if (n < 3) return { scale: null, error: null, n };
  const mean = (a) => ({ x: a.reduce((s, p) => s + p.x, 0) / n, y: a.reduce((s, p) => s + p.y, 0) / n });
  const g0 = mean(game), r0 = mean(real);
  const G = game.map((p) => ({ x: p.x - g0.x, y: p.y - g0.y })), Rr = real.map((p) => ({ x: p.x - r0.x, y: p.y - r0.y }));
  const ss = (a) => a.reduce((s, p) => s + p.x * p.x + p.y * p.y, 0);
  const sg = ss(G), sr = ss(Rr);
  let best = null;
  for (const mirror of [1, -1]) {
    const Gm = G.map((p) => ({ x: p.x, y: mirror * p.y }));
    // Rotation maximising sum(r · R g): angle from the cross-covariance.
    let a = 0, b = 0;
    for (let i = 0; i < n; i++) { a += Gm[i].x * Rr[i].x + Gm[i].y * Rr[i].y; b += Gm[i].x * Rr[i].y - Gm[i].y * Rr[i].x; }
    const s = Math.hypot(a, b) / sg; // real metres per game metre
    const resid = sr - (Math.hypot(a, b) ** 2) / sg;
    if (!best || resid < best.resid) best = { resid, s };
  }
  return { scale: 1 / best.s, error: Math.sqrt(Math.max(0, best.resid) / sr), n };
}

const filesOf = (root, list) => list.flatMap((p) => {
  const full = join(root, p);
  if (!existsSync(full)) return [];
  return statSync(full).isDirectory() ? readdirSync(full).filter((f) => f.endsWith('.js')).map((f) => join(full, f)) : [full];
});
const norm = (t) => t.replace(/[’']/g, "'");
/** Which names occur in which files (or in `extra`, text the world draws), as written or in capitals (a sign). */
export function mentions(root, list, names, extra = '') {
  const text = filesOf(root, list).map((f) => norm(readFileSync(f, 'utf8'))).join('\n') + '\n' + norm(extra);
  return names.filter((n) => text.includes(norm(n)) || text.includes(norm(n).toUpperCase()));
}

/** Game position of a landmark reference: PLACES.x, SPOTS.x, or map:Name (a place the city draws from OSM). */
export function gamePos(ref, { PLACES, SPOTS, MAP }) {
  if (!ref) return null;
  const i = ref.indexOf(ref.startsWith('map:') ? ':' : '.'), kind = ref.slice(0, i), id = ref.slice(i + 1);
  let p = kind === 'PLACES' ? PLACES[id] : kind === 'SPOTS' ? SPOTS[id] : null;
  if (kind === 'map' && MAP) {
    const poly = (MAP.buildings.find((b) => b.name === id) || MAP.areas.find((a) => a.name === id))?.poly;
    p = MAP.pois.find((q) => q.name === id) || (poly && { x: poly.reduce((s, q) => s + q[0], 0) / poly.length, z: poly.reduce((s, q) => s + q[1], 0) / poly.length });
  }
  return p ? { x: p.x, y: -p.z } : null; // the game's -z is drawn as north on the minimap
}

/** The walkable world: the map's extent (dist/map/geo.js), and how far the fog lets you see (world.js). */
export async function playArea(root) {
  const src = readFileSync(join(root, 'dist/world.js'), 'utf8');
  const { EXTENT: E } = await import(join(root, 'dist/map/geo.js'));
  const ground = (E.maxX - E.minX) * (E.maxZ - E.minZ);
  const obstacles = JSON.parse(readFileSync(join(root, 'verify/world-obstacles.json'), 'utf8')).obstacles;
  const xs = obstacles.flatMap((o) => [o.x - o.w / 2, o.x + o.w / 2]), zs = obstacles.flatMap((o) => [o.z - o.d / 2, o.z + o.d / 2]);
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const x of xs) { if (x < x0) x0 = x; if (x > x1) x1 = x; }
  for (const z of zs) { if (z < z0) z0 = z; if (z > z1) z1 = z; }
  const fog = src.match(/new THREE\.Fog\([^,]+,\s*([\d.]+),\s*([\d.]+)\)/);
  return { groundM2: ground, boundsM2: Math.round((x1 - x0) * (z1 - z0)), km2: ground / 1e6, fogEnd: fog ? Number(fog[2]) : null };
}

export async function placeReport(root) {
  const D = JSON.parse(readFileSync(join(root, 'eval/delhi.json'), 'utf8'));
  const R = await import(join(root, 'dist/loop/rules.js'));
  const { MAP } = await import(join(root, 'dist/map/delhi-map.js'));
  const { labels } = await import(join(root, 'dist/map/labels.js'));
  const drawn = labels(MAP).map((l) => l.text).join('\n'); // every board the city draws
  const placed = D.landmarks.map((l) => ({ ...l, pos: gamePos(l.game, { PLACES: R.PLACES, SPOTS: R.SPOTS, MAP }) })).filter((l) => l.pos);
  const real = toMetres(placed), game = placed.map((l) => l.pos);
  const f = fit(game, real);
  const world = mentions(root, D.worldFiles, D.places, drawn);
  const said = mentions(root, D.dialogueFiles, D.places).filter((n) => !world.includes(n));
  const invented = mentions(root, D.worldFiles, D.invented, drawn);
  const area = await playArea(root);
  return {
    area, scale: f.scale, layoutError: f.error, landmarksPlaced: placed.length, landmarksTotal: D.landmarks.length,
    pairs: placed.map((l, i) => ({ id: l.id, real: { x: Math.round(real[i].x), y: Math.round(real[i].y) }, game: l.pos })),
    realInWorld: world, realOnlySaid: said, invented: [...new Set(invented.map((n) => n.replace('’', "'")))],
    missing: D.places.filter((n) => !world.includes(n) && !said.includes(n)),
  };
}
