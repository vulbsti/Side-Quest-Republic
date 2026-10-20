import assert from 'node:assert/strict';
import {visible} from '../dist/simulation.js';
const box={x:0,z:0,w:2,d:2,h:3};
function check(a,b,expected,obstacles=[box]){assert.equal(visible(a,b,obstacles),expected);assert.equal(visible(b,a,obstacles),expected,'visibility must be symmetric');}
check({x:-3,z:0},{x:3,z:0},false);
check({x:0,z:-3},{x:0,z:3},false);
check({x:-3,z:-3},{x:3,z:3},false);
check({x:-3,z:1},{x:3,z:1},true); // parallel edge grazing
check({x:-3,z:-3},{x:-1,z:-1},true); // endpoint corner only
check({x:-3,z:0},{x:-1,z:0},true); // endpoint face only
check({x:-3,z:-1},{x:1,z:3},true); // corner tangent inside segment
check({x:-1,z:0},{x:1,z:0},false); // face-to-face through interior
check({x:0,z:0},{x:3,z:0},false); // starts inside
check({x:0,z:0},{x:0,z:0},true); // zero-length has no open segment
check({x:3,z:0},{x:3,z:0},true);
check({x:-.1,z:0},{x:.1,z:0},false,[{...box,w:.001}]); // shorter than old sample stride
check({x:-1,z:0},{x:1,z:0},false,[{...box,x:.25,w:.001}]); // wall between old samples
check({x:-3,z:0},{x:3,z:0},true,[{...box,h:1.65}]);
check({x:-3,z:0},{x:3,z:0},false,[{...box,h:1.650001}]);
check({x:-3,z:0},{x:3,z:0},true,[{...box,w:0}]);
check({x:-3,z:0},{x:3,z:0},true,[]);
function oldVisible(a,b,obstacles){const d=Math.hypot(b.x-a.x,b.z-a.z),n=Math.ceil(d*2);for(let s=1;s<n;s++){const t=s/n,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t;for(const o of obstacles)if(o.h>1.65&&x>o.x-o.w/2&&x<o.x+o.w/2&&z>o.z-o.d/2&&z<o.z+o.d/2)return false;}return true;}
let seed=38;const rand=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
for(let i=0;i<5000;i++){
 const a={x:rand()*40-20,z:rand()*40-20},b={x:rand()*40-20,z:rand()*40-20};
 const exact=visible(a,b,[box]);assert.equal(exact,visible(b,a,[box]));
 if(!oldVisible(a,b,[box]))assert.equal(exact,false,'every old blocked sample lies inside the exact intersection');
 // These rays are entirely in a half-plane outside the box: old and new agree.
 const c={x:3+rand()*20,z:rand()*40-20},d={x:3+rand()*20,z:rand()*40-20};
 assert.equal(visible(c,d,[box]),oldVisible(c,d,[box]));
}
let heightReads=0;const obstacles=Array.from({length:370},(_,i)=>({x:i,z:20,w:1,d:1,get h(){heightReads++;return 3;}}));
assert.equal(visible({x:0,z:0},{x:20,z:0},obstacles),true);assert.equal(heightReads,370,'one obstacle visit per ray independent of distance');
heightReads=0;oldVisible({x:0,z:0},{x:20,z:0},obstacles);assert.equal(heightReads,14430);
console.log('PASS: exact open-segment LOS, thin walls, tangents, endpoints, symmetry, 5000 old-safe comparisons; 370 vs 14430 obstacle checks for a clear 20m ray');
