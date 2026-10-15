/** Local, non-authoritative presentation of a physical crowd wave.
 * Never changes controls, actor positions, camera yaw or story state. Feed only
 * fresh events (duplicate ids are ignored), actual bodies, and geometry LOS.
 * Camera offsets are advisory: renderer must collision-check before applying.
 */
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const finite=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.z);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const labels={warning:'Police line forming',advance:'The line is moving',scatter:'People are breaking away',regroup:'Friends are regrouping'};
export class CrisisPresentation {
 constructor(){this.reset();}
 reset(){this.seen=new Set();this.intensity=0;this.pulse=0;this.clock=0;this.cue=null;}
 update({dt=0,player,cameraYaw=0,crisis,bodies=[],events=[],canSee,reducedMotion=false,enabled=true}={}){
  const step=clamp(Number(dt)||0,0,.1);this.clock+=step;
  const sees=p=>finite(player)&&finite(p)&&typeof canSee==='function'&&canSee(player,p)===true;
  const noticed=[];
  // Consume even invisible events; crossing the map later must not replay them.
  for(const e of events){if(!e?.id||this.seen.has(e.id))continue;this.seen.add(e.id);if(this.seen.size>256)this.seen.delete(this.seen.values().next().value);
   if(!enabled||!sees(e.position)||distance(player,e.position)>24)continue;
   const stage=e.type?.replace('crisis-','');if(!labels[stage]&&stage!=='player-contact')continue;
   const freshness=Number.isFinite(crisis?.time)&&Number.isFinite(e.time)?crisis.time-e.time:0;if(freshness>2||freshness<0)continue;
   const cue={id:e.id,label:stage==='player-contact'?'Keep your footing':labels[stage],position:{...e.position},ttl:stage==='player-contact'?1.2:3,stage};
   this.cue=cue;noticed.push({...cue});if(stage==='player-contact'&&distance(player,e.position)<2)this.pulse=.45;
  }
  if(!enabled){this.intensity=0;this.pulse=0;this.cue=null;return this.output(0,0,null,noticed);}
  const active=['warning','advance','scatter','regroup'].includes(crisis?.status);
  const ids=new Set([...(crisis?.policeIds||[]),...(crisis?.civilianIds||[])]);
  const nearby=active?bodies.filter(b=>!b.hidden&&ids.has(b.id)&&finite(b)&&distance(player||{},b)<22&&sees(b)):[];
  const nearest=nearby.reduce((best,b)=>!best||distance(player,b)<distance(player,best)?b:best,null);
  const weight={warning:.22,advance:1,scatter:.8,regroup:.15}[crisis?.status]||0;
  const target=nearest?weight*clamp((22-distance(player,nearest))/16):0;
  this.intensity+=(target-this.intensity)*(1-Math.exp(-step*(target>this.intensity?4:2)));
  this.pulse=Math.max(0,this.pulse-step);
  if(this.cue){this.cue.ttl-=step;if(this.cue.ttl<=0||!sees(this.cue.position)||distance(player,this.cue.position)>26)this.cue=null;}
  let cue=null;if(this.cue){const p=this.cue.position,dx=p.x-player.x,dz=p.z-player.z,yaw=Number.isFinite(cameraYaw)?cameraYaw:0;
   // Same horizontal basis as game movement: right=(cos(yaw),-sin(yaw)).
   const right=dx*Math.cos(yaw)-dz*Math.sin(yaw),forward=-dx*Math.sin(yaw)-dz*Math.cos(yaw);
   cue={...this.cue,bearing:Math.atan2(right,forward),distance:Math.hypot(dx,dz),direction:Math.abs(right)>Math.abs(forward)?right>0?'right':'left':forward>0?'ahead':'behind'};
  }
  // No camera animation at all with reduced motion. Only a short 2.5 cm contact
  // dip otherwise; no ambient random shake and no player-facing yaw takeover.
  const offsetY=reducedMotion||this.pulse===0?0:-.025*Math.sin(Math.PI*clamp(this.pulse/.45));
  return this.output(reducedMotion?0:this.intensity*2.5,offsetY,cue,noticed);
 }
 output(fovDelta,offsetY,cue,events){return {intensity:this.intensity,fovDelta,offset:{x:0,y:offsetY,z:0},cue,events};}
}
