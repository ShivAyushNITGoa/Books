# Provenance — where the pictures come from

**Every image in this project is drawn by code.** There is no third-party artwork in the film.

| Item | Value |
|---|---|
| Generator | `02_storyboard/make_boards.py` (Python + Pillow + NumPy) |
| Method | flat polygons / rectangles / ellipses / tapered limbs, radial glows, halftone dots, film grain, vignette |
| External assets | **none** — no stock photos, no downloaded brushes/textures, no fonts, no traced reference, no AI image model |
| Output | `04_animation/shots/S01.jpg … S30.jpg` (1920×1080, JPG q88) + `08_delivery/boards_contact_sheet.jpg` |
| Fonts | none rendered in the boards; the only type in the film is the S32 title, set by the assembler |
| Regenerate | `python3 rise_of_legend/02_storyboard/make_boards.py` |

## Why this is copyright-clean

1. **Generative, not derivative.** The images do not encode a copy of any existing picture. Each
   frame is a small deterministic program (`random.seed(shot_id)` → same pixels every run) built
   from primitives and a palette chosen for this project.
2. **No character copying.** The figures are generic construction: a 100-unit skeleton, a hooded
   mantle, a sari, a bone-pale mantle, a static face. No costume, emblem, logo or silhouette is
   taken from another franchise. The only mark that recurs is the **five-petal chest seal**, invented
   for this story, and its palette (ochre / teal / vermilion / silver / violet).
3. **No photography or likeness.** There is no photographic input and no actor face; nothing here
   can be attributed to a real, identifiable person.
4. **No found text.** The incised "script" on the palm-leaf page (S21) is a scatter of abstract
   dashes, not a writing system or a quotation.

## Reproducibility

The generator is seeded per shot (`random.seed(shot_id)`), so re-running the script reproduces the
shipped frames pixel-for-pixel on the same Pillow/NumPy versions. To verify:

```bash
python3 rise_of_legend/02_storyboard/make_boards.py
git status rise_of_legend/04_animation/shots    # should be clean
```

Keep this file in sync with the generator: if the art route ever changes (hand-drawn frames, a
text-to-image model, an outsourced artist), record **tool, model/version, prompt or brief, seed,
date and the human author** here — that is the independent-creation record referenced by
`../00_admin/legal_checklist.md` §5b.
