// naye-joote: the RUP fixer at the white SUV, with cash, new shoes and (for Nikhil) a phone charger.
// rules.js drops the provocateurs at 14:30 and has a stone thrown at 15:30 unless something stops it;
// this situation is the story wrapped round that: overhear "saade teen baje pathar", then expose, report,
// join, or just get Nikhil away before he sells the revolution for a Type-C cable.
// Format: plans/story-rebuild.md. Engine: dist/loop/story.js.
export default {
  'naye-joote': {
    title: 'Naye joote',
    act: 3,
    window: { from: '14:30', until: '15:30' },
    place: 'suv',
    cast: ['nikhil'],
    hook: {
      chat: [
        ['nikhil', 'Update: safed gaadi wale bhaiya FREE charger de rahe hain. Type-C. Main ja raha hoon'],
        ['meera', 'NIKHIL. safed gaadi. RUP wali. NAHI'],
        ['nikhil', 'Update: joote bhi de rahe hain. Mera size poocha. Kisi ne aaj tak mera size nahi poocha'],
      ],
      overheard: [
        ['fixer', 'Naye joote, naya josh! Line mein aao, size batao. Paanch sau upar se.'],
        ['crowd', 'Bhai ye Bata ka dabba hai par andar Paragon hai.'],
      ],
      card: 'A man at the white SUV is handing out cash, shoes, and chargers',
    },
    // Nobody pulls Nikhil away: he takes the charger, stands with the fixer's boys, and when Tomar sweeps
    // the SUV at quarter past three the boys melt away and the kid with 3% battery is the one on the bus.
    auto: {
      at: '15:15',
      beats: [
        ['c3', 'Ye SUV wale saare! Chalo, bus mein! Haan tu bhi, charger wale!'],
        ['nikhil', 'Sir main toh sirf charge kar raha tha! Sir 9% hua hai abhi!'],
        ['fixer', '(SUV ka shisha upar) Chalo chalo, gaadi nikaalo.'],
      ],
      do: ['detain:nikhil', 'flag:nikhil-on-bus', 'flag:fixer-walked', 'intensity:+8', 'crowd:stage:+4'],
      end: 'fail',
    },
    start: 'suv',
    nodes: {
      suv: {
        camera: 'wide',
        beats: [
          { who: 'fixer', line: 'Size? Aath? Nau? Bolo bolo, stock limited hai, gaadi mein aur bhi party hai.' },
          { who: 'nikhil', line: 'Bhai inke paas charger hai. Type-C. Mera teen percent hai. TEEN.' },
          { who: 'fixer', line: 'Charger bhi milega, chhote. Bas teen baje thoda shor. Naara, haath upar. Bas.' },
          { who: 'nikhil', line: 'Naara toh main free mein bhi laga deta.', react: 'laugh' },
          { who: 'fixer', line: 'Free mein laga, paise mein laga, naara naara hota hai. Size bolo.' },
        ],
        idle: [
          ['fixer', 'Ek dabba, ek note, ek naara. Simple scheme hai.'],
          ['nikhil', 'Bhai charger ka wire kitna lamba hai dekh. Ghar tak pahunch jaaye.'],
          ['crowd', 'Mere ko do de do, ek bhai ke liye.'],
        ],
        options: [
          {
            intent: 'Ask the fixer if the charger comes with a receipt',
            beats: [
              { who: 'player', line: 'Bhaiya charger ke saath bill milega? Warranty?' },
              { who: 'fixer', line: 'Bill? Beta ye sarkar nahi hai. Yahan sab cash mein hota hai.', react: 'silence' },
              { who: 'fixer', line: 'Ruk. Phone aa raha hai. (mudke) Haan sir. Haan. Sun raha hoon.' },
            ],
            effects: { aura: 3 },
            next: 'overhear',
          },
          {
            intent: 'Drag Nikhil away from the SUV by his kurta',
            beats: [
              { who: 'player', line: 'Chal. Abhi. Kurta pakda hai maine, bhaagna mat.' },
              { who: 'nikhil', line: 'Bhai charger! Wire! Wire mere haath mein tha!' },
              { who: 'fixer', line: 'Arre le jao, le jao. Aise bachche toh dus aur milenge.' },
            ],
            effects: { help: 4, mood: { nikhil: 'sulking' } },
            do: ['follow:nikhil'],
            next: 'pull',
          },
          {
            intent: 'Take a pair of shoes and the note for yourself',
            beats: [
              { who: 'player', line: 'Nau number. Aur ek note. Nikhil ke liye bhi ek.' },
              { who: 'fixer', line: 'Ye hui na baat. (note haath mein) Teen baje line ke paas. Jab main seeti maarun.' },
              { who: 'nikhil', line: 'Bhai tu bhi? Matlab ab hum... RUP ke hain?', react: 'silence' },
            ],
            effects: { nuisance: 10, heat: 6, aura: -4, flags: ['took-joote'] },
            do: ['intensity:+10', 'target:player'],
            next: 'joined',
          },
          {
            intent: 'Hide behind the SUV and listen to his phone call',
            beats: [
              { who: 'player', line: '(dheere) Nikhil. Chup. Gaadi ke peeche aa.' },
              { who: 'nikhil', line: '(dheere) Update: main gaadi ke peeche hoon.' },
              { who: 'player', line: 'Mere saath hai tu, mujhe update mat de.' },
            ],
            do: ['follow:nikhil'],
            next: 'listen',
          },
        ],
      },
      // A physical stage: stay behind the SUV with Nikhil until his phone rings.
      listen: {
        beats: [{ who: 'fixer', line: '(phone baj raha hai) Haan sir, ek minute, bheed hai, side mein aata hoon.' }],
        goal: {
          text: 'Stay out of sight behind the SUV with Nikhil until the call starts',
          until: ['with:nikhil', 'time:14:45'],
          by: '15:20',
          onDone: 'overhear',
          onFail: 'swept',
          marker: 'suv',
        },
      },
      overhear: {
        camera: 'wide',
        beats: [
          { who: 'fixer', line: 'Haan sir. Teen baje line banegi. Saade teen baje... pathar. Ek. Bas ek.' },
          { who: 'fixer', line: 'Camera wale sambhal lenge. Bolenge students ne phenka. Haan sir, joote baant diye.' },
          { who: 'nikhil', line: '(dheere) Update: pathar ka matlab stone hota hai na? Hindi mein?', react: 'silence' },
          { who: 'player', line: 'Haan Nikhil. Hindi mein bhi stone hi hota hai.' },
        ],
        idle: [
          ['fixer', 'Haan sir. Nahi sir. Ladke apne hain, kapde unke.'],
          ['nikhil', 'Bhai mera charger wala offer abhi bhi valid hai kya?'],
          ['crowd', 'Gaadi ka number dekh, peeche likha hai "Press".'],
        ],
        options: [
          {
            intent: 'Film the fixer and his bundle of notes, loudly',
            beats: [
              { who: 'player', line: '(phone upar) Doston, ye dekho. Paanch sau ke note, naye joote, aur "saade teen baje pathar".' },
              { who: 'fixer', line: 'Oye! Phone neeche! Kaun hai ye?!' },
              { who: 'crowd', line: 'Arre ye RUP wala hai! Ye apne ladke chhod raha tha!', overlap: true },
              { who: 'c3', line: 'Kya tamasha hai? Phone de. Idhar aa tu!', react: 'cut' },
            ],
            effects: { aura: 10, help: 15, heat: 8, flags: ['fixer-exposed'] },
            do: ['clip:provocateur-exposed', 'intensity:-12', 'crowd:stage:+6', 'chase:c3', 'callback:exposed'],
            next: 'run',
          },
          {
            intent: 'Run and tell Officer Sharma at the barricade',
            beats: [
              { who: 'player', line: 'Nikhil, saath chal. Sharma sir ko batana hai. Wahi ek hai jo sunta hai.' },
              { who: 'nikhil', line: 'Sunta hai ya repeat karta hai?' },
              { who: 'player', line: 'Dono. Par sunta hai.' },
            ],
            do: ['follow:nikhil'],
            next: 'report',
          },
          {
            intent: 'Report him to Constable Tomar, who is right here',
            beats: [
              { who: 'player', line: 'Sir! Ye aadmi pathar phikwane wala hai! Maine suna!' },
              { who: 'c3', line: 'Pathar? Kaun? Ye? Ye toh Bhatia ji ke aadmi hain. Bade aadmi.' },
              { who: 'c3', line: 'Aur tu? Tu kaun hai? Chal, bus mein baith ke bata.', react: 'cut' },
              { who: 'fixer', line: '(muskaan) Bachche hain sir. Josh hai.' },
            ],
            effects: { heat: 12, help: 3, flags: ['report-wrong-story'] },
            do: ['detain:player', 'callback:wrong-cop'],
            end: 'fail',
          },
          {
            intent: 'Let Nikhil take the charger, you need battery too',
            beats: [
              { who: 'nikhil', line: 'Bhaiya ek charger. Do log share kar lenge.' },
              { who: 'fixer', line: 'Share karo, care karo. Teen baje line ke paas milna. Dono.' },
              { who: 'nikhil', line: 'Update: 4%. Bhai yeh kaam kar raha hai. Revolution baad mein.', react: 'laugh' },
            ],
            effects: { nuisance: 6, heat: 4, flags: ['took-charger'] },
            do: ['intensity:+6', 'hotspot:stage'],
            next: 'joined',
          },
        ],
      },
      // You filmed it; Tomar wants your phone. Lose him.
      run: {
        beats: [{ who: 'nikhil', line: 'Bhaag! Main peeche hoon! Matlab main bhi bhaag raha hoon, ye update nahi hai!' }],
        goal: {
          text: 'Lose Constable Tomar in the crowd, video still on your phone',
          until: ['chase-lost'],
          by: '15:30',
          onDone: 'kept',
          onFail: 'lost-phone',
          marker: 'stage',
        },
      },
      kept: {
        camera: 'phone',
        beats: [
          { who: 'meera', line: 'Bhej. BHEJ. Main story pe daal rahi hoon. Ye video saade teen se pehle jaana chahiye.' },
          { who: 'crowd', line: 'SUV wale wapas jao! Joote wapas lo!' },
          { who: 'fixer', line: '(door se) Chalo! Gaadi nikaalo! Ladke uthao!' },
        ],
        options: [
          {
            intent: 'Let Meera post it with her caption',
            beats: [
              { who: 'meera', line: 'Caption: "Free joote with every pathar". Done. Posted.' },
              { who: 'nikhil', line: 'Update: hum viral hain. Mera charger nahi hai par hum viral hain.', react: 'laugh' },
            ],
            effects: { aura: 8 },
            do: ['target:stream', 'stance:hold'],
            end: 'done',
          },
          {
            intent: 'Send it to Zoya instead, she will verify it',
            beats: [
              { who: 'zoya', line: 'Number plate dikh rahi hai? Haan. Time stamp? Haan. Main live pe dikha rahi hoon.' },
              { who: 'meera', line: 'Zoya ko diya? Zoya ko? Main yahan khadi hoon.', react: 'silence' },
            ],
            effects: { help: 6, mood: { meera: 'sulking' } },
            do: ['target:stream', 'intensity:-4'],
            end: 'done',
          },
          {
            intent: 'Show the crowd on your own phone, no posting',
            beats: [
              { who: 'player', line: 'Dekho sab. Isse dekho. Agar koi pathar uthaye, toh yaad rakhna kisne diya.' },
              { who: 'crowd', line: 'Joote utaro! Joote utaro! (dabbe zameen pe)', react: 'laugh' },
            ],
            effects: { help: 8, aura: 4 },
            do: ['stance:protect', 'crowd:stage:+3', 'intensity:-6'],
            end: 'done',
          },
        ],
      },
      'lost-phone': {
        camera: 'wide',
        beats: [
          { who: 'c3', line: 'Phone. Haan. Delete. Gallery bhi. Recently deleted bhi. Mujhe pata hai.' },
          { who: 'nikhil', line: 'Update: unhe recently deleted pata hai. Ye log trained hain.', react: 'silence' },
        ],
        options: [
          {
            intent: 'Hand it over and walk away',
            beats: [{ who: 'c3', line: 'Shabaash. Ab jao. Aur shor nahi.' }],
            effects: { heat: -4, aura: -4 },
            end: 'fail',
          },
          {
            intent: 'Argue, loudly, about your rights',
            beats: [
              { who: 'player', line: 'Sir mere phone pe mera haq hai! Article— koi bhi article!' },
              { who: 'c3', line: 'Article bus mein padh lena.', react: 'cut' },
            ],
            effects: { heat: 10, aura: 4 },
            do: ['detain:player'],
            end: 'fail',
          },
        ],
      },
      report: {
        beats: [{ who: 'nikhil', line: 'Bhai barricade door hai aur saade teen paas hai.' }],
        goal: {
          text: 'Get Nikhil to Officer Sharma at the barricade before 15:30',
          until: ['at:player:barricade', 'with:nikhil'],
          by: '15:30',
          onDone: 'sharma',
          onFail: 'swept',
          marker: 'barricade',
        },
      },
      sharma: {
        camera: 'wide',
        beats: [
          { who: 'player', line: 'Sir. SUV wala. Paise, joote, aur saade teen baje ek pathar. Maine khud suna.' },
          { who: 'sharma', line: 'Pathar.' },
          { who: 'sharma', line: 'Saade teen baje.' },
          { who: 'c2', line: '(dheere) Sharma ji, ye wahi gaadi hai jo subah se "Press" likh ke khadi hai.' },
        ],
        idle: [['sharma', 'Pathar. Saade teen.'], ['c2', 'Number plate yaad hai?'], ['nikhil', 'Sir main gawah hoon. Charger ka bhi.']],
        options: [
          {
            intent: 'Count on Sharma liking you after this morning',
            requires: { mood: { sharma: ['soft', 'amused'] } },
            beats: [
              { who: 'sharma', line: 'Theek hai. Meena, mere saath chalo. Gaadi tak.', react: 'silence' },
              { who: 'c2', line: 'Chalo. Pehli baar koi kaam ki baat aayi aaj.' },
              { who: 'fixer', line: '(door se) Sir aap? Arre sir, hum toh bas paani baant rahe the...' },
            ],
            effects: { help: 15, mood: { sharma: 'soft' }, flags: ['fixer-reported'] },
            do: ['intensity:-15', 'callback:reported'],
            end: 'done',
          },
          {
            intent: 'Make Meena laugh so she takes it seriously',
            beats: [
              { who: 'player', line: 'Ma\'am, unke joote Bata ke dabbe mein Paragon hain. Fraud double hai.' },
              { who: 'c2', line: '(hasi dabate hue) ...Double fraud. Chalo, dekh leti hoon.', react: 'laugh' },
              { who: 'sharma', line: 'Dekh leti hoon.' },
            ],
            effects: { aura: 6, help: 10, mood: { c2: 'amused' }, flags: ['fixer-reported'] },
            do: ['intensity:-8', 'callback:meena'],
            end: 'done',
          },
          {
            intent: 'Tell the whole barricade, not just Sharma',
            beats: [
              { who: 'player', line: '(zor se) SUV WALE PATHAR PHENKWANE WALE HAIN! SAADE TEEN BAJE!' },
              { who: 'crowd', line: 'Kya? Kaun? Pathar? Kahan?', overlap: true },
              { who: 'sharma', line: 'Shor. Shor mat karo. Ab sab dekh rahe hain.', react: 'cut' },
            ],
            effects: { aura: 8, heat: 8, help: 4 },
            do: ['crowd:barricade:+5', 'hotspot:barricade', 'intensity:+4'],
            end: 'fail',
          },
        ],
      },
      pull: {
        beats: [{ who: 'nikhil', line: 'Theek hai. Theek hai. Par phir tu mujhe charge karwa ke dega.' }],
        goal: {
          text: 'Walk Nikhil back to the stage, away from the SUV',
          until: ['at:nikhil:stage', 'at:player:stage'],
          by: '15:20',
          onDone: 'pulled',
          onFail: 'swept',
          marker: 'stage',
        },
      },
      pulled: {
        camera: 'wide',
        beats: [
          { who: 'nikhil', line: 'Bhai woh sirf ek charger tha.' },
          { who: 'player', line: 'Woh charger ke saath ek pathar bhi aata.' },
          { who: 'nikhil', line: '...Update: main bewakoof hoon.', react: 'silence' },
          { who: 'kabir', line: 'Ye toh mera opening joke hai. "Mera dost revolution mein charger ke liye aaya."' },
        ],
        options: [
          {
            intent: 'Give Nikhil your own power bank',
            beats: [
              { who: 'player', line: 'Le. Mera power bank. 40% hai. Mera bhi wahi bachcha hai.' },
              { who: 'nikhil', line: '...Bhai. Main tujhe kidney de dunga. Ek.', react: 'laugh' },
            ],
            effects: { help: 8, mood: { nikhil: 'grateful' }, flags: ['nikhil-charged'] },
            do: ['callback:powerbank'],
            end: 'done',
          },
          {
            intent: 'Go back and film the fixer now Nikhil is safe',
            beats: [
              { who: 'player', line: 'Tu yahin ruk. Kabir ke saath. Main gaadi ka video laata hoon.' },
              { who: 'kabir', line: 'Ruk, main bhi— nahi, main yahin hoon. Mera set hai saade teen.' },
            ],
            do: ['unfollow:nikhil', 'move:nikhil:kabirStage'],
            next: 'overhear',
          },
          {
            intent: 'Tell the stage crowd to ignore anyone in new shoes',
            beats: [
              { who: 'player', line: 'Sab suno! Jiske pair mein naye joote hain, uske peeche mat jaana!' },
              { who: 'crowd', line: '(sab neeche dekhte hain) ...Mere purane hain! Mere bhi!', react: 'laugh' },
              { who: 'nikhil', line: 'Update: sab apne joote dekh rahe hain. Ye bahut ajeeb hai.' },
            ],
            effects: { aura: 8, help: 4 },
            do: ['stance:protect', 'intensity:-6'],
            end: 'done',
          },
        ],
      },
      joined: {
        camera: 'wide',
        beats: [
          { who: 'fixer', line: 'Teen baje police line ke saamne. Main seeti maarunga. Tum bas aage rehna.' },
          { who: 'nikhil', line: 'Bhai mujhe ab guilt ho raha hai. Aur 6% hai. Dono ek saath.' },
        ],
        options: [
          {
            intent: 'Dump the shoes in the bin and walk off',
            beats: [
              { who: 'player', line: 'Ye lo apne joote. Mera size galat bataya tha maine.' },
              { who: 'fixer', line: 'Note bhi wapas.' },
              { who: 'player', line: 'Note... chai mein gaya.', react: 'laugh' },
            ],
            effects: { nuisance: -4, heat: -2 },
            do: ['intensity:-6', 'follow:nikhil', 'callback:ditched'],
            end: 'done',
          },
          {
            intent: 'Stand at the front when he whistles',
            beats: [
              { who: 'fixer', line: '(seeti) Ab!' },
              { who: 'crowd', line: 'Kisne phenka?! Peeche se aaya! Students ne?', overlap: true },
              { who: 'nikhil', line: 'Update: humne kuch nahi kiya par hum aage khade hain. Ye galat jagah hai.' },
            ],
            effects: { heat: 25, nuisance: 15, flags: ['stood-with-fixer'] },
            do: ['intensity:+20', 'target:player', 'hotspot:barricade', 'clip:stone-thrown', 'detain:nikhil', 'flag:nikhil-on-bus', 'callback:front'],
            end: 'fail',
          },
          {
            intent: 'Play along, then tip off Zoya',
            beats: [
              { who: 'player', line: '(dheere, phone pe) Zoya. Safed SUV. Ladke. Seeti teen baje. Camera ready rakhna.' },
              { who: 'zoya', line: 'Aa rahi hoon. Tum line mein raho, mujhe seeti chahiye recording mein.' },
              { who: 'fixer', line: 'Kise phone kar raha hai?' },
              { who: 'player', line: 'Mummy ko. Bata raha hoon naye joote mile.', react: 'laugh' },
            ],
            effects: { help: 10, heat: 6, aura: 4, flags: ['fixer-exposed'] },
            do: ['target:stream', 'intensity:-8', 'clip:provocateur-exposed', 'callback:double'],
            end: 'done',
          },
        ],
      },
      swept: {
        camera: 'wide',
        beats: [
          { who: 'c3', line: 'Ye SUV wale saare! Chalo, bus mein!' },
          { who: 'nikhil', line: 'Sir main inke saath nahi hoon! Sir mera charger bhi nahi mila!' },
          { who: 'fixer', line: '(shisha upar) Gaadi nikaalo.' },
        ],
        options: [
          {
            intent: 'Run after the bus shouting his name',
            beats: [
              { who: 'player', line: 'NIKHIL! Main aa raha hoon! Kuch karta hoon!' },
              { who: 'nikhil', line: '(window se) Update: main bus mein hoon. Window seat. Fan nahi chal raha.' },
            ],
            effects: { help: 4 },
            do: ['detain:nikhil', 'flag:nikhil-on-bus', 'intensity:+6'],
            end: 'fail',
          },
          {
            intent: 'Text the group so someone knows',
            beats: [
              { who: 'player', line: '(group pe) Nikhil ko bus mein daala. SUV wale bhaag gaye. Hum log bachche hain bas.' },
              { who: 'meera', line: '(chat) KYA. Main aa rahi hoon. Bus kahan hai?' },
            ],
            do: ['detain:nikhil', 'flag:nikhil-on-bus', 'intensity:+4'],
            end: 'fail',
          },
        ],
      },
    },
    callbacks: {
      exposed: 'Because you filmed the fixer\'s notes and new shoes at {t}, the crowd took their shoes off instead of picking up stones at {at}.',
      reported: 'Because you told Officer Sharma about the SUV at {t}, he walked over to the white SUV himself at {at}.',
      meena: 'Because you made Constable Meena laugh about Bata boxes with Paragon inside at {t}, she checked the SUV at {at}.',
      'wrong-cop': 'Because you reported the fixer to Constable Tomar at {t}, you were the one on the bus at {at}.',
      powerbank: 'Because you gave Nikhil your power bank at {t}, he could still text you at {at}.',
      ditched: 'Because you put the free shoes back at {t}, you weren\'t standing at the front at {at}.',
      front: 'Because you stood at the front for the fixer at {t}, the stone that flew at {at} looked like yours.',
      double: 'Because you played along and tipped off Zoya at {t}, the whistle was on her livestream at {at}.',
    },
    outcomes: {
      done: {
        caption: 'RUP ki safed SUV se "naye joote, naya josh". Free joote with every pathar 👟🪨 thread 👇',
        captionLater: '"Students" seen accepting shoes and cash from vehicle at Jantar Mantar. Who is funding these protests?? 🚨',
        callback: 'Because you dealt with the white SUV at {t}, the fixer\'s plan was on camera at {at}.',
      },
      fail: {
        caption: 'Jantar pe ek SUV aayi, joote baante, aur chali gayi. Bus mein gaye charger wale bachche. 🔋🚌',
        captionLater: 'Protesters caught with new shoes and cash on detention bus. Paid protest exposed?? 🚨',
        callback: 'Because the white SUV was left alone at {t}, the boys it dropped were the ones who walked away at {at}.',
      },
    },
  },
};
