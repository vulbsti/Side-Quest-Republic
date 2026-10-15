import assert from 'node:assert/strict';
import {testedWorldObstacles} from './test-world-routes.mjs';
import {DEFAULT_ROUTES,createTransit,updateTransit} from './dist/transit.js';
const solids=testedWorldObstacles.filter(o=>o.h>.3&&(o.base||0)<3.4&&o.id!=='legacy-bus');
// Separating-axis test: conservative full 3 x 8.5m oriented vehicle footprint.
function overlaps(x,z,yaw,o){const c=Math.cos(yaw),s=Math.sin(yaw),dx=x-o.x,dz=z-o.z,hw=1.5,hl=4.25,ow=o.w/2,od=o.d/2;return Math.abs(dx)<Math.abs(c)*hw+Math.abs(s)*hl+ow&&Math.abs(dz)<Math.abs(s)*hw+Math.abs(c)*hl+od&&Math.abs(dx*c-dz*s)<hw+ow*Math.abs(c)+od*Math.abs(s)&&Math.abs(dx*s+dz*c)<hl+ow*Math.abs(s)+od*Math.abs(c);}
for(const r of DEFAULT_ROUTES){for(let i=1;i<r.points.length;i++){const a=r.points[i-1],b=r.points[i],yaw=Math.atan2(b.x-a.x,b.z-a.z),steps=Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.1);for(let k=0;k<=steps;k++){const x=a.x+(b.x-a.x)*k/steps,z=a.z+(b.z-a.z)*k/steps;assert(!solids.some(o=>overlaps(x,z,yaw,o)),`${r.id} bus segment ${i} at ${x},${z} intersects ${solids.filter(o=>overlaps(x,z,yaw,o)).map(o=>o.id)}`);}}
 for(let i=1;i<r.points.length-1;i++){const a=r.points[i-1],b=r.points[i],c=r.points[i+1],from=Math.atan2(b.x-a.x,b.z-a.z),to=Math.atan2(c.x-b.x,c.z-b.z),delta=Math.atan2(Math.sin(to-from),Math.cos(to-from));for(let j=0;j<=32;j++)assert(!solids.some(o=>overlaps(b.x,b.z,from+delta*j/32,o)),`${r.id} turn ${i} clips ${solids.filter(o=>overlaps(b.x,b.z,from+delta*j/32,o)).map(o=>o.id)}`);}}
console.log('Transit clearance PASS: both complete loops, 0.1m travel samples and 32 intermediate orientations at every turn, including shop/shelter geometry.');

// Exercise the actual gradual heading update, not just ideal waypoint tangents.
const runtime=createTransit({dwellSeconds:5});
for(let i=0;i<18000;i++){updateTransit(runtime,.05);for(const b of runtime.buses){const hits=solids.filter(o=>overlaps(b.x,b.z,b.yaw,o));assert.equal(hits.length,0,`${b.id} actual heading at ${b.x},${b.z} hits ${hits.map(o=>o.id)}`);}}
assert(runtime.buses.every(b=>b.arrivalCount>=8),'Both buses complete repeated circuits');
assert(solids.some(o=>o.id==='expansion-pole:-46.5:60'),'Service Gali signpost is actually registered');
assert(!solids.some(o=>o.id==='expansion-pole:-59.5:60'),'Old road-blocking signpost removed');
console.log('Actual runtime clearance PASS: 900 seconds, both buses including gradual turning, repeated stops, Service Gali pole regression.');
