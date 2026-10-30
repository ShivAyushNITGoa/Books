# 02_storyboard — one board per shot

> **The boards are drawn, and they are drawn by code.** [`make_boards.py`](make_boards.py) renders
> all 30 frames (S01–S30) at 1920×1080 from flat shapes and the palette below: no stock images, no
> third-party art, no photographic reference, no fonts. Output is therefore wholly original and
> carries no licensing risk. It writes `04_animation/shots/S##.jpg` plus
> `08_delivery/boards_contact_sheet.jpg`.
>
> ```bash
> python3 rise_of_legend/02_storyboard/make_boards.py            # all 30 + contact sheet
> python3 rise_of_legend/02_storyboard/make_boards.py --only S22 # one frame
> ```
>
> [`PROMPTS.md`](PROMPTS.md) / [`prompts.json`](prompts.json) remain as an **alternative route**:
> 30 copy-paste prompts for any text-to-image model if you ever want a painted version of the same
> frames. S31/S32 are rendered by the assembler, not by either route.

**30 boards, one per shot S01–S30** (S31 is a black frame, S32 a title card, both built by the
assembler). File name = shot id: `S01.jpg` … `S30.jpg`.

## Spec

| Item | Value |
|---|---|
| Size | 1920×1080 px, JPG q88 |
| Framing | full frame (not 16:9 letterboxed inside a canvas) |
| Look | flat-vector colour: indigo night, brass gold, cream; halftone + grain + vignette |
| Camera | arrows for push/pull, arrows for movement, dotted line for the cut direction |
| Text in the image | **none** — no lettering, no watermark, no shot numbers (the only type is S32) |
| 9:16 safety | keep faces and key action inside a centred 608×1080 column |

## How to board at 10 fps

1. Board the **held pose**, not the inbetween. At 10 fps the pose is what the audience sees for 300 ms.
2. Test the silhouette: fill the shape in black. If the action is unclear, redesign before drawing.
3. Mark the frame count from `timeline.json` on the file's metadata or in the board's filename suffix
   (e.g. `S11_50f.png` is allowed) — but the builder always reads the count from the timeline.
4. Every board must survive the **mute test**: cover the caption, look for 1 second, and you should know
   what happens next.

## Delivery order

Board in beat order (1 → 12), not shot order, so the rhythm can be judged while boarding:

- Beat 1–3 (S01–S08): cold open, restorer, the mark
- Beat 4–5 (S09–S14): break-in, first breath
- Beat 6–8 (S15–S22): lesson, rule, transformation
- Beat 9–12 (S23–S32): fight, choice, villain, title

Boards are reference only — they are **not** fed to the renderer. Finished art goes in
`04_animation/shots/`.
