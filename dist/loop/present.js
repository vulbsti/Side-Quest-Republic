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
// The 10-minute day (dares.js) reads less: a bystander's line longer than a bark waits until you stop, and the phone
// buzzes with one line at a time (the rest is there when you open it).
export const BARK_WORDS = 6; // a bark: six words or fewer
export const PHONE_GAP = 30; // real seconds between phone lines shown on screen in the 10-minute day
export const BANTER_NEAR = 10; // metres: a longer line plays to a player who has stopped this close to it...
export const BANTER_STILL = 1.5; // ...and has been standing still this many seconds
// Lines that answer the player's own command show whatever the player is doing (they asked).
const ANSWER = /^(pester-|whisper|officer-annoyed|travel|trouble-)/;
const wordsIn = (text) => String(text ?? '').split(/\s+/).filter(Boolean).length;

const PHONE_KIND = { wireless: 'wireless', feed: 'feed', stream: 'stream', chat: 'chat', ticker: 'ticker' };
export const PHONE_KINDS = new Set(['wireless', 'feed', 'stream', 'chat', 'ticker']);

/**
 * Route one engine event to the screen.
 * view: {
 *   now: day time, player: { x, z, visible }, place: the PLACES id the player stands in (or null),
 *   body(id): { x, z, visible } | null   a named person's body,
 *   officer(id): { x, z, visible } | null   a constable or RAF body,
 *   policeNear(range): bool   any visible officer (or Sharma) within range of the player,
 *   slice: bool   the three-minute slice is running (its lines have their own channel; the phone is away),
 *   day: bool   the 10-minute day (dares.js): barks only while the player moves, one phone line at a time,
 *   moving: bool   the player is on the move,
 *   still: seconds the player has stood still,
 *   screen: {}   memory the caller keeps for the whole day (when the last phone line showed),
 * }
 * Returns { kind, channel, seen, learn }.
 *   channel: 'convo' | 'radio' | 'feed' | 'stream' | 'chat' | 'ticker' | 'bark' | 'player' | 'bubble' | 'officer' | 'toast' | 'slice' | 'none'
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
  // The three-minute slice (slice.js): its own short lines go to the slice HUD; the phone, the wireless and the
  // street's long narration stay off the screen.
  if (kind === 'slice') return { kind, channel: 'slice', seen: !!e.text, learn };
  if (v.slice && (onPhone || kind === 'wireless' || e.who === 'street')) return { kind, channel: 'none', seen: false, learn, why: 'slice' };
  // ...and the player only says the slice's own lines: the reel's caption already says how a chase went.
  if (v.slice && e.who === 'player' && !/^(slice-|travel)/.test(String(e.key))) return { kind, channel: 'none', seen: false, learn, why: 'slice' };
  const inView = (b) => !!b && b.visible !== false && dist(p, b) <= BUBBLE_RANGE;
  // A conversation's beats are on screen while you're in it (the options card, the reel frame, bubbles).
  if (kind === 'beat') return { kind, channel: 'convo', seen: !!e.text, learn: !!e.link };
  // The 10-minute day: a long line is not read while you run past; it plays when you have stopped near it.
  if (v.day && (!onPhone || kind === 'wireless') && wordsIn(e.text) > BARK_WORDS && !ANSWER.test(String(e.key))) {
    const from = e.who === 'player' ? p : kind === 'wireless' ? (v.policeNear(BANTER_NEAR) ? p : null) : body ?? v.officer(e.who) ?? e.pos;
    if (v.moving || (v.still ?? Infinity) < BANTER_STILL || !from || dist(p, from) > BANTER_NEAR) return { kind, channel: 'none', seen: false, learn, why: 'moving' };
  }
  if (kind === 'wireless') return { kind, channel: 'radio', seen: v.policeNear(RADIO_RANGE), learn };
  if (onPhone) { const r = routePhone(e, v); return { kind, channel: r.channel === 'buzz' ? 'buzz' : kind, seen: r.seen, learn, why: r.why, text: r.text }; }
  if (kind === 'bark') return { kind, channel: 'bark', seen: !!e.pos && dist(p, e.pos) <= BUBBLE_RANGE, learn };
  if (e.who === 'player' && e.text) return { kind, channel: 'player', seen: p.visible !== false, learn };
  if (body) return { kind, channel: 'bubble', seen: inView(body), learn };
  const o = v.officer(e.who);
  if (o) return { kind, channel: 'officer', seen: inView(o), learn };
  if (e.who === 'street' && e.text && heard) return { kind, channel: 'toast', seen: true, learn };
  return { kind, channel: 'none', seen: false, learn, why: e.text ? 'out of earshot' : 'no text' };
}

/**
 * A phone post (an engine chat/feed/ticker/stream line, or one the client adds for a cue): does its text reach the
 * screen? On the 10-minute day the phone buzzes and shows one line; more within PHONE_GAP seconds are a buzz only.
 * Returns { channel: 'phone' | 'buzz', seen, text }: text is what shows (the first six words, on the 10-minute day).
 */
export function routePhone(e, v) {
  if (!v.day) return { channel: 'phone', seen: true };
  const mem = v.screen ?? {}, t = e.t ?? v.now;
  if (mem.phoneAt != null && t - mem.phoneAt < PHONE_GAP && t >= mem.phoneAt) return { channel: 'buzz', seen: false, why: 'buzz' };
  mem.phoneAt = t;
  const words = String(e.text ?? '').split(/\s+/).filter(Boolean);
  return { channel: 'phone', seen: true, text: words.length > BARK_WORDS ? words.slice(0, BARK_WORDS).join(' ') + '…' : e.text };
}
/** A bubble the client makes up on its own (ambient chatter, crowd barks): may it show right now? */
export function allowBubble(text, v) {
  return !v.day || wordsIn(text) <= BARK_WORDS || (!v.moving && (v.still ?? Infinity) >= BANTER_STILL);
}

/** A view of the engine state alone, as the verifier uses it: bodies stand where the engine puts them. */
export function engineView(s, placeAt, { moving = false, still = Infinity, screen = undefined } = {}) {
  const P = s.people;
  const playerVisible = true; // detained, the player is drawn seated in the vehicle
  const officers = () => [P.sharma, ...Object.values(s.officers)].filter((o) => !o.hidden);
  return {
    now: s.t,
    slice: !!s.slice,
    day: !!s.mischief,
    moving,
    still,
    screen,
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
