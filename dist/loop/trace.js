// Recordings: a played day as the exact inputs the engine received, so a day you played (and the bug in it)
// replays tick for tick in Node: `npm run verify:replay -- verify/recordings/<file>.json`. Saved recordings
// in verify/recordings/ are replayed by every `npm run verify` and must not break an invariant or crash.
// The client records every loop; with ?dev, K saves it.
//
// Format v1: { v: 1, tempo, step: 0.1, ticks, steps: [{ k, cmds?: [cmd], in?: { x, z, unseen } }], meta }
// Within tick k the order is fixed: commands issued since the last tick, then inputs, then tick().
// That is the browser's order too (input handlers fire between frames; step() sets inputs, then ticks).
// Pure module: callers pass the engine.

export const RECORDING_VERSION = 1;
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
    recording(extra = {}) {
      return { v: RECORDING_VERSION, tempo: day.tempo, step: STEP, ticks: k, steps: steps.slice(), meta: { ...meta, ...extra } };
    },
  };
}

/** Sets one tick's inputs on the day: where the player stands, and whether the chaser has lost sight of them. */
export function setInputs(s, { x, z, unseen } = {}) {
  if (x !== undefined) s.player.x = x;
  if (z !== undefined) s.player.z = z;
  if (unseen !== undefined) s.player.unseen = !!unseen;
}

/**
 * Replays a recording from 10:00. onTick(s, k, results) runs after each tick; results are that tick's act()
 * return values. Returns the final day. Stops early if the day ends.
 */
export function replayRecording(rec, R, { onTick = null, onAct = null } = {}) {
  if (rec.v !== RECORDING_VERSION) throw new Error(`recording v${rec.v} unsupported`);
  R.setTempo(rec.tempo || 'long');
  const s = R.createDay();
  const byK = new Map(rec.steps.map((st) => [st.k, st]));
  for (let k = 0; k < rec.ticks && !s.over; k++) {
    const st = byK.get(k), results = [];
    for (const cmd of st?.cmds ?? []) { const r = R.act(s, cmd); results.push(r); onAct?.(s, cmd, r); }
    if (st?.in) setInputs(s, st.in);
    R.tick(s, rec.step ?? STEP);
    onTick?.(s, k, results);
  }
  return s;
}
