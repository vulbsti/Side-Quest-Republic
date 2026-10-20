# Verifying the game: a map agents can check their work against

**Status:** approved 2026-10-20. Phases 1–4 are built in PR 3 (`verify/`, see `verify/README.md`); phase 5 (TLA+) is not started. The "As built" section at the end records where the build differs from this plan and what it found.

## The problem
Agents change the game and say it works, but nobody can check that without playing it, and one playthrough covers a sliver of the day. We need what TLA+/TLC gives distributed systems:
- a **spec** of what the system is supposed to do;
- **properties** that must hold;
- a **checker** that explores behaviours mechanically and hands back a **counterexample trace** when a property fails.

The goal is not to test every possibility. It's to cover the space the checker can reach, and to diff that coverage before and after each change.

## Why this game is already a good fit (measured today)
`dist/loop/rules.js` holds the whole day as one pure state machine, with no DOM or Three.js:
- `createDay()`, `advance(s, dt)`, `act(s, cmd)`, `drainEvents(s)`, `s.ending`.
- 42 rules, each with an id and a `says` (what it shows on screen).
- 13 endings, 63 cause-and-effect board links, 12 player verbs.
- No `Math.random`: the day is deterministic.
- The world state is plain JSON, about 4 KB, and `structuredClone` copies it exactly. So the checker can branch from any moment instead of replaying from 10:00.
- A whole idle day simulates in about 90 ms. The existing suite plays about 20 scripted days in 2.6 s.

A throwaway probe (300 random days, then 300 with one-step look-ahead) found:

| | Reached |
|---|---|
| Endings | 8 / 13. Never `detained`, `roast`, `singalong`, `biryani`, `cpjam` |
| Rules | 27 / 42. Never the bus-key chain (`cp-party`, `rao-sends-sharma`, `march`…), `detainees-escape`, `barricade-push`, `meera-reel`… |
| Board links | 38 / 63 |

Look-ahead didn't help. These outcomes sit behind timing and setup: the key is only takeable during Iqbal's chai break, and you have to be in the right place. Naive exploration plateaus, while the hand-written tests reach further. This is the gap the checker must close.

The probe also found three structural problems a checker needs fixed first:
1. **Hidden state:** `let crewSeq = 0` is module-level, outside `s`. A cloned or replayed day isn't fully independent.
2. **Witness logic lives in the 3D layer:** who saw you is decided in `main.js` (`witnesses()`) and passed into `act()`. The engine, and every test, takes it on trust.
3. **No list of possible actions:** "what can the player do right now" (`E` acts on the nearest thing) lives in the UI. A checker that invents actions may explore impossible ones or miss real ones.

## The design: five layers

### L0: the engine is the single source of truth
- All mutable state lives in `s`; no module-level `let`. A test checks this: two days played interleaved in one process give the same result as each played alone.
- Move `witnesses(s, pos)` and a new **`affordances(s)`** into `rules.js`. `affordances(s)` lists every action available now, with its target and where the player must stand. `main.js` uses the same functions for the `E` prompt. **The checker explores exactly what a player can do, and nothing else.**
- If randomness is ever added, it comes only from a seeded generator stored in `s`.

### L1: the map (`verify/map.js`), the spec as data
A declarative description of the intended game, partly generated from code and partly hand-written from `plans/vision-brief.md`:
- **Verbs**, with precondition (from `affordances`) and expected visible effect.
- **Rules:** trigger → effect → visible signal (`says`, cue, bark, board link).
- **Phases** and the escalation timetable (what must happen without the player).
- **Endings**, each with the condition the designer intends (separate from `chooseEnding`, so drift between the two is caught).
- **Causal graph:** which verbs can start which chains, generated as `verify/map.md` with a Mermaid graph, so a human or agent can read the game's skeleton on one page.

### L2: properties checked on every explored state and trace
- **Invariants (always):**
  - every object has exactly one holder;
  - crowd counts are never negative and are conserved apart from arrivals and departures;
  - phase matches the clock and never goes back;
  - detentions never exceed bus capacity;
  - positions are finite and inside the map;
  - a detained player can only plead, play the scene or film;
  - every engine event has a visible signal (no silent rule);
  - every content key a rule references exists.
- **Liveness (eventually):**
  - every day ends by 18:00 with an ending and an outcome card;
  - an idle day still escalates to the showdown;
  - every chase ends (caught or lost) within N clock minutes.
- **Reachability (design coverage):** every ending, rule, board link, scene and pester type is reached by some trace. The checker stores the **shortest witness trace** for each.
- **Agency:** for each verb there is a state where doing it, versus not, changes the ending or a board link. Checked by counterfactual runs on clones. This makes "what you do decides the outcome" testable.
- **Legibility and pacing:**
  - the ending card only names moments that actually happened in that trace;
  - no stretch longer than N clock minutes without a visible event within sight of the player (dead air).
- **Metamorphic:**
  - the same clock-time script gives the same ending in the slice (`1.25`) and `?long` (`4.0`) tempos;
  - adding a witness can only add consequences, never remove them.

### L3: the explorer (`npm run verify`), our TLC
- **Decision points are event-driven:** the explorer branches when the affordance set changes (an object becomes free, someone arrives, a phase starts). It doesn't sample the clock, which is how it finds timing-gated content like the chai-break key.
- **Strategies:**
  1. **Go-Explore archive.** Keep one representative state per abstract cell (phase, object holders, flags, rumours known, crew, showdown and crowd buckets). Return to the least-visited cells and explore from there. Published work found Go-Explore beats RL and curiosity agents for game reachability testing.
  2. **Breadth-first search** over the abstract key, to a bounded depth, for short witnesses.
  3. **Goal-directed search** for anything still unreached, using the map's preconditions to pick states that make a target rule's trigger nearer.
  4. **Random simulation** with fixed seeds for depth, as in TLC's simulate mode.
- **Counterexamples:** when a property fails, save the trace (`verify/traces/<name>.json`), shrink it to the fewest actions, and make it replayable in the real game with `?replay=<trace>`. You or an agent can then watch the failure in 3D.
- **Report and baseline:**
  - `verify/report.json` holds coverage, property results and witness traces.
  - `verify/baseline.json` is committed.
  - `npm run verify` prints the **diff**, e.g. "this change made `cpjam` unreachable", "rule `march` now needs 3 more actions", "new invariant failure: key held by two people".
  - This diff is the evidence an agent must cite before claiming a change works.

### L4: conformance of the 3D view (trace validation)
Model checking proves the engine; it says nothing about whether the 3D game shows it. Borrowing TLA+ trace validation, as Microsoft's CCF and MongoDB use it:
- In a test harness, `main.js` records a **frame trace**: drawn positions of people, objects and vehicles, visible speech bubbles and barks, audio cues started, phone posts.
- A Playwright run replays each witness trace in headless Chrome and checks the frame trace against the engine state at the same time:
  - everyone and everything is drawn where the engine says, within a tolerance;
  - every `says` was shown;
  - every cue has an audio file and played.
- It also saves a **storyboard**: key-frame screenshots for each ending's witness trace, for a quick human or vision-model look ("is the bus actually stalled at the barricade?").

### L5: human playtests turn into checks
A debug key in the game saves the current trace. Anything odd you see while playing becomes a replayable trace. Once fixed, it's added as a property or regression check, so it can't come back silently.

## Formal tools: where they fit
- **TLA+ / TLC:** worth it later for one small piece, the abstract escalation director (phases, police posture, showdown triggers). Model-check it exhaustively, then trace-validate engine runs against it. Not phase 1: the JS explorer gives most of the value without a second language.
- **Lean:** proofs about a game's content rules cost far more than they return. Not recommended.
- **Bend:** a parallel runtime on the HVM2 interaction-combinator evaluator, not a verification tool. A secondary source claims "Bend 2" adds Lean-style proofs, but I couldn't confirm it. Not useful here. If you meant a different tool, tell me.
- **fast-check:** its model-based `fc.commands` testing fits `act()` well, and shrinking comes free. Use it for invariant fuzzing alongside the explorer.

## Phases and done-when

| Phase | Work | Done when |
|---|---|---|
| 1 | L0 fixes (`crewSeq` into state, `witnesses` and `affordances` into the engine, UI uses them); `verify/` skeleton with invariants and liveness; existing scripted days as seeds | `npm run verify` runs in < 60 s; prints invariant results and coverage; detects hidden state (test fails before the fix, passes after) |
| 2 | Explorer: Go-Explore, BFS, goal-directed; witness traces; `?replay=` in the game | 13/13 endings, 42/42 rules, 63/63 links reached, or each gap reported as unreachable with the blocking precondition; every witness replays in the browser |
| 3 | Map file and generated `map.md`; agency, legibility, pacing and metamorphic properties; committed baseline and diff | Deliberately breaking a rule (test mutation) shows up in the diff. The agent rule "cite the verify diff" is added to the brief |
| 4 | 3D conformance via frame trace and Playwright; storyboard per ending | Witness traces pass conformance; one storyboard image per ending saved |
| 5 (optional) | TLA+ spec of the escalation director plus trace validation | TLC passes; engine traces validate |

Phases 1–3 are the core: about 2–3 agent sessions. Phase 4 is one more.

## The rule for agents, once phase 3 lands
An agent may say a change works only by citing the `npm run verify` diff:
- coverage before and after;
- invariants green;
- witness traces for anything new;
- for visual changes, the conformance run and the storyboard frames.
"I played it and it looked fine" is not evidence.

## Sources
- TLA+ trace validation: [Cirstea, Kuppe, Merz et al. 2024](https://arxiv.org/abs/2404.16075); [Smart Casual Verification of CCF, NSDI '25](https://arxiv.org/pdf/2406.17455); [MongoDB conformance checking](https://www.mongodb.com/company/blog/engineering/conformance-checking-at-mongodb-testing-our-code-matches-our-tla-specs); [TLA+ docs](https://docs.tlapl.us/using:tlc:trace_validation)
- Go-Explore for game reachability: [Lu, Georgescu, Verwey, IEEE ToG](https://arxiv.org/abs/2209.00570); curiosity-driven playtesting: [Gordillo et al.](https://ar5iv.labs.arxiv.org/html/2103.13798)
- Deterministic simulation testing: [Antithesis primer](https://antithesis.com/docs/resources/deterministic_simulation_testing/)
- Model-based property testing: [fast-check docs](https://fast-check.dev/docs/advanced/)
- Bend/HVM2: [HVM2 README](https://cdn.jsdelivr.net/gh/higherorderco/hvm2@main/README.md)

## As built (PR 3)

Built as planned, with these differences:
- **Affordances.** `affordances(s)` is a superset generator; `act()` stays the only authority on what succeeds, so preconditions live in one place.
- **Real walls.** Witnesses and the chaser's sight line use the game's own `visible()` test against the live world's walls (`verify/world-obstacles.json`, re-checked by `verify:browser`). Without walls, verify was stricter than the game.
- **Intended routes (`verify/seeds.mjs`), new.** The designer's claims, rewritten from `tests/test-loop.mjs` so the player walks and real people can see them. They seed the explorer and catch regressions.
- **Board coverage, new.** A link counts for the chaos board only if the player was close enough to hear it, the same rule as `main.js`.
- **Conformance baseline.** Known drift is listed in `verify/conformance-known.json`, so only new drift fails.

Findings on `main` at cfc5049, for the rebuild (PR 4):
1. **The speaker can't be stolen.** Ravi always stands within 3 m of it and sees you, so it goes straight back. Every designer route through the speaker is broken: `quiet`, the CP party chain, `cpjam`, `biryani`. The tests pass only because they hand-pick `witnesses: []`.
2. **The bus key can't be taken unseen.** Constable c2's post is 6–7 m from the hook in plain sight, so taking it always starts a chase. The designed key → stranded shuttle → march chain is unreachable as written. (The explorer reached `march` another way: charm Sharma and a constable at 10:20.)
3. **Crash, fixed here.** Pestering the barricade RAF jawan after the cannon-request scene threw, because the scene left him in a mood outside the officer table. A one-line guard plus a regression check is in this PR.
4. **Never reached by a player:** the `detained` and `biryani` endings, and rules `cp-party`, `meera-reel`, `ravi-notices`, `sharma-kills-party`, `barricade-push`.
5. **Drawn people drift from where the engine has them.** Dev is 11.5 m off for most of the day; Zoya, Meera, Ravi, Sharma and two constables up to 15 m. The engine moves people through walls; the renderer steers around them and gets stuck. Rules use engine positions (who saw you, who heard), so the player sees one world and the rules run on another.
6. **Agency gaps.** No explored day where `film`, `stance`, `scene` or `plead` changes the ending or a board link.
7. **Dead air.** An idle player at the Metro sees nothing for about 40 clock minutes; the worst witness day has 130.

Numbers at commit (baseline, two 120 s seeds):
- 11/13 endings, 37/42 rules, 57/63 links;
- 57/63 board-learnable;
- 11/17 intended routes work;
- 8/12 verbs change an outcome;
- every ending's witness replays in the browser to the same ending.
