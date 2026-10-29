// How close the map is to the real place: the size of the walkable world, how far apart landmarks are against
// the real distances, whether they sit where they really are (after the best rotation, scale and shift), and
// how many real places stand in the world rather than in dialogue.
import { readFileSync, readdirSync, statSync } from 'node:fs';
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
  return statSync(full).isDirectory() ? readdirSync(full).filter((f) => f.endsWith('.js')).map((f) => join(full, f)) : [full];
});
const norm = (t) => t.replace(/[’']/g, "'");
/** Which names occur in which files, as written or in capitals (a sign), so 'plaza' in code is not the Plaza. */
export function mentions(root, list, names) {
  const text = filesOf(root, list).map((f) => norm(readFileSync(f, 'utf8'))).join('\n');
  return names.filter((n) => text.includes(norm(n)) || text.includes(norm(n).toUpperCase()));
}

/** Game position of a landmark reference: PLACES.x, SPOTS.x or district:id. */
export function gamePos(ref, { PLACES, SPOTS, DISTRICTS }) {
  if (!ref) return null;
  const [kind, id] = ref.includes(':') ? ref.split(':') : ref.split('.');
  const p = kind === 'PLACES' ? PLACES[id] : kind === 'SPOTS' ? SPOTS[id] : kind === 'district' ? DISTRICTS.find((d) => d.id === id) : null;
  return p ? { x: p.x, y: -p.z } : null; // the game's -z is drawn as north on the minimap
}

/** The walkable world: the ground the client lays (cube(w, h, d, groundmat ...) in world.js) plus districts beyond it. */
export function playArea(root) {
  const src = readFileSync(join(root, 'dist/world.js'), 'utf8');
  const m = src.match(/cube\(([\d.]+),[\d.]+,([\d.]+),groundmat/);
  const ground = m ? Number(m[1]) * Number(m[2]) : null;
  const obstacles = JSON.parse(readFileSync(join(root, 'verify/world-obstacles.json'), 'utf8')).obstacles;
  const xs = obstacles.flatMap((o) => [o.x - o.w / 2, o.x + o.w / 2]), zs = obstacles.flatMap((o) => [o.z - o.d / 2, o.z + o.d / 2]);
  const box = (Math.max(...xs) - Math.min(...xs)) * (Math.max(...zs) - Math.min(...zs));
  const fog = src.match(/new THREE\.Fog\([^,]+,\s*([\d.]+),\s*([\d.]+)\)/);
  return { groundM2: ground, boundsM2: Math.round(box), km2: (ground ?? box) / 1e6, fogEnd: fog ? Number(fog[2]) : null };
}

export async function placeReport(root) {
  const D = JSON.parse(readFileSync(join(root, 'eval/delhi.json'), 'utf8'));
  const R = await import(join(root, 'dist/loop/rules.js'));
  let DISTRICTS = [];
  try { ({ DISTRICTS } = await import(join(root, 'dist/districts.js'))); } catch { /* the old districts module may need the browser */ }
  if (!DISTRICTS?.length) DISTRICTS = [...readFileSync(join(root, 'dist/districts.js'), 'utf8').matchAll(/\{id:'(\w+)',name:'([^']+)',x:(-?[\d.]+),z:(-?[\d.]+)/g)].map((m) => ({ id: m[1], name: m[2], x: +m[3], z: +m[4] }));
  const placed = D.landmarks.map((l) => ({ ...l, pos: gamePos(l.game, { PLACES: R.PLACES, SPOTS: R.SPOTS, DISTRICTS }) })).filter((l) => l.pos);
  const real = toMetres(placed), game = placed.map((l) => l.pos);
  const f = fit(game, real);
  const world = mentions(root, D.worldFiles, D.places);
  const said = mentions(root, D.dialogueFiles, D.places).filter((n) => !world.includes(n));
  const invented = mentions(root, ['dist/districts.js', 'dist/destinations.js', 'dist/world-expansion.js'], D.invented);
  const area = playArea(root);
  return {
    area, scale: f.scale, layoutError: f.error, landmarksPlaced: placed.length, landmarksTotal: D.landmarks.length,
    pairs: placed.map((l, i) => ({ id: l.id, real: { x: Math.round(real[i].x), y: Math.round(real[i].y) }, game: l.pos })),
    realInWorld: world, realOnlySaid: said, invented: [...new Set(invented.map((n) => n.replace('’', "'")))],
    missing: D.places.filter((n) => !world.includes(n) && !said.includes(n)),
  };
}
