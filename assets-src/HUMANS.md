# People: Delhi protest crowd

Runtime: `dist/characters.js` + `dist/assets/people/people-m.glb` (male skeleton) and `people-f.glb` (female skeleton).
Each GLB holds one MPFB skeleton, several complete outfit variants (one skinned mesh with three materials: skin,
cloth atlas, hair) plus a collapse-decimated `.lod1` copy of each, and 15 retargeted CMU mocap clips. Sources and
licences: `PROVENANCE.md`. Contact sheets: `docs/screens/assets/`.

## Variants

| Variant | Body | kind | Look |
|---|---|---|---|
| student-tee | m | civilian | oversized yellow "DELHI 6" tee, jeans, white sneakers |
| student-hoodie | m | civilian | grey hoodie (hood roll), black joggers |
| student-kurta | m | civilian | short block-print kurta over jeans, jhola bag |
| uncle | m | civilian | tucked check shirt, grey trousers, belt, glasses, grey hair, moustache |
| vendor | m | civilian | kurta-pyjama, red-white gamchha on the shoulder, moustache |
| party-worker | m | party | white kurta-pyjama, saffron-green RUP stole |
| sena | m | sena | black tee, saffron scarf, headband, tilak |
| constable | m | constable | Delhi Police khaki shirt/trousers, belt, peaked cap, moustache |
| raf | m | raf | RAF blue camouflage, belt, boots, helmet with raised visor (+ shield and lathi props at runtime) |
| student-tee-f | f | civilian | white "NO CHILL" tee, jeans |
| student-kurti | f | civilian | yellow block-print kurti over jeans, pink stole |
| aunty | f | civilian | maroon salwar kameez, orange dupatta over both shoulders |
| student-shirt-f | f | civilian | oversized green check shirt, dark jeans |

LOD0 31–37k triangles, LOD1 8.6–10.3k (switch at 16 m unless `important`).

## Clips (both skeletons; natural speed m/s male / female)

Idle 3.2 s, Walk 1.10 s (1.27 / 1.12), Run 0.73 s (3.10 / 2.73), Talk 4.0 s, Chant 2.0 s, Film 3.2 s, Lathi 2.2 s,
Shoved 1.6 s one-shot (travel 0.99 / 0.87 m/s backwards, removed from the clip), Duck 1.2 s one-shot, Sit 4.2 s (on the
ground), Dance 2.2 s, Push 1.4 s, Wave 0.6 s, Jump 1.7 s one-shot, Lie 1.0 s. Walk and Run start on the same gait
event, so one normalised phase drives both and the runtime blends them by speed.

## Build (all steps scripted; inputs in PROVENANCE.md)

1. `python build_people.py <out> all` (bpy 5.2 as a module, numpy/scipy/pillow): rebuilds each full body from
   MakeHuman base.obj + targets under the shipped skin, cuts garment shells from it (exact iso-line clips of limb
   and height fields, smoothed offsets that keep the body's weights/UVs), adds parametric parts (kurta skirts with
   slits, dupatta/scarf/strap strips weighted to the torso only, belts, caps, helmet, moustache, glasses), paints
   fabrics per texel from 3D position maps (denim, knit, cotton slub, checks, block print, camo), and exports
   `people-{m,f}.raw.glb` + LOD1.
2. `python3 clips.py <raw.glb> clips.json [preview_dir]`: numpy BVH FK, world-space delta retarget with aligned rest,
   loop-window search (pose + hip-drift cost), gait-phase alignment, seam distribution, ground offset, IK overlays
   (`overlays.py`), constant head-level fix.
3. `node add_animations.mjs <raw.glb> clips.json <out.glb> 1024` (gltf-transform, meshoptimizer, sharp; run from a
   folder with those packages installed): adds channels and clip metadata (scene extras), resamples, WebP 1024,
   meshopt. `PREVIEW=1` keeps PNG and plain geometry so Blender can import it for pose renders.
4. Checks: `node tests/test-assets.mjs`, `node tests/test-character-pose.mjs`, renders with `../render_sheet.py`, and
   `node ../pose_export.mjs out.obj [--bus]` to bake what `characters.js` actually shows into OBJ for Blender.

## Honest limits

- All men share one MPFB face and all women another; variety is skin tone, hair, accessories and clothes. From
  gameplay distance this reads as a varied crowd; in close-up dialogue it reads as siblings.
- Clothes are offset shells, not simulated cloth: no wrinkles beyond painted shading, kurta/dupatta panels are stiff,
  the kurti stole looks like a flat strip. The aunty's dupatta is plausible from the front, cape-like from behind.
- Fabrics are procedural; prints and checks read well, but nothing is photo-scanned.
- Mocap is real (CMU) but retargeted without foot IK: planted toes slip about 3–4 cm/s walking and 10–14 cm/s
  running (measured by the pose test). The Wave and Dance loop seams are visible if you watch for them.
- Hands are not posed per clip (except fists in Chant, phone grip in Film, palms in Push, curled grips for the
  lathi/shield).
