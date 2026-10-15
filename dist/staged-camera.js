/** Pure dialogue camera planning. Renderer owns smoothing; this returns a safe
 * desired frame or null when there is no collision-free intimate framing.
 * Yaw zero faces +Z, matching character models. Obstacles use base/h as bottom/top.
 */
const finite=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.z);
const point=p=>({x:p.x,y:p.y??0,z:p.z});
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
export function cameraSegmentClear(from,to,obstacles=[],radius=.18){
 for(const o of obstacles){if(![o.x,o.z,o.w,o.d,o.h].every(Number.isFinite))continue;const lo={x:o.x-o.w/2-radius,y:(o.base||0)-radius,z:o.z-o.d/2-radius},hi={x:o.x+o.w/2+radius,y:o.h+radius,z:o.z+o.d/2+radius};let enter=0,leave=1;
  for(const axis of ['x','y','z']){const delta=to[axis]-from[axis];if(Math.abs(delta)<1e-9){if(from[axis]<lo[axis]||from[axis]>hi[axis]){enter=2;break;}}else{const a=(lo[axis]-from[axis])/delta,b=(hi[axis]-from[axis])/delta;enter=Math.max(enter,Math.min(a,b));leave=Math.min(leave,Math.max(a,b));if(enter>leave)break;}}
  if(enter<=leave&&enter<=1&&leave>=0)return false;
 }return true;
}
export function stagedCameraFrame({player,cast=[],speakerId,listenerId,actorId,camera='speaker',phase='setup',obstacles=[],previous=null}={}){
 const actors=Array.isArray(cast)?cast:Object.values(cast);const visible=actors.filter(a=>finite(a)&&!a.hidden);const actor=visible.find(a=>a.id===speakerId)||visible.find(a=>a.id===actorId)||visible[0];
 const actualSpeaker=speakerId==='player'&&finite(player)?player:actor||player;if(!finite(actualSpeaker))return null;
 const defaultListener=actualSpeaker===player?(visible.find(a=>a.id===actorId)||actor):finite(player)?player:visible.find(a=>a!==actualSpeaker);
 const requestedListener=listenerId==='player'&&finite(player)?player:visible.find(a=>a.id===listenerId);
 const listener=requestedListener&&requestedListener!==actualSpeaker?requestedListener:defaultListener;
 const reaction=camera==='reaction'&&finite(listener)&&listener!==actualSpeaker;
 const speaker=reaction?listener:actualSpeaker;
 const other=reaction?actualSpeaker:defaultListener;
 const twoShot=phase==='choice'||camera==='two-shot'||camera==='wide';
 const focus=point(speaker);focus.y+=(speaker.height||1.8)*.76;
 if(twoShot&&finite(other)){focus.x=(speaker.x+other.x)/2;focus.z=(speaker.z+other.z)/2;focus.y=((speaker.y||0)+(other.y||0))/2+1.35;}
 let yaw=Number.isFinite(speaker.yaw)?speaker.yaw:finite(other)?Math.atan2(other.x-speaker.x,other.z-speaker.z):0;
 // A two-shot looks across the conversation line, showing both profiles.
 if(twoShot&&finite(other))yaw=Math.atan2(other.x-speaker.x,other.z-speaker.z)+Math.PI/2;
 const separation=finite(other)?Math.hypot(speaker.x-other.x,speaker.z-other.z):0;
 const desiredDistance=twoShot?Math.min(5.5,Math.max(3.2,separation*1.05)):2.65;
 const prior=previous?.position&&Number.isFinite(previous.position.y)?previous.position:null;
 const performers=[...new Set([...visible,player].filter(a=>finite(a)&&!a.hidden))];
 const lensClear=position=>performers.every(a=>Math.hypot(position.x-a.x,position.z-a.z)>=.65||position.y>(a.y||0)+(a.height||1.8)+.18||position.y<(a.y||0)-.18);
 const performerBounds=performers.map(a=>({x:a.x,z:a.z,w:.5,d:.45,base:a.y||0,h:(a.y||0)+(a.height||1.8)}));
 const choices=[];
 for(const angle of [0,.35,-.35,.7,-.7,1,-1,Math.PI/2,-Math.PI/2,Math.PI])for(const scale of [1,.78,.58])for(const elevation of [.15,.38]){
  const range=desiredDistance*scale,position={x:focus.x+Math.sin(yaw+angle)*range,y:focus.y+elevation,z:focus.z+Math.cos(yaw+angle)*range};
  if(!cameraSegmentClear(position,focus,obstacles)||!cameraSegmentClear(position,position,obstacles))continue;
  if(prior&&!cameraSegmentClear(prior,position,obstacles))continue;
  if(prior&&performerBounds.some(o=>cameraSegmentClear(prior,prior,[o],.1)&&!cameraSegmentClear(prior,position,[o],.1)))continue;
  // Never put the lens inside another performer. Static colliders are handled above.
  if(!lensClear(position))continue;
  const score=Math.abs(angle)*1.8+(1-scale)*2+elevation*.2+(prior?dist(prior,position)*.22:0);
  choices.push({position,lookAt:focus,shot:twoShot?'two-shot':reaction?'reaction':'speaker',speakerId:actualSpeaker.id||'player',focusId:speaker.id||'player',score});
 }
 choices.sort((a,b)=>a.score-b.score);if(choices.length){const {score,...frame}=choices[0];return frame;}
 if(prior&&lensClear(prior)&&cameraSegmentClear(prior,focus,obstacles)&&cameraSegmentClear(prior,prior,obstacles))return {position:{...prior},lookAt:focus,shot:'hold',speakerId:actualSpeaker.id||'player',focusId:speaker.id||'player'};
 return null;
}
