import {WORLD_BOUNDS} from './districts.js?v=23';
/** Authored fictional crowd-control wave. This module emits physical intentions,
 * never damage, position writes, affiliation-based suspicion or automatic arrests.
 * Runtime must route every `to` through collision/navigation and honour ownership.
 * Bodies use {id,x,z,police?,cohort?,hidden?,sceneTarget?,follow?,incidentOwned?}.
 * Missing geometry fails closed. Persist world.crowdCrisis with the world save.
 */
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),clone=x=>JSON.parse(JSON.stringify(x));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const isPolice=b=>b.police||b.cohort==='police';
const eligible=b=>b&&!b.hidden&&!b.sceneTarget&&!b.follow&&!b.incidentOwned&&Number.isFinite(b.x)&&Number.isFinite(b.z);
const see=(a,b,o)=>eligible(a)&&eligible(b)&&typeof o.canSee==='function'&&o.canSee(a,b)===true;
const point=(x,z)=>({x:clamp(x,WORLD_BOUNDS.minX+.8,WORLD_BOUNDS.maxX-.8),z:clamp(z,WORLD_BOUNDS.minZ+.8,WORLD_BOUNDS.maxZ-.8)});
const mean=arr=>({x:arr.reduce((n,a)=>n+a.x,0)/arr.length,z:arr.reduce((n,a)=>n+a.z,0)/arr.length});
const offset=(a,from,length)=>{let dx=a.x-from.x,dz=a.z-from.z,d=Math.hypot(dx,dz);if(d<.01){dx=1;dz=0;d=1;}return point(a.x+dx/d*length,a.z+dz/d*length);};
const hash=(seed,id)=>{let h=Number(seed)>>>0;for(const c of id)h=(Math.imul(h,31)+c.charCodeAt(0))>>>0;return h;};
function state(world){return world.crowdCrisis||(world.crowdCrisis={version:1,seed:world.seed,status:'waiting',wave:0,stageTime:0,sequence:0,history:[],orders:[],interventionOrders:[],policeIds:[],civilianIds:[],actions:[],playerRiskRecorded:false});}
function local(world,bodies,o){const h=world.escalation?.hotspot;if(!h)return null;const nearby=bodies.filter(b=>eligible(b)&&b.id!=='player'&&distance(b,h)<=18),police=nearby.filter(isPolice),civilians=nearby.filter(b=>!isPolice(b)&&police.some(p=>distance(p,b)<=14&&see(p,b,o)));if(police.length<2||civilians.length<3)return null;return {police,civilians,center:mean(civilians),line:mean(police),hotspot:h};}
function event(s,world,bodies,o,type,description,extra={}){const origin=s.center,ids=bodies.filter(b=>eligible(b)&&distance(b,origin)<=16&&s.policeIds.some(id=>{const p=bodies.find(b=>b.id===id);return p&&see(b,p,o);})).map(b=>b.id).sort();const e={id:`crowd-wave-${s.seed}-${s.wave}-${++s.sequence}`,type,time:world.time,district:s.district,position:clone(origin),description,witnessIds:ids,fictional:true,...extra};s.history.push(e);return e;}
function nearbyPlayer(s,bodies,o){const player=bodies.find(b=>b.id==='player');if(!eligible(player))return null;const police=bodies.filter(b=>eligible(b)&&s.policeIds.includes(b.id));return police.some(p=>distance(p,player)<=6&&see(player,p,o))?player:null;}
function options(s,bodies,o){if(!['warning','advance','scatter'].includes(s.status)||!nearbyPlayer(s,bodies,o))return [];return [...(!s.actions.includes('keep-passage')?['keep-passage']:[]),...(!s.actions.includes('rally')?['rally']:[]),'leave'];}
function output(s,bodies,o,events=[],effects=[]){const active=['warning','advance','scatter','regroup'].includes(s.status),overrides=active?(s.interventionOrders||[]):[],orders=active?[...s.orders.filter(d=>!overrides.some(x=>x.actorId===d.actorId)),...overrides].filter(d=>eligible(bodies.find(b=>b.id===d.actorId))):[];return {state:s,directives:clone(orders),events,effects,options:options(s,bodies,o)};}
function beginStage(s,status){s.status=status;s.stageTime=0;s.orders=[];}
function orders(s,world,bodies,o){
 const police=bodies.filter(b=>eligible(b)&&s.policeIds.includes(b.id));
 const civilians=bodies.filter(b=>eligible(b)&&s.civilianIds.includes(b.id));
 if(!police.length)return;
 const line=mean(police),forward={x:s.center.x-line.x,z:s.center.z-line.z},length=Math.hypot(forward.x,forward.z)||1,ux=forward.x/length,uz=forward.z/length;
 for(const officer of police){
  const actor=world.actors?.[officer.id],duty=actor?.values?.duty??70,fear=actor?.needs?.fear??20;
  const hesitant=hash(s.seed,officer.id)%100>duty-fear*.2;
  const advance=s.status==='advance'&&!hesitant;
  s.orders.push({actorId:officer.id,objective:advance?'line-advance':s.status==='regroup'?'open-regroup-exit':hesitant?'hesitate-and-hold':'hold-police-line',to:advance?point(officer.x+ux*6,officer.z+uz*6):point(officer.x,officer.z),gesture:advance?'lathi-charge':s.status==='warning'?'point':'listen',speed:advance?3.3:.9,reason:{duty,fear,hesitant},automaticDetention:false});
 }
 for(const person of civilians){
  // Only those who currently see a physical officer react to this stage.
  const source=police.find(p=>distance(p,person)<=16&&see(person,p,o));if(!source)continue;
  const style=hash(s.seed,person.id)%4,volunteer=person.cohort==='volunteers'||world.actors?.[person.id]?.role==='volunteer';
  let objective='watch-warning',gesture='listen',to=point(person.x,person.z),speed=.8;
  if(s.status==='advance'||s.status==='scatter'){
   if(volunteer){objective='guide-companion-away';to=offset(person,line,6);gesture='wave';speed=3.0;}
   else if(style===0){objective='film-police-line';gesture='phone-record';}
   else if(style===1&&s.status==='advance'){objective='hesitate-at-line';gesture='shrug';}
   else {objective='scatter-from-line';to=offset(person,line,6);speed=4.6;}
  }else if(s.status==='regroup'){objective=volunteer?'check-companions':'regroup-after-wave';to=offset(person,s.line,3);gesture=volunteer?'wave':'listen';speed=1.1;}
  s.orders.push({actorId:person.id,objective,to,gesture,speed,faceId:['watch-warning','film-police-line','hesitate-at-line'].includes(objective)?source.id:undefined,sourceWave:s.wave});
 }
}
/** One finite wave: warning8s -> advance3s -> scatter8s -> regroup10s
 * -> cooldown100s. At most two waves before1100s, second only at intensity>=80.
 * All clocks use caller's simulation dt, clamped1s to avoid wall-time catch-up.
 */
export function updateCrisis(world,bodies,dt,{canSee}={}){
 const o={canSee},s=state(world),events=[],effects=[],step=clamp(Number(dt)||0,0,1);
 if(world.finished){s.status='complete';s.orders=[];return output(s,bodies,o);}
 if(s.status==='waiting'||s.status==='cooldown'){
  if(s.status==='cooldown'){s.stageTime+=step;if(s.stageTime<100)return output(s,bodies,o);}
  if(s.wave>=2||world.time>=1100){s.status='complete';return output(s,bodies,o);}
  const intensity=world.escalation?.intensity||0,command=world.institutions?.command?.pressure||0;
  if(world.time<(s.wave?720:540)||intensity<(s.wave?80:45)||command<35)return output(s,bodies,o);
  const group=local(world,bodies,o);if(!group)return output(s,bodies,o);
  s.wave++;s.center=clone(group.center);s.line=clone(group.line);s.district=group.hotspot.district;s.policeIds=group.police.map(b=>b.id);s.civilianIds=group.civilians.map(b=>b.id);s.actions=[];s.interventionOrders=[];s.playerRiskRecorded=false;s.playerContactRecorded=false;beginStage(s,'warning');orders(s,world,bodies,o);
  events.push(event(s,world,bodies,o,'crisis-warning','A local police line warns the gathering to move back.',{policeIds:[...s.policeIds],intensity,commandPressure:command}));return output(s,bodies,o,events,effects);
 }
 if(s.status==='complete')return output(s,bodies,o);
 const present=bodies.filter(b=>eligible(b)&&s.policeIds.includes(b.id)&&distance(b,s.center)<=24);
 if(present.length<2){beginStage(s,'cooldown');events.push(event(s,world,bodies,o,'crisis-line-broken','The police formation separates; this wave stops.'));return output(s,bodies,o,events,effects);}
 if(s.status==='warning'&&!bodies.some(b=>eligible(b)&&s.civilianIds.includes(b.id)&&present.some(p=>distance(p,b)<=16&&see(p,b,o)))){beginStage(s,'cooldown');events.push(event(s,world,bodies,o,'crisis-crowd-cleared','The local crowd moved away before the warning became an advance.'));return output(s,bodies,o,events,effects);}
 s.stageTime+=step;
 const durations={warning:8,advance:3,scatter:8,regroup:10};
 if(s.stageTime>=durations[s.status]){
  const next={warning:'advance',advance:'scatter',scatter:'regroup',regroup:'cooldown'}[s.status];beginStage(s,next);if(next!=='cooldown')orders(s,world,bodies,o);
  const descriptions={advance:'Some officers advance with raised batons while others hold back. No individual is automatically identified as an offender.',scatter:'Nearby people split: some move away, some film, volunteers try to keep companions together.',regroup:'The wave loses momentum. Small groups check who is still with them.',cooldown:'The line pauses; the street continues around it.'};
  const e=event(s,world,bodies,o,`crisis-${next}`,descriptions[next]);events.push(e);if(next==='advance')effects.push({type:'tension',district:s.district,value:7,eventId:e.id});
 }
 const player=nearbyPlayer(s,bodies,o);
 if(s.status==='advance'&&player&&!s.playerRiskRecorded){s.playerRiskRecorded=true;events.push(event(s,world,bodies,o,'crisis-player-near-line','The player is physically close to the advancing line; moving away remains possible.',{actorId:'player',position:point(player.x,player.z),damage:0}));}
 if(s.status==='advance'&&player&&!s.playerContactRecorded){const officer=bodies.find(b=>s.orders.some(d=>d.actorId===b.id&&d.objective==='line-advance')&&eligible(b)&&distance(b,player)<1.2&&see(b,player,o));if(officer){s.playerContactRecorded=true;events.push(event(s,world,bodies,o,'crisis-player-contact','The advancing line reaches the player, causing a brief stumble.',{actorId:'player',officerId:officer.id,position:point(player.x,player.z)}));}}
 return output(s,bodies,o,events,effects);
}
/** These are concrete local interventions, not remote moral-score buttons. */
export function actCrisis(world,bodies,choice,{canSee}={}){
 const o={canSee},s=state(world);
 if(!options(s,bodies,o).includes(choice))return {ok:false,reason:'Move near a visible active police line to intervene.',...output(s,bodies,o)};
 const player=nearbyPlayer(s,bodies,o),events=[],effects=[];
 if(choice==='leave'){events.push(event(s,world,bodies,o,'crisis-player-declines','The player declines to intervene; the crowd wave continues.',{actorId:'player'}));return {ok:true,...output(s,bodies,o,events,effects)};}
 s.actions.push(choice);
 const e=event(s,world,bodies,o,choice==='keep-passage'?'crisis-passage':'crisis-rally',choice==='keep-passage'?'The player calls nearby people toward a clear passage; reaching it still requires physical movement.':'The player calls the nearby group to hold together; only people who hear and see this local intervention react.',{actorId:'player',position:point(player.x,player.z)});events.push(e);
 const responding=bodies.filter(b=>eligible(b)&&b.id!=='player'&&!isPolice(b)&&distance(b,player)<=6&&see(b,player,o));
 for(const person of responding){const to=choice==='keep-passage'?offset(person,s.line,4):point(person.x,person.z),order={actorId:person.id,objective:choice==='keep-passage'?'use-safe-passage':'rally-with-neighbours',to,gesture:choice==='keep-passage'?'wave':'point',speed:choice==='keep-passage'?1.8:.8,sourceEventId:e.id};s.interventionOrders=(s.interventionOrders||[]).filter(d=>d.actorId!==person.id);s.interventionOrders.push(order);}
 effects.push({type:'tension',district:s.district,value:choice==='keep-passage'?-5:4,eventId:e.id});
 return {ok:true,...output(s,bodies,o,events,effects)};
}
