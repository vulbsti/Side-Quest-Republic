// Runtime pose check: drive characters through the real dist/characters.js in Node, bake the
// skinned result (plus attached props) to OBJ so Blender can render exactly what the game shows.
// usage (from the repo root): node assets-src/pose_export.mjs out.obj
// Scene: one actor per row of SHOTS, spaced along X. Textures are not exported (flat colours).
import {writeFile} from 'node:fs/promises';
import {fixture} from '../tests/lib/people-fixture.mjs';

const out = process.argv[2] || 'pose.obj';
const SHOTS = [
  [{kind: 'raf'}, {}],
  [{kind: 'raf'}, {action: 'Lathi'}, .35],
  [{police: true}, {gesture: 'lathi-charge'}, .3],
  [{police: true}, {gesture: 'push'}],
  [{variant: 'student-tee'}, {gesture: 'phone'}],
  [{variant: 'student-kurti'}, {pose: true}, .1],
  [{variant: 'student-hoodie'}, {carry: 'water'}],
  [{variant: 'aunty'}, {seated: true}],
  [{variant: 'vendor', hat: true}, {talking: true}],
  [{variant: 'student-shirt-f', backpack: true}, {}, 0, 1.4],
  [{variant: 'party-worker'}, {action: 'Dance'}, .4],
  [{variant: 'sena'}, {action: 'Wave'}],
];
const F = await fixture(); const restore = F.installFetch();
const {THREE, characters: C} = F;
await C.loadCharacters();
let obj = 'mtllib pose.mtl\n', mtl = '', vbase = 1; const mats = new Map();
const v = new THREE.Vector3(), n = new THREE.Vector3();
function emit(mesh, name) {
  const g = mesh.geometry, pos = g.attributes.position, idx = g.index;
  const m = mesh.material, key = m.name || m.uuid;
  if (!mats.has(key)) { mats.set(key, 'm' + mats.size); const c = m.color ?? new THREE.Color(1, 1, 1); mtl += `newmtl ${mats.get(key)}\nKd ${c.r} ${c.g} ${c.b}\n# ${key}\n`; }
  obj += `o ${name}\nusemtl ${mats.get(key)}\n`;
  mesh.updateMatrixWorld(true);
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    if (mesh.isSkinnedMesh) mesh.applyBoneTransform(i, v);
    v.applyMatrix4(mesh.matrixWorld);
    obj += `v ${v.x.toFixed(4)} ${v.y.toFixed(4)} ${v.z.toFixed(4)}\n`;
  }
  const tri = idx ? idx.count : pos.count;
  for (let i = 0; i < tri; i += 3) { const a = idx ? idx.getX(i) : i, b = idx ? idx.getX(i + 1) : i + 1, c = idx ? idx.getX(i + 2) : i + 2; obj += `f ${a + vbase} ${b + vbase} ${c + vbase}\n`; }
  vbase += pos.count;
}
SHOTS.forEach(([look, opts, phase = 0, speed = 0], k) => {
  const a = C.makeCharacter(look); a.position.x = (k - (SHOTS.length - 1) / 2) * 1.1;
  for (const act of Object.values(a.userData.actions)) act.time = 0;
  const frames = 90 + Math.round(phase * 120);
  for (let f = 0; f < frames; f++) C.animateCharacter(a, speed, f / 60, {important: true, ...opts});
  a.updateMatrixWorld(true);
  a.traverse(o => { if (o.isMesh && o.visible && (function vis(x) { return !x || (x.visible && vis(x.parent)); })(o.parent)) emit(o, `${a.userData.variant}_${o.name}`); });
  console.log(k, a.userData.variant, a.userData.animation);
});
if (process.argv.includes('--bus')) {
  // detention bus from models.js, behind the row, with two characters on its seats
  const {loadModels} = await F.models(); const M = await loadModels();
  const bus = M.bus; bus.position.set(0, 0, -6); bus.updateMatrixWorld(true);
  bus.traverse(o => { if (o.isInstancedMesh) { const m = new THREE.Matrix4(); for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m); const c = new THREE.Mesh(o.geometry.clone().applyMatrix4(m), o.material); o.parent.add(c); } o.visible = false; } });
  bus.updateMatrixWorld(true);
  bus.traverse(o => { if (o.isMesh && o.visible && !/glass/i.test(o.material.name)) emit(o, 'bus_' + o.name); });
  for (const [i, look] of [[0, {variant: 'student-tee'}], [5, {variant: 'aunty'}]]) {
    const seat = bus.userData.seats[i], a = C.makeCharacter(look); a.position.copy(seat.position).applyMatrix4(bus.matrixWorld); a.rotation.y = seat.yaw + Math.PI / 2;
    for (let f = 0; f < 90; f++) C.animateCharacter(a, 0, f / 60, {important: true, seated: true});
    a.updateMatrixWorld(true); a.traverse(o => { if (o.isMesh && o.visible && o.parent.visible) emit(o, 'seated_' + o.name); });
  }
}
await writeFile(out, obj); await writeFile(out.replace(/[^/]*$/, 'pose.mtl'), mtl);
restore(); await F.close();
