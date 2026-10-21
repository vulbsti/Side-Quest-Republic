// talks-police: the named police (c1 Yadav, c2 Meena, c3 Tomar, c4 Rawat, c5 Gill, r1 Pandey) and the
// per-officer answers to the quick pester verbs (Sharma, c1–c5, and the faceless RAF).
// Format: plans/story-rebuild.md, "Conversations". Engine: story.js talk(), and pester() in rules.js.
//
// Voices, so no two of them sound alike:
// - Yadav (c1, Metro path): slow, yawning, food first, transfer application no. 4471 to Rewari. Lets things slide.
// - Meena (c2, CP stop): clipped, sees through you ("Jhooth. Agla."), files everything, tries not to laugh.
// - Tomar (c3, stage-barricade road): loud, "Oye hero", invents sections of law, writes names, chases.
// - Rawat (c4, stage, then the detention bus from 14:00): reads forwards aloud, "Forward as received", 34 groups.
// - Gill (c5, Parliament Street): Punjabi, reel jargon, hides his phone, fan of your clips.
// - Pandey (r1, RAF from 14:00): Bihari "hum", Muzaffarpur, Amma, litchi, little brother Chhotu in the Patna video.
// Beats are [who, line] pairs (story.js reads b.who ?? b[0]); L() where a beat needs a reaction.

const L = (who, line, react) => ({ who, line, react });

// ============================================================================================
// Constable Yadav (c1)
// ============================================================================================
const yadav = [
  {
    id: 'yadav-m1', phase: ['morning'], priority: 2,
    start: 'a',
    nodes: {
      a: {
        beats: [['c1', '(jamhaai) Tum chai wale ho? Nahi? Phir kyun aaye.'], ['c1', 'Subah chaar baje se khada hoon. Saat baje chai ka order diya tha. Abhi tak nahi aayi.']],
        options: [
          { intent: 'Give him your own chai, in front of everyone',
            beats: [['player', 'Ye lo uncle, meri wali. Abhi garam hai.'], ['c1', '...Tum bhagwan ho. Ya informer. Dono chalega.']],
            effects: { mood: { c1: 'soft' }, flags: ['yadav-chai', 'seen-as-chamcha'] } },
          { intent: 'Tell him the chai stall has been shut down',
            beats: [['player', 'Uncle chai stall band ho gaya. Police ne hata diya.'], ['c1', 'Police ne? Hum police hain. Humne kab... (sochta hai) ...Main hi tha kya?']],
            effects: { nuisance: 5, mood: { c1: 'annoyed' } } },
          { intent: 'Ask what has kept him up since 4 am', next: 'transfer' },
        ],
      },
      transfer: {
        beats: [['c1', 'Transfer application. Rewari. Ghar se baarah kilometre. Number 4471.'], ['c1', 'Teen saal se "under process". Main bhi under process hoon.']],
        options: [
          { intent: 'Offer to tag the Commissioner in a reel about it',
            beats: [['player', 'Uncle ek reel banate hain. "Yadav ji ka transfer kab?" Commissioner ko tag.'], ['c1', 'Tag? Woh kya hota hai. ...Naam theek se likhna. Y-A-D-A-V. Do A.']],
            effects: { aura: 3, heat: 5, mood: { c1: 'amused' }, flags: ['yadav-transfer-reel'] } },
          { intent: 'Tell him Rewari is overrated',
            beats: [['player', 'Rewari mein kya hai uncle? Yahan protest hai, live music hai, drama hai.'], ['c1', 'Rewari mein meri amma ka rajma hai. Tum bachche ho.']],
            effects: { nuisance: 3 } },
        ],
      },
    },
  },
  {
    id: 'yadav-m2', phase: ['morning'], priority: 1,
    nodes: {
      a: {
        beats: [['c1', 'Samosa ki khushboo aa rahi hai. Tumhe aa rahi hai?'], ['player', 'Nahi uncle.'], ['c1', 'Matlab sapna hai. Theek hai. Sapna bhi chalega.']],
        options: [
          { intent: 'Ask him to look away while your friends climb the railing',
            beats: [['player', 'Uncle, dost railing pe chadhenge photo ke liye. Aap thoda Rewari ki taraf dekh lo?'], ['c1', 'Kaunsi railing. Main toh aankh band karke soch raha tha. Paanch minute.']],
            effects: { nuisance: 5, aura: 4, flags: ['yadav-looked-away'] } },
          { intent: 'Describe a samosa to him in loving detail',
            beats: [['player', 'Aloo, matar, thoda adrak, upar se imli ki chutney, garam garam, kurkura kona...'], ['c1', 'Bas. Bas karo. Duty pe hoon. ...Imli wali thi?']],
            effects: { nuisance: 2, mood: { c1: 'amused' } } },
          { intent: 'Ask him if anything ever happens on this road',
            beats: [['c1', 'Kuch nahi hota. Isliye mujhe yahan rakha hai. Sab kehte hain Yadav ke paas kuch nahi hota.'], ['c1', 'Ek baar ek kutta aaya tha. Woh bhi so gaya.']] },
        ],
      },
    },
  },
  {
    id: 'yadav-m3', phase: ['morning', 'midday'], priority: 5, requires: { did: ['career-counselling'] },
    nodes: {
      a: {
        beats: [['c1', 'Tum the na? Career counselling wale?'], ['c1', 'Tumhare baad maine SSC ka form khola. Phir band kiya. Phir khola. Abhi browser mein khula hai.']],
        options: [
          { intent: 'Make him submit it right now, on duty',
            beats: [['c1', 'Abhi? ...Captcha aa gaya. "Select all images with buses."'], ['player', 'Teen bus.'], ['c1', 'Galat. Wrong captcha. Ye sarkar bhi mere khilaaf hai.']],
            effects: { aura: 3, mood: { c1: 'amused' } } },
          { intent: 'Tell him the form is probably a scam',
            beats: [['c1', 'Mujhe pata tha. Pichhli baar bhi scam tha. Main yahin theek hoon. Khade khade.']],
            effects: { nuisance: 3, mood: { c1: 'bored' } } },
        ],
      },
    },
  },
  {
    id: 'yadav-d1', phase: ['midday'], priority: 2,
    nodes: {
      a: {
        beats: [['c1', 'Lunch ka time hai. Lunch nahi aaya. Lunch ka bhi transfer ho gaya.'], ['c1', 'CP pe biryani ki baat chal rahi thi. Sach hai?']],
        options: [
          { intent: 'Swear the biryani is real (it is not) and send him off',
            beats: [['player', 'Bilkul uncle. Ek plate aapke naam ki rakhi hai.'], ['c1', 'Main jaa raha hoon. Post ki rakhwali tum karo. Kisi ko kuch mat karne dena. Ya karne dena. Mujhe kya.']],
            effects: { nuisance: 6 }, do: ['rumour:biryani:cp', 'move:c1:cp'] },
          { intent: 'Split your bun-samosa with him',
            beats: [['player', 'Aadha aapka.'], ['c1', 'Aadha? ...Aadha bhi bahut hai. Tum log achhe ho. Sirf protest karte ho.']],
            effects: { mood: { c1: 'soft' }, flags: ['yadav-chai'] } },
          { intent: 'Tell him lunch is a capitalist construct',
            beats: [['c1', 'Kya construct? ...Bhook construct nahi hai beta. Bhook asli hai.']],
            effects: { nuisance: 2, mood: { c1: 'amused' } } },
        ],
      },
    },
  },
  {
    id: 'yadav-d2', phase: ['midday'], priority: 1,
    nodes: {
      a: {
        beats: [['c1', 'Woh ladka railing pe chadh raha hai na? Tumhara dost?'], ['player', 'Kaun? Kahan?'], ['c1', 'Mujhe nahi pata. Main pooch raha hoon taaki mujhe na pata ho.']],
        options: [
          { intent: 'Say yes, he is with you, and go get him down',
            beats: [['c1', 'Achha. Toh tum utaaro. Main dekhunga toh likhna padega. Likhne mein pen chahiye. Pen nahi hai.']],
            effects: { help: 4, flags: ['yadav-looked-away'] } },
          { intent: 'Swear you have never seen him in your life',
            beats: [['c1', 'Badhiya. Main bhi nahi. Hum dono ne nahi dekha. Ye dosti hai.']],
            effects: { nuisance: 2, mood: { c1: 'amused' }, flags: ['yadav-looked-away'] } },
          { intent: 'Ask to borrow his pen anyway',
            beats: [['c1', 'Pen hota toh transfer application dobara likhta. Saatvi baar.']] },
        ],
      },
    },
  },
  {
    id: 'yadav-d3', phase: ['midday', 'tense'], priority: 4, requires: { flags: ['yadav-chai'] },
    nodes: {
      a: {
        beats: [['c1', 'Chai wale! Suno. Wireless pe suna, do baje RAF aa rahi hai. Barricade aage badhega.'], ['c1', 'Maine kuch nahi bola. Main toh so raha tha.']],
        options: [
          { intent: 'Shout it to the whole crowd',
            beats: [['player', 'SUNO SAB! DO BAJE RAF!'], ['c1', 'Arre dheere! Mera naam mat lena! Main so raha tha!']],
            effects: { aura: 4, heat: 4 }, do: ['intensity:+1'] },
          { intent: 'Keep it to yourself and thank him',
            beats: [['c1', 'Shukriya kya. Agli baar elaichi daalna.']],
            effects: { help: 3 } },
        ],
      },
    },
  },
  {
    id: 'yadav-t1', phase: ['tense'], priority: 2,
    nodes: {
      a: {
        beats: [['wireless', 'Saare jawan alert. Inspector Rao on the way.'], ['c1', '(seedha khada hota hai) Main alert hoon. Main hamesha alert tha.'], ['c1', 'Rao sir aaye toh batana. Main aankh khol ke so leta hoon.']],
        options: [
          { intent: 'Shout "Rao sir aa gaye!" as a prank',
            beats: [['player', 'RAO SIR AA GAYE!'], L('c1', '(jhatke se) Jai Hind sir! ...Koi nahi hai. Tum. TUM.', 'laugh')],
            effects: { aura: 5, heat: 6, mood: { c1: 'annoyed' } } },
          { intent: 'Keep watch for Rao while he naps',
            beats: [['player', 'Main dekh raha hoon uncle. Aap rest karo.'], ['c1', 'Tum asli desh-bhakt ho. (do second mein kharrate)']],
            effects: { nuisance: 4, mood: { c1: 'soft' }, flags: ['yadav-lookout'] } },
        ],
      },
    },
  },
  {
    id: 'yadav-t2', phase: ['tense'], priority: 1,
    nodes: {
      a: {
        beats: [['c1', 'Garmi dekh rahe ho? Helmet ke andar meri aatma pak rahi hai. Dum aloo ban gayi hai.']],
        options: [
          { intent: 'Pour your water bottle over his helmet',
            beats: [['c1', 'Ahhh. ...Ye illegal hai. Dobara karo.']],
            effects: { aura: 4, heat: 3, mood: { c1: 'amused' } } },
          { intent: 'Ask him to call Tomar off your back',
            requires: { anyFlags: ['yadav-chai', 'yadav-lookout', 'yadav-looked-away'] },
            beats: [['c1', '(wireless uthata hai) Tomar. Chhod de. Ladka mere saath hai.'], ['c1', '...Haan, chai wala. Haan wahi. Chhod de.']],
            effects: { heat: -10, flags: ['tomar-called-off'] }, do: ['calm:c3'] },
          { intent: 'Remind him the transfer list comes out today',
            beats: [['c1', 'Aaj? Kisne bola? (phone nikaalta hai) Do percent battery. Charger hai tumhare paas?'], ['player', 'Nikhil ka bhi teen percent hai.'], ['c1', 'Toh hum sab ek hi naav mein hain.']] },
        ],
      },
    },
  },
  {
    id: 'yadav-s1', phase: ['showdown'], priority: 2,
    nodes: {
      a: {
        beats: [['c1', '(haanpte hue) Order aaya hai. Aage badhna hai. Main dheere badh raha hoon.'], ['c1', 'Tum tez bhaago. Ulta. Metro ki taraf.']],
        options: [
          { intent: 'Stay and film him jogging in slow motion',
            beats: [['c1', 'Mat banao! Mera transfer ruk jaayega! ...Achha slow-mo mein banao, tez wala achha nahi lagta.']],
            effects: { aura: 6, heat: 6 }, do: ['clip:charge'] },
          { intent: 'Run the way he points, away from your friends',
            beats: [['c1', 'Shabash. Ab main tumhe "nahi dekh paaya". Bahut tez the tum.']],
            effects: { heat: -6, help: -2, flags: ['yadav-waved-off'] } },
        ],
      },
    },
  },
  {
    id: 'yadav-s2', phase: ['showdown'], priority: 1,
    nodes: {
      a: {
        beats: [['c1', 'Aansu gas hai. Rumaal hai? Mere paas do hain. Ek mera, ek transfer ke din ke liye rakha tha.']],
        options: [
          { intent: 'Hand his spare hanky to a coughing aunty instead',
            beats: [['c1', 'Achha kiya. Main bhi yahi karta. Agar uthta.']],
            effects: { help: 6, heat: 2 } },
          { intent: 'Take his spare hanky for yourself',
            beats: [['c1', 'Wapas kar dena. Usme Rewari ki mitti hai.']],
            effects: { help: 1, mood: { c1: 'soft' } } },
        ],
      },
    },
  },
  {
    id: 'yadav-a1', phase: ['aftermath'], priority: 2,
    nodes: {
      a: {
        beats: [['c1', '(phone dekhta hai) Message aaya. Transfer order.'], ['player', 'Rewari?!'], L('c1', 'Jantar Mantar. Permanent.', 'silence')],
        options: [
          { intent: 'Offer to start a protest for his transfer',
            beats: [['c1', 'Yahan? Mere liye? Board pe kya likhoge?'], ['player', '"Yadav ko Rewari bhejo."'], ['c1', 'Tukbandi nahi hai. Par dil hai.']],
            effects: { aura: 5, nuisance: 3, flags: ['yadav-slogan'] } },
          { intent: 'Congratulate him with total sincerity',
            beats: [['c1', 'Shukriya. Kal se main yahan ka purana hoon. Tum log roz aana. Chai lana.']],
            effects: { help: 2, mood: { c1: 'soft' } } },
        ],
      },
    },
  },
  {
    id: 'yadav-a2', phase: ['aftermath'], priority: 1,
    nodes: {
      a: {
        beats: [['c1', 'Chai aa gayi. Saat baje ka order. Saade paanch baje.'], ['c1', 'Thandi hai. Phir bhi meri hai.']],
        options: [
          { intent: 'Ask him to tell you what he saw today, officially',
            requires: { anyFlags: ['yadav-looked-away', 'yadav-lookout', 'yadav-chai'] },
            beats: [['c1', 'Officially? Kuch nahi. Main toh so raha tha. Poore din. Likh lo.']],
            effects: { heat: -8 } },
          { intent: 'Ask to be in his report as "helpful"',
            beats: [['c1', 'Report mein naam? Phir sab poochhenge. Naam se door raho beta. Naam se transfer hota hai.']],
            effects: { nuisance: 1 } },
          { intent: 'Sit with him while he drinks it',
            beats: [['c1', 'Aaj ka din kaisa tha?'], ['player', 'Lamba.'], ['c1', 'Haan. Lamba.']],
            effects: { help: 2 } },
        ],
      },
    },
  },
];

// ============================================================================================
// Constable Meena (c2)
// ============================================================================================
const meena = [
  {
    id: 'meena-m1', phase: ['morning'], priority: 2,
    nodes: {
      a: {
        beats: [['c2', 'Kahan ja rahe ho?'], ['player', 'Tuition.'], ['c2', 'Aaj tumse pehle chaar log tuition gaye hain. Jantar Mantar pe. Bahut achhi coaching hai yahan.']],
        options: [
          { intent: 'Double down: it is a civics class, practical',
            beats: [['player', 'Haan madam, civics. Practical.'], ['c2', '(likhti hai) "Civics practical." Agla jhooth?']],
            effects: { nuisance: 3, mood: { c2: 'amused' } } },
          { intent: 'Admit you are here for the protest',
            beats: [['c2', 'Sach bola. Rare hai. Paani piyo, dhoop mein mat khade raho, barricade se door.']],
            effects: { help: 2, flags: ['meena-truth'] } },
          { intent: 'Ask her how she knew',
            beats: [['c2', 'Tuition bag mein kitaab hoti hai. Tumhare bag mein poster hai. Aur ek kela.']] },
        ],
      },
    },
  },
  {
    id: 'meena-m2', phase: ['morning'], priority: 1,
    nodes: {
      a: {
        beats: [['c2', 'Driver chai pe gaya, chabi hook pe hai. Maine dekha ki tumne dekha.'], ['c2', 'Main bas bata rahi hoon ki main dekh rahi hoon.']],
        options: [
          { intent: 'Say you were admiring the hook as a piece of craft',
            beats: [['c2', 'Hook ki craftsmanship. Haan. Bahut sundar hook hai. Door se dekho.']],
            effects: { nuisance: 2, mood: { c2: 'amused' } } },
          { intent: 'Ask her to look away for two minutes',
            beats: [['c2', 'Do minute? Main do second door nahi dekhti. Mera kaam hi dekhna hai.']],
            effects: { heat: 5, flags: ['meena-watching-key'] } },
          { intent: 'Point out that Sharma is staring at the samosas',
            beats: [['c2', 'Sharma ji ka samosa se rishta purana hai. Usme main nahi padti.']] },
        ],
      },
    },
  },
  {
    id: 'meena-m3', phase: ['morning', 'midday'], priority: 5, requires: { did: ['career-counselling'] },
    nodes: {
      a: {
        beats: [['c2', 'Tum. Career counselling.'], ['c2', 'Yadav ne SSC form khol liya. Sharma ji ne mujhe bola "beta, UPSC do". Main already constable hoon. Merit se.']],
        options: [
          { intent: 'Tell her she really should take UPSC',
            beats: [['c2', 'Phir tumhe kaun pakdega? Rawat? Woh forward padhta rahega, tum Parliament pahunch jaoge.']],
            effects: { aura: 3, mood: { c2: 'amused' } } },
          { intent: 'Apologise for starting the whole thing',
            beats: [['c2', 'Maafi nahi. Content tha. Mera good side tha na video mein?'], ['player', 'Haan.'], ['c2', 'Jhooth. Par chalega.']],
            effects: { mood: { c2: 'amused' }, flags: ['meena-laughed'] } },
        ],
      },
    },
  },
  {
    id: 'meena-d1', phase: ['midday'], priority: 2,
    nodes: {
      a: {
        beats: [['c2', 'Rawat ji ne police group mein bheja: "Jantar pe free biryani, sab constable pahunche."'], ['c2', 'Teen log gaye. Main nahi gayi. Kyunki main padhi likhi hoon.']],
        options: [
          { intent: 'Swear the biryani is real, you saw it',
            beats: [['c2', 'Tumne dekha. Kha ke dekha? Mooh pe chawal nahi hai. Jhooth. Agla.']],
            effects: { nuisance: 4, mood: { c2: 'annoyed' } } },
          { intent: 'Help her write a group-wide FAKE reply',
            beats: [['player', 'Likho: "Ye fake hai. Biryani nahi hai. Duty karo."'], ['c2', 'Bhej diya. ...Rawat ji ne "Good night" sticker bheja. Dopahar ke ek baje.']],
            effects: { help: 4, flags: ['meena-debunk'] } },
          { intent: 'Ask her what the police group is like',
            beats: [['c2', 'Do sau log. Roz subah "Suprabhat". Aur ek video jisme sher dance karta hai. Har din wahi sher.']],
            effects: { mood: { c2: 'amused' } } },
        ],
      },
    },
  },
  {
    id: 'meena-d2', phase: ['midday'], priority: 1,
    nodes: {
      a: {
        beats: [['c2', 'Duty pe hasna mana hai. Aath saal se nahi hasi. Try karo. Sab karte hain.']],
        options: [
          { intent: 'Tell her the banana uncle joke',
            beats: [['player', 'Ek uncle kele lene aaye, detain ho gaye. Rasid kele ke saath chali gayi.'], ['c2', 'Ye joke nahi hai. Ye kal ki FIR hai.']],
            effects: { nuisance: 1 } },
          { intent: 'Do your Officer Sharma impression',
            beats: [['player', '(bhaari awaaz) "Naam? Naam. Naam bolo. Naam."'], L('c2', '(hothon ko dabaati hai) ...Ye Sharma ji ke saamne mat karna.', 'laugh')],
            effects: { aura: 4, heat: 2, mood: { c2: 'amused' }, flags: ['meena-laughed'] } },
          { intent: 'Just stare at her until she cracks',
            requires: { mood: { c2: ['amused', 'soft'] } },
            beats: [L('c2', '...Pfft. NAHI. Jao. (mud ke hasti hai)', 'laugh')],
            effects: { mood: { c2: 'soft' }, flags: ['meena-laughed'] } },
        ],
      },
    },
  },
  {
    id: 'meena-d3', phase: ['midday', 'tense'], priority: 5, requires: { did: ['chabi'] },
    nodes: {
      a: {
        beats: [['c2', 'Bus nahi chal rahi. Chabi gayab. Iqbal bhai pareshan hain. Tum us waqt hook ke paas the.'], ['c2', 'Mujhe kuch saabit nahi karna. Bas tumhari aankh dekhni thi.']],
        options: [
          { intent: 'Look her dead in the eye and say nothing',
            beats: [['c2', 'Haan. Ab pata chal gaya. (diary mein kuch likhti hai)']],
            effects: { heat: 8, flags: ['meena-knows-key'] } },
          { intent: 'Confess, and ask her to keep it quiet',
            beats: [['c2', 'Main chup. Par Iqbal bhai ko wapas karna. Unki beti ka rishta dekhne jaana hai. Bus se hi.']],
            effects: { help: 3, heat: -3, flags: ['meena-knows-key'] } },
        ],
      },
    },
  },
  {
    id: 'meena-t1', phase: ['tense'], priority: 2,
    nodes: {
      a: {
        beats: [['c2', 'Woh teen ladke dekhe? Safed gaadi ke paas. Naye joote. Protest mein naye joote kaun pehenta hai?'], ['c2', 'Main bol nahi sakti. Upar se "mat chhedo" aaya hai. Tum bol sakte ho.']],
        options: [
          { intent: 'Promise to get them on camera',
            beats: [['c2', 'Camera pe aaye toh bhaagenge. Woh camera se darte hain, lathi se nahi. Ajeeb log.']],
            effects: { heat: 3, flags: ['meena-tip-provocateurs'] } },
          { intent: 'Ask why she cannot just arrest them herself',
            beats: [['c2', 'Kyunki unke paas kisi ka phone number hai. Mere paas sirf whistle hai.']],
            effects: { help: 1 } },
        ],
      },
    },
  },
  {
    id: 'meena-t2', phase: ['tense'], priority: 1,
    nodes: {
      a: {
        beats: [['wireless', 'Meena, CP pe kitne hain? Ginti karo.'], ['c2', '(saans) Sir, chaudah. Ek kutta. Do Asha ji ke customer.'], ['wireless', 'Kutta mat gino.'], ['c2', 'Sir, woh naara laga raha hai.']],
        options: [
          { intent: 'Bark like the dog, into the wireless',
            beats: [['player', 'Bhau! Bhau bhau!'], L('c2', '(hasi rokti hai) NAHI. Sir sun lenge. ...Phir se karo.', 'laugh')],
            effects: { nuisance: 3, mood: { c2: 'amused' }, flags: ['meena-laughed'] } },
          { intent: 'Count the crowd for her, badly',
            beats: [['player', 'Unnis... bees... ek wahan bhi... saadhe chaubees.'], ['c2', 'Aadha aadmi? ...Maine bhi wahi likha. Sir ko yahi chahiye.']],
            effects: { help: 2, mood: { c2: 'amused' } } },
        ],
      },
    },
  },
  {
    id: 'meena-t3', phase: ['tense'], priority: 5, requires: { flags: ['meena-laughed'] },
    nodes: {
      a: {
        beats: [['c2', 'Tum mazaakiya ho, isliye bata rahi hoon. Teen baje line banegi. Jahan camera hoga, wahan.'], ['c2', 'Camera door rakhoge, line door rahegi.']],
        options: [
          { intent: 'Say you will bring every camera you can find',
            beats: [['c2', 'Toh line tumhare paas aayegi. Aur mujhe bhi bhejenge. Mujhe dhoop pasand nahi.']],
            effects: { aura: 5, heat: 4 }, do: ['intensity:+1'] },
          { intent: 'Thank her and keep cameras away from the stage',
            beats: [['c2', 'Thank you mat bolo. Log dekh rahe hain. Jao, bas jao.']],
            effects: { help: 4, flags: ['meena-line-tip'] } },
        ],
      },
    },
  },
  {
    id: 'meena-s1', phase: ['showdown'], priority: 2,
    nodes: {
      a: {
        beats: [['c2', 'Idhar aao. Abhi.'], ['c2', 'Left mat jaana. Left mein Tomar hai. Aur Tomar ko aaj kisi pe gussa nikaalna hai.']],
        options: [
          { intent: 'Go left anyway, to film Tomar',
            beats: [['c2', 'Main ne bola tha. Likh ke bola tha. Kaun sunta hai.']],
            effects: { aura: 6, heat: 10 }, do: ['chase:c3'] },
          { intent: 'Go right, and drag a stranger with you',
            beats: [['c2', 'Shabash. Ab mujhe dekh ke mat muskurana. Log dekh rahe hain.']],
            effects: { help: 6, heat: -4 } },
        ],
      },
    },
  },
  {
    id: 'meena-s2', phase: ['showdown'], priority: 1,
    nodes: {
      a: {
        beats: [['c2', 'Phone do. Order hai: "jo shoot kar raha hai, uska phone".'], ['c2', '...Maine "jo" bola. "Tum" nahi bola.']],
        options: [
          { intent: 'Hide your phone in your sock',
            beats: [['c2', 'Mujhe pata hai sock mein hai. Sabka sock mein hota hai. Jao.']],
            effects: { nuisance: 3, mood: { c2: 'amused' } } },
          { intent: 'Hand her your phone',
            beats: [['c2', '(screen dekhti hai) Itni battery mein protest? Wapas lo. Aur charge karo. Ye bhi order hai.']],
            effects: { heat: -5, mood: { c2: 'soft' } } },
          { intent: 'Point out that she said "jo", not "tum"',
            beats: [['c2', 'Haan. Grammar se bachoge aaj. Jao.']] },
        ],
      },
    },
  },
  {
    id: 'meena-a1', phase: ['aftermath'], priority: 2,
    nodes: {
      a: {
        beats: [['c2', '(baith jaati hai) Report mein kya likhun? "Bheed aayi, bheed gayi, ek kutta naara laga raha tha."']],
        options: [
          { intent: 'Dictate a dramatic report starring you',
            beats: [['player', 'Likho: "Ek mahaan yuva ne poore din shanti banaye rakhi."'], ['c2', '"Ek yuva ne poore din pareshan kiya." Likh diya. Spelling bhi sahi.']],
            effects: { aura: 2, nuisance: 2 } },
          { intent: 'Tell her to write down the truth',
            beats: [['c2', 'Sach? Sach report mein jaata toh main kab ki inspector hoti.']],
            effects: { help: 2, mood: { c2: 'soft' } } },
        ],
      },
    },
  },
  {
    id: 'meena-a2', phase: ['aftermath'], priority: 1,
    nodes: {
      a: {
        beats: [['c2', 'Tum abhi bhi yahin ho. Mummy?'], ['player', 'Mummy ko pata hai main tuition pe hoon.'], ['c2', 'Chhe baje tak tuition. Wah. Merit se.']],
        options: [
          { intent: 'Tell her you recorded her laughing',
            requires: { flags: ['meena-laughed'] },
            beats: [['c2', 'Delete karo.'], ['player', 'Pakka?'], ['c2', '...Mujhe bhej ke delete karo.']],
            effects: { aura: 4, mood: { c2: 'soft' } } },
          { intent: 'Ask for a lift home in the police jeep',
            beats: [['c2', 'Jeep mein jaane ke liye detain hona padta hai. Chalo?'], ['player', 'Nahi nahi.'], ['c2', 'Toh Metro.']],
            effects: { nuisance: 1 } },
          { intent: 'Say goodbye her way: "Agla."',
            beats: [['player', 'Theek hai madam. Agla.'], ['c2', '...Mera dialogue. Wah. Jao.']],
            effects: { mood: { c2: 'amused' } } },
        ],
      },
    },
  },
];

// ============================================================================================
// Constable Tomar (c3)
// ============================================================================================
const tomar = [
  {
    id: 'tomar-m1', phase: ['morning'], priority: 2,
    nodes: {
      a: {
        beats: [['c3', 'Oye hero! Haan tu. Bag khol.'], ['player', 'Kyun sir?'], ['c3', 'Kyunki main bol raha hoon. Ye kaafi reason hai.']],
        options: [
          { intent: 'Ask him which law says so',
            beats: [['c3', 'Section... chaar sau... Tomar. Section Tomar. Chal khol.']],
            effects: { aura: 4, heat: 10, flags: ['tomar-noticed'] } },
          { intent: 'Open the bag with full ceremony',
            beats: [['player', '(dheere dheere) Ek bottle. Ek kela. Ek poster: "Sawaal poochho".'], ['c3', 'Sawaal? Mujhse? Poster confiscate.']],
            effects: { heat: 6, flags: ['tomar-took-poster'] } },
          { intent: 'Walk away without a word',
            beats: [['c3', 'Haan haan, ja. Chehra yaad hai mujhe. Sabka yaad rehta hai.']],
            effects: { heat: 3, flags: ['tomar-noticed'] } },
        ],
      },
    },
  },
  {
    id: 'tomar-m2', phase: ['morning'], priority: 1,
    nodes: {
      a: {
        beats: [['c3', 'Kya dekh raha hai?'], ['player', 'Kuch nahi sir.'], ['c3', 'Kuch nahi dekh raha toh aankhen kyun khuli hain?']],
        options: [
          { intent: 'Stare back. Do not blink.',
            beats: [['c3', '...Tu blink kar.'], ['player', 'Aap karo.'], ['c3', 'MAIN POLICE HOON!']],
            effects: { aura: 6, heat: 12 }, do: ['chase:c3'] },
          { intent: 'Close your eyes and just stand there',
            beats: [['c3', 'Ab ye kya hai? Aankh band protest? Dekh lunga. Matlab... tu dekh nahi raha, main dekh lunga.']],
            effects: { aura: 3, heat: 3 } },
          { intent: 'Compliment his moustache',
            beats: [['player', 'Sir moochh ekdum film level hai.'], ['c3', '...Pata hai. Sarson ka tel. Roz.']],
            effects: { nuisance: 2, mood: { c3: 'amused' } } },
        ],
      },
    },
  },
  {
    id: 'tomar-m3', phase: ['morning', 'midday'], priority: 5, requires: { did: ['career-counselling'] },
    nodes: {
      a: {
        beats: [['c3', 'Tu wahi hai na jo Sharma ko "uncle" bol raha tha. Reel mein.'], ['c3', 'Sharma mera senior hai. Uncle nahi. Senior uncle.']],
        options: [
          { intent: 'Call him "Tomar uncle" too',
            beats: [['c3', 'TOMAR SIR. (diary nikaalta hai) Naam bol. Poora.']],
            effects: { heat: 8, nuisance: 3, flags: ['name-in-register'] } },
          { intent: 'Give him a fake name from your tuition register',
            beats: [['player', 'Rohan, sir. Rohan Verma.'], ['c3', '(likhta hai) Rohan Verma. Achha. Tu gaya, Rohan.']],
            effects: { nuisance: 4, flags: ['tomar-fake-name'] } },
        ],
      },
    },
  },
  {
    id: 'tomar-d1', phase: ['midday'], priority: 2,
    nodes: {
      a: {
        beats: [['c3', 'Ye biryani wali afwaah tune udaayi? Shakal se lagta hai.']],
        options: [
          { intent: 'Admit it proudly (you did not do it)',
            beats: [['c3', 'Haan? Toh chal van mein.'], ['player', 'Mazaak sir!'], ['c3', 'Police se mazaak? Do section.']],
            effects: { heat: 12, flags: ['name-in-register'] } },
          { intent: 'Blame Constable Rawat',
            beats: [['player', 'Sir woh Rawat ji ne police group mein bheja tha.'], ['c3', '...Rawat. (wireless pe) RAWAT! Group mein kya bheja tune!']],
            effects: { nuisance: 3, flags: ['tomar-vs-rawat'] }, do: ['calm:c3'] },
          { intent: 'Ask him if he wants some biryani',
            beats: [['c3', 'Haan. ...Matlab NAHI. Duty pe kuch nahi chahiye. ...Veg hai?']],
            effects: { mood: { c3: 'amused' } } },
        ],
      },
    },
  },
  {
    id: 'tomar-d2', phase: ['midday'], priority: 1,
    nodes: {
      a: {
        beats: [['c3', 'Chalne ka tareeka theek kar. Bahut swag mein chal raha hai. Challan banega.']],
        options: [
          { intent: 'Walk past him like a penguin',
            beats: [['c3', 'Ab ye kya hai.'], L('player', 'Sarkaari walk, sir.', 'laugh')],
            effects: { aura: 5, heat: 6 } },
          { intent: 'Ask for the challan in writing',
            beats: [['c3', 'Likhit mein? (pen dhoondhta hai) ...YADAV! PEN!']],
            effects: { heat: 4, nuisance: 2, flags: ['tomar-noticed'] } },
          { intent: 'Apologise to his boots',
            beats: [['player', 'Sorry sir. Sorry boots.'], ['c3', 'Boots ne maaf kiya. Main nahi.']],
            effects: { nuisance: 1 } },
        ],
      },
    },
  },
  {
    id: 'tomar-t1', phase: ['tense'], priority: 2,
    nodes: {
      a: {
        beats: [['c3', 'Do bajkar bees minute. Mera mood kharab hai. Kisi ka bhi ho sakta tha. Tera hai.']],
        options: [
          { intent: 'Give him a reason: call him "Tomu"',
            beats: [['player', 'Sir ek reason lo. Tomu.'], ['c3', 'TOMU?!']],
            effects: { aura: 8, heat: 10 }, do: ['detain:player'] },
          { intent: 'Run before he finishes the sentence',
            beats: [['c3', 'Ruk! RUK! Main abhi sentence...']],
            effects: { heat: 8 }, do: ['chase:c3'] },
          { intent: 'Ask him what ruined his day',
            beats: [['c3', 'Biwi ne tiffin mein lauki bheji. Teesra din. LAUKI.'], ['c3', 'Tu kya muskura raha hai? Teri bhi kabhi shaadi hogi.']],
            effects: { nuisance: 2, mood: { c3: 'bored' } } },
        ],
      },
    },
  },
  {
    id: 'tomar-t2', phase: ['tense'], priority: 1,
    nodes: {
      a: {
        beats: [['c3', '(diary kholta hai) Naam, baap ka naam, mohalla. Aaj sabka likh raha hoon. Sabka.']],
        options: [
          { intent: 'Give him a film villain as your name',
            beats: [['player', 'Gabbar, sir.'], ['c3', 'Baap ka naam?'], ['player', '...Singh.'], ['c3', 'Tu mujhe bewakoof samajhta hai? (likh leta hai)']],
            effects: { aura: 4, nuisance: 3 } },
          { intent: 'Give him your real name',
            beats: [['c3', 'Achha naam hai. Yaad rahega. Shaam ko bhi yaad rahega.']],
            effects: { heat: 4, flags: ['name-in-register'] } },
          { intent: 'Ask if he has a nice pen',
            beats: [['c3', 'Pen Yadav ka hai. Yadav ko pen chahiye toh woh bhi mujhse maangta hai. Circle hai.']] },
        ],
      },
    },
  },
  {
    id: 'tomar-t3', phase: ['tense', 'showdown'], priority: 5, requires: { flags: ['tomar-called-off'] },
    nodes: {
      a: {
        beats: [['c3', 'Yadav ne bola chhod de. Theek hai. Chhoda.'], ['c3', 'Par chai wala bhi ek din pakda jaata hai. Yaad rakhna.']],
        options: [
          { intent: 'Offer him a chai too',
            beats: [['c3', 'Main chai nahi peeta. Main gussa peeta hoon. Teen time.']],
            effects: { nuisance: 2 } },
          { intent: 'Thank him for his mercy',
            beats: [['c3', 'Mercy nahi. Paperwork. Tere liye form kaun bharega.']],
            effects: { mood: { c3: 'bored' } } },
        ],
      },
    },
  },
  {
    id: 'tomar-s1', phase: ['showdown'], priority: 2,
    nodes: {
      a: {
        beats: [['c3', '(lathi ghumaate hue) Tu! Subah se dhoondh raha hoon tujhe!']],
        options: [
          { intent: 'Run, and make it a scene',
            beats: [['player', 'Pakad ke dikhao!'], ['c3', 'DIKHATA HOON!']],
            effects: { aura: 8, heat: 10 }, do: ['chase:c3'] },
          { intent: 'Point at a camera behind him, then vanish',
            beats: [['c3', '(mud ke) Kaun? Kahan? ...Oye! Kahan gaya!']],
            effects: { nuisance: 3, heat: 3 } },
          { intent: 'Sit on the road and fold your hands',
            beats: [['c3', 'Uth! ...Uth na! (aas paas phone dekhta hai) ...Agli baar.']],
            effects: { aura: 6, heat: 4 } },
        ],
      },
    },
  },
  {
    id: 'tomar-s2', phase: ['showdown'], priority: 1,
    nodes: {
      a: {
        beats: [['c3', 'Meri lathi! Kisi ne dekhi? Abhi haath mein thi!']],
        options: [
          { intent: 'Toss it deep into the crowd',
            beats: [['c3', 'OYE!'], ['crowd', 'Lathi! Lathi aayi! Pass karo!']],
            effects: { aura: 10, heat: 15 }, do: ['chase:c3'] },
          { intent: 'Tell him Rawat took it',
            beats: [['c3', 'RAWAT! Bus pe baith ke meri lathi!']],
            effects: { nuisance: 4, flags: ['tomar-vs-rawat'] } },
          { intent: 'Pick it up and hand it back',
            beats: [['c3', '...Tune uthaayi?'], ['player', 'Giri hui thi.'], L('c3', '(lambi chuppi) Thank you. Kisi ko mat batana.', 'silence')],
            effects: { help: 3, mood: { c3: 'soft' }, flags: ['tomar-lathi'] } },
        ],
      },
    },
  },
  {
    id: 'tomar-a1', phase: ['aftermath'], priority: 2,
    nodes: {
      a: {
        beats: [['c3', '(akela baitha hai, phone pe) Haan maa. Haan. Kha liya. ...Lauki.'], ['c3', 'Tu kya dekh raha hai? Sabki maa hoti hai.']],
        options: [
          { intent: 'Ask him if the lauki was any good',
            beats: [['c3', 'LAUKI KABHI ACHHI NAHI HOTI. Ye mera official bayaan hai.']],
            effects: { nuisance: 2, mood: { c3: 'amused' } } },
          { intent: 'Tell him your mummy thinks you are at tuition',
            beats: [['c3', '(halki hasi) Tuition. Main bhi bolta tha. Phir police ban gaya.']],
            effects: { help: 2, mood: { c3: 'soft' } } },
          { intent: 'Pretend you heard nothing',
            beats: [['c3', 'Kuch nahi suna? Achha hai. Ab sun: ghar ja.']] },
        ],
      },
    },
  },
  {
    id: 'tomar-a2', phase: ['aftermath'], priority: 1,
    nodes: {
      a: {
        beats: [['c3', 'Kal bhi aayega?'], ['player', 'Shayad.'], ['c3', 'Main yahin hoon. Har roz. Isi jagah.']],
        options: [
          { intent: 'Tell him the register says "Rohan Verma"',
            requires: { flags: ['tomar-fake-name'] },
            beats: [['c3', '(diary dekhta hai) Rohan Verma... ROHAN!']],
            effects: { aura: 5, heat: 6 }, do: ['chase:c3'] },
          { intent: 'Promise to bring a poster just for him',
            beats: [['c3', 'Kya likhega?'], ['player', '"Tomar sir ko lauki se azaadi do."'], ['c3', '...Theek hai. Line mein mat aana.']],
            effects: { mood: { c3: 'amused' }, nuisance: 1 } },
          { intent: 'Say nothing and walk off',
            beats: [['c3', 'Haan, ja. ...Dhyan se ja.']] },
        ],
      },
    },
  },
];

// ============================================================================================
// Constable Rawat (c4)
// ============================================================================================
const rawat = [
  {
    id: 'rawat-m1', phase: ['morning'], priority: 2,
    nodes: {
      a: {
        beats: [['c4', 'Beta ye padho. "Aaj 11:11 pe Jantar Mantar ke upar NASA ka satellite guzrega, phone band rakhein." Forward as received.'], ['c4', 'Mere saale ne bheja. Woh ISRO ke canteen mein the.']],
        options: [
          { intent: 'Tell him a scarier one: water cannon at noon',
            beats: [['c4', '(aankhen badi) Sach? Main police group mein daal deta hoon. Sabko pata hona chahiye. 🙏']],
            effects: { nuisance: 6, flags: ['rawat-forward'] }, do: ['rumour:cannon:stage'] },
          { intent: 'Gasp, and ask him to forward it to you',
            beats: [['c4', 'Bhej raha hoon. Tum gyaarah logon ko bhejna, warna saat din battery 1% pe.']],
            effects: { nuisance: 3, mood: { c4: 'amused' }, flags: ['rawat-friend'] } },
          { intent: 'Debunk it with a fact-check link',
            beats: [['c4', 'Link? Link mein virus hota hai. Ye bhi group mein aaya tha.']],
            effects: { help: 2 } },
        ],
      },
    },
  },
  {
    id: 'rawat-m2', phase: ['morning'], priority: 1,
    nodes: {
      a: {
        beats: [['c4', 'Beta mera phone "storage full" bol raha hai. Tum log toh expert ho. Kuch karo.']],
        options: [
          { intent: 'Delete his four thousand good morning images',
            beats: [['c4', 'Sab? SAB?! Usme ek gulab wala tha, os ki boond ke saath. Woh mera favourite tha.']],
            effects: { help: 2, mood: { c4: 'annoyed' } } },
          { intent: 'Tell him the government filled it up',
            beats: [['c4', 'Mujhe pata tha. Iska bhi forward aaya tha. Ab woh bhi save nahi ho raha.']],
            effects: { nuisance: 2 } },
          { intent: 'Make him a folder called "Sach"',
            beats: [['c4', '"Sach". Wah. Ab sab yahin jaayega. Tum bahut sanskari ho.']],
            effects: { mood: { c4: 'soft' }, flags: ['rawat-friend'] } },
        ],
      },
    },
  },
  {
    id: 'rawat-m3', phase: ['morning', 'midday'], priority: 5, requires: { did: ['speaker-run'] },
    nodes: {
      a: {
        beats: [['c4', 'Woh speaker tum le gaye stage tak? Group mein video aa gaya: "Yuva shakti ne speaker uthaya." 🔥🔥'], ['c4', 'Tumhara chehra blur hai. Kele ka emoji laga hai.']],
        options: [
          { intent: 'Ask him to unblur your face',
            beats: [['c4', 'Main forward karta hoon, edit nahi. Edit karna paap hai.']],
            effects: { mood: { c4: 'amused' } } },
          { intent: 'Swear it was someone else',
            beats: [['c4', 'Group galat nahi hota beta. Group ke paas teen sau log hain. Tumhare paas kitne hain?']],
            effects: { nuisance: 1 } },
        ],
      },
    },
  },
  {
    id: 'rawat-d1', phase: ['midday'], priority: 2,
    nodes: {
      a: {
        beats: [['c4', 'Biryani! CP pe! Group mein photo aayi hai.'], ['c4', 'Haan photo 2019 ki hai. Par biryani toh biryani hai.']],
        options: [
          { intent: 'Upgrade it: a minister is coming at 3:30',
            beats: [['player', 'Uncle biryani chhodo. Saade teen baje minister aa rahe hain, barricade pe.'], ['c4', 'MINISTER? Ye toh bada forward hai. Ruko, laal gol wala emoji lagata hoon.']],
            effects: { nuisance: 6, flags: ['rawat-forward'] }, do: ['rumour:minister:barricade'] },
          { intent: 'Confirm it, and watch him leave his post',
            beats: [['c4', 'Main abhi aaya. Stage ka dhyan rakhna. Aur biryani mein aloo ho toh photo bhejna.']],
            effects: { nuisance: 6 }, do: ['rumour:biryani:cp', 'move:c4:cp'] },
          { intent: 'Tell him the photo is from a wedding',
            beats: [['c4', 'Shaadi ki biryani bhi biryani hai. Tum log bahut negative ho.']],
            effects: { help: 3 } },
        ],
      },
    },
  },
  {
    id: 'rawat-d2', phase: ['midday'], priority: 1,
    nodes: {
      a: {
        beats: [['c4', 'Bike wale aaye hain, bhagwa dupatta. Group mein likha hai "bhajan sandhya". Main bhajan sun lunga.']],
        options: [
          { intent: 'Agree, and ask him to sing along',
            beats: [['c4', '(gungunaata hai) ...Ye bhajan nahi hai. Ye naara hai.'], L('c4', 'Group galat tha? GROUP GALAT THA?', 'silence')],
            effects: { aura: 3, mood: { c4: 'shook' } } },
          { intent: 'Ask him who actually runs the group',
            beats: [['c4', 'Admin? Koi nahi jaanta. Bas hai. Hamesha se tha. Jaise Himalaya.']],
            effects: { nuisance: 1 } },
        ],
      },
    },
  },
  {
    id: 'rawat-d3', phase: ['midday', 'tense'], priority: 5, requires: { did: ['afwaah'] },
    nodes: {
      a: {
        beats: [['c4', 'Tum the na Asha ji ke stall pe? Jab forward pe behes ho rahi thi?'], ['c4', 'Maine wahi forward chauntees groups mein bheja. Ek mein main member bhi nahi tha. Pata nahi kaise.']],
        options: [
          { intent: 'Get him to add you to the police group',
            beats: [['c4', 'Admin approval chahiye. Admin main hoon. ...Approve.']],
            effects: { nuisance: 3, flags: ['rawat-group'] } },
          { intent: 'Ask him to send a correction to all 34',
            beats: [['c4', 'Correction koi nahi padhta. Par bhejta hoon. (type karta hai) "Upar wala galat tha. Ye sahi hai. Forward karein."']],
            effects: { help: 4, flags: ['rawat-correction'] } },
        ],
      },
    },
  },
  {
    id: 'rawat-t1', phase: ['tense'], priority: 2,
    nodes: {
      a: {
        beats: [['c4', 'Ab main bus guard hoon. Promotion nahi hai, par lagta hai.'], ['c4', 'Group mein aaya hai andar wale sab "videshi funding" wale hain. Ek uncle hai, kele laaya tha. Videshi kele?']],
        options: [
          { intent: 'Tell him bananas are an imported conspiracy',
            beats: [['c4', 'Mujhe pata tha! (kele ki photo kheenchta hai) Forward.']],
            effects: { nuisance: 5, flags: ['rawat-forward'] } },
          { intent: 'Vouch for the banana uncle',
            beats: [['c4', 'Tum guarantee lete ho? Achha. Main likhta hoon: "Kele wale uncle desi hain. Verified. 🙏"']],
            effects: { help: 5, flags: ['rawat-friend'] } },
          { intent: 'Ask if he has ever read a forward to the end',
            beats: [['c4', 'Aakhir mein "forward karo" likha hota hai. Wahan tak padhta hoon. Uske baad kya hai?']],
            effects: { mood: { c4: 'amused' } } },
        ],
      },
    },
  },
  {
    id: 'rawat-t2', phase: ['tense'], priority: 1,
    nodes: {
      a: {
        beats: [['c4', 'Water cannon aa raha hai? Group mein haan, wireless pe na. Main kiska maanu?']],
        options: [
          { intent: 'The group, obviously',
            beats: [['c4', 'Group. Wireless mein toh emoji bhi nahi hote. Main sabko bata deta hoon.']],
            effects: { nuisance: 6 }, do: ['rumour:cannon:barricade'] },
          { intent: 'Grab his wireless and ask it yourself',
            beats: [['player', 'Hello wireless? Cannon aa raha hai?'], ['wireless', 'Kaun bol raha hai? Ye police channel hai!'], ['c4', 'Arre beta! Rakho! RAKHO!']],
            effects: { aura: 4, heat: 6 } },
          { intent: 'The wireless, uncle. It is literally your job.',
            beats: [['c4', 'Wireless... (sunta hai) Kuch nahi bol raha. Group bol raha hai. Hmm. Dono theek hain.']],
            effects: { help: 3 } },
        ],
      },
    },
  },
  {
    id: 'rawat-t3', phase: ['tense', 'showdown'], priority: 5, requires: { did: ['bus-andar'] },
    nodes: {
      a: {
        beats: [['c4', 'Tum bus se nikle kaise? Group mein teen theories hain. Ek mein tum ud ke nikle.']],
        options: [
          { intent: 'Confirm that you flew',
            beats: [['c4', 'Main jaanta tha. Yoga ka kamaal. Forward.']],
            effects: { aura: 3, nuisance: 2 } },
          { intent: 'Tell him it was a clerical error',
            beats: [['c4', 'Clerical? Ye toh sabse badi conspiracy hai. Teen paragraph ka forward banega.']],
            effects: { nuisance: 1 } },
        ],
      },
    },
  },
  {
    id: 'rawat-s1', phase: ['showdown'], priority: 2,
    nodes: {
      a: {
        beats: [['c4', 'Sab charge pe gaye. Main bus pe hoon. Group mein likha tha charge hoga. Hua!'], ['c4', 'Group sahi tha. Pehli baar. Main screenshot le raha hoon.']],
        options: [
          { intent: 'Ask him to let the detainees out while nobody looks',
            requires: { anyFlags: ['rawat-friend', 'rawat-group'] },
            beats: [['c4', 'Group mein subah aaya tha: "Insaaniyat sabse bada dharm." ...Jao. Peeche se. Jaldi.']],
            effects: { help: 8, flags: ['rawat-let-go'] }, do: ['clip:detainees-escape'] },
          { intent: 'Ask who wrote the forward',
            beats: [['c4', 'Pata nahi. Number "+1" se tha. America se bhi log hamari fikar karte hain.']],
            effects: { nuisance: 1 } },
          { intent: 'Tell him the group got it right this once',
            beats: [['c4', 'Ek baar? Hamesha sahi hota hai. Bas time galat hota hai. Aur jagah. Aur baaki sab.']],
            effects: { mood: { c4: 'happy' } } },
        ],
      },
    },
  },
  {
    id: 'rawat-s2', phase: ['showdown'], priority: 1,
    nodes: {
      a: {
        beats: [['c4', 'Ye dekho, abhi aaya. "Delhi mein lathi charge." Kahan ka hai ye?'], ['player', 'Uncle... ye yahan ka hai. Woh aap ho. Peeche.'], ['c4', '...Main viral hoon?']],
        options: [
          { intent: 'Tell him he looks heroic',
            beats: [['c4', 'Sach? Biwi ko bhejta hoon. Saale ko. Aur chauntees groups ko.']],
            effects: { nuisance: 2, mood: { c4: 'happy' } } },
          { intent: 'Tell him to delete it before Rao sees',
            beats: [['c4', 'Delete? Forward ho chuka hai. Forward wapas nahi aata. Jaise teer. Jaise jawani.']],
            effects: { help: 2, mood: { c4: 'shook' } } },
        ],
      },
    },
  },
  {
    id: 'rawat-a1', phase: ['aftermath'], priority: 2,
    nodes: {
      a: {
        beats: [['c4', 'Ye dekho. Subah wali reel. Naya caption: "Desh-virodhi tatva Jantar pe." Maine forward kar di.'], ['player', 'Uncle, woh subah meri reel thi. Woh main hoon.']],
        options: [
          { intent: 'Ask him to forward a correction about you',
            beats: [['c4', 'Correction pe log "ok" likhte hain. Par theek hai. "Ye bachcha theek hai. Forward as received."']],
            effects: { help: 4 } },
          { intent: 'Make him read the caption out loud, slowly',
            beats: [['c4', '"Desh... virodhi..." Tum?'], L('c4', 'Tum toh mera storage theek kar rahe the.', 'silence')],
            effects: { help: 3, mood: { c4: 'shook' } } },
        ],
      },
    },
  },
  {
    id: 'rawat-a2', phase: ['aftermath'], priority: 1,
    nodes: {
      a: {
        beats: [['c4', 'Kal ka plan? Group mein aayega. Sab group mein aata hai. Tum bhi group mein aa jao.']],
        options: [
          { intent: 'Join the group (you will regret it)',
            beats: [['c4', 'Add kar diya. Pehla "Suprabhat" kal subah paanch baje. Gulab wala.']],
            effects: { nuisance: 2, flags: ['rawat-group'] } },
          { intent: 'Leave him with one true forward',
            beats: [['player', 'Uncle, paani piyo, ghar jao, aaj thak gaye ho.'], ['c4', 'Ye kaunse group se hai?'], ['player', 'Mere.'], ['c4', '...Forward karta hoon.']],
            effects: { help: 2, mood: { c4: 'soft' } } },
        ],
      },
    },
  },
];

// ============================================================================================
// Constable Gill (c5)
// ============================================================================================
const gill = [
  {
    id: 'gill-m1', phase: ['morning'], priority: 2,
    nodes: {
      a: {
        beats: [['c5', '(phone jaldi se jeb mein) Kuch nahi dekh raha tha! Wireless dekh raha tha.'], ['c5', '...Wireless pe reels nahi aati. Pata hai. Pata hai.']],
        options: [
          { intent: 'Threaten to tell Inspector Rao',
            beats: [['c5', 'Rao sir khud billi ke videos dekhte hain. Do ghante. Volume full.']],
            effects: { heat: 4 } },
          { intent: 'Ask which audio he was on',
            beats: [['c5', 'Woh "doorbell baja ke bhaag gaya" wala. Tum bhi dekhte ho? (aankhen chamakti hain) Oye hoye.']],
            effects: { mood: { c5: 'amused' }, flags: ['gill-fan'] } },
          { intent: 'Announce, loudly, that you saw nothing',
            beats: [['player', 'MAINE KUCH NAHI DEKHA.'], ['c5', 'Oye, dheere! ...Shukriya veere.']],
            effects: { nuisance: 2, mood: { c5: 'soft' } } },
        ],
      },
    },
  },
  {
    id: 'gill-m2', phase: ['morning'], priority: 1,
    nodes: {
      a: {
        beats: [['c5', 'Ek baat batao. Trending kya hai aaj? Mera algorithm sirf "police training" dikha raha hai. Bore.']],
        options: [
          { intent: 'Tell him police reels go viral when they dance',
            beats: [['c5', 'Dance? Main? Uniform mein? ...Konsa step? Bas poochh raha hoon.']],
            effects: { nuisance: 2, flags: ['gill-dance'] } },
          { intent: 'Teach him the hook-and-transition trick',
            beats: [['player', 'Pehle teen second mein hook. Phir ungli se transition.'], ['c5', '(ungli ghumaata hai) Aise? Ruko, lathi se try karta hoon.']],
            effects: { aura: 3, heat: 2, mood: { c5: 'amused' } } },
          { intent: 'Tell him to put the phone down and read a book',
            beats: [['c5', 'Book. Haan. Book ka bhi audio hai kya? Podcast? Woh bhi reel mein aata hai.']] },
        ],
      },
    },
  },
  {
    id: 'gill-m3', phase: ['morning', 'midday'], priority: 6, requires: { rep: { aura: 25 } },
    nodes: {
      a: {
        beats: [['c5', 'Ruko. Ruko ruko. Tum... woh ho na? Reel wale? Aaj subah wali?'], ['c5', 'Mere phone mein tumhari reels saved hain. Main kisi ko nahi batata.']],
        options: [
          { intent: 'Film a quick duet with him, uniform and all',
            beats: [['c5', 'Chehra mat dikhana. Sirf moochh. ...Achha, ek side se chehra. Achhi side.']],
            effects: { aura: 8, heat: 4, flags: ['gill-reel'] }, do: ['clip:pester-cute'] },
          { intent: 'Sign his notebook with your handle',
            beats: [['c5', '(duty register aage karta hai) Yahan nahi! Peeche wale page pe. Wahan meri shayari hai, uske neeche.']],
            effects: { aura: 4, heat: 2, flags: ['gill-fan'] } },
          { intent: 'Deny that it is you',
            beats: [['c5', 'Same jacket. Same bag. Same kela. Theek hai, tumhari marzi. Main bhi kisi ko nahi bataunga ki tum tum ho.']],
            effects: { nuisance: 2 } },
        ],
      },
    },
  },
  {
    id: 'gill-d1', phase: ['midday'], priority: 2,
    nodes: {
      a: {
        beats: [['c5', 'Yahan se speech sunai nahi deti. Mira didi ka live chal raha hai? Link bhejo. ...Official kaam ke liye.']],
        options: [
          { intent: 'Narrate the speech yourself, badly',
            beats: [['player', '(Mira ki awaaz mein) "Saathiyon! Garmi hai! Par hum...!"'], ['c5', 'Bas, bas. Isse achha main bina sound ke dekh leta.']],
            effects: { nuisance: 2, mood: { c5: 'amused' } } },
          { intent: 'Send him Zoya\'s livestream',
            beats: [['c5', 'Oye, chal gaya! Comment karoon? ...Nahi nahi, fake account se karta hoon.']],
            effects: { aura: 2, flags: ['gill-watching'] } },
        ],
      },
    },
  },
  {
    id: 'gill-d4', phase: ['midday'], priority: 1,
    nodes: {
      a: {
        beats: [['c5', 'Safed SUV aayi hai, upar jhanda. Bikes ka horn. Sab ek saath.'], ['c5', 'Isko beat pe kaato toh hit hai. Horn, cut, jhanda, cut, mera chehra. ...Mera chehra nahi.']],
        options: [
          { intent: 'Offer to film the SUV for him, up close',
            beats: [['c5', 'Paas mat jaana! Unke paas camera wale ko pasand nahi karte. ...Door se zoom karo. 2x. Bas.']],
            effects: { aura: 3, heat: 4, flags: ['gill-suv'] } },
          { intent: 'Tell him that is a political rally, not a beat',
            beats: [['c5', 'Sab kuch beat hai veere. Lathi bhi. Wireless bhi. Bas sunna aana chahiye.']],
            effects: { mood: { c5: 'amused' } } },
        ],
      },
    },
  },
  {
    id: 'gill-d2', phase: ['midday', 'tense'], priority: 5, requires: { did: ['mira-mic'] },
    nodes: {
      a: {
        beats: [['c5', 'Woh neta wala clip dekha! Mic pakda, phir... (hasi) Tum the na peeche?']],
        options: [
          { intent: 'Take full credit',
            beats: [['c5', 'Credits mein naam daalo! Main follow karunga. Nahi nahi, fake account se.']],
            effects: { aura: 4, nuisance: 1 } },
          { intent: 'Say it was all Mira',
            beats: [['c5', 'Mira didi ka bhi fan hoon. Mujhe sab pasand hain. Main kamzor aadmi hoon.']],
            effects: { help: 2 } },
        ],
      },
    },
  },
  {
    id: 'gill-d3', phase: ['midday'], priority: 4, requires: { rep: { aura: 35 } },
    nodes: {
      a: {
        beats: [['c5', 'Suno. Yahan se Parliament ka angle sabse badhiya hai. Police wali side. Koi nahi aata yahan.'], ['c5', 'Do minute. Main ulta dekh raha hoon.']],
        options: [
          { intent: 'Turn the camera on him instead',
            beats: [['c5', 'Mujh pe? Main background hoon. ...Achha. Slow motion mein. Baal theek karne do.']],
            effects: { aura: 6, heat: 5, flags: ['gill-reel'] }, do: ['clip:pester-cute'] },
          { intent: 'Film the crowd from the police side',
            beats: [['c5', 'Wah. Ye shot koi nahi le sakta. Credit mein "a friend" likhna.']],
            effects: { aura: 8, heat: 3, flags: ['gill-angle'] } },
        ],
      },
    },
  },
  {
    id: 'gill-t1', phase: ['tense'], priority: 2,
    nodes: {
      a: {
        beats: [['c5', 'RAF aa gayi. Phone andar. RAF wale reels nahi dekhte. Woh sirf pushup dekhte hain.']],
        options: [
          { intent: 'Slip him a reel under the barricade',
            beats: [['c5', '(jhuk ke dekhta hai) Hahaha. Oye. OYE. RAF wala dekh raha hai. Normal raho. Normal.']],
            effects: { nuisance: 3, mood: { c5: 'amused' } } },
          { intent: 'Ask the RAF jawan if he has Instagram',
            beats: [['raf', 'Hai. Private hai.'], ['c5', 'Kya?! Follow request bhejta hoon. Accept karna bhai, hum ek hi team hain.']],
            effects: { aura: 2, nuisance: 2 } },
        ],
      },
    },
  },
  {
    id: 'gill-t2', phase: ['tense'], priority: 1,
    nodes: {
      a: {
        beats: [['c5', 'Aaj ka mera content plan: "POV: tum Parliament Street pe duty pe ho aur kuch nahi ho raha."'], ['c5', 'Rao sir ko mat batana.']],
        options: [
          { intent: 'Tell him "nothing happens" IS the hook',
            beats: [['c5', 'Wah. Gehri baat. "Kuch nahi ho raha"... aur phir RAF aati hai. TWIST. Oye hoye.']],
            effects: { aura: 3, mood: { c5: 'amused' } } },
          { intent: 'Pitch him a darker idea: "POV: lathi"',
            beats: [['c5', 'Nahi. Woh nahi. Woh content nahi hai, woh kaam hai. Mujhe kaam pasand nahi.']],
            effects: { nuisance: 2 } },
        ],
      },
    },
  },
  {
    id: 'gill-t3', phase: ['tense', 'showdown'], priority: 5, requires: { did: ['cannon-request'] },
    nodes: {
      a: {
        beats: [['c5', 'Token system!! Woh tum the!! Water cannon ka token! Pura police group dekh raha hai.'], ['c5', 'Rao sir ne bhi like kiya. Galti se. Phir unlike kiya. Maine screenshot le liya.']],
        options: [
          { intent: 'Ask him to get you a ride on the cannon truck',
            beats: [['c5', 'Truck pe? ...Driver ko jaanta hoon. Nahi. NAHI. Mera transfer ho jaayega, Yadav jaisa.']],
            effects: { heat: 3, mood: { c5: 'amused' } } },
          { intent: 'Ask him to keep it a secret',
            beats: [['c5', 'Secret? Do lakh views pe secret? Veere.']],
            effects: { help: 1 } },
        ],
      },
    },
  },
  {
    id: 'gill-s1', phase: ['showdown'], priority: 2,
    nodes: {
      a: {
        beats: [['c5', 'Oye, video mat banao! ...Achha theek hai, par landscape mein. Portrait mein lathi kat jaati hai.']],
        options: [
          { intent: 'Film the charge, in landscape',
            beats: [['c5', 'Haan, aise. Stable. Ab bhaago, warna tum bhi frame mein aa jaoge.']],
            effects: { aura: 8, heat: 8 }, do: ['clip:charge'] },
          { intent: 'Put the phone away and help someone up',
            beats: [['c5', 'Shabash. Ye wala main bana leta. ...Nahi. Mazaak. Nahi banaya.']],
            effects: { help: 6 } },
        ],
      },
    },
  },
  {
    id: 'gill-s2', phase: ['showdown'], priority: 1,
    nodes: {
      a: {
        beats: [['c5', 'Mera bhaagte hue video bana? Delete karo. Main bhaag nahi raha tha. Main reposition ho raha tha.']],
        options: [
          { intent: 'Post it with the caption "Reposition"',
            beats: [['c5', 'OYE! ...Kitne views aaye?']],
            effects: { aura: 6, heat: 6, mood: { c5: 'amused' }, flags: ['gill-repositioned'] } },
          { intent: 'Delete it in front of him',
            beats: [['c5', 'Shukriya. Tum asli creator ho. Values wale.']],
            effects: { help: 3, mood: { c5: 'soft' } } },
        ],
      },
    },
  },
  {
    id: 'gill-a1', phase: ['aftermath'], priority: 4, requires: { rep: { aura: 30 } },
    nodes: {
      a: {
        beats: [['c5', 'Follow request bheji hai. Account ka naam "patrolpaaji_07". Accept karo. Koi nahi jaanega.']],
        options: [
          { intent: 'Leave him on "requested"',
            beats: [['c5', 'Requested. Theek hai. Main wait karunga. Police mein wait karna aata hai.']],
            effects: { nuisance: 1 } },
          { intent: 'Accept, and follow back',
            beats: [['c5', 'Follow back! Oye hoye! Ab main bhi creator hoon. Bas chehra nahi dikhaunga.']],
            effects: { aura: 2, mood: { c5: 'soft' }, flags: ['gill-follow'] } },
        ],
      },
    },
  },
  {
    id: 'gill-a2', phase: ['aftermath'], priority: 2,
    nodes: {
      a: {
        beats: [['c5', 'Aaj ka din. Main bas yahi bolunga. Content tha. Dard bhi tha. Par content tha.']],
        options: [
          { intent: 'Tell him to start his own page',
            beats: [['c5', 'Naam? "Duty aur Drama"? ...Mazaak tha. (note karta hai)']],
            effects: { aura: 2 } },
          { intent: 'Agree, and ask him what hurt',
            beats: [['c5', 'Woh ladka jo gir gaya tha. Kisi ne video nahi banaya. Mera mann hua uthaun.'], L('c5', 'Order nahi tha.', 'silence')],
            effects: { help: 2, mood: { c5: 'soft' } } },
        ],
      },
    },
  },
  {
    id: 'gill-a3', phase: ['aftermath'], priority: 1,
    nodes: {
      a: {
        beats: [['c5', 'Final count. Aaj duty pe sattavan reels dekhi. Personal best.']],
        options: [
          { intent: 'Report him to the wireless, as a joke',
            beats: [['player', '(wireless ki taraf) Sir, Gill ne sattavan...'], ['c5', 'OYE! Main tumhari reels bhi gin raha tha!']],
            effects: { nuisance: 3, heat: 2 } },
          { intent: 'Ask him which one was the best',
            beats: [['c5', 'Woh uncle wali. Kele wale. Bus ki khidki se. Main teen baar roya.']],
            effects: { mood: { c5: 'amused' } } },
        ],
      },
    },
  },
];

// ============================================================================================
// Jawan Pandey (r1), RAF, from 14:00
// ============================================================================================
const pandey = [
  {
    id: 'pandey-t1', phase: ['tense'], priority: 2,
    nodes: {
      a: {
        beats: [['r1', 'Peeche raho. Barricade ke us taraf.'], ['player', 'Bhaiya aap Bihar se ho?'], ['r1', '...Muzaffarpur.']],
        options: [
          { intent: 'Do your worst Bhojpuri accent at him',
            beats: [['player', 'Ka ho bhaiya, ka haal ba!'], L('r1', '...Ek baar aur bologe toh van mein.', 'silence')],
            effects: { nuisance: 3 } },
          { intent: 'Ask him to let you through to the barricade',
            beats: [['r1', 'Nahi.'], ['player', 'Please?'], ['r1', 'Nahi. Please ka bhi nahi.']],
            effects: { heat: 3 } },
          { intent: 'Ask him about litchi season', next: 'home' },
        ],
      },
      home: {
        beats: [['r1', 'Season nikal gaya. Teen saal se ghar nahi gaye. Amma video call pe bagan dikhati hain.'], ['r1', 'Chhota bhai Patna mein tha. Woh water cannon wala video. Naachta hua. Woh hamara Chhotu hai.']],
        options: [
          { intent: 'Tell him Chhotu is famous now',
            beats: [L('r1', 'Famous. Amma ne usko chappal se maara. Phir video forward kiya.', 'laugh')],
            effects: { aura: 3, mood: { r1: 'amused' } } },
          { intent: 'Tell him about the gali behind the detention bus',
            requires: { rep: { help: 10 } },
            beats: [['player', 'Bhaiya, bus ke peeche ek gali hai. Agar kabhi... koi...'], L('r1', '(der tak dekhta hai) Hum Muzaffarpur ke hain. Hum gali jaante hain.', 'silence')],
            effects: { help: 3, flags: ['raf-muzaffarpur'] } },
          { intent: 'Promise to send his Amma a reel',
            beats: [['r1', 'Amma ko reel nahi, chitthi pasand hai. ...Par bhej dena.']],
            effects: { help: 2, mood: { r1: 'soft' } } },
        ],
      },
    },
  },
  {
    id: 'pandey-t2', phase: ['tense'], priority: 1,
    nodes: {
      a: {
        beats: [['r1', 'Bhookh lagi hai. Subah sattu piya tha. Yahan sattu nahi milta. Sab "cold coffee" bolte hain.']],
        options: [
          { intent: 'Offer him a cold coffee',
            beats: [['r1', 'Coffee. Thandi. Doodh mein. ...Delhi ajeeb hai.']],
            effects: { nuisance: 1, mood: { r1: 'amused' } } },
          { intent: 'Promise to find him sattu at Asha\'s stall',
            beats: [['r1', 'Milega?'], ['player', 'Asha didi ke paas sab milta hai. Gossip bhi.'], ['r1', 'Milega toh hum tumhe yaad rakhenge.']],
            effects: { help: 2, flags: ['pandey-sattu'] } },
        ],
      },
    },
  },
  {
    id: 'pandey-t3', phase: ['tense', 'showdown'], priority: 6, requires: { did: ['bus-andar'] },
    nodes: {
      a: {
        beats: [['r1', 'Tum. Bus waale.'], ['r1', 'Bahar kaise aaye, hum nahi poochhenge. Garmi thi. Darwaza khula tha. Hum paani lene gaye the.']],
        options: [
          { intent: 'Ask if he will get in trouble for it',
            beats: [L('r1', 'Trouble mein toh teen saal se hain. Ek din aur.', 'silence')],
            effects: { help: 1 } },
          { intent: 'Thank him, quietly',
            beats: [['r1', 'Kis baat ka? Hum paani lene gaye the.']],
            effects: { help: 3, mood: { r1: 'soft' }, flags: ['raf-muzaffarpur'] } },
        ],
      },
    },
  },
  {
    id: 'pandey-t4', phase: ['tense'], priority: 4, requires: { did: ['cannon-request'] },
    nodes: {
      a: {
        beats: [['r1', 'Woh token wala tum the? Water cannon ka?'], ['r1', 'Chhotu ne video bheja. "Bhaiya ye Delhi wale toh hamse bhi aage hain."']],
        options: [
          { intent: 'Ask him whether the cannon is really coming',
            beats: [['r1', 'Hum nahi bata sakte. ...Phone plastic mein rakh lo.']],
            effects: { help: 2 } },
          { intent: 'Ask him to say hi to Chhotu',
            beats: [['r1', 'Bol denge. Woh tumhara fan ho jaayega. Woh sabka fan ho jaata hai.']],
            effects: { aura: 3, mood: { r1: 'amused' } } },
        ],
      },
    },
  },
  {
    id: 'pandey-s1', phase: ['showdown'], priority: 6, requires: { flags: ['raf-muzaffarpur'] },
    nodes: {
      a: {
        beats: [['r1', '(line mein khade khade, dheere se) Baayein. Chai ke peeche. Gali khuli hai.'], ['r1', 'Hum ne kuch nahi bola. Hum line mein hain.']],
        options: [
          { intent: 'Go back for your friends first',
            beats: [['r1', 'Jaldi. Hum zyada der aankh band nahi kar sakte. Hum RAF hain, ullu nahi.']],
            effects: { help: 6, heat: 6 } },
          { intent: 'Take the gali alone, right now',
            beats: [['r1', '(seedha saamne dekhta hai, jaise kuch hua hi nahi)']],
            effects: { heat: -10, help: -2 } },
        ],
      },
    },
  },
  {
    id: 'pandey-s2', phase: ['showdown'], priority: 2,
    nodes: {
      a: {
        beats: [['r1', '(shield ke peeche, saans tez) Hum bhi pehli baar hain. Lathi charge mein.'], ['r1', 'Training mein ped pe karte the.']],
        options: [
          { intent: 'Tell him to aim for the trees, then',
            beats: [['r1', '...(hasi rokta hai) Chup. Line mein hain.']],
            effects: { aura: 3, heat: 2, mood: { r1: 'amused' } } },
          { intent: 'Stand in front of him with your hands up',
            beats: [['r1', 'Hato. Hato na! Hum tumhe nahi maarenge. Peeche waale ka nahi pata.']],
            effects: { help: 4, heat: 6 } },
        ],
      },
    },
  },
  {
    id: 'pandey-s3', phase: ['showdown'], priority: 1,
    nodes: {
      a: {
        beats: [['r1', 'Aansu gas mein aankh mat malo. Paani se dho. Amma yahi bolti thi, mirchi ke liye.']],
        options: [
          { intent: 'Ask him whose side he is on',
            beats: [['r1', 'Duty ke. Duty ka koi side nahi hota.'], L('r1', '...Bas ek gali hoti hai.', 'silence')],
            effects: { nuisance: 1 } },
          { intent: 'Ask him for some of his water',
            beats: [['r1', 'Lo. Aadha. Aadha hamara.']],
            effects: { help: 2, mood: { r1: 'soft' } } },
        ],
      },
    },
  },
  {
    id: 'pandey-a1', phase: ['aftermath'], priority: 2,
    nodes: {
      a: {
        beats: [['r1', '(phone pe) Haan Amma. Theek hain. ...Ek ladka hai yahan. Baat karega?'], ['r1', 'Lo. Amma hain. Kuch achha bolna.']],
        options: [
          { intent: 'Hand the phone back, suddenly shy',
            beats: [['r1', 'Koi baat nahi. Hum bol denge tum shy ho. Amma ko shy log pasand hain.']],
            effects: { nuisance: 1 } },
          { intent: 'Ask Amma about the litchi orchard',
            beats: [['r1', 'Amma bol rahi hain agle saal aao. Sau litchi khilayengi. Tum aur hum.']],
            effects: { aura: 2, flags: ['pandey-litchi'] } },
          { intent: 'Tell Amma her son was kind today',
            beats: [['player', 'Aunty, aapka beta aaj sabse achha tha. Sach mein.'], L('r1', '(phone wapas leta hai) ...Amma ro rahi hain. Tumne kya bol diya.', 'silence')],
            effects: { help: 3, mood: { r1: 'soft' } } },
        ],
      },
    },
  },
  {
    id: 'pandey-a2', phase: ['aftermath'], priority: 1,
    nodes: {
      a: {
        beats: [['r1', 'Truck aa gaya. Hum ja rahe hain. Kal kahin aur duty. Kahan, pata nahi.']],
        options: [
          { intent: 'Salute him, badly',
            beats: [['r1', '(haath theek karta hai) Aise. Haath seedha. ...Ab theek hai.']],
            effects: { aura: 2, mood: { r1: 'amused' } } },
          { intent: 'Give him your number for when he is home',
            beats: [['r1', 'Number? ...Theek hai. Muzaffarpur aaoge toh litchi pakki. Season mein aana.']],
            effects: { help: 2, flags: ['pandey-number'] } },
        ],
      },
    },
  },
];

// ============================================================================================
// Reactions: talking to them right after something happened (within 20 game minutes)
// ============================================================================================
const REACTS = {
  c1: {
    'bus-key': [['c1', 'Bus ki chabi gayi? Achha hai. Bus nahi chalegi toh main kahin nahi bheja jaaunga.']],
    'bus-stalled': [['c1', 'Bus ruk gayi. Main bhi ruka hua hoon. Teen saal se. Hum dono.']],
    'biryani-rush': [['c1', 'Sab biryani ki taraf bhaage. Mujhe kisi ne nahi bulaya. Ye dosti nahi hai.']],
    'speaker-party': [['c1', '(gaane pe halka sa sir hilata hai) ...Main nahi hil raha. Garmi se kaanp raha hoon.']],
    'cannon-spray': [['c1', 'Paani pada? Mujh pe ek boond nahi aayi. Main hamesha galat jagah khada hota hoon.']],
    'cannon-dance': [['c1', 'Log naach rahe hain paani mein. Main bhi naachta. Agar uniform waterproof hoti.']],
    chase: [['c1', 'Koi bhaag raha tha? Main dekh nahi paaya. Main dheere dekhta hoon.']],
    caught: [['c1', 'Pakda gaya? Bechara. Ab form bharna padega. Usse bura kuch nahi.']],
    charge: [['c1', '(haanpte hue) Main gaya tha. Main aaya. Kisi ko nahi chhua. Report mein likh dena.']],
    gas: [['c1', '(khaans ke) Rumaal. Rumaal kahan hai. Transfer wala rumaal.']],
    faint: [['c1', 'Koi gir gaya? Paani do. Mere paas nahi hai, maine pee liya. Galti ho gayi.']],
    'pester-career': [['c1', 'Tum sabse career advice maang rahe ho? Mujhse maango. Main bataunga kya nahi karna.']],
    'pester-cute': [['c1', 'Kisi ko cute bola? Mujhe kisi ne pachchees saal se cute nahi bola. Biwi ne bhi nahi.']],
  },
  c2: {
    'bus-key': [['c2', 'Chabi gayi. Maine kaha tha main dekh rahi hoon. Kisi ne nahi suna. Ab sab dekhenge.']],
    'bus-stalled': [['c2', 'Bus band. Iqbal bhai ka chehra dekha? Main us chehre ka FIR likh sakti hoon.']],
    'biryani-rush': [['c2', 'Teen sau log ek forward pe bhaage. Main ginti kar rahi thi. Ab dobara karni padegi.']],
    'speaker-party': [['c2', 'Gaana achha hai. Ye baat kisi ko mat batana. Main duty pe hoon.']],
    singalong: [['c2', '(dheere se gaati hai, phir ruk jaati hai) Kuch nahi. Kuch nahi suna tumne.']],
    roast: [['c2', 'Woh ladka mic pe Rao sir ki moochh ki baat kar raha tha? ...Mujhe dobara sunna hai.']],
    'provocateur-exposed': [['c2', 'Naye joote wale bhaag gaye. Camera pe aaye, bhaag gaye. Maine kaha tha.']],
    chase: [['c2', 'Kaun bhaag raha tha? Tum? Saans phool rahi hai. Jhooth mat bolna.']],
    caught: [['c2', 'Ek aur bus mein. Bus mein ab jagah nahi. Rawat ji khud bahar baithenge.']],
    charge: [['c2', '(chup, phir) Theek ho? Haan ya na. Ek shabd.']],
    'cannon-scare': [['c2', 'Paani ki goli nahi hoti. Log aise bhaage jaise hoti hai.']],
    'pester-detainme': [['c2', 'Tumne kisi se bola detain karo? Form mein "shauk" ka column nahi hota.']],
    'pester-cute': [['c2', 'Kisko cute bola? Tomar ko? Bahadur ho. Ya bewakoof. Main dono likh deti hoon.']],
  },
  c3: {
    'bus-key': [['c3', 'Chabi gayi?! Tu tha! Shakal se lagta hai! ...Nahi tha? Tab bhi lagta hai.']],
    'biryani-rush': [['c3', 'Biryani ke liye bhaage? Main nahi bhaaga. Main biryani se upar hoon. Veg thi?']],
    'speaker-party': [['c3', 'Gaana band karo! Ye protest hai, shaadi nahi! ...Volume kam karo, poora nahi.']],
    roast: [['c3', 'Woh mic wala ladka. Mera naam liya? Liya na? Bol!']],
    'cannon-dance': [['c3', 'Paani mein naach rahe hain! Sharam nahi aati! ...Mujhe bhi garmi lag rahi hai.']],
    chase: [['c3', '(haanpte hue) Main thaka nahi hoon. Main... strategy bana raha hoon.']],
    caught: [['c3', 'Ek aur gaya. Badhiya. Bus mein aur jagah hai. Hamesha hoti hai.']],
    charge: [['c3', 'Dekha? Aise hota hai. Ab sab seedhe khade hain. Tu bhi.']],
    'stone-thrown': [['c3', 'PATHAR?! Kisne? Tune? ...Achha nahi tune. Par kisi ne toh!']],
    'detainees-escape': [['c3', 'Bus khali kaise ho gayi?! RAWAT! Tu kya forward padh raha tha!']],
    'crew-block': [['c3', 'Itne log tere peeche? Neta ban gaya? Neta ka bhi register hota hai.']],
    'pester-cute': [['c3', 'Kisi ne cute bola Sharma ko. Mujhe kisi ne nahi bola. ...Mujhe chahiye bhi nahi.']],
  },
  c4: {
    'bus-key': [['c4', 'Group mein aaya hai: "Bus ki chabi videshi haathon mein." Main jaanch kar raha hoon.']],
    'bus-stalled': [['c4', 'Bus band? Group mein likha hai engine mein chip lagi hai. 5G wali.']],
    'biryani-rush': [['c4', 'Dekha! Biryani sach thi! Kisi ko mili? Nahi? Phir bhi sach thi.']],
    'speaker-party': [['c4', 'Ye gaana group mein aaya tha. 2011 mein. Abhi bhi hit hai.']],
    'cannon-spray': [['c4', 'Maine kaha tha water cannon aayega! Group pe bharosa karo. 🙏']],
    'cannon-scare': [['c4', 'Log bhaage? Kyunki forward sahi tha. Forward hamesha sahi hota hai, thoda der se.']],
    'minister-noshow': [['c4', 'Minister nahi aaye? Group mein likha tha aayenge. Shayad traffic. Ya video call.']],
    'detainees-escape': [['c4', '(bus ki taraf dekhta hai) Khali? Main bas ek forward padh raha tha. Lamba tha.']],
    caught: [['c4', 'Naya aaya bus mein. Naam? Main group mein daalunga. "Aaj ke naye mehmaan."']],
    charge: [['c4', 'Video aaya hai charge ka. Main isme hoon? Zoom karo. Wahan, peeche.']],
    'stone-thrown': [['c4', 'Pathar! Group mein likha tha teen baje pathar chalega. Group ko kaise pata tha?']],
    'pester-cannon': [['c4', 'Tum cannon ka pooch rahe the? Group mein token number bhi aa gaya hai. 47.']],
  },
  c5: {
    'cannon-dance': [['c5', 'OYE HOYE! Paani mein dance! Kisi ne landscape mein banaya? Bolo kisi ne banaya!']],
    'cannon-spray': [['c5', 'Spray ka slow-mo dekha? Mere phone pe nahi hai. Mera phone jeb mein tha. Kyun tha!']],
    'speaker-party': [['c5', 'Ye audio trending hai! Isko kisi ne Parliament Street se shoot kiya? Main hi kar leta.']],
    singalong: [['c5', 'Gaana! Pura crowd! Chalo, ek take, bina chehre ke. Please.']],
    roast: [['c5', 'Mic pe comedy! Kaun tha? Uska handle kya hai? Official kaam ke liye.']],
    'provocateur-exposed': [['c5', 'Woh joote wale camera se bhaage! Ye toh reel ka climax hai, veere.']],
    chase: [['c5', 'Chase! Tumhe pata hai chase reels ka retention kitna hota hai?']],
    charge: [['c5', '(chup) ...Ye wali reel nahi banegi. Ye wali nahi.']],
    'detainees-escape': [['c5', 'Bus se sab nikal gaye?! Kisi ne window ka angle liya? Woh viral jaayega.']],
    'bus-key': [['c5', 'Chabi wali reel! Main ne teen baar dekhi. Duty pe. Mat batana.']],
    'pester-cute': [['c5', 'Kisi ko "uncle aap cute ho" bola? Original audio kiska hai? Main use karunga.']],
    'pester-career': [['c5', 'Career advice? Mere se lo: content. Consistency. Aur Rao sir se door raho.']],
  },
  r1: {
    'cannon-spray': [['r1', 'Paani. Chhotu yaad aa gaya. Woh bhi aise hi naacha tha.']],
    'cannon-dance': [['r1', '(muskuraata hai, phir chehra seedha) Line mein raho. ...Achha naach rahe the.']],
    'cannon-scare': [['r1', 'Itna bhaagne ki zaroorat nahi. Paani hai. Muzaffarpur mein baarish isse tez hoti hai.']],
    chase: [['r1', 'Bhaag rahe the? Dhoop mein mat bhaago. Gir jaoge.']],
    caught: [['r1', 'Pakad liya? Bus mein paani hai. Hum dekh lenge.']],
    charge: [['r1', '(saans tez) Hum theek hain. Tum? Bas itna batao.']],
    gas: [['r1', 'Aankh mat malo. Paani se dho. Amma ka nuskha.']],
    'stone-thrown': [['r1', 'Pathar kisne phenka, hum ne dekha. Naye joote the. Tum log ke nahi the.']],
    'detainees-escape': [['r1', 'Bus khali? Hum paani lene gaye the. Hamesha paani lene jaate hain.']],
    faint: [['r1', 'Behosh? Chhaon mein lao. Pair upar. Hum ne training mein seekha tha, pehli baar kaam aaya.']],
    singalong: [['r1', 'Ye gaana Amma bhi gaati hain. Thoda alag shabd mein.']],
    'provocateur-exposed': [['r1', 'Woh teen gaye? Achha hua. Unke joote hamare jooton se naye the.']],
  },
};

// ============================================================================================
// Brush-offs: when they have nothing new for you. Short, in voice, never the same twice in a row.
// ============================================================================================
const BRUSHOFF = {
  c1: [
    '(jamhaai) Hmm.', 'Chai laaye? Nahi? Phir baad mein.', 'Main soch raha hoon. Rewari ke baare mein.',
    'Mujhe kya. Tum jo karo. Bas mere saamne mat karna.', 'Paanch minute baad aana. Main paanch minute so raha hoon.',
    'Application number 4471. Yaad rakhna. Kabhi kaam aayega.', 'Samosa wala idhar aaye toh batana.',
    'Haan haan. Theek hai. Jo bhi hai, theek hai.', 'Itni dhoop mein baat nahi hoti. Chhaon mein aana.',
  ],
  c2: [
    'Agla.', 'Jhooth. Mat bolo. Bina bole bhi jhooth lag raha hai.', 'Haan, sun rahi hoon. Nahi, interested nahi hoon.',
    'Main ginti kar rahi hoon. Tum ek ho. Hat jao, do mat bano.', 'Kaam ki baat ho toh bolo. Warna "Jai Hind".',
    'Hasaa ke dikhao. Nahi? Toh jao.', 'Diary mein tumhara page bhar gaya hai.', 'Phir se? Wahi chehra, wahi bahana.',
    'Duty pe hoon. Ye wala chehra duty wala hai.',
  ],
  c3: [
    'Oye. Chal. Nikal.', 'Kya hai hero? Phir aa gaya?', 'Ek aur baar aaya toh ID.',
    'Dekh kya raha hai? Chal.', 'Section Tomar. Yaad hai na?', 'Tera chehra diary mein hai. Do baar.',
    'Main busy hoon. Gussa karne mein.', 'Seedha chal. Swag mein nahi.', 'Mujhse baat karega? Mujhse? Himmat hai.',
  ],
  c4: [
    'Ruko beta, ek forward aa raha hai. Lamba hai.', 'Good afternoon! 🌹 Ye bhi forward hai.',
    'Network nahi hai. Group nahi khul raha. Main bechain hoon.', 'Tumne woh NASA wala dekha? Dekho.',
    'Baad mein aana, abhi chauntees groups padhne hain.', 'Ye padho. Nahi, poora padho. Aakhir tak.',
    'Main abhi "Suprabhat" ka reply kar raha hoon. Shaam ko.', 'Sab sach hai beta. Kuch zyada sach hai.',
    'Forward as received. Tum bhi received ho. Jao.',
  ],
  c5: [
    'Shh. Phone andar hai. Main normal hoon.', 'Oye, abhi nahi. RAF dekh rahi hai.', 'Baad mein aana, ek reel buffer ho rahi hai.',
    'Kuch naya shoot kiya? Nahi? Phir kya karne aaye.', 'Main duty pe hoon. Bilkul. Poori tarah.',
    'Ek trending audio batao, phir baat karenge.', 'Veere, abhi strict waala mode hai. Baad mein.',
    'Landscape ya portrait? Soch ke aana.', 'Oye hoye. Nahi. Matlab, nahi. Jao.',
  ],
  r1: [
    'Peeche.', 'Line mein raho.', 'Nahi.', 'Baad mein. Abhi duty hai.', 'Hum baat nahi kar sakte. Line mein hain.',
    'Dhoop mein mat khade raho.', 'Paani piyo. Phir aana.', 'Hum yahan nahi hain. Hum Muzaffarpur mein hain. Mann se.',
    'Amma ka call aane wala hai. Jao.',
  ],
};

// ============================================================================================
// Pester verbs, per officer. say: what YOU say. Lists by the officer's mood after the pester
// (bored → amused → soft; three in ten minutes and they're annoyed). See pester() in rules.js.
// ============================================================================================
const PESTER_BY = {
  sharma: {
    say: {
      career: 'Sharma ji, career advice chahiye. UPSC ya police?',
      cute: 'Sharma ji... aap na, cute ho.',
      cannon: 'Sharma ji, water cannon kab aayega? Garmi hai.',
      detainme: 'Sharma ji, mujhe detain kar lo. Please.',
    },
    career: {
      bored: ['Career? Advice? Mujhse?', 'UPSC ya police? Dono mein line hai. Tum line mein ho?', 'Advice chahiye? Ghar jao. Ye advice hai.'],
      amused: ['Career advice? Haan? Pehle naam bolo. Phir career.', 'UPSC? UPSC. Main bhi bola tha. Ab yahan hoon.', 'Police? Police mein aaoge? Barricade pakdoge? Roz?'],
      soft: ['Career? Padh lo. Bas padh lo. Hum nahi padhe.', 'SSC ka form? Bhar do. Main bhi bharta hoon. Har saal.', 'Achha career? Wahi jahan dhoop na ho. Samjhe? Dhoop na ho.'],
    },
    cute: {
      bored: ['Cute? Main? Duty pe?', 'Cute. Haan. Aage badho.', 'Kya bola? Cute? Phir se mat bolna.'],
      amused: ['Cute? Cute bola? (moochh pe haath) ...Kaun bolta hai aise.', 'Uncle bola? Uncle? Main uncle hoon?', 'Cute. Hmm. Biwi ko batana padega? Nahi. Mat batana.'],
      soft: ['Cute? ...Theek hai. Paani piyo.', 'Cute bola? Achha. Ab barricade se door. Cute log door rehte hain.', 'Haan haan. Cute. Tum bhi. Ghar jao.'],
    },
    cannon: {
      bored: ['Water cannon? Kab? Pata nahi.', 'Cannon? Garmi hai? Chhaon mein jao.', 'Cannon mangwaaun? Tumhare liye? Haan?'],
      amused: ['Water cannon? Token system? Token? Haan?', 'Nahane ke liye? Cannon? Ghar mein nal nahi hai?', 'Cannon. Haan. Rao sir se poochhun? Tumhare naam se?'],
      soft: ['Cannon? Paanch baje ke baad. Shayad. Maine kuch nahi bola.', 'Paani chahiye? Lo. Meri bottle. Cannon nahi.', 'Cannon aaye toh peeche rehna. Samjhe? Peeche.'],
    },
    detainme: {
      bored: ['Detain? Tumhe? Kyun?', 'Detain kar loon? Bus full hai.', 'Kis baat pe? Bolo. Kis baat pe?'],
      amused: ['Detain kar lo? Please bola? Please?', 'Shauk hai? Shauk se detain? Form mein shauk nahi hota.', 'Andar dost hain? Haan? Dost? Sab ke dost andar hain.'],
      soft: ['Detain? Nahi. Ghar jao. Mummy?', 'Pagal ho? ...Chai piyo. Phir socho.', 'Detain nahi karunga. Tum achhe bachche ho. Thode.'],
    },
    annoyed: ['Bas. Naam? Naam bolo.', 'Ek aur baar? Ek aur baar bola toh bus.', 'Hato. Haan, tum. Hato.'],
  },
  c1: {
    say: {
      career: 'Yadav ji, career advice do na. Aapka transfer kab hai?',
      cute: 'Yadav ji, aap sote hue bahut cute lagte ho.',
      cannon: 'Yadav ji, cannon aayega toh aap bhi nahaoge?',
      detainme: 'Yadav ji, mujhe detain kar lo. Aapka bhi time pass hoga.',
    },
    career: {
      bored: ['(jamhaai) Career... kal batata hoon.', 'Kuch bhi karo. Bas transfer ka form mat bharna.', 'Career? Chai ki dukaan kholo. Main roz aaunga.'],
      amused: ['Transfer? Teen saal. Number 4471. Tum yaad rakho, main bhool gaya.', 'Career advice: subah chaar baje ki duty mat lena.', 'SSC do. Phir tum bhi yahan khade hoge. Mujhe company milegi.'],
      soft: ['Padh lo beta. Padhne waale baith ke kaam karte hain. Main khada hoon.', 'Kuch bhi bano. Bas ghar ke paas rehna. Ghar ke paas.', 'Mera beta tumhari umar ka hai. Usko bhi yahi bolta hoon. Woh bhi nahi sunta.'],
    },
    cute: {
      bored: ['Hmm? Kya? Main so nahi raha tha.', 'Cute? Chai laaoge?', 'Haan haan. Jo bhi.'],
      amused: ['Sote hue? Main so nahi raha tha. Main aankh band karke dekh raha tha.', 'Cute bola? Chai laao, aur bolo.', 'Biwi bhi yahi kehti thi. Shaadi se pehle.'],
      soft: ['(muskuraata hai) Jao. Ek samosa kha lo meri taraf se. Paise nahi hain, par meri taraf se.', 'Tum log na. Theek hai. Aaj sab chalta hai.', 'Cute. Hmm. Rewari mein bhi koi aisa bolta.'],
    },
    cannon: {
      bored: ['Cannon? Mujhe toh kisi ne nahi bataya. Mujhe kuch nahi batate.', 'Paani? Peene ko hai?', 'Cannon aayega toh main chhaon mein chala jaaunga.'],
      amused: ['Nahaunga? Haan, agar thanda paani ho. Garam nahi.', 'Cannon mein chai bhar do, main line mein lagta hoon.', 'Wireless pe kuch bola tha. Main so raha tha.'],
      soft: ['Aayega toh mere peeche khade hona. Main mota hoon, paani mujhe lagega.', 'Paanch baje ke baad. Sab paanch baje ke baad.', 'Bottle lo. Meri hai. Cannon se achhi hai.'],
    },
    detainme: {
      bored: ['Detain? Paperwork kaun karega? Main nahi.', 'Bus mein jagah nahi. Mere paas pen nahi.', 'Kal aana. Aaj thak gaya hoon.'],
      amused: ['Time pass? Mera time khud pass ho raha hai. Teen saal se.', 'Detain kar lunga toh likhna padega. Pen nahi hai. Bach gaye.', 'Bus mein chai milti hai? Pata karo, phir dono chalte hain.'],
      soft: ['Nahi beta. Ghar jao. Mummy ko chai banao.', 'Detain nahi. Chai. Chai pe chalte hain.', 'Main kisi ko detain nahi karta. Isliye mera transfer nahi hota.'],
    },
    annoyed: ['Bas. Neend kharab kar di. Naam bolo.', 'Abhi bhi yahin? Main Tomar ko bula raha hoon.', 'Ek aur baar aur main sach mein jaag jaaunga.'],
  },
  c2: {
    say: {
      career: 'Madam, career advice? Aapko dekh ke lagta hai aapne sahi decision liya.',
      cute: 'Madam, aap gussa hoke bhi cute lagti ho.',
      cannon: 'Madam, water cannon ka schedule kya hai? Token milega?',
      detainme: 'Madam, mujhe detain kar lo. Main co-operate karunga.',
    },
    career: {
      bored: ['Flattery. Agla.', 'Sahi decision? Tumhe kya pata. Jao.', 'Career advice ki fees hai. Tum afford nahi kar sakte.'],
      amused: ['Sahi decision? Aath saal, ek promotion. Tum ganit karo.', 'Advice: jhooth bolna seekho. Abhi bahut bura bolte ho.', 'Mujhse puchho toh vakil bano. Tum bahut behes karte ho.'],
      soft: ['Padhai. Phir koi bhi naukri. Bas kisi ke saamne jhukna mat.', 'Ladkiyon ko bolna: police mein aao. Hum kam hain, kaam zyada.', 'Mera exam teesri baar mein nikla tha. Tum bhi nikaaloge. Jao.'],
    },
    cute: {
      bored: ['Note kiya. Bekaar.', 'Duty pe "cute" ka column nahi hai.', 'Haan. Aur?'],
      amused: ['(hothon ko dabaati hai) ...Duty pe hoon.', 'Gussa hoke? Main gussa nahi hoon. Abhi tak.', 'Bahut bekaar line hai. Isliye thodi achhi hai.'],
      soft: ['(muskaan chhupaati hai) Jao. Paani piyo. Dhoop mein lal ho gaye ho.', 'Theek hai. Ek baar hasi. Kisi ko mat batana.', 'Tum na... Ghar pe mummy ko bhi aise patate ho?'],
    },
    cannon: {
      bored: ['Schedule classified hai. Tum bhi.', 'Token? Main token nahi deti. Challan deti hoon.', 'Cannon ka pata nahi. Tumhara pata hai. Diary mein.'],
      amused: ['Token. Number 47. Tumhare aage chhiyalis log hain.', 'Cannon ko "bandobast" bolte hain. Tum "token" bol rahe ho. Achha hai.', 'Schedule: jab tum sabse kam expect karoge.'],
      soft: ['Paanch baje ke baad yahan mat rehna. Bas.', 'Phone plastic mein rakh lo. Main kuch nahi bol rahi.', 'Agar aaye toh barricade se door. Paani tez hota hai.'],
    },
    detainme: {
      bored: ['Co-operate? Detain hona co-operation nahi hai.', 'Reason?', 'Line mein lago. Line lambi hai.'],
      amused: ['Co-operate karoge? Pehli baar koi bola. Likh leti hoon.', 'Bus full hai. Tumhare liye roof pe jagah hai.', 'Andar dost hain? Haan, sabke hote hain. Agla.'],
      soft: ['Nahi. Tum jao. Ghar. Ye order hai.', 'Detain nahi. Ek salah: Metro abhi khali hai.', 'Main tumhe detain karungi toh tumhari mummy mujhe karegi.'],
    },
    annoyed: ['Bas. Naam, pita ka naam, mohalla. Abhi.', 'Ab mazaak nahi. Diary khul gayi hai.', 'Teesri baar. Main ginti rakhti hoon.'],
  },
  c3: {
    say: {
      career: 'Tomar sir, career advice? Aap jaisa rauab kaise aata hai?',
      cute: 'Tomar sir, aapki moochh na... cute hai.',
      cannon: 'Tomar sir, water cannon aayega toh aap bhi bhaagoge?',
      detainme: 'Tomar sir, detain kar lo. Aapka mood theek ho jaayega.',
    },
    career: {
      bored: ['Career? Pehle ID. Phir career.', 'Rauab aata hai, sikhaya nahi jaata. Chal.', 'Mere jaisa banna hai? Pehle mere jaisa chilla ke dikha.'],
      amused: ['Rauab? (seena phulaata hai) Sarson ka tel aur subah ki daud. Chal ab.', 'Career: police. Kyunki police se koi sawaal nahi karta. Tu kar raha hai. Galat.', 'Akhaada jaa. Phir aana. Phir baat.'],
      soft: ['Padh le. Main nahi padha. Isliye chillata hoon.', 'Mera bhatija bhi aisa hi hai. Bolta bahut hai. Achha hai.', 'Kuch bhi ban. Bas mere jaisa mat banna. ...Ye mat likhna.'],
    },
    cute: {
      bored: ['KYA BOLA?', 'Cute? Tomar? ID nikaal.', 'Moochh ko haath mat lagana.'],
      amused: ['Cute? Ye moochh dus saal ki mehnat hai. Cute nahi, "rauab".', 'Kisi ne sun liya toh main tujhe... chhod. Kisi ne nahi suna?', '(moochh pe taav) Haan. Pata hai.'],
      soft: ['...Biwi ko bhi pasand hai. Ab ja.', 'Theek hai. Aaj chhod raha hoon. Moochh ki wajah se.', 'Tu ajeeb hai. Ja, paani pi.'],
    },
    cannon: {
      bored: ['Main bhaagunga? MAIN? Tomar bhaagta nahi.', 'Cannon mere order pe chalta hai. Jhooth. Par chalta hai.', 'Cannon tere liye aayega. Bas tere liye.'],
      amused: ['Bhaagunga nahi. Reposition karunga. Gill ne sikhaya.', 'Paani se nahi darta. Lauki se darta hoon.', 'Cannon aaye toh sabse aage main. Paani mein bhi rauab.'],
      soft: ['Cannon aaye toh tu peeche reh. Haan, tu.', 'Paani tez hota hai. Bachche gir jaate hain. Door reh.', 'Mujhe bhi garmi lag rahi hai. Kisi ko mat batana.'],
    },
    detainme: {
      bored: ['Chal phir. ...Ruk. Tu khud bol raha hai? Ye trick hai.', 'Mera mood tujhe detain karke theek hoga? Shayad. Ruk.', 'Bus ki taraf chal. ...Abhi nahi. Baad mein. Jab mera mann ho.'],
      amused: ['Mood theek? (sochta hai) ...Haan, ho jaayega. Par nahi. Tu chahta hai isliye nahi.', 'Khud aa raha hai? Is mein mazaa nahi. Bhaag, phir pakdunga.', 'Detain karunga toh tu reel banayega. Mujhe pata hai.'],
      soft: ['Nahi. Aaj nahi. Aaj mood achha hai. Ek ghante ke liye.', 'Ghar ja. Teri maa ne lauki banayi hogi. Kha le.', 'Detain nahi. Tu theek hai. Thoda.'],
    },
    annoyed: ['BAS! Chal van mein!', 'Ab bhaag ke dikha. Haan. Bhaag.', 'Naam likh raha hoon. Bade akshar mein.'],
  },
  c4: {
    say: {
      career: 'Rawat uncle, career advice? Group mein kuch aaya hai?',
      cute: 'Rawat uncle, aapki "Good morning" images cute hoti hain.',
      cannon: 'Rawat uncle, group mein water cannon ka koi update?',
      detainme: 'Rawat uncle, mujhe bus mein le lo. Group mein photo daal dena.',
    },
    career: {
      bored: ['Career? Ruko, forward dhoondhta hoon. "Top 10 careers 2026".', 'Group mein likha hai AI sab naukri kha jaayega. Phir kya karoge?', 'Career? Mere saale ka beta ISRO canteen mein hai. Wahi karo.'],
      amused: ['Aaya hai! "Jo bachche protest karte hain unka future bright hota hai." 🙏 Forward as received.', 'Group kehta hai: sarkari naukri. Pension. Aur subah "Suprabhat".', 'Career ka forward hai, par usme bas ek sher dance kar raha hai.'],
      soft: ['Asli baat? Padhai karo. Ye kisi group mein nahi aata, main bata raha hoon.', 'Mera beta Canada gaya. Har subah forward bhejta hoon. Woh "ok" likhta hai. Tum bhi kuch bano.', 'Jo man kare karo. Bas forward check kar lena. Mujhse seekho, ulta.'],
    },
    cute: {
      bored: ['Cute? Ye gulab hai. Gulab cute nahi, pavitra hota hai.', 'Images? Tumhe chahiye? Bhejta hoon. Paanch sau.', 'Haan, sab pasand karte hain. Koi reply nahi karta.'],
      amused: ['Tumhe pasand aayi? Kal se tumhe bhi bhejunga. Subah paanch baje.', 'Main ek ek image dhoondhta hoon. Mehnat lagti hai.', 'Cute bola! Group mein daalta hoon: "Bachche ne cute bola."'],
      soft: ['(sharmaata hai) Koi pehli baar bola. Biwi delete kar deti hai.', 'Achha laga. Ek special waala bhejta hoon. Do diye aur ek tota.', 'Tum sanskari ho. Is zamaane mein.'],
    },
    cannon: {
      bored: ['Update? Ruko, data pack khatam hai.', 'Group kehta hai aa raha hai. Wireless kehta hai pata nahi. Main beech mein hoon.', 'Cannon ka forward kal aaya tha. Shayad kal ka cannon tha.'],
      amused: ['Aaya hai! "Cannon mein Ganga jal." 100% sach. Forward karo.', 'Token number bhi aaya hai. 47. Tum 47 ho?', 'Ek video hai cannon ka. Haan, Brazil ka hai. Par cannon toh cannon hai.'],
      soft: ['Asli baat: Rao sir ne gaadi mangwayi hai. Group mein nahi, mujhe pata hai.', 'Phone plastic mein rakhna. Ye forward nahi, salah hai.', 'Agar aaye toh bus ke peeche aa jaana. Main hoon wahan.'],
    },
    detainme: {
      bored: ['Bus mein? Photo? Achha idea hai. Par bus full hai.', 'Group mein naam daalunga toh poora mohalla dekhega.', 'Tumhe detain karun? Group se poochhna padega. Poll daalta hoon.'],
      amused: ['Photo daalunga: "Aaj ke naye mehmaan." 🌹 Chalo?', 'Bus mein kele wale uncle hain. Unse forward ka gyaan lo.', 'Poll result: teen haan, ek "Jai Hind", baarah "Good night".'],
      soft: ['Nahi beta. Ghar jao. Main group mein likh dunga tum surakshit ho.', 'Bus mein garmi hai. Tum bahar hi achhe ho.', 'Detain nahi. Ek forward lo: "Mummy ko phone karo."'],
    },
    annoyed: ['Bas! Ab tumhara naam group mein jaayega. Sab groups mein.', 'Tumhari photo le raha hoon. Caption baad mein.', 'Main abhi Tomar ko forward karta hoon tumhe.'],
  },
  c5: {
    say: {
      career: 'Gill paaji, career advice? Creator banu ya police?',
      cute: 'Gill paaji, aap camera pe bahut cute lagoge.',
      cannon: 'Gill paaji, water cannon aaye toh reel banaoge?',
      detainme: 'Gill paaji, mujhe detain kar lo. Aap shoot karna.',
    },
    career: {
      bored: ['Creator. Pucca. Police mein reel nahi bana sakte. Main jaanta hoon.', 'Career? Shh. Wireless sun raha hai.', 'Dono karo. Main kar raha hoon. Chupke se.'],
      amused: ['Creator! Hook, transition, consistency. Aur Rao sir se door.', 'Police bano toh mera page sambhalna. Main retire ho jaaunga.', 'Niche dhoondho. Mera niche hai "uniform mein emotions".'],
      soft: ['Sach bataun? Jo bhi bano, apna chehra mat bechna. Bas.', 'Mere papa bole the police. Maine suna. Tum apni suno.', 'Creator bano. Aur ek din mera bhi naam lena. "Gill paaji ne bola tha."'],
    },
    cute: {
      bored: ['Camera pe? Nahi nahi. Main background hoon.', 'Oye. Dheere. Log sun lenge.', 'Cute? Main strict hoon. Strict.'],
      amused: ['Oye hoye! Sach mein? Kaun si side se? Left wali?', 'Cute? Theek hai, ek photo. Sirf moochh.', '(baal theek karta hai) Kya kaha? Phir se. Record kar raha hoon.'],
      soft: ['Veere, tune din bana diya. Chal ek selfie, chehra adha.', 'Aise mat bolo, main sach maan lunga.', 'Shukriya. Mummy ko bhejta hoon ye audio.'],
    },
    cannon: {
      bored: ['Duty pe reel nahi banti. Officially.', 'Cannon? Shh. Mera phone jeb mein hai.', 'Banana chahta hoon. Bana nahi sakta. Dukh hai.'],
      amused: ['Slow-mo mein! Paani, dhoop, aur ek chhota rainbow. Oye.', 'Reel nahi, cinema banaunga. Landscape.', 'Audio pehle se socha hai. Baarish wala gaana.'],
      soft: ['Banaunga nahi. Bas dekhunga. Tum bana lena, mujhe bhej dena.', 'Paani tez hai, phone bachaana. Content baad mein.', 'Tum bana lo. Main frame mein nahi aaunga. Promise.'],
    },
    detainme: {
      bored: ['Shoot karun? Detain karte hue? Mera career khatam.', 'Nahi veere. Ye content nahi, case hai.', 'Detain nahi karta main. Main bas reels dekhta hoon.'],
      amused: ['"POV: tum khud detain hone gaye." Hahaha. Nahi.', 'Script achhi hai. Par main actor nahi, cameraman hoon.', 'Bus ki khidki ka angle achha hai. Nahi! Main kuch nahi bola.'],
      soft: ['Ghar jao veere. Tumhari agli reel ka wait hai mujhe.', 'Nahi. Tum bahar rahoge toh content milega.', 'Detain nahi. Follow kar lunga. Fake account se.'],
    },
    annoyed: ['Bas veere. Ab strict mode. Sach mein.', 'Unfollow. Haan, abhi. Fake account se bhi.', 'Ab tumhari reel report karunga. Galti se nahi.'],
  },
  raf: {
    say: {
      career: 'Bhaiya, RAF mein kaise aate hain? Career advice?',
      cute: 'Bhaiya, helmet mein aap cute lagte ho.',
      cannon: 'Bhaiya, water cannon kab chalega? Line kahan hai?',
      detainme: 'Bhaiya, mujhe detain kar lo. Aapki line seedhi ho jaayegi.',
    },
    career: {
      bored: ['Career nahi, duty.', 'Hato. Line hai.', 'Sawaal baad mein. Duty ke baad.'],
      amused: ['Daud. Roz das kilometre. Phir pooch lena.', 'RAF mein khaana time pe milta hai. Bas.', 'Training mein ped pe lathi chalate the. Ped ne kabhi career nahi poocha.'],
      soft: ['Padh lo. Hum nahi padh paaye. Ghar pe zaroorat thi.', 'Kuch bhi bano. Bas ghar jaate rehna. Hum teen saal se nahi gaye.', 'Achha sawaal hai. Kisi ne nahi poocha tha.'],
    },
    cute: {
      bored: ['Helmet. Line. Peeche.', '(kuch nahi bolta)', 'Shor nahi.'],
      amused: ['(helmet ke andar halki hasi) Chup.', 'Helmet mein garmi hai. Cute nahi.', 'Amma bhi yahi kehti hain. Bina helmet ke.'],
      soft: ['Jao. Chhaon mein khade raho.', 'Theek hai. Ek baar suna. Ab jao.', '(chhoti si muskaan) Jao.'],
    },
    cannon: {
      bored: ['Order aayega toh chalega.', 'Pata nahi.', 'Barricade se door.'],
      amused: ['Line? Paani ki line nahi hoti.', 'Token nahi milta. Paani milta hai.', 'Cannon ko hum bhi pehli baar dekh rahe hain.'],
      soft: ['Phone plastic mein rakh lo.', 'Aaye toh peeche hona. Tez hota hai.', 'Paani pi lo abhi. Cannon wala peene ka nahi.'],
    },
    detainme: {
      bored: ['Order nahi hai.', 'Na.', 'Aage chalo.'],
      amused: ['Line seedhi hai. Tum tedhe ho.', 'Bus full hai. Kal aana.', 'Khud bol rahe ho? Delhi ajeeb hai.'],
      soft: ['Ghar jao. Amma wait kar rahi hongi.', 'Nahi. Tum bahar theek ho.', 'Detain nahi. Paani pi lo.'],
    },
    annoyed: ['Bas. Peeche.', 'Ek aur baar, aur van.', 'Line mein. Abhi.'],
  },
};

export default {
  TALKS: { c1: yadav, c2: meena, c3: tomar, c4: rawat, c5: gill, r1: pandey },
  REACTS,
  BRUSHOFF,
  PESTER_BY,
};
