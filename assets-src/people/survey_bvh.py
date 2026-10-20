"""Stick-figure survey sheets of BVH clips, to pick clip segments by eye.

usage: python3 survey_bvh.py out_dir file.bvh [start_s end_s] ...
Each sheet: 2 rows (front view, side view) of 16 poses sampled across the range.
"""
import sys, os
import numpy as np
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(__file__))
import bvhlib

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
args = sys.argv[2:]
i = 0
while i < len(args):
    path = args[i]; i += 1
    rng = None
    if i + 1 < len(args) and args[i].replace('.', '').isdigit():
        rng = (float(args[i]), float(args[i + 1])); i += 2
    joints, data, ft = bvhlib.load(path)
    P = bvhlib.fk(joints, data)
    F = data.shape[0]
    a, b = (1, F - 1) if not rng else (int(rng[0] / ft), min(F - 1, int(rng[1] / ft)))
    hips = P['Hips'][0]
    v = np.linalg.norm(np.diff(hips[:, [0, 2]], axis=0), axis=1) / ft
    name = os.path.basename(path)[:-4]
    print(f'{name}: {F} frames {F*ft:.1f}s  hipY(T)={hips[0,1]:.2f} mean hor speed {v[a:b].mean():.2f} u/s  head-top {P["Head"][0][0,1]:.2f}')
    N = 16
    idx = np.linspace(a, b, N).astype(int)
    W, H = 110, 150
    img = Image.new('RGB', (W * N, H * 2 + 14), 'white')
    d = ImageDraw.Draw(img)
    sc = H / 40.0
    for k, f in enumerate(idx):
        for row, (ax0, ax1) in enumerate(((0, 1), (2, 1))):
            ox, oy = W * k + W / 2, H * (row + 1) - 6
            c = P['Hips'][0][f]
            for j in joints:
                if j.parent is None: continue
                p0 = P[j.parent.name][0][f] - c; p1 = P[j.name][0][f] - c
                col = 'red' if j.name.startswith(('Left', 'L')) else 'blue' if j.name.startswith(('Right', 'R')) else 'black'
                d.line([(ox + p0[ax0] * sc, oy - (p0[ax1] + c[1]) * sc), (ox + p1[ax0] * sc, oy - (p1[ax1] + c[1]) * sc)], fill=col, width=2)
            d.line([(W * k, oy), (W * k + W, oy)], fill='#bbb')
        d.text((W * k + 3, H * 2 + 1), f'{f*ft:.2f}s', fill='black')
    img.save(os.path.join(out, name + ('' if not rng else f'_{rng[0]:g}') + '.png'))
