import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const source=await fs.readFile(new URL('./dist/main.js',import.meta.url),'utf8');
function extract(name){const start=source.indexOf(`function ${name}(`);assert(start>=0);const next=source.indexOf('\nfunction ',start+1);return source.slice(start,next<0?source.length:next);}
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const npc=id=>({id,x:2,z:2,pose:0,model:{position:{set(){}},rotation:{}}});
const c={day:{state:{crisisTasks:{task:{actorId:'friend',status:'following'}},districts:{},player:{},events:[],actors:{},sequence:0}},npcs:[npc('friend'),npc('bystander'),{...npc('scene'),sceneTarget:{}},{...npc('following'),follow:true},{...npc('recruited'),recruited:true}],sim:{time:1,player:{x:0,z:0}},world:{obstacles:[]},taskProjection:null,incidentProjection:null,ambientProjection:null,crisisProjection:null,mischiefOrders:[],mischiefUntil:0,nearestFreePoint:p=>({...p}),dist:distance,clamp:(v,a,b)=>Math.max(a,Math.min(b,v))};
vm.createContext(c);vm.runInContext(['taskBodies','incidentBodies','applyIncidentProjection'].map(extract).join('\n'),c);
assert.deepEqual(Array.from(c.incidentBodies(),b=>b.id),['bystander','player'],'saved accepted companion excluded before projection rebuild');
assert(c.taskBodies().some(b=>b.id==='friend'),'task receives full raw body set');
for(const status of ['following','separated','completed']){c.day.state.crisisTasks.task.status=status;c.day.state.crisisTasks.task.holdSeconds=59;assert(!c.incidentBodies().some(b=>b.id==='friend'));}
c.day.state.crisisTasks.task.holdSeconds=60;assert(c.incidentBodies().some(b=>b.id==='friend'),'expired safe hold releases reservation');
c.day.state.crisisTasks.task.status='offered';assert(c.incidentBodies().some(b=>b.id==='friend'),'unaccepted offer does not freeze retreat');
const order=(objective,speed=3,to={x:8,z:3})=>({actorId:'friend',objective,speed,to});
c.ambientProjection={directives:[order('ambient')]};c.crisisProjection={directives:[order('scatter-from-line')]};c.taskProjection={reservedActorIds:['friend'],directives:[order('escort-follow-player')]};
c.applyIncidentProjection({directives:[order('argument')],events:[],effects:[]});
assert.equal(c.npcs[0].incidentOrder.objective,'escort-follow-player','task wins competing owners');assert.equal(c.npcs.filter(n=>n.incidentOrder?.actorId==='friend').length,1,'one actor has one resolved directive');
c.npcs[0].dayPath=[{x:9,z:3}];c.npcs[0].nextPathAt=99;c.taskProjection.directives=[order('escort-follow-player',0,{x:2,z:2})];c.applyIncidentProjection({directives:[],events:[],effects:[]});assert.equal(c.npcs[0].dayPath.length,0);assert.equal(c.npcs[0].nextPathAt,0);assert.equal(c.npcs[0].incidentOrder.speed,0,'hold retains literal zero');
c.npcs[0].dayPath=[{x:9,z:3}];c.taskProjection.directives=[order('escort-follow-player',3,{x:6,z:2})];c.applyIncidentProjection({directives:[],events:[],effects:[]});assert.equal(c.npcs[0].dayPath.length,0,'moving escort target invalidates obsolete path');
c.taskProjection=null;c.crisisProjection=null;c.ambientProjection=null;c.applyIncidentProjection({directives:[],events:[],effects:[]});assert.equal(c.npcs[0].incidentOrder,null);assert.equal(c.npcs[0].dayTarget,null);
// Execute actual NPC steering loop with a saturated navigation queue. Budget is
// simulation-time based, so observer acceleration and regular play are equal.
function navigationRun(dt){
 const receipts=[],steered=[];
 const moving=Array.from({length:40},(_,i)=>({...npc('moving'+i),dayTarget:{x:20,z:2},incidentOrder:{...order('scatter-from-line',3),actorId:'moving'+i,to:{x:20,z:2}}}));
 const stopped={...npc('stopped'),dayTarget:{x:20,z:2},incidentOrder:{...order('escort-wait-for-player',0),actorId:'stopped',to:{x:20,z:2}}};
 // Put the accepted companion LAST, behind more requests than the budget can
 // satisfy. A test where everybody is stopped never exercises this queue.
 const escort={...npc('escort'),dayTarget:{x:20,z:2},incidentOrder:{...order('escort-follow-player',3),actorId:'escort',to:{x:20,z:2}}};
 const context={npcs:[...moving,stopped,escort],sim:{police:[],time:0,player:{x:0,z:0}},navigationCredits:0,updateLivingActors(){},game:{},items:[],talk:null,day:{state:{crisisTasks:{task:{actorId:'escort',status:'following'}},actors:{}}},world:{obstacles:[]},dist:distance,
 findPath(a,b){receipts.push({id:a.id,time:context.sim.time});return [{...b}];},
 steer(n,target,speed){steered.push({id:n.id,speed,moving:distance(n,target)>.1});return speed;}};
 vm.createContext(context);vm.runInContext(extract('updateNPCs'),context);
 for(let i=0;i<Math.round(2/dt);i++){
  context.sim.time=(i+1)*dt;
  for(const n of moving){n.nextPathAt=0;n.dayPath=[];}
  // The companion's destination moves while competing route requests remain
  // saturated. This should refresh within .4 sec, not the old 2 sec interval.
  if(context.sim.time>=.5){escort.incidentOrder.to={x:21.5,z:2};escort.dayTarget=escort.incidentOrder.to;}
  context.updateNPCs(dt);
 }
 assert(receipts.length>20,'Moving population must actually consume route budget');
 assert(receipts.some(r=>r.id.startsWith('moving')),'Crowd route requests are exercised');
 assert(!receipts.some(r=>r.id==='stopped'),'Stopped escort must not consume route budget');
 assert(!steered.some(r=>r.id==='stopped'&&r.speed>0),'Stopped escort cannot inherit walking speed');
 const escortRoutes=receipts.filter(r=>r.id==='escort');
 assert(escortRoutes.length>=2,'Accepted companion must not starve behind the crowd');
 assert(escortRoutes[0].time<=.11,'Companion receives first available navigation budget');
 assert(escortRoutes[1].time<=.91,'A 1.5m target change refreshes within .4 sec');
 assert(steered.some(r=>r.id==='escort'&&r.moving&&r.speed===3),'Companion receives a usable route and requested speed');
 return receipts.length;
}
assert.equal(navigationRun(1/60),navigationRun(.1),'same simulated duration gets same positive route budget');
console.log('PASS actual main escort integration: reservations, single-owner projection, stop/repath, release, moving crowd cadence, zero-speed exclusion and escort navigation priority');
