import {restoreDestinationState} from './destinations.js?v=24';
import {restoreTransit} from './transit.js?v=24';
import {WORLD_BOUNDS as B} from './districts.js?v=24';
/** Versioned local-only continuation. No scene objects or transient UI are saved.
 * serializeSession({game,sim,npcs,items,camera?}) -> plain snapshot (not JSON).
 * restoreData(JSON string | snapshot) -> sanitized snapshot, or null on bad envelope/version.
 * saveSession(session, storage?) -> boolean; accepts live session or versioned snapshot.
 * loadSession(storage?) -> sanitized snapshot|null. clearSession(storage?) -> boolean.
 * Storage failures never throw. Loading never deletes or overwrites an existing save.
 * Applying state, resolving carryingId and collision-safe spawn placement belongs to main.
 */
export const SAVE_VERSION=1;
export const SAVE_KEY='side-quest-republic.session.v1';
const MAX_BYTES=1_000_000;
const flags=['intro','speakerBorrowed','speakerDelivered','speakerReturned','performance','adviceComplete','buddyComplete','costume','keyTaken','keyReturned','endShown','stageRewarded','costumeWorn','sloganComplete','campaignFinished'];
const counters=['rizz','crowd','advice','buddy','water','stunts','interactions','playTime','timeAtStage','poseCooldown','restCooldown','speakerNoise','waterStock'];
const socialIds=['career','tuition','compliment','water','teargas','friends','slogan'];
const own=(v,k)=>Object.prototype.hasOwnProperty.call(v,k);
const obj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const plain=v=>obj(v)&&(Object.getPrototypeOf(v)===Object.prototype||Object.getPrototypeOf(v)===null);
const num=(v,d=0,lo=0,hi=1e9)=>typeof v==='number'&&Number.isFinite(v)?Math.max(lo,Math.min(hi,v)):d;
const bool=(v,d=false)=>typeof v==='boolean'?v:d;
const id=v=>typeof v==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(v)&&!['__proto__','prototype','constructor'].includes(v)?v:null;
// Plain text only: protects existing journal HTML rendering from persisted markup.
const text=(v,max=600)=>typeof v==='string'?v.replace(/[<>\u0000-\u001f\u007f]/g,'').slice(0,max):'';
const angle=(v,d=0)=>{const n=num(v,d,-1e6,1e6);return n>=-Math.PI&&n<=Math.PI?n:Math.atan2(Math.sin(n),Math.cos(n));};
function position(v={},defaults={x:0,y:0,z:0}){return {x:num(v.x,defaults.x,B.minX,B.maxX),y:num(v.y,defaults.y,0,30),z:num(v.z,defaults.z,B.minZ,B.maxZ)};}
function uniqueRecords(values,limit,fn){const seen=new Set(),out=[];for(const v of Array.isArray(values)?values:[]){if(out.length>=limit)break;if(!obj(v))continue;const key=id(v.id);if(!key||seen.has(key))continue;seen.add(key);out.push(fn(v,key));}return out;}
function social(v={}){const h=obj(v.history)?v.history:{},history={};for(const key of socialIds)if(own(h,key)&&obj(h[key]))history[key]={time:num(h[key].time),count:Math.floor(num(h[key].count,1,1,1e6))};return {history,lastTime:num(v.lastTime),cooldownUntil:num(v.cooldownUntil),officerMood:['relaxed','amused','watchful','firm'].includes(v.officerMood)?v.officerMood:'relaxed'};}
function clean(session){
 const g=session.game,s=session.sim,p=obj(s.player)?s.player:{};const game={};
 for(const k of flags)game[k]=bool(g[k]);for(const k of counters)game[k]=num(g[k]);
 game.waterStock=num(g.waterStock,6,0,6);
 if(obj(g.transit))game.transit=restoreTransit(g.transit);
 if(obj(g.destinations))game.destinations=restoreDestinationState(g.destinations);
 game.trackedStory=['sound','advice','buddy','water','crowd','costume','key','metro','mira'].includes(g.trackedStory)?g.trackedStory:null;
 game.photos=[...new Set((Array.isArray(g.photos)?g.photos:[]).filter(v=>typeof v==='string').map(v=>text(v,120)).filter(Boolean))].slice(0,100);
 game.memories=[];const titles=new Set();for(const m of Array.isArray(g.memories)?g.memories:[]){if(game.memories.length>=150)break;if(!obj(m))continue;const title=text(m.title,140);if(!title||titles.has(title))continue;titles.add(title);game.memories.push({title,text:text(m.text,1200),time:num(m.time)});}
 game.social=social(obj(g.social)?g.social:{});if(obj(g.rally))game.rally={x:position(g.rally).x,z:position(g.rally).z};
 game.carryingId=id(g.carryingId)??(typeof g.carrying==='string'?id(g.carrying):obj(g.carrying)?id(g.carrying.id):null);
 const sim={player:{...position(p,{x:-7,y:0,z:34}),yaw:angle(p.yaw,Math.PI),stamina:num(p.stamina,100,0,100)},time:num(s.time),heat:num(s.heat,0,0,100),aura:num(s.aura),trust:num(s.trust),mischief:num(s.mischief),noise:num(s.noise,0,0,60),pursuit:bool(s.pursuit),catches:Math.floor(num(s.catches)),cooldown:num(s.cooldown,0,0,3600),chases:Math.floor(num(s.chases)),escaped:Math.floor(num(s.escaped)),distance:num(s.distance)};
 sim.police=(Array.isArray(s.police)?s.police:[]).slice(0,16).filter(obj).map(c=>({...position(c),yaw:angle(c.yaw),state:['patrol','notice','chase','search'].includes(c.state)?c.state:'patrol',seen:num(c.seen,0,0,2),search:num(c.search,0,0,60),last:obj(c.last)?{x:position(c.last).x,z:position(c.last).z}:{x:position(c).x,z:position(c).z}}));
 // A malformed pursuit flag cannot create a ghost chase disconnected from officer state.
 sim.pursuit=sim.police.some(c=>c.state==='chase');
 const npcs=uniqueRecords(session.npcs,128,(n,key)=>({id:key,...position(n),yaw:angle(n.yaw),follow:bool(n.follow),hidden:bool(n.hidden),thanks:bool(n.thanks),recruited:bool(n.recruited),trust:num(n.trust)}));
 const items=uniqueRecords(session.items,64,(i,key)=>({id:key,...position({...i,y:i.y??i.model?.position?.y}),held:false,on:bool(i.on),delivered:bool(i.delivered),visible:bool(i.visible,bool(i.model?.visible,true))}));
 const carried=items.find(i=>i.id===game.carryingId&&!i.delivered);if(carried){carried.held=true;carried.visible=true;carried.x=sim.player.x;carried.z=sim.player.z;}else game.carryingId=null;
 const out={version:SAVE_VERSION,savedAt:num(session.savedAt,0,0,Number.MAX_SAFE_INTEGER),game,sim,npcs,items};
 if(obj(session.camera))out.camera={yaw:angle(session.camera.yaw),pitch:num(session.camera.pitch,.35,-1.2,1.3),zoom:num(session.camera.zoom,8.5,4.5,13)};
 return out;
}
export function serializeSession({game={},sim={},npcs=[],items=[],camera}={}){return clean({version:SAVE_VERSION,savedAt:Date.now(),game:obj(game)?game:{},sim:obj(sim)?sim:{},npcs,items,camera});}
export function restoreData(raw){try{if(typeof raw==='string'){if(raw.length>MAX_BYTES)return null;raw=JSON.parse(raw);}if(!plain(raw)||raw.version!==SAVE_VERSION||!plain(raw.game)||!plain(raw.sim))return null;return clean(raw);}catch{return null;}}
function storageOrDefault(storage){return storage===undefined?globalThis.localStorage:storage;}
export function saveSession(session,storage){try{const snapshot=session?.version!==undefined?restoreData(session):serializeSession(session);if(!snapshot)return false;const json=JSON.stringify(snapshot);if(json.length>MAX_BYTES)return false;const target=storageOrDefault(storage);if(!target||typeof target.setItem!=='function')return false;target.setItem(SAVE_KEY,json);return true;}catch{return false;}}
export function loadSession(storage){try{const target=storageOrDefault(storage);if(!target||typeof target.getItem!=='function')return null;return restoreData(target.getItem(SAVE_KEY));}catch{return null;}}
export function clearSession(storage){try{const target=storageOrDefault(storage);if(!target||typeof target.removeItem!=='function')return false;target.removeItem(SAVE_KEY);return true;}catch{return false;}}
