"""Retarget CMU BVH motion capture onto the MPFB (Mixamo-named) glTF skeleton.

Pure numpy, glTF space (Y up, character faces +Z, metres). No Blender needed.

Method (world-space delta transfer with direction-aligned rest):
  * The BVH zero pose (all channel rotations 0) is the source rest; every source
    joint has identity world rotation there.
  * For each mapped target bone we build an "aligned rest" world rotation A[b]:
    the target's own rest rotation turned so that the bone points the same way
    as the source bone does in its rest (minimal rotation; hips/chest also match
    the left-right axis so twist is preserved).
  * Per frame: Qt[b] = Qs[b](t) * A[b]. Unmapped bones (fingers, toes) keep their
    rest local rotation, so hands stay relaxed.
  * Root: hips position scaled by target/source hip height, re-oriented so the
    clip travels along +Z, then horizontal travel is removed (in-place clip) and
    its average speed reported as the clip's natural speed (m/s).
"""
import json, struct
import numpy as np
import bvhlib

# target bone -> (source joint driving it, target dir (from, to), source dir (from, to))
MAP = {
    'Hips': ('Hips', ('Hips', 'Spine1'), ('Hips', 'Spine1')),
    'Spine': ('LowerBack', ('Spine', 'Spine1'), ('LowerBack', 'Spine')),
    'Spine1': ('Spine', ('Spine1', 'Spine2'), ('Spine', 'Spine1')),
    'Spine2': ('Spine1', ('Spine2', 'Neck'), ('Spine1', 'Neck1')),
    'Neck': ('Neck', ('Neck', 'Head'), ('Neck', 'Neck1')),
    'Head': ('Head', ('Neck', 'Head'), ('Neck1', 'Head')),
}
for side in ('Left', 'Right'):
    MAP.update({
        side + 'UpLeg': (side + 'UpLeg', (side + 'UpLeg', side + 'Leg'), (side + 'UpLeg', side + 'Leg')),
        side + 'Leg': (side + 'Leg', (side + 'Leg', side + 'Foot'), (side + 'Leg', side + 'Foot')),
        side + 'Foot': (side + 'Foot', (side + 'Foot', side + 'ToeBase'), (side + 'Foot', side + 'ToeBase')),
        side + 'Shoulder': (side + 'Shoulder', (side + 'Shoulder', side + 'Arm'), (side + 'Shoulder', side + 'Arm')),
        side + 'Arm': (side + 'Arm', (side + 'Arm', side + 'ForeArm'), (side + 'Arm', side + 'ForeArm')),
        side + 'ForeArm': (side + 'ForeArm', (side + 'ForeArm', side + 'Hand'), (side + 'ForeArm', side + 'Hand')),
        side + 'Hand': (side + 'Hand', (side + 'Hand', side + 'HandMiddle1'), (side + 'Hand', side + 'HandIndex1')),
    })


# ---------------------------------------------------------------- math helpers
def quat_to_mat(q):
    x, y, z, w = q
    return np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
                     [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
                     [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])


def mat_to_quat(m):
    """m [...,3,3] -> quaternion [...,4] (x,y,z,w)."""
    m = np.asarray(m)
    shp = m.shape[:-2]
    m = m.reshape(-1, 3, 3)
    q = np.zeros((len(m), 4))
    for i, r in enumerate(m):
        t = np.trace(r)
        if t > 0:
            s = np.sqrt(t + 1) * 2
            q[i] = [(r[2, 1] - r[1, 2]) / s, (r[0, 2] - r[2, 0]) / s, (r[1, 0] - r[0, 1]) / s, s / 4]
        elif r[0, 0] > r[1, 1] and r[0, 0] > r[2, 2]:
            s = np.sqrt(1 + r[0, 0] - r[1, 1] - r[2, 2]) * 2
            q[i] = [s / 4, (r[0, 1] + r[1, 0]) / s, (r[0, 2] + r[2, 0]) / s, (r[2, 1] - r[1, 2]) / s]
        elif r[1, 1] > r[2, 2]:
            s = np.sqrt(1 + r[1, 1] - r[0, 0] - r[2, 2]) * 2
            q[i] = [(r[0, 1] + r[1, 0]) / s, s / 4, (r[1, 2] + r[2, 1]) / s, (r[0, 2] - r[2, 0]) / s]
        else:
            s = np.sqrt(1 + r[2, 2] - r[0, 0] - r[1, 1]) * 2
            q[i] = [(r[0, 2] + r[2, 0]) / s, (r[1, 2] + r[2, 1]) / s, s / 4, (r[1, 0] - r[0, 1]) / s]
    q /= np.linalg.norm(q, axis=1, keepdims=True)
    return q.reshape(shp + (4,))


def rot_between(a, b):
    a = a / np.linalg.norm(a); b = b / np.linalg.norm(b)
    v = np.cross(a, b); c = np.dot(a, b)
    if c < -0.9999:
        axis = np.cross(a, [1, 0, 0])
        if np.linalg.norm(axis) < 1e-6: axis = np.cross(a, [0, 1, 0])
        axis /= np.linalg.norm(axis)
        return axis_angle(axis, np.pi)
    vx = np.array([[0, -v[2], v[1]], [v[2], 0, -v[0]], [-v[1], v[0], 0]])
    return np.eye(3) + vx + vx @ vx / (1 + c)


def axis_angle(axis, ang):
    axis = np.asarray(axis, float); axis = axis / np.linalg.norm(axis)
    x, y, z = axis; c, s = np.cos(ang), np.sin(ang); C = 1 - c
    return np.array([[c + x * x * C, x * y * C - z * s, x * z * C + y * s],
                     [y * x * C + z * s, c + y * y * C, y * z * C - x * s],
                     [z * x * C - y * s, z * y * C + x * s, c + z * z * C]])


def frame_from(primary, secondary):
    """Orthonormal frame with columns (sec', primary, cross)."""
    y = primary / np.linalg.norm(primary)
    x = secondary - np.dot(secondary, y) * y; x /= np.linalg.norm(x)
    z = np.cross(x, y)
    return np.stack([x, y, z], axis=1)


def slerp_mats(a, b, t):
    qa, qb = mat_to_quat(a), mat_to_quat(b)
    if np.dot(qa, qb) < 0: qb = -qb
    d = np.clip(np.dot(qa, qb), -1, 1)
    if d > 0.9995:
        q = qa + t * (qb - qa)
    else:
        th = np.arccos(d)
        q = (np.sin((1 - t) * th) * qa + np.sin(t * th) * qb) / np.sin(th)
    return quat_to_mat(q / np.linalg.norm(q))


# ---------------------------------------------------------------- target skeleton
class Skeleton:
    def __init__(self, glb_path):
        b = open(glb_path, 'rb').read()
        jl = struct.unpack_from('<I', b, 12)[0]
        j = json.loads(b[20:20 + jl])
        nodes = j['nodes']
        self.joint_nodes = j['skins'][0]['joints']
        parent = {}
        for i, n in enumerate(nodes):
            for c in n.get('children', []): parent[c] = i
        self.nodes = nodes
        self.parent_node = parent
        self.names = [nodes[i]['name'] for i in self.joint_nodes]
        self.index = {n: k for k, n in enumerate(self.names)}
        self.parent = []
        for i in self.joint_nodes:
            p = parent.get(i)
            self.parent.append(self.joint_nodes.index(p) if p in self.joint_nodes else -1)
        # local rest TRS
        self.local_t = np.array([nodes[i].get('translation', [0, 0, 0]) for i in self.joint_nodes], float)
        self.local_r = np.array([quat_to_mat(nodes[i].get('rotation', [0, 0, 0, 1])) for i in self.joint_nodes])
        for i in self.joint_nodes:
            assert np.allclose(nodes[i].get('scale', [1, 1, 1]), 1, atol=1e-4), 'joint scale unsupported'
        # world transform of the root joint's parent chain (armature node etc.)
        root_node = self.joint_nodes[self.parent.index(-1)]
        M = np.eye(4); p = parent.get(root_node)
        chain = []
        while p is not None: chain.append(p); p = parent.get(p)
        for p in reversed(chain):
            n = nodes[p]; T = np.eye(4)
            if 'matrix' in n: T = np.array(n['matrix']).reshape(4, 4).T
            else:
                T[:3, :3] = quat_to_mat(n.get('rotation', [0, 0, 0, 1])) * np.array(n.get('scale', [1, 1, 1]))
                T[:3, 3] = n.get('translation', [0, 0, 0])
            M = M @ T
        self.base = M
        self.base_rot = M[:3, :3] / np.linalg.norm(M[:3, 0])
        self.base_scale = np.linalg.norm(M[:3, 0])
        self.rest_world_r, self.rest_world_p = self.fk(self.local_r[None], self.local_t[0][None])
        self.rest_world_r = self.rest_world_r[0]; self.rest_world_p = self.rest_world_p[0]

    def fk(self, local_r, root_t):
        """local_r [F,J,3,3], root_t [F,3] (root joint local translation) -> world R,P (glTF scene space)."""
        F, J = local_r.shape[:2]
        WR = np.zeros((F, J, 3, 3)); WP = np.zeros((F, J, 3))
        for k in range(J):
            p = self.parent[k]
            if p < 0:
                WR[:, k] = self.base_rot @ local_r[:, k]
                WP[:, k] = (self.base[:3, :3] @ root_t.T).T + self.base[:3, 3]
            else:
                WR[:, k] = WR[:, p] @ local_r[:, k]
                WP[:, k] = WP[:, p] + self.base_scale * np.einsum('fij,j->fi', WR[:, p], self.local_t[k])
        return WR, WP

    def world_to_local(self, WR, root_world_p):
        """Inverse of fk for rotations; root translation into root-parent space."""
        F, J = WR.shape[:2]
        L = np.zeros_like(WR)
        for k in range(J):
            p = self.parent[k]
            L[:, k] = (self.base_rot.T @ WR[:, k]) if p < 0 else np.transpose(WR[:, p], (0, 2, 1)) @ WR[:, k]
        inv = np.linalg.inv(self.base)
        rt = (inv[:3, :3] @ root_world_p.T).T + inv[:3, 3]
        return L, rt


# ---------------------------------------------------------------- source
class Source:
    def __init__(self, path, mirror=False):
        self.joints, self.data, self.ft = bvhlib.load(path)
        P = bvhlib.fk(self.joints, self.data)
        zero = np.zeros((1, self.data.shape[1]))
        R0 = bvhlib.fk(self.joints, zero)
        self.pos = {k: v[0] for k, v in P.items()}
        self.rot = {k: v[1] for k, v in P.items()}
        self.rest_pos = {k: v[0][0] for k, v in R0.items()}
        if mirror:
            M = np.diag([-1.0, 1, 1])
            sw = lambda n: n.replace('Left', '#').replace('Right', 'Left').replace('#', 'Right') if ('Left' in n or 'Right' in n) else n
            self.pos = {sw(k): v @ M for k, v in self.pos.items()}
            self.rot = {sw(k): M @ v @ M for k, v in self.rot.items()}
            self.rest_pos = {sw(k): v @ M for k, v in self.rest_pos.items()}
        self.nframes = self.data.shape[0]


def retarget(src, skel, start_s, end_s, fps=30, travel='auto', yaw_deg=None):
    """Returns dict with local rotations [F,J,3,3], root translation [F,3] (world, before in-place),
    and helpers. travel: 'auto' -> face along mean travel; 'face' -> face along mean hip facing."""
    t = np.arange(start_s, end_s + 1e-6, 1.0 / fps)
    fi = t / src.ft
    i0 = np.clip(np.floor(fi).astype(int), 0, src.nframes - 2); w = fi - i0
    def samp_p(name):
        p = src.pos[name]; return p[i0] * (1 - w)[:, None] + p[i0 + 1] * w[:, None]
    def samp_r(name):
        r = src.rot[name]
        return np.array([slerp_mats(r[a], r[a + 1], ww) for a, ww in zip(i0, w)])
    F = len(t)
    # scale from leg length (hip -> ankle) ratio
    s_leg = np.linalg.norm(src.rest_pos['LeftLeg'] - src.rest_pos['LeftUpLeg']) + np.linalg.norm(src.rest_pos['LeftFoot'] - src.rest_pos['LeftLeg'])
    ti = skel.index
    t_leg = np.linalg.norm(skel.rest_world_p[ti['LeftLeg']] - skel.rest_world_p[ti['LeftUpLeg']]) + np.linalg.norm(skel.rest_world_p[ti['LeftFoot']] - skel.rest_world_p[ti['LeftLeg']])
    scale = t_leg / s_leg
    # facing: hips left->right axis
    hips = samp_p('Hips')
    lr = samp_p('LeftUpLeg') - samp_p('RightUpLeg')
    if yaw_deg is not None:
        yaw = np.radians(yaw_deg)
    elif travel == 'auto' and np.linalg.norm(hips[-1, [0, 2]] - hips[0, [0, 2]]) > 0.5 * (end_s - start_s) / scale:
        d = hips[-1] - hips[0]; yaw = np.arctan2(d[0], d[2])
    else:
        fwd = np.cross(lr.mean(0), [0, 1, 0])  # left x up = forward for a +Z facing rest? check sign below
        # at rest the source faces +Z with Left at +X: cross(+X, +Y) = +Z
        yaw = np.arctan2(fwd[0], fwd[2])
    Ryaw = axis_angle([0, 1, 0], -yaw)  # rotate so travel/facing -> +Z
    # aligned rest for target bones
    A = {}
    P, S = skel.rest_world_p, src.rest_pos
    for tb, (sj, (t0, t1), (s0, s1)) in MAP.items():
        k = ti[tb]
        Rt = skel.rest_world_r[k]
        dt = P[ti[t1]] - P[ti[t0]]
        ds = S[s1] - S[s0]
        if tb.endswith('Shoulder') or tb in ('Neck', 'Head'):
            # CMU clavicles start low on the chest, MPFB's at the neck: transfer the delta only.
            # Neck/Head too: both rests look straight ahead, while aligning bone directions
            # pitched the female head up ~15 deg (her neck leans further forward at rest).
            A[tb] = Rt; continue
        if tb in ('Hips', 'Spine', 'Spine1', 'Spine2'):
            # match both up-direction and left-right axis so the torso keeps its twist
            if tb == 'Hips':
                lt = P[ti['LeftUpLeg']] - P[ti['RightUpLeg']]; ls = S['LeftUpLeg'] - S['RightUpLeg']
            else:
                lt = P[ti['LeftArm']] - P[ti['RightArm']]; ls = S['LeftArm'] - S['RightArm']
            A[tb] = frame_from(ds, ls) @ frame_from(dt, lt).T @ Rt
        else:
            A[tb] = rot_between(dt, ds) @ Rt
    J = len(skel.names)
    WR = np.zeros((F, J, 3, 3))
    srot = {}
    for k, name in enumerate(skel.names):
        p = skel.parent[k]
        if name in MAP:
            sj = MAP[name][0]
            if sj not in srot: srot[sj] = samp_r(sj)
            WR[:, k] = Ryaw @ srot[sj] @ A[name]
        else:
            WR[:, k] = WR[:, p] @ skel.local_r[k] if p >= 0 else skel.rest_world_r[k]
    root = (Ryaw @ (hips * scale).T).T
    return dict(t=t - t[0], WR=WR, root=root, scale=scale, fps=fps)


def finish(skel, res, mode='inplace', loop=True, ground=True, blend_frames=None):
    """Make an in-place (or stationary) clip, fix loop seam and ground contact.
    Returns (times, local quats [F,J,4], root local translation [F,3], natural_speed m/s)."""
    WR, root = res['WR'].copy(), res['root'].copy()
    F = len(WR)
    dur = res['t'][-1]
    ti = skel.index
    # natural speed along +Z
    disp = root[-1] - root[0]
    speed = float(np.hypot(disp[0], disp[2]) / dur) if dur > 0 else 0.0
    if mode == 'inplace':
        lin = np.outer(np.linspace(0, 1, F), disp)
        root[:, 0] -= lin[:, 0]; root[:, 2] -= lin[:, 2]
        root[:, 0] -= root[:, 0].mean(); root[:, 2] -= root[:, 2].mean()
    elif mode == 'stationary':
        root[:, 0] -= root[0, 0]; root[:, 2] -= root[0, 2]
        speed = 0.0
    elif mode == 'centered':
        root[:, 0] -= root[:, 0].mean(); root[:, 2] -= root[:, 2].mean(); speed = 0.0
    L, _ = skel.world_to_local(WR, root)
    if loop:
        # distribute the end->start mismatch over the clip (rotations and root)
        n = F - 1
        for k in range(len(skel.names)):
            qa = mat_to_quat(L[0, k]); qb = mat_to_quat(L[n, k])
            Dlt = L[0, k] @ L[n, k].T  # takes end to start
            q = mat_to_quat(Dlt)
            ang = 2 * np.arccos(np.clip(abs(q[3]), -1, 1))
            if ang < 1e-5: continue
            axis = q[:3] / np.linalg.norm(q[:3]) * np.sign(q[3] if q[3] != 0 else 1)
            for f in range(F):
                L[f, k] = axis_angle(axis, ang * f / n) @ L[f, k]
        droot = root[0] - root[n]
        root += np.outer(np.arange(F) / n, droot)
        if mode in ('centered', 'inplace'):
            root[:, 0] -= root[:, 0].mean(); root[:, 2] -= root[:, 2].mean()
    # ground: constant vertical offset so lowest foot joint sits at its rest height
    WR2, WP2 = None, None
    _, rt = skel.world_to_local(WR, root)
    # recompute world positions from locals
    WR2, WP2 = skel.fk(L, rt_local(skel, root))
    if ground:
        feet = [ti[n] for n in ('LeftFoot', 'RightFoot', 'LeftToeBase', 'RightToeBase')]
        rest_h = skel.rest_world_p[feet, 1]
        h = WP2[:, feet, 1] - rest_h[None]
        lowest = h.min(axis=1)  # per frame lowest foot relative to its rest height
        off = -np.percentile(lowest, 5)
        root[:, 1] += off
    q = mat_to_quat(L)
    # sign continuity
    for k in range(q.shape[1]):
        for f in range(1, F):
            if np.dot(q[f, k], q[f - 1, k]) < 0: q[f, k] *= -1
    return res['t'], q, rt_local(skel, root), speed


def rt_local(skel, root_world):
    inv = np.linalg.inv(skel.base)
    return (inv[:3, :3] @ root_world.T).T + inv[:3, 3]
