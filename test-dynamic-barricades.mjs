import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import * as T from './dist/vendor/three.module.js';
import * as data from './dist/destinations.js';
import * as district from './dist/districts.js';
import {testedWorldObstacles} from './test-world-routes.mjs';
import {overlapsXZ,findPath} from './dist/simulation.js';
import {DEFAULT_ROUTES} from './dist/transit.js';
// Execute the production builder with real Three mesh geometry. Only labels and
// static batching are substituted; moving barricade meshes are unmodified.
const materials=new Map(),mat=c=>{if(!materials.has(c))materials.set(c,new T.MeshStandardMaterial({color:c}));return materials.get(c);};
function cube(w,h,d,c,x,y,z,parent){const m=new T.Mesh(new T.BoxGeometry(w,h,d),typeof c==='object'?c:mat(c));m.position.set(x,y,z);parent?.add(m);return m;}
function cylinder(rt,rb,h,c,x,y,z,parent,n=12){const m=new T.Mesh(new T.CylinderGeometry(rt,rb,h,n),typeof c==='object'?c:mat(c));m.position.set(x,y,z);parent?.add(m);return m;}
const sign=(t,w,h,bg)=>new T.Mesh(new T.PlaneGeometry(w,h),mat(bg));
const source=await fs.readFile(new URL('./dist/world-expansion.js',import.meta.url),'utf8'),start=source.indexOf('export function expandWorld('),end=source.indexOf('\nfunction consolidate(',start);
const context={...data,...district,T,cube,cylinder,sign,mat,consolidate(){}};vm.createContext(context);vm.runInContext(source.slice(start,end).replace('export function','function')+';this.build=expandWorld;',context);
const world={scene:new T.Scene(),camera:new T.PerspectiveCamera(),obstacles:testedWorldObstacles.filter(o=>!o.expansion).map(o=>({...o}))};let bodies=[];
const built=context.build(world,{bodies:()=>bodies});assert.equal(built.barricades.length,4);assert.equal(world.obstacles.length,testedWorldObstacles.length,'moving barriers reuse registered collider objects');
const reinforced={phase:'rupture',districts:{court:{access:40},connector:{access:45}}};
function geometryMatches(){for(const b of built.barricades){b.model.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(b.model),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());for(const [got,want]of[[size.x,b.collider.w],[size.z,b.collider.d],[bounds.max.y,b.collider.h],[center.x,b.collider.x],[center.z,b.collider.z]])assert(Math.abs(got-want)<1e-5,'actual mesh and live collider agree');}}
geometryMatches();const first=built.barricades[0];bodies=[{x:first.collider.x,z:30.8,radius:.4,height:1.8,y:0}];for(let i=0;i<20;i++)built.update(reinforced,.1);assert.equal(first.collider.z,30,'occupied sweep holds rather than pushing actor');assert(first.held);geometryMatches();bodies=[];
for(let i=0;i<150;i++){const before=built.barricades.map(b=>({...b.collider}));built.update(reinforced,.1);for(let j=0;j<4;j++)assert(Math.hypot(built.barricades[j].collider.x-before[j].x,built.barricades[j].collider.z-before[j].z)<=.035001,'movement bounded to .35 m/s');geometryMatches();for(let z=20;z<=40;z+=.5)assert(!world.obstacles.some(o=>(o.base||0)<1.8&&o.h>0&&overlapsXZ({x:57.1,z},o,.5)),'medical/pedestrian passage remains open throughout movement');}
for(const b of built.barricades)assert(Math.hypot(b.collider.x-b.reinforced.x,b.collider.z-b.reinforced.z)<.001,'reinforced endpoint reached');
assert(findPath({x:56,z:22},{x:56,z:38},world.obstacles).length,'north/south pedestrian route survives');
for(const route of DEFAULT_ROUTES)for(let i=1;i<route.points.length;i++){const a=route.points[i-1],b=route.points[i],len=Math.hypot(b.x-a.x,b.z-a.z),yaw=Math.atan2(b.x-a.x,b.z-a.z);for(let j=0;j<=Math.ceil(len*5);j++){const f=j/Math.max(1,Math.ceil(len*5)),x=a.x+(b.x-a.x)*f,z=a.z+(b.z-a.z)*f,c=Math.cos(yaw),s=Math.sin(yaw);for(const q of built.barricades.map(b=>b.collider)){const dx=x-q.x,dz=z-q.z,ow=q.w/2,od=q.d/2;assert(!(Math.abs(dx)<Math.abs(c)*1.5+Math.abs(s)*4.25+ow&&Math.abs(dz)<Math.abs(s)*1.5+Math.abs(c)*4.25+od&&Math.abs(dx*c-dz*s)<1.5+ow*Math.abs(c)+od*Math.abs(s)&&Math.abs(dx*s+dz*c)<4.25+ow*Math.abs(s)+od*Math.abs(c)),'reinforced barriers leave full transit envelope clear');}}}
for(let i=0;i<150;i++)built.update({...reinforced,phase:'aftermath',flags:{dispersal:true}},.1);for(const b of built.barricades)assert(Math.hypot(b.collider.x-b.parked.x,b.collider.z-b.parked.z)<.001,'dispersal returns barriers gradually');
const before=built.barricades.map(b=>b.collider.x);built.update(reinforced,0);assert.deepEqual(built.barricades.map(b=>b.collider.x),before,'paused simulation never moves lane');
console.log('Dynamic barricades PASS: actual geometry/collider equality, occupied hold, bounded motion, continuous medical passage, transit envelope and gradual dispersal.');
