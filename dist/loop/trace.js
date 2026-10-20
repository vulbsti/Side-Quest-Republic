// Traces: a whole day as the exact inputs the engine received, so any day (a playtest, a verify/
// counterexample) can be replayed tick for tick in Node or in the browser (?replay=<url>).
// Pure and engine-agnostic: callers pass the engine ({ createDay, tick, act, setInputs }) so the
// browser never loads a second copy of rules.js.
//
// Format v1:
//   { v: 1, tempo, step: 0.1, ticks, steps: [{ k, cmds?: [cmd], in?: { x, z, unseen } }], meta? }
// Within tick k the order is fixed: commands issued since the last tick, then inputs, then tick().
// That is the browser's order too (input handlers fire between frames; step() sets inputs, then ticks).

export const TRACE_VERSION = 1;
export const STEP = 0.1;

/** Records what the client feeds the engine. Inputs are stored only when they change. */
export function createRecorder(day, meta = {}) {
  const steps = [];
  let k = 0, last = null;
  const at = () => {
    let st = steps[steps.length - 1];
    if (!st || st.k !== k) steps.push((st = { k }));
    return st;
  };
  return {
    act(cmd) { (at().cmds ??= []).push(JSON.parse(JSON.stringify(cmd))); },
    inputs(inp) {
      // Full precision: rounding here would make replays drift from the day that was played.
      const v = { x: inp.x, z: inp.z, unseen: !!inp.unseen };
      if (last && v.x === last.x && v.z === last.z && v.unseen === last.unseen) return;
      at().in = last = v;
    },
    tick() { k++; },
    trace(extra = {}) {
      return { v: TRACE_VERSION, tempo: day.tempo, step: STEP, ticks: k, steps: steps.slice(), meta: { ...meta, ...extra } };
    },
  };
}

/**
 * Replays a trace. onTick(s, k, results) runs after each tick (for checks or rendering); results are
 * act() return values for that tick. Returns the final day. Stops early if the day ends.
 */
export function replay(trace, engine, { onTick = null, until = Infinity, day = null } = {}) {
  if (trace.v !== TRACE_VERSION) throw new Error(`trace v${trace.v} unsupported`);
  const s = day ?? engine.createDay({ tempo: trace.tempo });
  const byK = new Map(trace.steps.map((st) => [st.k, st]));
  for (let k = 0; k < Math.min(trace.ticks, until) && !s.over; k++) {
    const results = replayTick(s, byK.get(k), engine);
    engine.tick(s, trace.step ?? STEP);
    onTick?.(s, k, results);
  }
  return s;
}

/** Applies one tick's recorded commands and inputs (without ticking). The browser's replay driver uses this. */
export function replayTick(s, st, engine) {
  const results = [];
  if (!st) return results;
  for (const cmd of st.cmds ?? []) results.push(engine.act(s, cmd));
  if (st.in) engine.setInputs(s, st.in);
  return results;
}
