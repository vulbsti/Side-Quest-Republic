// Set-piece visuals: barricade lines, the Vajra water cannon, tear gas, the party SUV, sena bikes,
// the ambulance, plastic chairs, group flags and police kit. Procedural Three.js until the glTF
// models arrive; every vehicle and prop is built through make(name), so setModel(name, object3d)
// swaps a real model in everywhere at once.
// No per-frame allocation in the update paths: all vectors and particle buffers are preallocated.
import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);
const v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), v3 = new THREE.Vector3();
const m4 = new THREE.Matrix4(), q1 = new THREE.Quaternion();

const matCache = {};
function mat(color, rough = 0.75, extra = {}) {
  const k = color + rough + JSON.stringify(extra);
  return (matCache[k] ??= new THREE.MeshStandardMaterial({ color, roughness: rough, ...extra }));
}
function box(w, h, d, color, x, y, z, parent, rough) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof color === 'string' ? mat(color, rough) : color);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
function cyl(rt, rb, h, color, x, y, z, parent, n = 12) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, n), typeof color === 'string' ? mat(color) : color);
  m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m;
}
function canvasTex(w, h, draw, transparent = false) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); if (!transparent) { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); }
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function softDot() {
  return canvasTex(64, 64, (g) => {
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.45, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  }, true);
}

// --- group colours (spec: fictional stand-ins that read as real) ---------------------------

export const GROUP_LOOK = {
  students: { shirt: ['#e3c449', '#5f86a8', '#c26b4f', '#7f9c6a', '#a378a6', '#e08fb0', '#3e5c58', '#d9b75c'], label: 'Students' },
  party: { shirt: ['#f2efe6', '#efe9da', '#f7f4ea'], label: 'Rashtriya Uday Party' }, // white kurtas
  sena: { shirt: ['#e8892b', '#d9731f', '#c9a27a', '#e09a45'], label: 'Dharma Raksha Sena' }, // saffron
  opp: { shirt: ['#f4f4f0', '#3c7fc2', '#e8eef2'], label: 'Lok Jan Morcha' }, // white and blue
};

const FLAGS = {};
/** A flag material per group, drawn once. */
export function flagMaterial(kind) {
  if (FLAGS[kind]) return FLAGS[kind];
  let tex;
  if (kind === 'party') tex = canvasTex(256, 160, (g, w, h) => {
    g.fillStyle = '#f28c28'; g.fillRect(0, 0, w, h / 2); g.fillStyle = '#1f8a4c'; g.fillRect(0, h / 2, w, h / 2);
    // the marigold: a ring of petals round a deep orange heart
    for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; g.fillStyle = i % 2 ? '#ffc21a' : '#ffab0f'; g.beginPath(); g.ellipse(w / 2 + Math.cos(a) * 22, h / 2 + Math.sin(a) * 22, 15, 9, a, 0, 7); g.fill(); }
    g.fillStyle = '#e0560f'; g.beginPath(); g.arc(w / 2, h / 2, 16, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.font = 'bold 22px sans-serif'; g.fillText('RUP', 10, 26);
  });
  else if (kind === 'sena') tex = canvasTex(256, 160, (g, w, h) => {
    g.fillStyle = '#ef7d16'; g.beginPath(); g.moveTo(0, 0); g.lineTo(w, h * 0.32); g.lineTo(w * 0.62, h * 0.5); g.lineTo(w, h * 0.68); g.lineTo(0, h); g.closePath(); g.fill();
    g.strokeStyle = '#ffd36b'; g.lineWidth = 5; g.beginPath(); g.arc(70, h / 2, 26, 0, 7); g.stroke();
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.beginPath(); g.moveTo(70 + Math.cos(a) * 30, h / 2 + Math.sin(a) * 30); g.lineTo(70 + Math.cos(a) * 42, h / 2 + Math.sin(a) * 42); g.stroke(); }
    g.fillStyle = '#fff3d6'; g.font = 'bold 20px sans-serif'; g.fillText('DRS', 110, h / 2 + 7);
  }, true);
  else if (kind === 'opp') tex = canvasTex(256, 160, (g, w, h) => {
    g.fillStyle = '#2f6fbe'; g.fillRect(0, 0, w, h / 3); g.fillStyle = '#ffffff'; g.fillRect(0, h / 3, w, h / 3); g.fillStyle = '#2e9a55'; g.fillRect(0, (2 * h) / 3, w, h / 3);
    // the ceiling fan
    g.fillStyle = '#26466e';
    for (let i = 0; i < 3; i++) { g.save(); g.translate(w / 2, h / 2); g.rotate((i / 3) * Math.PI * 2 + 0.3); g.beginPath(); g.ellipse(0, -20, 7, 19, 0, 0, 7); g.fill(); g.restore(); }
    g.beginPath(); g.arc(w / 2, h / 2, 7, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.font = 'bold 20px sans-serif'; g.fillText('LJM', 10, 24);
  });
  else tex = canvasTex(256, 160, (g, w, h) => { g.fillStyle = '#1e2a33'; g.fillRect(0, 0, w, h); g.fillStyle = '#e5ff86'; g.font = 'bold 34px sans-serif'; g.fillText('#JANTAR', 26, h / 2 + 12); });
  return (FLAGS[kind] = new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.9, transparent: kind === 'sena', alphaTest: kind === 'sena' ? 0.4 : 0 }));
}
const PLACARDS = ['MUMMY THINKS I\'M AT TUITION', 'EXAM DO, DRAMA NAHI', 'PAPER LEAK? HUMARA FUTURE LEAK', 'HUM PADHENGE TUM SUNOGE', 'RE-EXAM NOW', 'NOT A BOT, JUST TIRED', 'MERA BHI DEMAND HAI', 'NO VIBES WITHOUT JOBS'];
const placardMats = [];
function placardMaterial(i) {
  return (placardMats[i % PLACARDS.length] ??= new THREE.MeshStandardMaterial({
    side: THREE.DoubleSide, roughness: 0.95,
    map: canvasTex(256, 160, (g, w, h) => {
      g.fillStyle = ['#fffdf3', '#ffe9a8', '#e8ffd0', '#ffd6e2'][i % 4]; g.fillRect(0, 0, w, h);
      g.fillStyle = '#1c2a24'; g.textAlign = 'center'; g.font = 'bold 30px "Comic Sans MS", sans-serif';
      const words = PLACARDS[i % PLACARDS.length].split(' '); let line = '', y = 50; const lines = [];
      for (const word of words) { if ((line + ' ' + word).length > 12) { lines.push(line); line = word; } else line = line ? line + ' ' + word : word; }
      lines.push(line); y = h / 2 - (lines.length - 1) * 17 + 10;
      for (const l of lines) { g.fillText(l, w / 2, y); y += 34; }
    }),
  }));
}

// --- body kit: things people carry and wear --------------------------------------------

function attachToBone(root, boneName, obj, pos, rot) {
  root.add(obj); obj.position.set(...pos); if (rot) obj.rotation.set(...rot);
  const bone = root.userData?.bones?.[boneName];
  if (bone) { root.updateMatrixWorld(true); bone.attach(obj); }
  return obj;
}
const poleGeo = new THREE.CylinderGeometry(0.018, 0.018, 1.9, 6);
const flagGeo = new THREE.PlaneGeometry(0.72, 0.45);
flagGeo.translate(0.36, 0, 0);
const placardGeo = new THREE.PlaneGeometry(0.62, 0.4);
/** A flag on a pole, held at the one-handed carry point (use carry:'key' when animating). */
export function makeHeldFlag(kind) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(poleGeo, mat('#c9b48a')); pole.position.y = 0.55; g.add(pole);
  const flag = new THREE.Mesh(flagGeo, flagMaterial(kind)); flag.position.set(0.01, 1.28, 0); flag.castShadow = true; g.add(flag);
  g.userData.flag = flag;
  g.position.set(-0.18, 1.14, 0.4);
  return g;
}
export function makeHeldPlacard(i) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(poleGeo, mat('#b89a6a')); pole.scale.y = 0.6; pole.position.y = 0.35; g.add(pole);
  const card = new THREE.Mesh(placardGeo, placardMaterial(i)); card.position.set(0, 1.05, 0.02); card.castShadow = true; g.add(card);
  g.position.set(-0.18, 1.14, 0.4);
  return g;
}
/** Animate a held flag in the breeze (cheap: one rotation). */
export function waveFlag(g, t, phase = 0) { if (g.userData.flag) g.userData.flag.rotation.y = Math.sin(t * 2.3 + phase) * 0.35 - 0.2; }

/** Retint a character's clothing after creation (characters.js tints in a shader hook). */
export function makeTintable(model, color) {
  const colour = new THREE.Color(color);
  model.traverse((o) => {
    if (!o.isMesh || !o.material) return;
    const m = o.material;
    if (!(m.name || '').toLowerCase().includes('civilianclothing')) return;
    const orig = m.onBeforeCompile;
    m.onBeforeCompile = (shader, r) => { orig.call(m, shader, r); if (shader.uniforms.garmentTint) shader.uniforms.garmentTint.value = colour; };
    m.needsUpdate = true;
  });
  model.userData.tint = colour;
  return colour;
}

const camoTex = () => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#5b78a8'; g.fillRect(0, 0, w, h);
  const cols = ['#3d5684', '#7f9bc6', '#2c3e63', '#91a6c8'];
  for (let i = 0; i < 90; i++) { g.fillStyle = cols[i % 4]; g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 6 + Math.random() * 18, 4 + Math.random() * 10, Math.random() * 3, 0, 7); g.fill(); }
});
let CAMO;
const helmetGeo = new THREE.SphereGeometry(0.15, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.55);
const visorGeo = new THREE.PlaneGeometry(0.26, 0.13);
const shieldGeo = new THREE.BoxGeometry(0.56, 0.95, 0.02);
let shieldMat;
function shieldMaterial() {
  return (shieldMat ??= new THREE.MeshStandardMaterial({
    map: canvasTex(128, 220, (g, w, h) => {
      g.fillStyle = 'rgba(205,225,235,0.55)'; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(40,50,60,.9)'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
      g.fillStyle = 'rgba(25,30,40,.9)'; g.font = 'bold 26px sans-serif'; g.textAlign = 'center'; g.fillText('POLICE', w / 2, 70);
    }, true),
    transparent: true, roughness: 0.15, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide,
  }));
}
/** RAF kit: blue camouflage, helmet with visor, polycarbonate shield, lathi. */
export function equipRAF(model) {
  CAMO ??= camoTex();
  model.traverse((o) => {
    if (!o.isMesh || !o.material) return;
    const n = (o.material.name || '').toLowerCase();
    if (/body|eye|brow|lash|teeth|tongue|hair|short|ponytail/.test(n)) return;
    if (n.includes('shoe')) { o.material.color.set('#1d2128'); return; }
    o.material.map = CAMO; o.material.color.set('#ffffff'); o.material.needsUpdate = true;
  });
  const head = new THREE.Group();
  const helmet = new THREE.Mesh(helmetGeo, mat('#24324f', 0.4)); helmet.castShadow = true; head.add(helmet);
  const visor = new THREE.Mesh(visorGeo, mat('#9fb6c8', 0.1, { transparent: true, opacity: 0.45 })); visor.position.set(0, -0.05, 0.14); visor.rotation.x = -0.2; head.add(visor);
  attachToBone(model, 'Head', head, [0, 1.79, 0.01]);
  const shield = new THREE.Mesh(shieldGeo, shieldMaterial()); shield.renderOrder = 2;
  model.add(shield);
  model.userData.shield = shield;
  if (model.userData.baton) model.userData.baton.visible = true;
  setShield(model, 'carry');
  return model;
}
/** Shield posture: 'carry' at the side, 'up' raised in front (a line), 'none'. */
export function setShield(model, posture) {
  const s = model.userData.shield; if (!s) return;
  if (model.userData.shieldPosture === posture) return;
  model.userData.shieldPosture = posture;
  s.visible = posture !== 'none';
  if (posture === 'up') { s.position.set(0.05, 1.12, 0.42); s.rotation.set(0, 0, 0); }
  else { s.position.set(0.36, 0.62, 0.05); s.rotation.set(0.05, Math.PI / 2, 0.08); }
}
/** Constables can be given a cane shield too, from the tense phase on. */
export function equipConstableShield(model) {
  const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.03, 18), mat('#8a6a3c', 0.9));
  shield.rotation.x = Math.PI / 2; const g = new THREE.Group(); g.add(shield); model.add(g);
  model.userData.shield = g; setShield(model, 'none');
}
const scarfGeo = new THREE.TorusGeometry(0.12, 0.04, 6, 14);
/** The saffron scarf and tilak-coloured headband of the sena. */
export function makeScarf() { const m = new THREE.Mesh(scarfGeo, mat('#ef7d16', 0.9)); m.rotation.x = Math.PI / 2; return m; }
export function equipScarf(model) { return attachToBone(model, 'Neck', makeScarf(), [0, 1.55, 0.01], [Math.PI / 2, 0, 0]); }
const capGeo = new THREE.CylinderGeometry(0.105, 0.115, 0.07, 14);
export function equipCap(model, color) { const m = new THREE.Mesh(capGeo, mat(color, 0.9)); return attachToBone(model, 'Head', m, [0, 1.79, 0]); }
/**
 * The provocateur's tell, subtle by design: box-fresh white shoes, a curly earpiece wire and a
 * bike helmet poking out of a bag. You notice if you look; the crowd doesn't.
 */
export function equipProvocateur(model) {
  const kit = [];
  const ear = new THREE.Group();
  const bud = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), mat('#e9e9e2', 0.3)); ear.add(bud);
  const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.22, 5), mat('#f0f0ea', 0.4)); wire.position.set(0, -0.12, -0.02); wire.rotation.x = 0.25; ear.add(wire);
  kit.push(attachToBone(model, 'Head', ear, [0.12, 1.66, 0.0]));
  const bag = new THREE.Group();
  box(0.3, 0.36, 0.16, '#1f2326', 0, 0, 0, bag, 0.9);
  const helmet = new THREE.Mesh(helmetGeo, mat('#c8c4ba', 0.35)); helmet.scale.setScalar(1.3); helmet.position.set(0.02, 0.17, 0); bag.add(helmet);
  kit.push(attachToBone(model, 'Spine2', bag, [0, 1.25, -0.2]));
  for (const side of ['Left', 'Right']) {
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.07, 0.26), mat('#fbfbf7', 0.2));
    kit.push(attachToBone(model, side + 'Foot', shoe, [side === 'Left' ? 0.1 : -0.1, 0.05, 0.06]));
  }
  return kit;
}

// --- particles -----------------------------------------------------------------------------

const PARTICLE_VERT = `attribute float aSize; attribute float aAlpha; varying float vAlpha; uniform float uScale;
void main(){ vAlpha = aAlpha; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = aSize * uScale / max(0.1, -mv.z); gl_Position = projectionMatrix * mv; }`;
const PARTICLE_FRAG = `uniform sampler2D uMap; uniform vec3 uColor; varying float vAlpha;
void main(){ vec4 t = texture2D(uMap, gl_PointCoord); gl_FragColor = vec4(uColor, t.a * vAlpha); if (gl_FragColor.a < 0.01) discard; }`;
let DOT;
/** A fixed-size particle pool drawn as one Points object. */
class Particles {
  constructor(scene, n, { color, additive = false, gravity = 0, drag = 0, grow = 0, fadeIn = 0.1 }) {
    DOT ??= softDot();
    this.n = n; this.gravity = gravity; this.drag = drag; this.grow = grow; this.fadeIn = fadeIn;
    this.pos = new Float32Array(n * 3); this.vel = new Float32Array(n * 3);
    this.life = new Float32Array(n); this.max = new Float32Array(n); this.size0 = new Float32Array(n);
    this.size = new Float32Array(n); this.alpha = new Float32Array(n); this.a0 = new Float32Array(n);
    this.next = 0; this.alive = 0;
    const g = new THREE.BufferGeometry();
    this.posAttr = new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage);
    this.sizeAttr = new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage);
    this.alphaAttr = new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('position', this.posAttr); g.setAttribute('aSize', this.sizeAttr); g.setAttribute('aAlpha', this.alphaAttr);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4);
    this.material = new THREE.ShaderMaterial({
      uniforms: { uMap: { value: DOT }, uColor: { value: new THREE.Color(color) }, uScale: { value: 600 } },
      vertexShader: PARTICLE_VERT, fragmentShader: PARTICLE_FRAG, transparent: true, depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.points = new THREE.Points(g, this.material);
    this.points.frustumCulled = false; this.points.renderOrder = 3;
    scene.add(this.points);
  }
  emit(x, y, z, vx, vy, vz, life, size, alpha = 1) {
    const i = this.next; this.next = (this.next + 1) % this.n;
    const j = i * 3;
    this.pos[j] = x; this.pos[j + 1] = y; this.pos[j + 2] = z;
    this.vel[j] = vx; this.vel[j + 1] = vy; this.vel[j + 2] = vz;
    this.life[i] = life; this.max[i] = life; this.size0[i] = size; this.a0[i] = alpha;
  }
  update(dt, wx = 0, wz = 0) {
    let alive = 0;
    const damp = Math.exp(-this.drag * dt);
    for (let i = 0; i < this.n; i++) {
      if (this.life[i] <= 0) { this.alpha[i] = 0; continue; }
      alive++;
      this.life[i] -= dt;
      const j = i * 3, k = 1 - this.life[i] / this.max[i];
      this.vel[j] = this.vel[j] * damp + wx * (1 - damp); this.vel[j + 2] = this.vel[j + 2] * damp + wz * (1 - damp);
      this.vel[j + 1] = this.vel[j + 1] * damp + this.gravity * dt;
      this.pos[j] += this.vel[j] * dt; this.pos[j + 1] += this.vel[j + 1] * dt; this.pos[j + 2] += this.vel[j + 2] * dt;
      if (this.pos[j + 1] < 0.05) { this.pos[j + 1] = 0.05; this.vel[j + 1] *= -0.15; if (this.gravity < 0) this.life[i] = Math.min(this.life[i], 0.15); }
      this.size[i] = this.size0[i] * (1 + this.grow * k);
      const fin = Math.min(1, k / this.fadeIn);
      this.alpha[i] = this.a0[i] * fin * (1 - k) * (1 - k * 0.3);
    }
    this.alive = alive;
    this.points.visible = alive > 0;
    if (alive) { this.posAttr.needsUpdate = true; this.sizeAttr.needsUpdate = true; this.alphaAttr.needsUpdate = true; }
  }
}

// --- vehicles ---------------------------------------------------------------------------------

function wheel(parent, x, y, z, r = 0.45) {
  const w = cyl(r, r, 0.32, '#1c1f1e', x, y, z, parent, 14); w.rotation.z = Math.PI / 2; return w;
}
function textPlate(text, w, h, bg, fg) {
  const t = canvasTex(512, Math.round((512 * h) / w), (g, cw, ch) => {
    g.fillStyle = bg; g.fillRect(0, 0, cw, ch); g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `bold ${Math.round(ch * 0.62)}px sans-serif`; g.fillText(text, cw / 2, ch / 2);
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 }));
}
/** The white-and-blue "Vajra" water cannon truck. Forward is +z. Nozzle tip is userData.nozzle. */
function buildVajra() {
  const g = new THREE.Group();
  box(2.5, 1.0, 7.6, '#e9ecef', 0, 1.05, 0, g, 0.5); // chassis + body base
  box(2.52, 1.5, 5.0, '#f3f5f6', 0, 2.1, -1.2, g, 0.5); // armoured box
  box(2.54, 0.3, 7.62, '#2754a3', 0, 1.55, 0, g, 0.5); // blue band
  box(2.4, 1.3, 2.2, '#eef1f3', 0, 1.95, 2.6, g, 0.5); // cab
  box(2.2, 0.55, 0.05, '#2a3842', 0, 2.25, 3.71, g, 0.15); // windscreen with mesh guard
  for (let x = -1; x <= 1; x += 0.25) box(0.03, 0.6, 0.04, '#9aa3a8', x, 2.25, 3.75, g);
  box(2.0, 0.2, 0.1, '#c0392b', 0, 2.68, 2.6, g); // light bar
  const turret = new THREE.Group(); turret.position.set(0, 2.95, 0.4); g.add(turret);
  cyl(0.5, 0.6, 0.45, '#dfe4e8', 0, 0, 0, turret, 16);
  const nozzle = cyl(0.09, 0.12, 1.9, '#59636a', 0, 0.2, 0.9, turret, 10); nozzle.rotation.x = Math.PI / 2 - 0.12;
  const tip = new THREE.Object3D(); tip.position.set(0, 0.32, 1.85); turret.add(tip);
  for (const [x, z] of [[-1.15, 2.6], [1.15, 2.6], [-1.15, -1.4], [1.15, -1.4], [-1.15, -2.8], [1.15, -2.8]]) wheel(g, x, 0.5, z, 0.5);
  for (const side of [-1, 1]) {
    const p = textPlate('VAJRA', 2.4, 0.55, '#2754a3', '#ffffff'); p.position.set(side * 1.27, 2.25, -1.2); p.rotation.y = side * Math.PI / 2; g.add(p);
    const q = textPlate('DELHI POLICE', 2.6, 0.32, '#f3f5f6', '#1d3d7a'); q.position.set(side * 1.27, 1.68, -1.2); q.rotation.y = side * Math.PI / 2; g.add(q);
  }
  g.userData.turret = turret; g.userData.nozzle = tip;
  return g;
}
/** The party's white SUV with a flag and a VIP sticker. */
function buildSUV() {
  const g = new THREE.Group();
  box(2.0, 0.9, 4.7, '#f6f6f2', 0, 0.85, 0, g, 0.25);
  box(1.9, 0.75, 2.9, '#f6f6f2', 0, 1.65, -0.35, g, 0.25);
  box(1.92, 0.5, 2.6, '#1b2329', 0, 1.7, -0.35, g, 0.1); // glass band
  box(1.6, 0.06, 0.02, '#1b2329', 0, 1.7, 1.12, g);
  box(1.95, 0.18, 0.08, '#b9bec2', 0, 0.62, 2.36, g, 0.3);
  for (const [x, z] of [[-0.95, 1.5], [0.95, 1.5], [-0.95, -1.5], [0.95, -1.5]]) wheel(g, x, 0.42, z, 0.42);
  const vip = textPlate('VIP', 0.5, 0.18, '#d32f2f', '#ffffff'); vip.position.set(0.6, 1.62, 1.14); vip.rotation.x = -0.5; g.add(vip);
  const pole = cyl(0.02, 0.02, 1.0, '#cfcfcf', 0.9, 1.7, 2.1, g, 6);
  const flag = new THREE.Mesh(flagGeo, flagMaterial('party')); flag.scale.setScalar(0.8); flag.position.set(0.9, 2.05, 2.1); flag.rotation.y = Math.PI / 2; g.add(flag);
  g.userData.flag = flag; void pole;
  return g;
}
/** A motorbike with an optional rider silhouette (the riders join the crowd once parked). */
function buildBike(i) {
  const g = new THREE.Group();
  for (const z of [-0.65, 0.65]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.07, 6, 14), mat('#151718')); w.position.set(0, 0.34, z); w.rotation.y = Math.PI / 2; w.castShadow = true; g.add(w); }
  box(0.22, 0.32, 1.1, ['#2a2d31', '#7a1f1f', '#1f3d6b', '#2a2d31'][i % 4], 0, 0.62, 0, g, 0.4);
  box(0.3, 0.1, 0.6, '#111', 0, 0.84, -0.2, g);
  box(0.7, 0.04, 0.04, '#999', 0, 1.0, 0.55, g);
  const rider = new THREE.Group();
  box(0.42, 0.55, 0.28, '#ef7d16', 0, 1.25, -0.15, rider, 0.9);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), mat('#a0714f')); head.position.set(0, 1.68, -0.1); rider.add(head);
  const band = cyl(0.152, 0.152, 0.05, '#ef7d16', 0, 1.73, -0.1, rider, 12); void band;
  for (const s of [-1, 1]) box(0.12, 0.5, 0.14, '#3a3a3a', s * 0.16, 0.85, 0.05, rider);
  g.add(rider); g.userData.rider = rider;
  if (i % 2 === 0) {
    const pole = cyl(0.015, 0.015, 1.4, '#bbb', 0, 1.4, -0.6, g, 6); void pole;
    const f = new THREE.Mesh(flagGeo, flagMaterial('sena')); f.scale.setScalar(0.6); f.position.set(0, 1.9, -0.6); f.rotation.y = Math.PI / 2; g.add(f); g.userData.flag = f;
  }
  if (i === 1) { const horn = cyl(0.05, 0.18, 0.38, '#f1ede0', 0.25, 1.05, 0.6, g, 12); horn.rotation.x = Math.PI / 2; }
  return g;
}
function buildAmbulance() {
  const g = new THREE.Group();
  box(2.1, 1.9, 4.6, '#f4f2ec', 0, 1.25, 0, g);
  box(2.0, 0.9, 1.0, '#9fc3d6', 0, 1.75, 2.35, g);
  box(2.12, 0.22, 4.62, '#c8402f', 0, 1.0, 0, g);
  for (const side of [-1, 1]) { box(0.04, 0.5, 0.15, '#c8402f', side * 1.06, 1.7, -0.6, g); box(0.04, 0.15, 0.5, '#c8402f', side * 1.06, 1.7, -0.6, g); }
  const light = box(0.5, 0.18, 0.3, new THREE.MeshStandardMaterial({ color: '#3a7bd5', emissive: '#2a6bff', emissiveIntensity: 0 }), 0, 2.29, 1.2, g);
  for (const [x, z] of [[-1, -1.5], [1, -1.5], [-1, 1.5], [1, 1.5]]) wheel(g, x, 0.36, z, 0.36);
  g.userData.light = light;
  return g;
}
function buildChair(i) {
  const g = new THREE.Group(), c = ['#c0392b', '#2d6fa3', '#e8e2d0'][i % 3];
  box(0.46, 0.05, 0.44, c, 0, 0.45, 0, g, 0.5);
  box(0.46, 0.45, 0.05, c, 0, 0.7, -0.21, g, 0.5);
  for (const [x, z] of [[-0.2, -0.19], [0.2, -0.19], [-0.2, 0.19], [0.2, 0.19]]) box(0.04, 0.45, 0.04, c, x, 0.22, z, g, 0.5);
  return g;
}
function buildCanister() {
  const g = new THREE.Group();
  cyl(0.05, 0.05, 0.22, '#3b4a35', 0, 0, 0, g, 8).rotation.z = Math.PI / 2;
  return g;
}
function buildStone() { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.09), mat('#7b746a')); m.castShadow = true; const g = new THREE.Group(); g.add(m); return g; }

const BUILDERS = { vajra: buildVajra, suv: buildSUV, bike: buildBike, ambulance: buildAmbulance, chair: buildChair, canister: buildCanister, stone: buildStone, barricade: null };

// --- layouts ------------------------------------------------------------------------------------

/** Barricade lines per place: positions and the yaw of each unit. Gaps are left where the police stand. */
export const BARRICADE_LINES = {
  barricade: { yaw: Math.PI / 2, at: [[35.2, -13.5], [35.2, -10.5], [35.2, -7.5], [35.2, -1.5], [35.2, 1.5], [35.2, 4.5]] },
  parliament: { yaw: Math.PI / 2, at: [[57.4, -9], [57.4, -6], [57.4, -3], [57.4, 0], [57.4, 3], [57.4, 6]] },
  stage: { yaw: 0, at: [[-7.5, 0.6], [-4.5, 0.6], [1.5, 0.6], [4.5, 0.6]] },
  cp: { yaw: 0, at: [[-3, -27.8], [0, -27.8], [3, -27.8], [6, -27.8]] },
};
/** Where vehicles park for each place, and the road they come in on. */
const PARK = {
  cp: { x: -24, z: -27, yaw: Math.PI / 2 }, stage: { x: -17, z: 2.6, yaw: Math.PI / 2 },
  barricade: { x: 28, z: 5.2, yaw: Math.PI / 2 }, parliament: { x: 68, z: 5.2, yaw: -Math.PI / 2 },
};
const placeOf = (PLACES, place) => PLACES[place] || PLACES.stage;

/**
 * createProps(world, { PLACES, playerObstacles }) -> api
 * playerObstacles: the array the player's collision uses; barricade lines are added to it
 * (never to the NPC obstacle list, so routines can't get stuck behind them).
 */
export function createProps(world, { PLACES, playerObstacles = null } = {}) {
  const scene = world.scene;
  const overrides = {}; // name -> Object3D from setModel
  const holders = {}; // name -> [Group]
  function make(name, i = 0) {
    const g = new THREE.Group(); g.name = 'prop:' + name;
    fill(g, name, i);
    (holders[name] ??= []).push(g);
    g.userData.index = i;
    scene.add(g);
    return g;
  }
  function fill(g, name, i) {
    g.clear();
    let inner;
    if (overrides[name]) inner = overrides[name].clone(true);
    else if (name === 'barricade' && world.assets?.barricade) inner = world.assets.barricade.clone(true);
    else if (name === 'barricade') { inner = new THREE.Group(); box(3, 0.65, 0.12, '#dbba5a', 0, 1, 0, inner); for (const x of [-1.3, 1.3]) box(0.12, 1.2, 0.6, '#5b6254', x, 0.6, 0, inner); }
    else inner = BUILDERS[name](i);
    g.add(inner);
    g.userData.inner = inner;
    // Procedural rigs expose parts (turret, nozzle, rider); a swapped model can name them the same.
    for (const k of ['turret', 'nozzle', 'rider', 'flag', 'light']) {
      g.userData[k] = inner.userData?.[k] ?? inner.getObjectByName?.(k) ?? null;
    }
  }
  /** Swap point for the assets workstream: replace a procedural prop with a real glTF scene. */
  function setModel(name, object3d) {
    overrides[name] = object3d;
    for (const g of holders[name] || []) fill(g, name, g.userData.index);
  }

  // Barricade lines, one per place, hidden underground until they go up.
  const lines = {};
  for (const [place, L] of Object.entries(BARRICADE_LINES)) {
    lines[place] = {
      up: 0, target: 0, colliders: [],
      units: L.at.map(([x, z], i) => { const g = make('barricade', i); g.position.set(x, -1.4, z); g.rotation.y = L.yaw; g.visible = false; return g; }),
    };
    lines[place].colliders = L.at.map(([x, z]) => ({ id: 'set-barricade:' + place, x, z, w: L.yaw ? 0.7 : 3, d: L.yaw ? 3 : 0.7, h: 1.3 }));
  }

  // Vehicles.
  const vajra = make('vajra'); vajra.visible = false;
  const suv = make('suv'); suv.visible = false;
  const bikes = [0, 1, 2, 3].map((i) => { const b = make('bike', i); b.visible = false; return b; });
  const ambulance = make('ambulance'); ambulance.visible = false;
  const chairs = Array.from({ length: 8 }, (_, i) => { const c = make('chair', i); c.visible = false; return c; });
  const canisters = [0, 1, 2].map((i) => { const c = make('canister', i); c.visible = false; return c; });
  const stone = make('stone'); stone.visible = false;

  const water = new Particles(scene, 1400, { color: '#cfeaff', additive: true, gravity: -9.8, drag: 0.4 });
  const smoke = new Particles(scene, 520, { color: '#d9d6cc', additive: false, gravity: 0.25, drag: 1.2, grow: 3.2, fadeIn: 0.15 });
  const dust = new Particles(scene, 260, { color: '#c89a6a', additive: false, gravity: 0.05, drag: 0.8, grow: 1.5, fadeIn: 0.3 });

  // Moving-vehicle state (pure numbers, no allocation in update).
  const drive = (g, speed) => ({ g, path: [], i: 0, speed, moving: false, x: 0, z: 0, yaw: 0, shown: false });
  const cannonD = drive(vajra, 7), suvD = drive(suv, 9), ambD = drive(ambulance, 10);
  const bikeD = bikes.map((b) => drive(b, 11));
  function setPath(d, pts) {
    d.path = pts; d.i = 1; d.moving = true; d.x = pts[0][0]; d.z = pts[0][1]; d.shown = true; d.g.visible = true;
  }
  function stepDrive(d, dt) {
    if (!d.moving) return;
    let step = d.speed * dt;
    while (step > 0 && d.i < d.path.length) {
      const [tx, tz] = d.path[d.i], dx = tx - d.x, dz = tz - d.z, len = Math.hypot(dx, dz);
      if (len > 0.001) d.yaw = Math.atan2(dx, dz);
      if (len <= step) { d.x = tx; d.z = tz; d.i++; step -= len; } else { d.x += (dx / len) * step; d.z += (dz / len) * step; step = 0; }
    }
    if (d.i >= d.path.length) d.moving = false;
    d.g.position.set(d.x, 0, d.z);
    const cur = d.g.rotation.y, diff = Math.atan2(Math.sin(d.yaw - cur), Math.cos(d.yaw - cur));
    d.g.rotation.y = cur + diff * Math.min(1, dt * 5);
  }
  function routeTo(x, z, fromEast = true) {
    const sx = fromEast ? 95 : -95;
    return [[sx, 2.8], [x + (fromEast ? 10 : -10), 2.8], [x, z]];
  }

  // Tear gas.
  const gas = { active: false, x: 0, z: 0, t: 0, flights: [], emit: 0, id: null };
  // A thrown stone in flight.
  const throwS = { active: false, t: 0, sx: 0, sz: 0, ex: 0, ez: 0 };
  // The lathi charge front, read by main for police and crowd movement.
  const charge = { active: false, place: null, x: 0, z: 0, nx: 1, nz: 0, along: 0, t: 0, ox: 0, oz: 0, speed: 3.8, length: 14 };
  const LINE_FROM = { // where the charge starts at each place and the direction it sweeps
    stage: { x: 0, z: 1.8, nx: 0, nz: -1 }, cp: { x: 4.5, z: -26.4, nx: 0, nz: -1 },
    barricade: { x: 37.8, z: -4.5, nx: -1, nz: 0 }, parliament: { x: 55.5, z: -4, nx: 1, nz: 0 },
  };

  let cannonKey = null, suvShown = false, bikesShown = false, ambKey = null, spray = 0, sprayDir = 0, sprayPitch = 0, dance = false;
  const sprayTarget = new THREE.Vector3();
  const focus = { cannon: new THREE.Vector3(), suv: new THREE.Vector3(), bikes: new THREE.Vector3(), gas: new THREE.Vector3(), stone: new THREE.Vector3(), barricade: new THREE.Vector3(), charge: new THREE.Vector3(), ambulance: new THREE.Vector3() };

  function cue(c) {
    const name = c.cue;
    if (name === 'stone-thrown') {
      const p = c.pos || c.data?.pos; if (!p) return;
      const L = LINE_FROM[c.place] || LINE_FROM.barricade;
      Object.assign(throwS, { active: true, t: 0, sx: p.x, sz: p.z, ex: L.x, ez: L.z });
      stone.visible = true; focus.stone.set(p.x, 1.5, p.z);
    }
    if (name === 'faint' || name === 'ambulance') ambulanceTo(c.pos || PLACES.stage);
  }
  function ambulanceTo(p) {
    const key = Math.round(p.x) + ':' + Math.round(p.z);
    if (ambKey === key) return; ambKey = key;
    const tx = THREE.MathUtils.clamp(p.x, -40, 45), tz = 4.5;
    setPath(ambD, [[-95, 4.5], [tx, tz]]);
    focus.ambulance.set(tx, 1, tz);
  }

  /** Per frame. day: the rules' state. ctx: { t, player:{x,z}, hotspotPos:{x,z}|null, kidsSpot: Vector3 (out) } */
  function update(day, dt, t, ctx) {
    const police = day.police || {};
    // Barricade lines rise and fall.
    const up = police.barricades || [];
    for (const [place, L] of Object.entries(lines)) {
      const want = up.includes(place) ? 1 : 0;
      if (want && !L.target && playerObstacles) for (const c of L.colliders) if (!playerObstacles.includes(c)) playerObstacles.push(c);
      if (!want && L.target && playerObstacles) for (const c of L.colliders) { const i = playerObstacles.indexOf(c); if (i >= 0) playerObstacles.splice(i, 1); }
      L.target = want;
      if (want && L.up === 0) focus.barricade.set(L.units[0].position.x, 1, L.units[0].position.z);
      L.up = THREE.MathUtils.clamp(L.up + (want ? dt : -dt) * 0.8, 0, 1);
      L.units.forEach((u, i) => {
        const k = THREE.MathUtils.clamp(L.up * (1 + L.units.length * 0.25) - i * 0.25, 0, 1);
        u.visible = k > 0;
        u.position.y = -1.4 * (1 - THREE.MathUtils.smoothstep(k, 0, 1));
      });
    }

    // The water cannon: rolls in, parks, sprays (or plays fountain for the dancing kids).
    const cn = police.cannon;
    if (cn && cn.x !== undefined) {
      const key = Math.round(cn.x) + ':' + Math.round(cn.z);
      if (key !== cannonKey) {
        cannonKey = key;
        if (!cannonD.shown) setPath(cannonD, routeTo(cn.x, cn.z, true));
        else setPath(cannonD, [[cannonD.x, cannonD.z], [cn.x, cn.z]]);
        if (cn.state !== 'rolling') { cannonD.x = cn.x; cannonD.z = cn.z; cannonD.i = cannonD.path.length; }
      }
      stepDrive(cannonD, dt);
      focus.cannon.set(cannonD.x, 2.2, cannonD.z);
      dance = cn.state === 'dance';
      spray = cn.state === 'spraying' || dance ? Math.min(1, spray + dt * 2) : Math.max(0, spray - dt * 2);
      // Aim at the hotspot crowd (or straight ahead), swinging slowly like a real turret.
      const tgt = ctx.hotspotPos || ctx.player;
      const turret = vajra.userData.turret;
      if (turret) {
        const want = Math.atan2(tgt.x - cannonD.x, tgt.z - cannonD.z) - vajra.rotation.y + (dance ? 0 : Math.sin(t * 0.7) * 0.25);
        sprayDir += Math.atan2(Math.sin(want - sprayDir), Math.cos(want - sprayDir)) * Math.min(1, dt * 2);
        turret.rotation.y = sprayDir;
        sprayPitch = dance ? 0.95 : 0.18;
      }
      sprayTarget.set(tgt.x, 0, tgt.z);
    } else {
      if (cannonD.shown && !cannonD.moving) { cannonD.shown = false; vajra.visible = false; cannonKey = null; }
      spray = Math.max(0, spray - dt * 2); dance = false;
    }
    if (spray > 0.01 && vajra.userData.nozzle) {
      const tip = vajra.userData.nozzle;
      tip.getWorldPosition(v1);
      // Direction: the turret's facing, pitched up.
      v2.set(0, 0, 1).applyQuaternion(tip.getWorldQuaternion(q1));
      v2.y = 0; v2.normalize();
      const speed = dance ? 11 : 17;
      const n = Math.floor(spray * (dance ? 160 : 260) * dt + Math.random());
      for (let i = 0; i < n; i++) {
        const sp = dance ? 0.55 : 0.16;
        water.emit(v1.x, v1.y, v1.z,
          (v2.x + (Math.random() - 0.5) * sp) * speed * Math.cos(sprayPitch), Math.sin(sprayPitch) * speed + (Math.random() - 0.5) * 2, (v2.z + (Math.random() - 0.5) * sp) * speed * Math.cos(sprayPitch),
          dance ? 2.2 : 1.6, 0.16 + Math.random() * 0.12, 0.55);
      }
      // Where the jet lands, for crowd reactions and for the kids' dance floor.
      const flight = (2 * Math.sin(sprayPitch) * speed) / 9.8;
      ctx.sprayLand = ctx.sprayLand || new THREE.Vector3();
      ctx.sprayLand.set(v1.x + v2.x * speed * Math.cos(sprayPitch) * flight * 0.85, 0, v1.z + v2.z * speed * Math.cos(sprayPitch) * flight * 0.85);
      ctx.spraying = !dance; ctx.dancing = dance;
    } else { ctx.spraying = false; ctx.dancing = false; }

    // The party SUV parks near the party once they arrive; it waits there for the provocateurs.
    const party = day.groups?.party;
    if (party && party.size > 0 && !suvShown) {
      suvShown = true; const P = PARK[party.place] || PARK.stage;
      setPath(suvD, routeTo(P.x, P.z, false)); suvD.parkYaw = P.yaw;
      focus.suv.set(P.x, 1.2, P.z);
    }
    if (!party && suvShown && !suvD.moving) { suvShown = false; suv.visible = false; suvD.shown = false; }
    stepDrive(suvD, dt);
    if (suv.userData.flag) suv.userData.flag.rotation.y = Math.PI / 2 + Math.sin(t * 3) * (suvD.moving ? 0.6 : 0.25);

    // Sena bikes ride in as a column; once parked the riders have joined the group on foot.
    const sena = day.groups?.sena;
    if (sena && sena.size > 0 && !bikesShown) {
      bikesShown = true;
      const c = placeOf(PLACES, sena.place);
      bikeD.forEach((d, i) => {
        const px = c.x + 6 + i * 1.1, pz = c.z + 9.5;
        setPath(d, [[95 + i * 4, 1.5 + (i % 2) * 1.2], [px + 8, pz], [px, pz]]);
      });
      focus.bikes.set(c.x + 8, 1, c.z + 8);
    }
    if (!sena && bikesShown && bikeD.every((d) => !d.moving)) { bikesShown = false; for (const d of bikeD) { d.g.visible = false; d.shown = false; } }
    for (const d of bikeD) {
      stepDrive(d, dt);
      if (d.g.userData.rider) d.g.userData.rider.visible = d.moving;
      if (d.g.userData.flag) d.g.userData.flag.rotation.y = Math.PI / 2 + Math.sin(t * 4 + d.g.userData.index) * 0.4;
    }

    // Ambulance: when people faint in the heat.
    if (day.heat && !ambD.shown) ambulanceTo(PLACES.stage);
    stepDrive(ambD, dt);
    if (ambulance.userData.light) ambulance.userData.light.material.emissiveIntensity = ambD.shown && Math.sin(t * 12) > 0 ? 3 : 0.2;

    // Tear gas: canisters arc from the line, then pour smoke that drifts on the wind.
    const g = police.gas;
    if (g && g.x !== undefined) {
      const id = `${Math.round(g.x)}:${Math.round(g.z)}:${Math.round(g.t ?? 0)}`;
      if (gas.id !== id) {
        gas.id = id; gas.active = true; gas.x = g.x; gas.z = g.z; gas.t = 0;
        const L = LINE_FROM[g.place] || LINE_FROM.barricade;
        gas.flights = canisters.map((c, i) => ({ c, t: -i * 0.35, sx: L.x, sz: L.z, ex: g.x + (i - 1) * 3.2, ez: g.z + ((i * 7) % 3 - 1) * 2.5, landed: false }));
        focus.gas.set(g.x, 1.5, g.z);
      }
    } else if (gas.active && gas.t > 3) gas.active = false;
    if (gas.flights.length) {
      gas.t += dt;
      for (const f of gas.flights) {
        f.t += dt;
        if (f.t < 0) continue;
        const k = Math.min(1, f.t / 1.3);
        if (k < 1) {
          f.c.visible = true;
          f.c.position.set(f.sx + (f.ex - f.sx) * k, 1.6 + Math.sin(k * Math.PI) * 7, f.sz + (f.ez - f.sz) * k);
          f.c.rotation.x += dt * 9;
          if (Math.random() < 0.6) smoke.emit(f.c.position.x, f.c.position.y, f.c.position.z, 0, 0, 0, 1.4, 0.5, 0.5);
        } else {
          if (!f.landed) { f.landed = true; f.c.position.y = 0.06; }
          // Smoke pours for 35 seconds (real time), thinning out.
          if (gas.active || f.t < 35) {
            const rate = f.t < 35 ? (f.t < 12 ? 16 : 8) : 0;
            const n = Math.floor(rate * dt + Math.random());
            for (let i = 0; i < n; i++) smoke.emit(f.ex + (Math.random() - 0.5) * 0.6, 0.3, f.ez + (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 1.6, 0.6 + Math.random() * 0.6, (Math.random() - 0.5) * 1.6, 7 + Math.random() * 3, 1.6 + Math.random(), 0.42);
          }
        }
      }
      if (gas.flights.every((f) => f.t > 45)) { for (const f of gas.flights) f.c.visible = false; gas.flights = []; }
    }
    smoke.update(dt, 0.9, 0.35);
    water.update(dt);

    // A stone in flight from the provocateur to the line.
    if (throwS.active) {
      throwS.t += dt; const k = Math.min(1, throwS.t / 0.9);
      stone.position.set(throwS.sx + (throwS.ex - throwS.sx) * k, 1.6 + Math.sin(k * Math.PI) * 3.2, throwS.sz + (throwS.ez - throwS.sz) * k);
      if (k >= 1) { throwS.active = false; for (let i = 0; i < 12; i++) dust.emit(throwS.ex, 0.3, throwS.ez, (Math.random() - 0.5) * 3, Math.random() * 2, (Math.random() - 0.5) * 3, 1.5, 0.5, 0.5); }
    } else if (stone.visible && stone.position.y > 0.1) stone.position.y = 0.08;

    // Lathi charge: the front sweeps from the line through the crowd for about 16 metres.
    const ch = police.charge;
    if (ch && ch.place) {
      if (!charge.active || charge.place !== ch.place) {
        const L = LINE_FROM[ch.place] || LINE_FROM.stage;
        Object.assign(charge, { active: true, place: ch.place, ox: L.x, oz: L.z, nx: L.nx, nz: L.nz, along: 0, t: 0 });
        focus.charge.set(L.x + L.nx * 4, 1.5, L.z + L.nz * 4);
      }
      charge.t += dt;
      charge.along = Math.min(16, charge.along + charge.speed * dt);
      charge.x = charge.ox + charge.nx * charge.along; charge.z = charge.oz + charge.nz * charge.along;
      // Dust kicked up along the front.
      if (charge.along < 16 && Math.random() < dt * 30) {
        const s = (Math.random() - 0.5) * charge.length;
        dust.emit(charge.x - charge.nz * s, 0.2, charge.z + charge.nx * s, charge.nx * 1.5, 0.6, charge.nz * 1.5, 2.2, 1.0, 0.45);
      }
    } else charge.active = false;
    // Dusty haze over the hotspot in the showdown.
    if (ctx.phase === 'showdown' && ctx.hotspotPos && Math.random() < dt * 6) {
      const h = ctx.hotspotPos;
      dust.emit(h.x + (Math.random() - 0.5) * 22, 0.4, h.z + (Math.random() - 0.5) * 22, 0, 0.15, 0, 9, 3.5, 0.18);
    }
    dust.update(dt, 0.6, 0.2);
  }

  /** How thick the tear gas is at a point, 0..1 (for fog, coughing and the crowd running). */
  function gasAt(x, z) {
    if (!gas.flights.length) return 0;
    const age = gas.t;
    if (age > 45) return 0;
    const d = Math.hypot(x - (gas.x + age * 0.25), z - (gas.z + age * 0.1));
    const r = 4 + Math.min(age, 15) * 0.6;
    return THREE.MathUtils.clamp(1 - d / r, 0, 1) * (age < 35 ? 1 : (45 - age) / 10);
  }
  /** Chairs for constables lounging in the morning: place chair i or hide it. */
  function chair(i, x, z, yaw, show) {
    const c = chairs[i]; if (!c) return;
    c.visible = show; if (show) { c.position.set(x, 0, z); c.rotation.y = yaw; }
  }

  return {
    setModel, make, update, cue, gasAt, chair, focus, charge, lines, LINE_FROM,
    get sprayTarget() { return sprayTarget; },
    get spraying() { return spray > 0.3 && !dance; },
    get dancing() { return spray > 0.3 && dance; },
    get cannonPos() { return cannonD.shown ? vajra.position : null; },
    get suvPos() { return suvD.shown ? suv.position : null; },
    vehicles: { vajra, suv, bikes, ambulance },
    particles: { water, smoke, dust },
  };
}
