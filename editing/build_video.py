#!/usr/bin/env python3
"""
Talk2Society video builder (professional per-episode editor)
============================================================
Assembles: per-scene images + master voiceover (Path A, untouched) + the
episode SRT into one MP4. This is not a slideshow: cue windows are cut and
graded like an edit suite, while the R3 frame budget stays mathematically
exact.

Hard guarantees (unchanged from spec):
  * EXACTLY ONE image per SRT cue - N cues -> N distinct images.
  * Image <label> is shown only during its own cue window; never reused.
  * Missing image => HARD FAIL (no placeholders, no silent reuse).
  * frames_i = floor(dur_i*FPS); cumulative boundary drift <= 1 frame.
  * VO is used raw (Path A): no time-stretch, no re-level, no ducking.
  * No burned captions in the clean build (R6).

Editorial intelligence (pro styles):
  * cue classes via --cue-class (chapter/host/word/soft/punch/story) +
    text-driven mood (dark/light) + per-cue VO energy + lamp/lit tags
    (see scripts/gen_cue_classes.py)
  * subject-aware framing: saliency anchor per image (edge-energy centroid
    blended with centre bias) instead of dead-centre crops
  * VO-prosody edit bias: loud cues favour hard cuts and faster moves,
    quiet cues favour soft fades and near-stillness
  * motion-continuity: pan direction chains across runs of story cues and
    breaks at chapter beats

Camera language:
  * smoothstep-eased 6-pattern Ken Burns (push/pull/drift/pan), amplitude
    scaled with cue duration and energy; short cues never pan
  * handheld micro-shake (two low-frequency wobbles) + "breathing" zoom
  * intra-cue punch-in: on long punch/story cues, a hard snap to a detail
    framing of the SAME image (documentary punch), or a whip-reframe with
    2-frame motion blend (still 1:1 image:cue, inside the cue window)

Transitions (all inside the segment -> timing-safe):
  * cut vocabulary: hard cut / gentle dip / soft breathing fade, mixed per
    class and energy; dips pass through warm dark (palette), pure black is
    punctuation only
  * chapter beats, episode open/close: longer fades through black + a brief
    warm light-leak pulse (decaying brightness/saturation) at the cut
  * "paint settle": 2-step soft-focus at scene starts (wet-paint feel)

Grade & light:
  * text-driven emotional grade (dark cues cool+desat, light cues warm+lift,
    chapter cues bleach-bypass hint) + global warm shadow lift
  * day->night white-balance drift across the episode
  * exposure settle at every scene start; lamp flicker on lit cues
  * bloom/halation on lit cues (screen-blend blurred highlight pass)
  * chromatic lens fringing (1px), subtle animated grain, class-varied
    vignette; slow living-painting light sweep overlay across every scene

QC & reports:
  * adjacent near-duplicate image detection (warns before render)
  * end-of-build pacing report (per-chapter motion/cut mix)

Styles: --style pro|art|doc|classic  (classic = old kbv2 behaviour)

Usage:
  python3 build_video.py --dry-run --srt tv8.srt --name tv8 --images images_tv8
  python3 build_video.py --limit 12 --res 2560x1440 --srt tv8.srt --name tv8 \
      --images images_tv8 --cue-class prompts/cue_classes.json \
      --chapter-cues "14,69,100,117,143,165,189,215,239,291" --style pro
  FFMPEG_BIN=/path/to/ffmpeg python3 build_video.py ...
"""
import argparse
import hashlib
import json
import re
import shutil
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path.cwd()  # run from the episode project root (folder with tvN.srt)
IMG_DIR = ROOT / "images"
AUD_DIR = ROOT / "audio"
OUT_DIR = ROOT / "output"
SRT_PATH = ROOT / "tv6.srt"
FONT_DIR = ROOT / "fonts"

FPS = 24
W, H = 1280, 720
CRF = 24
TAIL_AFTER_VO = 2.0
FADE_WARM = "0x160909"       # dip-through warm dark (art palette)
FADE_DEEP = "0x120806"       # deeper warm dark for word frames
FADE_BLACK = "black"         # punctuation only
STYLE_TAG = "proedit1"
CHAPTER_CUES = set()
LAST_CUE_N = 0
IMAGE_EXTS = (".jpg", ".jpeg", ".png", ".webp", ".bmp")
AUDIO_EXTS = (".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac")

# per-style look parameters
STYLES = {
    #           k_amp shake bloom grain sweep grade warm flicker
    "pro":     dict(k=1.00, shake=1.00, bloom=0.15, grain=5, sweep=1.00,
                    grade=1.00, warm=1.00, flicker=1.00),
    "art":     dict(k=0.80, shake=0.55, bloom=0.22, grain=7, sweep=1.40,
                    grade=1.30, warm=1.35, flicker=1.20),
    "doc":     dict(k=1.15, shake=1.30, bloom=0.09, grain=4, sweep=0.65,
                    grade=0.80, warm=0.70, flicker=0.60),
    "classic": dict(k=1.00, shake=0.00, bloom=0.00, grain=0, sweep=0.00,
                    grade=0.00, warm=0.00, flicker=0.00),
}


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


# ---------------------------------------------------------------- analysis
def _h(*parts) -> int:
    return int(hashlib.md5("|".join(str(p) for p in parts).encode()).hexdigest(), 16)


def image_anchor(path: Path):
    """Saliency proxy: edge-energy centroid blended toward centre (0..1)."""
    try:
        from PIL import Image, ImageFilter
        im = Image.open(path).convert("L").resize((80, 45))
        edges = im.filter(ImageFilter.FIND_EDGES)
        px = list(edges.getdata())
        tot = sum(px) + 1
        cx = sum((i % 80) * v for i, v in enumerate(px)) / tot / 79.0
        cy = sum((i // 80) * v for i, v in enumerate(px)) / tot / 44.0
        ax = min(0.68, max(0.32, 0.55 * cx + 0.45 * 0.5))
        ay = min(0.68, max(0.32, 0.55 * cy + 0.45 * 0.48))
        return round(ax, 3), round(ay, 3)
    except Exception:
        return 0.5, 0.5


def build_anchor_cache(imgs):
    cache_p = OUT_DIR / "anchors_cache.json"
    cache = {}
    if cache_p.exists():
        try:
            cache = json.loads(cache_p.read_text())
        except Exception:
            cache = {}
    for p in imgs:
        key = f"{p.name}:{p.stat().st_mtime_ns}"
        if key not in cache:
            ax, ay = image_anchor(p)
            cache[key] = [ax, ay]
    OUT_DIR.mkdir(exist_ok=True)
    cache_p.write_text(json.dumps(cache), encoding="utf-8")
    return cache


def img_key_anchor(cache, img: Path):
    key = f"{img.name}:{img.stat().st_mtime_ns}"
    return tuple(cache.get(key, [0.5, 0.5]))


def phash64(path: Path):
    try:
        from PIL import Image
        im = Image.open(path).convert("L").resize((16, 16))
        px = list(im.getdata())
        avg = sum(px) / 256.0
        bits = 0
        for i, v in enumerate(px):
            if v > avg:
                bits |= 1 << i
        return bits
    except Exception:
        return None


def qc_duplicates(hits):
    """Warn when adjacent cue images are near-identical (same-shot cut)."""
    warns = 0
    prev = None
    for c, p in hits:
        h = phash64(p)
        if h is not None and prev is not None:
            if bin(h ^ prev[0]).count("1") <= 6:
                print(f"  QC warn: cue {prev[1]} and cue {c['n']} look "
                      f"near-identical (same-shot cut)")
                warns += 1
        prev = (h, c["n"])
    return warns


def load_cue_class(args):
    cls_map = {}
    if args.cue_class:
        cls_map = {int(k): v for k, v in
                   json.loads((ROOT / args.cue_class).read_text()).items()}
    return cls_map


def policy_for(n, dur, cls_map, energy=0.5):
    """Editorial policy for one cue: class, mood, look knobs."""
    info = cls_map.get(n, {})
    cls = info.get("class", "story")
    mood = info.get("mood", "neutral")
    lit = bool(info.get("lit", False))
    e = float(info.get("energy", energy))
    return dict(cls=cls, mood=mood, lit=lit, energy=e)


# ---------------------------------------------------------------- timeline
def plan(cues, total, limit=None):
    """Per-cue segments [start, end) with an exact global frame budget."""
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
    global LAST_CUE_N
    LAST_CUE_N = segs[-1]["n"] if segs else 0
    return cues, segs


# ---------------------------------------------------------------- camera
def motion_script(n, frames, dur, ax, ay, pol, style):
    """Eased, varied Ken Burns with handheld wobble + breathing.

    Returns (zoom_expr, x_expr, y_expr, pattern_id)."""
    d = max(frames, 4)
    t = f"(on/{d})"
    hold = f"(min(max(({t}-0.07)/0.86,0),1))"          # settle at both ends
    e = f"({hold}*{hold}*(3-2*{hold}))"                # smoothstep of hold
    h = _h("cam", STYLE_TAG, n)
    e_mul = 0.85 + 0.30 * pol["energy"]                # loud cues move more
    k = max(0.05, min(0.14, (0.02 + dur * 0.012) * style["k"] * e_mul))
    sh = style["shake"]
    wob_x = (f"({0.0022 * sh:.4f})*(iw-iw/zoom)*(sin(on*0.117+{(h % 31):.1f})"
             f"+0.6*sin(on*0.041+{(h >> 5) % 23:.1f}))")
    wob_y = (f"({0.0022 * sh:.4f})*(ih-ih/zoom)*(sin(on*0.093+{(h >> 9) % 29:.1f})"
             f"+0.6*sin(on*0.053+{(h >> 14) % 19:.1f}))")
    br = f"(1+{0.0028:.4f}*sin(on*0.047+{(h >> 3) % 17:.1f}))"   # breathing
    if pol["cls"] == "word":
        k *= 0.45                                         # near-frozen beats
    if dur < 2.2:
        pat = h % 2                                       # short: push/pull
    else:
        pat = h % 6
    # motion continuity: chain pan direction over story runs
    if pol["cls"] == "story" and dur >= 3.0:
        pat = 4 + ((n // 2) % 2)                          # alternating pans
        if n in CHAPTER_CUES:
            pat = h % 2
    cxi = min(0.70, max(0.30, ax))
    cyi = min(0.70, max(0.30, ay))
    cxc = f"(iw-iw/zoom)*{cxi + ((h >> 8) % 9 - 4) / 100:.3f}"
    cy = f"(ih-ih/zoom)*{cyi + ((h >> 11) % 9 - 4) / 100:.3f}"
    if pat == 0:
        z = f"({br})*(1+{k:.4f}*{e})"
        return z, f"{cxc}+{wob_x}", f"{cy}+{wob_y}", pat
    if pat == 1:
        z = f"({br})*({1 + k:.4f}-{k:.4f}*{e})"
        return z, f"{cxc}+{wob_x}", f"{cy}+{wob_y}", pat
    if pat == 2:
        z = f"({br})*(1+{k:.4f}*{e})"
        return (z, f"(iw-iw/zoom)*({cxi:.3f}*0.4+{1 - cxi:.3f}*{e})+{wob_x}",
                f"{cy}+{wob_y}", pat)
    if pat == 3:
        z = f"({br})*({1 + k:.4f}-{k:.4f}*{e})"
        return (z, f"(iw-iw/zoom)*({0.25 + cxi * 0.6:.3f}-{0.5:.3f}*{e})+{wob_x}",
                f"{cy}+{wob_y}", pat)
    if pat == 4:
        z = f"({br})*(1+{k / 2:.4f})"
        return z, f"(iw-iw/zoom)*{e}+{wob_x}", f"{cy}+{wob_y}", pat
    z = f"({br})*(1+{k / 2:.4f})"
    return z, f"(iw-iw/zoom)*(1-{e})+{wob_x}", f"{cy}+{wob_y}", pat


# ---------------------------------------------------------------- transitions
def fades_for(n, dur, pol):
    """-> (fade_in, fade_out, colour, leak) per class + energy + beats."""
    cls = pol["cls"]
    e = pol["energy"]
    h = _h("fade", STYLE_TAG, n)
    din = dout = 0.0
    col, leak = FADE_WARM, False
    if cls == "word":
        din = dout = min(0.45, dur * 0.33)
        col = FADE_DEEP
    elif cls == "host":
        din = dout = min(0.28, dur * 0.25)
    elif cls == "soft":
        din = dout = min(0.42, dur * 0.30)
    elif cls == "punch":
        din = dout = 0.0                                  # hard cuts
    elif cls == "chapter":
        din = dout = 0.0
    else:                                                 # story mix
        fam = h % 10
        if fam <= 1 + int(e > 0.72):                      # loud -> more cuts
            din = dout = 0.0
        elif fam <= 4:
            din = dout = min(0.42, dur * 0.32)
        else:
            din = dout = min(0.15, dur * 0.22)
    if n in CHAPTER_CUES:
        din, col, leak = max(din, min(0.55, dur * 0.35)), FADE_BLACK, True
    if (n + 1) in CHAPTER_CUES:
        dout, col = max(dout, min(0.50, dur * 0.35)), FADE_BLACK
    if n == 1:
        din, col, leak = max(din, min(0.90, dur * 0.45)), FADE_BLACK, True
    if n == LAST_CUE_N:
        dout, col = max(dout, min(1.50, dur * 0.50)), FADE_BLACK
    return min(din, dur * 0.40), min(dout, dur * 0.40), col, leak


# ---------------------------------------------------------------- grade
def grade_exprs(pol, n, n_total, style, leak):
    """-> (brightness_expr, eq_fixed, colorbalance, vignette_angle)."""
    g, warm, fl = style["grade"], style["warm"], style["flicker"]
    drift = (n / max(n_total, 1))
    settle = "(-0.075)*exp(-2.4*t)"
    flick = ("(0)" if not (pol["lit"] and fl > 0)
             else f"({0.012 * fl:.4f})*sin(2*PI*3.0*t+1.3)")
    leakp = "0.11*exp(-3.2*t)" if leak else "0"
    br = f"({settle})+{flick}+({leakp})"
    if pol["cls"] == "word":
        c, s, gam = 1.06 + 0.04 * g, 1.02, 1.00
    elif pol["cls"] == "chapter":
        c, s, gam = 1.09 + 0.04 * g, 0.82, 0.98            # bleach hint
    else:
        c, s, gam = 1.03 + 0.03 * g, 1.00, 1.02
    if pol["mood"] == "dark":
        c, s = c + 0.02 * g, max(0.75, s - 0.12 * g)
    elif pol["mood"] == "light":
        c, s = c, min(1.25, s + 0.07 * g)
    sat_leak = 1.04 if leak else 1.0
    eq_fixed = (f"contrast={c:.3f}:saturation={s * sat_leak:.3f}:"
                f"gamma={gam:.3f}")
    rs = 0.015 * warm
    bs = -0.005 * warm + 0.020 * (drift ** 1.2) * g
    rm = 0.010 * warm
    bm = -0.010 * warm
    if pol["mood"] == "dark":
        rs -= 0.030 * g
        bs += 0.040 * g
    elif pol["mood"] == "light":
        rs += 0.035 * g
        rm += 0.020 * g
    cb = (f"rs={rs:.3f}:gs={0.004 * warm:.3f}:bs={bs:.3f}:"
          f"rm={rm:.3f}:bm={bm:.3f}")
    if pol["cls"] == "word":
        vg = "PI/3.4"
    elif pol["cls"] == "chapter":
        vg = "PI/4.6"
    else:
        vg = f"PI/{4.0 + (_h('vg', n) % 5) / 10:.1f}"
    return br, eq_fixed, cb, vg


# ---------------------------------------------------------------- render
def make_sweep_png():
    """Warm light-sweep overlay (2W x H, soft alpha) for living-paint feel."""
    from PIL import Image
    p = OUT_DIR / "sweep.png"
    w, h = W * 2, H
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    px = im.load()
    for y in range(0, h, 2):
        for x in range(0, w, 2):
            u = x / w
            a = max(0.0, 1.0 - abs(u - 0.42) * 3.2) ** 2
            v = int(232 * a * 0.22)          # max alpha ~22/255
            r, gg, b = 255, 216, 168
            px[x, y] = (r, gg, b, v)
            if x + 1 < w:
                px[x + 1, y] = (r, gg, b, v)
            if y + 1 < h:
                px[x, y + 1] = (r, gg, b, v)
                if x + 1 < w:
                    px[x + 1, y + 1] = (r, gg, b, v)
    im.save(p)
    return p


def render_clip(ffmpeg, seg, img: Path, out: Path, frames, dur, pol, style,
                sweep: Path, mode):
    """Render one clip. mode: 'full' | 'punch_a' | 'punch_b' | 'whip_b'."""
    ax, ay = seg["_anchor"]
    z, x, y, pat = motion_script(seg["n"], frames, dur, ax, ay, pol, style)
    if mode == "punch_b":
        z = f"(1+{0.16 * style['k']:.4f})*(1-0.25*((on/{max(frames, 4)})))"
        x = f"(iw-iw/zoom)*{min(0.62, ax + 0.10):.3f}"
        y = f"(ih-ih/zoom)*{min(0.62, ay + 0.06):.3f}"
    elif mode == "whip_b":
        d = max(frames, 4)
        z = f"1+{0.10 * style['k']:.4f}"
        x = f"(iw-iw/zoom)*(0.15+0.70*(on/{d}))"      # fast travel
        y = f"(ih-ih/zoom)*{ay:.3f}"
        pat = 4

    br, eq_fixed, cb, vg = grade_exprs(pol, seg["n"], LAST_CUE_N, style,
                                       seg.get("_leak", False))
    chain = [f"scale={W}:{H}:force_original_aspect_ratio=increase,"
             f"crop={W}:{H}",
             f"zoompan=z='{z}':x='{x}':y='{y}':d={frames}:"
             f"s={W}x{H}:fps={FPS}"]
    if pat in (4, 5) and style["shake"] > 0 and mode == "full":
        chain.append("tmix=frames=2:weights='0.55 0.45'")   # motion blend
    if pol["cls"] in ("word", "punch") and mode.endswith("b"):
        chain.append("tmix=frames=2:weights='0.65 0.35'")
    bloom = style["bloom"] * (1.35 if pol["lit"] else 0.55)
    chain.append(f"eq=brightness='{br}':{eq_fixed}:eval=frame")
    chain.append(f"colorbalance={cb}")
    chain.append("rgbashift=rh=1:bh=-1")
    chain.append("boxblur=luma_radius=3:luma_power=1:enable='lt(t,0.22)'")
    chain.append("boxblur=luma_radius=2:luma_power=1:"
                 "enable='between(t,0.22,0.5)'")
    chain.append(f"vignette=angle={vg}")
    if style["grain"]:
        chain.append(f"noise=alls={style['grain']}:allf=t+u")

    din, dout, col, leak = fades_for(seg["n"], dur, pol)
    if mode == "punch_a" or mode == "whip_b":
        dout = 0.0
    if mode in ("punch_b",):
        din = 0.0
    if mode == "full":
        pass
    else:
        if mode == "punch_a":
            din = din if seg.get("_din_on_first", True) else 0.0
        if mode == "punch_b":
            dout = seg.get("_dout", 0.0)
            col = seg.get("_col", col)
    if din >= 0.5 / FPS:
        chain.append(f"fade=t=in:st=0:d={din:.3f}:color={col}")
    if dout >= 0.5 / FPS:
        chain.append(f"fade=t=out:st={max(dur - dout, 0):.3f}:"
                     f"d={dout:.3f}:color={col}")

    vchain = ",".join(chain)
    cmd = [ffmpeg, "-y", "-hide_banner", "-loglevel", "error",
           "-loop", "1", "-t", f"{dur:.3f}", "-i", str(img)]
    if sweep is not None and style["sweep"] > 0:
        cmd += ["-loop", "1", "-t", f"{dur:.3f}", "-i", str(sweep)]
        d = 1 if _h("sw", seg["n"]) % 2 == 0 else -1
        nfr = max(frames, 4)
        ox = (f"-w+(W+w)*(n/{nfr})" if d > 0
              else f"W-(W+w)*(n/{nfr})")
        op = 0.42 * style["sweep"]
        fg = (f"[0:v]{vchain}[base];"
              f"[1:v]format=rgba,colorchannelmixer=aa={op:.2f}[sw];"
              f"[base][sw]overlay=x='{ox}':y=0:eval=frame,"
              f"format=yuv420p,setsar=1[v]")
        cmd += ["-filter_complex", fg, "-map", "[v]"]
    else:
        cmd += ["-vf", vchain + ",format=yuv420p,setsar=1"]
    cmd += ["-frames:v", str(frames),
            "-c:v", "libx264", "-preset", "medium", "-crf", str(CRF),
            "-pix_fmt", "yuv420p", "-r", str(FPS), str(out)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"segment {seg['label']} ({mode}): {r.stderr[-800:]}")


def render_segment(ffmpeg, seg, img: Path, out: Path, pol, style, sweep):
    """One cue -> one segment file (possibly two internal punch-in clips)."""
    dur, frames = seg["dur"], seg["frames"]
    punch = (dur >= 4.5 and style["shake"] > 0 and (
        pol["cls"] == "punch"
        or (pol["cls"] == "story" and _h("pk", seg["n"]) % 5 < 2)))
    if not punch:
        render_clip(ffmpeg, seg, img, out, frames, dur, pol, style, sweep,
                    "full")
        return
    h = _h("punch", seg["n"])
    f2 = min(int(frames * 0.38), int(2.2 * FPS))
    f2 = max(f2, int(0.9 * FPS))
    f1 = frames - f2
    d1, d2 = f1 / FPS, f2 / FPS
    a = OUT_DIR / f"_pa_{seg['n']:03d}.mp4"
    b = OUT_DIR / f"_pb_{seg['n']:03d}.mp4"
    din, dout, col, leak = fades_for(seg["n"], dur, pol)
    seg.update(_leak=leak, _dout=dout, _col=col, _din_on_first=True)
    render_clip(ffmpeg, seg, img, a, f1, d1, pol, style, sweep, "punch_a")
    seg["_leak"] = False
    render_clip(ffmpeg, seg, img, b, f2, d2, pol, style, sweep,
                "whip_b" if h % 3 == 0 else "punch_b")
    lst = OUT_DIR / f"_pl_{seg['n']:03d}.txt"
    lst.write_text(f"file '{a}'\nfile '{b}'\n", encoding="utf-8")
    r = subprocess.run([ffmpeg, "-y", "-hide_banner", "-loglevel", "error",
                        "-f", "concat", "-safe", "0", "-i", str(lst),
                        "-c", "copy", str(out)],
                       capture_output=True, text=True)
    a.unlink(missing_ok=True)
    b.unlink(missing_ok=True)
    lst.unlink(missing_ok=True)
    if r.returncode != 0:
        raise RuntimeError(f"punch concat {seg['label']}: {r.stderr[-500:]}")


# ---------------------------------------------------------------- build
def build(args):
    global W, H, CRF, IMG_DIR, SRT_PATH, CHAPTER_CUES
    w, _, h = args.res.partition("x")
    W, H = int(w), int(h)
    CRF = args.crf
    CHAPTER_CUES = {int(x) for x in args.chapter_cues.split(",") if x.strip()}
    style = STYLES[args.style]
    IMG_DIR = ROOT / args.images
    SRT_PATH = ROOT / args.srt
    ffmpeg = find_ffmpeg()
    cues_all = parse_srt(SRT_PATH)
    idx = index_images()
    vo = None
    if args.name:
        cand = AUD_DIR / f"{args.name}_master.mp3"
        if cand.exists():
            vo = cand
    if vo is None:
        vo = find_audio(AUD_DIR)
    n_cues = len(cues_all)
    cls_map = load_cue_class(args)

    scope = cues_all[:args.limit] if args.limit else cues_all
    hits, missing = [], []
    for c in scope:
        hit = find_image(idx, c["label"], c["n"])
        (hits if hit else missing).append((c, hit))

    print(f"Style        : {args.style}"
          + (f"  (+{len(cls_map)} cue-class tags)" if cls_map else ""))
    print(f"SRT cues      : {n_cues}"
          + (f" (building first {len(scope)})" if args.limit else ""))
    print(f"Images found  : {len(hits)} / {len(scope)}"
          + (f"   [full set: {n_cues - len(scope)} more to generate]"
             if args.limit else ""))
    print(f"Master VO     : {vo.name if vo else 'NOT FOUND'}")

    if missing and not args.dry_run:
        print(f"\nMISSING {len(missing)} images. Refusing to build with "
              f"placeholders or reused images.")
        for c, _ in missing[:20]:
            print(f"  cue {c['n']:>3}  {c['label']:<12} -> "
                  f"expected {IMG_DIR.name}/{c['label']}.jpg")
        if len(missing) > 20:
            print(f"  ... and {len(missing) - 20} more")
        return 2

    srt_end = cues_all[-1]["end"]
    vo_dur = media_duration(ffmpeg, vo) if vo else 0.0
    total = max(srt_end, vo_dur) + TAIL_AFTER_VO
    # A limited smoke build must stay limited through the final mux as well
    # as the segment render; otherwise it appends the full episode VO.
    if args.limit:
        total = min(total, cues_all[min(args.limit, len(cues_all)) - 1]["end"] + 1.0)
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
        print("No master VO in audio/. Build it first: "
              "python3 scripts/build_master_audio.py")
        return 2

    cues, segs = plan(cues_all, total, limit=args.limit)
    print(f"Clips         : {len(segs)}   output {total:.2f}s ({total / 60:.1f} min) "
          f"@ {W}x{H} {FPS}fps")

    # analysis caches
    OUT_DIR.mkdir(exist_ok=True)
    anchor_cache = build_anchor_cache([p for _, p in hits])
    qw = qc_duplicates(hits)
    if qw:
        print(f"QC            : {qw} same-shot warning(s)")
    sweep = make_sweep_png() if style["sweep"] > 0 else None

    seg_dir = OUT_DIR / f"segments_{args.style}_{STYLE_TAG}"
    seg_dir.mkdir(parents=True, exist_ok=True)

    def _cached(p: Path):
        return p.exists() and p.stat().st_size > 2048

    todo = [s for s in segs if not _cached(seg_dir / f"{s['n']:03d}.mp4")]
    print(f"Stage 1       : rendering {len(todo)} segments "
          f"({len(segs) - len(todo)} cached) ...")

    cutmix = defaultdict(lambda: defaultdict(int))
    done = 0
    for s in segs:
        if s not in todo:
            pol = policy_for(s["n"], s["dur"], cls_map)
            cutmix[(pol["cls"],)]["cached"] += 1
            continue
        img = find_image(idx, s["label"], s["n"])
        pol = policy_for(s["n"], s["dur"], cls_map)
        s["_anchor"] = img_key_anchor(anchor_cache, img)
        din, dout, col, leak = fades_for(s["n"], s["dur"], pol)
        s["_leak"] = leak
        s["_din"] = din
        s["_dout"] = dout
        s["_col"] = col
        final = seg_dir / f"{s['n']:03d}.mp4"
        tmp = seg_dir / f"{s['n']:03d}.tmp.mp4"
        render_segment(ffmpeg, s, img, tmp, pol, style, sweep)
        tmp.replace(final)          # atomic: partial renders never cached
        cutmix[(pol["cls"],)]["cuts" if (din < 0.02 and dout < 0.02)
                              else "fades"] += 1
        done += 1
        if done % 15 == 0 or done == len(todo):
            print(f"  ... {done}/{len(todo)} segments")

    # stage 2: concat (stream copy) -> silent video
    lst = seg_dir / "concat.txt"
    lines = [f"file '{seg_dir / (format(s['n'], '03d') + '.mp4')}'\n"
             for s in segs]
    lst.write_text("".join(lines), encoding="utf-8")
    vid = OUT_DIR / "video_only.mp4"
    cmd = [ffmpeg, "-y", "-hide_banner", "-loglevel", "error",
           "-f", "concat", "-safe", "0", "-i", str(lst),
           "-c", "copy", str(vid)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print("concat failed:", r.stderr[-800:])
        return r.returncode

    # stage 3: mux the master VO (Path A, raw)
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
        style_s = ("FontName=Noto Sans Devanagari,Fontsize=18,"
                   "PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,"
                   "BorderStyle=1,Outline=2,Shadow=0,MarginV=34,Alignment=2")
        vf = (f"subtitles={SRT_PATH}:fontsdir={FONT_DIR}:"
              f"force_style='{style_s}'")
        cmd = [ffmpeg, "-y", "-hide_banner", "-loglevel", "error", "-stats",
               "-i", str(vid), "-i", str(vo),
               "-map", "0:v:0", "-map", "1:a:0",
               "-vf", vf,
               "-c:v", "libx264", "-preset", "medium", "-crf", str(CRF),
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

    # pacing report
    print("\nPacing report (class -> cuts/fades):")
    for key in sorted(cutmix):
        m = cutmix[key]
        print(f"  {key[0]:<8} cuts={m['cuts']:<4} fades={m['fades']:<4} "
              f"cached={m['cached']}")
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
    ap.add_argument("--chapter-cues", default="",
                    help="comma-separated cue numbers that open a chapter; "
                         "those boundaries get pure-black punctuation beats")
    ap.add_argument("--cue-class", default="",
                    help="JSON sidecar with per-cue class/mood/lit/energy "
                         "(from scripts/gen_cue_classes.py)")
    ap.add_argument("--style", default="pro", choices=sorted(STYLES),
                    help="look style: pro | art | doc | classic")
    sys.exit(build(ap.parse_args()))
