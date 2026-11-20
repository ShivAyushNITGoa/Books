# Authored story-v1 format

Use [story.schema.json](engine/story.schema.json) for editor assistance and `npm run story -- validate --project <file>` for authoritative runtime checks. See the two complete [examples](examples). This format is separate from classroom `project-v1`; do not pass it to the classroom prepare CLI.

```json
{
  "version": "story-v1", "id": "new-story", "title": "A New Story",
  "language": "en", "width": 720, "height": 1280, "fps": 30,
  "cast": [{"id":"hero", "name":"Our hero", "color":"#329ca6", "hat":"cap"}],
  "scenes": [{
    "id":"arrival",
    "narration":"Our hero arrives with one important question.",
    "world":{"kind":"forest", "sky":"#acd4ce"},
    "camera":{"target":[0,70,0], "zoom":1, "to":{"target":[50,70,0],"zoom":1.2}},
    "actors":[{"id":"hero","position":[-100,0,50],"to":[40,0,50],"action":"walk"}],
    "props":[{"id":"tree","shape":"tree","position":[100,0,-80],"size":[80,180,80],"color":"#568263"}]
  }]
}
```

## Coordinates and timing

- Positions/sizes use arbitrary consistent world units `[x,y,z]`: x right, y up, z toward the foreground. Ground is near y=0; actor positions are feet; box prop positions are bottom-center. Other primitive anchors may differ: inspect their painter before stacking.
- Characters are roughly 140 units tall (taller with hats). `scale` modifies a character, not the whole scene. All base cast members share an illustrative rig; `name` is metadata, not an automatic visual likeness.
- `to` on actors/props interpolates position over the entire scene with smooth easing. `camera.to` interpolates target/zoom. No rotation keyframes or timed action tracks yet. Add matched scenes or extend the unlocked renderer for more complex choreography.
- `seconds` optionally sets a **minimum** scene length; a shorter-than-voice value fails. Without it, measured speech + 0.3s tail determines length. Voice is not truncated, sped up or padded to a predeclared story duration.
- Optional `audio` per scene is a real local English narration file relative to the authored story. If omitted, local English TTS runs. No remote URL or cloud credentials.
- All colors are six-digit hex. IDs are lowercase letter-led slugs, max 64 chars. Dimension/fps/scene/cast/prop bounds are enforced in `story.js`; duplicate IDs, missing cast members and nonfinite values fail.

## Worlds, cast and props

World foundations: `canyon`, `town`, `workshop`, `forest`, `space`, `custom`. Optional `sky`, `ground`, `accent` colors. `custom` is a neutral foundation for an authored set of dimensional props, **not prose-to-world generation**. Extend `environment()` for a materially different setting; keep assets local and add provenance for imported assets.

Cast hats: `cap`, `tophat`, `helmet`, `none`; costume `color`. Actions: `idle`, `talk`, `walk`, `point`, `work`, `surprised`, `angry`, `celebrate`, `fall`. Walking swings limbs; pointing/work gesture; talking mouth amplitude uses voice envelope; fall rotates the cutout (supply a descending `to` path). Add new rigs/actions in `world.js` and update enum/schema/tests.

Props: `box`, `cylinder`, `sphere`, `tree`, `rock`, `rail`, `train`, `bridge`, `crane`, `sign`, `lamp`, `plant`, `console`, `rocket`, `table`. `size` defaults to `[40,40,40]`. The cylinder is a stylized faceted column; it is not a high-resolution mesh. `sign.label` is a short single line; make separate props for multiline signs. `to` moves a whole prop. Effects: `heat` closes a rail gap; `buckle` deforms rails; `grow` raises plant growth; `pulse` scales a prop. Effects are stylized scene-progress functions, not physics simulation. Use effects with their intended painter.

## Prepared project and outputs

`prepare` writes a **new direct child directory** under `Animation/output/`. Existing complete directories are not replaced. A staging failure removes only its own temporary files. Use a new slug to revise; retain authored JSON elsewhere.

Artifacts: `project.json` with measured `duration`, scene `start/end`, generated `captions` and `media` paths; `narration.wav`, `mix.wav`, `voice-envelope.json`; `captions.srt`; numbered scene narration `.txt` files; `production.json` records source/duration and estimated alignment. Generated absolute timeline values supersede stale fields on authored inputs. All media URLs resolve relative to the prepared project.

Renderer story mode validates contiguous scenes and monotonic caption cues. Burned captions and SRT use the same cue data. Exact sample counts establish scene boundaries; phrase alignment **within** each voice clip remains estimated. The shared MP4 exporter can sample a still or range; its SRT range starts at zero. Output filenames must stay under `Animation/output/`.

## Adding something not in the catalog

1. Author the required silhouette, geometry or behavior in `world.js`: `environment`, `actor`, or `propPainters`.
2. Add its data fields/enums to `story.js` and the editor schema. Do not silently accept an unknown shape/action and draw nothing.
3. Author a small example with before/after positions/state; test finite input and time seeking.
4. Preview close-up and full composition, then render a range and a full low-res cut.
5. Preserve notices; no model files, browser binaries, API keys or downloaded reference footage in source control.

Depth ordering is object-level painter sorting, not a z-buffer; very large overlapping props can intersect incorrectly. Split crossing geometry, adjust staging or extend the renderer where needed. There is no general collision solver, cloth, photorealistic lighting, full viseme rig, automatic music composition or universal text-to-animation model in this baseline.
