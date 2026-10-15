/** Warm the actual scene before handing controls to the player.
 * No simulation tick, clock advance, camera move, material substitution or
 * quality reduction occurs here. First draw also uploads textures/bone buffers
 * and compiles shadow variants which Three.compileAsync alone does not cover.
 */
export async function warmupRenderer({renderer,scene,camera,onProgress=()=>{},timeoutMs=90000,
 yieldFrame=()=>new Promise(resolve=>requestAnimationFrame(()=>resolve())),
 now=()=>performance.now(),setTimer=setTimeout,clearTimer=clearTimeout}={}){
 if(!renderer||!scene||!camera||typeof renderer.render!=='function')throw new TypeError('A renderer, scene and camera are required for warmup.');
 if(!Number.isFinite(timeoutMs)||timeoutMs<=0)throw new RangeError('Warmup timeout must be positive.');
 let timer=null,lost=false;
 const canvas=renderer.domElement,onLost=()=>{lost=true;};canvas?.addEventListener?.('webglcontextlost',onLost);
 const report={compiled:false,drawn:false,parallelCompile:!!renderer.extensions?.has?.('KHR_parallel_shader_compile'),compileMs:0,drawMs:0};
 try{
  onProgress('Preparing materials and character lighting…');
  // Two frames allow the loading message to be painted before costly driver work.
  await yieldFrame();await yieldFrame();
  const start=now();
  if(typeof renderer.compileAsync==='function'){
   const deadline=new Promise((_,reject)=>{timer=setTimer(()=>reject(new Error('Material preparation timed out. Reload to retry; the afternoon has not started.')),timeoutMs);});
   await Promise.race([renderer.compileAsync(scene,camera),deadline]);
   clearTimer(timer);timer=null;report.compiled=true;
  }else if(typeof renderer.compile==='function'){renderer.compile(scene,camera);report.compiled=true;}
  if(lost)throw new Error('The graphics context was lost while preparing materials.');
  report.compileMs=Math.max(0,now()-start);
  onProgress('Preparing street shadows and the first view…');await yieldFrame();await yieldFrame();
  const drawStart=now();renderer.render(scene,camera);report.drawMs=Math.max(0,now()-drawStart);report.drawn=true;
  if(lost)throw new Error('The graphics context was lost while preparing the first view.');
  onProgress('The street is ready.');await yieldFrame();
  return report;
 }finally{if(timer!==null)clearTimer(timer);canvas?.removeEventListener?.('webglcontextlost',onLost);}
}
// WebGL render is synchronous and cannot be safely interrupted mid-driver-call.
// timeoutMs bounds asynchronous compilation waiting, not synchronous driver work.
// Keeping the loading overlay visible avoids starting a day during that work.
