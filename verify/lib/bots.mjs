// Bot players with different personalities play whole days, and we measure what the day felt like from
// what reached their screen: how often lines repeat, how distinct the police are, how much there was to
// do, how long nothing new happened, how busy the phone was, and how different their days turned out.
import * as H from './harness.mjs';
import { rng } from './explore.mjs';

const { R } = H;
const STORY = new Set(['scene', 'scene-choice', 'take', 'give', 'film', 'provocateur', 'rally', 'plead', 'stance']);
const ON_SCREEN = new Set(['bubble', 'officer', 'player', 'toast', 'radio']);
const PHONE = new Set(['feed', 'chat', 'ticker', 'stream']);

// weight(a, s) for each affordance; wait: weight of standing around for a while.
export const PERSONAS = {
  idle: { about: 'Stands at the metro exit all day', wait: 1, weight: () => 0 },
  random: { about: 'Does anything at all, at random', wait: 0.3, weight: () => 1 },
  helpful: {
    about: 'Returns things, finds Nikhil, brings water, exposes provocateurs, picks kind choices',
    wait: 0.4,
    weight: (a, s) => ({ give: 6, 'scene-choice': 4, scene: 3, film: 1, talk: a.cmd?.to === 'nikhil' ? 6 : 1.2, take: a.cmd?.object === 'water' ? 5 : 0.4, provocateur: a.cmd?.how === 'expose' ? 6 : a.cmd?.how === 'report' ? 2 : 0, pester: a.cmd?.how === 'career' ? 0.3 : 0.05, whisper: 0, drop: a.id === 'drop:sanaTent' ? 3 : 0.1, stance: a.cmd?.stance === 'protect' ? 3 : 0 }[a.kind] ?? 0.2),
  },
  chaotic: {
    about: 'Steals keys and speakers, spreads rumours, pesters police, joins provocateurs, blocks roads',
    wait: 0.3,
    weight: (a) => ({ take: ['key', 'speaker', 'megaphone'].includes(a.cmd?.object) ? 5 : 1, whisper: 2, pester: a.cmd?.how === 'detainme' || a.cmd?.how === 'cannon' ? 2 : 1, provocateur: a.cmd?.how === 'join' ? 6 : 0.5, rally: 4, go: a.id.startsWith('block') || a.id === 'lane' ? 4 : 0.5, stance: a.cmd?.stance === 'block' ? 3 : 0.3, drop: a.id === 'drop:cp' ? 3 : 0.5, scene: 2, 'scene-choice': 2, film: 1, talk: 0.3, give: 0.1 }[a.kind] ?? 0.3),
  },
  filmer: {
    about: 'Films whatever happens and follows the crowd',
    wait: 0.5,
    weight: (a, s) => ({ film: 10, go: a.id.startsWith('hide') && a.id.endsWith(s.director.hotspot) ? 3 : 0.2, talk: a.cmd?.to === 'zoya' || a.cmd?.to === 'meera' ? 1.5 : 0.3, scene: 2, 'scene-choice': 2, provocateur: a.cmd?.how === 'expose' ? 3 : 0 }[a.kind] ?? 0.05),
  },
  explorer: { about: 'Tries whatever it has not tried yet', wait: 0.2, weight: (a, s, tried) => 1 / (1 + 3 * (tried.get(a.id) || 0)) },
};

function choose(persona, run, rand, tried) {
  const affs = R.affordances(run.s);
  const w = affs.map((a) => Math.max(0, persona.weight(a, run.s, tried)));
  const total = w.reduce((n, v) => n + v, 0) + persona.wait * (affs.length ? Math.max(1, w.reduce((n, v) => n + v, 0) / 3) : 1);
  let x = rand() * total;
  for (let i = 0; i < affs.length; i++) { x -= w[i]; if (x <= 0) { const a = affs[i]; tried.set(a.id, (tried.get(a.id) || 0) + 1); return a.cmd ? { do: a.id, cmd: a.cmd, at: a.at } : { do: a.id, cmd: null, at: a.at, hold: 3 }; } }
  return { wait: persona === PERSONAS.idle ? 30 : 4 + Math.floor(rand() * 12) };
}

/** One bot day. Returns the run and what was measured. */
export function playDay(name, { seed = 1, tempo = 'long' } = {}) {
  const persona = PERSONAS[name], rand = rng(seed * 7919 + name.length), tried = new Map();
  const run = H.newRun(tempo);
  const acts = [], affSeen = new Map();
  while (!run.s.over) {
    for (const a of R.affordances(run.s)) if (STORY.has(a.kind) && !affSeen.has(a.id)) affSeen.set(a.id, run.s.t);
    const step = choose(persona, run, rand, tried);
    const out = H.perform(run, step);
    if (out.crash) break;
    if (step.cmd) acts.push({ t: run.s.t, clock: H.clock(run.s), cmd: step.cmd, ok: !!out.r?.ok, silent: !!out.silent, raw: out.raw, line: out.r?.line ?? null, repeat: !!out.r?.repeat });
  }
  return { name, seed, tempo, run, acts, affSeen, crash: run.crashed ?? null, metrics: run.crashed ? null : measure(run, acts, affSeen) };
}

export function measure(run, acts, affSeen) {
  const s = run.s, log = run.log, spm = R.SECONDS_PER_MINUTE, hours = (R.DAY_END - R.DAY_START) / 60;
  const screen = log.filter((i) => i.seen && ON_SCREEN.has(i.channel) && i.text);
  const texts = screen.map((i) => i.text);
  const distinct = new Set(texts);
  const talks = acts.filter((a) => a.cmd.type === 'talk' && a.line);
  const heard = new Set();
  let talkRepeats = 0;
  for (const a of talks) { if (a.repeat || heard.has(a.line)) talkRepeats++; heard.add(a.line); }
  const phone = log.filter((i) => PHONE.has(i.channel) && i.text);
  // Longest stretch with nothing new on screen or phone, in real seconds at this tempo.
  const fresh = [], seenText = new Set();
  for (const i of log) if (i.seen && i.text && (ON_SCREEN.has(i.channel) || PHONE.has(i.channel)) && !seenText.has(i.text)) { seenText.add(i.text); fresh.push(i.t); }
  fresh.push(s.t);
  let gap = fresh[0], gapAt = 0;
  for (let i = 1; i < fresh.length; i++) if (fresh[i] - fresh[i - 1] > gap) { gap = fresh[i] - fresh[i - 1]; gapAt = fresh[i - 1]; }
  // Longest stretch with no new thing to do (a new story affordance: a scene, an object, a provocateur...).
  const newTimes = [...affSeen.values(), s.t].sort((a, b) => a - b);
  let idle = newTimes[0], idleAt = 0;
  for (let i = 1; i < newTimes.length; i++) if (newTimes[i] - newTimes[i - 1] > idle) { idle = newTimes[i] - newTimes[i - 1]; idleAt = newTimes[i - 1]; }
  return {
    ending: s.ending, outcome: s.outcome?.outcome, role: s.outcome?.role, callbacks: s.outcome?.callbacks.length ?? 0,
    acts: acts.length, actsOk: acts.filter((a) => a.ok).length, silentActs: acts.filter((a) => a.silent).length,
    screenLines: texts.length, screenDistinct: distinct.size,
    lineRepeat: texts.length ? 1 - distinct.size / texts.length : 0,
    talks: talks.length, talkRepeat: talks.length ? talkRepeats / talks.length : 0,
    phonePerHour: phone.length / hours, phoneDistinct: new Set(phone.map((i) => i.text)).size,
    storyThingsPerHour: affSeen.size / hours,
    longestQuietSeconds: Math.round(gap), longestQuietAt: R.clockText(gapAt),
    longestNothingNewSeconds: Math.round(idle), longestNothingNewAt: R.clockText(idleAt),
    milestones: Object.keys(s.history).filter((k) => /^(rule|callback|scene|flag):/.test(k)).sort(),
    secondsPerMinute: spm,
  };
}

/** Walk up to every officer at 14:30 and pester each way, once, fresh: how different do they sound? */
export function constableProbe({ tempo = 'long' } = {}) {
  const base = H.newRun(tempo);
  H.waitMinutes(base, 270); // 14:30: constables and RAF are all out
  const said = {};
  const ids = ['sharma', ...Object.keys(base.s.officers)];
  for (const id of ids) {
    said[id] = [];
    for (const how of ['career', 'cute', 'cannon', 'detainme']) {
      const run = H.cloneRun(base); // a fresh officer each time, so nobody is annoyed yet
      const o = R.officerById(run.s, id);
      if (!o) continue;
      const from = run.log.length;
      const out = H.perform(run, { do: `pester:${id}:${how}`, cmd: { type: 'pester', to: id, how }, at: { x: o.x, z: o.z } });
      const lines = run.log.slice(from).filter((i) => i.who === id && i.text).map((i) => i.text);
      said[id].push(...(lines.length ? lines : [run.s.scene ? `(starts the ${run.s.scene.id} scene)` : out.r?.say ? `(${out.r.say})` : '(nothing)']));
    }
  }
  const all = Object.values(said).flat().filter((l) => !l.startsWith('('));
  const owners = {};
  for (const [id, lines] of Object.entries(said)) for (const l of new Set(lines)) if (!l.startsWith('(')) (owners[l] ??= new Set()).add(id);
  const shared = Object.values(owners).filter((o) => o.size > 1).length;
  const distinct = Object.keys(owners).length;
  return { said, officers: ids.length, distinctLines: distinct, sharedLines: shared, sharedFraction: distinct ? shared / distinct : 0, perOfficerDistinct: Object.fromEntries(Object.entries(said).map(([id, l]) => [id, new Set(l).size])), lines: all.length };
}

/** Jaccard distance between two days' milestones: 0 the same day, 1 nothing in common. */
export function divergence(a, b) {
  const A = new Set(a), B = new Set(b);
  const inter = [...A].filter((x) => B.has(x)).length, union = new Set([...A, ...B]).size;
  return union ? 1 - inter / union : 0;
}
