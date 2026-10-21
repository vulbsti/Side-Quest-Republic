// Chatter: people talking to each other that you overhear when you're within ~12 m of them.
// Format: plans/story-rebuild.md, "Conversations" (CHATTER). Played by story.js: an exchange plays once,
// only while every member of its cast is visible and near you, in one of its phases.
//
// Casts are grouped by where those people actually are at that hour in an idle day (rules.js routines):
//   metro      Meera (until 11:00), Zoya (until 10:20), Nikhil (while lost), Yadav c1 on the metro path
//   cp         Asha's stall (not 13:00–14:00), Ravi's chai (10:00–10:30, 11:15–11:40), Iqbal's chai breaks
//              (11:05–11:30, and from 13:40 on), Meera filming (11:00–12:00), Meena c2 at the CP post,
//              Dev's chai (14:15–14:45), Zoya charging (13:10–13:20)
//   stage      Mira, Dev, Sana, Ravi (from 10:40), Zoya (10:30–15:50), Kabir (11:05–13:40, later if he stays),
//              Meera (from 12:10), Asha (13:05–14:00), Rawat c4 (by the detention bus from 14:00)
//   midway     Tomar c3
//   barricade  Sharma, Kabir on the phone (13:45–14:00), Pandey r1 (from 14:00), Gill c5 at Parliament St.
//   the charge (about 15:50–16:10 in an idle day) pulls c1, c2, c3, c5 and r1 to one front together.

const X = (id, phase, place, cast, beats, requires) => {
  const c = { id, phase, cast, beats: beats.map(([who, line]) => ({ who, line })) };
  if (place) c.place = place;
  if (requires) c.requires = requires;
  return c;
};

const CHATTER = [
  // ---------------------------------------------------------------- morning (10–12)
  // metro
  X('ch-meera-zoya-metro', ['morning'], 'metro', ['meera', 'zoya'], [
    ['meera', 'Zoya di, aapka ring light kahan hai?'],
    ['zoya', 'Main journalist hoon, Meera. Mera ring light suraj hai.'],
    ['meera', 'Suraj ka angle bahut harsh hai aaj.'],
    ['zoya', 'Sach ka angle bhi harsh hota hai.'],
    ['meera', 'Ye caption main le rahi hoon.'],
  ]),
  X('ch-meera-nikhil-frame', ['morning'], 'metro', ['meera', 'nikhil'], [
    ['meera', 'Nikhil, thoda left. Nahi, mera left.'],
    ['nikhil', 'Tera left mera right hai na?'],
    ['meera', 'Bas pillar ke saamne khada ho. Tu aaj ka "lost first-timer" hai.'],
    ['nikhil', 'Main sach mein lost hoon.'],
    ['meera', 'Isliye toh authentic lag raha hai.'],
  ], { notFlags: ['nikhil-found'] }),
  X('ch-yadav-nikhil-way', ['morning'], null, ['c1', 'nikhil'], [
    ['nikhil', 'Sir, Jantar Mantar kidhar hai?'],
    ['c1', 'Seedha.'],
    ['nikhil', 'Seedha kahan tak?'],
    ['c1', 'Jab tak bheed na dikhe. Phir bheed ke peeche peeche.'],
    ['nikhil', 'Abhi bheed nahi hai.'],
    ['c1', 'Toh chai pi lo. Bheed aa jayegi. Hamesha aati hai.'],
  ], { notFlags: ['nikhil-found'] }),
  X('ch-yadav-meera-reel', ['morning'], null, ['c1', 'meera'], [
    ['meera', 'Uncle ek reel? Aap bas "aaj ka mausam garam hai" bol do.'],
    ['c1', 'Isse transfer hoga?'],
    ['meera', 'Transfer ka pata nahi, views pakka.'],
    ['c1', 'Views se Gurgaon nahi milta, beta.'],
  ]),
  X('ch-yadav-zoya-press', ['morning'], null, ['c1', 'zoya'], [
    ['zoya', 'Aaj kitni force hai yahan, sir? Roughly.'],
    ['c1', 'Roughly... mere paas chai ka order hai. Force ka nahi.'],
    ['zoya', 'Chai kitni?'],
    ['c1', 'Gyarah. Aur ek sugar free, Inspector saab ki.'],
    ['zoya', 'Gyarah plus ek. Note kar liya.'],
  ]),

  // cp
  X('ch-asha-ravi-speaker', ['morning'], 'cp', ['asha', 'ravi'], [
    ['asha', 'Ravi, speaker yahan chhod ke chai pe baith gaya? Speaker khud chal ke jayega?'],
    ['ravi', 'Didi bas paanch minute. Bluetooth bhi connect nahi ho raha.'],
    ['asha', 'Bluetooth ko bhi chai chahiye shayad.'],
    ['ravi', 'Hasna mat. Mira di dekh lengi toh mera bhi connection kat jayega.'],
  ]),
  X('ch-asha-iqbal-rishta', ['morning'], 'cp', ['asha', 'iqbal'], [
    ['asha', 'Iqbal bhai, beti ki baat kahan tak pahunchi?'],
    ['iqbal', 'Ladka engineer hai, didi. Software wala.'],
    ['asha', 'Software wale toh ghar se kaam karte hain. Ghar pe hi rahega, achha hai.'],
    ['iqbal', 'Ghar pe rahega toh mera remote kaun chalayega.'],
    ['asha', 'Chai thandi ho rahi hai. Rishta nahi.'],
  ]),
  X('ch-ravi-iqbal-lift', ['morning'], 'cp', ['ravi', 'iqbal'], [
    ['ravi', 'Bhaiya bus mein speaker le chaloge? Stage tak bas.'],
    ['iqbal', 'Bus stage nahi jaati, beta. Bus apne raaste jaati hai.'],
    ['ravi', 'Raaste mein stage hai na?'],
    ['iqbal', 'Raaste mein toh duniya hai. Chai khatam hone do, phir sochenge.'],
  ]),
  X('ch-meena-asha-chai', ['morning'], null, ['c2', 'asha'], [
    ['c2', 'Didi, ek chai. Kam cheeni.'],
    ['asha', 'Meena madam, aapke liye kam cheeni, baaki ke liye kam gossip?'],
    ['c2', 'Gossip poori. Cheeni kam.'],
    ['asha', 'Toh suno: barricade wale Sharma ji ne kal teesri baar SSC ka form bhara.'],
    ['c2', 'Teesri nahi. Chauthi. Teesri baar fees bhool gaye the.'],
  ]),
  X('ch-meena-meera-filming', ['morning'], null, ['c2', 'meera'], [
    ['c2', 'Mujhe film kar rahi ho?'],
    ['meera', 'Nahi madam! Background mein aa gaye bas.'],
    ['c2', 'Background mein bhi permission lagti hai.'],
    ['meera', 'Toh... permission hai?'],
    ['c2', '(halki si muskaan) Achha angle lena. Pichhli baar wale mein main moti lag rahi thi.'],
  ]),
  X('ch-meena-iqbal-timing', ['morning'], null, ['c2', 'iqbal'], [
    ['c2', 'Iqbal ji, bus kab nikalegi?'],
    ['iqbal', 'Chai ke baad, madam.'],
    ['c2', 'Aur chai kab khatam hogi?'],
    ['iqbal', 'Jab didi ki kahani khatam hogi.'],
    ['c2', 'Matlab shaam ko.'],
  ]),

  // stage
  X('ch-mira-dev-plan', ['morning'], 'stage', ['mira', 'dev'], [
    ['dev', 'Mira, coalition ke teen group bol rahe hain unka banner aage lagao.'],
    ['mira', 'Stage ka aage sirf ek hai, Dev.'],
    ['dev', 'Main bol dunga "rotation basis".'],
    ['mira', 'Har cheez rotation basis pe nahi hoti.'],
    ['dev', 'Coalition mein hoti hai.'],
  ]),
  X('ch-mira-ravi-soundcheck', ['morning'], 'stage', ['mira', 'ravi'], [
    ['ravi', 'Mic testing. Ek, do. Ek, do.'],
    ['mira', 'Teen bhi bol de, Ravi. Confidence aayega.'],
    ['ravi', 'Teen bolunga toh battery jaldi jayegi.'],
    ['mira', 'Phir ek, do hi theek hai.'],
  ]),
  X('ch-zoya-rawat-forward', ['morning'], null, ['zoya', 'c4'], [
    ['c4', 'Madam aapne dekha? Group mein aaya hai, aaj 5G se crowd control hoga.'],
    ['zoya', 'Sir, 5G se crowd control nahi hota.'],
    ['c4', 'Toh phir kis se hota hai?'],
    ['zoya', 'Aap se. Aap hi 5G ho, sir.'],
    ['c4', '(sochte hue) Ye bhi forward karne layak hai.'],
  ]),
  X('ch-sana-mira-water', ['morning'], 'stage', ['sana', 'mira'], [
    ['sana', 'Mira, ORS ke 40 packet hain. Bheed 400 aayi toh?'],
    ['mira', 'Har packet ko das hisson mein baant de.'],
    ['sana', 'Wo homeopathy ban jayegi.'],
    ['mira', 'Pani ka crate CP stop pe pada hai. Koi la de toh.'],
  ]),
  X('ch-dev-rawat-permission', ['morning'], null, ['dev', 'c4'], [
    ['dev', 'Sir, permission 12 se 5 ki hai. Paper dikhaun?'],
    ['c4', 'Paper toh sab dikhate hain. Asli paper kaunsa hai?'],
    ['dev', 'Yahi asli hai.'],
    ['c4', 'WhatsApp pe ek aur paper aaya hai. Usmein 12 se 3 likha hai.'],
    ['dev', 'Wo paper kisne bheja?'],
    ['c4', 'Group admin ne. Wo bahut pahunche hue hain.'],
  ]),
  X('ch-kabir-zoya-material', ['morning'], 'stage', ['kabir', 'zoya'], [
    ['kabir', 'Zoya di, ek line suno. "Mummy ko bola tuition ja raha hoon. Tuition ne bhi protest join kar liya."'],
    ['zoya', 'Hmm.'],
    ['kabir', '"Hmm" achha hai ya bura?'],
    ['zoya', 'Main journalist hoon. Main "hmm" pe opinion nahi deti.'],
  ]),
  X('ch-kabir-dev-megaphone', ['morning'], 'stage', ['kabir', 'dev'], [
    ['kabir', 'Dev bhaiya, megaphone do minute ke liye?'],
    ['dev', 'Kya bologe?'],
    ['kabir', 'Comedy. Halki si. Mood banane ke liye.'],
    ['dev', 'Mood banane ke liye megaphone nahi milta. Mood toh nahi, kaand ban jata hai.'],
  ]),
  X('ch-sana-kabir-hydrate', ['morning'], 'stage', ['sana', 'kabir'], [
    ['sana', 'Tumne paani piya subah se?'],
    ['kabir', 'Haan. Metro mein. Kisi aur ka.'],
    ['sana', 'Ye lo. Apna. Aur topi pehno.'],
    ['kabir', 'Topi se mera look kharab hoga.'],
    ['sana', 'Behosh hoke look aur kharab hoga.'],
  ]),
  X('ch-ravi-rawat-loudspeaker', ['morning'], null, ['ravi', 'c4'], [
    ['c4', 'Ye speaker kitna bajega?'],
    ['ravi', 'Jitna permission mein likha hai, sir.'],
    ['c4', 'Permission mein decibel nahi likha.'],
    ['ravi', 'Toh... thoda?'],
    ['c4', 'Thoda theek hai. Bahut thoda nahi. Woh suspicious lagta hai.'],
  ]),

  // midway and barricade
  X('ch-tomar-rawat-students', ['morning', 'midday'], null, ['c3', 'c4'], [
    ['c3', 'Rawat, ye bachche subah se ghoom kyun rahe hain? Line mein lagao sabko.'],
    ['c4', 'Kaunsi line, Tomar? Koi line hai hi nahi.'],
    ['c3', 'Toh line banao. Phir lagao.'],
    ['c4', 'Group mein aaya hai, aaj line banana mana hai. Section ke hisaab se.'],
    ['c3', 'Tumhara group hi section hai kya?'],
  ]),
  X('ch-sharma-gill-reels', ['morning'], null, ['sharma', 'c5'], [
    ['sharma', 'Gill. Phone mein kya hai?'],
    ['c5', 'Kuch nahi sir. Duty ka... update.'],
    ['sharma', 'Update mein gaana kyun baj raha hai?'],
    ['c5', 'Sir woh reel thi. Ek ladki ne constable se career advice li. Bahut viral hai.'],
    ['sharma', 'Career advice. (ruk ke) Kis constable se?'],
  ]),

  // ---------------------------------------------------------------- midday (12–14)
  X('ch-meera-kabir-speech', ['midday'], 'stage', ['meera', 'kabir'], [
    ['meera', 'Kabir aage se hat, Mira di frame mein nahi aa rahi.'],
    ['kabir', 'Main bhi movement ka hissa hoon.'],
    ['meera', 'Movement ka hissa side mein bhi khada ho sakta hai.'],
    ['kabir', 'Side mein khada hua toh mummy TV pe nahi pehchaanegi. Ye bhi theek hai.'],
  ]),
  X('ch-mira-dev-suv', ['midday'], 'stage', ['mira', 'dev'], [
    ['dev', 'Wo safed SUV kiski hai? Kisi ki permission list mein nahi hai.'],
    ['mira', 'Kisi ki toh hai, Dev.'],
    ['dev', 'Unse baat karun? Coalition mein le aaun?'],
    ['mira', 'Har cheez coalition nahi hoti. Kuch cheez sirf SUV hoti hai.'],
  ], { after: '12:30' }),
  X('ch-zoya-meera-viewers', ['midday'], 'stage', ['zoya', 'meera'], [
    ['meera', 'Kitne log dekh rahe hain aapka live?'],
    ['zoya', 'Teen hazaar.'],
    ['meera', 'Meri reel pe paanch hazaar.'],
    ['zoya', 'Teri reel mein speech kitni hai?'],
    ['meera', 'Chaar second. Baaki transition.'],
  ]),
  X('ch-asha-kabir-tab', ['midday'], 'stage', ['asha', 'kabir'], [
    ['asha', 'Kabir, teen chai ho gayi. Paise?'],
    ['kabir', 'Didi, likh lo. Shaam ko dunga.'],
    ['asha', 'Shaam ko tu tuition mein hoga, mummy ko bolke.'],
    ['kabir', 'Aapko kaise pata?'],
    ['asha', 'Mujhe sab pata hai. Isliye chai bechti hoon, news nahi.'],
  ]),
  X('ch-asha-sana-water-out', ['midday'], 'stage', ['asha', 'sana'], [
    ['sana', 'Didi, paani khatam. Aapke paas?'],
    ['asha', 'Chai ka paani hai. Garam.'],
    ['sana', 'Garmi mein garam paani?'],
    ['asha', 'Garam se garmi kat-ti hai. Meri nani kehti thi.'],
    ['sana', 'Aapki nani doctor thi?'],
    ['asha', 'Nani sab thi.'],
  ], { after: '13:00' }),
  X('ch-asha-rawat-biryani', ['midday'], 'stage', ['asha', 'c4'], [
    ['c4', 'Didi, suna hai ek baje free biryani aa rahi hai?'],
    ['asha', 'Kisne bola?'],
    ['c4', 'Group mein aaya.'],
    ['asha', 'Rawat ji, aapke group mein sab aata hai. Biryani kabhi nahi aati.'],
  ]),
  X('ch-dev-rawat-neta', ['midday'], null, ['dev', 'c4'], [
    ['c4', 'LJM ke neta ji aa rahe hain. Rasta khaali karwao.'],
    ['dev', 'Sir, permission humari hai. Rasta neta ji khud bana lenge, photographer ke saath.'],
    ['c4', 'Photographer ka bhi rasta chahiye.'],
    ['dev', 'Photographer ka rasta hamesha hota hai.'],
  ], { after: '12:50' }),
  X('ch-ravi-mira-volume', ['midday'], 'stage', ['ravi', 'mira'], [
    ['ravi', 'Di, volume thoda aur badhaun?'],
    ['mira', 'Kitna hai abhi?'],
    ['ravi', 'Saat.'],
    ['mira', 'Aur kitna ja sakta hai?'],
    ['ravi', 'Saat hi. Baaki knob toot gaya.'],
  ]),
  X('ch-sana-zoya-heat', ['midday'], 'stage', ['sana', 'zoya'], [
    ['sana', 'Zoya, tum teen ghante se dhoop mein ho.'],
    ['zoya', 'Story dhoop mein hi hai.'],
    ['sana', 'Story ke liye zinda rehna padta hai.'],
    ['zoya', 'Theek hai. Ek ghoont. On camera nahi.'],
  ]),
  X('ch-zoya-meena-charge', ['midday'], 'cp', ['zoya', 'c2'], [
    ['c2', 'Phone charge pe lagake chhod diya? Yahan?'],
    ['zoya', 'Didi dekh rahi hain, madam.'],
    ['c2', 'Didi sab dekhti hain. Isliye unhe sab pata hota hai. Isliye kuch bhi kho sakta hai.'],
    ['zoya', 'Ye warning thi ya tip?'],
    ['c2', 'Dono.'],
  ], { after: '13:05' }),
  X('ch-kabir-sharma-call', ['midday'], 'barricade', ['kabir', 'sharma'], [
    ['kabir', '(phone ko dekhte hue) Haan mummy... nahi mummy... tuition mein hi hoon...'],
    ['sharma', 'Tuition mein ho?'],
    ['kabir', '(phone dabake) Uncle please. Bas do minute.'],
    ['sharma', 'Do minute. (dheere se) Tuition mein bhi barricade hota hai kya.'],
  ], { after: '13:40' }),
  X('ch-sharma-gill-bikes', ['midday'], null, ['sharma', 'c5'], [
    ['c5', 'Sir, bike wale aa gaye. Tees bikes.'],
    ['sharma', 'Tees bikes.'],
    ['c5', 'Aur tees horn. Silencer ek bhi nahi.'],
    ['sharma', 'Silencer ek bhi nahi. (ruk ke) Challan ki book laye ho?'],
    ['c5', 'Sir aaj book nahi, sirf body cam hai.'],
    ['sharma', 'Toh body cam pe hi challan kaat do.'],
  ], { after: '12:30' }),
  X('ch-asha-meena-forward', ['midday'], null, ['c2', 'asha'], [
    ['asha', 'Madam, suna? Kisi ne bola teen baje pathar chalenge.'],
    ['c2', 'Kisne bola?'],
    ['asha', 'Rawat ji ke group mein aaya.'],
    ['c2', 'Toh teen baje Rawat ji ko chai pila dena. Group ka mood theek ho jayega.'],
  ], { before: '13:00' }),
  X('ch-asha-nikhil-kundli', ['morning', 'midday'], 'cp', ['asha', 'nikhil'], [
    ['asha', 'Pehli baar aaya hai na protest pe?'],
    ['nikhil', 'Aapko kaise pata, aunty?'],
    ['asha', 'Chappal naye hain, bag mein tiffin hai, aur phone ko aise pakda hai jaise wo saans le raha ho.'],
    ['nikhil', 'Teen percent hai.'],
    ['asha', 'Baith. Mere cart pe charger hai. Pehle chai, phir revolution.'],
  ], { notFlags: ['nikhil-found'] }),
  X('ch-asha-nikhil-lunch', ['midday', 'tense'], 'cp', ['asha', 'nikhil'], [
    ['nikhil', 'Aunty, mere dost stage pe hain shayad.'],
    ['asha', 'Shayad?'],
    ['nikhil', 'Unhone bola "stage pe aa". Stage kidhar hai, ye nahi bola.'],
    ['asha', 'Seedha jaa, jahan sabse zyada shor ho. Aur ye nimbu le ja. Kaam aayega.'],
    ['nikhil', 'Kis kaam?'],
    ['asha', 'Pata chal jayega. Chaar baje.'],
  ], { notFlags: ['nikhil-found'] }),

  // ---------------------------------------------------------------- tense (14–16)
  X('ch-sharma-pandey-litchi', ['tense'], 'barricade', ['sharma', 'r1'], [
    ['sharma', 'Kahan se ho?'],
    ['r1', 'Muzaffarpur.'],
    ['sharma', 'Muzaffarpur. Litchi wala.'],
    ['r1', 'Haan. Is mahine ghar pe litchi khatam ho gayi hogi.'],
    ['sharma', '(ruk ke) Agle saal.'],
    ['r1', 'Agle saal bhi yahin duty hogi, sir.'],
  ]),
  X('ch-pandey-sharma-cannon', ['tense'], 'barricade', ['r1', 'sharma'], [
    ['r1', 'Sir, bachche paani ki cannon maang rahe the. Sach mein?'],
    ['sharma', 'Sach mein. Garmi hai.'],
    ['r1', 'Hamare yahan bhi ek baar hua tha. Chhota bhai video mein tha. Naach raha tha.'],
    ['sharma', 'Naach raha tha.'],
    ['r1', 'Mummy ne bahut maara baad mein.'],
  ], { flags: ['cannon-requested'] }),
  X('ch-gill-pandey-reel', ['tense'], null, ['c5', 'r1'], [
    ['c5', 'Pandey, ye dekh. Subah wala reel. Teen constable, career counselling.'],
    ['r1', 'Duty pe phone?'],
    ['c5', 'Research hai. Bheed ko samajhna padta hai.'],
    ['r1', '(dekhte hue) ... Ye wala uncle toh Sharma sir hain.'],
    ['c5', 'Haan. Unko mat batana ki 40k views hain. Wo career badal lenge.'],
  ], { did: ['career-counselling'] }),
  X('ch-gill-pandey-home', ['tense'], null, ['c5', 'r1'], [
    ['c5', 'Pehli baar Delhi?'],
    ['r1', 'Teesri baar. Har baar barricade ke peeche se.'],
    ['c5', 'India Gate dekha?'],
    ['r1', 'Bus ki khidki se. Dhundhla tha.'],
  ]),
  X('ch-asha-iqbal-jail', ['tense'], 'cp', ['asha', 'iqbal'], [
    ['iqbal', 'Didi, meri bus ab jail ban gayi.'],
    ['asha', 'Bus ko pata hai?'],
    ['iqbal', 'Bus ko kuch nahi pata. Chabi ko pata hai. Chabi bhi unke paas.'],
    ['asha', 'Toh chai piyo. Chai pe kisi ka kabza nahi.'],
  ]),
  X('ch-dev-asha-coalition', ['tense'], 'cp', ['dev', 'asha'], [
    ['dev', 'Didi, chaar chai. Coalition meeting hai.'],
    ['asha', 'Coalition mein toh tum akele baithe ho.'],
    ['dev', 'Baaki teen group raaste mein hain.'],
    ['asha', 'Toh teen chai raaste mein bhej doon?'],
    ['dev', '(lambi saans) Ek chai.'],
  ]),
  X('ch-dev-iqbal-megaphone', ['tense'], 'cp', ['dev', 'iqbal'], [
    ['iqbal', 'Beta, tumhara bhonpu kahan hai?'],
    ['dev', 'Stage pe chhod aaya. Do minute ke liye.'],
    ['iqbal', 'Maine bhi chabi do minute ke liye hook pe chhodi thi. Subah.'],
    ['dev', '... Main abhi aata hoon.'],
  ]),
  X('ch-meena-iqbal-key', ['tense'], null, ['c2', 'iqbal'], [
    ['c2', 'Iqbal ji, subah aapki chabi gayi thi na?'],
    ['iqbal', 'Haan madam.'],
    ['c2', 'Kisne li?'],
    ['iqbal', 'Pata nahi madam. Bas itna pata hai, achhe bachche the.'],
    ['c2', '(note band karte hue) Achhe bachche. Haan. Ye hi likh deti hoon.'],
  ], { did: ['chabi'] }),
  X('ch-rawat-mira-bus', ['tense'], 'stage', ['c4', 'mira'], [
    ['mira', 'Sir, bus mein kitne log hain? Naam bata dijiye. Parents call kar rahe hain.'],
    ['c4', 'List banegi, madam.'],
    ['mira', 'Kab?'],
    ['c4', 'Jab printer aayega. Printer bhi bus mein hi hai.'],
  ]),
  X('ch-sana-mira-faint', ['tense'], 'stage', ['sana', 'mira'], [
    ['sana', 'Teen log chakkar kha chuke. Ek ladki ko CP tak bhejna padega.'],
    ['mira', 'Kaun le jayega?'],
    ['sana', 'Jo bhi abhi tak khada hai.'],
    ['mira', 'Toh hum dono.'],
  ]),
  X('ch-ravi-dev-megaphone', ['tense'], 'stage', ['ravi', 'dev'], [
    ['dev', 'Ravi, megaphone dekha? Yahin rakha tha.'],
    ['ravi', 'Bhaiya main speaker ka responsible hoon. Megaphone mera department nahi.'],
    ['dev', 'Department?'],
    ['ravi', 'Coalition mein sab ka department hota hai. Aap hi ne bola tha.'],
  ], { after: '14:45' }),
  X('ch-meera-rawat-family', ['tense'], null, ['meera', 'c4'], [
    ['c4', 'Beta, wo jo reel banai, mujhe bhej do. Family group mein daalunga.'],
    ['meera', 'Uncle usmein aap ho hi nahi.'],
    ['c4', 'Main peeche hoon. Bas peeche. Family pehchaan legi.'],
    ['meera', 'Caption kya doon?'],
    ['c4', '"Rawat ji duty pe, desh ki seva mein." Aur ek jhanda.'],
  ]),
  X('ch-tomar-rawat-badday', ['tense'], null, ['c3', 'c4'], [
    ['c3', 'Wo ladka phir mujhe dekh ke hasa.'],
    ['c4', 'Kaunsa?'],
    ['c3', 'Wahi. Subah wala. Uski shakal mein kuch hai.'],
    ['c4', 'Tomar, tumhe har shakal mein kuch dikhta hai.'],
    ['c3', 'Kyunki har shakal mein kuch hota hai.'],
  ], { after: '14:20' }),
  X('ch-kabir-mira-set', ['tense'], 'stage', ['kabir', 'mira'], [
    ['kabir', 'Di, 3:30 pakka? Do minute?'],
    ['mira', 'Do minute. Aur kisi ka naam nahi lena.'],
    ['kabir', 'Mummy ka bhi nahi?'],
    ['mira', 'Mummy ka toh bilkul nahi. Wo sun legi.'],
  ], { anyFlags: ['kabir-stays', 'nikhil-found'] }),
  X('ch-yadav-meena-transfer', ['tense', 'showdown'], null, ['c1', 'c2'], [
    ['c1', 'Meena, Gurgaon mein koi jagah khaali hai? Suna hai wahan AC thane hain.'],
    ['c2', 'AC thane mein AC nahi chalta, Yadav ji. Bas naam hai.'],
    ['c1', 'Naam se bhi thandak milti hai.'],
  ], { after: '15:45' }),

  // ---------------------------------------------------------------- showdown (16–17)
  // the charge brings the constables to one front
  X('ch-yadav-meena-charge', ['tense', 'showdown'], null, ['c1', 'c2'], [
    ['c2', 'Yadav ji, lathi ulti pakdi hai.'],
    ['c1', 'Mujhe pata hai.'],
    ['c2', 'Jaan boojh ke?'],
    ['c1', 'Ulti lathi se kam lagti hai. Chai wale ladke ko bhi lag sakti thi.'],
  ], { after: '15:45' }),
  X('ch-tomar-pandey-charge', ['tense', 'showdown'], null, ['c3', 'r1'], [
    ['c3', 'Pandey! Aage badho! Wo gali mein bhaag rahe hain!'],
    ['r1', 'Gali mein kuch nahi hai, sir. Dhuan hai.'],
    ['c3', 'Dhuan ke peeche?'],
    ['r1', 'Aur dhuan.'],
  ], { after: '15:45' }),
  X('ch-gill-meena-filming', ['tense', 'showdown'], null, ['c5', 'c2'], [
    ['c2', 'Gill, phone andar.'],
    ['c5', 'Madam evidence hai.'],
    ['c2', 'Evidence vertical mein nahi hota.'],
    ['c5', '... Horizontal kar deta hoon.'],
  ], { after: '15:45' }),
  X('ch-asha-iqbal-shutter', ['showdown'], 'cp', ['asha', 'iqbal'], [
    ['asha', 'Iqbal bhai, shutter neeche karo. Aadha.'],
    ['iqbal', 'Aadha kyun?'],
    ['asha', 'Poora karenge toh bachche andar kaise aayenge?'],
    ['iqbal', '(shutter kheench ke) Aao, aao. Andar baitho. Paani hai.'],
  ]),
  X('ch-sana-mira-gas', ['showdown'], 'stage', ['sana', 'mira'], [
    ['sana', 'Aankhon pe doodh mat daalo! Paani. Saaf paani!'],
    ['mira', 'Paani kahan se?'],
    ['sana', 'Jo bhi bacha hai. Aur bolo sabko, rub mat karo.'],
    ['mira', '(chillaake) Aankh mat ragdo! Paani lo, rub mat karo!'],
  ]),
  X('ch-dev-ravi-speaker-hide', ['showdown'], 'stage', ['dev', 'ravi'], [
    ['dev', 'Ravi, speaker!'],
    ['ravi', 'Stage ke neeche ghusa diya, bhaiya. Chadar daal di.'],
    ['dev', 'Aur tum?'],
    ['ravi', 'Main bhi neeche ja raha tha. Jagah nahi thi. Speaker bada hai.'],
  ]),
  X('ch-sharma-pandey-after-charge', ['showdown'], 'barricade', ['sharma', 'r1'], [
    ['r1', 'Ho gaya, sir?'],
    ['sharma', 'Ho gaya.'],
    ['r1', 'Kitne gaye bus mein?'],
    ['sharma', 'Ginti baad mein. (ruk ke) Paani piyo.'],
  ], { after: '16:10' }),
  X('ch-rawat-meera-delete', ['showdown'], null, ['c4', 'meera'], [
    ['c4', 'Beta, ye wala video delete karo.'],
    ['meera', 'Kyun uncle? Subah toh aap family group mein daal rahe the.'],
    ['c4', 'Subah wala rakh lo. Ye wala nahi. Isme main aage hoon.'],
    ['meera', 'Aap aage hi the.'],
    ['c4', 'Isliye.'],
  ]),

  // ---------------------------------------------------------------- aftermath (17–18)
  X('ch-sharma-pandey-call-home', ['aftermath'], 'barricade', ['sharma', 'r1'], [
    ['r1', 'Sir, ek call kar loon? Ghar.'],
    ['sharma', 'Kar lo.'],
    ['r1', '(phone pe) Haan Ma... haan, theek hoon... nahi, kuch nahi hua. Bas garmi thi.'],
    ['sharma', '(door dekhte hue) Bas garmi thi.'],
  ]),
  X('ch-asha-iqbal-count', ['aftermath'], 'cp', ['asha', 'iqbal'], [
    ['asha', 'Aaj kitni chai biki pata hai? Teen sau baaees.'],
    ['iqbal', 'Paise kitne aaye?'],
    ['asha', 'Do sau baaees ki.'],
    ['iqbal', 'Baaki sau?'],
    ['asha', 'Baaki sau bachchon ki thi. Wo ginti mein nahi aati.'],
  ]),
  X('ch-iqbal-asha-key-back', ['aftermath'], 'cp', ['iqbal', 'asha'], [
    ['iqbal', 'Didi, kisi ne chabi wapas di. Bina kuch bole. Haath mein rakh ke chala gaya.'],
    ['asha', 'Achha bachcha tha.'],
    ['iqbal', 'Subah wala hi tha shayad.'],
    ['asha', 'Subah wale shaam tak achhe ho jaate hain. Kabhi kabhi.'],
  ], { did: ['chabi'] }),
  X('ch-mira-dev-next', ['aftermath'], 'stage', ['mira', 'dev'], [
    ['dev', 'Kal phir?'],
    ['mira', 'Kal sabke ghar wale phone karenge.'],
    ['dev', 'Toh parson.'],
    ['mira', 'Parson. Aur speaker ka extra battery.'],
    ['dev', 'Aur megaphone ki rassi. Gale mein bandh ke rakhunga.'],
  ]),
  X('ch-sana-meera-tent', ['aftermath'], 'stage', ['sana', 'meera'], [
    ['meera', 'Sana di, aap ki ek photo? Aaj ki hero.'],
    ['sana', 'Photo nahi. Paani ki bottle ki photo le lo. Wo asli hero hai.'],
    ['meera', 'Caption: "real hero". Bottle ke saath.'],
    ['sana', 'Aur likhna, kal bhi chahiye.'],
  ]),
  X('ch-rawat-zoya-release', ['aftermath'], null, ['c4', 'zoya'], [
    ['zoya', 'Sir, mera phone. Jo bus mein liya tha.'],
    ['c4', 'Ye lo. Maine kuch nahi dekha.'],
    ['zoya', 'Screen pe aapka fingerprint hai.'],
    ['c4', 'Wo... garmi se aa gaya hoga.'],
  ], { after: '17:30' }),
  X('ch-meena-asha-last-chai', ['aftermath'], null, ['c2', 'asha'], [
    ['asha', 'Madam, aakhri chai. Kam cheeni.'],
    ['c2', 'Aaj poori cheeni, didi.'],
    ['asha', 'Itna bura din tha?'],
    ['c2', 'Itna lamba din tha.'],
  ]),
  X('ch-gill-pandey-reel-night', ['aftermath'], null, ['c5', 'r1'], [
    ['c5', 'Pandey, apna bhi ek reel banayein? Duty khatam.'],
    ['r1', 'Kya dikhayenge?'],
    ['c5', 'Sunset. Barricade. Thoda slow motion.'],
    ['r1', 'Barricade ke saath sunset. (halka sa haste hue) Ghar wale samjhenge picnic thi.'],
  ]),
  X('ch-tomar-rawat-report', ['aftermath'], null, ['c3', 'c4'], [
    ['c3', 'Report mein kya likhoon?'],
    ['c4', 'Likho "sthiti niyantran mein hai".'],
    ['c3', 'Kab se?'],
    ['c4', 'Hamesha se. Report mein hamesha se hoti hai.'],
  ]),
  X('ch-yadav-nikhil-home', ['aftermath'], null, ['c1', 'nikhil'], [
    ['nikhil', 'Sir, metro kidhar hai?'],
    ['c1', 'Subah tum yahin the na? Pillar ke paas?'],
    ['nikhil', 'Haan sir.'],
    ['c1', 'Toh wahi pillar. Uske peeche seedhi. Ghar jao. Chai pi ke.'],
  ]),
];

export default { CHATTER };
