// Plays whole looping days with scripted players and checks the rules actually change the outcome.
import assert from 'node:assert/strict';
import { createDay, advance, act, at, SPOTS, RULES, drainEvents, dist, setTempo } from '../dist/loop/rules.js';
import { LINKS, LINES, ENDINGS, HINTS, TALK, AGAIN, RUMOURS, PEOPLE, AMBIENT } from '../dist/loop/content.js';

setTempo('slice'); // these chains were tuned on the 10-minute slice; verify/ checks the full day
const runUntil = (s, t) => advance(s, t - s.t);
const moveTo = (s, spot) => Object.assign(s.player, { x: spot.x, z: spot.z });
const links = (events) => new Set(events.map((e) => e.link).filter(Boolean));
const whisper = (s, to, rumour) => { moveTo(s, s.people[to]); return act(s, { type: 'whisper', to, rumour }); };
const take = (s, object, witnesses = []) => { moveTo(s, s.objects[object]); return act(s, { type: 'take', object, witnesses }); };
const give = (s, to) => { moveTo(s, s.people[to]); return act(s, { type: 'give', to }); };
// Walk the player somewhere at running pace, letting the world run, so followers can keep up.
function walkPlayer(s, to) {
  while (dist(s.player, to) > 0.5) {
    const d = dist(s.player, to), step = Math.min(d, 0.45);
    s.player.x += ((to.x - s.player.x) / d) * step; s.player.z += ((to.z - s.player.z) / d) * step;
    advance(s, 0.1);
  }
}

const everSeen = new Set();
function play(script) {
  const s = createDay();
  const seen = [];
  for (const [t, fn] of script) {
    runUntil(s, t);
    seen.push(...drainEvents(s));
    if (s.over) break;
    fn(s);
  }
  advance(s, 1000);
  seen.push(...drainEvents(s));
  for (const l of links(seen)) everSeen.add(l);
  return { s, links: links(seen) };
}

// Idle: the day goes as planned.
let r = play([]);
assert.equal(r.s.ending, 'packed', 'idle player sees the planned rally');
assert(r.links.has('big-speech'));
assert.equal(r.s.people.sharma.post, 'barricade', 'nothing pulls Sharma away on an ordinary day');

// Steal the speaker from the chai stall and keep it: the speech flops.
r = play([
  [at(10, 5), (s) => { moveTo(s, SPOTS.speakerChai); act(s, { type: 'take', object: 'speaker', witnesses: [] }); moveTo(s, SPOTS.metro); }],
]);
assert.equal(r.s.ending, 'quiet');
assert(r.links.has('small-speech'));

// Pocket the key on the first chai break and keep it: CP fills, Sharma leaves, the fired-up crowd marches.
r = play([
  [at(11, 10), (s) => { moveTo(s, SPOTS.keyHook); assert.equal(s.objects.key.holder, 'hook'); act(s, { type: 'take', object: 'key', witnesses: [] }); moveTo(s, SPOTS.metro); }],
]);
for (const l of ['key-missing', 'cp-piles-up', 'rao-sends-sharma', 'march']) assert(r.links.has(l), `key chain fires ${l}`);
assert.equal(r.s.ending, 'march');

// Key and speaker both gone: no speech to fire people up, so it ends as a CP jam instead.
r = play([
  [at(10, 5), (s) => { moveTo(s, SPOTS.speakerChai); act(s, { type: 'take', object: 'speaker', witnesses: [] }); moveTo(s, SPOTS.metro); act(s, { type: 'drop' }); }],
  [at(11, 10), (s) => { moveTo(s, SPOTS.keyHook); act(s, { type: 'take', object: 'key', witnesses: [] }); moveTo(s, SPOTS.metro); }],
]);
assert.equal(r.s.ending, 'cpjam');

// Return the key: the shuttle runs again and Sharma goes back.
r = play([
  [at(11, 10), (s) => { moveTo(s, SPOTS.keyHook); act(s, { type: 'take', object: 'key', witnesses: [] }); moveTo(s, SPOTS.metro); }],
  [at(12, 30), (s) => { const q = s.people.iqbal; moveTo(s, q); act(s, { type: 'give', to: 'iqbal' }); moveTo(s, SPOTS.metro); }],
]);
assert(r.links.has('key-returned') && r.links.has('rao-recalls'));
assert.notEqual(r.s.ending, 'march', 'a returned key stops the chain before the march');

// Taken in front of the CP constable: he chases you. Stand there and he catches you, the key goes back,
// and you sit out the showdown in the police van until 17:30. The day itself carries on.
{
  const s = createDay();
  runUntil(s, at(11, 10));
  moveTo(s, SPOTS.keyHook);
  act(s, { type: 'take', object: 'key', witnesses: ['c2'] });
  assert.equal(s.player.chasedBy, 'c2', 'a constable who sees you take the key runs at you');
  advance(s, 30);
  assert(s.player.detained, 'standing still gets you caught');
  assert.equal(s.player.carrying, null);
  assert.equal(s.objects.key.holder, 'hook', 'the police hang the key back');
  const seen = links(drainEvents(s));
  for (const l of ['chase', 'detained']) { assert(seen.has(l), `caught chain fires ${l}`); everSeen.add(l); }
  runUntil(s, at(17, 31));
  assert(!s.player.detained, 'everyone is released at 17:30');
  advance(s, 1000);
  assert(s.over && s.t >= at(18, 0) - 1, 'the day runs to 18:00 even after you are detained');
  assert.equal(s.outcome.role, 'detained');
}

// Speaker party at CP: Sharma comes, switches it off, then goes back.
r = play([
  [at(10, 5), (s) => { moveTo(s, SPOTS.speakerChai); act(s, { type: 'take', object: 'speaker', witnesses: [] }); moveTo(s, { x: -6, z: -45 }); act(s, { type: 'drop' }); moveTo(s, SPOTS.metro); }],
]);
for (const l of ['cp-party', 'rao-sends-sharma', 'sharma-kills-party', 'rao-recalls']) assert(r.links.has(l), `party chain fires ${l}`);

// --- slice 2: rumours, Zoya, Asha ---------------------------------------

// Told to Asha at 10:05, the cannon rumour rides with Ravi to the stage before Kabir arrives: a scare, then Zoya debunks it.
r = play([[at(10, 5), (s) => whisper(s, 'asha', 'cannon')]]);
assert(r.links.has('cannon-scare') && r.links.has('zoya-debunks'));
// Told to Asha during Ravi's 11:15 chai, it reaches the stage after Kabir has arrived, and he laughs it off.
r = play([[at(11, 20), (s) => whisper(s, 'asha', 'cannon')]]);
assert(r.links.has('rumour-spreads'), 'rumour reaches a crowd');
assert(r.links.has('kabir-laughs-off'), 'Kabir kills the cannon rumour');
assert.equal(r.s.ending, 'packed');

// After Kabir leaves at 14:00, with Zoya's phone stolen so she can't check it, the same rumour empties the stage.
r = play([
  [at(13, 12), (s) => { assert(take(s, 'phone').ok); moveTo(s, SPOTS.metro); }],
  [at(14, 20), (s) => whisper(s, 'mira', 'cannon')],
]);
for (const l of ['phone-missing', 'cannon-scare']) assert(r.links.has(l), `scare chain fires ${l}`);
assert(!r.links.has('zoya-debunks'));
assert.equal(r.s.ending, 'ghost');

// Same, but Zoya still has her phone: she hears it at the stage and debunks it.
r = play([[at(14, 20), (s) => whisper(s, 'mira', 'cannon')]]);
assert(r.links.has('cannon-scare') && r.links.has('zoya-debunks'), 'Zoya debunks the scare');
assert.notEqual(r.s.ending, 'ghost');

// Return Zoya's phone and she is back on air.
r = play([
  [at(13, 12), (s) => { take(s, 'phone'); moveTo(s, SPOTS.metro); }],
  [at(13, 40), (s) => give(s, 'zoya')],
]);
assert(r.links.has('phone-returned'));

// Meera posts whatever she hears: biryani told to her reaches the stage crowd and pulls them to CP.
r = play([[at(12, 10), (s) => whisper(s, 'meera', 'biryani')]]);
for (const l of ['meera-amplifies', 'biryani-rush']) assert(r.links.has(l), `biryani chain fires ${l}`);

assert(r.links.has('asha-denies'), 'Asha tells the biryani crowd the truth');

// Grab the speaker while Ravi is watching: he takes it straight back.
r = play([[at(10, 5), (s) => { take(s, 'speaker', ['ravi']); assert.equal(s.player.carrying, null); }]]);
assert(r.links.has('owner-reclaims'));
assert.equal(r.s.ending, 'packed');

// Speaker gone, shuttle stuck, and the biryani rumour on top: the CP jam becomes a biryani hunt.
r = play([
  [at(10, 5), (s) => { take(s, 'speaker'); moveTo(s, SPOTS.metro); act(s, { type: 'drop' }); }],
  [at(11, 10), (s) => { take(s, 'key'); moveTo(s, SPOTS.metro); }],
  [at(12, 5), (s) => whisper(s, 'mira', 'biryani')],
]);
assert(r.links.has('biryani-rush'));
assert.equal(r.s.ending, 'biryani');

// --- slice 3: police line, megaphone, minister ------------------------------

// Idle: the stream goes viral at the speech and the 15:00 police line follows the camera to the stage.
r = play([]);
assert(r.links.has('stream-viral') && r.links.has('line-follows-camera'));
assert.equal(r.s.police.line, 'stage');

// No speaker means no big speech, no viral stream, so Rao picks the biggest crowd instead.
r = play([[at(10, 5), (s) => { take(s, 'speaker'); moveTo(s, SPOTS.metro); }]]);
assert(r.links.has('police-line') && !r.links.has('line-follows-camera'));

// Take Dev's megaphone while he has chai and give it to Mira: the stage sings and the line steps back.
r = play([
  [at(14, 20), (s) => { assert(take(s, 'megaphone').ok); assert(give(s, 'mira').ok); moveTo(s, SPOTS.metro); }],
]);
for (const l of ['megaphone-given', 'mira-megaphone', 'singalong-line']) assert(r.links.has(l), `singalong chain fires ${l}`);
assert.equal(r.s.ending, 'singalong');

// Tell Dev a minister is coming: he takes a crowd to the barricade, the rumour reaches Zoya, nobody comes,
// and with Sharma at the barricade it gets physical, live on her stream.
r = play([[at(10, 10), (s) => whisper(s, 'dev', 'minister')]]);
for (const l of ['minister-wait', 'clash-live']) assert(r.links.has(l), `minister chain fires ${l}`);
assert.equal(r.s.ending, 'viral');

// Same, but with Zoya's phone gone nobody films it.
r = play([
  [at(10, 10), (s) => whisper(s, 'dev', 'minister')],
  [at(13, 12), (s) => { take(s, 'phone'); moveTo(s, SPOTS.metro); }],
]);
assert(r.links.has('dev-provokes'));
assert.equal(r.s.ending, 'scuffle');

// Minister rumour, but the megaphone is gone: Dev's crowd fizzles.
r = play([
  [at(10, 10), (s) => whisper(s, 'dev', 'minister')],
  [at(14, 20), (s) => { take(s, 'megaphone'); moveTo(s, SPOTS.metro); }],
]);
assert(r.links.has('dev-fizzles'));
assert.equal(r.s.ending, 'noshow');

// Minister rumour, and a speaker party at CP at 15:05 that pulls Sharma off the barricade just before 16:00:
// Dev's crowd walks straight through onto Parliament Street.
r = play([
  [at(10, 5), (s) => { take(s, 'speaker'); moveTo(s, SPOTS.metro); }],
  [at(10, 10), (s) => whisper(s, 'dev', 'minister')],
  [at(15, 5), (s) => { moveTo(s, { x: -6, z: -45 }); act(s, { type: 'drop' }); moveTo(s, SPOTS.metro); }],
]);
assert(r.links.has('barricade-push'), `barricade push (got ${[...r.links]})`);
assert.equal(r.s.ending, 'march');

// --- slice 4: water, Nikhil and Kabir ---------------------------------------

// Hide the water crate: nobody brings Sana water, people faint at 14:00.
r = play([[at(12, 0), (s) => { take(s, 'water'); moveTo(s, SPOTS.metro); act(s, { type: 'drop' }); }]]);
assert(r.links.has('heat'));
assert.equal(r.s.ending, 'heat');

// Steal the key so the shuttle never brings the water, then carry the crate to Sana yourself.
r = play([
  [at(11, 10), (s) => { take(s, 'key'); moveTo(s, SPOTS.metro); act(s, { type: 'drop' }); }],
  [at(12, 50), (s) => { take(s, 'water'); assert(give(s, 'sana').ok); }],
]);
assert(r.links.has('water-delivered') && !r.links.has('heat'));

// Bring Nikhil to Kabir, then give Kabir the megaphone: he stays and roasts Rao live.
r = play([
  [at(10, 5), (s) => { moveTo(s, s.people.nikhil); act(s, { type: 'talk', to: 'nikhil' }); walkPlayer(s, SPOTS.metroPath); walkPlayer(s, { x: -3, z: -1 }); }],
  [at(14, 20), (s) => { assert(take(s, 'megaphone').ok); assert(give(s, 'kabir').ok, 'Kabir is still here to take it'); moveTo(s, SPOTS.metro); }],
]);
for (const l of ['nikhil-finds-kabir', 'kabir-roast']) assert(r.links.has(l), `roast chain fires ${l}`);
assert(!r.links.has('kabir-leaves'));
assert.equal(r.s.ending, 'roast');

// The shuttle waits while the player stands in its lane (the engine checks the lane itself).
{
  const s = createDay();
  while (s.bus.phase !== 'toJantar') advance(s, 0.1);
  const z = s.bus.z; Object.assign(s.player, { x: s.bus.x, z: s.bus.z + 6 }); advance(s, 3);
  assert.equal(s.bus.z, z, 'a blocked shuttle stays put');
  Object.assign(s.player, SPOTS.metro); advance(s, 1);
  assert.notEqual(s.bus.z, z);
}

// Lost Nikhil stands still while the player is close enough to talk to him.
{
  const s = createDay();
  advance(s, 2);
  moveTo(s, { x: s.people.nikhil.x + 1.5, z: s.people.nikhil.z });
  const { x, z } = s.people.nikhil;
  advance(s, 30);
  assert(dist(s.people.nikhil, { x, z }) < 0.3, 'Nikhil waits for you');
}

// Rao sends the line to a scuffle.
r = play([[at(10, 10), (s) => whisper(s, 'dev', 'minister')]]);
assert.equal(r.s.police.line, 'barricade');

// --- the protest-day slice: pester, chase, crew, provocateurs -------------------------

const nikhilToKabir = (s) => { moveTo(s, s.people.nikhil); act(s, { type: 'talk', to: 'nikhil' }); walkPlayer(s, SPOTS.metroPath); walkPlayer(s, { x: -3, z: -1 }); };
const pester = (s, to, how) => { moveTo(s, s.officers[to] || s.people[to]); const r = act(s, { type: 'pester', to, how }); assert(r.ok, `pester ${to}`); return r; };

// The cannon rumour told to Asha at 11:35 reaches CP during Iqbal's break; nobody boards for Jantar.
r = play([[at(11, 35), (s) => whisper(s, 'asha', 'cannon')]]);
assert(r.links.has('cp-refuses'));

// Charm Sharma twice: he goes soft. Ask a constable for the water cannon in the morning: it becomes a dance.
// Point a provocateur out to soft Sharma: he walks him off. At the charge Sharma lets Kabir through.
r = play([
  [at(10, 5), nikhilToKabir],
  [at(10, 20), (s) => { pester(s, 'sharma', 'career'); pester(s, 'sharma', 'cute'); assert.equal(s.people.sharma.mood, 'soft'); pester(s, 'c1', 'cannon'); }],
  [at(14, 34), (s) => {
    const p = s.provocateurs[0], sh = s.people.sharma;
    moveTo(s, p); Object.assign(sh, { x: p.x + 2, z: p.z }); // Sharma happens to be doing the rounds
    assert(act(s, { type: 'provocateur', id: p.id, how: 'report', to: 'sharma' }).ok);
    assert.equal(p.state, 'reported');
    moveTo(s, SPOTS.metro);
  }],
]);
for (const l of ['pester-soft', 'cannon-dance', 'provocateur-reported', 'sharma-lets-through']) assert(r.links.has(l), `soft Sharma chain fires ${l}`);
assert.equal(r.s.police.charge.letThrough, 'kabir');
assert(r.s.people.kabir.mode !== 'detained');

// Pester the same constable three times: annoyed. Film it; the 17:00 repost calls it back.
// Steal the key in front of the CP constable and lose him in the stage crowd. Spread the DRS rumour. Join a provocateur.
r = play([
  [at(10, 15), (s) => { pester(s, 'c1', 'career'); assert(act(s, { type: 'film' }).ok); pester(s, 'c1', 'cute'); pester(s, 'c1', 'cute'); assert.equal(s.officers.c1.mood, 'annoyed'); }],
  [at(11, 10), (s) => { moveTo(s, SPOTS.keyHook); act(s, { type: 'take', object: 'key', witnesses: ['c2'] }); for (let i = 0; i < 60; i++) { const d = dist(s.player, { x: 0, z: -5.5 }); if (d < 0.5) break; s.player.x += (0 - s.player.x) / d * 0.8; s.player.z += (-5.5 - s.player.z) / d * 0.8; advance(s, 0.1); } advance(s, 4); assert.equal(s.player.chasedBy, null); }],
  [at(12, 5), (s) => whisper(s, 'mira', 'sena')],
  [at(14, 34), (s) => { const p = s.provocateurs[0]; moveTo(s, p); assert(act(s, { type: 'provocateur', id: p.id, how: 'join' }).ok); }],
]);
for (const l of ['officer-annoyed', 'chase', 'chase-lost', 'sena-called', 'provocateur-joined', 'joined-stone', 'repost']) assert(r.links.has(l), `chaos chain fires ${l}`);

// Enough aura to rally: expose the provocateur, take three students to the barricade and sit down.
r = play([
  [at(10, 20), (s) => { pester(s, 'sharma', 'career'); pester(s, 'sharma', 'cute'); pester(s, 'c1', 'cannon'); }],
  [at(14, 34), (s) => {
    const p = s.provocateurs[0]; moveTo(s, p);
    assert(act(s, { type: 'provocateur', id: p.id, how: 'expose' }).ok);
    moveTo(s, { x: 0, z: -5.5 }, 0);
    assert(act(s, { type: 'rally' }).ok);
    walkPlayer(s, { x: 36.5, z: -4.5 }); advance(s, 4);
  }],
]);
for (const l of ['provocateur-exposed', 'crew-join', 'crew-block', 'sitin']) assert(r.links.has(l), `crew chain fires ${l}`);

// Help people all day, then report a provocateur to the wrong cop: you're detained, and a friend gets you out.
r = play([
  [at(10, 5), nikhilToKabir],
  [at(12, 15), (s) => { take(s, 'water'); give(s, 'sana'); }],
  [at(14, 34), (s) => {
    const p = s.provocateurs[0], c = s.officers.c4;
    moveTo(s, p); Object.assign(c, { x: p.x + 2, z: p.z });
    act(s, { type: 'provocateur', id: p.id, how: 'report', to: 'c4' });
    assert(s.player.detained);
  }],
]);
for (const l of ['report-wrong', 'detained', 'friend-distracts']) assert(r.links.has(l), `wrong report chain fires ${l}`);

// Reader check: every rule and every link has content, and every link is reachable by some script above or by an owner.
for (const rule of RULES) assert(LINES[rule.says], `rule ${rule.id} says something visible`);
for (const id of Object.keys(LINKS)) assert(LINKS[id].from && LINKS[id].to);
for (const id of ['detained', 'viral', 'scuffle', 'march', 'roast', 'singalong', 'heat', 'ghost', 'biryani', 'cpjam', 'noshow', 'packed', 'quiet']) assert(ENDINGS[id], `ending ${id}`);
for (const r of Object.values(RUMOURS)) assert(!r.unlock || HINTS[r.unlock]);
for (const a of AMBIENT) assert(PEOPLE[a.who] && a.line);
const unseen = Object.keys(LINKS).filter((id) => !everSeen.has(id));
assert.deepEqual(unseen, [], 'every board link happens in at least one scripted day');
assert(RULES.length >= 30, `${RULES.length} rules`);
for (const list of Object.values(TALK)) for (const t of list) assert(!t.hint || HINTS[t.hint], `hint ${t.hint}`);
for (const id of Object.keys(TALK)) assert(AGAIN[id]?.length, `${id} has lines for being asked again`);

console.log(`PASS: ${RULES.length} rules; slice 1 days, rumours, stream, police line, megaphone, minister, water and Nikhil days end differently`);
