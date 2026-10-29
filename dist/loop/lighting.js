// Phase feel: sky, sun, fog, exposure and street lamps, blended smoothly across the clock.
// The rules decide the phase; this module only makes the player feel it.
// Keyframes are clock minutes, so both tempos (?long and the default) look the same.
import * as THREE from 'three';

const P = (sun, sunI, sunPos, sky, ground, hemiI, fog, near, far, exposure, bg, overlay, top, horizon, lamps) => ({
  sun: new THREE.Color(sun), sunI, sunPos: new THREE.Vector3(...sunPos), sky: new THREE.Color(sky), ground: new THREE.Color(ground), hemiI,
  fog: new THREE.Color(fog), near, far, exposure, bg, overlay, top: new THREE.Color(top), horizon: new THREE.Color(horizon), lamps,
});

/** What each phase looks like. Times are clock minutes from midnight. */
export const LOOKS = {
  // Warm, low eastern sun, soft long shadows, clear air.
  morning: P('#ffd9a8', 2.35, [52, 34, 34], '#e4ecf2', '#8d7a63', 0.78, '#d8d5cb', 180, 520, 1.02, 0.85, 0.0, '#9fc2dc', '#f3dcc0', 0),
  // Harsh white noon: sun overhead, short hard shadows, bleached sky.
  midday: P('#fffaf0', 3.2, [8, 74, 14], '#eef3f6', '#9a8e7c', 0.62, '#dfe0dc', 200, 560, 1.1, 1.0, 0.18, '#c8d8e2', '#f4f1e8', 0),
  // Amber haze: dust in the air, the sun dropping west, the far city washing out.
  tense: P('#ffcd86', 2.3, [-44, 40, -12], '#e7cf9f', '#7c6346', 0.72, '#d6b47e', 90, 380, 1.0, 0.7, 0.55, '#c7a56e', '#e8bf80', 0),
  // Dusty orange showdown: low sun through smoke, short visibility.
  showdown: P('#ff9a4f', 1.75, [-58, 22, -22], '#dc9f66', '#5d4330', 0.68, '#c58a57', 45, 240, 0.96, 0.45, 0.82, '#9d6440', '#e2914f', 0.25),
  // Dusk: the sun nearly gone, blue sky, sodium lamps doing the work.
  aftermath: P('#ff7a45', 0.55, [-70, 9, -24], '#5a6a94', '#3b2e28', 0.5, '#46434f', 60, 300, 0.92, 0.18, 0.96, '#1c2443', '#c4673c', 1),
};
// The clock track: hold each look for most of its phase and cross-fade around the boundaries.
const TRACK = [
  [10 * 60, 'morning'], [11 * 60 + 40, 'morning'], [12 * 60 + 15, 'midday'], [13 * 60 + 45, 'midday'],
  [14 * 60 + 15, 'tense'], [15 * 60 + 45, 'tense'], [16 * 60 + 10, 'showdown'], [16 * 60 + 50, 'showdown'],
  [17 * 60 + 15, 'aftermath'], [18 * 60, 'aftermath'],
];

const SKY_VERT = `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * p; }`;
const SKY_FRAG = `uniform vec3 top; uniform vec3 horizon; uniform float alpha; varying vec3 vDir;
void main(){ float h = clamp(vDir.y, -0.1, 1.0); vec3 c = mix(horizon, top, pow(max(h,0.0), 0.55)); gl_FragColor = vec4(c, alpha * smoothstep(-0.12, 0.02, vDir.y + 0.1)); }`;

function glowTexture(inner = 'rgba(255,190,110,1)', outer = 'rgba(255,140,40,0)') {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, inner); grad.addColorStop(1, outer);
  g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/**
 * createLighting(world) -> { update(clockMinutes, dt, extra), look, phaseLook(name) }
 * extra: { gas: 0..1 smoke near the player, focus: {x,z} to centre the sun's shadow box on }
 */
export function createLighting(world) {
  const { scene, renderer } = world;
  const sun = world.sun;
  let hemi = null;
  scene.traverse((o) => { if (o.isHemisphereLight && !hemi) hemi = o; });
  if (!scene.fog) scene.fog = new THREE.Fog('#d8d5cb', 180, 520);

  // A gradient dome that fades in over the photographic sky as the day turns.
  const skyMat = new THREE.ShaderMaterial({
    uniforms: { top: { value: new THREE.Color() }, horizon: { value: new THREE.Color() }, alpha: { value: 0 } },
    vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, transparent: true, depthWrite: false, fog: false,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(700, 24, 12), skyMat);
  sky.renderOrder = -10; sky.frustumCulled = false; sky.name = 'phase-sky';
  scene.add(sky);

  // Sodium lamps: the city's street lamps glow (the ones near where the day happens get a halo), plus warm pools.
  const lampGlow = glowTexture();
  const near = (p) => [[-49, 95], [100, -190], [150, -296], [-55, 60]].some(([x, z]) => Math.hypot(p.x - x, p.z - z) < 140);
  const lampHeads = (world.city?.lamps || []).filter(near).map((p) => [p.x, 5.9, p.z]);
  const headMat = scene.getObjectByName('Street lamp heads')?.material || null;
  const glowMat = new THREE.SpriteMaterial({ map: lampGlow, color: '#ffb060', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 });
  const poolMat = new THREE.MeshBasicMaterial({ map: lampGlow, color: '#ff9a40', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 });
  const poolGeo = new THREE.PlaneGeometry(9, 9);
  const pools = new THREE.InstancedMesh(poolGeo, poolMat, lampHeads.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)), one = new THREE.Vector3(1, 1, 1), v = new THREE.Vector3();
  lampHeads.forEach(([x, , z], i) => {
    const s = new THREE.Sprite(glowMat); s.position.set(x, 4.85, z); s.scale.set(2.6, 2.6, 1); scene.add(s);
    pools.setMatrixAt(i, m4.compose(v.set(x, 0.06, z), q, one));
  });
  pools.frustumCulled = false; pools.renderOrder = 1; scene.add(pools);
  // Expansion lamp bulbs and the original lamp heads get their emissive turned up too.
  const bulbs = [];
  scene.getObjectByName('Expansion lamps')?.traverse((o) => { if (o.isMesh && o.material?.emissive) bulbs.push(o.material); });
  // Two real lights over the square and the barricade, so faces catch the orange at dusk.
  const sodium = [new THREE.PointLight('#ff9a48', 0, 26, 1.6), new THREE.PointLight('#ff9a48', 0, 26, 1.6)];
  sodium[0].position.set(-49, 5.5, 102); sodium[1].position.set(-50.5, 5.5, 86);
  for (const l of sodium) scene.add(l);

  const look = P('#ffffff', 1, [0, 1, 0], '#fff', '#fff', 1, '#fff', 1, 2, 1, 1, 0, '#fff', '#fff', 0);
  const target = P('#ffffff', 1, [0, 1, 0], '#fff', '#fff', 1, '#fff', 1, 2, 1, 1, 0, '#fff', '#fff', 0);
  let first = true;
  const tmpC = new THREE.Color();

  function sample(minutes, out) {
    let a = TRACK[0], b = TRACK[TRACK.length - 1];
    for (let i = 0; i < TRACK.length - 1; i++) if (minutes >= TRACK[i][0] && minutes <= TRACK[i + 1][0]) { a = TRACK[i]; b = TRACK[i + 1]; break; }
    if (minutes < TRACK[0][0]) b = a; if (minutes > TRACK[TRACK.length - 1][0]) a = b;
    const span = b[0] - a[0], k = span > 0 ? THREE.MathUtils.smoothstep(minutes, a[0], b[0]) : 0;
    blend(LOOKS[a[1]], LOOKS[b[1]], k, out);
  }
  function blend(A, B, k, out) {
    out.sun.lerpColors(A.sun, B.sun, k); out.sunI = A.sunI + (B.sunI - A.sunI) * k; out.sunPos.lerpVectors(A.sunPos, B.sunPos, k);
    out.sky.lerpColors(A.sky, B.sky, k); out.ground.lerpColors(A.ground, B.ground, k); out.hemiI = A.hemiI + (B.hemiI - A.hemiI) * k;
    out.fog.lerpColors(A.fog, B.fog, k); out.near = A.near + (B.near - A.near) * k; out.far = A.far + (B.far - A.far) * k;
    out.exposure = A.exposure + (B.exposure - A.exposure) * k; out.bg = A.bg + (B.bg - A.bg) * k; out.overlay = A.overlay + (B.overlay - A.overlay) * k;
    out.top.lerpColors(A.top, B.top, k); out.horizon.lerpColors(A.horizon, B.horizon, k); out.lamps = A.lamps + (B.lamps - A.lamps) * k;
  }

  const gasFog = new THREE.Color('#cfcac0');
  /** minutes: clock minutes; dt: real seconds; extra.gas: 0..1 tear-gas smoke near the camera. */
  function update(minutes, dt, extra = {}) {
    sample(minutes, target);
    // Follow the target smoothly so a jump in time (or a phase change) eases in over a few seconds.
    const k = first ? 1 : 1 - Math.exp(-dt * 1.6);
    first = false;
    blend(look, target, k, look);
    const gas = extra.gas || 0;
    if (sun) {
      sun.color.copy(look.sun); sun.intensity = look.sunI * (1 - gas * 0.35);
      sun.position.copy(look.sunPos);
      if (extra.focus) { sun.position.x += extra.focus.x; sun.position.z += extra.focus.z; sun.target.position.set(extra.focus.x, 0, extra.focus.z); sun.target.updateMatrixWorld(); }
    }
    if (hemi) { hemi.color.copy(look.sky); hemi.groundColor.copy(look.ground); hemi.intensity = look.hemiI; }
    tmpC.copy(look.fog).lerp(gasFog, gas * 0.7);
    scene.fog.color.copy(tmpC);
    scene.fog.near = look.near * (1 - gas * 0.8); scene.fog.far = look.far * (1 - gas * 0.55);
    renderer.toneMappingExposure = look.exposure;
    if ('backgroundIntensity' in scene) scene.backgroundIntensity = look.bg;
    if ('environmentIntensity' in scene) scene.environmentIntensity = 0.25 + look.bg * 0.35;
    skyMat.uniforms.top.value.copy(look.top); skyMat.uniforms.horizon.value.copy(look.horizon).lerp(tmpC, 0.35);
    skyMat.uniforms.alpha.value = look.overlay;
    sky.position.copy(world.camera.position);
    const L = look.lamps;
    if (headMat) headMat.emissiveIntensity = L * 2.2;
    glowMat.opacity = L * 0.9;
    poolMat.opacity = L * 0.55;
    pools.visible = glowMat.visible = L > 0.02;
    for (const m of bulbs) m.emissiveIntensity = 0.1 + L * 2;
    for (const l of sodium) l.intensity = L * 14;
  }
  return { update, look, phaseLook: (name) => LOOKS[name] };
}
