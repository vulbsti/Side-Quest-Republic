// cannon-request (14:00–14:45, the barricade): a literal service request, riot gear as a weather service.
// Ported from the 'cannon-request' reel scene in scenes.js, lines kept. It opens when the barricades go up
// at 14:00 and Jawan Pandey (r1) stands next to Sharma. rules.js reads its flags: 'cannon-requested' and
// 'cannon-to-barricade' (the Vajra turns to the barricade), 'paani-chant' and 'crowd-at-barricade' (the
// crowd presses up, intensity up), 'raf-muzaffarpur' (Pandey opens a gali at the showdown), 'seen-as-chamcha'
// and 'sana-short-one'. New here: the cold bottle is a real errand to Sana's tent and back.
// Format: plans/story-rebuild.md, "Situations".
export default {
  'cannon-request': {
    clip: 'pester-cannon', // the happening when it ends done (filmable; the feed's clip)
    title: 'Water cannon ka bandobast',
    act: 3,
    window: { from: '14:00', until: '14:45' },
    place: 'barricade',
    cast: ['sharma', 'r1'],
    voices: ['wireless'],
    music: 'scene-heat',
    inspiredBy: 'Patna, July 2026: students reportedly asked police for the water cannon in the heat and danced in the spray (Free Press Journal, TOI). Line tone from "Koi tear gas ka intezaam nahi kiye? Water cannon hi chala dijiye" (National Herald). Adapted, not relocated as fact.',
    hook: {
      chat: [
        ['meera', 'RAF aa gayi 🛡️ barricade pe 44° hai aur sharma ji ki bottle khaali. content incoming'],
        ['nikhil', 'update: RAF wale aa gaye. ek ne mujhe dekha. maine bhi dekha. ab hum dono dekh rahe hain'],
      ],
      overheard: [
        ['kabir', 'Bhai mera pasina bhi protest kar raha hai. Andar se bahar aa raha hai, demands ke saath.'],
        ['meera', 'Ye accha tha. Ek baar aur bol, main ready nahi thi.'],
        ['kabir', 'Ab nahi aayega. Joke ki ek hi life hoti hai.'],
      ],
      card: "Sharma's bottle is empty and the Vajra is on standby",
    },
    // Nobody asks: the heat does its own talking, a little louder every minute.
    auto: {
      at: '14:35',
      beats: [
        ['student', 'Paani do! …Paani do? Koi toh bolo mere saath.'],
        ['wireless', 'Rao: Barricade pe sab theek? Vajra standby pe rahega. Over.'],
      ],
      do: ['intensity:+1'],
      end: 'fail',
    },
    start: 'heat',
    nodes: {
      heat: {
        camera: 'phone',
        beats: [
          { who: 'sharma', line: '…', react: 'silence', sfx: 'bottle' },
          { who: 'kabir', line: 'Sir ka bottle bhi khaali hai. Dekho. Sir bhi hum mein se hi hain.' },
          { who: 'sharma', line: 'Peeche.' },
          { who: 'wireless', line: 'Rao: Sansad Marg pe Vajra position le raha hai. Standby. Over.', sfx: 'wireless', via: 'wireless' },
          { who: 'kabir', line: 'Vajra? Woh neela-safed wala? Jiske upar nozzle hai?', overlap: true },
          { who: 'sharma', line: 'Tumhe kya.' },
          { who: 'meera', line: 'Sir ek normal sawaal hai. Uska AC hota hai andar?', react: 'silence' },
          { who: 'r1', line: 'Nahi hota.', react: 'laugh' },
          { who: 'sharma', line: 'Tum chup. Tum kahan se bol rahe ho?' },
          { who: 'nikhil', line: 'Update: main Metro gate pe hoon. Yahan ek RAF wala bhi paani dhoondh raha hai. Matlab sab paani dhoondh rahe hain. Bas update tha.', overlap: true, react: 'laugh', sfx: 'phone-ring', via: 'phone' },
          { who: 'kabir', line: 'Nikhil abhi weather department hai.', react: 'silence' },
          { who: 'kabir', line: 'Weather… department… koi nahi? Theek hai. Theek hai. Heat stroke mein joke ka audience bhi gir jaata hai.' },
          { who: 'meera', line: 'Kisi ko toh kuch poochna padega. Main record pe hoon. Teen… do…', react: 'cut' },
        ],
        idle: [
          ['meera', 'Bol na! Teen-do-ek ho gaya, main zero pe atki hoon.'],
          ['kabir', 'Mere joote ka sole pighal ke road ban gaya hai.'],
          ['r1', '…'],
          ['wireless', 'Rao: Barricade pe sab theek? Over.'],
          ['sharma', 'Garmi hai. Haan. Pata hai. Sabko hai.'],
          ['kabir', 'Sir aap hilte kyun nahi? Mujhe lagta hai sir solar pe chalte hain.'],
        ],
        options: [
          {
            intent: 'Start a "paani do" chant at the jawans',
            beats: [
              { who: 'player', line: 'Paani do! Paani do!' },
              { who: 'crowd', line: 'PAANI DO! PAANI DO!', overlap: true },
              { who: 'kabir', line: 'Garmi se! Azaadi!', overlap: true },
              { who: 'crowd', line: 'GARMI SE! AZAADI!', overlap: true, react: 'laugh' },
              { who: 'raf', line: 'Shield up!', react: 'silence', sfx: 'whistle' },
              { who: 'sharma', line: 'Bas. Bas! Ye kya hai?' },
              { who: 'kabir', line: 'Sir ye chant nahi hai. Ye weather report hai. Loud wala.' },
              { who: 'wireless', line: 'Rao: Barricade pe slogan? Kitne log? Over.', via: 'wireless' },
              { who: 'sharma', line: 'Das… pandrah… badh rahe hain, sir. Paani maang rahe hain. Haan sir, paani. Nahi sir, sach mein paani.', react: 'cut' },
            ],
            effects: { aura: 10, heat: 22, nuisance: 6, mood: { sharma: 'annoyed', r1: 'annoyed' }, flags: ['paani-chant', 'crowd-at-barricade', 'rao-counted-you'] },
            do: ['callback:chant'],
            clip: 'pester-cannon',
            payoff: {
              caption: '"garmi se azaadi" might be the hardest slogan of 2026 🔥🔥 jantar mantar said HYDRATE',
              captionLater: 'Mob raises slogans at RAF jawans at Jantar Mantar barricade. "Azaadi" chants heard on video. Who is behind this? 🚨',
            },
            end: 'done',
          },
          {
            intent: "Ask about the water cannon like it's room service",
            beats: [
              { who: 'player', line: 'Sir, ek genuine sawaal. Water cannon ka kya bandobast hai? Mausam dekh ke. Hum line mein khade ho jayenge. Token system bhi chalega.', react: 'silence' },
              { who: 'sharma', line: 'Water cannon.' },
              { who: 'sharma', line: 'Token system.', react: 'laugh' },
              { who: 'r1', line: 'Khh— khh-hm.', overlap: true },
              { who: 'sharma', line: 'Tum khaans rahe ho ya has rahe ho?' },
              { who: 'r1', line: 'Khaans raha hoon, sir.', react: 'laugh' },
              { who: 'sharma', line: 'Woh order se chalta hai. Mausam se nahi.' },
              { who: 'kabir', line: 'Toh order de do, mausam hum bana denge.', overlap: true },
              { who: 'sharma', line: 'Sir… bachche pooch rahe hain Vajra kab chalega. Nahi sir, mazaak nahi kar raha. Haan sir. …Ji. Ji sir.', react: 'silence', sfx: 'wireless' },
              { who: 'wireless', line: 'Rao: Kaun bachche? Kahan? Vajra ko barricade ki taraf ghumao. Over.', via: 'wireless' },
              { who: 'meera', line: 'Bhai. Tune order kar diya. Sach mein. Zomato pe bhi itni jaldi nahi aata.', react: 'cut' },
            ],
            effects: { aura: 20, nuisance: 2, mood: { sharma: 'amused', r1: 'amused' }, flags: ['cannon-requested', 'cannon-to-barricade', 'rao-heard-request'] },
            do: ['callback:token'],
            clip: 'pester-cannon',
            payoff: {
              caption: 'bro asked delhi police for the water cannon like it\'s zomato 💀 "token system bhi chalega"',
              captionLater: 'Students DEMANDED water cannon at Jantar Mantar. Planned provocation to get "viral" footage? Watch till end 👇',
            },
            end: 'done',
          },
          {
            intent: "Fetch Sharma a cold bottle from Sana's crate",
            requires: { flags: ['water-delivered'] },
            beats: [
              { who: 'player', line: 'Sir. Do minute. Yahin rehna.' },
              { who: 'sharma', line: 'Main barricade hoon. Main kahan jaunga.' },
              { who: 'kabir', line: 'Bhai tu kahan? Abhi toh scene ban raha tha.' },
            ],
            next: 'to-sana',
          },
          {
            intent: "Ask the RAF jawan where he's from",
            beats: [
              { who: 'player', line: 'Bhaiya, aap kahan se ho? Aapko bhi lag rahi hai na? Helmet ke andar toh sauna hoga.' },
              { who: 'r1', line: '…Muzaffarpur.', react: 'silence' },
              { who: 'kabir', line: 'Bihar side? Wahan toh suna bachchon ne khud cannon maanga tha. Garmi mein.' },
              { who: 'r1', line: 'Haan. Mera chhota bhai tha usme.', react: 'silence' },
              { who: 'sharma', line: 'Tumhara bhai?' },
              { who: 'r1', line: 'Naacha bhi tha. Video mein peeche, peeli t-shirt.', react: 'laugh' },
              { who: 'meera', line: 'Ye toh… isme koi content nahi hai. Matlab hai. Par sad wala hai. Main… phone neeche kar rahi hoon.' },
              { who: 'kabir', line: 'Mera cannon joke kha gaya tu. Pura setup tha mera. Bihar wala.', aside: true },
              { who: 'r1', line: 'Paani mila toh batana. Mere liye nahi. Line ke liye.', react: 'cut' },
            ],
            effects: { aura: 4, help: 12, mood: { r1: 'soft', kabir: 'sulking', sharma: 'amused' }, flags: ['raf-muzaffarpur', 'meera-put-phone-down'] },
            do: ['callback:muzaffarpur'],
            clip: null,
            payoff: {
              caption: 'asked the RAF jawan where he\'s from and his little brother was in the patna water cannon video 😭 india is 4 people',
              captionLater: 'Protesters seen "befriending" RAF personnel to get inside info?? 🧐 strategy or coincidence',
            },
            end: 'done',
          },
        ],
      },

      // --- the bottle run: barricade → Sana's tent → barricade ---
      'to-sana': {
        beats: [{ who: 'meera', line: 'Bottle run! Main yahin rukti hoon, Sharma ji ka expression hold karke.' }],
        goal: {
          text: "Get a cold bottle from Sana's tent",
          until: ['at:player:stage'], // her tent is at the stage
          by: '14:50',
          marker: 'sana',
          onDone: 'sana',
        },
      },
      sana: {
        camera: 'none',
        beats: [
          { who: 'sana', line: 'Bottle? Kiske liye?' },
          { who: 'player', line: 'Ek… dost.' },
          { who: 'sana', line: 'Dost ki uniform khaki hai kya?', react: 'silence' },
          { who: 'sana', line: 'Mere paas gin ke hain. Ek bottle kam matlab shaam ko koi ek behosh. Main math kar chuki hoon.' },
        ],
        idle: [
          ['sana', 'Unees, bees, ikkees… mat hilo, main gin rahi hoon.'],
          ['sana', 'ORS chahiye toh line mein. Bottle chahiye toh kahani mein.'],
        ],
        options: [
          {
            intent: 'Swipe one while she is counting',
            beats: [
              { who: 'sana', line: 'Unees… bees… ikkees…' },
              { who: 'player', line: '(bottle utha ke, dheere se peeche) …' },
              { who: 'sana', line: 'Ikkees? Bees the. …Mere crate se kisne uthaya? Main gin rahi thi! Main GIN rahi thi!', react: 'cut' },
            ],
            effects: { nuisance: 4, mood: { sana: 'annoyed' }, flags: ['sana-short-one'] },
            next: 'to-sharma',
          },
          {
            intent: "Tell Sana the truth: it's for Sharma",
            beats: [
              { who: 'player', line: 'Sharma ji ke liye. Barricade pe. Unki bottle khaali hai, aur unhe dekh ke meri bhi khaali ho rahi hai.' },
              { who: 'sana', line: 'Police ko?' },
              { who: 'sana', line: '…Garmi uniform dekh ke nahi lagti. Ek. Gin ke. Aur shaam ko tum mere saath ORS ghologe.', react: 'silence' },
            ],
            effects: { help: 4, flags: ['owes-sana-ors'] },
            next: 'to-sharma',
          },
          {
            intent: 'Ask for two, one for the RAF jawan too',
            beats: [
              { who: 'player', line: 'Do de do. Ek Sharma ji, ek RAF wale bhaiya.' },
              { who: 'sana', line: 'Do? Line mein sau hain. Do se kya hoga?' },
              { who: 'player', line: 'Shuruaat.' },
              { who: 'sana', line: 'Theek hai. Do. Shuruaat ke naam pe. Aur ye "shuruaat" shaam ko ORS ghol ke chukaana.', react: 'laugh' },
            ],
            effects: { help: 8, flags: ['two-bottles', 'owes-sana-ors', 'sana-short-one'] },
            next: 'to-sharma',
          },
        ],
      },
      'to-sharma': {
        beats: [{ who: 'sana', line: 'Thandi hai. Abhi. Paanch minute mein Delhi isko chai bana degi. Bhaago.' }],
        goal: {
          text: 'Get the cold bottle back to Sharma',
          until: ['at:player:barricade'],
          by: '14:55',
          marker: 'sharma',
          onDone: 'bottle',
        },
      },
      bottle: {
        camera: 'phone',
        beats: [
          { who: 'player', line: 'Sir. Bottle.' },
          { who: 'sharma', line: 'Mera bottle?' },
          { who: 'player', line: 'Cannon baad mein, sir. Pehle aapka personal cannon.', react: 'silence' },
        ],
        idle: [
          ['sharma', '…'],
          ['meera', 'Abhi. Abhi de. Light achhi hai.'],
          ['r1', '(bottle ko dekhte hue) …'],
        ],
        options: [
          {
            intent: 'Drink it yourself, slowly, in front of him',
            beats: [
              { who: 'player', line: '(dhakkan khol ke, aankh band, ek lambi ghoont) …Aah.' },
              { who: 'sharma', line: '…', react: 'silence' },
              { who: 'sharma', line: 'Peeche.' },
              { who: 'meera', line: 'Ye villain arc hai. Main isko slow-mo mein daal rahi hoon.', react: 'laugh' },
              { who: 'r1', line: 'Sir, ise yaad rakhna.', react: 'cut' },
            ],
            effects: { aura: 8, heat: 10, mood: { sharma: 'annoyed', r1: 'annoyed' }, flags: ['drank-sharmas-water'] },
            do: ['callback:villain'],
            end: 'fail',
          },
          {
            intent: 'Hand Sharma the cold bottle',
            beats: [
              { who: 'sharma', line: '…', sfx: 'bottle' },
              { who: 'sharma', line: 'Thanda hai.', react: 'laugh' },
              { who: 'kabir', line: 'Bhai tune rishwat di? Police ko? Live?' },
              { who: 'meera', line: 'Paani ki rishwat. Delhi ki sabse saaf rishwat.', react: 'laugh' },
              { who: 'r1', line: 'Ek aur hai?', react: 'silence' },
              { who: 'crowd', line: 'Police ka chamcha! …Mazaak. Mazaak. Thoda.', react: 'cut' },
            ],
            effects: { aura: 6, heat: -4, help: 14, mood: { sharma: 'soft' }, flags: ['sharma-bottle', 'seen-as-chamcha'] },
            do: ['callback:bottle'],
            payoff: {
              caption: 'bro gave delhi police a cold water bottle and the constable said "thanda hai" like it was a love confession 🥹',
              captionLater: 'So-called protester spotted serving police at barricade. Undercover informer?? Students be careful who you trust 👀',
            },
            end: 'done',
          },
          {
            intent: 'Give it to the RAF jawan instead',
            beats: [
              { who: 'player', line: 'Bhaiya. Aapke liye.' },
              { who: 'r1', line: 'Mujhe? …Sir ka tha.' },
              { who: 'sharma', line: 'Mera bottle tha.' },
              { who: 'player', line: 'Aapka khaali bottle tha, sir. Ye bhara hua hai. Alag cheez hai.' },
              { who: 'r1', line: '(aadhi peeke, aadhi line mein aage karte hue) …Line ke liye.', react: 'silence' },
              { who: 'sharma', line: 'Line ke liye.', react: 'cut' },
            ],
            effects: { aura: 4, help: 10, mood: { r1: 'soft', sharma: 'annoyed' }, flags: ['raf-bottle'] },
            do: ['callback:rafbottle'],
            end: 'done',
          },
          {
            intent: 'Hand one to each of them',
            requires: { flags: ['two-bottles'] },
            beats: [
              { who: 'player', line: 'Ek aapka, sir. Ek aapka, bhaiya. Barabar.' },
              { who: 'sharma', line: 'Thanda hai.', react: 'laugh' },
              { who: 'r1', line: 'Thanda hai.', overlap: true },
              { who: 'kabir', line: 'Dono ne same line boli. Ye toh training mein sikhaate honge.' },
              { who: 'crowd', line: 'Humein bhi! …Mazaak. Nahi, sach mein, humein bhi.', react: 'cut' },
            ],
            effects: { aura: 8, heat: -6, help: 16, mood: { sharma: 'soft', r1: 'soft' }, flags: ['sharma-bottle', 'raf-bottle', 'seen-as-chamcha'] },
            do: ['callback:both'],
            end: 'done',
          },
        ],
      },
    },
    callbacks: {
      chant: 'Because you started "paani do" at the barricade at {t}, Rao counted heads there, and the crowd pressed up to the barricade at {at}.',
      token: 'Because you asked for the water cannon "token system bhi chalega" at {t}, Rao turned the Vajra to the barricade at {at}. You ordered it. It came.',
      muzaffarpur: 'Because you asked Jawan Pandey where he was from at {t}, Meera put her phone down, and Pandey remembered you at {at}.',
      bottle: 'Because you brought Sharma a cold bottle at {t}, he said "thanda hai" at {at}, and the students called you a chamcha.',
      rafbottle: 'Because you gave Sharma\'s bottle to Jawan Pandey at {t}, half of it went down the RAF line at {at}.',
      both: 'Because you brought two cold bottles to the barricade at {t}, Sharma and Pandey said "thanda hai" in unison at {at}.',
      villain: 'Because you drank the cold bottle in front of Sharma at {t}, the barricade remembered your face at {at}.',
    },
    outcomes: {
      done: {
        caption: 'barricade pe 44° aur ek sawaal 💦 sharma ji ka reaction priceless. jantar mantar protest or holi party? nobody knows 😭',
        captionLater: 'Protesters taunt police with "water cannon" demands. Is this how serious issues are raised now?',
        callback: null,
      },
      fail: {
        caption: 'barricade pe garmi, sharma ji ki khaali bottle, aur Vajra standby pe 🥵 koi kuch nahi bola',
        captionLater: 'Heat at Jantar: protesters "deliberately" crowding barricades in 44°, say sources 🧐',
        callback: 'Because nobody spoke up at the barricade at {t}, the Vajra stayed on standby and the heat kept climbing at {at}.',
      },
    },
  },
};
