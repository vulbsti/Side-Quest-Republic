# Vertical slice spec: "Same Day Again" becomes the protest day of the vision brief

This is the contract every workstream builds against. The vision brief is the Claude Doc
"Side Quest Republic: Game Vision & Build Brief"; this file turns its vertical slice into
concrete state, events and file ownership for the existing looping-day game in `dist/loop/`.

## What we keep, what changes

- **Keep the loop.** The owner approved a replayable day loop on 17 Oct. Each loop *is* the
  brief's one protest day: calm and silly at 10:00, a showdown by 16:30, consequences after.
  The chaos board keeps what you learned between loops. Nothing in the brief conflicts with this.
- **Keep** the 11 people, their routines, the 5 objects, the 3 rumours, Zoya's stream, Rao's
  line, the megaphone moment and the minister. They already make "when X, Y does Z" chaos.
- **Change** the spine. Today the day just ends at 17:00 on one of 13 endings. Now the day
  *escalates on its own* (groups arrive, barricades, provocateurs, water cannon, tear gas,
  lathi charge) and the player bends **intensity, location, targets, protester stance and
  timing** of that showdown. The existing mischief feeds those levers.
- **Add** the three slice verbs (steal the bus key with a real chase and detention, pester
  police, rally a crew), film-and-post, the provocateur, reputation (aura, heat, help,
  nuisance), 3 reel-cinematic ensemble scenes, the phone (chat, feed, ticker), phase changes
  you can feel (light, sound, density, police posture), and callbacks.
- **Not in this slice** (brief's gate): CP district expansion, Rapier physics, 6–8 full
  scenes, boardable buses between districts, the realism pass. Real reel voices and music
  depend on the Instagram pipeline, which needs the owner's machine (see Research).

## Design rules (judgement calls, apply everywhere)

1. Visible within seconds or it doesn't exist. Every verb ends in something on screen.
2. Funny first, dangerous later. Morning comedy must still be funny the third loop.
3. The world doesn't wait. Set pieces fire whether the player is there or not.
4. Never read the player's button back as their line. Options are *intents*
   ("Ask him for career advice"); the spoken line is written separately and is better.
5. No lectures. A line that teaches becomes a joke, a reaction or an interruption.
6. Something to do within ~10 m at all times. The engine exposes opportunities; the HUD
   shows the nearest one as the single objective card.
7. Consequences are named. The ending card says *because you did X at 10:40, Y happened*.

## Clock and phases

- Day runs 10:00–18:00. Default slice tempo `SECONDS_PER_MINUTE = 1.25` (10 real minutes).
  `?long` in the URL sets 4.0 (32 minutes), the owner's full-day target. Everything must be
  written in clock time (`at(h, m)`), never raw seconds, so both tempos work.
- `phaseAt(t)` (exported from rules.js) returns one of:

| phase | clock | feel |
|---|---|---|
| `morning` | 10:00–12:00 | Calm, silly. Few people, volunteers setting up, constables lounging. Warm light. Playful music. |
| `midday` | 12:00–14:00 | Fills up. Party workers and the counter-group arrive. Police get orders. Harsh noon light. |
| `tense` | 14:00–16:00 | Barricades, RAF, provocateurs, water cannon. Amber haze, chants, sirens. |
| `showdown` | 16:00–17:00 | Tear gas, lathi charge at the director's time and place. Dust, smoke, chase music. |
| `aftermath` | 17:00–18:00 | Dusk, sodium lamps. Detention bus loading, friends missing or found. Then the ending card. |

## World state additions (rules.js owns these; everyone else reads them)

```js
s.phase                       // 'morning' | 'midday' | 'tense' | 'showdown' | 'aftermath'
s.player.rep = { aura, heat, help, nuisance }   // 0..100 each
s.player.crew = []            // ids of crowd followers (see crew below), max 8
s.player.detained = false     // true while on the detention bus
s.player.chasedBy = null      // person/officer id chasing you, or null
s.player.clips = []           // { id, kind, caption, place, t } clips you posted
s.officers = {                // generic constables and RAF jawans, beyond Sharma
  c1: { id, kind: 'constable'|'raf', x, z, mode, mood }, ...
}
s.people.sharma.mood          // 'bored'|'amused'|'soft'|'annoyed'  (and other officers' .mood)
s.groups = {                  // arriving groups the crowd renderer draws in their colours
  students: { kind: 'students', place, size, mood },
  party:    { kind: 'party', place, size, mood },     // fixers' party workers (RUP)
  sena:     { kind: 'sena', place, size, mood },      // counter-group (DRS)
  opp:      { kind: 'opp', place, size, mood },       // opposition workers (LJM)
}
s.provocateurs = [ { id, x, z, place, state: 'hidden'|'acting'|'exposed'|'joined'|'reported'|'gone' } ]
s.police.barricades = []      // places with a barricade line up
s.police.raf = 0              // RAF jawans on the street
s.police.cannon = null        // { place, x, z, state: 'rolling'|'parked'|'spraying'|'dance' }
s.police.gas = null           // { place, x, z, t }
s.police.charge = null        // { place, t, targets: ['player'|'crew'|'stage'|id...] }
s.director = { intensity, hotspot, target, stance, chargeAt }  // see Director
s.scene = null                // active ensemble scene { id, beat, options?, cast }
s.cues = []                   // presentation/audio cues, drained by the client (see Cues)
```

Keep the existing shape (`s.people`, `s.objects`, `s.bus`, `s.crowd`, `s.rumours`,
`s.stream`, `s.police.watch/line`, `s.events`) working. `drainEvents(s)` keeps returning
`{ t, key, who, text, link, place, pos }`; add an optional `kind`:
`'line'|'bark'|'feed'|'chat'|'ticker'|'wireless'|'stream'`. Add `drainCues(s)`.

### Cues

`{ cue, place, pos, data }`. The client uses them for visuals and audio. Names:
`arrival-wave`, `party-suv`, `sena-bikes`, `barricades-up`, `raf-arrive`, `provocateur-drop`,
`stone-thrown`, `cannon-roll`, `cannon-spray`, `cannon-dance`, `gas-fired`, `charge-start`,
`charge-end`, `chase-start`, `chase-lost`, `caught`, `bus-stalled`, `detainees-escape`,
`crowd-laugh`, `crowd-gasp`, `awkward-silence`, `crew-join`, `crew-block`, `clip-posted`,
`scene-start`, `scene-end`, `phase` (data: new phase), `faint`, `ambulance`.

## Groups (fictional stand-ins that read as real, owner decision 19 Oct)

No real party, organisation or politician names. Make them recognisable by colour, symbol,
slogan, vehicle and tactic, and show each with its own inner conflict, never as cartoons.

| id | name | reads as | look | tactics |
|---|---|---|---|---|
| `party` | Rashtriya Uday Party (RUP) | ruling party | saffron-green flags, marigold symbol, white kurtas, white SUV with flag and "VIP" sticker | fixers lean on Inspector Rao, drop provocateurs, want deniability |
| `sena` | Dharma Raksha Sena (DRS) | Hindutva street group | saffron scarves and tilak, bikes, megaphone on a bike | counter-chants, scuffles, men who hit police so the students get blamed; leaders vs foot soldiers |
| `opp` | Lok Jan Morcha (LJM) | opposition party | white-blue-green flags, ceiling-fan symbol, a leader who wants a photo-op | turns up late for the cameras, tries to take the stage |
| `students` | the Gen Z protest | the real protesters | jeans, placards, phones, flags of the cause | chants, reels, sit-ins, scatter or hold |

Police: Delhi Police khaki constables, Inspector Rao (wireless voice), RAF jawans in blue
camouflage with helmets, polycarbonate shields and lathis, a white-and-blue "Vajra" water
cannon truck, a detention bus (the existing shuttle is reused as the detention bus from 14:00).

## Player verbs in the slice

All verbs go through `act(s, cmd)` and only count once the physical thing has happened.
Heat follows legality and confrontation, not how funny something is (owner's table).

1. **Pester police** (`{type:'pester', to, how}`; how = `career` | `cute` | `cannon` |
   `detainme`). Talk to Sharma or any constable. Options are intents. Effects: aura up
   (high), heat none to very low, the officer's mood changes (`bored→amused→soft`, or
   `annoyed` if you push the same officer three times in a short window), nearby people laugh
   (`crowd-laugh` cue). An annoyed officer spikes your heat. A `soft` Sharma is a callback
   later: at the showdown he lets your crew or a friend through the barricade and never names
   you as a target. A `cannon` request in the morning makes the water cannon later turn into
   kids dancing in the spray (`cannon-dance`), which drops intensity.
2. **Steal the bus key** (existing take). Now: the bus stops dead (`bus-stalled`), Iqbal
   searches and shouts, after 14:00 the bus is the detention bus and detainees walk off
   (`detainees-escape`, help up). Witnessed theft = heat high and a chase: the nearest
   constable runs at you (`chase-start`). Break line of sight or stand in a crowd of 6+ for a
   few seconds to lose him (`chase-lost`). Caught (`caught`) = detained: you are put on the
   detention bus. Get out by talking (needs aura), by a crew member or friend causing a
   distraction (needs help), by the "Sir mujhe bhi detain kar lo" scene, or at 17:30.
3. **Rally a crew** (`{type:'rally'}` near a student crowd). Needs aura ≥ 30. Up to
   `floor(aura/12)` students follow you in a visible group (`crew-join`). Stand with the crew
   on a road or at a police line and they sit and block (`crew-block`). At the showdown the
   crew's position and your choice (`{type:'stance', stance:'hold'|'scatter'|'block'|'protect'}`)
   sets the protester stance where you are.
4. **Film and post** (`{type:'film'}`, needs to be within 12 m of something that just
   happened: a rule firing, a set piece, a scene). Posts a clip to the feed with a Gen Z page
   caption (`clip-posted`). Aura up. Clips of illegal stuff raise heat. A morning clip can be
   reposted at 17:00 with a different, dangerous caption (callback).
5. **Deal with a provocateur** (`{type:'provocateur', id, how:'join'|'report'|'expose'}`).
   From 14:30 the RUP SUV drops three men into the biggest crowd. Tells: new shoes, earpiece,
   helmet in a bag. Join: intensity jumps, heat up, your area becomes the target. Report to a
   `soft` Sharma: he quietly removes him. Report to anyone else: he's protected, and you get
   detained. Expose: needs a camera (you filming, or Zoya live within 12 m): the crowd turns
   on him and he runs to the SUV (`gone`), intensity down. Unhandled: at 15:30 he throws the
   first stone at the line nearest the hotspot (`stone-thrown`).
6. Existing: take, give, drop, talk, whisper rumours.

## Director (rules.js)

Recomputed every tick from world state, never stored as free-floating numbers:

- `intensity` 0–100: crowd sizes, sena and party presence, rumours alive, provocateurs
  acting or stone thrown, heat of the player and crew blocking, water cannon spraying, heat
  stroke without water. Calmers: Mira's big speech, Zoya live at the hotspot (police
  restraint), the singalong, cannon-dance, an exposed provocateur.
- `hotspot`: where the showdown breaks out. The biggest crowd, pulled toward where a stone was
  thrown, toward the player's crew if it blocks, toward the stream if viral.
- `target`: `player` if heat ≥ 70, `crew` if your crew blocks, the stream if viral, `mira`
  if she leads a sit-in, otherwise the crowd at the hotspot.
- `stance`: from who holds the megaphone (Mira = hold, Kabir = scatter laughing, Dev =
  block), your crew and your `stance` command where you are.
- `chargeAt`: 16:30 baseline. Intensity ≥ 70 brings it to 16:00, a thrown stone to 15:45.
  Below 25 there is no charge, and the day ends as a sit-in.

Set pieces (all physical, all cues): 12:30 arrival wave (party SUV, sena bikes); 13:00
LJM leader photo-op; 14:00 barricades and RAF; 14:30 provocateur drop; 15:00 police line
(existing); 15:30 megaphone moment (existing) or stone; ~15:45 water cannon rolls to the
hotspot; 16:00 tear gas if intensity ≥ 60; lathi charge at `chargeAt`; 17:00 aftermath
(detention bus loads targets, friends separated if the crowd scattered); 18:00 ending.

## Endings

The ending card is built from the showdown, not picked from a list: where it broke out, how
bad it got, who they went after, what the protesters did, when, and your role
(`spectator`, `instigator`, `protector`, `detained`, `filmer`, `peacemaker`). Then 3–5
callbacks: "Because you asked Sharma for career advice at 10:40, he let Kabir through."
Existing endings (biryani rush, singalong, minister no-show, packed rally) become the
headline flavour when they happened. The chaos board's "Endings seen" tracks the showdown
outcomes and the role.

## Ensemble scenes (reel cinematics), data in `dist/loop/scenes.js`

```js
export const SCENES = {
  'mummy-call': {
    title, place, cast: ['kabir', 'sharma', 'player', ...],
    camera: 'phone' | 'wide',       // phone = 9:16 frame, REC dot, captions
    music: 'cue-name',
    beats: [ { who, line, overlap: false, react: null | 'laugh' | 'silence' | 'cut' } ],
    options: [ { intent: 'Ask Sharma to pose as the tuition teacher',
                 requires: { mood: { sharma: ['amused', 'soft'] } },
                 beats: [...], effects: { aura, heat, help, nuisance, mood: {}, flags: [] } } ],
    payoff: { caption: '…', captionLater: '…' },
  },
}
```

The three for the slice (from the reels):
1. `mummy-call` (scale collision): ~13:50 Kabir's mummy calls before he leaves at 14:00.
   Ask Sharma to pose as the tuition teacher. Works only if Sharma is amused or soft. Kabir
   stays, so his 15:30 set can happen (callback into the existing rule).
2. `cannon-request` (literal service request): 14:00 heat at the barricade, Sharma, Kabir,
   Meera filming. "Water cannon ka kya bandobast hai?" Sets the cannon-dance callback.
3. `detain-me` (goal reversal): at the detention bus after friends are taken. "Sir mujhe
   bhi detain kar lo, mere dost andar hain", then you ask to leave once they've escaped.

Presentation: in-engine, letterbox or 9:16 phone frame, captions, close-ups on the speaker,
reaction cuts, a music hit; control returns at the options while people keep talking.

### Scene wiring

rules.js imports `SCENES` from `./scenes.js` and owns *when* a scene is available (its
trigger), starts it (`act(s, {type:'scene', id})` when the player presses E nearby), and
applies the chosen option (`act(s, {type:'scene', id, option: i})`), checking `requires`.
Until the writing branch lands, the engine keeps a minimal stub `scenes.js` in this format;
the writer's file replaces it at merge, so the engine must only rely on ids, `cast`,
`options[i].requires` and `options[i].effects`.

## Clip kinds (engine emits, phone.js captions)

A clip is `{ id, kind, place, t, by: 'player'|'meera'|'zoya'|'world' }`. Kinds:
`bus-key`, `bus-stalled`, `detainees-escape`, `chase`, `caught`, `pester-career`,
`pester-cute`, `pester-cannon`, `detain-me`, `crew-block`, `speaker-party`, `big-speech`,
`small-speech`, `biryani-rush`, `cannon-scare`, `singalong`, `roast`, `minister-noshow`,
`provocateur-exposed`, `provocateur-joined`, `stone-thrown`, `cannon-spray`, `cannon-dance`,
`gas`, `charge`, `faint`, `mummy-call`, `heat`. `phone.js` exports
`CAPTIONS[kind] = { now: [..], later: [..] }` (later = the dangerous evening repost),
`CHAT[trigger] = [[who, text], ...]` for the group chat (triggers are cue names, clip kinds
or `phase:<name>`), and `TICKER[phase] = [..]`.

## Phone (`dist/loop/phone.js` content, UI in main.js)

- **Chat**: "Jantar Updates 🔥" group with Kabir, Nikhil, Meera, Zoya: locations, panics,
  "kahan hai tu?", reactions to what you did.
- **Feed**: reels from around the protest (world clips and your clips), with captions in the
  voice of Gen Z pages. Real-world-inspired clips are marked "inspired by a real reel".
- **Ticker**: satirical news per phase (mantarjantar.com does this well).

## Barks (`dist/loop/barks.js`)

`BARKS[phase][speakerType] = [lines]`, speaker types `student`, `constable`, `raf`, `vendor`,
`party`, `sena`, `opp`, `uncle`, `aunty`, `media`. ≥ 60 per phase in total. The client draws
from a shuffled bag and never repeats until the bag is empty.

## File ownership (one owner per file, so parallel work merges cleanly)

| workstream | owns | must not edit |
|---|---|---|
| Engine | `dist/loop/rules.js`, `dist/loop/content.js` (LINES, LINKS, HINTS, ENDINGS, TALK states it adds), `tests/test-loop.mjs`, new `tests/test-slice.mjs` | main.js, scenes/barks/phone |
| Writing | new `dist/loop/scenes.js`, `dist/loop/barks.js`, `dist/loop/phone.js` | rules.js, main.js |
| Presentation | `dist/loop/main.js`, `dist/index.html`, `dist/loop/loop.css`, new `dist/loop/{cinematic,phone-ui,props,lighting}.js` | rules.js, content files |
| Assets | `dist/assets/**` (except audio), `assets-src/**`, `dist/characters.js`, new `dist/loop/models.js` | main.js (gives an integration note instead) |
| Audio | `dist/loop/audio.js`, `dist/assets/audio/**` | main.js (gives an integration note instead) |
| Research | `research/**` | everything else |

The lead integrates: wires audio and models into main.js, connects scenes to rules, and plays.
