import assert from 'node:assert/strict';
import {stat, readdir} from 'node:fs/promises';
import {fixture} from './lib/people-fixture.mjs';
// Shipped people/props GLBs: clips, skeleton, variants, LODs, named hookup nodes, file
// budgets; and the public loaders (loadCharacters, loadModels) end to end.
const F = await fixture();
const restoreFetch = F.installFetch();
try {
  const {THREE, characters: C, load} = F;
  // ---- budgets
  const sizes = {};
  for (const dir of ['dist/assets/people', 'dist/assets/props']) for (const f of await readdir(dir)) sizes[`${dir}/${f}`] = (await stat(`${dir}/${f}`)).size;
  const total = Object.values(sizes).reduce((a, b) => a + b, 0);
  for (const [f, n] of Object.entries(sizes)) assert(n < 20e6, `${f} under 20 MB`);
  assert(total < 12e6, `people + props under 12 MB (${(total / 1e6).toFixed(2)} MB)`);
  // ---- people
  const skeletons = {};
  for (const [gender, file] of [['male', 'people-m'], ['female', 'people-f']]) {
    const {gltf, json} = await load(`dist/assets/people/${file}.glb`);
    assert(json.extensionsUsed.includes('EXT_meshopt_compression'), 'meshopt compressed');
    assert(json.extensionsUsed.includes('EXT_texture_webp'), 'webp textures');
    // clips
    const clips = Object.fromEntries(gltf.animations.map(c => [c.name, c]));
    assert.deepEqual(Object.keys(clips).sort(), [...C.CLIPS].sort(), `${gender} clip set`);
    const info = gltf.scene.userData.clips;
    for (const name of C.CLIPS) {
      const c = clips[name];
      assert(c.duration > .5 && c.duration < 6, `${gender} ${name} duration ${c.duration}`);
      assert(c.tracks.some(t => t.name === 'Hips.quaternion') && c.tracks.some(t => t.name === 'Hips.position'), `${gender} ${name} drives the hips`);
      assert(c.tracks.filter(t => t.name.endsWith('.quaternion')).length >= 18, `${gender} ${name} drives the body`);
      assert(info[name] && Number.isFinite(info[name].speed) && /CMU/.test(info[name].source), `${gender} ${name} metadata`);
      assert.equal(info[name].loop, !C.ONE_SHOT.includes(name), `${gender} ${name} loop flag`);
    }
    assert(info.Walk.speed > 1 && info.Walk.speed < 1.5 && info.Run.speed > 2.4 && info.Run.speed < 3.5, `${gender} natural speeds`);
    // loops close: first and last keys match for looping clips
    for (const name of C.CLIPS.filter(n => info[n].loop)) for (const t of clips[name].tracks.filter(t => t.name.endsWith('.quaternion'))) {
      const a = new THREE.Quaternion().fromArray(t.values, 0), b = new THREE.Quaternion().fromArray(t.values, t.values.length - 4);
      assert(a.angleTo(b) < .05, `${gender} ${name} ${t.name} loops seamlessly (${a.angleTo(b).toFixed(3)} rad)`);
    }
    // one skeleton per file, every variant bound to it, LOD0 + LOD1 per variant
    const meshes = []; gltf.scene.traverse(o => { if (o.isSkinnedMesh) meshes.push(o); });
    const jointNames = meshes[0].skeleton.bones.map(b => b.name);
    for (const m of meshes) assert.deepEqual(m.skeleton.bones.map(b => b.name), jointNames, `${gender} shared skeleton`);
    skeletons[gender] = jointNames;
    const variants = {};
    for (const m of meshes) { const ud = m.parent.userData.variant ? m.parent.userData : m.userData; (variants[ud.variant] ??= [0, 0])[ud.lod ? 1 : 0] += m.geometry.index.count / 3; }
    assert.deepEqual(Object.keys(variants).sort(), C.variantNames({gender}).sort(), `${gender} variants match VARIANTS`);
    for (const [name, [t0, t1]] of Object.entries(variants)) {
      assert(t0 > 15000 && t0 < 45000, `${name} LOD0 ${t0} tris`);
      assert(t1 > 3000 && t1 < t0 * .4, `${name} LOD1 ${t1} tris`);
    }
    console.log(gender, Object.entries(variants).map(([n, [a, b]]) => `${n} ${a}/${b}`).join(', '));
    console.log(gender, 'clips', C.CLIPS.map(n => `${n} ${clips[n].duration.toFixed(2)}s${info[n].speed ? ' @' + info[n].speed + 'm/s' : ''}`).join(', '));
  }
  assert.deepEqual(skeletons.male, skeletons.female, 'both bodies share the joint set (same clip bindings)');
  // ---- loaders end to end
  await C.loadCharacters();
  const kinds = {};
  for (const name of Object.keys(C.VARIANTS)) { const a = C.makeCharacter({variant: name}); kinds[C.VARIANTS[name].kind] = (kinds[C.VARIANTS[name].kind] ?? 0) + 1; assert.equal(a.userData.variant, name); a.updateMatrixWorld(true);
    const box = new THREE.Box3(); a.userData.lods[0].forEach(m => box.expandByObject(m)); assert(Math.abs(box.min.y) < .03, `${name} stands on the ground`); }
  assert(kinds.civilian >= 8 && kinds.raf && kinds.constable && kinds.party && kinds.sena, 'roster covers civilians, police, RAF, party, sena');
  const {loadModels, aimVajra, placard} = await F.models();
  const M = await loadModels();
  for (const key of ['vajra', 'suv', 'bike', 'shield', 'lathi', 'helmet', 'canister']) assert(M[key]?.isObject3D, key);
  for (const key of ['party', 'sena', 'opp', 'students']) assert(M.flags[key]?.isObject3D, 'flag ' + key);
  const node = (o, n) => assert(o.getObjectByName(n), `${o.name} has node ${n}`);
  node(M.vajra, 'turret'); node(M.vajra, 'nozzle'); node(M.vajra, 'nozzleTip'); node(M.suv, 'flagMount'); node(M.bike, 'flagMount'); node(M.bike, 'seat');
  node(M.shield, 'grip'); node(M.lathi, 'grip'); node(M.canister, 'smoke'); for (const k of ['party', 'sena', 'opp']) node(M.flags[k], 'grip');
  for (let i = 0; i < 8; i++) node(M.flags.students, 'placard' + i);
  assert(M.vajra.getObjectByName('turret').children.length > 0, 'turret is its own node with children');
  const v = M.vajra.clone(true), a = aimVajra(v, 0, 0).clone(), b = aimVajra(v, Math.PI / 2, .3).clone();
  assert(a.distanceTo(b) > .5 && b.y > a.y, 'turret yaw and nozzle pitch move the spray origin');
  const dims = o => new THREE.Box3().setFromObject(o, true).getSize(new THREE.Vector3());
  const vd = dims(M.vajra), sd = dims(M.suv), bd = dims(M.bike), sh = dims(M.shield);
  assert(vd.z > 7 && vd.z < 11 && vd.y > 2.6 && vd.y < 4, `Vajra truck size ${vd.toArray()}`);
  assert(sd.z > 4.2 && sd.z < 5.3 && sd.x > 1.7 && sd.x < 2.1, `SUV size ${sd.toArray()}`);
  assert(bd.z > 1.8 && bd.z < 2.3 && bd.y > .9 && bd.y < 1.4, `bike size ${bd.toArray()}`);
  assert(sh.y > .9 && sh.y < 1.2 && sh.x > .45 && sh.x < .7, `shield size ${sh.toArray()}`);
  assert(placard(M.flags.students, 3).isObject3D);
  assert(M.bus && M.bus.userData.seats.length >= 16, 'detention bus with seats');
  console.log('vajra', vd.toArray().map(x => x.toFixed(2)).join('x'), 'suv', sd.toArray().map(x => x.toFixed(2)).join('x'), 'bike', bd.toArray().map(x => x.toFixed(2)).join('x'), 'bus seats', M.bus.userData.seats.length);
  console.log('sizes', Object.entries(sizes).map(([f, n]) => `${f.split('/').pop()} ${(n / 1024).toFixed(0)}K`).join(', '), `total ${(total / 1e6).toFixed(2)} MB`);
  console.log('PASS: people GLBs (15 retargeted clips with metadata and closed loops, one shared skeleton, 13 variants with LODs), props with hookup nodes and plausible sizes, loadCharacters/loadModels end to end, budget');
} finally { restoreFetch(); await F.close(); }
