// Read-only Instagram harvesting helpers, pasted into a logged-in instagram.com tab.
// Results accumulate in localStorage and leave the browser only via sqrExport(),
// which saves a JSON file to ~/Downloads. Commenter handles are never stored.
window.sqr = {
  load(k) { try { return JSON.parse(localStorage.getItem(k) || '{}'); } catch { return {}; } },
  save(k, v) { localStorage.setItem(k, JSON.stringify(v)); },
  sleep: ms => new Promise(r => setTimeout(r, ms)),

  // Collect reel/post links from the current grid/search page, scrolling `scrolls` times.
  async harvest(source, scrolls = 4) {
    const c = this.load('sqr_cands');
    let added = 0;
    for (let i = 0; i <= scrolls; i++) {
      for (const a of document.querySelectorAll('a[href*="/reel/"], a[href*="/p/"]')) {
        const m = a.getAttribute('href').match(/\/(reel|p)\/([A-Za-z0-9_-]+)/);
        if (!m) continue;
        const code = m[2];
        const owner = (a.getAttribute('href').match(/^\/([^/]+)\/(reel|p)\//) || [])[1] || null;
        const img = a.querySelector('img');
        if (!c[code]) { c[code] = { code, kind: m[1], found_via: [], seen_at: new Date().toISOString() }; added++; }
        const e = c[code];
        if (!e.found_via.includes(source)) e.found_via.push(source);
        if (owner && !e.publisher) e.publisher = owner;
        if (img && img.alt && !e.alt) e.alt = img.alt.slice(0, 600);
        const overlay = a.innerText.trim().replace(/\s+/g, ' ');
        if (overlay && !e.grid_counts) e.grid_counts = overlay.slice(0, 60);
      }
      if (i < scrolls) { window.scrollBy(0, window.innerHeight * 2); await this.sleep(2500 + Math.random() * 2000); }
    }
    this.save('sqr_cands', c);
    return { source, added, total: Object.keys(c).length, pageTitle: document.title, url: location.pathname };
  },

  // On an open reel page: caption, counts, date and top comments (text + likes, no handles).
  async detail(code, scrolls = 4) {
    const d = this.load('sqr_detail');
    const main = document.querySelector('main') || document.body;
    const time = main.querySelector('time');
    // Scroll the comment list to load more.
    const scroller = [...main.querySelectorAll('div')].find(el => el.scrollHeight > el.clientHeight + 200 && getComputedStyle(el).overflowY.match(/auto|scroll/));
    for (let i = 0; i < scrolls && scroller; i++) { scroller.scrollTop = scroller.scrollHeight; await this.sleep(2000 + Math.random() * 1500); }
    const text = main.innerText;
    const comments = [];
    const scrub = t => t.replace(/@[A-Za-z0-9._]+/g, '@user');
    const isAge = l => /^\d+\s*[hdwmy]$/.test(l) || /^\d+\s*(min|sec)/.test(l);
    // Comment blocks render as: handle / age / text / "N likes" / Reply. Parse loosely from lines.
    const lines = text.split('\n').map(s => s.trim()).filter(Boolean);
    for (let i = 0; i < lines.length; i++) {
      if (/^Reply$/.test(lines[i])) {
        let j = i - 1, likes = 0;
        if (/^[\d,.]+[KkM]? likes?$/.test(lines[j])) { likes = lines[j]; j--; }
        const body = lines[j];
        if (body && !/^\d+\s*[hdwmy]$/.test(body)) comments.push({ text: scrub(body).slice(0, 500), likes });
      }
    }
    // Footer reads: <likes> / <comments> / <shares> / <date> / "More posts from ..."
    const mp = lines.findIndex(l => l.startsWith('More posts from'));
    const footer = mp > 3 ? lines.slice(mp - 4, mp) : [];
    d[code] = {
      code, url: location.href, seen_at: new Date().toISOString(),
      posted: time ? time.getAttribute('datetime') : null,
      // /p/<code>/ URLs carry no handle; the page header's first line is the publishing account.
      publisher: (location.pathname.match(/^\/([^/]+)\/(?:reel|p)\//) || [])[1] || (/^[A-Za-z0-9._]+$/.test(lines[0] || '') ? lines[0] : null),
      // Caption block = lines before the second age marker, minus the handle that precedes it.
      caption: (() => { const ages = lines.map((l, k) => isAge(l) ? k : -1).filter(k => k >= 0);
        const end = ages.length > 1 ? ages[1] - 1 : Math.min(lines.length, 10);
        return scrub(lines.slice(ages[0] + 1 || 0, end).filter(l => l !== 'See translation').join(' ')).slice(0, 1500); })(),
      stats: footer.length ? { likes: footer[0], comments: footer[1], shares: footer[2], date_shown: footer[3] } : null,
      comments: comments.slice(0, 30),
      raw_len: text.length,
    };
    this.save('sqr_detail', d);
    return { code, comments: d[code].comments.length, hasCaption: !!d[code].caption };
  },

  // Queue: open the next candidate that has no detail record yet. Navigation ends this script,
  // so the caller waits for the page, re-defines sqr and runs detailHere().
  goNext(prefix = '') {
    const c = this.load('sqr_cands'), d = this.load('sqr_detail'), skip = this.load('sqr_skip');
    // Likely protest footage first; the game dev's own account last.
    const order = ['tag:', 'profile:indiebuzzofficial', 'profile:smitasharmajournalist', 'profile:peeinghuman'];
    const rank = e => Math.min(...e.found_via.map(s => { const i = order.findIndex(o => s.startsWith(o)); return i < 0 ? order.length : i; }));
    const todo = Object.values(c).filter(e => !d[e.code] && !skip[e.code] && e.found_via.some(s => s.startsWith(prefix)))
      .sort((a, b) => rank(a) - rank(b));
    if (!todo.length) return { remaining: 0 };
    location.href = `/p/${todo[0].code}/`;  // /reel/ redirects to the immersive viewer; /p/ keeps the comment panel
    return { remaining: todo.length - 1 };
  },

  async detailHere() {
    const code = (location.pathname.match(/\/(?:reel|p)\/([A-Za-z0-9_-]+)/) || [])[1];
    if (!code) return { error: 'not a reel page', path: location.pathname.slice(0, 40) };
    if (/couldn't load|isn't available|Sorry, this page/i.test(document.body.innerText.slice(0, 400))) {
      const s = this.load('sqr_skip'); s[code] = 'unavailable'; this.save('sqr_skip', s);
      return { skipped: true };
    }
    return this.detail(code);
  },

  // One call per reel for an unattended loop: record the current reel (if any), pause, open the next.
  // Exports every `every` new records so a crash loses little.
  async step(pauseMs = 3000, every = 20) {
    let rec = null;
    if (/\/(reel|p)\//.test(location.pathname)) { await this.sleep(4000); rec = await this.detailHere(); }
    const n = Object.keys(this.load('sqr_detail')).length;
    let exported = null;
    if (rec && !rec.skipped && n % every === 0) exported = this.exportAll('detail-' + n);
    await this.sleep(pauseMs + Math.random() * 2000);  // main pacing is the caller waiting 25-40 s between steps
    const next = this.goNext('');
    return { rec, detail: n, exported, remaining: next.remaining };
  },

  stats() { return { cands: Object.keys(this.load('sqr_cands')).length, detail: Object.keys(this.load('sqr_detail')).length }; },

  exportAll(name) {
    const blob = new Blob([JSON.stringify({ exported_at: new Date().toISOString(), account: 'resmods (read-only)', cands: this.load('sqr_cands'), detail: this.load('sqr_detail') }, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `sqr-candidates-${name}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    return 'exported ' + a.download;
  },
};
'sqr helpers loaded';

// Bootstrap (Instagram's CSP blocks eval, but allows blob: scripts). After storing this file's text in
// localStorage.sqr_src once, each page can load the helpers with:
//   if (!window.sqr) { const s = document.createElement('script');
//     s.src = URL.createObjectURL(new Blob([localStorage.getItem('sqr_src')], { type: 'text/javascript' }));
//     await new Promise(r => { s.onload = r; document.head.append(s); }); }
