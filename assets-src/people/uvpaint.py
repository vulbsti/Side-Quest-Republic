"""Texture painting in UV space from 3D position maps (numpy only).

Rasterises a mesh's triangles into UV space, storing per-texel 3D position,
normal and per-vertex scalars (region masks, limb coordinates). Garment
textures are then computed as functions of the 3D surface, so patterns such as
camouflage, twill and checks run continuously across UV seams.
"""
import numpy as np


def rasterize(uv, tris, attrs, W, H):
    """uv [N,2] in 0..1 (v up), tris [T,3] indices into uv/attrs rows, attrs [N,C].
    Returns (mask [H,W] bool, maps [H,W,C])."""
    C = attrs.shape[1]
    out = np.zeros((H, W, C), np.float32)
    mask = np.zeros((H, W), bool)
    P = np.stack([uv[:, 0] * W - 0.5, (1 - uv[:, 1]) * H - 0.5], 1)
    for t in tris:
        a, b, c = P[t[0]], P[t[1]], P[t[2]]
        x0 = int(max(0, np.floor(min(a[0], b[0], c[0])))); x1 = int(min(W - 1, np.ceil(max(a[0], b[0], c[0]))))
        y0 = int(max(0, np.floor(min(a[1], b[1], c[1])))); y1 = int(min(H - 1, np.ceil(max(a[1], b[1], c[1]))))
        if x1 < x0 or y1 < y0: continue
        xs, ys = np.meshgrid(np.arange(x0, x1 + 1), np.arange(y0, y1 + 1))
        den = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1])
        if abs(den) < 1e-12: continue
        l1 = ((b[1] - c[1]) * (xs - c[0]) + (c[0] - b[0]) * (ys - c[1])) / den
        l2 = ((c[1] - a[1]) * (xs - c[0]) + (a[0] - c[0]) * (ys - c[1])) / den
        l3 = 1 - l1 - l2
        eps = -0.02  # slight conservative raster to avoid seams
        inside = (l1 >= eps) & (l2 >= eps) & (l3 >= eps)
        if not inside.any(): continue
        v = l1[..., None] * attrs[t[0]] + l2[..., None] * attrs[t[1]] + l3[..., None] * attrs[t[2]]
        yy, xx = ys[inside], xs[inside]
        out[yy, xx] = v[inside]
        mask[yy, xx] = True
    return mask, out


def dilate(img, mask, n=4):
    """Bleed colours outside UV islands to avoid dark seams with mipmapping."""
    img = img.copy(); m = mask.copy()
    for _ in range(n):
        acc = np.zeros_like(img); cnt = np.zeros(m.shape, np.float32)
        for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
            sm = np.roll(np.roll(m, dy, 0), dx, 1); si = np.roll(np.roll(img, dy, 0), dx, 1)
            acc += si * sm[..., None]; cnt += sm
        grow = (~m) & (cnt > 0)
        img[grow] = acc[grow] / cnt[grow][:, None]
        m = m | grow
    return img


def value_noise3(p, scale, seed=0, octaves=3):
    """Smooth 3D value noise at points p [...,3] (metres)."""
    rng = np.random.default_rng(seed)
    lat = rng.random((64, 64, 64)).astype(np.float32)
    out = np.zeros(p.shape[:-1], np.float32); amp = 1.0; tot = 0
    for o in range(octaves):
        q = p / scale * (2 ** o) + 17.3 * o
        i = np.floor(q).astype(int); f = q - i
        f = f * f * (3 - 2 * f)
        def L(dx, dy, dz):
            return lat[(i[..., 0] + dx) % 64, (i[..., 1] + dy) % 64, (i[..., 2] + dz) % 64]
        x00 = L(0, 0, 0) * (1 - f[..., 0]) + L(1, 0, 0) * f[..., 0]
        x10 = L(0, 1, 0) * (1 - f[..., 0]) + L(1, 1, 0) * f[..., 0]
        x01 = L(0, 0, 1) * (1 - f[..., 0]) + L(1, 0, 1) * f[..., 0]
        x11 = L(0, 1, 1) * (1 - f[..., 0]) + L(1, 1, 1) * f[..., 0]
        y0 = x00 * (1 - f[..., 1]) + x10 * f[..., 1]; y1 = x01 * (1 - f[..., 1]) + x11 * f[..., 1]
        out += amp * (y0 * (1 - f[..., 2]) + y1 * f[..., 2]); tot += amp; amp *= 0.5
    return out / tot
