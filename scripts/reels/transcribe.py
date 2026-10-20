# Production transcription on uxserver. Chosen after scripts/reels/asr_compare.py:
#   primary  = Trelis/whisper-hinglish-preview (large-v3 Hinglish fine-tune, <|mixedcode|> mode)
#   second   = shunyalabs/zero-stt-hinglish (Whisper-medium Hinglish fine-tune), for disagreement flags
# No n-gram block on the primary: protest speech repeats itself ("peeche se mat maarna" x4) and the
# block made Trelis respell genuine repeats. Shunya loops without it, so it keeps the block.
# Utterances come from Silero VAD on the Demucs vocal stem, so every line has start/end for clip cutting.
# usage: python transcribe.py media/<code>/vocals16k.wav media/<code>/asr.json
import difflib, json, re, sys
import numpy as np, soundfile as sf, torch
from faster_whisper.vad import VadOptions, get_speech_timestamps
from transformers import WhisperForConditionalGeneration, WhisperProcessor

SR = 16000
MODELS = {"primary": "Trelis/whisper-hinglish-preview", "second": "shunyalabs/zero-stt-hinglish"}


def utterances(audio):
    ts = get_speech_timestamps(audio, VadOptions(min_silence_duration_ms=400, speech_pad_ms=150, threshold=0.4))
    out = []
    for t in ts:  # merge gaps < 0.35 s up to 10 s: short enough to cut as voice barks, long enough for a line
        if out and t["start"] - out[-1][1] < 0.35 * SR and t["end"] - out[-1][0] < 10 * SR:
            out[-1][1] = t["end"]
        else:
            out.append([t["start"], t["end"]])
    # split anything still longer than 28 s
    res = []
    for s, e in out:
        while e - s > 28 * SR:
            res.append((s, s + 28 * SR)); s += 28 * SR
        if e - s > 0.6 * SR:
            res.append((s, e))
    return res


def prompt(proc, mixed):
    tid = proc.tokenizer.convert_tokens_to_ids
    mc = proc.tokenizer("<|mixedcode|>", add_special_tokens=False).input_ids if mixed else []
    return [tid("<|startoftranscript|>"), tid("<|hi|>"), *mc, tid("<|transcribe|>"), tid("<|notimestamps|>")]


def run(repo, clips, mixed, no_repeat=0, beams=5):
    proc = WhisperProcessor.from_pretrained(repo)
    model = WhisperForConditionalGeneration.from_pretrained(repo, torch_dtype=torch.float16).to("cuda").eval()
    p = torch.tensor([prompt(proc, mixed)]).to("cuda")
    texts, lps = [], []
    for x in clips:
        feats = proc(x, sampling_rate=SR, return_tensors="pt").input_features.to("cuda", torch.float16)
        # Token budget scales with clip length: Devanagari costs ~3 tokens/word, so ~30 tokens/s covers fast
        # speech while still stopping loops like "haan haan haan..." on short blips. 440 = 448 minus prompt.
        budget = min(440, int(20 + 30 * len(x) / SR))
        with torch.no_grad():
            g = model.generate(feats, decoder_input_ids=p, max_new_tokens=budget, num_beams=beams,
                               no_repeat_ngram_size=no_repeat, return_dict_in_generate=True, output_scores=True)
        texts.append(proc.batch_decode(g.sequences, skip_special_tokens=True)[0].strip())
        # Beam score = length-normalised log-prob of the chosen hypothesis (confidence proxy).
        ss = getattr(g, "sequences_scores", None)  # absent for greedy decoding
        lps.append(round(float(ss[0]), 3) if ss is not None else None)
    del model
    torch.cuda.empty_cache()
    return texts, lps


def norm(t):
    try:
        from indic_transliteration import sanscript
        t = sanscript.transliterate(t, sanscript.DEVANAGARI, sanscript.ITRANS)
    except ImportError:
        pass
    return re.sub(r"[^a-z ]", "", t.lower())


def main(wav, out):
    audio, sr = sf.read(wav, dtype="float32")
    assert sr == SR, sr
    spans = utterances(audio)
    clips = [audio[s:e] for s, e in spans]
    p_txt, p_lp = run(MODELS["primary"], clips, mixed=True) if clips else ([], [])
    s_txt, _ = run(MODELS["second"], clips, mixed=False, no_repeat=5, beams=1) if clips else ([], [])
    segs = []
    for (s, e), a, lp, b in zip(spans, p_txt, p_lp, s_txt):
        agree = difflib.SequenceMatcher(None, norm(a), norm(b)).ratio()
        # Triage flag only: Shunya spells English words in Devanagari, so agreement understates real matches.
        status = "low" if lp < -0.9 else ("agree" if agree >= 0.45 else "disagree")
        segs.append({"start": round(s / SR, 2), "end": round(e / SR, 2), "text": a, "alt": b,
                     "avg_logprob": lp, "agreement": round(agree, 2), "status": status, "human_checked": False})
    json.dump({"wav": wav, "duration": round(len(audio) / SR, 2), "models": MODELS,
               "method": "Demucs htdemucs_ft vocals -> Silero VAD utterances -> Trelis mixedcode (primary) + Shunya (second)",
               "segments": segs}, open(out, "w"), ensure_ascii=False, indent=1)
    print(out, len(segs), "segments")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
