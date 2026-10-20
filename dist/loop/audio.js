// Audio for the protest day: a cue manager that plays music like a musician watching the player.
//
//   const audio = createAudio();
//   addEventListener('pointerdown', () => audio.unlock(), { once: true });
//   audio.setPhase('morning');               // crossfades to the phase's tune and ambience
//   audio.cue('gas-fired', { pos: { x, z } }); // every spec cue name maps to something (see CUES)
//   audio.setIntensity(director.intensity);  // 0..100: hotter tune, chants swell
//   audio.chase(true);                       // chase music; chase(false) to come back
//   audio.silence(3);                        // awkward beat: music cuts, crickets; returns, or on a laugh
//   audio.duckFor(6);                        // dip music and street under a scene
//   audio.setCrowd(n);                       // people nearby: sparse -> medium -> dense crowd beds
//   audio.update(dt, { x, z, yaw });         // every frame, with the listener (camera or player)
//
// Files are lazy-loaded from ../assets/audio/manifest.json after unlock(); nothing plays before a
// user gesture. Voices come from a fixed pool (no allocation storms); positional sounds are panned
// and attenuated by hand against the listener so the result is the same in every browser.
// No clip has been listened to; levels are from ffmpeg analysis (see the manifest).

const BASE = new URL('../assets/audio/', import.meta.url);
const XF = 2.5;            // loop crossfade (s)
const VOICES = 28;         // pooled positional/one-shot voices
const SAME_CLIP_MAX = 3;   // concurrent voices of one clip
const LATE_SFX = 0.6;      // a one-shot that takes longer than this to load is dropped, not played late

export const PHASES = ['morning', 'midday', 'tense', 'showdown', 'aftermath'];

// Per phase: the base tune, the hotter tune intensity pushes into, and where it switches.
export const PHASE_MUSIC = {
  morning:   { base: 'music-morning',   hot: 'music-midday', up: 50, chase: 'music-chase-comic' },
  midday:    { base: 'music-midday',    hot: 'music-tense',  up: 55, chase: 'music-chase-comic' },
  tense:     { base: 'music-tense',     hot: 'music-hot',    up: 65, chase: 'music-chase' },
  showdown:  { base: 'music-showdown',  hot: 'music-hot',    up: 78, chase: 'music-chase' },
  aftermath: { base: 'music-aftermath', hot: null,           up: 101, chase: 'music-chase' },
};

// Ambience weights per phase (crowd beds come from setCrowd, chants from intensity).
const PHASE_AMB = {
  morning:   { 'amb-traffic': 0.6, 'amb-night': 0, 'amb-siren': 0 },
  midday:    { 'amb-traffic': 0.5, 'amb-night': 0, 'amb-siren': 0 },
  tense:     { 'amb-traffic': 0.35, 'amb-night': 0, 'amb-siren': 0.1 },
  showdown:  { 'amb-traffic': 0.25, 'amb-night': 0, 'amb-siren': 0.16 },
  aftermath: { 'amb-traffic': 0.3, 'amb-night': 0.55, 'amb-siren': 0.05 },
};

// Cue name -> steps. A step plays a clip (or a random one of a list) after `at` seconds, at the cue's
// position when there is one (`ui: true` keeps it non-positional), with gain and a random rate.
// `loop` holds a looping clip at the position for `loop` seconds. `fx` runs a music/system action.
// `synth` runs a procedural placeholder (marked in the manifest's synth list).
export const CUES = {
  'arrival-wave': [
    { clip: 'traffic-horns', gain: 0.7 }, { clip: 'cheer-big', at: 0.4, gain: 0.8 },
    { fx: 'chant', seconds: 10 }, { synth: 'megaphone', at: 1.2 }, { clip: 'megaphone-chant', at: 1.5, gain: 0.8 },
  ],
  'party-suv': [
    { clip: 'car-horn', gain: 0.8 }, { clip: 'siren-whelen', at: 0.3, gain: 0.35 }, { clip: 'car-door', at: 1.8 },
    { clip: 'boo', at: 2.4, gain: 0.45 },
  ],
  'sena-bikes': [
    { synth: 'bikes' }, { synth: 'megaphone', at: 0.8 }, { clip: 'megaphone-chant', at: 1.1, gain: 0.9 },
    { fx: 'chant', seconds: 6 },
  ],
  'barricades-up': [
    { clip: 'barricade-drop' }, { clip: 'barricade-clang', at: 0.5, rate: [0.9, 1.1] }, { clip: 'barricade-clang', at: 1.1, rate: [0.85, 1.05], gain: 0.8 },
    { clip: 'barricade-drop', at: 1.6, gain: 0.7, rate: [0.9, 1] }, { clip: 'whistle-police', at: 0.2 },
  ],
  'raf-arrive': [
    { clip: 'bus-drive', gain: 0.8 }, { clip: 'siren-wail', gain: 0.35 }, { clip: 'walk-pavement', at: 1.5 },
    { clip: 'shield-thud', at: 3.0 }, { clip: 'shield-thud', at: 3.45, rate: [0.9, 1] }, { clip: 'whistle-sharp', at: 3.8 },
  ],
  'provocateur-drop': [{ clip: 'car-door' }, { clip: 'sting-dramatic', at: 0.6, ui: true, gain: 0.4 }],
  'stone-thrown': [
    { clip: ['whoosh', 'swing'] }, { clip: ['stone-hit', 'bottle-smash'], at: 0.35 }, { clip: 'gasp-a', at: 0.6, gain: 0.9 },
    { fx: 'duck', seconds: 1.4 },
  ],
  'cannon-roll': [{ clip: 'bus-drive' }, { clip: 'siren-whelen', gain: 0.6 }, { loop: 10, clip: 'amb-bus-idle', at: 4, gain: 0.8 }],
  'cannon-spray': [{ loop: 'seconds', clip: 'amb-spray', gain: 1 }, { clip: 'splash', at: 0.3 }, { clip: 'splash', at: 1.4, rate: [0.8, 1.1] }, { clip: 'gasp-b', at: 0.8, gain: 0.7 }],
  'cannon-dance': [{ loop: 'seconds', clip: 'amb-spray', gain: 0.8 }, { clip: 'cheer-a', at: 0.5 }, { fx: 'override', music: 'music-chase-comic', seconds: 14 }],
  'gas-fired': [
    { clip: ['gas-pop-a', 'gas-pop-b'] }, { clip: 'boom-low', ui: true, gain: 0.6 }, { loop: 12, clip: 'amb-hiss', at: 0.4 },
    { clip: 'gasp-b', at: 0.7 }, { clip: 'scream-m', at: 1.2, gain: 0.6 }, { clip: 'cough-a', at: 2.6 }, { clip: 'cough-b', at: 4.0 },
    { clip: 'cough-a', at: 6.5, rate: [0.9, 1.1], gain: 0.7 },
  ],
  'charge-start': [
    { clip: 'whistle-police' }, { clip: 'whistle-sharp', at: 0.2 }, { clip: 'boom-low', ui: true, gain: 0.7 },
    { clip: ['scream-f', 'scream-m'], at: 0.6 }, { fx: 'hits', count: 7, from: 0.8, to: 4.0 }, { fx: 'chant', seconds: 0, crowdSwell: 8 },
  ],
  'charge-end': [{ clip: 'whistle-sharp' }, { clip: 'ooh', at: 0.8, gain: 0.5 }, { clip: 'cough-b', at: 2, gain: 0.5 }],
  'chase-start': [{ clip: 'whistle-police' }, { clip: 'jingle-hit', ui: true, gain: 0.8 }, { fx: 'chase', on: true }, { synth: 'run', at: 0.1 }],
  'chase-lost': [{ fx: 'chase', on: false }, { clip: 'jingle-pass', ui: true }, { clip: 'sting-slide', ui: true, at: 0.4, gain: 0.6, chance: 0.4 }],
  'caught': [{ fx: 'chase', on: false, quick: true }, { clip: 'whistle-police' }, { clip: 'body-thud', at: 0.15 }, { clip: 'jingle-fail', ui: true, at: 0.3 }, { clip: 'ooh', at: 0.5, gain: 0.7 }],
  'bus-stalled': [{ clip: 'bus-stall' }, { clip: 'bus-horn', at: 3.2, gain: 0.8 }, { clip: 'bus-horn', at: 4.0, gain: 0.8, rate: [0.97, 1] }],
  'detainees-escape': [{ clip: 'cheer-a' }, { clip: 'cheer-big', at: 0.6, gain: 0.6 }, { clip: 'sting-win', ui: true, at: 0.3, gain: 0.7 }],
  'crowd-laugh': [{ clip: ['laugh-group-a', 'laugh-group-b', 'laugh-audience'] }, { clip: ['laugh-man', 'chuckle'], at: 0.25, gain: 0.6, chance: 0.6 }, { fx: 'laugh' }],
  'crowd-gasp': [{ clip: ['gasp-a', 'gasp-b', 'ooh'] }],
  'awkward-silence': [{ fx: 'silence', seconds: 3.5 }],
  'crew-join': [{ clip: ['cheer-a', 'applause'], gain: 0.6 }, { clip: 'jingle-pass', ui: true, at: 0.2, gain: 0.8 }],
  'crew-block': [{ fx: 'chant', seconds: 12 }, { clip: 'clap-cheer', gain: 0.8 }, { clip: 'shield-thud', at: 1.5, gain: 0.5 }],
  'clip-posted': [{ clip: 'whoosh', ui: true, gain: 0.7 }, { clip: 'phone-ding', ui: true, at: 0.25 }],
  'scene-start': [{ fx: 'scene', on: true }, { clip: 'whoosh', ui: true, gain: 0.5 }],
  'scene-end': [{ fx: 'scene', on: false }, { clip: 'jingle-pass', ui: true, gain: 0.7 }],
  'phase': [{ fx: 'phase' }],
  'faint': [{ clip: 'body-thud' }, { clip: 'gasp-a', at: 0.2 }, { clip: 'scream-f', at: 0.5, gain: 0.4, chance: 0.5 }],
  'ambulance': [{ loop: 9, clip: 'siren-twotone', gain: 1 }],
  // extras the client may use (not spec cues)
  'footstep': [{ clip: ['step-a', 'step-b', 'step-c'], rate: [0.92, 1.08], gain: 0.55 }],
  'phone-ring': [{ clip: 'ringtone', ui: true }],
  'phone-chat': [{ clip: 'phone-blip', ui: true, gain: 0.7 }],
  'bus-horn': [{ clip: 'bus-horn' }],
  'sting': [{ clip: ['sting-rimshot', 'sting-boing', 'sting-sad-trombone', 'sting-airhorn', 'sting-scratch'], ui: true }],
};

// Clip ids a cue can play (for tests and for the integration note).
export function cueClips(name) {
  const out = new Set();
  for (const s of CUES[name] || []) {
    for (const c of [].concat(s.clip || [])) out.add(c);
    if (s.music) out.add(s.music);
    if (s.fx === 'hits') ['lathi-a', 'lathi-b', 'shield-thud', 'swing'].forEach((c) => out.add(c));
    if (s.fx === 'chant') out.add('amb-chant');
    if (s.fx === 'silence') ['amb-crickets', 'cricket-chirp'].forEach((c) => out.add(c));
    if (s.fx === 'chase') Object.values(PHASE_MUSIC).forEach((m) => out.add(m.chase));
    if (s.fx === 'phase') Object.values(PHASE_MUSIC).forEach((m) => { out.add(m.base); if (m.hot) out.add(m.hot); });
    if (s.synth === 'bikes') ['bike-rev', 'amb-bike-idle'].forEach((c) => out.add(c));
    if (s.synth === 'run') ['step-a', 'step-b', 'step-c'].forEach((c) => out.add(c));
  }
  return [...out];
}

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const pick = (v) => (Array.isArray(v) ? v[(Math.random() * v.length) | 0] : v);
const rnd = (r) => (Array.isArray(r) ? r[0] + Math.random() * (r[1] - r[0]) : r || 1);

export function createAudio(options = {}) {
  const base = options.base ? new URL(options.base, location.href) : BASE;
  const state = {
    phase: 'morning', intensity: 0, smoothInt: 0, crowd: 0, chaseOn: false, chaseQuick: false,
    hot: false, hotSince: -1e9, cutUntil: 0, cutReturn: 1.5, duckUntil: 0, sceneDuck: false,
    chantUntil: 0, chantSwell: 0, crowdSwellUntil: 0, override: null, overrideUntil: 0,
    listener: { x: 0, z: 0, yaw: null }, volume: { master: 0.9, music: 0.55, amb: 0.5, sfx: 0.9, ui: 0.7 },
  };
  let ctx = null, manifest = null, manifestP = null, buses = null;
  const clips = new Map();     // id -> manifest entry
  const buffers = new Map();   // id -> AudioBuffer
  const loading = new Map();   // id -> Promise<AudioBuffer|null>
  const decks = new Map();     // id -> Loop on the music bus
  const beds = new Map();      // id -> Loop on the ambience bus
  const voices = [];
  const pending = [];          // { t, fn } delayed steps (reused objects)
  let lastTarget = {};

  // ---------- loading ----------
  function loadManifest() {
    if (!manifestP) {
      manifestP = fetch(new URL('manifest.json', base)).then((r) => r.json()).then((m) => {
        manifest = m;
        for (const c of m.clips) clips.set(c.id, c);
        return m;
      }).catch((e) => { console.warn('audio: no manifest', e); manifest = { clips: [] }; return manifest; });
    }
    return manifestP;
  }
  function load(id) {
    if (buffers.has(id)) return Promise.resolve(buffers.get(id));
    if (loading.has(id)) return loading.get(id);
    const p = loadManifest().then(() => {
      const c = clips.get(id);
      if (!c || !ctx) return null;
      return fetch(new URL(c.file, base)).then((r) => r.arrayBuffer()).then((data) => new Promise((res, rej) => {
        const done = ctx.decodeAudioData(data, res, rej); // callback form for older Safari
        if (done && done.then) done.then(res, rej);
      })).then((buf) => { buffers.set(id, buf); return buf; });
    }).catch((e) => { console.warn('audio: failed', id, e); return null; });
    loading.set(id, p);
    return p;
  }

  // ---------- graph ----------
  function makeBuses() {
    const master = ctx.createGain();
    const comp = ctx.createDynamicsCompressor(); // bus glue + safety limiter
    comp.threshold.value = -10; comp.knee.value = 6; comp.ratio.value = 6; comp.attack.value = 0.004; comp.release.value = 0.2;
    master.connect(comp).connect(ctx.destination);
    const mk = () => { const g = ctx.createGain(); g.connect(master); return g; };
    const b = { master, music: mk(), amb: mk(), sfx: mk(), ui: mk() };
    b.master.gain.value = state.volume.master;
    for (const k of ['music', 'amb', 'sfx', 'ui']) b[k].gain.value = state.volume[k];
    return b;
  }
  function setGain(param, v, tc = 0.25) {
    param.cancelScheduledValues(ctx.currentTime);
    param.setTargetAtTime(v, ctx.currentTime, tc);
  }

  // A buffer looped by overlapping segments with crossfades (hides MP3 padding and the 50 ms fades).
  class Loop {
    constructor(id, dest) {
      this.id = id; this.out = ctx.createGain(); this.out.gain.value = 0; this.out.connect(dest);
      this.weight = 0; this.applied = -1; this.playing = false; this.nextAt = 0; this.segs = [];
      this.segStart = 0; this.segOffset = 0; this.resume = 0; this.idleSince = 0;
    }
    get buf() { return buffers.get(this.id); }
    start(offset = this.resume) {
      const buf = this.buf;
      if (!buf || this.playing) return;
      this.playing = true;
      this.seg(ctx.currentTime + 0.03, Math.min(offset, Math.max(0, buf.duration - XF * 2)), true);
    }
    seg(at, offset, first) {
      const buf = this.buf, xf = Math.min(XF, buf.duration / 4);
      const src = ctx.createBufferSource(), g = ctx.createGain();
      src.buffer = buf; src.connect(g); g.connect(this.out);
      const end = at + (buf.duration - offset);
      g.gain.setValueAtTime(first ? 0 : 0, at);
      g.gain.linearRampToValueAtTime(1, at + (first ? 0.08 : xf));
      g.gain.setValueAtTime(1, end - xf);
      g.gain.linearRampToValueAtTime(0, end);
      src.start(at, offset); src.stop(end + 0.05);
      this.segs.push({ src, g, end });
      if (this.segs.length > 3) this.segs.shift();
      this.segStart = at; this.segOffset = offset; this.nextAt = end - xf;
    }
    tick(now) {
      if (this.playing && now > this.nextAt - 0.5) this.seg(this.nextAt, 0.05, false);
    }
    stop() {
      if (!this.playing) return;
      this.playing = false;
      const buf = this.buf;
      this.resume = buf ? ((ctx.currentTime - this.segStart + this.segOffset) % buf.duration) : 0;
      const t = ctx.currentTime + 0.05;
      for (const s of this.segs) { try { s.src.stop(t); } catch (e) { /* already stopped */ } }
      this.segs.length = 0;
    }
    // weight 0..1 -> gain (equal-power-ish), starts/stops itself
    drive(now, fade) {
      if (this.weight > 0.001) {
        this.idleSince = now;
        if (!this.playing) { if (this.buf) this.start(); else load(this.id); }
      } else if (this.playing && now - this.idleSince > fade * 3 + 1) this.stop();
      const g = Math.sin(clamp01(this.weight) * Math.PI / 2);
      if (Math.abs(g - this.applied) > 0.004) { setGain(this.out.gain, g, fade / 3); this.applied = g; }
      this.tick(now);
    }
  }

  // ---------- voices (pooled) ----------
  function makeVoice() {
    const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 18000;
    const gain = ctx.createGain(); gain.gain.value = 0;
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    filter.connect(gain);
    if (pan) gain.connect(pan);
    return { filter, gain, pan, src: null, loop: null, id: '', busy: false, until: 0, started: 0, pos: null, base: 1, bus: null, out: pan || gain };
  }
  function freeVoice(v) {
    if (v.src) { try { v.src.stop(); } catch (e) { /* ok */ } v.src.onended = null; v.src = null; }
    if (v.loop) { v.loop.stop(); v.loop = null; }
    if (v.osc) { for (const o of v.osc) { try { o.stop(); } catch (e) { /* ok */ } } v.osc = null; }
    v.busy = false; v.id = ''; v.pos = null;
  }
  function takeVoice(id, bus) {
    let same = 0, oldestSame = null, free = null, oldest = null;
    for (const v of voices) {
      if (!v.busy) { if (!free) free = v; continue; }
      if (v.id === id) { same++; if (!oldestSame || v.started < oldestSame.started) oldestSame = v; }
      if (!oldest || v.started < oldest.started) oldest = v;
    }
    const v = same >= SAME_CLIP_MAX ? oldestSame : free || oldest;
    if (v.busy) freeVoice(v);
    if (v.bus !== bus) { try { v.out.disconnect(); } catch (e) { /* first use */ } v.out.connect(buses[bus]); v.bus = bus; }
    v.busy = true; v.id = id; v.started = ctx.currentTime;
    return v;
  }
  // distance/pan for a voice against the listener; ui voices stay centred
  function place(v, immediate) {
    let g = v.base, p = 0, lp = 18000;
    if (v.pos) {
      const L = state.listener, dx = v.pos.x - L.x, dz = v.pos.z - L.z, d = Math.hypot(dx, dz);
      const ref = 5, max = 90;
      g *= d <= ref ? 1 : ref / (ref + 1.1 * (d - ref));
      if (d > max) g = 0;
      lp = 18000 - Math.min(1, d / 70) * 14000;   // far sounds lose top end
      if (L.yaw != null && d > 0.01) {
        // three.js style yaw: forward = (-sin, -cos); right = (cos, -sin)
        const rx = Math.cos(L.yaw), rz = -Math.sin(L.yaw);
        p = Math.max(-1, Math.min(1, (dx * rx + dz * rz) / Math.max(d, 3)));
      } else p = Math.max(-1, Math.min(1, dx / Math.max(Math.abs(dz) + Math.abs(dx), 6)));
      p *= 0.85;
    }
    if (immediate) {
      v.gain.gain.setValueAtTime(g, ctx.currentTime); v.filter.frequency.setValueAtTime(lp, ctx.currentTime);
      if (v.pan) v.pan.pan.setValueAtTime(p, ctx.currentTime);
    } else {
      v.gain.gain.setTargetAtTime(g, ctx.currentTime, 0.08); v.filter.frequency.setTargetAtTime(lp, ctx.currentTime, 0.1);
      if (v.pan) v.pan.pan.setTargetAtTime(p, ctx.currentTime, 0.08);
    }
  }
  function play(id, { pos = null, gain = 1, rate = 1, ui = false, loopFor = 0, rateTo = null } = {}) {
    const buf = buffers.get(id);
    if (!buf) return null;
    const bus = ui ? 'ui' : clips.get(id)?.kind === 'bed' && !pos ? 'amb' : 'sfx';
    const v = takeVoice(id, bus);
    v.pos = ui ? null : pos ? { x: pos.x, z: pos.z ?? pos.y ?? 0 } : null;
    v.base = gain;
    place(v, true);
    const now = ctx.currentTime;
    if (loopFor > 0) {
      const lp = new Loop(id, v.filter); lp.out.gain.value = 1; lp.applied = 1; lp.start(0);
      v.loop = lp; v.until = now + loopFor;
      v.gain.gain.setValueAtTime(v.gain.gain.value, now + Math.max(0, loopFor - 1));
    } else {
      const src = ctx.createBufferSource(); src.buffer = buf; src.playbackRate.value = rate;
      if (rateTo) src.playbackRate.linearRampToValueAtTime(rateTo, now + buf.duration / rate);
      src.connect(v.filter); src.start(now);
      src.onended = () => { if (v.src === src) { v.src = null; v.busy = false; v.id = ''; } };
      v.src = src; v.until = now + buf.duration / Math.min(rate, rateTo || rate) + 0.1;
    }
    return v;
  }

  // ---------- procedural placeholders ----------
  function synthMegaphone(pos) {
    // PA key click + short feedback squeal (placeholder: no megaphone recording was reachable)
    const v = takeVoice('synth-megaphone-squeal', 'sfx');
    v.pos = pos ? { x: pos.x, z: pos.z ?? 0 } : null; v.base = 0.35; place(v, true);
    const now = ctx.currentTime;
    const o = ctx.createOscillator(), lfo = ctx.createOscillator(), lg = ctx.createGain(), env = ctx.createGain();
    o.type = 'sine'; o.frequency.value = 2600 + Math.random() * 500;
    lfo.frequency.value = 7; lg.gain.value = 18; lfo.connect(lg); lg.connect(o.frequency);
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(0.5, now + 0.25);
    env.gain.linearRampToValueAtTime(0.0, now + 0.7);
    // click: a 15 ms burst of a square wave
    const c = ctx.createOscillator(), cg = ctx.createGain();
    c.type = 'square'; c.frequency.value = 180; cg.gain.setValueAtTime(0.6, now); cg.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    o.connect(env); env.connect(v.filter); c.connect(cg); cg.connect(v.filter);
    o.start(now); lfo.start(now); c.start(now); o.stop(now + 0.75); lfo.stop(now + 0.75); c.stop(now + 0.05);
    v.osc = [o, lfo, c]; v.until = now + 0.8;
    o.onended = () => { if (v.osc && v.osc[0] === o) { v.osc = null; v.busy = false; v.id = ''; } };
  }
  function synthBikes(pos) {
    // three bikes passing: recorded revs with a falling playback rate (doppler) and a pan sweep
    const p = pos || state.listener;
    for (let i = 0; i < 3; i++) {
      later(i * 0.7, () => {
        const v = play(i === 1 ? 'amb-bike-idle' : 'bike-rev', { pos: { x: p.x - 10 + i * 3, z: p.z ?? 0 }, gain: 0.8, rate: 1.18 - i * 0.04, rateTo: 0.88 });
        if (v && v.pos) moveVoice(v, { x: p.x + 14, z: (p.z ?? 0) + 2 }, 4);
      }, ['bike-rev', 'amb-bike-idle']);
    }
  }
  const movers = [];
  function moveVoice(v, to, seconds) { movers.push({ v, id: v.id, from: { ...v.pos }, to, t0: ctx.currentTime, d: seconds }); }
  function synthRun(pos) {
    if (!pos) return;
    for (let i = 0; i < 7; i++) later(i * 0.27 + Math.random() * 0.03, () => play(pick(['step-a', 'step-b', 'step-c']), { pos, gain: 0.5, rate: rnd([0.9, 1.1]) }), ['step-a', 'step-b', 'step-c']);
  }

  // ---------- scheduling ----------
  // run fn after `delay` seconds once the clips it needs are loaded (or drop it if they come too late)
  function later(delay, fn, need = [], late = LATE_SFX) {
    const due = (ctx ? ctx.currentTime : 0) + delay;
    const ready = need.every((id) => buffers.has(id));
    if (!ready) Promise.all(need.map(load));
    pending.push({ t: due, fn, need, late });
  }
  function runPending(now) {
    for (let i = pending.length - 1; i >= 0; i--) {
      const p = pending[i];
      if (now < p.t) continue;
      if (p.need.every((id) => buffers.has(id))) { pending.splice(i, 1); p.fn(); } else if (now > p.t + p.late) pending.splice(i, 1);
    }
  }

  // ---------- music & ambience direction ----------
  function musicTargets(now) {
    const pm = PHASE_MUSIC[state.phase] || PHASE_MUSIC.morning;
    const t = {};
    // hot/base with hysteresis and a minimum dwell so the band doesn't flip-flop
    const I = state.smoothInt;
    if (!state.hot && pm.hot && I >= pm.up && now - state.hotSince > 20) { state.hot = true; state.hotSince = now; }
    if (state.hot && (!pm.hot || I < pm.up - 15) && now - state.hotSince > 20) { state.hot = false; state.hotSince = now; }
    if (state.override && now < state.overrideUntil) t[state.override] = 1;
    else if (state.chaseOn) t[pm.chase] = 1;
    else t[state.hot && pm.hot ? pm.hot : pm.base] = 1;
    return t;
  }
  function direct(now) {
    // music decks
    const mt = musicTargets(now);
    for (const id of Object.keys(mt)) if (!decks.has(id)) decks.set(id, new Loop(id, buses.music));
    const fade = state.chaseOn || state.chaseQuick ? 0.5 : 3.5;
    for (const [id, d] of decks) { d.weight = mt[id] || 0; d.drive(now, fade); }
    // ambience beds
    const pa = PHASE_AMB[state.phase] || PHASE_AMB.morning;
    const n = state.crowd + (now < state.crowdSwellUntil ? 60 : 0);
    const chantBase = (state.phase === 'tense' || state.phase === 'showdown') ? clamp01((state.smoothInt - 40) / 60) * 0.5 : 0;
    const bt = {
      'amb-traffic': pa['amb-traffic'], 'amb-night': pa['amb-night'], 'amb-siren': pa['amb-siren'] * (0.5 + state.smoothInt / 200),
      'amb-crowd-sparse': clamp01(n / 12) * (1 - clamp01((n - 80) / 80) * 0.6) * 0.8,
      'amb-crowd-medium': clamp01((n - 15) / 50) * 0.75,
      'amb-crowd-dense': clamp01((n - 60) / 90) * 0.85,
      'amb-chant': Math.max(chantBase, now < state.chantUntil ? 0.75 : 0),
      'amb-crickets': now < state.cutUntil ? 0.6 : 0,
    };
    if (now < state.cutUntil) for (const k of Object.keys(bt)) if (k !== 'amb-crickets') bt[k] *= 0.45; // the street goes quiet too
    for (const id of Object.keys(bt)) if (!beds.has(id) && bt[id] > 0) beds.set(id, new Loop(id, buses.amb));
    for (const [id, b] of beds) { b.weight = bt[id] || 0; b.drive(now, 2.5); }
    // bus gains: duck for scenes and short moments, cut for awkward silences
    const cut = now < state.cutUntil;
    const duck = state.sceneDuck || now < state.duckUntil ? 0.35 : 1;
    const music = cut ? 0 : state.volume.music * duck * (0.85 + 0.15 * state.smoothInt / 100);
    const amb = state.volume.amb * (state.sceneDuck ? 0.6 : 1);
    const tcMusic = cut ? 0.02 : state.justReturned ? 0.08 : 0.4;
    state.justReturned = false;
    if (Math.abs(music - (lastTarget.music ?? -1)) > 0.005) { setGain(buses.music.gain, music, tcMusic); lastTarget.music = music; }
    if (Math.abs(amb - (lastTarget.amb ?? -1)) > 0.005) { setGain(buses.amb.gain, amb, 0.5); lastTarget.amb = amb; }
  }
  function prefetchPhase(phase) {
    const pm = PHASE_MUSIC[phase];
    if (!pm) return;
    [pm.base, pm.hot, pm.chase, 'amb-traffic', 'amb-crowd-sparse', 'amb-crowd-medium'].filter(Boolean).forEach(load);
  }

  // ---------- fx actions ----------
  function fx(step, pos, data) {
    const now = ctx.currentTime;
    switch (step.fx) {
      case 'chase': {
        if (step.on) { state.chaseOn = true; state.cutUntil = 0; load(PHASE_MUSIC[state.phase].chase); }
        else { state.chaseOn = false; state.chaseQuick = !!step.quick; setTimeout(() => { state.chaseQuick = false; }, 1500); }
        break;
      }
      case 'silence': api.silence(data?.seconds ?? step.seconds); break;
      case 'laugh': if (now < state.cutUntil) { state.cutUntil = 0; state.justReturned = true; } break; // comes back on the laugh
      case 'duck': api.duckFor(step.seconds); break;
      case 'scene': state.sceneDuck = !!step.on; if (step.on && data?.music && clips.has(data.music)) { state.override = data.music; state.overrideUntil = now + (data.seconds || 30); } if (!step.on) state.override = null; break;
      case 'override': state.override = step.music; state.overrideUntil = now + step.seconds; load(step.music); break;
      case 'chant': if (step.seconds) { state.chantUntil = Math.max(state.chantUntil, now + step.seconds); load('amb-chant'); } if (step.crowdSwell) state.crowdSwellUntil = now + step.crowdSwell; break;
      case 'phase': if (data) api.setPhase(typeof data === 'string' ? data : data.phase); break;
      case 'hits': {
        const ids = ['lathi-a', 'lathi-b', 'shield-thud', 'swing'];
        for (let i = 0; i < step.count; i++) {
          const at = step.from + Math.random() * (step.to - step.from);
          const p = pos ? { x: pos.x + (Math.random() - 0.5) * 8, z: (pos.z ?? 0) + (Math.random() - 0.5) * 8 } : null;
          const id = pick(ids);
          later(at, () => play(id, { pos: p, gain: 0.8, rate: rnd([0.9, 1.12]) }), [id]);
        }
        break;
      }
      default: break;
    }
  }

  // ---------- public API ----------
  const api = {
    get ready() { return !!ctx && ctx.state === 'running'; },
    unlock() {
      if (!ctx) {
        const AC = options.AudioContext || globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!AC) return Promise.resolve(false);
        ctx = new AC({ latencyHint: 'interactive' });
        buses = makeBuses();
        for (let i = 0; i < VOICES; i++) voices.push(makeVoice());
        for (const v of voices) { v.out.connect(buses.sfx); v.bus = 'sfx'; }
        loadManifest().then(() => prefetchPhase(state.phase));
      }
      // iOS: resume inside the gesture, and play one silent buffer to open the output
      const silent = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource();
      s.buffer = silent; s.connect(ctx.destination); s.start(0);
      return ctx.resume().then(() => true, () => false);
    },
    setPhase(phase) {
      if (!PHASE_MUSIC[phase] || phase === state.phase && decks.size) return;
      const prev = state.phase;
      state.phase = phase; state.hot = false; state.hotSince = -1e9;
      if (!ctx) return;
      prefetchPhase(phase);
      const order = PHASES.indexOf(phase) - PHASES.indexOf(prev);
      if (order > 0 && (phase === 'tense' || phase === 'showdown')) api.cue('phase-hit');
    },
    cue(name, opts = {}) {
      if (!ctx) return false;
      const steps = name === 'phase-hit' ? [{ clip: 'jingle-hit', ui: true, gain: 0.6 }, { clip: 'boom-low', ui: true, gain: 0.5 }] : CUES[name];
      if (!steps) { console.warn('audio: unknown cue', name); return false; }
      if (opts.listener) api.update(0, opts.listener);
      const pos = opts.pos || null, data = opts.data;
      for (const s of steps) {
        if (s.chance != null && Math.random() > s.chance) continue;
        if (s.fx) { if (s.at) later(s.at, () => fx(s, pos, data)); else fx(s, pos, data); continue; }
        if (s.synth) {
          const f = s.synth === 'megaphone' ? () => synthMegaphone(pos) : s.synth === 'bikes' ? () => synthBikes(pos) : () => synthRun(pos);
          later(s.at || 0, f); continue;
        }
        const id = pick(s.clip);
        const seconds = s.loop === 'seconds' ? (data?.seconds || 8) : s.loop;
        later(s.at || 0, () => play(id, { pos: s.ui ? null : pos, gain: s.gain ?? 1, rate: rnd(s.rate), ui: !!s.ui, loopFor: seconds || 0 }), [id], seconds ? 3 : LATE_SFX);
      }
      return true;
    },
    setIntensity(v) { state.intensity = Math.max(0, Math.min(100, +v || 0)); },
    chase(on) { if (!ctx) { state.chaseOn = !!on; return; } fx({ fx: 'chase', on: !!on }); },
    duckFor(seconds) { if (ctx) state.duckUntil = Math.max(state.duckUntil, ctx.currentTime + seconds); },
    silence(seconds = 3) {
      if (!ctx) return;
      const now = ctx.currentTime;
      state.cutUntil = now + seconds; state.justReturned = false;
      load('amb-crickets');
      later(0.7, () => play('cricket-chirp', { ui: true, gain: 0.8 }), ['cricket-chirp'], 1.5);
    },
    setCrowd(size) { state.crowd = Math.max(0, +size || 0); },
    setVolume(v = {}) { Object.assign(state.volume, v); if (buses) { buses.master.gain.value = state.volume.master; buses.sfx.gain.value = state.volume.sfx; buses.ui.gain.value = state.volume.ui; lastTarget = {}; } },
    update(dt, listenerPos) {
      if (listenerPos) {
        state.listener.x = listenerPos.x; state.listener.z = listenerPos.z ?? listenerPos.y ?? 0;
        if (listenerPos.yaw != null) state.listener.yaw = listenerPos.yaw;
      }
      if (!ctx || ctx.state !== 'running') return;
      const now = ctx.currentTime;
      // intensity eases (a musician reacts within a bar or two, not a frame)
      state.smoothInt += (state.intensity - state.smoothInt) * Math.min(1, (dt || 0) * 0.5);
      if (state.cutUntil && now >= state.cutUntil && state.cutUntil > 0) { state.cutUntil = 0; }
      runPending(now);
      for (let i = movers.length - 1; i >= 0; i--) {
        const m = movers[i], k = (now - m.t0) / m.d;
        if (!m.v.busy || m.v.id !== m.id || k >= 1) { movers.splice(i, 1); continue; }
        m.v.pos.x = m.from.x + (m.to.x - m.from.x) * k; m.v.pos.z = m.from.z + (m.to.z - m.from.z) * k;
      }
      for (const v of voices) {
        if (!v.busy) continue;
        if (v.loop) {
          v.loop.tick(now);
          if (now > v.until) { freeVoice(v); continue; }
          if (now > v.until - 1) v.gain.gain.setTargetAtTime(0, now, 0.3);
          else if (v.pos) place(v, false);
        } else if (v.pos) place(v, false);
        if (!v.loop && !v.osc && now > v.until + 0.5) freeVoice(v);
      }
      direct(now);
    },
    // for debugging / the integration
    get state() { return state; },
    get context() { return ctx; },
    preload(ids) { return Promise.all(ids.map(load)); },
  };
  return api;
}
