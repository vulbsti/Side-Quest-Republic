"""Find stationary stretches in BVH takes (candidates for Idle / Film / Chant bases).
usage: python3 find_still.py bvh_dir [window_s]
Prints, per take, the best window: max horizontal hip excursion (m, assuming CMU
units ~ 0.056 m) and mean hand speed (m/s) - an idle wants both small."""
import sys, os
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
import retarget as R

d = sys.argv[1]; W = float(sys.argv[2]) if len(sys.argv) > 2 else 4.0
U = 0.056
for f in sorted(os.listdir(d)):
    if not f.endswith('.bvh'): continue
    try: s = R.Source(os.path.join(d, f))
    except Exception as e: print(f, 'ERR', e); continue
    n = int(W / s.ft); step = max(1, int(0.25 / s.ft))
    hp = s.pos['Hips'][:, [0, 2]] * U
    hands = (np.linalg.norm(np.diff(s.pos['LeftHand'], axis=0), axis=1) + np.linalg.norm(np.diff(s.pos['RightHand'], axis=0), axis=1)) * U / s.ft / 2
    upright = (s.pos['Head'][:, 1] - s.pos['Hips'][:, 1]) * U
    best = None
    for i in range(0, s.nframes - n, step):
        ex = np.linalg.norm(hp[i:i + n] - hp[i:i + n].mean(0), axis=1).max()
        hs = hands[i:i + n - 1].mean()
        up = upright[i:i + n].min()
        if up < 0.85 * np.median(upright): continue
        sc = ex * 4 + hs
        if best is None or sc < best[0]: best = (sc, i * s.ft, ex, hs)
    if best: print(f'{f:12s} {s.nframes * s.ft:6.1f}s best {best[1]:6.2f}-{best[1] + W:6.2f}s  excursion {best[2]:.3f} m  hands {best[3]:.3f} m/s')
