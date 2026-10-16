/** Physical, fictional escort task. Caller owns navigation and collisions.
 * Apply returned directives after ordinary crisis orders; never teleport actors.
 * safePoints must be authored walkable rally points. Optional canRoute(a,b)
 * rejects inaccessible candidates. Knowledge requires current line of sight.
 */
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const point=b=>({x:b.x,z:b.z});
const valid=b=>b&&!b.hidden&&Number.isFinite(b.x)&&Number.isFinite(b.z);
const civilian=b=>valid(b)&&b.id!=='player'&&!b.police&&b.cohort!=='police'&&!b.shop&&!b.sceneTarget&&!b.follow&&!b.incidentOwned;
const retreat=new Set(['scatter-from-line','back-away-from-close-line','follow-visible-retreat','guide-companion-away','use-safe-passage']);
const see=(a,b,o)=>valid(a)&&valid(b)&&typeof o.canSee==='function'&&o.canSee(a,b)===true;
const init=w=>w.crisisTasks||(w.crisisTasks={version:1,sequence:0,usedWaves:[],task:null,history:[]});
function emit(w,s,type,description,events){const t=s.task,e={id:`escort-${w.seed}-${++s.sequence}`,type,time:w.time,actorId:t?.actorId,position:t?.lastPosition,description,fictional:true};s.history.push(e);s.history=s.history.slice(-30);events.push(e);return e;}
function finish(w,s,status,description,events){s.task.status=status;s.task.elapsed=0;emit(w,s,`escort-${status}`,description,events);}
function out(w,bodies,o,events=[],effects=[]){const s=init(w),t=s.task,player=bodies.find(b=>b.id==='player'),actor=bodies.find(b=>b.id===t?.actorId);let directives=[],options=[],objective=null;
 if(t&&['offered','following','separated'].includes(t.status)){
  const near=valid(actor)&&valid(player)&&dist(actor,player)<=3&&see(player,actor,o);
  if(t.status==='offered'&&near)options.push({id:'escort-start',label:'Saath chalo — reach the meeting point',actorId:t.actorId});
  if(t.status==='separated'&&near)options.push({id:'escort-rejoin',label:'Idhar hoon! Come with me',actorId:t.actorId});
  if(['following','separated'].includes(t.status)){
   options.push({id:'escort-release',label:'Part ways',actorId:t.actorId});
   if(civilian(actor)&&valid(player)){
    const visiblePlayer=see(actor,player,o),followPoint=visiblePlayer?player:(t.lastSeenPlayer||actor),gap=dist(actor,followPoint),moving=t.status==='following'&&gap>1.8;
    // Aim behind the player; geometry and speed stay under runtime control.
    const target=moving?{x:followPoint.x+(actor.x-followPoint.x)/gap*1.3,z:followPoint.z+(actor.z-followPoint.z)/gap*1.3}:point(actor);
    directives.push({actorId:t.actorId,objective:t.status==='separated'?'escort-wait-for-player':'escort-follow-player',to:target,speed:moving?5.4:0,gesture:t.status==='separated'?'wave':'listen',sourceWave:t.wave,reason:{taskId:t.id,playerDistance:gap}});
   }
  }
  objective={title:t.status==='offered'?'Someone lost their group':t.status==='separated'?'You lost your companion':'Get there together',detail:t.status==='offered'?'Approach the marked person and press E.':t.status==='separated'?'Go back within sight and call them again.':`Lead them to ${t.destination.label}. Stay close; both of you must arrive.`,target:t.status==='following'?{...t.destination}:valid(actor)?point(actor):t.lastPosition,actorId:t.actorId,status:t.status};
 }
 if(t?.status==='completed'&&(t.holdSeconds??0)<60&&civilian(actor))directives.push({actorId:t.actorId,objective:'escort-safe-rally',to:{x:t.destination.x,z:t.destination.z},speed:1.2,gesture:'listen',sourceWave:t.wave});
 const reservedActorIds=t&&(['following','separated'].includes(t.status)||(t.status==='completed'&&(t.holdSeconds??0)<60))?[t.actorId]:[];
 return {state:s,directives,options,objective,events,effects,reservedActorIds};
}
export function updateCrisisTasks(world,bodies,dt,o={}){
 const s=init(world),events=[],effects=[],step=Math.max(0,Math.min(1,Number(dt)||0)),player=bodies.find(b=>b.id==='player'),crisis=world.crowdCrisis;
 let t=s.task;
 if(t?.status==='completed')t.holdSeconds=(t.holdSeconds||0)+step;
 if(t&&['offered','following','separated'].includes(t.status)){
  const actor=bodies.find(b=>b.id===t.actorId);t.elapsed+=step;
  if(!civilian(actor)||!valid(player)){finish(world,s,'unavailable','The companion is no longer available for this journey.',events);return out(world,bodies,o,events,effects);}
  t.lastPosition=point(actor);
  if(t.status==='offered'){
   if(t.elapsed>55||dist(actor,player)>26)finish(world,s,'missed','The person moves on before the player offers to accompany them.',events);
  }else{
   const inSight=see(actor,player,o);
   if(inSight){t.lastSeenPlayer=point(player);t.outOfSightSeconds=0;}else t.outOfSightSeconds=(t.outOfSightSeconds||0)+step;
   // Brief corners use the last observed position, never hidden player coordinates.
   // Normal 4.7m/s walking is sustainable; sprinting (8.1m/s) still leaves them.
   const separated=dist(actor,player)>12||(t.outOfSightSeconds||0)>3;
   if(separated&&t.status==='following'){t.status='separated';t.separatedSeconds=0;t.arrivalSeconds=0;emit(world,s,'escort-separated','The companion loses sight of the player and waits, calling them back.',events);}
   if(t.status==='separated'){t.separatedSeconds+=step;if(t.separatedSeconds>35)finish(world,s,'parted','After waiting, the companion gives up following and rejoins the street.',events);}
   if(t.status==='following'){
    const arrived=dist(player,t.destination)<=3&&dist(actor,t.destination)<=3&&dist(actor,player)<=3&&see(actor,player,o);
    t.arrivalSeconds=arrived?t.arrivalSeconds+step:0;
    if(t.arrivalSeconds>=2){finish(world,s,'completed',`Both reach ${t.destination.label}. “Okay, cardio done. Ab chai?”`,events);effects.push({type:'trust',value:3,eventId:events.at(-1).id},{type:'tension',district:crisis?.district,value:-2,eventId:events.at(-1).id});}
   }
  }
  return out(world,bodies,o,events,effects);
 }
 if(world.finished||!valid(player)||!crisis||!['advance','scatter'].includes(crisis.status)||s.usedWaves.includes(crisis.wave))return out(world,bodies,o);
 const orders=new Set((crisis.orders||[]).filter(d=>retreat.has(d.objective)).map(d=>d.actorId));
 const candidates=bodies.filter(b=>civilian(b)&&orders.has(b.id)&&dist(b,player)<=14&&see(player,b,o)).sort((a,b)=>dist(a,player)-dist(b,player)||a.id.localeCompare(b.id));
 for(const actor of candidates){
  const points=(o.safePoints||[]).filter(p=>valid(p)&&typeof p.label==='string'&&dist(p,actor)>=8&&dist(p,actor)<=65&&(!crisis.line||dist(p,crisis.line)>dist(actor,crisis.line)+5)&&(!o.canRoute||o.canRoute(actor,p)===true)).sort((a,b)=>dist(a,actor)-dist(b,actor));
  if(!points.length)continue;
  s.usedWaves.push(crisis.wave);s.task={id:`escort-${world.seed}-wave-${crisis.wave}`,wave:crisis.wave,actorId:actor.id,status:'offered',destination:{...points[0]},lastPosition:point(actor),elapsed:0,separatedSeconds:0,arrivalSeconds:0};
  emit(world,s,'escort-offered','A retreating person looks for their group: “Phone dead. Mere saath chalega?”',events);break;
 }
 return out(world,bodies,o,events,effects);
}
export function actCrisisTask(world,bodies,choice,o={}){
 const current=out(world,bodies,o),s=current.state,t=s.task,events=[];
 if(!current.options.some(v=>v.id===choice))return {...current,ok:false,reason:'Approach the companion within sight first.'};
 if(choice==='escort-release')finish(world,s,'parted','The player and companion part ways; the journey is unfinished.',events);
 else{t.status='following';t.elapsed=0;t.separatedSeconds=0;t.arrivalSeconds=0;t.outOfSightSeconds=0;t.lastSeenPlayer=point(bodies.find(b=>b.id==='player'));emit(world,s,choice==='escort-start'?'escort-started':'escort-rejoined',choice==='escort-start'?'“Bas sprint mat maarna. Battery meri bhi low hai.” The companion follows on foot.':'“Haan bhai, main loading screen pe reh gaya tha.” The companion resumes following.',events);}
 return {...out(world,bodies,o,events),ok:true};
}
