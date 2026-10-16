import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {testedWorldObstacles as obstacles} from './test-world-routes.mjs';
import {findPath,steer,visible,nearestFreePoint} from './dist/simulation.js';
import {DayClient} from './dist/day-client.js';
import {createLivingWorld,advanceWorld} from './dist/living-world.js';
const source=fs.readFileSync('dist/main.js','utf8');
const extract=name=>{const a=source.indexOf(`function ${name}(`),b=source.indexOf('\nfunction ',a+1);assert(a>=0);return source.slice(a,b<0?undefined:b);};
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const medical={id:'first_injury',actorId:'sana',location:{x:23.9,z:-11.9},district:'jantar',start:800,end:1000,choices:[]};
const state=createLivingWorld(4,[medical,{id:'unrelated',end:1001,choices:[]}]);state.time=970;
const client=Object.create(DayClient.prototype);client.state=state;client.hooks={position:()=>({x:23.9,z:-11.9}),releaseScene(){},toast(){}};
client.trackCast(medical);const expiry=client.castLease.expiresAt;
state.time=990;client.trackCast(medical);assert.equal(client.castLease.expiresAt,expiry,'repeat V does not renew grace');
state.activeEncounter=client.protectedEncounter();advanceWorld(state,15);assert(!state.resolved.first_injury,'requested scene remains while actor walks');assert.equal(state.resolved.unrelated.status,'missed','other stories keep progressing');
state.time=expiry;assert.equal(client.protectedEncounter(),null);state.activeEncounter=null;advanceWorld(state,1);assert.equal(state.resolved.first_injury.status,'missed','grace is bounded');
const npc={id:'sana',name:'SANA',...nearestFreePoint({x:-69,z:5},obstacles,{radius:.5,maxRadius:3}),radius:.36,height:1.8,y:0,dayTarget:null,home:{x:-69,z:5},model:{position:{set(){}},rotation:{}},incidentOrder:{speed:0},streetGestureTime:3,pose:0};
const c={npcs:[npc],day:{state:{time:970,actors:{}}},sim:{time:0,player:{x:23.9,z:-11.9},police:[]},world:{obstacles},transit:null,dist,findPath,steer,visible,nearestFreePoint,updateLivingActors(){},navigationCredits:0,storyProjection:null,storyReserved:()=>[],talk:null,game:{},items:[],districtAt:()=>({id:'jantar'})};
vm.createContext(c);vm.runInContext(['sceneCast','prepareCast','castReadiness','updateNPCs'].map(extract).join('\n'),c);
c.prepareCast(medical,medical.location);assert(npc.sceneTarget,'reachable anchor found');assert.equal(npc.incidentOrder,null,'stale zero-speed incident released');assert.equal(npc.streetGestureTime,0,'ambient gesture does not hold requested cast');assert.equal(c.castReadiness(medical).ready,false);
const route=npc.dayPath; c.prepareCast(medical,medical.location);assert.equal(npc.dayPath,route,'repeated requests preserve route');
let ready=false,maxMove=0;
for(let i=0;i<1800;i++){const old={...npc};c.sim.time+=.05;c.updateNPCs(.05);maxMove=Math.max(maxMove,dist(npc,old));if(c.castReadiness(medical).ready){ready=true;console.log('Medical cast arrived in',((i+1)*.05).toFixed(1),'seconds');break;}}
assert(ready,JSON.stringify(c.castReadiness(medical)));assert(maxMove<=.141,'cast walks without teleport');
const position={x:npc.x,z:npc.z};c.prepareCast({...medical,id:'impossible'},{x:10000,z:10000});assert.equal(npc.scenePlan.status,'blocked');assert.equal(npc.x,position.x);assert.equal(npc.z,position.z);assert.match(c.castReadiness(medical).reason,/cannot reach/);
assert(source.includes('day.protectedEncounter?.()'),'actual frame loop protects pending meeting');
console.log('PASS real cast preparation and NPC movement, stale order release, reachable anchor, no teleport, bounded grace, repeat protection, independent expiry and diagnostics');

// A barrier arrives after the cast already has a route. Run the actual NPC loop.
c.world.obstacles=[];Object.assign(npc,{x:0,z:0,sceneTarget:null,scenePlan:null,dayTarget:null,dayPath:[],speed:0});c.sim.player={x:20,z:0};const moving={...medical,id:'moving',location:{x:20,z:0}};c.prepareCast(moving,moving.location);
for(let i=0;i<20;i++){c.sim.time+=.05;c.updateNPCs(.05);}
c.world.obstacles.push({x:8,z:0,w:1,d:8,h:3});let detoured=false,arrived=false,maxStep=0;
for(let i=0;i<1000;i++){const old={...npc};c.sim.time+=.05;c.updateNPCs(.05);maxStep=Math.max(maxStep,dist(old,npc));detoured||=Math.abs(npc.z)>4;if(c.castReadiness(moving).ready){arrived=true;break;}}
assert(arrived,'new barrier cannot leave cast stuck on stale path');assert(detoured,'cast physically walks around the inserted barrier');assert(maxStep<=.141,'dynamic reroute never teleports');
console.log('PASS staged cast dynamically reroutes around a new blocker with bounded retry');
