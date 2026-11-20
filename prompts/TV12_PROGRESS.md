# TV12 image generation progress

246/302 JPGs exist after batch 25. All cues 1–246 generated, through `16-31.jpg`; no pending failed images. Cue 236 (`15-45`) successfully recreated as an inanimate wooden theatre puppet on a tabletop with an adult puppeteer's hand adjusting its strings.

All ten batch-25 images verified 1376×768 landscape. Prior images previously verified landscape.

Prompt archives: batches 6–25 JSON files record prompts from cue 50 onward (earlier retry histories included). `tv12_batch25.json` covers retry 236 and 238–246. `save_tv12_batch6.py` contains locked V7 suffix and cast expansions. Generation uses landscape prefix.

`tv12_next_concepts.tsv` preserves user-supplied concepts for cues 60–257: expand {M}/{W} using batch-6 constants and append identical STYLE suffix. These are partial archives, NOT full prompt pack. Full 302-prompt archive and manifest remain pending. User reposted full pack in chat.

Canonical `refs/Host.jpg` still absent; recent host scenes use `images_tv12/1-13.jpg` for continuity.

Next turn: cues 247–256 (`16-34`, `16-36`, `16-38`, `16-42`, `16-47`, `16-54`, `16-58`, `17-01`, `17-06`, `17-10`), verify landscape, commit. No options/proof stop. Work on current Arena branch; no push requested.
