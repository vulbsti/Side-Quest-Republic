import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {createLivingWorld,actWorld,applyCompletedStoryTaskEffects} from './dist/living-world.js';
import {DAY_ENCOUNTERS,DAY_ACTORS,DAY_DISTRICTS} from './dist/day-content.js';
import {updateStoryTasks} from './dist/story-tasks.js';
const source=await fs.readFile(new URL('./dist/main.js',import.meta.url),'utf8');
function extract(name){const start=source.indexOf(`function ${name}(`);assert(start>=0);const end=source.indexOf('\nfunction ',start+1);return source.slice(start,end<0?source.length:end);}
const npc=id=>({id,x:2,z:2,model:{}}),dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const state=createLivingWorld(42,{encounters:DAY_ENCOUNTERS,actors:DAY_ACTORS,districts:DAY_DISTRICTS});state.time=800;
const c={day:{state},npcs:[npc('friend'),npc('ravi'),npc('bystander')],sim:{time:1,player:{x:0,z:0},trust:0,aura:0,provoke(){}},world:{obstacles:[]},storyProjection:null,taskProjection:null,incidentProjection:null,ambientProjection:null,crisisProjection:null,mischiefOrders:[],mischiefUntil:0,nearestFreePoint:p=>({...p}),dist,clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),applyCompletedStoryTaskEffects,sound:{sfx(){}},say(){},toast(){},applyStreetResult(){},checkpoint(){}};
vm.createContext(c);vm.runInContext(['taskBodies','storyReserved','storyBodies','incidentBodies','applyStoryResult','applyIncidentProjection'].map(extract).join('\n'),c);
const start=source.indexOf('consequence:(result,choice,state)=>');assert(start>=0);const end=source.indexOf('checkpoint();}});',start);assert(end>=0);vm.runInContext('var consequence='+source.slice(start+'consequence:'.length,end+'checkpoint();}'.length),c);
const accepted=actWorld(state,'first_injury','assist');assert.ok(accepted.ok);c.consequence(accepted,accepted.choice,state);assert.equal(state.player.aid,0);assert.equal(c.sim.trust,0,'actual UI consequence cannot reward intended aid');
const receipt={id:'completed-medical',type:'story-task-completed',kind:'medical',sourceEventId:accepted.event.id,time:800,actorIds:['friend'],position:{x:48,z:8}};state.storyTasks={tasks:[],history:[receipt]};
c.applyStoryResult({events:[receipt],effects:[],directives:[]});assert.equal(state.player.aid,10);c.applyStoryResult({events:[receipt],effects:[],directives:[]});assert.equal(state.player.aid,10,'actual bridge applies deferred reward once');
c.storyProjection=null;state.storyTasks.tasks=[{id:'saved',status:'following',kind:'medical',actorIds:['friend']}];assert(!c.incidentBodies().some(b=>b.id==='friend'),'persisted task reserves actor before rebuilt projection');
for(const status of ['queued','ready','following','separated','completed']){Object.assign(state.storyTasks.tasks[0],{status,holdSeconds:29});assert(c.storyReserved().includes('friend'));}
state.storyTasks.tasks[0].holdSeconds=30;assert(!c.storyReserved().includes('friend'),'completed hold releases at 30 seconds');state.storyTasks.tasks[0].status='abandoned';assert(!c.storyReserved().includes('friend'));
c.taskProjection={reservedActorIds:['ravi'],directives:[]};assert(!c.storyBodies().some(b=>b.id==='ravi'),'active companion escort excludes actor from story allocation');
const order=objective=>({actorId:'friend',objective,speed:2,to:{x:9,z:9}});c.ambientProjection={directives:[order('ambient')]};c.crisisProjection={directives:[order('scatter')]};c.taskProjection.directives=[order('escort')];c.storyProjection={directives:[order('story-task-medical-following')],reservedActorIds:['friend']};c.applyIncidentProjection({directives:[order('incident')],effects:[],events:[]});assert.equal(c.npcs[0].incidentOrder.objective,'story-task-medical-following');assert.equal(c.npcs.filter(n=>n.incidentOrder?.actorId==='friend').length,1,'one winning physical order');
c.npcs[0].dayPath=[{x:5,z:5}];c.storyProjection.directives=[{...order('story-task-medical-completed'),speed:0}];c.applyIncidentProjection({directives:[],effects:[],events:[]});assert.equal(c.npcs[0].dayPath.length,0,'completed hold cancels travel');assert.equal(c.npcs[0].incidentOrder.speed,0);
const heldWorld={seed:42,time:800,resolved:{},storyTasks:{sequence:1,tasks:[{id:'held',kind:'medical',status:'completed',actorIds:['friend'],holdSeconds:29.5}],history:[]}};
const expired=updateStoryTasks(heldWorld,[{id:'player',x:0,z:0},npc('friend')],.5);assert(!expired.reservedActorIds.includes('friend'));assert.equal(expired.directives.length,0,'module physically releases completed hold');
c.storyProjection=expired;c.crisisProjection=c.ambientProjection=c.taskProjection=null;c.applyIncidentProjection({directives:[],effects:[],events:[]});assert.equal(c.npcs[0].incidentOrder,null);assert.equal(c.npcs[0].dayTarget,null);
console.log('PASS actual runtime bridge: deferred HUD rewards, canonical completion once, saved reservations, escort exclusion, single winner, zero-speed hold and physical release');
