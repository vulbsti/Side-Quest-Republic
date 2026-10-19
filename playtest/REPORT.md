1. **Stage steps stop the player outside Mira's handoff range — major**

   **When / where:** Loop 1, 14:27–14:29, centre steps of the Jantar Mantar stage.

   **Reproduce:** Take the megaphone after Dev leaves it. Approach the centre step, then hold W toward Mira. Press E. Walking stops around `(0.14, -10.99)`; Mira is at `(0, -14.5)` and no interaction prompt appears.

   **Expected:** The visible steps provide a walkable route into handoff range using the advertised movement controls. **Actual:** Walking and running stop at the upper lip. **Workaround verified:** Space + W jumps onto the platform and makes “Give Mira the megaphone” available. Space/jump is absent from the title instructions and key help.

   **Screenshots:** [19-mira-handoff-approach.png](shots/19-mira-handoff-approach.png), [21-stage-jump-workaround.png](shots/21-stage-jump-workaround.png), [22-megaphone-handoff.png](shots/22-megaphone-handoff.png).

2. **Phone view offers no usable movement or action controls — major**

   **When / where:** 390×844, Metro exit, 10:01; checked again in the final phone pass, which starts loop 3.

   **Reproduce:** Open at 390×844, start the loop, and wait for “E Talk to Nikhil.” Try to use the visible prompt as a touch control. Look for movement, wait, drop, or board controls.

   **Expected:** A phone player can perform the core actions, or the game clearly states that an external keyboard is required. **Actual:** The keyboard help disappears and there are no on-screen movement/action controls. The E prompt is display text rather than an interactive control: the browser's hit testing reports the canvas intercepting its pointer events. Title buttons and whisper-menu buttons do work with pointer input.

   **Scope:** Responsive Chrome viewport and pointer checks; not a physical-phone performance or touch-device certification.

   **Screenshot:** [56-mobile-no-controls.png](shots/56-mobile-no-controls.png).

3. **Camera collapses into the chai-cart view during the phone pickup approach — major**

   **When / where:** Loop 2, 13:10–13:11, north side of Asha's cart, near `(-17, -37.7)`.

   **Reproduce:** With the normal south-facing camera, walk around the cart's west side, then approach the charging phone from the north. No special zoom is needed. Move toward and away from the cart.

   **Expected:** Camera collision preserves a useful view of the player and pickup area. **Actual:** The camera snaps extremely close; the cart top, pole, and canister fill much of the screen, and the player's face fills the remaining centre. The pickup prompt remains available through this obstructed view. Moving away restores the ordinary view.

   **Screenshots:** [35-phone-north-cart.png](shots/35-phone-north-cart.png), [36-phone-north-attempt.png](shots/36-phone-north-attempt.png).

4. **Barricade detentions are narrated without a matching visible police action — major**

   **When / where:** Loop 2, 16:00–16:16, Parliament Street barricade.

   **Reproduce:** Tell Dev the minister rumour; leave him his megaphone and leave Sharma at the barricade. Watch the crowd gather and remain there through the no-show and shouting.

   **Expected:** The announced scuffle and “Constables start pulling people out of the crowd” have a visible counterpart at this location. **Actual:** Dev shouts, some civilians leave, and the logical barricade crowd drops from 16 to 8. Sharma stays standing at the gap. I saw no constables arrive, pull anyone out, escort anyone, or use a van. The six-person police line remains assigned to the stage. This persisted through a further seven seconds of ordinary simulation after the 16:10 check. The ending subsequently says “Several Detained…”

   **Distinction:** Crowd movement and departures are visible; the reported detention action is what is missing. This observation does not depend on counting a skipped animation as a bug: the 16:00 trigger was crossed in ordinary simulation and the scene was watched afterward.

   **Screenshots:** [44-barricade-crowd-settled.png](shots/44-barricade-crowd-settled.png), [46-dev-1600.png](shots/46-dev-1600.png), [48-clash-without-visible-detentions.png](shots/48-clash-without-visible-detentions.png), [50-loop2-ending.png](shots/50-loop2-ending.png).

5. **Toasts and speech bubbles cover other HUD information — minor**

   **When / where:** Desktop: noon and 15:30 at the stage. Phone: 10:01–10:10 at the Metro.

   **Reproduce:** Watch an event that creates a toast while NPCs speak. At 390×844, start a repeat loop or talk to Nikhil.

   **Expected:** Event text, dialogue, status chips, and the right-side feeds remain readable together. **Actual:** At 12:00 the centre toast covers Ravi's bubble; at 15:30 it covers Mira's singing line. Other bubbles sit over the WhatsApp panel. On the phone, the toast covers the Crowd and Police chips immediately below the clock.

   **Screenshots:** [10-noon-speech.png](shots/10-noon-speech.png), [24-mira-1530.png](shots/24-mira-1530.png), [56-mobile-no-controls.png](shots/56-mobile-no-controls.png), [90-mobile-street.png](shots/90-mobile-street.png).

6. **Long ending cards put their first content above the scrollable top — minor**

   **When / where:** Loop 1 ending at 17:00, desktop; loop 2 ending at 16:20, phone.

   **Reproduce:** Finish a loop with many discovered links. Open the ending and scroll all the way upward. Repeat at 390×844.

   **Expected:** At scroll position zero, the clock/loop label and complete heading can be read. **Actual:** The content is vertically positioned partly above the container. The first desktop ending loses the clock/loop label; its measured first-label top was about −38 px at scrollTop 9, still negative if scrolled to zero. The phone ending's first label begins at −3.5 px even at scrollTop 0. Scrolling downward reaches the buttons, but cannot recover content placed above the top.

   **Screenshots:** [25-loop1-ending.png](shots/25-loop1-ending.png), [51-mobile-ending-top.png](shots/51-mobile-ending-top.png).

7. **Tab cannot open the chaos board from an ending — minor**

   **When / where:** Both ending cards, 17:00 and 16:20.

   **Reproduce:** Finish a loop and press Tab as the listed controls suggest.

   **Expected:** Tab opens the board, consistently with play and the requested post-ending journey. **Actual:** The ending stays open and the debug mode remains `end`. Clicking **Chaos board** works. Once the board is open, Tab or Esc closes it back to the ending.

   **Screenshots:** [50-loop2-ending.png](shots/50-loop2-ending.png), [54-loop2-board.png](shots/54-loop2-board.png).

8. **Moving shuttle abruptly displaces a stationary player sideways — minor**

   **When / where:** Loop 2, about 13:31, shuttle lane between CP and the stage.

   **Reproduce:** Leave Iqbal his key. Stand near `(9.59, -17.89)` while the shuttle returns from CP; release all movement keys.

   **Expected:** A readable collision response without an abrupt position jump. **Actual:** As the bus reaches the player, x changes from `9.59017` to `8.19` between 250 ms samples, while z remains `-17.88804`. This is a roughly 1.4-unit sideways displacement with no player input. The player is not trapped afterward. Samples are retained in [evidence.json](evidence.json).

   **Screenshots:** [38-bus-lane.png](shots/38-bus-lane.png), [39-bus-player-contact.png](shots/39-bus-player-contact.png), [40-bus-shove.png](shots/40-bus-shove.png).

## Requested journeys and results

| Step | Observed result |
|---|---|
| Loop 1.1 — Asha before 10:30 | **Worked.** Reached CP around 10:08, talked around 10:09, unlocked the biryani rumour, and whispered the water-cannon rumour. It later spread and was debunked. [Menu](shots/03-asha-rumour.png). |
| Loop 1.2 — speaker south of stall; dance party | **Not completed.** Taking the speaker while Ravi could see me immediately triggered his reclaim response. He took it to the stage. A later stage pickup was also reclaimed. I did not establish a CP dance party, so its visuals and downstream effects remain unverified. [Reclaim](shots/02-speaker-owner-reclaim.png). |
| Loop 1.3 — bus key | **Worked.** Key was available on the hook at 11:00 and could be carried away. I subsequently put it down away from the bus. The board recorded the missing-key/shuttle-queue consequences. [Carried key](shots/09-bus-key-attempt.png). |
| Loop 1.4 — noon speech and LIVE ticker | **Worked.** Mira spoke into the stage speaker and Zoya's red LIVE panel appeared at top left. Crowds grew. Dialogue/HUD occlusion is bug 5. [Noon](shots/10-noon-speech.png). |
| Loop 1.5 — phone, then return | **Caught in loop 1; completed as a supplementary action in loop 2.** The 13:00 event starts Zoya's trip to the cart; it was charging by the later 13:13 check. Taking it from her side caused immediate reclaim. In loop 2, approaching from behind the cart allowed a successful pickup at about 13:10 and an explicit give-back around 13:16–13:17. Zoya thanked me. [Taken](shots/36-phone-north-attempt.png), [returned](shots/37-phone-returned.png). |
| Loop 1.6 — megaphone to Mira | **Worked with workaround.** Took it at 14:24 after Dev left, then gave it to Mira at 14:29 after jumping over the stage lip. [Handoff](shots/22-megaphone-handoff.png). |
| Loop 1.7 — line at 15:00; Mira at 15:30 | **Events worked.** The line was assigned to the stage at 15:00. Mira led the singing at 15:30 and the line state changed to withdrawn. My first camera angle did not establish the six bodies or show their retreat. A separate brief loop-3 probe later confirmed six visible constables in a stage line. [Singing](shots/24-mira-1530.png), [six constables](shots/57-six-constables-confirmed.png). |
| Loop 1.8 — ending and board | **Reached 17:00: “Hum honge kaamyaab.”** Headline: “Protesters Sing As Police Step Back At Jantar Mantar.” Board showed **16/40 links**, with that ending saved. Used the board button. [Ending](shots/25-loop1-ending.png), [board](shots/26-loop1-board.png). |
| Loop 2.1 — Nikhil to Kabir | **Worked.** Approached at 10:05, talked around 10:06, and led Nikhil toward the stage. He waited there; Kabir arrived around 11:30. By 11:33 they greeted each other and Nikhil's state was `withKabir`. [Start](shots/27-loop2-nikhil.png), [reunion](shots/34-nikhil-kabir-reunion.png). |
| Loop 2.2 — minister rumour to Dev | **Worked.** Talking to Dev unlocked the third rumour immediately; whispered it around 10:19. His WhatsApp post and the later march to the barricade followed. [Menu](shots/30-dev-minister-unlocked.png). |
| Loop 2.3 — water from CP to Sana | **Worked.** Lifted the crate around 10:24–10:25, carried it to the tent, and explicitly gave it to Sana at 10:36. Her thanks and the prevention link appeared. The pickup ring disappeared while it was carried. [Carry](shots/32-water-carried.png), [delivery](shots/33-water-delivered.png). |
| Loop 2.4 — barricade from 15:00 to 16:10 | **Observed.** Dev arrived with the megaphone; a crowd gradually arrived behind him. The crowd state reached 16, then fell to 8 after the 16:00 clash. Sharma remained at the gap, while the police line stayed at the stage. Bug 4 concerns the missing visible detention action. [Gathering](shots/44-barricade-crowd-settled.png), [clash](shots/46-dev-1600.png). |
| Loop 2.5 — ending and board | **Reached the branch's early ending at 16:20: “Vans at the barricade.”** Headline: “Several Detained After Pushing At Jantar Mantar Barricade.” The board retained the first ending and showed **22/40 links and both endings**. [Ending](shots/50-loop2-ending.png), [board](shots/54-loop2-board.png). |

The final 390×844 pass checked title, street HUD, E prompt, ending, whisper-menu layout, and both ends of the board's scroll area. Title and board buttons fit; the board can be scrolled to its final button. The mobile whisper menu and its “Say nothing” button also worked during the initial layout check. [Title](shots/55-mobile-title.png), [whisper menu](shots/90-mobile-whisper.png), [board top](shots/52-mobile-board-top.png), [board bottom](shots/53-mobile-board-bottom.png).

## What felt confusing or fun

- Carrying the water to Sana and getting Nikhil to Kabir have clear, immediate personal payoffs. Their dialogue made success much easier to recognize than a chip changing.
- The singing ending gives the megaphone decision a readable consequence. The board then makes the larger chain worth trying again; its saved knowledge survived the restart.
- Stealing needs better advance feedback. My first E press on the speaker changed Ravi's routine and lost the item instantly. The successful phone approach required finding the far side of the cart, precisely where the camera became least useful.
- Crowds need several real seconds to arrive after a rumour or destination change. Watching them settle was useful; judging the effect immediately would have been misleading. Nearby NPC selection was also easy to misread when Nikhil and Zoya stood together.

## Test setup, limits, and time skips

Tested **19 October 2026**, at `http://localhost:4173`, from the existing server. Fetched and updated `claude/project-thread-jffnrx`; tested revision **`bf7b29707d5d0a4b44482bcee6d65b066af934f6`**. No game code was changed.

The two main journeys used a real **headed Google Chrome** window at **1280×720**, with real keyboard down/up events and mouse drags/wheel input. Hardware WebGL renderer was:

```text
ANGLE (AMD, AMD Radeon 860M Graphics (radeonsi krackan1 ACO), OpenGL ES 3.2)
```

There was an initial short controls/layout exploration in a separate browser tab. After its controller proved unsuitable for held keys, the user authorized local browser automation. The two main loops then ran in one fresh browser context so knowledge persisted between them. A brief third loop checked phone controls and the six-person line; it was not a third ending playthrough. Temporary screenshot files were copied into this folder and removed with the user's authorization.

The debug hook was read for positions, object holders, NPC modes, crowd totals, streaming, and police assignments. It was **not** used to take/give items, whisper rumours, unlock knowledge, or teleport the player. Navigation used keyboard movement, sometimes guided by the read coordinates.

`advance(day, seconds)` was used only to skip waits, with the current x/z copied to **both** `sim.player` and `day.player` after **every call**, including calls that became no-ops. Targets:

- **Loop 1:** 11:00, 11:59, 13:00, 13:12, 14:24, 14:59, 15:29, 16:58.
- **Loop 2:** 10:05, 11:29, 13:10, 14:59, 15:29, 15:39, 15:59, 16:09, 16:58. The 15:39 call was already reached; the final call could not advance an already-ended 16:20 branch.
- **Brief line probe:** 14:59, followed by ordinary simulation and keyboard movement. Six constables were photographed at 15:36.
- T was held briefly to cross the main end-of-day boundary in loop 1. Main observations at noon, 15:30, and 16:00 crossed those triggers in ordinary simulation after waiting nearby.

Advancing skips logical routines faster than visible bodies travel. I allowed ordinary simulation for arrival observations and did not classify jumps/disappearances across an advance as animation bugs. This is **not** an uninterrupted nine-minute pacing measurement. No sustained T-pose or persistent player entrapment was established. The CP dance-party branch, every possible ending, and physical-phone performance remain untested. Screenshot numbers have gaps because redundant and misleadingly named exploratory captures were removed.

Raw state snapshots, time targets, shuttle samples, and console messages are in [evidence.json](evidence.json).

## Console errors — verbatim

One browser console error was captured during the headed main playtest:

```text
Failed to load resource: the server responded with a status of 404 (File not found)
```

The original console collector retained the exact message but not its resource URL, so I cannot attribute it to a particular asset. No uncaught game JavaScript exception was captured during the two main loops. Automation locator timeouts were tool errors and are not presented as game-console errors.
