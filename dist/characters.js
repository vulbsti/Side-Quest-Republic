import {animationInterval} from './frame-clock.js?v=27';
import * as THREE from 'three';
import {GLTFLoader} from './vendor/GLTFLoader.js?v=27';
import {MeshoptDecoder} from './vendor/meshopt_decoder.module.js?v=27';

/*
 * Delhi crowd characters: two skinned GLBs (assets/people/people-m.glb, people-f.glb),
 * one MPFB skeleton per body, several complete outfit variants per file (each a single
 * skinned mesh plus a decimated .lod1 copy) and a shared set of retargeted CMU mocap clips.
 * Sources and licences: assets-src/PROVENANCE.md. Build: assets-src/people/README in ASSETS.md.
 *
 * makeCharacter(look) → THREE.Group; animateCharacter(root, speed, t, opts) each frame.
 */

const GESTURE = {charge: /lathi-charge|baton-warning/, push: /push|shove/, phone: /phone|record/, offer: /offer|record/, shrug: /shrug/, point: /point/, laugh: /laugh/, count: /count|look-at-hand/, listen: /nod|listen/, wave: /wave/, mic: /mic-check/, rest: /rest/};

/** Every outfit variant: body, faction kind and two representative colours (top, bottom). */
export const VARIANTS = Object.freeze({
  'student-tee':     {gender: 'male',   kind: 'civilian',  top: '#d6a834', bottom: '#2e3e62'},
  'student-hoodie':  {gender: 'male',   kind: 'civilian',  top: '#3c3e42', bottom: '#1e1e22'},
  'student-kurta':   {gender: 'male',   kind: 'civilian',  top: '#a0482a', bottom: '#2e3e62'},
  'uncle':           {gender: 'male',   kind: 'civilian',  top: '#8a9ac0', bottom: '#5f5f62'},
  'vendor':          {gender: 'male',   kind: 'civilian',  top: '#c4baa0', bottom: '#cdc6b4'},
  'party-worker':    {gender: 'male',   kind: 'party',     top: '#eeece4', bottom: '#f0eee8'},
  'sena':            {gender: 'male',   kind: 'sena',      top: '#28282c', bottom: '#282e3c'},
  'constable':       {gender: 'male',   kind: 'constable', top: '#a08a5c', bottom: '#a08a5c'},
  'raf':             {gender: 'male',   kind: 'raf',       top: '#5a74a4', bottom: '#5a74a4'},
  'student-tee-f':   {gender: 'female', kind: 'civilian',  top: '#eeece6', bottom: '#465c82'},
  'student-kurti':   {gender: 'female', kind: 'civilian',  top: '#e8be3c', bottom: '#2e3e62'},
  'aunty':           {gender: 'female', kind: 'civilian',  top: '#781e2d', bottom: '#781e2d'},
  'student-shirt-f': {gender: 'female', kind: 'civilian',  top: '#285a50', bottom: '#242834'},
});
/** Clip names present on both skeletons. One-shots play once and hold their last frame. */
export const CLIPS = Object.freeze(['Idle', 'Walk', 'Run', 'Talk', 'Chant', 'Film', 'Lathi', 'Shoved', 'Duck', 'Sit', 'Dance', 'Push', 'Wave', 'Jump', 'Lie']);
export const ONE_SHOT = Object.freeze(['Shoved', 'Duck', 'Jump']);
const LOCO = ['Walk', 'Run'];
/** Beyond this distance (m) the decimated LOD1 mesh is drawn instead of the full one. */
export const LOD_DISTANCE = 16;

const files = {male: './assets/people/people-m.glb', female: './assets/people/people-f.glb'};
const rigs = {}, templates = {}, props = {};
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
let pending, serial = 0;

/** Loads both people GLBs (+ lathi and shield props). Await before makeCharacter. */
export function loadCharacters(onProgress = () => {}) {
  return pending ??= Promise.all([
    ...Object.entries(files).map(async ([gender, path]) => {
      registerRig(gender, await loader.loadAsync(new URL(path, import.meta.url).href)); onProgress(gender); return gender;
    }),
    ...['lathi', 'shield'].map(async (name) => {
      props[name] = (await loader.loadAsync(new URL(`./assets/props/${name}.glb`, import.meta.url).href)).scene; return name;
    }),
  ]).then((names) => { onProgress('props'); return names; });
}

/** Natural ground speed (m/s) of a clip on a body: Walk ≈1.27/1.12, Run ≈3.10/2.73 (male/female); 0 for in-place clips. */
export function clipSpeed(gender, name) { return rigs[gender]?.info[name]?.speed ?? 0; }
/** Per-clip metadata {speed, loop, duration, source, window} for a body, from the GLB scene extras. */
export function clipInfo(gender) { return rigs[gender]?.info ?? {}; }
/** Variant names, optionally filtered: variantNames({gender:'female'}), variantNames({kind:'civilian'}). */
export function variantNames({gender, kind} = {}) { return Object.keys(VARIANTS).filter(n => (!gender || VARIANTS[n].gender === gender) && (!kind || VARIANTS[n].kind === kind)); }

// Test hook / custom loading: register an already-parsed people GLTF for a body.
export function registerRig(gender, gltf) {
  const info = gltf.scene.userData?.clips ?? {};
  const clips = Object.fromEntries(gltf.animations.map(c => [c.name.split('.')[0], c]));
  rigs[gender] = {gltf, info, clips};
  for (const name of Object.keys(VARIANTS)) if (VARIANTS[name].gender === gender) delete templates[name];
}
export function registerProp(name, scene) { props[name] = scene; }

function cloneRig(source) {
  const clone = source.clone(true), src = [], dst = [];
  source.traverse(o => src.push(o)); clone.traverse(o => dst.push(o));
  const map = new Map(src.map((o, i) => [o, dst[i]]));
  for (let i = 0; i < src.length; i++) {
    if (!src[i].isSkinnedMesh) continue;
    const a = src[i], b = dst[i];
    b.skeleton = a.skeleton.clone(); b.bindMatrix.copy(a.bindMatrix);
    b.skeleton.bones = a.skeleton.bones.map(bone => map.get(bone));
    b.bind(b.skeleton, b.bindMatrix);
  }
  return clone;
}

// One pruned scene per variant (its LOD0 + LOD1 meshes only), measured once.
function template(name) {
  if (templates[name]) return templates[name];
  const v = VARIANTS[name], rig = rigs[v.gender];
  if (!rig) throw new Error('Call and await loadCharacters() before makeCharacter().');
  const scene = cloneRig(rig.gltf.scene), drop = [];
  scene.traverse(o => { if (o.isMesh && (o.userData.variant ?? o.parent?.userData?.variant) !== name) drop.push(o); });
  // A multi-material mesh imports as a Group of SkinnedMeshes; drop whole groups.
  for (const o of drop) { const holder = o.parent?.userData?.variant !== undefined && o.parent !== scene ? o.parent : o; holder.parent?.remove(holder); }
  const lod = [[], []];
  scene.traverse(o => {
    if (!o.isMesh) return;
    const level = (o.userData.lod ?? o.parent?.userData?.lod ?? 0) ? 1 : 0;
    lod[level].push(o); o.castShadow = true; o.receiveShadow = level === 0;
    const m = o.material;
    if (/\.hair$/.test(m.name) && !m.userData.prepared) { m.transparent = false; m.alphaTest = .5; m.side = THREE.DoubleSide; m.depthWrite = true; }
    m.userData.prepared = true;
  });
  scene.updateMatrixWorld(true);
  const box = new THREE.Box3(); for (const o of lod[0]) box.expandByObject(o);
  const bones = {}; scene.traverse(o => { if (o.isBone) bones[o.name.replace(/mixamorig:?/, '')] = o; });
  // Lathi grip in RightHand space: the stick crosses the palm from the little-finger side
  // and leaves the fist past the thumb; the grip point sits inside the curled fingers.
  const P = n => bones[n].getWorldPosition(new THREE.Vector3());
  const hand = P('RightHand'), along = P('RightHandMiddle1').sub(hand), len = along.length(); along.normalize();
  const across = P('RightHandIndex1').sub(P('RightHandPinky1')); across.addScaledVector(along, -across.dot(along)).normalize();
  const palm = P('RightHandThumb1').sub(hand); palm.addScaledVector(along, -palm.dot(along)).addScaledVector(across, -palm.dot(across)).normalize();
  const grip = hand.clone().addScaledVector(along, len * .75).addScaledVector(palm, .028);
  const basis = new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(across, palm), across, palm);
  const lathiWorld = new THREE.Matrix4().compose(grip, new THREE.Quaternion().setFromRotationMatrix(basis), new THREE.Vector3(1, 1, 1));
  const lathiLocal = bones.RightHand.matrixWorld.clone().invert().multiply(lathiWorld);
  return templates[name] = {name, ...v, scene, clips: rig.clips, info: rig.info, height: box.max.y - box.min.y, floor: box.min.y, lathiLocal};
}

function nearest(hex, names, key) {
  const c = new THREE.Color(hex); let best = names[0], bd = Infinity;
  for (const n of names) {
    const d = new THREE.Color(VARIANTS[n][key]);
    const e = (c.r - d.r) ** 2 + (c.g - d.g) ** 2 + (c.b - d.b) ** 2;
    if (e < bd) { bd = e; best = n; }
  }
  return best;
}

/** Picks the outfit variant for a look (exported so callers can preview the choice). */
export function resolveVariant({color, police = false, gender, variant, kind, index} = {}) {
  if (typeof variant === 'string' && VARIANTS[variant]) return variant;
  if (variant === 'officer' || police || kind === 'police' || kind === 'constable') return 'constable';
  if (kind === 'raf') return 'raf';
  if (kind === 'party') return 'party-worker';
  if (kind === 'sena') return 'sena';
  if (variant === 'male' || variant === 'female') gender = variant;
  const pool = variantNames({gender, kind: 'civilian'});
  const i = typeof variant === 'number' ? variant : index;
  if (Number.isInteger(i)) return pool[((i % pool.length) + pool.length) % pool.length];
  if (gender && color) return nearest(color, pool, 'top');
  return pool[serial++ % pool.length];
}

function accessory(parent, bone, geometry, material, position, scale) {
  const o = new THREE.Mesh(geometry, material); o.position.set(...position); if (scale) o.scale.set(...scale);
  o.castShadow = true; parent.add(o); parent.updateMatrixWorld(true); if (bone) bone.attach(o); return o;
}
function roundedPack() { const w = .30, h = .39, r = .045, s = new THREE.Shape(); s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r); s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); s.lineTo(-w / 2 + r, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2); const g = new THREE.ExtrudeGeometry(s, {depth: .10, bevelEnabled: true, bevelThickness: .02, bevelSize: .018, bevelSegments: 3, steps: 1}); g.translate(0, 0, -.05); return g; }
const sharedMats = {};

/**
 * look: {variant: name|index, kind: 'civilian'|'party'|'sena'|'constable'|'raf', gender, index,
 *        police (=kind 'constable'), color (picks the closest outfit when gender is given),
 *        skin (hex tint), backpack, hat, lathi (bool, default RAF), shield (bool, default RAF), lod (0|1 forced)}
 * Legacy looks ({color, pants, gender, police, backpack, hat, variant:'male'|'female'|'officer'}) still work.
 */
export function makeCharacter(look = {}) {
  const {skin, backpack = false, hat = false, lod} = look;
  const name = resolveVariant(look), tpl = template(name), kind = tpl.kind;
  const root = new THREE.Group(), body = cloneRig(tpl.scene); root.add(body);
  body.position.y = -tpl.floor;
  const bones = {}, lods = [[], []];
  body.traverse(o => {
    if (o.isBone) bones[o.name.replace(/mixamorig:?/, '')] = o;
    if (o.isMesh) {
      lods[(o.userData.lod ?? o.parent?.userData?.lod ?? 0) ? 1 : 0].push(o);
      if (skin && /\.skin$/.test(o.material.name)) { o.material = o.material.clone(); o.material.color.set(skin); }
    }
  });
  const mixer = new THREE.AnimationMixer(body), actions = {}, phase = Math.random();
  for (const [clipName, clip] of Object.entries(tpl.clips)) {
    const a = mixer.clipAction(clip);
    if (ONE_SHOT.includes(clipName)) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; }
    a.setEffectiveWeight(clipName === 'Idle' ? 1 : 0).play(); a.time = phase * clip.duration;
    actions[clipName] = a;
  }
  // Props in the hands
  const phone = new THREE.Mesh(new THREE.BoxGeometry(.068, .13, .009), sharedMats.phone ??= new THREE.MeshStandardMaterial({color: '#152024', roughness: .32}));
  phone.visible = false; phone.castShadow = true;
  if (bones.RightHand) { bones.RightHand.add(phone); phone.position.set(0, .07, .022); } else root.add(phone);
  let baton = null, shield = null;
  const armed = look.lathi ?? (kind === 'raf' || kind === 'constable');
  if (armed && bones.RightHand) {
    baton = props.lathi ? props.lathi.clone(true) : new THREE.Mesh(new THREE.CylinderGeometry(.016, .02, 1.05, 10).translate(0, .4, 0), sharedMats.lathi ??= new THREE.MeshStandardMaterial({color: '#8a6a3c', roughness: .8}));
    baton.traverse(o => { if (o.isMesh) o.castShadow = true; });
    const gripNode = baton.getObjectByName?.('grip'), g = gripNode ? gripNode.position.clone() : new THREE.Vector3(0, .12, 0);
    tpl.lathiLocal.decompose(baton.position, baton.quaternion, baton.scale);
    baton.position.sub(g.clone().applyQuaternion(baton.quaternion));
    bones.RightHand.add(baton); baton.visible = kind === 'raf';
  }
  if ((look.shield ?? kind === 'raf') && props.shield) {
    // Carried in front of the left side; the left hand is IK-solved onto the grip each frame.
    shield = props.shield.clone(true); shield.traverse(o => { if (o.isMesh) o.castShadow = true; });
    const s = tpl.height / 1.75; shield.position.set(.2 * s, .5 * s, .36 * s); shield.rotation.y = -.28; root.add(shield);
  }
  const s = tpl.height / 1.80, head = bones.Head?.getWorldPosition(new THREE.Vector3()) ?? new THREE.Vector3(0, 1.6, 0);
  const khaki = sharedMats.khaki ??= new THREE.MeshStandardMaterial({color: '#8f7954', roughness: .85});
  if (hat && !/constable|raf|sena/.test(name)) {
    const y = tpl.height + .005, cap = sharedMats.cap ??= new THREE.MeshStandardMaterial({color: '#2c3440', roughness: .9});
    accessory(root, bones.Head, new THREE.SphereGeometry(.105, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), cap, [head.x, y - .085, head.z - .005], [1, .8, 1.1]);
    accessory(root, bones.Head, new THREE.CylinderGeometry(.09, .09, .008, 18, 1, false, -Math.PI / 2, Math.PI), cap, [head.x, y - .09, head.z + .07], [1, 1, .9]);
  }
  if (backpack) accessory(root, bones.Spine2, roundedPack(), sharedMats.pack ??= new THREE.MeshStandardMaterial({color: '#37494a', roughness: .92}), [0, 1.27 * s, -.17 * s]);
  // Bind-pose skinned bounds are expanded to cover raised arms, lying and seated poses.
  body.updateMatrixWorld(true);
  body.traverse(o => { if (!o.isSkinnedMesh) return; o.computeBoundingSphere(); if (o.boundingSphere) { o.boundingSphere.radius = Math.max(o.boundingSphere.radius * 1.65, o.boundingSphere.radius + 1.4); o.frustumCulled = true; } });
  for (const m of lods[1]) m.visible = lod === 1;
  for (const m of lods[0]) m.visible = lod !== 1;
  root.userData = {phone, baton, shield, body, baseY: body.position.y, head: bones.Head, bones, mixer, actions, lastTime: null, phase: Math.random() * 6,
    kind: kind === 'constable' ? 'officer' : kind, variant: name, gender: tpl.gender, height: tpl.height, info: tpl.info, lods, lod: lod ?? 0, forcedLod: lod,
    animation: 'Idle', gaitPhase: phase, oneShot: null, isSkinnedHuman: true};
  return root;
}

/** Plays a clip once (Shoved, Duck, Jump; or any clip for one cycle), then returns to automatic selection. */
export function playOnce(root, name) {
  const d = root.userData; if (!d?.actions?.[name]) return 0;
  const dur = d.actions[name].getClip().duration;
  d.oneShot = {name, left: dur}; d.actions[name].reset().play(); if (!ONE_SHOT.includes(name)) d.actions[name].time = 0;
  return dur;
}

// Solve in world space: these GLBs use +Y down each limb, with rotated shoulder frames.
function reachArm(root, side, handTarget, poleTarget, world = false) { return reachLimb(root, side + 'Arm', side + 'ForeArm', side + 'Hand', handTarget, poleTarget, world); }
function reachLimb(root, upperName, lowerName, endName, handTarget, poleTarget, world = false) {
  const d = root.userData, b = d.bones, upper = b[upperName], lower = b[lowerName], hand = b[endName]; if (!upper || !lower || !hand) return;
  root.updateMatrixWorld(true);
  const shoulder = upper.getWorldPosition(new THREE.Vector3()), elbow = lower.getWorldPosition(new THREE.Vector3()), wrist = hand.getWorldPosition(new THREE.Vector3());
  const target = world ? handTarget.clone() : root.localToWorld(new THREE.Vector3(...handTarget)), pole = root.localToWorld(new THREE.Vector3(...poleTarget));
  const a = shoulder.distanceTo(elbow), c = elbow.distanceTo(wrist), axis = target.clone().sub(shoulder), length = THREE.MathUtils.clamp(axis.length(), Math.abs(a - c) + .001, a + c - .002); axis.normalize();
  const along = (a * a - c * c + length * length) / (2 * length), height = Math.sqrt(Math.max(0, a * a - along * along));
  const bend = pole.sub(shoulder); bend.addScaledVector(axis, -bend.dot(axis)).normalize();
  const desiredElbow = shoulder.clone().addScaledVector(axis, along).addScaledVector(bend, height), desiredWrist = shoulder.clone().addScaledVector(axis, length);
  const upperBase = upper.quaternion.clone(), lowerBase = lower.quaternion.clone();
  function aim(bone, child, destination) {
    const origin = bone.getWorldPosition(new THREE.Vector3()), from = child.getWorldPosition(new THREE.Vector3()).sub(origin).normalize(), to = destination.clone().sub(origin).normalize();
    const w = bone.getWorldQuaternion(new THREE.Quaternion()).premultiply(new THREE.Quaternion().setFromUnitVectors(from, to));
    bone.quaternion.copy(bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(w)); bone.updateMatrixWorld(true);
  }
  aim(upper, lower, desiredElbow); aim(lower, hand, desiredWrist);
  d.poseOffsets[upperName].target.copy(upperBase).invert().multiply(upper.quaternion).normalize();
  d.poseOffsets[lowerName].target.copy(lowerBase).invert().multiply(lower.quaternion).normalize();
  upper.quaternion.copy(upperBase); lower.quaternion.copy(lowerBase); root.updateMatrixWorld(true);
}
// Item geometry origins are intentionally below their visible centres.
export const CARRY_POSES = Object.freeze({
  water: {position: [0, .97, .38], hands: [[.35, 1.18, .38], [-.35, 1.18, .38]]},
  speaker: {position: [0, .59, .36], hands: [[.395, 1.18, .36], [-.395, 1.18, .36]]},
  phone: {position: [-.18, 1.17, .38], hands: [null, [-.18, 1.27, .38]]},
  key: {position: [-.18, .94, .40], hands: [null, [-.18, 1.14, .40]]},
});
function aimChild(root, bone, child, direction) { if (!bone || !child) return; root.updateMatrixWorld(true); const from = child.getWorldPosition(new THREE.Vector3()).sub(bone.getWorldPosition(new THREE.Vector3())).normalize(), to = new THREE.Vector3(...direction).transformDirection(root.matrixWorld); const world = bone.getWorldQuaternion(new THREE.Quaternion()).premultiply(new THREE.Quaternion().setFromUnitVectors(from, to)); bone.quaternion.copy(bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(world)); root.updateMatrixWorld(true); }
// Close a hand around a held prop (MPFB finger bones bend about their local X).
function curlFingers(d, side, amount, thumb) {
  for (const finger of ['Index', 'Middle', 'Ring', 'Pinky', 'Thumb']) for (let j = 1; j <= 3; j++) {
    const bone = d.bones[side + 'Hand' + finger + j]; if (!bone) continue;
    bone.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), (finger === 'Thumb' ? thumb : amount) * (j === 1 ? .8 : 1))); bone.updateMatrixWorld(true);
  }
}
const smooth = (x, a, b) => THREE.MathUtils.smoothstep(x, a, b);

/**
 * opts: {action: clip name to force (e.g. 'Chant','Film','Dance','Sit','Lie','Duck','Push','Lathi','Wave','Talk'),
 *        carry, pose (→ Chant fist pump), airborne, vy, turn, talking (→ Talk), seated (chair IK), distance, visible,
 *        important, gesture (legacy strings: lathi-charge→Lathi, push→Push, phone/record→Film, wave→Wave, ...)}
 * speed is ground speed in m/s; Walk/Run play at speed / natural speed so feet do not slide.
 */
export function animateCharacter(root, speed, t, {action = '', carry = false, pose = false, airborne = false, vy = 0, turn = 0, talking = false, seated = false, distance = 0, visible = true, important = false, gesture = ''} = {}) {
  const d = root.userData; if (!d?.mixer) return;
  const elapsed = d.lastTime === null ? 1 / 60 : Math.max(0, t - d.lastTime);
  if (d.lastTime !== null && elapsed < animationInterval(distance, visible, important) && d.wasSeated === seated && d.lastGesture === gesture && d.wasCarry === carry && d.lastAction === action) return;
  const dt = Math.min(.25, elapsed); d.lastTime = t; d.wasSeated = seated; d.wasCarry = carry; d.lastGesture = gesture; d.lastAction = action;
  if (d.forcedLod === undefined) { const level = distance > LOD_DISTANCE && !important ? 1 : 0; if (level !== d.lod) { d.lod = level; for (const m of d.lods[0]) m.visible = !level; for (const m of d.lods[1]) m.visible = !!level; } }

  const g = gesture || '', phoneGesture = GESTURE.phone.test(g), charge = GESTURE.charge.test(g), push = GESTURE.push.test(g), wave = GESTURE.wave.test(g);
  const moving = speed > .12, loco = moving ? 'Loco' : null;
  if (d.oneShot) { d.oneShot.left -= dt; if (d.oneShot.left <= 0) d.oneShot = null; }
  let target;
  if (d.oneShot) target = d.oneShot.name;
  else if (action && d.actions[action]) target = action;
  else if (seated) target = 'Idle';
  else if (airborne) target = 'Jump';
  else if (charge) target = loco ?? 'Lathi';
  else if (push) target = speed > .5 ? 'Loco' : 'Push';
  else if (phoneGesture) target = loco ?? 'Film';
  else if (wave) target = loco ?? 'Wave';
  else if (moving) target = 'Loco';
  else if (pose) target = 'Chant';
  else if (talking && !g) target = 'Talk';
  else target = 'Idle';
  if (ONE_SHOT.includes(target) && d.animation !== target && !d.oneShot && target !== 'Jump') { d.actions[target].reset().play(); }
  // Walk and Run both start on the left foot's forward reach, so one normalised gait phase drives both.
  const info = d.info, walk = d.actions.Walk.getClip().duration, run = d.actions.Run.getClip().duration;
  const wRun = smooth(speed, 1.7, 2.5), stride = THREE.MathUtils.lerp((info.Walk?.speed || 1.27) * walk, (info.Run?.speed || 3.1) * run, wRun);
  if (moving) d.gaitPhase = (d.gaitPhase + dt * speed / stride) % 1;
  const weights = target === 'Loco' ? {Walk: 1 - wRun, Run: wRun} : {[target]: 1};
  for (const [name, a] of (d.actionEntries ??= Object.entries(d.actions))) {
    a.setEffectiveWeight(THREE.MathUtils.damp(a.getEffectiveWeight(), weights[name] ?? 0, 10, dt));
    if (LOCO.includes(name)) { a.time = d.gaitPhase * a.getClip().duration; a.setEffectiveTimeScale(0); }
    else if (name === 'Idle' && carry && target === 'Idle') { a.time = 0; a.setEffectiveTimeScale(0); }  // steady stance so both hands stay on the load
    else if (name === 'Jump' && target === 'Jump' && airborne) { a.time = vy > 0 ? .85 + (1 - THREE.MathUtils.clamp(vy / 4, 0, 1)) * .25 : 1.1 + THREE.MathUtils.clamp(-vy / 4, 0, 1) * .25; a.setEffectiveTimeScale(0); }
    else a.setEffectiveTimeScale(1);
  }

  // Mixer bindings can skip unchanged values and clips omit still bones. Restore the
  // last authored pose before evaluation so procedural poses never feed back.
  const layers = d.poseLayers ??= Object.entries(d.bones).map(([key, bone]) => ({key, bone, base: bone.quaternion.clone(), offset: new THREE.Quaternion(), target: new THREE.Quaternion(), rotation: new THREE.Euler()}));
  for (const layer of layers) layer.bone.quaternion.copy(layer.base);
  d.mixer.update(dt);
  for (const layer of layers) layer.base.copy(layer.bone.quaternion);
  d.animation = target === 'Loco' ? (wRun > .5 ? 'Run' : 'Walk') : target;
  const offsets = d.poseOffsets ??= Object.fromEntries(layers.map(layer => [layer.key, layer]));
  for (const layer of layers) layer.rotation.set(0, 0, 0);
  d.body.position.y = d.baseY; root.updateMatrixWorld(true);
  if (seated) { const hip = root.worldToLocal(d.bones.LeftUpLeg.getWorldPosition(new THREE.Vector3()).add(d.bones.RightUpLeg.getWorldPosition(new THREE.Vector3())).multiplyScalar(.5)); d.body.position.y += .52 - hip.y; root.updateMatrixWorld(true); }

  // Small procedural layers on top of the clip (only where no clip expresses the gesture).
  const b = offsets, ra = b.RightArm, la = b.LeftArm, rf = b.RightForeArm, lf = b.LeftForeArm, head = b.Head, sp = b.Spine2, beat = Math.sin(t * 3 + d.phase);
  const clipDriven = ['Lathi', 'Push', 'Film', 'Wave', 'Chant', 'Dance', 'Sit', 'Lie', 'Duck', 'Shoved', 'Jump'].includes(target);
  if (talking && head && target !== 'Talk') head.rotation.x += Math.sin(t * 3 + d.phase) * .035;
  if (sp) sp.rotation.z += THREE.MathUtils.clamp(turn, -1, 1) * .07;
  d.phone.visible = phoneGesture || target === 'Film';
  if (d.baton) d.baton.visible = d.kind === 'raf' || charge || target === 'Lathi';
  if (!clipDriven) {
    if (phoneGesture) { if (head) head.rotation.x += GESTURE.offer.test(g) ? -.04 : .18; }
    else if (GESTURE.shrug.test(g)) { if (ra) ra.rotation.z -= .35; if (la) la.rotation.z += .35; if (rf) rf.rotation.x -= .7; if (lf) lf.rotation.x -= .7; if (head) head.rotation.z += .07; }
    else if (GESTURE.point.test(g)) { if (head) head.rotation.y -= .12; }
    else if (GESTURE.laugh.test(g)) { if (sp) sp.rotation.x += .045 + .025 * beat; if (head) head.rotation.x -= .06 + .025 * beat; if (ra) ra.rotation.x -= .18; }
    else if (GESTURE.count.test(g)) { if (la) la.rotation.x -= .45; if (lf) lf.rotation.x -= 1.0; if (ra) ra.rotation.x -= .35; if (rf) rf.rotation.x -= .7; if (head) head.rotation.x += .16; }
    else if (GESTURE.listen.test(g)) { if (head) { head.rotation.x += .035 * Math.sin(t * 2.2); head.rotation.y += .045 * Math.sin(t * .8 + d.phase); } }
    else if (GESTURE.mic.test(g)) { if (ra) ra.rotation.x -= .45; if (rf) rf.rotation.x -= 1.35; if (head) head.rotation.x -= .03; }
    else if (GESTURE.rest.test(g)) { if (sp) sp.rotation.x += .06; if (head) head.rotation.x += .1; }
  }
  for (const layer of layers) layer.target.setFromEuler(layer.rotation);
  const H = d.height / 1.80;   // IK targets were authored for a 1.80 m body
  if (!clipDriven) {
    if (charge) { const swing = (1 + Math.sin(t * 5 + d.phase)) * .5; reachArm(root, 'Right', [-.32, (1.49 + swing * .13) * H, .20 + swing * .16], [-.48, 1.29 * H, .10]); if (!d.shield) reachArm(root, 'Left', [.25, 1.25 * H, .28], [.43, 1.10 * H, .08]); }
    else if (push) for (const [side, sign] of [['Right', -1], ['Left', 1]]) reachArm(root, side, [sign * .22, 1.38 * H, .46], [sign * .38, 1.07 * H, .20]);
    else if (phoneGesture) reachArm(root, 'Right', [-.16, 1.40 * H, .34], [-.42, 1.12 * H, .18]);
    else if (GESTURE.shrug.test(g)) for (const [side, sign] of [['Right', -1], ['Left', 1]]) reachArm(root, side, [sign * .43 * H, 1.39 * H, .28 * H], [sign * .51, 1.12 * H, .08]);
    else if (GESTURE.point.test(g)) reachArm(root, 'Right', [-.20 * H, 1.38 * H, .40 * H], [-.40, 1.18 * H, .21]);
    else if (wave) reachArm(root, 'Right', [-.40, 1.69 * H, .13 + .035 * beat], [-.52, 1.43 * H, .07]);
  }
  if (seated) { for (const [side, sign] of [['Left', 1], ['Right', -1]]) { reachLimb(root, side + 'UpLeg', side + 'Leg', side + 'Foot', [sign * .16, .11, .43], [sign * .16, .51, .65]); if (!gesture && !carry) reachArm(root, side, [sign * .19, .68, .29], [sign * .30, .79, .10]); } }
  const carryPose = carry ? CARRY_POSES[typeof carry === 'string' ? carry : 'water'] : null;
  d.carryTime = carryPose ? (d.carryTime ?? 0) + dt : 0; d.carrySettled = d.carryTime > .4;
  // IK arm gestures blend in, then track the moving clip exactly (no lag behind idle sway)
  d.gestureTime = g && !clipDriven ? (d.gestureTime ?? 0) + dt : 0; d.gestureSettled = d.gestureTime > .5;
  if (carryPose) for (const [index, side, sign] of [[0, 'Left', 1], [1, 'Right', -1]]) if (carryPose.hands[index]) reachArm(root, side, carryPose.hands[index], [sign * .42, 1.03, .12]);
  const shieldGrip = d.shield && !(carryPose?.hands[0]) && target !== 'Lie' && target !== 'Sit' ? d.shield.getObjectByName('grip') : null;
  if (shieldGrip) reachArm(root, 'Left', shieldGrip.getWorldPosition(new THREE.Vector3()), [.5, .95 * H, -.05], true);
  const blend = 1 - Math.exp(-10 * dt);
  for (const layer of layers) {
    layer.offset.slerp(layer.target, (seated && /UpLeg|^LeftLeg$|^RightLeg$/.test(layer.key)) || (shieldGrip && /^Left(Fore)?Arm$/.test(layer.key)) || ((carryPose ? d.carrySettled : d.gestureSettled) && /(Fore)?Arm$/.test(layer.key)) ? 1 : blend);
    layer.bone.quaternion.multiply(layer.offset).normalize();
  }
  if (seated) for (const side of ['Left', 'Right']) aimChild(root, d.bones[side + 'Foot'], d.bones[side + 'ToeBase'], [0, -.035, .15]);
  if (d.baton?.visible) curlFingers(d, 'Right', 1.25, .55);
  if (shieldGrip) curlFingers(d, 'Left', 1.1, .5);
  if (carryPose) for (const [index, side] of [[0, 'Left'], [1, 'Right']]) if (carryPose.hands[index]) { aimChild(root, d.bones[side + 'Hand'], d.bones[side + 'HandMiddle1'], [0, -.12, 1]); for (const finger of ['Index', 'Middle', 'Ring', 'Pinky']) for (let j = 1; j <= 3; j++) { const bone = d.bones[side + 'Hand' + finger + j]; if (!bone) continue; const axis = new THREE.Vector3(1, 0, 0).transformDirection(root.matrixWorld).applyQuaternion(bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert()); bone.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(axis, j === 1 ? .22 : .48)); bone.updateMatrixWorld(true); } }
}
