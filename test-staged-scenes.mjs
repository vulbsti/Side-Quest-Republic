import assert from 'node:assert/strict';
import {createSceneRun,currentSceneBeat,selectSceneChoice,advanceSceneBeat,DayClient} from './dist/day-client.js';
import {DAY_ENCOUNTERS,DAY_ACTORS,DAY_DISTRICTS} from './dist/day-content.js';
import {createLivingWorld,actWorld,advanceWorld} from './dist/living-world.js';
const staged=DAY_ENCOUNTERS.filter(e=>e.staging);assert.equal(staged.length,DAY_ENCOUNTERS.length);
for(const e of staged){assert.ok(e.staging.cast.length);for(const c of e.choices){assert.ok(c.responseBeats.length>=2);const run=createSceneRun(e);assert.equal(selectSceneChoice(run,e,c.id),false,'cannot select before setup');let safety=0;while(run.phase==='setup'&&safety++<10){assert.ok(currentSceneBeat(run,e).line);advanceSceneBeat(run,e);}assert.equal(run.phase,'choice');assert.ok(selectSceneChoice(run,e,c.id));assert.equal(run.phase,'response');assert.equal(selectSceneChoice(run,e,c.id),false,'no double choice');while(run.phase==='response'&&safety++<20)advanceSceneBeat(run,e);assert.equal(run.phase,'commit');assert.equal(run.choiceId,c.id);}}
// DayClient.choose must stage performance without invoking world mutation or consequence hooks.
const e=staged[0],state=createLivingWorld(1,{encounters:DAY_ENCOUNTERS,actors:DAY_ACTORS,districts:DAY_DISTRICTS});
const client=Object.create(DayClient.prototype);Object.assign(client,{state,sceneRun:{encounterId:e.id,phase:'choice',index:0,choiceId:null},available:()=>[e],render:()=>{},performBeat:()=>{}});const before=JSON.stringify(state);client.choose(e.id,e.choices[0].id);assert.equal(JSON.stringify(state),before);assert.equal(client.sceneRun.phase,'response');client.sceneRun=null;assert.equal(JSON.stringify(state),before,'abandoned performance grants nothing');
const timed=createLivingWorld(1,{encounters:DAY_ENCOUNTERS,actors:DAY_ACTORS,districts:DAY_DISTRICTS});advanceWorld(timed,280);const prior=timed.schedule.find(e=>e[1]==='orders_change')[0];assert.ok(actWorld(timed,'meeting_terms','clarify').ok);assert.equal(timed.schedule.find(e=>e[1]==='orders_change')[0],prior+35);assert.ok(timed.events.some(e=>e.type==='timing'&&e.causedBy));
console.log('PASS: all day encounters staged, all response branches, no premature/aborted rewards, and causally shifted future timing');
let prepared=0,toasted=0,opened=0;const waiting=Object.create(DayClient.prototype);Object.assign(waiting,{state,available:()=>[e],distance:()=>0,location:()=>({x:0,z:0}),hooks:{castReady:()=>({ready:false,reason:'Kabir is approaching'}),prepare:()=>prepared++,toast:()=>toasted++},open:()=>opened++});waiting.begin(e.id);assert.equal(prepared,1);assert.equal(toasted,1);assert.equal(opened,0,'absent cast does not open frozen scene');assert.equal(JSON.stringify(state),before);
console.log('PASS: missing cast requests approach, keeps street active, and grants no reward');
let commits=0;client.selected=e.id;client.sceneRun={encounterId:e.id,phase:'response',index:0,choiceId:e.choices[0].id};client.beatElapsed=0;client.commitChoice=(id,choice)=>{commits++;assert.ok(actWorld(state,id,choice).ok);client.sceneRun=null;};client.nextBeat();assert.equal(commits,0,'cannot skip the first response frame');client.beatElapsed=10;for(let i=0;i<e.choices[0].responseBeats.length-1;i++){client.nextBeat();assert.equal(commits,0,'intermediate response is not success');}client.nextBeat();assert.equal(commits,1);assert.equal(state.resolved[e.id].choiceId,e.choices[0].id);
console.log('PASS: only final performed response commits the chosen world action');

// Closing an open menu releases old cast targets, so prepare must happen afterwards.
for (const method of ['follow','begin']) {
 let target=null;const c=Object.create(DayClient.prototype);Object.assign(c,{opened:true,encounter:()=>e,available:()=>[e],distance:()=>0,location:()=>({x:3,z:4}),close(){target=null;this.opened=false;},hooks:{castReady:()=>false,prepare:()=>target=e.id,walk:()=>{},toast:()=>{}}});
 c[method](e.id);assert.equal(target,e.id,method+' preserves approaching cast after menu dismissal');
}
