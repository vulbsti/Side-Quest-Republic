// The three-minute slice on screen: the countdown, the follower count, the mischief list with its stamps, the
// stamina bar, short barks, the picture-in-picture reel cutaway, and the end reel. The engine (slice.js via
// rules.js sliceView) decides everything; this only draws it. main.js calls in through a handful of hooks.
//
// The cutaway is a real second render of the live scene into a small portrait viewport (renderer scissor), seen
// through a second camera that looks at whoever is reacting. It never takes the camera or the controls away.
//
// On a full day only the follower pops and the reel cutaway are used ("mini"), for the place dares (places.js),
// which pay with the same cues: their data carries `place`.

const BEST_KEY = 'sqr-slice-best';
const fmt = (n) => Math.round(n).toLocaleString('en-IN');
const short = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}K` : String(n));
const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const WHY = { dare: 'DARE', 'bach gaya': 'BACH GAYA', escape: 'NIKAL GAYA', bonus: 'BONUS TOPI', party: 'PARTY', shuttle: 'SHUTTLE ATKA', caught: 'UTHAK-BAITHAK REEL', chabi: 'CHABI', aura: 'AURA' };
const HANDLES = ['@delhi.ka.launda', '@cp_wali_aunty', '@chai.sutta.reels', '@jantar.ki.awaaz', '@noida_se_hu'];
const CARRY = { speaker: 'Bus stop pe rakh: Q', key: 'Constable ko dikha. Phir bhaag.' };
const PICKUP = { speaker: 'Speaker utha', key: 'Chabi utha' };
const CUT_SECONDS = 2.8;
/** The quick flashes on a chase's beats (tests/lib/slice-bots.mjs counts these words too). */
export const FLASH = { lunge: '⚠ KAT!', near: 'BACH GAYA!', caught: 'PAKDE GAYE!' };

export function createSliceUI({ THREE, world, audio, equipCap, getDay, getSim, getPlayer, bodyOf, sliceView }) {
  const $ = (s) => document.querySelector(s);
  let built = false, root, els = {}, shown = 0, last = null, cut = null, queue = [], barkT = 0, flashT = 0, cap = null;
  const camera = new THREE.PerspectiveCamera(42, 9 / 16, 0.1, 500);
  const look = new THREE.Vector3(), vp = new THREE.Vector4();

  function build() {
    if (built) return;
    built = true;
    root = document.createElement('div');
    root.id = 'slice';
    root.innerHTML = `
      <div class="sl-top"><b class="sl-timer">3:00</b><div class="sl-fol"><b class="sl-n">0</b><small>FOLLOWERS</small><em class="sl-x2 hidden">x2 MEERA REEL</em></div></div>
      <div class="sl-pops"></div>
      <ol class="sl-dares"></ol>
      <div class="sl-stamina"><i></i></div>
      <div class="sl-bark"></div>
      <div class="sl-flash"></div>
      <div class="sl-carry hidden"></div>
      <div class="sl-reel hidden"><span class="rec"><i></i>REC</span><span class="sl-handle">@meera.makes.reels</span><div class="sl-cap"><b></b><span></span><em></em></div></div>`;
    $('#hud').appendChild(root);
    for (const k of ['timer', 'n', 'x2', 'pops', 'dares', 'bark', 'flash', 'carry', 'reel']) els[k] = root.querySelector('.sl-' + k);
    els.stamina = root.querySelector('.sl-stamina i');
    els.capT = root.querySelector('.sl-cap b'); els.capS = root.querySelector('.sl-cap span'); els.capN = root.querySelector('.sl-cap em');
  }

  /** A new run: called by main.js startLoop. Returns true when the day is a slice. */
  function begin(day) {
    document.body.classList.toggle('slice', !!day.slice);
    cut = null; queue = [];
    if (root) { root.classList.toggle('mini', !day.slice); els.pops.innerHTML = ''; els.reel.classList.add('hidden'); }
    if (!day.slice) return false;
    build();
    root.classList.remove('hidden', 'mini');
    shown = 0; last = null; cut = null; queue = []; barkT = 0; flashT = 0;
    els.pops.innerHTML = ''; els.reel.classList.add('hidden'); els.bark.classList.remove('on'); els.flash.classList.remove('on');
    drawDares(sliceView(day));
    return true;
  }

  function drawDares(v) {
    const rows = v.dares.map((d) => `<li data-id="${d.id}" class="${d.done ? 'done' : ''}"><i></i><span>${esc(d.text)}</span><s>HO GAYA</s></li>`);
    rows.push(`<li data-id="bonus" class="bonus ${v.bonus ? 'on' : ''}"><i></i><span>${esc(v.bonusText)}${v.topis > 1 ? ` <b>x${v.topis - (v.dares[0].done ? 1 : 0)}</b>` : ''}</span></li>`);
    els.dares.innerHTML = rows.join('');
    last = v.dares.map((d) => d.done).join() + v.bonus + v.topis;
  }

  function pop(n, why, x2) {
    const el = document.createElement('div');
    el.className = 'sl-pop' + (x2 ? ' x2' : '');
    el.innerHTML = `<b>+${fmt(n)}</b><small>${esc(WHY[why] ?? String(why).toUpperCase())}${x2 ? ' · x2' : ''}</small>`;
    els.pops.appendChild(el);
    setTimeout(() => el.remove(), 1800);
  }
  function bark(text, seconds = 2.2) { els.bark.textContent = text; els.bark.classList.add('on'); barkT = seconds; }
  function flash(text, cls, seconds = 0.9) { els.flash.textContent = text; els.flash.className = 'sl-flash on ' + (cls || ''); flashT = seconds; }

  /** Engine cues: the slice's own, and the chase's telegraph. */
  function cue(c) {
    const day = getDay();
    const d = c.data || {};
    if (day && !day.slice && d.place && c.cue.startsWith('slice:')) { build(); root.classList.remove('hidden'); root.classList.add('mini'); } // a place dare paid
    else if (!day?.slice || !built) return;
    if (c.cue === 'slice:followers') { pop(d.n, d.why, d.x2); audio.cue('phone-chat'); }
    else if (c.cue === 'slice:dare') {
      const li = els.dares.querySelector(`[data-id="${d.id}"]`);
      if (li) { li.classList.add('done', 'stamp'); setTimeout(() => li.classList.remove('stamp'), 900); }
      audio.cue('detainees-escape');
    } else if (c.cue === 'slice:cutaway') {
      queue.push({ ...d, pos: d.pos ?? c.pos });
      if (queue.length > 2) queue.splice(0, queue.length - 2); // never lag far behind what is happening
      audio.cue('clip-posted');
    } else if (c.cue === 'lunge') flash(FLASH.lunge, 'warn', 0.8);
    else if (c.cue === 'lunge-miss' && d.near) flash(FLASH.near, 'good', 1);
    else if (c.cue === 'caught') flash(FLASH.caught, 'bad', 1.4);
  }
  /** A slice line from the engine (present.js channel 'slice'). */
  function line(e) { if (e.text) bark(e.text); }

  function update(dt) {
    const day = getDay();
    if (!built) return;
    if (!day?.slice) { reel(dt); return; } // a full day: only a place dare's cutaway
    const v = sliceView(day), sim = getSim();
    els.timer.textContent = clock(Math.ceil(v.left - 1e-6));
    els.timer.classList.toggle('late', v.left <= 30);
    shown += (v.followers - shown) * Math.min(1, dt * 6);
    if (Math.abs(v.followers - shown) < 1) shown = v.followers;
    els.n.textContent = fmt(shown);
    els.x2.classList.toggle('hidden', v.multiplier < 2);
    const key = v.dares.map((d) => d.done).join() + v.bonus + v.topis;
    if (key !== last) { const stamps = [...els.dares.querySelectorAll('.stamp')].map((x) => x.dataset.id); drawDares(v); for (const id of stamps) els.dares.querySelector(`[data-id="${id}"]`)?.classList.add('stamp'); }
    const st = Math.max(0, Math.min(100, sim.player.stamina ?? 100));
    els.stamina.style.width = st + '%';
    els.stamina.parentElement.classList.toggle('low', st < 25);
    const c = day.player.carrying;
    els.carry.classList.toggle('hidden', !CARRY[c]);
    if (CARRY[c]) els.carry.textContent = CARRY[c];
    if (barkT > 0 && (barkT -= dt) <= 0) els.bark.classList.remove('on');
    if (flashT > 0 && (flashT -= dt) <= 0) els.flash.classList.remove('on');
    // The player wears the topi while a constable is chasing them for it.
    const topi = day.player.chasedBy && day.memo?.chase?.data?.why === 'topi';
    if (topi && !cap && equipCap) cap = equipCap(getPlayer(), '#b8925a');
    if (cap) cap.visible = !!topi;
    reel(dt);
  }
  /** The cutaway: one at a time, each about three seconds. */
  function reel(dt) {
    if (cut && (cut.left -= dt) <= 0) cut = null;
    if (!cut && queue.length) {
      cut = { ...queue.shift(), left: CUT_SECONDS, t: 0, side: Math.random() < 0.5 ? -1 : 1 };
      els.capT.textContent = cut.title || '';
      els.capS.textContent = cut.sub || '';
      els.capN.textContent = cut.followers ? `+${fmt(cut.followers)} followers` : '';
      els.reel.classList.remove('hidden', 'in'); void els.reel.offsetWidth; els.reel.classList.add('in');
    }
    if (!cut) els.reel.classList.add('hidden');
  }

  function target() {
    if (!cut) return null;
    const b = cut.who ? bodyOf(cut.who) : null;
    if (b) return { x: b.x, z: b.z, y: b.y || 0 };
    return cut.pos ? { x: cut.pos.x, z: cut.pos.z, y: 0 } : null;
  }
  /** Second render: after the main frame, into the reel frame's rectangle. Never touches the main camera. */
  function render(dt = 1 / 60) {
    if (!cut || els.reel.classList.contains('hidden')) return;
    const p = target();
    if (!p) return;
    const r = els.reel.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return;
    cut.t += dt;
    // A slow orbit from the open street side (the CP buildings stand to the north).
    const a = -0.6 * cut.side + cut.t * 0.18 * cut.side, dist = 4.6;
    camera.position.set(p.x + Math.sin(a) * dist, p.y + 2.1, p.z - Math.cos(a) * dist);
    look.set(p.x, p.y + 1.25, p.z);
    camera.lookAt(look);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
    const R = world.renderer, h = R.domElement.clientHeight || innerHeight;
    R.getViewport(vp);
    const shadow = R.shadowMap.autoUpdate;
    R.shadowMap.autoUpdate = false;
    R.setScissorTest(true);
    R.setViewport(r.left, h - r.bottom, r.width, r.height);
    R.setScissor(r.left, h - r.bottom, r.width, r.height);
    R.render(world.scene, camera);
    R.setScissorTest(false);
    R.setViewport(vp);
    R.shadowMap.autoUpdate = shadow;
  }

  // --- the end reel ------------------------------------------------------------------------
  function readBest() { try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch { return 0; } }
  function writeBest(n) { try { localStorage.setItem(BEST_KEY, String(n)); } catch {} }
  function showEnd(day, again, fullDay) {
    const o = day.outcome || {};
    const best = readBest(), record = (o.followers || 0) > best;
    if (record) writeBest(o.followers || 0);
    cut = null; queue = [];
    if (built) { els.reel.classList.add('hidden'); root.classList.add('hidden'); }
    const moments = (o.moments || []).map((m) => `<li><time>${clock(m.t)}</time><div><b>${esc(m.did)}</b><span>${esc(m.caused)}</span></div><em>${short(m.views)} views</em></li>`).join('')
      || '<li class="none"><div><b>Kuch nahi hua.</b><span>Agli baar topi uda.</span></div></li>';
    const comments = (o.comments || []).map((c, i) => `<li><b>${HANDLES[(i + (o.followers || 0)) % HANDLES.length]}</b>${esc(c)}</li>`).join('');
    const dares = (o.dares || []).map((d) => `<span class="${d.done ? 'done' : ''}">${d.done ? '✓' : '·'} ${esc(d.id)}</span>`).join('');
    $('#screen').innerHTML = `<div class="screen-content slice-end">
      <span class="tiny">TEEN MINUTE KA REEL</span>
      <div class="se-total"><b>${fmt(o.followers || 0)}</b><small>followers</small></div>
      <p class="se-best">${record ? 'NAYA RECORD!' : `Best: ${fmt(Math.max(best, o.followers || 0))}`} <span class="se-dares">${dares}</span></p>
      <ol class="se-moments">${moments}</ol>
      <ul class="se-comments">${comments}</ul>
      <div class="buttons"><button class="primary big" id="sliceAgain">Dobara <kbd>Enter</kbd></button><button id="sliceFull">Poora din khelo</button></div>
    </div>`;
    $('#screen').classList.remove('hidden');
    $('#hud').classList.add('hidden');
    $('#sliceAgain').onclick = again;
    $('#sliceFull').onclick = fullDay;
    $('#sliceAgain').focus();
  }

  return {
    begin, cue, line, update, render, showEnd,
    /** The E prompt's words for picking something up in the slice, or null when the dares don't need it. */
    pickup: (id) => { const v = sliceView(getDay()); return v && PICKUP[id] && !v.dares.find((d) => d.id === (id === 'key' ? 'chabi' : id))?.done ? PICKUP[id] : null; },
    get active() { return !!cut; },
  };
}
