// nikhil-lost (Act 1, 10:00–11:30, Metro). Nikhil's first protest. His phone is at 3% and he sends
// location updates that are true and useless. You find him, he follows you (the engine's follow
// routine in rules.js: drift more than 28 m away and he's lost again), and you walk him to the stage,
// where Kabir turns up at 11:00 (updateKabirNikhil does the reunion). Leave him and he stays the
// friend who gets lost: flag 'nikhil-left' is for dhuan; 'nikhil-found' stops his pillar updates.
export default {
  'nikhil-lost': {
    title: 'Nikhil kho gaya',
    act: 1,
    window: { from: '10:00', until: '11:30' },
    place: 'metro',
    cast: ['nikhil'],
    hook: {
      chat: [
        ['nikhil', 'guys main pahunch gaya 🙌'],
        ['nikhil', 'ek pillar ke paas hoon'],
        ['meera', 'Rajiv Chowk mein 400 pillar hain Nikhil'],
        ['nikhil', 'ek uncle samosa kha rahe hain. chutney wala'],
        ['nikhil', 'phone 3% pe hai, location nahi bhej sakta, location bahut battery khaata hai'],
        ['kabir', 'main tuition pe hoon (officially). 11 baje stage pe milta hoon'],
      ],
      overheard: [['nikhil', 'Excuse me uncle, ye exit number kya hai? ...Exit hi hai? Achha.']],
      card: 'Nikhil is lost somewhere near the Metro exit',
    },
    // Nobody came: Nikhil follows the samosa smell all the way to Asha's stall at CP and sits down there.
    auto: {
      at: '10:50',
      beats: [
        ['nikhil', 'Update: samosa uncle chal pade. Main bhi chal pada. Logic hai.'],
        ['nikhil', 'Update 2: ab ek chai wali aunty hain. Unhone bola baith ja. Main baith gaya.'],
      ],
      do: ['move:nikhil:chai', 'flag:nikhil-left'],
      end: 'fail',
    },
    start: 'mila',
    nodes: {
      mila: {
        camera: 'none',
        beats: [
          { who: 'nikhil', line: 'BHAI! Tu aa gaya! Main yahan bees minute se exit dhundh raha hoon. Saare exit pe "Exit" hi likha hai.' },
          { who: 'player', line: 'Tu exit ke saamne khada hai.' },
          { who: 'nikhil', line: 'Haan par ye exit hai ya entry? Board pe dono taraf teer hai.' },
          { who: 'nikhil', line: 'Aur ek update: phone 3% se 2% ho gaya. Maine "location" sirf soch li thi.', react: 'laugh' },
          { who: 'meera', line: 'Nikhil zinda hai? Ek selfie bhej, "first protest" wali. Content hai.', via: 'phone' },
        ],
        idle: [
          ['nikhil', 'Yahan sab itne confident kaise chal rahe hain? Kisi ko pata hai jaana kahan hai?'],
          ['nikhil', 'Wo pillar dekh. Mera pillar. Humne saath mein kaafi time bitaya.'],
          ['nikhil', 'Bhai paani hai? Nahi, chhod. Charger hai? Nahi, chhod. Tu hai. Bas.'],
        ],
        options: [
          {
            intent: 'Lend him your power bank (and lose your own charge)',
            beats: [
              { who: 'player', line: 'Le. Power bank. Mera 40% pe hai, ab hum dono 20 pe jiyenge.' },
              { who: 'nikhil', line: 'Bhai tu bhagwan hai. 2 se 3 ho gaya. Ab main location bhej sakta hoon.' },
              { who: 'nikhil', line: '...Location bhej di. Mummy ko. Galti se.', react: 'silence' },
              { who: 'nikhil', line: 'Koi nahi, mummy ko lagega main Rajiv Chowk pe shopping kar raha hoon. Shopping safe hai.' },
            ],
            effects: { help: 8, flags: ['nikhil-charged', 'nikhil-found'] },
            do: ['nikhil:found'],
            next: 'escort',
          },
          {
            intent: 'Send him to the stage alone with landmark directions',
            beats: [
              { who: 'player', line: 'Sun. Seedha ja, Hanuman mandir aayega, wahan se right, phir jahan sab chilla rahe hon wahan ruk jaana.' },
              { who: 'nikhil', line: 'Hanuman mandir. Right. Chillana. Got it.' },
              { who: 'nikhil', line: '(confidently left jaata hai)', react: 'silence' },
              { who: 'meera', line: 'Bhai usne left liya. Main dekh rahi hoon. Usne poore confidence se left liya.', via: 'phone' },
            ],
            effects: { aura: 3, help: -5, flags: ['nikhil-left'] },
            do: ['nikhil:lost', 'callback:directions'],
            end: 'fail',
          },
          {
            intent: 'Make him record a "first protest" intro for Meera',
            beats: [
              { who: 'player', line: 'Ruk. Pehle Meera ke liye intro. Camera dekh, bol.' },
              { who: 'nikhil', line: 'Hi, main Nikhil, second year, Kirori Mal, roll number—' },
              { who: 'player', line: 'Roll number mat bol!' },
              { who: 'nikhil', line: '—aur ye mera pehla protest hai. Mummy, agar dekh rahe ho, main shopping kar raha hoon.', react: 'laugh' },
              { who: 'meera', line: 'PERFECT. Ye reel chalegi. Iska roll number sabko pata chal gaya, par chalegi.', via: 'phone' },
            ],
            effects: { aura: 8, heat: 3, flags: ['nikhil-intro-reel', 'nikhil-found'] },
            do: ['nikhil:found'],
            next: 'escort',
          },
          {
            intent: 'Tell him to follow you and keep up',
            beats: [
              { who: 'player', line: 'Chal. Mere peeche. Kahin mat rukna, kisi uncle ke samose ke liye bhi nahi.' },
              { who: 'nikhil', line: 'Agar samosa free ho tab bhi?' },
              { who: 'player', line: 'Tab bhi.' },
              { who: 'nikhil', line: 'Tough. Theek hai. Leader ho tum.' },
            ],
            effects: { help: 4, flags: ['nikhil-found'] },
            do: ['nikhil:found'],
            next: 'escort',
          },
        ],
        leave: [['nikhil', 'Bhai? Kahan ja raha hai? Main yahin hoon, pillar ke paas. Pillar bhi yahin hai.']],
      },
      escort: {
        beats: [
          { who: 'nikhil', line: 'Kitna door hai stage? Kadmon mein nahi, battery mein bata.' },
          { who: 'player', line: 'Bas mere peeche reh. Bheed mein kho gaya toh main dhundhne nahi aaunga.' },
          { who: 'nikhil', line: 'Tu aayega. Tu hamesha aata hai. (pause) Aayega na?' },
        ],
        goal: {
          text: 'Walk Nikhil to the stage. Keep him close',
          until: ['at:nikhil:stage'],
          by: '11:30',
          marker: 'stage',
          onDone: 'wait-kabir',
          onFail: 'lost-again',
        },
      },
      'wait-kabir': {
        beats: [
          { who: 'nikhil', line: 'Yahi stage hai? Mujhe laga bada hoga. Ye toh mere chacha ki shaadi ka stage hai.' },
          { who: 'mira', line: 'Volunteers? Nahi? Theek hai, kam se kam mic ke saamne mat khade raho.' },
          { who: 'nikhil', line: 'Main yahin rukta hoon. Kabir gyarah baje aayega na? Main bas yahin khada rahunga. Pillar ki tarah.' },
          { who: 'kabir', line: 'aa raha hoon. mummy ko bola tuition ke baad library. library bhi technically ek jagah hai', via: 'phone' },
        ],
        goal: {
          text: 'Get Nikhil and Kabir together at the stage',
          until: ['at:nikhil:stage', 'near:nikhil:kabir'],
          by: '11:30',
          marker: 'kabirStage',
          onDone: 'reunion',
          onFail: 'lost-again',
        },
      },
      reunion: {
        camera: 'wide',
        beats: [
          { who: 'kabir', line: 'NIKHIL! Tu zinda hai! Group mein laga tujhe kisi pillar ne kha liya.' },
          { who: 'nikhil', line: 'Pillar acche the. Samosa uncle bhi acche the. Sab acche the. Bas koi exit nahi bata raha tha.' },
          { who: 'kabir', line: 'Sun, agar meri mummy call kare, main tuition pe hoon. Tu bhi tuition pe hai. Hum sab tuition pe hain.' },
          { who: 'nikhil', line: 'Kaunsi tuition?' },
          { who: 'kabir', line: 'Wahi jo hamesha hoti hai. Jantar Mantar wali.', react: 'laugh' },
          { who: 'dev', line: 'Bachcho, "Jantar Mantar wali tuition" placard pe likh do. Chal jayega.' },
        ],
        idle: [
          ['nikhil', 'Phone 1%. Ab main sirf bahut zaroori cheezein dekhunga. Jaise memes.'],
          ['kabir', 'Mera set gyarah minute ka hai. Usme se nau minute mummy ke baare mein hai.'],
        ],
        options: [
          {
            intent: 'Make Kabir swear to babysit Nikhil all day',
            beats: [
              { who: 'player', line: 'Kabir. Kasam kha. Aaj Nikhil tera hai. Washroom bhi saath jaana.' },
              { who: 'kabir', line: 'Bhai main comedian hoon, nanny nahi.' },
              { who: 'nikhil', line: 'Main bahut low-maintenance hoon. Bas charger, paani, aur koi mujhe baar baar bataye ki hum kahan hain.' },
              { who: 'kabir', line: '...Theek hai. Par isko set mein har joke pe hasna padega. Har joke pe.', react: 'laugh' },
            ],
            effects: { help: 10, mood: { kabir: 'sulking' }, flags: ['kabir-minds-nikhil'] },
            do: ['callback:babysit'],
            end: 'done',
          },
          {
            intent: 'Teach Nikhil his first slogan, at full volume',
            beats: [
              { who: 'player', line: 'Nikhil. Pehla naara. Mere saath: "Hum kya chahte?"' },
              { who: 'nikhil', line: 'EXIT!' },
              { who: 'crowd', line: 'EXIT! EXIT!', overlap: true },
              { who: 'mira', line: 'Ye naara kisne shuru kiya? ...Achha chal raha hai. Chalne do.', react: 'laugh' },
            ],
            effects: { aura: 10, heat: 3, flags: ['exit-chant'] },
            do: ['crowd:stage:+3', 'intensity:+1', 'callback:slogan'],
            end: 'done',
          },
          {
            intent: 'Give Kabir the Rajiv Chowk story for his set',
            beats: [
              { who: 'kabir', line: 'Ruk. Ek ladka. Rajiv Chowk. Bees minute. Exit ke saamne khada. ...Ye toh opener hai.' },
              { who: 'nikhil', line: 'Mera naam loge?' },
              { who: 'kabir', line: 'Naam, college, roll number. Sab public hai waise bhi.' },
              { who: 'nikhil', line: 'Fame. Finally.' },
            ],
            effects: { aura: 6, mood: { kabir: 'grateful' }, flags: ['nikhil-in-set'] },
            do: ['callback:opener'],
            end: 'done',
          },
          {
            intent: 'Hand him over and slip off for chai',
            beats: [
              { who: 'player', line: 'Toh... tum dono baat karo, main abhi aaya.' },
              { who: 'nikhil', line: '"Abhi aaya" matlab kitni der?' },
              { who: 'kabir', line: 'Matlab wo nahi aayega. Ye Delhi hai, Nikhil.', react: 'silence' },
            ],
            effects: { help: 2, flags: ['nikhil-handed-off'] },
            do: ['callback:chai'],
            end: 'done',
          },
        ],
      },
      'lost-again': {
        beats: [
          { who: 'nikhil', line: 'update: ab main ek aur pillar ke paas hoon. ye wala alag hai. ispe poster laga hai', via: 'phone' },
          { who: 'nikhil', line: 'update 2: phone 1%. agar main gayab ho jaun toh mera insta Meera chalaye', via: 'phone' },
          { who: 'meera', line: 'deal', via: 'phone' },
        ],
        end: 'fail',
      },
    },
    callbacks: {
      directions: 'Because you gave Nikhil "Hanuman mandir, phir right" at {t}, he was still taking lefts at {at}.',
      babysit: 'Because you made Kabir swear to babysit Nikhil at {t}, the two of them were never more than a samosa apart at {at}.',
      slogan: 'Because you taught Nikhil his first slogan at {t}, the stage was still chanting "EXIT!" at {at}.',
      opener: 'Because you gave Kabir the Rajiv Chowk story at {t}, Nikhil was the opening joke of his set at {at}.',
      chai: 'Because you handed Nikhil to Kabir with an "abhi aaya" at {t}, they were still waiting for you at {at}.',
    },
    outcomes: {
      done: {
        caption: 'First protest, first reunion 🫂 Nikhil 1% pe hai par spirit 100% 🔋',
        captionLater: 'Coaching centres EMPTY, students at Jantar Mantar instead. Who is sending these kids? 🤔',
        do: ['flag:nikhil-found'],
      },
      fail: {
        caption: 'Rajiv Chowk pe ek ladka pillar se location share kar raha hai. Pillar ne reply nahi kiya 📍',
        captionLater: 'Lost, confused youth roaming Delhi metro during "protest". Parents, are you watching? 🚨',
        callback: 'Because you left Nikhil to find his own way at {t}, he was still somewhere "near a pillar" at {at}.',
        do: ['nikhil:lost', 'flag:nikhil-left'],
      },
    },
  },
};
