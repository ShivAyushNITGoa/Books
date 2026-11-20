/* "Scarcity & Attraction" — 30-SECOND ENGLISH DEMO BEAT SHEET
   Source: ScriptForge prompt ("2D Niche Prompt for Claude"), niche 2.4 Relationships & Attraction,
   narration style PSYCHOLOGY (intriguing, authoritative, "Have you ever noticed…", real studies only).

   Script (≈80 words, voice-over in ../../vo/scarcity/, assembled by render/build_vo.py):
     HOOK     Have you ever noticed... the more available you are, the less you're valued?
     SETUP    You reply in seconds. Cancel your plans. Always say yes.
     STUDY    In a 1975 study, people tasted the same cookie, from a jar of ten, or a jar of just two.
              The cookies from the nearly empty jar were rated more desirable.
              (Worchel, Lee & Adewole, 1975, J. Personality & Social Psychology 32(5))
     PAYOFF   Scarcity signals value. But this isn't about playing hard to get.
              It's about a full life. Your goals. Your friends. Your boundaries.
     OUTRO    Be someone worth missing.

   Timing: every beat is cut to the real voice-over. VO holds the measured speech spans of each
   clip (vo/scarcity/timings.json); captions are laid on those spans, 1–3 words, hard swap,
   2 frames early. Re-run build_vo.py and paste new spans here if the VO changes.
*/

/* [clipStart, clipEnd, speechSpans] from vo/scarcity/timings.json (tempo 1.08, lead 0.35, gap 0.14) */
const VO = [
  [0.35, 4.01, [[0.35, 1.53], [1.77, 2.9], [3.14, 4.01]]],
  [4.15, 8.07, [[4.15, 5.35], [5.59, 6.64], [6.88, 8.07]]],
  [8.21, 14.43, [[8.21, 9.99], [10.19, 11.71], [11.95, 12.98], [13.2, 14.43]]],
  [14.57, 17.56, [[14.57, 17.56]]],
  [17.7, 19.08, [[17.7, 19.08]]],
  [19.22, 21.13, [[19.22, 21.13]]],
  [21.27, 25.32, [[21.27, 22.44], [22.68, 23.41], [23.54, 24.27], [24.51, 25.32]]],
  [25.46, 27.09, [[25.46, 27.09]]],
];

/* caption phrases per clip: one phrase per speech span, each phrase split into 1–3 word chunks */
const PHRASES = [
  [["Have you", "ever noticed…"], ["the more", "available you are,"], ["the less", "you're valued?"]],
  [["You reply", "in seconds."], ["Cancel", "your plans."], ["Always", "say yes."]],
  [["In a", "1975 study,"], ["people tasted", "the same cookie,"], ["from a jar", "of ten,"], ["or a jar", "of just two."]],
  [["The cookies", "from the nearly", "empty jar", "were rated", "more desirable."]],
  [["Scarcity", "signals value."]],
  [["But this isn't", "about playing", "hard to get."]],
  [["It's about", "a full life."], ["Your goals."], ["Your friends."], ["Your boundaries."]],
  [["Be someone", "worth missing."]],
];

const EARLY = 2 / 30; // captions swap two frames before the word
function capsFor(i) {
  const [, , spans] = VO[i];
  const phrases = PHRASES[i];
  const out = [];
  phrases.forEach((chunks, k) => {
    const [a, b] = spans[Math.min(k, spans.length - 1)];
    const total = chunks.reduce((s, c) => s + c.length, 0);
    let t = a;
    for (const c of chunks) {
      out.push([Math.max(0, +(t - EARLY).toFixed(3)), c]);
      t += ((b - a) * c.length) / total;
    }
  });
  return out;
}
// each beat starts 0.1s before its words (the picture leads the voice), first beat at 0
const T = VO.map(([s], i) => (i === 0 ? 0 : +(s - 0.1).toFixed(2)));
const t1 = (i) => (i + 1 < T.length ? T[i + 1] : 30);

const OX = "#8f2f33", TEAL = "#3fbdb0", GOLD = "#e8b46a";

export const DEMO = {
  name: "Scarcity & Attraction — 30s demo (EN)",
  duration: 30,
  fps: 30,
  labels: { chip: "PSYCHOLOGY OF ATTRACTION", quote: "QUOTE", outroBrand: "Talk to Society", counter: "checked" },
  beats: [
    {
      id: "hook",
      t0: T[0], t1: t1(0),
      cam: [[0.5, 0.46, 1.0], [0.49, 0.4, 1.12]],
      rig: { yaw: 0, brow: 0.3, companion: false },
      accent: OX,
      title: { kicker: "PSYCHOLOGY OF ATTRACTION", words: ["Always", "available?"], size: 150, carrier: true },
      cap: capsFor(0),
    },
    {
      id: "always",
      t0: T[1], t1: t1(1),
      cam: [[0.46, 0.34, 1.34], [0.52, 0.3, 1.46]],
      rig: { yaw: 0.45, brow: 0.35, companion: false },
      accent: OX,
      title: { kicker: "BEAT 02 · ALWAYS ON", words: ["Instant replies.", "Always yes."], size: 100 },
      phone: {
        time: "11:47",
        counter: true,
        msgs: [
          { who: "me", text: "Free tonight?" },
          { who: "me", text: "I can cancel my plans!" },
          { who: "me", text: "Whatever works for you :)" },
          { who: "them", text: "k", seen: "Seen ✓✓ · 3 hours later" },
        ],
      },
      cap: capsFor(1),
    },
    {
      id: "study",
      t0: T[2], t1: t1(2),
      cam: [[0.44, 0.34, 1.3], [0.47, 0.4, 1.18]],
      rig: { yaw: 0.2, brow: 0.15, companion: false },
      accent: GOLD,
      title: { kicker: "THE STUDY · 1975", words: ["Same cookie.", "Two jars."], size: 112 },
      card: {
        icon: "jars",
        title: "The cookie-jar study",
        body: "Worchel, Lee & Adewole (1975): people tasted an identical cookie — from a jar of 10, or a jar of 2.",
      },
      cap: capsFor(2),
    },
    {
      id: "result",
      t0: T[3], t1: t1(3),
      cam: [[0.52, 0.36, 1.22], [0.5, 0.32, 1.34]],
      rig: { yaw: -0.25, brow: 0.45, companion: false },
      accent: GOLD,
      title: { kicker: "THE RESULT", words: ["Nearly empty jar", "= more desirable"], size: 88 },
      card: {
        icon: "jar",
        title: "Rated more desirable",
        body: "Same cookie, same taste test. The only difference was how many were left.",
      },
      cap: capsFor(3),
    },
    {
      id: "principle",
      t0: T[4], t1: t1(4),
      cam: [[0.5, 0.3, 1.5], [0.5, 0.26, 1.62]],
      rig: { yaw: 0, brow: 0.2, companion: false },
      accent: OX,
      title: { kicker: "THE PRINCIPLE", words: ["Scarcity", "signals value."], size: 136, carrier: true },
      cap: capsFor(4),
    },
    {
      id: "twist",
      t0: T[5], t1: t1(5),
      cam: [[0.49, 0.34, 1.42], [0.46, 0.36, 1.36]],
      rig: { yaw: -0.3, brow: 0.1, companion: false },
      accent: TEAL,
      title: { kicker: "BUT —", words: ["Not", "hard to get."], size: 124 },
      card: {
        icon: "nogames",
        accent: TEAL,
        title: "No mind games",
        body: "Ignoring messages on purpose is still chasing — just in reverse.",
      },
      cap: capsFor(5),
    },
    {
      id: "payoff",
      t0: T[6], t1: t1(6),
      cam: [[0.48, 0.36, 1.3], [0.5, 0.42, 1.16]],
      rig: { yaw: 0.3, brow: 0.25, companion: false, warm: true },
      accent: TEAL,
      title: { kicker: "THE REAL SCARCITY", words: ["A full", "life."], size: 132 },
      card: {
        icon: "spine",
        accent: TEAL,
        title: "Goals · Friends · Boundaries",
        body: "Be busy living your own life — not performing for someone else's attention.",
      },
      cap: capsFor(6),
    },
    {
      id: "outro",
      t0: T[7], t1: t1(7),
      cam: [[0.5, 0.4, 1.16], [0.5, 0.44, 1.1]],
      rig: { yaw: 0, brow: 0, companion: false, still: true },
      accent: "#f4e6cf",
      outro: {
        lines: ["Be someone", "worth missing.", ""],
        tag: "FOLLOW FOR MORE PSYCHOLOGY",
      },
      cap: capsFor(7),
    },
  ],
};

/* extra code-drawn card icons (merged over beats.js ICONS) */
export const ICONS = {
  jars: `<path d="M12 30h38v46a7 7 0 0 1-7 7H19a7 7 0 0 1-7-7z"/><path d="M16 21h30v9H16z"/>
         <circle cx="22" cy="74" r="4"/><circle cx="31" cy="74" r="4"/><circle cx="40" cy="74" r="4"/>
         <circle cx="26.5" cy="66" r="4"/><circle cx="35.5" cy="66" r="4"/><circle cx="22" cy="58" r="4"/>
         <circle cx="31" cy="58" r="4"/><circle cx="40" cy="58" r="4"/><circle cx="26.5" cy="50" r="4"/><circle cx="35.5" cy="50" r="4"/>
         <path d="M70 30h38v46a7 7 0 0 1-7 7H77a7 7 0 0 1-7-7z"/><path d="M74 21h30v9H74z"/>
         <circle cx="84" cy="75" r="4"/><circle cx="94" cy="75" r="4"/>`,
  jar: `<path d="M38 26h44v50a8 8 0 0 1-8 8H46a8 8 0 0 1-8-8z"/><path d="M43 16h34v10H43z"/>
        <circle cx="54" cy="75" r="5"/><circle cx="66" cy="75" r="5"/><path d="M92 30l10-8M94 44h12M92 58l10 8"/>`,
  nogames: `<rect x="22" y="30" width="76" height="40" rx="20"/><path d="M40 42v16M32 50h16"/>
            <circle cx="78" cy="45" r="3"/><circle cx="86" cy="54" r="3"/><path d="M14 82 106 18"/>`,
};
