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
function navigationRun(dt){let routes=0,speeds=[];const context={npcs:Array.from({length:40},(_,i)=>({...npc('n'+i),dayTarget:{x:20,z:2},incidentOrder:order('escort-wait-for-player',0,{x:20,z:2})})),sim:{police:[],time:0,player:{x:0,z:0}},navigationCredits:0,updateLivingActors(){},game:{},items:[],talk:null,day:null,world:{obstacles:[]},dist:distance,findPath(a,b){routes++;return [{...b}];},steer(n,target,speed){speeds.push(speed);return 0;}};vm.createContext(context);vm.runInContext(extract('updateNPCs'),context);
 for(let i=0;i<Math.round(2/dt);i++){context.sim.time+=dt;for(const n of context.npcs){n.nextPathAt=0;n.dayPath=[];}context.updateNPCs(dt);}
 assert(speeds.every(v=>v===0),'actual steering does not replace stopped escort speed with walking default');return routes;
}
assert.equal(navigationRun(1/60),navigationRun(.1),'same simulated duration gets same route budget');
console.log('PASS actual main escort integration: saved reservations, single-owner projection, stop/repath, release, zero-speed steering and navigation cadence parity');
