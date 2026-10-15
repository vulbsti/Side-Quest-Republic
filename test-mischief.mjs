import assert from 'node:assert/strict';
import {mischiefActions as rawActions,actMischief as rawAct} from './dist/mischief.js';
const mischiefActions=(w,b,p,o={canSee:()=>true})=>rawActions(w,b,p,o);
const actMischief=(w,b,p,id,o={canSee:()=>true})=>rawAct(w,b,p,id,o);
const player={x:0,z:0},bodies=[{id:'officer',x:2,z:0,police:true},{id:'friend',x:1,z:0},{id:'friend2',x:2,z:1},{id:'friend3',x:3,z:1}];
const make=()=>({time:0,actors:{officer:{district:'cp',needs:{fatigue:0}}},districts:{cp:{tension:10}}});
assert.equal(mischiefActions(make(),bodies,player).length,6);
assert.equal(mischiefActions(make(),bodies,player,{canSee:()=>false}).length,0);
assert.equal(mischiefActions(make(),bodies.map(b=>({...b,hidden:true})),player).length,0);
assert.equal(mischiefActions(make(),bodies.slice(0,2),player).length,5);
for(const action of mischiefActions(make(),bodies,player)){
 const w=make(),r=actMischief(w,bodies,player,action.id);assert(r.ok);assert.equal(r.events.length,3);assert.equal(r.duration,9);assert(r.directives.length);assert.equal(mischiefActions(w,bodies,player).length,0);assert(!actMischief(w,bodies,player,action.id).ok);
 w.time=181;const second=actMischief(w,bodies,player,action.id);assert(second.ok);assert.equal(second.effects.find(e=>e.type==='aura').value,0);assert.equal(second.effects.find(e=>e.type==='mischief').value,0);assert.doesNotThrow(()=>JSON.stringify(w));
}
const calm=actMischief(make(),bodies,player,'tuition-call'),w=make();w.districts.cp.tension=90;const tense=actMischief(w,bodies,player,'tuition-call');assert.equal(calm.effects.find(e=>e.type==='heat').value,0);assert.equal(tense.effects.find(e=>e.type==='heat').value,3);assert.notEqual(calm.events[1].line,tense.events[1].line);
assert(!actMischief(make(),bodies,{x:100,z:100},'tuition-call').ok);assert.equal(mischiefActions({...make(),finished:true},bodies,player).length,0);
console.log('PASS six local improvisations, sight/presence gates, mood variations, cooldown, non-farming, serializable receipts');

assert.equal(rawActions(make(),bodies,player).length,0,'missing visibility callback fails closed');
for(const key of ['sceneTarget','follow','incidentOwned','crisisOwned'])assert.equal(rawActions(make(),bodies.map(b=>({...b,[key]:true})),player,{canSee:()=>true}).length,0);
const receipt=actMischief(make(),[...bodies,{id:'player',...player}],player,'comic-chant');assert(!receipt.witnessIds.includes('player'));assert(!receipt.directives.some(d=>d.actorId==='player'));assert.equal(receipt.type,'mischief-comic-chant');assert.equal(receipt.time,0);assert.deepEqual(receipt.position,player);assert(receipt.id.startsWith('mischief-0-'));
