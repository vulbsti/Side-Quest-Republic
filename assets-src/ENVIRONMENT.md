# Photographic surface and daylight upgrade

Implemented in `dist/environment-detail.js`; call `await enhanceEnvironment(THREE, world)` immediately after `buildWorld`, before creating characters. It replaces only static materials, changes daylight, and adds decorative foliage/street detail. Returns `world.environmentReport` with successfully loaded assets, failures, surface and foliage counts. Asset errors preserve fallback geometry/materials.

## Provenance

All photographic maps and the HDR environment below are downloaded from official Poly Haven API/CDN endpoints on 2026-10-15. Poly Haven licenses its assets under **CC0 1.0**: https://polyhaven.com/license . Exact CDN URLs, source pages, byte counts and SHA256 hashes are in `dist/assets/materials/provenance.json`.

- https://polyhaven.com/a/asphalt_02 — 1k diffuse and OpenGL normal, street road.
- https://polyhaven.com/a/plastered_wall — 1k diffuse and OpenGL normal, CP white lime-plaster and tinted observatory render.
- https://polyhaven.com/a/sandstone_blocks_05 — 1k diffuse and OpenGL normal, existing sandstone material.
- https://polyhaven.com/a/cobblestone_floor_08 — 1k diffuse and OpenGL normal, pavement analogue.
- https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky — 1k HDR, indirect illumination and sky.

These are **material analogues, not photographs surveyed in Delhi**. In particular the paving pattern and South African sky should not be presented as an exact CP reconstruction. Original street geometry remains an interpretive compressed game map.

The included `RGBELoader.js` is from Three.js 0.170.0, downloaded from https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/RGBELoader.js . MIT license is retained in the project's `dist/vendor/THREE-LICENSE.txt`.

Total photographic file payload: approximately 8.55 MB (decimal), all 1k. No runtime external service calls; maps are served locally. Renderer anisotropy capped at 8. HDR uses PMREM for physically based material lighting.

## Visual direction and boundaries

Neutral bright daylight replaces green-tinted ambient illumination. White architecture has surface variation and normal relief, projected with consistent world-space scale rather than stretching one texture over a whole building. Observatory remains red plaster, not stone blocks. Sphere foliage is removed and replaced with 21,080 instanced clusters of small leaf silhouettes; trunks remain. Curb scuffs, dry leaves and drain gratings add scale without gameplay collision.

Syntax checked. Downloaded image dimensions and hashes checked. Pavement image inspected. Integrated camera-view/real-browser performance review is still required; no claim of photorealistic reconstruction or surveyed geographic accuracy is made. In particular 21k leaf instances use one draw call but add shadow triangles and should be profiled on target hardware.
