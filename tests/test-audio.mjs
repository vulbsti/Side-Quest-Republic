// Checks the audio manifest and the cue map: every file exists, every spec cue is mapped to clips
// that exist, every clip records its source and licence, and the folder stays small. Then drives
// createAudio() through a whole day against a fake Web Audio context to catch runtime errors.
import assert from 'node:assert/strict';
import { readFileSync, statSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CUES, PHASES, PHASE_MUSIC, cueClips, createAudio } from '../dist/loop/audio.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const audioDir = root + 'dist/assets/audio/';
const manifest = JSON.parse(readFileSync(audioDir + 'manifest.json', 'utf8'));
const byId = new Map(manifest.clips.map((c) => [c.id, c]));
assert.equal(byId.size, manifest.clips.length, 'clip ids are unique');

// every file exists, matches its recorded size, and carries provenance
let total = 0;
for (const c of manifest.clips) {
  const st = statSync(audioDir + c.file);
  assert.equal(st.size, c.bytes, `${c.id}: size matches manifest`);
  total += st.size;
  for (const k of ['license', 'author', 'sourceUrl', 'title']) assert.ok(c[k] && String(c[k]).trim(), `${c.id}: has ${k}`);
  assert.ok(Array.isArray(c.sources) && c.sources.length, `${c.id}: has sources`);
  for (const s of c.sources) for (const k of ['license', 'author', 'sourceUrl', 'licenseUrl']) assert.ok(s[k], `${c.id}: source has ${k}`);
  assert.equal(typeof c.placeholder, 'boolean', `${c.id}: placeholder flag`);
  if (c.placeholder) assert.ok(c.placeholderReason, `${c.id}: placeholder says why`);
  assert.ok(c.analysis?.durationSeconds > 0.05 && c.loudness?.target, `${c.id}: analysed`);
  assert.ok(c.tags && (c.tags.cue || c.tags.phase || c.tags.mood), `${c.id}: tagged`);
}
assert.ok(total < 15 * 1024 * 1024, `audio under 15 MB (${(total / 1048576).toFixed(2)} MB)`);

// nothing stray in the folder
const listed = new Set(manifest.clips.map((c) => c.file));
for (const sub of ['music', 'amb', 'sfx']) {
  for (const f of readdirSync(audioDir + sub)) assert.ok(listed.has(`${sub}/${f}`), `unused file ${sub}/${f}`);
}

// every cue in the spec maps to steps whose clips all exist
const spec = readFileSync(root + 'plans/slice-spec.md', 'utf8');
const section = spec.slice(spec.indexOf('### Cues'), spec.indexOf('\n## ', spec.indexOf('### Cues')));
const specCues = [...section.matchAll(/`([a-z][a-z-]+)`/g)].map((m) => m[1]);
assert.ok(specCues.length >= 25, 'parsed the spec cue list');
for (const name of specCues) assert.ok(CUES[name], `spec cue ${name} is mapped`);
for (const name of Object.keys(CUES)) {
  const ids = cueClips(name);
  if (name !== 'awkward-silence' && name !== 'phase') assert.ok(ids.length, `${name} plays something`);
  for (const id of ids) assert.ok(byId.has(id), `${name}: clip ${id} exists`);
}
for (const p of PHASES) {
  const m = PHASE_MUSIC[p];
  for (const id of [m.base, m.hot, m.chase].filter(Boolean)) assert.equal(byId.get(id)?.kind, 'music', `${p}: ${id} is music`);
}

// ---------- fake Web Audio, enough to run the cue manager ----------
const param = (v = 0) => ({ value: v, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime(x) { this.value = x; }, cancelScheduledValues() {} });
let live = 0, made = 0;
class FakeCtx {
  constructor() { this.currentTime = 0; this.state = 'suspended'; this.destination = this.node(); }
  node(extra = {}) { return { connect: (n) => n, disconnect() {}, ...extra }; }
  createGain() { return this.node({ gain: param(1) }); }
  createBiquadFilter() { return this.node({ type: '', frequency: param(350) }); }
  createStereoPanner() { return this.node({ pan: param(0) }); }
  createDynamicsCompressor() { return this.node({ threshold: param(), knee: param(), ratio: param(), attack: param(), release: param() }); }
  createOscillator() { made++; live++; return this.node({ type: '', frequency: param(440), start() {}, stop() { if (!this.done) { this.done = true; live--; } } }); }
  createBuffer(ch, len, rate) { return { duration: len / rate }; }
  createBufferSource() {
    made++; live++;
    return this.node({ playbackRate: param(1), start() {}, stop() { if (!this.done) { this.done = true; live--; } } });
  }
  decodeAudioData(data) { return Promise.resolve({ duration: 4, bytes: data.byteLength }); }
  resume() { this.state = 'running'; return Promise.resolve(); }
}
globalThis.fetch = async (url) => {
  const path = fileURLToPath(url);
  const buf = readFileSync(path);
  return { json: async () => JSON.parse(buf), arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length) };
};
const warn = console.warn;
const warnings = [];
console.warn = (...a) => warnings.push(a.join(' '));

const audio = createAudio({ AudioContext: FakeCtx });
assert.equal(audio.cue('crowd-laugh'), false, 'nothing plays before unlock');
assert.equal(await audio.unlock(), true);
const ctx = audio.context;
const flush = () => new Promise((r) => setTimeout(r, 5));
const tick = async (seconds, listener = { x: 0, z: 0, yaw: 0 }) => {
  for (let t = 0; t < seconds; t += 0.1) { ctx.currentTime += 0.1; audio.update(0.1, listener); }
  await flush();
};
await audio.preload(manifest.clips.map((c) => c.id));
for (const phase of PHASES) {
  audio.setPhase(phase);
  audio.setCrowd(phase === 'morning' ? 8 : 140);
  audio.setIntensity(phase === 'showdown' ? 95 : 40);
  for (const name of Object.keys(CUES)) {
    assert.equal(audio.cue(name, { pos: { x: 12, z: -6 }, data: name === 'phase' ? phase : { seconds: 2 } }), true, name);
    await tick(0.3);
  }
  audio.chase(true); await tick(3); audio.chase(false);
  audio.silence(2); await tick(1);
  assert.equal(audio.state.cutUntil > 0, true, 'music cut during awkward silence');
  audio.cue('crowd-laugh'); await tick(0.2);
  assert.equal(audio.state.cutUntil, 0, 'a laugh brings the music back');
  await tick(25);
}
assert.equal(audio.state.phase, 'aftermath');
await tick(40);
assert.ok(live < 80, `sources are released (${live} live of ${made} made)`);
console.warn = warn;
assert.deepEqual(warnings, [], 'no audio warnings');

console.log(`audio ok: ${manifest.clips.length} clips, ${(total / 1048576).toFixed(2)} MB, ${specCues.length} spec cues mapped`);
