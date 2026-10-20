# Add verify/: model-check the day, replay any day, check the 3D game shows it

## Summary
Agents kept claiming the game worked, but nobody could check that without playing every possible day. The day is already a deterministic state machine (`dist/loop/rules.js`), so this PR adds a checker that treats it the way TLC treats a TLA+ spec:
- explore the days a player can actually make;
- check invariants and day properties;
- keep the shortest replayable witness for every ending, rule and board link;
- diff coverage against a committed baseline;
- confirm the 3D game draws what the engine says.

This is phases 1–4 of `plans/verification-plan.md`. The game rebuild comes separately in PR 4.

## Changes

**Engine contract (small, behaviour-preserving)**
- `dist/loop/rules.js`:
  - Crew ids live in the day (`s.seq`); `act()` re-syncs the tempo. No state leaks between days in one process.
  - The shuttle-lane rule moved in from `main.js` as `busLane()`.
  - New exports:
    - `setInputs()`: the only per-tick client input;
    - `witnesses(s, pos, lineOfSight)`: shared by the UI and the checker;
    - `affordances(s)`: a superset of what the player can try; `act()` stays the authority;
    - `WITNESS_RANGE` and `WAYPOINTS`.
- `dist/loop/main.js`:
  - uses `setInputs` and `R.witnesses`;
  - records every loop (`?dev` + K saves it); `?replay=<trace>&speed=N` plays one back;
  - adds `__loop.render()`, `obstacles()` and `pause()` for conformance.
- `dist/loop/trace.js` (new): a trace format and replay shared by Node and the browser.
- **Bug fix found by the explorer.** Pestering the barricade RAF jawan after the cannon-request scene threw: the scene sets a mood outside the officer mood table. One-line guard in `pester()`, plus a regression check in `tests/test-verify.mjs`.

**verify/ (new)**
- `engine.mjs`:
  - loads the engine and wraps rule firings without changing them;
  - provides sight lines via the game's own `visible()` against `world-obstacles.json`, which is snapshotted from the live world.
- `drive.mjs`: plans (`until`, `go`, `act`, `wait`) that walk at 6 m/s, use real witnesses, record tick traces, and check invariants every simulated second.
- `explore.mjs`: Go-Explore over abstract cells with event-driven decision points; finds timing-gated content.
- `seeds.mjs`: intended routes rewritten from `tests/test-loop.mjs` so a player has to walk them and real people can see them.
- `properties.mjs`:
  - invariants: one holder per object, positions, crowds, phase/clock, rep range, crew, chaser, bus capacity, detention, ending card;
  - day properties: ends by 18:00, no silent rule, chases end, the card cites real causes.
- `run.mjs` (`npm run verify`):
  - determinism checks;
  - re-runs the baseline witnesses;
  - explores;
  - checks properties, escalation, tempo invariance, agency and pacing;
  - writes `report.json`, `map.md` and `traces/`, and prints the baseline diff;
  - exits 1 on lost coverage or a failed property.
- `conformance.mjs` (`npm run verify:browser`):
  - replays every ending's witness in headless Chrome (GPU, about 25 s each);
  - checks the same ending as Node, drawn-versus-engine positions and console errors;
  - checks the obstacle snapshot is current, plus a live-play recorder smoke test;
  - saves storyboards;
  - known drift is listed in `conformance-known.json` (per person); new drift fails.
- `map.mjs`: generates `verify/map.md`, one page covering endings, routes, rules, the cause-and-effect graph and verbs.

**Docs and tests**
- `verify/README.md`, a README pointer, and a "Verify, then claim" rule in `plans/vision-brief.md`.
- `plans/verification-plan.md`: the approved plan plus "As built" findings.
- `tests/test-verify.mjs`: a mutation test (break the `heat` rule and the route fails), an invariant test, trace replay and the jawan crash regression.
- `tests/test-loop.mjs`: the shuttle-lane test now stands the player in the lane instead of setting `bus.blocked` by hand.
- `package.json`: the `verify` and `verify:browser` scripts; `playwright-core` 1.56.1 as a dev dependency (no browser download; uses the installed Chrome).

## Testing
- `npm test`: all tests pass, including `tests/test-verify.mjs`.
- `npm run verify` (60 s budget): exit 0, diff +0 −0 against the baseline, all properties hold.
  - Coverage: 11/13 endings, 37/42 rules, 57/63 links (57/63 the player can hear for the board).
  - 11/17 intended routes work.
  - 8/12 verbs change an outcome.
- `npm run verify:browser`: all 11 reached endings replay in the browser to the same ending. World snapshot current; live play records. Drift is listed as known findings.
- The game boots without errors, and a live day records its inputs while walking (the conformance run's live-play check). Nobody has played a full day by hand on this branch yet.

## Risk / rollback
- `main.js` now routes inputs through `setInputs` and witnesses through the engine. Behaviour should be identical: same ranges, walls and order. If play feels different, revert `dist/loop/main.js` and `dist/index.html` from this commit; the engine changes are additive.
- The shuttle-lane rule now runs in Node too. Scripted tests that stand in the lane will see the bus wait, which is correct.
- `verify/` is dev-only; nothing in `dist/` imports it.

## Review focus
- `rules.js` `affordances()` and `witnesses()`: are they the right contract for PR 4 to build on?
- `verify/seeds.mjs`: the 6 broken routes are real findings, not driver bugs. Ravi always sees the speaker; c2 always sees the bus key. See "As built" in `plans/verification-plan.md`.
- `verify/properties.mjs`: anything missing that the vision brief cares about?
