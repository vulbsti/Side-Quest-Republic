// The in-game phone: the "Jantar Updates 🔥" group chat, a feed of reels and a satirical ticker.
// Opens with P or the phone button; a small pill announces anything new without opening it.
// Content arrives through chat() / feed() / ticker() / live(); this file owns only the UI.

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const TABS = ['chat', 'feed', 'ticker'];
const TAB_NAME = { chat: 'Chat', feed: 'Feed', ticker: 'Ticker' };
const WHO_COLOR = { kabir: '#ffd34d', nikhil: '#8fd3ff', meera: '#ff9cc4', zoya: '#9be59b', you: '#e5ff86', player: '#e5ff86' };
const THUMB = ['#3b2a4f', '#21424a', '#4a2b22', '#2a3d24', '#3d3420', '#1f2f4a'];

/**
 * createPhone(root, pill, { clock, nameOf, onChange })
 *  root: the #phone element; pill: the #phonePill element
 *  clock(): current clock text; nameOf(id): display name for chat senders
 */
export function createPhone(root, pill, { clock = () => '', nameOf = (id) => id, onChange = () => {} } = {}) {
  root.innerHTML = `
    <div class="ph-status"><span class="ph-clock"></span><span class="ph-net">4G ▮▮▮▯ 23%</span></div>
    <div class="ph-tabs" role="tablist">${TABS.map((t) => `<button role="tab" data-tab="${t}">${TAB_NAME[t]}<i></i></button>`).join('')}</div>
    <div class="ph-live hidden"><b>● LIVE</b><span class="ph-live-who">Zoya</span><span class="ph-live-n"></span><p></p></div>
    <div class="ph-body" data-body="chat"><div class="ph-group"><b>Jantar Updates 🔥</b><small>Kabir, Nikhil, Meera, Zoya, You</small></div><ol class="ph-chat"></ol></div>
    <div class="ph-body" data-body="feed"><ol class="ph-feed"></ol></div>
    <div class="ph-body" data-body="ticker"><div class="ph-marquee"><span></span></div><ol class="ph-ticker"></ol></div>
    <div class="ph-foot"><kbd>P</kbd> close · <kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> tabs</div>`;
  const $ = (q) => root.querySelector(q);
  const lists = { chat: $('.ph-chat'), feed: $('.ph-feed'), ticker: $('.ph-ticker') };
  const unread = { chat: 0, feed: 0, ticker: 0 };
  let tab = 'chat', open = false, pillTimer = 0, pillTab = 'chat', views = 1200;

  for (const b of root.querySelectorAll('[data-tab]')) b.onclick = () => setTab(b.dataset.tab);
  pill.onclick = () => { setTab(pillTab); setOpen(true); };

  function setTab(t) {
    if (!TABS.includes(t)) return;
    tab = t;
    for (const b of root.querySelectorAll('[data-tab]')) b.classList.toggle('on', b.dataset.tab === t);
    for (const b of root.querySelectorAll('[data-body]')) b.classList.toggle('hidden', b.dataset.body !== t);
    if (open) { unread[t] = 0; render(); }
  }
  function setOpen(v) {
    open = v;
    root.classList.toggle('hidden', !open);
    if (open) { unread[tab] = 0; pillTimer = 0; }
    render(); onChange(open);
  }
  function render() {
    for (const b of root.querySelectorAll('[data-tab]')) { const n = unread[b.dataset.tab]; b.querySelector('i').textContent = n ? n : ''; }
    const total = unread.chat + unread.feed + unread.ticker;
    pill.classList.toggle('hidden', open || (!total && pillTimer <= 0));
    pill.classList.toggle('fresh', pillTimer > 0);
    pill.querySelector('.pill-n').textContent = total ? total : '';
  }
  function add(t, li, previewText) {
    const list = lists[t];
    if (t === 'chat') list.append(li); else list.prepend(li);
    while (list.children.length > 60) (t === 'chat' ? list.firstElementChild : list.lastElementChild).remove();
    if (t === 'chat') list.parentElement.scrollTop = 1e6;
    if (!open || tab !== t) {
      unread[t]++;
      pillTab = t;
      pill.querySelector('.pill-text').textContent = previewText;
      pillTimer = 5;
    }
    render();
  }

  /** A group-chat message. who: friend id, 'you', or a name. */
  function chat(who, text) {
    const name = who === 'you' || who === 'player' ? 'You' : nameOf(who);
    const li = document.createElement('li');
    li.className = who === 'you' || who === 'player' ? 'me' : '';
    li.innerHTML = `<b style="color:${WHO_COLOR[who] || '#cfe6d2'}">${esc(name)}</b><span>${esc(text)}</span><small>${esc(clock())}</small>`;
    add('chat', li, `${name}: ${text}`);
  }
  /** A reel on the feed. { caption, by, kind, mine, real, later, place } */
  function feed(clip) {
    views = Math.round(views * 1.37 + 311);
    const n = clip.views ?? views;
    const li = document.createElement('li');
    li.className = (clip.mine ? 'mine ' : '') + (clip.later ? 'later' : '');
    const label = String(clip.kind || 'reel').replace(/-/g, ' ').toUpperCase();
    const hue = THUMB[(label.length * 7) % THUMB.length];
    li.innerHTML = `<div class="th" style="background:linear-gradient(160deg,${hue},#0d1714)"><span>${esc(label)}</span>${clip.mine ? '<em>YOUR CLIP</em>' : ''}${clip.later ? '<em class="re">REPOSTED</em>' : ''}</div>
      <div class="meta"><b>@${esc(clip.by || 'jantar.mantar.memes')}</b>${clip.real ? `<i>${esc(clip.realLabel || 'inspired by a real reel')}</i>` : ''}
      <p>${esc(clip.caption || '')}</p><small>${esc(clip.place || '')}${clip.place ? ' · ' : ''}${esc(clock())} · ${n >= 1000 ? (n / 1000).toFixed(1) + 'k' : n} views</small>${clip.comments?.length ? `<q>${esc(clip.comments[0])}</q>` : ''}</div>`;
    add('feed', li, `${clip.mine ? 'Your clip' : '@' + (clip.by || 'reel')}: ${clip.caption || label}`);
  }
  /** A satirical ticker headline. */
  function ticker(text) {
    const li = document.createElement('li');
    li.innerHTML = `<small>${esc(clock())}</small>${esc(text)}`;
    add('ticker', li, `Ticker: ${text}`);
    $('.ph-marquee span').textContent = text;
  }
  /** Zoya's live stream card on top of the phone. */
  function live({ on, text, viewers, who = 'Zoya' }) {
    const box = $('.ph-live');
    box.classList.toggle('hidden', !on && !text);
    box.classList.toggle('off', !on);
    $('.ph-live-who').textContent = who;
    const v = Math.round(viewers || 0);
    $('.ph-live-n').textContent = on ? `${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v} watching` : 'offline';
    if (text !== undefined) box.querySelector('p').textContent = text;
  }
  function update(dt) {
    root.querySelector('.ph-clock').textContent = clock();
    if (pillTimer > 0) { pillTimer -= dt; if (pillTimer <= 0) render(); }
  }
  function reset() {
    for (const l of Object.values(lists)) l.replaceChildren();
    for (const k of TABS) unread[k] = 0;
    views = 1200; pillTimer = 0; live({ on: false, text: '' }); $('.ph-live').classList.add('hidden');
    render();
  }
  setTab('chat');
  render();
  return {
    chat, feed, ticker, live, update, reset, setTab,
    toggle: () => setOpen(!open), open: () => setOpen(true), close: () => setOpen(false),
    get isOpen() { return open; },
    get tab() { return tab; },
  };
}
