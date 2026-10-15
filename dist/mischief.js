/** Original fictional Hinglish improvisations. Premises are not quotations or documentary reenactments. */
const near=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const SPECS=[
 {id:'mock-news',label:'“Breaking news: aap yahan kyun aaye?”',kind:'civilian'},
 {id:'mic-echo',label:'Start a suspiciously human mic echo',kind:'civilian'},
 {id:'catwalk',label:'Turn the crossing into your runway',kind:'civilian'},
 {id:'tuition-call',label:'“Sir, mummy ko bol do extra class hai?”',kind:'officer'},
 {id:'water-weather',label:'“Sir, water cannon ka weather forecast?”',kind:'officer'},
 {id:'comic-chant',label:'Gather friends: “Attendance lagao!”',kind:'group'}
];
const available=b=>!b.hidden&&!b.sceneTarget&&!b.follow&&!b.incidentOwned&&!b.crisisOwned;
const officers=b=>b.police||b.id==='officer'||b.id==='inspector'||b.role==='officer';
const eligible=(world,bodies,player,spec,canSee)=>{
 const visible=bodies.filter(b=>b.id&&b.id!=='player'&&available(b)&&Number.isFinite(b.x)&&Number.isFinite(b.z)&&near(b,player)<=7&&(typeof canSee==='function'&&canSee(player,b)));
 const people=visible.filter(b=>!officers(b));
 if(spec.kind==='group'&&people.length<3)return null;
 return (spec.kind==='officer'?visible.filter(officers):people).sort((a,b)=>near(a,player)-near(b,player)||a.id.localeCompare(b.id))[0]||null;
};
export function mischiefActions(world,bodies,player,{canSee}={}){
 if(!world||world.finished)return [];const time=world.time||0,state=world.mischief;
 if(time<(state?.nextAt||0))return [];
 return SPECS.filter(s=>time>=(state?.used?.[s.id]?.until||0)).flatMap(s=>{const actor=eligible(world,bodies,player,s,canSee);return actor?[{id:s.id,label:s.label,actorId:actor.id}]:[];});
}
export function actMischief(world,bodies,player,id,{canSee}={}){
 const choice=mischiefActions(world,bodies,player,{canSee}).find(a=>a.id===id);
 if(!choice)return {ok:false,reason:'Moment nikal gaya. Try when people are nearby.',events:[],directives:[],effects:[]};
 const actor=bodies.find(b=>b.id===choice.actorId),time=world.time||0,state=world.mischief??={version:1,nextAt:0,used:{},log:[]};
 const count=state.used[id]?.count||0;
 const district=world.physical?.actors?.[actor.id]?.district||world.actors?.[actor.id]?.district;
 const pressure=world.districts?.[district]?.tension??world.escalation?.intensity??0;
 const mood=world.actors?.[actor.id]?.needs;
 const tense=pressure>65||(mood?.fatigue||0)>75||(mood?.fear||0)>65;
 const scene={
 'mock-news':[['player','Breaking news. Aap yahan kyun aaye?','camera'],[actor.id,'Mera charger iske bag mein hai. Isko bol, protest baad mein.',null],['player','Achha. Toh aandolan Type-C ka hai.','chuckle']],
 'mic-echo':[['player','Testing. One two. One two.','tap'],[actor.id,'Mic hai kahan?',null],['player','Budget mein bas echo approve hua tha.','chuckle']],
 'catwalk':[['player','Ek second. Yeh crossing meri entry hai.','camera'],[actor.id,'Bhai, bag ki chain khuli hai. Entry se pehle inventory bacha.',null],['player','Fashion week cancel. Mera charger uthao.','chuckle']],
 'tuition-call':[['player','Sir, mummy ko bol do extra class chal rahi hai?','phone'],[actor.id,tense?'Abhi phone rakh. Radio pe sun nahi paa raha.':'Subject kya hai? Main homework bhi poochhunga.',null],['player',tense?'Haan. Network bhi emotionally unavailable hai.':'Rehne do sir. Aap toh actual teacher nikle.','chuckle']],
 'water-weather':[['player','Sir, water cannon ka weather forecast milega?','question'],[actor.id,tense?'Forecast baad mein. Yeh raasta khaali rakho.':'Mausam department udhar nahi hai. Bottle laaya?',null],['player',tense?'Theek. Main shade mein bulletin deta hoon.':'Laaya tha. Dost ne plant samajh ke khud pee li.','chuckle']],
 'comic-chant':[['player','Attendance lagao! Jo late aaya—','tap'],[actor.id,'Usko location kisne galat bheji thi?',null],['player','Achha meri galti. Attendance chhodo, chai bolo.','applause']]
 }[id];
 const repeat=count>0,group=id==='comic-chant',officer=officers(actor);
 const effects=[{type:'aura',value:repeat?0:group?5:3},{type:'mischief',value:repeat?0:group?4:2},{type:'trust',value:tense&&officer?-1:repeat?0:1},{type:'heat',value:group?(pressure>65?9:4):officer&&tense?3:0},{type:'intensity',value:group?2:0}];
 const duration=9;
 const targets=[actor,...(group?bodies.filter(b=>b!==actor&&b.id!=='player'&&available(b)&&!officers(b)&&b.id&&near(b,player)<7&&(typeof canSee==='function'&&canSee(player,b))).slice(0,4):[])];
 const directives=targets.map((b,i)=>({actorId:b.id,objective:group?'join-comic-chant':'react-to-improvisation',to:{x:b.x,z:b.z},faceId:'player',gesture:group?'wave':id==='catwalk'?'point':officer?'listen':'laugh',speed:0}));
 state.nextAt=time+22;state.used[id]={count:count+1,until:time+180};
 state.log.push({id,time,actorId:actor.id,district:district||null,tense,pressure,repeat,effects});state.log=state.log.slice(-30);
 const witnessIds=bodies.filter(b=>b.id&&b.id!=='player'&&available(b)&&Number.isFinite(b.x)&&Number.isFinite(b.z)&&near(b,player)<=7&&canSee(player,b)).map(b=>b.id);
 state.sequence=(state.sequence||0)+1;
 return {ok:true,type:'mischief-'+id,id:`mischief-${time}-${state.sequence}`,actionId:id,time,district:district||null,position:{x:player.x,z:player.z},witnessIds,duration,provenance:'Original fictional improvisation',events:scene.map(([speakerId,line,cue],index)=>({speakerId,line,cue,at:index*3,action:{type:speakerId==='player'&&id==='catwalk'?'pose':'speak'}})),directives,effects};
}
