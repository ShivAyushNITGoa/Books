# TV12 image generation progress

276/302 JPGs exist after batch 28. All cues 1–276 generated, through `18-32.jpg`; no pending failed images.

All ten batch-28 images verified 1376×768 landscape. Prior images previously verified landscape.

Prompt archives: batches 6–28 JSON files record prompts from cue 50 onward (earlier retry histories included). `tv12_batch28.json` covers 267–276. `save_tv12_batch6.py` contains locked V7 suffix and cast expansions. Generation uses landscape prefix.

`tv12_next_concepts.tsv` now preserves user-supplied concepts for cues 60–302: expand {M}/{W} using batch-6 constants and append identical STYLE suffix. These are partial archives, NOT full prompt pack (cues 1–49 not archived). Full 302-prompt archive and manifest remain pending. User reposted full pack in chat.

Canonical `refs/Host.jpg` still absent; recent host scenes use `images_tv12/1-13.jpg` for continuity.

Next turn: cues 277–286 (`18-38`, `18-42`, `18-44`, `18-46`, `18-53`, `19-00`, `19-02`, `19-06`, `19-12`, `19-19`), verify landscape, commit. No options/proof stop. Work on current Arena branch; no push requested.
