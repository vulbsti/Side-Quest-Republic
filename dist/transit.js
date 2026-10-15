/** Serializable, renderer-independent fictional shuttle simulation.
 * World metres: x/z. Bus-local cabin: x across, z length. Heading zero faces +z.
 * API mutations return {ok,reason?}; update mutates state deterministically.
 * Render adapter positions the player from cabinToWorld while aboard.
 */
const clone=v=>JSON.parse(JSON.stringify(v));
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const TRANSIT_VERSION=1;
export const OBSTRUCTION_RECOVERY_SECONDS=12;
export const CABIN={halfWidth:1.02,halfLength:3.8,door:{x:1.02,z:2.7},floorHeight:.78};
// Routes may be replaced with map-reviewed waypoints via createTransit({routes}).
function arc(cx,cz,r,start,end){return Array.from({length:17},(_,i)=>{const a=start+(end-start)*i/16;return {x:cx+Math.cos(a)*r,z:cz+Math.sin(a)*r};});}
export const DEFAULT_ROUTES=[
 {id:'east',name:'East district shuttle',loop:true,points:[{x:60,z:-30,stop:true,name:'Press lane'},{x:60,z:45,stop:true,name:'Negotiation court'},{x:60,z:61},...arc(64,61,4,Math.PI,0).slice(1),{x:60,z:59},{x:60,z:45,stop:true,name:'Negotiation court return'},{x:60,z:-30,stop:true,name:'Press lane return'},{x:60,z:-68},...arc(64,-68,4,Math.PI,2*Math.PI).slice(1),{x:60,z:-63},{x:60,z:-30,stop:true,name:'Press lane'}]},
 {id:'west',name:'Neighbourhood shuttle',loop:true,points:[{x:-60,z:12,stop:true,name:'Aid courtyard'},{x:-60,z:65,stop:true,name:'Neighbourhood lane'},{x:-60,z:69},...arc(-56,69,4,Math.PI,0).slice(1),{x:-58,z:55},{x:-60,z:50},{x:-60,z:12,stop:true,name:'Aid courtyard return'},{x:-60,z:-68},...arc(-64,-68,4,0,-Math.PI).slice(1),{x:-60,z:-63},{x:-60,z:12,stop:true,name:'Aid courtyard'}]}
];
const SEATS=[-2.6,-1.3,0,1.3].flatMap((z,row)=>[-.65,.65].map((x,col)=>({id:`${row}-${col}`,x,z,occupant:null})));
function validPoint(p){return p&&finite(p.x)&&finite(p.z)&&p.x>=-88&&p.x<=88&&p.z>=-83&&p.z<=98;}
function validRoute(r){return r&&typeof r.id==='string'&&Array.isArray(r.points)&&r.points.length>=2&&r.points.every(validPoint)&&r.points[0].stop===true&&r.points.at(-1).stop===true&&r.points.slice(1).every((p,i)=>Math.hypot(p.x-r.points[i].x,p.z-r.points[i].z)>.1);}
function yawBetween(a,b){return Math.atan2(b.x-a.x,b.z-a.z);}
export function createTransit({routes=DEFAULT_ROUTES,autoDepart=true,dwellSeconds=25}={}){
 if(routes.length<2||!routes.every(validRoute))throw Error('Transit needs two valid routes with endpoint stops.');
 return {version:TRANSIT_VERSION,time:0,autoDepart:!!autoDepart,dwellSeconds:clamp(dwellSeconds,5,120),player:{busId:null,mode:'outside',seatId:null,local:null,boardingRemaining:0},buses:routes.map((r,i)=>{
 const route=clone(r),seats=clone(SEATS),passengers=[{id:`passenger-${i}-a`,name:i?'Rehan':'Tara',seatId:'0-0',line:i?'Bhai, next stop pe yaad dila dena. Har baar nikal jaata hai.':'Window seat mil gayi. Ab bas window bhi khul jaaye.'},{id:`passenger-${i}-b`,name:i?'Aunty':'Manu',seatId:'1-1',line:i?'Beta bag godi mein rakh lo, bag ka ticket nahi liya.':'Group mein location bhej di. Ab group hi galat tha.'}];
 for(const p of passengers)seats.find(s=>s.id===p.seatId).occupant=p.id;
 return {id:`shuttle-${i+1}`,name:r.name,route,seats,passengers,x:route.points[0].x,z:route.points[0].z,yaw:yawBetween(route.points[0],route.points[1]),segment:0,direction:1,progress:0,status:'stopped',doorsOpen:true,speed:5,stopIndex:0,arrivalCount:0,obstructed:false,blockedSeconds:0,recovery:false,recoveryHold:0,migrationPending:false,dwellRemaining:clamp(dwellSeconds,5,120)+i*7,boardingGrace:0,stopRequested:false};})};
}
export function cabinToWorld(bus,local){const c=Math.cos(bus.yaw),s=Math.sin(bus.yaw);return {x:bus.x+local.x*c+local.z*s,y:CABIN.floorHeight,z:bus.z-local.x*s+local.z*c};}
export function busDoorWorld(bus){return cabinToWorld(bus,CABIN.door);}
export function boardBus(state,busId,player){const bus=state.buses.find(b=>b.id===busId);
 if(!bus)return {ok:false,reason:'Unknown bus'};if(bus.migrationPending)return {ok:false,reason:'Route updated; this shuttle is out of service'};if(state.player.busId)return {ok:false,reason:'Already aboard'};
 if(bus.status!=='stopped'||!bus.doorsOpen)return {ok:false,reason:'Wait for an open stop'};
 const door=busDoorWorld(bus);if(!player||!finite(player.x)||!finite(player.z)||Math.hypot(player.x-door.x,player.z-door.z)>2.1)return {ok:false,reason:'Approach the open door'};
 bus.boardingGrace=5;bus.dwellRemaining=Math.max(bus.dwellRemaining||0,5);state.player={busId,mode:'boarding',seatId:null,local:{x:.25,z:2.7},boardingRemaining:.65};return {ok:true,position:cabinToWorld(bus,state.player.local)};
}
export function chooseSeat(state,seatId){const p=state.player,b=state.buses.find(b=>b.id===p.busId);if(!b||p.mode==='boarding')return {ok:false,reason:'Finish boarding first'};
 if(seatId===null){if(p.seatId)b.seats.find(s=>s.id===p.seatId).occupant=null;p.local={x:0,z:p.local.z};p.mode='standing';p.seatId=null;return {ok:true};}
 const seat=b.seats.find(s=>s.id===seatId);if(!seat)return {ok:false,reason:'Unknown seat'};if(seat.occupant&&seat.occupant!=='player')return {ok:false,reason:'Seat occupied'};
 if(Math.hypot(p.local.x-seat.x,p.local.z-seat.z)>1.35)return {ok:false,reason:'Move beside the seat'};
 if(p.seatId)b.seats.find(s=>s.id===p.seatId).occupant=null;seat.occupant='player';p.local={x:seat.x,z:seat.z};p.seatId=seatId;p.mode='seated';return {ok:true};
}
export function moveInCabin(state,dx,dz){const p=state.player;if(p.mode!=='standing'||!finite(dx)||!finite(dz))return {ok:false,reason:'Stand before moving'};
 const length=Math.hypot(dx,dz),scale=length>.35?.35/length:1;
 // Aisle is reserved for walking; seats are approached with chooseSeat.
 p.local.x=clamp(p.local.x+dx*scale,-.28,.28);p.local.z=clamp(p.local.z+dz*scale,-3.35,3.35);return {ok:true,local:clone(p.local)};
}
export function requestDeparture(state,busId){const b=state.buses.find(b=>b.id===busId);if(!b)return {ok:false,reason:'Unknown bus'};
 if(b.recovery)return {ok:false,reason:'Driver is checking the blocked road. You can exit at the door.'};if(b.status!=='stopped')return {ok:false,reason:'Already moving'};if(state.player.busId===busId&&state.player.mode==='boarding')return {ok:false,reason:'Passenger boarding'};
 const n=b.route.points.length;if(b.route.loop){b.direction=1;if(b.stopIndex===n-1)b.stopIndex=0;}else if(b.stopIndex===n-1)b.direction=-1;else if(b.stopIndex===0)b.direction=1;
 b.speed=b.direction<0?2:5;b.segment=b.stopIndex;b.progress=0;b.status='moving';b.doorsOpen=false;b.obstructed=false;b.dwellRemaining=0;return {ok:true};
}
export function requestStop(state,busId=state.player.busId){const b=state.buses.find(b=>b.id===busId);if(!b)return {ok:false,reason:'Unknown bus'};b.stopRequested=true;if(b.status==='stopped')b.dwellRemaining=Math.max(b.dwellRemaining||0,12);return {ok:true};}
export function updateTransit(state,dt,{blocked=()=>false,paused=false}={}){if(paused)return {ok:true};if(!finite(dt)||dt<0||dt>30)return {ok:false,reason:'Invalid timestep'};if(dt>.050001){let remaining=dt;while(remaining>1e-8){const step=Math.min(.05,remaining);updateTransit(state,step,{blocked});remaining-=step;}return {ok:true};}state.time+=dt;
 const p=state.player;if(p.mode==='boarding'){p.boardingRemaining=Math.max(0,p.boardingRemaining-dt);if(p.boardingRemaining<1e-8){p.boardingRemaining=0;p.mode='standing';}}
 for(const b of state.buses){
 if(b.recovery){b.recoveryHold=Math.max(0,(b.recoveryHold||0)-dt);const a=b.route.points[b.segment],t=b.route.points[b.segment+b.direction];const length=t&&Math.hypot(t.x-a.x,t.z-a.z);const progress=Math.min(length||0,b.progress+b.speed*dt);const probe=t?{x:a.x+(t.x-a.x)*progress/length,z:a.z+(t.z-a.z)*progress/length}:null;
 if(b.migrationPending||!probe||blocked(probe,b)||b.recoveryHold>0||b.boardingGrace>0||p.mode==='boarding'){b.boardingGrace=Math.max(0,b.boardingGrace-dt);continue;}
 b.recovery=false;b.status='moving';b.doorsOpen=false;b.blockedSeconds=0;b.obstructed=false;
 }
 b.boardingGrace=Math.max(0,(b.boardingGrace||0)-dt);if(b.status==='stopped'){b.dwellRemaining=Math.max(0,(b.dwellRemaining??state.dwellSeconds??25)-dt);if(state.autoDepart&&b.dwellRemaining<1e-8&&b.boardingGrace<1e-8&&!(state.player.busId===b.id&&state.player.mode==='boarding'))requestDeparture(state,b.id);}if(b.status!=='moving')continue;let remaining=dt;
 while(remaining>1e-8&&b.status==='moving'){
 const a=b.route.points[b.segment],next=b.segment+b.direction,target=b.route.points[next];if(!target){b.status='stopped';b.doorsOpen=true;break;}
 const distance=Math.hypot(target.x-a.x,target.z-a.z),step=Math.min(remaining,.05),advance=Math.min(b.speed*step,distance-b.progress),progress=b.progress+advance;
 const pos={x:a.x+(target.x-a.x)*progress/distance,z:a.z+(target.z-a.z)*progress/distance};
 if(blocked(pos,b)){b.obstructed=true;b.blockedSeconds=(b.blockedSeconds||0)+step;if(b.blockedSeconds>=OBSTRUCTION_RECOVERY_SECONDS){b.recovery=true;b.recoveryHold=15;b.status='stopped';b.doorsOpen=true;}break;}b.obstructed=false;b.blockedSeconds=0;b.x=pos.x;b.z=pos.z;b.progress=progress;const desired=yawBetween(a,target),delta=Math.atan2(Math.sin(desired-b.yaw),Math.cos(desired-b.yaw));b.yaw+=clamp(delta,-1.8*step,1.8*step);remaining-=advance/b.speed;
 if(b.progress>=distance-1e-7){b.x=target.x;b.z=target.z;b.segment=next;b.progress=0;if(target.stop){b.status='stopped';b.doorsOpen=true;b.stopIndex=next;b.arrivalCount++;b.dwellRemaining=Math.max(state.dwellSeconds||25,b.stopRequested?35:0);b.stopRequested=false;}}
 }
 }return {ok:true};}
export function disembarkBus(state,{blocked=()=>false}={}){const p=state.player,b=state.buses.find(b=>b.id===p.busId);if(!b)return {ok:false,reason:'Not aboard'};
 if(b.status!=='stopped'||!b.doorsOpen)return {ok:false,reason:'Wait until the bus stops'};if(p.mode!=='standing'||Math.hypot(p.local.x-CABIN.door.x,p.local.z-CABIN.door.z)>1.5)return {ok:false,reason:'Stand beside the door'};
 // Only tested exterior candidates are permitted. A blocked exit leaves player aboard.
 for(const zOffset of [0,-.5,.5])for(const reach of [1.8,2.2]){const landing=cabinToWorld(b,{x:reach,z:CABIN.door.z+zOffset});landing.y=0;const threshold=cabinToWorld(b,{x:1.3,z:CABIN.door.z});const steps=Math.ceil(Math.hypot(landing.x-threshold.x,landing.z-threshold.z)/.1);const clear=Array.from({length:steps+1},(_,i)=>({x:threshold.x+(landing.x-threshold.x)*i/steps,z:threshold.z+(landing.z-threshold.z)*i/steps})).every(point=>!blocked(point,b));if(validPoint(landing)&&clear){b.boardingGrace=3;b.dwellRemaining=Math.max(b.dwellRemaining||0,3);state.player={busId:null,mode:'outside',seatId:null,local:null,boardingRemaining:0};return {ok:true,position:landing};}}
 return {ok:false,reason:'Exit blocked; stay aboard'};}
export function validateTransit(s){const errors=[];if(!s||s.version!==1||!finite(s.time)||s.time<0||!Array.isArray(s.buses)||s.buses.length<2)return ['Invalid transit state'];
 if(typeof s.autoDepart!=='boolean'||!finite(s.dwellSeconds)||s.dwellSeconds<5||s.dwellSeconds>120)errors.push('Invalid dwell configuration');const ids=new Set();for(const b of s.buses){if(!finite(b.blockedSeconds??0)||(b.blockedSeconds??0)<0||typeof (b.recovery??false)!=='boolean'||!finite(b.recoveryHold??0)||(b.recoveryHold??0)<0)errors.push('Invalid recovery state');if(!finite(b.dwellRemaining)||b.dwellRemaining<0||b.dwellRemaining>200||!finite(b.boardingGrace)||b.boardingGrace<0||b.boardingGrace>10||typeof b.stopRequested!=='boolean')errors.push('Invalid stop timers');if(ids.has(b.id))errors.push('Duplicate bus');ids.add(b.id);if(!validRoute(b.route)||!validPoint(b)||!finite(b.yaw)||!finite(b.speed)||b.speed<=0||b.speed>15||![-1,1].includes(b.direction)||!Number.isInteger(b.segment)||b.segment<0||b.segment>=b.route.points.length||!finite(b.progress)||b.progress<0)errors.push('Invalid bus motion');if(!Number.isInteger(b.stopIndex)||b.stopIndex<0||b.stopIndex>=b.route.points.length||!b.route.points[b.stopIndex]?.stop)errors.push('Invalid stop');if(b.status==='moving'){const a=b.route.points[b.segment],t=b.route.points[b.segment+b.direction];if(!a||!t)errors.push('Invalid segment');else{const length=Math.hypot(t.x-a.x,t.z-a.z);if(b.progress>length||Math.hypot(b.x-(a.x+(t.x-a.x)*b.progress/length),b.z-(a.z+(t.z-a.z)*b.progress/length))>.01)errors.push('Motion position mismatch');}}if(!['stopped','moving'].includes(b.status)||b.doorsOpen!==(b.status==='stopped'))errors.push('Invalid bus doors');if(!Array.isArray(b.seats)||b.seats.length!==8||!Array.isArray(b.passengers))errors.push('Invalid cabin');else{if(new Set(b.seats.map(t=>t.id)).size!==8||b.seats.some(t=>!finite(t.x)||!finite(t.z)||Math.abs(t.x)>1||Math.abs(t.z)>3.8))errors.push('Invalid seat coordinates');const occupants=b.seats.filter(x=>x.occupant).map(x=>x.occupant);if(new Set(occupants).size!==occupants.length)errors.push('Duplicate occupant');for(const q of b.passengers)if(!b.seats.some(t=>t.id===q.seatId&&t.occupant===q.id))errors.push('Passenger seat mismatch');}}
 const p=s.player;if(!p||!['outside','boarding','standing','seated'].includes(p.mode))errors.push('Invalid player mode');else if(p.mode==='outside'){if(p.busId!==null||p.local!==null)errors.push('Outside player attached');}else{const b=s.buses.find(b=>b.id===p.busId);if(!b||!p.local||!finite(p.local.x)||!finite(p.local.z)||Math.abs(p.local.x)>CABIN.halfWidth||Math.abs(p.local.z)>CABIN.halfLength)errors.push('Invalid player cabin');if(p.mode==='seated'&&!b?.seats.some(x=>x.id===p.seatId&&x.occupant==='player'))errors.push('Player seat mismatch');if(p.mode==='boarding'&&(!finite(p.boardingRemaining)||p.boardingRemaining<0||p.boardingRemaining>.65))errors.push('Invalid boarding timer');if(p.mode!=='seated'&&p.seatId!==null)errors.push('Standing player has seat');}
 return errors;}
export function serializeTransit(s){const errors=validateTransit(s);if(errors.length)throw Error(errors.join('; '));return clone(s);}
export function restoreTransit(raw){try{const s=typeof raw==='string'?JSON.parse(raw):clone(raw);if(s&&Array.isArray(s.buses)){s.autoDepart??=true;s.dwellSeconds??=25;for(const b of s.buses){b.dwellRemaining??=25;b.boardingGrace??=0;b.stopRequested??=false;b.blockedSeconds??=0;b.recovery??=false;b.recoveryHold??=0;b.migrationPending??=false;}}if(validateTransit(s).length)return null;for(const b of s.buses){const canonical=DEFAULT_ROUTES.find(r=>r.id===b.route.id);if(canonical&&JSON.stringify(canonical.points)!==JSON.stringify(b.route.points)){b.migrationPending=true;b.recovery=true;b.status='stopped';b.doorsOpen=true;b.blockedReason='Route updated. Leave at this door; this shuttle is out of service.';b.recoveryHold=15;}}return s;}catch{return null;}}
