# Playtest report: rebuilt day loop (PR #1, `claude/project-thread-jffnrx`)

Played in headless Chromium (swiftshader), desktop 1280x720 and phone 390x844 touch. Frames run at about 1 to 2 fps, so I jumped the clock with `__loop.advance` and teleported the player; real E/Q key presses and touch taps were used for pick-ups, gives, talks and whispers. Scenarios run: CP dance party, shuttle blocked in its lane, minister rumour to scuffle (viral ending), key theft in front of Sharma (detained), megaphone to Mira (singalong ending), phone layout, chaos board, ending card.

**Harness caveats, not bugs:** speech bubbles that linger for minutes, wireless lines stamped late (for example "16:50 Saade chaar"), and constables still walking in when the clash starts are all caused by the clock jumps with very slow frames. Please do not chase them.

## What works

- Shuttle stops in front of the player, honks once with a toast, and waits (`09-shuttle-honk-ok.jpg`).
- Dance party fires, Rao sends Sharma to CP, Ravi retrieves the speaker, CP calms, Sharma goes back. The wireless lines make the chain readable.
- Detained ending: prompt warns, taking the key in Sharma's sight ends the day (`11-detained-ending.jpg`).
- Megaphone to Mira gives the singalong ending; Dev reacts ("Mera megaphone kahan gaya?!"). Giving, whispering and talking all show a bubble.
- Chaos board and ending cards render and carry over between loops.
- No JS errors, no softlock found. Only console warning is the swiftshader shader-compile extension.

## Issues, most important first

### 1. The big moments have no visible action (the "no visible consequence" problem is still here)
- **Dance party** (`01`, `02`): speaker plays, but the "party" is 6 to 7 people standing in a clump facing the speaker. There is no dance animation, no beat effect on the crowd, nothing that tells you "dance party" except the toast. `main.js` has no dance or party handling for crowd bodies, only the speaker prop scaling a little.
- **Singalong** (`04`): wireless says "Sab baithe hain, gaana ga rahe hain" but the whole crowd keeps standing and nobody sings. Same crowd, same poses as before 15:30.
- **Scuffle / viral ending** (`05`, `06`): at 16:02 the toast says "A scuffle on Zoya's live stream" and Zoya's ticker says "Barricade pe dhakka-mukki", but what you see is Dev standing with a megaphone and a few people walking. No shoving, no line closing in, no reaction. The ending title is "Dhakka-mukki, live" for something you never saw.
- Expected: one clear visible beat per set piece. Ideas: crowd members at the party play the jump/wave animation; stage crowd sits when singalong starts; at the clash the police squad runs to the front and Dev/crowd members push against it.

### 2. Toast text wraps into a narrow column inside a wide box
Long "New on the chaos board: A → B" toasts render as three short centred lines (about 230 px wide) inside a 520 px box, leaving the right half empty (`01`, `04`). Short toasts such as the honk look fine (`09`). The box measures 520 px wide (`#toast`, `loop.css:51`) so the text wrap width does not match the box.

### 3. Overlaps in the HUD
- Speech bubbles are drawn over the HUD panels and over each other. At 15:31 at the stage, five bubbles (Sana, Zoya, Mira, Ravi, Dev) cover the Zoya LIVE ticker top-left and stack on each other (`04`).
- **Phone** (`07`, `08`): the toast sits on the player character's body at 10:00, and when the whisper menu opens, Asha's bubble, the "On the board" toast and the police wireless panel overlap into an unreadable pile. The whisper menu shows keyboard hints ("1", "2", "Esc") on a touch device; those could be hidden on touch.
- Desktop toast vs bubbles: the toast is at the bottom centre and did not collide with bubbles in my runs, but bubble columns on the left do collide with the stream ticker.

### 4. Camera is blocked by scenery on the stage
Standing on the stage next to Mira, the camera sits right in front of the "THE AFTERNOON IS A GROUP PROJECT" banner and it covers the top third of the screen (`03`). The occluder list only counts props with fewer than 600 triangles; this banner needs fading or the camera should stay clear of it.

### 5. Talking repeats
Talking to someone gives the same line every time for a given state (`TALK[id].find(state)` is deterministic), so asking Ravi, Asha or Dev twice repeats word for word. The whisper replies are the same story. Ambient lines pick from at most 3 matching lines per mood. A second line per state, or "you already asked" variants, would help.

### 6. Smaller things
- Nikhil ("lost") walks between three spots, so "Talk to Nikhil" flickers in and out of range; on the phone a tap on the prompt did not land before he walked off. First person you meet is hard to talk to. He could stand still until talked to.
- The ending card shows Crowd at Jantar 71 while only about 44 crowd bodies are ever on screen (`CROWD_POOL = 44`). Numbers and what you see do not match.
- Ending card for the singalong says "mood rising", which reads wrong for a soft, loud evening.
- The shuttle can be held forever by standing in its lane; there is one honk toast and then silence. Fine as a design choice, but there is no second line to nudge you.

## Not covered

- Squad (Rao's constables) positions at the barricade after a real-time approach: in my runs they were still walking in when the clash fired, so I cannot say whether the line reads well at real frame rates. Worth one look on a real GPU.
- Endings I did not reach: march, roast, heat, ghost, biryani, cpjam, noshow, packed, quiet, scuffle (the non-live one).
- Walking speed and general feel (headless frames are too slow to judge).

## Screenshots

All in this folder: `01-toast-wrap-and-party.jpg`, `02-party-clump.jpg`, `03-banner-blocks-view.jpg`, `04-singalong-bubbles-overlap.jpg`, `05-scuffle-no-fight.jpg`, `06-scuffle-live-ticker.jpg`, `07-phone-whisper-overlap.jpg`, `08-phone-toast-over-player.jpg`, `09-shuttle-honk-ok.jpg`, `10-ending-card.jpg`, `11-detained-ending.jpg`.
