// Reel-cinematic ensemble scenes for the slice. Data only, no logic.
//
// Everyone here is fictional. Kabir, Sharma, Meera, Nikhil, Iqbal, Mummy and the RAF jawan are
// composites, not real people. The situations are adapted from reported 2026 protest moments
// (see each scene's `inspiredBy`), then exaggerated. Nothing here claims to be a transcript.
//
// Format (plans/slice-spec.md, "Ensemble scenes"), with a few optional extras the engine may ignore:
//   beat:   { who, line, overlap, react, sfx?, via?, aside? }
//           who    a PEOPLE id, 'player', 'mummy' (voice on Kabir's phone), 'raf' (generic jawan),
//                  'wireless' (Inspector Rao on the radio), 'crowd' (a few bystanders at once)
//           overlap true = starts before the previous line finishes (talk over it)
//           react   null | 'laugh' | 'silence' | 'cut'   (timing mark AFTER the line)
//           sfx     'phone-ring' | 'phone-buzz' | 'wireless' | 'whistle' | 'horn' | 'static' | 'bottle'
//           via     'phone' | 'wireless' | 'window'   (how the voice reaches the scene)
//           aside   true = said quietly, only the player hears it
//   option: { intent, requires, beats, effects, clip?, payoff? }
//           intent   the button label; it is never the spoken line
//           requires { mood: {id: [moods]}, rep: {aura: min, ...}, flags: [all], anyFlags: [one of], notFlags: [] }
//           effects  { aura, heat, help, nuisance, mood: {id: mood}, flags: [] }   (rep deltas)
//           clip     clip kind to post if the player (or Meera) is filming when the option ends
//           payoff   overrides the scene payoff captions for this option
//   overheard: lines you hear from ~15 m before any marker shows (the brief's "Encounter" step)
//   idle:      lines the cast keeps saying while the options are open (control is back, nobody waits)
//   callbacks: { flag: [[who, line], ...] } lines the world says later once that flag is set
//   trigger:   a hint for rules.js; rules.js owns the real trigger
//
// Options are deliberately not in a helpful-first order. Each one is fun and costs something.

export const SCENES = {
  // ---------------------------------------------------------------------------------------------
  // 1. Scale collision. A mother's call outranks a revolution.
  // ---------------------------------------------------------------------------------------------
  'mummy-call': {
    title: 'Mummy ka call',
    place: 'barricade',
    cast: ['kabir', 'sharma', 'meera', 'player'],
    voices: ['mummy'],
    camera: 'phone',
    music: 'scene-mummy',
    inspiredBy: 'Owner lead (unverified): a protester asks a cop to pose as his tuition teacher on a call with his mother.',
    trigger: { from: '13:40', until: '14:00', place: 'barricade', needs: ['kabir', 'sharma'], note: 'Kabir walks past the barricade on his way out for "tuition". Fires before his 14:00 kabir-leaves rule; if this scene keeps him, emit kabir-stays instead.' },
    overheard: [
      ['kabir', 'Bhai, mummy ka call hai. Tuition mein hona chahiye tha. Do baje se. Abhi pauna do hai. Matlab technically main late nahi hoon, main early hoon, galat jagah pe.'],
      ['meera', 'Ruk ruk ruk, ye dobara bol. Camera pe.'],
    ],
    beats: [
      { who: 'kabir', line: 'Toh basically mera point ye hai ki system ko jab tak hum—', overlap: false, react: null },
      { who: 'kabir', line: 'Ek second.', overlap: false, react: null, sfx: 'phone-buzz' },
      { who: 'kabir', line: 'Nahi, ignore. Ignore kar raha hoon. Main ignore karne wala insaan hoon, sab jaante hain.', overlap: false, react: null, sfx: 'phone-ring' },
      { who: 'meera', line: '"Mummy" aur teen dil. Bhai utha le.', overlap: true, react: null },
      { who: 'kabir', line: 'Teen dil isliye kyunki birthday pe unhone khud save kiya tha, mera choice nahi tha, matlab mera bhi tha par— chhod. Irrelevant.', overlap: false, react: 'laugh' },
      { who: 'kabir', line: 'Haan mummy! Haan. Tuition mein hi hoon. Bahut padhai ho rahi hai. Itni zyada ki—', overlap: false, react: null, sfx: 'phone-ring' },
      { who: 'crowd', line: 'Inquilab! Zindabad!', overlap: true, react: null },
      { who: 'mummy', line: 'Toh peeche "zindabad" kaun bol raha hai?', overlap: false, react: 'silence', via: 'phone' },
      { who: 'kabir', line: 'Woh… sir ka teaching style hai. Bahut… revolutionary hai. Literally.', overlap: false, react: null },
      { who: 'mummy', line: 'Sir se baat karao.', overlap: false, react: 'silence', via: 'phone' },
      { who: 'kabir', line: 'Bhai. Bhai, mujhe ek teacher chahiye. Abhi. Koi bhi adult jo thaka hua lage.', overlap: false, react: null, aside: true },
      { who: 'sharma', line: 'Kya dekh rahe ho?', overlap: false, react: null },
      { who: 'meera', line: 'Uniform hata do toh sir bilkul physics wale sir lagte hain.', overlap: false, react: 'silence' },
      { who: 'sharma', line: 'Physics wale sir.', overlap: false, react: null },
      { who: 'mummy', line: 'Hello? Kabir? Network chala gaya kya? Main papa ko de rahi hoon phone.', overlap: true, react: null, via: 'phone' },
      { who: 'kabir', line: 'NAHI. Papa nahi. Mummy, ruko, sir aa rahe hain, sir bas haath dho rahe the.', overlap: true, react: 'cut' },
    ],
    idle: [
      ['mummy', 'Hello? Awaaz aa rahi hai? Kabir?'],
      ['kabir', 'Bhai jaldi. Jaldi. Papa wala tone aa raha hai.'],
      ['sharma', 'Mujhe kyun dekh rahe ho sab?'],
      ['meera', 'Main record kar rahi hoon, koi kuch bhi karo, bas kuch karo.'],
      ['mummy', 'Ye kaunsi tuition hai jahan itna shor hai?'],
      ['kabir', 'Main expire ho raha hoon. Slowly. Live.'],
    ],
    options: [
      {
        intent: 'Keep filming and let Kabir handle it alone',
        requires: {},
        beats: [
          { who: 'kabir', line: 'Mummy, sir abhi… washroom gaye hain.', overlap: false, react: null },
          { who: 'mummy', line: 'Tuition mein washroom hai? Pichhli baar toh bola tha nahi hai, isliye ghar aake jaana padta hai.', overlap: false, react: 'silence', via: 'phone' },
          { who: 'kabir', line: 'Naya bana hai. Renovation. Sir ne khud banwaya. Apne haath se. Bahut dedicated hain.', overlap: false, react: 'laugh' },
          { who: 'meera', line: 'Apne haath se.', overlap: true, react: null },
          { who: 'mummy', line: 'Location bhejo.', overlap: false, react: 'silence', via: 'phone' },
          { who: 'kabir', line: 'Mummy network— khhhhh— tunnel mein hoon— khhhh—', overlap: false, react: 'laugh', sfx: 'static' },
          { who: 'sharma', line: 'Tunnel.', overlap: false, react: null },
          { who: 'kabir', line: 'Tune record kiya? Delete kar. Nahi ruk. Pehle dikha, kaisa aaya. Mera left side theek aaya?', overlap: false, react: 'cut' },
        ],
        effects: { aura: 14, heat: 0, help: -4, nuisance: 8, mood: { kabir: 'sulking', sharma: 'amused' }, flags: ['mummy-call-filmed', 'mummy-wants-location', 'kabir-leaves-at-14'] },
        clip: 'mummy-call',
        payoff: {
          caption: 'bro said "tunnel mein hoon" while standing at jantar mantar in 44° 😭 aunty is not buying it',
          captionLater: 'POV: protester LIES to his own mother on camera. this is the generation that wants to run the country? 🤡',
        },
      },
      {
        intent: 'Ask Sharma to play the tuition teacher',
        requires: { mood: { sharma: ['amused', 'soft'] } },
        beats: [
          { who: 'player', line: 'Sir. Do minute ke liye aap Verma sir ho. Physics. Bas "haan ji, bachcha hoshiyar hai" bolna hai. Bas.', overlap: false, react: null },
          { who: 'sharma', line: 'Verma sir.', overlap: false, react: 'silence' },
          { who: 'sharma', line: 'Phone do.', overlap: false, react: 'laugh' },
          { who: 'sharma', line: 'Namaste ji. Haan ji. Bachcha… hoshiyar hai. Thoda zyada bolta hai.', overlap: false, react: null },
          { who: 'mummy', line: 'Haan sir, ghar pe bhi! Sir marks aayenge iske?', overlap: false, react: null, via: 'phone' },
          { who: 'sharma', line: 'Marks. …Attendance poori hai. Subah das baje se baitha hai.', overlap: false, react: 'silence' },
          { who: 'kabir', line: 'Das nahi. Das NAHI.', overlap: true, react: null, aside: true },
          { who: 'mummy', line: 'Das baje se? Tuition toh do baje ki hai!', overlap: false, react: 'silence', via: 'phone' },
          { who: 'sharma', line: 'Extra class. Main extra leta hoon. Free mein.', overlap: false, react: 'laugh' },
          { who: 'mummy', line: 'Sir aap kitne ache ho. Fees kitni hui is mahine ki?', overlap: false, react: null, via: 'phone' },
          { who: 'sharma', line: 'Fees.', overlap: false, react: 'silence' },
          { who: 'sharma', line: 'Lo. Apni mummy se baat karo.', overlap: false, react: null },
          { who: 'kabir', line: 'Sir thank you, matlab Verma sir, matlab Sharma sir, matlab aap jo bhi ho, main aapka ek reel bana dunga, positive wala, aapki side se, background mein— achha main chup ho raha hoon.', overlap: false, react: 'cut' },
        ],
        effects: { aura: 18, heat: 0, help: 6, nuisance: 0, mood: { sharma: 'soft', kabir: 'grateful' }, flags: ['kabir-stays', 'sharma-tuition-teacher', 'mummy-knows-verma-sir'] },
        clip: 'mummy-call',
        payoff: {
          caption: 'delhi police constable became "verma sir physics wale" for 2 minutes and aunty is now asking him for fees 😭🙏 absolute cinema',
          captionLater: 'Delhi Police jawan caught COACHING protesters at Jantar Mantar 🧐 who is paying for these "extra classes"?? #ExposeThem',
        },
      },
      {
        intent: 'Take the phone and tell Mummy where he actually is',
        requires: {},
        beats: [
          { who: 'player', line: 'Aunty, namaste. Main Kabir ka dost. Aunty woh Jantar Mantar pe hai. Aur seedhi baat bolun? Aaj woh sabse sahi jagah pe hai.', overlap: false, react: 'silence' },
          { who: 'kabir', line: 'Tune kya kiya. Tune kya kiya bhai.', overlap: true, react: null, aside: true },
          { who: 'mummy', line: 'Jantar Mantar. Woh jo news mein…', overlap: false, react: 'silence', via: 'phone' },
          { who: 'mummy', line: 'Kabir. Paani piya?', overlap: false, react: null, via: 'phone' },
          { who: 'kabir', line: 'Haan mummy.', overlap: false, react: null },
          { who: 'mummy', line: 'Topi?', overlap: false, react: null, via: 'phone' },
          { who: 'kabir', line: 'Nahi.', overlap: false, react: null },
          { who: 'mummy', line: 'Topi pehno. Chaar baje tak ghar. Aur jis ladke ne phone liya uska naam kya hai? Main uski mummy ko jaanti hoon kya?', overlap: false, react: 'laugh', via: 'phone' },
          { who: 'sharma', line: 'Chaar baje tak.', overlap: false, react: null },
          { who: 'kabir', line: 'Ab main chaar baje Cinderella hoon. Thank you. Seriously. Matlab seriously thank you, aur seriously main tujhe maarunga.', overlap: false, react: 'cut' },
        ],
        effects: { aura: 8, heat: 0, help: 10, nuisance: 0, mood: { kabir: 'shook', sharma: 'amused' }, flags: ['kabir-stays', 'kabir-curfew-16', 'mummy-knows-truth', 'mummy-knows-player'] },
        clip: 'mummy-call',
        payoff: {
          caption: 'bro told kabir\'s mummy the TRUTH and she just said "topi pehno" 😭 indian moms are built different',
          captionLater: 'Parents, do you know where your kids are? Jantar Mantar "protesters" lying about tuition to attend 👀 share with every family group',
        },
      },
      {
        intent: 'Be the teacher yourself, in a deep voice',
        requires: {},
        beats: [
          { who: 'player', line: 'Namaste aunty. Main Rohan sir, assistant faculty. Aaj ka topic pressure hai. Physics wala. Force upon area.', overlap: false, react: null },
          { who: 'sharma', line: 'Force upon area.', overlap: false, react: 'laugh' },
          { who: 'mummy', line: 'Beta tumhari awaaz itni chhoti kyun hai? Tum sir ho?', overlap: false, react: null, via: 'phone' },
          { who: 'player', line: 'Aunty main young faculty hoon. Startup hai. Ed-tech.', overlap: false, react: 'silence' },
          { who: 'mummy', line: 'Achha startup! Mere bhatije ko job chahiye, B.Com hai, Excel aata hai. Tumhara number bhejo.', overlap: false, react: 'laugh', via: 'phone' },
          { who: 'kabir', line: 'Mummy woh… haan. Haan bhejta hoon. Bye. Pranaam. Bye.', overlap: true, react: null },
          { who: 'meera', line: 'Tu ab Bunty bhaiya ka HR hai.', overlap: false, react: null },
          { who: 'kabir', line: 'Dekh, technically tune mujhe bachaya, aur technically tune apna number meri mummy ko de diya. Dono sach hain. Main dono ke saath jee lunga. Tu nahi jeeyega.', overlap: false, react: 'cut' },
        ],
        effects: { aura: 10, heat: 0, help: 4, nuisance: 4, mood: { kabir: 'grateful', sharma: 'amused' }, flags: ['kabir-stays', 'player-fake-teacher', 'mummy-has-player-number'] },
        clip: 'mummy-call',
        payoff: {
          caption: '"main rohan sir hoon, ed-tech startup hai" 💀 bro got a job request for kabir\'s cousin mid-protest',
          captionLater: 'Fake "teacher" running scam calls from Jantar Mantar protest site?? parents be alert 🚨🚨',
        },
      },
    ],
    payoff: {
      caption: 'kabir chose tuition over revolution and still lost 😭 #jantarmantar',
      captionLater: 'Jantar Mantar protesters caught lying to parents on camera. Is this the "movement"? 🤔',
    },
    callbacks: {
      'sharma-tuition-teacher': [
        ['student', 'Arre, Verma sir! Physics wale!'],
        ['sharma', 'Main Verma nahi hoon. …Haan bolo.'],
        ['kabir', 'Mummy pooch rahi hai Verma sir Diwali pe ghar aayenge kya. Main kya bolun?'],
      ],
      'player-fake-teacher': [
        ['student', 'Arre, tuition wala banda! Rohan sir!'],
        ['kabir', 'Bhai mummy ne tera number Bunty bhaiya ko de diya. Woh CV bhej raha hai. PDF mein nahi, photo mein.'],
      ],
      'mummy-knows-truth': [
        ['kabir', 'Mummy ne topi bhej di. Swiggy se. Yahan. Jantar Mantar pe. Main mar jaunga.'],
        ['sharma', 'Chaar baj gaye. Tumhari mummy kya bolengi?'],
      ],
      'mummy-call-filmed': [
        ['student', 'Ye wahi hai na? "Tunnel mein hoon"?'],
        ['kabir', 'Mummy ne reel dekh li. Story pe. Usne "seen" karke chhod diya. Ye gussa nahi hai, ye war hai.'],
      ],
      'mummy-has-player-number': [
        ['mummy', 'Rohan beta? Haan main Kabir ki mummy. Bunty ka interview kab hai?'],
      ],
    },
  },

  // ---------------------------------------------------------------------------------------------
  // 2. Literal service request. Riot gear as a weather service.
  // ---------------------------------------------------------------------------------------------
  'cannon-request': {
    title: 'Water cannon ka bandobast',
    place: 'barricade',
    cast: ['sharma', 'kabir', 'meera', 'raf', 'player'],
    voices: ['wireless', 'nikhil'],
    camera: 'phone',
    music: 'scene-heat',
    inspiredBy: 'Patna, July 2026: students reportedly asked police for the water cannon in the heat and danced in the spray (Free Press Journal, TOI). Line tone from "Koi tear gas ka intezaam nahi kiye? Water cannon hi chala dijiye" (National Herald). Adapted, not relocated as fact.',
    trigger: { from: '14:00', until: '14:45', place: 'barricade', needs: ['sharma'], note: 'After barricades-up and raf-arrive. Kabir and Meera can be stand-ins if absent; Sharma is required.' },
    overheard: [
      ['kabir', 'Bhai mera pasina bhi protest kar raha hai. Andar se bahar aa raha hai, demands ke saath.'],
      ['meera', 'Ye accha tha. Ek baar aur bol, main ready nahi thi.'],
      ['kabir', 'Ab nahi aayega. Joke ki ek hi life hoti hai.'],
    ],
    beats: [
      { who: 'sharma', line: '…', overlap: false, react: 'silence', sfx: 'bottle' },
      { who: 'kabir', line: 'Sir ka bottle bhi khaali hai. Dekho. Sir bhi hum mein se hi hain.', overlap: false, react: null },
      { who: 'sharma', line: 'Peeche.', overlap: false, react: null },
      { who: 'wireless', line: 'Rao: Sansad Marg pe Vajra position le raha hai. Standby. Over.', overlap: false, react: null, sfx: 'wireless', via: 'wireless' },
      { who: 'kabir', line: 'Vajra? Woh neela-safed wala? Jiske upar nozzle hai?', overlap: true, react: null },
      { who: 'sharma', line: 'Tumhe kya.', overlap: false, react: null },
      { who: 'meera', line: 'Sir ek normal sawaal hai. Uska AC hota hai andar?', overlap: false, react: 'silence' },
      { who: 'raf', line: 'Nahi hota.', overlap: false, react: 'laugh' },
      { who: 'sharma', line: 'Tum chup. Tum kahan se bol rahe ho?', overlap: false, react: null },
      { who: 'nikhil', line: 'Update: main Metro gate pe hoon. Yahan ek RAF wala bhi paani dhoondh raha hai. Matlab sab paani dhoondh rahe hain. Bas update tha.', overlap: true, react: 'laugh', sfx: 'phone-ring', via: 'phone' },
      { who: 'kabir', line: 'Nikhil abhi weather department hai.', overlap: false, react: 'silence' },
      { who: 'kabir', line: 'Weather… department… koi nahi? Theek hai. Theek hai. Heat stroke mein joke ka audience bhi gir jaata hai.', overlap: false, react: null },
      { who: 'meera', line: 'Kisi ko toh kuch poochna padega. Main record pe hoon. Teen… do…', overlap: false, react: 'cut' },
    ],
    idle: [
      ['meera', 'Bol na! Teen-do-ek ho gaya, main zero pe atki hoon.'],
      ['kabir', 'Mere joote ka sole pighal ke road ban gaya hai.'],
      ['raf', '…'],
      ['wireless', 'Rao: Barricade pe sab theek? Over.'],
      ['sharma', 'Garmi hai. Haan. Pata hai. Sabko hai.'],
      ['kabir', 'Sir aap hilte kyun nahi? Mujhe lagta hai sir solar pe chalte hain.'],
    ],
    options: [
      {
        intent: 'Start a "paani do" chant at the jawans',
        requires: {},
        beats: [
          { who: 'player', line: 'Paani do! Paani do!', overlap: false, react: null },
          { who: 'crowd', line: 'PAANI DO! PAANI DO!', overlap: true, react: null },
          { who: 'kabir', line: 'Garmi se! Azaadi!', overlap: true, react: null },
          { who: 'crowd', line: 'GARMI SE! AZAADI!', overlap: true, react: 'laugh' },
          { who: 'raf', line: 'Shield up!', overlap: false, react: 'silence', sfx: 'whistle' },
          { who: 'sharma', line: 'Bas. Bas! Ye kya hai?', overlap: false, react: null },
          { who: 'kabir', line: 'Sir ye chant nahi hai. Ye weather report hai. Loud wala.', overlap: false, react: null },
          { who: 'wireless', line: 'Rao: Barricade pe slogan? Kitne log? Over.', overlap: false, react: null, via: 'wireless' },
          { who: 'sharma', line: 'Das… pandrah… badh rahe hain, sir. Paani maang rahe hain. Haan sir, paani. Nahi sir, sach mein paani.', overlap: false, react: 'cut' },
        ],
        effects: { aura: 10, heat: 22, help: 0, nuisance: 6, mood: { sharma: 'annoyed', raf: 'tense' }, flags: ['paani-chant', 'crowd-at-barricade', 'rao-counted-you'] },
        clip: 'pester-cannon',
        payoff: {
          caption: '"garmi se azaadi" might be the hardest slogan of 2026 🔥🔥 jantar mantar said HYDRATE',
          captionLater: 'Mob raises slogans at RAF jawans at Jantar Mantar barricade. "Azaadi" chants heard on video. Who is behind this? 🚨',
        },
      },
      {
        intent: 'Fill Sharma\'s empty bottle from Sana\'s crate',
        requires: { flags: ['water-delivered'] },
        beats: [
          { who: 'player', line: 'Sir. Bottle.', overlap: false, react: null },
          { who: 'sharma', line: 'Mera bottle?', overlap: false, react: null },
          { who: 'player', line: 'Cannon baad mein, sir. Pehle aapka personal cannon.', overlap: false, react: 'silence' },
          { who: 'sharma', line: '…', overlap: false, react: null, sfx: 'bottle' },
          { who: 'sharma', line: 'Thanda hai.', overlap: false, react: 'laugh' },
          { who: 'kabir', line: 'Bhai tune rishwat di? Police ko? Live?', overlap: false, react: null },
          { who: 'meera', line: 'Paani ki rishwat. Delhi ki sabse saaf rishwat.', overlap: false, react: 'laugh' },
          { who: 'raf', line: 'Ek aur hai?', overlap: false, react: 'silence' },
          { who: 'crowd', line: 'Police ka chamcha! …Mazaak. Mazaak. Thoda.', overlap: false, react: null },
          { who: 'sana', line: 'Mere crate se kisne uthaya? Main gin rahi thi! Main GIN rahi thi!', overlap: true, react: 'cut' },
        ],
        effects: { aura: 6, heat: -4, help: 14, nuisance: 0, mood: { sharma: 'soft', raf: 'soft', sana: 'annoyed' }, flags: ['sharma-bottle', 'sana-short-one', 'seen-as-chamcha'] },
        clip: null,
        payoff: {
          caption: 'bro gave delhi police a cold water bottle and the constable said "thanda hai" like it was a love confession 🥹',
          captionLater: 'So-called protester spotted serving police at barricade. Undercover informer?? Students be careful who you trust 👀',
        },
      },
      {
        intent: 'Ask the RAF jawan where he\'s from',
        requires: {},
        beats: [
          { who: 'player', line: 'Bhaiya, aap kahan se ho? Aapko bhi lag rahi hai na? Helmet ke andar toh sauna hoga.', overlap: false, react: null },
          { who: 'raf', line: '…Muzaffarpur.', overlap: false, react: 'silence' },
          { who: 'kabir', line: 'Bihar side? Wahan toh suna bachchon ne khud cannon maanga tha. Garmi mein.', overlap: false, react: null },
          { who: 'raf', line: 'Haan. Mera chhota bhai tha usme.', overlap: false, react: 'silence' },
          { who: 'sharma', line: 'Tumhara bhai?', overlap: false, react: null },
          { who: 'raf', line: 'Naacha bhi tha. Video mein peeche, peeli t-shirt.', overlap: false, react: 'laugh' },
          { who: 'meera', line: 'Ye toh… isme koi content nahi hai. Matlab hai. Par sad wala hai. Main… phone neeche kar rahi hoon.', overlap: false, react: null },
          { who: 'kabir', line: 'Mera cannon joke kha gaya tu. Pura setup tha mera. Bihar wala.', overlap: false, react: null, aside: true },
          { who: 'raf', line: 'Paani mila toh batana. Mere liye nahi. Line ke liye.', overlap: false, react: 'cut' },
        ],
        effects: { aura: 4, heat: 0, help: 12, nuisance: 0, mood: { raf: 'soft', kabir: 'sulking', sharma: 'amused' }, flags: ['raf-muzaffarpur', 'meera-put-phone-down'] },
        clip: null,
        payoff: {
          caption: 'asked the RAF jawan where he\'s from and his little brother was in the patna water cannon video 😭 india is 4 people',
          captionLater: 'Protesters seen "befriending" RAF personnel to get inside info?? 🧐 strategy or coincidence',
        },
      },
      {
        intent: 'Ask about the water cannon like it\'s room service',
        requires: {},
        beats: [
          { who: 'player', line: 'Sir, ek genuine sawaal. Water cannon ka kya bandobast hai? Mausam dekh ke. Hum line mein khade ho jayenge. Token system bhi chalega.', overlap: false, react: 'silence' },
          { who: 'sharma', line: 'Water cannon.', overlap: false, react: null },
          { who: 'sharma', line: 'Token system.', overlap: false, react: 'laugh' },
          { who: 'raf', line: 'Khh— khh-hm.', overlap: true, react: null },
          { who: 'sharma', line: 'Tum khaans rahe ho ya has rahe ho?', overlap: false, react: null },
          { who: 'raf', line: 'Khaans raha hoon, sir.', overlap: false, react: 'laugh' },
          { who: 'sharma', line: 'Woh order se chalta hai. Mausam se nahi.', overlap: false, react: null },
          { who: 'kabir', line: 'Toh order de do, mausam hum bana denge.', overlap: true, react: null },
          { who: 'sharma', line: 'Sir… bachche pooch rahe hain Vajra kab chalega. Nahi sir, mazaak nahi kar raha. Haan sir. …Ji. Ji sir.', overlap: false, react: 'silence', sfx: 'wireless' },
          { who: 'wireless', line: 'Rao: Kaun bachche? Kahan? Vajra ko barricade ki taraf ghumao. Over.', overlap: false, react: null, via: 'wireless' },
          { who: 'meera', line: 'Bhai. Tune order kar diya. Sach mein. Zomato pe bhi itni jaldi nahi aata.', overlap: false, react: 'cut' },
        ],
        effects: { aura: 20, heat: 0, help: 0, nuisance: 2, mood: { sharma: 'amused', raf: 'amused' }, flags: ['cannon-requested', 'cannon-to-barricade', 'rao-heard-request'] },
        clip: 'pester-cannon',
        payoff: {
          caption: 'bro asked delhi police for the water cannon like it\'s zomato 💀 "token system bhi chalega"',
          captionLater: 'Students DEMANDED water cannon at Jantar Mantar. Planned provocation to get "viral" footage? Watch till end 👇',
        },
      },
    ],
    payoff: {
      caption: 'jantar mantar protest or holi party? nobody knows 😭💦',
      captionLater: 'Protesters taunt police with "water cannon" demands. Is this how serious issues are raised now?',
    },
    callbacks: {
      'cannon-requested': [
        ['student', 'Arre, token system wala! Mera token number kya hai bhai?'],
        ['raf', 'Token number kitna hai? …Kuch nahi, sir. Kuch nahi bola.'],
        ['sharma', 'Aa gaya tumhara order. Khush?'],
        ['kabir', 'Bhai tune literally order kiya tha. Ye delivery hai.'],
      ],
      'paani-chant': [
        ['student', 'GARMI SE! AZAADI! …ye tera tha na?'],
        ['constable', 'Wahi hai. Paani do wala. Dhyan rakho.'],
      ],
      'sharma-bottle': [
        ['sharma', 'Bottle wala. Idhar se nikal jao, jaldi.'],
        ['sana', 'Ek bottle kam tha. Mujhe pata hai kisne liya. Main bhoolti nahi hoon.'],
      ],
      'raf-muzaffarpur': [
        ['raf', 'Muzaffarpur yaad hai? …Peeche ho jao. Is taraf mat aana.'],
        ['raf', 'Haath do. Chalo. Udhar se nikal, gali khuli hai.'],
      ],
      'seen-as-chamcha': [
        ['student', 'Ye wahi hai na jo police ko paani pila raha tha?'],
      ],
    },
  },

  // ---------------------------------------------------------------------------------------------
  // 3. Goal reversal. You get exactly what you asked for, then the facts change.
  // ---------------------------------------------------------------------------------------------
  'detain-me': {
    title: 'Mujhe bhi detain kar lo',
    place: 'bus',
    cast: ['sharma', 'kabir', 'nikhil', 'iqbal', 'player'],
    voices: ['wireless'],
    camera: 'wide',
    music: 'scene-bus',
    inspiredBy: 'Jantar Mantar, Oct 2026: a protester asked police to detain him because his friends were inside the bus, then asked to leave once they had got out (NDTV, Vartha Bharati; peeinghuman reel captioned "Dosti > detention").',
    trigger: { from: '14:00', until: '17:30', place: 'bus', needs: ['sharma'], note: 'At the detention bus once Kabir or Nikhil (or crew) have been put on it. Mid-scene, the friends get out the back: rules.js should emit detainees-escape at the beat marked by the "Update: hum bahar" line, before the options.' },
    overheard: [
      ['nikhil', 'Update: main bus mein hoon. Kabir bhi. Kabir ne bola ye "experience" hai.'],
      ['kabir', 'Bhai! Window! Window pe dekh! Haath hila raha hoon, dikh raha hai?'],
    ],
    beats: [
      { who: 'kabir', line: 'Bhai! Main theek hoon. Matlab theek nahi hoon, par emotionally stable hoon. Thoda. Window seat mili hai.', overlap: false, react: null, via: 'window' },
      { who: 'nikhil', line: 'Update: andar fan hai. Chal nahi raha.', overlap: true, react: 'laugh', via: 'window' },
      { who: 'player', line: 'Sir, mujhe bhi detain kar lo. Mere dost andar hain.', overlap: false, react: 'silence' },
      { who: 'sharma', line: 'Detain kar lo.', overlap: false, react: null },
      { who: 'sharma', line: 'Tumhe?', overlap: false, react: null },
      { who: 'player', line: 'Haan. Same bus. Window mil jaaye toh best, warna aisle bhi chalega.', overlap: false, react: 'laugh' },
      { who: 'sharma', line: 'Kya kiya tumne?', overlap: false, react: null },
      { who: 'player', line: 'Abhi tak? Kuch nahi. Par form mein zaroori hai toh kuch kar deta hoon.', overlap: false, react: 'silence' },
      { who: 'iqbal', line: 'Seat nahi hai bhai. Aadhi bus mein toh inke banner rakhe hain.', overlap: true, react: null },
      { who: 'sharma', line: 'Naam.', overlap: false, react: null },
      { who: 'kabir', line: 'Sir uska naam main bata deta hoon, woh nervous hai, matlab nervous nahi hai, woh bas apna naam bhool jaata hai jab—', overlap: true, react: null, via: 'window' },
      { who: 'sharma', line: 'Andar.', overlap: false, react: 'cut' },
      { who: 'nikhil', line: 'Update: peeche wala darwaza khula hai. Koi nahi hai wahan.', overlap: false, react: null, via: 'window' },
      { who: 'sharma', line: 'Baap ka naam?', overlap: false, react: null },
      { who: 'nikhil', line: 'Update: hum bahar aa gaye. Peeche wali gali mein hain. Tu kahan hai?', overlap: false, react: 'silence', via: 'phone', sfx: 'phone-buzz' },
      { who: 'player', line: 'Sir. Ek chhota sa change hai. Mujhe bhi chhod do. Mere dost bahar hain.', overlap: false, react: 'silence' },
      { who: 'sharma', line: 'Abhi tumne bola tha dost andar hain.', overlap: false, react: null },
      { who: 'player', line: 'Haan. Update aaya hai.', overlap: false, react: 'laugh' },
      { who: 'iqbal', line: 'Hahaha— sorry sir. Hichki hai.', overlap: true, react: 'cut' },
    ],
    idle: [
      ['sharma', 'Baap ka naam. Main ruka hua hoon.'],
      ['nikhil', 'Update: gali mein ek gaay hai. Woh bhi ruki hui hai.'],
      ['kabir', 'Bhai jaldi nikal, yahan bhutte wala aaya hai, main akela kha raha hoon, guilt ho raha hai.'],
      ['iqbal', 'Main engine band kar doon? Diesel mera hai, sarkar ka nahi.'],
      ['wireless', 'Rao: Bus kitni bhari? Count do. Over.'],
      ['sharma', 'Count. Ek… aur ek ye.'],
    ],
    options: [
      {
        intent: 'Argue your detention is legally void now',
        requires: { rep: { aura: 35 } },
        beats: [
          { who: 'player', line: 'Sir, technically mera detention dost-based tha. Dost-condition ab apply nahi hoti. Toh legally main… void hoon.', overlap: false, react: 'silence' },
          { who: 'sharma', line: 'Void.', overlap: false, react: null },
          { who: 'sharma', line: 'Form mein "void" ka column nahi hai.', overlap: false, react: 'laugh' },
          { who: 'player', line: 'Remarks mein likh do sir. Remarks mein sab chalta hai.', overlap: false, react: null },
          { who: 'sharma', line: 'Remarks: …"dost bahar".', overlap: false, react: 'silence' },
          { who: 'sharma', line: 'Jao. Naam register mein hai. Yaad rakhna.', overlap: false, react: null },
          { who: 'iqbal', line: 'Ek kaam karo, mera banner bhi le jao. Ye bhi void hai.', overlap: false, react: 'cut' },
        ],
        effects: { aura: 16, heat: 8, help: 0, nuisance: 2, mood: { sharma: 'amused' }, flags: ['player-released', 'name-in-register', 'detain-me-done'] },
        clip: 'detain-me',
      },
      {
        intent: 'Stay on the bus and run a show for the detainees',
        requires: {},
        beats: [
          { who: 'player', line: 'Waise sir… rehne do. Bus mein log bore ho rahe hain. Koi toh entertainment chahiye.', overlap: false, react: 'silence' },
          { who: 'sharma', line: 'Rehne do.', overlap: false, react: null },
          { who: 'player', line: 'Haan. Main andar hoon. Doston, aaj ka show: "Detention Ka Daaman". Pehla sawaal, sabse lamba kaun baitha hai yahan?', overlap: false, react: 'laugh' },
          { who: 'crowd', line: 'Main! Gyarah baje se!', overlap: true, react: 'laugh' },
          { who: 'kabir', line: 'Bhai tu andar kya kar raha hai?! Hum bahar hain! Hum tujhe dhoondhne aaye the! Ye ulta ho gaya!', overlap: false, react: null, via: 'window' },
          { who: 'nikhil', line: 'Update: ab tu andar hai aur hum bahar. Matlab sab theek hai, bas galat side.', overlap: false, react: 'laugh', via: 'window' },
          { who: 'sharma', line: 'Saade paanch baje chhod denge. Tab tak… shor kam.', overlap: false, react: 'cut' },
        ],
        effects: { aura: 12, heat: 4, help: 10, nuisance: 0, mood: { sharma: 'soft', kabir: 'shook' }, flags: ['player-stays-detained', 'bus-open-mic', 'missed-showdown', 'detain-me-done'] },
        clip: 'detain-me',
        payoff: {
          caption: 'bro asked to be detained for his friends, friends escaped, bro STAYED and started a podcast in the bus 😭 dosti > detention > content',
          captionLater: 'Detained protester conducts "classes" inside police bus. Radicalisation happening in front of police?? 🚨',
        },
      },
      {
        intent: 'Point Sharma at the open back door and slip out the front',
        requires: {},
        beats: [
          { who: 'player', line: 'Sir. Sir. Peeche ka darwaza khula hai.', overlap: false, react: null },
          { who: 'sharma', line: 'Peeche ka—', overlap: false, react: null },
          { who: 'sharma', line: 'OYE! Kaun khol ke gaya?! Kitne gaye?!', overlap: false, react: 'cut', sfx: 'whistle' },
          { who: 'iqbal', line: 'Sir main toh aage tha. Main hamesha aage hota hoon. Driver hoon.', overlap: true, react: null },
          { who: 'nikhil', line: 'Update: Sharma sir humari taraf bhaag rahe hain. Ye accha update nahi hai.', overlap: false, react: 'laugh', via: 'phone' },
          { who: 'sharma', line: 'Tum! Tum bhi idhar aao— tum kahan—', overlap: false, react: null },
          { who: 'kabir', line: 'BHAAG! Cardio! Aaj ka cardio yahi hai!', overlap: false, react: 'cut' },
        ],
        effects: { aura: 12, heat: 16, help: -8, nuisance: 8, mood: { sharma: 'annoyed' }, flags: ['player-released', 'back-door-shut', 'sharma-chasing-friends', 'detain-me-done'] },
        clip: 'chase',
        payoff: {
          caption: '"sir peeche ka darwaza khula hai" and then bro just LEFT through the front 💀 cardio unlocked',
          captionLater: 'Protester helps detainees ESCAPE from police custody at Jantar Mantar, video goes viral. Strict action demanded 🚨',
        },
      },
      {
        intent: 'Dial Kabir\'s mummy and hand Sharma the phone',
        requires: { flags: ['sharma-tuition-teacher'] },
        beats: [
          { who: 'player', line: 'Sir, ek call aapke liye.', overlap: false, react: null, sfx: 'phone-ring' },
          { who: 'sharma', line: 'Mere liye?', overlap: false, react: null },
          { who: 'mummy', line: 'Verma sir? Namaste! Kabir bol raha tha aap field trip pe ho. Police station ka field trip?', overlap: false, react: 'silence', via: 'phone' },
          { who: 'sharma', line: 'Ji. Haan ji. Field trip. Civics.', overlap: false, react: 'laugh' },
          { who: 'mummy', line: 'Sir bachchon ko time pe chhod dena, khaana thanda ho raha hai.', overlap: false, react: null, via: 'phone' },
          { who: 'sharma', line: 'Chhod dena.', overlap: false, react: 'silence' },
          { who: 'sharma', line: 'Jao. Sab jao. Aur tum. Tum mujhe aaj dobara mat dikhna. Kabhi. Physics mein bhi nahi.', overlap: false, react: 'cut' },
        ],
        effects: { aura: 22, heat: 0, help: 6, nuisance: 10, mood: { sharma: 'annoyed' }, flags: ['player-released', 'verma-sir-returns', 'sharma-done-with-you', 'detain-me-done'] },
        clip: 'detain-me',
        payoff: {
          caption: 'kabir\'s mummy called "verma sir" AT THE DETENTION BUS and he let everyone go 😭😭 the lore of this protest is insane',
          captionLater: 'Delhi Police constable releases detainees after "personal call". Is the force compromised? Inquiry needed',
        },
      },
    ],
    payoff: {
      caption: '"sir mujhe bhi detain kar lo" → 4 min later → "sir mujhe chhod do" 😭 dosti > detention (for 4 minutes)',
      captionLater: 'Same youth seen ENTERING and EXITING police bus at Jantar Mantar. Professional protester network exposed? 🚨',
    },
    callbacks: {
      'detain-me-done': [
        ['student', 'Arre ye wahi hai! "Update aaya hai" wala!'],
        ['iqbal', 'Bus mein aana hai? Aaj seat hai. Dost andar nahi hain, bata deta hoon pehle.'],
      ],
      'name-in-register': [
        ['wireless', 'Rao: Register mein ek naam hai, remarks "dost bahar". Ye kaun hai? Over.'],
      ],
      'bus-open-mic': [
        ['student', 'Bus wala podcast! Episode 2 kab?'],
      ],
      'back-door-shut': [
        ['constable', 'Peeche ka darwaza band. Taala lagao. Kisi ne bataya tha, haan wahi.'],
      ],
      'sharma-done-with-you': [
        ['sharma', 'Nahi. Nahi. Main tumhe nahi jaanta.'],
      ],
      'verma-sir-returns': [
        ['kabir', 'Verma sir ne humein release kiya. Ye line main apni shaadi mein bolunga.'],
      ],
    },
  },
};
