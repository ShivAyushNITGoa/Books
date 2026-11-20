# Alexandria art assets and provenance

`carved-relief.jpg` is newly AI-generated original decorative texture art for this production: a weathered sandstone panel with a winged sun disc, lotus/papyrus, ankh and abstract ornamental marks. It is mapped onto dimensional architectural panels and an underwater slab. It is **not** a source frame, an authentic archaeological record, a translation or a claimed facsimile of a specific Cleopatra-era artifact. It is not used as a static scene or slideshow background.

All other architectural forms, ships, props, ruins, characters, textures, sea/lighting/particle effects and animation are authored procedurally in this project. Character textures are drawn and animated in `art.js`; there are no copied railroad/classroom character frames, reference soundtrack clips or realistic human meshes.

Runtime resources reused from the existing Animation bundle:

- `../../engine/vendor/three.module.js`: Three.js r170, MIT; full adjacent LICENSE.
- `../../engine/fonts/Inter.ttf`: Inter, SIL OFL; full adjacent Inter-OFL.txt.

Follow `../../THIRD_PARTY.md` for browser, Playwright, FFmpeg and package notices. No browser, encoder binary or voice model is committed here.

`Caption-Heavy.ttf` is a static weight-850 / optical-size-32 instantiation of the bundle's Inter variable font, created with fontTools for reproducible FFmpeg captions. The derived family is named **Alexandria Caption**; original copyright and SIL OFL records remain embedded, and `Inter-OFL.txt` is included alongside it. This is font rendering support, not a new proprietary font license.

`rose-granite.jpg` is newly AI-generated neutral material artwork (weathered Egyptian rose-granite grain), used as an albedo/bump texture on actual 3D monumental statuary. It supplies surface detail, not a scene/background image. It is not a scan of a specific real recovered monument.

`caption-metrics.json` records the derived font’s ASCII advance widths so the offline subtitle pass can fit the supplied lines into the same safe area without installing fontTools at runtime. It contains no narration or third-party text.
