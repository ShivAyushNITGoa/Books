import {sampleKeys, clamp, smooth} from './direction/curve.js';
export {clamp, smooth};

export const DURATION = 65.04166666666667;
export const FPS = 24;
export const SITES = Object.freeze({
  factory: {id: 'factory', name: 'Engineering factory', p: [0, 9.91, 0], ground: 8, indoors: true},
  forest: {id: 'forest', name: 'Mixed forest · crash search', p: [420, 12.57, -180], ground: 12, indoors: false},
  ocean: {id: 'ocean', name: 'Open ocean · 40 m seabed', p: [1180, -39.43, 320], ground: -40, indoors: false},
  rescue: {id: 'rescue', name: 'Coastal recovery harbour', p: [835, 4.41, 760], ground: 2.5, indoors: false},
  airport: {id: 'airport', name: 'Regional airport apron', p: [130, 10.49, 650], ground: 8, indoors: false},
});

/**
 * World-space eye and aim. Travel is directed along the landscape rather than
 * staring vertically at an empty floor. The route deliberately shares visible
 * landmarks: access road → wooded ridge → headland → offshore vessel → estuary.
 * Speed is time-compressed, but position AND velocity remain continuous.
 */
export const KEYS = [
  [0, -6, 12.5, 8, 0.7, 10.1, 0],
  [3.4, -8, 11, 2, -0.4, 10, 0.2],
  [7.8, -6, 13, -8, 0.8, 10.2, -0.6],
  [12.8, 7, 13.5, -7, -0.5, 10.3, 0.2],
  [17.4, 8, 12.5, 5, 1.25, 10.3, -0.4],
  [19.8, 2, 11.8, 8, 0.7, 10, 0],
  [20.2, 1, 12.4, 10, 10, 12.2, 5],
  [20.7, 0, 12.8, 12, 22, 13, 20],
  [21.2, 0, 13.6, 24, 10, 15, 90],
  [22.0, 30, 38, 90, 155, 33, 25],
  [23.0, 150, 66, 40, 350, 49, -100],
  [24.0, 300, 85, -80, 500, 46, -230],
  [25.0, 440, 65, -105, 420, 16, -180],
  [25.7, 411, 30, -163, 420.6, 12.9, -180],
  [26.2, 412, 16.5, -173, 420.6, 12.9, -180],
  [28.3, 428, 16.3, -174, 419.3, 12.9, -180.3],
  [29.1, 427, 17, -172, 419.3, 13, -180],
  [29.7, 445, 33, -157, 510, 30, -180],
  [30.2, 440, 44, -145, 740, 42, -120],
  [30.9, 680, 105, -60, 1150, 60, 140],
  [31.7, 990, 94, 105, 1310, 18, 330],
  [32.25, 1150, 34, 295, 1180, -3, 320],
  [32.65, 1170, 3, 329, 1180, -30, 320],
  [33.15, 1172, -35.5, 329, 1180.5, -39, 320],
  [34.4, 1187, -35.2, 328, 1179.3, -39, 320.3],
  [36.0, 1188, -36.4, 312, 1179.5, -39, 320],
  [37.2, 1174, -35.5, 311, 1180.5, -39, 320],
  [37.8, 1160, 4, 340, 1040, 14, 560],
  [38.5, 1080, 72, 495, 850, 31, 760],
  [39.25, 960, 84, 650, 790, 20, 800],
  [40.0, 855, 24, 752, 835, 4.3, 760],
  [40.3, 842, 12, 772, 835, 4.4, 760],
  [40.6, 827, 8.1, 769, 835.6, 4.4, 760],
  [42.3, 829, 8.5, 752, 834.5, 4.5, 760.3],
  [44.7, 842, 9, 753, 834.4, 4.5, 760],
  [44.95, 845, 11, 758, 850, 12, 785],
  [45.2, 844, 12, 767, 930, 20, 790],
  [45.75, 920, 65, 740, 1160, 23, 450],
  [46.5, 1135, 80, 440, 1180, -3, 320],
  [47.0, 1170, 5, 332, 1180, -25, 320],
  [47.55, 1172, -35.5, 328, 1180.6, -39, 320],
  [48.55, 1185, -35.7, 330, 1179.7, -39, 320],
  [49.6, 1187, -35.8, 313, 1179.4, -39, 320],
  [50.05, 1170, 5, 345, 1000, 24, 470],
  [50.7, 1030, 95, 310, 650, 38, 340],
  [51.45, 720, 105, 240, 400, 38, 550],
  [52.2, 410, 80, 465, 130, 14, 650],
  [53.0, 150, 32, 668, 130, 10.7, 650],
  [53.8, 122, 14.5, 657, 130.6, 10.7, 650],
  [55.8, 138, 16.3, 656, 129.4, 10.7, 650.3],
  [58, 138, 15.3, 643, 129.4, 10.8, 650],
  [61.5, 124, 14.3, 642, 130.6, 10.7, 650],
  [DURATION, 122, 13.7, 656, 130.5, 10.7, 649.8],
];

export const FOCUS = [
  ['factory', 0, 19.6],
  ['forest', 26.1, 28.9],
  ['ocean', 33.1, 37.25],
  ['rescue', 40.8, 44.4],
  ['ocean', 47.5, 49.65],
  ['airport', 53.7, DURATION + 0.6],
];

export const JOURNEYS = [
  {start: 19.6, end: 26.1, name: 'Factory road → wooded ridge', distance: '460 m inland'},
  {start: 28.9, end: 33.1, name: 'Forest → headland → open sea', distance: '910 m to sea'},
  {start: 37.25, end: 40.8, name: 'Offshore vessel → recovery harbour', distance: '560 m to shore'},
  {start: 44.4, end: 47.5, name: 'Harbour → underwater beacon', distance: '560 m offshore'},
  {start: 49.65, end: 53.7, name: 'Estuary → river bridge → airport', distance: '1.1 km overland'},
];

export function stateAt(time) {
  if (!Number.isFinite(time)) throw new Error('Finite time required');
  const t = clamp(time, 0, DURATION);
  let id = t < 24 ? 'factory' : t < 30.7 ? 'forest' : t < 38.7 ? 'ocean'
    : t < 45.7 ? 'rescue' : t < 51 ? 'ocean' : 'airport';
  let weight = 0;
  for (const [site, start, end] of FOCUS) {
    const focus = smooth((t - start) / 0.26) * smooth((end - t) / 0.26);
    if (focus > weight) {
      weight = focus;
      id = site;
    }
  }
  const journey = JOURNEYS.find(j => t >= j.start && t < j.end);
  return {
    t,
    eye: sampleKeys(KEYS, t, 1),
    aim: sampleKeys(KEYS, t, 4),
    site: id,
    hero: SITES[id].p,
    focus: weight,
    travel: 1 - weight,
    journey: journey || null,
    orange: smooth((t - 3.4) / 0.9) - smooth((t - 17.8) / 1.4) + smooth((t - 39.5) / 1),
    reflect: smooth((t - 42.85) / 0.8),
    beacon: smooth((t - 46.7) / 0.8),
    chapter: t < 8.292937 ? 1 : t < 17.640687 ? 2 : t < 26.094458 ? 3
      : t < 33.131813 ? 4 : t < 42.81625 ? 5 : t < 50.71275 ? 6 : t < 57.842979 ? 7 : 8,
  };
}

export const PEOPLE = [
  {id: 'factory-engineer', site: 'factory', x: -11.5, y: 8.06, z: 1.5, radius: 0.85, kind: 'engineer'},
  {id: 'factory-technician', site: 'factory', x: 3.5, y: 8.06, z: -9.5, radius: 0.85, kind: 'engineer'},
  {id: 'forest-search', site: 'forest', x: 425.5, y: 12, z: -184, radius: 0.85, kind: 'search'},
  {id: 'forest-investigator', site: 'forest', x: 415, y: 12, z: -179, radius: 0.85, kind: 'search'},
  {id: 'rescue-engineer', site: 'rescue', x: 827.5, y: 2.54, z: 765, radius: 0.85, kind: 'engineer'},
  {id: 'airport-crew', site: 'airport', x: 142.5, y: 8.11, z: 653.5, radius: 0.85, kind: 'search'},
];

export const RECORDER_RADIUS = 1.45;
export function clearance(site, person) {
  const hero = SITES[site].p;
  return Math.hypot(hero[0] - person.x, hero[2] - person.z) - RECORDER_RADIUS - person.radius;
}
