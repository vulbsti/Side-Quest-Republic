// Conversations, reactions, brush-offs, chatter and per-officer pester lines, merged from story/.
// Format: plans/story-rebuild.md, "Conversations". The engine is story.js (and pester() in rules.js).
import friends from './story/talks-friends.js';
import locals from './story/talks-locals.js';
import police from './story/talks-police.js';
import chatter from './story/chatter.js';

const parts = [friends, locals, police, chatter];
const merge = (k) => Object.assign({}, ...parts.map((p) => p[k] || {}));
export const TALKS = merge('TALKS');
export const REACTS = merge('REACTS');
export const BRUSHOFF = merge('BRUSHOFF');
export const PESTER_BY = merge('PESTER_BY');
export const CHATTER = parts.flatMap((p) => p.CHATTER || []);
// Speakers who are not a body in the world (bus extras, voices on a phone), for the conversation panel.
export const SPEAKERS = {
  player: 'You', mummy: 'Mummy (phone)', crowd: 'Crowd', wireless: 'Wireless', raf: 'RAF jawan',
  uncle: 'Banana uncle', student: 'Student on the bus', fixer: 'The fixer', neta: 'LJM neta', papa: 'Papa (phone)',
  sharma: 'Sharma', c1: 'Yadav', c2: 'Meena', c3: 'Tomar', c4: 'Rawat', c5: 'Gill', r1: 'Pandey',
};
