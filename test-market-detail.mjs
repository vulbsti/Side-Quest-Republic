import assert from 'node:assert/strict';
import {testedWorldObstacles as obstacles} from './test-world-routes.mjs';
import {findPath,overlapsXZ} from './dist/simulation.js';
import {SHOP_LAYOUT} from './dist/destinations.js';
const detail=obstacles.filter(o=>o.id?.startsWith('market-detail:'));
assert(detail.length>=25,'actual constructed furnished arcade/court colliders registered');
for(const shop of SHOP_LAYOUT){
 const approach={x:shop.x,z:78},inside={x:shop.x,z:85.4};
 const path=findPath(approach,inside,obstacles);
 assert(path.length,shop.id+' room is enterable through actual furnishings');
 assert(Math.hypot(path.at(-1).x-inside.x,path.at(-1).z-inside.z)<1,shop.id+' reaches room interior');
 for(const p of [approach,inside,{x:shop.x+1.2,z:84.5}])assert(!obstacles.some(o=>(o.base||0)<1.8&&o.h>.3&&overlapsXZ(p,o,.36)),shop.id+' usable aisle/counter approach');
 assert(detail.some(o=>o.id===`market-detail:${shop.id}-sidecase`),shop.id+' actual stocked sidecase');
}
for(const [from,to]of[[{x:-47,z:68},{x:-47,z:73}],[{x:-47,z:73},{x:-43,z:78}],[{x:-71,z:78},{x:-39,z:78}]])assert(findPath(from,to,obstacles).length,'court and covered shop walk remain connected');
const roof=detail.find(o=>o.id==='market-detail:arcade-roof');assert(roof.base>3.4,'covered arcade clears tall moving vehicles and heads');
console.log('Market detail PASS: all five furnished shop aisles, counter approaches, two court approaches and full arcade remain navigable.');
