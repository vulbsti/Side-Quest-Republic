import assert from 'node:assert/strict';
import {advancePhysicalWait} from './dist/world-wait.js';
{
 let physicalTime=0,yields=0,progress=[];const result=await advancePhysicalWait({seconds:30,step:dt=>{assert.equal(dt,1/60);physicalTime+=dt;},yieldFrame:async()=>yields++,onProgress:p=>progress.push(p)});
 assert.equal(result.advanced,30);assert.equal(result.steps,1800);assert.equal(result.completed,true);assert.equal(result.remaining,0);assert.ok(Math.abs(physicalTime-30)<1e-10);assert.equal(yields,179);assert.equal(progress.length,180);assert.ok(progress.every((p,i)=>i===0||p.steps-progress[i-1].steps<=10),'bounded batch work');
}
{
 let calls=0;const result=await advancePhysicalWait({seconds:.041,step:()=>calls++,yieldFrame:async()=>{}});assert.equal(calls,2);assert.ok(result.advanced<=.041);assert.ok(result.remaining<1/60,'no variable fractional physics step');
}
{
 let steps=0,yields=0;const result=await advancePhysicalWait({seconds:30,step:()=>steps++,yieldFrame:async()=>yields++,isCancelled:()=>steps>=13});assert.equal(result.reason,'cancelled');assert.equal(result.steps,13);assert.equal(result.completed,false);assert.equal(yields,1,'cancel checked within each batch');
}
{
 let steps=0,yields=0;const result=await advancePhysicalWait({seconds:30,step:()=>++steps<7,yieldFrame:async()=>yields++});assert.equal(result.reason,'world-stopped');assert.equal(result.steps,7);assert.equal(yields,0);assert.equal(result.advanced,7/60);
}
{
 let steps=0;const result=await advancePhysicalWait({seconds:0,step:()=>steps++,yieldFrame:async()=>{throw Error('unexpected yield');}});assert.equal(steps,0);assert.equal(result.advanced,0);assert.equal(result.completed,true);
 const cancelled=await advancePhysicalWait({seconds:30,step:()=>{throw Error('unexpected step');},yieldFrame:async()=>{},isCancelled:()=>true});assert.equal(cancelled.advanced,0);assert.equal(cancelled.reason,'cancelled');
}
{
 for(const seconds of [-1,NaN,Infinity])await assert.rejects(advancePhysicalWait({seconds,step:()=>{},yieldFrame:async()=>{}}),RangeError);
 await assert.rejects(advancePhysicalWait({seconds:1,fixed:0,step:()=>{},yieldFrame:async()=>{}}),RangeError);
 await assert.rejects(advancePhysicalWait({seconds:1,step:async()=>{},yieldFrame:async()=>{}}),TypeError);
 await assert.rejects(advancePhysicalWait({seconds:1,step:()=>{throw Error('physics failed');},yieldFrame:async()=>{}}),/physics failed/);
}
console.log('PASS physical fixed-step waits: exact elapsed, bounded yielding, no overshoot, cancellation, early world stop and validation');
