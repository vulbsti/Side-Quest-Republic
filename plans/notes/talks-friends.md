# Notes: talks-friends (Kabir, Nikhil, Meera, Zoya, Mira, Dev)

File: `dist/loop/story/talks-friends.js`. Test: `node tests/test-talks-friends.mjs`.

Counts: 81 conversations (kabir 17, nikhil 14, meera 14, zoya 13, mira 12, dev 11), at least 2 per person
per phase. REACTS: 12–15 kinds each (79 in all). BRUSHOFF: 9–10 distinct lines each.

## Memory hooks (requires)
- `did`: mummy-call (Kabir, priority 10), naye-joote (Nikhil), speaker-run and mira-mic (Mira), dhuan (Nikhil),
  career-counselling (an option in Kabir's set talk).
- `rep.aura >= 40` (viral): Meera's "tu viral hai", Zoya's interview.
- `holds: ['filmed:provocateur-exposed']`: Meera missed it, Zoya wants the raw file.
- `holding`: megaphone (Kabir, Dev), phone (Zoya), water (an option for Kabir in the smoke).
- `with`: nikhil (Kabir's reunion, which does `nikhil:found`), kabir (showdown).
- Flags set here and read back later in this file: kabir-material, cover-for-kabir, kabir-has-mic,
  meera-promise, nikhil-slogan, meera-posted-raw / meera-to-zoya / meera-kept-filming, mummy-knows-truth.
- Flags set here that the engine already reads: `kabir-curfew-16` (Kabir: "be home by four").
- Flags other writers may want: heard-teen-baje-pathar, nikhil-took-charger, nikhil-pulled-away, nikhil-belongs,
  zoya-has-raw, zoya-source, dev-delegate, dev-knows-noshow, photobomb-neta, player-signed-form, meera-archived.

## What I need from the engine
1. **A lost Nikhil no longer follows you when you talk to him.** rules.js only sets `mode = 'follow'` in the
   old talk path, which never runs now that story.talk() returns something for Nikhil. Inside `nikhil-lost`
   the situation handles it; outside it (the window missed, `nikhil-lost-again`, separated in the charge)
   nothing does. My Nikhil talks have `follow:nikhil` options as a stopgap. Wanted: either talk() makes a
   lost Nikhil follow before playing a conversation, or a predicate `mode:<who>:<mode>` for `requires.holds`
   so I can write a "lost Nikhil" conversation.
2. **Old TALK hints are gone.** talkLine() revealed hints (`dev-minister`, `asha-biryani`) that unlock
   rumours for whispering. Story talks bypass it. Dev's "Ask him about the minister" sets flag
   `heard-dev-minister`; the engine could treat that flag as the `dev-minister` unlock (or a do-action
   `hint:<id>` could exist).
3. `big-speech` / `small-speech` are emitted through a ternary, so the checker's HAPPEN set misses them and
   no one can react to Mira's speech. Either list them in the checker's extra kinds or split the call.
4. A `leave` beat list on talks (not just situation nodes) would let people say something when you walk off.

## Not mine, seen while testing
`node tests/test-loop.mjs` fails at "Kabir is still here to take it" with or without this file: at 10:05
talking to Nikhil opens the `nikhil-lost` situation instead of making him follow, so Nikhil never reaches
Kabir and Kabir leaves at 14:00.
