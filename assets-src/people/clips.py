"""Clip list: which CMU take and which seconds become each game clip.

Run: python3 clips.py <skeleton.glb> <out.json> [preview_dir]
Writes per-clip tracks (glTF-space local quaternions per joint, Hips translation)
that add_animations.mjs merges into the people GLBs.
"""
import sys, os, json
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
import retarget as R
import overlays

BVH = os.environ.get('BVH_DIR', '/home/claude/sq/bvh')

# name: (take, start s, end s or None for auto-loop window, mode, loop, extra)
# mode: inplace (locomotion; root travel removed, speed reported), centered, stationary
CLIPS = {
    'Idle':    dict(take='15_04', range=(1.0, 7.0), loop_len=(3.0, 5.5), mode='centered'),
    'Walk':    dict(take='35_01', range=(0.3, 2.9), loop_len=(0.95, 1.25), mode='inplace'),
    'Run':     dict(take='35_17', range=(0.2, 1.35), loop_len=(0.6, 0.8), mode='inplace'),
    'Talk':    dict(take='18_08', range=(0.5, 9.0), loop_len=(4.0, 7.0), mode='centered'),
    'Chant':   dict(take='15_04', range=(1.0, 7.0), loop_len=(1.9, 2.1), mode='centered', overlay='chant'),
    'Film':    dict(take='15_04', range=(1.0, 7.0), loop_len=(3.0, 5.0), mode='centered', overlay='film'),
    'Lathi':   dict(take='02_07', range=(0.0, 18.0), loop_len=(1.2, 2.4), mode='centered'),
    # stagger travel is removed and reported as speed (backwards): move the root ~speed*duration
    'Shoved':  dict(take='23_12', range=(0.8, 2.4), mode='inplace', travel='face', loop=False),
    'Duck':    dict(take='77_09', range=(1.5, 2.75), mode='stationary', loop=False),
    'Sit':     dict(take='82_05', range=(1.0, 12.0), loop_len=(4.0, 8.0), mode='centered', ground=False),
    'Dance':   dict(take='111_05', range=(0.5, 7.5), loop_len=(2.0, 4.0), mode='centered', drift=0.4),
    'Push':    dict(take='81_05', range=(3.0, 9.5), loop_len=(1.0, 2.2), mode='inplace', report_speed=False, overlay='push'),
    'Wave':    dict(take='13_26', range=(0.8, 2.6), loop_len=(0.6, 1.6), mode='centered', drift=0.5),
    'Jump':    dict(take='13_39', range=(0.45, 2.2), mode='stationary', loop=False),
    'Lie':     dict(take='77_18', range=(0.1, 1.9), loop_len=(1.0, 1.8), mode='centered', ground=False),
}

GAIT = ('Walk', 'Run')


def left_forward(src, t):
    """Left foot ahead of the right along the travel direction (source units)."""
    f = np.clip((t / src.ft).astype(int), 0, src.nframes - 1)
    h = src.pos['Hips']
    d = h[min(src.nframes - 1, f[-1] + 30)] - h[max(0, f[0] - 30)]; d[1] = 0; d /= np.linalg.norm(d) + 1e-9
    return ((src.pos['LeftFoot'][f] - src.pos['RightFoot'][f]) * d).sum(1)


def pose_features(src, t):
    """Joint positions relative to hips for frame times t (source units)."""
    names = ['LeftFoot', 'RightFoot', 'LeftHand', 'RightHand', 'Head', 'LeftLeg', 'RightLeg', 'LeftForeArm', 'RightForeArm']
    f = np.clip((t / src.ft).astype(int), 0, src.nframes - 1)
    h = src.pos['Hips'][f]
    feats = [src.pos[n][f] - h for n in names]
    # velocities matter for a seamless loop
    f2 = np.clip(f + 4, 0, src.nframes - 1)
    feats += [(src.pos[n][f2] - src.pos['Hips'][f2]) - (src.pos[n][f] - h) for n in names[:4]]
    return np.concatenate(feats, axis=1)


def best_window(src, rng, loop_len, step=1 / 60, drift=0.0):
    """Loop window whose end pose matches its start. drift > 0 also penalises horizontal
    hip travel across the window (stationary clips must not wander: the loop fix-up would
    turn wander into foot slide)."""
    t = np.arange(rng[0], min(rng[1], src.nframes * src.ft - 0.1), step)
    X = pose_features(src, t)
    if drift:
        f = np.clip((t / src.ft).astype(int), 0, src.nframes - 1)
        hp = src.pos['Hips'][f][:, [0, 2]]
        # worst excursion from the window start, not just the end point
        X = np.concatenate([X, hp * 0], 1)
    best = (1e9, None)
    lo, hi = int(loop_len[0] / step), int(loop_len[1] / step)
    for i in range(len(t)):
        js = np.arange(i + lo, min(len(t), i + hi + 1))
        if not len(js): break
        d = np.linalg.norm(X[js] - X[i], axis=1)
        if drift:
            seg = np.linalg.norm(hp[i:js[-1] + 1] - hp[i], axis=1)
            d = d + drift * np.maximum.accumulate(seg)[js - i]
        k = int(np.argmin(d))
        if d[k] < best[0]: best = (float(d[k]), (float(t[i]), float(t[js[k]])))
    return best


def build(skel_path, out_path, preview=None):
    skel = R.Skeleton(skel_path)
    out = {'skeleton': skel.names, 'clips': {}}
    cache = {}
    head_fix = None
    for name, c in CLIPS.items():
        src = cache.get(c['take']) or R.Source(os.path.join(BVH, c['take'] + '.bvh'))
        cache[c['take']] = src
        loop = c.get('loop', True)
        if loop and 'loop_len' in c:
            err, (a, b) = best_window(src, c['range'], c['loop_len'], drift=0.0 if c['mode'] == 'inplace' else c.get('drift', 2.0))
        else:
            err, (a, b) = 0.0, c['range']
        if name in GAIT:
            # start every gait cycle at the same event (left foot furthest ahead) so Walk and Run
            # can be phase-synchronised at runtime by normalised time
            L = b - a
            ts = np.arange(max(c['range'][0], a - L / 2), a + L / 2, 1 / 240)
            lf = left_forward(src, ts)
            a = float(ts[np.argmax(lf)]); b = a + L
        res = R.retarget(src, skel, a, b, travel=c.get('travel', 'auto' if c['mode'] == 'inplace' else 'face'))
        if c.get('overlay'):
            overlays.apply(c['overlay'], skel, res)
        t, q, rt, speed = R.finish(skel, res, mode=c['mode'], loop=loop, ground=c.get('ground', True))
        if not c.get('report_speed', True): speed = 0.0
        # Head level: one constant per skeleton, measured on Idle (the first clip), so the
        # resting gaze is ~4 deg below horizontal on both bodies whatever the rest-pose
        # neck angles; applied identically to every clip so head motion is untouched.
        hk = skel.index['Head']
        if head_fix is None:
            Lm = np.array([[R.quat_to_mat(x) for x in fr] for fr in q])
            WRh, _ = skel.fk(Lm, rt)
            fwd = np.einsum('fij,j->fi', WRh[:, hk] @ skel.rest_world_r[hk].T, [0, 0, 1.0])
            pitch = float(np.degrees(np.arcsin(np.clip(fwd[:, 1].mean(), -1, 1))))
            th = np.radians(-(-4.0 - pitch))
            Rt = skel.rest_world_r[hk]
            head_fix = Rt.T @ R.axis_angle([1, 0, 0], th) @ Rt
            print(f'head level fix: idle gaze pitch {pitch:.1f} deg -> -4 deg')
        q[:, hk] = np.array([R.mat_to_quat(R.quat_to_mat(x) @ head_fix) for x in q[:, hk]])
        out['clips'][name] = dict(take=c['take'], window=[round(a, 3), round(b, 3)], seam_error=round(err, 3),
                                  loop=loop, speed=round(speed, 3), fps=res['fps'],
                                  times=t.round(4).tolist(), rot=q.round(5).tolist(), hips=rt.round(4).tolist())
        print(f'{name:7s} take {c["take"]:7s} {a:6.2f}-{b:6.2f}s dur {t[-1]:.2f}s seam {err:6.2f} speed {speed:.2f} m/s scale {res["scale"]:.4f}')
        if preview:
            sheet(skel, q, rt, os.path.join(preview, name + '.png'))
    json.dump(out, open(out_path, 'w'))


def sheet(skel, q, rt, path, N=12):
    from PIL import Image, ImageDraw
    L = np.array([[R.quat_to_mat(x) for x in fr] for fr in q])
    WR, WP = skel.fk(L, rt)
    F = len(q); idx = np.linspace(0, F - 1, N).astype(int)
    W, H = 120, 210
    img = Image.new('RGB', (W * N, H * 2), 'white'); d = ImageDraw.Draw(img)
    sc = H / 2.1
    for k, f in enumerate(idx):
        for row, ax0 in enumerate((0, 2)):
            ox, oy = W * k + W / 2, H * (row + 1) - 8
            for j, p in enumerate(skel.parent):
                if p < 0: continue
                a, b = WP[f, p], WP[f, j]
                n = skel.names[j]
                col = 'red' if n.startswith('Left') else 'blue' if n.startswith('Right') else 'black'
                sgn = 1 if row == 0 else -1
                d.line([(ox + sgn * a[ax0] * sc, oy - a[1] * sc), (ox + sgn * b[ax0] * sc, oy - b[1] * sc)], fill=col, width=2)
            d.line([(W * k, oy), (W * k + W, oy)], fill='#bbb')
    img.save(path)


if __name__ == '__main__':
    if len(sys.argv) > 3: os.makedirs(sys.argv[3], exist_ok=True)
    build(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None)
