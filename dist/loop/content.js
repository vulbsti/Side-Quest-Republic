// Slice 1 content: everything a writer would touch lives here, not in the engine.
// Characters are fictional. Lines are original Hinglish.

export const PEOPLE = {
  ravi: { name: 'Ravi', role: 'sound volunteer', look: { color: '#d4b46b', pants: '#6f5e47', hat: true, gender: 'male' } },
  iqbal: { name: 'Iqbal', role: 'shuttle driver', look: { color: '#5d7fa8', pants: '#2f3a44', gender: 'male' } },
  sharma: { name: 'Officer Sharma', role: 'constable', look: { police: true } },
  mira: { name: 'Mira', role: 'organiser', look: { color: '#819777', pants: '#b6a080', gender: 'female' } },
};

// What talking to someone tells you. Each answer can reveal a routine hint for the chaos board.
export const TALK = {
  ravi: [
    { when: 'before-stage', line: 'Saade das baje speaker stage pe le jaunga. Mira ka bhashan bina bass ke? Kabhi nahi.', hint: 'ravi-route' },
    { when: 'chai-break', line: 'Chai break, bas paanch minute. Speaker stage pe safe hai… hai na?', hint: 'ravi-chai' },
    { when: 'searching', line: 'Mera speaker dekha kya? Kaala, bhaari, thoda attitude wala.', hint: 'ravi-route' },
    { when: 'default', line: 'Barah baje Mira bolegi, aur mera speaker poori Jantar Mantar ko hila dega.', hint: 'ravi-chai' },
  ],
  iqbal: [
    { when: 'driving', line: 'Bhai, bus chal rahi hai. Baat karni hai toh CP stop pe milo.', hint: null },
    { when: 'break', line: 'Gyarah baje aur dedh baje chai break. Chabi? Darwaze ke paas hook pe. Kaun chura lega?', hint: 'iqbal-break' },
    { when: 'searching', line: 'Chabi gayab! Bus yahin khadi rahegi, aur ye log Jantar kaise pahunchenge?', hint: 'iqbal-break' },
    { when: 'default', line: 'CP se Jantar, Jantar se CP. Din bhar yahi. Bas chai ka sahara hai.', hint: 'iqbal-break' },
  ],
  sharma: [
    { when: 'at-cp', line: 'Rao sir ne CP bheja hai. Barricade? Wahan koi aur… hai na? Hai na?', hint: 'sharma-orders' },
    { when: 'default', line: 'Mera kaam simple hai. Barricade. Jab tak Rao sir wireless pe kuch aur na bolein.', hint: 'sharma-orders' },
  ],
  mira: [
    { when: 'before-speech', line: 'Barah baje bolungi. Ravi ka speaker mila toh poora Jantar sunega.', hint: 'mira-speech' },
    { when: 'after-speech', line: 'Bhashan ho gaya. Ab dekhte hain log rukte hain ya chai pe nikal jaate hain.', hint: 'mira-speech' },
  ],
};

// Hints show up under each person on the board once you have talked to them.
export const HINTS = {
  'ravi-route': { who: 'ravi', text: 'Carries his speaker from the CP chai stall to the stage at 10:30.' },
  'ravi-chai': { who: 'ravi', text: 'Leaves the stage for chai at 11:15, back at 11:40.' },
  'iqbal-break': { who: 'iqbal', text: 'Chai breaks at 11:00 and 13:30. The bus key hangs by the door.' },
  'sharma-orders': { who: 'sharma', text: 'Guards the barricade unless Inspector Rao radios him somewhere else.' },
  'mira-speech': { who: 'mira', text: 'Gives her speech at 12:00. Wants the speaker on stage.' },
};

// The chaos board: every rule that can fire is a link you can discover by seeing it happen.
export const LINKS = {
  'key-missing': { from: 'Bus key missing', to: 'Iqbal can\'t drive, the shuttle sits at CP', hint: 'Something about Iqbal\'s chai break' },
  'cp-piles-up': { from: 'Shuttle stuck', to: 'Arrivals pile up at CP', hint: 'What happens to people waiting for the shuttle?' },
  'rao-sends-sharma': { from: 'Big crowd at CP', to: 'Rao sends Sharma away from the barricade', hint: 'Who decides where Sharma stands?' },
  'march': { from: 'Empty barricade + fired-up crowd', to: 'March to Parliament Street', hint: 'What is the barricade actually holding back?' },
  'big-speech': { from: 'Speaker on stage at noon', to: 'Mira\'s speech pulls a big crowd', hint: 'Mira wants something for her speech' },
  'small-speech': { from: 'No speaker at noon', to: 'Mira\'s speech flops', hint: 'What if Mira has nothing to speak into?' },
  'cp-party': { from: 'Speaker playing at CP', to: 'A dance party blocks CP', hint: 'Ravi\'s speaker doesn\'t have to play at the stage' },
  'sharma-kills-party': { from: 'Sharma reaches the party', to: 'He switches the speaker off', hint: 'What does a constable do with loud music?' },
  'rao-recalls': { from: 'CP calms down', to: 'Sharma goes back to the barricade', hint: 'Sharma doesn\'t stay away forever' },
  'detained': { from: 'Sharma sees you take the key', to: 'You get detained', hint: 'Watch who is watching' },
  'owner-reclaims': { from: 'The owner catches you with it', to: 'They take it back', hint: 'People notice their own things' },
  'key-returned': { from: 'Key back with Iqbal', to: 'The shuttle runs again', hint: 'Can a stuck shuttle be fixed?' },
};

// Lines the world says when rules fire. who: a person id, 'wireless', or 'street'.
export const LINES = {
  'key-missing': [['iqbal', 'Chabi?! Hook pe thi! Abhi yahin thi!'], ['street', 'The shuttle isn\'t going anywhere. Passengers start to grumble at the CP stop.']],
  'cp-piles-up': [['street', 'The CP stop is filling up. "Shuttle kab aayegi yaar?"']],
  'rao-sends-sharma': [['wireless', 'Rao: CP pe bheed jama ho rahi hai. Sharma, barricade chhodo, CP pahuncho. Over.'], ['sharma', 'Ji sir. Aa raha hoon.']],
  'rao-recalls': [['wireless', 'Rao: CP clear hai. Sharma, wapas barricade pe. Over.'], ['sharma', 'Chalo, wapas apni kursi pe.']],
  'sharma-kills-party': [['sharma', 'Ye kya DJ night chal rahi hai? Band karo!'], ['street', 'Sharma switches the speaker off. The party drifts away.']],
  'march': [['wireless', 'Rao: Barricade khaali hai?! Bheed Parliament Street ki taraf! Sab units!'], ['mira', 'Chalo! Parliament Street!']],
  'march-stop': [['sharma', 'Bas! Yahin tak!'], ['street', 'Sharma is back at the barricade. The march stalls behind him.']],
  'big-speech': [['mira', 'Ye awaaz sirf ek speaker ki nahi, hum sab ki hai!'], ['street', 'The speaker carries Mira\'s voice across the square. People keep arriving.']],
  'small-speech': [['mira', 'Doston… DOSTON… peeche wale sun pa rahe ho?'], ['ravi', 'Speaker hota toh…'], ['street', 'Half the crowd can\'t hear Mira. Some of them wander off for chai.']],
  'cp-party': [['street', 'Ravi\'s speaker is blasting at CP. People stop. People dance. Nobody is getting on the shuttle.']],
  'ravi-reclaims': [['ravi', 'Oye! Mera speaker! Seedha stage pe jaa raha hai ye.']],
  'iqbal-reclaims': [['iqbal', 'Meri chabi! Bhai, roti ka sawaal hai, mazaak nahi.']],
  'ravi-finds': [['ravi', 'Mil gaya! Kisne yahan chhoda?']],
  'iqbal-finds': [['iqbal', 'Ye rahi! Chalo, sawari, chalo!']],
  'key-returned': [['iqbal', 'Shukriya bhai! Chalo, Jantar Mantar express!']],
  'ravi-missing': [['ravi', 'Mera speaker kahan gaya?! Abhi toh yahin tha!']],
  'detained': [['sharma', 'Ruko! Bus ki chabi leke kahan? Chalo, van mein baitho.']],
  'sharma-shrug': [['sharma', 'Speaker leke kahan bhaag rahe ho? Mera department nahi, chalo.']],
  'break-start': [['iqbal', 'Chai break! Chabi hook pe. Dus minute.']],
  'ravi-at-chai': [['ravi', 'Iqbal bhai, ek cutting meri bhi.'], ['iqbal', 'Aaj bheed kuch zyada hi hai, Ravi.']],
};

// Each ending is chosen by the engine from world state; this is only what it says.
export const ENDINGS = {
  detained: {
    title: 'Detained before lunch',
    headline: '"Youth Found With Shuttle Key Says It Was A Social Experiment"',
    text: 'Sharma saw you. The day carries on without you, from the back of a police van.',
  },
  march: {
    title: 'March on Parliament Street',
    headline: '"Jantar Mantar Protest Spills Onto Parliament Street After Barricade Left Empty"',
    text: 'Mira\'s speech fired people up, the barricade had nobody behind it, and the crowd simply kept walking.',
  },
  cpjam: {
    title: 'CP chakka jam',
    headline: '"Shuttle Breakdown Turns Connaught Place Into Accidental Sit-In"',
    text: 'The real protest happened at the CP bus stop, among people who only wanted a ride.',
  },
  packed: {
    title: 'Jantar Mantar packed',
    headline: '"Thousands Hear Student Organiser At Jantar Mantar; Police Report No Incidents"',
    text: 'The day went the way it was planned. Ravi\'s speaker did its job. You were, mostly, a spectator.',
  },
  quiet: {
    title: 'Ek aur shaant din',
    headline: '"Small Gathering At Jantar Mantar Disperses Early"',
    text: 'Without the speaker, Mira\'s speech didn\'t carry and the crowd thinned out by tea time.',
  },
};
