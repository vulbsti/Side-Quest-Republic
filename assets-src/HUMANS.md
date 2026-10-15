# Anatomical human characters

## Delivered runtime assets

`dist/characters.js` provides `await loadCharacters()`, synchronous `makeCharacter(options)` and `animateCharacter(root, speed, simulationTime, options)`. It uses the existing local Three.js and GLTFLoader. GLB meshes and texture objects are shared; each character gets an independent cloned skeleton, materials and animation mixer. No runtime network dependency.

- `dist/assets/humans/male.glb`: anatomically modeled adult, shirt/jeans, hair, eyes, eyebrows, shoes.
- `female.glb`: female body proportions, ponytail, short-sleeve shirt, jeans, shoes.
- `officer.glb`: male body, khaki collared shirt and trousers. Runtime adds cap and darkens shoes. Unarmed.
- `humans-review.jpg`: Blender render of all three, inspected after fixing arm rest-pose corrections.

Models contain roughly 27–30k triangles each, six material draws. Embedded textures have been reduced to 1024px, with JPEG opaque maps and PNG hair alpha. Assets together approximately 11MB. Thirty-one instances use approximately 850k triangles before shadows; real browser FPS remains the integrator's verification responsibility.

`makeCharacter` accepts `gender: 'male'|'female'`, `police`, `color`, `skin`, `backpack`, `hat`. With no gender it alternates some civilians for variety. `pants` retained in signature but clothing uses a shared shirt/jeans texture and is not independently recolored. Root transform semantics stay unchanged. Module `userData` contains the mixer/bones/actions; no changes are required from the game.

## Provenance and licensing

Bodies, topology, rig weights, skins, hair, eyes and clothes were created from **MakeHuman/MPFB 2.0.18** and the official **makehuman_system_assets CC0 pack**. The MPFB program is GPL, but the assets and exported models are explicitly CC0; program code is not bundled into the game. The runtime cloning and animation module is original project code.

Primary sources checked on 2026-10-15:

- MPFB asset/output license: https://github.com/makehumancommunity/mpfb2/blob/master/LICENSE.md
- Source release: https://github.com/makehumancommunity/mpfb2/tree/v2.0.18
- Official asset pack lists each system asset as CC0: https://static.makehumancommunity.org/assets/assetpacks/makehuman_system_assets.html
- Download used: https://files.makehumancommunity.org/asset_packs/makehuman_system_assets/makehuman_system_assets_cc0.zip

Used named system assets: `young_asian_male`, `young_asian_female`, `low-poly` eyes, `eyebrow001`, `short02`, `ponytail01`, `male_casualsuit02`, `female_casualsuit01`, `male_casualsuit03`, `shoes01`. Skin tint and clothing color variants are runtime art direction, not claims that models represent any particular real person or demographic.

The three.js Soldier, Michelle and Samba samples were downloaded and rendered for evaluation, then **rejected**: they were sci-fi armor, a cartoon, and a robot. They are not shipped, and their geometry or animation data is not used. This avoids claiming the three.js repository MIT license covers Mixamo source assets.

## Motion and limitations

Six original authored skeletal animation clips are embedded: Idle, Walk, Run, Wave, Carry and Jump. They rotate an anatomically fitted Mixamo-compatible skeleton, not rigid primitive limbs. Runtime crossfades clips and adjusts gait playback speed; talking and turns add small head/spine adjustments. These are hand-authored cycles, **not motion capture**. Full hand-object IK, foot-placement IK, facial lip sync, collision-aware cloth and photoreal facial acting are not implemented. These are textured game characters with natural proportions, not photoreal digital doubles.

Source build: `assets-src/create_humans.py`. Review scripts: `inspect_humans.py` (rejected candidates) and `review_humans.py` (final output). Build ran in unique remote `/tmp/sqr3d-humans` using authorized Blender on uxserver; exported model source .blend files remain there. Original photographs or third-party likenesses were not used.
