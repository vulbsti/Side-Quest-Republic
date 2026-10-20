# talks-locals: notes for the lead

File: `dist/loop/story/talks-locals.js` (Asha, Sana, Ravi, Iqbal, Sharma). Test: `tests/test-talks-locals.mjs`.

## Engine requests (each one has a stopgap in place already)

1. **`notFlags` ignores `water-delivered`.** `meets()` in rules.js maps `flags: ['water-delivered']` to `s.waterOk`,
   but `notFlags` reads `s.flags` only, so "Sana has no water" can't be gated. Stopgap: Sana's
   `sana-water-arrived` (priority 9, any phase) opens first once the crate is in and sets my own flag
   `sana-has-water`. The no-water talks use `notFlags: ['water-delivered', 'sana-has-water']`. If the player
   walks away from that talk without choosing, the flag never gets set. Fix: map `water-delivered` in
   `notFlags` too.
2. **No way to kill a rumour from a conversation.** Asha's "kill the cannon forward" option sets the flag
   `asha-kills-cannon`. Request: `unrumour:<rid>` (sets `s.rumours[rid].dead = true`), or have applyFlag
   handle `asha-kills-<rid>`.
3. **`rumour:<rid>:<place>` doesn't record `memo('rumour-<rid>')`**, so the cannon-rumour and biryani-rumour
   callbacks never fire when the rumour was planted through Asha. Request: placeLearns via the story should
   memo it like a whisper does.
4. **`give:<obj>:<owner>` bypasses the owner logic** (giveObject only). Giving Sana the water this way doesn't
   deliver it, and giving Ravi or Iqbal their object while they're searching leaves them searching forever.
   Stopgap: I use `drop:key:keyHook` and `drop:speaker:stageSpeaker`, which the owners' own routines pick up.
   Request: route `give` for an owner's object through the rules' `give` verb.
5. **The story levers aren't read by anything yet.** `intensity`, `target`, `hotspot` and `stance` only write
   `s.story.levers`; nothing in rules.js consumes them. My showdown options use them, as the plan says.
6. **`requires.did` only matches `done`.** I'd like `failed: [ids]` (or `ended:`) so Iqbal can tell
   "you took my key and got away with it" apart from "you never tried". Meanwhile I use `did` plus the
   chabi writer's flags (`iqbal-likes-you`, `rishta-consultant`) and my own (`iqbal-suspects-you`).

## Flags I set that others may read
- `iqbal-on-your-side`, `iqbal-likes-you`, `iqbal-forgets-key`: Iqbal will slip the key or open the back
  door (good for the bus-andar window route).
- `asha-hideout`: Asha keeps a spot behind her stall (dhuan could hide a friend there). `asha-covers-you`,
  `asha-suv-tip` (naye-joote could open faster), `asha-metro-meetup` (ghar-jaana-hai could use it).
- `ravi-owes-you`, `ravi-unplugged-neta` (mira-mic), `ravi-playlist-90s|haryanvi`.
- `sana-runner`, `promised-sana-water`, `gave-sana-bottle`, `sana-has-water`.
- `sharma-bus-ride` (the aftermath option that puts you on the bus with `detain:player`).
