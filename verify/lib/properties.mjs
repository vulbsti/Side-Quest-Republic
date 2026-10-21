// The properties every day must keep. Each returns [] or a list of { id, msg }.
// Invariants hold in every state; the run checks (liveness, pacing) look at a whole day.
import { R } from './harness.mjs';

const PHASE_INDEX = Object.fromEntries(R.PHASES.map(([id], i) => [id, i]));
const OBJECT_HOLDERS = new Set([null, 'hook', 'cart', 'bus', 'player']);
const finite = (p) => Number.isFinite(p.x) && Number.isFinite(p.z);

export const INVARIANTS = {
  'one-holder': 'Every object is held by exactly one thing, and the holder agrees it is carrying it',
  'finite-positions': 'Nobody stands at NaN or infinity',
  'crowds-non-negative': 'Crowd counts are whole numbers, never below zero',
  'bus-capacity': 'The shuttle never carries more than it seats',
  'phase-monotonic': 'The day only moves forward: morning, midday, tense, showdown, aftermath',
  'detained-in-vehicle': 'A detained player sits at the detention vehicle door',
  'chaser-exists': 'A chase always has a real officer doing the chasing',
  'rep-bounded': 'Aura, heat, help and nuisance stay between 0 and 100',
  'intensity-bounded': 'The director\'s intensity stays between 0 and 100',
};

export function checkInvariants(s, prev = null) {
  const out = [], bad = (id, msg) => out.push({ id, msg });
  for (const [id, o] of Object.entries(s.objects)) {
    const h = o.holder;
    if (!OBJECT_HOLDERS.has(h) && !s.people[h]) bad('one-holder', `${id} is held by unknown "${h}"`);
    if (h === 'player' && s.player.carrying !== id) bad('one-holder', `${id} is held by the player, who carries ${s.player.carrying}`);
    if (s.people[h] && s.people[h].carrying !== id && !(h === 'iqbal' && id === 'key')) bad('one-holder', `${id} is held by ${h}, who carries ${s.people[h].carrying}`);
  }
  if (s.player.carrying && s.objects[s.player.carrying]?.holder !== 'player') bad('one-holder', `the player carries ${s.player.carrying}, held by ${s.objects[s.player.carrying]?.holder}`);
  for (const p of Object.values(s.people)) if (p.carrying && s.objects[p.carrying]?.holder !== p.id) bad('one-holder', `${p.id} carries ${p.carrying}, held by ${s.objects[p.carrying]?.holder}`);
  for (const p of [s.player, ...Object.values(s.people), ...Object.values(s.officers), ...s.provocateurs]) if (!finite(p)) bad('finite-positions', `${p.id ?? 'player'} at ${p.x},${p.z}`);
  for (const [k, n] of Object.entries(s.crowd)) if (!Number.isInteger(n) || n < 0) bad('crowds-non-negative', `crowd.${k} = ${n}`);
  if (s.detention.count < 0) bad('crowds-non-negative', `detention.count = ${s.detention.count}`);
  if (s.bus.load > 14) bad('bus-capacity', `bus.load = ${s.bus.load}`);
  if (prev && PHASE_INDEX[s.phase] < PHASE_INDEX[prev.phase]) bad('phase-monotonic', `${prev.phase} → ${s.phase}`);
  if (s.player.detained) { const d = R.detentionPos(s); if (R.dist(s.player, d) > 0.6) bad('detained-in-vehicle', `player ${R.dist(s.player, d).toFixed(1)} m from the door`); }
  if (s.player.chasedBy && !R.officerById(s, s.player.chasedBy)) bad('chaser-exists', `chasedBy ${s.player.chasedBy}`);
  for (const [k, v] of Object.entries(s.player.rep)) if (!(v >= 0 && v <= 100)) bad('rep-bounded', `${k} = ${v}`);
  if (!(s.director.intensity >= 0 && s.director.intensity <= 100)) bad('intensity-bounded', `intensity ${s.director.intensity}`);
  return out;
}

/** The ending card names only things that happened, with every blank filled. */
export function checkEndingCard(s) {
  const out = [], c = s.outcome;
  if (!s.over) return [{ id: 'day-ends', msg: `the day never ended (stopped at ${R.clockText(s.t)})` }];
  if (!c) return [{ id: 'ending-card', msg: 'no ending card' }];
  const texts = [c.title, c.text, c.roleTitle, c.roleText, c.headline, ...c.callbacks.map((x) => x.text)].filter((x) => x != null);
  for (const t of texts) if (/\{\w+\}|undefined|NaN|null/.test(t)) out.push({ id: 'ending-card', msg: `unfilled text: "${t.slice(0, 80)}"` });
  for (const cb of c.callbacks) if (!s.callbacks.some((x) => x.key === cb.key)) out.push({ id: 'ending-card', msg: `card names ${cb.key}, which never happened` });
  if (c.callbacks.length < 3) out.push({ id: 'ending-card-thin', msg: `only ${c.callbacks.length} callbacks on the card (want 3–5)` });
  return out;
}

export const RUN_CHECKS = {
  'no-crash': 'The engine never throws, whatever the player does',
  'day-ends': 'Every day reaches 18:00 and shows an ending card',
  'ending-card': 'The ending card names only things that happened, with no blank or broken text',
  'ending-card-thin': 'The ending card has at least three callbacks',
  'no-silent-act': 'Every command the engine accepts shows the player something within 3 seconds',
  'no-raw-code': 'The player never sees a machine code (like "too-far") as a message',
  'prompt-works': 'Pressing E on the prompt the HUD shows does something visible',
  'chase-ends': 'A chase ends (caught or lost) within 10 game minutes',
  'detention-exit': 'A detained player has a way out within 30 game minutes, or the day is nearly over',
};
