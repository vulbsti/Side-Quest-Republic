// The 10-minute day's mischief list, followers and end reel (createDay({ mischief: { loop } })).
// Five or six dares are on screen from the first second, each one a side story, link or set piece the engine
// already has (the topi chase, Ravi's speaker at the CP stop, Nikhil, Iqbal's key, Sana's water, the kabaddi raid,
// the water cannon dance, the window escape, the megaphone roast...). They are spread over the day's phases and the
// map, so one can always be done now, and a new, harder set comes on later loops. Every aura point the player earns
// turns into followers (doubled near Meera's camera), as in the slice; a dare pays on top, with a stamp, a pop and a
// cutaway (reel.js). At 18:00 the day ends on a reel: moments, views, total, best, three comments, plus the ending's
// headline and the player's role in one line each.
// Pure engine code (no DOM). State lives in the day (s.mischief); rules.js hands in its helpers.
import { createReel, PER_AURA } from './reel.js';
import { createDirector } from './director.js';

// Another workstream may add one physical dare at each fast-travel destination (dist/loop/places.js). If rules.js
// hands its list in (createMischief({ ..., placeDares }), each { id, text, at?, from?, done(s, cue) }), one of them
// joins each loop's list. Nothing here depends on it.

export const MISCHIEF = {
  meera: 15, // metres: inside this, Meera's camera doubles what you earn
  dare: 1800, // followers a dare pays on top of its aura
  perAura: PER_AURA,
};

// A dare: id, text (short Hinglish), at (a fast-travel destination where it happens), from (the phase it opens),
// and done(s, cue): true when it is done. cue is one engine cue at a time (or null once a tick, for state checks).
const why = (s) => s.memo.chase?.data?.why;
const lost = (c, s, w) => c?.cue === 'chase-lost' && why(s) === w;
const speakerAt = (s, P, place) => { const sp = s.objects.speaker; return sp.holder === null && sp.on && Math.hypot(sp.x - P[place].x, sp.z - P[place].z) <= P[place].r; };
const charging = (s) => !!s.police.charge && !s.police.charge.over;

/** The day's dares, by loop: the first loop is gentle; later ones ask for more of the same set pieces. */
export const DARE_SETS = [
  [
    { id: 'topi', text: 'Constable ki topi uda. Pakde mat jaana.', at: 'metro', from: 'morning', done: (s, c) => lost(c, s, 'topi') },
    { id: 'speaker', text: 'Ravi ka speaker CP stop pe bajao.', at: 'cp', from: 'morning', done: (s, c, P) => !c && speakerAt(s, P, 'cp') },
    { id: 'nikhil', text: 'Khoya Nikhil, Kabir tak pahunchao.', at: 'metro', from: 'morning', done: (s, c) => !c && s.nikhilFound },
    { id: 'chabi', text: 'Iqbal ki chabi gayab karo.', at: 'cp', from: 'midday', done: (s, c) => (!c && s.bus.stalled) || lost(c, s, 'key') },
    { id: 'paani', text: 'Paani ka crate Sana ke tent tak.', at: 'cp', from: 'midday', done: (s, c) => !c && !!s.memo.water },
    { id: 'kabaddi', text: 'Police se kabaddi. Raid jeeto.', at: 'stage', from: 'midday', done: (s, c) => c?.cue === 'action:kabaddi:win' },
  ],
  [
    { id: 'topi2', text: 'Do topiyan. Zero uthak-baithak.', at: 'cp', from: 'morning', done: (s, c, P, m) => !c && m.topis >= 2 && !m.caught },
    { id: 'party', text: 'CP stop pe party, Meera ke reel mein.', at: 'cp', from: 'morning', done: (s, c) => !c && !!s.fired['meera-reel'] },
    { id: 'crew', text: 'Crew bana, road pe dharna.', at: 'stage', from: 'midday', done: (s, c) => c?.cue === 'crew-block' },
    { id: 'window', text: 'Pakde jao. Khidki se bhaago.', at: 'stage', from: 'midday', done: (s, c) => c?.cue === 'action:window:win' },
    { id: 'cannon', text: 'Water cannon mein naacho.', at: 'barricade', from: 'tense', done: (s, c) => c?.cue === 'cannon-dance' },
    { id: 'charge', text: 'Lathi charge mein chase jeeto.', at: 'stage', from: 'showdown', done: (s, c) => c?.cue === 'chase-lost' && charging(s) },
  ],
  [
    { id: 'topi3', text: 'Teen topiyan. Teen!', at: 'stage', from: 'morning', done: (s, c, P, m) => !c && m.topis >= 3 },
    { id: 'dodge3', text: 'Kabaddi raid, teen dodge ke saath.', at: 'stage', from: 'midday', done: (s, c) => c?.cue === 'action:kabaddi:win' && (c.data?.dodges ?? 0) >= 3 },
    { id: 'roast', text: 'Megaphone Kabir ko. Roast karwao.', at: 'stage', from: 'midday', done: (s, c) => !c && s.moment === 'roast' },
    { id: 'busKey', text: 'Detention bus ki chabi uda lo.', at: 'stage', from: 'tense', done: (s, c) => !c && !!s.memo['key-detention'] },
    { id: 'thela', text: 'Bhagta thela roko, phir chadh jao.', at: 'cp', from: 'morning', done: (s, c) => c?.cue === 'action:cart:win' && c.data?.ride },
    { id: 'shak', text: 'Shakki constable se bach ke dikhao.', at: 'parliament', from: 'midday', done: (s, c) => c?.cue === 'action:shak:win' },
  ],
];
/** The set for a loop (1, 2, 3...). Loops past the last set cycle the harder two. */
export function dareSet(loop = 1, placeDares = []) {
  const n = Math.max(1, Math.floor(loop) || 1);
  const i = n <= DARE_SETS.length ? n - 1 : 1 + ((n - 2) % (DARE_SETS.length - 1));
  const list = DARE_SETS[i].slice();
  const extra = (placeDares || []).filter((d) => d && d.id && d.text && typeof d.done === 'function');
  // Two place dares a loop, if places.js is wired in: a reason to hop across the map. Each loop brings the next two.
  for (let k = 0; k < Math.min(2, extra.length); k++) list.push(extra[((n - 1) * 2 + k) % extra.length]);
  return list;
}

// Which of the player's commands (rules.js affordances) work towards a dare: bots lean on these, and so can a hint.
const take = (a, id) => a.kind === 'take' && a.cmd?.object === id;
const SERVES = {
  topi: (a) => a.kind === 'snatch', topi2: (a) => a.kind === 'snatch', topi3: (a) => a.kind === 'snatch',
  speaker: (a) => take(a, 'speaker') || a.id === 'drop:cp', party: (a) => take(a, 'speaker') || a.id === 'drop:cp',
  nikhil: (a) => a.id === 'talk:nikhil', chabi: (a) => take(a, 'key'), busKey: (a) => take(a, 'key'),
  paani: (a) => take(a, 'water') || a.id === 'drop:sanaTent' || a.id === 'give:sana',
  kabaddi: (a) => a.kind === 'raid', dodge3: (a) => a.kind === 'raid',
  crew: (a) => a.kind === 'rally' || a.id.startsWith('block:'), window: (a) => a.kind === 'window',
  cannon: (a) => a.kind === 'pester' && a.cmd?.how === 'cannon', roast: (a) => take(a, 'megaphone') || a.id === 'give:kabir',
  thela: (a) => a.kind === 'incident', shak: (a) => a.kind === 'incident',
};
/** Does this affordance work towards a dare still open on the day's list? */
export function daresServed(s, a) {
  const m = s.mischief;
  return !!m && m.dares.some((d) => !d.done && SERVES[d.id]?.(a));
}

// What reached the reel from the rest of the day: engine cues that are moments worth a clip.
const MOMENTS = {
  'chase-lost': (s, c) => (why(s) === 'topi' ? ['topi', 'Topi leke bhaag gaya', `${c.data?.how === 'crowd' ? 'Bheed mein gayab' : c.data?.how === 'whiffs' ? 'Teen baar hawa pakdi' : 'Uncle haath ghutno pe'}`] : null),
  'action:kabaddi:win': () => ['game', 'Police se kabaddi jeeti', 'Bheed: "KABADDI KABADDI!"'],
  'action:window:win': () => ['game', 'Bus ki khidki se kooda', '1 minute later: gayab'],
  'cannon-dance': () => ['set', 'Water cannon mein naacha', 'Poori sadak Holi khel rahi'],
  'bus-stalled': () => ['set', 'Shuttle ki chabi gayab', 'Iqbal pocket pe pocket patak raha'],
  'crew-block': () => ['set', 'Crew ne road roki', 'Traffic ka dimaag kharab'],
  'detainees-escape': () => ['set', 'Bus se sab bhaage', 'Pandey ji ka break khatam'],
  'caught': (s, c) => (c.data?.light ? ['caught', 'Pakda gaya', 'Uthak-baithak, live, 4K'] : null),
};
const WEIGHT = { dare: 4, incident: 3, set: 3, game: 3, topi: 2, caught: 2 };
const CAP = { caught: 1, topi: 2, incident: 3 };
const WHY = { 'lunge-miss': 'bach gaya', 'chase-lost': 'escape', 'action:kabaddi:win': 'kabaddi', 'action:window:win': 'escape', 'cannon-dance': 'party', 'crew-block': 'dharna' };
// Reel comments, by what you did. The first three that apply.
const COMMENTS = [
  [(o) => o.dares >= 5, 'poori list?? bhai ko Padma Shri do'],
  [(o) => o.dares >= 3 && o.dares < 5, 'aadhi list, poora attitude'],
  [(o) => o.incidents >= 3, 'trouble isko dhoondh ke aata hai'],
  [(o) => o.caught >= 2, 'bhai ka cardio Delhi Police karwa rahi hai'],
  [(o) => o.caught === 1, 'uthak-baithak form 10/10, gym wale ro rahe'],
  [(o) => o.topis >= 3, 'topi collection > mera career'],
  [(o) => o.ride, 'thele pe drift. Fast and Furious: Chandni Chowk'],
  [(o) => o.kabaddi, 'PKL scouts DM check karo'],
  [(o) => o.window, 'khidki se exit. Dhoom 4 ka audition?'],
  [(o) => o.cannon, 'water cannon mein Holi?? peak Delhi'],
  [(o) => o.followers >= 40000, 'ye banda 2026 ka main character hai'],
  [(o) => o.dares === 0, 'bhai ne poora din sirf chai pi'],
  [() => true, 'Delhi Police ko bhi follow kar le bhai'],
  [() => true, 'kal phir? kal phir.'],
  [() => true, 'Jantar Mantar ka asli influencer'],
];

export function createMischief(api) {
  const { dist, PLACES, DESTINATIONS, cue, say, phaseAt, PHASES, placeDares = [] } = api;
  const REEL = createReel({ cue });
  const PHASE_I = Object.fromEntries(PHASES.map(([id], i) => [id, i]));

  // --- followers ---------------------------------------------------------------------------
  const score = {
    /** Pay followers for something (times Meera's camera). */
    pay: (s, n, why, pos) => REEL.pay(s, s.mischief, n, why, pos),
    moment: (s, kind, did, caused, followers) => REEL.moment(s, s.mischief, kind, did, caused, followers),
    cutaway: (s, data) => REEL.cutaway(s, data),
    /** A short line on the HUD (the slice's bark channel): six words or fewer. */
    coach: (s, text, key) => say(s, 'coach', text, { key: `day-${key}`, kind: 'slice', pos: s.player }),
  };
  const DIRECTOR = createDirector({ ...api, score });

  function setup(s, opts = {}) {
    const loop = Math.max(1, Math.floor(opts.loop ?? 1) || 1);
    s.mischief = {
      loop, followers: 0, multiplier: 1, auraIn: 0, moments: [], comments: [],
      dares: dareSet(loop, placeDares).map((d) => ({ id: d.id, text: d.text, at: d.at ?? null, from: d.from ?? 'morning', done: false, t: null })),
      topis: 0, caught: 0, incidents: 0, flags: {}, reel: null,
    };
    DIRECTOR.setup(s);
  }
  const defs = (s) => { const set = dareSet(s.mischief.loop, placeDares); return Object.fromEntries(set.map((d) => [d.id, d])); };

  function dareDone(s, d, pos) {
    const m = s.mischief;
    d.done = true; d.t = Math.round(s.t * 10) / 10;
    const got = score.pay(s, MISCHIEF.dare, 'dare', pos);
    REEL.stamp(s, d.id, got, pos ?? s.player);
    REEL.cutaway(s, { who: 'player', title: 'Dare done', sub: d.text, followers: got });
    score.moment(s, 'dare', d.text.replace(/\.$/, ''), `+${got} followers`, got);
    if (m.dares.every((x) => x.done)) score.coach(s, 'Poori list! Ab bonus trouble.', 'all');
  }

  function tick(s, dt) {
    const m = s.mischief;
    if (!m || s.over) return;
    const pl = s.player, meera = s.people.meera;
    m.multiplier = !meera.hidden && meera.mode !== 'detained' && dist(meera, pl) <= MISCHIEF.meera ? 2 : 1;
    DIRECTOR.tick(s, dt);
    // This tick's cues, each looked at once: dares, moments, and what to call the aura they earned.
    const D = defs(s);
    let label = null;
    for (const c of s.cues) {
      if (c.mischief) continue;
      c.mischief = true;
      if (c.cue === 'chase-lost' && why(s) === 'topi') m.topis++;
      if (c.cue === 'caught' && c.data?.light) m.caught++;
      if (c.cue === 'action:cart:win' && c.data?.ride) m.flags.ride = true;
      if (c.cue === 'action:kabaddi:win') m.flags.kabaddi = true;
      if (c.cue === 'action:window:win') m.flags.window = true;
      if (c.cue === 'cannon-dance') m.flags.cannon = true;
      label = WHY[c.cue] ?? label;
      for (const d of m.dares) if (!d.done && D[d.id]?.done(s, c, PLACES, m)) dareDone(s, d, c.pos ?? pl);
      const mo = MOMENTS[c.cue]?.(s, c);
      if (mo && (!c.pos || dist(c.pos, pl) <= 30)) { // only what happened around the player
        const got = Math.round(m.auraIn * MISCHIEF.perAura * m.multiplier);
        score.moment(s, mo[0], mo[1], mo[2], Math.max(got, 300));
        if (mo[0] !== 'caught' && mo[0] !== 'topi') REEL.cutaway(s, { pos: c.pos ?? pl, title: mo[1], sub: mo[2], followers: got });
      }
    }
    for (const d of m.dares) if (!d.done && D[d.id]?.done(s, null, PLACES, m)) dareDone(s, d, pl);
    // Aura earned the usual ways (a dodge, an escape, a laugh) turns into followers.
    if (m.auraIn > 0) { score.pay(s, m.auraIn * MISCHIEF.perAura, label ?? 'aura'); m.auraIn = 0; }
  }

  /** 18:00: the reel, after the ending card (rules.js finish). */
  function end(s) {
    const m = s.mischief;
    DIRECTOR.end(s);
    const card = s.outcome || {};
    const o = { dares: m.dares.filter((d) => d.done).length, caught: m.caught, topis: m.topis, incidents: m.incidents, followers: m.followers, ...m.flags };
    m.comments = REEL.comments(COMMENTS, o, 3);
    m.reel = {
      followers: m.followers, moments: REEL.pick(m.moments, WEIGHT, CAP, 5), comments: m.comments.slice(),
      dares: m.dares.map((d) => ({ id: d.id, text: d.text, done: d.done })),
      headline: (card.headline ?? card.title ?? '').replace(/^"|"$/g, ''),
      role: card.roleTitle ? `${card.roleTitle}: ${card.roleText ?? ''}`.trim() : '',
      loop: m.loop,
    };
    cue(s, 'slice:end', { pos: s.player, data: { followers: m.followers, day: true } });
  }

  /** What the HUD needs (slice-ui.js), or null when the day has no mischief list. */
  function view(s) {
    const m = s.mischief;
    if (!m) return null;
    const ph = PHASE_I[phaseAt(s.t)] ?? 0;
    const open = (d) => !d.done && (PHASE_I[d.from] ?? 0) <= ph;
    const now = m.dares.find(open) ?? null;
    return {
      kind: 'day', followers: m.followers, multiplier: m.multiplier,
      dares: m.dares.map((d) => ({ id: d.id, text: d.text, done: d.done, open: open(d), now: d === now, at: d.at, where: DESTINATIONS[d.at]?.name ?? null })),
      bonus: m.dares.every((d) => d.done), bonusText: 'Bonus: trouble dhoondo.', topis: m.topis,
      incident: DIRECTOR.view(s), loop: m.loop,
    };
  }

  return {
    setup, tick, end, view, score,
    act: (s, cmd) => DIRECTOR.act(s, cmd),
    caught: (s, c) => DIRECTOR.caught(s, c),
    affordances: (s) => DIRECTOR.affordances(s),
    opportunities: (s) => DIRECTOR.opportunities(s),
    target: (s, cmd) => DIRECTOR.target(s, cmd),
  };
}
