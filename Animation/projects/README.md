# New projects go here

From `Animation/`, run:

```sh
node tools/cli.mjs init --name my-video --script /path/to/script.txt --audio /path/to/narration.mp3
```

Or omit audio and pass `--duration 30` for a clearly labeled silent animatic. Add `--srt /path/to/captions.srt` for accurate imported caption timing.

Each project gets its own JSON, source script, captions and ignored `media/` directory. Edit that project's cues/camera/board, validate, preview, then render under `output/`. Do not edit `locked/`. Intentionally add media with `git add -f` only if you want to publish it; avoid accidentally publishing private scripts or narration.
