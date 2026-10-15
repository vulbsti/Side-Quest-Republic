import assert from 'node:assert/strict';
import {CrowdFlow} from './dist/crowd-flow.js';
import {steer,dist,overlapsXZ} from './dist/simulation.js';
import {DISTRICTS} from './dist/districts.js';
import {testedWorldObstacles as obstacles} from './test-world-routes.mjs';
const bodies=()=>Array.from({length:30},(_,i)=>({id:'arrival'+i,dayArrival:true,hidden:true,x:0,z:0,y:0,radius:.4,height:1.8}));
const state={time:600,phase:'afternoon',districts:Object.fromEntries(DISTRICTS.map(d=>[d.id,{density:d.id==='backstreet'?100:10,access:100}]))};
const player={x:0,z:15},pool=bodies(),flow=new CrowdFlow({obstacles,districts:DISTRICTS});
flow.update({bodies:pool,state,player,isVisible:()=>true});assert(pool.every(b=>b.hidden),'all gateways visible means spawn deferred');
for(let i=0;i<20;i++){state.time=600+i*2;const before=pool.map(b=>({...b}));flow.update({bodies:pool,state,player});for(let j=0;j<pool.length;j++){const b=pool[j];if(before[j].hidden&&!b.hidden){assert(dist(b,player)>24);assert(b.dayPath.length);assert(dist(b,b.dayTarget)>10,'entry is not the crowd destination');}else if(!before[j].hidden)assert.equal(dist(before[j],b),0,'controller never teleports visible bodies');} // steering is caller-owned
 // Move only first body off the shared entry so subsequent bodies may enter.
 for(const b of pool.filter(b=>!b.hidden)){for(let k=0;k<40;k++){const p=b.dayPath?.[0];if(!p)break;if(dist(b,p)<.6)b.dayPath.shift();else steer(b,p,2,.05,obstacles);}}
}
assert(pool.filter(b=>!b.hidden).length<=30);assert([...flow.entries.values()].filter(e=>e.district==='backstreet').length>1,'density attracts multiple destination assignments');
// Run real path steering until all active crowd arrive, then disperse to gateways.
function walkAll(){for(const b of pool.filter(b=>!b.hidden)){const p=b.dayPath?.[0];if(p){if(dist(b,p)<.6)b.dayPath.shift();else steer(b,p,2,.05,obstacles);}assert(!obstacles.some(o=>(o.base||0)<1.8&&o.h>0&&overlapsXZ(b,o,.399)),'walking crowd respects actual map solids');}}
state.flags={dispersal:true};flow.update({bodies:pool,state,player});assert(flow.counts().departing>0);
for(let i=0;i<4500&&pool.some(b=>!b.hidden);i++){walkAll();if(i%20===0){state.time++;flow.update({bodies:pool,state,player});}}
assert(pool.every(b=>b.hidden),'all dispatched bodies physically reach an unseen exit');
// Arrival at an observed exit may not vanish; it stays until the observer leaves.
const holdPool=bodies(),hold=new CrowdFlow({obstacles,districts:DISTRICTS,gateways:[{x:-82,z:88}]});const hs={...state,time:600,flags:{},districts:state.districts};hold.update({bodies:holdPool,state:hs,player});const b=holdPool.find(b=>!b.hidden);assert(b);hs.flags={dispersal:true};hold.update({bodies:holdPool,state:hs,player:{x:b.x,z:b.z},isVisible:()=>true});assert(!b.hidden,'visible exit body retained');hold.update({bodies:holdPool,state:hs,player});assert(b.hidden,'departure completes only out of view');
const replay=()=>{const p=bodies(),f=new CrowdFlow({obstacles,districts:DISTRICTS});for(let t=60;t<80;t+=2)f.update({bodies:p,state:{...state,time:t,flags:{}},player});return p.map(b=>({x:b.x,z:b.z,hidden:b.hidden,target:b.dayTarget}));};assert.deepEqual(replay(),replay(),'seeded placement and deferral are deterministic');
console.log('Crowd flow PASS: bounded deterministic entries, visible-gateway deferral, density distribution, actual-map paths, no visible teleport, physical dispersal and unseen-only hiding.');

const recruited=bodies(),social=new CrowdFlow({obstacles,districts:DISTRICTS});social.update({bodies:recruited,state:{...state,time:600,flags:{}},player});const follower=recruited.find(b=>!b.hidden);follower.follow=true;social.update({bodies:recruited,state:{...state,time:602,flags:{}},player});assert.equal(follower.dayTarget,null,'crowd target must yield to explicit follow');assert.equal(social.inspect(follower.id).status,'engaged');

// Hotspot orders reroute present people without relocating them; unchanged
// targets retain the same route object instead of pathfinding every update.
const moving=Array.from({length:6},(_,i)=>({id:`unit-${i}`,dayArrival:true,hidden:false,x:i,z:0,radius:.4}));
const reactive=new CrowdFlow({districts:[{id:'west',x:-20,z:0},{id:'east',x:20,z:0}],gateways:[{x:0,z:60}]});
const rs={time:1,phase:'morning',districts:{west:{density:50,access:100},east:{density:10,access:100}}};
const orders=Object.fromEntries(moving.map(b=>[b.id,{target:{x:20,z:5},district:'east',activity:'protect-passage',speed:3}]));
reactive.update({bodies:moving,state:rs,directives:orders,desiredCount:6});
assert.equal(moving.filter(b=>b.crowdObjective==='protect-passage'&&b.dayPath).length,2,'at most two existing actors replanned per update');
for(let t=2;t<=4;t++)reactive.update({bodies:moving,state:{...rs,time:t},directives:orders,desiredCount:6});
assert(moving.every(b=>b.dayTarget.x===20&&b.dayTarget.z===5));
assert(moving.every((b,i)=>b.x===i&&b.z===0),'directives never teleport visible actors');
const route=moving[0].dayPath;
reactive.update({bodies:moving,state:{...rs,time:10},directives:orders,desiredCount:6});
assert.equal(moving[0].dayPath,route,'unchanged order preserves existing route');
assert.equal(moving[0].crowdSpeed,3);
orders['unit-0']={target:{x:-20,z:5},district:'west',activity:'regroup',speed:2};
reactive.update({bodies:moving,state:{...rs,time:11},directives:orders,desiredCount:6});
assert.equal(moving[0].dayTarget.x,-20,'changed hotspot yields a new physical route');
assert.equal(moving[0].crowdObjective,'regroup');
moving[0].sceneTarget={x:2,z:2};
reactive.update({bodies:moving,state:{...rs,time:12},directives:orders,desiredCount:6});
assert.equal(reactive.inspect('unit-0').status,'engaged');assert.equal(moving[0].dayTarget,null);assert.equal(moving[0].crowdObjective,null);
moving[0].sceneTarget=null;delete orders['unit-0'];
reactive.update({bodies:moving,state:{...rs,time:18},directives:orders,desiredCount:6});
assert.equal(moving[0].crowdObjective,null,'released directive returns to ambient ownership');
assert.equal(moving[0].crowdSpeed,null);
const early=bodies(),earlyFlow=new CrowdFlow({districts:[{id:'east',x:20,z:0}],gateways:[{x:60,z:0}]});
earlyFlow.update({bodies:early,state:{time:0,districts:{east:{density:0,access:100}}},player:{x:0,z:0},desiredCount:100,directives:{arrival0:{target:{x:20,z:0},district:'east',activity:'arrive'}}});
assert.equal(early.filter(b=>!b.hidden).length,1,'explicit cohort count permits an early physical gateway arrival');
assert.equal(early[0].x,60);assert.equal(early[0].dayTarget.x,20);
console.log('Crowd directives PASS: bounded replanning, no teleport, live hotspots, scene priority, route reuse, released ownership and early entry.');
const ambientBody={id:'ambient',dayArrival:true,hidden:false,x:0,z:0};
const ambient=new CrowdFlow({districts:[{id:'west',x:-20,z:0},{id:'east',x:20,z:0}]});
ambient.update({bodies:[ambientBody],state:{time:20,districts:{west:{density:100},east:{density:0}}},desiredCount:1});
assert.equal(ambient.inspect('ambient').district,'west');
ambient.update({bodies:[ambientBody],state:{time:40,districts:{west:{density:0},east:{density:100}}},desiredCount:1});
assert.equal(ambient.inspect('ambient').district,'east','ambient people physically retarget when local conditions shift');
assert.equal(ambientBody.x,0);
const obstacleFlow=new CrowdFlow({obstacles:[{x:5,z:5,w:2,d:2,h:2}],districts:[{id:'east',x:10,z:10}]});
const obstacleBody={id:'arrival0',dayArrival:true,hidden:false,x:0,z:0};
const blockedOrder={arrival0:{target:{x:5,z:5},district:'east',activity:'hold'}};
obstacleFlow.update({bodies:[obstacleBody],state:{time:10},directives:blockedOrder,desiredCount:1});
assert(obstacleBody.dayPath?.length,'occupied directive is projected to walkable space for existing actors');
assert(dist(obstacleBody.dayTarget,blockedOrder.arrival0.target)>.4);
const repairedPath=obstacleBody.dayPath;
obstacleFlow.update({bodies:[obstacleBody],state:{time:20},directives:blockedOrder,desiredCount:1});
assert.equal(obstacleBody.dayPath,repairedPath,'raw directive remembered so projected destination does not cause repath spam');
