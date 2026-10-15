import {SHOP_PERFORMANCES} from './scene-performance.js';
/** Original neighbourhood scenes; no real retailer or person is impersonated. */
export const SHOP_LAYOUT=Object.freeze([
 {id:'print',name:'PHOTO / PRINT',x:-71,z:84,color:'#ad654a'},
 {id:'kirana',name:'GALI KIRANA',x:-63,z:84,color:'#71877b'},
 {id:'repair',name:'CYCLE REPAIR',x:-55,z:84,color:'#bc9e64'},
 {id:'chai',name:'CHAI & NASHTA',x:-47,z:84,color:'#ac7659'},
 {id:'charge',name:'PHONE CHARGE',x:-39,z:84,color:'#5e807e'}
]);
export const SHOP_SOLIDS=Object.freeze(SHOP_LAYOUT.flatMap(s=>[
 {id:s.id+'Back',x:s.x,z:88,w:8,d:.2,h:6.8},
 {id:s.id+'West',x:s.x-4,z:84,w:.2,d:8,h:6.8},
 {id:s.id+'East',x:s.x+4,z:84,w:.2,d:8,h:6.8},
 ...[-1,1].map(k=>({id:s.id+'Front'+k,x:s.x+k*2.85,z:80,w:2.3,d:.2,h:3.8})),
 {id:s.id+'Lintel',x:s.x,z:80,w:8,d:.2,base:3.0,h:6.8},
 {id:s.id+'UpperFloor',x:s.x,z:84,w:8,d:8,base:3.8,h:6.8},
 {id:s.id+'Counter',x:s.x+2.4,z:84.5,w:1.1,d:2.4,h:1.0},
 {id:s.id+'Shelf',x:s.x,z:87.3,w:5.4,d:.7,h:1.9}
]));
export const FORECOURTS=Object.freeze([
 {id:'press-stop',name:'PRESS LANE',bus:{x:60,z:-30},x:54,z:-30},
 {id:'civic-stop',name:'CIVIC COURT',bus:{x:60,z:45},x:54,z:45},
 {id:'seva-stop',name:'SEVA CAMP',bus:{x:-60,z:12},x:-65,z:12},
 {id:'gali-stop',name:'SERVICE GALI',bus:{x:-60,z:65},x:-65,z:65}
]);
export const FORECOURT_SOLIDS=Object.freeze(FORECOURTS.flatMap(s=>[
 {id:s.id+'Bench',x:s.x,z:s.z-3,w:2.8,d:.65,h:.7},
 {id:s.id+'Post',x:s.x-1.8,z:s.z+2.5,w:.15,d:.15,h:3.1},
 {id:s.id+'Roof',x:s.x,z:s.z-2.5,w:4,d:2.4,base:2.9,h:3.05}
]));
export const URBAN_SOLIDS=Object.freeze([
 {id:'marketBack',x:8,z:94,w:64,d:.3,h:4.2,color:'#b39874'},
 {id:'marketWest',x:-24,z:90,w:.3,d:8,h:4.2,color:'#b39874'},
 {id:'marketEast',x:40,z:90,w:.3,d:8,h:4.2,color:'#b39874'},
 ...[-16,-8,0,16,24,32].flatMap((x,i)=>[
  {id:`marketCounter${i}`,x,z:91,w:5.8,d:1.2,h:1.05,color:i%2?'#8a7860':'#98735c'},
  {id:`marketCanopy${i}`,x,z:90,w:7,d:6,base:3.3,h:3.45,color:['#aa7259','#637e72','#b59e66'][i%3]},
  ...[-3.4,3.4].map((dx,j)=>({id:`marketPost${i}-${j}`,x:x+dx,z:87,w:.12,d:.12,h:3.4,color:'#596653'}))]),
 {id:'clockPlinth',x:8,z:91,w:2,d:2,h:.5,color:'#b7aa8d'},
 {id:'clockTower',x:8,z:91,w:1.2,d:1.2,h:9,color:'#a38b68'},
 {id:'snackCart',x:-23,z:75,w:2,d:3,h:1.2,color:'#af7950'},
 {id:'snackShade',x:-23,z:75,w:3,d:4,base:2.8,h:2.95,color:'#77937d'},
 {id:'danceSeatL',x:15,z:77,w:3,d:.7,h:.7,color:'#82684d'},
 {id:'danceSeatR',x:29,z:77,w:3,d:.7,h:.7,color:'#82684d'},
 {id:'photoBackdrop',x:35,z:89,w:6,d:.15,h:2.9,color:'#659c99'},
 {id:'voiceBack',x:4,z:45,w:4,d:.15,h:2.9,color:'#947eac'},
 {id:'voiceLeft',x:2,z:43.5,w:.15,d:3,h:2.9,color:'#947eac'},
 {id:'voiceRight',x:6,z:43.5,w:.15,d:3,h:2.9,color:'#947eac'},
 {id:'voiceRoof',x:4,z:43.5,w:4.2,d:3.2,base:2.9,h:3.05,color:'#6d6383'}
]);
export const DESTINATIONS=Object.freeze([
 {id:'voice_booth',name:'The voice-note booth',npc:'DEV · ONE MORE TAKE',location:{x:4,z:42.5},district:'metro',setup:'Dev is recording a seven-second voice note. Take twenty-three. “Natural lagna chahiye. Ready? Act natural.”',actions:[
 {id:'announcer',label:'Deliver your update like a railway announcement',line:'“Yatri kripya dhyaan dein: Dev abhi bhi recording kar rahe hain.” Dev keeps it. You were supposed to be background.',effects:{aura:5,trust:-1},flag:'station_voice',callback:'Someone plays your announcement at the bus stop. Two people genuinely check which bus is leaving.',callbackEffects:{aura:2}},
 {id:'whisper',label:'Whisper “guys, be normal” directly into the microphone',line:'Everyone immediately becomes less normal. One friend whispers back in surround sound.',effects:{aura:3,stamina:-3},flag:'normal_whisper',callback:'Dev names the clip “Normal People”. It is easily the least normal thing on his phone.',callbackEffects:{aura:2}}]},
 {id:'snack_corner',name:'The chaat negotiation',npc:'PAPPU · SPICE DESK',location:{x:-20,z:75},district:'metro',setup:'Pappu asks “Teekha kitna?” with the expression of a man who has heard “I can handle it” too many times.',actions:[
 {id:'brave',label:'“Delhi level.” Maintain eye contact',line:'You nod confidently while your eyes submit a separate complaint. Pappu silently slides a tissue over.',effects:{aura:6,stamina:-8},flag:'delhi_spice',callback:'Pappu introduces you to the next customer as “Delhi Level”. You can hear the quotation marks.',callbackEffects:{aura:2}},
 {id:'audit',label:'Request a tasting spoon and a formal spice briefing',line:'“Sir, golgappa hai. Tender nahi.” He gives you the tiny spoon anyway.',effects:{aura:-1,stamina:14},flag:'spice_auditor',callback:'Your friends appoint you Minister of Mild Chutney. The portfolio comes with free napkins.',callbackEffects:{trust:2}}]},
 {id:'book_bazaar',name:'The impossible book bargain',npc:'LEELA · SECOND-HAND BOOKS',location:{x:-8,z:87.5},district:'metro',setup:'Leela has a book called How To Win Every Argument. The price is written in very firm handwriting.',actions:[
 {id:'argue',label:'Use the title itself to negotiate a discount',line:'“Agar book achhi hai toh discount milna chahiye.” Leela closes it. “Chapter one: know when to stop.”',effects:{aura:4,trust:-1},flag:'book_argument',callback:'Leela adds a handwritten bookmark: “You lost this one.” It is annoyingly good marketing.',callbackEffects:{aura:1}},
 {id:'blind',label:'Choose a mystery book by its dramatic cover alone',line:'It is a 2011 railway timetable. You call it historical fiction. Leela calls it a final sale.',effects:{aura:2,trust:2},flag:'mystery_timetable',callback:'At the bus stop, someone asks you for directions because you look so well prepared.',callbackEffects:{aura:2}}]},
 {id:'dance_court',name:'Eight counts of confidence',npc:'SIMRAN · PRACTICE SESSION',location:{x:22,z:80},district:'metro',setup:'Simran has taught everyone a four-step routine. Somehow the group now contains six different routines.',actions:[
 {id:'freestyle',label:'Announce that your wrong steps are freestyle',line:'Simran watches your footwork. “Freestyle hai ya network issue?” The group copies the mistake on purpose.',effects:{aura:7,stamina:-10},flag:'network_dance',callback:'Your accidental move gets a name: The Buffering. You are credited as its founder.',callbackEffects:{aura:3}},
 {id:'count',label:'Become the very loud person counting everybody in',line:'“Five, six, seven, eight!” Everyone starts on a different number. You take your leadership role seriously anyway.',effects:{aura:4,trust:-1},flag:'loud_counter',callback:'A friend now shouts “five-six-seven-eight” whenever you walk into a room.',callbackEffects:{aura:1}}]},
 {id:'photo_corner',name:'The accidental campaign photo',npc:'ADITI · PORTRAIT CORNER',location:{x:34,z:86.5},district:'court',setup:'Aditi has painted a backdrop that says MAIN CHARACTER. The wind keeps folding it to read MAIN CAR.',actions:[
 {id:'minister',label:'Pose like you have just inaugurated a flyover',line:'You point at absolutely nothing. Aditi whispers, “Development.” A passing uncle nods approvingly.',effects:{aura:5,trust:-1},flag:'flyover_pose',callback:'Your friends turn the photo into a campaign poster for “Minister of Unnecessary Pointing”.',callbackEffects:{aura:3}},
 {id:'candid',label:'Ask for a candid, then direct every detail',line:'“Natural, but from the left. No, my left.” Aditi takes the photo while you are explaining your natural expression.',effects:{aura:2,trust:-2},flag:'directed_candid',callback:'The best photograph is the one where you are still saying “candid”. Aditi refuses to delete it.',callbackEffects:{aura:2}}]},

 {id:'print',name:'The print shop',npc:'IMRAN · PRINT DESK',location:{x:-71,z:83.5},district:'backstreet',setup:'Imran has three printers and exactly one working cable. “Serious poster chahiye ya shaadi ka invitation?”',actions:[
 {id:'caption',label:'“Maximum impact.” Pick the dramatic wedding font',line:'The printer produces CONGRATULATIONS TO THE REVOLUTION in gold curls. Imran stares. “Advance non-refundable hai.”',effects:{aura:5,trust:-2},flag:'gold_font',callback:'Someone at the bus stop asks who is getting married. Your gold poster has become an invitation.',callbackEffects:{aura:2}},
 {id:'proof',label:'Use the cheapest font and argue about the extra rupee',line:'“Bhai, font free hai. Staple ka paisa hai.” You win the argument and lose the staple.',effects:{aura:1,trust:-1},flag:'staple_dispute',callback:'Your unstapled poster rolls itself into a telescope. Imran sends one laughing emoji.',callbackEffects:{aura:-1}}]},
 {id:'kirana',name:'The neighbourhood kirana',npc:'MEENA · KIRANA',location:{x:-63,z:83.5},district:'backstreet',setup:'Meena has cold drinks, a stubborn calculator and no interest in your follower count. “Discount ke liye talent dikhao.”',actions:[
 {id:'sort',label:'Offer a dramatic shop endorsement for a cold drink',line:'“Meena Stores: hydration ka headquarters!” She gives you a drink and immediately asks for another take.',effects:{stamina:12,aura:3},flag:'kirana_ad',callback:'Meena has renamed your contact “Marketing Intern”. A neighbour asks for your shop-opening rates.',callbackEffects:{trust:2,aura:-1}},
 {id:'queue',label:'Challenge Meena to identify the mystery snack',line:'You confidently call it banana chips. “Beta, packet pe makhana likha hai.” She lets the queue judge.',effects:{aura:-2,stamina:8},flag:'snack_expert',callback:'A stranger greets you with “Makhana Professor!” Apparently that is your name now.',callbackEffects:{aura:3}}]},
 {id:'repair',name:'The cycle workshop',npc:'SONU · REPAIRS',location:{x:-55,z:83.5},district:'backstreet',setup:'Sonu has repaired the brakes. The bell still sounds like a frightened duck. “Original character hai. Replace karna hai?”',actions:[
 {id:'basket',label:'Keep the squeaky bell. Call it a custom sound system',line:'You try the bell. PEEP. Three people turn around. Sonu says, “Surround sound.”',effects:{aura:4,trust:1},flag:'duck_bell',callback:'The squeaky cycle passes the bus queue. Someone answers it with a duck noise. Sonu looks pleased.',callbackEffects:{aura:2}},
 {id:'label',label:'Insist the bell needs a bass drop',line:'Sonu taps a spanner on the frame: “Lo, bass.” You spend a minute beatboxing beside a punctured tyre.',effects:{aura:6,stamina:-6},flag:'cycle_bass',callback:'A little crowd requests an encore. Sonu points at his repair queue: “Show kal kar lena.”',callbackEffects:{trust:-2}}]},
 {id:'chai',name:'Chai and a breather',npc:'BIMLA · CHAI',location:{x:-47,z:83.5},district:'backstreet',setup:'Bimla slides a cup across the counter. “Adrak ya elaichi?” Two regulars turn around. Apparently this is political.',actions:[
 {id:'rest',label:'“Dono.” Demand ginger AND cardamom',line:'One regular nods. The other says “centrist.” Bimla adds both and charges you a debate in return.',effects:{stamina:20,aura:2},flag:'chai_coalition',callback:'Your two-spice chai has become the “coalition special”. Both regulars claim they invented it.',callbackEffects:{trust:1}},
 {id:'cups',label:'Barter washing five cups for an extra-strong chai',line:'“Paanch bola tha, plate nahi.” You stare at the growing sink. Bimla makes the chai properly strong.',effects:{stamina:30,aura:-2},flag:'cup_barter',callback:'Bimla calls you “partner” and leaves a biscuit aside. The sink is also mysteriously fuller.',callbackEffects:{trust:4,fatigue:3}}]},
 {id:'charge',name:'The charging corner',npc:'ZOYA · PHONE REPAIR',location:{x:-39,z:83.5},district:'backstreet',setup:'One socket is free. It has a note: RESERVED, 2 MINUTES. Nobody has seen its owner in twenty.',actions:[
 {id:'contact',label:'Declare the reservation expired. Claim the socket',line:'Zoya watches you plug in. “Congratulations. Ab charger ke landlord tum ho.” A distant voice says, “Mera tha!”',effects:{aura:3,trust:-3},flag:'socket_landlord',callback:'The owner returns—with the only adapter your phone needs. Negotiations reopen.',callbackEffects:{aura:-2}},
 {id:'permission',label:'Write your name on the waiting list as “Chief Battery Officer”',line:'Zoya reads it aloud. “CBO sahab, phone ek percent pe hai.” The queue votes to let you charge first.',effects:{aura:4,stamina:-2},flag:'battery_officer',callback:'Three people now ask you why their phones are charging slowly. Your promotion had responsibilities.',callbackEffects:{aura:1,trust:-1}}]},
 {id:'courtyard',name:'The service courtyard',npc:'RAFIQ · NEIGHBOUR',location:{x:-47,z:73},district:'backstreet',setup:'Rafiq and his neighbour both insist a plastic chair belongs outside their shop. They ask for your completely neutral opinion.',actions:[
 {id:'clear',label:'Sit in the disputed chair. “Ab public property hai.”',line:'Both neighbours stop arguing long enough to look at you. Rafiq laughs; his neighbour absolutely does not.',effects:{aura:5,trust:-2,stamina:8},flag:'chair_arbitrator',callback:'The neighbours have jointly agreed on one thing: you should carry the chair back inside.',callbackEffects:{trust:-1,fatigue:2}},
 {id:'listen',label:'Propose a five-minute rotating chair presidency',line:'Rafiq starts a timer. His neighbour demands proportional representation. You have accidentally created a committee.',effects:{aura:3,trust:2},flag:'chair_committee',callback:'The chair committee sends you its first complaint. Apparently breaks must also rotate.',callbackEffects:{aura:-1}}]},
 {id:'aid_rest',name:'Inside the rest tent',npc:'GEETA · FIRST AID',location:{x:-74,z:3},district:'supply',setup:'Geeta points at the shade. “Paani piya?” You prepare an impressive explanation. “Haan ya na, TED Talk nahi.”',actions:[
 {id:'recover',label:'Admit you have survived entirely on chai and confidence',line:'“Confidence ka ORS nahi aata.” Geeta hands you water and directs your speech toward the empty chair.',effects:{stamina:25,aura:-2,fatigue:-8},flag:'chai_confession',callback:'Geeta spots you later and silently raises a water bottle. You nod like a student caught without homework.',callbackEffects:{trust:2}},
 {id:'privacy',label:'Ask if resting counts toward your daily step goal',line:'Geeta considers it. “Aankh band karke calculate karo.” You take the hint and a short break.',effects:{stamina:18,aura:2,fatigue:-6},flag:'rest_statistics',callback:'A friend asks how many steps you got. “Emotionally? Bohot.” The joke is unfortunately now yours.',callbackEffects:{aura:2}}]}
]);
for(const d of DESTINATIONS)if(SHOP_PERFORMANCES[d.id])d.performance=SHOP_PERFORMANCES[d.id];
export function createDestinationState(){return {version:1,completed:[],visits:{},pending:[],callbackHistory:[]};}
export function performDestination(state,id,actionId){
 const destination=DESTINATIONS.find(d=>d.id===id),action=destination?.actions.find(a=>a.id===actionId);
 if(!destination||!action||!state||state.version!==1)return {ok:false,reason:'Unknown neighbourhood activity'};
 state.completed=Array.isArray(state.completed)?state.completed:[];state.visits=state.visits&&typeof state.visits==='object'?state.visits:{};
 state.pending=Array.isArray(state.pending)?state.pending:[];state.callbackHistory=Array.isArray(state.callbackHistory)?state.callbackHistory:[];
 const key=id+':'+actionId,repeated=state.completed.includes(key);state.visits[id]=(Number(state.visits[id])||0)+1;
 const visitCount=Object.values(state.visits).reduce((sum,n)=>sum+(Number(n)||0),0);
 const due=state.pending.filter(p=>p.due<=visitCount),callbacks=[];state.pending=state.pending.filter(p=>p.due>visitCount);
 const effects=repeated?{}:{...action.effects};
 for(const p of due){const [did,aid]=String(p.key).split(':'),original=DESTINATIONS.find(d=>d.id===did)?.actions.find(a=>a.id===aid);if(!original||state.callbackHistory.includes(p.key))continue;callbacks.push(original.callback);state.callbackHistory.push(p.key);for(const [k,v]of Object.entries(original.callbackEffects||{}))effects[k]=(effects[k]||0)+v;}
 if(!repeated){state.completed.push(key);if(action.callback)state.pending.push({key,due:visitCount+2});}
 return {ok:true,repeated,line:(repeated?'“Ho gaya, dost. Ab baaki gali bhi dekh lo.” '+action.line:action.line)+(callbacks.length?'\n\nLater: '+callbacks.join(' '):''),effects,callbacks,flag:action.flag,destination:id,action:actionId};
}
/** Restore only authored ids and finite counters; never trust saved effect payloads. */
export function restoreDestinationState(value){
 if(!value||value.version!==1)return null;
 const valid=new Set(DESTINATIONS.flatMap(d=>d.actions.map(a=>d.id+':'+a.id))),result=createDestinationState();
 result.completed=[...new Set((Array.isArray(value.completed)?value.completed:[]).filter(k=>valid.has(k)))];
 result.callbackHistory=[...new Set((Array.isArray(value.callbackHistory)?value.callbackHistory:[]).filter(k=>result.completed.includes(k)))];
 for(const d of DESTINATIONS){const n=value.visits?.[d.id];if(Number.isFinite(n)&&n>=0)result.visits[d.id]=Math.min(100000,Math.floor(n));}
 const seen=new Set();for(const p of Array.isArray(value.pending)?value.pending:[]){if(!p||!result.completed.includes(p.key)||result.callbackHistory.includes(p.key)||seen.has(p.key)||!Number.isFinite(p.due)||p.due<0)continue;seen.add(p.key);result.pending.push({key:p.key,due:Math.min(1000000,Math.ceil(p.due))});}
 return result;
}
