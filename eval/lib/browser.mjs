// The real 3D client in headless Chrome: stand the player at each landmark, look around, count what is drawn
// (textured or flat-colour, people, how far you can see), and save a screenshot for the judge next to the
// real photo of the same spot (eval/refs/<id>.jpg when someone has added it).
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { serve, launch } from '../../verify/lib/browser.mjs';

// Where to stand and look. id matches eval/delhi.json landmarks, so a reference photo can sit beside each shot.
export const SHOTS = [
  { id: 'rajiv-chowk', at: [10, 30], place: 'metro', yaw: 0.0, pitch: 0.35, zoom: 12 },
  { id: 'cp-south', at: [10, 30], place: 'cp', yaw: 3.1, pitch: 0.3, zoom: 12 },
  { id: 'jm-road', at: [11, 0], place: 'stage', yaw: 0.6, pitch: 0.3, zoom: 12 },
  { id: 'jm-observatory', at: [11, 0], district: 'jantar', yaw: 2.2, pitch: 0.3, zoom: 14 },
  { id: 'sansad-barricade', at: [14, 30], place: 'barricade', yaw: 1.6, pitch: 0.3, zoom: 12 },
  { id: 'crowd-1530', at: [15, 30], hotspot: true, yaw: 0.6, pitch: 0.45, zoom: 22 },
];

export async function sceneAudit(outDir, { shots = SHOTS } = {}) {
  mkdirSync(outDir, { recursive: true });
  const server = await serve(), browser = await launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${server.url}/dist/index.html?nostings`);
  await page.waitForFunction(() => window.__loop && document.querySelector('#go'), null, { timeout: 400000 });
  await page.evaluate(() => window.__loop.startLoop());
  const results = [];
  for (const shot of shots) {
    await page.evaluate(async (shot) => {
      const L = window.__loop, d = L.day;
      const want = L.at(shot.at[0], shot.at[1]);
      if (want > d.t) L.advance(d, want - d.t);
      const { PLACES } = await import('/dist/loop/rules.js');
      let p = shot.place ? PLACES[shot.place] : shot.hotspot ? PLACES[d.director.hotspot] : null;
      if (shot.district) { const { DISTRICTS } = await import('/dist/districts.js?v=27'); p = DISTRICTS.find((x) => x.id === shot.district); }
      if (p) { Object.assign(L.sim.player, { x: p.x + 4, z: p.z + 4 }); Object.assign(d.player, { x: p.x + 4, z: p.z + 4 }); }
      L.snap(); L.view(shot.yaw, shot.pitch, shot.zoom);
    }, shot);
    await page.waitForTimeout(4000);
    const stats = await page.evaluate(() => {
      const { scene, camera } = window.__loop.world;
      camera.updateMatrixWorld(); camera.updateProjectionMatrix();
      const m = camera.projectionMatrix.clone().multiply(camera.matrixWorldInverse);
      // In view: the mesh's centre projects inside the screen (the client doesn't expose THREE.Frustum).
      const e = m.elements;
      const inView = (o) => {
        o.updateWorldMatrix(true, false);
        const p = o.matrixWorld.elements; const x = p[12], y = p[13], z = p[14];
        const w = e[3] * x + e[7] * y + e[11] * z + e[15]; if (w <= 0) return false;
        const cx = (e[0] * x + e[4] * y + e[8] * z + e[12]) / w, cy = (e[1] * x + e[5] * y + e[9] * z + e[13]) / w;
        return Math.abs(cx) <= 1.1 && Math.abs(cy) <= 1.1;
      };
      let meshes = 0, textured = 0, placeholders = 0, people = 0;
      scene.traverseVisible((o) => {
        if (!o.isMesh && !o.isInstancedMesh) return;
        if (!inView(o)) return;
        meshes++;
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        const hasMap = mats.some((x) => x && (x.map || x.normalMap || x.isShaderMaterial));
        if (hasMap) textured++;
        if (o.isSkinnedMesh) people++;
        const g = o.geometry?.type;
        if (!hasMap && (g === 'BoxGeometry' || g === 'PlaneGeometry') && !mats.some((x) => x?.transparent)) {
          o.geometry.computeBoundingBox?.(); const b = o.geometry.boundingBox;
          if (b && Math.max(b.max.x - b.min.x, b.max.y - b.min.y, b.max.z - b.min.z) * Math.max(o.scale.x, o.scale.y, o.scale.z) >= 0.5) placeholders++;
        }
      });
      return { meshes, textured: meshes ? textured / meshes : 0, placeholders, people, drawDistance: Math.min(scene.fog?.far ?? Infinity, camera.far) };
    });
    const file = join(outDir, `${shot.id}.jpg`);
    await page.screenshot({ path: file, type: 'jpeg', quality: 75, timeout: 180000 }).catch(() => {});
    results.push({ id: shot.id, file, ...stats });
  }
  await browser.close(); server.close();
  return { shots: results, errors };
}
