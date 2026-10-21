// talks-locals: conversations, reactions and brush-offs for the people who live and work round the protest:
// Asha (chai, gossip hub), Sana (medical tent), Ravi (sound), Iqbal (shuttle) and Officer Sharma.
// Format: plans/story-rebuild.md, "Conversations". The engine is story.js: talk() plays the highest-priority
// unplayed conversation for the phase whose requires hold, then a REACT for a recent happening, then a BRUSHOFF.
// CHATTER and PESTER_BY live with the other writers.
//
// Where they are (rules.js SCHEDULE and update*):
//   asha   CP stall all day; 13:00-14:00 selling at the stage (ashaStage); back to the stall at 14:00.
//   sana   her tent by the stage all day. Water runs out at 13:00 unless the crate arrives (flag water-delivered).
//   ravi   CP chai till 10:30, carries the speaker to the stage; chai 11:15-11:40; the stage after that.
//   iqbal  driving (hidden) except chai breaks at ~11:00-11:30 and ~13:30-14:00; from 14:00 the shuttle is the
//          detention bus at Jantar and he is off duty at the CP chai stall.
//   sharma the barricade (Rao can send him to CP); RAF beside him from 14:00; the line at 15:00; charge at 16:00.

/** One conversation. `more` adds further nodes after the first ('a'). */
const talk = (id, phase, beats, options, { more = {}, ...extra } = {}) => ({
  id, ...(phase ? { phase: [].concat(phase) } : {}), start: 'a', ...extra,
  nodes: { a: { beats, options }, ...more },
});
const R = (who, line, react) => ({ who, line, react }); // a beat that wants a reaction on screen

// Flags this file sets and reads (all its own unless noted):
//   asha-regular, asha-udhaar, asha-covers-you, asha-suv-tip, asha-hideout, asha-knows-tuition, asha-kills-cannon
//   sana-runner, sana-has-water, promised-sana-water, gave-sana-bottle
//   ravi-playlist-90s, ravi-playlist-haryanvi, ravi-owes-you, ravi-unplugged-neta
//   iqbal-suspects-you, iqbal-forgets-key, iqbal-on-your-side (the bus-andar window route can read these)
//   sharma-knows-name, sharma-bus-ride
//   read from other content: sharma-tuition-teacher, sharma-bottle, sana-short-one, seen-as-chamcha,
//   cannon-requested, detain-me-done, name-in-register, sharma-done-with-you, water-delivered (= Sana has water)

// ----------------------------------------------------------------------------------------------------------
// ASHA: chai at the CP stop, twenty-five years, knows everything ten minutes before it happens.
// ----------------------------------------------------------------------------------------------------------
const asha = [
  // --- morning ---
  talk('asha-m-hello', 'morning', [
    ['asha', 'Chehra naya hai, chappal purani. Pehli baar protest?'],
    ['asha', 'Koi baat nahi. Pehli baar sab ko lagta hai revolution aaj hi hoga. Chai lo, revolution dedh baje tak aata hai.'],
  ], [
    {
      intent: 'Claim you already know everything about today',
      beats: [
        ['player', 'Aunty main sab jaanta hoon. Barah baje bhashan, phir bheed, phir...'],
        ['asha', 'Achha? Toh batao, Iqbal bhai ki beti ka rishta kahan tay hua?'],
        ['player', '...Rohini?'],
        R('asha', 'Rohini. Haaye. Ghaziabad. Chalo, chai piyo, padhai karo.', 'laugh'),
      ],
      effects: { aura: -2, mood: { asha: 'amused' } },
    },
    {
      intent: 'Buy a chai and ask her for the day, hour by hour',
      beats: [
        ['player', 'Ek chai. Aur aaj ka schedule.'],
        ['asha', 'Das rupaye chai, schedule free. Gyarah baje Iqbal bhai bus rokte hain, chabi hook pe latka ke chai peene aate hain.'],
        ['asha', 'Ravi apna kaala dabba stage pe le jaayega, phir chai ke liye wapas aayega, phir dabba bhool jaayega.'],
        ['asha', 'Aur Sharma ji barricade pe khade khade so jaate hain. Aankh khuli rakh ke. Talent hai.'],
      ],
      effects: { help: 2, flags: ['asha-regular'] },
    },
    {
      intent: 'Ask her to start a rumour for you',
      beats: [
        ['player', 'Aunty, ek baat failaani ho toh?'],
        R('asha', 'Failaani? Beta, mere stall pe baat failaani nahi padti. Bas bolni padti hai. Kya bolein?', 'silence'),
      ],
      next: 'whisper',
    },
  ], {
    priority: 1,
    more: {
      whisper: {
        beats: [['asha', 'Dhyan se. Jo yahan bolte ho, dus minute mein Jantar ko pata. Wapas nahi aata.']],
        options: [
          {
            intent: 'Free biryani at the CP stop (it empties the stage)',
            beats: [
              ['player', 'Bolo CP stop pe free biryani bat rahi hai.'],
              ['asha', 'Biryani. Veg ya non-veg?'],
              ['player', 'Pata nahi.'],
              R('asha', 'Dono bolungi. Zyada log aayenge.', 'laugh'),
            ],
            effects: { nuisance: 10, aura: 4 },
            do: ['rumour:biryani:stage'],
          },
          {
            intent: 'A water cannon is coming (nobody takes the shuttle)',
            beats: [
              ['player', 'Bolo water cannon aa raha hai Jantar pe.'],
              ['asha', 'Haaye. Ye wala toh sach bhi ho sakta hai. Aise wale sabse tez bhaagte hain.'],
            ],
            effects: { nuisance: 12 },
            do: ['rumour:cannon:cp'],
          },
          {
            intent: 'Lose your nerve and say nothing',
            beats: [
              ['player', 'Rehne do. Kuch nahi.'],
              ['asha', 'Kuch nahi bhi ek khabar hai. "Naya ladka aaya tha, kuch bolte bolte ruk gaya." Dus minute.'],
            ],
            effects: { aura: -3 },
          },
        ],
      },
    },
  }),
  talk('asha-m-iqbal', 'morning', [
    ['asha', 'Woh Iqbal bhai dekhe? Bus wale. Bhole hain. Chabi hook pe chhod dete hain jaise ghar ka darwaza.'],
    ['asha', 'Aur beti ke rishte ki baat chhed do toh bus, das minute duniya bhool jaate hain.'],
  ], [
    {
      intent: 'Ask how long exactly Iqbal forgets the world',
      beats: [
        ['player', 'Das minute pakka?'],
        ['asha', 'Ladke wale Gurgaon ke hain, toh pandrah. Gurgaon pe unka bahut gussa hai.'],
        ['asha', 'Kyun poochh rahe ho? Chabi ka kya karoge? ...Mat batao. Mujhe pata chal jaayega waise bhi.'],
      ],
      effects: { nuisance: 3 },
    },
    {
      intent: 'Tell her gossiping about his daughter is not okay',
      beats: [
        ['player', 'Aunty, unki beti ki baat aise sabko batana theek nahi.'],
        ['asha', 'Sabko? Maine sirf tumhe bataya. Aur Yadav ko. Aur Rawat ji ko, par woh toh forward kar dete hain, unka kya.'],
        ['asha', 'Achha theek hai. Tumhare saamne nahi bolungi. Peeche bolungi.'],
      ],
      effects: { help: 3, aura: -1 },
    },
    {
      intent: 'Trade her a secret: Kabir told mummy he is at tuition',
      beats: [
        ['player', 'Ek baat bataun? Mera dost Kabir ghar pe bol ke aaya hai tuition ja raha hai.'],
        R('asha', 'Haaye! Kaunsi tuition?', 'laugh'),
        ['player', 'Physics.'],
        ['asha', 'Physics walon ki mummy sabse tez hoti hain. Do baje tak phone aayega. Likh ke le lo.'],
      ],
      effects: { aura: 3, nuisance: 4, flags: ['asha-knows-tuition'] },
    },
  ]),
  talk('asha-m-chabi-after', 'morning', [
    ['asha', 'Tum. Haan, tum. Bus ka kissa sun liya maine. Poore CP ne sun liya.'],
    ['asha', 'Iqbal bhai abhi bhi rishte ki baat soch rahe hain, chabi ki nahi. Toh tumhara naam abhi kisi ne nahi liya. Abhi.'],
  ], [
    {
      intent: 'Brag about it a little',
      beats: [
        ['player', 'Haan woh... thoda mera kaam tha.'],
        ['asha', 'Thoda? Zoya waali ladki bol rahi thi "bus heist". Heist. Is stall pe pehli baar heist hua.'],
        R('asha', 'Abhi sabko bata deti hoon ki heist wala mera regular hai.', 'laugh'),
      ],
      effects: { aura: 6, heat: 6 },
    },
    {
      intent: 'Pay her to keep your name out of it',
      beats: [
        ['player', 'Aunty, mera naam mat lena. Pachaas ki chai le leta hoon.'],
        ['asha', 'Pachaas ki chai? Paanch chai? Akele piyoge?'],
        ['player', 'Sharma ji ko bhi pila dena.'],
        ['asha', 'Sharma ji ko meri chai free milti hai, woh ehsaan nahi maante. Theek hai. Naam nahi. Chehra bata dungi agar koi poochhe.'],
      ],
      effects: { heat: -6, help: -2, flags: ['asha-covers-you'] },
    },
    {
      intent: 'Ask what actually happened with the rishta',
      beats: [
        ['player', 'Waise rishta... hua?'],
        ['asha', 'Ladka CA hai. Teesri attempt. Iqbal bhai bolte hain "attempt nahi, shraddha dekho". Main bolti hoon result dekho.'],
        ['asha', 'Tum bhi kuch attempt kar rahe ho kya? Nahi? Chai thandi ho rahi hai.'],
      ],
      effects: { mood: { asha: 'amused' } },
    },
  ], { requires: { did: ['chabi'] }, priority: 6 }),
  talk('asha-m-key', null, [
    ['asha', 'Ye chabi kiski hai? Mat batao.'],
    ['asha', 'Mujhe pata hai. Hook pe pandrah saal se wahi chabi latakti hai, aur pandrah saal mein pehli baar kisi ke haath mein dekhi.'],
  ], [
    {
      intent: 'Keep it and ask her to stay quiet',
      beats: [
        ['player', 'Aunty, aapne kuch nahi dekha.'],
        ['asha', 'Maine kuch nahi dekha. Ye bhi ek khabar hai. "Asha ne kuch nahi dekha." Log samajh jaate hain.'],
      ],
      effects: { nuisance: 6, aura: 2 },
    },
    {
      intent: 'Drop it by the bus hook and let her cover for you',
      beats: [
        ['player', 'Aap bol dena hook ke neeche giri thi.'],
        ['asha', 'Hook ke neeche. Hawa se. CP ki hawa bahut shararti hai, sab jaante hain.'],
        ['asha', 'Jao rakh do. Main Iqbal bhai ko rishte ki ek aur kahani suna deti hoon, tab tak.'],
      ],
      effects: { help: 6, aura: -3, flags: ['asha-covers-you'] },
      do: ['drop:key:keyHook'],
    },
    {
      intent: 'Hide it in her sugar tin',
      beats: [
        ['player', 'Isko cheeni ke dibbe mein rakh do na.'],
        R('asha', 'Cheeni mein? Phir sab chai mein chabi ka swaad aayega. Lohe ka.', 'laugh'),
        ['asha', 'Nahi baba. Mera stall Switzerland hai. Neutral. Chai sabki.'],
      ],
      effects: { nuisance: 3 },
    },
  ], { requires: { holding: 'key' }, priority: 7 }),

  // --- midday ---
  talk('asha-d-suv', 'midday', [
    ['asha', 'Bheed badh rahi hai, dhanda bhi. Par woh safed gaadi dekhi? SUV. Shishe kaale.'],
    ['asha', 'Usme se ek aadmi nikla, das chai li, paise diye, chhutta nahi liya. Jo chhutta nahi leta, woh kuch aur de raha hota hai.'],
  ], [
    {
      intent: 'Laugh it off: rich people tip, that is all',
      beats: [
        ['player', 'Aunty, ameer log hain. Tip de diya.'],
        ['asha', 'Pachchees saal mein ameer log ne mujhe kabhi tip nahi diya. Ameer isliye ameer hain.'],
      ],
      effects: { aura: 1 },
    },
    {
      intent: 'Ask her who the man was, exactly',
      beats: [
        ['player', 'Kaisa dikhta tha?'],
        ['asha', 'Naye joote. Itne naye ki chal nahi pa raha tha. Aur haath mein ek bada thaila. Thaile se aur joote jhaank rahe the.'],
        ['asha', 'Dhai baje ke baad us gaadi ke paas jaana, dekhna. Par mera naam mat lena.'],
      ],
      effects: { help: 3, flags: ['asha-suv-tip'] },
    },
    {
      intent: 'Put a chai on credit, like Sharma does',
      beats: [
        ['player', 'Ek chai udhaar? Shaam ko de dunga.'],
        ['asha', 'Udhaar. Sharma ji ka chalees. Yadav ka saath. Ek LJM wala neta, 2019 se pandrah.'],
        R('asha', 'Tumhara naam likh rahi hoon. Register mein. Is register se koi nahi bachta, police register se bhi nahi.', 'laugh'),
      ],
      effects: { help: -1, flags: ['asha-udhaar'] },
    },
  ]),
  talk('asha-d-forward', 'midday', [
    ['asha', 'Phone mein kya aaya? Dikhao. Mere phone pe sirf "Good Morning" aate hain, woh bhi dopahar ko.'],
    ['asha', 'Aaj kuch bhi bologe, log maan lenge. Garmi mein dimaag pighalta hai, afwaah jamti hai.'],
  ], [
    {
      intent: 'Plant it: the minister comes to the barricade at 3:30',
      beats: [
        ['player', 'Bolo saade teen baje minister barricade pe milne aa rahe hain.'],
        ['asha', 'Minister? Kaunsa?'],
        ['player', 'Koi bhi.'],
        ['asha', 'Koi bhi wala sabse achha. Har koi apna wala soch lega.'],
      ],
      effects: { nuisance: 10, aura: 3 },
      do: ['rumour:minister:stage'],
    },
    {
      intent: 'Plant the water cannon scare at the stage',
      beats: [
        ['player', 'Stage pe bolo water cannon aa raha hai.'],
        ['asha', 'Stage pe? Bhari bheed mein? Beta, bhagdad mein meri kettle gir jaati hai.'],
        ['asha', 'Theek hai. Par main sirf "suna hai" bolungi. "Suna hai" mein koi case nahi banta.'],
      ],
      effects: { nuisance: 14, heat: 4 },
      do: ['rumour:cannon:stage'],
    },
    {
      intent: 'Ask her to kill the cannon forward going round',
      beats: [
        ['player', 'Aunty, woh water cannon wala forward jhooth hai. Aap bol do na sabko.'],
        ['asha', 'Jhooth? Pakka? Agar sach nikla toh meri izzat jayegi. Aur tumhari bhi, par tumhari kam hai.'],
        ['asha', 'Chalo. "Asha ne bola jhooth hai." Ye bhi dus minute mein pahunch jaata hai.'],
      ],
      effects: { help: 6, aura: -2, flags: ['asha-kills-cannon'] },
    },
  ], { priority: 1 }),
  talk('asha-d-stage', 'midday', [
    ['asha', 'Stage pe chai double rate. Bhashan sunke log pyaase hote hain, aur Mira didi lamba bolti hain.'],
    ['asha', 'Woh Sana bitiya ka tent dekha? Ladki subah se khadi hai. Kisi ne usko chai nahi poochhi.'],
  ], [
    {
      intent: 'Point out that double rate is a bit much',
      beats: [
        ['player', 'Double rate thoda zyada nahi?'],
        ['asha', 'Kettle bhi double bhaari hai. Ek baje ki dhoop mein uthao, phir bolna.'],
      ],
      effects: { aura: 1, mood: { asha: 'annoyed' } },
    },
    {
      intent: 'Pay for a kettle of chai for Sana\'s tent',
      beats: [
        ['player', 'Sana ke tent pe ek kettle bhej do. Mere khaate mein.'],
        ['asha', 'Tumhare khaate mein? Tumhara khaata hai?'],
        ['player', 'Abhi khola.'],
        R('asha', 'Achha ladka hai. Bekaar mein naya hai.', 'laugh'),
      ],
      effects: { help: 6, aura: -1, mood: { sana: 'grateful' } },
    },
    {
      intent: 'Ask her what the crowd says about you',
      beats: [
        ['player', 'Mere baare mein kuch bol rahe hain log?'],
        ['asha', 'Bol rahe hain ek ladka subah se ghoom raha hai, sabse baat kar raha hai, kuch kar nahi raha.'],
        ['asha', 'Kuch karoge toh kuch aur bolenge. Waise ye wala bhi bura nahi hai.'],
      ],
      effects: { aura: -1 },
    },
  ]),
  talk('asha-d-afwaah-after', 'midday', [
    ['asha', 'Dekha? Ek forward ne poora bazaar hila diya. Rawat ji abhi bhi phone mein ghuse hain.'],
    ['asha', 'Pachchees saal mein seekha hai: sach jootey pehen raha hota hai, afwaah tab tak Gurgaon pahunch jaati hai.'],
  ], [
    {
      intent: 'Ask her to teach you how a rumour travels',
      beats: [
        ['player', 'Sikhao na. Kaise chalti hai?'],
        ['asha', 'Pehle chai wale ko batao. Phir auto wale ko. Phir kisi uncle ko jo bole "maine toh pehle hi bola tha".'],
        ['asha', 'Uncle ke baad rokna mumkin nahi.'],
      ],
      effects: { aura: 2, nuisance: 2 },
    },
    {
      intent: 'Tell her you are done with rumours for today',
      beats: [
        ['player', 'Bas. Aaj ke liye bahut afwaah.'],
        ['asha', 'Tum done ho. Afwaah done nahi hai. Woh tumhare bina bhi chalegi. Yahi toh mazaa hai.'],
      ],
      effects: { help: 2, aura: -1 },
    },
  ], { requires: { did: ['afwaah'] }, priority: 5 }),

  // --- tense ---
  talk('asha-t-joote', 'tense', [
    ['asha', 'Aaj mere stall pe sabne naye joote pehne hain aur kisi ke paas chai ke paise nahi. Ye kaisa garib hai jiske joote itne chamakte hain?'],
    ['asha', 'Ek bol raha tha "teen baje". Main samjhi chai ka order. Woh chai ka order nahi tha.'],
  ], [
    {
      intent: 'Tell her to mind her own stall',
      beats: [
        ['player', 'Aunty, aap kyun pange le rahi ho? Apna stall dekho.'],
        R('asha', 'Stall hi toh dekh rahi hoon. Pathar chalega toh pehli kettle meri tootegi.', 'silence'),
      ],
      effects: { aura: 2, help: -2 },
    },
    {
      intent: 'Get her to warn the stage: stones at three',
      beats: [
        ['player', 'Aap stage pe bol do. Teen baje kuch hone wala hai, koi ulta seedha na kare.'],
        ['asha', 'Ye wala sach hai na? Sach failana mushkil hota hai. Koi forward nahi karta.'],
        ['asha', 'Theek hai. Main bolungi "Asha ko pakka pata hai". Is line pe log ruk jaate hain.'],
      ],
      effects: { help: 8, heat: 4 },
      do: ['intensity:-1'],
    },
    {
      intent: 'Ask her which of them looked the most nervous',
      beats: [
        ['player', 'Unme se sabse ghabraaya hua kaun tha?'],
        ['asha', 'Patla wala. Chashma. Chai mein teen baar cheeni daali aur phir bhi meethi nahi lagi. Darr meetha nahi hone deta.'],
        ['asha', 'Woh SUV ke peeche khada hai. Agar usse baat karoge toh shayad...'],
      ],
      effects: { flags: ['asha-suv-tip'] },
    },
  ], { priority: 2 }),
  talk('asha-t-hideout', 'tense', [
    ['asha', 'Barricade lag gaye. Har saal lagte hain. Har saal pehle mere stall ke aage.'],
    ['asha', 'Agar kuch ho jaaye, aur hoga, toh stall ke peeche tirpal hai. Do log aa jaate hain. Teen agar dost hain.'],
  ], [
    {
      intent: 'Say you do not plan on hiding from anything',
      beats: [
        ['player', 'Main chhupne nahi aaya.'],
        ['asha', 'Koi nahi aata. Phir aa jaate hain. 2012 mein ek neta ji ne do ghante tirpal ke neeche bhajan gaaya tha.'],
      ],
      effects: { aura: 3 },
    },
    {
      intent: 'Book the spot behind the stall for yourself',
      beats: [
        ['player', 'Ek seat book kar do. Mere liye.'],
        ['asha', 'Book. Advance mein chai lo. Tirpal ke neeche chai mehngi hai, wahan AC hai. Jhooth. Wahan bhi garmi hai.'],
      ],
      effects: { help: -1, heat: -4, flags: ['asha-hideout'] },
    },
    {
      intent: 'Ask her to save the spot for your friends',
      beats: [
        ['player', 'Mere liye nahi. Mere dost, Nikhil aur Kabir. Agar woh aayein toh unko rakh lena.'],
        ['asha', 'Woh chashme wala jo ek pillar ko landmark bolta hai? Haan. Usko main pakad ke rakhungi.'],
      ],
      effects: { help: 5, flags: ['asha-hideout'] },
    },
  ]),
  talk('asha-t-iqbal-bus', 'tense', [
    ['asha', 'Iqbal bhai ko dekho. Subah tak shuttle, ab "detention bus". Wahi bus, wahi seat, naam badal gaya.'],
    ['asha', 'Bechare idhar baithe hain, chai ke saath. Chabi phir se hook pe chhod aaye. Aadat.'],
  ], [
    {
      intent: 'Note that you never heard her say that',
      beats: [
        ['player', 'Maine kuch nahi suna.'],
        ['asha', 'Tumne kuch nahi suna. Main kuch nahi boli. Chabi wahi hai jahan thi. Sab normal hai.'],
      ],
      effects: { nuisance: 2 },
    },
    {
      intent: 'Ask her to keep Iqbal talking if friends get picked up',
      beats: [
        ['player', 'Agar mere dost bus mein gaye, aap Iqbal bhai ko yahan baatein karwate rehna?'],
        ['asha', 'Rishte ki kahani ka part two hai mere paas. Ladka ab CA nahi, MBA kar raha hai. Do ghante chalegi.'],
      ],
      effects: { help: 4, flags: ['iqbal-on-your-side'] },
    },
  ], { requires: { after: '14:00' } }),

  // --- showdown ---
  talk('asha-s-gas', 'showdown', [
    R('asha', 'Idhar! Idhar aao! Aankh mein lagi? Malo mat. Malo mat!', 'cut'),
    ['asha', 'Ye lo neembu. Soongho. Chai mat piyo, abhi nahi, baad mein. Baad mein free.'],
  ], [
    {
      intent: 'Take the lemon and run straight back in',
      beats: [
        ['player', 'Thanks aunty, main wapas jaata hoon!'],
        R('asha', 'Wapas? Pagal hai! ...Achha jao. Dusra neembu bhi le lo. Kisi aur ko dena.', 'silence'),
      ],
      effects: { aura: 6, heat: 6, help: 2 },
    },
    {
      intent: 'Duck behind her stall until it passes',
      beats: [
        ['player', 'Main thodi der... yahin.'],
        ['asha', 'Tirpal ke neeche. Kettle se door. Haan, wahi. Saans lo. Ginti karo. Main gin rahi hoon, tum bhi gino.'],
      ],
      effects: { heat: -10, aura: -4 },
    },
    {
      intent: 'Get her to shout to everyone to sit, not run',
      beats: [
        ['player', 'Aunty sabko bolo baith jao! Bhaago mat!'],
        R('asha', 'BAITH JAO SAB! BHAAGOGE TOH GIROGE! BAITHO!', 'cut'),
        ['asha', 'Pachchees saal se "chai garam" chilla rahi hoon. Awaaz ka koi muqabla nahi.'],
      ],
      effects: { help: 8, heat: 4 },
      do: ['stance:hold', 'intensity:-1'],
    },
  ], { priority: 1 }),
  talk('asha-s-kettle', 'showdown', [
    ['asha', 'Pachchees saal. Pachchees saal mein pehli baar kisi ne meri kettle pe lathi maari.'],
    ['asha', 'Dent pad gaya. Yahan. Dekho. Ab ye kettle "andolan wali" kehlayegi.'],
  ], [
    {
      intent: 'Film the dented kettle for the feed',
      beats: [
        ['player', 'Ek video bana loon? Kettle ka?'],
        ['asha', 'Bana lo. Caption likhna "Asha di ki kettle ne bhi lathi khaayi". Aur stall ka naam. Asha Tea Point. Point ke saath.'],
      ],
      effects: { aura: 5, heat: 3 },
    },
    {
      intent: 'Help her pack up the stall before the next wave',
      beats: [
        ['player', 'Chalo, stall samet lete hain.'],
        ['asha', 'Samet? Stall samet lenge toh log kahan aayenge? Dhanda nahi, beta, ye adda hai. Adda khula rehta hai.'],
        ['asha', 'Bas glass utha lo. Glass toot jaate hain, adda nahi.'],
      ],
      effects: { help: 5, heat: -3 },
    },
  ]),
  talk('asha-s-friends', 'showdown', [
    ['asha', 'Teen bachche us taraf bhaage. Ek ne mere stall se biscuit utha liya. Bhaagte bhaagte. Respect.'],
    ['asha', 'Ek chashme wala bhi tha. Phone pe kuch type kar raha tha, chal nahi raha tha. Tumhara hai kya?'],
  ], [
    {
      intent: 'Shrug: everyone looks like Nikhil today',
      beats: [
        ['player', 'Aaj sab Nikhil jaise dikh rahe hain.'],
        ['asha', 'Sab Nikhil jaise. Matlab sab khoye hue. Haan, ye sach hai.'],
      ],
      effects: { aura: 1 },
    },
    {
      intent: 'Ask her to spread word that friends meet at the metro',
      beats: [
        ['player', 'Aunty, bolo sab dost Metro gate pe milein. Jisko bhi dikhe.'],
        ['asha', 'Metro gate. Dus minute mein sab ko pata. Par jo phone dekh raha hai, usko kabhi kuch pata nahi chalta.'],
      ],
      effects: { help: 6, flags: ['asha-metro-meetup'] },
    },
  ]),

  // --- aftermath ---
  talk('asha-a-ledger', 'aftermath', [
    ['asha', 'Aaj ka hisaab. Teen sau chalees chai. Chalees udhaar. Ek kettle shaheed. Neembu: saare.'],
    ['asha', 'Aur ek naya regular. Tum. Bas thoda kam bolo, zyada piyo.'],
  ], [
    {
      intent: 'Pay off Sharma\'s chai debt as a joke',
      beats: [
        ['player', 'Sharma ji ke chalees main de deta hoon.'],
        R('asha', 'Haaye. Unko batana mat. Unki izzat chalees rupaye ki hai, aur woh bhi udhaar.', 'laugh'),
      ],
      effects: { help: 4, mood: { sharma: 'amused' } },
    },
    {
      intent: 'Settle your own udhaar before you go',
      requires: { flags: ['asha-udhaar'] },
      beats: [
        ['player', 'Mera udhaar. Das rupaye.'],
        ['asha', 'Yaad tha tumhe? Register mein pehla aadmi jisne khud yaad dilaya. Ye bhi dus minute mein sabko pata.'],
      ],
      effects: { help: 6, aura: 2 },
    },
    {
      intent: 'Tell her the chai was, honestly, not that good',
      beats: [
        ['player', 'Sach bataun? Chai thodi... kamzor thi.'],
        ['asha', 'Kamzor. Aaj? Aaj toh sab kamzor tha, beta. Kal aana. Kal ki chai mazboot hogi. Kal ki khabar bhi.'],
      ],
      effects: { aura: 3, mood: { asha: 'annoyed' } },
    },
  ]),
  talk('asha-a-version', 'aftermath', [
    ['asha', 'Kal subah tak aaj ki kahani badal jaayegi. Pehle main sunaungi, phir Rawat ji, phir koi uncle.'],
    ['asha', 'Tumhara version kaunsa chahiye? Abhi bata do. Kal mere haath mein nahi.'],
  ], [
    {
      intent: 'The hero version, please',
      beats: [
        ['player', 'Hero wala.'],
        ['asha', 'Hero. Theek. "Ek ladka aaya, akele poora Jantar sambhal liya." Thoda zyada hai. Log maan lenge.'],
        ['asha', 'Police bhi maan legi. Unko bhi hero chahiye. Case ke liye.'],
      ],
      effects: { aura: 8, heat: 8 },
    },
    {
      intent: 'The boring version: you were never here',
      beats: [
        ['player', 'Main yahan tha hi nahi.'],
        R('asha', 'Tha hi nahi. Ye sabse mushkil kahani hai. Par tumhare liye. Ek chai ke badle.', 'silence'),
      ],
      effects: { heat: -8, aura: -4 },
    },
    {
      intent: 'Ask for the true version, nothing added',
      beats: [
        ['player', 'Jo hua wahi bolna.'],
        ['asha', 'Jo hua wahi? Beta, jo hua usme koi masala nahi. Koi nahi sunega.'],
        ['asha', '...Theek hai. Ek baar. Tumhare liye. Sach. Phir uncle log uska kuch bhi banayein.'],
      ],
      effects: { help: 4 },
    },
  ]),
  talk('asha-a-covered', 'aftermath', [
    ['asha', 'Dekha? Poore din kisi ne tumhara naam nahi liya. Chehra bhi nahi.'],
    ['asha', 'Rawat ji poochh rahe the, "chabi wala ladka kaun?" Maine bola woh toh Ghaziabad ka tha. Rohini wala Ghaziabad.'],
  ], [
    {
      intent: 'Thank her properly',
      beats: [
        ['player', 'Thank you aunty. Sach mein.'],
        ['asha', 'Thank you mat bolo. Kal aana. Chai lena. Dusron ko batana yahan ki chai sabse achhi hai. Ye jhooth mere liye bolna.'],
      ],
      effects: { help: 3, heat: -3 },
    },
    {
      intent: 'Ask what it cost her',
      beats: [
        ['player', 'Aapko kuch hua toh nahi?'],
        ['asha', 'Rawat ji ab mere stall pe chai nahi peeyenge. Do din. Teesre din aa jaayenge. Unke ghar ki chai unki biwi banati hai.'],
      ],
      effects: { help: 2 },
    },
  ], { requires: { flags: ['asha-covers-you'] }, priority: 5 }),
];

// ----------------------------------------------------------------------------------------------------------
// SANA: medical volunteer. One tent, one table, one crate of water that is always somewhere else.
// ----------------------------------------------------------------------------------------------------------
const sana = [
  // Whenever the crate finally arrives, she says so first (flag water-delivered = Sana has water).
  talk('sana-water-arrived', null, [
    R('sana', 'Paani! Paani aa gaya! Pura crate!', 'laugh'),
    ['sana', 'Pata hai maine subah se kitni baar "paani" bola? Ab ek baar "thank you" bolti hoon.'],
  ], [
    {
      intent: 'Act like it was nothing',
      beats: [
        ['player', 'Arre, kuch nahi tha.'],
        ['sana', 'Kuch nahi tha? Pachchees litre. Kuch nahi. Achha. Toh agle round mein ORS bhi kuch nahi hoga.'],
      ],
      effects: { aura: 2, flags: ['sana-has-water'] },
    },
    {
      intent: 'Ask if you can have a bottle yourself',
      beats: [
        ['player', 'Ek bottle mujhe bhi?'],
        ['sana', 'Pehli bottle tumhari. Doosri us uncle ki jo subah se chhaata pakad ke khada hai. Teesri kisi ki nahi, ginti ho rahi hai.'],
      ],
      effects: { help: 2, flags: ['sana-has-water'] },
    },
  ], { requires: { flags: ['water-delivered'] }, priority: 9 }),

  // --- morning ---
  talk('sana-m-crate', 'morning', [
    ['sana', 'Haan? Chakkar aa raha? Nahi? Toh line mat lagao, abhi koi line nahi hai, par aadat mat daalo.'],
    ['sana', 'Mera problem simple hai. Mera paani CP stop pe pada hai. Main yahan hoon. Shuttle saade barah ke baad laayega. Shayad.'],
  ], [
    {
      intent: 'Ask why she cannot just go and get it',
      beats: [
        ['player', 'Aap khud kyun nahi le aate?'],
        ['sana', 'Kyunki main gayi aur kisi ko chakkar aaya, toh tent pe kaun hai? Volini ki tube?'],
        ['sana', 'Aur woh crate pachchees kilo ka hai. Main pachchees kilo ka kuch nahi uthati. Apna bag bhi nahi.'],
      ],
      effects: { mood: { sana: 'annoyed' } },
    },
    {
      intent: 'Promise to bring the crate yourself',
      beats: [
        ['player', 'Main le aata hoon. Pakka.'],
        ['sana', 'Pakka. Subah se teen logon ne "pakka" bola hai. Ek reel bana raha hai, ek Kabir hai, ek ka phone band.'],
        R('sana', 'Theek hai. Chauthe pakke pe vishwas.', 'silence'),
      ],
      effects: { help: 3, flags: ['promised-sana-water'] },
    },
    {
      intent: 'Sign up as her runner for the day',
      beats: [
        ['player', 'Aapko runner chahiye? Main free hoon.'],
        ['sana', 'Free koi nahi hota. Ye lo. ORS ke bees packet. Gin ke dena, ek ek. Jo do maange usko bolna "doctor ne mana kiya hai".'],
        ['player', 'Aap doctor ho?'],
        ['sana', 'Second year. Aaj ke liye doctor.'],
      ],
      effects: { help: 6, aura: -2, flags: ['sana-runner'] },
    },
  ], { priority: 1 }),
  talk('sana-m-kit', 'morning', [
    ['sana', 'Ye mera kit hai. ORS. Volini. Do patti. Ek kela. Ek paracetamol ki strip jo 2023 mein expire hui.'],
    ['sana', 'Kela kisi ka nahi hai. Kela emergency ke liye hai.'],
  ], [
    {
      intent: 'Make fun of the expired strip',
      beats: [
        ['player', '2023? Ye toh protest se bhi purani hai.'],
        ['sana', 'Haan. Isko bhi permission nahi mili thi. Phir bhi aa gayi.'],
      ],
      effects: { aura: 2, mood: { sana: 'amused' } },
    },
    {
      intent: 'Ask for a plaster for your chappal blister',
      beats: [
        ['player', 'Ek patti milegi? Chappal kaat rahi hai.'],
        ['sana', 'Pehla patient! Chappal se. Revolution ka pehla zakhm. Likh rahi hoon. "Chappal, dayan pair."'],
      ],
      effects: { help: -1, aura: -1 },
    },
    {
      intent: 'Donate your own water bottle to the tent',
      beats: [
        ['player', 'Ye lo, meri bottle. Aadhi bhari hai.'],
        ['sana', 'Aadhi bhari. Ya aadhi khaali? Dono mein kaam aayegi. Thanks.'],
        ['sana', 'Ab tumhe pyaas lagi toh tumhe mere paas aana padega. Tumhari hi bottle ke liye. Smart nahi tha ye.'],
      ],
      effects: { help: 5, flags: ['gave-sana-bottle'] },
    },
  ]),
  talk('sana-m-crowd', 'morning', [
    ['sana', 'Abhi bheed kam hai. Barah baje Mira didi bolengi, tab double. Do baje dhoop mein log girenge. Ye forecast hai, dhamki nahi.'],
  ], [
    {
      intent: 'Tell her she is being dramatic',
      beats: [
        ['player', 'Thoda zyada nahi soch rahe?'],
        R('sana', 'Pichhli baar maine kam socha tha. Ek uncle ne mere kandhe pe bhashan suna. Behosh ho ke.', 'silence'),
      ],
      effects: { aura: 1, mood: { sana: 'annoyed' } },
    },
    {
      intent: 'Ask what to look for when someone is about to faint',
      beats: [
        ['player', 'Pehle se kaise pata chale ki koi girega?'],
        ['sana', 'Pasina band ho jaata hai. Ya woh bahut zyada haan-haan karte hain. Ya "main theek hoon" bolte hain bina poochhe.'],
        ['sana', 'Agar koi bina poochhe "main theek hoon" bole, mere paas laao.'],
      ],
      effects: { help: 3 },
    },
  ]),

  // --- midday ---
  talk('sana-d-countdown', 'midday', [
    ['sana', 'Status update. Chaar bottle bachi hain. Mira didi abhi "paani ka adhikaar" pe bol rahi hain. Irony mujhe pyaas laga rahi hai.'],
  ], [
    {
      intent: 'Tell her the shuttle is surely bringing it',
      beats: [
        ['player', 'Shuttle la raha hoga.'],
        ['sana', 'La raha hoga. Ye "hoga" mujhe bahut pasand hai. Iske neeche sab chhup jaata hai.'],
      ],
      effects: { aura: 1 },
    },
    {
      intent: 'Ration it: split the four bottles into cups',
      beats: [
        ['player', 'Chaar bottle ko glass mein baant do. Ek ghoont sabko.'],
        ['sana', 'Ek ghoont. Haan. Isse koi bachega nahi, par sab ko lagega kisi ne poochha.'],
        ['sana', 'Glass Asha aunty se le aao. Woh glass ka bhi hisaab rakhti hain, dhyan rakhna.'],
      ],
      effects: { help: 5, nuisance: 1 },
    },
  ], { requires: { before: '13:00', notFlags: ['water-delivered', 'sana-has-water'] }, priority: 2 }),
  talk('sana-d-out', 'midday', [
    ['sana', 'Khatam. Last bottle ek bachche ko di. Usne aadhi pi, aadhi apne dost pe daali. Masti mein.'],
    ['sana', 'Ab mere paas sirf dua hai. Aur kela.'],
  ], [
    {
      intent: 'Offer her the emergency banana back as a joke',
      beats: [
        ['player', 'Kela kha lo, energy aayegi.'],
        ['sana', 'Kela emergency ke liye hai. Ye emergency ki shuruaat hai, emergency nahi. Farq hota hai.'],
      ],
      effects: { aura: 1 },
    },
    {
      intent: 'Go round the stage telling people to sit in the shade',
      beats: [
        ['player', 'Main sabko bolta hoon chhaon mein baitho.'],
        ['sana', 'Haan. Tree ke neeche, tent ke peeche, kisi lambe aadmi ke peeche. Sab chalega.'],
        ['sana', 'Kuch log hat jaayenge stage se. Mira didi naraz hongi. Main unse baat kar lungi.'],
      ],
      effects: { help: 6 },
      do: ['crowd:stage:-2', 'intensity:-1'],
    },
  ], { requires: { after: '13:00', notFlags: ['water-delivered', 'sana-has-water'] }, priority: 2 }),
  talk('sana-d-promise', 'midday', [
    R('sana', 'Tumne bola tha. "Pakka."', 'silence'),
    ['sana', 'Main gussa nahi hoon. Main bas yaad dila rahi hoon. Medical student hoon, yaad dilaana mera kaam hai.'],
  ], [
    {
      intent: 'Make an excuse about the shuttle',
      beats: [
        ['player', 'Woh shuttle... chabi... bahut kuch hua.'],
        ['sana', 'Bahut kuch hua. Bas paani nahi hua.'],
      ],
      effects: { help: -3, mood: { sana: 'annoyed' } },
    },
    {
      intent: 'Promise again, louder',
      beats: [
        ['player', 'Abhi jaata hoon. Abhi. Double pakka.'],
        ['sana', 'Double pakka. Note kiya. Ye mere register mein hai, Asha aunty ke register ke saath.'],
      ],
      effects: { help: 2 },
    },
  ], { requires: { flags: ['promised-sana-water'], after: '12:30', notFlags: ['water-delivered', 'sana-has-water'] }, priority: 6 }),
  talk('sana-d-chai', 'midday', [
    ['sana', 'Kisi ne mere tent pe chai bhej di. Asha aunty boli tumne. Main chai nahi peeti.'],
    ['sana', '...Aaj pee li. Doosri bhi pee li. Mat batana kisi ko.'],
  ], [
    {
      intent: 'Tell everyone',
      beats: [
        ['player', 'SANA NE CHAI PI LI!'],
        R('sana', 'Tumhe abhi chakkar aayega. Main dekhungi.', 'laugh'),
      ],
      effects: { aura: 3, mood: { sana: 'amused' } },
    },
    {
      intent: 'Keep the secret and ask how she is holding up',
      beats: [
        ['player', 'Aap theek ho?'],
        ['sana', 'Subah se tumhe pehla aadmi jisne ye poochha. Theek hoon. Thaki hoon. Dono saath ho sakte hain.'],
      ],
      effects: { help: 3 },
    },
  ], { requires: { mood: { sana: ['grateful'] } }, priority: 4 }),

  // --- tense ---
  talk('sana-t-heat', 'tense', [
    ['sana', 'Do baje. Dhoop seedhi sar pe. Barricade pe log khade hain jaise dhoop bhi permission maang ke aayegi.'],
    ['sana', 'Agar koi gire, sar oopar mat karna, pair oopar karna. Log ulta karte hain. Movie dekh ke.'],
  ], [
    {
      intent: 'Volunteer to carry stretchers if it comes to that',
      beats: [
        ['player', 'Stretcher uthana ho toh bulana.'],
        ['sana', 'Stretcher nahi hai. Ek dari hai aur do bamboo. Tum ek bamboo ho. Dusra dhundhti hoon.'],
      ],
      effects: { help: 6, aura: -1 },
    },
    {
      intent: 'Ask if she is scared of what comes next',
      beats: [
        ['player', 'Aapko darr nahi lagta?'],
        ['sana', 'Lagta hai. Isliye tent ka rang safed hai. Safed tent pe log lathi nahi maarte. Zyada nahi maarte.'],
      ],
      effects: { mood: { sana: 'sad' } },
    },
  ], { priority: 1 }),
  talk('sana-t-ors', 'tense', [
    ['sana', 'ORS ka packet do log mein. Ek glass, ek chammach namak, chhe chammach cheeni. Rattna hai. Bolo.'],
  ], [
    {
      intent: 'Get the recipe wrong on purpose',
      beats: [
        ['player', 'Chhe namak, ek cheeni.'],
        R('sana', 'Isse koi theek nahi hoga. Isse koi samudra ban jaayega.', 'laugh'),
      ],
      effects: { aura: 3 },
    },
    {
      intent: 'Repeat it right and take a stack of packets round',
      beats: [
        ['player', 'Ek namak, chhe cheeni, ek glass.'],
        ['sana', 'Sahi. Ye lo das packet. Barricade ki taraf. Wahan sab "main theek hoon" bol rahe hain bina poochhe.'],
      ],
      effects: { help: 7, heat: 3 },
      do: ['crowd:barricade:+1'],
    },
  ]),
  talk('sana-t-short', 'tense', [
    ['sana', 'Suna maine. Meri ek bottle Sharma ji ke paas gayi. Barricade pe. Thandi wali.'],
    ['sana', 'Woh bhi insaan hain. Mujhe pata hai. Bas wohi ek bottle thi jo fridge se aayi thi.'],
  ], [
    {
      intent: 'Defend it: he had been standing there since morning',
      beats: [
        ['player', 'Woh subah se khade the dhoop mein.'],
        ['sana', 'Haan. Aur ek ladki tent pe subah se baithi hai, dhoop mein. Usko thanda paani diya kisi ne? Nahi. Woh bottle uski thi.'],
      ],
      effects: { aura: 2, mood: { sana: 'annoyed' } },
    },
    {
      intent: 'Apologise without explaining',
      beats: [
        ['player', 'Sorry.'],
        R('sana', '...Theek hai. Agli baar poochh lena. Bas poochh lena.', 'silence'),
      ],
      effects: { help: 3 },
    },
  ], { requires: { flags: ['sana-short-one'] }, priority: 6 }),
  talk('sana-t-runner', 'tense', [
    ['sana', 'Mera runner! Kitne ORS gaye?'],
    ['player', 'Bees.'],
    ['sana', 'Aur kitne logon ne do maange?'],
  ], [
    {
      intent: 'Admit you gave everyone two',
      beats: [
        ['player', 'Sabne. Maine sabko de diye.'],
        ['sana', 'Isliye tum runner ho, doctor nahi. Theek hai. Aaj kisi ko do ki zaroorat thi shayad.'],
      ],
      effects: { help: 2, aura: 1 },
    },
    {
      intent: 'Say you held the line: one each, doctor\'s orders',
      beats: [
        ['player', 'Ek ek. Bola doctor ne mana kiya hai.'],
        ['sana', 'Kisi ne poochha doctor kaun?'],
        ['player', 'Haan. Maine bola "Sana madam".'],
        R('sana', 'Madam. Mujhe aaj promotion mil gaya.', 'laugh'),
      ],
      effects: { help: 4, mood: { sana: 'amused' } },
    },
  ], { requires: { flags: ['sana-runner'] }, priority: 5 }),

  // --- showdown ---
  talk('sana-s-gas', 'showdown', [
    R('sana', 'Aankh mein? Idhar aao. Malna mat! Paani. Sirf paani. Doodh nahi!', 'cut'),
    ['sana', 'WhatsApp pe likha tha doodh daalo. WhatsApp pe ye bhi likha tha ki 2000 ke note mein chip hai.'],
  ], [
    {
      intent: 'Ask if toothpaste under the eyes works',
      beats: [
        ['player', 'Toothpaste? Aankh ke neeche?'],
        R('sana', 'Kaun bolta hai ye sab?! Toothpaste daant ke liye hai. Bas. Daant.', 'laugh'),
      ],
      effects: { aura: 2 },
    },
    {
      intent: 'Take her to the barricade, where people are down',
      beats: [
        ['player', 'Barricade pe log gire hain. Chalo.'],
        ['sana', 'Tent chhod ke? ...Haan. Tent yahan hai, log wahan hain. Bag uthao. Kela bhi.'],
      ],
      effects: { help: 10, heat: 6 },
      do: ['move:sana:barricade', 'stance:protect'],
    },
    {
      intent: 'Shout for everyone to come to the white tent',
      beats: [
        ['player', 'Jisko bhi lagi hai, safed tent! Safed tent pe aao!'],
        ['sana', 'Haan! Aur line mein! Line mein aana! ...Koi line mein nahi aayega. Theek hai, aao.'],
      ],
      effects: { help: 7 },
      do: ['intensity:-1', 'crowd:stage:+2'],
    },
  ], { priority: 1 }),
  talk('sana-s-count', 'showdown', [
    ['sana', 'Gin rahi hoon. Chhe aankh. Do ghutne. Ek uncle jo kele ke liye ro rahe hain. Kele gir gaye unke.'],
  ], [
    {
      intent: 'Sit with the banana uncle for a minute',
      beats: [
        ['player', 'Uncle, kele phir aa jaayenge.'],
        ['sana', 'Haan uncle, kele phir aa jaayenge. ...Dekho, chup ho gaye. Tum toh achhe ho isme.'],
      ],
      effects: { help: 4, aura: -1 },
    },
    {
      intent: 'Ask her to patch you up and send you back',
      beats: [
        ['player', 'Mujhe bhi ek patti. Phir main wapas.'],
        ['sana', 'Patti. Wapas. Tumhe pata hai stretcher mein dusra bamboo tum ho na? Bamboo ko wapas nahi bhejte.'],
      ],
      effects: { aura: 3, heat: 3 },
    },
  ]),

  // --- aftermath ---
  talk('sana-a-tally', 'aftermath', [
    ['sana', 'Final count. Chaudah chakkar. Chhe aankh. Do ghutne. Ek chappal, dayan pair. Woh tum the.'],
    ['sana', 'Koi serious nahi. Pehli baar. Mujhe pata nahi khush hoon ya thaki hoon. Dono.'],
  ], [
    {
      intent: 'Ask for your name in her register as "chappal"',
      beats: [
        ['player', 'Mera naam "chappal" likh dena.'],
        R('sana', 'Likh diya. "Chappal: survived." Achha record hai.', 'laugh'),
      ],
      effects: { aura: 2 },
    },
    {
      intent: 'Help her fold the tent',
      beats: [
        ['player', 'Tent samet lete hain.'],
        ['sana', 'Pehle bamboo. Phir tirpal. Phir kela. Kela abhi bhi bacha hai. Aaj ki sabse badi kamyabi.'],
      ],
      effects: { help: 5 },
    },
  ]),
  talk('sana-a-kela', 'aftermath', [
    ['sana', 'Kela. Subah se emergency ke liye rakha tha. Emergency aayi, gayi. Kela bacha.'],
    ['sana', 'Aadha tumhara?'],
  ], [
    {
      intent: 'Take your half like it is a medal',
      beats: [
        ['player', 'Aadha. Shukriya. Ye main frame karunga.'],
        ['sana', 'Kele ko frame nahi karte. Kha lo. Kal phir aana, kal naya kela.'],
      ],
      effects: { help: 2, mood: { sana: 'happy' } },
    },
    {
      intent: 'Say she has earned the whole banana',
      beats: [
        ['player', 'Poora aapka. Aapne kamaya.'],
        ['sana', 'Kamaya. Haan. Aaj maine ek kela kamaya. Mummy ko bataungi, MBBS kaam aa gaya.'],
      ],
      effects: { help: 3, mood: { sana: 'happy' } },
    },
  ]),
  talk('sana-a-heat', 'aftermath', [
    ['sana', 'Aaj do baje jo hua, woh paani hota toh nahi hota. Bas itna. Main kisi pe ungli nahi utha rahi.'],
    ['sana', 'Main bas likh rahi hoon. Register mein. Agli baar crate pehle aayega.'],
  ], [
    {
      intent: 'Say it was not your job',
      beats: [
        ['player', 'Mera kaam nahi tha paani laana.'],
        ['sana', 'Kisi ka kaam nahi tha. Isliye nahi aaya. Yahi toh likh rahi hoon.'],
      ],
      effects: { aura: 1, mood: { sana: 'sad' } },
    },
    {
      intent: 'Offer to be the crate person next time',
      beats: [
        ['player', 'Agli baar crate main laaunga. Subah das baje.'],
        ['sana', 'Das baje. Likh diya. Pen se. Pencil se nahi.'],
      ],
      effects: { help: 4 },
    },
  ], { requires: { notFlags: ['water-delivered', 'sana-has-water'] } }),
];

// ----------------------------------------------------------------------------------------------------------
// RAVI: sound volunteer. The speaker (Bhaukaal 3000) is his child. He forgets his child at chai.
// ----------------------------------------------------------------------------------------------------------
const ravi = [
  // --- morning ---
  talk('ravi-m-bhaukaal', 'morning', [
    ['ravi', 'Isko dekho. Bhaukaal 3000. Bluetooth, USB, aur ek knob jo kuch nahi karta par ghumane mein mazaa aata hai.'],
    ['ravi', 'Saade das baje stage pe jaayega. Barah baje Mira didi bolengi aur poora Jantar hilega.'],
  ], [
    {
      intent: 'Turn the knob that does nothing',
      beats: [
        ['player', '(ghumata hai)'],
        R('ravi', 'Dekha? Kuch nahi hua. Par mann ko shanti mili na? Wahi uska kaam hai.', 'laugh'),
      ],
      effects: { aura: 1, mood: { ravi: 'amused' } },
    },
    {
      intent: 'Ask him to play something right now, at CP',
      beats: [
        ['player', 'Abhi chala do na ek gaana.'],
        ['ravi', 'Abhi? Battery! Battery bhashan ke liye hai. Ek gaana... achha theek hai, ek.'],
        R('ravi', '(bass) Dhum dhum dhum.', 'cut'),
        ['ravi', 'Bas. Bas! Sharma ji dekh rahe hain. Unhe bass se allergy hai.'],
      ],
      effects: { aura: 4, nuisance: 4 },
      do: ['crowd:cp:+1'],
    },
    {
      intent: 'Ask why he carries it himself instead of a cart',
      beats: [
        ['player', 'Thela kyun nahi le lete?'],
        ['ravi', 'Thela? Bachche ko thele mein? Pichhli baar thele mein daala tha, thela wala usko le ke Karol Bagh chala gaya.'],
      ],
      effects: { help: 1 },
    },
  ], { requires: { before: '10:30' }, priority: 2 }),
  talk('ravi-m-playlist', 'morning', [
    ['ravi', 'Bhashan se pehle ek gaana chahiye. Mood ke liye. Do option hain, aur dono pe Mira didi naraz hongi.'],
  ], [
    {
      intent: 'Pick nineties Bollywood, the sing-along kind',
      beats: [
        ['player', 'Nineties. Sab gaayenge.'],
        ['ravi', 'Sab gaayenge, phir sab rone lagenge, phir koi bhashan nahi sunega. Perfect.'],
      ],
      effects: { aura: 3, flags: ['ravi-playlist-90s'] },
    },
    {
      intent: 'Pick a Haryanvi banger, for chaos',
      beats: [
        ['player', 'Haryanvi. Full bass.'],
        R('ravi', 'Haryanvi. Barricade waale bhi naachenge. Sharma ji ka pair hilega, dekhna.', 'laugh'),
      ],
      effects: { aura: 4, nuisance: 3, flags: ['ravi-playlist-haryanvi'] },
    },
    {
      intent: 'Say no song: let Mira\'s words do the work',
      beats: [
        ['player', 'Koi gaana nahi. Bhashan hi kaafi hai.'],
        ['ravi', 'Tum Mira didi ke chamche ho kya? ...Achha, theek bola. Par Bhaukaal udaas hoga.'],
      ],
      effects: { help: 3, mood: { ravi: 'sulking' } },
    },
  ]),
  talk('ravi-m-chai', 'morning', [
    ['ravi', 'Paanch minute. Bas paanch minute chai. Speaker stage pe hai. Safe hai.'],
    ['ravi', '...Safe hai na? Tumne dekha? Hai na wahan?'],
  ], [
    {
      intent: 'Tell him you saw someone carrying it off',
      beats: [
        ['player', 'Ek aadmi le ja raha tha. Kaala, bhaari...'],
        R('ravi', 'KYA?!', 'cut'),
        ['player', 'Mazaak.'],
        ['ravi', 'Mazaak. Mere dil ki battery 3% pe hai. Tumhare dost ke phone jaisi.'],
      ],
      effects: { aura: 3, mood: { ravi: 'annoyed' } },
    },
    {
      intent: 'Reassure him and buy his chai',
      beats: [
        ['player', 'Safe hai. Chai meri taraf se.'],
        ['ravi', 'Tum achhe ho. Bas ek baat. Agar koi uthaye, bolna "ye Ravi ka hai". Sab jaante hain. Koi nahi maanega, par bolna.'],
      ],
      effects: { help: 3 },
    },
  ], { requires: { after: '11:10' } }),
  talk('ravi-m-holding', null, [
    ['ravi', 'Ye... ye mera bachcha hai. Tumhare haath mein mera bachcha hai.'],
    ['ravi', 'Dheere. Dheere! Isko neeche se pakadte hain, side se nahi, side se iski izzat jaati hai.'],
  ], [
    {
      intent: 'Hold on to it a bit longer',
      beats: [
        ['player', 'Thodi der aur. Mujhe kaam hai.'],
        R('ravi', 'Kaam? Mere bachche se kaam? Kya kaam? ...Dekho, ye Bluetooth sabse connect hota hai. Kisi ka bhi gaana bajega.', 'silence'),
      ],
      effects: { nuisance: 6 },
    },
    {
      intent: 'Set it down on the stage where it belongs',
      beats: [
        ['player', 'Ye lo. Stage pe rakh deta hoon.'],
        ['ravi', 'Wahan. Wahan. Thoda left. Haan. Ab ye dekh raha hai Mira didi ko. Perfect angle.'],
      ],
      effects: { help: 6, mood: { ravi: 'grateful' }, flags: ['ravi-owes-you'] },
      do: ['drop:speaker:stageSpeaker'],
    },
  ], { requires: { holding: 'speaker' }, priority: 8 }),

  // --- midday ---
  talk('ravi-d-run-thanks', 'midday', [
    ['ravi', 'Tum! Tum the na? Bhaukaal ko stage tak laaye?'],
    R('ravi', 'Mira didi ki awaaz Rajiv Chowk tak gayi. Ek uncle ne Metro se phone kiya, "awaaz kam karo". Metro se!', 'laugh'),
  ], [
    {
      intent: 'Ask him to dedicate the next song to you',
      beats: [
        ['player', 'Agla gaana mere naam.'],
        ['ravi', 'Dedicated. "Is ladke ke liye jisne bachcha bachaya." Log samjhenge koi aur kahani hai. Theek hai.'],
      ],
      effects: { aura: 5, nuisance: 2 },
      do: ['crowd:stage:+2'],
    },
    {
      intent: 'Tell him he owes you, and you will collect',
      beats: [
        ['player', 'Ek favour udhaar. Baad mein maangunga.'],
        ['ravi', 'Udhaar. Asha aunty jaisa. Theek hai. Jab chahiye, Bhaukaal tumhara. Ek gaane ke liye.'],
      ],
      effects: { help: 2, flags: ['ravi-owes-you'] },
    },
  ], { requires: { did: ['speaker-run'] }, priority: 7 }),
  talk('ravi-d-soundcheck', 'midday', [
    ['ravi', 'Mic check. Ek do teen. Ek do teen. Ek do... Ye hamesha teen tak hi kyun jaata hai? Chaar mein kya burai?'],
  ], [
    {
      intent: 'Grab the mic and say "chaar"',
      beats: [
        ['player', 'Chaar.'],
        R('crowd', 'CHAAR!', 'laugh'),
        ['ravi', 'Dekha? Log ready hain. Chaar ke liye. Itihaas.'],
      ],
      effects: { aura: 4, nuisance: 2 },
      clip: 'singalong',
    },
    {
      intent: 'Ask him what happens if the battery dies mid-speech',
      beats: [
        ['player', 'Bhashan ke beech battery khatam hui toh?'],
        ['ravi', 'Toh Mira didi zor se bolengi. Woh bina mic ke bhi chalti hain. Mic toh mere liye hai, unke liye nahi.'],
      ],
      effects: { help: 1 },
    },
  ], { priority: 1 }),
  talk('ravi-d-neta', 'midday', [
    ['ravi', 'Woh LJM wale neta ji ka PA aaya tha. Bola "speaker ek ghante ke liye lend karo, neta ji bolenge".'],
    ['ravi', 'Lend. Bachcha lend. Main kya library hoon?'],
  ], [
    {
      intent: 'Tell him to lend it; the neta pays well',
      beats: [
        ['player', 'De do. Neta ji paise denge.'],
        ['ravi', 'Paise? Pichhli baar ek neta ne speaker liya, wapas aaya toh usme unke bhashan ki recording atak gayi. Teen mahine wahi bajta raha.'],
      ],
      effects: { aura: -2, mood: { ravi: 'annoyed' } },
    },
    {
      intent: 'Suggest he "lose" the cable when the neta starts',
      beats: [
        ['player', 'Jab neta ji shuru karein, cable dheela kar dena.'],
        R('ravi', 'Cable dheela. Bechara cable. Purana hai. Kabhi bhi nikal sakta hai. Bhagwan ki marzi.', 'laugh'),
      ],
      effects: { aura: 5, heat: 4, nuisance: 4, flags: ['ravi-unplugged-neta'] },
    },
    {
      intent: 'Say it is Mira\'s call, not yours or his',
      beats: [
        ['player', 'Mira didi se poochho.'],
        ['ravi', 'Mira didi ne bola "Ravi se poochho". Main tumse poochh raha hoon. Tum kisi se mat poochhna, chain khatam ho jaayegi.'],
      ],
      effects: { help: 2 },
    },
  ], { requires: { after: '12:40' } }),
  talk('ravi-d-playlist-back', 'midday', [
    ['ravi', 'Tumhara gaana bajaya. Nineties wala. Ek aunty ne poora gaana gaaya. Do baar. Mira didi ne apna bhashan pandrah minute late kiya.'],
  ], [
    {
      intent: 'Ask for an encore',
      beats: [
        ['player', 'Ek aur?'],
        ['ravi', 'Ek aur bajaya toh Mira didi mujhe stage se utaar dengi. Phir main tumhare saath ghoomunga, speaker leke. Chalo bajata hoon.'],
      ],
      effects: { aura: 4, nuisance: 3 },
      clip: 'singalong',
    },
    {
      intent: 'Apologise to Mira on his behalf',
      beats: [
        ['player', 'Main Mira didi se sorry bol deta hoon.'],
        ['ravi', 'Mat bolo. Unhone mujhe bola "achha tha". Main usi pe zinda hoon.'],
      ],
      effects: { help: 2 },
    },
  ], { requires: { flags: ['ravi-playlist-90s'] }, priority: 4 }),
  talk('ravi-d-haryanvi', 'midday', [
    ['ravi', 'Tumhara Haryanvi gaana. Bajaya. Sharma ji ka pair hila. Main kasam khaata hoon. Daayan pair.'],
  ], [
    {
      intent: 'Demand video proof',
      beats: [
        ['player', 'Proof?'],
        ['ravi', 'Meera ne bana liya. "Constable bhi vibe kar raha hai." Caption meri nahi hai. Main maafi maang chuka hoon.'],
      ],
      effects: { aura: 3, heat: 3 },
    },
    {
      intent: 'Tell him to never play it again near the barricade',
      beats: [
        ['player', 'Barricade ke paas mat bajana dobara.'],
        ['ravi', 'Haan. Ek baar chamatkar hota hai. Doosri baar case.'],
      ],
      effects: { heat: -2 },
    },
  ], { requires: { flags: ['ravi-playlist-haryanvi'] }, priority: 4 }),

  // --- tense ---
  talk('ravi-t-battery', 'tense', [
    ['ravi', 'Battery chalees percent. Generator wala bhaag gaya. Bola "police aa rahi hai, mera generator bina license ka hai".'],
    ['ravi', 'Ab Bhaukaal ko bachana hai. Ya toh dheere bajao, ya ek baar zor se aur phir khatam.'],
  ], [
    {
      intent: 'One last loud blast for the chant',
      beats: [
        ['player', 'Ek baar. Full. Naare ke liye.'],
        R('ravi', 'Full. Theek. Bhaukaal, beta, aaj tera din hai.', 'cut'),
        ['crowd', 'AWAAZ DO! HUM EK HAIN!'],
      ],
      effects: { aura: 6, heat: 6 },
      do: ['intensity:+1', 'crowd:stage:+3'],
    },
    {
      intent: 'Save the battery for announcements later',
      beats: [
        ['player', 'Bacha ke rakho. Baad mein zaroorat padegi.'],
        ['ravi', 'Baad mein. Haan. Agar kuch hua toh logon ko batana padega kidhar jaana hai. Ye samajhdari hai. Mujhe pasand nahi.'],
      ],
      effects: { help: 4, flags: ['ravi-owes-you'] },
    },
  ], { priority: 1 }),
  talk('ravi-t-permission', 'tense', [
    ['ravi', 'Ek constable aaya. Tomar. Bola permission "sirf bhashan" ki hai, gaane ki nahi. Speaker band karo.'],
    ['ravi', 'Maine poocha "naara gaana hai ya bhashan?" Usne bola "dono band".'],
  ], [
    {
      intent: 'Tell him to play a bhajan; nobody stops a bhajan',
      beats: [
        ['player', 'Bhajan chala do. Bhajan pe koi nahi rokta.'],
        R('ravi', 'Bhajan. Protest mein bhajan. Tomar ji ne haath jod liye. Dekho, haath jod ke khade hain. Jeet.', 'laugh'),
      ],
      effects: { aura: 5, heat: -2 },
      clip: 'singalong',
    },
    {
      intent: 'Go and argue the permission letter with Tomar',
      beats: [
        ['player', 'Main baat karta hoon Tomar se.'],
        ['ravi', 'Mat jao. Woh baat nahi karta. Woh bas tumhara naam likhta hai. Phir dhoondhta hai.'],
      ],
      effects: { aura: 3, heat: 8 },
    },
    {
      intent: 'Advise him to just switch it off',
      beats: [
        ['player', 'Band kar do. Jhagda mat lo.'],
        ['ravi', 'Band. Theek. Bhaukaal so gaya. Pehli baar dopahar mein. Bachche dopahar mein sote hain, toh theek hai.'],
      ],
      effects: { heat: -4, mood: { ravi: 'sulking' } },
      do: ['intensity:-1'],
    },
  ]),
  talk('ravi-t-barricade', 'tense', [
    ['ravi', 'Barricade pe naara lag raha hai aur unke paas mic nahi hai. Bechare chilla rahe hain. Gala bhi toh ek hi hai.'],
    ['ravi', 'Bhaukaal wahan le jaun? Ya wahan mat le jaun? Main kabhi decide nahi karta, isliye dost banaye hain.'],
  ], [
    {
      intent: 'Carry it to the barricade yourself',
      beats: [
        ['player', 'Do. Main le jaata hoon.'],
        ['ravi', 'Neeche se pakadna! Side se nahi! Aur wahan RAF hai, unhe bass se pyaar nahi.'],
      ],
      effects: { aura: 4, heat: 6, nuisance: 3 },
      do: ['take:speaker', 'hotspot:barricade'],
    },
    {
      intent: 'Keep the speaker at the stage, away from the RAF',
      beats: [
        ['player', 'Yahin rakho. Barricade pe toot jaayega.'],
        ['ravi', 'Toot jaayega. Haan. Main yahin rahunga. Bhaukaal bhi. Hum dono darpok hain, par saath mein.'],
      ],
      effects: { help: 2 },
    },
  ], { requires: { after: '14:20' } }),

  // --- showdown ---
  talk('ravi-s-gas', 'showdown', [
    R('ravi', 'Dhuan! Dhuan! Bhaukaal ko kuch nahi hona chahiye. Mujhe ho jaaye chalega!', 'cut'),
  ], [
    {
      intent: 'Shield the speaker with your own body',
      beats: [
        ['player', 'Main pakadta hoon! Neeche se!'],
        ['ravi', 'Neeche se! Haan! Tum hero ho! Tum mere bachche ke chacha ho!'],
      ],
      effects: { aura: 6, heat: 8 },
    },
    {
      intent: 'Use the speaker: tell people where Sana\'s tent is',
      requires: { flags: ['ravi-owes-you'] },
      beats: [
        ['player', 'Ravi, mic do. Udhaar wapas.'],
        R('player', 'Jisko lagi hai, safed tent, stage ke left! Bhaago mat, chalo!', 'cut'),
        ['ravi', 'Bachi hui battery isi ke liye thi. Bhaukaal ne aaj apna kaam kiya.'],
      ],
      effects: { help: 10 },
      do: ['intensity:-1', 'stance:protect'],
    },
    {
      intent: 'Play the loudest song to drown out the panic',
      beats: [
        ['player', 'Gaana! Zor se!'],
        ['ravi', 'Ab? ...Theek. Agar marna hai toh bass ke saath.'],
        R('crowd', '(aadhe log ruk jaate hain, aadhe aur tez bhaagte hain)', 'silence'),
      ],
      effects: { aura: 4, nuisance: 6, heat: 4 },
      do: ['intensity:+1'],
    },
  ], { priority: 1 }),
  talk('ravi-s-cable', 'showdown', [
    ['ravi', 'Cable gaya. Kisi ka pair pada, cable nikla, kisi aur ne utha liya. Ab kisi ke ghar mein mera cable hai.'],
  ], [
    {
      intent: 'Offer your phone charger cable as a spare',
      beats: [
        ['player', 'Mera charger lo. Type-C.'],
        ['ravi', 'Type-C. Bhaukaal 2016 ka hai. Usko Type-C nahi samajh aata. Woh boomer hai. Par thanks.'],
      ],
      effects: { help: 2 },
    },
    {
      intent: 'Tell him to forget the cable and get out',
      beats: [
        ['player', 'Cable chhodo. Nikalo yahan se.'],
        ['ravi', 'Bina cable? Bhaukaal bina cable ke sirf ek bhaari dabba hai. ...Aaj ke liye bhaari dabba hi sahi. Chalo.'],
      ],
      effects: { heat: -4 },
    },
  ]),

  // --- aftermath ---
  talk('ravi-a-pack', 'aftermath', [
    ['ravi', 'Ek kaan gaya. Left. Ab Bhaukaal mono hai. Pehle stereo tha.'],
    ['ravi', 'Mira didi ko bolunga pehli kurbaani Bhaukaal ki thi. Woh bhashan mein daal dengi agli baar.'],
  ], [
    {
      intent: 'Suggest a crowdfunding post for a new speaker',
      beats: [
        ['player', 'Crowdfunding kar lo. "Bhaukaal ka ilaaj".'],
        R('ravi', 'Haan! Meera ko bolo. Uske followers hain. Main sirf speaker ka follower hoon.', 'laugh'),
      ],
      effects: { aura: 3 },
    },
    {
      intent: 'Help him carry it home, from underneath',
      beats: [
        ['player', 'Chalo, Metro tak le chalte hain. Neeche se.'],
        ['ravi', 'Neeche se. Tum seekh gaye. Aaj kuch toh achha hua.'],
      ],
      effects: { help: 5, mood: { ravi: 'grateful' } },
    },
  ]),
  talk('ravi-a-next', 'aftermath', [
    ['ravi', 'Agla protest kab hai? Main hamesha poochhta hoon. Koi nahi batata. Sab bolte hain "jab zaroorat hogi".'],
    ['ravi', 'Zaroorat toh roz hai. Battery nahi hoti.'],
  ], [
    {
      intent: 'Promise to tell him first next time',
      beats: [
        ['player', 'Main bataunga. Pehle tumhe.'],
        ['ravi', 'Pehle mujhe. Phir Asha aunty ko, warna woh naraz hongi. Phir Sharma ji ko, warna woh pehle se wahan honge.'],
      ],
      effects: { help: 3 },
    },
    {
      intent: 'Say you are never doing this again',
      beats: [
        ['player', 'Agla? Main toh kabhi nahi aaunga.'],
        R('ravi', 'Sab yahi bolte hain. Pichhle saal maine bhi bola tha.', 'silence'),
      ],
      effects: { aura: 1 },
    },
  ]),
  talk('ravi-a-owed', 'aftermath', [
    ['ravi', 'Tumhara udhaar. Yaad hai. Ek gaana. Abhi le lo. Aakhri battery.'],
  ], [
    {
      intent: 'Play something quiet for everyone sitting around',
      beats: [
        ['player', 'Kuch dheema. Sab thake hain.'],
        ['ravi', '(dheema gaana) ...Dekho. Sab chup. Kisi ne kuch nahi bola. Ye aaj ka sabse achha bhashan hai.'],
      ],
      effects: { help: 4, aura: 3 },
      do: ['crowd:stage:+1'],
    },
    {
      intent: 'Save it for the next protest',
      beats: [
        ['player', 'Agli baar ke liye rakh lo.'],
        ['ravi', 'Agli baar. Udhaar chalta rahega. Achha hai. Udhaar se rishta bana rehta hai.'],
      ],
      effects: { help: 2 },
    },
  ], { requires: { flags: ['ravi-owes-you'] }, priority: 5 }),
];

// ----------------------------------------------------------------------------------------------------------
// IQBAL: the shuttle driver. CP to Jantar, Jantar to CP, life in between. The key lives on a hook.
// ----------------------------------------------------------------------------------------------------------
const iqbal = [
  // --- morning ---
  talk('iqbal-m-break', 'morning', [
    ['iqbal', 'Gyarah baje chai. Pandrah saal se. Bus ruk jaati hai, duniya ruk jaati hai, Iqbal chai peeta hai.'],
    ['iqbal', 'Chabi? Hook pe. Kaun churayega? Is bus ko le ke kahan jaoge? Jantar? Wahan toh main roz jaata hoon.'],
  ], [
    {
      intent: 'Offer to hold the key for him while he drinks',
      beats: [
        ['player', 'Chabi main pakad leta hoon. Safe rahegi.'],
        ['iqbal', 'Tum? Achha. Lo. Tumhara chehra imaandaar hai. Thoda bhookha bhi.'],
        R('iqbal', 'Bas bhaagna mat. Mera ghutna kharab hai. Main nahi bhaag sakta. Isliye mujhe sab pe vishwas hai.', 'silence'),
      ],
      effects: { aura: 3, nuisance: 4 },
      do: ['take:key'],
    },
    {
      intent: 'Ask about his daughter\'s rishta',
      beats: [
        ['player', 'Suna hai beti ka rishta...'],
        ['iqbal', 'Asha ne bataya? Asha ne bataya. Ladka CA hai. Teesri attempt. Par shraddha dekho. Shraddha.'],
        ['iqbal', 'Main bolta hoon attempt nahi, insaan dekho. Beti bolti hai papa, result dekho. Ye aaj kal ke bachche.'],
      ],
      effects: { help: 2, mood: { iqbal: 'amused' } },
    },
    {
      intent: 'Ask him what the route is like on a protest day',
      beats: [
        ['player', 'Aaj route kaisa hai?'],
        ['iqbal', 'CP se Jantar. Jantar se CP. Aaj beech mein ek naara, do barricade, aur ek ladka jo bus ke aage khada ho ke selfie leta hai.'],
        ['iqbal', 'Woh tum nahi ho na? Achha. Abhi nahi ho.'],
      ],
      effects: { aura: 1 },
    },
  ], { priority: 1 }),
  talk('iqbal-m-holding', null, [
    ['iqbal', 'Ye... meri chabi hai?'],
    ['iqbal', 'Haan. Meri hai. Isme laal dhaaga hai. Beti ne baandha tha. Nazar ke liye.'],
  ], [
    {
      intent: 'Claim you found it lying on the ground',
      beats: [
        ['player', 'Zameen pe padi thi.'],
        R('iqbal', 'Zameen pe. Hook se khud utri, chalti hui. Achha. Aaj kal chabiyan bhi protest karti hain.', 'silence'),
      ],
      effects: { aura: -2, help: 2, flags: ['iqbal-suspects-you'] },
      do: ['drop:key:keyHook'],
    },
    {
      intent: 'Keep it: tell him he will get it back later',
      beats: [
        ['player', 'Baad mein milegi. Abhi zaroorat hai.'],
        ['iqbal', 'Zaroorat. Tumhe meri bus ki zaroorat hai? Chalana aata hai? Clutch thoda tight hai. Pehle gear mein jhatka.'],
        ['iqbal', 'Main Sharma ji ko nahi bolunga. Main bas yahan baith ke tumhe dekhta rahunga. Bahut der tak.'],
      ],
      effects: { nuisance: 8, heat: 4, mood: { iqbal: 'annoyed' } },
    },
    {
      intent: 'Hang it back on the hook and say sorry',
      beats: [
        ['player', 'Sorry chacha. Galti ho gayi.'],
        ['iqbal', 'Galti. Galti sabse hoti hai. Mujhse bhi hui thi, 2009 mein, ek baraat ko galat shaadi mein chhod aaya.'],
        ['iqbal', 'Hook pe rakh do. Laal dhaaga bahar ki taraf.'],
      ],
      effects: { help: 8, mood: { iqbal: 'grateful' }, flags: ['iqbal-on-your-side', 'iqbal-likes-you'] },
      do: ['drop:key:keyHook'],
    },
  ], { requires: { holding: 'key' }, priority: 9 }),
  talk('iqbal-m-after-chabi', 'morning', [
    ['iqbal', 'Aaj kisi ne meri chabi uthaayi. Pandrah saal mein pehli baar.'],
    ['iqbal', 'Main naam nahi lunga. Bas chehra yaad rakhunga. Mera chehre ka record bahut achha hai. Naam ka kharab.'],
  ], [
    {
      intent: 'Look him in the eye and deny everything',
      beats: [
        ['player', 'Mujhe kya pata, chacha.'],
        ['iqbal', 'Haan. Tumhe kya pata. Tumhara chehra bhi yahi bol raha hai. Bahut zor se.'],
      ],
      effects: { aura: 3, flags: ['iqbal-suspects-you'], mood: { iqbal: 'annoyed' } },
    },
    {
      intent: 'Confess, and offer to push the bus if it stalls',
      beats: [
        ['player', 'Main tha. Sorry. Bus band hui toh main dhakka laga dunga.'],
        R('iqbal', 'Dhakka. Tum? Ye bus chaudah logon ki hai. Tumhara ek dhakka, mera ek shukriya. Chal jaayegi.', 'laugh'),
        ['iqbal', 'Sach bola. Ye bhi pandrah saal mein pehli baar.'],
      ],
      effects: { help: 7, heat: -3, mood: { iqbal: 'grateful' }, flags: ['iqbal-on-your-side', 'iqbal-likes-you'] },
    },
    {
      intent: 'Blame Kabir, who is not here to defend himself',
      beats: [
        ['player', 'Woh Kabir tha shayad. Comedy karta hai.'],
        ['iqbal', 'Comedy wala? Haan. Unke chehre pe chori nahi, bas bhookh hai. Taaliyon ki. Tum jhooth bol rahe ho, par achha bol rahe ho.'],
      ],
      effects: { aura: 2, help: -3, mood: { kabir: 'sulking' } },
    },
  ], { requires: { did: ['chabi'] }, priority: 7 }),
  talk('iqbal-m-souvenir', null, [
    ['iqbal', 'Woh comedy wala ladka. Tumhara dost. Uske haath mein meri chabi hai. Laal dhaaga dikh raha hai.'],
    ['iqbal', 'Woh usse mic ki tarah pakad ke kuch bol raha hai. "Chabi ki baat karte hain." Log has rahe hain. Main nahi.'],
  ], [
    {
      intent: 'Tell him it is a souvenir, Kabir will treasure it',
      beats: [
        ['player', 'Souvenir hai chacha. Yaad rahegi.'],
        ['iqbal', 'Souvenir. Bus ki chabi. Ghar le jaayega, frame karega, aur meri bus yahan khadi rahegi. Ek monument ki tarah.'],
      ],
      effects: { aura: 4, nuisance: 6, mood: { iqbal: 'annoyed' } },
    },
    {
      intent: 'Promise to get it back from Kabir',
      beats: [
        ['player', 'Main le aata hoon wapas.'],
        ['iqbal', 'Le aao. Aur usko bolna, joke achha tha. Par chabi wala nahi. Chabi wala purana hai.'],
      ],
      effects: { help: 4 },
    },
  ], { requires: { holds: ['given:key:kabir'] }, priority: 8 }),

  // --- midday ---
  talk('iqbal-d-water', 'midday', [
    ['iqbal', 'Sana bitiya ka crate. Pichhle round mein daala. Ya nahi daala? Daala. Shayad. Pachchees kilo, peeche wali seat pe.'],
    ['iqbal', 'Bus mein sab kuch hota hai. Kabhi paani, kabhi bachche, kabhi ek uncle jo kele leke Jantar jaate hain aur kabhi wapas nahi aate.'],
  ], [
    {
      intent: 'Ask him to check, right now',
      beats: [
        ['player', 'Check kar lo na. Abhi.'],
        ['iqbal', 'Abhi? Chai ke beech? Beta, chai ke beech main sirf chai check karta hoon.'],
        ['iqbal', 'Achha. Agle round mein dekh lunga. Agar crate CP stop pe pada hai, toh mere saath chalo, uthwa dena.'],
      ],
      effects: { help: 3 },
    },
    {
      intent: 'Tease him about the uncle who never came back',
      beats: [
        ['player', 'Woh kele wale uncle ka kya hua?'],
        R('iqbal', 'Pata nahi. Har protest mein ek hota hai. Shayad wahi hai. Shayad woh kele bechta hai. Shayad woh sarkaar hai.', 'laugh'),
      ],
      effects: { aura: 2 },
    },
  ], { requires: { notFlags: ['water-delivered', 'sana-has-water'] }, priority: 2 }),
  talk('iqbal-d-detention', 'midday', [
    ['iqbal', 'Wireless pe bola do baje se bus "detention duty" pe. Maine poocha detention kya hai, bole "free ride hai, bas ulta".'],
    ['iqbal', 'Ulta. Log chadhna nahi chahte, aur utarne nahi diya jaata. Wahi bus. Wahi seat. Wahi main.'],
  ], [
    {
      intent: 'Tell him to refuse the duty',
      beats: [
        ['player', 'Mana kar do.'],
        ['iqbal', 'Mana? EMI. Beti ki shaadi. CA ki teesri attempt ki fees. Mana karne ka option ameeron ke paas hota hai.'],
      ],
      effects: { aura: 1, mood: { iqbal: 'sad' } },
    },
    {
      intent: 'Ask him to leave a window open, just in case',
      requires: { rep: { help: 10 } },
      beats: [
        ['player', 'Ek khidki thodi khuli chhod dena?'],
        ['iqbal', 'Khidki. Garmi bahut hai. Khidki toh khuli rehni chahiye. Insaaniyat ke naate. Aur AC kharab hai, ye bhi sach hai.'],
      ],
      effects: { help: 3, mood: { iqbal: 'amused' }, flags: ['iqbal-on-your-side'] },
    },
    {
      intent: 'Joke that he is now a jailer with a horn',
      beats: [
        ['player', 'Ab aap jailer ho. Horn wale.'],
        R('iqbal', 'Horn wala jailer. Beti ko bataunga. Woh hasegi. Phir rishte walon ko batayegi aur rishta toot jaayega.', 'laugh'),
      ],
      effects: { aura: 3 },
    },
  ], { priority: 1 }),
  talk('iqbal-d-trust', 'midday', [
    ['iqbal', 'Tum. Subah wale. Chabi wale. Baith jao.'],
    ['iqbal', 'Maine socha. Jo chabi utha ke wapas laaye, usse zyada bharosemand koi nahi. Jo kabhi nahi uthata, uska pata nahi.'],
  ], [
    {
      intent: 'Ask him what that trust gets you',
      beats: [
        ['player', 'Toh mujhe kya milega?'],
        ['iqbal', 'Milega? Do baje ke baad ye bus jail banegi. Aur jail ki chabi phir isi hook pe latkegi. Main phir chai peene jaaunga. Bas.'],
      ],
      effects: { flags: ['iqbal-forgets-key'] },
    },
    {
      intent: 'Say you would never do it again, honestly',
      beats: [
        ['player', 'Dobara nahi karunga.'],
        ['iqbal', 'Dobara nahi. Achha. Par agar zaroorat padi toh karna. Zaroorat aur chori mein farq hota hai. Bas mujhe batana.'],
      ],
      effects: { help: 3 },
    },
  ], { requires: { did: ['chabi'], anyFlags: ['iqbal-likes-you', 'iqbal-on-your-side', 'rishta-consultant'] }, priority: 6 }),

  // --- tense ---
  talk('iqbal-t-offduty', 'tense', [
    ['iqbal', 'Main driver hoon. Jailer nahi. Unhone mujhe bola baahar baitho, chabi hook pe, andar Constable Rawat dekh lenge.'],
    ['iqbal', 'Rawat ji andar forward padh rahe hain. Bahar main chai pee raha hoon. Beech mein chaudah log baithe hain.'],
  ], [
    {
      intent: 'Ask him to "forget" the key on the hook today',
      requires: { anyFlags: ['iqbal-likes-you', 'iqbal-on-your-side', 'rishta-consultant'] },
      beats: [
        ['player', 'Aaj chabi wahi bhool jaana. Hook pe.'],
        R('iqbal', 'Bhoolna? Main roz bhoolta hoon. Pandrah saal se. Aaj bhi bhool jaaunga. Aadat buri hai, kya karein.', 'silence'),
      ],
      effects: { help: 4, flags: ['iqbal-forgets-key', 'iqbal-on-your-side'] },
    },
    {
      intent: 'Buy him a second chai and just sit',
      beats: [
        ['player', 'Ek aur chai? Main bhi baithta hoon.'],
        ['iqbal', 'Baitho. Koi baat mat karo. Aaj sab baat kar rahe hain. Main bas sun raha hoon. Bus bhi sun rahi hai.'],
      ],
      effects: { help: 2, mood: { iqbal: 'soft' } },
    },
    {
      intent: 'Ask who is on the bus right now',
      beats: [
        ['player', 'Andar kaun kaun hai?'],
        ['iqbal', 'Ek student, teesri baar. Ek uncle, kele wale. Do LJM wale jo khud chadh gaye photo ke liye. Aur ek ladka jo bola "main toh sirf dekhne aaya tha".'],
        ['iqbal', 'Sab sirf dekhne aaye the. Ab sab dekh rahe hain. Khidki se.'],
      ],
      effects: { aura: 1 },
    },
  ], { priority: 1 }),
  talk('iqbal-t-daughter', 'tense', [
    ['iqbal', '(phone pe) Haan beta. Haan. Nahi, main theek hoon. Nahi, koi protest nahi. Main toh... Gurgaon route pe hoon.'],
    ['iqbal', '(phone rakh ke) Jhooth bolna padta hai. Beti ko Gurgaon se nafrat hai, toh woh aur nahi poochhti.'],
  ], [
    {
      intent: 'Point out that is exactly what Kabir does',
      beats: [
        ['player', 'Mera dost bhi aise hi tuition bol ke aaya hai.'],
        R('iqbal', 'Tuition. Gurgaon. Sab apni mummy, apni beti se jhooth bol ke yahan aaye hain. Ye protest nahi, jhooth ka mela hai.', 'laugh'),
      ],
      effects: { aura: 2 },
    },
    {
      intent: 'Tell him he should tell her the truth',
      beats: [
        ['player', 'Unko sach bata do. Woh samjhegi.'],
        ['iqbal', 'Samjhegi. Haan. Phir aayegi. Usko yahan nahi aana. Usko CA wale se shaadi karni hai aur Gurgaon nahi jaana. Bas.'],
      ],
      effects: { help: 2, mood: { iqbal: 'sad' } },
    },
  ]),
  talk('iqbal-t-suspicious', 'tense', [
    ['iqbal', 'Tum phir. Subah "zameen pe padi thi" wale.'],
    ['iqbal', 'Bus jail ban gayi. Chabi phir hook pe. Aur tum phir yahan. Main kuch nahi bol raha. Bas chabi ki taraf dekh raha hoon.'],
  ], [
    {
      intent: 'Come clean now, about the morning',
      beats: [
        ['player', 'Theek hai. Subah main tha. Sorry.'],
        ['iqbal', 'Ab bola. Dopahar mein sach thoda mehenga hota hai, subah sasta tha. Par chalo. Liya.'],
      ],
      effects: { help: 5, mood: { iqbal: 'soft' }, flags: ['iqbal-likes-you'] },
    },
    {
      intent: 'Stare back at the key too',
      beats: [
        ['player', '(chabi ki taraf dekhta hai)'],
        R('iqbal', '(woh bhi chabi ki taraf dekhta hai)', 'silence'),
        ['iqbal', 'Rawat ji! Chabi andar le lo! ...Haan, mazaak tha. Par ab tumhe pata hai main bhi mazaak karta hoon.'],
      ],
      effects: { aura: 3, heat: 4 },
    },
  ], { requires: { flags: ['iqbal-suspects-you'] }, priority: 5 }),

  // --- showdown ---
  talk('iqbal-s-loading', 'showdown', [
    R('iqbal', 'Bhar rahe hain. Bus bhar rahe hain! Chaudah ki bus mein bees. Main bahar khada hoon. Mujhe kuch nahi pata. Kuch nahi!', 'cut'),
  ], [
    {
      intent: 'Get him to let your friends off the bus',
      requires: { anyFlags: ['iqbal-likes-you', 'iqbal-on-your-side', 'rishta-consultant'] },
      beats: [
        ['player', 'Chacha, mere dost andar hain. Peeche ka darwaza.'],
        ['iqbal', 'Peeche ka darwaza... kharab hai. Hamesha se. Kabhi kabhi khud khul jaata hai. Jaise abhi.'],
        R('iqbal', 'Jaldi! Main horn bajata hoon, sab horn dekhenge!', 'cut'),
      ],
      effects: { help: 10, heat: 8, flags: ['iqbal-on-your-side'] },
      do: ['release:kabir', 'release:nikhil', 'release:meera'],
    },
    {
      intent: 'Honk the horn yourself to pull the police away',
      beats: [
        ['player', '(horn) PAAAAAN!'],
        ['iqbal', 'Mera horn! Mera horn kisi aur ne bajaya! Pandrah saal mein... aaj sab pehli baar ho raha hai.'],
      ],
      effects: { aura: 5, heat: 10, nuisance: 6 },
      do: ['intensity:+1'],
    },
    {
      intent: 'Tell him to drive off and leave it all behind',
      beats: [
        ['player', 'Bus le ke nikal jao. Sab ko le ke.'],
        ['iqbal', 'Kahan? Gurgaon? Beti maar degi. ...Nahi beta. Main yahin hoon. Jab tak sab ghar na jaayein.'],
      ],
      effects: { help: 2 },
    },
  ], { priority: 1 }),
  talk('iqbal-s-chai', 'showdown', [
    ['iqbal', 'Asha ne chai di. Haath kaanp rahe hain. Chai ke liye nahi. Dhuan aankh mein gaya. Ya shayad chai ke liye bhi.'],
  ], [
    {
      intent: 'Give him your lemon from Asha',
      beats: [
        ['player', 'Ye neembu lo. Soongho.'],
        ['iqbal', 'Neembu. Chai mein? Nahi, soonghna hai. Achha. ...Haan. Theek hai. Behtar.'],
      ],
      effects: { help: 4, mood: { iqbal: 'grateful' } },
    },
    {
      intent: 'Ask him if this is worse than other years',
      beats: [
        ['player', 'Pichhle saal se bura hai?'],
        ['iqbal', 'Har saal pichhle saal se bura hota hai. Phir agle saal ye wala achha lagta hai. Ye bhi tarakki hai.'],
      ],
      effects: { aura: 1 },
    },
  ]),

  // --- aftermath ---
  talk('iqbal-a-lastround', 'aftermath', [
    ['iqbal', 'Aakhri round. Saade paanch baje sab ko chhod denge. Phir ye bus wapas shuttle. Jail se taxi. Ek ghante mein.'],
    ['iqbal', 'Metro tak chhod doon? Free. Aaj sab free tha. Lathi bhi.'],
  ], [
    {
      intent: 'Take the ride and sit up front',
      beats: [
        ['player', 'Aage baithunga.'],
        ['iqbal', 'Aage. Mere saath. Gear mat chhoona. Clutch tight hai. Pehle gear mein jhatka. Ye sab mat seekhna, aage kaam aayega.'],
      ],
      effects: { help: 2, mood: { iqbal: 'happy' } },
    },
    {
      intent: 'Walk instead: you have had enough of buses',
      beats: [
        ['player', 'Paidal jaunga. Aaj bus se dil bhar gaya.'],
        R('iqbal', 'Dil bhar gaya. Mera bhi. Pandrah saal se. Par kal phir chalaunga.', 'silence'),
      ],
      effects: { aura: 1 },
    },
  ]),
  talk('iqbal-a-rishta', 'aftermath', [
    ['iqbal', 'Beti ka message aaya. Ladka CA nikal gaya. Teesri attempt mein. Shraddha.'],
    R('iqbal', 'Aaj ke din ek achhi khabar. Ek.', 'silence'),
  ], [
    {
      intent: 'Tell Asha so the whole of CP knows in ten minutes',
      beats: [
        ['player', 'Asha aunty ko batata hoon!'],
        ['iqbal', 'Mat! ...Achha bata do. Woh waise bhi pata kar legi. Pehle tumse sun le toh tumhara naam bhi hoga.'],
      ],
      effects: { aura: 2, help: 2 },
    },
    {
      intent: 'Ask whether the CA is moving to Gurgaon',
      beats: [
        ['player', 'Ladka Gurgaon toh nahi jaayega?'],
        ['iqbal', 'Tumne mera din kharab kar diya. Abhi poochhta hoon. ...Noida. Theek hai. Noida chalega.'],
      ],
      effects: { aura: 3, mood: { iqbal: 'amused' } },
    },
  ]),
  talk('iqbal-a-key', 'aftermath', [
    ['iqbal', 'Subah meri chabi uthi. Dopahar mein meri bus jail bani. Shaam ko sab chhoot gaye.'],
    ['iqbal', 'Pata hai sabse badi baat kya hai? Chabi phir bhi hook pe latakti hai. Kal bhi latakegi. Main nahi badlunga.'],
  ], [
    {
      intent: 'Ask him to tie a lock on the hook, at least',
      beats: [
        ['player', 'Ek taala laga lo hook pe.'],
        R('iqbal', 'Taala. Phir taale ki chabi kahan rakhun? Hook pe? Dekha. Isliye nahi lagata.', 'laugh'),
      ],
      effects: { aura: 2 },
    },
    {
      intent: 'Promise you will never touch it again',
      beats: [
        ['player', 'Kabhi nahi chhoonga.'],
        ['iqbal', 'Mat chhoona. Par agar zaroorat ho, aur tumhare dost andar hon, aur main chai pe hoon... toh chhoona. Mujhe bata dena baad mein.'],
      ],
      effects: { help: 3 },
    },
  ], { requires: { did: ['chabi'] }, priority: 5 }),
];

// ----------------------------------------------------------------------------------------------------------
// SHARMA: barricade constable. Short questions. Repeats your words back. Deadpan. Can go soft.
// ----------------------------------------------------------------------------------------------------------
const sharma = [
  // --- morning ---
  talk('sharma-m-what', 'morning', [
    ['sharma', 'Kya?'],
    ['player', 'Kuch nahi.'],
    ['sharma', 'Kuch nahi.'],
  ], [
    {
      intent: 'Ask him what exactly he is guarding',
      beats: [
        ['player', 'Aap kya guard kar rahe ho?'],
        ['sharma', 'Barricade.'],
        ['player', 'Kisse?'],
        R('sharma', 'Tumse.', 'silence'),
      ],
      effects: { aura: 2 },
    },
    {
      intent: 'Ask his first name',
      beats: [
        ['player', 'Aapka naam? Pehla wala.'],
        ['sharma', 'Pehla wala.'],
        ['player', 'Haan.'],
        ['sharma', 'Constable.'],
      ],
      effects: { aura: 1, flags: ['sharma-knows-name'] },
    },
    {
      intent: 'Tell him he looks bored',
      beats: [
        ['player', 'Aap bore lag rahe ho.'],
        ['sharma', 'Bore.'],
        ['player', 'Haan.'],
        ['sharma', 'Duty hai. Duty mein bore hote hain. Mazaa aaye toh woh chhutti hai.'],
      ],
      effects: { aura: 2, nuisance: 2, mood: { sharma: 'amused' } },
    },
  ], { priority: 1 }),
  talk('sharma-m-garmi', 'morning', [
    ['sharma', 'Paani hai?'],
    ['player', 'Nahi.'],
    ['sharma', 'Nahi. Theek. Mere paas bhi nahi. Barah baje tak koi nahi aayega. Barah ke baad bhi.'],
  ], [
    {
      intent: 'Offer to fetch him a chai from Asha',
      beats: [
        ['player', 'Asha aunty se chai le aaun?'],
        ['sharma', 'Asha.'],
        ['player', 'Haan.'],
        ['sharma', 'Chalees udhaar hai. Mat lana. Woh poochhegi.'],
      ],
      effects: { help: 2, mood: { sharma: 'amused' } },
    },
    {
      intent: 'Tell him a constable should carry his own water',
      beats: [
        ['player', 'Police wale ko apna paani rakhna chahiye.'],
        ['sharma', 'Rakhna chahiye.'],
        ['sharma', 'Likh ke de do. Rao sir ko. Unko bhi pata chale.'],
      ],
      effects: { aura: 2, mood: { sharma: 'annoyed' } },
    },
  ]),
  talk('sharma-m-soft', 'morning', [
    ['sharma', 'Tum. Career wale.'],
    ['sharma', 'Maine socha. SSC ka form. Tum bharoge?'],
  ], [
    {
      intent: 'Say yes, to make his day',
      beats: [
        ['player', 'Haan. Bharunga.'],
        ['sharma', 'Bharunga.'],
        R('sharma', 'Achha. ...Achha. Maths pe dhyan dena. Reasoning mein sab fail hote hain. Main bhi hua tha.', 'silence'),
      ],
      effects: { help: 3, mood: { sharma: 'soft' } },
    },
    {
      intent: 'Say you want to be a reel creator instead',
      beats: [
        ['player', 'Nahi. Main reels banaunga.'],
        ['sharma', 'Reels.'],
        ['player', 'Haan.'],
        ['sharma', 'Pension milti hai?'],
      ],
      effects: { aura: 4 },
    },
  ], { requires: { did: ['career-counselling'], mood: { sharma: ['soft', 'amused'] } }, priority: 7 }),
  talk('sharma-m-annoyed', 'morning', [
    ['sharma', 'Phir se?'],
    ['player', 'Bas ek baat...'],
    ['sharma', 'Ek baat. Subah se tumhari ek baat chal rahi hai. Meena ne video bana liya. Mera. Yadav hans raha hai.'],
  ], [
    {
      intent: 'Apologise and walk away',
      beats: [
        ['player', 'Sorry. Jaata hoon.'],
        ['sharma', 'Jaata hoon.'],
        ['sharma', '...Jao. Haan. Jao. Aur Meena se video delete karwa dena.'],
      ],
      effects: { heat: -4, mood: { sharma: 'bored' } },
    },
    {
      intent: 'Tell him the video is actually doing numbers',
      beats: [
        ['player', 'Waise video chal raha hai. Do hazaar views.'],
        ['sharma', 'Do hazaar.'],
        R('sharma', 'Mere gaon mein do hazaar log nahi hain.', 'silence'),
      ],
      effects: { aura: 5, heat: 5 },
    },
  ], { requires: { did: ['career-counselling'], mood: { sharma: ['annoyed'] } }, priority: 7 }),

  // --- midday ---
  talk('sharma-d-speech', 'midday', [
    ['sharma', 'Bhashan sun rahe ho?'],
    ['player', 'Haan.'],
    ['sharma', 'Main bhi. Duty pe. Koi farq nahi.'],
  ], [
    {
      intent: 'Ask what he thinks of Mira\'s speech',
      beats: [
        ['player', 'Aapko kaisa laga?'],
        ['sharma', 'Kaisa laga.'],
        ['sharma', 'Mujhe lagna allowed nahi hai. Rao sir ko lagta hai. Woh bataenge mujhe kaisa laga.'],
      ],
      effects: { aura: 1 },
    },
    {
      intent: 'Repeat his words back to him, to see what happens',
      beats: [
        ['player', 'Koi farq nahi.'],
        ['sharma', 'Koi farq nahi?'],
        ['player', 'Koi farq nahi.'],
        R('sharma', 'Tum mujhe copy kar rahe ho.', 'laugh'),
      ],
      effects: { aura: 4, nuisance: 3, mood: { sharma: 'amused' } },
    },
  ], { priority: 1 }),
  talk('sharma-d-neta', 'midday', [
    ['sharma', 'Neta aaya.'],
    ['player', 'LJM wale?'],
    ['sharma', 'Photo khichwaayi. Mere saath. Bina poochhe. Ab main unke poster pe hoon. "Police bhi saath hai."'],
  ], [
    {
      intent: 'Congratulate him on his political debut',
      beats: [
        ['player', 'Badhai ho. Aap neta ban gaye.'],
        ['sharma', 'Neta.'],
        ['sharma', 'Transfer ho jaayega. Gurgaon. Yadav ka bhi wahi hua tha. Ek photo.'],
      ],
      effects: { aura: 3, mood: { sharma: 'annoyed' } },
    },
    {
      intent: 'Offer to get Zoya to post the uncropped photo',
      beats: [
        ['player', 'Zoya ko bolta hoon poori photo daale. Jisme aap pareshan dikh rahe ho.'],
        ['sharma', 'Pareshan.'],
        ['sharma', 'Haan. Woh achha hai. Pareshan wala. Usme main duty pe hoon.'],
      ],
      effects: { help: 4, mood: { sharma: 'soft' } },
    },
  ], { requires: { after: '13:00' } }),
  talk('sharma-d-verma', 'midday', [
    ['sharma', 'Verma sir.'],
    ['player', 'Haan?'],
    ['sharma', 'Main. Verma sir. Kabir ki mummy ka phone aaya tha. Phir se. Poochh rahi thi homework diya ya nahi.'],
  ], [
    {
      intent: 'Ask him what homework he gave',
      beats: [
        ['player', 'Kya homework diya?'],
        ['sharma', 'Kya homework diya.'],
        R('sharma', 'Chapter teen. Gati. Motion. Maine bola "Newton ka teesra niyam. Har kriya ki pratikriya." Unhone note kiya.', 'laugh'),
      ],
      effects: { aura: 4, mood: { sharma: 'amused' } },
    },
    {
      intent: 'Tell him he should quit and actually teach',
      beats: [
        ['player', 'Aap teacher ban jao. Sach mein.'],
        ['sharma', 'Teacher.'],
        ['sharma', '...Pension?'],
        ['player', 'Nahi.'],
        ['sharma', 'Toh nahi.'],
      ],
      effects: { help: 3, mood: { sharma: 'soft' } },
    },
  ], { requires: { flags: ['sharma-tuition-teacher'] }, priority: 8 }),
  talk('sharma-d-bhanja', 'midday', [
    ['sharma', 'Bhanja.'],
    ['player', 'Haan, mama ji?'],
    ['sharma', 'Tomar poochh raha tha. Meri bahan ka naam. Maine bola "Didi". Usne bola "naam?" Maine bola "Didi hi hai naam".'],
  ], [
    {
      intent: 'Give him a name for his made-up sister',
      beats: [
        ['player', 'Bol dena Sunita. Sunita masi... matlab mummy.'],
        ['sharma', 'Sunita.'],
        R('sharma', 'Sunita didi. Haan. Ab mujhe yaad rakhna padega. Mere asli bahan ka naam Kamla hai. Woh naraz hogi.', 'laugh'),
      ],
      effects: { help: 3, mood: { sharma: 'soft' } },
    },
    {
      intent: 'Ask for pocket money, as a proper bhanja',
      beats: [
        ['player', 'Mama ji, kuch pocket money?'],
        ['sharma', 'Pocket money.'],
        ['sharma', 'Das rupaye. Asha ke yahan chai pi lena. Mere khaate mein. ...Woh khaata band hai. Apne khaate mein.'],
      ],
      effects: { aura: 4, nuisance: 2, mood: { sharma: 'amused' } },
    },
  ], { requires: { flags: ['sharma-bhanja'] }, priority: 7 }),
  talk('sharma-d-cp', 'midday', [
    ['sharma', 'Rao sir CP bhejte hain. Phir barricade. Phir CP. Main ludo ki goti hoon.'],
  ], [
    {
      intent: 'Ask who is winning the ludo',
      beats: [
        ['player', 'Jeet kaun raha hai?'],
        ['sharma', 'Jeet kaun raha hai.'],
        ['sharma', 'Wireless.'],
      ],
      effects: { aura: 2 },
    },
    {
      intent: 'Tell him CP is better, there is chai',
      beats: [
        ['player', 'CP achha hai. Chai hai.'],
        ['sharma', 'Chai hai. Udhaar bhi hai. Asha dekh rahi hai.'],
      ],
      effects: { aura: 1 },
    },
  ]),

  // --- tense ---
  talk('sharma-t-raf', 'tense', [
    ['sharma', 'RAF aa gayi.'],
    ['player', 'Toh?'],
    ['sharma', 'Toh ab main "local" hoon. Local ko koi kuch nahi poochhta. Bas khade raho. Main khada hoon.'],
  ], [
    {
      intent: 'Ask what the RAF jawan beside him is like',
      beats: [
        ['player', 'Woh jawan kaisa hai?'],
        ['sharma', 'Pandey. Muzaffarpur. Litchi ki baat karta hai. Bas litchi ki.'],
        ['sharma', 'Mujhe litchi pasand nahi. Maine bataya nahi. Dosti hai.'],
      ],
      effects: { help: 2 },
    },
    {
      intent: 'Tell him he has been demoted',
      beats: [
        ['player', 'Matlab aapka demotion ho gaya.'],
        ['sharma', 'Demotion.'],
        R('sharma', 'Constable ka demotion nahi hota. Neeche kuch nahi hai. Bas barricade.', 'silence'),
      ],
      effects: { aura: 3, mood: { sharma: 'annoyed' } },
    },
  ], { priority: 1 }),
  talk('sharma-t-soft', 'tense', [
    ['sharma', 'Suno.'],
    ['sharma', 'Teen baje ke baad idhar mat aana. Line lagegi. Tomar aage hoga. Tomar ko tumhara chehra yaad hai.'],
  ], [
    {
      intent: 'Ask him to have a word with Tomar',
      beats: [
        ['player', 'Aap Tomar ko bol do na. Thanda rahe.'],
        ['sharma', 'Thanda.'],
        ['sharma', 'Tomar! Chai. Asha ke yahan. Meri taraf se. ...Udhaar.'],
      ],
      effects: { help: 4, heat: -6 },
      do: ['calm:c3'],
    },
    {
      intent: 'Tell him you will be here anyway',
      beats: [
        ['player', 'Main aaunga. Mere dost yahin honge.'],
        ['sharma', 'Dost yahin honge.'],
        ['sharma', 'Toh peeche rehna. Mere peeche. Line ke nahi. Mere.'],
      ],
      effects: { aura: 3, heat: 3 },
    },
  ], { requires: { mood: { sharma: ['soft'] }, notFlags: ['sharma-done-with-you'] }, priority: 7 }),
  talk('sharma-t-cannon', 'tense', [
    ['sharma', 'Water cannon.'],
    ['player', 'Haan?'],
    ['sharma', 'Tumne maanga tha. Rao sir ne suna. Ab aa raha hai. Token system.'],
  ], [
    {
      intent: 'Ask him to cancel the order',
      beats: [
        ['player', 'Cancel kar do na.'],
        ['sharma', 'Cancel.'],
        ['sharma', 'Swiggy hai kya?'],
      ],
      effects: { aura: 3 },
    },
    {
      intent: 'Ask for a front-row spot when it sprays',
      beats: [
        ['player', 'Mujhe front row chahiye. Jab chale.'],
        ['sharma', 'Front row.'],
        R('sharma', 'Main bhi front row mein hoon. Mujhe kisi ne nahi poochha.', 'silence'),
      ],
      effects: { aura: 4, heat: 4 },
    },
  ], { requires: { flags: ['cannon-requested'] }, priority: 6 }),
  talk('sharma-t-bottle', 'tense', [
    ['sharma', 'Bottle.'],
    ['player', 'Haan?'],
    ['sharma', 'Thandi thi. Maine socha nahi tha koi dega. Tumne diya. Sana naraz hai. Maine dekha.'],
  ], [
    {
      intent: 'Tell him to thank Sana, not you',
      beats: [
        ['player', 'Sana ko thank you bolo. Bottle uski thi.'],
        ['sharma', 'Sana ko.'],
        ['sharma', '...Theek. Ja ke bolta hoon. Duty ke baad. Agar duty khatam hui.'],
      ],
      effects: { help: 4, mood: { sharma: 'soft', sana: 'amused' } },
    },
    {
      intent: 'Ask for a favour in return',
      beats: [
        ['player', 'Ek favour toh banta hai ab.'],
        ['sharma', 'Favour.'],
        ['sharma', 'Ek bottle ka ek favour. Chhota. Bahut chhota. Bottle ke size ka.'],
      ],
      effects: { aura: 2, flags: ['seen-as-chamcha'] },
    },
  ], { requires: { flags: ['sharma-bottle'] }, priority: 6 }),
  talk('sharma-t-line', 'tense', [
    ['sharma', 'Peeche.'],
    ['player', 'Main toh bas...'],
    ['sharma', 'Bas. Sab bas. Peeche.'],
  ], [
    {
      intent: 'Step back without a word',
      beats: [
        ['player', '(peeche hota hai)'],
        ['sharma', 'Haan. Aise. Sab aise karein toh main ghar jaaun.'],
      ],
      effects: { heat: -4, aura: -2 },
    },
    {
      intent: 'Step forward instead, one tiny step',
      beats: [
        ['player', '(ek chhota kadam aage)'],
        ['sharma', '...'],
        R('sharma', 'Ye kadam tha?', 'silence'),
        ['player', 'Haan.'],
        ['sharma', 'Note kiya.'],
      ],
      effects: { aura: 5, heat: 8, mood: { sharma: 'annoyed' } },
    },
  ], { requires: { after: '14:45' } }),

  // --- showdown ---
  talk('sharma-s-run', 'showdown', [
    R('sharma', 'Bhaago.', 'cut'),
    ['player', 'Kahan?'],
    ['sharma', 'Kahin bhi. Idhar nahi.'],
  ], [
    {
      intent: 'Ask him where "kahin bhi" is, exactly',
      beats: [
        ['player', 'Kahin bhi matlab?'],
        ['sharma', 'Kahin bhi matlab kahin bhi.'],
        ['sharma', 'Metro. Ghar. Asha ka tirpal. Gurgaon. Idhar nahi.'],
      ],
      effects: { heat: -3 },
    },
    {
      intent: 'Refuse: you stay with the crowd',
      beats: [
        ['player', 'Nahi. Main yahin hoon.'],
        ['sharma', 'Yahin.'],
        R('sharma', 'Theek. Toh baith jao. Khade logon pe lathi padti hai. Baithe logon pe kam.', 'silence'),
      ],
      effects: { aura: 6, heat: 6 },
      do: ['stance:hold'],
    },
  ], { priority: 1 }),
  talk('sharma-s-soft', 'showdown', [
    ['sharma', 'Tum. Idhar.'],
    ['sharma', 'Is taraf. Mere peeche. Gali hai. Kisi ne nahi dekha. Main bhi nahi dekh raha.'],
  ], [
    {
      intent: 'Ask him to get your friends out too',
      beats: [
        ['player', 'Mere dost bhi. Bus mein hain shayad.'],
        ['sharma', 'Dost bhi.'],
        ['sharma', 'Pandey! Teen bachche. Bus se. Mera naam lo. ...Mera naam mat lo. Bas le aao.'],
      ],
      effects: { help: 8, heat: 4 },
      do: ['release:kabir', 'release:nikhil', 'release:meera'],
    },
    {
      intent: 'Turn him down: you leave with everyone or not at all',
      beats: [
        ['player', 'Nahi. Main sabke saath jaunga.'],
        ['sharma', 'Sabke saath.'],
        R('sharma', 'Achha ladka hai. Bewakoof hai.', 'silence'),
      ],
      effects: { aura: 6, heat: 4 },
    },
    {
      intent: 'Take the gali, alone and fast',
      beats: [
        ['player', 'Thanks. Jaata hoon.'],
        ['sharma', 'Jaata hoon. Haan. Jao. Mujhe yaad mat rakhna. Main tumhe yaad nahi rakhunga.'],
      ],
      effects: { heat: -12, aura: -3 },
      do: ['target:none'],
    },
  ], { requires: { mood: { sharma: ['soft'] }, notFlags: ['sharma-done-with-you'] }, priority: 8 }),
  talk('sharma-s-annoyed', 'showdown', [
    ['sharma', 'Tum. Phir.'],
    ['sharma', 'Subah se. Tum. Har jagah. Tum.'],
  ], [
    {
      intent: 'Run',
      beats: [
        ['player', '(bhaagta hai)'],
        ['sharma', 'Bhaag raha hai. ...Haan. Theek. Main nahi bhaagunga. Ghutna.'],
      ],
      effects: { heat: -2, aura: -2 },
    },
    {
      intent: 'Push your luck with one more joke',
      beats: [
        ['player', 'Uncle aap gusse mein bhi cute ho.'],
        ['sharma', 'Cute.'],
        R('sharma', 'Ruko. Ruko! Idhar aao!', 'cut'),
      ],
      effects: { aura: 6, heat: 14 },
      do: ['chase:sharma'],
    },
  ], { requires: { mood: { sharma: ['annoyed'] } }, priority: 6 }),
  talk('sharma-s-wireless', 'showdown', [
    ['wireless', 'Sharma. Sharma! Position?'],
    ['sharma', 'Barricade, sir.'],
    ['wireless', 'Bheed kitni?'],
    ['sharma', '(tumhari taraf dekhta hai) Ek.'],
  ], [
    {
      intent: 'Wave at the wireless',
      beats: [
        ['player', 'Namaste Rao sir!'],
        R('wireless', '...Ek kaun hai Sharma?', 'silence'),
        ['sharma', 'Koi nahi sir. Hawa.'],
      ],
      effects: { aura: 5, heat: 6 },
    },
    {
      intent: 'Stay quiet and let him cover for you',
      beats: [
        ['player', '(chup)'],
        ['sharma', 'Koi nahi sir. Khaali hai. Sab chale gaye.'],
        ['sharma', '(tumse) Chale jao. Taaki main jhooth na bolun.'],
      ],
      effects: { heat: -6, mood: { sharma: 'soft' } },
    },
  ]),

  // --- aftermath ---
  talk('sharma-a-duty', 'aftermath', [
    ['sharma', 'Duty khatam?'],
    ['player', 'Aapki?'],
    ['sharma', 'Saade chhe. Phir report. Phir ghar. Phir kal. Phir duty.'],
  ], [
    {
      intent: 'Ask him what he will write in the report',
      beats: [
        ['player', 'Report mein kya likhoge?'],
        ['sharma', 'Report.'],
        ['sharma', '"Sthiti niyantran mein." Hamesha yahi. Sthiti kabhi niyantran mein nahi hoti. Report hoti hai.'],
      ],
      effects: { aura: 2 },
    },
    {
      intent: 'Ask him to put you on the bus, for the experience',
      beats: [
        ['player', 'Mujhe bhi bus mein daal do. Experience ke liye.'],
        ['sharma', 'Experience.'],
        ['sharma', 'Saade paanch tak free hai. Bus. Rawat ji. Kele wale uncle. Jao. Experience lo.'],
      ],
      effects: { aura: 4, heat: 6, flags: ['sharma-bus-ride'] },
      do: ['detain:player'],
    },
    {
      intent: 'Ask about his transfer',
      beats: [
        ['player', 'Transfer ka kya hua?'],
        ['sharma', 'Transfer.'],
        R('sharma', 'Yadav ka ho gaya. Gurgaon. Woh khush hai. Main yahin hoon. Main bhi khush hoon. Shayad.', 'silence'),
      ],
      effects: { help: 2, mood: { sharma: 'soft' } },
    },
  ], { priority: 1 }),
  talk('sharma-a-tomorrow', 'aftermath', [
    ['sharma', 'Kal aaoge?'],
    ['player', 'Pata nahi.'],
    ['sharma', 'Pata nahi. Main aaunga. Barricade bhi. Hum dono pakka.'],
  ], [
    {
      intent: 'Promise to bring him chai tomorrow',
      beats: [
        ['player', 'Kal chai laaunga. Udhaar nahi, cash.'],
        ['sharma', 'Cash.'],
        R('sharma', 'Asha behosh ho jaayegi.', 'laugh'),
      ],
      effects: { help: 3, mood: { sharma: 'amused' } },
    },
    {
      intent: 'Tell him you hope the barricade is gone by then',
      beats: [
        ['player', 'Umeed hai kal barricade na ho.'],
        ['sharma', 'Na ho.'],
        ['sharma', 'Phir main kahan khada houn?'],
      ],
      effects: { aura: 3 },
    },
  ]),
  talk('sharma-a-soft', 'aftermath', [
    ['sharma', 'Suno. Ek baat.'],
    ['sharma', 'Aaj... theek tha. Tum. Theek the.'],
    R('sharma', 'Kisi ko batana mat.', 'silence'),
  ], [
    {
      intent: 'Tell everyone immediately',
      beats: [
        ['player', 'SHARMA JI NE BOLA MAIN THEEK THA!'],
        ['sharma', 'Maine nahi bola.'],
        ['sharma', 'Kabhi nahi bola. Report mein bhi nahi.'],
      ],
      effects: { aura: 5, mood: { sharma: 'amused' } },
    },
    {
      intent: 'Say "aap bhi theek the" back to him',
      beats: [
        ['player', 'Aap bhi theek the.'],
        ['sharma', 'Main bhi theek tha.'],
        ['sharma', '...Haan. Ghar jao. Mummy wait kar rahi hogi. Sabki karti hai.'],
      ],
      effects: { help: 4 },
    },
  ], { requires: { mood: { sharma: ['soft'] } }, priority: 6 }),
  talk('sharma-a-cute', 'aftermath', [
    ['sharma', 'Duty khatam.'],
    ['player', 'Toh?'],
    ['sharma', 'Subah tumne kuch bola tha. Maine bola duty ke baad dekhenge. Duty ke baad hai.'],
  ], [
    {
      intent: 'Say it again, now that he is off duty',
      beats: [
        ['player', 'Uncle aap cute ho.'],
        ['sharma', 'Cute.'],
        R('sharma', '...Meena ko mat batana. Usne subah se teen baar reel bheji hai. Mere hi phone pe.', 'laugh'),
      ],
      effects: { aura: 6, mood: { sharma: 'soft' } },
    },
    {
      intent: 'Pretend you never said it',
      beats: [
        ['player', 'Maine? Kab?'],
        ['sharma', 'Kab.'],
        R('sharma', 'Theek. Kabhi nahi. Achha hai. Main bhi bhool gaya.', 'silence'),
      ],
      effects: { aura: -2, mood: { sharma: 'bored' } },
    },
  ], { requires: { flags: ['uncle-cute'] }, priority: 7 }),
  talk('sharma-a-register', 'aftermath', [
    ['sharma', 'Register.'],
    ['player', 'Kya?'],
    ['sharma', 'Tumhara naam. Register mein. Rao sir ne padha. Do baar. Ek baar zor se.'],
  ], [
    {
      intent: 'Ask if it can be rubbed out',
      beats: [
        ['player', 'Mita sakte ho?'],
        ['sharma', 'Mita sakte ho.'],
        ['sharma', 'Pen se likha hai. Pencil nahi. Pencil hota toh shayad.'],
      ],
      effects: { heat: -2 },
    },
    {
      intent: 'Ask how your name looked written down',
      beats: [
        ['player', 'Achha dikh raha tha?'],
        ['sharma', 'Achha dikh raha tha.'],
        R('sharma', 'Spelling galat thi. Maine theek nahi ki.', 'laugh'),
      ],
      effects: { aura: 3 },
    },
  ], { requires: { flags: ['name-in-register'] }, priority: 5 }),
  talk('sharma-a-detainme', 'aftermath', [
    ['sharma', 'Tum woh ho na. "Mujhe bhi detain kar lo" wale.'],
    ['player', 'Haan.'],
    ['sharma', 'Haan. Thane mein sab baat kar rahe the. Pehli baar kisi ne khud maanga. Inspector sahab ne chai mangwayi. Shock mein.'],
  ], [
    {
      intent: 'Ask if you are famous at the thana now',
      beats: [
        ['player', 'Main famous hoon wahan?'],
        ['sharma', 'Famous.'],
        ['sharma', 'Rawat ji ne forward kar diya. Teen group mein. Ek group mein unki mummy hain.'],
      ],
      effects: { aura: 4, heat: 2 },
    },
    {
      intent: 'Say you will never do it again',
      beats: [
        ['player', 'Dobara nahi karunga.'],
        ['sharma', 'Dobara nahi.'],
        ['sharma', 'Sab yahi bolte hain. Phir aate hain. Main yahin milunga.'],
      ],
      effects: { help: 2 },
    },
  ], { requires: { flags: ['detain-me-done'] }, priority: 5 }),
];

// ----------------------------------------------------------------------------------------------------------
// REACTS: what each of them says right after something happens (kind = the happen() calls in rules.js).
// ----------------------------------------------------------------------------------------------------------
const REACTS = {
  asha: {
    'bus-key': [['asha', 'Iqbal bhai ki chabi! Haaye. Ye khabar mujhe khud pata chali. Pehli baar kisi ne mujhe nahi bataya.']],
    'bus-stalled': [['asha', 'Bus ruk gayi. Ab sab mere stall pe. Chabi jisne bhi li, usko meri taraf se shukriya. Chupke se.']],
    chase: [['asha', 'Bhaago bhaago! Stall ke peeche se! Kettle se bach ke!']],
    caught: [['asha', 'Pakad liya? Haaye. Kis thane? Main chai bhijwa dungi. Udhaar pe.']],
    'speaker-party': [['asha', 'CP pe disco! Pachchees saal mein pehli baar chai ke saath bass. Dhanda double.']],
    'biryani-rush': [['asha', 'Biryani? Kahan? Mere stall pe? Main sirf chai bechti hoon! ...Achha, das chai do, biryani ka intezaar karo.']],
    'cannon-scare': [['asha', 'Water cannon? Kaun bola? Main nahi boli. Maine sirf "suna hai" bola tha. Farq hai.']],
    'stone-thrown': [['asha', 'Pathar! Dekha? Naye joote wale. Maine bola tha. Kisi ne nahi suna. Sach ka koi forward nahi karta.']],
    gas: [['asha', 'Neembu! Neembu lo! Aankh malo mat, neembu soongho!']],
    charge: [['asha', 'Baitho! Stall ke peeche! Pachchees saal mein ye teesri baar hai. Chauthi baar main bhi lathi utha lungi.']],
    'cannon-spray': [['asha', 'Itna paani. Sana bitiya ke tent mein ek bottle nahi tha, aur yahan sadak dho rahe hain.']],
    'provocateur-exposed': [['asha', 'Pakda gaya! Naye joote wala! Ab chai ke paise bhi do, das ke das.']],
    faint: [['asha', 'Koi gira? Chai nahi, paani! Paani laao koi! Mere paas sirf chai hai, haaye.']],
  },
  sana: {
    heat: [['sana', 'Dekha? Do baje. Dhoop. Paani nahi. Maine subah bola tha. Ab sab dekh rahe hain, koi madad nahi kar raha.']],
    faint: [['sana', 'Pair oopar! Sar nahi, pair! Bheed mat lagao, hawa aane do!']],
    gas: [['sana', 'Aankh mat malo! Sirf paani! Mere tent pe aao, line mein. Line mein nahi toh bhi aao.']],
    charge: [['sana', 'Safed tent! Safed tent ki taraf! Yahan koi nahi maarega. Zyada nahi.']],
    'cannon-spray': [['sana', 'Bheege hue log aa rahe hain. Thand lagegi. Garmi mein thand. Aaj kuch bhi ho sakta hai.']],
    'stone-thrown': [['sana', 'Pathar kisne phenka? Kisi ko laga? Sar pe? Mere paas laao. Abhi.']],
    caught: [['sana', 'Bus mein le gaye? Wahan paani hai? Nahi hoga. Main ek bottle bhejti hoon. Agar bottle hui.']],
    chase: [['sana', 'Bhaago mat! Bhaagoge toh giroge, giroge toh mere paas aaoge! Main busy hoon!']],
    'speaker-party': [['sana', 'Naach rahe hain dhoop mein. Badhiya. Do baje yahi log mere paas honge.']],
    'detainees-escape': [['sana', 'Bus se bhaage? Pehle mere paas aao. Haath dikhao. Kaat toh nahi? Theek. Ab bhaago.']],
    'biryani-rush': [['sana', 'Biryani ke liye bhaage? Garmi mein? Mujhe ek baar bolte, main bata deti biryani nahi hai. Kabhi nahi hoti.']],
  },
  ravi: {
    'speaker-party': [['ravi', 'MERA BACHCHA! CP pe! Kisne chalaya?! ...Sound toh achha aa raha hai. Nahi! Wapas do!']],
    'bus-key': [['ravi', 'Iqbal chacha ki chabi gayi? Aaj chori ka din hai. Main apna bachcha pakad ke rakhta hoon.']],
    singalong: [['ravi', 'Sab gaa rahe hain! Bhaukaal ne kiya ye. Mira didi bhi gaa rahi hain? Nahi. Unke hont hil rahe hain. Thoda.']],
    roast: [['ravi', 'Haha! Mic pe roast! Battery waste hui, par waste achha tha.']],
    'stone-thrown': [['ravi', 'Pathar! Speaker ke paas mat aana koi! Pathar se Bhaukaal ka kaan jaata hai!']],
    gas: [['ravi', 'Dhuan! Bhaukaal ko dhako! Mera dupatta! Kisi ka bhi dupatta!']],
    charge: [['ravi', 'Lathi! Speaker uthao! Neeche se! Neeche se pakdo!']],
    'cannon-spray': [['ravi', 'Paani! Speaker pe paani! Bhaukaal waterproof nahi hai! Woh Bluetooth hai, Bluetooth paani se darta hai!']],
    'detainees-escape': [['ravi', 'Bus se bhaage! Ruko, gaana bajata hoon. Bhaagne ke liye background music chahiye.']],
    caught: [['ravi', 'Pakde gaye? Main gaana dedicate karta hoon. "Bus mein baithe dost ke liye." Sad wala.']],
    'cannon-dance': [['ravi', 'Water cannon ke saamne naach! Main beat de raha hoon! Bhaukaal, aaj tera concert hai!']],
  },
  iqbal: {
    'bus-key': [['iqbal', 'Meri chabi! Laal dhaaga wali! Kisne...? ...Main chehra yaad rakh raha hoon. Bas.']],
    'bus-stalled': [['iqbal', 'Bus khadi hai. Main bhi khada hoon. Hum dono intezaar kar rahe hain. Kiska, pata nahi.']],
    chase: [['iqbal', 'Bhaag raha hai koi. Main nahi bhaagunga. Ghutna. Main bas dekhunga.']],
    caught: [['iqbal', 'Pakda gaya. Ab meri bus mein baithega. Chalo, kam se kam AC... nahi, AC kharab hai.']],
    'detainees-escape': [['iqbal', 'Meri bus se bhaage! Peeche ka darwaza. Maine pandrah saal se bola hai woh kharab hai. Kisi ne nahi suna.']],
    charge: [['iqbal', 'Bus mein mat chadho! Matlab... chadho? Main confused hoon. Mujhe kisi ne kuch nahi bataya!']],
    gas: [['iqbal', 'Aankh jal rahi hai. Bus ki khidki band karo! Nahi, kholo! Andar log hain!']],
    'speaker-party': [['iqbal', 'CP pe gaana. Meri bus ke saamne. Sab naach rahe hain, koi chadh nahi raha. Shuttle khaali jaayega.']],
    'stone-thrown': [['iqbal', 'Pathar. Bus ka shisha mat todna, mera hai! Matlab sarkaar ka hai. Par main chalata hoon!']],
    'cannon-scare': [['iqbal', 'Water cannon ka sun ke koi bus mein nahi chadh raha. Main khaali bus le ke jaata hoon. Jaise koi bhoot ki bus.']],
  },
  sharma: {
    'bus-key': [['sharma', 'Chabi.'], ['sharma', 'Kisne li? ...Mujhe kya. Bus meri nahi hai.']],
    'speaker-party': [['sharma', 'Gaana.'], ['sharma', 'Permission nahi hai. Pair hil raha hai. Permission nahi hai.']],
    chase: [['sharma', 'Bhaag raha hai.'], ['sharma', 'Tomar bhaagega. Main nahi. Main barricade hoon.']],
    caught: [['sharma', 'Pakda gaya.'], ['sharma', 'Haan. Bus mein jaayega. Phir chhootega. Phir aayega.']],
    'stone-thrown': [['sharma', 'Pathar.'], ['sharma', 'Kisne? ...Naye joote. Maine dekha. Main report mein likhunga. Koi nahi padhega.']],
    gas: [['sharma', '(khaans ke) Gas.'], ['sharma', 'Mujhe bhi lagti hai. Kisi ko nahi pata. Uniform mein bhi aankh hai.']],
    charge: [['sharma', 'Charge.'], ['sharma', 'Meri line nahi hai. Main peeche hoon. Peeche raho. Mere peeche.']],
    'cannon-spray': [['sharma', 'Paani.'], ['sharma', 'Subah paani nahi tha. Ab itna paani. Sarkaar.']],
    'pester-career': [['sharma', 'Career.'], ['sharma', 'Har koi aaj career poochh raha hai. Main career fair hoon kya?']],
    'detainees-escape': [['sharma', 'Bhaag gaye.'], ['sharma', 'Bus se. Rawat ji forward padh rahe the. Mera kya.']],
    'provocateur-exposed': [['sharma', 'Naye joote wala.'], ['sharma', 'Usko pakdo. Haan, usko. Tumhe nahi. Abhi nahi.']],
    faint: [['sharma', 'Gira.'], ['sharma', 'Paani hota toh na girta. Maine bola tha. Kisi ko nahi. Par bola tha.']],
  },
};

// ----------------------------------------------------------------------------------------------------------
// BRUSHOFF: once they've said everything they had for now. Short, distinct, never the same twice in a row.
// Twelve each, so a whole day of pestering goes a long way before one comes round again.
// ----------------------------------------------------------------------------------------------------------
const BRUSHOFF = {
  asha: [
    'Chai lo ya jao. Gossip ka refill nahi hota.',
    'Pehli khabar free thi. Doosri ke das rupaye.',
    'Abhi kuch naya nahi hua. Dus minute ruko, ho jaayega.',
    'Kettle ubal rahi hai. Tum bhi ubal rahe ho. Dono thande ho jao.',
    'Beta, line peeche se. Line mein bhi baatein hoti hain.',
    'Mujhe sab pata hai, par sab abhi nahi bataungi.',
    'Glass wapas karo pehle. Phir baat.',
    'Aaj tum kitni baar aaye ho? Register mein likh rahi hoon.',
    'Mere paas khabar hai, cheeni khatam hai. Ek hi cheez milegi.',
    'Rawat ji ko poochho. Unke phone mein mujhse zyada hai. Galat hai, par zyada hai.',
    'Haan haan. Suna. Sab suna. Ab tum suno, chai thandi ho rahi hai.',
    'Abhi nahi. Abhi customer hai. Tum customer nahi ho, tum audience ho.',
  ],
  sana: [
    'Chakkar aa raha? Nahi? Toh tent khaali karo.',
    'Paani, paani, paani. Mera poora din isi ek shabd pe hai.',
    'Agar crate dikhe toh uthake le aao. Bas. Itna hi.',
    'Main busy hoon. Busy dikh nahi rahi, par hoon.',
    'Kela mat dekho. Kela tumhare liye nahi hai.',
    'Haath dhoye? Nahi? Toh tent ko mat chhoona.',
    'Tum theek ho. Sach mein. Ab kisi aur ke liye jagah do.',
    'Medical student hoon, therapist nahi. Dono ki fees alag.',
    'Pair mein chhaala? Chappal badlo. Baat khatam.',
    'Abhi do log behosh hone wale hain, mujhe pata hai. Tum unme se nahi ho.',
    'ORS ek packet. Ek. Do maangoge toh doctor ne mana kiya hai.',
    'Jao, kisi ko paani pilao. Mujhe nahi, kisi ko.',
  ],
  ravi: [
    'Haan bhai, wahi speaker. Kitni baar bataun?',
    'Tum census wale ho kya? Sab poochh rahe ho.',
    'Bhaukaal ko mat chhoona. Dekh sakte ho. Door se.',
    'Ek do teen. Ek do teen. Sorry, aadat hai.',
    'Battery bachani hai. Baatein bhi.',
    'Gaane ki farmaish? Paper pe likh ke do. Main nahi padhunga, par do.',
    'Abhi soundcheck chal raha hai. Mera bhi, speaker ka bhi.',
    'Side se mat pakadna kabhi. Yaad rakhna. Bas.',
    'Mira didi bol rahi hain. Ya bolne wali hain. Ya bol chuki hain. Shhh.',
    'Mera cable dekha? Kaala, lamba, thoda gussa.',
    'Bass kam karun? Nahi. Bass kabhi kam nahi hota.',
    'Baad mein aana. Baad mein main free hoon, speaker nahi.',
  ],
  iqbal: [
    'Bola na, hook pe chabi. Ab mujhe chai peene do.',
    'Bhai, meter chalu hai kya? Itne sawaal.',
    'Route wahi hai. Sawaal bhi wahi hain. Main bhi wahi.',
    'Mera ghutna kharab hai, dimaag nahi. Seedha bolo.',
    'Chai ke beech baat nahi. Chai ke baad bhi nahi.',
    'Pandrah saal. Pandrah saal se yahi sawaal.',
    'Bus mein baitho ya bus ke saamne se hato. Beech mein kuch nahi.',
    'Beti ka phone aa raha hai. Baad mein.',
    'Clutch tight hai, main bhi. Thoda dheere.',
    'Asha se poochho. Mujhse zyada mere baare mein usko pata hai.',
    'Aaj sab mujhse baat kar rahe hain. Kal koi nahi karega. Achha hai.',
    'Horn suna? Woh meri awaaz hai. Ab chup.',
  ],
  sharma: [
    'Kya hai?',
    'Aage badho.',
    'Bheed mat lagao. Ek aadmi ki bheed bhi bheed hai.',
    'Phir se. Phir se?',
    'Dobara poochhoge toh Rao sir ko bata dunga.',
    'Haan. Suna. Aage.',
    'Duty pe hoon. Baat duty ke baad. Duty khatam nahi hoti.',
    'Tum. Phir tum.',
    'Barricade se door. Do kadam. Teen. Haan.',
    'Mazaak hai?',
    'Main yahin hoon. Tum kahin aur raho.',
    'Bas. Ho gaya.',
  ],
};

export default { TALKS: { asha, sana, ravi, iqbal, sharma }, REACTS, BRUSHOFF };
