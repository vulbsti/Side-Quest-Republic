# PR 3 progress note: verification system

## Done and verified
- **Phase 1 (engine as the single truth).**
  - Module-level state removed or synced: `crewSeq` and the tempo.
  - Bus-lane logic moved into the engine.
  - `setInputs`, `witnesses` and `affordances` exported and used by `main.js`.
  - A determinism check (interleaved slice/long days; the same plan at session start and end) passes.
- **Phase 2 (explorer).**
  - Go-Explore with event-driven waits, seeded with the intended routes.
  - Every ending's witness is saved as a tick trace and replays in Node (checked against the plan run) and in the browser (`?replay=`).
- **Phase 3 (map, properties, baseline).**
  - `verify/map.md` is generated each run; the baseline is committed from two 120 s seeds.
  - The mutation test proves a broken rule shows up.
  - The agent rule is added to the brief.
- **Phase 4 (conformance).**
  - Headless Chrome with the GPU; same ending for all 11 reached endings.
  - Obstacle snapshot check, live-play smoke test, storyboards.

## Decisions
- **`act()` decides validity.** `affordances()` is a superset; `act()` alone decides what succeeds, so preconditions are never written twice.
- **Real walls.** Witnesses use the real walls. Without them c2 "saw" everything, which gave false unreachables. With them the result matches the game. The world is snapshotted from the browser, and conformance re-checks the snapshot.
- **Intended routes walk.** Routes must walk and face real witnesses, unlike the existing tests, which teleport and hand-pick `witnesses: []`. This exposed the main findings.
- **Board-learnable links counted separately.** The board learns only what the player heard.
- **Baseline re-run first.** Old witness plans are re-run before exploring, so coverage checks are deterministic and search noise can't show up as "lost coverage".
- **Known drift keyed per person.** Body sticking depends on frame timing, so per-ending keys were flaky.

## Dead ends
- **Software rendering in headless Chrome.** About 1 fps, 8 minutes per ending. Switched to the GPU (ANGLE GL), about 60 fps and 25 s per ending.
- **One-step look-ahead exploration.** Same plateau as random play (8/13 endings). Event-driven waits plus kind-first move choice fixed it.
- **Same-tick silent-rule check.** Too strict for rules that arm a timer (`detainees-escape`). Changed to "line appears within 5 clock minutes".
- **Recorder rounding positions to 1 mm.** Made replays drift. Removed.

## Pending (outside this PR)
- **PR 4 (rebuild).** Fix the findings in `plans/verification-plan.md` "As built": the speaker and key always witnessed; unreachable endings and rules; people drawn up to 15 m from their engine positions; verbs with no agency; dead air.
- **Phase 5 (TLA+ spec of the escalation director).** Not started.
- **Story-rebuild content in `verify/seeds.mjs`.** When PR 4 adds situations, add a route per situation stage; the generic properties and explorer pick up new rules, links and endings automatically.
