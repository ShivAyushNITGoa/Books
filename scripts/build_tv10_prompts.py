#!/usr/bin/env python3
"""Build the complete TV10 image-prompt pack from tv10.srt in one pass."""
from __future__ import annotations
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRT = ROOT / "tv10.srt"
REFERENCE = ROOT / "tv10_reference.txt"
OUT = ROOT / "prompts" / "TV10_Image_Prompts_full.txt"
MANIFEST = ROOT / "prompts" / "manifest_tv10.json"

# One scene description for each SRT cue, in cue order. The reference transcript
# is used to recover the intended meaning where automatic SRT transcription is
# visibly garbled; the SRT remains authoritative for cue count, labels and times.
SCENES = [
    "wide editorial opening composition, a contemporary Indian adult at a city apartment desk with three distinct life choices arranged nearby—a work pass, a small business notebook and a family photograph—quietly considering a major decision; no text",
    "medium shot, a young professional in a modern city apartment looking from a work pass to a small business notebook and a family photograph, asking themself what should guide a decision, subdued high-rise lights beyond the window",
    "overhead close shot, a clean brass balance scale on a contemporary office desk, one pan holding a worn personal notebook, one holding two blank sheets for pros and cons, distant reflected coworker silhouettes beyond the glass",
    "close shot, a professional looking at their own reflection in an office meeting-room window while a few indistinct colleagues pass behind, the reflection slightly smaller than the person, concern about being judged",
    "medium shot, two coworkers in a modern office café, one listening carefully while the other offers calm practical advice over a closed laptop, open body language and equal seating",
    "wide shot, an employee at the end of a glass conference table surrounded by confident colleagues, the employee's hand half-raised then held back, city office towers beyond the windows",
    "close-up, a phone held low beside a tense hand while the employee's face is reflected in the dark glass of a meeting room, several blurred coworkers reflected around them, no readable screen",
    "editorial graphic, a contemporary figure seated between a clear open doorway and a web of thin red threads leading toward blurred silhouettes, the figure pauses before choosing, single visual metaphor for advice versus influence",
    "medium shot, an Indian adult standing quietly at a city apartment window, a crowd moving below while a narrow pool of warm light falls on their own handwritten but unreadable decision notes, self-reflection rather than isolation",
    "object close-up, a still brass desk lamp beside an open blank book and a glass of water with one small ripple settling, the Thinker's Study at night, awareness represented without depicting OSHO",
    "medium shot, @Host in the Thinker's Study in the STILL pose, hands clasped low, direct steady gaze to viewer, dark map and bookshelves softly present behind, restrained presenter introduction",
    "wide shot, @Aman at a contemporary open-plan office desk helping a coworker review a blank chart while his own neat work queue remains visible, capable and dependable without looking overwhelmed",
    "medium shot, @Manager calmly assigning a new project to @Aman beside a shared desk in a modern Indian office, two colleagues in the background, no readable screens or papers",
    "over-shoulder shot, @Aman surveying several stacked work folders and a blank weekly planner at his existing office desk, afternoon city light through glass, workload already substantial",
    "medium two-shot, @Aman calmly explaining his workload to @Manager across a meeting table, one hand indicating two separate task stacks, respectful collaborative posture",
    "object close-up, two groups of unmarked office folders on opposite sides of a brass divider, one task stack moved into a second queue, a hand arranging priorities rather than adding more work",
    "medium shot, @Manager listening and nodding while @Aman and the manager redistribute two blank project folders between them, transparent work conversation in a glass-walled office",
    "split-frame editorial composition of the same modern office: on one side @Aman calmly clarifies priorities with @Manager; on the other, @Manager's reserved disappointment meets @Aman's uncertain posture, contrast between clear negotiation and guilt pressure, no villain caricature",
    "close-up, @Aman's eyes caught in the reflection of a glass office wall while a blurred manager stands at a distance, a blank folder pressed against his chest, fear of being judged irresponsible",
    "wide shot, @Aman walking from office with an excessive tower of folders and laptop bag, shoulders burdened but face restrained, empty corridor leading toward dusk-lit city towers",
    "editorial still life, a single blank message slip between two possible interpretations reflected in a glass desk, one ordinary conversation and one boundary-crossing pattern, no accusation from one sentence alone",
    "close shot, several identical unmarked task requests appearing as repeated shapes on a desk calendar beside a thin red boundary line repeatedly crossed, middle-class corporate office, pattern rather than one-off intent",
    "wide shot, @Aman standing at a fork between a heavy stack of extra work and a clear list of existing duties, thoughtful posture, the decision belongs to him rather than the room's gaze",
    "medium shot, @Aman looking toward a glass corridor where coworkers' indistinct reflections seem to watch, while one clear path leads back to his own workstation, concern about appearing wrong",
    "close shot, @Aman glances from a manager's reserved expression to his own reflection in a glass office partition, worrying that a reasonable limit could make him look wrong, no labels",
    "three-panel editorial composition showing the same pressure pattern in a city office, a contemporary apartment family dinner and a couple speaking in a modern living room, different Indian adults and settings, one shared boundary theme",
    "wide shot, an empty chair facing the viewer at the end of a modern conference table, a modest office worker seated in the opposite chair considering what they would do, direct audience question without text",
    "editorial graphic, two distinct routes from a work desk: one carries a new folder immediately, the other pauses beside a blank priority planner, an Indian office worker at the fork, no labels",
    "clean dark-oxblood comment card in an oil-painted editorial style, an empty speech-bubble shape beside a small office chair and project folder; exact legible Hindi text: ‘अपनी राय कमेंट में बताइए’; no other text",
    "wide shot, a modern Thinker's Study with an open unmarked book, a brass lamp and three quiet concentric rings of light around a small mirror, learned habits and awareness as ideas, no portrait of OSHO",
    "editorial triptych within one frame: a family dining table, a contemporary classroom and an urban office, the same ordinary habit echoed across generations and settings, no historical or rural imagery",
    "medium shot, a young Indian professional helping a colleague carry a project folder through a glass office corridor, ordinary kindness shown without pressure",
    "split-frame, a child listening respectfully to an older relative at a modern apartment dining table and an adult worker completing a responsible task in a city office, contemporary clothing, no traditional costume",
    "close shot, two colleagues in a modern office sharing a task willingly, one hand offered and the other accepted, balanced support with comfortable personal space",
    "editorial graphic, one rigid square rule-shaped frame trying to fit three different everyday scenes—a home, an office and a classroom—while each scene has its own natural arrangement, no readable words",
    "medium shot, an office worker helping a teammate while a full personal workload remains neatly visible on their own desk, a measured boundary between generosity and capacity",
    "close-up, a tired but composed employee's hands hovering above too many blank project folders, a chair and water glass nearby, capacity visibly exceeded without melodrama",
    "medium two-shot, an adult respectfully disagreeing with an older family member in a contemporary apartment living room, both seated at equal height, calm expressions and attentive listening",
    "close-up, a city commuter pausing before replying to a phone notification, thumb lifted from the screen, their reflection visible in a train window, awareness creates a choice",
    "medium shot, an upset coworker speaking across an office desk while another person begins to soothe them automatically, then notices their own hand stopping midway, no readable screen text",
    "medium shot, a young employee hearing criticism in a glass meeting room, lips parting to defend themself, one colleague waits quietly, restrained tension",
    "macro close-up, a finger hovering above a phone's send button while the other hand rests still beside a cup of tea, a brief pause before reaction, screen content abstract",
    "over-shoulder shot, a person looking from their reflection to the real office conversation behind them, the reflection no longer fused with the scene, room to understand before reacting",
    "split-frame, one contemporary employee nods only to avoid an argument on one side and calmly asks a clarifying question on the other, same meeting room, no moral caricature",
    "medium shot, a coworker asks for help while an employee glances at a full schedule and then at the colleague, thoughtful choice between willingness and fear of seeming selfish",
    "editorial still life, a calm face reflected beside a small brass scale holding an ordinary heart-shaped stone and a blank social-rule card, neither side labeled good or bad",
    "close shot, an Indian adult reviewing their own decision notes in a mirror-lit apartment, several faint reflections suggest family, workplace and past experience influencing choices",
    "wide shot, a modern Indian city office where teacher, friend and manager figures exchange advice across a shared table, equal conversational posture, mutual influence as ordinary social life",
    "medium shot, a contemporary instructor explaining a blank diagram to adult learners in a city classroom, learners attentive and free to ask questions, no readable board text",
    "two-shot, two adult friends in a modern café sharing advice over tea, one listens rather than steering the other, evening city street visible through the window",
    "medium shot, a transparent electronics-shop counter in an urban market, a shopkeeper presents a phone and an unmarked warranty card while a customer inspects it, realistic pricing information implied but unreadable",
    "close shot, the customer comparing a phone with two blank specification cards under clear shop lighting, asking a question before deciding, no legible screen text",
    "medium shot, a salesperson gestures urgently toward the last boxed device while the customer pauses and glances at a nearly empty display shelf, false scarcity pressure shown without villainy",
    "over-shoulder shot, the customer sets the product box down and takes a breath at the counter, the shopkeeper waits, choice no longer rushed",
    "editorial graphic, a product information sheet partly obscured by a hand while a customer's concerned reflection appears in the glass counter, hidden facts and emotional pressure suggested subtly",
    "close shot, a shopper looking uncertain as a second person leans too close and points toward a blank checkout screen, the shopper regains personal space, no readable text",
    "split-frame, one ordinary awkward sales conversation seen from both participants' positions, neither face demonized, a single event left open to context",
    "object close-up, a modern weekly planner with several repeated blank marks beside the same boundary line crossed on different days, repetition becoming visible without numerical labels",
    "medium shot, @Host in the Thinker's Study in a restrained STUDY pose, eyes toward viewer beside a balanced brass scale and two empty chairs, inviting reflection; exact legible Hindi question in a clean two-line layout: ‘किसी को समझाने और उस पर अनुचित दबाव डालने के बीच सबसे बड़ा अंतर क्या है?’; no other text",
    "clean dark-oxblood editorial comment card, a blank speech bubble beside a quiet brass desk lamp and open notebook; exact legible Hindi text: ‘कमेंट में अपनी राय लिखिए’; no other text",
    "medium shot, @Aman seated at his office desk with a trusted-colleague acknowledgement represented by a simple nod across the table, his face quietly proud but not boastful",
    "close shot, @Aman receiving a plain folder from a colleague who trusts his reliability, normal office daylight, one small appreciative gesture",
    "medium two-shot, @Manager looks toward @Aman after a request while @Aman hesitates with a hand on a blank task folder, fear of being judged irresponsible",
    "close-up, @Aman's reflection in a meeting-room glass appears divided between a calm face and a worried silhouette, the label ‘irresponsible’ remains unprinted",
    "medium shot, @Aman carrying office files while his reflection in a polished lift door appears overly formal and composed, work and reputation competing",
    "close-up, @Aman stopping in front of a glass office partition, his real posture tired while the reflected posture stands straighter, image management made visible",
    "editorial still life, a polished name badge turned face-down beside a crowded work tray and one untouched lunchbox, protecting an image costs time and energy",
    "wide shot, a generic Indian professional in a modern office accepting three separate requests from coworkers, a fourth hand reaches in from the edge, pressure to be the ‘good one’ without readable labels",
    "medium shot, @Aman calmly sets one extra folder aside and turns back to the task he already accepted, clear responsibility without hostility",
    "split-frame, one person takes an unnecessary late-night risk to look brave while another buys expensive items to look successful, contemporary urban settings, restrained comparison",
    "medium two-shot, an Indian adult politely declines a new request while another person remains disappointed but unharmed, good character shown without pleasing everyone",
    "close-up, @Aman watches coworkers' reactions reflected in a dark office window, while his own hand rests on a blank priority list, noticing the weight given to others' responses",
    "object close-up, a small desk mirror beside a brass compass and a neat work list, recognition represented as the first practical step toward a considered decision",
    "overhead shot, five distinct everyday objects arranged in a row on a dark office desk—a phone, a mirror, a magnifier, two route cards and a boundary line—five practical steps previewed without labels",
    "editorial card, a modern smartphone resting face-down beside a still glass of water and one open hand; exact large legible English text: ‘PAUSE’; no other text",
    "medium shot, @Aman waiting by a city-office window before replying, phone lowered and shoulders relaxed; exact legible Hindi text on the phone's otherwise blank reply screen: ‘मैं इस पर विचार करके आपको जवाब दूँगा’; no other text",
    "close-up, a person notices their own hand tightening around a phone, then loosens it and looks inward; exact clear English word on a small oxblood card: ‘FEEL’; no other text",
    "split-frame, one employee agrees while looking toward a colleague's disappointed face, the same employee pauses and checks their own expression in a mirror, fear distinguished from agreement",
    "object close-up, a magnifying glass over two plain product documents and a phone with abstract shapes; exact clear English word on a dark card: ‘VERIFY’; no other text",
    "medium shot, a junior employee calmly checks a manager's claim against a second blank document and a desktop monitor with abstract charts, no readable screen text",
    "editorial graphic, three open routes from a modern office desk—a full refusal, a negotiated workload and a deferred answer—exact large legible English text on a small card: ‘OPTIONS’; no other text",
    "wide shot, @Aman and @Manager jointly divide a blank workflow board into two balanced task areas, both standing at equal distance from the table, compromise rather than all-or-nothing",
    "close shot, @Aman draws a clear oxblood boundary line between existing tasks and one new folder on a blank planning sheet; exact clear English word on a small tab: ‘BOUNDARY’; no other text",
    "medium two-shot, @Aman speaking calmly to @Manager in a contemporary glass office, one hand on the existing task list and the other near the new project folder, collaborative but firm posture",
    "overhead shot, two project folders placed in clear priority order beside a blank weekly planner, @Aman and @Manager's hands agree on which task moves first, no writing visible",
    "medium shot, @Aman states a limit while @Manager listens with a reserved expression, both seated at the same modern conference table, boundary acceptance left uncertain",
    "wide shot, an employee in a corporate office reviewing a neutral HR advice folder and a calendar before responding to a senior manager, realistic power difference, practical options rather than a heroic confrontation",
    "editorial still life, a brass scale holding a plain information folder on one side and a small responsibility token on the other, an open space in the middle for an informed choice",
    "medium shot, @Host in the Thinker's Study beside a closed dark book and brass lamp, still posture toward viewer; the book cover bears the exact, cleanly legible title ‘Untouchable’; no other text",
    "wide shot, a young adult in a modern apartment between a family group gathered at the dining table and a personal work desk by the window, listening to expectations while keeping their own notebook open",
    "medium shot, an Indian professional listens to a colleague who points out a small mistake on a laptop with an abstract, unreadable screen, the listener stays receptive",
    "close shot, an adult learner at a city training center studies beside a more experienced colleague, two blank notebooks open, information passed without surrendering judgment",
    "medium shot, a person listens to advice across an office table but pauses before signing a blank sheet, thoughtful distance between hearing and accepting",
    "editorial split composition, the same person listens from both sides of a conference table, then chooses a direction after understanding, no labels and no accusatory gestures",
    "overhead shot, an open unmarked book beside a person's own handwritten but unreadable notes and a magnifying glass, ideas tested against experience and reason",
    "close-up, an open book with wide blank margins and a questioning hand turning the page under a warm desk lamp, no final authority implied, no legible writing",
    "wide shot, @Manager at the familiar office desk unchanged while @Aman enters through the glass doorway, same contemporary workplace and steady work pressure",
    "object close-up, the same office inbox still full beside a calendar and a phone with abstract alerts, workload has not magically disappeared",
    "medium two-shot, @Aman and @Manager sit at the modern meeting table with a blank task planner between them, @Aman makes priorities explicit and the manager listens",
    "overhead shot, @Aman's hand arranges two work folders into a clear sequence while @Manager's hand rests nearby, one priority chosen without reacting to a displeased expression",
    "close shot, @Manager shows mild disappointment while @Aman remains composed and continues helping a colleague at the adjacent desk, anger is not the only decision measure",
    "medium shot, @Aman genuinely helps a coworker carry one shared folder, then calmly leaves a second extra folder unopened at his own boundary, support without image-driven overcommitment",
    "editorial graphic, a small compass held steady between two currents of influence—one clarifying route, one crowding the path—no forceful escape or isolation",
    "wide shot, a city-office corridor with people exchanging advice and work, @Aman participates while choosing a clear route through the group, influence is unavoidable but not absolute",
    "split-frame, helpful feedback opens a bright route on one side while repeated emotional pressure narrows a route on the other, the same urban workspace and one thoughtful decision-maker",
    "medium shot, @Host in the Thinker's Study in a quiet THINKER pose, one hand near the jaw and direct gaze, asking a personal question without theatrics",
    "wide shot, a contemporary adult at a three-way choice point between a calmer response, a question for more information and a trusted personal decision, no labels, no crowd pulling them",
    "close shot, an adult looks at three simple objects on a desk—a phone set aside, a question card left blank and a small compass—considering which habit to change",
    "medium shot, @Host in the Thinker's Study beside a plain comment card and an open, empty notebook, warm lamp light; exact legible Hindi text: ‘कमेंट में अपनी एक बात लिखिए’; no other text",
    "close shot of a small blank comment card being placed beside a phone and closed notebook, no personal details or identifying information visible, a quiet contemporary apartment desk",
    "editorial still life, three balanced objects on a dark table—a helpful open hand, an influence thread and a split path—none marked as automatically good or bad",
    "medium shot, a thoughtful Indian adult listens to a colleague, writes one private note in a blank notebook and chooses their next step in a modern office, responsibility without isolation",
    "wide closing card, a solitary but connected path running from a contemporary city doorway into a warm oxblood pool of light; exact large, legible Hindi text: ‘हकीकत में अपना रास्ता बनाओ’; no other text",
    "medium shot, @Host in the Thinker's Study in the STILL pose, hands clasped low and direct calm gaze, a soft practical lamp behind, channel sign-off without a smile or lecture gesture",
    "minimal end card, deep oxblood oil-painted background with one small open doorway and a warm light beyond; exact legible Hindi text: ‘मिलते हैं अगले वीडियो में’; no other text"
]
assert len(SCENES) == 115, f"Expected 115 descriptions, got {len(SCENES)}"

LOCKED_STYLE = (
    "dark red-black Machiavellian oil-painting editorial illustration, semi-realistic Indian oil painting, "
    "visible layered brushstrokes and subtle canvas texture, deep oxblood and crimson accents, near-black and "
    "dark umber shadows, warm amber practical light used sparingly, low-key shadows that keep the subject readable, "
    "grounded modern Indian setting matching the scene's location and economic tier, realistic human proportions and "
    "restrained expressions, clear silhouettes, deliberate still editorial composition, generous negative space, "
    "non-cinematic, not a film still, no cinematic grading, no lens flare, no heavy bokeh, no rim-light glamour, "
    "no glossy 3D, no anime, no caricature; render only exact quoted text requested in the scene description, "
    "legibly and with correct spelling, otherwise no text, no extra lettering, numbers, labels, captions, logos or watermark, "
    "16:9 horizontal composition"
)

HOST_REF = (
    "full-body Talk2Society painted editorial illustration of A. K. Chandradipti, Indian man in his mid-30s, cold calculating strategist in the manner of a Machiavellian prince, unsmiling expression with intense assessing eyes, still and not a teacher, medium warm-brown complexion, realistic skin tones, naturally proportioned oval-to-square face, defined jawline, thick dark eyebrows, deep-set dark-brown eyes, straight proportionate nose, medium lips, full neatly groomed beard connected to moustache, dark thick wavy medium-length hair loosely swept back with strands over the forehead, charcoal-black textured blazer buttoned over a plain black crew-neck tee, deep oxblood velvet-look mantle draped over both shoulders to mid-thigh, not pooling on the floor, dark wristwatch with metallic case, hands clasped low in front, no props held, slim-to-average build, not muscular, neutral relaxed standing pose facing slightly toward camera, full body visible from head to feet with both shoes visible on the ground, plain aged-ivory neutral background, semi-realistic painted style close to the reference photographs, visible brushstrokes, canvas texture, soft controlled tonal modelling, deep oxblood red accent, near-black and dark umber shadows, not cartoon, not photorealistic, not cinematic, no text, 16:9"
)
AMAN_REF = (
    "full-body character reference of Aman, a 31-year-old Indian corporate employee, medium-brown complexion, average build, "
    "naturally proportioned face, short slightly wavy black hair, neat light stubble, thoughtful eyes, muted powder-blue office "
    "shirt with sleeves rolled once, charcoal trousers, simple black belt and plain dark watch, no suit jacket and no logos, "
    "hands relaxed by his sides, neutral upright pose, plain aged-ivory background, semi-realistic Indian oil painting with "
    "visible brushstrokes, deep oxblood accents and soft controlled shadows, no text, 16:9"
)
MANAGER_REF = (
    "full-body character reference of Aman’s manager, an Indian man in his early 40s, medium build, medium-brown complexion, "
    "short neatly combed black hair with a little grey at the temples, clean-shaven, composed neutral expression, charcoal-navy "
    "collared shirt and dark trousers, simple rectangular watch, no tie and no logos, arms resting naturally, neutral upright pose, "
    "plain aged-ivory background, semi-realistic Indian oil painting with visible brushstrokes, deep oxblood accents and soft "
    "controlled shadows, no text, 16:9"
)


def parse_srt(path: Path):
    text = path.read_text(encoding="utf-8-sig")
    blocks = [b for b in re.split(r"\n\s*\n", text.strip()) if b.strip()]
    cues = []
    seen = Counter()
    all_base = Counter()
    staged = []
    for block in blocks:
        lines = [x.strip() for x in block.splitlines()]
        if len(lines) < 3 or "-->" not in lines[1]:
            raise ValueError(f"Malformed SRT block: {block[:120]!r}")
        n = int(lines[0])
        start, end = (x.strip() for x in lines[1].split("-->"))
        h, m, secms = start.split(":")
        sec, ms = secms.split(",")
        base = f"#{int(h)*60+int(m)}-{int(sec):02d}"
        all_base[base] += 1
        staged.append({"cue": n, "start": start, "end": end,
                       "text": " ".join(lines[2:]), "base": base, "ms": ms})
    for c in staged:
        seen[c["base"]] += 1
        c["label"] = c["base"] if seen[c["base"]] == 1 else f"{c['base']}-{c['ms']}"
        if c["cue"] != len(cues) + 1:
            raise ValueError(f"Cue order/number gap before {c['cue']}")
        cues.append(c)
    labels = [c["label"] for c in cues]
    if len(labels) != len(set(labels)):
        raise ValueError("Duplicate AutoEditor labels")
    collisions = {k: [c["label"] for c in cues if c["base"] == k]
                  for k, n in all_base.items() if n > 1}
    return cues, collisions


def main():
    if not SRT.exists() or not REFERENCE.exists():
        raise SystemExit("Expected tv10.srt and tv10_reference.txt at repo root")
    cues, collisions = parse_srt(SRT)
    if len(cues) != len(SCENES):
        raise SystemExit(f"SRT has {len(cues)} cues; scene map has {len(SCENES)}")
    # Preserve the already-approved TV7 presenter design verbatim.
    tv7_pack = (ROOT / "prompts" / "TV7_Image_Prompts_full.txt").read_text(encoding="utf-8")
    approved_host = next(block.split("\n", 1)[1] for block in tv7_pack.split("\n\n") if block.startswith("#Host\n"))
    if HOST_REF != approved_host:
        raise ValueError("#Host reference differs from the approved TV7 prompt")
    references = {"#Host": HOST_REF, "#Aman": AMAN_REF, "#Manager": MANAGER_REF}
    host_cues = [11, 59, 88, 106, 114]
    prompts = {}
    rendered = ["#Host\n" + HOST_REF, "#Aman\n" + AMAN_REF, "#Manager\n" + MANAGER_REF]
    manifest_cues = []
    for cue, composition in zip(cues, SCENES):
        prompt = composition + ", " + LOCKED_STYLE
        prompts[cue["label"]] = prompt
        rendered.append(cue["label"] + "\n" + prompt)
        manifest_cues.append({"cue": cue["cue"], "label": cue["label"],
                              "start": cue["start"], "end": cue["end"],
                              "srt_text": cue["text"],
                              "scene_description": composition, "prompt": prompt})
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n\n".join(rendered) + "\n", encoding="utf-8")
    manifest = {
        "episode": "tv10", "srt": "tv10.srt", "reference_transcript": "tv10_reference.txt",
        "cue_count": len(cues), "scene_count": len(cues), "prompt_count": len(cues) + len(references),
        "references": references, "host_cues": host_cues,
        "label_range": [cues[0]["label"], cues[-1]["label"]],
        "collisions": collisions, "labels": manifest_cues, "prompt_map": prompts,
        "style": "dark red-black Machiavellian oil-painting, non-cinematic; exact quoted text allowed only where specified"
    }
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    # QA: all cue labels appear once and all scene prompts have the same style suffix.
    pack = OUT.read_text(encoding="utf-8")
    assert sum(1 for c in cues if f"\n{c['label']}\n" in "\n" + pack) == len(cues)
    assert all(p.endswith(LOCKED_STYLE) for p in prompts.values())
    assert len(prompts) == len(cues) == len(set(prompts))
    print(f"Wrote {OUT}: {len(cues)} scenes + {len(references)} references = {len(cues)+len(references)} blocks")
    print(f"Labels {cues[0]['label']}–{cues[-1]['label']}; collisions: {collisions}")
    print(f"Manifest: {MANIFEST}; all prompts have the locked style suffix")


if __name__ == "__main__":
    main()
