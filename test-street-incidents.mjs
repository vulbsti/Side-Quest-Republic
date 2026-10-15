import assert from 'node:assert/strict';
import {updateIncident,actIncident} from './dist/street-incidents.js';
const world=()=>({seed:42,time:610,escalation:{hotspot:{district:'connector',x:0,z:0}}});
const bodies=()=>[{id:'forum-a',cohort:'fictional-forum',x:0,z:0},{id:'forum-b',cohort:'fictional-forum',x:0,z:1.8},{id:'police-a',cohort:'police',x:.95,z:0},{id:'police-b',cohort:'police',x:4,z:0},{id:'far-police',cohort:'police',x:40,z:0},{id:'spectator',x:2,z:2},{id:'player',x:-2,z:0}];
const los={canSee:()=>true};
function step(w,b,n,options=los){const events=[],effects=[];let result;for(let i=0;i<n;i++){w.time++;result=updateIncident(w,b,1,options);events.push(...result.events);effects.push(...result.effects);}return {result,events,effects};}
{
 const w=world(),b=bodies();w.time=609;assert.equal(updateIncident(w,b,1,los).state.status,'pending');w.time=610;assert.equal(updateIncident(w,b,1).state.status,'pending','missing geometry fails closed');
 const hidden=b.map(x=>({...x,hidden:x.id==='forum-b'}));assert.equal(updateIncident(w,hidden,1,los).state.status,'pending');
 const distant=b.map(x=>({...x,x:x.cohort==='police'?40:x.x}));assert.equal(updateIncident(w,distant,1,los).state.status,'pending');
 assert.equal(updateIncident(w,b,1,{canSee:()=>false}).state.status,'pending');
}
{
 const w=world(),b=bodies();const initial=updateIncident(w,b,0,los);assert.equal(initial.state.status,'gathering');assert.deepEqual(initial.options,['separate','join','draw-witnesses','leave']);
 const run=step(w,b,26);assert.equal(run.result.state.status,'dispersing');const shove=run.events.find(e=>e.type==='incident-shove');assert.ok(shove);assert.equal(shove.perpetratorId,'forum-a');assert.ok(shove.policeWitnessIds.includes('police-a'));assert.ok(shove.policeWitnessIds.includes('police-b'));assert.ok(!shove.policeWitnessIds.includes('far-police'));assert.ok(shove.witnessIds.includes('spectator'));assert.equal(run.effects.filter(e=>e.type==='tension'&&e.value>0).length,1);assert.ok(run.result.state.policeKnowledge.every(k=>k.subjectId==='forum-a'));assert.ok(!run.result.state.policeKnowledge.some(k=>k.subjectId==='forum-b'),'no affiliation guilt');assert.equal(new Set(run.result.state.emitted).size,run.result.state.emitted.length);assert.equal(step(w,b,20).events.length,0,'completed event never replays');
}
{
 const w=world(),b=bodies();updateIncident(w,b,0,los);step(w,b,7);b.find(x=>x.id==='police-a').x=30;const r=step(w,b,1);assert.equal(r.result.state.status,'dispersing');assert.ok(!w.streetIncident.history.some(e=>e.type==='incident-shove'),'separation aborts contact');
}
{
 const w=world(),b=bodies();updateIncident(w,b,0,los);const r=actIncident(w,b,'separate',los);assert.ok(r.ok);assert.equal(r.state.status,'dispersing');assert.equal(r.effects[0].value,-8);assert.ok(!step(w,b,50).events.some(e=>e.type==='incident-shove'));
}
{
 const w=world(),b=bodies();updateIncident(w,b,0,los);const r=actIncident(w,b,'join',los);assert.ok(r.ok);assert.equal(r.events[0].action,'vocal-incitement');assert.ok(r.state.policeKnowledge.some(k=>k.subjectId==='player'));assert.equal(actIncident(w,b,'join',los).ok,false,'cannot spam join');const run=step(w,b,14);assert.equal(run.events.find(e=>e.type==='incident-shove').perpetratorId,'forum-a','joining is not a fabricated player shove');
}
{
 const w=world(),b=bodies(),blocked={canSee:(a,b)=>!(a.id==='police-b'&&b.id==='forum-a')};updateIncident(w,b,0,blocked);const r=actIncident(w,b,'draw-witnesses',blocked);assert.ok(r.ok);assert.ok(r.directives.some(d=>d.actorId==='spectator'));const run=step(w,b,14,blocked),shove=run.events.find(e=>e.type==='incident-shove');assert.ok(!shove.policeWitnessIds.includes('police-b'),'calling witnesses cannot invent blocked LOS');assert.ok(!run.result.state.policeKnowledge.some(k=>k.officerId==='police-b'));
}
{
 const w=world(),b=bodies();updateIncident(w,b,0,los);b.find(x=>x.id==='player').x=20;assert.equal(actIncident(w,b,'separate',los).ok,false);assert.equal(actIncident(w,b,'join',los).ok,false);assert.deepEqual(updateIncident(w,b,0,los).options,[]);
}
{
 const w=world(),b=bodies();updateIncident(w,b,0,los);step(w,b,10);const restored=JSON.parse(JSON.stringify(w));assert.deepEqual(step(w,b,16),step(restored,b,16),'save-resume exact stage/events');assert.deepEqual(w,restored);
}
{
 const w=world(),b=bodies();b.find(x=>x.id==='police-a').x=2;updateIncident(w,b,0,los);step(w,b,50);assert.equal(w.streetIncident.status,'dispersing');assert.ok(!w.streetIncident.history.some(e=>e.type==='incident-shove'),'out of contact range never hits remotely');
}
console.log('PASS physically gated incident, contact radius, aborts, four player options, direct witness targeting, no affiliation inference, save stability and no event duplication');
{
 const w=world(),b=bodies();updateIncident(w,b,0,los);let run=step(w,b,14);assert.equal(run.result.state.status,'shove');assert.equal(run.result.directives.find(d=>d.actorId==='forum-a').gesture,'push');
 w.time+=.81;run=updateIncident(w,b,.81,los);assert.equal(run.state.status,'response','push pose shorter than .8 seconds');const directive=run.directives.find(d=>d.actorId==='police-b');assert.equal(directive.gesture,'point');assert.ok(Math.abs(Math.hypot(directive.to.x-b[0].x,directive.to.z-b[0].z)-.95)<1e-6);assert.notEqual(directive.to.x,b.find(b=>b.id==='police-b').x);
 const blind={canSee:(a,b)=>a.id!=='police-b'};run=updateIncident(w,b,0,blind);const lastKnown=run.directives.find(d=>d.actorId==='police-b');assert.equal(lastKnown.knownPositionOnly,true);assert.equal(lastKnown.targetId,undefined);assert.deepEqual(lastKnown.to,w.streetIncident.policeKnowledge.find(k=>k.officerId==='police-b').lastKnownPosition);
}
console.log('PASS brief push pose, physical officer stand-off response and last-known-position fallback');
{
 const w=world(),b=bodies();b.push(...['bystander-a','bystander-b','bystander-c'].map((id,i)=>({id,x:-3,z:1+i})),{id:'blocked-observer',x:3,z:3},{id:'far-civilian',x:40,z:3},{id:'hidden-civilian',x:2,z:3,hidden:true});
 const options={canSee:(a,b)=>a.id!=='blocked-observer'};updateIncident(w,b,0,options);const before=JSON.stringify(b);let run=step(w,b,14,options).result;
 assert.equal(JSON.stringify(b),before,'reactions never teleport bodies');assert.equal(w.streetIncident.drawWitnesses,false);const reactions=w.streetIncident.reactions;
 assert.ok(reactions.length>=3,'autonomous reactions require no player intervention');assert.equal(new Set(reactions.map(r=>r.objective)).size,3,'seeded reactions include recoil, observation and filming');
 assert.ok(!reactions.some(r=>['blocked-observer','far-civilian','hidden-civilian','player','forum-a','forum-b','police-a','police-b'].includes(r.actorId)));
 for(const r of reactions){const person=b.find(b=>b.id===r.actorId),d=Math.hypot(r.to.x-person.x,r.to.z-person.z);assert.ok(Math.abs(d-(r.objective==='recoil-from-incident'?2:0))<1e-6);assert.equal(r.eventId,w.streetIncident.history.find(e=>e.type==='incident-shove').id);assert.ok(run.directives.some(d=>d.actorId===r.actorId&&d.sourceEventId===r.eventId));}
 const saved=JSON.parse(JSON.stringify(reactions));for(const r of reactions)b.find(b=>b.id===r.actorId).x+=.5;
 run=updateIncident(w,b,0,options);assert.deepEqual(w.streetIncident.reactions,saved,'targets do not retreat another two metres every frame');
 const restored=JSON.parse(JSON.stringify(w));assert.deepEqual(updateIncident(restored,b,0,options).directives,run.directives,'reaction pose/position survives save');
 run=step(w,b,8,options).result;assert.equal(run.state.status,'dispersing');assert.ok(!run.directives.some(d=>saved.some(r=>r.actorId===d.actorId)),'incident releases bystanders');
}
{
 const w=world(),b=bodies();b.push({id:'late-observer',x:3,z:3});const options={canSee:(a,target)=>!(a.id==='late-observer'&&target.id==='forum-a')};updateIncident(w,b,0,options);step(w,b,14,options);assert.ok(!w.streetIncident.reactions.some(r=>r.actorId==='late-observer'));
 const run=step(w,b,1,options).result,r=run.state.reactions.find(r=>r.actorId==='late-observer');assert.ok(r);assert.equal(r.eventId,run.state.history.find(e=>e.type==='incident-response').id,'seeing response grants no retroactive shove knowledge');
}
console.log('PASS autonomous witnessed reactions, fixed collision-routed recoil, distinct poses, no remote knowledge, save persistence and release');
