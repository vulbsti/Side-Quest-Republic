// What the player actually sees or hears of the engine's events: one place decides, and both the 3D
// client (main.js) and the verifier (verify/) ask it. So the verifier's idea of "the screen" is the
// client's, and a line that is said where nobody can hear it shows up as unseen in both.
// Pure module: no DOM, no Three.js.
// It imports no engine module, so the client and the verifier can each hand it their own copy.
import { CHAT, TICKER, REAL_REELS } from './phone.js';

const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

export const HEAR = 26; // you hear a line said within this many metres, or at the place you stand
export const BUBBLE_RANGE = 30; // speech bubbles further than this are not drawn
export const RADIO_RANGE = 28; // you overhear the police wireless this close to an officer
export const STALE = 8; // after a time skip, lines older than this many seconds are dropped (the phone keeps them)

const PHONE_KIND = { wireless: 'wireless', feed: 'feed', stream: 'stream', chat: 'chat', ticker: 'ticker' };
export const PHONE_KINDS = new Set(['wireless', 'feed', 'stream', 'chat', 'ticker']);

/**
 * Route one engine event to the screen.
 * view: {
 *   now: day time, player: { x, z, visible }, place: the PLACES id the player stands in (or null),
 *   body(id): { x, z, visible } | null   a named person's body,
 *   officer(id): { x, z, visible } | null   a constable or RAF body,
 *   policeNear(range): bool   any visible officer (or Sharma) within range of the player,
 * }
 * Returns { kind, channel, seen, learn }.
 *   channel: 'radio' | 'feed' | 'stream' | 'chat' | 'ticker' | 'bark' | 'player' | 'bubble' | 'officer' | 'toast' | 'none'
 *   seen: the player can actually notice it (on screen, in range, or on the phone)
 *   learn: the event's chaos-board link is learned
 */
export function routeEvent(e, v) {
  const p = v.player;
  const near = e.pos ? dist(p, e.pos) < HEAR : false;
  const here = !!e.place && v.place === e.place;
  const kind = e.kind && e.kind !== 'line' ? e.kind : (PHONE_KIND[e.who] ?? e.kind ?? null);
  const onPhone = PHONE_KINDS.has(kind);
  const body = v.body(e.who);
  const heard = onPhone || near || here || (!!body && dist(p, body) < HEAR);
  const learn = !!e.link && heard;
  if (!onPhone && v.now - e.t > STALE) return { kind, channel: 'none', seen: false, learn, why: 'stale' };
  const inView = (b) => !!b && b.visible !== false && dist(p, b) <= BUBBLE_RANGE;
  if (kind === 'wireless') return { kind, channel: 'radio', seen: v.policeNear(RADIO_RANGE), learn };
  if (onPhone) return { kind, channel: kind, seen: true, learn };
  if (kind === 'bark') return { kind, channel: 'bark', seen: !!e.pos && dist(p, e.pos) <= BUBBLE_RANGE, learn };
  if (e.who === 'player' && e.text) return { kind, channel: 'player', seen: p.visible !== false, learn };
  if (body) return { kind, channel: 'bubble', seen: inView(body), learn };
  const o = v.officer(e.who);
  if (o) return { kind, channel: 'officer', seen: inView(o), learn };
  if (e.who === 'street' && e.text && heard) return { kind, channel: 'toast', seen: true, learn };
  return { kind, channel: 'none', seen: false, learn, why: e.text ? 'out of earshot' : 'no text' };
}

/** A view of the engine state alone, as the verifier uses it: bodies stand where the engine puts them. */
export function engineView(s, placeAt) {
  const P = s.people;
  const playerVisible = true; // detained, the player is drawn seated in the vehicle
  const officers = () => [P.sharma, ...Object.values(s.officers)].filter((o) => !o.hidden);
  return {
    now: s.t,
    player: { x: s.player.x, z: s.player.z, visible: playerVisible },
    place: placeAt(s.player),
    body: (id) => (P[id] ? { x: P[id].x, z: P[id].z, visible: !P[id].hidden } : null),
    officer: (id) => (s.officers[id] ? { x: s.officers[id].x, z: s.officers[id].z, visible: !s.officers[id].hidden } : null),
    policeNear: (r) => officers().some((o) => dist(o, s.player) < r),
  };
}

/** Phone posts the client adds on its own: group chat lines for a cue, a phase or a flag, the ticker, real reels. */
export const chatFor = (trigger) => CHAT[trigger] || [];
export const tickerFor = (phase) => TICKER[phase] || [];
export const reelsFor = (phase) => REAL_REELS.filter((r) => r.phase === phase);
