// Intended routes: the designer's claims about how a player reaches each outcome, written as plans a
// real player could follow (they walk everywhere; witnesses are whoever can actually see them).
// tests/test-loop.mjs proves the rules with teleports and hand-picked witnesses; these prove a player can
// get there. verify/run.mjs runs every route, seeds the explorer with them, and reports each route whose
// `expects` no longer happens. When the story changes, change the route here and say why.
import { E } from './engine.mjs';

const S = E.SPOTS;
const until = (clock) => ({ op: 'until', clock });
const go = (to) => ({ op: 'go', to });
const follow = (id) => ({ op: 'go', follow: id });
const act = (cmd) => ({ op: 'act', cmd });
const take = (object) => [follow(object), act({ type: 'take', object })];
const give = (to) => [follow(to), act({ type: 'give', to })];
const talk = (to) => [follow(to), act({ type: 'talk', to })];
const whisper = (to, rumour) => [follow(to), act({ type: 'whisper', to, rumour })];
const pester = (to, how) => [follow(to), act({ type: 'pester', to, how })];
const drop = () => act({ type: 'drop' });
const CP_EDGE = { x: -6, z: -45 }; // where a dropped speaker turns CP into a party
// A real player can't teleport, but can walk over early and loiter: routes do that before a timed grab.
const early = (spot, clock) => [go(spot), until(clock)];
const nikhilToKabir = [...talk('nikhil'), go(S.metroPath), go({ x: -3, z: -1 })];

export const ROUTES = {
  'speaker-gone': { expects: ['ending:quiet', 'link:small-speech'], plan: [...early(S.chai, '10:05'), ...take('speaker'), go(S.metro)] },
  'key-to-march': { expects: ['ending:march', 'link:key-missing', 'link:cp-piles-up', 'link:rao-sends-sharma', 'link:march'],
    plan: [...early(S.busDoor, '11:05'), ...take('key'), go(S.metro)] },
  'key-caught': { expects: ['link:chase', 'link:detained'], plan: [...early(S.busDoor, '11:05'), ...take('key')] },
  'key-returned': { expects: ['link:key-returned', 'link:rao-recalls'],
    plan: [...early(S.busDoor, '11:05'), ...take('key'), go(S.metro), until('12:30'), ...give('iqbal')] },
  'speaker-and-key-cpjam': { expects: ['ending:cpjam'],
    plan: [...early(S.chai, '10:05'), ...take('speaker'), go(S.metro), drop(), ...early(S.busDoor, '11:05'), ...take('key'), go(S.metro)] },
  'speaker-party': { expects: ['link:cp-party', 'link:rao-sends-sharma', 'link:sharma-kills-party', 'link:rao-recalls'],
    plan: [...early(S.chai, '10:05'), ...take('speaker'), go(CP_EDGE), drop(), go(S.metro)] },
  'phone-scare-ghost': { expects: ['ending:ghost', 'link:phone-missing', 'link:cannon-scare'],
    plan: [...early(S.phoneCart, '13:12'), ...take('phone'), go(S.metro), until('14:20'), ...whisper('mira', 'cannon')] },
  'phone-returned': { expects: ['link:phone-returned'],
    plan: [...early(S.phoneCart, '13:12'), ...take('phone'), go(S.chai), until('13:18'), ...give('zoya')] }, // before she gives chase
  'meera-biryani': { expects: ['link:meera-amplifies', 'link:biryani-rush'], plan: [until('12:10'), ...whisper('meera', 'biryani')] },
  'biryani-ending': { expects: ['ending:biryani'],
    plan: [...early(S.chai, '10:05'), ...take('speaker'), go(S.metro), drop(), ...early(S.busDoor, '11:05'), ...take('key'), go(S.metro), until('12:05'), ...whisper('mira', 'biryani')] },
  'megaphone-singalong': { expects: ['ending:singalong', 'link:megaphone-given', 'link:mira-megaphone', 'link:singalong-line'],
    plan: [until('14:20'), ...take('megaphone'), ...give('mira'), go(S.metro)] },
  'minister-viral': { expects: ['ending:viral', 'link:minister-wait', 'link:clash-live'], plan: [until('10:10'), ...whisper('dev', 'minister')] },
  'minister-no-phone': { expects: ['ending:scuffle'],
    plan: [until('10:10'), ...whisper('dev', 'minister'), ...early(S.phoneCart, '13:12'), ...take('phone'), go(S.metro)] },
  'minister-no-megaphone': { expects: ['ending:noshow'],
    plan: [until('10:10'), ...whisper('dev', 'minister'), until('14:20'), ...take('megaphone'), go(S.metro)] },
  'water-hidden-heat': { expects: ['ending:heat'], plan: [until('12:00'), ...take('water'), go(S.metro), drop()] },
  'kabir-roast': { expects: ['ending:roast', 'link:nikhil-finds-kabir', 'link:kabir-roast'],
    plan: [until('10:05'), ...nikhilToKabir, until('14:20'), ...take('megaphone'), ...give('kabir'), go(S.metro)] },
  'soft-sharma-cannon': { expects: ['link:cannon-dance'],
    plan: [until('10:20'), ...pester('sharma', 'career'), ...pester('sharma', 'cute'), ...pester('c1', 'cannon')] },
};

/** Parses 'ending:x' / 'link:x' / 'rule:x' expectations against a finished run. */
export function unmet(route, run) {
  const have = { ending: [run.s.ending], link: [...run.links], rule: [...run.fired] };
  return route.expects.filter((e) => { const [k, id] = e.split(':'); return !have[k].includes(id); });
}
