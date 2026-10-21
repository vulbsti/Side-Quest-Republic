// The named police (story/talks-police.js) played through the engine: six talks in a phase never repeat a
// line, conversations remember what you did, the officers do real things (chase, calm, rumours, the gali
// favour), and no two officers share a line.
import assert from 'node:assert/strict';
import { R, dayAt, runTo, runSeconds, stand } from './lib/story.mjs';
import { SITUATIONS } from '../dist/loop/situations.js';
import police from '../dist/loop/story/talks-police.js';

const { TALKS, REACTS, BRUSHOFF, PESTER_BY } = police;
const OFFICERS = ['c1', 'c2', 'c3', 'c4', 'c5', 'r1'];
const PHASES = { morning: '10:05', midday: '12:05', tense: '14:05', showdown: '16:02', aftermath: '17:05' };
let checks = 0;
const ok = (c, msg) => { assert.ok(c, msg); checks++; };

/** A day at hh:mm with every situation out of the way, so talking reaches the officer's own pool. */
function quietDay(hhmm) {
  const s = dayAt('10:00');
  for (const id of Object.keys(SITUATIONS)) s.story.sits[id] = { state: 'missed' };
  runTo(s, hhmm);
  R.drainEvents(s);
  return s;
}
/** Talk once, answer every node with the last option on offer, and return the officer-side lines heard. */
function talkThrough(s, who) {
  stand(s, who);
  const r = R.act(s, { type: 'talk', to: who });
  for (let guard = 0; s.story.convo && guard < 6; guard++) {
    const opts = s.story.convo.options.filter((o) => o.ok);
    R.act(s, { type: 'say', option: opts[opts.length - 1].i });
    runSeconds(s, 0.2);
  }
  runSeconds(s, 22);
  const lines = R.drainEvents(s).filter((e) => e.text && /^(talk|react|brushoff):/.test(e.key || '')).map((e) => `${e.who}: ${e.text}`);
  return { r, lines };
}

// 1. Six talks in every phase they are on screen: no line twice, and the first two are conversations.
for (const who of OFFICERS) {
  for (const [phase, hhmm] of Object.entries(PHASES)) {
    if (who === 'r1' && (phase === 'morning' || phase === 'midday')) continue; // the RAF arrive at 14:00
    const s = quietDay(hhmm);
    const seen = new Set();
    const kinds = [];
    for (let i = 0; i < 6; i++) {
      if (s.player.detained) break; // the showdown can sweep you up; the bus is bus-andar's business
      const { r, lines } = talkThrough(s, who);
      kinds.push(r?.talk ? 'talk' : r?.react ? 'react' : 'brush');
      for (const l of lines) { ok(!seen.has(l), `${who} ${phase}: "${l}" heard twice in six talks`); seen.add(l); }
    }
    ok(kinds[0] === 'talk' && kinds[1] === 'talk', `${who} ${phase}: two conversations first (got ${kinds.join(',')})`);
  }
}

// 2. They remember you.
{
  const s = quietDay('10:20');
  s.story.sits['career-counselling'] = { state: 'done' };
  stand(s, 'c1');
  ok(R.act(s, { type: 'talk', to: 'c1' }).talk === 'yadav-m3', 'Yadav remembers career counselling');
  R.act(s, { type: 'leave' });
  stand(s, 'c2');
  ok(R.act(s, { type: 'talk', to: 'c2' }).talk === 'meena-m3', 'Meena remembers career counselling');
  R.act(s, { type: 'leave' });
  stand(s, 'c3');
  ok(R.act(s, { type: 'talk', to: 'c3' }).talk === 'tomar-m3', 'Tomar remembers career counselling');
}
{ // Gill recognises you only with aura.
  const lo = quietDay('10:20');
  stand(lo, 'c5');
  ok(R.act(lo, { type: 'talk', to: 'c5' }).talk !== 'gill-m3', 'Gill does not know a nobody');
  const hi = quietDay('10:20');
  hi.player.rep.aura = 30;
  stand(hi, 'c5');
  ok(R.act(hi, { type: 'talk', to: 'c5' }).talk === 'gill-m3', 'Gill recognises you from your clips');
  const duet = hi.story.convo.options.find((o) => /duet/.test(o.intent));
  R.act(hi, { type: 'say', option: duet.i });
  ok(hi.flags['gill-reel'] && hi.recent.some((h) => h.kind === 'pester-cute'), 'the duet is filmable');
}

// 3. They do things.
{ // Tomar starts trouble.
  const s = quietDay('10:20');
  stand(s, 'c3');
  R.act(s, { type: 'talk', to: 'c3' }); R.act(s, { type: 'leave' }); // tomar-m1
  R.act(s, { type: 'talk', to: 'c3' }); // tomar-m2
  const stare = s.story.convo.options.find((o) => /Stare/.test(o.intent));
  R.act(s, { type: 'say', option: stare.i });
  ok(s.player.chasedBy === 'c3', 'staring down Tomar starts a chase');
}
{ // Yadav, owed a chai, calls Tomar off.
  const s = quietDay('14:25');
  s.flags['yadav-chai'] = true;
  s.story.played['yadav-d3'] = true; s.story.played['yadav-t1'] = true;
  // Tomar is on you.
  const o = R.officerById(s, 'c3');
  stand(s, 'c1');
  o.x = s.player.x + 2; o.z = s.player.z;
  s.player.chasedBy = 'c3'; o.mode = 'chase';
  const r = R.act(s, { type: 'talk', to: 'c1' });
  ok(r.talk === 'yadav-t2', `Yadav's heat talk is next (got ${r.talk})`);
  const call = s.story.convo.options.find((x) => /Tomar/.test(x.intent));
  ok(call.ok, 'calling Tomar off needs and has the chai');
  R.act(s, { type: 'say', option: call.i });
  ok(!s.player.chasedBy && s.flags['tomar-called-off'], 'Yadav calls Tomar off');
}
{ // Rawat spreads a forward into the police.
  const s = quietDay('10:20');
  stand(s, 'c4');
  R.act(s, { type: 'talk', to: 'c4' });
  const scary = s.story.convo.options.find((o) => /cannon/.test(o.intent));
  R.act(s, { type: 'say', option: scary.i });
  ok(s.rumours.cannon.places.stage, 'Rawat plants the water-cannon rumour at the stage');
}
{ // Meena can be made to laugh, and remembers it.
  const s = quietDay('12:10');
  s.story.played['meena-d1'] = true;
  stand(s, 'c2');
  R.act(s, { type: 'talk', to: 'c2' });
  const imp = s.story.convo.options.find((o) => /impression/.test(o.intent));
  R.act(s, { type: 'say', option: imp.i });
  ok(s.flags['meena-laughed'] && R.officerById(s, 'c2').mood === 'amused', 'Meena laughs');
  runTo(s, '14:05');
  stand(s, 'c2');
  ok(R.act(s, { type: 'talk', to: 'c2' }).talk === 'meena-t3', 'Meena tips off the one who made her laugh');
}
{ // Pandey and the gali: needs help, sets the flag rules.js reads, and calls it back at the showdown.
  const s = quietDay('14:05');
  stand(s, 'r1');
  R.act(s, { type: 'talk', to: 'r1' });
  R.act(s, { type: 'say', option: s.story.convo.options.find((o) => /litchi/.test(o.intent)).i });
  const gali = s.story.convo.options.find((o) => /gali/.test(o.intent));
  ok(!gali.ok, 'the gali needs help');
  R.act(s, { type: 'leave' });
  const t = quietDay('14:05');
  t.player.rep.help = 12;
  stand(t, 'r1');
  R.act(t, { type: 'talk', to: 'r1' });
  R.act(t, { type: 'say', option: t.story.convo.options.find((o) => /litchi/.test(o.intent)).i });
  R.act(t, { type: 'say', option: t.story.convo.options.find((o) => /gali/.test(o.intent)).i });
  ok(t.flags['raf-muzaffarpur'], 'Pandey knows the gali');
  runTo(t, '16:02');
  if (!t.player.detained) { stand(t, 'r1'); ok(R.act(t, { type: 'talk', to: 'r1' }).talk === 'pandey-s1', 'Pandey points at the gali in the showdown'); }
}

// 4. Pester answers are the officer's own.
{
  const s = quietDay('10:20');
  stand(s, 'c3');
  R.act(s, { type: 'pester', to: 'c3', how: 'cute' });
  const ev = R.drainEvents(s).filter((e) => e.text);
  ok(ev.some((e) => e.who === 'player' && e.text === PESTER_BY.c3.say.cute), 'you say your Tomar line');
  ok(ev.some((e) => e.who === 'c3' && PESTER_BY.c3.cute.bored.includes(e.text)), 'Tomar answers in his own words, in the mood you found him in');
  runTo(s, '14:05');
  stand(s, 'r3');
  R.act(s, { type: 'pester', to: 'r3', how: 'career' });
  ok(R.drainEvents(s).some((e) => e.who === 'r3' && PESTER_BY.raf.career.bored.includes(e.text)), 'a faceless RAF jawan uses the RAF lines');
}

// 5. Shape and distinctness: counts, and no line shared between two officers.
const owner = new Map();
const claim = (who, line) => { const prev = owner.get(line); ok(!prev || prev === who, `"${line}" is said by both ${prev} and ${who}`); owner.set(line, who); };
for (const who of OFFICERS) {
  ok(Object.keys(REACTS[who]).length >= 8, `${who} reacts to 8+ happenings`);
  ok(BRUSHOFF[who].length >= 8 && new Set(BRUSHOFF[who]).size === BRUSHOFF[who].length, `${who} has 8+ distinct brush-offs`);
  for (const t of TALKS[who]) for (const n of Object.values(t.nodes)) {
    for (const b of n.beats || []) if ((b.who ?? b[0]) === who) claim(who, b.line ?? b[1]);
    for (const o of n.options || []) for (const b of o.beats || []) if ((b.who ?? b[0]) === who) claim(who, b.line ?? b[1]);
  }
  for (const beats of Object.values(REACTS[who])) for (const b of beats) claim(who, b.line ?? b[1]);
  for (const l of BRUSHOFF[who]) claim(who, l);
}
for (const [who, p] of Object.entries(PESTER_BY)) {
  for (const how of ['career', 'cute', 'cannon', 'detainme']) {
    ok(p.say[how], `${who} say.${how}`);
    claim(`${who}:say`, p.say[how]);
    for (const m of ['bored', 'amused', 'soft']) { ok(p[how][m].length >= 3, `${who}.${how}.${m} has 3+`); for (const l of p[how][m]) claim(who, l); }
  }
  ok(p.annoyed.length >= 3, `${who}.annoyed has 3+`);
  for (const l of p.annoyed) claim(who, l);
}
ok(['sharma', 'c1', 'c2', 'c3', 'c4', 'c5', 'raf'].every((k) => PESTER_BY[k]), 'PESTER_BY covers every officer');

console.log(`test-talks-police: ${checks} checks passed`);
