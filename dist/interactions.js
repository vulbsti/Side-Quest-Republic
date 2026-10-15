const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const STAGE={x:0,z:-11}, DESK={x:28,z:-.5}, METRO={x:-14,z:49}, CAPE={x:-33,z:31};

// Pure candidate construction. Consumers retain selection by id while cycling.
// Priority describes immediate intent; alternatives remain available nearby.
export function buildInteractionCandidates({player,items=[],npcs=[],game={}}) {
  const candidates=[];
  const add=(priority,range,action)=>candidates.push({...action,_priority:priority,_range:range});
  const carried=game.carrying;
  const nearNPCs=npcs.filter(n=>!n.hidden&&distance(player,n)<2.5);
  const ravi=nearNPCs.find(n=>n.id==='ravi');
  const officer=nearNPCs.find(n=>n.id==='officer');
  if(carried?.type==='speaker'&&ravi&&game.performance&&!game.speakerReturned)
    add(0,distance(player,ravi),{id:'return:speaker:ravi',type:'npc',npc:ravi,label:'Return Ravi’s speaker'});
  if(carried?.type==='phone') {
    const info=nearNPCs.find(n=>n.id==='info');
    if(info&&!game.buddyComplete)add(0,distance(player,info),{id:'deliver:phone',type:'npc',npc:info,label:'Give Nikhil’s phone to the volunteer'});
  }
  if(carried?.type==='key'&&(distance(player,DESK)<2.7||officer))
    add(0,officer?distance(player,officer):distance(player,DESK),{id:'return:key',type:'returnkey',npc:officer,label:'Return the bus key'});
  if(carried?.type==='speaker'&&distance(player,STAGE)<5)
    add(1,distance(player,STAGE),{id:'stage:connect',type:'stage',label:'Connect the speaker to the stage'});
  const stageSpeaker=items.find(i=>i.type==='speaker'&&!i.held&&!i.delivered&&i.model?.visible!==false&&distance(i,STAGE)<5);
  if(game.speakerDelivered&&stageSpeaker&&!carried&&distance(player,STAGE)<4)
    add(game.performance?4:1,distance(player,STAGE),{id:'stage:performance',type:'performance',label:game.performance?'Encore! Play the rhythm again':game.crowd<3?'Sound check / gather a crowd':'Start the performance'});
  if(!carried) for(const item of items) {
    if(item.held||item.delivered||item.model?.visible===false||distance(player,item)>=2.2)continue;
    if(item.type==='speaker'&&!game.speakerBorrowed) {
      const owner=npcs.find(n=>n.id==='ravi'&&!n.hidden);
      // Permission is a conversation, never a remote pickup or theft by default.
      if(owner&&distance(player,owner)<2.5)add(0,distance(player,owner),{id:'permission:speaker',type:'npc',npc:owner,label:'Ask Ravi to borrow the speaker'});
      continue;
    }
    add(item.type==='speaker'?2:3,distance(player,item),{id:`item:${item.id}`,type:'item',item,label:item.type==='speaker'?'Pick up Ravi’s speaker':`Pick up ${item.name}`});
  }
  if(!carried) for(const item of items) {
    if(item.type==='speaker'&&!item.held&&!item.delivered&&item.model?.visible!==false&&game.speakerBorrowed&&distance(player,item)<2.2)
      add(6,distance(player,item),{id:`toggle:${item.id}`,type:'toggleSpeaker',item,label:item.on?'Turn speaker music off':'Turn speaker music on'});
  }
  for(const npc of nearNPCs) {
    if(carried?.type==='water'&&!npc.police&&!npc.thanks)
      add(1,distance(player,npc),{id:`water:${npc.id}`,type:'npc',npc,label:`Offer ${npc.name.split(' ·')[0]} water`});
    else if(npc.id==='officer'&&game.advice===2&&!game.adviceComplete)
      add(3,distance(player,npc),{id:'officer:followup',type:'followup',npc,label:'Ask the follow-up question'});
    else add(npc.follow?7:5,distance(player,npc),{id:`npc:${npc.id}`,type:'npc',npc,label:`Talk to ${npc.name.split(' ·')[0]}`});
  }
  if(distance(player,METRO)<4)add(3,distance(player,METRO),{id:'metro:exit',type:'exit',label:'Head to the Metro / finish your afternoon'});
  if(distance(player,CAPE)<3)add(3,distance(player,CAPE),{id:'costume:toggle',type:'costume',label:game.costume?'Return the cardboard cape':'Become Captain Pending Results'});
  if(carried?.type==='speaker')add(9,0,{id:'speaker:toggle',type:'speaker',label:carried.on?'Stop carried speaker music':'Play a few seconds of music'});
  return candidates.sort((a,b)=>a._priority-b._priority||a._range-b._range||a.id.localeCompare(b.id)).map(({_priority,_range,...action})=>action);
}
