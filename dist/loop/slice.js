// The three-minute slice (?slice): one run near the CP shuttle stop that is fun on its own.
// A cold open mid-chase, three dares on screen, followers as the score, every dare answered on screen within
// three seconds, and a reel at exactly 180 real seconds. Pure engine code like rules.js (no DOM): the state lives
// in the day (s.slice), rules.js hands in its helpers (createSlice(api)), and a default day never touches it.
// Followers, moments, cutaways and the end reel's pick are reel.js, shared with the 10-minute day (dares.js).
import { createReel, PER_AURA } from './reel.js';

export const SLICE = {
  length: 180, // real seconds
  topiAgain: 8, // clock minutes before a robbed constable lets his guard down again (10 s at the slice tempo)
  pinned: 4, // seconds of uthak-baithak when you are caught
  raviNotice: 3, // seconds Ravi stays on his phone after you lift the speaker
  raviSpeed: 4.3, // a bit faster than you carry it (3.4)
  stop: 6, // metres from the bus-stop crowd that count as "at the stop"
  partyEvery: 1.1, // seconds per dancer while the speaker plays at the stop
  partyMax: 16,
  keySpot: 5, // carrying the key this close to a constable at his post, he spots it
  perAura: PER_AURA, // followers per point of aura (reel.js)
  meera: 15, // metres: inside this, Meera's reel doubles what you earn
  crowd: { from: 4, every: 4, max: 10 }, // the waiting crowd at the stop fills in over the first seconds
};

// Copy: Delhi Gen Z Hinglish, short. Barks are six words or fewer.
export const DARES = [
  { id: 'topi', text: 'Meena ji ki topi. Pakde mat jaana.' },
  { id: 'speaker', text: 'Ravi ka speaker bus stop pe bajao.' },
  { id: 'chabi', text: 'Iqbal ki chabi gayab karo.' },
];
export const BONUS_TEXT = 'Bonus: aur topi udao.';
const COACH = {
  open: 'SHIFT dabao. BHAAG!',
  lunge: 'Jhapat raha hai! Side mein kat!',
  crowd: 'Bheed ban gayi. Ghus ja!',
  speaker: 'Ravi phone pe hai. Speaker utha!',
  notStop: 'Bus stop pe rakh, yahan nahi.',
  chabi: 'Ab chabi. Hook pe latki hai.',
  showKey: 'Ab kisi constable ko dikha.',
  bonus: 'Teeno ho gaye! Ab bonus topi.',
  late: 'Tees second bache!',
};
const NAME = { c1: 'Yadav ji', c2: 'Meena ji', c3: 'Tomar ji', c4: 'Rawat ji', c5: 'Gill ji', c6: 'Bisht ji', c7: 'Negi ji', sharma: 'Sharma ji' };
const nameOf = (id) => NAME[id] ?? 'Constable';
// Funny comments for the reel, by what you did. The first three that apply, in this order.
const COMMENTS = [
  [(o) => o.dares === 3, 'teeno dares?? bhai ka resume ready hai'],
  [(o) => o.caught >= 2, 'bhai ka cardio Delhi Police karwa rahi hai'],
  [(o) => o.caught === 1, 'uthak-baithak form 10/10, gym wale ro rahe'],
  [(o) => o.topis >= 3, 'topi collection > mera career'],
  [(o) => o.party, 'CP stop pe Coachella kab hua??'],
  [(o) => o.chabi, 'Iqbal bhai ki EMI ab kaun bharega'],
  [(o) => o.nearMisses >= 3, 'matrix wala dodge. bhai kaun hai tu'],
  [(o) => o.followers >= 20000, 'ye banda 2026 ka main character hai'],
  [(o) => o.raviCaught, 'Ravi uncle ne speaker 4K mein chheena'],
  [(o) => o.topis >= 1, 'Meena ji ka reaction > poori web series'],
  [(o) => o.dares === 0, 'bhai ne teen minute sirf jog kiya'],
  [() => true, 'Delhi Police ko bhi follow kar le bhai'],
  [() => true, 'part 2 kab aa raha hai??'],
  [() => true, 'CP ka asli influencer'],
];

export function createSlice(api) {
  const { dist, SPOTS, CROWD_CENTERS, cue, say, addRep, startChase, startIqbalBreak, endIqbalBreak, crowdAt } = api;
  const REEL = createReel({ cue }); // followers, moments, cutaways and the end reel, shared with the 10-minute day (reel.js)
  const stop = CROWD_CENTERS.cp;
  const officers = (s) => [s.people.sharma, ...Object.values(s.officers)];

  function setup(s) {
    const pl = s.player, meena = s.officers.c2;
    s.slice = {
      length: SLICE.length, followers: 0, multiplier: 1,
      dares: DARES.map((d) => ({ id: d.id, text: d.text, done: false, at: null })),
      moments: [], comments: [],
      aura: 0, chases: 0, caught: 0, topis: 0, nearMisses: 0, raviCaught: 0, party: false, partyT: 0,
      ravi: { phase: 'chai', t: 0 }, coached: {}, chase: null, ended: false,
    };
    // A second constable by the e-rickshaw stand, so an officer is nearly always within reach.
    const c6 = s.officers.c6;
    Object.assign(c6, { x: SPOTS.rickCP.x + 1.5, z: SPOTS.rickCP.z + 1, post: { x: SPOTS.rickCP.x + 1.5, z: SPOTS.rickCP.z + 1 }, path: [], mode: 'post' });
    // Iqbal is already on his chai break, the key on the hook; Ravi is at his stall with the speaker beside him.
    startIqbalBreak(s);
    Object.assign(s.people.iqbal, { x: SPOTS.chai.x + 1.2, z: SPOTS.chai.z + 0.6, path: [], mode: 'chai' });
    s.people.ravi.mode = 'slice';
    // Meera is always making a reel, and she follows the noise.
    Object.assign(s.people.meera, { x: 101.5, z: -191.5, path: [], mode: 'sliceReel', target: 'cp' });
    s.crowd.cpWaiting = SLICE.crowd.from;
    // Cold open: you stand beside Constable Meena with her topi in your hand, and she has just noticed.
    Object.assign(pl, { x: meena.x - 2.2, z: meena.z + 0.6 });
    meena.topiAt = s.t; meena.mood = 'annoyed'; meena.annoyedAt = s.t;
    s.seq.topi = 1;
    s.events.length = 0; s.cues.length = 0; // the setup says nothing; the run starts with the chase
    startChase(s, 'c2', 'topi', { startle: 1.2, lines: 'chase-start-topi-1' });
    coach(s, 'open');
  }

  // --- what reaches the screen ---------------------------------------------------------------
  function coach(s, key) {
    if (s.slice.coached[key]) return;
    s.slice.coached[key] = s.t;
    say(s, 'coach', COACH[key], { key: `slice-${key}`, kind: 'slice', pos: s.player });
  }
  function bark(s, who, text, key) { say(s, who, text, { key: `slice-${key}` }); }
  const cutaway = (s, data) => REEL.cutaway(s, data);
  const pay = (s, n, why) => REEL.pay(s, s.slice, n, why);
  const moment = (s, kind, did, caused, followers) => REEL.moment(s, s.slice, kind, did, caused, followers);
  // The reel: dares first, then what they caused, one catch (the funniest bit), at most two bonus topis.
  const WEIGHT = { dare: 4, party: 3, shuttle: 3, caught: 2, bonus: 1 };
  const CAP = { caught: 1, bonus: 2 };
  const reel = (moments) => REEL.pick(moments, WEIGHT, CAP, 5);
  /** Aura you earn the usual ways (a dodge, an escape, a dare) turns into followers, labelled by what earned it. */
  function convertAura(s, why) {
    const sl = s.slice, r = s.player.rep;
    const d = r.aura - sl.aura;
    let got = 0;
    if (d > 0) got = pay(s, d * SLICE.perAura, why ?? 'aura');
    if (r.aura > 70) r.aura = 40; // keep headroom: the meter is clamped at 100
    sl.aura = r.aura;
    return got;
  }
  function dareDone(s, id) {
    const d = s.slice.dares.find((x) => x.id === id);
    if (!d || d.done) return false;
    d.done = true; d.at = Math.round(s.t * 10) / 10;
    addRep(s, { aura: 10 });
    return true;
  }
  const allDone = (s) => s.slice.dares.every((d) => d.done);
  const done = (s, id) => !!s.slice.dares.find((d) => d.id === id)?.done;

  // --- the chase, as a run of them -----------------------------------------------------------
  function caught(s, c) {
    const pl = s.player, sl = s.slice, why = s.memo.chase?.data?.why;
    s.chase = null; pl.chasedBy = null;
    pl.pinned = { until: s.t + SLICE.pinned, x: pl.x, z: pl.z };
    c.mode = 'post'; Object.assign(c, { x: pl.x + 1.2, z: pl.z }); c.path = [];
    // What you took goes back.
    if (pl.carrying === 'key') { const k = s.objects.key; k.holder = 'hook'; Object.assign(k, SPOTS.keyHook); pl.carrying = null; }
    sl.caught++;
    cue(s, 'caught', { pos: pl, data: { by: c.id, light: true, seconds: SLICE.pinned } });
    cue(s, 'crowd-laugh', { pos: pl, data: { who: 'player' } });
    if (sl.caught <= 2) bark(s, 'player', ['Sorry sir! Ek, do, teen...', 'Sir, selfie le lo, chhod do?'][sl.caught - 1], 'caught');
    const got = pay(s, 240, 'caught');
    if (sl.caught === 1 || why === 'key') cutaway(s, { who: 'player', title: 'Uthak-baithak, live', sub: why === 'key' ? 'Chabi wapas hook pe.' : 'Topi wapas.', followers: got });
    moment(s, 'caught', `${nameOf(c.id)} se panga liya`, 'Pachaas uthak-baithak, live', got);
    return true;
  }
  /** Each chase in a run is a little harder: a quicker constable who keeps going longer. */
  function tuneChase(s) {
    const ch = s.chase;
    if (!ch || ch.n != null) return;
    const n = s.slice.chases++;
    ch.n = n; ch.boost = Math.min(1.08, 1 + 0.02 * n); ch.tires = 22 + 2 * n; ch.loseAfter = Math.min(4, 3 + 0.15 * n);
    const by = s.player.chasedBy, sl = s.slice;
    sl.chase = { n, near: 0, by, why: ch.why };
    // An officer shouts the first time he chases you; after that the whistle says it (fewer words on screen).
    sl.shouted ??= {};
    if (sl.shouted[by]) s.events = s.events.filter((e) => !(e.who === by && String(e.key).startsWith('chase-start')));
    sl.shouted[by] = true;
  }

  // --- each tick -----------------------------------------------------------------------------
  function tick(s, dt) {
    const sl = s.slice, pl = s.player;
    if (sl.ended) return;
    tuneChase(s);
    // The bus stop fills up over the first seconds: by the time you know the chase, there is a crowd to hide in.
    const want = Math.min(SLICE.crowd.max, SLICE.crowd.from + Math.floor(s.t / SLICE.crowd.every));
    s.crowd.cpWaiting = want;
    const meera = s.people.meera;
    sl.multiplier = !meera.hidden && dist(meera, pl) <= SLICE.meera ? 2 : 1;
    // What just happened, from this tick's cues (each looked at once).
    let lost = null, near = false;
    for (const c of s.cues) {
      if (c.slice) continue;
      c.slice = true;
      if (c.cue === 'lunge') coach(s, 'lunge');
      if (c.cue === 'lunge-miss' && c.data?.near) { sl.nearMisses++; if (sl.chase) sl.chase.near++; near = true; }
      if (c.cue === 'chase-lost') lost = c;
    }
    if (lost) escaped(s, lost);
    convertAura(s, near ? 'bach gaya' : null);
    if (pl.chasedBy && crowdAt(s, 'cp') >= 6 && dist(pl, stop) < 25) coach(s, 'crowd');
    updateMeera(s, dt);
    updateRavi(s, dt);
    speakerAndParty(s, dt);
    keyAndIqbal(s);
    convertAura(s, pl.carrying === 'key' ? 'chabi' : null);
    if (allDone(s)) coach(s, 'bonus');
    if (s.t >= sl.length - 30) coach(s, 'late');
    if (s.t >= sl.length - 1e-9) end(s);
  }

  function escaped(s, c) {
    const sl = s.slice, pl = s.player, why = s.memo.chase?.data?.why, by = c.data?.by, near = sl.chase?.near ?? 0;
    sl.chase = null;
    if (why === 'topi') {
      sl.topis++;
      const bonus = allDone(s);
      const first = dareDone(s, 'topi');
      if (bonus) addRep(s, { aura: 6 });
      const got = convertAura(s, first ? 'dare' : bonus ? 'bonus' : 'escape');
      cutaway(s, { who: by, title: `${nameOf(by)} bina topi`, sub: first ? '"Meri topi! Sarkari property hai!"' : `Topi #${sl.topis}`, followers: got });
      if (first) { REEL.stamp(s, 'topi', got, pl); moment(s, 'dare', 'Meena ji ki topi udayi', 'Meena ji sar pakad ke khadi', got); }
      else moment(s, 'bonus', `${nameOf(by)} ki topi udayi`, near ? `${near} baar hawa pakdi` : `Topi #${sl.topis}`, got);
      if (first) sl.next = 'speaker';
      return;
    }
    if (why === 'key' && pl.carrying === 'key') {
      // Gayab: the key is in a pocket nobody will check, and Iqbal finishes his chai.
      s.objects.key.holder = 'gayab'; pl.carrying = null;
      dareDone(s, 'chabi');
      const got = convertAura(s, 'dare');
      cutaway(s, { who: 'iqbal', title: 'Chabi gayab', sub: 'Iqbal pocket pe pocket patak raha.', followers: got });
      REEL.stamp(s, 'chabi', got, pl);
      moment(s, 'dare', 'Iqbal ki chabi gayab ki', `${nameOf(by)} haath ghutno pe`, got);
      endIqbalBreak(s);
      sl.iqbalBack = true;
      return;
    }
    convertAura(s, 'escape');
  }

  function updateMeera(s, dt) {
    const m = s.people.meera, pl = s.player;
    if (m.mode !== 'sliceReel') return;
    // Every couple of seconds she re-frames: five metres off you, but she never leaves the CP stop's pavement.
    if ((s.slice.meeraT = (s.slice.meeraT ?? 0) - dt) > 0) return;
    s.slice.meeraT = 2;
    const sp = s.objects.speaker;
    const focus = sp.on && sp.holder === null && dist(sp, stop) <= SLICE.stop ? sp : pl;
    const d = dist(m, focus) || 1;
    let to = d > 6 ? { x: focus.x + (m.x - focus.x) * (5 / d), z: focus.z + (m.z - focus.z) * (5 / d) } : null;
    if (to) {
      const c = { x: 100, z: -192 }, r = dist(to, c);
      if (r > 22) to = { x: c.x + (to.x - c.x) * (22 / r), z: c.z + (to.z - c.z) * (22 / r) };
      m.path = [to];
    }
  }

  function stepTo(p, to, speed, dt) {
    const d = dist(p, to);
    if (d < 1e-6) return 0;
    const k = Math.min(1, (speed * dt) / d);
    p.x += (to.x - p.x) * k; p.z += (to.z - p.z) * k; p.path = [];
    return d;
  }
  const atStop = (sp) => sp.holder === null && sp.on && dist(sp, stop) <= SLICE.stop;
  /** Ravi: on his phone for three seconds after you lift his speaker, then after you, a bit faster than you carry it. */
  function updateRavi(s, dt) {
    const r = s.people.ravi, sp = s.objects.speaker, st = s.slice.ravi, pl = s.player;
    if (sp.holder === 'player') {
      if (st.phase === 'chai' || st.phase === 'dance' || st.phase === 'toDance') { st.phase = 'phone'; st.t = s.t; }
      if (st.phase === 'phone' && s.t - st.t >= SLICE.raviNotice) { st.phase = 'chase'; bark(s, 'ravi', 'Oye! Mera speaker!', 'ravi-notices'); }
      if (st.phase === 'chase' || st.phase === 'fetch') {
        st.phase = 'chase';
        stepTo(r, pl, SLICE.raviSpeed, dt);
        if (dist(r, pl) < 1.3) {
          sp.holder = 'ravi'; r.carrying = 'speaker'; pl.carrying = null; sp.on = false;
          s.slice.raviCaught++;
          bark(s, 'ravi', 'Wapas de! Stall pe chal.', 'ravi-reclaims');
          cue(s, 'crowd-laugh', { pos: pl, data: { who: 'player' } });
          st.phase = 'return'; r.path = [{ x: SPOTS.raviChai.x, z: SPOTS.raviChai.z }];
        }
      }
      return;
    }
    if (st.phase === 'return') {
      if (!r.path.length) {
        sp.holder = null; r.carrying = null; sp.on = false; Object.assign(sp, SPOTS.speakerChai);
        st.phase = 'chai';
      }
      return;
    }
    if (sp.holder !== null) return;
    if (atStop(sp)) {
      if (st.phase === 'phone' || st.phase === 'chase' || st.phase === 'fetch') { st.phase = 'toDance'; r.path = [{ x: sp.x - 1.6, z: sp.z + 1.2 }]; }
      if (st.phase === 'toDance' && !r.path.length) { st.phase = 'dance'; bark(s, 'ravi', 'Gaana toh mast hai yaar.', 'ravi-dances'); }
      return;
    }
    // Put down anywhere else: he walks over, picks it up, and takes it home.
    if (st.phase === 'phone' || st.phase === 'chase' || st.phase === 'fetch' || st.phase === 'dance' || st.phase === 'toDance') {
      if (st.phase !== 'fetch' && dist(sp, SPOTS.speakerChai) > 1.5 && st.phase !== 'dance') coach(s, 'notStop');
      st.phase = 'fetch';
      stepTo(r, sp, SLICE.raviSpeed, dt);
      if (dist(r, sp) < 1.2) {
        sp.holder = 'ravi'; r.carrying = 'speaker'; sp.on = false;
        st.phase = 'return'; r.path = [{ x: SPOTS.raviChai.x, z: SPOTS.raviChai.z }];
      }
    }
  }

  function speakerAndParty(s, dt) {
    const sl = s.slice, sp = s.objects.speaker, pl = s.player;
    if (sl.next === 'speaker' && !pl.chasedBy && !pl.pinned) { coach(s, 'speaker'); sl.next = null; }
    if (atStop(sp) && dareDone(s, 'speaker')) {
      const got = convertAura(s, 'dare');
      cutaway(s, { pos: { x: sp.x, z: sp.z }, title: 'CP stop pe DJ', sub: 'Ravi ka speaker. Bus stop naach raha.', followers: got });
      REEL.stamp(s, 'speaker', got, sp);
      moment(s, 'dare', 'Ravi ka speaker bus stop pe bajaya', 'Poora stop naachne laga', got);
      if (!sl.dares.find((d) => d.id === 'chabi').done) coach(s, 'chabi');
    }
    // At the stop the music pulls people in fast: a dance party within about six seconds.
    if (atStop(sp) && s.police.line !== 'cp') {
      sl.partyT += dt;
      while (sl.partyT >= SLICE.partyEvery) { sl.partyT -= SLICE.partyEvery; if (s.crowd.cpParty < SLICE.partyMax) s.crowd.cpParty++; }
    } else sl.partyT = 0;
    if (s.fired['cp-party'] && !sl.partyOn) {
      sl.partyOn = true;
      if (!sl.party) {
        sl.party = true;
        addRep(s, { aura: 8 });
        const got = convertAura(s, 'party');
        cutaway(s, { pos: { x: sp.x, z: sp.z }, title: 'Dance party', sub: 'Shuttle gaya kaam se.', followers: got });
        moment(s, 'party', 'Bus stop pe party shuru ki', `${s.crowd.cpParty} log naach rahe`, got);
      }
    } else if (!s.fired['cp-party']) sl.partyOn = false;
  }

  function keyAndIqbal(s) {
    const sl = s.slice, pl = s.player;
    // Carry the key past a constable at his post and he spots the DTC keychain.
    if (pl.carrying === 'key' && !pl.chasedBy && !pl.pinned) {
      const o = officers(s).filter((x) => !x.hidden && x.mode === 'post' && dist(x, pl) <= SLICE.keySpot).sort((a, b) => dist(a, pl) - dist(b, pl))[0];
      if (o) startChase(s, o.id, 'key');
      else coach(s, 'showKey');
    }
    // Iqbal back at the bus with no key on the hook: the shuttle sits.
    if (sl.iqbalBack && s.people.iqbal.mode === 'search' && !sl.stalled) {
      sl.stalled = true;
      addRep(s, { aura: 6 });
      const got = convertAura(s, 'shuttle');
      cutaway(s, { who: 'iqbal', title: 'Shuttle atak gaya', sub: '"Hook pe thi! Abhi yahin thi!"', followers: got });
      moment(s, 'shuttle', 'Iqbal hook tak pahuncha', 'Shuttle CP pe atak gaya', got);
    }
  }

  function end(s) {
    const sl = s.slice;
    sl.ended = true;
    s.player.chasedBy = null; s.chase = null;
    const o = { dares: sl.dares.filter((d) => d.done).length, caught: sl.caught, topis: sl.topis, party: sl.party, chabi: sl.dares[2].done, nearMisses: sl.nearMisses, followers: sl.followers, raviCaught: sl.raviCaught };
    sl.comments = REEL.comments(COMMENTS, o, 3);
    // The reel: the five biggest moments, in the order they happened.
    const top = reel(sl.moments);
    s.over = true;
    s.ending = 'reel';
    s.outcome = { slice: true, followers: sl.followers, dares: sl.dares.map((d) => ({ ...d })), moments: top, comments: sl.comments.slice(), caught: sl.caught, topis: sl.topis, nearMisses: sl.nearMisses };
    if (s.history) s.history['ending:reel'] = s.t;
    cue(s, 'slice:end', { pos: s.player, data: { followers: sl.followers } });
  }

  // --- what the player can do, and what the HUD suggests ----------------------------------------
  /** Extra things to try in the slice (rules.js affordances adds these): put the speaker down at the bus stop. */
  function affordances(s) {
    const out = [], pl = s.player;
    if (pl.carrying === 'speaker') out.push({ id: 'drop:busStop', kind: 'drop', cmd: { type: 'drop', x: stop.x - 2, z: stop.z }, at: { x: stop.x - 2, z: stop.z } });
    if (pl.carrying === 'key') for (const o of officers(s)) if (!o.hidden && o.mode === 'post' && dist(o, stop) < 40) out.push({ id: `show-key:${o.id}`, kind: 'go', cmd: null, at: { x: o.x + 2, z: o.z } });
    return out;
  }
  // The E prompt only offers what the slice is about.
  const KEEP = new Set(['take', 'drop', 'snatch', 'chase', 'give']);
  function trim(s, out) {
    for (let i = out.length - 1; i >= 0; i--) {
      const o = out[i];
      if (!KEEP.has(o.kind)) out.splice(i, 1);
      else if (o.kind === 'take' && !(o.cmd?.object === 'speaker' && !done(s, 'speaker')) && !(o.cmd?.object === 'key' && !done(s, 'chabi'))) out.splice(i, 1);
      else if (o.kind === 'give') out.splice(i, 1);
    }
    return out;
  }

  /** What the HUD needs, or null on a normal day. */
  function view(s) {
    const sl = s.slice;
    if (!sl) return null;
    return {
      left: Math.max(0, sl.length - s.t), followers: sl.followers, multiplier: sl.multiplier,
      dares: sl.dares.map((d) => ({ ...d })), bonus: sl.dares.every((d) => d.done), bonusText: BONUS_TEXT, topis: sl.topis,
      ravi: sl.ravi.phase, caught: sl.caught,
    };
  }

  return { setup, tick, caught, affordances, trim, view, topiAgain: SLICE.topiAgain };
}
