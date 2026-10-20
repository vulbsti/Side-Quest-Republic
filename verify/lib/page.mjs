// verify/out/map.html: the system map as a page. Every rule with what can set it off and what it leads to,
// every verb with what it touches, every cue with who draws it, coloured by what the last run reached.
const esc = (x) => String(x ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function renderMapPage({ map, edges, coverage, hits, properties, metrics, findings }) {
  const into = {}, out = {};
  for (const e of edges) { (into[e.to] ??= new Map()).set(e.from, [...(into[e.to].get(e.from) || []), e.via]); (out[e.from] ??= new Set()).add(e.to); }
  const name = (label) => label.replace(/^rule:/, '').replace(/^verb:/, 'you: ').replace(/^routine:(\d\d:\d\d)#\d+/, '$1');
  const chip = (ok) => `<span class="chip ${ok ? 'ok' : 'no'}">${ok ? 'reached' : 'never'}</span>`;
  const rules = map.rules.map((r) => {
    const label = 'rule:' + r.id, from = [...(into[label] || new Map())];
    const a = map.access?.[label] || { reads: [], writes: [] };
    return `<tr class="${hits.has(label) ? '' : 'dim'}"><td><b>${esc(r.id)}</b><br>${chip(hits.has(label))}</td>
      <td>${from.filter(([f]) => f.startsWith('verb:')).map(([f]) => `<span class="you">${esc(name(f))}</span>`).join(' ')}
          ${from.filter(([f]) => f.startsWith('routine:')).map(([f]) => `<span class="clock">${esc(name(f))}</span>`).join(' ')}
          ${from.filter(([f]) => f.startsWith('rule:')).map(([f]) => `<a href="#${esc(f.slice(5))}">${esc(name(f))}</a>`).join(' ')}</td>
      <td class="small">${esc(a.reads.join(', '))}</td><td class="small">${esc(a.writes.join(', '))}</td>
      <td>${[...(out[label] || [])].map((t) => `<a href="#${esc(t.slice(5))}">${esc(name(t))}</a>`).join(' ')}</td></tr>`.replace('<tr', `<tr id="${esc(r.id)}"`);
  }).join('');
  const verbs = Object.entries(map.access || {}).filter(([k]) => k.startsWith('verb:')).map(([k, a]) => `<tr><td><b>${esc(k.slice(5))}</b></td><td class="small">${esc(a.writes.join(', '))}</td><td>${[...(out[k] || [])].map((t) => `<a href="#${esc(t.slice(5))}">${esc(name(t))}</a>`).join(' ')}</td></tr>`).join('');
  const routines = map.routines.map((r) => `<tr><td class="clock">${esc(r.at)}</td><td class="small">${esc(r.does)}</td><td>${[...(out[r.id] || [])].map((t) => `<a href="#${esc(t.slice(5))}">${esc(name(t))}</a>`).join(' ')}</td></tr>`).join('');
  const cues = map.cues.map((c) => `<tr class="${hits.has('cue:' + c.id) ? '' : 'dim'}"><td>${esc(c.id)}</td><td>${chip(hits.has('cue:' + c.id))}</td><td class="small">${esc(c.handledBy.join(', ') || 'NOTHING DRAWS IT')}</td></tr>`).join('');
  const cov = Object.values(coverage).map((c) => `<tr><td>${esc(c.label)}</td><td>${c.reached} / ${c.total}</td><td class="small">${esc(c.missing.join(', '))}</td></tr>`).join('');
  const props = properties.map((p) => `<tr><td>${esc(p.text)}</td><td>${p.ok ? '<span class="chip ok">holds</span>' : `<span class="chip no">fails ×${p.fails}</span>`}</td><td class="small">${esc(p.example?.msg || '')}</td></tr>`).join('');
  const mets = metrics.map((m) => `<tr><td>${esc(m.text)}</td><td>${esc(m.shown)}</td><td>${esc(m.targetShown)}</td><td>${m.ok ? '<span class="chip ok">met</span>' : '<span class="chip no">missed</span>'}</td></tr>`).join('');
  const talk = Object.entries(map.talk).map(([who, t]) => `<tr><td>${esc(who)}</td><td>${t.lines}</td><td>${t.again}</td><td class="small">${esc(t.statesWithLines.join(', '))}</td><td class="small">${esc(t.states.filter((x) => !t.statesWithLines.includes(x)).join(', '))}</td></tr>`).join('');
  const lint = findings.filter((f) => f.level !== 'info').map((f) => `<li><span class="chip ${f.level === 'error' ? 'no' : 'warn'}">${f.level}</span> ${esc(f.msg)}</li>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>System map</title><style>
:root{--bg:#fbfaf7;--fg:#1d1c1a;--mute:#6b6862;--line:#e3e0d9;--ok:#2f7d4f;--no:#b23b2e;--warn:#9a6a00;--you:#2557a7;--clock:#6b4fa0}
@media (prefers-color-scheme:dark){:root{--bg:#181715;--fg:#ecebe7;--mute:#a19e97;--line:#34322e;--ok:#5fbf86;--no:#ef7a6c;--warn:#e0b04a;--you:#7ea8ef;--clock:#b79be6}}
body{background:var(--bg);color:var(--fg);font:15px/1.45 system-ui,sans-serif;margin:0;padding:24px 16px;max-width:1200px;margin:auto}
h1{font-size:24px;margin:0 0 4px}h2{font-size:18px;margin:32px 0 8px}p{color:var(--mute);margin:0 0 12px}
table{border-collapse:collapse;width:100%;font-size:13px}td,th{border-bottom:1px solid var(--line);padding:6px 8px;text-align:left;vertical-align:top}
th{color:var(--mute);font-weight:600}.small{font-size:12px;color:var(--mute);max-width:320px;word-break:break-word}.dim td{opacity:.6}
.chip{display:inline-block;border-radius:9px;padding:0 7px;font-size:11px;font-weight:600;border:1px solid}.ok{color:var(--ok)}.no{color:var(--no)}.warn{color:var(--warn)}
.you{color:var(--you)}.clock{color:var(--clock)}a{color:inherit}.wrap{overflow-x:auto}ul{padding-left:18px}
</style></head><body>
<h1>Side Quest Republic: system map</h1>
<p>Generated by <code>npm run verify</code> from the code itself. A rule fires when the state it reads changes; "set off by" lists the verbs (<span class="you">blue</span>), timed routines (<span class="clock">purple</span>) and other rules that write that state.</p>
<h2>Properties</h2><div class="wrap"><table><tr><th>Property</th><th></th><th>Example</th></tr>${props}</table></div>
<h2>Experience targets</h2><div class="wrap"><table><tr><th>What</th><th>Now</th><th>Target</th><th></th></tr>${mets}</table></div>
<h2>Coverage</h2><div class="wrap"><table><tr><th>Content</th><th>Reached</th><th>Never reached</th></tr>${cov}</table></div>
<h2>Rules: cause and effect</h2><div class="wrap"><table><tr><th>Rule</th><th>Set off by</th><th>Reads</th><th>Writes</th><th>Can set off</th></tr>${rules}</table></div>
<h2>Verbs: what the player can do</h2><div class="wrap"><table><tr><th>Verb</th><th>Writes</th><th>Can set off</th></tr>${verbs}</table></div>
<h2>The clock: timed routines</h2><div class="wrap"><table><tr><th>At</th><th>Does</th><th>Can set off</th></tr>${routines}</table></div>
<h2>Cues: engine to screen</h2><div class="wrap"><table><tr><th>Cue</th><th></th><th>Drawn by</th></tr>${cues}</table></div>
<h2>Talk</h2><div class="wrap"><table><tr><th>Person</th><th>Lines</th><th>"Again" lines</th><th>Situations with lines</th><th>Situations with none</th></tr>${talk}</table></div>
<h2>Lint</h2><ul>${lint || '<li>Nothing.</li>'}</ul>
</body></html>`;
}
