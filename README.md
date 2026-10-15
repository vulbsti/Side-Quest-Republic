# Side Quest Republic

A playable three-minute canvas game inspired by reporting on Jantar Mantar protest humour. Open `dist/index.html` or serve `dist` with any static server. No build dependencies. Optional Google Fonts fall back to system fonts.

WASD/arrows move, Shift sprints, E interacts, P/Escape pauses. Click/tap destinations to walk and open encounters. Touch direction buttons supported. Complete four encounters, reach 40 helpfulness and 35 aura, then visit the Metro. 100 risk ends the run; time expiry and early departure give partial endings. Choices and the notebook pause time. Best score is stored locally.

The in-game Field notes link five sources and distinguish reporting from invention. July and October reports concern different protests. Viral-clip reporting does not independently authenticate each event. Map, dialogue, numerical risk, rewards, characters and outcomes are fictional; the key is an arcade prop.

Verification: `node test.cjs` checks balanced victory, detention, timeout, pause, timer rollover, movement, tap navigation, unique cardio reward and tea-break cost. This harness stubs the DOM and is not visual evidence. Browser layout inspected separately. No physical-device or audio-listening QA claimed.

Prototype boundary: eight one-time encounters and a Metro exit, not a policing simulation or an accurate geographic map. Next useful move: play feedback on pacing and more authored movement challenges.
