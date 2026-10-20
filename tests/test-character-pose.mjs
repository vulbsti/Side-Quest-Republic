import assert from 'node:assert/strict';
import {fixture} from './lib/people-fixture.mjs';
// Real people GLBs (meshopt geometry, mocap clips; textures stripped) driven through the
// public characters.js API: seated IK, carry grips, gestures, clip selection, gait sync.
const F = await fixture();
try {
  const {THREE, characters: C, load} = F;
  const v3 = () => new THREE.Vector3();
  for (const [gender, file] of [['male', 'people-m'], ['female', 'people-f']]) C.registerRig(gender, (await load(`dist/assets/people/${file}.glb`)).gltf);
  C.registerProp('lathi', (await load('dist/assets/props/lathi.glb')).gltf.scene);
  C.registerProp('shield', (await load('dist/assets/props/shield.glb')).gltf.scene);
  const looks = {female: {gender: 'female'}, male: {gender: 'male'}, officer: {police: true}};
  for (const [kind, look] of Object.entries(looks)) {
    {const actor = C.makeCharacter(look); for (let frame = 0; frame < 600; frame++) C.animateCharacter(actor, 0, frame / 60, {seated: true, important: true}); actor.updateMatrixWorld(true); const b = actor.userData.bones;
      for (const [side, sign] of [['Left', 1], ['Right', -1]]) { const hip = b[side + 'UpLeg'].getWorldPosition(v3()), knee = b[side + 'Leg'].getWorldPosition(v3()), foot = b[side + 'Foot'].getWorldPosition(v3()), toe = b[side + 'ToeBase'].getWorldPosition(v3());
        assert(Math.abs(hip.y - .52) < .02, `${kind} seated hip matches cushion: ${hip.y}`); assert(foot.distanceTo(new THREE.Vector3(sign * .16, .11, .43)) < .025, kind + ' feet on cabin floor');
        assert(knee.z > hip.z + .2 && knee.y > .35 && knee.y < .7, kind + ' knee bends forward without raised legs'); assert(toe.z > foot.z && toe.y > 0 && toe.y < .14, kind + ' shoes point forward above floor'); }}
    for (const carry of ['water', 'speaker', 'phone', 'key']) { const actor = C.makeCharacter(look); for (let frame = 0; frame < 300; frame++) C.animateCharacter(actor, 0, frame / 60, {carry, important: true}); actor.updateMatrixWorld(true);
      for (const [i, side] of [[0, 'Left'], [1, 'Right']]) { const hand = C.CARRY_POSES[carry].hands[i]; if (hand) assert(actor.userData.bones[side + 'Hand'].getWorldPosition(v3()).distanceTo(new THREE.Vector3(...hand)) < .03, kind + ' ' + carry + ' reaches prop grip ' + side + ' ' + actor.userData.bones[side + 'Hand'].getWorldPosition(v3()).distanceTo(new THREE.Vector3(...hand))); } }
    {const actor = C.makeCharacter(look); for (let frame = 0; frame < 300; frame++) { C.animateCharacter(actor, 1.6, frame / 60, {carry: 'water', important: true}); if (frame > 150) { actor.updateMatrixWorld(true); for (const [i, side] of [[0, 'Left'], [1, 'Right']]) assert(actor.userData.bones[side + 'Hand'].getWorldPosition(v3()).distanceTo(new THREE.Vector3(...C.CARRY_POSES.water.hands[i])) < .06, kind + ' walking grip stays near crate'); } }}
    {const actor = C.makeCharacter(look); for (let frame = 0; frame < 600; frame++) { C.animateCharacter(actor, 3.6, frame / 60, {gesture: 'lathi-charge', important: true}); actor.updateMatrixWorld(true);
      for (const side of ['Left', 'Right']) { const hand = actor.userData.bones[side + 'Hand'].getWorldPosition(v3()); assert([hand.x, hand.y, hand.z].every(Number.isFinite)); assert(hand.y > (frame < 60 ? .6 : .9) && hand.y < 1.9 && Math.abs(hand.x) < .8 && Math.abs(hand.z) < .8, `charge arms stay anatomical during running ${kind} ${side} frame=${frame}: ${hand.toArray()}`); } }
      assert.equal(actor.userData.animation, 'Run');
      if (kind === 'officer') { assert(actor.userData.baton.visible); C.animateCharacter(actor, 0, 11, {important: true}); assert(!actor.userData.baton.visible); }}
    // IK gestures on top of the idle clip reach their targets and recover exactly
    for (const gesture of ['shrug', 'point']) {
      const actor = C.makeCharacter(look), control = C.makeCharacter({...look, variant: actor.userData.variant}); actor.userData.phase = 0;
      for (const character of [actor, control]) for (const action of Object.values(character.userData.actions)) action.time = 0;
      const H = actor.userData.height / 1.8, target = {shrug: [-.43, 1.39, .28], point: [-.20, 1.38, .40]}[gesture].map(x => x * H);
      for (let frame = 0; frame < 600; frame++) {
        C.animateCharacter(actor, 0, frame / 60, {gesture, important: true}); C.animateCharacter(control, 0, frame / 60, {important: true});
        if (frame >= 200) { actor.updateMatrixWorld(true); assert(actor.userData.bones.RightHand.getWorldPosition(v3()).distanceTo(new THREE.Vector3(...target)) < .03, `${kind} ${gesture} reaches anatomical hand target ${actor.userData.bones.RightHand.getWorldPosition(v3()).toArray()} vs ${target} frame ${frame}`); }
      }
      if (gesture === 'shrug') { const b = actor.userData.bones, s = b.RightArm.getWorldPosition(v3()), e = b.RightForeArm.getWorldPosition(v3()), w = b.RightHand.getWorldPosition(v3()); assert(e.clone().sub(s).angleTo(w.clone().sub(e)) > .7, `${kind} shrug visibly bends elbow`); }
      for (let frame = 600; frame < 780; frame++) { C.animateCharacter(actor, 0, frame / 60, {important: true}); C.animateCharacter(control, 0, frame / 60, {important: true}); }
      for (const [name, bone] of Object.entries(actor.userData.bones)) if (!/Hand.+\d/.test(name) || kind !== 'officer') assert(bone.quaternion.angleTo(control.userData.bones[name].quaternion) < 1e-4, `${kind} ${gesture} recovers authored idle (${name})`);
    }
    // Legacy gestures now map onto mocap clips when standing
    for (const [gesture, clip] of [['phone', 'Film'], ['wave', 'Wave'], ['push', 'Push'], ['lathi-charge', 'Lathi']]) {
      const actor = C.makeCharacter(look); for (let frame = 0; frame < 120; frame++) C.animateCharacter(actor, 0, frame / 60, {gesture, important: true});
      assert.equal(actor.userData.animation, clip, `${kind} ${gesture} plays ${clip}`); assert(actor.userData.actions[clip].getEffectiveWeight() > .99);
      assert.equal(actor.userData.phone.visible, clip === 'Film');
      if (clip === 'Film') { actor.updateMatrixWorld(true); const p = actor.userData.phone.getWorldPosition(v3()), head = actor.userData.bones.Head.getWorldPosition(v3()); assert(p.y > head.y - .35 && p.z > head.z + .15, `${kind} films with the phone up in front: ${p.toArray()} head ${head.toArray()}`); }
    }
  }
  // Explicit clips, pose/talking defaults, one-shots
  {const a = C.makeCharacter({gender: 'male'});
    for (const [opts, clip] of [[{pose: true}, 'Chant'], [{talking: true}, 'Talk'], [{action: 'Dance'}, 'Dance'], [{action: 'Sit'}, 'Sit'], [{action: 'Lie'}, 'Lie'], [{}, 'Idle']]) { for (let f = 0; f < 30; f++) C.animateCharacter(a, 0, 20 + f / 60, {...opts, important: true}); assert.equal(a.userData.animation, clip); }
    const dur = C.playOnce(a, 'Shoved'); assert(dur > 1); for (let f = 0; f < 30; f++) C.animateCharacter(a, 0, 21 + f / 60, {important: true}); assert.equal(a.userData.animation, 'Shoved');
    for (let f = 0; f < Math.ceil(dur * 60) + 5; f++) C.animateCharacter(a, 0, 22 + f / 60, {important: true}); assert.equal(a.userData.animation, 'Idle');
    a.updateMatrixWorld(true); const lie = C.makeCharacter({gender: 'male'}); for (let f = 0; f < 60; f++) C.animateCharacter(lie, 0, f / 60, {action: 'Lie', important: true}); lie.updateMatrixWorld(true);
    assert(lie.userData.bones.Head.getWorldPosition(v3()).y < .45, 'Lie puts the head on the ground');}
  const slideReport = [];
  // Feet do not slide: at the natural speed a planted foot stays put in world space.
  for (const gender of ['male', 'female']) for (const clip of ['Walk', 'Run']) {
    const a = C.makeCharacter({gender}), v = C.clipSpeed(gender, clip); assert(v > (clip === 'Walk' ? .9 : 2.4) && v < (clip === 'Walk' ? 1.6 : 3.6), `${gender} ${clip} natural speed ${v}`);
    let x = 0; const dt = 1 / 60, prev = {}, slides = [];
    for (let f = 0; f < 240; f++) {
      x += v * dt; a.position.z = x; C.animateCharacter(a, v, f * dt, {important: true}); a.updateMatrixWorld(true);
      if (f < 90) continue;
      for (const side of ['Left', 'Right']) { const p = a.userData.bones[side + 'ToeBase'].getWorldPosition(v3());
        if (prev[side] && p.y < .05 && prev[side].y < .05) slides.push(Math.abs(p.z - prev[side].z) / dt); prev[side] = p; }
    }
    slides.sort((a, b) => a - b); const med = slides[slides.length >> 1], p90 = slides[Math.floor(slides.length * .9)];
    assert(slides.length > 20 && med < v * .12 && p90 < v * .4, `${gender} ${clip} planted toe slide median ${med?.toFixed(2)} p90 ${p90?.toFixed(2)} m/s (body ${v})`);
    slideReport.push(`${gender} ${clip} ${v} m/s: toe slip median ${med.toFixed(2)}, p90 ${p90.toFixed(2)} m/s`);
  }
  // Variant resolution and LOD switching
  assert.equal(C.resolveVariant({kind: 'raf'}), 'raf'); assert.equal(C.resolveVariant({police: true}), 'constable'); assert.equal(C.resolveVariant({variant: 'officer'}), 'constable');
  assert.equal(C.VARIANTS[C.resolveVariant({gender: 'female', color: '#e8ecef'})].gender, 'female');
  const names = new Set(Array.from({length: 9}, (_, i) => C.resolveVariant({index: i}))); assert(names.size >= 9, 'nine distinct civilian outfits');
  {const raf = C.makeCharacter({kind: 'raf'}); assert(raf.userData.shield && raf.userData.baton.visible);
    for (let f = 0; f < 60; f++) C.animateCharacter(raf, 0, f / 60, {distance: 30}); assert(raf.userData.lods[1].every(m => m.visible) && raf.userData.lods[0].every(m => !m.visible), 'far LOD');
    for (let f = 0; f < 60; f++) C.animateCharacter(raf, 0, 2 + f / 60, {important: true}); raf.updateMatrixWorld(true);
    assert(raf.userData.lods[0].every(m => m.visible), 'near LOD');
    const grip = raf.userData.shield.getObjectByName('grip').getWorldPosition(v3()); assert(raf.userData.bones.LeftHand.getWorldPosition(v3()).distanceTo(grip) < .03, 'RAF left hand holds the shield grip');}
  console.log(slideReport.join('\n'));
  console.log('PASS: people GLBs on both skeletons: seated IK, four item grips, walking grip, charge, IK gestures + recovery, gesture→clip mapping, Film phone placement, one-shots, Lie, no foot slide at natural Walk/Run speed, variants, LOD, RAF shield grip');
} finally { await F.close(); }
