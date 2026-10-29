// Plays the locals' conversations (dist/loop/story/talks-locals.js) through the engine:
// talking to Asha, Sana, Ravi, Iqbal and Sharma six times in each phase never repeats a line,
// conversations remember what you did, and the options that do things actually do them.
// Run: node tests/test-talks-locals.mjs
import assert from 'node:assert/strict';
import { R, dayAt, runTo, runSeconds, stand, talk, choose } from './lib/story.mjs';
import locals from '../dist/loop/story/talks-locals.js';

const WHO = ['asha', 'sana', 'ravi', 'iqbal', 'sharma'];
// Iqbal is only out of the bus on his chai breaks (about 11:00 and 13:30) and after 14:00.
const PHASE_AT = {
  morning: { _: '10:05', iqbal: '11:08', ravi: '10:05' },
  midday: { _: '12:45', iqbal: '13:40' },
  tense: { _: '14:50' },
  showdown: { _: '16:05' },
  aftermath: { _: '17:10' },
};
let checks = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); checks++; };

// Situations are other writers' content and cast some of these people; park them so talk() reaches ours.
function quiet(s) { for (const id of R.situations(s).map((x) => x.id)) s.story.sits[id] = { state: 'missed' }; }
function day(hhmm, setup) {
  const s = dayAt('10:00');
  quiet(s);
  setup?.(s);
  runTo(s, hhmm);
  quiet(s);
  return s;
}
/** Make sure someone is out and about (Iqbal off the bus) so we can talk to them. */
function present(s, who) {
  const p = s.people[who];
  if (p.mode === 'detained') s.detention.people = s.detention.people.filter((x) => x !== who);
  if (p.hidden || p.mode === 'detained') Object.assign(p, { hidden: false, mode: 'chai', x: R.SPOTS.chai.x, z: R.SPOTS.chai.z, path: [] });
  return p;
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
  if (s.player.detained) R.act(s, { type: 'plead' }) && R.act(s, { type: 'leave' });
  return r;
}

// 1. Six talks in every phase: something every time, never the same line twice.
for (const who of WHO) {
  for (const [phase, times] of Object.entries(PHASE_AT)) {
    const s = day(times[who] ?? times._);
    present(s, who);
    R.drainEvents(s);
    const lines = [];
    for (let i = 0; i < 6; i++) {
      if (s.player.detained) { R.releasePlayer?.(s, 'test'); s.player.detained = false; }
      present(s, who);
      const r = converse(s, who, i);
      ok(r && r.ok, `${who} ${phase}: talk ${i + 1} answered`);
      lines.push(...ours(s, who));
    }
    ok(lines.length >= 6, `${who} ${phase}: said at least six lines (${lines.length})`);
    const dup = lines.find((l, i) => lines.indexOf(l) !== i);
    ok(!dup, `${who} ${phase}: repeated "${dup}"`);
  }
}

// 2. Counts the plan asks for.
for (const who of WHO) {
  const list = locals.TALKS[who];
  for (const phase of Object.keys(PHASE_AT)) ok(list.filter((t) => !t.phase || t.phase.includes(phase)).length >= 2, `${who}: 2+ conversations in ${phase}`);
  ok(Object.keys(locals.REACTS[who]).length >= 8, `${who}: reacts to 8+ happenings`);
  ok(locals.BRUSHOFF[who].length >= 8 && new Set(locals.BRUSHOFF[who]).size === locals.BRUSHOFF[who].length, `${who}: 8+ distinct brush-offs`);
}

// 3. Memory: people remember what you did.
{ // Sana with water: the first thing she says is about the crate, and the "no water" talks stop.
  const s = day('12:45', (d) => { d.waterOk = true; });
  stand(s, 'sana');
  const r = talk(s, 'sana');
  ok(r.talk === 'sana-water-arrived', `Sana opens with the water (${r.talk})`);
  choose(s, 0);
  ok(s.flags['sana-has-water'], 'Sana remembers she has water');
  runSeconds(s, 10);
  const r2 = talk(s, 'sana');
  ok(!['sana-d-countdown', 'sana-d-out'].includes(r2.talk), `no "paani khatam" after the crate (${r2.talk})`);
}
{ // Sana without water at 13:10 says it has run out (the crate never made the shuttle: someone moved it).
  const s = day('13:10', (d) => Object.assign(d.objects.water, { holder: null, x: 127, z: -312 }));
  ok(!s.waterOk, 'no water at the tent');
  stand(s, 'sana');
  ok(talk(s, 'sana').talk === 'sana-d-out', 'Sana is out of water after 13:00');
}
{ // Iqbal sees his key in your hand, and you hang it back.
  const s = day('11:08');
  present(s, 'iqbal');
  s.objects.key.holder = 'player'; s.player.carrying = 'key';
  stand(s, 'iqbal');
  ok(talk(s, 'iqbal').talk === 'iqbal-m-holding', 'Iqbal notices his key');
  choose(s, 'hang it back');
  ok(s.player.carrying !== 'key' && s.objects.key.holder === null, 'the key is back by the hook');
  ok(R.dist(s.objects.key, R.SPOTS.keyHook) < 0.5, 'right by the hook');
  ok(s.flags['iqbal-likes-you'], 'and Iqbal likes you for it');
}
{ // Iqbal hands you his key on his break if you offer.
  const s = day('11:08');
  present(s, 'iqbal');
  stand(s, 'iqbal');
  ok(talk(s, 'iqbal').talk === 'iqbal-m-break', 'Iqbal on his chai break');
  choose(s, 'hold the key');
  ok(s.player.carrying === 'key', 'you are holding the bus key');
}
{ // After the chabi situation, Iqbal and Asha bring it up first.
  const s = day('11:35');
  s.story.sits.chabi = { state: 'done' };
  present(s, 'iqbal');
  stand(s, 'iqbal');
  ok(talk(s, 'iqbal').talk === 'iqbal-m-after-chabi', 'Iqbal remembers the key');
  choose(s, 'Confess');
  runSeconds(s, 12);
  stand(s, 'asha');
  ok(talk(s, 'asha').talk === 'asha-m-chabi-after', 'Asha heard about the key');
  // In the afternoon Iqbal does you a favour.
  runTo(s, '16:05'); quiet(s); s.story.sits.chabi = { state: 'done' };
  present(s, 'iqbal'); stand(s, 'iqbal');
  R.act(s, { type: 'leave' });
  const r = talk(s, 'iqbal');
  ok(r.talk === 'iqbal-s-loading', `Iqbal at the loading bus (${r.talk})`);
  ok(s.story.convo.options[0].ok, 'he will open the back door for you');
}
{ // Ravi after the speaker run.
  const s = day('12:45');
  s.story.sits['speaker-run'] = { state: 'done' };
  stand(s, 'ravi');
  ok(talk(s, 'ravi').talk === 'ravi-d-run-thanks', 'Ravi thanks you for the speaker');
}
{ // Ravi's playlist pick comes back at noon.
  const s = day('11:20');
  stand(s, 'ravi');
  let r = talk(s, 'ravi');
  while (r.talk !== 'ravi-m-playlist') { R.act(s, { type: 'leave' }); runSeconds(s, 8); r = talk(s, 'ravi'); assert.ok(r.talk, 'ran out before the playlist'); }
  choose(s, 'Haryanvi');
  runTo(s, '12:45'); quiet(s);
  stand(s, 'ravi');
  ok(talk(s, 'ravi').talk === 'ravi-d-haryanvi', 'Ravi played your Haryanvi pick');
}
{ // Sharma, by mood and by the career counselling.
  const soft = day('10:40', (d) => { d.story.sits['career-counselling'] = { state: 'done' }; });
  soft.story.sits['career-counselling'] = { state: 'done' };
  soft.people.sharma.mood = 'soft';
  stand(soft, 'sharma');
  ok(talk(soft, 'sharma').talk === 'sharma-m-soft', 'soft Sharma asks about your SSC form');
  const cross = day('10:40');
  cross.story.sits['career-counselling'] = { state: 'done' };
  cross.people.sharma.mood = 'annoyed';
  stand(cross, 'sharma');
  ok(talk(cross, 'sharma').talk === 'sharma-m-annoyed', 'annoyed Sharma has had enough');
  // Soft at the showdown: he opens the gali, and can get your friends off the bus.
  const s = day('16:05');
  s.people.sharma.mood = 'soft';
  stand(s, 'sharma');
  ok(talk(s, 'sharma').talk === 'sharma-s-soft', 'soft Sharma shows you the gali');
  choose(s, 'Take the gali');
  ok(s.story.levers.target === 'crowd', 'and the police stop targeting you');
}
{ // Asha plants a rumour you give her.
  const s = day('10:05');
  stand(s, 'asha');
  ok(talk(s, 'asha').talk === 'asha-m-hello', 'Asha first');
  choose(s, 'start a rumour');
  choose(s, 'biryani');
  ok(s.rumours.biryani.places.stage, 'the biryani rumour reached the stage');
}
{ // Sharma will put you on the bus at the end of the day, if you ask.
  const s = day('17:10');
  stand(s, 'sharma');
  ok(talk(s, 'sharma').talk === 'sharma-a-duty', 'Sharma off duty');
  choose(s, 'put you on the bus');
  ok(s.player.detained, 'you are on the bus');
}

console.log(`test-talks-locals: ${checks} checks passed`);
