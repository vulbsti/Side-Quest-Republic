// The place dares on screen (engine: places.js via rules.js placeView). The people and props at each fast-travel
// place, what a running dare moves (monkeys, the park guard, the airport bus, Janpath's cars), what the player
// holds, a small HUD panel with the clock and the meter, and the bubbles of whoever speaks.
// The engine decides everything; this only draws it. Nothing here blocks the player (no obstacles), so the
// verifier's world snapshot is unchanged. main.js calls in through four hooks: line, cue, update, and creation.

const DRAW = 75; // people further than this are not drawn or animated
const RING = 3; // target rings at most
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const D = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
/** A quick flash in the middle of the screen for a dare's beats. */
const FLASH = { lunge: 'KAT!', miss: 'BACH GAYA!', wobble: 'SAMBHAL!', horn: 'HORN!', watching: 'STATUE!', away: 'AB!', reel: 'REEL MEIN!', whistle: 'PHREEE!', win: 'HO GAYA!', fail: 'GAYA KAAM SE' };
const FAIL_WHY = { monkey: 'Bandar le gaya', drop: 'Thaliyan giri', guard: 'Guard ne pakda', honk: 'Gaadi aa gayi', spotted: 'Guard ne dekha', missed: 'Bus nikal gayi', didi: 'Didi le gayi', loot: 'Loot gaye', gone: 'Deal gaya', slow: 'Time khatam', left: 'Dare chhoda', hands: 'Haath bhare', quit: 'Chhod diya', interrupted: '' };

export function createPlacesUI({ THREE, world, R, makeCharacter, animateCharacter, cube, cylinder, ball, sign, getDay, getPlayer, bubble, audio }) {
  const L = R.PLACE_LAYOUT, NAMES = R.PLACE_NAMES ?? {};
  const scene = world.scene;
  const $ = (q) => document.querySelector(q);
  const people = []; // { m, x, z, who, yaw, action, seated, phone }
  const anchors = []; // { who, x, z, y, model }: who can speak in a bubble
  const face = (m, to) => { m.rotation.y = Math.atan2(to.x - m.position.x, to.z - m.position.z); };

  function person(who, at, look, opts = {}) {
    const m = makeCharacter(opts.look ?? { variant: opts.variant ?? 'vendor' });
    m.position.set(at.x, 0, at.z);
    if (look) face(m, look);
    m.name = `Place: ${who}`;
    scene.add(m);
    const p = { m, who, x: at.x, z: at.z, action: opts.action ?? '', seated: !!opts.seated, gesture: opts.gesture ?? '', speed: 0 };
    people.push(p);
    anchors.push({ who, get x() { return m.position.x; }, get z() { return m.position.z; }, y: 0, model: m });
    return p;
  }
  function board(text, at, yaw, { w = 2.4, h = 0.5, y = 2.4, bg = '#183e33', fg = '#f6eed7', pole = true } = {}) {
    const b = sign(text, w, h, bg, fg);
    b.position.set(at.x, y, at.z); b.rotation.y = yaw; scene.add(b);
    if (pole) { const p = cylinder(0.04, 0.04, y, '#4c5a50', at.x, y / 2, at.z); scene.add(p); }
    return b;
  }
  function sprite(text, color, size = 0.5) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 128;
    const a = c.getContext('2d');
    a.fillStyle = color; a.beginPath(); a.roundRect(8, 16, 240, 96, 30); a.fill();
    a.fillStyle = '#fff'; a.font = 'bold 64px sans-serif'; a.textAlign = 'center'; a.textBaseline = 'middle'; a.fillText(text, 128, 66);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true }));
    s.scale.set(size * 2, size, 1); s.renderOrder = 10;
    scene.add(s);
    return s;
  }
  const yawTo = (a, b) => Math.atan2(b.x - a.x, b.z - a.z);
  const group = (at, yaw = 0) => { const g = new THREE.Group(); g.position.set(at.x, 0, at.z); g.rotation.y = yaw; scene.add(g); return g; };

  // --- Palika Bazaar: the ₹99 Ray-Ban hawker and the didi who'll buy it if you don't -----------------
  const C = L.chashma;
  person('hawker', C.hawker, C.start, { variant: 'vendor' });
  person('didi', C.didi, C.hawker, { variant: 'student-kurti', gesture: 'phone' });
  {
    const g = group(C.tray, yawTo(C.tray, C.start));
    cube(1.1, 0.06, 0.7, '#2b2b2f', 0, 1.0, 0, g); cylinder(0.03, 0.03, 1, '#55595c', 0, 0.5, 0, g);
    for (let i = 0; i < 8; i++) { const x = -0.42 + (i % 4) * 0.28, z = i < 4 ? -0.15 : 0.15; cube(0.18, 0.05, 0.07, i % 3 ? '#121214' : '#7a4a1a', x, 1.06, z, g); }
    const b = sign('RAY-BAN ORIGINAL · ₹999', 1.6, 0.32, '#b3261e', '#fff3c4'); b.position.set(0, 1.45, -0.3); g.add(b);
  }

  // --- Hanuman Mandir: prasad counter, the saffron flag, the bell, the joota ghar, three monkeys -------
  const H = L.laddoo;
  person('halwai', H.counter, H.start, { variant: 'vendor' });
  {
    const g = group(H.counter, yawTo(H.counter, H.start));
    cube(1.6, 0.9, 0.6, '#c9b48a', 0, 0.45, 0.6, g);
    for (let i = 0; i < 9; i++) ball(0.07, '#f29a1e', -0.5 + (i % 5) * 0.25, 0.97, 0.5 + (i < 5 ? 0 : 0.15), g);
    const b = sign('PRASAD · LADDOO ₹51', 1.6, 0.34, '#e8731b', '#fff8e0'); b.position.set(0, 1.55, 0.95); g.add(b);
  }
  // The saffron flag on its tall pole, waving.
  const flag = (() => {
    scene.add(cylinder(0.05, 0.06, 7.5, '#d9d2c0', H.flag.x, 3.75, H.flag.z));
    const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.lineTo(1.9, -0.55); shape.lineTo(0, -1.1); shape.lineTo(0, 0);
    const m = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshStandardMaterial({ color: '#ff8a1a', side: THREE.DoubleSide, roughness: 0.8 }));
    m.position.set(H.flag.x, 7.4, H.flag.z); scene.add(m);
    return m;
  })();
  // The bell at the gate: two posts, a bar, a brass bell that swings when someone rings it.
  const bell = (() => {
    const g = group(H.gate, yawTo(H.gate, H.start) + Math.PI / 2);
    cylinder(0.05, 0.05, 2.8, '#7a6a4a', -0.7, 1.4, 0, g); cylinder(0.05, 0.05, 2.8, '#7a6a4a', 0.7, 1.4, 0, g);
    cube(1.6, 0.08, 0.08, '#7a6a4a', 0, 2.8, 0, g);
    const pivot = new THREE.Group(); pivot.position.set(0, 2.76, 0); g.add(pivot);
    const b = cylinder(0.08, 0.2, 0.3, '#c9a227', 0, -0.25, 0, pivot); b.material = new THREE.MeshStandardMaterial({ color: '#c9a227', metalness: 0.7, roughness: 0.35 });
    cylinder(0.01, 0.01, 0.12, '#5b4a1a', 0, -0.06, 0, pivot);
    return { pivot, swing: 0 };
  })();
  {
    const g = group(H.goal, yawTo(H.goal, H.start));
    cube(2.2, 1.3, 0.45, '#8b6b45', 0, 0.65, 0.9, g);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) cube(0.22, 0.08, 0.3, ['#222', '#7a3b1e', '#c8c2b6'][(i + j) % 3], -0.85 + i * 0.34, 0.35 + j * 0.5, 0.85, g);
    const b = sign('JOOTA GHAR · FREE', 1.8, 0.34, '#7a1f1f', '#fff1d6'); b.position.set(0, 1.65, 0.9); g.add(b);
  }
  function monkey(at) {
    const g = group(at);
    const fur = '#8a6a48';
    const body = ball(0.24, fur, 0, 0.32, 0, g, 1, 1.25, 1);
    ball(0.15, fur, 0, 0.68, 0.08, g); ball(0.09, '#d8a98a', 0, 0.66, 0.2, g, 1, 0.8, 0.6);
    const tail = cylinder(0.025, 0.035, 0.7, fur, 0, 0.42, -0.3, g); tail.rotation.x = -0.9;
    for (const s of [-1, 1]) { const arm = cylinder(0.04, 0.04, 0.34, fur, s * 0.2, 0.32, 0.1, g); arm.rotation.x = 0.4; }
    g.name = 'Place: bandar';
    const m = { g, body, home: { x: at.x, z: at.z }, mark: sprite('!', '#ff3d00', 0.5) };
    m.mark.visible = false;
    anchors.push({ who: 'bandar', get x() { return g.position.x; }, get z() { return g.position.z; }, y: -0.9, model: g });
    return m;
  }
  const monkeys = H.monkeys.map(monkey);

  // --- Bangla Sahib: the langar door with its gold dome, the sarovar's blue edge, three pangat rows ------
  const B = L.langar;
  { // the sevadar, in an orange patka (on his head bone where the rig has one)
    const sv = person('sevadar', B.sevadar, B.start, { variant: 'uncle' }).m, head = sv.userData?.bones?.Head;
    const top = new THREE.Vector3(0, 1.66, 0);
    if (head) { sv.updateMatrixWorld(true); head.getWorldPosition(top); sv.worldToLocal(top); top.y += 0.1; }
    sv.add(cylinder(0.105, 0.11, 0.12, '#ff7a1a', top.x, top.y, top.z));
  }
  {
    const g = group({ x: B.sevadar.x + 1.4, z: B.sevadar.z - 1.4 }, yawTo(B.sevadar, B.start));
    cube(1.6, 2.6, 1.2, '#f4f1ea', 0, 1.3, 0, g);
    const dome = ball(0.62, '#e0b23a', 0, 2.75, 0, g, 1, 1.15, 1); dome.material = new THREE.MeshStandardMaterial({ color: '#e0b23a', metalness: 0.8, roughness: 0.3 });
    const tip = cylinder(0.01, 0.06, 0.6, '#e0b23a', 0, 3.6, 0, g); tip.material = dome.material;
    const b = sign('LANGAR HALL', 1.3, 0.28, '#1d3c8f', '#fff'); b.position.set(0, 2.1, 0.61); g.add(b);
    // The sarovar's blue water, a strip of it with its marble edge, north of the pangat.
    const w = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.2), new THREE.MeshStandardMaterial({ color: '#3d8fc9', roughness: 0.15, metalness: 0.2 }));
    w.rotation.x = -Math.PI / 2; w.position.set(-421, 0.04, 71.2); scene.add(w);
    scene.add(cube(6.4, 0.1, 0.25, '#f2efe6', -421, 0.05, 70.5));
  }
  B.rows.forEach((r, i) => {
    const yaw = yawTo(r, B.start) + Math.PI / 2;
    const g = group(r, yaw);
    const mat = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.9), new THREE.MeshStandardMaterial({ color: i % 2 ? '#7a1f2b' : '#1f4f7a', roughness: 1 }));
    mat.rotation.x = -Math.PI / 2; mat.position.y = 0.02; g.add(mat);
    for (const s of [-1, 1]) {
      const at = new THREE.Vector3(s * 1.1, 0, -0.1).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw).add(new THREE.Vector3(r.x, 0, r.z));
      const p = person('pangat', { x: at.x, z: at.z }, B.start, { variant: s < 0 ? 'student-kurti' : 'uncle', seated: true });
      p.m.position.y = -0.45;
      cylinder(0.2, 0.17, 0.03, '#c9ced3', s * 1.1, 0.03, 0.35, g); // the thali in front of them
    }
  });

  // --- Central Park: three couples making reels, the park guard --------------------------------------
  const P = L.photobomb;
  const couples = P.couples.map((c, i) => {
    const cam = person('couple', c.cam, c.pose, { variant: i % 2 ? 'student-tee-f' : 'student-hoodie', gesture: 'phone' });
    const a = person('couple', { x: c.pose.x - 0.4, z: c.pose.z }, c.cam, { variant: i % 2 ? 'student-tee' : 'student-kurti', action: i === 1 ? 'Dance' : 'Wave' });
    const b = person('couple', { x: c.pose.x + 0.4, z: c.pose.z }, c.cam, { variant: i === 2 ? 'aunty' : 'student-shirt-f', action: 'Wave' });
    const rec = sprite('● REC', '#e0202e', 0.32); rec.position.set(c.cam.x, 2.35, c.cam.z);
    return { cam, a, b, rec };
  });
  const guard = person('guard', P.guard, P.start, { variant: 'constable' });

  // --- Janpath: the kurta stall, the shop across the road, cars when the lane runs ------------------
  const K = L.kurta;
  person('dukaan', K.stall, K.start, { variant: 'vendor' });
  person('dukaan', K.shop, K.goal, { variant: 'uncle' });
  {
    const g = group({ x: K.stall.x + 0.6, z: K.stall.z + 0.4 }, yawTo(K.stall, K.start));
    cube(1.8, 0.8, 0.8, '#6b4a2a', 0, 0.4, 0, g);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) cube(0.5, 0.08, 0.4, ['#e84a7a', '#2a9d8f', '#f4a261', '#7b4bd1'][(i + j) % 4], -0.6 + j * 0.6, 0.84 + i * 0.09, 0, g);
    const b = sign('JANPATH · KURTE ₹299', 1.8, 0.34, '#7b4bd1', '#fff'); b.position.set(0, 1.9, 0); g.add(b);
    board('KURTA HOUSE · SALE', { x: K.shop.x - 0.8, z: K.shop.z + 0.6 }, yawTo(K.shop, K.start), { w: 2, h: 0.4, y: 2.6, bg: '#b3261e', fg: '#fff3c4' });
  }
  const carKit = (color) => {
    const g = new THREE.Group();
    cube(1.7, 0.6, 4, color, 0, 0.6, 0, g); cube(1.5, 0.5, 2, '#2b3a44', 0, 1.1, -0.2, g);
    for (const [x, z] of [[-0.8, 1.3], [0.8, 1.3], [-0.8, -1.3], [0.8, -1.3]]) { const w = cylinder(0.3, 0.3, 0.2, '#1c1c1c', x, 0.3, z, g); w.rotation.z = Math.PI / 2; }
    g.visible = false; scene.add(g); return g;
  };
  const laneCars = K.lanes.map((_, i) => [carKit(i ? '#f2c230' : '#e8e8e8'), carKit(i ? '#9b1c1c' : '#2f7d32')]);

  // --- Rivoli: the zip wala, the button wala, the darzi with his machine ------------------------------
  const Z = L.darzi;
  person('darzi', Z.darzi, Z.start, { variant: 'uncle' });
  person('zip', { x: Z.stalls.zip.x + 0.8, z: Z.stalls.zip.z + 0.6 }, Z.stalls.zip, { variant: 'vendor' });
  person('button', { x: Z.stalls.button.x + 0.9, z: Z.stalls.button.z - 0.3 }, Z.stalls.button, { variant: 'student-kurta' });
  {
    const g = group({ x: Z.darzi.x - 0.9, z: Z.darzi.z - 0.4 }, yawTo(Z.darzi, Z.start));
    cube(0.9, 0.75, 0.55, '#5b4632', 0, 0.38, 0, g); cube(0.45, 0.25, 0.18, '#1b1b1b', 0, 0.88, 0, g); cube(0.08, 0.2, 0.1, '#1b1b1b', 0.2, 1.05, 0, g);
    board('DARZI · ALTER 5 MIN', { x: Z.darzi.x - 1.4, z: Z.darzi.z - 0.9 }, yawTo(Z.darzi, Z.start), { w: 1.8, h: 0.36, y: 2.3, bg: '#1f6f8b', fg: '#fff' });
    board('YKK ZIP · CHAIN', { x: Z.stalls.zip.x + 1.6, z: Z.stalls.zip.z + 0.9 }, yawTo(Z.stalls.zip, Z.start), { w: 1.5, h: 0.32, y: 2.2, bg: '#2a6b2f', fg: '#fff' });
    board('BUTTON · HOOK · ₹10', { x: Z.stalls.button.x + 1.6, z: Z.stalls.button.z - 0.6 }, yawTo(Z.stalls.button, Z.start), { w: 1.6, h: 0.32, y: 2.2, bg: '#8a3b12', fg: '#fff' });
  }

  // --- Patel Chowk: the gate, the bag scanner, the guard, the queue with an uncle at the front -------
  const Mt = L.metro;
  {
    const g = group(Mt.gate, yawTo(Mt.gate, Mt.start));
    cube(0.12, 2.3, 0.12, '#9aa3a6', -0.7, 1.15, 0, g); cube(0.12, 2.3, 0.12, '#9aa3a6', 0.7, 1.15, 0, g); cube(1.52, 0.14, 0.14, '#9aa3a6', 0, 2.3, 0, g);
    const s = sign('PATEL CHOWK · GATE 1', 1.8, 0.3, '#c61f2e', '#fff'); s.position.set(0, 2.6, 0); g.add(s);
    cube(0.9, 0.8, 1.4, '#3a4a55', 1.6, 0.4, -0.2, g); // the bag scanner
  }
  const mguard = person('guard', Mt.guard, Mt.queue[0], { variant: 'constable' });
  Mt.queue.forEach((q, i) => person('uncle', q, Mt.gate, { variant: ['uncle', 'student-tee-f', 'aunty', 'student-hoodie', 'student-kurta', 'student-kurti', 'vendor'][i % 7] }));

  // --- Shivaji Stadium: the airport bus in its bay, a stop board, the conductor in the door ----------
  const Bp = L.bus.path;
  const bus = (() => {
    const g = new THREE.Group(); g.name = 'Place: airport bus'; scene.add(g);
    const m = world.put ? world.put('delhi-bus', 0, 0, 0) : null;
    if (m) { scene.remove(m); g.add(m); m.position.set(0, 0, 0); m.rotation.y = 0; } else cube(2.6, 3, 10, '#2f6fbe', 0, 1.6, 0, g);
    const s = sign('AIRPORT EXPRESS · T3', 2.4, 0.4, '#e86a1a', '#fff'); s.position.set(-1.45, 2.6, 0.5); s.rotation.y = -Math.PI / 2; g.add(s);
    const door = cube(0.06, 1.9, 1.0, '#e5ff86', -1.42, 1.1, -2, g); door.material = new THREE.MeshBasicMaterial({ color: '#e5ff86', transparent: true, opacity: 0.55 });
    const c = makeCharacter({ variant: 'uncle' }); c.position.set(-1.1, 0.2, -2); c.rotation.y = -Math.PI / 2; g.add(c);
    people.push({ m: c, who: 'conductor', x: 0, z: 0, action: 'Wave', speed: 0, inBus: g });
    anchors.push({ who: 'conductor', get x() { return g.position.x; }, get z() { return g.position.z; }, y: 0, model: c });
    return { g, door };
  })();
  function parkBus() { bus.g.position.set(Bp[0].x, 0, Bp[0].z); bus.g.rotation.y = yawTo(Bp[0], Bp[1]); }
  parkBus();
  board('DTC · AIRPORT BAY', { x: L.bus.start.x + 1.5, z: L.bus.start.z + 1.6 }, 0, { w: 1.8, h: 0.36, y: 2.5, bg: '#2a6b2f', fg: '#fff' });

  // --- what the player holds during a dare ----------------------------------------------------------
  const held = {};
  function holding(id) {
    if (held[id]) return held[id];
    const g = new THREE.Group(); g.position.set(0, 1.08, 0.42);
    if (id === 'laddoo') { cylinder(0.14, 0.08, 0.06, '#3f7a2c', 0, 0, 0, g); for (let i = 0; i < 4; i++) ball(0.05, '#f29a1e', -0.06 + (i % 2) * 0.1, 0.06 + (i > 1 ? 0.06 : 0), (i % 2 ? 0.02 : -0.03), g); }
    if (id === 'langar') for (let i = 0; i < 6; i++) { const t = cylinder(0.21, 0.18, 0.035, '#c9ced3', 0, i * 0.045, 0, g); t.material = new THREE.MeshStandardMaterial({ color: '#c9ced3', metalness: 0.85, roughness: 0.25 }); }
    if (id === 'kurta') for (let i = 0; i < 9; i++) cube(0.42, 0.08, 0.32, ['#e84a7a', '#2a9d8f', '#f4a261', '#7b4bd1'][i % 4], (i % 3 - 1) * 0.02, i * 0.085, 0, g);
    if (id === 'darzi') cube(0.32, 0.06, 0.24, '#2e3e62', 0, 0, 0, g);
    g.visible = false;
    getPlayer()?.add(g);
    return (held[id] = g);
  }

  // --- target rings ---------------------------------------------------------------------------------
  const rings = Array.from({ length: RING }, () => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.06, 6, 28), new THREE.MeshBasicMaterial({ color: '#e5ff86', transparent: true, opacity: 0.85 }));
    m.rotation.x = -Math.PI / 2; m.visible = false; scene.add(m); return m;
  });

  // --- the HUD panel --------------------------------------------------------------------------------
  let root = null, els = {}, flashT = 0, coachT = 0, endT = 0, lastGame = null;
  function build() {
    if (root) return;
    root = document.createElement('div');
    root.id = 'placeDare';
    root.className = 'hidden';
    root.innerHTML = `<div class="pd-card"><small class="pd-place"></small><b class="pd-text"></b><div class="pd-big"></div><div class="pd-meter"><i></i></div><div class="pd-time"><i></i><span></span></div></div>
      <div class="pd-coach"></div><div class="pd-flash"></div>`;
    $('#hud').appendChild(root);
    for (const k of ['card', 'place', 'text', 'big', 'meter', 'time', 'coach', 'flash']) els[k] = root.querySelector('.pd-' + k);
    els.meterBar = els.meter.querySelector('i'); els.timeBar = els.time.querySelector('i'); els.timeText = els.time.querySelector('span');
  }
  function flash(text, cls = '', seconds = 0.9) { build(); els.flash.textContent = text; els.flash.className = 'pd-flash on ' + cls; flashT = seconds; }
  function coachLine(text, seconds = 3) { build(); els.coach.textContent = text; els.coach.classList.add('on'); coachT = seconds; }

  /** A line from places.js (present.js channel 'place'): a bubble over whoever says it, or the coach strip. */
  function line(e) {
    if (!e.text) return;
    if (e.who === 'coach') { coachLine(e.text); return; }
    let best = null, bd = 1e9;
    for (const a of anchors) if (a.who === e.who && a.model.visible) { const d = e.pos ? D(a, e.pos) : 0; if (d < bd) { bd = d; best = a; } }
    const name = (NAMES[e.who] || e.who).toUpperCase();
    if (best && bd < 10) bubble(`place:${e.who}`, best, name, e.text, 4.5);
    else coachLine(`${NAMES[e.who] || e.who}: ${e.text}`); // nobody drawn there (the auto wala's horn): the strip
  }

  /** Engine cues: a dare's beats, its start, win and fail. */
  function cue(c) {
    const d = c.data || {}, n = c.cue;
    if (n === 'place:monkey') { if (d.what === 'lunge') { flash(FLASH.lunge, 'warn', 0.7); audio.cue('crowd-gasp', { pos: c.pos }); } else if (d.what === 'miss') flash(FLASH.miss, 'good', 0.8); }
    else if (n === 'place:wobble') flash(FLASH.wobble, 'warn', 0.8);
    else if (n === 'place:serve') { flash(`PANGAT ${d.row}/3`, 'good', 0.9); audio.cue('phone-chat'); }
    else if (n === 'place:photobomb') { flash(`${FLASH.reel} ${d.n}/3`, 'good', 1); audio.cue('clip-posted'); }
    else if (n === 'place:whistle') { flash(FLASH.whistle, 'warn', 0.8); audio.cue('chase-start', { pos: c.pos }); }
    else if (n === 'place:traffic') { flash(FLASH.horn, 'warn', 0.6); audio.cue('bus-horn', { pos: c.pos }); }
    else if (n === 'place:stall') { flash(`${d.k}/3`, 'good', 0.7); audio.cue('phone-chat'); }
    else if (n === 'place:guard') flash(d.watching ? FLASH.watching : FLASH.away, d.watching ? 'bad' : 'good', 0.7);
    else if (/^action:\w+:start$/.test(n) && d.place) { bell.swing = d.place === 'hanuman' ? 1 : bell.swing; audio.cue('scene-start'); }
    else if (/^action:\w+:win$/.test(n) && d.place) { flash(FLASH.win, 'good', 1.3); endT = 1.5; if (d.place === 'hanuman') bell.swing = 1.4; }
    else if (/^action:\w+:fail$/.test(n) && d.place && d.why !== 'interrupted') { flash(FAIL_WHY[d.why] || FLASH.fail, 'bad', 1.6); endT = 1.5; }
  }

  // --- each frame -----------------------------------------------------------------------------------
  const lerp = (a, b, k) => a + (b - a) * k;
  function update(dt, t) {
    const day = getDay(), pl = getPlayer();
    if (!day || !pl) return;
    const me = { x: pl.position.x, z: pl.position.z };
    const v = R.placeView(day), g = v.game;
    // People: drawn and animated only near the player.
    for (const p of people) {
      const at = p.inBus ? bus.g.position : p.m.position, d = D(at, me);
      if (!p.inBus) p.m.visible = d < DRAW;
      if (d < DRAW) animateCharacter(p.m, p.speed || 0, t, { action: p.action, seated: p.seated, gesture: p.gesture, distance: d });
    }
    flag.rotation.y = Math.sin(t * 1.3) * 0.25;
    if (bell.swing > 0) { bell.swing = Math.max(0, bell.swing - dt * 0.5); bell.pivot.rotation.z = Math.sin(t * 9) * 0.5 * bell.swing; }
    // Monkeys: where the engine has them while the dare runs; otherwise sitting at home, scratching.
    monkeys.forEach((m, i) => {
      const s = g?.id === 'laddoo' ? g.monkeys[i] : null, at = s ?? m.home;
      m.g.position.x = lerp(m.g.position.x, at.x, s?.lunge === 'dash' ? 1 : Math.min(1, dt * 12));
      m.g.position.z = lerp(m.g.position.z, at.z, s?.lunge === 'dash' ? 1 : Math.min(1, dt * 12));
      m.g.visible = D(m.g.position, me) < DRAW;
      if (s && s.state === 'run') face(m.g, me);
      m.body.scale.y = s?.lunge === 'windup' ? 0.95 : 1.25 + Math.sin(t * 3 + i) * 0.03;
      m.g.rotation.x = s?.lunge === 'dash' ? 0.6 : 0;
      m.g.position.y = s?.state === 'sulk' ? 0 : s?.lunge === 'dash' ? 0.25 : Math.abs(Math.sin(t * (s?.state === 'run' ? 14 : 0.7) + i)) * (s?.state === 'run' ? 0.15 : 0.02);
      m.mark.visible = s?.lunge === 'windup';
      m.mark.position.set(m.g.position.x, 1.35, m.g.position.z);
    });
    // Central Park: REC lights, the guard walks to where the engine has him.
    couples.forEach((c, i) => { c.rec.visible = !!g && g.id === 'photobomb' && !g.done[i] && g.rec[i]; c.rec.material.opacity = c.rec.visible ? 0.6 + 0.4 * Math.abs(Math.sin(t * 5)) : 1; });
    {
      const at = g?.id === 'photobomb' ? g.guard : P.guard, gd = D(guard.m.position, at);
      guard.speed = gd > 0.02 ? Math.min(3, gd / Math.max(dt, 1e-3)) : 0;
      guard.m.position.set(at.x, 0, at.z);
      face(guard.m, g?.id === 'photobomb' && g.awake ? me : P.start);
    }
    // Patel Chowk: the guard looks at the queue, or down at the bag scanner.
    if (g?.id === 'metro') { mguard.m.rotation.y = g.watching ? yawTo(Mt.guard, Mt.queue[1]) : yawTo(Mt.guard, Mt.queue[1]) + Math.PI * 0.6; mguard.action = g.watching ? '' : 'Talk'; }
    else { mguard.m.rotation.y = yawTo(Mt.guard, Mt.queue[1]); mguard.action = ''; }
    // Janpath: cars run down a lane while it is red, one waits honking while it is about to be.
    laneCars.forEach((cars, i) => {
      const lane = K.lanes[i], st = g?.id === 'kurta' ? g.lanes[i] : null, x = (lane.x0 + lane.x1) / 2, dir = i ? -1 : 1;
      cars.forEach((c, k) => {
        if (!st || st.phase === 'clear') { c.visible = false; return; }
        c.visible = true; c.rotation.y = dir > 0 ? 0 : Math.PI;
        if (st.phase === 'horn') c.position.set(x, 0, K.goal.z - dir * (14 + k * 6));
        else { const run = 1 - st.left / 2.6; c.position.set(x, 0, K.goal.z - dir * (14 + k * 6) + dir * run * 40); }
      });
    });
    // Shivaji: the bus drives out while the dare runs, and is back in its bay after.
    if (g?.id === 'bus') { bus.g.position.set(g.bus.x, 0, g.bus.z); bus.g.rotation.y = g.bus.yaw; bus.door.visible = true; }
    else { if (!endT) parkBus(); bus.door.visible = false; }
    // What the player holds.
    for (const [id, h] of Object.entries({ laddoo: 1, langar: 1, kurta: 1, darzi: 1 })) if (h) { const o = holding(id); o.visible = g?.id === id; if (id === 'langar' && o.visible) o.rotation.z = Math.sin(t * 13) * 0.35 * (g.meter ?? 0); }
    // Target rings where the dare wants you next.
    const T = [];
    if (g) {
      if (g.id === 'laddoo') T.push(H.goal);
      if (g.id === 'langar') T.push(B.rows[g.row]);
      if (g.id === 'photobomb') P.couples.forEach((c, i) => { if (!g.done[i]) T.push(c.pose); });
      if (g.id === 'kurta') T.push(K.goal);
      if (g.id === 'darzi') T.push(Z.stalls[g.next]);
      if (g.id === 'metro') T.push(Mt.gate);
      if (g.id === 'bus') T.push(g.door);
      if (g.id === 'chashma') T.push(g.phase === 'deal' ? C.hawker : { x: C.hawker.x + 7, z: C.hawker.z - 7 });
    }
    rings.forEach((r, i) => { const p = T[i]; r.visible = !!p; if (p) { r.position.set(p.x, 0.06 + Math.sin(t * 4 + i) * 0.03, p.z); r.scale.setScalar(1 + Math.sin(t * 5) * 0.08); } });
    hud(dt, v, g);
  }

  function hud(dt, v, g) {
    if (flashT > 0 && (flashT -= dt) <= 0) els.flash?.classList.remove('on');
    if (coachT > 0 && (coachT -= dt) <= 0) els.coach?.classList.remove('on');
    if (endT > 0) endT = Math.max(0, endT - dt);
    if (!g) { if (root && !endT) root.classList.add('hidden'); lastGame = null; return; }
    build();
    root.classList.remove('hidden');
    if (lastGame !== g.id) {
      lastGame = g.id;
      els.place.textContent = `${(R.DESTINATIONS?.[g.place]?.name ?? g.place).toUpperCase()} · DARE`;
      els.text.textContent = R.PLACE_DARES.find((d) => d.id === g.id)?.text ?? '';
    }
    const big = g.id === 'chashma' ? `₹${g.price}` : g.id === 'darzi' ? `${g.minutes.toFixed(1)} min` : g.id === 'photobomb' ? `${g.done.filter(Boolean).length}/3 reels` : g.id === 'langar' ? `Pangat ${Math.min(3, g.row + 1)}/3` : g.id === 'metro' ? (g.watching ? 'GUARD DEKH RAHA' : 'BAG CHECK') : g.id === 'bus' ? `${Math.round(g.speed * 3.6)} km/h` : g.id === 'kurta' ? g.text : g.id === 'laddoo' ? 'Joota ghar tak' : '';
    els.big.textContent = big;
    els.big.className = 'pd-big' + (g.id === 'metro' ? (g.watching ? ' bad' : ' good') : '');
    const meter = g.meter ?? null;
    els.meter.classList.toggle('hidden', meter === null);
    if (meter !== null) { els.meterBar.style.width = `${Math.round(meter * 100)}%`; els.meter.classList.toggle('hot', meter > 0.65); els.meter.dataset.label = g.id === 'langar' ? 'WOBBLE' : 'PATIENCE'; }
    els.timeBar.style.width = `${Math.max(0, (g.left / g.limit) * 100)}%`;
    els.timeText.textContent = clock(Math.ceil(g.left));
    els.time.classList.toggle('late', g.left < 8);
  }

  return { line, cue, update };
}
