// Client for the looping day: draws the rules' world state in the existing 3D city.
// The rules (rules.js) decide what happens; this file only shows it and turns keys into actions.
import { THREE, buildWorld, cube, ball, cylinder, sign, mat } from '../world.js?v=27';
import { expandWorld } from '../world-expansion.js?v=27';
import { enhanceEnvironment } from '../environment-detail.js?v=27';
import { loadCharacters, makeCharacter, animateCharacter, CARRY_POSES } from '../characters.js?v=27';
import { Simulation, clamp, dist, steer, visible, separateBodies } from '../simulation.js?v=27';
import { warmupRenderer } from '../render-warmup.js?v=27';
import {
  createDay, tick, act, talkState, drainEvents, finish, levers,
  clockText, placeAt, SPOTS, PLACES, at, advance,
} from './rules.js';
import { PEOPLE, TALK, HINTS, LINKS, ENDINGS } from './content.js';

const $ = (s) => document.querySelector(s);
const STEP = 0.1;
const CROWD_POOL = 40;
const SAVE_KEY = 'sqr-loop-v1';

let world, sim, day, mode = 'loading';
let playerModel, keys = {}, yaw = 0, pitch = 0.38, zoom = 9, dragging = false, lastMouse = null;
let accumulator = 0, last = 0, toastTime = 0, prompt = null;
const bodies = {}; // person id -> { model, x, z, y, speed, yaw }
const crowd = []; // pooled crowd bodies
const bubbles = [];
const items = {};
let shuttle, shuttleObstacle;
const occluders = []; // static scenery the follow camera must not sit behind (signs, banners, walls)
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
  loopLinks.add(id);
  if (memory.links.includes(id)) return;
  memory.links.push(id);
  saveMemory();
  const l = LINKS[id];
  toast(`New on the chaos board: ${l.from} → ${l.to}`, 5, true);
}
function learnHint(id) {
  if (!id || memory.hints.includes(id)) return;
  memory.hints.push(id);
  saveMemory();
}

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
function placeProps() {
  // A chai stall at the CP shuttle stop, where Ravi and Iqbal take their breaks.
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
  // The legacy stationary bus becomes the shuttle.
  shuttle = world.bus;
  const i = world.obstacles.findIndex((o) => o.id === 'legacy-bus');
  if (i >= 0) world.obstacles.splice(i, 1);
  shuttleObstacle = { id: 'shuttle', x: SPOTS.busCP.x, z: SPOTS.busCP.z, w: 2.8, d: 10, h: 3.4 };
  world.obstacles.push(shuttleObstacle);
  shuttle.rotation.y = 0;

  items.speaker = speakerModel();
  items.key = keyModel();
  world.scene.add(items.speaker, items.key);
  // A soft ring under anything you could pick up, so it reads from a distance.
  for (const id of ['speaker', 'key']) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.68, 32), new THREE.MeshBasicMaterial({ color: '#e5ff86', transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2;
    world.scene.add(ring);
    items[id + 'Ring'] = ring;
  }
}

// --- people ---------------------------------------------------------------

function makePeople() {
  for (const [id, p] of Object.entries(PEOPLE)) {
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
}

// Where each crowd group stands, and where its people come from.
const GROUPS = {
  cpWaiting: { center: { x: 4.5, z: -31 }, r: 3.8, spawn: { x: -4, z: -47 } },
  cpParty: { center: null, r: 3.2, spawn: { x: -8, z: -46 } },
  stage: { center: { x: 0, z: -5.5 }, r: 5.5, spawn: { x: 10, z: 4 } },
  parliament: { center: { x: 62, z: -4 }, r: 6, spawn: { x: 40, z: -4.5 } },
};
function crowdTargets() {
  const c = day.crowd, sp = day.objects.speaker;
  GROUPS.cpParty.center = { x: sp.x, z: sp.z + 2.4 };
  const counts = { cpWaiting: c.cpWaiting, cpParty: c.cpParty, stage: c.stage, parliament: c.parliament };
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
  for (const b of crowd) {
    if (!b.model.visible) continue;
    const ox = b.x, oz = b.z;
    b.speed = b.target && dist(b, b.target) > 0.4 ? steer(b, b.target, b.group ? 3.4 : 3.8, dt, world.obstacles) : 0;
    if (b.speed > 0.1) b.yaw = Math.atan2(b.x - ox, b.z - oz);
    else if (b.group === 'stage') b.yaw = Math.atan2(0 - b.x, -14 - b.z);
    else if (b.group === 'cpParty') b.yaw = Math.atan2(day.objects.speaker.x - b.x, day.objects.speaker.z - b.z);
    if (!b.group && b.target && dist(b, b.target) < 1) b.model.visible = false;
    b.model.position.set(b.x, 0, b.z);
    b.model.rotation.y = b.yaw;
  }
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
      else if (id === 'ravi' && s.mode === 'stage') b.yaw = Math.atan2(-b.x, -14 - b.z);
    }
    b.model.position.set(b.x, b.y, b.z);
    b.model.rotation.y = b.yaw;
  }
}

function attach(item, holderModel, pose) {
  if (item.parent !== holderModel) holderModel.add(item);
  item.position.fromArray(CARRY_POSES[pose].position);
  item.rotation.set(0, 0, 0);
}
function updateItems(t) {
  const sp = day.objects.speaker, k = day.objects.key;
  if (sp.holder === 'player') attach(items.speaker, playerModel, 'speaker');
  else if (sp.holder === 'ravi') attach(items.speaker, bodies.ravi.model, 'speaker');
  else {
    if (items.speaker.parent !== world.scene) world.scene.add(items.speaker);
    items.speaker.position.set(sp.x, 0, sp.z);
    const beat = sp.on ? Math.max(0, Math.sin(t * 9)) * 0.05 : 0;
    items.speaker.scale.set(1 + beat, 1 - beat * 0.5, 1 + beat);
  }
  items.speaker.userData.led.material = mat(sp.on ? '#e5ff86' : '#3b4a3f', 0.4);
  items.key.visible = k.holder !== 'iqbal';
  if (k.holder === 'player') attach(items.key, playerModel, 'key');
  else {
    if (items.key.parent !== world.scene) world.scene.add(items.key);
    const onHook = k.holder === 'hook';
    items.key.position.set(k.x, onHook ? 1.05 : 0, k.z);
    items.key.rotation.set(onHook ? Math.PI / 2 : 0, t * 1.5, 0);
  }
  for (const id of ['speaker', 'key']) {
    const o = day.objects[id], ring = items[id + 'Ring'];
    const free = o.holder === null || o.holder === 'hook';
    ring.visible = free && !day.player.carrying && dist(sim.player, o) < 14;
    ring.position.set(o.x, 0.04, o.z);
    ring.scale.setScalar(1 + Math.sin(t * 4) * 0.12);
  }
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
  el.classList.toggle('link', isLink);
  el.style.opacity = 1;
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
function radio(text) {
  const li = document.createElement('li');
  li.innerHTML = `<small>${clockText(day.t)}</small>`;
  li.append(text);
  const log = $('#wirelessLog');
  log.prepend(li);
  while (log.children.length > 4) log.lastChild.remove();
}
function handleEvents() {
  for (const e of drainEvents(day)) {
    const near = e.pos ? dist(sim.player, e.pos) < 26 : false;
    const here = e.place && placeAt(sim.player) === e.place;
    const heard = e.who === 'wireless' || near || here || (bodies[e.who] && dist(sim.player, bodies[e.who]) < 26);
    if (e.who === 'wireless') radio(e.text);
    else if (bodies[e.who]) say(e.who, e.text, 6);
    else if (e.who === 'street' && e.text && heard) toast(e.text, 5);
    if (e.link && heard) learnLink(e.link);
  }
}
function updateBubbles(dt) {
  const v = new THREE.Vector3();
  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i], body = bodies[b.id];
    b.ttl -= dt;
    v.set(body.x, body.y + 2.15, body.z).project(world.camera);
    const far = dist(body, sim.player) > 30 || v.z > 1 || Math.abs(v.x) > 1.05 || v.y < -0.9 || !body.model.visible;
    b.el.style.display = far ? 'none' : 'block';
    b.el.style.left = clamp(((v.x + 1) / 2) * innerWidth, 130, innerWidth - 130) + 'px';
    b.el.style.top = clamp(((1 - v.y) / 2) * innerHeight, 90, innerHeight - 40) + 'px';
    if (b.ttl <= 0) { b.el.remove(); bubbles.splice(i, 1); }
  }
}

// --- player actions ---------------------------------------------------------

function witnesses() {
  const out = [];
  const ranges = { sharma: 14, iqbal: 9, ravi: 9 };
  for (const [id, r] of Object.entries(ranges)) {
    const b = bodies[id];
    if (!day.people[id].hidden && dist(b, sim.player) < r && visible(b, sim.player, world.obstacles)) out.push(id);
  }
  return out;
}
function findPrompt() {
  const p = sim.player, carrying = day.player.carrying;
  const options = [];
  const sp = day.objects.speaker, k = day.objects.key;
  if (!carrying) {
    if (sp.holder === null && dist(p, sp) < 2) options.push({ d: dist(p, sp), text: 'Pick up Ravi\'s speaker', run: () => take('speaker') });
    if ((k.holder === 'hook' || k.holder === null) && dist(p, k) < 2) options.push({ d: dist(p, k) - 0.5, text: 'Pocket the bus key', run: () => take('key') });
  }
  for (const id of Object.keys(PEOPLE)) {
    const b = bodies[id], s = day.people[id];
    if (s.hidden || dist(p, b) > 3) continue;
    if (carrying === 'key' && id === 'iqbal') options.push({ d: dist(p, b) - 1, text: 'Give Iqbal his key', run: () => give('iqbal') });
    else if (carrying === 'speaker' && id === 'ravi') options.push({ d: dist(p, b) - 1, text: 'Give Ravi his speaker', run: () => give('ravi') });
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
  const state = talkState(day, id);
  const entry = TALK[id].find((t) => t.when === state) || TALK[id].find((t) => t.when === 'default') || TALK[id][0];
  say(id, entry.line, 7);
  learnHint(entry.hint);
  if (entry.hint && HINTS[entry.hint]) toast(`${PEOPLE[id].name}: ${HINTS[entry.hint].text}`, 5);
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
  crowdClock = 0;
  crowdSnap = true;
  $('#wirelessLog').replaceChildren();
  for (const b of bubbles.splice(0)) b.el.remove();
  $('#loopCount').textContent = `LOOP ${memory.loops}`;
}

function showTitle() {
  mode = 'title';
  const seen = memory.links.length;
  $('#screen').innerHTML = `<div class="screen-content"><span class="tiny">SIDE QUEST REPUBLIC</span>
    <h1>Same day.<em>Again.</em></h1>
    <p>It's 10:00 at the Rajiv Chowk exit. By 17:00 something will have happened at Jantar Mantar. What happens depends on who is where, and what is in whose pocket.</p>
    <p>Watch people's routines, move things around, and see what follows. When the day ends, it starts again. You keep everything you learned.</p>
    <div class="buttons"><button class="primary" id="go">${memory.loops > 1 ? `Start loop ${memory.loops}` : 'Start the day'}</button>${seen ? `<button id="wipe">Forget everything</button>` : ''}</div>
    <p class="fine">${seen ? `You know ${seen} of ${Object.keys(LINKS).length} links. ` : ''}WASD to move, drag to look, E to act, Tab for the chaos board, hold T to let time pass.</p></div>`;
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
  toast(memory.loops === 1 ? 'Ravi\'s chai stall and the shuttle are at CP, south of here. The stage is in between.' : 'Back at the Metro exit. 10:00. Again.', 6);
}

function showEnding() {
  mode = 'end';
  const e = ENDINGS[day.ending];
  if (!memory.endings.includes(day.ending)) memory.endings.push(day.ending);
  memory.loops++;
  saveMemory();
  const lv = levers(day);
  const learned = [...loopLinks].map((id) => `<li>${LINKS[id].from} → ${LINKS[id].to}</li>`).join('');
  $('#screen').innerHTML = `<div class="screen-content"><span class="tiny">${clockText(day.t)} · LOOP ${memory.loops - 1} ENDS</span>
    <h2>${e.title}</h2><p class="headline">${e.headline}</p><p>${e.text}</p>
    <p class="fine">Crowd at Jantar ${lv.crowds.stage} · at CP ${lv.crowds.cp} · on Parliament Street ${lv.crowds.parliament} · Sharma at ${lv.policeAt === 'cp' ? 'CP' : 'the barricade'}</p>
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
  const people = Object.entries(PEOPLE).map(([id, p]) => {
    const known = Object.entries(HINTS).filter(([h, v]) => v.who === id && memory.hints.includes(h)).map(([, v]) => `<li>${v.text}</li>`).join('');
    return `<div class="person"><b>${p.name}</b><small>${p.role}</small><ul>${known || '<li class="unknown">Talk to them to learn their day.</li>'}</ul></div>`;
  }).join('');
  const links = Object.entries(LINKS).map(([id, l]) => memory.links.includes(id)
    ? `<div class="link${loopLinks.has(id) ? ' new' : ''}"><span>${l.from}</span><i>→</i><span>${l.to}</span></div>`
    : `<div class="link unknown"><span>?</span><span>${l.hint}</span></div>`).join('');
  const endings = Object.entries(ENDINGS).map(([id, e]) => `<div class="ending${memory.endings.includes(id) ? '' : ' unseen'}">${memory.endings.includes(id) ? e.title : '???'}</div>`).join('');
  $('#boardPeople').innerHTML = people;
  $('#boardLinks').innerHTML = links;
  $('#boardEndings').innerHTML = endings;
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
    tick(day, STEP);
    handleEvents();
    if (day.over) { setTimeout(showEnding, day.ending === 'detained' ? 2500 : 600); mode = 'ending'; return; }
  }
  const forward = (keys.w || keys.arrowup ? 1 : 0) - (keys.s || keys.arrowdown ? 1 : 0);
  const right = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0);
  const ix = Math.cos(yaw) * right - Math.sin(yaw) * forward;
  const iz = -Math.sin(yaw) * right - Math.cos(yaw) * forward;
  sim.step(dt, { x: ix, z: iz, sprint: keys.shift, jump: keys[' '], heavy: day.player.carrying === 'speaker' });
  keys[' '] = false;
  updateShuttle();
  updateBodies(dt);
  updateCrowd(dt);
  separateBodies([sim.player, ...Object.values(bodies).filter((b) => b.model.visible && b.id !== 'mira'), ...crowd.filter((b) => b.model.visible)], world.obstacles);
  for (const b of [...Object.values(bodies), ...crowd]) b.model.position.set(b.x, b.y || 0, b.z);
  playerModel.position.set(sim.player.x, sim.player.y, sim.player.z);
  const turn = Math.atan2(Math.sin(sim.player.yaw - playerModel.rotation.y), Math.cos(sim.player.yaw - playerModel.rotation.y));
  playerModel.rotation.y += turn * Math.min(1, dt * 14);
}

function animate(t) {
  const p = sim.player;
  animateCharacter(playerModel, Math.hypot(p.vx, p.vz), t, { carry: day.player.carrying || false, airborne: !p.grounded, vy: p.vy, important: true });
  for (const [id, b] of Object.entries(bodies)) {
    if (!b.model.visible) continue;
    const s = day.people[id];
    animateCharacter(b.model, b.speed, t, {
      carry: s.carrying || false,
      talking: bubbles.some((x) => x.id === id) || (id === 'mira' && s.mode === 'speech'),
      distance: dist(b, p),
      important: true,
    });
  }
  for (const b of crowd) if (b.model.visible) {
    const dancing = b.group === 'cpParty' && day.objects.speaker.on;
    const cheering = b.group === 'stage' && day.people.mira.mode === 'speech' && day.speech === 'big';
    animateCharacter(b.model, b.speed, t, { pose: (dancing || cheering) && Math.sin(t * 3 + b.phase) > 0.2, distance: dist(b, p) });
  }
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
}

function updateHUD() {
  $('#clockTime').textContent = clockText(day.t);
  const place = placeAt(sim.player);
  $('#place').textContent = place ? PLACES[place].name.toUpperCase() : '';
  prompt = mode === 'play' ? findPrompt() : null;
  $('#prompt').classList.toggle('hidden', !prompt);
  if (prompt) $('#promptText').textContent = prompt.text;
  const c = day.player.carrying;
  $('#carrying').classList.toggle('hidden', !c);
  if (c) $('#carrying').textContent = c === 'key' ? 'Iqbal\'s bus key is in your pocket. Q puts it down.' : 'You\'re carrying Ravi\'s speaker. Q puts it down and switches it on.';
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
    updateHUD();
  }
  camera(dt);
  updateBubbles(dt);
  if (toastTime > 0 && (toastTime -= dt) <= 0) $('#toast').style.opacity = 0;
  world.renderer.render(world.scene, world.camera);
}

function setupInput() {
  addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if ([' ', 'tab', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
    if (k === 'tab') { if (mode === 'board') closeBoard(); else if (mode === 'play') openBoard(); return; }
    if (k === 'escape' && mode === 'board') { closeBoard(); return; }
    if (e.repeat) return;
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
      if (box.max.y > 1.8 && box.max.y - box.min.y > 0.3 && tris < 600) occluders.push(o);
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
    window.__loop = { get day() { return day; }, get sim() { return sim; }, get mode() { return mode; }, startLoop, openBoard, act, at, advance, SPOTS }; // for debugging and browser checks
  } catch (e) {
    console.error(e);
    $('#loadtext').textContent = 'The 3D scene could not start. WebGL 2 is required. ' + e.message;
  }
})();
