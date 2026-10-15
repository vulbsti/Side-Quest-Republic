import {DISTRICTS} from './districts.js?v=22';
/** Spatial dramatic direction, not a second physics engine.
 * Pure deriveEscalation(world, previous?) consumes actual living-world event receipts.
 * Persist the returned object with the save. `groups` are desired destinations and
 * activities; runtime must pathfind there, never teleport or infer physical arrival.
 * All political actors here are authored fiction. Intensity is dramatic pressure,
 * not proof of criminality. Police focus never constitutes an automatic detention.
 */
const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,Number(v)||0));
const STAGES=[['quiet',0],['arrivals',80],['assembly',210],['contested',450],['confrontation',720],['recovery',1020],['dispersal',1140]];
const position=id=>{const d=DISTRICTS.find(d=>d.id===id)||DISTRICTS[0];return {district:d.id,x:d.x,z:d.z};};
const effects=c=>Array.isArray(c?.effects)?c.effects:Object.entries(c?.effects||{}).map(([type,value])=>({type,value}));
const seedTie=(seed,id)=>{let h=Number(seed)>>>0;for(const c of id)h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h/4294967296*.5;};
function receipt(world,event){
 if(event.time>world.time||!world.districts[event.district])return null;
 let escalation=0,care=0,threat=null,subjectId='player';
 if(event.type==='choice'){
  const encounter=world.encounters?.find(e=>e.id===event.encounterId),choice=encounter?.choices?.find(c=>c.id===event.choiceId);
  // A played receipt must match the encounter's actual resolved record.
  const resolved=world.resolved?.[event.encounterId];
  if(!choice||resolved?.eventId!==event.id||resolved.status!=='played')return null;
  for(const e of effects(choice)){const n=Number(e.value)||0;if(e.type==='escalation')escalation+=n*2;if(e.type==='tension')escalation+=n*.5;if(e.type==='aid')care+=Math.max(0,n);if(e.type==='access')care+=Math.max(0,n)*.25;}
  if(escalation>0)threat='public-escalation';
 }else if(event.type==='street-action'){
  if(event.actionId==='key_taken'){escalation=12;threat='missing-property';}
  if(event.actionId==='key_returned'){escalation=-9;care=2;}
  if(event.actionId==='water_shared')care=5;
  if(event.actionId==='speaker_return')care=3;
 }else if(event.type==='incident'){subjectId=event.perpetratorId||event.actorId;if(event.incidentType==='incident-shove'){escalation=14;threat='witnessed-shove';}if(event.incidentType==='incident-player-incitement'){escalation=6;threat='public-escalation';}if(event.incidentType==='incident-prevented'){care=8;escalation=-5;}}else return null;
 if(!escalation&&!care)return null;
 return {eventId:event.id,time:event.time,district:event.district,escalation,care,threat,subjectId,actionId:event.incidentType||event.actionId||`${event.encounterId}:${event.choiceId}`};
}
function knownThreats(world,receipts){
 const knowledge=[];
 for(const officer of Object.values(world.actors||{}).filter(a=>a.role==='officer'||a.archetype==='officer'||a.id==='inspector')){
  for(const r of receipts.filter(r=>r.threat)){
   const belief=(officer.beliefs||[]).find(b=>b.sourceId===r.eventId&&b.source==='witness'&&b.observedDistrict===r.district&&b.learnedAt<=world.time&&b.confidence>=.8);
   if(!belief)continue;
   // Property returned after the incident closes this specific focus.
   if(r.threat==='missing-property'&&receipts.some(x=>x.actionId==='key_returned'&&x.time>=r.time))continue;
   knowledge.push({officerId:officer.id,subjectId:r.subjectId,eventId:r.eventId,observedAt:belief.learnedAt,lastKnownDistrict:r.district,reason:r.threat,objective:r.threat==='missing-property'?'recover-property':'observe-and-address',authority:'witnessed-action',automaticDetention:false});
  }
 }
 return knowledge.sort((a,b)=>a.eventId.localeCompare(b.eventId)||a.officerId.localeCompare(b.officerId));
}
/** Return deterministic desired world activity. Does not mutate world or previous.
 * Hotspot locks at first observed confrontation update, preserving the event IDs
 * and conditions behind that decision. Supply/metro remain refuge/arrival routes,
 * never chosen as a showdown merely because they contain vulnerable people.
 */
export function deriveEscalation(world,previous=null){
 const time=clamp(world.time,0,1200),stage=STAGES.filter(([,at])=>time>=at).at(-1)[0];
 const receipts=(world.events||[]).map(e=>receipt(world,e)).filter(Boolean);
 const candidates=['connector','jantar','court','assembly','press'].filter(id=>world.districts[id]).map(id=>{
  const d=world.districts[id],local=receipts.filter(r=>r.district===id),escalation=local.reduce((n,r)=>n+r.escalation,0),care=local.reduce((n,r)=>n+r.care,0);
  const pressure=clamp(d.tension)*.65+clamp(d.density)*.28+(100-clamp(d.access))*.22;
  return {...position(id),score:Math.round((pressure+escalation-care*.9+seedTie(world.seed,id))*100)/100,reasons:{tension:d.tension,density:d.density,access:d.access,localEscalation:escalation,localCare:care,eventIds:local.map(r=>r.eventId)}};
 }).sort((a,b)=>b.score-a.score||a.district.localeCompare(b.district));
 const locked=previous?.seed===world.seed&&previous?.hotspot?.locked&&time>=previous.time?previous.hotspot:null;
 const hotspot=locked?JSON.parse(JSON.stringify(locked)):{...(candidates[0]||{...position('jantar'),score:0,reasons:{eventIds:[]}}),locked:time>=720,selectedAt:time};
 const current=candidates.find(c=>c.district===hotspot.district)||hotspot;
 const progress=clamp((time-80)/640,0,1),intensity=clamp(current.score*.7+progress*24+(world.institutions?.command?.pressure||0)*.12-(time>1020?(time-1020)*.16:0));
 const recovery=time>=1020,departing=time>=1140;
 const arrivals=departing?3:Math.round(6+progress*22),reinforcements=time<210?0:time<450?2:time<720?4:Math.min(10,4+Math.floor(intensity/14));
 const destination=hotspot.district,assemblyObjective=departing?'disperse':recovery?'regroup':intensity>72?'retreat-and-regroup':time<210?'gather':'hold-assembly';
 const groups=[
  {id:'arrivals',count:arrivals,from:position('metro'),to:position(departing?'metro':time<450?'assembly':destination),objective:departing?'disperse':'join-assembly',pace:departing?1.1:.9},
  {id:'assembly',count:Math.round(8+progress*20),to:position(assemblyObjective==='retreat-and-regroup'||recovery?'assembly':destination),objective:assemblyObjective,pace:intensity>72?1.35:.8},
  {id:'volunteers',count:time<210?2:5,to:position(intensity>55&&!departing?destination:'supply'),objective:departing?'check-companions':'help-and-preserve-passage',pace:1.05},
  {id:'press',count:time<330?1:3,to:position(destination),objective:'observe',pace:.85},
  {id:'fictional-forum',label:'Jan Pragati Front (fictional)',count:time<450?0:time<720?3:5,to:position(destination),objective:departing?'withdraw':time<720?'compete-for-microphone':'press-demands-and-exploit-disruption',pace:.95,identityVisible:false,fiction:true},
  {id:'police',count:2+reinforcements,from:position('court'),to:position(time<450?'connector':destination),objective:departing?'open-exits':intensity>75?'contain-confrontation':'maintain-passage',pace:intensity>75?1.15:.85}
 ];
 const knowledge=knownThreats(world,receipts),focus=knowledge.filter(k=>time-k.observedAt<=180);
 return {version:1,seed:world.seed,time,stage,intensity:Math.round(intensity*10)/10,hotspot,candidates,groups,police:{reinforcements,focus,knowledge,unknownSuspects:groups.find(g=>g.id==='fictional-forum').count>0,policy:'Actions require witnessed receipts; affiliation, rumour and proximity do not identify a suspect.'},receipts,history:STAGES.filter(([,at])=>time>=at).map(([stage,at])=>({stage,at})),limitations:['Group destinations are intentions until physical runtime confirms arrival.','Fictional forum affiliation is director-only knowledge, not police knowledge.']};
}
