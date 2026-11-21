# Project format and directing guide

`engine/project.schema.json` provides editor hints. `npm run validate -- --project ...` additionally checks time ordering, duration bounds, identity and shared prop conflicts. All times are **seconds from the start of this project**. The engine has no fixed 30-second story timeline.

## Top-level fields

| Field | Meaning |
| --- | --- |
| `version` | `1` |
| `id` | Unique lowercase slug; used for default output name |
| `title`, `script` | Human-readable title and original script text |
| `duration` | >0 to 3600 seconds; import uses the actual narration duration |
| `width`, `height` | Even dimensions from 160–3840; default 1080×1920 |
| `fps` | Integer 1–60; default 30 |
| `board` | `title`, `subtitle`, `detail` strings (max 160 characters each); rendered on the physical chalkboard |
| `props` | `phone` and `cookieJars` booleans; cookie jars default hidden |
| `media` | Local `audio` (preview), `renderAudio` (export), `envelope` (60 Hz narration RMS JSON) paths relative to this project file |
| `captions` | Ordered, non-overlapping `{start,end,text}` cues; split long text (max 280 characters/cue) |
| `actors` | One or two character definitions, below |
| `camera` | Ordered `{t,position:[x,y,z],target:[x,y,z]}` keys |
| `foley` | `{time,kind,gain}` events used by the `prepare` command |
| `timing` | Informational marker: imported SRT, approximate word weighting, or review-required retiming |

No remote media URLs or embedded code are accepted. Paths may point to another bundled directory, but the standalone server and CLI refuse files outside `Animation/`.

## Actors

```json
{
  "id": "primary",
  "style": "hoodie",
  "path": [
    {"t": 0, "x": -1.35, "z": 0.1},
    {"t": 8, "x": -0.9, "z": 0.2},
    {"t": 20, "x": -0.9, "z": 0.2}
  ],
  "cues": [
    {"start": 0, "end": 6, "emotion": "curious", "action": "gesture", "look": 0.5},
    {"start": 6, "end": 12, "emotion": "neutral", "action": "nod"},
    {"start": 12, "end": 20, "emotion": "happy", "action": "idle"}
  ],
  "speech": [{"start": 0.2, "end": 5.9}, {"start": 13, "end": 17}]
}
```

- IDs: `primary`, `secondary` (unique). Styles: `hoodie`, `waistcoat`, independent of ID.
- Path keys interpolate with smooth ease-in/out. Keys clamp before/after their range. Walking strength comes from actual path velocity; feet are anchored to the room floor with a small cartoon bob.
- Cue ranges for the same actor cannot overlap. Gaps use neutral/idle. Speaker ranges can include pauses; the narration envelope closes the mouth through those pauses.
- Emotions: `neutral`, `worried`, `curious`, `happy`.
- Actions: `idle`, `gesture`, `phone`, `book`, `nod`.
- `look` is a normalized horizontal pupil offset, −1 to +1.
- Gesture and action strength fades at cue edges. A phone cue tips the shared world phone onto the desk near its end. A book cue moves the shared desk book toward the hands. These are stylized reusable poses, not a collision-aware full-body IK simulation.
- There is one phone and one reading book. Two actors cannot use the same prop at overlapping times. Enable `props.phone` when using phone cues; the default script importer hides it for unrelated stories.
- The original cookie sampling hand/lid track lives unchanged in the locked source. It is a bespoke action, **not** an action enum supported by the generic engine. Port it into a new configurable action if a new script specifically needs sampling/reaching choreography.

## Room coordinates

Y is up. The floor is around Y=0. The back wall is Z=−4.6, the demonstration table is centered near X=0 / Z=−1.2, the phone desk near X=−2.3 / Z=0.45, and the book desk near X=2.5 / Z=0.9. The default characters stand near X=−1.35 / Z=0.1 and X=1.35 / Z=−1.75.

X/Z paths move the character on the floor; camera coordinates use all XYZ axes. Furniture is solid geometry but there is **no automatic collision avoidance**. Keep paths away from desks/walls. The same room persists throughout the video; camera movement changes perspective and parallax, not slide positions.

## Camera

```json
[
  {"t": 0, "position": [0.2, 2.6, 9.5], "target": [0, 1.25, -0.6]},
  {"t": 5, "position": [-2.4, 2.05, 4.7], "target": [-1.3, 1.25, 0.1]},
  {"t": 20, "position": [0.3, 2.5, 9.1], "target": [0, 1.25, -0.5]}
]
```

Position and target use monotone cubic interpolation with bounded local components. It avoids the old start/stop at every camera key. Empty camera keys give a safe wide view; a single key gives a fixed camera. Supplied automatic keys are a starter, not a promise of collision-free or perfectly framed cinematography. Preview in the actual output aspect ratio and inspect close-ups before rendering.

## Captions and languages

```json
{"start": 1.2, "end": 3.5, "text": "Ask a better question."}
```

Captions wrap into up to three lines, shrinking to fit the safe width. If a cue still cannot fit, rendering fails clearly rather than silently cutting it off. Split paragraphs into shorter cues. Explicit line breaks are allowed. Local Inter and Noto Devanagari support the included English/Hindi workflow; other scripts require appropriate fonts and possibly additional shaping/layout work.

Imported SRT supplies real caption times. The text importer estimates times by word counts, and plain SRT has no reliable speaker IDs; correct actor speech ranges manually for accurate speaker attribution. The renderer does not transcribe, translate, synthesize narration or infer phonemes.

## Audio and Foley

Audio import normalizes the format to 48 kHz mono PCM, not speech loudness. `media.envelope` is `{ "fps":60, "values":[0,0.2,...] }` measured from narration only. Preview uses the prepared MP3; rendering prefers the lossless mixed WAV. Effects never drive the mouth envelope.

```json
[
  {"time": 4.2, "kind": "buzz", "gain": 0.02},
  {"time": 7.7, "kind": "wood", "gain": 0.02},
  {"time": 12.4, "kind": "step", "gain": 0.025},
  {"time": 18.5, "kind": "paper", "gain": 0.015}
]
```

Kinds: `buzz`, `wood`, `step`, `paper`. Gain is linear, from 0 to 0.15; prefer approximately 0.015–0.03 under narration. Procedural effects are deterministic and mildly ducked under speech. The mixed track is reduced if needed to retain about 1 dB of peak headroom. Events do not automatically snap to foot contact; stage and time them intentionally.

After editing audio/Foley, run `prepare --audio ...` again. A changed narration duration is rejected unless `--retime` is explicit; that option scales ALL time-based tracks and marks them for review. For precise final timing, import aligned captions and edit direction rather than relying on uniform retiming.
