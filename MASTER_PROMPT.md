# MASTER PROMPT — Talk2Society Story Video Pipeline (any episode)

> Hand this whole document to one agent and it does the entire job for **any similar Talk2Society video**.
> Complete, validated recipe: raw transcript → ElevenLabs v4 tagged transcript (single run)
> → voiceover → image prompt pack from the episode SRT (single run) → images (packs of 10)
> → 2K video → multi-part GitHub delivery.
> The build scripts are **integrated below** (Stages 5–6) — the document is self-contained.
>
> Episode parameters: `{ep}` = episode slug (e.g. `tv6`), `{N}` = number of SRT cues (e.g. 482 for TV6).
> Every episode-specific number (cue count, VO part lengths, part sizes) is **measured from the actual files**, never assumed.

---

You are an autonomous media-pipeline agent. Build the complete **Talk2Society `{ep}`** story video end-to-end from the inputs below and ship it to the GitHub repo. Do every stage in order; do not skip, batch-summarize, or re-derive anything. Follow the Hard Rules exactly.

## Inputs

1. **Raw transcript** — the plain-text narration (no markup). Single source of truth for the voiceover and (if no SRT is provided) the cue sheet.
2. **`{ep}.srt` — the episode cue sheet** (provided with the transcript; TV6 has 482 cues). Cue N owns `[start_N, start_{N+1})`; the last cue runs to the VO end. *If no SRT is provided*, derive `{ep}.srt` by aligning the transcript to the Stage 2 master VO in one pass — same cue ownership, labels = `M-SS` from each cue's start timestamp (minutes unpadded, seconds zero-padded; on collision append `-ms`, e.g. `0-03` vs `0-03-930`), then validate: `{N}` cues, labels unique, in transcript order.
3. **Channel constants** — embedded below (channel-locked style phrase, `#Host` reference, narrator register). Same for every episode.
4. (Optional, only for episodes that already have them) the episode's pre-recorded VO MP3s at the repo root (named like `TV6 p1.mp3 …` with spacing/case variants — always use them in order p1→pN). If `audio/{ep}_master.mp3` already exists, use it.

## Hard Rules (non-negotiable)

- **R1 — Packs of 10.** Image generation happens **strictly in batches of 10** — never more, never fewer per batch.
- **R2 — Single-run stages.** Any stage whose output is a complete document — transcript → tagged transcript (Stage 1), SRT → image prompt pack (Stage 3) — is done in **ONE run**: read the entire input in a single pass and emit the **complete** output before moving on. No chunked or partial runs.
- **R3 — 1 cue : 1 image : 1 duration.** Every created image is used exactly once for its own cue window. No image is ever shown for another cue's duration; no image is reused; a missing image is a **HARD FAIL** — no placeholders, no silent reuse, stop and regenerate.
- **R4 — VO provenance.** Either (A) the episode's provided VO MP3s — no re-recording, no TTS, no edits (concat is the only allowed operation), or (B) a VO synthesized from the raw transcript via **ElevenLabs `eleven_v4` using the Stage 1 tagged transcript**. Never mix paths within one episode.
- **R5 — Repo delivery, < 100 MB per file.** No git-lfs. The final video ships as **N parts**, each under GitHub's 100 MB per-file limit.
- **R6 — No captions/subtitles** in the final video (burn-in only on explicit request; font `fonts/NotoSansDevanagari.ttf`, `{ep}.srt` sidecar).

## Stage 1 — raw transcript → transcript with voice tags for ElevenLabs v4 (single run, per R2)

Process the **entire** transcript in one run. Output: `{ep}_transcript_v4_tagged.txt` — the **identical text** with Eleven v4 audio tags inserted, plus a tagging log `tagging_rationale.md` (why each tag, which beat it serves).

Tagging protocol — **thoughtful placement, never random emotion**:

1. **Real tags only.** Use only the verified Eleven v4 catalog below (official ElevenLabs docs). Free-form plain-language tags are allowed *only* as documented compound directions (e.g. `[low, steady voice, restrained urgency]`) — and only when no catalog tag fits the beat.
2. **Emotion carries forward** — a tag colours everything until the next tag. Therefore: **tag at shift points only** (scene beats, tone changes, revelations), one tag per clause. Do NOT tag every sentence; do NOT stack two emotion tags on the same words.
3. **Reactions are earned.** `[laughs]`/`[chuckles]` only where the content is actually funny (dry humour → `[chuckles]`, real laugh → `[laughs]`); `[sighs]` for genuine weariness/resignation; `[gasps]` for real shock; `[clears throat]` for formal resets; `[crying]`/`[starts crying]` only for true emotional breaks. Never decorate.
4. **Thinking/hesitation:** `[thoughtful]` + ellipses, `[hesitates]`, or `[pause]` before a considered answer; "Hmm." written as text where the narration ponders.
5. **Pauses:** `[pause]` / `[long pause]` at rhetorical breaks — after a heavy statement, before a punchline, at chapter turns. Punctuation (ellipses, dashes, line breaks) handles ordinary breathing; use explicit pause tags sparingly (a natural voice pauses on its own).
6. **Pacing:** `[slowly]` / `[drawn out]` for weight and gravity; `[rushed]` only for genuine urgency; `[snappy]` for clipped irritation; `[speedy]` for excitement build-ups.
7. **Volume/intimacy:** `[whispers]` for confessional or intimate beats; `[softly]` for consolation; `[shouts]` reserved for rare real outbursts; `[hushed]` for tense quiet. Capitalise a word to stress it.
8. **Register for this narrator (channel voice):** reflective, low-key, oxblood-toned storyteller. Default register is calm-reflective (`[thoughtful]`, `[curious]`, `[content]`, `[trusting]`, `[peaceful]`); heat is **earned by the story** — `[startled]`, `[anxious]`, `[stressed]`, `[bitter]`, `[mad]`, `[despair]`, `[let down]` appear only where the narrative genuinely goes there, and return to the base register after. Laughter is rare and dry.
9. **Density target (a ~30-min narration):** roughly **80–150 well-motivated tags total** — delivery tags about one per 15–30 s of speech, reactions only where earned, pauses at major turns. Scale with episode length. Under-tagged = flat and robotic; over-tagged = melodrama. Both fail the rating below.
10. **Excluded:** no sound-effect tags (`[applause]`, `[footsteps]`, `[light rain]` …) — clean VO only, the video has its own world. No accent tags unless a character demands one (experimental — audition first).
11. **Text is sacred:** never reword, translate, summarise, or delete transcript words to fit tags. Tags wrap around the text; they never replace it.

**Verified Eleven v4 tag catalog** (ElevenLabs official; works on `eleven_v4`, `eleven_v4_turbo`, `eleven_v3`; no SSML — tags + punctuation are the control layer):

| Category | Tags |
|---|---|
| Emotion — high energy | `[excited]` `[playful]` `[amazed]` `[powerful]` `[proud]` `[optimistic]` `[startled]` |
| Emotion — heated | `[mad]` `[aggressive]` `[bitter]` `[critical]` `[repelled]` |
| Emotion — tense | `[anxious]` `[stressed]` `[scared]` `[threatened]` `[vulnerable]` `[confused]` `[busy]` `[nervous]` `[nervously]` `[worried]` `[frustrated]` `[disbelief]` |
| Emotion — low energy | `[tired]` `[bored]` `[distant]` `[despair]` `[let down]` `[sad]` `[sorrowful]` `[crying]` `[starts crying]` |
| Emotion — calm/reflective | `[peaceful]` `[content]` `[curious]` `[thoughtful]` `[trusting]` `[hopeful]` `[smug]` `[triumphant]` |
| Character tones | `[sarcastic]` `[mischievously]` `[intrigued]` `[puzzled]` `[jittery]` `[frazzled]` `[disgusted]` |
| Delivery & volume | `[whispers]` `[shouts]` `[softly]` `[quietly]` `[hushed]` `[barely audible]` `[booming]` `[low, threatening]` |
| Pacing | `[slowly]` `[rushed]` `[snappy]` `[speedy]` `[drawn out]` `[hesitates]` `[slows down]` |
| Human reactions | `[laughs]` `[laughs harder]` `[starts laughing]` `[chuckles]` `[wheezing]` `[sighs]` `[exhales]` `[gasps]` `[clears throat]` `[snorts]` `[coughs]` `[gulps]` |
| Pauses | `[pause]` `[long pause]` `[slight pause]` (or ellipses / line breaks) |
| Custom directions | `[whispering, fearful]`, `[a tired detective who has heard it all before]`, `[starting calm, then losing patience]`, `[out of breath after running up the stairs]` |

**Rating loop (pass only at ≥ 8/10).**
After tagging, rate the tagged transcript **out of 10** on five criteria, writing one justification sentence per score:

1. **Human-likeness** — would this sound like a person telling the story, not reading a script?
2. **Motivation** — is every tag caused by something in the words around it (no random emotion)?
3. **Restraint** — are tags at shift points only, with the base register doing the quiet work?
4. **Engagement** — do laugh/think/surprise/heat moments land where the story earns them?
5. **Character consistency** — does the whole thing stay in the channel narrator's voice?

**Pass = score ≥ 8.** If < 8: name the weakest criterion, fix that dimension, re-rate, repeat until ≥ 8. Log every iteration (score + what changed) in `tagging_rationale.md`. Do not advance to Stage 2 with an unlogged score.

## Stage 2 — voiceover master (R4)

- **Path B (default for new episodes):** synthesize with the ElevenLabs TTS API, model `eleven_v4` — tags inline in the text; ≤ 10,000 characters per generation, so split the tagged transcript at chapter/paragraph boundaries, generate each take, and concatenate in order → `audio/{ep}_master.mp3`.
- **Path A (episode with provided VO):** raw-concatenate the provided MP3s in order → `audio/{ep}_master.mp3` (or reuse the existing master). No edits (R4).
- **Record the actual part boundaries** (seconds, measured from the files) — they drive Stage 6's part splits.
- Tail rule: if the SRT ends before the VO, that tail is narration without cues — the final image is held over it (intentional, not a reuse).

## Stage 3 — SRT → image prompt pack (single run, per R2)

1. Emit **one prompt per cue ({N}) + the `#Host` character reference (1) = {N}+1 entries**, all in this single run, into `prompts/{EP}_Image_Prompts_*.txt` as `#label` blocks, plus a machine-readable `prompts/manifest.json` (label → prompt map).
2. Each scene prompt = **one line: [shot size] + [subject] + [action] + [one mood beat]**, followed by the **Channel-Locked Style Phrase (below), byte-identical in every block**.
3. Keep the story world consistent: recurring characters must match the `#Host` reference and their earlier appearances (wardrobe, props, face); locations and objects stay continuous between adjacent cues.
4. Every prompt must forbid generated text: no lettering, numbers, captions, logos, watermarks.
5. **Validate before Stage 4 (images):** {N} scene entries + 1 host ref, labels unique, one per cue in SRT order.

### Channel-Locked Style Phrase (append verbatim to every scene prompt)

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

## Stage 4 — prompts → images (packs of 10, per R1)

1. Generate **strictly 10 images per batch** ({N}+1 prompts → ⌈({N}+1)/10⌉ packs).
2. Save each as `images/<label>.jpg` at native resolution (1376×768), JPEG quality ≥ 90.
3. After **every** pack: verify all 10 files exist and are non-empty; keep a running counter until **{N}+1 / {N}+1**. A cue without a valid image = stop and regenerate it (R3).
4. Extra/orphan images are allowed (they stay unused); a moderated/failed generation gets a **minimal reword** (keep the Locked Style Phrase) and is retried in the next pack.

## Stage 5 — final video (3-stage build)

Build in three stages with the integrated builder below:

- **5a Segments** — per cue, one 24 fps segment covering its exact window (last cue: until VO end + 2 s tail). Effects/transitions: **Ken Burns** from a 4-pattern cycle (slow zoom-in / zoom-out / pan-right / pan-left), 10 % zoom range; **0.2 s fade in/out at every cut**. Frame budget: `frames_i = floor(dur_i × 24)`, the last segment takes the remainder → **boundary drift ≤ 1 frame**; total = `max(SRT span, VO duration) + 2 s`. Missing images hard-fail the build (R3).
- **5b Concat** — stream-copy all {N} segments → `output/video_only.mp4` (silent).
- **5c Final mux** — mux the master VO (AAC, 48 kHz stereo), `-movflags +faststart`, `-t <total>` → `output/{ep}_final.mp4`. **No captions (R6)** via `--no-captions`.
- Encode: **h264 yuv420p, 2560×1440 (QHD), CRF 24, 24 fps**. (Only for a single-file 720p deliverable: `--res 1280x720 --crf 27`.) The 1376×768 native art is scaled onto the 2560×1440 canvas by the builder (no AI super-resolution in this pipeline).

**Write the following to `build_video.py` (repo root) verbatim, then run:**

```
python3 build_video.py --dry-run                    # mapping + missing report
python3 build_video.py --limit 12 --res 2560x1440   # smoke test first
python3 build_video.py --res 2560x1440 --no-captions --crf 24 \
    --srt {ep}.srt --name {ep}                      # full build (images/)
```

```python
#!/usr/bin/env python3
"""
Talk2Society video builder (generic per episode)
=================================================
Assembles: per-scene images (images/ or --images dir) + master voiceover
(first MP3 in audio/, e.g. audio/{name}_master.mp3) + the episode SRT (--srt)
into one MP4 with Ken Burns motion, an optional sidecar .srt, and the VO.

Guarantees (per spec):
  * EXACTLY ONE image per SRT cue - N cues -> N distinct images.
  * Image <label> is shown only during its own cue window; it is never
    reused for another cue and no cue is shown over another cue's image.
  * The build HARD-FAILS if any of the images is missing (no dark
    placeholders, no silent reuse).

Timeline:
  * cue i owns [start_i, start_{i+1}) (last cue: [start_last, srt_end]).
  * After the last SRT cue the final image is held until the VO finishes
    (+2 s tail). Narration that runs past the last cue is an intentional
    hold of the final scene, not a reuse: no other cue exists after it.
  * Frame budget is allocated so cumulative boundary drift <= 1 frame.

Rendering (three stages, linear time, safe on 2-core machines):
  stage 1: each cue -> one 24fps segment (zoompan Ken Burns,
           4-pattern cycle, tiny fade in/out to soften cuts)
  stage 2: concat demuxer (stream copy) of the segments
  stage 3: mux the master VO (AAC, 48 kHz), optionally with burned-in
           SRT captions (Noto Sans Devanagari) -> output/{name}_final.mp4

Usage:
  python3 build_video.py --dry-run        # mapping + missing-file report
  python3 build_video.py --limit 12       # smoke test: first 12 cues
  python3 build_video.py                   # full build (1280x720)
  python3 build_video.py --res 854x480     # full build, 480p (smaller file)
  python3 build_video.py --srt tv7.srt --name tv7 --images images_up4x \
      --res 2560x1440 --no-captions --crf 24     # 2K clean episode build
  FFMPEG_BIN=/path/to/ffmpeg python3 build_video.py   # custom ffmpeg
"""
import argparse
import re
import shutil
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent
IMG_DIR = ROOT / "images"
AUD_DIR = ROOT / "audio"
OUT_DIR = ROOT / "output"
SEG_DIR = OUT_DIR / "segments"
SRT_PATH = ROOT / "tv6.srt"
FONT_DIR = ROOT / "fonts"          # Noto Sans Devanagari (Devanagari glyphs)

FPS = 24
W, H = 1280, 720          # default; pass --res for other resolutions
ZOOM = 0.10                # Ken Burns zoom range
CRF = 24                   # x264 quality (higher = smaller file)
TAIL_AFTER_VO = 2.0        # seconds of held final image after the VO ends
IMAGE_EXTS = (".jpg", ".jpeg", ".png", ".webp", ".bmp")
AUDIO_EXTS = (".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac")


# ---------------------------------------------------------------- ffmpeg loc
def find_ffmpeg() -> str:
    import os
    if os.environ.get("FFMPEG_BIN"):
        return os.environ["FFMPEG_BIN"]
    hit = shutil.which("ffmpeg")
    if hit:
        return hit
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        pass
    for cand in ("/home/user/tools/ffmpeg",):
        if Path(cand).exists():
            return cand
    sys.exit("ffmpeg not found. Install ffmpeg or `pip install imageio-ffmpeg`.")


# ---------------------------------------------------------------- SRT parse
def ts2sec(ts: str) -> float:
    h, m, s_ms = ts.strip().split(":")
    s, ms = s_ms.split(",")
    return int(h) * 3600 + int(m) * 60 + int(s) + int(ms) / 1000.0


def parse_srt(path: Path):
    """Return cues: dicts with n, start_str, start, end, text, label."""
    text = path.read_text(encoding="utf-8")
    cues = []
    for b in re.split(r"\n\s*\n", text.strip()):
        lines = b.strip().split("\n")
        if len(lines) >= 2 and "-->" in lines[1]:
            n = int(lines[0].strip())
            start_str, end_str = (t.strip() for t in lines[1].split("-->"))
            body = " ".join(l.strip() for l in lines[2:])
            cues.append({"n": n, "start_str": start_str,
                         "start": ts2sec(start_str), "end": ts2sec(end_str),
                         "text": body})
    # labels: M-SS (M unpadded, SS 2 digits); later collisions carry ms suffix
    cnt = defaultdict(int)
    for c in cues:
        h, m, s_ms = c["start_str"].split(":")
        s, ms = s_ms.split(",")
        base = f"{int(h) * 60 + int(m)}-{int(s):02d}"
        cnt[base] += 1
        c["label"] = base if cnt[base] == 1 else f"{base}-{ms}"
    return cues


# ---------------------------------------------------------------- assets
def index_images():
    idx = {}
    if IMG_DIR.exists():
        for p in sorted(IMG_DIR.iterdir()):
            if p.is_file() and p.suffix.lower() in IMAGE_EXTS:
                idx[p.stem.lower()] = p
    return idx


def find_image(idx, label: str, n: int):
    for stem in (label, f"#{label}", f"{n:03d}", str(n)):
        hit = idx.get(stem.lower())
        if hit:
            return hit
    return None


def find_audio(sub: Path):
    if not sub.exists():
        return None
    files = [p for p in sorted(sub.iterdir())
             if p.is_file() and p.suffix.lower() in AUDIO_EXTS]
    return files[0] if files else None


def media_duration(ffmpeg: str, path: Path) -> float:
    r = subprocess.run([ffmpeg, "-hide_banner", "-i", str(path)],
                       capture_output=True, text=True)
    m = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.?\d*)", r.stderr)
    if not m:
        return 0.0
    return int(m.group(1)) * 3600 + int(m.group(2)) * 60 + float(m.group(3))


# ---------------------------------------------------------------- timeline
def plan(cues, total, limit=None):
    """Per-cue segments [start, end) with an exact global frame budget.

    frames_i = floor(dur_i*FPS) for all but the last segment, which takes
    the remainder -> cumulative boundary drift <= 1 frame (41 ms).
    """
    if limit:
        cues = cues[:limit]
        total = cues[-1]["end"] + 1.0
    segs = []
    for i, c in enumerate(cues):
        start = 0.0 if i == 0 else c["start"]
        end = cues[i + 1]["start"] if i + 1 < len(cues) else total
        segs.append({**c, "start": start, "end": end, "dur": end - start})
    total_frames = max(int(round(total * FPS)), len(segs))
    assigned = 0
    for s in segs[:-1]:
        s["frames"] = max(int(s["dur"] * FPS), 2)
        assigned += s["frames"]
    segs[-1]["frames"] = max(total_frames - assigned, 2)
    return cues, segs


def kenburns(i: int, frames: int):
    """4-pattern cycle, on-based (stateless) zoompan expressions."""
    d = max(frames, 4)
    cy = "ih/2-(ih/zoom/2)"
    cx = "iw/2-(iw/zoom/2)"
    k = ZOOM
    p = i % 4
    if p == 0:    # slow zoom in
        return f"1+{k}*on/{d}", cx, cy
    if p == 1:    # slow zoom out
        return f"{1 + k}-{k}*on/{d}", cx, cy
    if p == 2:    # pan right
        return f"1+{k}", f"(iw-iw/zoom)*on/{d}", cy
    return f"1+{k}", f"(iw-iw/zoom)*(1-on/{d})", cy  # pan left


# ---------------------------------------------------------------- stage 1
def render_segment(ffmpeg, seg, img: Path, out: Path):
    z, x, y = kenburns(seg["n"] - 1, seg["frames"])
    dur = seg["dur"]
    vf = (
        f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},"
        f"zoompan=z='{z}':x='{x}':y='{y}':d={seg['frames']}:"
        f"s={W}x{H}:fps={FPS},format=yuv420p,setsar=1"
    )
    fade = min(0.20, dur * 0.2)  # softens cuts; never eats short cues
    if fade > 0.03:
        vf += (f",fade=t=in:st=0:d={fade:.3f},"
               f"fade=t=out:st={max(dur - fade, 0):.3f}:d={fade:.3f}")
    cmd = [ffmpeg, "-y", "-hide_banner", "-loglevel", "error",
           "-loop", "1", "-t", f"{dur:.3f}", "-i", str(img),
           "-frames:v", str(seg["frames"]),
           "-vf", vf,
           "-c:v", "libx264", "-preset", "veryfast", "-crf", str(CRF),
           "-pix_fmt", "yuv420p", "-r", str(FPS),
           str(out)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"segment {seg['label']}: {r.stderr[-800:]}")


# ---------------------------------------------------------------- build
def build(args):
    global W, H, CRF, IMG_DIR, SRT_PATH
    w, _, h = args.res.partition("x")
    W, H = int(w), int(h)
    CRF = args.crf
    IMG_DIR = ROOT / args.images
    SRT_PATH = ROOT / args.srt
    ffmpeg = find_ffmpeg()
    cues_all = parse_srt(SRT_PATH)
    idx = index_images()
    vo = find_audio(AUD_DIR)
    n_cues = len(cues_all)

    scope = cues_all[:args.limit] if args.limit else cues_all
    hits, missing = [], []
    for c in scope:
        h = find_image(idx, c["label"], c["n"])
        (hits if h else missing).append((c, h))

    print(f"SRT cues      : {n_cues}"
          + (f" (building first {len(scope)})" if args.limit else ""))
    print(f"Images found  : {len(hits)} / {len(scope)}"
          + (f"   [full set: {n_cues - len(scope)} more to generate]" if args.limit else ""))
    print(f"Master VO     : {vo.name if vo else 'NOT FOUND'}")

    if missing and not args.dry_run:
        print(f"\nMISSING {len(missing)} images. Refusing to build with "
              f"placeholders or reused images.")
        for c, _ in missing[:20]:
            print(f"  cue {c['n']:>3}  {c['label']:<12} -> expected images/{c['label']}.jpg")
        if len(missing) > 20:
            print(f"  ... and {len(missing) - 20} more")
        return 2

    # total = max(SRT span, VO duration) + tail
    srt_end = cues_all[-1]["end"]
    vo_dur = media_duration(ffmpeg, vo) if vo else 0.0
    total = max(srt_end, vo_dur) + TAIL_AFTER_VO
    if vo and vo_dur - srt_end > 1:
        print(f"VO span     : {vo_dur:.2f}s vs SRT span {srt_end:.2f}s "
              f"(narration beyond last cue: {vo_dur - srt_end:+.1f}s "
              "-> final image held)")

    if args.dry_run:
        print("\nMapping (first 5 / last 3):")
        for c, h in (hits + missing)[:5] + (hits + missing)[-3:]:
            print(f"  {c['n']:>3}  {c['label']:<12}  {h.name if h else '(MISSING)'}")
        print("\nDry run OK." + ("" if not missing else f"  !! {len(missing)} missing"))
        return 0 if not missing else 2

    if not vo:
        print("No master VO in audio/. Build it first: python3 scripts/build_master_audio.py")
        return 2

    cues, segs = plan(cues_all, total, limit=args.limit)
    print(f"Clips         : {len(segs)}   output {total:.2f}s ({total / 60:.1f} min) "
          f"@ {W}x{H} {FPS}fps")

    SEG_DIR.mkdir(parents=True, exist_ok=True)
    todo = [s for s in segs if not (SEG_DIR / f"{s['n']:03d}.mp4").exists()]
    print(f"Stage 1       : rendering {len(todo)} segments "
          f"({len(segs) - len(todo)} cached) ...")
    done = 0
    for s in segs:
        if s not in todo:
            continue
        img = find_image(idx, s["label"], s["n"])
        render_segment(ffmpeg, s, img, SEG_DIR / f"{s['n']:03d}.mp4")
        done += 1
        if done % 25 == 0 or done == len(todo):
            print(f"  ... {done}/{len(todo)} segments")

    # stage 2: concat (stream copy) -> silent video
    lst = SEG_DIR / "concat.txt"
    lines = []
    for s in segs:
        name = f"{s['n']:03d}.mp4"
        lines.append(f"file '{SEG_DIR / name}'\n")
    lst.write_text("".join(lines), encoding="utf-8")
    vid = OUT_DIR / "video_only.mp4"
    cmd = [ffmpeg, "-y", "-hide_banner", "-loglevel", "error",
           "-f", "concat", "-safe", "0", "-i", str(lst),
           "-c", "copy", str(vid)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print("concat failed:", r.stderr[-800:])
        return r.returncode

    # stage 3: mux the master VO (optionally with burned-in SRT captions)
    out = OUT_DIR / (f"{args.name}_test_{args.limit}.mp4" if args.limit
                     else f"{args.name}_final.mp4")
    if args.no_captions:
        cmd = [ffmpeg, "-y", "-hide_banner", "-loglevel", "error", "-stats",
               "-i", str(vid), "-i", str(vo),
               "-map", "0:v:0", "-map", "1:a:0",
               "-c:v", "copy",
               "-c:a", "aac", "-b:a", "96k", "-ar", "48000", "-ac", "2",
               "-t", f"{total:.3f}", "-movflags", "+faststart", str(out)]
    else:
        style = ("FontName=Noto Sans Devanagari,Fontsize=18,"
                 "PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,"
                 "BorderStyle=1,Outline=2,Shadow=0,MarginV=34,Alignment=2")
        vf = (f"subtitles={SRT_PATH}:fontsdir={FONT_DIR}:"
              f"force_style='{style}'")
        cmd = [ffmpeg, "-y", "-hide_banner", "-loglevel", "error", "-stats",
               "-i", str(vid), "-i", str(vo),
               "-map", "0:v:0", "-map", "1:a:0",
               "-vf", vf,
               "-c:v", "libx264", "-preset", "veryfast", "-crf", str(CRF),
               "-pix_fmt", "yuv420p",
               "-c:a", "aac", "-b:a", "96k", "-ar", "48000", "-ac", "2",
               "-t", f"{total:.3f}", "-movflags", "+faststart", str(out)]
    r = subprocess.run(cmd)
    if r.returncode != 0:
        print("final pass failed")
        return r.returncode

    size_mb = out.stat().st_size / 1e6
    print(f"\nDONE: {out}  ({size_mb:.1f} MB)")
    if args.no_captions:
        print("Captions      : none (clean build)")
    else:
        shutil.copy(SRT_PATH, OUT_DIR / SRT_PATH.name)
        print(f"Captions      : burned in from {SRT_PATH.name} "
              f"(Noto Sans Devanagari)")
        print(f"Sidecar subtitles: {OUT_DIR / SRT_PATH.name}")
    return 0


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--limit", type=int, default=0, help="build only first N cues")
    ap.add_argument("--res", default="1280x720",
                    help="render resolution WxH (default 1280x720; "
                         "use 2560x1440 for QHD, 854x480 for small files)")
    ap.add_argument("--crf", type=int, default=24,
                    help="x264 CRF for the segments (higher = smaller file)")
    ap.add_argument("--no-captions", action="store_true",
                    help="skip burned-in captions (fast stream-copy final mux)")
    ap.add_argument("--images", default="images",
                    help="image source directory relative to repo root "
                         "(default 'images'; use 'images_up4x' for AI-upscaled art)")
    ap.add_argument("--srt", default="tv6.srt",
                    help="episode SRT file relative to repo root")
    ap.add_argument("--name", default="tv6",
                    help="episode slug used in output file names "
                         "(e.g. tv7 -> output/tv7_final.mp4)")
    sys.exit(build(ap.parse_args()))
```

## Stage 6 — split into parts (per R5)

- Split at the **VO chapter boundaries measured in Stage 2** (first = 0, last = total incl. the +2 s tail; each interior boundary maps to the first cue starting at/after it); aim for parts in the ~4–9 min range.
- Per part: stream-copy concat of that cue's segment range + its VO slice (AAC 92 k) → `output/{ep}_2k_partN.mp4`.
- **Every part < 100 MB** (target ≤ 97 MB). Over cap → re-encode that part at CRF+1 or re-split at the nearest cue.

**Write the following to `scripts/split_parts.py` verbatim, then run:**

```
python3 scripts/split_parts.py --srt {ep}.srt --name {ep} \
    --bounds "0,<b1>,<b2>,...,<total incl. tail>"
```

```python
#!/usr/bin/env python3
"""Split the silent video (output/video_only.mp4) into N parts at the VO
chapter boundaries and mux each part's voiceover slice.

Boundaries are seconds: first = 0, last = VO end + tail; each interior
boundary maps to the first cue starting at/after it. The default set below
is the TV6 episode (5 parts from the 6 VO part lengths).

Each part stays under GitHub's 100 MB cap (stream-copy video + AAC 92k).
Usage:
  python3 scripts/split_parts.py                      # TV6 defaults
  python3 scripts/split_parts.py --srt tv7.srt --name tv7 \
      --bounds "0,300.1,600.2,900.3"                  # other episodes
"""
import argparse
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from build_video import (AUD_DIR, OUT_DIR, find_ffmpeg,
                         media_duration, parse_srt)

VIDEO = OUT_DIR / "video_only.mp4"
CAP_MB = 97.0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--bounds",
                    default="0,499.67,835.40,1175.91,1414.12,1899.083",
                    help="comma-separated part boundaries in seconds "
                         "(first 0, last = total incl. tail)")
    ap.add_argument("--name", default="tv6",
                    help="episode slug for output file names")
    ap.add_argument("--srt", default="tv6.srt",
                    help="episode SRT file relative to repo root")
    ap.add_argument("--vo", default="",
                    help="master VO file (default: first MP3 in audio/)")
    args = ap.parse_args()
    bounds = [float(b) for b in args.bounds.split(",")]

    ffmpeg = find_ffmpeg()
    cues = parse_srt(ROOT / args.srt)
    if args.vo:
        vo = ROOT / args.vo
    else:
        vo = sorted((p for p in AUD_DIR.iterdir() if p.suffix == ".mp3"))[0]
    vo_dur = media_duration(ffmpeg, vo)

    # map each boundary to the first cue starting at/after it
    idx = []
    for b in bounds:
        hit = next((i for i, c in enumerate(cues) if c["start"] >= b - 0.05),
                   len(cues))
        idx.append(hit)

    print(f"VO duration {vo_dur:.2f}s, boundaries -> cue indexes {idx}")
    for k in range(len(bounds) - 1):
        i0, i1 = idx[k], idx[k + 1]
        v_start = cues[i0]["start"] if i0 else 0.0
        v_end = bounds[k + 1] if k + 1 == len(bounds) - 1 else cues[i1]["start"]
        a_end = min(v_end, vo_dur)

        segs = list(range(i0 + 1, i1 + 1))
        lst = OUT_DIR / f"part{k + 1}_list.txt"
        paths = [str(OUT_DIR / "segments" / f"{n:03d}.mp4") for n in segs]
        lst.write_text("".join("file '" + p + "'\n" for p in paths),
                       encoding="utf-8")

        out = OUT_DIR / f"{args.name}_2k_part{k + 1}.mp4"
        cmd = [ffmpeg, "-y", "-hide_banner", "-loglevel", "error",
               "-f", "concat", "-safe", "0", "-i", str(lst),
               "-ss", f"{v_start:.3f}", "-to", f"{a_end:.3f}", "-i", str(vo),
               "-map", "0:v:0", "-map", "1:a:0",
               "-c:v", "copy",
               "-c:a", "aac", "-b:a", "92k", "-ar", "48000", "-ac", "2",
               "-movflags", "+faststart", str(out)]
        print(f"part {k + 1}: cues {segs[0]}-{segs[-1]}  "
              f"video {v_start:.2f}-{v_end:.2f}s  audio ->{a_end:.2f}s")
        r = subprocess.run(cmd, capture_output=True, text=True)
        if r.returncode != 0:
            print("FAILED:", r.stderr[-1000:])
            return 1
        mb = out.stat().st_size / 1e6
        flag = "  !! OVER CAP" if mb > CAP_MB else ""
        print(f"  -> {out.name}  {mb:.1f} MB{flag}")
        if mb > CAP_MB:
            print("  (re-encode this part at CRF+1 or re-split the boundary)")
    print("SPLIT DONE")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

## Stage 7 — ship to GitHub

1. Copy the parts to the repo root.
2. Commit with the build scripts (`build_video.py`, `scripts/split_parts.py`, `scripts/build_master_audio.py`), the raw transcript + tagged transcript + `tagging_rationale.md`, `{ep}.srt`, `images/`, `audio/`, `prompts/`, `fonts/`, and a README (part order, specs, rebuild commands).
3. Push to the working branch; open a PR to `main` when asked.
4. `.gitignore`: `output/`, `__pycache__/`.

## Acceptance checks (ALL must pass before declaring done)

- **A0.** Tagged transcript: text identical to the raw transcript except inserted tags; rating **≥ 8/10 with logged justifications** for all five criteria; tag catalog verified against the official list.
- **A1.** {N} cues = {N} images = {N} segments; zero missing, zero reused (R3).
- **A2.** Every part probes: 2560×1440, 24 fps, h264 High yuv420p + AAC 48 kHz stereo; part durations match their chapter spans; total = VO + 2 s.
- **A3.** Extract ≥ 2 frames per part and visually confirm: correct scene, channel style, **no captions**, no artifacts.
- **A4.** A/V spot-check at a random cue: the on-screen scene matches that cue's narration.
- **A5.** Commit + push succeed; PR (if requested) is open and mergeable.

## Environment notes

- No `ffprobe` available: parse `ffmpeg -i` output. ffmpeg via `pip install --break-system-packages imageio-ffmpeg` (`imageio_ffmpeg.get_ffmpeg_exe()`).
- ElevenLabs: use model id `eleven_v4` (tags work on `eleven_v4`, `eleven_v4_turbo`, `eleven_v3`); **no SSML** — tags + punctuation control pauses/pacing/emphasis; ≤ 10,000 characters per generation; audition any unusual tag on a short line before using it in the full transcript.
- 2-core / 4 GB CPU box: 2K segment stage ≈ 35 min per 482 cues; pushing ~320 MB ≈ 20–30 min.
- The sandbox can be wiped between turns: **push as soon as anything valuable exists**; recover with `git fetch origin <branch> && git reset --hard <sha>`.
