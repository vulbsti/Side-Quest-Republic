/** Bounded physical casting for the social director. Political motives remain
 * inspector knowledge; unmarked civilian clothes never establish guilt. */
export const COHORT_CAPACITIES=Object.freeze({assembly:36,volunteers:8,police:12,'fictional-forum':4});
export const CROWD_CAPACITY=60;
export function cohortFor(index){return index>=56?'fictional-forum':index>=44?'police':index>=36?'volunteers':'assembly';}
export function stageEscalation(plan,bodies){
 const directives={},allowed=[];if(!plan)return {directives,allowed,desiredCount:0};
 const used={};
 for(const body of bodies.filter(b=>b.dayArrival)){
  const index=Number(body.id.replace('arrival','')),id=cohortFor(index),group=plan.groups.find(g=>g.id===id);if(!group)continue;
  const slot=used[id]||0;used[id]=slot+1;
  const capacity=COHORT_CAPACITIES[id];
  const wanted=id==='police'?Math.min(capacity,plan.police.reinforcements):Math.min(capacity,group.count+(id==='assembly'?Math.floor((plan.groups.find(g=>g.id==='arrivals')?.count||0)*.5):0));
  if(slot>=wanted&&body.hidden)continue;
  allowed.push(body.id);
  const ring=id==='police'?8:id==='fictional-forum'?4:3+Math.floor(slot/6)*2;
  const angle=id==='police'?Math.PI+(slot-(wanted-1)/2)*.24:slot*2.39996+(id==='volunteers'?1:0);
  directives[body.id]={target:{x:group.to.x+Math.sin(angle)*ring,z:group.to.z+Math.cos(angle)*ring},district:group.to.district,activity:group.objective,speed:Math.min(4.2,2*group.pace*(/retreat|regroup|contain-confrontation/.test(group.objective)?1.35:1)),gesture:id==='police'?'point':id==='volunteers'?'offer':id==='fictional-forum'?'point':/retreat|regroup|disperse/.test(group.objective)?'listen':'wave'};
 }
 return {directives,allowed,desiredCount:allowed.length};
}
export const STREET_REACTIONS={
 quiet:['Chai pehle. Revolution ka calendar baad mein.','Tu location bhej. Live location nahi, landmark bol.'],
 arrivals:['Metro waale aa gaye. Arre apna dost kahan hai?','Group photo? Bhai pehle group toh milne de.'],
 assembly:['Mic pe kaun hai? Peechhe kuch sun nahi raha.','Bhai slogan same rakho. Hum alag verse gaa rahe hain.'],
 contested:['Yeh naye bhaiya sabko aage kyun bhej rahe hain?','Camera idhar hai aur baat udhar. Classic.'],
 confrontation:['Peechhe jagah do. Dhakka mat do yaar.','Mera haath pakad. Phone baad mein dekh lena.'],
 recovery:['Sab hain? Naam bolo, thumbs-up se kaam nahi chalega.','Chai thandi ho gayi. Tu aa gaya, woh theek hai.'],
 dispersal:['Ghar pahunch ke text kar. Sirf meme mat bhejna.','Speaker kiska tha? Bhai koi toh yaad karo.']
};
