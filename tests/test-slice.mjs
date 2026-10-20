// Plays whole protest days three ways (idle, chaotic, helpful) and checks the showdown really bends:
// where it breaks out, how bad it gets, when the charge comes, who they go after, and your role.
// Then a few more scripted days so every cue and every clip kind in the spec fires somewhere.
import assert from 'node:assert/strict';
import {
  createDay, advance, act, at, mins, SPOTS, LINE_FRONT, CROWD_CENTERS, drainEvents, drainCues, dist, phaseAt,
  setTempo, TEMPO, opportunities, clockText, intensityBand, detentionPos, scenesAvailable,
} from '../dist/loop/rules.js';
import { LINES, LINKS, CALLBACKS, INTENTS, SHOWDOWNS, ROLES, TALK, HINTS } from '../dist/loop/content.js';
import { SCENES } from '../dist/loop/scenes.js';

const SPEC_CUES = ['arrival-wave', 'party-suv', 'sena-bikes', 'barricades-up', 'raf-arrive', 'provocateur-drop',
  'stone-thrown', 'cannon-roll', 'cannon-spray', 'cannon-dance', 'gas-fired', 'charge-start', 'charge-end',
  'chase-start', 'chase-lost', 'caught', 'bus-stalled', 'detainees-escape', 'crowd-laugh', 'crowd-gasp',
  'awkward-silence', 'crew-join', 'crew-block', 'clip-posted', 'scene-start', 'scene-end', 'phase', 'faint', 'ambulance'];
const SPEC_CLIPS = ['bus-key', 'bus-stalled', 'detainees-escape', 'chase', 'caught', 'pester-career', 'pester-cute',
  'pester-cannon', 'detain-me', 'crew-block', 'speaker-party', 'big-speech', 'small-speech', 'biryani-rush',
  'cannon-scare', 'singalong', 'roast', 'minister-noshow', 'provocateur-exposed', 'provocateur-joined', 'stone-thrown',
  'cannon-spray', 'cannon-dance', 'gas', 'charge', 'faint', 'mummy-call', 'heat'];

const moveTo = (s, p, dx = 0.8) => Object.assign(s.player, { x: p.x + dx, z: p.z });
const runUntil = (s, t) => advance(s, Math.max(0, t - s.t));
// Walk the player at a given pace while the world runs, so followers (crew, a joined provocateur) keep up.
function walkPlayer(s, to, speed = 3) {
  while (dist(s.player, to) > 0.4 && !s.over) {
    const d = dist(s.player, to), step = Math.min(d, speed * 0.1);
    s.player.x += ((to.x - s.player.x) / d) * step; s.player.z += ((to.z - s.player.z) / d) * step;
    advance(s, 0.1);
  }
}
const ok = (r, why) => { assert(r.ok, `${why}: ${JSON.stringify(r)}`); return r; };
const pester = (s, to, how) => ok(act(s, { type: 'pester', to, how }), `pester ${to} ${how}`);
const film = (s, why) => ok(act(s, { type: 'film' }), `film ${why}`);

const allCues = new Set(), allClips = new Set(), allLinks = new Set();
function play(script, opts = {}) {
  const s = createDay(opts);
  const cues = [], events = [];
  const drain = () => { cues.push(...drainCues(s)); events.push(...drainEvents(s)); };
  for (const [t, fn] of script) { runUntil(s, t); drain(); if (s.over) break; fn(s); drain(); }
  while (!s.over) { advance(s, 5); drain(); }
  for (const c of cues) allCues.add(c.cue);
  for (const c of s.clips) allClips.add(c.kind);
  for (const e of events) if (e.link) allLinks.add(e.link);
  return { s, cues: new Set(cues.map((c) => c.cue)), links: new Set(events.map((e) => e.link).filter(Boolean)), events, card: s.outcome };
}

// --- idle: nobody touches anything --------------------------------------------
const idle = play([]);
{
  const { s, card } = idle;
  assert(s.over && s.t >= at(18, 0) - 0.2, 'the day runs to 18:00');
  assert.equal(s.ending, 'packed', 'old flavour survives as the headline id');
  assert(s.police.stone, 'unhandled provocateurs throw the first stone');
  assert.equal(clockText(s.police.stone.t), '15:30');
  assert.equal(card.chargeClock, '15:45', 'a stone brings the charge to 15 minutes later');
  for (const c of ['arrival-wave', 'party-suv', 'sena-bikes', 'barricades-up', 'raf-arrive', 'provocateur-drop', 'stone-thrown', 'cannon-roll', 'charge-start', 'charge-end', 'phase']) assert(idle.cues.has(c), `idle day shows ${c}`);
  assert.equal(card.role, 'spectator');
  assert(card.callbacks.length >= 3 && card.callbacks.length <= 5, `3-5 callbacks (${card.callbacks.length})`);
  for (const cb of card.callbacks) assert(cb.text && !cb.text.includes('{'), `callback text filled: ${cb.text}`);
}

// --- chaotic: steal the key in front of a constable, spread the DRS rumour, join a provocateur ----
const chaotic = play([
  [at(11, 10), (s) => {
    moveTo(s, SPOTS.keyHook, 0);
    ok(act(s, { type: 'take', object: 'key', witnesses: ['c2'] }), 'take key');
    assert.equal(s.player.chasedBy, 'c2');
    walkPlayer(s, CROWD_CENTERS.stage, 8); // sprint into the stage crowd
    advance(s, 4);
    assert.equal(s.player.chasedBy, null, 'lost him in the crowd');
  }],
  [at(12, 5), (s) => { moveTo(s, s.people.mira); ok(act(s, { type: 'whisper', to: 'mira', rumour: 'sena' }), 'whisper sena'); moveTo(s, CROWD_CENTERS.stage, 0); }],
  [at(14, 34), (s) => {
    const p = s.provocateurs[0];
    assert.equal(p.state, 'hidden');
    moveTo(s, p, 1);
    ok(act(s, { type: 'provocateur', id: p.id, how: 'join' }), 'join');
    film(s, 'joined');
    walkPlayer(s, { x: 60, z: -4 }, 3); // take him to Parliament Street, where the RAF are
  }],
  [at(15, 16), (s) => { walkPlayer(s, CROWD_CENTERS.stage, 8); advance(s, 5); }],
]);
{
  const { s, card } = chaotic;
  assert(chaotic.links.has('sena-called') || s.groups.sena.mood === 'angry', 'the DRS rumour brings the DRS, angry');
  assert.equal(s.groups.sena.mood !== 'chanting', true);
  assert(chaotic.cues.has('bus-stalled') && chaotic.cues.has('chase-start') && chaotic.cues.has('chase-lost'));
  assert.equal(s.police.stone.by, 'p1', 'the man you joined throws the stone');
  assert(chaotic.links.has('joined-stone'));
}

// --- helpful: charm Sharma, ask for the cannon, water to Sana, expose the provocateur, a crew that protects ---
const helpful = play([
  [at(10, 20), (s) => {
    moveTo(s, s.people.sharma);
    pester(s, 'sharma', 'career');
    assert.equal(s.people.sharma.mood, 'amused');
    pester(s, 'sharma', 'cute');
    assert.equal(s.people.sharma.mood, 'soft', 'twice and he goes soft');
    moveTo(s, s.officers.c1);
    pester(s, 'c1', 'cannon'); // a morning cannon request
  }],
  [at(12, 15), (s) => {
    moveTo(s, s.objects.water, 0);
    ok(act(s, { type: 'take', object: 'water', witnesses: [] }), 'take water');
    moveTo(s, s.people.sana);
    ok(act(s, { type: 'give', to: 'sana' }), 'give water');
  }],
  [at(14, 34), (s) => {
    const p = s.provocateurs[0];
    moveTo(s, p, 1);
    ok(act(s, { type: 'provocateur', id: p.id, how: 'expose' }), 'expose');
    moveTo(s, CROWD_CENTERS.stage, 0);
    const r = ok(act(s, { type: 'rally' }), 'rally');
    assert(r.crew >= 3, `a crew of ${r.crew}`);
    walkPlayer(s, LINE_FRONT.barricade, 3);
    advance(s, 4);
    assert.equal(s.player.blocking, 'barricade', 'the crew sits down at the barricade');
    ok(act(s, { type: 'stance', stance: 'protect' }), 'stance');
    film(s, 'crew-block');
  }],
]);
{
  const { s, card } = helpful;
  assert(s.waterOk && !s.heat, 'nobody faints');
  assert(s.provocateurs.every((p) => p.state === 'gone' && p.exposed), 'all three ran for the SUV');
  assert(!s.police.stone, 'no stone');
  assert(helpful.cues.has('cannon-dance'), 'the morning cannon request turns the cannon into a dance');
  assert(helpful.cues.has('crew-join') && helpful.cues.has('crew-block'));
  assert.equal(card.outcome, 'sitin');
}

// --- the three days must look clearly different by the afternoon ---------------------
const days = { idle: idle.card, chaotic: chaotic.card, helpful: helpful.card };
const show = (k) => Object.entries(days).map(([d, c]) => `${d}=${c[k]}`).join(' ');
for (const key of ['place', 'band', 'chargeClock', 'target', 'role']) {
  const vals = Object.values(days).map((c) => String(c[key]));
  assert.equal(new Set(vals).size, 3, `the three days differ in ${key}: ${show(key)}`);
}
assert.equal(days.idle.place, 'stage');
assert.equal(days.chaotic.place, 'parliament');
assert.equal(days.helpful.place, 'barricade');
assert.equal(days.chaotic.target, 'player');
assert.equal(days.helpful.target, 'crew');
assert.equal(days.chaotic.band, 'riot');
assert.equal(days.helpful.band, 'calm');
assert.equal(days.helpful.chargeAt, null, 'below 25 there is no charge');
assert(['instigator', 'detained'].includes(days.chaotic.role));
assert.equal(days.helpful.role, 'peacemaker');
assert(days.chaotic.chargeAt < days.idle.chargeAt, 'chaos brings the charge earlier');
for (const c of Object.values(days)) assert(c.callbacks.length >= 3 && c.callbacks.length <= 5, `${c.role}: ${c.callbacks.length} callbacks`);
assert(days.helpful.callbacks.some((c) => c.key === 'expose'), 'the helpful card names the expose');
assert(days.chaotic.callbacks.some((c) => c.key === 'joined-stone'), 'the chaotic card names the stone');

// --- more days, so every cue and clip kind fires somewhere --------------------------
// Pester the same constable three times: he gets annoyed. Film the morning bits; the 17:00 repost calls them back.
// Then the mummy call (Sharma as tuition teacher) and the cannon request scene, and a wrong report.
const scenes = play([
  [at(10, 15), (s) => {
    moveTo(s, s.officers.c1);
    pester(s, 'c1', 'career'); film(s, 'career');
    pester(s, 'c1', 'cute'); film(s, 'cute');
    const r = pester(s, 'c1', 'detainme');
    assert.equal(r.say, 'annoyed', 'third time in ten minutes');
    assert.equal(s.officers.c1.mood, 'annoyed');
    moveTo(s, s.people.sharma);
    pester(s, 'sharma', 'career');
  }],
  [at(13, 52), (s) => {
    assert.equal(s.people.kabir.mode, 'onCall', 'Kabir takes mummy\'s call by the barricade');
    moveTo(s, s.people.kabir);
    assert(scenesAvailable(s).includes('mummy-call'));
    ok(act(s, { type: 'scene', id: 'mummy-call' }), 'start mummy-call');
    ok(act(s, { type: 'scene', id: 'mummy-call', option: 1 }), 'Sharma plays the tuition teacher');
    assert(s.flags['kabir-stays'] && s.flags['sharma-tuition-teacher']);
    assert.equal(s.people.kabir.mood, 'grateful');
    film(s, 'mummy-call');
  }],
  [at(14, 5), (s) => {
    moveTo(s, s.people.sharma);
    ok(act(s, { type: 'scene', id: 'cannon-request' }), 'start cannon-request');
    ok(act(s, { type: 'scene', id: 'cannon-request', option: 3 }), 'room service');
    film(s, 'cannon request');
  }],
  [at(14, 34), (s) => {
    const p = s.provocateurs[0], c = s.officers.c4;
    moveTo(s, p, 1);
    Object.assign(c, { x: p.x + 2, z: p.z }); // a constable happens to be right there
    ok(act(s, { type: 'provocateur', id: p.id, how: 'report', to: 'c4' }), 'report to the wrong cop');
    assert(s.player.detained, 'he is protected; you are not');
  }],
]);
assert(scenes.s.flags['cannon-to-barricade'] && scenes.card.place === 'barricade', 'the cannon request pulls the showdown to the barricade');
assert(scenes.s.events !== undefined);
assert(scenes.cues.has('awkward-silence') && scenes.cues.has('scene-start') && scenes.cues.has('scene-end'));
assert(scenes.card.callbacks.some((c) => c.key === 'repost'), 'the morning clip comes back at 17:00');
assert(scenes.card.callbacks.some((c) => c.key === 'report-wrong'));
assert(scenes.links.has('cannon-dance'), 'the cannon request turns into a dance');

// Witnessed key theft and you stand there: caught, and you film it all from the van.
// Also: the water hidden, the cannon rumour at Asha's stall.
const caught = play([
  [at(10, 5), (s) => { moveTo(s, s.people.asha); act(s, { type: 'whisper', to: 'asha', rumour: 'cannon' }); }],
  [at(11, 10), (s) => {
    moveTo(s, SPOTS.keyHook, 0);
    ok(act(s, { type: 'take', object: 'key', witnesses: ['c2'] }), 'take key');
    film(s, 'bus key'); film(s, 'chase');
    advance(s, 10);
    assert(s.player.detained);
  }],
]);
assert(caught.cues.has('caught'));
assert.equal(caught.card.role, 'detained', 'you sat out the showdown in the van');

// Speaker party at CP, the speech flops, biryani and a minister who never comes.
const party = play([
  [at(10, 5), (s) => { moveTo(s, s.objects.speaker, 0); act(s, { type: 'take', object: 'speaker', witnesses: [] }); moveTo(s, { x: -6, z: -45 }, 0); act(s, { type: 'drop' }); }],
  [at(10, 12), (s) => { moveTo(s, s.people.dev); act(s, { type: 'whisper', to: 'dev', rumour: 'minister' }); moveTo(s, { x: -6, z: -45 }, 0); }],
  [at(10, 25), (s) => film(s, 'speaker party')],
  [at(12, 1), (s) => { moveTo(s, SPOTS.stageTop, 2); film(s, 'small speech'); }],
  [at(12, 10), (s) => { moveTo(s, s.people.meera); act(s, { type: 'whisper', to: 'meera', rumour: 'biryani' }); }],
]);
assert(party.s.speech === 'small');

// Water hidden, megaphone to Mira: people faint at 14:00, the stage sings at 15:30 and nobody throws a stone.
const singalong = play([
  [at(12, 0), (s) => { moveTo(s, s.objects.water, 0); act(s, { type: 'take', object: 'water', witnesses: [] }); moveTo(s, SPOTS.metro, 0); act(s, { type: 'drop' }); }],
  [at(14, 0.5), (s) => { moveTo(s, SPOTS.sanaTent); film(s, 'faint'); }],
  [at(14, 20), (s) => { moveTo(s, s.objects.megaphone, 0); ok(act(s, { type: 'take', object: 'megaphone', witnesses: [] }), 'meg'); moveTo(s, s.people.mira); ok(act(s, { type: 'give', to: 'mira' }), 'give mira'); }],
]);
assert(singalong.cues.has('faint') && singalong.cues.has('ambulance'));
assert.equal(singalong.s.moment, 'singalong');
assert(singalong.links.has('singing-no-stone'), 'a singing crowd gives the provocateurs nothing to hide in');
assert(!singalong.s.police.stone);

// Nikhil to Kabir, Kabir gets the mic: the roast.
const roast = play([
  [at(10, 5), (s) => { moveTo(s, s.people.nikhil); act(s, { type: 'talk', to: 'nikhil' }); walkPlayer(s, SPOTS.metroPath, 4.5); walkPlayer(s, { x: -3, z: -1 }, 4.5); }],
  [at(14, 20), (s) => { moveTo(s, s.objects.megaphone, 0); act(s, { type: 'take', object: 'megaphone', witnesses: [] }); moveTo(s, s.people.kabir); ok(act(s, { type: 'give', to: 'kabir' }), 'give kabir'); }],
]);
assert.equal(roast.s.moment, 'roast');

// Nikhil keeps Kabir all day; the charge drags Kabir onto the detention bus. "Sir mujhe bhi detain kar lo":
// mid-scene the friends slip out the back, and you choose to stay on the bus and miss the showdown.
const detainMe = play([
  [at(10, 5), (s) => { moveTo(s, s.people.nikhil); act(s, { type: 'talk', to: 'nikhil' }); walkPlayer(s, SPOTS.metroPath, 4.5); walkPlayer(s, { x: -3, z: -1 }, 4.5); }],
  [at(15, 47), (s) => {
    assert(s.detention.people.includes('kabir'), 'the charge put Kabir on the bus');
    moveTo(s, detentionPos(s));
    ok(act(s, { type: 'scene', id: 'detain-me' }), 'start detain-me');
    assert(s.player.detained, '"Andar."');
    advance(s, 33); // the beats play (the client reports beats; the engine also paces them itself)
    assert(!s.detention.people.includes('kabir'), 'Kabir is out the back before the options');
    film(s, 'detainees escape from inside');
    ok(act(s, { type: 'scene', id: 'detain-me', option: 1 }), 'stay on the bus');
    assert(s.player.detained && s.flags['player-stays-detained']);
    film(s, 'detain-me');
  }],
]);
assert(detainMe.cues.has('detainees-escape'));
assert(detainMe.card.callbacks.some((c) => c.key === 'detain-me'));

// Take the detention bus key while it holds detainees: they walk off.
const busKey = play([
  [at(15, 50), (s) => {
    assert(s.detention.count > 0, 'the charge filled the bus');
    moveTo(s, s.objects.key, 0);
    ok(act(s, { type: 'take', object: 'key', witnesses: [] }), 'take the detention bus key');
    advance(s, mins(3));
    assert.equal(s.detention.count, 0, 'no key, no jail');
  }],
]);
assert(busKey.links.has('detainees-escape'));
assert(busKey.card.callbacks.some((c) => c.key === 'key-escape'));

const missingCues = SPEC_CUES.filter((c) => !allCues.has(c));
assert.deepEqual(missingCues, [], 'every cue in the spec fires in some day');
const missingClips = SPEC_CLIPS.filter((c) => !allClips.has(c));
assert.deepEqual(missingClips, [], 'every clip kind in the spec is posted in some day');

// --- opportunities: always something to do within ~10 m ---------------------------
{
  const s = createDay();
  let worst = 0, misses = 0, samples = 0;
  const route = [SPOTS.metro, SPOTS.metroPath, CROWD_CENTERS.stage, SPOTS.cpPost, SPOTS.chai, SPOTS.busCP, SPOTS.midway, SPOTS.barricade, SPOTS.parliament];
  while (!s.over) {
    advance(s, mins(10));
    if (s.over) break;
    for (const p of route) {
      const o = opportunities(s, p);
      assert(o.length >= 1, 'always at least one card');
      for (const x of o) assert(x.text && !x.text.includes('{') && Number.isFinite(x.x), `intent text ${x.id}`);
      samples++;
      if (o[0].d > 11) { misses++; worst = Math.max(worst, o[0].d); }
    }
  }
  assert(misses / samples < 0.1, `something within 10 m at ${samples - misses}/${samples} sampled spots (worst ${worst.toFixed(1)} m)`);
}

// --- the long tempo: same day, 32 real minutes ------------------------------------
setTempo(TEMPO.long);
{
  const long = play([], { tempo: 'long' });
  assert(long.s.t >= at(18, 0) - 0.2 && Math.abs(at(18, 0) - 8 * 60 * 4.0) < 1e-6, 'eight clock hours at 4 s a minute');
  assert.equal(long.s.ending, idle.s.ending, 'same headline at the long tempo');
  assert.equal(long.card.place, idle.card.place);
  assert.equal(long.card.chargeClock, idle.card.chargeClock, 'the charge is at the same clock time');
  assert.equal(phaseAt(at(16, 10)), 'showdown');
}
setTempo(TEMPO.slice);

// --- content checks ----------------------------------------------------------------
for (const id of Object.keys(SHOWDOWNS)) assert(SHOWDOWNS[id].title);
for (const id of ['spectator', 'instigator', 'protector', 'detained', 'filmer', 'peacemaker']) assert(ROLES[id], `role ${id}`);
for (const k of ['sitin', 'hold', 'scatter', 'block', 'protect']) assert(SHOWDOWNS[k], `showdown ${k}`);
for (const c of [idle, chaotic, helpful, scenes, caught, party, singalong, roast, detainMe, busKey]) for (const cb of c.card.callbacks) assert(CALLBACKS[cb.key]);
for (const st of ['hold', 'scatter', 'block', 'protect']) assert(LINES[`stance-${st}`] && LINES[`charge-${st}`]);
for (const list of Object.values(TALK)) for (const t of list) assert(!t.hint || HINTS[t.hint], `hint ${t.hint}`);
for (const id of Object.keys(SCENES)) assert(INTENTS[`scene-${id}`], `scene intent ${id}`);
assert(Object.keys(LINKS).length > 50);
assert.equal(intensityBand(24), 'calm'); assert.equal(intensityBand(70), 'riot');

console.log('PASS slice:', Object.entries(days).map(([d, c]) => `${d}: ${c.title} at ${c.place}, ${c.band} (${c.intensity}), charge ${c.chargeClock ?? 'none'}, target ${c.target}, role ${c.role}`).join(' | '));
