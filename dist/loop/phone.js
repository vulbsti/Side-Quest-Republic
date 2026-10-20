// The in-game phone: reel captions, the "Jantar Updates 🔥" group chat, the news ticker, and a
// few real-world-inspired feed items. Data only, no logic.
//
// All characters and groups are fictional. RUP (Rashtriya Uday Party), DRS (Dharma Raksha Sena)
// and LJM (Lok Jan Morcha) are invented stand-ins. No real party, organisation or politician is
// named. "Mummy" is never in the group; the friends only quote her.
//
// CAPTIONS[kind] = { now: [...], later: [...] }
//   now   = how a Gen Z page captions the clip when it is posted
//   later = the 17:00 repost by an aggregator / IT-cell style page, same clip, dangerous framing
// CHAT[trigger] = [[who, text], ...]   who: 'kabir' | 'nikhil' | 'meera' | 'zoya'
//   triggers: cue names, clip kinds, 'phase:<name>', and 'flag:<name>' for scene callbacks
// TICKER[phase] = [headline, ...]
// REAL_REELS = feed items inspired by real reels/reports in research/, always shown with `label`.

export const CAPTIONS = {
  'bus-key': {
    now: [
      "absolute cinema 🎬 bhai ne detention bus ki chabi hi le li 😭",
      "jantar mantar entertainment 2.0 🔑🏃 driver uncle is laughing, cops are NOT",
      "the bus said 'main nahi jaungi' and honestly? valid 🔑",
    ],
    later: [
      "Protester STEALS police vehicle keys at Jantar Mantar, obstructs official duty. Is this 'peaceful protest'? 🚨",
      "Video: youth snatches keys from govt bus, driver harassed. Strict action demanded #JantarMantar",
    ],
  },
  'bus-stalled': {
    now: [
      "detention bus has entered its flop era 🚌💀",
      "bus khadi hai, sab khade hain, vibes bhi khadi hain. jantar mantar standstill speedrun",
    ],
    later: [
      "Protesters block police bus for hours, commuters suffer. Who will pay for this? 🤬",
      "Chaos at Jantar Mantar: govt vehicle immobilised by mob. Planned sabotage?",
    ],
  },
  'detainees-escape': {
    now: [
      "bus ka peeche wala darwaza: exists. detainees: say less 🚪🏃‍♂️🏃‍♀️",
      "they put 20 people in the bus and 20 people left the bus. conservation of protesters ⚖️😭",
      "prison break but make it delhi 🚌✨",
    ],
    later: [
      "Detainees ESCAPE police custody at Jantar Mantar. Breakdown of law and order? 🚨",
      "Shocking: accused flee from police bus as 'protesters' cheer. Who helped them?",
    ],
  },
  'chase': {
    now: [
      "parliament ki doorbell baja ke bhag gaya 🔔🏃 cardio arc unlocked",
      "subway surfers: connaught place edition 🏃‍♂️💨 (music is not mine)",
      "leg day? nah. lathi day 🦵💀",
    ],
    later: [
      "Protester flees police after creating ruckus at Jantar Mantar. Caught on camera 🎥",
      "Watch: police chase mischief-maker through CP. Why are these 'students' running if innocent?",
    ],
  },
  'caught': {
    now: [
      "speedrun failed at 0:47 😔 respawning in detention bus",
      "he ran so fast and then… a constable with 22 years experience said hello 💀",
    ],
    later: [
      "Troublemaker finally caught at Jantar Mantar. Police deserve applause 👏🇮🇳",
      "Arrested: youth behind Jantar Mantar chaos. More names to come?",
    ],
  },
  'pester-career': {
    now: [
      "bro walked up to delhi police for CAREER ADVICE at a protest 😭 linkedin is cooked",
      "'sir upsc better hai ya ssc?' constable uncle went full mentor mode 🥹",
      "career counselling ft. barricade. 10/10 would ask again",
    ],
    later: [
      "Protesters mock police personnel on duty, video viral. Is this respect for uniform? 😡",
      "Jantar Mantar 'students' harass constable with questions. Distraction tactic?",
    ],
  },
  'pester-cute': {
    now: [
      "'uncle aap cute ho' and the officer did NOT know what to do with his face 😭🫶",
      "rizz so strong it broke the chain of command 💅",
      "constable got complimented and forgot the barricade existed. peace achieved 🕊️",
    ],
    later: [
      "Protesters 'sweet-talk' police to breach barricade. Honey trap tactics at Jantar Mantar? 🧐",
      "Video: youth flirts with on-duty officer. Disrespect to uniform has become a trend",
    ],
  },
  'pester-cannon': {
    now: [
      "bro asked for the water cannon like it's zomato 💀 'token system bhi chalega'",
      "protest hai ya holi party?? 💦😭",
      "garmi ka ilaaj: sarkar ka paisa, sarkar ka paani 💦",
    ],
    later: [
      "Students DEMANDED water cannon at Jantar Mantar. Planned provocation for viral footage? 👇",
      "Protesters taunt police, invite force for 'content'. Is this how serious issues are raised now?",
    ],
  },
  'detain-me': {
    now: [
      "'sir mujhe bhi detain kar lo' → 4 min later → 'sir mujhe chhod do' 😭 dosti > detention",
      "bro chose friendship over freedom and then friendship left without him 💔🚌",
      "the duality of man: entered the bus voluntarily, exited the bus voluntarily 🚪",
    ],
    later: [
      "Same youth ENTERS and EXITS police bus at Jantar Mantar. Professional protester network? 🚨",
      "Exposed: 'detain me' stunt staged for camera. Police time wasted",
    ],
  },
  'crew-block': {
    now: [
      "they just sat down. on the road. and stayed sat. sit-in supremacy 🧘‍♂️🧘‍♀️",
      "squad blocked sansad marg with VIBES alone 🛑✨",
    ],
    later: [
      "Mob blocks road near Parliament, ambulances stuck? Traffic chaos at Jantar Mantar 🚑",
      "Organised group blocks key road, police helpless. Who is leading them?",
    ],
  },
  'speaker-party': {
    now: [
      "CP turned into a club at 11am and nobody asked questions 🔊🕺",
      "protest DJ set goes harder than every college fest this year 🎶",
    ],
    later: [
      "Loud music, dancing at protest site. Is this a protest or a party? Taxpayers ask 🤔",
      "Public nuisance at Connaught Place as 'protesters' block bus stop with DJ",
    ],
  },
  'big-speech': {
    now: [
      "mira's speech had the whole of jantar mantar silent and then SCREAMING 🔥 goosebumps",
      "when the speaker hits and the speech hits harder 🎤😤",
    ],
    later: [
      "Student leader's fiery speech at Jantar Mantar. Who wrote it? Foreign links probed 🧐",
      "Provocative speech before Jantar Mantar violence. Watch full video",
    ],
  },
  'small-speech': {
    now: [
      "mira giving a speech without a mic: 'peeche wale sun pa rahe ho?' peeche wale: 🧍",
      "speech was fire, audio was not. still respect 🫡",
    ],
    later: [
      "Poor turnout at Jantar Mantar shows people have rejected this 'movement' 😂",
      "Nobody listening: student protest fizzles out. Media hype exposed",
    ],
  },
  'biryani-rush': {
    now: [
      "one rumour about free biryani and the revolution had to wait 🍗🏃 priorities",
      "jantar mantar emptied faster than my bank balance for 'free biryani' that did not exist 💀",
      "biryani > ideology. science.",
    ],
    later: [
      "Paid crowd? Protesters rush for free food, video goes viral 🍗 #ExposedProtest",
      "'Biryani protesters' caught on camera. This is the truth of Jantar Mantar",
    ],
  },
  'cannon-scare': {
    now: [
      "one forward said 'water cannon aa raha hai' and half the crowd left like it was a fire drill 💀",
      "the cannon wasn't even there and it still won 🫠",
    ],
    later: [
      "Panic at Jantar Mantar after protesters spread fake news. Who started the rumour? 🚨",
      "Fear-mongering by protesters causes stampede-like situation",
    ],
  },
  'singalong': {
    now: [
      "'hum honge kaamyaab' with 500 people and two constables humming along 🥹🎶 this is the clip",
      "they sat down and SANG and the police line stepped back. chills. actual chills.",
    ],
    later: [
      "Protesters use songs to distract police before planned march? Watch closely 👀",
      "Emotional manipulation: how protest organisers use music to radicalise youth",
    ],
  },
  'roast': {
    now: [
      "kid roasted the inspector so hard the wireless said 'over' by itself 😭🎤",
      "'inki shaadi bhi over bol ke hui thi' AND THE CONSTABLES LAUGHED 💀",
      "open mic at jantar mantar is the only comedy show without a cover charge",
    ],
    later: [
      "Protester INSULTS senior police officer on stage, crowd cheers. Respect for uniform is dead 😡",
      "Video: Jantar Mantar stage used to mock police. Organisers silent",
    ],
  },
  'minister-noshow': {
    now: [
      "delegation waited 2 hours for the minister. minister was in a different city. in a different mood 🧍‍♂️🧍‍♀️",
      "the meeting was 'confirmed' in the way your uncle 'confirms' he'll come to your birthday",
    ],
    later: [
      "Protesters lie about ministerial meeting to gather crowd at barricade. Fake claims exposed",
      "No meeting was ever planned: ministry. Protest leaders misled crowd",
    ],
  },
  'provocateur-exposed': {
    now: [
      "'bhai tere joote itne naye kaise?' and the man RAN to a white SUV 🏃‍♂️🚙 case closed",
      "earpiece? check. helmet in bag? check. new shoes in dust? check. caught in 4k 📸",
      "crowd unmasked the provocateur faster than any news channel ever could 🕵️",
    ],
    later: [
      "Mob attacks innocent man at Jantar Mantar on suspicion. Vigilante justice by protesters? 😱",
      "Video: protesters harass passer-by, call him 'agent'. Paranoia or planned?",
    ],
  },
  'provocateur-joined': {
    now: [
      "bro said 'chalo maza aayega' to the guy with a helmet in his bag. it did not, in fact, maza aaya 😐",
      "main character energy, wrong movie 🎬",
    ],
    later: [
      "CAUGHT: student protester seen alongside violent men at Jantar Mantar. Proof of planned violence 🚨",
      "This is the face of Jantar Mantar rioters. Share widely",
    ],
  },
  'stone-thrown': {
    now: [
      "a stone came from behind the crowd. the crowd says it wasn't them. the crowd is pointing at a white SUV 👀",
      "everyone was sitting. then one stone. then everything changed.",
    ],
    later: [
      "Protesters PELT STONES at police at Jantar Mantar. Shocking video 🚨🚨",
      "Stone-pelting by students injures police. Was this always the plan?",
    ],
  },
  'cannon-spray': {
    now: [
      "free shower ft. vajra 💦 nobody asked for this one though",
      "water cannon hit the crowd and somewhere a kurta-pajama uncle said 'mere time mein bhi'",
    ],
    later: [
      "Police forced to use water cannon as protesters turn violent at Jantar Mantar",
      "Water cannon deployed after mob refuses to disperse. Police acted with restraint",
    ],
  },
  'cannon-dance': {
    now: [
      "they asked for the water cannon. they GOT the water cannon. now they're doing garba in it 💃💦😭",
      "protest hai ya holi party? both. it's both.",
      "jantar mantar rain dance 2026 💦🕺 police uncle is just standing there, tired",
    ],
    later: [
      "Protesters DANCE as police try to control them. Protest is just a picnic for them 🙄",
      "Mockery of law: youth dance in water cannon spray. Is this a serious movement?",
    ],
  },
  'gas': {
    now: [
      "tear gas at jantar mantar. that's it. that's the caption. please be okay 🙏",
      "everyone's eyes red, nobody's spirit broken. still here.",
    ],
    later: [
      "Police use tear gas after protesters attack. Forces showed maximum restraint",
      "Jantar Mantar violence: tear gas fired as mob turns aggressive",
    ],
  },
  'charge': {
    now: [
      "they were sitting. this is what happened next.",
      "lathi charge at jantar mantar. the music isn't funny anymore.",
    ],
    later: [
      "Police disperse violent mob at Jantar Mantar. Order restored 🇮🇳",
      "Lathi charge became necessary after protesters crossed all limits",
    ],
  },
  'faint': {
    now: [
      "someone just fainted in the heat. SANA where's the water 😭 send water to jantar mantar",
      "44° and no shade. people are literally dropping. bring water if you're coming",
    ],
    later: [
      "Organisers endanger youth in extreme heat for publicity. Who is responsible?",
      "Protesters faint at Jantar Mantar. Organisers didn't even arrange water",
    ],
  },
  'mummy-call': {
    now: [
      "kabir chose tuition over revolution and still lost 😭 #jantarmantar",
      "his mummy called mid-protest and suddenly the system wasn't the biggest threat 📞😰",
      "bro went from 'down with the system' to 'haan mummy' in 0.2 seconds",
    ],
    later: [
      "Jantar Mantar protesters caught lying to parents on camera. Is this the 'movement'? 🤔",
      "Parents, do you know where your kids are? Share in every family group",
    ],
  },
  'heat': {
    now: [
      "jantar mantar at 2pm is a skill issue for the sun ☀️💀",
      "my sweat is also protesting. it's leaving my body with demands.",
    ],
    later: [
      "Irresponsible organisers make youth sit in killer heat. Heat stroke cases reported",
      "Heat chaos at protest site, ambulances called. Was it worth it?",
    ],
  },
};

export const CHAT = {
  // Phases
  'phase:morning': [
    ['kabir', 'pahunch gaya. jantar mantar pe abhi 12 log hain aur 9 police wale. ratio ✨'],
    ['meera', 'outfit check karke aa rahi hu. 10 min'],
    ['nikhil', 'main metro pe hu. gate number 2. ya 3. jo bhi gate hai main uspe hu'],
    ['zoya', 'live jaungi 12 baje. koi bhi kuch funny kare toh mujhe batana pehle, internet ko baad mein'],
  ],
  'phase:midday': [
    ['meera', 'GUYS bheed dekho 😭😭 subah 12 log the ab 1200'],
    ['kabir', 'safed kurte wale log aaye hain. humare toh nahi hain. kisi ke toh hain'],
    ['zoya', 'bike wale bhi aa gaye. horn pe horn. main live pe hu, sab dikh raha hai'],
    ['nikhil', 'update: main abhi bhi metro gate pe hu. ab yahan bhi bheed hai. pehle akela tha'],
  ],
  'phase:tense': [
    ['zoya', 'barricades double ho gaye. RAF aayi hai. sab ek jagah mat khade hona'],
    ['kabir', 'mera pasina bhi protest kar raha hai'],
    ['meera', 'kabir woh joke subah wala better tha'],
    ['kabir', 'subah main zinda tha'],
    ['nikhil', 'update: kisi ne mujhe paani diya. RAF wale ne. main confuse hu'],
  ],
  'phase:showdown': [
    ['zoya', 'GAS. sab gali ki taraf. chai wali gali'],
    ['nikhil', 'kahan hai tu??'],
    ['nikhil', 'kahan hai tu'],
    ['meera', 'main dukaan ke andar hu. aunty ne andar bulaya. sab theek'],
    ['kabir', 'main theek hu. joota nahi hai. baaki main hu'],
  ],
  'phase:aftermath': [
    ['zoya', 'roll call. naam bolo'],
    ['meera', 'meera ✅'],
    ['kabir', 'kabir ✅ (emotionally ❌)'],
    ['nikhil', 'nikhil ✅ phone 1% bye'],
    ['zoya', 'aur tu? reply kar'],
  ],

  // Set-piece cues
  'arrival-wave': [
    ['meera', 'ek safed SUV aayi hai jispe VIP likha hai. protest mein VIP?? 💀'],
    ['kabir', 'bhai VIP sticker toh main bhi lagwa lu cycle pe'],
    ['zoya', 'number plate dekh rahi hu. note kar liya'],
  ],
  'party-suv': [
    ['zoya', 'RUP walon ki SUV barricade ke paas ruki. 4 log utre. nahi pehchane'],
    ['meera', 'unke kurte itne safed kaise hain is dhool mein. skincare routine chahiye'],
  ],
  'sena-bikes': [
    ['kabir', 'bike wale aa gaye bhai. 30 bikes. 30 horn. 0 silencer'],
    ['nikhil', 'update: ek bike wala mujhse rasta pooch raha tha. maine galat bata diya. galti se'],
    ['meera', 'nikhil ne accidentally revolution kar di'],
  ],
  'barricades-up': [
    ['zoya', 'barricades lag gaye. sansad marg band'],
    ['kabir', 'sansad marg band matlab parliament ki doorbell bhi band? 😔'],
    ['meera', 'transition reel ka perfect background mil gaya'],
  ],
  'raf-arrive': [
    ['meera', 'neele wale aa gaye. RAF. shields aur sab'],
    ['kabir', 'yeh log itne serious kyun lag rahe hain. hum toh sirf chant kar rahe the'],
    ['zoya', 'sab apne doston ke saath raho. seriously. haath pakdo'],
  ],
  'provocateur-drop': [
    ['zoya', 'SUV se 3 log aaye aur seedha bheed mein ghus gaye. naye joote. ek ke kaan mein earpiece'],
    ['kabir', 'bhai naye joote jantar mantar pe? ye toh crime hai already'],
    ['meera', 'film kar rahi hu unko. bas dekh rahi hu kya karte hain'],
  ],
  'stone-thrown': [
    ['zoya', 'PATTHAR. peeche se aaya. humare logon ne nahi phenka'],
    ['meera', 'maine dekha. woh SUV wala tha'],
    ['kabir', 'ab sab humein bolenge. ab sab humein hi bolenge'],
  ],
  'cannon-roll': [
    ['nikhil', 'update: ek neela safed truck aa raha hai. upar nozzle hai. bada hai'],
    ['kabir', 'VAJRA aa gaya bhai 😭 subah joke tha ab reality hai'],
    ['meera', 'arey yeh toh wahi hai jo kisi ne order kiya tha 💀'],
  ],
  'cannon-spray': [
    ['meera', 'cannon chal gaya 😭 sab geele'],
    ['kabir', 'mera phone gila ho gaya. ab ye bhi protest kar raha hai'],
    ['zoya', 'koi gira toh nahi? bolo'],
  ],
  'cannon-dance': [
    ['meera', 'GUYS LOG CANNON MEIN NAACH RAHE HAI 😭😭💦'],
    ['kabir', 'garba. literally garba. police uncle confused khade hai'],
    ['nikhil', 'update: main bhi naach raha hu. pehli baar naacha. accha laga'],
    ['zoya', 'live pe 8k log. comments mein sab bol rahe "holi party" 😂'],
  ],
  'gas-fired': [
    ['zoya', 'tear gas. aankh mat ragadna. paani daalo'],
    ['kabir', 'kuch nahi dikh raha. sirf awaaz aa rahi hai'],
    ['nikhil', 'kahan hai tu'],
  ],
  'charge-start': [
    ['zoya', 'LATHI CHARGE. sab bhaago, gali mein'],
    ['meera', 'kabir kahan hai'],
    ['nikhil', 'main yahan hu. yahan matlab misra yantra ke peeche. gol wala'],
  ],
  'charge-end': [
    ['zoya', 'ruk gaya. sab bolo kahan ho'],
    ['meera', 'chai wali gali mein hu. aunty ne paani diya'],
    ['kabir', 'mera haath chhil gaya. main theek hu. ye wala theek'],
  ],
  'chase-start': [
    ['kabir', 'BHAI TERE PEECHE CONSTABLE HAI 😭'],
    ['meera', 'film kar rahi hu bhaag bhaag bhaag'],
    ['nikhil', 'update: woh tez hai'],
  ],
  'chase-lost': [
    ['meera', 'gaya woh?? gaya?? 😭 legend'],
    ['kabir', 'subway surfers champion of CP'],
  ],
  'caught': [
    ['kabir', 'nahiii pakda gaya 💀'],
    ['zoya', 'kis bus mein hai? number bata'],
    ['meera', 'reel ka ending sad ho gaya 😔'],
    ['nikhil', 'main bus ke bahar khada hu. tu dikh raha hai. haath hila'],
  ],
  'bus-stalled': [
    ['meera', 'bus nahi chal rahi 😭 driver bhaiya chabi dhoond rahe hai'],
    ['kabir', 'mujhe pata hai chabi kahan hai. mujhe nahi bataana'],
  ],
  'detainees-escape': [
    ['nikhil', 'update: bus ka peeche wala darwaza khula. sab bahar aa rahe hai'],
    ['meera', 'prison break 😭🚌'],
    ['zoya', 'sab nikal gaye? count karo'],
  ],
  'crowd-laugh': [
    ['meera', 'ye kya hua sab has kyun rahe hai, main miss kar gayi 😭'],
  ],
  'awkward-silence': [
    ['kabir', 'woh joke nahi chala. main aware hu. mujhe bataane ki zarurat nahi'],
  ],
  'crew-join': [
    ['meera', 'tere peeche itne log kyun chal rahe hai 😭 cult leader arc'],
    ['kabir', 'mujhe bhi le le crew mein. main joke maarunga, tu leadership'],
  ],
  'crew-block': [
    ['zoya', 'tu road pe baitha hai?? live pe aa raha hai'],
    ['nikhil', 'update: main bhi baith gaya. road garam hai'],
  ],
  'faint': [
    ['zoya', 'koi gir gaya stage ke paas. sana ko bulao'],
    ['meera', 'paani kisi ke paas hai?? paani'],
  ],
  'ambulance': [
    ['zoya', 'ambulance aayi. raasta do'],
    ['kabir', 'ab koi joke nahi. bas raasta'],
  ],

  // Clip kinds (sent when the player posts that kind)
  'bus-key': [
    ['meera', 'TUNE CHABI LI??? 😭😭 absolute cinema'],
    ['kabir', 'bhai tu legend hai ya criminal, abhi decide nahi hua'],
    ['zoya', 'driver bhaiya ka face dekh. haso mat. thoda haso'],
  ],
  'pester-career': [
    ['kabir', 'tu sach mein constable se career advice le raha tha 😭 kya bola unhone'],
    ['meera', '"beta form bhar do sab ho jayega" iconic'],
  ],
  'pester-cute': [
    ['meera', 'TUNE UNCLE KO CUTE BOLA 💀💀'],
    ['kabir', 'unka face red ho gaya. garmi se ya sharam se, pata nahi'],
    ['zoya', 'ye clip trending jaayegi. ruko'],
  ],
  'pester-cannon': [
    ['meera', 'token system 😭😭😭 main mar gayi'],
    ['kabir', 'mera cannon joke tha woh. tune le liya. mera joke'],
    ['nikhil', 'update: main token number 1 hu'],
  ],
  'detain-me': [
    ['kabir', 'tu humare liye bus mein aaya aur hum bahar aa gaye 😭 i love you bro but why'],
    ['nikhil', 'update: hum bahar hai. tu?'],
    ['meera', 'dosti > detention (4 min ke liye)'],
  ],
  'mummy-call': [
    ['kabir', 'mummy ne "seen" karke chhod diya. ye gussa nahi hai. ye war hai'],
    ['meera', 'woh reel already 40k pe hai sorry kabir'],
    ['kabir', 'mummy: "beta location bhejo" 💀💀 main kahan bhejun'],
  ],
  'roast': [
    ['meera', 'KABIR TUNE RAO SIR KO ROAST KIYA 😭'],
    ['kabir', 'mujhe abhi tak shake ho raha hai. accha shake'],
    ['zoya', '#RaoOver trending. tum log pagal ho'],
  ],
  'singalong': [
    ['zoya', 'police ne line peeche kar li. ek constable hum kar raha tha'],
    ['meera', 'rona aa gaya yaar 🥹'],
  ],
  'biryani-rush': [
    ['kabir', 'biryani kahan hai?? main CP pahunch gaya'],
    ['meera', 'koi biryani nahi hai kabir'],
    ['kabir', 'mujhe nahi pata tha main itna naive hu 😔'],
  ],
  'provocateur-exposed': [
    ['zoya', 'woh bhaag gaya SUV ki taraf 😤 sab ne dekha'],
    ['meera', 'naye joote pehen ke protest pe aaoge toh yahi hoga'],
  ],
  'provocateur-joined': [
    ['zoya', 'tu un logon ke saath kya kar raha tha?'],
    ['kabir', 'bhai seriously?'],
    ['meera', '…'],
  ],
  'minister-noshow': [
    ['kabir', 'minister nahi aaye. shocked. not shocked.'],
    ['zoya', 'ministry bol rahi hai koi meeting thi hi nahi'],
  ],
  'cannon-scare': [
    ['zoya', 'koi cannon nahi aa raha. fake forward hai. pls mat bhejo'],
    ['nikhil', 'update: maine aage bhej diya tha. sorry'],
  ],

  // Scene callbacks (rules.js sends these when a scene option sets the flag)
  'flag:sharma-tuition-teacher': [
    ['kabir', 'mummy ne bola "verma sir bahut ache hai, unko diwali pe bulana" 😭😭'],
    ['meera', 'sharma uncle ab physics padhayenge'],
  ],
  'flag:player-fake-teacher': [
    ['kabir', 'mummy ne tera number bunty bhaiya ko de diya. woh CV bhejega. photo mein. PDF nahi'],
    ['meera', 'rohan sir 😭'],
  ],
  'flag:mummy-knows-truth': [
    ['kabir', 'mummy ne swiggy se topi bhej di. jantar mantar pe. delivery wala mujhe dhoond raha hai'],
    ['zoya', 'ye sabse wholesome cheez hai jo aaj hui'],
  ],
  'flag:kabir-curfew-16': [
    ['kabir', 'chaar baj gaye. cinderella nikal raha hai. bye 😔'],
  ],
  'flag:cannon-requested': [
    ['meera', 'rao sir ne wireless pe bola "vajra ko barricade ki taraf ghumao" TUNE ORDER KAR DIYA 😭'],
  ],
  'flag:raf-muzaffarpur': [
    ['meera', 'woh RAF wala bhaiya ka bhai patna wale video mein tha?? india is 4 people'],
  ],
  'flag:player-stays-detained': [
    ['kabir', 'tu bus mein podcast chala raha hai?? hum bahar hain 😭'],
    ['nikhil', 'update: hum bahar hai. tu andar. ulta ho gaya'],
  ],
  'flag:sharma-done-with-you': [
    ['kabir', 'sharma uncle ne bola "verma sir ko dobara mat bulana" lol'],
  ],
};

export const TICKER = {
  morning: [
    "Jantar Mantar sees early turnout of 12 people, 9 constables; police call ratio 'manageable'",
    "Student placard reading 'Goverment' sparks spelling debate on national TV",
    "Chai prices stable at Rs 10 as protest yet to reach critical mass",
    "RUP spokesperson: 'We are not aware of any protest. We are also monitoring it closely'",
    "Delhi temperature to touch 44°C; IMD advises staying indoors, students advise IMD to stay indoors",
    "LJM leader 'on the way' to Jantar Mantar, according to post scheduled yesterday",
    "Local uncle attends his 400th protest, says this one 'has good energy'",
    "Survey: 73% of protesters told parents they were at tuition, 27% said library",
    "Constable asked for career advice for the 6th time before 11am; says 'SSC better hai'",
  ],
  midday: [
    "White SUV with 'VIP' sticker parks at protest site; owner unknown, sticker very confident",
    "DRS bike rally arrives 'to maintain peace' with 30 horns and zero silencers",
    "RUP workers deny being at Jantar Mantar while standing at Jantar Mantar",
    "LJM leader's convoy stuck in traffic caused by protest he is going to support",
    "Experts on TV debate whether protest is 'foreign-funded' after spotting Korean ramen",
    "Free biryani rumour has 0 sources and 400 believers, data shows",
    "Police receive 'fresh orders'; constables say orders are fresh, details are stale",
    "Student organiser's speech trends; RUP IT cell clips 4 seconds of it",
    "Reel creator films outfit transition in front of barricade; algorithm approves",
  ],
  tense: [
    "Barricades doubled at Sansad Marg; police say 'no special reason', RAF says nothing",
    "Vajra water cannon 'positioned for weather conditions', officials clarify unprompted",
    "Men in brand-new shoes spotted in dusty crowd; RUP says 'shoes are a personal choice'",
    "Students ask for water cannon 'due to heat'; police in talks with themselves",
    "DRS chief appeals for calm on live video while bike rally revs behind him",
    "Inspector Rao's wireless reportedly saying 'over' every 4 seconds",
    "Heat: ambulance on standby, water on standby, everyone else not on standby",
    "Primetime anchor confirms protest is violent, ahead of any violence",
    "LJM leader reaches stage, gives 1-minute speech that lasts 14 minutes",
  ],
  showdown: [
    "Lathi charge at Jantar Mantar; police say 'minimum force', students say 'which minimum'",
    "Tear gas fired near Misra Yantra; 18th-century instrument records no change in sun",
    "Stone thrown 'from protesters' side', where white SUV was also parked, reports note in small font",
    "RUP: 'Outsiders' behind violence. DRS: 'Outsiders' behind violence. Students: 'You?'",
    "Chai stall shutter comes down for the first time since 2019",
    "CP aunties open shop doors to students fleeing; shopkeepers say 'aunty ne bola, bas'",
    "LJM leader evacuated to car to 'monitor situation' from AC",
    "Detention buses full; police say more buses 'being arranged', driver says 'chabi kahan hai'",
    "Live stream crosses 50,000 viewers; Inspector asks 'camera band karwao', then reconsiders",
  ],
  aftermath: [
    "Situation 'under control', says official, as students search for missing friends",
    "RUP blames 'anti-social elements'; refuses to say which society",
    "DRS: 'Our men were not there.' Video: 'Hello.'",
    "LJM announces support for students at 9pm debate featuring zero students",
    "Morning's water cannon reel crosses 2 million views; reposted with new caption by 40 pages",
    "Detainees released at 17:30 after names like 'Batman' and 'Mummy ka Beta' entered in register",
    "Chai seller's day: Rs 400 sales, Rs 800 loss, 1 cart dented, 'kal phir aayenge'",
    "Delhi Police thank 'peaceful citizens'; constables thank chai seller",
    "Prime-time panel of 6 experts concludes Gen Z 'doesn't take anything seriously'; Gen Z shows up again tomorrow",
  ],
};

// Feed items inspired by real 2026 reels and reports (see research/). Captions are ours, written in
// the style of the pages; they are not the original posts. Show `label` on every item.
// commentsSource: 'research' = excerpts recorded in research/, 'paraphrased' = rewritten from
// research paraphrases, 'invented' = written for the game in the same mood.
export const REAL_REELS = [
  {
    id: 'real-bus-key',
    commentsSource: 'research',
    label: 'inspired by a real reel',
    page: 'indiebuzz-style',
    caption: "absolute cinema 🔑 she took the bus key and the driver just… laughed?? jantar mantar entertainment 2.0",
    comments: ['Absolute cinema', 'This is jantar mantar entertainment 2.0 😂😂', 'Funny huh? In what logic?'],
    inspiredBy: {
      incident: 'A woman reportedly takes the detention-bus ignition key at Jantar Mantar and runs into the crowd; caption says the driver laughed (Oct 2026).',
      source: 'NDTV, 6 Oct 2026; IndieBuzz reel caption and visible comments (research/instagram-observations.json)',
      url: 'https://www.instagram.com/reels/DeGYClxTsXK/',
    },
    phase: 'morning',
  },
  {
    id: 'real-detain-me',
    commentsSource: 'paraphrased',
    label: 'inspired by a real reel',
    page: 'peeinghuman-style',
    caption: "'sir mujhe bhi detain kar lo, mere dost andar hain' 🥹 …and then his friends got out first 😭 dosti > detention",
    comments: ['officer is just a bus conductor now', 'backbencher behaviour', 'mera bhi aisa dost hona chahiye'],
    inspiredBy: {
      incident: 'A protester asks police to detain him because his friends are on the bus, then asks to leave once they have apparently escaped (Jantar Mantar, Oct 2026).',
      source: 'NDTV, 6 Oct 2026; Vartha Bharati, 5 Oct 2026; peeinghuman reel "Dosti > detention" (research/live-research-2026-10-16.json)',
      url: 'https://english.varthabharati.in/india/delhi-sir-mujhe-bhi-detain-kar-lo-mere-dost-andar-hai-protesters-bus-takes-hilarious-twist-at-jantar-mantar-2280407',
    },
    phase: 'tense',
  },
  {
    id: 'real-patna-cannon',
    commentsSource: 'research',
    label: 'inspired by a real reel',
    page: 'reposting-page-style',
    caption: "patna students asked police for the water cannon because of the heat and then danced in it 💦😭 protest hai ya holi party",
    comments: ['Ye protest ho raha hai ya Holi ki party', 'Tear gas experience k liye delhi aana padega dost', 'Patna protesters have good sense of humor'],
    inspiredBy: {
      incident: 'Students in Patna reportedly ask police for a water-cannon spray in the heat and dance afterwards (July 2026). Patna, not Delhi.',
      source: 'Free Press Journal, 23 Jul 2026; Times of India, 23 Jul 2026 (research/protest-incidents.json)',
      url: 'https://www.freepressjournal.in/amp/viral/protest-hai-ya-holi-party-patna-student-protesters-ask-police-for-water-cannon-amid-heat-dance-in-the-spray-video',
    },
    phase: 'tense',
  },
  {
    id: 'real-tear-gas-request',
    commentsSource: 'invented',
    label: 'inspired by a real reel',
    page: 'meme-page-style',
    caption: "'koi tear gas ka intezaam nahi kiye? water cannon hi chala dijiye' — bihar students treating riot gear like a hotel minibar 💀",
    comments: ['service sector of protests', 'bihar humour is undefeated', '5 star review for patna police'],
    inspiredBy: {
      incident: 'A protester in Patna reportedly asks police why there is no tear gas arrangement and suggests the water cannon instead (published Aug 2026). Quoted in an opinion piece; audio not verified.',
      source: 'National Herald opinion, 1 Aug 2026 (research/protest-incidents.json)',
      url: 'https://www.nationalheraldindia.com/amp/story/opinion/it-was-both-a-protest-and-a-carnival-jantar-mantar-cup-gen-z',
    },
    phase: 'midday',
  },
  {
    id: 'real-doorbell',
    commentsSource: 'invented',
    label: 'inspired by a real reel',
    page: 'edit-page-style',
    caption: "parliament ki doorbell baja ke bhag gaya 🔔🏃 (chase edit with game music, as is tradition)",
    comments: ['cardio done for the week', 'temple run delhi edition', 'background music choice 10/10'],
    inspiredBy: {
      incident: 'Jantar Mantar chase footage re-edited with game music, "cardio" jokes and superhero costumes; reported caption "Parliament ki doorbell baja ke bhag gaya!" (Jul 2026).',
      source: 'National Herald, 23 Jul 2026 (research/RESEARCH.md)',
      url: 'https://www.nationalheraldindia.com/national/memes-reels-and-resistance-gen-z-gives-the-cjp-protest-a-viral-edge',
    },
    phase: 'showdown',
  },
  {
    id: 'real-zaroori-sawaal',
    commentsSource: 'invented',
    label: 'inspired by a real reel',
    page: 'peeinghuman-style',
    caption: "dilli police se ek zaroori sawaal 🎥 (filmed on the same kind of camera they film us with) uno reverse",
    comments: ['uno reverse', 'officers looking so innocent 😭', 'surveillance ka return gift'],
    inspiredBy: {
      incident: 'Night footage of a polite question put to Delhi Police officers; commenters praised the role reversal of recording glasses (2026). Exact question not audio-verified.',
      source: 'peeinghuman reel "Dalli police se ek zaroori sawaal" (research/live-research-2026-10-16.json)',
      url: 'https://www.instagram.com/peeinghuman/reel/DbNVvp1pU9l/',
    },
    phase: 'midday',
  },
  {
    id: 'real-patna-gate',
    commentsSource: 'invented',
    label: 'inspired by a real reel',
    page: 'news-page-style',
    caption: "patna protesters had a tug-of-war with the water cannon and then walked off with a gate. as one does 🚪",
    comments: ['gate ka kya karenge', 'olympics mein bhejo inko', 'bihar never disappoints'],
    inspiredBy: {
      incident: 'At a Patna student protest, a water-cannon tug-of-war, dancing, and protesters carrying away a barricade/gate (July 2026).',
      source: 'Times of India, 23 Jul 2026 (research/protest-incidents.json)',
      url: 'https://timesofindia.indiatimes.com/india/water-cannon-tug-of-war-and-a-stolen-gate-patna-neet-protest-goes-viral/articleshow/132577095.cms',
    },
    phase: 'tense',
  },
  {
    id: 'real-baddies',
    commentsSource: 'invented',
    label: 'inspired by a real reel',
    page: 'peeinghuman-style',
    caption: "jantar mantar, 20 july. the title of this series was a joke. the comments aren't. 🕯️",
    comments: ['hope everyone is okay', 'yaad rakhenge', 'this is not content, this happened'],
    inspiredBy: {
      incident: 'A meme-titled series ("BADDIES of RESISTANCE") about Jantar Mantar, 20 July 2026, whose comments were mostly distress, accountability and remembrance. A reminder that a funny title is not a funny day.',
      source: 'peeinghuman reel (research/live-research-2026-10-16.json)',
      url: 'https://www.instagram.com/peeinghuman/reel/DbiQK6GMi_v/',
    },
    phase: 'aftermath',
  },
  {
    id: 'real-game',
    commentsSource: 'invented',
    label: 'inspired by a real reel',
    page: 'creator-style',
    caption: "someone made a jantar mantar protest GAME and people are getting detained while dancing in it 😭 steam release when",
    comments: ['got detained while dancing lol', 'played during office hours', 'add more politicians pls'],
    inspiredBy: {
      incident: 'An independent browser game about the Jantar Mantar protests; players retold getting detained mid-dance and asked for a Steam release (Oct 2026).',
      source: 'bugswriter reel and mantarjantar.com (research/live-research-2026-10-16.json)',
      url: 'https://www.instagram.com/bugswriter/reel/DehgRPtSt6M/',
    },
    phase: 'aftermath',
  },
];
