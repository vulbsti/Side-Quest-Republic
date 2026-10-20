// The system map: everything the game is made of, read out of the code itself, so it can't drift.
//   entities, verbs, rules, routines, cues, lines, links, callbacks, endings, talk states, content tables,
//   and for each rule, routine and verb the state it reads and writes (recorded by playing days through a
//   proxy). The linter (lint.mjs) and the report read this map; map.html draws it.
import { readFileSync } from 'node:fs';
import * as H from './harness.mjs';
import * as C from '../../dist/loop/content.js';
import { SCENES } from '../../dist/loop/scenes.js';
import * as PH from '../../dist/loop/phone.js';
import { rng } from './explore.mjs';

const { R } = H;
const ROOT = new URL('../../', import.meta.url);
const src = (p) => readFileSync(new URL(p, ROOT), 'utf8');
export const CLIENT_FILES = ['dist/loop/main.js', 'dist/loop/props.js', 'dist/loop/audio.js', 'dist/loop/cinematic.js', 'dist/loop/phone-ui.js', 'dist/loop/present.js'];

// --- reading the source -----------------------------------------------------------

/** Quoted strings used as values, not ones compared against (`x === 'dev' ? null : 'megaphone-given'`). */
const values = (expr) => [...expr.matchAll(/(=== |!== |\[)?'([^']+)'/g)].filter((m) => !m[1]).map((m) => [m[0], m[2]]);

/** The first argument of every call to fn(s, ...): its quoted strings, and templates as regexes. */
function callArgs(code, fn) {
  const out = { literal: new Set(), patterns: [] };
  const re = new RegExp(`\\b${fn}\\(s, `, 'g');
  let m;
  while ((m = re.exec(code))) {
    let i = m.index + m[0].length, depth = 0, q = null, arg = '';
    for (; i < code.length; i++) {
      const ch = code[i];
      if (q) { arg += ch; if (ch === q && code[i - 1] !== '\\') q = null; continue; }
      if (ch === "'" || ch === '"' || ch === '`') { q = ch; arg += ch; continue; }
      if (ch === '(' || ch === '[' || ch === '{') depth++;
      if (ch === ')' || ch === ']' || ch === '}') { if (depth === 0) break; depth--; }
      if (ch === ',' && depth === 0) break;
      arg += ch;
    }
    for (const [, str] of values(arg)) out.literal.add(str);
    for (const [, tpl] of arg.matchAll(/`([^`]+)`/g)) out.patterns.push(new RegExp('^' + tpl.replace(/[.*+?^()|[\]\\]/g, '\\$&').replace(/\$\{[^}]+\}/g, '.+') + '$'));
  }
  return out;
}
const matches = (args, key) => args.literal.has(key) || args.patterns.some((p) => p.test(key));

// --- recording reads and writes -----------------------------------------------------

const SKIP = /^(events|cues|history|fired|recent|t|memo\.[^.]+\.t)$/;
function norm(path) {
  const segs = path.split('.').map((x) => (/^\d+$/.test(x) ? '[]' : x));
  // people.ravi.mode, objects.key.holder, officers.c1.mood: keep the id; arrays and maps of runtime ids collapse
  if (['crew', 'exposure'].includes(segs[0]) || segs[2] === 'exposure') return segs.slice(0, 1).join('.');
  if (segs[0] === 'rumours') return segs.slice(0, 3).join('.');
  if (segs[0] === 'officers') return ['officers', '*', ...segs.slice(2, 3)].join('.');
  if (segs[0] === 'provocateurs') return ['provocateurs', ...segs.slice(2, 3)].join('.');
  return segs.slice(0, 3).join('.');
}
const TARGET = Symbol('target');
function recorder() {
  const reads = new Set(), writes = new Set();
  const cache = new WeakMap();
  const unwrap = (v) => (v && typeof v === 'object' && v[TARGET] ? v[TARGET] : v);
  const deep = (v) => (Array.isArray(v) ? v.map((x) => unwrap(x)) : unwrap(v));
  function wrap(obj, path) {
    if (obj === null || typeof obj !== 'object') return obj;
    let byPath = cache.get(obj);
    if (!byPath) cache.set(obj, (byPath = new Map()));
    if (byPath.has(path)) return byPath.get(path);
    const p = new Proxy(obj, {
      get(t, k) {
        if (k === TARGET) return t;
        const v = t[k];
        if (typeof k === 'symbol' || typeof v === 'function') return v;
        const np = path ? `${path}.${k}` : String(k);
        const n = norm(np);
        if (!SKIP.test(n.split('.')[0])) reads.add(n);
        return wrap(v, np);
      },
      set(t, k, v) { const n = norm(path ? `${path}.${k}` : String(k)); if (!SKIP.test(n.split('.')[0])) writes.add(n); t[k] = deep(v); return true; },
      deleteProperty(t, k) { writes.add(norm(path ? `${path}.${k}` : String(k))); delete t[k]; return true; },
    });
    byPath.set(path, p);
    return p;
  }
  return { reads, writes, wrap: (s) => wrap(s, '') };
}

/** Play a few days with every rule, routine and verb running through a recording proxy. */
function recordAccess({ days = 3, seed = 3 } = {}) {
  const access = {}; // label -> { reads:Set, writes:Set }
  const get = (label) => (access[label] ??= { reads: new Set(), writes: new Set() });
  const restore = [];
  const instrument = (obj, key, label, every = 1) => {
    const orig = obj[key];
    let n = 0;
    obj[key] = function (s, ...rest) {
      if (every > 1 && n++ % every) return orig.call(this, s, ...rest);
      const rec = recorder(), out = orig.call(this, rec.wrap(s), ...rest), a = get(label);
      for (const r of rec.reads) a.reads.add(r);
      for (const w of rec.writes) a.writes.add(w);
      return out;
    };
    restore.push(() => { obj[key] = orig; });
  };
  for (const rule of R.RULES) { instrument(rule, 'when', `rule:${rule.id}`, 7); instrument(rule, 'then', `rule:${rule.id}`); }
  R.SCHEDULE.forEach((e, i) => instrument(e, 2, `routine:${String(e[0]).padStart(2, '0')}:${String(e[1]).padStart(2, '0')}#${i}`));
  const rand = rng(seed);
  try {
    for (let d = 0; d < days; d++) {
      const run = H.newRun('slice');
      while (!run.s.over) {
        const affs = R.affordances(run.s).filter((a) => a.cmd);
        if (!affs.length || rand() < 0.35) { H.waitMinutes(run, 5 + Math.floor(rand() * 20)); continue; }
        const kinds = [...new Set(affs.map((a) => a.kind))];
        const kind = kinds[Math.floor(rand() * kinds.length)];
        const list = affs.filter((a) => a.kind === kind), a = list[Math.floor(rand() * list.length)];
        run.act = (s, cmd) => {
          const rec = recorder(), acc = get(`verb:${cmd.type}`), r = R.act(rec.wrap(s), cmd);
          for (const x of rec.reads) acc.reads.add(x);
          for (const w of rec.writes) acc.writes.add(w);
          return r;
        };
        H.perform(run, { do: a.id, cmd: a.cmd, at: a.at });
      }
    }
  } finally { for (const f of restore) f(); }
  return Object.fromEntries(Object.entries(access).map(([k, v]) => [k, { reads: [...v.reads].sort(), writes: [...v.writes].sort() }]));
}

// --- the map -------------------------------------------------------------------------

export function buildMap({ record = true } = {}) {
  const rules = src('dist/loop/rules.js');
  const client = Object.fromEntries(CLIENT_FILES.map((f) => [f, src(f)]));
  const clientAll = Object.values(client).join('\n');
  const emits = callArgs(rules, 'emit'), cues = callArgs(rules, 'cue'), callbacks = callArgs(rules, 'callback'), happens = callArgs(rules, 'happen');
  const links = new Set([...rules.matchAll(/link: ([^,}]+)/g)].flatMap(([, e]) => values(e).map((x) => x[1])));
  const quoted = (k) => rules.includes(`'${k}'`); // passed through a helper, e.g. releasePlayer(s, 'plead-works')
  const intentsUsed = { literal: new Set([...rules.matchAll(/\bI\('([\w-]+)'/g)].map((m) => m[1])), patterns: [...rules.matchAll(/\bI\(`([^`]+)`/g)].map(([, t]) => new RegExp('^' + t.replace(/\$\{[^}]+\}/g, '.+') + '$')) };
  const linesUsedDirect = new Set([...rules.matchAll(/LINES\['([\w-]+)'\]/g)].map((m) => m[1]));
  const verbs = [...new Set([...rules.matchAll(/cmd\.type === '(\w+)'/g)].map((m) => m[1]))];
  const sayCodes = [...new Set([...rules.matchAll(/say: '([a-z-]+)'/g)].map((m) => m[1]))];
  const talkBody = rules.slice(rules.indexOf('export function talkState'), rules.indexOf('export function moods'));
  const talkStates = {};
  let who = null;
  for (const line of talkBody.split('\n')) {
    const w = line.match(/if \(who === '(\w+)'\)/) || line.match(/if \(\['([\w', ]+)'\]\.includes\(who\)/);
    if (w) who = w[1].includes("'") ? w[1].split("', '") : [w[1]];
    for (const [, st] of line.matchAll(/return '([\w-]+)'/g)) for (const p of who || []) (talkStates[p] ??= new Set()).add(st);
  }
  const cueNames = [...cues.literal].sort();
  const handled = Object.fromEntries(cueNames.map((c) => [c, CLIENT_FILES.filter((f) => client[f].includes(`'${c}'`)).map((f) => f.split('/').pop()).concat(PH.CHAT[c] ? ['phone.js CHAT'] : [])]));
  const map = {
    entities: {
      people: Object.keys(R.createDay().people),
      officers: [...Object.keys(R.createDay().officers), 'r1–r6 (from 14:00)'],
      objects: Object.keys(R.createDay().objects),
      places: Object.keys(R.PLACES),
      groups: Object.keys(R.createDay().groups),
      rumours: Object.keys(C.RUMOURS),
    },
    verbs,
    rules: R.RULES.map((r) => ({ id: r.id, says: r.says, repeat: !!r.repeat })),
    routines: R.SCHEDULE.map(([h, m, fn], i) => ({ id: `routine:${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}#${i}`, at: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`, does: (fn.toString().match(/=> \{?\s*([\s\S]{0,90})/)?.[1] || '').replace(/\s+/g, ' ').trim() })),
    cues: cueNames.map((c) => ({ id: c, handledBy: handled[c] })),
    lines: Object.keys(C.LINES).map((k) => ({ id: k, speakers: C.LINES[k].map(([w]) => w), emitted: matches(emits, k) || linesUsedDirect.has(k) || quoted(k) })),
    emitted: { literal: [...emits.literal].sort(), patterns: emits.patterns.map(String) },
    links: Object.keys(C.LINKS).map((k) => ({ id: k, from: C.LINKS[k].from, to: C.LINKS[k].to, emitted: links.has(k) })),
    linksEmittedUnknown: [...links].filter((l) => !C.LINKS[l]).sort(),
    callbacks: Object.keys(C.CALLBACKS).map((k) => ({ id: k, called: matches(callbacks, k) || quoted(k) })),
    callbacksUnknown: [...callbacks.literal].filter((k) => !C.CALLBACKS[k]).sort(),
    happenings: [...happens.literal].sort(),
    endings: Object.keys(C.ENDINGS),
    outcomes: Object.keys(C.SHOWDOWNS),
    roles: Object.keys(C.ROLES),
    scenes: Object.entries(SCENES).map(([id, sc]) => ({ id, options: sc.options.map((o, i) => ({ i, intent: o.intent })) })),
    talk: Object.fromEntries(Object.keys(C.TALK).map((p) => [p, {
      lines: C.TALK[p].length, again: (C.AGAIN[p] || []).length,
      states: [...(talkStates[p] || [])].sort(),
      statesWithLines: [...new Set(C.TALK[p].map((t) => t.when))].sort(),
    }])),
    pester: { hows: Object.keys(C.PESTER.say), responses: Object.values(C.PESTER).flatMap((v) => (Array.isArray(v) ? v : typeof v === 'object' ? Object.values(v).flat() : [])).length, perOfficer: false },
    intents: { defined: Object.keys(C.INTENTS), used: [...intentsUsed.literal], usedPatterns: intentsUsed.patterns.map(String) },
    sayCodes,
    phone: { chatTriggers: Object.keys(PH.CHAT), tickerPhases: Object.keys(PH.TICKER), realReels: PH.REAL_REELS.length, captions: Object.keys(PH.CAPTIONS) },
    content: {
      barks: Object.values((src('dist/loop/barks.js').match(/'[^']{12,}'/g) || [])).length,
      sceneBeats: Object.values(SCENES).reduce((n, sc) => n + sc.beats.length, 0),
      talkLines: Object.values(C.TALK).flat().length,
      againLines: Object.values(C.AGAIN).flat().length,
      lines: Object.keys(C.LINES).length,
      ambient: C.AMBIENT.length,
    },
  };
  map.clientMentions = (field) => clientAll.includes('.' + field.split('.').pop());
  if (record) map.access = recordAccess();
  return map;
}

/** Cause and effect: who writes a field that a rule's trigger reads. */
export function causeGraph(map) {
  const edges = [];
  const access = map.access || {};
  const writers = {};
  for (const [label, a] of Object.entries(access)) for (const w of a.writes) (writers[w] ??= new Set()).add(label);
  for (const [label, a] of Object.entries(access)) {
    if (!label.startsWith('rule:')) continue;
    for (const r of a.reads) for (const w of writers[r] || []) if (w !== label) edges.push({ from: w, to: label, via: r });
  }
  return edges;
}
