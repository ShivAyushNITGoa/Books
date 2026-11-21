import {SHIP} from '../assets/ship.js';

/** Small sea response, not a rolling camera or a change to narration timing. */
export function vesselMotion(t) {
  return {
    heave: SHIP.afloatOffset + 0.10 * Math.sin(t * .72) + .035 * Math.sin(t * 1.13),
    pitch: .0015 * Math.sin(t * .63),
    roll: .0012 * Math.sin(t * .49 + .8),
  };
}
