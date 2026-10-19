// The looping day: one world state, routines for each person, and rules that collide.
// Pure module (no DOM, no Three.js) so the whole day can be played by tests.
// Every value here is either drawn on screen or read by a rule; nothing is decorative.
import { LINES, RUMOURS } from './content.js';

export const SECONDS_PER_MINUTE = 1.25;
export const DAY_START = 10 * 60; // 10:00
export const DAY_END = 17 * 60; // 17:00
/** Real seconds into the loop at a clock time. */
export const at = (h, m = 0) => (h * 60 + m - DAY_START) * SECONDS_PER_MINUTE;
export const clockMinutes = (t) => DAY_START + t / SECONDS_PER_MINUTE;
export const clockText = (t) => {
  const m = Math.floor(clockMinutes(t));
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

export const SPOTS = {
  metro: { x: -7, z: 34 },
  chai: { x: -16, z: -33 },
  raviChai: { x: -19.5, z: -31.5 },
  speakerChai: { x: -18, z: -30.8 },
  asha: { x: -18, z: -34.2 },
  zoyaCharge: { x: -15.4, z: -34.3 },
  phoneCart: { x: -16.9, z: -35.6 },
  devChai: { x: -14.8, z: -32.2 },
  busCP: { x: 10, z: -34 },
  busJantar: { x: 10, z: 2 },
  busDoor: { x: 7.6, z: -31 },
  keyHook: { x: 8.55, z: -31 },
  waterCP: { x: 6.2, z: -37.2 },
  waterJantar: { x: 7.4, z: 4.6 },
  stageTop: { x: 0, z: -14.5 },
  stageSpeaker: { x: 3.2, z: -10.4 },
  megStage: { x: -3.2, z: -10.4 },
  raviStage: { x: 5.6, z: -9.6 },
  devStage: { x: 5.2, z: -3.2 },
  kabirStage: { x: -4.6, z: -2.4 },
  ashaStage: { x: -7.2, z: -1.4 },
  sanaTent: { x: -9.5, z: -9 },
  zoyaStart: { x: -3, z: 30 },
  meeraStart: { x: -11, z: 30.5 },
  kabirStart: { x: -6, z: 38 },
  nikhilStart: { x: -1.5, z: 36.5 },
  barricade: { x: 40, z: -4.5 },
  devBarricade: { x: 36.2, z: -4.5 },
  cpPost: { x: 0, z: -29 },
  parliament: { x: 62, z: -4 },
  // Waypoints so walkers go round the observatory instead of through it.
  midway: { x: 18, z: -14 },
  metroPath: { x: -4, z: 14 },
};

export const PLACES = {
  metro: { x: -7, z: 36, r: 14, name: 'Rajiv Chowk exit' },
  cp: { x: -4, z: -33, r: 15.5, name: 'CP shuttle stop' },
  stage: { x: 2, z: -5, r: 14, name: 'Jantar Mantar stage' },
  barricade: { x: 38, z: -4.5, r: 7, name: 'Barricade' },
  parliament: { x: 62, z: -4, r: 12, name: 'Parliament Street' },
};
// Where Zoya and Meera stand to film each crowd.
const FILM_SPOTS = {
  stage: { x: -7.5, z: -5.5 }, cp: { x: -1.5, z: -33.5 }, barricade: { x: 34, z: -8 }, parliament: { x: 57, z: -9 },
};
// Where the front of a police line stands, for anyone who walks up to it.
export const LINE_FRONT = {
  stage: { x: 0, z: 0.5 }, cp: { x: 4, z: -27.2 }, barricade: { x: 36.5, z: -4.5 }, parliament: { x: 55, z: -4 },
};

const BUS = { speed: 3.6, dwellCP: 8, dwellJantar: 6, capacity: 14 };
const ARRIVAL_EVERY = 7;
const ARRIVALS_UNTIL = at(15, 0);
const WALK = 3.2;
const VIRAL = 4000;
const CROWD_PLACES = ['stage', 'cp', 'barricade', 'parliament'];

export const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
export function placeAt(p) {
  for (const [id, pl] of Object.entries(PLACES)) if (dist(p, pl) <= pl.r) return id;
  return null;
}

function person(id, spot, extra = {}) {
  return { id, x: spot.x, z: spot.z, path: [], mode: 'idle', carrying: null, ...extra };
}

export function createDay() {
  const rumour = () => ({ people: {}, places: {}, dead: false, exposure: {}, meeraT: 0, zoyaT: 0 });
  return {
    t: 0,
    over: false,
    ending: null,
    player: { x: SPOTS.metro.x, z: SPOTS.metro.z, carrying: null },
    people: {
      ravi: person('ravi', SPOTS.raviChai, { mode: 'chai' }),
      iqbal: person('iqbal', SPOTS.busCP, { mode: 'drive', hidden: true }),
      sharma: person('sharma', SPOTS.barricade, { mode: 'post', post: 'barricade' }),
      mira: person('mira', SPOTS.stageTop, { mode: 'stage' }),
      asha: person('asha', SPOTS.asha, { mode: 'stall' }),
      zoya: person('zoya', SPOTS.zoyaStart, { mode: 'idle', carrying: 'phone' }),
      meera: person('meera', SPOTS.meeraStart, { mode: 'film' }),
      kabir: person('kabir', SPOTS.kabirStart, { mode: 'away', hidden: true }),
      nikhil: person('nikhil', SPOTS.nikhilStart, { mode: 'lost', wander: 0 }),
      dev: person('dev', SPOTS.devStage, { mode: 'stage', carrying: 'megaphone' }),
      sana: person('sana', SPOTS.sanaTent, { mode: 'tent' }),
    },
    objects: {
      speaker: { holder: null, x: SPOTS.speakerChai.x, z: SPOTS.speakerChai.z, on: false },
      key: { holder: 'iqbal', x: SPOTS.busCP.x, z: SPOTS.busCP.z },
      megaphone: { holder: 'dev', x: SPOTS.devStage.x, z: SPOTS.devStage.z },
      phone: { holder: 'zoya', x: SPOTS.zoyaStart.x, z: SPOTS.zoyaStart.z },
      water: { holder: null, x: SPOTS.waterCP.x, z: SPOTS.waterCP.z },
    },
    bus: { x: SPOTS.busCP.x, z: SPOTS.busCP.z, phase: 'cp', timer: BUS.dwellCP, load: 0, breakPending: false, stuck: false },
    crowd: { cpWaiting: 2, cpParty: 0, stage: 6, parliament: 0, barricade: 0 },
    rumours: Object.fromEntries(Object.keys(RUMOURS).map((id) => [id, rumour()])),
    stream: { viewers: 0, live: false, place: null, viral: false },
    police: { watch: null, line: null },
    speech: null, // 'big' | 'small'
    march: false,
    minister: null, // null | 'waiting' | 'noshow'
    waterOk: false,
    heat: false,
    scared: false,
    biryaniRush: 0,
    nikhilFound: false,
    moment: null, // what happened with the megaphone at 15:30: 'singalong' | 'roast' | null
    roastViral: false,
    clash: null, // { place, live }
    timers: { arrival: 0, party: 0, speech: 0, march: 0, calm: 0, chase: 0, push: 0, line: 0, leave: 0 },
    fired: {}, // rule latches
    schedule: 0,
    events: [],
  };
}

// --- helpers -------------------------------------------------------------

function where(s, who) {
  const p = s.people[who];
  return p ? { place: placeAt(p), pos: { x: p.x, z: p.z } } : { place: null, pos: null };
}
function emit(s, key, { link = null, place = null, pos = null } = {}) {
  for (const [who, text] of LINES[key] || []) say(s, who, text, { key, link, place, pos });
  if (!LINES[key] && link) s.events.push({ t: s.t, key, who: 'street', text: '', link, place, pos });
}
/** One line of text from someone (a person id, 'wireless', 'street', 'feed' or 'stream'). */
function say(s, who, text, { key = null, link = null, place = null, pos = null } = {}) {
  const w = where(s, who);
  s.events.push({ t: s.t, key, who, text, link, place: place ?? w.place, pos: pos ?? w.pos });
}

function goTo(p, ...points) {
  p.path = points.map((q) => ({ x: q.x, z: q.z }));
}
const arrived = (p) => p.path.length === 0;

function objectPos(s, id) {
  const o = s.objects[id];
  if (o.holder === 'player') return s.player;
  if (o.holder === 'bus') return s.bus;
  if (o.holder && s.people[o.holder]) return s.people[o.holder];
  return o;
}
/** Lying somewhere a hand can reach it: the ground, the key hook, or Asha's cart. */
export const isFree = (o) => o.holder === null || o.holder === 'hook' || o.holder === 'cart';
const onGround = (o) => o.holder === null;
const cpTotal = (s) => s.crowd.cpWaiting + s.crowd.cpParty;
export function crowdAt(s, place) {
  const c = s.crowd;
  return { stage: c.stage, cp: cpTotal(s), barricade: c.barricade, parliament: c.parliament }[place] ?? 0;
}
function biggestCrowd(s, places = CROWD_PLACES) {
  return places.reduce((best, p) => (crowdAt(s, p) > crowdAt(s, best) ? p : best), places[0]);
}
const cpFears = (s) => s.rumours.cannon.places.cp && !s.rumours.cannon.dead;
const speakerAtStage = (s) => onGround(s.objects.speaker) && dist(s.objects.speaker, SPOTS.stageSpeaker) < 4;
const speakerPlayingAt = (s, place) => {
  const sp = s.objects.speaker;
  return onGround(sp) && sp.on && placeAt(sp) === place;
};
const atPlace = (s, who, place) => !s.people[who].hidden && placeAt(s.people[who]) === place;
const guarded = (s) => s.police.line === 'barricade' || dist(s.people.sharma, SPOTS.barricade) < 6;

// Routes between named areas. Walkers go via the CP post between CP and the stage, and via midway to the barricade.
function route(from, to) {
  const a = placeAt(from), pts = [];
  const toPlace = placeAt(to);
  if (a === 'metro' && toPlace !== 'metro') pts.push(SPOTS.metroPath);
  if ((a === 'cp') !== (toPlace === 'cp') && (a === 'cp' || toPlace === 'cp')) pts.push(SPOTS.cpPost);
  if ((a === 'barricade' || a === 'parliament') !== (toPlace === 'barricade' || toPlace === 'parliament')) pts.push(SPOTS.midway);
  if (toPlace === 'metro' && a !== 'metro') pts.push(SPOTS.metroPath);
  pts.push(to);
  return pts;
}
function walkTo(p, to) { goTo(p, ...route(p, to)); }

// --- rumours -----------------------------------------------------------------

export const knows = (s, rid, who) => !!s.rumours[rid].people[who];
function learn(s, rid, who) {
  const r = s.rumours[rid];
  if (r.people[who]) return;
  r.people[who] = true;
}
function placeLearns(s, rid, place) {
  const r = s.rumours[rid];
  if (r.places[place] || r.dead) return;
  const first = !Object.keys(r.places).length;
  r.places[place] = true;
  const text = RUMOURS[rid].reach[place];
  if (text) say(s, 'street', text, { key: 'rumour-reach', link: 'rumour-spreads', place, pos: PLACES[place] });
  if (first) say(s, 'feed', RUMOURS[rid].feed, { key: 'rumour-feed', place: null });
}
function spreadRumours(s, dt) {
  const people = Object.values(s.people).filter((p) => !p.hidden);
  for (const [rid, r] of Object.entries(s.rumours)) {
    if (r.dead) continue;
    const knowers = people.filter((p) => r.people[p.id]);
    for (const p of people) {
      if (r.people[p.id] || p.id === 'sharma') continue;
      const pl = placeAt(p);
      const near = knowers.some((q) => dist(p, q) <= (q.id === 'asha' ? 6 : 3.5));
      const crowdTells = pl && r.places[pl] && crowdAt(s, pl) >= 4;
      if (near || crowdTells) {
        r.exposure[p.id] = (r.exposure[p.id] || 0) + dt;
        if (r.exposure[p.id] >= (near ? 2 : 4)) learn(s, rid, p.id);
      } else r.exposure[p.id] = 0;
    }
    for (const q of knowers) {
      const pl = placeAt(q);
      if (!pl || !CROWD_PLACES.includes(pl) || r.places[pl] || crowdAt(s, pl) < 3) continue;
      const k = '@' + pl;
      r.exposure[k] = (r.exposure[k] || 0) + dt;
      if (r.exposure[k] >= (q.id === 'asha' ? 2 : 3)) placeLearns(s, rid, pl);
    }
    if (r.people.meera) r.meeraT += dt;
    if (r.people.zoya && s.people.zoya.carrying === 'phone') r.zoyaT += dt;
  }
}

// --- routines (things that happen at a time of day) ----------------------

const SCHEDULE = [
  [at(10, 20), (s) => { const z = s.people.zoya; z.mode = 'toFilm'; z.target = 'stage'; walkTo(z, FILM_SPOTS.stage); }],
  [at(10, 30), (s) => {
    const r = s.people.ravi, sp = s.objects.speaker;
    if (onGround(sp) && dist(sp, r) < 3.5) {
      sp.holder = 'ravi'; r.carrying = 'speaker'; r.mode = 'toStage';
      goTo(r, SPOTS.cpPost, SPOTS.raviStage);
    } else startRaviSearch(s);
  }],
  [at(11, 0), (s) => {
    s.bus.breakPending = true;
    const k = s.people.kabir;
    k.hidden = false; Object.assign(k, SPOTS.kabirStart); k.mode = 'toStage'; walkTo(k, SPOTS.kabirStage);
    const m = s.people.meera; m.target = 'cp'; walkTo(m, FILM_SPOTS.cp);
  }],
  [at(11, 15), (s) => {
    const r = s.people.ravi;
    if (r.mode === 'stage') { r.mode = 'toChai'; goTo(r, SPOTS.cpPost, SPOTS.raviChai); }
  }],
  [at(11, 30), (s) => endIqbalBreak(s)],
  [at(11, 40), (s) => {
    const r = s.people.ravi;
    if (r.mode === 'chaiBreak' || r.mode === 'toChai') { r.mode = 'backToStage'; goTo(r, SPOTS.cpPost, SPOTS.raviStage); }
  }],
  [at(12, 0), (s) => {
    startSpeech(s);
    const m = s.people.meera; m.target = 'stage'; walkTo(m, offset(FILM_SPOTS.stage, 2.2));
  }],
  [at(12, 30), (s) => { const z = s.people.zoya; if (z.mode === 'filming' || z.mode === 'toFilm') z.mode = 'chase'; }],
  [at(13, 0), (s) => {
    const z = s.people.zoya;
    if (z.carrying === 'phone' && z.mode !== 'search') { z.mode = 'toCharge'; walkTo(z, SPOTS.zoyaCharge); }
    const a = s.people.asha; a.mode = 'toStage'; walkTo(a, SPOTS.ashaStage);
    s.people.meera.mode = 'chase';
    if (!s.waterOk) emit(s, 'water-out', { link: null });
  }],
  [at(13, 20), (s) => {
    const z = s.people.zoya;
    if (z.mode !== 'charging' && z.mode !== 'toCharge') return;
    const ph = s.objects.phone;
    if (ph.holder === 'cart') { ph.holder = 'zoya'; z.carrying = 'phone'; z.mode = 'chase'; z.target = null; s.timers.chase = 0; }
    else { z.mode = 'search'; z.searchIndex = 0; emit(s, 'phone-missing', { link: 'phone-missing' }); }
  }],
  [at(13, 30), (s) => { s.bus.breakPending = true; }],
  [at(14, 0), (s) => {
    endIqbalBreak(s);
    const a = s.people.asha; a.mode = 'toStall'; walkTo(a, SPOTS.asha);
    const k = s.people.kabir;
    if (k.hidden) return;
    if (s.nikhilFound) emit(s, 'kabir-stays');
    else { k.mode = 'leaving'; walkTo(k, SPOTS.kabirStart); emit(s, 'kabir-leaves', { link: 'kabir-leaves' }); }
  }],
  [at(14, 15), (s) => {
    const d = s.people.dev, m = s.objects.megaphone;
    if (d.carrying === 'megaphone') { d.carrying = null; m.holder = null; Object.assign(m, SPOTS.megStage); emit(s, 'dev-chai'); }
    d.mode = 'toChai'; walkTo(d, SPOTS.devChai);
  }],
  [at(14, 45), (s) => { const d = s.people.dev; if (d.mode === 'chai' || d.mode === 'toChai') { d.mode = 'backForMeg'; walkTo(d, SPOTS.megStage); } }],
  [at(15, 0), (s) => formPoliceLine(s)],
  [at(15, 30), (s) => megaphoneMoment(s)],
  [at(16, 30), (s) => emit(s, 'wind-down')],
];

function offset(p, dx = 0, dz = 0) { return { x: p.x + dx, z: p.z + dz }; }

function runSchedule(s) {
  while (s.schedule < SCHEDULE.length && s.t >= SCHEDULE[s.schedule][0]) {
    SCHEDULE[s.schedule][1](s);
    s.schedule++;
  }
}

function startRaviSearch(s) {
  const r = s.people.ravi;
  r.mode = 'search';
  r.searchIndex = 0;
  emit(s, 'ravi-missing');
}
const RAVI_SEARCH = [SPOTS.raviChai, SPOTS.cpPost, SPOTS.busDoor, SPOTS.midway, SPOTS.raviStage, SPOTS.cpPost];

function startSpeech(s) {
  const big = speakerAtStage(s) && s.objects.speaker.on;
  s.speech = big ? 'big' : 'small';
  s.timers.speech = at(12, 30) - at(12, 0);
  s.people.mira.mode = 'speech';
  emit(s, big ? 'big-speech' : 'small-speech', { link: big ? 'big-speech' : 'small-speech', place: 'stage', pos: SPOTS.stageTop });
}

function startIqbalBreak(s) {
  const q = s.people.iqbal, b = s.bus;
  b.phase = 'parked'; b.breakPending = false;
  s.objects.key.holder = 'hook';
  Object.assign(s.objects.key, SPOTS.keyHook);
  q.hidden = false; Object.assign(q, SPOTS.busDoor);
  q.mode = 'toChai'; goTo(q, SPOTS.chai);
  emit(s, 'break-start');
}

function endIqbalBreak(s) {
  const q = s.people.iqbal;
  if (q.mode === 'chai' || q.mode === 'toChai') { q.mode = 'toBus'; goTo(q, SPOTS.busDoor); }
  else if (s.bus.breakPending) s.bus.breakPending = false; // never got to CP in time; skip this break
}
const IQBAL_SEARCH = [SPOTS.busDoor, SPOTS.cpPost, SPOTS.chai, { x: 12, z: -41 }, SPOTS.busDoor];
const ZOYA_SEARCH = [SPOTS.zoyaCharge, SPOTS.cpPost, { x: -10, z: -26 }, SPOTS.chai];

function iqbalResume(s) {
  const q = s.people.iqbal, k = s.objects.key;
  k.holder = 'iqbal'; q.carrying = null;
  q.mode = 'drive'; q.hidden = true; q.path = [];
  Object.assign(q, { x: s.bus.x, z: s.bus.z });
  if (s.bus.stuck) { s.bus.stuck = false; s.fired['cp-piles-up'] = false; }
  s.bus.phase = 'cp'; s.bus.timer = 3;
}

/** 15:00: Inspector Rao lines his men up wherever the camera is, or else at the biggest crowd. */
function formPoliceLine(s) {
  const place = s.police.watch ?? (s.heat ? 'stage' : biggestCrowd(s, ['stage', 'cp', 'barricade']));
  s.police.line = place;
  emit(s, `line-${place}`, { link: s.police.watch ? 'line-follows-camera' : 'police-line', place, pos: LINE_FRONT[place] });
  const sh = s.people.sharma;
  if (place === 'cp' && sh.post === 'cp') { sh.post = 'barricade'; sh.mode = 'toPost'; walkTo(sh, SPOTS.barricade); }
}

/** 15:30: whoever has the megaphone decides what the crowd at the stage hears. */
function megaphoneMoment(s) {
  const holder = s.objects.megaphone.holder;
  if (holder === 'mira') {
    s.moment = 'singalong';
    emit(s, 'singalong', { link: 'mira-megaphone', place: 'stage', pos: SPOTS.stageTop });
    if (s.police.line === 'stage') { s.police.line = null; emit(s, 'line-withdraws', { link: 'singalong-line' }); }
  } else if (holder === 'kabir' && atPlace(s, 'kabir', 'stage')) {
    s.moment = 'roast';
    s.roastViral = s.stream.live && s.stream.place === 'stage';
    emit(s, 'roast', { link: 'kabir-roast', place: 'stage' });
    if (s.roastViral) emit(s, 'roast-viral', { link: 'roast-viral' });
  } else if (holder === 'player' || holder === null) {
    emit(s, 'dev-missing-meg');
  }
}

// --- movement ------------------------------------------------------------

function walk(p, dt, speed = WALK) {
  let step = speed * dt;
  while (step > 0 && p.path.length) {
    const q = p.path[0], d = dist(p, q);
    if (d <= step) { p.x = q.x; p.z = q.z; p.path.shift(); step -= d; }
    else { p.x += ((q.x - p.x) / d) * step; p.z += ((q.z - p.z) / d) * step; step = 0; }
  }
}

function updatePeople(s, dt) {
  const P = s.people;
  for (const p of Object.values(P)) if (!p.hidden) walk(p, dt, p.mode === 'follow' ? WALK * 1.25 : WALK);
  if (s.timers.speech > 0) { s.timers.speech -= dt; if (s.timers.speech <= 0) P.mira.mode = 'stage'; }
  updateRavi(s);
  updateIqbal(s);
  updateSharma(s);
  updateZoya(s, dt);
  updateMeera(s, dt);
  updateKabirNikhil(s, dt);
  updateAshaDevSana(s);

  // Carried objects follow their holder.
  for (const id of Object.keys(s.objects)) {
    const o = s.objects[id];
    if (o.holder === 'hook' || o.holder === 'cart') continue;
    const p = objectPos(s, id);
    if (p !== o) { o.x = p.x; o.z = p.z; }
  }
}

function updateRavi(s) {
  const r = s.people.ravi;
  if (r.mode === 'toStage' && arrived(r)) placeSpeakerOnStage(s);
  if (r.mode === 'toChai' && arrived(r)) { r.mode = 'chaiBreak'; if (s.people.iqbal.mode === 'chai') emit(s, 'ravi-at-chai'); }
  if (r.mode === 'backToStage' && arrived(r)) {
    if (speakerAtStage(s)) r.mode = 'stage'; else startRaviSearch(s);
  }
  if (r.mode === 'search') {
    const sp = s.objects.speaker;
    if (sp.holder === 'player' && dist(r, s.player) < 4.5) {
      sp.holder = 'ravi'; r.carrying = 'speaker'; s.player.carrying = null; sp.on = false;
      emit(s, 'ravi-reclaims', { link: 'owner-reclaims' });
      r.mode = 'toStage'; goTo(r, SPOTS.raviStage);
    } else if (onGround(sp) && dist(r, sp) < 4) {
      sp.holder = 'ravi'; r.carrying = 'speaker'; sp.on = false;
      emit(s, 'ravi-finds');
      r.mode = 'toStage'; goTo(r, sp.x < -5 ? SPOTS.cpPost : SPOTS.midway, SPOTS.raviStage);
    } else if (onGround(sp) && sp.on && dist(r, sp) < 10 && !r.following) {
      r.following = true; goTo(r, sp); // he hears it
    } else if (arrived(r)) {
      r.following = false;
      r.searchIndex = (r.searchIndex + 1) % RAVI_SEARCH.length;
      goTo(r, RAVI_SEARCH[r.searchIndex]);
    }
  }
}

function updateIqbal(s) {
  const q = s.people.iqbal;
  if (q.mode === 'toChai' && arrived(q)) q.mode = 'chai';
  if (q.mode === 'toBus' && arrived(q)) {
    if (s.objects.key.holder === 'hook') iqbalResume(s);
    else {
      q.mode = 'search'; q.searchIndex = 0; s.bus.stuck = true;
      emit(s, 'key-missing', { link: 'key-missing' });
    }
  }
  if (q.mode === 'search') {
    const k = s.objects.key;
    if (k.holder === 'player' && dist(q, s.player) < 4) {
      s.player.carrying = null; k.holder = 'iqbal';
      emit(s, 'iqbal-reclaims', { link: 'owner-reclaims' });
      q.mode = 'toBusWithKey'; goTo(q, SPOTS.busDoor);
    } else if (onGround(k) && dist(q, k) < 4) {
      k.holder = 'iqbal';
      emit(s, 'iqbal-finds');
      q.mode = 'toBusWithKey'; goTo(q, SPOTS.busDoor);
    } else if (arrived(q)) {
      q.searchIndex = (q.searchIndex + 1) % IQBAL_SEARCH.length;
      goTo(q, IQBAL_SEARCH[q.searchIndex]);
    }
  }
  if (q.mode === 'toBusWithKey' && arrived(q)) iqbalResume(s);
}

function updateSharma(s) {
  const sh = s.people.sharma;
  if (sh.mode === 'toPost' && arrived(sh)) sh.mode = 'post';
  if (sh.mode === 'toSpeaker' && arrived(sh)) {
    sh.mode = 'post';
    const sp = s.objects.speaker;
    if (onGround(sp) && sp.on && dist(sh, sp) < 3) {
      sp.on = false;
      emit(s, 'sharma-kills-party', { link: 'sharma-kills-party', place: 'cp' });
    }
  }
}

function updateZoya(s, dt) {
  const z = s.people.zoya, st = s.stream;
  if (z.mode === 'toFilm' && arrived(z)) z.mode = 'filming';
  if (z.mode === 'toCharge' && arrived(z)) {
    z.mode = 'charging'; z.carrying = null;
    const ph = s.objects.phone; ph.holder = 'cart'; Object.assign(ph, SPOTS.phoneCart);
    emit(s, 'zoya-charges');
  }
  if (z.mode === 'chase') {
    s.timers.chase -= dt;
    if (s.timers.chase <= 0) {
      s.timers.chase = 25;
      const target = zoyaTarget(s);
      if (target !== z.target && crowdAt(s, target) >= 6) {
        z.target = target;
        walkTo(z, FILM_SPOTS[target]);
        say(s, 'stream', `Zoya: Chalo ${PLACES[target].name}, wahan kuch ho raha hai. Stay tuned.`, { key: 'zoya-moves' });
      }
    }
  }
  if (z.mode === 'search') {
    const ph = s.objects.phone;
    if (ph.holder === 'player' && dist(z, s.player) < 4) {
      s.player.carrying = null; ph.holder = 'zoya'; z.carrying = 'phone'; z.mode = 'chase'; z.target = null; s.timers.chase = 0;
      emit(s, 'zoya-reclaims', { link: 'owner-reclaims' });
    } else if (isFree(ph) && dist(z, ph) < 4) {
      ph.holder = 'zoya'; z.carrying = 'phone'; z.mode = 'chase'; z.target = null; s.timers.chase = 0;
      emit(s, 'zoya-finds');
    } else if (arrived(z)) {
      z.searchIndex = ((z.searchIndex ?? 0) + 1) % ZOYA_SEARCH.length;
      goTo(z, ZOYA_SEARCH[z.searchIndex]);
    }
  }
  // The live stream: on when Zoya has her phone and stands at a crowd of ten or more.
  const pl = placeAt(z);
  st.live = s.t >= at(11, 45) && z.carrying === 'phone' && !z.hidden && arrived(z) && pl && CROWD_PLACES.includes(pl) && crowdAt(s, pl) >= 10;
  st.place = st.live ? pl : null;
  if (st.live) st.viewers += crowdAt(s, pl) * excitement(s, pl) * dt;
  else st.viewers = Math.max(0, st.viewers - 15 * dt);
  if (st.viral && st.live) s.police.watch = pl; // Rao watches whatever the stream shows
}

/** How much is happening at a place, as far as a live stream's viewers care. */
function excitement(s, place) {
  if (s.clash?.place === place) return 6;
  if (s.march && (place === 'barricade' || place === 'parliament')) return 5;
  if (place === 'stage' && (s.moment || (s.speech === 'big' && s.timers.speech > 0))) return 3;
  if (place === 'cp' && speakerPlayingAt(s, 'cp')) return 3;
  if (place === 'barricade' && s.minister) return 2;
  return 0.5;
}
// Zoya goes where the story is: a minister at the barricade, then a party, then the biggest crowd.
function zoyaTarget(s) {
  if (knows(s, 'minister', 'zoya') && s.t >= at(15, 0)) return 'barricade';
  if (s.crowd.cpParty >= 6) return 'cp';
  return biggestCrowd(s);
}

function updateMeera(s, dt) {
  const m = s.people.meera;
  if (m.mode !== 'chase' || !arrived(m)) return;
  s.timers.meera = (s.timers.meera || 0) - dt;
  if (s.timers.meera > 0) return;
  s.timers.meera = 20;
  // Meera goes where it is loudest: a speaker party beats any crowd.
  const target = speakerPlayingAt(s, 'cp') ? 'cp' : biggestCrowd(s);
  if (target !== m.target) { m.target = target; walkTo(m, offset(FILM_SPOTS[target], 2.2, 1)); }
}

function updateKabirNikhil(s, dt) {
  const k = s.people.kabir, n = s.people.nikhil;
  if (k.mode === 'toStage' && arrived(k)) k.mode = 'stage';
  if (k.mode === 'leaving' && arrived(k)) { k.hidden = true; k.mode = 'away'; }
  if (n.mode === 'lost' && arrived(n)) {
    n.wander = (n.wander + 1) % 3;
    goTo(n, [SPOTS.nikhilStart, { x: -11, z: 33 }, { x: -3, z: 28 }][n.wander]);
  }
  if (n.mode === 'follow') {
    const p = s.player, d = dist(n, p);
    if (d > 28) { n.mode = 'lost'; n.path = []; emit(s, 'nikhil-lost-again'); }
    else if (d > 2.2) goTo(n, { x: p.x + (n.x - p.x) * (1.8 / d), z: p.z + (n.z - p.z) * (1.8 / d) });
    else n.path = [];
    if (placeAt(n) === 'stage' && (k.hidden || dist(k, SPOTS.kabirStage) > 6)) { n.mode = 'waitStage'; goTo(n, offset(SPOTS.kabirStage, 1.4, 0.8)); }
  }
  if ((n.mode === 'follow' || n.mode === 'waitStage') && !k.hidden && dist(n, k) < 4) {
    n.mode = 'withKabir'; s.nikhilFound = true;
    goTo(n, offset(SPOTS.kabirStage, 1.4, 0.8));
    emit(s, 'nikhil-finds-kabir', { link: 'nikhil-finds-kabir' });
    if (k.mode === 'leaving' || k.mode === 'away') { k.hidden = false; k.mode = 'toStage'; walkTo(k, SPOTS.kabirStage); }
  }
  if (n.mode === 'withKabir' && k.mode === 'stage' && dist(n, k) > 3 && arrived(n)) goTo(n, offset(SPOTS.kabirStage, 1.4, 0.8));
  void dt;
}

function updateAshaDevSana(s) {
  const a = s.people.asha, d = s.people.dev, sa = s.people.sana, w = s.objects.water;
  if (a.mode === 'toStage' && arrived(a)) a.mode = 'selling';
  if (a.mode === 'toStall' && arrived(a)) a.mode = 'stall';

  if (d.mode === 'toChai' && arrived(d)) d.mode = 'chai';
  if (d.mode === 'backForMeg' && arrived(d)) {
    const m = s.objects.megaphone;
    if (onGround(m) && dist(m, d) < 3) { m.holder = 'dev'; d.carrying = 'megaphone'; }
    else emit(s, 'dev-missing-meg');
    d.mode = 'stage'; goTo(d, SPOTS.devStage);
  }
  if (d.mode === 'toBarricade' && arrived(d)) d.mode = 'waiting';

  // Sana fetches the water crate when the shuttle drops it at the Jantar stop.
  if (sa.mode === 'tent' && !s.waterOk && onGround(w) && dist(w, SPOTS.waterJantar) < 6) { sa.mode = 'fetch'; walkTo(sa, w); }
  if (sa.mode === 'fetch' && arrived(sa)) {
    if (onGround(w) && dist(w, sa) < 2.5) { w.holder = 'sana'; sa.carrying = 'water'; sa.mode = 'carry'; walkTo(sa, SPOTS.sanaTent); }
    else { sa.mode = 'tent'; walkTo(sa, SPOTS.sanaTent); }
  }
  if (sa.mode === 'carry' && arrived(sa)) deliverWater(s);
}

function deliverWater(s) {
  const sa = s.people.sana, w = s.objects.water;
  w.holder = null; sa.carrying = null; Object.assign(w, offset(SPOTS.sanaTent, 1.1, 0.6));
  sa.mode = 'tent'; s.waterOk = true;
  emit(s, 'water-delivered', { link: 'water-delivered' });
}

function placeSpeakerOnStage(s) {
  const r = s.people.ravi, sp = s.objects.speaker;
  sp.holder = null; r.carrying = null; sp.on = true;
  Object.assign(sp, SPOTS.stageSpeaker);
  r.mode = 'stage';
}

function updateBus(s, dt) {
  const b = s.bus, w = s.objects.water;
  if (b.phase === 'parked') return;
  b.timer -= dt;
  if (b.phase === 'cp') {
    if (b.breakPending) { startIqbalBreak(s); return; }
    if (b.timer <= 0) {
      // Nobody boards for Jantar while CP believes a water cannon is waiting there.
      b.load = cpFears(s) ? 0 : Math.min(BUS.capacity, s.crowd.cpWaiting);
      s.crowd.cpWaiting -= b.load;
      // Sana's water crate rides the first shuttle after 12:30.
      if (s.t >= at(12, 30) && onGround(w) && dist(w, SPOTS.waterCP) < 3) w.holder = 'bus';
      b.phase = 'toJantar';
    }
  } else if (b.phase === 'jantar') {
    if (b.timer <= 0) b.phase = 'toCP';
  } else {
    const target = b.phase === 'toJantar' ? SPOTS.busJantar : SPOTS.busCP;
    const d = target.z - b.z, step = BUS.speed * dt;
    if (Math.abs(d) <= step) {
      b.z = target.z;
      if (b.phase === 'toJantar') {
        const joining = s.police.line === 'stage' || s.scared ? 0 : b.load;
        s.crowd.stage += joining; b.unloaded = b.load; b.load = 0; b.phase = 'jantar'; b.timer = BUS.dwellJantar;
        if (w.holder === 'bus') { w.holder = null; Object.assign(w, SPOTS.waterJantar); emit(s, 'water-arrives'); }
      } else { b.phase = 'cp'; b.timer = BUS.dwellCP; }
    } else b.z += Math.sign(d) * step;
  }
  if (s.people.iqbal.hidden) Object.assign(s.people.iqbal, { x: b.x, z: b.z });
}

function updateCrowds(s, dt) {
  const c = s.crowd, T = s.timers, line = s.police.line;
  if (s.t < ARRIVALS_UNTIL && line !== 'cp') {
    T.arrival += dt;
    while (T.arrival >= ARRIVAL_EVERY) { T.arrival -= ARRIVAL_EVERY; c.cpWaiting++; }
  }
  // A playing speaker at CP pulls people in; without it they drift off. Meera filming it pulls in more.
  T.party += dt;
  const meeraFilming = atPlace(s, 'meera', 'cp') && dist(s.people.meera, s.objects.speaker) < 9;
  if (speakerPlayingAt(s, 'cp') && line !== 'cp') {
    if (T.party >= (meeraFilming ? 2 : 4)) { T.party = 0; if (c.cpParty < (meeraFilming ? 22 : 16)) c.cpParty++; }
  } else if (T.party >= 3) { T.party = 0; if (c.cpParty > 0) c.cpParty--; }
  // Big speech keeps drawing people from the street.
  if (s.speech === 'big' && s.timers.speech > 0) {
    T.speechJoin = (T.speechJoin || 0) + dt;
    while (T.speechJoin >= 2.5) { T.speechJoin -= 2.5; c.stage++; }
  }
  if (s.speech === 'small' && s.timers.speech > 0) {
    T.speechLeave = (T.speechLeave || 0) + dt;
    while (T.speechLeave >= 4) { T.speechLeave -= 4; if (c.stage > 4) c.stage--; }
  }
  // The stage crowd walks to the barricade behind Dev while he waits for the minister.
  if (s.minister === 'waiting') {
    T.toBarricade = (T.toBarricade || 0) + dt;
    while (T.toBarricade >= 2) { T.toBarricade -= 2; if (c.stage > 4 && c.barricade < 16) { c.stage--; c.barricade++; } }
  }
  if (s.minister === 'noshow' && !s.march && !s.clash) {
    T.leave += dt;
    while (T.leave >= 3) { T.leave -= 3; if (c.barricade > 0) c.barricade--; }
  }
  if (s.moment === 'singalong' || s.moment === 'roast') {
    T.moment = (T.moment || 0) + dt;
    while (T.moment >= 3) { T.moment -= 3; if (c.stage < 30) c.stage++; }
  }
  if (s.march) {
    T.march += dt;
    while (T.march >= 1.6) {
      T.march -= 1.6;
      if (c.barricade > 0) { c.barricade--; c.parliament++; } else if (c.stage > 0) { c.stage--; c.parliament++; }
    }
  }
  // After 16:30 people head home, unless something is holding them.
  if (s.t >= at(16, 30) && !s.moment) {
    T.home = (T.home || 0) + dt;
    while (T.home >= 6) { T.home -= 6; if (c.stage > 8) c.stage--; }
  }
}

// --- rules: when [something visible], [someone] does [something visible] --

const rumourRules = (rid) => [
  {
    id: `meera-posts-${rid}`,
    says: 'meera-posts',
    when: (s) => !s.rumours[rid].dead && s.rumours[rid].meeraT >= 8,
    then: (s) => {
      emit(s, 'meera-posts', { link: 'meera-amplifies' });
      for (const pl of CROWD_PLACES) if (crowdAt(s, pl) >= 3) placeLearns(s, rid, pl);
    },
  },
];

export const RULES = [
  // Slice 1: speaker, key, shuttle, Sharma.
  {
    id: 'cp-party',
    says: 'cp-party', // what the player sees or hears when it fires
    repeat: true,
    when: (s) => speakerPlayingAt(s, 'cp') && s.crowd.cpParty >= 4,
    then: (s) => emit(s, 'cp-party', { link: 'cp-party', place: 'cp', pos: s.objects.speaker }),
  },
  {
    id: 'meera-reel',
    says: 'meera-reel',
    when: (s) => speakerPlayingAt(s, 'cp') && atPlace(s, 'meera', 'cp') && s.crowd.cpParty >= 4,
    then: (s) => emit(s, 'meera-reel', { link: 'meera-reel', place: 'cp' }),
  },
  {
    id: 'ravi-notices',
    says: 'ravi-missing',
    repeat: true,
    when: (s) => s.people.ravi.mode === 'stage' && !speakerAtStage(s) && s.objects.speaker.holder !== 'ravi',
    then: (s) => startRaviSearch(s),
  },
  {
    id: 'cp-piles-up',
    says: 'cp-piles-up',
    when: (s) => s.bus.stuck && s.crowd.cpWaiting >= 8,
    then: (s) => emit(s, 'cp-piles-up', { link: 'cp-piles-up', place: 'cp', pos: PLACES.cp }),
  },
  {
    id: 'rao-sends-sharma',
    says: 'rao-sends-sharma',
    repeat: true,
    when: (s) => s.people.sharma.post === 'barricade' && cpTotal(s) >= 15 && s.police.line !== 'cp',
    then: (s) => {
      const sh = s.people.sharma;
      sh.post = 'cp'; sh.mode = 'toPost';
      goTo(sh, SPOTS.midway, SPOTS.cpPost);
      emit(s, 'rao-sends-sharma', { link: 'rao-sends-sharma' });
    },
  },
  {
    id: 'sharma-kills-party',
    says: 'sharma-kills-party',
    repeat: true,
    when: (s) => s.people.sharma.post === 'cp' && s.people.sharma.mode === 'post' && speakerPlayingAt(s, 'cp'),
    then: (s) => {
      const sh = s.people.sharma, sp = s.objects.speaker;
      sh.mode = 'toSpeaker'; goTo(sh, { x: sp.x + 1.2, z: sp.z + 1.2 });
    },
  },
  {
    id: 'rao-recalls',
    says: 'rao-recalls',
    repeat: true,
    when: (s) => s.people.sharma.post === 'cp' && s.people.sharma.mode === 'post' && s.timers.calm >= 8,
    then: (s) => {
      const sh = s.people.sharma;
      sh.post = 'barricade'; sh.mode = 'toPost';
      goTo(sh, SPOTS.midway, SPOTS.barricade);
      emit(s, 'rao-recalls', { link: 'rao-recalls' });
    },
  },
  {
    id: 'march',
    says: 'march',
    repeat: true,
    when: (s) => !s.march && !s.clash && s.speech === 'big' && s.t >= at(14, 0) && s.crowd.stage >= 16 && !guarded(s),
    then: (s) => { s.march = true; emit(s, 'march', { link: 'march', place: 'stage', pos: PLACES.barricade }); },
  },
  {
    id: 'march-stop',
    says: 'march-stop',
    repeat: true,
    when: (s) => s.march && s.people.sharma.post === 'barricade' && dist(s.people.sharma, SPOTS.barricade) < 2,
    then: (s) => { s.march = false; emit(s, 'march-stop', { place: 'barricade' }); },
  },

  // Slice 2: rumours, Asha, Zoya, Rao.
  {
    id: 'kabir-laughs-off',
    says: 'kabir-laughs-off',
    when: (s) => s.rumours.cannon.places.stage && !s.rumours.cannon.dead && s.people.kabir.mode === 'stage',
    then: (s) => { s.rumours.cannon.dead = true; emit(s, 'kabir-laughs-off', { link: 'kabir-laughs-off', place: 'stage' }); },
  },
  {
    id: 'cannon-scare',
    says: 'cannon-scare',
    when: (s) => s.rumours.cannon.places.stage && !s.rumours.cannon.dead,
    then: (s) => {
      const c = s.crowd, gone = Math.floor(c.stage * 0.6);
      c.stage -= gone; s.scared = gone;
      emit(s, 'cannon-scare', { link: 'cannon-scare', place: 'stage', pos: PLACES.stage });
    },
  },
  {
    id: 'zoya-debunks-cannon',
    says: 'zoya-debunks-cannon',
    when: (s) => s.rumours.cannon.zoyaT >= 12 && !s.rumours.cannon.dead,
    then: (s) => {
      s.rumours.cannon.dead = true;
      if (s.scared) { s.crowd.stage += Math.ceil(s.scared * 0.7); s.scared = 0; }
      emit(s, 'zoya-debunks-cannon', { link: 'zoya-debunks' });
    },
  },
  {
    id: 'biryani-rush',
    says: 'biryani-rush',
    when: (s) => s.rumours.biryani.places.stage && !s.rumours.biryani.dead && s.crowd.stage > 4,
    then: (s) => {
      const n = Math.min(10, s.crowd.stage - 4);
      s.crowd.stage -= n; s.crowd.cpWaiting += n; s.biryaniRush = n; s.timers.rush = s.t;
      emit(s, 'biryani-rush', { link: 'biryani-rush', place: 'stage', pos: PLACES.stage });
      placeLearns(s, 'biryani', 'cp'); // the rushers carry it with them
    },
  },
  {
    id: 'asha-denies-biryani',
    says: 'asha-denies-biryani',
    when: (s) => s.biryaniRush > 0 && s.t >= s.timers.rush + 15 && atPlace(s, 'asha', 'cp'),
    then: (s) => { s.rumours.biryani.dead = true; emit(s, 'asha-denies-biryani', { link: 'asha-denies' }); },
  },
  {
    id: 'zoya-debunks-biryani',
    says: 'zoya-debunks-biryani',
    when: (s) => s.rumours.biryani.zoyaT >= 12 && !s.rumours.biryani.dead,
    then: (s) => { s.rumours.biryani.dead = true; emit(s, 'zoya-debunks-biryani', { link: 'zoya-debunks' }); },
  },
  ...rumourRules('cannon'),
  ...rumourRules('biryani'),
  ...rumourRules('minister'),
  {
    id: 'cp-refuses',
    says: 'cp-refuses',
    when: (s) => cpFears(s) && s.crowd.cpWaiting >= 6 && s.bus.phase === 'cp',
    then: (s) => emit(s, 'cp-refuses', { link: 'cp-refuses', place: 'cp', pos: SPOTS.busDoor }),
  },
  {
    id: 'zoya-covers-minister',
    says: 'zoya-covers-minister',
    when: (s) => knows(s, 'minister', 'zoya') && s.t >= at(15, 0) && s.people.zoya.mode === 'chase',
    then: (s) => { s.timers.chase = 0; emit(s, 'zoya-covers-minister'); },
  },
  {
    id: 'stream-viral',
    says: 'stream-viral',
    when: (s) => s.stream.viewers >= VIRAL,
    then: (s) => {
      s.stream.viral = true; s.police.watch = s.stream.place;
      emit(s, 'stream-viral', { link: 'stream-viral' });
    },
  },
  {
    id: 'zoya-whistle',
    says: 'zoya-whistle',
    when: (s) => s.stream.live && s.stream.viewers >= 1500,
    then: (s) => emit(s, 'zoya-whistle'),
  },

  // Slice 3: the minister rumour, the barricade, the clash.
  {
    id: 'minister-wait',
    says: 'minister-wait',
    when: (s) => knows(s, 'minister', 'dev') && s.t >= at(15, 0) && !s.minister && ['stage', 'waiting', 'backForMeg'].includes(s.people.dev.mode),
    then: (s) => {
      const d = s.people.dev; s.minister = 'waiting';
      d.mode = 'toBarricade'; walkTo(d, SPOTS.devBarricade);
      emit(s, 'minister-wait', { link: 'minister-wait' });
    },
  },
  {
    id: 'minister-noshow',
    says: 'minister-noshow',
    when: (s) => s.minister === 'waiting' && s.t >= at(16, 0),
    then: (s) => { s.minister = 'noshow'; emit(s, 'minister-noshow', { link: null }); },
  },
  {
    id: 'barricade-push',
    says: 'barricade-push',
    when: (s) => s.minister === 'noshow' && !s.march && !s.clash && s.crowd.barricade >= 10 && !guarded(s) && s.people.dev.carrying === 'megaphone',
    then: (s) => { s.march = true; emit(s, 'barricade-push', { link: 'barricade-push', place: 'barricade' }); },
  },
  {
    id: 'dev-provokes',
    says: 'clash',
    when: (s) => s.minister === 'noshow' && !s.clash && !s.march && s.people.dev.carrying === 'megaphone' && guarded(s) && s.crowd.barricade >= 10,
    then: (s) => startClash(s, 'barricade'),
  },
  {
    id: 'dev-fizzles',
    says: 'dev-fizzles',
    when: (s) => s.minister === 'noshow' && s.people.dev.carrying !== 'megaphone',
    then: (s) => emit(s, 'dev-fizzles', { link: 'dev-fizzles' }),
  },

  // Slice 4: water, heat, Nikhil and Kabir, Asha.
  {
    id: 'heat',
    says: 'heat',
    when: (s) => s.t >= at(14, 0) && !s.waterOk && s.crowd.stage >= 18,
    then: (s) => {
      s.heat = true; s.crowd.stage -= 5;
      if (!s.police.watch) s.police.watch = 'stage';
      emit(s, 'heat', { link: 'heat', place: 'stage', pos: SPOTS.sanaTent });
    },
  },
  {
    id: 'heat-on-stream',
    says: 'heat-on-stream',
    when: (s) => s.heat && s.stream.live && s.stream.place === 'stage',
    then: (s) => { s.stream.viewers += 1500; emit(s, 'heat-on-stream'); },
  },
  {
    id: 'asha-sells-stage',
    says: 'asha-sells-stage',
    when: (s) => s.people.asha.mode === 'selling' && s.crowd.stage >= 10,
    then: (s) => emit(s, 'asha-sells-stage'),
  },
  {
    id: 'evening-clash-ends',
    says: 'clash-over',
    when: (s) => s.clash && s.t >= s.clash.t + 25,
    then: (s) => { emit(s, 'clash-over'); finish(s); },
  },
];

function startClash(s, place) {
  s.clash = { place, live: s.stream.live && s.stream.place === place, t: s.t };
  const d = s.people.dev; d.mode = 'shouting'; walkTo(d, LINE_FRONT[place]);
  emit(s, s.clash.live ? 'clash-live' : 'clash', { link: s.clash.live ? 'clash-live' : 'dev-provokes', place, pos: LINE_FRONT[place] });
  s.crowd.barricade = Math.ceil(s.crowd.barricade / 2);
}

function runRules(s, dt) {
  s.timers.calm = cpTotal(s) < 9 ? s.timers.calm + dt : 0;
  for (const rule of RULES) {
    if (s.over) return;
    const hot = rule.when(s);
    if (hot && !s.fired[rule.id]) {
      s.fired[rule.id] = true;
      rule.then(s);
    } else if (!hot && rule.repeat) s.fired[rule.id] = false;
  }
}

// --- public API ------------------------------------------------------------

export function tick(s, dt) {
  if (s.over) return s;
  s.t += dt;
  runSchedule(s);
  updateBus(s, dt);
  updatePeople(s, dt);
  updateCrowds(s, dt);
  spreadRumours(s, dt);
  runRules(s, dt);
  if (!s.over && s.t >= at(17, 0)) finish(s);
  return s;
}

/** Fast-forward in fixed steps; used by tests and the "wait" action. */
export function advance(s, seconds, step = 0.1) {
  for (let t = 0; t < seconds && !s.over; t += step) tick(s, step);
  return s;
}

export function finish(s, ending = null) {
  s.over = true;
  s.ending = ending ?? chooseEnding(s);
  return s;
}

/** The ending matrix: the first line that is true about the world at the end of the day. */
export function chooseEnding(s) {
  const c = s.crowd;
  if (s.clash) return s.clash.live ? 'viral' : 'scuffle';
  if (c.parliament >= 8) return 'march';
  if (s.moment === 'roast') return 'roast';
  if (s.moment === 'singalong' && c.stage >= 12) return 'singalong';
  if (s.heat) return 'heat';
  if (s.scared) return 'ghost';
  if (s.biryaniRush && cpTotal(s) >= 15) return 'biryani';
  if (cpTotal(s) >= 15) return 'cpjam';
  if (s.minister === 'noshow') return 'noshow';
  if (s.speech === 'big') return 'packed';
  return 'quiet';
}

/** The three story levers, as the player sees them on the HUD and the ending card. */
export function levers(s) {
  const crowds = { stage: s.crowd.stage, cp: cpTotal(s), barricade: s.crowd.barricade, parliament: s.crowd.parliament };
  const location = Object.entries(crowds).sort((a, b) => b[1] - a[1])[0][0];
  const intensity = s.clash || s.march ? 'high'
    : s.speech === 'big' || s.minister || s.crowd.cpParty >= 4 || s.biryaniRush || s.heat ? 'rising' : 'calm';
  const policeAt = s.police.line ?? s.police.watch ?? (s.people.sharma.post === 'cp' ? 'cp' : 'barricade');
  return { crowds, location, intensity, policeAt, line: s.police.line, watch: s.police.watch };
}

const OWNERS = { key: 'iqbal', speaker: 'ravi', megaphone: 'dev', phone: 'zoya', water: 'sana' };

/**
 * Player actions. witnesses: ids of people who can see the player right now (the client checks sight lines).
 * Returns { ok, say? } so the client can give feedback.
 */
export function act(s, cmd) {
  if (s.over) return { ok: false };
  const pl = s.player;
  if (cmd.type === 'take') {
    const o = s.objects[cmd.object];
    if (!o || pl.carrying || !isFree(o)) return { ok: false };
    o.holder = 'player'; pl.carrying = cmd.object;
    if (cmd.object === 'speaker') o.on = false;
    const seen = new Set(cmd.witnesses || []);
    const owner = OWNERS[cmd.object];
    if (cmd.object === 'key' && seen.has('sharma')) {
      emit(s, 'detained', { link: 'detained' });
      finish(s, 'detained');
    } else if (cmd.object === 'key' && seen.has('iqbal')) {
      o.holder = 'hook'; Object.assign(o, SPOTS.keyHook); pl.carrying = null;
      emit(s, 'iqbal-reclaims', { link: 'owner-reclaims' });
    } else if (cmd.object === 'speaker' && seen.has('ravi')) {
      const r = s.people.ravi;
      o.holder = 'ravi'; r.carrying = 'speaker'; pl.carrying = null;
      emit(s, 'ravi-reclaims', { link: 'owner-reclaims' });
      r.mode = 'toStage'; goTo(r, SPOTS.raviStage);
    } else if (cmd.object === 'phone' && seen.has('zoya')) {
      o.holder = 'cart'; Object.assign(o, SPOTS.phoneCart); pl.carrying = null;
      emit(s, 'zoya-reclaims', { link: 'owner-reclaims' });
    } else if (cmd.object === 'megaphone' && seen.has('dev')) {
      o.holder = null; Object.assign(o, SPOTS.megStage); pl.carrying = null;
      emit(s, 'dev-reclaims', { link: 'owner-reclaims' });
    } else if (seen.has('sharma') && owner !== 'iqbal') emit(s, 'sharma-shrug');
    return { ok: true };
  }
  if (cmd.type === 'drop') {
    const id = pl.carrying;
    if (!id) return { ok: false };
    const o = s.objects[id];
    o.holder = null; o.x = cmd.x ?? pl.x; o.z = cmd.z ?? pl.z;
    if (id === 'speaker') o.on = true; // you switch it on when you put it down
    pl.carrying = null;
    if (id === 'water' && dist(o, SPOTS.sanaTent) < 4 && !s.waterOk) deliverWater(s);
    return { ok: true };
  }
  if (cmd.type === 'give') {
    const id = pl.carrying, p = s.people[cmd.to];
    if (!id || !p || p.hidden || p.carrying) return { ok: false };
    if (id === 'key' && cmd.to === 'iqbal') {
      pl.carrying = null;
      const q = p, k = s.objects.key;
      if (q.mode === 'search') { k.holder = 'iqbal'; emit(s, 'key-returned', { link: 'key-returned' }); q.mode = 'toBusWithKey'; goTo(q, SPOTS.busDoor); }
      else { k.holder = 'hook'; Object.assign(k, SPOTS.keyHook); }
      return { ok: true };
    }
    if (id === 'speaker' && cmd.to === 'ravi') {
      const sp = s.objects.speaker;
      pl.carrying = null; sp.holder = 'ravi'; p.carrying = 'speaker';
      emit(s, 'ravi-finds');
      p.mode = 'toStage'; goTo(p, SPOTS.raviStage);
      return { ok: true };
    }
    if (id === 'phone' && cmd.to === 'zoya') {
      pl.carrying = null; s.objects.phone.holder = 'zoya'; p.carrying = 'phone';
      if (p.mode === 'search') { p.mode = 'chase'; p.target = null; s.timers.chase = 0; }
      emit(s, 'phone-returned', { link: 'phone-returned' });
      return { ok: true };
    }
    if (id === 'water' && cmd.to === 'sana') {
      pl.carrying = null; s.objects.water.holder = 'sana'; p.carrying = 'water'; p.mode = 'carry'; walkTo(p, SPOTS.sanaTent);
      return { ok: true };
    }
    if (id === 'megaphone' && ['dev', 'mira', 'kabir'].includes(cmd.to)) {
      pl.carrying = null; s.objects.megaphone.holder = cmd.to; p.carrying = 'megaphone';
      emit(s, `megaphone-to-${cmd.to}`, { link: cmd.to === 'dev' ? null : 'megaphone-given' });
      if (cmd.to === 'dev') { p.mode = 'stage'; goTo(p, SPOTS.devStage); }
      return { ok: true };
    }
    return { ok: false };
  }
  if (cmd.type === 'talk') {
    const p = s.people[cmd.to];
    if (!p || p.hidden) return { ok: false };
    if (cmd.to === 'nikhil' && p.mode === 'lost') { p.mode = 'follow'; emit(s, 'nikhil-follows'); }
    return { ok: true };
  }
  if (cmd.type === 'whisper') {
    const p = s.people[cmd.to], r = s.rumours[cmd.rumour];
    if (!p || !r || p.hidden || cmd.to === 'sharma') return { ok: false };
    if (r.dead) return { ok: true, say: 'already-dead' };
    learn(s, cmd.rumour, cmd.to);
    say(s, cmd.to, RUMOURS[cmd.rumour].reply[cmd.to] || RUMOURS[cmd.rumour].reply.default, { key: 'whisper' });
    return { ok: true };
  }
  return { ok: false };
}

/** Which talk line applies right now. */
export function talkState(s, who) {
  const p = s.people[who];
  if (who === 'ravi') {
    if (p.mode === 'search') return 'searching';
    if (p.mode === 'chaiBreak' || p.mode === 'toChai') return 'chai-break';
    if (s.t < at(10, 30)) return 'before-stage';
  }
  if (who === 'iqbal') {
    if (p.mode === 'drive') return 'driving';
    if (p.mode === 'search') return 'searching';
    if (p.mode === 'chai' || p.mode === 'toChai' || p.mode === 'toBus') return 'break';
  }
  if (who === 'sharma') {
    if (p.post === 'cp') return 'at-cp';
    if (s.t >= at(13, 0)) return 'afternoon';
  }
  if (who === 'mira') return s.speech ? 'after-speech' : 'before-speech';
  if (who === 'zoya') {
    if (p.mode === 'search') return 'searching';
    if (p.mode === 'charging' || p.mode === 'toCharge') return 'charging';
    if (s.stream.live) return 'live';
  }
  if (who === 'asha' && s.t < at(13, 0)) return 'morning';
  if (who === 'dev') {
    if (s.minister === 'waiting') return 'waiting';
    if (p.mode === 'chai') return 'chai';
    if (p.carrying !== 'megaphone' && s.t > at(14, 45)) return 'no-megaphone';
  }
  if (who === 'kabir' && s.nikhilFound) return 'with-nikhil';
  if (who === 'nikhil') {
    if (p.mode === 'lost') return 'lost';
    if (p.mode === 'follow' || p.mode === 'waitStage') return 'following';
    if (p.mode === 'withKabir') return 'found';
  }
  if (who === 'sana') {
    if (s.waterOk) return 'has-water';
    if (s.t >= at(13, 0)) return 'no-water';
  }
  if (who === 'meera' && s.crowd.cpParty >= 4) return 'party';
  return 'default';
}

/** Short tags describing the mood of the day, for ambient lines. */
export function moods(s) {
  const m = new Set();
  if (s.t < at(12, 0)) m.add('morning');
  if (s.speech === 'big') m.add('big-speech');
  if (s.speech === 'small') m.add('small-speech');
  if (s.crowd.cpParty >= 4) m.add('party');
  if (s.bus.stuck) m.add('stuck');
  if (cpTotal(s) >= 12) m.add('cp-full');
  if (s.stream.live) m.add('live');
  if (s.police.line) m.add('line');
  if (s.scared) m.add('scared');
  if (s.heat) m.add('heat');
  if (s.minister) m.add('minister');
  if (s.march) m.add('march');
  if (s.people.sharma.post === 'cp') m.add('sharma-cp');
  for (const [rid, r] of Object.entries(s.rumours)) if (!r.dead && Object.keys(r.places).length) m.add('rumour-' + rid);
  return m;
}

export function drainEvents(s) {
  return s.events.splice(0);
}
