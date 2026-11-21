# Five-second character-style test

[Watch/download the MP4](delivery/character-style-5s-720p.mp4) · **5.00 seconds · 720 × 1280 · 30 fps · 150 frames · intentionally silent**

An original cartoon engineer in an illustrated harbor workshop, based on the design/acting findings in the [history-reference analysis](../../references/history-characters/ANALYSIS.md). This is a standalone visual prototype for user review, not a replacement of the existing ship film or a claim of reference parity.

## Action

- **0–1.35 s:** short four-step entrance with separate planted/swing foot paths and moving knees/arms.
- **1.35–2.15 s:** raised hand, eyebrow/mouth change and blink.
- **2.05–4.55 s:** eased point toward the miniature ship's forefoot, with a gaze/head change and a brief target highlight.
- **4.55–5 s:** return/settle into a smile.

The outlined character has softly shaded face, helmet and jacket, independent head/face/limb controls and a task-specific gesture. It is drawn directly as articulated Canvas 2D illustration, **not** a full-body texture on a billboard, a realistic 3D human, or an imported/copied reference character. It does not yet demonstrate a full profile/three-quarter turnaround or a reusable production 3D rig.

No narration, music or synthesized voice is included. The five-second visual test does not alter the accepted ship narration, timing, geometry or camera.

## Files and reproduction

- `index.html`, `scene.js`: deterministic editable illustration and browser replay; `window.setT(seconds)` supports frame seeking.
- `render.mjs`: local Playwright / FFmpeg export; uses existing Animation dependencies.
- `delivery/character-style-5s-720p.mp4`: finished silent H.264 portrait video.
- `delivery/poster.png`, `delivery/production.json`: preview and encoded-file/source measurements.

From the repository root:

```sh
node Animation/projects/character-style-test/render.mjs --stills
node Animation/projects/character-style-test/render.mjs
```

Use the existing Animation preview server at `/projects/character-style-test/index.html` for replay. The sandbox Chromium additionally needs `CHROMIUM_PATH=/tmp/chromium` and `LD_LIBRARY_PATH=/tmp/al2023/lib:/tmp`; those paths are runtime-only.

## Actual checks

All 150 frames exported with zero observed browser runtime/console errors, finite/bounded foot locations, and deterministic out-of-order seeking. The final MP4 decodes in full, reports exactly five seconds / 150 frames / 720 × 1280 / 30 fps and no detected black interval. Representative stills from the encoded video were visually inspected. This is not every-frame human review, exact reference parity or user approval. The original approved-project lock remains intact.
