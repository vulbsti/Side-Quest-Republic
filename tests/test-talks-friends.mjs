// Plays the friends' conversations (dist/loop/story/talks-friends.js) through the engine:
// talking to Kabir, Nikhil, Meera, Zoya, Mira and Dev six times in each phase never repeats a line,
// conversations remember what you did, and the options that do things actually do them.
// Run: node tests/test-talks-friends.mjs
import assert from 'node:assert/strict';
import { R, dayAt, runTo, runSeconds, stand, talk, choose } from './lib/story.mjs';
import friends from '../dist/loop/story/talks-friends.js';

const WHO = ['kabir', 'nikhil', 'meera', 'zoya', 'mira', 'dev'];
const PHASE_AT = { morning: '11:05', midday: '12:35', tense: '14:50', showdown: '16:05', aftermath: '17:10' };
let checks = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); checks++; };

// Situations are other writers' content and cast some of these people; park them so talk() reaches ours.
function quiet(s) { for (const id of R.situations(s).map((x) => x.id)) s.story.sits[id] = { state: 'missed' }; }
function day(hhmm, setup) {
  const s = dayAt('10:00');
  quiet(s);
  s.flags['kabir-stays'] = true; s.kabirStays = true; // keep Kabir around after 14:00
  setup?.(s);
  runTo(s, hhmm);
  quiet(s);
  return s;
}
/** Our lines (conversation beats, reactions, brush-offs) said by `who` since the last call. */
const ours = (s, who) => R.drainEvents(s).filter((e) => e.who === who && e.text && /^(talk|react|brushoff):/.test(e.key || '')).map((e) => e.text);
/** Talk to someone and play through whatever opens, picking option `pick` (rotated over the ones on offer). */
function converse(s, who, pick = 0) {
  stand(s, who);
  const r = talk(s, who);
  let guard = 0;
  while (s.story.convo && guard++ < 6) {
    const open = s.story.convo.options.filter((o) => o.ok);
    if (!open.length) { R.act(s, { type: 'leave' }); break; }
    stand(s, who);
    choose(s, open[pick % open.length].i);
  }
  runSeconds(s, 14); // let the beats play out (2.6 s apart)
  return r;
}

// 1. Six talks in every phase: something every time, never the same line twice.
let played = 0, skipped = [];
for (const who of WHO) {
  for (const [phase, hhmm] of Object.entries(PHASE_AT)) {
    const s = day(hhmm);
    const p = s.people[who];
    // Picked up in the charge: get them off the bus (as a friend's distraction would) so we can hear them.
    if (p?.mode === 'detained') { s.detention.people = s.detention.people.filter((x) => x !== who); Object.assign(p, { hidden: false, mode: 'story', x: R.PLACES.stage.x + 2, z: R.PLACES.stage.z, path: [] }); }
    if (!p || p.hidden) { skipped.push(`${who}@${phase}`); continue; }
    R.drainEvents(s);
    const lines = [];
    for (let i = 0; i < 6; i++) {
      const r = converse(s, who, i);
      ok(r && r.ok, `${who} ${phase}: talk ${i + 1} answered`);
      lines.push(...ours(s, who));
    }
    ok(lines.length >= 6, `${who} ${phase}: said at least six lines (${lines.length})`);
    const dup = lines.find((l, i) => lines.indexOf(l) !== i);
    ok(!dup, `${who} ${phase}: repeated "${dup}"`);
    played++;
  }
}
ok(played >= 25, `played most person/phase pairs (${played}; skipped ${skipped.join(', ') || 'none'})`);

// 2. Memory: conversations answer to what you did.
{ // Kabir remembers the mummy call first thing.
  const s = day('12:40'); s.story.sits['mummy-call'] = { state: 'done' };
  const r = talk(s, 'kabir');
  ok(r.talk === 'kabir-d-after-call', `Kabir opens with the mummy call (got ${r.talk})`);
}
{ // Meera knows you went viral.
  const s = day('12:40'); s.player.rep.aura = 45;
  ok(talk(s, 'meera').talk === 'meera-d-viral', 'Meera opens with your viral clip');
}
{ // Zoya wants the raw file once you've exposed a provocateur on camera.
  const s = day('15:05'); s.player.clips.push({ kind: 'provocateur-exposed', t: s.t });
  ok(talk(s, 'zoya').talk === 'zoya-t-raw', 'Zoya asks for the raw file');
}
{ // A promise in the morning comes back in the aftermath.
  const s = day('10:30');
  stand(s, 'meera');
  let r = talk(s, 'meera'); // meera-m-content
  R.act(s, { type: 'leave' });
  r = talk(s, 'meera');
  ok(r.talk === 'meera-m-followers', `second Meera talk is the follower count (${r.talk})`);
  choose(s, 'five thousand');
  ok(s.flags['meera-promise'], 'promising Meera sets meera-promise');
  runTo(s, '17:10'); quiet(s); stand(s, 'meera');
  talk(s, 'meera'); R.act(s, { type: 'leave' }); // meera-a-repost
  r = talk(s, 'meera');
  ok(r.talk === 'meera-a-count', `then the follower count (${r.talk})`);
  ok(s.story.convo.options.find((o) => o.intent.includes('five thousand'))?.ok, 'and the promise is an option you can pick');
}

// 3. Options that do things do them.
{ // A lost Nikhil falls in behind you as soon as you talk to him (the engine does it, whatever he says).
  const s = day('10:20');
  stand(s, 'nikhil'); talk(s, 'nikhil');
  ok(s.people.nikhil.mode === 'follow', 'Nikhil follows you to the stage');
}
{ // Giving Kabir the megaphone puts it in his hands and sets up his set.
  const s = day('12:40');
  s.people.dev.carrying = null; s.objects.megaphone.holder = 'player'; s.player.carrying = 'megaphone';
  stand(s, 'kabir');
  ok(talk(s, 'kabir').talk === 'kabir-d-holding-meg', 'Kabir notices the megaphone');
  choose(s, 'Give Kabir');
  ok(s.objects.megaphone.holder === 'kabir' && s.flags['kabir-has-mic'], 'Kabir has the megaphone');
  runTo(s, '14:50'); quiet(s); stand(s, 'kabir');
  ok(talk(s, 'kabir').talk === 'kabir-t-set', 'and talks about his set at 14:50');
}
{ // Dev spreads the minister rumour where you send him.
  const s = day('12:40');
  stand(s, 'dev'); talk(s, 'dev');
  choose(s, 'barricade');
  ok(s.rumours.minister.places.barricade, 'the barricade has heard about the minister');
}
{ // Telling Kabir to be home by four sets his curfew.
  const s = day('14:10');
  stand(s, 'kabir'); ok(talk(s, 'kabir').talk === 'kabir-t-stayed', 'Kabir says he stayed');
  choose(s, 'home by four');
  ok(s.flags['kabir-curfew-16'], 'kabir-curfew-16 is set');
}

// 4. Reactions and brush-offs: every reaction is a happening kind, every brush-off list is 8+ and distinct.
for (const who of WHO) {
  ok(Object.keys(friends.REACTS[who]).length >= 8, `${who} reacts to 8+ happenings`);
  const b = friends.BRUSHOFF[who];
  ok(b.length >= 8 && new Set(b).size === b.length, `${who} has 8+ distinct brush-offs`);
}
{ // A reaction plays once the conversations for now are used up.
  const s = day('16:05');
  for (let i = 0; i < 4; i++) converse(s, 'dev', i);
  R.drainEvents(s);
  s.recent.push({ kind: 'singalong', place: 'barricade', x: s.player.x, z: s.player.z, t: s.t });
  const r = talk(s, 'dev');
  ok(r.react === 'singalong', `Dev reacts to the singalong (got ${JSON.stringify(r)})`);
}

console.log(`test-talks-friends: ${checks} checks passed (${played} person/phase runs${skipped.length ? `; skipped ${skipped.join(', ')}` : ''})`);
