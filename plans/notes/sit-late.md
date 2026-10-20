# Late-day situations: notes for the lead

Files: `dist/loop/story/naye-joote.js`, `detain-me.js`, `dhuan.js`, `ghar-jaana-hai.js`.
Test: `tests/test-situations-late.mjs` (18 checks: done and fail for each situation, the auto on an idle day,
and the side routes).

## How they chain

- **naye-joote** (14:30–15:30, SUV). The auto runs at 15:15: Tomar sweeps the SUV and Nikhil, holding the
  charger, goes on the bus (`detain:nikhil`, `detain:kabir`, `flag:nikhil-on-bus`). Several fail options also
  set `nikhil-on-bus`.
- **detain-me** (14:00–17:30, `busJantar`). It hooks on `anyFlags: ['nikhil-on-bus', 'kabir-on-bus']` while
  you are free. The friends get out the back at Nikhil's "Update: hum bahar aa gaye" beat. That beat sits
  in the option that also does `detain:player`, `release:kabir`, `release:nikhil` and
  `clip:detainees-escape`. Every release sets `flag:friends-out`. The auto runs at 16:50, when they let
  themselves out.
  - **Link to bus-andar:** "Stay on the bus and run a show" ends `done` with you still detained, and
    `player-stays-detained` is set. bus-andar then hooks by itself through `requires.detained`. That is the
    hand-off I intended.
  - The other three update options set `player-released`, as in scenes.js.
- **dhuan** (16:00–16:50, marker follows Meera). The first choice sets the pessimistic friend states
  (`friend:nikhil:missing`, `friend:meera:hurt`). Each rescue then overwrites them with `ok`. A Kabir route
  ends ok, hurt or detained; "leave him" also sets `kabir-on-bus`, so detain-me can still hook. If Nikhil is
  still on the bus, a route marks him `detained` ("pillar matlab bus ka pole").
  - Flags for later: `nikhil-safe`, `kabir-safe`, `kabir-hurt`, `kabir-on-bus`, `meera-safe`,
    `meera-phone-gone`, `player-hurt`, `dhuan-ran`, `dhuan-alone`.
- **ghar-jaana-hai** (17:00–18:00, metro). Its options are gated on those flags. It also sets
  `mummy-knows-truth` (a CHAT trigger exists) and `tuition-alibi-holds`.

## Engine requests

1. **Provocateurs from the story.** naye-joote's expose and report routes only set flags
   (`fixer-exposed`, `fixer-reported`, `took-joote`, `took-charger`, `stood-with-fixer`) and move levers. The
   15:30 stone still flies. I need either of these:
   - a do-action `provocateurs:<expose|report|join|gone>`; or
   - rules.js reads those flags: exposed or reported means the provocateurs are exposed or gone, and took or
     stood means joined.
2. **Predicates.**
   - `friend:<who>:<state>` (reads `s.story.friends`). ghar-jaana-hai uses dhuan's flags for now.
   - `charge` / `gas`. dhuan should hook on the lathi charge or the tear gas, not at 16:00 flat. On a calm
     day there is no smoke and it still hooks.
   - `present:<who>` or a flag when Kabir goes home at 14:00. Without it, naye-joote's auto, detain-me's lines
     and dhuan's Kabir route can mention a Kabir who has left. It's harmless in the engine (detainPerson
     ignores hidden people), but wrong on screen.
   - Let story-check accept `player` in `near:` (story.js already resolves it). I wanted
     `near:player:nikhil` for "find Nikhil".
3. **Officers that come back.** `move:sharma:<spot>` leaves Sharma posted there, because `toPost` turns into
   `post`. I wanted Sharma to walk to the bus (detain-me) and Sharma or Meena to walk to the SUV
   (naye-joote), and dropped both. I'd like `escort:<officer>:<spot>`: walk there, then go home.
4. **Nikhil following across the stage.** Following Nikhil switches to `waitStage` inside the stage, and to
   `withKabir` near Kabir, so `with:nikhil` breaks on any route through the stage. My goals use
   `at:nikhil:<place>` plus `at:player:<place>` instead.
5. **Chat from an auto.** Auto beats are spoken lines. I'd like auto (and `do`) to be able to send chat lines,
   e.g. `auto.chat: [[who, text]]` like `hook.chat`, so "hum nikal rahe hain" lands in the group chat.
6. **The charge's own detentions should set flags.** When startCharge takes Kabir (any stance except scatter
   or protect), set `kabir-on-bus`, so detain-me can hook after a real charge.
7. **Auto timing for late hooks.** detain-me's auto is at 16:50. If it hooks after that (Kabir taken late),
   the auto fires on the same tick. An `auto.after` measured in minutes from the hook would fix it.
8. **Story levers.** I feed `intensity`, `hotspot`, `target` and `stance` throughout. `directorNow` doesn't
   read `s.story.levers` yet.
