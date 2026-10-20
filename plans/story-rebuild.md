# Story rebuild: a day full of situations, people who talk back

The owner's playtest (20 Oct) found the build thin:
- most people repeat the same line;
- every constable offers the same four options every time;
- "Talk your way off the bus" does nothing;
- the scenes don't do much;
- the phone feed is empty;
- there isn't much for the player to do.

The cause is structural. Talking to someone is one line plus a rumour menu. The only real content is three short scenes, gated by narrow windows. The day is mostly the simulation running by itself.

This rebuild keeps the engine (world state, routines, director, showdown, loop, chaos board) and replaces the *content layer*. The new layer has **situations** (multi-stage side quests with ensemble scenes and physical goals), **conversations** (every person has things to say that change with the day and with what you did), **chatter** (people talking to each other), and a phone that never goes quiet.

## The story arc

You arrive at Rajiv Chowk with your friends. **Kabir** is the would-be comic who told his mummy he's at tuition. **Nikhil** is a first-timer whose phone is at 3%. **Meera** is a reel creator who needs content. The phone group chat "Jantar Updates 🔥" is the four of you. The day is about the protest, but your stake is personal: get the clip, keep your friends together, get home.

The emotional arc follows the brief: spectator → participant → someone who has to live with it.

| Act | Clock | Feel | Situations |
|---|---|---|---|
| 1. Timepass | 10:00–12:00 | Silly, low stakes, lots to poke | `nikhil-lost`, `career-counselling`, `chabi`, `speaker-run` |
| 2. Bheed | 12:00–14:00 | Fills up, groups arrive, rumours | `mira-mic`, `afwaah`, `mummy-call` |
| 3. Tension | 14:00–16:00 | Barricades, RAF, money changing hands | `cannon-request`, `naye-joote`, `bus-andar` |
| 4. Showdown | 16:00–17:00 | Smoke, running, friends scattered | `dhuan` |
| 5. Aftermath | 17:00–18:00 | Dusk, regroup, the repost | `ghar-jaana-hai` |

### What each situation is about

Writers expand these; the hooks into the engine are the point.

1. **`nikhil-lost`** (10:00–11:30, Metro). Nikhil sends useless literal location updates in the chat ("ek pillar ke paas hoon", "ek uncle samosa kha rahe hain"). You find him using landmarks, and he follows you. If you leave him, he gets lost again later, and in the smoke at 16:00.
2. **`career-counselling`** (10:15–11:45, barricade). Sharma, Constable Yadav and Constable Meena are bored at the barricade.
   - You ask for career advice. They give terrible advice and start arguing with each other about the SSC exam and Yadav's transfer.
   - You can flatter, roast, or go "uncle aap cute ho". Meera films it, and it becomes a reel.
   - Outcome: Sharma ends up soft or annoyed, and Meena amused (a callback at the barricade later). Tomar notices you, which drives random heat later.
3. **`chabi`** (10:50–11:40, CP stop). Iqbal's chai break, the key on the hook, and Asha gossiping.
   - Distract Iqbal (get Asha to tell him about his daughter's rishta), lift the key, and the bus stalls.
   - Then decide what to do with the key: keep it, hand it to Kabir as a "souvenir", or give it back for aura.
   - A witnessed theft starts a chase. Inspired by the real bus-key reel.
4. **`speaker-run`** (10:30–12:00, CP to the stage). Ravi's speaker has to reach the stage for Mira's noon speech. Ravi is sidetracked, and you carry it, with a push-cart gag. This is the existing speaker rule; the situation wraps it.
5. **`mira-mic`** (12:00–13:15, stage). Mira's speech (big or small, depending on the speaker). At 13:00 the LJM leader shows up for a photo-op and wants the mic. Help Mira keep it, let the neta have it, or make him look silly on camera.
6. **`afwaah`** (12:30–13:45, Asha's stall). The DRS bikes arrive and forwards fly. Asha, Zoya, Meera and Constable Rawat (a WhatsApp-forward uncle) argue about a forward. You can start, twist or kill rumours here. This is where whispering lives now, inside a scene with reactions.
7. **`mummy-call`** (13:40–14:00, barricade). Already written in `scenes.js`; it moves into this format.
8. **`cannon-request`** (14:00–14:30, barricade). Already written; moves into this format.
9. **`naye-joote`** (14:30–15:30, near the SUV). You see a fixer at the RUP SUV handing out cash and new shoes.
   - Follow and overhear ("teen baje pathar"). Nikhil nearly joins them because they offer him a phone charger.
   - Expose (needs a camera), report (to the right officer), join, or pull Nikhil away.
   - Unhandled, the stone flies at 15:30.
10. **`bus-andar`** (whenever you're detained, plus `detain-me` after 14:30). The detention-bus interior as a playable scene.
    - Fellow detainees: a student, an uncle who was only buying bananas, maybe Kabir.
    - RAF jawan Pandey (homesick, from Muzaffarpur) guards the door.
    - Get out by talking (several real routes, not an aura check), by Iqbal passing the key through the window if he likes you, by a friend's distraction, or by waiting until 17:30. `detain-me` merges in as a node.
11. **`dhuan`** (from the lathi charge). Friends get scattered in the smoke.
    - Nikhil texts "kuch dikh nahi raha". Find him by his updates.
    - Shield Kabir from a lathi (if your crew is with you), or get Meera's phone out before a cop takes it.
    - Each friend ends up OK, hurt, detained or missing, and that's on the ending card.
12. **`ghar-jaana-hai`** (17:00–18:00, Metro). Regroup at the Metro exit with whoever made it. Mummy calls again. The morning clip gets reposted with the evening caption. A quiet, funny-sad last scene before the ending card.

Every situation must:
- fire whether the player is there or not, so the world moves;
- **announce itself** before a marker shows (an overheard line, a chat ping, and the objective card);
- end with a **visible change in the world** and a **named callback** later;
- feed the showdown levers through `do` actions.

## Named police (no more identical constables)

| id | name | who he/she is | what makes them different |
|---|---|---|---|
| `sharma` | Officer Sharma | Constable at the barricade | Short questions, repeats your words back. Can go soft. |
| `c1` | Constable Yadav | Sleepy, wants chai and a transfer | Easily distracted by food. Lets things slide. |
| `c2` | Constable Meena | Sharp woman constable | Secretly amused. Hard to fool, easy to make laugh. |
| `c3` | Constable Tomar | The bully | Picks on you for nothing (the brief's "random heat spike"). |
| `c4` | Constable Rawat | WhatsApp-forward uncle | Believes and spreads rumours inside the police. |
| `c5` | Constable Gill | Secret reel fan | Recognises you from your clips. |
| `r1` | Jawan Pandey (RAF) | Homesick, from Muzaffarpur | Guards the bus door. Could let you out through the gali. |
| `r2`–`r6` | RAF | Faceless in the line | Bark only. |

## Data formats (the contract; every workstream builds against this)

### Shared pieces (same as `scenes.js` today)
- **beat:** `{ who, line, overlap?, react?: 'laugh'|'silence'|'cut', sfx?, via?, aside? }`
  - `who` is a person or officer id, `'player'`, `'mummy'`, `'crowd'`, `'wireless'` or `'raf'`.
- **requires:** `{ mood: {id: [moods]}, rep: {aura: n, ...}, flags: [...], anyFlags: [...], notFlags: [...], with: [ids following you], holding: obj, after: 'hh:mm', before: 'hh:mm', did: [situation ids done] }`
- **effects:** `{ aura, heat, help, nuisance, mood: {id: mood}, flags: [...] }`
- **do:** `[action strings]`, applied in order. The engine implements exactly these:
  - Movement: `follow:<who>` (they follow you), `unfollow:<who>`, `move:<who>:<SPOT or place>`, `leave:<who>` (exits the day), `return:<who>`
  - Objects: `give:<obj>:<who>`, `take:<obj>` (into your hands), `drop:<obj>:<place>`
  - Detention: `detain:<who|player>`, `release:<who|player>`
  - Police: `chase:<officerId>` (starts a chase on you), `calm:<officerId>`
  - Phone and world: `cue:<cue>`, `clip:<kind>`, `chat:<trigger>`, `feed:<feedId>`, `callback:<key>`
  - Rumours: `rumour:<rid>:<place>` (plants a rumour)
  - Showdown levers: `crowd:<place>:<+/-n>`, `intensity:<+/-n>` (a lasting nudge), `hotspot:<place>`, `target:<player|crew|stream|mira|none>`, `stance:<stance>`
  - Flow: `situation:<id>:<start|done|fail>`
  - Nikhil: `nikhil:<found|lost>`
  - Friends: `friend:<who>:<ok|hurt|detained|missing>`
  - If a writer needs another action, they list it in their notes; the lead decides.

### Situations: `dist/loop/situations.js`
```js
export const SITUATIONS = {
  'career-counselling': {
    title: 'Career counselling',
    act: 1,
    window: { from: '10:15', until: '11:45' },   // when it can start; it runs past `until` once started
    place: 'barricade',                          // where its marker sits (a PLACES id or a person id to follow)
    cast: ['sharma', 'c1', 'c2'],
    hook: {                                      // announces it before the player arrives
      chat: [['meera', 'bhai barricade pe teen uncle bore ho rahe hain, content alert']],
      overheard: [['c1', 'Sharma ji, SSC ka form bhara?']],
      card: 'Three bored constables at the barricade',   // objective-card text
    },
    auto: null | { at: '11:00', do: [...] },     // what happens if the player never comes (the world moves)
    start: 'intro',
    nodes: {
      intro: {
        camera: 'phone' | 'wide' | 'none',       // phone = reel frame; none = in-world conversation panel
        beats: [ ...beat ],
        idle: [ [who, line], ... ],              // while the options are open
        options: [ {
          intent: 'Ask them for career advice',  // never the spoken line
          requires: {...},
          beats: [ ...beat ],                    // the reaction
          effects: {...},
          do: [ ... ],
          clip: 'pester-career' | null,
          next: 'node-id' | null,                // continue the conversation
          end: 'done' | 'fail' | null,           // or end the situation
        } ],
        goal: {                                  // a physical stage instead of options
          text: 'Get Asha talking to Iqbal',     // objective card
          until: [ 'near:asha:iqbal', ... ],     // all must hold; predicates below
          by: '11:30',                           // deadline, optional
          onDone: 'node-id', onFail: 'node-id',
          marker: 'iqbal' | 'cp' | { x, z },
        },
      },
    },
    outcomes: {                                  // per end state; captions for the feed and later repost
      done: { caption, captionLater, callback: 'Because you … at {t}, … at {at}.' },
      fail: { caption, captionLater, callback },
    },
  },
};
```

**Goal predicates** (the engine implements exactly these):
- **Positions:** `near:<a>:<b>` (two people or objects within 3 m), `at:<who|obj|player>:<place>`
- **Following and holding:** `with:<who>` (following you), `holding:<obj>`, `given:<obj>:<who>`
- **State and time:** `flag:<f>`, `!flag:<f>`, `time:<hh:mm>` (clock at or past), `detained`, `free`
- **Crew, clips and people:** `crew:<n>` (at least n), `filmed:<kind>`, `mood:<who>:<mood>`, `hidden:<who>`
- **Police:** `chase-lost`

### Conversations: `dist/loop/talks.js`
```js
export const TALKS = {
  sharma: [
    {
      id: 'sharma-m1',
      phase: ['morning'],   // or omit for any phase
      requires: {...},
      priority: 0,          // higher is picked first
      once: true,           // default true
      // A conversation is a small node graph in the same shape as a situation's nodes:
      start: 'a',
      nodes: {
        a: { beats: [...], options: [ { intent, beats, effects, do, next, end } ] },
      },
    },
  ],
};
export const REACTS = {   // short reactions when you talk to someone right after something happened
  sharma: { 'bus-key': [...beats], 'speech-big': [...] },
};
export const BRUSHOFF = { sharma: [lines] };   // after their pool for now is exhausted: short, varied, never the same twice in a row
export const CHATTER = [                       // people talking to each other when you're within ~12 m
  { id, phase: [...], place, cast: [...], requires, beats: [...] },
];
```

- Talking to someone plays their **highest-priority unplayed** conversation that meets `requires` for the current phase.
- Failing that, a `REACTS` line for the most recent thing that happened near them.
- Failing that, a `BRUSHOFF`.
- Whispering a rumour becomes an option inside conversations (Asha, Meera, Rawat and Dev each have one), not a menu on everyone.
- Every person (11 cast plus `c1`–`c5` and `r1`) needs **at least 2 conversations per phase they're on screen in**, plus `REACTS` for at least 8 events. That's ~120 conversations.
- `CHATTER` needs **40+** exchanges across places and phases.

### Phone timeline: `dist/loop/phone.js` (extend)
- `FEED_TIMELINE = [{ at: 'hh:mm', by, caption, kind, place, real?: true }]`: world clips that post on schedule. Aim for one every ~4 game minutes, about 100 over the day. Use research/reels for real-inspired ones.
- `CHAT_TIMELINE = [{ at, requires?, msgs: [[who, text]] }]`: the friends' running chat. Nikhil's updates, Kabir's mummy panic, Meera's content plans, reactions to the day. Aim for 60+.
- The existing `CAPTIONS`, `CHAT` and `TICKER` stay.

## Engine API the client uses (new)
- `s.convo = { who, talkId|situationId, node, beats, options: [{ i, intent, ok, why }], camera }`. This is the active conversation or situation node. Only one at a time.
- Actions:
  - `act(s, { type: 'talk', to })` starts a conversation.
  - `act(s, { type: 'say', option: i })` picks an option.
  - `act(s, { type: 'leave' })` walks away.
  - `act(s, { type: 'beat', i })` reports the beat being shown.
- Queries:
  - `situations(s)` → `[{ id, title, state: 'hooked'|'active'|'done'|'fail'|'missed', goal, marker: { x, z }, act }]`.
  - `objective(s, pos)`: the single card. The active situation goal first, then the nearest hooked situation, then `opportunities()`.
- Scenes already in `scenes.js` are ported into `situations.js`. `SCENES` stays as an alias export for one release.

## Tempo
Default becomes the owner's full day: **4 s per game minute (32 real minutes)**. `?short` gives the 10-minute slice for testing.

## Definition of done
- Each of the 12 situations can be played to `done` and to `fail` in `tests/test-situations.mjs` by moving the player and calling act().
- An idle day still runs every situation's `auto`.
- Talking to the same person 6 times in a phase never repeats a line.
- Each named constable has different lines from the others.
- Detention: every way out works, and the bus interior is where you are.
- The feed posts at least every 5 game minutes.
- A headless playtest plays a whole day as a player would. It shows something to do on the objective card at every sampled moment, and the morning has at least 4 things to do within the first 3 real minutes.
