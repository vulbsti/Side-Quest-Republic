import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('./dist/social.js',import.meta.url),'utf8');
const {createSocialState,socialInteraction,socialCatalogue}=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const state=createSocialState();
const first=socialInteraction(state,'compliment',{time:0});
assert.equal(first.heat,0); assert.equal(first.rizz,8); assert.equal(first.mood,'amused');
const second=socialInteraction(state,'compliment',{time:1});
assert.ok(second.aura<first.aura); assert.equal(second.rizz,0); assert.equal(second.mood,'watchful');
const third=socialInteraction(state,'compliment',{time:2});
assert.equal(third.mood,'firm'); assert.equal(state.cooldownUntil,14);
const fourth=socialInteraction(state,'compliment',{time:3});
assert.equal(fourth.heat,3); assert.equal(fourth.aura,0);
const switchBit=socialInteraction(state,'career',{time:4});
assert.equal(switchBit.aura,0,'switching joke must not bypass officer cooldown');
const rested=socialInteraction(state,'compliment',{time:40});
assert.equal(rested.rizz,8,'a long break restores a fresh exchange');
for(const crowd of [0,9]) {
  const r=socialInteraction(createSocialState(),'slogan',{crowd,temper:95});
  assert.equal(r.heat,0); assert.equal(r.aura,0); assert.match(r.title,/crowd/);
}
const chant=socialInteraction(createSocialState(),'slogan',{crowd:10,temper:80});
assert.equal(chant.aura,10); assert.equal(chant.heat,25); assert.equal(chant.mood,'watchful');
assert.ok(chant.detail.includes('Pause'));
const chantState=createSocialState();
socialInteraction(chantState,'slogan',{crowd:10,time:0});
const echo=socialInteraction(chantState,'slogan',{crowd:10,time:1});
assert.equal(echo.aura,0); assert.equal(echo.heat,0);
assert.equal(socialInteraction(createSocialState(),'career',{temper:100}).heat,0);
assert.equal(socialCatalogue.tuition.provenance,'userunverified');
assert.equal(socialCatalogue.water.provenance,'reportinspired');
assert.throws(()=>socialInteraction(createSocialState(),'missing'),RangeError);
assert.throws(()=>socialInteraction(createSocialState(),'water',{time:NaN}),TypeError);
const a=createSocialState(),b=createSocialState();
for(const [id,time] of [['water',0],['friends',1],['water',2],['water',3]]) {
  assert.deepEqual(socialInteraction(a,id,{time}),socialInteraction(b,id,{time}));
}
assert.deepEqual(a,b,'identical inputs produce identical state');
console.log('Social interaction tests passed');
