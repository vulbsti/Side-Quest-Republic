/** Fixed simulation time; presentation remains once per rendered frame.
 * feed(seconds, step) preserves 15–60fps elapsed time, bounds stall catchup,
 * and records discarded time explicitly instead of silently slowing play.
 */
export class FrameClock{
 constructor({hz=60,maxFrame=.25,maxSteps=15}={}){if(hz<=0||maxFrame<=0||maxSteps<1)throw Error('Invalid clock configuration');this.fixed=1/hz;this.maxFrame=maxFrame;this.maxSteps=maxSteps;this.reset();}
 reset(){this.accumulator=0;this.simulated=0;this.dropped=0;this.frames=0;this.steps=0;this.emaMs=16.67;this.samples=[];}
 feed(seconds,step,{paused=false}={}){if(!Number.isFinite(seconds)||seconds<0)return {steps:0,alpha:0,accepted:0,dropped:0};if(paused){this.accumulator=0;return {steps:0,alpha:0,accepted:0,dropped:0};}
 this.frames++;this.emaMs=this.emaMs*.9+seconds*1000*.1;this.samples.push(seconds*1000);if(this.samples.length>120)this.samples.shift();const accepted=Math.min(seconds,this.maxFrame);let dropped=seconds-accepted;this.accumulator+=accepted;let count=0;
 while(this.accumulator+1e-10>=this.fixed&&count<this.maxSteps){const keepGoing=step(this.fixed);this.accumulator=Math.max(0,this.accumulator-this.fixed);this.simulated+=this.fixed;this.steps++;count++;if(keepGoing===false){this.accumulator=0;break;}}
 if(this.accumulator>=this.fixed){const excess=Math.floor(this.accumulator/this.fixed)*this.fixed;this.accumulator-=excess;dropped+=excess;}this.dropped+=dropped;return {steps:count,alpha:this.accumulator/this.fixed,accepted,dropped};}
 telemetry(){const sorted=[...this.samples].sort((a,b)=>a-b);return {fps:1000/this.emaMs,p95Ms:sorted[Math.min(sorted.length-1,Math.floor(sorted.length*.95))]||0,frames:this.frames,steps:this.steps,simulatedSeconds:this.simulated,droppedSeconds:this.dropped};}
}
/** Culling/throttling decision only: physics must keep updating offscreen actors. */
export function animationInterval(distance,visible=true,important=false){return important?0:!visible?.25:distance>45?.15:distance>25?.08:0;}
