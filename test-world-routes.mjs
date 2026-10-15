import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {findPath,overlapsXZ,Simulation,nearestFreePoint} from './dist/simulation.js';
import {DAY_ENCOUNTERS} from './dist/day-content.js';
import {DISTRICTS,STORY_ANCHORS,EXPANSION_SOLIDS} from './dist/districts.js';
// Execute the real buildWorld collision-registration code with inert rendering
// objects. This tests actual obstacle placements, not a copied geometry fixture.
// It deliberately does NOT claim to validate rendered meshes or WebGL.
function node(){const target=function(){};let proxy;proxy=new Proxy(target,{get(t,k){if(k==='then')return undefined;if(k==='clone')return ()=>node();if(k==='traverse'||k==='add'||k==='set'||k==='setScalar'||k==='setSize'||k==='setPixelRatio')return ()=>{};if(k==='loadAsync')return async()=>({scene:node()});return t[k]??(t[k]=node());},set(t,k,v){t[k]=v;return true;},apply(){return node();},construct(){return node();}});return proxy;}
const source=await fs.readFile(new URL('./dist/world.js',import.meta.url),'utf8');
const start=source.indexOf('export async function buildWorld('),end=source.indexOf('\nfunction mergeStatic(',start);
assert(start>=0&&end>start,'world builder remains recognisable; update harness if refactored');
const context={THREE:node(),GLTFLoader:node(),devicePixelRatio:1,innerWidth:1280,innerHeight:720,texture:()=>null,mat:()=>({}),cube:node,cylinder:node,ball:node,mesh:node,sign:node,mergeStatic:()=>{},console};
vm.createContext(context);vm.runInContext(source.slice(start,end).replace('export async function','async function')+'\nthis.builder=buildWorld;',context);
const world=await context.builder({appendChild(){}},()=>{});
assert(world.obstacles.length>=90,'real core obstacle registration executed');
const obstacles=[...world.obstacles,...EXPANSION_SOLIDS];
const spawn=new Simulation(obstacles).player;
const failures=[];
const targets=[...DISTRICTS.map(d=>({id:`district:${d.id}`,...d})),...Object.entries(STORY_ANCHORS).map(([id,p])=>({id:`anchor:${id}`,...p}))];
for(const target of targets){
 const route=findPath(spawn,target,obstacles);
 if(!route.length){failures.push(`${target.id}: no route to (${target.x},${target.z})`);continue;}
 let previous=spawn;
 for(const point of route){const n=Math.max(1,Math.ceil(Math.hypot(point.x-previous.x,point.z-previous.z)*8));for(let i=1;i<=n;i++){const sample={x:previous.x+(point.x-previous.x)*i/n,z:previous.z+(point.z-previous.z)*i/n};if(obstacles.some(o=>overlapsXZ(sample,o,.36))){failures.push(`${target.id}: route intersects solid at ${sample.x.toFixed(2)},${sample.z.toFixed(2)}`);break;}}previous=point;}
}
// Independently test all district-to-district legs, including the far west/east
// crossings. These use the same navigation algorithm the browser runs.
for(const a of DISTRICTS)for(const b of DISTRICTS){if(a.id===b.id)continue;if(!findPath(a,b,obstacles).length)failures.push(`disconnected district ${a.id} -> ${b.id}`);}
for(const e of DAY_ENCOUNTERS){const dest=e.location;assert(dest&&Number.isFinite(dest.x)&&Number.isFinite(dest.z),e.id+': explicit location');const free=nearestFreePoint(dest,obstacles,{radius:.65,maxRadius:8});const path=free&&findPath(spawn,free,obstacles);if(!path?.length){failures.push(`scene:${e.id}: no actual-client route to ${JSON.stringify(free)}`);continue;}const last=path.at(-1);if(Math.hypot(last.x-dest.x,last.z-dest.z)>=8)failures.push(`scene:${e.id}: route does not reach interaction range`);}
assert.deepEqual(failures,[],'all real-core plus expansion routes are collision-clear');
console.log(`World routes PASS: ${world.obstacles.length} live core obstacles + ${EXPANSION_SOLIDS.length} expansion solids; ${targets.length} spawn routes and ${DISTRICTS.length*(DISTRICTS.length-1)} district routes; ${DAY_ENCOUNTERS.length} scene approaches within interaction distance.`);
