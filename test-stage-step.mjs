import assert from 'node:assert/strict';
import {Simulation,verticalStep,moveWithCollisions} from './dist/simulation.js';
import {testedWorldObstacles as obstacles} from './test-world-routes.mjs';
const step=obstacles.find(o=>o.x===0&&o.z===-10.8);assert(step,'visible stage step has collision');assert.equal(step.h,.3);
const stage=obstacles.find(o=>o.x===0&&o.z===-14);assert.equal(stage.h,.74);assert.equal(stage.w,9.3);assert.equal(stage.d,5.3);
const sim=new Simulation(obstacles);Object.assign(sim.player,{x:0,z:-9.7,y:0});
for(let i=0;i<18;i++)sim.step(1/60,{z:-1});assert(sim.player.y>=.299,'player steps up to visible top');
Object.assign(sim.player,{vx:0,vz:0});for(let i=0;i<120;i++)sim.step(1/60,{});assert.equal(sim.player.y,.3,'stationary feet remain on step');
Object.assign(sim.player,{x:-.2,z:-10.8,y:0,grounded:true});verticalStep(sim.player,1/60,obstacles);assert.equal(sim.player.y,.3,'legacy grounded save in step recovers to its top');
// Jump from the low step onto the accurately registered stage cap.
Object.assign(sim.player,{x:0,z:-10.8,y:.3,vx:0,vz:0,vy:0,grounded:true});sim.step(1/60,{z:-1,jump:true});for(let i=0;i<40;i++)sim.step(1/60,{z:-1});Object.assign(sim.player,{vx:0,vz:0});for(let i=0;i<100;i++)sim.step(1/60,{});assert.equal(sim.player.y,.74,'jump lands on rendered stage cap');
Object.assign(sim.player,{x:0,z:-10.8,y:.3,vx:0,vz:0,vy:0,grounded:true});
// Walk out, fall, then land on the ground. Never snap downward through gravity.
for(let i=0;i<45;i++)sim.step(1/60,{z:1});assert.equal(sim.player.y,0);
// A .45m bench does not become an automatic staircase, and ceiling blocks a step.
for(const solid of [{x:0,z:0,w:2,d:2,h:.45},{x:0,z:0,w:2,d:2,h:2}]){const b={x:0,z:1.5,y:0,radius:.36,height:1.8,stepHeight:.32,grounded:true};moveWithCollisions(b,0,-.5,[solid]);assert.equal(b.y,0);assert(b.z>=1.36);}
const b={x:0,z:1.5,y:0,radius:.36,height:1.8,stepHeight:.32,grounded:true};moveWithCollisions(b,0,-.5,[{x:0,z:0,w:2,d:2,h:.3},{x:0,z:0,w:2,d:2,base:1.9,h:2.1}]);assert.equal(b.y,0,'no step-up into head obstruction');
console.log('PASS stage step exact visual/collision dimensions, player climb/stand/save recovery, gravity on exit and bounded/headroom-safe step-up.');
