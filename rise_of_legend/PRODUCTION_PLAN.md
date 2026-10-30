# PRODUCTION PLAN — editing & build

**Project:** *Rise of Legend — Ep. 1: The Fifth Breath*
**Deliverable:** 2:00 · 1,200 frames · 10 fps · 1920×1080 · h264 + AAC 48 kHz · Hindi VO, English subtitles
**Authoritative inputs:** [`timeline.json`](timeline.json) (edit) · [`01_script/vo_ep01.srt`](01_script/vo_ep01.srt) (VO timing)
**Builder:** [`07_build/assemble_10fps.py`](07_build/assemble_10fps.py)

---

## 1. What we are shipping

| # | Deliverable | Spec |
|---|---|---|
| D1 | Main short | 1920×1080, **10 fps**, 1,200 frames, 120.000 s, h264 yuv420p CRF 20, AAC 192k 48 kHz stereo, faststart |
| D2 | Vertical cut | 1080×1920, same edit, reframed per shot (see §5.6), 10 fps |
| D3 | Teaser | 4 s / 40 frames loopable (S22 hero shot + title) |
| D4 | Subtitles | `vo_ep01.srt` sidecar (Hindi + English), frame-aligned to 0.1 s |
| D5 | Stills | 3 key-art frames for thumbnail/press (S22, S29, S32) |

**Non-negotiables**

* Exactly **10.0 fps** — verified by QC, not assumed.
* Exactly **1,200 frames** — the timeline sums to it; the builder refuses to drift.
* **Silent-safe**: the cut must work with no audio. Audio adds, it does not explain.
* **Original IP**: see `00_admin/legal_checklist.md` before anything is published.

---

## 2. The edit is data (`timeline.json`)

```jsonc
{
  "fps": 10, "width": 1920, "height": 1080, "total_frames": 1200,
  "beats": [ { "id": 1, "name": "Cold open", "frames": 80 }, … ],
  "shots": [ { "id": "S01", "beat": 1, "frames": 30, "camera": "hold",
               "kind": "art", "source": "shots/S01.png",
               "action": "Eclipse over Nandipur; the sun goes dark rim-first." }, … ]
}
```

**Rules**

1. `start_frame` / `seconds` are **derived** — never hand-edited. Edit `frames` and re-run `--dry-run`.
2. Beat totals must equal shot totals must equal `total_frames` (the builder hard-fails otherwise).
3. Shot IDs (`S01`…`S32`) are permanent. If a shot is dropped, keep the gap documented — do not renumber
   after paper edit, or every board, asset and note breaks.
4. Frame counts are chosen in **even numbers** where possible (on-2s / on-3s friendly). Avoid 1-frame shots.
5. A shot may use `"kind": "color"` (black card) or `"kind": "title"`; everything else needs art.

---

## 3. Stage plan — P0 → P7

| Stage | Work | Output | Gate (do not pass until true) | Est. |
|---|---|---|---|---|
| **P0 · Lock** | Concept, names, legal distancing, script, VO script | `CONCEPT.md`, `00_admin/`, `01_script/` | No original-show name/likeness/costume in any document or asset | 1 day |
| **P1 · Board** | 32 storyboards, one per shot, 1920×1080, silhouette-first | `02_storyboard/S01.png…` | Each shot reads as a single still; action + camera are obvious with no caption | 4–5 days |
| **P2 · Timing** | Slate animatic → real animatic from boards | `08_delivery/animatic_slates.mp4` → `ep01_animatic.mp4` | 120.00 s, 1,200 frames, no shot over 6 s without a change, cuts land on VO | 1 day |
| **P3 · Key animation** | Key poses on 3s for every shot, in order | `04_animation/shots/Sxx.mp4` (WIP) | Mute test: story still reads at 10 fps; silhouettes hold | 5 days |
| **P4 · Inbetweens + cycles** | Action shots on 2s, dialogue mouths on 2s, reusable cycles | same | Walk/breath/shawl cycles reused, not redrawn; no shot exceeds 140 frames | 4 days |
| **P5 · FX + comp** | Five element rigs, impact frames, halftone/paper grade | composited shot clips | Each element is instantly distinguishable (colour + shape + sound) | 3 days |
| **P6 · Audio** | VO record, original score, SFX, mix | `06_audio/vo/vo_ep01.wav`, stems | VO sync within 1 frame at every cue; mix −14 LUFS integrated, TP ≤ −1.5 dBTP | 2 days |
| **P7 · Conform + delivery** | Build, verify, vertical cut, teaser, credits | `08_delivery/*` | QC prints PASS on every file; subtitle timing checked; credits correct | 1 day |

**Total ≈ 3 weeks** for one animator + one editor, with the VO recorded in parallel during P1–P2.

---

## 4. Editing grammar at 10 fps

At 10 fps every edit decision is visible for 100 ms. That is the whole aesthetic — use it.

### 4.1 Cuts

* **Hard cuts for 95% of the film.** Dissolves at 10 fps read as double-exposure mush.
  The only exceptions are the 8-frame black cards (S31) and the 3-frame impact inversion.
* **Cut on action**, not on a round number. Trim the outgoing shot 1–2 frames before the hit lands,
  let the incoming shot carry the impact frame.
* **Impact frame = 3 frames** (0.3 s) of inverted / white-silhouette colour, then resume. Use once per
  fight beat, maximum four times in the film.
* **Whip pan = 2-frame smear** (one directional-blur frame, one near-white frame, then the new angle).
* **Act breaks** (beat 1 → 2, beat 8 → 9, beat 11 → 12) get an 8-frame hold on black. Nothing else does.

### 4.2 Holds and drawing changes

| Situation | Rule |
|---|---|
| Dialogue | mouth shapes change on **2s** (5 drawings/sec); body on 3s |
| Walking / running | full cycle on 3s; reuse the clip, don't redraw |
| Hero idle | 20-frame breathing cycle, loops invisibly |
| Static tension (S28, S30) | hold one drawing for up to 40 frames, then change once |
| Maximum shot length | **140 frames** (14 s) — the rooftop fight's longest single angle is 40 |
| Minimum shot length | **8 frames** — anything shorter stutters at 10 fps |

### 4.3 Camera

* **No slow pans.** A 2-second pan at 10 fps visibly steps. Use a stepped pan (move every 5 frames)
  or cut instead.
* **Push/pull max 3% over a shot**, stepped every 5 frames — the builder does this automatically
  (`"camera": "push" | "pull"`). Anything larger fights the animation.
* **No motion blur, no 24 fps smoothing, no optical-flow interpolation.** Ever.

### 4.4 Timing against the VO

Cuts land on the **stressed syllable**, not the sentence end. The five VO cues are the anchors:

| VO cue | Time | Frame | Lands on |
|---|---|---|---|
| Whisper: *"जब आख़िरी मोहर टूटेगी…"* | 0:02.0 | 20 | S02 city brown-out |
| Zoya: *"अरिन, भागो!"* | 0:38.0 | 380 | S11 pillar falls |
| Badi Amma: *"एक साँस, एक शक्ति, एक चुनाव।"* | 1:00.0 | 600 | S17 element vignettes |
| Timir: *"तुमने भीड़ चुनी…"* | 1:44.0 | 1040 | S28 the choice |
| Title VO: *"पाँच साँसें। एक रक्षक।"* | 1:57.2 | 1172 | S32 title |

### 4.5 Graphics & titles

* **One graphic event in the whole film:** the title slam (S32, 32 frames). No lower-thirds, no
  name tags, no episode labels, no "to be continued" cards.
* Title slam: 8 frames black (S31) → logo appears on frame 1 of S32 → hold 20 frames → 4-frame gold
  dust settle → cut to black on the last frame.
* Subtitles are a **sidecar SRT** for the master; the YouTube cut may burn them with the recipe in §5.5.

### 4.6 Sound as an edit tool

* **Total silence for S25** (ether-step): drop music, drop ambience, keep only a breath. It is the
  loudest moment in the film precisely because it is silent.
* Music duck to −24 LUFS under VO; no music at all under the whisper (S01–S02).
* Hard effect cuts must land on the same frame as the picture cut.

---

## 5. Build process

### 5.1 Prerequisites

```bash
pip install -q --break-system-packages pillow imageio-ffmpeg
# or: export FFMPEG_BIN=/path/to/ffmpeg
```
No ffprobe is required — the tool parses `ffmpeg -i` stderr, like the rest of this repo.

### 5.2 Commands

```bash
# validate timeline + list every shot, frame count and missing asset
python3 rise_of_legend/07_build/assemble_10fps.py --dry-run

# timing pass with slate cards (no artwork needed)
python3 rise_of_legend/07_build/assemble_10fps.py --slates --build

# fast smoke (first 6 shots, ~6 s of render)
python3 rise_of_legend/07_build/assemble_10fps.py --slates --build --limit 6

# the real animatic, once art (or per-shot clips) exist
python3 rise_of_legend/07_build/assemble_10fps.py --build

# QC
python3 rise_of_legend/07_build/assemble_10fps.py --verify rise_of_legend/08_delivery/ep01_animatic.mp4
```

### 5.3 What the builder produces

```
rise_of_legend/output/shots/S01.mp4 … S32.mp4     per-shot renders (gitignored)
rise_of_legend/output/animatic_silent.mp4         frame-exact concat, stream copy
rise_of_legend/08_delivery/animatic_slates.mp4    slate timing pass
rise_of_legend/08_delivery/ep01_animatic.mp4      with your artwork
                  └─ _vo is muxed automatically if 06_audio/vo/vo_ep01.wav exists
```

* Each shot is rendered with `-frames:v <exact>` → the cut cannot drift by a frame.
* Concat is `-c copy` (no re-encode) → no generation loss between shots.
* QC checks resolution, fps, duration, frame count, and whether audio is present.

### 5.4 How artwork lands (iteration loop)

| Input | Where | Notes |
|---|---|---|
| Still per shot | `04_animation/shots/S01.png` | 1920×1080; safe margins for the 9:16 crop |
| Animated clip per shot | `04_animation/shots/S01.mp4` | exported at 10 fps; a clip **wins** over a still of the same id |
| Board for reference | `02_storyboard/S01.png` | board-style only; not part of the render |
| Clip longer than its shot | — | trimmed to the exact frame count |
| Clip shorter than its shot | — | last frame is held to the exact frame count |

Re-run the same command after dropping in new art; the whole film rebuilds in about 30 s because the
shots are short. Rename nothing — the filename *is* the edit.

### 5.5 Mux the VO, burn subtitles

```bash
# the builder does this automatically if this file exists:
#   rise_of_legend/06_audio/vo/vo_ep01.wav     (48 kHz mono)

# burn Hindi+English subtitles for the YouTube master
FF=$(python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")
$FF -y -i rise_of_legend/08_delivery/ep01_animatic.mp4 \
  -vf "subtitles=rise_of_legend/01_script/vo_ep01.srt:fontsdir=fonts:\
force_style='FontName=Noto Sans Devanagari,Fontsize=18,PrimaryColour=&H00FFFFFF,\
OutlineColour=&H00000000,BorderStyle=1,Outline=2,Shadow=0,MarginV=38,Alignment=2'" \
  -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -r 10 \
  -c:a aac -b:a 192k -ar 48000 -movflags +faststart \
  rise_of_legend/08_delivery/ep01_master_subs.mp4
```

Mix spec: dialogue anchored at −16 LUFS short-term, full mix **−14 LUFS integrated**, true peak
≤ −1.5 dBTP, 48 kHz stereo out (mono VO is fine going in).

### 5.6 Vertical cut (9:16)

Do **not** centre-crop the whole film — S22's hero shot and S29's throne will lose their subject.
Reframe per shot by editing `camera` and adding a per-shot `crop` if needed, then export with:

```bash
# quick pass: safe centre crop (only if every board respected the 9:16 safe area)
$FF -y -i ep01_master_subs.mp4 -vf "crop=608:1080:656:0,scale=1080:1920" …
```

The real path is a second timeline (`timeline_vertical.json`) with per-shot `reframe` values, built with
the same tool into `08_delivery/ep01_vertical.mp4`.

### 5.7 Per-stage QC

```bash
# frame count of the finished file, no re-encode
$FF -i ep01_animatic.mp4 -f null - 2>&1 | tail -1     # frame=1200

# spot frames (one ffmpeg call per frame)
$FF -y -ss 21.9  -i ep01_animatic.mp4 -frames:v 1 /tmp/qc_S07.png
$FF -y -ss 119.9 -i ep01_animatic.mp4 -frames:v 1 /tmp/qc_title.png
```

Check at least: S01, S11 (pillar), S22 (hero shot), S26 (impact frame), S31/S32 (title), and one frame
from every beat.

### 5.8 Definition of done

- [ ] `--verify` prints **PASS** on the master and the vertical cut.
- [ ] 1,200 frames, 120.000 s, 10.0 fps, 1920×1080, h264 + AAC 48 kHz.
- [ ] Every shot in `timeline.json` has exactly one asset, named by its shot id.
- [ ] Title slam and impact frames survive the concat (check them, they are the ones that break).
- [ ] VO sync within 1 frame at all five cues; silence beat at S25 intact.
- [ ] Legal checklist complete (`00_admin/legal_checklist.md`).
- [ ] Credits: story, animation, music, VO, and "original characters" line.

---

## 6. Frame budget

| Beat | Name | Seconds | Frames | Shots |
|---|---|---|---|---|
| 1 | Cold open | 8.0 | 80 | S01–S03 |
| 2 | The restorer | 14.0 | 140 | S04–S06 |
| 3 | The mark | 8.0 | 80 | S07–S08 |
| 4 | Break-in | 14.0 | 140 | S09–S11 |
| 5 | First breath | 10.0 | 100 | S12–S14 |
| 6 | The lesson | 12.0 | 120 | S15–S17 |
| 7 | The rule | 8.0 | 80 | S18–S19 |
| 8 | Transformation | 12.0 | 120 | S20–S22 |
| 9 | Rooftop fight | 14.0 | 140 | S23–S26 |
| 10 | The choice | 8.0 | 80 | S27–S28 |
| 11 | Timir | 8.0 | 80 | S29–S30 |
| 12 | Title | 4.0 | 40 | S31–S32 |
| | **Total** | **120.0** | **1,200** | **32** |

**Drawing load:** ~40% on 2s, ~55% on 3s, ~5% impact → roughly **480–520 unique drawings**, 12 background
plates, 6 characters, 5 element rigs, 4 reusable cycles. That is a realistic three-week load for one
animator; the 2s passes are concentrated in beats 5 and 9.

---

## 7. Schedule

| Week | Mon–Tue | Wed–Thu | Fri | Gate |
|---|---|---|---|---|
| 1 | Boards S01–S16 | Boards S17–S32 | Slate animatic → timed animatic; VO record | P2 gate: 120.00 s, cuts land |
| 2 | Key poses beats 1–6 | Key poses beats 7–12 | Inbetween pass 1 (beats 5, 9) | Mute test passes |
| 3 | Inbetweens + cycles | FX, impact frames, grade | Audio mix, conform, QC, vertical cut | P7 gate: QC PASS |

Slip rule: if week 2 ends with beats 1–8 unanimated, **cut beat 6 (the lesson) to 8 s** and move 40
frames into beat 9. Decide before drawing, never after.

---

## 8. Roles

| Role | Owns | Hands off |
|---|---|---|
| Director/editor | timeline, cuts, conform, QC | shot list + frame counts to animator |
| Storyboard artist | `02_storyboard/` | boards + camera notes |
| Animator | `04_animation/` | per-shot clips named by shot id |
| VO artist | `06_audio/vo/` | 48 kHz mono WAV, raw, no processing |
| Composer/sound | `06_audio/music`, `sfx` | stems + mixed stereo |
| Producer | legal checklist, credits, delivery | sign-off |

---

## 9. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Takedown / IP claim** from the source show | medium | fatal | legal checklist, new names/costume/powers, no SEO on the original title, keep dated character bible |
| 10 fps reads as "broken" to viewers | medium | high | commit to the style in the first 3 s: stepped camera, halftone, impact frames; never mix in 24 fps footage |
| VO slips → edit drifts | high | medium | lock the 5 cues first; the animatic exists precisely to absorb this |
| Animator delivers art late | high | medium | slates keep the cut intact; drop-in per shot, no re-edit needed |
| Concat drops impact frames | low | high | QC S26 and S31/S32 explicitly |
| Repo bloat (this repo is already 1.6 GB) | medium | medium | renders stay in gitignored `output/`; only the 2.6 MB animatic and final masters are committed |
| Scope creep into an episode | high | high | this is a **2-minute proof of concept**, not the series |

---

## 10. Why a separate pipeline

The repo's Talk2Society builder (`build_video.py`, `editing/`) is a **24 fps photo-film assembler**:
`FPS = 24` is a module constant, `split_parts.py` hard-codes `-r 24`, and `verify_parts.py` asserts
24 fps and 1920×1080. Forcing 10 fps through it would mean threading a new frame rate through four
files and its caching layer, then re-testing a delivery path used by finished episodes.

Instead this folder ships a **self-contained 10 fps tool** with the same discipline: exact frame math,
asset-per-shot, atomic renders, and a QC pass that prints PASS/FAIL. The two pipelines share only
conventions, not code.

---

## 11. Next actions

1. Board S01–S08 and re-time if any shot wants different frame counts (then `--dry-run` must still say 1,200).
2. Record the five VO lines; drop `vo_ep01.wav` in `06_audio/vo/` and rebuild — the animatic becomes
   a real audio guide.
3. Clear names: run the trademark/policy checks in `00_admin/legal_checklist.md` before any public post.
4. Animate beat 1 as the style test (80 frames) and judge the 10 fps feel before committing to beat 2.
5. Only after beat 1 is approved: lock character sheets in `04_animation/characters/`.
