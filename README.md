# Side Quest Republic — One Delhi Afternoon

Full-browser 3D social mischief demo, built with vendored Three.js and original Blender assets. Serve `dist` over HTTP (`python3 -m http.server 4173 --directory dist`). WebGL 2 required; no build/install step. Google Fonts are optional.

WASD/arrows move; Shift runs; Space jumps; drag rotates the camera; wheel zooms. E interacts, Q drops the carried object, G performs, F takes a landmark photo. J opens stories, directions, memories and sources. Escape pauses. Touch controls and click-to-walk are provided; desktop is the primary target.

Three stories can be played in any order: borrow and return Ravi's speaker after a crowd performance, take Kabir's career question to Officer Sharma, and reunite Nikhil with his lost phone. Additional water deliveries, costumes, photographs, key incident, police pursuits and recoverable capture feed the afternoon recap. Objects remain where dropped. Leave at the Metro whenever ready. Progress is session-only; reloading starts over.

Police use notice, chase, last-seen search and patrol states with line-of-sight checks. The original WebAudio soundtrack changes with suspicion, chase and performance. This is a compact stylized interpretation of CP/Jantar Mantar, not a measured replica, photogrammetry, or realistic policing simulation. The bus is a stationary story prop. Reported inspiration is distinguished from invented characters, dialogue, rewards and outcomes in Field notes. References/model provenance: `assets-src/ASSETS.md`.

Validation: `node test-3d.mjs` checks collision, occlusion, A* navigation, movement, sprint/stamina, jump/landing and police detection/capture. These are logic tests, not proof of visual quality. Browser smoke review covers 3D loading, camera/movement, journal and conversations. Full route completion and audio listening remain separate acceptance checks. Original 2D prototype retained in `archive/v1`.

## October 15 realism and social pass

Textured, skinned MakeHuman-derived humans replace capsule characters. Original skeletal idle/walk/run/carry/wave/jump clips blend at runtime. Three variants share geometry and textures between clones. This is a substantial prototype upgrade, not motion capture or GTA-quality animation. See `assets-src/HUMANS.md` for provenance and production limitations.

Photo-based CC0 asphalt, stone, plaster and HDR lighting replace flat surfaces. Benches have procedural grain and hardware; foliage is instanced and the balanced setting reduces its density. Material references are analogues, not surveyed Delhi surfaces or a photogrammetric reconstruction. See `assets-src/ENVIRONMENT.md`.

Characters separate physically; vertical collision uses feet/body height, supported bench tops, ceiling contacts and substeps. Regression tests cover landing, walking off, traversing benches, fast falls, wall-constrained body separation and thin obstacles.

64 original Hinglish dialogue adaptations and seven social interaction types distinguish aura, rizz, trust and heat. Friendly first jokes have no heat spike; repetition diminishes rewards. Talk to crowd members or perform nearby to recruit them; H chants with ten nearby recruits. Taking a bus key raises heat and can cost trust. These are fictional rules, not predictions about actual police conduct.

Signed-in Instagram inspection directly read one visible comment sample, including both amusement and criticism. Research provenance, unavailable clips and unverified user examples are recorded in `research/`. The tuition and compliment scenes remain user-inspired fiction rather than confirmed historical reenactments.

Current verification: physics and social model suites pass. Local browser review verified loading, human meshes, environment materials, Hinglish Kabir dialogue, officer choice menus and tuition-joke reward (aura10/rizz5, no heat). Full ending, sustained performance across devices, final audio listening and every animation transition have not been exhaustively validated.
