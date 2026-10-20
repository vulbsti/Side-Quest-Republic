"""Rebuild the complete MakeHuman body under the shipped MPFB characters.

The MPFB exports in dist/assets/humans had the skin under the clothes deleted and
carry the body shape as six morph targets (race mix + weight + height). The CC0
MakeHuman base mesh (hm08) plus the same CC0 macro targets with the same weights
reproduces the surviving skin to within 0.01 mm (male) / 1.4 mm (female), so we get
a full body, the helper meshes (tights, skirt) and the CC0 MPFB game-engine weights
on exactly the skeleton the characters already use.

numpy only (scipy for KD-trees); used by build_people.py inside Blender.
"""
import json, struct, gzip, os
import numpy as np

SRC = os.environ.get('MH_DIR', '/home/claude/sq/dl')

# MPFB game_engine rig names -> the Mixamo-style names in dist/assets/humans
RIG = {'pelvis': 'Hips', 'spine_01': 'Spine', 'spine_02': 'Spine1', 'spine_03': 'Spine2', 'neck_01': 'Neck', 'head': 'Head'}
for s, S in (('l', 'Left'), ('r', 'Right')):
    RIG.update({f'thigh_{s}': S + 'UpLeg', f'calf_{s}': S + 'Leg', f'foot_{s}': S + 'Foot', f'ball_{s}': S + 'ToeBase',
                f'clavicle_{s}': S + 'Shoulder', f'upperarm_{s}': S + 'Arm', f'lowerarm_{s}': S + 'ForeArm', f'hand_{s}': S + 'Hand'})
    for f, F in (('index', 'Index'), ('middle', 'Middle'), ('ring', 'Ring'), ('pinky', 'Pinky'), ('thumb', 'Thumb')):
        for k in (1, 2, 3): RIG[f'{f}_0{k}_{s}'] = f'{S}Hand{F}{k}'


def load_obj(path):
    V, VT, F, FT, groups = [], [], [], [], []
    g = None
    for line in open(path):
        if line.startswith('v '):
            V.append([float(x) for x in line.split()[1:4]])
        elif line.startswith('vt '):
            VT.append([float(x) for x in line.split()[1:3]])
        elif line.startswith('g '):
            g = line.split()[1]
        elif line.startswith('f '):
            idx = [p.split('/') for p in line.split()[1:]]
            F.append([int(p[0]) - 1 for p in idx]); FT.append([int(p[1]) - 1 for p in idx]); groups.append(g)
    return np.array(V), np.array(VT), F, FT, groups


def load_target(path):
    op = gzip.open if path.endswith('.gz') else open
    idx, d = [], []
    for line in op(path, 'rt'):
        if not line.strip() or line.startswith('#'): continue
        p = line.split()
        idx.append(int(p[0])); d.append([float(x) for x in p[1:4]])
    return np.array(idx, int).reshape(-1), np.array(d).reshape(-1, 3)


def glb_json(path):
    b = open(path, 'rb').read()
    jl = struct.unpack_from('<I', b, 12)[0]
    return b, json.loads(b[20:20 + jl]), 20 + jl + 8


def glb_mesh(path, mesh_name_part):
    """Attributes of the first primitive whose mesh name contains the string, plus morphs applied."""
    b, j, bin_off = glb_json(path)
    def acc(i):
        a = j['accessors'][i]
        comp = {5126: 'f4', 5123: 'u2', 5121: 'u1', 5125: 'u4'}[a['componentType']]
        n = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}[a['type']]
        if 'bufferView' not in a:
            arr = np.zeros((a['count'], n), np.dtype(comp))
            sp = a.get('sparse')
            if sp:
                ib = j['bufferViews'][sp['indices']['bufferView']]
                ic = {5123: 'u2', 5121: 'u1', 5125: 'u4'}[sp['indices']['componentType']]
                idx = np.frombuffer(b, np.dtype(ic), sp['count'], bin_off + ib.get('byteOffset', 0) + sp['indices'].get('byteOffset', 0))
                vb = j['bufferViews'][sp['values']['bufferView']]
                vals = np.frombuffer(b, np.dtype(comp), sp['count'] * n, bin_off + vb.get('byteOffset', 0) + sp['values'].get('byteOffset', 0)).reshape(-1, n)
                arr[idx] = vals
            return arr
        bv = j['bufferViews'][a['bufferView']]
        off = bin_off + bv.get('byteOffset', 0) + a.get('byteOffset', 0)
        stride = bv.get('byteStride'); dt = np.dtype(comp)
        if stride and stride != dt.itemsize * n:
            raw = np.frombuffer(b, np.uint8, a['count'] * stride, off).reshape(a['count'], stride)
            arr = raw[:, :dt.itemsize * n].copy().view(dt).reshape(a['count'], n)
        else:
            arr = np.frombuffer(b, dt, a['count'] * n, off).reshape(a['count'], n)
        if a.get('normalized'): arr = arr.astype(float) / np.iinfo(dt).max
        return arr
    for m in j['meshes']:
        if mesh_name_part in m['name']:
            prim = m['primitives'][0]
            out = {k: acc(v) for k, v in prim['attributes'].items()}
            out['indices'] = acc(prim['indices']).ravel()
            out['morphed'] = out['POSITION'].astype(float).copy()
            for w, t in zip(m.get('weights', []), prim.get('targets', [])):
                out['morphed'] += w * acc(t['POSITION'])
            out['morph_names'] = (m.get('extras') or {}).get('targetNames', [])
            out['morph_weights'] = m.get('weights', [])
            out['joint_names'] = [j['nodes'][k]['name'] for k in j['skins'][0]['joints']]
            return out
    raise KeyError(mesh_name_part)


def full_body(sex, glb_path):
    """Returns dict: V (N,3 glTF metres, all base verts incl. helpers), faces per group,
    uv per face corner, weights {bone: (idx, w)} in Mixamo names."""
    m = glb_mesh(glb_path, 'base')
    V, VT, F, FT, groups = load_obj(os.path.join(SRC, 'base.obj'))
    files = [f'asian-{sex}-young', f'caucasian-{sex}-young', f'african-{sex}-young',
             f'universal-{sex}-young-averagemuscle-minweight', None, f'{sex}-maxheight']
    for f, w in zip(files, m['morph_weights']):
        if f:
            i, d = load_target(os.path.join(SRC, 'targets', f + '.target')); V[i] += w * d
    V = V * 0.1
    # fit offset from surviving skin (matched by UV)
    from scipy.spatial import cKDTree
    uv_of = {}
    for k, g in enumerate(groups):
        if g != 'body': continue
        for vi, ti in zip(F[k], FT[k]): uv_of.setdefault(vi, []).append(VT[ti])
    verts = np.array(sorted(uv_of))
    pts = np.concatenate([uv_of[v] for v in verts]); owner = np.concatenate([[v] * len(uv_of[v]) for v in verts])
    kuv = m['TEXCOORD_0'].astype(float).copy(); kuv[:, 1] = 1 - kuv[:, 1]
    d, ii = cKDTree(pts).query(kuv)
    corr = owner[ii]
    t = (m['morphed'] - V[corr]).mean(0)
    V = V + t
    err = np.linalg.norm(V[corr] - m['morphed'], axis=1)
    W = json.load(open(os.path.join(SRC, 'weights.game_engine.json')))['weights']
    weights = {RIG[k]: (np.array([a for a, _ in v], int), np.array([b for _, b in v])) for k, v in W.items() if k in RIG and v}
    return dict(V=V, VT=VT, F=F, FT=FT, groups=groups, weights=weights, fit_err_mm=float(err.max() * 1000), offset=t,
                kept_corr=corr, kept=m)
