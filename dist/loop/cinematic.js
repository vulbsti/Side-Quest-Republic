// Reel cinematics in the engine: a 9:16 phone frame (or letterbox), captions, close-ups and
// reaction shots on whoever is speaking, hard cuts on react:'cut', a hold on silence.
// Driven by scene data in the spec's format: { title, cast, camera, beats:[{who,line,overlap,react}], options, payoff }.
// Control returns to the player at the options; the caller keeps people talking (see chatterLine).
// Also short set-piece stings: the camera swings to the water cannon or the first stone for ~2.5 s.
import * as THREE from 'three';

const FOV_BASE = 57;
const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3(), tmpDir = new THREE.Vector3(), tmpPerp = new THREE.Vector3();
const camFrom = new THREE.Vector3(), lookFrom = new THREE.Vector3(), camTo = new THREE.Vector3(), lookTo = new THREE.Vector3(), lookNow = new THREE.Vector3();

const beatLength = (b) => (b.line ? THREE.MathUtils.clamp(1.5 + b.line.length * 0.052, 2, 6.8) : 1.4);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/**
 * createCinematic({ camera, dom, actor, nameOf, onReact })
 *  actor(id) -> { x, y, z } | null   world position of a cast member's feet ('player' included)
 *  nameOf(id) -> display name
 *  onReact(kind, beat) called for 'laugh' | 'silence' | 'cut' and for every spoken beat ('line')
 */
export function createCinematic({ camera, dom, actor, nameOf = (id) => id, onReact = () => {} }) {
  const el = {
    root: dom, caps: dom.querySelector('#cineCaps'), title: dom.querySelector('#cineTitle'),
    frame: dom.querySelector('#cineFrame'), timer: dom.querySelector('#cineTimer'), skip: dom.querySelector('#cineSkip'),
    handle: dom.querySelector('#cineHandle'),
  };
  let mode = null; // 'scene' | 'sting' | null
  let timeline = [], T = 0, total = 0, scene = null, onDone = null, lastShot = -1, speaking = null, shotIdx = 0;
  let sting = null;
  const lookTargets = new Map(); // id -> {x,z}: who each cast member should face
  let captionKey = '';

  function show(phone) {
    el.root.classList.remove('hidden');
    el.root.classList.toggle('phone', !!phone);
    el.root.classList.toggle('letterbox', !phone);
    requestAnimationFrame(() => el.root.classList.add('on'));
  }
  function hide() {
    el.root.classList.remove('on', 'phone', 'letterbox', 'sting');
    el.root.classList.add('hidden');
    el.caps.innerHTML = ''; el.title.textContent = ''; captionKey = '';
    camera.fov = FOV_BASE; camera.updateProjectionMatrix();
  }

  /** Lay the beats out on a clock: overlaps start before the previous line ends; reacts add holds. */
  function build(beats) {
    const out = []; let t = 0.35, prev = null;
    for (const b of beats || []) {
      const len = beatLength(b);
      const start = b.overlap && prev ? prev.start + prev.len * 0.55 : t;
      const item = { b, start, len, end: start + len, listener: null };
      out.push(item);
      t = item.end + 0.15;
      if (b.react === 'silence') t += 1.9;
      else if (b.react === 'laugh') t += 1.3;
      else if (b.react === 'cut') t += 1.0;
      item.after = t;
      prev = item;
    }
    // Each line is "heard" by the previous different speaker (or the player).
    for (let i = 0; i < out.length; i++) {
      let l = null;
      for (let j = i - 1; j >= 0 && !l; j--) if (out[j].b.who !== out[i].b.who) l = out[j].b.who;
      for (let j = i + 1; j < out.length && !l; j++) if (out[j].b.who !== out[i].b.who) l = out[j].b.who;
      out[i].listener = l || (out[i].b.who === 'player' ? null : 'player');
    }
    return { out, total: t + 0.2 };
  }

  /** Play a scene's beats (or an option's beats). opts: { phone, title, handle, onDone } */
  function play(sceneData, opts = {}) {
    const beats = opts.beats || sceneData?.beats || [];
    scene = sceneData;
    const built = build(beats);
    timeline = built.out; total = built.total; T = 0; lastShot = -1; shotIdx = 0; speaking = null;
    onDone = opts.onDone || null;
    mode = 'scene';
    const phone = (opts.phone ?? sceneData?.camera) === 'phone' || opts.phone === true;
    show(phone);
    el.root.classList.remove('sting');
    el.title.textContent = opts.title ?? sceneData?.title ?? '';
    if (el.handle) el.handle.textContent = opts.handle || '@meera.makes.reels';
    el.skip.textContent = 'Space next line · Esc skip';
    lookTargets.clear();
    for (const it of timeline) {
      const l = it.listener && actor(it.listener), s = actor(it.b.who);
      if (s && l) { lookTargets.set(it.b.who, { x: l.x, z: l.z }); if (!lookTargets.has(it.listener)) lookTargets.set(it.listener, { x: s.x, z: s.z }); }
    }
    if (!timeline.length) finish();
  }
  function finish() {
    const cb = onDone; mode = null; timeline = []; speaking = null; lookTargets.clear(); hide();
    onDone = null; cb?.();
  }
  /** Space: jump to the next line. Esc: skip to the end (the options). */
  function next() {
    if (mode === 'sting') { sting.t = Math.max(sting.t, sting.dur - 0.45); return; }
    if (mode !== 'scene') return;
    const upcoming = timeline.find((it) => it.start > T + 0.05);
    if (upcoming) T = upcoming.start; else finish();
  }
  function skip() { if (mode === 'sting') next(); else if (mode === 'scene') finish(); }

  function headOf(id, out) {
    const a = actor(id); if (!a) return null;
    return out.set(a.x, (a.y || 0) + (a.height || 1.62), a.z);
  }
  /** Compute a camera shot: 'close' on the speaker, 'ots' over the listener's shoulder, 'wide' on the group. */
  function shot(kind, who, listener, out, look) {
    const S = headOf(who, tmpA);
    if (!S) return false;
    const L = (listener && headOf(listener, tmpB)) || tmpB.copy(S).add(tmpDir.set(0, 0, 3));
    tmpDir.subVectors(L, S).setY(0);
    if (tmpDir.lengthSq() < 0.04) tmpDir.set(0, 0, 1);
    tmpDir.normalize();
    tmpPerp.set(tmpDir.z, 0, -tmpDir.x);
    if (kind === 'close') { out.copy(S).addScaledVector(tmpDir, 1.45).addScaledVector(tmpPerp, 0.38); out.y = S.y + 0.04; look.copy(S); look.y -= 0.04; return 38; }
    if (kind === 'ots') { out.copy(L).addScaledVector(tmpDir, 0.75).addScaledVector(tmpPerp, -0.42); out.y = L.y + 0.12; look.copy(S); look.y -= 0.05; return 42; }
    // wide: both of them and the crowd behind
    look.lerpVectors(S, L, 0.5); look.y = 1.25;
    out.copy(look).addScaledVector(tmpPerp, 6.5).addScaledVector(tmpDir, -1.5); out.y = 2.6;
    return 50;
  }

  /**
   * Set-piece sting: swing to a target for ~2.5 s, letterboxed with a title. Skippable.
   * target: Vector3 (what to look at). title/sub: words on screen.
   */
  function playSting({ target, title = '', sub = '', duration = 2.6 }) {
    if (mode === 'scene') return false;
    const getTarget = typeof target === 'function' ? target : null;
    if (getTarget) target = getTarget();
    if (!target) return false;
    camFrom.copy(camera.position);
    camera.getWorldDirection(tmpDir); lookFrom.copy(camera.position).addScaledVector(tmpDir, 10);
    lookTo.copy(target);
    // A vantage 11 m off, on the side the camera already is, a little higher.
    tmpDir.subVectors(camFrom, target).setY(0); if (tmpDir.lengthSq() < 0.01) tmpDir.set(0, 0, 1); tmpDir.normalize();
    tmpDir.applyAxisAngle(THREE.Object3D.DEFAULT_UP, 0.45);
    camTo.copy(target).addScaledVector(tmpDir, 11); camTo.y = target.y + 4.2;
    sting = { t: 0, dur: duration, fov: camera.fov, getTarget, offset: new THREE.Vector3().subVectors(camTo, lookTo) };
    mode = 'sting';
    show(false);
    el.root.classList.add('sting');
    el.title.innerHTML = `${esc(title)}${sub ? `<small>${esc(sub)}</small>` : ''}`;
    el.caps.innerHTML = '';
    el.skip.textContent = 'Any key to skip';
    return true;
  }

  const ease = (k) => k * k * (3 - 2 * k);
  /** Per frame. Returns true while the cinematic owns the camera. */
  function update(dt) {
    if (mode === 'sting') {
      sting.t += dt;
      const k = sting.t / sting.dur;
      if (sting.getTarget) { const p = sting.getTarget(); if (p) { lookTo.copy(p); camTo.copy(p).add(sting.offset); } }
      const swing = ease(THREE.MathUtils.clamp(sting.t / 0.7, 0, 1));
      const back = ease(THREE.MathUtils.clamp((sting.t - (sting.dur - 0.45)) / 0.45, 0, 1));
      camera.position.lerpVectors(camFrom, camTo, swing * (1 - back));
      // A slow drift while holding, so it doesn't look like a still.
      camera.position.y += Math.sin(sting.t * 0.8) * 0.15;
      lookNow.lerpVectors(lookFrom, lookTo, swing * (1 - back));
      camera.lookAt(lookNow);
      if (k >= 1) { mode = null; sting = null; hide(); return false; }
      return true;
    }
    if (mode !== 'scene') return false;
    T += dt;
    if (T >= total) { finish(); return false; }
    // Which beat is on: the latest one that has started.
    let cur = -1;
    for (let i = 0; i < timeline.length; i++) if (timeline[i].start <= T) cur = i;
    const it = timeline[Math.max(0, cur)];
    speaking = it && T < it.end ? it.b.who : null;
    // Captions: every line whose window is open (overlaps stack).
    let html = '', key = '';
    for (const x of timeline) if (T >= x.start && T < x.end && x.b.line) {
      key += x.start;
      const via = x.b.via === 'phone' ? ' · on the phone' : x.b.via === 'wireless' ? ' · on the wireless' : x.b.via === 'window' ? ' · through the window' : '';
      html += `<div class="cap${x.b.who === 'player' ? ' you' : ''}${x.b.aside ? ' aside' : ''}"><b>${esc(nameOf(x.b.who))}${via}${x.b.aside ? ' · whispers' : ''}</b>${esc(x.b.line)}</div>`;
    }
    if (key !== captionKey) { captionKey = key; el.caps.innerHTML = html; }
    if (el.timer) el.timer.textContent = `00:${String(Math.floor(T)).padStart(2, '0')}`;
    // Camera: a new shot when a new beat starts, and a reaction after it.
    let phase = 'line';
    if (it && T >= it.end) phase = it.b.react || 'hold';
    const shotKey = cur * 10 + (phase === 'line' ? 0 : 1);
    if (shotKey !== lastShot && it) {
      if (phase === 'line') { onReact('line', it.b); if (it.b.sfx) onReact('sfx', it.b); }
      else if (it.b.react) onReact(it.b.react, it.b);
      lastShot = shotKey;
      shotIdx++;
      let fov;
      if (phase === 'line') fov = shot(shotIdx % 3 === 2 ? 'ots' : 'close', it.b.who, it.listener, camTo, lookTo);
      else if (phase === 'laugh') fov = shot('wide', it.b.who, it.listener, camTo, lookTo);
      else if (phase === 'cut' || phase === 'silence') fov = it.listener ? shot('close', it.listener, it.b.who, camTo, lookTo) : false;
      else fov = false; // hold: keep the last shot
      if (fov) {
        // Hard cut: jump straight there, then push in slowly.
        camFrom.copy(camTo).addScaledVector(tmpDir.subVectors(camTo, lookTo).normalize(), 0.35);
        camera.position.copy(camFrom); lookFrom.copy(lookTo);
        camera.fov = fov; camera.updateProjectionMatrix();
        it.shotT = T;
      }
    }
    const since = T - (it?.shotT ?? T);
    camera.position.lerpVectors(camFrom, camTo, Math.min(1, since / 4));
    if (el.root.classList.contains('phone')) { // handheld phone wobble
      camera.position.x += Math.sin(T * 1.7) * 0.012; camera.position.y += Math.sin(T * 2.3) * 0.01;
    }
    camera.lookAt(lookFrom);
    return true;
  }

  /** While the options are open, people keep talking: the next line to show as a bubble. */
  let chatterI = 0;
  function chatterLine(sceneData) {
    const src = sceneData?.idle || sceneData?.chatter || sceneData?.beats || [];
    const pool = src.map((b) => (Array.isArray(b) ? { who: b[0], line: b[1] } : b)).filter((b) => b.line && b.who && b.who !== 'player');
    if (!pool.length) return null;
    return pool[chatterI++ % pool.length];
  }

  return {
    play, playSting, update, next, skip, chatterLine,
    get active() { return mode !== null; },
    get mode() { return mode; },
    get speaking() { return speaking; },
    get scene() { return scene; },
    lookTargets,
  };
}
