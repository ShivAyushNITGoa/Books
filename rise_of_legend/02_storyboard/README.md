# 02_storyboard — one board per shot

**32 boards, one per shot in `timeline.json`.** File name = shot id: `S01.png` … `S32.png`.

## Spec

| Item | Value |
|---|---|
| Size | 1920×1080 px, PNG |
| Framing | full frame (not 16:9 letterboxed inside a canvas) |
| Line | grey/black line over flat grey; no final colour needed |
| Camera | arrows for push/pull, arrows for movement, dotted line for the cut direction |
| Text in the image | **none** — action text lives in `timeline.json`, never on the board |
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
