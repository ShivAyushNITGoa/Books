# MASTER PROMPT — Talk2Society Story Video Pipeline (any episode)

> Hand this whole document to one agent and it does the entire job for **any similar Talk2Society video**.
> Complete, validated recipe: raw transcript → ElevenLabs v4 tagged transcript (single run)
> → voiceover → SRT → image prompt pack (single run) → images (packs of 10)
> → 2K AI-sharpened video → multi-part GitHub delivery.
>
> Episode parameters: `{ep}` = episode slug (e.g. `tv6`), `{N}` = number of SRT cues (e.g. 482 for TV6).
> Every episode-specific number (cue count, VO part lengths, part sizes) is **measured from the actual files**, never assumed.

---

You are an autonomous media-pipeline agent. Build the complete **Talk2Society `{ep}`** story video end-to-end from the inputs below and ship it to the GitHub repo. Do every stage in order; do not skip, batch-summarize, or re-derive anything. Follow the Hard Rules exactly.

## Inputs

1. **Raw transcript** — the plain-text narration (no markup). Single source of truth for the voiceover and the SRT.
2. **Channel constants** — embedded below (channel-locked style phrase, `#Host` reference, narrator register). Same for every episode.
3. (Optional, only for episodes that already have them) a pre-timed `{ep}.srt`, or the episode's pre-recorded VO MP3s at the repo root (named like `TV6 p1.mp3 …` with spacing/case variants — always use them in order p1→pN). If `{ep}_master.mp3` already exists, use it.

## Hard Rules (non-negotiable)

- **R1 — Packs of 10.** Image generation happens **strictly in batches of 10** — never more, never fewer per batch.
- **R2 — Single-run stages.** Any stage whose output is a complete document — transcript → tagged transcript (Stage 1), SRT → image prompt pack (Stage 4) — is done in **ONE run**: read the entire input in a single pass and emit the **complete** output before moving on. No chunked or partial runs.
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
- **Record the actual part boundaries** (seconds, measured from the files) — they drive Stage 8's part splits.
- Tail rule: if the SRT ends before the VO, that tail is narration without cues — the final image is held over it (intentional, not a reuse).

## Stage 3 — transcript/VO → SRT (single run, per R2)

1. In one pass, produce `{ep}.srt`: cue N owns `[start_N, start_{N+1})`, the last cue runs to the VO end. Timestamps aligned to the actual master VO.
2. Derive each cue's **label** from its start timestamp: `M-SS` (minutes unpadded, seconds zero-padded, e.g. `0-13` = 0:13); on collision append `-ms` (e.g. `0-03` vs `0-03-930`).
3. Validate: `{N}` cues, labels unique, in transcript order.

## Stage 4 — SRT → image prompt pack (single run, per R2)

1. Emit **one prompt per cue ({N}) + the `#Host` character reference (1) = {N}+1 entries**, all in this single run, into `prompts/{EP}_Image_Prompts_*.txt` as `#label` blocks, plus a machine-readable `prompts/manifest.json` (label → prompt map).
2. Each scene prompt = **one line: [shot size] + [subject] + [action] + [one mood beat]**, followed by the **Channel-Locked Style Phrase (below), byte-identical in every block**.
3. Keep the story world consistent: recurring characters must match the `#Host` reference and their earlier appearances (wardrobe, props, face); locations and objects stay continuous between adjacent cues.
4. Every prompt must forbid generated text: no lettering, numbers, captions, logos, watermarks.
5. **Validate before Stage 5 (images):** {N} scene entries + 1 host ref, labels unique, one per cue in SRT order.

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

## Stage 5 — prompts → images (packs of 10, per R1)

1. Generate **strictly 10 images per batch** ({N}+1 prompts → ⌈({N}+1)/10⌉ packs).
2. Save each as `images/<label>.jpg` at native resolution (1376×768), JPEG quality ≥ 90.
3. After **every** pack: verify all 10 files exist and are non-empty; keep a running counter until **{N}+1 / {N}+1**. A cue without a valid image = stop and regenerate it (R3).
4. Extra/orphan images are allowed (they stay unused); a moderated/failed generation gets a **minimal reword** (keep the Locked Style Phrase) and is retried in the next pack.

## Stage 6 — AI super-resolution 2× (for the 2K build)

- Upscale all {N}+1 images with **Real-ESRGAN, anime-6B model**: run the 4× model on **half-size input** (INTER_AREA downscale, `outscale=4`), `tile=256` (4 GB-safe), save at **2×** → `images_up4x/<label>.jpg` (2752×1536, q93).
- Weights: `RealESRGAN_x4plus_anime_6B.pth`, **sha256 `f872d837d3c90ed2e05227bed711af5671a6fd1c9f7d7e91c911a61f155e99da`** (xinntao/Real-ESRGAN release v0.2.2.4, or any mirror — verify the hash).
- Budget: ~20 s/image on a 2-core CPU (≈ 2.6 h for 483 images). Run **resumable** (skip existing outputs), log progress every 25 images.

## Stage 7 — final video (3-stage build, `build_video.py`)

- **7a Segments** — per cue, one 24 fps segment covering its exact window (last cue: until VO end + 2 s tail). Effects/transitions: **Ken Burns** from a 4-pattern cycle (slow zoom-in / zoom-out / pan-right / pan-left), 10 % zoom range; **0.2 s fade in/out at every cut**. Frame budget: `frames_i = floor(dur_i × 24)`, the last segment takes the remainder → **boundary drift ≤ 1 frame**; total = `max(SRT span, VO duration) + 2 s`.
  - Encode: **h264 yuv420p, 2560×1440 (QHD), CRF 24, 24 fps**. (Only for a single-file 720p deliverable: `1280×720`, CRF 27.)
- **7b Concat** — stream-copy all {N} segments → `output/video_only.mp4` (silent).
- **7c Final mux** — mux the master VO (AAC, 48 kHz stereo, 92–96 kb/s), `-movflags +faststart`, `-t <total>` → `output/{ep}_final.mp4`. **No captions (R6)** — drop `--no-captions` only if captions are explicitly requested.

## Stage 8 — split into parts (per R5)

- Split at the **VO chapter boundaries measured in Stage 2** (each boundary maps to the first cue starting at/after it); aim for parts in the ~4–9 min range.
- Per part: stream-copy concat of that cue's segment range + its VO slice (AAC 92 k) → `{ep}_2k_partN.mp4`.
- **Every part < 100 MB** (target ≤ 97 MB). Over cap → re-encode that part at CRF+1 or re-split at the nearest cue.

## Stage 9 — ship to GitHub

1. Copy the parts to the repo root.
2. Commit with the build scripts (`build_video.py`, `scripts/split_parts.py`, `scripts/build_master_audio.py`), the raw transcript + tagged transcript + `tagging_rationale.md`, `{ep}.srt`, `images/`, `audio/`, `prompts/`, `fonts/`, and a README (part order, specs, rebuild commands).
3. Push to the working branch; open a PR to `main` when asked.
4. `.gitignore`: `output/`, `images_up4x/`, `models/`, `__pycache__/`.

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
- 2-core / 4 GB CPU box: torch CPU `set_num_threads(2)`, Real-ESRGAN `tile=256`; 2K segment stage ≈ 35 min per 482 cues; pushing ~320 MB ≈ 20–30 min.
- The sandbox can be wiped between turns: **push as soon as anything valuable exists**; recover with `git fetch origin <branch> && git reset --hard <sha>`.
