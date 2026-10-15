import assert from 'node:assert/strict';
import {updateCrisis,actCrisis,sampleCrisisContact} from './dist/crowd-crisis.js';
const world=()=>({seed:42,time:780,escalation:{hotspot:{district:'connector',x:0,z:0},intensity:75},institutions:{command:{pressure:65}},actors:{p1:{values:{duty:100},needs:{fear:0}},p2:{values:{duty:0},needs:{fear:90}}}});
const bodies=()=>[{id:'p1',police:true,x:0,z:-3},{id:'p2',police:true,x:2,z:-3},...['a','b','c','d','e','f'].map((id,i)=>({id,x:i-2,z:2,cohort:id==='f'?'volunteers':'assembly'})),{id:'player',x:0,z:-1}];
const los={canSee:()=>true};
const step=(w,b,n,o=los)=>{const events=[];let r;for(let i=0;i<n;i++){w.time++;r=updateCrisis(w,b,1,o);events.push(...r.events);}return {result:r,events};};
{
 const w=world(),b=bodies();assert.equal(updateCrisis(w,b,1).state.status,'waiting');w.time=500;assert.equal(updateCrisis(w,b,1,los).state.status,'waiting');w.time=780;w.institutions.command.pressure=0;assert.equal(updateCrisis(w,b,1,los).state.status,'waiting');w.institutions.command.pressure=60;w.escalation.intensity=20;assert.equal(updateCrisis(w,b,1,los).state.status,'waiting');w.escalation.intensity=75;assert.equal(updateCrisis(w,b.filter(b=>b.id!=='p2'),1,los).state.status,'waiting');assert.equal(updateCrisis(w,b,1,{canSee:()=>false}).state.status,'waiting');
}
{
 const w=world(),b=bodies(),original=JSON.stringify(b);let r=updateCrisis(w,b,0,los);assert.equal(r.state.status,'warning');assert.equal(r.events.length,1);let run=step(w,b,8);r=run.result;assert.equal(r.state.status,'advance');assert.ok(r.directives.some(d=>d.actorId==='p1'&&d.objective==='line-advance'&&d.gesture==='lathi-charge'));assert.ok(r.directives.some(d=>d.actorId==='p2'&&d.objective==='hesitate-and-hold'));assert.ok(r.directives.some(d=>d.objective==='scatter-from-line'));assert.ok(r.directives.some(d=>d.objective==='film-police-line'));assert.ok(r.directives.some(d=>d.objective==='guide-companion-away'));assert.equal(run.events.filter(e=>e.type==='crisis-player-near-line').length,1);assert.ok(!r.directives.some(d=>d.targetId),'no identity-targeted charge');assert.equal(JSON.stringify(b),original,'no teleport/body mutation');
 const goals=JSON.stringify(r.directives);b.find(b=>b.id==='a').x+=.3;r=updateCrisis(w,b,0,los);assert.equal(JSON.stringify(r.directives),goals,'fixed destinations');run=step(w,b,3);assert.equal(run.result.state.status,'scatter');run=step(w,b,8);assert.equal(run.result.state.status,'regroup');run=step(w,b,10);assert.equal(run.result.state.status,'cooldown');assert.equal(run.result.directives.length,0);assert.equal(step(w,b,w.crowdCrisis.cooldownSeconds-1).result.state.wave,1,'finite cooldown');w.escalation.intensity=90;assert.equal(step(w,b,1).result.state.wave,2);step(w,b,300);assert.equal(w.crowdCrisis.status,'complete');assert.equal(w.crowdCrisis.wave,4,'waves bounded');
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

{
 const w=world(),b=bodies();updateCrisis(w,b,0,los);step(w,b,8);
 const runner=w.crowdCrisis.orders.find(d=>d.objective==='scatter-from-line'),source=b.find(v=>v.id===runner.actorId);
 b.push({id:'neighbour',x:source.x,z:source.z+6},{id:'distant',x:source.x,z:source.z+20},{id:'blocked',x:source.x+1,z:source.z+6});
 const geometry={canSee:(a,c)=>a.id!=='blocked'&&c.id!=='blocked'};
 assert.ok(!step(w,b,1,geometry).result.directives.some(d=>d.actorId==='neighbour'),'intended but stationary retreat does not transmit panic');
 source.z+=.3;let r=updateCrisis(w,b,1,geometry);
 assert.ok(r.directives.some(d=>d.actorId==='neighbour'&&d.objective==='follow-visible-retreat'),'visible moving retreat reaches neighbour');
 assert.ok(!r.directives.some(d=>['distant','blocked'].includes(d.actorId)),'no unseen or remote panic');
 assert.ok(r.events.some(e=>e.type==='crisis-retreat-spreads'&&e.witnessIds.includes(source.id)));
 const copied=JSON.parse(JSON.stringify(w));assert.deepEqual(JSON.parse(JSON.stringify(updateCrisis(w,b,0,geometry))),JSON.parse(JSON.stringify(updateCrisis(copied,b,0,geometry))),'propagation state survives save');
}
{
 const w=world(),b=bodies();updateCrisis(w,b,0,los);step(w,b,8);const filmer=w.crowdCrisis.orders.find(d=>d.objective==='film-police-line');assert.ok(filmer);
 const person=b.find(v=>v.id===filmer.actorId),police=b.find(v=>v.id==='p1');Object.assign(person,{x:police.x+.5,z:police.z+1});
 const result=updateCrisis(w,b,1,los);assert.ok(result.directives.some(d=>d.actorId===person.id&&d.objective==='back-away-from-close-line'));assert.ok(result.events.some(e=>e.type==='crisis-confidence-breaks'));
}
{
 const peaceful=world(),rallied=world(),b=bodies();updateCrisis(peaceful,b,0,los);updateCrisis(rallied,b,0,los);actCrisis(peaceful,b,'keep-passage',los);actCrisis(rallied,b,'rally',los);assert.ok(peaceful.crowdCrisis.cooldownSeconds>rallied.crowdCrisis.cooldownSeconds,'interventions change time available to recover');
}
console.log('PASS witnessed moving retreat propagation, blocked sight and remote isolation, filmer reversal and player-sensitive recovery');

{
 const w=world(),b=bodies();updateCrisis(w,b,0,los);step(w,b,8);const runner=w.crowdCrisis.orders.find(d=>d.objective==='scatter-from-line'),source=b.find(v=>v.id===runner.actorId);
 b.push(...Array.from({length:25},(_,i)=>({id:`relay-${i}`,x:source.x+i*.01,z:source.z+5})));
 source.z+=.1;const result=updateCrisis(w,b,1,los);assert.equal(result.events.filter(e=>e.type==='crisis-retreat-spreads').length,2,'one reaction tick recruits at most two neighbours, never recursive flood');
 const first=result.directives.find(d=>d.objective==='follow-visible-retreat'),neighbour=b.find(v=>v.id===first.actorId);const hiddenPolice={canSee:(a,c)=>!(a.id===neighbour.id&&c.police)};step(w,b,2,hiddenPolice);assert.ok(updateCrisis(w,b,0,hiddenPolice).directives.some(d=>d.actorId===neighbour.id&&d.objective==='follow-visible-retreat'),'observed retreat persists when direct police sight is lost at scatter phase');
}
console.log('PASS bounded non-recursive panic batches and continuity across stage transitions');

{
 const w=world(),b=bodies();assert.deepEqual(sampleCrisisContact(w,b,los),{events:[],effects:[]});assert.equal(w.crowdCrisis,undefined,'contact query does not create simulation state');updateCrisis(w,b,0,los);step(w,b,8);
 const before={stage:w.crowdCrisis.stageTime,reaction:w.crowdCrisis.reactionClock,orders:JSON.stringify(w.crowdCrisis.orders),time:w.time};
 Object.assign(b.find(b=>b.id==='player'),{x:0,z:-2});
 assert.equal(sampleCrisisContact(w,b).events.length,0,'missing geometry fails closed');assert.equal(sampleCrisisContact(w,b,{canSee:()=>false}).events.length,0,'occluded close body is not contact');
 const result=sampleCrisisContact(w,b,los);assert.equal(result.events.length,1);assert.equal(result.events[0].type,'crisis-player-contact');assert.equal(result.events[0].officerId,'p1');
 assert.deepEqual({stage:w.crowdCrisis.stageTime,reaction:w.crowdCrisis.reactionClock,orders:JSON.stringify(w.crowdCrisis.orders),time:w.time},before,'physics probe does not advance decision clocks or orders');
 assert.equal(sampleCrisisContact(w,b,los).events.length,0);assert.equal(updateCrisis(w,b,.1,los).events.filter(e=>e.type==='crisis-player-contact').length,0,'decision callback cannot duplicate physics contact');
 const saved=JSON.parse(JSON.stringify(w));assert.equal(sampleCrisisContact(saved,b,los).events.length,0,'save prevents duplicatecontact');
}
console.log('PASS independent physics-rate contact sampling without timer advance or duplicate events');
