# Reel pipeline runbook (owner's Linux machine + uxserver GPU)

**Audience:** a Claude Code session on the owner's Linux machine (user `vulbsti`). It runs this unattended and reports back.

**Goal:** the brief's definition of done.
- 150+ candidate reels discovered.
- 50+ analysed reels, each with a corrected transcript of key lines, separated stems and tags.
- 20+ catalogue entries flagged `buildThis`.

**Why this can't run in the cloud container:** Instagram, YouTube and indown.io are blocked for curl there, and there is no GPU. Everything below assumes:
- the owner's signed-in Chrome profile (the one approved in the Codex chat);
- `ssh uxserver` (RTX 2070, 8 GB VRAM).

**Lessons from the Codex run, built into the steps:**
1. `faster-whisper-large-v3-turbo` on the raw reel audio produced garbage (`research/transcripts/DeU2JR_zqYq.machine-draft.json`, average logprob about −2.1), because music sits under the speech. **Separate first, then transcribe the vocal stem.**
2. Only 2 reels were ever downloaded. Discovery and download must be scripted and resumable.
3. Nobody actually listened. Claude cannot hear audio, so a "listening pass" means two independent ASR models plus disagreement flags, then a review page the owner clicks through. Do not claim a line is verified until a human has played it.

---

## 0. Rules for the unattended session

- **Instagram is read-only.** No likes, follows, comments, DMs, saves or story views. Never type credentials. Use only the existing signed-in profile.
- **Never send Instagram cookies to a third party.** indown.io gets only a public reel URL, as in the Codex run (`research/reel-download-results.json`).
- **Pace yourself.**
  - At most about 60 Instagram page loads per hour.
  - Random sleep of 20 to 60 s between pages.
  - Stop the discovery stage, and write `research/media/_blocked.json`, on any checkpoint, "Try again later", login wall or CAPTCHA. Never try to solve it.
- **Media stays out of git.** `research/media/` is already in `.gitignore`. Only the catalogue (`research/reels/*.json`), transcripts (`research/transcripts/`) and manifests are committed. Stems live on uxserver and in `research/media/`.
- **Keep the evidence boundary.** Every entry says what was heard by a machine, what was heard by a human, and what was read in a caption or comment.

## 1. Install (once)

On the owner's machine:

```bash
sudo apt-get install -y ffmpeg jq python3-venv rsync
python3 -m venv ~/.venvs/reels && source ~/.venvs/reels/bin/activate
pip install --upgrade pip
pip install playwright yt-dlp shazamio pyacoustid
python -m playwright install chromium   # only used if real Chrome cannot be driven
# chromaprint for AcoustID fingerprints (fpcalc)
sudo apt-get install -y libchromaprint-tools
```

On uxserver (GPU):

```bash
ssh uxserver '
  python3 -m venv ~/.venvs/reels && source ~/.venvs/reels/bin/activate &&
  pip install --upgrade pip &&
  pip install "torch" "torchaudio" --index-url https://download.pytorch.org/whl/cu121 &&
  pip install demucs faster-whisper transformers accelerate ctranslate2 "audio-separator[gpu]" &&
  nvidia-smi
'
```

Models to pull on uxserver. Check each model card exists and its licence before relying on it:

| Purpose | Model | Notes |
|---|---|---|
| Main ASR | `Systran/faster-whisper-large-v3` (full large-v3, **not** turbo) | `compute_type="float16"` fits in 8 GB. Use `int8_float16` if you hit OOM |
| Hindi-tuned second opinion | `vasista22/whisper-hindi-large-v2` (IIT Madras Speech Lab fine-tune, HF transformers) | Run through the `transformers` pipeline, or convert with `ct2-transformers-converter --model vasista22/whisper-hindi-large-v2 --output_dir ~/models/whisper-hindi-large-v2-ct2 --quantization float16` |
| Optional third opinion | Search the HF hub for `whisper-large-v3 hindi` fine-tunes and AI4Bharat Indic ASR models | Only use one whose model card shows Hindi WER. Record the exact repo id and revision in the manifest |
| Vocals / music split | Demucs `htdemucs_ft` | `demucs` CLI |
| Better vocal isolation (optional) | `audio-separator` with a BS-RoFormer or MDX vocal model | Use if Demucs leaves music in the vocals |

## 2. Discover (target: 150+ candidate URLs)

Drive the owner's **real Chrome profile**. Chrome refuses remote debugging on its default data directory, so work on a copy (the cookies still decrypt on the same Linux user via the keyring):

```bash
pkill -f "google-chrome" || true          # Chrome must be closed to copy cleanly
SRC=~/.config/google-chrome
DST=~/.cache/reels-chrome
rsync -a --delete "$SRC/" "$DST/"
# PROFILE is the approved profile's folder, e.g. "Profile 2"; find it in $SRC/Local State -> profile.info_cache
google-chrome --user-data-dir="$DST" --profile-directory="$PROFILE" --remote-debugging-port=9222 --no-first-run &
```

Then a Playwright script (`scripts/reels/discover.py`, to be written by the session) uses `chromium.connect_over_cdp("http://127.0.0.1:9222")` and visits, in order:

- **Hashtag and search pages:** `https://www.instagram.com/explore/tags/<tag>/` for `jantarmantar`, `jantarmantarprotest`, `cockroachjantaparty`, `cjp`, `genzprotest`, `delhiprotest`, `patnaprotest`, `neetprotest`, `sansadchalo`, `votechor`, `jantarmantar2`. Also the Instagram search box (reels tab) for `jantar mantar police`, `detain kar lo`, `bus ki chabi`, `water cannon patna`, `subway surfer protest`, `pookie cop`, `nashta hoga`, `lathi charge jantar mantar`.
- **Reposting pages:** `peeinghuman`, `indiebuzzofficial`, plus any page that the first 30 hits repost from (follow the "Original audio" or credit line once, not recursively).
- **Known leads already in the catalogue:** every `instagram.com` URL in `research/reels/*.json` and `research/live-research-2026-10-16.json`.

For each reel link seen, append one line to `research/media/candidates.jsonl`:

```json
{"url": "https://www.instagram.com/reel/<code>/", "code": "<code>", "found_via": "tag:jantarmantar", "publisher": "<handle>", "caption": "<visible caption>", "posted": "<datetime attr if visible>", "views": "<as shown>", "likes": "<as shown>", "seen_at": "<ISO time>"}
```

Deduplicate by `code`. Stop when there are 150 unique candidates or the source list is exhausted.

**Triage before download.** Score each candidate 0–3 for fit from its caption alone: police banter, bus or detention, chase, water cannon, costume, chant, lathi or panic, party or counter-group. Download the top 80 first.

## 3. Collect (video + metadata + top comments)

**Preferred, as the owner suggested and as worked in Codex: indown.io via Playwright.**
1. Open `https://indown.io/` in a *separate, logged-out* browser context (no Instagram cookies).
2. Paste the public reel URL and pick the first download server.
3. Wait for the `.mp4` link and save it to `research/media/<code>/video.mp4`.

**Fallback when indown fails or rate-limits:**

```bash
yt-dlp --cookies-from-browser "chrome:$DST:$PROFILE" \
  -o "research/media/%(id)s/video.%(ext)s" --write-info-json --no-playlist \
  --sleep-requests 5 --sleep-interval 20 --max-sleep-interval 60 "$URL"
```

**Comments (top 20–30).** On the reel page in the CDP Chrome:
1. Open the comments panel.
2. Scroll it 3 to 5 times.
3. Extract text, like count and age. Drop handles (store a hash if you need dedup).

Instagram's DOM changes often. The script should take one accessibility snapshot first and adapt its selectors, not hard-code class names. Write `research/media/<code>/comments.json`.

**Per-reel metadata.** Write `research/media/<code>/meta.json` with:
- `url`, `code`, `publisher`, `caption`, `posted`, `seen_at`, `views`, `likes`
- `download_method` (`indown` | `yt-dlp`), `sha256`
- ffprobe `duration`, `width`, `height`, `audio_codec`

Hash with `sha256sum research/media/<code>/video.mp4`.

## 4. Separate (on uxserver, **before** transcribing)

```bash
rsync -a research/media/ uxserver:~/reels/media/
ssh uxserver 'source ~/.venvs/reels/bin/activate && cd ~/reels && for d in media/*/; do
  c=$(basename "$d"); [ -f "$d/stems/htdemucs_ft/audio44k/vocals.wav" ] && continue
  ffmpeg -nostdin -y -i "$d/video.mp4" -vn -ac 2 -ar 44100 "$d/audio44k.wav"
  demucs -n htdemucs_ft -d cuda --segment 7 -o "$d/stems" "$d/audio44k.wav"
  # stems: vocals.wav (speech + chants), drums/bass/other (music + ambience)
  ffmpeg -nostdin -y -i "$d/stems/htdemucs_ft/audio44k/vocals.wav" -ac 1 -ar 16000 "$d/vocals16k.wav"
  ffmpeg -nostdin -y -i "$d/stems/htdemucs_ft/audio44k/other.wav" -i "$d/stems/htdemucs_ft/audio44k/drums.wav" \
         -i "$d/stems/htdemucs_ft/audio44k/bass.wav" -filter_complex amix=inputs=3:normalize=0 "$d/music.wav"
done'
```

Notes:
- Crowd chants end up in `vocals.wav` with the speech. Tag them at analysis time, using segments with many overlapping voices and low ASR confidence.
- If the music is still audible in `vocals.wav`, re-run that reel with `audio-separator` and a RoFormer vocal model, and keep whichever stem gives the better ASR logprob.
- Ambience (whistles, sirens, bus engines) mostly lands in `other.wav`. Cut it by time range at analysis.

## 5. Transcribe (two models, compare)

`~/reels/transcribe.py` on uxserver (write it as follows):

```python
# usage: python transcribe.py media/<code>/vocals16k.wav out.json
import sys, json
from faster_whisper import WhisperModel
wav, out = sys.argv[1], sys.argv[2]
res = {}
for name, path in [("large-v3", "Systran/faster-whisper-large-v3"),
                   ("hindi-large-v2", "/home/<user>/models/whisper-hindi-large-v2-ct2")]:
    m = WhisperModel(path, device="cuda", compute_type="float16")
    segs, info = m.transcribe(wav, language="hi", task="transcribe", beam_size=5,
                              vad_filter=True, vad_parameters={"min_silence_duration_ms": 300},
                              word_timestamps=True, condition_on_previous_text=False,
                              initial_prompt="Jantar Mantar, Delhi Police, detain, bus, chabi, sir, bhai, protest, lathi, water cannon")
    res[name] = [{"start": s.start, "end": s.end, "text": s.text, "avg_logprob": s.avg_logprob,
                  "no_speech_prob": s.no_speech_prob} for s in segs]
    del m
json.dump(res, open(out, "w"), ensure_ascii=False, indent=1)
```

Also run `large-v3` once with `language="en"` on the same file. Code-mixed Hinglish sometimes comes out cleaner in Roman script that way. Keep all three outputs.

```bash
ssh uxserver 'source ~/.venvs/reels/bin/activate && cd ~/reels && for d in media/*/; do
  [ -f "$d/asr.json" ] || python transcribe.py "$d/vocals16k.wav" "$d/asr.json"; done'
rsync -a uxserver:~/reels/media/ research/media/
```

**Machine "listening pass".** For each segment:
1. Align the models by time.
2. Mark `agree` when the normalised texts match closely (after transliterating Devanagari to Roman with `indic-transliteration`, `pip install indic-transliteration`).
3. Otherwise mark `disagree`. Any `avg_logprob < -1.0` is `low`.

Write `research/transcripts/<code>.json` with:
- `models` (repo ids and revisions)
- `segments[]`, each with `start`, `end`, `hi`, `roman`, `alt`, `status` (`agree` | `disagree` | `low`) and `human_checked: false`

**Human check (owner, about 10 minutes per 20 reels).**
1. Generate `research/media/review.html`: one row per *key line* (the lines a writer would use), with an `<audio>` tag playing that time range of `vocals.wav`, both transcripts, and a text box.
2. The owner corrects lines and exports `review.json`.
3. Merge it back, setting `human_checked: true`.

Only `human_checked` lines may be written into a catalogue entry as `"kind": "heard-verbatim"`.

## 6. Identify music

On the owner's machine:

```bash
python - <<'EOF'
import asyncio, json, glob
from shazamio import Shazam
async def main():
    sh = Shazam()
    for f in glob.glob("research/media/*/music.wav"):
        r = await sh.recognize(f)   # recognise a 10-20 s slice if the file is long
        t = r.get("track", {})
        json.dump({"title": t.get("title"), "artist": t.get("subtitle"), "shazam": t.get("url")},
                  open(f.replace("music.wav", "music-id.json"), "w"))
asyncio.run(main())
EOF
```

If Shazam returns nothing, use `fpcalc` with AcoustID (needs a free AcoustID API key in `$ACOUSTID_KEY`). Record the song in the reel entry's `music` field and in the audio manifest. The audio workstream then sources the clean published track (the owner's 19 Oct rights decision: use freely, record the source).

## 7. Analyse and catalogue

For each reel with a transcript, Claude writes or updates `research/reels/<id>.json` (schema `sqr-reel/1`, see any existing file, e.g. `research/reels/bus-key-snatch.json`). It fills:

- `situation`, `where`, `when`, and `who` (protester type, officer type, others).
- `comicMechanism`: one or more of `goal_reversal`, `scale_collision`, `literal_service_request`, `borrowed_confidence`, `social_permission`, `bureaucratic_literalism`.
- `lines[]`, each with `kind`:
  - `heard-verbatim` (human-checked);
  - `machine-draft` (ASR, not checked);
  - `caption`;
  - `quoted-in-source` (news);
  - `paraphrased`.
- `reactionBeats`: pauses, laughs and cuts with timestamps. Find them from silence gaps in `vocals.wav`, crowd-laugh energy, and hard cuts from ffmpeg scene detection: `ffmpeg -i video.mp4 -vf "select='gt(scene,0.35)',showinfo" -f null - 2>&1 | grep pts_time`.
- `music` (song id and role: under the chase, enters on the reveal, cut on the pause).
- `commentMood` (mood labels plus 3–6 quoted comments, without handles).
- `phase` (`morning` | `midday` | `tense` | `showdown` | `aftermath`), `emotion[]`, `actorTypes[]`.
- `clipRanges[]`: usable voice barks, signature lines, music beds and crowd beds, each `{ "stem": "vocals|music|other", "start": s, "end": e, "label": "...", "speaker": "constable|student|...", "line": "..." }`.
- `buildThis` (`flag`, a one-line game `situation`, `cast`).
- `sources[]` (the reel URL, publisher and any news coverage).

Then regenerate `research/reels/index.json` (counts by status, phase and buildThis).

## 8. Hand-off and commit

```bash
git checkout -b research/reels-pass-$(date +%Y%m%d)
git add research/reels research/transcripts research/media/candidates.jsonl
git commit -m "Analyse <n> reels from the owner's Instagram pass"   # plus the session's attribution lines
```

Never `git add research/media/*/video.mp4` or the stems.

The report back should state:
- how many candidates were found, downloaded, transcribed and human-checked;
- which stage stopped and why (`_blocked.json`);
- the top 10 new `buildThis` situations.

## Stage checklist (resumable)

Each stage skips work whose output file already exists, so the session can be re-run after a block:

| Stage | Output that marks it done |
|---|---|
| discover | `research/media/candidates.jsonl` ≥ 150 lines |
| collect | `research/media/<code>/{video.mp4,meta.json,comments.json}` |
| separate | `media/<code>/stems/htdemucs_ft/audio44k/vocals.wav` (uxserver) |
| transcribe | `media/<code>/asr.json` → `research/transcripts/<code>.json` |
| music-id | `research/media/<code>/music-id.json` |
| human check | `review.json` merged, `human_checked: true` |
| catalogue | `research/reels/<id>.json` with `clipRanges` filled |
