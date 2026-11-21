# Working on this animation kit

**Latest user character-style override:** do not reuse stiff whole-body billboard humans for new character work. Sampled footage analysis of the supplied history reference shows expressive **2D / layered 2.5D cartoon illustration**, not a requirement for realistic 3D humans. Use independent expressions/limbs/props, direction-specific poses and coherent staging; changing a static texture is insufficient. See `references/history-characters/ANALYSIS.md`, `references/CHARACTER_REFERENCE_REVIEW.md` and the override at the top of `STYLE_GUIDE.md`. The Dario reference remains unreviewed beyond metadata. This supersedes the historical character-default instruction below for new work only; keep all frozen approved originals intact.

- Read `README.md`, `PROJECT_FORMAT.md` and `STYLE_GUIDE.md` first.
- The user approved the Refined Edition at source commit `4f52b6d`. Treat `locked/` and the original approved files recorded in its manifest as immutable. Do not rewrite hashes to make an unintended edit pass.
- New scripts belong in separate `projects/<slug>/` directories. Keep story-specific text/timing out of the reusable engine.
- Preserve the approved cutout/stick-limb style. Classroom/locked work keeps continuous single-room staging. The separate `story/` extension explicitly supports story-custom worlds and multiple locations/casts under the newer user direction; read `story/BLUEPRINT.md` and `story/FORMAT.md` before extending it. Neither mode should revert to full realistic human meshes, static slideshows or scene-sized moving text cards.
- For additional actions/assets/styles, extend the unlocked engine separately; do not overwrite the approved reference. Keep all runtime assets local to this bundle and retain third-party notices.
- Do not commit `node_modules`, browser binaries, generated `output/`, temporary mixes or private narration by accident. Explicitly choose which project media to publish.
- Run `npm test`, `npm run verify-lock` and the optional browser/export test after engine/tool changes. Inspect a still and short range before a long export. Never claim a full video was rendered when only a smoke test was run.
- `verify-lock` is an integrity guard, not a GitHub administrator permission setting. Do not claim branch protection was enabled unless it actually was.
