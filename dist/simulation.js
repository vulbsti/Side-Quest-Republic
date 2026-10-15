export const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,v));
export const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
// Feet are y; all bodies have a radius and standing height. Boxes have bottom/top.
export function overlapsXZ(e,o,r=e.radius??.36){
 const nx=clamp(e.x,o.x-o.w/2,o.x+o.w/2),nz=clamp(e.z,o.z-o.d/2,o.z+o.d/2);
 return Math.hypot(e.x-nx,e.z-nz)<r-.00001;
}
// Ground spawn recovery. Deterministic radial samples, nearest ring first;
// this is a bounded search, not a continuous geometric nearest-point solver.
export function nearestFreePoint(position,obstacles,{radius=.4,maxRadius=12}={}){
 if(!Number.isFinite(position?.x)||!Number.isFinite(position?.z)||!Number.isFinite(radius)||radius<0||!Number.isFinite(maxRadius)||maxRadius<0)return null;
 const legal=p=>p.x>=-47+radius&&p.x<=53-radius&&p.z>=-45+radius&&p.z<=57-radius;
 const free=p=>legal(p)&&!obstacles.some(o=>(o.h??0)>0&&(o.base||0)<1.8&&overlapsXZ(p,o,radius));
 const origin={x:position.x,z:position.z};
 if(free(origin))return origin;
 // Include the exact radius limit even when not divisible by the ring spacing.
 const step=.2,rings=Math.ceil(maxRadius/step);
 for(let ring=1;ring<=rings;ring++){
  const r=Math.min(maxRadius,ring*step),samples=Math.max(16,Math.ceil(2*Math.PI*r/.2));
  for(let index=0;index<samples;index++){
   const angle=index*2*Math.PI/samples;
   const p={x:origin.x+Math.cos(angle)*r,z:origin.z+Math.sin(angle)*r};
   if(free(p))return p;
  }
 }
 return null;
}
export function moveWithCollisions(entity,dx,dz,obstacles,radius=entity.radius??.36){
 const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.12));
 for(let i=0;i<steps;i++)for(const axis of ['x','z']){
  const delta=(axis==='x'?dx:dz)/steps;if(!delta)continue;
  const old=entity[axis];entity[axis]=clamp(old+delta,axis==='x'?-47:-45,axis==='x'?53:57);
  for(const o of obstacles){const feet=entity.y||0,top=o.h,bottom=o.base||0;
   if(feet>=top-.025||feet+(entity.height||1.8)<=bottom+.01)continue;
   if(overlapsXZ(entity,o,radius)){entity[axis]=old;break;}
  }
 }
 return entity;
}
export function supportHeight(entity,obstacles,ceiling=Infinity){
 let y=0;const r=(entity.radius??.36)*.65;
 for(const o of obstacles)if(o.walkable!==false&&o.h<=ceiling+.025&&overlapsXZ(entity,o,r))y=Math.max(y,o.h);
 return y;
}
export function verticalStep(entity,dt,obstacles,jump=false){
 const oldY=entity.y||0,ground=supportHeight(entity,obstacles,oldY);
 entity.grounded=Math.abs(oldY-ground)<.04&&(entity.vy||0)<=0;
 if(jump&&entity.grounded&&(entity.stamina??100)>10){entity.vy=7.6;entity.grounded=false;entity.stamina=(entity.stamina??100)-9;entity.jumpStarted=true;}
 else entity.jumpStarted=false;
 entity.vy=(entity.vy||0)-18*dt;
 let next=oldY+entity.vy*dt;
 if(entity.vy>0){for(const o of obstacles){const base=o.base||0;if(base>=oldY+(entity.height||1.8)-.00001&&base<=next+(entity.height||1.8)&&overlapsXZ(entity,o)){next=base-(entity.height||1.8);entity.vy=0;}}}
 const floor=supportHeight(entity,obstacles,oldY);
 entity.landed=false;
 if(next<=floor&&entity.vy<=0){entity.landed=entity.vy< -2;entity.impact=-entity.vy;next=floor;entity.vy=0;entity.grounded=true;}
 else entity.grounded=false;
 entity.y=Math.max(0,next);
}
// Iterative personal-space contacts; corrections also obey static collisions.
export function separateBodies(bodies,obstacles,iterations=5){
 const active=bodies.filter(b=>!b.hidden);
 for(let pass=0;pass<iterations;pass++)for(let i=0;i<active.length;i++)for(let j=i+1;j<active.length;j++){
  const a=active[i],b=active[j];if((a.y||0)>=(b.y||0)+(b.height||1.8)||(b.y||0)>=(a.y||0)+(a.height||1.8))continue;
  let dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz),min=(a.radius??.36)+(b.radius??.36);
  if(d>=min)continue;if(d<.0001){dx=(i%2?1:-1);dz=.3;d=Math.hypot(dx,dz);}
  const nx=dx/d,nz=dz/d,depth=min-Math.hypot(b.x-a.x,b.z-a.z)+.001;
  const wa=a.anchored?0:1,wb=b.anchored?0:1,sum=wa+wb;if(!sum)continue;
  const ax=a.x,az=a.z,bx=b.x,bz=b.z;
  moveWithCollisions(a,-nx*depth*wa/sum,-nz*depth*wa/sum,obstacles);
  moveWithCollisions(b,nx*depth*wb/sum,nz*depth*wb/sum,obstacles);
  // If a wall blocks one share, ask the other body to absorb the unused
  // displacement. Otherwise two touching bodies remain visibly intersecting.
  const movedA=(ax-a.x)*nx+(az-a.z)*nz,movedB=(b.x-bx)*nx+(b.z-bz)*nz;
  const missingA=Math.max(0,depth*wa/sum-movedA),missingB=Math.max(0,depth*wb/sum-movedB);
  if(wb&&missingA>.00001)moveWithCollisions(b,nx*missingA,nz*missingA,obstacles);
  if(wa&&missingB>.00001)moveWithCollisions(a,-nx*missingB,-nz*missingB,obstacles);
 }
}
export function visible(a,b,obstacles){const d=dist(a,b);for(let s=1;s<Math.ceil(d*2);s++){const t=s/Math.ceil(d*2),x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t;for(const o of obstacles)if(o.h>1.65&&x>o.x-o.w/2&&x<o.x+o.w/2&&z>o.z-o.d/2&&z<o.z+o.d/2)return false;}return true;}
export function steer(entity,target,speed,dt,obstacles){const d=dist(entity,target);if(d<.15)return 0;const old={x:entity.x,z:entity.z};const dx=(target.x-entity.x)/d,dz=(target.z-entity.z)/d;moveWithCollisions(entity,dx*speed*dt,dz*speed*dt,obstacles,.4);if(dist(old,entity)<speed*dt*.3){const side=entity.side||1;moveWithCollisions(entity,-dz*side*speed*dt,dx*side*speed*dt,obstacles,.4);entity.stuck=(entity.stuck||0)+dt;if(entity.stuck>1.1){entity.side=-side;entity.stuck=0;}}else entity.stuck=0;return dist(old,entity)/Math.max(dt,.001);}
export class Simulation{
constructor(obstacles=[]){this.obstacles=obstacles;this.reset();}
reset(){this.time=0;this.player={x:-7,z:34,y:0,vy:0,vx:0,vz:0,yaw:Math.PI,stamina:100,radius:.36,height:1.8,grounded:true};this.heat=0;this.aura=0;this.trust=0;this.mischief=0;this.noise=0;this.pursuit=false;this.catches=0;this.cooldown=0;this.chases=0;this.escaped=0;this.sprinting=false;this.distance=0;this.police=[{x:9,z:16,home:{x:9,z:16},state:'patrol',phase:0},{x:28,z:-7,home:{x:28,z:-7},state:'patrol',phase:2},{x:-12,z:-4,home:{x:-12,z:-4},state:'patrol',phase:4},{x:9,z:-30,home:{x:9,z:-30},state:'patrol',phase:6}].map((p,i)=>({...p,y:0,yaw:0,seen:0,search:0,speed:0,side:i%2?1:-1,last:{x:p.x,z:p.z}}));}
provoke(amount=20){this.heat=clamp(this.heat+amount);this.noise=4;}
step(dt,input={}){this.time+=dt;this.cooldown=Math.max(0,this.cooldown-dt);this.noise=Math.max(0,this.noise-dt);const p=this.player;let dx=input.x||0,dz=input.z||0,l=Math.hypot(dx,dz);if(l>1){dx/=l;dz/=l;}const moving=l>.05;this.sprinting=!!input.sprint&&p.stamina>2&&moving&&!input.heavy;const speed=this.sprinting?8.1:input.heavy?3.4:4.7;const damping=1-Math.exp(-dt*(moving?14:18));p.vx+=(dx*speed-p.vx)*damping;p.vz+=(dz*speed-p.vz)*damping;const old={x:p.x,z:p.z};moveWithCollisions(p,p.vx*dt,p.vz*dt,this.obstacles);this.distance+=dist(p,old);if(moving)p.yaw=Math.atan2(dx,dz);verticalStep(p,dt,this.obstacles,input.jump);p.stamina=clamp(p.stamina+(this.sprinting?-19:13)*dt);
let pursuit=false,caught=false;for(let i=0;i<this.police.length;i++){const cop=this.police[i],d=dist(cop,p);const line=d<21&&visible(cop,p,this.obstacles);const facing=Math.cos(Math.atan2(p.x-cop.x,p.z-cop.z)-cop.yaw)>.15;const detects=line&&(facing||d<4||this.noise>0)&&this.heat>16&&this.cooldown<=0;if(cop.state==='patrol'){const dest={x:cop.home.x+Math.sin(this.time*.16+cop.phase)*5,z:cop.home.z+Math.cos(this.time*.13+cop.phase)*4};cop.speed=steer(cop,dest,1.2,dt,this.obstacles);cop.yaw=Math.atan2(dest.x-cop.x,dest.z-cop.z);if(detects&&d<12){cop.state='notice';cop.seen=.05;}}
else if(cop.state==='notice'){cop.speed=0;cop.yaw=Math.atan2(p.x-cop.x,p.z-cop.z);cop.seen+=detects?dt*(this.heat>55?1.3:.7):-dt;if(cop.seen>1){cop.state='chase';cop.search=7;if(!this.pursuit)this.chases++;}else if(cop.seen<0)cop.state='patrol';}
else if(cop.state==='chase'){pursuit=true;if(line){cop.last={x:p.x,z:p.z};cop.search=6;}else cop.search-=dt;const dest=line?p:cop.last;cop.yaw=Math.atan2(dest.x-cop.x,dest.z-cop.z);cop.speed=steer(cop,dest,5.6+(this.heat>75?.45:0),dt,this.obstacles);if(d<.85&&p.y<.75&&this.cooldown<=0)caught=true;if(cop.search<=0||d>27){cop.state='search';cop.search=5;}}
else if(cop.state==='search'){if(detects){cop.state='chase';cop.search=6;}else{cop.search-=dt;const dest={x:cop.last.x+Math.sin(this.time*1.7)*3,z:cop.last.z+Math.cos(this.time)*3};cop.speed=steer(cop,dest,1.5,dt,this.obstacles);if(cop.search<=0)cop.state='patrol';}}
}
if(this.pursuit&&!pursuit&&!caught){this.escaped++;this.aura+=12;this.heat=Math.max(0,this.heat-16);}this.pursuit=pursuit;this.heat=clamp(this.heat-(pursuit?0:this.police.some(c=>c.state==='notice')?.05:1.3)*dt);if(caught){this.catches++;this.cooldown=12;this.heat=0;this.pursuit=false;for(const c of this.police){c.state='patrol';c.seen=0;}return 'caught';}return null;}
}
export function findPath(start,end,obstacles,step=2){const k=(x,z)=>x+','+z;const snap=n=>Math.round(n/step);const sx=snap(start.x),sz=snap(start.z),ex=snap(end.x),ez=snap(end.z);const blocked=(x,z)=>x*step< -46||x*step>50||z*step< -44||z*step>55||obstacles.some(o=>Math.abs(x*step-o.x)<o.w/2+.55&&Math.abs(z*step-o.z)<o.d/2+.55);if(blocked(ex,ez))return [];const open=[{x:sx,z:sz,g:0,f:0}],seen=new Map([[k(sx,sz),0]]),parents=new Map();let finish=null;for(let it=0;open.length&&it<3500;it++){open.sort((a,b)=>a.f-b.f);const n=open.shift();if(n.x===ex&&n.z===ez){finish=n;break;}for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){const x=n.x+dx,z=n.z+dz;if(blocked(x,z)||(dx&&dz&&(blocked(n.x+dx,n.z)||blocked(n.x,n.z+dz)))||[.25,.5,.75].some(t=>blocked(n.x+dx*t,n.z+dz*t)))continue;const g=n.g+Math.hypot(dx,dz),key=k(x,z);if(g>=(seen.get(key)??Infinity))continue;seen.set(key,g);parents.set(key,k(n.x,n.z));open.push({x,z,g,f:g+Math.hypot(ex-x,ez-z)});}}if(!finish)return [];let key=k(ex,ez),path=[];while(key!==k(sx,sz)){const [x,z]=key.split(',').map(Number);path.unshift({x:x*step,z:z*step});key=parents.get(key);if(!key)return [];}path.push({x:end.x,z:end.z});return path;}
