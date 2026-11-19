// Which day the client starts, from the page's query string. Pure module, so the default is tested in Node.
//   (nothing)  the day: 10 real minutes (the 'slice' tempo, 1.25 s a game minute), with the mischief list, the
//              trouble director and the end reel (dares.js, director.js). This is what "The day (10 min)" starts.
//   ?long      the owner's old full day: 32 real minutes, no mischief list (the 'long' tempo, 4 s a game minute).
//   ?short     kept for old links: the same as the default.
//   ?slice     the three-minute run (slice.js), also the title screen's first button.
//   ?replay=   a witness or route replays the day it was found in (its own tempo and options).

/** The tempo the client runs at: 'slice' (10 minutes) unless ?long. */
export const tempoFor = (query) => (query.has('long') ? 'long' : 'slice');

/** createDay() options for a new loop. loop: the loop count the client keeps (a new dare set on later loops). */
export function dayOptions(query, { loop = 1, slice = false, replay = null } = {}) {
  if (replay) return { ...(replay.opts || {}), tempo: replay.tempo || 'long' };
  if (slice) return { slice: true };
  if (tempoFor(query) === 'long') return { tempo: 'long' };
  return { tempo: 'slice', mischief: { loop } };
}

/** The title screen's buttons. */
export const TITLE = { slice: '3-minute run', day: 'The day (10 min)', long: 'The long day (32 min)' };
