"""Hand-keyed arm layers baked over a mocap body (idle sway, weight shifts).

CMU has no protest chanting or phone filming, so those two clips keep the
captured legs, hips, spine and head of a standing take and replace one arm with
an analytic two-bone IK pose keyed in the chest's frame (so the arm rides the
body's own sway). Fingers are curled into a fist (chant) or a phone grip (film).
"""
import numpy as np
import retarget as R


def world_positions(skel, WR, root):
    F, J = WR.shape[:2]
    WP = np.zeros((F, J, 3))
    for k in range(J):
        p = skel.parent[k]
        WP[:, k] = root if p < 0 else WP[:, p] + skel.base_scale * np.einsum('fij,j->fi', WR[:, p], skel.local_t[k])
    return WP


def descendants(skel, k):
    out = [k]
    for j in range(len(skel.names)):
        p = skel.parent[j]
        while p >= 0:
            if p == k: out.append(j); break
            p = skel.parent[p]
    return out


def rotate_subtree(skel, WR, f, k, D):
    for j in descendants(skel, k):
        WR[f, j] = D @ WR[f, j]


def two_bone(skel, WR, root, side, targets, poles, hand_rot=None):
    """targets/poles: [F,3] world positions for the wrist and elbow hint."""
    ti = skel.index
    up, lo, hd = ti[side + 'Arm'], ti[side + 'ForeArm'], ti[side + 'Hand']
    for f in range(len(WR)):
        WP = world_positions(skel, WR[f:f + 1], root[f:f + 1])[0]
        S, E, W = WP[up], WP[lo], WP[hd]
        a, c = np.linalg.norm(E - S), np.linalg.norm(W - E)
        axis = targets[f] - S
        L = np.clip(np.linalg.norm(axis), abs(a - c) + 1e-3, a + c - 1e-3)
        axis /= np.linalg.norm(axis)
        along = (a * a - c * c + L * L) / (2 * L); h = np.sqrt(max(0, a * a - along * along))
        bend = poles[f] - S; bend -= np.dot(bend, axis) * axis; bend /= np.linalg.norm(bend)
        Ed = S + axis * along + bend * h; Wd = S + axis * L
        rotate_subtree(skel, WR, f, up, R.rot_between(E - S, Ed - S))
        WP = world_positions(skel, WR[f:f + 1], root[f:f + 1])[0]
        rotate_subtree(skel, WR, f, lo, R.rot_between(WP[hd] - WP[lo], Wd - WP[lo]))
        if hand_rot is not None:
            # hand_rot(f, forearm_world) -> desired hand world rotation
            Dh = hand_rot(f, WR[f, lo]) @ WR[f, hd].T
            rotate_subtree(skel, WR, f, hd, Dh)


def curl(skel, WR, side, amount, thumb=0.4):
    """Curl fingers about each finger's local X axis (MPFB finger bones bend about X)."""
    for fing in ('Index', 'Middle', 'Ring', 'Pinky', 'Thumb'):
        for n in (1, 2, 3):
            name = f'{side}Hand{fing}{n}'
            if name not in skel.index: continue
            k = skel.index[name]
            amt = (thumb if fing == 'Thumb' else amount) * (0.8 if n == 1 else 1.0)
            Rl = R.axis_angle([1, 0, 0], amt)
            for f in range(len(WR)):
                # local curl: world = world @ Rl, applied to the subtree
                rotate_subtree(skel, WR, f, k, WR[f, k] @ Rl @ WR[f, k].T)


def chest_frame(skel, WR, root):
    """Per-frame (origin, rotation) of a body frame: x = character left, y up, z forward,
    yaw taken from the hips, height from the chest."""
    ti = skel.index
    WP = world_positions(skel, WR, root)
    l = WP[:, ti['LeftArm']] - WP[:, ti['RightArm']]
    l[:, 1] = 0; l /= np.linalg.norm(l, axis=1, keepdims=True)
    up = np.tile([0, 1.0, 0], (len(l), 1))
    fwd = np.cross(l, up)
    Rm = np.stack([l, up, fwd], axis=2)
    return WP, Rm


def apply(kind, skel, res):
    WR, root = res['WR'], res['root']
    F = len(WR); t = res['t'] - res['t'][0]
    dur = t[-1]
    WP, Fm = chest_frame(skel, WR, root)
    ti = skel.index
    if kind == 'chant':
        # Two fist pumps per loop: punch up on the beat, recoil to a bent arm.
        ph = (t / dur * 2) % 1.0
        e = np.where(ph < 0.18, np.sin(ph / 0.18 * np.pi / 2), 0.5 + 0.5 * np.cos((ph - 0.18) / 0.82 * np.pi))
        sh = WP[:, ti['RightArm']]
        loc_lo = np.array([-0.16, 0.22, 0.10]); loc_hi = np.array([-0.10, 0.60, 0.16])
        loc = loc_lo[None] * (1 - e[:, None]) + loc_hi[None] * e[:, None]
        tgt = sh + np.einsum('fij,fj->fi', Fm, loc)
        pole = sh + np.einsum('fij,j->fi', Fm, np.array([-0.45, -0.1, -0.15]))
        two_bone(skel, WR, root, 'Right', tgt, pole)
        curl(skel, WR, 'Right', 1.35, thumb=0.7)
        # slight shout lean: head up on the punch
        k = ti['Head']
        for f in range(F):
            D = R.axis_angle(Fm[f][:, 0], -0.12 * e[f])
            rotate_subtree(skel, WR, f, k, D)
    elif kind == 'push':
        # Both palms flat against a wall of shields at chest height, heaving with the legs.
        e = 0.5 + 0.5 * np.sin(2 * np.pi * t / dur)
        for side, sx in (('Right', -1), ('Left', 1)):
            sh = WP[:, ti[side + 'Arm']]
            fwd = Fm[:, :, 2].copy(); fwd[:, 1] = 0; fwd /= np.linalg.norm(fwd, axis=1, keepdims=True)
            lat = np.einsum('fij,j->fi', Fm, np.array([sx * 0.06, 0, 0]))
            tgt = sh + lat + fwd * (0.40 + 0.06 * e)[:, None] + np.array([0, -0.04, 0])
            pole = sh + np.einsum('fij,j->fi', Fm, np.array([sx * 0.45, -0.45, -0.1]))
            def hand(f, fore, fwd=fwd):
                # fingers up, palm forward
                fy = np.array([0, 1.0, 0]) * 0.8 + fwd[f] * 0.2; fy /= np.linalg.norm(fy)
                fz = fwd[f] - np.dot(fwd[f], fy) * fy; fz /= np.linalg.norm(fz)
                return np.stack([np.cross(fy, fz), fy, fz], 1)
            two_bone(skel, WR, root, side, tgt, pole, hand_rot=hand)
            curl(skel, WR, side, 0.15, thumb=0.1)
    elif kind == 'film':
        # Phone held up at eye level in front, recording; small hand drift.
        sh = WP[:, ti['RightArm']]
        loc = np.array([0.10, 0.12, 0.40]) + np.stack([0.015 * np.sin(2 * np.pi * t / dur), 0.012 * np.sin(4 * np.pi * t / dur), 0 * t], 1)
        tgt = sh + np.einsum('fij,fj->fi', Fm, loc)
        pole = sh + np.einsum('fij,j->fi', Fm, np.array([-0.35, -0.45, 0.0]))
        def hand(f, fore):
            # palm faces the body's left/back: phone screen toward the eyes
            z = Fm[f][:, 2]; y = Fm[f][:, 1]; x = Fm[f][:, 0]
            # MPFB hand bone: +Y along fingers, +Z palm normal-ish (checked in preview)
            fy = y * 0.95 + z * 0.3; fy /= np.linalg.norm(fy)
            fz = -z; fz -= np.dot(fz, fy) * fy; fz /= np.linalg.norm(fz)
            fx = np.cross(fy, fz)
            return np.stack([fx, fy, fz], 1)
        two_bone(skel, WR, root, 'Right', tgt, pole, hand_rot=hand)
        curl(skel, WR, 'Right', 0.9, thumb=0.2)
        # look at the screen
        k = ti['Head']
        for f in range(F):
            rotate_subtree(skel, WR, f, k, R.axis_angle(Fm[f][:, 0], 0.12))
