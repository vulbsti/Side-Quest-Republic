// The looping protest day: one world state, routines for each person, rules that collide,
// and a director that turns the day into a showdown the player can bend.
// Pure module (no DOM, no Three.js) so the whole day can be played by tests.
// Every value here is either drawn on screen or read by a rule; nothing is decorative.
import { LINES, RUMOURS, PESTER, CALLBACKS, SHOWDOWNS, ROLES, ENDINGS, INTENTS, PROVOCATEUR_TELLS } from './content.js';
import { SCENES } from './scenes.js';
import { CAPTIONS } from './phone.js';

/** A caption for a clip kind: 'now' when posted, 'later' for the 17:00 repost. */
function caption(kind, when, n = 0) {
  const list = CAPTIONS[kind]?.[when];
  return list?.length ? list[n % list.length] : kind;
}

// --- clock -------------------------------------------------------------------
// Everything is written in clock time. SECONDS_PER_MINUTE is the tempo: 1.25 for the 10-minute
// slice, 4.0 for the owner's full day (?long). Set it with setTempo() before createDay().
export const TEMPO = { slice: 1.25, long: 4.0 };
export let SECONDS_PER_MINUTE = TEMPO.slice;
export function setTempo(spm) {
  SECONDS_PER_MINUTE = typeof spm === 'string' ? TEMPO[spm] : spm;
  return SECONDS_PER_MINUTE;
}
export const DAY_START = 10 * 60; // 10:00
export const DAY_END = 18 * 60; // 18:00
/** Real seconds into the loop at a clock time. */
export const at = (h, m = 0) => (h * 60 + m - DAY_START) * SECONDS_PER_MINUTE;
/** Real seconds that a number of clock minutes lasts. */
export const mins = (m) => m * SECONDS_PER_MINUTE;
export const clockMinutes = (t) => DAY_START + t / SECONDS_PER_MINUTE;
export const clockText = (t) => {
  const m = Math.floor(clockMinutes(t) + 1e-6);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};
// Rates (arrivals, crowd drift, viewers) were tuned at the slice tempo; this keeps them per clock minute.
const clockDt = (dt) => dt * (TEMPO.slice / SECONDS_PER_MINUTE);

export const PHASES = [
  ['morning', 10, 0], ['midday', 12, 0], ['tense', 14, 0], ['showdown', 16, 0], ['aftermath', 17, 0],
];
export function phaseAt(t) {
  let p = 'morning';
  for (const [id, h, m] of PHASES) if (t >= at(h, m) - 1e-9) p = id;
  return p;
}

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
  // The slice's new props.
  van: { x: 22, z: -9 }, // police van: the detention vehicle until the shuttle takes over at 14:00
  suv: { x: 15, z: 8 }, // where the RUP party's white SUV parks
  rafReserve: { x: 57, z: -9 }, // RAF stand behind the Parliament Street barricade
  cannonGarage: { x: 66, z: 6 }, // where the water cannon waits until it rolls
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
// Where each crowd stands (the client draws the crowd round these). Standing inside one hides you.
export const CROWD_CENTERS = {
  stage: { x: 0, z: -5.5, r: 5.5 }, cp: { x: 4.5, z: -31, r: 3.8 }, barricade: { x: 32.6, z: -3.2, r: 3.4 }, parliament: { x: 62, z: -4, r: 6 },
};

const BUS = { speed: 3.6, dwellCP: 8, dwellJantar: 6, capacity: 14 };
const ARRIVAL_EVERY = 7;
const WALK = 3.2;
const CHASE = 5.2; // a running constable: faster than a jog (4.7), slower than a sprint (8.1)
const LOSE_AFTER = 3; // seconds out of sight or inside a crowd to lose a chaser
const VIRAL = 4000;
const CROWD_PLACES = ['stage', 'cp', 'barricade', 'parliament'];
const BARRICADE_JAWAN = 'r1'; // the RAF jawan who stands at the barricade beside Sharma from 14:00
const FRIENDS = ['kabir', 'nikhil', 'mira', 'dev', 'zoya'];

export const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
export function placeAt(p) {
  for (const [id, pl] of Object.entries(PLACES)) if (dist(p, pl) <= pl.r) return id;
  return null;
}
const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

function person(id, spot, extra = {}) {
  return { id, x: spot.x, z: spot.z, path: [], mode: 'idle', carrying: null, ...extra };
}
function officer(id, kind, post, extra = {}) {
  return { id, kind, x: post.x, z: post.z, post: { ...post }, path: [], mode: 'post', mood: 'bored', pestered: [], ...extra };
}

export function createDay(opts = {}) {
  if (opts.tempo) setTempo(opts.tempo);
  const rumour = () => ({ people: {}, places: {}, dead: false, exposure: {}, meeraT: 0, zoyaT: 0 });
  return {
    t: 0,
    tempo: SECONDS_PER_MINUTE, // read by tick(), so a saved or long-tempo day keeps its clock
    phase: 'morning',
    over: false,
    ending: null, // the headline flavour (an ENDINGS id)
    outcome: null, // the structured ending card, see endingCard()
    player: {
      x: SPOTS.metro.x, z: SPOTS.metro.z, carrying: null,
      rep: { aura: 0, heat: 0, help: 0, nuisance: 0 },
      crew: [], detained: false, chasedBy: null, clips: [], stance: null, blocking: null, unseen: false,
    },
    people: {
      ravi: person('ravi', SPOTS.raviChai, { mode: 'chai' }),
      iqbal: person('iqbal', SPOTS.busCP, { mode: 'drive', hidden: true }),
      sharma: person('sharma', SPOTS.barricade, { mode: 'post', post: 'barricade', kind: 'constable', mood: 'bored', pestered: [] }),
      mira: person('mira', SPOTS.stageTop, { mode: 'stage' }),
      asha: person('asha', SPOTS.asha, { mode: 'stall' }),
      zoya: person('zoya', SPOTS.zoyaStart, { mode: 'idle', carrying: 'phone' }),
      meera: person('meera', SPOTS.meeraStart, { mode: 'film' }),
      kabir: person('kabir', SPOTS.kabirStart, { mode: 'away', hidden: true, mood: null }),
      nikhil: person('nikhil', SPOTS.nikhilStart, { mode: 'lost', wander: 0 }),
      dev: person('dev', SPOTS.devStage, { mode: 'stage', carrying: 'megaphone' }),
      sana: person('sana', SPOTS.sanaTent, { mode: 'tent', mood: null }),
    },
    // Generic constables spread along the walk so there is always an officer to pester; RAF join at 14:00.
    officers: {
      c1: officer('c1', 'constable', { x: -4, z: 16 }),
      c2: officer('c2', 'constable', { x: 2.5, z: -27 }),
      c3: officer('c3', 'constable', { x: 19, z: -11 }),
      c4: officer('c4', 'constable', { x: 7, z: 1 }),
      c5: officer('c5', 'constable', { x: 57, z: -1 }), // Parliament Street, before the RAF arrive
    },
    objects: {
      speaker: { holder: null, x: SPOTS.speakerChai.x, z: SPOTS.speakerChai.z, on: false },
      key: { holder: 'iqbal', x: SPOTS.busCP.x, z: SPOTS.busCP.z },
      megaphone: { holder: 'dev', x: SPOTS.devStage.x, z: SPOTS.devStage.z },
      phone: { holder: 'zoya', x: SPOTS.zoyaStart.x, z: SPOTS.zoyaStart.z },
      water: { holder: null, x: SPOTS.waterCP.x, z: SPOTS.waterCP.z },
    },
    bus: { x: SPOTS.busCP.x, z: SPOTS.busCP.z, phase: 'cp', timer: BUS.dwellCP, load: 0, breakPending: false, stuck: false, detention: false, stalled: false, crewBlocked: false },
    crowd: { cpWaiting: 2, cpParty: 0, stage: 6, parliament: 0, barricade: 0 },
    groups: {
      students: { kind: 'students', place: 'stage', size: 8, mood: 'chill' },
      party: { kind: 'party', place: null, size: 0, mood: 'away', suv: null },
      sena: { kind: 'sena', place: null, size: 0, mood: 'away' },
      opp: { kind: 'opp', place: null, size: 0, mood: 'away' },
    },
    crew: {}, // generic students following the player: { id, x, z, path, mode: 'follow'|'block' }
    provocateurs: [],
    detention: { vehicle: 'van', x: SPOTS.van.x, z: SPOTS.van.z, people: [], count: 0, since: null, escapeAt: null },
    rumours: Object.fromEntries(Object.keys(RUMOURS).map((id) => [id, rumour()])),
    stream: { viewers: 0, live: false, place: null, viral: false },
    police: { watch: null, line: null, barricades: [], raf: 0, cannon: null, gas: null, charge: null, stone: null },
    director: { intensity: 0, band: 'calm', hotspot: 'stage', target: 'crowd', stance: 'scatter', chargeAt: null, why: [] },
    scene: null,
    clips: [], // every clip posted today, by anyone: { id, kind, caption, place, t, by }
    recent: [], // things that just happened and can be filmed: { kind, place, x, z, t }
    callbacks: [], // { key, t (cause), at (effect), data }
    memo: {}, // when the player first did something a later rule calls back to
    flags: {},
    showdown: null, // snapshot of the director when the charge starts (or the sit-in at 17:00)
    snap: null, // crowd snapshot for the headline flavour
    peak: { parliament: 0, stageLate: 0 },
    speech: null, // 'big' | 'small'
    march: false,
    minister: null, // null | 'waiting' | 'noshow'
    waterOk: false,
    heat: false, // heat stroke at the stage (not the player's heat; that is player.rep.heat)
    scared: false,
    biryaniRush: 0,
    nikhilFound: false,
    kabirStays: false,
    moment: null, // what happened with the megaphone at 15:30: 'singalong' | 'roast' | null
    roastViral: false,
    clash: null, // { place, live, t, over }
    timers: { arrival: 0, party: 0, speech: 0, march: 0, calm: 0, chase: 0, push: 0, line: 0, leave: 0, lose: 0, block: 0 },
    fired: {}, // rule latches
    seq: { crew: 0 }, // id counters live in the day, so two days in one process never share them
    schedule: 0,
    events: [],
    cues: [],
  };
}

// --- helpers -------------------------------------------------------------

const KIND_OF = { wireless: 'wireless', feed: 'feed', stream: 'stream', chat: 'chat', ticker: 'ticker' };
function where(s, who) {
  if (who === 'player') return { place: placeAt(s.player), pos: { x: s.player.x, z: s.player.z } };
  const p = s.people[who] || s.officers[who];
  return p ? { place: placeAt(p), pos: { x: p.x, z: p.z } } : { place: null, pos: null };
}
function emit(s, key, { link = null, place = null, pos = null } = {}) {
  for (const [who, text] of LINES[key] || []) say(s, who, text, { key, link, place, pos });
  if (!LINES[key] && link) s.events.push({ t: s.t, key, who: 'street', text: '', link, place, pos, kind: 'line' });
}
/** One line of text from someone (a person or officer id, 'player', 'wireless', 'street', 'feed', 'chat' or 'stream'). */
function say(s, who, text, { key = null, link = null, place = null, pos = null, kind = null } = {}) {
  const w = where(s, who);
  s.events.push({ t: s.t, key, who, text, link, place: place ?? w.place, pos: pos ?? w.pos, kind: kind ?? KIND_OF[who] ?? 'line' });
}
function cue(s, name, { place = null, pos = null, data = null } = {}) {
  s.cues.push({ cue: name, t: s.t, place, pos: pos ? { x: pos.x, z: pos.z } : place && PLACES[place] ? { x: PLACES[place].x, z: PLACES[place].z } : null, data });
}
const rep = (s) => s.player.rep;
function addRep(s, d = {}) {
  const r = rep(s);
  for (const k of ['aura', 'heat', 'help', 'nuisance']) if (d[k]) r[k] = clamp(r[k] + d[k]);
}
/** Remember the first time the player did something a later rule can call back to. */
function memo(s, key, data = null) {
  if (!(key in s.memo)) s.memo[key] = { t: s.t, data };
  return s.memo[key];
}
/** A named consequence for the ending card: "because you did X at t, Y happened at now". */
function callback(s, key, causeKey = null, data = {}) {
  if (s.callbacks.some((c) => c.key === key)) return;
  const cause = causeKey ? s.memo[causeKey] : null;
  if (causeKey && !cause) return;
  s.callbacks.push({ key, t: cause ? cause.t : s.t, at: s.t, data: { ...(cause?.data || {}), ...data } });
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
function crowdTake(s, place, n) {
  const c = s.crowd;
  n = Math.max(0, Math.min(n, crowdAt(s, place)));
  if (place === 'cp') { const a = Math.min(n, c.cpWaiting); c.cpWaiting -= a; c.cpParty -= n - a; } else c[place] -= n;
  return n;
}
function crowdAdd(s, place, n) {
  if (place === 'cp') s.crowd.cpWaiting += n; else if (place in s.crowd) s.crowd[place] += n; else s.crowd.stage += n;
}
const studentTotal = (s) => CROWD_PLACES.reduce((n, p) => n + crowdAt(s, p), 0);
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
const nearPlace = (p, place, extra = 4) => dist(p, PLACES[place]) <= PLACES[place].r + extra;
/** Inside a crowd of six or more: chasers lose you there. */
export function inCrowd(s, p) {
  return CROWD_PLACES.some((pl) => crowdAt(s, pl) >= 6 && dist(p, CROWD_CENTERS[pl]) <= CROWD_CENTERS[pl].r + 1);
}
/** Sharma or any constable/RAF jawan, by id. */
export function officerById(s, id) {
  if (id === 'raf') id = BARRICADE_JAWAN; // scenes call the jawan at the barricade 'raf'
  return id === 'sharma' ? s.people.sharma : s.officers[id] || null;
}
const allOfficers = (s) => [s.people.sharma, ...Object.values(s.officers)];
const isOfficer = (s, id) => !!officerById(s, id);
/** Where the detention vehicle's door is: the police van until the shuttle becomes the detention bus. */
export function detentionPos(s) {
  const b = s.bus;
  if (b.detention && (b.phase === 'detention' || b.phase === 'parked')) return { x: b.x - 2.4, z: b.z + 3 };
  return { x: SPOTS.van.x, z: SPOTS.van.z };
}
const ppos = (s) => (s.player.detained ? detentionPos(s) : s.player);

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
function offset(p, dx = 0, dz = 0) { return { x: p.x + dx, z: p.z + dz }; }

// --- happenings and clips --------------------------------------------------
// Anything worth filming is a "happening" for a few clock minutes. Meera or Zoya post it if they are close;
// big set pieces get posted by the world (some page somewhere); the player can film anything within 12 m.
const WORLD_KINDS = new Set(['caught', 'stone-thrown', 'cannon-spray', 'cannon-dance', 'gas', 'charge', 'minister-noshow', 'heat', 'biryani-rush', 'cannon-scare']);
const ILLEGAL_KINDS = new Set(['bus-key', 'bus-stalled', 'detainees-escape', 'chase', 'crew-block', 'provocateur-joined', 'stone-thrown']);
function happen(s, kind, pos = null, place = null) {
  const p = pos || (place && PLACES[place]) || ppos(s);
  const h = { kind, place: place ?? placeAt(p), x: p.x, z: p.z, t: s.t };
  s.recent.push(h);
  s.recent = s.recent.filter((r) => s.t - r.t <= mins(12));
  const meera = s.people.meera, zoya = s.people.zoya;
  if (!meera.hidden && dist(meera, h) <= 15 && meera.mode !== 'detained') postClip(s, h, 'meera');
  else if (s.stream.live && dist(zoya, h) <= 15) postClip(s, h, 'zoya');
  else if (WORLD_KINDS.has(kind)) postClip(s, h, 'world');
  return h;
}
const caption_ = (kind, n) => caption(kind, 'now', n);
function postClip(s, h, by, text = null) {
  if (by !== 'player' && s.clips.some((c) => c.kind === h.kind && c.by === by)) return null;
  const clip = { id: `clip${s.clips.length + 1}`, kind: h.kind, caption: text ?? caption_(h.kind, s.clips.length), place: h.place, t: s.t, by };
  s.clips.push(clip);
  if (by === 'player') s.player.clips.push(clip);
  say(s, 'feed', `${by === 'player' ? 'You' : by === 'world' ? 'jantar.ki.awaaz' : by === 'meera' ? 'Meera' : 'Zoya Live'}: ${clip.caption}`, { key: 'clip', place: h.place, kind: 'feed' });
  cue(s, 'clip-posted', { place: h.place, pos: h, data: { clip } });
  return clip;
}

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
function spreadRumours(s, dt, cdt) {
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
    if (r.people.meera) r.meeraT += cdt;
    if (r.people.zoya && s.people.zoya.carrying === 'phone') r.zoyaT += cdt;
  }
}

// --- routines (things that happen at a time of day) ----------------------

const SCHEDULE = [
  [10, 20, (s) => { const z = s.people.zoya; z.mode = 'toFilm'; z.target = 'stage'; walkTo(z, FILM_SPOTS.stage); }],
  [10, 30, (s) => {
    const r = s.people.ravi, sp = s.objects.speaker;
    if (onGround(sp) && dist(sp, r) < 3.5) {
      sp.holder = 'ravi'; r.carrying = 'speaker'; r.mode = 'toStage';
      goTo(r, SPOTS.cpPost, SPOTS.raviStage);
    } else startRaviSearch(s);
  }],
  [11, 0, (s) => {
    s.bus.breakPending = true;
    const k = s.people.kabir;
    k.hidden = false; Object.assign(k, SPOTS.kabirStart); k.mode = 'toStage'; walkTo(k, SPOTS.kabirStage);
    const m = s.people.meera; m.target = 'cp'; walkTo(m, FILM_SPOTS.cp);
  }],
  [11, 15, (s) => {
    const r = s.people.ravi;
    if (r.mode === 'stage') { r.mode = 'toChai'; goTo(r, SPOTS.cpPost, SPOTS.raviChai); }
  }],
  [11, 30, (s) => endIqbalBreak(s)],
  [11, 40, (s) => {
    const r = s.people.ravi;
    if (r.mode === 'chaiBreak' || r.mode === 'toChai') { r.mode = 'backToStage'; goTo(r, SPOTS.cpPost, SPOTS.raviStage); }
  }],
  [12, 0, (s) => {
    startSpeech(s);
    const m = s.people.meera; m.target = 'stage'; walkTo(m, offset(FILM_SPOTS.stage, 2.2));
  }],
  [12, 30, (s) => {
    const z = s.people.zoya; if (z.mode === 'filming' || z.mode === 'toFilm') z.mode = 'chase';
    arrivalWave(s);
  }],
  [13, 0, (s) => {
    const z = s.people.zoya;
    if (z.carrying === 'phone' && z.mode !== 'search') { z.mode = 'toCharge'; walkTo(z, SPOTS.zoyaCharge); }
    const a = s.people.asha; a.mode = 'toStage'; walkTo(a, SPOTS.ashaStage);
    s.people.meera.mode = 'chase';
    if (!s.waterOk) emit(s, 'water-out', { link: null });
    oppArrives(s);
  }],
  [13, 20, (s) => {
    const z = s.people.zoya;
    if (z.mode !== 'charging' && z.mode !== 'toCharge') return;
    const ph = s.objects.phone;
    if (ph.holder === 'cart') { ph.holder = 'zoya'; z.carrying = 'phone'; z.mode = 'chase'; z.target = null; s.timers.chase = 0; }
    else { z.mode = 'search'; z.searchIndex = 0; emit(s, 'phone-missing', { link: 'phone-missing' }); }
  }],
  [13, 30, (s) => { s.bus.breakPending = true; }],
  [13, 40, (s) => { // Mummy calls. Kabir walks to the quiet end by the barricade to pick up.
    const k = s.people.kabir;
    if (k.hidden || s.nikhilFound || !['stage', 'toStage'].includes(k.mode) || !SCENES['mummy-call']) return;
    k.mode = 'onCall'; walkTo(k, { x: 33, z: -1.5 });
    emit(s, 'kabir-phone-rings', { pos: k });
  }],
  [13, 40, (s) => oppLeaves(s)],
  [14, 0, (s) => {
    endIqbalBreak(s);
    s.bus.detention = true;
    barricadesUp(s);
    const a = s.people.asha; a.mode = 'toStall'; walkTo(a, SPOTS.asha);
    const k = s.people.kabir;
    if (k.hidden || k.mode === 'detained') return;
    if (s.nikhilFound) emit(s, 'kabir-stays');
    else if (s.kabirStays) { emit(s, 'kabir-stays-mummy'); callback(s, 'mummy-kabir', 'mummy-call'); }
    else { k.mode = 'leaving'; walkTo(k, SPOTS.kabirStart); emit(s, 'kabir-leaves', { link: 'kabir-leaves' }); return; }
    if (k.mode === 'onCall') { k.mode = 'toStage'; walkTo(k, SPOTS.kabirStage); }
  }],
  [14, 15, (s) => {
    const d = s.people.dev, m = s.objects.megaphone;
    if (d.mode === 'detained') return;
    if (d.carrying === 'megaphone') { d.carrying = null; m.holder = null; Object.assign(m, SPOTS.megStage); emit(s, 'dev-chai'); }
    d.mode = 'toChai'; walkTo(d, SPOTS.devChai);
  }],
  [14, 20, (s) => officerBadDay(s)],
  [14, 30, (s) => dropProvocateurs(s)],
  [14, 45, (s) => { const d = s.people.dev; if (d.mode === 'chai' || d.mode === 'toChai') { d.mode = 'backForMeg'; walkTo(d, SPOTS.megStage); } }],
  [15, 0, (s) => { formPoliceLine(s); provocateursAct(s); }],
  [15, 30, (s) => megaphoneMoment(s)],
  [15, 40, (s) => cannonRolls(s)],
  [15, 45, (s) => { const c = s.police.cannon; if (c && c.state === 'rolling') c.state = 'parked'; }],
  [15, 50, (s) => cannonFires(s)],
  [16, 0, (s) => { tearGas(s); const c = s.police.cannon; if (c && (c.state === 'spraying' || c.state === 'dance')) c.state = 'parked'; }],
  [16, 0, (s) => { // Mummy knows the truth now: home by four.
    const k = s.people.kabir;
    if (!s.flags['kabir-curfew-16'] || k.hidden || k.mode === 'detained') return;
    k.mode = 'leaving'; walkTo(k, SPOTS.kabirStart); emit(s, 'kabir-curfew');
  }],
  [16, 30, (s) => { if (!s.snap) takeSnapshot(s); }],
  [17, 0, (s) => aftermath(s)],
  [17, 30, (s) => releaseEveryone(s)],
];

function runSchedule(s) {
  while (s.schedule < SCHEDULE.length && s.t >= at(SCHEDULE[s.schedule][0], SCHEDULE[s.schedule][1]) - 1e-9) {
    SCHEDULE[s.schedule][2](s);
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
  happen(s, big ? 'big-speech' : 'small-speech', SPOTS.stageTop, 'stage');
  if (big) callback(s, s.memo['speaker-returned'] ? 'speaker-speech' : 'world-speech', s.memo['speaker-returned'] ? 'speaker-returned' : null);
  else callback(s, 'speaker-flop', 'speaker');
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
  s.bus.stalled = false;
  s.bus.phase = 'cp'; s.bus.timer = 3;
}

/** The shuttle parks at the Jantar stop and becomes the detention bus. Iqbal hangs the key and goes for chai. */
function startDetentionBus(s) {
  const b = s.bus, q = s.people.iqbal, k = s.objects.key;
  b.phase = 'detention';
  k.holder = 'hook'; Object.assign(k, { x: b.x - 1.45, z: b.z + 3 });
  q.hidden = false; Object.assign(q, { x: b.x - 2.4, z: b.z + 3 }); q.mode = 'offDuty'; walkTo(q, SPOTS.chai);
  const g = s.officers.c4; g.post = { x: b.x - 3.2, z: b.z + 4.2 }; if (g.mode === 'post') { g.mode = 'toPost'; goTo(g, g.post); }
  emit(s, 'detention-bus', { place: 'stage', pos: b });
}

/** 15:00: Inspector Rao lines his men up wherever the camera is, or else at the biggest crowd. */
function formPoliceLine(s) {
  const place = s.police.watch ?? (s.heat ? 'stage' : biggestCrowd(s, ['stage', 'cp', 'barricade']));
  s.police.line = place;
  emit(s, `line-${place}`, { link: s.police.watch ? 'line-follows-camera' : 'police-line', place, pos: LINE_FRONT[place] });
  if (s.police.watch) callback(s, 'world-viral-line', null, { place });
  const sh = s.people.sharma;
  if (place === 'cp' && sh.post === 'cp') { sh.post = 'barricade'; sh.mode = 'toPost'; walkTo(sh, SPOTS.barricade); }
}

/** 15:30: whoever has the megaphone decides what the crowd at the stage hears. */
function megaphoneMoment(s) {
  const holder = s.objects.megaphone.holder;
  if (holder === 'mira' && !s.people.mira.hidden) {
    s.moment = 'singalong';
    emit(s, 'singalong', { link: 'mira-megaphone', place: 'stage', pos: SPOTS.stageTop });
    happen(s, 'singalong', SPOTS.stageTop, 'stage');
    callback(s, 'megaphone-mira', 'megaphone-mira');
    if (s.police.line === 'stage') { s.police.line = null; emit(s, 'line-withdraws', { link: 'singalong-line' }); }
  } else if (holder === 'kabir' && atPlace(s, 'kabir', 'stage')) {
    s.moment = 'roast';
    s.roastViral = s.stream.live && s.stream.place === 'stage';
    emit(s, 'roast', { link: 'kabir-roast', place: 'stage' });
    happen(s, 'roast', SPOTS.kabirStage, 'stage');
    cue(s, 'crowd-laugh', { place: 'stage' });
    callback(s, 'megaphone-kabir', 'megaphone-kabir');
    if (s.roastViral) emit(s, 'roast-viral', { link: 'roast-viral' });
  } else if (holder === 'player' || holder === null) {
    emit(s, 'dev-missing-meg');
  }
}

// --- the slice's set pieces --------------------------------------------------

/** 12:30: the RUP party's white SUV and the DRS on bikes arrive. */
function arrivalWave(s) {
  const g = s.groups;
  Object.assign(g.party, { place: 'stage', size: 6, mood: 'watching', suv: { ...SPOTS.suv } });
  const senaCalled = s.flags.senaCalled;
  Object.assign(g.sena, { place: senaCalled ? 'stage' : 'barricade', size: senaCalled ? 16 : 8, mood: senaCalled ? 'angry' : 'chanting' });
  cue(s, 'arrival-wave', { place: 'stage', data: { groups: ['party', 'sena'] } });
  cue(s, 'party-suv', { pos: SPOTS.suv, data: { group: 'party' } });
  cue(s, 'sena-bikes', { place: g.sena.place, data: { group: 'sena', angry: !!senaCalled } });
  emit(s, senaCalled ? 'arrival-wave-angry' : 'arrival-wave', { link: senaCalled ? 'sena-called' : null, place: 'stage' });
  if (senaCalled) callback(s, 'sena-rumour', 'rumour-sena');
}
/** 13:00: the LJM leader turns up for the cameras. With a camera at the stage, he grabs the mic. */
function oppArrives(s) {
  const o = s.groups.opp;
  Object.assign(o, { place: 'stage', size: 5, mood: 'posing' });
  cue(s, 'arrival-wave', { place: 'stage', data: { groups: ['opp'] } });
  const camera = (s.stream.live && s.stream.place === 'stage') || atPlace(s, 'meera', 'stage');
  if (camera && s.crowd.stage >= 10) {
    o.mood = 'on-stage';
    crowdTake(s, 'stage', 3);
    emit(s, 'opp-photo-op', { link: 'opp-photo-op', place: 'stage', pos: SPOTS.stageTop });
  } else emit(s, 'opp-no-camera', { place: 'stage' });
}
function oppLeaves(s) {
  const o = s.groups.opp;
  if (!o.place) return;
  Object.assign(o, { place: null, size: 0, mood: 'gone' });
  emit(s, 'opp-leaves', { place: 'stage' });
}
/** 14:00: barricades go up on the Sansad Marg approach and the RAF arrive behind them. */
function barricadesUp(s) {
  s.police.barricades = ['barricade', 'parliament'];
  s.police.raf = 6;
  for (let i = 0; i < 6; i++) {
    const post = i === 0 ? { x: SPOTS.barricade.x - 1.5, z: SPOTS.barricade.z - 2 } : { x: SPOTS.rafReserve.x - (i % 2) * 1.6, z: SPOTS.rafReserve.z + i * 1.4 };
    s.officers[`r${i + 1}`] = officer(`r${i + 1}`, 'raf', post);
  }
  cue(s, 'barricades-up', { place: 'parliament', data: { places: s.police.barricades } });
  cue(s, 'raf-arrive', { pos: SPOTS.rafReserve, data: { count: 6 } });
  emit(s, 'barricades-up', { place: 'parliament', pos: LINE_FRONT.parliament });
}
/** 14:20: real life is unfair. The officer nearest you has had a bad day and picks on you anyway. */
function officerBadDay(s) {
  if (s.player.detained) return;
  const p = ppos(s);
  const o = allOfficers(s).filter((x) => x.mode === 'post' || x.mode === 'toPost').sort((a, b) => dist(a, p) - dist(b, p))[0];
  if (!o || dist(o, p) > 15 || o.mood === 'soft') return; // a soft officer doesn't take it out on you
  o.mood = 'annoyed'; o.annoyedAt = s.t;
  addRep(s, { heat: 12 });
  say(s, o.id, LINES['officer-bad-day'][0][1], { key: 'officer-bad-day' });
  cue(s, 'awkward-silence', { pos: o, data: { who: o.id } });
}
/** 14:30: the SUV drops three men into the biggest crowd. */
function dropProvocateurs(s) {
  const place = biggestCrowd(s), c = CROWD_CENTERS[place];
  s.provocateurs = PROVOCATEUR_TELLS.map((tell, i) => ({
    id: `p${i + 1}`, tell, place, state: 'hidden', path: [],
    x: SPOTS.suv.x, z: SPOTS.suv.z, slot: { x: c.x + [-2, 1.8, 0.3][i], z: c.z + [1.5, 1.2, -2][i] },
  }));
  for (const p of s.provocateurs) walkTo(p, p.slot);
  s.groups.party.mood = 'plotting';
  cue(s, 'provocateur-drop', { pos: SPOTS.suv, data: { place, ids: s.provocateurs.map((p) => p.id) } });
  emit(s, 'provocateur-drop', { place, pos: SPOTS.suv });
}
function provocateursAct(s) {
  for (const p of s.provocateurs) if (p.state === 'hidden') { p.state = 'acting'; const f = LINE_FRONT[p.place]; goTo(p, offset(f, (p.x - f.x) * 0.2, (p.z - f.z) * 0.2 + 2)); }
  if (s.provocateurs.some((p) => p.state === 'acting')) emit(s, 'provocateurs-act', { place: s.provocateurs[0].place });
}
/** The first stone. Unhandled provocateurs throw it at 15:30 unless the stage is singing or laughing;
 *  one you joined throws it the moment a police line is in front of you. */
function throwStone(s, by, place) {
  s.police.stone = { place, t: s.t, by: by.id };
  const front = LINE_FRONT[place];
  cue(s, 'stone-thrown', { place, pos: front, data: { by: by.id } });
  cue(s, 'crowd-gasp', { place });
  emit(s, 'stone-thrown', { link: by.state === 'joined' ? 'joined-stone' : 'provocateur-stone', place, pos: front });
  happen(s, 'stone-thrown', front, place);
  if (by.state === 'joined') callback(s, 'joined-stone', 'joined');
  else if (by.kind === 'sena') callback(s, 'sena-stone', 'rumour-sena');
  else if (s.memo['saw-provocateur']) callback(s, 'saw-stone', 'saw-provocateur', { tell: by.tell });
  else callback(s, 'world-stone', null, { tell: by.tell });
}
function cannonRolls(s) {
  const place = s.director.hotspot, f = LINE_FRONT[place];
  s.police.cannon = { place, x: f.x + 4, z: f.z + 3, state: 'rolling' };
  cue(s, 'cannon-roll', { place, pos: s.police.cannon });
  emit(s, 'cannon-roll', { place, pos: f });
}
function cannonFires(s) {
  const c = s.police.cannon;
  if (!c) return;
  if (s.flags['cannon-requested']) {
    c.state = 'dance';
    // The spray is a party: students run over from the biggest crowd to dance in it (and stay for the sit-in).
    const from = biggestCrowd(s);
    if (from !== c.place) crowdAdd(s, c.place, crowdTake(s, from, Math.min(18, Math.floor(crowdAt(s, from) * 0.35))));
    cue(s, 'cannon-dance', { place: c.place, pos: c });
    cue(s, 'crowd-laugh', { place: c.place });
    emit(s, 'cannon-dance', { link: 'cannon-dance', place: c.place, pos: c });
    happen(s, 'cannon-dance', c, c.place);
    callback(s, 'cannon-dance', 'cannon-asked');
  } else if (s.director.intensity >= 40) {
    c.state = 'spraying';
    cue(s, 'cannon-spray', { place: c.place, pos: c });
    emit(s, 'cannon-spray', { place: c.place, pos: c });
    happen(s, 'cannon-spray', c, c.place);
    crowdTake(s, c.place, Math.floor(crowdAt(s, c.place) * 0.25));
  }
}
function tearGas(s) {
  if (s.director.intensity < 60) return;
  const place = s.director.hotspot, f = LINE_FRONT[place];
  s.police.gas = { place, x: f.x, z: f.z - 3, t: s.t };
  cue(s, 'gas-fired', { place, pos: s.police.gas });
  cue(s, 'crowd-gasp', { place });
  emit(s, 'gas-fired', { link: 'gas', place, pos: f });
  happen(s, 'gas', f, place);
  crowdTake(s, place, Math.floor(crowdAt(s, place) * 0.3));
}

/** Soft Sharma looks after you at the showdown, unless you burned it in a scene. */
const sharmaFavour = (s) => s.people.sharma.mood === 'soft' && !s.flags['sharma-done-with-you'];
/** The RAF jawan from Muzaffarpur opens a gali for you or your crew. */
const galiFavour = (s) => !!s.flags['raf-muzaffarpur'];

/** The lathi charge at the director's time and place. What it does depends on the stance there. */
function startCharge(s) {
  if (s.flags['name-in-register']) addRep(s, { heat: 15 }); // Rao has your name on paper now
  s.director = directorNow(s);
  const d = s.director, place = d.hotspot, front = LINE_FRONT[place];
  const pl = s.player, sh = s.people.sharma, soft = sharmaFavour(s), gali = galiFavour(s);
  takeSnapshot(s);
  s.police.charge = { place, t: s.t, targets: [d.target], stance: d.stance };
  s.showdown = { charge: true, place, t: s.t, intensity: d.intensity, band: d.band, target: d.target, stance: d.stance, chargeAt: s.t, playerDetained: pl.detained };
  for (const o of allOfficers(s)) if (o.kind === 'raf' || (o.id !== 'sharma' && o.mode !== 'chase' && o.id !== 'c4')) { o.mode = 'charge'; walkTo(o, front); }
  cue(s, 'charge-start', { place, pos: front, data: { target: d.target, stance: d.stance } });
  cue(s, 'crowd-gasp', { place });
  emit(s, `charge-${d.stance}`, { link: 'charge', place, pos: front });
  happen(s, 'charge', front, place);
  if (s.memo['crew-block'] && d.target === 'crew') callback(s, 'crew-target', 'crew-block');
  if (s.memo['missed-showdown'] && pl.detained) callback(s, 'missed-showdown', 'missed-showdown');
  // How many run and how many get dragged to the bus depends on what the protesters do.
  const RUN = { scatter: 0.7, hold: 0.2, block: 0.3, protect: 0.3 }, TAKEN = { scatter: 2, hold: 6, block: 8, protect: 2 };
  crowdTake(s, place, Math.floor(crowdAt(s, place) * RUN[d.stance]));
  s.detention.count += crowdTake(s, place, TAKEN[d.stance]);
  const here = (id) => !s.people[id].hidden && s.people[id].mode !== 'detained' && nearPlace(s.people[id], place, 6);
  const playerHere = !pl.detained && nearPlace(pl, place, 6);
  if (d.stance === 'protect' && playerHere) { addRep(s, { help: 10 }); memo(s, 'protect'); callback(s, 'protect', 'protect'); }
  let letThrough = null;
  // Who they go after.
  if (d.target === 'player' && !pl.detained && dist(pl, front) < 40) {
    if (gali) { letThrough = 'player'; callback(s, 'raf-gali', null); }
    else {
      const jawan = allOfficers(s).filter((o) => o.kind === 'raf' && o.mode !== 'chase').sort((a, b) => dist(a, pl) - dist(b, pl))[0] || s.officers.c3;
      Object.assign(jawan, { x: front.x, z: front.z });
      startChase(s, jawan.id, 'charge');
    }
  }
  if (d.target === 'crew' && pl.crew.length) {
    if (soft) { letThrough = 'crew'; callback(s, 'soft-lets-crew', 'sharma-soft'); }
    else if (gali) { letThrough = 'crew'; callback(s, 'raf-gali', null); }
    else if (d.stance !== 'protect') { s.detention.count += pl.crew.length; s.flags.crewDetained = true; disbandCrew(s, false); }
  }
  if (d.target === 'mira' && here('mira') && d.stance !== 'protect') {
    if (soft) { letThrough = 'mira'; callback(s, 'soft-lets-friend', 'sharma-soft', { who: 'Mira' }); } else detainPerson(s, 'mira');
  }
  if (d.target === 'stream' && here('zoya') && d.stance !== 'protect') detainPerson(s, 'zoya');
  // Friends caught in it: scattering separates them, holding gets them dragged off.
  if (d.stance === 'scatter') {
    const n = s.people.nikhil;
    if (here('nikhil')) { n.mode = 'lost'; walkTo(n, SPOTS.nikhilStart); s.flags.separated = true; emit(s, 'friends-separated', { place }); }
  } else if (d.stance !== 'protect' && here('kabir')) {
    if (soft && !letThrough) { letThrough = 'kabir'; callback(s, 'soft-lets-friend', 'sharma-soft', { who: 'Kabir' }); } else detainPerson(s, 'kabir');
  }
  if (soft && d.target !== 'player' && rep(s).heat >= 70) callback(s, 'soft-not-target', 'sharma-soft');
  if (letThrough) emit(s, letThrough === 'player' || (gali && letThrough === 'crew' && !soft) ? 'raf-gali' : 'sharma-lets-through', { link: 'sharma-lets-through', place, pos: sh });
  s.police.charge.letThrough = letThrough;
}
function endCharge(s) {
  const c = s.police.charge;
  c.over = true;
  for (const o of allOfficers(s)) if (o.mode === 'charge') sendHome(s, o);
  cue(s, 'charge-end', { place: c.place });
  emit(s, 'charge-end', { place: c.place });
}
function takeSnapshot(s) {
  s.snap = { cp: cpTotal(s), stage: s.crowd.stage, parliament: s.crowd.parliament, barricade: s.crowd.barricade, t: s.t };
}
/** 17:00: dusk. The detention bus loads whoever is still a target; your morning clip resurfaces. */
function aftermath(s) {
  emit(s, 'wind-down');
  const pl = s.player;
  if (!s.showdown) {
    const d = s.director;
    s.showdown = { charge: false, place: d.hotspot, t: s.t, intensity: d.intensity, band: d.band, target: d.target, stance: d.stance, chargeAt: null, playerDetained: pl.detained };
    if (!s.snap) takeSnapshot(s);
    emit(s, 'sitin', { link: 'sitin', place: d.hotspot });
    callback(s, 'world-sitin');
  }
  if (!pl.detained && rep(s).heat >= 70 && !sharmaFavour(s) && !inCrowd(s, pl)) {
    emit(s, 'bus-loads-you');
    detainPlayer(s, 'aftermath');
  }
  const morning = pl.clips.find((c) => c.t < at(12, 0));
  if (morning) {
    const later = caption(morning.kind, 'later', morning.t | 0);
    const h = { kind: morning.kind, place: morning.place, x: PLACES[morning.place || 'stage'].x, z: PLACES[morning.place || 'stage'].z };
    postClip(s, h, 'world', later);
    addRep(s, { heat: 10 });
    emit(s, 'repost', { link: 'repost' });
    memo(s, 'morning-clip', { kind: morning.kind });
    s.memo['morning-clip'].t = morning.t;
    callback(s, 'repost', 'morning-clip');
  }
  if (s.flags.separated && s.people.nikhil.mode === 'lost') say(s, 'chat', LINES['nikhil-where'][0][1], { key: 'nikhil-where' });
}
function releaseEveryone(s) {
  if (s.player.detained) releasePlayer(s, 'released-1730');
  if (s.detention.people.length || s.detention.count) releaseDetainees(s, 'released');
}

// --- detention ---------------------------------------------------------------

function detainPerson(s, id) {
  const p = s.people[id];
  if (!p || p.hidden || p.mode === 'detained') return;
  if (p.carrying) { const o = s.objects[p.carrying]; o.holder = null; Object.assign(o, { x: p.x, z: p.z }); p.carrying = null; }
  p.mode = 'detained'; p.hidden = true; p.path = [];
  Object.assign(p, detentionPos(s));
  s.detention.people.push(id);
}
function detainPlayer(s, why) {
  const pl = s.player;
  if (pl.detained) return;
  if (pl.chasedBy) { const c = officerById(s, pl.chasedBy); if (c) sendHome(s, c); pl.chasedBy = null; }
  if (pl.carrying) {
    const o = s.objects[pl.carrying];
    if (pl.carrying === 'key') { // the police hand the key back to the bus
      o.holder = 'hook';
      Object.assign(o, s.bus.detention && s.bus.phase === 'detention' ? { x: s.bus.x - 1.45, z: s.bus.z + 3 } : SPOTS.keyHook);
      if (s.people.iqbal.mode === 'search') { o.holder = 'iqbal'; s.people.iqbal.mode = 'toBusWithKey'; goTo(s.people.iqbal, SPOTS.busDoor); }
    } else { o.holder = null; Object.assign(o, detentionPos(s)); }
    pl.carrying = null;
  }
  disbandCrew(s, true);
  for (const p of s.provocateurs) if (p.state === 'joined') { p.state = 'acting'; goTo(p, p.slot); }
  pl.detained = true; pl.stance = null;
  if (s.police.charge && !s.police.charge.over && s.showdown) s.showdown.playerDetained = true; // taken in the charge
  s.detention.since = s.t;
  Object.assign(pl, detentionPos(s));
  memo(s, 'detained', { why });
  emit(s, `detained-${why}`, { link: 'detained', pos: detentionPos(s) });
}
function releasePlayer(s, key) {
  const pl = s.player;
  pl.detained = false;
  const d = detentionPos(s);
  Object.assign(pl, { x: d.x - 2, z: d.z + 1.5 });
  addRep(s, { heat: -15 });
  emit(s, key, { pos: d });
}
function releaseDetainees(s, how) {
  const d = detentionPos(s), was = s.detention.people.slice();
  for (const id of was) {
    const p = s.people[id];
    p.hidden = false; Object.assign(p, offset(d, -1, 1));
    if (id === 'kabir') { p.mode = 'toStage'; walkTo(p, SPOTS.kabirStage); }
    else if (id === 'nikhil') { p.mode = s.nikhilFound ? 'withKabir' : 'lost'; walkTo(p, s.nikhilFound ? offset(SPOTS.kabirStage, 1.4, 0.8) : SPOTS.nikhilStart); }
    else if (id === 'mira') { p.mode = 'stage'; goTo(p, SPOTS.stageTop); }
    else if (id === 'dev') { p.mode = 'stage'; walkTo(p, SPOTS.devStage); }
    else if (id === 'zoya') { p.mode = 'chase'; p.target = null; s.timers.chase = 0; }
  }
  crowdAdd(s, 'stage', s.detention.count);
  s.detention.people = []; s.detention.count = 0; s.detention.escapeAt = null;
  if (how === 'escape') {
    cue(s, 'detainees-escape', { pos: d, data: { people: was } });
    emit(s, 'detainees-escape', { link: 'detainees-escape', pos: d });
    happen(s, 'detainees-escape', d);
  } else emit(s, 'detainees-released', { pos: d });
}
const detainees = (s) => s.detention.people.length + s.detention.count;

// --- chases --------------------------------------------------------------

function startChase(s, id, why) {
  const pl = s.player, o = officerById(s, id);
  if (!o || pl.detained || pl.chasedBy) return;
  pl.chasedBy = id; o.mode = 'chase'; s.timers.lose = 0;
  s.memo.chase = { t: s.t, data: { why } }; // this chase, for the callback if it ends in a catch
  cue(s, 'chase-start', { pos: o, data: { by: id, why } });
  say(s, id, LINES['chase-start'][0][1], { key: 'chase-start', link: 'chase' });
  for (const [who, text] of LINES['chase-start'].slice(1)) say(s, who, text, { key: 'chase-start' });
  happen(s, 'chase', pl);
}
function sendHome(s, o) {
  if (o.id === 'sharma') { o.mode = 'toPost'; walkTo(o, o.post === 'cp' ? SPOTS.cpPost : SPOTS.barricade); return; }
  o.mode = 'toPost'; walkTo(o, o.post);
}
function updateChase(s, dt) {
  const pl = s.player;
  if (!pl.chasedBy) return;
  const c = officerById(s, pl.chasedBy);
  const crowded = inCrowd(s, pl);
  const crewNear = pl.crew.filter((id) => s.crew[id] && dist(s.crew[id], pl) < 4).length >= 3;
  const speed = CHASE * (crowded ? 0.45 : 1) * (crewNear ? 0.5 : 1); // the crowd parts slowly; your crew gets in the way
  c.path = [{ x: pl.x, z: pl.z }];
  walk(c, dt, speed);
  const d = dist(c, pl);
  if (d < 1.2) {
    cue(s, 'caught', { pos: pl, data: { by: c.id } });
    happen(s, 'caught', pl);
    callback(s, s.memo.chase.data.why === 'charge' ? 'caught-charge' : 'caught', 'chase');
    detainPlayer(s, 'caught');
    return;
  }
  const cover = pl.unseen || crowded || d > 24;
  s.timers.lose = cover ? s.timers.lose + dt : 0;
  if (s.timers.lose >= LOSE_AFTER) {
    pl.chasedBy = null;
    sendHome(s, c);
    cue(s, 'chase-lost', { pos: pl, data: { by: c.id, crowd: crowded } });
    emit(s, 'chase-lost', { link: 'chase-lost', pos: pl });
    addRep(s, { aura: 8 });
  }
}

// --- crew -------------------------------------------------------------------

function disbandCrew(s, back) {
  const pl = s.player, n = pl.crew.length;
  if (!n) return;
  if (back) crowdAdd(s, placeAt(pl) && CROWD_PLACES.includes(placeAt(pl)) ? placeAt(pl) : 'stage', n);
  pl.crew = []; s.crew = {}; pl.blocking = null; s.bus.crewBlocked = false;
}
/** Where the crew can sit and block: a police line, a barricade, or the shuttle lane. */
function blockSpot(s, p) {
  const fronts = new Set(['barricade', ...s.police.barricades]);
  if (s.police.line) fronts.add(s.police.line);
  for (const pl of fronts) if (dist(p, LINE_FRONT[pl]) < 6) return pl;
  if (Math.abs(p.x - SPOTS.busJantar.x) < 2.5 && p.z > SPOTS.busCP.z + 3 && p.z < SPOTS.busJantar.z - 3) return 'road';
  return null;
}
function updateCrew(s, dt) {
  const pl = s.player;
  if (!pl.crew.length) return;
  const spot = blockSpot(s, pl);
  if (!pl.blocking && spot && pl.crew.length >= 3) {
    s.timers.block += dt;
    if (s.timers.block >= 3) {
      pl.blocking = spot;
      if (spot === 'road') s.bus.crewBlocked = true;
      addRep(s, { heat: 20, aura: 6 });
      memo(s, 'crew-block', { place: spot });
      cue(s, 'crew-block', { pos: pl, data: { place: spot, size: pl.crew.length } });
      emit(s, 'crew-block', { link: 'crew-block', pos: pl });
      happen(s, 'crew-block', pl);
    }
  } else if (!spot) s.timers.block = 0;
  if (pl.blocking && (!spot || spot !== pl.blocking)) {
    const front = pl.blocking === 'road' ? null : LINE_FRONT[pl.blocking];
    if (!front || dist(pl, front) > 10) { pl.blocking = null; s.bus.crewBlocked = false; s.timers.block = 0; }
  }
  pl.crew.forEach((id, i) => {
    const m = s.crew[id], a = i * 2.4, r = 1.6 + (i % 3) * 0.6;
    m.mode = pl.blocking ? 'block' : 'follow';
    const want = { x: pl.x + Math.cos(a) * r, z: pl.z + Math.sin(a) * r };
    if (dist(m, want) > 0.6) goTo(m, want); else m.path = [];
    walk(m, dt, WALK * 1.6);
  });
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
  for (const p of Object.values(P)) if (!p.hidden && !(p.id === 'sharma' && p.mode === 'chase')) walk(p, dt, p.mode === 'follow' ? WALK * 1.25 : WALK);
  if (s.timers.speech > 0) { s.timers.speech -= dt; if (s.timers.speech <= 0 && P.mira.mode === 'speech') P.mira.mode = 'stage'; }
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

function updateOfficers(s, dt) {
  for (const o of Object.values(s.officers)) {
    if (o.mode === 'chase') continue;
    walk(o, dt, o.mode === 'charge' ? WALK * 1.5 : WALK);
    if (o.mode === 'toPost' && arrived(o)) o.mode = 'post';
  }
  // An annoyed officer cools off after half an hour.
  for (const o of allOfficers(s)) if (o.mood === 'annoyed' && s.t - (o.annoyedAt ?? 0) >= mins(30)) o.mood = 'bored';
}

function updateProvocateurs(s, dt) {
  const pl = s.player;
  for (const p of s.provocateurs) {
    if (p.state === 'gone') continue;
    if (p.state === 'joined') { const d = dist(p, pl); goTo(p, d > 2 ? { x: pl.x + (p.x - pl.x) * (1.6 / d), z: pl.z + (p.z - pl.z) * (1.6 / d) } : p); if (d <= 2) p.path = []; }
    walk(p, dt, p.state === 'exposed' || p.state === 'reported' ? WALK * 1.7 : WALK);
    if ((p.state === 'exposed' || p.state === 'reported') && arrived(p)) p.state = 'gone';
    if ((p.state === 'hidden' || p.state === 'acting') && !pl.detained && dist(p, pl) < 4) memo(s, 'saw-provocateur', { tell: p.tell });
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
  if (q.mode === 'offDuty' && arrived(q)) q.mode = 'chai';
  if (q.mode === 'toBus' && arrived(q)) {
    if (s.objects.key.holder === 'hook') iqbalResume(s);
    else {
      q.mode = 'search'; q.searchIndex = 0; s.bus.stuck = true; s.bus.stalled = true;
      emit(s, 'key-missing', { link: 'key-missing' });
      cue(s, 'bus-stalled', { pos: s.bus, data: { where: 'cp' } });
      happen(s, 'bus-stalled', s.bus, 'cp');
      callback(s, 'key-stall', 'key');
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
  if (sh.mode === 'chase') return;
  if (sh.mode === 'toPost' && arrived(sh)) sh.mode = 'post';
  if (sh.mode === 'toSpeaker' && arrived(sh)) {
    sh.mode = 'post';
    const sp = s.objects.speaker;
    if (onGround(sp) && sp.on && dist(sh, sp) < 3) {
      sp.on = false;
      emit(s, 'sharma-kills-party', { link: 'sharma-kills-party', place: 'cp' });
    }
  }
  if (sh.mode === 'escort' && arrived(sh)) { sh.mode = 'toPost'; walkTo(sh, sh.post === 'cp' ? SPOTS.cpPost : SPOTS.barricade); }
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
  const cdt = clockDt(dt);
  if (st.live) st.viewers += crowdAt(s, pl) * excitement(s, pl) * cdt;
  else st.viewers = Math.max(0, st.viewers - 15 * cdt);
  if (st.viral && st.live) s.police.watch = pl; // Rao watches whatever the stream shows
}

/** How much is happening at a place, as far as a live stream's viewers care. */
function excitement(s, place) {
  if (s.clash?.place === place && !s.clash.over) return 6;
  if (s.police.charge?.place === place && !s.police.charge.over) return 6;
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

function updateKabirNikhil(s) {
  const k = s.people.kabir, n = s.people.nikhil;
  if (k.mode === 'toStage' && arrived(k)) k.mode = 'stage';
  if (k.mode === 'leaving' && arrived(k)) { k.hidden = true; k.mode = 'away'; }
  if (n.mode === 'lost' && dist(n, s.player) < 4) n.path = []; // stands still while you're near enough to talk
  else if (n.mode === 'lost' && arrived(n)) {
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
    const again = s.nikhilFound;
    n.mode = 'withKabir'; s.nikhilFound = true;
    goTo(n, offset(SPOTS.kabirStage, 1.4, 0.8));
    emit(s, again ? 'nikhil-found-again' : 'nikhil-finds-kabir', { link: again ? null : 'nikhil-finds-kabir' });
    memo(s, 'nikhil', null);
    if (!again) addRep(s, { help: 15 });
    if (k.mode === 'leaving' || k.mode === 'away') { k.hidden = false; k.mode = 'toStage'; walkTo(k, SPOTS.kabirStage); }
  }
  if (n.mode === 'withKabir' && k.mode === 'stage' && dist(n, k) > 3 && arrived(n)) goTo(n, offset(SPOTS.kabirStage, 1.4, 0.8));
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
  if (b.phase === 'parked' || b.phase === 'detention') return;
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
    if (b.timer <= 0) { if (b.detention) startDetentionBus(s); else b.phase = 'toCP'; }
  } else {
    const target = b.phase === 'toJantar' ? SPOTS.busJantar : SPOTS.busCP;
    // The client sets blocked while the player stands in the lane ahead; crewBlocked is your crew sitting on the road.
    const d = target.z - b.z, step = b.blocked || b.crewBlocked ? 0 : BUS.speed * dt;
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

function updateCrowds(s, cdt) {
  const c = s.crowd, T = s.timers, line = s.police.line;
  if (s.t < at(15, 0) && line !== 'cp') {
    T.arrival += cdt;
    while (T.arrival >= ARRIVAL_EVERY) {
      T.arrival -= ARRIVAL_EVERY;
      // Once the shuttle is the detention bus, people walk up from CP instead of waiting for a ride.
      if (s.bus.phase === 'detention' && !cpFears(s) && line !== 'stage' && !s.scared) { c.stage++; if (c.cpWaiting > 0) { c.cpWaiting--; c.stage++; } }
      else c.cpWaiting++;
    }
  }
  // A playing speaker at CP pulls people in; without it they drift off. Meera filming it pulls in more.
  T.party += cdt;
  const meeraFilming = atPlace(s, 'meera', 'cp') && dist(s.people.meera, s.objects.speaker) < 9;
  if (speakerPlayingAt(s, 'cp') && line !== 'cp') {
    if (T.party >= (meeraFilming ? 2 : 4)) { T.party = 0; if (c.cpParty < (meeraFilming ? 22 : 16)) c.cpParty++; }
  } else if (T.party >= 3) { T.party = 0; if (c.cpParty > 0) c.cpParty--; }
  // Big speech keeps drawing people from the street.
  if (s.speech === 'big' && s.timers.speech > 0) {
    T.speechJoin = (T.speechJoin || 0) + cdt;
    while (T.speechJoin >= 2.5) { T.speechJoin -= 2.5; c.stage++; }
  }
  if (s.speech === 'small' && s.timers.speech > 0) {
    T.speechLeave = (T.speechLeave || 0) + cdt;
    while (T.speechLeave >= 4) { T.speechLeave -= 4; if (c.stage > 4) c.stage--; }
  }
  // The stage crowd walks to the barricade behind Dev while he waits for the minister.
  if (s.minister === 'waiting') {
    T.toBarricade = (T.toBarricade || 0) + cdt;
    while (T.toBarricade >= 2) { T.toBarricade -= 2; if (c.stage > 4 && c.barricade < 16) { c.stage--; c.barricade++; } }
  }
  if (s.minister === 'noshow' && !s.march && !s.clash) {
    T.leave += cdt;
    while (T.leave >= 3) { T.leave -= 3; if (c.barricade > 0) c.barricade--; }
  }
  if (s.moment === 'singalong' || s.moment === 'roast') {
    T.moment = (T.moment || 0) + cdt;
    while (T.moment >= 3) { T.moment -= 3; if (c.stage < 30) c.stage++; }
  }
  if (s.march) {
    T.march += cdt;
    while (T.march >= 1.6) {
      T.march -= 1.6;
      if (c.barricade > 0) { c.barricade--; c.parliament++; } else if (c.stage > 0) { c.stage--; c.parliament++; }
    }
  }
  // After 17:00 people head home, unless something is holding them.
  if (s.t >= at(17, 0) && !s.moment) {
    T.home = (T.home || 0) + cdt;
    while (T.home >= 6) { T.home -= 6; if (c.stage > 8) c.stage--; }
  }
  if (s.t < at(16, 30)) s.peak.parliament = Math.max(s.peak.parliament, c.parliament);
  if (s.t >= at(15, 30) && s.t < at(16, 30)) s.peak.stageLate = Math.max(s.peak.stageLate, c.stage);
}

// --- groups and the director ---------------------------------------------------

function updateGroups(s) {
  const st = s.groups.students, d = s.director;
  st.size = studentTotal(s);
  st.place = biggestCrowd(s);
  st.mood = s.police.gas || (s.police.charge && !s.police.charge.over) ? 'running'
    : s.moment === 'singalong' ? 'singing' : s.moment === 'roast' || s.police.cannon?.state === 'dance' ? 'laughing'
      : s.scared ? 'scared' : d.intensity >= 50 ? 'fired' : 'chill';
  const sena = s.groups.sena;
  // At 15:00 the DRS move to wherever the students are biggest, to counter-chant.
  if (sena.place && s.t >= at(15, 0) && sena.place !== d.hotspot && !s.police.charge) { sena.place = d.hotspot; if (sena.mood === 'chanting') sena.mood = 'countering'; }
}

/** The four director levers, recomputed from what is physically in the world. */
export function directorNow(s) {
  const why = [];
  const add = (label, n) => { if (n) why.push([label, Math.round(n)]); };
  const g = s.groups, pl = s.player, police = s.police;
  add('crowd', Math.min(20, studentTotal(s) / 2));
  if (g.party.place) add('RUP party workers', 5);
  if (g.sena.place) add('DRS on the street', g.sena.size / 2 + (g.sena.mood === 'angry' ? 10 : 0));
  for (const [rid, r] of Object.entries(s.rumours)) if (!r.dead && Object.keys(r.places).length) add(`rumour: ${rid}`, 5);
  add('provocateurs acting', 8 * s.provocateurs.filter((p) => p.state === 'acting').length);
  add('you joined a provocateur', 20 * s.provocateurs.filter((p) => p.state === 'joined').length);
  if (police.stone) add('a stone was thrown', 15);
  if (rep(s).heat >= 50) add('police are after you', 10);
  if (pl.blocking) add('your crew is blocking', 10);
  if (police.cannon?.state === 'spraying') add('water cannon spraying', 10);
  if (s.heat && !s.waterOk) add('people fainting, no water', 10);
  if (s.clash && !s.clash.over) add('scuffle at the barricade', 15);
  if (s.march) add('march on Parliament Street', 10);
  if (police.gas) add('tear gas', 10);
  if (s.flags['paani-chant']) add('"paani do" chant at the barricade', 8);
  if (s.flags['crowd-at-barricade']) add('crowd pressed up to the barricade', 7);
  if (s.speech === 'big') add("Mira's big speech", -10);
  if (s.moment === 'singalong') add('the stage is singing', -20);
  if (s.moment === 'roast') add('everyone is laughing at Rao', -10);
  if (police.cannon?.state === 'dance') add('kids dancing in the cannon spray', -20);
  if (s.provocateurs.some((p) => p.exposed)) add('provocateur exposed', -10);
  // Hotspot: a stone pulls it, then a blocking crew, then a viral camera, then the biggest crowd.
  let hotspot = biggestCrowd(s);
  if (s.stream.viral && police.watch) hotspot = police.watch;
  // The chant and the cannon you ordered pull it to the barricade.
  if (s.flags['cannon-to-barricade'] || s.flags['paani-chant'] || s.flags['crowd-at-barricade']) hotspot = 'barricade';
  if (pl.blocking) hotspot = pl.blocking === 'road' ? 'stage' : pl.blocking;
  if (police.stone) hotspot = police.stone.place;
  if (police.charge) hotspot = police.charge.place;
  if (s.stream.live && s.stream.place === hotspot) add('Zoya is live here', -10);
  const intensity = clamp(why.reduce((n, [, v]) => n + v, 0));
  // With your name in Rao's register they come for you sooner.
  const targetHeat = s.flags['name-in-register'] ? 55 : 70;
  const target = rep(s).heat >= targetHeat && !pl.detained && !sharmaFavour(s) ? 'player'
    : pl.blocking && pl.crew.length ? 'crew'
      : s.stream.viral && s.stream.live ? 'stream'
        : s.moment === 'singalong' && !s.people.mira.hidden ? 'mira' : 'crowd';
  const holder = s.objects.megaphone.holder;
  const playerThere = !pl.detained && nearPlace(pl, hotspot, 4);
  const stance = playerThere && (pl.stance || pl.crew.length) ? pl.stance || 'hold'
    : holder === 'mira' ? 'hold' : holder === 'kabir' ? 'scatter' : holder === 'dev' ? 'block'
      : holder === 'player' && playerThere ? pl.stance || 'hold' : 'scatter';
  let chargeAt = at(16, 30);
  if (intensity >= 70) chargeAt = at(16, 0);
  if (police.stone) chargeAt = Math.min(chargeAt, police.stone.t + mins(15));
  if (intensity < 25) chargeAt = null;
  if (police.charge) chargeAt = police.charge.t;
  return { intensity, band: intensityBand(intensity), hotspot, target, stance, chargeAt, why };
}
export function intensityBand(n) {
  return n < 25 ? 'calm' : n < 50 ? 'rising' : n < 70 ? 'high' : 'riot';
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
    then: (s) => { emit(s, 'cp-party', { link: 'cp-party', place: 'cp', pos: s.objects.speaker }); happen(s, 'speaker-party', s.objects.speaker, 'cp'); },
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
    when: (s) => s.people.sharma.post === 'barricade' && s.people.sharma.mode !== 'chase' && cpTotal(s) >= 15 && s.police.line !== 'cp',
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
    then: (s) => { s.rumours.cannon.dead = true; emit(s, 'kabir-laughs-off', { link: 'kabir-laughs-off', place: 'stage' }); cue(s, 'crowd-laugh', { place: 'stage' }); },
  },
  {
    id: 'cannon-scare',
    says: 'cannon-scare',
    when: (s) => s.rumours.cannon.places.stage && !s.rumours.cannon.dead,
    then: (s) => {
      const c = s.crowd, gone = Math.floor(c.stage * 0.6);
      c.stage -= gone; s.scared = gone;
      emit(s, 'cannon-scare', { link: 'cannon-scare', place: 'stage', pos: PLACES.stage });
      happen(s, 'cannon-scare', PLACES.stage, 'stage');
      callback(s, 'cannon-rumour', 'rumour-cannon');
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
      happen(s, 'biryani-rush', PLACES.stage, 'stage');
      placeLearns(s, 'biryani', 'cp'); // the rushers carry it with them
      callback(s, 'biryani-rumour', 'rumour-biryani');
    },
  },
  {
    id: 'asha-denies-biryani',
    says: 'asha-denies-biryani',
    when: (s) => s.biryaniRush > 0 && s.t >= s.timers.rush + mins(12) && atPlace(s, 'asha', 'cp'),
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
  ...rumourRules('sena'),
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
      callback(s, 'minister-rumour', 'rumour-minister');
    },
  },
  {
    id: 'minister-noshow',
    says: 'minister-noshow',
    when: (s) => s.minister === 'waiting' && s.t >= at(16, 0),
    then: (s) => { s.minister = 'noshow'; emit(s, 'minister-noshow', { link: null }); happen(s, 'minister-noshow', SPOTS.devBarricade, 'barricade'); },
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
      cue(s, 'faint', { pos: SPOTS.sanaTent });
      cue(s, 'ambulance', { pos: SPOTS.waterJantar });
      happen(s, 'heat', PLACES.stage, 'stage');
      happen(s, 'faint', SPOTS.sanaTent, 'stage');
      callback(s, 'water-hidden', 'water-hidden');
    },
  },
  {
    id: 'no-heat',
    says: 'no-heat',
    when: (s) => s.t >= at(14, 0) && s.waterOk && s.memo.water,
    then: (s) => { emit(s, 'no-heat'); callback(s, 'water-noheat', 'water'); },
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
    when: (s) => s.clash && !s.clash.over && s.t >= s.clash.t + mins(20),
    then: (s) => {
      s.clash.over = true;
      emit(s, 'clash-over');
      detainPerson(s, 'dev');
      s.detention.count += crowdTake(s, s.clash.place, 4);
    },
  },

  // The slice: the sena rumour, the provocateurs, the director's set pieces, detention.
  {
    id: 'sena-called',
    says: 'sena-called',
    when: (s) => s.rumours.sena.places.stage && !s.flags.senaCalled,
    then: (s) => {
      s.flags.senaCalled = true;
      const sena = s.groups.sena;
      if (sena.place) { Object.assign(sena, { place: 'stage', size: sena.size + 8, mood: 'angry' }); cue(s, 'sena-bikes', { place: 'stage', data: { group: 'sena', angry: true } }); emit(s, 'sena-called', { link: 'sena-called', place: 'stage' }); callback(s, 'sena-rumour', 'rumour-sena'); }
      else emit(s, 'sena-called-early', { place: 'stage' });
    },
  },
  {
    id: 'stone',
    says: 'stone-thrown',
    when: (s) => !s.police.stone && stoneThrower(s),
    then: (s) => {
      const by = stoneThrower(s);
      const place = by.state === 'joined' ? (CROWD_PLACES.includes(placeAt(s.player)) ? placeAt(s.player) : s.director.hotspot) : s.director.hotspot;
      throwStone(s, by, place);
    },
  },
  {
    id: 'singing-no-stone',
    says: 'singing-no-stone',
    when: (s) => s.t >= at(15, 30) && !s.police.stone && (s.moment === 'singalong' || s.moment === 'roast') && s.provocateurs.some((p) => p.state === 'acting' || p.state === 'hidden'),
    then: (s) => { for (const p of s.provocateurs) if (p.state === 'acting' || p.state === 'hidden') { p.state = 'gone'; p.path = []; Object.assign(p, SPOTS.suv); } emit(s, 'singing-no-stone', { link: 'singing-no-stone', place: 'stage' }); },
  },
  {
    id: 'charge',
    says: 'charge-hold',
    when: (s) => !s.police.charge && s.director.chargeAt != null && s.t >= s.director.chargeAt && s.t >= at(15, 0) && s.t < at(17, 0),
    then: (s) => startCharge(s),
  },
  {
    id: 'charge-end',
    says: 'charge-end',
    when: (s) => s.police.charge && !s.police.charge.over && s.t >= s.police.charge.t + mins(15),
    then: (s) => endCharge(s),
  },
  {
    id: 'detainees-escape',
    says: 'detainees-escape',
    repeat: true,
    when: (s) => s.bus.detention && s.detention.vehicle === 'bus' && detainees(s) > 0 && s.objects.key.holder !== 'hook' && s.objects.key.holder !== 'iqbal',
    then: (s) => { s.detention.escapeAt = s.t + mins(2); },
  },
  {
    id: 'escape-now',
    says: 'detainees-escape',
    repeat: true,
    when: (s) => s.detention.escapeAt != null && s.t >= s.detention.escapeAt && detainees(s) > 0 && !s.flags['back-door-shut'],
    then: (s) => {
      if (s.memo['key-detention']) { addRep(s, { help: 15 }); callback(s, 'key-escape', 'key-detention'); }
      releaseDetainees(s, 'escape');
    },
  },
  {
    id: 'friend-distracts',
    says: 'friend-distracts',
    repeat: true,
    when: (s) => s.player.detained && !s.flags['player-stays-detained'] && !s.scene && rep(s).help >= 30 && s.t >= s.detention.since + mins(8) && distractor(s),
    then: (s) => {
      const who = distractor(s);
      say(s, who, LINES['friend-distracts'].find(([w]) => w === who)?.[1] ?? LINES['friend-distracts'][0][1], { key: 'friend-distracts', link: 'friend-distracts' });
      callback(s, 'distraction', 'detained', { who: who[0].toUpperCase() + who.slice(1) });
      releasePlayer(s, 'released-distraction');
    },
  },
  {
    id: 'sana-short-one',
    says: 'sana-short-one',
    when: (s) => s.flags['sana-short-one'] && s.t >= at(15, 0) && s.crowd.stage >= 14,
    then: (s) => {
      emit(s, 'sana-short-one', { place: 'stage', pos: SPOTS.sanaTent });
      cue(s, 'faint', { pos: SPOTS.sanaTent });
      happen(s, 'faint', SPOTS.sanaTent, 'stage');
      callback(s, 'sana-short', null);
    },
  },
];

function stoneThrower(s) {
  const joined = s.provocateurs.find((p) => p.state === 'joined');
  if (joined && s.police.line && s.t >= at(15, 0)) return joined;
  if (s.t < at(15, 30) || s.moment === 'singalong' || s.moment === 'roast') return null;
  const p = s.provocateurs.find((x) => x.state === 'acting' || x.state === 'hidden' || x.state === 'joined');
  if (p) return p;
  const sena = s.groups.sena;
  if (sena.mood === 'angry' && sena.place === s.director.hotspot) return { id: 'sena', kind: 'sena', state: 'sena', tell: 'saffron scarf' };
  return null;
}
/** A friend who can make a scene outside the detention bus so you can slip out. */
function distractor(s) {
  for (const id of ['kabir', 'nikhil', 'sana', 'asha']) {
    const p = s.people[id];
    if (!p.hidden && p.mode !== 'detained' && (id !== 'nikhil' || s.nikhilFound)) return id;
  }
  return null;
}

function startClash(s, place) {
  s.clash = { place, live: s.stream.live && s.stream.place === place, t: s.t, over: false };
  s.police.line = place; // Rao sends the line to break it up
  const d = s.people.dev; d.mode = 'shouting'; walkTo(d, LINE_FRONT[place]);
  emit(s, s.clash.live ? 'clash-live' : 'clash', { link: s.clash.live ? 'clash-live' : 'dev-provokes', place, pos: LINE_FRONT[place] });
  s.crowd.barricade = Math.ceil(s.crowd.barricade / 2);
}

function runRules(s, cdt) {
  s.timers.calm = cpTotal(s) < 9 ? s.timers.calm + cdt : 0;
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
  if (s.tempo !== SECONDS_PER_MINUTE) setTempo(s.tempo); // a day keeps the tempo it was created with
  s.t += dt;
  const cdt = clockDt(dt);
  runSchedule(s);
  const phase = phaseAt(s.t);
  if (phase !== s.phase) { s.phase = phase; cue(s, 'phase', { data: phase }); }
  busLane(s);
  updateBus(s, dt);
  if (s.bus.detention && (s.bus.phase === 'detention' || s.bus.phase === 'parked')) s.detention.vehicle = 'bus';
  Object.assign(s.detention, detentionPos(s));
  updatePeople(s, dt);
  updateOfficers(s, dt);
  updateCrew(s, dt);
  updateProvocateurs(s, dt);
  updateChase(s, dt);
  if (s.player.detained) Object.assign(s.player, detentionPos(s));
  updateCrowds(s, cdt);
  spreadRumours(s, dt, cdt);
  s.director = directorNow(s);
  updateGroups(s);
  runRules(s, cdt);
  if (s.scene) { sceneBeats(s); if (s.t >= s.scene.until) endScene(s, null); }
  if (!s.over && s.t >= at(18, 0)) finish(s);
  return s;
}

/** A moving shuttle stops for the player standing 4-8 m ahead in its lane (it honks and waits). */
function busLane(s) {
  const b = s.bus, p = s.player;
  const moving = b.phase === 'toJantar' || b.phase === 'toCP';
  const dir = b.phase === 'toJantar' ? Math.sign(SPOTS.busJantar.z - b.z) : Math.sign(SPOTS.busCP.z - b.z);
  const ahead = (p.z - b.z) * dir;
  b.blocked = moving && Math.abs(p.x - b.x) < 2 && ahead > 4 && ahead < 8 && !p.detained;
}

// --- inputs, witnesses, affordances: the contract with the client and with verify/ -----------------
// The client may change the day only through setInputs() and act(). Everything else is the engine's.

/** Per-tick inputs from the client: where the player stands, and whether the chaser has lost sight of them
 *  (sight lines need the 3D world's walls, so the client works that out). Traces record exactly these. */
export function setInputs(s, { x, z, unseen } = {}) {
  if (x !== undefined) s.player.x = x;
  if (z !== undefined) s.player.z = z;
  if (unseen !== undefined) s.player.unseen = !!unseen;
  return s;
}

/** How far each watcher notices you taking something. Officers other than Sharma use `officer`. */
export const WITNESS_RANGE = { sharma: 14, iqbal: 9, ravi: 9, zoya: 8, dev: 8, officer: 12 };
/**
 * Who can see the player at pos. lineOfSight(id, entity) is the client's wall check; without one
 * (tests, verify/) everyone in range can see. The client and the checker share this one rule.
 */
export function witnesses(s, pos = s.player, lineOfSight = () => true) {
  const out = [];
  for (const [id, r] of Object.entries(WITNESS_RANGE)) {
    const p = s.people[id];
    if (!p || p.hidden || dist(p, pos) >= r) continue;
    if (lineOfSight(id, p)) out.push(id);
  }
  for (const o of Object.values(s.officers)) {
    if (o.hidden || dist(o, pos) >= WITNESS_RANGE.officer) continue;
    if (lineOfSight(o.id, o)) out.push(o.id);
  }
  return out;
}

/** Places worth walking to on purpose: standing somewhere is itself an action (the bus lane, a crowd, the line). */
export const WAYPOINTS = {
  metro: SPOTS.metro, chai: SPOTS.chai, busDoor: SPOTS.busDoor, keyHook: SPOTS.keyHook, waterCP: SPOTS.waterCP,
  ...Object.fromEntries(Object.entries(CROWD_CENTERS).map(([k, v]) => [`crowd:${k}`, v])),
  ...Object.fromEntries(Object.entries(LINE_FRONT).map(([k, v]) => [`line:${k}`, v])),
};

/**
 * Every command the player could try right now, wherever it is on the map: { id, kind, cmd, at }.
 * `at` is where to stand first (null: anywhere). This is a superset: act() stays the authority on what
 * succeeds, so preconditions are never written twice. knownRumours: rumours unlocked in earlier loops
 * (the client keeps that memory); default all.
 */
export function affordances(s, { knownRumours = Object.keys(RUMOURS), waypoints = true } = {}) {
  if (s.over) return [];
  const out = [];
  const add = (id, kind, cmd, at) => out.push({ id, kind, cmd, at: at ? { x: at.x, z: at.z } : null });
  const list = opportunities(s, s.player, Infinity);
  for (const o of list) {
    if (o.choices?.length) for (const [i, c] of o.choices.entries()) add(`${o.id}#${i}`, o.kind, c.cmd, o);
    else if (o.cmd) add(o.id, o.kind, o.cmd, o);
    if (o.kind === 'talk') for (const r of knownRumours) add(`whisper:${o.cmd.to}:${r}`, 'whisper', { type: 'whisper', to: o.cmd.to, rumour: r }, o);
  }
  if (s.player.carrying) add('drop', 'drop', { type: 'drop' }, null);
  if (!s.player.detained) add('film', 'film', { type: 'film' }, null);
  if (waypoints && !s.player.detained) for (const [id, p] of Object.entries(WAYPOINTS)) add(`go:${id}`, 'go', null, p);
  return out;
}

/** Fast-forward in fixed steps; used by tests and the "wait" action. */
export function advance(s, seconds, step = 0.1) {
  for (let t = 0; t < seconds - 1e-9 && !s.over; t += step) tick(s, step);
  return s;
}

export function finish(s, ending = null) {
  s.over = true;
  s.ending = ending ?? chooseEnding(s);
  s.outcome = endingCard(s);
  return s;
}

/** The headline flavour: the first line that is true about the world, from the crowds when the showdown began. */
export function chooseEnding(s) {
  const snap = s.snap || { cp: cpTotal(s), stage: s.crowd.stage, parliament: s.crowd.parliament };
  const parliament = Math.max(s.peak.parliament, snap.parliament);
  if (s.clash) return s.clash.live ? 'viral' : 'scuffle';
  if (parliament >= 8) return 'march';
  if (s.moment === 'roast') return 'roast';
  if (s.moment === 'singalong' && Math.max(snap.stage, s.peak.stageLate) >= 12) return 'singalong';
  if (s.heat) return 'heat';
  if (s.scared) return 'ghost';
  if (s.biryaniRush && snap.cp >= 15) return 'biryani';
  if (snap.cp >= 15) return 'cpjam';
  if (s.minister === 'noshow') return 'noshow';
  if (s.speech === 'big') return 'packed';
  return 'quiet';
}

/** The player's role in the showdown. */
export function playerRole(s) {
  const r = rep(s), sd = s.showdown, m = s.memo;
  if (s.player.detained || sd?.playerDetained) return 'detained';
  if (m.joined || r.heat >= 70 || r.nuisance >= 60) return 'instigator';
  if (sd?.charge && (m.protect || (s.player.crew.length && sd.stance === 'protect'))) return 'protector';
  if (m.exposed || m.reported || s.police.cannon?.state === 'dance' || m['megaphone-mira'] || (!sd?.charge && r.help >= 40)) return 'peacemaker';
  if (s.player.clips.length >= 3) return 'filmer';
  return 'spectator';
}

/** The ending card, built from the showdown, the player's role, and 3–5 named callbacks. */
export function endingCard(s) {
  const sd = s.showdown || { charge: false, place: s.director.hotspot, intensity: s.director.intensity, band: s.director.band, target: s.director.target, stance: s.director.stance, chargeAt: null, t: s.t };
  const outcome = !sd.charge ? 'sitin' : intensityBand(sd.intensity ?? 0) === 'riot' ? 'riot' : sd.stance;
  const role = playerRole(s);
  const fill = (text, d = {}) => text.replace(/\{(\w+)\}/g, (_, k) => (k === 'place' ? PLACES[d.place || sd.place]?.name ?? '' : k === 't' || k === 'at' ? clockText(d[k]) : d[k] ?? ''));
  const mine = s.callbacks.filter((c) => !c.key.startsWith('world-') && CALLBACKS[c.key]);
  const world = s.callbacks.filter((c) => c.key.startsWith('world-') && CALLBACKS[c.key]);
  const picked = [...mine.slice(0, 5), ...world].slice(0, Math.max(3, Math.min(5, mine.length)));
  return {
    outcome,
    title: SHOWDOWNS[outcome]?.title ?? outcome,
    text: fill(SHOWDOWNS[outcome]?.text ?? '', { place: sd.place, t: sd.t }),
    place: sd.place,
    intensity: Math.round(sd.intensity),
    band: sd.band,
    target: sd.target,
    stance: sd.stance,
    chargeAt: sd.chargeAt,
    chargeClock: sd.chargeAt != null ? clockText(sd.chargeAt) : null,
    role,
    roleTitle: ROLES[role]?.title ?? role,
    roleText: ROLES[role]?.text ?? '',
    flavour: s.ending,
    // A "no incidents" headline only fits a day that had none.
    headline: sd.charge && ['packed', 'quiet'].includes(s.ending) ? null : ENDINGS[s.ending]?.headline ?? null,
    callbacks: picked.map((c) => ({ key: c.key, t: c.t, at: c.at, text: fill(CALLBACKS[c.key], { ...c.data, t: c.t, at: c.at }) })),
    rep: { ...rep(s) },
    clips: s.player.clips.length,
  };
}

/** The three story levers, as the player sees them on the HUD and the ending card. */
export function levers(s) {
  const crowds = { stage: s.crowd.stage, cp: cpTotal(s), barricade: s.crowd.barricade, parliament: s.crowd.parliament };
  const location = Object.entries(crowds).sort((a, b) => b[1] - a[1])[0][0];
  const band = s.director.band;
  const intensity = band === 'high' || band === 'riot' || s.clash || s.march ? 'high'
    : band === 'rising' || s.speech === 'big' || s.minister || s.crowd.cpParty >= 4 || s.biryaniRush || s.heat ? 'rising' : 'calm';
  const policeAt = s.police.line ?? s.police.watch ?? (s.people.sharma.post === 'cp' ? 'cp' : 'barricade');
  return { crowds, location, intensity, policeAt, line: s.police.line, watch: s.police.watch, director: s.director };
}

const OWNERS = { key: 'iqbal', speaker: 'ravi', megaphone: 'dev', phone: 'zoya', water: 'sana' };
const REACH = 5; // how close you must be to an officer, a provocateur or a crowd to act on them
const MOODS = ['bored', 'amused', 'soft'];

/**
 * Player actions. witnesses: ids of people or officers who can see the player right now (the client checks sight lines).
 * Returns { ok, say? } so the client can give feedback.
 */
export function act(s, cmd) {
  if (s.over) return { ok: false };
  if (s.tempo !== SECONDS_PER_MINUTE) setTempo(s.tempo); // at() below must use this day's tempo, not the last one ticked
  const pl = s.player;
  // On the bus you can still talk your way out, play the scene, or film through the window.
  if (pl.detained && !['plead', 'scene', 'film'].includes(cmd.type)) return { ok: false, say: 'detained' };
  if (cmd.type === 'take') {
    const o = s.objects[cmd.object];
    if (!o || pl.carrying || !isFree(o)) return { ok: false };
    const fromDetentionBus = cmd.object === 'key' && s.bus.phase === 'detention' && o.holder === 'hook';
    o.holder = 'player'; pl.carrying = cmd.object;
    if (cmd.object === 'speaker') o.on = false;
    const seen = new Set(cmd.witnesses || []);
    const police = [...seen].filter((id) => isOfficer(s, id) && officerById(s, id).mode !== 'chase');
    const owner = OWNERS[cmd.object];
    if (cmd.object !== 'key') addRep(s, { nuisance: cmd.object === 'water' ? 0 : 8 });
    if (cmd.object === 'water' && !s.waterOk) memo(s, 'water-hidden');
    if (cmd.object === 'speaker') memo(s, 'speaker');
    if (cmd.object === 'key') {
      addRep(s, { aura: 12, heat: police.length ? 30 : 12, nuisance: 15 });
      memo(s, 'key');
      happen(s, 'bus-key', pl);
      if (fromDetentionBus) {
        memo(s, 'key-detention');
        s.bus.stalled = true;
        cue(s, 'bus-stalled', { pos: s.bus, data: { where: 'detention' } });
        emit(s, 'bus-stalled-detention', { link: 'detainees-escape', pos: s.bus });
        happen(s, 'bus-stalled', s.bus);
      }
    }
    if (cmd.object === 'key' && police.length) {
      const chaser = police.map((id) => officerById(s, id)).sort((a, b) => dist(a, pl) - dist(b, pl))[0];
      startChase(s, chaser.id, 'key');
    } else if (cmd.object === 'key' && seen.has('iqbal') && !fromDetentionBus) {
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
    if (id === 'water' && dist(o, SPOTS.sanaTent) < 4 && !s.waterOk) { memo(s, 'water'); addRep(s, { help: 20 }); deliverWater(s); }
    return { ok: true };
  }
  if (cmd.type === 'give') {
    const id = pl.carrying, p = s.people[cmd.to];
    if (!id || !p || p.hidden || p.carrying) return { ok: false };
    if (id === 'key' && cmd.to === 'iqbal') {
      pl.carrying = null;
      const q = p, k = s.objects.key;
      addRep(s, { help: 10 });
      if (q.mode === 'search') { k.holder = 'iqbal'; emit(s, 'key-returned', { link: 'key-returned' }); q.mode = 'toBusWithKey'; goTo(q, SPOTS.busDoor); }
      else { k.holder = 'hook'; Object.assign(k, s.bus.phase === 'detention' ? { x: s.bus.x - 1.45, z: s.bus.z + 3 } : SPOTS.keyHook); }
      return { ok: true };
    }
    if (id === 'speaker' && cmd.to === 'ravi') {
      const sp = s.objects.speaker;
      pl.carrying = null; sp.holder = 'ravi'; p.carrying = 'speaker';
      addRep(s, { help: 5 }); memo(s, 'speaker-returned');
      emit(s, 'ravi-finds');
      p.mode = 'toStage'; goTo(p, SPOTS.raviStage);
      return { ok: true };
    }
    if (id === 'phone' && cmd.to === 'zoya') {
      pl.carrying = null; s.objects.phone.holder = 'zoya'; p.carrying = 'phone';
      addRep(s, { help: 10 });
      if (p.mode === 'search') { p.mode = 'chase'; p.target = null; s.timers.chase = 0; }
      emit(s, 'phone-returned', { link: 'phone-returned' });
      return { ok: true };
    }
    if (id === 'water' && cmd.to === 'sana') {
      pl.carrying = null; s.objects.water.holder = 'sana'; p.carrying = 'water'; p.mode = 'carry'; walkTo(p, SPOTS.sanaTent);
      if (!s.waterOk) { memo(s, 'water'); addRep(s, { help: 20 }); }
      return { ok: true };
    }
    if (id === 'megaphone' && ['dev', 'mira', 'kabir'].includes(cmd.to)) {
      pl.carrying = null; s.objects.megaphone.holder = cmd.to; p.carrying = 'megaphone';
      emit(s, `megaphone-to-${cmd.to}`, { link: cmd.to === 'dev' ? null : 'megaphone-given' });
      if (cmd.to !== 'dev') memo(s, `megaphone-${cmd.to}`);
      if (cmd.to === 'dev') { p.mode = 'stage'; goTo(p, SPOTS.devStage); }
      return { ok: true };
    }
    return { ok: false };
  }
  if (cmd.type === 'talk') {
    const p = s.people[cmd.to];
    if (!p || p.hidden) return { ok: false };
    if (cmd.to === 'nikhil' && p.mode === 'lost') { p.mode = 'follow'; emit(s, s.nikhilFound ? 'nikhil-follows-again' : 'nikhil-follows'); }
    return { ok: true };
  }
  if (cmd.type === 'whisper') {
    const p = s.people[cmd.to], r = s.rumours[cmd.rumour];
    if (!p || !r || p.hidden || cmd.to === 'sharma') return { ok: false };
    if (r.dead) return { ok: true, say: 'already-dead' };
    learn(s, cmd.rumour, cmd.to);
    memo(s, `rumour-${cmd.rumour}`, { to: cmd.to });
    addRep(s, { nuisance: 8 });
    say(s, cmd.to, RUMOURS[cmd.rumour].reply[cmd.to] || RUMOURS[cmd.rumour].reply.default, { key: 'whisper' });
    return { ok: true };
  }
  if (cmd.type === 'pester') return pester(s, cmd);
  if (cmd.type === 'rally') return rally(s);
  if (cmd.type === 'stance') {
    if (!['hold', 'scatter', 'block', 'protect'].includes(cmd.stance)) return { ok: false };
    pl.stance = cmd.stance;
    emit(s, `stance-${cmd.stance}`, { pos: pl });
    return { ok: true };
  }
  if (cmd.type === 'film') return film(s);
  if (cmd.type === 'provocateur') return provocateur(s, cmd);
  if (cmd.type === 'plead') {
    if (!pl.detained) return { ok: false };
    if (rep(s).aura >= 50 && !s.flags['player-stays-detained']) { releasePlayer(s, 'plead-works'); return { ok: true }; }
    emit(s, 'plead-fails'); cue(s, 'awkward-silence', { pos: pl });
    return { ok: true, say: 'not-enough-aura' };
  }
  if (cmd.type === 'scene') return scene(s, cmd);
  return { ok: false };
}

// --- verbs -------------------------------------------------------------------

function pester(s, { to, how }) {
  const o = officerById(s, to), pl = s.player;
  if (!o || !['career', 'cute', 'cannon', 'detainme'].includes(how)) return { ok: false };
  if (dist(o, pl) > REACH || o.mode === 'chase' || o.mode === 'charge') return { ok: false, say: 'too-far' };
  // "Sir mujhe bhi detain kar lo" at the bus, with friends inside, is its own scene.
  if (how === 'detainme' && sceneAvailable(s, 'detain-me')) return scene(s, { id: 'detain-me' });
  if (how === 'cannon' && sceneAvailable(s, 'cannon-request') && to === 'sharma') return scene(s, { id: 'cannon-request' });
  say(s, 'player', PESTER.say[how], { key: `pester-${how}` });
  if (o.mood === 'annoyed') {
    addRep(s, { heat: 5 });
    say(s, o.id, PESTER.annoyed[o.pestered.length % PESTER.annoyed.length], { key: 'pester-annoyed' });
    cue(s, 'awkward-silence', { pos: o, data: { who: o.id } });
    return { ok: true, say: 'annoyed' };
  }
  o.pestered = o.pestered.filter((t) => s.t - t < mins(10));
  o.pestered.push(s.t);
  addRep(s, { nuisance: 2 });
  if (o.pestered.length >= 3) { // push the same officer three times in ten minutes and he's had enough
    o.mood = 'annoyed'; o.annoyedAt = s.t; o.pestered = [];
    addRep(s, { heat: 20 });
    say(s, o.id, PESTER.annoyed[0], { key: 'officer-annoyed', link: 'officer-annoyed' });
    cue(s, 'awkward-silence', { pos: o, data: { who: o.id } });
    return { ok: true, say: 'annoyed' };
  }
  // Scenes can leave an officer in a mood outside MOODS (the jawan goes 'tense'); count those as the bottom.
  o.mood = MOODS[Math.min(2, Math.max(0, MOODS.indexOf(o.mood)) + 1)];
  addRep(s, { aura: how === 'cannon' ? 12 : how === 'detainme' ? 8 : 10, heat: how === 'cannon' || how === 'detainme' ? 0 : 2 });
  const lines = PESTER[how][o.mood];
  say(s, o.id, lines[(o.kind === 'raf' ? 1 : 0) % lines.length], { key: `pester-${how}`, link: o.mood === 'soft' ? 'pester-soft' : null });
  cue(s, 'crowd-laugh', { pos: o, data: { who: o.id, how } });
  happen(s, `pester-${how}`, o);
  memo(s, `pester-${how}`, { who: o.id });
  if (o.id === 'sharma' && o.mood === 'soft') memo(s, 'sharma-soft', { how });
  if (how === 'cannon' && s.t < at(14, 0)) { s.flags['cannon-requested'] = true; memo(s, 'cannon-asked', { who: o.id }); }
  // Ask a hot-headed day to detain you and he might just oblige.
  if (how === 'detainme' && rep(s).heat >= 50) { detainPlayer(s, 'asked'); return { ok: true, say: 'obliged' }; }
  return { ok: true, mood: o.mood };
}

function rally(s) {
  const pl = s.player, place = placeAt(pl);
  if (!place || !CROWD_PLACES.includes(place) || crowdAt(s, place) < 4 || !nearPlace(pl, place, 0)) return { ok: false, say: 'no-crowd' };
  const r = rep(s);
  const need = s.flags['seen-as-chamcha'] ? 35 : 30; // filled a cop's bottle? the students saw
  if (r.aura < need) { emit(s, s.flags['seen-as-chamcha'] ? 'rally-chamcha' : 'rally-refused', { pos: pl }); return { ok: false, say: 'need-aura' }; }
  if (r.nuisance > r.aura) { emit(s, 'rally-cold', { pos: pl }); return { ok: false, say: 'too-much-nuisance' }; }
  const want = Math.min(8, Math.floor(r.aura / 12)) - pl.crew.length;
  const n = crowdTake(s, place, Math.max(0, Math.min(want, crowdAt(s, place) - 2)));
  if (!n) return { ok: false, say: 'crew-full' };
  for (let i = 0; i < n; i++) {
    s.seq ??= { crew: 0 }; // days saved before seq existed
    const id = `k${++s.seq.crew}`;
    const c = CROWD_CENTERS[place];
    s.crew[id] = { id, x: c.x + (i % 3) - 1, z: c.z + Math.floor(i / 3), path: [], mode: 'follow' };
    pl.crew.push(id);
  }
  addRep(s, { aura: 3 });
  memo(s, 'rally');
  cue(s, 'crew-join', { pos: pl, data: { ids: pl.crew.slice(), size: pl.crew.length } });
  emit(s, 'crew-join', { link: 'crew-join', pos: pl });
  return { ok: true, crew: pl.crew.length };
}

function film(s) {
  const pl = s.player;
  const done = new Set(pl.clips.map((c) => `${c.kind}@${c.place}`));
  const h = s.recent.filter((r) => s.t - r.t <= mins(10) && dist(r, pl) <= 12 && !done.has(`${r.kind}@${r.place}`)).sort((a, b) => b.t - a.t)[0];
  if (!h) return { ok: false, say: 'nothing-to-film' };
  const clip = postClip(s, h, 'player');
  addRep(s, { aura: 8, heat: ILLEGAL_KINDS.has(h.kind) ? 10 : 0 });
  memo(s, 'film', { kind: h.kind });
  return { ok: true, clip };
}

function provocateur(s, { id, how, to }) {
  const pl = s.player, p = s.provocateurs.find((x) => x.id === id);
  if (!p || !['hidden', 'acting'].includes(p.state) || dist(p, pl) > REACH) return { ok: false };
  if (how === 'join') {
    p.state = 'joined';
    addRep(s, { heat: 40, nuisance: 20, aura: 5 });
    memo(s, 'joined', { tell: p.tell });
    emit(s, 'provocateur-joined', { link: 'provocateur-joined', pos: p });
    happen(s, 'provocateur-joined', p);
    return { ok: true };
  }
  if (how === 'report') {
    const o = officerById(s, to);
    if (!o || dist(o, pl) > REACH + 3) return { ok: false, say: 'too-far' };
    if (to === 'sharma' && o.mood === 'soft') {
      p.state = 'reported'; goTo(p, SPOTS.suv);
      o.mode = 'escort'; walkTo(o, SPOTS.suv);
      addRep(s, { help: 15 });
      memo(s, 'reported', { tell: p.tell });
      emit(s, 'provocateur-reported', { link: 'provocateur-reported', pos: p });
      callback(s, 'report-soft', 'reported');
      return { ok: true };
    }
    memo(s, 'report-wrong', { who: to });
    emit(s, 'report-wrong', { link: 'report-wrong', pos: o });
    callback(s, 'report-wrong', 'report-wrong');
    detainPlayer(s, 'reported');
    return { ok: true, say: 'protected' };
  }
  if (how === 'expose') {
    const zoya = s.people.zoya;
    const camera = !pl.carrying || (s.stream.live && dist(zoya, pl) <= 12);
    if (!camera) return { ok: false, say: 'no-camera' };
    for (const q of s.provocateurs) if (['hidden', 'acting'].includes(q.state) && q.place === p.place) { q.state = 'exposed'; q.exposed = true; goTo(q, SPOTS.suv); }
    Object.assign(s.groups.party, { place: null, size: 0, mood: 'embarrassed' }); // the SUV picks its boys up and leaves
    addRep(s, { help: 20, aura: 10 });
    memo(s, 'exposed', { tell: p.tell });
    emit(s, 'provocateur-exposed', { link: 'provocateur-exposed', pos: p });
    cue(s, 'crowd-gasp', { pos: p });
    const h = happen(s, 'provocateur-exposed', p);
    if (!pl.clips.some((c) => c.kind === 'provocateur-exposed')) postClip(s, h, 'player');
    callback(s, 'expose', 'exposed');
    return { ok: true };
  }
  return { ok: false };
}

// --- scenes ------------------------------------------------------------------

/** When each ensemble scene can start (the engine owns triggers; the writer owns the words). */
function sceneAvailable(s, id) {
  if (!SCENES[id] || s.fired['scene:' + id] || s.scene || s.player.detained) return false;
  const pl = s.player, k = s.people.kabir, sh = s.people.sharma;
  // 13:40: Kabir's phone rings and he walks to the quiet end by the barricade, where Sharma stands.
  if (id === 'mummy-call') return s.t >= at(13, 40) && s.t < at(14, 0) && k.mode === 'onCall' && !k.hidden && dist(sh, k) <= 14 && dist(pl, k) <= 8;
  if (id === 'cannon-request') return s.t >= at(14, 0) && s.t < at(14, 45) && dist(pl, sh) <= 6 && guarded(s);
  if (id === 'detain-me') return s.t >= at(14, 0) && s.t < at(17, 30) && friendsInside(s) && dist(pl, detentionPos(s)) <= 7;
  return false;
}
const friendsInside = (s) => s.detention.people.some((id) => id === 'kabir' || id === 'nikhil') || (s.flags.crewDetained && s.detention.count > 0);
export const scenesAvailable = (s) => Object.keys(SCENES).filter((id) => sceneAvailable(s, id));

/** requires: { mood: {id: [moods]}, rep: {aura: min, ...}, flags: [all] }. 'water-delivered' is Sana having water. */
function meets(s, req = {}) {
  for (const [who, list] of Object.entries(req.mood || {})) { const o = officerById(s, who) || s.people[who]; if (!o || !list.includes(o.mood)) return false; }
  const r = rep(s), min = { ...(req.rep || {}) };
  for (const k of ['aura', 'help', 'heat', 'nuisance']) if (req[k] != null) min[k] = req[k];
  for (const [k, v] of Object.entries(min)) if (r[k] < v) return false;
  for (const f of req.flags || []) if (!(f === 'water-delivered' ? s.waterOk : s.flags[f])) return false;
  if (req.anyFlags?.length && !req.anyFlags.some((f) => s.flags[f])) return false;
  for (const f of req.notFlags || []) if (s.flags[f]) return false;
  return true;
}
const BEAT_SECONDS = 2.2; // the engine's guess at one beat, when the client doesn't report beats
const escapeBeat = (sc) => {
  const i = sc.beats.findIndex((b) => b.event === 'detainees-escape' || /bahar aa gaye/i.test(b.line || ''));
  return i < 0 ? null : i;
};
function scene(s, { id, option, beat }) {
  const sc = SCENES[id];
  if (!sc) return { ok: false };
  if (option == null && beat == null) {
    if (!sceneAvailable(s, id)) return { ok: false };
    s.fired['scene:' + id] = true;
    s.scene = { id, beat: 0, cast: sc.cast.slice(), options: sc.options.map((o, i) => ({ i, intent: o.intent, ok: meets(s, o.requires) })), t: s.t, until: s.t + sc.beats.length * BEAT_SECONDS + 30, escapeBeat: id === 'detain-me' ? escapeBeat(sc) : null, escaped: false };
    cue(s, 'scene-start', { pos: s.player, data: { id } });
    if (id === 'detain-me') {
      memo(s, 'detain-me');
      const sh = s.people.sharma;
      if (sh.mode !== 'chase') { sh.mode = 'escort'; walkTo(sh, offset(detentionPos(s), -1, 1)); }
      detainPlayer(s, 'asked-friends'); // "Andar."
    }
    return { ok: true, scene: s.scene };
  }
  if (!s.scene || s.scene.id !== id) return { ok: false };
  if (option == null) { s.scene.beat = Math.max(s.scene.beat, beat); sceneBeats(s); return { ok: true }; }
  const o = sc.options[option];
  if (!o || !meets(s, o.requires)) return { ok: false, say: 'requires' };
  s.scene.beat = sc.beats.length; sceneBeats(s); // the scene has played out by the time options are picked
  const e = o.effects || {};
  addRep(s, e);
  for (const [who, mood] of Object.entries(e.mood || {})) {
    const p = officerById(s, who) || s.people[who];
    if (!p) continue;
    p.mood = mood;
    if (who === 'sharma' && mood === 'soft') memo(s, 'sharma-soft', { how: id });
    if (mood === 'annoyed' && p.pestered) p.annoyedAt = s.t;
  }
  for (const f of e.flags || []) applySceneFlag(s, id, f);
  // The clip a friend posts; null means nothing worth posting.
  const kind = o.clip !== undefined ? o.clip : { 'mummy-call': 'mummy-call', 'cannon-request': 'pester-cannon', 'detain-me': 'detain-me' }[id];
  if (kind) happen(s, kind, s.player);
  endScene(s, option);
  return { ok: true };
}
function sceneBeats(s) {
  const sc = s.scene;
  if (!sc) return;
  sc.beat = Math.max(sc.beat, Math.floor((s.t - sc.t) / BEAT_SECONDS));
  // detain-me: at Nikhil's "hum bahar aa gaye" the friends are already out the back, before the options.
  if (sc.escapeBeat != null && !sc.escaped && sc.beat >= sc.escapeBeat) {
    sc.escaped = true;
    if (detainees(s)) { addRep(s, { help: 10 }); callback(s, 'detain-me', 'detain-me'); releaseDetainees(s, 'escape'); }
  }
}
function applySceneFlag(s, id, f) {
  s.flags[f] = true; // the client reads these for CHAT flag:<name> and CALLBACK_BARKS
  if (f === 'kabir-stays') { s.kabirStays = true; memo(s, 'mummy-call'); }
  if (f === 'kabir-leaves-at-14') s.kabirStays = false;
  if (f === 'cannon-requested') memo(s, 'cannon-asked', { who: 'sharma' });
  if (f === 'crowd-at-barricade') s.crowd.barricade += crowdTake(s, 'stage', Math.min(6, Math.max(0, s.crowd.stage - 4)));
  if (f === 'player-released' && s.player.detained) releasePlayer(s, 'detain-me-leave');
  if (f === 'missed-showdown') memo(s, 'missed-showdown');
  if (f === 'sharma-chasing-friends') {
    const sh = s.people.sharma, k = s.people.kabir, n = s.people.nikhil;
    const target = !k.hidden ? k : n;
    sh.mode = 'escort'; walkTo(sh, target);
    for (const p of [k, n]) if (!p.hidden && p.mode !== 'detained') { p.mode = p.id === 'kabir' ? 'leaving' : 'lost'; walkTo(p, SPOTS.kabirStart); }
    cue(s, 'chase-start', { pos: sh, data: { by: 'sharma', target: target.id } });
    emit(s, 'sharma-chases-friends', { pos: sh });
  }
}
function endScene(s, option) {
  if (!s.scene) return;
  if (option == null) { // nobody picked: the scene still plays out
    s.scene.beat = SCENES[s.scene.id].beats.length; sceneBeats(s);
    if (s.scene.id === 'detain-me' && s.player.detained) releasePlayer(s, 'detain-me-leave');
  }
  cue(s, 'scene-end', { pos: s.player, data: { id: s.scene.id, option } });
  s.scene = null;
}

// --- what the player can do right here ------------------------------------------

/**
 * Nearby things to do right now, nearest first: { id, kind, text, x, z, d, cmd, choices? }.
 * Always returns at least one: if nothing is within reach, the nearest live thing on the map.
 */
export function opportunities(s, pos = s.player, radius = 10) {
  const out = [], pl = s.player;
  const push = (id, kind, text, p, cmd, extra = {}) => out.push({ id, kind, text, x: p.x, z: p.z, d: dist(pos, p), cmd, ...extra });
  const I = (k, d = {}) => (INTENTS[k] || k).replace(/\{(\w+)\}/g, (_, x) => d[x] ?? '');
  if (s.over) return out;
  if (pl.detained) {
    const d = detentionPos(s);
    push('plead', 'plead', I(rep(s).aura >= 50 ? 'plead' : 'plead-weak'), d, { type: 'plead' });
    return out;
  }
  for (const id of scenesAvailable(s)) {
    const p = id === 'mummy-call' ? s.people.kabir : id === 'cannon-request' ? s.people.sharma : detentionPos(s);
    push(`scene:${id}`, 'scene', I(`scene-${id}`), p, { type: 'scene', id });
  }
  if (s.scene) push(`scene:${s.scene.id}`, 'scene-choice', I('scene-choose'), pl, null, { choices: s.scene.options.map((o) => ({ text: o.intent, ok: o.ok, cmd: { type: 'scene', id: s.scene.id, option: o.i } })) });
  if (pl.chasedBy) {
    const c = officerById(s, pl.chasedBy);
    const crowdPlace = CROWD_PLACES.filter((p) => crowdAt(s, p) >= 6).sort((a, b) => dist(pos, CROWD_CENTERS[a]) - dist(pos, CROWD_CENTERS[b]))[0];
    push('lose', 'chase', I('lose-him'), crowdPlace ? CROWD_CENTERS[crowdPlace] : { x: pos.x + (pos.x - c.x), z: pos.z + (pos.z - c.z) }, null);
  }
  for (const p of s.provocateurs) {
    if (!['hidden', 'acting'].includes(p.state)) continue;
    const near = allOfficers(s).filter((o) => dist(o, pos) <= REACH + 3).sort((a, b) => dist(a, pos) - dist(b, pos))[0];
    const choices = [
      { text: I('prov-expose', { tell: p.tell }), cmd: { type: 'provocateur', id: p.id, how: 'expose' } },
      { text: I('prov-join'), cmd: { type: 'provocateur', id: p.id, how: 'join' } },
    ];
    if (near) choices.push({ text: I('prov-report', { name: near.id === 'sharma' ? 'Sharma' : near.kind === 'raf' ? 'the RAF jawan' : 'the constable' }), cmd: { type: 'provocateur', id: p.id, how: 'report', to: near.id } });
    push(`prov:${p.id}`, 'provocateur', I('prov-notice', { tell: p.tell }), p, choices[0].cmd, { choices });
  }
  for (const o of allOfficers(s)) {
    if (o.mode === 'chase' || o.mode === 'charge' || (o.hidden)) continue;
    const name = o.id === 'sharma' ? 'Sharma' : o.kind === 'raf' ? 'the RAF jawan' : 'the constable';
    const choices = ['career', 'cute', 'cannon', 'detainme'].map((how) => ({ text: I(`pester-${how}`, { name }), cmd: { type: 'pester', to: o.id, how } }));
    const best = o.mood === 'annoyed' ? I('pester-annoyed', { name }) : choices[(o.pestered.length + (o.id === 'sharma' ? 0 : 1)) % 4].text;
    push(`pester:${o.id}`, 'pester', best, o, choices[0].cmd, { choices, mood: o.mood });
  }
  if (!pl.carrying) for (const [id, o] of Object.entries(s.objects)) if (isFree(o)) push(`take:${id}`, 'take', I(`take-${id}`), o, { type: 'take', object: id });
  if (pl.carrying) {
    const gives = { key: ['iqbal'], speaker: ['ravi'], megaphone: ['dev', 'mira', 'kabir'], phone: ['zoya'], water: ['sana'] }[pl.carrying];
    for (const id of gives) { const p = s.people[id]; if (!p.hidden && !p.carrying) push(`give:${id}`, 'give', I(`give-${pl.carrying}`, { name: id[0].toUpperCase() + id.slice(1) }), p, { type: 'give', to: id }); }
    push('drop', 'drop', I('drop'), pl, { type: 'drop' });
  }
  for (const p of Object.values(s.people)) if (!p.hidden && p.id !== 'sharma') push(`talk:${p.id}`, 'talk', I(p.id === 'nikhil' && p.mode === 'lost' ? 'talk-nikhil-lost' : 'talk', { name: p.id[0].toUpperCase() + p.id.slice(1) }), p, { type: 'talk', to: p.id });
  const done = new Set(pl.clips.map((c) => `${c.kind}@${c.place}`));
  const h = s.recent.filter((r) => s.t - r.t <= mins(10) && !done.has(`${r.kind}@${r.place}`)).sort((a, b) => b.t - a.t)[0];
  if (h) push(`film:${h.kind}`, 'film', I('film', { what: I(`film-${h.kind}`) }), h, { type: 'film' });
  for (const place of CROWD_PLACES) {
    if (crowdAt(s, place) < 4) continue;
    const c = CROWD_CENTERS[place];
    if (pl.crew.length < 8 && rep(s).aura >= 30) push(`rally:${place}`, 'rally', I('rally'), c, { type: 'rally' });
    else if (rep(s).aura < 30) push(`crowd:${place}`, 'crowd', I('crowd-hide'), c, null);
  }
  if (pl.crew.length) {
    const front = s.police.line ? LINE_FRONT[s.police.line] : LINE_FRONT.barricade;
    if (!pl.blocking) push('block', 'block', I('crew-block'), front, null);
    if (s.t >= at(15, 0) && !pl.stance) push('stance', 'stance', I('stance'), pl, null, { choices: ['hold', 'scatter', 'block', 'protect'].map((st) => ({ text: I(`stance-${st}`), cmd: { type: 'stance', stance: st } })) });
  }
  // Rank by distance, but let the rare and urgent things beat a constable who is always nearby,
  // and push down people you have already worked on so the card keeps suggesting something new.
  const URGENT = { scene: -6, 'scene-choice': -20, chase: -20, provocateur: -5, film: -4, give: -3, plead: -20 };
  const score = (o) => {
    let d = o.d + (URGENT[o.kind] ?? 0);
    if (o.kind === 'pester') { const of = officerById(s, o.id.slice(7)); d += (of?.pestered?.length ?? 0) * 3 + (of?.id === 'sharma' ? 0 : 2); }
    return d;
  };
  for (const o of out) o.rank = score(o);
  out.sort((a, b) => a.rank - b.rank);
  // "Put it down here" is always at distance 0; the HUD already says Q drops it, so it never wins the card
  // over something real (a person to give it to, a scene, the hotspot).
  const near = out.filter((o) => o.d <= radius && o.kind !== 'drop');
  if (near.length) return near;
  const real = out.filter((o) => o.kind !== 'drop');
  // Nothing in reach: point at the nearest thing that is alive, so the HUD always has a card.
  const hot = s.director.hotspot;
  const go = { id: `go:${hot}`, kind: 'go', text: I('go', { place: PLACES[hot].name }), x: PLACES[hot].x, z: PLACES[hot].z, d: dist(pos, PLACES[hot]), cmd: null };
  // From 14:00 a far-off chat with a constable is not the point any more: send the player to the hotspot
  // unless the best thing is something rare or urgent.
  const worth = real[0] && (s.t < at(14, 0) || (URGENT[real[0].kind] ?? 0) < 0);
  return [worth && real[0].d < go.d ? real[0] : go];
}

/** Which talk line applies right now. */
export function talkState(s, who) {
  const p = s.people[who];
  const r = rep(s);
  if (['asha', 'sana', 'ravi'].includes(who) && r.nuisance >= 50 && r.nuisance > r.help) return 'cold';
  if (who === 'ravi') {
    if (p.mode === 'search') return 'searching';
    if (p.mode === 'chaiBreak' || p.mode === 'toChai') return 'chai-break';
    if (s.t < at(10, 30)) return 'before-stage';
  }
  if (who === 'iqbal') {
    if (s.bus.phase === 'detention') return 'detention';
    if (p.mode === 'drive') return 'driving';
    if (p.mode === 'search') return 'searching';
    if (p.mode === 'chai' || p.mode === 'toChai' || p.mode === 'toBus') return 'break';
  }
  if (who === 'sharma') {
    if (p.mood === 'annoyed') return 'annoyed';
    if (p.mood === 'soft' && s.t >= at(14, 0)) return 'soft-tense';
    if (p.mood === 'soft') return 'soft';
    if (p.post === 'cp') return 'at-cp';
    if (s.t >= at(14, 0)) return 'tense';
    if (s.t >= at(13, 0)) return 'afternoon';
  }
  if (who === 'mira') {
    if (s.t >= at(17, 0)) return 'aftermath';
    if (s.t >= at(14, 30)) return 'tense';
    return s.speech ? 'after-speech' : 'before-speech';
  }
  if (who === 'zoya') {
    if (p.mode === 'search') return 'searching';
    if (p.mode === 'charging' || p.mode === 'toCharge') return 'charging';
    if (s.provocateurs.some((x) => x.state === 'hidden' || x.state === 'acting')) return 'provocateurs';
    if (s.stream.live) return 'live';
  }
  if (who === 'asha') {
    if (s.t >= at(12, 30) && s.t < at(15, 0)) return 'suv';
    if (s.t < at(13, 0)) return 'morning';
  }
  if (who === 'dev') {
    if (s.minister === 'waiting') return 'waiting';
    if (p.mode === 'chai') return 'chai';
    if (p.carrying !== 'megaphone' && s.t > at(14, 45)) return 'no-megaphone';
  }
  if (who === 'kabir') {
    if (['grateful', 'sulking', 'shook'].includes(p.mood)) return p.mood; // set by the mummy-call scene
    if (s.t >= at(13, 30) && s.t < at(14, 0) && !s.nikhilFound && !s.kabirStays) return 'mummy';
    if (s.nikhilFound) return 'with-nikhil';
  }
  if (who === 'nikhil') {
    if (p.mode === 'lost' && s.nikhilFound) return 'lost-again';
    if (p.mode === 'lost') return 'lost';
    if (p.mode === 'follow' || p.mode === 'waitStage') return 'following';
    if (p.mode === 'withKabir') return 'found';
  }
  if (who === 'sana') {
    if (p.mood === 'annoyed') return 'annoyed';
    if (s.waterOk) return 'has-water';
    if (s.t >= at(13, 0)) return 'no-water';
  }
  if (who === 'meera' && s.crowd.cpParty >= 4) return 'party';
  if (who === 'meera' && r.aura >= 40) return 'fan';
  return 'default';
}

/** Short tags describing the mood of the day, for ambient lines. */
export function moods(s) {
  const m = new Set();
  m.add(s.phase);
  m.add('intensity-' + s.director.band);
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
  if (s.groups.sena.place) m.add('sena');
  if (s.police.raf) m.add('raf');
  if (s.police.charge && !s.police.charge.over) m.add('charge');
  if (s.police.gas) m.add('gas');
  if (s.player.chasedBy) m.add('chase');
  if (rep(s).aura >= 40) m.add('famous');
  for (const [rid, r] of Object.entries(s.rumours)) if (!r.dead && Object.keys(r.places).length) m.add('rumour-' + rid);
  return m;
}

export function drainEvents(s) {
  return s.events.splice(0);
}
export function drainCues(s) {
  return s.cues.splice(0);
}
