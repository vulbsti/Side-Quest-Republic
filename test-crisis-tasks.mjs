import assert from 'node:assert/strict';
import {updateCrisisTasks as update,actCrisisTask as act} from './dist/crisis-tasks.js';
const setup=()=>({world:{seed:4,time:800,crowdCrisis:{wave:1,status:'scatter',district:'jm',line:{x:0,z:0},orders:[{actorId:'friend',objective:'scatter-from-line'}]}},bodies:[{id:'player',x:5,z:0},{id:'friend',x:7,z:0}],o:{canSee:()=>true,safePoints:[{id:'chai',label:'the chai stall',x:20,z:0}]}});
let {world,bodies,o}=setup();let r=update(world,bodies,.1,o);assert.equal(r.options[0].id,'escort-start');assert.equal(r.directives.length,0);assert.equal(r.objective.status,'offered');
r=act(world,bodies,'escort-start',o);assert(r.ok);assert.equal(r.state.task.status,'following');assert.notEqual(r.state.task.status,'completed');
// No position mutation; follow target is a routed intention.
const before=structuredClone(bodies);r=update(world,bodies,.1,o);assert.deepEqual(bodies,before);assert.equal(r.directives[0].actorId,'friend');assert.equal(r.directives[0].objective,'escort-follow-player');
// Player at destination alone cannot complete. Separation holds actual position.
bodies[0].x=20;r=update(world,bodies,1,o);assert.equal(r.state.task.status,'separated');assert.deepEqual(r.directives[0].to,{x:7,z:0});assert(!act(world,bodies,'escort-rejoin',o).ok);
bodies[0].x=8;assert(act(world,bodies,'escort-rejoin',o).ok);
// Simulate physical movement through caller-controlled bounded steps.
for(let i=0;i<80;i++){bodies[0].x=Math.min(20,bodies[0].x+.2);r=update(world,bodies,.1,o);const d=r.directives[0];if(d){const dx=d.to.x-bodies[1].x;bodies[1].x+=Math.sign(dx)*Math.min(Math.abs(dx),d.speed*.1);}if(r.state.task.status==='completed')break;}
assert.equal(r.state.task.status,'completed');assert(bodies[1].x>=17);assert.equal(world.crisisTasks.history.filter(e=>e.type==='escort-completed').length,1);
const saved=JSON.parse(JSON.stringify(world));update(saved,bodies,1,o);assert.equal(saved.crisisTasks.history.filter(e=>e.type==='escort-completed').length,1);
assert.equal(update(world,bodies,1,o).options.length,0); // no repeat same wave
// Missing LOS and impossible route fail closed; no remote offers.
for(const override of [{canSee:undefined},{canSee:()=>false},{canRoute:()=>false},{safePoints:[]}]){const q=setup();assert.equal(update(q.world,q.bodies,.1,{...q.o,...override}).objective,null);}
({world,bodies,o}=setup());bodies[0].x=-5;update(world,bodies,.1,o);assert.equal(act(world,bodies,'escort-start',o).ok,false);
// Occlusion separates, while reload preserves paused objective and timeout.
({world,bodies,o}=setup());update(world,bodies,.1,o);act(world,bodies,'escort-start',o);o.canSee=()=>false;update(world,bodies,1,o);world=JSON.parse(JSON.stringify(world));for(let i=0;i<36;i++)update(world,bodies,1,o);assert.equal(world.crisisTasks.task.status,'parted');
// Existing scene ownership cannot be stolen, even after accepting.
({world,bodies,o}=setup());update(world,bodies,.1,o);act(world,bodies,'escort-start',o);bodies[1].sceneTarget={x:2,z:3};r=update(world,bodies,.1,o);assert.equal(r.directives.length,0);assert.equal(r.state.task.status,'unavailable');
console.log('PASS crisis escort: physical follow, contact, LOS, route gate, arrival, separation, persistence and ownership');
// Root integration's authored rally points must be clear and reachable in the
// actual core+expansion collision map, not merely plausible coordinates.
const {testedWorldObstacles:obstacles}=await import('./test-world-routes.mjs');
const {findPath,overlapsXZ}=await import('./dist/simulation.js');
for(const destination of [{x:-6,z:24},{x:48,z:8}]){
 assert(!obstacles.some(o=>(o.base||0)<1.8&&o.h>0&&overlapsXZ(destination,o,.4)),'rally point is walkable');
 assert(findPath({x:24,z:-12},destination,obstacles).length>0,'rally point reachable from Jantar gathering');
}
// Completion retains the companion at their rally for sixty simulated seconds.
({world,bodies,o}=setup());update(world,bodies,.1,o);act(world,bodies,'escort-start',o);bodies[0].x=20;bodies[1].x=19;
world.finished=true;for(let i=0;i<3;i++)r=update(world,bodies,1,o);
assert.equal(r.state.task.status,'completed');assert.deepEqual(r.reservedActorIds,['friend']);assert.equal(r.directives[0].objective,'escort-safe-rally');
for(let i=0;i<60;i++)r=update(world,bodies,1,o);assert.equal(r.directives.length,0);assert.deepEqual(r.reservedActorIds,[]);
console.log('PASS real-map rally routes, post-wave completion and bounded safe-point reservation');
const {nearestFreePoint,steer,separateBodies,visible}=await import('./dist/simulation.js');
({world,bodies,o}=setup());
world.crowdCrisis.line={x:16,z:25};
Object.assign(bodies[0],nearestFreePoint({x:6,z:25},obstacles,{radius:.4,maxRadius:3}),{radius:.36,height:1.8,y:0});
Object.assign(bodies[1],nearestFreePoint({x:7,z:25},obstacles,{radius:.4,maxRadius:3}),{radius:.36,height:1.8,y:0});
o={canSee:(a,b)=>visible(a,b,obstacles),canRoute:(a,b)=>findPath(a,b,obstacles).length>0,safePoints:[{id:'connector',label:'the fountain meeting point',x:-6,z:24},{id:'east',label:'the east meeting point',x:48,z:8}]};
r=update(world,bodies,.05,o);assert(r.options.length);assert(act(world,bodies,'escort-start',o).ok);
let playerPath=findPath(bodies[0],world.crisisTasks.task.destination,obstacles),actorPath=[],maxMove=0,frames=0;
for(;frames<2400;frames++){
 const old=bodies.map(b=>({...b}));
 if(playerPath.length&&Math.hypot(bodies[0].x-playerPath[0].x,bodies[0].z-playerPath[0].z)<.15)playerPath.shift();
 if(playerPath.length)steer(bodies[0],playerPath[0],1.4,.05,obstacles);
 r=update(world,bodies,.05,o);
 if(r.state.task.status==='separated'&&r.options.some(v=>v.id==='escort-rejoin'))r=act(world,bodies,'escort-rejoin',o);
 const order=r.directives[0];
 if(order){
  if(frames%10===0||!actorPath.length)actorPath=findPath(bodies[1],order.to,obstacles);
  if(actorPath.length&&Math.hypot(bodies[1].x-actorPath[0].x,bodies[1].z-actorPath[0].z)<.15)actorPath.shift();
  steer(bodies[1],actorPath[0]||order.to,order.speed,.05,obstacles);
 }
 separateBodies(bodies,obstacles);
 for(let i=0;i<bodies.length;i++){
  maxMove=Math.max(maxMove,Math.hypot(bodies[i].x-old[i].x,bodies[i].z-old[i].z));
  assert(!obstacles.some(o=>(o.base||0)<1.8&&o.h>0&&overlapsXZ(bodies[i],o,.359)),'escort body never penetrates static geometry');
 }
 assert(Math.hypot(bodies[0].x-bodies[1].x,bodies[0].z-bodies[1].z)>=.71,'player and companion stay separated');
 if(r.state.task.status==='completed')break;
}
assert.equal(r.state.task.status,'completed',JSON.stringify({task:r.state.task,bodies}));assert(maxMove<.3,'no teleport through actual geometry');
console.log('PASS physical actual-map escort',JSON.stringify({frames,maxMove}));
