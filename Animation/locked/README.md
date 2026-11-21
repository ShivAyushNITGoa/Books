# Approved reference — LOCKED release 1.0.0

**Do not edit this directory.** Make new projects in `Animation/projects/`; evolve the reusable engine in `Animation/engine/`. A future approved reference should be a separate release, not a replacement of this one.

Approved repository commit: `4f52b6d` (the refined English Scarcity & Attraction demo).

Authoritative video: [`source/public/demo/classroom-scarcity-30s-v2.mp4`](source/public/demo/classroom-scarcity-30s-v2.mp4).

- 30.00 seconds, 900 frames, 1080×1920, H.264/AAC.
- Exact copies of the approved video, poster, mixed preview audio, lossless render mix, SRT, world source, HTML and mouth envelope.
- Original narration clips, assembled WAV, timings, script notes, rendering/voice/Foley scripts, vendored Three.js, font and license notices.
- Style/refinement analysis retained alongside the snapshot.

From `Animation/`:

```sh
npm run verify-lock
npm run preview -- --locked
# Read-only re-render / screenshot, always written under output/:
npm run render -- --locked --still 16 --out output/approved.png
npm run render -- --locked --out output/approved-rerender.mp4
```

The standalone renderer uses the included lossless `source/audio/approved-mix.wav` when re-rendering the frozen scene. The delivered MP4 is the authoritative approved artifact; different browsers/drivers/encoders may not produce bit-identical pixels or video bytes. To experiment with an audio rebuild, copy `source/` into an **unlocked working directory under output/** first, install `render/requirements-voice.txt`, then run the archived Python tools there. Never regenerate files inside this directory.

`manifest.json` records SHA-256 and byte counts for the snapshot, reference inputs and the original approved files in the parent repository. `verify-lock` verifies snapshot hashes; it also checks original paths when they are present (`--strict-originals` requires them). CI additionally rejects changes to this directory relative to a base commit that already contains the release, even if someone updates its manifest.

This is an integrity/preservation policy, **not a GitHub permission setting**. Repository administrators can still intentionally change files or disable workflows; required branch checks must be enabled in repository settings for merge enforcement. The original approved files outside `Animation/` remain intact, so the previously shared video link continues to work.
