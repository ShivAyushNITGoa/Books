# TV8 — Stage 1 tagging rationale (How_to_Succeed_Zero_Support)

**Input:** `tv8_transcript_raw.txt` (119 narration lines, 13,957 chars ≈ 19 min Hindi VO)
**Output:** `tv8_transcript_v4_tagged.txt` (identical text + 85 inline Eleven v4 tags)
**Method:** single pass (R2). Tags inserted by anchor at clause boundaries; a mechanical
check strips all `[tag] ` insertions and asserts byte-identity with the raw transcript — **PASS**.

## Design principles applied

- **Tag at shift points only.** Emotion carries forward until the next tag; most lines inherit
  the active register. 85 tags over ~19 min ≈ 1 per 13.5 s (delivery), within the 15–30 s band
  once 6 pauses and 1 reaction are accounted for.
- **Channel voice:** calm-reflective storyteller (`[thoughtful]` ×13 is the spine), direct
  command-mode beats (`[powerful]` ×11, `[slowly]` ×10), brisk do-this-now passages (`[snappy]` ×7).
- **Heat is earned, then released:** `[bitter]`/`[let down]` only at the rejection beats
  (lines 22, 48); `[anxious]`/`[stressed]` only at genuine risk warnings (67, 86); `[tired]`
  only at the rest/overwork beat (65). Every heat tag returns to base within a line or two.
- **Reactions earned:** exactly one `[chuckles]` (line 41, dry mockery of weekly goal-posting).
  No `[laughs]`, `[gasps]`, `[crying]` — nothing in the text earns them.
- **Quoted voices get character tone:** `[distant]` colours the defeatist quote (14) and the
  sulk-path (49); `[hopeful]`/`[curious]`/`[powerful]` colour the corrective quotes/turns.
- **Pauses at major turns only:** 6 total (opening beat, "ध्यान से सुनो", the "रुको।" reset,
  "अब क्या करोगे?", the final-question lead-in). Ordinary breathing left to punctuation/line breaks.
- **Text is sacred:** no words reworded, added, deleted, or case-changed (Devanagari is caseless;
  no capitalisation tricks used). Tags only wrap around text.

## Catalog verification

All 85 tags are entries from the verified Eleven v4 catalog (script asserts membership):
`thoughtful powerful slowly snappy pause curious intrigued hopeful hushed softly content
peaceful distant let down bitter chuckles tired anxious stressed optimistic` — 20 distinct,
all official. No custom directions, no sound-effect tags, no accent tags.

## Rating loop

**Iteration 1 (first draft):** 110 tags, tagged almost every line start.
- Human-likeness 8 · Motivation 8 · **Restraint 6** · Engagement 8 · Character 8.
- Weakest: **Restraint** — carry-forward register was being re-announced on lines that didn't shift.

**Fix:** removed 25 redundant delivery tags where the previous tag still governed (kept only
genuine shift points: chapter turns, emotional pivots, quoted voices, punch lines).
Added back nothing.

**Iteration 2 (final, 85 tags):**
1. **Human-likeness — 9/10.** Reads like a person thinking in Hindi clauses: questions land as
   questions, punch lines slow down, the dry aside chuckles once.
2. **Motivation — 9/10.** Every tag is caused by nearby words: `[bitter]` at "एक मना कर देता है",
   `[tired]` at "थक गए हो", `[chuckles]` at the goal-posting mockery, `[hushed]` at "ध्यान से सुनो".
3. **Restraint — 9/10.** 85 tags over 119 lines; 34 lines run on inherited register; base
   calm-reflective carries the long explanatory passages.
4. **Engagement — 9/10.** Heat/soft/pause moments land at the earned beats: rejection (22/48),
   self-test (57–58), the responsibility charge (108–110), the final question (114–116).
5. **Character consistency — 9/10.** The whole file stays the channel's low-key strategist-
   storyteller: instructs, never cheerleads; one dry laugh, no melodrama.

**Pass: 9/10 average (≥ 8 on all five criteria).** Stage 1 complete.
