// The 10-minute day in the 3D client, beside slice-ui.js (which draws its HUD and reel):
//   - the trouble director's props (director.js): the runaway thela, Meera's mark on the ground, a marker over
//     whoever the trouble is about;
//   - riding the thela: the player's body goes where the engine takes it;
//   - what present.js needs to know about the player on this day: moving, how long they have stood still, and the
//     day's memory of when the phone last showed a line;
//   - the end: the reel first, the old ending card (endings seen, links learned) one button away.
// The engine decides everything (rules.js mischiefView); this only draws it. main.js calls in through a few hooks.

const MOVING = 0.6; // m/s: slower than this is standing

export function createDayUI({ THREE, world, getDay, getSim, bodyOf, sliceUI, dayView }) {
  let moving = false, still = 0, screen = {}, spin = 0;
  const g = new THREE.Group();
  g.name = 'day10';
  world.scene.add(g);

  // The thela: a wooden handcart heaped with sabzi, on two bicycle wheels.
  const wood = new THREE.MeshStandardMaterial({ color: 0x8a5a2b, roughness: 0.9 });
  const iron = new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.6, metalness: 0.4 });
  const cart = new THREE.Group();
  const bed = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.12, 1.9), wood);
  bed.position.y = 0.72; cart.add(bed);
  for (const sx of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 1.9), wood);
    rail.position.set(sx * 0.53, 0.86, 0); cart.add(rail);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 6), wood);
    handle.rotation.x = Math.PI / 2; handle.position.set(sx * 0.4, 0.8, -1.35); cart.add(handle);
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.04, 6, 18), iron);
    wheel.rotation.y = Math.PI / 2; wheel.position.set(sx * 0.62, 0.36, 0.15); cart.add(wheel);
  }
  const SABZI = [0xd83a2a, 0x3f9a2c, 0xf2a41a, 0x7b3a8f, 0xe8d24a];
  for (let i = 0; i < 18; i++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.11 + (i % 3) * 0.03, 8, 6), new THREE.MeshStandardMaterial({ color: SABZI[i % SABZI.length], roughness: 0.7 }));
    m.position.set(((i * 37) % 9) / 9 - 0.45, 0.86 + ((i * 13) % 4) * 0.06, ((i * 53) % 17) / 17 * 1.6 - 0.8);
    cart.add(m);
  }
  cart.visible = false;
  g.add(cart);

  // Meera's mark: a ring on the road, and a beam you can see from down the street.
  const pink = new THREE.MeshBasicMaterial({ color: 0xff4f9a, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false });
  const mark = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.5, 40), pink);
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.04; mark.add(ring);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 7, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xff4f9a, transparent: true, opacity: 0.25, depthWrite: false }));
  beam.position.y = 3.5; mark.add(beam);
  mark.visible = false;
  g.add(mark);

  // A marker over whoever the trouble is about.
  const pin = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.6, 4), new THREE.MeshBasicMaterial({ color: 0xffd23f }));
  pin.rotation.x = Math.PI;
  pin.visible = false;
  g.add(pin);

  /** Each frame, after the engine steps and the player moves (main.js step). */
  function update(dt) {
    const day = getDay(), sim = getSim(), p = sim.player;
    const v = day?.mischief ? dayView(day) : null;
    const sp = Math.hypot(p.vx || 0, p.vz || 0);
    moving = sp > MOVING;
    still = moving ? 0 : still + dt;
    const inc = v?.incident ?? null;
    spin += dt;
    // The thela.
    const c = inc?.kind === 'cart' ? inc.cart : null;
    cart.visible = !!c;
    if (c) { cart.position.set(c.x, 0, c.z); cart.rotation.y = c.yaw + Math.PI; }
    // Riding it: the engine drives; the body goes with it.
    if (c?.rider) { p.x = day.player.x; p.z = day.player.z; p.vx = p.vz = 0; p.y = 0.75; }
    // Meera's mark.
    mark.visible = inc?.kind === 'reel' && !!inc.mark;
    if (mark.visible) { mark.position.set(inc.mark.x, 0, inc.mark.z); ring.scale.setScalar(1 + 0.12 * Math.sin(spin * 6)); }
    // The marker.
    const b = inc && inc.kind !== 'cart' && inc.kind !== 'reel' && inc.who ? bodyOf(inc.who) : null;
    pin.visible = !!b;
    if (b) { pin.position.set(b.x, (b.y || 0) + 2.6 + 0.12 * Math.sin(spin * 4), b.z); pin.rotation.y = spin * 2; }
  }

  /** A new day: the phone's one-line memory starts again. */
  function begin() { screen = {}; still = 0; moving = false; }

  /** The day is over: the reel; the card main.js has just drawn into #screen stays one button away. */
  function ending({ again, board }) {
    const el = document.querySelector('#screen');
    const card = el.innerHTML;
    const showCard = () => {
      el.innerHTML = card;
      el.querySelector('#again')?.addEventListener('click', again);
      el.querySelector('#seeBoard')?.addEventListener('click', board);
    };
    sliceUI.showEnd(getDay(), { again, card: showCard, board });
  }

  return {
    update, begin, ending,
    /** For present.js (main.js clientView). */
    get moving() { return moving; }, get still() { return still; }, get screen() { return screen; },
  };
}
