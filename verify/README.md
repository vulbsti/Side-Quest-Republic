# Verifying the game

`npm run verify` checks that the game works without anyone playing every possibility. It borrows the
idea behind TLA+'s model checker (TLC): describe what must always be true, let a program explore the
reachable situations, and hand back a replayable trace whenever something breaks. It runs on the real
engine (`dist/loop/rules.js`), not on a separate model, so it can't drift from the game.

It takes about a minute and writes [`report.md`](report.md).

## What it does

1. **The system map** (`lib/map.mjs`). Reads the code and lists every verb, rule, timed routine, cue,
   line, board link, callback, ending, scene and talk situation. It plays a few days through a recording
   proxy to learn which state each rule, routine and verb reads and writes, which gives the cause→effect
   graph. `verify/out/map.html` draws it.
2. **The linter** (`lib/lint.mjs`). Checks the map with no game running: cues nothing draws, links and
   callbacks with no text, lines nobody can say, situations with no line, officers sharing one table,
   machine codes the client would show as text, fields nothing reads.
3. **The explorer** (`lib/explore.mjs`). Go-Explore over the player's decisions. It keeps an archive of
   distinct situations, returns to them (a day clones exactly, so it never replays from 10:00), and
   branches on what the player can do (`affordances(s)` in the engine), not on clock ticks. The first
   time anything happens it keeps the shortest trace that got there: the witness. The map is real-sized
   (CP to the stage is a 20-minute walk), so a situation includes where the player stands, the search
   mostly picks what is near, and it also branches from every situation the designed routes
   (`verify/routes/`) walk through: a route that gets to a story is how the search reaches its choices.
4. **Properties** (`lib/properties.mjs`). Invariants checked in every situation (one holder per object,
   the day only moves forward, a detained player sits in the vehicle...), and checks on whole days: the
   engine never throws, every day ends with a true ending card, every accepted command shows the player
   something within 3 seconds, the E prompt always does something, a detained player has a way out,
   every line the engine says reaches the player somewhere.
5. **Bot players** (`lib/bots.mjs`). Six personalities (idle, random, helpful, chaotic, filmer, explorer)
   play whole days at the 32-minute tempo. From what reached their screens it measures repeated lines,
   how distinct the police sound, new things to do per hour, the longest stretch with nothing new, how
   busy the phone is and how different their days turn out. Each has a target.
6. **The baseline** (`baseline.json`). Every run is compared with it. Anything that got worse (a property
   that held and now fails, content that was reachable and now isn't, a target that was met and now isn't)
   fails the run. `npm run verify -- --update` accepts the current results.

## Witnesses

A witness is a list of decisions from 10:00, saved in `verify/witnesses/`:

```json
{ "name": "fails no-silent-act", "tempo": "long", "trace": [
  { "clock": "11:00", "do": "pester:c3:cute", "cmd": { "type": "pester", "to": "c3", "how": "cute" }, "at": { "x": 19, "z": -11 } },
  { "clock": "11:08", "wait": 3 },
  { "clock": "11:08", "do": "take:key", "cmd": { "type": "take", "object": "key" }, "at": { "x": 8.55, "z": -31 } }
] }
```

- `npm run verify:replay -- verify/witnesses/<file>.json` prints the day as the player lived it: each
  decision and what reached the screen.
- `npm run verify:playback` plays the failures and one ending per headline in the real 3D client
  (headless Chromium, `?replay=`), screenshots the moment that matters, and checks the browser's day
  matches Node's for the same trace. Results land in `verify/out/playback/`.
- Open the game with `?replay=/verify/witnesses/<file>.json&speed=8` (serving the repo root) to watch it.

Node and the browser share three pieces of code, so a trace found in Node replays exactly in the browser and
behaves as it would in real play:
- `dist/loop/drive.js` drives a trace.
- `dist/loop/present.js` decides what reaches the player's screen.
- `dist/loop/sight.js` decides who can see the player: a theft's witnesses, and whether a chaser has lost
  you. It uses the engine's positions and the world's real walls. The client passes its live walls; the
  verifier passes `verify/world-obstacles.json`, a snapshot of the same list.

## The 3D game against the engine

`npm run verify:playback` runs headless Chrome on the GPU by default (about 50 s per ending day).
`PLAYBACK_GL=swiftshader` forces software rendering on a machine without a GPU, which is far slower.

Besides "same rules, same ending as Node", it checks two things the engine alone can't:
- **The walls.** `verify/world-obstacles.json` must match the live world. If someone moved a building or
  a barricade, refresh it with `npm run verify:playback -- --snapshot-world`.
- **Drawn vs engine positions.** At 10:30, 12:00, 13:30 and so on in each ending's day, the replay pauses,
  people walk into place, and anyone drawn more than 2.5 m from where the engine has them is reported.
  Rules decide "who saw you" and "who heard that" from the engine's positions, so a person stuck behind a
  wall makes the player see one world while the rules run on another. People already filed are listed in
  `verify/playback-known.json` (`--update-known` adds the current ones); anyone new fails the run.

## Played days

Every loop you play is recorded tick by tick (`dist/loop/trace.js`). Open the game with `?dev` and press
**K** to save the day so far. Drop the file in `verify/recordings/` and every `npm run verify` replays it in
Node: it must not crash, break an invariant, or end differently from how it was played. That is the
quickest way to turn a bug you hit while playing into a check.

## Rules for changing the game

- Run `npm run verify` before calling a change done, and quote the report's summary in the PR.
- A change is done when nothing got worse than the baseline. If a regression is intended (content cut on
  purpose), say why and accept it with `--update`.
- A bug found by playing becomes a check first, so it can't come back: save the day into `verify/recordings/`,
  or add a property or a metric.
- The report says whether the game works. Whether it is fun is still for a person playing it.

## Options

```
npm run verify -- --quick        # a smaller search, about 15 seconds
npm run verify -- --steps 6000   # search harder (default 3000 decisions)
npm run verify -- --update       # accept the results as the new baseline
npm run verify:playback -- --snapshot-world   # after changing the 3D world's walls
```
