"""Minimal BVH reader with forward kinematics (numpy only).

Used to survey CMU clips (stick-figure sheets, root speed) before retargeting in
Blender. Positions are returned in BVH units (CMU cgspeed: ~1 unit = 1/0.45 in?),
Y up. Rotation channel order is honoured per joint.
"""
import numpy as np


class Joint:
    def __init__(self, name, parent):
        self.name, self.parent = name, parent
        self.offset = np.zeros(3)
        self.channels = []
        self.children = []
        self.end = None


def _rot(axis, deg):
    a = np.radians(deg)
    c, s = np.cos(a), np.sin(a)
    n = len(a)
    m = np.zeros((n, 3, 3))
    if axis == 'X':
        m[:, 0, 0] = 1; m[:, 1, 1] = c; m[:, 1, 2] = -s; m[:, 2, 1] = s; m[:, 2, 2] = c
    elif axis == 'Y':
        m[:, 1, 1] = 1; m[:, 0, 0] = c; m[:, 0, 2] = s; m[:, 2, 0] = -s; m[:, 2, 2] = c
    else:
        m[:, 2, 2] = 1; m[:, 0, 0] = c; m[:, 0, 1] = -s; m[:, 1, 0] = s; m[:, 1, 1] = c
    return m


def load(path):
    tokens = open(path).read().split()
    i = 0
    joints, stack = [], []
    cur = None
    while True:
        t = tokens[i]
        if t in ('ROOT', 'JOINT'):
            j = Joint(tokens[i + 1], cur)
            if cur: cur.children.append(j)
            joints.append(j); cur = j; i += 2
        elif t == 'End':
            # End Site { OFFSET x y z }
            cur.end = np.array([float(x) for x in tokens[i + 4:i + 7]]); i += 8
        elif t == 'OFFSET':
            cur.offset = np.array([float(x) for x in tokens[i + 1:i + 4]]); i += 4
        elif t == 'CHANNELS':
            n = int(tokens[i + 1]); cur.channels = tokens[i + 2:i + 2 + n]; i += 2 + n
        elif t == '{':
            i += 1
        elif t == '}':
            cur = cur.parent if cur else None; i += 1
        elif t == 'MOTION':
            break
        else:
            i += 1
    nframes = int(tokens[i + 2]); ft = float(tokens[i + 5]); i += 6
    nch = sum(len(j.channels) for j in joints)
    data = np.array(tokens[i:i + nframes * nch], dtype=float).reshape(nframes, nch)
    return joints, data, ft


def fk(joints, data):
    """Returns dict name -> (positions [F,3], world rotation [F,3,3])."""
    F = data.shape[0]
    out = {}
    col = 0
    for j in joints:
        pos = np.tile(j.offset, (F, 1))
        rot = np.tile(np.eye(3), (F, 1, 1))
        for ch in j.channels:
            v = data[:, col]; col += 1
            if ch.endswith('position'):
                pos[:, 'XYZ'.index(ch[0])] = v + (0 if j.parent else 0)
            else:
                rot = rot @ _rot(ch[0], v)
        if j.parent is None:
            wpos, wrot = pos, rot
        else:
            ppos, prot = out[j.parent.name]
            wpos = ppos + np.einsum('fij,j->fi', prot, j.offset)
            wrot = prot @ rot
        out[j.name] = (wpos, wrot)
    return out
