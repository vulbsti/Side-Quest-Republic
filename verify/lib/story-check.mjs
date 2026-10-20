// Checks the story content (situations, conversations, chatter, the phone timeline) against the format
// in plans/story-rebuild.md, with no game running: every id it names exists, every node can be reached,
// every do-action and goal predicate is one the engine implements, and the counts the plan asks for.
// Each finding is { level: 'error' | 'warn' | 'info', id, msg }. `node verify/story-check.mjs` prints them.
import { readFileSync } from 'node:fs';
import * as R from '../../dist/loop/rules.js';
import { SITUATIONS } from '../../dist/loop/situations.js';
import { TALKS, REACTS, BRUSHOFF, CHATTER, PESTER_BY, SPEAKERS } from '../../dist/loop/talks.js';
import { FEED_TIMELINE, CHAT_TIMELINE } from '../../dist/loop/phone-timeline.js';
import { CHAT } from '../../dist/loop/phone.js';

const ROOT = new URL('../../', import.meta.url);
const rulesSrc = readFileSync(new URL('dist/loop/rules.js', ROOT), 'utf8');
const clientSrc = ['dist/loop/main.js', 'dist/loop/audio.js', 'dist/loop/phone-ui.js'].map((f) => readFileSync(new URL(f, ROOT), 'utf8')).join('\n');

const day = R.createDay();
export const PEOPLE = Object.keys(day.people);
export const OFFICERS = ['sharma', 'c1', 'c2', 'c3', 'c4', 'c5', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6'];
export const TALKERS = [...PEOPLE, 'c1', 'c2', 'c3', 'c4', 'c5', 'r1'];
const BODIES = new Set([...PEOPLE, ...OFFICERS]);
const VOICES = new Set(['player', 'mummy', 'crowd', 'wireless', 'raf', 'chat', ...Object.keys(SPEAKERS)]);
const FRIENDS = ['kabir', 'nikhil', 'meera'];
const OBJECTS = Object.keys(day.objects);
const PLACE_IDS = new Set([...Object.keys(R.PLACES), ...Object.keys(R.SPOTS)]);
const PHASES = R.PHASES.map(([id]) => id);
const RUMOURS = Object.keys(day.rumours);
const HAPPEN = new Set([...rulesSrc.matchAll(/happen\(s, '([a-z-]+)'/g)].map((m) => m[1]).concat(['pester-career', 'pester-cute', 'pester-cannon', 'pester-detainme', 'speaker-party', 'roast', 'singalong', 'faint', 'mummy-call', 'detain-me']));
const CUES = new Set([...clientSrc.matchAll(/['"]([a-z][a-z-]+)['"]/g)].map((m) => m[1]).filter((c) => rulesSrc.includes(`cue(s, '${c}'`)));
const MOODS = new Set(['bored', 'amused', 'soft', 'annoyed', 'grateful', 'sulking', 'shook', 'proud', 'scared', 'angry', 'happy', 'sad', 'chill']);
const DO = {
  follow: ['body'], unfollow: ['body'], move: ['body', 'where'], leave: ['person'], return: ['person'],
  give: ['object', 'person'], take: ['object'], drop: ['object', 'where'],
  detain: ['personOrPlayer'], release: ['personOrPlayer'], chase: ['officer'], calm: ['officer'],
  cue: ['cue'], clip: ['happen'], chat: ['chat'], feed: ['feedId'], callback: ['key'],
  rumour: ['rumour', 'where'], crowd: ['crowdPlace', 'int'], intensity: ['int'], hotspot: ['crowdPlace'],
  target: [['player', 'crew', 'stream', 'mira', 'none']], stance: [['hold', 'scatter', 'block', 'protect']],
  situation: ['situation', ['start', 'done', 'fail']], nikhil: [['found', 'lost']],
  friend: [FRIENDS, ['ok', 'hurt', 'detained', 'missing']], flag: ['flag'],
};
const PRED = {
  near: ['bodyOrObject', 'bodyOrObject'], at: ['bodyOrObjectOrPlayer', 'place'], with: ['person'], holding: ['object'],
  given: ['object', 'person'], flag: ['flag'], '!flag': ['flag'], time: ['hh', 'mm'], detained: [], free: [], crew: ['int'],
  filmed: ['happen'], mood: ['body', 'mood'], hidden: ['body'], 'chase-lost': [], done: ['situation'],
};
const REQ_KEYS = new Set(['mood', 'rep', 'aura', 'help', 'heat', 'nuisance', 'flags', 'anyFlags', 'notFlags', 'with', 'holding', 'after', 'before', 'did', 'phase', 'detained', 'near', 'holds']);
const EFFECT_KEYS = new Set(['aura', 'heat', 'help', 'nuisance', 'mood', 'flags']);
const CROWD_PLACES = ['stage', 'cp', 'barricade', 'parliament'];
const HHMM = /^(1[0-7]|18):[0-5]\d$/;

export function storyCheck() {
  const out = [], f = (level, id, msg) => out.push({ level, id, msg });
  const feedIds = new Set(FEED_TIMELINE.map((x) => x.id).filter(Boolean));
  const ARG = {
    body: (v) => BODIES.has(v), person: (v) => PEOPLE.includes(v), personOrPlayer: (v) => v === 'player' || PEOPLE.includes(v),
    officer: (v) => OFFICERS.includes(v), object: (v) => OBJECTS.includes(v), where: (v) => PLACE_IDS.has(v) || BODIES.has(v),
    place: (v) => PLACE_IDS.has(v), crowdPlace: (v) => CROWD_PLACES.includes(v), bodyOrObject: (v) => BODIES.has(v) || OBJECTS.includes(v),
    bodyOrObjectOrPlayer: (v) => v === 'player' || BODIES.has(v) || OBJECTS.includes(v),
    cue: (v) => CUES.has(v), happen: (v) => HAPPEN.has(v), chat: (v) => !!CHAT[v], feedId: (v) => feedIds.has(v), key: (v) => !!v,
    rumour: (v) => RUMOURS.includes(v), int: (v) => /^[+-]?\d+$/.test(v), situation: (v) => !!SITUATIONS[v], flag: (v) => /^[a-z0-9-]+$/.test(v || ''),
    mood: (v) => MOODS.has(v), hh: (v) => /^(1[0-8])$/.test(v), mm: (v) => v === undefined || /^[0-5]\d$/.test(v),
  };
  const argOk = (kind, v) => (Array.isArray(kind) ? kind.includes(v) : ARG[kind](v));
  const checkDo = (where, list, ctx) => {
    for (const d of list || []) {
      const [k, ...args] = String(d).split(':');
      const spec = DO[k];
      if (!spec) { f('error', 'do-unknown', `${where}: do "${d}" is not an action the engine implements`); continue; }
      spec.forEach((kind, i) => { if (!(kind === 'where' && args[i] === undefined && k === 'drop') && !argOk(kind, args[i])) f('error', 'do-arg', `${where}: do "${d}": "${args[i]}" is not a valid ${Array.isArray(kind) ? kind.join('|') : kind}`); });
      if (k === 'callback' && ctx?.sit && !ctx.sit.callbacks?.[args[0]]) f('error', 'callback-text', `${where}: do "${d}" has no text in this situation's callbacks table`);
    }
  };
  const checkPred = (where, p) => {
    const [k, ...args] = String(p).split(':');
    const spec = PRED[k];
    if (!spec) return f('error', 'goal-unknown', `${where}: goal "${p}" is not a predicate the engine implements`);
    spec.forEach((kind, i) => { if (!argOk(kind, args[i])) f('error', 'goal-arg', `${where}: goal "${p}": "${args[i]}" is not a valid ${kind}`); });
  };
  const checkReq = (where, r) => {
    if (!r) return;
    for (const k of Object.keys(r)) if (!REQ_KEYS.has(k)) f('error', 'requires-key', `${where}: requires.${k} is not understood`);
    for (const k of ['after', 'before']) if (r[k] && !HHMM.test(r[k])) f('error', 'requires-time', `${where}: requires.${k} "${r[k]}" is not hh:mm`);
    for (const id of r.with || []) if (!PEOPLE.includes(id)) f('error', 'requires-with', `${where}: requires.with "${id}"`);
    if (r.holding && !OBJECTS.includes(r.holding)) f('error', 'requires-holding', `${where}: requires.holding "${r.holding}"`);
    for (const id of Object.keys(r.mood || {})) if (!BODIES.has(id)) f('error', 'requires-mood', `${where}: requires.mood "${id}"`);
    for (const d of r.did || []) if (!SITUATIONS[d]) f('error', 'requires-did', `${where}: requires.did "${d}"`);
    for (const p of r.holds || []) checkPred(where, p);
    if (r.phase) for (const p of [].concat(r.phase)) if (!PHASES.includes(p)) f('error', 'requires-phase', `${where}: phase "${p}"`);
  };
  const checkEffects = (where, e) => {
    if (!e) return;
    for (const k of Object.keys(e)) if (!EFFECT_KEYS.has(k)) f('error', 'effects-key', `${where}: effects.${k} is not understood`);
    for (const [id, m] of Object.entries(e.mood || {})) { if (!BODIES.has(id)) f('error', 'effects-mood', `${where}: effects.mood "${id}"`); if (!MOODS.has(m)) f('warn', 'effects-mood', `${where}: mood "${m}" is new; check something reads it`); }
  };
  const checkBeats = (where, beats) => {
    for (const b of beats || []) {
      const who = b.who ?? b[0], line = b.line ?? b[1];
      if (!BODIES.has(who) && !VOICES.has(who)) f('error', 'beat-who', `${where}: beat by "${who}" (not a person, officer or SPEAKERS voice)`);
      if (!line || typeof line !== 'string') f('error', 'beat-line', `${where}: empty beat by "${who}"`);
    }
  };
  // A node graph (a situation or a conversation): every node reachable, every link resolves, and the ends.
  const checkGraph = (where, g, ctx) => {
    const nodes = g.nodes || {};
    const start = g.start || Object.keys(nodes)[0];
    if (!nodes[start]) return f('error', 'graph-start', `${where}: start node "${start}" does not exist`);
    const seen = new Set(), queue = [start], ends = new Set();
    while (queue.length) {
      const id = queue.shift();
      if (seen.has(id)) continue;
      seen.add(id);
      const n = nodes[id];
      if (!n) { f('error', 'graph-link', `${where}: a link points at node "${id}", which does not exist`); continue; }
      const w = `${where}.${id}`;
      checkBeats(w, n.beats);
      checkBeats(w + '.idle', n.idle);
      checkBeats(w + '.leave', n.leave);
      if (n.camera && !['phone', 'wide', 'none'].includes(n.camera)) f('error', 'camera', `${w}: camera "${n.camera}"`);
      if (!n.options?.length && !n.goal && !n.next && !n.end && ctx.kind === 'situation') f('error', 'graph-deadend', `${w}: no options, goal, next or end`);
      if (n.next) queue.push(n.next);
      if (n.end) ends.add(n.end);
      if (n.options) {
        if (n.options.length < 2) f('warn', 'options-few', `${w}: only ${n.options.length} option`);
        n.options.forEach((o, i) => {
          const ow = `${w}[${i}]`;
          if (!o.intent || o.intent.length > 64) f('error', 'intent', `${ow}: intent missing or over 64 characters`);
          checkReq(ow, o.requires); checkEffects(ow, o.effects); checkBeats(ow, o.beats); checkDo(ow, o.do, ctx);
          if (o.clip && !HAPPEN.has(o.clip)) f('error', 'clip', `${ow}: clip "${o.clip}" is not a happening kind`);
          if (o.next) queue.push(o.next);
          if (o.end) ends.add(o.end);
          if (!o.next && !o.end && ctx.kind === 'situation') f('warn', 'option-dangling', `${ow}: neither next nor end; the situation stays open with no node`);
          if (o.end && !['done', 'fail'].includes(o.end)) f('error', 'end', `${ow}: end "${o.end}"`);
        });
        if (n.options.every((o) => o.requires && Object.keys(o.requires).length)) f('warn', 'options-gated', `${w}: every option has requirements; the player can be stuck`);
      }
      if (n.goal) {
        const g2 = n.goal;
        if (!g2.text) f('error', 'goal-text', `${w}: goal has no text`);
        if (!g2.until?.length) f('error', 'goal-until', `${w}: goal has no until`);
        for (const p of g2.until || []) checkPred(w, p);
        if (g2.by && !HHMM.test(g2.by)) f('error', 'goal-by', `${w}: goal.by "${g2.by}"`);
        if (g2.marker && typeof g2.marker === 'string' && !PLACE_IDS.has(g2.marker) && !BODIES.has(g2.marker) && !OBJECTS.includes(g2.marker) && g2.marker !== 'player') f('error', 'goal-marker', `${w}: marker "${g2.marker}"`);
        if (g2.onDone) queue.push(g2.onDone); else ends.add('done');
        if (g2.by) { if (g2.onFail) queue.push(g2.onFail); else ends.add('fail'); }
      }
    }
    for (const id of Object.keys(nodes)) if (!seen.has(id)) f('warn', 'graph-unreachable', `${where}: node "${id}" can't be reached from "${start}"`);
    return ends;
  };

  // --- situations ---
  for (const [id, sit] of Object.entries(SITUATIONS)) {
    const w = `situation ${id}`;
    for (const k of ['title', 'act', 'window', 'place', 'cast', 'hook', 'start', 'nodes', 'outcomes']) if (sit[k] == null) f('error', 'situation-field', `${w}: missing ${k}`);
    if (sit.window) for (const k of ['from', 'until']) if (!HHMM.test(sit.window[k] || '')) f('error', 'window', `${w}: window.${k} "${sit.window[k]}"`);
    if (sit.place && sit.place !== 'player' && !PLACE_IDS.has(sit.place) && !BODIES.has(sit.place)) f('error', 'place', `${w}: place "${sit.place}"`);
    for (const c of sit.cast || []) if (!BODIES.has(c) && !VOICES.has(c)) f('error', 'cast', `${w}: cast "${c}"`);
    checkReq(w, sit.requires);
    if (!sit.hook?.card) f('error', 'hook', `${w}: hook.card is the objective-card text and is required`);
    if (!(sit.hook?.chat?.length || sit.hook?.overheard?.length)) f('warn', 'hook', `${w}: announces itself with neither a chat ping nor an overheard line`);
    for (const [who] of sit.hook?.chat || []) if (!['kabir', 'nikhil', 'meera', 'zoya', 'mummy', 'mira', 'dev'].includes(who)) f('warn', 'hook-chat', `${w}: chat from "${who}"; the group chat is Kabir, Nikhil and Meera`);
    checkBeats(w + '.hook.overheard', sit.hook?.overheard);
    if (sit.auto) { if (!HHMM.test(sit.auto.at || '')) f('error', 'auto', `${w}: auto.at`); checkDo(w + '.auto', sit.auto.do, { sit }); checkBeats(w + '.auto', sit.auto.beats); }
    else if (!sit.repeat) f('warn', 'auto', `${w}: no auto; if the player never comes, nothing happens in the world`);
    const ends = checkGraph(w, sit, { kind: 'situation', sit });
    if (ends && !ends.has('done')) f('error', 'ends', `${w}: no path ends in done`);
    if (ends && !ends.has('fail')) f('warn', 'ends', `${w}: no path ends in fail`);
    for (const k of ['done', 'fail']) { const o = sit.outcomes?.[k]; if (o) checkDo(`${w}.outcomes.${k}`, o.do, { sit }); }
    if (!sit.outcomes?.done?.caption) f('warn', 'outcome', `${w}: outcomes.done.caption (the feed post) is missing`);
    if (!sit.outcomes?.done?.callback && !Object.keys(sit.callbacks || {}).length) f('warn', 'outcome', `${w}: no callback for the ending card`);
  }

  // --- conversations ---
  const talkIds = new Set();
  for (const [who, list] of Object.entries(TALKS)) {
    if (!TALKERS.includes(who)) f('error', 'talk-who', `TALKS.${who}: not a person or named officer`);
    for (const t of list) {
      const w = `talk ${who}/${t.id}`;
      if (!t.id) { f('error', 'talk-id', `TALKS.${who}: a conversation has no id`); continue; }
      if (talkIds.has(t.id)) f('error', 'talk-id', `${w}: id used twice`);
      talkIds.add(t.id);
      for (const p of t.phase || []) if (!PHASES.includes(p)) f('error', 'talk-phase', `${w}: phase "${p}"`);
      checkReq(w, t.requires);
      checkGraph(w, t, { kind: 'talk' });
    }
  }
  for (const who of TALKERS) {
    const list = TALKS[who] || [];
    for (const p of PHASES) {
      const n = list.filter((t) => !t.phase || t.phase.includes(p)).length;
      if (n < 2) f('warn', 'talk-count', `${who}: ${n} conversation(s) in the ${p}; the plan asks for 2+`);
    }
    const reacts = Object.keys(REACTS[who] || {});
    for (const k of reacts) { if (!HAPPEN.has(k)) f('error', 'react-kind', `REACTS.${who}.${k}: not a happening kind`); checkBeats(`REACTS.${who}.${k}`, REACTS[who][k]); }
    if (reacts.length < 8) f('warn', 'react-count', `${who}: reacts to ${reacts.length} happenings; the plan asks for 8+`);
    const b = BRUSHOFF[who] || [];
    if (b.length < 6) f('warn', 'brushoff', `${who}: ${b.length} brush-off lines; 6+ so it doesn't repeat soon`);
    if (new Set(b).size !== b.length) f('error', 'brushoff', `${who}: a brush-off line appears twice`);
  }

  // --- chatter ---
  const chatterIds = new Set();
  for (const c of CHATTER) {
    const w = `chatter ${c.id}`;
    if (!c.id || chatterIds.has(c.id)) f('error', 'chatter-id', `${w}: missing or duplicate id`);
    chatterIds.add(c.id);
    for (const id of c.cast || []) if (!BODIES.has(id)) f('error', 'chatter-cast', `${w}: cast "${id}" must be a body in the world`);
    if (c.place && !PLACE_IDS.has(c.place)) f('error', 'chatter-place', `${w}: place "${c.place}"`);
    for (const p of c.phase || []) if (!PHASES.includes(p)) f('error', 'chatter-phase', `${w}: phase "${p}"`);
    checkReq(w, c.requires);
    checkBeats(w, c.beats);
    for (const b of c.beats || []) { const who = b.who ?? b[0]; if (!(c.cast || []).includes(who)) f('error', 'chatter-who', `${w}: "${who}" speaks but is not in cast`); }
  }
  if (CHATTER.length < 40) f('warn', 'chatter-count', `${CHATTER.length} chatter exchanges; the plan asks for 40+`);

  // --- the phone ---
  let last = '10:00';
  for (const x of FEED_TIMELINE) {
    if (!HHMM.test(x.at || '')) f('error', 'feed-at', `feed "${x.caption?.slice(0, 30)}": at "${x.at}"`);
    if (x.at < last) f('error', 'feed-order', `feed at ${x.at} is out of order`);
    last = x.at;
    if (!x.caption || !x.by) f('error', 'feed', `feed at ${x.at}: needs by and caption`);
    if (x.place && !R.PLACES[x.place]) f('error', 'feed-place', `feed at ${x.at}: place "${x.place}"`);
    checkReq(`feed at ${x.at}`, x.requires);
  }
  const mins = (h) => { const [a, b] = h.split(':').map(Number); return a * 60 + b; };
  const feedTimes = [600, ...FEED_TIMELINE.filter((x) => !x.requires).map((x) => mins(x.at)), 1080];
  const gap = Math.max(...feedTimes.slice(1).map((t, i) => t - feedTimes[i]));
  if (gap > 5) f('warn', 'feed-gap', `the feed goes ${gap} game minutes without an unconditional post; the plan asks for one every ≤5`);
  last = '10:00';
  for (const x of CHAT_TIMELINE) {
    if (!HHMM.test(x.at || '')) f('error', 'chat-at', `chat at "${x.at}"`);
    if (x.at < last) f('error', 'chat-order', `chat at ${x.at} is out of order`);
    last = x.at;
    checkReq(`chat at ${x.at}`, x.requires);
    for (const [who, text] of x.msgs || []) if (!who || !text) f('error', 'chat-msg', `chat at ${x.at}: empty message`);
  }
  if (CHAT_TIMELINE.length < 60) f('warn', 'chat-count', `${CHAT_TIMELINE.length} chat timeline entries; the plan asks for 60+`);

  // --- officers ---
  for (const id of ['sharma', 'c1', 'c2', 'c3', 'c4', 'c5', 'raf']) {
    const p = PESTER_BY[id];
    if (!p) { f('warn', 'pester-by', `PESTER_BY.${id} missing; the shared PESTER table is used`); continue; }
    for (const how of ['career', 'cute', 'cannon', 'detainme']) {
      if (!p.say?.[how]) f('warn', 'pester-by', `PESTER_BY.${id}.say.${how} missing`);
      for (const m of ['bored', 'amused', 'soft']) if (!(p[how]?.[m]?.length >= 2)) f('warn', 'pester-by', `PESTER_BY.${id}.${how}.${m} needs 2+ lines`);
    }
    if (!(p.annoyed?.length >= 2)) f('warn', 'pester-by', `PESTER_BY.${id}.annoyed needs 2+ lines`);
  }
  return out;
}

export function storyCounts() {
  const talks = Object.values(TALKS).reduce((n, l) => n + l.length, 0);
  return {
    situations: Object.keys(SITUATIONS).length,
    conversations: talks,
    reacts: Object.values(REACTS).reduce((n, r) => n + Object.keys(r).length, 0),
    brushoffs: Object.values(BRUSHOFF).reduce((n, l) => n + l.length, 0),
    chatter: CHATTER.length,
    feed: FEED_TIMELINE.length,
    chat: CHAT_TIMELINE.length,
  };
}
