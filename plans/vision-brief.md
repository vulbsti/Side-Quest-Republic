<!-- Copy of the owner's Claude Doc "Side Quest Republic: Game Vision & Build Brief" (https://claude.ai/code/artifact/d6ff2035-7b84-4453-b314-8f1d2af5f944), taken 2026-10-20. The doc is the source of truth; tables are flattened. -->
# Side Quest Republic: Game Vision & Build Brief
2026-10-20 · @utkarsh

## The game in one page
Side Quest Republic is a 3D, full-browser, third-person game about one day at a Gen Z protest at Jantar Mantar and Connaught Place (CP), Delhi. You arrive as a clever troublemaker with friends. The day starts funny and turns dangerous, and your choices shape how it ends.
The owner's one-line vision, agreed on 15 Oct:

A character-driven protest day where independent actors pursue competing goals, humour creates relationships, information changes behaviour, and the player's accumulated choices shape their place in an escalating political crisis.
What the player is. A clever troublemaker in a believable Delhi: improvise, help friends, create chaos, get chased. The player chose this framing themself when asked which feeling mattered most.
What a session feels like.

Morning, calm and silly. A few people, volunteers setting up, bored police, someone already filming something ridiculous. You wander, joke, pester officers for career advice, steal a bus key, help a stranger.

Midday, the place fills. More groups arrive with their own demands. Police get new orders. Reels and rumours spread. Things happen around you whether you join in or not.

Afternoon, it tips. Provocateurs hidden among protesters, barricades, tear gas, lathi charge. People you joked with that morning are now scared, missing, or on opposite sides.

The showdown. A Gangs of New York-style climax. Your earlier choices decide its timing, its location, how violent it gets, who police target, and the role you play in it.
The emotional arc is spectator, then participant, then someone who has to live with the consequences. The player starts with "this place is full of funny things to do" and ends with "given what I've done and who trusts me, what will I take responsibility for?"
The rhythm of every moment: notice something, form a plan, try it, trigger a reaction, improvise, enjoy the aftermath. Humour comes from what happens between people and objects, not from score pop-ups.
The test of success: the player stops asking "what's the next mission?" and starts asking "wait, what's happening over there? I want in."

## Grounding in reality
Every comic beat in the game should trace back to something Gen Z protesters in India actually did this year, then be adapted, exaggerated or invented on top of it. The owner explicitly allowed making things up, as long as the vibe matches the real reels. The setting is a composite of Jantar Mantar and CP, borrowing moments from protests elsewhere in India (Patna, for example).
Seed incidents already researched (from research/RESEARCH.md and research/protest-incidents.json in the repo):
 | 
Incident | 
Where, when (reported) | 
How it plays in the game | 
Source
 | 
Protester grabs the detention-bus keys and runs into the crowd; the driver laughs | 
Jantar Mantar, Oct 2026 | 
The signature mischief verb. Taking the key must strand a real bus, driver and passengers | 
NDTV, reel
 | 
"Sir mujhe bhi detain kar lo, mere dost andar hain", then asks to leave once the friends have escaped | 
Jantar Mantar, Oct 2026 | 
Goal reversal: you get what you asked for, then the facts change | 
Vartha Bharati, reel
 | 
Students ask police for the water cannon because of the heat, then dance in the spray | 
Patna, Jul 2026 | 
Treating riot gear as a weather service. Adapted, not relocated as fact | 
Free Press Journal, TOI
 | 
"Koi tear gas ka intezaam nahi kiye? Water cannon hi chala dijiye." | 
Patna, published Aug 2026 | 
Tone reference for deadpan requests to police | 
National Herald
 | 
Chase clips re-edited with game music, "cardio" jokes, superhero costumes; "Parliament ki doorbell baja ke bhag gaya!" | 
Jantar Mantar, Jul 2026 | 
Chase sequences and reel payoffs should feel like these edits | 
National Herald
 | 
Asking a cop to pose as your tuition teacher on a call with your mother | 
Owner's lead, unverified | 
Scale collision: a small home problem outranks a public confrontation | 
none yet
 | 
"Uncle, aap cute ho" to a police officer | 
Owner's lead, unverified | 
Unexpected friendliness that breaks the authority script | 
none yet
Comment sections are research material too. The bus-key reel drew "Absolute cinema", "This is jantar mantar entertainment 2.0" and also "Funny huh? In what logic?" One act gets laughs, disapproval and police attention at the same time. The game should track those reactions separately.
Comic mechanisms pulled from the reels (from research/reel-analysis-2026.json):

Goal reversal. Someone gets what they asked for, then a new fact makes them want the opposite.

Scale collision. A tiny everyday problem (mummy is calling) takes over a grand moment.

Literal service request. A straight logistics question where everyone expects a confrontation.

Borrowed confidence. A messy, scared moment edited into a heroic reel.

Social permission. The first person to laugh decides whether bystanders join in or back off.

Bureaucratic literalism. A procedural officer meets a request that keeps changing.
What is still missing. Codex only ever watched one real reel. Instagram access failed for most of the session, so no real voices, music or timings were collected. Rebuilding that research corpus is workstream one (see "Reel research pipeline" below).

## The living day
The whole game is one day, morning to night, running on its own clock. The story keeps moving whether or not the player is involved. The player can change the pace and shape of the escalation, but not stop it. In the owner's words: "their actions cause changes in timeline of progress but not stoppage."
What happens without the player. More people arrive as the hours pass. Demands grow and split. Police numbers rise. Hindutva and other political groups show up. Parties send vehicles and people with weapons who hide among the protesters, hit police and turn the crowd violent, and peaceful protesters pay the price. Lots of police arrive with barricades, water cannon and tear gas, and it all blows up into a Gangs of New York-style revolt where the player has a final role.
Read left to right as the clock. The bottom lane is the only one the player controls directly, and it feeds back into every lane above it.
What the player changes (the owner's request of 15 Oct, 22:08):

Intensity. How violent the showdown gets.

Location. Where on the map the final confrontation breaks out.

Targets. Which people the police and RAF jawans go after.

What the protesters do at the climax: hold, scatter, block, protect each other.

Timing. Whether the lathi charge comes early or late.
What the player sees on screen. Every stage of the arc has to be physical, not a line in a menu:

Crowds visibly gathering at one point.

People running.

A lathi charge sweeping through.

Barricades going up.

Buses moving or stuck.

Friends getting separated and found again.
Each choice should come back later. A joke made at 10am pays off in the crisis. The officer you charmed in the morning quietly lets your friend through the barricade. The provocateur you didn't report is the one who throws the first stone near your group.
Pacing (owner, 19 Oct): a full day takes 30 minutes or more of real play. Make the phase changes clearly felt (sound, light, crowd density, police posture) so the player always knows the day has moved on.

## Actors and their motives
Nobody in the game is a cartoon. Every group has its own goals, its own fears and something to lose. They behave like the people seen in real protest footage, so the drama comes from those goals colliding. The owner was explicit: "We need proper realism of social dynamics here." Police can be corrupt but are also duty-bound and sometimes help when they see injustice. Political parties use the police as pawns.
 | 
Group | 
What they want | 
Inner conflict | 
What the player sees them do
 | 
Gen Z protesters and friends | 
Be heard, be with friends, get the clip, get home before mummy finds out | 
Bravado on camera, nerves off camera; sincere cause vs attention | 
Joke, film, chant, get lost, need rescuing, turn on each other under pressure
 | 
Organisers | 
One clear message and a peaceful day | 
Promise more clarity than they have; can't keep every group happy | 
Fight over the mic, negotiate with police, lose control as the crowd grows
 | 
Constables on the ground | 
A manageable shift, some respect | 
Amused by the kids, yet must follow orders; some quietly help, some are bullies | 
Banter, give "career advice", chase you, look away for a friend, swing lathis when ordered
 | 
Senior officers and RAF | 
Orders followed, a clean record | 
Political pressure from above vs what they see on the ground | 
Bring barricades, water cannon, tear gas; pick targets; order the charge
 | 
Political parties and their fixers | 
Use the protest for their own ends, or break it | 
Need deniability | 
Send vehicles and men, plant provocateurs, lean on senior police
 | 
Hindutva and other organised groups | 
Counter the protest, own the narrative | 
Leaders vs foot soldiers acting on their own | 
Counter-chants, scuffles, men hiding in plain sight who hit police so the crowd gets blamed
 | 
Influencers and media | 
A viral clip, an accurate story (sometimes both) | 
Footage that helps the cause can also distort it | 
Re-edit what you did; their caption changes how others treat you later
 | 
Vendors, drivers, residents | 
Get through a working day | 
Like the jokes until it costs them money | 
Chai stall, bus driver whose key you stole, lanes residents open or close
Named cast already written (research/character-voice-cards.json; worth keeping and deepening):

Kabir, a would-be comic student.

Nikhil, a first-timer who keeps getting lost.

Mira, a student organiser.

Ravi, a sound volunteer.

Sana, a medical volunteer.

Meera, a small creator.

Constable Sharma.

An inspector.

A coalition negotiator.

Asha, the chai seller.

A contract bus driver.

An independent journalist.
Each card has a speaking rhythm, an inner contradiction and how the character sounds under pressure.
How motives become behaviour. A motive only belongs in the game if it changes what that person physically does on screen. The Codex build gave each actor dozens of traits (fears, obligations, values) that nothing ever read. Prefer five people with sharp, visible wants over fifty invisible numbers.
Decision (owner, 19 Oct): fictional stand-ins that very closely reflect reality. Invent the party, the Hindutva-style groups and their leaders, but make their names, flags, colours, slogans, vehicles and tactics instantly recognisable to anyone who follows Indian politics. Don't use real organisation or politician names.

## What the player does, and what visibly changes
The player acts with their body in the world, not by picking from a menu, and every action leaves a mark the player can see. Rule for every verb: if nothing changes on screen within a few seconds, the verb isn't finished.
 | 
Verb | 
Inspired by | 
What must visibly happen
 | 
Steal the bus key | 
Jantar Mantar bus-key reel | 
The bus stops dead. The driver searches and shouts. Detainees inside can walk off. Police come looking for you, and the chase is on
 | 
Run, dodge, vault, hide | 
Chase reels edited with game music | 
Cops chase on foot. The crowd parts or blocks. Benches and barricades can be jumped. Getting caught means a real detention-bus scene
 | 
Pester police (career advice, "uncle aap cute ho", ask for the water cannon) | 
Patna water-cannon request, owner's leads | 
The officer's mood changes and nearby people laugh or back off. Push too far and you are on their radar
 | 
Help detainees | 
"Mujhe bhi detain kar lo" reel | 
Get into the van, talk your way out, or create a distraction so people slip away
 | 
Carry and use objects (speaker, water crate, phone, placards, costume) | 
Volunteers in reels | 
A speaker on stage draws a crowd. Water handed out means people remember you. A cape changes how people react to you
 | 
Rally people, social blockade | 
The owner's arc | 
A visible group follows you and can block a road, shield someone or stall a police line
 | 
Film and post | 
Reel culture | 
Your clip shows up in the in-game feed, and its caption changes how characters treat you later
 | 
Confront a provocateur: join him, report him, expose him | 
The owner's arc | 
Joining escalates the nearby fight. Reporting him to compromised police can get you detained. Exposing him on camera turns the crowd
 | 
Join the violence | 
The owner's arc | 
Hotspot intensity jumps, police target your area, and friends may get hurt
Reputation meters are the four profiles from the very first ask: risk, aura, helpfulness and nuisance. They are shown as a small HUD, but they matter only because they change what the world does:

Aura. People recognise you ("Arre, tuition wala banda!"), invite you into bits, and expect a performance.

Helpfulness. Specific people trust you, lend gear, and come to you in the crisis.

Nuisance. Some people love you, others stop cooperating.

Risk / heat. How closely police watch you, how fast they chase, and whether you end up on the bus.
The owner's heat rules (15 Oct, 08:40). The best bits are the ones where Gen Z catches officers by surprise and they don't know how to react. Heat follows legality and confrontation, not how funny something is:
 | 
Action | 
Aura | 
Heat
 | 
"Bhaiya, tear gas chalwa do" / "water cannon ka kya bandobast hai?" | 
High | 
None, since nothing illegal happened
 | 
Friendly roasting of an officer caught off guard | 
High | 
Very low
 | 
Taking the bus keys | 
High | 
High, because it can get you detained
 | 
Ten people together shouting slogans | 
Medium | 
High
 | 
Hitting a police officer | 
Mixed | 
Maximum, guaranteed aggression
 | 
Nothing, but a frustrated officer picks on you anyway | 
None | 
Random spike, because real life is unfair
Density. Something to do should always be within about 10 metres of the player, and the world should keep throwing new opportunities at them as the day moves on. The Codex build failed here: in a four-minute playtest, walking around turned up zero interaction prompts.

## Dialogue and tone
The voice is Gen Z Hinglish: nonchalant, funny, a little unbothered even when things get scary. It should feel like the reels, not like an English script with slang sprinkled on top. In the owner's words: "The dialogues have to be GenZ toned, and also have genZ philosophy, non-chalantness, funny moments and the way of handling things." Aura, rizz and similar slang belong in the game's language.
Do:

Hinglish by default, with English where Delhi kids actually switch ("Bhai, ek second. Nahi, woh wala second nahi, phone aa raha hai.").

Ensemble scenes: 2 to 4 people talking over each other, friends heckling, an officer cutting in, a phone ringing.

Awkward silences, reversals, failed jokes, someone ignoring the joke entirely.

Distinct voices. Kabir over-explains when embarrassed. Sharma asks short questions and repeats your words back to you. Nikhil gives literal updates at the worst moment.

Every option should be fun to pick, with a hidden cost. No obviously "correct" choice.

Lines that callback: characters mention what you actually did earlier.
Don't:

Lectures about responsibility, consent, evidence or safety. Codex's dialogue was full of these ("pooch lena", "verify kar lo").

One NPC saying two lines and ending the scene. That template is why everything felt repetitive.

Reading the player's button label back to them as their spoken line.

A fixed answer order (helpful first, walk-away last).

Formal English narration on scene cards.

Background barks picked by time % 3. Use large pools that don't repeat until exhausted.
Sizing. Aim for 6 to 8 big street situations with deep, ensemble writing. Codex wrote 24 thin ones. Add plenty of short ambient barks per escalation phase and per personality so the background never loops audibly.
Sources for lines. Write from the reel corpus: real phrasing, real comment-section reactions, then exaggerate. Inventing is allowed. Copying a stranger's identity is not. Real clips inspire situations; characters are composites.

## Reel research pipeline
The reel corpus is the raw material for the whole game. It feeds situations, dialogue, characters, voices, music and cinematics. The owner asked for two separate agents for it: one searches and collects, the other analyses clips and comments. Codex never got this working. It watched about three reels and downloaded two, so this has to be rebuilt first.
Pipeline:

Discover. Search Instagram through the owner's signed-in Chrome profile (the one approved in the Codex chat). Hashtags and accounts: Jantar Mantar, the 2026 Gen Z protests across India (Delhi, Patna and others), and reposting pages like peeinghuman and indiebuzzofficial. Look for police banter, bus keys, detention vans, chases, chants, costumes, lathi charges and crowd panic. Also study mantarjantar.com, an existing game on the same theme, and its publisher, as the owner asked. Target: 150+ candidate reels.

Collect. Download public reels through a downloader site such as indown.io, the owner's suggestion, which worked in the Codex run. Store each in research/media/ with its URL, publisher, caption, date seen, view/like counts and the top 20 to 30 comments.

Transcribe. Pull out the audio. Whisper large-v3-turbo on uxserver garbled the Hinglish badly. Use a Hindi-tuned or full large-v3 model, and have an agent listen and correct the key lines before trusting them.

Separate. Split each clip into speech, background music and crowd ambience (Demucs or similar on uxserver's GPU). These become the voice, music and sound-design libraries in the next section.

Analyse. For each reel, record:

the situation;

who is involved (protester type, officer type);

the comic mechanism (see "Grounding in reality");

the best lines, verbatim;

the reaction beats (pause, laugh, cut);

the music and its role;

the comment-section mood (amused, angry, sad).

Catalogue. Write one JSON entry per reel in research/reels/, tagged by phase of the day, emotion, actor type and usable clip ranges. This catalogue is what writers, audio and cinematics agents read.
Already in the repo to build on:

research/reel-analysis-2026.json (comic mechanisms and 5 scene treatments).

research/live-research-2026-10-16.json (3 peeinghuman reels with comments, for example "Dosti > detention" and a Delhi police Q&A reel).

research/reel-download-results.json.
Definition of done. At least 50 analysed reels, each with clean transcripts, separated stems and tags. At least 20 situations in the catalogue are flagged "build this".

## Audio: music, voices and sound from the reels
The game should sound like the reels: real Hinglish voices, the trending songs people put under protest clips, crowds and chants. The owner was explicit (15 Oct, 19:49): "No take already published music, not generate it. Take voices from reels and music from already created music out there. Also from reels and other sources dialogues and voices. No need to create them." No AI-generated music and no text-to-speech as the final voice.
 | 
Layer | 
Source | 
How it's used in game
 | 
Character voice barks ("bhai mat kar", laughs, gasps, "sir ek sawaal") | 
Speech stems separated from reels | 
Short one-liners tied to actor types and moods; reused across the day from big pools
 | 
Signature lines | 
The best verbatim reel moments | 
Played at the matching beat in a scene, e.g. the tear-gas request
 | 
Music | 
Published songs and the trending tracks people use under protest reels | 
Mood per phase: playful morning, rising midday, tense afternoon, chase music, showdown anthem
 | 
Chants and crowd | 
Crowd stems from reels plus public-domain field recordings | 
Density follows the crowd size; chants swell before police moves
 | 
Police and street sound | 
Reel audio, field recordings (whistles, megaphones, sirens, lathis on shields, bus engines, horns) | 
Every police action has its sound; tear gas and water cannon are heard before they're seen
 | 
Comic stings | 
Meme sounds popular in reels | 
Sparingly, on reversals and punchlines only. Silence and music cuts are funnier than constant stings
Extraction steps (continue from the reel pipeline):

Separate stems (vocals, music, ambience) on uxserver.

Cut clean clips with 50 ms fades. Tag each clip with speaker type, emotion, phase, line text and source reel.

Loudness-normalise everything to one target and store it under dist/assets/audio/ with a manifest.

Identify songs used in reels (audio fingerprinting such as Shazam or AcoustID). Then get the clean published track instead of the reel-compressed copy.

A listening pass by an agent before anything goes in. Codex's two candidate cuts were never actually listened to.
Music direction. The music should follow the action like a musician watching the player, a lesson Codex drew from Untitled Goose Game. Music starts, cuts out on an awkward silence, and comes back when the friends laugh. A chase uses the edited "game music" feel from the chase reels.
What exists now (not enough):

Two Kevin MacLeod CC-BY tracks.

A 2006 Delhi street recording.

Small applause and a chuckle.

No character voices at all.
See dist/assets/audio/PUBLISHED-MUSIC-CREDITS.txt.
Rights (owner, 19 Oct): don't worry about copyright for now. Use reel audio and commercial songs freely. Still record the source of every clip in the manifest, so it can be swapped later if the game ever goes public.

## Reel cinematics and the in-game phone
GTA uses cutscenes to tell its story. This game uses reels. The owner's idea (15 Oct, 10:11) is that viral protest moments become playable side quests framed like reels: police, influencers, viral moments, funny sounds and music all become part of the game, so it feels like being at a real protest.
Every side quest follows one structure:

Encounter. You overhear it before you see a marker. For example, a student whispers: "Bhai, mummy ka call hai. Tuition mein hona chahiye tha."

Reel-style setup. A 5 to 10 second cinematic with phone-camera framing, close-ups, reaction shots, captions and the music hit.

Playable improvisation. Control comes back to you inside the scene, and people keep talking while you move.

Social reaction. The bystanders, the officer and your friends react differently.

Reel payoff. Your friend posts the clip to the in-game feed. The clip shows what you actually did, captioned the way a Gen Z page would caption it.
The phone ties it together:

A group chat with your friends, giving locations, panics and "kahan hai tu?".

A feed of reels from around the protest, both real-world-inspired clips and clips of your own actions.

Rumours.

A satirical news ticker. mantarjantar.com does this well.
People later recognise you from your clips ("Arre, tuition wala banda!"). A funny morning clip can be reposted in the evening with a different, dangerous caption.
Using real footage. Real reels can appear on the in-game phone as context, clearly marked as real. The playable versions recreate the underlying situation with game characters who respond to your choices.
Build notes:

Cinematics run in-engine (Three.js camera rigs, letterbox and caption overlay), not as pre-rendered video. That way they show the player's actual character and choices.

The comic timing comes from the reel catalogue: where the pause sits, when the laugh lands, when the music drops.

Start with 3 reel-cinematic side quests built end to end before writing more.

## Asset creation: the world, people and physics
The target is a recognisable replica of Jantar Mantar and Connaught Place, with people who move like people. The owner's bar is "GTA VI level realism in both character and environment", built from real photos and clips and rendered with Blender on ssh uxserver (RTX 2070, Blender 5.2.2, OptiX). A browser can't fully reach GTA VI. The practical target is a believable, photo-referenced Delhi that never looks like a cheap game.
Map. Expand it into connected, explorable districts, each with its own role in the day:
 | 
Area | 
Role in the day
 | 
Jantar Mantar protest street (the Misra Yantra, the protest stretch on Jantar Mantar Road) | 
Morning hangout, stage, organisers, first police line
 | 
Sansad Marg approach | 
Where marches head and where barricades and the water cannon go up
 | 
CP inner circle colonnades | 
Chai, shops, hiding in the arcade, chase routes
 | 
CP outer circle and Janpath lanes | 
Escape routes, side quests, residents who open or close gates
 | 
Metro exits and bus stops | 
Arrivals, escapes, detention buses
 | 
Side streets and service lanes | 
Where provocateurs gather and shortcuts open or close
Build each area from reference photos and Street View-style captures of the real places: facades, signage, trees, dust, kerbs, posters, parked vehicles, street vendors. Use photo-derived PBR materials, baked lighting and an HDRI sky that changes with the time of day. The current assets are a good start but low on detail:

Blender-modelled colonnade, Misra Yantra, bus, chai cart and barricade (assets-src/ASSETS.md).

Three human base meshes from MakeHuman/MPFB, CC0 (assets-src/HUMANS.md).
People:

Many body and face variants: Delhi Gen Z clothing, uniforms for Delhi Police and RAF, vendors, uncles, aunties, media crews.

Real motion-capture animation instead of procedural limb swinging. Codex's procedural arms produced the "Asha spinning her hands 360°" bug. Use mocap libraries with clear licences (for example CMU mocap or licensed packs) for walk, run, jog, idle and chat. Add mocap or hand-keyed clips for chanting, filming, lathi swings, being shoved, ducking and dragging someone away.

Crowds of hundreds at the showdown, using instancing and level of detail (LOD).
Vehicles. Buses that drive real routes without hitting poles, that you can board, ride between districts and get off. Detention buses with an interior. Police vans and water-cannon trucks that roll in at the right phase.
Physics the owner flagged (15 Oct, 08:40 and 20:11):

No walking through people. Characters push and separate.

Proper jumping onto and over benches, barricades and kerbs. Feet planted, no sliding.

No objects clipping into scenery.
Use a real physics engine (for example Rapier) for collisions and character controllers, not hand-written capsule maths.
Pipeline on uxserver:

Gather reference images and video frames.

Model and texture in Blender with scripts.

Export glTF with Draco/KTX2 compression.

Render a turntable and an in-game screenshot.

An agent reviews each asset against the reference photo before it ships.
Performance budget. 60 fps on a mid-range laptop at 1080p, with a quality preset for weaker machines (mantarjantar.com auto-falls back to fast graphics).

## Tech architecture
The game needs one shared world state and one story director. Every player action flows through that director, and its output is always something physical in the 3D scene. The Codex build had six state systems that barely talked to each other. That is the main structural reason choices didn't show up.
The top row is the player's input, the right column is the story spine, and the bottom row is the content pipeline from the reels. Everything converges on what the player sees, and the player reacts to that.
Stack:

Browser, full screen, Three.js with glTF assets.

A physics engine (Rapier) for bodies, vehicles and collisions.

Web Audio with a cue manager.

Plain JS modules (the current repo has no build step; adding Vite is fine).

No runtime LLM. Characters' truth and consequences are authored and testable. An LLM can help writers draft line variations offline from the reel corpus.
Core pieces:

World state (one object, saved and loaded whole): clock, places, people, the player's reputation and promises, and the three director levers.

Director. It runs the day's beats on the clock and owns three levers:

intensity (how bad it gets);

hotspot (where the showdown will break out);

target (who police go after).
Beats fire as set pieces: an arrival wave, the police line forming, the provocateur incident, the water cannon, the lathi charge. The levers decide when and where each fires.

Actors. Each has a few visible wants and a current activity: go to the stage, chase the player, guard the barricade, film, flee, protect a friend. Behaviour picks an activity, and the scene plays it with animation and pathfinding. Any trait that doesn't change an activity gets cut.

Player actions. Each verb writes one "action completed" event, only after the physical action really finishes (the key is actually in your hand, the person actually reached the medic). Reputation, relationships, director levers, police heat and the ending all read from that one event.

Scenes. Ensemble scene data: cast, lines (with audio clip ids), interruptions, choice options and which events each option produces. Written from the reel catalogue.

Presentation. Reel-style cinematic camera, the phone UI (chat, feed, ticker), a minimal HUD (one objective card, a heat bar, the clock).

Dev inspector. Shows why each person is doing what they're doing. Behind a dev flag, never in the player's menus.
Keep from the current repo:

Three.js setup, the Blender environment assets and MPFB humans.

The seeded, deterministic day clock with save/load.

Collision, navigation and transit tests.

The inspector idea.

The research folder.
Cut or merge:

The legacy 3-quest campaign.

The duplicate trust values and three police systems.

The 144 unread actor traits, credibility, fatigue and the 42 unread flags.

The one-speaker scene generator (dist/staged-scenes.js).
The evidence is in docs/codex-review.md on the review/codex-transcript branch.

## Lessons from the Codex build: rules for every agent
Codex spent two days building a story network that is deep on paper and almost unplayable. Each "make it deeper" request got a new layer instead of a connection between the existing ones. The full review is in docs/codex-review.md on the review/codex-transcript branch. Rules that follow from it:

Visible or it doesn't exist. Every choice, trait and flag must change something the player sees or hears within seconds, or come back as a named callback later. Otherwise, cut it.

Connect before you add. Before adding a district, a character or a system, wire what already exists into the director. More map was never the problem.

Physical completion only. No reward or ending credit for something that only happened in dialogue. The water has to reach the person. The bus has to actually stop.

Judge by playing. Each milestone ends with an agent playing a full day at normal speed three ways (idle, chaotic, helpful) and capturing screenshots or video at fixed times. The three runs must look clearly different by afternoon. Passing state checks ("4,500 choice pairs, 0 failures") is not a quality bar.

No lectures. If a line teaches a lesson, rewrite it as a joke, a reaction or an interruption.

Fewer, deeper scenes. 6 to 8 great ensemble situations beat 24 thin ones.

Real research first. Don't write dialogue or pick music until the reel catalogue exists. Codex wrote most of the game before any reel audio was heard.

Honest reports. Say what was verified by playing and what wasn't.

## Build plan for agents
Build one small, complete, fun slice of the day first, prove it by playing, then widen it. Five workstreams run in parallel. Each has one owner agent, and a lead agent integrates and plays the build.
 | 
Workstream | 
Owns | 
Definition of done for the vertical slice
 | 
Research | 
Reel discovery, download, transcripts, analysis, catalogue | 
50 analysed reels; 20 situations flagged "build this"
 | 
Audio | 
Stem separation, voice and bark library, music selection, cue manager | 
150 clean voice clips tagged by actor type and mood; one music track per phase plus chase; listened to by an agent
 | 
Writing | 
Ensemble scenes, ambient barks, phone feed, captions | 
2 ensemble scenes and 60 ambient barks per phase, all Hinglish, no lectures, voiced from the audio library
 | 
Assets | 
Map districts, people variants, mocap animation, vehicles, Blender pipeline | 
Jantar Mantar street rebuilt from references; 8 body variants plus police and RAF; mocap locomotion; a boardable bus
 | 
Engine | 
World state, director levers, actor activities, player verbs, physics, cinematics, phone UI, tests | 
One state model; director fires 4 physical set pieces; 3 verbs fully visible; full-day playtest harness
Vertical slice. One district (the Jantar Mantar protest street), an 8 to 10 minute compressed day, morning to lathi charge, and three verbs:

Steal the bus key.

Pester police.

Rally a group.
Add to that 2 reel-cinematic ensemble scenes, real voices and music, and a showdown whose location and intensity visibly depend on the player.
Gate to widen. A lead agent plays three full slice days (idle, chaotic, helpful), records them, and shows the owner the differences. Only after the owner says it's fun does work start on the CP districts, the extra cast, the 6 to 8 full scenes, vehicles between districts and the realism pass.
Where things live.

Repo: vulbsti/Side-Quest-Republic.

Research: research/.

Blender sources: assets-src/.

Runtime: dist/.

The Codex transcript and review: docs/ on the review/codex-transcript branch.
Decisions made (owner, 19 Oct):

Political groups are fictional stand-ins that very closely reflect reality.

Copyright is not a concern for now; use reel audio and commercial music.

A full day takes 30 minutes or more. The vertical slice can stay compressed to 8 to 10 minutes.
