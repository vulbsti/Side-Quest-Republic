// The phone's running timeline and people's chatter, played through the engine.
// 1. An idle day: the feed posts at least every 5 game minutes, the group chat keeps going, posts that need
//    something you did stay hidden, and two-version chat moments (Kabir stays / goes) send only one version.
// 2. Standing near pairs of cast plays chatter: many different exchanges play, none twice, every line
//    is spoken by a visible member of its cast near you.
import assert from 'node:assert/strict';
import { R } from './lib/story.mjs';
import { FEED_TIMELINE, CHAT_TIMELINE } from '../dist/loop/phone-timeline.js';
import chatterFile from '../dist/loop/story/chatter.js';

const { CHATTER } = chatterFile;
const clock = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return R.at(h, m || 0); };
const minute = (t) => Math.round(t / R.mins(1));

// --- 1. the feed and the chat on an idle day ---------------------------------------------------
{
  const s = R.createDay();
  const feed = [], chat = [];
  while (!s.over && s.t < R.at(18, 0)) {
    R.advance(s, R.mins(1));
    for (const e of R.drainEvents(s)) {
      if (e.kind === 'feed' && String(e.key).startsWith('feed:')) feed.push(e);
      if (e.kind === 'chat' && String(e.key).startsWith('chat-timeline:')) chat.push(e);
    }
  }
  const times = [0, ...feed.map((e) => minute(e.t)), 480];
  let worst = 0;
  for (let i = 1; i < times.length; i++) worst = Math.max(worst, times[i] - times[i - 1]);
  assert.ok(worst <= 5, `the feed went ${worst} game minutes without a post`);
  assert.ok(feed.length >= 96, `only ${feed.length} feed posts on an idle day`);
  const texts = feed.map((e) => e.text);
  assert.equal(new Set(texts).size, texts.length, 'a feed post repeated');
  for (const f of FEED_TIMELINE.filter((x) => x.requires && (x.requires.did || x.requires.flags?.includes('cannon-requested')))) {
    assert.ok(!texts.some((t) => t.endsWith(f.caption)), `"${f.id}" needs something you did but posted on an idle day`);
  }
  assert.ok(chat.length >= 80, `only ${chat.length} group chat lines on an idle day`);
  const said = chat.map((e) => e.text);
  // Kabir goes home at 14:00 on an idle day: his "going home" version plays, his "staying" version doesn't.
  assert.ok(said.some((t) => t.includes('main ja raha hoon guys')), 'Kabir never said he was going home');
  assert.ok(!said.some((t) => t.includes('main ruk raha hoon')), 'Kabir said he was staying on an idle day');
  console.log(`ok  feed: ${feed.length} posts on an idle day, longest gap ${worst} game min; chat: ${chat.length} lines`);
}

// --- 2. chatter near pairs of cast -----------------------------------------------------------------
{
  const s = R.createDay();
  const body = (id) => s.people[id] || R.officerById(s, id);
  const tries = {}, heardIds = [], lines = [];
  const byId = Object.fromEntries(CHATTER.map((c) => [c.id, c]));
  for (let m = 0; m < 480 && !s.over; m += 1) {
    R.advance(s, R.at(10, m) - s.t);
    const phase = R.phaseAt(s.t);
    const c = CHATTER.find((x) => {
      if (s.story.played[x.id] || (tries[x.id] || 0) >= 3 || !x.phase.includes(phase)) return false;
      const r = x.requires || {};
      if (r.after && s.t < clock(r.after)) return false;
      if (r.before && s.t >= clock(r.before)) return false;
      if (r.flags || r.anyFlags || r.did) return false; // needs something the idle player never did
      if ((r.notFlags || []).some((f) => s.flags[f])) return false;
      return x.cast.every((id) => body(id) && !body(id).hidden);
    });
    if (c) {
      tries[c.id] = (tries[c.id] || 0) + 1;
      const bs = c.cast.map(body);
      s.player.x = bs.reduce((a, b) => a + b.x, 0) / bs.length;
      s.player.z = bs.reduce((a, b) => a + b.z, 0) / bs.length;
    }
    // Stay put long enough for an exchange to play out (beats are 2.6 s apart).
    for (let i = 0; i < 20; i++) {
      R.advance(s, 0.5);
      for (const e of R.drainEvents(s)) {
        if (!String(e.key).startsWith('chatter:')) continue;
        const id = e.key.slice('chatter:'.length);
        if (!heardIds.includes(id)) heardIds.push(id);
        lines.push({ id, who: e.who, text: e.text, pos: e.pos });
      }
    }
  }
  // No exchange plays twice: every line belongs to one play of its exchange.
  for (const id of heardIds) {
    const got = lines.filter((l) => l.id === id).map((l) => l.text);
    const want = byId[id].beats.map((b) => b.line);
    assert.deepEqual(got, want, `chatter ${id} played ${got.length} lines, expected its ${want.length} beats once`);
  }
  for (const l of lines) assert.ok(byId[l.id].cast.includes(l.who), `${l.who} spoke in ${l.id} but is not in its cast`);
  const open = CHATTER.filter((c) => !(c.requires?.flags || c.requires?.anyFlags || c.requires?.did)).length;
  assert.ok(heardIds.length >= 45, `only ${heardIds.length} of ${open} ungated chatter exchanges played`);
  const phases = new Set(heardIds.flatMap((id) => byId[id].phase));
  for (const p of ['morning', 'midday', 'tense', 'showdown', 'aftermath']) assert.ok(phases.has(p), `no chatter heard in ${p}`);
  console.log(`ok  chatter: ${heardIds.length}/${open} ungated exchanges heard, none repeated (${CHATTER.length} total)`);
}

// --- 3. a gated exchange plays only once its requirement holds ---------------------------------
{
  const s = R.createDay();
  R.advance(s, R.at(14, 10) - s.t);
  const near = () => { const a = s.people.sharma, b = R.officerById(s, 'r1'); s.player.x = (a.x + b.x) / 2; s.player.z = (a.z + b.z) / 2; };
  const hear = () => { const out = []; for (let i = 0; i < 80; i++) { near(); R.advance(s, 0.5); for (const e of R.drainEvents(s)) if (String(e.key).startsWith('chatter:')) out.push(e.key); } return out; };
  const before = hear();
  assert.ok(!before.includes('chatter:ch-pandey-sharma-cannon'), 'the cannon chatter played before anyone asked for the cannon');
  s.flags['cannon-requested'] = true;
  const after = hear();
  assert.ok(after.includes('chatter:ch-pandey-sharma-cannon'), `the cannon chatter did not play once asked (heard: ${after.join(', ')})`);
  console.log('ok  gated chatter waits for its flag');
}

assert.ok(CHAT_TIMELINE.length >= 60 && FEED_TIMELINE.length >= 100 && CHATTER.length >= 40);
console.log('phone + chatter: all passed');
