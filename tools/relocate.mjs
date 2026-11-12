// One-off move of the game's layout from the old 125 x 150 m plaza onto the real map. Each place keeps its own
// layout (where the chai stall stands from the bus, where the police line stands from the crowd) and is moved, and
// turned in quarter turns, onto its real street. Run with --check to print every moved spot and any that land in a
// building; the source edits are made by hand from its output.
export const ZONES = {
  // old anchor -> new anchor, turn: quarter turns (1 = old +x points to new +z... see turn())
  metro: { from: { x: -7, z: 36 }, to: { x: 150, z: -296 }, turn: 0 },
  cp: { from: { x: -4, z: -33 }, to: { x: 100, z: -190 }, turn: 0 },
  stage: { from: { x: 2, z: -5 }, to: { x: -49, z: 105 }, turn: 0 },
  barricade: { from: { x: 38, z: -4.5 }, to: { x: -51, z: 82 }, turn: -1 },
  parliament: { from: { x: 62, z: -4 }, to: { x: -58, z: 55 }, turn: -1 },
};
/** Quarter turns: -1 maps old +x to new -z and old +z to new +x. */
export function turn(dx, dz, q) {
  q = ((q % 4) + 4) % 4;
  for (let i = 0; i < q; i++) [dx, dz] = [-dz, dx];
  return [dx, dz];
}
export function zoneOf(p) {
  let best = null, bd = Infinity;
  for (const [id, z] of Object.entries(ZONES)) { const d = Math.hypot(p.x - z.from.x, p.z - z.from.z); if (d < bd) { bd = d; best = id; } }
  return best;
}
export function relocate(p, zone = zoneOf(p)) {
  const Z = ZONES[zone];
  const [dx, dz] = turn(p.x - Z.from.x, p.z - Z.from.z, Z.turn);
  return { x: Math.round((Z.to.x + dx) * 10) / 10, z: Math.round((Z.to.z + dz) * 10) / 10 };
}

if (process.argv[1]?.endsWith('relocate.mjs')) {
  const R = await import('../dist/loop/rules.js');
  const { MAP } = await import('../dist/map/delhi-map.js');
  const inSolid = (p) => MAP.solids.find((o) => Math.abs(p.x - o.x) < o.w / 2 + 0.4 && Math.abs(p.z - o.z) < o.d / 2 + 0.4);
  const tables = { SPOTS: R.SPOTS, PLACES: R.PLACES, LINE_FRONT: R.LINE_FRONT, CROWD_CENTERS: R.CROWD_CENTERS };
  for (const [t, tab] of Object.entries(tables)) for (const [k, p] of Object.entries(tab)) {
    const q = relocate(p), hit = inSolid(q);
    console.log(`${t}.${k}`.padEnd(28), zoneOf(p).padEnd(10), JSON.stringify(p).padEnd(40), JSON.stringify(q), hit ? 'IN ' + hit.id : '');
  }
}
