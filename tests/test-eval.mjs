// The eval's own arithmetic: the map fit, the voice tests and the vision file's shape.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fit, toMetres } from '../eval/lib/place.mjs';
import { isHinglish, isLecture, isPlainInstruction } from '../eval/lib/text.mjs';
import { chaseProbe } from '../eval/lib/days.mjs';

// A true map at any scale, rotation or mirror fits with no error and reports its scale.
const real = [{ x: 0, y: 0 }, { x: 300, y: 0 }, { x: 0, y: 700 }, { x: 250, y: 400 }];
const rot = (p, a, s, m = 1) => ({ x: s * (Math.cos(a) * p.x - Math.sin(a) * p.y * m), y: s * (Math.sin(a) * p.x + Math.cos(a) * p.y * m) });
for (const m of [1, -1]) {
  const f = fit(real.map((p) => rot(p, 1.1, 0.25, m)), real);
  assert.ok(Math.abs(f.scale - 0.25) < 1e-9, `scale ${f.scale}`);
  assert.ok(f.error < 1e-9, `error ${f.error}`);
}
// Shuffled landmarks don't fit.
assert.ok(fit([real[2], real[0], real[3], real[1]], real).error > 0.5);
// Lat/lon to metres: 0.001° of latitude is about 111 m.
const [, b] = toMetres([{ lat: 28.63, lon: 77.21 }, { lat: 28.631, lon: 77.21 }]);
assert.ok(Math.abs(b.y - 111.3) < 0.5 && Math.abs(b.x) < 1e-9);

assert.ok(isHinglish('Bhai, ek second. Nahi, woh wala second nahi, phone aa raha hai.'));
assert.ok(!isHinglish('Steel barricades clang into place on Parliament Street.'));
assert.ok(isLecture('Sab log pooch lena pehle'));
assert.ok(!isLecture('Sir mujhe bhi detain kar lo, mere dost andar hain'));
assert.ok(isPlainInstruction('Talk to Constable Yadav'));
assert.ok(!isPlainInstruction('Delhi Police ki free van seva lo'));

// Every metric in the vision has a direction, a floor and a target that differ, and a way to be measured.
const V = JSON.parse(readFileSync(new URL('../eval/vision.json', import.meta.url), 'utf8'));
const ids = new Set();
for (const p of V.pillars) for (const m of p.metrics) {
  assert.ok(!ids.has(m.id), `metric ${m.id} listed twice`); ids.add(m.id);
  assert.ok(['high', 'low'].includes(m.better) && m.floor !== m.target && m.weight > 0, m.id);
  assert.ok(['engine', 'static', 'browser', 'judge', 'human'].includes(m.how), m.id);
  assert.ok(m.better === 'high' ? m.target > m.floor : m.target < m.floor, `${m.id}: target is on the good side of the floor`);
}

// The chase probe runs on the real engine and finds at least one chase.
const c = chaseProbe([[11, 20], [14, 20]]);
assert.ok(Object.values(c.runs).flat().some((r) => r === 'caught' || r === 'lost'), JSON.stringify(c.runs));
console.log(`Eval: map fit, voice tests, ${ids.size} vision metrics and the chase probe pass.`);
