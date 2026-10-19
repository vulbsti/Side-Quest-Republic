# Side Quest Republic — Same Day Again

A 3D browser game about one chaotic protest day at Jantar Mantar and Connaught Place. The day loops: from 10:00 to 17:00 people follow their routines, and what you move around (a speaker, a bus key, a rumour) changes where the crowd ends up, where the police stand and how the day ends. When it ends you wake up at the Metro exit again, keeping what you learned on the chaos board.

The whole cast is in: Ravi, Iqbal, Officer Sharma, Mira, Asha (chai and gossip), Zoya (live stream), Meera (reels), Kabir, Nikhil, Dev, Sana, and Inspector Rao on the wireless. Five objects (speaker, bus key, megaphone, Zoya's phone, Sana's water crate), three rumours you can whisper (water cannon, free biryani, a minister's visit), 31 rules, 40 chaos-board links and 13 endings.

The story runs on three levers shown on the HUD: the mood (calm, rising, boiling over), where the biggest crowd is, and where the police are looking. At 15:00 Inspector Rao lines his men up wherever Zoya's viral stream is pointing, or at the biggest crowd. At 15:30 whoever holds the megaphone decides what the stage hears. At 16:00 a minister either shows up or (always) doesn't.

## Run and play

```sh
python3 -m http.server 4173 --directory dist
```

Open `http://localhost:4173`. WASD/arrows move, Shift runs, drag to look, wheel zooms. E acts on whatever is nearest (pick up, give, talk), number keys whisper a rumour after you talk to someone, Q puts down what you carry, hold T to let time pass faster, Tab opens the chaos board. Talking to people adds their routine to the board; seeing a rule fire adds a cause-and-effect link.

## How it is built

- `dist/loop/rules.js` holds the whole day as one world state plus routines and rules ("when X happens on screen, person Y does Z"). It has no DOM or Three.js, so whole days can be played in tests.
- `dist/loop/content.js` holds every line, hint, board link and ending. Writers can change the day's words without touching the engine.
- `dist/loop/main.js` draws the state in the existing 3D city and turns keys into actions.
- `node test-loop.mjs` plays about twenty scripted days (idle, stolen speaker or key, rumours at different times, a stolen phone, the megaphone handed to Mira or Kabir, the minister rumour with and without a camera, hidden water, Nikhil brought to Kabir) and checks they end differently. It also checks every rule says something visible and every board link happens in at least one of those days.

The previous v27 build is still available at `http://localhost:4173/v27.html`; its modules in `dist/` are reused for the city, characters, movement and bus model.

# Previous build (v5–v27)


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

## Version 6: the living day

The main experience is now a twenty-minute morning-to-aftermath simulation across nine districts. Press **P** for unfolding encounters, the city map, people, your scene feed and developer inspector. **V** joins a nearby moment. Menus pause; the explicit wait button advances thirty simulation seconds. The earlier physical errands remain accessible through **J** and normal object interactions.

Twenty-four authored encounters contain one hundred choices, conditional opportunities, remembered dialogue and missed-event outcomes. Twelve named actors weigh values, constraints, economic obligations, needs, institution pressure and social relationships. Source-aware beliefs spread locally; promises have deadlines. This is fictional drama inspired by researched humour, not an assertion about real political organisations or a validated model of Indian society.

The inspector explains selected actions, scored alternatives, blocked actions, triggering evidence and relationships; it exports snapshots and runs absent/helpful/disruptive/inconsistent policies through the complete seeded day. Those rehearsals test the simulation rules without travel; they do not establish that a walking player can attend every event. Original four-shot scene edits and procedural musical cues accompany choices. Browser speech is optional; production voice performances and licensed reel footage are not included.

Expanded areas: Seva Camp, Press Lane, Civic Court, Service Gali and Assembly Garden, connected to the existing CP/Jantar/Metro streets. Movement bounds, collision, pathfinding, save coordinates and maps share the expanded geometry. NPC route searches are staggered and rate-limited.

Validation: all ten `test-*.mjs` suites pass, including all 24 scene approaches and 72 directed district routes, seeded full-day policies, saved-world continuation, old-preview migration, remembered callbacks and kept/broken promises. Browser QA on localhost:4323 exercised the opening encounter, a speaker promise, reload, the readable inspector and its four rehearsals, afternoon callbacks, navigation initiation and an evening recap via the explicit wait control. It does not constitute a continuous twenty-minute physical traversal, audio listening sign-off, every-choice visual review, or performance certification on every device.

This release supplies the complete day's simulation and authored encounter arc. Visual behaviour remains an abstraction: many institutional consequences appear through dialogue, local conditions and the inspector rather than bespoke crowd cinematics. Photoreal facial acting, large-scale riot choreography and a measured geographic replica remain outside this build.
