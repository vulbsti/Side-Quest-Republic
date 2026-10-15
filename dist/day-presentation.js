/** Original procedural scene accompaniment. No sampled voices or licensed reels.
 * Uses the existing Soundtrack context/master so mute and pause remain unified.
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
  constructor(soundtrack,{enabled=false}={}){this.soundtrack=soundtrack;this.enabled=enabled;this.paused=false;this.scene=null;this.elapsed=0;this.phase=null;this.mood='playful';this.ambientClock=0;this.nodes=new Set();this.bus=null;this.context=null;this.disposed=false;}
  ready(){
    const s=this.soundtrack,c=s?.ctx;
    if(this.disposed||!this.enabled||this.paused||s?.paused||s?.muted||!c||c.state!=='running')return false;
    if(this.context!==c){this.bus?.disconnect();this.context=c;this.bus=c.createGain();this.bus.gain.value=.58;this.bus.connect(s.effects||s.master||c.destination);}
    return true;
  }
  track(node){this.nodes.add(node);node.onended=()=>{this.nodes.delete(node);try{node.disconnect();}catch{}};return node;}
  note(midi,delay,duration,volume=.04,pan=0,type='sine'){
    if(!this.ready())return;
    const c=this.context,t=c.currentTime+delay+.01,o=this.track(c.createOscillator()),g=c.createGain(),p=c.createStereoPanner();
    o.type=type;o.frequency.value=440*2**((midi-69)/12);p.pan.value=clamp(pan,-1,1);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.035);g.gain.exponentialRampToValueAtTime(.0001,t+duration);
    o.connect(g);g.connect(p);p.connect(this.bus);o.start(t);o.stop(t+duration+.03);
    o.onended=()=>{this.nodes.delete(o);o.disconnect();g.disconnect();p.disconnect();};
  }
  breath(pan,volume,duration=.7){
    if(!this.ready()||!this.soundtrack.noise)return;
    const c=this.context,t=c.currentTime+.01,n=this.track(c.createBufferSource()),f=c.createBiquadFilter(),g=c.createGain(),p=c.createStereoPanner();
    n.buffer=this.soundtrack.noise;n.loop=true;f.type='bandpass';f.frequency.value=520;f.Q.value=1.4;p.pan.value=clamp(pan,-1,1);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.15);g.gain.exponentialRampToValueAtTime(.0001,t+duration);
    n.connect(f);f.connect(g);g.connect(p);p.connect(this.bus);n.start(t);n.stop(t+duration+.03);
    n.onended=()=>{this.nodes.delete(n);n.disconnect();f.disconnect();g.disconnect();p.disconnect();};
  }
  cue(mood,pan=0){
    // Original tiny motifs: bright hesitation, unresolved interval, or falling release.
    const phrases={playful:[[74,0,.16],[81,.19,.2],[77,.45,.28]],uneasy:[[62,0,.55],[69,.29,.5]],tense:[[50,0,.7],[51,.2,.5]],climax:[[38,0,.8],[50,.18,.6],[57,.45,.5]],quiet:[[62,0,.8]],reflective:[[69,0,.65],[65,.35,.7],[62,.7,.85]]};
    for(const[n,t,d]of phrases[mood]||phrases.reflective)this.note(n,t,d,mood==='climax'?.055:.035,pan,mood==='playful'?'triangle':'sine');
  }
  onScene(encounter,choice=null){
    if(this.disposed)return;
    this.stopNodes();
    this.scene={encounter,choice,duration:Math.max(2,Math.min(10,encounter?.presentation?.duration||7))};this.elapsed=0;
    this.cue(encounter?.presentation?.music||this.mood);
    return {caption:encounter?.presentation?.caption||encounter?.title||'',voiceAvailable:false,duration:this.scene.duration};
  }
  update(dt,state={},playerPos={x:0,z:0}){
    if(this.disposed||this.paused||this.soundtrack?.paused||!Number.isFinite(dt)||dt<0)return;
    dt=Math.min(dt,.25);this.elapsed+=dt;
    if(this.scene&&this.elapsed>=this.scene.duration)this.scene=null;
    this.mood=selectDayMood(state);
    if(this.phase!==state.phase){if(this.phase!==null)this.cue(this.mood);this.phase=state.phase;this.ambientClock=0;}
    this.ambientClock+=dt;
    const interval=this.mood==='playful'?10:this.mood==='climax'?6:13;
    if(this.ambientClock<interval||this.scene)return;
    this.ambientClock=0;
    const locations=Object.values(state.districts||{}).filter(d=>Number.isFinite(d.x)&&Number.isFinite(d.z));
    const nearest=locations.sort((a,b)=>Math.hypot(a.x-playerPos.x,a.z-playerPos.z)-Math.hypot(b.x-playerPos.x,b.z-playerPos.z))[0];
    if(!nearest)return;
    const distance=Math.hypot(nearest.x-playerPos.x,nearest.z-playerPos.z),pan=clamp((nearest.x-playerPos.x)/35,-.8,.8),attenuation=1/(1+distance*.07);
    // Abstract crowd swell, never presented as recorded human speech.
    this.breath(pan,.015*attenuation,.65);
    if((nearest.tension||0)>45){this.note(69,0,.28,.018*attenuation,pan);this.note(62,.33,.4,.014*attenuation,pan);}
  }
  getCameraFrame(elapsed=this.elapsed,location=this.scene?.encounter?.location,actorPos=location){
    if(!this.scene||this.paused)return null;
    return cinematicCameraFrame(elapsed,location,actorPos,this.scene.duration);
  }
  setPaused(value){this.paused=!!value;if(this.paused)this.stopNodes();}
  stopNodes(){for(const node of this.nodes){try{node.stop();}catch{}}this.nodes.clear();}
  dispose(){this.stopNodes();this.bus?.disconnect();this.bus=null;this.scene=null;this.disposed=true;}
}
