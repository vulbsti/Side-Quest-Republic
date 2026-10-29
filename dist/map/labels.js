// Every piece of text the city draws: shop boards from OpenStreetMap (dist/map/delhi-map.js), Rajiv Chowk's gate
// boards, green NDMC street-name boards where the named roads run, and the names of the parks and the observatory.
// Pure, so the client draws exactly this list and the eval counts exactly what stands in the world.

const STREET_EVERY = 160; // metres of road between two name boards
/** The boards of the city: { text, kind, x, z, y, yaw, w, post } (post: on its own pole, not on a wall). */
export function labels(MAP) {
  const out = [];
  for (const s of MAP.signs) out.push({ text: s.name, kind: s.kind, x: s.x, z: s.z, y: s.y, yaw: s.yaw, w: s.w, post: false });
  // Metro gates: the red Delhi Metro board with the gate number, on a pole beside the stairs.
  for (const p of MAP.pois) {
    if (p.kind !== 'metro-gate' || Math.hypot(p.x - 177, p.z + 385) > 250) continue; // Rajiv Chowk's own gates, round Central Park
    const gate = p.ref || (p.name.match(/Gate No\.? ?(\d+)/i) || [])[1];
    const text = gate ? `Rajiv Chowk · Gate No ${gate}` : 'Rajiv Chowk';
    if (out.some((l) => l.kind === 'metro' && (l.text === text || Math.hypot(l.x - p.x, l.z - p.z) < 12))) continue; // mapped twice
    out.push({ text, kind: 'metro', x: p.x, z: p.z, y: 3.1, yaw: 0, w: 3.6, post: true });
  }
  // Street names: a board every STREET_EVERY metres along each named road, at its edge, facing along it.
  const seen = new Map();
  for (const r of MAP.roads) {
    if (!r.car || !r.name || /^Radial Road|^Rotary/.test(r.name)) continue;
    let run = (seen.get(r.name) ?? STREET_EVERY * 0.8);
    for (let i = 1; i < r.pts.length; i++) {
      const [ax, az] = r.pts[i - 1], [bx, bz] = r.pts[i], len = Math.hypot(bx - ax, bz - az);
      if (!len) continue;
      const ux = (bx - ax) / len, uz = (bz - az) / len;
      for (let t = STREET_EVERY - run; t < len; t += STREET_EVERY) {
        const off = r.w / 2 + 1.4;
        out.push({ text: r.name, kind: 'street', x: round(ax + ux * t - uz * off), z: round(az + uz * t + ux * off), y: 2.5, yaw: round(Math.atan2(ux, uz) + Math.PI / 2), w: 2.6, post: true });
        run = 0;
      }
      run += len;
      if (run >= STREET_EVERY) run = STREET_EVERY;
    }
    seen.set(r.name, run);
  }
  // The named parks and the observatory: a board at the edge nearest the middle of the area.
  for (const a of MAP.areas) {
    if (!a.name || a.kind === 'parking') continue;
    const c = centroid(a.poly), e = a.poly.reduce((b, p) => (Math.hypot(p[0] - c.x, p[1] - c.z) < Math.hypot(b[0] - c.x, b[1] - c.z) ? p : b));
    out.push({ text: a.name.replace(/^Rajiv Chowk /, ''), kind: 'park', x: e[0], z: e[1], y: 1.6, yaw: Math.atan2(e[0] - c.x, e[1] - c.z), w: 3.2, post: true });
  }
  return out;
}
const round = (v) => Math.round(v * 10) / 10;
function centroid(poly) {
  let x = 0, z = 0;
  for (const [px, pz] of poly) { x += px; z += pz; }
  return { x: x / poly.length, z: z / poly.length };
}
