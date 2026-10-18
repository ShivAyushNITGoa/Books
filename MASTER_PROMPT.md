# TV6 MASTER PROMPT — SRT → Image Prompts → Images → Final 2K Video

> Hand this whole document to one agent and it does the entire job.
> It is the complete, validated recipe for the Talk2Society TV6 video pipeline
> (482-cue Hindi story video, 2K, no captions, 5-part GitHub delivery).

---

You are an autonomous media-pipeline agent. Build the complete **Talk2Society TV6** story video end-to-end from the inputs below and ship it to the GitHub repo. Do every stage in order; do not skip, batch-summarize, or re-derive anything. Follow the Hard Rules exactly.

## Inputs (all from GitHub — repo `ShivAyushNITGoa/Books`, branch `arena/a43152ca-books`)

1. **`tv6.srt`** — 482 cues, Hindi narration. Cue N owns the window `[start_N, start_{N+1})`; the last cue runs until the VO ends.
2. **The 6 voiceover MP3s at the repo root** — the six `TV6 p1.mp3 … p6.mp3` files (exact names include spacing/case variants, e.g. `TV6  p1.mp3`, `TV6 P4.mp3`); always use them **in order p1→p6**. If `audio/tv6_master.mp3` already exists, use it and skip Stage 3's concat.
3. (Only when starting from scratch) everything else is produced by the stages below: `prompts/`, `images/`, `images_up4x/`, `audio/tv6_master.mp3`, the final parts.

## Hard Rules (non-negotiable)

- **R1 — Packs of 10.** Image generation happens **strictly in batches of 10** — never more, never fewer per batch.
- **R2 — Single-run prompt pack.** SRT → image prompts is done in **ONE run**: parse all 482 cues in a single pass and emit the **complete** pack (all entries) before generating any image. No chunked or partial prompt runs.
- **R3 — 1 cue : 1 image : 1 duration.** Every created image is used exactly once for its own cue window. No image is ever shown for another cue's duration; no image is reused; a missing image is a **HARD FAIL** — no placeholders, no silent reuse, stop and regenerate.
- **R4 — VO is the provided GitHub audio.** No re-recording, no TTS, no re-editing. The only allowed audio operation is concatenating the 6 parts into the master.
- **R5 — Repo delivery, < 100 MB per file.** No git-lfs. The final video ships as **N parts**, each under GitHub's 100 MB per-file limit.
- **R6 — No captions/subtitles** in the final video (burn-in only on explicit request; font `fonts/NotoSansDevanagari.ttf`, `tv6.srt` sidecar).

## Stage 1 — SRT → image prompt pack (single run, per R2)

1. Parse the **entire** SRT in one pass. Derive each cue's **label** from its start timestamp: `M-SS` (minutes unpadded, seconds zero-padded, e.g. `0-13` = 0:13); on collision append `-ms` (e.g. `0-03` vs `0-03-930`).
2. Emit **one prompt per cue (482) + the `#Host` character reference (1) = 483 entries**, all in this single run, into `prompts/TV6_Image_Prompts_*.txt` as `#label` blocks, plus a machine-readable `prompts/manifest.json` (label → prompt map).
3. Each scene prompt = **one line: [shot size] + [subject] + [action] + [one mood beat]**, followed by the **Locked Style Phrase (below), byte-identical in every block**.
4. Keep the story world consistent: recurring characters must match the `#Host` reference and their earlier appearances (wardrobe, props, face); locations and objects stay continuous between adjacent cues.
5. Every prompt must forbid generated text: no lettering, numbers, captions, logos, watermarks.
6. **Validate before Stage 2:** 482 scene entries + 1 host ref, labels unique, one per cue in SRT order.

### Locked Style Phrase (append verbatim to every scene prompt)

```
painterly Indian editorial illustration, semi-realistic painted style close to
photographic likeness, not cartoon and not photorealistic, visible brushstrokes
and canvas texture, rich oxblood red and deep crimson accents, near-black and
dark umber shadows, warm amber and aged brass practical light used sparingly,
dark red-tinted low-key atmosphere, one controlled light source, soft controlled
tonal modelling with deep shadow shapes, realistic human proportions and natural
skin tones, restrained expressive faces, grounded Indian setting matching the
scene's economic and location tier, clear readable silhouettes, mature
graphic-novel painting sensibility, generous negative space, no text, no
lettering, no numbers, no captions, no logos, no watermark, no cartoon, no
caricature, no glossy 3D, no anime, no neon colours, no cinematic grading, no
lens flare, no heavy bokeh, no rim light, 16:9 horizontal composition
```

### `#Host` reference (first pack entry, verbatim)

```
full-body Talk2Society painted editorial illustration of A. K. Chandradipti,
Indian man in his mid-30s, cold calculating strategist in the manner of a
Machiavellian prince, unsmiling expression with intense assessing eyes, still
and not a teacher, medium warm-brown complexion, realistic skin tones,
naturally proportioned oval-to-square face, defined jawline, thick dark
eyebrows, deep-set dark-brown eyes, straight proportionate nose, medium lips,
full neatly groomed beard connected to moustache, dark thick wavy
medium-length hair loosely swept back with strands over the forehead,
charcoal-black textured blazer unbuttoned over a plain black crew-neck tee,
deep oxblood velvet-look mantle draped over both shoulders to mid-thigh, not
pooling on the floor, dark wristwatch with metallic case, hands clasped low in
front, no props held, slim-to-average build, not muscular, neutral relaxed
standing pose facing slightly toward camera, full body visible from head to
feet, plain aged-ivory neutral background, semi-realistic painted style close
to photographic likeness, visible brushstrokes, canvas texture, soft controlled
tonal modelling, deep oxblood red accent, near-black and dark umber shadows,
not cartoon, not photorealistic, not cinematic, no text, 16:9
```

## Stage 2 — prompts → images (packs of 10, per R1)

1. Generate **strictly 10 images per batch** (483 prompts → 49 packs, last pack = 3).
2. Save each as `images/<label>.jpg` at native resolution (1376×768), JPEG quality ≥ 90.
3. After **every** pack: verify all 10 files exist and are non-empty; keep a running counter until **483/483**. A cue without a valid image = stop and regenerate it (R3).
4. Extra/orphan images are allowed (they stay unused); a moderated/failed generation gets a **minimal reword** (keep the Locked Style Phrase) and is retried in the next pack.

## Stage 3 — voiceover master (per R4)

- If only the 6 parts exist: **raw-concatenate** them p1→p6 → `audio/tv6_master.mp3`. Record the part boundaries — known values: `0 / 184.35 / 499.67 / 835.40 / 1175.91 / 1414.12 / 1897.05 s` (re-measure if the files differ).
- Expected master duration ≈ **1897.08 s**. The SRT ends ~98 s **before** the VO: that tail is narration without cues — the final image is held over it (intentional, not a reuse).

## Stage 4 — AI super-resolution 2× (for the 2K build)

- Upscale all 483 used images with **Real-ESRGAN, anime-6B model**: run the 4× model on **half-size input** (INTER_AREA downscale, `outscale=4`), `tile=256` (4 GB-safe), save at **2×** → `images_up4x/<label>.jpg` (2752×1536, q93).
- Weights: `RealESRGAN_x4plus_anime_6B.pth`, **sha256 `f872d837d3c90ed2e05227bed711af5671a6fd1c9f7d7e91c911a61f155e99da`** (xinntao/Real-ESRGAN release v0.2.2.4, or any mirror — verify the hash).
- Budget: ~20 s/image on a 2-core CPU → ~2.6 h for 483. Run **resumable** (skip existing outputs), log progress every 25 images.

## Stage 5 — final video (3-stage build, `build_video.py`)

- **5a Segments** — per cue, one 24 fps segment covering its exact window (last cue: until VO end + 2 s tail). Effects/transitions: **Ken Burns** from a 4-pattern cycle (slow zoom-in / zoom-out / pan-right / pan-left), 10 % zoom range; **0.2 s fade in/out at every cut**. Frame budget: `frames_i = floor(dur_i × 24)`, the last segment takes the remainder → **boundary drift ≤ 1 frame**; total = `max(SRT span, VO duration) + 2 s`.
  - Encode: **h264 yuv420p, 2560×1440 (QHD), CRF 24, 24 fps**. (Only for a single-file 720p deliverable: `1280×720`, CRF 27.)
- **5b Concat** — stream-copy all 482 segments → `output/video_only.mp4` (silent).
- **5c Final mux** — mux the master VO (AAC, 48 kHz stereo, 92–96 kb/s), `-movflags +faststart`, `-t <total>` → `output/tv6_final.mp4`. **No captions (R6)** — drop `--no-captions` only if captions are explicitly requested.

## Stage 6 — split into parts (per R5)

- Split at the **VO chapter boundaries**: `0 / 499.67 / 835.40 / 1175.91 / 1414.12 / end` → **5 parts** (recompute from the real part durations if the VO differs). Each boundary maps to the first cue starting at/after it.
- Per part: stream-copy concat of that cue's segment range + its VO slice (AAC 92 k) → `tv6_2k_partN.mp4`.
- **Every part < 100 MB** (target ≤ 97 MB). Over cap → re-encode that part at CRF+1 or re-split at the nearest cue.
- Expected sizes ≈ **87.5 / 62.8 / 59.3 / 43.3 / 70.0 MB** (8:21 / 5:35 / 5:41 / 3:59 / 8:12; part 5 ends with the final-image hold + 2 s silent tail).

## Stage 7 — ship to GitHub

1. Copy the 5 parts to the repo root.
2. Commit with the build scripts (`build_video.py`, `scripts/split_parts.py`, `scripts/build_master_audio.py`), `tv6.srt`, `images/`, `audio/`, `prompts/`, `fonts/`, and a `tv6_README.md` (part order, specs, rebuild commands).
3. Push to the working branch; open a PR to `main` when asked.
4. `.gitignore`: `output/`, `images_up4x/`, `models/`, `__pycache__/`.

## Acceptance checks (ALL must pass before declaring done)

- **A1.** 482 cues = 482 images = 482 segments; zero missing, zero reused (R3).
- **A2.** Every part probes: 2560×1440, 24 fps, h264 High yuv420p + AAC 48 kHz stereo; part durations match their chapter spans; total = VO + 2 s.
- **A3.** Extract ≥ 2 frames per part and visually confirm: correct scene, painterly style, **no captions**, no artifacts.
- **A4.** A/V spot-check at a random cue: the on-screen scene matches that cue's narration.
- **A5.** Commit + push succeed; PR (if requested) is open and mergeable.

## Environment notes

- No `ffprobe` available: parse `ffmpeg -i` output. ffmpeg via `pip install --break-system-packages imageio-ffmpeg` (`imageio_ffmpeg.get_ffmpeg_exe()`).
- 2-core / 4 GB CPU box: torch CPU `set_num_threads(2)`, Real-ESRGAN `tile=256`; 2K segment stage ≈ 35 min; pushing ~320 MB ≈ 20–30 min.
- The sandbox can be wiped between turns: **push as soon as anything valuable exists**; recover with `git fetch origin <branch> && git reset --hard <sha>`.
