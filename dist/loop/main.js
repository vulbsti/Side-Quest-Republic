// Client for the looping day: draws the rules' world state in the 3D city.
// The rules (rules.js) decide what happens; this file only shows it and turns keys into actions.
// Every engine field beyond the original loop is read defensively through S (below), so this
// client runs against both the old engine and the slice-spec engine (plans/slice-spec.md).
import { THREE, buildWorld, cube, ball, cylinder, sign, mat } from '../world.js?v=27';
import { expandWorld } from '../world-expansion.js?v=27';
import { enhanceEnvironment } from '../environment-detail.js?v=27';
import { loadCharacters, makeCharacter, animateCharacter, CARRY_POSES } from '../characters.js?v=27';
import { Simulation, clamp, dist, steer, visible, separateBodies } from '../simulation.js?v=27';
import { warmupRenderer } from '../render-warmup.js?v=27';
import * as R from './rules.js?v=5';
import { PEOPLE, TALK, AGAIN, HINTS, LINKS, ENDINGS, RUMOURS, AMBIENT } from './content.js?v=5';
import { createLighting } from './lighting.js?v=1';
import {
  createProps, GROUP_LOOK, makeHeldFlag, makeHeldPlacard, waveFlag, makeTintable, equipRAF, setShield,
  equipScarf, equipCap, equipProvocateur, BARRICADE_LINES,
} from './props.js?v=1';
import { createCinematic } from './cinematic.js?v=1';
import { createPhone } from './phone-ui.js?v=1';

const { createDay, tick, act, talkState, drainEvents, finish, levers, moods, isFree, clockText, placeAt, SPOTS, PLACES, at, advance } = R;
const $ = (s) => document.querySelector(s);
const QS = new URLSearchParams(location.search);
const LONG = QS.has('long'), DEV = QS.has('dev') || QS.has('demo'), DEMO = QS.has('demo');
const STEP = 0.1;
const CROWD_POOL = 52, CONSTABLES = 8, RAF_POOL = 10, CREW_POOL = 8, PROV_POOL = 3, KIDS = 4;
const SAVE_KEY = 'sqr-loop-v1';
const OBJECTS = ['speaker', 'key', 'megaphone', 'phone', 'water'];
const HEAVY = ['speaker', 'water'];
const POSE = { speaker: 'speaker', water: 'water', key: 'key', phone: 'phone', megaphone: 'key' };
const PHASE_NAME = { morning: 'Morning', midday: 'Midday', tense: 'Tense', showdown: 'Showdown', aftermath: 'Aftermath' };
const PHASE_LINE = {
  morning: 'Calm and silly. Constables lounging, volunteers setting up.',
  midday: 'It fills up. Party workers and the counter-group arrive. Police get orders.',
  tense: 'Barricades and RAF. Provocateurs in the crowd. The water cannon is coming.',
  showdown: 'Tear gas and lathis. Where it breaks out, and who they go after, is partly on you.',
  aftermath: 'Dusk. The detention bus is loading. Find your people.',
};
const clockMinutes = R.clockMinutes ?? ((t) => 600 + t / 1.25);
const phaseFromClock = (m) => (m < 720 ? 'morning' : m < 840 ? 'midday' : m < 960 ? 'tense' : m < 1020 ? 'showdown' : 'aftermath');

// ?long: the owner's full-day tempo. The engine exports a tempo setter; call it if present.
if (LONG) (R.setTempo ?? R.setSecondsPerMinute)?.(4.0);

// --- optional content and integrations (the writing, audio and asset workstreams) ---------
const optional = async (path) => { try { return await import(path); } catch { return null; } };
let SCENES = {}, BARKS = null, CALLBACK_BARKS = {}, REAL_REELS = [], PHONE = { CAPTIONS: {}, CHAT: {}, TICKER: {}, REAL: null }, demo = null;
/** Audio swap point: the audio workstream provides cue(name, data), phase(name), music(name), chase(on). */
let audio = { cue() {}, phase() {}, music() {}, chase() {} };
async function loadOptional() {
  const [sc, bk, ph, au, mo, dm] = await Promise.all([
    optional('./scenes.js'), optional('./barks.js'), optional('./phone.js'), optional('./audio.js'), optional('./models.js'),
    DEMO ? optional('./dev-demo.js') : null,
  ]);
  demo = dm;
  SCENES = sc?.SCENES ?? dm?.SCENES ?? {};
  BARKS = bk?.BARKS ?? dm?.BARKS ?? null;
  CALLBACK_BARKS = bk?.CALLBACK_BARKS ?? {};
  REAL_REELS = ph?.REAL_REELS ?? [];
  PHONE = {
    CAPTIONS: ph?.CAPTIONS ?? dm?.CAPTIONS ?? {}, CHAT: ph?.CHAT ?? dm?.CHAT ?? {}, TICKER: ph?.TICKER ?? dm?.TICKER ?? {},
    // Clip kinds that recreate a real reel: from REAL_REELS ids ('real-bus-key' -> 'bus-key') plus the known ones.
    REAL: new Set([...(ph?.REAL_REELS ?? []).map((r) => String(r.id || '').replace(/^real-/, '')), 'bus-key', 'pester-cannon', 'cannon-dance', 'detain-me', 'chase']),
  };
  const a = au?.createAudio?.() ?? au?.default ?? au?.audio ?? null;
  if (a) setAudio(a);
  // Model swap point: models.js may export loadModels() -> { name: Object3D } (names as props.setModel).
  try {
    const models = (await mo?.loadModels?.()) ?? mo?.MODELS ?? null;
    if (models) for (const [name, obj] of Object.entries(models)) if (obj) props.setModel(name, obj);
  } catch (e) { console.warn('models.js could not be applied', e); }
}
function setAudio(a) {
  audio = { cue: a.cue?.bind(a) ?? (() => {}), phase: a.phase?.bind(a) ?? (() => {}), music: a.music?.bind(a) ?? (() => {}), chase: a.chase?.bind(a) ?? (() => {}) };
}

// --- engine reads (one place, so the lead can reconcile with rules.js) ------------------
const S = {
  phase: (d) => d.phase ?? R.phaseAt?.(d.t) ?? phaseFromClock(clockMinutes(d.t)),
  rep: (d) => d.player?.rep ?? null,
  crew: (d) => d.player?.crew ?? [],
  detained: (d) => !!d.player?.detained,
  chasedBy: (d) => d.player?.chasedBy ?? null,
  clips: (d) => d.player?.clips ?? [],
  officers: (d) => d.officers ?? null,
  groups: (d) => d.groups ?? {},
  provocateurs: (d) => d.provocateurs ?? [],
  director: (d) => d.director ?? null,
  scene: (d) => d.scene ?? null,
  flags: (d) => (Array.isArray(d.flags) ? d.flags : d.flags && typeof d.flags === 'object' ? Object.keys(d.flags).filter((k) => d.flags[k]) : []),
  barricades: (d) => d.police?.barricades ?? [],
  raf: (d) => d.police?.raf ?? 0,
  cues: (d) => (R.drainCues ? R.drainCues(d) : Array.isArray(d.cues) ? d.cues.splice(0) : []),
  opportunities: (d, pos) => { try { return R.opportunities ? R.opportunities(d, pos) : null; } catch (e) { console.warn(e); return null; } },
  ending: (d) => (d.ending && typeof d.ending === 'object' ? d.ending : R.endingCard?.(d) ?? R.buildEnding?.(d) ?? null),
};

let world, sim, day, mode = 'loading';
let playerModel, keys = {}, yaw = 0, pitch = 0.38, zoom = 9, dragging = false, lastMouse = null;
let accumulator = 0, last = 0, toastTime = 0, prompt = null, choices = null, ambientClock = 12, ambientTurn = 0;
let lighting, props, cine, phone, playerObstacles;
const bodies = {}; // person id -> { model, x, z, y, speed, yaw }
const crowd = []; // pooled crowd bodies, retinted per group
const police = []; // constables and RAF jawans
const crew = [], provs = [], kids = [];
const bubbles = [];
const items = {};
let shuttle, shuttleObstacle, shuttleSigns;
const occluders = [];
const overhead = [];
let talked = {};
const ray = new THREE.Raycaster();
let memory = loadMemory();
let loopLinks = new Set();
let phaseNow = null, lastClips = 0, sceneShown = null, stung = new Set(), detainedShown = false;
const officerById = new Map(); // engine officer id -> pool body

// --- memory that survives the loop ---------------------------------------

function loadMemory() {
  try {
    const m = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (m && Array.isArray(m.links)) return { loops: m.loops || 1, links: m.links, hints: m.hints || [], endings: m.endings || [], showdowns: m.showdowns || [] };
  } catch {}
  return { loops: 1, links: [], hints: [], endings: [], showdowns: [] };
}
function saveMemory() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(memory)); } catch {} }
function learnLink(id) {
  if (!LINKS[id]) return;
  loopLinks.add(id);
  if (memory.links.includes(id)) return;
  memory.links.push(id);
  saveMemory();
  const l = LINKS[id];
  toast(`New on the chaos board: ${l.from} → ${l.to}`, 5, true);
}
function learnHint(id) {
  if (!id || memory.hints.includes(id)) return false;
  memory.hints.push(id);
  saveMemory();
  return true;
}
const knownRumours = () => Object.entries(RUMOURS).filter(([, r]) => !r.unlock || memory.hints.includes(r.unlock)).map(([id]) => id);

// --- small props (objects people carry) -------------------------------------

function speakerModel() {
  const g = new THREE.Group();
  cube(0.75, 1, 0.5, '#263c33', 0, 0.55, 0, g);
  for (const y of [0.35, 0.8]) {
    const disk = cylinder(0.2, 0.2, 0.04, '#111e19', 0, y, 0.27, g, 24);
    disk.rotation.x = Math.PI / 2;
    ball(0.07, '#536558', 0, y, 0.3, g, 1, 1, 0.4);
  }
  cube(0.5, 0.04, 0.15, '#5b6f56', 0, 1.08, 0, g);
  g.userData.led = cube(0.1, 0.05, 0.02, '#d4e87a', 0.22, 1, 0.26, g);
  return g;
}
function keyModel() {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.045, 8, 20), mat('#e7c45b', 0.3));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.2; g.add(ring);
  cube(0.07, 0.06, 0.5, '#e7c45b', 0, 0.2, 0.34, g);
  cube(0.15, 0.06, 0.06, '#e7c45b', 0.05, 0.2, 0.5, g);
  return g;
}
function megaphoneModel() {
  const g = new THREE.Group();
  cylinder(0.08, 0.24, 0.5, '#f1ede0', 0, 0.3, 0.12, g, 18).rotation.x = Math.PI / 2;
  cylinder(0.25, 0.25, 0.04, '#c8402f', 0, 0.3, 0.38, g, 18).rotation.x = Math.PI / 2;
  cube(0.07, 0.22, 0.08, '#2c2c2c', 0, 0.16, -0.02, g);
  return g;
}
function phoneModel() {
  const g = new THREE.Group();
  cube(0.12, 0.02, 0.24, '#121b1f', 0, 0.02, 0, g);
  cube(0.1, 0.005, 0.2, '#5d8fb0', 0, 0.033, 0, g);
  cube(0.02, 0.02, 0.4, '#e6e6e6', 0.03, 0.02, -0.3, g);
  return g;
}
function waterModel() {
  const g = new THREE.Group();
  cube(0.7, 0.36, 0.5, '#2d6fa3', 0, 0.18, 0, g);
  for (let i = 0; i < 6; i++) cylinder(0.07, 0.07, 0.34, '#bfe3f2', -0.22 + (i % 3) * 0.22, 0.5, i < 3 ? -0.11 : 0.11, g, 8);
  return g;
}
function placeProps() {
  world.put('chai-cart', -18, -36, 0.3);
  world.obstacles.push({ id: 'cp-chai', x: -18, z: -36, w: 3, d: 2, h: 3 });
  for (const z of [-10.5, -7.5, -1.5, 1.5]) {
    world.put('barricade', 40, z, Math.PI / 2);
    world.obstacles.push({ id: 'loop-barricade', x: 40, z, w: 0.7, d: 3, h: 1.3 });
  }
  for (const [text, x, z, r] of [['PARLIAMENT STREET →', 50, -9, -Math.PI / 2], ['CP SHUTTLE STOP', 4, -38.5, 0], ['JANTAR MANTAR STOP', 4, 5.5, 0]]) {
    const s = sign(text, 3.4, 0.6);
    s.position.set(x, 2.6, z); s.rotation.y = r;
    world.scene.add(s);
    cylinder(0.05, 0.05, 2.6, '#4c5a50', x, 1.3, z, world.scene);
  }
  // Sana's first-aid tent beside the stage.
  const tent = new THREE.Group();
  for (const [dx, dz] of [[-1.3, -1], [1.3, -1], [-1.3, 1], [1.3, 1]]) cylinder(0.04, 0.04, 2.3, '#cfd5d2', dx, 1.15, dz, tent);
  cube(2.9, 0.08, 2.3, '#f3f1ea', 0, 2.32, 0, tent);
  cube(0.5, 0.14, 0.04, '#c8402f', 0, 2.1, 1.17, tent);
  cube(0.14, 0.5, 0.04, '#c8402f', 0, 2.1, 1.17, tent);
  cube(1.2, 0.7, 0.6, '#dfe5e2', -0.6, 0.35, -0.6, tent);
  tent.position.set(SPOTS.sanaTent.x - 1.2, 0, SPOTS.sanaTent.z - 0.4);
  world.scene.add(tent);
  // The shuttle; from the tense phase it is the detention bus, and says so.
  shuttle = world.bus;
  const i = world.obstacles.findIndex((o) => o.id === 'legacy-bus');
  if (i >= 0) world.obstacles.splice(i, 1);
  shuttleObstacle = { id: 'shuttle', x: SPOTS.busCP.x, z: SPOTS.busCP.z, w: 2.8, d: 10, h: 3.4 };
  world.obstacles.push(shuttleObstacle);
  shuttle.rotation.y = 0;
  shuttleSigns = new THREE.Group();
  for (const side of [-1, 1]) { const s = sign('DELHI POLICE · DETENTION', 4.2, 0.5, '#f1f1ea', '#1d3d7a'); s.position.set(side * 1.45, 2.55, 0); s.rotation.y = side * Math.PI / 2; shuttleSigns.add(s); }
  shuttleSigns.visible = false;
  world.scene.add(shuttleSigns);

  items.speaker = speakerModel(); items.key = keyModel(); items.megaphone = megaphoneModel(); items.phone = phoneModel(); items.water = waterModel();
  const ringMat = new THREE.MeshBasicMaterial({ color: '#e5ff86', transparent: true, opacity: 0.8, side: THREE.DoubleSide });
  const ringGeo = new THREE.RingGeometry(0.55, 0.68, 32);
  for (const id of OBJECTS) {
    world.scene.add(items[id]);
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    world.scene.add(ring);
    items[id + 'Ring'] = ring;
  }
  items.ledOn = mat('#e5ff86', 0.4); items.ledOff = mat('#3b4a3f', 0.4);
}

// --- people ---------------------------------------------------------------

const OFFICER_NAME = { constable: 'CONSTABLE', raf: 'RAF JAWAN' };
const KIND_NAME = { students: 'STUDENT', party: 'RUP WORKER', sena: 'DRS', opp: 'LJM WORKER' };
function body(model, extra) {
  return { model, x: 0, z: 0, y: 0, speed: 0, yaw: 0, radius: 0.36, side: 1, phase: Math.random() * 6, ox: 0, oz: 0, flee: 0, fx: 0, fz: 0, react: '', reactT: 0, ...extra };
}
function makePeople() {
  for (const [id, p] of Object.entries(PEOPLE)) {
    if (p.voice) continue;
    const model = makeCharacter(p.look);
    world.scene.add(model);
    const s = day.people[id];
    bodies[id] = { id, model, x: s.x, z: s.z, y: 0, speed: 0, yaw: 0, radius: 0.4 };
  }
  const shirts = GROUP_LOOK.students.shirt;
  for (let i = 0; i < CROWD_POOL; i++) {
    const model = makeCharacter({ color: shirts[i % shirts.length] });
    const tint = makeTintable(model, shirts[i % shirts.length]);
    model.visible = false;
    world.scene.add(model);
    crowd.push(body(model, { idx: i, tint, kind: 'students', cluster: null, target: null, side: i % 2 ? 1 : -1, phase: i * 1.7, kit: {}, carry: false, fainted: 0 }));
  }
  for (let i = 0; i < CONSTABLES + RAF_POOL; i++) {
    const raf = i >= CONSTABLES;
    const model = makeCharacter({ police: true });
    if (raf) equipRAF(model);
    model.visible = false;
    world.scene.add(model);
    police.push(body(model, { idx: i, kind: raf ? 'raf' : 'constable', radius: 0.4, side: i % 2 ? 1 : -1, oid: null, posture: 'stand', label: OFFICER_NAME[raf ? 'raf' : 'constable'] }));
  }
  for (let i = 0; i < CREW_POOL; i++) {
    const c = ['#e5ff86', '#ff9cc4', '#8fd3ff', '#ffd34d', '#b8e0a0', '#f2a65a', '#c9b6ff', '#7fe0d0'][i];
    const model = makeCharacter({ color: c, backpack: i % 2 === 0 });
    model.visible = false; world.scene.add(model);
    const b = body(model, { idx: i, kind: 'crew', label: 'YOUR CREW' });
    if (i % 3 === 0) { b.kit = makeHeldPlacard(i + 3); model.add(b.kit); b.carry = 'key'; }
    crew.push(b);
  }
  for (let i = 0; i < PROV_POOL; i++) {
    const model = makeCharacter({ color: ['#3a3f45', '#4a4038', '#2f3a33'][i], gender: 'male' });
    equipProvocateur(model);
    model.visible = false; world.scene.add(model);
    provs.push(body(model, { idx: i, kind: 'prov', pid: null, label: 'MAN IN NEW SHOES' }));
  }
  for (let i = 0; i < KIDS; i++) {
    const model = makeCharacter({ color: ['#ffd34d', '#ff7aa8', '#7ad3ff', '#9be59b'][i] });
    model.scale.setScalar(0.64);
    model.visible = false; world.scene.add(model);
    kids.push(body(model, { idx: i, kind: 'kid', label: 'KID' }));
  }
}

/** Dress a pooled crowd body for a group: shirt colour, flag or placard, scarf, cap. */
function dress(b, kind) {
  if (b.kind === kind && b.dressed) return;
  b.kind = kind; b.dressed = true;
  const look = GROUP_LOOK[kind] || GROUP_LOOK.students;
  b.tint.set(look.shirt[b.idx % look.shirt.length]);
  for (const k of Object.values(b.kit)) k.visible = false;
  b.carry = false;
  const i = b.idx;
  const kit = (name, make) => { const o = (b.kit[name] ??= make()); o.visible = true; return o; };
  if (kind === 'students') {
    if (i % 4 === 0) { kit('placard', () => { const p = makeHeldPlacard(i); b.model.add(p); return p; }); b.carry = 'key'; }
  } else if (kind === 'party') {
    if (i % 2 === 0) { kit('flag-party', () => { const f = makeHeldFlag('party'); b.model.add(f); return f; }); b.carry = 'key'; }
    if (i % 3 === 0) kit('cap-party', () => equipCap(b.model, '#f7f4ea'));
  } else if (kind === 'sena') {
    kit('scarf', () => equipScarf(b.model));
    if (i % 2 === 1) { kit('flag-sena', () => { const f = makeHeldFlag('sena'); b.model.add(f); return f; }); b.carry = 'key'; }
  } else if (kind === 'opp') {
    if (i % 2 === 0) { kit('flag-opp', () => { const f = makeHeldFlag('opp'); b.model.add(f); return f; }); b.carry = 'key'; }
    if (i % 4 === 1) kit('cap-opp', () => equipCap(b.model, '#2f6fbe'));
  }
  b.flag = b.kit['flag-' + kind] || b.kit.placard || null;
  if (b.flag && !b.flag.visible) b.flag = null;
}

// Where each crowd group stands, and where its people come from.
const GROUPS = {
  cpWaiting: { center: { x: 4.5, z: -31 }, r: 3.8, spawn: { x: -4, z: -47 }, face: { x: 7.6, z: -31 } },
  cpParty: { center: null, r: 3.2, spawn: { x: -8, z: -46 }, face: null },
  stage: { center: { x: 0, z: -5.5 }, r: 5.5, spawn: { x: 10, z: 4 }, face: { x: 0, z: -14 } },
  barricade: { center: { x: 32.6, z: -3.2 }, r: 3.4, spawn: { x: 12, z: -6 }, face: { x: 40, z: -3.2 } },
  parliament: { center: { x: 62, z: -4 }, r: 6, spawn: { x: 40, z: -4.5 }, face: { x: 70, z: -4 } },
};
// Arriving groups stand beside the students at their place, each on its own side.
const KIND_OFFSET = { party: { x: -7.5, z: 6.5 }, sena: { x: 7, z: 7 }, opp: { x: -8, z: -4 }, students: { x: 0, z: 0 } };
const KIND_SPAWN = { party: { x: -60, z: 3 }, sena: { x: 80, z: 2 }, opp: { x: -60, z: -3 }, students: { x: -7, z: 34 } };
const LINE_LAYOUT = {
  stage: { x: 0, z: 1.8, axis: 'x', yaw: Math.PI },
  cp: { x: 4.5, z: -26.4, axis: 'x', yaw: Math.PI },
  barricade: { x: 37.8, z: -4.5, axis: 'z', yaw: -Math.PI / 2 },
  parliament: { x: 55.5, z: -4, axis: 'z', yaw: Math.PI / 2 },
};
const placePos = (place) => PLACES[place] || null;
const CLUSTER_KEYS = Object.keys(GROUPS);
const clusters = new Map(); // key -> { key, kind, center, r, n, spawn, face }
function clusterList() {
  const c = day.crowd, sp = day.objects.speaker;
  GROUPS.cpParty.center = { x: sp.x, z: sp.z + 2.4 };
  GROUPS.cpParty.face = { x: sp.x, z: sp.z };
  const counts = { cpWaiting: c.cpWaiting, cpParty: c.cpParty, stage: c.stage, barricade: c.barricade, parliament: c.parliament };
  clusters.clear();
  for (const k of CLUSTER_KEYS) clusters.set(k, { key: k, kind: 'students', ...GROUPS[k], n: counts[k] || 0 });
  for (const [id, g] of Object.entries(S.groups(day))) {
    if (!g || id === 'students' || !(g.size > 0)) continue;
    const p = placePos(g.place) || PLACES.stage, off = KIND_OFFSET[g.kind || id] || KIND_OFFSET.party;
    const center = { x: p.x + off.x, z: p.z + off.z };
    clusters.set('g:' + id, { key: 'g:' + id, kind: g.kind || id, center, r: 2.4 + Math.sqrt(g.size) * 0.55, n: g.size, spawn: KIND_SPAWN[g.kind || id] || KIND_SPAWN.party, face: { x: p.x, z: p.z }, mood: g.mood });
  }
  let total = 0;
  for (const cl of clusters.values()) total += cl.n;
  const scale = total > CROWD_POOL ? CROWD_POOL / total : 1;
  for (const cl of clusters.values()) cl.want = Math.round(cl.n * scale);
  return clusters;
}
function slot(cl, i) {
  const a = i * 2.399, r = cl.r * Math.sqrt((i + 0.5) / 18);
  return { x: cl.center.x + Math.cos(a) * r, z: cl.center.z + Math.sin(a) * r };
}
let crowdClock = 0, crowdSnap = true;
const freeList = [], memberList = [];
function updateCrowd(dt) {
  crowdClock -= dt;
  if (crowdClock <= 0) {
    crowdClock = 0.5;
    const cls = clusterList();
    freeList.length = 0;
    for (const b of crowd) if (b.cluster && !cls.has(b.cluster)) { b.cluster = null; freeList.push(b); }
    for (const cl of cls.values()) {
      memberList.length = 0;
      for (const b of crowd) if (b.cluster === cl.key) memberList.push(b);
      for (let i = cl.want; i < memberList.length; i++) { memberList[i].cluster = null; freeList.push(memberList[i]); }
    }
    for (const cl of cls.values()) {
      memberList.length = 0;
      for (const b of crowd) if (b.cluster === cl.key) memberList.push(b);
      while (memberList.length < cl.want) {
        // Prefer someone of the same group already walking away, otherwise bring a new person in.
        let best = -1, bd = 1e9;
        for (let i = 0; i < freeList.length; i++) { const f = freeList[i]; if (f.kind !== cl.kind) continue; const d = dist(f, cl.center); if (d < bd) { bd = d; best = i; } }
        let b = best >= 0 ? freeList.splice(best, 1)[0] : null;
        if (!b) {
          b = crowd.find((x) => !x.cluster && !x.model.visible);
          if (!b) break;
          Object.assign(b, cl.spawn);
          if (cl.key === 'stage' && day.bus.phase !== 'jantar') Object.assign(b, { x: -14, z: 12 });
          b.ox = b.oz = 0;
        }
        dress(b, cl.kind);
        b.cluster = cl.key; b.clusterRef = cl;
        b.model.visible = true;
        memberList.push(b);
      }
      for (let i = 0; i < memberList.length; i++) {
        const b = memberList[i];
        b.clusterRef = cl;
        b.target = slot(cl, i);
        if (crowdSnap) { b.x = b.target.x + b.ox; b.z = b.target.z + b.oz; }
      }
    }
    crowdSnap = false;
    for (const b of freeList) { b.clusterRef = null; b.target = day.bus.phase === 'toJantar' || day.bus.phase === 'cp' ? SPOTS.busDoor : { x: -4, z: -48 }; }
  }
  const surge = clashSurge();
  const ch = props.charge, gasOn = props.gasAt;
  const spraying = props.spraying, land = fx.sprayLand;
  for (const b of crowd) {
    if (!b.model.visible) continue;
    const ox = b.x, oz = b.z;
    let tx = b.target ? b.target.x + b.ox : b.x, tz = b.target ? b.target.z + b.oz : b.z;
    // Danger makes people run: the lathi line sweeping through, gas, the water jet.
    if (b.flee <= 0) {
      let fx2 = 0, fz2 = 0;
      if (ch.active && ch.along < 16) {
        const s = (b.x - ch.x) * ch.nx + (b.z - ch.z) * ch.nz, lat = Math.abs((b.x - ch.x) * -ch.nz + (b.z - ch.z) * ch.nx);
        if (s > -1.5 && s < 7 && lat < ch.length / 2 + 4) { fx2 = ch.nx; fz2 = ch.nz; }
      }
      const g = gasOn(b.x, b.z);
      if (g > 0.15) { const dx = b.x - fxGas.x, dz = b.z - fxGas.z, d = Math.hypot(dx, dz) || 1; fx2 += dx / d; fz2 += dz / d; b.cough = 4; }
      if (spraying && land && Math.hypot(b.x - land.x, b.z - land.z) < 4.5) { const dx = b.x - land.x, dz = b.z - land.z, d = Math.hypot(dx, dz) || 1; fx2 += dx / d; fz2 += dz / d; }
      if (fx2 || fz2) { const d = Math.hypot(fx2, fz2); b.fx = fx2 / d; b.fz = fz2 / d; b.flee = 2.2 + (b.idx % 5) * 0.2; }
    }
    if (b.flee > 0) {
      b.flee -= dt;
      tx = b.x + b.fx * 6; tz = b.z + b.fz * 6;
      // They don't come back to the same spot: the crowd scatters and stays scattered for a while.
      b.ox += b.fx * dt * 5.5; b.oz += b.fz * dt * 5.5;
    } else if (b.ox || b.oz) { const k = Math.exp(-dt / 40); b.ox *= k; b.oz *= k; }
    if (b.cough > 0) b.cough -= dt;
    if (b.fainted > 0) { b.fainted -= dt; b.speed = 0; continue; }
    if (surge && b.cluster === surge.group && b.target && b.flee <= 0) {
      const push = (0.5 + 0.5 * Math.sin(day.t * 1.7 + b.phase)) * 2.6;
      tx += surge.dx * push; tz += surge.dz * push;
    }
    const d = Math.hypot(tx - b.x, tz - b.z);
    const running = b.flee > 0;
    b.speed = d > (b.cluster && !(surge && b.cluster === surge.group) ? 0.9 : 0.4) || running ? steer(b, tmpTarget(tx, tz), running ? 6.2 : b.cluster ? 3.4 : 3.8, dt, world.obstacles) : 0;
    if (b.speed > 0.1) b.yaw = Math.atan2(b.x - ox, b.z - oz);
    else if (surge && b.cluster === surge.group) b.yaw = Math.atan2(surge.dx, surge.dz);
    else if (b.clusterRef?.face) b.yaw = Math.atan2(b.clusterRef.face.x - b.x, b.clusterRef.face.z - b.z);
    if (!b.cluster && b.target && dist(b, b.target) < 1) { b.model.visible = false; b.dressed = b.kind === 'students'; }
  }
}
const _tt = { x: 0, z: 0 };
const tmpTarget = (x, z) => { _tt.x = x; _tt.z = z; return _tt; };
const fxGas = { x: 0, z: 0 };
const fx = { sprayLand: null, spraying: false, dancing: false, hotspotPos: null, player: null, phase: 'morning' };

const CLASH_GROUP = { stage: 'stage', cp: 'cpWaiting', barricade: 'barricade', parliament: 'parliament' };
function clashSurge() {
  const place = day.clash?.place, L = LINE_LAYOUT[place], group = CLASH_GROUP[place];
  if (!L || !GROUPS[group]?.center) return null;
  const c = GROUPS[group].center, d = Math.hypot(L.x - c.x, L.z - c.z) || 1;
  return { group, dx: (L.x - c.x) / d, dz: (L.z - c.z) / d };
}

// --- police: posture from the phase, numbers and positions from the state ---------------

/** Where each officer should be when the engine doesn't say: constables lounging, then standing, then a line. */
const CHAIRS = [[33, -12.5, 0.6], [34.2, -13.4, 0.2], [32.4, -14.6, 1.4], [35.4, -12.2, -0.4], [-11, -1.6, 2.2], [-12.2, -2.6, 1.8]];
const officerPlan = [];
function planOfficers() {
  officerPlan.length = 0;
  const ph = phaseNow, lineAt = day.police.line, barr = S.barricades(day);
  const engine = S.officers(day);
  if (engine) {
    for (const [id, o] of Object.entries(engine)) {
      if (!o || o.hidden || o.x === undefined) continue;
      officerPlan.push({ id, kind: o.kind === 'raf' ? 'raf' : 'constable', x: o.x, z: o.z, yaw: o.yaw, posture: postureOf(o.mode, ph, o.kind), mood: o.mood, name: o.name });
    }
    return officerPlan;
  }
  // Fallback (old engine): constables by phase, RAF from police.raf, Rao's line from police.line.
  const nCon = ph === 'morning' ? 4 : 6;
  const lineSpot = LINE_LAYOUT[lineAt] || (ph === 'tense' || ph === 'showdown' ? LINE_LAYOUT[barr[0]] || LINE_LAYOUT.barricade : null);
  for (let i = 0; i < nCon; i++) {
    if (lineSpot && (lineAt || ph !== 'morning')) {
      const off = (i - (nCon - 1) / 2) * 1.5;
      const p = lineSpot.axis === 'x' ? { x: lineSpot.x + off, z: lineSpot.z + 1.4 * Math.sign(Math.cos(lineSpot.yaw) || 1) * -1 } : { x: lineSpot.x - 1.4 * Math.sign(Math.sin(lineSpot.yaw)), z: lineSpot.z + off };
      officerPlan.push({ id: 'c' + i, kind: 'constable', x: p.x, z: p.z, yaw: lineSpot.yaw, posture: 'line' });
    } else if (ph === 'morning') {
      const [x, z, y] = CHAIRS[i];
      officerPlan.push({ id: 'c' + i, kind: 'constable', x, z, yaw: y, posture: 'seat', chair: i });
    } else {
      officerPlan.push({ id: 'c' + i, kind: 'constable', x: 33 + (i % 3) * 1.3, z: -11 + Math.floor(i / 3) * 1.6, yaw: -Math.PI / 2 + (i - 2) * 0.4, posture: 'stand' });
    }
  }
  const nRaf = Math.min(RAF_POOL, S.raf(day));
  const rafAt = barr.length ? barr : lineAt ? [lineAt] : ['barricade'];
  for (let i = 0; i < nRaf; i++) {
    const place = rafAt[i % rafAt.length], L = LINE_LAYOUT[place] || LINE_LAYOUT.barricade;
    const k = Math.floor(i / rafAt.length), off = (k - (nRaf / rafAt.length - 1) / 2) * 1.25;
    const p = L.axis === 'x' ? { x: L.x + off, z: L.z } : { x: L.x, z: L.z + off };
    officerPlan.push({ id: 'r' + i, kind: 'raf', x: p.x, z: p.z, yaw: L.yaw, posture: 'line', place });
  }
  return officerPlan;
}
function postureOf(m, ph, kind) {
  const s = String(m || '');
  if (/lounge|sit|seat|chai|rest/.test(s)) return 'seat';
  if (/chase/.test(s)) return 'chase';
  if (/charge|lathi|beat/.test(s)) return 'charge';
  if (/line|hold|shield|guard/.test(s)) return 'line';
  if (/walk|move|patrol|go/.test(s)) return 'walk';
  if (/stand|post|watch|idle/.test(s)) return ph === 'morning' && kind !== 'raf' ? 'stand' : ph === 'morning' || ph === 'midday' ? 'stand' : 'line';
  return ph === 'tense' || ph === 'showdown' ? 'line' : 'stand';
}
let policeClock = 0;
function updatePolice(dt) {
  policeClock -= dt;
  if (policeClock <= 0) {
    policeClock = 0.25;
    const plan = planOfficers();
    officerById.clear();
    const used = new Set();
    // Keep each officer on the same pool body while it exists, so nobody teleports.
    for (const o of plan) {
      let b = police.find((p) => p.oid === o.id && p.kind === o.kind && !used.has(p));
      if (!b) b = police.find((p) => p.kind === o.kind && !used.has(p) && !plan.some((q) => q.id === p.oid && q.kind === p.kind));
      if (!b) continue;
      used.add(b);
      if (b.oid !== o.id || !b.model.visible) {
        b.oid = o.id;
        // New arrivals walk in from the Parliament Street end, not out of thin air.
        if (!b.model.visible) { b.x = o.x + 14; b.z = o.z + (b.idx % 3 - 1) * 2; if (crowdSnap || o.posture === 'seat') { b.x = o.x; b.z = o.z; } }
      }
      b.plan = o; b.model.visible = true;
      officerById.set(o.id, b);
    }
    for (const b of police) if (!used.has(b)) { b.model.visible = false; b.oid = null; b.plan = null; }
    for (let i = 0; i < CHAIRS.length; i++) props.chair(i, CHAIRS[i][0], CHAIRS[i][1], CHAIRS[i][2], false);
  }
  const chasedBy = S.chasedBy(day), ch = props.charge;
  for (const b of police) {
    if (!b.model.visible || !b.plan) continue;
    const o = b.plan;
    let tx = o.x, tz = o.z, speed = 4, posture = o.posture;
    // A chaser runs at the player; the engine moves him, we only make sure he looks like it.
    if (chasedBy && chasedBy === o.id) { posture = 'chase'; speed = 7; }
    // The lathi charge: the line runs forward with the front, lathis up.
    if (ch.active && ch.along < 16 && (o.kind === 'raf' || posture === 'line') && dist(o, ch) < 26) {
      const lane = (b.idx - (police.length - 1) / 2) * 1.4;
      tx = ch.x - ch.nz * lane; tz = ch.z + ch.nx * lane; posture = 'charge'; speed = 5.2;
    }
    if (posture === 'seat' && o.chair !== undefined) props.chair(o.chair, o.x, o.z, o.yaw, true);
    b.posture = posture;
    const ox = b.x, oz = b.z;
    if (dist(b, { x: tx, z: tz }) > 18) { b.x = tx; b.z = tz; }
    b.speed = posture === 'seat' ? 0 : dist(b, { x: tx, z: tz }) > 0.3 ? steer(b, tmpTarget(tx, tz), speed, dt, world.obstacles) : 0;
    if (posture === 'seat') { b.x = tx; b.z = tz; }
    if (b.speed > 0.1) b.yaw = Math.atan2(b.x - ox, b.z - oz);
    else if (o.yaw !== undefined) b.yaw = o.yaw;
    else if (fx.hotspotPos) b.yaw = Math.atan2(fx.hotspotPos.x - b.x, fx.hotspotPos.z - b.z);
    setShield(b.model, posture === 'line' || posture === 'charge' ? 'up' : 'carry');
    if (b.model.userData.baton) b.model.userData.baton.visible = b.kind === 'raf' || posture === 'charge' || posture === 'line' || posture === 'chase';
  }
}

// --- crew, provocateurs, kids ------------------------------------------------------------

let crewBlock = null;
function updateCrew(dt) {
  const ids = S.crew(day), n = Math.min(CREW_POOL, ids.length || 0), p = sim.player;
  if (crewBlock && dist(p, crewBlock) > 6) crewBlock = null;
  const blocking = day.player?.blocking ?? day.player?.crewBlock ?? !!crewBlock;
  crew.forEach((b, i) => {
    if (i >= n || S.detained(day)) { if (b.model.visible) { b.model.visible = false; } return; }
    if (!b.model.visible) { b.model.visible = true; b.x = p.x + Math.sin(i) * 3; b.z = p.z + Math.cos(i) * 3; }
    let tx, tz;
    if (blocking) {
      // Sit in a row across the road where you stood.
      const c = crewBlock || p, lane = (i - (n - 1) / 2) * 0.9;
      tx = c.x + Math.cos(yaw) * lane; tz = c.z - Math.sin(yaw) * lane;
    } else {
      // A loose V behind you.
      const back = 1.7 + Math.floor(i / 2) * 1.05, side = (i % 2 ? 1 : -1) * (0.7 + Math.floor(i / 2) * 0.35);
      const sy = Math.sin(p.yaw), cy = Math.cos(p.yaw);
      tx = p.x - sy * back + cy * side; tz = p.z - cy * back - sy * side;
    }
    const ox = b.x, oz = b.z, d = Math.hypot(tx - b.x, tz - b.z);
    if (d > 20) { b.x = tx; b.z = tz; }
    b.speed = d > 0.5 ? steer(b, tmpTarget(tx, tz), clamp(d * 2.2, 2, 6.5), dt, world.obstacles) : 0;
    b.seated = blocking && d < 0.8;
    if (b.speed > 0.1) b.yaw = Math.atan2(b.x - ox, b.z - oz);
    else b.yaw = blocking ? yaw + Math.PI : p.yaw;
  });
}
function updateProvs(dt) {
  const list = S.provocateurs(day);
  provs.forEach((b, i) => {
    const pv = list[i];
    if (!pv || pv.state === 'gone' || pv.state === 'reported' && b.goneT > 6) { b.model.visible = false; b.pid = null; return; }
    b.pid = pv.id ?? 'p' + i; b.state = pv.state;
    const place = placePos(pv.place) || PLACES.stage;
    let tx = pv.x ?? place.x + Math.cos(i * 2.1) * 3, tz = pv.z ?? place.z + Math.sin(i * 2.1) * 3;
    let speed = 3.2;
    if (pv.state === 'exposed') { const s = props.suvPos || { x: -60, z: 3 }; tx = s.x; tz = s.z; speed = 6.5; }
    if (pv.state === 'reported') { b.goneT = (b.goneT || 0) + dt; const s = bodies.sharma; tx = s.x + 1; tz = s.z + 1; }
    if (!b.model.visible) { b.model.visible = true; b.x = tx; b.z = tz; b.goneT = 0; }
    const ox = b.x, oz = b.z;
    if (Math.hypot(tx - b.x, tz - b.z) > 30) { b.x = tx; b.z = tz; }
    b.speed = Math.hypot(tx - b.x, tz - b.z) > 0.5 ? steer(b, tmpTarget(tx, tz), speed, dt, world.obstacles) : 0;
    if (b.speed > 0.1) b.yaw = Math.atan2(b.x - ox, b.z - oz);
    else if (pv.state === 'acting') { const L = LINE_LAYOUT[day.director?.hotspot] || LINE_LAYOUT.barricade; b.yaw = Math.atan2(L.x - b.x, L.z - b.z); }
  });
}
function updateKids(dt, t) {
  const on = props.dancing && fx.sprayLand;
  kids.forEach((b, i) => {
    if (!on) { b.model.visible = false; return; }
    const c = fx.sprayLand, a = t * 0.6 + i * (Math.PI / 2);
    const tx = c.x + Math.cos(a) * 1.6, tz = c.z + Math.sin(a) * 1.6;
    if (!b.model.visible) { b.model.visible = true; b.x = tx + 6; b.z = tz; }
    const ox = b.x, oz = b.z;
    b.speed = steer(b, tmpTarget(tx, tz), 3, dt, world.obstacles);
    b.yaw = b.speed > 0.6 ? Math.atan2(b.x - ox, b.z - oz) : b.yaw + dt * 2;
  });
}

function updateBodies(dt) {
  const looks = cine.lookTargets;
  for (const [id, b] of Object.entries(bodies)) {
    const s = day.people[id];
    b.model.visible = !s.hidden;
    if (id === 'mira') { Object.assign(b, { x: s.x, z: s.z, y: 0.74, speed: 0 }); b.yaw = 0; }
    else if (s.hidden) Object.assign(b, { x: s.x, z: s.z });
    else {
      if (dist(b, s) > 14) Object.assign(b, { x: s.x, z: s.z });
      const ox = b.x, oz = b.z;
      b.speed = dist(b, s) > 0.3 ? steer(b, s, 3.8, dt, world.obstacles) : 0;
      if (b.speed > 0.1) b.yaw = Math.atan2(b.x - ox, b.z - oz);
      else if (looks.has(id)) { const l = looks.get(id); b.yaw = Math.atan2(l.x - b.x, l.z - b.z); }
      else if (id === 'sharma' && s.post === 'barricade') b.yaw = -Math.PI / 2;
      else if (id === 'dev' && s.mode === 'waiting') b.yaw = Math.PI / 2;
      else if (['ravi', 'kabir', 'dev', 'nikhil', 'sana'].includes(id) && placeAt(s) === 'stage') b.yaw = Math.atan2(-b.x, -14 - b.z);
      else if (id === 'asha' && s.mode === 'stall') b.yaw = 0.3;
    }
  }
}

function attach(item, holderModel, pose) {
  if (item.parent !== holderModel) holderModel.add(item);
  item.position.fromArray(CARRY_POSES[pose].position);
  item.rotation.set(0, 0, 0);
  item.scale.setScalar(1);
}
function updateItems(t) {
  for (const id of OBJECTS) {
    const o = day.objects[id], it = items[id];
    const holderModel = o.holder === 'player' ? playerModel : bodies[o.holder]?.model;
    it.visible = o.holder !== 'iqbal' && o.holder !== 'bus' && !(holderModel && !holderModel.visible);
    if (id === 'phone' && o.holder === 'zoya') it.visible = false;
    if (holderModel) { attach(it, holderModel, POSE[id]); continue; }
    if (it.parent !== world.scene) world.scene.add(it);
    const raised = o.holder === 'hook' || o.holder === 'cart';
    it.position.set(o.x, raised ? 1.05 : 0, o.z);
    if (id === 'key') it.rotation.set(raised ? Math.PI / 2 : 0, t * 1.5, 0);
    if (id === 'speaker') { const beat = o.on ? Math.max(0, Math.sin(t * 9)) * 0.05 : 0; it.scale.set(1 + beat, 1 - beat * 0.5, 1 + beat); }
  }
  items.speaker.userData.led.material = day.objects.speaker.on ? items.ledOn : items.ledOff;
  for (const id of OBJECTS) {
    const o = day.objects[id], ring = items[id + 'Ring'];
    ring.visible = isFree(o) && !day.player.carrying && dist(sim.player, o) < 14;
    ring.position.set(o.x, 0.04, o.z);
    ring.scale.setScalar(1 + Math.sin(t * 4) * 0.12);
  }
}

let honked = false, blockedFor = 0;
function busWaits() {
  const b = day.bus, p = sim.player;
  const moving = b.phase === 'toJantar' || b.phase === 'toCP';
  const dir = b.phase === 'toJantar' ? Math.sign(SPOTS.busJantar.z - b.z) : Math.sign(SPOTS.busCP.z - b.z);
  const ahead = (p.z - b.z) * dir;
  b.blocked = moving && Math.abs(p.x - b.x) < 2 && ahead > 4 && ahead < 8 && !S.detained(day);
  if (b.blocked && !honked) toast('Poooon! Iqbal honks and waits for you to get out of the way.', 3);
  blockedFor = b.blocked ? blockedFor + STEP : 0;
  if (blockedFor >= 10) { blockedFor = 0; toast('Iqbal leans out: "Bhai, side ho jao! Poora schedule tumhare peeche ruka hai."', 4); }
  honked = b.blocked;
}
function updateShuttle() {
  const b = day.bus;
  shuttle.position.set(b.x, 0, b.z);
  shuttleSigns.position.set(b.x, 0, b.z);
  shuttleSigns.visible = phaseNow === 'tense' || phaseNow === 'showdown' || phaseNow === 'aftermath' || b.phase === 'detention';
  shuttleObstacle.x = b.x; shuttleObstacle.z = b.z;
  const p = sim.player, hw = 1.4 + p.radius, hd = 5 + p.radius;
  if (!S.detained(day) && Math.abs(p.x - b.x) < hw && Math.abs(p.z - b.z) < hd) p.x = b.x + Math.sign(p.x - b.x || -1) * (hw + 0.05);
}

// --- feedback: toast, bubbles, phone, radio -------------------------------------------------

function toast(text, time = 4, isLink = false) {
  const el = $('#toast');
  el.textContent = text;
  el.classList.toggle('linked', isLink);
  el.style.opacity = 1;
  $('#hud').classList.add('toasting');
  toastTime = time;
}
let phaseBannerT = 0;
function phaseBanner(ph) {
  const el = $('#phaseBanner');
  el.innerHTML = `<small>${clockText(day.t)}</small><b>${PHASE_NAME[ph] || ph}</b><span>${PHASE_LINE[ph] || ''}</span>`;
  el.classList.remove('hidden'); el.classList.add('on');
  phaseBannerT = 4.5;
}
/** A speech bubble over a named person, a crowd member or an officer. */
function bubble(key, anchor, name, text, duration = 5) {
  if (!anchor || !anchor.model?.visible) return;
  let b = bubbles.find((x) => x.key === key);
  if (!b) {
    const el = document.createElement('div');
    el.className = 'bubble';
    $('#bubbles').appendChild(el);
    b = { key, el, x: null, y: null };
    bubbles.push(b);
  }
  b.anchor = anchor; b.ttl = duration;
  b.el.innerHTML = `<b>${name}</b>`;
  b.el.append(text);
  // Measure once now (off-screen), so placement each frame needs no layout reads.
  b.el.style.display = 'block'; b.el.style.left = '-9999px'; b.el.style.top = '0px';
  b.w = b.el.offsetWidth || 230; b.h = b.el.offsetHeight || 50;
}
function say(id, text, duration = 5) {
  const b = bodies[id];
  if (!b || !b.model.visible) return;
  bubble(id, b, PEOPLE[id].name.toUpperCase(), text, duration);
}
const speakingNow = (b) => bubbles.some((x) => x.anchor === b);
let radioT = 0;
function radio(text) {
  // You only overhear the wireless when you are near the police.
  let near = dist(sim.player, bodies.sharma) < 28;
  for (const b of police) if (b.model.visible && dist(b, sim.player) < 28) { near = true; break; }
  if (!near) return;
  $('#radio').innerHTML = '<small>POLICE WIRELESS · OVERHEARD</small>';
  $('#radio').append(text.replace(/^Rao: |^Inspector Rao: /, ''));
  $('#radio').classList.remove('hidden');
  radioT = 6;
}
// Group chat messages arrive one at a time, like a real chat.
const chatQueue = [];
let chatT = 0;
function queueChat(lines) { for (const l of lines || []) chatQueue.push(l); }
function chatTrigger(trigger) { const lines = PHONE.CHAT[trigger]; if (lines) queueChat(lines); }
const pick = (a, seed = 0) => (Array.isArray(a) && a.length ? a[(Math.floor(day.t * 7) + seed) % a.length] : null);

let streamText = '';
function handleEvents() {
  for (const e of drainEvents(day)) {
    const near = e.pos ? dist(sim.player, e.pos) < 26 : false;
    const here = e.place && placeAt(sim.player) === e.place;
    const kind = e.kind || (e.who === 'wireless' ? 'wireless' : e.who === 'feed' ? 'feed' : e.who === 'stream' ? 'stream' : null);
    const onPhone = kind === 'wireless' || kind === 'feed' || kind === 'stream' || kind === 'chat' || kind === 'ticker';
    const heard = onPhone || near || here || (bodies[e.who] && dist(sim.player, bodies[e.who]) < 26);
    if (kind === 'wireless') radio(e.text);
    else if (kind === 'feed') phone.feed({ caption: e.text.replace(/^[^:]{0,40}: /, ''), by: e.by || 'jantar.updates', kind: e.key || 'forward', place: e.place && PLACES[e.place]?.name });
    else if (kind === 'stream') { streamText = e.text.replace(/^Zoya Live: |^Zoya: /, ''); phone.live({ on: day.stream.live, text: streamText, viewers: day.stream.viewers }); }
    else if (kind === 'chat') phone.chat(e.who, e.text);
    else if (kind === 'ticker') phone.ticker(e.text);
    else if (kind === 'bark') barkAt(e.who, e.text, e.pos);
    else if (bodies[e.who]) say(e.who, e.text, 6);
    else if (officerById.has(e.who)) { const b = officerById.get(e.who); bubble('o:' + e.who, b, b.plan?.name?.toUpperCase() || b.label, e.text, 6); }
    else if (e.who === 'street' && e.text && heard) toast(e.text, 5);
    if (e.link && heard) learnLink(e.link);
  }
}

const MAX_BUBBLES = () => (innerWidth < 600 ? 2 : 3);
const HUD_BLOCKERS = ['#clock', '#rep', '#place', '#objective', '#chase', '#radio', '#phaseBanner', '#choices', '#prompt', '#carrying', '#toast', '#phonePill', '#phone', '#keys', '#touch .pad', '#touch .acts', '#dev', '#recFlash', '#detained'];
let blockerEls = null;
const rects = [], placed = [], shown = [];
const _v = new THREE.Vector3();
/** Speech bubbles never overlap each other or the HUD: each takes the nearest clear spot, or hides. */
function updateBubbles(dt) {
  blockerEls ??= HUD_BLOCKERS.flatMap((q) => [...document.querySelectorAll(q)]);
  rects.length = 0;
  if (!$('#hud').classList.contains('hidden')) for (const el of blockerEls) {
    if (el.classList.contains('hidden') || el.offsetParent === null) continue;
    if (el.id === 'toast' && toastTime <= 0) continue;
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) rects.push(r);
  }
  shown.length = 0;
  const hideAll = cine.mode === 'scene' || cine.mode === 'sting' || mode !== 'play' || phone.isOpen && innerWidth < 700;
  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i], a = b.anchor;
    b.ttl -= dt;
    if (b.ttl <= 0 || !a?.model) { b.el.remove(); bubbles.splice(i, 1); continue; }
    _v.set(a.x, (a.y || 0) + (a.model.scale.y < 0.9 ? 1.35 : 2.15), a.z).project(world.camera);
    const off = hideAll || dist(a, sim.player) > 30 || _v.z > 1 || Math.abs(_v.x) > 1.05 || _v.y < -0.9 || !a.model.visible;
    const asked = choices && choices.key === b.key;
    if (off || asked) { b.el.style.display = 'none'; b.x = null; continue; }
    shown.push({ b, d: dist(a, sim.player), x: ((_v.x + 1) / 2) * innerWidth, y: ((1 - _v.y) / 2) * innerHeight });
  }
  shown.sort((a, c) => a.d - c.d);
  placed.length = 0;
  const W = innerWidth, H = innerHeight;
  for (let n = 0; n < shown.length; n++) {
    const s = shown[n], b = s.b;
    if (n >= MAX_BUBBLES()) { b.el.style.display = 'none'; b.x = null; continue; }
    const w = b.w, h = b.h;
    const fitX = (x) => clamp(x, w / 2 + 8, W - w / 2 - 8), fitY = (y) => clamp(y, h + 8, H - 8);
    const clear = (x, y) => {
      const l = x - w / 2 - 6, r = x + w / 2 + 6, t = y - h - 6, btm = y + 6;
      for (const q of rects) if (r > q.left && l < q.right && btm > q.top && t < q.bottom) return false;
      for (const q of placed) if (r > q.left && l < q.right && btm > q.top && t < q.bottom) return false;
      return true;
    };
    const hx = fitX(s.x), hy = fitY(s.y);
    let bx = null, by = null, bd = 1e9;
    // Keep last frame's spot while it is still clear and close: no jitter.
    if (b.x !== null && clear(b.x, b.y) && Math.hypot(b.x - hx, b.y - hy) < 60) { bx = b.x; by = b.y; }
    else {
      // Search a ring of candidates around where they stand; take the nearest clear one.
      for (let ring = 0; ring <= 6 && bx === null; ring++) {
        const steps = ring === 0 ? 1 : 12;
        for (let k = 0; k < steps; k++) {
          const a = (k / steps) * Math.PI * 2 - Math.PI / 2;
          const x = fitX(hx + Math.cos(a) * ring * (w * 0.45 + 10)), y = fitY(hy + Math.sin(a) * ring * (h * 0.7 + 10));
          if (!clear(x, y)) continue;
          const d = Math.hypot(x - hx, y - hy);
          if (d < bd) { bd = d; bx = x; by = y; }
        }
      }
    }
    if (bx === null || Math.hypot(bx - hx, by - hy) > H * 0.4) { b.el.style.display = 'none'; b.x = null; continue; }
    b.x = bx; b.y = by;
    b.el.style.display = 'block';
    b.el.style.left = bx + 'px';
    b.el.style.top = by + 'px';
    b.el.classList.toggle('tail', Math.abs(bx - hx) < 30 && Math.abs(by - hy) < 30);
    placed.push({ left: bx - w / 2, right: bx + w / 2, top: by - h, bottom: by });
  }
}
function ambient(dt) {
  ambientClock -= dt;
  if (ambientClock > 0) return;
  ambientClock = 14;
  const m = moods(day);
  const near = Object.keys(bodies).filter((id) => bodies[id].model.visible && dist(bodies[id], sim.player) < 14 && !bubbles.some((b) => b.key === id));
  const lines = AMBIENT.filter((a) => near.includes(a.who) && (m.has(a.when) || a.when === 'default'));
  lines.sort((a, b) => (b.when !== 'default') - (a.when !== 'default'));
  const p = lines[ambientTurn++ % Math.max(1, Math.min(lines.length, 3))];
  if (p) say(p.who, p.line, 5);
}

// Barks: the crowd and the police talk among themselves, drawn from a shuffled bag per phase and speaker type.
const bags = {};
function nextBark(type) {
  const base = BARKS?.[phaseNow]?.[type] || [];
  const extra = flagBarks[type] || [];
  if (!base.length && !extra.length) return null;
  const k = phaseNow + ':' + type;
  if (!bags[k]?.length) { bags[k] = base.concat(extra); for (let i = bags[k].length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [bags[k][i], bags[k][j]] = [bags[k][j], bags[k][i]]; } }
  return bags[k].pop();
}
// Once a flag is set the crowd remembers: CALLBACK_BARKS lines join that speaker type's bag
// (mixed into the current bag at once, so they come up soon, and into every refill after).
const flagBarks = {};
const flagsSeen = new Set();
const pendingLines = []; // scene callbacks[flag]: [who, line] said once that person is near you
function updateFlags() {
  for (const f of S.flags(day)) {
    if (flagsSeen.has(f)) continue;
    flagsSeen.add(f);
    chatTrigger('flag:' + f);
    for (const [type, line] of CALLBACK_BARKS[f] || []) {
      (flagBarks[type] ??= []).push(line);
      for (const [k, bag] of Object.entries(bags)) if (k.endsWith(':' + type)) bag.splice(Math.floor(Math.random() * (bag.length + 1)), 0, line);
    }
    for (const sc of Object.values(SCENES)) for (const l of sc.callbacks?.[f] || []) pendingLines.push(l);
  }
  for (let i = pendingLines.length - 1; i >= 0; i--) {
    const [who, line] = pendingLines[i];
    const b = bodies[who];
    if (b?.model.visible && dist(b, sim.player) < 12 && !speakingNow(b)) { say(who, line, 5); pendingLines.splice(i, 1); break; }
  }
}
// Overheard: you hear a scene before you see its marker, from about 15 m away.
const overheardDone = new Set();
function overheard() {
  for (const [id, sc] of Object.entries(SCENES)) {
    if (overheardDone.has(id) || !sc.overheard?.length) continue;
    const o = oppCache && oppCache.cmd?.type === 'scene' && oppCache.cmd.id === id ? oppCache : null;
    const near = o ? o.d < 15 : S.scene(day)?.id === id && S.scene(day)?.state === 'available';
    if (!near) continue;
    overheardDone.add(id);
    sc.overheard.forEach(([who, line], i) => setTimeout(() => { if (mode === 'play') say(who, line, 5); }, i * 2600));
  }
}
const BARK_TYPE = { students: 'student', party: 'party', sena: 'sena', opp: 'opp', constable: 'constable', raf: 'raf' };
let barkClock = 4;
function barks(dt) {
  if (!BARKS) return;
  barkClock -= dt;
  if (barkClock > 0) return;
  barkClock = 5 + Math.random() * 3;
  const cands = [];
  for (const b of crowd) if (b.model.visible && !b.fainted && dist(b, sim.player) < 16 && !speakingNow(b)) cands.push(b);
  for (const b of police) if (b.model.visible && dist(b, sim.player) < 16 && !speakingNow(b)) cands.push(b);
  if (!cands.length) return;
  const b = cands[Math.floor(Math.random() * cands.length)];
  let type = BARK_TYPE[b.kind] || 'student';
  if (type === 'student' && b.idx % 9 === 0) type = b.idx % 2 ? 'uncle' : 'aunty';
  const line = nextBark(type);
  if (line) bubble('bark:' + b.kind + b.idx, b, (b.label || KIND_NAME[b.kind] || type).toUpperCase(), line, 4.5);
}
function barkAt(type, text, pos) {
  let best = null, bd = 1e9;
  const want = Object.entries(BARK_TYPE).find(([, v]) => v === type)?.[0];
  for (const b of [...crowd, ...police]) {
    if (!b.model.visible || (want && b.kind !== want)) continue;
    const d = pos ? dist(b, pos) : dist(b, sim.player);
    if (d < bd) { bd = d; best = b; }
  }
  if (best && bd < 30) bubble('bark:' + best.kind + best.idx, best, (best.label || KIND_NAME[best.kind] || type).toUpperCase(), text, 5);
}

// --- cues: set pieces, stings, chat, audio --------------------------------------------------

const STINGS = {
  'cannon-roll': ['cannon', 'VAJRA ROLLS IN', 'The water cannon is coming to the crowd.'],
  'stone-thrown': ['stone', 'FIRST STONE', 'Somebody threw it. Everybody will be blamed.'],
  'gas-fired': ['gas', 'TEAR GAS', 'Cover your face. Move upwind.'],
  'charge-start': ['charge', 'LATHI CHARGE', 'They are coming through.'],
  'party-suv': ['suv', 'A WHITE SUV ARRIVES', 'VIP sticker. Flag. Men who don\'t look like students.'],
  'arrival-wave': ['suv', 'THE PARTIES ARRIVE', 'Flags you didn\'t see this morning.'],
  'sena-bikes': ['bikes', 'BIKES ON PARLIAMENT STREET', 'Saffron scarves and a megaphone.'],
  'barricades-up': ['barricade', 'BARRICADES GO UP', 'Two o\'clock. The police have new orders.'],
};
let lastStingT = -99;
function handleCues() {
  let list = S.cues(day);
  if (demo?.drainCues) list = list.concat(demo.drainCues());
  for (const c of list) {
    if (!c || !c.cue) continue;
    props.cue(c);
    audio.cue(c.cue, c);
    chatTrigger(c.cue);
    const name = c.cue;
    if (name === 'crowd-laugh' || name === 'crowd-gasp' || name === 'awkward-silence') react(name, c.pos || sim.player);
    if (name === 'crew-block') crewBlock = { x: sim.player.x, z: sim.player.z };
    if (name === 'faint') faintNear(c.pos || PLACES.stage);
    if (name === 'chase-start') { toast('Run! Break his line of sight, or lose him in a crowd of six or more.', 5); }
    if (name === 'chase-lost') toast('Lost him. He\'s bent over, hands on knees, swearing at a pigeon.', 4);
    if (name === 'caught') toast('Caught. Into the detention bus you go.', 4);
    if (name === 'phase' && c.data) onPhase(c.data.phase ?? c.data);
    const st = STINGS[name];
    if (st && !stung.has(name) && mode === 'play' && !cine.active && !choices && !S.detained(day) && day.t - lastStingT > 6) {
      stung.add(name);
      if (name === 'arrival-wave') stung.add('party-suv');
      const target = () => props.focus[st[0]];
      if (cine.playSting({ target, title: st[1], sub: st[2], duration: 2.7 })) lastStingT = day.t;
    }
  }
}
/** Crowd reactions near a point: laugh, gasp, or everybody turns to stare. */
function react(kind, pos) {
  for (const b of crowd) {
    if (!b.model.visible || dist(b, pos) > 14) continue;
    b.react = kind === 'crowd-laugh' ? 'laugh' : kind === 'crowd-gasp' ? 'point' : 'stare';
    b.reactT = 2.4 + (b.idx % 4) * 0.2;
    b.reactAt = pos;
  }
}
function faintNear(pos) {
  let best = null, bd = 1e9;
  for (const b of crowd) if (b.model.visible && !b.fainted) { const d = dist(b, pos); if (d < bd) { bd = d; best = b; } }
  if (best) best.fainted = 30;
}
function onPhase(ph) {
  if (!ph || ph === phaseNow) return;
  const first = phaseNow === null;
  phaseNow = ph;
  audio.phase(ph);
  if (first) return;
  phaseBanner(ph);
  chatTrigger('phase:' + ph);
  for (const line of PHONE.TICKER[ph] || []) phone.ticker(line);
  realReels(ph);
}
function realReels(ph) {
  for (const r of REAL_REELS) if (r.phase === ph) phone.feed({ caption: r.caption, by: r.page || 'reel', kind: r.id?.replace(/^real-/, ''), real: true, realLabel: r.label, comments: r.comments });
}

// --- player actions ---------------------------------------------------------

function witnesses() {
  const out = [];
  const ranges = { sharma: 14, iqbal: 9, ravi: 9, zoya: 8, dev: 8 };
  for (const [id, r] of Object.entries(ranges)) {
    const b = bodies[id];
    if (!day.people[id].hidden && dist(b, sim.player) < r && visible(b, sim.player, world.obstacles)) out.push(id);
  }
  for (const b of police) if (b.model.visible && b.oid && dist(b, sim.player) < 12 && visible(b, sim.player, world.obstacles)) out.push(b.oid);
  return out;
}
const PICKUP = { speaker: 'Pick up Ravi\'s speaker', key: 'Pocket the bus key', megaphone: 'Take Dev\'s megaphone', phone: 'Take Zoya\'s charging phone', water: 'Lift Sana\'s water crate' };
const OWNER = { speaker: 'ravi', key: 'iqbal', megaphone: 'dev', phone: 'zoya', water: 'sana' };
const GIVES = { key: ['iqbal'], speaker: ['ravi'], megaphone: ['dev', 'mira', 'kabir'], phone: ['zoya'], water: ['sana'] };
const moodTag = (m) => (m ? ` (${m})` : '');
function findPrompt() {
  const p = sim.player, carrying = day.player.carrying;
  const options = [];
  if (S.detained(day)) {
    const o = nearestOpportunity(true);
    return o?.cmd ? { d: 0, text: o.label, run: () => runCmd(o.cmd) } : null;
  }
  if (!carrying) {
    for (const id of OBJECTS) {
      const o = day.objects[id];
      if (!isFree(o) || dist(p, o) >= 2) continue;
      const watching = witnesses().filter((w) => w === OWNER[id] || (id === 'key' && (w === 'sharma' || officerById.has(w))));
      const warn = watching.length ? ` (${watching.map((w) => PEOPLE[w]?.name || 'a constable').join(' and ')} can see you)` : '';
      options.push({ d: dist(p, o) - 1.5, text: PICKUP[id] + warn, warn: !!warn, run: () => take(id) });
    }
  }
  for (const id of Object.keys(bodies)) {
    const b = bodies[id], s = day.people[id];
    if (s.hidden || dist(p, b) > (id === 'mira' ? 5 : 3)) continue;
    if (carrying && GIVES[carrying].includes(id) && !s.carrying) options.push({ d: dist(p, b) - 1, text: `Give ${PEOPLE[id].name} the ${carrying === 'water' ? 'water crate' : carrying}`, run: () => give(id) });
    else options.push({ d: dist(p, b), text: `Talk to ${PEOPLE[id].name}${id === 'sharma' ? moodTag(s.mood) : ''}`, run: () => talk(id) });
  }
  for (const b of police) {
    if (!b.model.visible || !b.oid || dist(p, b) > 2.6) continue;
    options.push({ d: dist(p, b), text: `Pester the ${b.kind === 'raf' ? 'RAF jawan' : 'constable'}${moodTag(b.plan?.mood)}`, run: () => openPester(b.oid, b) });
  }
  for (const b of provs) {
    if (!b.model.visible || dist(p, b) > 2.6 || b.state === 'exposed' || b.state === 'gone') continue;
    options.push({ d: dist(p, b) - 0.5, text: 'The man in box-fresh shoes, with an earpiece', run: () => openProvocateur(b) });
  }
  // Anything else the engine says you can do right here (scenes, detention, rally spots).
  const o = nearestOpportunity(true);
  if (o?.cmd && o.d < 2.6) options.push({ d: o.d - 0.2, text: o.label, run: () => runCmd(o.cmd) });
  options.sort((a, b) => a.d - b.d);
  return options[0] || null;
}
function runCmd(cmd) {
  const r = act(day, cmd);
  if (!r?.ok && r?.say) toast(r.say, 3);
  return r;
}
function take(object) { act(day, { type: 'take', object, witnesses: witnesses() }); }
function drop() { const p = sim.player; act(day, { type: 'drop', x: p.x + Math.sin(p.yaw) * 0.9, z: p.z + Math.cos(p.yaw) * 0.9 }); }
function give(to) { act(day, { type: 'give', to }); }
function talk(id) {
  act(day, { type: 'talk', to: id });
  const state = talkState(day, id);
  const byState = (w) => TALK[id].filter((t) => t.when === w);
  const pool = byState(state).length ? byState(state) : byState('default').length ? byState('default') : [TALK[id][0]];
  const key = id + ':' + pool[0].when, n = talked[key] = (talked[key] || 0) + 1;
  const entry = pool[n - 1];
  const line = entry ? entry.line : AGAIN[id][(n - pool.length - 1) % AGAIN[id].length];
  say(id, line, 7);
  if (entry?.hint && HINTS[entry.hint]) {
    const fresh = learnHint(entry.hint);
    toast(`${fresh ? 'On the board: ' : ''}${PEOPLE[id].name}: ${HINTS[entry.hint].text}`, 5);
  }
  if (id === 'sharma') openPester('sharma', bodies.sharma, line);
  else openWhisper(id, line);
}

// The options card. Options are intents ("Ask him for career advice"), never the spoken line.
function openChoices({ key, said, saidBy, title, list }) {
  if (!list.length) return;
  choices = { key, list };
  $('#choicesSaid').innerHTML = said ? `<b>${saidBy}</b>` : '';
  if (said) $('#choicesSaid').append(said);
  $('#choicesSaid').classList.toggle('hidden', !said);
  $('#choicesTitle').textContent = title;
  $('#choicesList').innerHTML = list.map((o, i) => `<li><button data-i="${i}"${o.locked ? ' class="locked"' : ''}><kbd>${i + 1}</kbd> ${o.label}${o.note ? `<small>${o.note}</small>` : ''}</button></li>`).join('')
    + '<li><button data-i="-1"><kbd>Esc</kbd> Leave it</button></li>';
  for (const b of $('#choicesList').querySelectorAll('button')) b.onclick = () => choose(Number(b.dataset.i));
  $('#choices').classList.remove('hidden');
  $('#hud').classList.add('choosing');
}
function choose(i) {
  const c = choices;
  closeChoices();
  if (c && i >= 0 && c.list[i]) c.list[i].run();
}
function closeChoices() {
  choices = null;
  $('#choices').classList.add('hidden');
  $('#hud').classList.remove('choosing');
}
function openWhisper(id, line) {
  const list = knownRumours().map((rid) => ({
    label: RUMOURS[rid].label,
    run: () => { const r = act(day, { type: 'whisper', to: id, rumour: rid }); if (r.say === 'already-dead') toast('Nobody believes that one any more.', 3); },
  }));
  openChoices({ key: id, said: line, saidBy: PEOPLE[id].name.toUpperCase(), title: `Whisper something to ${PEOPLE[id].name}?`, list });
}
const PESTER = [
  ['career', 'Ask him for career advice'],
  ['cute', 'Tell him, sincerely, that he is cute'],
  ['cannon', 'Ask about the water-cannon arrangements'],
  ['detainme', 'Ask to be detained with your friends'],
];
function openPester(to, b, line) {
  const name = to === 'sharma' ? 'Sharma' : b?.kind === 'raf' ? 'the jawan' : 'the constable';
  const list = PESTER.filter(([how]) => how !== 'detainme' || clockMinutes(day.t) >= 14 * 60).map(([how, label]) => ({
    label,
    run: () => {
      const r = act(day, { type: 'pester', to, how });
      if (!r?.ok) toast(r?.say || `${name[0].toUpperCase() + name.slice(1)} pretends he didn't hear you.`, 3);
    },
  }));
  openChoices({ key: to, said: line, saidBy: to === 'sharma' ? 'OFFICER SHARMA' : '', title: `Pester ${name}`, list });
}
function openProvocateur(b) {
  const sharmaSoft = day.people.sharma?.mood === 'soft';
  const camera = S.director(day) && (day.stream.live && dist(bodies.zoya, b) < 12);
  openChoices({
    key: 'prov' + b.idx, title: 'New shoes. Earpiece. A helmet in his bag. Not a student.',
    list: [
      { label: 'Join him', note: 'heat up, and the police will come here', run: () => provAct(b, 'join') },
      { label: 'Report him to the police', note: sharmaSoft ? 'Sharma likes you' : 'he may be protected', run: () => provAct(b, 'report') },
      { label: 'Expose him on camera', note: camera ? 'Zoya is live nearby' : 'film him (F) or get Zoya here', run: () => provAct(b, 'expose') },
    ],
  });
}
function provAct(b, how) {
  const r = act(day, { type: 'provocateur', id: b.pid, how });
  if (!r?.ok) toast(r?.say || (how === 'expose' ? 'You need a camera on him: film it, or get Zoya live within 12 m.' : 'He looks straight through you.'), 3.5);
}
function openStance() {
  const opts = [['hold', 'Hold the ground, sit down'], ['scatter', 'Scatter, laughing'], ['block', 'Block the road'], ['protect', 'Protect each other, get the injured out']];
  openChoices({ key: 'stance', title: S.crew(day).length ? 'Tell your crew what to do' : 'What do you do here?', list: opts.map(([stance, label]) => ({ label, run: () => { const r = act(day, { type: 'stance', stance }); if (!r?.ok) toast('Nobody is listening yet.', 2.5); else toast(`Your crew: ${label.toLowerCase()}.`, 2.5); } })) });
}
function rally() {
  const r = act(day, { type: 'rally' });
  if (r?.ok) { toast('Students fall in behind you.', 3); return; }
  const aura = S.rep(day)?.aura ?? 0;
  toast(r?.say || (aura < 30 ? `Nobody follows a stranger. You need more aura (${Math.round(aura)}/30): make people laugh.` : 'Get closer to a crowd of students first.'), 3.5);
}
let recT = 0;
function film() {
  const p = sim.player;
  const r = act(day, { type: 'film', x: p.x, z: p.z });
  if (r?.ok) {
    recT = 1.6;
    $('#recFlash').classList.remove('hidden');
    audio.cue('film', { pos: p });
  } else toast(r?.say || 'Nothing worth filming here. Get within 12 m of something happening.', 3);
}

// --- opportunities: one objective card -------------------------------------------------

const _oppPos = { x: 0, z: 0 };
let oppCache = null, oppT = 0;
/** The nearest thing to do: from the engine's opportunities(s, pos), else a small local fallback. */
function nearestOpportunity(fresh = false) {
  if (!fresh && oppT > 0) return oppCache;
  oppT = 0.3;
  _oppPos.x = sim.player.x; _oppPos.z = sim.player.z;
  const list = S.opportunities(day, _oppPos);
  let best = null, bd = 1e9;
  if (Array.isArray(list)) {
    for (const o of list) {
      if (!o) continue;
      const x = o.x ?? o.pos?.x, z = o.z ?? o.pos?.z;
      const d = x === undefined ? (o.d ?? o.dist ?? 0) : Math.hypot(x - _oppPos.x, z - _oppPos.z);
      if (d < bd) { bd = d; best = { label: o.label ?? o.text ?? o.title ?? o.intent ?? 'Something is happening', x, z, d, cmd: o.cmd ?? null, kind: o.kind }; }
    }
  } else best = localOpportunity();
  oppCache = best;
  return best;
}
function localOpportunity() {
  const p = sim.player, out = [];
  for (const id of OBJECTS) { const o = day.objects[id]; if (isFree(o)) out.push({ label: PICKUP[id], x: o.x, z: o.z }); }
  if (!day.people.sharma.hidden) out.push({ label: 'Pester Officer Sharma', x: bodies.sharma.x, z: bodies.sharma.z });
  if (day.people.nikhil.mode === 'lost') out.push({ label: 'Nikhil looks lost. Talk to him', x: bodies.nikhil.x, z: bodies.nikhil.z });
  for (const b of provs) if (b.model.visible && b.state !== 'exposed') out.push({ label: 'Someone in the crowd isn\'t a student', x: b.x, z: b.z });
  let best = null, bd = 1e9;
  for (const o of out) { const d = Math.hypot(o.x - p.x, o.z - p.z); if (d < bd) { bd = d; best = { ...o, d }; } }
  return best;
}

// --- loop, screens, board ----------------------------------------------------

function resetDay() {
  day = createDay();
  loopLinks = new Set();
  sim.player.x = SPOTS.metro.x; sim.player.z = SPOTS.metro.z; sim.player.y = 0;
  sim.player.vx = sim.player.vz = 0;
  sim.player.yaw = Math.PI;
  yaw = 0;
  for (const [id, b] of Object.entries(bodies)) Object.assign(b, { x: day.people[id].x, z: day.people[id].z });
  for (const b of crowd) { b.cluster = null; b.model.visible = false; b.ox = b.oz = 0; b.flee = 0; b.fainted = 0; }
  for (const b of [...police, ...crew, ...provs, ...kids]) b.model.visible = false;
  crowdClock = 0; crowdSnap = true; policeClock = 0;
  ambientClock = 12; talked = {}; blockedFor = 0; streamText = '';
  phaseNow = null; lastClips = 0; sceneShown = null; stung = new Set(); crewBlock = null; detainedShown = false;
  chatQueue.length = 0; lastStingT = -99;
  flagsSeen.clear(); pendingLines.length = 0; overheardDone.clear();
  for (const k of Object.keys(flagBarks)) delete flagBarks[k];
  for (const k of Object.keys(bags)) delete bags[k];
  closeChoices();
  phone.reset();
  for (const b of bubbles.splice(0)) b.el.remove();
  $('#loopCount').textContent = `LOOP ${memory.loops}`;
  demo?.reset?.();
}

function showTitle() {
  mode = 'title';
  const seen = memory.links.length;
  $('#screen').innerHTML = `<div class="screen-content"><span class="tiny">SIDE QUEST REPUBLIC</span>
    <h1>Same day.<em>Again.</em></h1>
    <p>It's 10:00 at the Rajiv Chowk exit. By evening something will have happened at Jantar Mantar: groups arrive, barricades go up, the water cannon rolls in. You can't stop it. You can bend it: how bad it gets, where it breaks out, who they go after.</p>
    <p>Pester the police, steal a bus key, rally a crew, film everything. When the day ends, it starts again. You keep everything you learned.</p>
    <div class="buttons"><button class="primary" id="go">${memory.loops > 1 ? `Start loop ${memory.loops}` : 'Start the day'}</button>${seen ? `<button id="wipe">Forget everything</button>` : ''}</div>
    <p class="fine">${seen ? `You know ${seen} of ${Object.keys(LINKS).length} links. ` : ''}WASD move · Space jump · drag to look · E act · F film · R rally · C crew orders · P phone · Tab chaos board · hold T to let time pass. On a phone, use the on-screen buttons.${LONG ? ' · Full-length day (?long).' : ''}</p></div>`;
  $('#screen').classList.remove('hidden');
  $('#hud').classList.add('hidden');
  $('#go').onclick = () => startLoop();
  $('#wipe')?.addEventListener('click', () => { memory = { loops: 1, links: [], hints: [], endings: [], showdowns: [] }; saveMemory(); showTitle(); });
}

function startLoop() {
  resetDay();
  mode = 'play';
  $('#screen').classList.add('hidden');
  $('#hud').classList.remove('hidden');
  onPhase(S.phase(day));
  phone.chat('Pinky', '⚠️ Forwarded many times: "water cannon aa raha hai Jantar pe??" Kisi ko pata hai?');
  chatTrigger('phase:' + phaseNow);
  for (const line of PHONE.TICKER[phaseNow] || []) phone.ticker(line);
  realReels(phaseNow);
  toast(memory.loops === 1 ? 'Ravi\'s speaker and Asha\'s chai stall are at CP, south of here. The stage is in between. Talk to people.' : 'Back at the Metro exit. 10:00. Again.', 6);
}

const WHERE_NAME = { stage: 'the stage', cp: 'the CP shuttle stop', barricade: 'the barricade', parliament: 'Parliament Street' };
const ROLE = {
  spectator: ['Spectator', 'You watched it happen.'], instigator: ['Instigator', 'It broke out where you pushed it.'],
  protector: ['Protector', 'You got people out.'], detained: ['Detained', 'You saw the end through a bus window.'],
  filmer: ['Filmer', 'Your footage is the version people believe.'], peacemaker: ['Peacemaker', 'You turned the temperature down.'],
};
const STANCE = { hold: 'held their ground', scatter: 'scattered, laughing', block: 'blocked the road', protect: 'protected each other' };
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function severity(e) {
  const v = e.intensity ?? e.severity ?? e.how ?? e.howBad;
  if (typeof v === 'number') return { n: v, word: v >= 80 ? 'Brutal' : v >= 60 ? 'Ugly' : v >= 35 ? 'Tense' : v >= 15 ? 'Rattled' : 'Peaceful' };
  const words = { peaceful: 8, 'sit-in': 12, calm: 10, scuffle: 45, tense: 40, ugly: 65, violent: 80, brutal: 92, riot: 95 };
  const w = String(v ?? 'calm');
  return { n: words[w.toLowerCase()] ?? 40, word: w[0].toUpperCase() + w.slice(1) };
}
function timeText(v) {
  if (v === undefined || v === null) return '';
  if (typeof v === 'number') return clockText(v);
  return String(v);
}
function showEnding() {
  mode = 'end';
  closeChoices();
  phone.close();
  const e = S.ending(day);
  const flavourId = e ? (e.flavour ?? e.headlineId ?? e.legacy ?? null) : day.ending;
  const flavour = ENDINGS[flavourId] || null;
  if (flavourId && ENDINGS[flavourId] && !memory.endings.includes(flavourId)) memory.endings.push(flavourId);
  let outcomeKey = null;
  if (e) {
    const sv = severity(e);
    outcomeKey = `${e.outcome ?? sv.word}:${e.role ?? 'spectator'}`;
    if (!memory.showdowns.includes(outcomeKey)) memory.showdowns.push(outcomeKey);
  }
  memory.loops++;
  saveMemory();
  const learned = [...loopLinks].map((id) => `<li>${LINKS[id].from} → ${LINKS[id].to}</li>`).join('');
  let body;
  if (e) {
    const sv = severity(e);
    const role = ROLE[e.role] || [String(e.role || 'Spectator'), ''];
    const targets = [].concat(e.targets ?? e.target ?? []).map((x) => (x === 'player' ? 'you' : x === 'crew' ? 'your crew' : PEOPLE[x]?.name || x)).join(', ') || 'whoever was nearest';
    const callbacks = [].concat(e.callbacks ?? []).slice(0, 5).map((c) => `<li>${esc(typeof c === 'string' ? c : c.text ?? '')}${c.t !== undefined ? `<small>${timeText(c.t)}</small>` : ''}</li>`).join('');
    const where = WHERE_NAME[e.where] || PLACES[e.where]?.name || e.where || 'nowhere in particular';
    const stance = STANCE[e.stance] || e.stance || 'did what they could';
    const when = timeText(e.chargeAt ?? e.when ?? e.timing ?? e.t);
    body = `<span class="tiny">${clockText(day.t)} · LOOP ${memory.loops - 1} ENDS</span>
      <h2>${esc(e.title ?? flavour?.title ?? `${sv.word} at ${where}`)}</h2>
      <p class="headline">${esc(e.headline ?? flavour?.headline ?? '')}</p>
      <div class="endcard">
        <div class="role role-${esc(e.role || 'spectator')}"><small>YOUR ROLE</small><b>${esc(role[0])}</b><span>${esc(e.roleText ?? role[1])}</span></div>
        <dl>
          <dt>Where it broke out</dt><dd>${esc(where)}</dd>
          <dt>How bad</dt><dd><span class="sev"><i style="width:${clamp(sv.n, 3, 100)}%"></i></span>${esc(sv.word)}</dd>
          <dt>Who they went after</dt><dd>${esc(targets)}</dd>
          <dt>What the protesters did</dt><dd>${esc(stance)}</dd>
          <dt>When</dt><dd>${when ? esc(when) + (e.timingText ? ' · ' + esc(e.timingText) : '') : 'No charge came'}</dd>
        </dl>
      </div>
      ${callbacks ? `<h3 class="because">Because of you</h3><ul class="callbacks">${callbacks}</ul>` : ''}
      ${e.text ?? flavour?.text ? `<p>${esc(e.text ?? flavour.text)}</p>` : ''}`;
  } else {
    const lv = levers(day);
    const size = (n) => (n <= 0 ? 'nobody' : n < 6 ? 'a handful' : n < 15 ? 'a small crowd' : n < 30 ? 'a big crowd' : 'packed');
    const f = flavour || { title: 'The day ends', headline: '', text: '' };
    body = `<span class="tiny">${clockText(day.t)} · LOOP ${memory.loops - 1} ENDS</span>
      <h2>${f.title}</h2><p class="headline">${f.headline}</p><p>${f.text}</p>
      <p class="fine">Jantar Mantar: ${size(lv.crowds.stage)} · CP: ${size(lv.crowds.cp)} · barricade: ${size(lv.crowds.barricade)} · Parliament Street: ${size(lv.crowds.parliament)} · police line at ${lv.line ? WHERE_NAME[lv.line] : 'nowhere'}</p>`;
  }
  $('#screen').innerHTML = `<div class="screen-content ending-screen">${body}
    ${learned ? `<p class="fine">What you saw happen this loop:</p><ul class="learned">${learned}</ul>` : ''}
    <div class="buttons"><button class="primary" id="again">Wake up again</button><button id="seeBoard">Chaos board</button></div></div>`;
  $('#screen').classList.remove('hidden');
  $('#hud').classList.add('hidden');
  $('#again').onclick = () => startLoop();
  $('#seeBoard').onclick = () => openBoard();
}

let boardPrior = 'play';
function openBoard() {
  boardPrior = mode === 'board' ? boardPrior : mode;
  mode = 'board';
  closeChoices();
  const people = Object.entries(PEOPLE).map(([id, p]) => {
    const known = Object.entries(HINTS).filter(([h, v]) => v.who === id && memory.hints.includes(h)).map(([, v]) => `<li>${v.text}</li>`).join('');
    const ask = p.voice ? 'Ask Sharma about him.' : 'Talk to them to learn their day.';
    return `<div class="person"><b>${p.name}</b><small>${p.role}</small><ul>${known || `<li class="unknown">${ask}</li>`}</ul></div>`;
  }).join('');
  const links = Object.entries(LINKS).map(([id, l]) => memory.links.includes(id)
    ? `<div class="link${loopLinks.has(id) ? ' new' : ''}"><span>${l.from}</span><i>→</i><span>${l.to}</span></div>`
    : `<div class="link unknown"><span>?</span><span>${l.hint}</span></div>`).join('');
  const endings = Object.entries(ENDINGS).map(([id, e]) => `<div class="ending${memory.endings.includes(id) ? '' : ' unseen'}">${memory.endings.includes(id) ? e.title : '???'}</div>`).join('');
  const showdowns = memory.showdowns.length ? memory.showdowns.map((k) => { const [o, r] = k.split(':'); return `<div class="ending">${esc(o)} · ${esc(ROLE[r]?.[0] || r)}</div>`; }).join('') : '<div class="ending unseen">No showdown yet.</div>';
  const rumours = Object.entries(RUMOURS).map(([id, r]) => knownRumours().includes(id)
    ? `<div class="ending">${r.label}</div>`
    : `<div class="ending unseen">??? (${PEOPLE[HINTS[r.unlock].who].name} knows one)</div>`).join('');
  $('#boardPeople').innerHTML = people;
  $('#boardLinks').innerHTML = `<p class="fine">${memory.links.length} of ${Object.keys(LINKS).length} found.</p>` + links;
  $('#boardEndings').innerHTML = `<p class="fine">Showdowns (outcome · your role)</p>${showdowns}<p class="fine" style="margin-top:12px">Headlines</p>${endings}`;
  $('#boardRumours').innerHTML = rumours;
  $('#board').classList.remove('hidden');
}
function closeBoard() {
  $('#board').classList.add('hidden');
  mode = boardPrior;
}

// --- scenes (reel cinematics) ------------------------------------------------------

function nearestOf(list, pos, pred = () => true) {
  let best = null, bd = 1e9;
  for (const b of list) if (b.model.visible && pred(b)) { const d = dist(b, pos); if (d < bd) { bd = d; best = b; } }
  return best;
}
const actorOf = (id) => {
  if (id === 'player') return sim.player;
  const here = PLACES[cine?.scene?.place] || sim.player;
  if (id === 'mummy') return bodies.kabir?.model.visible ? bodies.kabir : null; // her voice comes out of Kabir's phone
  if (id === 'wireless') return nearestOf(police, here) || (bodies.sharma.model.visible ? bodies.sharma : null);
  if (id === 'raf') return nearestOf(police, here, (b) => b.kind === 'raf') || nearestOf(police, here);
  if (id === 'crowd') return nearestOf(crowd, here);
  if (bodies[id]) return bodies[id].model.visible ? bodies[id] : null;
  if (officerById.has(id)) return officerById.get(id);
  return null;
};
const SPECIAL_NAME = { mummy: 'Mummy', wireless: 'Inspector Rao', raf: 'RAF jawan', crowd: 'Crowd' };
const nameOf = (id) => (id === 'player' ? 'You' : SPECIAL_NAME[id] ?? PEOPLE[id]?.name ?? (officerById.get(id)?.label || String(id).replace(/^\w/, (c) => c.toUpperCase())));
let sceneOptionsOpen = null, chatterT = 0;
/** Watch s.scene: when the engine starts one, play its beats; at the end show its options. */
function updateScene(dt) {
  const sc = S.scene(day);
  const id = sc?.id ?? null;
  if (id && id !== sceneShown) {
    sceneShown = id;
    const data = SCENES[id] || sc.data || null;
    if (data) playScene(id, data, sc);
    else toast(sc.title || 'Something is happening here.', 3);
  }
  if (!id && sceneShown) { sceneShown = null; if (sceneOptionsOpen) { sceneOptionsOpen = null; if (choices?.key === 'scene') closeChoices(); } }
  // While the options are open, people keep talking.
  if (sceneOptionsOpen && !cine.active) {
    chatterT -= dt;
    if (chatterT <= 0) {
      chatterT = 3.6;
      const b = cine.chatterLine(sceneOptionsOpen.data);
      const a = b && actorOf(b.who);
      if (a?.model) bubble(b.who === 'mummy' ? 'kabir' : 'idle:' + b.who, a, nameOf(b.who).toUpperCase() + (b.who === 'mummy' ? ' (PHONE)' : ''), b.line, 3.4);
    }
    const place = PLACES[sceneOptionsOpen.data.place];
    if (place && dist(sim.player, place) > place.r + 8 && choices?.key === 'scene') closeChoices();
  }
}
function playScene(id, data, sc) {
  closeChoices();
  audio.music(data.music);
  cine.play(data, {
    phone: data.camera === 'phone',
    title: data.title,
    onDone: () => {
      const options = sc?.options ?? data.options ?? [];
      if (!options.length) return;
      sceneOptionsOpen = { id, data };
      chatterT = 1.2;
      openChoices({
        key: 'scene', title: data.title || 'What do you do?',
        list: options.map((o, i) => ({
          label: o.intent || o.label, locked: o.available === false, note: o.available === false ? o.why || 'not yet' : '',
          run: () => {
            const r = act(day, { type: 'scene', id, option: i });
            sceneOptionsOpen = null;
            if (r?.ok === false) { toast(r.say || 'It doesn\'t land.', 3); return; }
            const opt = (data.options || [])[i];
            if (opt?.beats?.length) cine.play(data, { beats: opt.beats, phone: data.camera === 'phone', title: data.title });
          },
        })),
      });
    },
  });
}
// Dev hook: play a scene by id (or a scene object) without the engine.
function devPlayScene(idOrData) {
  const data = typeof idOrData === 'string' ? SCENES[idOrData] : idOrData;
  if (data) playScene(data.id || 'dev', data, null);
}

// --- frame -------------------------------------------------------------------

const sepList = [];
function step(dt) {
  const fast = keys.t && !cine.active ? 8 : 1;
  accumulator += dt * fast;
  while (accumulator >= STEP) {
    accumulator -= STEP;
    day.player.x = sim.player.x;
    day.player.z = sim.player.z;
    busWaits();
    tick(day, STEP);
    demo?.fill?.(day, STEP, clockMinutes);
    const ph = S.phase(day);
    if (ph !== phaseNow) onPhase(ph);
    handleEvents();
    handleCues();
    if (day.over) { setTimeout(showEnding, day.ending === 'detained' ? 2500 : 600); mode = 'ending'; closeChoices(); return; }
  }
  const detained = S.detained(day);
  const frozen = cine.mode === 'scene' || cine.mode === 'sting' || detained;
  const forward = frozen ? 0 : (keys.w || keys.arrowup ? 1 : 0) - (keys.s || keys.arrowdown ? 1 : 0);
  const right = frozen ? 0 : (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0);
  const ix = Math.cos(yaw) * right - Math.sin(yaw) * forward;
  const iz = -Math.sin(yaw) * right - Math.cos(yaw) * forward;
  sim.step(dt, { x: ix, z: iz, sprint: keys.shift, jump: keys[' '] && !frozen, heavy: HEAVY.includes(day.player.carrying) });
  keys[' '] = false;
  if (detained) {
    // On the detention bus: you sit inside, by the door.
    sim.player.x = day.bus.x - 0.6; sim.player.z = day.bus.z + 2; sim.player.vx = sim.player.vz = 0;
    if (!detainedShown) { detainedShown = true; closeChoices(); }
  } else if (detainedShown) { detainedShown = false; sim.player.x = day.bus.x - 2.4; sim.player.z = day.bus.z + 3; toast('You\'re off the bus. Walk, don\'t run.', 3); }
  playerModel.visible = !detained;
  updateShuttle();
  updateBodies(dt);
  fx.player = sim.player; fx.phase = phaseNow;
  const hs = S.director(day)?.hotspot;
  fx.hotspotPos = (hs && (PLACES[hs] || hs.x !== undefined && hs)) || (phaseNow === 'tense' || phaseNow === 'showdown' ? PLACES[levers(day).location] : null);
  props.update(day, dt, performance.now() / 1000, fx);
  const g = day.police?.gas; if (g) { fxGas.x = g.x; fxGas.z = g.z; }
  updateCrowd(dt);
  updatePolice(dt);
  updateCrew(dt);
  updateProvs(dt);
  updateKids(dt, performance.now() / 1000);
  sepList.length = 0;
  if (!detained) sepList.push(sim.player);
  for (const b of Object.values(bodies)) if (b.model.visible && b.id !== 'mira') sepList.push(b);
  for (const arr of [crowd, police, crew, provs]) for (const b of arr) if (b.model.visible && !b.fainted && b.posture !== 'seat') sepList.push(b);
  separateBodies(sepList, world.obstacles);
  for (const b of Object.values(bodies)) { b.model.position.set(b.x, b.y || 0, b.z); b.model.rotation.y = b.yaw; }
  for (const arr of [crowd, police, crew, provs, kids]) for (const b of arr) if (b.model.visible) { b.model.position.set(b.x, b.y || 0, b.z); b.model.rotation.y = b.yaw; }
  playerModel.position.set(sim.player.x, sim.player.y, sim.player.z);
  const turn = Math.atan2(Math.sin(sim.player.yaw - playerModel.rotation.y), Math.cos(sim.player.yaw - playerModel.rotation.y));
  playerModel.rotation.y += turn * Math.min(1, dt * 14);
  ambient(dt);
  barks(dt);
  updateFlags();
  overheard();
  updateScene(dt);
  if (choices && bodies[choices.key] && (day.people[choices.key].hidden || dist(sim.player, bodies[choices.key]) > 4)) closeChoices();
  // Chat messages trickle in.
  chatT -= dt;
  if (chatQueue.length && chatT <= 0) { const [who, text] = chatQueue.shift(); phone.chat(who, text); chatT = 1.6; }
  // Clips you posted (and reposts) land on the feed.
  const clips = S.clips(day);
  while (lastClips < clips.length) {
    const c = clips[lastClips++];
    const cap = PHONE.CAPTIONS[c.kind];
    const later = !!(c.later || c.repost || c.repostOf);
    phone.feed({ caption: c.caption ?? pick(later ? cap?.later : cap?.now, lastClips) ?? String(c.kind || 'clip').replace(/-/g, ' '), by: c.by === 'player' || !c.by ? 'you' : c.by, mine: c.by === 'player' || !c.by, real: PHONE.REAL.has(c.kind), later, kind: c.kind, place: PLACES[c.place]?.name });
    chatTrigger(c.kind);
  }
}

function animate(t) {
  const p = sim.player;
  const carryPose = (c) => (c ? POSE[c] : false);
  animateCharacter(playerModel, Math.hypot(p.vx, p.vz), t, { carry: carryPose(day.player.carrying), airborne: !p.grounded, vy: p.vy, important: true, gesture: recT > 0 ? 'phone' : '' });
  for (const [id, b] of Object.entries(bodies)) {
    if (!b.model.visible) continue;
    const s = day.people[id];
    const carrying = s.carrying === 'phone' ? false : s.carrying;
    animateCharacter(b.model, b.speed, t, {
      carry: carryPose(carrying),
      talking: speakingNow(b) || cine.speaking === id || (id === 'mira' && s.mode === 'speech'),
      distance: dist(b, p), important: true,
    });
    if (b.model.userData.phone) b.model.userData.phone.visible = id === 'zoya' && s.carrying === 'phone';
  }
  const surge = clashSurge();
  const tense = phaseNow === 'tense' || phaseNow === 'showdown';
  for (const b of crowd) {
    if (!b.model.visible) continue;
    const still = b.speed < 0.3 || (b.target && dist(b, b.target) < 1.2);
    const cl = b.clusterRef;
    const dancing = still && b.cluster === 'cpParty' && day.objects.speaker.on;
    const sitting = still && b.cluster === 'stage' && day.moment === 'singalong';
    const fainted = b.fainted > 0 || (still && b.cluster === 'stage' && day.heat && !sitting && b.idx % 4 === 0);
    const shoving = surge && b.cluster === surge.group && b.flee <= 0;
    const cheering = b.cluster === 'stage' && ((day.people.mira.mode === 'speech' && day.speech === 'big') || day.moment === 'roast');
    const angry = (b.cluster === 'barricade' && day.minister === 'noshow') || (cl && cl.kind !== 'students' && (tense || /angry|chant|hot/.test(cl.mood || '')));
    const chanting = still && (angry || (tense && b.cluster === 'stage' && b.idx % 3 === 0)) && Math.sin(t * 3 + b.phase) > 0.2;
    let gesture = '';
    if (b.reactT > 0) { b.reactT -= 1 / 60; gesture = b.react === 'laugh' ? 'laugh' : b.react === 'point' ? 'point' : ''; if (b.reactAt && still) b.yaw = Math.atan2(b.reactAt.x - b.x, b.reactAt.z - b.z); }
    if (b.cough > 0 && b.flee <= 0) gesture = 'rest';
    if (dancing) { b.model.position.y = Math.abs(Math.sin(t * 5.2 + b.phase)) * 0.4; b.model.rotation.y = b.yaw + Math.sin(t * 2.6 + b.phase) * 0.7; }
    else if (fainted) b.model.position.y = -0.34;
    else if (sitting) { b.model.position.y = -0.34; b.model.rotation.y = b.yaw + Math.sin(t * 1.4 + b.phase) * 0.12; }
    if (b.flag) waveFlag(b.flag, t * (chanting ? 2 : 1), b.phase);
    animateCharacter(b.model, dancing || sitting || fainted ? 0 : b.speed, t, {
      carry: b.carry && !fainted && !sitting && !gesture ? b.carry : false,
      pose: dancing || ((cheering || chanting) && !b.carry),
      seated: sitting || fainted,
      gesture: fainted ? 'rest' : gesture || (shoving ? 'push' : (sitting && b.idx % 3 === 0) || (dancing && Math.sin(t * 2.6 + b.phase) > 0) ? 'wave' : ''),
      distance: dist(b, p),
    });
  }
  for (const b of police) {
    if (!b.model.visible) continue;
    const ps = b.posture;
    animateCharacter(b.model, b.speed, t, {
      seated: ps === 'seat',
      gesture: ps === 'charge' ? 'charge' : surge && day.police.line === day.clash?.place && ps === 'line' ? 'push' : ps === 'seat' && b.idx % 2 ? 'phone' : '',
      distance: dist(b, p), talking: speakingNow(b),
    });
  }
  for (const b of crew) if (b.model.visible) animateCharacter(b.model, b.speed, t, { carry: b.carry && !b.seated ? b.carry : false, seated: b.seated, gesture: b.seated && b.idx % 2 ? 'wave' : '', distance: dist(b, p) });
  for (const b of provs) if (b.model.visible) animateCharacter(b.model, b.speed, t, { gesture: b.state === 'acting' ? (Math.sin(t * 2 + b.idx) > 0 ? 'point' : 'push') : b.state === 'joined' ? 'push' : '', distance: dist(b, p) });
  for (const b of kids) if (b.model.visible) { b.model.position.y = Math.abs(Math.sin(t * 6 + b.idx)) * 0.25; animateCharacter(b.model, 0, t, { pose: true, distance: dist(b, p) }); }
}

// Camera: a follow camera that never sits behind scenery. Preallocated vectors: no garbage per frame.
const camTarget = new THREE.Vector3(), camDesired = new THREE.Vector3(), camToV = new THREE.Vector3(), camBack = new THREE.Vector3();
function camera(dt) {
  if (mode === 'title' || mode === 'loading') {
    const a = performance.now() * 0.00004;
    world.camera.position.set(Math.sin(a) * 18, 9, -8 + Math.cos(a) * 18);
    world.camera.lookAt(4, 1, -14);
    return;
  }
  if (cine.update(dt)) return;
  const p = sim.player;
  if (S.detained(day)) {
    // Looking in at the bus from the pavement.
    camTarget.set(day.bus.x, 1.6, day.bus.z + 1);
    camDesired.set(day.bus.x - 7.5, 3.4, day.bus.z + 5);
    world.camera.position.lerp(camDesired, 1 - Math.exp(-dt * 4));
    world.camera.lookAt(camTarget);
    return;
  }
  camTarget.set(p.x, 1.55 + p.y * 0.7, p.z);
  camDesired.set(camTarget.x + Math.sin(yaw) * zoom, camTarget.y + zoom * pitch, camTarget.z + Math.cos(yaw) * zoom);
  for (const o of world.obstacles) {
    if (o.h < 2) continue;
    if (o.h < 3.5) {
      if (Math.abs(camDesired.x - o.x) < o.w / 2 + 1 && Math.abs(camDesired.z - o.z) < o.d / 2 + 1) camDesired.y = Math.max(camDesired.y, o.h + 1.2);
      continue;
    }
    for (let f = 0.15; f < 1; f += 0.05) {
      const x = camTarget.x + (camDesired.x - camTarget.x) * f, z = camTarget.z + (camDesired.z - camTarget.z) * f, y = camTarget.y + (camDesired.y - camTarget.y) * f;
      if (y > (o.base || 0) - 0.2 && y < o.h + 0.3 && Math.abs(x - o.x) < o.w / 2 + 0.2 && Math.abs(z - o.z) < o.d / 2 + 0.2) {
        camDesired.lerpVectors(camTarget, camDesired, Math.max(0.2, f - 0.1));
        break;
      }
    }
  }
  camToV.subVectors(camDesired, camTarget);
  const len = camToV.length();
  camToV.normalize();
  ray.far = len;
  ray.set(camTarget, camToV);
  let clear = ray.intersectObjects(occluders, false)[0]?.distance ?? len;
  ray.set(camDesired, camBack.copy(camToV).negate());
  const back = ray.intersectObjects(occluders, false).at(-1);
  if (back) clear = Math.min(clear, len - back.distance);
  if (clear < len) {
    camDesired.copy(camTarget).addScaledVector(camToV, Math.max(1.2, clear - 0.4));
    world.camera.position.copy(camDesired);
  } else world.camera.position.lerp(camDesired, 1 - Math.exp(-dt * 9));
  world.camera.lookAt(camTarget);
  // Scuffles, the charge and a chase shake the picture a little.
  const shaking = (day?.clash && dist(p, LINE_LAYOUT[day.clash.place] || p) < 22) || (props.charge.active && dist(p, props.charge) < 18) || S.chasedBy(day);
  if (shaking && mode === 'play') {
    const k = S.chasedBy(day) ? 0.025 : 0.05, n = performance.now() / 1000;
    world.camera.rotation.z += Math.sin(n * 31) * k * 0.4;
    world.camera.position.y += Math.sin(n * 23) * k;
  }
  for (const o of overhead) {
    const box = o.userData.box;
    const near = Math.hypot(Math.max(box.min.x - p.x, 0, p.x - box.max.x), Math.max(box.min.z - p.z, 0, p.z - box.max.z)) < 7;
    const want = near ? 0.22 : 1;
    if (!o.userData.own && want < 1) {
      o.material = Array.isArray(o.material) ? o.material.map((m) => m.clone()) : o.material.clone();
      o.userData.own = true;
    }
    if (!o.userData.own) continue;
    for (const m of [].concat(o.material)) {
      m.transparent = true;
      m.opacity += (want - m.opacity) * (1 - Math.exp(-dt * 8));
      m.depthWrite = m.opacity > 0.95;
    }
  }
}

const CARRY_TEXT = {
  key: 'Iqbal\'s bus key is in your pocket. Q puts it down.',
  speaker: 'You\'re carrying Ravi\'s speaker. Q puts it down and switches it on.',
  megaphone: 'You have Dev\'s megaphone. Give it to someone, or Q to put it down.',
  phone: 'Zoya\'s phone is in your pocket. No phone, no live stream. Q puts it down.',
  water: 'You\'re carrying Sana\'s water crate. Her tent is beside the stage.',
};
let hudCache = {};
const setText = (sel, text) => { if (hudCache[sel] !== text) { hudCache[sel] = text; $(sel).textContent = text; } };
const _camDir = new THREE.Vector3();
function updateHUD(dt) {
  setText('#clockTime', clockText(day.t));
  setText('#phaseName', (PHASE_NAME[phaseNow] || '').toUpperCase());
  $('#clock').dataset.phase = phaseNow;
  const place = placeAt(sim.player);
  setText('#place', place ? PLACES[place].name.toUpperCase() : '');
  prompt = mode === 'play' && !choices && !cine.active ? findPrompt() : null;
  $('#prompt').classList.toggle('hidden', !prompt);
  if (prompt) setText('#promptText', prompt.text);
  const c = day.player.carrying;
  $('#carrying').classList.toggle('hidden', !c || S.detained(day));
  if (c) setText('#carrying', CARRY_TEXT[c]);
  // Aura and heat. Heat pulses while police are watching you.
  const rep = S.rep(day);
  $('#rep').classList.toggle('hidden', !rep);
  if (rep) {
    setText('#auraN', String(Math.round(rep.aura ?? 0)));
    $('#heatBar i').style.width = clamp(rep.heat ?? 0, 0, 100) + '%';
    let watched = !!S.chasedBy(day);
    if (!watched && (rep.heat ?? 0) > 0) for (const b of police) if (b.model.visible && dist(b, sim.player) < 14) { watched = true; break; }
    if (!watched && (rep.heat ?? 0) >= 25 && dist(bodies.sharma, sim.player) < 14) watched = true;
    $('#rep').classList.toggle('watched', watched);
    $('#rep').classList.toggle('hot', (rep.heat ?? 0) >= 70);
  }
  // Chase indicator.
  const ch = S.chasedBy(day);
  $('#chase').classList.toggle('hidden', !ch);
  $('#vignette').classList.toggle('on', !!ch);
  if (ch) {
    const who = officerById.get(ch) || bodies[ch];
    const d = who ? Math.round(dist(who, sim.player)) : null;
    setText('#chaseText', `${PEOPLE[ch]?.name?.toUpperCase() || 'A CONSTABLE'} IS CHASING YOU${d !== null ? ` · ${d} M` : ''}`);
  }
  audio.chase(!!ch);
  // Detained card.
  $('#detained').classList.toggle('hidden', !S.detained(day));
  // The one objective card: the nearest opportunity, with a compass arrow.
  oppT -= dt;
  const o = mode === 'play' && !cine.active ? nearestOpportunity() : null;
  $('#objective').classList.toggle('hidden', !o);
  if (o) {
    setText('#objText', o.label);
    const far = o.x !== undefined && o.d > 3;
    setText('#objDist', far ? `${Math.round(o.d)} m` : 'here');
    if (far) {
      world.camera.getWorldDirection(_camDir);
      const a = Math.atan2(o.x - sim.player.x, o.z - sim.player.z) - Math.atan2(_camDir.x, _camDir.z);
      $('#objArrow').style.transform = `rotate(${-a}rad)`;
    }
    $('#objArrow').classList.toggle('hidden', !far);
  }
  // Toasts, radio, phase banner, REC flash.
  if (radioT > 0 && (radioT -= dt) <= 0) $('#radio').classList.add('hidden');
  if (phaseBannerT > 0 && (phaseBannerT -= dt) <= 0) { $('#phaseBanner').classList.remove('on'); $('#phaseBanner').classList.add('hidden'); }
  if (recT > 0 && (recT -= dt) <= 0) $('#recFlash').classList.add('hidden');
  phone.update(dt);
  if (day.stream.live) phone.live({ on: true, viewers: day.stream.viewers });
}

let devT = 0, fpsN = 0, fpsT = 0, fps = 0;
function updateDev(dt) {
  if (!DEV) return;
  fpsN++; fpsT += dt; if (fpsT >= 1) { fps = fpsN / fpsT; fpsN = 0; fpsT = 0; }
  if ((devT -= dt) > 0) return;
  devT = 0.3;
  const d = S.director(day) || {}, rep = S.rep(day) || {}, pol = day.police || {};
  const groups = Object.entries(S.groups(day)).map(([k, g]) => `${k}:${g?.size ?? 0}@${g?.place ?? '-'}${g?.mood ? '/' + g.mood : ''}`).join(' ');
  $('#dev').textContent = [
    `${clockText(day.t)} ${phaseNow}  fps ${fps.toFixed(0)}  calls ${world.renderer.info.render.calls}`,
    `director  intensity ${d.intensity ?? '-'}  hotspot ${d.hotspot ?? '-'}  target ${d.target ?? '-'}  stance ${d.stance ?? '-'}  chargeAt ${d.chargeAt !== undefined ? clockText(d.chargeAt) : '-'}`,
    `rep  aura ${rep.aura ?? '-'} heat ${rep.heat ?? '-'} help ${rep.help ?? '-'} nuisance ${rep.nuisance ?? '-'}  crew ${S.crew(day).length}  chased ${S.chasedBy(day) ?? '-'}  detained ${S.detained(day)}`,
    `groups  ${groups || '-'}`,
    `police  line ${pol.line ?? '-'} watch ${pol.watch ?? '-'} barricades [${(pol.barricades || []).join(',')}] raf ${pol.raf ?? 0} cannon ${pol.cannon?.state ?? '-'} gas ${pol.gas ? 'yes' : '-'} charge ${pol.charge?.place ?? '-'}`,
    `provocateurs  ${S.provocateurs(day).map((p) => p.state).join(',') || '-'}  scene ${S.scene(day)?.id ?? '-'}  officers ${S.officers(day) ? Object.keys(S.officers(day)).length : 'fallback'}`,
    `engine  phaseAt ${!!R.phaseAt} opportunities ${!!R.opportunities} drainCues ${!!R.drainCues} setTempo ${!!R.setTempo}  scenes ${Object.keys(SCENES).length} barks ${!!BARKS}`,
  ].join('\n');
}

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, last ? (now - last) / 1000 : 1 / 60);
  last = now;
  if (!world) return;
  const t = now / 1000;
  if (mode === 'play') step(dt);
  if (day && mode !== 'loading') {
    animate(t);
    updateItems(t);
    updateHUD(dt);
    updateDev(dt);
    lighting.update(clockMinutes(day.t), dt, { gas: props.gasAt(world.camera.position.x, world.camera.position.z), focus: sim.player });
  }
  camera(dt);
  document.body.classList.toggle('cine-on', cine.active);
  updateBubbles(dt);
  if (toastTime > 0 && (toastTime -= dt) <= 0) { $('#toast').style.opacity = 0; $('#hud').classList.remove('toasting'); }
  world.renderer.render(world.scene, world.camera);
}

function press(k) {
  if (mode !== 'play') return;
  if (cine.mode === 'sting') { cine.skip(); return; }
  if (cine.mode === 'scene') { if (k === ' ' || k === 'enter' || k === 'e') cine.next(); return; }
  if (k === 'e' && prompt) prompt.run();
  if (k === 'q' && day.player.carrying) drop();
  if (k === 'p') phone.toggle();
  if (k === 'f') film();
  if (k === 'r') rally();
  if (k === 'c') openStance();
}
function setupInput() {
  addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if ([' ', 'tab', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
    if (k === 'tab') { if (mode === 'board') closeBoard(); else if (mode === 'play' || mode === 'end') openBoard(); return; }
    if (k === 'escape') {
      if (mode === 'board') { closeBoard(); return; }
      if (cine.active) { cine.skip(); return; }
      if (phone.isOpen) { phone.close(); return; }
      if (choices) { closeChoices(); return; }
    }
    if (e.repeat) return;
    if (phone.isOpen && /^[1-3]$/.test(k) && !choices) { phone.setTab(['chat', 'feed', 'ticker'][Number(k) - 1]); return; }
    if (choices && /^[1-9]$/.test(k)) { choose(Number(k) - 1); return; }
    keys[k] = true;
    press(k);
  });
  addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
  addEventListener('blur', () => { keys = {}; });
  const c = world.renderer.domElement;
  c.addEventListener('pointerdown', (e) => { if (cine.active && mode === 'play') { cine.next(); return; } dragging = true; lastMouse = { x: e.clientX, y: e.clientY }; c.setPointerCapture(e.pointerId); });
  c.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    yaw -= (e.clientX - lastMouse.x) * 0.006;
    pitch = clamp(pitch + (e.clientY - lastMouse.y) * 0.003, 0.14, 1.15);
    lastMouse = { x: e.clientX, y: e.clientY };
  });
  c.addEventListener('pointerup', () => (dragging = false));
  c.addEventListener('wheel', (e) => { e.preventDefault(); zoom = clamp(zoom + e.deltaY * 0.007, 4.5, 16); }, { passive: false });
  addEventListener('resize', () => {
    world.camera.aspect = innerWidth / innerHeight;
    world.camera.updateProjectionMatrix();
    world.renderer.setSize(innerWidth, innerHeight);
  });
  $('#cine').addEventListener('pointerdown', () => { if (mode === 'play') cine.next(); });
  for (const btn of document.querySelectorAll('#touch [data-key]')) {
    const k = btn.dataset.key;
    const up = () => { keys[k] = false; };
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (mode === 'board' && k === 'tab') { closeBoard(); return; }
      if (mode !== 'play') { if (k === 'tab' && mode === 'end') openBoard(); return; }
      keys[k] = true;
      if (k === 'tab') { keys[k] = false; openBoard(); return; }
      press(k);
    });
    for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) btn.addEventListener(ev, up);
  }
  $('#prompt').addEventListener('click', () => { if (mode === 'play' && prompt) prompt.run(); });
  $('#closeBoard').onclick = closeBoard;
  $('#restartLoop').onclick = () => { closeBoard(); if (mode === 'end') startLoop(); else { finish(day, null); memory.loops++; saveMemory(); startLoop(); } };
}

(async () => {
  try {
    world = await buildWorld($('#scene'), (name) => ($('#loadtext').textContent = 'Preparing ' + name.replaceAll('-', ' ') + '…'));
    await enhanceEnvironment(THREE, world);
    expandWorld(world, { bodies: () => (sim ? [sim.player] : []) });
    await loadCharacters((name) => ($('#loadtext').textContent = 'Preparing ' + name + ' characters…'));
    placeProps();
    const box = new THREE.Box3(), size = new THREE.Vector3();
    world.scene.traverse((o) => {
      if (!o.isMesh || o.isSkinnedMesh || o.isInstancedMesh) return;
      box.setFromObject(o);
      const tris = (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3;
      if (box.max.y > 3.5 && box.max.y - box.min.y > 0.3 && tris < 600) occluders.push(o);
      box.getSize(size);
      if (box.min.y > 2.4 && tris < 5000 && Math.max(size.x, size.z) < 14) { o.userData.box = box.clone(); overhead.push(o); }
    });
    // The player collides with set-piece barricades too; NPC routines use the original list.
    playerObstacles = world.obstacles.slice();
    sim = new Simulation(playerObstacles);
    sim.police = [];
    lighting = createLighting(world);
    props = createProps(world, { PLACES, playerObstacles });
    playerModel = makeCharacter({ color: '#df754c', pants: '#31565a', backpack: true, gender: 'male' });
    world.scene.add(playerModel);
    phone = createPhone($('#phone'), $('#phonePill'), { clock: () => (day ? clockText(day.t) : ''), nameOf: (id) => PEOPLE[id]?.name ?? id });
    cine = createCinematic({
      camera: world.camera, dom: $('#cine'), actor: actorOf, nameOf,
      onReact: (kind, beat) => {
        audio.cue(kind === 'sfx' ? 'sfx-' + beat.sfx : 'scene-' + kind, beat);
        if (kind === 'laugh') react('crowd-laugh', actorOf(beat.who) || sim.player);
        if (kind === 'silence') react('awkward-silence', actorOf(beat.who) || sim.player);
      },
    });
    day = createDay();
    makePeople();
    await loadOptional();
    resetDay();
    setupInput();
    await warmupRenderer({ renderer: world.renderer, scene: world.scene, camera: world.camera, onProgress: (text) => ($('#loadtext').textContent = text) });
    $('#loading').classList.add('hidden');
    if (DEV) $('#dev').classList.remove('hidden');
    showTitle();
    requestAnimationFrame(frame);
    // For debugging and automated browser checks.
    window.__loop = {
      get day() { return day; }, get sim() { return sim; }, get mode() { return mode; }, get world() { return world; },
      startLoop, openBoard, act, at, advance, SPOTS, bodies, crowd, police, crew, provs, props, phone, cine, lighting,
      snap: () => { crowdSnap = true; crowdClock = 0; policeClock = 0; },
      playScene: devPlayScene, setAudio,
      view: (y, p = pitch, z = zoom) => { yaw = y; pitch = p; zoom = z; },
      sting: (name) => { const st = STINGS[name]; if (st) cine.playSting({ target: () => props.focus[st[0]], title: st[1], sub: st[2] }); },
      showEnding,
    };
  } catch (e) {
    console.error(e);
    $('#loadtext').textContent = 'The 3D scene could not start. WebGL 2 is required. ' + e.message;
  }
})();
