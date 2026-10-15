import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {advancePhysicalWait} from './dist/world-wait.js';
const source=fs.readFileSync('dist/main.js','utf8'),start=source.indexOf('async function waitPhysicalWorld'),end=source.indexOf('function setupLivingDay',start),button={};let physics=0,yields=0,saves=0;
const ctx={advancePhysicalWait,physicalWaiting:false,mode:'day',day:{opened:true,sceneRun:null,state:{time:0,finished:false}},transit:null,keys:{w:true},autoWalk:[{}],sim:{time:0},$:()=>button,worldRunning:()=>ctx.mode==='play',worldStep:dt=>{assert.equal(ctx.mode,'play');physics++;ctx.day.state.time+=dt;ctx.sim.time+=dt;},animateActors(){},checkpoint(){saves++;},setTimeout(cb){assert.equal(ctx.mode,'day','regular loop paused between batches');yields++;cb();}};
vm.createContext(ctx);vm.runInContext(source.slice(start,end),ctx);const result=await ctx.waitPhysicalWorld(30);
assert.equal(result.completed,true);assert.equal(physics,1800);assert(yields>0);assert.equal(ctx.mode,'day');assert.equal(button.textContent,'Let 30 seconds pass');assert.equal(saves,1);assert.equal(ctx.autoWalk,null);
console.log('PASS production physical wait advances1800steps, yields with ordinary clock paused, restores mode and saves');
