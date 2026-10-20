"""Full-body Mesh (garments.Mesh) on the shipped skeleton, plus the shipped hair/eyes/shoes pieces."""
import os
import numpy as np
import mhbody, retarget
from garments import Mesh, vertex_normals, normalize_weights

HUMANS = os.environ.get('HUMANS_DIR', os.path.join(os.path.dirname(__file__), 'base'))


class Rig:
    def __init__(self, sex):
        self.sex = sex
        self.glb = os.path.join(HUMANS, 'male.glb' if sex == 'male' else 'female.glb')
        self.skel = retarget.Skeleton(self.glb)
        self.bones = self.skel.names
        self.bi = {n: i for i, n in enumerate(self.bones)}
        self.J = {n: self.skel.rest_world_p[i] for i, n in enumerate(self.bones)}
        data = mhbody.full_body(sex, self.glb)
        self.fit_err_mm = data['fit_err_mm']
        V = data['V']
        B = len(self.bones)
        Wfull = np.zeros((len(V), B))
        for bn, (idx, w) in data['weights'].items(): Wfull[idx, self.bi[bn]] += w
        self.Wfull = Wfull
        self.Vfull = V
        self.data = data
        self.body = self.group_mesh('body')
        self.add_scalars(self.body)

    def group_mesh(self, group):
        d = self.data
        faces = [k for k, g in enumerate(d['groups']) if g == group]
        T, UV = [], []
        for k in faces:
            f, ft = d['F'][k], d['FT'][k]
            for a in range(1, len(f) - 1):
                T.append([f[0], f[a], f[a + 1]]); UV.append([d['VT'][ft[0]], d['VT'][ft[a]], d['VT'][ft[a + 1]]])
        T = np.array(T)
        used = np.unique(T)
        remap = -np.ones(len(self.Vfull), int); remap[used] = np.arange(len(used))
        m = Mesh(self.Vfull[used], remap[T], np.array(UV), normalize_weights(self.Wfull[used]))
        m.S['src'] = used.astype(float)
        return m

    def add_scalars(self, m):
        J = self.J; P = m.P
        W = m.W; bi = self.bi
        def wsum(names): return W[:, [bi[n] for n in names if n in bi]].sum(1)
        fingers = lambda S: [n for n in self.bones if n.startswith(S + 'Hand')]
        m.S['arm'] = wsum(['LeftArm', 'LeftForeArm'] + fingers('Left')) + wsum(['RightArm', 'RightForeArm'] + fingers('Right'))
        m.S['leg'] = wsum(['LeftUpLeg', 'LeftLeg', 'LeftFoot', 'LeftToeBase', 'RightUpLeg', 'RightLeg', 'RightFoot', 'RightToeBase'])
        m.S['hand'] = wsum(fingers('Left') + fingers('Right'))
        m.S['foot'] = wsum(['LeftFoot', 'LeftToeBase', 'RightFoot', 'RightToeBase'])
        m.S['head'] = wsum(['Head'])
        m.S['neck'] = wsum(['Neck'])
        side = np.where(P[:, 0] >= 0, 'Left', 'Right')
        def chain(a, b, c):
            s = np.zeros(len(P))
            for S in ('Left', 'Right'):
                sel = side == S
                pa, pb, pc = J[S + a], J[S + b], J[S + c]
                q = P[sel]
                u1 = np.clip(((q - pa) @ (pb - pa)) / np.dot(pb - pa, pb - pa), 0, 1)
                u2 = np.clip(((q - pb) @ (pc - pb)) / np.dot(pc - pb, pc - pb), 0, 1)
                d1 = np.linalg.norm(q - (pa + u1[:, None] * (pb - pa)), axis=1)
                d2 = np.linalg.norm(q - (pb + u2[:, None] * (pc - pb)), axis=1)
                raw1 = ((q - pa) @ (pb - pa)) / np.dot(pb - pa, pb - pa)
                s[sel] = np.where(d1 < d2, raw1, 1 + u2)
            return s
        m.S['s_arm'] = chain('Arm', 'ForeArm', 'Hand')
        m.S['s_leg'] = chain('UpLeg', 'Leg', 'Foot')
        m.S['y'] = P[:, 1].copy(); m.S['x'] = P[:, 0].copy(); m.S['z'] = P[:, 2].copy()
        return m

    def shipped_piece(self, name_part):
        g = mhbody.glb_mesh(self.glb, name_part)
        P = g['POSITION'].astype(float); T = g['indices'].reshape(-1, 3).astype(int)
        uv = g['TEXCOORD_0'].astype(float).copy(); uv[:, 1] = 1 - uv[:, 1]
        names = g['joint_names']
        Wd = np.zeros((len(P), len(self.bones)))
        J0, W0 = g['JOINTS_0'].astype(int), g['WEIGHTS_0'].astype(float)
        for k in range(4):
            idx = [self.bi[names[j]] for j in J0[:, k]]
            np.add.at(Wd, (np.arange(len(P)), idx), W0[:, k])
        # weld duplicated seam verts by position for smooth shading
        key = np.round(P, 6)
        _, first, inv = np.unique(key, axis=0, return_index=True, return_inverse=True)
        inv = inv.ravel()
        m = Mesh(P[first], inv[T], uv[T], normalize_weights(Wd[first]))
        return m
