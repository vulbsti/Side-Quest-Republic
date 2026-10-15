import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {stageEscalation,cohortFor,CROWD_CAPACITY} from './dist/escalation-staging.js';
import {deriveEscalation} from './dist/escalation-director.js';
import {createLivingWorld} from './dist/living-world.js';
import {DAY_ACTORS,DAY_DISTRICTS,DAY_ENCOUNTERS} from './dist/day-content.js';
import {CrowdFlow,CROWD_GATEWAYS} from './dist/crowd-flow.js';
import {findPath,nearestFreePoint,steer,dist,overlapsXZ} from './dist/simulation.js';
import {DISTRICTS} from './dist/districts.js';
import {testedWorldObstacles as obstacles} from './test-world-routes.mjs';
const bodies=()=>Array.from({length:CROWD_CAPACITY},(_,i)=>({id:`arrival${i}`,dayArrival:true,hidden:true,x:0,z:0,y:0,radius:.36,height:1.8}));
assert.deepEqual([0,35,36,43,44,55,56,59].map(cohortFor),['assembly','assembly','volunteers','volunteers','police','police','fictional-forum','fictional-forum']);
const world=createLivingWorld(15426,{actors:DAY_ACTORS,districts:DAY_DISTRICTS,encounters:DAY_ENCOUNTERS});
for(const d of DISTRICTS)world.districts[d.id]??={name:d.name,tension:5,density:5,access:100,supplies:50,solidarity:50};
const failures=[],journeys=new Set();let walked=0;
const main=await fs.readFile(new URL('./dist/main.js',import.meta.url),'utf8');
const waypointTolerance=Number(main.match(/dist\(n,n.dayPath\[0\]\)<([.\d]+)/)?.[1]);assert(Number.isFinite(waypointTolerance),'production waypoint tolerance found');
assert.match(main,/police:cohort==='police'/,'forum actors must remain civilian render bodies');
for(const time of [0,210,450,730,1050]){
 world.time=time;
 for(const hotspot of ['connector','jantar','court','assembly','press']){
  for(const d of Object.values(world.districts))Object.assign(d,{tension:5,density:5,access:100});
  Object.assign(world.districts[hotspot],{tension:85,density:85,access:40});
  const plan=deriveEscalation(world),pool=bodies(),staging=stageEscalation(plan,pool);
  assert(staging.desiredCount<=CROWD_CAPACITY&&staging.desiredCount>=0);
  assert.equal(staging.allowed.filter(id=>cohortFor(Number(id.replace('arrival','')))==='police').length,Math.min(12,plan.police.reinforcements));
  if(time<210)assert(!staging.allowed.some(id=>cohortFor(Number(id.replace('arrival','')))==='police'),'reinforcements must not pre-spawn');
  const forum=plan.groups.find(g=>g.id==='fictional-forum');assert.equal(forum.identityVisible,false);
  for(const [id,order] of Object.entries(staging.directives)){
   const journeyKey=JSON.stringify([order.target,order.speed]);if(journeys.has(journeyKey))continue;journeys.add(journeyKey);
   const gate=nearestFreePoint(CROWD_GATEWAYS[4],obstacles,{radius:.5,maxRadius:5});
   const target=nearestFreePoint(order.target,obstacles,{radius:.55,maxRadius:6});
   const path=target?findPath(gate,target,obstacles):[];
   if(!path.length){failures.push(`${time}/${hotspot}/${id}: unreachable projected directive ${JSON.stringify(order.target)}`);continue;}
   const b={...gate,y:0,radius:.36,height:1.8};let frames=0;
   while(path.length&&frames++<4000){if(dist(b,path[0])<waypointTolerance)path.shift();else steer(b,path[0],order.speed,.1,obstacles);}
   if(path.length||dist(b,target)>1)failures.push(`${time}/${hotspot}/${id}: physical steering stuck`);
   assert(!obstacles.some(o=>(o.base||0)<1.8&&o.h>0&&overlapsXZ(b,o,.359)),'cohort journey ends outside solids');walked++;
  }
 }
}
// Actual dispatcher lifecycle: hidden gateway placement only, then caller-owned
// steering until all requested cohorts reach their own destinations.
world.time=730;const plan=deriveEscalation(world),pool=bodies(),flow=new CrowdFlow({obstacles,districts:DISTRICTS});
for(let tick=0;tick<420;tick++){
 const staging=stageEscalation(plan,pool),old=pool.map(b=>({...b}));
 flow.update({bodies:pool.filter(b=>staging.allowed.includes(b.id)||!b.hidden),directives:staging.directives,desiredCount:staging.desiredCount,state:{...world,time:730+tick},player:{x:0,z:15}});
 for(let i=0;i<pool.length;i++){const b=pool[i];if(!old[i].hidden)assert.equal(dist(old[i],b),0,'dispatcher never teleports visible cohorts');if(b.hidden)continue;for(let frame=0;frame<20;frame++){const p=b.dayPath?.[0];if(!p)break;if(dist(b,p)<waypointTolerance)b.dayPath.shift();else steer(b,p,b.crowdSpeed||2,.05,obstacles);}}
}
const dispatched=pool.filter(b=>!b.hidden);for(const b of dispatched)if(dist(b,b.dayTarget)>1.2)failures.push(`dispatcher ${b.id} never reached destination`);
assert.equal(dispatched.length,stageEscalation(plan,pool).desiredCount,'all eligible cohorts physically enter');
assert.deepEqual(failures,[],`Physical staging failures (${failures.length}):\n${failures.join('\n')}`);
console.log(`PASS escalation staging: role allocation, no early reinforcements, civilian forum, bounded cohorts, ${walked} actual-map physical routes and dispatcher arrivals.`);
