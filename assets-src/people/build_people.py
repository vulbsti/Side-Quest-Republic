"""Build the people GLBs: one per skeleton (male, female), each holding several
complete outfit variants as single skinned meshes (3 materials: skin, cloth atlas,
hair) on the shared MPFB skeleton.

Run with bpy as a Python module (Blender 5.2):
  python build_people.py <out_dir> [male|female|all] [variant,...]
Writes <out_dir>/people-m.raw.glb / people-f.raw.glb (no animation) and atlas PNGs;
add_animations.mjs merges the mocap clips and compresses.
"""
import sys, os, json, math
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import numpy as np
from PIL import Image
import garments as G
import fabric as Fb
import uvpaint
from body import Rig
import variants as VAR

OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp/people'
WHICH = sys.argv[2] if len(sys.argv) > 2 else 'all'
ONLY = sys.argv[3].split(',') if len(sys.argv) > 3 else None
TEX = os.environ.get('TEX_DIR', '/home/claude/sq/tex')
os.makedirs(OUT, exist_ok=True)
AW, AH = 2048, 1024
LOD_RATIO = float(os.environ.get('LOD_RATIO', '0.28'))


def paint_atlas(parts, path):
    """parts: list of (Mesh, paint_fn). Mesh.UV already in atlas space (v up)."""
    img = np.zeros((AH, AW, 3), np.float32); mask = np.zeros((AH, AW), bool)
    for m, fn, extra in parts:
        if fn is None: continue
        keys = ['s_arm', 's_leg', 'arm', 'leg', 'y']
        cols = [m.P, m.N] + [m.S.get(k, np.zeros(len(m.P)))[:, None] for k in keys]
        if 'uvl' in m.S: cols.append(m.S['uvl'])
        attrs = np.concatenate(cols, 1)
        ac = attrs[m.T].reshape(-1, attrs.shape[1]); uvc = m.UV.reshape(-1, 2)
        tris = np.arange(len(uvc)).reshape(-1, 3)
        mk, mp = uvpaint.rasterize(uvc, tris, ac, AW, AH)
        sel = mk
        t = {'pos': mp[sel][:, 0:3], 'nrm': mp[sel][:, 3:6]}
        for i, k in enumerate(keys): t[k] = mp[sel][:, 6 + i]
        if 'uvl' in m.S: t['uvl'] = mp[sel][:, 6 + len(keys):8 + len(keys)]
        nn = np.linalg.norm(t['nrm'], axis=1, keepdims=True); nn[nn == 0] = 1; t['nrm'] = t['nrm'] / nn
        img[sel] = fn(t)
        mask |= sel
    for m, fn, extra in parts:
        if extra is not None:  # pasted texture: (image path, rect)
            src, rect = extra
            u0, v0, u1, v1 = rect
            x0, x1 = int(u0 * AW), int(u1 * AW); y0, y1 = int((1 - v1) * AH), int((1 - v0) * AH)
            im = Image.open(src).convert('RGB').resize((x1 - x0, y1 - y0), Image.LANCZOS)
            img[y0:y1, x0:x1] = np.asarray(im, np.float32) / 255; mask[y0:y1, x0:x1] = True
    img = uvpaint.dilate(img, mask, 6)
    Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).save(path)


def hair_atlas(rig, path):
    """Hair (top 3/4) + eyebrows (bottom 1/4) RGBA atlas, shared by all variants of a rig."""
    import mhbody
    b, j, off = mhbody.glb_json(rig.glb)
    def img_named(part):
        for im in j['images']:
            if part in im['name']:
                bv = j['bufferViews'][im['bufferView']]
                import io
                return Image.open(io.BytesIO(b[off + bv.get('byteOffset', 0): off + bv.get('byteOffset', 0) + bv['byteLength']])).convert('RGBA')
        raise KeyError(part)
    hair = img_named('short02' if rig.sex == 'male' else 'ponytail01')
    brow = img_named('eyebrow001')
    eye = img_named('brown_eye')
    skin = img_named('young_lightskinned')
    shoes = img_named('shoes01_diffuse')
    at = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
    at.paste(hair.resize((1024, 768), Image.LANCZOS), (0, 0))
    at.paste(brow.resize((1024, 256), Image.LANCZOS), (0, 768))
    at.save(path)
    return {'eye': eye, 'skin': skin, 'shoes': shoes}


class Slots:
    """Allocator for the right half of the cloth atlas (u 0.5..1), 8x4 slots of 256 px."""
    def __init__(self): self.used = np.zeros((4, 8), bool)
    def take(self, w=1, h=1):
        for row in range(4 - h + 1):
            for col in range(8 - w + 1):
                if not self.used[row:row + h, col:col + w].any():
                    self.used[row:row + h, col:col + w] = True
                    return (0.5 + col * 0.0625, 1 - (row + h) * 0.25, 0.5 + (col + w) * 0.0625, 1 - row * 0.25)
        raise AssertionError('atlas full')


def remap_uv(m, rect, src_rect=(0, 0, 1, 1)):
    u0, v0, u1, v1 = rect; s0, t0, s1, t1 = src_rect
    uv = m.UV.copy()
    uv[..., 0] = u0 + (uv[..., 0] - s0) / (s1 - s0) * (u1 - u0)
    uv[..., 1] = v0 + (uv[..., 1] - t0) / (t1 - t0) * (v1 - v0)
    m.UV = uv
    return m


# ------------------------------------------------------------------ Blender side
def blender_build(rigs_out):
    import bpy
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for sex, (rig, variants, shared) in rigs_out.items():
        bpy.ops.wm.read_factory_settings(use_empty=True)
        bpy.ops.import_scene.gltf(filepath=rig.glb)
        arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
        for o in list(bpy.data.objects):
            if o.type != 'ARMATURE': bpy.data.objects.remove(o, do_unlink=True)
        for a in list(bpy.data.actions): bpy.data.actions.remove(a)
        if arm.animation_data: arm.animation_data_clear()
        for pb in arm.pose.bones: pb.matrix_basis.identity()
        arm.name = 'Skeleton'
        imgs = {}
        def image(path):
            if path not in imgs:
                imgs[path] = bpy.data.images.load(path); imgs[path].pack()
            return imgs[path]
        def material(name, path, color=(1, 1, 1), rough=0.8, alpha=False, metal=0.0):
            m = bpy.data.materials.new(name); m.use_nodes = True
            nt = m.node_tree; p = nt.nodes['Principled BSDF']
            p.inputs['Roughness'].default_value = rough; p.inputs['Metallic'].default_value = metal
            tx = nt.nodes.new('ShaderNodeTexImage'); tx.image = image(path)
            if color != (1, 1, 1):
                mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'
                mix.inputs['Factor'].default_value = 1.0
                nt.links.new(tx.outputs['Color'], mix.inputs['A']); mix.inputs['B'].default_value = (*color, 1)
                nt.links.new(mix.outputs['Result'], p.inputs['Base Color'])
            else:
                nt.links.new(tx.outputs['Color'], p.inputs['Base Color'])
            if alpha:
                nt.links.new(tx.outputs['Alpha'], p.inputs['Alpha'])
                m.blend_method = 'CLIP' if hasattr(m, 'blend_method') else None
                try: m.surface_render_method = 'DITHERED'
                except Exception: pass
                m.use_backface_culling = False
            return m
        for v in variants:
            mats = [material(f'{v.name}.skin', shared['skin_path'], v.skin, 0.55),
                    material(f'{v.name}.cloth', v.atlas_path, (1, 1, 1), 0.85),
                    material(f'{v.name}.hair', v.hair_path, v.hair, 0.6, alpha=True)]
            mesh = v.mesh
            me = bpy.data.meshes.new(v.name)
            P = mesh.P[:, [0, 2, 1]] * np.array([1, -1, 1])  # glTF -> Blender
            me.vertices.add(len(P)); me.vertices.foreach_set('co', P.ravel())
            nt = len(mesh.T)
            me.loops.add(nt * 3); me.loops.foreach_set('vertex_index', mesh.T.ravel())
            me.polygons.add(nt); me.polygons.foreach_set('loop_start', np.arange(nt) * 3); me.polygons.foreach_set('loop_total', np.full(nt, 3))
            me.polygons.foreach_set('material_index', mesh.S['mat_face'].astype(int) if 'mat_face' in mesh.S else v.face_mat)
            uv = me.uv_layers.new(name='UVMap'); uv.data.foreach_set('uv', mesh.UV.reshape(-1, 2).ravel())
            me.validate(clean_customdata=False)
            me.update(calc_edges=True)
            me.polygons.foreach_set('use_smooth', np.ones(nt, bool))
            for m in mats: me.materials.append(m)
            ob = bpy.data.objects.new(v.name, me); bpy.context.collection.objects.link(ob)
            ob.parent = arm
            mod = ob.modifiers.new('Armature', 'ARMATURE'); mod.object = arm
            groups = [ob.vertex_groups.new(name=b) for b in rig.bones]
            W = mesh.W
            for bi, g in enumerate(groups):
                idx = np.nonzero(W[:, bi] > 1e-4)[0]
                for i in idx: g.add([int(i)], float(W[i, bi]), 'REPLACE')
            ob['variant'] = v.name
            ob['kind'] = v.kind
            ob['label'] = v.label
            ob['lod'] = 0
            # LOD1 for crowds: collapse-decimated copy, same skeleton, materials and weights
            me2 = me.copy(); me2.name = v.name + '.lod1'
            ob2 = bpy.data.objects.new(v.name + '.lod1', me2); bpy.context.collection.objects.link(ob2)
            for g in ob.vertex_groups: ob2.vertex_groups.new(name=g.name)
            # vertex group weights live on the mesh, so the copy already carries them
            dec = ob2.modifiers.new('Decimate', 'DECIMATE'); dec.ratio = LOD_RATIO; dec.use_collapse_triangulate = True
            dec.use_symmetry = True; dec.symmetry_axis = 'X'
            with bpy.context.temp_override(object=ob2, active_object=ob2, selected_objects=[ob2]):
                bpy.ops.object.modifier_apply(modifier='Decimate')
            # collapse can push seam UVs a hair outside 0..1, which blocks UV quantisation
            uvd = me2.uv_layers[0].data; buf = np.zeros(len(uvd) * 2, np.float32); uvd.foreach_get('uv', buf)
            uvd.foreach_set('uv', np.clip(buf, 0.0, 1.0))
            ob2.parent = arm
            mod2 = ob2.modifiers.new('Armature', 'ARMATURE'); mod2.object = arm
            ob2['variant'] = v.name; ob2['kind'] = v.kind; ob2['label'] = v.label; ob2['lod'] = 1
            print('  lod1', v.name, len(me2.polygons), 'faces')
        path = os.path.join(OUT, f'people-{sex[0]}.raw.glb')
        bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', export_animations=False, export_extras=True,
                                  export_skins=True, export_morph=False, export_yup=True, export_apply=False)
        print('exported', path)
        # also keep a .blend for inspection
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, f'people-{sex[0]}.blend'), compress=True)


def main():
    rigs_out = {}
    for sex in (('male', 'female') if WHICH == 'all' else (WHICH,)):
        rig = Rig(sex)
        print(sex, 'body rebuilt, fit error %.3f mm' % rig.fit_err_mm, 'verts', len(rig.body.P))
        shared = {'hair_path': os.path.join(OUT, f'hair-{sex[0]}.png')}
        imgs = hair_atlas(rig, shared['hair_path'])
        shared['skin_path'] = os.path.join(OUT, f'skin-{sex[0]}.jpg'); imgs['skin'].convert('RGB').save(shared['skin_path'], quality=92)
        shared['eye_path'] = os.path.join(OUT, f'eye-{sex[0]}.png'); imgs['eye'].convert('RGB').save(shared['eye_path'])
        shared['shoes_path'] = os.path.join(OUT, f'shoes-{sex[0]}.png'); imgs['shoes'].convert('RGB').save(shared['shoes_path'])
        variants = []
        for spec in VAR.SPECS[sex]:
            if ONLY and spec['name'] not in ONLY: continue
            v = VAR.build_variant(rig, spec, shared, Slots(), remap_uv)
            v.atlas_path = os.path.join(OUT, f'{v.name}.png')
            paint_atlas(v.paint_parts, v.atlas_path)
            print(' variant', v.name, 'verts', len(v.mesh.P), 'tris', len(v.mesh.T))
            variants.append(v)
        rigs_out[sex] = (rig, variants, shared)
    blender_build(rigs_out)


if __name__ == '__main__':
    main()
