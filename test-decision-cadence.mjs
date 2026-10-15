import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync('dist/main.js','utf8'),start=source.indexOf('function worldStep(dt)'),end=source.indexOf('tickStreetQueue();',start);
const calls={incident:[],crisis:[],ambient:[],contact:0};
const ctx={mode:'play',day:{state:{},tick(){}},sim:{time:0},street:null,expansion:null,decisionWorld:null,decisionElapsed:0,incidentProjection:null,crisisProjection:null,ambientProjection:null,mischiefUntil:0,mischiefOrders:[],world:{obstacles:[]},syncPhysicalActors(){},worldRunning:()=>true,incidentBodies:()=>[],visible:()=>true,applyStreetResult(){},applyIncidentProjection(r){ctx.incidentProjection=r;},sampleCrisisContact(){calls.contact++;return {events:[]};}};
for(const [name,key]of [['updateIncident','incident'],['updateCrisis','crisis'],['updateAmbient','ambient']])ctx[name]=(_w,_b,dt)=>{calls[key].push(dt);return {directives:[],events:[],effects:[]};};
vm.createContext(ctx);vm.runInContext(source.slice(start,end)+'}',ctx);
for(let i=0;i<60;i++)ctx.worldStep(1/60);
for(const key of ['incident','crisis','ambient']){assert.equal(calls[key].length,10);assert(Math.abs(calls[key].reduce((a,b)=>a+b,0)+ctx.decisionElapsed-1)<1e-9,'elapsed time retained, never invented');}
assert.equal(calls.contact,60,'physical contact sampled every physics tick');
ctx.day.state={};ctx.worldStep(1/60);assert.equal(calls.incident.length,11);assert.equal(calls.incident.at(-1),1/60,'new world starts with only real elapsed time');
console.log('PASS production decisions 10Hz, contact 60Hz, retained elapsed and world reset');
