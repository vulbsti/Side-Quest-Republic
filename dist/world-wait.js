/** Advance a wait through the exact same fixed physical step as ordinary play.
 * The caller owns pausing its regular animation-loop simulation during the wait.
 * No abstract story fast-forward, wall-clock accumulation or timer callbacks.
 * A sub-step remainder is deliberately not simulated: fixed-step physics stays
 * fixed and elapsed time never overshoots the requested duration.
 */
export async function advancePhysicalWait({seconds,step,fixed=1/60,yieldFrame,onProgress,isCancelled,batchSize=10}={}){
 if(!Number.isFinite(seconds)||seconds<0)throw new RangeError('seconds must be finite and non-negative');
 if(!Number.isFinite(fixed)||fixed<=0)throw new RangeError('fixed must be finite and positive');
 if(!Number.isInteger(batchSize)||batchSize<1||batchSize>60)throw new RangeError('batchSize must be an integer from 1 to 60');
 if(typeof step!=='function'||typeof yieldFrame!=='function')throw new TypeError('step and yieldFrame callbacks are required');
 const target=Math.max(0,Math.floor(seconds/fixed));let steps=0,reason='completed';
 const result=()=>({advanced:steps*fixed,steps,remaining:Math.max(0,seconds-steps*fixed),completed:reason==='completed'&&steps>=target,reason});
 while(steps<target){
  for(let n=0;n<batchSize&&steps<target;n++){
   if(isCancelled?.()){reason='cancelled';onProgress?.(result());return result();}
   // A false return means this physical step ended the playable world. That
   // completed step counts, but no additional simulation is attempted.
   const running=step(fixed);if(running&&typeof running.then==='function')throw new TypeError('step must be synchronous');
   steps++;if(running===false){reason='world-stopped';onProgress?.(result());return result();}
  }
  onProgress?.(result());
  if(steps<target)await yieldFrame();
 }
 if(!target)onProgress?.(result());
 return result();
}
