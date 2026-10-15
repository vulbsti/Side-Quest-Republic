import assert from 'node:assert/strict';
import {cinematicCameraFrame,selectDayMood,DayPresentation} from './dist/day-presentation.js';
assert.equal(selectDayMood({phase:'morning'}),'playful');
assert.equal(selectDayMood({phase:'aftermath',districts:{x:{tension:100}}}),'reflective');
assert.equal(selectDayMood({phase:'morning',districts:{x:{tension:90}}}),'climax');
const kinds=new Set();for(let t=0;t<7;t+=.05){const frame=cinematicCameraFrame(t,{x:58,z:45},{x:59,z:46,y:0});kinds.add(frame.kind);for(const p of [frame.position,frame.lookAt])for(const n of Object.values(p))assert.ok(Number.isFinite(n));assert.ok(Math.hypot(frame.position.x-59,frame.position.z-46)>1);}
assert.equal(kinds.size,4);assert.equal(cinematicCameraFrame(-1),null);assert.equal(cinematicCameraFrame(7),null);
const one=cinematicCameraFrame(.1,{x:1,z:2});const two=cinematicCameraFrame(.11,{x:1,z:2});assert.ok(Math.abs(one.position.x-two.position.x)<.1);
const stub={ctx:null,paused:false};const adapter=new DayPresentation(stub);assert.equal(adapter.onScene({title:'Test',presentation:{duration:7,music:'playful'},location:{x:0,z:0}}).voiceAvailable,false);assert.ok(adapter.getCameraFrame());adapter.setPaused(true);adapter.update(.1,{phase:'morning'});assert.equal(adapter.elapsed,0);assert.equal(adapter.getCameraFrame(),null);adapter.setPaused(false);for(let i=0;i<71;i++)adapter.update(.1,{phase:'morning'});assert.equal(adapter.getCameraFrame(),null);adapter.dispose();adapter.onScene({});assert.equal(adapter.scene,null);
console.log('PASS: camera four-shot sequence, interpolation, bounded duration, mood priority, no-AudioContext fallback, pause and disposal');
// Legacy enable flags must not reactivate the removed generated soundtrack.
const noGeneratedAudio=new DayPresentation({ctx:{state:'running',createOscillator(){throw Error('generated audio');},createGain(){throw Error('generated audio');}},paused:false},{enabled:true});
noGeneratedAudio.onScene({location:{x:0,z:0}});for(let i=0;i<100;i++)noGeneratedAudio.update(.25,{phase:'rupture',districts:{a:{x:0,z:0,tension:90}}});noGeneratedAudio.dispose();
console.log('PASS: scene presentation remains camera-only even with legacy enabled audio configuration');
