/* Talk to Society — 30-SECOND DEMO BEAT SHEET
   Built with the rules extracted from nateherkai/herk-edit-kit:

   · Law 1  one idea per beat, avg scene ≈ 2s, cut fast
   · Law 2  black is the canvas
   · Law 5  every cut hides inside a motion-blurred whip (0.33s power2.in / power2.out entry)
   · Law 6  object metaphors carry meaning, one callback minimum (the lamp + shawl return)
   · Law 8  type is a character — word reveal, carrier word carries the momentum
   · Law 9  hold the hero shot — outro holds 6s
   · Law 10 one unifying texture — grid + crosshairs under everything
   · Editing playbook: captions 1–3 words, hard swap, 2 frames early, dark box + thin light
     edge, never over the mouth; first frame is the hook; the speaker never vanishes >3.5s.
*/

export const DEMO = {
  name: "Talk to Society — 30s demo",
  duration: 30,
  fps: 30,
  beats: [
    {
      id: "hook",
      t0: 0.0, t1: 2.4,
      cam: [[0.5, 0.46, 1.0], [0.49, 0.4, 1.1]],
      rig: { yaw: 0, brow: 0.2, companion: false },
      accent: "#8f2f33",
      title: { kicker: "टॉक टू सोसाइटी", words: ["अगर कोई", "भाव नहीं", "देता —"], size: 132, carrier: true },
      cap: [[0.0, "अगर कोई इंसान"], [0.75, "आपको भाव"], [1.4, "नहीं देता?"]],
    },
    {
      id: "effort",
      t0: 2.4, t1: 4.6,
      cam: [[0.46, 0.34, 1.34], [0.52, 0.3, 1.46]],
      rig: { yaw: 0.45, brow: 0.35, companion: false },
      accent: "#8f2f33",
      title: { kicker: "बीट 02 · कोशिश", words: ["और ज़्यादा", "कोशिश"], size: 108 },
      phone: {
        time: "2:14",
        msgs: [
          { who: "me", text: "Hi! कैसे हो? 😊" },
          { who: "me", text: "आज क्या किया?" },
          { who: "them", text: "Hmm…", seen: "Seen ✓✓ · कोई जवाब नहीं" },
        ],
      },
      cap: [[2.4, "तो आप"], [2.95, "और ज़्यादा"], [3.6, "कोशिश करते हैं।"]],
    },
    {
      id: "loop",
      t0: 4.6, t1: 6.8,
      cam: [[0.5, 0.3, 1.5], [0.44, 0.34, 1.42]],
      rig: { yaw: -0.4, brow: 0.5, companion: false },
      accent: "#8f2f33",
      title: { kicker: "बीट 03 · चक्र", words: ["बार-बार", "चेक"], size: 118 },
      phone: {
        time: "2:41",
        counter: true,
        msgs: [
          { who: "me", text: "तुमसे बात करना अच्छा लगता है…", seen: "Seen ✓✓" },
          { who: "typing" },
        ],
      },
      cap: [[4.6, "बार-बार"], [5.15, "उसका मैसेज"], [5.8, "चेक करते हैं।"]],
    },
    {
      id: "rule1",
      t0: 6.8, t1: 9.2,
      cam: [[0.44, 0.34, 1.3], [0.47, 0.4, 1.18]],
      rig: { yaw: 0.2, brow: 0, companion: false },
      accent: "#8f2f33",
      rule: "01",
      title: { kicker: "रूल एक", words: ["रिश्ते को", "अकेले चलाना", "बंद"], size: 96 },
      card: {
        icon: "scale",
        title: "एक तरफ़ा कोशिश",
        body: "आप ही मैसेज करें, आप ही मिलने की बात करें — फिर एक बार रुक कर देखिए, सामने से क्या आता है।",
      },
      cap: [[6.8, "रूल एक —"], [7.5, "अकेले चलाना"], [8.2, "बंद कीजिए।"]],
    },
    {
      id: "rule2",
      t0: 9.2, t1: 11.4,
      cam: [[0.52, 0.36, 1.22], [0.5, 0.32, 1.34]],
      rig: { yaw: -0.25, brow: 0.1, companion: false },
      accent: "#8f2f33",
      rule: "02",
      title: { kicker: "रूल दो", words: ["थोड़े अटेंशन को", "प्यार का", "सबूत न मानें"], size: 78 },
      card: {
        icon: "dots",
        title: "ब्रेडक्रंब",
        body: "छोटे-छोटे संकेत देकर उम्मीद में बनाए रखना — और रिश्ते की ओर कोई साफ़ कदम न उठाना।",
      },
      cap: [[9.2, "रूल दो —"], [9.8, "छोटे अटेंशन"], [10.4, "प्यार नहीं।"]],
    },
    {
      id: "rule3",
      t0: 11.4, t1: 13.6,
      cam: [[0.49, 0.34, 1.42], [0.5, 0.28, 1.56]],
      rig: { yaw: 0.15, brow: 0, companion: false },
      accent: "#8f2f33",
      rule: "03",
      title: { kicker: "रूल तीन", words: ["अपनी कीमत", "साबित करना", "बंद"], size: 92 },
      card: {
        icon: "mirror",
        title: "खुद के लिए बेहतर बनें",
        body: "सेहत, काम, सीख — अपनी जिंदगी के लिए। किसी को पछतावा महसूस कराने के लिए नहीं।",
      },
      cap: [[11.4, "रूल तीन —"], [12.0, "खुद को साबित"], [12.6, "न करें।"]],
    },
    {
      id: "rule4",
      t0: 13.6, t1: 15.8,
      cam: [[0.5, 0.3, 1.5], [0.46, 0.36, 1.36]],
      rig: { yaw: -0.3, brow: 0.2, companion: false },
      accent: "#8f2f33",
      rule: "04",
      title: { kicker: "रूल चार", words: ["जलाने का", "खेल मत खेलिए"], size: 100 },
      card: {
        icon: "flame",
        title: "जलन ≠ प्यार",
        body: "गायब होने का नाटक नहीं — अपनी जिंदगी सच में जीना शुरू कीजिए।",
      },
      cap: [[13.6, "रूल चार —"], [14.2, "जलाने का खेल"], [14.8, "नहीं।"]],
    },
    {
      id: "rule5",
      t0: 15.8, t1: 18.0,
      cam: [[0.48, 0.36, 1.3], [0.5, 0.42, 1.16]],
      rig: { yaw: 0.3, brow: 0.25, companion: false },
      accent: "#3fbdb0",
      rule: "05",
      title: { kicker: "रूल पाँच · समाधान", words: ["अपनी बात", "साफ़ कहिए"], size: 104, accent: "#3fbdb0" },
      card: {
        icon: "bubble",
        accent: "#3fbdb0",
        title: "कह दीजिए, फिर छोड़ दीजिए",
        body: "“मुझे तुमसे बात करना अच्छा लगता है।” फिर फ़ैसला सामने वाले पर छोड़ दीजिए।",
      },
      cap: [[15.8, "रूल पाँच —"], [16.4, "बात साफ़"], [17.0, "कहिए।"]],
    },
    {
      id: "quote",
      t0: 18.0, t1: 20.8,
      cam: [[0.5, 0.4, 1.24], [0.5, 0.36, 1.34]],
      rig: { yaw: 0, brow: 0, companion: false, still: true },
      accent: "#e8b46a",
      quote: { text: "प्रेम एक स्वतंत्रता का दान है।", src: "ओशो · करुणा और क्रांति, शून्य एक" },
      cap: [[18.0, "प्रेम एक"], [18.6, "स्वतंत्रता का"], [19.3, "दान है।"]],
    },
    {
      id: "payoff",
      t0: 20.8, t1: 23.6,
      cam: [[0.5, 0.32, 1.5], [0.5, 0.26, 1.62]],
      rig: { yaw: 0, brow: 0.3, companion: false, warm: true },
      accent: "#3fbdb0",
      title: { kicker: "निष्कर्ष", words: ["आत्मसम्मान", "मज़बूत करें"], size: 96, accent: "#3fbdb0" },
      card: {
        icon: "spine",
        accent: "#3fbdb0",
        title: "रिश्ता दोनों तरफ़ से",
        body: "आप किसी को अपने पीछे नहीं ला सकते — लेकिन यह तय कर सकते हैं कि किसे जगह देते हैं।",
      },
      cap: [[20.8, "आत्मसम्मान"], [21.5, "मज़बूत करें —"], [22.3, "रिश्ता दोनों तरफ़ से।"]],
    },
    {
      id: "outro",
      t0: 23.6, t1: 30.0,
      cam: [[0.5, 0.4, 1.16], [0.5, 0.44, 1.1]],
      rig: { yaw: 0, brow: 0, companion: false, still: true },
      accent: "#f4e6cf",
      outro: {
        lines: ["लोगों को समझो", "ताक़त के खेल को पहचानो", "समाज को समझो"],
        tag: "हक़ीक़त में अपना रास्ता बनाओ",
      },
      cap: [[23.6, "टॉक टू सोसाइटी"], [24.6, "लोगों को समझो।"], [25.8, "समाज को समझो।"], [27.0, "अपना रास्ता बनाओ।"]],
    },
  ],
};

/* code-drawn icons for the glass cards (no bitmap assets) */
export const ICONS = {
  scale: `<path d="M60 78V22"/><path d="M34 78h52"/><path d="M20 34h80"/><path d="M20 34 8 56h24z"/><path d="M100 34 88 56h24z"/>`,
  dots: `<circle cx="22" cy="62" r="7"/><circle cx="46" cy="52" r="7"/><circle cx="70" cy="44" r="7"/><circle cx="94" cy="38" r="7"/><path d="M22 62C36 56 58 50 94 38" stroke-dasharray="4 7"/>`,
  mirror: `<ellipse cx="60" cy="46" rx="26" ry="34"/><path d="M44 34c-6 8-6 18 0 26"/><path d="M60 80v10M44 90h32"/>`,
  flame: `<path d="M60 20c14 16 22 26 22 38a22 22 0 1 1-44 0c0-12 8-22 22-38z"/><path d="M60 46c6 8 10 12 10 18a10 10 0 1 1-20 0c0-6 4-10 10-18z"/>`,
  bubble: `<path d="M20 26h80v40H56L38 82V66H20z"/><path d="M34 42h26M34 52h40"/>`,
  spine: `<path d="M28 20v60"/><path d="M28 50h22l12-14 12 14h20"/><path d="M94 20v60"/><circle cx="60" cy="72" r="8"/>`,
  phone: `<rect x="34" y="14" width="52" height="72" rx="10"/><path d="M44 30h24M44 40h32M44 50h18"/>`,
};
