# Provenance: people, mocap, vehicles and protest props

Every third-party input to `dist/assets/people/*`, `dist/assets/props/*`, `dist/characters.js`, `dist/loop/models.js`
and `dist/vendor/meshopt_decoder.module.js`, with where it came from and its licence. Inputs were fetched 2026-10-19/20.
Everything else (garment geometry, fabrics, flags, placards, decals, vehicles, retargeting, runtime code) was written
or generated for this project by the scripts in `assets-src/people/` and `assets-src/props/`.

| Input | Source | Licence | Used for |
|---|---|---|---|
| MPFB 2.0.18 base characters `male.glb`, `female.glb`, `officer.glb` (moved from `dist/assets/humans/` to `assets-src/people/base/`) | Built earlier for this project from MakeHuman/MPFB system assets (see `assets-src/HUMANS.md` history and `create_humans.py`) | CC0 (MakeHuman system assets and MPFB output) | Skeleton (joint names/rest pose), hair, eyebrows, eyes, shoes, skin texture, body shape weights |
| MakeHuman `base.obj` | https://raw.githubusercontent.com/makehumancommunity/makehuman/master/makehuman/data/3dobjs/base.obj (identical copy in mpfb2 `src/mpfb/data/3dobjs/base.obj`) | CC0 (MakeHuman data; see repo `LICENSE.md`, "assets ... CC0") | Full body mesh rebuilt under the clothes (the shipped GLBs had the covered skin deleted) |
| MakeHuman macro targets (`asian/caucasian/african-{male,female}-young`, `universal-{sex}-young-averagemuscle-minweight`, `{sex}-young-averagemuscle-averageweight-maxheight`) | https://raw.githubusercontent.com/makehumancommunity/makehuman/master/makehuman/data/targets/macrodetails/ | CC0 | Re-applying the shipped bodies' morph weights (fit error 0.01 mm male, 1.4 mm female) |
| MPFB `weights.game_engine.json`, `rig.game_engine.json` | https://raw.githubusercontent.com/makehumancommunity/mpfb2/master/src/mpfb/data/rigs/standard/ | CC0 (MPFB data) | Skin weights of the rebuilt body, mapped to the shipped Mixamo-named skeleton |
| CMU Graphics Lab Motion Capture Database, BVH conversion by B. Hahne (cgspeed), mirrored by una-dinosauria/cmu-mocap | https://raw.githubusercontent.com/una-dinosauria/cmu-mocap/master/data/NNN/NN_NN.bvh ; database http://mocap.cs.cmu.edu/ | "Free to use for any purpose, commercial or not" (CMU readme; credit requested: "The data used in this project was obtained from mocap.cs.cmu.edu. The database was created with funding from NSF EIA-0196217.") | All 15 clips, see table below |
| Poly Haven HDRI `kloofendal_48d_partly_cloudy_puresky_1k.hdr` (already in `dist/assets/materials/`) | https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky | CC0 | Lighting for contact-sheet renders only |
| three.js r170 `examples/jsm/libs/meshopt_decoder.module.js` → `dist/vendor/meshopt_decoder.module.js` | https://raw.githubusercontent.com/mrdoob/three.js/r170/examples/jsm/libs/meshopt_decoder.module.js | MIT (meshoptimizer, (c) Arseny Kapoulkine; header kept in file) | Runtime decoding of EXT_meshopt_compression |
| GNU FreeFont FreeSansBold / FreeSerifBold (system fonts, not shipped) | Debian `fonts-freefont-ttf` | GPLv3 with font exception (rasterised text in images is not a derivative font) | Lettering painted into flag/placard/decal/tee-print textures |
| gltf-transform 4, meshoptimizer, sharp (build tools only, not shipped) | npm | MIT / MIT / Apache-2.0 | Animation merge, WebP and meshopt compression |
| Blender 5.2 (`bpy` module, build tool only) | pypi `bpy` | GPL (outputs are not covered) | Mesh assembly, glTF export, Cycles renders |

Rejected (not used, nothing derived): Ready Player Me animation library (licence forbids use with non-RPM avatars);
three.js `Xbot.glb` / Soldier / Michelle samples (Mixamo-derived, licence unclear).

## Mocap takes per clip

| Clip | CMU take | Seconds used | Description in the CMU index |
|---|---|---|---|
| Idle | 15_04 | 2.53–5.72 | subject 15, everyday behaviours, standing segment |
| Walk | 35_01 | 1.23–2.35 | walk |
| Run | 35_17 | 0.23–0.98 | run/jog |
| Talk | 18_08 | 4.38–8.38 | conversation gestures |
| Chant | 15_04 + hand-keyed fist-pump overlay (IK) | 2.25–4.17 | |
| Film | 15_04 + hand-keyed phone-up overlay (IK) | 2.53–5.72 | |
| Lathi | 02_07 | 6.07–8.27 | swordplay/stick swing |
| Shoved | 23_12 | 0.80–2.40 | pushed, stagger back (one-shot) |
| Duck | 77_09 | 1.50–2.75 | duck/cover (one-shot) |
| Sit | 82_05 | 2.07–6.27 | sitting on the ground |
| Dance | 111_05 | 5.27–7.48 | dance |
| Push | 81_05 + hand-keyed palms-forward overlay (IK) | 7.87–9.30 | pushing a heavy object |
| Wave | 13_26 | 1.60–2.20 | waving / directing traffic |
| Jump | 13_39 | 0.45–2.20 | jump (one-shot) |
| Lie | 77_18 | 0.10–1.10 | lying on the back |

Exact windows are re-chosen by `clips.py` (best loop seam); the values above are from the committed build and are
also stored per clip in each GLB's scene extras (`scene.userData.clips[name].source/window`).

## Real-world references

Uniform colours (Delhi Police khaki, RAF blue camouflage, white Vajra water cannon with blue stripe, DTC green bus)
are generic public-sector liveries painted from memory of news photographs; no photographs are embedded. Party
names RUP, DRS and LJM and their flags are fictional. Place and institution names on decals ("DELHI POLICE",
"दिल्ली पुलिस", "RAF") identify uniformed services in the fiction; no real person's likeness is used. All people
share the MPFB CC0 faces.
