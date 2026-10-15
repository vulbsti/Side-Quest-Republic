import {DISTRICTS,STORY_ANCHORS} from './districts.js?v=23';
/** Small original-fiction street activities. Every directive is an intention for
 * the runtime collision router; every line is invented, never a real quotation.
 * Runtime priorities: scene/follow > incident/crisis > ambient. No body mutation.
 */
const clone=v=>JSON.parse(JSON.stringify(v)),distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const free=b=>b&&!b.shop&&!b.hidden&&!b.sceneTarget&&!b.follow&&!b.incidentOwned&&!b.crisisOwned&&!b.police&&b.cohort!=='police'&&b.id!=='player'&&Number.isFinite(b.x)&&Number.isFinite(b.z);
const sight=(a,b,o)=>free(a)&&free(b)&&typeof o.canSee==='function'&&o.canSee(a,b)===true;
const hash=(seed,id)=>{let h=Number(seed)>>>0;for(const c of String(id))h=(Math.imul(h,31)+c.charCodeAt(0))>>>0;return h;};
const district=b=>DISTRICTS.find(d=>d.id===b.district)?.id||[...DISTRICTS].sort((a,c)=>distance(a,b)-distance(c,b))[0].id;
const pos=b=>({x:b.x,z:b.z});
function getState(w){return w.ambientEvents||(w.ambientEvents={version:1,seed:w.seed,clock:Number(w.time)||0,nextAt:60,sequence:0,round:0,active:[],history:[]});}
function emit(s,w,e,type,lines=[],extra={}){const event={id:`ambient-${s.seed}-${++s.sequence}`,type,time:w.time,activityId:e.id,activity:e.kind,district:e.district,position:clone(e.origin),actorIds:[...e.actorIds],fictional:true,lines,...extra};s.history.push(event);if(s.history.length>120)s.history.shift();return event;}
function standOff(a,b,r=1.1){const dx=a.x-b.x,dz=a.z-b.z,len=Math.hypot(dx,dz)||1;return {x:b.x+dx/len*r,z:b.z+dz/len*r};}
function choice(s,w,anchor,near){
 const types=['chant-circle','friend-reunion','volunteer-water-run',...(w.time>=450?['intermediary-beckon']:[])];
 const shift=hash(s.seed,`${s.round}:${anchor.id}`)%types.length;
 for(let n=0;n<types.length;n++){
  const kind=types[(n+shift)%types.length];
  if(kind==='chant-circle'&&near.length>=3)return {kind,people:near.slice(0,Math.min(5,near.length)),duration:13};
  if(kind==='friend-reunion'){const friend=near.slice(1).find(p=>distance(near[0],p)>=2);if(friend)return {kind,people:[near[0],friend],duration:12};}
  if(kind==='intermediary-beckon'&&near.length>=4)return {kind,people:near.slice(0,4),duration:14};
  if(kind==='volunteer-water-run'&&near.length>=2&&near.some(p=>(p.cohort==='volunteers'||p.role==='volunteer')&&distance(p,STORY_ANCHORS.waterStore)<=10)){
   const runner=near.find(p=>(p.cohort==='volunteers'||p.role==='volunteer')&&distance(p,STORY_ANCHORS.waterStore)<=10);return {kind,people:[runner,near.find(p=>p.id!==runner.id)],duration:16};
  }
 }
 return null;
}
function build(s,w,c){
 const [leader,...others]=c.people,e={id:`activity-${s.seed}-${s.round}-${leader.id}`,kind:c.kind,district:district(leader),origin:pos(leader),actorIds:c.people.map(p=>p.id),elapsed:0,duration:c.duration,phase:'gather',leaderId:leader.id,orders:[],returnOrders:[],arrived:false};
 for(const person of c.people)e.returnOrders.push({actorId:person.id,objective:'ambient-release-step',to:pos(person),gesture:'listen',speed:1.2});
 if(c.kind==='chant-circle'){
  e.orders.push({actorId:leader.id,objective:'start-chant',to:pos(leader),gesture:'point',speed:1.1});
  others.forEach((p,i)=>{const angle=i/(others.length)*Math.PI*2;e.orders.push({actorId:p.id,objective:'join-chant-circle',to:{x:leader.x+Math.cos(angle)*2,z:leader.z+Math.sin(angle)*2},faceId:leader.id,gesture:'wave',speed:1.6});});
  e.lines=['Leader: Ek baar saath mein!','Someone: Bhai rhythm toh decide kar le.'];
 }else if(c.kind==='friend-reunion'){
  const friend=others[0];e.targetId=friend.id;e.orders=[{actorId:leader.id,objective:'run-to-visible-friend',to:standOff(leader,friend),faceId:friend.id,gesture:'listen',speed:4.2},{actorId:friend.id,objective:'signal-lost-friend',to:pos(friend),faceId:leader.id,gesture:'wave',speed:.8}];e.lines=['Friend: Oye idhar! Main yahin hoon.','Runner: Tera “bas saamne” alag district hai kya?'];
 }else if(c.kind==='intermediary-beckon'){
  const h=w.escalation?.hotspot||leader,dx=h.x-leader.x,dz=h.z-leader.z,len=Math.hypot(dx,dz)||1,to={x:leader.x+dx/len*4,z:leader.z+dz/len*4};
  e.orders=[{actorId:leader.id,objective:'beckon-toward-gathering',to,gesture:'wave',speed:1.6},...others.slice(0,2).map((p,i)=>({actorId:p.id,objective:'consider-following-call',to:{x:to.x+(i?1.1:-1.1),z:to.z+1.2},faceId:leader.id,gesture:'listen',speed:1.4})),{actorId:others[2].id,objective:'refuse-beckoning',to:pos(others[2]),faceId:leader.id,gesture:'shrug',speed:.8}];
  e.lines=['Intermediary: Udhar aa jao, crowd ban raha hai.','Neighbour: Pehle bata tu hai kaun?'];
 }else{
  e.orders=[{actorId:leader.id,objective:'run-to-water-store',to:pos(STORY_ANCHORS.waterStore),gesture:'listen',speed:3.2},{actorId:others[0].id,objective:'wait-for-water-runner',to:pos(others[0]),faceId:leader.id,gesture:'listen',speed:.8}];e.lines=['Volunteer: Paani counter kidhar tha?','Neighbour: Wahi. Sprint mat kar, Olympics nahi hai.'];
 }
 return e;
}
/** Start up to three physically separate local activities every25–40 simulation
 * seconds after60s. Each lasts12–16s; events finish independently. Timers are dt
 * based, no setTimeouts. Call every simulation frame; return events are emit-once.
 */
export function updateAmbient(world,bodies,dt,{canSee}={}){
 const s=getState(world),o={canSee},step=Math.max(0,Math.min(1,Number(dt)||0)),events=[];s.clock+=step;
 if(world.finished){s.active=[];return {state:s,directives:[],events,effects:[]};}
 for(const e of [...s.active]){
  const people=e.actorIds.map(id=>bodies.find(b=>b.id===id));
  if(people.some(p=>!free(p))){events.push(emit(s,world,e,'ambient-interrupted',[],{reason:'A participant became unavailable or a higher priority action took ownership.'}));s.active=s.active.filter(a=>a.id!==e.id);continue;}
  e.elapsed+=step;
  if(e.kind==='intermediary-beckon'&&e.elapsed>=4&&people.every(p=>distance(p,e.orders.find(d=>d.actorId===p.id).to)<=1))e.arrived=true;
  if(e.kind==='chant-circle'&&e.elapsed>=4&&people.slice(1).every(p=>distance(p,people[0])<=3&&sight(p,people[0],o)))e.arrived=true;
  if(e.kind==='friend-reunion'&&distance(people[0],people[1])<=1.6&&sight(people[0],people[1],o))e.arrived=true;
  if(e.kind==='volunteer-water-run'&&distance(people[0],STORY_ANCHORS.waterStore)<=1.2)e.arrived=true;
  if(e.elapsed>=e.duration){events.push(emit(s,world,e,'ambient-finished',[],{arrived:e.arrived,completed:e.arrived}));s.active=s.active.filter(a=>a.id!==e.id);continue;}
  if(e.kind==='chant-circle'&&e.elapsed>=10)e.phase='disperse';
 }
 // world.time gates opening; clock schedules future waves even when loaded late.
 if(world.time>=60&&s.clock>=s.nextAt){
  s.round++;s.nextAt=s.clock+25+hash(s.seed,s.round)%16;
  const used=new Set(s.active.flatMap(e=>e.actorIds)),usedDistricts=new Set(s.active.map(e=>e.district));
  const anchors=bodies.filter(free).sort((a,b)=>hash(s.seed,`${s.round}:${a.id}`)-hash(s.seed,`${s.round}:${b.id}`)||a.id.localeCompare(b.id));
  for(const anchor of anchors){
   if(s.active.length>=3)break;const d=district(anchor);if(used.has(anchor.id)||usedDistricts.has(d))continue;
   const near=[anchor,...anchors.filter(p=>p.id!==anchor.id&&!used.has(p.id)&&district(p)===d&&distance(p,anchor)<=8&&sight(p,anchor,o))];
   if(near.length<2)continue;const c=choice(s,world,anchor,near);if(!c)continue;
   const e=build(s,world,c);s.active.push(e);for(const id of e.actorIds)used.add(id);usedDistricts.add(d);events.push(emit(s,world,e,'ambient-start',e.lines));
  }
 }
 const directives=s.active.flatMap(e=>(e.phase==='disperse'?e.returnOrders:e.orders).map(d=>({...d,ambientId:e.id,sourceEventId:s.history.find(h=>h.activityId===e.id&&h.type==='ambient-start')?.id})));
 return {state:s,directives:clone(directives),events,effects:[]};
}
