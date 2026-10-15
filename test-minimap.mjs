import assert from 'node:assert/strict';
import {createMapTransform,drawMinimap} from './dist/minimap.js';
const near=(a,b,message)=>assert(Math.abs(a-b)<1e-8,message+': '+a+' vs '+b);
const p={x:13,z:-9};
for(const yaw of [0,Math.PI/2,Math.PI,-Math.PI/2,.713]){
 const t=createMapTransform({player:p,yaw});
 const origin=t.worldToMap(p);near(origin.x,95,'player centered x');near(origin.y,95,'player centered y');
 const forward=t.worldToMap({x:p.x-Math.sin(yaw)*10,z:p.z-Math.cos(yaw)*10});
 near(forward.x,95,'camera forward centered');assert(forward.y<95,'camera forward is map up');
 const right=t.worldToMap({x:p.x+Math.cos(yaw)*10,z:p.z-Math.sin(yaw)*10});
 assert(right.x>95,'camera right is map right');near(right.y,95,'right at center height');
 for(const point of [{x:0,z:0},{x:-47,z:57},{x:53,z:-45},{x:25.5,z:3.25}]){
  const q=t.mapToWorld(t.worldToMap(point));near(q.x,point.x,'roundtrip x');near(q.z,point.z,'roundtrip z');
 }
 const click=t.mapToWorld(95,95);near(click.x,p.x,'center click x');near(click.z,p.z,'center click z');
}
// Cardinal north positions change with camera; actual player direction does not
// accidentally reuse the camera-facing convention (which has opposite sign).
for(const [yaw,axis,sign] of [[0,'y',-1],[Math.PI/2,'x',1],[Math.PI,'y',1],[-Math.PI/2,'x',-1]]){
 const t=createMapTransform({player:{x:0,z:0},yaw});
 assert((t.worldToMap({x:0,z:-10})[axis]-95)*sign>0,'north cardinal direction');
 const facing=t.worldToMap({x:Math.sin(yaw+Math.PI),z:Math.cos(yaw+Math.PI)});
 near(facing.x,95,'forward-facing player arrow x');assert(facing.y<95,'forward-facing player arrow up');
}
const snapshot=createMapTransform({player:p,yaw:.3});const before=snapshot.mapToWorld(150,100);p.x+=8;p.z+=20;
assert.deepEqual(snapshot.mapToWorld(150,100),before,'click transform captures rendered player state');
// Test renderer without browser globals, including offscreen target and icons.
const calls=[];const context=new Proxy({}, {get:(obj,key)=>obj[key]??((...args)=>{calls.push([key,...args]);}),set:(obj,key,value)=>(obj[key]=value,true)});
const canvas={width:190,height:190,getContext:()=>context};
const frame=drawMinimap(canvas,{player:{x:0,z:0,yaw:Math.PI},yaw:.4,obstacles:[{x:10,z:10,w:3,d:1,h:2}],items:[{x:2,z:3,type:'phone'}],npcs:[{x:3,z:2}],police:[{x:4,z:1,state:'chase'}],landmarks:[{x:8,z:8}],route:[{x:100,z:100}]});
assert(frame.worldToMap&&frame.mapToWorld);assert(calls.some(c=>c[0]==='fillText'&&c[1]==='N'),'north label rendered');
assert(canvas.title.includes('Click to walk'),'map legend exposed');
console.log('PASS: camera/cardinal orientation, player heading convention, projection/inverse roundtrips, captured click state, renderer/icons/offscreen destination');
