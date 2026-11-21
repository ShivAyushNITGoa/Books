# Dario character + camera reference package

Start with **[ANALYSIS.md](ANALYSIS.md)**. This is the corrective direction after the user rejected the flat five-second engineer sample. Both **stylized dimensional character construction** and **camera handling** are required; do not substitute one for the other.

## Evidence

- `frames.html` / `frames/`: all 5,339 decoded frames in 30 sequential thumbnail sheets. View locally through the existing Animation server, or open `frames.html` directly in a browser. GitHub displays HTML as source; the individual JPEGs are also directly viewable there.
- `per-frame-audit.csv`: 5,339 rows with frame-relative time, luminance/change diagnostics, and global/environment-proxy screen-space optical-flow fits. Empty fit cells mean unavailable, not zero motion.
- `review-blocks.csv`: 30 contiguous review blocks covering every frame, with cast/camera observations. These six-second blocks are not shot boundaries.
- `evidence/`: larger character views, camera sequences and a full-timeline feature-motion plot.
- `frame-audit-summary.json`, `presentation-timing-summary.json`, `review-manifest.json`: provenance, counts, review limits and package hashes.

All atlas pages were inspected at thumbnail scale. Selected native-resolution and larger temporal views support detailed conclusions. This is not full-resolution inspection of every frame or recovered 3D camera ground truth. Audio was decoded, not manually listened to. No replacement video is claimed in this package.

The 30 every-frame sheets and one-row-per-frame table are included because the user explicitly requested frame-by-frame evidence. Full-size scratch extractions and the duplicate source stay in ignored output, rather than committing thousands of image files or another MP4 copy. The user-supplied source MP4 is already present at the repository root. Excerpts here are for the requested reference analysis, not a grant to reuse source characters, logos or other artwork.

## Reproduce the diagnostics

Use a separate optional Python environment; these packages are **analysis tools**, not new animation playback dependencies. The script uses DejaVu Sans from the normal Debian font path for atlas labels.

```sh
python3 -m venv Animation/output/dario-analysis-venv
Animation/output/dario-analysis-venv/bin/pip install \
  -r Animation/references/dario-character-camera/requirements.txt

Animation/output/dario-analysis-venv/bin/python \
  Animation/references/dario-character-camera/audit_frames.py \
  'Dario Amodei_ Why Claude’s Creator Fears AI.mp4' \
  Animation/output/dario-reanalysis
```

This regenerates every-frame atlas pages, overview pages, detailed raw per-frame JSON, the flattened measurement CSV and a numerical summary. The human-written analysis/review ledger, presentation-timing cross-check and selected detail figures are separate review work, not automatically generated insight.

The fixed environment-proxy mask is only a heuristic. Actors, moving props, captions, parallax, blur and edits may contaminate fits. The script deliberately does not label optical flow as meters/second, focal length, 3D orbit angle or exact shot count. Independent FFmpeg complete decode and PTS inspection cross-checked 5,339 frames and an approximately 1/30-second presentation cadence.
