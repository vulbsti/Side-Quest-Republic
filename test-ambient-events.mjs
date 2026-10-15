import assert from 'node:assert/strict';
import {updateAmbient} from './dist/ambient-events.js';
const world=()=>({seed:42,time:60,escalation:{hotspot:{district:'jantar',x:24,z:-12}}});
const bodies=()=>[['cp',0,-38],['supply',-66,22],['court',58,45]].flatMap(([district,x,z])=>Array.from({length:5},(_,i)=>({id:`${district}-${i}`,district,x:x+i*1.2,z:z+(i%2)*1.5,cohort:district==='supply'&&i===0?'volunteers':'assembly'})));
const los={canSee:()=>true};
function step(w,b,n,o=los){let result,events=[];for(let i=0;i<n;i++){w.time++;result=updateAmbient(w,b,1,o);events.push(...result.events);}return {result,events};}
{
 const w=world(),b=bodies(),original=JSON.stringify(b);let r=updateAmbient(w,b,0,los);assert.equal(r.state.active.length,3);assert.equal(new Set(r.state.active.map(e=>e.district)).size,3);const ids=r.state.active.flatMap(e=>e.actorIds);assert.equal(new Set(ids).size,ids.length,'actor maxoneactivity');assert.equal(r.events.length,3);assert.ok(r.events.every(e=>e.lines.length<=2&&e.fictional));assert.equal(JSON.stringify(b),original,'does not teleport');const target=JSON.stringify(r.directives);r=updateAmbient(w,b,0,los);assert.equal(r.events.length,0);assert.equal(JSON.stringify(r.directives),target,'fixed goals notmovingperframe');const run=step(w,b,17);assert.equal(run.result.state.active.length,0);assert.equal(run.result.directives.length,0);assert.equal(run.events.filter(e=>e.type==='ambient-finished').length,3);assert.equal(step(w,b,7).events.filter(e=>e.type==='ambient-start').length,0,'notrespammed before25secs');
}
{
 const w=world(),b=bodies();assert.equal(updateAmbient(w,b,0).state.active.length,0,'missinggeometryfailsclosed');const w2=world();w2.time=0;assert.equal(step(w2,b,59).result.state.active.length,0);assert.ok(step(w2,b,1).result.state.active.length>0,'notbefore60');
}
{
 const w=world(),b=bodies();b.push(...['player','scene','follow','incident','crisis','police','hidden'].map((id,i)=>({id,x:0,z:-38,sceneTarget:id==='scene'?{}:null,follow:id==='follow',incidentOwned:id==='incident',crisisOwned:id==='crisis',police:id==='police',hidden:id==='hidden'})));let r=updateAmbient(w,b,0,los);assert.ok(!r.directives.some(d=>['player','scene','follow','incident','crisis','police','hidden'].includes(d.actorId)));const active=r.state.active[0],owned=b.find(b=>b.id===active.actorIds[0]);owned.crisisOwned=true;r=updateAmbient(w,b,1,los);assert.ok(!r.state.active.some(e=>e.id===active.id));assert.ok(!r.directives.some(d=>active.actorIds.includes(d.actorId)),'crisis releases allambientparticipants');assert.equal(r.events[0].type,'ambient-interrupted');
}
{
 const w=world(),b=bodies();updateAmbient(w,b,0,los);step(w,b,5);const saved=JSON.parse(JSON.stringify(w));assert.deepEqual(step(w,b,40),step(saved,b,40),'seed/save resumesexactly');assert.equal(new Set(w.ambientEvents.history.map(e=>e.id)).size,w.ambientEvents.history.length);assert.ok(w.ambientEvents.active.length<=3);
}
{
 const kinds=new Set();for(let seed=1;seed<=30;seed++){const w=world();w.seed=seed;w.time=500;const r=updateAmbient(w,bodies(),0,los);for(const e of r.state.active)kinds.add(e.kind);}assert.deepEqual([...kinds].sort(),['chant-circle','friend-reunion','intermediary-beckon','volunteer-water-run']);
}
{
 const w=world(),b=bodies();updateAmbient(w,b,0,los);const run=step(w,b,17);for(const e of run.events.filter(e=>e.activity==='friend-reunion'))assert.equal(e.completed,false,'no completed reunionwithoutphysicalarrival');
}
console.log('PASS concurrent district activity, allfourtypes, fixedgoals, nofalsearrival, ownershippriority, no duplicateevents, seeded scheduling and save stability');
