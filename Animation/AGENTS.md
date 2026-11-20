# Working on this animation kit

- Read `README.md`, `PROJECT_FORMAT.md` and `STYLE_GUIDE.md` first.
- The user approved the Refined Edition at source commit `4f52b6d`. Treat `locked/` and the original approved files recorded in its manifest as immutable. Do not rewrite hashes to make an unintended edit pass.
- New scripts belong in separate `projects/<slug>/` directories. Keep story-specific text/timing out of the reusable engine.
- Preserve the approved cutout/stick-limb style and continuous single-room staging. Do not revert to a full human mesh, static slideshow or scene-sized moving text cards.
- For additional actions/assets/styles, extend the unlocked engine separately; do not overwrite the approved reference. Keep all runtime assets local to this bundle and retain third-party notices.
- Do not commit `node_modules`, browser binaries, generated `output/`, temporary mixes or private narration by accident. Explicitly choose which project media to publish.
- Run `npm test`, `npm run verify-lock` and the optional browser/export test after engine/tool changes. Inspect a still and short range before a long export. Never claim a full video was rendered when only a smoke test was run.
- `verify-lock` is an integrity guard, not a GitHub administrator permission setting. Do not claim branch protection was enabled unless it actually was.
