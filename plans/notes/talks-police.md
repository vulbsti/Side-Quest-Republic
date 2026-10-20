# Notes: talks-police (named police)

File: `dist/loop/story/talks-police.js`. Test: `tests/test-talks-police.mjs`.

## Flags these conversations set (for callbacks, CHAT `flag:<name>`, later scenes)
- Yadav: `yadav-chai` (you fed him; unlocks his RAF tip and "call Tomar off"), `yadav-looked-away`, `yadav-lookout`,
  `yadav-transfer-reel`, `yadav-waved-off`, `yadav-slogan`. Also sets the engine's `seen-as-chamcha` (gave a cop your chai).
- Meena: `meena-laughed` (unlocks her 15:00 line tip in the tense phase), `meena-truth`, `meena-debunk`, `meena-knows-key`,
  `meena-watching-key`, `meena-tip-provocateurs`, `meena-line-tip`.
- Tomar: sets the engine's `name-in-register`; `tomar-noticed`, `tomar-fake-name` ("Rohan Verma", paid off in the aftermath),
  `tomar-took-poster`, `tomar-vs-rawat`, `tomar-lathi`, `tomar-called-off` (set by Yadav).
- Rawat: `rawat-forward`, `rawat-friend`, `rawat-group` (either unlocks "let the detainees out" in the showdown),
  `rawat-correction`, `rawat-let-go`.
- Gill: `gill-fan`, `gill-reel`, `gill-angle`, `gill-dance`, `gill-watching`, `gill-suv`, `gill-repositioned`, `gill-follow`.
- Pandey: sets the engine's `raf-muzaffarpur` (gali favour; needs help 10+, or thanking him after bus-andar);
  `pandey-sattu`, `pandey-litchi`, `pandey-number`.

## Asks for the engine / lead
1. **PESTER `bored` lists are unreachable.** pester() raises the mood before it picks a line, so the first answer is
   already `amused` (and an annoyed/odd mood maps to `amused` too). Either pick lines by the mood *before* the pester
   or accept that `bored` is never shown. I wrote all three anyway.
2. **story-check warns r1 has 0 conversations in morning/midday.** He doesn't exist before 14:00; the checker could
   skip phases before an officer is created.
3. **A filmable "police-side" happening.** Gill's "film from the police side" uses only effects + `gill-angle`, and
   his duet uses `clip:pester-cute`. A `gill-reel` (or `police-angle`) happening kind with a CAPTIONS entry would let
   the feed post it properly.
4. `move:c1:cp` / `move:c4:cp` (biryani lie) walk the officer off his post and leave him there; `post` isn't changed,
   so `sendHome` after a charge brings him back. Fine as is, just noting it is intended.
5. tests/test-loop.mjs currently fails at "roast chain fires kabir-roast" with or without this file (checked against a
   copy with talks-police stubbed out), so it's not from this content.
