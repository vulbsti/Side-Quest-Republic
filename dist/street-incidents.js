/** Original fictional street incident, driven by physically present bodies.
 * This module never moves a body, infers affiliation as police knowledge, or
 * supplies animation impulses. The runtime must follow directives through its
 * collision/path system and present emitted actions. Persist world.streetIncident.
 * bodies: {id,x,z,hidden?,cohort?,police?}; player uses id='player'.
 * canSee(a,b) MUST be supplied by runtime geometry (fails closed if absent).
 */
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const visible=b=>b&&!b.hidden&&Number.isFinite(b.x)&&Number.isFinite(b.z);
const isPolice=b=>b.police||b.cohort==='police';
const sight=(a,b,options)=>visible(a)&&visible(b)&&typeof options.canSee==='function'&&options.canSee(a,b)===true;
const active=['gathering','argument','shove','response'];
const clone=o=>JSON.parse(JSON.stringify(o));
function initial(world){return {version:1,id:`fictional-street-${Number(world.seed)||0}`,status:'pending',stageTime:0,totalTime:0,sequence:0,participants:null,emitted:[],history:[],drawWitnesses:false,joined:false,policeKnowledge:[],reactions:[],fictional:true};}
function obtain(world){return world.streetIncident||(world.streetIncident=initial(world));}
function observers(bodies,origin,options){return bodies.filter(b=>visible(b)&&distance(b,origin)<=12&&sight(b,origin,options)).map(b=>b.id).sort();}
function emit(s,type,world,bodies,origin,options,extra={}){
 const id=`${s.id}:${++s.sequence}`,witnessIds=origin?observers(bodies,origin,options):[];
 const e={id,type,time:world.time,incidentId:s.id,district:s.district,position:origin?{x:origin.x,z:origin.z}:s.position,witnessIds,policeWitnessIds:witnessIds.filter(id=>isPolice(bodies.find(b=>b.id===id)||{})),fictional:true,...extra};
 s.emitted.push(id);s.history.push(clone(e));return e;
}
function transition(s,status){s.status=status;s.stageTime=0;}
function actorMap(bodies){return new Map(bodies.filter(visible).map(b=>[b.id,b]));}
function available(s,bodies,options){
 if(!active.includes(s.status))return [];
 const map=actorMap(bodies),player=map.get('player'),instigator=map.get(s.participants?.instigatorId);
 if(!player||!instigator||distance(player,instigator)>4||!sight(player,instigator,options))return [];
 return [...(['gathering','argument'].includes(s.status)?['separate',...(!s.joined?['join']:[])]:[]),...(!s.drawWitnesses?['draw-witnesses']:[]),'leave'];
}
function directives(s,bodies,options){
 if(!s.participants||!active.includes(s.status))return [];
 const map=actorMap(bodies),a=map.get(s.participants.instigatorId),b=map.get(s.participants.companionId),officer=map.get(s.participants.officerId);if(!a||!b||!officer)return [];
 const dx=a.x-officer.x,dz=a.z-officer.z,len=Math.hypot(dx,dz)||1;
 const near={x:officer.x+dx/len*.95,z:officer.z+dz/len*.95};
 const out=[];
 if(['gathering','argument'].includes(s.status)){
  out.push({actorId:a.id,objective:s.status==='gathering'?'approach-argument':'argue',to:near,faceId:officer.id,gesture:s.status==='argument'?'talk':'walk'});
  out.push({actorId:b.id,objective:'watch-companion',to:{x:near.x+dz/len*1.5,z:near.z-dx/len*1.5},faceId:a.id,gesture:'watch'});
  out.push({actorId:officer.id,objective:'address-argument',to:{x:officer.x,z:officer.z},faceId:a.id,gesture:'talk'});
 }else if(s.status==='shove')out.push({actorId:a.id,objective:'performed-shove',to:{x:a.x,z:a.z},faceId:officer.id,gesture:'push'});
 else out.push({actorId:a.id,objective:'back-away',to:{x:a.x+dx/len*2,z:a.z+dz/len*2},faceId:officer.id,gesture:'back-away'});
 if(['shove','response'].includes(s.status))for(const k of s.policeKnowledge){
  const subject=map.get(k.subjectId),police=map.get(k.officerId);if(!police)continue;
  const seen=subject&&sight(police,subject,options),target=seen?subject:k.lastKnownPosition;
  const dx=police.x-target.x,dz=police.z-target.z,len=Math.hypot(dx,dz)||1;
  const to=seen?{x:target.x+dx/len*.95,z:target.z+dz/len*.95}:clone(k.lastKnownPosition);
  out.push({actorId:police.id,objective:seen?'address-witnessed-action':'check-last-known-position',...(seen?{targetId:subject.id,faceId:subject.id}:{}),to,sourceEventId:k.eventId,gesture:'point',knownPositionOnly:!seen,automaticDetention:false});
 }
 if(s.drawWitnesses&&['gathering','argument'].includes(s.status))for(const person of bodies.filter(v=>visible(v)&&!isPolice(v)&&v.id!=='player'&&v.id!==a.id&&v.id!==b.id&&distance(v,a)<=10&&sight(v,a,options)).slice(0,3))out.push({actorId:person.id,objective:'observe-argument',to:{x:person.x,z:person.z},faceId:a.id,gesture:'watch'});
 if(['shove','response'].includes(s.status))for(const reaction of s.reactions||[]){
  const person=map.get(reaction.actorId);if(!person)continue;
  const seen=map.get(reaction.observedActorId);
  out.push({actorId:person.id,objective:reaction.objective,to:clone(reaction.to),gesture:reaction.gesture,sourceEventId:reaction.eventId,...(seen&&sight(person,seen,options)?{faceId:seen.id}:{})});
 }
 return out;
}
function result(s,bodies,options,events=[],effects=[]){return {state:s,directives:directives(s,bodies,options),events,effects,options:available(s,bodies,options)};}
// Reactions are selected once at the witnessed event, with fixed destinations.
// They are intentions for collision routing, never position writes or recordings
// magically attributed to the player. A later observer may witness the response
// without being granted knowledge of the earlier shove.
function react(s,event,world,bodies,origin){
 s.reactions||=[];
 const excluded=new Set(['player',...Object.values(s.participants)]);
 for(const person of bodies.filter(b=>visible(b)&&!isPolice(b)&&!excluded.has(b.id)&&event.witnessIds.includes(b.id)).sort((a,b)=>a.id.localeCompare(b.id))){
  if(s.reactions.length>=8)break;
  if(s.reactions.some(r=>r.actorId===person.id))continue;
  let hash=Number(world.seed)>>>0;for(const c of person.id)hash=(Math.imul(hash,31)+c.charCodeAt(0))>>>0;
  const style=hash%3,dx=person.x-origin.x,dz=person.z-origin.z,length=Math.hypot(dx,dz);
  const angle=(hash%6283)/1000,ux=length>1e-6?dx/length:Math.cos(angle),uz=length>1e-6?dz/length:Math.sin(angle);
  s.reactions.push({actorId:person.id,eventId:event.id,observedAt:event.time,observedActorId:event.actorId,objective:['recoil-from-incident','observe-incident','film-incident'][style],gesture:['listen','listen','phone-record'][style],to:{x:person.x+(style===0?ux*2:0),z:person.z+(style===0?uz*2:0)}});
 }
}
function know(s,event,subjectId){for(const officerId of event.policeWitnessIds)if(!s.policeKnowledge.some(k=>k.officerId===officerId&&k.eventId===event.id))s.policeKnowledge.push({officerId,subjectId,eventId:event.id,witnessedAt:event.time,lastKnownPosition:clone(event.position),authority:'direct-witness',automaticDetention:false});}
/** Advance using simulation seconds, not wall clock. Timers stop without physical
 * proximity; separating active participants aborts the pending provocation.
 * Events are returned only on the transition that creates them, preventing replay
 * after save/restore. Returned history is inspector evidence, not public knowledge.
 */
export function updateIncident(world,bodies,dt,{canSee}={}){
 const options={canSee},s=obtain(world),events=[],effects=[],step=Math.max(0,Math.min(1,Number(dt)||0));
 if(s.status==='pending'){
  if(world.time<610||world.finished)return result(s,bodies,options);
  const hotspot=world.escalation?.hotspot;if(!hotspot||!Number.isFinite(hotspot.x)||!Number.isFinite(hotspot.z))return result(s,bodies,options);
  const forum=bodies.filter(b=>visible(b)&&b.cohort==='fictional-forum'&&distance(b,hotspot)<=12).sort((a,b)=>a.id.localeCompare(b.id));
  if(forum.length<2)return result(s,bodies,options);
  // Stable seed picks a performer only among physically eligible people.
  const offset=Math.abs(Number(world.seed)||0)%forum.length,a=forum[offset],b=forum[(offset+1)%forum.length];
  const officer=bodies.filter(p=>visible(p)&&isPolice(p)&&distance(p,a)<=12&&distance(p,b)<=12&&sight(a,p,options)&&sight(b,p,options)).sort((a,b)=>a.id.localeCompare(b.id))[0];
  if(!officer)return result(s,bodies,options);
  s.participants={instigatorId:a.id,companionId:b.id,officerId:officer.id};s.position={x:a.x,z:a.z};s.district=hotspot.district;s.startedAt=world.time;transition(s,'gathering');
  events.push(emit(s,'incident-gathering',world,bodies,a,options,{actorId:a.id,targetId:officer.id,description:'An original fictional pair approaches an officer with a loud complaint.'}));
  return result(s,bodies,options,events,effects);
 }
 if(!active.includes(s.status))return result(s,bodies,options);
 const map=actorMap(bodies),a=map.get(s.participants.instigatorId),b=map.get(s.participants.companionId),officer=map.get(s.participants.officerId);
 const intact=a&&b&&officer&&distance(a,officer)<=12&&distance(b,a)<=12&&sight(a,officer,options)&&sight(b,a,options);
 if(!intact){transition(s,'dispersing');events.push(emit(s,'incident-separated',world,bodies,a||officer,options,{reason:'Participants moved apart or lost sight before the next action.'}));return result(s,bodies,options,events,effects);}
 s.totalTime+=step;
 if(s.status==='gathering'){
  if(distance(a,officer)<=3&&distance(b,a)<=4)s.stageTime+=step;
  if(s.stageTime>=6){transition(s,'argument');events.push(emit(s,'incident-argument',world,bodies,a,options,{actorId:a.id,targetId:officer.id,description:'The complaint becomes an argument. The companion watches; affiliation remains unknown to bystanders.'}));}
  else if(s.totalTime>60){transition(s,'dispersing');events.push(emit(s,'incident-abandoned',world,bodies,a,options,{reason:'The approach did not physically complete.'}));}
 }else if(s.status==='argument'){
  if(distance(a,officer)>3||distance(b,a)>4){transition(s,'dispersing');events.push(emit(s,'incident-separated',world,bodies,a,options,{reason:'The argument broke apart before any shove.'}));}
  else {s.stageTime+=step;if(s.stageTime>20){transition(s,'dispersing');events.push(emit(s,'incident-abandoned',world,bodies,a,options,{reason:'The confrontation stayed out of contact range; no shove occurred.'}));}else if(s.stageTime>=8&&distance(a,officer)<=1.15){transition(s,'shove');const e=emit(s,'incident-shove',world,bodies,a,options,{actorId:a.id,perpetratorId:a.id,targetId:officer.id,description:'The fictional instigator shoves the officer during the argument.',action:'shove'});events.push(e);know(s,e,a.id);react(s,e,world,bodies,a);effects.push({type:'tension',district:s.district,value:12,eventId:e.id});}}
 }else if(s.status==='shove'){
  s.stageTime+=step;if(s.stageTime>=.8){transition(s,'response');const e=emit(s,'incident-response',world,bodies,officer,options,{actorId:officer.id,targetIds:[...new Set(s.policeKnowledge.map(k=>k.subjectId))],description:'Officers who actually saw the action address the person they saw; other officers preserve space.'});events.push(e);react(s,e,world,bodies,officer);}
 }else if(s.status==='response'){
  s.stageTime+=step;if(s.stageTime>=6){transition(s,'dispersing');events.push(emit(s,'incident-dispersing',world,bodies,a,options,{description:'The immediate argument fragments and people move apart.'}));}
 }
 return result(s,bodies,options,events,effects);
}
/** Player choices are allowed only from current nearby visible position. Calling
 * 'join' records an explicit vocal intervention, never an unperformed player shove.
 * 'leave' declines involvement; it does not teleport the player or stop the scene.
 */
export function actIncident(world,bodies,choice,{canSee}={}){
 const options={canSee},s=obtain(world);
 if(!available(s,bodies,options).includes(choice))return {ok:false,reason:'This intervention requires a nearby visible live incident.',...result(s,bodies,options)};
 const player=bodies.find(b=>b.id==='player'),events=[],effects=[];
 if(choice==='separate'){
  transition(s,'dispersing');const e=emit(s,'incident-prevented',world,bodies,player,options,{actorId:'player',description:'The player interrupts the argument before the shove; the pair breaks apart.'});events.push(e);effects.push({type:'tension',district:s.district,value:-8,eventId:e.id},{type:'aid',value:2,eventId:e.id});
 }else if(choice==='draw-witnesses'){
  s.drawWitnesses=true;events.push(emit(s,'incident-call-witnesses',world,bodies,player,options,{actorId:'player',description:'The player calls nearby people to watch. Only physically present observers can witness later actions.'}));
 }else if(choice==='join'){
  s.joined=true;const e=emit(s,'incident-player-incitement',world,bodies,player,options,{actorId:'player',perpetratorId:'player',action:'vocal-incitement',description:'The player explicitly urges the confrontation on; this does not mean the player performed the later shove.'});events.push(e);know(s,e,'player');effects.push({type:'escalation',value:3,eventId:e.id},{type:'tension',district:s.district,value:5,eventId:e.id});
 }else events.push(emit(s,'incident-declined',world,bodies,player,options,{actorId:'player',description:'The player declines involvement. Other participants continue independently.'}));
 return {ok:true,...result(s,bodies,options,events,effects)};
}
