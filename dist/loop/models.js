import * as THREE from 'three';
import {GLTFLoader} from '../vendor/GLTFLoader.js?v=27';
import {MeshoptDecoder} from '../vendor/meshopt_decoder.module.js?v=27';

/*
 * Vehicles and protest props (assets/props/*.glb, built by assets-src/props/build_props.py).
 * loadModels() resolves to clone templates; call template.clone(true) per use.
 *
 * Named nodes for runtime hookup (all Y-up metres, front faces +Z, origin on the ground):
 *   vajra:  'turret' (yaw about Y) > 'nozzle' (pitch about X) > 'nozzleTip' (spray origin)
 *   suv:    'flagMount' (bonnet flag socket)        bike: 'flagMount', 'seat'
 *   shield: 'grip' (left-hand handle)               lathi: 'grip' (12 cm from the butt; stick along +Y)
 *   canister: 'smoke' (vent)                        flags.*: 'grip' (hand height on the pole)
 *   flags.students: 'placard0'..'placard7' (one hand-lettered placard each; see placard(i))
 *   bus: the DTC bus as the detention bus, with see-through glass, a floor, benches and
 *        userData.seats = [{position, yaw}] (bus-local seat points for seated characters).
 */
const FILES = {vajra: 'vajra', suv: 'suv', bike: 'bike', shield: 'shield', lathi: 'lathi', helmet: 'helmet', canister: 'canister',
  party: 'flag-party', sena: 'flag-sena', opp: 'flag-opp', students: 'placards'};
let pending;

export function loadModels(onProgress = () => {}) {
  if (pending) return pending;
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const base = new URL('../assets/', import.meta.url).href;
  const get = async (key, path) => {
    const g = await loader.loadAsync(base + path);
    g.scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    g.scene.name = key; onProgress(key); return [key, g.scene];
  };
  return pending = Promise.all([
    ...Object.entries(FILES).map(([key, file]) => get(key, `props/${file}.glb`)),
    get('busShell', 'delhi-bus.glb').catch(() => ['busShell', null]),
  ]).then(entries => {
    const m = Object.fromEntries(entries);
    return {vajra: m.vajra, suv: m.suv, bike: m.bike, shield: m.shield, lathi: m.lathi, helmet: m.helmet, canister: m.canister,
      flags: {party: m.party, sena: m.sena, opp: m.opp, students: m.students},
      bus: m.busShell ? detentionBus(m.busShell) : null};
  });
}

/** One placard on its stick (index 0..7) from the students' set, re-centred on its own origin. */
export function placard(students, i) {
  const node = students.getObjectByName('placard' + (((i % 8) + 8) % 8));
  const p = node.clone(true); p.position.set(0, 0, 0); return p;
}

/** Aim the Vajra cannon: yaw (rad, about Y) and pitch (rad, positive = up). Returns the nozzle tip world position. */
export function aimVajra(vajra, yaw, pitch, out = new THREE.Vector3()) {
  const turret = vajra.getObjectByName('turret'), nozzle = vajra.getObjectByName('nozzle'), tip = vajra.getObjectByName('nozzleTip');
  if (turret) turret.rotation.y = yaw;
  if (nozzle) nozzle.rotation.x = -pitch;
  vajra.updateMatrixWorld(true);
  return tip ? tip.getWorldPosition(out) : out;
}

// The existing DTC bus (Delhi Police commandeer DTC buses for detentions) with an interior.
function detentionBus(shell) {
  const bus = new THREE.Group(); bus.name = 'detention-bus';
  const body = shell.clone(true); bus.add(body);
  body.traverse(o => {
    if (o.isMesh && /glass/i.test(o.material.name)) {
      o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = .38; o.material.depthWrite = false; o.castShadow = false;
    }
  });
  body.updateMatrixWorld(true);
  // Size the cabin from the side windows (the overall box includes mirrors and bumpers).
  const box = new THREE.Box3().setFromObject(body, true), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  const glass = new THREE.Box3(); body.traverse(o => { if (o.isMesh && /glass/i.test(o.material.name)) glass.expandByObject(o, true); });
  const alongX = size.x > size.z, side = glass.isEmpty() ? (alongX ? size.z : size.x) - .5 : (alongX ? glass.max.z - glass.min.z : glass.max.x - glass.min.x);
  const L = Math.max(size.x, size.z) - 1.2, W = side - .16;
  const inner = new THREE.Group(); inner.position.set(c.x, box.min.y, c.z); if (alongX) inner.rotation.y = Math.PI / 2; bus.add(inner);
  const floorY = glass.isEmpty() ? Math.min(.95, size.y * .28) : Math.max(.45, glass.min.y - box.min.y - .8);
  const mat = (color, roughness = .8, metalness = 0) => new THREE.MeshStandardMaterial({color, roughness, metalness});
  const floor = new THREE.Mesh(new THREE.BoxGeometry(W, .04, L), mat('#3a3d3c', .95)); floor.position.y = floorY; floor.receiveShadow = true; inner.add(floor);
  const seatMat = mat('#7a2b22', .6), steel = mat('#9aa3a6', .35, .7), seats = [];
  const rows = Math.max(4, Math.floor((L - 2.4) / .8));
  for (let r = 0; r < rows; r++) for (const sx of [-1, 1]) {
    const z = -L / 2 + 1.9 + r * .8, x = sx * (W / 2 - .42);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(.78, .09, .44), seatMat); seat.position.set(x, floorY + .45, z); seat.castShadow = true; inner.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(.78, .5, .06), seatMat); back.position.set(x, floorY + .74, z - .22); back.rotation.x = -.12; inner.add(back);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, .45, 6), steel); leg.position.set(x, floorY + .22, z); inner.add(leg);
    for (const dx of [-.19, .19]) seats.push(new THREE.Vector3(x + dx, floorY + .02, z + .05));
  }
  for (const sx of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, L - 1, 8), steel); rail.rotation.x = Math.PI / 2; rail.position.set(sx * (W / 2 - .7), Math.min(size.y - .25, floorY + 1.85), 0); inner.add(rail);
  }
  // window grilles: thin vertical bars just inside the glass line
  const bars = new THREE.InstancedMesh(new THREE.CylinderGeometry(.008, .008, .55, 4), steel, Math.floor(L / .12) * 2);
  let k = 0; const mtx = new THREE.Matrix4();
  for (const sx of [-1, 1]) for (let z = -L / 2 + .6; z < L / 2 - .3 && k < bars.count; z += .12) bars.setMatrixAt(k++, mtx.makeTranslation(sx * (W / 2 + .02), floorY + 1.2, z));
  bars.count = k; inner.add(bars);
  bus.updateMatrixWorld(true);
  // seat points: where a seated character's root goes (animateCharacter seated:true puts the hips .52 above it)
  bus.userData.seats = seats.map(p => ({position: inner.localToWorld(p.clone()), yaw: inner.rotation.y})); bus.userData.floorY = floorY;
  return bus;
}
