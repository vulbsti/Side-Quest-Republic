// Routes along the real streets (dist/map/streets.js, from OpenStreetMap): walkers use every road and footpath,
// vehicles only the roads. Pure and deterministic, so the engine, the client and the verifier get the same path.
import { STREETS } from './streets.js';

const N = STREETS.nodes, adjAll = N.map(() => []), adjCar = N.map(() => []);
for (const [a, b, car] of STREETS.edges) {
  const d = Math.hypot(N[a][0] - N[b][0], N[a][1] - N[b][1]);
  adjAll[a].push([b, d]); adjAll[b].push([a, d]);
  if (car) { adjCar[a].push([b, d]); adjCar[b].push([a, d]); }
}
const E = STREETS.edges, carEdges = E.filter((e) => e[2]);

/** Where a point meets the nearest street: the edge, the foot of the perpendicular, and its distance along. */
function snap(p, edges) {
  let best = null, bd = Infinity;
  for (const e of edges) {
    const [ax, az] = N[e[0]], [bx, bz] = N[e[1]], dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((p.x - ax) * dx + (p.z - az) * dz) / L));
    const x = ax + t * dx, z = az + t * dz, d = (p.x - x) ** 2 + (p.z - z) ** 2;
    if (d < bd) { bd = d; best = { a: e[0], b: e[1], x, z, len: Math.sqrt(L), t }; }
  }
  return best;
}
function astar(a, b, adj) {
  if (a === b) return [a];
  const g = new Map([[a, 0]]), parent = new Map([[a, -1]]), open = [[Math.hypot(N[a][0] - N[b][0], N[a][1] - N[b][1]), a]], done = new Set();
  while (open.length) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (open[i][0] < open[bi][0] || (open[i][0] === open[bi][0] && open[i][1] < open[bi][1])) bi = i;
    const [, n] = open[bi]; open.splice(bi, 1);
    if (done.has(n)) continue;
    if (n === b) break;
    done.add(n);
    for (const [m, d] of adj[n]) {
      const ng = g.get(n) + d;
      if (ng < (g.get(m) ?? Infinity)) { g.set(m, ng); parent.set(m, n); open.push([ng + Math.hypot(N[m][0] - N[b][0], N[m][1] - N[b][1]), m]); }
    }
  }
  if (!parent.has(b)) return null;
  const path = [];
  for (let n = b; n !== -1; n = parent.get(n)) path.unshift(n);
  return path;
}
const cache = new Map();
function nodesBetween(a, b, adj, car) {
  const key = (car ? 'c' : 'w') + a + ',' + b;
  let nodes = cache.get(key);
  if (nodes === undefined) { nodes = astar(a, b, adj); cache.set(key, nodes); }
  return nodes;
}
const lengthOf = (nodes) => { let L = 0; for (let i = 1; i < nodes.length; i++) L += Math.hypot(N[nodes[i]][0] - N[nodes[i - 1]][0], N[nodes[i]][1] - N[nodes[i - 1]][1]); return L; };
/**
 * The way from one point to another along the streets: a list of points ending at `to` (the start is not
 * included). Each end steps onto its nearest street first, so walkers don't cut across blocks. Short hops (under
 * `direct` metres) go straight. car: roads only.
 */
export function streetPath(from, to, { car = false, direct = 25 } = {}) {
  if (Math.hypot(to.x - from.x, to.z - from.z) < direct) return [{ x: to.x, z: to.z }];
  const edges = car ? carEdges : E, adj = car ? adjCar : adjAll;
  const A = snap(from, edges), B = snap(to, edges);
  const end = [{ x: to.x, z: to.z }];
  // Both on the same street: walk along it.
  if ((A.a === B.a && A.b === B.b) || (A.a === B.b && A.b === B.a)) return [{ x: A.x, z: A.z }, { x: B.x, z: B.z }, ...end];
  let best = null, bl = Infinity;
  for (const [sa, ca] of [[A.a, A.t * A.len], [A.b, (1 - A.t) * A.len]]) {
    for (const [sb, cb] of [[B.a, B.t * B.len], [B.b, (1 - B.t) * B.len]]) {
      const nodes = nodesBetween(sa, sb, adj, car);
      if (!nodes) continue;
      const L = ca + lengthOf(nodes) + cb;
      if (L < bl) { bl = L; best = nodes; }
    }
  }
  if (!best) return end;
  const pts = [{ x: A.x, z: A.z }, ...best.map((i) => ({ x: N[i][0], z: N[i][1] })), { x: B.x, z: B.z }, ...end];
  // Drop points that are only a step from the one before.
  return pts.filter((q, i) => i === pts.length - 1 || Math.hypot(q.x - (i ? pts[i - 1].x : from.x), q.z - (i ? pts[i - 1].z : from.z)) > 0.3);
}
/** Total length of a path from `from`. */
export function pathLength(from, pts) {
  let L = 0, p = from;
  for (const q of pts) { L += Math.hypot(q.x - p.x, q.z - p.z); p = q; }
  return L;
}
