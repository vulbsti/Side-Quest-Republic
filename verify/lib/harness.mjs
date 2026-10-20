// A headless player for the real engine. It walks, acts and waits the way the client does, routes every
// engine line through present.js (the same code the client uses to draw it), and records what happened
// in the day's own history (s.history), so a cloned day carries its past with it.
//
// A run is { s, trace, log }:
//   s      the engine's day (rules.js createDay), plain JSON, clones exactly
//   trace  the macro steps that led here, replayable from 10:00 with replay()
//   log    what the player saw or heard: [{ t, clock, kind, channel, who, key, text, seen }]
import * as R from '../../dist/loop/rules.js';
import { routeEvent, engineView, chatFor, tickerFor, reelsFor } from '../../dist/loop/present.js';
import { createDriver, targetOf as driveTarget, ticksFor, STEP, JOG, FEEDBACK_SECONDS } from '../../dist/loop/drive.js';

export { R };
export { STEP, JOG };
const targetOf = (s, cmd, at) => driveTarget(R, s, cmd, at);

export function newRun(tempo = 'long') {
  R.setTempo(tempo);
  const s = R.createDay({ tempo });
  return { s, trace: [], log: [], tempo };
}
/** A deep copy that continues exactly as the original would. */
export function cloneRun(run, { keepLog = false } = {}) {
  R.drainEvents(run.s); R.drainCues(run.s);
  return { s: structuredClone(run.s), trace: run.trace.slice(), log: keepLog ? run.log.slice() : [], tempo: run.tempo, act: run.act };
}
export const clock = (s) => R.clockText(s.t);
const mark = (s, key) => { if (!(key in s.history)) s.history[key] = s.t; };

// --- watching the screen ---------------------------------------------------------

/** Drain what the engine just said and did, and record what the player could notice of it. */
export function observe(run) {
  const s = run.s, log = run.log;
  const nf = Object.keys(s.flags).length, nm = Object.keys(s.memo).length;
  const quiet = !s.events.length && !s.cues.length && s.callbacks.length === run._cb && nf === run._nf && nm === run._nm && !s.story.convo && !s.story.queue.length;
  if (quiet) return;
  run._cb = s.callbacks.length; run._nf = nf; run._nm = nm;
  const v = engineView(s, R.placeAt);
  const put = (item) => log.push({ t: s.t, clock: clock(s), ...item });
  for (const e of R.drainEvents(s)) {
    const r = routeEvent(e, v);
    if (e.key) mark(s, 'said:' + e.key);
    if (e.key && r.seen) mark(s, 'seen:' + e.key);
    if (e.link) mark(s, 'link-said:' + e.link);
    if (r.learn) mark(s, 'link:' + e.link);
    put({ kind: 'line', channel: r.channel, who: e.who, key: e.key, text: e.text, seen: r.seen, why: r.why });
  }
  for (const c of R.drainCues(s)) {
    mark(s, 'cue:' + c.cue);
    for (const [who, text] of chatFor(c.cue)) put({ kind: 'phone', channel: 'chat', who, key: 'chat:' + c.cue, text, seen: true });
    if (c.cue === 'phase') {
      const ph = c.data?.phase ?? c.data;
      for (const text of tickerFor(ph)) put({ kind: 'phone', channel: 'ticker', who: 'ticker', key: 'ticker:' + ph, text, seen: true });
      for (const r of reelsFor(ph)) put({ kind: 'phone', channel: 'feed', who: r.page || 'reel', key: 'reel:' + r.id, text: r.caption, seen: true });
      for (const [who, text] of chatFor('phase:' + ph)) put({ kind: 'phone', channel: 'chat', who, key: 'chat:phase:' + ph, text, seen: true });
    }
    put({ kind: 'cue', channel: 'cue', who: null, key: c.cue, text: null, seen: true });
  }
  for (const f of Object.keys(s.flags)) {
    if (!s.flags[f] || ('flag:' + f) in s.history) continue;
    mark(s, 'flag:' + f);
    for (const [who, text] of chatFor('flag:' + f)) put({ kind: 'phone', channel: 'chat', who, key: 'chat:flag:' + f, text, seen: true });
  }
  for (const c of s.callbacks) mark(s, 'callback:' + c.key);
  for (const k of Object.keys(s.memo)) mark(s, 'memo:' + k);
  const st = s.story;
  if (st.convo) mark(s, `node:${st.convo.kind}:${st.convo.id}:${st.convo.node}`);
  for (const [id, x] of Object.entries(st.sits)) {
    if (x.state !== 'waiting') mark(s, `situation:${id}:${x.state}`);
    if (x.node) mark(s, `node:situation:${id}:${x.node}`);
    if (x.last) mark(s, `situation:${id}:${x.last}`);
  }
}

/** Let the world run for some real seconds, watching (outside any trace: for probes and finishing a day). */
export function wait(run, seconds) {
  const s = run.s;
  for (let t = 0; t < seconds - 1e-9 && !s.over; t += STEP) { R.tick(s, STEP); observe(run); }
}

// --- moving and acting: dist/loop/drive.js does it, exactly as the browser replay does ------------

export { targetOf };

/**
 * What the client itself shows after a command, before any engine line (main.js: talk bubble, toasts,
 * the record flash, the carrying HUD, a scene's cinematic). raw: the client would toast a machine code.
 */
export function clientFeedback(cmd, r, before, s) {
  const code = r && !r.ok && r.say ? r.say : null;
  const raw = code && /^[a-z]+(-[a-z]+)*$/.test(code) ? code : null;
  switch (cmd.type) {
    case 'take': case 'drop': case 'give': return { shown: before.carrying !== s.player.carrying, raw: null };
    case 'talk': return { shown: !!r?.line, raw: null };
    case 'film': case 'rally': case 'stance': return { shown: true, raw };
    case 'pester': case 'provocateur': case 'whisper': return { shown: !r?.ok, raw };
    case 'say': case 'leave': case 'situation': case 'plead': return { shown: !!s.story.convo || (!r?.ok && !!r?.say), raw }; // the options card or the next node

    default: return { shown: false, raw };
  }
}
// Answers to a command show up where the player is looking: a bubble, a toast, the wireless. A chat line on a
// closed phone is not an answer to "talk your way off the bus".
const ON_SCREEN = new Set(['bubble', 'officer', 'player', 'toast', 'radio', 'bark', 'convo']);
const seenTexts = (log, from, to = log.length) => new Set(log.slice(from, to).filter((i) => i.seen && ON_SCREEN.has(i.channel)).map((i) => `${i.channel}|${i.who}|${i.text}`));

/**
 * One macro step, run to its end by the shared driver. For a command it also answers: did the command
 * show the player anything? "Anything" is measured against the same seconds without the command (a ghost
 * copy that just stands there), so the phone buzzing anyway doesn't count as an answer.
 * An exception inside the engine is caught and returned as { crash }; the run is then over.
 */
export function perform(run, step) {
  if (run.crashed) return { entry: step, crash: run.crashed };
  const s = run.s, entry = { clock: clock(s), ...step };
  run.trace.push(entry);
  const out = { entry };
  let fb = null, from = 0, without = null, before = null;
  const drv = createDriver(R, [step], {
    onEnd: (st, i, info) => { if (info.mode === 'never-reached') out.r = { ok: false, say: 'never-reached' }; },
  });
  try {
    while (true) {
      const cmd = drv.before(s);
      if (cmd) {
        const ghost = cloneRun(run);
        for (let k = ticksFor(FEEDBACK_SECONDS); k > 0 && !ghost.s.over; k--) { R.tick(ghost.s, STEP); observe(ghost); }
        without = seenTexts(ghost.log, 0);
        before = { carrying: s.player.carrying };
        run._convo = s.story.convo ? `${s.story.convo.id}:${s.story.convo.node}` : null;
        const r = (run.act || R.act)(s, cmd) || { ok: false }; // run.act: the map's recording proxy
        out.r = r;
        out.verb = cmd.type + (cmd.how ? ':' + cmd.how : '');
        mark(s, `verb:${out.verb}:${r.ok ? 'ok' : 'no'}`);
        if (cmd.type === 'say' && r.ok) mark(s, `choice:${run._convo}:${cmd.option}`);
        fb = clientFeedback(cmd, r, before, s);
        from = run.log.length;
        observe(run);
      }
      if (drv.done) break;
      R.tick(s, STEP); observe(run);
    }
  } catch (e) {
    const where = (e.stack || '').split('\n').find((l) => l.includes('rules.js')) || '';
    run.crashed = `${e.message} ${where.trim().replace(/^at /, '').replace(/\(?file:.*\/dist\/loop\//, '(')}`;
    s.over = true;
    return { entry, crash: run.crashed };
  }
  out.reached = step.reached;
  if (fb) {
    out.caused = [...seenTexts(run.log, from)].filter((x) => !without.has(x));
    out.visible = fb.shown || out.caused.length > 0;
    out.silent = !!out.r.ok && !out.visible;
    out.raw = fb.raw;
  }
  return out;
}
export const waitMinutes = (run, m) => perform(run, { wait: m });

/** Replay a trace from 10:00. Deterministic: the same trace always gives the same day. */
export function replay(trace, tempo = 'long') {
  const run = newRun(tempo);
  for (const step of trace) { if (run.s.over) break; const { clock: _c, reached: _r, ...rest } = step; perform(run, rest); }
  return run;
}
/** Let the rest of the day play out with the player standing still (a { finish: true } step). */
export function finishDay(run) {
  if (!run.s.over) perform(run, { finish: true });
  return run;
}
