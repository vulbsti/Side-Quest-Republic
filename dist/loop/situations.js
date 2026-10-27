// Every situation in the day, merged from story/ (one file per situation).
// Format: plans/story-rebuild.md, "Situations". The engine is story.js.
import nikhilLost from './story/nikhil-lost.js';
import careerCounselling from './story/career-counselling.js';
import chabi from './story/chabi.js';
import speakerRun from './story/speaker-run.js';
import miraMic from './story/mira-mic.js';
import afwaah from './story/afwaah.js';
import mummyCall from './story/mummy-call.js';
import cannonRequest from './story/cannon-request.js';
import nayeJoote from './story/naye-joote.js';
import busAndar from './story/bus-andar.js';
import detainMe from './story/detain-me.js';
import dhuan from './story/dhuan.js';
import gharJaanaHai from './story/ghar-jaana-hai.js';
import pattiyan from './story/pattiyan.js';

export const SITUATIONS = {
  ...nikhilLost, ...careerCounselling, ...chabi, ...speakerRun,
  ...miraMic, ...afwaah, ...mummyCall,
  ...cannonRequest, ...nayeJoote, ...busAndar, ...detainMe,
  ...dhuan, ...pattiyan, ...gharJaanaHai,
};
