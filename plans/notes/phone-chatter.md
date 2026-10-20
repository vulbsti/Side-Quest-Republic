# Notes: phone timeline and chatter (phone-chatter workstream)

Files: `dist/loop/phone-timeline.js` (FEED_TIMELINE, CHAT_TIMELINE), `dist/loop/story/chatter.js` (CHATTER),
test `tests/test-phone-chatter.mjs`.

## Flags and situations this content reads
- Flags: `nikhil-found`, `nikhil-left` (nikhil-lost), `kabir-stays`, `cannon-requested`, `raf-muzaffarpur`,
  `separated`, `crewDetained`, `senaCalled`, `name-in-register`, `water-delivered`.
- `did`: nikhil-lost, chabi, career-counselling, speaker-run, mira-mic, afwaah, naye-joote, dhuan.
- Rep: heat 60, aura 50, nuisance 30 (aftermath/morning feed posts).
- Kabir's chat has two versions at 13:49, 14:04, 14:18, 16:07: stays (`kabir-stays` or `nikhil-found`,
  matching rules.js 14:00) or goes home.

## Engine asks (nothing blocking)
1. `requires.notDid: [situation ids]`: today "only if X was NOT done" needs a flag from the situation writer.
2. `requires` can't read `s.speech` ('big'|'small') or `s.moment` ('singalong'|'roast'), so the noon-speech
   and 15:30 megaphone posts are written neutrally. A `world: { speech: 'big' }` key, or flags set by
   startSpeech/megaphoneMoment (`speech-big`, `moment-roast`), would let the feed and chat react.
3. CHATTER plays the first matching exchange in array order. Near the stage several pairs qualify at once;
   picking the one whose cast is closest to the player would make it feel more like overhearing.
4. The client feed card uses `e.key` as the thumbnail label (`feed:feed-suv`); `kind` (news, meme,
   it-cell, forward...) would read better there.
