import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {updateCrisis,actCrisis} from './dist/crowd-crisis.js';
import {CrowdFlow} from './dist/crowd-flow.js';
import {nearestFreePoint,findPath,steer,visible,separateBodies,dist,overlapsXZ} from './dist/simulation.js';
import {testedWorldObstacles as obstacles} from './test-world-routes.mjs';
const sight={canSee:(a,b)=>visible(a,b,obstacles)},main=await fs.readFile(new URL('./dist/main.js',import.meta.url),'utf8');
const tolerance=Number(main.match(/dist\(n,n.dayPath\[0\]\)<([.\d]+)/)?.[1]);assert.equal(tolerance,.2);assert(main.includes('n.incidentOrder?.speed??n.crowdSpeed??2.0'));
function run(intervention=false){
 const raw=[...Array.from({length:9},(_,i)=>({id:`arrival${i}`,cohort:i===8?'volunteers':'assembly',x:6+(i%3)*1.4,z:18+Math.floor(i/3)*1.5})),...Array.from({length:3},(_,i)=>({id:`arrival${44+i}`,cohort:'police',x:13,z:18+i*2})),{id:'scene-person',sceneTarget:{x:9,z:25},x:9,z:25},{id:'incident-person',incidentOwned:true,x:10,z:26},{id:'player',x:11,z:23}];
 const bodies=raw.map(b=>({...b,...nearestFreePoint(b,obstacles,{radius:.4,maxRadius:2}),dayArrival:b.id.startsWith('arrival'),hidden:false,y:0,radius:.36,height:1.8}));separateBodies(bodies,obstacles);
 const world={seed:42,time:740,escalation:{intensity:90,hotspot:{district:'connector',x:9,z:20}},institutions:{command:{pressure:70}},actors:{}},flow=new CrowdFlow({obstacles,districts:[{id:'connector',x:9,z:20}]}),motion={},actorMotion={},events=[],blocked=[];let acted=false,maxStep=0;
 for(let frame=0;frame<2000;frame++){
  const before=bodies.map(b=>({...b}));world.time+=.05;let result=updateCrisis(world,bodies,.05,sight);events.push(...result.events);
  for(let i=0;i<bodies.length;i++)assert.equal(dist(before[i],bodies[i]),0,'crisis module never teleports bodies');
  if(intervention&&!acted&&result.options.includes('keep-passage')){result=actCrisis(world,bodies,'keep-passage',sight);assert(result.ok);events.push(...result.events);acted=true;}
  const old=new Map(bodies.map(b=>[b.id,b.incidentOrder]));for(const b of bodies)b.incidentOrder=null;
  for(const order of result.directives){assert(!['scene-person','incident-person','player'].includes(order.actorId),'reserved actors retain ownership');const b=bodies.find(b=>b.id===order.actorId),to=nearestFreePoint(order.to,obstacles,{radius:.4,maxRadius:6})||{x:b.x,z:b.z};if(!to){blocked.push(`${order.actorId}:${order.objective}:no projection ${JSON.stringify(order.to)} from ${b.x},${b.z}`);continue;}b.incidentOrder={...order,to};if(old.get(b.id)?.objective!==order.objective){b.dayPath=[];b.nextPathAt=0;}}
  if(frame%20===0)flow.update({bodies,state:world,desiredCount:12,directives:Object.fromEntries(bodies.filter(b=>b.dayArrival).map(b=>[b.id,{target:{x:-20,z:15},district:'connector',activity:'ambient'}]))});
  let budget=3;
  for(const b of bodies){const order=b.incidentOrder;if(!order||order.speed===0){b.dayPath=[];continue;}b.dayTarget=order.to;let aim=order.to;if(dist(b,aim)>.8&&budget>0&&world.time>=(b.nextPathAt||0)&&(!b.dayPath?.length||dist(b.dayPath.at(-1),aim)>3)){budget--;b.nextPathAt=world.time+2;b.dayPath=findPath(b,aim,obstacles);if(!b.dayPath.length)blocked.push(`${b.id}:${order.objective}:no route`);}if(!b.dayPath?.length&&dist(b,aim)>.8)aim=b;if(b.dayPath?.length){if(dist(b,b.dayPath[0])<tolerance)b.dayPath.shift();aim=b.dayPath[0]||order.to;}const oldPosition={...b};steer(b,aim,order.speed??2,.05,obstacles);motion[order.objective]=(motion[order.objective]||0)+dist(oldPosition,b);const key=b.id+':'+order.objective;actorMotion[key]=(actorMotion[key]||0)+dist(oldPosition,b);}
  separateBodies(bodies,obstacles);
  for(let i=0;i<bodies.length;i++){maxStep=Math.max(maxStep,dist(before[i],bodies[i]));assert(dist(before[i],bodies[i])<.6,'steering and contact corrections remain continuous');assert(!obstacles.some(o=>(o.base||0)<1.8&&o.h>0&&overlapsXZ(bodies[i],o,.359)),'no static penetration');}
 }
 return {world,bodies,events,motion,actorMotion,blocked:[...new Set(blocked)],acted,maxStep};
}
const absent=run(),passage=run(true);
assert(absent.events.some(e=>e.type==='crisis-advance'));assert(absent.events.some(e=>e.type==='crisis-scatter'));assert(absent.events.some(e=>e.type==='crisis-cooldown'),'full physical journey reaches persistent aftermath');assert(absent.world.crowdCrisis.orders.some(d=>d.objective==='recover-after-wave'),'recovery remains physically owned');assert(absent.motion['line-advance']>2,'police line advances physically');assert(absent.actorMotion['arrival6:scatter-from-line']>2,'fountain-blocked person now physically evacuates instead of losing ownership');assert(absent.motion['scatter-from-line']>4,'civilians physically run');assert(passage.acted);assert(passage.motion['use-safe-passage']>2,'passage intervention physically moves people');
assert.notDeepEqual(absent.bodies.map(b=>[b.x,b.z]),passage.bodies.map(b=>[b.x,b.z]),'intervention changes actual resulting positions');
for(const [key,travel] of Object.entries(absent.actorMotion))if(key.includes('back-away-from-close-line'))assert(travel<12,`${key} must settle instead of fighting neighbouring endpoints: ${travel}m`);
assert.deepEqual(absent.blocked,[]);assert.deepEqual(passage.blocked,[]);
console.log('PASS actual-map crisis journeys',JSON.stringify({absent:absent.motion,passage:passage.motion,maxStep:Math.max(absent.maxStep,passage.maxStep)}));
