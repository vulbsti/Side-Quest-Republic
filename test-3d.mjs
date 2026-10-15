import assert from 'node:assert/strict';
import {Simulation,moveWithCollisions,visible,findPath,verticalStep,supportHeight,separateBodies,overlapsXZ,nearestFreePoint} from './dist/simulation.js';
const wall={x:0,z:0,w:2,d:8,h:3};let e={x:-2,z:0,y:0};for(let i=0;i<60;i++)moveWithCollisions(e,.05,0,[wall]);assert(e.x< -1.3,'wall collision');assert(!visible({x:-3,z:0},{x:3,z:0},[wall]),'occluded vision');assert(visible({x:-3,z:7},{x:3,z:7},[wall]));const path=findPath({x:-5,z:0},{x:5,z:0},[wall]);assert(path.length>0);assert(path.some(p=>Math.abs(p.z)>=6),'path around wall');let s=new Simulation([]);let z=s.player.z;for(let i=0;i<60;i++)s.step(1/60,{z:-1});assert(s.player.z<z-3);const walk=z-s.player.z;s=new Simulation([]);z=s.player.z;for(let i=0;i<60;i++)s.step(1/60,{z:-1,sprint:true});assert(z-s.player.z>walk);assert(s.player.stamina<100);for(let i=0;i<120;i++)s.step(1/60,{});assert.equal(s.player.stamina,100);
s=new Simulation([]);s.step(.016,{jump:true});for(let i=0;i<20;i++)s.step(.016,{});assert(s.player.y>1.4,'jump clears low barriers');for(let i=0;i<80;i++)s.step(.016,{});assert.equal(s.player.y,0);
s=new Simulation([]);s.player.x=9;s.player.z=19;s.provoke(70);let chase=false,caught=false;for(let i=0;i<1000;i++){const r=s.step(.016,{});chase ||=s.pursuit;caught ||=r==='caught';if(caught)break;}assert(chase,'notice escalates');assert(caught,'capture works');assert.equal(s.catches,1);assert(s.cooldown>0);assert.equal(s.heat,0);
s=new Simulation([wall]);s.player.x=-3;s.player.z=0;s.police=[{x:3,z:0,y:0,home:{x:3,z:0},state:'notice',phase:0,yaw:-Math.PI/2,seen:.3,search:0,speed:0,last:{x:-3,z:0}}];s.provoke(80);for(let i=0;i<40;i++)s.step(.016,{});assert.notEqual(s.police[0].state,'chase','no sight through wall');
console.log('PASS: collisions, sight, pathfinding, movement, sprint/stamina, jump/landing, notice/pursuit/capture, occluded detection');

// Thin barricades between grid nodes must block crossing edges.
const thin=[{x:14,z:11,w:3,d:.7,h:1.3}];
const detour=findPath({x:14,z:14},{x:14,z:8},thin);
assert(detour.some(p=>Math.abs(p.x-14)>2),'route must go around a thin barricade');


// Player feet must rest on the actual bench seat, not its bounding-box back.
const seat={x:0,z:0,w:3,d:.7,h:.725};
const benchBack={x:0,z:-.32,w:3,d:.12,h:1.3};
const bench=[seat,benchBack];
let body={x:0,z:.18,y:2.2,vy:-1,radius:.36,height:1.8,stamina:100};
let landed=false;
for(let i=0;i<120;i++){verticalStep(body,1/60,bench);landed ||=body.landed;}
assert.equal(body.y,.725,'land on seat rather than tall back');
assert(body.grounded&&landed,'landing reported and stable');
assert.equal(supportHeight(body,bench,body.y),.725);
for(let i=0;i<30;i++)verticalStep(body,1/60,bench);
assert.equal(body.y,.725,'idle support must not sink or jitter');
moveWithCollisions(body,0,1.3,bench);
verticalStep(body,1/60,bench);
assert(!body.grounded&&body.y<.725,'walking off begins falling immediately');
for(let i=0;i<90;i++)verticalStep(body,1/60,bench);
assert.equal(body.y,0,'walking off returns to ground');

// Jump onto a seat, jump across it, then land beyond it; no floating supports.
body={x:-2.3,z:.22,y:0,vy:0,radius:.36,height:1.8,stamina:100};
verticalStep(body,1/60,bench,true);
for(let i=0;i<36;i++){moveWithCollisions(body,3.5/60,0,bench);verticalStep(body,1/60,bench);}
for(let i=0;i<90;i++)verticalStep(body,1/60,bench);
assert.equal(body.y,.725,'moving jump lands on bench');
verticalStep(body,1/60,bench,true);
for(let i=0;i<100;i++){moveWithCollisions(body,3.5/60,0,bench);verticalStep(body,1/60,bench);}
assert(body.x>2&&body.y===0,'jump across bench lands beyond seat');
body={x:0,z:.2,y:4,vy:-35,radius:.36,height:1.8};
verticalStep(body,.15,bench);
assert.equal(body.y,.725,'fast descending body cannot tunnel through seat');

// Low roof: starting with the head exactly touching its underside must block
// upward motion as well as crossing the underside from below.
const roof={x:0,z:0,w:4,d:4,base:1.8,h:2.1};
body={x:0,z:0,y:0,vy:0,radius:.36,height:1.8};
verticalStep(body,1/60,[roof],true);
assert.equal(body.y,0,'head already at ceiling cannot jump through');
assert(Number.isFinite(body.stamina),'jump without explicit stamina stays finite');
body={x:0,z:0,y:0,vy:7.6,radius:.36,height:1.8};
verticalStep(body,.1,[{...roof,base:2.2,h:2.5}]);
assert(Math.abs(body.y-.4)<1e-8&&body.vy===0,'rising head stops on roof underside');

// Dynamic bodies separate while respecting static walls and vertical layers.
const makeBody=(x,z=0,y=0)=>({x,z,y,radius:.36,height:1.8});
let a=makeBody(0),b=makeBody(.1);separateBodies([a,b],[]);
assert(Math.hypot(a.x-b.x,a.z-b.z)>=.72,'overlapping bodies separate');
a=makeBody(0);b=makeBody(0);separateBodies([a,b],[]);
assert(Math.hypot(a.x-b.x,a.z-b.z)>=.72,'coincident bodies get a deterministic separating normal');
const sideWall={x:-.86,z:0,w:1,d:4,h:3};
a=makeBody(0);b=makeBody(.1);separateBodies([a,b],[sideWall]);
assert(!overlapsXZ(a,sideWall)&&!overlapsXZ(b,sideWall),'correction cannot enter wall');
assert(b.x-a.x>=.719,'unblocked body absorbs wall-blocked correction');
a={...makeBody(0),anchored:true};b=makeBody(.1);separateBodies([a,b],[]);
assert.equal(a.x,0,'anchored body stays fixed');assert(b.x>=.72);
a=makeBody(0,0,2);b=makeBody(0);separateBodies([a,b],[]);
assert.equal(a.x,0);assert.equal(b.x,0,'vertically separated bodies do not repel');
a=makeBody(0);b={...makeBody(.1),hidden:true};separateBodies([a,b],[]);
assert.equal(a.x,0,'hidden bodies do not repel');
a=makeBody(-3);moveWithCollisions(a,8,0,[{x:0,z:0,w:.08,d:4,h:3}]);
assert(a.x<-.39,'large horizontal movement cannot tunnel through a thin wall');
console.log('PASS: bench support/landing/walk-off/traverse, fast fall, ceiling contact, personal-space correction, wall constraints, vertical nonoverlap, anchored/hidden bodies, thin-wall sweep');

const bus={x:24,z:2,w:10,d:2.8,h:3.2};
const trapped={x:28,z:3};const escapedSpawn=nearestFreePoint(trapped,[bus]);
assert(escapedSpawn);assert(!overlapsXZ(escapedSpawn,bus,.4),'bus spawn must clear the body radius');
assert.deepEqual(trapped,{x:28,z:3},'spawn recovery is pure');
assert.deepEqual(escapedSpawn,nearestFreePoint(trapped,[bus]),'spawn recovery is deterministic');
assert.deepEqual(nearestFreePoint({x:0,z:0},[]),{x:0,z:0});
assert.equal(nearestFreePoint({x:0,z:0},[{x:0,z:0,w:100,d:100,h:3}],{maxRadius:2}),null);
for(const point of [{x:-47,z:0},{x:53,z:0},{x:0,z:-45},{x:0,z:57}]){
 const recovered=nearestFreePoint(point,[]);assert(recovered);
 assert(recovered.x>=-46.6&&recovered.x<=52.6&&recovered.z>=-44.6&&recovered.z<=56.6,'body stays inside map bounds');
}
assert.equal(nearestFreePoint({x:1000,z:0},[]),null);
assert.equal(nearestFreePoint({x:0,z:0},[bus],{maxRadius:0})?.x,0);
assert.equal(nearestFreePoint({x:NaN,z:0},[]),null);
assert.deepEqual(nearestFreePoint({x:0,z:0},[{x:0,z:0,w:2,d:2,h:5,base:3}]),{x:0,z:0},'overhead canopy permits ground spawn');
console.log('PASS: deterministic collision-free ground spawn recovery, bounded failure, map-edge clearance, overhead space');
