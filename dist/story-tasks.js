/** Physical consequences of dialogue commitments. Pure intentions; caller owns collision and locomotion. */
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const pos=b=>({x:b.x,z:b.z});
const valid=b=>b&&!b.hidden&&Number.isFinite(b.x)&&Number.isFinite(b.z);
const civilian=b=>valid(b)&&b.id!=='player'&&!b.police&&b.cohort!=='police'&&!b.shop&&!b.sceneTarget&&!b.follow&&!b.incidentOwned;
const see=(a,b,o)=>valid(a)&&valid(b)&&typeof o.canSee==='function'&&o.canSee(a,b)===true;
const route=(a,b,o)=>!o.canRoute||o.canRoute(a,b)===true;
const init=w=>w.storyTasks||(w.storyTasks={version:1,tasks:[],history:[],sequence:0});
const current=s=>s.tasks.find(t=>!['completed','abandoned'].includes(t.status));
const worldEvent=(w,id)=>(w.events||[]).find(e=>e.id===id);
const intents=[['first_injury',['assist','officer','invoke_exception'],'medical'],['climax_role',['care'],'medical'],['broken_mic',['help','gear'],'mic'],['last_group_call',['rollcall','trusted'],'regroup'],['climax_role',['regroup'],'regroup']];
function discover(w,s,o){for(const [encounterId,choices,kind] of intents){const r=w.resolved?.[encounterId];if(r?.status!=='played'||!choices.includes(r.choiceId))continue;const sourceEventId=r.eventId||`${encounterId}:${r.choiceId}:${r.time}`;if(s.tasks.some(t=>t.sourceEventId===sourceEventId))continue;s.tasks.push({id:`story-task-${w.seed}-${++s.sequence}`,kind,encounterId,choiceId:r.choiceId,sourceEventId,time:r.time||0,status:'queued',actorIds:[],sourcePosition:(()=>{const ev=worldEvent(w,sourceEventId),center=o.districtCenters?.[ev?.district],location=w.encounters?.find(e=>e.id===encounterId)?.location;return center?{...center}:o.sourcePoint?{...o.sourcePoint}:valid(location)?pos(location):null;})(),destination:kind==='mic'?{...(o.micPoint||{x:-5,z:-10})}:{...(o.safePoint||{x:48,z:8})},arrivalSeconds:0,repairSeconds:0,holdSeconds:0,lastSeen:{},lost:{}});}s.tasks.sort((a,b)=>a.time-b.time||a.id.localeCompare(b.id));}
function emit(w,s,t,type,events,description){const e={id:`story-physical-${w.seed}-${++s.sequence}`,type,kind:t.kind,time:w.time,actorIds:[...t.actorIds],sourceEventId:t.sourceEventId,encounterId:t.encounterId,choiceId:t.choiceId,position:{...t.destination},description,fictional:true};s.history.push(e);events.push(e);return e;}
function candidates(bodies,p,o,reserved=[]){return bodies.filter(b=>civilian(b)&&!reserved.includes(b.id)&&distance(b,p)<=14&&see(p,b,o)).sort((a,b)=>Number(!a.id.startsWith('arrival'))-Number(!b.id.startsWith('arrival'))||distance(a,p)-distance(b,p)||a.id.localeCompare(b.id));}
function output(w,bodies,o,events=[],effects=[]){const s=init(w),t=current(s),p=bodies.find(b=>b.id==='player');const directives=[],options=[],reservedActorIds=[];let objective=null;
 for(const task of s.tasks){if(task.status==='abandoned'||task.status==='completed'&&task.holdSeconds>=30)continue;reservedActorIds.push(...task.actorIds);for(const id of task.actorIds){const b=bodies.find(b=>b.id===id);if(!civilian(b))continue;let target=pos(b),speed=0,gesture=task.status==='completed'?(task.kind==='mic'?'point':'listen'):'wave';if(task.status==='following'&&valid(p)){const seen=see(b,p,o),aim=seen?p:task.lastSeen[id]||b,gap=distance(b,aim);if(gap>1.8){target={x:aim.x+(b.x-aim.x)/gap*1.3,z:aim.z+(b.z-aim.z)/gap*1.3};speed=5.4;}gesture='listen';}directives.push({actorId:id,objective:`story-task-${task.kind}-${task.status}`,to:target,speed,gesture,facePoint:task.status==='completed'&&task.kind==='mic'?{...task.destination}:undefined,reason:{taskId:task.id,sourceEventId:task.sourceEventId}});}}
 if(t&&valid(p)){options.push({id:'story-task-abandon',label:'Leave this task unfinished'});const actor=bodies.find(b=>b.id===t.actorIds[0]);const near=b=>valid(b)&&distance(p,b)<=3&&see(p,b,o);
  if(t.kind==='mic'){
   if(['queued','offered'].includes(t.status)&&near(t.destination))options.push({id:'story-task-repair',label:'Mic ka jugaad — hold here for 4 seconds'});
   objective={title:t.status==='repairing'?'Keep the connection steady':'The mic still needs fixing',detail:t.status==='repairing'?`${Math.floor(t.repairSeconds)}/4 seconds. Stay beside the marked connection.`:'Reach the marked microphone connection and press E.',target:{...t.destination},status:t.status};
  }else if(t.status==='separated'){
   const separated=t.actorIds.map(id=>bodies.find(b=>b.id===id)).filter(valid).sort((a,b)=>distance(b,p)-distance(a,p))[0];
   if(t.actorIds.every(id=>near(bodies.find(b=>b.id===id))))options.push({id:'story-task-rejoin',label:'Idhar hoon — saath chalo'});
   objective={title:'Someone got left behind',detail:'Return within sight of your companions and call them back.',target:separated?pos(separated):{...t.destination},status:t.status};
  }else if(t.kind==='medical'&&t.status!=='following'){
   if(near(actor))options.push({id:'story-task-start',label:'Chalo, slowly — walk with me'});
   objective={title:'Help needs a person, not a promise',detail:actor?'Approach the marked person, then accompany them to the east meeting point.':'Look for someone nearby who needs company; nobody has been moved remotely.',target:actor?pos(actor):t.sourcePosition?{...t.sourcePosition}:pos(p),actorId:actor?.id,status:t.status};
  }else if(t.kind==='regroup'&&t.actorIds.length<2){
   for(const b of candidates(bodies,p,o,t.actorIds).filter(near).slice(0,2))options.push({id:`story-task-recruit:${b.id}`,label:`${b.name||b.id}: group idhar hai, saath chalo`});
   const next=candidates(bodies,p,o,t.actorIds)[0];objective={title:`Find your group: ${t.actorIds.length}/2`,detail:'Ask two nearby people to come, then physically reach the east meeting point together.',target:next?pos(next):pos(p),status:t.status};
  }else objective={title:t.kind==='medical'?'Get them to the meeting point':'Bring the group together',detail:'Walk together to the amber destination. Everyone must arrive; sprinting can leave them behind.',target:{...t.destination},actorId:t.actorIds[0],status:t.status};
 }
 if(objective)objective.kind=t.kind;return {state:s,directives,reservedActorIds,options,objective,events,effects};}
export function updateStoryTasks(world,bodies,dt,o={}){const s=init(world),events=[],effects=[],step=Math.min(1,Math.max(0,Number(dt)||0)),p=bodies.find(b=>b.id==='player');discover(world,s,o);for(const t of s.tasks)if(t.status==='completed')t.holdSeconds+=step;const t=current(s);if(!t||!valid(p))return output(world,bodies,o,events,effects);
 if(t.status==='queued'){
  if(t.kind==='medical'){const actor=candidates(bodies,p,o).find(b=>(!t.sourcePosition||distance(b,t.sourcePosition)<=18)&&route(b,t.destination,o));if(actor){t.actorIds=[actor.id];t.status='offered';emit(world,s,t,'story-task-offered',events,'A nearby person accepts the offer of company.');}}
  else t.status='offered';
 }
 if(t.status==='repairing'){const close=distance(p,t.destination)<=2.5&&see(p,t.destination,o);t.repairSeconds=close?t.repairSeconds+step:0;if(!close)t.status='offered';}
 if(t.status==='following'){
  for(const id of t.actorIds){const b=bodies.find(b=>b.id===id);if(!civilian(b)){t.status='separated';continue;}if(see(b,p,o)){t.lastSeen[id]=pos(p);t.lost[id]=0;}else t.lost[id]=(t.lost[id]||0)+step;if(distance(b,p)>12||t.lost[id]>3)t.status='separated';}
  const arrived=t.actorIds.length>=(t.kind==='regroup'?2:1)&&t.actorIds.every(id=>{const b=bodies.find(b=>b.id===id);return valid(b)&&distance(b,t.destination)<=3&&distance(b,p)<=4&&see(b,p,o);})&&distance(p,t.destination)<=3;
  t.arrivalSeconds=arrived&&t.status==='following'?t.arrivalSeconds+step:0;
 }
 if(t.repairSeconds>=4||t.arrivalSeconds>=2){if(t.kind==='mic')t.actorIds=candidates(bodies,t.destination,o).slice(0,3).map(b=>b.id);t.status='completed';t.holdSeconds=0;const e=emit(world,s,t,'story-task-completed',events,t.kind==='mic'?'The connection holds; the microphone works.':t.kind==='medical'?'The player and companion physically reach the meeting point.':'Two companions and the player physically reach the meeting point.');effects.push({type:'trust',value:3,eventId:e.id},{type:'tension',district:'jantar',value:-2,eventId:e.id});}
 return output(world,bodies,o,events,effects);
}
export function actStoryTask(world,bodies,id,o={}){const s=init(world),t=current(s),before=output(world,bodies,o);if(!t||!before.options.some(v=>v.id===id))return {...before,ok:false,reason:'Approach the marked person or object first.'};const events=[],p=bodies.find(b=>b.id==='player');
 if(id==='story-task-repair'){t.status='repairing';t.repairSeconds=0;}
 else if(id.startsWith('story-task-recruit:')){const actorId=id.slice('story-task-recruit:'.length);t.actorIds.push(actorId);t.lastSeen[actorId]=pos(p);t.status='following';}
 else if(id==='story-task-abandon'){t.status='abandoned';emit(world,s,t,'story-task-abandoned',events,'The physical commitment is left unfinished.');return {...output(world,bodies,o,events),ok:true};}
 else {t.status='following';for(const actorId of t.actorIds){t.lastSeen[actorId]=pos(p);t.lost[actorId]=0;}}
 t.arrivalSeconds=0;emit(world,s,t,'story-task-started',events,id==='story-task-repair'?'“Wire pakad. DJ nahi banna, bas pakad.”': '“Theek hai. Bas bina bataye disappear mat hona.”');return {...output(world,bodies,o,events),ok:true};}
