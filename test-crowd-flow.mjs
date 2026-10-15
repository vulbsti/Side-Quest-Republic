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
