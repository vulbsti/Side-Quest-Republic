"""Vehicles and protest props for Side Quest Republic, built from scratch in Blender.

Run headless:  python3 build_props.py <out_dir> <texture_dir>   (bpy as a module)
Exports one GLB per asset. Conventions match assets-src/ASSETS.md: metres, glTF Y up,
front +Z (Blender -Y), origin on the ground at the centre. Named nodes that runtime
code animates or attaches to are kept as separate nodes:
  vajra:  'turret' (yaw about Y) -> 'nozzle' (pitch about X), 'nozzleTip' empty
  suv:    'flagMount' empty (front left wing)
  bike:   'flagMount' empty (rear carrier), 'seat' empty (rider hips)
  shield: 'grip' empty (hand position), lathi: 'grip' empty
All artwork is original (procedural textures from textures.py). No third-party assets.
"""
import bpy, bmesh, math, os, sys
from mathutils import Vector, Matrix

OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp/props'
TEX = sys.argv[2] if len(sys.argv) > 2 else '/tmp/tex'
os.makedirs(OUT, exist_ok=True)

MATS = {}
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    MATS.clear()

def mat(name, color, rough=0.6, metal=0.0, tex=None, alpha=False, emissive=None, clearcoat=0.0, transmission=0.0, opacity=1.0):
    key = name
    if key in MATS and MATS[key].name in bpy.data.materials: return MATS[key]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree; p = nt.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Roughness'].default_value = rough
    p.inputs['Metallic'].default_value = metal
    if clearcoat: p.inputs['Coat Weight'].default_value = clearcoat
    if emissive:
        p.inputs['Emission Color'].default_value = (*emissive, 1); p.inputs['Emission Strength'].default_value = 2.0
    if tex:
        img = bpy.data.images.load(os.path.join(TEX, tex)); img.pack()
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = img
        nt.links.new(t.outputs['Color'], p.inputs['Base Color'])
        if alpha:
            nt.links.new(t.outputs['Alpha'], p.inputs['Alpha'])
            m.surface_render_method = 'BLENDED' if hasattr(m, 'surface_render_method') else None
    if opacity < 1:
        p.inputs['Alpha'].default_value = opacity
        try: m.surface_render_method = 'BLENDED'
        except Exception: pass
    MATS[key] = m
    return m

def link(o):
    bpy.context.collection.objects.link(o); return o

def obj_from_bm(name, bm, material, smooth=False):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = link(bpy.data.objects.new(name, me))
    if material: me.materials.append(material)
    if smooth:
        for p in me.polygons: p.use_smooth = True
    return o

def bevel(o, w=0.03, seg=2, angle=40):
    m = o.modifiers.new('bevel', 'BEVEL'); m.width = w; m.segments = seg
    m.limit_method = 'ANGLE'; m.angle_limit = math.radians(angle)
    o.modifiers.new('wn', 'WEIGHTED_NORMAL')
    return o

def box(name, center, size, material, bev=0.02, seg=2):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
    for v in bm.verts: v.co = Vector((v.co.x * size[0], v.co.y * size[1], v.co.z * size[2])) + Vector(center)
    o = obj_from_bm(name, bm, material)
    if bev: bevel(o, bev, seg)
    return o

def spin(o, center, angle, axis='X'):
    """Rotate a part about its own centre (box/cyl bake the centre into the vertices, so
    rotation_euler would swing the part around the world origin)."""
    c = Vector(center)
    o.data.transform(Matrix.Translation(c) @ Matrix.Rotation(angle, 4, axis) @ Matrix.Translation(-c))


def cyl(name, center, r, depth, material, axis='Z', verts=24, bev=0.0, r2=None, smooth=True):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=verts, radius1=r, radius2=r if r2 is None else r2, depth=depth)
    rot = {'Z': Matrix(), 'X': Matrix.Rotation(math.pi / 2, 4, 'Y'), 'Y': Matrix.Rotation(math.pi / 2, 4, 'X')}[axis]
    bmesh.ops.transform(bm, matrix=Matrix.Translation(center) @ rot, verts=bm.verts)
    o = obj_from_bm(name, bm, material, smooth)
    if bev: bevel(o, bev, 2, 30)
    return o

def profile(name, pts, x0, x1, material, bev=0.03, seg=2):
    """Extrude a side profile [(y, z), ...] (counter-clockwise seen from +X) across x0..x1."""
    bm = bmesh.new()
    a = [bm.verts.new((x0, y, z)) for y, z in pts]
    b = [bm.verts.new((x1, y, z)) for y, z in pts]
    n = len(pts)
    bm.faces.new(list(reversed(a))); bm.faces.new(b)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((a[i], a[j], b[j], b[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = obj_from_bm(name, bm, material)
    if bev: bevel(o, bev, seg)
    return o

def plane(name, center, size, material, normal='X'):
    """Decal quad with UVs 0..1; normal axis +X/-X/+Y/-Y/+Z."""
    w, h = size
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new()
    if normal in ('X', '-X'):
        s = 1 if normal == 'X' else -1
        vs = [(0, -w / 2 * s, -h / 2), (0, w / 2 * s, -h / 2), (0, w / 2 * s, h / 2), (0, -w / 2 * s, h / 2)]
    elif normal in ('Y', '-Y'):
        s = 1 if normal == 'Y' else -1
        vs = [(w / 2 * s, 0, -h / 2), (-w / 2 * s, 0, -h / 2), (-w / 2 * s, 0, h / 2), (w / 2 * s, 0, h / 2)]
    else:
        vs = [(-w / 2, -h / 2, 0), (w / 2, -h / 2, 0), (w / 2, h / 2, 0), (-w / 2, h / 2, 0)]
    vv = [bm.verts.new(Vector(v) + Vector(center)) for v in vs]
    f = bm.faces.new(vv)
    for l, c in zip(f.loops, ((0, 0), (1, 0), (1, 1), (0, 1))): l[uv].uv = c
    return obj_from_bm(name, bm, material)

def wheel(name, center, r, width, tyre, rim, hub=None, spokes=0):
    parts = []
    t = cyl(name + ' tyre', center, r, width, tyre, axis='X', verts=32, bev=r * 0.18)
    parts.append(t)
    parts.append(cyl(name + ' rim', (center[0] + (width / 2 + 0.005) * (1 if center[0] > 0 else -1), center[1], center[2]), r * 0.62, 0.02, rim, axis='X', verts=24))
    if hub: parts.append(cyl(name + ' hub', (center[0] + (width / 2 + 0.02) * (1 if center[0] > 0 else -1), center[1], center[2]), r * 0.2, 0.05, hub, axis='X', verts=12))
    return parts

def empty(name, loc, parent=None):
    e = link(bpy.data.objects.new(name, None)); e.location = loc
    if parent: e.parent = parent
    return e

def join_by_material(objs, prefix):
    """Apply modifiers, join meshes that share a material (fewer draw calls)."""
    bpy.ops.object.select_all(action='DESELECT')
    meshes = [o for o in objs if o.type == 'MESH']
    dg = bpy.context.evaluated_depsgraph_get()
    for o in meshes:
        bpy.context.view_layer.objects.active = o
        for m in list(o.modifiers):
            try: bpy.ops.object.modifier_apply(modifier=m.name)
            except Exception: o.modifiers.remove(m)
    groups = {}
    for o in meshes: groups.setdefault(o.data.materials[0].name if o.data.materials else 'none', []).append(o)
    out = []
    for mname, parts in groups.items():
        bpy.ops.object.select_all(action='DESELECT')
        for o in parts: o.select_set(True)
        bpy.context.view_layer.objects.active = parts[0]
        if len(parts) > 1: bpy.ops.object.join()
        o = bpy.context.view_layer.objects.active; o.name = f'{prefix} / {mname}'
        out.append(o)
    return out

def export(name, roots=None):
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, name + '.glb'), export_format='GLB', use_selection=False,
                              export_apply=True, export_yup=True, export_extras=True, export_animations=False)
    print('exported', name)

# ------------------------------------------------------------------ palettes
def palette():
    MATS.clear()
    return dict(
        white=mat('Police white paint', (0.86, 0.87, 0.86), 0.32, 0.0, clearcoat=0.4),
        blue=mat('Police blue paint', (0.03, 0.12, 0.42), 0.35, clearcoat=0.4),
        glass=mat('Tinted glass', (0.02, 0.03, 0.035), 0.06, 0.0),
        rubber=mat('Tyre rubber', (0.022, 0.022, 0.022), 0.85),
        steel=mat('Dull steel', (0.42, 0.43, 0.43), 0.35, 0.9),
        chrome=mat('Chrome', (0.8, 0.8, 0.8), 0.12, 1.0),
        dark=mat('Chassis black', (0.03, 0.03, 0.032), 0.7),
        grille=mat('Mesh guard', (0.08, 0.08, 0.085), 0.5, 0.6),
        red=mat('Lamp red', (0.6, 0.02, 0.02), 0.3, emissive=(0.4, 0, 0)),
        lblue=mat('Lamp blue', (0.02, 0.1, 0.7), 0.3, emissive=(0, 0.05, 0.5)),
        lamp=mat('Headlamp', (0.9, 0.9, 0.85), 0.1, emissive=(0.4, 0.4, 0.35)),
        amber=mat('Indicator amber', (0.9, 0.45, 0.02), 0.3),
    )

# ------------------------------------------------------------------ Vajra water cannon
def build_vajra():
    reset(); P = palette()
    o = []
    L_cab, W = 2.1, 2.45
    # chassis + bumpers (front is -Y)
    o.append(box('chassis', (0, 0.2, 0.62), (1.0, 7.4, 0.28), P['dark'], 0.01))
    o.append(box('front bumper', (0, -3.95, 0.62), (2.5, 0.22, 0.36), P['dark'], 0.03))
    o.append(box('rear bumper', (0, 4.05, 0.62), (2.4, 0.2, 0.3), P['dark'], 0.03))
    # cab: armoured, slightly raked windscreen
    cab = [(-3.85, 0.85), (-3.85, 1.65), (-3.6, 2.75), (-1.75, 2.8), (-1.75, 0.85)]
    o.append(profile('cab', cab, -W / 2, W / 2, P['white'], 0.06, 3))
    # windscreen and side windows (inset glass), with mesh guards
    o.append(profile('windscreen', [(-3.87, 1.78), (-3.65, 2.62), (-3.63, 2.62), (-3.85, 1.78)], -1.0, 1.0, P['glass'], 0))
    for x in (-W / 2 - 0.01, W / 2 + 0.01):
        o.append(box('cab side window', (x, -2.7, 2.15), (0.02, 0.9, 0.62), P['glass'], 0))
        for k in range(7):
            o.append(box('side guard bar', (x * 1.012, -3.12 + k * 0.14, 2.15), (0.025, 0.02, 0.7), P['grille'], 0))
    for k in range(13):
        z = 1.8 + k * 0.065
        y = -3.87 + (z - 1.78) * (0.22 / 0.84) - 0.04
        o.append(box('windscreen guard', (0, y, z), (2.05, 0.02, 0.018), P['grille'], 0))
    for k in range(9):
        o.append(profile('guard upright', [(-3.92, 1.76), (-3.69, 2.66), (-3.67, 2.66), (-3.9, 1.76)], -1.0 + k * 0.25 - 0.012, -1.0 + k * 0.25 + 0.012, P['grille'], 0))
    # grille, lamps
    o.append(box('front grille', (0, -3.865, 1.15), (1.5, 0.04, 0.42), P['grille'], 0.01))
    for x in (-0.95, 0.95):
        o.append(cyl('headlamp', (x, -3.88, 1.15), 0.12, 0.06, P['lamp'], axis='Y'))
        o.append(box('indicator', (x * 1.12, -3.87, 1.42), (0.14, 0.04, 0.07), P['amber'], 0.01))
    # roof light bar
    o.append(box('lightbar base', (0, -2.8, 2.84), (1.3, 0.28, 0.06), P['dark'], 0.01))
    o.append(box('lightbar red', (-0.33, -2.8, 2.92), (0.6, 0.24, 0.1), P['red'], 0.02))
    o.append(box('lightbar blue', (0.33, -2.8, 2.92), (0.6, 0.24, 0.1), P['lblue'], 0.02))
    # body: tank + armour box behind cab
    body = [(-1.6, 0.85), (-1.6, 2.95), (-1.45, 3.1), (3.85, 3.1), (3.95, 2.95), (3.95, 0.85)]
    o.append(profile('body', body, -W / 2 - 0.02, W / 2 + 0.02, P['white'], 0.07, 3))
    # blue livery band and panel ribs
    for x in (-W / 2 - 0.035, W / 2 + 0.035):
        o.append(box('blue band', (x, 1.15, 1.55), (0.02, 5.4, 0.32), P['blue'], 0))
        o.append(box('cab blue band', (x, -2.8, 1.55), (0.02, 2.0, 0.32), P['blue'], 0))
        for k in range(6):
            o.append(box('armour rib', (x * 1.005, -1.2 + k * 0.98, 2.35), (0.03, 0.05, 1.1), P['white'], 0.01))
        for k in range(3):
            o.append(box('vision slit', (x * 1.01, -0.6 + k * 1.6, 2.6), (0.02, 0.5, 0.12), P['glass'], 0))
        o.append(box('mudguard', (x * 0.98, -2.75, 1.05), (0.3, 1.3, 0.06), P['dark'], 0.02))
        o.append(box('rear mudguard', (x * 0.98, 2.35, 1.05), (0.3, 2.3, 0.06), P['dark'], 0.02))
        o.append(cyl('fuel tank', (x * 0.62, -0.9, 0.75), 0.25, 0.9, P['steel'], axis='Y', verts=16))
    # decals
    pol = mat('Decal DELHI POLICE', (1, 1, 1), 0.5, tex='decal-delhi-police.png', alpha=True)
    polhi = mat('Decal Delhi Police Hindi', (1, 1, 1), 0.5, tex='decal-police-hi.png', alpha=True)
    vaj = mat('Decal VAJRA', (1, 1, 1), 0.5, tex='decal-vajra.png', alpha=True)
    o.append(plane('decal police R', (W / 2 + 0.05, 1.2, 2.0), (3.6, 0.56), pol, 'X'))
    o.append(plane('decal police L', (-W / 2 - 0.05, 1.2, 2.0), (3.6, 0.56), pol, '-X'))
    o.append(plane('decal hindi R', (W / 2 + 0.05, 1.2, 1.16), (2.4, 0.5), polhi, 'X'))
    o.append(plane('decal hindi L', (-W / 2 - 0.05, 1.2, 1.16), (2.4, 0.5), polhi, '-X'))
    o.append(plane('decal vajra front', (0, -3.89, 1.52), (1.4, 0.27), vaj, '-Y'))
    o.append(plane('decal vajra rear', (0, 3.97, 2.4), (1.6, 0.3), vaj, 'Y'))
    # rear ladder + door
    o.append(box('rear door', (0, 3.96, 1.9), (1.0, 0.03, 1.7), P['white'], 0.02))
    for k in range(6):
        o.append(box('ladder rung', (0.85, 4.0, 1.0 + k * 0.33), (0.4, 0.04, 0.035), P['steel'], 0))
    # wheels: front + tandem rear
    for y in (-2.75, 1.85, 2.95):
        for x in (-1.08, 1.08):
            o += wheel('wheel', (x, y, 0.52), 0.52, 0.36, P['rubber'], P['steel'], P['dark'])
    parts = join_by_material(o, 'Vajra')
    # turret: separate nodes. Pivot at the base centre on the roof.
    tur_parts = [cyl('turret base', (0, 0, 0.12), 0.42, 0.24, P['white'], verts=32, bev=0.03),
                 box('turret housing', (0, 0.05, 0.42), (0.6, 0.7, 0.36), P['white'], 0.06, 3),
                 box('turret window', (0, -0.31, 0.46), (0.4, 0.02, 0.12), P['glass'], 0)]
    turret_mesh = join_by_material(tur_parts, 'Vajra turret')
    turret = empty('turret', (0, -0.8, 3.1))
    for t in turret_mesh: t.parent = turret
    noz_parts = [cyl('nozzle barrel', (0, -0.55, 0), 0.07, 1.1, P['steel'], axis='Y', verts=16),
                 cyl('nozzle tip', (0, -1.15, 0), 0.1, 0.14, P['dark'], axis='Y', verts=16, r2=0.06),
                 cyl('nozzle trunnion', (0, 0, 0), 0.12, 0.42, P['dark'], axis='X', verts=16)]
    nozzle_mesh = join_by_material(noz_parts, 'Vajra nozzle')
    nozzle = empty('nozzle', (0, -0.15, 0.45), turret)
    for n in nozzle_mesh: n.parent = nozzle
    empty('nozzleTip', (0, -1.25, 0), nozzle)
    export('vajra')

# ------------------------------------------------------------------ White party SUV
def build_suv():
    reset(); P = palette()
    white = mat('Pearl white paint', (0.9, 0.9, 0.88), 0.25, clearcoat=0.8)
    clad = mat('Black cladding', (0.035, 0.035, 0.035), 0.75)
    o = []
    W = 1.82
    body = [(-2.25, 0.42), (-2.28, 0.78), (-2.2, 1.05), (-1.25, 1.12), (-0.95, 1.18), (1.95, 1.2), (2.22, 1.08), (2.25, 0.42)]
    o.append(profile('lower body', body, -W / 2, W / 2, white, 0.08, 3))
    cabin = [(-0.95, 1.17), (-0.25, 1.82), (1.9, 1.86), (2.1, 1.75), (2.18, 1.18)]
    o.append(profile('cabin', cabin, -W / 2 + 0.07, W / 2 - 0.07, white, 0.06, 3))
    # glass: windscreen, side windows, rear
    o.append(profile('windscreen', [(-0.9, 1.22), (-0.27, 1.76), (-0.25, 1.75), (-0.88, 1.21)], -0.78, 0.78, P['glass'], 0))
    for x in (-W / 2 + 0.065, W / 2 - 0.065):
        o.append(profile('side glass', [(-0.7, 1.26), (-0.2, 1.74), (1.85, 1.77), (2.0, 1.26)], x - 0.005, x + 0.005, P['glass'], 0))
        o.append(box('B pillar', (x * 1.01, 0.55, 1.5), (0.02, 0.09, 0.5), clad, 0))
        o.append(box('C pillar', (x * 1.01, 1.35, 1.5), (0.02, 0.09, 0.5), clad, 0))
        o.append(box('side cladding', (x * 1.06, 0.0, 0.52), (0.04, 3.2, 0.2), clad, 0.02))
        o.append(box('door handle', (x * 1.07, 0.15, 1.02), (0.02, 0.16, 0.03), P['chrome'], 0.005))
        o.append(box('door handle', (x * 1.07, 1.0, 1.02), (0.02, 0.16, 0.03), P['chrome'], 0.005))
        o.append(box('mirror', (x * 1.12, -0.7, 1.28), (0.08, 0.1, 0.13), white, 0.02))
        o.append(box('roof rail', (x * 0.88, 0.85, 1.9), (0.04, 2.2, 0.04), P['dark'], 0.01))
    o.append(profile('rear glass', [(2.12, 1.25), (2.14, 1.72), (2.16, 1.72), (2.14, 1.25)], -0.7, 0.7, P['glass'], 0))
    # face: grille, lamps, bull bar
    o.append(box('grille', (0, -2.27, 0.92), (1.0, 0.04, 0.22), P['dark'], 0.01))
    for k in range(5): o.append(box('grille slat', (0, -2.29, 0.84 + k * 0.04), (0.96, 0.02, 0.012), P['chrome'], 0))
    for x in (-0.68, 0.68):
        o.append(box('headlamp', (x, -2.25, 0.98), (0.32, 0.06, 0.13), P['lamp'], 0.02))
        o.append(box('tail lamp', (x * 1.22, 2.24, 1.05), (0.12, 0.04, 0.32), P['red'], 0.01))
    o.append(box('front bumper', (0, -2.3, 0.55), (1.82, 0.14, 0.22), clad, 0.04))
    o.append(box('rear bumper', (0, 2.3, 0.55), (1.82, 0.12, 0.2), clad, 0.04))
    for x in (-0.45, 0.45): o.append(box('bull bar upright', (x, -2.42, 0.78), (0.05, 0.05, 0.5), P['chrome'], 0.01))
    o.append(box('bull bar top', (0, -2.42, 1.03), (1.0, 0.05, 0.05), P['chrome'], 0.01))
    o.append(cyl('spare wheel', (0, 2.38, 1.05), 0.34, 0.22, P['rubber'], axis='Y', verts=24, bev=0.04))
    # plates and VIP sticker (fictional plate)
    vip = mat('Decal VIP', (1, 1, 1), 0.5, tex='decal-vip.png', alpha=True)
    o.append(plane('vip windscreen', (0.45, -0.835, 1.3), (0.24, 0.12), vip, '-Y'))
    o.append(plane('vip rear', (0, 2.16, 1.32), (0.3, 0.15), vip, 'Y'))
    plate = mat('Number plate', (0.95, 0.95, 0.92), 0.4)
    o.append(box('front plate', (0, -2.38, 0.55), (0.5, 0.01, 0.12), plate, 0))
    o.append(box('rear plate', (0, 2.37, 0.75), (0.5, 0.01, 0.12), plate, 0))
    for y in (-1.45, 1.45):
        for x in (-0.82, 0.82):
            o += wheel('wheel', (x, y, 0.38), 0.38, 0.26, P['rubber'], P['chrome'], P['dark'])
    join_by_material(o, 'SUV')
    # flag mount on the front left wing: short chrome rod; the flag attaches above it
    rod = cyl('flag rod', (0.78, -1.95, 1.3), 0.012, 0.36, P['chrome'], verts=8)
    empty('flagMount', (0.78, -1.95, 1.48))
    export('suv')

# ------------------------------------------------------------------ motorbike
def build_bike():
    reset(); P = palette()
    paint = mat('Bike tank red', (0.45, 0.02, 0.03), 0.3, clearcoat=0.6)
    seat = mat('Seat vinyl', (0.03, 0.03, 0.03), 0.55)
    o = []
    r = 0.3
    for y in (-0.66, 0.66):
        o.append(cyl('tyre', (0, y, r), r, 0.09, P['rubber'], axis='X', verts=32, bev=0.03))
        o.append(cyl('rim', (0, y, r), r * 0.78, 0.04, P['steel'], axis='X', verts=24))
        o.append(cyl('hub', (0, y, r), 0.07, 0.12, P['chrome'], axis='X', verts=12))
        for k in range(9):
            a = k * math.pi / 9
            sp = box('spoke', (0, y, r), (0.006, 0.006, r * 1.5), P['chrome'], 0)
            spin(sp, (0, y, r), a); o.append(sp)
    # frame / forks
    for x in (-0.07, 0.07):
        f = cyl('fork', (x, -0.58, 0.62), 0.022, 0.72, P['chrome'], verts=10); spin(f, (x, -0.58, 0.62), math.radians(-25)); o.append(f)
    down = cyl('down tube', (0, -0.18, 0.55), 0.03, 0.75, P['dark'], verts=10); spin(down, (0, -0.18, 0.55), math.radians(55)); o.append(down)
    o.append(box('engine', (0, -0.05, 0.4), (0.26, 0.42, 0.3), P['steel'], 0.04))
    o.append(box('engine cover', (0.14, -0.05, 0.4), (0.03, 0.3, 0.22), P['chrome'], 0.02))
    o.append(profile('tank', [(-0.42, 0.78), (-0.35, 0.95), (0.05, 0.92), (0.15, 0.8)], -0.15, 0.15, paint, 0.06, 3))
    o.append(profile('side panel', [(0.05, 0.55), (0.05, 0.8), (0.45, 0.82), (0.45, 0.6)], -0.13, 0.13, paint, 0.03))
    o.append(profile('seat', [(0.0, 0.82), (0.0, 0.9), (0.62, 0.92), (0.66, 0.84)], -0.13, 0.13, seat, 0.04, 3))
    o.append(box('rear carrier', (0, 0.72, 0.86), (0.2, 0.3, 0.02), P['dark'], 0.01))
    o.append(profile('rear mudguard', [(0.5, 0.62), (0.62, 0.7), (0.9, 0.55), (0.88, 0.5)], -0.06, 0.06, paint, 0.01))
    o.append(profile('front mudguard', [(-0.88, 0.5), (-0.8, 0.62), (-0.5, 0.63), (-0.48, 0.58)], -0.055, 0.055, paint, 0.01))
    o.append(cyl('exhaust', (0.16, 0.35, 0.33), 0.04, 0.75, P['chrome'], axis='Y', verts=12))
    o.append(cyl('handlebar', (0, -0.72, 1.02), 0.014, 0.68, P['chrome'], axis='X', verts=8))
    for x in (-0.31, 0.31): o.append(cyl('grip', (x, -0.72, 1.02), 0.02, 0.1, seat, axis='X', verts=8))
    o.append(cyl('headlamp', (0, -0.84, 0.92), 0.08, 0.1, P['lamp'], axis='Y', verts=16))
    o.append(box('headlamp cowl', (0, -0.8, 0.94), (0.2, 0.12, 0.18), paint, 0.04))
    for x in (-0.2, 0.2):
        m = cyl('mirror stalk', (x, -0.7, 1.12), 0.006, 0.2, P['chrome'], verts=6); o.append(m)
        o.append(box('mirror', (x * 1.1, -0.7, 1.23), (0.08, 0.02, 0.06), P['dark'], 0.01))
    o.append(box('tail lamp', (0, 0.82, 0.8), (0.1, 0.04, 0.05), P['red'], 0.01))
    plate = mat('Number plate', (0.95, 0.95, 0.92), 0.4)
    o.append(box('rear plate', (0, 0.9, 0.66), (0.2, 0.01, 0.12), plate, 0))
    join_by_material(o, 'Bike')
    empty('flagMount', (-0.1, 0.8, 0.88))
    empty('seat', (0, 0.25, 0.9))
    export('bike')

# ------------------------------------------------------------------ hand props
def build_shield():
    reset(); P = palette()
    poly = mat('Polycarbonate', (0.75, 0.8, 0.82), 0.08, opacity=0.45)
    raf = mat('Decal POLICE shield', (1, 1, 1), 0.5, tex='decal-police-hi.png', alpha=True)
    # curved riot shield 0.55 x 1.0 m, curved about the vertical axis; front faces -Y
    bm = bmesh.new(); N = 12
    w, h, depth = 0.56, 1.0, 0.07
    rows = []
    for zi in range(2):
        row = []
        for i in range(N + 1):
            u = i / N - 0.5
            row.append(bm.verts.new((u * w, -depth * (1 - (2 * u) ** 2), 0.0 if zi == 0 else h)))
        rows.append(row)
    for i in range(N):
        bm.faces.new((rows[0][i], rows[0][i + 1], rows[1][i + 1], rows[1][i]))
    o = obj_from_bm('shield', bm, poly, True)
    m = o.modifiers.new('thick', 'SOLIDIFY'); m.thickness = 0.006
    rim = []
    for x in (-w / 2, w / 2): rim.append(box('rim', (x, 0, h / 2), (0.012, 0.012, h), P['dark'], 0))
    rim.append(box('rim', (0, 0, 0.005), (w, 0.012, 0.012), P['dark'], 0))
    rim.append(box('rim', (0, 0, h - 0.005), (w, 0.012, 0.012), P['dark'], 0))
    rim.append(box('handle', (0, 0.06, 0.55), (0.03, 0.04, 0.16), P['dark'], 0.01))
    rim.append(box('arm strap', (0, 0.05, 0.75), (0.16, 0.02, 0.04), P['dark'], 0.005))
    rim.append(plane('shield text', (0, -depth - 0.008, 0.82), (0.44, 0.09), raf, '-Y'))
    join_by_material([o] + rim, 'Shield')
    empty('grip', (0, 0.06, 0.55))
    export('shield')

def build_lathi():
    reset()
    bamboo = mat('Bamboo lathi', (0.55, 0.38, 0.16), 0.55)
    band = mat('Lathi brass band', (0.6, 0.45, 0.15), 0.3, 0.9)
    o = [cyl('shaft', (0, 0, 0.6), 0.016, 1.2, bamboo, verts=12)]
    for z in (0.12, 0.42, 0.72, 1.02): o.append(cyl('node', (0, 0, z), 0.018, 0.012, bamboo, verts=12))
    o.append(cyl('cap', (0, 0, 1.19), 0.019, 0.03, band, verts=12))
    o.append(cyl('tip', (0, 0, 0.01), 0.019, 0.025, band, verts=12))
    o.append(cyl('grip tape', (0, 0, 0.12), 0.018, 0.16, mat('Grip leather', (0.12, 0.07, 0.04), 0.7), verts=12))
    join_by_material(o, 'Lathi')
    empty('grip', (0, 0, 0.12))
    export('lathi')

def build_helmet():
    reset(); P = palette()
    shell = mat('Helmet blue', (0.06, 0.12, 0.3), 0.35, clearcoat=0.5)
    visor = mat('Visor polycarbonate', (0.7, 0.75, 0.8), 0.05, opacity=0.35)
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=12, radius=0.135)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < -0.02], context='VERTS')
    bmesh.ops.scale(bm, vec=(0.95, 1.1, 1.0), verts=bm.verts)
    o = obj_from_bm('shell', bm, shell, True)
    s = o.modifiers.new('thick', 'SOLIDIFY'); s.thickness = 0.008
    parts = [o, cyl('brim', (0, 0, -0.02), 0.142, 0.02, P['dark'], verts=24)]
    parts[-1].scale = (0.95, 1.1, 1)
    # visor: front half-cylinder (front is -Y)
    bm = bmesh.new(); N = 12; rows = []
    for zi, z in enumerate((-0.15, 0.03)):
        row = []
        for i in range(N + 1):
            a = math.pi * (0.1 + 0.8 * i / N)
            row.append(bm.verts.new((math.cos(a) * 0.155, -math.sin(a) * 0.17, z)))
        rows.append(row)
    for i in range(N): bm.faces.new((rows[0][i], rows[0][i + 1], rows[1][i + 1], rows[1][i]))
    parts.append(obj_from_bm('visor', bm, visor, True))
    raf = mat('Decal RAF', (1, 1, 1), 0.5, tex='decal-raf.png', alpha=True)
    parts.append(plane('raf text', (0, 0.152, 0.06), (0.1, 0.05), raf, 'Y'))
    join_by_material(parts, 'Helmet')
    export('helmet')

def build_canister():
    reset(); P = palette()
    body = mat('Canister olive', (0.18, 0.2, 0.1), 0.55, 0.3)
    stripe = mat('Canister stripe', (0.7, 0.55, 0.05), 0.5)
    o = [cyl('body', (0, 0, 0.075), 0.032, 0.15, body, verts=16, bev=0.004),
         cyl('stripe', (0, 0, 0.11), 0.0325, 0.02, stripe, verts=16),
         cyl('cap', (0, 0, 0.155), 0.022, 0.012, P['steel'], verts=12)]
    for k in range(4):
        a = k * math.pi / 2
        o.append(cyl('vent', (math.cos(a) * 0.033, math.sin(a) * 0.033, 0.14), 0.005, 0.004, P['dark'], verts=6))
    join_by_material(o, 'Canister')
    empty('smoke', (0, 0, 0.16))
    export('canister')

def cloth_flag(name, texfile, w, h, swallowtail=False, pole_h=2.2, pole_mat=None):
    """Flag on a bamboo pole. Cloth gets a gentle wave baked in; UVs map the texture."""
    m = mat('Flag ' + name, (1, 1, 1), 0.85, tex=texfile)
    m.use_backface_culling = False
    bm = bmesh.new(); uv = bm.loops.layers.uv.new()
    NX, NZ = 16, 8
    grid = []
    for j in range(NZ + 1):
        row = []
        for i in range(NX + 1):
            u, v = i / NX, j / NZ
            x = u * w
            if swallowtail and u > 0.75:
                # cut a V-notch: pull the middle back
                notch = (u - 0.75) / 0.25 * (1 - abs(v - 0.5) * 2)
                x = (0.75 + 0.25 * (1 - notch)) * w if False else x - notch * 0.25 * w
            wave = math.sin(u * 2.6 * math.pi + v * 0.6) * 0.06 * u + math.sin(u * 5 * math.pi) * 0.015 * u
            sag = -0.05 * u * u * (1 - v)
            row.append(bm.verts.new((x, wave, pole_h - h + v * h + sag)))
        grid.append(row)
    for j in range(NZ):
        for i in range(NX):
            f = bm.faces.new((grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]))
            for l, (a, b) in zip(f.loops, ((i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1))):
                l[uv].uv = (a / NX, b / NZ)
    cloth = obj_from_bm('cloth', bm, m, True)
    pole = cyl('pole', (0, 0, pole_h / 2 + 0.05), 0.015, pole_h + 0.1, pole_mat or mat('Bamboo pole', (0.6, 0.46, 0.25), 0.6), verts=10)
    return [cloth, pole]

def build_flags():
    for name, tex, swallow in (('party', 'flag-party.png', False), ('sena', 'flag-sena.png', True), ('opp', 'flag-opp.png', False)):
        reset()
        objs = cloth_flag(name, tex, 0.9, 0.6, swallowtail=swallow)
        join_by_material(objs, 'Flag ' + name)
        empty('grip', (0, 0, 1.0))
        export('flag-' + name)
    # students: 4 placards on sticks in one file, each a separate node "placard0".."placard7"
    reset()
    paper = mat('Placard chart paper', (1, 1, 1), 0.9, tex='placards.png')
    paper.use_backface_culling = False
    stick = mat('Placard stick', (0.55, 0.42, 0.25), 0.7)
    for k in range(8):
        bm = bmesh.new(); uv = bm.loops.layers.uv.new()
        u0, v0 = (k % 4) / 4, 1 - (k // 4 + 1) / 2
        w, h = 0.5, 0.62
        vs = [bm.verts.new(p) for p in ((-w / 2, 0, 1.25), (w / 2, 0, 1.25), (w / 2, 0, 1.25 + h), (-w / 2, 0, 1.25 + h))]
        f = bm.faces.new(vs)
        for l, (a, b) in zip(f.loops, ((u0, v0), (u0 + .25, v0), (u0 + .25, v0 + .5), (u0, v0 + .5))): l[uv].uv = (a, b)
        board = obj_from_bm(f'placard board {k}', bm, paper)
        # front faces -Y (glTF +Z); bend slightly like card
        sol = board.modifiers.new('thick', 'SOLIDIFY'); sol.thickness = 0.004
        st = cyl(f'placard stick {k}', (0, 0.01, 0.8), 0.012, 1.15, stick, verts=8)
        parts = join_by_material([board, st], f'Placard {k}')
        e = empty(f'placard{k}', (k * 0.7 - 2.45, 0, 0))
        for p in parts: p.parent = e; p.location = (0, 0, 0) if False else p.location
    export('placards')

if __name__ == '__main__':
    which = sys.argv[3].split(',') if len(sys.argv) > 3 else ['vajra', 'suv', 'bike', 'shield', 'lathi', 'helmet', 'canister', 'flags']
    for w in which: globals()['build_' + w]()
