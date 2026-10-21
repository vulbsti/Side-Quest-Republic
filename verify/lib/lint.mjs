// The linter: checks on the system map that need no game running.
// Each finding is { level: 'error' | 'warn' | 'info', id, msg }. Errors fail `npm run verify`.
import { readFileSync } from 'node:fs';
import { CLIENT_FILES } from './map.mjs';
import { storyCheck } from './story-check.mjs';

const ROOT = new URL('../../', import.meta.url);
const client = CLIENT_FILES.map((f) => readFileSync(new URL(f, ROOT), 'utf8')).join('\n');

export const LINT_RULES = {
  'cue-unhandled': 'Every cue the engine emits is drawn, played or posted by the client',
  'link-unknown': 'Every chaos-board link the engine emits is on the board (content.js LINKS)',
  'link-unused': 'Every link on the board can be emitted by the engine',
  'callback-unknown': 'Every ending-card callback the engine records has text (content.js CALLBACKS)',
  'callback-unused': 'Every callback text can be recorded by the engine',
  'line-unused': 'Every line in content.js LINES can be said',
  'line-empty': 'A line key that is emitted has something to say',
  'talk-state-missing': 'Every situation talkState() can return has its own line for that person',
  'talk-thin': 'Each person has at least 2 lines per situation and 4 "again" lines before repeating',
  'officers-share-lines': 'Constables and RAF jawans have their own lines, not one shared table',
  'raw-code': 'Messages the client toasts for a refused command are words, not codes',
  'intent-unknown': 'Every HUD intent the engine asks for has text (content.js INTENTS)',
  'field-unread': 'Every state field the engine writes is read by a rule, a verb or the client',
  'situation-choices': 'Every situation choice point offers at least two choices',
  'story': 'The story content matches its format (npm run story:check: ids, actions, goals, links, counts)',
};

export function lint(map) {
  const out = [], f = (level, id, msg) => out.push({ level, id, msg });
  for (const c of map.cues) if (!c.handledBy.length) f('error', 'cue-unhandled', `cue "${c.id}" has no handler in the client`);
  for (const l of map.linksEmittedUnknown) f('error', 'link-unknown', `link "${l}" is emitted but not on the board`);
  for (const l of map.links) if (!l.emitted) f('warn', 'link-unused', `board link "${l.id}" is never emitted`);
  for (const c of map.callbacksUnknown) f('error', 'callback-unknown', `callback "${c}" is recorded but has no text`);
  for (const c of map.callbacks) if (!c.called) f('warn', 'callback-unused', `callback "${c.id}" is never recorded`);
  for (const l of map.lines) {
    if (!l.emitted) f('warn', 'line-unused', `line "${l.id}" is never said`);
    else if (!l.speakers.length) f('info', 'line-empty', `line "${l.id}" is emitted but empty`);
  }
  for (const [who, t] of Object.entries(map.talk)) {
    for (const st of t.states) if (!t.statesWithLines.includes(st)) f('warn', 'talk-state-missing', `${who} has no line for the situation "${st}" and falls back to default`);
    const per = t.lines / Math.max(1, t.statesWithLines.length);
    if (per < 2 || t.again < 4) f('warn', 'talk-thin', `${who}: ${t.lines} lines over ${t.statesWithLines.length} situations, ${t.again} "again" lines, then the same line forever`);
  }
  if (!map.pester.perOfficer) f('warn', 'officers-share-lines', `all ${map.entities.officers.length - 1 + 6} officers share one table of ${map.pester.responses} pester lines`);
  for (const code of map.sayCodes) {
    const shownAsText = new RegExp(`['"]${code}['"]\\s*:\\s*['"\`]`).test(client); // a { code: 'words' } table in the client
    if (!shownAsText) f('error', 'raw-code', `the client would toast "${code}" as is (no words for it)`);
  }
  const defined = new Set(map.intents.defined);
  for (const k of map.intents.used) if (!defined.has(k)) f('error', 'intent-unknown', `intent "${k}" has no text`);
  const reads = new Set(Object.values(map.access || {}).flatMap((a) => a.reads));
  const writes = new Set(Object.values(map.access || {}).flatMap((a) => a.writes));
  for (const w of [...writes].sort()) {
    if (reads.has(w) || [...reads].some((r) => r.startsWith(w + '.'))) continue;
    if (!map.clientMentions(w)) f('info', 'field-unread', `"${w}" is written but nothing reads it`);
  }
  for (const sc of map.situations) for (const n of sc.nodes) if (n.options.length === 1) f('warn', 'situation-choices', `situation "${sc.id}" node "${n.id}" has 1 choice`);
  for (const x of storyCheck()) f(x.level, 'story', `${x.id}: ${x.msg}`);
  return out;
}
