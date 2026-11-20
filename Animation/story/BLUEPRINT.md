# Story → complete custom video: production blueprint

## Product promise and boundary

The user can give the assistant **an idea or a draft story**. The assistant does the adaptation, English script, art direction, custom environment/cast/prop authoring, animation, narration, captions, assembly and QA. The user should not have to write JSON or rig characters.

**The assistant is the story-to-production layer.** This repository is the executable production toolkit. Its CLI consumes an **authored** `story-v1` plan; it does not semantically understand arbitrary prose or silently invent production-ready art. “Any story” means an extensible, agent-authored workflow, subject to content/safety, asset rights, runtime and production limits—not proof that a fixed set of presets can automatically film anything at reference quality.

The locked Scarcity & Attraction classroom film and its resources remain unchanged. The classroom engine remains available. New story work lives in `Animation/story/` and new authored projects; it may span any number of story-appropriate locations within the schema's practical limits.

## 1. Intake and adaptation (assistant)

Input: idea, rough story or finished English script; optionally audience, aspect ratio, duration, tone and references. If omitted, infer reasonable defaults and state them. Use **English voice and English on-screen text**. Keep the approved cutout/illustrative character direction, not full realistic 3D humans.

Deliver a compact internal story brief:

1. Premise, viewpoint, goal, obstacle, reversal and ending.
2. Factual claims to verify; separate metaphor/fantasy from educational explanation.
3. Target format and speaking budget. For Shorts, default to 9:16 and approximately 30 seconds unless the story demands otherwise; the engine is not restricted to 30 seconds.
4. Identify privacy, likeness, music, reference and asset rights. Never clone someone's voice merely because a reference contains it.

A bare idea may need invented connective events; a supplied story must retain its meaning. Ask a question only for consequential ambiguity, not for every costume/prop choice.

## 2. World and cast bible (assistant authors)

For **each location**, specify geography, palette, materials, foreground/midground/background, light direction and reusable anchor objects. Keep a spatial ledger: entrances, exits, object positions and geography across shots. A room, desert, station, forest, spaceship or invented world is chosen from the story, never imposed because the previous video used a classroom.

For **each character**, specify role, silhouette, face, costume, color, scale, handedness, expression range, voice role and key actions. Reuse identity across scenes. One protagonist is valid; so are ensembles and scenes with no visible actors.

For **each important prop**, specify owner, position, scale, state changes, interaction and narrative purpose. Props that teach a mechanism must visibly change: gap closing, bridge flexing, plant growing, machine switching on. Background dressing must not obscure the central action.

Working baseline: `cast`, per-scene `actors`, `props` and `world` in [FORMAT.md](FORMAT.md). For unusual characters, worlds or objects, the assistant extends the **unlocked** painter/rig functions and validators, adds a fixture and test, then renders a still. Never modify the frozen version to add a new asset.

## 3. Screenplay, shot list and performance (assistant authors)

Break the story into **causal beats**, not one illustrated slide per sentence. For each beat record:

- Narration/dialogue; what new information it adds.
- Location and persistent state carried from the previous beat.
- Visible action, prop interaction and character motivation.
- Shot purpose: establish, follow, reveal, react, compare or inspect.
- Camera target/zoom, actor/prop start/end positions, expression/action.
- Entry/exit continuity and caption-safe area.

Show what the line describes. Do not narrate “she repairs the valve” over a generic talking pose: author the valve, tool, hand motion and before/after state. The included `work` action is only a generic tool gesture; a bespoke repair needs bespoke action code. Avoid repeated static zooms as a substitute for performance.

Baseline supports continuous movement/easing within shots and hard cuts between scenes. More elaborate choreography, dialogue turn-taking, visemes, camera orbit, cuts inside an action, facial rigs or collisions require deliberate new code. Split a shot into several matched scenes for simple timing changes; preserve positions at the cuts. Do not advertise these advanced features as already implemented.

## 4. English voice and timing (working pipeline)

1. Freeze the narration text per scene.
2. `prepare` synthesizes **English eSpeak NG** locally if no `scene.audio` is supplied. No internet/key is required after installation. This is an accessible, reproducible **basic synthetic voice**, not a premium narrator.
3. For polished delivery, generate/record licensed English speech per scene outside this baseline; set each `scene.audio` to the real local clip. The same prepare/render stages handle it. Speaker audition/approval is a production step, not secretly automated by the CLI.
4. Decode to mono PCM16 at 48 kHz, normalize each scene, measure actual sample counts, add a short tail, derive contiguous scene starts/ends. A requested `seconds` shorter than the voice fails rather than truncating words. It is a minimum duration, not an automatic time-stretch instruction.
5. Build a 60 Hz RMS envelope for **amplitude-driven mouth motion**, not phoneme-perfect lip sync. Action types marked as talking use that envelope; a narration-only shot can use silent actor actions.
6. Add low-level seeded walking foley; combine voice and effects with peak control. More varied ambience/music/effects require licensed authored audio/mixer extensions. The current mixer is not a full sound-design workstation.

Exact 30-second delivery requires editing the script/pacing or supplying a suitable voice take, measuring again, then allocating scene tails. Do not force an arbitrary-length story into 30 seconds by cutting the audio.

## 5. Captions (working pipeline + review)

Measured per-scene voice clips prevent cross-scene drift. Within each clip, phrase durations are **text-length estimates**, with punctuation breaks—not forced alignment. `captions.srt` preserves all English narration; rendered captions are drawn into frames. Exporting a range shifts/clips the SRT to zero.

For word-perfect captions, import an externally aligned/reviewed cue list into the prepared `project.json` before rendering. This version validates prepared cues but does not include an aligner/editor/import command. Re-running prepare replaces those manual cue edits in a new output, so retain an authored copy. Check long words, names, line breaks, contrast, faces, important props and phone UI safety at native resolution.

## 6. Visual production and export (working pipeline)

- Validate story → generate/measure voice → create prepared timeline → preview → inspect representative stills → low-res full animatic → revise → final export.
- Canvas 2.5D renderer: consistent oblique world projection, extruded geometry, top/side shading, atmospheric layers, depth ordering, contact shadows, illustrated cutout actors. It is neither a slide deck nor a photorealistic human-mesh renderer.
- Every frame is a pure sample of absolute story time. No wall-clock physics, random asset loading or network image dependencies. `window.setT(t)` supports deterministic review/export; renderer waits for local font/envelope loading.
- Same-origin media, 0.0.0.0 server, browser-relative URLs, range-capable static serving. Preview works through Arena's proxy without browser calls to localhost.
- Shared export code encodes H264/yuv420p video + AAC audio, BT.709 metadata, fast-start MP4; PNG stills and range renders are supported. Articulation in the source examples is intentionally simple.
- Render outputs live in ignored `Animation/output/`. Publish selected small demos intentionally, not caches, downloaded reference media, browser binaries or voice model packages.

## 7. QA gates before telling the user “done”

1. **Story:** all requested beats, factual checks and intentional ending; no unexplained missing action.
2. **World:** recognizable location; continuity of cast, costumes, props, geography, season/time.
3. **Performance:** gestures and movement reflect events; feet/props grounded; framing readable; meaningful visual changes throughout.
4. **Voice/captions:** English, no clipped final words; voice length matches timeline; inspect/listen to delivery; review cue alignment; label any estimates.
5. **Output:** complete-file decode, resolution/aspect/duration/audio stream checked; review first/last frame and each scene. A one-second test is not evidence of a full export.
6. **Regression:** unit tests, real-browser story tests, original browser tests after shared-render changes, strict frozen-hash verification.
7. **Publication:** source, schema, assets/notices and instructions under Animation; selected demo artifacts with production metadata; push only current branch. Do not merge without permission.

Automated tests establish runtime behavior—not human narration quality or parity with the reference. Report exactly what was rendered and what remains manual.

## Implementation map

| Stage | Working file / artifact |
| --- | --- |
| Adapt idea → authored script/shot plan | Assistant workflow above; examples are editable outputs of this step |
| World/cast/prop/shot data | `engine/story.schema.json`, `engine/story.js`, examples |
| Custom sets, cutout rig, actions, physical mechanisms | `engine/world.js`, exported `propPainters` registry |
| Local English TTS | `tools/tts.py`, pinned `requirements.txt` |
| Per-scene audio input, measured timeline, captions, mix, envelope | `tools/prepare.mjs` |
| Validate / prepare / serve / render | `tools/cli.mjs` |
| Frame sampling + MP4/SRT assembly | `../tools/render.mjs` with explicit story mode |
| Tests | `../tests/story.test.mjs`, `tests/browser.mjs` |
| Visual target and complete-runtime reference study | `REFERENCE_ANALYSIS.md` |
| Runnable demos | `examples/railway/`, `examples/space-garden/`; selected exports in `demos/` |

## Next custom story handoff

User supplies a story. Assistant adapts it, authors any missing rig/prop/world/action code, generates the English voice, times captions, renders/reviews the result and returns the final video plus editable source. The user does not need to operate the CLI. Production quality and unusual requirements are reviewed per story; “ready” is readiness to carry out that work, not a claim of universal one-click automation.
