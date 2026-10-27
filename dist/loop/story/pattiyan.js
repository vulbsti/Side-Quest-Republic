// pattiyan (Act 3, 16:15–17:05): after the gas and the charge, Sana's tent is the busiest place on the square.
// It fills the stretch between the clash ending and going home, which used to have nothing in it.
// Format: plans/story-rebuild.md, "Situations".
export default {
  pattiyan: {
    title: 'Pattiyan',
    act: 3,
    window: { from: '16:15', until: '17:05' },
    place: 'sana',
    cast: ['sana', 'nikhil', 'c2'],
    requires: { detained: false },
    hook: {
      chat: [
        ['sana', 'TENT PE AAO. 12 log, aankhon mein gas, 4 bottle paani bacha hai. jo free hai aa jao'],
        ['meera', 'sana ka tent abhi field hospital hai. main aa rahi hoon content ke liye nahi, sach mein help ke liye. thoda content bhi'],
      ],
      overheard: [
        ['sana', 'Aankh mat ragdo! Koi aankh nahi ragdega! Paani daalo, ragdo mat!'],
        ['crowd', 'Didi meri aankh mein mirchi hai, ya gas, ya dono?'],
      ],
      card: "Sana's tent is full of people who got gassed, and she's out of water",
    },
    // Nobody helps: Sana manages, barely, and remembers who walked past.
    auto: {
      at: '16:58',
      beats: [
        ['sana', 'Theek hai. Sab theek hain. Koi nahi aaya, par sab theek hain.'],
        ['sana', 'Agli baar protest se pehle paani laana. Aur dost laana jo paani laaye.'],
      ],
      end: 'fail',
    },
    start: 'tent',
    nodes: {
      tent: {
        camera: 'none',
        beats: [
          { who: 'sana', line: 'Tum! Haan tum. Haath dhoye hain? Nahi? Koi baat nahi, aaj kisi ne nahi dhoye.' },
          { who: 'sana', line: 'Paani khatam, ORS khatam, patience khatam. Ek cheez lao. Kuch bhi lao.' },
          { who: 'nikhil', line: 'Bhai meri aankh mein gas gaya. Update: dusri aankh mein bhi.', react: 'laugh' },
        ],
        idle: [
          ['sana', 'Ragdo mat! Kisne ragda? Tumne ragda.'],
          ['nikhil', 'Main ragd nahi raha, main… soch raha hoon aankh se.'],
          ['crowd', 'Didi ek aur bottle?'],
        ],
        options: [
          {
            intent: 'Ask Constable Meena for her water bottle',
            beats: [
              { who: 'player', line: 'Madam, ek bottle. Aapki. Wahan bachche hain, aankh nahi khul rahi.' },
              { who: 'c2', line: 'Ye meri bottle hai. Subah se bhari hai. Maine ek ghoont nahi liya.', react: 'silence' },
              { who: 'c2', line: '...Lo. Aur kisi ko mat batana ki police ne paani diya. Career kharab ho jayega.', react: 'laugh' },
              { who: 'sana', line: 'Police ka paani. Aaj sab kuch dekh liya.' },
            ],
            effects: { help: 8, aura: 4, mood: { c2: 'soft' } },
            do: ['callback:meena-bottle'],
            payoff: { caption: 'constable madam ne apni bottle de di tent ko 😭 aaj ka sabse unexpected collab' },
            end: 'done',
          },
          {
            intent: 'Sit on Nikhil so he stops rubbing his eyes',
            beats: [
              { who: 'player', line: 'Nikhil. Haath neeche. Main baith raha hoon tere haathon pe.' },
              { who: 'nikhil', line: 'Bhai ye human rights violation hai!' },
              { who: 'sana', line: 'Ye first aid hai. Baithe raho. Paani daal rahi hoon.' },
              { who: 'nikhil', line: '...Update: dikh raha hai. Tu dikh raha hai. Kaash na dikhta.', react: 'laugh' },
            ],
            effects: { help: 5, mood: { nikhil: 'grateful' }, flags: ['nikhil-eyes-ok'] },
            do: ['callback:nikhil-eyes'],
            end: 'done',
          },
          {
            intent: 'Film the tent for the feed: "the real cost of today"',
            beats: [
              { who: 'player', line: 'Ek minute, ye important hai. Log dekhen ki kya hua.' },
              { who: 'sana', line: 'Log dekhenge. Aur ye bachcha ek minute aur jalta rahega. Camera neeche.', react: 'silence' },
              { who: 'sana', line: 'Jao. Bahar se shoot karo. Andar sirf woh aate hain jo kuch laate hain.' },
            ],
            effects: { aura: 8, help: -6, mood: { sana: 'annoyed' } },
            payoff: { caption: 'jantar mantar ke tent ke andar ka scene. ye news pe nahi dikhega 🙏 #Day1' },
            end: 'fail',
          },
        ],
      },
    },
    callbacks: {
      'meena-bottle': 'Because you asked Constable Meena for her water at {t}, the first-aid tent ran on a police bottle at {at}.',
      'nikhil-eyes': 'Because you sat on Nikhil at {t}, he stopped rubbing his eyes, and he will tell this story wrong for years.',
    },
    outcomes: {
      done: { caption: "Sana's tent ne aaj 12 aankhein bachayi. Paani kahan se aaya, mat poochho. 🩹" },
      fail: { caption: 'Tent pe log zyada, paani kam. Sana ne akele sambhala. Phir se.' },
    },
  },
};
