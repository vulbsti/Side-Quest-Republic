import assert from 'node:assert/strict';
import {DayClient} from './dist/day-client.js';
const old={id:'old',location:{x:0,z:0},title:'Old'},next={id:'next',location:{x:30,z:0},title:'Next'};
function fixture(){let active=[old,next],distance=20,target=null,releases=0,clears=0;const c=Object.create(DayClient.prototype);Object.assign(c,{state:{time:0},opened:false,available:()=>active,encounter:id=>active.find(e=>e.id===id),distance:()=>distance,hooks:{prepare:e=>target=e.id,walk(){},toast(){},castReady:()=>false,releaseScene:()=>{target=null;releases++;},clearRoute:()=>clears++}});return {c,get target(){return target;},get releases(){return releases;},get clears(){return clears;},set available(v){active=v;},set distance(v){distance=v;}};}
// Following reserves real cast; expiry releases it even if no scene panel opened.
const expired=fixture();expired.c.follow('old');assert.equal(expired.target,'old');expired.available=[next];expired.c.maintainCast();assert.equal(expired.target,null);assert.equal(expired.c.following,null);assert.equal(expired.clears,1);expired.c.maintainCast();assert.equal(expired.releases,1,'expiry release is idempotent');
// A nearby V request also reserves cast without a route/follow identifier.
const waiting=fixture();waiting.distance=3;waiting.c.begin('old');assert.equal(waiting.target,'old');waiting.available=[next];waiting.c.maintainCast();assert.equal(waiting.target,null,'expiry releases a nearby waiting cast');
// Turning away midway or walking away after arrival cancels the reservation.
const away=fixture();away.c.follow('old');away.distance=13;away.c.maintainCast();assert.equal(away.target,'old');away.distance=26;away.c.maintainCast();assert.equal(away.target,null);
const arrived=fixture();arrived.c.follow('old');arrived.distance=6;arrived.c.maintainCast();arrived.distance=15;arrived.c.maintainCast();assert.equal(arrived.target,null);
// A replacement owns the new lease; old expiry must never release new cast.
const replaced=fixture();replaced.c.follow('old');replaced.c.follow('next');replaced.available=[next];replaced.c.maintainCast();assert.equal(replaced.target,'next');assert.equal(replaced.c.following,'next');
// Closing the old menu occurs before preparing the replacement cast.
for(const method of ['follow','begin']){const f=fixture();f.distance=3;f.c.opened=true;f.c.close=function(){this.releaseCast();this.opened=false;};f.c[method]('next');assert.equal(f.target,'next');assert.equal(f.c.castLease.id,'next');}
console.log('Cast lifecycle PASS: followed and nearby expiry, mid-route abandonment, post-arrival departure, idempotent release, replacement ownership and close-before-prepare.');
