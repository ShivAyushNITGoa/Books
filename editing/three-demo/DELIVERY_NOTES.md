# TV12 full video — delivery note

## Status

- **Render: COMPLETE and VERIFIED.** Full 302-image episode rendered at
  1280×720, 24 fps, H.264 CRF 24 yuv420p, AAC 48 kHz, faststart.
- **Technical QA: PASSED** (see `FULL_BUILD_REPORT.json`).
- **Source / config / QA report: committed and pushed** to branch
  `arena/07b9fb67-books` (commit `dbd31a8`).
- **GitHub release: created but assets could NOT be uploaded from this
  sandbox** (see "Upload blocker" below). The release page exists but is
  currently empty of assets.

## Deliverables (local, verified)

All under `output/tv12_full_v4/`:

| File | Size | SHA256 |
|---|---|---|
| `tv12_full_v4_720p.mp4` (master) | 145.85 MB | `3912c6e856001bd9bfab9372a11a982eb5c1164b8dae765b51fd16fc152e751b` |
| `tv12_part_01.mp4` | 14.01 MB | `9e5f16a101a5501b541697d0c7192d4a29e4a121bb5f1ffd1369034d88e41513` |
| `tv12_part_02.mp4` | 14.25 MB | `4e1341a6668eaf07b88df26d92429ab551c80e73cdd70dfc7f7eb3efff0cd8e6` |
| `tv12_part_03.mp4` | 14.03 MB | `9dbbb31bcdf79a3614de94c7216bac03beb8a68e56fb857837fff6e72604b009` |
| `tv12_part_04.mp4` | 13.69 MB | `9e525da6a69bcc2cfee3276ef7ece2d82f0402357d884429a20f5ae1a16f1a50` |
| `tv12_part_05.mp4` | 14.95 MB | `e658d458ac436c0a3715e5ae7d92afdc7aae828d6899a69a0b77b0ef8a3dd382` |
| `tv12_part_06.mp4` | 15.14 MB | `fe3461b1921e90434781e3cf8c496d298ef142fd4e284b96fc16c75991370b21` |
| `tv12_part_07.mp4` | 14.05 MB | `3592a50ae7b98150fb07bc7373f51ef028da6f793772baf0bcc0a5dea4f0deb1` |
| `tv12_part_08.mp4` | 13.59 MB | `4be1a5b84905e60aa8b993616f2bb932b9ff00da529798fa22c24aa54e3ab6f5` |
| `tv12_part_09.mp4` | 14.09 MB | `f72240dff4bbcb667b074c6c45078ff059f2fb6ec5ac9d95f43935d9a8c71318` |
| `tv12_part_10.mp4` | 13.87 MB | `b0b82998332f3ff2fe6918609c3a3a38a8debe4ac6eb6f3b7c9a37f4ec9942f5` |
| `tv12_part_11.mp4` | 4.20 MB | `e4a95c800bd0a4039e39b5d49792d8541909b4db69970dbf9064700080876fed` |

Master: 20:35 (29,640 frames). Parts: 10 × 120 s + 35 s = 1235 s. All parts
under 100 MB.

## Upload blocker

This sandbox permits outbound access only to `github.com`,
`codeload.github.com`, `api.github.com`, `registry.npmjs.org`, `pypi.org`,
and `files.pythonhosted.org`. GitHub **release asset uploads** are served from
`uploads.github.com`, which is **not** allowed and is unreachable here
(TLS connection reset; confirmed with `curl`). The REST API assets endpoint on
`api.github.com` does not exist (returns 404), so there is no allowed path to
attach binary assets to a release from this environment.

Because of this, the release assets could not be uploaded. The videos are NOT
in Git history (per delivery rules); they remain only in the local
`output/tv12_full_v4/` directory.

## To finish delivery (run from a host with `uploads.github.com` access)

From the repository root, with the files present in `output/tv12_full_v4/`:

```sh
gh release upload tv12-full-v4-dbd31a8 \
  output/tv12_full_v4/tv12_full_v4_720p.mp4 \
  output/tv12_full_v4/tv12_part_01.mp4 output/tv12_full_v4/tv12_part_02.mp4 \
  output/tv12_full_v4/tv12_part_03.mp4 output/tv12_full_v4/tv12_part_04.mp4 \
  output/tv12_full_v4/tv12_part_05.mp4 output/tv12_full_v4/tv12_part_06.mp4 \
  output/tv12_full_v4/tv12_part_07.mp4 output/tv12_full_v4/tv12_part_08.mp4 \
  output/tv12_full_v4/tv12_part_09.mp4 output/tv12_full_v4/tv12_part_10.mp4 \
  output/tv12_full_v4/tv12_part_11.mp4 \
  editing/three-demo/FULL_BUILD_REPORT.json
```

Release page (created, currently empty of assets):
https://github.com/ShivAyushNITGoa/Books/releases/tag/tv12-full-v4-dbd31a8

## Timing limitation

No authoritative full SRT was available; timing derives from image timestamp
filenames. This is **not** verified transcript-level synchronization.
Transitions briefly overlap adjacent images around cue boundaries without
shortening the episode or shifting the narration.
