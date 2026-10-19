// Client for the looping day: draws the rules' world state in the existing 3D city.
// The rules (rules.js) decide what happens; this file only shows it and turns keys into actions.
import { THREE, buildWorld, cube, ball, cylinder, sign, mat } from '../world.js?v=27';
import { expandWorld } from '../world-expansion.js?v=27';
import { enhanceEnvironment } from '../environment-detail.js?v=27';
import { loadCharacters, makeCharacter, animateCharacter, CARRY_POSES } from '../characters.js?v=27';
import { Simulation, clamp, dist, steer, visible, separateBodies } from '../simulation.js?v=27';
import { warmupRenderer } from '../render-warmup.js?v=27';
import {
  createDay, tick, act, talkState, drainEvents, finish, levers, moods, isFree,
  clockText, placeAt, SPOTS, PLACES, at, advance,
} from './rules.js?v=4';
import { PEOPLE, TALK, AGAIN, HINTS, LINKS, ENDINGS, RUMOURS, AMBIENT } from './content.js?v=4';

const $ = (s) => document.querySelector(s);
const STEP = 0.1;
const CROWD_POOL = 44;
const SQUAD = 6;
const SAVE_KEY = 'sqr-loop-v1';
const OBJECTS = ['speaker', 'key', 'megaphone', 'phone', 'water'];
const HEAVY = ['speaker', 'water'];
const POSE = { speaker: 'speaker', water: 'water', key: 'key', phone: 'phone', megaphone: 'key' };

let world, sim, day, mode = 'loading';
let playerModel, keys = {}, yaw = 0, pitch = 0.38, zoom = 9, dragging = false, lastMouse = null;
let accumulator = 0, last = 0, toastTime = 0, prompt = null, choices = null, ambientClock = 12, ambientTurn = 0;
const bodies = {}; // person id -> { model, x, z, y, speed, yaw }
const crowd = []; // pooled crowd bodies
const squad = []; // Rao's police line
const bubbles = [];
const items = {};
let shuttle, shuttleObstacle;
const occluders = []; // static scenery the follow camera must not sit behind (signs, banners, walls)
const overhead = []; // banners and signs above head height, faded when you stand right under them
let talked = {}; // how often you've asked each person about their current situation today
const ray = new THREE.Raycaster();
let memory = loadMemory();
let loopLinks = new Set();

// --- memory that survives the loop ---------------------------------------

function loadMemory() {
  try {
    const m = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (m && Array.isArray(m.links)) return { loops: m.loops || 1, links: m.links, hints: m.hints || [], endings: m.endings || [] };
  } catch {}
  return { loops: 1, links: [], hints: [], endings: [] };
}
function saveMemory() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(memory)); } catch {}
}
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

// --- props ----------------------------------------------------------------

function speakerModel() {
  const g = new THREE.Group();
  cube(0.75, 1, 0.5, '#263c33', 0, 0.55, 0, g);
  for (const y of [0.35, 0.8]) {
    const disk = cylinder(0.2, 0.2, 0.04, '#111e19', 0, y, 0.27, g, 24);
    disk.rotation.x = Math.PI / 2;
    ball(0.07, '#536558', 0, y, 0.3, g, 1, 1, 0.4);
  }
  cube(0.5, 0.04, 0.15, '#5b6f56', 0, 1.08, 0, g);
  const led = cube(0.1, 0.05, 0.02, '#d4e87a', 0.22, 1, 0.26, g);
  g.userData.led = led;
  return g;
}
function keyModel() {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.045, 8, 20), mat('#e7c45b', 0.3));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.2;
  g.add(ring);
  cube(0.07, 0.06, 0.5, '#e7c45b', 0, 0.2, 0.34, g);
  cube(0.15, 0.06, 0.06, '#e7c45b', 0.05, 0.2, 0.5, g);
  return g;
}
function megaphoneModel() {
  const g = new THREE.Group();
  const horn = cylinder(0.08, 0.24, 0.5, '#f1ede0', 0, 0.3, 0.12, g, 18);
  horn.rotation.x = Math.PI / 2;
  const rim = cylinder(0.25, 0.25, 0.04, '#c8402f', 0, 0.3, 0.38, g, 18);
  rim.rotation.x = Math.PI / 2;
  cube(0.07, 0.22, 0.08, '#2c2c2c', 0, 0.16, -0.02, g);
  return g;
}
function phoneModel() {
  const g = new THREE.Group();
  cube(0.12, 0.02, 0.24, '#121b1f', 0, 0.02, 0, g);
  cube(0.1, 0.005, 0.2, '#5d8fb0', 0, 0.033, 0, g);
  cube(0.02, 0.02, 0.4, '#e6e6e6', 0.03, 0.02, -0.3, g); // charging cable
  return g;
}
function waterModel() {
  const g = new THREE.Group();
  cube(0.7, 0.36, 0.5, '#2d6fa3', 0, 0.18, 0, g);
  for (let i = 0; i < 6; i++) cylinder(0.07, 0.07, 0.34, '#bfe3f2', -0.22 + (i % 3) * 0.22, 0.5, i < 3 ? -0.11 : 0.11, g, 8);
  return g;
}
function placeProps() {
  // A chai stall at the CP shuttle stop, where Asha sells and everyone gossips.
  world.put('chai-cart', -18, -36, 0.3);
  world.obstacles.push({ id: 'cp-chai', x: -18, z: -36, w: 3, d: 2, h: 3 });
  // The barricade between Jantar Mantar and Parliament Street, with a gap Sharma stands in.
  for (const z of [-10.5, -7.5, -1.5, 1.5]) {
    world.put('barricade', 40, z, Math.PI / 2);
    world.obstacles.push({ id: 'loop-barricade', x: 40, z, w: 0.7, d: 3, h: 1.3 });
  }
  const signs = [
    ['PARLIAMENT STREET →', 50, -9, -Math.PI / 2],
    ['CP SHUTTLE STOP', 4, -38.5, 0],
    ['JANTAR MANTAR STOP', 4, 5.5, 0],
  ];
  for (const [text, x, z, r] of signs) {
    const s = sign(text, 3.4, 0.6);
    s.position.set(x, 2.6, z);
    s.rotation.y = r;
    world.scene.add(s);
    cylinder(0.05, 0.05, 2.6, '#4c5a50', x, 1.3, z, world.scene);
  }
  // Sana's first-aid tent beside the stage: an open canopy, so people can walk under it.
  const tent = new THREE.Group();
  for (const [dx, dz] of [[-1.3, -1], [1.3, -1], [-1.3, 1], [1.3, 1]]) cylinder(0.04, 0.04, 2.3, '#cfd5d2', dx, 1.15, dz, tent);
  cube(2.9, 0.08, 2.3, '#f3f1ea', 0, 2.32, 0, tent);
  cube(0.5, 0.14, 0.04, '#c8402f', 0, 2.1, 1.17, tent);
  cube(0.14, 0.5, 0.04, '#c8402f', 0, 2.1, 1.17, tent);
  cube(1.2, 0.7, 0.6, '#dfe5e2', -0.6, 0.35, -0.6, tent);
  tent.position.set(SPOTS.sanaTent.x - 1.2, 0, SPOTS.sanaTent.z - 0.4);
  world.scene.add(tent);
  // The legacy stationary bus becomes the shuttle.
  shuttle = world.bus;
  const i = world.obstacles.findIndex((o) => o.id === 'legacy-bus');
  if (i >= 0) world.obstacles.splice(i, 1);
  shuttleObstacle = { id: 'shuttle', x: SPOTS.busCP.x, z: SPOTS.busCP.z, w: 2.8, d: 10, h: 3.4 };
  world.obstacles.push(shuttleObstacle);
  shuttle.rotation.y = 0;

  items.speaker = speakerModel();
  items.key = keyModel();
  items.megaphone = megaphoneModel();
  items.phone = phoneModel();
  items.water = waterModel();
  // A soft ring under anything you could pick up, so it reads from a distance.
  for (const id of OBJECTS) {
    world.scene.add(items[id]);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.68, 32), new THREE.MeshBasicMaterial({ color: '#e5ff86', transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2;
    world.scene.add(ring);
    items[id + 'Ring'] = ring;
  }
}

// --- people ---------------------------------------------------------------

function makePeople() {
  for (const [id, p] of Object.entries(PEOPLE)) {
    if (p.voice) continue; // Inspector Rao is only ever a voice on the wireless
    const model = makeCharacter(p.look);
    world.scene.add(model);
    const s = day.people[id];
    bodies[id] = { id, model, x: s.x, z: s.z, y: 0, speed: 0, yaw: 0, radius: 0.4 };
  }
  const colors = ['#c26b4f', '#5f86a8', '#d9b75c', '#7f9c6a', '#a378a6', '#e0dccd', '#3e5c58', '#b8925d'];
  for (let i = 0; i < CROWD_POOL; i++) {
    const model = makeCharacter({ color: colors[i % colors.length], pants: i % 3 ? '#2f3a44' : '#6f5e47' });
    model.visible = false;
    world.scene.add(model);
    crowd.push({ model, x: 0, z: 0, y: 0, speed: 0, yaw: 0, radius: 0.36, group: null, target: null, side: i % 2 ? 1 : -1, phase: i * 1.7 });
  }
  for (let i = 0; i < SQUAD; i++) {
    const model = makeCharacter({ police: true });
    model.visible = false;
    world.scene.add(model);
    squad.push({ model, x: 0, z: 0, y: 0, speed: 0, yaw: 0, radius: 0.4, side: i % 2 ? 1 : -1 });
  }
}

// Where each crowd group stands, and where its people come from.
const GROUPS = {
  cpWaiting: { center: { x: 4.5, z: -31 }, r: 3.8, spawn: { x: -4, z: -47 } },
  cpParty: { center: null, r: 3.2, spawn: { x: -8, z: -46 } },
  stage: { center: { x: 0, z: -5.5 }, r: 5.5, spawn: { x: 10, z: 4 } },
  barricade: { center: { x: 32.6, z: -3.2 }, r: 3.4, spawn: { x: 12, z: -6 } },
  parliament: { center: { x: 62, z: -4 }, r: 6, spawn: { x: 40, z: -4.5 } },
};
// Where Rao's line stands at each place: a row centred on (x, z), along the given axis, facing yaw.
const LINE_LAYOUT = {
  stage: { x: 0, z: 1.8, axis: 'x', yaw: Math.PI },
  cp: { x: 4.5, z: -26.4, axis: 'x', yaw: Math.PI },
  barricade: { x: 37.8, z: -4.5, axis: 'z', yaw: -Math.PI / 2 },
  parliament: { x: 55.5, z: -4, axis: 'z', yaw: Math.PI / 2 },
};
function crowdTargets() {
  const c = day.crowd, sp = day.objects.speaker;
  GROUPS.cpParty.center = { x: sp.x, z: sp.z + 2.4 };
  const counts = { cpWaiting: c.cpWaiting, cpParty: c.cpParty, stage: c.stage, barricade: c.barricade, parliament: c.parliament };
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const scale = total > CROWD_POOL ? CROWD_POOL / total : 1;
  const want = {};
  for (const [g, n] of Object.entries(counts)) want[g] = Math.round(n * scale);
  return want;
}
function slot(group, i) {
  const g = GROUPS[group], a = i * 2.399, r = g.r * Math.sqrt((i + 0.5) / 18);
  return { x: g.center.x + Math.cos(a) * r, z: g.center.z + Math.sin(a) * r };
}
let crowdClock = 0, crowdSnap = true;
function updateCrowd(dt) {
  crowdClock -= dt;
  if (crowdClock <= 0) {
    crowdClock = 0.5;
    const want = crowdTargets();
    const free = [];
    for (const g of Object.keys(GROUPS)) {
      const members = crowd.filter((b) => b.group === g);
      for (const b of members.slice(want[g])) { b.group = null; free.push(b); }
    }
    for (const g of Object.keys(GROUPS)) {
      let members = crowd.filter((b) => b.group === g);
      while (members.length < want[g]) {
        // Prefer someone already walking away, otherwise bring a new person in from where this group arrives.
        let b = free.sort((a, c) => dist(a, GROUPS[g].center) - dist(c, GROUPS[g].center)).shift();
        if (!b) {
          b = crowd.find((x) => !x.group && !x.model.visible);
          if (!b) break;
          Object.assign(b, GROUPS[g].spawn);
          if (g === 'stage' && day.bus.phase !== 'jantar') Object.assign(b, { x: -14, z: 12 });
        }
        b.group = g;
        b.model.visible = true;
        members.push(b);
      }
      members.forEach((b, i) => {
        b.target = slot(g, i);
        if (crowdSnap) Object.assign(b, b.target);
      });
    }
    // People released from a group leave: onto the shuttle if it's loading, otherwise out of the square.
    crowdSnap = false;
    for (const b of free) b.target = day.bus.phase === 'toJantar' || day.bus.phase === 'cp' ? SPOTS.busDoor : { x: -4, z: -48 };
  }
  const surge = clashSurge();
  for (const b of crowd) {
    if (!b.model.visible) continue;
    const ox = b.x, oz = b.z;
    let target = b.target;
    // In a clash the front of the crowd heaves at the police line and falls back, again and again.
    if (surge && b.group === surge.group && target) {
      const push = (0.5 + 0.5 * Math.sin(day.t * 1.7 + b.phase)) * 2.6;
      target = { x: target.x + surge.dx * push, z: target.z + surge.dz * push };
    }
    // Group members stop once roughly in place, so bodies nudged apart don't shuffle on the spot forever.
    b.speed = target && dist(b, target) > (b.group && b.group !== surge?.group ? 0.9 : 0.4) ? steer(b, target, b.group ? 3.4 : 3.8, dt, world.obstacles) : 0;
    if (b.speed > 0.1) b.yaw = Math.atan2(b.x - ox, b.z - oz);
    else if (b.group === 'stage') b.yaw = Math.atan2(0 - b.x, -14 - b.z);
    else if (surge && b.group === surge.group) b.yaw = Math.atan2(surge.dx, surge.dz);
    else if (b.group === 'barricade') b.yaw = Math.PI / 2;
    else if (b.group === 'cpParty') b.yaw = Math.atan2(day.objects.speaker.x - b.x, day.objects.speaker.z - b.z);
    if (!b.group && b.target && dist(b, b.target) < 1) b.model.visible = false;
    b.model.position.set(b.x, 0, b.z);
    b.model.rotation.y = b.yaw;
  }
}

const CLASH_GROUP = { stage: 'stage', cp: 'cpWaiting', barricade: 'barricade', parliament: 'parliament' };
// Which crowd group is shoving, and the direction from it to the police line.
function clashSurge() {
  const place = day.clash?.place, L = LINE_LAYOUT[place], group = CLASH_GROUP[place];
  if (!L || !GROUPS[group].center) return null;
  const c = GROUPS[group].center, d = Math.hypot(L.x - c.x, L.z - c.z) || 1;
  return { group, dx: (L.x - c.x) / d, dz: (L.z - c.z) / d };
}

function updateSquad(dt) {
  const L = LINE_LAYOUT[day.police.line];
  const surge = day.clash?.place === day.police.line ? clashSurge() : null;
  squad.forEach((b, i) => {
    if (!L) { b.model.visible = false; return; }
    const off = (i - (SQUAD - 1) / 2) * 1.5;
    const target = L.axis === 'x' ? { x: L.x + off, z: L.z } : { x: L.x, z: L.z + off };
    if (surge) { // the line shoves back
      const back = Math.max(0, Math.sin(day.t * 1.7 + i * 0.9)) * 0.9;
      target.x -= surge.dx * back; target.z -= surge.dz * back;
    }
    if (!b.model.visible) { b.model.visible = true; Object.assign(b, L.axis === 'x' ? { x: target.x, z: target.z + 9 } : { x: target.x + 9, z: target.z }); }
    const ox = b.x, oz = b.z;
    b.speed = dist(b, target) > 0.3 ? steer(b, target, day.clash ? 6 : 4, dt, world.obstacles) : 0;
    b.yaw = b.speed > 0.1 ? Math.atan2(b.x - ox, b.z - oz) : L.yaw;
    b.model.position.set(b.x, 0, b.z);
    b.model.rotation.y = b.yaw;
  });
}

function updateBodies(dt) {
  for (const [id, b] of Object.entries(bodies)) {
    const s = day.people[id];
    b.model.visible = !s.hidden;
    if (id === 'mira') {
      Object.assign(b, { x: s.x, z: s.z, y: 0.74, speed: 0 });
      b.yaw = 0;
    } else if (s.hidden) {
      Object.assign(b, { x: s.x, z: s.z });
    } else {
      if (dist(b, s) > 14) Object.assign(b, { x: s.x, z: s.z });
      const ox = b.x, oz = b.z;
      b.speed = dist(b, s) > 0.3 ? steer(b, s, 3.8, dt, world.obstacles) : 0;
      if (b.speed > 0.1) b.yaw = Math.atan2(b.x - ox, b.z - oz);
      else if (id === 'sharma' && s.post === 'barricade') b.yaw = -Math.PI / 2;
      else if (id === 'dev' && s.mode === 'waiting') b.yaw = Math.PI / 2;
      else if (['ravi', 'kabir', 'dev', 'nikhil', 'sana'].includes(id) && placeAt(s) === 'stage') b.yaw = Math.atan2(-b.x, -14 - b.z);
      else if (id === 'asha' && s.mode === 'stall') b.yaw = 0.3;
    }
    b.model.position.set(b.x, b.y, b.z);
    b.model.rotation.y = b.yaw;
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
    if (id === 'phone' && o.holder === 'zoya') it.visible = false; // in her hand, too small to matter
    if (holderModel) { attach(it, holderModel, POSE[id]); continue; }
    if (it.parent !== world.scene) world.scene.add(it);
    const raised = o.holder === 'hook' || o.holder === 'cart';
    it.position.set(o.x, raised ? 1.05 : 0, o.z);
    if (id === 'key') it.rotation.set(raised ? Math.PI / 2 : 0, t * 1.5, 0);
    if (id === 'speaker') {
      const beat = o.on ? Math.max(0, Math.sin(t * 9)) * 0.05 : 0;
      it.scale.set(1 + beat, 1 - beat * 0.5, 1 + beat);
    }
  }
  items.speaker.userData.led.material = mat(day.objects.speaker.on ? '#e5ff86' : '#3b4a3f', 0.4);
  for (const id of OBJECTS) {
    const o = day.objects[id], ring = items[id + 'Ring'];
    ring.visible = isFree(o) && !day.player.carrying && dist(sim.player, o) < 14;
    ring.position.set(o.x, 0.04, o.z);
    ring.scale.setScalar(1 + Math.sin(t * 4) * 0.12);
  }
}

// The shuttle stops and honks rather than driving into a player standing in its lane.
let honked = false, blockedFor = 0;
function busWaits() {
  const b = day.bus, p = sim.player;
  const moving = b.phase === 'toJantar' || b.phase === 'toCP';
  const dir = b.phase === 'toJantar' ? Math.sign(SPOTS.busJantar.z - b.z) : Math.sign(SPOTS.busCP.z - b.z);
  const ahead = (p.z - b.z) * dir;
  b.blocked = moving && Math.abs(p.x - b.x) < 2 && ahead > 4 && ahead < 8;
  if (b.blocked && !honked) toast('Poooon! Iqbal honks and waits for you to get out of the way.', 3);
  blockedFor = b.blocked ? blockedFor + STEP : 0;
  if (blockedFor >= 10) { blockedFor = 0; toast('Iqbal leans out: "Bhai, side ho jao! Poora schedule tumhare peeche ruka hai."', 4); }
  honked = b.blocked;
}
function updateShuttle() {
  const b = day.bus;
  shuttle.position.set(b.x, 0, b.z);
  shuttleObstacle.x = b.x;
  shuttleObstacle.z = b.z;
  // Never let the moving bus swallow the player.
  const p = sim.player, hw = 1.4 + p.radius, hd = 5 + p.radius;
  if (Math.abs(p.x - b.x) < hw && Math.abs(p.z - b.z) < hd) p.x = b.x + Math.sign(p.x - b.x || -1) * (hw + 0.05);
}

// --- feedback --------------------------------------------------------------

function toast(text, time = 4, isLink = false) {
  const el = $('#toast');
  el.textContent = text;
  el.classList.toggle('linked', isLink);
  el.style.opacity = 1;
  $('#hud').classList.add('toasting');
  toastTime = time;
}
function say(id, text, duration = 5) {
  const b = bodies[id];
  if (!b || !b.model.visible) return;
  let bubble = bubbles.find((x) => x.id === id);
  if (!bubble) {
    const el = document.createElement('div');
    el.className = 'bubble';
    $('#bubbles').appendChild(el);
    bubble = { id, el };
    bubbles.push(bubble);
  }
  bubble.ttl = duration;
  bubble.el.innerHTML = `<b>${PEOPLE[id].name.toUpperCase()}</b>`;
  bubble.el.append(text);
}
function logLine(list, text, max) {
  const li = document.createElement('li');
  li.innerHTML = `<small>${clockText(day.t)}</small>`;
  li.append(text);
  const log = $(list);
  log.prepend(li);
  while (log.children.length > max) log.lastChild.remove();
}
let streamText = '', streamTime = 0;
function handleEvents() {
  for (const e of drainEvents(day)) {
    const near = e.pos ? dist(sim.player, e.pos) < 26 : false;
    const here = e.place && placeAt(sim.player) === e.place;
    const onPhone = e.who === 'wireless' || e.who === 'feed' || e.who === 'stream';
    const heard = onPhone || near || here || (bodies[e.who] && dist(sim.player, bodies[e.who]) < 26);
    if (e.who === 'wireless') logLine('#wirelessLog', e.text, 3);
    else if (e.who === 'feed') logLine('#feedLog', e.text, 3);
    else if (e.who === 'stream') { streamText = e.text.replace(/^Zoya Live: |^Zoya: /, ''); streamTime = 10; }
    else if (bodies[e.who]) say(e.who, e.text, 6);
    else if (e.who === 'street' && e.text && heard) toast(e.text, 5);
    if (e.link && heard) learnLink(e.link);
  }
}
const MAX_BUBBLES = () => (innerWidth < 600 ? 2 : 3);
// Keep speech bubbles off the HUD panels and off each other; only the nearest few speakers get one.
function updateBubbles(dt) {
  const v = new THREE.Vector3();
  const panels = ['#side', '#stream', '#levers', '#clock', '#choices', '#prompt']
    .map((q) => $(q)).filter((el) => el && el.offsetParent !== null).map((el) => el.getBoundingClientRect());
  const shown = [];
  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i], body = bodies[b.id];
    b.ttl -= dt;
    if (b.ttl <= 0) { b.el.remove(); bubbles.splice(i, 1); continue; }
    v.set(body.x, body.y + 2.15, body.z).project(world.camera);
    const off = dist(body, sim.player) > 30 || v.z > 1 || Math.abs(v.x) > 1.05 || v.y < -0.9 || !body.model.visible;
    const asked = choices && choices.id === b.id; // their words are already in the whisper menu
    if (off || asked) b.el.style.display = 'none';
    else shown.push({ b, d: dist(body, sim.player), x: ((v.x + 1) / 2) * innerWidth, y: ((1 - v.y) / 2) * innerHeight });
  }
  shown.sort((a, c) => a.d - c.d);
  const placed = [];
  for (const [n, s] of shown.entries()) {
    if (n >= MAX_BUBBLES()) { s.b.el.style.display = 'none'; continue; }
    s.b.el.style.display = 'block';
    const w = s.b.el.offsetWidth || 230, h = s.b.el.offsetHeight || 50;
    const fit = (x, y) => ({ x: clamp(x, w / 2 + 8, innerWidth - w / 2 - 8), y: clamp(y, h + 8, innerHeight - 8) });
    let { x, y } = fit(s.x, s.y);
    for (let tries = 0; tries < 6; tries++) {
      const hit = [...panels, ...placed].find((r) => x + w / 2 > r.left - 4 && x - w / 2 < r.right + 4 && y > r.top - 4 && y - h < r.bottom + 4);
      if (!hit) break;
      // Move the smallest distance that clears the panel: left, right, above or below it.
      const moves = [
        fit(hit.left - w / 2 - 6, y), fit(hit.right + w / 2 + 6, y), fit(x, hit.top - 6), fit(x, hit.bottom + h + 6),
      ].filter((m) => !(m.x + w / 2 > hit.left - 4 && m.x - w / 2 < hit.right + 4 && m.y > hit.top - 4 && m.y - h < hit.bottom + 4));
      if (!moves.length) break;
      ({ x, y } = moves.sort((a, c) => Math.hypot(a.x - x, a.y - y) - Math.hypot(c.x - x, c.y - y))[0]);
    }
    s.b.el.style.left = x + 'px';
    s.b.el.style.top = y + 'px';
    placed.push({ left: x - w / 2, right: x + w / 2, top: y - h, bottom: y });
  }
}
function ambient(dt) {
  ambientClock -= dt;
  if (ambientClock > 0) return;
  ambientClock = 14;
  const m = moods(day);
  const near = Object.keys(bodies).filter((id) => bodies[id].model.visible && dist(bodies[id], sim.player) < 14 && !bubbles.some((b) => b.id === id));
  const lines = AMBIENT.filter((a) => near.includes(a.who) && (m.has(a.when) || a.when === 'default'));
  // Lines that match the mood come before the generic ones.
  lines.sort((a, b) => (b.when !== 'default') - (a.when !== 'default'));
  const pick = lines[ambientTurn++ % Math.max(1, Math.min(lines.length, 3))];
  if (pick) say(pick.who, pick.line, 5);
}

// --- player actions ---------------------------------------------------------

function witnesses() {
  const out = [];
  const ranges = { sharma: 14, iqbal: 9, ravi: 9, zoya: 8, dev: 8 };
  for (const [id, r] of Object.entries(ranges)) {
    const b = bodies[id];
    if (!day.people[id].hidden && dist(b, sim.player) < r && visible(b, sim.player, world.obstacles)) out.push(id);
  }
  return out;
}
const PICKUP = {
  speaker: 'Pick up Ravi\'s speaker', key: 'Pocket the bus key', megaphone: 'Take Dev\'s megaphone',
  phone: 'Take Zoya\'s charging phone', water: 'Lift Sana\'s water crate',
};
const OWNER = { speaker: 'ravi', key: 'iqbal', megaphone: 'dev', phone: 'zoya', water: 'sana' };
const GIVES = { key: ['iqbal'], speaker: ['ravi'], megaphone: ['dev', 'mira', 'kabir'], phone: ['zoya'], water: ['sana'] };
function findPrompt() {
  const p = sim.player, carrying = day.player.carrying;
  const options = [];
  if (!carrying) {
    for (const id of OBJECTS) {
      const o = day.objects[id];
      if (!isFree(o) || dist(p, o) >= 2) continue;
      const watching = witnesses().filter((w) => w === OWNER[id] || (id === 'key' && w === 'sharma'));
      const warn = watching.length ? ` (${watching.map((w) => PEOPLE[w].name).join(' and ')} can see you)` : '';
      options.push({ d: dist(p, o) - 1.5, text: PICKUP[id] + warn, warn: !!warn, run: () => take(id) });
    }
  }
  for (const id of Object.keys(bodies)) {
    const b = bodies[id], s = day.people[id];
    if (s.hidden || dist(p, b) > (id === 'mira' ? 5 : 3)) continue; // Mira stands on the raised stage
    if (carrying && GIVES[carrying].includes(id) && !s.carrying) options.push({ d: dist(p, b) - 1, text: `Give ${PEOPLE[id].name} the ${carrying === 'water' ? 'water crate' : carrying}`, run: () => give(id) });
    else options.push({ d: dist(p, b), text: `Talk to ${PEOPLE[id].name}`, run: () => talk(id) });
  }
  options.sort((a, b) => a.d - b.d);
  return options[0] || null;
}
function take(object) {
  act(day, { type: 'take', object, witnesses: witnesses() });
}
function drop() {
  const p = sim.player;
  act(day, { type: 'drop', x: p.x + Math.sin(p.yaw) * 0.9, z: p.z + Math.cos(p.yaw) * 0.9 });
}
function give(to) {
  act(day, { type: 'give', to });
}
function talk(id) {
  act(day, { type: 'talk', to: id });
  const state = talkState(day, id);
  const byState = (w) => TALK[id].filter((t) => t.when === w);
  const pool = byState(state).length ? byState(state) : byState('default').length ? byState('default') : [TALK[id][0]];
  // Each thing they have to say once, then they get short with you.
  const key = id + ':' + pool[0].when, n = talked[key] = (talked[key] || 0) + 1;
  const entry = pool[n - 1];
  const line = entry ? entry.line : AGAIN[id][(n - pool.length - 1) % AGAIN[id].length];
  say(id, line, 7);
  if (entry?.hint && HINTS[entry.hint]) {
    const fresh = learnHint(entry.hint);
    toast(`${fresh ? 'On the board: ' : ''}${PEOPLE[id].name}: ${HINTS[entry.hint].text}`, 5);
  }
  if (id !== 'sharma') openChoices(id, line);
}
// Whispering: after talking to anyone but Sharma you can pass on a rumour you know.
function openChoices(id, line) {
  const list = knownRumours();
  if (!list.length) return;
  choices = { id, list };
  $('#choicesSaid').innerHTML = `<b>${PEOPLE[id].name.toUpperCase()}</b>`;
  $('#choicesSaid').append(line);
  $('#choicesTitle').textContent = `Whisper something to ${PEOPLE[id].name}?`;
  $('#choicesList').innerHTML = list.map((rid, i) => `<li><button data-r="${rid}"><kbd>${i + 1}</kbd> ${RUMOURS[rid].label}</button></li>`).join('')
    + '<li><button data-r=""><kbd>Esc</kbd> Say nothing</button></li>';
  for (const b of $('#choicesList').querySelectorAll('button')) b.onclick = () => choose(b.dataset.r);
  $('#choices').classList.remove('hidden');
  $('#hud').classList.add('choosing');
}
function choose(rid) {
  if (choices && rid) {
    const r = act(day, { type: 'whisper', to: choices.id, rumour: rid });
    if (r.say === 'already-dead') toast('Nobody believes that one any more.', 3);
  }
  closeChoices();
}
function closeChoices() {
  choices = null;
  $('#choices').classList.add('hidden');
  $('#hud').classList.remove('choosing');
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
  for (const b of crowd) { b.group = null; b.model.visible = false; }
  for (const b of squad) b.model.visible = false;
  crowdClock = 0;
  crowdSnap = true;
  ambientClock = 12;
  talked = {};
  blockedFor = 0;
  streamText = ''; streamTime = 0;
  closeChoices();
  $('#wirelessLog').replaceChildren();
  $('#feedLog').replaceChildren();
  for (const b of bubbles.splice(0)) b.el.remove();
  $('#loopCount').textContent = `LOOP ${memory.loops}`;
}

function showTitle() {
  mode = 'title';
  const seen = memory.links.length;
  $('#screen').innerHTML = `<div class="screen-content"><span class="tiny">SIDE QUEST REPUBLIC</span>
    <h1>Same day.<em>Again.</em></h1>
    <p>It's 10:00 at the Rajiv Chowk exit. By 17:00 something will have happened at Jantar Mantar. What happens depends on who is where, what is in whose pocket, and what everyone has heard.</p>
    <p>Watch people's routines, move things around, start a rumour, and see what follows. When the day ends, it starts again. You keep everything you learned.</p>
    <div class="buttons"><button class="primary" id="go">${memory.loops > 1 ? `Start loop ${memory.loops}` : 'Start the day'}</button>${seen ? `<button id="wipe">Forget everything</button>` : ''}</div>
    <p class="fine">${seen ? `You know ${seen} of ${Object.keys(LINKS).length} links and ${memory.endings.length} of ${Object.keys(ENDINGS).length} endings. ` : ''}WASD to move, Space to jump, drag to look, E to act, Tab for the chaos board, hold T to let time pass. On a phone, use the on-screen buttons.</p></div>`;
  $('#screen').classList.remove('hidden');
  $('#hud').classList.add('hidden');
  $('#go').onclick = () => startLoop();
  $('#wipe')?.addEventListener('click', () => { memory = { loops: 1, links: [], hints: [], endings: [] }; saveMemory(); showTitle(); });
}

function startLoop() {
  resetDay();
  mode = 'play';
  $('#screen').classList.add('hidden');
  $('#hud').classList.remove('hidden');
  logLine('#feedLog', 'Pinky: ⚠️ Forwarded many times: "water cannon aa raha hai Jantar pe??" Kisi ko pata hai? (Talk to someone to pass it on.)', 3);
  toast(memory.loops === 1 ? 'Ravi\'s speaker and Asha\'s chai stall are at CP, south of here. The stage is in between. Talk to people.' : 'Back at the Metro exit. 10:00. Again.', 6);
}

function showEnding() {
  mode = 'end';
  closeChoices();
  const e = ENDINGS[day.ending];
  if (!memory.endings.includes(day.ending)) memory.endings.push(day.ending);
  memory.loops++;
  saveMemory();
  const lv = levers(day);
  const learned = [...loopLinks].map((id) => `<li>${LINKS[id].from} → ${LINKS[id].to}</li>`).join('');
  const where = { stage: 'the stage', cp: 'CP', barricade: 'the barricade', parliament: 'Parliament Street' };
  const size = (n) => (n <= 0 ? 'nobody' : n < 6 ? 'a handful' : n < 15 ? 'a small crowd' : n < 30 ? 'a big crowd' : 'packed');
  $('#screen').innerHTML = `<div class="screen-content"><span class="tiny">${clockText(day.t)} · LOOP ${memory.loops - 1} ENDS</span>
    <h2>${e.title}</h2><p class="headline">${e.headline}</p><p>${e.text}</p>
    <p class="fine">Jantar Mantar: ${size(lv.crowds.stage)} · CP: ${size(lv.crowds.cp)} · barricade: ${size(lv.crowds.barricade)} · Parliament Street: ${size(lv.crowds.parliament)} · police line at ${lv.line ? where[lv.line] : 'nowhere'}</p>
    ${learned ? `<p>What you saw happen this loop:</p><ul>${learned}</ul>` : '<p>You didn\'t see any link happen this loop.</p>'}
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
  const rumours = Object.entries(RUMOURS).map(([id, r]) => knownRumours().includes(id)
    ? `<div class="ending">${r.label}</div>`
    : `<div class="ending unseen">??? (${PEOPLE[HINTS[r.unlock].who].name} knows one)</div>`).join('');
  $('#boardPeople').innerHTML = people;
  $('#boardLinks').innerHTML = `<p class="fine">${memory.links.length} of ${Object.keys(LINKS).length} found.</p>` + links;
  $('#boardEndings').innerHTML = endings;
  $('#boardRumours').innerHTML = rumours;
  $('#board').classList.remove('hidden');
}
function closeBoard() {
  $('#board').classList.add('hidden');
  mode = boardPrior;
}

// --- frame -------------------------------------------------------------------

function step(dt) {
  const fast = keys.t ? 8 : 1;
  accumulator += dt * fast;
  while (accumulator >= STEP) {
    accumulator -= STEP;
    day.player.x = sim.player.x;
    day.player.z = sim.player.z;
    busWaits();
    tick(day, STEP);
    handleEvents();
    if (day.over) { setTimeout(showEnding, day.ending === 'detained' ? 2500 : 600); mode = 'ending'; closeChoices(); return; }
  }
  const forward = (keys.w || keys.arrowup ? 1 : 0) - (keys.s || keys.arrowdown ? 1 : 0);
  const right = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0);
  const ix = Math.cos(yaw) * right - Math.sin(yaw) * forward;
  const iz = -Math.sin(yaw) * right - Math.cos(yaw) * forward;
  sim.step(dt, { x: ix, z: iz, sprint: keys.shift, jump: keys[' '], heavy: HEAVY.includes(day.player.carrying) });
  keys[' '] = false;
  updateShuttle();
  updateBodies(dt);
  updateCrowd(dt);
  updateSquad(dt);
  separateBodies([sim.player, ...Object.values(bodies).filter((b) => b.model.visible && b.id !== 'mira'), ...crowd.filter((b) => b.model.visible), ...squad.filter((b) => b.model.visible)], world.obstacles);
  for (const b of [...Object.values(bodies), ...crowd, ...squad]) b.model.position.set(b.x, b.y || 0, b.z);
  playerModel.position.set(sim.player.x, sim.player.y, sim.player.z);
  const turn = Math.atan2(Math.sin(sim.player.yaw - playerModel.rotation.y), Math.cos(sim.player.yaw - playerModel.rotation.y));
  playerModel.rotation.y += turn * Math.min(1, dt * 14);
  ambient(dt);
  if (choices && (day.people[choices.id].hidden || dist(sim.player, bodies[choices.id]) > 4)) closeChoices();
}

function animate(t) {
  const p = sim.player;
  const carryPose = (c) => (c ? POSE[c] : false);
  animateCharacter(playerModel, Math.hypot(p.vx, p.vz), t, { carry: carryPose(day.player.carrying), airborne: !p.grounded, vy: p.vy, important: true });
  for (const [id, b] of Object.entries(bodies)) {
    if (!b.model.visible) continue;
    const s = day.people[id];
    const carrying = s.carrying === 'phone' ? false : s.carrying;
    animateCharacter(b.model, b.speed, t, {
      carry: carryPose(carrying),
      talking: bubbles.some((x) => x.id === id) || (id === 'mira' && s.mode === 'speech'),
      distance: dist(b, p),
      important: true,
    });
    if (b.model.userData.phone) b.model.userData.phone.visible = id === 'zoya' && s.carrying === 'phone';
  }
  const surge = clashSurge();
  crowd.forEach((b, i) => {
    if (!b.model.visible) return;
    const still = b.speed < 0.3 || (b.target && dist(b, b.target) < 1.2);
    // Each set piece gets something you can see from across the square.
    const dancing = still && b.group === 'cpParty' && day.objects.speaker.on; // jump to the beat
    const sitting = still && b.group === 'stage' && day.moment === 'singalong'; // everyone sits and sways
    const shoving = surge && b.group === surge.group; // heave at the line
    const cheering = b.group === 'stage' && ((day.people.mira.mode === 'speech' && day.speech === 'big') || day.moment === 'roast');
    const angry = b.group === 'barricade' && day.minister === 'noshow' && !shoving;
    if (dancing) {
      b.model.position.y = Math.abs(Math.sin(t * 5.2 + b.phase)) * 0.4;
      b.model.rotation.y = b.yaw + Math.sin(t * 2.6 + b.phase) * 0.7;
    } else if (sitting) {
      b.model.position.y = -0.34;
      b.model.rotation.y = b.yaw + Math.sin(t * 1.4 + b.phase) * 0.12;
    }
    animateCharacter(b.model, dancing || sitting ? 0 : b.speed, t, {
      pose: dancing || ((cheering || angry) && Math.sin(t * 3 + b.phase) > 0.2),
      seated: sitting,
      gesture: shoving ? 'push' : (sitting && i % 3 === 0) || (dancing && Math.sin(t * 2.6 + b.phase) > 0) ? 'wave' : '',
      distance: dist(b, p),
    });
  });
  for (const b of squad) if (b.model.visible) animateCharacter(b.model, b.speed, t, { gesture: surge && day.police.line === day.clash.place ? 'push' : '', distance: dist(b, p) });
}

function camera(dt) {
  if (mode === 'title' || mode === 'loading') {
    const a = performance.now() * 0.00004;
    world.camera.position.set(Math.sin(a) * 18, 9, -8 + Math.cos(a) * 18);
    world.camera.lookAt(4, 1, -14);
    return;
  }
  const p = sim.player;
  const target = new THREE.Vector3(p.x, 1.55 + p.y * 0.7, p.z);
  const desired = target.clone().add(new THREE.Vector3(Math.sin(yaw) * zoom, zoom * pitch, Math.cos(yaw) * zoom));
  for (const o of world.obstacles) {
    if (o.h < 2) continue;
    if (o.h < 3.5) { // low props (carts, buses): lift the camera over them rather than pulling it into the player
      if (Math.abs(desired.x - o.x) < o.w / 2 + 1 && Math.abs(desired.z - o.z) < o.d / 2 + 1) desired.y = Math.max(desired.y, o.h + 1.2);
      continue;
    }
    for (let f = 0.15; f < 1; f += 0.05) {
      const x = target.x + (desired.x - target.x) * f, z = target.z + (desired.z - target.z) * f, y = target.y + (desired.y - target.y) * f;
      if (y > (o.base || 0) - 0.2 && y < o.h + 0.3 && Math.abs(x - o.x) < o.w / 2 + 0.2 && Math.abs(z - o.z) < o.d / 2 + 0.2) {
        desired.lerpVectors(target, desired, Math.max(0.2, f - 0.1));
        break;
      }
    }
  }
  // Single-sided signs only register from their front, so cast both ways and keep the hit nearest the player.
  const toCam = desired.clone().sub(target), len = toCam.length();
  toCam.normalize();
  ray.far = len;
  ray.set(target, toCam);
  let clear = ray.intersectObjects(occluders, false)[0]?.distance ?? len;
  ray.set(desired, toCam.clone().negate());
  const back = ray.intersectObjects(occluders, false).at(-1);
  if (back) clear = Math.min(clear, len - back.distance);
  if (clear < len) {
    desired.copy(target).addScaledVector(toCam, Math.max(1.2, clear - 0.4));
    world.camera.position.copy(desired); // snap in front of the occluder rather than sliding through it
  } else world.camera.position.lerp(desired, 1 - Math.exp(-dt * 9));
  world.camera.lookAt(target);
  if (day?.clash && mode === 'play' && dist(p, LINE_LAYOUT[day.clash.place] || p) < 22) { // the scuffle shakes the picture
    const k = 0.05, n = performance.now() / 1000;
    world.camera.rotation.z += Math.sin(n * 31) * k * 0.4;
    world.camera.position.y += Math.sin(n * 23) * k;
  }
  // A banner right over your head would fill the top of the screen, so it goes see-through.
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
const MOOD = { calm: 'Calm', rising: 'Rising', high: 'Boiling over' };
const WHERE = { stage: 'Stage', cp: 'CP', barricade: 'Barricade', parliament: 'Parliament St' };
function updateHUD(dt) {
  $('#clockTime').textContent = clockText(day.t);
  const place = placeAt(sim.player);
  $('#place').textContent = place ? PLACES[place].name.toUpperCase() : '';
  prompt = mode === 'play' && !choices ? findPrompt() : null;
  $('#prompt').classList.toggle('hidden', !prompt);
  if (prompt) $('#promptText').textContent = prompt.text;
  const c = day.player.carrying;
  $('#carrying').classList.toggle('hidden', !c);
  if (c) $('#carrying').textContent = CARRY_TEXT[c];
  const lv = levers(day);
  $('#levers').innerHTML = `<span>Mood <b class="${lv.intensity}">${MOOD[lv.intensity]}</b></span><span>Crowd <b>${WHERE[lv.location]}</b></span>`
    + `<span>Police ${lv.line ? `line at <b>${WHERE[lv.line]}</b>` : lv.watch ? `watching <b>${WHERE[lv.watch]}</b>` : `<b>${WHERE[lv.policeAt]}</b>`}</span>`;
  const st = day.stream;
  streamTime -= dt;
  const showStream = st.live || streamTime > 0;
  $('#stream').classList.toggle('hidden', !showStream);
  if (showStream) {
    const v = Math.round(st.viewers);
    $('#streamHead').textContent = st.live ? `● ZOYA LIVE · ${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v} watching · ${WHERE[st.place]}` : '○ ZOYA · offline';
    $('#streamText').textContent = streamText;
  }
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
  }
  camera(dt);
  updateBubbles(dt);
  if (toastTime > 0 && (toastTime -= dt) <= 0) { $('#toast').style.opacity = 0; $('#hud').classList.remove('toasting'); }
  world.renderer.render(world.scene, world.camera);
}

function setupInput() {
  addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if ([' ', 'tab', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
    if (k === 'tab') { if (mode === 'board') closeBoard(); else if (mode === 'play' || mode === 'end') openBoard(); return; }
    if (k === 'escape' && mode === 'board') { closeBoard(); return; }
    if (k === 'escape' && choices) { closeChoices(); return; }
    if (e.repeat) return;
    if (choices && /^[1-9]$/.test(k)) { const rid = choices.list[Number(k) - 1]; if (rid) choose(rid); return; }
    keys[k] = true;
    if (mode !== 'play') return;
    if (k === 'e' && prompt) prompt.run();
    if (k === 'q' && day.player.carrying) drop();
  });
  addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
  addEventListener('blur', () => { keys = {}; });
  const c = world.renderer.domElement;
  c.addEventListener('pointerdown', (e) => { dragging = true; lastMouse = { x: e.clientX, y: e.clientY }; c.setPointerCapture(e.pointerId); });
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
  // Touch: on-screen buttons press the same keys; the action prompt can be tapped.
  for (const btn of document.querySelectorAll('#touch [data-key]')) {
    const k = btn.dataset.key;
    const up = () => { keys[k] = false; };
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (mode === 'board' && k === 'tab') { closeBoard(); return; }
      if (mode !== 'play') { if (k === 'tab' && mode === 'end') openBoard(); return; }
      keys[k] = true;
      if (k === 'e' && prompt) prompt.run();
      if (k === 'q' && day.player.carrying) drop();
      if (k === 'tab') { keys[k] = false; openBoard(); }
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
    const box = new THREE.Box3();
    world.scene.traverse((o) => {
      if (!o.isMesh || o.isSkinnedMesh || o.isInstancedMesh) return;
      box.setFromObject(o);
      // Big merged scenery is already handled by the obstacle boxes; this catches signs and banners cheaply.
      const tris = (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3;
      // Props lower than the follow camera (cart poles, kettles) only collapse the view, so they don't count.
      if (box.max.y > 3.5 && box.max.y - box.min.y > 0.3 && tris < 600) occluders.push(o);
      const size = box.getSize(new THREE.Vector3());
      if (box.min.y > 2.4 && tris < 5000 && Math.max(size.x, size.z) < 14) { o.userData.box = box.clone(); overhead.push(o); }
    });
    sim = new Simulation(world.obstacles);
    sim.police = []; // Sharma is a character with a routine now, not a patrol bot.
    playerModel = makeCharacter({ color: '#df754c', pants: '#31565a', backpack: true, gender: 'male' });
    world.scene.add(playerModel);
    day = createDay();
    makePeople();
    resetDay();
    setupInput();
    await warmupRenderer({ renderer: world.renderer, scene: world.scene, camera: world.camera, onProgress: (text) => ($('#loadtext').textContent = text) });
    $('#loading').classList.add('hidden');
    showTitle();
    requestAnimationFrame(frame);
    // For debugging and automated browser checks.
    window.__loop = { get day() { return day; }, get sim() { return sim; }, get mode() { return mode; }, get world() { return world; }, startLoop, openBoard, act, at, advance, SPOTS, bodies, crowd, snap: () => { crowdSnap = true; crowdClock = 0; } };
  } catch (e) {
    console.error(e);
    $('#loadtext').textContent = 'The 3D scene could not start. WebGL 2 is required. ' + e.message;
  }
})();
