// mummy-call (Act 2, 13:40–14:00): a mother's call outranks a revolution. Ported from the 'mummy-call' reel
// scene in scenes.js, lines kept. rules.js rings Kabir's phone at 13:40 (he walks to the quiet end of the
// barricade by Sharma, mode 'onCall') and at 14:00 reads the flags this sets: 'kabir-stays' keeps him,
// 'kabir-leaves-at-14' sends him off, 'kabir-curfew-16' sends him home at four. Kabir's mood
// (grateful | sulking | shook) is read by rules.js too. Format: plans/story-rebuild.md, "Situations".
export default {
  'mummy-call': {
    clip: 'mummy-call', // the happening when it ends done (filmable; the feed's clip)
    title: 'Mummy ka call',
    act: 2,
    window: { from: '13:40', until: '14:00' },
    place: 'kabir', // the marker follows Kabir to wherever he took the call
    cast: ['kabir', 'sharma'],
    voices: ['mummy'],
    music: 'scene-mummy',
    inspiredBy: 'Owner lead (unverified): a protester asks a cop to pose as his tuition teacher on a call with his mother.',
    hook: {
      chat: [
        ['meera', 'KABIR KI MUMMY KA VIDEO CALL 📞 barricade ke paas. jaldi aao 🍿'],
        ['kabir', 'koi aawaz mat karna. koi bhi. main tuition mein hoon'],
      ],
      overheard: [
        ['kabir', 'Bhai, mummy ka call hai. Tuition mein hona chahiye tha. Do baje se. Abhi pauna do hai. Matlab technically main late nahi hoon, main early hoon, galat jagah pe.'],
        ['meera', 'Ruk ruk ruk, ye dobara bol. Camera pe.'],
      ],
      card: "Kabir's mummy is calling. He's at \"tuition\"",
    },
    // Nobody steps in: Kabir goes into the tunnel that isn't there, and leaves for tuition at two.
    auto: {
      at: '13:56',
      beats: [
        ['kabir', 'Mummy network— khhhhh— tunnel mein hoon— khhhh—'],
        ['kabir', 'Bhai main ja raha hoon. Tuition. Asli wali. Do baje ki. Mere liye ek naara laga dena.'],
      ],
      do: ['flag:kabir-leaves-at-14'],
      end: 'fail',
    },
    start: 'call',
    nodes: {
      call: {
        camera: 'phone',
        beats: [
          { who: 'kabir', line: 'Toh basically mera point ye hai ki system ko jab tak hum—' },
          { who: 'kabir', line: 'Ek second.', sfx: 'phone-buzz' },
          { who: 'kabir', line: 'Nahi, ignore. Ignore kar raha hoon. Main ignore karne wala insaan hoon, sab jaante hain.', sfx: 'phone-ring' },
          { who: 'meera', line: '"Mummy" aur teen dil. Bhai utha le.', overlap: true },
          { who: 'kabir', line: 'Teen dil isliye kyunki birthday pe unhone khud save kiya tha, mera choice nahi tha, matlab mera bhi tha par— chhod. Irrelevant.', react: 'laugh' },
          { who: 'kabir', line: 'Haan mummy! Haan. Tuition mein hi hoon. Bahut padhai ho rahi hai. Itni zyada ki—', sfx: 'phone-ring' },
          { who: 'crowd', line: 'Inquilab! Zindabad!', overlap: true },
          { who: 'mummy', line: 'Toh peeche "zindabad" kaun bol raha hai?', react: 'silence', via: 'phone' },
          { who: 'kabir', line: 'Woh… sir ka teaching style hai. Bahut… revolutionary hai. Literally.' },
          { who: 'mummy', line: 'Sir se baat karao.', react: 'silence', via: 'phone' },
          { who: 'kabir', line: 'Bhai. Bhai, mujhe ek teacher chahiye. Abhi. Koi bhi adult jo thaka hua lage.', aside: true },
          { who: 'sharma', line: 'Kya dekh rahe ho?' },
          { who: 'meera', line: 'Uniform hata do toh sir bilkul physics wale sir lagte hain.', react: 'silence' },
          { who: 'sharma', line: 'Physics wale sir.' },
          { who: 'mummy', line: 'Hello? Kabir? Network chala gaya kya? Main papa ko de rahi hoon phone.', overlap: true, via: 'phone' },
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
            beats: [
              { who: 'kabir', line: 'Mummy, sir abhi… washroom gaye hain.' },
              { who: 'mummy', line: 'Tuition mein washroom hai? Pichhli baar toh bola tha nahi hai, isliye ghar aake jaana padta hai.', react: 'silence', via: 'phone' },
              { who: 'kabir', line: 'Naya bana hai. Renovation. Sir ne khud banwaya. Apne haath se. Bahut dedicated hain.', react: 'laugh' },
              { who: 'meera', line: 'Apne haath se.', overlap: true },
              { who: 'mummy', line: 'Location bhejo.', react: 'silence', via: 'phone' },
              { who: 'kabir', line: 'Mummy network— khhhhh— tunnel mein hoon— khhhh—', react: 'laugh', sfx: 'static' },
              { who: 'sharma', line: 'Tunnel.' },
              { who: 'kabir', line: 'Tune record kiya? Delete kar. Nahi ruk. Pehle dikha, kaisa aaya. Mera left side theek aaya?', react: 'cut' },
            ],
            effects: { aura: 14, help: -4, nuisance: 8, mood: { kabir: 'sulking', sharma: 'amused' }, flags: ['mummy-call-filmed', 'mummy-wants-location', 'kabir-leaves-at-14'] },
            do: ['callback:tunnel'],
            clip: 'mummy-call',
            payoff: {
              caption: 'bro said "tunnel mein hoon" while standing at jantar mantar in 44° 😭 aunty is not buying it',
              captionLater: 'POV: protester LIES to his own mother on camera. this is the generation that wants to run the country? 🤡',
            },
            end: 'fail',
          },
          {
            intent: 'Ask Sharma to play the tuition teacher',
            requires: { mood: { sharma: ['amused', 'soft'] } },
            beats: [
              { who: 'player', line: 'Sir. Do minute ke liye aap Verma sir ho. Physics. Bas "haan ji, bachcha hoshiyar hai" bolna hai. Bas.' },
              { who: 'sharma', line: 'Verma sir.', react: 'silence' },
              { who: 'sharma', line: 'Phone do.', react: 'laugh' },
              { who: 'sharma', line: 'Namaste ji. Haan ji. Bachcha… hoshiyar hai. Thoda zyada bolta hai.' },
              { who: 'mummy', line: 'Haan sir, ghar pe bhi! Sir marks aayenge iske?', via: 'phone' },
              { who: 'sharma', line: 'Marks. …Attendance poori hai. Subah das baje se baitha hai.', react: 'silence' },
              { who: 'kabir', line: 'Das nahi. Das NAHI.', overlap: true, aside: true },
              { who: 'mummy', line: 'Das baje se? Tuition toh do baje ki hai!', react: 'silence', via: 'phone' },
              { who: 'sharma', line: 'Extra class. Main extra leta hoon. Free mein.', react: 'laugh' },
              { who: 'mummy', line: 'Sir aap kitne ache ho. Fees kitni hui is mahine ki?', via: 'phone' },
              { who: 'sharma', line: 'Fees.', react: 'silence' },
              { who: 'sharma', line: 'Lo. Apni mummy se baat karo.' },
              { who: 'kabir', line: 'Sir thank you, matlab Verma sir, matlab Sharma sir, matlab aap jo bhi ho, main aapka ek reel bana dunga, positive wala, aapki side se, background mein— achha main chup ho raha hoon.', react: 'cut' },
            ],
            effects: { aura: 18, help: 6, mood: { sharma: 'soft', kabir: 'grateful' }, flags: ['kabir-stays', 'sharma-tuition-teacher', 'mummy-knows-verma-sir'] },
            do: ['callback:verma'],
            clip: 'mummy-call',
            payoff: {
              caption: 'delhi police constable became "verma sir physics wale" for 2 minutes and aunty is now asking him for fees 😭🙏 absolute cinema',
              captionLater: 'Delhi Police jawan caught COACHING protesters at Jantar Mantar 🧐 who is paying for these "extra classes"?? #ExposeThem',
            },
            end: 'done',
          },
          {
            intent: 'Take the phone and tell Mummy where he actually is',
            beats: [
              { who: 'player', line: 'Aunty, namaste. Main Kabir ka dost. Aunty woh Jantar Mantar pe hai. Aur seedhi baat bolun? Aaj woh sabse sahi jagah pe hai.', react: 'silence' },
              { who: 'kabir', line: 'Tune kya kiya. Tune kya kiya bhai.', overlap: true, aside: true },
              { who: 'mummy', line: 'Jantar Mantar. Woh jo news mein…', react: 'silence', via: 'phone' },
              { who: 'mummy', line: 'Kabir. Paani piya?', via: 'phone' },
              { who: 'kabir', line: 'Haan mummy.' },
              { who: 'mummy', line: 'Topi?', via: 'phone' },
              { who: 'kabir', line: 'Nahi.' },
              { who: 'mummy', line: 'Topi pehno. Chaar baje tak ghar. Aur jis ladke ne phone liya uska naam kya hai? Main uski mummy ko jaanti hoon kya?', react: 'laugh', via: 'phone' },
              { who: 'sharma', line: 'Chaar baje tak.' },
              { who: 'kabir', line: 'Ab main chaar baje Cinderella hoon. Thank you. Seriously. Matlab seriously thank you, aur seriously main tujhe maarunga.', react: 'cut' },
            ],
            effects: { aura: 8, help: 10, mood: { kabir: 'shook', sharma: 'amused' }, flags: ['kabir-stays', 'kabir-curfew-16', 'mummy-knows-truth', 'mummy-knows-player'] },
            do: ['callback:truth'],
            clip: 'mummy-call',
            payoff: {
              caption: 'bro told kabir\'s mummy the TRUTH and she just said "topi pehno" 😭 indian moms are built different',
              captionLater: 'Parents, do you know where your kids are? Jantar Mantar "protesters" lying about tuition to attend 👀 share with every family group',
            },
            end: 'done',
          },
          {
            intent: 'Be the teacher yourself, in a deep voice',
            beats: [
              { who: 'player', line: 'Namaste aunty. Main Rohan sir, assistant faculty. Aaj ka topic pressure hai. Physics wala. Force upon area.' },
              { who: 'sharma', line: 'Force upon area.', react: 'laugh' },
              { who: 'mummy', line: 'Beta tumhari awaaz itni chhoti kyun hai? Tum sir ho?', via: 'phone' },
              { who: 'player', line: 'Aunty main young faculty hoon. Startup hai. Ed-tech.', react: 'silence' },
              { who: 'mummy', line: 'Achha startup! Mere bhatije ko job chahiye, B.Com hai, Excel aata hai. Tumhara number bhejo.', react: 'laugh', via: 'phone' },
              { who: 'kabir', line: 'Mummy woh… haan. Haan bhejta hoon. Bye. Pranaam. Bye.', overlap: true },
              { who: 'meera', line: 'Tu ab Bunty bhaiya ka HR hai.' },
              { who: 'kabir', line: 'Dekh, technically tune mujhe bachaya, aur technically tune apna number meri mummy ko de diya. Dono sach hain. Main dono ke saath jee lunga. Tu nahi jeeyega.', react: 'cut' },
            ],
            effects: { aura: 10, help: 4, nuisance: 4, mood: { kabir: 'grateful', sharma: 'amused' }, flags: ['kabir-stays', 'player-fake-teacher', 'mummy-has-player-number'] },
            do: ['callback:rohan'],
            clip: 'mummy-call',
            payoff: {
              caption: '"main rohan sir hoon, ed-tech startup hai" 💀 bro got a job request for kabir\'s cousin mid-protest',
              captionLater: 'Fake "teacher" running scam calls from Jantar Mantar protest site?? parents be alert 🚨🚨',
            },
            end: 'done',
          },
        ],
      },
    },
    callbacks: {
      tunnel: 'Because you kept filming Kabir\'s "tunnel mein hoon" at {t}, his mummy asked for his location, and he left for tuition at two.',
      verma: 'Because you got Sharma to play "Verma sir" on Kabir\'s call at {t}, Kabir stayed, and Mummy wants Verma sir home for Diwali.',
      truth: 'Because you told Kabir\'s mummy the truth at {t}, she said "topi pehno", and Kabir had to be home by four.',
      rohan: 'Because you were "Rohan sir, ed-tech" on Kabir\'s call at {t}, Kabir stayed, and Bunty bhaiya sent you his CV as a photo.',
    },
    outcomes: {
      done: {
        caption: 'kabir ki mummy ka call survive ho gaya 📞 tuition wala alibi abhi bhi zinda hai (barely) 😭',
        captionLater: 'Jantar Mantar protesters caught lying to parents on camera. Is this the "movement"? 🤔',
        callback: null,
      },
      fail: {
        caption: 'kabir chose tuition over revolution and still lost 😭 #jantarmantar',
        captionLater: 'Jantar Mantar protesters caught lying to parents on camera. Is this the "movement"? 🤔',
        callback: 'Because nobody helped Kabir with his mummy\'s call at {t}, he went to the real tuition at {at}.',
      },
    },
  },
};
