# Scarcity & Attraction — 30s Shorts script (ScriptForge)

Made with the **ScriptForge** prompt (`downloads/prompt-and-plugin/2D Niche Prompt for Claude.md`):

- **Step 1, niche:** 2. PSYCHOLOGY → 2.4 Relationships & Attraction
- **Step 2, idea:** *Scarcity & Attraction*: why always being available lowers your perceived value (framed for self-respect, not manipulation)
- **Step 3, script:** the Shorts version (≈30 s) instead of the full 3–4 min. Narration style: PSYCHOLOGY (intriguing, slightly mysterious, authoritative, "Have you ever noticed…", real studies only)

## Script

| Time (final cut) | Section | [NARRATION] | [VISUAL] |
|---|---|---|---|
| 0:00–0:04 | HOOK | Have you ever noticed… (pause) the more available you are, the *less* you're valued? | Title "Always available?" over the host in the library |
| 0:04–0:08 | SETUP | You reply in seconds. Cancel your plans. Always say yes. | Phone: three eager messages → "k", seen 3 hours later; "checked ×22" counter |
| 0:08–0:14 | BEAT: the study | In a 1975 study, people tasted the same cookie, from a jar of ten, or a jar of just two. | "Same cookie. Two jars." + cookie-jar study card with two jars |
| 0:14–0:17 | BEAT: the result | The cookies from the nearly empty jar were rated *more desirable*. | "Nearly empty jar = more desirable" + result card |
| 0:17–0:19 | PAYOFF | Scarcity signals value. | Big title "Scarcity signals value." |
| 0:19–0:21 | TWIST | But this isn't about playing hard to get. | Teal accent; "Not hard to get." + "No mind games" card |
| 0:21–0:25 | PAYOFF | It's about a full life. Your goals. Your friends. Your boundaries. | Warm light; "A full life." + "Goals · Friends · Boundaries" card |
| 0:25–0:30 | OUTRO | Be someone worth missing. | Talk to Society outro: "Be someone / worth missing." · follow prompt |

**Source check:** Worchel, S., Lee, J., & Adewole, A. (1975). *Effects of supply and demand on ratings of object value.* Journal of Personality and Social Psychology, 32(5), 906–914. Participants rated cookies from a jar holding 2 as more desirable than identical cookies from a jar holding 10. No statistics are claimed beyond that.

## After the script (ScriptForge)

- **Alternative titles:** "Why Being Too Available Kills Attraction" · "The Cookie Jar Rule of Attraction" · "Stop Being Always Available (Psychology)"
- **Thumbnail text:** "TOO AVAILABLE?"
- **Tags:** scarcity principle, psychology of attraction, relationship psychology, cookie jar experiment, self respect
- **Word count / runtime:** 80 words · 30 s (VO sped up 1.08×, speech ends at 27.1 s, 3 s outro hold)

## Files

- `01-hook.wav` … `08-outro.wav`: one voice-over clip per beat (TTS)
- `voiceover.wav` + `timings.json`: assembled track and measured speech spans: `python3 render/build_vo.py vo/scarcity --tempo 1.08`
- Beat sheet: `public/studio/beats-scarcity.js` (studio URL `?timeline=scarcity`)
- Render: `node render/render.mjs --timeline scarcity --crf 22 --audio vo/scarcity/voiceover.wav --out output/scarcity-attraction-30s-en.mp4`
- Render (9:16 Shorts/Reels, 1080×1920): `node render/render.mjs --timeline scarcity --aspect 9:16 --crf 22 --audio vo/scarcity/voiceover.wav --out output/scarcity-attraction-30s-shorts-9x16.mp4`
