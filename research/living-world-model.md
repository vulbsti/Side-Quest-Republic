# Living world simulation model

The day is a 1,200-second single-player simulation. It advances on integer simulated seconds; fractional browser frames accumulate in `remainder`. The world uses a saved xorshift seed. Independent event timing varies within twelve seconds, and initial local density/tension vary modestly. Identical seed and commands produce the same outcome regardless of frame partitioning.

## Ownership and integration

`living-world.js` owns social truth and progression, not Three.js transforms. Pass `{encounters, actors, districts}` to `createLivingWorld`. `advanceWorld(state, seconds)` advances unattended arcs and deadlines. `actWorld` validates an available encounter choice, records the action and applies declared effects once. `getAvailableEncounters` filters time, resolution and prerequisites. Root UI owns spatial access and presentation. Save the complete JSON state, including RNG, pending commitments and event history. `restoreWorld` validates snapshots.

The simulation has no LLM requirement. Dialogue is authored. The content is explicitly fictional; mechanisms are inspired by social situations, and do not establish allegations about real parties or people.

## Mechanisms

Actors compare help, duty, attention, verification, de-escalation, livelihood protection and rest. Scores depend on local conditions, actor-local knowledge, values, energy, security, economic stakes and commitments. Constraints can reject an action, rather than merely reducing a number. Commit periods prevent frame-to-frame indecision. Every choice lists rejected alternatives and its triggering event for inspection.

Values include care, recognition, duty, autonomy, loyalty, security, reputation and economic responsibility. Needs include fatigue, fear, belonging, security and status. Driver/vendor income at risk and dependent count affect livelihood protection. Duty commitments have deadlines and costs. The simulation does not claim psychological precision: these are inspectable authored dramatic rules.

Pairwise actor ties record trust, loyalty and obligation. Witnessed help changes trust and obligation; trust changes the confidence of relayed information. Player ties separately record trust, familiarity and resentment. Promises persist, resolve or fail, affecting their recipient's trust.

District supply, access, density, solidarity and tension have direct effects on decisions. Institutions have cohesion, legitimacy, pressure and resources; these affect instructions, passage access and confrontation severity. Concurrent scheduled arcs cover arrivals, negotiations, attention, diverging demands, supply delays, conflicting accounts, changed orders, a confrontation, responsibility and dispersal.

World truth is separate from beliefs. A witness belief retains the event and observed district. Rumours never automatically become truth. Locally co-present actors can relay beliefs with confidence discounted through trust. No actor receives the global player rumour/evidence counters as personal knowledge.

Player aid, escalation and evidence change later scheduled circumstances. The pressure-point confrontation can remain contained, fragment the square or spread more severely. An ending always occurs after the full day; severity, relationships, evidence and broken/kept promises persist in its account. Events missed by the player have authored expiry consequences.

## Verification

`node test-living-world.mjs` runs passive, helpful, disruptive and inconsistent complete days; checks causal divergence, deterministic frame partitioning, save/resume equivalence, one-time actions, promise failure, uncertain-information separation, valid decision reasons and source-aware knowledge. The inspector exposes actor records, their current local conditions, decisions, memories and promises.

## Limits that must remain visible

This is a bounded authored social simulation, not a model of real political causation. Crowd rendering and capsule movement are separate; actor activities currently describe simulation intentions until the client maps them to animations/routes. The writer still supplies encounters, options and spoken lines. There is no free-form generated conversation or live video-generation pipeline. Numeric values should be tuned by observed playthroughs, not treated as scientific estimates.
