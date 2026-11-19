// Bots that play the three-minute slice (dist/loop/slice.js) tick by tick on the real engine, moving the player
// the way the client does (jog 4.7, sprint 8.1 on the client's stamina, 3.4 carrying the speaker) and asking the
// verifier's sight rule (walls and the shuttle) whether the chaser still sees them.
import * as R from '../../dist/loop/rules.js';
import { routeEvent, engineView } from '../../dist/loop/present.js';
import { canSee, lostSight } from '../../dist/loop/sight.js';
import { moveWithCollisions } from '../../dist/simulation.js';
import { FLASH } from '../../dist/loop/slice-ui.js';
import { readFileSync } from 'node:fs';

// The world's walls (the verifier's snapshot of the live client) plus the shuttle where the engine has it: the bots
// run into buildings the way you do, so "sprint in a straight line" means what it means in the game.
const WORLD = JSON.parse(readFileSync(new URL('../../verify/world-obstacles.json', import.meta.url), 'utf8')).obstacles;
// One list for the whole run (the collision index is cached per list); the shuttle's four boxes are updated in place.
const BUS = R.busBoxes({ x: 0, z: 0, dx: 1, dz: 0 }), WALLS = [...WORLD, ...BUS];
const walls = (s) => { R.busBoxes(s.bus).forEach((o, i) => Object.assign(BUS[i], o)); return WALLS; };
const SIGHT = { canSee: (s) => canSee(s, walls(s)), lost: (s) => !!s.player.chasedBy && lostSight(s, walls(s)) };

export const STEP = 0.1;
const SPEED = { jog: 4.7, sprint: 8.1, heavy: 3.4 };
const STAMINA = { max: 100, min: 2, drain: 19, fill: 13 };
const ON_SCREEN = new Set(['bubble', 'officer', 'player', 'toast', 'radio', 'bark', 'convo', 'slice']);

const unit = (x, z) => { const d = Math.hypot(x, z) || 1; return { x: x / d, z: z / d }; };

/**
 * Policies. Each gets (s, bot) every tick and returns { dir: {x,z} | null, sprint, cmd? }.
 * - straight: holds sprint in one line away from the constable, the whole run.
 * - competent: cuts sideways at each lunge wind-up, hides in the bus-stop crowd when there is one, and works
 *   through the dares (topi, speaker, chabi), then snatches bonus topis.
 * - idle: stands there.
 */
export const POLICIES = {
  idle: () => ({ dir: null }),
  straight(s, bot) {
    const pl = s.player, c = pl.chasedBy && R.officerById(s, pl.chasedBy);
    if (c && !bot.line) bot.line = unit(pl.x - c.x, pl.z - c.z);
    return { dir: bot.line ?? null, sprint: true };
  },
  competent(s, bot) {
    const pl = s.player, sl = s.slice;
    if (pl.pinned) return { dir: null };
    if (pl.chasedBy) return flee(s, bot);
    const done = Object.fromEntries(sl.dares.map((d) => [d.id, d.done]));
    const sp = s.objects.speaker, key = s.objects.key, stop = R.CROWD_CENTERS.cp;
    if (pl.carrying === 'speaker') {
      const at = { x: stop.x - 2.5, z: stop.z };
      if (R.dist(pl, at) < 0.8) return { dir: null, cmd: { type: 'drop', x: at.x, z: at.z } };
      return go(pl, at);
    }
    if (pl.carrying === 'key') {
      // Show it to the nearest constable at his post.
      const o = Object.values(s.officers).filter((x) => !x.hidden && x.mode === 'post').sort((a, b) => R.dist(a, pl) - R.dist(b, pl))[0];
      return o ? go(pl, o, true) : { dir: null };
    }
    if (done.topi && !done.speaker && R.isFree(sp) && !(R.dist(sp, stop) <= 6 && sp.on)) {
      if (R.dist(pl, sp) < 1.3) return { dir: null, cmd: { type: 'take', object: 'speaker', witnesses: R.witnesses(s, SIGHT.canSee(s)) } };
      return go(pl, sp, true);
    }
    if (done.topi && !done.speaker && !R.isFree(sp)) return go(pl, R.SPOTS.speakerChai); // Ravi is taking it home
    if (done.topi && done.speaker && !done.chabi && key.holder === 'hook') {
      if (R.dist(pl, key) < 1.3) return { dir: null, cmd: { type: 'take', object: 'key', witnesses: R.witnesses(s, SIGHT.canSee(s)) } };
      return go(pl, key, true);
    }
    // The cold open was lost, or every dare is done: snatch a topi off the nearest bored constable.
    const a = R.affordances(s).filter((x) => x.kind === 'snatch').map((x) => R.officerById(s, x.cmd.to)).sort((p, q) => R.dist(p, pl) - R.dist(q, pl))[0];
    if (a) {
      if (R.dist(a, pl) < 2.5) return { dir: null, cmd: { type: 'snatch', to: a.id } };
      return go(pl, a, bot.stamina > 60);
    }
    return { dir: null };
  },
};
function go(pl, to, sprint = false) {
  const d = R.dist(pl, to);
  return d < 0.3 ? { dir: null } : { dir: unit(to.x - pl.x, to.z - pl.z), sprint, max: d };
}
/** Run from the chaser: into the bus-stop crowd if it is big enough, and sideways whenever he winds up a lunge. */
function flee(s, bot) {
  const pl = s.player, c = R.officerById(s, pl.chasedBy);
  let dir = unit(pl.x - c.x, pl.z - c.z);
  const stop = R.CROWD_CENTERS.cp;
  if (R.crowdAt(s, 'cp') >= 6) {
    const dc = R.dist(pl, stop);
    // Go for the crowd unless he stands between you and it; inside, keep to the side away from him.
    const goal = { x: stop.x + dir.x * 2.5, z: stop.z + dir.z * 2.5 };
    if (dc > 3.5 || R.dist(pl, goal) > 1) dir = unit(goal.x - pl.x, goal.z - pl.z);
    else dir = unit(-(c.z - pl.z), c.x - pl.x); // circle inside the crowd
  }
  if (s.chase?.lunge?.phase === 'windup') {
    bot.side = bot.side ?? 1;
    dir = { x: -dir.z * bot.side, z: dir.x * bot.side };
  } else if (s.chase?.lunge?.phase === 'stumble') bot.side = -(bot.side ?? 1);
  return { dir, sprint: true };
}

/**
 * Plays one slice run with a policy. Returns the day, what reached the screen, and where the time went.
 */
export function playSlice(policy = 'competent', { log = false } = {}) {
  R.setTempo('slice');
  const s = R.createDay({ slice: true });
  const bot = { stamina: STAMINA.max };
  const body = { x: s.player.x, z: s.player.z, y: 0, vy: 0, radius: 0.36, height: 1.8, stepHeight: 0.32, grounded: true };
  const pick = POLICIES[policy];
  const seen = [], cues = [];
  const time = { chased: 0, raviChase: 0, pinned: 0, free: 0 };
  let firstSkill = null;
  const view = () => engineView(s, R.placeAt);
  const watch = () => {
    for (const c of R.drainCues(s)) {
      cues.push({ t: s.t, cue: c.cue, data: c.data, pos: c.pos });
      // Text the slice HUD draws for a cue: the cutaway's caption, a dare's stamp.
      if (c.cue === 'slice:cutaway') seen.push({ t: s.t, channel: 'cutaway', text: `${c.data.title} ${c.data.sub}` });
      const flash = c.cue === 'lunge' ? FLASH.lunge : c.cue === 'lunge-miss' && c.data?.near ? FLASH.near : c.cue === 'caught' ? FLASH.caught : null;
      if (flash) seen.push({ t: s.t, channel: 'flash', text: flash.replace(/[^\w\s!]/g, '').trim() });
    }
    const v = view();
    for (const e of R.drainEvents(s)) {
      const r = routeEvent(e, v);
      if (r.seen && e.text && ON_SCREEN.has(r.channel)) seen.push({ t: s.t, channel: r.channel, who: e.who, text: e.text });
    }
  };
  watch();
  while (!s.over) {
    const pl = s.player;
    const want = pick(s, bot) || {};
    if (want.cmd) R.act(s, want.cmd);
    const heavy = pl.carrying === 'speaker';
    const moving = !!want.dir && !pl.pinned;
    const sprinting = moving && want.sprint && !heavy && bot.stamina > STAMINA.min;
    Object.assign(body, { x: pl.x, z: pl.z });
    if (moving) {
      const v = (heavy ? SPEED.heavy : sprinting ? SPEED.sprint : SPEED.jog) * STEP;
      const k = Math.min(v, want.max ?? v);
      moveWithCollisions(body, want.dir.x * k, want.dir.z * k, walls(s));
      pl.x = body.x; pl.z = body.z;
    }
    bot.stamina = Math.max(0, Math.min(STAMINA.max, bot.stamina + (sprinting ? -STAMINA.drain : STAMINA.fill) * STEP));
    pl.unseen = SIGHT.lost(s);
    R.tick(s, STEP);
    const ravi = s.slice.ravi.phase === 'chase';
    const skill = !!pl.chasedBy || ravi;
    if (skill && firstSkill == null) firstSkill = s.t;
    if (pl.chasedBy) time.chased += STEP; else if (ravi) time.raviChase += STEP; else if (pl.pinned) time.pinned += STEP; else time.free += STEP;
    watch();
  }
  const words = seen.reduce((n, i) => n + i.text.split(/\s+/).filter(Boolean).length, 0);
  const total = s.t;
  return {
    s, seen, cues, time, firstSkill, seconds: total,
    skillShare: (time.chased + time.raviChase) / total, chaseShare: time.chased / total,
    wordsPerMinute: words / (total / 60),
    caughtAt: cues.filter((c) => c.cue === 'caught').map((c) => Math.round(c.t * 10) / 10),
    lostAt: cues.filter((c) => c.cue === 'chase-lost').map((c) => Math.round(c.t * 10) / 10),
  };
}
