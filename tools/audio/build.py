#!/usr/bin/env python3
"""Build dist/assets/audio from tools/audio/{sources,clips}.json.

  python3 tools/audio/build.py [--cache DIR] [--only id,id] [--fetch-only]

Fetches each source into the cache (skips ones already there), cuts it, normalises loudness,
encodes MP3 and writes dist/assets/audio/manifest.json and CREDITS.txt with an ffmpeg analysis
of every output file (duration, integrated loudness, true peak, silence, spectral centroid).
Nothing here listens: the analysis is the only check, and the manifest says so.
"""
import json, os, re, subprocess, sys, tempfile, shutil, hashlib, statistics

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(ROOT, 'dist', 'assets', 'audio')
SOURCES = json.load(open(os.path.join(HERE, 'sources.json')))
CLIPS = json.load(open(os.path.join(HERE, 'clips.json')))

TARGET = {'music': -16.0, 'bed': -20.0, 'sfx': -20.0}
FOLDER = {'music': 'music', 'bed': 'amb', 'sfx': 'sfx'}
# MP3 for Safari/iOS decodeAudioData; VBR quality per kind (lower = better).
ENC = {'music': ['-ac', '2', '-ar', '44100', '-c:a', 'libmp3lame', '-q:a', '6'],
       'bed2': ['-ac', '2', '-ar', '44100', '-c:a', 'libmp3lame', '-q:a', '7'],
       'bed1': ['-ac', '1', '-ar', '44100', '-c:a', 'libmp3lame', '-q:a', '6'],
       'sfx': ['-ac', '1', '-ar', '44100', '-c:a', 'libmp3lame', '-q:a', '5']}
FADE = 0.05          # 50 ms fades (music, beds; sfx fade-out)
SFX_FADE_IN = 0.003  # one-shots keep their attack: 3 ms in, 50 ms out


def run(args, **kw):
    return subprocess.run(args, capture_output=True, text=True, **kw)


def arg(name, default=None):
    if name in sys.argv:
        i = sys.argv.index(name)
        return sys.argv[i + 1]
    return default


CACHE = arg('--cache', os.path.join(HERE, '.cache'))
ONLY = set(arg('--only', '').split(',')) - {''}


def fetch(key):
    os.makedirs(CACHE, exist_ok=True)
    dst = os.path.join(CACHE, key)
    if os.path.exists(dst) and os.path.getsize(dst) > 0:
        return dst
    url = SOURCES[key]['url']
    if url.startswith('repo:'):
        _, rev, path = url.split(':', 2)
        data = subprocess.run(['git', '-C', ROOT, 'show', f'{rev}:{path}'], capture_output=True, check=True).stdout
        open(dst, 'wb').write(data)
    else:
        r = run(['curl', '-sSL', '-m', '300', '--retry', '2', '-o', dst, '-w', '%{http_code}', url])
        if r.stdout != '200':
            if os.path.exists(dst):
                os.remove(dst)
            raise SystemExit(f'fetch failed {key}: {r.stdout} {r.stderr}')
    return dst


def ebur(path):
    """Integrated loudness, true peak, max momentary loudness."""
    # pad very short clips with silence so the 400 ms momentary window has something to measure
    r = run(['ffmpeg', '-hide_banner', '-nostats', '-loglevel', 'verbose', '-i', path, '-af', 'apad=whole_dur=0.6,ebur128=peak=true:framelog=verbose', '-f', 'null', '-'])
    err = r.stderr
    tail = err[err.rfind('Summary:'):]
    I = re.search(r'I:\s+(-?[\d.]+|-inf) LUFS', tail)
    P = re.search(r'Peak:\s+(-?[\d.]+|-inf) dBFS', tail)
    ms = [float(m) for m in re.findall(r'M:\s*(-?[\d.]+)\s+S:', err)] or [-99.0]
    num = lambda m: float(m.group(1)) if m and m.group(1) != '-inf' else -99.0
    return num(I), num(P), (max(ms) if ms else -99.0)


def analyse(path, ch):
    r = run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration,bit_rate', '-of', 'json', path])
    fm = json.loads(r.stdout)['format']
    I, TP, Mmax = ebur(path)
    s = run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', 'silencedetect=noise=-50dB:d=0.3', '-f', 'null', '-']).stderr
    sil = sum(float(x) for x in re.findall(r'silence_duration: ([\d.]+)', s))
    sp = run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', 'aformat=channel_layouts=mono,aspectralstats=measure=centroid+rolloff+flatness,ametadata=print:file=-', '-f', 'null', '-']).stdout
    cen = [float(x) for x in re.findall(r'centroid=([\d.]+)', sp)]
    rol = [float(x) for x in re.findall(r'rolloff=([\d.]+)', sp)]
    fl = [float(x) for x in re.findall(r'flatness=([\d.]+)', sp)]
    med = lambda v: round(statistics.median(v)) if v else None
    return {
        'durationSeconds': round(float(fm['duration']), 3),
        'kbps': round(int(fm.get('bit_rate', 0)) / 1000),
        'integratedLufs': round(I, 1), 'maxMomentaryLufs': round(Mmax, 1), 'truePeakDbfs': round(TP, 1),
        'silenceSeconds': round(sil, 2),
        'spectralCentroidHz': med(cen), 'spectralRolloffHz': med(rol),
        'spectralFlatness': round(statistics.median(fl), 3) if fl else None,
    }


def build(kind, c):
    out_rel = f"{FOLDER[kind]}/{c['id']}.mp3"
    out = os.path.join(OUT, out_rel)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    ch = 2 if kind == 'music' else c.get('ch', 1)
    tmpd = tempfile.mkdtemp()
    raw, lev = os.path.join(tmpd, 'raw.wav'), os.path.join(tmpd, 'lev.wav')
    parts = c.get('mix') or [{'src': c['src'], 'ss': c.get('ss'), 'dur': c.get('dur'), 'gain': 0}]
    cmd = ['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error']
    for p in parts:
        if p.get('ss'):
            cmd += ['-ss', str(p['ss'])]
        if p.get('dur'):
            cmd += ['-t', str(p['dur'])]
        cmd += ['-i', fetch(p['src'])]
    pre = []
    if kind == 'sfx':
        # trim leading/trailing near-silence so one-shots fire on time
        pre += ['silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.01', 'areverse',
                'silenceremove=start_periods=1:start_threshold=-55dB:start_silence=0.05', 'areverse']
    if c.get('af'):
        pre.append(c['af'])
    fmt = f"aformat=sample_rates=44100:channel_layouts={'stereo' if ch == 2 else 'mono'}"
    if len(parts) > 1:
        ins = ''.join(f"[{i}:a]volume={p.get('gain', 0)}dB,{fmt}[a{i}];" for i, p in enumerate(parts))
        graph = ins + ''.join(f'[a{i}]' for i in range(len(parts))) + f"amix=inputs={len(parts)}:duration=longest:normalize=0"
        graph += (',' + ','.join(pre) if pre else '') + f',{fmt}[o]'
        cmd += ['-filter_complex', graph, '-map', '[o]', raw]
    else:
        cmd += ['-af', ','.join(pre + [fmt]), raw]
    r = run(cmd)
    if r.returncode:
        raise SystemExit(f"{c['id']}: {r.stderr}")
    dur = float(json.loads(run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'json', raw]).stdout)['format']['duration'])
    I, TP, Mmax = ebur(raw)
    # integrated loudness for anything long enough to gate; max momentary for short one-shots
    method = 'integrated' if dur >= 3 and I > -60 else 'max-momentary'
    measured = I if method == 'integrated' else Mmax
    if measured < -60:
        raise SystemExit(f"{c['id']}: could not measure loudness ({measured})")
    gain = min(30.0, TARGET[kind] - measured)
    fin = SFX_FADE_IN if kind == 'sfx' else FADE
    chain = [f'volume={gain:.2f}dB', 'alimiter=limit=0.89:level=false:attack=2:release=60',
             f'afade=t=in:d={fin}', f'afade=t=out:st={max(0, dur - FADE):.3f}:d={FADE}']
    r = run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-i', raw, '-af', ','.join(chain), lev])
    if r.returncode:
        raise SystemExit(f"{c['id']}: {r.stderr}")
    enc = ENC['music'] if kind == 'music' else ENC['sfx'] if kind == 'sfx' else ENC[f'bed{ch}']
    r = run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-i', lev, '-map_metadata', '-1', *enc, out])
    if r.returncode:
        raise SystemExit(f"{c['id']}: {r.stderr}")
    shutil.rmtree(tmpd)
    a = analyse(out, ch)
    srcs = [SOURCES[p['src']] for p in parts]
    entry = {
        'id': c['id'], 'kind': kind, 'file': out_rel,
        'loop': kind in ('music', 'bed'),
        'channels': ch,
        'title': ' + '.join(s['title'] for s in srcs),
        'author': ' + '.join(dict.fromkeys(s['author'] for s in srcs)),
        'sourceUrl': ' + '.join(s['page'] for s in srcs),
        'license': ' + '.join(dict.fromkeys(s['license'] for s in srcs)),
        'sources': [{'title': s['title'], 'author': s['author'], 'sourceUrl': s['page'], 'fetchedFrom': s['url'], 'via': s['via'],
                     'license': s['license'], 'licenseUrl': s['licenseUrl']} for s in srcs],
        'cut': {'from': [p.get('ss') or 0 for p in parts], 'seconds': [p.get('dur') for p in parts], 'filters': c.get('af')},
        'loudness': {'target': TARGET[kind], 'method': method, 'measuredBefore': round(measured, 1), 'gainDb': round(gain, 1)},
        'analysis': a,
        'tags': c.get('tags', {}),
        'note': c.get('note', ''),
        'placeholder': bool(c.get('placeholder')),
        'verifiedBy': 'ffmpeg analysis only (not listened to)',
    }
    if c.get('placeholderReason'):
        entry['placeholderReason'] = c['placeholderReason']
    entry['bytes'] = os.path.getsize(out)
    entry['sha256'] = hashlib.sha256(open(out, 'rb').read()).hexdigest()
    return entry


def main():
    if '--fetch-only' in sys.argv:
        for k in SOURCES:
            if not k.startswith('_'):
                fetch(k)
        return
    manifest_path = os.path.join(OUT, 'manifest.json')
    old = {}
    if ONLY and os.path.exists(manifest_path):
        old = {c['id']: c for c in json.load(open(manifest_path))['clips']}
    clips = []
    for kind in ('music', 'bed', 'sfx'):
        for c in CLIPS[kind]:
            if ONLY and c['id'] not in ONLY:
                if c['id'] in old:
                    clips.append(old[c['id']])
                continue
            e = build(kind, c)
            a = e['analysis']
            print(f"{e['id']:22s} {a['durationSeconds']:6.2f}s {e['bytes'] // 1024:5d}KB I={a['integratedLufs']:6.1f} M={a['maxMomentaryLufs']:6.1f} TP={a['truePeakDbfs']:5.1f} sil={a['silenceSeconds']:5.2f} cen={a['spectralCentroidHz']}")
            clips.append(e)
    manifest = {
        'version': 2,
        'builtBy': 'tools/audio/build.py',
        'format': 'MP3 (libmp3lame VBR): decodes with decodeAudioData in every browser including Safari/iOS; Opus would be ~25% smaller but Safari only decodes it from iOS/macOS 17 on.',
        'loudnessTargets': {'music': '-16 LUFS integrated', 'bed': '-20 LUFS integrated', 'sfx': '-20 LUFS (integrated when >= 3 s, else max momentary)'},
        'truePeakCeiling': '-1 dBFS (alimiter)',
        'fades': '50 ms in and out for music and beds; one-shots 3 ms in (to keep the attack), 50 ms out.',
        'listening': 'No clip here has been listened to by a person or agent. Every check is ffmpeg analysis (loudness, true peak, duration, silence, spectral centroid). Listen before shipping.',
        'synth': [
            {'id': 'synth-megaphone-squeal', 'cue': ['sena-bikes', 'arrival-wave', 'barricades-up'], 'placeholder': True, 'note': 'Web Audio feedback squeal + key click for a handheld PA, made at runtime in dist/loop/audio.js. No megaphone recording was reachable.'},
            {'id': 'synth-footsteps-run', 'cue': ['chase-start'], 'placeholder': False, 'note': 'Running footsteps sequenced at runtime from the recorded step-a/b/c samples (random pick, pitch and timing).'},
            {'id': 'synth-bikes-passby', 'cue': ['sena-bikes'], 'placeholder': False, 'note': 'Bike pass-by built at runtime from the recorded amb-bike-idle and bike-rev with a playback-rate (doppler) ramp.'},
        ],
        'clips': clips,
    }
    json.dump(manifest, open(manifest_path, 'w'), indent=1, ensure_ascii=False)
    # Attribution file for everything that needs credit (CC BY), plus courtesy credits for CC0.
    lines = ['Side Quest Republic: audio credits (generated by tools/audio/build.py from manifest.json)', '']
    seen = set()
    for c in clips:
        for src in c['sources']:
            key = (src['title'], src['author'])
            if key in seen:
                continue
            seen.add(key)
            lines.append(f'"{src["title"]}" by {src["author"]}. {src["license"]}. {src["sourceUrl"]}')
    lines += ['', 'Licences: CC BY 4.0 https://creativecommons.org/licenses/by/4.0/ ; CC BY 3.0 https://creativecommons.org/licenses/by/3.0/ ; CC0 1.0 https://creativecommons.org/publicdomain/zero/1.0/',
              'All files were trimmed, faded, loudness-normalised and re-encoded for the game. No endorsement by any author is implied.']
    open(os.path.join(OUT, 'CREDITS.txt'), 'w').write('\n'.join(lines) + '\n')
    total = sum(c['bytes'] for c in clips)
    print(f'{len(clips)} clips, {total / 1048576:.2f} MB')


if __name__ == '__main__':
    main()
