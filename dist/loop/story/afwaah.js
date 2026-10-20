// afwaah (Act 2, 12:30–13:45, Asha's stall): the DRS bikes arrive at 12:30 (rules.js arrivalWave) and a
// "5 LAKH" forward beats them to it. Rumour-spreading lives here now: you can start, twist, carry or kill
// the forward, and each choice plants a rumour (do 'rumour:<rid>:<place>', see RUMOURS in content.js) or
// leaves a flag. Format: plans/story-rebuild.md, "Situations".
// Inspired by research/situations.md #20 and politics-standins.md: the 2026 "5 lakh / 10 lakh are coming"
// posts, the old footage passed off as new, and on the day, a handful of bikes.
export default {
  afwaah: {
    title: 'Forwarded many times',
    act: 2,
    window: { from: '12:30', until: '13:45' },
    place: 'asha', // her stall at CP until 13:00, then her chai round at the stage: the marker goes with her
    cast: ['asha', 'c4', 'zoya'],
    inspiredBy: 'Oct 2026 counter-mobilisation posts ("5 lakh to 10 lakh are coming"), recycled saffron-scarf footage, and almost nobody turning up (Newslaundry, ThePrint live).',
    hook: {
      chat: [
        ['meera', 'DRS ki bikes aa gayi 🏍️🏍️ aur mere family group mein already "5 LAKH" wala forward aa gaya'],
        ['nikhil', 'update: mere phone pe bhi aaya. 3% mein bhi aaya. forward ki battery alag hoti hai kya'],
        ['kabir', 'mama ne bheja "aaj Jantar mat jaana". mama khud Jantar pe hai. maine dekha. unhone mujhe dekha. hum dono ne kuch nahi dekha'],
      ],
      overheard: [
        ['asha', 'Arre suno suno! Rawat ji ka forward aaya hai. Teen baar forwarded. Matlab pakka.'],
        ['zoya', 'Teen baar forwarded ka matlab teen log ne nahi padha.'],
      ],
      card: "A forward is flying round Asha's stall",
    },
    // Nobody touches it: the forward does what forwards do. The barricade believes it and the stage thins a little.
    auto: {
      at: '13:20',
      beats: [
        ['asha', 'DRS ke paanch lakh! Rawat ji ne bola hai! Sabko batao, chai baad mein!'],
        ['crowd', 'Paanch lakh? …Chalo, nikalte hain. Chai pack karwa lo.'],
      ],
      do: ['rumour:sena:barricade', 'crowd:stage:-2', 'flag:afwaah-ran-wild'],
      end: 'fail',
    },
    start: 'forward',
    nodes: {
      forward: {
        camera: 'none',
        beats: [
          { who: 'asha', line: 'Suno! "URGENT. DRS ke PAANCH LAKH log bikes pe Jantar aa rahe hain, danda leke. Ghar jao. 10 group mein bhejo warna saat saal bad luck."' },
          { who: 'asha', line: 'Aur neeche likha hai "Sabhi ko saavdhaan karein. Jai Hind." Matlab sarkari hai.' },
          { who: 'zoya', line: 'Source?' },
          { who: 'asha', line: 'Source Rawat ji. Thane wale. Voice note bhi bheja hai, suno.' },
          { who: 'c4', line: 'Namaskar. Ye message ek senior adhikari ka hai. …Woh senior adhikari main hi hoon. Par sach hai. Mere saale ke dost ka beta DRS mein hai.', via: 'phone' },
          { who: 'c4', line: '(peeche pressure cooker ki seeti) …Aur haan. Good afternoon.', via: 'phone', react: 'laugh' },
          { who: 'meera', line: 'Paanch lakh? Jantar Mantar mein paanch lakh aayenge toh observatory ko bhi khade hona padega.' },
          { who: 'zoya', line: 'Maine barricade ki taraf bikes dekhi. Gin nahi paayi, par paanch lakh nahi thi. Paanch lakh bikes ki parking Gurgaon tak jaati.' },
          { who: 'asha', line: 'Tum log bahas karo. Main teen group mein bhej chuki hoon. Chai ke saath free.' },
        ],
        idle: [
          ['asha', 'Kitne group mein bheja? Mera record satrah hai. Ek din mein.'],
          ['zoya', 'Source, source, source. Koi source nahi deta. Sab forward dete hain.'],
          ['meera', 'Clash ho ya na ho, "paanch lakh" caption toh mil gaya.'],
          ['asha', 'Chai lo, forward lo. Combo offer.'],
        ],
        options: [
          {
            intent: 'Forward it to every group you are in',
            beats: [
              { who: 'player', line: 'Bhejo mujhe. Main "College", "Family", aur "Gym (inactive)" sab mein daalta hoon.' },
              { who: 'asha', line: 'Wah! Ye hui na baat. Emoji bhi daalna. Laal wala gol.' },
              { who: 'meera', line: 'Bhai tu literally afwaah ka Swiggy ban gaya.', react: 'laugh' },
              { who: 'nikhil', line: 'update: tera forward mere paas teen baar aaya. teeno baar padha. 2% ho gayi.', via: 'phone' },
            ],
            effects: { nuisance: 8, heat: 2, flags: ['afwaah-forwarded'] },
            do: ['rumour:sena:cp'],
            next: 'carry',
          },
          {
            intent: 'Call Rawat and ask who sent it to him',
            beats: [
              { who: 'player', line: 'Asha ji, Rawat ji ka number do.' },
              { who: 'c4', line: 'Haan ji? Kaun? …Forward? Mujhe "Thana Parivar" group mein aaya. Usme Yadav ne daala. Yadav ko uski saas ne. Saas ko…', via: 'phone' },
              { who: 'c4', line: 'Ek minute, dekhta hoon. …Saas ko mujhse aaya tha. Kal raat. …Matlab maine hi likha tha?', via: 'phone', react: 'silence' },
              { who: 'c4', line: 'Nahi nahi. Maine sirf forward kiya tha. Pehle. Sabse pehle.', via: 'phone' },
            ],
            next: 'source',
          },
          {
            intent: 'Swap the DRS for free biryani before it spreads',
            beats: [
              { who: 'player', line: 'Asha ji, ek edit. "DRS" hatao. Likho "CP stop pe free biryani". Log bhaagenge, par khushi se.' },
              { who: 'asha', line: 'Biryani? …Biryani wali afwaah meri speciality hai. Saal mein ek baar udaati hoon.' },
              { who: 'zoya', line: 'Tum ek afwaah ko doosri afwaah se maar rahe ho.' },
              { who: 'player', line: 'Vaccine ki tarah.' },
              { who: 'zoya', line: 'Vaccine aise kaam nahi karti.', react: 'silence' },
            ],
            effects: { nuisance: 6, aura: 2, flags: ['afwaah-twisted'] },
            do: ['rumour:biryani:cp'],
            next: 'carry',
          },
          {
            intent: 'Go and count the DRS bikes yourself',
            beats: [
              { who: 'player', line: 'Main jaake ginta hoon. Barricade ke paas na?' },
              { who: 'zoya', line: 'Gin ke batana. Number chahiye, adjective nahi.' },
              { who: 'asha', line: 'Jaldi aana. Tab tak main chaar group aur.', react: 'laugh' },
            ],
            next: 'count',
          },
        ],
      },

      // --- carrying the forward to the stage crowd ---
      carry: {
        beats: [{ who: 'asha', line: 'Asli forward wahan hota hai jahan bheed hai. Stage pe jao. Bheed ko bataoge tab forward hoga, phone pe toh bas message hai.' }],
        goal: {
          text: 'Carry the forward to the stage crowd',
          until: ['at:player:stage'],
          by: '13:40',
          marker: 'stage',
          onDone: 'stage',
        },
      },
      stage: {
        camera: 'wide',
        beats: [
          { who: 'crowd', line: 'Bhai kuch suna? Sabne kuch toh suna hai. Kya suna, ye kisi ko nahi pata.' },
          { who: 'kabir', line: 'Tu aa gaya. Tere chehre pe "forwarded many times" likha hai. Bol.' },
          { who: 'mira', line: 'Jo bhi bolna hai, mic ke paas mat bolna.' },
        ],
        idle: [
          ['crowd', 'Kya hua? Kya hone wala hai? Kab?'],
          ['kabir', 'Bol na. Main reaction ke liye ready hoon. Shocked wala, ya "maine pehle hi bola tha" wala?'],
        ],
        options: [
          {
            intent: 'Shout that five lakh DRS are coming',
            beats: [
              { who: 'player', line: 'DRS ke paanch lakh aa rahe hain! Danda leke!' },
              { who: 'crowd', line: 'PAANCH LAKH?!', overlap: true },
              { who: 'kabir', line: 'Paanch lakh? Inke paas paanch lakh helmet bhi nahi hain.' },
              { who: 'crowd', line: 'Chalo chalo, counter-chant ready karo! Advance mein!' },
              { who: 'mira', line: 'Afwaah mat phailao! …Kahan se aa rahe hain? Kitne?', react: 'cut' },
            ],
            effects: { nuisance: 10, heat: 6, flags: ['afwaah-sena-stage'] },
            do: ['rumour:sena:stage', 'callback:sena'],
            end: 'done',
          },
          {
            intent: 'Lose your nerve and call it fake',
            beats: [
              { who: 'player', line: 'Kuch nahi. Fake tha. Forward tha. Sorry.' },
              { who: 'kabir', line: 'Tu itna door chal ke aaya "fake" bolne?' },
              { who: 'crowd', line: 'Phir bhi kuch toh hai. Bina aag ke dhuaan nahi hota.' },
              { who: 'player', line: 'Hota hai! Isi ko afwaah kehte hain!', react: 'laugh' },
            ],
            effects: { aura: 6, help: 4, nuisance: -4, flags: ['afwaah-killed'] },
            do: ['intensity:-1', 'callback:nerve'],
            end: 'done',
          },
          {
            intent: 'Announce free biryani at the CP stop',
            beats: [
              { who: 'player', line: 'Free biryani! CP stop pe! Khatam ho rahi hai!' },
              { who: 'crowd', line: 'Veg hai?' },
              { who: 'player', line: 'Dono!' },
              { who: 'crowd', line: '…Chalo!', overlap: true },
              { who: 'kabir', line: 'Revolution ka sabse bada dushman: free khaana.', react: 'laugh' },
            ],
            effects: { nuisance: 8, aura: 4, flags: ['afwaah-biryani-stage'] },
            do: ['rumour:biryani:stage', 'callback:biryani'],
            end: 'done',
          },
          {
            intent: 'Whisper "water cannon" to one nervous aunty',
            beats: [
              { who: 'player', line: '(dheere se) Aunty… water cannon aa raha hai.' },
              { who: 'crowd', line: 'WATER CANNON?!' },
              { who: 'kabir', line: 'Bhai tune "dheere" bola tha. Aunty ka volume factory setting pe hai.', react: 'laugh' },
              { who: 'crowd', line: 'Mera phone! Plastic bag kisi ke paas hai?' },
            ],
            effects: { nuisance: 10, heat: 4, flags: ['afwaah-cannon-stage'] },
            do: ['rumour:cannon:stage', 'callback:cannon'],
            end: 'done',
          },
        ],
      },

      // --- going to look for yourself ---
      count: {
        beats: [{ who: 'zoya', line: 'Camera on rakhna. Number aur video. Dono. Ek ke bina doosra afwaah hai.' }],
        goal: {
          text: 'Go and count the DRS bikes at the barricade',
          until: ['at:player:barricade'],
          by: '13:40',
          marker: 'barricade',
          onDone: 'bikes',
        },
      },
      bikes: {
        camera: 'phone',
        beats: [
          { who: 'player', line: '(ginte hue) Ek. Do. Teen… chhe. Chhe bikes.' },
          { who: 'crowd', line: '(DRS wala, kulfi khaate hue) Kya dekh raha hai? Photo lega?' },
          { who: 'player', line: 'Chhe bikes. Ek megaphone. Aur ek bhaiya kulfi kha rahe hain.' },
          { who: 'sharma', line: 'Chhe.', react: 'silence' },
          { who: 'sharma', line: 'Paanch lakh bola tha kisi ne?' },
          { who: 'crowd', line: '(DRS wala) Paanch lakh? Humne? …Sahi hai. Bolne do. Achha lagta hai.', react: 'laugh' },
        ],
        idle: [
          ['crowd', '(DRS wala) Kulfi khatam ho gayi. Ab hum paanch lakh minus ek kulfi hain.'],
          ['sharma', 'Chhe. Gin liya? Ab kya?'],
        ],
        options: [
          {
            intent: 'Tell the DRS boys about their own five lakh',
            beats: [
              { who: 'player', line: 'Bhaiya, aapke baare mein likha hai aap paanch lakh ho.' },
              { who: 'crowd', line: '(DRS wala) Paanch lakh? Hum? …Ruko. Ye apne group mein daalta hoon. Sab aa jayenge.' },
              { who: 'sharma', line: 'Mat daalo.' },
              { who: 'crowd', line: '(DRS wala) Daal diya.', react: 'silence' },
              { who: 'sharma', line: '…Wireless pe bolna padega.', react: 'cut' },
            ],
            effects: { heat: 8, nuisance: 10, flags: ['drs-heard-own-rumour'] },
            do: ['rumour:sena:stage', 'callback:selffulfil'],
            end: 'done',
          },
          {
            intent: 'Film the real count and post it',
            beats: [
              { who: 'player', line: 'Live. "Paanch lakh" ka reality check. Chhe bikes, ek kulfi.' },
              { who: 'zoya', line: 'Repost kar rahi hoon. Number ke saath. Finally ek source.', via: 'phone' },
              { who: 'asha', line: 'Chhe? Bas chhe? …Main group mein correction daalti hoon. Correction bhi forward hota hai na?', via: 'phone', react: 'laugh' },
            ],
            effects: { aura: 10, help: 8, flags: ['afwaah-factchecked', 'afwaah-killed'] },
            do: ['crowd:stage:+3', 'intensity:-1', 'callback:count'],
            end: 'done',
          },
          {
            intent: 'Round it up for the camera, six is boring',
            beats: [
              { who: 'player', line: '(camera pe) Bikes… hazaaron mein. Kam se kam… saath.' },
              { who: 'sharma', line: 'Chhe.' },
              { who: 'player', line: 'Chhe hazaar.' },
              { who: 'sharma', line: 'Chhe.', react: 'laugh' },
            ],
            effects: { aura: 4, nuisance: 6, flags: ['afwaah-inflated'] },
            do: ['rumour:sena:barricade', 'callback:inflate'],
            end: 'done',
          },
          {
            intent: 'Carry the real number to Constable Rawat',
            beats: [
              { who: 'player', line: 'Number mil gaya. Ab Rawat ji ko dikhana hai. Face to face.' },
              { who: 'sharma', line: 'Rawat? Stage ke paas. Phone mein ghusa hoga.' },
            ],
            next: 'to-rawat',
          },
        ],
      },
      'to-rawat': {
        beats: [{ who: 'zoya', line: 'Rawat ji ko video dikhana. Text nahi padhte woh. Sirf video aur "good morning".', via: 'phone' }],
        goal: {
          text: 'Show Constable Rawat the real count',
          until: ['at:player:stage'], // Rawat's post is at the stage (near:player:c4 once the checker allows the player)
          by: '13:45',
          marker: 'c4',
          onDone: 'rawat',
        },
      },
      rawat: {
        camera: 'none',
        beats: [
          { who: 'c4', line: 'Haan beta? Jaldi bolo, mere saintalis group hain, sabko good afternoon bhejna hai.' },
          { who: 'player', line: 'Rawat ji, DRS ke chhe hain. Chhe. Video hai.' },
          { who: 'c4', line: 'Ye video hai ya photo jo hil rahi hai?' },
          { who: 'c4', line: '(video dekh ke) …Chhe. Aur kulfi.', react: 'silence' },
          { who: 'c4', line: 'Par forward mein paanch lakh tha. Forward galat kaise ho sakta hai? Usme "Jai Hind" tha.' },
        ],
        idle: [
          ['c4', 'Ek minute, Holi 2019 wale group mein reply aaya hai.'],
          ['c4', 'Video forward kaise karte hain? Teen dot? Haan, teen dot.'],
        ],
        options: [
          {
            intent: 'Tell him the forward is a DRS conspiracy',
            beats: [
              { who: 'player', line: 'Rawat ji, socho. Ye forward DRS ne khud banaya. Taaki sab dar jaayein.' },
              { who: 'c4', line: 'Saazish!' },
              { who: 'c4', line: 'Main ye "Thana Parivar" mein daalta hoon. "Saazish Alert". Aur "Senior Adhikari Group" mein. Aur "Rawat Family Holi 2019" mein.', react: 'laugh' },
              { who: 'wireless', line: 'Rao: Ye saazish wala forward kisne daala? …Barricade pe sabko alert karo. Over.', via: 'wireless', react: 'cut' },
            ],
            effects: { nuisance: 8, heat: 4, mood: { c4: 'amused' }, flags: ['police-expect-drs'] },
            do: ['rumour:sena:barricade', 'intensity:+1', 'callback:saazish'],
            end: 'done',
          },
          {
            intent: 'Get him to forward the correction to Thana Parivar',
            beats: [
              { who: 'c4', line: 'Correction? …Theek hai. Par good morning wali photo ke saath. Gulaab wali. Bina photo ke koi nahi padhta.' },
              { who: 'c4', line: 'Bhej diya. "Saavdhaan: DRS sirf chhe hain. Shanti banaye rakhein. Jai Hind." Aur gulaab.' },
              { who: 'wireless', line: 'Rao: Thana Parivar mein dopahar ko gulaab kaun bhej raha hai? …Achha, chhe hain? Theek. Over.', via: 'wireless', react: 'laugh' },
            ],
            effects: { help: 12, aura: 6, mood: { c4: 'amused' }, flags: ['rawat-correction', 'afwaah-killed'] },
            do: ['intensity:-2', 'callback:rawat'],
            end: 'done',
          },
          {
            intent: 'Ask him to forward something nice instead',
            beats: [
              { who: 'player', line: 'Rawat ji, aaj kuch achha forward karo. Bas ek baar.' },
              { who: 'c4', line: 'Achha? …Mere paas ek hai. Chhota bachcha police wale ko paani pila raha hai. 2017 ka. Har saal chalata hoon.' },
              { who: 'c4', line: 'Bhej diya. Teen log ne "🙏" bheja. Ek ne "fake" likha. Woh meri biwi hai.', react: 'laugh' },
            ],
            effects: { help: 8, aura: 4, mood: { c4: 'soft' }, flags: ['rawat-good-forward'] },
            do: ['intensity:-1', 'callback:nice'],
            end: 'done',
          },
          {
            intent: 'Leave him to his forty-seven groups',
            beats: [
              { who: 'c4', line: 'Haan haan, jao. Main paanch lakh hi bhejta hoon. Chhe kisi ko achha nahi lagega.' },
            ],
            do: ['rumour:sena:barricade'],
            end: 'fail',
          },
        ],
      },

      // --- following the forward back to where it came from ---
      source: {
        camera: 'none',
        beats: [
          { who: 'asha', line: 'Matlab Rawat ji ne khud likha, khud forward kiya, aur khud ko hi bheja?' },
          { who: 'zoya', line: 'Ye circle of life nahi hai. Ye circle of forward hai.', react: 'laugh' },
          { who: 'c4', line: 'Dekho, maine likha nahi. Maine sirf… sabse pehle bheja. Woh alag hai.', via: 'phone' },
        ],
        idle: [
          ['asha', 'Rawat ji roz subah saat baje "Suprabhat" bhejte hain. Aaj "Saavdhaan" bheja. Mujhe tabhi shak hona chahiye tha.'],
          ['zoya', 'Kisi ka forward pakadna aur kisi ko pakadna, dono alag kaam hain.'],
        ],
        options: [
          {
            intent: 'Write a scarier forward of your own',
            beats: [
              { who: 'player', line: 'Likho: "Water cannon aa raha hai. Garam paani wala."' },
              { who: 'asha', line: 'Garam paani?! Haaye! Sabko bata deti hoon.' },
              { who: 'zoya', line: 'Tumne abhi ek afwaah ka source pakda aur khud source ban gaye.' },
              { who: 'player', line: 'Startup hai.', react: 'laugh' },
            ],
            effects: { nuisance: 10, heat: 2, flags: ['afwaah-cannon'] },
            do: ['rumour:cannon:cp'],
            next: 'carry',
          },
          {
            intent: 'Send a correction so boring nobody reads either',
            beats: [
              { who: 'player', line: 'Asha ji, ye bhejo: "Pichhle sandesh ke sandarbh mein kripya dhyan dein ki uski pramaanikta abhi tak sunishchit nahi ki ja saki hai, vistaar se jaankari hetu…"' },
              { who: 'asha', line: 'Main so gayi.' },
              { who: 'zoya', line: 'Perfect. Koi nahi padhega. Original bhi nahi. Dono saath mein doob jayenge.', react: 'laugh' },
            ],
            effects: { help: 8, aura: 4, flags: ['afwaah-killed'] },
            do: ['intensity:-1', 'callback:boring'],
            end: 'done',
          },
          {
            intent: "Remix Rawat's voice note into a reel",
            beats: [
              { who: 'meera', line: 'Bhai. "Woh senior adhikari main hi hoon" pe beat drop. Pressure cooker ki seeti pe transition.' },
              { who: 'c4', line: 'Kya kar rahe ho? Meri awaaz? …Achha, mera naam aayega?', via: 'phone' },
              { who: 'meera', line: 'Credit mein.' },
              { who: 'c4', line: 'Phir theek hai. Thana Parivar mein bhejna. Pehle mujhe.', via: 'phone', react: 'laugh' },
            ],
            effects: { aura: 12, nuisance: 4, flags: ['rawat-remix', 'afwaah-killed'] },
            do: ['intensity:-1', 'callback:remix'],
            end: 'done',
          },
        ],
      },
    },
    callbacks: {
      sena: 'Because you shouted "five lakh DRS" at the stage at {t}, the stage started a counter-chant for people who weren\'t there yet, at {at}.',
      nerve: 'Because you walked the forward all the way to the stage at {t} and then called it fake, the stage stayed put at {at}.',
      biryani: 'Because you announced free biryani at {t}, the stage emptied towards CP at {at}. There was only Asha\'s chai.',
      cannon: 'Because you whispered "water cannon" to one aunty at {t}, the whole stage heard it at {at}.',
      count: 'Because you went and counted the DRS bikes at {t}, "five lakh" became "six and a kulfi" by {at}.',
      selffulfil: 'Because you told the DRS boys about their own five lakh at {t}, they forwarded it to themselves and came, at {at}.',
      inflate: 'Because you rounded six bikes up to "hazaaron" at {t}, the barricade believed it at {at}.',
      saazish: 'Because you told Constable Rawat it was a DRS conspiracy at {t}, the police line was waiting for the DRS at {at}.',
      rawat: 'Because you got Constable Rawat to forward the real count at {t}, Thana Parivar got a correction and a rose at {at}.',
      nice: 'Because you asked Constable Rawat to forward something nice at {t}, his wife called it fake at {at}.',
      boring: 'Because you wrote the most boring correction in Delhi at {t}, nobody forwarded anything by {at}.',
      remix: 'Because you let Meera remix Rawat\'s voice note at {t}, "woh senior adhikari main hi hoon" was trending by {at}.',
    },
    outcomes: {
      done: {
        caption: 'jantar mantar ka sabse tez vehicle: forward 📲 aaj kisi ne uska steering pakad liya 😭',
        captionLater: 'Protesters running FAKE NEWS ops from a tea stall?? See how "students" manipulate WhatsApp groups 👀 #Afwaah',
        callback: 'Because you got your hands on Rawat\'s forward at {t}, it went where you sent it by {at}.',
      },
      fail: {
        caption: '"DRS ke 5 LAKH aa rahe hain" — reality: 6 bikes aur 1 kulfi. par forward jeet gaya 📲😭',
        captionLater: 'Jantar Mantar "peaceful" protesters spread panic about DRS, shared 10,000 times. Who benefits? 🤔',
        callback: 'Because nobody caught the five-lakh forward at {t}, the barricade believed it by {at}, and even Sharma looked up.',
        do: ['flag:afwaah-ran-wild'],
      },
    },
  },
};
