// Bot days played tick by tick so we can say how the time was spent: in a skill moment, reading a card, sitting
// in the bus, walking about. Uses the verifier's personalities and the same driver as the client and the replays.
import * as H from '../../verify/lib/harness.mjs';
import { PERSONAS } from '../../verify/lib/bots.mjs';
import { rng } from '../../verify/lib/explore.mjs';
import { createDriver, STEP, JOG } from '../../dist/loop/drive.js';

const { R } = H;
export const SPRINT = 8.1; // the client's sprint, m/s (simulation.js)
// Engine cues that mark a skill moment. New low-level games emit action:<game>:start|win|fail.
const ACTION_START = (c) => c === 'chase-start' || /^action:[\w-]+:start$/.test(c);
export const gameOf = (c) => (c === 'chase-start' ? 'chase' : c.split(':')[1]);
// Set pieces: things that happen in the street that you can watch.
const SPECTACLE = new Set(['arrival-wave', 'raf-arrive', 'barricades-up', 'cannon-roll', 'cannon-spray', 'cannon-dance', 'gas-fired', 'charge-start', 'stone-thrown', 'sena-bikes', 'party-suv', 'ambulance', 'bus-stalled', 'detainees-escape', 'faint']);
// What uses the body: everything on offer except talking, whispering, pestering and answering cards.
const TALKY = new Set(['talk', 'whisper', 'pester', 'say', 'leave', 'situation', 'plead', 'stance', 'provocateur']);
const ON_SCREEN = new Set(['bubble', 'officer', 'player', 'toast', 'radio', 'bark', 'convo']);
const PHONE = new Set(['feed', 'chat', 'ticker', 'stream']);

function choose(persona, s, rand, tried) {
  const affs = R.affordances(s);
  const w = affs.map((a) => Math.max(0, persona.weight(a, s, tried)));
  const sum = w.reduce((n, v) => n + v, 0);
  let x = rand() * (sum + persona.wait * (affs.length ? Math.max(1, sum / 3) : 1));
  for (let i = 0; i < affs.length; i++) {
    x -= w[i];
    if (x <= 0) { const a = affs[i]; tried.set(a.id, (tried.get(a.id) || 0) + 1); return a.cmd ? { do: a.id, cmd: a.cmd, at: a.at } : { do: a.id, cmd: null, at: a.at, hold: 3 }; }
  }
  return { wait: persona === PERSONAS.idle ? 30 : 4 + Math.floor(rand() * 12) };
}

/** One bot day, sampled every tick. */
export function timedDay(name, seed = 1) {
  const persona = PERSONAS[name], rand = rng(seed * 7919 + name.length), tried = new Map();
  const run = H.newRun('long'), s = run.s;
  const drv = createDriver(R, [], {}, { sight: H.SIGHT });
  const time = { action: 0, reading: 0, detained: 0, free: 0 };
  const beats = [], games = new Set(), spectacle = new Set(), caughtAt = [], freedAfter = [];
  let near = 0, nearPhysical = 0, offered = 0, offeredPhysical = 0, k = 0;
  let wasDetained = false, detainedSince = 0;
  while (!s.over) {
    if (drv.done || drv.index < 0) drv.push(choose(persona, s, rand, tried));
    const cmd = drv.before(s);
    if (cmd) { try { R.act(s, cmd); } catch (e) { run.crashed = e.message; break; } }
    // Cues are drained by observe(); look at them first.
    for (const c of s.cues) {
      if (ACTION_START(c.cue)) { beats.push(s.t); games.add(gameOf(c.cue)); }
      if (SPECTACLE.has(c.cue) && c.pos && R.dist(c.pos, s.player) <= 30) spectacle.add(c.cue);
      if (c.cue === 'caught') caughtAt.push(s.t);
    }
    H.observe(run);
    R.tick(s, STEP);
    const pl = s.player;
    const mode = pl.detained ? 'detained' : s.story.convo ? 'reading' : pl.chasedBy || s.raid || s.action ? 'action' : 'free';
    time[mode] += STEP;
    if (pl.detained && !wasDetained) detainedSince = s.t;
    if (!pl.detained && wasDetained) freedAfter.push(s.t - detainedSince);
    wasDetained = pl.detained;
    // Every 5 real seconds: what is there to do right here, and what is on offer at all.
    if (++k % 50 === 0 && mode === 'free') {
      const opp = R.opportunities(s, pl, 10).filter((o) => o.d <= 10 && o.kind !== 'go');
      near++;
      if (opp.some((o) => !TALKY.has(o.kind))) nearPhysical++;
      const affs = R.affordances(s);
      offered += affs.length; offeredPhysical += affs.filter((a) => !TALKY.has(a.kind)).length;
    }
  }
  H.finishDay(run);
  const seen = run.log.filter((i) => i.seen && i.text && (ON_SCREEN.has(i.channel) || PHONE.has(i.channel)));
  const onScreen = seen.filter((i) => ON_SCREEN.has(i.channel));
  const total = Object.values(time).reduce((a, b) => a + b, 0) || 1;
  const charge = s.history['cue:charge-start'] ?? null;
  // A few conversations as the player saw them, for the humour judge.
  const scenes = [];
  for (const i of run.log) {
    if (i.channel !== 'convo' || !i.text) continue;
    const last = scenes.at(-1);
    if (last && i.t - last.t < 20) { last.lines.push(`${i.who}: ${i.text}`); last.t = i.t; } else scenes.push({ t: i.t, lines: [`${i.who}: ${i.text}`] });
  }
  return {
    name, seed, crashed: run.crashed ?? null,
    seconds: total, time, shares: Object.fromEntries(Object.entries(time).map(([k2, v]) => [k2, v / total])),
    firstAction: beats.length ? beats[0] : null, beats: beats.length, games: [...games],
    spectacle: [...spectacle], caught: caughtAt.length, freedAfter,
    wordsPerMinute: seen.reduce((n, i) => n + i.text.split(/\s+/).length, 0) / (total / 60),
    narration: onScreen.length ? onScreen.filter((i) => i.who === 'street').length / onScreen.length : 0,
    screenRepeat: onScreen.length ? 1 - new Set(onScreen.map((i) => i.text)).size / onScreen.length : 0,
    physicalNearby: near ? nearPhysical / near : 0, physicalOffered: offered ? offeredPhysical / offered : 0,
    ending: s.ending, showdown: s.director?.hotspot ?? null, outcome: s.outcome?.outcome ?? null,
    chargeMinute: charge == null ? null : R.clockMinutes(charge), callbacks: s.outcome?.callbacks?.length ?? 0,
    convoSample: scenes.filter((x) => x.lines.length >= 3).slice(0, 3).map((x) => x.lines),
    milestones: Object.keys(s.history).filter((x) => /^(rule|callback|situation|flag):/.test(x)),
  };
}

/**
 * Chase probe: steal the bus key under an officer's nose at several times of day, then run four ways for up to a
 * minute: stand still, jog straight away, sprint straight away, and jog for the nearest crowd. A chase with no
 * skill in it is one where sprinting straight always works; a chase with depth rewards using the street.
 */
export function chaseProbe(times = [[10, 20], [10, 50], [11, 20], [11, 50], [12, 20], [12, 50], [13, 20], [13, 50], [14, 20], [14, 50], [15, 20], [15, 50]]) {
  const base = H.newRun('long');
  const out = { stand: [], jog: [], sprint: [], crowd: [] };
  for (const [h, m] of times) {
    H.waitMinutes(base, Math.max(0, (R.at(h, m) - base.s.t) / R.SECONDS_PER_MINUTE));
    for (const policy of Object.keys(out)) {
      const run = H.cloneRun(base), s = run.s, pl = s.player;
      if (pl.detained || s.over) continue;
      const key = s.objects.key;
      if (!R.isFree(key)) { out[policy].push('no-key'); continue; }
      Object.assign(pl, { x: key.x + 0.5, z: key.z });
      const cop = [s.people.sharma, ...Object.values(s.officers)].filter((o) => !o.hidden).sort((a, b) => R.dist(a, pl) - R.dist(b, pl))[0];
      if (!cop) { out[policy].push('no-police'); continue; }
      Object.assign(cop, { x: pl.x + 6, z: pl.z, path: [] });
      R.act(s, { type: 'take', object: 'key', witnesses: [cop.id] });
      if (!pl.chasedBy) { out[policy].push('no-chase'); continue; }
      let result = 'timeout';
      for (let t = 0; t < 60 && !s.over; t += STEP) {
        const c = R.officerById(s, pl.chasedBy);
        if (c && policy !== 'stand') {
          let tx, tz;
          if (policy === 'crowd') {
            const place = Object.keys(R.CROWD_CENTERS).filter((p) => R.crowdAt(s, p) >= 6).sort((a, b) => R.dist(pl, R.CROWD_CENTERS[a]) - R.dist(pl, R.CROWD_CENTERS[b]))[0];
            const at = place ? R.CROWD_CENTERS[place] : { x: pl.x + (pl.x - c.x), z: pl.z + (pl.z - c.z) };
            tx = at.x - pl.x; tz = at.z - pl.z;
          } else { tx = pl.x - c.x; tz = pl.z - c.z; }
          const d = Math.hypot(tx, tz) || 1, v = (policy === 'sprint' ? SPRINT : JOG) * STEP;
          if (d > 0.3) { pl.x += (tx / d) * Math.min(v, d); pl.z += (tz / d) * Math.min(v, d); }
        }
        pl.unseen = H.SIGHT.lost(s);
        R.tick(s, STEP);
        if (pl.detained) { result = 'caught'; break; }
        if (!pl.chasedBy) { result = 'lost'; break; }
      }
      out[policy].push(result);
    }
  }
  const rate = (list) => { const real = list.filter((r) => ['caught', 'lost', 'timeout'].includes(r)); return real.length ? real.filter((r) => r === 'lost').length / real.length : null; };
  const rates = Object.fromEntries(Object.entries(out).map(([k2, v]) => [k2, rate(v)]));
  const naive = Math.max(rates.jog ?? 0, rates.sprint ?? 0);
  return { runs: out, rates, challenge: rates.sprint == null ? null : 1 - rates.sprint, skill: rates.crowd == null ? null : Math.max(0, rates.crowd - naive) };
}
