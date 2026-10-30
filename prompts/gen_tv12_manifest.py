#!/usr/bin/env python3
"""Assemble the TV12 image-prompt pack from scene concepts.

Reads tv12.srt (authoritative timing/text) + prompts/tv12_scene_concepts.tsv
(creative layer: label<TAB>shot<TAB>concept with {M}/{W}/{H} cast tokens) and
writes the full framework-compliant pack, one prompt per cue, in one file:

  prompts/tv12_image_prompts.txt   human-readable pack (#label blocks)
  prompts/manifest.json            machine manifest (TV8/TV11 schema)

Every prompt = "{shot}, {concept}, {LOCKED_STYLE_PHRASE}".
Run from the repo root:  python3 prompts/gen_tv12_manifest.py
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path.cwd()
sys.path.insert(0, str(ROOT / "editing"))
from build_video import parse_srt  # noqa: E402

CAST = {
    "M": "the young Indian man (late twenties, short black hair, plain slate-blue shirt)",
    "W": "the young Indian woman (mid-twenties, dark hair loose, plain teal-grey kurta)",
    "H": "@Host, A. K. Chandradipti",
}

STYLE = ("painterly Indian editorial illustration, semi-realistic painted style close "
         "to photographic likeness, not cartoon and not photorealistic, visible brushstrokes "
         "and canvas texture, rich oxblood red and deep crimson accents, near-black and dark "
         "umber shadows, warm amber and aged brass practical light used sparingly, dark "
         "red-tinted low-key atmosphere, one controlled light source, soft controlled tonal "
         "modelling with deep shadow shapes, realistic human proportions and natural skin "
         "tones, restrained expressive faces, grounded Indian setting matching the scene's "
         "economic and location tier, clear readable silhouettes, mature graphic-novel "
         "painting sensibility, generous negative space, no text, no lettering, no numbers, "
         "no captions, no logos, no watermark, no cartoon, no caricature, no glossy 3D, no "
         "anime, no neon colours, no cinematic grading, no lens flare, no heavy bokeh, no rim "
         "light, 16:9 horizontal composition")

HOST_PLATE = (
    "full-body Talk2Society painted editorial illustration of A. K. Chandradipti, "
    "Indian man in his mid-30s, cold calculating strategist in the manner of a "
    "Machiavellian prince, unsmiling expression with intense assessing eyes, still "
    "and not a teacher, medium warm-brown complexion, realistic skin tones, "
    "naturally proportioned oval-to-square face, defined jawline, thick dark "
    "eyebrows, deep-set dark-brown eyes, straight proportionate nose, medium lips, "
    "full neatly groomed beard connected to moustache, dark thick wavy "
    "medium-length hair loosely swept back with strands over the forehead, "
    "charcoal-black textured blazer unbuttoned over a plain black crew-neck tee, "
    "deep oxblood velvet-look mantle draped over both shoulders to mid-thigh, not "
    "pooling on the floor, dark wristwatch with metallic case, hands clasped low in "
    "front, no props held, slim-to-average build, not muscular, neutral relaxed "
    "standing pose facing slightly toward camera, full body visible from head to "
    "feet, plain aged-ivory neutral background, " + STYLE)

# presenter-on-camera cues -> gen_cue_classes 'host' class
HOST_LABELS = ["0-52", "1-03", "1-11", "1-13", "1-18", "1-53", "4-05", "4-06",
               "4-55", "6-15", "6-16", "7-15", "7-20", "8-38", "9-02", "9-50",
               "10-51", "10-52", "12-45", "12-48", "14-13", "14-45", "14-48",
               "17-43", "18-24", "19-00", "19-50", "20-04", "20-20"]
# chapter beat cues (section openings)
CHAPTER_LABELS = ["1-13", "1-53", "4-05", "6-15", "8-38", "10-51", "12-45",
                  "14-45", "18-24", "20-20"]


def expand(concept: str) -> str:
    return re.sub(r"\{([MWH])\}", lambda m: CAST[m.group(1)], concept)


def main():
    cues = parse_srt(ROOT / "tv12.srt")
    by_label = {c["label"]: c for c in cues}

    rows = {}
    for ln in (ROOT / "prompts/tv12_scene_concepts.tsv").read_text(encoding="utf-8").splitlines()[1:]:
        if not ln.strip():
            continue
        lab, shot, concept = ln.split("\t", 2)
        if lab in rows:
            sys.exit(f"FATAL: duplicate concept label {lab}")
        rows[lab] = (shot.strip(), concept.strip())

    missing = [c["label"] for c in cues if c["label"] not in rows]
    extra = [l for l in rows if l not in by_label]
    if missing or extra:
        sys.exit(f"FATAL: missing={missing} extra={extra}")

    labels, prompts, blocks = {}, {}, []
    for c in cues:
        lab = c["label"]
        shot, concept = rows[lab]
        prompt = f"{shot}, {expand(concept)}, {STYLE}"
        key = "#" + lab
        labels[key] = prompt
        prompts[lab] = prompt
        blocks.append(f"{key}   [cue {c['n']} | {c['start_str']}]\n(cue text: {c['text']})\n{prompt}\n")

    host_cues = [by_label[l]["n"] for l in HOST_LABELS if l in by_label]
    chapters = [by_label[l]["n"] for l in CHAPTER_LABELS if l in by_label]
    labels["#Host"] = HOST_PLATE

    manifest = {
        "episode": "tv12",
        "srt": "tv12.srt",
        "cue_count": len(cues),
        "scene_count": len(cues),
        "host_plate": "refs/Host.jpg",
        "images_dir": "images_tv12/",
        "label_range": ["#0-00", "#" + cues[-1]["label"]],
        "collisions": {},
        "style_version": "V7",
        "host_cues": host_cues,
        "chapter_cues": chapters,
        "labels": labels,
    }
    (ROOT / "prompts/manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")

    head = ("TALK2SOCIETY TV12 — FULL IMAGE-PROMPT PACK (V7)\n"
            f"{len(cues)} scene prompts, 1 cue : 1 scene : 1 image. Labels = #M-SS from SRT start.\n"
            "Locked style phrase appended to every prompt. No generated text in any image.\n"
            "Host plate: prompts/manifest.json '#Host' -> refs/Host.jpg\n" + "=" * 78 + "\n\n")
    (ROOT / "prompts/tv12_image_prompts.txt").write_text(head + "\n".join(blocks), encoding="utf-8")

    print(f"manifest: {len(labels)-1} scene prompts + #Host  | host_cues={host_cues}")
    print(f"chapters: {chapters}")
    print("=" * 78)
    for c in cues[:10]:
        print(f"### {c['label']} ({c['text'][:40]}...)")
        print(prompts[c["label"]])
        print()
    print("### #Host (plate)")
    print(HOST_PLATE)


if __name__ == "__main__":
    main()
