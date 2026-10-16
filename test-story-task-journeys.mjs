import assert from 'node:assert/strict';
import {testedWorldObstacles as obstacles} from './test-world-routes.mjs';
import {findPath,steer,separateBodies,visible,nearestFreePoint,overlapsXZ} from './dist/simulation.js';
import {updateStoryTasks as update,actStoryTask as act} from './dist/story-tasks.js';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
function fixture(kind){const pair={medical:['first_injury','assist'],mic:['broken_mic','help'],regroup:['last_group_call','rollcall']}[kind];let world={seed:7,time:900,resolved:{[pair[0]]:{status:'played',choiceId:pair[1],eventId:'intent',time:890}}};const bodies=['player','arrival1','arrival2'].map((id,i)=>({id,...nearestFreePoint({x:24+i*.9,z:-12},obstacles,{radius:.4,maxRadius:3}),radius:.36,height:1.8,y:0}));const options={canSee:(a,b)=>visible(a,b,obstacles),canRoute:(a,b)=>findPath(a,b,obstacles).length>0,sourcePoint:{x:24,z:-12},safePoint:{x:48,z:8},micPoint:nearestFreePoint({x:-5,z:-10},obstacles,{radius:.4,maxRadius:3})};return {world,bodies,options};}
function journey(kind){let {world,bodies,options}=fixture(kind);if(kind==='mic')Object.assign(bodies[2],nearestFreePoint({x:options.micPoint.x+2,z:options.micPoint.z},obstacles,{radius:.4,maxRadius:3}));let projection=update(world,bodies,.05,options),task=world.storyTasks.tasks[0];if(kind==='medical')assert(act(world,bodies,'story-task-start',options).ok);if(kind==='regroup'){assert(act(world,bodies,'story-task-recruit:arrival1',options).ok);assert(act(world,bodies,'story-task-recruit:arrival2',options).ok);}const goal=task.destination;let playerPath=findPath(bodies[0],goal,obstacles),paths={},maxMove=0,completed=null;
 for(let frame=0;frame<2400;frame++){
  const old=bodies.map(b=>({...b}));if(playerPath.length&&distance(bodies[0],playerPath[0])<.3)playerPath.shift();if(playerPath.length)steer(bodies[0],playerPath[0],4.7,.05,obstacles);
  projection=update(world,bodies,.05,options);
  if(kind==='mic'&&projection.options.some(o=>o.id==='story-task-repair'))projection=act(world,bodies,'story-task-repair',options);
  for(const order of projection.directives){const body=bodies.find(b=>b.id===order.actorId);if(frame%5===0||!paths[body.id]?.length)paths[body.id]=findPath(body,order.to,obstacles);const path=paths[body.id];if(path.length&&distance(body,path[0])<.3)path.shift();steer(body,path[0]||order.to,order.speed,.05,obstacles);}
  separateBodies(bodies,obstacles);for(let i=0;i<bodies.length;i++){maxMove=Math.max(maxMove,distance(bodies[i],old[i]));assert(!obstacles.some(o=>(o.base||0)<1.8&&o.h>0&&overlapsXZ(bodies[i],o,.35)),`${kind} static collision`);}assert(maxMove<.5,`${kind} no teleport`);
  world.time+=.05;if(frame===50){world=JSON.parse(JSON.stringify(world));task=world.storyTasks.tasks[0];}
  completed=world.storyTasks.history.find(e=>e.type==='story-task-completed');if(completed){console.log('PASS physical journey',kind,{frame,maxMove,actorIds:completed.actorIds});break;}
 }
 assert(completed,JSON.stringify({kind,task,bodies}));assert.equal(completed.kind,kind);if(kind==='mic'){assert(completed.actorIds.length>0,'working microphone has physical listeners');assert(projection.directives.some(d=>d.gesture==='point'));}assert.equal(world.storyTasks.history.filter(e=>e.type==='story-task-completed').length,1);assert.equal(update(world,bodies,.05,options).effects.length,0);if(kind!=='mic')for(const id of completed.actorIds)assert(distance(bodies.find(b=>b.id===id),goal)<=3);return completed;}
journey('medical');journey('mic');journey('regroup');
for(const kind of ['medical','mic','regroup']){const {world,bodies,options}=fixture(kind);update(world,bodies,.1,options);const r=act(world,bodies,'story-task-abandon',options);assert(r.ok);assert.equal(r.effects.length,0);for(let i=0;i<10;i++)update(world,bodies,1,options);assert(!world.storyTasks.history.some(e=>e.type==='story-task-completed'));assert.equal(world.storyTasks.tasks[0].status,'abandoned');}
console.log('PASS all task types abandoned without reward or false completion');
// Restore a split group on the real map, retrieve the waiting member, then finish.
{
 let {world,bodies,options}=fixture('regroup');update(world,bodies,.05,options);
 act(world,bodies,'story-task-recruit:arrival1',options);act(world,bodies,'story-task-recruit:arrival2',options);
 Object.assign(bodies[0],nearestFreePoint({x:38,z:-12},obstacles,{radius:.4,maxRadius:3}));
 Object.assign(bodies[1],nearestFreePoint({x:36,z:-12},obstacles,{radius:.4,maxRadius:3}));
 world=JSON.parse(JSON.stringify(world));let r=update(world,bodies,.1,options);
 assert.equal(world.storyTasks.tasks[0].status,'separated');
 let rejoined=false,done=false,paths={};
 for(let frame=0;frame<1600;frame++){
  const goal=rejoined?options.safePoint:bodies[2];
  if(frame%5===0||!paths.player?.length)paths.player=findPath(bodies[0],goal,obstacles);
  if(paths.player.length&&distance(bodies[0],paths.player[0])<.3)paths.player.shift();
  if(distance(bodies[0],goal)>(rejoined?.2:1.4))steer(bodies[0],paths.player[0]||goal,4.7,.05,obstacles);
  r=update(world,bodies,.05,options);
  if(!rejoined&&r.options.some(a=>a.id==='story-task-rejoin')){assert(act(world,bodies,'story-task-rejoin',options).ok);rejoined=true;paths.player=[];}
  const prior=bodies.map(b=>({...b}));
  for(const d of r.directives){const b=bodies.find(b=>b.id===d.actorId);if(frame%5===0||!paths[b.id]?.length)paths[b.id]=findPath(b,d.to,obstacles);if(paths[b.id].length&&distance(b,paths[b.id][0])<.3)paths[b.id].shift();steer(b,paths[b.id][0]||d.to,d.speed,.05,obstacles);}
  separateBodies(bodies,obstacles);world.time+=.05;
  for(let i=1;i<bodies.length;i++){assert(distance(prior[i],bodies[i])<.5,'recovery never teleports companions');assert(!obstacles.some(o=>(o.base||0)<1.8&&o.h>0&&overlapsXZ(bodies[i],o,.35)),'recovery respects map obstacles');}
  if(world.storyTasks.tasks[0].status==='completed'){done=true;console.log('PASS split regroup recovered on actual map',{frame});break;}
 }
 assert(rejoined,'player can physically bring split companions together');assert(done,JSON.stringify({bodies,task:world.storyTasks.tasks[0]}));
 assert.equal(world.storyTasks.history.filter(e=>e.type==='story-task-completed').length,1);
}
