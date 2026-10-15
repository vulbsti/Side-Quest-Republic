import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {testedWorldObstacles as obstacles} from './test-world-routes.mjs';
import {Simulation,findPath,nearestFreePoint,moveWithCollisions,dist,overlapsXZ} from './dist/simulation.js';
import {DISTRICTS} from './dist/districts.js';
import {DAY_ENCOUNTERS,DAY_ACTORS,DAY_DISTRICTS} from './dist/day-content.js';
import {createLivingWorld,advanceWorld,actWorld,getAvailableEncounters,validateWorld,summarizeWorld} from './dist/living-world.js';
// This is a physical itinerary integration check, not a rendered NPC-AI/playtest.
// Player uses production acceleration/collision; cast uses production collision
// and actual main.js cast membership/placement, with deterministic walking proxies.
// Travel and cast waits advance the independent day. Dialogue freezes its clock,
// matching the current panel contract. Expired scenes are genuinely missed.
const main=await fs.readFile(new URL('./dist/main.js',import.meta.url),'utf8');
const a=main.indexOf('function sceneCast('),b=main.indexOf('function stageBeat(',a);
assert(a>=0&&b>a,'production cast helpers exist');
const itinerary=['tuition_call','water_account','resident_route','press_edit','water_callback','resident_callback','return_promises','aftermath_account'];
function run(policy){
 const state=createLivingWorld(15426,{actors:DAY_ACTORS,districts:DAY_DISTRICTS,encounters:DAY_ENCOUNTERS});
 const sim=new Simulation(obstacles),log=[],visited=new Set();let travelled=0,elapsed=0;
 const npcs=Object.values(state.actors).map((actor,i)=>{const d=DISTRICTS.find(d=>d.id===actor.district)||DISTRICTS[0];return {id:actor.id,...nearestFreePoint({x:d.x+(i%3-1)*2,z:d.z+2},obstacles),radius:.36,height:1.8,y:0};});
 const ctx={npcs,nearestFreePoint,world:{obstacles}};vm.createContext(ctx);vm.runInContext(main.slice(a,b)+';this.cast=sceneCast;this.prepare=prepareCast;',ctx);
 let paths=new Map();
 function tick(input={}){
  const old={...sim.player};sim.step(.05,input);travelled+=dist(old,sim.player);elapsed+=.05;advanceWorld(state,.05);
  for(const n of npcs){const path=paths.get(n.id);if(!path?.length)continue;const p=path[0],d=dist(n,p);if(d<.2)path.shift();else moveWithCollisions(n,(p.x-n.x)/d*Math.min(d,1.6*.05),(p.z-n.z)/d*Math.min(d,1.6*.05),obstacles);}
  assert(!obstacles.some(o=>(o.base||0)<1.8&&o.h>0&&overlapsXZ(sim.player,o,.359)),'player must not tunnel into actual geometry');
 }
 function walk(to){const free=nearestFreePoint(to,obstacles,{radius:.65,maxRadius:8}),path=findPath(sim.player,free,obstacles);assert(path.length,'physical itinerary destination reachable');let frames=0;while(path.length&&frames++<12000&&!state.finished){const p=path[0],d=dist(sim.player,p);if(d<.5)path.shift();else tick({x:(p.x-sim.player.x)/d,z:(p.z-sim.player.z)/d});}assert(!path.length||state.finished,'physical path steering must finish');for(let j=0;j<10;j++)tick();}
 for(const id of itinerary){const e=DAY_ENCOUNTERS.find(e=>e.id===id);walk(e.location);visited.add(e.district);while(state.time<e.start&&!state.finished)tick();
  ctx.prepare(e,e.location);paths=new Map(ctx.cast(e).map(n=>[n.id,findPath(n,n.sceneTarget,obstacles)]));let waited=0;
  while(ctx.cast(e).some(n=>dist(n,e.location)>5)&&state.time<=e.end&&!state.finished&&waited<90){tick();waited+=.05;}
  const ready=ctx.cast(e).every(n=>dist(n,e.location)<=5),available=getAvailableEncounters(state).find(q=>q.id===id);
  if(!available||!ready||policy==='absent'){log.push({id,time:state.time,status:!available?'missed-window':!ready?'cast-not-ready':'observed',wait:Math.round(waited)});continue;}
  assert(dist(sim.player,e.location)<8,'no remote scene activation');
  const choices=available.choices;const disruptiveScore=c=>(c.effects||[]).reduce((n,e)=>n+(['escalation','rumor','tension','pressure'].includes(e.type)?Math.max(0,Number(e.value)||0):['relationship','trust','solidarity','credibility'].includes(e.type)?Math.max(0,-Number(e.value)||0):0),0);const index=policy==='helpful'?0:policy==='disruptive'?choices.indexOf([...choices].sort((a,b)=>disruptiveScore(b)-disruptiveScore(a))[0]):log.length%choices.length;
  const chosen=choices[index],result=actWorld(state,id,chosen.id);assert(result.ok);log.push({id,time:state.time,status:'played',choice:chosen.id,cast:Array.from(ctx.cast(e),n=>n.id),wait:Math.round(waited)});
  assert.deepEqual(validateWorld(state),[],'causal invariants after local choice');
 }
 while(!state.finished)tick();
 assert(visited.size>=3,'physically visited at least three districts');assert(travelled>350,'journey incurs actual walking distance');
 const summary=summarizeWorld(state);assert(summary.missed>0,'cannot play all moments by remote injection');assert.deepEqual(validateWorld(state),[]);
 if(policy!=='absent')assert(summary.played>=3,'feasible itinerary yields multiple local scenes');
 const revisits=log.filter(x=>x.id.includes('callback')&&x.status==='played');if(policy!=='absent')assert(revisits.length,'physically revisited a callback location');
 return {policy,distance:Math.round(travelled),elapsed:Math.round(elapsed),districts:visited.size,played:summary.played,missed:summary.missed,missedScenes:Object.entries(state.resolved).filter(([,r])=>r.status==='missed').map(([id])=>id),aid:summary.aid,escalation:summary.escalation,log};
}
const results=['absent','helpful','disruptive','inconsistent'].map(run);
assert.deepEqual(run('helpful'),results[1],'same seed and physically timed policy reproduce exactly');
assert.notDeepEqual([results[1].aid,results[1].escalation],[results[2].aid,results[2].escalation],'choices produce different consequences');
console.log('Playable day journeys PASS: actual travel/collision, local cast gating, time windows, callback revisits, deterministic replay and causal invariants. This is not a rendering or dynamic-crowd sign-off.');
console.log(JSON.stringify(results));
