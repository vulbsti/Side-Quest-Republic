// The trouble director (the Left 4 Dead idea): it tracks how intense the last stretch was for the player, and when
// nothing physical has been within ten metres and no skill moment has happened for half a minute, it brings trouble
// to them. It also comes when things to do were near but the player has stayed calm (no skill moment, intensity low)
// for 45 seconds: something on offer that you walk past is not the same as something happening. After a peak it
// backs off for a while. It never fires in a conversation, in detention, in a chase, a raid
// or another game. (rules.js directorNow() is a different director: it steers the showdown.)
//
// Incidents are things the player does with the body, each paying followers (dares.js score):
//   topi    a constable on patrol strolls up with his topi loose: snatch it (the topi chase)
//   cart    a vendor's thela rolls away down the street at you: stop it (E), then ride it (E)
//   nikhil  Nikhil runs past with Dev's megaphone, a constable behind him: grab it, then lose the constable
//   shak    a constable decides you look suspicious: duck into a crowd or out of sight, or it's a chase
//   reel    Meera wants a slow-mo: sprint to her mark before the timer runs out
// Pure engine code: state in the day (s.trouble), variety from its counter, no randomness.

export const DIRECTOR = {
  quiet: 30, // real seconds with nothing physical within 10 m and no skill moment, before trouble comes
  calm: 45, // real seconds with no skill moment and intensity under `low`, before trouble comes anyway
  low: 5,
  near: 10, // metres
  relax: 25, // real seconds it backs off after a peak
  peak: 60, // intensity that counts as a peak
  decay: 15, // seconds for intensity to fall by e
  cool: 12, // real seconds after an incident before the next can start
  first: 8, // nothing in the first seconds of the day
  sample: 1, // how often it looks around (real seconds)
  reach: 1.8, // metres: close enough to grab Nikhil or the cart
};
export const KINDS = ['topi', 'cart', 'nikhil', 'shak', 'reel'];
// How much each cue says the player's last stretch was intense.
const BUMP = { 'chase-start': 25, 'lunge-miss': 8, caught: 30, 'raid-dodge': 8, 'action:kabaddi:start': 20, 'action:window:start': 15, 'slice:dare': 20, 'crowd-chant': 5, 'cannon-dance': 15, 'charge-start': 30, 'gas-fired': 20 };
// Things on offer that don't use the body (the eval's list): a hop, a talk, a card.
const TALKY = new Set(['talk', 'whisper', 'pester', 'say', 'leave', 'situation', 'plead', 'stance', 'provocateur', 'travel', 'go', 'convo']);
const CART = { start: 1.5, top: 5.2, accel: 1.6, friction: 1.4, ride: 5, rideFor: 5, life: 16 };
const NIKHIL = { speed: 4.2, cop: 4.1, copDelay: 1.6 };
const SHAK = { stare: 4, walk: 3.4, close: 2.4 };
const REEL = { metres: 20, seconds: 7.5, reach: 1.6 };
const PATROL = { walk: 3.0, stop: 2.8, loose: 15 };
// Lines: barks of six words or fewer.
const SAY = {
  topi: ['Uff garmi. Topi dheeli hai.', 'Topi thodi tedhi hai aaj.', 'Kya dekh raha hai, hero?'],
  cartVendor: ['Arre mera thela! Pakdo!', 'Thela bhaag gaya! Rokooo!', 'Brake fail! Samose bachao!'],
  cartStop: 'Shukriya beta! Samosa free.',
  cartRide: 'Thela express! Side do!',
  cartCrash: 'Dhadaam. Samose sadak pe.',
  nikhil: ['Bhai pakad! Mera nahi hai!', 'Megaphone mila, police bhi mili!'],
  nikhilCop: 'Ruk! Megaphone wapas kar!',
  nikhilGrab: 'Thank you bhai! Ab tu bhaag!',
  nikhilMiss: 'Pakda gaya. Megaphone Dev ko.',
  shak: ['Oye! Tu! Idhar aa.', 'Ae hero, bag dikha!', 'Ruk zara. Shakal dekh.'],
  shakLost: 'Kahan gaya? Abhi toh tha.',
  shakCaught: 'Naam? Chal, nikal yahan se.',
  reel: ['Reel time! Wahan tak sprint!', 'Slow-mo chahiye. Bhaag wahan tak!'],
  reelWin: 'Perfect! Ye viral jayega.',
  reelFail: 'Slow-mo mein bhi slow. Cut.',
};
const COACH = {
  topi: 'Patrol aa rahi. Topi dheeli!', cart: 'Thela aa raha! Roko: E', cartRide: 'Ab chadh ja: E', nikhil: 'Nikhil! Megaphone chheen: E',
  shak: 'Shak! Bheed mein ghus ja!', reel: 'Meera ka shot! Nishaan tak bhaag!',
};

export function createDirector(api) {
  const { dist, mins, at, cue, say, score, startChase, sendHome, officerById, allOfficers, inCrowd, nearby, giveObject, walkTo, streetPath, DESTINATIONS } = api;

  function setup(s) {
    s.trouble = { intensity: 0, quiet: 0, calm: 0, relaxUntil: 0, coolUntil: DIRECTOR.first, sampleT: 0, near: false, live: null, n: 0, fired: [], peaks: 0 };
  }
  const T = (s) => s.trouble;
  const pick = (list, n) => list[n % list.length];
  const step = (p, to, speed, dt) => { const d = dist(p, to); if (d < 1e-6) return 0; const k = Math.min(1, (speed * dt) / d); p.x += (to.x - p.x) * k; p.z += (to.z - p.z) * k; return d - speed * dt; };
  /** Walk a polyline: move p along pts (consumed as reached) by speed*dt. Returns metres left on the path. */
  function follow(p, pts, speed, dt) {
    let left = speed * dt;
    while (left > 0 && pts.length) {
      const q = pts[0], d = dist(p, q);
      if (d <= left) { p.x = q.x; p.z = q.z; pts.shift(); left -= d; } else { p.x += ((q.x - p.x) / d) * left; p.z += ((q.z - p.z) / d) * left; left = 0; }
    }
    return pts.reduce((n, q, i) => n + dist(i ? pts[i - 1] : p, q), 0);
  }
  /** The point `d` metres along pts, starting from `from`. */
  function along(from, pts, d) {
    let p = { x: from.x, z: from.z };
    for (const q of pts) {
      const seg = dist(p, q);
      if (seg >= d) return { x: p.x + ((q.x - p.x) / (seg || 1)) * d, z: p.z + ((q.z - p.z) / (seg || 1)) * d };
      d -= seg; p = { x: q.x, z: q.z };
    }
    return p;
  }
  /** The street points from `from` up to `d` metres toward `to` (the end point included). */
  function streetTo(from, to, d) {
    const pts = streetPath(from, to, { direct: 0 }), out = [];
    let p = from, left = d;
    for (const q of pts) {
      const seg = dist(p, q);
      if (seg >= left) { out.push({ x: p.x + ((q.x - p.x) / (seg || 1)) * left, z: p.z + ((q.z - p.z) / (seg || 1)) * left }); return out; }
      out.push({ x: q.x, z: q.z }); left -= seg; p = q;
    }
    return out;
  }
  /** Some place in a direction away from here (varied by the counter): a destination 60 m or more off. */
  function toward(s, k = 0) {
    const pl = s.player;
    const far = Object.values(DESTINATIONS).filter((d) => dist(d, pl) > 60).sort((a, b) => dist(a, pl) - dist(b, pl)).slice(0, 4);
    return far.length ? pick(far, T(s).n + k) : { x: pl.x + 80, z: pl.z };
  }
  const constables = (s) => allOfficers(s).filter((o) => /^c\d$/.test(o.id) && !o.hidden && (o.mode === 'post' || o.mode === 'toPost'));
  /** The nearest free constable, brought within `d` metres along the street if he is far (he was on his rounds). */
  function bring(s, d) {
    const pl = s.player, o = constables(s).sort((a, b) => dist(a, pl) - dist(b, pl))[0];
    if (!o) return null;
    if (dist(o, pl) > 40) { const p = along(pl, streetPath(pl, o.post, { direct: 0 }), d); Object.assign(o, { x: p.x, z: p.z }); }
    o.path = [];
    return o;
  }
  const busy = (s) => { const pl = s.player; return !!(pl.chasedBy || s.raid || s.action || pl.detained || pl.pinned || pl.riding || s.story?.convo || s.over); };
  const skill = (s) => !!(s.player.chasedBy || s.raid || s.action);

  // --- the director -----------------------------------------------------------------------------
  function tick(s, dt) {
    const tr = T(s);
    if (!tr) return;
    for (const c of s.cues) { if (c.trouble) continue; c.trouble = true; tr.intensity = Math.min(100, tr.intensity + (BUMP[c.cue] ?? 0)); }
    tr.intensity *= Math.exp(-dt / DIRECTOR.decay);
    if (tr.intensity >= DIRECTOR.peak && s.t >= tr.relaxUntil) { tr.relaxUntil = s.t + DIRECTOR.relax; tr.peaks++; }
    if (tr.live) { update(s, dt); return; }
    if ((tr.sampleT -= dt) <= 0) {
      tr.sampleT = DIRECTOR.sample;
      tr.near = !busy(s) && nearby(s, s.player, DIRECTOR.near).some((o) => o.d <= DIRECTOR.near && !TALKY.has(o.kind) && o.kind !== 'drop');
    }
    if (skill(s) || tr.near) tr.quiet = 0; else tr.quiet += dt;
    if (skill(s) || tr.intensity >= DIRECTOR.low) tr.calm = 0; else tr.calm += dt;
    if (busy(s) || (tr.quiet < DIRECTOR.quiet && tr.calm < DIRECTOR.calm) || s.t < tr.relaxUntil || s.t < tr.coolUntil || s.t > at(18, 0) - 15) return;
    for (let k = 0; k < KINDS.length; k++) {
      const kind = KINDS[(tr.n + k) % KINDS.length];
      if (START[kind](s)) { tr.n++; tr.quiet = 0; tr.calm = 0; tr.fired.push({ kind, t: Math.round(s.t * 10) / 10 }); s.mischief && s.mischief.incidents++; cue(s, 'incident', { pos: tr.live.pos ?? s.player, data: { kind, phase: 'start' } }); return; }
    }
  }

  function begin(s, kind, live, game = true) {
    T(s).live = { kind, since: s.t, phase: 'start', ...live };
    if (game) { s.action = { game: kind, since: s.t, incident: true }; cue(s, `action:${kind}:start`, { pos: live.pos ?? s.player }); }
    score.coach(s, COACH[kind], kind);
    return true;
  }
  /** End the incident: result 'win' | 'fail' | 'miss'. */
  function done(s, result, data = {}) {
    const tr = T(s), L = tr.live;
    if (!L) return;
    if (s.action?.incident) s.action = null;
    if (L.game !== false && result !== 'abort') cue(s, `action:${L.kind}:${result === 'win' ? 'win' : 'fail'}`, { pos: s.player, data: { ...data, kind: L.kind } });
    CLEAN[L.kind]?.(s, L, result);
    tr.live = null;
    tr.coolUntil = s.t + DIRECTOR.cool;
    if (result === 'win') tr.intensity = Math.min(100, tr.intensity + 20);
  }
  function pay(s, n, why, did, caused) {
    const got = score.pay(s, n, why);
    score.moment(s, 'incident', did, caused, got);
    score.cutaway(s, { who: 'player', title: did, sub: caused, followers: got });
    return got;
  }

  // --- the incidents --------------------------------------------------------------------------
  const START = {
    topi(s) {
      const o = bring(s, 16);
      if (!o || (o.topiAt != null && s.t - o.topiAt < mins(10))) return false;
      o.mode = 'patrol';
      say(s, o.id, pick(SAY.topi, T(s).n), { key: 'trouble-topi' });
      return begin(s, 'topi', { id: o.id, pos: { x: o.x, z: o.z }, game: false }, false);
    },
    cart(s) {
      const pl = s.player, A = streetTo(pl, toward(s), 18);
      if (!A.length || dist(A[A.length - 1], pl) < 10) return false;
      const start = A[A.length - 1], back = A.slice(0, -1).reverse();
      const last = back.length ? back[back.length - 1] : start, end = { x: pl.x, z: pl.z };
      const dx = end.x - last.x, dz = end.z - last.z, d = Math.hypot(dx, dz) || 1;
      const path = [...back, end, { x: end.x + (dx / d) * 10, z: end.z + (dz / d) * 10 }];
      say(s, 'street', pick(SAY.cartVendor, T(s).n), { key: 'trouble-cart', pos: start, kind: 'bark' });
      return begin(s, 'cart', { cart: { x: start.x, z: start.z, v: CART.start, path, stopped: false, rider: false, yaw: Math.atan2(path[0].x - start.x, path[0].z - start.z) }, pos: start });
    },
    nikhil(s) {
      const n = s.people.nikhil, meg = s.objects.megaphone, pl = s.player;
      if (n.hidden || n.mode === 'detained' || n.carrying || s.t > at(15, 15)) return false;
      if (!(meg.holder === 'dev' || meg.holder === null)) return false;
      const o = bring(s, 30);
      if (!o) return false;
      const A = streetTo(pl, toward(s), 16), B = streetTo(pl, toward(s, 2), 18);
      if (!A.length || !B.length) return false;
      const start = A[A.length - 1], side = { x: pl.x + 1.4, z: pl.z + 1.4 };
      const path = [...A.slice(0, -1).reverse(), side, ...B];
      const saved = { mode: n.mode, path: n.path };
      giveObject(s, 'megaphone', 'nikhil');
      Object.assign(n, { x: start.x, z: start.z, path: [], mode: 'incident' });
      Object.assign(o, { x: start.x, z: start.z, mode: 'patrolChase', path: [] });
      say(s, 'nikhil', pick(SAY.nikhil, T(s).n), { key: 'trouble-nikhil' });
      return begin(s, 'nikhil', { id: o.id, home: o.post, saved, run: path, cop: path.map((q) => ({ ...q })), pos: start });
    },
    shak(s) {
      const o = bring(s, 16);
      if (!o) return false;
      o.mode = 'patrol';
      say(s, o.id, pick(SAY.shak, T(s).n), { key: 'trouble-shak' });
      return begin(s, 'shak', { id: o.id, pos: { x: o.x, z: o.z } });
    },
    reel(s) {
      const m = s.people.meera, pl = s.player;
      if (m.hidden || m.mode === 'detained' || s.story?.convo) return false;
      const mark = streetTo(pl, toward(s, 1), REEL.metres);
      if (!mark.length) return false;
      const to = mark[mark.length - 1];
      if (dist(to, pl) < 12) return false;
      if (dist(m, pl) > 30) Object.assign(m, { x: pl.x - 4, z: pl.z + 3, path: [] });
      say(s, 'meera', pick(SAY.reel, T(s).n), { key: 'trouble-reel' });
      return begin(s, 'reel', { mark: to, until: s.t + REEL.seconds, pos: to, meera: m.mode });
    },
  };

  const UPDATE = {
    topi(s, L, dt) {
      const o = officerById(s, L.id), pl = s.player;
      if (!o || o.hidden) return done(s, 'abort');
      if (L.phase === 'start') {
        if (o.mode === 'chase') { L.phase = 'chase'; return; }
        const d = dist(o, pl);
        if (d > PATROL.stop) { step(o, pl, PATROL.walk, dt); o.path = []; }
        else { o.mode = 'loose'; L.phase = 'loose'; L.at = s.t; }
        if (s.t - L.since > 25) return done(s, 'miss');
        return;
      }
      if (L.phase === 'loose') {
        if (o.mode === 'chase' && pl.chasedBy === o.id) { L.phase = 'chase'; return; }
        if (s.t - L.at > PATROL.loose || dist(o, pl) > 14) return done(s, 'miss');
        return;
      }
      if (L.phase === 'chase' && !pl.chasedBy) {
        if (pl.pinned) return done(s, 'fail');
        pay(s, 900, 'patrol', `${name(o.id)} ki topi udi`, 'Patrol pe nikle the, topi pe laut');
        return done(s, 'win');
      }
    },
    cart(s, L, dt) {
      const c = L.cart, pl = s.player;
      if (c.stopped && !c.rider) { if (s.t - c.stoppedAt > 4) return done(s, 'win', { ride: false }); return; }
      if (c.rider) {
        c.v = CART.ride;
        const left = follow(c, c.ridePath, c.v, dt);
        Object.assign(pl, { x: c.x, z: c.z });
        if (left <= 0.01 || s.t - c.rideAt >= CART.rideFor) {
          pay(s, 1500, 'thela', 'Bhagte thele pe sawari', 'Sabzi mandi tak drift');
          cue(s, 'crowd-laugh', { pos: pl, data: { who: 'player' } });
          return done(s, 'win', { ride: true });
        }
        return;
      }
      c.v = c.path.length > 1 ? Math.min(CART.top, c.v + CART.accel * dt) : Math.max(0, c.v - CART.friction * dt);
      const from = { x: c.x, z: c.z };
      const left = follow(c, c.path, c.v, dt);
      if (dist(from, c) > 1e-6) c.yaw = Math.atan2(c.x - from.x, c.z - from.z);
      if (left <= 0.01 || c.v <= 0.05 || s.t - L.since > CART.life) { say(s, 'street', SAY.cartCrash, { key: 'trouble-cart-crash', pos: c, kind: 'bark' }); return done(s, 'miss'); }
    },
    nikhil(s, L, dt) {
      const n = s.people.nikhil, o = officerById(s, L.id), pl = s.player;
      if (!o) return done(s, 'abort');
      if (L.phase === 'start') {
        n.path = [];
        const left = follow(n, L.run, NIKHIL.speed, dt);
        if (s.t - L.since >= NIKHIL.copDelay) { follow(o, L.cop, NIKHIL.cop, dt); o.path = []; }
        if (s.t - L.since >= NIKHIL.copDelay && Math.abs(s.t - L.since - NIKHIL.copDelay) < dt) say(s, o.id, SAY.nikhilCop, { key: 'trouble-nikhil-cop' });
        if (left <= 0.01 || (s.t - L.since > NIKHIL.copDelay + 0.5 && dist(o, n) < 1.2)) { say(s, o.id, SAY.nikhilMiss, { key: 'trouble-nikhil-miss' }); return done(s, 'fail'); }
        return;
      }
      if (L.phase === 'chase' && !pl.chasedBy) {
        if (pl.pinned) return done(s, 'fail', { caught: true });
        pay(s, 1600, 'megaphone', 'Nikhil ka megaphone bachaya', `${name(o.id)} ki saans phool gayi`);
        return done(s, 'win');
      }
    },
    shak(s, L, dt) {
      const o = officerById(s, L.id), pl = s.player;
      if (!o) return done(s, 'abort');
      if (L.phase === 'start') {
        const hidden = inCrowd(s, pl) || pl.unseen;
        if (hidden && s.t - L.since > 0.6) {
          say(s, o.id, SAY.shakLost, { key: 'trouble-shak-lost' });
          pay(s, 700, 'gayab', 'Shakki constable se gayab', 'Bheed mein ghul gaya');
          return done(s, 'win');
        }
        const d = dist(o, pl);
        if (d > SHAK.close) step(o, pl, SHAK.walk, dt);
        o.path = [];
        if (d <= SHAK.close || s.t - L.since >= SHAK.stare) {
          if (s.action?.incident) s.action = null;
          L.phase = 'chase';
          startChase(s, o.id, 'shak', { startle: 0.5 });
          if (!pl.chasedBy) return done(s, 'abort');
        }
        return;
      }
      if (L.phase === 'chase' && !pl.chasedBy) {
        if (pl.pinned) return done(s, 'fail', { caught: true });
        pay(s, 1000, 'escape', 'Shakki constable ko chakma', `${name(o.id)} ab bhi dhoondh rahe`);
        return done(s, 'win');
      }
    },
    reel(s, L) {
      const pl = s.player;
      if (dist(pl, L.mark) <= REEL.reach) {
        say(s, 'meera', SAY.reelWin, { key: 'trouble-reel-win' });
        pay(s, 1200, 'reel', 'Meera ka slow-mo sprint', 'Reel pe 2 lakh views');
        return done(s, 'win');
      }
      if (s.t >= L.until) { say(s, 'meera', SAY.reelFail, { key: 'trouble-reel-fail' }); return done(s, 'fail'); }
    },
  };
  // After an incident: people go back to what they were doing.
  const CLEAN = {
    topi(s, L) { const o = officerById(s, L.id); if (o && (o.mode === 'patrol' || o.mode === 'loose')) sendHome(s, o); },
    shak(s, L) { const o = officerById(s, L.id); if (o && o.mode === 'patrol') sendHome(s, o); },
    nikhil(s, L, result) {
      const n = s.people.nikhil, o = officerById(s, L.id), meg = s.objects.megaphone;
      if (meg.holder === 'nikhil') giveObject(s, 'megaphone', 'dev');
      if (n.mode === 'incident') { n.mode = L.saved.mode === 'follow' ? 'lost' : L.saved.mode; n.path = []; }
      if (o && o.mode !== 'chase' && o.mode !== 'post') { o.mode = 'toPost'; walkTo(o, o.post); }
    },
    reel(s, L) { const m = s.people.meera; if (m.mode !== L.meera) m.mode = L.meera; },
  };
  const NAME = { c1: 'Yadav ji', c2: 'Meena ji', c3: 'Tomar ji', c4: 'Rawat ji', c5: 'Gill ji', c6: 'Bisht ji', c7: 'Negi ji' };
  const name = (id) => NAME[id] ?? 'Constable';

  function update(s, dt) {
    const L = T(s).live, pl = s.player;
    // Detention or a conversation ends whatever was going on.
    if (pl.detained || s.story?.convo && L.kind !== 'topi') return done(s, 'abort');
    UPDATE[L.kind](s, L, dt);
  }

  // --- the player's hands -------------------------------------------------------------------------
  function act(s, cmd) {
    const L = T(s)?.live, pl = s.player;
    if (!L) return { ok: false };
    if (L.kind === 'cart' && (cmd.move === 'stop' || cmd.move === 'ride')) {
      const c = L.cart;
      if (dist(pl, c) > DIRECTOR.reach + 0.6 || pl.carrying || pl.chasedBy) return { ok: false };
      if (cmd.move === 'stop' && !c.stopped) {
        c.stopped = true; c.v = 0; c.stoppedAt = s.t;
        say(s, 'street', SAY.cartStop, { key: 'trouble-cart-stop', pos: c, kind: 'bark' });
        say(s, 'player', 'Pakad liya! Brake kahan hai?', { key: 'trouble-cart-player' });
        pay(s, 700, 'thela', 'Bhagta thela roka', 'Samose bach gaye');
        score.coach(s, COACH.cartRide, 'cartRide');
        return { ok: true };
      }
      if (cmd.move === 'ride' && !c.rider) {
        c.rider = true; c.rideAt = s.t; c.stopped = false;
        c.ridePath = streetTo(c, toward(s, 3), 26);
        say(s, 'player', SAY.cartRide, { key: 'trouble-cart-ride' });
        return { ok: true };
      }
      return { ok: false };
    }
    if (L.kind === 'nikhil' && cmd.move === 'grab' && L.phase === 'start') {
      const n = s.people.nikhil, o = officerById(s, L.id);
      if (dist(pl, n) > DIRECTOR.reach + 0.6 || pl.carrying || pl.chasedBy) return { ok: false };
      giveObject(s, 'megaphone', 'player');
      say(s, 'nikhil', SAY.nikhilGrab, { key: 'trouble-nikhil-grab' });
      n.mode = L.saved.mode === 'follow' ? 'lost' : L.saved.mode; n.path = [];
      if (s.action?.incident) s.action = null;
      cue(s, `action:nikhil:win`, { pos: pl, data: { kind: 'nikhil', grab: true } });
      L.game = false; // the grab was the game; what's left is the chase
      L.phase = 'chase';
      if (o) { o.mode = 'post'; startChase(s, o.id, 'megaphone', { startle: 0.6 }); }
      return { ok: true };
    }
    return { ok: false };
  }

  /** A catch in an incident's chase is the light one: uthak-baithak, then go. True if it handled it. */
  function caught(s, c) {
    const w = s.memo.chase?.data?.why;
    if (w !== 'shak' && w !== 'megaphone') return false;
    const pl = s.player;
    s.chase = null; pl.chasedBy = null;
    pl.pinned = { until: s.t + 4, x: pl.x, z: pl.z };
    c.mode = 'post'; Object.assign(c, { x: pl.x + 1.2, z: pl.z }); c.path = [];
    if (w === 'megaphone' && s.objects.megaphone.holder === 'player') giveObject(s, 'megaphone', 'dev');
    cue(s, 'caught', { pos: pl, data: { by: c.id, light: true, seconds: 4 } });
    cue(s, 'crowd-laugh', { pos: pl, data: { who: 'player' } });
    say(s, c.id, SAY.shakCaught, { key: 'trouble-caught' });
    const got = score.pay(s, 240, 'caught');
    score.moment(s, 'caught', `${name(c.id)} ne pakda`, 'Uthak-baithak, live', got);
    return true;
  }

  // --- what the player can do, and where ---------------------------------------------------------
  /** Where an incident command's target is now (drive.js walks the bots there). */
  function target(s) {
    const L = T(s)?.live;
    if (!L) return null;
    if (L.kind === 'cart') return L.cart;
    if (L.kind === 'nikhil') return s.people.nikhil;
    if (L.kind === 'reel') return L.mark;
    return null;
  }
  function affordances(s) {
    const L = T(s)?.live, out = [];
    if (!L || s.player.detained) return out;
    const c = L.cart;
    if (L.kind === 'cart' && !c.rider) out.push({ id: c.stopped ? 'incident:ride' : 'incident:stop', kind: 'incident', cmd: { type: 'incident', move: c.stopped ? 'ride' : 'stop' }, at: { x: c.x, z: c.z } });
    if (L.kind === 'nikhil' && L.phase === 'start') { const n = s.people.nikhil; out.push({ id: 'incident:grab', kind: 'incident', cmd: { type: 'incident', move: 'grab' }, at: { x: n.x, z: n.z } }); }
    if (L.kind === 'reel') out.push({ id: 'incident:mark', kind: 'go', cmd: null, at: { x: L.mark.x, z: L.mark.z } });
    return out;
  }
  const TEXT = { stop: 'Thela roko', ride: 'Thele pe chadh ja', grab: 'Megaphone chheen lo' };
  /** The HUD's E prompt and card (rules.js opportunities adds these). */
  function opportunities(s) {
    return affordances(s).map((a) => ({ id: a.id, kind: a.cmd ? 'incident' : 'go', text: a.cmd ? TEXT[a.cmd.move] : 'Meera ke nishaan tak bhaag', at: a.at, cmd: a.cmd }));
  }
  /** What the HUD shows about the incident in progress. */
  function view(s) {
    const L = T(s)?.live;
    if (!L) return null;
    return {
      kind: L.kind, phase: L.phase, cart: L.cart ? { x: L.cart.x, z: L.cart.z, yaw: L.cart.yaw, rider: L.cart.rider, stopped: L.cart.stopped, v: L.cart.v } : null,
      mark: L.mark ?? null, left: L.until ? Math.max(0, L.until - s.t) : null, who: L.id ?? (L.kind === 'nikhil' ? 'nikhil' : L.kind === 'reel' ? 'meera' : null),
    };
  }
  function end(s) { if (T(s)?.live) done(s, 'abort'); }

  return { setup, tick, act, caught, affordances, opportunities, target, view, end };
}
