import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {testedWorldObstacles as obstacles} from './test-world-routes.mjs';
import {DESTINATIONS,SHOP_LAYOUT} from './dist/destinations.js';
import {Simulation,findPath,nearestFreePoint,separateBodies,dist,overlapsXZ} from './dist/simulation.js';
import {canReachInteraction} from './dist/interactions.js';
// Follow actual main.js contracts, not a looser idealised destination trigger.
const main=await fs.readFile(new URL('./dist/main.js',import.meta.url),'utf8');
assert(main.includes('x:d.location.x+1,z:d.location.z+1'),'update NPC placement audit after main integration changes');
assert(main.includes('dist(d.location,sim.player)<3.3'),'update actual prompt range if integration changes');
const originalShops=DESTINATIONS.map(d=>({id:'shop_'+d.id,...(nearestFreePoint({x:d.location.x+1,z:d.location.z+1},obstacles,{radius:.4,maxRadius:3})||d.location),y:0,radius:.36,height:1.8}));
function walk(sim,npcs,to){const path=findPath(sim.player,to,obstacles);assert(path.length,`route exists to ${JSON.stringify(to)}`);let tick=0;while(path.length&&tick++<18000){const p=sim.player,target=path[0],distance=dist(p,target);let x=0,z=0;if(distance<.5)path.shift();else{x=(target.x-p.x)/distance;z=(target.z-p.z)/distance;}sim.step(1/60,{x,z});separateBodies([p,...npcs],obstacles);assert(!obstacles.some(o=>(o.base||0)<1.8&&o.h>0&&overlapsXZ(p,o,.359)),`player penetrated solid on route to ${JSON.stringify(to)}`);}assert.equal(path.length,0,'physical steering finished without getting stuck');for(let t=0;t<30;t++){sim.step(1/60,{});separateBodies([sim.player,...npcs],obstacles);}return tick/60;}
const results=[];
for(const d of DESTINATIONS){const sim=new Simulation(obstacles),npcs=structuredClone(originalShops),start={x:sim.player.x,z:sim.player.z};const elapsed=walk(sim,npcs,d.location),seller=npcs.find(n=>n.id==='shop_'+d.id);assert(dist(sim.player,d.location)<3.3,d.id+': within actual prompt range');assert(canReachInteraction(sim.player,{...d.location,y:0},obstacles),d.id+': actual destination line of sight');assert(canReachInteraction(sim.player,seller,obstacles),d.id+': can also see actual speaker, not just empty trigger');assert(dist(sim.player,seller)<3.3,d.id+': speaker remains locally present');
 const shop=SHOP_LAYOUT.find(s=>s.id===d.id);if(shop){assert(sim.player.z>80,shop.id+': player is inside shop');walk(sim,npcs,{x:shop.x,z:77});assert(sim.player.z<80,shop.id+': door permits physical exit');}
 walk(sim,npcs,start);assert(dist(sim.player,start)<.7,d.id+': physical roundtrip complete');results.push({id:d.id,seconds:Math.round(elapsed)});
}
console.log('Destination approaches PASS: all '+results.length+' physical roundtrips with actual movement damping, static collision and shop-person separation; actual 3.3m prompt and speaker visibility, all five shop door exits.');
console.log(JSON.stringify(results));
