// The parts a program can't count: is it funny, does it look like Delhi, does it feel good. A judge (Claude, or
// a person) scores a packet against a rubric in eval/rubrics/, and the score is saved in eval/judgements/ with the
// commit it judged. npm run eval reads the newest judgement of each metric and says when it is older than the code.
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { rng } from '../../verify/lib/explore.mjs';

export const JUDGED = { laughs: 'humour', recognisable: 'place', feel: 'feel', quality: 'feel' };

/** Seeded sample of n lines, so two runs on the same code judge the same lines. */
export function sample(list, n, seed = 7) {
  const r = rng(seed), a = list.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, n);
}

export function latestJudgements(root) {
  const dir = join(root, 'eval/judgements');
  if (!existsSync(dir)) return {};
  const all = readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));
  const out = {};
  for (const j of all.sort((a, b) => String(a.date).localeCompare(String(b.date)))) for (const [id, v] of Object.entries(j.scores || {})) out[id] = { score: v, by: j.by, date: j.date, commit: j.commit, notes: j.notes?.[id] ?? null };
  return out;
}

/** Packets for a judge: what to look at for each rubric, written to eval/out/judge/ as JSON plus the images. */
export function writePackets(root, outDir, { lines, scenes, shots }) {
  mkdirSync(outDir, { recursive: true });
  const refs = join(root, 'eval/refs');
  const withRefs = (shots || []).map((s) => ({ ...s, ref: existsSync(join(refs, `${s.id}.jpg`)) ? join(refs, `${s.id}.jpg`) : null }));
  const packets = {
    humour: { rubric: 'eval/rubrics/humour.md', lines: sample(lines, 40).map((l) => l.text), scenes: scenes.slice(0, 4) },
    place: { rubric: 'eval/rubrics/place.md', shots: withRefs.filter((s) => s.id !== 'crowd-1530') },
    feel: { rubric: 'eval/rubrics/feel.md', shots: withRefs },
  };
  for (const [k, p] of Object.entries(packets)) writeFileSync(join(outDir, `${k}.json`), JSON.stringify(p, null, 1));
  return packets;
}

const SCHEMA = {
  type: 'object', additionalProperties: false, required: ['score', 'why', 'fix'],
  properties: { score: { type: 'number' }, why: { type: 'string' }, fix: { type: 'string' } },
};

/** Ask Claude to judge each packet (needs `npm install` and Anthropic credentials). Returns { metric: { score, why, fix } }. */
export async function judgeWithClaude(root, packets) {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic();
  const ask = async (rubricFile, content) => {
    const rubric = readFileSync(join(root, rubricFile), 'utf8');
    // fallbacks: 'default' re-runs a declined request on a fallback model inside the same call.
    const msg = await client.beta.messages.create({
      model: 'claude-opus-5-5', max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',
      output_config: { effort: 'high', format: { type: 'json_schema', schema: SCHEMA } },
      system: rubric,
      messages: [{ role: 'user', content }],
    });
    if (msg.stop_reason === 'refusal') throw new Error(`judge refused: ${msg.stop_details?.category ?? ''}`);
    const text = msg.content.find((b) => b.type === 'text')?.text ?? '{}';
    return JSON.parse(text);
  };
  const img = (file) => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: readFileSync(file).toString('base64') } });
  const out = {};
  out.laughs = await ask(packets.humour.rubric, [{ type: 'text', text: `Lines:\n${packets.humour.lines.map((l, i) => `${i + 1}. ${l}`).join('\n')}\n\nScenes as played:\n${packets.humour.scenes.map((s) => s.join('\n')).join('\n---\n')}` }]);
  const placeContent = [];
  for (const s of packets.place.shots) {
    placeContent.push({ type: 'text', text: `Spot: ${s.id}${s.ref ? ' (game screenshot, then the real photo)' : ' (game screenshot; no real photo yet, judge from what you know of the place)'}` });
    if (existsSync(s.file)) placeContent.push(img(s.file));
    if (s.ref) placeContent.push(img(s.ref));
  }
  out.recognisable = await ask(packets.place.rubric, placeContent);
  const feelContent = [{ type: 'text', text: 'Screenshots of one day, in order. Judge the look section only; leave the hands section to a person playing.' }, ...packets.feel.shots.filter((s) => existsSync(s.file)).map((s) => img(s.file))];
  out.quality = await ask(packets.feel.rubric, feelContent);
  return out;
}

export function saveJudgement(root, { by, commit, results }) {
  const dir = join(root, 'eval/judgements');
  mkdirSync(dir, { recursive: true });
  const date = new Date().toISOString();
  const file = join(dir, `${date.slice(0, 19).replace(/[:T]/g, '-')}-${by.replace(/\W+/g, '-')}.json`);
  writeFileSync(file, JSON.stringify({ by, date, commit, scores: Object.fromEntries(Object.entries(results).map(([k, v]) => [k, v.score])), notes: Object.fromEntries(Object.entries(results).map(([k, v]) => [k, `${v.why} Fix: ${v.fix}`])) }, null, 1) + '\n');
  return file;
}
