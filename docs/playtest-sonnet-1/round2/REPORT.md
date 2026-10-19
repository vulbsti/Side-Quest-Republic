# Round 2 playtest (PR #1 at d72a030)

Re-tested the six fixes and replayed the repo's own test routes in the browser (headless Chromium, clock jumps + `__loop.snap()`).

**Fixed and verified:** party crowd jumps with arms up (`party-fixed`), singalong crowd sits and sways (`singalong-fixed`), clash shows shoving and a constable (`scuffle-fixed`), toast is one tidy box, phone whisper menu is clean with the toast at the top (`phone-whisper-fixed`), overhead banner fades.

**Endings reached in the browser with no JS errors:** march, cpjam, ghost, biryani, noshow, heat, scuffle (non-live), quiet, packed, roast (plus singalong, viral, detained in round 1).

**Still open (minor):**
- Heat ending: toast says people faint and the ambulance comes, but the crowd just keeps standing (`heat-no-faint-visual`).
- Bubbles can still partly overlap (Zoya's covers Sana's in the heat shot).
