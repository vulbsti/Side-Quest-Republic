// bus-andar: the detention bus as a place you can be, with people in it and real ways out.
// This one is the worked example of the situations format (plans/story-rebuild.md).
export default {
  'bus-andar': {
    title: 'Bus ke andar',
    act: 3,
    window: { from: '10:00', until: '18:00' },
    place: 'player', // you are on the bus; the marker is you
    cast: ['r1'],
    repeat: true, // every detention opens it again
    cancelIfUnmet: true, // released some other way (the 17:30 release, a friend's distraction): it just ends
    requires: { detained: true },
    hook: {
      chat: [['kabir', 'bhai tu bus mein hai?? window se haath hila'], ['meera', 'ruk main angle dhundh rahi hoon']],
      overheard: [['uncle', 'Beta main toh kele lene aaya tha. Kele.']],
      card: 'You are on the detention bus. Talk your way out',
    },
    start: 'inside',
    nodes: {
      inside: {
        camera: 'none',
        beats: [
          { who: 'uncle', line: 'Beta tum bhi? Main toh kele lene aaya tha. Ek darjan. Ab dekho.' },
          { who: 'student', line: 'Bhai sab chill. Paanch baje chhod dete hain. Mera teesra time hai.' },
          { who: 'r1', line: 'Baith jao. Khidki se haath bahar nahi.' },
        ],
        idle: [['uncle', 'Kele bhi gaye, izzat bhi.'], ['student', 'Charger hai kisi ke paas?'], ['r1', 'Shor nahi.']],
        options: [
          {
            intent: 'Ask the jawan where he is from',
            beats: [
              { who: 'player', line: 'Bhaiya aap kahan se ho? Accent sun ke lag raha Bihar.' },
              { who: 'r1', line: 'Muzaffarpur.' },
              { who: 'player', line: 'Litchi wala Muzaffarpur!' },
              { who: 'r1', line: '...Haan. Litchi wala.', react: 'silence' },
            ],
            next: 'pandey',
          },
          {
            intent: 'Help the banana uncle make his case, loudly',
            beats: [
              { who: 'player', line: 'Sir! Ye uncle sirf kele lene aaye the! Kele ki dukaan pe lathi nahi chalti!' },
              { who: 'uncle', line: 'Haan! Ek darjan! Rasid bhi hai!', react: 'laugh' },
              { who: 'r1', line: 'Rasid dikhao.' },
              { who: 'uncle', line: 'Rasid... kele ke saath chali gayi.' },
            ],
            effects: { help: 5 },
            next: 'uncle',
          },
          {
            intent: 'Wave at your friends through the window',
            beats: [
              { who: 'player', line: '(window pe dastak) Oye! Kuch karo!' },
              { who: 'r1', line: 'Haath andar.' },
            ],
            next: 'window',
          },
          {
            intent: 'Just sit and wait it out',
            beats: [
              { who: 'student', line: 'Smart. Paanch baje sab chhoot jaate hain. Tab tak gaana suno.' },
            ],
            end: 'fail',
          },
        ],
      },
      pandey: {
        beats: [
          { who: 'r1', line: 'Teen saal se ghar nahi gaya. Amma bolti hain litchi ka season nikal gaya.' },
        ],
        options: [
          {
            intent: 'Tell him about the shortcut through the gali',
            requires: { rep: { help: 10 } },
            beats: [
              { who: 'player', line: 'Bhaiya ek kaam karo. Peeche gali hai. Main gaya, aap kahoge bhaga. Aapka koi nuksaan nahi.' },
              { who: 'r1', line: '...Main paani lene ja raha hoon. Do minute. Darwaza khula hai, garmi hai.', react: 'silence' },
            ],
            effects: { help: 5, flags: ['raf-muzaffarpur'] },
            do: ['release:player', 'callback:gali'],
            end: 'done',
          },
          {
            intent: 'Make him laugh with a litchi joke',
            beats: [
              { who: 'player', line: 'Bhaiya litchi aur protest mein kya common hai? Dono June mein aate hain aur sabko chipak jaate hain.' },
              { who: 'r1', line: 'Hah. Bakwas.' },
              { who: 'r1', line: '...Thoda achha tha.', react: 'laugh' },
            ],
            effects: { aura: 5, mood: { r1: 'amused' } },
            next: 'inside',
          },
          {
            intent: 'Ask to call your mummy on his phone',
            beats: [
              { who: 'player', line: 'Bhaiya ek call. Mummy ko. Bas bolna hai main zinda hoon.' },
              { who: 'r1', line: 'Mera phone bhi Amma ke liye hai. Nahi.' },
            ],
            next: 'inside',
          },
        ],
      },
      uncle: {
        beats: [{ who: 'uncle', line: 'Beta tum vakil bano. Main fees mein kele dunga.' }],
        options: [
          {
            intent: 'Start a chant: "Kele wale uncle ko chhodo"',
            requires: { rep: { aura: 20 } },
            beats: [
              { who: 'player', line: 'Kele wale uncle ko! Chhodo! Chhodo!' },
              { who: 'student', line: 'CHHODO! CHHODO!', overlap: true },
              { who: 'r1', line: 'Arre... theek hai, theek hai! Uncle jao. Aur tum bhi jao, sar dard ho gaya.', react: 'laugh' },
            ],
            effects: { aura: 10, help: 5 },
            do: ['release:player', 'clip:detainees-escape', 'callback:kele'],
            end: 'done',
          },
          {
            intent: 'Let it go',
            beats: [{ who: 'uncle', line: 'Koi baat nahi beta. Kele phir aa jaayenge. Izzat nahi aayegi.' }],
            next: 'inside',
          },
        ],
      },
      window: {
        beats: [{ who: 'student', line: 'Window se? Bhai tere dost tujhe dekh bhi nahi rahe, reel bana rahe hain.' }],
        goal: {
          text: 'Wait for a friend to make a scene outside',
          until: ['free'],
          by: '17:30',
          onFail: 'inside',
        },
      },
    },
    callbacks: { // keys for do: ['callback:<key>']
      gali: 'Because you got Jawan Pandey talking about Muzaffarpur at {t}, the bus door was "open for the heat" at {at}.',
      kele: 'Because you took up the banana uncle\'s case at {t}, the whole bus chanted its way out at {at}.',
    },
    outcomes: {
      done: { caption: 'Detention bus se ek aur escape. Is bus ka darwaza hai ya revolving door? 🚌', callback: null },
      fail: { caption: 'Bus ke andar ka mahaul: kele, charger, aur ek uncle ki rasid.', callback: null },
    },
  },
};
