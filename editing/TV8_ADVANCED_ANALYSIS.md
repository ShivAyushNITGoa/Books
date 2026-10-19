# TV8 — Why v1 Still Feels Static & What Pro Upgrade Fixes It

## Audit of v1 (tv8_demo_35s.mp4, 0-34s, 8 cues)

*Single-layer Ken Burns only.* One `zoompan` per cue (push 2-3% over 3-5s), cosine ease, tiny handheld 0.0012 + roll 0.0022 rad. Grade is gentle S-curve + noise + vignette. No depth, no intra-cue cut, no reactive graphics. Result: on a 55" TV the still holds for 4-6s — eye detects “slideshow with a slow push”.

Your 8-list has 40+ ideas; v1 used ~9 of the ✅-safe ones. The gap to “edited by a person” is in four places:

### 1. No depth → image stays flat
Paintings are read as a poster. A real doc creates depth:
- **2.5D parallax** (fg/bg layers at 0.6× / 1.3× speed) is the single biggest “wow”. Your chai-stall (cue 0-56, #0-56) and family dinner (#1-00) have clear fg subjects; separating them sells camera movement instantly.
- **Rack-focus feel**: blur→sharp sweep (0-0.5s) on the cracked-mirror cue (#0-53) mimics a lens pulling focus to the reflection.
- **Living-paint bump**: light sweep across canvas (already in kbv2, but at 22/255 alpha it’s invisible on dark frames — needs 42/255 + correct blend).

### 2. One shot per cue → long holds
Cues 4 (`0-10`, 5.38s) and 8 (`0-28`, 6.34s) hold one framing for >130 frames. Pro editors **cut inside the cue** with the same image:
- **Punch-in cutaway** (mid-cue snap to detail crop, 38% of frames, hard cut on VO prosody)
- **Whip-reframe** (fast 0.15→0.85 travel with 2-frame tmix blend) — adds speed without needing a new picture, R3-legal (same image, two framings).
v1 has zero intra-cue cuts; proedit1 triggers only on `punch` + ≥4.5s (≈8% of cues). Story cues (205/330) never punch — that’s why the mid-section drags.

### 3. Motion doesn’t react to edit
- **Easing is single-phase cosine** — settles only at end, feels digital. Real moves are **Bezier multi-phase: ease-out-hold-ease-in** (settle at both ends like a dolly).
- **No speed ramping**: pan accelerates into the cut (+18% at last 8 frames) and eases off the far side — “cut on movement” hides the edit.
- **VO-prosody blind**: cuts land on SRT boundaries, not on breaths. Loud cues (`energy 1.0`, 34 punch cues) should favour hard cuts; soft cues (`energy <0.2`, 24 word cues) should breathe with longer dips. Currently random by hash.
- **Gate weave + chromatic fringe** (±1px jitter, 1px rgbashift) missing in v1 — the v1 frame is locked-off like a scan, not a projector.

### 4. Light/grade is static, graphics missing
- **Mood is “neutral” for all 330 cues** (`cue_classes.json` never tagged dark/light, lit 0/330 even though 40% frames have visible lamps). So emotional grade never fires.
- **Day→night drift** (slow WB ramp 0.020 over 330 cues) is in kbv2 but drowned by per-cue grade — needs a global tint overlay.
- **No motion graphics without text**: you asked for dynamic but R6 blocks burned captions. Safe proxies: **chapter number build (golden 1 draws on)**, **10-dot progress motif** (chapter orbs fill), **animated rule-line**, **dust motes in lamp cones** — all add motion that isn’t a transition flash.

---

## v2 Bundle — “Advanced but Invisible” (what’s actually rendered in tv8_demo_v2)

All ✅-doable today, zero rule changes (1 image per cue, VO raw copy, no captions), no vertical blur pass:

**Camera — depth + dynamics**
- ✅ Bezier multi-phase easing + handheld micro-shake + breathing + **gate weave ±1.5px**
- ✅ **2.5D parallax** — each image split bg/fg (bg 0.6× pan, 2px blur, 3% darker; fg 1.3× pan, masked by soft elliptical alpha centered on saliency anchor) → real depth on family/stall/mirror cues
- ✅ **Rolling rack-focus** — 2-step boxblur 3→2 at 0-0.22s/0.22-0.5s (paint-settle)
- ✅ **Motion-continuity chaining** — story runs pan right, host cues reverse drift (studio-insert feel), break at chapter beats
- ✅ **Speed ramping** — pan accelerates 1.18× in last 0.33s, whips use tmix 2-frame blend

**Editorial — cuts inside the cue**
- ✅ **Punch-in** on ≥3.8s story/punch cues (energy >0.75): 62%/38% split, second half snaps to detail anchor (+10% offset, 1.12× zoom)
- ✅ **Whip-reframe** on every third long cue (fast 0.15→0.85 x-travel)
- ✅ **VO-energy cut vocabulary** — punch=hard cut, soft/word=0.33-0.42s dip through warm dark `0x160909`, host/chapter=black beat + leak pulse

**Light & grade — text-reactive**
- ✅ Hindi keyword mood inference (शिकायत/डर/रुकना→dark desat, ताकत/काबिलियत/मौका→light warm) — fixes the all-neutral tagging
- ✅ Chapter bleach-bypass hint (contrast +0.06, sat 0.82) on cues 14/69/100…
- ✅ Global day→night drift + exposure settle `-0.075*exp(-2.4*t)` + lamp flicker 3Hz on lamp frames (detected via avg luminance <40 + highlight >120)
- ✅ Highlight-only bloom (curves threshold 0.65→0.6, gblur 8, screen 12%) + chromatic fringe 1px right / -1px blue + halation bleed

**Motion graphics — no text, just motion**
- ✅ **Living-paint sweep** (5120×1440 warm gradient, 42% opacity, screen, travels 2W across cue)
- ✅ **Canvas grain unifier** `noise alls=5` + animated **dust motes** (screen noise layer drifting -2px/frame)
- ✅ **Progress orbs** — 10 dots bottom-right, filled by chapter index (cue 14 → 1/10 lit)
- ✅ **Chapter number build** — on chapter cues (14,69…), golden “1” strokes on with radial glow (pre-rendered PNG, alpha fade 0.8s)
- ✅ **Godray** on doorway/window cues (cracked mirror, lonely road streetlight) — warm gradient overlay

**Quality**
- ✅ Lanczos scale, `accurate_rnd`, motion-blur `tmix` on pans, CRF 24, stream-copy MP3 mux

**Explicitly NOT done (would pull attention to the effect)**
- ❌ Vertical/table-blur wipe, light-leak flash >0.18s, parchment dip, dust-scratch splice flash — all read as “effect first”
- ❌ PiP / split-screen / recap montage / 60fps minterpolate (rule or heavy)

The v2 demo below renders cues 14-25 (50.55-87.77s, 37.22s, 12 images) — a chapter opening through a rapid Q&A run — so you can A/B against the 0-34s intro in one viewing. Same `audio/tv8_master.mp3` stream-copy, 4-part re-join stays `ffmpeg -f concat -c copy`.
