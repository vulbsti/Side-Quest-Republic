import assert from 'node:assert/strict';
import {DAY_ENCOUNTERS,DAY_ACTORS,DAY_DISTRICTS} from './dist/day-content.js';
import {createLivingWorld,actWorld,summarizeWorld,serializeWorld,restoreWorld} from './dist/living-world.js';
const make=()=>createLivingWorld(42,{encounters:DAY_ENCOUNTERS,actors:DAY_ACTORS,districts:DAY_DISTRICTS});
// Late dialogue can occur after the physical crisis scheduler's 1100 cutoff.
for(const time of [980,1120,1169]){
 const s=make();s.time=time;assert.ok(actWorld(s,'climax_role','escalate').ok);
 const r=summarizeWorld(s).recovery;
 assert.equal(r.escalationCalled,true);assert.equal(r.outcome,'escalation-called');
 assert.doesNotMatch(r.title,/Renewed confrontation/);assert.match(r.text,/does not establish/);
 assert.equal(s.crowdCrisis,undefined,'dialogue must not imply a performed physical crisis');
 assert.deepEqual(summarizeWorld(restoreWorld(serializeWorld(s))).recovery,r);
}
{
 const s=make();s.time=980;const before={evidence:s.player.evidence,credibility:s.player.credibility};const result=actWorld(s,'climax_role','witness');assert.ok(result.ok);
 assert.equal(s.player.evidence,before.evidence);assert.equal(s.player.credibility,before.credibility);assert.equal(s.flags.final_witness,undefined);assert.equal(s.events.some(e=>e.type==='evidence'),false);assert.deepEqual(result.appliedEffects,[],'HUD receives no rewards for an unperformed recording');assert.equal(result.event.type,'choice');
 const r=summarizeWorld(s).recovery;
 assert.equal(r.receipts.some(x=>x.action==='late-account'),false);
 assert.ok(r.receipts.some(x=>x.action==='recording-intent'));
 assert.match(r.text,/offered to record/);assert.match(r.text,/no completed recording/);
 assert.doesNotMatch(r.text,/You preserved an account/);
}
console.log('PASS late escalation and recording dialogue are reported as intent, not verified physical outcomes');
