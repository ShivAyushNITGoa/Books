# VO script — Ep. 1: The Fifth Breath

Five lines, 2:00 total. Everything else is picture and sound design.
Timing here must match `timeline.json` and `vo_ep01.srt` exactly (all times are multiples of 0.1 s).

| # | Character | In | Out | Frames | Hindi | Transliteration | English |
|---|---|---|---|---|---|---|---|
| 1 | Whisper (Badi Amma, off) | 0:02.0 | 0:06.5 | 20–65 | जब आख़िरी मोहर टूटेगी, अंधेरा नाम लेगा। | *Jab aakhri mohar tootegi, andhera naam lega.* | When the last seal breaks, darkness takes a name. |
| 2 | Zoya | 0:38.0 | 0:40.0 | 380–400 | अरिन, भागो! | *Arin, bhaago!* | Arin, run! |
| 3 | Badi Amma | 1:00.0 | 1:04.0 | 600–640 | एक साँस, एक शक्ति, एक चुनाव। | *Ek saans, ek shakti, ek chunaav.* | One breath, one power, one choice. |
| 4 | Timir | 1:44.0 | 1:47.5 | 1040–1075 | तुमने भीड़ चुनी… मैं उनकी उम्मीद लूँगा। | *Tumne bheed chuni… main unki umeed loonga.* | You chose the crowd… I'll take their hope. |
| 5 | Title VO (Whisper) | 1:57.2 | 1:59.8 | 1172–1198 | पाँच साँसें। एक रक्षक। | *Paanch saansen. Ek rakshak.* | Five breaths. One guardian. |

## Voice assignment (guide track)

| Speaker | Voice | Lines |
|---|---|---|
| Badi Amma | mature feminine, warm, unhurried | 1 (whisper), 3, 5 (title) |
| Zoya | young feminine, bright | 2 |
| Timir | low masculine, flat | 4 |
| Arin | *silent in episode 1* | — |

A synthetic guide track is already built at `06_audio/vo/vo_ep01.wav` — see
[`../06_audio/vo/VOICES.md`](../06_audio/vo/VOICES.md). It exists to time the cut, not to ship.

## Delivery notes

1. **Whisper** — close mic, almost spoken to one person. Never processed to sound "spooky";
   the room does that.
2. **Zoya** — full voice, mid-shout, cut off by the pillar hit. Record 0.5 s of breath after the line.
3. **Badi Amma** — warm, unhurried, the authority in the film. Slight smile on "चुनाव" (choice).
4. **Timir** — flat, compressed, no breath between clauses. Record dry; add a 2 ms doubling only in the mix.
5. **Title** — same voice as the whisper, slower, final.

## Pronunciation

- **Nandipur** — *NUN-dih-poor*
- **Pranveer** — *PRUN-veer* (short 'a', not "PRAAN")
- **Timir** — *TIH-mir*
- **Shunya** — *SHOON-yah*
- **Panch-Dwar** — *PUNCH-dwaar*

## Recording spec

- 48 kHz, 24-bit WAV, **mono**, raw — no EQ, no compression, no noise reduction, no de-esser.
- Peaks ≤ −6 dBFS, average around −18 dBFS. Slate each take with the line number.
- Deliver `06_audio/vo/vo_ep01.wav` (all five lines, silent between them, total 2:00).
  The builder muxes it automatically.
- Keep the voice artist's release in this folder when signed.

## Credits wording

> Story & direction — [name] · Animation — [name] · Music — [name] · Voice — [name]
> *Rise of Legend* and all characters are original creations.
