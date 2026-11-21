import {DURATION, FPS, CHAPTERS} from './timing.js';
import {clamp, mix, ramp, sample} from './math.js';
import {vesselMotion} from './motion.js';
import {conditionAt} from '../environment/waves.js';
export {DURATION, FPS, CHAPTERS};

export function shipPosition(time) {
  const underway = Math.max(0, time - 28);
  return [230 + underway * 0.30, vesselMotion(time).heave, -320 - underway * 1.65];
}
const add = (a, b) => a.map((value, i) => value + b[i]);
const dock = (t, eye, aim) => [t, ...add([-420, 0, 0], eye), ...add([-420, 0, 0], aim)];
const sea = (t, eye, aim) => [t, ...add(shipPosition(t), eye), ...add(shipPosition(t), aim)];
const world = (t, eye, aim) => [t, ...eye, ...aim];

/**
 * An explanatory rail journey, NOT an orbit controller. During each full-size
 * ship explanation the camera remains on starboard, mostly holding its bearing.
 * Changes of height reveal waterline/bulb; side-on movement provides parallax.
 * The route visits the pond and lab once, then returns to the ocean only for
 * the final voyage. No repeating object-centred loops or revolving turntable.
 */
export const KEYS = [
  dock(0, [62,26,-117], [0,1,-43]),
  dock(5.5, [34,14,-98], [0,-3,-65]),
  dock(11, [30,-.3,-90], [0,-6.3,-65.8]),
  dock(16, [23,-2.8,-85], [0,-6.5,-67.8]),
  dock(20, [38,25,-105], [0,-2,-57]),
  world(24, [-270,95,-200], [-40,18,-260]),
  world(26.5, [-20,110,-320], [180,10,-360]),
  sea(30, [110,50,-150], [0,2,-30]),
  sea(35, [65,18,-92], [0,.8,-62]),
  sea(43, [54,13,-86], [-1,.2,-64]),
  sea(52, [46,10,-81], [1,.2,-64]),
  sea(60, [57,18,-82], [0,1,-52]),
  sea(64.5, [42,9,-88], [0,-4,-67]),
  sea(69, [34,-1.5,-91], [0,-6.5,-66.3]),
  sea(77.5, [25,-3,-84], [0,-6.8,-67.4]),
  sea(84, [32,3,-84], [0,-4.4,-67]),
  sea(89, [58,21,-91], [0,.2,-66]),
  sea(97, [53,17,-87], [-1,.2,-65]),
  sea(103, [48,13,-83], [0,.4,-64]),
  world(106, [140,65,-526], [-85,15,-455]),
  world(109, [-132,26,-427], [-165,6.5,-450]),
  world(114, [-139,23.5,-431], [-164,6.5,-450]),
  world(118, [-144,21,-436], [-166,6.5,-450]),
  world(122, [-150,23,-512], [-180,8,-562]),
  world(126, [-156,18.5,-546], [-180,8.4,-575]),
  world(133, [-159,17,-552], [-180,8.2,-576]),
  world(141, [-160,15.5,-558], [-180,8.2,-576]),
  world(150, [-155,16,-568], [-180,8,-580]),
  world(155, [-162,24,-605], [-194,13,-658]),
  world(158, [-189,17,-649], [-200,9,-677]),
  world(162, [-183.5,16.5,-663], [-200,8.8,-681]),
  world(168, [-185.5,15.5,-681], [-200,8.8,-696]),
  world(171, [-188,16,-700], [-200,10,-716]),
  world(173, [-187,20,-722], [-198,15,-753]),
  world(176, [-187,25,-753], [-190,17,-790]),
  world(179, [-170,65,-830], [-100,15,-925]),
  world(183, [-5,90,-850], [210,14,-720]),
  sea(187, [127,44,-117], [0,1,-10]),
  sea(193, [91,28,-104], [0,-1,-50]),
  sea(198.5, [57,13,-90], [0,-3,-66]),
  sea(202.5, [42,.5,-85], [-.7,-6.8,-67]),
  sea(DURATION, [38,-2.8,-84], [.6,-6.8,-67]),
];

export function stateAt(time) {
  if (!Number.isFinite(time)) throw new Error('Finite time required');
  const t = clamp(time, 0, DURATION);
  const chapter = CHAPTERS.find(c => t < c.end)?.index || 8;
  const condition = conditionAt((t - 132.253333) / (156.644042 - 132.253333));
  const componentOnly = ramp(29, 35, t) * (1 - ramp(84, 94, t));
  const waveGain = mix(0.64, 0, componentOnly);
  const modelZ = -666 - clamp(t - 158, 0, 17) * 3.2;
  let focus, focusKind, viewLabel;
  if (t < 24) {
    focus = [-420, -6.8, -68.8]; focusKind = 'dry-bulb'; viewLabel = 'Dry dock · hull inspection';
  } else if (t < 105) {
    focus = add(shipPosition(t), [0, t > 64 && t < 85 ? -6.8 : 0, t > 64 && t < 85 ? -68.8 : -70]);
    focusKind = t > 64 && t < 85 ? 'sea-bulb' : 'bow-wave'; viewLabel = t > 64 && t < 85 ? 'Below the waterline' : 'Underway · bow and water';
  } else if (t < 120) {
    focus = [-165, 6.5, -450]; focusKind = 'pond'; viewLabel = 'Two-stone ripple analogy';
  } else if (t < 155) {
    focus = [-180, 8.4, -575]; focusKind = 'design-model'; viewLabel = 'Design speed and loading';
  } else if (t < 176) {
    focus = [-200, 8.8, modelZ]; focusKind = 'tank-model'; viewLabel = 'Naval laboratory · tow tank';
  } else if (t < 186) {
    focus = [-110, 10, -915]; focusKind = 'trade'; viewLabel = 'Cargo terminal · repeated voyages';
  } else {
    focus = add(shipPosition(t), [0, t > 200 ? -6.8 : 1, t > 200 ? -68.8 : -48]);
    focusKind = 'final-voyage'; viewLabel = 'Open ocean · engineered efficiency';
  }
  const windows = [[7,19],[34,61],[68,83],[89,103.5],[110,119],[125,153],[161,170.5],[191,197.5],[201,DURATION+1]];
  const focusWeight = Math.max(...windows.map(([a,b]) => ramp(a,a+.8,t)*(1-ramp(b-.8,b,t))));
  return {t, chapter, eye: sample(KEYS, t, 1), aim: sample(KEYS, t, 4), ship: shipPosition(t),
    focus, focusKind, viewLabel, focusWeight, waveGain, mismatch: 0, condition, modelZ,
    flowVisible: t > 66 && t < 86 || t > 201,
    overlay: t > 34 && t < 61 ? 'bow-energy' : t > 88 && t < 105 ? 'interference'
      : t > 108 && t < 120 ? 'ripples' : t > 123 && t < 132 ? 'power'
      : t > 133 && t < 154 ? 'conditions' : t > 158 && t < 174 ? 'testing'
      : t > 178 && t < 186 ? 'trade' : null,
    settled: focusWeight > 0.999,
  };
}
