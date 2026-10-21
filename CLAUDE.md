# Side Quest Republic

A Three.js browser game (plain ES modules, no build step). The rules live in `dist/loop/rules.js`, a pure
engine with no DOM, so whole days run in Node. `npm start` serves the game; `?long` is the 32-minute day.

## Before calling any change done

1. `npm test` passes.
2. `npm run verify` reports nothing worse than `verify/baseline.json`. Quote its summary line in the PR.
   If content was cut on purpose and coverage drops, say why and run `npm run verify -- --update`.
3. For anything visual, `npm run verify:playback -- <witness>` and look at the screenshot.

See `verify/README.md` for what the verifier checks and how to replay a witness trace.

## Keeping the verifier honest

- Everything the player can do must be listed by `affordances(s)` in `rules.js`, or the explorer can't find it.
- What the player sees is decided by `dist/loop/present.js`, which both the client and the verifier use.
  Don't route lines to the screen anywhere else.
- Engine state lives in the day object (`createDay`). No module-level counters or randomness in `rules.js`.
- Who can see the player is decided by `dist/loop/sight.js` on engine positions, for play, replay and the verifier alike. After moving walls in the 3D world, run `npm run verify:playback -- --snapshot-world`.
- A bug found by playing becomes a check in `verify/lib/` first.
