# Side Quest Republic — Same Day Again

A 3D browser game about one Gen Z protest day at Jantar Mantar, Delhi. The day runs 10:00–18:00 on its own clock and escalates whether you join in or not: a silly morning, party workers and a counter-group arriving at noon, barricades, RAF and provocateurs in the afternoon, then water cannon, tear gas and a lathi charge. What you do decides where the showdown breaks out, how bad it gets, who the police go after, what the protesters do and when the charge comes. Then the day loops and you wake at the Metro exit again, keeping what you learned on the chaos board.

You can pester police (career advice, "uncle aap cute ho", asking for the water cannon), steal the detention-bus key and get chased or detained, rally a crew of students to block or protect, film and post clips, and expose, report or join a provocateur. Three reel-style scenes (Kabir's mummy calling, the water-cannon request, "sir mujhe bhi detain kar lo") play as in-engine reels. The phone holds the group chat, a feed of clips with Gen Z captions, and a satirical ticker. The ending card names your role and the moments that caused it.

The cast: Ravi, Iqbal, Officer Sharma, Mira, Asha, Zoya, Meera, Kabir, Nikhil, Dev, Sana, Inspector Rao on the wireless, constables and RAF jawans. The political groups (RUP, DRS, LJM) are fictional stand-ins.

Design docs: `plans/vision-brief.md` (the owner's vision), `plans/story-rebuild.md` (the situations format this build follows), `plans/slice-spec.md` (the engine and audio-cue contract), `docs/playtest-1.md` (the latest playtest), `research/` (sourced protest moments and situations).

## Run and play

```sh
python3 -m http.server 4173 --directory dist
```

Open `http://localhost:4173` (the day runs 32 minutes; add `?short` for a 10-minute slice). WASD/arrows move, Shift runs, drag to look, wheel zooms. E acts on whatever is nearest, F films, R rallies, C commands your crew, P opens the phone, number keys whisper a rumour after you talk to someone, Q puts down what you carry, hold T to let time pass faster, Tab opens the chaos board. Talking to people adds their routine to the board; seeing a rule fire adds a cause-and-effect link.

## How it is built

- `dist/loop/rules.js` holds the whole day as one world state plus routines and rules ("when X happens on screen, person Y does Z"). It has no DOM or Three.js, so whole days can be played in tests.
- `dist/loop/story.js` runs the side stories: situations you walk into and play to done or fail (`dist/loop/story/*.js`, one file each), conversations with friends, locals and every named officer, and ambient chatter. `content.js`, `barks.js`, `phone.js` and `phone-timeline.js` hold the rest of the words: lines, barks, captions, hints, board links and endings. Writers can change the day's words without touching the engine.
- `dist/loop/main.js` draws the state in the 3D city and turns keys into actions, with `lighting.js` (phase light), `props.js` (set pieces), `cinematic.js` (reels), `phone-ui.js`, `audio.js` (cue manager) and `models.js` / `../characters.js` (glTF people with mocap clips, vehicles, props; Blender sources in `assets-src/`).
- `npm run verify` model-checks the day (see `verify/README.md`): it searches for every reachable ending and situation, checks invariants, and hands back a replayable trace for anything that breaks.
- `npm test` (or `node tests/test-loop.mjs`) plays about twenty scripted days (idle, stolen speaker or key, rumours at different times, a stolen phone, the megaphone handed to Mira or Kabir, the minister rumour with and without a camera, hidden water, Nikhil brought to Kabir) and checks they end differently. It also checks every rule says something visible and every board link happens in at least one of those days.

The old Codex build (v5–v27) was deleted in the vision rebuild; it is in git history before that commit. Its city, character, movement and bus modules in `dist/` are still used.
