import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {serve} from '../../../tools/server.mjs';

const times = [
  0, 2, 4.3, 8, 12.8, 17.4, 19.8, 20.7, 21.3, 22, 23, 24,
  25, 26.2, 27.4, 28.6, 29.5, 30.3, 30.9, 31.7, 32.3, 33.2,
  34.4, 35.2, 36, 37.2, 38, 38.8, 39.5, 40.6, 42.3, 44.5,
  45.4, 46.2, 47.2, 47.8, 49.2, 50.2, 50.9, 51.6, 52.2,
  53, 54, 55.8, 58, 61.5, 63, 65,
];
const server = await serve({port: 0});
let browser;
try {
  const args = ['--no-sandbox', '--enable-unsafe-swiftshader'];
  if (process.env.CHROMIUM_PATH === '/tmp/chromium') {
    args.push('--single-process', '--no-zygote', '--in-process-gpu', '--use-gl=angle', '--use-angle=swiftshader');
  }
  browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined, args});
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
  await page.goto(`http://127.0.0.1:${server.port}/projects/black-box-journey/index.html?width=360`, {waitUntil: 'networkidle'});
  await page.waitForFunction(() => window.renderSafe || window.renderError, {}, {timeout: 120000});
  assert.equal(await page.evaluate(() => window.renderError), undefined);
  const stats = await page.evaluate(() => window.worldStats);
  assert.ok(stats.terrain.continuousSurface);
  assert.equal(stats.outdoorPlatformCount, 0);
  assert.ok(stats.vegetation.trees > 10000);
  assert.equal(stats.vegetation.species.length, 7);
  assert.equal(stats.water.continuousRiver, true);
  assert.equal(stats.infrastructure.bridges, 1);
  const visibility = await page.evaluate(() => window.auditStaticSightlines());
  assert.deepEqual(visibility, [], 'Terrain, vegetation or fixtures block the recorder');
  const journey = await page.evaluate(() => window.auditJourney());
  assert.deepEqual(journey.collisions, []);
  assert.ok(journey.minimumTerrainClearance > 2.5);

  const result = await page.evaluate(times => {
    const canvas = document.querySelector('#film');
    const context = canvas.getContext('2d');
    const pixels = () => context.getImageData(0, 0, canvas.width, canvas.height).data;
    const reports = [];
    for (const time of times) {
      window.setT(time);
      const a = pixels();
      window.setT(0);
      window.setT(time);
      const b = pixels();
      let maximum = 0;
      let total = 0;
      let spread = 0;
      for (let i = 0; i < a.length; i += 4) {
        spread += Math.abs(a[i] - a[i + 1]) + Math.abs(a[i + 1] - a[i + 2]);
        for (let c = 0; c < 3; c++) {
          const delta = Math.abs(a[i + c] - b[i + c]);
          maximum = Math.max(maximum, delta);
          total += delta;
        }
      }
      reports.push({time, maximum, mean: total / (a.length * 0.75), spread, frame: window.frameInfo});
    }
    window.setT(42.3);
    const before = pixels();
    window.setT(42.3 + 1 / 24);
    const after = pixels();
    let motion = 0;
    for (let i = 0; i < before.length; i += 4) if (before[i] !== after[i] || before[i + 1] !== after[i + 1]) motion++;
    window.setT(42.3);
    const captioned = Array.from(pixels());
    window.setCaptions(false);
    const clean = pixels();
    let captionChanges = 0;
    for (let i = 0; i < clean.length; i++) if (clean[i] !== captioned[i]) captionChanges++;
    return {reports, motion, captionChanges};
  }, times);

  for (const report of result.reports) {
    assert.ok(report.spread > 500000, `Blank/grayscale frame ${report.time}`);
    assert.ok(report.maximum <= 1 && report.mean < 0.1, `Nondeterministic seek ${report.time}`);
    const frame = report.frame;
    assert.equal(frame.continuousTake, true);
    assert.equal(frame.motionBlending, false);
    assert.ok(frame.terrainClearance > 2.5);
    for (const person of frame.peopleClearance) {
      assert.ok(person.clearance > 1.2);
      assert.ok(person.screenOverlap < 0.0001);
    }
    if (frame.focus > 0.999) {
      assert.ok(frame.screenBounds.min[0] >= -0.842 && frame.screenBounds.max[0] <= 0.842);
    }
  }
  assert.ok(result.motion > 100);
  assert.ok(result.captionChanges > 100);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({stats, journey, ...result}, null, 2));
  console.log('PASS: shared geographic surface, regional mixed forest, real river/bridge, all-frame terrain and focus sightlines, 48 deterministic rendered poses, casting, captions and movement.');
} finally {
  await browser?.close();
  await server.close();
}
