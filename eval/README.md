# The vision eval

`npm run verify` answers "does the game work?". `npm run eval` answers "is it the game utkarsh wants?" and says
what to fix next. It writes [`report.md`](report.md).

The vision is in [`vision.json`](vision.json): seven pillars, each with the words utkarsh used and the metrics that
stand for them.

| Pillar | Weight | What it asks |
| --- | --- | --- |
| hands | 25 | A low-level game you play with your hands, Subway Surfers style: chases with decisions in them, short games like the kabaddi raid and the window escape, little reading |
| density | 10 | Something physical to do within 10 m at all times, set pieces you see happen |
| day | 15 | The high-level game: your day bends the ending, the showdown's place and the charge's timing |
| funny | 15 | The reels' voice: Hinglish, no lectures, a joke in the HUD copy too, judged against real reel comments |
| delhi | 15 | A photo replica: real scale and layout, real shops and signs, no invented places |
| looks | 10 | Textured, dense, far draw distance, judged against what a browser game can look like |
| you | 10 | utkarsh's own scores after playing. This outranks every other number |

Each metric is scored 0 to 1 between a floor (bad) and a target (good), a pillar is the weighted mean of its metrics,
and the vision score is the weighted mean of the pillars. A metric nobody measured this run is left out and the
score is marked partial.

## Five kinds of measure

- **engine**: bot players (the verifier's personalities) play whole 32-minute days, tick by tick, on the real
  engine. We record where the time goes (skill moment, conversation card, detained, walking), what was on screen,
  what was within reach. A chase probe steals the bus key in front of an officer twelve times a day and runs four
  ways (stand, jog straight, sprint straight, run for a crowd) to see whether escaping takes any skill.
- **static**: the source itself. Every quoted line is tested for Hinglish and lectures; the HUD's prompt copy for
  plain instructions. The map is compared with [`delhi.json`](delhi.json): real landmark coordinates, the real
  places and shops that should stand in the world, the invented names that shouldn't.
- **browser** (`--browser`): the 3D client in headless Chrome. The player stands at each landmark; we count what is
  drawn (textured share, flat-colour boxes, people) and save screenshots to `eval/out/shots/`.
- **judge** (`--judge`): Claude scores humour, recognisability and look against the rubrics in
  [`rubrics/`](rubrics/), and the result is saved in `eval/judgements/` with the commit it judged. A person can
  write a judgement file by hand in the same shape. Put a real photo of each spot in `eval/refs/<landmark id>.jpg`
  and the place judge compares them side by side.
- **human**: copy [`playtests/TEMPLATE.json`](playtests/TEMPLATE.json) after playing, fill it in, commit it.

## The hill-climb loop

1. `npm run eval -- --record` on main to log the starting point in `history.jsonl`.
2. Take the top of "Fix next" in the report (the biggest weighted gap), or the pillar utkarsh named.
3. Change the game. Keep each change to one idea.
4. `npm run eval` and `npm run verify`. Keep the change if its pillar rose, no other pillar fell by more than 3
   points, and verify passes. Otherwise revert or rethink.
5. Every few changes: `--browser --judge`, and ask utkarsh to play and fill in a playtest. If he says it got worse
   while the score went up, the eval is wrong: fix the metric before climbing further.
6. `--record` when merging, so the history shows each step.

## Contracts for new content

- A new low-level game emits engine cues `action:<game>:start`, `action:<game>:win` and `action:<game>:fail`, and
  is listed by `affordances(s)`. While it runs, set `s.action` (or `s.raid`) in the day so the time counts as a
  skill moment.
- A real place gets a landmark entry in `delhi.json` (with coordinates from OpenStreetMap) and a `game` reference
  to the `PLACES`/`SPOTS` entry or district that draws it. A shop counts once its name is on a sign in the world
  files.
- Don't game the metrics: more words lowers the reading score on purpose, and the judge and playtests sit above
  the counts.

## Options

```
npm run eval                       engine, text and map (about 15 s)
npm run eval -- --browser          plus the 3D client (minutes with a GPU, much longer on software GL: PLAYBACK_GL=swiftshader)
npm run eval -- --judge            plus Claude judging (Anthropic credentials; with --browser it also judges the screenshots)
npm run eval -- --record           append to history.jsonl
npm run eval -- --quick            one seed per personality
```
