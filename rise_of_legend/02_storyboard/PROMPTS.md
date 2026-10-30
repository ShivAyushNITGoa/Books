# IMAGE PROMPTS — 30 frames for *Rise of Legend*, Ep. 1

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
Limited-animation frame for an Indian mythic-tech animated short, 16:9, 1920x1080. Flat vector shapes, thick clean silhouette outlines, halftone dot shading, subtle gold-leaf texture, two-tone cinematic lighting, strong readable pose. Palette: deep indigo #141A3A, brass #C9A227, cream #F5ECD6, with element accents ochre #C98A2E, teal #2E9C9C, vermilion #D8412F, silver #DCE6F2, violet #7B5BD6. No text, no captions, no logos, no watermark.
```

## Negative prompt (use for every image)

```
text, letters, subtitles, watermark, logo, signature, photorealistic, 3d render, extra limbs, extra fingers, deformed hands, cloned face, motion blur, lens flare, heavy bokeh, western superhero costume, cape
```

## Character blocks

| Key | Prompt fragment |
|---|---|
| `arin` | ARIN RATHORE, a 24-year-old Indian man, lean, short black hair, tired eyes, mustard-yellow kurta with ink-stained cuffs, sleeves rolled |
| `pranveer` | PRANVEER: deep indigo-black costume with brass filigree, five small glowing chest panels (ochre, teal, vermilion, silver, violet), asymmetric palm-leaf shawl over the left shoulder, high collar, brass vented half-mask over nose and mouth, brass forearm guards, no cape |
| `amma` | BADI AMMA, a 68-year-old blind Indian woman, white cotton sari with a thin brass border, silver hair in a low bun, closed milky eyes, wooden walking stick, serene |
| `zoya` | ZOYA, a 26-year-old Indian woman, navy cyber-crime jacket over a teal kurta, tight braid, badge on a lanyard, sidearm holstered |
| `timir` | TIMIR: tall gaunt man in a charcoal suit with gold pinstripes; his face is a seamless field of grey television static crossed by fine gold cracks, no eyes, no mouth |
| `shunya` | SHUNYA: bone-white segmented armour, large sound-dampening ear muffs, faceless helmet with a narrow dark visor, long spear |
| `crew` | GRAHAN SENA crew: private security in grey survey vests and hard hats, full-face respirators, calm and professional |

---

### S01 · beat 1 · 30 frames · 3.0s · cam hold

**Save as:** `04_animation/shots/S01.png`

```
Limited-animation frame for an Indian mythic-tech animated short, 16:9, 1920x1080. Flat vector shapes, thick clean silhouette outlines, halftone dot shading, subtle gold-leaf texture, two-tone cinematic lighting, strong readable pose. Palette: deep indigo #141A3A, brass #C9A227, cream #F5ECD6, with element accents ochre #C98A2E, teal #2E9C9C, vermilion #D8412F, silver #DCE6F2, violet #7B5BD6. No text, no captions, no logos, no watermark. Extreme wide of Nandipur from a hilltop observatory at dusk: cooling towers, temple spires, a flyover, low apartment blocks, all still. A total solar eclipse — black disc with a thin gold corona — hangs over the skyline. Two tiny birds cross the disc. Locked-off camera. Keep faces and key action inside a centred 9:16 column.
```

**Negative:** `text, letters, subtitles, watermark, logo, signature, photorealistic, 3d render, extra limbs, extra fingers, deformed hands, cloned face, motion blur, lens flare, heavy bokeh, western superhero costume, cape`

### S02 · beat 1 · 26 frames · 2.6s · cam push

**Save as:** `04_animation/shots/S02.png`

```
Limited-animation frame for an Indian mythic-tech animated short, 16:9, 1920x1080. Flat vector shapes, thick clean silhouette outlines, halftone dot shading, subtle gold-leaf texture, two-tone cinematic lighting, strong readable pose. Palette: deep indigo #141A3A, brass #C9A227, cream #F5ECD6, with element accents ochre #C98A2E, teal #2E9C9C, vermilion #D8412F, silver #DCE6F2, violet #7B5BD6. No text, no captions, no logos, no watermark. High angle down a main street: blocks of buildings going dark in a wave running down from the hill, sodium lamps out, shopfronts black, one scooter headlight still moving through the dark street. Slight push in. Keep faces and key action inside a centred 9:16 column.
```

**Negative:** `text, letters, subtitles, watermark, logo, signature, photorealistic, 3d render, extra limbs, extra fingers, deformed hands, cloned face, motion blur, lens flare, heavy bokeh, western superhero costume, cape`

### S03 · beat 1 · 24 frames · 2.4s · cam hold

**Save as:** `04_animation/shots/S03.png`

```
Limited-animation frame for an Indian mythic-tech animated short, 16:9, 1920x1080. Flat vector shapes, thick clean silhouette outlines, halftone dot shading, subtle gold-leaf texture, two-tone cinematic lighting, strong readable pose. Palette: deep indigo #141A3A, brass #C9A227, cream #F5ECD6, with element accents ochre #C98A2E, teal #2E9C9C, vermilion #D8412F, silver #DCE6F2, violet #7B5BD6. No text, no captions, no logos, no watermark. Macro of five carved stone instruments in a row on a hilltop plinth, each with a different element motif; the fifth, violet, has a fresh hairline crack with a thread of dust falling from it. Locked-off camera. Keep faces and key action inside a centred 9:16 column.
```

**Negative:** `text, letters, subtitles, watermark, logo, signature, photorealistic, 3d render, extra limbs, extra fingers, deformed hands, cloned face, motion blur, lens flare, heavy bokeh, western superhero costume, cape`

### S04 · beat 2 · 60 frames · 6.0s · cam hold

**Save as:** `04_animation/shots/S04.png`

```
Limited-animation frame for an Indian mythic-tech animated short, 16:9, 1920x1080. Flat vector shapes, thick clean silhouette outlines, halftone dot shading, subtle gold-leaf texture, two-tone cinematic lighting, strong readable pose. Palette: deep indigo #141A3A, brass #C9A227, cream #F5ECD6, with element accents ochre #C98A2E, teal #2E9C9C, vermilion #D8412F, silver #DCE6F2, violet #7B5BD6. No text, no captions, no logos, no watermark. Museum basement restoration room: one warm desk lamp over a wooden desk, glass display cases, shelves of palm-leaf manuscripts, a ceiling fan above. Arin sits brushing a manuscript, calm and absorbed, seen in a medium-wide shot. Characters: ARIN RATHORE, a 24-year-old Indian man, lean, short black hair, tired eyes, mustard-yellow kurta with ink-stained cuffs, sleeves rolled. Locked-off camera. Keep faces and key action inside a centred 9:16 column.
```

**Negative:** `text, letters, subtitles, watermark, logo, signature, photorealistic, 3d render, extra limbs, extra fingers, deformed hands, cloned face, motion blur, lens flare, heavy bokeh, western superhero costume, cape`

### S05 · beat 2 · 50 frames · 5.0s · cam push

**Save as:** `04_animation/shots/S05.png`

```
Limited-animation frame for an Indian mythic-tech animated short, 16:9, 1920x1080. Flat vector shapes, thick clean silhouette outlines, halftone dot shading, subtle gold-leaf texture, two-tone cinematic lighting, strong readable pose. Palette: deep indigo #141A3A, brass #C9A227, cream #F5ECD6, with element accents ochre #C98A2E, teal #2E9C9C, vermilion #D8412F, silver #DCE6F2, violet #7B5BD6. No text, no captions, no logos, no watermark. Over-the-shoulder close-up of Arin's ink-stained hands: a fine brush on a palm-leaf manuscript, and the black ink beneath the brush crawling into a spiral against the stroke direction. Characters: ARIN RATHORE, a 24-year-old Indian man, lean, short black hair, tired eyes, mustard-yellow kurta with ink-stained cuffs, sleeves rolled. Slight push in. Keep faces and key action inside a centred 9:16 column.
```

**Negative:** `text, letters, subtitles, watermark, logo, signature, photorealistic, 3d render, extra limbs, extra fingers, deformed hands, cloned face, motion blur, lens flare, heavy bokeh, western superhero costume, cape`

### S06 · beat 2 · 30 frames · 3.0s · cam hold

**Save as:** `04_animation/shots/S06.png`

```
Limited-animation frame for an Indian mythic-tech animated short, 16:9, 1920x1080. Flat vector shapes, thick clean silhouette outlines, halftone dot shading, subtle gold-leaf texture, two-tone cinematic lighting, strong readable pose. Palette: deep indigo #141A3A, brass #C9A227, cream #F5ECD6, with element accents ochre #C98A2E, teal #2E9C9C, vermilion #D8412F, silver #DCE6F2, violet #7B5BD6. No text, no captions, no logos, no watermark. Close-up of Arin's face reflected in a glass display case; behind his reflection, five thin coloured breath-lines — ochre, teal, vermilion, silver, violet — rise off the page and bend toward him. Characters: ARIN RATHORE, a 24-year-old Indian man, lean, short black hair, tired eyes, mustard-yellow kurta with ink-stained cuffs, sleeves rolled. Locked-off camera. Keep faces and key action inside a centred 9:16 column.
```

**Negative:** `text, letters, subtitles, watermark, logo, signature, photorealistic, 3d render, extra limbs, extra fingers, deformed hands, cloned face, motion blur, lens flare, heavy bokeh, western superhero costume, cape`

### S07 · beat 3 · 30 frames · 3.0s · cam push

**Save as:** `04_animation/shots/S07.png`

```
Limited-animation frame for an Indian mythic-tech animated short, 16:9, 1920x1080. Flat vector shapes, thick clean silhouette outlines, halftone dot shading, subtle gold-leaf texture, two-tone cinematic lighting, strong readable pose. Palette: deep indigo #141A3A, brass #C9A227, cream #F5ECD6, with element accents ochre #C98A2E, teal #2E9C9C, vermilion #D8412F, silver #DCE6F2, violet #7B5BD6. No text, no captions, no logos, no watermark. Insert on an open right palm: a five-petal emblem burning in from the centre, each petal lighting in turn — ochre, teal, vermilion, silver, violet — the skin lit from within. Characters: ARIN RATHORE, a 24-year-old Indian man, lean, short black hair, tired eyes, mustard-yellow kurta with ink-stained cuffs, sleeves rolled. Slight push in. Keep faces and key action inside a centred 9:16 column.
```

**Negative:** `text, letters, subtitles, watermark, logo, signature, photorealistic, 3d render, extra limbs, extra fingers, deformed hands, cloned face, motion blur, lens flare, heavy bokeh, western superhero costume, cape`

### S08 · beat 3 · 50 frames · 5.0s · cam pull

**Save as:** `04_animation/shots/S08.png`

```
Limited-animation frame for an Indian mythic-tech animated short, 16:9, 1920x1080. Flat vector shapes, thick clean silhouette outlines, halftone dot shading, subtle gold-leaf texture, two-tone cinematic lighting, strong readable pose. Palette: deep indigo #141A3A, brass #C9A227, cream #F5ECD6, with element accents ochre #C98A2E, teal #2E9C9C, vermilion #D8412F, silver #DCE6F2, violet #7B5BD6. No text, no captions, no logos, no watermark. Arin's forearm and shoulder as five coloured ribbons of light spiral upward from his palm and vanish; his cuff smokes; he gasps, other hand braced on the desk. Characters: ARIN RATHORE, a 24-year-old Indian man, lean, short black hair, tired eyes, mustard-yellow kurta with ink-stained cuffs, sleeves rolled. Slight pull back. Keep faces and key action inside a centred 9:16 column.
```

**Negative:** `text, letters, subtitles, watermark, logo, signature, photorealistic, 3d render, extra limbs, extra fingers, deformed hands, cloned face, motion blur, lens flare, heavy bokeh, western superhero costume, cape`

### S09 · beat 4 · 50 frames · 5.0s · cam hold

**Save as:** `04_animation/shots/S09.png`

```
Limited-animation frame for an Indian mythic-tech animated short, 16:9, 1920x1080. Flat vector shapes, thick clean silhouette outlines, halftone dot shading, subtle gold-leaf texture, two-tone cinematic lighting, strong readable pose. Palette: deep indigo #141A3A, brass #C9A227, cream #F5ECD6, with element accents ochre #C98A2E, teal #2E9C9C, vermilion #D8412F, silver #DCE6F2, violet #7B5BD6. No text, no captions, no logos, no watermark. Vault corridor in red emergency light: a plasma cutter opening a steel door, sparks bursting; three Grahan Sena crew in survey vests and respirators move calmly, one lifting a brass-bound stone cube into a case. Characters: GRAHAN SENA crew: private security in grey survey vests and hard hats, full-face respirators, calm and professional. Locked-off camera. Keep faces and key action inside a centred 9:16 column.
```

**Negative:** `text, letters, subtitles, watermark, logo, signature, photorealistic, 3d render, extra limbs, extra fingers, deformed hands, cloned face, motion blur, lens flare, heavy bokeh, western superhero costume, cape`

### S10 · beat 4 · 40 frames · 4.0s · cam hold

**Save as:** `04_animation/shots/S10.png`

```
Limited-animation frame for an Indian mythic-tech animated short, 16:9, 1920x1080. Flat vector shapes, thick clean silhouette outlines, halftone dot shading, subtle gold-leaf texture, two-tone cinematic lighting, strong readable pose. Palette: deep indigo #141A3A, brass #C9A227, cream #F5ECD6, with element accents ochre #C98A2E, teal #2E9C9C, vermilion #D8412F, silver #DCE6F2, violet #7B5BD6. No text, no captions, no logos, no watermark. Zoya steps out from behind a display case, sidearm drawn but finger off the trigger, badge swinging on its lanyard, lit by cutter sparks; she is alone and the crew behind her does not stop. Characters: ZOYA, a 26-year-old Indian woman, navy cyber-crime jacket over a teal kurta, tight braid, badge on a lanyard, sidearm holstered.; GRAHAN SENA crew: private security in grey survey vests and hard hats, full-face respirators, calm and professional. Locked-off camera. Keep faces and key action inside a centred 9:16 column.
```

**Negative:** `text, letters, subtitles, watermark, logo, signature, photorealistic, 3d render, extra limbs, extra fingers, deformed hands, cloned face, motion blur, lens flare, heavy bokeh, western superhero costume, cape`

### S11 · beat 4 · 50 frames · 5.0s · cam push

**Save as:** `04_animation/shots/S11.png`

```
Limited-animation frame for an Indian mythic-tech animated short, 16:9, 1920x1080. Flat vector shapes, thick clean silhouette outlines, halftone dot shading, subtle gold-leaf texture, two-tone cinematic lighting, strong readable pose. Palette: deep indigo #141A3A, brass #C9A227, cream #F5ECD6, with element accents ochre #C98A2E, teal #2E9C9C, vermilion #D8412F, silver #DCE6F2, violet #7B5BD6. No text, no captions, no logos, no watermark. A security drone clamped to a concrete pillar fires its bolts; the pillar tilts toward Zoya as she looks up; low angle, dust in the air, red emergency light. Characters: ZOYA, a 26-year-old Indian woman, navy cyber-crime jacket over a teal kurta, tight braid, badge on a lanyard, sidearm holstered. Slight push in. Keep faces and key action inside a centred 9:16 column.
```

**Negative:** `text, letters, subtitles, watermark, logo, signature, photorealistic, 3d render, extra limbs, extra fingers, deformed hands, cloned face, motion blur, lens flare, heavy bokeh, western superhero costume, cape`

### S12 · beat 5 · 40 frames · 4.0s · cam hold

**Save as:** `04_animation/shots/S12.png`

```
Limited-animation frame for an Indian mythic-tech animated short, 16:9, 1920x1080. Flat vector shapes, thick clean silhouette outlines, halftone dot shading, subtle gold-leaf texture, two-tone cinematic lighting, strong readable pose. Palette: deep indigo #141A3A, brass #C9A227, cream #F5ECD6, with element accents ochre #C98A2E, teal #2E9C9C, vermilion #D8412F, silver #DCE6F2, violet #7B5BD6. No text, no captions, no logos, no watermark. Arin on one knee in the vault, one hand thrust out, mid-inhale; the five-petal mark flares ochre and plates of earth-armour crawl up his forearm and over his shoulder. Characters: ARIN RATHORE, a 24-year-old Indian man, lean, short black hair, tired eyes, mustard-yellow kurta with ink-stained cuffs, sleeves rolled. Locked-off camera. Keep faces and key action inside a centred 9:16 column.
```

**Negative:** `text, letters, subtitles, watermark, logo, signature, photorealistic, 3d render, extra limbs, extra fingers, deformed hands, cloned face, motion blur, lens flare, heavy bokeh, western superhero costume, cape`

### S13 · beat 5 · 40 frames · 4.0s · cam pull

**Save as:** `04_animation/shots/S13.png`

```
Limited-animation frame for an Indian mythic-tech animated short, 16:9, 1920x1080. Flat vector shapes, thick clean silhouette outlines, halftone dot shading, subtle gold-leaf texture, two-tone cinematic lighting, strong readable pose. Palette: deep indigo #141A3A, brass #C9A227, cream #F5ECD6, with element accents ochre #C98A2E, teal #2E9C9C, vermilion #D8412F, silver #DCE6F2, violet #7B5BD6. No text, no captions, no logos, no watermark. Arin catches a falling concrete pillar across his shoulders, feet cracking the floor, dust bursting outward in a radial sheet; low angle, earth-armour glowing on his arms. Characters: ARIN RATHORE, a 24-year-old Indian man, lean, short black hair, tired eyes, mustard-yellow kurta with ink-stained cuffs, sleeves rolled. Slight pull back. Keep faces and key action inside a centred 9:16 column.
```

**Negative:** `text, letters, subtitles, watermark, logo, signature, photorealistic, 3d render, extra limbs, extra fingers, deformed hands, cloned face, motion blur, lens flare, heavy bokeh, western superhero costume, cape`

### S14 · beat 5 · 20 frames · 2.0s · cam hold

**Save as:** `04_animation/shots/S14.png`

```
Limited-animation frame for an Indian mythic-tech animated short, 16:9, 1920x1080. Flat vector shapes, thick clean silhouette outlines, halftone dot shading, subtle gold-leaf texture, two-tone cinematic lighting, strong readable pose. Palette: deep indigo #141A3A, brass #C9A227, cream #F5ECD6, with element accents ochre #C98A2E, teal #2E9C9C, vermilion #D8412F, silver #DCE6F2, violet #7B5BD6. No text, no captions, no logos, no watermark. The vault after the dust clears: Zoya stares at Arin, he stares at his own arm; behind them the empty case where the keystone was; one petal of the mark is grey. Characters: ARIN RATHORE, a 24-year-old Indian man, lean, short black hair, tired eyes, mustard-yellow kurta with ink-stained cuffs, sleeves rolled.; ZOYA, a 26-year-old Indian woman, navy cyber-crime jacket over a teal kurta, tight braid, badge on a lanyard, sidearm holstered. Locked-off camera. Keep faces and key action inside a centred 9:16 column.
```

**Negative:** `text, letters, subtitles, watermark, logo, signature, photorealistic, 3d render, extra limbs, extra fingers, deformed hands, cloned face, motion blur, lens flare, heavy bokeh, western superhero costume, cape`

### S15 · beat 6 · 40 frames · 4.0s · cam hold

**Save as:** `04_animation/shots/S15.png`

```
Limited-animation frame for an Indian mythic-tech animated short, 16:9, 1920x1080. Flat vector shapes, thick clean silhouette outlines, halftone dot shading, subtle gold-leaf texture, two-tone cinematic lighting, strong readable pose. Palette: deep indigo #141A3A, brass #C9A227, cream #F5ECD6, with element accents ochre #C98A2E, teal #2E9C9C, vermilion #D8412F, silver #DCE6F2, violet #7B5BD6. No text, no captions, no logos, no watermark. Courtyard at first light with a chai kettle steaming and marigolds: Badi Amma, eyes closed, circles Arin with a wooden stick; warm saffron light, dust in the air. Characters: BADI AMMA, a 68-year-old blind Indian woman, white cotton sari with a thin brass border, silver hair in a low bun, closed milky eyes, wooden walking stick, serene.; ARIN RATHORE, a 24-year-old Indian man, lean, short black hair, tired eyes, mustard-yellow kurta with ink-stained cuffs, sleeves rolled. Locked-off camera. Keep faces and key action inside a centred 9:16 column.
```

**Negative:** `text, letters, subtitles, watermark, logo, signature, photorealistic, 3d render, extra limbs, extra fingers, deformed hands, cloned face, motion blur, lens flare, heavy bokeh, western superhero costume, cape`

### S16 · beat 6 · 40 frames · 4.0s · cam hold

**Save as:** `04_animation/shots/S16.png`

```
Limited-animation frame for an Indian mythic-tech animated short, 16:9, 1920x1080. Flat vector shapes, thick clean silhouette outlines, halftone dot shading, subtle gold-leaf texture, two-tone cinematic lighting, strong readable pose. Palette: deep indigo #141A3A, brass #C9A227, cream #F5ECD6, with element accents ochre #C98A2E, teal #2E9C9C, vermilion #D8412F, silver #DCE6F2, violet #7B5BD6. No text, no captions, no logos, no watermark. Courtyard split composition: Badi Amma pressing her stick into Arin's chest as he holds an earth stance; beside it, his cut palm closing as teal water-light flows over it. Characters: BADI AMMA, a 68-year-old blind Indian woman, white cotton sari with a thin brass border, silver hair in a low bun, closed milky eyes, wooden walking stick, serene.; ARIN RATHORE, a 24-year-old Indian man, lean, short black hair, tired eyes, mustard-yellow kurta with ink-stained cuffs, sleeves rolled. Locked-off camera. Keep faces and key action inside a centred 9:16 column.
```

**Negative:** `text, letters, subtitles, watermark, logo, signature, photorealistic, 3d render, extra limbs, extra fingers, deformed hands, cloned face, motion blur, lens flare, heavy bokeh, western superhero costume, cape`

### S17 · beat 6 · 40 frames · 4.0s · cam hold

**Save as:** `04_animation/shots/S17.png`

```
Limited-animation frame for an Indian mythic-tech animated short, 16:9, 1920x1080. Flat vector shapes, thick clean silhouette outlines, halftone dot shading, subtle gold-leaf texture, two-tone cinematic lighting, strong readable pose. Palette: deep indigo #141A3A, brass #C9A227, cream #F5ECD6, with element accents ochre #C98A2E, teal #2E9C9C, vermilion #D8412F, silver #DCE6F2, violet #7B5BD6. No text, no captions, no logos, no watermark. Courtyard vignette in three beats: fire bursting from Arin's palm and singeing a marigold; a silver air-streak cutting across the frame; his body half-transparent violet with the kettle visible through him. Characters: ARIN RATHORE, a 24-year-old Indian man, lean, short black hair, tired eyes, mustard-yellow kurta with ink-stained cuffs, sleeves rolled. Locked-off camera. Keep faces and key action inside a centred 9:16 column.
```

**Negative:** `text, letters, subtitles, watermark, logo, signature, photorealistic, 3d render, extra limbs, extra fingers, deformed hands, cloned face, motion blur, lens flare, heavy bokeh, western superhero costume, cape`

### S18 · beat 7 · 40 frames · 4.0s · cam push

**Save as:** `04_animation/shots/S18.png`

```
Limited-animation frame for an Indian mythic-tech animated short, 16:9, 1920x1080. Flat vector shapes, thick clean silhouette outlines, halftone dot shading, subtle gold-leaf texture, two-tone cinematic lighting, strong readable pose. Palette: deep indigo #141A3A, brass #C9A227, cream #F5ECD6, with element accents ochre #C98A2E, teal #2E9C9C, vermilion #D8412F, silver #DCE6F2, violet #7B5BD6. No text, no captions, no logos, no watermark. Arin straining as two auras — ochre and teal — fight up his arms, flickering black at the edges; clenched face, teeth bared, courtyard behind. Characters: ARIN RATHORE, a 24-year-old Indian man, lean, short black hair, tired eyes, mustard-yellow kurta with ink-stained cuffs, sleeves rolled. Slight push in. Keep faces and key action inside a centred 9:16 column.
```

**Negative:** `text, letters, subtitles, watermark, logo, signature, photorealistic, 3d render, extra limbs, extra fingers, deformed hands, cloned face, motion blur, lens flare, heavy bokeh, western superhero costume, cape`

### S19 · beat 7 · 40 frames · 4.0s · cam hold

**Save as:** `04_animation/shots/S19.png`

```
Limited-animation frame for an Indian mythic-tech animated short, 16:9, 1920x1080. Flat vector shapes, thick clean silhouette outlines, halftone dot shading, subtle gold-leaf texture, two-tone cinematic lighting, strong readable pose. Palette: deep indigo #141A3A, brass #C9A227, cream #F5ECD6, with element accents ochre #C98A2E, teal #2E9C9C, vermilion #D8412F, silver #DCE6F2, violet #7B5BD6. No text, no captions, no logos, no watermark. Arin flat on his back in a marigold bed, flowers exploding around him, one flower on his head; Badi Amma laughing, hand to her mouth, warm morning light. Characters: ARIN RATHORE, a 24-year-old Indian man, lean, short black hair, tired eyes, mustard-yellow kurta with ink-stained cuffs, sleeves rolled.; BADI AMMA, a 68-year-old blind Indian woman, white cotton sari with a thin brass border, silver hair in a low bun, closed milky eyes, wooden walking stick, serene. Locked-off camera. Keep faces and key action inside a centred 9:16 column.
```

**Negative:** `text, letters, subtitles, watermark, logo, signature, photorealistic, 3d render, extra limbs, extra fingers, deformed hands, cloned face, motion blur, lens flare, heavy bokeh, western superhero costume, cape`

### S20 · beat 8 · 30 frames · 3.0s · cam push

**Save as:** `04_animation/shots/S20.png`

```
Limited-animation frame for an Indian mythic-tech animated short, 16:9, 1920x1080. Flat vector shapes, thick clean silhouette outlines, halftone dot shading, subtle gold-leaf texture, two-tone cinematic lighting, strong readable pose. Palette: deep indigo #141A3A, brass #C9A227, cream #F5ECD6, with element accents ochre #C98A2E, teal #2E9C9C, vermilion #D8412F, silver #DCE6F2, violet #7B5BD6. No text, no captions, no logos, no watermark. Arin standing in the courtyard as dust and gold leaf lift off the ground and spiral around him, pulled upward; shafts of dawn light, low angle. Characters: ARIN RATHORE, a 24-year-old Indian man, lean, short black hair, tired eyes, mustard-yellow kurta with ink-stained cuffs, sleeves rolled. Slight push in. Keep faces and key action inside a centred 9:16 column.
```

**Negative:** `text, letters, subtitles, watermark, logo, signature, photorealistic, 3d render, extra limbs, extra fingers, deformed hands, cloned face, motion blur, lens flare, heavy bokeh, western superhero costume, cape`

### S21 · beat 8 · 40 frames · 4.0s · cam hold

**Save as:** `04_animation/shots/S21.png`

```
Limited-animation frame for an Indian mythic-tech animated short, 16:9, 1920x1080. Flat vector shapes, thick clean silhouette outlines, halftone dot shading, subtle gold-leaf texture, two-tone cinematic lighting, strong readable pose. Palette: deep indigo #141A3A, brass #C9A227, cream #F5ECD6, with element accents ochre #C98A2E, teal #2E9C9C, vermilion #D8412F, silver #DCE6F2, violet #7B5BD6. No text, no captions, no logos, no watermark. Close on Arin's shoulder: a palm-leaf-shaped shawl unfolding like a turning manuscript page, brass filigree writing itself along its edge. Characters: ARIN RATHORE, a 24-year-old Indian man, lean, short black hair, tired eyes, mustard-yellow kurta with ink-stained cuffs, sleeves rolled. Locked-off camera. Keep faces and key action inside a centred 9:16 column.
```

**Negative:** `text, letters, subtitles, watermark, logo, signature, photorealistic, 3d render, extra limbs, extra fingers, deformed hands, cloned face, motion blur, lens flare, heavy bokeh, western superhero costume, cape`

### S22 · beat 8 · 50 frames · 5.0s · cam hold

**Save as:** `04_animation/shots/S22.png`

```
Limited-animation frame for an Indian mythic-tech animated short, 16:9, 1920x1080. Flat vector shapes, thick clean silhouette outlines, halftone dot shading, subtle gold-leaf texture, two-tone cinematic lighting, strong readable pose. Palette: deep indigo #141A3A, brass #C9A227, cream #F5ECD6, with element accents ochre #C98A2E, teal #2E9C9C, vermilion #D8412F, silver #DCE6F2, violet #7B5BD6. No text, no captions, no logos, no watermark. Low-angle hero shot: Pranveer stands in first light, five chest panels igniting left to right, vented half-mask closed, palm-leaf shawl settling, dust in the air. Characters: PRANVEER: deep indigo-black costume with brass filigree, five small glowing chest panels (ochre, teal, vermilion, silver, violet), asymmetric palm-leaf shawl over the left shoulder, high collar, brass vented half-mask over nose and mouth, brass forearm guards, no cape. Locked-off camera. Keep faces and key action inside a centred 9:16 column.
```

**Negative:** `text, letters, subtitles, watermark, logo, signature, photorealistic, 3d render, extra limbs, extra fingers, deformed hands, cloned face, motion blur, lens flare, heavy bokeh, western superhero costume, cape`

### S23 · beat 9 · 40 frames · 4.0s · cam hold

**Save as:** `04_animation/shots/S23.png`

```
Limited-animation frame for an Indian mythic-tech animated short, 16:9, 1920x1080. Flat vector shapes, thick clean silhouette outlines, halftone dot shading, subtle gold-leaf texture, two-tone cinematic lighting, strong readable pose. Palette: deep indigo #141A3A, brass #C9A227, cream #F5ECD6, with element accents ochre #C98A2E, teal #2E9C9C, vermilion #D8412F, silver #DCE6F2, violet #7B5BD6. No text, no captions, no logos, no watermark. Rooftops at first light: Shunya in bone-white armour and sound-dampening muffs stands on the next roof, spear across the back, the keystone case at his feet; the city muted and grey behind. Characters: SHUNYA: bone-white segmented armour, large sound-dampening ear muffs, faceless helmet with a narrow dark visor, long spear. Locked-off camera. Keep faces and key action inside a centred 9:16 column.
```

**Negative:** `text, letters, subtitles, watermark, logo, signature, photorealistic, 3d render, extra limbs, extra fingers, deformed hands, cloned face, motion blur, lens flare, heavy bokeh, western superhero costume, cape`

### S24 · beat 9 · 40 frames · 4.0s · cam push

**Save as:** `04_animation/shots/S24.png`

```
Limited-animation frame for an Indian mythic-tech animated short, 16:9, 1920x1080. Flat vector shapes, thick clean silhouette outlines, halftone dot shading, subtle gold-leaf texture, two-tone cinematic lighting, strong readable pose. Palette: deep indigo #141A3A, brass #C9A227, cream #F5ECD6, with element accents ochre #C98A2E, teal #2E9C9C, vermilion #D8412F, silver #DCE6F2, violet #7B5BD6. No text, no captions, no logos, no watermark. Pranveer mid air-dash across a rooftop gap as a silver streak, tiles shattering under his landing, dust kicking up; strong diagonal composition. Characters: PRANVEER: deep indigo-black costume with brass filigree, five small glowing chest panels (ochre, teal, vermilion, silver, violet), asymmetric palm-leaf shawl over the left shoulder, high collar, brass vented half-mask over nose and mouth, brass forearm guards, no cape. Slight push in. Keep faces and key action inside a centred 9:16 column.
```

**Negative:** `text, letters, subtitles, watermark, logo, signature, photorealistic, 3d render, extra limbs, extra fingers, deformed hands, cloned face, motion blur, lens flare, heavy bokeh, western superhero costume, cape`

### S25 · beat 9 · 30 frames · 3.0s · cam hold

**Save as:** `04_animation/shots/S25.png`

```
Limited-animation frame for an Indian mythic-tech animated short, 16:9, 1920x1080. Flat vector shapes, thick clean silhouette outlines, halftone dot shading, subtle gold-leaf texture, two-tone cinematic lighting, strong readable pose. Palette: deep indigo #141A3A, brass #C9A227, cream #F5ECD6, with element accents ochre #C98A2E, teal #2E9C9C, vermilion #D8412F, silver #DCE6F2, violet #7B5BD6. No text, no captions, no logos, no watermark. Shunya's spear thrust passing through Pranveer, who is rendered as violet outline only — no fill, just contour lines — with negative space where his chest was; total stillness. Characters: PRANVEER: deep indigo-black costume with brass filigree, five small glowing chest panels (ochre, teal, vermilion, silver, violet), asymmetric palm-leaf shawl over the left shoulder, high collar, brass vented half-mask over nose and mouth, brass forearm guards, no cape.; SHUNYA: bone-white segmented armour, large sound-dampening ear muffs, faceless helmet with a narrow dark visor, long spear. Locked-off camera. Keep faces and key action inside a centred 9:16 column.
```

**Negative:** `text, letters, subtitles, watermark, logo, signature, photorealistic, 3d render, extra limbs, extra fingers, deformed hands, cloned face, motion blur, lens flare, heavy bokeh, western superhero costume, cape`

### S26 · beat 9 · 30 frames · 3.0s · cam push

**Save as:** `04_animation/shots/S26.png`

```
Limited-animation frame for an Indian mythic-tech animated short, 16:9, 1920x1080. Flat vector shapes, thick clean silhouette outlines, halftone dot shading, subtle gold-leaf texture, two-tone cinematic lighting, strong readable pose. Palette: deep indigo #141A3A, brass #C9A227, cream #F5ECD6, with element accents ochre #C98A2E, teal #2E9C9C, vermilion #D8412F, silver #DCE6F2, violet #7B5BD6. No text, no captions, no logos, no watermark. Pranveer's brass knuckles glowing with fire as he lands a punch on Shunya's guard; impact rendered as a white-on-black inverted burst; both figures braced. Characters: PRANVEER: deep indigo-black costume with brass filigree, five small glowing chest panels (ochre, teal, vermilion, silver, violet), asymmetric palm-leaf shawl over the left shoulder, high collar, brass vented half-mask over nose and mouth, brass forearm guards, no cape.; SHUNYA: bone-white segmented armour, large sound-dampening ear muffs, faceless helmet with a narrow dark visor, long spear. Slight push in. Keep faces and key action inside a centred 9:16 column.
```

**Negative:** `text, letters, subtitles, watermark, logo, signature, photorealistic, 3d render, extra limbs, extra fingers, deformed hands, cloned face, motion blur, lens flare, heavy bokeh, western superhero costume, cape`

### S27 · beat 10 · 40 frames · 4.0s · cam pull

**Save as:** `04_animation/shots/S27.png`

```
Limited-animation frame for an Indian mythic-tech animated short, 16:9, 1920x1080. Flat vector shapes, thick clean silhouette outlines, halftone dot shading, subtle gold-leaf texture, two-tone cinematic lighting, strong readable pose. Palette: deep indigo #141A3A, brass #C9A227, cream #F5ECD6, with element accents ochre #C98A2E, teal #2E9C9C, vermilion #D8412F, silver #DCE6F2, violet #7B5BD6. No text, no captions, no logos, no watermark. Cracked rooftop parapet with debris falling away; far below, a small morning crowd looking up, Zoya among them, tiny silhouettes; strong high angle. Characters: ZOYA, a 26-year-old Indian woman, navy cyber-crime jacket over a teal kurta, tight braid, badge on a lanyard, sidearm holstered. Slight pull back. Keep faces and key action inside a centred 9:16 column.
```

**Negative:** `text, letters, subtitles, watermark, logo, signature, photorealistic, 3d render, extra limbs, extra fingers, deformed hands, cloned face, motion blur, lens flare, heavy bokeh, western superhero costume, cape`

### S28 · beat 10 · 40 frames · 4.0s · cam hold

**Save as:** `04_animation/shots/S28.png`

```
Limited-animation frame for an Indian mythic-tech animated short, 16:9, 1920x1080. Flat vector shapes, thick clean silhouette outlines, halftone dot shading, subtle gold-leaf texture, two-tone cinematic lighting, strong readable pose. Palette: deep indigo #141A3A, brass #C9A227, cream #F5ECD6, with element accents ochre #C98A2E, teal #2E9C9C, vermilion #D8412F, silver #DCE6F2, violet #7B5BD6. No text, no captions, no logos, no watermark. Two-shot at the roof edge: the keystone case behind Pranveer, the crowd far below; he turns his back on the case, shoulders set, breath visible in the cold air. Characters: PRANVEER: deep indigo-black costume with brass filigree, five small glowing chest panels (ochre, teal, vermilion, silver, violet), asymmetric palm-leaf shawl over the left shoulder, high collar, brass vented half-mask over nose and mouth, brass forearm guards, no cape. Locked-off camera. Keep faces and key action inside a centred 9:16 column.
```

**Negative:** `text, letters, subtitles, watermark, logo, signature, photorealistic, 3d render, extra limbs, extra fingers, deformed hands, cloned face, motion blur, lens flare, heavy bokeh, western superhero costume, cape`

### S29 · beat 11 · 40 frames · 4.0s · cam push

**Save as:** `04_animation/shots/S29.png`

```
Limited-animation frame for an Indian mythic-tech animated short, 16:9, 1920x1080. Flat vector shapes, thick clean silhouette outlines, halftone dot shading, subtle gold-leaf texture, two-tone cinematic lighting, strong readable pose. Palette: deep indigo #141A3A, brass #C9A227, cream #F5ECD6, with element accents ochre #C98A2E, teal #2E9C9C, vermilion #D8412F, silver #DCE6F2, violet #7B5BD6. No text, no captions, no logos, no watermark. Timir seated on a throne of cable trays in a server temple: racks breathing warm air, his static face crossed with gold cracks, the keystone case in his hand, cold key light. Characters: TIMIR: tall gaunt man in a charcoal suit with gold pinstripes; his face is a seamless field of grey television static crossed by fine gold cracks, no eyes, no mouth. Slight push in. Keep faces and key action inside a centred 9:16 column.
```

**Negative:** `text, letters, subtitles, watermark, logo, signature, photorealistic, 3d render, extra limbs, extra fingers, deformed hands, cloned face, motion blur, lens flare, heavy bokeh, western superhero costume, cape`

### S30 · beat 11 · 40 frames · 4.0s · cam hold

**Save as:** `04_animation/shots/S30.png`

```
Limited-animation frame for an Indian mythic-tech animated short, 16:9, 1920x1080. Flat vector shapes, thick clean silhouette outlines, halftone dot shading, subtle gold-leaf texture, two-tone cinematic lighting, strong readable pose. Palette: deep indigo #141A3A, brass #C9A227, cream #F5ECD6, with element accents ochre #C98A2E, teal #2E9C9C, vermilion #D8412F, silver #DCE6F2, violet #7B5BD6. No text, no captions, no logos, no watermark. A stone wall of five seal sockets: one dark and empty, four still holding dimming light; Timir's gloved fist closing in the foreground; beyond, the sky over the city dimming. Characters: TIMIR: tall gaunt man in a charcoal suit with gold pinstripes; his face is a seamless field of grey television static crossed by fine gold cracks, no eyes, no mouth. Locked-off camera. Keep faces and key action inside a centred 9:16 column.
```

**Negative:** `text, letters, subtitles, watermark, logo, signature, photorealistic, 3d render, extra limbs, extra fingers, deformed hands, cloned face, motion blur, lens flare, heavy bokeh, western superhero costume, cape`

---

## Continuity checks before you approve a frame

- [ ] **The mark** is on his **right palm**; five petals, one grey from S14 onward.
- [ ] **Arin** wears a torn, ink-stained mustard kurta S09–S14; a fresh one S15 onward.
- [ ] **Pranveer** never has a cape, a chest logo, or bright primary colours.
- [ ] **Timir** never shows eyes or a mouth — only static and gold cracks.
- [ ] **Shunya** is always bone-white; the frame around him is quieter, cooler, emptier.
- [ ] **Palette** stays indigo + brass; the only warm scene is the courtyard (S15–S21).
- [ ] No frame contains text, a watermark, or a logo.
