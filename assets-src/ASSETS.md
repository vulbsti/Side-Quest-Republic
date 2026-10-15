# Delhi environment assets

Original meshes created in Blender 5.2.2 LTS on `ssh uxserver`, using `build_delhi.py`. No marketplace assets or paid providers. Original PBR materials, modeled lettering, bevels, merged material meshes. All exported glTF coordinates Y-up, front +Z; origin ground-level, centered X/Z. Geometry dimensions intentionally compressed for playable scale.

| File | Approx envelope W x H x D, m | Draw calls | Triangles |
|---|---:|---:|---:|
| cp-colonnade.glb | 24.3 x 10.1 x 8 | 7 | 31,284 |
| misra-yantra.glb | 20 x 9.6 x 14 | 4 | 10,736 |
| delhi-bus.glb | 3.4 x 3.3 x 10.1 | 8 | 9,536 |
| chai-cart.glb | 3 x 3.1 x 1.9 | 7 | 3,816 |
| barricade.glb | 2.8 x 1.5 x .85 | 3 | 3,136 |

All GLBs together approximately 2.6 MB. Clone instances in runtime; materials are rough non-transparent surfaces for reliable web rendering. Bus front +Z. CP usable colonnade lies on +Z side with shop wall behind; rear is closed. No animated joints or collisions embedded. Runtime must supply collisions appropriate to actual individual columns and walls if movement through arcade is desired.

## Image reference provenance

References were inspected before modeling and retained in `references/` for design audit only. They are not embedded in shipped GLBs and should not be published as artwork without separate rights clearance.

- Delhi Misra Yantra photograph: https://www.india-a2z.com/images/misra.jpg ; contextual page https://www.india-a2z.com/jantar-mantar-delhi.html . Observed red curved walls, pale calibration rims, central and side stairs.
- Connaught Place colonnade photograph: https://www.mapsofindia.com/india-images/delhi/places-of-interest/connaught_place/Grand-pillars-at-inner-circle-CP.JPG ; contextual page https://www.mapsofindia.com/delhi/shopping-areas/connaught-place.html . Observed white Tuscan columns, round molded bases, deep shaded shopping arcade and repeating upper facade.

These are reference-informed stylizations, not surveyed reconstructions or photogrammetry. The arcade module is straight; arrangement around the game's circle supplies CP's curved urban rhythm. Bus/cart/barricade use original generic Delhi street vocabulary; no claim that any specific incident vehicle is replicated. Place names in text are descriptive, invented shop names are fictional.

## Render verification

`dist/assets/delhi-title.jpg` is a 1600x900 Cycles render of these exact meshes and was visually inspected: modeled columns, windows, bus features, chai kettle/cups, nested monument edges and stairs are visible. The asset showcase does not demonstrate runtime playability, animation or collision behavior. `render_establishing.py` produces a 3-second, 24fps, 960x540 camera orbit, encoded as `delhi-establishing.mp4` when complete. Saved editable scene: `delhi-assets.blend`.
