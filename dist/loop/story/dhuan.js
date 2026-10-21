// dhuan: the smoke. From the tear gas and the lathi charge (rules.js tearGas at 16:00, startCharge at the
// director's time), your friends are scattered. Nikhil texts useless landmarks, Meera's phone is about to
// be taken, Kabir is doing a bit in front of a lathi. You can't save everyone in time; whoever you reach
// ends 'ok', and every friend's state lands on the ending card through do 'friend:<who>:<state>'.
// Flags for ghar-jaana-hai: nikhil-safe, kabir-safe, kabir-hurt, kabir-on-bus, meera-safe, meera-phone-gone.
// Format: plans/story-rebuild.md. Engine: dist/loop/story.js.
const BAD_DEFAULTS = ['friend:nikhil:missing', 'friend:meera:hurt', 'flag:dhuan-in'];

export default {
  dhuan: {
    title: 'Dhuan',
    act: 4,
    window: { from: '16:00', until: '16:50' },
    place: 'meera',
    cast: ['meera'],
    requires: { detained: false },
    hook: {
      chat: [
        ['nikhil', 'kuch dikh nahi raha'],
        ['meera', 'ek constable mera phone le raha hai!! MERA PHONE'],
        ['kabir', 'bhai main yahan hoon. yahan matlab... yahan'],
      ],
      overheard: [
        ['raf', 'Peeche! Peeche hato! PEECHE!'],
        ['crowd', 'Aankh mat ragadna! Paani daalo, ragdo mat!'],
      ],
      card: 'Smoke everywhere. Find your friends',
    },
    // You never come: Nikhil walks the wrong way into the grey, Meera gets shoved and loses the phone.
    auto: {
      at: '16:35',
      beats: [
        ['nikhil', 'Update: kuch dikh nahi raha. Kisi ko kuch dikh raha hai? Koi reply karo.'],
        ['meera', 'Phone gaya. Chaar saal ki reels. Haath bhi chhil gaya. Koi nahi aaya.'],
      ],
      do: ['friend:nikhil:missing', 'friend:meera:hurt', 'flag:meera-phone-gone', 'flag:dhuan-alone', 'intensity:+5'],
      end: 'fail',
    },
    start: 'smoke',
    nodes: {
      smoke: {
        camera: 'wide',
        beats: [
          { who: 'raf', line: 'Peeche! PEECHE!', sfx: 'whistle' },
          { who: 'sana', line: 'Ragdo mat! Paani se dho! Aankh band, muh band, chalo!' },
          { who: 'nikhil', line: 'kuch dikh nahi raha', via: 'phone', sfx: 'phone-buzz' },
          { who: 'meera', line: 'Ek constable mera phone le raha hai! Mera 40k followers wala phone!', via: 'phone' },
          { who: 'kabir', line: '(kahin se) Bhai! Main yahan hoon! Yahan matlab... yahan!' },
        ],
        idle: [
          ['crowd', 'Gali ki taraf! Nahi, gali mein bhi dhuan hai!'],
          ['nikhil', 'Update: aankh band hai. Isliye kuch nahi dikh raha. Ya isliye nahi.'],
          ['sana', 'Jisko saans nahi aa rahi, mere tent pe! Line mein! Line mein bhi bhaago!'],
        ],
        options: [
          {
            intent: 'Follow Nikhil\'s useless texts',
            beats: [{ who: 'player', line: '(phone pe) Nikhil. Ruk. Bata kya dikh raha hai. Kuch bhi.' }],
            do: BAD_DEFAULTS,
            next: 'nikhil',
          },
          {
            intent: 'Go for Meera before the cop takes her phone',
            beats: [{ who: 'player', line: 'Meera! Awaaz de! Main aa raha hoon!' }],
            do: BAD_DEFAULTS,
            next: 'meera',
          },
          {
            intent: 'Get to Kabir, he is right in front of the lathis',
            beats: [{ who: 'player', line: 'Kabir! Wahin ruk! Mat bol kuch! Kuch bhi mat bol!' }],
            do: BAD_DEFAULTS,
            next: 'kabir',
          },
          {
            intent: 'Save yourself: run for the Metro and text from there',
            beats: [
              { who: 'player', line: '(bhaagte hue, chat) sab metro pe milo. sab. metro.' },
              { who: 'nikhil', line: 'konsi metro', via: 'phone' },
              { who: 'meera', line: 'tu bhaag gaya??', via: 'phone', react: 'silence' },
            ],
            effects: { heat: -6, help: -8 },
            do: [...BAD_DEFAULTS, 'flag:dhuan-ran', 'stance:scatter', 'callback:ran'],
            end: 'fail',
          },
        ],
      },
      hub: {
        camera: 'wide',
        beats: [
          { who: 'crowd', line: 'Koi paani do! Idhar ek ladki baith gayi hai!' },
          { who: 'wireless', line: 'Rao: Area clear karo. Pandrah minute. Over.' },
        ],
        idle: [['crowd', 'Chappal! Kiski chappal hai ye!'], ['sana', 'Ek line! Mere tent tak ek line!']],
        options: [
          {
            intent: 'Go after Nikhil next',
            requires: { notFlags: ['dhuan-nikhil'] },
            beats: [{ who: 'player', line: '(phone) Nikhil. Main aa raha hoon. Kuch bhi bata.' }],
            next: 'nikhil',
          },
          {
            intent: 'Go after Meera next',
            requires: { notFlags: ['dhuan-meera'] },
            beats: [{ who: 'player', line: 'Meera kahan hai? Kisi ne Meera dekhi? Gulabi top!' }],
            next: 'meera',
          },
          {
            intent: 'Go after Kabir next',
            requires: { notFlags: ['dhuan-kabir'] },
            beats: [{ who: 'player', line: 'Kabir ki awaaz aa rahi hai. Woh abhi bhi joke maar raha hai.' }],
            next: 'kabir',
          },
          {
            intent: 'That\'s everyone you can reach. Head for the Metro',
            beats: [
              { who: 'player', line: '(chat) jo bhi mila, metro pe. rajiv chowk. gate 2. koi akela nahi jaayega.' },
              { who: 'sana', line: 'Ye lo. Paani. Aur ek aur bottle. Kisi aur ke liye.' },
            ],
            effects: { help: 4 },
            do: ['callback:regroup'],
            end: 'done',
          },
        ],
      },

      // --- Nikhil, by his updates ------------------------------------------------------------
      nikhil: {
        camera: 'phone',
        beats: [
          { who: 'nikhil', line: 'Update: ek pillar ke paas hoon.', via: 'phone' },
          { who: 'nikhil', line: 'Update: ek uncle ki chappal gir gayi. Woh dhoondh rahe hain. Main bhi help kar raha hoon.', via: 'phone' },
          { who: 'nikhil', line: 'Update: ab do pillar hain. Shayad aankh ki wajah se.', via: 'phone', react: 'silence' },
        ],
        idle: [['nikhil', 'Update: pillar wahi hai. Main wahi hoon. Bas.']],
        options: [
          {
            intent: 'Ask him what he can smell',
            beats: [
              { who: 'player', line: 'Dekh nahi raha toh soongh. Kya smell aa raha hai?' },
              { who: 'nikhil', line: 'Bhutta. Aur Dettol. Aur dar.', via: 'phone' },
              { who: 'player', line: 'Dettol matlab Sana ka tent. Wahin ruk. Bilkul wahin.' },
            ],
            do: ['move:nikhil:sanaTent'],
            next: 'nikhil-go',
          },
          {
            intent: 'Tell him to stand still and shout "Update!"',
            beats: [
              { who: 'nikhil', line: '(door se) UPDATE!' },
              { who: 'crowd', line: 'Kya update? Kya hua? Police ja rahi hai?', overlap: true, react: 'laugh' },
              { who: 'nikhil', line: 'Update: sab mujhse update maang rahe hain. Mere paas nahi hai.', via: 'phone' },
            ],
            effects: { aura: 4 },
            do: ['move:nikhil:sanaTent'],
            next: 'nikhil-go',
          },
          {
            intent: 'Tell him to walk to the Metro alone and wait',
            beats: [
              { who: 'player', line: 'Nikhil, seedha chal. Jahan se aaye the. Metro. Wahan ruk.' },
              { who: 'nikhil', line: 'Update: seedha chal raha hoon. Seedha kaunsa hai?', via: 'phone', react: 'silence' },
            ],
            do: ['move:nikhil:metro', 'friend:nikhil:missing', 'flag:dhuan-nikhil', 'flag:nikhil-sent-to-metro'],
            next: 'hub',
          },
          {
            intent: 'Remember Nikhil is still on the bus. Tell him to stay',
            requires: { flags: ['nikhil-on-bus'], notFlags: ['friends-out'] },
            beats: [
              { who: 'player', line: 'Nikhil. Tu bus mein hai na? Kaunsa pillar?' },
              { who: 'nikhil', line: 'Update: pillar matlab bus ka pole. Main bus mein hoon. Bhool gaya tha.', via: 'phone', react: 'laugh' },
              { who: 'player', line: 'Wahin reh. Aaj Jantar pe sabse safe jagah wahi hai.' },
            ],
            effects: { help: 2 },
            do: ['friend:nikhil:detained', 'flag:dhuan-nikhil', 'callback:bus-safe'],
            next: 'hub',
          },
        ],
      },
      'nikhil-go': {
        beats: [{ who: 'nikhil', line: 'Update: Dettol ki taraf ja raha hoon. Dettol strong hai. Achha hai.', via: 'phone' }],
        goal: {
          text: 'Find Nikhil by Sana\'s tent (follow the Dettol)',
          until: ['at:player:stage', 'at:nikhil:stage'],
          by: '16:45',
          onDone: 'nikhil-found',
          onFail: 'nikhil-gone',
          marker: 'sanaTent',
        },
      },
      'nikhil-found': {
        camera: 'wide',
        beats: [
          { who: 'nikhil', line: 'Bhai. BHAI. Tu asli hai? Ya pillar?' },
          { who: 'player', line: 'Main hoon. Haath de.' },
          { who: 'nikhil', line: 'Update: mil gaya.', react: 'silence' },
        ],
        options: [
          {
            intent: 'Grab his hand and do not let go',
            beats: [{ who: 'nikhil', line: 'Tu chhodna mat. Main phir pillar ke paas chala jaaunga.' }],
            effects: { help: 8, mood: { nikhil: 'grateful' } },
            do: ['follow:nikhil', 'friend:nikhil:ok', 'flag:nikhil-safe', 'flag:dhuan-nikhil', 'callback:nikhil'],
            next: 'hub',
          },
          {
            intent: 'Leave him with Sana and go back in',
            beats: [
              { who: 'sana', line: 'Baith. Aankh khol. Ab band. Theek hai. Tum jao, ye mere paas hai.' },
              { who: 'nikhil', line: 'Update: main safe hoon. Sana didi ne mujhe juice diya. Ye best protest hai.' },
            ],
            effects: { help: 10 },
            do: ['friend:nikhil:ok', 'flag:nikhil-safe', 'flag:dhuan-nikhil', 'callback:sana'],
            next: 'hub',
          },
        ],
      },
      'nikhil-gone': {
        camera: 'phone',
        beats: [
          { who: 'nikhil', line: 'Update: main metro ki taraf ja raha hoon shayad. Ya Parliament. Sab grey hai.', via: 'phone' },
          { who: 'nikhil', line: 'Update: 2%.', via: 'phone', react: 'silence' },
        ],
        options: [
          {
            intent: 'Keep texting him landmarks till his phone dies',
            beats: [{ who: 'player', line: '(chat) gol building. phir seedha. phir chai wali. phir metro. nikhil?' }],
            do: ['friend:nikhil:missing', 'flag:dhuan-nikhil'],
            next: 'hub',
          },
          {
            intent: 'Get Meera to post his photo: "lost: one Nikhil"',
            beats: [{ who: 'meera', line: '(chat) posted. "kurta, neela, phone 2%, bolta hai update". 40 shares already' }],
            effects: { aura: 4 },
            do: ['friend:nikhil:missing', 'flag:dhuan-nikhil', 'flag:nikhil-poster'],
            next: 'hub',
          },
        ],
      },

      // --- Meera's phone ---------------------------------------------------------------------
      meera: {
        camera: 'wide',
        beats: [
          { who: 'c3', line: 'Phone de. Video delete kar. Abhi.' },
          { who: 'meera', line: 'Sir ye mera content hai! Meri rozi-roti hai!' },
          { who: 'c3', line: 'Rozi-roti? Reel?', react: 'silence' },
          { who: 'meera', line: 'Haan reel! Aapko pata hai brand deal kaise milti hai?!' },
        ],
        idle: [['c3', 'Phone. Main bol raha hoon.'], ['meera', 'Mat de. Mat de. Main nahi de rahi.']],
        options: [
          {
            intent: 'Snatch Meera\'s phone and run with it',
            beats: [
              { who: 'player', line: '(phone jhapat ke) Meera, gali mein mil!' },
              { who: 'c3', line: 'OYE! Ruk tu! Tu wahi hai na, subah wala!', react: 'cut' },
            ],
            effects: { heat: 14, aura: 8 },
            do: ['chase:c3', 'friend:meera:ok', 'flag:dhuan-meera', 'target:player'],
            next: 'meera-run',
          },
          {
            intent: 'Call Constable Gill over: he watches your reels',
            requires: { rep: { aura: 30 } },
            beats: [
              { who: 'c5', line: 'Tomar ji, rehne do. Bachchi hai.' },
              { who: 'c5', line: '(dheere, tumse) Aap... "Update aaya hai" wale ho na? Main follow karta hoon. Biwi ko mat batana.', react: 'laugh' },
              { who: 'c3', line: 'Gill, tu bhi?', react: 'silence' },
            ],
            effects: { aura: 6, mood: { c5: 'amused' } },
            do: ['calm:c3', 'friend:meera:ok', 'flag:meera-safe', 'flag:dhuan-meera', 'callback:gill'],
            next: 'hub',
          },
          {
            intent: 'Tell Tomar her video has the SUV fixer in it',
            requires: { flags: ['fixer-exposed'] },
            beats: [
              { who: 'player', line: 'Sir, us video mein safed SUV wala bhi hai. Bhatia ji wala. Delete karoge toh Bhatia ji ka bhi delete hoga.' },
              { who: 'c3', line: '...SUV.' },
              { who: 'c3', line: 'Mujhe kuch nahi dikha. Main yahan tha hi nahi.', react: 'cut' },
            ],
            effects: { help: 6, aura: 6 },
            do: ['calm:c3', 'friend:meera:ok', 'flag:meera-safe', 'flag:dhuan-meera', 'callback:suv'],
            next: 'hub',
          },
          {
            intent: 'Pull Meera out and let the phone go',
            beats: [
              { who: 'player', line: 'Chhod de. Phone chhod de. Chal.' },
              { who: 'meera', line: '(phone haath se gaya) ...Chaar saal ki reels.' },
              { who: 'meera', line: 'Cloud pe hai. Shayad. Mujhe nahi pata cloud kya hai.', react: 'silence' },
            ],
            effects: { help: 6 },
            do: ['friend:meera:ok', 'flag:meera-phone-gone', 'flag:dhuan-meera'],
            next: 'hub',
          },
        ],
      },
      'meera-run': {
        beats: [{ who: 'meera', line: '(peeche se) Usme drafts bhi hain! Drafts mat girana!' }],
        goal: {
          text: 'Lose Tomar in the crowd with Meera\'s phone',
          until: ['chase-lost'],
          by: '16:45',
          onDone: 'meera-saved',
          onFail: 'meera-caught',
          marker: 'stage',
        },
      },
      'meera-saved': {
        camera: 'phone',
        beats: [
          { who: 'meera', line: 'Tu pagal hai. Thank you. Pagal.' },
          { who: 'meera', line: 'Ruk. Recording on thi. Poora chase record hua hai. Teri saans bhi.', react: 'laugh' },
        ],
        options: [
          {
            intent: 'Give it back and tell her not to post it yet',
            beats: [{ who: 'meera', line: 'Theek hai. Aaj nahi. Kal. Shayad parson. Ye mera pehla "kal post karungi" hai.' }],
            effects: { help: 6 },
            do: ['flag:meera-safe', 'callback:phone'],
            next: 'hub',
          },
          {
            intent: 'Tell her to post the chase right now',
            beats: [{ who: 'meera', line: 'Caption: "dost ne phone bachaya, aur kuch nahi bacha". Posted.' }],
            effects: { aura: 8, heat: 6 },
            do: ['flag:meera-safe', 'target:stream', 'callback:phone'],
            next: 'hub',
          },
        ],
      },
      'meera-caught': {
        camera: 'wide',
        beats: [
          { who: 'c3', line: 'Pakda! Phone de. Aur tu, bus.' },
          { who: 'meera', line: '(chat) tu pakda gaya?? mere phone ke liye?? main kya bolun', via: 'phone', react: 'silence' },
        ],
        options: [
          {
            intent: 'Hand over the phone and keep your mouth shut',
            beats: [{ who: 'c3', line: 'Shabaash. Ab neeche baith.' }],
            do: ['flag:meera-phone-gone', 'flag:dhuan-meera'],
            end: 'fail',
          },
          {
            intent: 'Throw it to Meera over his head',
            beats: [
              { who: 'player', line: 'MEERA! CATCH!' },
              { who: 'meera', line: '(pakad liya) PAKAD LIYA! Main nahi pakad sakti thi aur maine pakad liya!', react: 'laugh' },
              { who: 'c3', line: 'Tu. Bus. Abhi.', react: 'cut' },
            ],
            effects: { aura: 10, heat: 10 },
            do: ['flag:meera-safe', 'flag:dhuan-meera', 'detain:player', 'callback:catch'],
            end: 'fail',
          },
        ],
      },

      // --- Kabir and the lathi -------------------------------------------------------------
      kabir: {
        camera: 'wide',
        beats: [
          { who: 'kabir', line: '(dhuan mein, khaanste hue) Ye dhuan hai ya meri career planning? Dono mein kuch nahi dikhta.' },
          { who: 'raf', line: 'Hato! HATO!' },
          { who: 'kabir', line: 'Sir main comedian hoon! Ye bit hai! Bit ke beech mein lathi nahi!', react: 'silence' },
        ],
        idle: [['kabir', 'Ek aur line hai, bas ek!'], ['raf', 'Peeche!']],
        options: [
          {
            intent: 'Lock arms with your crew around him',
            requires: { holds: ['crew:2'] },
            beats: [
              { who: 'player', line: 'Haath pakdo! Sab! Gol! Kabir beech mein!' },
              { who: 'crowd', line: '(haath jodte hue) Hum baithe hain! Hum baithe hain!', overlap: true },
              { who: 'raf', line: '...(lathi neeche) Peeche raho bas.', react: 'silence' },
            ],
            effects: { help: 15, aura: 6 },
            do: ['stance:protect', 'friend:kabir:ok', 'flag:kabir-safe', 'flag:dhuan-kabir', 'callback:ring'],
            next: 'hub',
          },
          {
            intent: 'Throw yourself between Kabir and the lathi',
            beats: [
              { who: 'player', line: '(beech mein) Isko nahi! Ye toh tuition pe hai!' },
              { who: 'raf', line: '(lathi kandhe pe) Hato!', sfx: 'whistle' },
              { who: 'kabir', line: 'Bhai. Bhai tu theek hai? Tera kandha... Bhai mera joke itna bura nahi tha.', react: 'silence' },
            ],
            effects: { help: 15, aura: 10, heat: 6, flags: ['player-hurt'] },
            do: ['stance:protect', 'friend:kabir:ok', 'flag:kabir-safe', 'flag:dhuan-kabir', 'callback:shield'],
            next: 'hub',
          },
          {
            intent: 'Shout that he\'s a comedian, it\'s just a bit',
            beats: [
              { who: 'player', line: 'Sir ye comedian hai! Sach mein! Ek joke sunao isse!' },
              { who: 'raf', line: 'Comedian? ...Sunao joke.' },
              { who: 'kabir', line: 'Main... mera... dimaag blank hai. Bhai mera dimaag blank hai.', react: 'silence' },
              { who: 'raf', line: 'Hato.', react: 'cut' },
            ],
            effects: { aura: 4 },
            do: ['friend:kabir:hurt', 'flag:kabir-hurt', 'flag:dhuan-kabir', 'callback:blank'],
            next: 'hub',
          },
          {
            intent: 'Leave him: Kabir always lands on his feet',
            beats: [
              { who: 'kabir', line: '(door se) Bhai? Bhai kahan gaya? Sir main akela comedian hoon, akele ka set nahi hota—' },
              { who: 'raf', line: 'Bus mein daalo isko.' },
            ],
            effects: { help: -6 },
            do: ['friend:kabir:detained', 'flag:kabir-on-bus', 'flag:dhuan-kabir'],
            next: 'hub',
          },
        ],
      },
    },
    callbacks: {
      'bus-safe': 'Because Nikhil was still on the detention bus at {t}, the smoke never reached him at {at}.',
      ran: 'Because you ran for the Metro first at {t}, your friends found their own way out at {at}.',
      regroup: 'Because you called everyone to Rajiv Chowk gate 2 at {t}, nobody went home alone at {at}.',
      nikhil: 'Because you found Nikhil by the smell of Dettol at {t}, he was still holding your hand at {at}.',
      sana: 'Because you left Nikhil with Sana at {t}, he was drinking juice in her tent at {at}.',
      gill: 'Because Constable Gill follows your reels, Meera kept her phone at {at}.',
      suv: 'Because Meera\'s video had the SUV fixer in it, Constable Tomar suddenly "wasn\'t there" at {at}.',
      phone: 'Because you ran with Meera\'s phone at {t}, four years of reels survived at {at}.',
      catch: 'Because you threw Meera her phone at {t}, you spent {at} on the bus and she didn\'t.',
      ring: 'Because your crew locked arms round Kabir at {t}, the lathi came down at {at} and stopped.',
      shield: 'Because you stood between Kabir and a lathi at {t}, your shoulder knew it at {at}.',
      blank: 'Because you asked Kabir for a joke in the smoke at {t}, his mind went blank at {at}, and so did the lathi.',
    },
    outcomes: {
      done: {
        caption: 'Dhuan, lathi, aur ek dost jo "update" bhejta raha. Sab mile? Sab nahi. Par mile. 🫂',
        captionLater: 'Protesters regroup after violence at Jantar Mantar. Planned retreat? Who coordinated the exit?? 🚨',
        callback: 'Because you went back into the smoke at {t}, your friends were with you at {at}.',
      },
      fail: {
        caption: 'Tear gas ke baad group chat: "kahan ho", "kuch dikh nahi raha", "phone gaya". 💨',
        captionLater: 'Chaos at Jantar Mantar as "students" flee. Leaders abandon their own? 🚨',
        callback: 'Because the smoke got between you at {t}, not everyone was where you left them at {at}.',
      },
    },
  },
};
