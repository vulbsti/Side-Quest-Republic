# Playtest 1: three days at Jantar Mantar

I played three days in headless Chromium (SwiftShader, 1280x720, `?nostings`). Each day was driven by player movement and real key presses (E, R, number keys, Space, P, Tab), with `act()`-backed prompts and choice cards. I used `__loop.advance` + `__loop.snap()` only to skip time between beats. The screenshots are in `docs/screens/playtest/`. All of them were taken from the same build, after the fixes listed below.

The harness scripts are not in the repo. They move the player with the same teleport/walk calls each run, so a day can be replayed. One caveat: in headless mode the frame rate is very low. A key press that lands before the first frame after a teleport is sometimes lost. The scripts therefore retry the key steal and wait for the scene card. The phase banner and speech bubbles run on frame time, so in the harness they hang around much longer than they would in real play. The scripts hide the banner before each shot.

## The three days

### Idle: you stand at the stage and watch (`idle-*.png`)
- **10:30**: a light morning. Ravi's speaker and Asha's chai are at CP, a few students are at the stage, and the van sits at the corner.
- **12:40**: party workers walk the flag column down from CP. The stage crowd is filling.
- **14:40**: tense. The detention bus is parked at the stage and the provocateurs (box-fresh shoes) are hidden in the crowd. No one deals with them.
- **15:50**: the Vajra is at the stage. The 15:30 stone is followed by the 15:45 charge, so people are scattering, ducking and being shoved back.
- **16:20 / 17:20**: tear gas, then a thinned, angry crowd at dusk with a full bus.
- **Ending**: "Shields against bodies". Role: Spectator. How bad: Rising. Where: the stage, 15:45.

### Chaotic: steal the key, whisper, join the provocateur (`chaotic-*.png`)
- **11:00**: you pocket Iqbal's bus key at his chai break, in front of a constable. The "A constable is chasing you · 6 m" HUD appears, and the bubble says "Oye! Ruk! Chabi wapas kar!" (`chaotic-chase.png`). You lose him in the stage crowd.
- **12:10–12:40**: you whisper rumours to Dev and Asha. Nuisance goes up and the board logs the rumours.
- **14:30**: you walk up to the man with the earpiece. The provocateur card offers Join / Report / Expose, and you join him (`chaotic-provcard.png`). By 14:40 heat is about 80 and your area is the target.
- **15:15**: the charge comes for you. An RAF jawan pulls you out, and from 15:50 you are on the detention bus (`chaotic-1550/1620/1720.png`). The seated view is from the aisle, with other detainees in the seats around you and the "Detained · On the bus" card.
- **Ending**: "Shields against bodies". How bad: A riot, at 15:15. Who they went after: you. Role: Detained, or Instigator in one run where you were never caught (see below). The "Because of you" lines name the key at 11:00, joining at 14:31 and the 15:15 pickup.

### Helpful: charm Sharma, ask for the cannon, water Sana, expose, protect (`helpful-*.png`, reels)
- **10:08–10:42**: you pester Sharma: career advice, then "he's cute", then the water-cannon arrangements. That fires the cannon request at 10:42. You carry Sana's water crate to her at 10:50.
- **13:50**: the mummy-call reel. You choose "Ask Sharma to play the tuition teacher" (`reel-mummy-beat/options.png`).
- **14:05**: the cannon-request reel. You choose "Ask about the water cannon like it's room service" (`reel-cannon-beat/options.png`).
- **14:30**: you rally 5 students at the stage, find the provocateurs and expose them on camera. All three run for the SUV. The phone shows "PROVOCATEUR EXPOSED" as your clip (`phone-feed.png`).
- **15:02**: stance "Protect each other". From 15:50 the Vajra sprays the barricade. A crowd moved there, and the students near the landing point dance (`helpful-1550.png`). From 16:40 it is a sit-in, with no charge.
- **Ending**: "Sit-in at dusk". Role: Peacemaker. How bad: Calm. "No charge came".

### How they differ by afternoon
| | Idle | Chaotic | Helpful |
|---|---|---|---|
| 14:40 hotspot | stage, provocateurs hidden | stage, you're with the provocateur, heat ~80 | provocateurs gone (exposed), crew of 5 |
| 15:50 | Vajra + lathi charge at the stage | you're on the bus | Vajra spraying the barricade, kids dancing |
| 17:20 | gassed, thinned stage crowd | still on the bus | sit-in at the barricade |
| Ending | Shields against bodies · Rising · Spectator | Shields against bodies · A riot · Detained | Sit-in at dusk · Calm · Peacemaker |

From about 14:30 the screenshots look clearly different: a different place, a different camera (the bus interior), and a different crowd state.

## What I fixed during the playtest
- **Integration**: real GLB vehicles (Vajra, SUV and bikes with flags, canister, detention bus with seats), held group flags and placards, and RAF and constable rigs. Real clips are used: Dance, Sit, Lie, Push and Chant at clashes, Film, and Lathi in the charge. Shoved and Duck play once, with a real backward step. The Vajra turret aims, and the spray leaves the nozzle tip. The "DELHII" decal is fixed by widening the decal 2.5%.
- **No T-pose** for the crowd, police, RAF, crew or player anywhere in the screenshots.
- **Reels**:
  - Close-ups are taken from in front of the speaker at head height, and reaction shots go to the listener's front.
  - The camera now raycasts the shot and swings round, or pulls in, when a wall or seat back is in the way.
  - The raycaster had no camera, so every sprite hit (labels, bubbles) threw `Raycaster.camera needs to be set` and `matrixWorld of null`, which killed the reel camera. This is now fixed, and the console is clean.
- **Detained view**: it was outside the bus, looking at the side panel. Now it is from inside the aisle, facing your seat, so the other detainees sit around you. When you are put on the bus the camera cuts instead of swooping. The DETENTION banners are raised above the windows.
- **People inside the bus**: when the bus parked on the sena group, they stood inside its body. Now anyone inside the bus footprint steps out to the nearer side.
- **Objective card**:
  - It no longer says "Put it down here" all day while you carry the key.
  - It no longer shows the stance card after you have chosen.
  - It prefers the hotspot after 14:00 unless something is urgent.
- **Prompt reach**: the nearest prompt skipped real actions because of always-present local "take" items. Scene prompts now show from 6 m.
- **Crowd**:
  - Fainting is rarer (it was a quarter of the crowd).
  - On the helpful day the cannon dance happens where students are, not at an empty barricade.
  - The sit-in only happens when there was no charge.
- **Small fixes**:
  - Kabir and Nikhil now wear different outfits.
  - The ending says "Where the day ended up" when nothing broke out.
  - Nikhil's objective now reads as a request.
  - On mobile, the radio no longer covers the detained card.

## What is still weak (honest list)
- **The water spray is barely visible** in SwiftShader. On the helpful 15:50 shot you have to know where to look for the dance. It is worth checking on a real GPU.
- **Translucent white rectangles** above the detention bus roof show from some angles (idle 12:40–17:20). I think they are bus glass or sign quads seen edge-on. I did not track down which.
- **Reel beats often open on Meera's to-camera intro** in the phone frame, not on the speaker. The faces are framed, but the shot I captured mid-beat is Meera, not Kabir or Sharma.
- **Seated detained view**:
  - The player's head is close to the top of the frame, and the row in front blocks part of the view.
  - After the detain-me scene empties the bus (`detained-hud.png`), the empty seats dominate.
- **The phone ticker** stamps a batch of items with the same time (14:05 ×6).
- **The helpful afternoon is sparse** at the barricade compared to the stage crowd. It reads as calm, but also a bit empty.
- **The idle and chaotic days end on the same title**, "Shields against bodies", because both end in a stage charge. Only the role, the severity and the "Because of you" lines differ. A riot you caused probably deserves its own headline.
- **The van has no collider.** Kabir's whisper card closes if he walks off mid-choice.
- **Run-to-run variance on the chaotic day**: in one run the constable never caught you after the provocateur, so the ending was "Instigator", not "Detained". That is a legitimate branch, but the outcome is not fixed.

## What I could not verify
- Real-GPU frame rate, the look of shadows and particles, and audio. All of this was headless SwiftShader with audio off.
- Timing feel: bubble lifetimes, phase banners and camera lerps are frame-time based, and the harness ran at a few fps.
- **detain-me**: Kabir was forced onto the bus for that reel (`reel3`). I did not reach the scene through a natural arrest of a friend.
- **Mobile layout**: I only checked it by CSS reading, not on a phone-sized viewport.
- **Console**: across all four scripted runs, the only message was the SwiftShader warning `KHR_parallel_shader_compile extension not supported`. There were no errors.
