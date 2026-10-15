import assert from 'node:assert/strict';
import {stagedCameraFrame,cameraSegmentClear} from './dist/staged-camera.js';
const player={id:'player',x:0,z:2,yaw:Math.PI},npc={id:'asha',x:0,z:0,yaw:0};
let frame=stagedCameraFrame({player,cast:[npc],actorId:'asha',speakerId:'asha'});assert(frame.position.z>npc.z,'camera sees speaker front');assert.equal(frame.shot,'speaker');
frame=stagedCameraFrame({player,cast:[npc],speakerId:'player'});assert(frame.position.z<player.z,'player speaking gets frontal camera');assert.equal(frame.speakerId,'player');
frame=stagedCameraFrame({player,cast:[npc],phase:'choice'});assert.equal(frame.shot,'two-shot');assert.equal(frame.lookAt.z,1);assert(Math.abs(frame.position.x)>2);
const wall={x:0,z:2.5,w:3,d:.2,h:3};frame=stagedCameraFrame({player,cast:[npc],obstacles:[wall]});assert(frame);assert(cameraSegmentClear(frame.position,frame.lookAt,[wall]));
const alley=[{x:-1.1,z:0,w:.2,d:12,h:3},{x:1.1,z:0,w:.2,d:12,h:3}];frame=stagedCameraFrame({player,cast:[npc],phase:'choice',obstacles:alley});assert(frame,'narrow alley has a nearer longitudinal framing');assert(cameraSegmentClear(frame.position,frame.lookAt,alley));assert(Math.abs(frame.position.x)<.83);
const prev={position:{x:0,y:1.6,z:-3}};frame=stagedCameraFrame({player,cast:[npc],previous:prev,obstacles:[{x:1.1,z:0,w:.2,d:2,h:3}]});assert(frame);assert(cameraSegmentClear(prev.position,frame.position,[{x:1.1,z:0,w:.2,d:2,h:3}]),'renderer smoothing segment cannot cross wall');
assert(stagedCameraFrame({player,cast:[],speakerId:'missing'}),'missing NPC safely falls back to player');assert.equal(stagedCameraFrame({cast:[]}),null);assert.equal(stagedCameraFrame({player,cast:[npc],obstacles:[{x:0,z:0,w:20,d:20,h:10}]}),null,'impossible room returns null rather than clipping');
assert(cameraSegmentClear({x:0,y:1.6,z:-2},{x:0,y:1.6,z:2},[{x:0,z:0,w:2,d:2,h:.7}]),'bench below eye line is not a wall');assert(!cameraSegmentClear({x:0,y:1.6,z:-2},{x:0,y:1.6,z:2},[{x:0,z:0,w:2,d:.1,h:3}]),'thin wall blocks swept camera');
console.log('PASS: frontal NPC/player, choice two-shot, blocked wall, narrow alley, collision-safe smoothing, missing actors and impossible-frame fallback');
// Reaction frames the listener, while retaining who is actually speaking.
let reaction=stagedCameraFrame({player,cast:[npc],speakerId:'asha',actorId:'asha',camera:'reaction'});assert.equal(reaction.lookAt.z,player.z);assert.equal(reaction.focusId,'player');assert.equal(reaction.speakerId,'asha');assert.equal(reaction.shot,'reaction');
reaction=stagedCameraFrame({player,cast:[npc],speakerId:'player',actorId:'asha',camera:'reaction'});assert.equal(reaction.lookAt.z,npc.z);assert.equal(reaction.focusId,'asha');assert.equal(reaction.speakerId,'player');
const listener={id:'ravi',x:4,z:1,yaw:-Math.PI/2};reaction=stagedCameraFrame({player,cast:[npc,listener],speakerId:'asha',actorId:'asha',listenerId:'ravi',camera:'reaction'});assert.equal(reaction.focusId,'ravi');assert.equal(reaction.lookAt.x,4);
reaction=stagedCameraFrame({player,cast:[npc],speakerId:'asha',listenerId:'missing',camera:'reaction'});assert.equal(reaction.focusId,'player','missing explicit listener falls back gracefully');
reaction=stagedCameraFrame({cast:[npc],speakerId:'asha',camera:'reaction'});assert.equal(reaction.focusId,'asha');assert.equal(reaction.shot,'speaker','no listener uses speaker shot rather than fake reaction');
console.log('PASS: reaction listeners, explicit third actor, preserved speaker metadata and absent-listener fallbacks');

// Every visible cast body matters, even when neither speaking nor reacting.
const lead={id:'officer',x:0,z:0,yaw:0},sidePlayer={id:'player',x:2,z:0};
const baseline=stagedCameraFrame({player:sidePlayer,cast:[lead],speakerId:'officer'});
const third={id:'third',x:baseline.position.x,z:baseline.position.z};
const avoidThird=stagedCameraFrame({player:sidePlayer,cast:[lead,third],speakerId:'officer'});
assert(avoidThird);assert(Math.hypot(avoidThird.position.x-third.x,avoidThird.position.z-third.z)>=.65,'lens cannot enter non-speaking cast member');
assert.deepEqual(stagedCameraFrame({player:sidePlayer,cast:[lead,{...third,hidden:true}],speakerId:'officer'}),baseline,'hidden cast does not block the lens');
const priorThird={position:{x:-3,y:1.6,z:3}};
const unblocked=stagedCameraFrame({player:sidePlayer,cast:[lead],speakerId:'officer',previous:priorThird});
const crossing={id:'crossing',x:(priorThird.position.x+unblocked.position.x)/2,z:(priorThird.position.z+unblocked.position.z)/2};
const avoided=stagedCameraFrame({player:sidePlayer,cast:[lead,crossing],speakerId:'officer',previous:priorThird});
assert(avoided);assert(cameraSegmentClear(priorThird.position,avoided.position,[{x:crossing.x,z:crossing.z,w:.5,d:.45,base:0,h:1.8}],.1),'camera smoothing cannot cross a third performer');
const hiddenFrame=stagedCameraFrame({player:sidePlayer,cast:[lead,{...third,hidden:true}],speakerId:'officer',previous:{position:baseline.position}});assert(hiddenFrame);
console.log('PASS: all visible cast exclude lens and swept camera motion, hidden cast ignored');
