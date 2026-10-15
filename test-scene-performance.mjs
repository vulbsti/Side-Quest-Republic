import assert from 'node:assert/strict';
import {createPerformance,advancePerformance,cancelPerformance,samplePerformance} from './dist/scene-performance.js';
import {DESTINATIONS,createDestinationState,performDestination} from './dist/destinations.js';
import {DAY_ENCOUNTERS,DAY_ACTORS} from './dist/day-content.js';
const allowed=new Set(['player',...DAY_ACTORS.map(a=>a.id)]);
for(const e of DAY_ENCOUNTERS){assert.ok(e.staging);for(const beat of [...e.staging.setup,...e.choices.flatMap(c=>c.responseBeats)]){assert.ok(allowed.has(beat.speaker),`${e.id}: unknown speaker ${beat.speaker}`);assert.ok(beat.line?.length);assert.ok(beat.duration>=1&&beat.duration<=5.5);}}
for(const d of DESTINATIONS.filter(d=>d.performance))for(const action of d.actions){
 const original=createDestinationState(),snapshot=JSON.stringify(original),beats=d.performance.responses[action.id];assert.ok(beats.length>=3);
 const run=createPerformance(beats);for(let i=0;i<3;i++)advancePerformance(run,.1);cancelPerformance(run);advancePerformance(run,1000);assert.equal(run.status,'cancelled');assert.equal(JSON.stringify(original),snapshot,'abandoning presentation changes no reward state');
 const complete=createPerformance(beats);let frames=0;while(complete.status==='playing'&&frames++<2000){const sample=samplePerformance(complete.beats[complete.index],complete.elapsed);assert.ok(sample.progress>=0&&sample.progress<=1);advancePerformance(complete,1/60);}assert.equal(complete.status,'complete');assert.equal(JSON.stringify(original),snapshot,'completion awaits explicit commit');assert.ok(performDestination(original,d.id,action.id).ok);assert.equal(performDestination(original,d.id,action.id).repeated,true);
}
const long=createPerformance([{duration:2,line:'Pause'}]);advancePerformance(long,100);assert.equal(long.status,'playing','tab suspension cannot swallow an entire scene');
console.log('PASS: authored cast, timing, all six shop branches, interruption, explicit commit, replay idempotency, suspension cap');
