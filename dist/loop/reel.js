// The reel: followers as the score, the moments that earned them, the cutaway, the dare stamp, and the end reel's
// pick of moments and comments. Shared by the three-minute slice (slice.js, state in s.slice) and the 10-minute day
// (dares.js, state in s.mischief): each hands in its own score state `sc` = { followers, multiplier, moments }.
// Pure engine code (no DOM). The cues keep the slice's names, so one HUD (slice-ui.js) draws both:
//   slice:followers { n, total, why, x2 }   a pop by the follower count
//   slice:dare      { id, followers }        the stamp on the mischief list
//   slice:cutaway   { who|pos, title, sub, followers }   the picture-in-picture reel
//   slice:end       { followers }            the end reel

export const PER_AURA = 120; // followers per point of aura

/** Views a moment's reel gets, from what it earned. */
export const views = (followers) => Math.max(300, Math.round(followers * 11 / 100) * 100);

export function createReel({ cue }) {
  /** Pay followers (times the Meera multiplier). Returns what was paid. */
  function pay(s, sc, n, why, pos = s.player) {
    const x2 = sc.multiplier > 1;
    const got = Math.round(n * sc.multiplier);
    if (got <= 0) return 0;
    sc.followers += got;
    cue(s, 'slice:followers', { pos, data: { n: got, total: sc.followers, why, x2 } });
    return got;
  }
  function moment(s, sc, kind, did, caused, followers) {
    sc.moments.push({ t: Math.round(s.t * 10) / 10, kind, did, caused, followers, views: views(followers) });
  }
  function cutaway(s, data) { cue(s, 'slice:cutaway', { pos: data.pos ?? null, data }); }
  function stamp(s, id, followers, pos = s.player) { cue(s, 'slice:dare', { pos, data: { id, followers } }); }
  /** The reel: the biggest moments by weight × views, at most `cap[kind]` of a kind, `n` in all, in the order they happened. */
  function pick(moments, weight, cap = {}, n = 5) {
    const count = {}, out = [];
    for (const m of moments.slice().sort((a, b) => (weight[b.kind] ?? 1) * b.views - (weight[a.kind] ?? 1) * a.views || a.t - b.t)) {
      if ((count[m.kind] = (count[m.kind] ?? 0) + 1) > (cap[m.kind] ?? 9)) continue;
      out.push(m);
      if (out.length === n) break;
    }
    return out.sort((a, b) => a.t - b.t);
  }
  /** The first `n` comments whose rule holds for the outcome o: rules are [[(o) => bool, text], ...]. */
  function comments(rules, o, n = 3) {
    return rules.filter(([when]) => when(o)).map(([, text]) => text).slice(0, n);
  }
  return { pay, moment, cutaway, stamp, pick, comments, views };
}
