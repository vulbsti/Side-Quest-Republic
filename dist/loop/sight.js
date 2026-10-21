// Who can see the player: the engine's positions and the world's walls. The client passes its live obstacle
// list (world.obstacles, including the moving shuttle); verify/ passes a snapshot of the same list
// (verify/world-obstacles.json, checked against the live world by npm run verify:playback) plus the shuttle
// at the engine's bus. One rule for play, ?replay= and the verifier, so a theft is witnessed, and a chaser
// loses you, the same way in all three.
import { visible } from '../simulation.js?v=27';

/** canSee(id, body) for R.witnesses(): can that person or officer see the player? */
export const canSee = (s, obstacles) => (_id, body) => visible(body, s.player, obstacles);

/** The engine's per-tick `unseen` input: the officer chasing the player has lost sight of them. */
export function lostSight(s, obstacles) {
  const id = s.player.chasedBy;
  const c = id && (s.people[id] || s.officers[id]);
  return !!c && !visible(c, s.player, obstacles);
}
