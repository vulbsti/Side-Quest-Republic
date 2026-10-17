// The looping day: one world state, a few routines, and rules that collide.
// Pure module (no DOM, no Three.js) so the whole day can be played by tests.
// Every value here is either drawn on screen or read by a rule; nothing is decorative.
import { LINES } from './content.js';

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
  busCP: { x: 10, z: -34 },
  busJantar: { x: 10, z: 2 },
  busDoor: { x: 7.6, z: -31 },
  keyHook: { x: 8.55, z: -31 },
  stageTop: { x: 0, z: -14.5 },
  stageSpeaker: { x: 3.2, z: -10.4 },
  raviStage: { x: 5.6, z: -9.6 },
  barricade: { x: 40, z: -4.5 },
  cpPost: { x: 0, z: -29 },
  parliament: { x: 62, z: -4 },
  // Waypoints so walkers go round the observatory instead of through it.
  midway: { x: 18, z: -14 },
};

export const PLACES = {
  metro: { x: -7, z: 36, r: 14, name: 'Rajiv Chowk exit' },
  cp: { x: -2, z: -32, r: 15, name: 'CP shuttle stop' },
  stage: { x: 2, z: -5, r: 14, name: 'Jantar Mantar stage' },
  barricade: { x: 40, z: -4.5, r: 7, name: 'Barricade' },
  parliament: { x: 62, z: -4, r: 12, name: 'Parliament Street' },
};

const BUS = { speed: 3.6, dwellCP: 8, dwellJantar: 6, capacity: 14 };
const ARRIVAL_EVERY = 7;
const ARRIVALS_UNTIL = at(15, 0);
const WALK = 3.2;

export const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
export function placeAt(p) {
  for (const [id, pl] of Object.entries(PLACES)) if (dist(p, pl) <= pl.r) return id;
  return null;
}

function person(id, spot, extra = {}) {
  return { id, x: spot.x, z: spot.z, path: [], mode: 'idle', carrying: null, ...extra };
}

export function createDay() {
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
    },
    objects: {
      speaker: { holder: null, x: SPOTS.speakerChai.x, z: SPOTS.speakerChai.z, on: false },
      key: { holder: 'iqbal', x: SPOTS.busCP.x, z: SPOTS.busCP.z },
    },
    bus: { x: SPOTS.busCP.x, z: SPOTS.busCP.z, phase: 'cp', timer: BUS.dwellCP, load: 0, breakPending: false, stuck: false },
    crowd: { cpWaiting: 2, cpParty: 0, stage: 6, parliament: 0 },
    speech: null, // 'big' | 'small'
    march: false,
    timers: { arrival: 0, party: 0, speech: 0, march: 0, calm: 0 },
    fired: {}, // once-per-loop rule latches
    schedule: 0,
    events: [],
  };
}

// --- helpers -------------------------------------------------------------

function emit(s, key, { link = null, place = null, pos = null } = {}) {
  for (const [who, text] of LINES[key] || []) {
    const speaker = s.people[who];
    s.events.push({
      t: s.t, key, who, text, link,
      place: place ?? (speaker ? placeAt(speaker) : null),
      pos: pos ?? (speaker ? { x: speaker.x, z: speaker.z } : null),
    });
  }
  if (!LINES[key] && link) s.events.push({ t: s.t, key, who: 'street', text: '', link, place, pos });
}

function goTo(p, ...points) {
  p.path = points.map((q) => ({ x: q.x, z: q.z }));
}
const arrived = (p) => p.path.length === 0;

function objectPos(s, id) {
  const o = s.objects[id];
  if (o.holder === 'player') return s.player;
  if (o.holder && s.people[o.holder]) return s.people[o.holder];
  return o;
}
const onGround = (o) => o.holder === null;
const cpTotal = (s) => s.crowd.cpWaiting + s.crowd.cpParty;
const speakerAtStage = (s) => onGround(s.objects.speaker) && dist(s.objects.speaker, SPOTS.stageSpeaker) < 4;
const speakerPlayingAt = (s, place) => {
  const sp = s.objects.speaker;
  return onGround(sp) && sp.on && placeAt(sp) === place;
};

// --- routines (things that happen at a time of day) ----------------------

const SCHEDULE = [
  [at(10, 30), (s) => {
    const r = s.people.ravi, sp = s.objects.speaker;
    if (onGround(sp) && dist(sp, r) < 3.5) {
      sp.holder = 'ravi'; r.carrying = 'speaker'; r.mode = 'toStage';
      goTo(r, SPOTS.cpPost, SPOTS.raviStage);
    } else startRaviSearch(s);
  }],
  [at(11, 0), (s) => { s.bus.breakPending = true; }],
  [at(11, 15), (s) => {
    const r = s.people.ravi;
    if (r.mode === 'stage') { r.mode = 'toChai'; goTo(r, SPOTS.cpPost, SPOTS.raviChai); }
  }],
  [at(11, 30), (s) => endIqbalBreak(s)],
  [at(11, 40), (s) => {
    const r = s.people.ravi;
    if (r.mode === 'chaiBreak' || r.mode === 'toChai') { r.mode = 'backToStage'; goTo(r, SPOTS.cpPost, SPOTS.raviStage); }
  }],
  [at(12, 0), (s) => startSpeech(s)],
  [at(13, 30), (s) => { s.bus.breakPending = true; }],
  [at(14, 0), (s) => endIqbalBreak(s)],
];

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

function iqbalResume(s) {
  const q = s.people.iqbal, k = s.objects.key;
  k.holder = 'iqbal'; q.carrying = null;
  q.mode = 'drive'; q.hidden = true; q.path = [];
  Object.assign(q, s.bus);
  if (s.bus.stuck) { s.bus.stuck = false; s.fired['cp-piles-up'] = false; }
  s.bus.phase = 'cp'; s.bus.timer = 3;
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
  const { ravi: r, iqbal: q, sharma: sh, mira } = s.people;
  for (const p of [r, sh]) walk(p, dt);
  if (!q.hidden) walk(q, dt);
  if (s.timers.speech > 0) { s.timers.speech -= dt; if (s.timers.speech <= 0) mira.mode = 'stage'; }

  // Ravi
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

  // Iqbal
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

  // Sharma
  if (sh.mode === 'toPost' && arrived(sh)) sh.mode = 'post';
  if (sh.mode === 'toSpeaker' && arrived(sh)) {
    sh.mode = 'post';
    const sp = s.objects.speaker;
    if (onGround(sp) && sp.on && dist(sh, sp) < 3) {
      sp.on = false;
      emit(s, 'sharma-kills-party', { link: 'sharma-kills-party', place: 'cp' });
    }
  }

  // Carried objects follow their holder.
  for (const id of ['speaker', 'key']) {
    const o = s.objects[id];
    if (o.holder === 'hook') continue;
    const p = objectPos(s, id);
    if (p !== o) { o.x = p.x; o.z = p.z; }
  }
}

function placeSpeakerOnStage(s) {
  const r = s.people.ravi, sp = s.objects.speaker;
  sp.holder = null; r.carrying = null; sp.on = true;
  Object.assign(sp, SPOTS.stageSpeaker);
  r.mode = 'stage';
}

function updateBus(s, dt) {
  const b = s.bus;
  if (b.phase === 'parked') return;
  b.timer -= dt;
  if (b.phase === 'cp') {
    if (b.breakPending) { startIqbalBreak(s); return; }
    if (b.timer <= 0) {
      b.load = Math.min(BUS.capacity, s.crowd.cpWaiting);
      s.crowd.cpWaiting -= b.load;
      b.phase = 'toJantar';
    }
  } else if (b.phase === 'jantar') {
    if (b.timer <= 0) b.phase = 'toCP';
  } else {
    const target = b.phase === 'toJantar' ? SPOTS.busJantar : SPOTS.busCP;
    const d = target.z - b.z, step = BUS.speed * dt;
    if (Math.abs(d) <= step) {
      b.z = target.z;
      if (b.phase === 'toJantar') { s.crowd.stage += b.load; b.unloaded = b.load; b.load = 0; b.phase = 'jantar'; b.timer = BUS.dwellJantar; }
      else { b.phase = 'cp'; b.timer = BUS.dwellCP; }
    } else b.z += Math.sign(d) * step;
  }
  if (s.people.iqbal.hidden) Object.assign(s.people.iqbal, { x: b.x, z: b.z });
}

function updateCrowds(s, dt) {
  const c = s.crowd, T = s.timers;
  if (s.t < ARRIVALS_UNTIL) {
    T.arrival += dt;
    while (T.arrival >= ARRIVAL_EVERY) { T.arrival -= ARRIVAL_EVERY; c.cpWaiting++; }
  }
  // A playing speaker at CP pulls people in; without it they drift off.
  T.party += dt;
  if (speakerPlayingAt(s, 'cp')) {
    if (T.party >= 4) { T.party = 0; if (c.cpParty < 16) c.cpParty++; }
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
  if (s.march) {
    T.march += dt;
    while (T.march >= 1.6) { T.march -= 1.6; if (c.stage > 0) { c.stage--; c.parliament++; } }
  }
}

// --- rules: when [something visible], [someone] does [something visible] --

export const RULES = [
  {
    id: 'cp-party',
    says: 'cp-party', // what the player sees or hears when it fires
    repeat: true,
    when: (s) => speakerPlayingAt(s, 'cp') && s.crowd.cpParty >= 4,
    then: (s) => emit(s, 'cp-party', { link: 'cp-party', place: 'cp', pos: s.objects.speaker }),
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
    when: (s) => s.people.sharma.post === 'barricade' && cpTotal(s) >= 15,
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
    when: (s) => !s.march && s.speech === 'big' && s.t >= at(14, 0) && s.crowd.stage >= 16
      && dist(s.people.sharma, SPOTS.barricade) > 6,
    then: (s) => { s.march = true; emit(s, 'march', { link: 'march', place: 'stage', pos: PLACES.barricade }); },
  },
  {
    id: 'march-stop',
    says: 'march-stop',
    repeat: true,
    when: (s) => s.march && s.people.sharma.post === 'barricade' && dist(s.people.sharma, SPOTS.barricade) < 2,
    then: (s) => { s.march = false; emit(s, 'march-stop', { place: 'barricade' }); },
  },
];

function runRules(s, dt) {
  s.timers.calm = cpTotal(s) < 9 ? s.timers.calm + dt : 0;
  for (const rule of RULES) {
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
  runRules(s, dt);
  if (s.t >= at(17, 0)) finish(s);
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

export function chooseEnding(s) {
  const c = s.crowd;
  if (c.parliament >= 8) return 'march';
  if (cpTotal(s) >= 15) return 'cpjam';
  if (s.speech === 'big') return 'packed';
  return 'quiet';
}

/** What the player can see as the three levers of the story, for the HUD and the ending card. */
export function levers(s) {
  const c = s.crowd;
  const crowds = { stage: c.stage, cp: cpTotal(s), parliament: c.parliament };
  const location = Object.entries(crowds).sort((a, b) => b[1] - a[1])[0][0];
  return { crowds, location, intensity: s.march ? 'high' : s.speech === 'big' ? 'rising' : 'calm', policeAt: s.people.sharma.post };
}

/**
 * Player actions. witnesses: ids of people who can see the player right now (the client checks sight lines).
 * Returns { ok, say? } so the client can give feedback.
 */
export function act(s, cmd) {
  if (s.over) return { ok: false };
  const pl = s.player;
  if (cmd.type === 'take') {
    const o = s.objects[cmd.object];
    if (!o || pl.carrying || !(o.holder === null || o.holder === 'hook')) return { ok: false };
    o.holder = 'player'; pl.carrying = cmd.object;
    if (cmd.object === 'speaker') o.on = false;
    const seen = new Set(cmd.witnesses || []);
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
    } else if (cmd.object === 'speaker' && seen.has('sharma')) emit(s, 'sharma-shrug');
    return { ok: true };
  }
  if (cmd.type === 'drop') {
    const id = pl.carrying;
    if (!id) return { ok: false };
    const o = s.objects[id];
    o.holder = null; o.x = cmd.x ?? pl.x; o.z = cmd.z ?? pl.z;
    if (id === 'speaker') o.on = true; // you switch it on when you put it down
    pl.carrying = null;
    return { ok: true };
  }
  if (cmd.type === 'give') {
    const id = pl.carrying, p = s.people[cmd.to];
    if (!id || !p) return { ok: false };
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
    return { ok: false };
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
  if (who === 'sharma' && p.post === 'cp') return 'at-cp';
  if (who === 'mira') return s.speech ? 'after-speech' : 'before-speech';
  return 'default';
}

export function drainEvents(s) {
  return s.events.splice(0);
}
