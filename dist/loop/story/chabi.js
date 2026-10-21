// chabi (Act 1, 10:50–11:40, CP stop). Inspired by the real bus-key reel. Iqbal's shuttle parks at CP
// for his chai break (rules.js startIqbalBreak: the key goes on the hook by the bus door, he walks to
// Asha's stall). Asha keeps him there with his daughter's rishta. Constable Meena (c2) stands 7 m from
// the hook: take the key while she can see it and she chases you (rules.js act take). Send her off
// for a free chai first, or have done career-counselling (she stays at the barricade). Then the key:
// keep it (the bus stalls at 11:30 and Iqbal searches), give it to Kabir, drop it in the chai, or
// give it back.
export default {
  chabi: {
    title: 'Chabi',
    act: 1,
    window: { from: '10:50', until: '11:40' },
    place: 'asha',
    cast: ['asha', 'iqbal'],
    hook: {
      chat: [
        ['kabir', 'bhai CP shuttle wale uncle ki chabi dekhi kabhi? hook pe latakti hai. HOOK pe. jaise museum mein'],
        ['meera', 'Jantar pe kal kisi ne bus ki chabi leke bhaag gaya tha, reel 2M pe hai. bas bata rahi hoon'],
      ],
      overheard: [
        ['asha', 'Iqbal bhai ki beti ka rishta aaya hai. Canada wala. PR pending.'],
        ['crowd', 'Pending matlab? Aa raha hai ya nahi?'],
      ],
      card: 'Iqbal\'s bus key hangs on a hook at the CP stop',
    },
    // Nobody came: Asha's rishta report draws a small crowd at the stall, and the shuttle leaves on time.
    auto: {
      at: '11:25',
      beats: [
        ['asha', 'Ladka Brampton mein hai, Iqbal bhai. Brampton.'],
        ['iqbal', 'Brampton toh Punjab mein hai na?'],
        ['asha', 'Wahi toh. Canada ka Punjab.'],
      ],
      do: ['crowd:cp:+2'],
    },
    start: 'intro',
    nodes: {
      intro: {
        camera: 'none',
        beats: [
          { who: 'asha', line: 'Chai? Das rupaye. Gossip free mein. Gossip ke saath chai pandrah.' },
          { who: 'asha', line: 'Gyarah baje shuttle aati hai. Iqbal bhai chabi hook pe latka ke seedha yahin aate hain. Bees saal se.' },
          { who: 'asha', line: 'Aur aaj unke paas sunne layak khabar hai. Beti ka rishta. Main bataungi. Dheere dheere.' },
          { who: 'asha', line: 'Bas wo Meena madam bus ke paas khadi hain na, unki aankh tez hai. Mujhe kya. Main toh chai bechti hoon.', aside: true },
        ],
        idle: [
          ['asha', 'Chai lo ya jagah do. Dono nahi.'],
          ['asha', 'Rishta wala ladka ka photo hai mere paas. Dekhoge? Nahi? Achha baad mein.'],
          ['zoya', 'Asha ji, aap ek din news channel kholna. Main anchor ban jaungi.'],
        ],
        options: [
          {
            intent: 'Get Asha to corner Iqbal with the rishta gossip',
            beats: [
              { who: 'player', line: 'Aunty, jab Iqbal uncle aayen, rishta wali baat poori detail mein batana. Poori. Photo bhi.' },
              { who: 'asha', line: 'Detail? Beta main detail ke alawa kuch bolti hi nahi. Pandrah minute guarantee.' },
              { who: 'asha', line: 'Par ek chai tumhare naam pe. Das rupaye.' },
            ],
            effects: { nuisance: 3, mood: { asha: 'amused' }, flags: ['asha-in-on-it'] },
            next: 'break',
          },
          {
            intent: 'Bet Kabir in the chat you can lift it with zero help',
            beats: [
              { who: 'player', line: '(group mein) bet. main chabi utha ke dikhata hoon. bina kisi ki madad ke' },
              { who: 'kabir', line: 'bet. haarega toh mere set ka ticket khareedna padega. free hai, par khareedna padega', via: 'phone' },
              { who: 'meera', line: 'main record kar rahi hoon. agar pakde gaye toh bhi content hai', via: 'phone' },
              { who: 'asha', line: 'Kya type kar rahe ho itna muskura ke? ...Kuch galat hi hoga.' },
            ],
            effects: { aura: 4, nuisance: 4, flags: ['chabi-bet'] },
            next: 'lift',
          },
          {
            intent: 'Tell Asha stealing a bus key is a terrible idea',
            beats: [
              { who: 'player', line: 'Aunty, dekhiye, kisi ki chabi uthana galat hai. Unki roti-roti hai.' },
              { who: 'asha', line: 'Maine kab bola chabi uthao? Maine rishta bola. Tum chabi pe kaise pahunche?', react: 'silence' },
              { who: 'asha', line: 'Gandhi ji. Chai piyo aur gyaan apne paas rakho.' },
            ],
            effects: { help: 3, aura: -2, mood: { asha: 'annoyed' } },
            do: ['callback:gandhi'],
            end: 'fail',
          },
        ],
        leave: [['asha', 'Jao jao. Iqbal bhai aayenge toh dekhna, poora Canada yahin utrega.']],
      },
      break: {
        beats: [
          { who: 'asha', line: 'Bas shuttle aane do. Tum chai pe baitho, jaise kuch nahi pata.' },
        ],
        goal: {
          text: 'Wait at Asha\'s stall for Iqbal\'s chai break',
          until: ['near:iqbal:asha'],
          by: '11:28',
          marker: 'asha',
          onDone: 'rishta',
          onFail: 'no-break',
        },
      },
      rishta: {
        camera: 'none',
        beats: [
          { who: 'iqbal', line: 'Asha ji, ek kadak. Aaj teen chakkar ho gaye, ek bhi passenger ne ticket nahi liya. Sab "protest" bolte hain.' },
          { who: 'asha', line: 'Chai baad mein. Pehle suno. Rishta aaya hai. Ruksar ke liye.' },
          { who: 'iqbal', line: '(chai ka glass ruk jaata hai) Kaun? Kahan se?' },
          { who: 'asha', line: 'Ladka Canada mein hai. PR process mein.' },
          { who: 'iqbal', line: 'PR matlab?' },
          { who: 'asha', line: 'Pending.' },
          { who: 'iqbal', line: 'Kaam kya karta hai?' },
          { who: 'asha', line: 'Wahi. Pending.', react: 'laugh' },
          { who: 'iqbal', line: 'Photo hai? Dikhao dikhao. (bus ki taraf peeth karke baith jaata hai)' },
        ],
        idle: [
          ['iqbal', 'Lamba hai? Ruksar lambi hai, ladka lamba hona chahiye.'],
          ['asha', 'Ladke ki mummy bhi Canada mein hain. Matlab saas door rahegi. Faayda hai.'],
          ['c2', '(bus ke paas) ...'],
        ],
        options: [
          {
            intent: 'Slip off to the hook right now while they talk',
            beats: [
              { who: 'player', line: '(dheere se uthte hue) Aunty main abhi aaya. Washroom.' },
              { who: 'asha', line: 'CP mein washroom? Best of luck.', aside: true },
            ],
            effects: { nuisance: 2 },
            next: 'lift',
          },
          {
            intent: 'Lure Constable Meena over with a free chai first',
            beats: [
              { who: 'player', line: '(bus ki taraf awaaz deke) Meena madam! Asha aunty ne aapke liye special chai banayi hai. Adrak wali.' },
              { who: 'c2', line: 'Special? Kis khushi mein?' },
              { who: 'asha', line: 'Rishta aaya hai, madam. Mithai nahi hai toh chai sahi.' },
              { who: 'c2', line: '...Rishta? Kiska? Ruko. Do minute.' },
              { who: 'asha', line: 'Paise tum doge, haan. Das rupaye.', aside: true },
            ],
            effects: { nuisance: 3, help: -2, mood: { c2: 'amused' }, flags: ['meena-chai'] },
            do: ['move:c2:chai'],
            next: 'lift',
          },
          {
            intent: 'Pitch Kabir as a better rishta for Ruksar',
            beats: [
              { who: 'player', line: 'Uncle, Canada chhodiye. Mera dost hai, Kabir. Delhi mein hai. Comedian hai.' },
              { who: 'iqbal', line: 'Comedian? Kamaata kya hai?' },
              { who: 'player', line: 'Respect.' },
              { who: 'iqbal', line: '(itna hasta hai ki chai gir jaati hai) Respect! Asha ji, ye suno!', react: 'laugh' },
              { who: 'kabir', line: 'BHAI. KYA BOLA TUNE. mummy ko mat batana', via: 'phone' },
            ],
            effects: { aura: 5, mood: { iqbal: 'happy', kabir: 'sulking' }, flags: ['kabir-rishta'] },
            next: 'lift',
          },
          {
            intent: 'Join in and become the rishta consultant',
            beats: [
              { who: 'player', line: 'Uncle, pehle ladke ka Insta check karte hain. Public hai? Gym selfie kitni hain?' },
              { who: 'iqbal', line: 'Gym selfie se kya pata chalta hai?' },
              { who: 'player', line: 'Sab kuch, uncle. Sab kuch.' },
              { who: 'asha', line: 'Ye bachcha samajhdaar hai. Iske paas aur rishte hain?' },
              { who: 'iqbal', line: 'Beta tum shaam ko ghar aao. Ruksar ki ammi se baat karna. (chabi ki baat kisi ko yaad nahi)', react: 'silence' },
            ],
            effects: { help: 6, mood: { iqbal: 'happy', asha: 'amused' }, flags: ['rishta-consultant'] },
            do: ['callback:consultant'],
            end: 'fail',
          },
        ],
      },
      lift: {
        beats: [
          { who: 'meera', line: 'main bus ke peeche se shoot kar rahi hoon. normal chalna. NORMAL', via: 'phone' },
        ],
        goal: {
          text: 'Lift the key off the hook by the bus door',
          until: ['holding:key'],
          by: '11:30',
          marker: 'keyHook',
          onDone: 'decide',
          onFail: 'no-break',
        },
      },
      decide: {
        camera: 'none',
        beats: [
          { who: 'player', line: '(jeb mein chabi. Bhaari hai. Dil bhi.)' },
          { who: 'kabir', line: 'BHAI. BHAI. tune sach mein utha li?? main stage pe hoon, la dikha', via: 'phone' },
          { who: 'meera', line: 'got it. 4K. haath kaanp raha tha tera, par 4K', via: 'phone' },
          { who: 'asha', line: '(door se, chai chhaante hue) Kuch nahi dekha. Mujhe kuch nahi dikhta. Main chai wali hoon.' },
        ],
        idle: [
          ['kabir', 'souvenir chahiye bhai. mujhe. abhi'],
          ['iqbal', '(stall pe) ...aur ladke ki height?'],
        ],
        options: [
          {
            intent: 'Pocket it and let the shuttle die at CP',
            beats: [
              { who: 'player', line: 'Ye ab meri hai. Shuttle aaj CP ki shobha badhayegi.' },
              { who: 'meera', line: 'caption: "aaj CP se Jantar paidal chalo, sehat banao" 💪', via: 'phone' },
            ],
            effects: { aura: 6, heat: 4, nuisance: 6 },
            do: ['crowd:cp:+3', 'intensity:+1', 'callback:kept'],
            end: 'done',
          },
          {
            intent: 'Give it to Kabir at the stage as a "souvenir"',
            beats: [
              { who: 'player', line: '(group mein) Kabir ruk. aa raha hoon. souvenir' },
              { who: 'kabir', line: 'main apne set mein isko prop bana dunga. "ye hai is desh ki chabi." CLAPS', via: 'phone' },
            ],
            effects: { nuisance: 3 },
            next: 'to-kabir',
          },
          {
            intent: 'Drop it in Asha\'s chai pateela',
            beats: [
              { who: 'player', line: '(stall ke paas se guzarte hue, chhapaak)' },
              { who: 'asha', line: 'Ye kya daala? ...Chabi? Meri chai mein chabi? Ab ye chai "special" hai.', react: 'silence' },
              { who: 'asha', line: 'Tees rupaye ki ho gayi.' },
            ],
            effects: { aura: 8, nuisance: 10, mood: { asha: 'annoyed' }, flags: ['chabi-pateela'] },
            do: ['drop:key:chai', 'callback:pateela'],
            end: 'done',
          },
          {
            intent: 'Get it back to Iqbal and own up',
            beats: [
              { who: 'player', line: '(chabi ko dekhta hai. Chabi wapas dekhti hai.)' },
              { who: 'kabir', line: 'nahi bhai. nahi. aura chahiye tha toh ye wala aura nahi', via: 'phone' },
            ],
            effects: { help: 2 },
            next: 'return',
          },
        ],
      },
      'to-kabir': {
        beats: [
          { who: 'kabir', line: 'stage ke left side hoon. jahan banner ulta laga hai', via: 'phone' },
        ],
        goal: {
          text: 'Carry the key to Kabir at the stage',
          until: ['near:key:kabir'],
          by: '11:45',
          marker: 'kabir',
          onDone: 'kabir-key',
          onFail: 'no-kabir',
        },
      },
      'kabir-key': {
        camera: 'wide',
        beats: [
          { who: 'kabir', line: '(chabi haath mein leke, aankhon mein aansu) Ye... ye toh asli hai.' },
          { who: 'kabir', line: 'Mere set ka naam badal raha hoon. "Chabi." Ek shabd. Bas.' },
          { who: 'nikhil', line: 'Ye kis cheez ki chabi hai?' },
          { who: 'kabir', line: 'Azaadi ki, Nikhil. Aur ek Tata bus ki.', react: 'laugh' },
        ],
        options: [
          {
            intent: 'Hand it over with a speech about the nation',
            beats: [
              { who: 'player', line: 'Kabir. Ye chabi tujhe saunp raha hoon. Ise sambhal ke rakhna. Is desh ki tarah. Matlab, kho dena.' },
              { who: 'kabir', line: 'Main isko gale mein pehnunga. Mummy ko bolunga tuition ki locker key hai.' },
            ],
            effects: { aura: 8, heat: 4, mood: { kabir: 'grateful' }, flags: ['kabir-has-key'] },
            do: ['give:key:kabir', 'callback:souvenir'],
            end: 'done',
          },
          {
            intent: 'Make him promise it never goes on camera',
            beats: [
              { who: 'player', line: 'Ek shart. Ye camera pe nahi aayegi. Kabhi nahi.' },
              { who: 'kabir', line: 'Haan haan. Bilkul. (Meera ko aankh maarta hai)' },
              { who: 'meera', line: 'Main toh already record kar rahi thi.' },
            ],
            effects: { aura: 4, heat: 2, mood: { kabir: 'grateful' }, flags: ['kabir-has-key'] },
            do: ['give:key:kabir', 'callback:souvenir'],
            end: 'done',
          },
          {
            intent: 'Snatch it back at the last second, it\'s yours',
            beats: [
              { who: 'kabir', line: '(haath badhata hai)' },
              { who: 'player', line: '(chabi wapas jeb mein) Socha. Mann badal gaya.' },
              { who: 'kabir', line: 'Ye mere saath mere set mein bhi hua tha. Audience ne bhi aise hi kiya tha.', react: 'silence' },
            ],
            effects: { aura: 3, mood: { kabir: 'sulking' } },
            do: ['callback:kept'],
            end: 'done',
          },
        ],
      },
      'no-kabir': {
        beats: [
          { who: 'kabir', line: 'bhai kahan reh gaya. souvenir ka mood chala gaya. ab main sirf dukhi hoon', via: 'phone' },
        ],
        end: 'fail',
      },
      return: {
        beats: [
          { who: 'asha', line: '(dheere se) Iqbal bhai ke haath mein do, ya hook pe wapas. Jaldi. Gyarah-tees pe uthte hain.', aside: true },
        ],
        goal: {
          text: 'Give the key back to Iqbal',
          until: ['given:key:iqbal'],
          by: '11:45',
          marker: 'iqbal',
          onDone: 'returned',
        },
      },
      returned: {
        camera: 'none',
        beats: [
          { who: 'iqbal', line: '(chabi ko soongh ke) Isme kisi ki jeb ki khushboo hai.' },
          { who: 'iqbal', line: 'Bees saal se hook pe latka raha hoon. Pehli baar wapas aayi hai. Pehle toh jaati hi nahi thi.' },
          { who: 'asha', line: 'Bachcha accha hai, Iqbal bhai. Thoda pagal, par accha.' },
        ],
        options: [
          {
            intent: 'Confess everything, Meera\'s 4K footage included',
            beats: [
              { who: 'player', line: 'Uncle maine uthayi thi. Bet tha. Meera ne shoot bhi kiya. Sorry.' },
              { who: 'iqbal', line: '(lambi saans) ...Shoot kiya? Mera side achha aaya?', react: 'laugh' },
              { who: 'iqbal', line: 'Chalo. Ruksar ko dikhaunga. Bolegi abba famous ho gaye.' },
            ],
            effects: { help: 10, aura: 4, mood: { iqbal: 'grateful' }, flags: ['iqbal-likes-you'] },
            do: ['callback:returned'],
            end: 'done',
          },
          {
            intent: 'Blame a monkey',
            beats: [
              { who: 'player', line: 'Uncle ek bandar tha. Utha ke bhaaga. Maine peecha kiya. Bahut bada bandar.' },
              { who: 'iqbal', line: 'CP mein bandar?' },
              { who: 'asha', line: 'Hai toh. Ek mere saamne khada hai.', react: 'laugh' },
            ],
            effects: { aura: 6, help: 4, mood: { iqbal: 'amused' } },
            do: ['callback:bandar'],
            end: 'done',
          },
        ],
      },
      'no-break': {
        beats: [
          { who: 'iqbal', line: 'Chalo Asha ji, break khatam. Passenger intezaar kar rahe hain. Matlab protest intezaar kar raha hai.' },
          { who: 'asha', line: 'Rishta ka baaki kal. Ladke ki height kal bataungi.' },
        ],
        end: 'fail',
      },
    },
    callbacks: {
      gandhi: 'Because you lectured Asha about the bus key at {t}, she was still calling you "Gandhi ji" at {at}.',
      consultant: 'Because you became Iqbal\'s rishta consultant at {t}, you were invited home for dinner at {at}. The key never moved.',
      kept: 'Because you pocketed Iqbal\'s key at {t}, the CP shuttle was still standing there at {at}.',
      souvenir: 'Because you gave Kabir the bus key as a souvenir at {t}, his set was called "Chabi" at {at}.',
      pateela: 'Because you dropped the bus key in Asha\'s chai at {t}, every chai was "special" (₹30) at {at}.',
      returned: 'Because you owned up to Iqbal at {t}, he showed Ruksar the reel of himself at {at}.',
      bandar: 'Because you blamed a monkey for the key at {t}, CP had a bandar rumour going at {at}.',
    },
    outcomes: {
      done: {
        caption: 'CP shuttle stop: driver uncle chai pe, chabi kisi aur ki jeb mein 🔑😭 #BusKeyReel part 2',
        captionLater: 'Protesters STEAL bus keys at CP, stranding commuters for hours 😡 is this "peaceful"? #AntiNational',
      },
      fail: {
        caption: 'Iqbal bhai ka chai break khatam, shuttle phir chal padi. Chabi wahin ki wahin 🚌',
        captionLater: 'Even the bus drivers are tired of these "protesters" at CP. Business as usual 🙄',
      },
    },
  },
};
