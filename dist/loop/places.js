// A dare at every fast-travel place: something to do with the body for 20 to 60 seconds, rooted in what that
// real place is known for, with a quick funny way to fail, paid in aura (and followers, the way the slice pays).
// Pure engine code like rules.js (no DOM, no randomness): rules.js hands in its helpers (createPlaces(api)), the
// state lives in the day (s.places, and s.action while a dare runs), and a day nobody plays a dare in never
// touches it. Off in the three-minute slice.
//
// Every dare is a low-level game (eval/README.md): action:<game>:start | win | fail cues, s.action set while it runs.
// The client (places-ui.js) draws the props and people from PLACE_LAYOUT and the live state from placeView().
// Positions are on pavement or park ground, checked against the OpenStreetMap data (tests/test-places.mjs).

/** Real seconds each dare may take before it fails as too slow. */
const LIMIT = { chashma: 45, laddoo: 40, langar: 75, photobomb: 50, kurta: 45, darzi: 25, metro: 40, bus: 30 };
const PER_AURA = 120; // followers per point of aura, as in the slice (slice.js SLICE.perAura)
const REACH = 3; // how close to a dare's start you must stand to start it
const AWAY = 45; // walk this far from the dare's place and it's off

// --- where everything stands -------------------------------------------------------------------------
// place: the fast-travel destination (travel.js DESTINATIONS) the dare belongs to. start: where you start it.
export const PLACE_LAYOUT = {
  chashma: { // Palika Bazaar: the ₹99 Ray-Ban hawker at the top of the stairs (OSM board 132.7, -242.4)
    place: 'palika', start: { x: 134.6, z: -245.4 }, hawker: { x: 134.8, z: -244.6 }, tray: { x: 133.5, z: -245 }, didi: { x: 137.6, z: -243.6 },
  },
  laddoo: { // Prachin Hanuman Mandir, Baba Kharak Singh Marg: prasad from the west door to the joota ghar
    place: 'hanuman', start: { x: -104.6, z: -222 }, counter: { x: -105.4, z: -221 }, goal: { x: -87.5, z: -214.5 },
    gate: { x: -104.2, z: -225 }, flag: { x: -100.5, z: -219.8 },
    monkeys: [{ x: -99, z: -218.2 }, { x: -94, z: -218.2 }, { x: -86, z: -212.6 }],
  },
  langar: { // Gurudwara Bangla Sahib: thalis from the langar hall door to three pangat rows
    place: 'bangla', start: { x: -410, z: 61.2 }, sevadar: { x: -409, z: 60.2 },
    rows: [{ x: -416, z: 58.5 }, { x: -421.5, z: 64.5 }, { x: -413, z: 67.6 }],
  },
  photobomb: { // Rajiv Chowk Central Park, round the big tiranga: three couples making reels, one park guard
    place: 'centralPark', start: { x: 176, z: -374 },
    couples: [
      { cam: { x: 169.5, z: -377 }, pose: { x: 171.6, z: -379.2 } },
      { cam: { x: 186, z: -378.5 }, pose: { x: 184.2, z: -381 } },
      { cam: { x: 181, z: -393 }, pose: { x: 179, z: -390.6 } },
    ],
    guard: { x: 190, z: -396 },
  },
  kurta: { // Janpath: a tower of kurtas from the stall on the east pavement to the shop across the road
    place: 'janpath', start: { x: 168.5, z: 17 }, stall: { x: 169.4, z: 18.2 }, goal: { x: 147, z: 17 }, shop: { x: 146, z: 18.4 },
    lanes: [{ x0: 157.8, x1: 164.6, offset: 0 }, { x0: 150.4, x1: 156.9, offset: 3.5 }], // the near (east) and far (west) carriageways
  },
  darzi: { // PVR Rivoli forecourt, by Mohan Singh Place: jeans altered "paanch minute mein"
    place: 'rivoli', start: { x: -9, z: -261.4 }, darzi: { x: -9.2, z: -262.6 },
    stalls: { zip: { x: 4, z: -250.5 }, button: { x: -1.5, z: -262 }, darzi: { x: -9, z: -261.4 } },
    order: ['zip', 'button', 'darzi'],
  },
  metro: { // Patel Chowk metro, south gate: the frisking queue, a guard with a bag scanner, an uncle at the front
    place: 'patel', start: { x: -131.5, z: 277 }, gate: { x: -129.3, z: 259.4 }, guard: { x: -127.4, z: 259.2 },
    queue: [{ x: -129.6, z: 261 }, { x: -129.8, z: 263 }, { x: -130.1, z: 265 }, { x: -130.4, z: 267 }, { x: -130.7, z: 269.2 }, { x: -131, z: 271.4 }, { x: -131.2, z: 273.6 }],
  },
  bus: { // Shivaji Stadium terminal: the airport bus pulls out of its bay; catch its door on the move
    place: 'shivaji', start: { x: -82, z: -329.6 }, // behind the bus as it pulls out east, then down the road to Janpath
    path: [{ x: -68, z: -333 }, { x: -62, z: -332.6 }, { x: -56, z: -330 }, { x: -50.5, z: -326 }, { x: -46.5, z: -320 }, { x: -44, z: -315 }, { x: -40, z: -308 }, { x: -35, z: -298 }, { x: -31, z: -290 }, { x: -27, z: -282 }],
  },
};

// Copy: Delhi Gen Z Hinglish, short. Barks six words or fewer. Jokes about the player, monkeys, queues and shoes.
/** The place dares, for the day's mischief list: { id, place, text, done(s) }. */
export const PLACE_DARES = [
  { id: 'chashma', place: 'palika', text: 'Ray-Ban ₹99 mein patao. Asli wala.' },
  { id: 'laddoo', place: 'hanuman', text: 'Mandir ka laddoo bandaron se bachao.' },
  { id: 'langar', place: 'bangla', text: 'Langar ki thaliyan, ek bhi na gire.' },
  { id: 'photobomb', place: 'centralPark', text: 'Teen couples ki reel mein ghuso.' },
  { id: 'kurta', place: 'janpath', text: 'Kurton ka tower Janpath ke paar.' },
  { id: 'darzi', place: 'rivoli', text: 'Jeans alter, paanch minute mein.' },
  { id: 'metro', place: 'patel', text: 'Guard ke dekhte dekhte gate tak.' },
  { id: 'bus', place: 'shivaji', text: 'Chalti airport bus pakdo.' },
].map((d) => ({ ...d, done: (s) => !!s.places?.done?.[d.id] }));
const DARE = Object.fromEntries(PLACE_DARES.map((d) => [d.id, d]));
/** Which dare a fast-travel destination has. */
export const DARE_AT = Object.fromEntries(PLACE_DARES.map((d) => [d.place, d.id]));

// The E prompt at each dare's start.
const PROMPT = {
  chashma: 'Dare: ₹99 wala Ray-Ban patao',
  laddoo: 'Dare: prasad bandaron se bachao',
  langar: 'Seva: langar ki thaliyan uthao',
  photobomb: 'Dare: couples ki reel mein ghuso',
  kurta: 'Dare: kurta tower road paar',
  darzi: 'Dare: jeans paanch minute mein',
  metro: 'Dare: guard ke peeche se gate',
  bus: 'Dare: chalti bus pakdo',
};
// Who speaks at each place (the client draws them; present.js routes kind 'place' to a bubble over them).
const WHO = { hawker: 'Chashma wala', didi: 'Didi', halwai: 'Halwai', bandar: 'Bandar', sevadar: 'Sevadar ji', pangat: 'Sangat', couple: 'Couple', guard: 'Guard', dukaan: 'Dukaandar', auto: 'Auto wala', darzi: 'Darzi', zip: 'Zip wala', button: 'Button wala', uncle: 'Uncle', conductor: 'Conductor', coach: '' };
export const PLACE_NAMES = WHO;
// What can stop a dare from starting, in the player's voice (six words or fewer).
const NO = {
  slice: 'Aaj sirf CP. Baad mein.',
  busy: 'Pehle yeh wala khatam karne do.',
  hands: 'Haath khaali karo pehle.',
  chased: 'Peeche police hai! Baad mein.',
  done: 'Ho gaya ye. Next!',
  far: 'Thoda paas jaana padega.',
  stuck: 'Abhi nahi ho payega, bhai.',
};

const segDist = (a, b, p) => {
  const dx = b.x - a.x, dz = b.z - a.z, l2 = dx * dx + dz * dz;
  const t = l2 ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / l2)) : 0;
  return Math.hypot(a.x + t * dx - p.x, a.z + t * dz - p.z);
};
const round10 = (n) => Math.round(n / 10) * 10;

// --- the games' numbers -------------------------------------------------------------------------------
// Palika: walk away and the price falls; walk back and it locks. Too far and he sells to the didi instead.
const CHASHMA = { start: 999, floor: 99, full: 12, patience: [12.6, 10.6, 14.2], lock: 1, collect: 10, win: 249 };
export const chashmaPrice = (d) => Math.max(CHASHMA.floor, round10(CHASHMA.start - (CHASHMA.start - CHASHMA.floor) * Math.min(1, d / CHASHMA.full) ** 1.15));
// Hanuman Mandir: monkeys come for the dona and lunge like a constable (telegraphed, aimed where you'll be).
const MONKEY = { wake: 6.5, speed: 5.4, range: 2.6, windup: 0.45, dash: 0.4, dashSpeed: 15, reach: 0.95, stumble: 1.4, cool: 1.2, whiffs: 2, leash: 13, aim: 0.3 };
// Bangla Sahib: every jolt (a sudden start, stop or turn) wobbles the stack; steady walking lets it settle.
const LANGAR = { gain: 6, deadband: 0.2, settle: 12, drop: 100, warn: 65, serve: 1, row: 1.6, still: 1.2 };
// Central Park: each couple records for `on` seconds of every `period`; be in frame for `need` of it.
const PHOTO = { period: 4.5, on: 2.6, need: 0.5, frame: 1.4, guard: 1.2, faster: 0.45, catch: 1.4, wakeAfter: 6 };
// Janpath: each carriageway runs cars for part of a cycle, honking first. The painted median is safe.
const KURTA = { cycle: 7, clear: 3.4, horn: 1, band: { z0: -6, z1: 40 } };
// Rivoli: each stall wants you standing there a moment.
const DARZI = { reach: 1.6, wait: 1.2 };
// Patel Chowk: the guard scans a bag (looks away), then looks up at the queue. Each glance down is shorter.
const METRO = { watch: [2.6, 2.2, 2, 1.8, 1.6], away: [2.4, 2, 1.7, 1.5, 1.4], moving: 0.9, grace: 0.25, gate: 1.2 };
// Shivaji: the bus rolls out at a fast walk (a DTC bus never quite stops) and only floors it once it is on the
// road; its door is 2 m behind the middle, on the pavement side. A jog just catches it; a sprint makes it easy.
const BUS = { wait: 6, v0: 1.2, accel: 0.9, cruise: 3.6, until: 50, accel2: 2, max: 8.6, back: 2, side: 1.7, hop: 1.7 };
const BUS_AT = PLACE_LAYOUT.bus.path.reduce((acc, q, i, P) => { acc.push(i ? acc[i - 1] + Math.hypot(q.x - P[i - 1].x, q.z - P[i - 1].z) : 0); return acc; }, []);
const BUS_LEN = BUS_AT[BUS_AT.length - 1];
/** The bus at s metres along its way out: position and heading. */
export function busAt(sAlong) {
  const P = PLACE_LAYOUT.bus.path, t = Math.max(0, Math.min(BUS_LEN, sAlong));
  let i = 1;
  while (i < P.length - 1 && BUS_AT[i] < t) i++;
  const a = P[i - 1], b = P[i], L = BUS_AT[i] - BUS_AT[i - 1] || 1, k = (t - BUS_AT[i - 1]) / L;
  return { x: a.x + (b.x - a.x) * k, z: a.z + (b.z - a.z) * k, dx: (b.x - a.x) / L, dz: (b.z - a.z) / L };
}
/** The door: on the right of the way it drives (the terminal's pavement side), towards the back. */
export function busDoor(sAlong) {
  const b = busAt(sAlong - BUS.back);
  return { x: b.x - b.dz * BUS.side, z: b.z + b.dx * BUS.side };
}

/** Is Patel Chowk's guard watching the queue right now, and how long until he switches? */
export function guardState(a, now) {
  let t = now - a.since, i = 0;
  for (;;) {
    const w = METRO.watch[Math.min(i, METRO.watch.length - 1)], aw = METRO.away[Math.min(i, METRO.away.length - 1)];
    if (t < w) return { watching: true, left: w - t, n: i, into: t };
    t -= w;
    if (t < aw) return { watching: false, left: aw - t, n: i, into: t };
    t -= aw; i++;
  }
}
/** A Janpath carriageway's light: 'clear', 'horn' (cars coming) or 'cars'. */
export function laneState(a, lane, now) {
  const t = (((now - a.since + lane.offset) % KURTA.cycle) + KURTA.cycle) % KURTA.cycle;
  return t < KURTA.clear ? { phase: 'clear', left: KURTA.clear - t } : t < KURTA.clear + KURTA.horn ? { phase: 'horn', left: KURTA.clear + KURTA.horn - t } : { phase: 'cars', left: KURTA.cycle - t };
}
/** Is couple i in Central Park recording right now? */
export const recording = (a, i, now) => (((now - a.since + i * 1.5) % PHOTO.period) + PHOTO.period) % PHOTO.period < PHOTO.on;

/**
 * The place dares, given rules.js's helpers: { dist, say, cue, addRep, memo }.
 */
export function createPlaces(api) {
  const { dist, say, cue, addRep, memo } = api;
  const L = PLACE_LAYOUT;

  // --- what reaches the screen -----------------------------------------------------------------------
  /** A line from someone at the place (a bubble over them), or the coach strip (who 'coach'). */
  const line = (s, who, text, key, pos) => say(s, who, text, { key: `place-${key}`, kind: 'place', pos: pos ?? s.player });
  const me = (s, text, key) => say(s, 'player', text, { key: `place-${key}` });
  const coach = (s, a, k, text) => { if (a.coached?.[k]) return; (a.coached ??= {})[k] = s.t; line(s, 'coach', text, `coach-${a.game}-${k}`, s.player); };

  const state = (s) => (s.places ??= { done: {}, tries: {}, followers: 0, wins: 0 });
  const running = (s) => (s.action?.place ? s.action : null);

  /** Why a dare can't start right now (a NO key), or null. */
  function blocked(s, id) {
    const pl = s.player;
    if (s.slice) return 'slice';
    if (s.over || pl.detained || pl.pinned || pl.riding || s.story?.convo) return 'stuck';
    if (pl.chasedBy) return 'chased';
    if (s.raid || s.action) return 'busy';
    if (pl.carrying) return 'hands';
    if (id && s.places?.done?.[id]) return 'done';
    return null;
  }

  function start(s, id) {
    const no = blocked(s, id);
    if (no) { me(s, NO[no], 'no'); return { ok: false }; }
    if (dist(s.player, L[id].start) > REACH) { me(s, NO.far, 'no'); return { ok: false }; }
    const P = state(s), n = P.tries[id] = (P.tries[id] ?? 0) + 1;
    const a = s.action = { game: id, place: true, since: s.t, try: n, coached: {}, prev: { x: s.player.x, z: s.player.z }, v: { x: 0, z: 0 } };
    cue(s, `action:${id}:start`, { pos: s.player, data: { place: L[id].place, try: n } });
    START[id](s, a);
    return { ok: true };
  }

  function win(s, a, { aura, help = 0, who, said, title, sub, pos }) {
    s.action = null;
    const P = state(s);
    P.done[a.game] = s.t; P.wins++;
    addRep(s, { aura, help });
    memo(s, `dare-${a.game}`, { place: L[a.game].place });
    cue(s, `action:${a.game}:win`, { pos: s.player, data: { place: L[a.game].place, seconds: Math.round((s.t - a.since) * 10) / 10 } });
    if (who) line(s, who, said, `${a.game}-win`, pos);
    // Followers, the stamp and the reel cutaway: the same cues the slice uses (slice-ui.js draws them on any day).
    const n = aura * PER_AURA;
    P.followers += n;
    cue(s, 'slice:followers', { pos: s.player, data: { n, total: P.followers, why: 'dare', place: a.game } });
    cue(s, 'slice:dare', { pos: s.player, data: { id: a.game, place: a.game, followers: n } });
    cue(s, 'slice:cutaway', { pos: pos ?? s.player, data: { title, sub, followers: n, place: a.game, pos: pos ?? { x: s.player.x, z: s.player.z } } });
    return { ok: true };
  }
  function fail(s, a, why, lines = []) {
    s.action = null;
    cue(s, `action:${a.game}:fail`, { pos: s.player, data: { place: L[a.game].place, why } });
    for (const [who, text, pos] of lines) if (who === 'player') me(s, text, `${a.game}-fail`); else line(s, who, text, `${a.game}-fail-${why}`, pos);
    cue(s, 'crowd-laugh', { pos: s.player, data: { who: 'player' } });
  }

  // --- each game: how it starts, what each tick does --------------------------------------------------
  const START = {
    chashma(s, a) {
      Object.assign(a, { phase: 'haggle', dmax: 0, price: CHASHMA.start, patience: CHASHMA.patience[(a.try - 1) % CHASHMA.patience.length] });
      line(s, 'hawker', 'Ray-Ban original! ₹999 bas.', 'chashma-open', L.chashma.hawker);
      coach(s, a, 'open', 'Door jao, daam girega. Phir wapas aao.');
    },
    laddoo(s, a) {
      a.monkeys = L.laddoo.monkeys.map((m) => ({ x: m.x, z: m.z, home: { x: m.x, z: m.z }, state: 'sit', lunge: null, whiffs: 0, cool: 0 }));
      line(s, 'halwai', 'Prasad lo. Bandar se bachke!', 'laddoo-open', L.laddoo.counter);
      coach(s, a, 'open', 'Joota ghar tak le jao. Bandar jhapte toh side mein kat.');
    },
    langar(s, a) {
      Object.assign(a, { wobble: 0, row: 0, serveT: 0, warned: 0 });
      line(s, 'sevadar', 'Thaliyan le jao, puttar. Aaram se.', 'langar-open', L.langar.sevadar);
      coach(s, a, 'open', 'Teen pangat. Dheere chalo, jhatka nahi.');
    },
    photobomb(s, a) {
      Object.assign(a, { done: [false, false, false], inFrame: [0, 0, 0], guard: { ...L.photobomb.guard }, speed: PHOTO.guard, awake: false });
      coach(s, a, 'open', 'REC laal ho tab frame mein ghuso.');
      line(s, 'couple', 'Babe, ek aur take. Smile!', 'photobomb-open', L.photobomb.couples[0].cam);
    },
    kurta(s, a) {
      line(s, 'dukaan', 'Bees kurte, saamne wali dukaan. Jaldi!', 'kurta-open', L.kurta.stall);
      coach(s, a, 'open', 'Horn baje toh ruko. Beech mein safe.');
    },
    darzi(s, a) {
      Object.assign(a, { k: 0, wait: 0 });
      line(s, 'darzi', 'Paanch minute. Pehle zip la do.', 'darzi-open', L.darzi.darzi);
      coach(s, a, 'open', 'Zip wala, phir button, phir darzi.');
    },
    metro(s, a) {
      line(s, 'uncle', 'Line mein lago, beta.', 'metro-open', L.metro.queue[0]);
      coach(s, a, 'open', 'Guard bag dekhe, tab aage badho.');
    },
    bus(s, a) {
      Object.assign(a, { along: 0, speed: BUS.v0, rolling: false, from: { x: s.player.x, z: s.player.z } });
      line(s, 'conductor', 'Airport! Airport! Chalo chalo!', 'bus-open', busAt(0));
      coach(s, a, 'open', 'Hilo toh bus chalegi. Darwaza peeche hai!');
    },
  };

  const TICK = {
    chashma(s, a) {
      const h = L.chashma.hawker, d = dist(s.player, h);
      if (a.phase === 'haggle') {
        a.dmax = Math.max(a.dmax, d);
        a.price = chashmaPrice(a.dmax);
        if (a.dmax >= a.patience * 0.35 && !a.c1) { a.c1 = true; line(s, 'hawker', `Ruko ruko! ₹${a.price}!`, 'chashma-call-1', h); }
        if (a.dmax >= a.patience * 0.65 && !a.c2) { a.c2 = true; line(s, 'hawker', `Achha ₹${a.price}, last!`, 'chashma-call-2', h); }
        if (a.dmax >= a.patience - 2 && !a.c3) { a.c3 = true; line(s, 'hawker', 'Jao jao, didi le legi!', 'chashma-call-3', h); }
        if (a.dmax >= a.patience) return fail(s, a, 'didi', [['hawker', 'Didi, aapke liye ₹99.', h], ['player', 'Mera Ray-Ban! Didi le gayi.']]);
        if (a.dmax >= 2 && d <= a.dmax - CHASHMA.lock) {
          a.phase = 'deal'; a.dealAt = s.t;
          line(s, 'hawker', `Chalo, ₹${a.price}. Aao.`, 'chashma-deal', h);
        }
        return;
      }
      if (d <= 2) {
        if (a.price > CHASHMA.win) return fail(s, a, 'loot', [['hawker', `₹${a.price}. Pakka original.`, h], ['player', 'Loot gaye. Phir se?']]);
        return win(s, a, { aura: a.price <= 99 ? 14 : a.price <= 149 ? 11 : 8, who: 'hawker', said: `₹${a.price}? Kisi ko mat batana.`, title: `Ray-Ban ₹${a.price}`, sub: '"Original hai, kasam se."', pos: h });
      }
      if (s.t - a.dealAt > CHASHMA.collect) return fail(s, a, 'gone', [['hawker', 'Didi, ye aapke liye.', h], ['player', 'Arre! Mera deal tha!']]);
    },
    laddoo(s, a, dt) {
      const pl = s.player, g = L.laddoo.goal;
      if (dist(pl, g) <= 1.8) return win(s, a, { aura: 12, who: 'halwai', said: 'Bach gaya! Jai Bajrangbali!', title: 'Laddoo safe', sub: 'Bandar 0, bhakt 1', pos: g });
      for (const m of a.monkeys) {
        m.cool = Math.max(0, m.cool - dt);
        if (m.state === 'sit') {
          if (dist(m, pl) <= MONKEY.wake) { m.state = 'run'; line(s, 'bandar', 'Khi khi khi!', 'laddoo-wake', m); cue(s, 'place:monkey', { pos: m, data: { what: 'wake' } }); coach(s, a, 'lunge', 'Jhapatne wala hai! Side mein kat!'); }
          continue;
        }
        if (m.state === 'sulk' || m.state === 'home') { step(m, m.home, 3, dt); if (dist(m, m.home) < 0.2) m.state = 'home'; continue; }
        const L2 = m.lunge;
        if (L2) {
          L2.t += dt;
          if (L2.phase === 'windup') {
            if (L2.t >= MONKEY.windup) { const d = dist(m, L2.aim) || 1; Object.assign(L2, { phase: 'dash', t: 0, dir: { x: (L2.aim.x - m.x) / d, z: (L2.aim.z - m.z) / d }, left: Math.min(MONKEY.dashSpeed * MONKEY.dash, d + 0.5) }); }
            continue;
          }
          if (L2.phase === 'dash') {
            const st = Math.min(MONKEY.dashSpeed * dt, L2.left), from = { x: m.x, z: m.z };
            m.x += L2.dir.x * st; m.z += L2.dir.z * st; L2.left -= st;
            if (segDist(from, m, pl) <= MONKEY.reach) return fail(s, a, 'monkey', [['bandar', 'Khi khi! Mera hua.', m], ['player', 'Mera laddoo!'], ['halwai', 'Bandar ka bhi prasad hota hai.', L.laddoo.counter]]);
            if (L2.left <= 1e-9) {
              m.whiffs++; Object.assign(L2, { phase: 'stumble', t: 0 });
              cue(s, 'place:monkey', { pos: m, data: { what: 'miss', whiffs: m.whiffs } });
              addRep(s, { aura: 1 });
            }
            continue;
          }
          if (L2.t < MONKEY.stumble) continue;
          m.lunge = null; m.cool = MONKEY.cool;
          if (m.whiffs >= MONKEY.whiffs) { m.state = 'sulk'; line(s, 'bandar', 'Hmph.', 'laddoo-sulk', m); }
          continue;
        }
        if (dist(m, m.home) > MONKEY.leash) { m.state = 'sulk'; continue; }
        step(m, pl, MONKEY.speed, dt);
        if (dist(m, pl) <= MONKEY.range && !m.cool && !a.monkeys.some((o) => o.lunge && o.lunge.phase !== 'stumble')) { // one at a time
          const ahead = MONKEY.windup + MONKEY.dash;
          m.lunge = { phase: 'windup', t: 0, aim: { x: pl.x + a.v.x * ahead, z: pl.z + a.v.z * ahead } };
          cue(s, 'place:monkey', { pos: m, data: { what: 'lunge', aim: m.lunge.aim } });
        }
      }
    },
    langar(s, a, dt, dv, speed) {
      a.wobble = Math.max(0, a.wobble + Math.max(0, dv - LANGAR.deadband) * LANGAR.gain - LANGAR.settle * dt);
      if (a.wobble >= LANGAR.drop) return fail(s, a, 'drop', [['player', 'Thaliyan... gir gayi.'], ['sevadar', 'Koi gal nahi. Phir se?', L.langar.sevadar]]);
      if (a.wobble >= LANGAR.warn && s.t - a.warned > 3) { a.warned = s.t; line(s, 'coach', 'Sambhal ke! Thaliyan hil rahi!', 'langar-warn', s.player); cue(s, 'place:wobble', { pos: s.player, data: { wobble: Math.round(a.wobble) } }); }
      const row = L.langar.rows[a.row];
      if (dist(s.player, row) <= LANGAR.row && speed < LANGAR.still) a.serveT += dt; else a.serveT = 0;
      if (a.serveT >= LANGAR.serve) {
        a.serveT = 0; a.row++;
        cue(s, 'place:serve', { pos: row, data: { row: a.row } });
        line(s, 'pangat', ['Waheguru. Shukriya, veere.', 'Ek roti aur, please.', 'Dal mast hai aaj.'][a.row - 1], `langar-row-${a.row}`, row);
        if (a.row >= L.langar.rows.length) return win(s, a, { aura: 6, help: 15, who: 'sevadar', said: 'Seva ho gayi. Ab langar chhako.', title: 'Langar seva', sub: 'Teen pangat, ek bhi thali nahi giri', pos: L.langar.sevadar });
      }
    },
    photobomb(s, a, dt) {
      const pl = s.player, C = L.photobomb.couples;
      C.forEach((c, i) => {
        if (a.done[i]) return;
        const inFrame = dist(pl, c.pose) <= PHOTO.frame && recording(a, i, s.t);
        a.inFrame[i] = inFrame ? a.inFrame[i] + dt : 0;
        if (a.inFrame[i] < PHOTO.need) return;
        a.done[i] = true; a.awake = true; a.speed += PHOTO.faster;
        addRep(s, { aura: 2 });
        cue(s, 'place:photobomb', { pos: c.pose, data: { couple: i, n: a.done.filter(Boolean).length } });
        line(s, 'couple', ['Bhaiya!! Reel kharab!', 'Ye kaun hai?? Delete karo!', 'Aunty dekhengi ab ye.'][a.done.filter(Boolean).length - 1], `photobomb-${i}`, c.cam);
        if (a.done.filter(Boolean).length === 1) { line(s, 'guard', 'Phreeee! Oye, idhar aa!', 'photobomb-whistle', a.guard); cue(s, 'place:whistle', { pos: a.guard }); }
      });
      if (a.done.every(Boolean)) return win(s, a, { aura: 12, who: 'couple', said: 'Ye banda har reel mein hai!', title: 'Teen reels, ek hero', sub: '"Bhaiya kaun ho aap??"', pos: C[2].cam });
      if (!a.awake && s.t - a.since >= PHOTO.wakeAfter) { a.awake = true; line(s, 'guard', 'Phreeee! Ghaas pe nahi!', 'photobomb-whistle', a.guard); cue(s, 'place:whistle', { pos: a.guard }); }
      if (a.awake) {
        step(a.guard, pl, a.speed, dt);
        if (dist(a.guard, pl) <= PHOTO.catch) return fail(s, a, 'guard', [['guard', 'Park se bahar, hero.', a.guard], ['player', 'Bas ek reel, uncle!']]);
      }
    },
    kurta(s, a) {
      const pl = s.player, K = L.kurta;
      if (dist(pl, K.goal) <= 1.8) return win(s, a, { aura: 10, who: 'dukaan', said: 'Bees ke bees! Chai pakki.', title: 'Kurta tower', sub: 'Janpath paar, ek bhi nahi gira', pos: K.shop });
      if (pl.z < K.goal.z + KURTA.band.z0 || pl.z > K.goal.z + KURTA.band.z1) return;
      for (const lane of K.lanes) {
        const st = laneState(a, lane, s.t);
        if (st.phase !== a[`lane${lane.offset}`]) { a[`lane${lane.offset}`] = st.phase; if (st.phase === 'horn') cue(s, 'place:traffic', { pos: { x: (lane.x0 + lane.x1) / 2, z: pl.z }, data: { lane: K.lanes.indexOf(lane), phase: 'horn' } }); }
        if (st.phase === 'cars' && pl.x > lane.x0 && pl.x < lane.x1) return fail(s, a, 'honk', [['auto', 'Peeeep! Dekh ke, hero!', { x: pl.x, z: pl.z + 3 }], ['player', 'Kurte! Sadak pe kurte!']]);
      }
    },
    darzi(s, a, dt) {
      const D = L.darzi, id = D.order[a.k], at = D.stalls[id];
      if (dist(s.player, at) <= DARZI.reach) a.wait += dt; else a.wait = 0;
      if (a.wait < DARZI.wait) return;
      a.wait = 0; a.k++;
      cue(s, 'place:stall', { pos: at, data: { stall: id, k: a.k } });
      if (a.k >= D.order.length) return win(s, a, { aura: 10, who: 'darzi', said: 'Le, ho gaya. Paanch minute.', title: 'Jeans ready', sub: '"Bola tha na, paanch minute."', pos: D.darzi });
      if (id === 'zip') line(s, 'zip', 'YKK asli. Ab button.', 'darzi-zip', at);
      if (id === 'button') line(s, 'button', 'Button laga. Darzi ko de.', 'darzi-button', at);
    },
    metro(s, a, dt, dv, speed) {
      const M = L.metro, g = guardState(a, s.t);
      if (g.watching !== a.watching) {
        a.watching = g.watching;
        cue(s, 'place:guard', { pos: M.guard, data: { watching: g.watching } });
        if (g.watching && g.n > 0) line(s, 'guard', 'Hmm.', `metro-look-${Math.min(g.n, 3)}`, M.guard);
      }
      if (dist(s.player, M.gate) <= METRO.gate) return win(s, a, { aura: 10, who: 'uncle', said: 'Arre, ye kahan se aaya?', title: 'Uncle ke peeche', sub: 'Guard abhi bhi bag dekh raha', pos: M.queue[0] });
      a.moving = speed > METRO.moving ? (a.moving ?? 0) + dt : 0;
      if (g.watching && g.into >= METRO.grace && a.moving >= 0.15) return fail(s, a, 'spotted', [['guard', 'Oye hero! Line mein peeche!', M.guard], ['player', 'Main toh stretching kar raha tha.']]);
    },
    bus(s, a, dt) {
      // It waits in the bay, calling, until the driver sees you coming in his mirror (or gets bored): then it goes.
      if (!a.rolling) {
        if (dist(s.player, a.from) < 1 && s.t - a.since < BUS.wait) return;
        a.rolling = true;
        line(s, 'conductor', 'Chal chal, aa raha hai!', 'bus-go', busAt(a.along));
      }
      a.speed = a.along < BUS.until ? Math.min(BUS.cruise, a.speed + BUS.accel * dt) : Math.min(BUS.max, a.speed + BUS.accel2 * dt);
      a.along += a.speed * dt;
      const door = busDoor(a.along);
      if (dist(s.player, door) <= BUS.hop) return win(s, a, { aura: 12, who: 'conductor', said: 'Shabash! Ticket le, hero.', title: 'Chalti bus pakdi', sub: 'Conductor ne bhi taali maari', pos: door });
      if (a.along >= BUS_LEN) return fail(s, a, 'missed', [['conductor', 'Agli pakad lena, hero!', busAt(BUS_LEN)], ['player', 'Bus bhi bhaag gayi.']]);
    },
  };
  /** Walk p towards `to` at `speed`. */
  function step(p, to, speed, dt) {
    const d = dist(p, to);
    if (d < 1e-6) return;
    const k = Math.min(1, (speed * dt) / d);
    p.x += (to.x - p.x) * k; p.z += (to.z - p.z) * k;
  }

  /** Each tick (rules.js tick): the running dare, if any. A day with no dare started never gets past the first line. */
  function tick(s, dt) {
    const a = running(s);
    if (!a) return;
    const pl = s.player;
    // How the player is moving, from where they were last tick (the client and the bots move the player).
    let raw = { x: (pl.x - a.prev.x) / dt, z: (pl.z - a.prev.z) / dt };
    if (Math.hypot(raw.x, raw.z) > 20) raw = { x: a.raw?.x ?? 0, z: a.raw?.z ?? 0 }; // a jump (a hop, a snap back), not a step
    const dv = Math.hypot(raw.x - (a.raw?.x ?? 0), raw.z - (a.raw?.z ?? 0));
    a.prev = { x: pl.x, z: pl.z }; a.raw = raw;
    const k = 1 - Math.exp(-dt / MONKEY.aim);
    a.v = { x: a.v.x + (raw.x - a.v.x) * k, z: a.v.z + (raw.z - a.v.z) * k };
    const speed = Math.hypot(raw.x, raw.z);
    // Something bigger took over: the dare is off, quietly (the bigger thing has its own lines).
    if (pl.detained || pl.chasedBy || pl.pinned || pl.riding || s.raid || s.over) { s.action = null; cue(s, `action:${a.game}:fail`, { pos: pl, data: { place: L[a.game].place, why: 'interrupted' } }); return; }
    if (pl.carrying) return fail(s, a, 'hands', [['player', 'Ek haath mein do kaam? Nahi.']]);
    if (dist(pl, L[a.game].start) > AWAY) return fail(s, a, 'left', [['player', 'Dare beech mein chhoda. Sharam.']]);
    if (s.t - a.since >= LIMIT[a.game]) return fail(s, a, 'slow', SLOW[a.game]);
    TICK[a.game](s, a, dt, dv, speed);
  }
  const SLOW = {
    chashma: [['hawker', 'Soch lo, kal aana.', L.chashma.hawker]],
    laddoo: [['halwai', 'Laddoo thanda ho gaya, beta.', L.laddoo.counter]],
    langar: [['sevadar', 'Sangat intezaar kar rahi, puttar.', L.langar.sevadar]],
    photobomb: [['couple', 'Reel post ho gayi. Tum nahi.', L.photobomb.couples[0].cam]],
    kurta: [['dukaan', 'Kurte wapas laao. Rehne do.', L.kurta.stall]],
    darzi: [['darzi', 'Paanch minute matlab kal aana.', L.darzi.darzi]],
    metro: [['uncle', 'Beta, line toh chal padi.', L.metro.queue[0]]],
    bus: [['conductor', 'Agli pakad lena!', L.bus.path[L.bus.path.length - 1]]],
  };

  /** act(s, { type: 'place', id, move: 'start' | 'quit' }). A refusal is a player line. */
  function act(s, cmd) {
    const id = cmd.id;
    if (!L[id]) { me(s, 'Yahan koi dare nahi, bhai.', 'no'); return { ok: false }; }
    if (cmd.move === 'quit') {
      const a = running(s);
      if (!a || a.game !== id) return { ok: false };
      fail(s, a, 'quit', [['player', 'Rehne do. Main thak gaya.']]);
      return { ok: true };
    }
    return start(s, id);
  }

  // --- what the player can do, what the HUD suggests, what a good player would do -----------------------
  /** Every dare on offer, and while one runs, where to go next: [{ id, kind, cmd, at }] for rules.js affordances(). */
  function affordances(s) {
    if (s.slice) return [];
    const a = running(s);
    if (a) {
      const out = [{ id: `place:${a.game}:quit`, kind: 'place', cmd: { type: 'place', id: a.game, move: 'quit' }, at: null }];
      for (const p of targets(s, a)) out.push({ id: `place:${a.game}:go:${p.name}`, kind: 'place', cmd: null, at: { x: p.x, z: p.z } });
      return out;
    }
    if (blocked(s)) return [];
    return PLACE_DARES.filter((d) => !s.places?.done?.[d.id]).map((d) => ({ id: `place:${d.id}`, kind: 'place', cmd: { type: 'place', id: d.id, move: 'start' }, at: { ...L[d.id].start } }));
  }
  /** The places a running dare sends you to (for the explorer and the bots). */
  function targets(s, a) {
    const T = L[a.game];
    if (a.game === 'chashma') { const h = T.hawker; return [{ name: 'away', x: h.x + 7, z: h.z - 7 }, { name: 'back', x: h.x - 0.8, z: h.z - 0.8 }]; }
    if (a.game === 'laddoo') return [{ name: 'goal', ...T.goal }];
    if (a.game === 'langar') return T.rows.slice(a.row).map((r, i) => ({ name: `row${a.row + i + 1}`, ...r }));
    if (a.game === 'photobomb') return T.couples.map((c, i) => ({ name: `couple${i + 1}`, ...c.pose })).filter((_, i) => !a.done[i]);
    if (a.game === 'kurta') return [{ name: 'median', x: T.lanes[1].x1 - 0.5, z: T.goal.z }, { name: 'goal', ...T.goal }];
    if (a.game === 'darzi') return [{ name: T.order[a.k], ...T.stalls[T.order[a.k]] }];
    if (a.game === 'metro') return [{ name: 'gate', ...T.gate }];
    if (a.game === 'bus') return [{ name: 'door', ...busDoor(a.along + 8) }];
    return [];
  }

  /** The nearby card and the E prompt (rules.js opportunities): a dare to start, or what the running one wants now. */
  function opportunities(s, pos, radius) {
    if (s.slice) return [];
    const a = running(s), out = [];
    if (a) { out.push({ id: `place:${a.game}`, kind: 'place', text: nowText(s, a), at: { x: s.player.x, z: s.player.z }, cmd: null }); return out; }
    if (blocked(s)) return out;
    for (const d of PLACE_DARES) if (!s.places?.done?.[d.id] && dist(pos, L[d.id].start) <= radius) out.push({ id: `place:${d.id}`, kind: 'place', text: PROMPT[d.id], at: L[d.id].start, cmd: { type: 'place', id: d.id, move: 'start' } });
    return out;
  }
  /** What the running dare wants from you this second, in a few words (the objective card). */
  function nowText(s, a) {
    const T = L[a.game];
    if (a.game === 'chashma') return a.phase === 'deal' ? `₹${a.price} pe deal. Wapas jao!` : `₹${a.price}. Aur door jao...`;
    if (a.game === 'laddoo') return 'Joota ghar tak bhaago. Bandar!';
    if (a.game === 'langar') return `Pangat ${a.row + 1} tak, aaram se.`;
    if (a.game === 'photobomb') return `${a.done.filter(Boolean).length}/3 reels. REC pe ghuso!`;
    if (a.game === 'kurta') { const near = T.lanes.find((l) => s.player.x > l.x0 - 1 && s.player.x < l.x1 + 1) ?? T.lanes[s.player.x > 157.5 ? 0 : 1]; const st = laneState(a, near, s.t); return st.phase === 'clear' ? 'Gaadi ruki. Ab paar!' : st.phase === 'horn' ? 'Horn! Gaadi aa rahi!' : 'Gaadiyan! Ruko!'; }
    if (a.game === 'darzi') return { zip: 'Zip wale ke paas!', button: 'Ab button wala!', darzi: 'Wapas darzi ke paas!' }[T.order[a.k]];
    if (a.game === 'metro') return guardState(a, s.t).watching ? 'Guard dekh raha. Statue!' : 'Bag check! Aage badho!';
    if (a.game === 'bus') return 'Darwaze tak bhaago!';
    return '';
  }

  /**
   * What a good player would do now, as one macro step for the verifier's bots and the designed routes
   * (verify/lib/bots.mjs): { at, hold } to walk somewhere, or { wait } in clock minutes. null: nothing running.
   */
  function hint(s) {
    const a = running(s);
    if (!a) return null;
    const T = L[a.game], pl = s.player, W = (m) => ({ wait: m });
    // (a walk ends a metre short of its spot, so a spot that close is a short wait instead: time must pass)
    const go = (p, name) => dist(pl, p) <= 1.05 ? W(0.05) : ({ do: `place:${a.game}:go:${name}`, cmd: null, at: { x: Math.round(p.x * 100) / 100, z: Math.round(p.z * 100) / 100 }, hold: 0 });
    const toward = (p, max) => { const d = dist(pl, p); if (d <= max) return p; return { x: pl.x + ((p.x - pl.x) / d) * max, z: pl.z + ((p.z - pl.z) / d) * max }; };
    if (a.game === 'chashma') {
      const h = T.hawker;
      if (a.phase === 'deal') return go(h, 'back');
      if (a.dmax < a.patience - 2.2) return go({ x: h.x + (a.dmax + 2) * 0.7071, z: h.z - (a.dmax + 2) * 0.7071 }, 'away');
      return go({ x: h.x + (a.dmax - 3) * 0.7071, z: h.z - (a.dmax - 3) * 0.7071 }, 'turn');
    }
    if (a.game === 'laddoo') {
      const m = a.monkeys.find((x) => x.lunge?.phase === 'windup');
      if (m) { // get off the line it will jump along (from the monkey to where it aimed), on the goal side if on it
        const A = m.lunge.aim, dx = A.x - m.x, dz = A.z - m.z, l2 = dx * dx + dz * dz || 1;
        const t = Math.max(0, Math.min(1, ((pl.x - m.x) * dx + (pl.z - m.z) * dz) / l2)), cx = m.x + dx * t, cz = m.z + dz * t;
        let ox = pl.x - cx, oz = pl.z - cz, od = Math.hypot(ox, oz);
        if (od < 0.3) { const l = Math.sqrt(l2); ox = -dz / l; oz = dx / l; if (ox * (T.goal.x - pl.x) + oz * (T.goal.z - pl.z) < 0) { ox = -ox; oz = -oz; } od = 1; }
        return go({ x: pl.x + (ox / od) * 3, z: pl.z + (oz / od) * 3 }, 'dodge');
      }
      return go(toward(T.goal, a.monkeys.some((x) => x.state === 'run' && dist(x, pl) < 5) ? 1.4 : 2.5), 'goal');
    }
    if (a.game === 'langar') {
      if (a.wobble > 35) return W(0.15);
      const r = T.rows[a.row];
      if (dist(pl, r) <= 1) return W(0.15);
      return go(toward(r, 3), `row${a.row + 1}`);
    }
    if (a.game === 'photobomb') {
      if (a.awake && dist(a.guard, pl) < 2.8) { // too close: run past him, round to the far side of the next couple
        const d = dist(a.guard, pl) || 1;
        return go({ x: pl.x + ((pl.x - a.guard.x) / d) * 3.5, z: pl.z + ((pl.z - a.guard.z) / d) * 3.5 }, 'away');
      }
      // In frame and recording: hold still. Otherwise a couple whose red light will still be on when you get
      // there (furthest from the guard first); if none, wait a few steps off to the side of the next one.
      const left = T.couples.map((c, k) => k).filter((k) => !a.done[k]);
      const phase = (k, dt) => (((s.t + dt - a.since + k * 1.5) % PHOTO.period) + PHOTO.period) % PHOTO.period;
      const here = left.find((k) => dist(pl, T.couples[k].pose) <= PHOTO.frame - 0.2);
      if (here != null && recording(a, here, s.t)) return W(0.05);
      const eta = (k) => Math.max(0, dist(pl, T.couples[k].pose) - 1) / 4.7 + 0.2;
      const ok = left.filter((k) => phase(k, eta(k)) < PHOTO.on - PHOTO.need - 0.3).sort((x, y) => dist(T.couples[y].pose, a.guard) - dist(T.couples[x].pose, a.guard));
      if (ok.length) { const c = T.couples[ok[0]]; return go(toward(c.pose, 3), `couple${ok[0] + 1}`); }
      const k = left.sort((x, y) => (PHOTO.period - phase(x, 0)) - (PHOTO.period - phase(y, 0)))[0], c = T.couples[k];
      const gd = dist(c.pose, a.guard) || 1, side = { x: c.pose.x + ((c.pose.x - a.guard.x) / gd) * 3, z: c.pose.z + ((c.pose.z - a.guard.z) / gd) * 3 };
      return dist(pl, side) <= 1.2 ? W(0.05) : go(toward(side, 3), `couple${k + 1}`);
    }
    if (a.game === 'kurta') {
      const [near, far] = T.lanes, median = { x: far.x1 - 0.5, z: pl.z }; // a walk stops a metre short: on the painted median
      const safe = (lane) => { const st = laneState(a, lane, s.t); return st.phase === 'clear' && st.left > 1.8; };
      if (pl.x >= near.x0) { // on the east pavement, or in the near lane
        if (pl.x < near.x1) return go(median, 'median');
        return safe(near) ? go(median, 'median') : W(0.1);
      }
      if (pl.x >= far.x1) return safe(far) ? go(T.goal, 'goal') : W(0.1); // on the median
      return go(T.goal, 'goal');
    }
    if (a.game === 'darzi') { const id = T.order[a.k], at = T.stalls[id]; return dist(pl, at) <= 1 ? W(0.15) : go(at, id); }
    if (a.game === 'metro') {
      const g = guardState(a, s.t);
      if (g.watching || g.left < 0.6) return W(0.05);
      return go(toward(T.gate, Math.min(2.2, (g.left - 0.35) * 4.7)), 'gate');
    }
    if (a.game === 'bus') {
      // Run to where the door will be in a second or so, along the pavement side.
      const door = busDoor(a.along + a.speed * 1.2 + 1);
      return go(toward(door, 4), 'door');
    }
    return null;
  }

  /** What the client draws: the running dare, the done ones, and the layout. */
  function view(s) {
    const a = running(s), P = s.places;
    const out = { done: { ...(P?.done ?? {}) }, followers: P?.followers ?? 0, game: null };
    if (!a) return out;
    const g = { id: a.game, place: L[a.game].place, left: Math.max(0, LIMIT[a.game] - (s.t - a.since)), limit: LIMIT[a.game], text: nowText(s, a) };
    if (a.game === 'chashma') Object.assign(g, { price: a.price, phase: a.phase, meter: Math.min(1, a.dmax / a.patience) });
    if (a.game === 'laddoo') g.monkeys = a.monkeys.map((m) => ({ x: m.x, z: m.z, state: m.state, lunge: m.lunge?.phase ?? null }));
    if (a.game === 'langar') Object.assign(g, { meter: Math.min(1, a.wobble / LANGAR.drop), row: a.row });
    if (a.game === 'photobomb') Object.assign(g, { guard: { ...a.guard }, done: a.done.slice(), rec: L.photobomb.couples.map((_, i) => recording(a, i, s.t)), awake: a.awake });
    if (a.game === 'kurta') g.lanes = L.kurta.lanes.map((l) => laneState(a, l, s.t));
    if (a.game === 'darzi') Object.assign(g, { next: L.darzi.order[a.k], k: a.k, minutes: Math.max(0, (5 * (LIMIT.darzi - (s.t - a.since))) / LIMIT.darzi) });
    if (a.game === 'metro') { const st = guardState(a, s.t); Object.assign(g, { watching: st.watching, switchIn: st.left }); }
    if (a.game === 'bus') { const b = busAt(a.along); Object.assign(g, { bus: { x: b.x, z: b.z, yaw: Math.atan2(b.dx, b.dz) }, door: busDoor(a.along), speed: a.speed }); }
    out.game = g;
    return out;
  }
  /** Is the player carrying something heavy for a dare (the client walks them at the heavy pace)? */
  const heavy = (s) => { const a = running(s); return !!a && (a.game === 'langar' || a.game === 'kurta'); };
  /** The travel panel's line for a place while its dare is undone (travel.js live()). */
  function travelLine(s, dest) {
    const id = DARE_AT[dest];
    if (!id || s.slice || s.places?.done?.[id]) return null;
    return `Dare: ${DARE[id].text}`;
  }

  return { act, tick, affordances, opportunities, hint, view, heavy, travelLine, blocked: (s, id) => { const k = blocked(s, id); return k ? NO[k] : null; } };
}
