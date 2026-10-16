import assert from 'node:assert/strict';
import {DAY_ENCOUNTERS,DAY_ACTORS,DAY_DISTRICTS} from './dist/day-content.js';
import {createLivingWorld,actWorld,summarizeWorld,serializeWorld,restoreWorld,completedStoryTaskReceipts,applyCompletedStoryTaskEffects} from './dist/living-world.js';
const cases=[['first_injury','assist','medical',800],['first_injury','officer','medical',800],['first_injury','invoke_exception','medical',800],['climax_role','care','medical',980],['climax_role','regroup','regroup',980],['last_group_call','rollcall','regroup',920],['last_group_call','trusted','regroup',920],['broken_mic','help','mic',700],['broken_mic','gear','mic',700]];
for(const [encounter,choice,kind,time] of cases){
 const s=createLivingWorld(42,{encounters:DAY_ENCOUNTERS,actors:DAY_ACTORS,districts:DAY_DISTRICTS});s.time=time;s.flags.medical_exception=true;s.flags.regroup_known=true;
 s.promises.push({id:'speaker_care',to:'ravi',status:'open',due:1200},{id:'check_nikhil',to:'nikhil',status:'open',due:1200});
 const result=actWorld(s,encounter,choice);assert.ok(result.ok);assert.equal(s.player.aid,0,`${encounter}/${choice}: intent cannot grant aid`);assert.ok(s.promises.every(p=>p.status==='open'));
 const before=summarizeWorld(s).recovery;assert.equal(before.care,false);assert.equal(before.regroup,false);assert.equal(before.contactsChecked,false);assert.equal(before.medicalPassage,false);
 const receipt={id:`task-${choice}`,type:'story-task-completed',kind,time,sourceEventId:result.event.id,actorIds:['nikhil'],position:{x:10,z:10}};
 s.storyTasks={history:[{...receipt,type:'story-task-abandoned'}]};assert.equal(completedStoryTaskReceipts(s).length,0);assert.equal(applyCompletedStoryTaskEffects(s,receipt.id).ok,false);
 s.storyTasks.history=[receipt,structuredClone(receipt)];assert.equal(completedStoryTaskReceipts(s).length,kind==='regroup'?2:1,'duplicate history never duplicates outcome');
 assert.equal(applyCompletedStoryTaskEffects(s,receipt.id).ok,true);const afterAid=s.player.aid;assert.equal(applyCompletedStoryTaskEffects(s,receipt.id).ok,false);assert.equal(s.player.aid,afterAid);
 const r=summarizeWorld(s).recovery;assert.equal(r.care,kind==='medical');assert.equal(r.medicalPassage,false,'aid point arrival is not proof of passage traversal');assert.equal(r.regroup,kind==='regroup');assert.equal(r.contactsChecked,kind==='regroup');
 if(kind==='medical'){receipt.passageTraversed=true;assert.equal(summarizeWorld(s).recovery.medicalPassage,true);}
 const restored=restoreWorld(serializeWorld(s));assert.deepEqual(restored.storyTasks,s.storyTasks);assert.deepEqual(summarizeWorld(restored).recovery,summarizeWorld(s).recovery);
 s.finished=true;s.time=1200;s.ending={recovery:{care:false}};const finished=restoreWorld(serializeWorld(s));assert.equal(finished.ending.recovery.care,kind==='medical','restore refreshes stale cached recap');
 console.log('PASS',encounter,choice);
}
console.log('PASS all nine converted choices defer success, physical receipts, deduplication, abandon, idempotent rewards and restore');
// Packing talk cannot retroactively return a speaker still out in the street.
{
 const {recordWorldAction}=await import('./dist/living-world.js');
 for(const returned of [false,true]){
  const s=createLivingWorld(42,{encounters:DAY_ENCOUNTERS,actors:DAY_ACTORS,districts:DAY_DISTRICTS});s.time=1100;
  if(returned)assert.ok(recordWorldAction(s,'speaker_return').ok);
  s.promises.push({id:'speaker_care',to:'ravi',status:'open',due:1200});
  const result=actWorld(s,'return_promises','repair');assert.ok(result.ok);
  assert.equal(s.promises[0].status,returned?'kept':'open');
  assert.equal(result.appliedEffects.some(e=>e.type==='resolvePromise'),returned);
 }
 const s=createLivingWorld(42,{encounters:DAY_ENCOUNTERS,actors:DAY_ACTORS,districts:DAY_DISTRICTS});s.time=800;
 const r=actWorld(s,'first_injury','assist');assert.ok(r.ok);assert.ok(Array.isArray(r.appliedEffects));assert.ok(!r.appliedEffects.some(e=>['aid','flag','solidarity'].includes(e.type)),'UI reward bridge gets only effects actually applied');
 console.log('PASS packing requires physical speaker return; appliedEffects excludes deferred achievement rewards');
}
