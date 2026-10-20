"""Procedural textures for flags, placards, RAF camouflage and vehicle livery.

All original artwork generated here (no third-party images). Party names and
symbols are the game's fictional stand-ins (slice spec, owner decision 19 Oct).
usage: python3 textures.py out_dir
"""
import os, sys, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

OUT = sys.argv[1] if len(sys.argv) > 1 else 'tex'
os.makedirs(OUT, exist_ok=True)
FONT_BOLD = '/usr/share/fonts/truetype/freefont/FreeSansBold.ttf'
FONT_SERIF = '/usr/share/fonts/truetype/freefont/FreeSerifBold.ttf'
SAFFRON = (240, 128, 30)
GREEN = (22, 120, 58)
rng = random.Random(7)


def font(size, path=FONT_BOLD):
    return ImageFont.truetype(path, size, layout_engine=ImageFont.Layout.RAQM)


def cloth(img, strength=10, seed=1):
    """Weave noise and soft fold shading so flags don't read as flat vector art."""
    a = np.asarray(img).astype(np.float32)
    h, w = a.shape[:2]
    r = np.random.default_rng(seed)
    n = r.normal(0, 1, (h, w)).astype(np.float32)
    weave = (np.sin(np.arange(w) * 2.2)[None, :] * np.sin(np.arange(h) * 2.2)[:, None]) * 2
    folds = np.sin(np.linspace(0, 5.5 * math.pi, w) + 0.6)[None, :] * 9
    a[..., :3] += (n * strength * 0.4 + weave + folds)[..., None]
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), img.mode)


def marigold(d, cx, cy, r):
    for ring, (rr, col) in enumerate(((1.0, (232, 120, 10)), (0.78, (247, 160, 20)), (0.55, (252, 196, 40)))):
        n = 16 + ring * 4
        for i in range(n):
            a = 2 * math.pi * (i + 0.5 * ring) / n
            px, py = cx + math.cos(a) * r * rr * 0.62, cy + math.sin(a) * r * rr * 0.62
            pr = r * rr * 0.36
            d.ellipse([px - pr, py - pr, px + pr, py + pr], fill=col, outline=(190, 90, 5))
    d.ellipse([cx - r * .22, cy - r * .22, cx + r * .22, cy + r * .22], fill=(150, 70, 10))


def flag_party():
    w, h = 768, 512
    im = Image.new('RGB', (w, h), SAFFRON)
    d = ImageDraw.Draw(im)
    d.rectangle([0, h // 2, w, h], fill=GREEN)
    d.ellipse([w / 2 - 150, h / 2 - 150, w / 2 + 150, h / 2 + 150], fill=(250, 246, 232))
    marigold(d, w / 2, h / 2, 130)
    im = cloth(im, seed=2)
    im.save(f'{OUT}/flag-party.png')


def flag_sena():
    # swallowtail saffron pennant; shape is cut in geometry, texture fills the square
    w, h = 768, 512
    im = Image.new('RGB', (w, h), (236, 110, 18))
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, w, 26], fill=(200, 80, 10)); d.rectangle([0, h - 26, w, h], fill=(200, 80, 10))
    f = font(70, FONT_SERIF)
    d.text((300, h / 2), 'धर्म रक्षा सेना', font=f, fill=(255, 236, 200), anchor='mm')
    im = cloth(im, seed=3)
    im.save(f'{OUT}/flag-sena.png')


def ceiling_fan(d, cx, cy, r, col):
    d.ellipse([cx - r * .2, cy - r * .2, cx + r * .2, cy + r * .2], fill=col)
    for i in range(3):
        a = 2 * math.pi * i / 3 - math.pi / 2
        pts = []
        for t, wdt in ((0.18, 0.10), (0.95, 0.20), (1.0, 0.0), (0.95, -0.20), (0.18, -0.10)):
            bx, by = math.cos(a) * r * t, math.sin(a) * r * t
            nx, ny = -math.sin(a) * r * wdt, math.cos(a) * r * wdt
            pts.append((cx + bx + nx, cy + by + ny))
        d.polygon(pts, fill=col)
    d.line([cx, cy - r * .2, cx, cy - r * .55], fill=col, width=int(r * .08))


def flag_opp():
    w, h = 768, 512
    im = Image.new('RGB', (w, h), (250, 250, 246))
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, w, h / 3], fill=(24, 74, 160))
    d.rectangle([0, 2 * h / 3, w, h], fill=(30, 140, 70))
    ceiling_fan(d, w / 2, h / 2 + 6, 80, (24, 60, 130))
    im = cloth(im, seed=4)
    im.save(f'{OUT}/flag-opp.png')


PLACARDS = [
    ('PAPER LEAK\n= FUTURE\nLEAK', (250, 245, 230), (20, 20, 20)),
    ('हमें नौकरी\nचाहिए', (255, 230, 90), (170, 20, 20)),
    ('RE-EXAM\nNOW!', (255, 255, 255), (20, 50, 150)),
    ('पढ़ने दो', (240, 240, 235), (10, 10, 10)),
    ('GEN Z IS\nWATCHING', (255, 200, 210), (20, 20, 20)),
    ('NOT A\nRUMOUR', (205, 235, 255), (180, 20, 20)),
    ('AZADI\nSE PADHAI', (250, 245, 230), (20, 90, 30)),
    ('MY FUTURE\nNOT YOUR\nJUMLA', (255, 245, 170), (20, 20, 20)),
]


def placards():
    """4x2 atlas of hand-lettered chart-paper placards, 256x320 each."""
    cw, ch = 256, 320
    im = Image.new('RGB', (cw * 4, ch * 2), 'white')
    for i, (txt, bg, ink) in enumerate(PLACARDS):
        x0, y0 = (i % 4) * cw, (i // 4) * ch
        tile = Image.new('RGB', (cw, ch), bg)
        d = ImageDraw.Draw(tile)
        lines = txt.split('\n')
        size = 80
        while size > 20 and (max(d.textlength(l, font=font(size)) for l in lines) > cw - 36 or len(lines) * size * 1.15 > ch - 60):
            size -= 2
        f = font(size)
        total = len(lines) * size * 1.15
        for k, line in enumerate(lines):
            y = ch / 2 - total / 2 + k * size * 1.15 + size / 2
            jitter = rng.uniform(-6, 6)
            # marker: draw twice slightly offset for uneven stroke
            d.text((cw / 2 + jitter, y), line, font=f, fill=ink, anchor='mm')
            d.text((cw / 2 + jitter + 1.5, y + 1), line, font=f, fill=ink, anchor='mm')
        if i % 3 == 0:
            d.line([20, ch - 40, cw - 20, ch - 46], fill=ink, width=5)  # underline
        tile = tile.rotate(rng.uniform(-2, 2), resample=Image.BICUBIC, fillcolor=bg)
        im.paste(cloth(tile, strength=5, seed=10 + i), (x0, y0))
    im.save(f'{OUT}/placards.png')


def camo_raf():
    """RAF blue 'dungaree' camouflage: pale blue-grey ground, mid blue, navy and white blotches."""
    s = 512
    r = np.random.default_rng(11)
    def blob(scale, thr, seed):
        n = Image.fromarray((np.random.default_rng(seed).random((s // scale, s // scale)) * 255).astype(np.uint8))
        n = n.resize((s, s), Image.BICUBIC).filter(ImageFilter.GaussianBlur(scale * 0.6))
        a = np.asarray(n).astype(float)
        a = (a - a.mean()) / a.std()
        return a > thr
    base = np.zeros((s, s, 3)); base[:] = (132, 158, 190)
    for (col, scale, thr, seed) in (((70, 104, 160), 40, 0.3, 1), ((34, 48, 92), 28, 0.8, 2), ((222, 230, 240), 22, 1.1, 3)):
        m = blob(scale, thr, seed)
        base[m] = col
    img = Image.fromarray(base.astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
    img = cloth(img, strength=8, seed=12)
    # tileable enough via mirrored wrap
    img.save(f'{OUT}/camo-raf.png')


def livery_text():
    """Text decals: DELHI POLICE, VAJRA, VIP sticker. RGBA."""
    for name, txt, fg, bg, size, w, h in (
        ('decal-delhi-police', 'DELHI POLICE', (20, 50, 140), None, 120, 1024, 160),
        ('decal-vajra', 'वज्र  VAJRA', (200, 20, 20), None, 110, 768, 150),
        ('decal-vip', 'VIP', (255, 255, 255), (200, 20, 20), 120, 320, 160),
        ('decal-police-hi', 'दिल्ली पुलिस', (20, 50, 140), None, 110, 768, 160),
        ('decal-raf', 'RAF', (240, 240, 240), None, 120, 320, 160),
    ):
        im = Image.new('RGBA', (w, h), bg + (255,) if bg else (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        if bg: d.rounded_rectangle([4, 4, w - 5, h - 5], 18, outline=(255, 255, 255, 255), width=8)
        d.text((w / 2, h / 2), txt, font=font(size), fill=fg + (255,), anchor='mm')
        im.save(f'{OUT}/{name}.png')


def tee_prints():
    """Chest prints for oversized tees (RGBA, centred)."""
    designs = [('DELHI\n6', (250, 250, 250)), ('NO\nCHILL', (20, 20, 20)), ('★', (250, 210, 40)), ('रुको\nज़रा', (250, 250, 250))]
    for i, (txt, col) in enumerate(designs):
        im = Image.new('RGBA', (256, 256), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        d.multiline_text((128, 128), txt, font=font(84 if len(txt) < 3 else 64), fill=col + (255,), anchor='mm', align='center', spacing=2)
        im.save(f'{OUT}/print-{i}.png')


if __name__ == '__main__':
    flag_party(); flag_sena(); flag_opp(); placards(); camo_raf(); livery_text(); tee_prints()
    print('textures written to', OUT)
