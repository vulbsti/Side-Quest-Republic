# Act 1 situations: notes for the lead

Files: `dist/loop/story/{nikhil-lost,career-counselling,chabi,speaker-run}.js`, test `tests/test-situations-act1.mjs`
(14 checks: done and fail paths for each situation, the chase, and an idle day running every auto).

## Engine requests

1. **Followers stall at the midway waypoint** (story.js tick → `api.walkTo` → rules.js `route`). A follower standing on
   `SPOTS.midway` (not inside any place) heading for the barricade gets `midway` pushed again on every tick, so it never
   gets there. `follow:meera` toward the barricade stops at (18,-14). Fix: in `route()`, skip a waypoint the walker is
   already within ~1 m of, or have followers `goTo` straight when they're under ~25 m away. Until then the
   career-counselling `fetch` goal checks `with:meera` + `at:player:barricade` instead of `at:meera:barricade`.
   Swap it back after the fix.
2. **Talking to lost Nikhil no longer makes him follow on its own.** nikhil-lost has him in its cast, so `talk` opens
   the situation and he follows once you pick an option (`nikhil:found`). `tests/test-loop.mjs` line ~217 (the roast
   chain) talks to him and walks off, so it now fails there. It needs a `say` after the talk, e.g.
   `act(s, { type: 'say', option: 3 })`. Also: once he's lost again *during* the escort goal, `talk` skips the
   situation, and if TALKS/BRUSHOFF for nikhil answer, the rules.js fallback that sets `follow` never runs. Suggest: in
   `act talk`, set `nikhil.mode = 'follow'` when he's `lost` whatever the story returns.
3. **`act give` of the key only goes to Iqbal.** chabi hands the key to Kabir through `do: give:key:kabir` after a
   `near:key:kabir` goal. If you want the player to give it to him directly, allow key → kabir in `act give`. Kabir
   then carries the key (`kabir.carrying = 'key'`), so a later `give megaphone → kabir` is refused while he has it.
4. `move:<person>` leaves people in mode `story`: Ravi after speaker-run (until the 10:30 search takes over), and
   Nikhil after the nikhil-lost auto (sitting at Asha's stall). If a later situation needs them back on a routine,
   it has to move them.

## Flags other content can read
- nikhil-lost: `nikhil-found` (also asked for by phone-chatter), `nikhil-left` (the auto or a fail: for dhuan),
  `nikhil-charged`, `nikhil-intro-reel`, `kabir-minds-nikhil`, `nikhil-in-set`, `nikhil-handed-off`, `exit-chant`.
- career-counselling: `tomar-noticed` (in every Tomar option), `tomar-fake-name` (he's looking for "Rohan"),
  `sharma-bhanja`, `uncle-cute`, `counselling-reel`. Sharma's mood ends soft, amused or annoyed. Meena (c2) stays at
  the barricade after `done`, which leaves the CP key hook unwatched.
- chabi: `asha-in-on-it`, `chabi-bet`, `meena-chai`, `kabir-rishta`, `rishta-consultant`, `chabi-pateela`,
  `kabir-has-key`, `iqbal-likes-you` (could feed bus-andar's "Iqbal passes the key through the window").
- speaker-run: `speaker-cart`, `meena-song`, `speaker-mic-check`, `speaker-hidden`, `ravi-alone` (from the auto).

## Design choices
- **speaker-run's window is 10:12–10:30, not 10:30–12:00.** SCHEDULE 10:30 has Ravi carry the speaker himself if it's
  next to him, and it's on the stage by ~10:33. The sidetrack (his cousin with a mic stand at Rajiv Chowk) has to happen
  before that. The options that move the speaker need `before: '10:30'`, so a late return to an open intro can't pull
  it off the stage. The carry goal runs until 11:55. Ravi "forgets" he handed it over and searches from 10:30
  (startRaviSearch). If he catches you carrying it, he takes it to the stage himself, and the goal still completes.
- **chabi's danger is Meena, not Iqbal.** Iqbal at the chai stall is 25 m from the hook, out of his 9 m witness range.
  c2 stands 7 m from the hook, so `act take` starts her chase unless you lured her off (`move:c2:chai`) or
  career-counselling drew her to the barricade.
- **career-counselling's cast is only `sharma`.** Putting c1 and c2 in the cast would route a talk with Yadav at his
  metro-path post into a scene happening 50 m away, and that conversation closes at once because of the walk-away
  rule. They walk over with `move:c1/c2:barricade`.
