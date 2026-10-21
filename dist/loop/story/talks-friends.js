// talks-friends: what Kabir, Nikhil, Meera, Zoya, Mira and Dev say when you talk to them.
// Format: plans/story-rebuild.md, "Conversations". Engine: story.js talk() (situation you're cast in →
// highest-priority unplayed conversation for this phase whose requires hold → REACTS → BRUSHOFF).
// The three friends go spectator → participant → someone who has to live with it:
//   Kabir wants material for his set and not to get caught by mummy.
//   Nikhil wants his phone charged and to belong.
//   Meera wants the clip that goes viral.
// Priorities: 10 a callback to something you just did, 5–9 something you are holding or a choice you made,
// 0 the day's ordinary conversations (played in the order written).

// A conversation: opening beats and options in node `a`, plus any further nodes.
const T = (id, phase, beats, options, o = {}) => ({
  id, phase: [].concat(phase), priority: o.priority || 0,
  ...(o.requires ? { requires: o.requires } : {}),
  start: 'a', nodes: { a: { beats, options }, ...(o.nodes || {}) },
});
const O = (intent, beats, o = {}) => ({ intent, beats, ...o });
const lol = (who, line) => ({ who, line, react: 'laugh' });
const hush = (who, line) => ({ who, line, react: 'silence' });

// --- Kabir: would-be comic, told mummy he's at Verma sir's tuition -----------------------------------

const kabir = [
  // morning (he arrives at 11:00)
  T('kabir-m-arrive', 'morning', [
    ['kabir', 'Pahuncha! Mummy ko bola Verma sir ki extra class hai. Location bhi bheji. Verma sir ke ghar ki.'],
    ['kabir', 'Woh yahin paas hai. Kaafi paas. Rajiv Chowk paas. Matlab... Delhi mein sab paas hai.'],
  ], [
    O('Ask him to test his opening line on you', [
      ['kabir', 'Okay. Opening: "Main protest mein isliye aaya kyunki ghar pe WiFi nahi chal raha tha."'],
      hush('player', '...'),
      ['kabir', 'Draft hai! Draft mein sab kharab hota hai. Shakespeare ka bhi draft kharab tha. Shayad.'],
    ], { effects: { flags: ['kabir-opener'] } }),
    O('Offer to be Verma sir if mummy calls', [
      ['player', 'Mummy ka call aaye toh mujhe de dena. Main Verma sir.'],
      ['kabir', 'Tu? Teri awaaz Verma sir jaisi nahi hai. Thodi bhaari kar. Haan. Nahi, itni nahi. Ab tu bhains lag raha hai.'],
      lol('kabir', 'Theek hai, chalega. Verma sir ki bhi bhains jaisi hai.'),
    ], { effects: { mood: { kabir: 'grateful' }, flags: ['cover-for-kabir'] } }),
    O('Tell him a selfie at the barricade would be great proof', [
      ['kabir', 'Proof kis cheez ka? Ki main yahan hoon? Bhai mujhe proof nahi chahiye, mujhe alibi chahiye. Ulta.'],
      ['kabir', 'Tu mera lawyer kabhi mat banna.'],
    ], { effects: { nuisance: 2 } }),
  ]),
  T('kabir-m-nikhil', 'morning', [
    ['kabir', 'Nikhil kahan hai? Usne bheja "pillar ke paas hoon". Rajiv Chowk mein chaar sau pillar hain.'],
    ['kabir', 'Phir bheja "ek uncle samosa kha rahe hain". Ab main samosa uncles dhoondhun?'],
  ], [
    O('Turn Nikhil’s updates into a bit for his set', [
      ['player', 'Bhai ye toh tera set hai. "Mera dost Google Maps nahi, Google Vibes use karta hai."'],
      lol('kabir', 'Google Vibes! Ruk, likh raha hoon. Notes app. "Google... Vibes." Done.'),
    ], { effects: { aura: 3, flags: ['kabir-material'] } }),
    O('Tell Kabir to go find him himself', [
      ['kabir', 'Main? Main jaata toh hum dono kho jaate. Phir tum log do pillars dhoondhte.'],
      ['kabir', 'Theek hai. Mat jao. Main yahin khada hoon. Akela. Dukhi.'],
    ], { effects: { mood: { kabir: 'sulking' } } }),
    O('Promise to bring Nikhil back', [
      ['kabir', 'Promise? Pakka? Agar woh do baje tak nahi mila toh mujhe ghar jaana padega, aur phir mummy...'],
      ['kabir', 'Nahi. Mummy ka naam nahi lete. Bura hota hai.'],
    ], { effects: { help: 2, flags: ['promised-nikhil'] } }),
  ]),
  T('kabir-m-with-nikhil', ['morning', 'midday'], [
    ['kabir', 'NIKHIL! Tu mil gaya! Tu kahan tha?'],
    ['nikhil', 'Pillar ke paas.'],
    ['kabir', 'Haan bhai. Pillar ke paas. Bilkul. Galti meri thi.'],
  ], [
    O('Keep Nikhil with you a bit longer', [
      ['kabir', 'Theek hai, tu rakh. Par do baje se pehle wapas. Mujhe uske saath ghar jaana hai, warna mummy...'],
      ['nikhil', 'Main kisi ke bhi peeche chal sakta hoon. Flexible hoon.'],
    ]),
    O('Hand Nikhil over to Kabir', [
      ['kabir', 'Ab yeh meri zimmedari. Nikhil, mere peeche. Haath pakad. Nahi, haath mat pakad, log dekh rahe hain.'],
      ['nikhil', 'Update: main Kabir ke peeche hoon.'],
    ], { do: ['nikhil:found'], effects: { mood: { kabir: 'grateful' } } }),
  ], { priority: 6, requires: { with: ['nikhil'] } }),

  // midday
  T('kabir-d-speech', 'midday', [
    ['kabir', 'Mira ka speech sun raha tha. "Hum yahan isliye hain kyunki..." Bhai ye mera opening tha.'],
    ['kabir', 'Matlab mera opening WiFi wala tha. Par uske baad wala. Woh deep wala. Jo maine abhi socha.'],
  ], [
    O('Dare him to go on stage right after Mira', [
      ['kabir', 'Abhi? Stage pe? Mere paas material nahi hai. Matlab hai, par woh "kal" wala material hai.'],
      ['kabir', 'Haath dekh. Kaanp raha hai. Ye comedy nahi hai, ye board exam ka flashback hai.'],
    ], { effects: { mood: { kabir: 'shook' }, flags: ['kabir-dared'] } }),
    O('Ask whether mummy has called yet', [
      ['kabir', 'Teen missed call. Teeno "Verma Sir" ke naam se. Kyunki maine mummy ko Verma Sir naam se save kiya hai.'],
      ['kabir', 'Taaki koi dekhe toh lage padhai ki tension hai. Matlab ulta. Matlab... chhod. Smart tha jab socha tha.'],
    ], { effects: { flags: ['kabir-material'] } }),
    O('Pitch him a joke about the barricade', [
      ['player', 'Barricade pe likha hai "Do Not Cross". Delhi mein ye invitation hota hai.'],
      lol('kabir', 'Haan! Haan! Aur Sharma uncle uske saamne aise khade hain jaise unka ghar ka gate hai.'),
    ], { effects: { aura: 3, flags: ['kabir-material'] } }),
  ]),
  T('kabir-d-megaphone', 'midday', [
    ['kabir', 'Mic nahi milega. Mic Mira ka hai. Par Dev ke paas megaphone hai.'],
    ['kabir', 'Megaphone pe set. Comedy ka sabse purana format. Chillana.'],
  ], [
    O('Tell him Dev will never hand it over', [
      ['kabir', 'Dev usse aise pakadta hai jaise woh uska passport hai. Haan. Sahi bola.'],
      ['kabir', 'Theek hai. Main apni awaaz pe karunga. Meri awaaz bhi megaphone hai. Mummy kehti hai.'],
    ], { effects: { mood: { kabir: 'sulking' } } }),
    O('Promise to get him the megaphone', [
      ['kabir', 'Sach mein? Saade teen baje. Stage ke paas. Tu megaphone la, main material laata hoon.'],
      ['kabir', 'Material abhi nahi hai. Par tab tak aa jaayega. Comedy aisi hi hoti hai. Deadline se.'],
    ], { effects: { flags: ['promised-megaphone'] } }),
    O('Tell him real comics don’t need a mic', [
      ['kabir', 'Real comics ke paas mic hota hai, bhai. Isliye woh real hain. Main abhi... prototype hoon.'],
    ], { effects: { aura: 1 } }),
  ]),
  T('kabir-d-holding-meg', ['midday', 'tense'], [
    ['kabir', 'Bhai. Tere haath mein. Woh. Megaphone hai?'],
    ['kabir', 'Main kuch nahi bol raha. Bas... dekh raha hoon. Pyaar se.'],
  ], [
    O('Make him earn it with one good joke first', [
      ['kabir', 'Ek joke? Pressure mein? Okay. "Dilli Police ka slogan: Shanti, Seva, Nyay. Aaj teeno chhutti pe hain."'],
      hush('kabir', '...Okay woh mera nahi tha. Woh forward tha. Rawat uncle ka.'),
    ], { effects: { nuisance: 2 } }),
    O('Give Kabir the megaphone', [
      ['kabir', 'Tu... tu sach mein de raha hai. Okay. Okay. Main ro nahi raha. Aankh mein CP ka dhuan hai.'],
      ['kabir', 'Saade teen baje. Stage. Agar flop hua toh tu bolna ye mera idea tha.'],
    ], { do: ['give:megaphone:kabir'], effects: { help: 3, mood: { kabir: 'grateful' }, flags: ['kabir-has-mic'] } }),
    O('Test it right in his ear', [
      lol('player', '(megaphone pe) KABIR. TUITION KAISI CHAL RAHI HAI.'),
      ['kabir', 'BHAI! Teen log mud gaye! Ek ne phone nikaala! Agar woh mummy ki kitty party wali aunty hai...'],
    ], { effects: { nuisance: 4, mood: { kabir: 'shook' } } }),
  ], { priority: 7, requires: { holding: 'megaphone' } }),
  T('kabir-d-after-call', ['midday', 'tense'], [
    ['kabir', 'Bhai. Woh call. Mummy wala. Mere haath abhi tak kaanp rahe hain.'],
    ['kabir', 'Par sun. Ye material hai. Ye poora ka poora set hai. "Meri mummy ne ek protest ko tuition maan liya."'],
  ], [
    O('Ask for a cut of the set', [
      ['kabir', 'Cut? Bhai abhi tak kisi ne paisa nahi diya. Ek open mic mein mujhe ek samosa mila tha. Aadha de dunga.'],
    ], { effects: { flags: ['kabir-owes-you'] } }),
    O('Tell him mummy probably knows', [
      hush('kabir', '...'),
      ['kabir', 'Nahi. Nahi jaanti. Agar jaanti toh call mein "beta" bolti, "Kabir" nahi. Kabir bola toh... haan, theek hai, jaanti hai.'],
    ], { effects: { mood: { kabir: 'shook' } } }),
    O('Say he owes you one tuition fee', [
      lol('kabir', 'Haan, Verma sir. Kitni fees? Main installment mein dunga. Jaise asli tuition.'),
    ], { effects: { aura: 2, flags: ['kabir-owes-you', 'kabir-material'] } }),
  ], { priority: 10, requires: { did: ['mummy-call'] } }),

  // tense
  T('kabir-t-stayed', 'tense', [
    ['kabir', 'Ruk gaya. Mummy ko bola tuition ke baad "group study". Group study ka matlab tum log.'],
    ['kabir', 'Tum log ka matlab protest. Toh technically... main padh raha hoon. Civics.'],
  ], [
    O('Tell him to be home by four, just in case', [
      ['kabir', 'Chaar baje? Bhai saade teen ka set hai. Aadha ghanta mein main star ban ke ghar pahunch jaunga.'],
      ['kabir', 'Theek hai. Chaar baje. Agar tu itna bol raha hai toh kuch dekha hoga tune. Mat bata kya.'],
    ], { effects: { mood: { kabir: 'sulking' }, flags: ['kabir-curfew-16'] } }),
    O('Ask what the set is about now', [
      ['kabir', 'Abhi tak: WiFi, Google Vibes, aur Sharma uncle ka gate. Teen points. Comedy mein teen ka rule hota hai.'],
      ['kabir', 'Mujhe nahi pata kya rule hai. Par teen hain.'],
    ], { effects: { flags: ['kabir-material'] } }),
    O('Tell him civics was never this loud', [
      lol('kabir', 'Civics mein bhi barricade hota tha. Chapter four. Main so gaya tha.'),
    ], { effects: { aura: 1 } }),
  ], { priority: 5, requires: { flags: ['kabir-stays'] } }),
  T('kabir-t-raf', 'tense', [
    ['kabir', 'RAF aa gayi. Blue wale. Bhai unke helmet pe visor hai. Mera set unko sunai bhi nahi dega.'],
    ['kabir', 'Aur ek ne mujhe aise dekha jaise main ek challan hoon.'],
  ], [
    O('Dare him to do the bit at the RAF line', [
      ['kabir', 'Line pe? Unke saamne? Bhai main comedian banna chahta hoon, shaheed nahi.'],
      ['kabir', 'Theek hai. Ek line. Door se. Bahut door se.'],
    ], { effects: { heat: 4, mood: { kabir: 'shook' } } }),
    O('Write him a bit about the RAF on the spot', [
      ['player', '"Blue ka matlab calm hota hai. Kisi ne inko bataya nahi."'],
      lol('kabir', 'Oof. Ye achha hai. Ye mera hai ab. Copyright Kabir.'),
    ], { effects: { aura: 2, flags: ['kabir-material'] } }),
    O('Tell him to keep his head down', [
      ['kabir', 'Sar neeche. Haan. Main bas ek student hoon jo galti se yahan hai. Galti se teen ghante se.'],
    ], { effects: { heat: -3 } }),
  ]),
  T('kabir-t-shoes', 'tense', [
    ['kabir', 'SUV pe log naye joote baant rahe hain. Bilkul naye. Dabba ke saath.'],
    ['kabir', 'Mera joota dekh. Sole bol raha hai "bhai mujhe jaane do". Main bas... dekhne ja raha hoon.'],
  ], [
    O('Bet him he can’t get a pair without joining', [
      ['kabir', 'Bet? Done. Main jaata hoon, bolta hoon size nau, aur kuch "join" nahi karta. Simple.'],
      ['kabir', '...Woh bolenge teen baje kuch pakadna hai. Main bolunga "haan" aur nahi pakdunga. Ye bhi comedy hai.'],
    ], { effects: { heat: 5, flags: ['kabir-shoes-bet'] } }),
    O('Pull him back by the hoodie', [
      ['kabir', 'Arre hoodie! Ye limited edition hai! Sarojini se! Theek hai, nahi jaata.'],
    ], { effects: { help: 2, mood: { kabir: 'sulking' } } }),
    O('Ask him to stall them while you watch', [
      ['kabir', 'Spy? Main spy? Haan. Haan. Mera code name... Verma sir.'],
      ['kabir', 'Main poochunga "bhaiya ye Bata hai ya Nike?" aur tu dekh kaun paise de raha hai.'],
    ], { do: ['follow:kabir'], effects: { nuisance: 3, flags: ['kabir-spy'] } }),
  ], { requires: { before: '15:30' } }),
  T('kabir-t-set', 'tense', [
    ['kabir', 'Saade teen baje. Megaphone haath mein. Pet mein woh feeling jo board exam se pehle hoti thi.'],
    ['kabir', 'Board mein main pass hua tha. Toh ye bhi... nahi, comparison galat hai, board mein koi heckle nahi karta.'],
  ], [
    O('Tell him to roast the white SUV', [
      ['kabir', 'SUV? Unke paas paise hain, joote hain, aur mujhe dekh rahe hain. Haan, perfect target. Darr lagta hai par.'],
    ], { do: ['intensity:+1'], effects: { heat: 4, flags: ['kabir-roast-suv'] } }),
    O('Feed him an opener about the career counselling', [
      ['player', 'Shuru kar: "Subah ek constable ne mujhe career advice di. SSC. Mere paas ab do problems hain."'],
      lol('kabir', 'HAAN. Ye open hai. Ye open hai! Bhai tu writer room mein aa ja.'),
    ], { requires: { did: ['career-counselling'] }, effects: { aura: 4, flags: ['kabir-material'] } }),
    O('Hype him up like a cricket commentator', [
      lol('player', 'Aur ab crease pe aate hain... KABIR! Tuition se seedha! Mummy ko nahi pata!'),
      ['kabir', 'Mummy ko nahi pata wala part zor se mat bol yaar.'],
    ], { effects: { aura: 2, mood: { kabir: 'proud' } } }),
  ], { priority: 8, requires: { flags: ['kabir-has-mic'] } }),

  // showdown
  T('kabir-s-smoke', 'showdown', [
    ['kabir', 'Aankh jal rahi hai. Bhai ye material nahi hai. Ye bas dard hai.'],
    ['kabir', 'Main joke soch raha hoon aur dimaag bol raha hai "bhaag".'],
  ], [
    O('Tell him to remember this for the set', [
      ['kabir', 'Remember? Main ise bhoolna chahta hoon! ...Par haan, likh leta hoon. Baad mein.'],
    ], { effects: { flags: ['kabir-material'], mood: { kabir: 'shook' } } }),
    O('Grab his hoodie and keep him close', [
      ['kabir', 'Haan. Haan. Pakad ke rakh. Main kuch nahi bolunga. Pehli baar.'],
    ], { do: ['follow:kabir', 'friend:kabir:ok'], effects: { help: 4 } }),
    O('Splash water on his face', [
      ['kabir', 'Aah. Theek hai. Behtar. Ab sirf ek aankh jal rahi hai. Progress.'],
    ], { requires: { holding: 'water' }, effects: { help: 6, mood: { kabir: 'grateful' } } }),
  ]),
  T('kabir-s-mummy', 'showdown', [
    ['kabir', 'Mummy ka call. Abhi. Is waqt. Background mein whistle baj rahi hai.'],
    { who: 'mummy', line: 'Kabir? Ye awaaz kya hai? Tuition mein whistle kyun baj rahi hai?', via: 'phone', sfx: 'phone-ring' },
  ], [
    O('Tell him to say it is a dhol practice next door', [
      ['kabir', 'Mummy, padosi ki shaadi hai. Dhol. Haan, chaar baje. Haan, Tuesday ko. Haan... pyaar ho gaya unko jaldi.'],
      { who: 'mummy', line: 'Tu ghar aa. Abhi.', via: 'phone' },
    ], { effects: { flags: ['mummy-knows-truth'], mood: { kabir: 'shook' } } }),
    O('Let it ring out', [
      hush('kabir', '...'),
      ['kabir', 'Gayi. Ab woh papa ko phone karegi. Papa phone nahi uthaate. Toh ab woh mausi ko karegi. Mausi sab uthaati hai.'],
    ], { effects: { mood: { kabir: 'sulking' } } }),
    O('Take the phone and be Verma sir again', [
      ['player', '(bhaari awaaz) Namaste aunty. Practical chal raha hai. Civics ka. Bahut... practical.'],
      { who: 'mummy', line: 'Verma sir aap khaansi kar rahe ho? Dhyan rakhiye apna.', via: 'phone' },
      lol('kabir', 'Usne tujhe khaansi ki dawai bataayi. Bhai tu officially family hai.'),
    ], { requires: { anyFlags: ['cover-for-kabir', 'sharma-tuition-teacher', 'player-fake-teacher'] }, effects: { aura: 4, mood: { kabir: 'grateful' } } }),
  ]),
  T('kabir-s-stay', 'showdown', [
    ['kabir', 'Tu mere saath hai na? Mat chhodna. Main joke nahi kar raha. Ye wala sach hai.'],
  ], [
    O('Make a joke anyway', [
      ['player', 'Tu sach bol raha hai? Likh le, set ka best part hai.'],
      ['kabir', 'Haha. Haan. Haha. ...Haath mat chhodna.'],
    ], { effects: { mood: { kabir: 'grateful' } } }),
    O('Send him to the Metro on his own', [
      ['kabir', 'Akela? ...Theek hai. Theek hai. Rajiv Chowk. Main pillar ke paas milunga. Nikhil wala pillar.'],
    ], { do: ['unfollow:kabir', 'leave:kabir', 'friend:kabir:ok'], effects: { mood: { kabir: 'sulking' } } }),
    O('Promise and keep walking', [
      ['kabir', 'Okay. Okay. Tu aage, main peeche. Jaise school ki line.'],
    ], { do: ['follow:kabir'], effects: { help: 3 } }),
  ], { priority: 6, requires: { with: ['kabir'] } }),

  // aftermath
  T('kabir-a-title', 'aftermath', [
    ['kabir', 'Set ka title mil gaya. "Tuition." Bas. Ek word.'],
    ['kabir', 'Log sochenge padhai ke baare mein hai. Phir main bolunga lathi. Phir woh nahi hasenge. Phir main bolunga Verma sir.'],
  ], [
    O('Tell him today wasn’t funny', [
      hush('kabir', '...Haan.'),
      ['kabir', 'Isliye hi toh likhna hai. Jo funny tha woh sab ko yaad rahega. Jo nahi tha woh mujhe.'],
    ], { effects: { mood: { kabir: 'sad' } } }),
    O('Ask to be in the set', [
      ['kabir', 'Tu set mein hai. Tu "mera dost jo har jagah tha" hai. Naam nahi lunga. Police sun rahi ho toh.'],
    ], { effects: { aura: 2 } }),
    O('Tell him to call mummy first', [
      ['kabir', 'Haan. Call. Main bolunga tuition lambi chali. Teacher ko bhi dhuan laga. Waise sach hi hai.'],
    ], { do: ['chat:mummy-call'] }),
  ]),
  T('kabir-a-notes', 'aftermath', [
    ['kabir', 'Notes app khola. Chaudah points. Google Vibes. Sharma ka gate. Joote. Dhuan.'],
    ['kabir', 'Aadhe tere wajah se hain. Credit mein "Special thanks: woh banda" likhunga.'],
  ], [
    O('Pick the joke he should cut', [
      ['player', 'Google Vibes hata de.'],
      ['kabir', 'Kabhi nahi. Woh opener hai. Tu jaa. Tu ab writer room se bahar hai.'],
    ]),
    O('Ask for your name in the credits', [
      ['kabir', 'Naam? Bhai tera naam Instagram pe trending hai. Main ek open mic wala hoon. Main tera naam lunga toh mera career bachega.'],
    ], { effects: { aura: 2 } }),
  ], { priority: 6, requires: { flags: ['kabir-material'] } }),
  T('kabir-a-mummy', 'aftermath', [
    ['kabir', 'Mummy ka message: "Ghar aa. Baat karni hai." Full stop ke saath. Mummy kabhi full stop nahi lagaati.'],
  ], [
    O('Tell him to just tell her the truth', [
      ['kabir', 'Truth? Ki main ek protest mein tha, megaphone pe joke kiya, aur dhuen mein bhaga? Woh bolegi "aur tuition?"'],
      lol('kabir', 'Usko tuition ki zyada padi hai. Pakka.'),
    ]),
    O('Offer to come home with him', [
      ['kabir', 'Tu chalega? Mummy tere saamne kuch nahi bolegi. Tere jaane ke baad bolegi. Par tab tak dinner ho jaayega.'],
    ], { do: ['follow:kabir'], effects: { help: 4, mood: { kabir: 'grateful' } } }),
  ], { priority: 8, requires: { anyFlags: ['mummy-knows-truth', 'kabir-curfew-16'] } }),
];

// --- Nikhil: first-timer, phone at 3%, literal updates --------------------------------------------

const nikhil = [
  // morning (lost at the Metro)
  T('nikhil-m-found', 'morning', [
    ['nikhil', 'Update: main yahin hoon. Yahin matlab jahan aap ho. Achha hua aap aa gaye.'],
    ['nikhil', 'Kabir bola tha stage ke paas milega. Stage kahan hai? Main stage ke paas nahi hoon. Ye pillar hai.'],
  ], [
    O('Ask for his exact location, for fun', [
      ['nikhil', 'Exact? Ek pillar. Uske left mein ek uncle. Uncle ke haath mein samosa. Samosa aadha.'],
      lol('nikhil', 'Update: samosa khatam.'),
    ], { effects: { aura: 1 } }),
    O('Tell him to follow you to the stage', [
      ['nikhil', 'Haan. Aap aage, main peeche. Main bahut achha peeche chalta hoon. School mein line monitor tha. Peeche wala.'],
    ], { do: ['follow:nikhil'], effects: { help: 3 } }),
    O('Ask how much battery he has', [
      ['nikhil', 'Teen percent. Abhi do. Nahi, teen. Ye jhooth bolta hai. Kabhi teen pe ek ghanta chalta hai, kabhi teen pe band.'],
      ['nikhil', 'Ye phone mera kam, ek mood zyada hai.'],
    ]),
  ]),
  T('nikhil-m-first', 'morning', [
    ['nikhil', 'Pehla protest hai. Kya karte hain? Naare lagaate hain? Kab? Koi bolta hai "ab"?'],
    ['nikhil', 'Main galat time pe naara laga dun toh?'],
  ], [
    O('Tell him the main thing is the snacks', [
      ['nikhil', 'Snacks? Kahan hain? Kisi ne bola nahi snacks hain. Mere paas sirf Parle-G hai. Do.'],
      ['nikhil', 'Ek aapka.'],
    ], { effects: { help: 1 } }),
    O('Teach him a slogan', [
      ['player', 'Simple. "Hum kya chahte?" Phir sab bolte hain jo chahte hain.'],
      ['nikhil', 'Hum kya chahte! ...Charger!'],
      lol('nikhil', 'Galat tha na? Main phir se karta hoon.'),
    ], { effects: { mood: { nikhil: 'happy' }, flags: ['nikhil-slogan'] } }),
    O('Tell him to just stand behind you', [
      ['nikhil', 'Behind. Haan. Ye main kar sakta hoon. Ye mera skill hai.'],
    ], { do: ['follow:nikhil'] }),
  ]),
  T('nikhil-m-walking', 'morning', [
    ['nikhil', 'Update: hum chal rahe hain.'],
    ['nikhil', 'Update: abhi bhi.'],
  ], [
    O('Ask him to stop giving updates', [
      ['nikhil', 'Sorry. Aadat hai. Mummy har aadhe ghante "update do" bolti hai. Toh main... update deta rehta hoon.'],
      hush('nikhil', '...Update: main chup hoon.'),
    ]),
    O('Ask him for a useful update', [
      ['nikhil', 'Useful? Achha. Barricade ke paas teen police uncle bore ho rahe hain. Bus wale bhaiya ne chabi hook pe taangi hai. Asha aunty sab sun rahi hai.'],
      ['nikhil', 'Ye useful hai? Mujhe laga bas observation hai.'],
    ], { effects: { help: 2 } }),
  ], { priority: 4, requires: { with: ['nikhil'] } }),

  // midday
  T('nikhil-d-charger', 'midday', [
    ['nikhil', 'Kisi ke paas Type-C hai? Do percent hai. Asha aunty ke stall pe socket hai par uspe chai ka heater laga hai.'],
    ['nikhil', 'Maine poocha. Unhone bola "chai zaroori hai ya tera phone?" Main jawab nahi de paaya.'],
  ], [
    O('Tell him to put it on airplane mode', [
      ['nikhil', 'Airplane mode. Done. Ab ye ek bahut mehenga torch hai. Bina torch ke.'],
    ]),
    O('Tell him a dead phone is freedom', [
      ['nikhil', 'Freedom? Agar phone mar gaya toh mummy police bulayegi. Aur police yahin hai. Toh woh jaldi aayegi.'],
      lol('nikhil', 'Matlab efficient hai.'),
    ], { effects: { aura: 1 } }),
    O('Promise to find him a charger', [
      ['nikhil', 'Sach mein? Aap sabse achhe ho. Kabir ne bola "dead phone, free soul". Woh Kabir ka nahi, mera phone hai.'],
    ], { effects: { help: 2, flags: ['promised-charger'] } }),
  ]),
  T('nikhil-d-saathi', 'midday', [
    ['nikhil', 'Mira didi ne mike pe "saathiyon" bola aur meri taraf dekha. Main saathi hoon?'],
    ['nikhil', 'Mujhe kisi ne kabhi saathi nahi bola. Sirf "bhai" aur "abey".'],
  ], [
    O('Tell him she was looking at the samosa uncle', [
      hush('nikhil', '...Haan. Woh bhi saathi hain shayad.'),
    ], { effects: { mood: { nikhil: 'sad' } } }),
    O('Tell him he is officially a saathi now', [
      ['nikhil', 'Officially. Kya certificate milta hai? Nahi? Theek hai. Main screenshot le leta hoon. Phone... mar gaya.'],
    ], { effects: { mood: { nikhil: 'proud' }, flags: ['nikhil-belongs'] } }),
    O('Ask him why he came today', [
      ['nikhil', 'Kabir aa raha tha. Aur... ghar pe sab bolte hain mera koi opinion nahi hai. Toh main dekhne aaya opinion kaisa dikhta hai.'],
      ['nikhil', 'Abhi tak bahut sweaty dikhta hai.'],
    ], { effects: { help: 2 } }),
  ]),
  T('nikhil-d-biryani', 'midday', [
    ['nikhil', 'Ek uncle bol rahe the CP pe free biryani hai. Group mein bhi aaya. Chalein? Main bhooka hoon. Parle-G khatam.'],
  ], [
    O('Run to CP with him', [
      ['nikhil', 'Chalo! Aap aage, main peeche, biryani sabse aage.'],
    ], { do: ['follow:nikhil'], effects: { nuisance: 2 } }),
    O('Tell him it’s a forward', [
      ['nikhil', 'Forward? Par usme teen emoji the. Biryani wale. Teen.'],
      ['nikhil', 'Theek hai. Main bhooka rahunga. Aur samjhdaar.'],
    ], { effects: { help: 2 } }),
    O('Share half your chai money', [
      ['nikhil', 'Das rupaye? Aap... Asha aunty se bun-maska. Aap sach mein saathi ho.'],
    ], { effects: { help: 3, mood: { nikhil: 'grateful' } } }),
  ]),

  // tense
  T('nikhil-t-charger', 'tense', [
    ['nikhil', 'SUV wale bhaiya charger de rahe hain. Free. Fast charger. Bas bola teen baje kuch "pakadna" hai.'],
    ['nikhil', 'Maine poocha kya pakadna hai. Unhone bola "saamaan". Saamaan matlab bag hoga na?'],
  ], [
    O('Let him take the charger and see', [
      ['nikhil', 'Le liya! Chalees percent! Aur unhone haath mein ek... pathar diya. "Teen baje." Ye kya hai? Paperweight?'],
      hush('nikhil', 'Ye pathar hai. Main pathar pakad ke khada hoon.'),
    ], { effects: { heat: 8, flags: ['nikhil-took-charger'] } }),
    O('Ask what they want him to hold', [
      ['nikhil', 'Ruko poochta hoon. ...Unhone bola "teen baje, barricade, pathar, phir bhaago". Phir bola "kisi ko mat batana".'],
      ['nikhil', 'Maine aapko bata diya. Matlab maine galti ki? Ya sahi?'],
    ], { effects: { help: 4, flags: ['heard-teen-baje-pathar'] } }),
    O('Pull him away by the collar', [
      ['nikhil', 'Arre! Mera charger! ...Woh mera charger nahi tha. Theek hai. Theek hai. Main aapke peeche.'],
    ], { do: ['follow:nikhil'], effects: { help: 3, mood: { nikhil: 'sulking' }, flags: ['nikhil-pulled-away'] } }),
  ], { requires: { before: '15:30' } }),
  T('nikhil-t-raf', 'tense', [
    ['nikhil', 'Update: bahut saare blue log aaye. Unke paas dhaal hai. Mere paas ek percent.'],
    ['nikhil', 'Update: ek ne mujhe dekha. Maine smile kiya. Usne nahi kiya.'],
  ], [
    O('Ask him to count how many there are', [
      ['nikhil', 'Ek, do... chaubees. Pachees. Ek gaadi bhi hai. Neeli. Upar paani ki tank jaisi cheez hai.'],
      ['nikhil', 'Woh paani ki tank hai na? Woh... tank hai.'],
    ], { effects: { help: 2 } }),
    O('Tell him to smile again', [
      ['nikhil', '(smile) ...Usne bhi kiya! Thoda sa! Ya muh mein kuch atka tha.'],
    ], { effects: { mood: { nikhil: 'happy' } } }),
    O('Tell him to stick with Kabir', [
      ['nikhil', 'Kabir ke saath. Haan. Kabir bhaagta tez hai, par bolta pehle hai, toh pata chal jaata hai.'],
    ]),
  ]),
  T('nikhil-t-after-joote', 'tense', [
    ['nikhil', 'Woh charger wale bhaiya. Aap na hote toh main pathar pakad leta. Mujhe laga woh "prop" hai. Kisi play ka.'],
    ['nikhil', 'Mere paas ab bhi ek percent hai. Par sahi wala ek percent.'],
  ], [
    O('Tease him about almost joining a gang for a charger', [
      lol('nikhil', 'Fast charger tha! Aap nahi samjhoge. Aapka phone assi pe hai. Aap privileged ho.'),
    ]),
    O('Tell him he did the brave thing by telling', [
      ['nikhil', 'Brave? Main toh bas bol raha tha. Main hamesha bas bolta hoon. Aaj pehli baar kaam aaya.'],
    ], { effects: { mood: { nikhil: 'proud' }, flags: ['nikhil-belongs'] } }),
  ], { priority: 10, requires: { did: ['naye-joote'] } }),

  // showdown
  T('nikhil-s-smoke', 'showdown', [
    ['nikhil', 'Kuch dikh nahi raha. Update: kuch dikh nahi raha.'],
    ['nikhil', 'Aap ho? Aapki awaaz aapki hai? Bolo kuch jo sirf aap bologe.'],
  ], [
    O('Tell him to stay put by the wall', [
      ['nikhil', 'Wall. Haan. Main wall ke paas hoon. Update: wall garam hai.'],
      hush('nikhil', '...Aap aaoge na?'),
    ], { effects: { mood: { nikhil: 'scared' } } }),
    O('Say something only you would say', [
      ['player', 'Pillar ke paas hoon. Ek uncle samosa kha rahe hain.'],
      lol('nikhil', 'Haan! Aap ho! Main aa raha hoon. Aawaz ki taraf.'),
    ], { do: ['follow:nikhil', 'friend:nikhil:ok'], effects: { help: 4 } }),
    O('Grab his hand and run', [
      ['nikhil', 'Haath! Haan! Bhaago! Kidhar? Kidhar bhi!'],
    ], { do: ['follow:nikhil', 'friend:nikhil:ok'], effects: { help: 3, heat: 2 } }),
  ]),
  T('nikhil-s-dead', 'showdown', [
    ['nikhil', 'Phone mar gaya. Zero. Ab main update bhi nahi de sakta.'],
    ['nikhil', 'Ab main bas... yahan hoon. Bina update ke. Ajeeb lag raha hai.'],
  ], [
    O('Text his mummy from your phone', [
      ['player', '(typing) "Aunty Nikhil theek hai. Uska phone mar gaya. Main uska dost."'],
      ['nikhil', 'Unhone kya bola? ..."Kaun dost?" Haan. Woh har dost ko aise hi bolti hain.'],
    ], { effects: { help: 4 } }),
    O('Tell him to give you updates out loud instead', [
      ['nikhil', 'Update: aankh jal rahi hai. Update: aap achhe ho. Update: Kabir ki hoodie wahan hai. Kabir bhi.'],
    ], { effects: { help: 2, mood: { nikhil: 'happy' } } }),
  ]),

  // aftermath
  T('nikhil-a-first', 'aftermath', [
    ['nikhil', 'Pehla protest. Theek tha? Matlab main theek tha?'],
  ], [
    O('Tell him next time he charges his phone', [
      ['nikhil', 'Next time? Matlab next time hai? Matlab aap mujhe phir bulaoge?'],
      ['nikhil', 'Main power bank laaunga. Do. Ek aapka.'],
    ], { effects: { mood: { nikhil: 'happy' } } }),
    O('Tell him he was the best one there', [
      ['nikhil', 'Best? Main sabse zyada khoya tha. ...Par sabse zyada mila bhi. Teen baar. Ye record hai?'],
    ], { effects: { mood: { nikhil: 'proud' }, flags: ['nikhil-belongs'] } }),
    O('Ask him for one last update', [
      hush('nikhil', 'Update: main ghar jaana chahta hoon. Par thoda ruk ke.'),
    ]),
  ]),
  T('nikhil-a-slogan', 'aftermath', [
    ['nikhil', 'Maine slogan practice kiya. Poore din. Suno. "Hum kya chahte?"'],
    ['nikhil', '...Ab yaad aaya. Jo bhi chahte the. Woh. Mujhe bhi chahiye.'],
  ], [
    O('Chant it back with him', [
      lol('player', 'HUM KYA CHAHTE?'),
      ['nikhil', 'CHARGER! ...Nahi. Haan. Dono. Aaj ke liye charger.'],
    ], { effects: { aura: 2 } }),
    O('Tell him that was actually pretty good', [
      ['nikhil', 'Sach mein? Main Kabir ko bataunga. Woh bolega "material hai". Sab uske liye material hai.'],
    ], { effects: { mood: { nikhil: 'proud' } } }),
  ], { priority: 6, requires: { flags: ['nikhil-slogan'] } }),
  T('nikhil-a-dhuan', 'aftermath', [
    ['nikhil', 'Dhuen mein maine aapko aapki chappal se pehchana. Aapki chappal ka strap toota hai. Main subah se dekh raha tha.'],
    ['nikhil', 'Kabhi kabhi detail dekhna kaam aata hai.'],
  ], [
    O('Ask him to stop staring at your feet', [
      lol('nikhil', 'Sorry. Par strap sach mein toota hai. Ghar tak chalegi? Main dekh lunga.'),
    ]),
    O('Tell him that’s a superpower', [
      ['nikhil', 'Superpower. Theek hai. Captain Detail. Nahi. Bura hai. Kabir accha naam dega.'],
    ], { effects: { mood: { nikhil: 'proud' } } }),
  ], { priority: 8, requires: { did: ['dhuan'] } }),
];

// --- Meera: reel creator, needs the clip ---------------------------------------------------------

const meera = [
  // morning
  T('meera-m-content', 'morning', [
    ['meera', 'Bhai content chahiye. Hook in the first one point five seconds. Abhi tak sirf kabootar mile hain.'],
    ['meera', 'Kabootar viral nahi hote. Unless woh police ki topi pe baithe. Main wait kar rahi hoon.'],
  ], [
    O('Tell her the pigeons are the content', [
      ['meera', '"Jantar ke kabootar: the real protesters." Hmm. Hmm! Nahi. Haan? Save karti hoon draft mein.'],
    ], { effects: { flags: ['meera-pigeons'] } }),
    O('Point her at the bored constables', [
      ['meera', 'Teen uncle, ek barricade, zero kaam? Ye toh office sitcom hai. Chal, main angle dhundhti hoon.'],
    ], { do: ['move:meera:barricade'], effects: { flags: ['meera-tip-barricade'] } }),
    O('Offer to be in her reel', [
      ['meera', 'Tu? Okay, ek baar walk kar. Nahi, slow motion mein nahi. Normal. Ye normal hai? Bhai tu robot hai.'],
      lol('meera', 'Perfect. Robot viral hota hai.'),
    ], { effects: { aura: 2, mood: { meera: 'happy' } } }),
  ]),
  T('meera-m-followers', 'morning', [
    ['meera', 'Follower count: 4,812. Paanch hazaar pe kuch nahi milta. Par feel aati hai.'],
    ['meera', 'Mera best reel tha mummy ka "beta khaana kha le" baarah baar, beat pe. Saath hazaar. Mummy ko ab tak nahi pata.'],
  ], [
    O('Ask if mummy has seen the khaana reel', [
      ['meera', 'Mummy ko reels mein sirf recipe dikhti hai. Algorithm ne usko bacha liya. Mujhe bhi.'],
    ]),
    O('Whisper the water-cannon forward for her story', [
      ['meera', 'Water cannon? OMG. Story pe daalti hoon. "Unconfirmed" likh dungi. Chhota. Bahut chhota.'],
    ], { do: ['rumour:cannon:cp'], effects: { nuisance: 8 } }),
    O('Promise to help her cross five thousand', [
      ['meera', 'Promise? Okay. Toh aaj tu kuch aisa karega jo log share karein. Koi pressure nahi. Bas thoda sa poora pressure.'],
    ], { effects: { flags: ['meera-promise'] } }),
  ]),
  T('meera-m-cp', 'morning', [
    ['meera', 'CP stop pe speaker baje toh poora stop dance floor. Bas ek gaana. Ek. Algorithm ko bheed pasand hai.'],
  ], [
    O('Tell her the speaker is meant for Mira’s speech', [
      ['meera', 'Speech barah baje hai. Abhi gyarah. Ek ghanta speaker berozgaar hai. Main usko kaam de rahi hoon.'],
    ], { effects: { help: 1 } }),
    O('Ask what song', [
      ['meera', 'Kuch purana jo naya lage. Ya naya jo purana lage. Basically jo uncles bhi naachein.'],
    ]),
    O('Promise her a dance floor', [
      ['meera', 'Promise kar rahe ho? Main record kar rahi hoon. Ab tu reel pe vaada kar chuka hai.'],
    ], { effects: { flags: ['meera-promise'] } }),
  ], { requires: { after: '11:00' } }),

  // midday
  T('meera-d-viral', ['midday', 'tense'], [
    ['meera', 'BHAI. Tu viral hai. Chalees hazaar views. Comments mein tujhe "barricade ka Shah Rukh" bol rahe hain.'],
    ['meera', 'Ek uncle ne "shame" likha. Ek ne "shame shame" likha. Engagement hai!'],
  ], [
    O('Tell her to take it down', [
      hush('meera', '...Take down? Chalees hazaar? Tu jaanta hai main kitne din se...'),
      ['meera', 'Theek hai. Archive kar rahi hoon. Delete nahi. Archive. Woh alag hai.'],
    ], { effects: { aura: -8, heat: -6, mood: { meera: 'sulking' }, flags: ['meera-archived'] } }),
    O('Ask for credit in the caption', [
      ['meera', 'Credit? Caption mein "ft. my friend" likha hai. Tu my friend hai. Ye credit hai.'],
      lol('meera', 'Achha theek hai, tag karti hoon. Tera handle "sleepy_baingan_04" kyun hai?'),
    ], { effects: { aura: 3 } }),
    O('Plan a sequel', [
      ['meera', 'Part 2! Haan! "Barricade ka Shah Rukh returns." Tu bas wahi kar jo kiya tha, par zyada.'],
    ], { effects: { heat: 3, mood: { meera: 'proud' }, flags: ['meera-sequel'] } }),
  ], { priority: 9, requires: { rep: { aura: 40 } } }),
  T('meera-d-spicy', 'midday', [
    ['meera', 'Story pe kuch chahiye. Kuch spicy. Bheed aa rahi hai, sena wale bikes pe aaye, aur meri story pe kal ka paneer hai.'],
  ], [
    O('Tell her the minister is coming to the barricade at 3:30', [
      ['meera', 'Minister? Barricade pe? Selfie! "Minister ke saath main, protest pe, casual." Post.'],
    ], { do: ['rumour:minister:stage'], effects: { nuisance: 8 } }),
    O('Tell her nothing is happening yet', [
      ['meera', 'Nothing is happening is not content. Tu boring hai. Main Zoya se poochti hoon. Woh bhi boring hai par source hai.'],
    ], { effects: { mood: { meera: 'sulking' } } }),
    O('Tell her there’s free biryani at CP', [
      ['meera', 'Biryani run! Reel ka title mil gaya. "Revolution needs carbs." Post.'],
    ], { do: ['rumour:biryani:stage'], effects: { nuisance: 8 } }),
  ]),
  T('meera-d-speech', 'midday', [
    ['meera', 'Mira didi ka speech vertical mein shoot karun ya horizontal? Horizontal mein sincere lagta hai. Vertical mein viral.'],
    ['meera', 'Sincere aur viral ek saath nahi hote. Maine try kiya hai.'],
  ], [
    O('Say horizontal and send it to Zoya', [
      ['meera', 'Horizontal. Zoya ko. Okay, Mother Teresa. Par agar Zoya ka viral hua aur mera nahi...'],
    ], { effects: { help: 3 } }),
    O('Say vertical, obviously', [
      ['meera', 'Vertical. Haan. Bas uske sar ka top kat jaayega. Thought leader ka sar kat jaata hai. Normal hai.'],
    ], { effects: { aura: 1 } }),
    O('Say put the phone down and just listen', [
      hush('meera', '...'),
      ['meera', 'Do minute. Sirf do minute. Phir record.'],
    ], { effects: { help: 2, mood: { meera: 'chill' } } }),
  ]),

  // tense
  T('meera-t-suv', 'tense', [
    ['meera', 'SUV wala scene dekha? Naye joote baant rahe hain. Ye unboxing video hai. Bas ulta. Aur illegal.'],
  ], [
    O('Ask her to film you instead', [
      ['meera', 'Tu? Tera kya hai? ...Achha, "my friend reacts to free shoes". Theek hai. Reaction content.'],
    ], { effects: { aura: 2 } }),
    O('Ask her to film the fixer’s hands', [
      ['meera', 'Haathon ka close-up. Note aur joota ek frame mein. Zoom karna padega. Zoom mein sab blur. Blur bhi suspense hai.'],
    ], { effects: { help: 3, heat: 4, flags: ['meera-filming-suv'] } }),
    O('Tell her to stay well away from them', [
      ['meera', 'Door se? Main 0.5x pe hoon. Main already door hoon. Bas lens paas hai.'],
    ]),
  ], { requires: { before: '15:30' } }),
  T('meera-t-raf', 'tense', [
    ['meera', 'RAF wale reel mein bahut aesthetic aate hain. Blue, line mein, golden hour. Bas haath mein lathi.'],
    ['meera', 'Agar main slow-mo karun toh lagega trailer. Agar normal speed toh lagega news.'],
  ], [
    O('Ask if she’s scared', [
      hush('meera', '...Haan. Isliye phone pakad rakha hai. Phone ke peeche sab chhota lagta hai.'),
    ], { effects: { mood: { meera: 'scared' } } }),
    O('Say trailer', [
      ['meera', 'Trailer. "Coming soon: Tuesday." Haan.'],
    ], { effects: { aura: 1, nuisance: 2 } }),
    O('Say news', [
      ['meera', 'News. Okay. Bina music. Bina filter. Ye mere account pe pehli baar hoga. Followers sochenge mera phone hack hua.'],
    ], { effects: { help: 2 } }),
  ]),
  T('meera-t-missed', ['tense', 'showdown'], [
    ['meera', 'Tune USKO expose kiya? Aur maine miss kar diya? Main charger dhoondh rahi thi. Charger!'],
    ['meera', 'Zoya ke paas hai. Zoya ke paas hamesha hota hai. Uska karma achha hai. Mera bas content achha hai.'],
  ], [
    O('Tell her she can recreate it', [
      ['meera', 'Recreate? Recreate karungi toh woh "dramatisation" hai. Comments mein log pakad lenge. Log sab pakadte hain.'],
    ]),
    O('Give her your angle of it', [
      ['meera', 'AirDrop. Nahi, tera Android hai. Bluetooth. 2009 jaisa. Theek hai, bhej.'],
    ], { effects: { aura: 3, mood: { meera: 'happy' } } }),
  ], { priority: 10, requires: { holds: ['filmed:provocateur-exposed'] } }),

  // showdown
  T('meera-s-phone', 'showdown', [
    ['meera', 'Ek constable mera phone le raha tha. Maine bola "sir ye Nokia hai, isme camera nahi hai" aur bhaag gayi.'],
    ['meera', 'Isme camera hai. Teen camera hain.'],
  ], [
    O('Tell her to keep filming', [
      ['meera', 'Haan. Haan. Recording. Mere haath kaanp rahe hain toh stabilisation khud ho rahi hai. Ulti.'],
    ], { do: ['target:stream'], effects: { heat: 6, flags: ['meera-kept-filming'] } }),
    O('Grab her arm and get out of the line', [
      ['meera', 'Arm! Arm! Phone wala arm nahi! Doosra! Okay. Okay. Chalo.'],
    ], { do: ['follow:meera', 'friend:meera:ok'], effects: { help: 4 } }),
    O('Tuck her phone in your pocket', [
      ['meera', 'Tere pocket mein? Wahan chaabi, Parle-G aur ek purana bill hai. Theek hai. Sabse safe jagah. Koi nahi dekhega.'],
    ], { effects: { help: 3, flags: ['meera-phone-hidden'] } }),
  ]),
  T('meera-s-footage', 'showdown', [
    ['meera', 'Footage mere paas hai. Saara. Gas, lathi, sab. Ab ye reel hai ya evidence?'],
    ['meera', 'Reel mein music lagta hai. Evidence mein nahi. Mujhe nahi pata kaunsa gaana lagaun.'],
  ], [
    O('Tell her to save it and wait', [
      ['meera', 'Wait. Theek hai. Main kabhi wait nahi karti. Aaj pehli baar. Aaj sab pehli baar ho raha hai.'],
    ], { effects: { mood: { meera: 'chill' } } }),
    O('Tell her to post it raw, right now', [
      ['meera', 'Raw. Bina caption. Bas time aur jagah. Post.'],
      ['meera', 'Do sau views. Paanch sau. Ek hazaar. Ye pehla reel hai jiske views dekh ke mujhe darr lag raha hai.'],
    ], { effects: { aura: 5, heat: 5, flags: ['meera-posted-raw'] } }),
    O('Tell her to send it to Zoya', [
      ['meera', 'Zoya ko? Okay. Par credit. "Footage: Meera." Bold mein. Bada.'],
    ], { effects: { help: 5, flags: ['meera-to-zoya'] } }),
  ]),

  // aftermath
  T('meera-a-repost', 'aftermath', [
    ['meera', 'Subah wala clip repost hua. Kisi page ne. Naya caption: "Dekhiye kaise ye log police ka mazaak udaate hain."'],
    ['meera', 'Same clip. Same tu. Same uncle. Subah woh cute tha. Ab woh "anti-national". Maine kuch edit nahi kiya.'],
  ], [
    O('Ask what she’ll caption her own repost', [
      ['meera', '"Subah: comedy. Shaam: conspiracy. Same video." Haan. Ye post karti hoon. Ye mera hai.'],
    ], { effects: { aura: 3, mood: { meera: 'proud' } } }),
    O('Tell her to report the page', [
      ['meera', 'Report kiya. Instagram ne bola "doesn’t go against our guidelines." Unki guidelines bahut chill hain.'],
    ]),
    O('Tell her to log off for tonight', [
      hush('meera', '...Log off. Haan.'),
      ['meera', 'Main bas ek baar comments dekh leti hoon. Ek baar. Phir log off.'],
    ], { effects: { mood: { meera: 'sad' } } }),
  ]),
  T('meera-a-count', 'aftermath', [
    ['meera', 'Followers: 6,203. Ek din mein. Paanch hazaar paar.'],
    ['meera', 'Aur mujhe khushi nahi ho rahi. Matlab ho rahi hai. Par weird. Jaise exam mein pass ho gaye par paper leak tha.'],
  ], [
    O('Tell her the weird feeling is the point', [
      ['meera', 'Point? Tu Zoya ban gaya hai. Theek hai. Ye bhi caption hai.'],
    ], { effects: { help: 1 } }),
    O('Ask what she’ll post tomorrow', [
      ['meera', 'Kal? Kal kabootar. Sirf kabootar. Shanti wala content.'],
    ]),
    O('Remind her you promised her five thousand', [
      ['meera', 'Haan. Tune kiya. Thank you. Ye bolna mujhe ajeeb lag raha hai. Main aam taur pe sirf "lol" bolti hoon.'],
    ], { requires: { flags: ['meera-promise'] }, effects: { aura: 2, mood: { meera: 'grateful' } } }),
  ]),
  T('meera-a-raw', 'aftermath', [
    ['meera', 'Mera raw clip kisi news channel ne utha liya. Bina credit. Watermark crop karke.'],
    ['meera', 'Matlab main ab "local sources" hoon.'],
  ], [
    O('Help her write them an angry email', [
      ['meera', '"Dear Sir/Madam, aapne mera clip churaya." Formal hai? Haan. Bhej.'],
    ], { effects: { help: 2 } }),
    O('Congratulate her on becoming a source', [
      lol('meera', 'Local sources. Bio mein daal rahi hoon. "Reel creator | Local sources."'),
    ], { effects: { mood: { meera: 'proud' } } }),
  ], { priority: 8, requires: { anyFlags: ['meera-posted-raw', 'meera-to-zoya', 'meera-kept-filming'] } }),
];

// --- Zoya: independent reporter, livestreams -----------------------------------------------------

const zoya = [
  // morning
  T('zoya-m-checklist', 'morning', [
    ['zoya', 'Live jaane se pehle teen cheezein. Battery. Angle. Aur koi uncle jo frame mein haath na hilaaye.'],
    ['zoya', 'Uncle hamesha hota hai. Main ab usko budget mein rakhti hoon.'],
  ], [
    O('Wave into her camera', [
      ['zoya', 'Aur tu uncle ban gaya. Badhai. Main isko crop karti hoon.'],
    ], { effects: { nuisance: 3 } }),
    O('Offer to tip her off when something happens', [
      ['zoya', 'Source? Theek hai. Rule ek: jo dekha woh bata, jo socha woh mat bata. Rule do: forward mat bhejna.'],
    ], { effects: { help: 2, flags: ['zoya-source'] } }),
    O('Ask who she reports for', [
      ['zoya', 'Kisi ke liye nahi. Mera ek channel hai, chaudah hazaar log, aur ek power bank jiska naam maine "Boss" rakha hai.'],
    ]),
  ]),
  T('zoya-m-channels', 'morning', [
    ['zoya', 'Do bade channel pehle se aa gaye. Unke paas drone hai. OB van. Ek anchor jiske baal hawa mein bhi nahi hilte.'],
    ['zoya', 'Mere paas tripod hai. Ek pair toota hai. Usko main "Delhi" bolti hoon.'],
  ], [
    O('Tell her the drone is cooler', [
      ['zoya', 'Haan. Drone cool hai. Drone se sab chhote dikhte hain. Isliye drone wale sab ko chhota samajhte hain.'],
    ]),
    O('Ask what she has that they don’t', [
      ['zoya', 'Main poore din rahungi. Woh barah baje ka shot lenge aur Gurgaon wapas. Mujhe pata hai Asha ki chai kitne ki hai.'],
    ], { effects: { help: 1 } }),
    O('Offer to stand in as her tripod leg', [
      lol('zoya', 'Khada reh. Hil mat. Saans bhi mat le. Achha, saans le, par horizontal.'),
    ], { effects: { help: 2 } }),
  ]),

  // midday
  T('zoya-d-forward', 'midday', [
    ['zoya', 'Ye forward dekha? Teen group mein aaya. "Breaking." Sab capital mein. Koi source nahi.'],
    ['zoya', 'Jitna capital, utna jhooth. Mera thumb rule hai. Thumb bhi capital mein hai.'],
  ], [
    O('Tell her it’s true, you heard it too', [
      ['zoya', 'Tune suna? Kisse? "Ek bande se." Ek banda. Mera favourite source. Woh har jagah hai.'],
    ], { effects: { nuisance: 4 } }),
    O('Help her check it', [
      ['zoya', 'Theek hai. Tu barricade pe pooch, main control room ko call karti hoon. Jo pehle "pata nahi" bole, woh sach bol raha hai.'],
    ], { effects: { help: 4, flags: ['zoya-checking'] } }),
    O('Ask how she checks things this fast', [
      ['zoya', 'Fast nahi. Main bas forward bhejne se pehle paanch second rukti hoon. Log paanch second nahi ruk sakte.'],
    ]),
  ]),
  T('zoya-d-charging', 'midday', [
    ['zoya', 'Das percent. Bees minute charge. Bina phone ke main bas ek aunty hoon jo notes le rahi hai.'],
    ['zoya', 'Aur notes mein main likhti hoon "phone charge karna". Usi phone pe.'],
  ], [
    O('Ask her something off the record', [
      ['zoya', 'Off the record? Camera band hai toh main thak gayi hoon. Teen saal se har protest. Har baar wahi barricade.'],
      hush('zoya', 'Bas. Ab on the record. Main bilkul fresh hoon.'),
    ], { effects: { help: 1 } }),
    O('Offer to keep an eye on her phone', [
      ['zoya', 'Dhyan rakhega? Theek hai. Agar koi chhuye toh chilla. Zor se. Reporter ki tarah. "Sir, ek sawaal."'],
    ], { effects: { help: 3, flags: ['guarding-zoya-phone'] } }),
    O('Tell her the anchor’s hair is still perfect', [
      lol('zoya', 'Woh baal nahi hain. Woh ek political stance hai.'),
    ]),
  ], { requires: { after: '13:00' } }),
  T('zoya-d-phone-back', ['midday', 'tense'], [
    ['zoya', 'MERA PHONE. Tere haath mein kyun hai?'],
    ['zoya', 'Ek ghanta main bina phone ke thi. Mujhe pata chala ki main kisi ka number yaad nahi rakhti. Apna bhi nahi.'],
  ], [
    O('Ask for an interview before you hand it over', [
      ['zoya', 'Blackmail? Ek reporter ko? Mere hi phone se? Achha. Paanch sawaal. Phir phone.'],
      ['zoya', 'Pehla sawaal: phone kyun liya? ...Doosra sawaal: dimaag hai?'],
    ], { do: ['give:phone:zoya'], effects: { aura: 3, mood: { zoya: 'annoyed' } } }),
    O('Say you found it on a cart', [
      ['zoya', 'Cart pe. Haan. Main bhi cart pe chhodti hoon cheezein. Achha theek hai. Shukriya. Sach mein.'],
    ], { do: ['give:phone:zoya'], effects: { help: 6 } }),
    O('Keep it a little longer, you’re filming', [
      ['zoya', 'Tu filming kar raha hai. Mere phone se. Mere channel ke liye nahi. Wow. Main ye bhi report karungi.'],
    ], { effects: { heat: 6, nuisance: 6, mood: { zoya: 'annoyed' } } }),
  ], { priority: 9, requires: { holding: 'phone' } }),
  T('zoya-d-interview', ['midday', 'tense'], [
    ['zoya', 'Tu wahi hai na? Meera ke reel wala. Chalees hazaar log tujhe jaante hain aur koi nahi jaanta tu kyun aaya.'],
    ['zoya', 'Interview dega? Sahi wala. Context ke saath.'],
  ], [
    O('Do the Shah Rukh pose again', [
      lol('zoya', 'Aur ye interview ab Meera ka reel hai. Theek hai. Context gaya.'),
    ], { effects: { aura: 3, heat: 2 } }),
    O('Give her a real answer', [
      ['player', 'Dost aaye the. Main aaya. Phir dekha kya ho raha hai. Phir ruk gaya.'],
      ['zoya', 'Ye... achha hai. Ye sach lagta hai. Isko koi share nahi karega.'],
    ], { effects: { help: 4, aura: 2 } }),
    O('Decline, you’re just a spectator', [
      ['zoya', 'Spectator. Haan. Sabse popular jhooth. Yahan har koi spectator hai jab tak lathi nahi chalti.'],
    ]),
  ], { priority: 7, requires: { rep: { aura: 40 } } }),

  // tense
  T('zoya-t-suv', 'tense', [
    ['zoya', 'SUV pe cash. Mujhe frame chahiye jisme haath aur note dono dikhe. Ek frame. Bas.'],
    ['zoya', 'Bina haath ke note sirf note hai. Bina note ke haath sirf haath.'],
  ], [
    O('Ask if the shot is worth getting hit for', [
      hush('zoya', '...Pichli baar mera phone toot gaya tha. Footage bach gayi. Toh haan. Shayad.'),
    ]),
    O('Point out the man in the jacket', [
      ['zoya', 'Jacket. Is garmi mein. Haan, woh hi hai. Sirf woh log jacket pehente hain jinke paas kuch chhupaana ho.'],
    ], { effects: { help: 4, flags: ['zoya-on-suv'] } }),
    O('Tell her you’ll get the shot yourself', [
      ['zoya', 'Tu? Theek hai. Agar mila toh mujhe bhej. Raw. Agar Meera pehle post kare toh mujhe mat bata.'],
    ], { effects: { heat: 3 } }),
  ], { requires: { before: '15:30' } }),
  T('zoya-t-line', 'tense', [
    ['zoya', 'Barricade pe line ban gayi. Mujhe naam chahiye. Kaun officer kahan khada hai. Baad mein sab bhool jaate hain.'],
  ], [
    O('Tell her Sharma knows your name already', [
      ['zoya', 'Wah. Tu register mein hai aur main tujhe source bana rahi hoon. Mera judgment kamaal hai.'],
    ]),
    O('Tell her about Constable Meena', [
      ['zoya', 'Meena. Woh muskurati hai jab koi dekh nahi raha. Mujhe pata hai. Main dekh rahi thi.'],
    ], { effects: { help: 2 } }),
    O('Tell her about Constable Tomar', [
      ['zoya', 'Tomar. Haan. Uska naam main pehle se likh chuki hoon. Teen protest. Teen baar.'],
    ], { effects: { help: 2 } }),
  ]),
  T('zoya-t-raw', ['tense', 'showdown'], [
    ['zoya', 'Tune expose kiya? Raw file bhej. Bina edit. Bina music. Haan, bina music.'],
    ['zoya', 'Agar music lagaya toh woh entertainment hai. Agar nahi lagaya toh mujhe kaam hai.'],
  ], [
    O('Ask for credit on her stream', [
      ['zoya', 'Credit. "Video: ek student." Ye credit hai. Tera naam likha toh tera naam kisi aur register mein jaayega.'],
    ], { effects: { help: 2 } }),
    O('Send her the raw file', [
      ['zoya', 'Aa gaya. Timestamp hai. Location hai. Haath hai. Note hai. Ye... ye wala frame hai.'],
    ], { effects: { help: 6, flags: ['zoya-has-raw'] } }),
    O('Tell her Meera posted it first', [
      ['zoya', 'Meera ne post kiya. Music ke saath. Kaunsa gaana? ...Theek hai. Main context daalti hoon. Hamesha ki tarah.'],
    ]),
  ], { priority: 10, requires: { holds: ['filmed:provocateur-exposed'] } }),

  // showdown
  T('zoya-s-live', 'showdown', [
    ['zoya', 'Main live hoon. Baarah hazaar log. Bol. Kya dekha? Sirf jo dekha.'],
  ], [
    O('Wave at your mummy on the stream', [
      lol('zoya', 'Baarah hazaar log. Aur unme se ek teri mummy. Ab woh terah hazaar ho gaye.'),
    ], { effects: { aura: 2, nuisance: 3 } }),
    O('Say exactly what you saw, in order', [
      ['player', 'Pehle cannon. Phir dhuan. Phir log bhaage. Phir lathi. Is order mein.'],
      ['zoya', 'Order. Haan. Sab log order bhool jaate hain. Kal sab bolenge pehle lathi chali. Ye clip rahegi.'],
    ], { do: ['target:stream'], effects: { help: 6, heat: 4 } }),
    O('Duck out of the frame', [
      ['zoya', 'Smart. Frame mein mat aa. Frame mein aane wale log kal frame hote hain.'],
    ], { effects: { heat: -4 } }),
  ]),
  T('zoya-s-cloud', 'showdown', [
    ['zoya', 'Agar unhone mera phone le liya toh bhi sab cloud pe hai. Unko ye nahi pata. Unko cloud ka matlab baarish lagta hai.'],
  ], [
    O('Ask what happens if they take her too', [
      hush('zoya', '...Toh stream chalta rahega. Ek khaali frame. Woh bhi report hai.'),
    ]),
    O('Offer to stand between her and the line', [
      ['zoya', 'Mere aage? Tu bahut patla hai. Par theek hai. Ek second ka bhi farak padta hai.'],
    ], { do: ['stance:protect'], effects: { help: 4, heat: 4 } }),
  ]),

  // aftermath
  T('zoya-a-versions', 'aftermath', [
    ['zoya', 'Mera version: do lakh. Unka version: bees lakh. Same footage. Unhone bas pehle teen second kaat diye.'],
    ['zoya', 'Pehle teen second mein cannon tha. Cannon ke bina sab ulta dikhta hai.'],
  ], [
    O('Tell her to give up, it’s rigged', [
      ['zoya', 'Rigged hai. Haan. Isliye toh main hoon. Agar fair hota toh main ghar pe hoti, serial dekh rahi hoti.'],
    ]),
    O('Ask if two lakh is enough', [
      ['zoya', 'Enough? Nahi. Kabhi nahi. Par do lakh log jaante hain sach. Do lakh log ek stadium hai.'],
    ]),
    O('Ask her what she’d cut if she could', [
      hush('zoya', '...Kuch nahi. Wahi problem hai.'),
    ], { effects: { help: 1 } }),
  ]),
  T('zoya-a-name', 'aftermath', [
    ['zoya', 'Story likh rahi hoon. Tera naam likhun ya "ek student"?'],
  ], [
    O('Ask her to call you "a local source"', [
      lol('zoya', 'Meera ne bhi yahi poocha. Tum dono ko ek hi bio chahiye.'),
    ]),
    O('Use your name', [
      ['zoya', 'Pakka? Naam likhna aasan hai. Wapas lena mushkil. ...Theek hai. Spelling bol.'],
    ], { effects: { aura: 4, heat: 4 } }),
    O('Just "a student"', [
      ['zoya', '"Ek student." Delhi mein das lakh hain. Tu safe hai. Thoda boring, par safe.'],
    ], { effects: { heat: -2 } }),
  ]),
];

// --- Mira: student organiser, gives the noon speech ---------------------------------------------

const mira = [
  // morning
  T('mira-m-speaker', 'morning', [
    ['mira', 'Barah baje bolna hai. Ravi ka speaker nahi aaya toh main bas zor se bolungi.'],
    ['mira', 'Zor se bolna strategy nahi hai. Woh bas zor se bolna hai.'],
  ], [
    O('Suggest she open with a joke from Kabir', [
      ['mira', 'Kabir ka joke? Woh WiFi wala? Usne mujhe bhi sunaya. Teen baar.'],
      lol('mira', 'Nahi. Kabhi nahi. Par thank you for the laugh. Ye wala genuine tha.'),
    ]),
    O('Ask her to practise her opening on you', [
      ['mira', '(mic voice) "Saathiyon! Hum yahan isliye hain..." (normal) Bas. Aage abhi likha nahi. Tu bata kyun hain.'],
    ], { effects: { help: 1 } }),
    O('Promise to get the speaker to the stage', [
      ['mira', 'Promise? Log subah se promise kar rahe hain. Ravi ne bhi kiya tha. Ravi ab chai pe hai.'],
      ['mira', 'Theek hai. Agar laaya toh tu mere bhashan ka "special thanks" hai.'],
    ], { effects: { help: 2, flags: ['promised-speaker'] } }),
  ]),
  T('mira-m-groups', 'morning', [
    ['mira', 'Sabka point hai. LJM ko photo chahiye. Sena ko gaana chahiye. Students ko exam date chahiye.'],
    ['mira', 'Aur ek mic hai. Bas ek.'],
  ], [
    O('Tell her to let everyone speak for a minute', [
      ['mira', 'Ek minute sabko? Phir ek ghanta lagega. Neta ka ek minute paintalees minute ka hota hai.'],
    ]),
    O('Tell her to make the speech about the exams only', [
      ['mira', 'Exams. Haan. Ek message. Saaf. Sab samjhenge. ...LJM wale naraz honge. Par samjhenge.'],
    ], { effects: { help: 2, flags: ['mira-one-message'] } }),
    O('Ask how she ended up in charge', [
      ['mira', 'Kisi ne permission form bharna tha. Maine bhara. Bas. Ab main "organiser" hoon. Form se.'],
    ]),
  ]),

  // midday
  T('mira-d-how', 'midday', [
    ['mira', 'Kaisa tha? Sach bolna. ...Nahi, itna sach mat bolna.'],
  ], [
    O('Tell her the honest truth', [
      ['player', 'Beech mein "saathiyon" saat baar bola.'],
      hush('mira', '...Saat?'),
      ['mira', 'Main gin rahi thi. Mujhe laga paanch. Theek hai. Kal sirf chaar.'],
    ], { effects: { help: 3 } }),
    O('Tell her it was great', [
      ['mira', 'Great. Tu jhooth bol raha hai par achha jhooth hai. Main rakhti hoon.'],
    ], { effects: { mood: { mira: 'happy' } } }),
    O('Tell her Kabir laughed at the sad part', [
      ['mira', 'Mujhe pata hai. Main dekh rahi thi. Usne "fees" pe hasa. Woh bolega "timing" tha.'],
    ]),
  ], { requires: { after: '12:30' } }),
  T('mira-d-neta', 'midday', [
    ['mira', 'LJM ke neta ji aa rahe hain. Photo ke liye. Ek photo mein main unke peeche, unke kurte ke peeche, ek banner ke peeche.'],
    ['mira', 'Mujhe photo mein aane ke liye unke kurte se permission chahiye.'],
  ], [
    O('Tell her to just let him have the mic', [
      ['mira', 'Mic de doon? Phir kal ke akhbaar mein "LJM ka protest". Hum bas uski bheed honge.'],
      ['mira', '...Par haan, unki bheed bhi hai. Pata nahi. Dekhte hain.'],
    ]),
    O('Offer to photobomb the neta', [
      ['mira', 'Photobomb? Neta ka? Haan. Ek kaam kar. Unke kandhe ke upar se "exams" ka placard. Bas itna.'],
    ], { effects: { aura: 3, heat: 2, flags: ['photobomb-neta'] } }),
    O('Tell her to hold the mic like a cricket bat', [
      lol('mira', 'Like a bat. Haan. Agar woh aage aaye toh main straight drive karungi.'),
    ], { effects: { mood: { mira: 'amused' } } }),
  ]),
  T('mira-d-speaker', ['midday', 'tense'], [
    ['mira', 'Speaker tune laaya? Tujhe pata hai poore Jantar ne suna? Pichhli line mein ek aunty ro rahi thi.'],
    ['mira', 'Ya garmi thi. Par main ro rahi maan rahi hoon.'],
  ], [
    O('Say it was Ravi who did it', [
      ['mira', 'Ravi chai pe tha. Mujhe pata hai. Par tune Ravi ko credit diya. Ye mujhe yaad rahega.'],
    ], { effects: { help: 3 } }),
    O('Ask what the special thanks gets you', [
      ['mira', 'Special thanks ko ek chai. Asha ke stall pe. Mere account pe. Mere account mein do sau rupaye hain.'],
    ], { effects: { aura: 2 } }),
  ], { priority: 7, requires: { did: ['speaker-run'] } }),
  T('mira-d-mic-kept', ['midday', 'tense'], [
    ['mira', 'Mic mere paas raha. Neta ji ne photo li, mere bina. Theek hai. Photo unki, mic hamara.'],
    ['mira', 'Kal unka akhbaar bolega "LJM ne students ka saath diya". Hum bolenge "kis students ka?"'],
  ], [
    O('Warn her the neta will remember', [
      hush('mira', '...Haan. Unki yaadasht chunaav tak chalti hai.'),
    ]),
    O('Tell her she won', [
      ['mira', 'Jeeta? Shayad. Mujhe neta ke assistant ne "beti" bola. Woh haarne jaisa laga.'],
    ], { effects: { mood: { mira: 'proud' } } }),
  ], { priority: 8, requires: { did: ['mira-mic'] } }),

  // tense
  T('mira-t-calm', 'tense', [
    ['mira', 'Barricades. RAF. Ab mujhe "shanti banaye rakhein" bolna padega. Duniya ki sabse kam cool line.'],
    ['mira', 'Agar nahi bola aur kuch hua, toh meri galti. Agar bola aur kuch nahi hua, toh main "darpok".'],
  ], [
    O('Push her to march everyone to the barricade', [
      ['mira', 'March? Abhi? ...Log ready hain. Main nahi hoon. Par log ready hain.'],
      ['mira', 'Theek hai. Barricade. Par aage main chalungi. Tu nahi.'],
    ], { do: ['crowd:barricade:+3', 'intensity:+1', 'hotspot:barricade'], effects: { aura: 4, heat: 6 } }),
    O('Help her keep everyone sitting down', [
      ['mira', 'Baith jao. Haan. Sab baith jaate hain toh lathi ka angle nahi banta. Ye maine ek video mein dekha tha.'],
    ], { do: ['stance:hold', 'intensity:-1'], effects: { help: 4 } }),
    O('Tell her the line is fine, it’s the delivery', [
      ['mira', '(mic voice) "Shanti. Banaye. Rakhein." (normal) Haan? Thoda dhamki jaisa laga? Theek hai, chalega.'],
    ], { effects: { mood: { mira: 'amused' } } }),
  ]),
  T('mira-t-dev', 'tense', [
    ['mira', 'Dev bolta hai minister aa rahe hain. Dev har saal bolta hai. Ek saal toh minister ka cousin aaya tha.'],
    ['mira', 'Cousin ne bola "main bata dunga." Kisko, kya, kab, kuch nahi bola.'],
  ], [
    O('Tell her this time it might be real', [
      ['mira', 'Real. Haan. Main bhi hope karti hoon. Hope karna mera kaam hai. Plan karna bhi. Dono ek saath bahut thakaata hai.'],
    ]),
    O('Ask her to keep Dev away from the barricade', [
      ['mira', 'Dev ko? Dev megaphone ke saath hai. Megaphone ke saath Dev ko koi nahi rokta. Megaphone bhi nahi.'],
    ], { effects: { help: 2, flags: ['mira-watching-dev'] } }),
  ]),

  // showdown
  T('mira-s-list', 'showdown', [
    ['mira', 'Mujhe dhoondh rahe hain. Mera naam list mein hai. Organiser. Form wala naam.'],
    ['mira', 'Form bharne ki saza. Agli baar Kabir bharega.'],
  ], [
    O('Tell her to keep the mic and keep talking', [
      ['mira', '(mic voice) Koi nahi bhaagega! Hum baithe hain! Hum— (normal) haan, ye mujhe le jaayenge. Theek hai.'],
    ], { do: ['target:mira', 'stance:hold'], effects: { aura: 3 } }),
    O('Hide her in the crowd', [
      ['mira', 'Bheed mein. Haan. Sab dupatta upar. Main sirf ek aur ladki hoon. Aaj pehli baar ye achha lag raha hai.'],
    ], { do: ['target:none'], effects: { help: 5, heat: 3 } }),
    O('Stand next to her so they see you instead', [
      ['mira', 'Tu? Woh tujhe le jaayenge. Tu... theek hai. Theek hai. Main tera naam yaad rakhungi. Galat spelling ke saath.'],
    ], { do: ['target:player'], effects: { aura: 5, heat: 8 } }),
  ]),
  T('mira-s-choice', 'showdown', [
    ['mira', 'Sab baith jao bolun ya sab bhaago? Dono galat ho sakte hain.'],
    ['mira', 'Mic pe jo bolungi woh log karenge. Ye power nahi hai. Ye bojh hai.'],
  ], [
    O('Tell her to say sit', [
      ['mira', '(mic voice) Baith jao! Sab! Haath upar! (normal) Agar ye galat hua toh kal mujhe yaad dilana.'],
    ], { do: ['stance:hold'], effects: { aura: 3, heat: 3 } }),
    O('Tell her to say run', [
      ['mira', '(mic voice) Metro ki taraf! Dheere! Bhaago mat, chalo! (normal) Ye "bhaago" hi tha. Bas polite.'],
    ], { do: ['stance:scatter', 'crowd:stage:-4'], effects: { help: 3 } }),
    O('Tell her to stop deciding for a minute', [
      hush('mira', '...'),
      ['mira', 'Ek minute. Haan. Ek minute koi decision nahi. Bas saans.'],
    ]),
  ]),

  // aftermath
  T('mira-a-form', 'aftermath', [
    ['mira', 'Kal phir aana hai. Permission form phir bharna hai. Form mein "expected crowd" ka column hai.'],
    ['mira', 'Kya likhun? "Pehle se kam"? "Pehle se gussa"? "Wahi log, thoda zyada samajhdaar"?'],
  ], [
    O('Offer to fill it in for her', [
      lol('mira', 'Tu? Phir tu organiser. Phir tera naam list mein. Welcome to the form.'),
    ], { effects: { help: 3, flags: ['player-signed-form'] } }),
    O('Tell her to write "more"', [
      ['mira', '"More." Haan. Bas "more." Unko pareshan karega. Achha hai.'],
    ], { effects: { mood: { mira: 'proud' } } }),
  ]),
  T('mira-a-quiet', 'aftermath', [
    ['mira', 'Mic pe sab sunte hain. Mic ke baad koi nahi.'],
    ['mira', 'Tu sun raha hai. Ye bhi kuch hai.'],
  ], [
    O('Make her laugh about the neta’s kurta', [
      lol('mira', 'Woh kurta! Usme teen jeb thi. Teeno mein phone. Teeno pe "Sir" calling.'),
    ], { effects: { mood: { mira: 'amused' } } }),
    O('Just listen', [
      hush('mira', 'Aaj ek ladka aaya, pehla protest tha uska. Usne mujhse poocha "main saathi hoon?" Main jawab nahi de paayi.'),
      ['mira', 'Agar dikhe toh bolna haan.'],
    ], { effects: { help: 2 } }),
  ]),
];

// --- Dev: coalition negotiator, the megaphone, a minister who never comes -----------------------

const dev = [
  // morning
  T('dev-m-groups', 'morning', [
    ['dev', 'Main coalition dekhta hoon. Matlab teen WhatsApp groups ka admin hoon jo ek dusre se baat nahi karte.'],
    ['dev', 'Mera kaam hai unko ek dusre ke messages forward karna. Bina naam ke. Ye diplomacy hai.'],
  ], [
    O('Ask to borrow the megaphone', [
      ['dev', 'Ye megaphone nahi hai. Ye meri negotiating position hai. Isko main tab tak nahi chhodta jab tak chai nahi aati.'],
    ]),
    O('Ask him about the minister', [
      ['dev', 'Minister saahab aayenge. Saade teen baje. Barricade pe. Delegation se milenge. Confirm? Confirm kabhi nahi hota. Isliye toh aate hain.'],
    ], { effects: { flags: ['heard-dev-minister'] } }),
    O('Volunteer as a delegate', [
      ['dev', 'Delegate? Tere paas kurta hai? Nahi. Theek hai. Tu "youth delegate". Youth ko kurta nahi chahiye.'],
    ], { effects: { help: 2, flags: ['dev-delegate'] } }),
  ]),
  T('dev-m-mira', 'morning', [
    ['dev', 'Mira ko bola tha mic share kar. Usne bola "ek message". Ek message se coalition nahi banta.'],
    ['dev', 'Coalition banta hai das message se jo ek jaisa lagta hai.'],
  ], [
    O('Take Mira’s side', [
      ['dev', 'Mira ki side? Theek hai. Sab uski side hote hain. Woh form bharti hai. Form wale jeet jaate hain.'],
    ], { effects: { mood: { dev: 'sulking' } } }),
    O('Ask what his one message would be', [
      ['dev', 'Mera? "Hum baat karne ko taiyaar hain." Kisse? Kisi se bhi. Jo bhi aaye. Ideally minister.'],
    ]),
    O('Take Dev’s side', [
      ['dev', 'Shukriya. Kisi ne toh. Tu youth wing mein hai. Abhi. Mujhe youth wing chahiye thi.'],
    ], { effects: { mood: { dev: 'happy' }, flags: ['dev-delegate'] } }),
  ]),

  // midday
  T('dev-d-spread', 'midday', [
    ['dev', 'Tum log bhi bolo minister aa rahe hain. Bolne se aate hain. Jitne log barricade pe, utna pressure.'],
    ['dev', 'Ye afwaah nahi hai. Ye manifestation hai.'],
  ], [
    O('Refuse, you’d rather not be his source', [
      ['dev', 'Source nahi, supporter. Theek hai. Mat bol. Main akela bolunga. Main hamesha akela bolta hoon. Megaphone pe.'],
    ], { effects: { mood: { dev: 'sulking' } } }),
    O('Spread it at the barricade with him', [
      ['dev', 'Barricade. Perfect. Main bolta hoon, tu "haan maine bhi suna" bol. Do log matlab confirmed.'],
    ], { do: ['rumour:minister:barricade'], effects: { nuisance: 8 } }),
    O('Spread it at the CP stop', [
      ['dev', 'CP. Haan. Wahan se log aayenge. Koi nahi maanega, sab repeat karenge. Perfect.'],
    ], { do: ['rumour:minister:cp'], effects: { nuisance: 8 } }),
  ]),
  T('dev-d-neta', 'midday', [
    ['dev', 'LJM ke neta ji. Mujhe unse milna tha. Main teen saal se unke PA ka PA hoon. Matlab unke PA ka number hai mere paas.'],
  ], [
    O('Ask him to get you in the neta’s photo', [
      ['dev', 'Photo mein? Haan. Tu peeche. Kurte ke peeche. Banner ke peeche. Tu wahi hai jo Mira thi.'],
    ], { effects: { aura: 2 } }),
    O('Ask him to keep the neta off Mira’s mic', [
      ['dev', 'Mira ka mic? Main neta ji ko bolunga "sir photo stage ke side se achha aata hai". Side se. Mic se door.'],
    ], { effects: { help: 3, flags: ['dev-shields-mira'] } }),
    O('Tell him the neta just wants a photo-op', [
      ['dev', 'Haan. Toh? Photo-op bhi op hai. Op matlab opportunity. Main hamesha opportunity mein rehta hoon.'],
    ]),
  ]),

  // tense
  T('dev-t-chai', 'tense', [
    ['dev', 'Chai break. Megaphone stage pe rakha hai. Pandrah minute. Koi nahi lega. Sab mujhe jaante hain.'],
    ['dev', 'Mujhe sab jaante hain. Ye mera security system hai.'],
  ], [
    O('Say nothing and glance at the megaphone', [
      hush('dev', '...Tu megaphone dekh raha hai.'),
      ['dev', 'Nahi dekh raha. Theek hai. Main chai pe hoon. Mujhe kuch nahi dikhta chai pe.'],
    ], { effects: { nuisance: 2 } }),
    O('Ask if Kabir could borrow it for his set', [
      ['dev', 'Kabir? Woh comic? Megaphone pe comedy? Megaphone pe sirf demands hoti hain. ...Comedy bhi demand hai? Nahi. Nahi.'],
    ], { effects: { flags: ['dev-said-no-kabir'] } }),
    O('Offer to guard it for him', [
      ['dev', 'Guard? Tu? Achha. Agar koi chhuye toh bol "Dev ka hai". Log darr jaayenge. Shayad. Ek aadh.'],
    ], { effects: { help: 3, flags: ['guarding-megaphone'] } }),
  ], { requires: { after: '14:15', before: '14:45' } }),
  T('dev-t-waiting', 'tense', [
    ['dev', 'Teen baj gaye. Minister ji "raste mein" hain. Raste mein matlab Gurgaon. Gurgaon matlab kal.'],
    ['dev', 'Par main khada rahunga. Khade rehna negotiation ka pehla step hai. Doosra step bhi.'],
  ], [
    O('Rally a few people to wait with him', [
      ['dev', 'Delegation! Haan! Paanch log, chaar placard, ek megaphone. Minister ko lagega hum serious hain.'],
    ], { do: ['crowd:barricade:+2'], effects: { aura: 2, heat: 3 } }),
    O('Tell him the minister isn’t coming', [
      hush('dev', '...'),
      ['dev', 'Mujhe pata hai. Har saal pata hota hai. Par agar main nahi khada hua toh unko pata chalega ki mujhe pata hai.'],
    ], { effects: { mood: { dev: 'sad' }, flags: ['dev-knows-noshow'] } }),
    O('Suggest he negotiate with Sharma instead', [
      ['dev', 'Sharma? Constable se negotiation? ...Woh kam se kam aaya hai. Theek hai. Main poochta hoon unki demands kya hain.'],
    ], { do: ['calm:sharma'], effects: { help: 4 } }),
  ], { requires: { after: '14:45' } }),
  T('dev-t-holding-meg', ['tense', 'showdown'], [
    ['dev', 'Mera megaphone! Tere haath mein! Main chai pe tha! Pandrah minute!'],
    ['dev', 'Bina iske meri negotiation sirf baat-cheet hai.'],
  ], [
    O('Tell him Kabir needs it more', [
      ['dev', 'Kabir? Comedy ke liye? Main yahan ek minister ka wait kar raha hoon aur tu chutkule... theek hai. Ek shart.'],
      ['dev', 'Woh mera naam lega. Set mein. "Dev bhai ke megaphone ke saujanya se."'],
    ], { do: ['give:megaphone:kabir'], effects: { help: 2, flags: ['kabir-has-mic', 'dev-credited'] } }),
    O('Keep it and make one announcement', [
      lol('player', '(megaphone pe) Minister ji traffic mein hain. Sab log thoda paani pee lo.'),
      ['dev', 'Ye... ye mera line tha. Main yahi bolne wala tha. Paani wala part nahi. Par baaki.'],
    ], { effects: { aura: 3, nuisance: 4, mood: { dev: 'annoyed' } } }),
    O('Hand it back with an apology', [
      ['dev', 'Shukriya. Sach mein. Ab main phir se main hoon.'],
      ['dev', '(megaphone pe) TESTING. Haan. Wapas.'],
    ], { do: ['give:megaphone:dev'], effects: { help: 4, mood: { dev: 'grateful' } } }),
  ], { priority: 9, requires: { holding: 'megaphone' } }),

  // showdown
  T('dev-s-provocation', 'showdown', [
    ['dev', 'Maine bola tha "negotiation". Unhone suna "provocation". Bas thoda sa farak.'],
    ['dev', 'Ab RAF mujhe aise dekh rahi hai jaise main ek group admin hoon. Jo main hoon.'],
  ], [
    O('Tell him this is the negotiation', [
      hush('dev', '...Haan. Shayad. Yahi hai.'),
    ], { effects: { mood: { dev: 'sad' } } }),
    O('Tell him to stand between the crowd and the line', [
      ['dev', 'Beech mein. Haan. Megaphone ke bina bhi main beech mein khada ho sakta hoon. Mera poora career beech mein hai.'],
    ], { do: ['stance:protect'], effects: { help: 4, heat: 5 } }),
    O('Tell him to lead them away', [
      ['dev', '(chilla ke) Metro ki taraf! Delegation, metro ki taraf! Agli meeting... metro mein!'],
    ], { do: ['stance:scatter', 'intensity:-1'], effects: { help: 3 } }),
  ]),
  T('dev-s-register', 'showdown', [
    ['dev', 'Mera naam register mein likh liya. Spelling galat. "Dave". Ab main ek NRI hoon.'],
  ], [
    O('Ask if they took his megaphone too', [
      ['dev', 'Megaphone? Nahi. Unhone megaphone ko "sarkari sampatti" samjha. Usme sticker hai. Kisi purani rally ka.'],
    ]),
    O('Tell him to keep the wrong spelling', [
      lol('dev', 'Haan. Dave ka koi record nahi hai. Dave saaf hai. Main Dave rahunga. Aaj ke liye.'),
    ], { effects: { mood: { dev: 'amused' } } }),
  ]),

  // aftermath
  T('dev-a-kal', 'aftermath', [
    ['dev', 'Minister ke office ne bola "kal". Kal matlab agle hafte. Agla hafta matlab agle saal. Agla saal matlab election.'],
  ], [
    O('Offer to come next time too', [
      ['dev', 'Tu aayega? Youth delegate? Kurta pehenna. Ek kurta kaafi hai. Neta ji teen badalte hain.'],
    ], { effects: { help: 2, mood: { dev: 'happy' } } }),
    O('Tell him to stop waiting', [
      ['dev', 'Ruk jaun? Phir woh kehenge "koi aaya hi nahi". Main aaya. Main hamesha aata hoon. Woh unka problem hai.'],
    ]),
  ]),
  T('dev-a-summary', 'aftermath', [
    ['dev', 'Aaj ka summary. Teen group. Ek megaphone. Zero minister. Do detention. Ek reel jisme main peeche khada hoon.'],
    ['dev', 'Group mein ye forward karunga. Teeno group mein. Alag alag shabdon mein.'],
  ], [
    O('Ask him to put you in the summary', [
      ['dev', '"Ek youth delegate ne kaafi madad ki." Naam nahi. Naam se problem hoti hai. Mujhe pata hai. Dave.'],
    ], { effects: { aura: 2 } }),
    O('Ask what the three versions say', [
      ['dev', 'Ek: "Historic din." Do: "Sarkar dar gayi." Teen: "Kal phir aana. Paani laana."'],
      ['dev', 'Teesra wala sach hai.'],
    ]),
  ]),
];

const TALKS = { kabir, nikhil, meera, zoya, mira, dev };

// --- reactions when you talk to them right after something happened -----------------------------

const REACTS = {
  kabir: {
    'bus-key': [['kabir', 'Tune bus ki chabi li?? Bhai ye set ka closer hai. Main ise apna bataunga. Tu bura nahi maanega na. Maanega? Theek hai, "mera dost".']],
    'bus-stalled': [['kabir', 'Bus ruk gayi. Sab log dhakka de rahe hain. Delhi ka sabse purana khel. Bus ko dhakka, system ko dhakka.']],
    chase: [['kabir', 'Tu bhaaga! Constable peeche! Bhai mere pet mein dard ho gaya hasi se. Ya darr se. Dono ka dard ek jaisa hai.']],
    caught: [['kabir', 'Pakda gaya? Okay. Okay. Main mummy ko nahi bataunga. Tu bhi mat batana. Kisi ki mummy ko.']],
    'speaker-party': [['kabir', 'CP pe dance floor! Ek uncle ne thumka maara. Bhai woh uncle mera hero hai. Unka set hai, mera nahi.']],
    'stone-thrown': [hush('kabir', 'Pathar. Kisne? ...Nahi. Ye funny nahi hai. Main abhi kuch nahi bolunga.')],
    gas: [['kabir', 'Aankh. Naak. Gala. Teeno ek saath. Ye mera teen ka rule nahi tha.']],
    charge: [['kabir', 'Lathi chali. Maine dekha. Main bas dekh raha tha. Main hamesha bas dekhta hoon. Aaj nahi dekhna chahta tha.']],
    'cannon-spray': [lol('kabir', 'Free nahana! Maine bola tha! Mere baal kharab. Mummy poochegi "tuition mein baarish?"')],
    'cannon-dance': [lol('kabir', 'Cannon ke neeche dance! Main isko apne set mein daalun ya ye mere set se zyada funny hai? Dusra. Hamesha dusra.')],
    'pester-career': [['kabir', 'Tune constable se career advice li? SSC? Bhai tu apni life ka sabse safe option police se le raha hai. Material.']],
    'pester-cute': [lol('kabir', '"Uncle aap cute ho." Unka chehra! Woh khush the. Woh chhupa rahe the. Main ise chura raha hoon.')],
    roast: [['kabir', 'Maine kiya! Megaphone pe! Log hase! Ek ne video banaya! Ab mummy ke WhatsApp tak pahunchne mein do ghante.']],
    'provocateur-exposed': [['kabir', 'Tune unka bhanda phod diya! Live! Bhai SUV wale aise bhaage jaise unki mummy ne call kiya.']],
    'detainees-escape': [['kabir', 'Bus khaali! Sab bahar! Ek uncle kele le ke bhaag rahe hain. Bhai ye Ocean’s Eleven ka Karol Bagh version hai.']],
  },
  nikhil: {
    'bus-key': [['nikhil', 'Update: aapne chabi li. Update: bus wale bhaiya aapko dhoondh rahe hain. Update: main aapke peeche nahi hoon. Abhi.']],
    'bus-stalled': [['nikhil', 'Bus band ho gayi. Mere phone jaisi. Bas bus ka teen percent bhi nahi hai. Seedha zero.']],
    chase: [['nikhil', 'Aap bhaage toh main bhi bhaaga. Phir yaad aaya mujhe kisi ne nahi dekha. Toh main ruk gaya. Phir bhaaga. Just in case.']],
    caught: [hush('nikhil', 'Unhone aapko pakda. Main dekh raha tha. Main kuch nahi kar paaya. Update: mujhe bura lag raha hai.')],
    'speaker-party': [lol('nikhil', 'Maine naacha! Pehli baar public mein! Kisi ne dekha nahi. Achha hai. Ya bura hai. Pata nahi.')],
    'stone-thrown': [['nikhil', 'Pathar wahan se aaya. SUV ki taraf se. Maine dekha. Main detail dekhta hoon. Kisi ko batana hai?']],
    gas: [['nikhil', 'Update: saans nahi aa rahi. Update: thodi aa rahi hai. Update: aap kahan ho?']],
    charge: [['nikhil', 'Sab bhaag rahe the. Main bhi. Maine Kabir ki hoodie pakdi. Woh Kabir ki nahi thi. Ek uncle ki thi.']],
    'cannon-spray': [['nikhil', 'Paani! Mera phone! ...Phone pehle se mara hua tha. Toh koi farak nahi. Pehli baar dead phone kaam aaya.']],
    'cannon-dance': [lol('nikhil', 'Log cannon ke neeche naach rahe hain. Main bhi naacha. Mujhe laga protest mein naachna mana hai. Nahi hai!')],
    'pester-career': [['nikhil', 'Aapne police uncle se career poocha? Main bhi poochun? Mujhe bhi nahi pata main kya banunga.']],
    'detainees-escape': [['nikhil', 'Update: bus khaali. Update: sab bahar. Update: ek uncle ka kela gir gaya. Maine utha liya. Ye mera hai ab?']],
    'provocateur-exposed': [['nikhil', 'Woh wahi bhaiya the jinhone mujhe charger offer kiya tha. Aapne unhe expose kiya. Matlab maine almost unka saath diya tha?']],
    faint: [['nikhil', 'Ek didi gir gayi. Garmi se. Sana didi aayi. Main bas paani le aaya. Pehli baar maine kuch useful kiya.']],
  },
  meera: {
    'bus-key': [['meera', 'CHABI. Tune chabi li aur maine record kiya. Ye reel hai. Ye MERI reel hai. Tu bas talent hai.']],
    chase: [lol('meera', 'Chase edit ready! Music: "doorbell baja ke bhaag gaya." Tu bas thoda aur tez bhaagta toh slow-mo mein achha aata.')],
    caught: [['meera', 'Tujhe pakda. Main record kar rahi thi. Main ab bhi kar rahi hoon. Sorry. Nahi, sach mein sorry. Par angle achha hai.']],
    'speaker-party': [['meera', 'CP DANCE FLOOR. Saath second. Uncle ka thumka. Aunty ka spin. Ye mera career hai. Mujhe bas yahi chahiye tha.']],
    'pester-career': [['meera', 'SSC advice reel! Teen constable, ek career counsellor. "Sarkari naukri ka sach" caption. Already baarah hazaar.']],
    'pester-cute': [lol('meera', '"Uncle aap cute ho." Uncle ka muskurana. Freeze frame. Thumbnail. Ho gaya. Bas ho gaya.')],
    'pester-cannon': [['meera', 'Tune unse cannon maanga?? Garmi mein? Ye log samjhenge nahi ki serious tha ya joke. Perfect content.']],
    'stone-thrown': [hush('meera', 'Pathar ka video mere paas hai. Main post nahi kar rahi. Abhi nahi. Pehli baar main soch rahi hoon.')],
    gas: [['meera', 'Lens pe dhuan. Aankh mein dhuan. Main kuch nahi dekh paa rahi par phone sab dekh raha hai. Weird hai.']],
    charge: [['meera', 'Ek constable ne mera phone dekha aur mujhe dekha. Maine phone neeche kiya. Pehli baar. Mujhe achha nahi laga.']],
    'cannon-dance': [lol('meera', 'Cannon dance! Patna wala trend! Hum Patna se aage nikal gaye! Caption: "Holi early this year."')],
    'detainees-escape': [['meera', 'Bus se sab bhaage aur maine sab record kiya. Hashtag "Jantar jailbreak". Nahi, ye bahut zyada hai. Theek hai, rakhti hoon.']],
    roast: [['meera', 'Kabir ka set! Megaphone pe! Maine vertical shoot kiya. Uske sar ka top kat gaya. Comedian ka sar kat jaata hai. Normal hai.']],
  },
  zoya: {
    'bus-key': [['zoya', 'Bus ki chabi? Tu? ...Theek hai. Maine nahi dekha. Maine sirf ye dekha ki bus ruki. Dono alag sach hain.']],
    'bus-stalled': [['zoya', 'Detention bus band. Log dhakka de rahe hain. Police bhi dhakka de rahi hai. Ek frame mein dono. Ye wala rakhungi.']],
    chase: [['zoya', 'Tu bhaaga aur main live thi. Chaudah hazaar logon ne tujhe bhaagte dekha. Tera kandha. Sirf kandha. Main protect karti hoon.']],
    caught: [['zoya', 'Kaun officer tha? Naam? Badge? Time? Bol, main likh rahi hoon. Abhi likha toh kal kaam aayega.']],
    'stone-thrown': [['zoya', 'Pathar kidhar se aaya? SUV wali side. Mere paas frame hai. Halka sa. Haath dikh raha hai. Shakal nahi.']],
    gas: [['zoya', 'Gas. Lens saaf karo. Aankh baad mein. Ye maine kisi se seekha tha. Achha nahi seekha.']],
    charge: [['zoya', 'Charge ka time note kiya? Chaar baj ke kitne? Kal sab alag time bolenge. Main ek bolungi. Sahi wala.']],
    'cannon-spray': [['zoya', 'Cannon chala. Kis par? Bheed par ya barricade par? Ye farak kal ka headline hai.']],
    'cannon-scare': [['zoya', 'Cannon ka forward jhootha tha aur log bhaag gaye. Afwaah ne cannon ka kaam kar diya. Bina paani ke.']],
    'biryani-rush': [lol('zoya', 'Biryani ke liye aadha Jantar CP gaya. Wahan sirf Asha ki chai. Main isko "logistics story" bolungi.')],
    'provocateur-exposed': [['zoya', 'Tune unka chehra dikhaya. Time stamp, location, cash. Ye... ye kaam hai. Ye asli kaam hai. Raw bhej.']],
    'minister-noshow': [['zoya', 'Minister nahi aaye. Mere paas Dev ka chehra hai jab unhe pata chala. Main woh frame use nahi karungi. Bahut personal hai.']],
    'detainees-escape': [['zoya', 'Bus khaali. Police ka statement aayega "koi detention hua hi nahi". Main frame save kar rahi hoon. Do jagah.']],
  },
  mira: {
    'speaker-party': [['mira', 'Mera speaker CP pe dance kar raha hai? Barah baje mera bhashan hai! ...Achha, gaana achha hai. Par barah baje.']],
    'bus-key': [['mira', 'Bus ki chabi? Aaj? Mere protest mein? Kal ke akhbaar mein "students ne bus churayi". Bhashan ke baad karta.']],
    chase: [['mira', 'Koi bhaag raha hai aur log hans rahe hain. Mujhe nahi pata hansun ya mic pe "shanti" bolun.']],
    caught: [['mira', 'Kisko pakda? Hamare logon mein se? Naam bolo. Main lawyer ka number rakhti hoon. Ek lawyer. Teen protest se.']],
    singalong: [lol('mira', 'Sab ek saath ga rahe the! Mera bhashan kisi ne yaad nahi rakha par gaana sab ko yaad hai. Theek hai. Achha hai.')],
    'stone-thrown': [hush('mira', 'Pathar. Hamare logon ka nahi tha. Main jaanti hoon. Kal koi nahi maanega. Main phir bhi bolungi.')],
    gas: [['mira', 'Sab baitho! Neeche! Neeche hawa saaf hai! ...Pata nahi saaf hai ya nahi. Par neeche baitho.']],
    charge: [['mira', 'Unhone hamare logon ko maara. Mere logon ko. Main mic pe thi. Mic se kuch nahi rukta.']],
    'cannon-dance': [['mira', 'Log cannon ke neeche naach rahe hain. Main serious protest karne aayi thi. ...Par ye bhi protest hai? Shayad.']],
    'minister-noshow': [['mira', 'Minister nahi aaye. Main hairaan nahi hoon. Dev hai. Mujhe Dev ke liye bura lag raha hai. Ye naya hai.']],
    'provocateur-exposed': [['mira', 'Woh log hamare nahi the. Tune dikhaya. Ab main mic pe bol sakti hoon aur log maanenge. Shukriya.']],
    faint: [['mira', 'Koi gira? Sana! Sana kahan hai? Paani! Sab hato, jagah do! ...Theek hai. Theek hai. Ye mera kaam hai.']],
  },
  dev: {
    'bus-key': [['dev', 'Chabi! Ye leverage hai! Bus hamari, chabi hamari. Main negotiate karta hoon. ...Kisse? Bus wale se?']],
    chase: [['dev', 'Bhaagna negotiation nahi hai. Par kabhi kabhi negotiation ka pehla step hai. Doosra step bhi.']],
    caught: [['dev', 'Kisko pakda? Main baat karta hoon. Main hamesha baat karta hoon. Woh kabhi nahi sunte. Par main karta hoon.']],
    'minister-noshow': [hush('dev', '...Nahi aaye. Main yahin khada tha. Saade teen se. Mujhe pata tha. Phir bhi khada tha.')],
    'stone-thrown': [['dev', 'Pathar! Ab woh bolenge humne phenka. Ab woh negotiation band kar denge. Jo shuru hi nahi hua tha.']],
    gas: [['dev', 'Gas. Main megaphone pe "shanti" bol raha tha. Gas ko megaphone sunai nahi deta.']],
    charge: [['dev', 'Lathi chali. Main beech mein tha. Mere kurte pe ek nishaan hai. Kal isko press conference mein pehnunga.']],
    'cannon-spray': [['dev', 'Paani. Mera kurta. Mera megaphone. Megaphone waterproof hai? Kal pata chalega.']],
    'cannon-dance': [['dev', 'Log naach rahe hain. Ye kya message hai? "Hum khush hain"? Hum khush nahi hain! ...Thoda hain.']],
    singalong: [['dev', 'Sab ek saath ga rahe hain. Teen group ek gaane pe. Ye coalition hai. Bina meeting ke. Main shocked hoon.']],
    'provocateur-exposed': [['dev', 'SUV wale bhaag gaye! Ab meri negotiation saaf hai. Ab main bol sakta hoon "hum shaant hain". Proof ke saath.']],
    roast: [['dev', 'Kabir ne MERE megaphone pe comedy ki. Log hase. Mujhe bhi hasi aayi. Ye mujhe pasand nahi aaya.']],
  },
};

// --- brush-offs once they have nothing new to say ------------------------------------------------

const BRUSHOFF = {
  kabir: [
    'Bhai ruk, notes app mein likh raha hoon. Haan, wahi. Nahi, padhne nahi dunga.',
    'Mummy ka "online" dikh raha hai. Main offline ho raha hoon. Emotionally.',
    'Ek second. Nahi, woh wala second nahi. Phone aa raha hai.',
    'Tu bol, main sun raha hoon. Main sun nahi raha. Main joke soch raha hoon.',
    'Agar koi poochhe main kahan hoon, main tuition mein hoon. Tu bhi.',
    'Bhai abhi mood nahi. Mood aayega. Comedians ka mood train jaisa hai, late.',
    'Maine bola tha aa raha hoon. Kahan aa raha hoon, woh nahi bola.',
    'Haan haan. Baad mein. Baad mein sab funny lagta hai.',
    'Tu itna paas kyun khada hai? Log sochenge hum sad boys hain.',
    'Shh. Ek uncle bahut funny baat bol rahe hain bina jaane.',
  ],
  nikhil: [
    'Update: main yahin hoon.',
    'Update: abhi bhi yahin.',
    'Haan? Main sun raha tha. Pehle wala bhi. Sab.',
    'Ek percent. Main phone ko dekh raha hoon jaise woh mujhe dekh raha hai.',
    'Main Kabir ke paas hoon. Ya Kabir mere paas hai. Same hai.',
    'Kuch nahi. Bas... sab bahut bada hai. Bheed. Aawaz. Sab.',
    'Update: ek kabootar ne mujhe dekha.',
    'Main theek hoon. Aap theek ho? Achha. Hum dono theek hain.',
    'Maine slogan yaad kiya. Kisi ne phir se bola nahi. Main wait kar raha hoon.',
    'Aapke peeche hoon. Ya aage? Aage nahi. Peeche.',
  ],
  meera: [
    'Shh, recording. Tu frame mein hai. Nahi hai. Ab hai. Hil mat.',
    'Mera storage full hai. Kabootar delete kar rahi hoon. Dukh ho raha hai.',
    'Abhi nahi, insights dekh rahi hoon. Reach gir gaya. Kabootar ke bina.',
    'Ek second, caption soch rahi hoon. "Ek second." Haan. Caption mil gaya.',
    'Tu bol, main voice note bana leti hoon. Baad mein sunungi. Nahi sunungi.',
    'Golden hour mein aana. Abhi light flat hai. Tu bhi flat lag raha hai.',
    'Comments padh rahi hoon. Ek ne "nice" likha. Bas "nice". Main ro dungi.',
    'Bhai battery atharah. Mujhe Zoya chahiye. Zoya ka power bank chahiye.',
    'Tera angle kal achha tha. Aaj nahi. Kal aana.',
    'Haan haan. Story pe daal dungi. Kya? Pata nahi. Kuch.',
  ],
  zoya: [
    'Live hoon. Side ho ja. Thoda aur. Haan.',
    'Baad mein. Abhi sirf woh bata jo dekha. Socha hua baad mein.',
    'Source? Nahi? Toh baad mein.',
    'Battery dekh rahi hoon. Battery bhi ek beat hai.',
    'Ek minute. Ek uncle frame mein haath hila rahe hain. Hamesha hota hai.',
    'Note kar rahi hoon. Time, jagah, kaun. Tu "kaun" mein nahi hai. Abhi.',
    'Usse pehle kya hua? Bas woh bata. Nahi pata? Theek hai.',
    'Ye frame achha hai. Context abhi bhi missing hai. Tu context nahi hai.',
    'Chaudah hazaar log dekh rahe hain. Tu unhe "hi" mat bolna.',
    'Mere paas paani hai, power bank hai, patience nahi hai. Chal.',
  ],
  mira: [
    'Mic pe mat bol. Mere ko bol. ...Kuch nahi? Theek hai.',
    'Haan, sabka point hai. Ek mic hai bas.',
    'Ek minute. Teen log ek saath mujhse kuch maang rahe hain.',
    'Paani pi liya? Pi le. Main sabko bol rahi hoon. Khud nahi piya.',
    'Agar tu kuch karne wala hai, mujhe mat bata. Mujhe baad mein pata chalna chahiye.',
    'Abhi nahi. Ek uncle ko samjha rahi hoon ki banner ulta hai.',
    'Shukriya ki tu aaya. Ye main sabko bol rahi hoon, par tujhe sach mein.',
    'Form mein mera naam hai. Toh jo bhi hoga, mere naam pe hoga. Sochna.',
    'Ruk. Kisi ne "saathiyon" bola? Main nahi thi. Achha hai, contagious hai.',
  ],
  dev: [
    'Abhi call pe hoon. Minister ke PA ke PA se. Hold pe.',
    'Baad mein. Teen group mein ek saath typing chal raha hai.',
    'Megaphone pe bata. Nahi, mere paas hai. Toh mujhe bata. Normal.',
    'Negotiation chal rahi hai. Kisse? Sabse. Kisi se nahi. Ek saath.',
    'Tu youth delegate hai? Nahi? Phir bhi. Baad mein.',
    'Ek minute, main ek forward ko teen alag shabdon mein likh raha hoon.',
    'Main busy dikh raha hoon. Isse kaam hota hai. Kabhi kabhi.',
    'Chai peeli? Main pandrah minute se chai pe hoon. Mann se.',
    'Abhi kuch confirm nahi hua. Kabhi nahi hota. Isliye main hoon.',
  ],
};

export default { TALKS, REACTS, BRUSHOFF };
