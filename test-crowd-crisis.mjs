import assert from 'node:assert/strict';
import {updateCrisis,actCrisis} from './dist/crowd-crisis.js';
const world=()=>({seed:42,time:780,escalation:{hotspot:{district:'connector',x:0,z:0},intensity:75},institutions:{command:{pressure:65}},actors:{p1:{values:{duty:100},needs:{fear:0}},p2:{values:{duty:0},needs:{fear:90}}}});
const bodies=()=>[{id:'p1',police:true,x:0,z:-3},{id:'p2',police:true,x:2,z:-3},...['a','b','c','d','e','f'].map((id,i)=>({id,x:i-2,z:2,cohort:id==='f'?'volunteers':'assembly'})),{id:'player',x:0,z:-1}];
const los={canSee:()=>true};
const step=(w,b,n,o=los)=>{const events=[];let r;for(let i=0;i<n;i++){w.time++;r=updateCrisis(w,b,1,o);events.push(...r.events);}return {result:r,events};};
{
 const w=world(),b=bodies();assert.equal(updateCrisis(w,b,1).state.status,'waiting');w.time=500;assert.equal(updateCrisis(w,b,1,los).state.status,'waiting');w.time=780;w.institutions.command.pressure=0;assert.equal(updateCrisis(w,b,1,los).state.status,'waiting');w.institutions.command.pressure=60;w.escalation.intensity=20;assert.equal(updateCrisis(w,b,1,los).state.status,'waiting');w.escalation.intensity=75;assert.equal(updateCrisis(w,b.filter(b=>b.id!=='p2'),1,los).state.status,'waiting');assert.equal(updateCrisis(w,b,1,{canSee:()=>false}).state.status,'waiting');
}
{
 const w=world(),b=bodies(),original=JSON.stringify(b);let r=updateCrisis(w,b,0,los);assert.equal(r.state.status,'warning');assert.equal(r.events.length,1);let run=step(w,b,8);r=run.result;assert.equal(r.state.status,'advance');assert.ok(r.directives.some(d=>d.actorId==='p1'&&d.objective==='line-advance'&&d.gesture==='lathi-charge'));assert.ok(r.directives.some(d=>d.actorId==='p2'&&d.objective==='hesitate-and-hold'));assert.ok(r.directives.some(d=>d.objective==='scatter-from-line'));assert.ok(r.directives.some(d=>d.objective==='film-police-line'));assert.ok(r.directives.some(d=>d.objective==='guide-companion-away'));assert.equal(run.events.filter(e=>e.type==='crisis-player-near-line').length,1);assert.ok(!r.directives.some(d=>d.targetId),'no identity-targeted charge');assert.equal(JSON.stringify(b),original,'no teleport/body mutation');
 const goals=JSON.stringify(r.directives);b.find(b=>b.id==='a').x+=.3;r=updateCrisis(w,b,0,los);assert.equal(JSON.stringify(r.directives),goals,'fixed destinations');run=step(w,b,3);assert.equal(run.result.state.status,'scatter');run=step(w,b,8);assert.equal(run.result.state.status,'regroup');run=step(w,b,10);assert.equal(run.result.state.status,'cooldown');assert.equal(run.result.directives.length,0);assert.equal(step(w,b,99).result.state.wave,1,'finite cooldown');w.escalation.intensity=90;assert.equal(step(w,b,1).result.state.wave,2);step(w,b,29);step(w,b,100);assert.equal(w.crowdCrisis.status,'complete');assert.equal(w.crowdCrisis.wave,2,'waves bounded');
}
{
 const w=world(),b=bodies();b.find(b=>b.id==='player').x=80;updateCrisis(w,b,0,los);assert.equal(actCrisis(w,b,'rally',los).ok,false);assert.equal(actCrisis(w,b,'keep-passage',los).ok,false);const run=step(w,b,15);assert.ok(!run.events.some(e=>e.type==='crisis-player-near-line'),'no remote player harm or danger claim');assert.ok(run.events.every(e=>e.damage===undefined||e.damage===0));
}
{
 const w=world(),b=bodies();b.push({id:'scene-owned',x:0,z:0,sceneTarget:{x:1,z:1}},{id:'follower',x:1,z:0,follow:true},{id:'incident',x:1,z:1,incidentOwned:true},{id:'hidden',x:1,z:1,hidden:true});updateCrisis(w,b,0,los);let r=actCrisis(w,b,'keep-passage',los);assert.ok(r.ok);assert.ok(r.directives.some(d=>d.objective==='use-safe-passage'));assert.ok(!r.directives.some(d=>['scene-owned','follower','incident','hidden'].includes(d.actorId)));assert.ok(r.effects.some(e=>e.value===-5));assert.equal(actCrisis(w,b,'keep-passage',los).ok,false,'no spam repeat');b.find(b=>b.id==='a').sceneTarget={};r=updateCrisis(w,b,0,los);assert.ok(!r.directives.some(d=>d.actorId==='a'),'new scene ownership releases actor');
}
{
 const w=world(),b=bodies();updateCrisis(w,b,0,los);step(w,b,10);const saved=JSON.parse(JSON.stringify(w));assert.deepEqual(step(w,b,12),step(saved,b,12),'save continuation and events stable');assert.equal(new Set(w.crowdCrisis.history.map(e=>e.id)).size,w.crowdCrisis.history.length);
}
{
 const w=world(),b=bodies();updateCrisis(w,b,0,los);b.find(b=>b.id==='p2').hidden=true;const r=updateCrisis(w,b,1,los);assert.equal(r.state.status,'cooldown');assert.equal(r.directives.length,0,'broken formation aborts wave');
}
console.log('PASS finite spatial crowd waves, varied police response, concurrent civilian reactions, physical player proximity, ownership, no teleport/target inference and deterministic saves');
{
 const w=world(),b=bodies();updateCrisis(w,b,0,los);const acted=actCrisis(w,b,'keep-passage',los),specific=acted.directives.find(d=>d.objective==='use-safe-passage');assert.ok(specific);const advanced=step(w,b,8).result;assert.deepEqual(advanced.directives.find(d=>d.actorId===specific.actorId),specific,'local passage commitment survives phase change');const saved=JSON.parse(JSON.stringify(w));assert.deepEqual(updateCrisis(saved,b,0,los).directives,advanced.directives);step(w,b,21);assert.equal(updateCrisis(w,b,0,los).directives.length,0,'passage directive releases after wave');
}
{
 const w=world(),b=bodies();updateCrisis(w,b,0,los);for(const person of b)if(!person.police&&person.id!=='player')person.x=70;const result=step(w,b,8).result;assert.equal(result.state.status,'cooldown');assert.ok(!result.state.history.some(e=>e.type==='crisis-advance'),'no charge into an abandoned assembly');
}
console.log('PASS passage commitment through phase/save, post-wave release, and physical crowd-cleared cancellation');
{
 const {createLivingWorld,advanceWorld}=await import('./dist/living-world.js');const {DAY_ENCOUNTERS,DAY_ACTORS,DAY_DISTRICTS}=await import('./dist/day-content.js');const {deriveEscalation}=await import('./dist/escalation-director.js');
 const w=createLivingWorld(42,{encounters:DAY_ENCOUNTERS,actors:DAY_ACTORS,districts:DAY_DISTRICTS});let activated=null;
 for(let t=0;t<1000;t+=5){advanceWorld(w,5);w.escalation=deriveEscalation(w,w.escalation);const h=w.escalation.hotspot,b=bodies().map(v=>({...v,x:v.x+h.x,z:v.z+h.z}));const r=updateCrisis(w,b,1,los);if(r.state.status==='warning'){activated={time:w.time,intensity:w.escalation.intensity,pressure:w.institutions.command.pressure};break;}}
 assert.ok(activated,'real absent-player day meets activation conditions');assert.ok(activated.time>=540&&activated.time<900);assert.ok(activated.pressure>=35);console.log('Actual absent-player day warning eligibility:',activated);
}
{
 const w=world(),b=bodies();w.time=550;assert.equal(updateCrisis(w,b,0,los).state.status,'warning','early high-pressure branch eligible');const run=step(w,b,8).result;assert.equal(run.directives.find(d=>d.objective==='line-advance').speed,3.3);assert.equal(run.directives.find(d=>d.objective==='scatter-from-line').speed,4.6);
}
console.log('PASS real-world absent-player activation and early-pressure branch, runnable movement speeds');
{
 const w=world(),b=bodies();updateCrisis(w,b,0,los);step(w,b,8);assert(!w.crowdCrisis.history.some(e=>e.type==='crisis-player-contact'),'nearby alone is not contact');Object.assign(b.find(b=>b.id==='player'),{x:0,z:-2});const r=updateCrisis(w,b,.1,los);assert.equal(r.events.filter(e=>e.type==='crisis-player-contact').length,1);assert.equal(updateCrisis(w,b,.1,los).events.filter(e=>e.type==='crisis-player-contact').length,0,'one contact per wave');
}
console.log('PASS physical player contact threshold and no repeated penalty');
