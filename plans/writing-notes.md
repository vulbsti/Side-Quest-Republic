# Writing notes (situations, talks, barks, phone)

Files: `dist/loop/story/*.js` (situations, talks, chatter), `dist/loop/barks.js`, `dist/loop/phone.js`, `dist/loop/phone-timeline.js`. Data only. All
characters and groups are fictional; RUP/DRS/LJM are stand-ins, no real names.

## Jokes I'm proudest of

- **"Abhi tumne bola tha dost andar hain." / "Haan. Update aaya hai."** (detain-me). The reversal
  hits on Sharma's flat repetition, and Nikhil's "Update:" habit sets it up all scene.
- **Sharma as Verma sir.** "Attendance poori hai. Subah das baje se baitha hai." He tells the truth
  and gives Kabir away, then rescues it with "Extra class. Main extra leta hoon. Free mein." Then
  Mummy asks about fees and he just hands the phone back.
- **"Token system bhi chalega."** Sharma repeats it, the RAF jawan "coughs", and the gag escalates
  for real: Rao turns the Vajra toward the barricade. You ordered it, and it arrives.
- **The RAF jawan from Muzaffarpur** whose little brother was in the Patna water-cannon video. Meera
  puts her phone down. This is the quiet option, and its payoff comes later (he opens a gali for you).
- **"Garmi se azaadi"**, the slogan that is also a weather report.
- **"Rohan sir, ed-tech startup"**, which gets Mummy asking for a job for her nephew. A scale
  collision on top of a scale collision.
- Barks: the DRS foot soldier told it was a "bhajan sandhya"; the RUP worker paid ₹500 who finds a
  helmet in his bag; the LJM line "Bachche isko 'Tuesday' bol rahe hain".
- Every scene's `captionLater` is the IT-cell repost of the same clip. The evening feed gets
  darker without anyone changing a frame.

## What real reels would make these better

- **Actual audio of "Sir mujhe bhi detain kar lo".** Is the reversal deadpan or giggly, and how long
  is the officer's pause? That sets the `silence` length. The linked reel (DeGcEyuhznq) was
  unavailable.
- **Comment sections from the Patna cannon and the bus-key reels** (20–30 comments each). Captions
  and CHAT should borrow real phrasing. Right now only ~7 real comments are in research/.
- **How constables actually answer when amused**: short words, the half-smile, "chalo chalo". That
  keeps Sharma from drifting into sitcom.
- **DRS/RUP-style ground footage**: real counter-chant cadence, bike-rally horns, what foot soldiers
  say off-mic. My party/sena barks are written from general knowledge, not clips.
- **The tuition-call and "uncle aap cute ho" originals**, if they exist. Both are still unverified
  owner leads, and mummy-call is pure fiction on top of one.
- Music and stings: which trending tracks go under chase edits ("doorbell baja ke bhag gaya"), so
  `music` cue names can map to real tracks.

## Engine hooks my files assume

**Scene format extras** (all optional; the spec says the engine relies only on ids, `cast`,
`options[i].requires`, `options[i].effects`):
- Beat `who` can be a PEOPLE id, `player`, `mummy` (voice on Kabir's phone), `raf` (nearest RAF
  jawan), `wireless` (Rao), `crowd` (2–3 bystanders), `sana` (cannon-request option 2).
- Beat extras: `sfx` (`phone-ring`, `phone-buzz`, `wireless`, `whistle`, `static`, `bottle`), `via`
  (`phone`/`window`/`wireless`), `aside` (whisper).
- Scene extras: `voices`, `overheard` (play from ~15 m before the marker), `idle` (loop while options
  are open), `callbacks[flag]` (lines to say later), `trigger` (a hint; rules.js owns it),
  `inspiredBy`.
- Option extras: `clip` (clip kind to post if filming; `null` = nothing worth posting), `payoff`
  (overrides the scene payoff).

**`requires` shapes**: `mood: {id: [moods]}`, `rep: {aura: min}`, `flags: [all]`. (`anyFlags`, `notFlags`
are documented but unused for now.)
- `flags: ['water-delivered']` means Sana has the water crate (`s.waterOk` today).

**Moods set**: sharma `amused|soft|annoyed` (spec). New: kabir `grateful|sulking|shook`, raf
`soft|amused|tense` (the jawan at the barricade; he needs an officer id), sana `annoyed`.

**Flags the engine should read** (the rest only drive callbacks and CHAT `flag:<name>`):
- `kabir-stays` → emit `kabir-stays` at 14:00 instead of `kabir-leaves` (his 15:30 set can happen).
- `kabir-leaves-at-14` → Kabir leaves as usual (the "film it" option).
- `kabir-curfew-16` → Kabir stays but walks off at 16:00, just before the charge.
- `cannon-requested` → the spec's cannon-dance callback. `cannon-to-barricade` → pull the Vajra and
  the hotspot to the barricade.
- `paani-chant`, `crowd-at-barricade` → intensity up and a hotspot pull to the barricade.
- `sharma-tuition-teacher` → unlocks detain-me option 4. `sharma-done-with-you` → overrides a soft
  Sharma: no barricade favour at the showdown.
- `raf-muzaffarpur` → at the showdown this jawan lets the player or crew out through a gali
  (like soft Sharma).
- `seen-as-chamcha` → students slightly cooler (e.g. rally needs +5 aura).
- `sana-short-one` → one more faint risk if the heat rule fires.
- `player-released` → off the bus. `player-stays-detained` → stay on until 17:30 (role `detained`).
  `missed-showdown` → ending callback.
- `back-door-shut` → later detainees can't walk off the bus. `sharma-chasing-friends` → Sharma
  chases Kabir/Nikhil (`chase-start` on them).
- `name-in-register` → +heat at the showdown; the target leans toward the player.
- The `detain-me` scene needs `detainees-escape` emitted mid-scene, at the Nikhil "hum bahar aa gaye"
  beat, before the options.

**Phone**: CHAT triggers are cue names, clip kinds, `phase:<name>` and `flag:<name>`. Captions:
`CAPTIONS[kind].now` when posted, `.later` for the 17:00 repost. `REAL_REELS` items carry `label`
("inspired by a real reel"), `inspiredBy {incident, source, url}`, `commentsSource`
(`research` | `paraphrased` | `invented`) and a suggested `phase` to surface them.

**Barks**: `CALLBACK_BARKS[flag] = [[speakerType, line]]`. Mix them into that type's bag once the flag
is set. That bag is where "Arre, tuition wala banda!" lives.
