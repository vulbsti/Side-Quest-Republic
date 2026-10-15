// Pure summary of completed actions, never of an intended or merely opened quest.
export function campaignSummary(game={},sim={}) {
  const memories=Array.isArray(game.memories)?game.memories:[];
  const hasMemory=pattern=>memories.some(m=>pattern.test(typeof m==='string'?m:`${m.title||''} ${m.text||''}`));
  const sound=!!(game.performance&&game.speakerReturned);
  const buddy=!!game.buddyComplete,advice=!!game.adviceComplete;
  const completed=Number(sound)+Number(buddy)+Number(advice);
  const allComplete=completed===3;
  const distinctSocial=Object.values(game.social?.history||{}).filter(h=>(h?.count||0)>0).length;
  const badges=[
    {id:'sound',title:'Borrowed, not forgotten',done:sound},
    {id:'buddy',title:'Nobody left unchecked',done:buddy},
    {id:'advice',title:'Unpaid career counsellor',done:advice},
    {id:'water',title:'Hydration department',done:(game.water||0)>=3},
    {id:'photos',title:'Delhi photo album',done:(game.photos?.length||game.photographs?.length||0)>=3},
    {id:'key',title:'Character development',done:!!game.keyReturned},
    {id:'costume',title:'Captain Pending Results',done:!!game.costumeWorn||hasMemory(/Captain Pending Results/)},
    {id:'slogan',title:'Awaaz milao',done:!!game.sloganComplete||!!game.sloganPerformed||hasMemory(/Crowd ne saath diya/)},
    {id:'escape',title:'Cardio club',done:(sim.escaped||0)>=1},
    {id:'social',title:'Four conversations later',done:distinctSocial>=4}
  ];
  const recap=[];
  if(allComplete)recap.push('Teen kahaaniyan, ek group chat. Sab ka kaam poora; ab ghar ki taraf.');
  else recap.push(`${completed}/3 stories resolved. You called it an afternoon with a few threads still open.`);
  if(sound)recap.push('The crowd got its chorus, and Ravi got his speaker back.');
  else if(game.performance)recap.push('The performance landed. Ravi is still waiting for his speaker.');
  else if(game.speakerBorrowed&&!game.speakerReturned)recap.push('You borrowed the speaker; sound check is still unfinished.');
  if(buddy)recap.push('Nikhil is back with you, phone and dignity mostly accounted for.');
  else recap.push('Nikhil’s missing-phone story is still unresolved.');
  if(advice)recap.push('Officer Sharma heard your career question. Kabir remembers the answer.');
  if((game.water||0)>=3)recap.push('You made yourself useful: three people got water.');
  if(game.keyReturned)recap.push('You returned the bus key. That choice had a sequel.');
  else if(game.keyTaken)recap.push('The bus key has not been returned. Someone is still looking for it.');
  if((sim.catches||0)>0)recap.push(`${sim.catches} awkward fictional aftermath conversation${sim.catches===1?'':'s'} made the group chat.`);
  let endingTitle;
  if(allComplete)endingTitle=(sim.trust||0)>=45?'CHAOTIC. RELIABLE.':'ALL THREE. HOME TOGETHER.';
  else if(game.keyTaken&&!game.keyReturned)endingTitle='ONE KEY. LOOSE ENDS.';
  else if((sim.mischief||0)>=35)endingTitle='A LOCAL INCIDENT.';
  else endingTitle='AN AFTERNOON TO REMEMBER.';
  return {completed,total:3,allComplete,badges,endingTitle,recap};
}
