import assert from 'node:assert/strict';
import {updateStoryTasks as update,actStoryTask as act} from './dist/story-tasks.js';
const setup=(encounter='first_injury',choice='assist')=>({w:{seed:4,time:800,finished:true,resolved:{[encounter]:{status:'played',choiceId:choice,eventId:'intent1',time:799}}},b:[{id:'player',x:0,z:0},{id:'arrival1',x:2,z:0},{id:'arrival2',x:1,z:2}],o:{canSee:()=>true,canRoute:()=>true,safePoint:{x:20,z:0},micPoint:{x:1,z:0}}});
let {w,b,o}=setup();let r=update(w,b,.1,o);assert.equal(r.state.tasks[0].status,'offered');assert.equal(r.effects.length,0);assert(r.options.some(x=>x.id==='story-task-start'));const before=structuredClone(b);r=act(w,b,'story-task-start',o);assert(r.ok);assert.deepEqual(b,before);
// Normal walking 4.7m/s stays within follow range; physical integration is caller-owned.
for(let i=0;i<120;i++){b[0].x=Math.min(20,b[0].x+4.7*.05);r=update(w,b,.05,o);for(const d of r.directives){const a=b.find(x=>x.id===d.actorId),dx=d.to.x-a.x,dz=d.to.z-a.z,n=Math.hypot(dx,dz);if(n){const step=Math.min(n,d.speed*.05);a.x+=dx/n*step;a.z+=dz/n*step;}}}
assert.equal(w.storyTasks.tasks[0].status,'completed');assert.equal(w.storyTasks.history.filter(x=>x.type==='story-task-completed').length,1);assert(b[1].x>=17);const loaded=JSON.parse(JSON.stringify(w));update(loaded,b,1,o);assert.equal(loaded.storyTasks.tasks.length,1);assert.equal(loaded.storyTasks.history.filter(x=>x.type==='story-task-completed').length,1);
// Expired hold releases actor, no teleport and no repeated award.
for(let i=0;i<31;i++)r=update(w,b,1,o);assert.equal(r.reservedActorIds.length,0);assert.equal(r.effects.length,0);
({w,b,o}=setup());update(w,b,.1,o);act(w,b,'story-task-start',o);b[0].x=20;r=update(w,b,.1,o);assert.equal(r.state.tasks[0].status,'separated');assert(!act(w,b,'story-task-rejoin',o).ok);b[0].x=3;assert(act(w,b,'story-task-rejoin',o).ok);let visible=false;for(let i=0;i<2;i++)update(w,b,1,{...o,canSee:()=>visible});assert.equal(w.storyTasks.tasks[0].status,'following');for(let i=0;i<2;i++)update(w,b,1,{...o,canSee:()=>visible});assert.equal(w.storyTasks.tasks[0].status,'separated');
// Repair must actually hold near point. Walking away resets; choice alone never completes.
({w,b,o}=setup('broken_mic','help'));update(w,b,.1,o);assert(act(w,b,'story-task-repair',o).ok);for(let i=0;i<3;i++)update(w,b,1,o);assert.equal(w.storyTasks.tasks[0].status,'repairing');b[0].x=8;update(w,b,1,o);assert.equal(w.storyTasks.tasks[0].repairSeconds,0);assert(!act(w,b,'story-task-repair',o).ok);b[0].x=1;act(w,b,'story-task-repair',o);for(let i=0;i<4;i++)r=update(w,b,1,o);assert.equal(w.storyTasks.tasks[0].status,'completed');assert.equal(r.events[0].kind,'mic');
// Regroup requires two individual visible acceptances and all three physical arrivals.
({w,b,o}=setup('last_group_call','rollcall'));update(w,b,.1,o);assert(act(w,b,'story-task-recruit:arrival1',o).ok);assert(!act(w,b,'story-task-recruit:arrival1',o).ok);assert(act(w,b,'story-task-recruit:arrival2',o).ok);b[0].x=20;for(let i=0;i<3;i++)update(w,b,1,o);assert.notEqual(w.storyTasks.tasks[0].status,'completed');b[0].x=2;assert(act(w,b,'story-task-rejoin',o).ok);for(const a of b){a.x=20;a.z=0;}for(let i=0;i<2;i++)r=update(w,b,1,o);assert.equal(r.events[0].kind,'regroup');assert.equal(r.events[0].actorIds.length,2);
// Invisible, reserved and unreachable candidates never get recruited.
({w,b,o}=setup());r=update(w,b,1,{...o,canSee:()=>false});assert.equal(r.state.tasks[0].status,'queued');r=update(w,b,1,{...o,canRoute:()=>false});assert.equal(r.state.tasks[0].status,'queued');assert(!act(w,b,'story-task-start',o).ok);
// Queue is oldest-first, abandonment never emits a completion.
({w,b,o}=setup());w.resolved.broken_mic={status:'played',choiceId:'gear',eventId:'older',time:700};r=update(w,b,1,o);assert.equal(r.state.tasks[0].kind,'mic');act(w,b,'story-task-abandon',o);r=update(w,b,1,o);assert.equal(r.objective.actorId,'arrival1');assert.equal(w.storyTasks.history.filter(x=>x.type==='story-task-completed').length,0);
console.log('story tasks passed: physical medical escort, held repair, two-person regroup, separation, truthful receipts, queue and saved state');
// Authored map route: ordinary player walking, real obstacle navigation, separated bodies.
const {testedWorldObstacles:obstacles}=await import('./test-world-routes.mjs');
const {findPath,steer,separateBodies,visible:canSeeMap,nearestFreePoint,overlapsXZ}=await import('./dist/simulation.js');
({w,b,o}=setup());b=b.slice(0,2);for(let i=0;i<b.length;i++)Object.assign(b[i],nearestFreePoint({x:24+i,z:-12},obstacles,{radius:.4,maxRadius:3}),{radius:.36,height:1.8,y:0});
o={canSee:(a,b)=>canSeeMap(a,b,obstacles),canRoute:(a,b)=>findPath(a,b,obstacles).length>0,safePoint:{x:48,z:8}};
update(w,b,.05,o);assert(act(w,b,'story-task-start',o).ok);let path=findPath(b[0],o.safePoint,obstacles),ap=[],frames=0;
for(;frames<2000;frames++){
 if(path.length&&distance(b[0],path[0])<.3)path.shift();if(path.length)steer(b[0],path[0],4.7,.05,obstacles);
 r=update(w,b,.05,o);const d=r.directives[0];if(d){if(frames%5===0||!ap.length)ap=findPath(b[1],d.to,obstacles);if(ap.length&&distance(b[1],ap[0])<.3)ap.shift();steer(b[1],ap[0]||d.to,d.speed,.05,obstacles);}separateBodies(b,obstacles);
 assert(!b.some(a=>obstacles.some(o=>(o.base||0)<1.8&&o.h>0&&overlapsXZ(a,o,.35))),'no static penetration');
 if(w.storyTasks.tasks[0].status==='completed')break;
}
assert.equal(w.storyTasks.tasks[0].status,'completed',JSON.stringify({task:w.storyTasks.tasks[0],b}));console.log('PASS story medical escort through actual map at walking speed',frames);
function distance(a,b){return Math.hypot(a.x-b.x,a.z-b.z);}
// A new task cannot steal actors still visibly holding at a completed task.
({w,b,o}=setup('broken_mic','help'));update(w,b,.1,o);act(w,b,'story-task-repair',o);for(let i=0;i<4;i++)update(w,b,1,o);
w.resolved.last_group_call={status:'played',choiceId:'rollcall',eventId:'next',time:805};r=update(w,b,.1,o);
assert(!r.options.some(x=>x.id.startsWith('story-task-recruit:')),'completed listeners remain reserved');
assert.equal(new Set(r.directives.map(x=>x.actorId)).size,r.directives.length,'one task owns each actor');
for(let i=0;i<30;i++)r=update(w,b,1,o);
assert(r.options.some(x=>x.id.startsWith('story-task-recruit:')),'actors released after hold expires');
// Regroup offers only people with a route to the actual destination.
({w,b,o}=setup('last_group_call','rollcall'));r=update(w,b,.1,{...o,canRoute:a=>a.id==='arrival2'});
assert(!r.options.some(x=>x.id==='story-task-recruit:arrival1'));
assert(r.options.some(x=>x.id==='story-task-recruit:arrival2'));
// An unaccepted medical offer can recover when that person becomes unavailable.
({w,b,o}=setup());update(w,b,.1,o);b[1].hidden=true;r=update(w,b,.1,o);
assert.equal(r.objective.actorId,'arrival2');assert(!r.reservedActorIds.includes('arrival1'));
// Two people separated by more than six metres must not produce an impossible rejoin.
({w,b,o}=setup('last_group_call','rollcall'));update(w,b,.1,o);act(w,b,'story-task-recruit:arrival1',o);act(w,b,'story-task-recruit:arrival2',o);
b[0].x=16;b[1].x=14;b[1].z=0;b[2].x=0;b[2].z=0;r=update(w,b,.1,o);
assert.equal(r.state.tasks[0].status,'separated');assert(!act(w,b,'story-task-rejoin',o).ok);
assert(r.directives.find(d=>d.actorId==='arrival1').speed>0,'nearby companion follows while retrieving lagging member');
assert.equal(r.directives.find(d=>d.actorId==='arrival2').speed,0,'lagging member waits instead of knowing unseen position');
assert(!w.storyTasks.history.some(e=>e.type==='story-task-completed'));
console.log('PASS task ownership, reachable recruitment, unavailable offers and split-group recovery');
