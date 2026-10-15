/** Camera and mood projection only. Recorded audio is owned by the soundtrack.
 * No generated music, crowd imitation or synthetic voice fallback.
 */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=t=>t*t*(3-2*t);
const mix=(a,b,t)=>a+(b-a)*t;
const PHASE_MOODS={morning:'playful',arrival:'playful',midday:'uneasy',afternoon:'tense',pressure:'uneasy',rupture:'tense',crisis:'climax',evening:'tense',aftermath:'reflective'};
export function selectDayMood(state={}){
  if(state.finished||state.phase==='aftermath')return 'reflective';
  const districts=Object.values(state.districts||{});
  const tension=districts.length?Math.max(...districts.map(d=>Number(d.tension)||0)):0;
  if(tension>78)return 'climax';
  if(tension>50)return 'tense';
  return PHASE_MOODS[state.phase]||((state.time||0)<300?'playful':(state.time||0)<750?'uneasy':'tense');
}
/** Pure deterministic four-shot sequence. Returns null after the sequence. */
export function cinematicCameraFrame(elapsed,location={x:0,z:0},actorPos=location,duration=7){
  if(!Number.isFinite(elapsed)||elapsed<0||elapsed>=duration||duration<=0)return null;
  const x=Number(actorPos?.x)||0,z=Number(actorPos?.z)||0,y=Number(actorPos?.y)||0;
  const lx=Number(location?.x)||0,lz=Number(location?.z)||0;
  const slots=[.30,.25,.25,.20],kinds=['street-wide','speaker-medium','listener-reaction','return-control'];
  let progress=elapsed/duration,index=0,start=0;
  while(index<3&&progress>=start+slots[index]){start+=slots[index];index++;}
  const t=smooth(clamp((progress-start)/slots[index],0,1));
  // The camera is intentionally offset from the actor; no detached random orbit.
  const poses=[
    [{x:lx+8,y:y+5.5,z:lz+10},{x:lx+6.8,y:y+4.5,z:lz+8.8}],
    [{x:x+2.7,y:y+2.0,z:z+3.4},{x:x+2.35,y:y+1.9,z:z+3.05}],
    [{x:lx-2.8,y:y+1.8,z:lz+2.8},{x:lx-2.5,y:y+1.8,z:lz+2.6}],
    [{x:lx+3.5,y:y+3.2,z:lz+5.5},{x:lx+5,y:y+4.3,z:lz+7.5}]
  ];
  const [a,b]=poses[index];
  return {kind:kinds[index],index,progress:t,position:{x:mix(a.x,b.x,t),y:mix(a.y,b.y,t),z:mix(a.z,b.z,t)},lookAt:{x:mix(lx,x,index===0?.4:1),y:y+1.35,z:mix(lz,z,index===0?.4:1)},finished:false};
}
export class DayPresentation{
  constructor(soundtrack){this.soundtrack=soundtrack;this.paused=false;this.scene=null;this.elapsed=0;this.phase=null;this.mood='playful';this.disposed=false;}
  onScene(encounter,choice=null){
    if(this.disposed)return;
    this.stopNodes();
    this.scene={encounter,choice,duration:Math.max(2,Math.min(10,encounter?.presentation?.duration||7))};this.elapsed=0;
    return {caption:encounter?.presentation?.caption||encounter?.title||'',voiceAvailable:false,duration:this.scene.duration};
  }
  update(dt,state={},playerPos={x:0,z:0}){
    if(this.disposed||this.paused||this.soundtrack?.paused||!Number.isFinite(dt)||dt<0)return;
    dt=Math.min(dt,.25);this.elapsed+=dt;
    if(this.scene&&this.elapsed>=this.scene.duration)this.scene=null;
    this.mood=selectDayMood(state);
    this.phase=state.phase;
  }
  getCameraFrame(elapsed=this.elapsed,location=this.scene?.encounter?.location,actorPos=location){
    if(!this.scene||this.paused)return null;
    return cinematicCameraFrame(elapsed,location,actorPos,this.scene.duration);
  }
  setPaused(value){this.paused=!!value;if(this.paused)this.stopNodes();}
  stopNodes(){} // Compatibility with the presentation lifecycle; this class owns no audio nodes.
  dispose(){this.stopNodes();this.scene=null;this.disposed=true;}
}
