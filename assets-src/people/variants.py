"""Outfit variants: Delhi Gen Z students, an uncle, an aunty, a vendor, party and
counter-group workers, a Delhi Police constable and an RAF jawan.

Each variant = the rebuilt body (skin hidden where covered) + garment shells cut
from it + parametric loose parts + shipped hair/eyes/shoes, merged into one skinned
mesh with three materials (skin, cloth atlas, hair).
"""
import os
import numpy as np
from PIL import Image
import garments as G
import fabric as Fb
from fabric import srgb

TEX = os.environ.get('TEX_DIR', '/home/claude/sq/tex')
SKIN = {'fair': (0.8, 0.64, 0.52), 'wheat': (0.7, 0.52, 0.4), 'dusky': (0.56, 0.4, 0.3), 'deep': (0.44, 0.3, 0.22)}
HAIR = {'black': (0.28, 0.24, 0.22), 'brown': (0.45, 0.36, 0.3), 'grey': (1.0, 1.0, 1.0)}


class Variant:
    def __init__(self, name, kind, label):
        self.name, self.kind, self.label = name, kind, label
        self.cloth = []        # (Mesh, paint_fn, paste) in atlas UV
        self.skin_parts = []   # Mesh in skin UV
        self.hair_parts = []   # Mesh in hair atlas UV
        self.skin = SKIN['wheat']; self.hair = HAIR['black']


# ------------------------------------------------------------------ fields
def collar(rig, m, dip=0.03, drop=0.02):
    n = rig.J['Neck']
    d = m.P - n
    ang = np.arctan2(d[:, 0], d[:, 2])          # 0 = straight ahead
    front = np.clip(np.cos(ang), 0, 1) * (np.hypot(d[:, 0], d[:, 2]) > 0.03)
    return n[1] - drop - dip * front ** 1.5


def top_field(rig, m, hem, sleeve, dip=0.03, drop=0.02):
    """Keep torso between hem (height) and the neckline, and arms up to s_arm=sleeve."""
    y = m.S['y']
    f_t = np.maximum(hem - y, y - collar(rig, m, dip, drop))
    f_a = m.S['s_arm'] - sleeve
    f = np.where(m.S['arm'] > 0.5, np.maximum(f_a, y - collar(rig, m, dip, drop) - 0.06), f_t)
    f = np.where(m.S['leg'] > 0.6, np.maximum(f, hem - y), f)
    f = np.where(m.S['head'] > 0.3, 1.0, f)
    return f


def bottom_field(rig, m, waist, hem):
    y = m.S['y']
    f_l = m.S['s_leg'] - hem
    f = np.where(m.S['leg'] > 0.5, np.maximum(f_l, y - waist), y - waist)
    f = np.where((m.S['arm'] > 0.3) | (m.S['head'] > 0.3), 1.0, f)
    return f


def part(rig, field, offset, smooth=3, min_off=None, region=None, max_off=None):
    m = G.clip(rig.body, field(rig.body) if callable(field) else field)
    off = offset(m) if callable(offset) else offset
    sh = G.shell(m, off, smooth=smooth, min_off=(min_off(m) if callable(min_off) else min_off), keep_boundary=True, max_off=(max_off(m) if callable(max_off) else max_off))
    sh.UV = sh.UV.copy(); sh.UV[..., 0] *= 0.5  # body UV -> left half of the cloth atlas
    return sh


def belly(rig, amount):
    yb = rig.J['Hips'][1] + 0.12
    return lambda m: amount * np.exp(-((m.S['y'] - yb) / 0.13) ** 2) * np.clip(m.N[:, 2], 0, 1) ** 1.5


def section(rig, y, regions=('torso',), pad=0.0):
    """Ellipse (cx, cz, rx, rz) of the body's cross-section at height y."""
    b = rig.body
    sel = (np.abs(b.S['y'] - y) < 0.015) & (b.S['arm'] < 0.3)
    p = b.P[sel]
    cx, cz = 0.0, (p[:, 2].max() + p[:, 2].min()) / 2
    return cx, cz, np.abs(p[:, 0]).max() + pad, (p[:, 2].max() - p[:, 2].min()) / 2 + pad


# ------------------------------------------------------------------ loose parts
def skirt(rig, y_top, y_bottom, flare=0.06, pad=0.02, slits=True, rows=10, cols=18, uv_rect=(0, 0, 1, 1), front_only_slit=False):
    """Kurta/kameez skirt: two panels (front/back) split by side slits, hanging from y_top."""
    meshes = []
    bi = rig.bi
    for k, (a0, a1) in enumerate(((-0.47, 0.47), (0.53, 1.47)) if slits else ((0, 1),)):
        def pos(u, v, a0=a0, a1=a1):
            y = y_top + (y_bottom - y_top) * v
            cx, cz, rx, rz = section(rig, max(y, rig.J['LeftLeg'][1] + 0.05), pad=pad)
            if y < y_top - 0.02:
                cxt, czt, rxt, rzt = section(rig, y_top, pad=pad)
                rx = max(rx, rxt); rz = max(rz, rzt)
            rx += flare * v; rz += flare * 0.7 * v
            th = np.pi * (a0 + (a1 - a0) * u)  # 0 = front (+z)
            return np.array([rx * np.sin(th), y, cz + rz * np.cos(th)])
        P, T, UV = G.grid_mesh(rows, cols, pos, uv_rect=(uv_rect[0] + (uv_rect[2] - uv_rect[0]) * k / 2, uv_rect[1], uv_rect[0] + (uv_rect[2] - uv_rect[0]) * (k + 1) / 2, uv_rect[3]))
        # flip row order of UV so v=0 at hem
        n = len(P)
        v = np.array([r / rows for r in range(rows + 1) for c in range(cols + 1)])
        W = np.zeros((n, len(rig.bones)))
        x = P[:, 0] / (np.abs(P[:, 0]).max() + 1e-6)
        t = np.clip(v, 0, 1) ** 1.2
        W[:, bi['Hips']] = 1 - 0.8 * t
        W[:, bi['LeftUpLeg']] = 0.8 * t * np.clip(0.5 + 0.7 * x, 0, 1)
        W[:, bi['RightUpLeg']] = 0.8 * t * np.clip(0.5 - 0.7 * x, 0, 1)
        m = G.Mesh(P, T, UV, G.normalize_weights(W))
        m.S['uvl'] = np.stack([np.array([c / cols for r in range(rows + 1) for c in range(cols + 1)]), 1 - v], 1)
        meshes.append(m)
    return G.merge_all(meshes)


def strip(rig, path, width, offset=0.02, uv_rect=(0, 0, 1, 1), sag=None, twist=None):
    """Cloth strip (dupatta, scarf, gamchha, bag strap) laid along a path near the body surface."""
    from scipy.spatial import cKDTree
    b = rig.body
    tree = cKDTree(b.P)
    path = np.asarray(path, float)
    # resample path
    seg = np.linalg.norm(np.diff(path, axis=0), axis=1); s = np.concatenate([[0], np.cumsum(seg)])
    K = max(8, int(s[-1] / 0.03))
    ss = np.linspace(0, s[-1], K)
    pts = np.stack([np.interp(ss, s, path[:, k]) for k in range(3)], 1)
    # push points outside the body
    for it in range(3):
        d, i = tree.query(pts)
        n = b.N[i]; q = b.P[i]
        h = ((pts - q) * n).sum(1)
        pts = pts + n * np.maximum(0, offset - h)[:, None]
    d, i = tree.query(pts); nrm = b.N[i]
    tang = np.gradient(pts, axis=0); tang /= np.linalg.norm(tang, axis=1, keepdims=True)
    side = np.cross(nrm, tang); side /= np.linalg.norm(side, axis=1, keepdims=True)
    wv = np.broadcast_to(np.asarray(width, float), (K,))
    cols = int(max(4, min(10, np.max(wv) / 0.03)))
    P = []
    for k in range(K):
        for c in range(cols + 1):
            u = c / cols - 0.5
            p = pts[k] + side[k] * u * wv[k]
            P.append(p)
    P = np.array(P)
    # keep outside, then relax the grid so the cloth stays a smooth sheet instead of
    # following every bump of the body (wide dupattas went ragged at the edges)
    Gd = P.reshape(K, cols + 1, 3)
    for it in range(6):
        Q = Gd.reshape(-1, 3)
        d, i = tree.query(Q); h = ((Q - b.P[i]) * b.N[i]).sum(1)
        Q = Q + b.N[i] * np.maximum(0, offset * 0.8 - h)[:, None]
        Gd = Q.reshape(K, cols + 1, 3)
        if it == 5: break
        A = Gd.copy()
        A[1:-1] = 0.5 * Gd[1:-1] + 0.25 * (Gd[:-2] + Gd[2:])
        A[:, 1:-1] = 0.5 * A[:, 1:-1] + 0.25 * (A[:, :-2] + A[:, 2:])
        Gd = A
    P = Gd.reshape(-1, 3)
    T, UV = [], []
    u0, v0, u1, v1 = uv_rect
    for k in range(K - 1):
        for c in range(cols):
            a, bb, cc, dd = k * (cols + 1) + c, k * (cols + 1) + c + 1, (k + 1) * (cols + 1) + c + 1, (k + 1) * (cols + 1) + c
            uv = lambda kk, ci: (u0 + (u1 - u0) * ci / cols, v0 + (v1 - v0) * kk / (K - 1))
            T += [[a, bb, cc], [a, cc, dd]]
            UV += [[uv(k, c), uv(k, c + 1), uv(k + 1, c + 1)], [uv(k, c), uv(k + 1, c + 1), uv(k + 1, c)]]
    W = G.sample_weights(b, P, k=12)
    # drapes ride the torso: arm bones would drag the cloth when arms are raised (Film, Chant)
    arm = np.array([('Arm' in n or 'Hand' in n) for n in rig.bones])
    W[:, arm] = 0
    empty = W.sum(1) < 1e-6
    W[empty, rig.bi['Spine2']] = 1
    W = G.normalize_weights(W)
    m = G.Mesh(P, np.array(T), np.array(UV), W)
    m.S['uvl'] = np.array([[c / cols, k / (K - 1)] for k in range(K) for c in range(cols + 1)])
    return m


def rigid(rig, P, T, UV, bone='Head'):
    W = np.zeros((len(P), len(rig.bones))); W[:, rig.bi[bone]] = 1
    return G.Mesh(P, T, UV, W)


def head_frame(rig):
    b = rig.body
    sel = b.S['head'] > 0.9
    p = b.P[sel]
    top = p[:, 1].max()
    c = np.array([0.0, top - 0.11, (p[:, 2].max() + p[:, 2].min()) / 2 - 0.01])
    face = p[np.abs(p[:, 0]) < 0.012]
    nose = face[np.argmax(face[:, 2])]
    return dict(top=top, center=c, rx=np.abs(p[:, 0]).max(), zf=p[:, 2].max(), zb=p[:, 2].min(), nose=nose, pts=p)


def head_section(rig, y, pad=0.0):
    """Head half-width and front/back z at height y (skin only; ears excluded by |x| < 0.085)."""
    p = head_frame(rig)['pts']
    sel = (np.abs(p[:, 1] - y) < 0.008) & (np.abs(p[:, 0]) < 0.085)
    q = p[sel]
    return np.abs(q[:, 0]).max() + pad, q[:, 2].max() + pad, q[:, 2].min() - pad


def head_shape(rig, pad):
    """Ellipsoid (centre, rx, ry, rz) fitted to the cranium above the brow, padded for hair."""
    hf = head_frame(rig)
    top = hf['top']
    brow = hf['nose'][1] + 0.035
    rx, zf, zb = head_section(rig, brow + 0.02, 0)
    cz = (zf + zb) / 2
    c = np.array([0.0, brow - 0.01, cz])
    return c, rx + pad, top - c[1] + pad, (zf - zb) / 2 + pad


def cap_mesh(rig, kind, uv_rect):
    """Rigid headgear: 'helmet' (RAF), 'peaked' (police cap), 'beret', 'band' (headband)."""
    hair_pad = 0.016
    c, rx, ry, rz = head_shape(rig, hair_pad)
    meshes = []
    def shell_pos(scale, edge_front, edge_back, lift=0.0, tilt=0.0):
        sx, sy, sz = scale
        def pos(u, v):
            th = 2 * np.pi * u
            front = 0.5 + 0.5 * np.cos(th)
            ph_max = edge_back + (edge_front - edge_back) * front
            ph = v * ph_max
            p = np.array([rx * sx * np.sin(ph) * np.sin(th), ry * sy * np.cos(ph) + lift, rz * sz * np.sin(ph) * np.cos(th)])
            p[1] += tilt * p[0]
            return c + p
        return pos
    if kind == 'helmet':
        pos = shell_pos((1.1, 1.06, 1.08), 1.45, 1.85, lift=-0.005)
        meshes.append(G.grid_mesh(8, 28, pos, closed=True, uv_rect=uv_rect))
        rim = np.array([pos(u, 1.0) for u in np.linspace(0, 1, 29)])
        meshes.append(G.tube_along(rim, 0.008, 6, uv_rect=uv_rect))
        # raised visor resting on the crown front
        def visor(u, v):
            th = np.pi * (u - 0.5) * 1.1
            ph = 0.55 + 0.35 * v
            return c + np.array([rx * 1.16 * np.sin(ph) * np.sin(th), ry * 1.12 * np.cos(ph), rz * 1.15 * np.sin(ph) * np.cos(th)])
        meshes.append(G.grid_mesh(3, 14, visor, uv_rect=uv_rect, double=True))
    elif kind == 'peaked':
        y0 = head_frame(rig)['nose'][1] + 0.045
        def ring(y, grow):
            def f(th):
                hx, zf, zb = head_section(rig, min(y, head_frame(rig)['top'] - 0.03), 0.0)
                cz = (zf + zb) / 2; hz = (zf - zb) / 2
                return np.array([(hx + hair_pad) * grow * np.sin(th), y, cz + (hz + hair_pad) * grow * np.cos(th)])
            return f
        def crown(u, v):
            th = 2 * np.pi * u
            back = 0.5 - 0.5 * np.cos(th)
            y = y0 - 0.02 * back + 0.075 * v
            return ring(y, 1.0 + 0.12 * v ** 2)(th)
        meshes.append(G.grid_mesh(5, 28, crown, closed=True, uv_rect=uv_rect))
        def top_disc(u, v):
            e = crown(u, 1.0); cc = np.array([0, e[1] + 0.008, c[2]])
            return cc + (e - cc) * v
        meshes.append(G.grid_mesh(2, 28, top_disc, closed=True, uv_rect=uv_rect))
        def peak(u, v):
            th = (u - 0.5) * 1.9
            e = crown((th / (2 * np.pi)) % 1.0, 0.0)
            return e + np.array([np.sin(th) * 0.03, -0.012 * v, np.cos(th) * 0.065]) * v
        meshes.append(G.grid_mesh(2, 12, peak, uv_rect=uv_rect, double=True))
    elif kind == 'beret':
        pos = shell_pos((1.12, 0.62, 1.14), 1.55, 1.55, lift=0.035, tilt=-0.18)
        meshes.append(G.grid_mesh(6, 28, pos, closed=True, uv_rect=uv_rect))
    elif kind == 'band':
        y0 = hf_y = head_frame(rig)['nose'][1] + 0.055
        def band(u, v):
            th = 2 * np.pi * u
            y = y0 + 0.032 * v - 0.025 * (0.5 - 0.5 * np.cos(th))
            hx, zf, zb = head_section(rig, y, 0.0)
            hz = (zf - zb) / 2 + 0.006; cz = (zf + zb) / 2
            return np.array([(hx + 0.006 + 0.008 * (0.5 - 0.5 * np.cos(th))) * np.sin(th), y, cz + hz * np.cos(th)])
        meshes.append(G.grid_mesh(2, 28, band, closed=True, uv_rect=uv_rect))
    ms = []
    for P, T, UV in meshes:
        m = rigid(rig, P, T, UV)
        m.S['uvl'] = np.stack([np.zeros(len(P)), (P[:, 1] - c[1])], 1)
        ms.append(m)
    return G.merge_all(ms)


def face_patch(rig, center, w, h, uv_rect, lift=0.003, curve=0.0, taper=0.0, gap=0.0, rows=3, cols=12):
    """Small surface-hugging patch on the face (moustache, tilak)."""
    hf = head_frame(rig)
    pts = hf['pts']
    def pos(u, v):
        s = (u - 0.5) * 2
        hh = h * (1 - taper * s * s)
        x = s * w / 2
        y = center[1] + (v - 0.5) * hh - curve * s * s
        cand = pts[(np.abs(pts[:, 0] - x) < 0.006) & (np.abs(pts[:, 1] - y) < 0.006)]
        z = cand[:, 2].max() if len(cand) else center[2]
        return np.array([x, y, z + lift + 0.002 * (1 - s * s)])
    P, T, UV = G.grid_mesh(rows, cols, pos, uv_rect=uv_rect)
    m = rigid(rig, P, T, UV)
    m.S['uvl'] = np.array([[c / cols, r / rows] for r in range(rows + 1) for c in range(cols + 1)])
    return m


def glasses(rig, uv_rect):
    eyes = rig.shipped_piece('low-poly')
    meshes = []
    zf = eyes.P[:, 2].max() + 0.014
    centres = {}
    for sx in (-1, 1):
        sel = eyes.P[:, 0] * sx > 0
        ec = eyes.P[sel].mean(0); centres[sx] = ec
        ring = np.array([ec + np.array([0.023 * np.cos(a), 0.017 * np.sin(a), 0]) for a in np.linspace(0, 2 * np.pi, 19)]); ring[:, 2] = zf
        meshes.append(G.tube_along(ring, 0.0018, 6, uv_rect=uv_rect))
        hx, hzf, hzb = head_section(rig, ec[1], 0.004)
        temple = np.array([[sx * (abs(ec[0]) + 0.023), ec[1] + 0.004, zf - 0.002],
                           [sx * (hx + 0.003), ec[1] + 0.006, zf - 0.035],
                           [sx * (hx + 0.001), ec[1] + 0.0, (hzf + hzb) / 2 - 0.02]])
        meshes.append(G.tube_along(temple, 0.0017, 5, uv_rect=uv_rect))
    l, r = centres[1], centres[-1]
    bridge = np.array([[l[0] - 0.023, l[1] + 0.004, zf], [0, (l[1] + r[1]) / 2 + 0.009, zf + 0.004], [r[0] + 0.023, r[1] + 0.004, zf]])
    meshes.append(G.tube_along(bridge, 0.0018, 5, uv_rect=uv_rect))
    ms = [rigid(rig, P, T, UV) for P, T, UV in meshes]
    m = G.merge_all(ms); m.S['uvl'] = np.zeros((len(m.P), 2))
    return m


def bag(rig, uv_rect, uv_strap):
    """Cloth jhola: strap from the right shoulder across to a bag at the left hip."""
    J = rig.J
    sh = J['RightShoulder'] + np.array([-0.02, 0.07, 0.0])
    hip = J['LeftUpLeg'] + np.array([0.12, 0.05, 0.0])
    front = [sh + np.array([0, 0, 0.06]), (sh + hip) / 2 + np.array([0, 0.05, 0.16]), hip + np.array([0.02, 0.05, 0.08])]
    back = [sh + np.array([0, 0, -0.06]), (sh + hip) / 2 + np.array([0, 0.05, -0.16]), hip + np.array([0.02, 0.05, -0.08])]
    path = list(reversed(back)) + [sh + np.array([0, 0.02, 0])] + front
    strap = strip(rig, path, 0.04, offset=0.03, uv_rect=uv_strap)
    c = hip + np.array([0.06, -0.1, 0.0])
    w, h, d = 0.05, 0.3, 0.28
    def pos(u, v):
        th = 2 * np.pi * u
        return c + np.array([w * np.sin(th) * (1 + 0.3 * v), (v - 0.5) * h, d / 2 * np.cos(th)])
    P, T, UV = G.grid_mesh(4, 12, pos, closed=True, uv_rect=uv_rect)
    W = np.zeros((len(P), len(rig.bones))); W[:, rig.bi['Hips']] = 0.7; W[:, rig.bi['LeftUpLeg']] = 0.3
    body = G.Mesh(P, T, UV, W); body.S['uvl'] = np.zeros((len(P), 2))
    return G.merge_all([strap, body])


def belt(rig, y, uv_rect, pad=0.024, h=0.04):
    def pos(u, v):
        cx, cz, rx, rz = section(rig, y, pad=pad)
        th = 2 * np.pi * u
        return np.array([rx * np.sin(th), y - h / 2 + h * v, cz + rz * np.cos(th)])
    P, T, UV = G.grid_mesh(1, 32, pos, closed=True, uv_rect=uv_rect)
    m = G.Mesh(P, T, UV, G.sample_weights(rig.body, P))
    m.S['uvl'] = np.array([[c / 32, r] for r in range(2) for c in range(32)])
    return m


def hood(rig, uv_rect):
    J = rig.J
    n = J['Neck']
    arc = [n + np.array([0.11 * np.sin(a), -0.04 + 0.03 * np.cos(a) ** 2, -0.1 * np.cos(a) - 0.02]) for a in np.linspace(-1.9, 1.9, 13)]
    P, T, UV = G.tube_along(np.array(arc), np.concatenate([np.linspace(0.03, 0.055, 7), np.linspace(0.055, 0.03, 7)[1:]]), 10, uv_rect=uv_rect)
    m = G.Mesh(P, T, UV, G.sample_weights(rig.body, P)); m.S['uvl'] = np.zeros((len(P), 2))
    return m


def boots(rig, uv_rect):
    """Boot shafts over the ankle (police/RAF)."""
    f = lambda m: np.where(m.S['leg'] > 0.5, np.maximum(1.72 - m.S['s_leg'], m.S['s_leg'] - 2.05), 1.0)
    return part(rig, f, 0.016, smooth=2)


# ------------------------------------------------------------------ paint helpers
def uvpaint_noise(t):
    from uvpaint import value_noise3
    return value_noise3(t['pos'], 0.004, 9, 2)


def img(name):
    return np.asarray(Image.open(os.path.join(TEX, name)).convert('RGBA'))


def paint_top(base_fn, print_img=None, print_at=None, rib=None, placket=None, pockets=None, collar_band=None):
    def fn(t):
        rgb = base_fn(t)
        if print_img is not None:
            rgb = Fb.decal(t, rgb, print_img, print_at[0], print_at[1])
        if pockets:
            for (cx, cy, w, h, col) in pockets:
                p = t['pos']
                inside = (np.abs(p[:, 0] - cx) < w / 2) & (np.abs(p[:, 1] - cy) < h / 2) & (t['nrm'][:, 2] > 0.3)
                edge = inside & ((np.abs(np.abs(p[:, 0] - cx) - w / 2) < 0.004) | (np.abs(p[:, 1] - (cy + h / 2 - 0.025)) < 0.003) | (np.abs(np.abs(p[:, 1] - cy) - h / 2) < 0.004))
                rgb[edge] = rgb[edge] * 0.6 + srgb(col) * 0.4
        if placket:
            p = t['pos']
            sel = (np.abs(p[:, 0]) < placket[0]) & (t['nrm'][:, 2] > 0.5) & (p[:, 1] > placket[1])
            rgb[sel] = rgb[sel] * 0.88
            btn = sel & (np.abs(p[:, 0]) < 0.006) & ((np.abs((p[:, 1] - placket[1]) % 0.075 - 0.037) < 0.005))
            rgb[btn] = srgb(placket[2])
        return rgb
    return fn


def paint_shoes(tint=None, gray=False):
    def fn(src):
        a = np.asarray(Image.open(src).convert('RGB'), np.float32) / 255
        if gray or tint is not None:
            l = a.mean(2, keepdims=True)
            a = np.clip((l * 1.6) * (srgb(tint) if tint is not None else 1), 0, 1)
        return a
    return fn


# ------------------------------------------------------------------ assembly
def build_variant(rig, spec, shared, slots, remap_uv):
    v = Variant(spec['name'], spec.get('kind', 'civilian'), spec.get('label', spec['name']))
    v.skin = SKIN[spec.get('skin', 'wheat')]; v.hair = HAIR[spec.get('hair', 'black')]
    covers = []
    cloth_meshes = []
    for g in spec['garments'](rig, slots):
        mesh, paint, cover = g['mesh'], g.get('paint'), g.get('cover')
        cloth_meshes.append((mesh, paint, g.get('paste')))
        if cover is not None: covers.append(cover)
    # skin: hide body faces under garments (all three corners covered)
    body = rig.body
    hidden = np.zeros(len(body.P), bool)
    for f in covers: hidden |= f(body) < 0
    hidden |= body.S['foot'] > 0.5  # inside the shoes
    keep = ~hidden[body.T].all(1)
    skin = G.Mesh(body.P, body.T[keep], body.UV[keep], body.W, dict(body.S), body.N)
    skin = G.compact(skin)
    skin_parts = [skin]
    # shipped pieces
    hair_name = spec.get('hair_mesh', 'short02' if rig.sex == 'male' else 'ponytail01')
    hair_parts = []
    if hair_name:
        hm = rig.shipped_piece(hair_name)
        if spec.get('hair_cut'):
            hm = G.clip(hm, spec['hair_cut'](hm))
        hm.UV = hm.UV.copy(); hm.UV[..., 1] = 0.25 + hm.UV[..., 1] * 0.75
        hair_parts.append(hm)
    brow = rig.shipped_piece('eyebrow001'); brow.UV = brow.UV.copy(); brow.UV[..., 1] *= 0.25
    hair_parts.append(brow)
    eyes = rig.shipped_piece('low-poly')
    rect = slots.take(); remap_uv(eyes, rect); cloth_meshes.append((eyes, None, (shared['eye_path'], rect)))
    if spec.get('shoes', True):
        shoes = rig.shipped_piece('shoes01')
        rect = slots.take(2, 2); remap_uv(shoes, rect)
        sp = os.path.join(os.path.dirname(shared['shoes_path']), f"shoes-{spec['name']}.png")
        Image.fromarray((paint_shoes(spec.get('shoe_tint'), spec.get('shoe_gray', False))(shared['shoes_path']) * 255).astype(np.uint8)).save(sp)
        cloth_meshes.append((shoes, None, (sp, rect)))
    # merge: material index 0 skin, 1 cloth, 2 hair
    parts, mats = [], []
    for m in skin_parts: parts.append(m); mats.append(np.zeros(len(m.T), int))
    for m, _, _ in cloth_meshes: parts.append(m); mats.append(np.ones(len(m.T), int))
    for m in hair_parts: parts.append(m); mats.append(np.full(len(m.T), 2))
    for m in parts:
        for k in list(m.S):
            if k not in ('arm', 'leg'): pass
    v.mesh = G.merge_all(parts)
    v.face_mat = np.concatenate(mats)
    v.paint_parts = cloth_meshes
    v.hair_path = shared['hair_path']
    if spec.get('hair_grey'):
        gp = shared['hair_path'].replace('.png', '-grey.png')
        if not os.path.exists(gp):
            im = Image.open(shared['hair_path']).convert('RGBA'); a = np.asarray(im).astype(np.float32)
            l = a[..., :3].mean(2, keepdims=True)
            a[..., :3] = np.clip(60 + l * 1.9, 0, 255)
            a[768:, :, :3] = np.clip(40 + l[768:] * 1.4, 0, 255)  # brows a little darker
            Image.fromarray(a.astype(np.uint8)).save(gp)
        v.hair_path = gp
    return v


from specs import SPECS  # noqa: E402  (variant list lives in specs.py)
