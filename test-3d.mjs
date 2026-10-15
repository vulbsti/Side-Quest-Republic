import assert from 'node:assert/strict';
import {Simulation,moveWithCollisions,visible,findPath} from './dist/simulation.js';
const wall={x:0,z:0,w:2,d:8,h:3};let e={x:-2,z:0,y:0};for(let i=0;i<60;i++)moveWithCollisions(e,.05,0,[wall]);assert(e.x< -1.3,'wall collision');assert(!visible({x:-3,z:0},{x:3,z:0},[wall]),'occluded vision');assert(visible({x:-3,z:7},{x:3,z:7},[wall]));const path=findPath({x:-5,z:0},{x:5,z:0},[wall]);assert(path.length>0);assert(path.some(p=>Math.abs(p.z)>=6),'path around wall');let s=new Simulation([]);let z=s.player.z;for(let i=0;i<60;i++)s.step(1/60,{z:-1});assert(s.player.z<z-3);const walk=z-s.player.z;s=new Simulation([]);z=s.player.z;for(let i=0;i<60;i++)s.step(1/60,{z:-1,sprint:true});assert(z-s.player.z>walk);assert(s.player.stamina<100);for(let i=0;i<120;i++)s.step(1/60,{});assert.equal(s.player.stamina,100);
s=new Simulation([]);s.step(.016,{jump:true});for(let i=0;i<20;i++)s.step(.016,{});assert(s.player.y>1.4,'jump clears low barriers');for(let i=0;i<80;i++)s.step(.016,{});assert.equal(s.player.y,0);
s=new Simulation([]);s.player.x=9;s.player.z=19;s.provoke(70);let chase=false,caught=false;for(let i=0;i<1000;i++){const r=s.step(.016,{});chase ||=s.pursuit;caught ||=r==='caught';if(caught)break;}assert(chase,'notice escalates');assert(caught,'capture works');assert.equal(s.catches,1);assert(s.cooldown>0);assert.equal(s.heat,0);
s=new Simulation([wall]);s.player.x=-3;s.player.z=0;s.police=[{x:3,z:0,y:0,home:{x:3,z:0},state:'notice',phase:0,yaw:-Math.PI/2,seen:.3,search:0,speed:0,last:{x:-3,z:0}}];s.provoke(80);for(let i=0;i<40;i++)s.step(.016,{});assert.notEqual(s.police[0].state,'chase','no sight through wall');
console.log('PASS: collisions, sight, pathfinding, movement, sprint/stamina, jump/landing, notice/pursuit/capture, occluded detection');

// Thin barricades between grid nodes must block crossing edges.
const thin=[{x:14,z:11,w:3,d:.7,h:1.3}];
const detour=findPath({x:14,z:14},{x:14,z:8},thin);
assert(detour.some(p=>Math.abs(p.x-14)>2),'route must go around a thin barricade');
