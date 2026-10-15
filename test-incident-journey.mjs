import assert from 'node:assert/strict';
import {updateIncident,actIncident} from './dist/street-incidents.js';
import {nearestFreePoint,findPath,steer,visible,separateBodies,dist,overlapsXZ} from './dist/simulation.js';
import {testedWorldObstacles as obstacles} from './test-world-routes.mjs';
const sight={canSee:(a,b)=>visible(a,b,obstacles)};
function setup(nearPlayer=false){
 const positions=[['arrival28','fictional-forum',8,20],['arrival29','fictional-forum',9,22],['officer','police',12,20],['arrival22','police',14,22],['spectator','assembly',8,24],['player',null,nearPlayer?6:-20,nearPlayer?20:45]];
 const bodies=positions.map(([id,cohort,x,z])=>({id,cohort,...nearestFreePoint({x,z},obstacles,{radius:.5,maxRadius:3}),radius:.36,height:1.8,y:0,hidden:false}));
 return {world:{seed:42,time:610,escalation:{hotspot:{district:'connector',x:8,z:20}}},bodies};
}
function play(intervene){
 const {world,bodies}=setup(intervene),events=[],directives=[],responsePositions=[];let intervention=false,maxMovement=0;
 for(let frame=0;frame<1200;frame++){
  const before=bodies.map(b=>({...b}));world.time+=.05;
  let result=updateIncident(world,bodies,.05,sight);
  for(let i=0;i<bodies.length;i++)assert.equal(dist(before[i],bodies[i]),0,'incident state machine never relocates bodies');
  events.push(...result.events);
  if(intervene&&!intervention&&result.options.includes('separate')){result=actIncident(world,bodies,'separate',sight);assert(result.ok);events.push(...result.events);intervention=true;}
  directives.push(...result.directives);
  let budget=3;
  for(const b of bodies){
   const order=result.directives.find(d=>d.actorId===b.id);if(!order)continue;
   const target=nearestFreePoint(order.to,obstacles,{radius:.4,maxRadius:2});if(!target)continue;
   let aim=target;
   if(dist(b,target)>.8&&budget>0&&world.time>=(b.nextPathAt||0)&&(!b.dayPath?.length||dist(b.dayPath.at(-1),target)>3)){budget--;b.nextPathAt=world.time+2;b.dayPath=findPath(b,target,obstacles);}
   if(!b.dayPath?.length&&dist(b,target)>.8)aim=b;
   if(b.dayPath?.length){if(dist(b,b.dayPath[0])<.2)b.dayPath.shift();aim=b.dayPath[0]||target;}
   steer(b,aim,2,.05,obstacles);
  }
  separateBodies(bodies,obstacles);
  if(result.state.status==='response'){const officer=bodies.find(b=>b.id==='officer'),subject=bodies.find(b=>b.id===result.state.participants.instigatorId);responsePositions.push({x:officer.x,z:officer.z,distance:dist(officer,subject)});}
  for(let i=0;i<bodies.length;i++){maxMovement=Math.max(maxMovement,dist(before[i],bodies[i]));assert(dist(before[i],bodies[i])<.3,'physical steering/separation remains continuous');assert(!obstacles.some(o=>(o.base||0)<1.8&&o.h>0&&overlapsXZ(bodies[i],o,.359)),'incident bodies do not enter solids');}
 }
 return {world,bodies,events,directives,responsePositions,intervention,maxMovement};
}
const absent=play(false),shove=absent.events.find(e=>e.type==='incident-shove');
assert(shove,`Actual map incident did not reach shove: ${JSON.stringify(absent.world.streetIncident.history)}`);
assert(absent.events.some(e=>e.type==='incident-response'));
assert(!shove.witnessIds.includes('player'),'absent player cannot witness remotely');
const response=absent.directives.find(d=>d.actorId==='officer'&&d.objective==='address-witnessed-action');
assert(response,'named officer receives witnessed subject response');assert.equal(response.targetId,shove.perpetratorId);assert.equal(response.automaticDetention,false);assert(response.sourceEventId===shove.id);
assert(absent.responsePositions.length>2);assert(dist(absent.responsePositions[0],absent.responsePositions.at(-1))>.2,'named officer physically follows witnessed subject rather than only receiving an order');assert(absent.responsePositions.every(p=>p.distance>=.70),'response maintains body clearance');
assert(absent.world.streetIncident.policeKnowledge.every(k=>k.subjectId===shove.perpetratorId),'companion is not guilty by affiliation');
const prevented=play(true);assert(prevented.intervention);assert(prevented.events.some(e=>e.type==='incident-prevented'));assert(!prevented.events.some(e=>e.type==='incident-shove'));
console.log(`PASS actual-map incident journey: absent-player shove/response, nearby intervention, witnessed named-officer response, no teleports, collision separation (max step ${absent.maxMovement.toFixed(3)}m).`);
