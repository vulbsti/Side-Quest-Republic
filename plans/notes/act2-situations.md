# Act 2 situations: engine notes (mira-mic, afwaah, mummy-call, cannon-request)

Files: dist/loop/story/{mira-mic,afwaah,mummy-call,cannon-request}.js, tests/test-situations-act2.mjs.

## Needs from the engine / checker

1. **`near:player:<who>` in goals.** story.js `holds()` supports it (body('player') is s.player), but
   verify/lib/story-check.mjs rejects `player` as a bodyOrObject. Meanwhile I use `at:player:<place>`
   (afwaah to-rawat: stage; cannon-request to-sana: stage, to-sharma: barricade). Allow `player` in the
   checker and I'll switch to near:player:c4 / sana / sharma.
2. **Kill a rumour.** No do-action sets `s.rumours[rid].dead`. Proposed: `rumour:<rid>:dead`. Meanwhile
   killing paths set the flag `afwaah-killed` (plus `afwaah-factchecked`, `rawat-correction`) and `intensity:-1/-2`.
3. **Tell one person a rumour** (`learn`). Proposed: `learn:<rid>:<who>`, e.g. Rawat learning the DRS
   "saazish" so it travels with him. Meanwhile `rumour:sena:barricade`.
4. **Per-option feed captions.** The ported scenes had an option `payoff: { caption, captionLater }`; I kept
   them on the options (mummy-call, cannon-request). The engine only posts `outcomes[done|fail].caption`.
   Proposed: if the chosen option has `payoff.caption`, post that instead of the outcome caption.
5. **A `drs` voice** for the DRS foot soldier at the barricade (afwaah `bikes` node). Meanwhile `crowd`
   with "(DRS wala)" in the line.
6. **Node-level `do`** for beats-only end nodes (mira-mic `neta-won`). Meanwhile `outcomes.fail.do`
   carries the consequence (`flag:neta-took-mic`, `crowd:stage:-3`, `intensity:+1`); the `auto` repeats it
   because auto doesn't run outcome `do`.
7. **mummy-call when Nikhil is found.** rules.js 13:40 skips the ring if `s.nikhilFound`, but the
   situation hooks at 13:40 regardless and its marker follows Kabir (at the stage). The call still plays.
   If you want it gated, have rules.js set a flag `kabir-on-call` at 13:40 and I'll add `requires`.
8. The old SCENES `callbacks` (flag → bark lines) are not in the new format; the ending-card callbacks
   are now `callbacks` strings. Check CALLBACK_BARKS in barks.js still carries the bark lines.

## Flags set here that nothing reads yet (candidates for rules.js)

- mira-mic: `neta-took-mic`, `neta-photo-with-mira` (repost: "LJM rally"), `mira-kept-mic`, `neta-roasted`,
  `neta-photo-only`, `neta-job-offer`, `dev-lent-megaphone`, `player-bouncer`, `told-mira-to-share`.
- afwaah: `afwaah-ran-wild`, `afwaah-killed`, `afwaah-factchecked`, `drs-heard-own-rumour`,
  `police-expect-drs` (could make the line harder on the DRS side), `rawat-correction`, `rawat-remix`.
- cannon-request: `raf-bottle`, `two-bottles`, `owes-sana-ors`, `drank-sharmas-water` (Sharma no favours).

## Engine flags this content keeps (rules.js reads them)

kabir-stays, kabir-leaves-at-14, kabir-curfew-16, sharma-tuition-teacher, cannon-requested,
cannon-to-barricade, paani-chant, crowd-at-barricade, raf-muzaffarpur, seen-as-chamcha, sana-short-one;
moods kabir grateful|sulking|shook. The scene's `raf` mood moved to `r1` (Jawan Pandey, at the barricade
from 14:00), since `raf` is a voice, not a body.

## test-loop

`node tests/test-loop.mjs` fails on the current tree at "Kabir is still here to take it" (the
nikhilToKabir script no longer sets nikhilFound) with or without these four files. With the other new
situation files stubbed, it passes with these four in. The afwaah auto plants the DRS rumour at the
barricade, not CP: at CP it spread to the stage, called the DRS and broke the sit-in chain.
