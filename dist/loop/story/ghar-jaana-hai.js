// ghar-jaana-hai: dusk at the Rajiv Chowk exit. Regroup with whoever made it, Kabir's mummy calls (you,
// this time), and the morning clip comes back with the evening caption. Quiet, funny-sad, the last scene
// before the ending card. Who is here reads the flags dhuan sets (nikhil-safe, kabir-safe, kabir-hurt,
// kabir-on-bus, meera-safe, meera-phone-gone); it wants a friend:<who>:<state> predicate (plans/notes).
// Format: plans/story-rebuild.md. Engine: dist/loop/story.js.
export default {
  'ghar-jaana-hai': {
    title: 'Ghar jaana hai',
    act: 5,
    window: { from: '17:00', until: '18:00' },
    place: 'metro',
    cast: ['meera', 'kabir', 'nikhil'],
    requires: { detained: false },
    hook: {
      chat: [
        ['kabir', 'metro gate 2. jo bhi bacha hai aa jao'],
        ['meera', 'golden hour hai. sab barbaad hai par light dekh'],
        ['nikhil', 'Update: main metro pe hoon. Shayad. Yahan bhi pillar hain.'],
      ],
      overheard: [
        ['crowd', 'Agla station Rajiv Chowk. Darwaze baayi taraf khulenge. Kripya dhuan wale bag scanner mein daalein.'],
      ],
      card: 'Regroup at the Rajiv Chowk Metro exit',
    },
    // You never come: the others give up waiting and take the train.
    auto: {
      at: '17:45',
      beats: [
        ['kabir', 'Chal, nikalte hain. Usko message kar diya. Bas ek emoji bhej de, bola hai.'],
        ['meera', 'Last metro nahi hai, par mummy hai. Chalo.'],
      ],
      do: ['leave:kabir', 'leave:meera', 'flag:went-home-without-you'],
      end: 'fail',
    },
    start: 'walk',
    nodes: {
      walk: {
        beats: [{ who: 'meera', line: '(chat) gate 2. seedhiyon ke paas. jahan subah Nikhil kho gaya tha', via: 'phone' }],
        goal: {
          text: 'Get to the Rajiv Chowk exit, gate 2',
          until: ['at:player:metro'],
          by: '17:55',
          onDone: 'gate',
          onFail: 'late',
          marker: 'metro',
        },
      },
      gate: {
        camera: 'wide',
        beats: [
          { who: 'meera', line: 'Light dekh. Golden hour. Sab barbaad hai par light dekh.' },
          { who: 'crowd', line: '(guard) Bag scanner mein! Haan, dhuan wala bag bhi!' },
          { who: 'kabir', line: 'Subah hum yahan se nikle the. Revolution ke liye. Ab ghar ja rahe hain. Khaane ke liye.', react: 'silence' },
        ],
        idle: [
          ['meera', 'Ek last photo? Nahi. Koi photo nahi. Theek hai ek.'],
          ['crowd', 'Token yahan, card wahan. Line mein.'],
          ['kabir', 'Mera last joke kisi ne nahi suna. Shayad achha hi hai.'],
        ],
        options: [
          {
            intent: 'Count heads, like a school trip',
            requires: { notFlags: ['gh-count'] },
            beats: [{ who: 'player', line: 'Ek. Do. Teen... ruk. Phir se. Ek...' }],
            effects: { flags: ['gh-count'] },
            next: 'count',
          },
          {
            intent: 'Check the feed',
            requires: { notFlags: ['gh-repost'] },
            beats: [{ who: 'meera', line: 'Mat dekh. ...Achha dekh. Par baith ke dekh.' }],
            effects: { flags: ['gh-repost'] },
            next: 'repost',
          },
          {
            intent: 'Pick up: it\'s Kabir\'s mummy, and she is calling you',
            requires: { notFlags: ['gh-mummy'] },
            beats: [{ who: 'player', line: '(phone baj raha hai) ...Kabir. Teri mummy. Mujhe kyun?', sfx: 'phone-ring' }],
            effects: { flags: ['gh-mummy'] },
            next: 'mummy',
          },
          {
            intent: 'Go down the escalator together. Ghar jaana hai',
            beats: [
              { who: 'kabir', line: 'Chalo. Kal college hai.' },
              { who: 'meera', line: 'Kal reel hai.' },
              { who: 'nikhil', line: 'Update: kal main ghar pe charger ke saath hoon. Bas.', react: 'laugh' },
            ],
            do: ['follow:meera', 'callback:together'],
            end: 'done',
          },
        ],
      },
      count: {
        camera: 'wide',
        beats: [{ who: 'meera', line: 'Ginti mat kar. Jo hai, yahi hai.' }],
        options: [
          {
            intent: 'Hug Nikhil, who smells of Dettol',
            requires: { flags: ['nikhil-safe'] },
            beats: [
              { who: 'nikhil', line: 'Update: hug ho raha hai.' },
              { who: 'nikhil', line: 'Update: abhi bhi ho raha hai.', react: 'laugh' },
            ],
            do: ['follow:nikhil', 'friend:nikhil:ok'],
            next: 'gate',
          },
          {
            intent: 'Go back for Nikhil, whose phone has died',
            requires: { notFlags: ['nikhil-safe'] },
            beats: [
              { who: 'player', line: 'Nikhil nahi hai. Main dekhta hoon. Pillar wala ladka hai, pillar ke paas hoga.' },
              { who: 'meera', line: '(phone dikhate hue) Uska last message: "Update: Asha aunty ke stall pe hoon, chai free hai". Phir phone mar gaya.' },
            ],
            do: ['move:nikhil:chai'],
            next: 'pillars',
          },
          {
            intent: 'Ask Kabir about his arm',
            requires: { flags: ['kabir-hurt'] },
            beats: [
              { who: 'kabir', line: 'Toota nahi hai. Mud gaya hai. Comedy mein isse "callback" bolte hain.' },
              { who: 'kabir', line: 'Mummy ko bolunga tuition mein bench gir gayi. Bench pe. Mere upar.', react: 'silence' },
            ],
            effects: { help: 2 },
            do: ['friend:kabir:hurt'],
            next: 'gate',
          },
          {
            intent: 'Ask whoever was on the bus how it was',
            requires: { anyFlags: ['kabir-on-bus', 'nikhil-on-bus'] },
            beats: [
              { who: 'kabir', line: 'Bus mein ek uncle the. Kele lene aaye the. Main ab unka biographer hoon.' },
              { who: 'nikhil', line: 'Update: bus mein fan nahi chalta. Ye sabko pata hona chahiye.' },
            ],
            next: 'gate',
          },
          {
            intent: 'Stop counting. Whoever is here is here',
            beats: [
              { who: 'player', line: '...Teen. Theek hai. Teen bahut hai.' },
              { who: 'kabir', line: 'Teen ka matlab hum ek band hain. Ya ek auto.', react: 'laugh' },
            ],
            next: 'gate',
          },
          {
            intent: 'Ask Meera about her phone',
            requires: { flags: ['meera-phone-gone'] },
            beats: [
              { who: 'meera', line: 'Naya phone. Naya account. Naya main.' },
              { who: 'meera', line: 'Purana main zyada funny tha. Uske paas drafts the.', react: 'silence' },
            ],
            next: 'gate',
          },
        ],
      },
      // Physical stages: Nikhil's phone died at Asha's chai stall by the CP stop. Go and get him, then walk
      // back to the gate together.
      pillars: {
        beats: [{ who: 'crowd', line: '(koi) Ek neele kurte wala ladka "update, update" bolte hue CP ki taraf gaya.' }],
        goal: {
          text: 'Nikhil is at Asha\'s chai stall with a dead phone. Go and get him',
          until: ['at:player:cp'],
          by: '17:50',
          onDone: 'nikhil-back',
          onFail: 'nikhil-text',
          marker: 'nikhil',
        },
      },
      'nikhil-back': {
        camera: 'wide',
        beats: [
          { who: 'nikhil', line: 'Phone mar gaya tha. Toh main bas... chai pe ruk gaya. Asha aunty ne bola "jo dhoondhta hai woh chai pe aata hai".' },
          { who: 'player', line: 'Maine subah ye bola tha?' },
          { who: 'nikhil', line: 'Nahi. Par tu bolta.', react: 'silence' },
        ],
        options: [
          {
            intent: 'Tell him he did the right thing',
            beats: [{ who: 'nikhil', line: 'Update: maine sahi kiya. Pehli baar aaj.' }],
            effects: { help: 6, mood: { nikhil: 'grateful' } },
            do: ['move:nikhil:metro', 'friend:nikhil:ok', 'flag:nikhil-safe', 'callback:pillars'],
            next: 'walk-back',
          },
          {
            intent: 'Tell him never to do that again',
            beats: [{ who: 'nikhil', line: 'Kya? Khada hona? Ya protest?' }, { who: 'player', line: '...Dono. Nahi. Pata nahi.' }],
            do: ['move:nikhil:metro', 'friend:nikhil:ok', 'flag:nikhil-safe', 'callback:pillars'],
            next: 'walk-back',
          },
        ],
      },
      'walk-back': {
        beats: [{ who: 'nikhil', line: 'Update: main tere peeche hoon. Sorry. Aadat hai.' }],
        goal: {
          text: 'Walk Nikhil back to gate 2 before the others give up',
          until: ['at:nikhil:metro', 'at:player:metro'],
          by: '17:58',
          onDone: 'gate',
          onFail: 'late',
          marker: 'metro',
        },
      },
      'nikhil-text': {
        camera: 'phone',
        beats: [
          { who: 'nikhil', line: '(kisi aur ke phone se) Update: Nikhil bol raha hoon. Uncle ka phone hai. Main auto mein hoon. Ghar ja raha hoon.', via: 'phone' },
          { who: 'nikhil', line: 'Update: uncle bol rahe hain unka phone wapas do.', via: 'phone', react: 'laugh' },
        ],
        options: [
          {
            intent: 'Make him send a photo of the auto number',
            beats: [{ who: 'nikhil', line: '(photo) DL 1R 4... Uncle ne bola bas karo.', via: 'phone' }],
            effects: { help: 4 },
            do: ['friend:nikhil:ok', 'callback:auto'],
            next: 'gate',
          },
          {
            intent: 'Thank the uncle and let it go',
            beats: [{ who: 'player', line: '(chat) thank you uncle. pls usse ghar tak chhod dena. woh update bhejta rahega, ignore karna' }],
            do: ['friend:nikhil:ok', 'callback:auto'],
            next: 'gate',
          },
        ],
      },
      repost: {
        camera: 'phone',
        beats: [
          { who: 'meera', line: 'Subah wala clip. Same video. Subah caption tha "uncle aap cute ho 😭".' },
          { who: 'meera', line: 'Ab caption hai "Protesters mocking police on duty. Anti-national?? 🚨". Do lakh views.', react: 'silence' },
          { who: 'kabir', line: 'Same video. Same uncle. Same cute.' },
          { who: 'nikhil', line: 'Update: humari mummy log ye page follow karti hain.', react: 'silence' },
        ],
        options: [
          {
            intent: 'Comment "context?" under the repost',
            beats: [
              { who: 'meera', line: '400 replies. 300 tujhe gaali. 100 "bhai main tha wahan, sach mein cute the".' },
              { who: 'kabir', line: 'Sau log! Sau log sach bol rahe hain! Ye toh majority hai... nahi hai. Theek hai.' },
            ],
            effects: { aura: 4, heat: 4 },
            next: 'gate',
          },
          {
            intent: 'Report the post (it will do nothing)',
            beats: [
              { who: 'player', line: '(report) ...Done.' },
              { who: 'meera', line: '"Thanks for reporting. We found this post does not go against our community guidelines." Aath second mein.', react: 'laugh' },
            ],
            next: 'gate',
          },
          {
            intent: 'Repost the morning original over it',
            beats: [
              { who: 'meera', line: 'Original audio. Original caption. Original uncle. Posted.' },
              { who: 'meera', line: 'Tere wale pe 300 views. Unke wale pe do lakh. Par tere wale pe Sharma uncle ka like hai.', react: 'laugh' },
            ],
            effects: { aura: 8, heat: 6 },
            do: ['target:stream', 'callback:original'],
            next: 'gate',
          },
        ],
      },
      mummy: {
        camera: 'phone',
        beats: [
          { who: 'mummy', line: 'Hello? Beta? Kabir tumhare saath hai? Uska phone band hai. Tuition ke baad bhi band hai.', via: 'phone' },
          { who: 'mummy', line: 'TV pe dikha rahe hain Jantar Mantar pe dhuan. Tuition ke paas hi hai na Jantar Mantar?', via: 'phone', react: 'silence' },
        ],
        idle: [['mummy', 'Hello? Beta? Awaaz aa rahi hai?'], ['kabir', '(muh se) Tuition. TUITION.']],
        options: [
          {
            intent: 'Tell her Kabir is at tuition. Still',
            beats: [
              { who: 'player', line: 'Aunty woh... extra class. Saade paanch tak. Verma sir bahut strict hain.' },
              { who: 'mummy', line: 'Saade paanch tak? Itni padhai? Achha hai. Usko bolo khaana garam hai.', via: 'phone' },
              { who: 'kabir', line: '(dheere) Tu bhagwan hai. Chhota wala. Gali ka.', react: 'laugh' },
            ],
            effects: { aura: 4, flags: ['tuition-alibi-holds'] },
            do: ['callback:alibi'],
            next: 'gate',
          },
          {
            intent: 'Tell her the truth, all of it',
            beats: [
              { who: 'player', line: 'Aunty, hum sab Jantar pe the. Subah se. Kabir theek hai. Hum saath hain. Ghar aa rahe hain.' },
              { who: 'mummy', line: '...', via: 'phone', react: 'silence' },
              { who: 'mummy', line: 'Khaana kha ke aana. Aur Kabir ko bhi khila ke laana. Aur beta... theek ho na tum?', via: 'phone' },
            ],
            effects: { help: 8, flags: ['mummy-knows-truth'] },
            do: ['callback:truth'],
            next: 'gate',
          },
          {
            intent: 'Hand the phone to Kabir',
            beats: [
              { who: 'kabir', line: 'Mummy. Haan. Main theek hoon. Haan. Haath? Kaunsa haath? Dono hain. Gin lo.' },
              { who: 'mummy', line: 'Ghar aa. Phir baat karte hain.', via: 'phone', react: 'cut' },
              { who: 'kabir', line: '"Phir baat karte hain." Ye Delhi ka sabse khatarnak naara hai.', react: 'laugh' },
            ],
            do: ['callback:kabir-phone'],
            next: 'gate',
          },
          {
            intent: 'Let it ring. Just watch it ring',
            beats: [
              { who: 'player', line: '(phone bajta hai. bajta rehta hai. ruk jaata hai.)', react: 'silence' },
              { who: 'meera', line: 'Kal bolna network nahi tha. Metro mein network nahi hota. Sab jaante hain.' },
            ],
            effects: { aura: -2 },
            next: 'gate',
          },
        ],
      },
      late: {
        camera: 'phone',
        beats: [
          { who: 'kabir', line: '(chat) hum andar aa gaye. tu kahan reh gaya', via: 'phone' },
          { who: 'meera', line: '(chat) next metro pe aa jana. ya kal. kal bhi theek hai', via: 'phone' },
        ],
        options: [
          {
            intent: 'Send a thumbs up and walk home the long way',
            beats: [{ who: 'player', line: '(chat) 👍' }],
            end: 'fail',
          },
          {
            intent: 'Send a long voice note nobody will listen to',
            beats: [{ who: 'player', line: '(voice note, 4:12) ...toh basically main bas ye bolna chahta tha ki...' }],
            effects: { aura: 2 },
            end: 'fail',
          },
        ],
      },
    },
    callbacks: {
      together: 'Because you waited at gate 2 at {t}, you all went down the escalator together at {at}.',
      pillars: 'Because you went back to the chai stall for Nikhil at {t}, he was on the same train home at {at}.',
      auto: 'Because a stranger lent Nikhil his phone at {t}, you knew the auto number at {at}.',
      original: 'Because you reposted the morning original at {t}, at least one version of you was still "cute" at {at}.',
      alibi: 'Because you told Kabir\'s mummy "extra class" at {t}, the tuition story survived the whole day at {at}.',
      truth: 'Because you told Kabir\'s mummy the truth at {t}, there was food waiting at {at}.',
      'kabir-phone': 'Because you handed Kabir the phone at {t}, "phir baat karte hain" was waiting for him at {at}.',
    },
    outcomes: {
      done: {
        caption: 'Rajiv Chowk, 5:40. Thake hue, dhuan wale, par saath. Gate 2. 🚇🧡',
        captionLater: 'Same "students" seen leaving together after Jantar Mantar violence. Organised group?? 🚨',
        callback: 'Because you regrouped at the Metro at {t}, you went home together at {at}.',
      },
      fail: {
        caption: 'Group chat, 5:50 pm: "tu kahan hai" "next metro" "kal". 🚇',
        captionLater: 'Lone protester seen loitering at Rajiv Chowk after violence. Police keeping watch.',
        callback: 'Because you weren\'t at the gate at {t}, your friends took the train without you at {at}.',
      },
    },
  },
};
