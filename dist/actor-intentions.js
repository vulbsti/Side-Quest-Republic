/** Presentation projection only: never changes beliefs, needs, promises or outcomes.
 * Targets require the caller's nearestFreePoint/pathfinding and physical arrival check.
 * `positions` contains visible physical actors (array, Map or object); hidden peers omitted.
 */
const finitePoint=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.z)&&!p.hidden;
const hash=id=>[...String(id)].reduce((v,c)=>(v*31+c.charCodeAt(0))>>>0,17);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
function positionOf(positions,id){return positions instanceof Map?positions.get(id):Array.isArray(positions)?positions.find(p=>p.id===id):positions?.[id];}
export function projectActorIntent(actor,worldState,{districts=[],positions={},locations={}}={}){
 const district=(Array.isArray(districts)?districts.find(d=>d.id===actor.district):districts[actor.district])||{x:0,z:0};
 const self=positionOf(positions,actor.id);const origin=finitePoint(self)?self:district;
 const seed=hash(actor.id),slot=(seed%7)-3,activity=actor.activity||'observe',role=actor.archetype||actor.role;
 const anchor=(kind,dx,dz)=>{const supplied=locations[actor.district]?.[kind];return finitePoint(supplied)?{x:supplied.x,z:supplied.z}:{x:district.x+dx,z:district.z+dz};};
 const nearby=Object.values(worldState.actors||{}).filter(a=>a.id!==actor.id&&a.district===actor.district&&finitePoint(positionOf(positions,a.id))&&distance(origin,positionOf(positions,a.id))<10).sort((a,b)=>a.id.localeCompare(b.id));
 const trust=a=>actor.social?.[a.id]?.trust??25;
 const toward=(peer,gesture,reason)=>{const p=positionOf(positions,peer.id),angle=(hash(actor.id+peer.id)%628)/100;return {activity,target:{x:p.x+Math.cos(angle)*1.5,z:p.z+Math.sin(angle)*1.5},lookAt:{x:p.x,z:p.z},gesture,partnerId:peer.id,reason};};
 const output=(target,gesture,reason,lookAt=null)=>({activity,target,lookAt,gesture,partnerId:null,reason});
 const promise=(worldState.promises||[]).find(p=>p.to===actor.id&&p.status==='open');const player=positionOf(positions,'player');
 if(promise&&finitePoint(player)&&distance(origin,player)<5&&(activity==='follow-duty'||activity==='observe'))return {activity,target:{x:origin.x,z:origin.z},lookAt:{x:player.x,z:player.z},gesture:'wave',partnerId:'player',reason:`Waiting on the player's promise: ${promise.description||promise.id}`,promiseId:promise.id};
 if(activity==='rest')return output(anchor('rest',slot*1.1,6+(seed%2)*1.5),'rest','Move out of the flow and recover; no seat pose without a physical seat.');
 if(activity==='help'){
  const recipient=nearby.filter(a=>['rest','observe'].includes(a.activity)&&trust(a)>15).sort((a,b)=>(b.needs?.fatigue||0)-(a.needs?.fatigue||0)||a.id.localeCompare(b.id))[0];
  // Current locally visible resting person, never a remote hidden distress event.
  if(recipient)return toward(recipient,'point','Check on a nearby resting person; assistance outcome remains owned by simulation.');
  return output(anchor('water',-5+slot*.55,3),'point','Staff the local supplies point until a recipient is nearby.');
 }
 if(activity==='verify'){
  const uncertain=(actor.beliefs||[]).find(b=>b.confidence<.6);const source=uncertain&&nearby.find(a=>a.id===uncertain.sourceId||a.id===uncertain.corroboratedBy);
  const contact=source||nearby.filter(a=>trust(a)>=40&&['journalist','volunteer'].includes(a.archetype||a.role)).sort((a,b)=>trust(b)-trust(a))[0];
  if(contact)return toward(contact,'phone',source?'Ask the locally present source about an account already received.':'Ask a familiar local contact; do not assume they know the answer.');
  return output(anchor('verify',4+slot*.5,-3),'phone',uncertain?'Review the received account while waiting for a local source.':'Review personally received accounts.');
 }
 if(activity==='deescalate'){
  const peer=nearby.filter(a=>(a.activity==='seek-attention'||a.activity==='follow-duty')&&trust(a)>=20).sort((a,b)=>trust(b)-trust(a))[0];
  if(peer)return toward(peer,'shrug','Approach a visible participant and try a quiet conversation.');
  return output(anchor('perimeter',slot*1.3,-6),'wave','Hold the local passage edge and signal arriving people.');
 }
 if(activity==='seek-attention')return output(anchor('audience',slot*1.4,-1),'wave','Face the gathering from a distinct audience position.',{x:district.x,z:district.z+3});
 if(activity==='protect-livelihood')return output(anchor('work',-7+slot*.5,1),'point','Return to the local work frontage; no invented remote customer.');
 if(activity==='follow-duty'){
  if(role==='officer'){const phase=Math.floor((worldState.time||0)/45)%2;return output(anchor('perimeter',phase?7:-7,-6),'rest','Walk the two local perimeter posts while on duty.',{x:district.x,z:district.z});}
  if(role==='volunteer')return output(anchor('water',-5+slot*.55,3),'point','Staff supplies under the current duty commitment.');
  if(role==='journalist'||role==='creator')return output(anchor('verify',4+slot*.5,-3),'phone','Prepare a report at the local media position.');
  return output(anchor('work',slot*1.2,2),'rest','Attend the current local duty; obligations stay in the simulation.');
 }
 return output(anchor('observe',slot*1.5,4),'rest','Watch from a stable personal position.',{x:district.x,z:district.z});
}
