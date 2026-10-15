import {CROWD_CAPACITY} from './escalation-staging.js?v=23';
import {findPath,nearestFreePoint,dist} from './simulation.js?v=23';
/** Bounded physical crowd routing. Caller owns steering/collision and rendering.
 * Only hidden bodies may be placed at an entry. Visible bodies never teleport.
 * Call update once per simulation second before NPC steering; do not overwrite
 * managed dayTarget/hidden from the old time-only arrival counter.
 */
export const CROWD_GATEWAYS=Object.freeze([{x:-82,z:-73},{x:82,z:-73},{x:-82,z:88},{x:82,z:88},{x:0,z:97}]);
export function crowdEntryPace(state={}){const stage=state.escalation?.stage||state.phase;if(['confrontation','rupture'].includes(stage))return {batch:3,interval:1};if(['assembly','contested','midday','afternoon'].includes(stage))return {batch:2,interval:1};if(['recovery','evening'].includes(stage))return {batch:1,interval:2};if(stage==='arrivals')return {batch:1,interval:2};return {batch:1,interval:3};}
const hash=s=>[...String(s)].reduce((h,c)=>(Math.imul(h,31)+c.charCodeAt(0))>>>0,17);
export class CrowdFlow{
 constructor({obstacles=[],districts=[],gateways=CROWD_GATEWAYS,maxActors=CROWD_CAPACITY,seed=15426}={}){this.obstacles=obstacles;this.districts=districts;this.maxActors=Math.max(0,Math.min(CROWD_CAPACITY,maxActors));this.seed=seed;this.entries=new Map();this.nextSpawnAt=0;this.gateways=gateways.map(g=>nearestFreePoint(g,obstacles,{radius:.5,maxRadius:5})).filter(Boolean);}
 update({bodies=[],state={},player={x:0,z:0},isVisible=()=>false,directives={},desiredCount}={}){
  const candidates=bodies.filter(b=>b.dayArrival).slice(0,this.maxActors),time=Number(state.time)||0;
  const unseen=p=>dist(p,player)>24&&!isVisible(p);
  for(const body of candidates)if(!this.entries.has(body.id)){body.crowdManaged=true;this.entries.set(body.id,{status:body.hidden===false?'present':'waiting',district:null,target:{x:body.x,z:body.z}});}
  // Explicit recruitment/follow/scene ownership outranks ambient crowd routing.
  for(const body of candidates){const e=this.entries.get(body.id),engaged=body.follow||body.recruited||body.sceneTarget||body.incidentOrder;if(engaged){if(e.status!=='engaged'&&body.dayTarget===e.target){body.dayTarget=null;body.dayPath=null;}e.status='engaged';body.crowdObjective=null;body.crowdSpeed=null;}else if(e.status==='engaged'){e.status=body.hidden?'waiting':'present';e.target={x:body.x,z:body.z};e.directive=false;e.retryAt=0;e.reconsiderAt=0;}}
  const pool=candidates.filter(b=>this.entries.get(b.id).status!=='engaged');
  const weights=this.districts.map(d=>({d,weight:Math.max(0,Number(state.districts?.[d.id]?.density)||0)*Math.max(.05,Math.min(1,(state.districts?.[d.id]?.access??100)/100))}));
  const dispersing=!!state.flags?.dispersal||state.phase==='aftermath';
  const wanted=dispersing?0:Math.min(pool.length,Number.isFinite(desiredCount)?Math.max(0,Math.round(desiredCount)):Math.min(Math.floor(time/20),Math.round(weights.reduce((s,w)=>s+w.weight,0)/4)));
  const directiveFor=body=>{const d=directives instanceof Map?directives.get(body.id):directives[body.id];return d&&Number.isFinite(d.target?.x)&&Number.isFinite(d.target?.z)?d:null;};
  const rankedDistricts=()=>weights.filter(w=>w.weight>0).map(w=>({...w,count:pool.filter(b=>['arriving','present'].includes(this.entries.get(b.id).status)&&this.entries.get(b.id).district===w.d.id).length})).sort((a,b)=>b.weight/(b.count+1)-a.weight/(a.count+1)||a.d.id.localeCompare(b.d.id));
  const districtTarget=(body,d)=>{const n=hash(body.id+this.seed),angle=(n%628)/100,radius=3+(n%4);return nearestFreePoint({x:d.x+Math.cos(angle)*radius,z:d.z+Math.sin(angle)*radius},this.obstacles,{radius:.55,maxRadius:6});};
  // Existing actors respond through the same physical route as new arrivals.
  // Bound expensive replans and rotate ownership so later IDs cannot starve.
  let routeBudget=2;this.routeCursor=this.routeCursor||0;
  for(let offset=0;offset<pool.length;offset++){const index=(this.routeCursor+offset)%pool.length,body=pool[index],e=this.entries.get(body.id),directive=directiveFor(body);
   if(!['arriving','present'].includes(e.status)||dispersing)continue;
   const released=!!e.directive&&!directive;
   if(!directive){body.crowdObjective=null;body.crowdSpeed=null;}
   if(time<(e.retryAt||0))continue;
   let target,district;
   if(directive){target=nearestFreePoint(directive.target,this.obstacles,{radius:.55,maxRadius:6});district=directive.district??e.district;body.crowdObjective=directive.activity||'gather';body.crowdSpeed=Number.isFinite(directive.speed)?Math.max(.2,Math.min(5,directive.speed)):null;
    if(e.directive&&dist(directive.target,e.directiveTarget)<2&&district===e.district)continue;
   }else{if(!released&&time<(e.reconsiderAt||0))continue;const best=rankedDistricts()[0];e.reconsiderAt=time+12;if(!best)continue;district=best.d.id;const current=weights.find(w=>w.d.id===e.district);if(!released&&district===e.district)continue;if(!released&&current&&best.weight/(best.count+1)<=current.weight/Math.max(1,pool.filter(b=>this.entries.get(b.id).district===e.district).length)*1.4)continue;target=districtTarget(body,best.d);}
   if(!target||!routeBudget)continue;routeBudget--;this.nextRouteCursor=(index+1)%pool.length;
   const path=findPath(body,target,this.obstacles);e.retryAt=time+5;if(!path.length)continue;
   e.target={...target};e.district=district;e.directive=!!directive;e.directiveTarget=directive?{...directive.target}:null;e.status='arriving';body.dayTarget=e.target;body.dayPath=path;
  }
  if(this.nextRouteCursor!==undefined)this.routeCursor=this.nextRouteCursor;
  const active=pool.filter(b=>['arriving','present'].includes(this.entries.get(b.id).status));
  // Reduced density also causes departures. No deletion at the destination.
  for(const body of active.slice(wanted,wanted+2)){const entry=this.entries.get(body.id);const exits=[...this.gateways].sort((a,b)=>(unseen(a)?0:1)-(unseen(b)?0:1)||dist(body,a)-dist(body,b));for(const gate of exits){const path=findPath(body,gate,this.obstacles);if(!path.length)continue;entry.status='departing';entry.directive=false;body.crowdObjective=null;body.crowdSpeed=null;entry.target={...gate};body.dayPath=path;body.dayTarget=entry.target;break;}}
  for(const body of pool){const entry=this.entries.get(body.id);if(entry.status==='waiting'||entry.status==='departed')continue;body.hidden=false;body.dayTarget=entry.target;if(entry.status==='arriving'&&dist(body,entry.target)<1.2)entry.status='present';if(entry.status==='departing'&&dist(body,entry.target)<1.2&&unseen(body)){body.hidden=true;body.dayTarget=null;body.dayPath=null;body.speed=0;entry.status='departed';}}
  // Phase-paced entries still require unobserved, unoccupied physical gateways.
  // A maximum of four entry path attempts avoids a crowd burst monopolising a frame.
  const live=pool.filter(b=>['arriving','present'].includes(this.entries.get(b.id).status));
  if(!dispersing&&live.length<wanted&&time>=this.nextSpawnAt){
   const pace=crowdEntryPace(state);let entryRoutes=4;
   for(let entered=0;entered<pace.batch&&live.length+entered<wanted&&entryRoutes>0;entered++){
   const body=pool.find(b=>['waiting','departed'].includes(this.entries.get(b.id).status));
   if(body){const directive=directiveFor(body),ranked=directive?[{d:{id:directive.district}}]:rankedDistricts();
    for(const {d}of ranked){const target=directive?nearestFreePoint(directive.target,this.obstacles,{radius:.55,maxRadius:6}):districtTarget(body,d);if(!target)continue;
     const gates=this.gateways.filter(g=>unseen(g)&&!bodies.some(b=>!b.hidden&&dist(b,g)<1.3)).sort((a,b)=>dist(a,target)-dist(b,target));let placed=false;
     for(const gate of gates){if(entryRoutes--<=0)break;const path=findPath(gate,target,this.obstacles);if(!path.length)continue;Object.assign(body,{x:gate.x,z:gate.z,y:0,hidden:false,dayTarget:target,dayPath:path,speed:0});const e=this.entries.get(body.id);Object.assign(e,{status:'arriving',district:d.id,target,directive:!!directive,directiveTarget:directive?{...directive.target}:null});body.crowdObjective=directive?.activity||null;body.crowdSpeed=Number.isFinite(directive?.speed)?Math.max(.2,Math.min(5,directive.speed)):null;this.nextSpawnAt=time+pace.interval;placed=true;break;}if(placed)break;
    }
   }
   }
  }
  return {wanted,dispersing,counts:this.counts()};
 }
 counts(){const result={waiting:0,arriving:0,present:0,departing:0,departed:0,engaged:0};for(const e of this.entries.values())result[e.status]++;return result;}
 inspect(id){const e=this.entries.get(id);return e?{...e,target:{...e.target}}:null;}
}
