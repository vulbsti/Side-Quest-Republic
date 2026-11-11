// Street life on the real map: traffic on the big roads, people walking the footpaths, vendor carts along the
// walk from CP to Jantar Mantar, and the two e-rickshaws the player can ride (rules.js: the 'ride' command).
// Traffic and passers-by are scenery: the engine never sees them, so they stop for you instead of hitting you.
import { MAP } from '../map/delhi-map.js?v=1';
import { streetPath } from '../map/route.js?v=1';

const CARS = 22, WALKERS = 14, NEAR = 150, FAR = 185;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];

/** Vendors on the walk: where they stand, what the board says, and which way the cart faces. */
export const VENDORS = [
  { x: 49.9, z: -165, board: 'CHHOLE KULCHE · ₹40', yaw: 0.55 },
  { x: 13.2, z: -99.2, board: 'NIMBU PAANI · SHIKANJI', yaw: 0.55 },
  { x: -50.7, z: 13, board: 'JHALMURI · BHEL', yaw: -0.4 },
];

export function createStreetLife({ THREE, scene, obstacles, put, makeCharacter, animateCharacter, SPOTS, closed = [] }) {
  const M = (c, r = 0.6, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  const box = (w, h, d, mat, x, y, z, g) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
  const wheel = (r, x, y, z, g) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.22, 12), M('#1c1c1c', 0.9)); o.rotation.z = Math.PI / 2; o.position.set(x, y, z); g.add(o); return o; };
  const glass = M('#2b3a44', 0.2, 0.3);

  function car(color) {
    const g = new THREE.Group();
    box(1.75, 0.6, 4.1, M(color, 0.35, 0.4), 0, 0.62, 0, g);
    box(1.55, 0.5, 2.1, glass, 0, 1.15, -0.2, g);
    for (const [x, z] of [[-0.8, 1.3], [0.8, 1.3], [-0.8, -1.3], [0.8, -1.3]]) wheel(0.32, x, 0.32, z, g);
    return g;
  }
  function auto() { // the green-and-yellow CNG auto
    const g = new THREE.Group();
    box(1.3, 0.5, 2.5, M('#2f7d32'), 0, 0.55, 0, g);
    box(1.32, 0.75, 1.9, M('#f2c230'), 0, 1.25, -0.2, g);
    box(1.0, 0.45, 0.06, glass, 0, 1.2, 0.95, g);
    wheel(0.26, 0, 0.26, 1.0, g); wheel(0.26, -0.55, 0.26, -0.9, g); wheel(0.26, 0.55, 0.26, -0.9, g);
    return g;
  }
  function rickshaw() { // a battery e-rickshaw: open sides, a canopy, a bench at the back
    const g = new THREE.Group();
    box(1.15, 0.12, 2.5, M('#1f6f8b', 0.5), 0, 0.42, -0.1, g);
    box(1.0, 0.75, 0.5, M('#1f6f8b', 0.5), 0, 0.8, 1.0, g);
    box(1.0, 0.1, 0.6, M('#6b2a20', 0.7), 0, 0.62, -0.75, g); // the bench
    box(1.0, 0.45, 0.08, M('#6b2a20', 0.7), 0, 0.9, -1.05, g);
    box(1.25, 0.06, 2.6, M('#e8e1c8', 0.8), 0, 1.85, -0.1, g); // the canopy
    for (const [x, z] of [[-0.55, 1.1], [0.55, 1.1], [-0.55, -1.25], [0.55, -1.25]]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 6), M('#9aa3a6', 0.4, 0.6)); p.position.set(x, 1.15, z); g.add(p); }
    wheel(0.24, 0, 0.24, 1.15, g); wheel(0.24, -0.58, 0.24, -0.8, g); wheel(0.24, 0.58, 0.24, -0.8, g);
    return g;
  }

  // --- vendor carts on the walk --------------------------------------------------------------------
  for (const v of VENDORS) {
    const c = put('chai-cart', v.x, v.z, v.yaw);
    if (c) c.name = `Vendor: ${v.board}`;
    obstacles.push({ id: 'vendor-cart', x: v.x, z: v.z, w: 2.4, d: 2.4, h: 2.2 });
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 96;
    const a = cv.getContext('2d'); a.fillStyle = '#b3261e'; a.fillRect(0, 0, 512, 96); a.fillStyle = '#fff3c4'; a.font = 'bold 44px sans-serif'; a.textAlign = 'center'; a.textBaseline = 'middle'; a.fillText(v.board, 256, 50);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    const b = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.42), new THREE.MeshStandardMaterial({ map: t, side: THREE.DoubleSide, roughness: 1 }));
    b.position.set(v.x, 2.35, v.z); b.rotation.y = v.yaw; scene.add(b);
    const who = makeCharacter({ index: 30 + VENDORS.indexOf(v) });
    who.position.set(v.x + Math.sin(v.yaw + Math.PI / 2) * 1.6, 0, v.z + Math.cos(v.yaw + Math.PI / 2) * 1.6); who.rotation.y = v.yaw - Math.PI / 2;
    scene.add(who); v.model = who;
  }

  // --- the e-rickshaws ------------------------------------------------------------------------------
  const STANDS = { cp: SPOTS.rickCP, jantar: SPOTS.rickJantar };
  const rick = {};
  for (const [id, at] of Object.entries(STANDS)) {
    const path = streetPath(at, STANDS[id === 'cp' ? 'jantar' : 'cp'], { car: true }), q = path[0] ?? at;
    const yaw = Math.atan2(q.x - at.x, q.z - at.z) || 0;
    const m = rickshaw(); m.position.set(at.x, 0, at.z); m.rotation.y = yaw; m.name = `E-rickshaw (${id})`; scene.add(m);
    const driver = makeCharacter({ index: 40 + (id === 'cp' ? 0 : 1) }); m.add(driver); driver.position.set(0, 0.3, 0.85);
    const sb = document.createElement('canvas'); sb.width = 512; sb.height = 96;
    const a = sb.getContext('2d'); a.fillStyle = '#1f6f8b'; a.fillRect(0, 0, 512, 96); a.fillStyle = '#fff'; a.font = 'bold 40px sans-serif'; a.textAlign = 'center'; a.textBaseline = 'middle';
    a.fillText(id === 'cp' ? 'E-RICKSHAW · JANTAR MANTAR ₹10' : 'E-RICKSHAW · CP ₹10', 256, 50);
    const t = new THREE.CanvasTexture(sb); t.colorSpace = THREE.SRGBColorSpace;
    const board = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.42), new THREE.MeshStandardMaterial({ map: t, side: THREE.DoubleSide, roughness: 1 }));
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 6), M('#4c5a50')); pole.position.set(at.x - 1.8, 1.2, at.z); scene.add(pole);
    board.position.set(at.x - 1.8, 2.5, at.z); board.rotation.y = yaw; scene.add(board);
    rick[id] = { m, home: { x: at.x, z: at.z, yaw }, yaw, driver };
  }

  // --- traffic --------------------------------------------------------------------------------------
  const lanes = MAP.roads.filter((r) => r.car && r.w >= 6 && r.pts.length >= 2);
  const COLORS = ['#e8e8e8', '#bfc3c7', '#9b1c1c', '#1d2a3a', '#f1f1f1', '#6d6f73'];
  const cars = [];
  for (let i = 0; i < CARS; i++) {
    const m = i % 3 === 0 ? auto() : car(pick(COLORS));
    m.visible = false; scene.add(m);
    cars.push({ m, road: null, i: 0, k: 0, dir: 1, off: 0, speed: 0, max: i % 3 === 0 ? 7 : 10, x: 0, z: 0, ux: 0, uz: 1, idle: rand(0, 2) });
  }
  const near = (r, p, d) => r.pts.some(([x, z]) => Math.abs(x - p.x) < d && Math.abs(z - p.z) < d);
  // The protest end of Sansad Marg is shut to traffic (police barricades), so no car drives into the crowd.
  const shut = (x, z) => closed.some((q) => Math.hypot(x - q.x, z - q.z) < q.r);
  function spawn(c, p) {
    const roads = lanes.filter((r) => near(r, p, NEAR) && !r.pts.every(([x, z]) => shut(x, z)));
    if (!roads.length) { c.road = null; c.m.visible = false; return; }
    const r = pick(roads);
    c.road = r; c.dir = r.oneway || Math.random() < 0.5 ? 1 : -1;
    const n = r.pts.length;
    c.i = Math.floor(Math.random() * (n - 1)); c.k = Math.random();
    c.off = r.oneway ? rand(-r.w / 4, r.w / 4) : r.w / 4;
    c.speed = c.max * 0.6;
    place(c);
    // Not on top of the player, and not right in front of the camera's nose.
    if (Math.hypot(c.x - p.x, c.z - p.z) < 25 || shut(c.x, c.z)) { c.road = null; c.m.visible = false; return; }
    c.m.visible = true;
  }
  function seg(c) { // the current segment in driving order
    const P = c.road.pts, n = P.length;
    const a = c.dir > 0 ? P[c.i] : P[n - 1 - c.i], b = c.dir > 0 ? P[c.i + 1] : P[n - 2 - c.i];
    return { a, b };
  }
  function place(c) {
    const { a, b } = seg(c), L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    c.ux = (b[0] - a[0]) / L; c.uz = (b[1] - a[1]) / L;
    const lx = c.uz, lz = -c.ux; // left of the direction of travel: India drives on the left
    c.x = a[0] + (b[0] - a[0]) * c.k + lx * c.off; c.z = a[1] + (b[1] - a[1]) * c.k + lz * c.off;
    c.m.position.set(c.x, 0, c.z);
    const want = Math.atan2(c.ux, c.uz), cur = c.m.rotation.y, d = Math.atan2(Math.sin(want - cur), Math.cos(want - cur));
    c.m.rotation.y = cur + d * 0.25;
  }
  /** Is something in the lane just ahead of c? */
  function blocked(c, things) {
    for (const t of things) {
      // Another car only counts if it's going our way (two cars nose to nose at a junction would wait forever),
      // and after four seconds stuck behind one, a Delhi driver goes round it anyway.
      if (t.m && (t.ux * c.ux + t.uz * c.uz < 0.3 || c.stuck > 4)) continue;
      const dx = t.x - c.x, dz = t.z - c.z, ahead = dx * c.ux + dz * c.uz, side = Math.abs(-dx * c.uz + dz * c.ux);
      if (ahead > 0.5 && ahead < (t.big ? 11 : 7) && side < (t.big ? 2.6 : 1.7)) return true;
    }
    return false;
  }
  function updateCars(dt, p, bus) {
    const things = [p, { x: bus.x, z: bus.z, big: true }];
    for (const c of cars) things.push(c);
    for (const c of cars) {
      if (!c.road) { c.idle -= dt; if (c.idle <= 0) { c.idle = rand(0.5, 2); spawn(c, p); } continue; }
      if (Math.hypot(c.x - p.x, c.z - p.z) > FAR || shut(c.x, c.z)) { c.road = null; c.m.visible = false; continue; }
      const stop = blocked(c, things.filter((t) => t !== c));
      c.stuck = stop ? (c.stuck ?? 0) + dt : 0;
      c.speed += ((stop ? 0 : c.max) - c.speed) * Math.min(1, dt * (stop ? 4 : 0.8));
      let step = c.speed * dt;
      while (step > 0 && c.road) {
        const { a, b } = seg(c), L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, left = (1 - c.k) * L;
        if (step < left) { c.k += step / L; step = 0; }
        else { step -= left; c.i++; c.k = 0; if (c.i >= c.road.pts.length - 1) { c.road = null; c.m.visible = false; } }
      }
      if (c.road) place(c);
    }
  }

  // --- people on the footpaths ---------------------------------------------------------------------
  const paths = MAP.roads.filter((r) => !r.car && r.kind !== 'steps' && r.pts.length >= 2);
  const kerbs = MAP.roads.filter((r) => r.car && r.w >= 6 && r.pts.length >= 2);
  const walkers = [];
  for (let i = 0; i < WALKERS; i++) {
    const m = makeCharacter({ index: 50 + i, backpack: i % 4 === 1 });
    m.visible = false; scene.add(m);
    walkers.push({ m, pts: null, i: 0, k: 0, speed: rand(1.1, 1.6), x: 0, z: 0, idle: rand(0, 3) });
  }
  function spawnWalker(w, p) {
    const pool = [...paths.filter((r) => near(r, p, NEAR * 0.8)), ...kerbs.filter((r) => near(r, p, NEAR * 0.8))];
    if (!pool.length) return;
    const r = pick(pool), side = Math.random() < 0.5 ? 1 : -1, off = r.car ? (r.w / 2 + 1.1) * side : 0;
    let pts = r.pts.map(([x, z]) => [x, z]);
    if (Math.random() < 0.5) pts.reverse();
    if (off) pts = pts.map(([x, z], i) => { const [ax, az] = pts[Math.max(0, i - 1)], [bx, bz] = pts[Math.min(pts.length - 1, i + 1)], L = Math.hypot(bx - ax, bz - az) || 1; return [x - ((bz - az) / L) * off, z + ((bx - ax) / L) * off]; });
    w.pts = pts; w.i = Math.floor(Math.random() * (pts.length - 1)); w.k = Math.random();
    const [ax, az] = pts[w.i], [bx, bz] = pts[w.i + 1];
    w.x = ax + (bx - ax) * w.k; w.z = az + (bz - az) * w.k;
    if (Math.hypot(w.x - p.x, w.z - p.z) < 20) { w.pts = null; return; }
    w.m.visible = true;
  }
  function updateWalkers(dt, t, p) {
    for (const w of walkers) {
      if (!w.pts) { w.idle -= dt; if (w.idle <= 0) { w.idle = rand(0.5, 2.5); spawnWalker(w, p); } continue; }
      if (Math.hypot(w.x - p.x, w.z - p.z) > FAR) { w.pts = null; w.m.visible = false; continue; }
      let step = w.speed * dt;
      while (step > 0 && w.pts) {
        const [ax, az] = w.pts[w.i], [bx, bz] = w.pts[w.i + 1], L = Math.hypot(bx - ax, bz - az) || 1, left = (1 - w.k) * L;
        if (step < left) { w.k += step / L; step = 0; } else { step -= left; w.i++; w.k = 0; if (w.i >= w.pts.length - 1) { w.pts = null; w.m.visible = false; } }
      }
      if (!w.pts) continue;
      const [ax, az] = w.pts[w.i], [bx, bz] = w.pts[w.i + 1];
      w.x = ax + (bx - ax) * w.k; w.z = az + (bz - az) * w.k;
      w.m.position.set(w.x, 0, w.z); w.m.rotation.y = Math.atan2(bx - ax, bz - az);
      animateCharacter(w.m, w.speed, t, { distance: Math.hypot(w.x - p.x, w.z - p.z) });
    }
  }

  return {
    rickshaws: rick,
    /** Moves traffic and passers-by; parks or drives the e-rickshaws. Returns where a riding player sits, or null. */
    update(dt, t, p, day) {
      updateCars(dt, p, day.bus);
      updateWalkers(dt, t, p);
      for (const v of VENDORS) if (v.model) animateCharacter(v.model, 0, t, { distance: Math.hypot(v.x - p.x, v.z - p.z) });
      const r = day.player.riding, from = r ? (r.to === 'jantar' ? 'cp' : 'jantar') : null;
      let seat = null;
      for (const [id, k] of Object.entries(rick)) {
        animateCharacter(k.driver, 0, t, { seated: true, distance: Math.hypot(k.m.position.x - p.x, k.m.position.z - p.z) });
        if (id === from) {
          const want = Math.atan2(r.dx, r.dz), d = Math.atan2(Math.sin(want - k.yaw), Math.cos(want - k.yaw));
          k.yaw += d * Math.min(1, dt * 5);
          k.m.position.set(day.player.x, 0, day.player.z); k.m.rotation.y = k.yaw;
          k.m.updateMatrixWorld();
          const s = new THREE.Vector3(0, 0.2, -0.75).applyMatrix4(k.m.matrixWorld);
          seat = { x: s.x, y: s.y, z: s.z, yaw: k.yaw };
          k.away = true;
        } else if (k.away && Math.hypot(k.m.position.x - p.x, k.m.position.z - p.z) > 6) {
          // Back to its stand once you're off and walking: nobody watches the empty rickshaw drive home.
          k.away = false; k.yaw = k.home.yaw; k.m.position.set(k.home.x, 0, k.home.z); k.m.rotation.y = k.yaw;
        }
      }
      return seat;
    },
  };
}
