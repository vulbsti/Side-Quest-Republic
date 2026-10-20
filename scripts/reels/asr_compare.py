# Compare ASR models on Demucs vocal stems. Runs on uxserver (RTX 2070, 8 GB).
# usage: python asr_compare.py media/<code>/vocals16k.wav out.json [models...]
import json, sys, time
import numpy as np, soundfile as sf, torch

wav, out = sys.argv[1], sys.argv[2]
want = sys.argv[3:] or ["large-v3", "large-v3-en", "trelis-hinglish", "hindi-large-v2", "shunya-hinglish"]
audio, sr = sf.read(wav, dtype="float32")
assert sr == 16000
CH = 28 * sr
chunks = [(i / sr, audio[i:i + CH]) for i in range(0, len(audio), CH)]
PROMPT = "Jantar Mantar, Delhi Police, detain, bus, chabi, sir, bhai, protest, lathi, water cannon"
res = {"file": wav, "duration": len(audio) / sr, "models": {}}


def hf_chunks(repo, prompt_fn=None, lang="hi"):
    from transformers import WhisperForConditionalGeneration, WhisperProcessor
    proc = WhisperProcessor.from_pretrained(repo)
    model = WhisperForConditionalGeneration.from_pretrained(repo, torch_dtype=torch.float16).to("cuda").eval()
    segs = []
    for t0, x in chunks:
        if np.abs(x).max() < 1e-3:
            continue
        feats = proc(x, sampling_rate=sr, return_tensors="pt").input_features.to("cuda", torch.float16)
        # Start tokens passed explicitly: older fine-tunes ship generation configs that reject language=.
        kw = dict(max_new_tokens=220, num_beams=5, no_repeat_ngram_size=5,
                  decoder_input_ids=torch.tensor([(prompt_fn or plain_prompt)(proc)]).to("cuda"))
        with torch.no_grad():
            ids = model.generate(feats, **kw)
        segs.append({"start": round(t0, 2), "end": round(t0 + len(x) / sr, 2),
                     "text": proc.batch_decode(ids, skip_special_tokens=True)[0].strip()})
    del model
    torch.cuda.empty_cache()
    return segs


def plain_prompt(proc):
    tid = proc.tokenizer.convert_tokens_to_ids
    return [tid("<|startoftranscript|>"), tid("<|hi|>"), tid("<|transcribe|>"), tid("<|notimestamps|>")]


def trelis_prompt(proc):
    tid = proc.tokenizer.convert_tokens_to_ids
    mc = proc.tokenizer("<|mixedcode|>", add_special_tokens=False).input_ids
    return [tid("<|startoftranscript|>"), tid("<|hi|>"), *mc, tid("<|transcribe|>"), tid("<|notimestamps|>")]


def faster(lang):
    from faster_whisper import WhisperModel
    m = WhisperModel("Systran/faster-whisper-large-v3", device="cuda", compute_type="float16")
    segs, _ = m.transcribe(audio, language=lang, beam_size=5, vad_filter=True,
                           vad_parameters={"min_silence_duration_ms": 300},
                           condition_on_previous_text=False, initial_prompt=PROMPT)
    r = [{"start": round(s.start, 2), "end": round(s.end, 2), "text": s.text.strip(),
          "avg_logprob": round(s.avg_logprob, 3), "no_speech_prob": round(s.no_speech_prob, 3)} for s in segs]
    del m
    torch.cuda.empty_cache()
    return r


RUN = {
    "large-v3": lambda: faster("hi"),
    "large-v3-en": lambda: faster("en"),
    "trelis-hinglish": lambda: hf_chunks("Trelis/whisper-hinglish-preview", trelis_prompt),
    "hindi-large-v2": lambda: hf_chunks("vasista22/whisper-hindi-large-v2"),
    "shunya-hinglish": lambda: hf_chunks("shunyalabs/zero-stt-hinglish"),
}
for name in want:
    t = time.time()
    try:
        segs = RUN[name]()
        res["models"][name] = {"seconds": round(time.time() - t, 1), "segments": segs}
    except Exception as e:  # keep going so one broken model doesn't sink the comparison
        res["models"][name] = {"error": repr(e)[:400]}
    print(name, res["models"][name].get("seconds", "ERR"), flush=True)
    json.dump(res, open(out, "w"), ensure_ascii=False, indent=1)
