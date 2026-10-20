// The story layer: situations (side quests with stages and goals), conversations (people who answer
// differently as the day goes and as you act), chatter (people talking to each other near you), and the
// phone's running timeline. rules.js owns the world; this module owns what the people in it say and want.
// Content lives in situations.js, talks.js and phone.js; the formats are in plans/story-rebuild.md.
// Pure module: no DOM. rules.js hands it the engine helpers it needs (createStory(api)).
import { SITUATIONS } from './situations.js';
import { TALKS, REACTS, BRUSHOFF, CHATTER } from './talks.js';
import { CHAT } from './phone.js';
import { FEED_TIMELINE, CHAT_TIMELINE } from './phone-timeline.js';

const CHATTER_RANGE = 12; // you overhear people talking to each other this close
const CHATTER_GAP = 2.6; // real seconds between chatter lines
const START_RANGE = 6; // how close to a situation's marker you must be to step in
const OFFICERS = /^(sharma|c\d|r\d)$/;

export function createStory(api) {
  const { at, dist, placeAt, phaseAt, SPOTS, PLACES, CROWD_CENTERS } = api;
  const clock = (hhmm) => { const [h, m] = String(hhmm).split(':').map(Number); return at(h, m || 0); };
  const cap = (id) => (id ? id[0].toUpperCase() + id.slice(1) : '');
  const story = (s) => s.story;

  function init() {
    return {
      sits: {}, // id -> { state: 'waiting'|'hooked'|'active'|'done'|'fail'|'missed', node, since, goalSince, auto }
      convo: null, // the conversation or situation node on screen: { kind, id, who, node, title, camera, beats, options, seq }
      played: {}, // talk ids played, chatter ids played
      reacted: {}, // 'who:kind' -> true
      brush: {}, // who -> next index
      queue: [], // [{ t, who, text, key, kind, pos }] lines waiting to be said (chatter, beats)
      feedI: 0, chatI: 0,
      levers: { intensity: 0, hotspot: null, target: null, stance: null },
      friends: { kabir: 'ok', nikhil: 'ok', meera: 'ok' },
      followers: [],
      seq: 0,
      chatterT: 0,
    };
  }

  // --- who and where ------------------------------------------------------------------

  const body = (s, id) => (id === 'player' ? s.player : s.people[id] || api.officerById(s, id) || s.objects[id] || null);
  const visibleBody = (s, id) => { const b = body(s, id); return b && !b.hidden ? b : null; };
  function placePos(s, where) {
    if (!where) return null;
    if (typeof where === 'object') return where;
    if (PLACES[where]) return PLACES[where];
    if (SPOTS[where]) return SPOTS[where];
    const b = visibleBody(s, where);
    return b ? { x: b.x, z: b.z } : null;
  }
  const holderOf = (s, obj) => s.objects[obj]?.holder ?? null;

  // --- requires and goals --------------------------------------------------------------

  function meets(s, req) {
    if (!req) return true;
    if (!api.meets(s, req)) return false;
    for (const id of req.with || []) if (!story(s).followers.includes(id) && !(id === 'nikhil' && ['follow', 'waitStage'].includes(s.people.nikhil.mode))) return false;
    if (req.holding && s.player.carrying !== req.holding) return false;
    if (req.after && s.t < clock(req.after) - 1e-9) return false;
    if (req.before && s.t >= clock(req.before) - 1e-9) return false;
    for (const d of req.did || []) if (story(s).sits[d]?.state !== 'done') return false;
    if (req.phase && ![].concat(req.phase).includes(phaseAt(s.t))) return false;
    if (req.detained != null && !!s.player.detained !== req.detained) return false;
    if (req.near && !(req.near.every?.((id) => { const b = visibleBody(s, id); return b && dist(b, s.player) <= START_RANGE * 2; }))) return false;
    for (const p of req.holds || []) if (!holds(s, p)) return false;
    return true;
  }
  /** One goal predicate (plans/story-rebuild.md). */
  function holds(s, p) {
    const [k, a, b] = p.split(':');
    switch (k) {
      case 'near': { const x = visibleBody(s, a) || s.objects[a], y = visibleBody(s, b) || s.objects[b]; return !!x && !!y && dist(x, y) <= 3; }
      case 'at': { const x = a === 'player' ? s.player : visibleBody(s, a) || s.objects[a]; return !!x && placeAt(x) === b; }
      case 'with': return story(s).followers.includes(a) || (a === 'nikhil' && ['follow', 'waitStage'].includes(s.people.nikhil.mode));
      case 'holding': return s.player.carrying === a;
      case 'given': return holderOf(s, a) === b;
      case 'flag': return !!s.flags[a];
      case '!flag': return !s.flags[a];
      case 'time': return s.t >= clock(`${a}:${b ?? '00'}`) - 1e-9;
      case 'detained': return !!s.player.detained;
      case 'free': return !s.player.detained;
      case 'crew': return s.player.crew.length >= Number(a);
      case 'filmed': return s.player.clips.some((c) => c.kind === a);
      case 'mood': { const o = body(s, a); return !!o && o.mood === b; }
      case 'hidden': { const o = body(s, a); return !!o && !!o.hidden; }
      case 'chase-lost': return !s.player.chasedBy && !!s.memo.chase && !s.player.detained;
      case 'done': return story(s).sits[a]?.state === 'done';
      default: return false;
    }
  }

  // --- saying things ---------------------------------------------------------------------

  /** Queue lines to be said in order, a beat apart, by whoever says them (people, officers, the phone). */
  function speak(s, beats, { key, gap = CHATTER_GAP, kind = 'beat', place = null } = {}) {
    const q = story(s).queue;
    let t = Math.max(s.t, q.length ? q[q.length - 1].t + gap : s.t);
    for (const b of beats || []) {
      const who = b.who ?? b[0], line = b.line ?? b[1];
      if (!line) continue;
      q.push({ t, who, text: line, key, kind: b.via === 'phone' || who === 'mummy' ? 'beat' : kind, place });
      t += gap;
    }
  }
  function flushQueue(s) {
    const q = story(s).queue;
    while (q.length && q[0].t <= s.t + 1e-9) {
      const e = q.shift();
      // A conversation's beats are on screen (the client's conversation panel or reel frame); chatter is in the world.
      if (e.kind === 'beat') api.say(s, e.who, e.text, { key: e.key, kind: 'beat', pos: { x: s.player.x, z: s.player.z } });
      else if (e.who === 'chat' || e.kind === 'chat') api.say(s, e.who, e.text, { key: e.key, kind: 'chat' });
      else { const b = visibleBody(s, e.who); api.say(s, e.who, e.text, { key: e.key, pos: b ? { x: b.x, z: b.z } : null, place: e.place }); }
    }
  }
  const chatLines = (s, msgs, key) => { for (const [who, text] of msgs || []) api.say(s, who, text, { key, kind: 'chat' }); };

  // --- doing things --------------------------------------------------------------------------

  function doAll(s, list, ctx = {}) { for (const d of list || []) doOne(s, d, ctx); }
  function doOne(s, d, ctx) {
    const [k, a, b] = d.split(':');
    const st = story(s);
    switch (k) {
      case 'follow': if (a === 'nikhil') { s.people.nikhil.mode = 'follow'; } else if (!st.followers.includes(a) && s.people[a]) { st.followers.push(a); s.people[a].mode = 'follow'; } break;
      case 'unfollow': st.followers = st.followers.filter((x) => x !== a); if (s.people[a]?.mode === 'follow') s.people[a].mode = 'story'; break;
      // An officer sent somewhere by the story goes back to his post after a while (rules.js updateOfficers).
      case 'move': { const p = s.people[a] || api.officerById(s, a), to = placePos(s, b); if (p && to) { p.mode = s.officers[a] ? 'away' : p.kind ? 'toPost' : 'story'; if (s.officers[a]) p.backAt = s.t + api.mins(25); api.walkTo(p, to); } break; }
      case 'leave': { const p = s.people[a]; if (p && !p.hidden) { p.mode = 'storyLeave'; api.walkTo(p, SPOTS.metro); } break; }
      case 'return': { const p = s.people[a]; if (p && p.hidden && p.mode !== 'detained') { p.hidden = false; Object.assign(p, SPOTS.metro); p.mode = 'story'; api.walkTo(p, PLACES.stage); } break; }
      case 'give': api.giveObject(s, a, b); break;
      case 'take': api.giveObject(s, a, 'player'); break;
      case 'drop': { const pos = placePos(s, b) || s.player; api.giveObject(s, a, null, pos); break; }
      case 'detain': if (a === 'player') api.detainPlayer(s, 'story'); else api.detainPerson(s, a); break;
      case 'release': if (a === 'player') { if (s.player.detained) api.releasePlayer(s, 'released-story'); } else api.releasePerson(s, a); break;
      case 'chase': if (!s.player.chasedBy) api.startChase(s, a, ctx.id || 'story'); break;
      case 'calm': { const o = api.officerById(s, a); if (o) { o.mood = 'bored'; if (s.player.chasedBy === a) { s.player.chasedBy = null; api.sendHome(s, o); } } break; }
      case 'cue': api.cue(s, a, { pos: s.player }); break;
      case 'clip': api.happen(s, a, s.player); break;
      case 'chat': chatLines(s, CHAT[a], 'chat:' + a); break;
      case 'feed': { const f = FEED_TIMELINE.find((x) => x.id === a); if (f) postFeed(s, f); break; }
      // A situation's own callback (its `callbacks` table), timed from when the situation started.
      case 'callback': if (ctx.id && SITUATIONS[ctx.id]?.callbacks?.[a]) api.callback(s, `sit:${ctx.id}:${a}`, `situation:${ctx.id}`); else api.callback(s, a, null); break;
      case 'rumour': api.placeLearns(s, a, b || 'stage'); break;
      case 'crowd': api.crowdAdd(s, a, Number(b) >= 0 ? Number(b) : 0); if (Number(b) < 0) api.crowdTake(s, a, -Number(b)); break;
      case 'intensity': st.levers.intensity += Number(a); break;
      case 'hotspot': st.levers.hotspot = a; break;
      case 'target': st.levers.target = a === 'none' ? 'crowd' : a; break;
      case 'stance': st.levers.stance = a; break;
      case 'situation': if (b === 'start') startSituation(s, a, true); else endSituation(s, a, b); break;
      case 'nikhil': if (a === 'found') api.nikhilFound(s); else { const n = s.people.nikhil; n.mode = 'lost'; api.walkTo(n, SPOTS.nikhilStart); } break;
      case 'friend': st.friends[a] = b; if (b === 'detained') api.detainPerson(s, a); if (b === 'missing') { const p = s.people[a]; if (p) { p.mode = 'lost'; api.walkTo(p, SPOTS.metro); } } break;
      case 'flag': api.applyFlag(s, a); break;
      default: api.say(s, 'street', '', { key: 'unknown-do:' + d });
    }
  }
  function apply(s, o, ctx) {
    const e = o.effects || {};
    api.addRep(s, e);
    for (const [who, mood] of Object.entries(e.mood || {})) { const p = body(s, who); if (p) { p.mood = mood; if (mood === 'annoyed') p.annoyedAt = s.t; } }
    for (const f of e.flags || []) api.applyFlag(s, f);
    doAll(s, o.do, ctx);
    if (o.clip) api.happen(s, o.clip, s.player);
  }

  // --- conversations (talks and situation nodes share one shape) ------------------------------

  function open(s, kind, id, who, def, nodeId) {
    const node = def.nodes?.[nodeId];
    const st = story(s);
    if (!node) { st.convo = null; return; }
    speak(s, node.beats, { key: `${kind}:${id}:${nodeId}` });
    if (node.goal) {
      const sit = st.sits[id];
      if (sit) { sit.node = nodeId; sit.goalSince = s.t; }
      st.convo = null;
      api.cue(s, 'objective', { pos: s.player, data: { id, text: node.goal.text } });
      return;
    }
    if (node.options?.length) {
      st.convo = {
        kind, id, who, node: nodeId, seq: ++st.seq, title: def.title || null, camera: node.camera || def.camera || 'none',
        beats: (node.beats || []).map((b) => ({ who: b.who ?? b[0], line: b.line ?? b[1], react: b.react ?? null, via: b.via ?? null })),
        idle: node.idle || [],
        options: node.options.map((o, i) => { const ok = meets(s, o.requires); return { i, intent: o.intent, ok, why: ok ? '' : why(s, o.requires) }; }),
        t: s.t, at: { x: s.player.x, z: s.player.z },
      };
      if (st.sits[id]) st.sits[id].node = nodeId;
      api.cue(s, 'convo', { pos: s.player, data: { kind, id, node: nodeId } });
      return;
    }
    // A node with only beats: it plays, then moves on.
    st.convo = null;
    if (node.next) open(s, kind, id, who, def, node.next);
    else if (kind === 'situation') endSituation(s, id, node.end || 'done');
  }
  function why(s, req) {
    const r = { ...(req.rep || {}) };
    for (const k of ['aura', 'help', 'heat', 'nuisance']) if (req[k] != null) r[k] = req[k];
    for (const [k, v] of Object.entries(r)) if (s.player.rep[k] < v) return `needs ${k} ${v}+`;
    if (req.holding && s.player.carrying !== req.holding) return `needs the ${req.holding}`;
    if (req.with?.length) return `needs ${req.with.map(cap).join(' and ')} with you`;
    if (req.after && s.t < clock(req.after)) return `after ${req.after}`;
    if (req.mood) return 'they are not in the mood';
    return 'not yet';
  }
  /** Pick option i of the conversation on screen. */
  function say(s, i) {
    const st = story(s), c = st.convo;
    if (!c) return { ok: false, say: 'nothing to answer' };
    const def = c.kind === 'situation' ? SITUATIONS[c.id] : (TALKS[c.who] || []).find((t) => t.id === c.id);
    const node = def?.nodes?.[c.node], o = node?.options?.[i];
    if (!o) return { ok: false, say: 'no such option' };
    if (!meets(s, o.requires)) return { ok: false, say: why(s, o.requires) };
    st.convo = null;
    speak(s, o.beats, { key: `${c.kind}:${c.id}:${c.node}:${i}` });
    apply(s, o, { id: c.id });
    api.memo(s, `said:${c.id}:${c.node}:${i}`);
    if (c.kind === 'situation') api.memo(s, `situation:${c.id}:${c.node}:${i}`);
    if (o.next) open(s, c.kind, c.id, c.who, def, o.next);
    else if (c.kind === 'situation') { if (o.end) endSituation(s, c.id, o.end); }
    return { ok: true, said: true };
  }
  function leave(s) {
    const st = story(s);
    if (!st.convo) return { ok: false };
    const c = st.convo;
    st.convo = null;
    const def = c.kind === 'situation' ? SITUATIONS[c.id] : null;
    const bye = def?.nodes?.[c.node]?.leave;
    if (bye) speak(s, bye, { key: `${c.kind}:${c.id}:leave` });
    return { ok: true, said: !!bye };
  }

  /**
   * Talking to someone: their best unplayed conversation for now; else a reaction to what just happened;
   * else a brush-off, never the same one twice in a row. Returns { ok, line, repeat, said }.
   */
  function talk(s, who) {
    const st = story(s);
    if (st.convo) return { ok: false, say: 'already talking' };
    // Someone in a hooked or active situation sends you into it.
    for (const [id, def] of Object.entries(SITUATIONS)) {
      const sit = st.sits[id];
      if (!sit || !['hooked', 'active'].includes(sit.state) || !(def.cast || []).includes(who) || def.marker === 'none') continue;
      if (sit.state === 'active' && sit.node && SITUATIONS[id].nodes[sit.node]?.goal) continue;
      startSituation(s, id);
      return { ok: true, said: true, line: firstLine(def.nodes[sit.node || def.start]?.beats), situation: id };
    }
    const phase = phaseAt(s.t);
    const pool = (TALKS[who] || []).filter((t) => !(t.once !== false && st.played[t.id]) && (!t.phase || t.phase.includes(phase)) && meets(s, t.requires));
    pool.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    if (pool.length) {
      const t = pool[0];
      st.played[t.id] = true;
      api.memo(s, 'talk:' + t.id);
      open(s, 'talk', t.id, who, t, t.start || Object.keys(t.nodes)[0]);
      return { ok: true, said: true, line: firstLine(t.nodes[t.start || Object.keys(t.nodes)[0]]?.beats), talk: t.id };
    }
    const reacts = REACTS[who] || {};
    const recent = s.recent.slice().reverse().find((h) => reacts[h.kind] && !st.reacted[`${who}:${h.kind}`] && s.t - h.t <= api.mins(20));
    if (recent) {
      st.reacted[`${who}:${recent.kind}`] = true;
      speak(s, reacts[recent.kind], { key: `react:${who}:${recent.kind}`, kind: 'line' });
      return { ok: true, said: true, line: firstLine(reacts[recent.kind]), react: recent.kind };
    }
    const brush = BRUSHOFF[who];
    if (brush?.length) {
      const n = st.brush[who] || 0;
      st.brush[who] = n + 1;
      const line = brush[n % brush.length];
      api.say(s, who, line, { key: `brushoff:${who}` });
      return { ok: true, said: true, line, repeat: n >= brush.length };
    }
    return null; // no story content: rules.js falls back to the old talk lines
  }
  const firstLine = (beats) => { const b = (beats || [])[0]; return b ? b.line ?? b[1] : null; };

  // --- situations ---------------------------------------------------------------------------------

  function startSituation(s, id, forced = false) {
    const def = SITUATIONS[id], st = story(s);
    if (!def) return { ok: false };
    const sit = (st.sits[id] ??= { state: 'waiting' });
    if (!forced && !['hooked', 'active'].includes(sit.state)) return { ok: false, say: 'not now' };
    if (sit.state !== 'active') { sit.state = 'active'; sit.since = s.t; sit.node = def.start; api.memo(s, 'situation:' + id); api.cue(s, 'situation-start', { pos: s.player, data: { id } }); }
    open(s, 'situation', id, (def.cast || [])[0] || null, def, sit.node || def.start);
    return { ok: true, said: true };
  }
  function endSituation(s, id, end) {
    const def = SITUATIONS[id], st = story(s), sit = (st.sits[id] ??= { state: 'waiting' });
    if (!def || sit.state === 'done' || sit.state === 'fail') return;
    sit.state = end === 'fail' ? 'fail' : 'done';
    sit.node = null;
    if (st.convo?.id === id) st.convo = null;
    api.memo(s, `situation-${sit.state}:${id}`);
    const out = def.outcomes?.[sit.state];
    if (out?.caption) postFeed(s, { by: out.by || 'jantar.ki.awaaz', caption: out.caption, kind: id, place: def.place && PLACES[def.place] ? def.place : null });
    if (out?.callback) api.callback(s, `sit:${id}:${sit.state}`, `situation:${id}`);
    doAll(s, out?.do, { id });
    if (def.clip && sit.state === 'done') api.happen(s, def.clip, s.player); // something worth filming (and a clip Meera posts)
    api.cue(s, 'situation-end', { pos: s.player, data: { id, end: sit.state } });
  }
  /** Callback text for the ending card. */
  function callbackText(key) {
    const m = key.match(/^sit:([^:]+):(.+)$/);
    if (!m) return null;
    const def = SITUATIONS[m[1]];
    return def?.callbacks?.[m[2]] ?? def?.outcomes?.[m[2]]?.callback ?? null;
  }
  function marker(s, def, sit) {
    const node = sit?.node ? def.nodes[sit.node] : null;
    if (node?.goal?.marker) return placePos(s, node.goal.marker);
    return placePos(s, def.place);
  }

  /** Every situation and where it stands, for the HUD and the verifier. */
  function list(s) {
    return Object.entries(SITUATIONS).map(([id, def]) => {
      const sit = story(s).sits[id] || { state: 'waiting' };
      const node = sit.node ? def.nodes[sit.node] : null;
      return { id, title: def.title, act: def.act, state: sit.state, last: sit.last ?? null, card: def.hook?.card ?? def.title, goal: node?.goal ? node.goal.text : null, marker: marker(s, def, sit) };
    });
  }

  // --- each tick ------------------------------------------------------------------------------------

  function postFeed(s, f) { api.say(s, 'feed', `${f.by || 'jantar.ki.awaaz'}: ${f.caption}`, { key: 'feed:' + (f.id || f.kind || 'post'), kind: 'feed', place: f.place || null }); }

  function tick(s, dt) {
    const st = story(s), now = s.t;
    // Situations open, announce themselves, run themselves if you never come, and check goals.
    // Walk away from a conversation and it ends.
    // (On the bus you can't walk away, so it stays until you answer.)
    // Walk away and stay away (20 real seconds, so a quick step back doesn't drop it) and it ends.
    if (st.convo && !s.player.detained && dist(st.convo.at, s.player) > START_RANGE * 2) { st.convo.away = (st.convo.away || 0) + dt; if (st.convo.away > 20) leave(s); }
    else if (st.convo) st.convo.away = 0;
    for (const [id, def] of Object.entries(SITUATIONS)) {
      const sit = (st.sits[id] ??= { state: 'waiting' });
      // A repeatable situation (bus-andar) re-arms once its requirements stop holding.
      if (def.repeat && ['done', 'fail', 'missed'].includes(sit.state) && !meets(s, def.requires)) { st.sits[id] = { state: 'waiting', runs: (sit.runs || 0) + 1, last: sit.state }; continue; }
      // ...and one that only makes sense while its requirements hold (on the bus) ends quietly when they stop.
      if (def.cancelIfUnmet && ['hooked', 'active'].includes(sit.state) && !meets(s, def.requires)) { sit.state = 'done'; sit.node = null; if (st.convo?.id === id) st.convo = null; continue; }
      const from = clock(def.window?.from ?? '10:00'), until = clock(def.window?.until ?? '18:00');
      if (sit.state === 'waiting') {
        if (now >= until) sit.state = 'missed';
        else if (now >= from - 1e-9 && meets(s, def.requires)) {
          sit.state = 'hooked'; sit.hookedAt = now;
          chatLines(s, def.hook?.chat, `hook:${id}`);
          speak(s, def.hook?.overheard, { key: `hook:${id}`, kind: 'line', place: def.place });
          api.cue(s, 'situation-hook', { pos: marker(s, def, sit), data: { id, card: def.hook?.card } });
        }
      }
      if (sit.state === 'hooked') {
        if (def.auto && !sit.auto && now >= clock(def.auto.at) - 1e-9) {
          sit.auto = true;
          speak(s, def.auto.beats, { key: `auto:${id}`, kind: 'line', place: def.place });
          doAll(s, def.auto.do, { id });
          sit.state = def.auto.end === 'done' ? 'done' : def.auto.end === 'fail' ? 'fail' : 'missed';
          if (def.auto.end) { const out = def.outcomes?.[sit.state]; if (out?.caption) postFeed(s, { by: out.by, caption: out.caption, kind: id }); }
        } else if (now >= until && !def.keepOpen) sit.state = 'missed';
      }
      if (sit.state === 'active' && sit.node) {
        const g = def.nodes[sit.node]?.goal;
        if (g) {
          if ((g.until || []).every((p) => holds(s, p))) { const next = g.onDone; sit.node = null; if (next) open(s, 'situation', id, null, def, next); else endSituation(s, id, 'done'); }
          else if (g.by && now >= clock(g.by) - 1e-9) { const next = g.onFail; sit.node = null; if (next) open(s, 'situation', id, null, def, next); else endSituation(s, id, 'fail'); }
        }
      }
    }
    // Followers keep up.
    for (const id of st.followers) {
      const p = s.people[id];
      if (!p || p.hidden || p.mode === 'detained') continue;
      const d = dist(p, s.player);
      if (d > 2.4) api.walkTo(p, { x: s.player.x + (p.x - s.player.x) * (1.8 / d), z: s.player.z + (p.z - s.player.z) * (1.8 / d) });
    }
    for (const p of Object.values(s.people)) if (p.mode === 'storyLeave' && p.path.length === 0) { p.hidden = true; p.mode = 'away'; }
    // Chatter: people near you talking to each other.
    st.chatterT -= dt;
    if (st.chatterT <= 0 && !st.queue.length && !st.convo) {
      st.chatterT = 6;
      const phase = phaseAt(now);
      const c = CHATTER.find((x) => !st.played[x.id] && (!x.phase || x.phase.includes(phase)) && meets(s, x.requires) && chatterHere(s, x));
      if (c) { st.played[c.id] = true; speak(s, c.beats, { key: 'chatter:' + c.id, kind: 'line', place: c.place }); }
    }
    // The phone's running timeline.
    while (st.feedI < FEED_TIMELINE.length && now >= clock(FEED_TIMELINE[st.feedI].at) - 1e-9) {
      const f = FEED_TIMELINE[st.feedI++];
      if (meets(s, f.requires)) postFeed(s, f);
    }
    while (st.chatI < CHAT_TIMELINE.length && now >= clock(CHAT_TIMELINE[st.chatI].at) - 1e-9) {
      const c = CHAT_TIMELINE[st.chatI++];
      if (meets(s, c.requires)) chatLines(s, c.msgs, 'chat-timeline:' + c.at);
    }
    flushQueue(s);
  }
  function chatterHere(s, c) {
    const cast = (c.cast || []).map((id) => visibleBody(s, id));
    if (cast.some((b) => !b)) return false;
    const pos = c.place && (PLACES[c.place] || CROWD_CENTERS[c.place]) ? PLACES[c.place] || CROWD_CENTERS[c.place] : cast[0];
    return !!pos && dist(pos, s.player) <= CHATTER_RANGE + (PLACES[c.place]?.r ?? 0) * 0.5 && cast.every((b) => dist(b, s.player) <= CHATTER_RANGE * 1.6);
  }

  /** What the player can do in the story right now (for affordances() and opportunities()). */
  function affordances(s) {
    const out = [], st = story(s);
    if (st.convo) {
      st.convo.options.forEach((o) => out.push({ id: `say:${st.convo.id}:${st.convo.node}:${o.i}`, kind: 'say', cmd: { type: 'say', option: o.i }, at: null, text: o.intent, ok: o.ok }));
      out.push({ id: 'leave', kind: 'leave', cmd: { type: 'leave' }, at: null, text: 'Walk away' });
      return out;
    }
    for (const [id, def] of Object.entries(SITUATIONS)) {
      const sit = st.sits[id];
      if (!sit || !['hooked', 'active'].includes(sit.state)) continue;
      const node = sit.node ? def.nodes[sit.node] : null;
      const m = marker(s, def, sit);
      if (!m) continue;
      if (node?.goal) out.push({ id: `goal:${id}`, kind: 'goal', cmd: null, at: m, text: node.goal.text });
      else out.push({ id: `situation:${id}`, kind: 'situation', cmd: { type: 'situation', id }, at: m, text: def.hook?.card ?? def.title });
    }
    return out;
  }

  return { init, tick, talk, say, leave, startSituation, endSituation, list, affordances, callbackText, holds, meets, START_RANGE, OFFICERS };
}
