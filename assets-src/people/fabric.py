"""Procedural fabric shaders evaluated per texel from 3D position maps (numpy).

Every function takes a dict `t` of per-texel arrays: pos [K,3] (glTF metres, y up,
+z front), nrm [K,3], and garment scalars (s_arm, s_leg, uvl...), returns RGB 0..1.
"""
import numpy as np
from uvpaint import value_noise3

def srgb(c): return np.array(c, np.float32) / 255.0

def mul(rgb, f): return np.clip(rgb * f[:, None], 0, 1)

def knit(t, base, seed=1, heather=0.05):
    p = t['pos']
    n1 = value_noise3(p, 0.004, seed, 2)
    n2 = value_noise3(p, 0.05, seed + 1, 2)
    rgb = np.tile(srgb(base), (len(p), 1))
    return mul(rgb, 0.93 + 0.08 * n1 + heather * (n2 - 0.5))

def cotton(t, base, seed=2, slub=0.06):
    p = t['pos']
    n1 = value_noise3(p * np.array([1, 0.25, 1]), 0.003, seed, 2)  # horizontal slubs
    n2 = value_noise3(p, 0.08, seed + 5, 2)
    rgb = np.tile(srgb(base), (len(p), 1))
    return mul(rgb, 0.94 + slub * n1 + 0.06 * (n2 - 0.5))

def denim(t, base=(46, 62, 98), seed=3, fade=0.35):
    p, n = t['pos'], t['nrm']
    streak = value_noise3(p * np.array([3.0, 0.25, 3.0]), 0.02, seed, 3)
    fine = value_noise3(p, 0.003, seed + 1, 2)
    rgb = np.tile(srgb(base), (len(p), 1))
    f = 0.85 + 0.25 * streak + 0.08 * fine
    s = t.get('s_leg', np.zeros(len(p)))
    # worn front thighs and knees, whiskers near the hip crease
    front = np.clip(n[:, 2], 0, 1)
    wear = fade * front * (np.exp(-((s - 0.35) / 0.25) ** 2) + 0.6 * np.exp(-((s - 1.0) / 0.12) ** 2))
    rgb = rgb * f[:, None] + wear[:, None] * (srgb((150, 170, 195)) - rgb) * 0.6
    side = (np.abs(n[:, 0]) > 0.992) & (np.abs(n[:, 0]) < 0.997)
    rgb[side] = rgb[side] * 0.6 + srgb((160, 115, 60)) * 0.4  # outseam stitching
    return np.clip(rgb, 0, 1)

def twill(t, base, seed=4):
    p = t['pos']
    d = np.sin((p[:, 0] + p[:, 1]) * 2 * np.pi / 0.004) * 0.03
    n = value_noise3(p, 0.06, seed, 2)
    rgb = np.tile(srgb(base), (len(p), 1))
    return mul(rgb, 0.95 + d + 0.07 * (n - 0.5))

def checks(t, c1, c2, c3=None, pitch=0.035, seed=5):
    p, n = t['pos'], t['nrm']
    sa = t.get('s_arm', np.zeros(len(p)))
    onarm = t.get('arm', np.zeros(len(p))) > 0.5
    a = np.where(onarm, sa * 0.28, p[:, 0])  # vertical stripes follow the sleeve
    b = p[:, 1]
    sx = (np.floor(a / pitch) % 2).astype(bool); sy = (np.floor(b / pitch) % 2).astype(bool)
    rgb = np.tile(srgb(c1), (len(p), 1))
    rgb[sx ^ sy] = srgb(c2)
    both = sx & sy
    rgb[both] = srgb(c3) if c3 is not None else srgb(c2) * 0.7
    fine = value_noise3(p, 0.003, seed, 2)
    return mul(rgb, 0.93 + 0.08 * fine)

def camo(t, seed=6):
    p = t['pos']
    a = value_noise3(p, 0.09, seed, 3); b = value_noise3(p + 3.1, 0.06, seed + 1, 3); c = value_noise3(p + 7.7, 0.045, seed + 2, 2)
    rgb = np.tile(srgb((128, 152, 186)), (len(p), 1))
    rgb[a > 0.55] = srgb((64, 96, 150))
    rgb[b > 0.62] = srgb((30, 42, 82))
    rgb[c > 0.68] = srgb((215, 222, 232))
    fine = value_noise3(p, 0.003, seed + 4, 2)
    return mul(rgb, 0.92 + 0.1 * fine)

def block_print(t, base, ink, pitch=0.05, seed=7):
    """Sanganeri-style small motif grid in 3D (dots in a diamond lattice)."""
    p = t['pos']
    rgb = cotton(t, base, seed)
    q = p / pitch
    g = q.copy(); g[:, 1] += 0.5 * (np.floor(q[:, 0]) % 2)
    f = g - np.floor(g) - 0.5
    r = np.sqrt(f[:, 0] ** 2 + f[:, 1] ** 2 + 0 * f[:, 2] ** 2)
    m = r < 0.18
    petals = (np.abs(r - 0.32) < 0.06) & (np.abs(np.sin(np.arctan2(f[:, 1], f[:, 0]) * 4)) > 0.5)
    rgb[m | petals] = rgb[m | petals] * 0.3 + srgb(ink) * 0.7
    return rgb

def decal(t, rgb, img, center, size, front=True):
    """Project an RGBA image (H,W,4 uint8) onto the chest/back along z."""
    p, n = t['pos'], t['nrm']
    u = (p[:, 0] - center[0]) / size[0] + 0.5
    v = 1 - ((p[:, 1] - center[1]) / size[1] + 0.5)
    sel = (u >= 0) & (u < 1) & (v >= 0) & (v < 1) & ((n[:, 2] > 0.25) if front else (n[:, 2] < -0.25))
    if not front: u = 1 - u
    H, W = img.shape[:2]
    px = img[(v[sel] * (H - 1)).astype(int), (u[sel] * (W - 1)).astype(int)].astype(np.float32) / 255
    a = px[:, 3:4]
    out = rgb.copy()
    out[sel] = out[sel] * (1 - a) + px[:, :3] * a
    return out

def band(t, rgb, key, lo, hi, color, mix=0.5):
    s = t[key]
    sel = (s > lo) & (s < hi)
    out = rgb.copy(); out[sel] = out[sel] * (1 - mix) + srgb(color) * mix
    return out
