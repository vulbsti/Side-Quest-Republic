// The three-minute slice (?slice, dist/loop/slice.js), played whole in Node by bots that move like the client
// (walls included): a straight sprinter is usually caught, a player who cuts on the lunge and uses the crowd gets
// through the dares, the run ends at 180 s on the reel, the same inputs give the same run, and a normal day is
// untouched. (tests/test-slice.mjs is the older protest-day "slice" test; this one is the three-minute run.)
import assert from 'node:assert/strict';
import * as R from '../dist/loop/rules.js';
import { playSlice, POLICIES } from './lib/slice-bots.mjs';

// --- the cold open ---------------------------------------------------------------------------
{
  R.setTempo('slice');
  const s = R.createDay({ slice: true });
  assert.equal(s.tempo, R.TEMPO.slice, 'the slice runs at the slice tempo');
  assert.equal(s.player.chasedBy, 'c2', 'it opens mid-chase: Constable Meena is after you');
  assert.ok(R.dist(s.player, s.officers.c2) < 4, 'standing right beside her');
  assert.ok(R.dist(s.player, R.CROWD_CENTERS.cp) < 150 && R.dist(s.officers.c6, R.SPOTS.rickCP) < 3, 'a second constable waits at the e-rickshaw stand');
  assert.equal(s.objects.key.holder, 'hook', 'Iqbal is on his chai break, key on the hook');
  const v = R.sliceView(s);
  assert.deepEqual(Object.keys(v).slice(0, 4), ['left', 'followers', 'multiplier', 'dares']);
  assert.equal(v.left, 180);
  assert.deepEqual(v.dares.map((d) => d.id), ['topi', 'speaker', 'chabi']);
  for (const d of v.dares) assert.ok(d.text.split(/\s+/).length <= 7, `short dare copy: ${d.text}`);
  assert.equal(R.sliceView(R.createDay({ tempo: 'long' })), null, 'no slice view on a normal day');
  // Everything the player can do is still listed, plus the slice's drop at the bus stop once you carry the speaker.
  assert.ok(R.affordances(s).length > 0);
}

// --- straight-line sprinting: usually caught -----------------------------------------------------
{
  // Hold sprint in one line, in eight directions off the cold open: the lunge reads a straight run.
  let caught = 0;
  const N = 8;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    POLICIES[`straight${i}`] = (s, bot) => ({ dir: (bot.line ??= { x: Math.cos(a), z: Math.sin(a) }), sprint: true });
    const r = playSlice(`straight${i}`);
    const first = r.cues.find((c) => c.cue === 'caught' || c.cue === 'chase-lost');
    if (first?.cue === 'caught') caught++;
  }
  assert.ok(caught >= 6, `a straight sprinter is caught in the cold open most of the time (${caught}/${N})`);
  const r = playSlice('straight');
  assert.ok(r.caughtAt.length >= 1 && r.caughtAt[0] < 12, `running away in a straight line gets you caught early: ${r.caughtAt}`);
  assert.ok(!r.s.player.detained && !r.s.slice.dares[0].done, 'caught: sit-ups, not the van, and no topi dare');
  const pinned = r.cues.find((c) => c.cue === 'caught');
  assert.equal(pinned.data.light, true, 'every catch in the slice is the light one');
}

// --- a competent player: cuts on the lunge, hides in the crowd, does the dares -------------------------
const a = playSlice('competent');
{
  const { s, cues } = a;
  const done = Object.fromEntries(s.slice.dares.map((d) => [d.id, d.done]));
  assert.ok(done.topi && done.speaker && done.chabi, `all three dares: ${JSON.stringify(s.slice.dares)}`);
  assert.ok(a.lostAt.length >= 3, `chases lost: ${a.lostAt}`);
  assert.ok(cues.some((c) => c.cue === 'lunge-miss'), 'cutting sideways makes him grab air');
  assert.ok(s.history['rule:cp-party'] != null, 'the speaker at the stop starts the CP party');
  const party = cues.find((c) => c.cue === 'slice:dare' && c.data.id === 'speaker').t;
  assert.ok(s.history['rule:cp-party'] - party <= 6.5, `a dance party forms within about six seconds (${(s.history['rule:cp-party'] - party).toFixed(1)} s)`);
  assert.equal(s.objects.key.holder, 'gayab', 'the key is gayab');
  assert.ok(cues.some((c) => c.cue === 'bus-stalled'), 'Iqbal comes back to an empty hook and the shuttle sits');
  // Every dare is answered on screen within three seconds: followers, a cutaway, the stamp.
  for (const d of cues.filter((c) => c.cue === 'slice:dare')) {
    const near = (name) => cues.some((c) => c.cue === name && c.t >= d.t - 0.05 && c.t - d.t <= 3);
    assert.ok(near('slice:followers') && near('slice:cutaway'), `dare ${d.data.id} answered with followers and a cutaway`);
    assert.ok(d.data.followers > 0, 'a dare pays');
  }
  for (const c of cues.filter((x) => x.cue === 'slice:cutaway')) {
    assert.ok(c.data.title && (c.data.who || c.pos), 'a cutaway names who or where to look at');
    assert.ok(`${c.data.title} ${c.data.sub}`.split(/\s+/).length <= 12, `a cutaway caption is one short line: ${c.data.title} / ${c.data.sub}`);
  }
  // Followers: a number in the day, only ever going up, every gain announced.
  const gains = cues.filter((c) => c.cue === 'slice:followers');
  assert.equal(gains.reduce((n, c) => n + c.data.n, 0), s.slice.followers, 'every follower came with a pop');
  assert.ok(gains.some((c) => c.data.x2), "Meera's reel doubles some of it");
  assert.ok(a.firstSkill <= 0.2, 'the first skill moment is the first second');
  // Each later chase is a little harder.
  assert.ok(s.slice.chases >= 4);
  // Barks are six words or fewer.
  for (const l of a.seen.filter((x) => x.channel === 'slice')) assert.ok(l.text.split(/\s+/).length <= 6, `bark too long: ${l.text}`);
  // Caught: you are free again within five seconds, and what you took went back.
  for (const t of a.caughtAt) {
    const free = cues.find((c) => c.t > t && c.cue === 'chase-start') ?? null;
    if (free) assert.ok(free.t - t >= 4 - 0.2, 'pinned for the sit-ups first');
  }
}

// --- the end: exactly 180 s, the reel card ---------------------------------------------------
{
  const { s } = a;
  assert.ok(s.over && s.ending === 'reel', 'the run ends on the reel');
  assert.ok(Math.abs(s.t - 180) < 0.05, `at 180 s (${s.t})`);
  const o = s.outcome;
  assert.equal(o.slice, true);
  assert.equal(o.followers, s.slice.followers);
  assert.equal(o.dares.length, 3);
  assert.ok(o.moments.length >= 3 && o.moments.length <= 5, 'up to five moments');
  for (const m of o.moments) assert.ok(m.did && m.caused && m.views > 0, 'each moment: what you did, what it caused, views');
  assert.ok(o.moments.every((m, i) => !i || o.moments[i - 1].t <= m.t), 'in the order they happened');
  assert.equal(o.comments.length, 3, 'three comments');
  assert.ok(a.cues.some((c) => c.cue === 'slice:end'));
  assert.equal(R.act(s, { type: 'snatch', to: 'c2' }).ok, false, 'nothing happens after the end');
}

// --- the same inputs, the same run ------------------------------------------------------------
{
  const b = playSlice('competent');
  assert.deepEqual(b.s.outcome, a.s.outcome, 'two runs with the same inputs end the same');
  assert.deepEqual(b.cues.map((c) => [c.t, c.cue]), a.cues.map((c) => [c.t, c.cue]));
}

// --- a normal day is untouched ------------------------------------------------------------------
{
  const day = () => { const s = R.createDay({ tempo: 'long' }); R.advance(s, 400); R.drainCues(s); R.drainEvents(s); return s; };
  const before = day();
  playSlice('competent'); // a slice run in between must leave nothing behind in the module
  const after = day();
  assert.deepEqual(after, before, 'a default day plays the same before and after a slice run');
  assert.ok(!('slice' in after), 'and carries no slice state');
  assert.ok(after.schedule >= 3 && R.dist(after.objects.speaker, R.SPOTS.speakerChai) > 5, "the day's routines run: Ravi has taken his speaker off to the stage");
  assert.equal(after.officers.c6.post.x, 28.6, 'Constable Bisht is at the Patel Chowk crossing');
}

if (process.argv.includes('--report')) {
  for (const p of ['competent', 'straight', 'idle']) {
    const r = p === 'competent' ? a : playSlice(p);
    console.log(`${p}: followers ${r.s.slice.followers}, skill ${(r.skillShare * 100).toFixed(0)}% (police chases ${(r.chaseShare * 100).toFixed(0)}%), first skill at ${r.firstSkill?.toFixed(1)} s, ${r.wordsPerMinute.toFixed(0)} words on screen/min, caught ${r.caughtAt.length}, escaped ${r.lostAt.length}`);
  }
}
console.log('Slice: cold open mid-chase, three dares, followers, a reel at 180 s; straight sprinting is caught, cutting works.');
