// detain-me: "Sir, mujhe bhi detain kar lo, mere dost andar hain." Ported from the reel scene in
// dist/loop/scenes.js. Your friends are on the detention bus and you are outside it. You beg Sharma to put
// you in too; as you climb on, they climb out the back; then you have to talk your way off a bus you
// begged to board. The "stay on the bus" ending hands over to bus-andar (you are still detained).
// Inspired by Jantar Mantar, Oct 2026 (NDTV, Vartha Bharati; peeinghuman reel "Dosti > detention").
// Format: plans/story-rebuild.md. Engine: dist/loop/story.js.
export default {
  'detain-me': {
    clip: 'detain-me', // the happening when it ends done (filmable; the feed's clip)
    title: 'Mujhe bhi detain kar lo',
    act: 3,
    window: { from: '14:00', until: '17:30' },
    place: 'busJantar',
    cast: ['sharma', 'iqbal'],
    // Kabir or Nikhil is on the bus: naye-joote's sweep sets these, and so does dhuan when the charge takes Kabir.
    requires: { detained: false, anyFlags: ['nikhil-on-bus', 'kabir-on-bus'] },
    hook: {
      chat: [
        ['nikhil', 'Update: main bus mein hoon. Kabir bhi. Kabir ne bola ye "experience" hai.'],
        ['kabir', 'bhai window pe dekh. haath hila raha hoon. dikh raha hai?'],
        ['meera', 'detention bus ka content?? main 2 min mein aa rahi hoon'],
      ],
      overheard: [
        ['kabir', 'Bhai! Window! Window pe dekh! Haath hila raha hoon!'],
        ['iqbal', 'Meri bus thi, ab sarkar ki hai. Diesel abhi bhi mera hai.'],
      ],
      card: 'Your friends are on the detention bus. Get them out',
    },
    // Nobody comes for them: just before five the back door is still open and they let themselves out.
    auto: {
      at: '16:50',
      beats: [
        ['nikhil', 'Update: hum khud nikal gaye. Peeche ka darwaza. Koi nahi tha. Tu kahan tha?'],
        ['kabir', 'Do ghante bus mein. Material mil gaya, dost nahi mila.'],
      ],
      do: ['release:kabir', 'release:nikhil', 'flag:friends-out', 'clip:detainees-escape', 'flag:friends-escaped-alone'],
      end: 'fail',
    },
    start: 'window',
    nodes: {
      window: {
        camera: 'wide',
        beats: [
          { who: 'kabir', line: 'Bhai! Main theek hoon. Matlab theek nahi hoon, par emotionally stable hoon. Thoda. Window seat mili hai.', via: 'window' },
          { who: 'nikhil', line: 'Update: andar fan hai. Chal nahi raha.', overlap: true, react: 'laugh', via: 'window' },
          { who: 'iqbal', line: 'Fan mera hai. Battery sarkar ki. Isliye nahi chal raha.' },
        ],
        idle: [
          ['kabir', 'Bhai jaldi kuch kar, yahan ek uncle kele ki kahani teesri baar suna rahe hain.'],
          ['nikhil', 'Update: abhi bhi andar hoon.'],
          ['iqbal', 'Main engine band kar doon? Diesel mera hai, sarkar ka nahi.'],
        ],
        options: [
          {
            intent: 'Film them waving through the window for Meera',
            beats: [
              { who: 'player', line: 'Ruk, ruk. Haath hila. Dono. Haan. Ab sad face. Perfect.' },
              { who: 'kabir', line: 'Bhai tu humein bachane aaya hai ya content banane?', via: 'window' },
              { who: 'meera', line: '(chat) ye bhej. ye bhej abhi. "dosti ka last seen" caption', via: 'phone' },
            ],
            effects: { aura: 6, help: -4, mood: { kabir: 'sulking' }, flags: ['filmed-friends-bus'] },
            clip: 'detain-me',
            do: ['callback:filmed'],
            end: 'fail',
          },
          {
            intent: 'Bang on the bus and demand they let them go',
            beats: [
              { who: 'player', line: '(bus pe thap thap) Chhodo inhe! Inhone kuch nahi kiya! Ek toh charger ke liye aaya tha!' },
              { who: 'c3', line: 'Kya bola? Bus ko haath lagaya? Ruk tu!', react: 'cut' },
              { who: 'nikhil', line: 'Update: ab tu bhaag raha hai. Hum dekh rahe hain. Good luck.', via: 'window' },
            ],
            effects: { heat: 14, aura: 4, nuisance: 6 },
            do: ['chase:c3', 'intensity:+4'],
            end: 'fail',
          },
          {
            intent: 'Pass Nikhil your power bank through the window',
            beats: [
              { who: 'player', line: 'Nikhil! Haath bahar kar. Ye le.' },
              { who: 'nikhil', line: 'Update: 3% se 7%. Bhai main tujhe apni wasiyat mein daal raha hoon.', via: 'window', react: 'laugh' },
              { who: 'nikhil', line: 'Aur... peeche ka darwaza dekha? Bas bol raha hoon.', via: 'window' },
            ],
            effects: { help: 6, mood: { nikhil: 'grateful' }, flags: ['nikhil-charged'] },
            next: 'window2',
          },
          {
            intent: 'Go and ask Sharma to put you on the bus too',
            beats: [
              { who: 'kabir', line: 'Tu kya karne wala hai? Tera "main plan bana raha hoon" wala chehra hai.', via: 'window' },
              { who: 'player', line: 'Plan nahi hai. Bas dost hain.' },
            ],
            next: 'fetch',
          },
        ],
      },
      window2: {
        camera: 'wide',
        beats: [{ who: 'kabir', line: 'Bhai darwaze pe Pandey hai. Muzaffarpur wala. Woh kisi ko dekh nahi raha, ghar ki photo dekh raha hai.', via: 'window' }],
        options: [
          {
            intent: 'Go and ask Sharma to put you on the bus too',
            beats: [{ who: 'player', line: 'Ruko. Main andar aa raha hoon. Proper tareeke se.' }],
            next: 'fetch',
          },
          {
            intent: 'Tell them to try the back door themselves',
            beats: [
              { who: 'player', line: 'Peeche ka darwaza. Abhi. Dheere. Kabir, mazaak nahi.' },
              { who: 'kabir', line: 'Main bina mazaak ke kahin nahi jaata. Par theek hai.', via: 'window' },
              { who: 'nikhil', line: 'Update: hum bahar hain. Ye itna aasaan tha?', via: 'phone', react: 'silence' },
            ],
            effects: { help: 8, heat: 6 },
            do: ['release:kabir', 'release:nikhil', 'flag:friends-out', 'clip:detainees-escape', 'flag:friends-escaped', 'callback:backdoor'],
            end: 'done',
          },
        ],
      },
      // A physical stage: Sharma is at the barricade, not at the bus. Go and get him.
      fetch: {
        beats: [{ who: 'iqbal', line: 'Sharma ji barricade pe hain. Unke bina bus mein koi nahi chadhta. Naam likhne wale wahi hain.' }],
        goal: {
          text: 'Find Officer Sharma at the barricade and ask him to detain you',
          until: ['at:player:barricade'],
          by: '17:15',
          onDone: 'ask',
          onFail: 'too-late',
          marker: 'sharma',
        },
      },
      ask: {
        camera: 'wide',
        beats: [
          { who: 'player', line: 'Sir, mujhe bhi detain kar lo. Mere dost andar hain.', react: 'silence' },
          { who: 'sharma', line: 'Detain kar lo.' },
          { who: 'sharma', line: 'Tumhe?' },
        ],
        idle: [['sharma', 'Tumhe.'], ['c2', '(muh chhupa ke hasi)'], ['wireless', 'Rao: Bus kitni bhari? Count do. Over.']],
        options: [
          {
            intent: 'Ask for a window seat on the same bus',
            beats: [
              { who: 'player', line: 'Haan. Same bus. Window mil jaaye toh best, warna aisle bhi chalega.', react: 'laugh' },
              { who: 'sharma', line: 'Kya kiya tumne?' },
              { who: 'player', line: 'Abhi tak? Kuch nahi. Par form mein zaroori hai toh kuch kar deta hoon.', react: 'silence' },
            ],
            effects: { aura: 6 },
            next: 'naam',
          },
          {
            intent: 'Explain that this is about dosti',
            beats: [
              { who: 'player', line: 'Sir dosti hai. Aap nahi samjhoge.' },
              { who: 'sharma', line: 'Dosti.' },
              { who: 'sharma', line: 'Mera bhi ek dost tha. Training mein. Uska transfer Gurgaon ho gaya.', react: 'silence' },
              { who: 'c1', line: '(chai ke saath) Mera Gurgaon nahi hua. Main yahin hoon. Teen saal.' },
            ],
            effects: { help: 6, mood: { sharma: 'soft' } },
            next: 'naam',
          },
          {
            intent: 'Offer to commit a small crime for the paperwork',
            beats: [
              { who: 'player', line: 'Sir koi chhota sa crime bata do. Jaywalking? Main abhi cross kar deta hoon.' },
              { who: 'c2', line: 'Barricade ke saamne jaywalking. Wah. Sharma ji, likh lo.', react: 'laugh' },
              { who: 'sharma', line: 'Likh lo.' },
            ],
            effects: { aura: 8, heat: 6, mood: { c2: 'amused' } },
            next: 'naam',
          },
          {
            intent: 'Lose your nerve and say it was hypothetical',
            beats: [
              { who: 'player', line: 'Matlab... hypothetically. Agar koi bole. Toh aap kya karoge.' },
              { who: 'sharma', line: 'Hypothetically.' },
              { who: 'sharma', line: 'Jao.', react: 'cut' },
            ],
            effects: { aura: -6 },
            end: 'fail',
          },
        ],
      },
      naam: {
        camera: 'wide',
        beats: [
          { who: 'iqbal', line: 'Seat nahi hai bhai. Aadhi bus mein toh inke banner rakhe hain.', overlap: true },
          { who: 'sharma', line: 'Naam.' },
          { who: 'kabir', line: 'Sir uska naam main bata deta hoon, woh nervous hai, matlab nervous nahi hai, woh bas apna naam bhool jaata hai jab—', overlap: true, via: 'window' },
          { who: 'sharma', line: 'Andar.', react: 'cut' },
        ],
        options: [
          {
            intent: 'Climb on the bus before he changes his mind',
            beats: [
              { who: 'player', line: '(seedhiyan chadhte hue) Thank you sir. Sach mein.' },
              { who: 'nikhil', line: 'Update: peeche wala darwaza khula hai. Koi nahi hai wahan.', via: 'window' },
              { who: 'sharma', line: 'Baap ka naam?' },
              { who: 'nikhil', line: 'Update: hum bahar aa gaye. Peeche wali gali mein hain. Tu kahan hai?', react: 'silence', via: 'phone', sfx: 'phone-buzz' },
            ],
            effects: { aura: 6, flags: ['detain-me-boarded'] },
            do: ['detain:player', 'release:kabir', 'release:nikhil', 'flag:friends-out', 'clip:detainees-escape'],
            next: 'update',
          },
          {
            intent: 'Let Kabir give your name for you',
            beats: [
              { who: 'kabir', line: 'Iska naam... Rohan. Rohan sir. Ed-tech startup. Sir ye founder hai.', via: 'window' },
              { who: 'sharma', line: '(likhta hai) Rohan. Founder.', react: 'laugh' },
              { who: 'nikhil', line: 'Update: Kabir ne galat naam bataya aur hum peeche se nikal gaye. Ek saath dono.', via: 'phone', sfx: 'phone-buzz' },
            ],
            effects: { aura: 10, nuisance: 4, flags: ['detain-me-boarded', 'name-is-rohan'] },
            do: ['detain:player', 'release:kabir', 'release:nikhil', 'flag:friends-out', 'clip:detainees-escape', 'callback:rohan'],
            next: 'update',
          },
          {
            intent: 'Refuse to give your name, on principle',
            beats: [
              { who: 'player', line: 'Sir naam toh nahi dunga. Principle hai.' },
              { who: 'sharma', line: 'Principle.' },
              { who: 'sharma', line: 'Principle andar. Tum bhi andar.' },
              { who: 'nikhil', line: 'Update: tu andar gaya, hum bahar aa gaye. Kya timing hai.', via: 'phone', sfx: 'phone-buzz', react: 'silence' },
            ],
            effects: { heat: 6, aura: 4, flags: ['detain-me-boarded'] },
            do: ['detain:player', 'release:kabir', 'release:nikhil', 'flag:friends-out', 'clip:detainees-escape'],
            next: 'update',
          },
        ],
      },
      update: {
        camera: 'phone',
        beats: [
          { who: 'player', line: 'Sir. Ek chhota sa change hai. Mujhe bhi chhod do. Mere dost bahar hain.', react: 'silence' },
          { who: 'sharma', line: 'Abhi tumne bola tha dost andar hain.' },
          { who: 'player', line: 'Haan. Update aaya hai.', react: 'laugh' },
          { who: 'iqbal', line: 'Hahaha— sorry sir. Hichki hai.', overlap: true, react: 'cut' },
        ],
        idle: [
          ['sharma', 'Baap ka naam. Main ruka hua hoon.'],
          ['nikhil', 'Update: gali mein ek gaay hai. Woh bhi ruki hui hai.'],
          ['kabir', 'Bhai jaldi nikal, yahan bhutte wala aaya hai, main akela kha raha hoon, guilt ho raha hai.'],
          ['wireless', 'Rao: Bus kitni bhari? Count do. Over.'],
          ['sharma', 'Count. Ek… aur ek ye.'],
        ],
        options: [
          {
            intent: 'Argue your detention is legally void now',
            requires: { rep: { aura: 35 } },
            beats: [
              { who: 'player', line: 'Sir, technically mera detention dost-based tha. Dost-condition ab apply nahi hoti. Toh legally main… void hoon.', react: 'silence' },
              { who: 'sharma', line: 'Void.' },
              { who: 'sharma', line: 'Form mein "void" ka column nahi hai.', react: 'laugh' },
              { who: 'player', line: 'Remarks mein likh do sir. Remarks mein sab chalta hai.' },
              { who: 'sharma', line: 'Remarks: …"dost bahar".', react: 'silence' },
              { who: 'sharma', line: 'Jao. Naam register mein hai. Yaad rakhna.' },
              { who: 'iqbal', line: 'Ek kaam karo, mera banner bhi le jao. Ye bhi void hai.', react: 'cut' },
            ],
            effects: { aura: 16, heat: 8, nuisance: 2, mood: { sharma: 'amused' }, flags: ['player-released', 'name-in-register', 'detain-me-done'] },
            clip: 'detain-me',
            do: ['release:player', 'callback:void'],
            end: 'done',
          },
          {
            intent: 'Stay on the bus and run a show for the detainees',
            beats: [
              { who: 'player', line: 'Waise sir… rehne do. Bus mein log bore ho rahe hain. Koi toh entertainment chahiye.', react: 'silence' },
              { who: 'sharma', line: 'Rehne do.' },
              { who: 'player', line: 'Haan. Doston, aaj ka show: "Detention Ka Daaman". Pehla sawaal, sabse lamba kaun baitha hai yahan?', react: 'laugh' },
              { who: 'uncle', line: 'Main! Gyarah baje se! Kele lene aaya tha!', overlap: true, react: 'laugh' },
              { who: 'kabir', line: 'Bhai tu andar kya kar raha hai?! Hum bahar hain! Hum tujhe dhoondhne aaye the! Ye ulta ho gaya!', via: 'window' },
              { who: 'nikhil', line: 'Update: ab tu andar hai aur hum bahar. Matlab sab theek hai, bas galat side.', react: 'laugh', via: 'window' },
              { who: 'sharma', line: 'Saade paanch baje chhod denge. Tab tak… shor kam.', react: 'cut' },
            ],
            effects: { aura: 12, heat: 4, help: 10, mood: { sharma: 'soft', kabir: 'shook' }, flags: ['player-stays-detained', 'bus-open-mic', 'missed-showdown', 'detain-me-done'] },
            clip: 'detain-me',
            do: ['stance:hold', 'callback:podcast'],
            end: 'done',
          },
          {
            intent: 'Point Sharma at the open back door, slip out the front',
            beats: [
              { who: 'player', line: 'Sir. Sir. Peeche ka darwaza khula hai.' },
              { who: 'sharma', line: 'Peeche ka—' },
              { who: 'sharma', line: 'OYE! Kaun khol ke gaya?! Kitne gaye?!', react: 'cut', sfx: 'whistle' },
              { who: 'iqbal', line: 'Sir main toh aage tha. Main hamesha aage hota hoon. Driver hoon.', overlap: true },
              { who: 'nikhil', line: 'Update: Sharma sir humari taraf bhaag rahe hain. Ye accha update nahi hai.', react: 'laugh', via: 'phone' },
              { who: 'kabir', line: 'BHAAG! Cardio! Aaj ka cardio yahi hai!', react: 'cut' },
            ],
            effects: { aura: 12, heat: 16, help: -8, nuisance: 8, mood: { sharma: 'annoyed' }, flags: ['player-released', 'back-door-shut', 'sharma-chasing-friends', 'detain-me-done'] },
            clip: 'chase',
            do: ['release:player', 'intensity:+6', 'target:crew', 'callback:cardio'],
            end: 'done',
          },
          {
            intent: 'Dial Kabir\'s mummy and hand Sharma the phone',
            requires: { flags: ['sharma-tuition-teacher'] },
            beats: [
              { who: 'player', line: 'Sir, ek call aapke liye.', sfx: 'phone-ring' },
              { who: 'sharma', line: 'Mere liye?' },
              { who: 'mummy', line: 'Verma sir? Namaste! Kabir bol raha tha aap field trip pe ho. Police station ka field trip?', react: 'silence', via: 'phone' },
              { who: 'sharma', line: 'Ji. Haan ji. Field trip. Civics.', react: 'laugh' },
              { who: 'mummy', line: 'Sir bachchon ko time pe chhod dena, khaana thanda ho raha hai.', via: 'phone' },
              { who: 'sharma', line: 'Chhod dena.', react: 'silence' },
              { who: 'sharma', line: 'Jao. Sab jao. Aur tum. Tum mujhe aaj dobara mat dikhna. Kabhi. Physics mein bhi nahi.', react: 'cut' },
            ],
            effects: { aura: 22, help: 6, nuisance: 10, mood: { sharma: 'annoyed' }, flags: ['player-released', 'verma-sir-returns', 'sharma-done-with-you', 'detain-me-done'] },
            clip: 'detain-me',
            do: ['release:player', 'callback:verma'],
            end: 'done',
          },
        ],
      },
      'too-late': {
        camera: 'wide',
        beats: [
          { who: 'nikhil', line: 'Update: tu nahi aaya. Hum peeche se khud nikal gaye. Koi baat nahi. Thodi baat hai.', via: 'phone', sfx: 'phone-buzz' },
          { who: 'kabir', line: 'Bus mein ek uncle ne mujhe kele ki poori supply chain samjha di. Main ab expert hoon.', via: 'phone' },
        ],
        options: [
          {
            intent: 'Say sorry in the group chat',
            beats: [{ who: 'player', line: '(chat) sorry yaar. barricade pe atak gaya tha.' }],
            do: ['release:kabir', 'release:nikhil', 'flag:friends-out', 'flag:friends-escaped-alone'],
            end: 'fail',
          },
          {
            intent: 'Pretend you were planning it all along',
            beats: [
              { who: 'player', line: '(chat) haan woh mera plan tha. back door wala. maine hi khulwaya.' },
              { who: 'meera', line: '(chat) jhooth. tu barricade pe chai pee raha tha, mere paas video hai', react: 'laugh' },
            ],
            effects: { aura: -4 },
            do: ['release:kabir', 'release:nikhil', 'flag:friends-out', 'flag:friends-escaped-alone'],
            end: 'fail',
          },
        ],
      },
    },
    callbacks: {
      filmed: 'Because you filmed your friends waving from the bus at {t}, "dosti ka last seen" was trending at {at}.',
      backdoor: 'Because you told your friends to try the back door at {t}, they were out before anyone counted at {at}.',
      rohan: 'Because Kabir told Sharma your name was "Rohan, founder" at {t}, a Rohan was in Rao\'s register at {at}.',
      void: 'Because you argued your detention was void at {t}, your name was in the register with the remark "dost bahar" at {at}.',
      podcast: 'Because you stayed on the bus to run a show at {t}, the whole bus knew your name at {at}.',
      cardio: 'Because you pointed Sharma at the open back door at {t}, the door was locked for everyone after you at {at}.',
      verma: 'Because Kabir\'s mummy called "Verma sir" at {t}, the whole bus went home at {at}.',
    },
    outcomes: {
      done: {
        caption: '"sir mujhe bhi detain kar lo" → 4 min later → "sir mujhe chhod do" 😭 dosti > detention (for 4 minutes)',
        captionLater: 'Same youth seen ENTERING and EXITING police bus at Jantar Mantar. Professional protester network exposed? 🚨',
        callback: 'Because you asked to be detained with your friends at {t}, they walked out the back door at {at}.',
      },
      fail: {
        caption: 'Detention bus ki window se haath hilate do ladke. Caption: "dosti ka last seen" 🚌👋',
        captionLater: 'Students detained at Jantar Mantar "escape" from police bus. Who opened the door? 🚨',
        callback: 'Because nobody came for them at {t}, Kabir and Nikhil let themselves out of the bus at {at}.',
      },
    },
  },
};
