"""The variant list. Colours and garments are art direction for a Delhi protest day:
students in oversized tees, hoodies and kurtas over jeans; an uncle in a tucked-in
check shirt; an aunty in a salwar kameez and dupatta; a chai/snack vendor with a
gamchha; RUP workers in white kurta-pyjama with a party stole; DRS men with saffron
scarves and headbands; a Delhi Police constable in khaki; an RAF jawan in blue camo.
"""
import numpy as np
import fabric as Fb
import variants as V
from variants import part, top_field, bottom_field, belly, skirt, strip, cap_mesh, face_patch, glasses, bag, belt, hood, boots, paint_top, img


def cover(field, margin):
    return lambda m: field(m) + margin


def tee(rig, color, print_name=None, hem=-0.10, sleeve=0.62, off=0.034, fn=None):
    J = rig.J
    f = lambda m: top_field(rig, m, J['Hips'][1] + hem, sleeve, dip=0.035)
    o = lambda m: off + 0.014 * np.clip(m.S['s_arm'], 0, 1) * (m.S['arm'] > 0.5)
    mesh = part(rig, f, o, smooth=12, min_off=lambda m: o(m) * 0.7)
    base = fn or (lambda t: Fb.knit(t, color))
    pr = img(print_name) if print_name else None
    paint = paint_top(base, pr, ((0, J['Spine2'][1] + 0.0), (0.2, 0.2)))
    return dict(mesh=mesh, paint=paint, cover=cover(f, 0.02))


def shirt(rig, fn, hem=-0.06, sleeve=0.55, off=0.016, paunch=0.0, placket=True, pockets=None):
    J = rig.J
    f = lambda m: top_field(rig, m, J['Hips'][1] + hem, sleeve, dip=0.06, drop=0.015)
    pb = belly(rig, paunch)
    o = lambda m: off + pb(m) + 0.008 * np.clip(m.S['s_arm'], 0, 1) * (m.S['arm'] > 0.5)
    mesh = part(rig, f, o, smooth=6, min_off=lambda m: o(m) * 0.8)
    paint = paint_top(fn, placket=(0.018, J['Hips'][1] + hem, (235, 230, 220)) if placket else None, pockets=pockets)
    return dict(mesh=mesh, paint=paint, cover=cover(f, 0.02))


def jeans(rig, fn=None, waist=0.03, hem=1.93, off=0.010, flare=0.006, paunch=0.0):
    J = rig.J
    f = lambda m: bottom_field(rig, m, J['Hips'][1] + waist, hem)
    pb = belly(rig, paunch)
    o = lambda m: off + flare * np.clip(m.S['s_leg'], 0, 2) + pb(m) * 1.1
    mesh = part(rig, f, o, smooth=3, min_off=lambda m: o(m) * 0.7, max_off=lambda m: o(m) * 1.15)
    return dict(mesh=mesh, paint=fn or (lambda t: Fb.denim(t)), cover=cover(f, 0.05))


def pyjama(rig, fn, waist=0.04, hem=1.95, off=0.02):
    return jeans(rig, fn, waist, hem, off, flare=0.018)


def kurta(rig, fn, length, sleeve=1.85, off=0.02, paunch=0.0, slots=None):
    """Kurta/kameez: shell to the hip + a slit two-panel skirt to `length` (y)."""
    J = rig.J
    hip = J['Hips'][1] - 0.04
    f = lambda m: top_field(rig, m, hip, sleeve, dip=0.05, drop=0.012)
    pb = belly(rig, paunch)
    o = lambda m: off + pb(m) + 0.006 * np.clip(m.S['s_arm'], 0, 2) * (m.S['arm'] > 0.5)
    top = part(rig, f, o, smooth=6, min_off=lambda m: o(m) * 0.6)
    rect = slots.take(4, 2)
    sk = skirt(rig, hip + 0.03, length, flare=0.07, pad=off + 0.012 + paunch * 0.6, uv_rect=rect)
    paint = paint_top(fn, placket=(0.02, J['Spine2'][1] - 0.02, (200, 190, 170)))
    return [dict(mesh=top, paint=paint, cover=cover(f, 0.02)), dict(mesh=sk, paint=fn)]


def scarf(rig, slots, fn, style='stole', width=0.13):
    J = rig.J
    n, ls, rs = J['Neck'], J['LeftShoulder'], J['RightShoulder']
    if style == 'stole':      # around the neck, both ends down the chest
        path = [ls + np.array([-0.0, -0.40, 0.12]), ls + np.array([-0.01, -0.14, 0.10]), ls + np.array([-0.02, 0.0, 0.04]), n + np.array([0.0, -0.035, -0.07]),
                rs + np.array([0.02, 0.0, 0.04]), rs + np.array([0.01, -0.14, 0.10]), rs + np.array([0.0, -0.40, 0.12])]
    elif style == 'dupatta':  # over both shoulders, ends hanging down the back, U across the chest
        path = [ls + np.array([0.08, -0.55, -0.12]), ls + np.array([0.08, -0.05, -0.08]), ls + np.array([0.08, 0.05, 0.02]), J['Spine2'] + np.array([0.08, -0.02, 0.14]),
                J['Spine2'] + np.array([0.0, -0.08, 0.16]), J['Spine2'] + np.array([-0.08, -0.02, 0.14]), rs + np.array([-0.08, 0.05, 0.02]), rs + np.array([-0.08, -0.05, -0.08]), rs + np.array([-0.08, -0.55, -0.12])]
    elif style == 'gamchha':  # over the left shoulder, front and back
        path = [ls + np.array([0.04, -0.42, 0.12]), ls + np.array([0.04, -0.1, 0.1]), ls + np.array([0.06, 0.05, 0.0]), ls + np.array([0.04, -0.1, -0.1]), ls + np.array([0.04, -0.4, -0.12])]
    rect = slots.take(1, 2)
    m = strip(rig, path, width, offset=0.035, uv_rect=rect)
    return dict(mesh=m, paint=fn)


def headgear(rig, slots, kind, fn):
    rect = slots.take()
    return dict(mesh=cap_mesh(rig, kind, rect), paint=fn)


def moustache(rig, slots, color=(30, 24, 20), w=0.05):
    hf = V.head_frame(rig)
    rect = slots.take()
    c = hf['nose'] + np.array([0, -0.024, 0])
    m = face_patch(rig, c, w, 0.011, rect, lift=0.0025, curve=0.009, taper=0.7)
    def paint(t):
        u = t['uvl'] if 'uvl' in t else np.zeros((len(t['pos']), 2))
        strands = 0.75 + 0.35 * np.abs(np.sin(u[:, 0] * 140 + 9 * u[:, 1]))
        return Fb.mul(np.tile(Fb.srgb(color), (len(t['pos']), 1)), strands * (0.85 + 0.3 * V.uvpaint_noise(t)))
    return dict(mesh=m, paint=paint)


def tilak(rig, slots):
    hf = V.head_frame(rig)
    rect = slots.take()
    c = hf['nose'] + np.array([0, 0.062, -0.012])
    m = face_patch(rig, c, 0.008, 0.03, rect, lift=0.0015)
    return dict(mesh=m, paint=lambda t: np.tile(Fb.srgb((215, 70, 20)), (len(t['pos']), 1)))


def solid(c, f=Fb.cotton):
    return lambda t: f(t, c)


def stripes_gamchha(t):
    u = t['uvl'] if 'uvl' in t else np.zeros((len(t['pos']), 2))
    a = (np.floor(u[:, 0] * 14) % 3 == 0) | (np.floor(u[:, 1] * 70) % 3 == 0)
    b = (np.floor(u[:, 0] * 14) % 3 == 0) & (np.floor(u[:, 1] * 70) % 3 == 0)
    rgb = np.where(a[:, None], Fb.srgb((185, 45, 40)), Fb.srgb((232, 222, 196)))
    rgb = np.where(b[:, None], Fb.srgb((120, 25, 30)), rgb)
    return Fb.mul(rgb.astype(np.float32), 0.9 + 0.1 * np.random.default_rng(0).random(len(rgb)))


def dupatta_fn(base, border):
    def fn(t):
        u = t['uvl'][:, 0] if 'uvl' in t else np.zeros(len(t['pos']))
        rgb = Fb.cotton(t, base, slub=0.03)
        edge = (u < 0.07) | (u > 0.93)
        rgb[edge] = Fb.srgb(border)
        # loose pleats: soft light/dark bands along the length of the cloth
        return Fb.mul(rgb, 0.9 + 0.1 * np.cos(u * 2 * np.pi * 3.5) ** 2)
    return fn


def party_stole(t):
    u = t['uvl'][:, 0] if 'uvl' in t else np.zeros(len(t['pos']))
    rgb = np.where(u[:, None] < 0.5, Fb.srgb((240, 128, 30)), Fb.srgb((22, 120, 58))).astype(np.float32)
    return Fb.mul(rgb, 0.92 + 0.08 * V.uvpaint_noise(t))


def cap_paint(t):
    rgb = Fb.twill(t, (160, 135, 90))
    h = t['uvl'][:, 1] if 'uvl' in t else np.zeros(len(rgb))
    band = h < 0.035
    rgb[band] = Fb.srgb((40, 30, 25))
    return rgb


def uniform_khaki(t):
    return Fb.twill(t, (176, 150, 100))


SPECS = {'male': [], 'female': []}

def add(sex, name, label, kind, garments, **kw):
    SPECS[sex].append(dict(name=name, label=label, kind=kind, garments=garments, **kw))


# ---------------------------------------------------------------- male skeleton
add('male', 'student-tee', 'Gen Z student, oversized tee and jeans', 'civilian',
    lambda r, s: [tee(r, (214, 168, 52), 'print-0.png'), jeans(r, waist=-0.06)], skin='wheat', shoe_tint=(235, 235, 235))
add('male', 'student-hoodie', 'Gen Z student, hoodie and joggers', 'civilian',
    lambda r, s: [tee(r, (60, 62, 66), None, hem=-0.12, sleeve=1.9, off=0.026, fn=lambda t: Fb.knit(t, (60, 62, 66), heather=0.12)),
                  dict(mesh=hood(r, s.take()), paint=lambda t: Fb.knit(t, (55, 57, 60))),
                  jeans(r, lambda t: Fb.knit(t, (30, 30, 34)), waist=-0.08, off=0.014, flare=0.01)], skin='dusky', shoe_tint=(240, 240, 240))
add('male', 'student-kurta', 'Student, short kurta over jeans with a jhola', 'civilian',
    lambda r, s: kurta(r, lambda t: Fb.block_print(t, (160, 72, 42), (240, 220, 180)), r.J['LeftLeg'][1] + 0.16, sleeve=1.55, slots=s)
    + [jeans(r, waist=-0.02, off=0.009), dict(mesh=bag(r, s.take(2, 1), s.take()), paint=lambda t: Fb.cotton(t, (205, 190, 150)))], skin='wheat')
add('male', 'uncle', 'Uncle, check shirt tucked in, grey trousers', 'civilian',
    lambda r, s: [shirt(r, lambda t: Fb.checks(t, (200, 205, 215), (95, 115, 160), (60, 75, 120), pitch=0.022), hem=-0.14, sleeve=0.6, paunch=0.05,
                        pockets=[(0.09, r.J['Spine2'][1] - 0.02, 0.11, 0.12, (60, 75, 120))]),
                  jeans(r, lambda t: Fb.twill(t, (95, 95, 98)), waist=0.06, off=0.016, flare=0.008, paunch=0.05),
                  dict(mesh=belt(r, r.J['Hips'][1] + 0.045, s.take(), pad=0.03 + 0.03), paint=solid((40, 28, 20))),
                  moustache(r, s, (60, 58, 55)), dict(mesh=glasses(r, s.take()), paint=solid((30, 30, 30)))],
    skin='wheat', hair='grey', hair_grey=True)
add('male', 'vendor', 'Chai and snacks vendor, kurta-pyjama and gamchha', 'civilian',
    lambda r, s: kurta(r, lambda t: Fb.cotton(t, (196, 186, 160), slub=0.1), r.J['LeftLeg'][1] + 0.05, sleeve=0.75, slots=s)
    + [pyjama(r, lambda t: Fb.cotton(t, (205, 198, 180)), waist=-0.02), scarf(r, s, stripes_gamchha, 'gamchha', 0.2), moustache(r, s)],
    skin='deep', shoe_tint=(90, 60, 40))
add('male', 'party-worker', 'RUP worker, white kurta-pyjama and party stole', 'party',
    lambda r, s: kurta(r, lambda t: Fb.cotton(t, (238, 236, 228), slub=0.04), r.J['LeftLeg'][1] - 0.02, sleeve=1.85, slots=s)
    + [pyjama(r, lambda t: Fb.cotton(t, (240, 238, 232)), waist=-0.02), scarf(r, s, party_stole, 'stole', 0.12), moustache(r, s)],
    skin='wheat', shoe_tint=(70, 45, 30))
add('male', 'sena', 'DRS man, saffron scarf, headband and tilak', 'sena',
    lambda r, s: [tee(r, (40, 40, 44), None, hem=-0.08, sleeve=0.5, off=0.016), jeans(r, lambda t: Fb.denim(t, (40, 46, 60), fade=0.15), waist=-0.05),
                  scarf(r, s, lambda t: Fb.cotton(t, (238, 110, 20)), 'stole', 0.09), headgear(r, s, 'band', lambda t: Fb.cotton(t, (238, 110, 20))), tilak(r, s)],
    skin='dusky', shoe_tint=(50, 50, 50))
add('male', 'constable', 'Delhi Police constable, khaki', 'constable',
    lambda r, s: [shirt(r, uniform_khaki, hem=-0.14, sleeve=0.55, off=0.016, paunch=0.02,
                        pockets=[(0.095, r.J['Spine2'][1] - 0.01, 0.11, 0.13, (130, 105, 65)), (-0.095, r.J['Spine2'][1] - 0.01, 0.11, 0.13, (130, 105, 65))]),
                  jeans(r, uniform_khaki, waist=0.06, off=0.015, flare=0.008, paunch=0.02),
                  dict(mesh=belt(r, r.J['Hips'][1] + 0.045, s.take(), pad=0.045, h=0.05), paint=solid((25, 22, 20))),
                  headgear(r, s, 'peaked', cap_paint), moustache(r, s)],
    skin='wheat', shoe_tint=(28, 26, 24))
add('male', 'raf', 'RAF jawan, blue camouflage and helmet', 'raf',
    lambda r, s: [shirt(r, Fb.camo, hem=-0.14, sleeve=1.9, off=0.018, placket=False,
                        pockets=[(0.095, r.J['Spine2'][1] - 0.01, 0.12, 0.13, (30, 42, 82)), (-0.095, r.J['Spine2'][1] - 0.01, 0.12, 0.13, (30, 42, 82))]),
                  jeans(r, Fb.camo, waist=0.06, off=0.016, flare=0.01),
                  dict(mesh=belt(r, r.J['Hips'][1] + 0.045, s.take(), pad=0.045, h=0.05), paint=solid((20, 20, 22))),
                  dict(mesh=boots(r, None), paint=solid((22, 22, 24), Fb.twill)),
                  headgear(r, s, 'helmet', lambda t: Fb.twill(t, (28, 44, 92)))],
    skin='dusky', shoe_tint=(24, 24, 26))

# ---------------------------------------------------------------- female skeleton
add('female', 'student-tee-f', 'Gen Z student, oversized tee and jeans', 'civilian',
    lambda r, s: [tee(r, (238, 236, 230), 'print-1.png', sleeve=0.7, off=0.024), jeans(r, lambda t: Fb.denim(t, (70, 92, 130)), waist=-0.06, off=0.012, flare=0.01)],
    skin='wheat', shoe_tint=(240, 240, 240))
add('female', 'student-kurti', 'Student, kurti over jeans with a dupatta', 'civilian',
    lambda r, s: kurta(r, lambda t: Fb.block_print(t, (232, 190, 60), (180, 60, 40)), r.J['LeftLeg'][1] + 0.12, sleeve=1.35, off=0.014, slots=s)
    + [jeans(r, waist=-0.02, off=0.009), scarf(r, s, dupatta_fn((200, 60, 90), (240, 200, 90)), 'stole', 0.18)], skin='fair', shoe_tint=(180, 120, 90))
add('female', 'aunty', 'Aunty, salwar kameez and dupatta', 'civilian',
    lambda r, s: kurta(r, lambda t: Fb.block_print(t, (120, 30, 45), (220, 170, 70), pitch=0.04), r.J['LeftLeg'][1] - 0.05, sleeve=1.4, off=0.018, paunch=0.04, slots=s)
    + [pyjama(r, lambda t: Fb.cotton(t, (120, 30, 45)), waist=-0.02), scarf(r, s, dupatta_fn((230, 150, 60), (120, 30, 45)), 'dupatta', 0.19)],
    skin='wheat', shoe_tint=(60, 40, 30))
add('female', 'student-shirt-f', 'Gen Z student, oversized check shirt', 'civilian',
    lambda r, s: [shirt(r, lambda t: Fb.checks(t, (40, 90, 80), (20, 40, 38), (160, 60, 50), pitch=0.03), hem=-0.13, sleeve=1.2, off=0.024),
                  jeans(r, lambda t: Fb.denim(t, (36, 40, 52), fade=0.1), waist=-0.07, off=0.013, flare=0.012)], skin='dusky', shoe_tint=(240, 240, 240))
