// The words in the game, read straight from the source: every quoted line in the content files, the HUD's
// prompt copy (INTENTS), and simple tests for the voice the vision asks for (Hinglish, no lectures, a joke
// in the UI rather than an instruction).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// Roman-script Hindi that Delhi kids actually type (words that are also English, like to, do, main, are, are left out). A line with two of these (or one in a short line) reads as Hinglish.
const HINDI = new Set(('hai hain ho tha thi the nahi nahin na kya kyun kyon kaise kaisa kab kahan kidhar idhar udhar yahan wahan ' +
  'bhai bhaiya yaar arre arey oye abe accha acha achha haan han ji sir madam didi di beta uncle aunty mummy papa ' +
  'mein mai mera meri mere tera teri tere tu tum tumhara aap aapka aapki apna apni hum humara hamara wo woh ye yeh ' +
  'ka ki ke ko se pe toh bhi aur ya ab abhi phir fir sab kuch kuchh koi kaun bas ekdum bilkul pakka matlab ' +
  'kar karo karna karke kiya kiye karte karta karti raha rahi rahe ho gaya gayi gaye hoga hogi chal chalo chalega jao ja jaa ' +
  'aa aaja aao aaya aayi de dena le lo lena dekh dekho sun suno bol bolo bata batao mat ruk ruko jaldi dhire dheere ' +
  'wala wali wale logo bahut bohot zyada thoda sach jhooth kaam ghar paani chai danda lathi bheed gaadi chabi ' +
  'kal aaj subah shaam raat din samajh soch pata maloom chahiye sakta sakti sakte lagta lagti laga lagi gussa darr dar').split(' '));
const LECTURE = /\b(verify kar|verify karo|pooch lena|poochh lena|be careful|stay safe|careful rehna|responsib|zimmedar|consent|sabak|lesson|khayal rakhna|apna khayal|safety first|think before|galat baat hai)\w*/i;
const DEVANAGARI = /[ऀ-ॿ]/;

export const words = (t) => (String(t).toLowerCase().match(/[a-zऀ-ॿ']+/g) || []);
export function isHinglish(t) {
  if (DEVANAGARI.test(t)) return true;
  const w = words(t);
  const hits = w.filter((x) => HINDI.has(x.replace(/'/g, ''))).length;
  return hits >= 2 || (w.length <= 5 && hits >= 1);
}
export const isLecture = (t) => LECTURE.test(t);
// A prompt that just tells you what to press: plain English, starting with a verb or a "someone is ..." report.
const INSTRUCTION = /^(talk|ask|tell|give|hand|take|pick|lift|pocket|put|get|go|film|answer|walk|choose|try|sit|run|stand|point|lose|blend|help|follow|something|nikhil is|that guy|your friends)\b/i;
export const isPlainInstruction = (t) => !isHinglish(t) && INSTRUCTION.test(String(t).trim().replace(/^["“]/, ''));

const files = (root, list) => list.flatMap((p) => {
  const full = join(root, p);
  return statSync(full).isDirectory() ? readdirSync(full).filter((f) => f.endsWith('.js')).map((f) => join(full, f)) : [full];
});

/** Every quoted string of three words or more in the given files (ids, paths and code are skipped). */
export function corpus(root, list) {
  const out = [];
  for (const f of files(root, list)) {
    const src = readFileSync(f, 'utf8');
    for (const m of src.matchAll(/'((?:[^'\\\n]|\\.){8,400})'|"((?:[^"\\\n]|\\.){8,400})"|`((?:[^`\\]|\\.){8,400})`/g)) {
      const t = (m[1] ?? m[2] ?? m[3]).replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\$\{[^}]*\}/g, 'X');
      if (words(t).length < 3) continue;
      if (/^[\w./:-]+$/.test(t) || /^[\s,;:)]/.test(t) || /:\s*(true|false|null|-?\d)/.test(t) || /=>|function |\bconst |\breturn |;\s*$|^\s*[.#]?[\w-]+\s*\{/.test(t)) continue;
      out.push({ file: relative(root, f), text: t });
    }
  }
  return out;
}

/** The HUD's prompt copy: the action labels on the nearby card. */
export async function promptCopy(root) {
  const { INTENTS } = await import(join(root, 'dist/loop/content.js'));
  return Object.entries(INTENTS).filter(([k]) => !k.startsWith('film-')).map(([key, text]) => ({ key, text }));
}

export function voiceReport(lines, prompts) {
  const spoken = lines.filter((l) => !/^(Ask|Tell|Give|Take|Pick|Lift|Pocket|Put|Talk|Film|Walk|Choose)\b/.test(l.text));
  const lectures = spoken.filter((l) => isLecture(l.text));
  const hing = spoken.filter((l) => isHinglish(l.text));
  const plain = prompts.filter((p) => isPlainInstruction(p.text));
  return {
    lines: spoken.length,
    lectures: lectures.length, lectureExamples: lectures.slice(0, 8).map((l) => `${l.text} (${l.file})`),
    hinglish: spoken.length ? hing.length / spoken.length : 0,
    englishExamples: spoken.filter((l) => !isHinglish(l.text)).slice(0, 6).map((l) => l.text),
    prompts: prompts.length, plainPrompts: plain.length,
    uiVoice: prompts.length ? 1 - plain.length / prompts.length : 0,
    plainExamples: plain.slice(0, 8).map((p) => p.text),
  };
}
