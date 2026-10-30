# 04_animation — art, animation and FX

The renderer only looks at **`shots/`**. Everything else here is source material.

```
04_animation/
├── shots/          ← delivery point. S01.png or S01.mp4, one per shot in timeline.json
├── characters/     turnarounds, expressions, mouth charts, colour specs
├── backgrounds/    BG plates, 1920×1080, with 9:16-safe margins
├── fx/             five element rigs (earth / water / fire / air / ether)
└── cycles/         reusable loops: breath (20f), walk (24f), shawl settle, crowd sway
```

## `shots/` rules

| Rule | Detail |
|---|---|
| **Name = shot id** | `S01.png` … `S32.png`, or `S01.mp4` … for animated shots |
| **One asset per shot** | if both exist, the **clip wins** over the still |
| **Still** | 1920×1080 PNG, final composition with background baked in (alpha is not composited) |
| **Clip** | 1920×1080, **10 fps**, any duration — trimmed or last-frame-held to the shot's exact frame count |
| **No retiming** | the timeline owns the duration; a 5 s shot takes 50 frames, always |
| **No text, no watermarks, no subtitles** | the only graphic event in the film is the S32 title |

## Export settings

- Clip: h264 CRF 16–18, yuv420p, **10 fps**, no audio, or a PNG sequence `S05_0001.png …` zipped
  to `S05.zip` if you prefer (convert to mp4 before delivery).
- Colour: sRGB, no LUT baked in — the grade is applied in comp.
- Keep the working project file in `characters/` or your own drive; only exports belong here.

## Cycles (draw once, reuse everywhere)

| Cycle | Length | Used by |
|---|---|---|
| Breath idle | 20 frames | S22, S28, S32 |
| Walk | 24 frames | S04, S15 |
| Shawl settle | 12 frames | S21, S22 |
| Crowd sway | 30 frames | S27 |
| Element ignition | 8 frames ×5 | S22 panels, S12, S24 |

## Five element language (must stay consistent)

| Element | Colour | Shape | Sound |
|---|---|---|---|
| Earth | ochre `#C98A2E` | blocky, plated, heaviest | stone grind, low sub |
| Water | teal `#2E9C9C` | flowing ribbons, healing | filtered swell |
| Fire | vermilion `#D8412F` | jagged burst, short life | crack + air burst |
| Air | silver-white `#DCE6F2` | thin speed lines | whip, thin whoosh |
| Ether | violet `#7B5BD6` | negative-space holes, outline only | **silence** |

## Provenance

If art is AI-assisted, keep the prompt, seed, tool and date in a `PROVENANCE.md` here. It is your
independent-creation record (see `../00_admin/legal_checklist.md`).
