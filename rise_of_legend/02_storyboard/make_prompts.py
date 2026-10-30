#!/usr/bin/env python3
"""
Build the 30-shot image prompt pack for Rise of Legend Ep. 1
============================================================
Composes one production-grade prompt per shot from the timeline (frame counts, camera) plus the
authored scene descriptions below, and writes:

  02_storyboard/PROMPTS.md      copy-paste pack (style bible + 30 prompts + negatives)
  02_storyboard/prompts.json    machine-readable (shot, target file, prompt, negative)

S31 (black card) and S32 (title card) need no artwork — the assembler renders them.

Usage:
  python3 rise_of_legend/02_storyboard/make_prompts.py
"""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
TL = json.loads((ROOT / "timeline.json").read_text(encoding="utf-8"))

STYLE = (
    "Limited-animation frame for an Indian mythic-tech animated short, 16:9, 1920x1080. "
    "Flat vector shapes, thick clean silhouette outlines, halftone dot shading, subtle gold-leaf "
    "texture, two-tone cinematic lighting, strong readable pose. Palette: deep indigo #141A3A, "
    "brass #C9A227, cream #F5ECD6, with element accents ochre #C98A2E, teal #2E9C9C, "
    "vermilion #D8412F, silver #DCE6F2, violet #7B5BD6. "
    "No text, no captions, no logos, no watermark."
)

NEGATIVE = ("text, letters, subtitles, watermark, logo, signature, photorealistic, 3d render, "
            "extra limbs, extra fingers, deformed hands, cloned face, motion blur, lens flare, "
            "heavy bokeh, western superhero costume, cape")

CHARACTERS = {
    "arin": ("ARIN RATHORE, a 24-year-old Indian man, lean, short black hair, tired eyes, "
             "mustard-yellow kurta with ink-stained cuffs, sleeves rolled"),
    "pranveer": ("PRANVEER: deep indigo-black costume with brass filigree, five small glowing chest "
                 "panels (ochre, teal, vermilion, silver, violet), asymmetric palm-leaf shawl over the "
                 "left shoulder, high collar, brass vented half-mask over nose and mouth, brass "
                 "forearm guards, no cape"),
    "amma": ("BADI AMMA, a 68-year-old blind Indian woman, white cotton sari with a thin brass "
             "border, silver hair in a low bun, closed milky eyes, wooden walking stick, serene"),
    "zoya": ("ZOYA, a 26-year-old Indian woman, navy cyber-crime jacket over a teal kurta, tight "
             "braid, badge on a lanyard, sidearm holstered"),
    "timir": ("TIMIR: tall gaunt man in a charcoal suit with gold pinstripes; his face is a seamless "
              "field of grey television static crossed by fine gold cracks, no eyes, no mouth"),
    "shunya": ("SHUNYA: bone-white segmented armour, large sound-dampening ear muffs, faceless "
               "helmet with a narrow dark visor, long spear"),
    "crew": ("GRAHAN SENA crew: private security in grey survey vests and hard hats, full-face "
             "respirators, calm and professional"),
}

# shot -> (scene description, characters in frame)
SCENES = {
    "S01": ("Extreme wide of Nandipur from a hilltop observatory at dusk: cooling towers, temple "
            "spires, a flyover, low apartment blocks, all still. A total solar eclipse — black disc "
            "with a thin gold corona — hangs over the skyline. Two tiny birds cross the disc.",
            []),
    "S02": ("High angle down a main street: blocks of buildings going dark in a wave running down "
            "from the hill, sodium lamps out, shopfronts black, one scooter headlight still moving "
            "through the dark street.", []),
    "S03": ("Macro of five carved stone instruments in a row on a hilltop plinth, each with a "
            "different element motif; the fifth, violet, has a fresh hairline crack with a thread of "
            "dust falling from it.", []),
    "S04": ("Museum basement restoration room: one warm desk lamp over a wooden desk, glass display "
            "cases, shelves of palm-leaf manuscripts, a ceiling fan above. Arin sits brushing a "
            "manuscript, calm and absorbed, seen in a medium-wide shot.",
            ["arin"]),
    "S05": ("Over-the-shoulder close-up of Arin's ink-stained hands: a fine brush on a palm-leaf "
            "manuscript, and the black ink beneath the brush crawling into a spiral against the "
            "stroke direction.", ["arin"]),
    "S06": ("Close-up of Arin's face reflected in a glass display case; behind his reflection, five "
            "thin coloured breath-lines — ochre, teal, vermilion, silver, violet — rise off the page "
            "and bend toward him.", ["arin"]),
    "S07": ("Insert on an open right palm: a five-petal emblem burning in from the centre, each petal "
            "lighting in turn — ochre, teal, vermilion, silver, violet — the skin lit from within.",
            ["arin"]),
    "S08": ("Arin's forearm and shoulder as five coloured ribbons of light spiral upward from his "
            "palm and vanish; his cuff smokes; he gasps, other hand braced on the desk.",
            ["arin"]),
    "S09": ("Vault corridor in red emergency light: a plasma cutter opening a steel door, sparks "
            "bursting; three Grahan Sena crew in survey vests and respirators move calmly, one "
            "lifting a brass-bound stone cube into a case.", ["crew"]),
    "S10": ("Zoya steps out from behind a display case, sidearm drawn but finger off the trigger, "
            "badge swinging on its lanyard, lit by cutter sparks; she is alone and the crew behind "
            "her does not stop.", ["zoya", "crew"]),
    "S11": ("A security drone clamped to a concrete pillar fires its bolts; the pillar tilts toward "
            "Zoya as she looks up; low angle, dust in the air, red emergency light.", ["zoya"]),
    "S12": ("Arin on one knee in the vault, one hand thrust out, mid-inhale; the five-petal mark "
            "flares ochre and plates of earth-armour crawl up his forearm and over his shoulder.",
            ["arin"]),
    "S13": ("Arin catches a falling concrete pillar across his shoulders, feet cracking the floor, "
            "dust bursting outward in a radial sheet; low angle, earth-armour glowing on his arms.",
            ["arin"]),
    "S14": ("The vault after the dust clears: Zoya stares at Arin, he stares at his own arm; behind "
            "them the empty case where the keystone was; one petal of the mark is grey.",
            ["arin", "zoya"]),
    "S15": ("Courtyard at first light with a chai kettle steaming and marigolds: Badi Amma, eyes "
            "closed, circles Arin with a wooden stick; warm saffron light, dust in the air.",
            ["amma", "arin"]),
    "S16": ("Courtyard split composition: Badi Amma pressing her stick into Arin's chest as he holds "
            "an earth stance; beside it, his cut palm closing as teal water-light flows over it.",
            ["amma", "arin"]),
    "S17": ("Courtyard vignette in three beats: fire bursting from Arin's palm and singeing a "
            "marigold; a silver air-streak cutting across the frame; his body half-transparent "
            "violet with the kettle visible through him.", ["arin"]),
    "S18": ("Arin straining as two auras — ochre and teal — fight up his arms, flickering black at "
            "the edges; clenched face, teeth bared, courtyard behind.", ["arin"]),
    "S19": ("Arin flat on his back in a marigold bed, flowers exploding around him, one flower on "
            "his head; Badi Amma laughing, hand to her mouth, warm morning light.",
            ["arin", "amma"]),
    "S20": ("Arin standing in the courtyard as dust and gold leaf lift off the ground and spiral "
            "around him, pulled upward; shafts of dawn light, low angle.", ["arin"]),
    "S21": ("Close on Arin's shoulder: a palm-leaf-shaped shawl unfolding like a turning manuscript "
            "page, brass filigree writing itself along its edge.", ["arin"]),
    "S22": ("Low-angle hero shot: Pranveer stands in first light, five chest panels igniting left to "
            "right, vented half-mask closed, palm-leaf shawl settling, dust in the air.", ["pranveer"]),
    "S23": ("Rooftops at first light: Shunya in bone-white armour and sound-dampening muffs stands on "
            "the next roof, spear across the back, the keystone case at his feet; the city muted and "
            "grey behind.", ["shunya"]),
    "S24": ("Pranveer mid air-dash across a rooftop gap as a silver streak, tiles shattering under "
            "his landing, dust kicking up; strong diagonal composition.", ["pranveer"]),
    "S25": ("Shunya's spear thrust passing through Pranveer, who is rendered as violet outline only "
            "— no fill, just contour lines — with negative space where his chest was; total stillness.",
            ["pranveer", "shunya"]),
    "S26": ("Pranveer's brass knuckles glowing with fire as he lands a punch on Shunya's guard; "
            "impact rendered as a white-on-black inverted burst; both figures braced.",
            ["pranveer", "shunya"]),
    "S27": ("Cracked rooftop parapet with debris falling away; far below, a small morning crowd "
            "looking up, Zoya among them, tiny silhouettes; strong high angle.", ["zoya"]),
    "S28": ("Two-shot at the roof edge: the keystone case behind Pranveer, the crowd far below; he "
            "turns his back on the case, shoulders set, breath visible in the cold air.", ["pranveer"]),
    "S29": ("Timir seated on a throne of cable trays in a server temple: racks breathing warm air, "
            "his static face crossed with gold cracks, the keystone case in his hand, cold key light.",
            ["timir"]),
    "S30": ("A stone wall of five seal sockets: one dark and empty, four still holding dimming light; "
            "Timir's gloved fist closing in the foreground; beyond, the sky over the city dimming.",
            ["timir"]),
}

SKIP = {
    "S31": "black card — rendered by the assembler (`kind: color`)",
    "S32": "title card — rendered by the assembler (`kind: title`)",
}


def main() -> None:
    shots, blocks = [], []
    for s in TL["shots"]:
        sid = s["id"]
        target = f"04_animation/shots/{sid}.png"
        if sid in SKIP:
            shots.append({"shot": sid, "beat": s["beat"], "frames": s["frames"],
                          "target": None, "note": SKIP[sid]})
            continue
        scene, cast = SCENES[sid]
        cast_txt = (" Characters: " + "; ".join(CHARACTERS[c] + "." for c in cast)) if cast else ""
        camera = {"hold": "Locked-off camera.", "push": "Slight push in.",
                  "pull": "Slight pull back."}[s["camera"]]
        prompt = f"{STYLE} {scene}{cast_txt} {camera} Keep faces and key action inside a centred 9:16 column."
        shots.append({"shot": sid, "beat": s["beat"], "frames": s["frames"],
                      "seconds": round(s["frames"] / TL["fps"], 2), "target": target,
                      "prompt": prompt, "negative": NEGATIVE})
        blocks.append((sid, s, prompt))

    json.dump({"project": "Rise of Legend", "episode": TL["episode"],
               "style": STYLE, "negative": NEGATIVE, "characters": CHARACTERS,
               "shots": shots},
              open(HERE / "prompts.json", "w", encoding="utf-8"),
              indent=1, ensure_ascii=False)

    out = [f"""# IMAGE PROMPTS — 30 frames for *Rise of Legend*, Ep. 1

One prompt per shot, in cut order, sized for any text-to-image model. Target file names are
already the ones the assembler expects: `04_animation/shots/S01.png` … `S30.png`.

**S31 and S32 need no artwork** — the assembler renders the black card and the title card itself.

## How to use

1. Generate at **16:9**, ideally **1920×1080**. Do not upscale — the timeline expects clean 1080p.
2. Save as **PNG**, named exactly `S01.png`, `S02.png` … in `04_animation/shots/`.
3. Keep faces and key action inside a centred **9:16 column** so the vertical cut works.
4. Rebuild: `python3 rise_of_legend/07_build/assemble_10fps.py --build`.
5. Check each frame against the script (`01_script/script_ep01.md`) — the prompt is a starting point,
   the script is the truth.

**Style is shared by every prompt.** Paste it once per generation; it is already included below.

## Style string

```
{STYLE}
```

## Negative prompt (use for every image)

```
{NEGATIVE}
```

## Character blocks

| Key | Prompt fragment |
|---|---|"""]
    for k, v in CHARACTERS.items():
        out.append(f"| `{k}` | {v} |")
    out.append("\n---\n")

    for sid, s, prompt in blocks:
        out.append(
            f"### {sid} · beat {s['beat']} · {s['frames']} frames · "
            f"{s['frames'] / TL['fps']:.1f}s · cam {s['camera']}\n\n"
            f"**Save as:** `04_animation/shots/{sid}.png`\n\n"
            f"```\n{prompt}\n```\n\n"
            f"**Negative:** `{NEGATIVE}`\n")

    out.append("""---

## Continuity checks before you approve a frame

- [ ] **The mark** is on his **right palm**; five petals, one grey from S14 onward.
- [ ] **Arin** wears a torn, ink-stained mustard kurta S09–S14; a fresh one S15 onward.
- [ ] **Pranveer** never has a cape, a chest logo, or bright primary colours.
- [ ] **Timir** never shows eyes or a mouth — only static and gold cracks.
- [ ] **Shunya** is always bone-white; the frame around him is quieter, cooler, emptier.
- [ ] **Palette** stays indigo + brass; the only warm scene is the courtyard (S15–S21).
- [ ] No frame contains text, a watermark, or a logo.
""")
    (HERE / "PROMPTS.md").write_text("\n".join(out), encoding="utf-8")
    print(f"wrote PROMPTS.md ({len(blocks)} prompts) and prompts.json "
          f"({len(shots)} shots, {len(SKIP)} skipped)")


if __name__ == "__main__":
    main()
