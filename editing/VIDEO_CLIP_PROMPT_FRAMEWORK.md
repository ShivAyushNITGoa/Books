# Talk2Society intro-video prompt framework

Use this alongside `IMAGE_PROMPT_FRAMEWORK_v7.txt`. This framework is only
for the consecutive opening/intro cues; still-image prompts cover all later
cues.

## Inputs

- Full episode SRT, the presenter/style references, and the confirmed intro
  boundary (cue number or timestamp).
- The SRT is authoritative. Use only the opening cues through the boundary;
  never invent, shift, merge, or subdivide cue timestamps.
- Each selected SRT cue gets exactly one generated video clip, saved with
  that cue's existing label (for example `0-00.mp4`). The labels come from
  `tvN_label_map.txt` and must exactly match the builder's cue labels.

## Prompt each clip

For each cue, make one concise, production-ready video-generation prompt
that visually expresses the spoken line and fits the existing
Talk2Society style and reference identity. Specify the subject, action,
setting, framing, lighting, camera movement, and emotional tone. Keep motion
natural and restrained; avoid abrupt movements that would look awkward if
the builder trims the end of a clip.

- Landscape 16:9, cinematic composition, no embedded text, captions, logos,
  title cards, or watermarks.
- Generate silent picture only. No dialogue, narration, music, or sound
  effects; the episode's supplied master VO is the sole audio track.
- Avoid relying on a precise generated duration. The builder conforms the
  clip to the cue's exact SRT window: long clips are trimmed and short clips
  hold their final frame. Compose the complete visual beat early enough that
  a short tail hold remains unobtrusive.
- Keep recurring characters and the visual identity consistent with the
  approved references. Do not introduce unsupported facts or literal
  depictions of abstract claims.
- Use the same cue label for the generated clip and its prompt manifest
  entry. Do not include video prompts for cues after the intro boundary.

## Deliverables and handoff

1. A prompt manifest for the selected intro cues, retaining exact SRT labels.
2. One generated silent clip per manifest entry in `video_clips_tvN/`.
3. A clear intro-end cue/timestamp recorded in the episode README or build
   notes.
4. Still-image prompts and assets for every cue after the intro boundary in
   `images_tvN/`.

Before building, verify that intro video files are labelled as an unbroken
prefix of the SRT and that every later cue has a matching still image. The
builder chooses a matching video before a still if both exist, and rejects
video cues that appear after still-image cues.
