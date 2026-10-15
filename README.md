# Side Quest Republic — One Delhi Afternoon

Full-browser 3D social mischief demo, built with vendored Three.js and original Blender assets. Serve `dist` over HTTP (`python3 -m http.server 4173 --directory dist`). WebGL 2 required; no build/install step. Google Fonts are optional.

WASD/arrows move; Shift runs; Space jumps; drag rotates the camera; wheel zooms. E interacts, Q drops the carried object, G performs, F takes a landmark photo. J opens stories, directions, memories and sources. Escape pauses. Touch controls and click-to-walk are provided; desktop is the primary target.

Three stories can be played in any order: borrow and return Ravi's speaker after a crowd performance, take Kabir's career question to Officer Sharma, and reunite Nikhil with his lost phone. Additional water deliveries, costumes, photographs, key incident, police pursuits and recoverable capture feed the afternoon recap. Objects remain where dropped. Leave at the Metro whenever ready. Progress is session-only; reloading starts over.

Police use notice, chase, last-seen search and patrol states with line-of-sight checks. The original WebAudio soundtrack changes with suspicion, chase and performance. This is a compact stylized interpretation of CP/Jantar Mantar, not a measured replica, photogrammetry, or realistic policing simulation. The bus is a stationary story prop. Reported inspiration is distinguished from invented characters, dialogue, rewards and outcomes in Field notes. References/model provenance: `assets-src/ASSETS.md`.

Validation: `node test-3d.mjs` checks collision, occlusion, A* navigation, movement, sprint/stamina, jump/landing and police detection/capture. These are logic tests, not proof of visual quality. Browser smoke review covers 3D loading, camera/movement, journal and conversations. Full route completion and audio listening remain separate acceptance checks. Original 2D prototype retained in `archive/v1`.
