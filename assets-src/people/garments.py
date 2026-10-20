"""Garment geometry from the full MakeHuman body (numpy only, glTF space: y up, +z front).

Mesh representation: welded vertices P [N,3] with normals N, skin weights W [N,B]
(dense over BONES), extra per-vertex scalars S {name: [N]}, triangles T [M,3] and
per-corner UVs UV [M,3,2].

Garments are offset shells of body regions, cut exactly along a scalar field
(marching triangles), so hems, cuffs and necklines are clean curves rather than
stair-stepped quads; loose parts (kurta skirts, dupattas, scarves, bags, caps)
are generated parametric meshes whose weights are sampled from the body.
"""
import numpy as np


class Mesh:
    def __init__(self, P, T, UV, W, S=None, N=None):
        self.P = np.asarray(P, float); self.T = np.asarray(T, int); self.UV = np.asarray(UV, float)
        self.W = np.asarray(W, float); self.S = S or {}
        self.N = vertex_normals(self.P, self.T) if N is None else N

    def copy(self):
        return Mesh(self.P.copy(), self.T.copy(), self.UV.copy(), self.W.copy(), {k: v.copy() for k, v in self.S.items()}, self.N.copy())


def vertex_normals(P, T):
    n = np.zeros_like(P)
    fn = np.cross(P[T[:, 1]] - P[T[:, 0]], P[T[:, 2]] - P[T[:, 0]])
    for k in range(3): np.add.at(n, T[:, k], fn)
    l = np.linalg.norm(n, axis=1, keepdims=True); l[l == 0] = 1
    return n / l


def merge(meshes):
    P, T, UV, W, N = [], [], [], [], []
    keys = set.intersection(*[set(m.S) for m in meshes]) if meshes else set()
    S = {k: [] for k in keys}
    off = 0
    for m in meshes:
        P.append(m.P); N.append(m.N); W.append(m.W); UV.append(m.UV); T.append(m.T + off); off += len(m.P)
        for k in keys: S[k].append(m.S[k])
    return Mesh(np.concatenate(P), np.concatenate(T), np.concatenate(UV), np.concatenate(W), {k: np.concatenate(v) for k, v in S.items()}, np.concatenate(N))


def merge_all(meshes):
    """Merge meshes; scalar channels missing from some meshes are zero-filled."""
    keys = {}
    for m in meshes:
        for k, v in m.S.items(): keys[k] = v.shape[1:] if v.ndim > 1 else ()
    P, T, UV, W, N, S = [], [], [], [], [], {k: [] for k in keys}
    off = 0
    for m in meshes:
        P.append(m.P); N.append(m.N); W.append(m.W); UV.append(m.UV); T.append(m.T + off); off += len(m.P)
        for k, shp in keys.items():
            S[k].append(m.S[k] if k in m.S else np.zeros((len(m.P),) + shp))
    return Mesh(np.concatenate(P), np.concatenate(T), np.concatenate(UV), np.concatenate(W), {k: np.concatenate(v) for k, v in S.items()}, np.concatenate(N))


def clip(m, f):
    """Keep the part of mesh m where scalar field f [N] < 0, cutting triangles exactly."""
    f = np.asarray(f, float)
    f = np.where(np.abs(f) < 1e-7, 1e-7, f)
    inside = f < 0
    newP, newN, newW, newS = [], [], [], {k: [] for k in m.S}
    edge_ids = {}
    base = len(m.P)
    def edge_vert(i, j):
        key = (min(i, j), max(i, j))
        if key in edge_ids: return edge_ids[key]
        t = f[i] / (f[i] - f[j])
        newP.append(m.P[i] + t * (m.P[j] - m.P[i])); n = m.N[i] + t * (m.N[j] - m.N[i]); newN.append(n / (np.linalg.norm(n) + 1e-12))
        newW.append(m.W[i] + t * (m.W[j] - m.W[i]))
        for k in m.S: newS[k].append(m.S[k][i] + t * (m.S[k][j] - m.S[k][i]))
        edge_ids[key] = base + len(newP) - 1
        return edge_ids[key]
    T, UV = [], []
    for tri, uv in zip(m.T, m.UV):
        ins = inside[tri]
        c = ins.sum()
        if c == 3: T.append(tri); UV.append(uv); continue
        if c == 0: continue
        poly, puv = [], []
        for k in range(3):
            a, b = k, (k + 1) % 3
            ia, ib = tri[a], tri[b]
            if ins[a]: poly.append(ia); puv.append(uv[a])
            if ins[a] != ins[b]:
                t = f[ia] / (f[ia] - f[ib])
                poly.append(edge_vert(ia, ib)); puv.append(uv[a] + t * (uv[b] - uv[a]))
        for k in range(1, len(poly) - 1):
            T.append([poly[0], poly[k], poly[k + 1]]); UV.append([puv[0], puv[k], puv[k + 1]])
    P = np.concatenate([m.P, np.array(newP).reshape(-1, 3)])
    N = np.concatenate([m.N, np.array(newN).reshape(-1, 3)])
    W = np.concatenate([m.W, np.array(newW).reshape(-1, m.W.shape[1])])
    S = {k: np.concatenate([m.S[k], np.array(newS[k]).reshape((-1,) + m.S[k].shape[1:])]) for k in m.S}
    out = Mesh(P, np.array(T).reshape(-1, 3), np.array(UV).reshape(-1, 3, 2), W, S, N)
    return compact(out)


def compact(m):
    used = np.unique(m.T)
    remap = -np.ones(len(m.P), int); remap[used] = np.arange(len(used))
    return Mesh(m.P[used], remap[m.T], m.UV, m.W[used], {k: v[used] for k, v in m.S.items()}, m.N[used])


def neighbours(T, n):
    nb = [set() for _ in range(n)]
    for a, b, c in T:
        nb[a].update((b, c)); nb[b].update((a, c)); nb[c].update((a, b))
    return nb


def shell(m, offset, smooth=0, min_off=None, keep_boundary=False, max_off=None):
    """Offset along normals (offset scalar or [N]), Laplacian-smooth, keep at least min_off outside."""
    off = np.broadcast_to(np.asarray(offset, float), (len(m.P),)).copy()
    P0, N0 = m.P.copy(), m.N.copy()
    P = P0 + N0 * off[:, None]
    if smooth:
        nb = neighbours(m.T, len(P))
        idx = [np.array(sorted(s)) for s in nb]
        # boundary detection: edges used once
        bnd = np.zeros(len(P), bool)
        if keep_boundary:
            from collections import Counter
            ec = Counter()
            for a, b, c in m.T:
                for e in ((a, b), (b, c), (c, a)): ec[(min(e), max(e))] += 1
            for (a, b), k in ec.items():
                if k == 1: bnd[a] = bnd[b] = True
        for _ in range(smooth):
            avg = np.array([P[i].mean(0) if len(i) else P[k] for k, i in enumerate(idx)])
            P = np.where(bnd[:, None], P, 0.5 * P + 0.5 * avg)
    mo = off if min_off is None else np.broadcast_to(np.asarray(min_off, float), (len(P),))
    d = ((P - P0) * N0).sum(1)
    P = P + N0 * np.maximum(0, mo - d)[:, None]
    if max_off is not None:
        xo = np.broadcast_to(np.asarray(max_off, float), (len(P),))
        d = ((P - P0) * N0).sum(1)
        P = P - N0 * np.maximum(0, d - xo)[:, None]
    out = Mesh(P, m.T.copy(), m.UV.copy(), m.W.copy(), {k: v.copy() for k, v in m.S.items()})
    return out


def sample_weights(body, pts, k=6):
    """Skin weights for arbitrary points: inverse-distance blend of the k nearest body verts."""
    from scipy.spatial import cKDTree
    tree = cKDTree(body.P)
    d, i = tree.query(pts, k)
    w = 1 / (d + 1e-3) ** 2
    W = (body.W[i] * w[..., None]).sum(1) / w.sum(1, keepdims=True)
    return normalize_weights(W)


def normalize_weights(W, keep=4):
    W = W.copy()
    if keep:
        order = np.argsort(-W, axis=1)
        mask = np.zeros_like(W, bool)
        np.put_along_axis(mask, order[:, :keep], True, 1)
        W[~mask] = 0
    s = W.sum(1, keepdims=True); s[s == 0] = 1
    return W / s


def grid_mesh(rows, cols, pos_fn, closed=False, uv_rect=(0, 0, 1, 1), double=False):
    """Parametric quad grid. pos_fn(u, v) -> [3] with u along cols (0..1), v along rows (0..1)."""
    cu = cols + (0 if closed else 1)
    P = np.array([pos_fn(c / cols, r / rows) for r in range(rows + 1) for c in range(cu)])
    T, UV = [], []
    u0, v0, u1, v1 = uv_rect
    def uvof(c, r): return (u0 + (u1 - u0) * c / cols, v0 + (v1 - v0) * r / rows)
    for r in range(rows):
        for c in range(cols):
            c2 = (c + 1) % cu if closed else c + 1
            a, b, d, e = r * cu + c, r * cu + c2, (r + 1) * cu + c2, (r + 1) * cu + c
            ua, ub, ud, ue = uvof(c, r), uvof(c + 1, r), uvof(c + 1, r + 1), uvof(c, r + 1)
            T += [[a, b, d], [a, d, e]]; UV += [[ua, ub, ud], [ua, ud, ue]]
            if double:
                T += [[a, d, b], [a, e, d]]; UV += [[ua, ud, ub], [ua, ue, ud]]
    return np.array(P), np.array(T), np.array(UV)


def tube_along(path, radius, sides=10, uv_rect=(0, 0, 1, 1)):
    """Tube along a polyline path [K,3] with radius scalar or [K]."""
    path = np.asarray(path, float); K = len(path)
    r = np.broadcast_to(np.asarray(radius, float), (K,))
    tang = np.gradient(path, axis=0); tang /= np.linalg.norm(tang, axis=1, keepdims=True)
    ref = np.array([0, 1.0, 0])
    def pos(u, v):
        k = min(K - 1, int(round(v * (K - 1))))
        t = tang[k]; a = np.cross(t, ref)
        if np.linalg.norm(a) < 1e-3: a = np.cross(t, [1, 0, 0])
        a /= np.linalg.norm(a); b = np.cross(t, a)
        th = 2 * np.pi * u
        return path[k] + r[k] * (np.cos(th) * a + np.sin(th) * b)
    return grid_mesh(K - 1, sides, pos, closed=True, uv_rect=uv_rect)
