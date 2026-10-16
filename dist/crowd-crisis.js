import {WORLD_BOUNDS} from './districts.js?v=25';
/** Authored fictional crowd-control wave. This module emits physical intentions,
 * never damage, position writes, affiliation-based suspicion or automatic arrests.
 * Runtime must route every `to` through collision/navigation and honour ownership.
 * Bodies use {id,x,z,police?,cohort?,hidden?,sceneTarget?,follow?,incidentOwned?}.
 * Missing geometry fails closed. Persist world.crowdCrisis with the world save.
 */
export const CRISIS_DURATIONS=Object.freeze({warning:18,advance:12,scatter:22,regroup:28});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),clone=x=>JSON.parse(JSON.stringify(x));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const isPolice=b=>b.police||b.cohort==='police';
const eligible=b=>b&&!b.shop&&!b.hidden&&!b.sceneTarget&&!b.follow&&!b.incidentOwned&&Number.isFinite(b.x)&&Number.isFinite(b.z);
const see=(a,b,o)=>eligible(a)&&eligible(b)&&typeof o.canSee==='function'&&o.canSee(a,b)===true;
const point=(x,z)=>({x:clamp(x,WORLD_BOUNDS.minX+.8,WORLD_BOUNDS.maxX-.8),z:clamp(z,WORLD_BOUNDS.minZ+.8,WORLD_BOUNDS.maxZ-.8)});
const mean=arr=>({x:arr.reduce((n,a)=>n+a.x,0)/arr.length,z:arr.reduce((n,a)=>n+a.z,0)/arr.length});
const offset=(a,from,length)=>{let dx=a.x-from.x,dz=a.z-from.z,d=Math.hypot(dx,dz);if(d<.01){dx=1;dz=0;d=1;}return point(a.x+dx/d*length,a.z+dz/d*length);};
const hash=(seed,id)=>{let h=Number(seed)>>>0;for(const c of id)h=(Math.imul(h,31)+c.charCodeAt(0))>>>0;return h;};
function state(world){return world.crowdCrisis||(world.crowdCrisis={version:1,seed:world.seed,status:'waiting',wave:0,stageTime:0,sequence:0,history:[],orders:[],interventionOrders:[],policeIds:[],civilianIds:[],actions:[],playerRiskRecorded:false});}
function local(world,bodies,o){const h=world.escalation?.hotspot;if(!h)return null;const nearby=bodies.filter(b=>eligible(b)&&b.id!=='player'&&distance(b,h)<=18),police=nearby.filter(isPolice),civilians=nearby.filter(b=>!isPolice(b)&&police.some(p=>distance(p,b)<=14&&see(p,b,o)));if(police.length<2||civilians.length<3)return null;return {police,civilians,center:mean(civilians),line:mean(police),hotspot:h};}
function event(s,world,bodies,o,type,description,extra={}){const origin=s.center,ids=bodies.filter(b=>eligible(b)&&distance(b,origin)<=16&&s.policeIds.some(id=>{const p=bodies.find(b=>b.id===id);return p&&see(b,p,o);})).map(b=>b.id).sort();const e={id:`crowd-wave-${s.seed}-${s.wave}-${++s.sequence}`,type,time:world.time,district:s.district,position:clone(origin),description,witnessIds:ids,fictional:true,...extra};s.history.push(e);return e;}
function nearbyPlayer(s,bodies,o){const player=bodies.find(b=>b.id==='player');if(!eligible(player))return null;const police=bodies.filter(b=>eligible(b)&&s.policeIds.includes(b.id));return police.some(p=>distance(p,player)<=6&&see(player,p,o))?player:null;}
function interventionPlayer(s,bodies,o){const player=bodies.find(b=>b.id==='player');if(!eligible(player))return null;const localWitness=bodies.some(b=>eligible(b)&&!isPolice(b)&&b.id!=='player'&&s.civilianIds.includes(b.id)&&distance(b,player)<=6&&see(player,b,o));const visibleLine=bodies.some(b=>eligible(b)&&s.policeIds.includes(b.id)&&distance(b,player)<=16&&see(player,b,o));return localWitness&&visibleLine?player:null;}
function options(s,bodies,o){if(!['warning','advance','scatter'].includes(s.status)||!interventionPlayer(s,bodies,o))return [];return [...(!s.actions.includes('keep-passage')?['keep-passage']:[]),...(!s.actions.includes('rally')?['rally']:[]),'leave'];}
function output(s,bodies,o,events=[],effects=[]){const active=['warning','advance','scatter','regroup','cooldown'].includes(s.status),overrides=active?(s.interventionOrders||[]):[],orders=active?[...s.orders.filter(d=>!overrides.some(x=>x.actorId===d.actorId)),...overrides].filter(d=>eligible(bodies.find(b=>b.id===d.actorId))):[];s.lastPositions=Object.fromEntries(bodies.filter(eligible).map(b=>[b.id,point(b.x,b.z)]));return {state:s,directives:clone(orders.map(d=>s.status==='advance'&&d.reactionDelay>s.stageTime?{...d,objective:'assess-escape-route',to:d.waitingAt,gesture:'listen',speed:.8}:d)),events,effects,options:options(s,bodies,o)};}
function beginStage(s,status){s.status=status;s.stageTime=0;s.orders=[];}
function orders(s,world,bodies,o){
 const police=bodies.filter(b=>eligible(b)&&s.policeIds.includes(b.id));
 const civilians=bodies.filter(b=>eligible(b)&&s.civilianIds.includes(b.id));
 if(!police.length)return;
 const line=mean(police),forward={x:s.center.x-line.x,z:s.center.z-line.z},length=Math.hypot(forward.x,forward.z)||1,ux=forward.x/length,uz=forward.z/length;
 for(const officer of police){
  const actor=world.actors?.[officer.id],duty=actor?.values?.duty??70,fear=actor?.needs?.fear??20;
  const pressure=world.institutions?.command?.pressure??0;
  const hesitant=hash(s.seed,officer.id)%100>clamp(duty-fear*.2+(pressure-65)*.25,5,95);
  const advance=s.status==='advance'&&!hesitant;
  const neighbour=hesitant&&['advance','scatter'].includes(s.status)?civilians.filter(b=>distance(b,officer)<=8&&see(officer,b,o)).sort((a,b)=>distance(a,officer)-distance(b,officer))[0]:null;
  // Holding an order and making space are distinct visible choices. The officer
  // only yields to a person they can actually see; no remote faction knowledge.
  const side=hash(s.seed,officer.id)%2?1:-1;
  const target=advance?point(officer.x+ux*6,officer.z+uz*6):neighbour?point(officer.x-uz*side*2.4,officer.z+ux*side*2.4):point(officer.x,officer.z);
  s.orders.push({actorId:officer.id,objective:advance?'line-advance':s.status==='regroup'?'open-regroup-exit':hesitant?'hesitate-and-hold':'hold-police-line',to:target,gesture:advance?'lathi-charge':neighbour?'wave':s.status==='warning'?'point':'listen',speed:advance?3.3:neighbour?1.5:.9,reason:{duty,fear,commandPressure:pressure,hesitant,yieldingTo:neighbour?.id},automaticDetention:false});
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
  }else if(s.status==='regroup'){objective=volunteer?'check-companions':'regroup-after-wave';to=point(person.x,person.z);gesture=volunteer?'wave':'listen';speed=1.1;}
  s.orders.push({actorId:person.id,objective,to,gesture,speed,faceId:['watch-warning','film-police-line','hesitate-at-line'].includes(objective)?source.id:undefined,sourceWave:s.wave,...(s.status==='advance'&&['scatter-from-line','guide-companion-away'].includes(objective)?{reactionDelay:style===3?2:0,waitingAt:point(person.x,person.z)}:{})});
 }
}
/** A visible retreat travels person to person, not instantly across the map.
 * Snapshot sources before recruiting so a single tick cannot flood a crowd.
 * Each destination is fixed once; navigation remains the runtime's job.
 */
function spreadReaction(s,world,bodies,o,dt,events){
 if(!['advance','scatter'].includes(s.status))return;
 s.reactionClock=(s.reactionClock||0)+dt;if(s.reactionClock<.7)return;s.reactionClock=0;
 const police=bodies.filter(b=>eligible(b)&&s.policeIds.includes(b.id));
 const held=new Set((s.interventionOrders||[]).map(d=>d.actorId));
 // A confident filmer can change their mind when an advancing officer actually
 // reaches them. Role/personality is not an immunity to physical proximity.
 for(const order of s.orders){
  if(!['film-police-line','hesitate-at-line'].includes(order.objective)||held.has(order.actorId))continue;
  const person=bodies.find(b=>b.id===order.actorId);if(!eligible(person))continue;
  const officer=police.find(p=>distance(p,person)<3&&see(person,p,o)&&s.orders.some(d=>d.actorId===p.id&&d.objective==='line-advance'));
  if(officer){Object.assign(order,{objective:'back-away-from-close-line',to:offset(person,officer,5),gesture:'listen',speed:4.3,faceId:undefined});events.push(event(s,world,bodies,o,'crisis-confidence-breaks','A nearby filmer lowers their phone and backs away as the advancing line reaches them.',{actorId:person.id,officerId:officer.id,position:point(person.x,person.z),witnessIds:[person.id,officer.id]}));}
 }
 const sources=s.orders.filter(d=>['scatter-from-line','back-away-from-close-line','follow-visible-retreat'].includes(d.objective)).map(d=>({order:d,body:bodies.find(b=>b.id===d.actorId)})).filter(v=>eligible(v.body)&&distance(v.body,v.order.to)>.8&&s.lastPositions?.[v.body.id]&&distance(v.body,s.lastPositions[v.body.id])>.003);
 const known=new Set([...s.orders.map(d=>d.actorId),...held]);
 const candidates=bodies.filter(b=>eligible(b)&&b.id!=='player'&&!isPolice(b)&&!known.has(b.id)&&distance(b,s.center)<=32).sort((a,b)=>a.id.localeCompare(b.id));
 let recruited=0;s.spreadCount=s.spreadCount||0;
 for(const person of candidates){
  if(recruited>=2||s.spreadCount>=18)break;
  const witness=sources.find(v=>distance(v.body,person)<=7&&see(person,v.body,o));if(!witness)continue;
  const nearest=police.filter(p=>distance(p,person)<=16&&see(person,p,o)).sort((a,b)=>distance(a,person)-distance(b,person))[0];
  const dx=witness.order.to.x-witness.body.x,dz=witness.order.to.z-witness.body.z,len=Math.hypot(dx,dz)||1;
  const to=nearest?offset(person,nearest,6):point(person.x+dx/len*5,person.z+dz/len*5);
  s.orders.push({actorId:person.id,objective:'follow-visible-retreat',to,gesture:'listen',speed:4.2,sourceWave:s.wave,reason:{observedActorId:witness.body.id,observedPosition:point(witness.body.x,witness.body.z),directPoliceSight:!!nearest}});
  s.civilianIds.push(person.id);s.spreadCount++;recruited++;
  events.push(event(s,world,bodies,o,'crisis-retreat-spreads','A neighbour sees people retreating and joins their movement; they do not gain knowledge of unseen events.',{actorId:person.id,observedActorId:witness.body.id,position:point(person.x,person.z),witnessIds:[person.id,witness.body.id]}));
 }
}
function settleRetreats(s,bodies,o){
 // A destination is an area a body can occupy, not an exact point to fight
 // neighbours over. Once safely within it, stop steering against separation.
 const retreating=new Set(['scatter-from-line','back-away-from-close-line','follow-visible-retreat','guide-companion-away','use-safe-passage']);
 for(const order of [...s.orders,...(s.interventionOrders||[])]){
  if(!retreating.has(order.objective)||order.arrived)continue;
  const body=bodies.find(b=>b.id===order.actorId);
  if(eligible(body)&&distance(body,order.to)<=.85&&see(body,order.to,o)){
   order.arrived=true;order.to=point(body.x,body.z);order.speed=0;order.gesture='listen';
  }
 }
}
function preserveAftermath(s,bodies){
 // Freeze actual occupied locations, not original assembly slots or an unseen
 // ideal regroup point. Every person keeps their own recovery location.
 s.orders=s.orders.filter(d=>eligible(bodies.find(b=>b.id===d.actorId))).map(d=>{const b=bodies.find(b=>b.id===d.actorId);return {...d,objective:isPolice(b)?'hold-cleared-position':b.cohort==='volunteers'?'check-companions':'recover-after-wave',to:point(b.x,b.z),gesture:b.cohort==='volunteers'?'wave':'listen',speed:.8,faceId:undefined,reason:{...d.reason,aftermath:true,sourceWave:s.wave}};});
 s.interventionOrders=[];
}
/** One finite wave: warning18s -> advance12s -> scatter22s -> regroup28s
 * -> cooldown55–100s. At most four waves before1100s; renewed waves require
 * ongoing intensity>=65 and a physically reassembled line and crowd.
 * All clocks use caller's simulation dt, clamped1s to avoid wall-time catch-up.
 */
export function updateCrisis(world,bodies,dt,{canSee}={}){
 const o={canSee},s=state(world),events=[],effects=[],step=clamp(Number(dt)||0,0,1);
 if(world.finished){s.status='complete';s.orders=[];return output(s,bodies,o);}
 if(s.status==='waiting'||s.status==='cooldown'){
  if(s.status==='cooldown'){s.stageTime+=step;if(s.stageTime<(s.cooldownSeconds??100))return output(s,bodies,o);s.orders=[];s.interventionOrders=[];}
  if(s.wave>=4||world.time>=1100){s.status='complete';s.orders=[];return output(s,bodies,o);}
  const intensity=world.escalation?.intensity||0,command=world.institutions?.command?.pressure||0;
  if(world.time<(s.wave?720:540)||intensity<(s.wave?65:45)||command<35)return output(s,bodies,o);
  const group=local(world,bodies,o);if(!group)return output(s,bodies,o);
  s.wave++;s.center=clone(group.center);s.line=clone(group.line);s.district=group.hotspot.district;s.policeIds=group.police.map(b=>b.id);s.civilianIds=group.civilians.map(b=>b.id);s.actions=[];s.interventionOrders=[];s.spreadCount=0;s.reactionClock=0;s.cooldownSeconds=clamp(120-command,55,100);s.playerRiskRecorded=false;s.playerContactRecorded=false;beginStage(s,'warning');orders(s,world,bodies,o);
  events.push(event(s,world,bodies,o,'crisis-warning','A local police line warns the gathering to move back.',{policeIds:[...s.policeIds],intensity,commandPressure:command}));return output(s,bodies,o,events,effects);
 }
 if(s.status==='complete')return output(s,bodies,o);
 const present=bodies.filter(b=>eligible(b)&&s.policeIds.includes(b.id)&&distance(b,s.center)<=24);
 if(present.length<2){beginStage(s,'cooldown');events.push(event(s,world,bodies,o,'crisis-line-broken','The police formation separates; this wave stops.'));return output(s,bodies,o,events,effects);}
 if(s.status==='warning'&&!bodies.some(b=>eligible(b)&&s.civilianIds.includes(b.id)&&present.some(p=>distance(p,b)<=16&&see(p,b,o)))){beginStage(s,'cooldown');events.push(event(s,world,bodies,o,'crisis-crowd-cleared','The local crowd moved away before the warning became an advance.'));return output(s,bodies,o,events,effects);}
 s.stageTime+=step;
 const durations=CRISIS_DURATIONS;
 if(s.stageTime>=durations[s.status]){
  const next={warning:'advance',advance:'scatter',scatter:'regroup',regroup:'cooldown'}[s.status],previous=s.orders,retreating=s.orders.filter(d=>['follow-visible-retreat','scatter-from-line','back-away-from-close-line','guide-companion-away'].includes(d.objective));beginStage(s,next);if(next!=='cooldown')orders(s,world,bodies,o);else {s.orders=previous;preserveAftermath(s,bodies);}
  if(next==='scatter')for(const order of retreating)if(eligible(bodies.find(b=>b.id===order.actorId))){s.orders=s.orders.filter(d=>d.actorId!==order.actorId);s.orders.push(order);}
  // Do not send a fleeing body another six metres simply because a stage changed.
  if(next==='regroup')for(const person of bodies.filter(b=>eligible(b)&&s.civilianIds.includes(b.id))){if(!s.orders.some(d=>d.actorId===person.id))s.orders.push({actorId:person.id,objective:'regroup-after-wave',to:point(person.x,person.z),gesture:'listen',speed:.8,sourceWave:s.wave});}
  const descriptions={advance:'Some officers advance with raised batons while others hold back. No individual is automatically identified as an offender.',scatter:'Nearby people split: some move away, some film, volunteers try to keep companions together.',regroup:'The wave loses momentum. Small groups check who is still with them.',cooldown:'The line pauses; the street continues around it.'};
  const e=event(s,world,bodies,o,`crisis-${next}`,descriptions[next]);events.push(e);if(next==='advance')for(const order of s.orders.filter(d=>d.reason?.yieldingTo)){const officer=bodies.find(b=>b.id===order.actorId);events.push(event(s,world,bodies,o,'crisis-officer-yields','An officer steps aside for a nearby civilian instead of advancing with the line.',{actorId:order.actorId,civilianId:order.reason.yieldingTo,position:point(officer.x,officer.z),witnessIds:[order.actorId,order.reason.yieldingTo]}));}if(next==='advance')effects.push({type:'tension',district:s.district,value:7,eventId:e.id});
 }
 spreadReaction(s,world,bodies,o,step,events);
 settleRetreats(s,bodies,o);
 const player=nearbyPlayer(s,bodies,o);
 if(s.status==='advance'&&player&&!s.playerRiskRecorded){s.playerRiskRecorded=true;events.push(event(s,world,bodies,o,'crisis-player-near-line','The player is physically close to the advancing line; moving away remains possible.',{actorId:'player',position:point(player.x,player.z),damage:0}));}
 events.push(...sampleCrisisContact(world,bodies,o).events);
 return output(s,bodies,o,events,effects);
}
/** Cheap physical contact sampling, independently callable at physics frequency.
 * No clocks, directives, awareness or phase changes. Safe alongside updateCrisis:
 * the persisted wave flag makes contact emit once across both call sites.
 */
export function sampleCrisisContact(world,bodies,{canSee}={}){
 const s=world.crowdCrisis,events=[];
 if(!s||world.finished||s.status!=='advance'||s.playerContactRecorded)return {events,effects:[]};
 const player=bodies.find(b=>b.id==='player');if(!eligible(player))return {events,effects:[]};
 const advancing=new Set((s.orders||[]).filter(d=>d.objective==='line-advance').map(d=>d.actorId));
 const officer=bodies.find(b=>advancing.has(b.id)&&eligible(b)&&distance(b,player)<1.2&&see(b,player,{canSee}));
 if(officer){s.playerContactRecorded=true;events.push(event(s,world,bodies,{canSee},'crisis-player-contact','The advancing line reaches the player, causing a brief stumble.',{actorId:'player',officerId:officer.id,position:point(player.x,player.z)}));}
 return {events,effects:[]};
}
/** These are concrete local interventions, not remote moral-score buttons. */
export function actCrisis(world,bodies,choice,{canSee}={}){
 const o={canSee},s=state(world);
 if(!options(s,bodies,o).includes(choice))return {ok:false,reason:'Move beside nearby witnesses who can hear you, with the active line in sight.',...output(s,bodies,o)};
 const player=interventionPlayer(s,bodies,o),events=[],effects=[];
 if(choice==='leave'){events.push(event(s,world,bodies,o,'crisis-player-declines','The player declines to intervene; the crowd wave continues.',{actorId:'player'}));return {ok:true,...output(s,bodies,o,events,effects)};}
 s.actions.push(choice);s.cooldownSeconds=clamp((s.cooldownSeconds??100)+(choice==='keep-passage'?20:-10),55,120);
 const e=event(s,world,bodies,o,choice==='keep-passage'?'crisis-passage':'crisis-rally',choice==='keep-passage'?'The player calls nearby people toward a clear passage; reaching it still requires physical movement.':'The player calls the nearby group to hold together; only people who hear and see this local intervention react.',{actorId:'player',position:point(player.x,player.z)});events.push(e);
 const responding=bodies.filter(b=>eligible(b)&&b.id!=='player'&&!isPolice(b)&&distance(b,player)<=6&&see(b,player,o));
 for(const person of responding){const to=choice==='keep-passage'?offset(person,s.line,4):point(person.x,person.z),order={actorId:person.id,objective:choice==='keep-passage'?'use-safe-passage':'rally-with-neighbours',to,gesture:choice==='keep-passage'?'wave':'point',speed:choice==='keep-passage'?1.8:.8,sourceEventId:e.id};s.interventionOrders=(s.interventionOrders||[]).filter(d=>d.actorId!==person.id);s.interventionOrders.push(order);}
 effects.push({type:'tension',district:s.district,value:choice==='keep-passage'?-5:4,eventId:e.id});
 return {ok:true,...output(s,bodies,o,events,effects)};
}
