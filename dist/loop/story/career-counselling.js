// career-counselling (Act 1, 10:15–11:45, barricade). Sharma is bored at the barricade. Ask him about
// your future and he calls in a "panel": Constable Yadav (c1, wants chai and a transfer to Gurgaon)
// and Constable Meena (c2, sharp, secretly amused) walk over from their posts. Terrible advice, then
// an argument about the SSC exam and Yadav's transfer. Flatter, roast, or "uncle aap cute ho". Then
// Constable Tomar (c3) walks up and notices you: flag 'tomar-noticed' is for later random heat.
// Meena stays at the barricade afterwards (better gossip than CP), which leaves the CP key hook
// unwatched for chabi.
export default {
  'career-counselling': {
    title: 'Career counselling',
    act: 1,
    window: { from: '10:15', until: '11:45' },
    place: 'barricade',
    cast: ['sharma'],
    hook: {
      chat: [
        ['meera', 'bhai barricade pe Sharma uncle akele khade hain, ek ghante se ek hi barricade ko dekh rahe hain'],
        ['meera', 'content alert 🚨 koi jaake unse kuch bhi poocho'],
      ],
      overheard: [
        ['sharma', 'Yadav ko bolo chai laaye. Haan. Wahi Yadav.'],
        ['wireless', 'Barricade, report karo. ...Barricade?'],
        ['sharma', 'Barricade yahin hai. Report.'],
      ],
      card: 'Officer Sharma is bored stiff at the barricade',
    },
    // Nobody came: Yadav drifts over for chai anyway, and the two of them argue about the SSC to no one.
    auto: {
      at: '11:30',
      beats: [
        ['c1', 'Sharma ji, SSC ka form aaya. Last date kal hai. Main is baar bharunga.'],
        ['sharma', 'Har baar bharoge.'],
        ['c1', 'Is baar sach mein. Phir transfer. Gurgaon.'],
      ],
      do: ['move:c1:barricade'],
    },
    start: 'intro',
    nodes: {
      intro: {
        camera: 'none',
        beats: [
          { who: 'sharma', line: 'Kya hai?' },
          { who: 'player', line: 'Kuch nahi sir. Bas... aap akele lag rahe the.' },
          { who: 'sharma', line: 'Akele.', react: 'silence' },
          { who: 'sharma', line: 'Barricade hai na. Saath mein.' },
        ],
        idle: [
          ['sharma', 'Aage nahi.'],
          ['sharma', 'Kya dekh rahe ho? Barricade dekho. Main bhi wahi dekh raha hoon.'],
          ['wireless', 'Sab normal? ...Over.'],
        ],
        options: [
          {
            intent: 'Ask Sharma what you should do with your life',
            beats: [
              { who: 'player', line: 'Sir, ek serious sawaal. BA kar raha hoon. Uske baad kya karun?' },
              { who: 'sharma', line: 'BA ke baad.', react: 'silence' },
              { who: 'sharma', line: 'Ruko. Ye akele ka sawaal nahi hai. YADAV! MEENA! Idhar aao. Panel baithega.' },
              { who: 'wireless', line: 'Kaunsa panel? Sharma? Kaunsa panel?' },
            ],
            effects: { aura: 3 },
            do: ['move:c1:barricade', 'move:c2:barricade'],
            next: 'gather',
          },
          {
            intent: 'Run and fetch Meera first, this needs filming',
            beats: [
              { who: 'player', line: 'Sir ek minute rukiye. Aapka interview lena hai. Camera wali laata hoon.' },
              { who: 'sharma', line: 'Interview.' },
              { who: 'sharma', line: '...Theek hai. Tab tak panel bulata hoon. YADAV! MEENA!' },
              { who: 'meera', line: 'INTERVIEW?? aa rahi hoon, mera ring light charge hai', via: 'phone' },
            ],
            effects: { nuisance: 3 },
            do: ['follow:meera', 'move:c1:barricade', 'move:c2:barricade'],
            next: 'fetch',
          },
          {
            intent: 'Ask if you can cross the barricade, just to see',
            beats: [
              { who: 'player', line: 'Sir bas ek second udhar jaake aata hoon. Dekhna hai udhar kya hai.' },
              { who: 'sharma', line: 'Udhar bhi barricade hai.' },
              { who: 'player', line: 'Uske udhar?' },
              { who: 'sharma', line: 'Upar se order hai.' },
              { who: 'player', line: 'Upar kaun?' },
              { who: 'sharma', line: 'Upar.', react: 'silence' },
              { who: 'sharma', line: 'Chalo. Aage badho. Peeche ki taraf.' },
            ],
            effects: { heat: 6, nuisance: 4, mood: { sharma: 'annoyed' } },
            do: ['callback:upar'],
            end: 'fail',
          },
        ],
        leave: [['sharma', 'Haan. Jao.']],
      },
      gather: {
        beats: [
          { who: 'c1', line: '(door se) Aa raha hoon Sharma ji! Chai hai kya wahan?' },
          { who: 'c2', line: '(door se) Panel? Sharma sir ne "panel" bola? Ye main miss nahi karungi.' },
        ],
        goal: {
          text: 'Wait while Sharma\'s "career panel" assembles',
          until: ['near:c1:sharma', 'near:c2:sharma'],
          by: '11:45',
          marker: 'barricade',
          onDone: 'panel',
          onFail: 'nobody-came',
        },
      },
      fetch: {
        beats: [
          { who: 'sharma', line: 'Camera wali. Jaldi.' },
        ],
        goal: {
          text: 'Bring Meera to the barricade to film the panel',
          // with:meera + you at the barricade, not at:meera:barricade: followers get stuck at the midway
          // waypoint (plans/notes/act1-situations.md). Swap back once that's fixed.
          until: ['with:meera', 'at:player:barricade', 'near:c1:sharma', 'near:c2:sharma'],
          by: '11:45',
          marker: 'meera',
          onDone: 'panel',
          onFail: 'nobody-came',
        },
      },
      panel: {
        camera: 'wide',
        beats: [
          { who: 'sharma', line: 'Haan. Bachcha career pooch raha hai. Bolo.' },
          { who: 'c1', line: 'SSC. Bas SSC. Main bhi SSC se aaya. Chhe attempt.' },
          { who: 'c2', line: 'Chhe nahi, saat. Ek mein admit card ghar bhool gaye the.' },
          { who: 'c1', line: 'Wo attempt count nahi hota.' },
          { who: 'c2', line: 'Hota hai.' },
          { who: 'sharma', line: 'Hota hai.' },
          { who: 'c1', line: 'Beta, sarkari naukri lo. Pension. Izzat. Aur transfer.' },
          { who: 'c2', line: 'Transfer? Yadav ji teen saal se Gurgaon transfer maang rahe hain. Application ab file nahi, fossil hai.', react: 'laugh' },
          { who: 'c1', line: 'Gurgaon mein ghar hai. Yahan sirf barricade hai.' },
          { who: 'sharma', line: 'Barricade bhi ghar hai.' },
          { who: 'c2', line: 'Meri advice: kuch bhi karo, par form khud bharna. Yadav ji ka form inke saale ne bhara tha.' },
          { who: 'c1', line: 'Category mein "OBC" ki jagah "Other" daal diya.' },
          { who: 'sharma', line: 'Other.', react: 'silence' },
        ],
        idle: [
          ['c1', 'Chai aa rahi hai kya? Koi chai la raha hai? Kisi ne chai bola tha.'],
          ['c2', 'Bolo bolo. Sharma sir ne panel banaya hai, aaj tak kuch nahi banaya.'],
          ['sharma', 'Sawaal poocho. Jaldi. Barricade akela hai.'],
        ],
        options: [
          {
            intent: 'Roast Yadav\'s six-and-a-half SSC attempts',
            beats: [
              { who: 'player', line: 'Yadav ji, saat attempt ke baad toh SSC wale aapko khud call karke poochte honge, "aa rahe ho na?"' },
              { who: 'c2', line: '(hans hans ke) Haaye. Haaye Yadav ji.', react: 'laugh' },
              { who: 'c1', line: 'Haso. Haso sab. Jab Gurgaon jaunga tab dekhna.' },
              { who: 'sharma', line: 'Gurgaon.', react: 'laugh' },
            ],
            effects: { aura: 10, heat: 4, mood: { c1: 'sulking', c2: 'amused', sharma: 'amused' } },
            clip: 'pester-career',
            do: ['move:c3:barricade'],
            next: 'tomar',
          },
          {
            intent: 'Flatter them: "aap log nation-builders ho"',
            beats: [
              { who: 'player', line: 'Sir sach bataun? Aap log nation-builders ho. Bina aapke ye barricade kuch nahi hai. Bas lohe ka tukda hai.' },
              { who: 'sharma', line: 'Nation-builder.', react: 'silence' },
              { who: 'sharma', line: '...Baitho. Chai piyoge?' },
              { who: 'c2', line: 'Sharma sir chai offer kar rahe hain. Main ye record pe lena chahti hoon.' },
              { who: 'c1', line: 'Chai? Kahan? Mere liye bhi?' },
            ],
            effects: { help: 4, aura: 4, mood: { sharma: 'soft', c1: 'happy' } },
            do: ['move:c3:barricade'],
            next: 'tomar',
          },
          {
            intent: 'Look Sharma in the eye: "uncle aap cute ho"',
            beats: [
              { who: 'player', line: 'Ek baat bolun? Uncle aap cute ho.' },
              { who: 'sharma', line: '...', react: 'silence' },
              { who: 'sharma', line: 'Cute.' },
              { who: 'c2', line: '(muh pe haath) Main mar jaungi. Main aaj duty pe mar jaungi.', react: 'laugh' },
              { who: 'c1', line: 'Mujhe aaj tak kisi ne cute nahi bola. Biwi ne bhi nahi.' },
              { who: 'sharma', line: 'Duty pe "cute" allowed nahi hai.' },
              { who: 'sharma', line: '(moonchh theek karte hue) ...Duty ke baad dekhenge.' },
            ],
            effects: { aura: 12, nuisance: 4, mood: { sharma: 'amused', c2: 'amused' }, flags: ['uncle-cute'] },
            clip: 'pester-cute',
            do: ['move:c3:barricade'],
            next: 'tomar',
          },
          {
            intent: 'Get Meera to film the whole panel as a reel',
            requires: { with: ['meera'] },
            beats: [
              { who: 'meera', line: 'Sir thoda left. Madam thoda right. Yadav ji, aap jaise ho waise hi raho, aap natural ho.' },
              { who: 'meera', line: 'Okay. "Career Counselling with Delhi Police, Episode 1." Action!' },
              { who: 'c1', line: 'Bachcho, SSC. Bas SSC. Aur form khud bharna.' },
              { who: 'c2', line: '(camera mein) Aur agar transfer chahiye, toh mat lena. Kabhi nahi milta.', react: 'laugh' },
              { who: 'sharma', line: 'Episode 2 kab hai?' },
            ],
            effects: { aura: 15, heat: 6, mood: { sharma: 'amused', c2: 'amused' }, flags: ['counselling-reel'] },
            clip: 'pester-career',
            do: ['move:c3:barricade'],
            next: 'tomar',
          },
        ],
      },
      tomar: {
        camera: 'none',
        beats: [
          { who: 'c3', line: 'Kya mela laga hai yahan? Duty hai ya kitty party?' },
          { who: 'sharma', line: 'Sir. Bachcha. Career.' },
          { who: 'c3', line: 'Career.', react: 'silence' },
          { who: 'c3', line: '(tumhe upar se neeche dekhta hai) Tu. Naam kya hai tera? Shakal yaad rakhunga.' },
          { who: 'c2', line: '(dheere se) Isko jawab mat dena, ye har kisi ki shakal yaad rakhta hai. Kisi ki yaad nahi rehti.', aside: true },
        ],
        idle: [
          ['c3', 'Naam. Main dobara nahi poochunga. ...Naam.'],
          ['c1', '(Tomar se) Sir chai?'],
        ],
        options: [
          {
            intent: 'Give a fake name: "Rohan, ed-tech startup"',
            beats: [
              { who: 'player', line: 'Rohan, sir. Ed-tech startup. Hum log protest ko gamify kar rahe hain.' },
              { who: 'c3', line: 'Rohan.' },
              { who: 'c3', line: 'Rohan, main tujhe dekh raha hoon.' },
              { who: 'c2', line: 'Sir Rohan naam ke aaj yahan kam se kam pachaas hain.', react: 'laugh' },
            ],
            effects: { aura: 5, heat: 8, flags: ['tomar-noticed', 'tomar-fake-name'] },
            do: ['callback:rohan'],
            end: 'done',
          },
          {
            intent: 'Announce that Sharma ji is your mama',
            requires: { mood: { sharma: ['soft', 'amused'] } },
            beats: [
              { who: 'player', line: 'Sir main Sharma ji ka bhanja hoon. Mama ji se milne aaya tha.' },
              { who: 'sharma', line: '...', react: 'silence' },
              { who: 'sharma', line: 'Haan. Bhanja. Bahan ka.' },
              { who: 'c3', line: 'Pehle kyun nahi bataya?' },
              { who: 'sharma', line: 'Aapne pehle poocha nahi.' },
              { who: 'c3', line: 'Hmph. Bhanja ho ya bhatija, line mein raho.' },
            ],
            effects: { help: 6, heat: 2, mood: { sharma: 'soft' }, flags: ['tomar-noticed', 'sharma-bhanja'] },
            do: ['callback:bhanja'],
            end: 'done',
          },
          {
            intent: 'Ask Tomar for career advice too',
            beats: [
              { who: 'player', line: 'Sir aap bhi kuch bataiye na. Career mein aage kaise badhein?' },
              { who: 'c3', line: 'Advice? Ghar jao. Wahi career hai.' },
              { who: 'c2', line: '(khaans ke hasi chhupati hai)', react: 'laugh' },
              { who: 'c3', line: 'Meena, kya hua?' },
              { who: 'c2', line: 'Kuch nahi sir. Garmi.' },
              { who: 'c3', line: '(tumse) Tujhe yaad rakhunga. Pakka.' },
            ],
            effects: { aura: 8, heat: 12, mood: { c3: 'annoyed', c2: 'amused' }, flags: ['tomar-noticed'] },
            do: ['callback:advice'],
            end: 'done',
          },
          {
            intent: 'Salute and march off like an NCC cadet',
            beats: [
              { who: 'player', line: '(ek dum tight salute) Jai Hind sir!' },
              { who: 'c3', line: 'Mazaak?' },
              { who: 'c1', line: '(reflex mein wapas salute kar deta hai)' },
              { who: 'c2', line: 'Yadav ji. Yadav ji, haath neeche.', react: 'laugh' },
            ],
            effects: { aura: 4, heat: 5, flags: ['tomar-noticed'] },
            do: ['callback:salute'],
            end: 'done',
          },
        ],
      },
      'nobody-came': {
        beats: [
          { who: 'sharma', line: 'Panel nahi aaya.' },
          { who: 'wireless', line: 'Sharma, panel ka kya hua? Upar tak baat gayi hai.' },
          { who: 'sharma', line: 'Panel cancel. Career baad mein.' },
        ],
        end: 'fail',
      },
    },
    callbacks: {
      upar: 'Because you asked what was beyond the barricade at {t}, Sharma was still saying "upar se" at {at}.',
      rohan: 'Because you told Constable Tomar your name was "Rohan, ed-tech startup" at {t}, he was looking for a Rohan at {at}.',
      bhanja: 'Because Sharma claimed you as his bhanja at {t}, the barricade still treated you like family at {at}.',
      advice: 'Because you asked Constable Tomar for career advice at {t}, he still remembered your face at {at}.',
      salute: 'Because you saluted Constable Tomar at {t}, Yadav saluted back, and Meena was still laughing about it at {at}.',
    },
    outcomes: {
      done: {
        caption: 'Delhi Police career counselling session at the barricade 💼 SSC, transfer, aur "uncle aap cute ho". Episode 2 kab? 😭',
        captionLater: 'Police "chatting and laughing" with protesters while the city burns. Who gave these kids access? 🧐',
        do: ['unfollow:meera', 'move:c1:metroPath', 'move:c3:midway'],
      },
      fail: {
        caption: 'Barricade pe ek bachcha "udhar kya hai" pooch raha tha. Jawab: "upar se" 🚧',
        captionLater: 'Protesters TRY to breach barricade at Jantar Mantar. Police stand firm 🇮🇳',
        do: ['unfollow:meera', 'move:c1:metroPath', 'move:c2:cpPost'],
      },
    },
  },
};
