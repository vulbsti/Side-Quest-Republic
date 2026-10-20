# verify/: checking the game without playing every day

The game's day is a deterministic state machine (`dist/loop/rules.js`). `verify/` treats it the way TLC treats a TLA+ spec:
- it explores the days a player can actually make;
- it checks properties on every state and every finished day;
- it keeps the shortest **witness** for everything it reaches;
- it hands back a replayable trace whenever something fails.

`plans/verification-plan.md` explains why it's built this way.

```sh
npm run verify                    # about 1-2 min: determinism, routes, exploration, properties, map, diff
npm run verify -- --budget=180    # explore longer
npm run verify -- --update-baseline   # accept the current coverage as the new baseline (commit it)
npm run verify:browser            # replay every ending's witness in headless Chrome; storyboards
npm test                          # includes tests/test-verify.mjs: the checker catches a broken rule
```

## What it checks

| Check | Where | Fails when |
|---|---|---|
| No hidden state | `run.mjs` | A plan or trace replays to a different day, or two days ticked together differ from each played alone |
| Invariants, every simulated second | `properties.mjs` | An object has two holders, someone is off the map, a crowd goes negative, the phase disagrees with the clock… |
| Every finished day | `properties.mjs` | It doesn't end by 18:00 with a card; a rule fires but its line never appears (silent rule); a chase never ends |
| Intended routes | `seeds.mjs` | A designer's route (walking, real witnesses) stops reaching what it promises (a regression against the baseline) |
| Coverage | `explore.mjs` | Something reachable in the baseline isn't any more |
| Escalation and tempo | `run.mjs` | An idle day doesn't escalate; the idle day ends differently at slice and `?long` tempo |
| Conformance | `conformance.mjs` | The browser day ends differently from the Node day; people are drawn far from where the engine has them; the world's walls changed |

Reported but not enforced:
- **agency:** does each verb change some outcome?
- **pacing:** the longest dead air near the player.
- **board-learnable links:** links the player was close enough to hear.

## Reading the output

```
verify: 95.2 s, explored 4200 moves / 2900 cells
  ending    9/13   missing: detained, biryani, cpjam, quiet
  board    47/63   ...           <- links a player can actually learn on the chaos board
  routes  11/17 intended routes work for a walking player
  BROKEN  speaker-gone: missing ending:quiet (speaker taken at 10:09 in sight of ravi)
  diff    +3 (rule:march, ...)  -0
```

`verify/map.md` is the same information as one page:
- every ending, rule and link, with the shortest way to reach it;
- the cause-and-effect graph;
- each verb and whether it changes anything.

## Replaying a day

Every ending's witness is in `verify/traces/ending-<id>.json`. Failing properties write `verify/traces/fail-*.json`. To watch one in the game:

```
python3 -m http.server 4173      # from the repo root this time
http://localhost:4173/dist/index.html?replay=/verify/traces/ending-roast.json
```

Add `&speed=20` to fast-forward.

In a normal game with `?dev`, press **K** to save the day so far as a trace. Drop it in `verify/traces/` and it becomes something anyone can replay.

## How it plays

- **Driver (`drive.mjs`).** A plan is a list of moves: `until 11:05`, `go` (walking at 6 m/s, following moving targets), `act`, `wait`. Takes use the engine's own `witnesses()`, with the game's real walls (`world-obstacles.json`, snapshotted from the live world and re-checked by `verify:browser`). So nobody teleports, and nobody is invisible by fiat.
- **Explorer (`explore.mjs`).** Go-Explore: an archive of abstract moments (phase, place, what's held, flags, rules fired…). It returns to rarely-visited ones and tries one move.
  - Moves come from `affordances(s)` in the engine, the same list of things the player can do. `act()` is the authority on what succeeds.
  - After each move it waits until the world opens something new. That's how timing-gated content (the chai-break key) is found.
- **Baseline (`baseline.json`).** Every witness plan is re-run first, so coverage is checked deterministically. Only what an old plan no longer reaches goes back to search, and only what search can't recover is reported as lost.

## Changing the game

- **Engine contract.** The client changes the day only through `setInputs()` and `act()`. Witnesses and possible actions come from the engine. Don't reintroduce module-level state in `rules.js`; the determinism check will catch it.
- **New content (rules, links, endings).** Picked up automatically. Add an intended route to `seeds.mjs` for anything a designer expects players to reach.
- **A property that no longer makes sense.** Edit `properties.mjs` and say why in the commit.
- **After an intended change in coverage.** Run with `--update-baseline` and commit `baseline.json` and `map.md`, so the next agent's diff starts from it.
