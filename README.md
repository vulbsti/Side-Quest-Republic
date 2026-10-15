# Side Quest Republic — One Delhi Afternoon

A full-browser 3D social adventure set in a compressed, reference-informed version of Connaught Place and Jantar Mantar. Version 5 connects the three stories into a campaign with browser saves, selectable interactions, ten optional moments and an ending that reflects your choices.

## Run and controls

Serve `dist` over HTTP from this directory:

```sh
python3 -m http.server 4173 --directory dist
```

Open `http://localhost:4173`. WebGL 2 is required; no build or dependency installation is needed. Three.js is vendored. Google Fonts are optional.

WASD/arrows move, Shift runs, Space jumps, dragging rotates the camera, and the wheel zooms. E performs the selected nearby action; **Tab cycles available actions**, so talking to someone does not hide a nearby pickup. Q drops an object, G performs, F takes a landmark photo, and H calls a group chant. J opens stories, directions, memories and sources; Escape pauses. Touch controls, click-to-walk and story navigation are provided. Desktop remains the primary target.

The minimap rotates with the camera: its top represents the direction you are looking. Displayed markers and click destinations use the same coordinate transform. Choose a tracked story and use its navigation action to walk toward the next objective; manual movement takes over.

## Finish the afternoon

Play the three stories in any order:

1. Borrow Ravi's speaker, take it to the stage, gather a crowd, complete a performance, then **return the speaker to Ravi**. The performance alone does not finish this story.
2. Take Kabir's career question to Officer Sharma and resolve the follow-up conversation.
3. Find Nikhil's phone and bring it to the check-in volunteer to reunite him with the group.

The stage offers an eight-beat rhythm challenge or a **call-and-response alternative without beat timing**. Both finish the same performance. The conversation version asks for three matching answers across four rounds.

All three resolved stories complete the campaign. The Metro provides a recap; leaving before completion produces a partial afternoon rather than claiming all stories are finished. The ending reflects completed errands, trust, mischief, the key's return and earlier captures. After an interruption by police, progress remains and dropped belongings can be recovered.

Ten moments track the three story resolutions plus water deliveries, three landmark photos, returning the key, wearing the costume, a ten-person chant, escaping a pursuit, and trying four distinct social exchanges. These are optional discoveries, not prerequisites for the three-story campaign. Items remain where you drop them, and the speaker can be picked up again after performing.

## Continue after reloading

Progress automatically saves in **this browser's local storage**. The title offers **Continue your afternoon** when a valid save exists; **New afternoon** explicitly starts over. Reloading no longer clears progress. Saves include quests, social history, memories, stats, player/camera position, NPC participation and carried/dropped items. Conversation windows and an unfinished rhythm attempt are transient.

Saves are local to the browser and site address, not cloud accounts. Clearing site data, switching browsers or changing the origin will not transfer the save. If storage is blocked or full, the game reports that saving is unavailable. The versioned save helpers reject unsupported/corrupt data without deleting it. Source and tests: `dist/save-game.js`, `test-save.mjs`.

## World, characters and provenance

Textured, skinned MakeHuman-derived humans replace the original capsule characters. Male, female and unarmed khaki officer variants share geometry and textures between clones, with original skeletal idle/walk/run/carry/wave/jump clips and runtime clothing colors. These are authored game animations, not motion capture; foot-placement IK and photoreal facial acting are not implemented. See `assets-src/HUMANS.md` for CC0 asset provenance and limits.

Original Blender colonnades, observatory forms, bus, cart and barricades establish the Delhi setting. Photo-based CC0 asphalt, stone, plaster and HDR lighting replace flat surfaces; benches have grain and hardware, and foliage is instanced. The balanced graphics setting reduces foliage density. These are architectural interpretations and material analogues, not measured replicas or photogrammetry. The bus is a stationary story prop. See `assets-src/ASSETS.md` and `assets-src/ENVIRONMENT.md`.

Police use notice, chase, last-seen search and patrol states with line-of-sight checks. Characters separate physically, and vertical collision handles supported surfaces and ceilings. An original WebAudio soundtrack changes with suspicion, pursuit and performance.

Hinglish conversations and seven social interaction types distinguish aura, rizz, trust and heat. Friendly first jokes do not spike heat; repeated pestering has diminishing rewards. Recruit people through conversation or nearby performances; ten nearby participants enable the group chant. The rules and dialogue are fictional, not predictions about actual policing.

Field notes distinguish reported inspiration from invented characters, rewards and outcomes. A signed-in Instagram inspection read a small visible comment sample that included amusement and criticism; unavailable clips and unverified examples remain documented in `research/`. The tuition and compliment scenes are user-inspired fiction, not confirmed historical reenactments.

## Verification

Pure-module suites currently pass:

```sh
node --test test-3d.mjs test-social.mjs test-save.mjs test-minimap.mjs test-interactions.mjs test-campaign.mjs
```

They cover movement/collision, navigation, body separation, jump/landing, police state transitions, social rewards, save corruption and roundtrips, minimap transforms, interaction selection and campaign summaries. Passing these checks does not establish visual quality or a completed player journey.

**Version 5 browser acceptance completed on local preview (`http://localhost:4319/`, 15 Oct 2026):** played all three stories through normal browser controls to the 3/3 “Chaotic. Reliable.” Metro epilogue. Verified speaker permission/pickup, save/reload while carrying, stage connection, crowd recruitment, four-round call-and-response, retrieval and return; phone pickup/delivery and Nikhil following; Kabir/Officer Sharma career dialogue. The journey caught and fixed stale NPC navigation targets after spawn recovery. Confirmed selectable nearby actions, map click starts a route, campaign progress persists, readable prompt styling and layout at 697×1301. Browser console reported no errors at the end. Map cardinal orientation and inverse click projection are covered by deterministic tests. Rhythm timing, every optional moment, audio listening and all devices remain separate coverage limits.
