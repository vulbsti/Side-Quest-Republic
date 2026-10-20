// DEV ONLY (loaded with ?demo): fills in the slice-spec state fields the engine does not provide
// yet, from the clock alone, so the presentation can be seen before rules.js grows them.
// It never overwrites a field the engine already owns. Delete once rules.js implements the spec.
const M = (h, m = 0) => h * 60 + m;
let owned = null, cues = [], fired = new Set();
const cue = (name, place, pos, data) => cues.push({ cue: name, place, pos, data });
const PLACE = { stage: { x: 2, z: -5 }, barricade: { x: 38, z: -4.5 }, cp: { x: -4, z: -33 } };

export function reset() { owned = null; cues = []; fired = new Set(); }
export function drainCues() { return cues.splice(0); }

export function fill(s, dt, clockMinutes = (t) => 600 + t / 1.25) {
  const m = clockMinutes(s.t);
  if (!owned) owned = { phase: 'phase' in s, groups: 'groups' in s, director: 'director' in s, rep: !!s.player.rep, police: 'barricades' in s.police, provs: 'provocateurs' in s, crew: 'crew' in s.player, clips: 'clips' in s.player };
  const once = (k, f) => { if (!fired.has(k)) { fired.add(k); f(); } };
  if (!owned.phase) s.phase = m < M(12) ? 'morning' : m < M(14) ? 'midday' : m < M(16) ? 'tense' : m < M(17) ? 'showdown' : 'aftermath';
  if (!owned.groups) {
    s.groups = {};
    if (m >= M(12, 30)) { s.groups.party = { kind: 'party', place: 'cp', size: 10, mood: 'loud' }; s.groups.sena = { kind: 'sena', place: m >= M(14, 30) ? 'barricade' : 'stage', size: 10, mood: m >= M(14) ? 'chant' : 'calm' }; once('wave', () => { cue('arrival-wave', 'cp', PLACE.cp); cue('sena-bikes', 'stage', PLACE.stage); }); }
    if (m >= M(13)) s.groups.opp = { kind: 'opp', place: 'stage', size: 7, mood: 'photo-op' };
  }
  if (!owned.police) {
    s.police.barricades = m >= M(14) ? ['barricade', 'stage'] : [];
    s.police.raf = m >= M(14) ? 8 : 0;
    if (m >= M(14)) once('barr', () => cue('barricades-up', 'barricade', PLACE.barricade));
    s.police.cannon = m >= M(15, 45) && m < M(17) ? { place: 'stage', x: 12, z: 3.5, state: m < M(15, 50) ? 'rolling' : m < M(15, 55) ? 'parked' : m < M(16, 10) ? 'spraying' : 'parked' } : null;
    if (m >= M(15, 45)) once('cannon', () => cue('cannon-roll', 'stage', PLACE.stage));
    s.police.gas = m >= M(16) && m < M(16, 40) ? { place: 'stage', x: -2, z: -6, t: 0 } : null;
    if (m >= M(16)) once('gas', () => cue('gas-fired', 'stage', PLACE.stage));
    s.police.charge = m >= M(16, 15) && m < M(16, 35) ? { place: 'stage', t: 0, targets: ['crew'] } : null;
    if (m >= M(16, 15)) once('charge', () => cue('charge-start', 'stage', PLACE.stage));
  }
  if (!owned.provs) {
    s.provocateurs = m >= M(14, 30) && m < M(17) ? [0, 1, 2].map((i) => ({ id: 'p' + i, place: 'stage', x: -3 + i * 2.5, z: -7 - i, state: m >= M(15, 30) && i === 0 ? 'acting' : 'hidden' })) : [];
    if (m >= M(15, 30)) once('stone', () => cue('stone-thrown', 'stage', { x: -3, z: -7 }, { pos: { x: -3, z: -7 } }));
  }
  if (!owned.rep) s.player.rep = { aura: Math.min(80, 10 + (m - 600) / 6), heat: Math.min(90, Math.max(0, (m - 700) / 4)), help: 20, nuisance: 15 };
  if (!owned.crew) s.player.crew = m >= M(12) ? ['s1', 's2', 's3', 's4'] : [];
  if (!owned.clips) { s.player.clips ??= []; if (m >= M(10, 40)) once('clip', () => s.player.clips.push({ id: 'c1', kind: 'pester-career', place: 'barricade', t: s.t, by: 'player' })); }
  if (!owned.director) s.director = { intensity: Math.round(Math.min(95, Math.max(0, (m - 660) / 3.5))), hotspot: 'stage', target: m >= M(15) ? 'crew' : 'crowd', stance: 'hold', chargeAt: s.t + (M(16, 15) - m) * ((s.t || 1) / Math.max(1, m - 600)) };
  void dt;
}
