# TV12 Three.js 30-second depth demo (v3)

From this directory:

```sh
npm ci
node server.mjs   # interactive preview on 0.0.0.0:3000
node render.mjs   # deterministic 720-frame MP4 export via Chromium + FFmpeg
```

Render prerequisites: Node.js, Python with imageio-ffmpeg, tar, Linux compatible with packaged Chromium. All JS and browser dependencies are npm-pinned in package-lock.json. No CDN needed. Server is a development-only static repository viewer; do not expose publicly as production hosting.

Output: `output/tv12_demo_v3_threejs.mp4` at repository root. 30 seconds, 1280×720, 24 fps, H.264 limited-range yuv420p, AAC 48 kHz. Complete decode verified: 720 frames, exit 0. One extracted frame was inspected to check successful scene rendering; subjective motion approval remains outstanding.

Actual Three.js WebGL scenes use subdivided textured geometry with heuristic bas-relief displacement, perspective camera orbit/truck/dolly moves, independent foreground particle planes, subtle vignette and 0.7-second eased render-target cross-dissolves. No handheld wobble or hard punch-ins. This is image-based 2.5D geometry in a true 3D renderer, NOT recovered object geometry, semantic subject segmentation or unseen-surface reconstruction. Depth is an artistic center-biased approximation and may bend straight scene lines. No generative image replacements are used.

Original narration is used without gain processing or added music. Timing still derives from image labels; transitions intentionally overlap adjacent visuals around cue boundaries without changing total audio/video duration. Full SRT and full-delivery resolution remain unresolved. Full render is not approved or started.
