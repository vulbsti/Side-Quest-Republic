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
- `npm test` (or `node tests/test-loop.mjs`) plays about twenty scripted days (idle, stolen speaker or key, rumours at different times, a stolen phone, the megaphone handed to Mira or Kabir, the minister rumour with and without a camera, hidden water, Nikhil brought to Kabir) and checks they end differently. It also checks every rule says something visible and every board link happens in at least one of those days.

The old Codex build (v5–v27) was deleted in the vision rebuild; it is in git history before that commit. Its city, character, movement and bus modules in `dist/` are still used.
