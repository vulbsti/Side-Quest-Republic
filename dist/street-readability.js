/** Presentation only: no authority over actions, knowledge or movement. */
const finite=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.z);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const retreat=new Set(['back-away-from-close-line','follow-visible-retreat','retreat-from-line','use-safe-passage','scatter','scatter-from-line']);
export function describeNearbyAction(action,{actorOrder}={}){
 if(!action||action.type!=='npc'||action.id!==`npc:${action.npc?.id}`)return action?.label||'';
 const npc=action.npc,name=(npc.name||'this person').split(' ·')[0],objective=actorOrder?.objective||npc.incidentOrder?.objective;
 if(retreat.has(objective))return `Talk to ${name} · moving away`;
 if(objective==='line-advance')return `Talk to ${name} · advancing`;
 if(objective==='hesitate-and-hold')return `Talk to ${name} · holding back`;
 if(objective==='hold-police-line')return `Talk to ${name} · on the line`;
 if(objective==='rally-with-neighbours')return `Talk to ${name} · calling people over`;
 if(objective==='escort-follow-player')return `Talk to ${name} · following you`;
 if(objective==='escort-wait-for-player')return `Talk to ${name} · waiting for you`;
 if(objective==='escort-safe-rally')return `Talk to ${name} · reached the meeting point`;
 if(objective==='yield-to-retreaters')return `Talk to ${name} · making room`;
 if(objective==='regroup'||objective==='find-friends'||objective==='regroup-after-wave'||objective==='recover-after-wave')return `Talk to ${name} · regrouping`;
 if(npc.follow)return `Talk to ${name} · with you`;
 return action.label;
}
const phaseCopy={
 warning:{title:'The line is forming.',text:'People are deciding whether to stay. Look for nearby calls and choose who to approach.',sub:'E acts nearby · TAB changes the action'},
 advance:{title:'The line is moving.',text:'Watch the people around you. Nearby actions change as the line reaches them.',sub:'You still control your movement · E / TAB for nearby actions'},
 scatter:{title:'Everyone has a different plan.',text:'Some people are leaving; others are looking for friends. Get close enough to hear them.',sub:'Follow what you can see · E / TAB for nearby actions'},
 regroup:{title:'Who made it back?',text:'People are regrouping in smaller pockets. Check nearby calls before moving on.',sub:'The street remembers what happened'}
};
export function crisisTaskCopy({status,nearby=false,activeTask}={}){
 if(!nearby)return null;
 if(activeTask&&typeof activeTask.title==='string'&&typeof activeTask.text==='string')return {title:activeTask.title,text:activeTask.text,sub:activeTask.sub||'E / TAB for nearby actions'};
 return phaseCopy[status]?{...phaseCopy[status]}:null;
}
/** Captions must already contain their rendered world position and projection.
 * Only opt-in visible captions are eligible. No remote event reveals, no DOM.
 * priority is 0 casual, 1 direct response, 2 urgent; stable original-order ties.
 */
export function selectStreetCaptions(captions,{player,canSee,maxCount=3,maxDistance=20,minScreenDistance=100}={}){
 if(!finite(player)||typeof canSee!=='function')return [];
 const limit=Math.max(0,Math.min(4,Math.floor(Number(maxCount)||0))),radius=Math.max(0,Number(maxDistance)||0),spacing=Math.max(0,Number(minScreenDistance)||0);
 const ranked=captions.map((caption,index)=>({caption,index,distance:finite(caption.position)?distance(player,caption.position):Infinity}))
 .filter(({caption:c,distance:d})=>c.visible===true&&c.ttl>0&&d<=radius&&canSee(player,c.position)===true)
 .sort((a,b)=>(Math.min(2,Math.max(0,Number(b.caption.priority)||0))-Math.min(2,Math.max(0,Number(a.caption.priority)||0)))||a.distance-b.distance||a.index-b.index);
 const chosen=[];
 for(const {caption:c} of ranked){if(chosen.length>=limit)break;
  if(c.screen&&chosen.some(other=>other.screen&&Math.abs(c.screen.x-other.screen.x)<spacing*2&&Math.abs(c.screen.y-other.screen.y)<spacing))continue;
  chosen.push(c);
 }
 return chosen;
}
