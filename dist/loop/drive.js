// Plays a recorded trace: walks the player, issues each command, waits. One step at a time, called once
// before every engine tick, so the 3D client (?replay=) and the verifier (verify/lib/harness.mjs) drive
// the day identically and a trace found in Node replays exactly in the browser.
//
// A trace is a list of macro steps:
//   { do: id, cmd, at }        jog to the command's target (or `at`), then act(cmd) and watch 3 s
//   { do: id, cmd: null, at, hold } jog to `at`, then stand there `hold` clock minutes
//   { wait: minutes }          stand still while the day runs
//   { finish: true }           stand still until 18:00
// Pure module: it uses only the engine functions it is given.

export const STEP = 0.1; // the client's fixed step
export const JOG = 4.7; // the player's jog, m/s
export const FEEDBACK_SECONDS = 3; // after a command, watch this long for an answer
export const WALK_LIMIT = 150; // give up walking after this many seconds
export const REACH = { talk: 2.6, give: 2.6, take: 1.5, pester: 2.4, provocateur: 2.4, scene: 4, film: 10, rally: 1, drop: 0.6, go: 1 };
export const reachOf = (cmd) => (cmd ? REACH[cmd.type] ?? 1.5 : REACH.go);
// Commands that work wherever you are, so they are tried even if the walk didn't get there.
const ANYWHERE = (cmd) => cmd.type === 'stance' || cmd.type === 'plead' || (cmd.type === 'scene' && cmd.option != null);

/** How many STEP ticks `for (t = 0; t < seconds; t += STEP)` runs (floating point included). */
export function ticksFor(seconds) {
  let n = 0;
  for (let t = 0; t < seconds - 1e-9; t += STEP) n++;
  return n;
}

/** Where a command's target is now (people walk, so it is looked up every step). */
export function targetOf(R, s, cmd, at) {
  if (!cmd) return at;
  if (cmd.type === 'provocateur') { const p = s.provocateurs.find((x) => x.id === cmd.id); if (p) return cmd.how === 'report' ? at : p; }
  if (cmd.type === 'take') return s.objects[cmd.object];
  if (cmd.type === 'pester') return R.officerById(s, cmd.to) || at;
  if (cmd.type === 'talk' || cmd.type === 'give' || cmd.type === 'whisper') return s.people[cmd.to] || at;
  return at;
}

/**
 * A driver over one trace. Call before(s) once before every tick: it moves s.player and returns the command
 * to act() right now, or null. step() tells you which macro step is running. Hooks: onStep(step, i),
 * onAct(step, i) are called as steps start and commands go out; onEnd(step, i, info) when a step finishes.
 */
export function createDriver(R, trace, hooks = {}) {
  const steps = trace.slice();
  let i = -1, cur = null, mode = 'next', ticksLeft = 0, walked = 0, route = null;
  const d = {
    get index() { return i; },
    get step() { return cur; },
    get mode() { return mode; },
    get done() { return mode === 'done'; },
    /** Push more steps (the verifier decides as it goes). */
    push(...more) { steps.push(...more); if (mode === 'done') mode = 'next'; },
    before(s) {
      for (let guard = 0; guard < 4; guard++) {
        if (s.over) { mode = 'done'; return null; }
        if (mode === 'next') {
          if (i + 1 >= steps.length) { mode = 'done'; return null; }
          cur = steps[++i]; walked = 0; route = null;
          hooks.onStep?.(cur, i);
          if (cur.finish) { mode = 'finish'; }
          else if (cur.wait != null) { mode = 'wait'; ticksLeft = ticksFor(R.mins(cur.wait)); }
          else mode = 'walk';
        }
        if (mode === 'finish') return null; // runs until s.over
        if (mode === 'wait' || mode === 'feedback' || mode === 'hold') {
          if (ticksLeft > 0) { ticksLeft--; return null; }
          const was = mode;
          mode = 'next';
          hooks.onEnd?.(cur, i, { mode: was });
          continue;
        }
        if (mode === 'walk') {
          const pl = s.player;
          const target = targetOf(R, s, cur.cmd, cur.at);
          const reached = !!target && R.dist(pl, target) <= reachOf(cur.cmd);
          const stuck = pl.detained || walked >= WALK_LIMIT - 1e-9 || !target;
          if (reached || stuck) {
            if (!cur.cmd) {
              mode = 'hold'; ticksLeft = ticksFor(R.mins(cur.hold || 0)); cur.reached = reached;
              continue;
            }
            cur.reached = reached;
            if (!reached && !ANYWHERE(cur.cmd)) { mode = 'next'; hooks.onEnd?.(cur, i, { mode: 'never-reached' }); continue; }
            mode = 'feedback'; ticksLeft = ticksFor(FEEDBACK_SECONDS) - 1; // the tick right after the act is the first
            hooks.onAct?.(cur, i);
            return cur.cmd;
          }
          // Plan the waypoints once (round the observatory, via the CP post); a moving target only moves the end.
          if (!route || !route.length) route = R.route(pl, target);
          else route[route.length - 1] = { x: target.x, z: target.z };
          let left = JOG * STEP;
          while (left > 0 && route.length) {
            const q = route[0], dd = R.dist(pl, q);
            if (dd <= left) { pl.x = q.x; pl.z = q.z; route.shift(); left -= dd; } else { pl.x += ((q.x - pl.x) / dd) * left; pl.z += ((q.z - pl.z) / dd) * left; left = 0; }
          }
          walked += STEP;
          return null;
        }
        if (mode === 'done') return null;
      }
      return null;
    },
  };
  return d;
}
