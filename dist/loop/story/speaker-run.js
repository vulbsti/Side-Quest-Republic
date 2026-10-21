// speaker-run (Act 1, CP to the stage). Ravi's speaker has to be on the stage, switched on, for
// Mira's noon speech (rules.js startSpeech: speaker on the stage at 12:00 makes the speech big).
// At 10:30 Ravi carries it himself if it is still beside him (SCHEDULE 10:30). This wraps that:
// get to him first and he gets sidetracked (a mic stand at Rajiv Chowk), and the run is yours: carry
// it, push it on Asha's thela, or blast a song at CP first. Ravi forgets he gave it to you and goes
// looking for it (startRaviSearch); if he catches you with it he takes it to the stage himself.
// The window closes at 10:30 because after that the speaker is already on its way.
const EARLY = { before: '10:30' };
export default {
  'speaker-run': {
    title: 'Speaker run',
    act: 1,
    window: { from: '10:12', until: '10:30' },
    place: 'ravi',
    cast: ['ravi'],
    hook: {
      chat: [
        ['meera', 'Ravi bhaiya ka speaker dekha?? itna bada hai ki usme ek aur Ravi aa jaye'],
        ['meera', 'agar wo baarah baje tak stage pe nahi pahuncha toh Mira didi ki speech sirf pehli line sunegi'],
      ],
      overheard: [
        ['ravi', 'Ek chai aur, phir speaker. ...Nahi, do chai. Phir speaker.'],
        ['asha', 'Ravi, chai se speaker nahi uthta.'],
      ],
      card: 'Ravi\'s speaker has to reach the stage for the noon speech',
    },
    // Nobody came: Ravi gives up waiting for help and hauls it himself at 10:30 (the engine's routine).
    auto: {
      at: '10:29',
      beats: [
        ['ravi', 'Koi nahi aaya. Theek hai. Main khud. Jaise hamesha.'],
        ['asha', 'Kamar ka dhyaan rakhna, Ravi. Kamar ek hi hai.'],
      ],
      do: ['flag:ravi-alone'],
    },
    start: 'intro',
    nodes: {
      intro: {
        camera: 'none',
        beats: [
          { who: 'ravi', line: 'Bhai dekh isko. Tent house wale Gupta ji ka hai. Shaadi wala. Isme bass itna hai ki pichhli baar ek baraat ruk gayi thi.' },
          { who: 'ravi', line: 'Isko stage tak le jaana hai. Mira didi ki speech baarah baje. Aur—', react: 'cut' },
          { who: 'ravi', line: '(phone bajta hai) Haan Gupta ji. Haan. Mic stand? Rajiv Chowk pe? Abhi?' },
          { who: 'ravi', line: 'Bhai, mera cousin Rajiv Chowk pe mic stand leke khada hai. Aur ye speaker. Aur meri chai. Teen kaam, do haath.' },
        ],
        idle: [
          ['ravi', 'Isko akela chhod ke nahi ja sakta. Ye bahut emotional speaker hai.'],
          ['asha', 'Ravi, chai thandi ho rahi hai. Speaker nahi.'],
          ['ravi', 'Kamar mein abhi se dard hai. Ye anticipation wala dard hai.'],
        ],
        options: [
          {
            intent: 'Borrow Asha\'s thela as a push-cart',
            requires: EARLY,
            beats: [
              { who: 'player', line: 'Aunty, do minute ke liye thela?' },
              { who: 'asha', line: 'Mera thela? Ispe meri dukaan hai. Glass, cheeni, gas.' },
              { who: 'player', line: 'Speaker ke saath sab stage tak jayega. Free advertising.' },
              { who: 'asha', line: '...Ek glass toota toh pachaas rupaye. Aur kal se tumhari chai free nahi.' },
              { who: 'ravi', line: 'Bhagwan tera bhala kare. Main mic stand leke aaya. (bhaag jaata hai)' },
            ],
            effects: { aura: 6, nuisance: 5, mood: { asha: 'annoyed' }, flags: ['speaker-cart'] },
            do: ['take:speaker', 'move:ravi:metro'],
            next: 'cart',
          },
          {
            intent: 'Switch it on right here at CP, just one song',
            requires: EARLY,
            beats: [
              { who: 'player', line: 'Ravi bhaiya, test toh karna padega na? Ek gaana. Sound check.' },
              { who: 'ravi', line: 'Ek gaana. Bas ek. Main mic stand leke aaya.' },
              { who: 'ravi', line: '(jaate jaate) Volume teen pe rakhna! Teen!', react: 'cut' },
              { who: 'player', line: '(volume gyarah pe)' },
            ],
            effects: { aura: 6, nuisance: 6 },
            do: ['drop:speaker:speakerChai', 'move:ravi:metro', 'crowd:cp:+4'],
            clip: 'speaker-party',
            next: 'party',
          },
          {
            intent: 'Lift it yourself and carry it to the stage',
            requires: EARLY,
            beats: [
              { who: 'player', line: 'Laao. Main le jaata hoon. Tum mic stand lao.' },
              { who: 'ravi', line: 'Sach mein? Bhai pakad, neeche se. Neeche se! Aur bass wali side apni taraf.' },
              { who: 'player', line: '(uthata hai) Isme kya hai? Gupta ji khud?', react: 'laugh' },
              { who: 'ravi', line: 'Pandrah kilo. Plus feelings. Main abhi aaya!' },
            ],
            effects: { help: 6 },
            do: ['take:speaker', 'move:ravi:metro'],
            next: 'carry',
          },
          {
            intent: 'Tell Ravi to stop whining and carry it himself',
            beats: [
              { who: 'player', line: 'Bhaiya, aap volunteer ho. Volunteer ka matlab hi hai bhaari cheez uthana.' },
              { who: 'ravi', line: '(chai ka last ghoont) ...Theek hai. Main khud. Jaise hamesha.' },
              { who: 'asha', line: 'Ye bachcha Ravi ka HR hai kya?', react: 'laugh' },
              { who: 'ravi', line: 'Mic stand bhi khud laaunga. Do baar. Kyunki mere paas dost nahi hain.' },
            ],
            effects: { aura: 2, help: -4, mood: { ravi: 'sulking' } },
            do: ['callback:khud'],
            end: 'done',
          },
        ],
        leave: [['ravi', 'Theek hai, jao. Main aur speaker yahin hain. Hum dono bhaari hain.']],
      },
      carry: {
        beats: [
          { who: 'meera', line: 'tu speaker utha ke chal raha hai?? ruk, slow-mo. "hero carries the revolution"', via: 'phone' },
          { who: 'player', line: '(haanfte hue) Revolution... pandrah kilo ka hai.' },
        ],
        goal: {
          text: 'Carry the speaker to the Jantar Mantar stage',
          until: ['at:speaker:stage'],
          by: '11:55',
          marker: 'stageSpeaker',
          onDone: 'setup',
          onFail: 'flop',
        },
      },
      cart: {
        beats: [
          { who: 'asha', line: 'Dheere! Glass! Mere glass!' },
          { who: 'player', line: '(thela chalta hai. Glass bajte hain. Ek baraat ki tarah.)' },
          { who: 'crowd', line: 'Arre chai-speaker wala! Ek cutting dena bhai!' },
          { who: 'meera', line: 'thela + speaker + tu. ye reel nahi, ye documentary hai', via: 'phone' },
        ],
        goal: {
          text: 'Push Asha\'s thela, speaker and all, to the stage',
          until: ['at:speaker:stage'],
          by: '11:55',
          marker: 'stageSpeaker',
          onDone: 'setup',
          onFail: 'flop',
        },
      },
      party: {
        camera: 'phone',
        beats: [
          { who: 'crowd', line: '(bass girta hai. CP ke kabootar udte hain.)' },
          { who: 'asha', line: 'Mere glass hil rahe hain! Ye shaadi wala speaker hai, isme sirf "Mehendi laga ke rakhna" bajta hai!' },
          { who: 'crowd', line: 'MEHENDI LAGA KE RAKHNA!', overlap: true },
          { who: 'meera', line: 'BHAI. CP dance kar raha hai. Uncle log bhi. Ek uncle ne office bag neeche rakh diya.', via: 'phone' },
          { who: 'c2', line: '(bus ke paas se) Ye kya ho raha hai?' },
        ],
        idle: [
          ['crowd', 'Ek aur! Ek aur!'],
          ['asha', 'Chai ki bikri doguni. Theek hai, bajao. Par mere glass.'],
        ],
        options: [
          {
            intent: 'Let the CP party run, the stage can wait',
            beats: [
              { who: 'player', line: 'Ek aur! Stage baad mein, CP abhi!' },
              { who: 'crowd', line: 'CP! CP! CP!' },
              { who: 'asha', line: 'Ravi ko kya bologe?' },
              { who: 'player', line: 'Ravi ko ye reel bhejenge. Wo samjhega.', react: 'silence' },
            ],
            effects: { aura: 10, nuisance: 8 },
            do: ['crowd:cp:+3', 'intensity:+1', 'callback:party'],
            end: 'fail',
          },
          {
            intent: 'Dedicate the next song to Constable Meena, then run',
            beats: [
              { who: 'player', line: 'Ye agla gaana Meena madam ke liye! Duty pe sabse cool!' },
              { who: 'c2', line: '(sir hilati hai, par ek second ke liye pair hilta hai)', react: 'laugh' },
              { who: 'player', line: '(speaker uthata hai) Thank you CP! Agla show Jantar Mantar pe!' },
            ],
            effects: { aura: 8, mood: { c2: 'amused' }, flags: ['meena-song'] },
            do: ['take:speaker'],
            next: 'carry',
          },
          {
            intent: 'Kill it before Sharma hears and run for the stage',
            beats: [
              { who: 'player', line: '(switch off) Bas! Sound check ho gaya!' },
              { who: 'crowd', line: 'Booooo!' },
              { who: 'asha', line: 'Achha kiya. Sharma aata toh speaker bhi jaata, tum bhi.' },
            ],
            effects: { help: 3, aura: -2 },
            do: ['take:speaker'],
            next: 'carry',
          },
        ],
      },
      setup: {
        camera: 'wide',
        beats: [
          { who: 'mira', line: 'Ye... speaker hai? Ravi kahan hai?' },
          { who: 'player', line: 'Mic stand lene gaya hai. Rajiv Chowk.' },
          { who: 'mira', line: 'Mic stand toh yahin hai. Kal se.', react: 'silence' },
          { who: 'dev', line: 'Ravi ko phone karo koi. Nahi, rehne do. Uska phone bhi speaker mein hi chalta hoga.' },
          { who: 'zoya', line: '(live) Jantar Mantar pe speaker pahunch gaya hai. Speech baarah baje. Abhi tak sirf kabootar sun rahe hain.' },
        ],
        idle: [
          ['mira', 'Wire kahan lagega? Kisi ko pata hai? Ravi ko pata hai. Ravi kahan hai?'],
          ['dev', 'Mere megaphone ko bura lag raha hai.'],
        ],
        options: [
          {
            intent: 'Hide it behind the stage as a noon "surprise"',
            beats: [
              { who: 'player', line: 'Ek idea. Isko peeche chhupa dete hain. Baarah baje, BOOM. Surprise.' },
              { who: 'mira', line: 'Surprise kisko? Speaker ko pata hai wo stage pe hai?' },
              { who: 'dev', line: 'Mujhe ye idea pasand hai. Mujhe har bura idea pasand hai.', react: 'laugh' },
            ],
            effects: { aura: 4, nuisance: 4, flags: ['speaker-hidden'] },
            do: ['drop:speaker:stageTop', 'callback:surprise'],
            end: 'fail',
          },
          {
            intent: 'Do the mic check yourself',
            beats: [
              { who: 'player', line: '(mic pe) Hello hello. Mic testing. Ek do teen. Sharma ji sun rahe ho?' },
              { who: 'crowd', line: '(barricade tak awaaz jaati hai)' },
              { who: 'sharma', line: '(door se, wireless pe) ...Haan. Sun raha hoon.', via: 'wireless' },
              { who: 'mira', line: 'Okay. Okay, ye kaam karta hai. Tum kaun ho waise?' },
            ],
            effects: { aura: 8, help: 6, mood: { mira: 'grateful' }, flags: ['speaker-mic-check'] },
            do: ['drop:speaker:stageSpeaker', 'callback:mic'],
            end: 'done',
          },
          {
            intent: 'Let Dev mic-check through his megaphone',
            beats: [
              { who: 'dev', line: '(megaphone mic ke saamne) HELLO—' },
              { who: 'crowd', line: '(EEEEEEEEEEEEEE)', react: 'cut' },
              { who: 'mira', line: 'DEV.' },
              { who: 'dev', line: 'Feedback. Matlab system kaam kar raha hai. Democracy bhi aisi hi hoti hai.' },
            ],
            effects: { aura: 4, nuisance: 3, mood: { dev: 'amused', mira: 'annoyed' } },
            do: ['drop:speaker:stageSpeaker', 'callback:feedback'],
            end: 'done',
          },
          {
            intent: 'Play one song to warm up the crowd',
            beats: [
              { who: 'player', line: 'Speech se pehle mahaul. Ek gaana.' },
              { who: 'crowd', line: '(Mehendi laga ke rakhna. Phir se.)' },
              { who: 'mira', line: 'Ye protest hai, sangeet nahi.' },
              { who: 'crowd', line: 'DOLI SAJA KE RAKHNA!' },
              { who: 'mira', line: '...Theek hai, bheed toh aa gayi.', react: 'laugh' },
            ],
            effects: { aura: 10, nuisance: 5 },
            clip: 'speaker-party',
            do: ['drop:speaker:stageSpeaker', 'crowd:stage:+3', 'intensity:+1', 'callback:warmup'],
            end: 'done',
          },
        ],
      },
      flop: {
        beats: [
          { who: 'mira', line: 'Baarah baj gaye. Speaker? Koi? ...Theek hai. Main zor se bolungi.' },
          { who: 'ravi', line: 'Mic stand mil gaya! ...Speaker kahan hai?', via: 'phone' },
        ],
        end: 'fail',
      },
    },
    callbacks: {
      khud: 'Because you told Ravi to carry his own speaker at {t}, he was still holding his back at {at}.',
      party: 'Because you turned CP into a sangeet at {t}, the uncles were still dancing to "Mehendi laga ke rakhna" at {at}.',
      surprise: 'Because you hid the speaker behind the stage as a "surprise" at {t}, it was still a surprise at {at}.',
      mic: 'Because you did the mic check at {t}, Sharma heard "Sharma ji sun rahe ho?" all the way at the barricade, and still did at {at}.',
      feedback: 'Because you let Dev mic-check through his megaphone at {t}, Jantar Mantar was still ringing at {at}.',
      warmup: 'Because you warmed up the stage with a wedding song at {t}, there was a crowd for the speech at {at}.',
    },
    outcomes: {
      done: {
        caption: 'Speaker stage pe pahunch gaya 🔊 Ravi bhaiya ki kamar nahi pahunchi. Noon speech LOUD hogi',
        captionLater: 'Who is FUNDING the sound systems at Jantar Mantar? Follow the money 🧐 #ToolkitGang',
      },
      fail: {
        caption: 'Mira didi ki speech ke liye speaker kahin aur baj raha hai. Stage pe sirf "mic check" ki goonj 🎤',
        captionLater: 'Loud music, dancing, "protest"? Jantar Mantar has become a party venue 🙄',
      },
    },
  },
};
