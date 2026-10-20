"""Render a contact sheet of GLB assets with Cycles on the CPU.

usage: python3 render_sheet.py config.json
config: {"out": "x.png", "res": [1600, 900], "samples": 48,
         "camera": {"loc": [x,y,z], "target": [x,y,z], "lens": 50} (Blender Z-up coords),
         "hdri": "path.hdr" (optional), "sun": true,
         "items": [{"glb": "a.glb", "loc": [x,y,z], "rot": deg_about_Z, "scale": 1,
                    "action": "Walk", "frame": 0.3 (fraction of clip), "hide": ["mesh name substr"],
                    "show": ["mesh name substr"] (only these meshes)}]}
        an item may give "obj" (Y-up OBJ path) instead of "glb".
"""
import bpy, json, math, sys, os
from mathutils import Vector

cfg = json.load(open(sys.argv[-1]))
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
for it in cfg['items']:
    before = set(bpy.data.objects); acts_before = set(bpy.data.actions)
    if 'obj' in it:  # Y-up OBJ (e.g. pose_export.mjs output)
        bpy.ops.wm.obj_import(filepath=it['obj'], forward_axis='NEGATIVE_Z', up_axis='Y')
    else:
        bpy.ops.import_scene.gltf(filepath=it['glb'])
    new = [o for o in bpy.data.objects if o not in before]
    roots = [o for o in new if o.parent is None]
    holder = bpy.data.objects.new('holder', None); scene.collection.objects.link(holder)
    for r in roots: r.parent = holder
    holder.location = it.get('loc', (0, 0, 0))
    holder.rotation_euler = (0, 0, math.radians(it.get('rot', 0)))
    holder.scale = [it.get('scale', 1)] * 3
    for o in new:
        if o.type != 'MESH': continue
        if 'show' in it and not any(s in o.name for s in it['show']): o.hide_render = True
        if any(s in o.name for s in it.get('hide', [])): o.hide_render = True
    arm = next((o for o in new if o.type == 'ARMATURE'), None)
    if arm and it.get('action'):
        mine = [a for a in bpy.data.actions if a not in acts_before]  # actions from this import only
        act = next((a for a in mine if a.name == it['action']), None) or next((a for a in mine if a.name.startswith(it['action'])), None)
        if act:
            arm.animation_data_create(); arm.animation_data.action = act
            if getattr(arm.animation_data, 'action_slot', None) is None and hasattr(act, 'slots') and len(act.slots):
                arm.animation_data.action_slot = act.slots[0]
            f0, f1 = act.frame_range
            it['_frame'] = f0 + (f1 - f0) * it.get('frame', 0.0)
            it['_arm'] = arm
    elif arm:
        if arm.animation_data: arm.animation_data.action = None
        for pb in arm.pose.bones: pb.matrix_basis.identity()

# pose evaluation: frame per armature is not possible globally, so bake each pose
for it in cfg['items']:
    if '_arm' in it:
        scene.frame_set(int(it['_frame']), subframe=it['_frame'] % 1)
        arm = it['_arm']
        # freeze: copy pose to basis by removing action after evaluation
        mats = {pb.name: pb.matrix_basis.copy() for pb in arm.pose.bones}
        arm.animation_data.action = None
        for pb in arm.pose.bones: pb.matrix_basis = mats[pb.name]

# ground
bpy.ops.mesh.primitive_plane_add(size=200)
g = bpy.context.object
gm = bpy.data.materials.new('ground'); gm.use_nodes = True
gm.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = cfg.get('ground', (0.42, 0.40, 0.37, 1))
gm.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = 0.9
g.data.materials.append(gm)

world = bpy.data.worlds.new('w'); scene.world = world; world.use_nodes = True
bg = world.node_tree.nodes['Background']
if cfg.get('hdri') and os.path.exists(cfg['hdri']):
    env = world.node_tree.nodes.new('ShaderNodeTexEnvironment'); env.image = bpy.data.images.load(cfg['hdri'])
    world.node_tree.links.new(env.outputs['Color'], bg.inputs['Color']); bg.inputs['Strength'].default_value = cfg.get('hdri_strength', 0.8)
else:
    bg.inputs['Color'].default_value = (0.6, 0.65, 0.75, 1); bg.inputs['Strength'].default_value = 0.6
if cfg.get('sun', True):
    sd = bpy.data.lights.new('sun', 'SUN'); sd.energy = cfg.get('sun_energy', 3.5); sd.angle = math.radians(3)
    so = bpy.data.objects.new('sun', sd); scene.collection.objects.link(so)
    so.rotation_euler = [math.radians(a) for a in cfg.get('sun_rot', (50, 0, 35))]

cam = bpy.data.cameras.new('cam'); cam.lens = cfg['camera'].get('lens', 50)
if cfg['camera'].get('ortho'):
    cam.type = 'ORTHO'; cam.ortho_scale = cfg['camera']['ortho']
co = bpy.data.objects.new('cam', cam); scene.collection.objects.link(co); scene.camera = co
co.location = cfg['camera']['loc']
d = Vector(cfg['camera']['target']) - Vector(co.location)
co.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()

scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = cfg.get('samples', 48)
scene.cycles.use_denoising = True
try: scene.cycles.denoiser = 'OPENIMAGEDENOISE'
except Exception: pass
scene.render.resolution_x, scene.render.resolution_y = cfg.get('res', (1600, 900))
scene.render.resolution_percentage = 100
try: scene.view_settings.view_transform = 'AgX'
except Exception: pass
scene.render.filepath = cfg['out']
scene.render.image_settings.file_format = 'PNG'
bpy.ops.render.render(write_still=True)
print('rendered', cfg['out'])
