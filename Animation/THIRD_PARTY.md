# Resources, provenance and notices

## Bundled runtime assets

| Resource | Location | Notice |
| --- | --- | --- |
| Three.js r170 | `engine/vendor/three.module.js`, frozen copy under `locked/source/public/studio/vendor/three/` | MIT, copyright 2010–2024 three.js authors. Full `LICENSE` beside each copy. Source: https://github.com/mrdoob/three.js/tree/r170 |
| Inter | `engine/fonts/Inter.ttf`, frozen copy under `locked/source/public/studio/fonts/` | SIL Open Font License 1.1, copyright 2020 The Inter Project Authors. Full `Inter-OFL.txt` beside each copy. Source: https://github.com/google/fonts/tree/main/ofl/inter |
| Noto Sans Devanagari regular/bold | `engine/fonts/` | SIL Open Font License 1.1, copyright 2022 The Noto Project Authors. Full `Noto-OFL.txt` / `OFL.txt`. Source: https://github.com/google/fonts/tree/main/ofl/notosansdevanagari |
| Voice-over clips, assembled narration and mixed preview | `locked/source/vo/scarcity/`, `locked/source/audio/`, `locked/source/public/demo/` | Preserved generated audio from the approved project; no voice model/weights are distributed. The preserved classroom bundle does not call a TTS service; the separate story extension can run local English speech synthesis. Applicable provider/user terms still apply. |
| Room, character artwork, materials and animation logic | `engine/world.js`, frozen original | Procedural project code. No reference frame is used as a character texture or room background. No new blanket license is imposed on project-authored files by this notice. |

## Install-time dependencies (not vendored binaries)

- `playwright` 1.55.0: Apache-2.0; package/browser installation follows its distribution notices.
- `ffmpeg-static` 5.2.0: GPL-3.0-or-later package; ffmpeg build licensing depends on the distributed build. Review its notices before redistributing binaries. No ffmpeg executable is committed in this folder. `FFMPEG_PATH` permits using your own installation.
- Chromium and its OS libraries are external runtime requirements; no browser executable is committed.
- Archived Python tools use NumPy and imageio-ffmpeg, with requirements files included. Follow those packages' notices if redistributing their distributions. The classroom Node workflow does not require Python; optional story voice generation does.

`package-lock.json` pins Node package versions and integrity metadata. The snapshot retains the original renderer and audio tools for provenance, not an operating-system image. Re-encoding in a different browser/driver/codec environment is not promised to yield the same MP4 bytes.

## User-supplied visual/script references

`references/image-1.png` through `image-5.png` are the five supplied classroom screenshots. `references/final.mp4` is the supplied video at:

https://github.com/ShivAyushNITGoa/Books/blob/main/final.mp4

`references/script-prompt.md` is the previously supplied ScriptForge prompt text. Exact reference-file hashes are included in the lock manifest. The preserved analyses explain what was borrowed at the level of style and staging.

These reference files are supplied study material, **not declared open-source stock assets** by this bundle. Their inclusion does not grant additional third-party rights for unrelated redistribution or commercial use. The animation uses independently code-drawn characters and room geometry rather than extracting frames or the original video's rigs. The unavailable GrowKaz plugin was not used and is not required.

## Story-world extension

- `story/engine/` uses the already bundled Inter font under its existing SIL OFL notice. Environments, characters and props are independently code-drawn, not extracted from the railroad reference. The railroad demo is a newly written simplified adaptation, not a copy of the reference soundtrack.
- Optional `espeakng-loader==0.2.4` is installed by the user from PyPI; its wheel supplies the **eSpeak NG** engine and pronunciation data. [eSpeak NG](https://github.com/espeak-ng/espeak-ng) is GPL-3.0-or-later; consult its source and the wheel's distribution terms before redistributing the engine/data. No engine library, pronunciation database or Python wheel is committed here. This notice does not assign a license to that loader package or relicense third-party code. The small ctypes wrapper is project source.
- Selected `story/demos/` audio is new local baseline English synthesis, not a cloned/reference narrator. No music, reference audio, generated model weights or copied reference frames are included in these demos.
- Full railroad study source: `main/Why Perfect Railroads Don't Work.mp4`, Git blob `4b0a335b070f4b6d97c4e394f90ec19e026bfc81`. Download and contact sheets remain ignored analysis output, not newly redistributed stock. Original authorship/rights are not inferred from its availability on GitHub.
- PocketSphinx 5.1.1 was used only for rough offline reference-audio analysis in the sandbox. It is not a shipped runtime dependency or a verified transcription service in this toolkit.
