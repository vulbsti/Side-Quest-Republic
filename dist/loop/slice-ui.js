// The three-minute slice on screen: the countdown, the follower count, the mischief list with its stamps, the
// stamina bar, short barks, the picture-in-picture reel cutaway, and the end reel. The engine (slice.js via
// rules.js sliceView) decides everything; this only draws it. main.js calls in through a handful of hooks.
// The 10-minute day (dares.js via rules.js mischiefView) uses the same HUD and reel: its follower count, the
// mischief list (each dare with where it happens), the trouble that is on (director.js), and its own end reel.
//
// The cutaway is a real second render of the live scene into a small portrait viewport (renderer scissor), seen
// through a second camera that looks at whoever is reacting. It never takes the camera or the controls away.
//
// On a full day only the follower pops and the reel cutaway are used ("mini"), for the place dares (places.js),
// which pay with the same cues: their data carries `place`.

const BEST_KEY = 'sqr-slice-best', DAY_BEST_KEY = 'sqr-day-best';
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
/** The trouble on now (director.js kinds): what it asks of you, six words or fewer. */
export const TROUBLE = { topi: 'Patrol aayi. Topi uda!', cart: 'Bhagta thela! Roko: E', nikhil: 'Nikhil pakdo, megaphone chheeno: E', shak: 'Shak! Bheed mein ghus ja', reel: 'Meera ka shot: nishaan tak bhaag' };

export function createSliceUI({ THREE, world, audio, equipCap, getDay, getSim, getPlayer, bodyOf, sliceView, dayView = () => null }) {
  const $ = (s) => document.querySelector(s);
  let built = false, root, els = {}, shown = 0, last = null, cut = null, queue = [], barkT = 0, flashT = 0, cap = null;
  const camera = new THREE.PerspectiveCamera(42, 9 / 16, 0.1, 500);
  const look = new THREE.Vector3(), vp = new THREE.Vector4();
  /** The HUD's view of this day: the slice's, the 10-minute day's, or null. */
  const viewOf = (day) => (!day ? null : day.slice ? sliceView(day) : day.mischief ? dayView(day) : null);

  function build() {
    if (built) return;
    built = true;
    root = document.createElement('div');
    root.id = 'slice';
    root.innerHTML = `
      <div class="sl-top"><b class="sl-timer">3:00</b><div class="sl-fol"><b class="sl-n">0</b><small>FOLLOWERS</small><em class="sl-x2 hidden">x2 MEERA REEL</em></div></div>
      <div class="sl-pops"></div>
      <div class="sl-inc hidden"><b></b><em></em></div>
      <ol class="sl-dares"></ol>
      <div class="sl-stamina"><i></i></div>
      <div class="sl-bark"></div>
      <div class="sl-flash"></div>
      <div class="sl-carry hidden"></div>
      <div class="sl-reel hidden"><span class="rec"><i></i>REC</span><span class="sl-handle">@meera.makes.reels</span><div class="sl-cap"><b></b><span></span><em></em></div></div>`;
    $('#hud').appendChild(root);
    for (const k of ['timer', 'n', 'x2', 'pops', 'dares', 'bark', 'flash', 'carry', 'reel', 'inc']) els[k] = root.querySelector('.sl-' + k);
    els.stamina = root.querySelector('.sl-stamina i');
    els.capT = root.querySelector('.sl-cap b'); els.capS = root.querySelector('.sl-cap span'); els.capN = root.querySelector('.sl-cap em');
    els.incT = root.querySelector('.sl-inc b'); els.incN = root.querySelector('.sl-inc em');
  }

  /** A new run: called by main.js startLoop. Returns true when the day is a slice (the 10-minute day returns false). */
  function begin(day) {
    document.body.classList.toggle('slice', !!day.slice);
    document.body.classList.toggle('day10', !day.slice && !!day.mischief);
    cut = null; queue = [];
    if (!day.slice && !day.mischief) { if (root) { root.classList.add('mini'); els.pops.innerHTML = ''; els.reel.classList.add('hidden'); } return false; }
    build();
    root.classList.remove('hidden', 'mini');
    root.classList.toggle('day', !day.slice);
    shown = 0; last = null; cut = null; queue = []; barkT = 0; flashT = 0;
    els.pops.innerHTML = ''; els.reel.classList.add('hidden'); els.bark.classList.remove('on'); els.flash.classList.remove('on');
    els.inc.classList.add('hidden');
    drawDares(viewOf(day));
    return !!day.slice;
  }

  const dareKey = (v) => v.dares.map((d) => `${d.done}${d.open ? 1 : 0}${d.now ? 1 : 0}`).join() + v.bonus + v.topis;
  function drawDares(v) {
    if (v.kind === 'day') {
      const rows = v.dares.map((d) => `<li data-id="${d.id}" class="${d.done ? 'done' : ''}${!d.open && !d.done ? ' later' : ''}${d.now ? ' now' : ''}"><i></i><span>${esc(d.text)}${d.where && !d.done ? `<small>${esc(d.where)}</small>` : ''}</span><s>HO GAYA</s></li>`);
      if (v.bonus) rows.push(`<li data-id="bonus" class="bonus on"><i></i><span>${esc(v.bonusText)}</span></li>`);
      els.dares.innerHTML = `<li class="head"><b>AAJ KI SHARAARAT</b><em>LOOP ${v.loop}</em></li>` + rows.join('');
    } else {
      const rows = v.dares.map((d) => `<li data-id="${d.id}" class="${d.done ? 'done' : ''}"><i></i><span>${esc(d.text)}</span><s>HO GAYA</s></li>`);
      rows.push(`<li data-id="bonus" class="bonus ${v.bonus ? 'on' : ''}"><i></i><span>${esc(v.bonusText)}${v.topis > 1 ? ` <b>x${v.topis - (v.dares[0].done ? 1 : 0)}</b>` : ''}</span></li>`);
      els.dares.innerHTML = rows.join('');
    }
    last = dareKey(v);
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
    if (day && !viewOf(day) && d.place && c.cue.startsWith('slice:')) { build(); root.classList.remove('hidden'); root.classList.add('mini'); } // a place dare paid on the long day
    else if (!viewOf(day) || !built) return;
    if (c.cue === 'slice:followers') { pop(d.n, d.why, d.x2); audio.cue('phone-chat'); }
    else if (c.cue === 'slice:dare') {
      const li = els.dares.querySelector(`[data-id="${d.id}"]`);
      if (li) { li.classList.add('done', 'stamp'); setTimeout(() => li.classList.remove('stamp'), 900); }
      audio.cue('detainees-escape');
    } else if (c.cue === 'slice:cutaway') {
      queue.push({ ...d, pos: d.pos ?? c.pos });
      if (queue.length > 2) queue.splice(0, queue.length - 2); // never lag far behind what is happening
      audio.cue('clip-posted');
    } else if (!day.slice) return; // the long day's chase flashes stay the slice's; the day has its own toasts
    else if (c.cue === 'lunge') flash(FLASH.lunge, 'warn', 0.8);
    else if (c.cue === 'lunge-miss' && d.near) flash(FLASH.near, 'good', 1);
    else if (c.cue === 'caught') flash(FLASH.caught, 'bad', 1.4);
  }
  /** A slice line from the engine (present.js channel 'slice'). */
  function line(e) { if (e.text) bark(e.text); }

  function update(dt) {
    const day = getDay();
    if (!built) return;
    const v = viewOf(day);
    if (!v) { reel(dt); return; } // the long day: only a place dare's cutaway
    const sim = getSim();
    if (v.left != null) { els.timer.textContent = clock(Math.ceil(v.left - 1e-6)); els.timer.classList.toggle('late', v.left <= 30); }
    // The trouble on now (the 10-minute day): what it asks of you, and its clock when it has one.
    const inc = v.incident;
    const was = !els.inc.classList.contains('hidden');
    els.inc.classList.toggle('hidden', !inc);
    if (inc) {
      const c = inc.cart;
      els.incT.textContent = c?.rider ? 'Sawari! Pakde raho' : c?.stopped ? 'Ab chadh ja: E' : inc.phase === 'chase' ? 'Bhaag! Bheed mein ghus' : TROUBLE[inc.kind] ?? 'Trouble!';
      els.incN.textContent = inc.left != null ? `${Math.ceil(inc.left)}s` : '';
      if (!was) { els.inc.classList.remove('in'); void els.inc.offsetWidth; els.inc.classList.add('in'); audio.cue('crowd-gasp'); }
    }
    shown += (v.followers - shown) * Math.min(1, dt * 6);
    if (Math.abs(v.followers - shown) < 1) shown = v.followers;
    els.n.textContent = fmt(shown);
    els.x2.classList.toggle('hidden', v.multiplier < 2);
    const key = dareKey(v);
    if (key !== last) { const stamps = [...els.dares.querySelectorAll('.stamp')].map((x) => x.dataset.id); drawDares(v); for (const id of stamps) els.dares.querySelector(`[data-id="${id}"]`)?.classList.add('stamp'); }
    const st = Math.max(0, Math.min(100, sim.player.stamina ?? 100));
    els.stamina.style.width = st + '%';
    els.stamina.parentElement.classList.toggle('low', st < 25);
    const c = day.slice ? day.player.carrying : null;
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
  function readBest(k = BEST_KEY) { try { return Number(localStorage.getItem(k)) || 0; } catch { return 0; } }
  function writeBest(n, k = BEST_KEY) { try { localStorage.setItem(k, String(n)); } catch {} }
  /** The slice: showEnd(day, again, fullDay). The 10-minute day: showEnd(day, { again, card, board }). */
  function showEnd(day, again, fullDay) {
    if (day.mischief && again && typeof again === 'object') return showDayEnd(day, again);
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
      <div class="buttons"><button class="primary big" id="sliceAgain">Dobara <kbd>Enter</kbd></button><button id="sliceFull">The day (10 min)</button></div>
    </div>`;
    $('#screen').classList.remove('hidden');
    $('#hud').classList.add('hidden');
    $('#sliceAgain').onclick = again;
    $('#sliceFull').onclick = fullDay;
    $('#sliceAgain').focus();
  }

  // A moment's time on the 10-minute day, as the clock read then (10:00, 1.25 s a game minute).
  const clockOfDay = (t) => { const m = 600 + Math.floor(t / 1.25); return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`; };
  /**
   * The 10-minute day's end reel: the ending's headline and your role in a line each, followers and best, the list
   * with its stamps, the moments with what each caused and its views, three comments. Buttons: Dobara, the old
   * ending card (endings seen, links learned: main.js draws it), and the chaos board.
   */
  function showDayEnd(day, { again, card, board }) {
    const r = day.mischief.reel || { followers: day.mischief.followers, moments: [], comments: [], dares: [], loop: day.mischief.loop };
    const n = r.followers || 0, best = readBest(DAY_BEST_KEY), record = n > best;
    if (record) writeBest(n, DAY_BEST_KEY);
    cut = null; queue = [];
    if (built) { els.reel.classList.add('hidden'); root.classList.add('hidden'); }
    const moments = (r.moments || []).map((m) => `<li><time>${clockOfDay(m.t)}</time><div><b>${esc(m.did)}</b><span>${esc(m.caused)}</span></div><em>${short(m.views)} views</em></li>`).join('')
      || '<li class="none"><div><b>Kuch nahi hua.</b><span>Kal topi se shuru kar.</span></div></li>';
    const comments = (r.comments || []).map((c, i) => `<li><b>${HANDLES[(i + n) % HANDLES.length]}</b>${esc(c)}</li>`).join('');
    const dares = (r.dares || []).map((d) => `<span class="${d.done ? 'done' : ''}">${d.done ? '✓' : '·'} ${esc(String(d.text).replace(/\.$/, ''))}</span>`).join('');
    $('#screen').innerHTML = `<div class="screen-content slice-end day-end">
      <span class="tiny">DUS MINUTE KA REEL · LOOP ${r.loop ?? 1}</span>
      ${r.headline ? `<p class="de-line de-headline">${esc(r.headline)}</p>` : ''}
      ${r.role ? `<p class="de-line de-role">${esc(r.role)}</p>` : ''}
      <div class="se-total"><b>${fmt(n)}</b><small>followers</small></div>
      <p class="se-best">${record ? 'NAYA RECORD!' : `Best: ${fmt(Math.max(best, n))}`}</p>
      <div class="de-dares">${dares}</div>
      <ol class="se-moments">${moments}</ol>
      <ul class="se-comments">${comments}</ul>
      <div class="buttons"><button class="primary big" id="sliceAgain">Dobara <kbd>Enter</kbd></button><button id="dayCard">Poora hisaab</button><button id="dayBoard">Chaos board</button></div>
    </div>`;
    $('#screen').classList.remove('hidden');
    $('#hud').classList.add('hidden');
    $('#sliceAgain').onclick = again;
    $('#dayCard').onclick = card;
    $('#dayBoard').onclick = board;
    $('#sliceAgain').focus();
  }

  return {
    begin, cue, line, update, render, showEnd,
    /** The E prompt's words for picking something up in the slice, or null when the dares don't need it. */
    pickup: (id) => { const day = getDay(); if (!day?.slice) return null; const v = sliceView(day); return v && PICKUP[id] && !v.dares.find((d) => d.id === (id === 'key' ? 'chabi' : id))?.done ? PICKUP[id] : null; },
    get active() { return !!cut; },
  };
}
