// The travel panel (M) and the hop's transition card. The engine decides everything (travel.js through rules.js:
// travelBoard, act 'travel'); this file draws a stylised map with the destinations as pins, one live line per place,
// and the 1.2 s wipe with a joke card, then hands the arrival back to main.js (move the body, snap the camera).
// main.js wires it with a few callbacks, so the 3D client keeps one path for commands (its recorded act()).
import { MAP } from '../map/delhi-map.js?v=1';

const SVGNS = 'http://www.w3.org/2000/svg';
const WIPE = { cover: 0.35, hold: 0.5, out: 0.35 }; // seconds: in, card, out (1.2 s in all)
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
// Jantar Mantar's three pins sit close together: their names go beside them, not on top of each other.
const LABEL = { parliament: { x: -22, y: 4.5, a: 'end' }, barricade: { x: 22, y: 4.5, a: 'start' }, stage: { x: 22, y: 10, a: 'start' } };

/**
 * deps: {
 *   R              the engine module (travelBoard, DESTINATIONS, MODES)
 *   day()          the engine's day
 *   player()       the drawn player { x, z }
 *   act(cmd)       main.js's recorded act
 *   pause(on)      stop the world while the panel or the card is up
 *   arrive(dest, r)  after an accepted hop: put the body where the engine has the player, face dest.look, snap the camera
 *   toast(text)
 * }
 */
export function createTravelUI(deps) {
  const { R } = deps;
  const D = R.DESTINATIONS;
  const ids = Object.keys(D);
  // The map's frame: the extent of the destinations with a margin, x east and z south (as the game).
  const pad = 70;
  const xs = ids.map((i) => D[i].x), zs = ids.map((i) => D[i].z);
  const box = { x0: Math.min(...xs) - pad, x1: Math.max(...xs) + pad, z0: Math.min(...zs) - pad, z1: Math.max(...zs) + pad };
  const W = box.x1 - box.x0, H = box.z1 - box.z0;

  const root = document.createElement('div');
  root.id = 'travel';
  root.className = 'hidden';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', 'Travel');
  root.innerHTML = `<div class="tv-inner">
    <header><div><span class="tiny">SEEDHA WAHAN</span><h2>Kahan chalein?</h2></div><span class="tv-clock"></span><button class="tv-close">Wapas <kbd>M</kbd></button></header>
    <div class="tv-body"><div class="tv-map"></div><ol class="tv-list"></ol></div>
    <p class="fine tv-foot">Har hop ${R.TRAVEL_MINUTES} min ka. Number ya click se jao, <kbd>↑</kbd><kbd>↓</kbd> <kbd>Enter</kbd>. Peeche wale saath aate hain.</p>
  </div>`;
  document.body.appendChild(root);
  const wipe = document.createElement('div');
  wipe.id = 'travelWipe';
  wipe.className = 'hidden';
  wipe.innerHTML = '<div class="tw-card"><small></small><b></b><em></em></div>';
  document.body.appendChild(wipe);

  // --- the stylised map: the car roads from OpenStreetMap, the parks, the pins -------------------
  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('viewBox', `${box.x0} ${box.z0} ${W} ${H}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  const el = (name, attrs, parent = svg) => { const e = document.createElementNS(SVGNS, name); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); parent.appendChild(e); return e; };
  const inBox = (p) => p[0] > box.x0 - 40 && p[0] < box.x1 + 40 && p[1] > box.z0 - 40 && p[1] < box.z1 + 40;
  for (const a of MAP.areas || []) if (a.kind === 'grass' && a.poly.some(inBox)) el('polygon', { points: a.poly.map((p) => p.join(',')).join(' '), class: 'tv-park' });
  for (const r of MAP.roads || []) {
    if (!r.car || !r.pts.some(inBox)) continue;
    el('polyline', { points: r.pts.map((p) => p.join(',')).join(' '), class: r.w >= 9 ? 'tv-road big' : 'tv-road' });
  }
  const pins = {};
  ids.forEach((id, i) => {
    const d = D[id], g = el('g', { class: 'tv-pin', 'data-id': id, transform: `translate(${d.x} ${d.z})` });
    el('circle', { r: 13, class: 'tv-dot' }, g);
    const t = el('text', { y: 4.5, 'text-anchor': 'middle', class: 'tv-num' }, g);
    t.textContent = KEYS[i] ?? '·';
    const L = LABEL[id] ?? { x: 0, y: -19, a: 'middle' };
    const lab = el('text', { x: L.x, y: L.y, 'text-anchor': L.a, class: 'tv-lab' }, g);
    lab.textContent = d.name.split(/[,·]/)[0].trim();
    g.addEventListener('click', () => go(id));
    pins[id] = g;
  });
  const me = el('g', { class: 'tv-me' });
  el('circle', { r: 9 }, me);
  el('circle', { r: 20, class: 'tv-me-ring' }, me);
  root.querySelector('.tv-map').appendChild(svg);

  const list = root.querySelector('.tv-list');
  root.querySelector('.tv-close').onclick = () => close();
  let open = false, sel = 0, rows = [], board = [], busy = false, suggest = null;

  function render() {
    board = R.travelBoard(deps.day());
    const byId = Object.fromEntries(board.map((b) => [b.id, b]));
    list.innerHTML = '';
    rows = ids.map((id, i) => {
      const b = byId[id];
      const li = document.createElement('li');
      li.className = `tv-row heat${b.heat}${b.ok ? '' : ' off'}${id === suggest ? ' hop' : ''}`;
      li.innerHTML = `<kbd>${KEYS[i] ?? '·'}</kbd><div><b></b><small></small><span></span></div><em></em>`;
      li.querySelector('b').textContent = b.name;
      li.querySelector('small').textContent = `${R.MODES[b.mode]}${b.held ? ' · line ke bahar tak' : ''}`;
      li.querySelector('span').textContent = b.ok ? b.text : b.why;
      li.querySelector('em').textContent = b.d >= 1000 ? `${(b.d / 1000).toFixed(1)} km` : `${b.d} m`;
      li.addEventListener('click', () => go(id));
      li.addEventListener('pointerenter', () => { sel = i; mark(); });
      list.appendChild(li);
      pins[id].setAttribute('class', `tv-pin heat${b.heat}${b.ok ? '' : ' off'}${id === suggest ? ' hop' : ''}`);
      return li;
    });
    const p = deps.player();
    me.setAttribute('transform', `translate(${p.x} ${p.z})`);
    root.querySelector('.tv-clock').textContent = R.clockText(deps.day().t);
    mark();
  }
  function mark() {
    rows.forEach((r, i) => r.classList.toggle('sel', i === sel));
    ids.forEach((id, i) => pins[id].classList.toggle('sel', i === sel));
    rows[sel]?.scrollIntoView?.({ block: 'nearest' });
  }

  /** M: open the panel (with the objective card's hop picked), or say why not. */
  function show(hop = null) {
    if (busy) return;
    const s = deps.day();
    const b = R.travelBoard(s);
    if (b.every((x) => !x.ok)) {
      // Busy (chased, in a conversation, on the bus...): the engine says why, through the screen like any line.
      deps.act({ type: 'travel', to: hop?.to ?? ids.find((id) => id !== b.find((x) => x.d < 12)?.id) ?? ids[0] });
      return;
    }
    suggest = hop?.to ?? null;
    sel = Math.max(0, suggest ? ids.indexOf(suggest) : ids.findIndex((id) => b.find((x) => x.id === id).ok));
    open = true;
    deps.pause(true);
    root.classList.remove('hidden');
    render();
  }
  function close() {
    if (!open) return;
    open = false;
    root.classList.add('hidden');
    deps.pause(false);
  }

  /** Go: the card wipes in, the engine moves you (and runs the clock on), the card wipes out on the new place. */
  function go(id) {
    if (busy) return;
    const b = board.find((x) => x.id === id);
    if (!b) return;
    if (!b.ok) { deps.toast(b.why); return; } // the panel already shows why; clicking a grey row just repeats it
    busy = true;
    root.classList.add('hidden');
    open = false;
    deps.pause(true);
    wipe.querySelector('small').textContent = R.MODES[b.mode].toUpperCase();
    wipe.querySelector('b').textContent = b.name;
    wipe.querySelector('em').textContent = b.card;
    wipe.className = 'in';
    setTimeout(() => {
      const r = deps.act({ type: 'travel', to: id });
      if (r?.ok) deps.arrive(D[id], r);
      wipe.className = 'hold';
      setTimeout(() => {
        wipe.className = 'out';
        deps.pause(false);
        setTimeout(() => { wipe.className = 'hidden'; busy = false; }, WIPE.out * 1000);
      }, WIPE.hold * 1000);
    }, WIPE.cover * 1000);
  }

  // The panel's own keys (main.js doesn't take keys while the world is paused for it).
  addEventListener('keydown', (e) => {
    if (!open) return;
    const k = e.key.toLowerCase();
    e.stopImmediatePropagation();
    if (k === 'escape' || k === 'm') { e.preventDefault(); close(); return; }
    if (k === 'arrowdown' || k === 's') { e.preventDefault(); sel = (sel + 1) % ids.length; mark(); return; }
    if (k === 'arrowup' || k === 'w') { e.preventDefault(); sel = (sel + ids.length - 1) % ids.length; mark(); return; }
    if (k === 'enter' || k === ' ' || k === 'e') { e.preventDefault(); go(ids[sel]); return; }
    const i = KEYS.indexOf(k);
    if (i >= 0 && ids[i]) { e.preventDefault(); go(ids[i]); }
  }, true);

  // A hint on the objective card when what it points at is far: "M: seedha wahan".
  const hintEl = document.createElement('span');
  hintEl.id = 'objHop';
  hintEl.className = 'hidden';
  hintEl.innerHTML = ' · <kbd>M</kbd> seedha wahan';
  document.querySelector('#objective small')?.appendChild(hintEl); // on the NEARBY line, so the card doesn't grow
  let hintFor = null;
  function hint(o) {
    hintFor = o?.hop ?? null;
    hintEl.classList.toggle('hidden', !hintFor);
    if (hintFor) hintEl.title = hintFor.name;
  }

  return {
    get isOpen() { return open; },
    get busy() { return busy; },
    /** M pressed (or the touch button): open, or close if open. */
    toggle() { if (open) close(); else show(hintFor); },
    close,
    hint,
    /** Keep the live lines fresh while it's open (cheap: one board a second). */
    update: (() => { let t = 0; return (dt) => { if (open && (t -= dt) <= 0) { t = 1; render(); } }; })(),
  };
}
