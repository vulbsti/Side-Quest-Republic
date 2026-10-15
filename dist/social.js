// Fictional dialogue and game balance, not predictions about real policing or law.
// Values returned by socialInteraction are stat deltas.
export const socialCatalogue = Object.freeze({
  career: {title:'Career counselling', provenance:'original', reply:'Beta, career advice ke liye queue alag hai. Pehle paani pee lo.', friendReply:'Bhai ne career counselling bhi field mein le li.'},
  tuition: {title:'Civics practical', provenance:'userunverified', reply:'Mummy ko bolun revision chal raha hai? Civics ka practical toh sach mein hai.', friendReply:'Bas maths ka chapter mat pooch lena, sir.'},
  compliment: {title:'Compliment delivered', provenance:'userunverified', reply:'Achha ji? Thank you. Ab raasta bhi cute sa khaali kar do.', friendReply:'Confidence dekho. Ab blush mat kar.'},
  water: {title:'Weather department', provenance:'reportinspired', reply:'Paani chahiye toh bottle lo. Cannon ka menu card nahi hai, beta.', friendReply:'Bhai hydration maang raha tha, production budget nahi.'},
  teargas: {title:'Review cancelled', provenance:'reportinspired', reply:'Uska review mat maango. Aankhon ka khayal rakho, paani idhar hai.', friendReply:'Experience points ke liye har experience zaroori nahi.'},
  friends: {title:'Group booking?', provenance:'reportinspired', reply:'Doston ko phone karo pehle. Bus ko reunion venue mat banao.', friendReply:'Location bheji hai! Hum chai wale ke paas hain.'},
  slogan: {title:'Awaaz milao', provenance:'original', reply:'Awaaz sun li. Saath walon ka bhi dhyan rakhna.', friendReply:'Ek saath bolo, ek doosre ke upar nahi!'}
});

export function createSocialState() {
  return {history:{}, lastTime:0, officerMood:'relaxed', cooldownUntil:0};
}

// time and cooldown use seconds; pass an increasing game clock, not wall time.
// crowd is the nearby participating crowd count. temper is 0..100 current pressure.
export function socialInteraction(state,id,{time=state.lastTime,crowd=0,temper=0}={}) {
  if (!socialCatalogue[id]) throw new RangeError(`Unknown social interaction: ${id}`);
  if (!Number.isFinite(time)||!Number.isFinite(crowd)||!Number.isFinite(temper)) throw new TypeError('Social inputs must be finite numbers');
  const now=Math.max(time,state.lastTime);
  state.lastTime=now;
  const pressure=Math.max(0,Math.min(100,temper));
  const entry=socialCatalogue[id];
  const previous=state.history[id];
  const repeated=previous && now-previous.time<30;
  const count=repeated ? previous.count+1 : 1;
  state.history[id]={time:now,count};
  const waiting=now<state.cooldownUntil;
  const result={aura:0,rizz:0,heat:0,trust:0,mischief:0,reply:entry.reply,friendReply:entry.friendReply,title:entry.title,detail:'Original fictional exchange; officer is listening.',mood:'relaxed'};
  if (id==='slogan') {
    if (crowd<10) {
      result.reply='Pehle das logon ki awaaz mila lo. Akela gala mat kharaab karo.';
      result.friendReply=`Abhi ${Math.max(0,Math.floor(crowd))} saath hain. Doston ko bulao!`;
      result.title='Pehle crowd jodo';
      result.detail='10 nearby participants needed; no heat penalty.';
    } else {
      result.aura=waiting||repeated?0:10; result.trust=waiting||repeated?0:1;
      result.heat=waiting||repeated?0:25;
      result.title=waiting||repeated?'Agli awaaz se pehle pause':'Crowd ne saath diya';
      result.detail=waiting||repeated?'Chant cooldown: no repeat rewards or added heat.':'The crowd answers. Officer raises a palm: group chants draw 25 heat in this fictional game balance. Pause before the next chant.';
      result.mood='watchful'; state.cooldownUntil=Math.max(state.cooldownUntil,now+12);
    }
  } else if (waiting||count>=3) {
    result.heat=count>=4?3:1;
    result.mood='firm'; result.title='Thoda space do';
    result.reply='Joke sun liya, beta. Ab thoda space do; baad mein baat karte hain.';
    result.friendReply='Chal, paani lete hain. Same bit repeat ho raha hai.';
    result.detail='Officer raises a palm. Give them 12 seconds of space; repeated pestering adds moderate heat.';
    state.cooldownUntil=now+12;
  } else if (count===2) {
    result.aura=2; result.mood='watchful'; result.title='Same joke, smaller laugh';
    result.reply='Haan haan, pehli baar sun liya tha. Ab doosron ki bhi sun lo.';
    result.friendReply='Encore rehne de, bhai.';
    result.detail='Rewards diminish on repetition; next repeat will ask for space.';
  } else {
    result.aura=id==='compliment'?12:10; result.rizz=id==='compliment'?8:5;
    result.trust=1; result.mischief=['water','friends','tuition'].includes(id)?1:0;
    result.heat=0;
    result.mood=pressure>=70?'watchful':'amused';
    result.detail=pressure>=70?'Officer smiles briefly but is busy. Keep it short.':'One friendly joke lands; no heat spike.';
  }
  state.officerMood=result.mood;
  return result;
}
