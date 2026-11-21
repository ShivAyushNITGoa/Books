# TV12 Three.js full build (v5 · expanded effects)

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

## v4 camera vocabulary
Current `render.mjs` exports `output/tv12_demo_v4_camera_styles.mp4`.
Nine shots now use focus push-in, left-to-right truck, pull-out reveal,
right-to-left truck, rising pedestal, diagonal dolly, shallow orbit,
focus pull-out and a restrained closing push. Quintic easing gives zero
endpoint velocity and acceleration. Approximate manually chosen focus points
and a five-tap screen-space peripheral blur suggest selective focus; this is
not physically based optical depth of field or automatic subject tracking.
Transitions cycle through dissolve, feathered horizontal reveal, optical
zoom-blend and defocus dissolve, all over 0.7 seconds. Foreground motes and
heuristic displaced geometry remain from v3.

v4 technical QA: full decode exits 0; 720 frames / 30.00 seconds, 1280×720,
24 fps. One mid-shot frame inspected for successful rendering. Motion, focus
and transition quality require user review. Original narration and provisional
filename timing are unchanged. Full rendering remains gated on approval.

## v5 expanded effects (current)
`index.html` now carries a wider, fully smooth vocabulary:
- **16 camera styles** cycling per cue: the original nine (push-in, truck
  L→R/R→L, pull-out, pedestal, diagonal dolly, orbit, focus pull) plus arc
  sweep, crane down, lateral sway push, dutch settle push (±~1.3° roll),
  rise-and-open, settle drift (smoothstep two-phase) and counter orbit.
- **11 transition modes** cycling deterministically across the 301
  boundaries: dissolve, feathered horizontal reveal, optical zoom blend,
  defocus dissolve, feathered vertical reveal, diagonal feathered wipe,
  soft radial iris, warm glow dissolve, converging directional smear,
  chromatic soft split, and counter-roll cross.
- **Duration-driven speed and length**: each image's own duration scales
  camera travel amplitude (`0.7–1.4×`) and the transition half-window
  (`clamp(0.22 + 0.06 × min(neighbour durations), 0.26, 0.52)` s), so short
  cues get brisk, tighter moves and long holds get wider, more languid ones.
- **Seamless by construction**: camera moves and blend weights use quintic
  easing (zero endpoint velocity/acceleration); every mode collapses to
  identity at blend 0 and to the incoming frame at blend 1, so there are no
  sudden screen changes — only smooth blends. Total duration, cue order and
  narration timing are untouched; transitions only overlap around cues.

v5 benchmark (96-frame opening window, same host): 19.95 s ≈ 0.208 s/frame
→ roughly 1.7–2 hours for the 29,640-frame full render on this CPU-only
host. See RENDER_BENCHMARK.json. Frames at 1.0/2.9/3.1/3.3/3.6 s inspected:
clean push-in and feathered transition, no blank frames or mesh edges.

## Full build and GitHub delivery
Run `python3 -u editing/three-demo/full_build.py` from the repository root.
The full build uses all 302 manifest images and provisional filename timings,
with the original narration plus a two-second visual tail, rounded to 24 fps.
It renders resumable 120-second chunks, decodes each, checks the master frame
count, pushes source and a QA report to the session branch, then publishes
master/parts as GitHub release assets to avoid large binaries in Git history.
A failed render or QA check stops publication. Large files remain ignored locally.
Current full default is 720p, CRF 24; the branch constant must match the
authorized session branch.

## Optimized CPU rendering
The export path now renders/captures the canvas in one browser call, avoiding
Playwright screenshot compositor/font synchronization. Outside transitions it
renders the scene once and binds that texture to both blend inputs. Geometry
uses 24×14 subdivisions instead of 96×54 for the shallow relief. MSAA and unused
canvas depth/stencil buffers are disabled; textured images and the focus shader
remain, though extremely fine edges can differ from the MSAA version. Resolution
and temporal sampling remain native 1280×720 / 24fps; no frame interpolation.

Controlled 96-frame opening benchmark (including a transition): original
21.71 seconds; optimized 16.45 seconds — 1.32× throughput, 24.2% less render time.
See RENDER_BENCHMARK.json. This short test is not a full-video runtime guarantee.
An experimental fused material path was tested and rejected as slower.
Both benchmark videos decoded successfully; an optimized frame was inspected.
Run exports with `RENDER_CAPTURE=screenshot` and `RENDER_PAGE=/path.html` for
comparison testing. These options are not used by the normal full build.
