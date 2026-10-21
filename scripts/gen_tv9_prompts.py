#!/usr/bin/env python3
"""TV9 Stage 3 — image prompt pack generator (single run, all scenes at once).

Reads tv9.srt (main, for use in video) and emits:
  prompts/TV9_Image_Prompts_full.txt   - #Host plate + 318 scene prompts (V7 labels)
  prompts/host_prompt_v9.txt           - the #Host reference plate prompt
  prompts/style_phrase_v9.txt          - the locked style phrase
  prompts/manifest_tv9.json            - machine manifest for the image stage

Label system: exactly build_tv7plus.parse_srt — M-SS from cue start (ms truncated),
collision -> M-SS-<ms>. Every scene prompt ends with the V7 locked style phrase,
byte-identical. Scene meanings follow the locked v3 script; where the main SRT text
is ASR-garbled the meaning is taken from tv9_srt_reference.txt (user's reference file).
"""
import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

STYLE = (
    "painterly Indian editorial illustration, semi-realistic painted style close to "
    "photographic likeness, not cartoon and not photorealistic, visible brushstrokes and "
    "canvas texture, rich oxblood red and deep crimson accents, near-black and dark umber "
    "shadows, warm amber and aged brass practical light used sparingly, dark red-tinted "
    "low-key atmosphere, one controlled light source, soft controlled tonal modelling with "
    "deep shadow shapes, realistic human proportions and natural skin tones, restrained "
    "expressive faces, grounded Indian setting matching the scene's economic and location "
    "tier, clear readable silhouettes, mature graphic-novel painting sensibility, generous "
    "negative space, no text, no lettering, no numbers, no captions, no logos, no watermark, "
    "no cartoon, no caricature, no glossy 3D, no anime, no neon colours, no cinematic "
    "grading, no lens flare, no heavy bokeh, no rim light, 16:9 horizontal composition"
)

HOST_PLATE = (
    "full-body Talk2Society painted editorial illustration of A. K. Chandradipti, Indian "
    "man in his mid-30s, cold calculating strategist in the manner of a Machiavellian "
    "prince, unsmiling expression with intense assessing eyes, still and not a teacher, "
    "medium warm-brown complexion, realistic skin tones, naturally proportioned "
    "oval-to-square face, defined jawline, thick dark eyebrows, deep-set dark-brown eyes, "
    "straight proportionate nose, medium lips, full neatly groomed beard connected to "
    "moustache, dark thick wavy medium-length hair loosely swept back with strands over the "
    "forehead, charcoal-black textured blazer buttoned over a plain black crew-neck tee, "
    "deep oxblood velvet-look mantle draped over both shoulders to mid-thigh, not pooling "
    "on the floor, dark wristwatch with metallic case, hands clasped low in front, no props "
    "held, slim-to-average build, not muscular, neutral relaxed standing pose facing "
    "slightly toward camera, full body visible from head to feet, plain aged-ivory neutral "
    "background, semi-realistic painted style close to the reference photographs, visible "
    "brushstrokes, canvas texture, soft controlled tonal modelling, deep oxblood red "
    "accent, near-black and dark umber shadows, not cartoon, not photorealistic, not "
    "cinematic, no text, 16:9"
)

# n -> (kind, scene description)   kind: "host" | "scene"
# Composition order: SHOT TYPE, who/what + action/pose + key objects + setting tier
# + metaphor (where abstract) + camera. The locked style phrase is appended by the builder.
SCENES = {
    1: ("host", "medium shot, @Host in the Thinker's Study in the STILL pose, oxblood mantle over his shoulders, brass lamp casting warm light on the dark wooden desk, facing the viewer with a calm assessing gaze as the lesson opens"),
    2: ("scene", "wide shot, a calm Indian man seated at a small table with hands folded while three dark paper darts lie stopped and fallen at his feet, MIDDLE CLASS / HOME, not every provocation deserves a reply, warm lamp light"),
    3: ("scene", "close-up, a baited fishing hook drifting past a man's still folded hands on a dark wooden table, untouched, one controlled light source, restraint as a chosen act"),
    4: ("scene", "medium shot, a man straining under a tall stack of blank framed certificates while a row of faceless silhouettes has already turned away, CITY street at dusk, the exhausting work of proving himself"),
    5: ("scene", "wide shot, a lone man on a quiet street as faceless passers-by point at him from both sides, two of them holding cracked hand mirrors, MIDDLE CLASS / HOME tier street, being misunderstood"),
    6: ("scene", "medium shot, a faceless figure mid-gesture of harsh criticism across a dim table while the seated man does not turn his head, TOWN / BAZAAR shuttered lane behind"),
    7: ("scene", "object close-up, a steel measuring tape unspooled and deliberately tangled at a worker's feet while a shadowy figure points at the tangle, RURAL / FARM / WORKSHOP, questioned capability"),
    8: ("scene", "close-up, one hand deliberately sliding a hot coal across a dark table toward another hand, a trap of provocation, deep shadow, single lamp"),
    9: ("host", "medium shot, @Host in the Thinker's Study in the STILL pose, oxblood mantle draped over his shoulders, jaw set, the decision to change a habit held in his stillness"),
    10: ("scene", "object close-up, an old television remote being gently withdrawn from an outstretched stranger's open palm by its owner's calm hand, dark room, buttons abstract shapes, emotional control returning home"),
    11: ("scene", "split-frame, left a man shouting across a small table, right the same man gripping the table edge and exhaling slowly, MIDDLE CLASS / HOME, anger triggered then refused"),
    12: ("scene", "medium shot, a man lying awake under a slowly turning ceiling fan while a thin dark loop of smoke replays the same insult above him, MIDDLE CLASS / HOME bedroom at night"),
    13: ("scene", "wide shot, a man at a work desk turned fully around in his chair to stare at the door a silhouette just left through, his own work gone dark, INSTITUTION office"),
    14: ("scene", "close-up, a horseshoe magnet held above a seated man drawing a glowing red thread out of his brow, dark room, attention stolen"),
    15: ("scene", "object close-up, an hourglass spilling red sand past its own frame onto the floor beside a broken chain link, time and energy slipping outside control"),
    16: ("scene", "close-up, one heavy chain link snapping open in a shatter of dark iron, a loop of habit broken, warm rim of lamplight on the break"),
    17: ("host", "medium shot, @Host in the Thinker's Study in the STILL pose, shoulders squared, oxblood mantle steady, silence framed as strength in his composure"),
    18: ("scene", "object close-up, three balanced stones stacked into a small cairn on a dark desk under a brass lamp, understanding self-respect and self-control held together"),
    19: ("scene", "wide shot, an old library corridor with four shadowed alcoves each holding a faint symbolic object, a scroll, a lamp, a small charkha, a weighing scale, history's many meanings of silence"),
    20: ("scene", "object close-up, a chessboard mid-game beside a blank-page strategy ledger and a faintly lit route map on a dark desk, a bronze Thinker statuette in shadow behind, strategic thinking"),
    21: ("scene", "editorial metaphor, dozens of scattered paper slips drawn into one straight ordered line toward a single lit lamp, the mind gathered in one direction"),
    22: ("scene", "object close-up, a small charkha at rest in a quiet room beside one candle and a wall clock face with no numerals, weekly silence kept as practice"),
    23: ("scene", "wide shot, a vast painted ancient Indian assembly hall, a lone woman's upright silhouette among rows of seated elders, two dice on the stone floor, a question of justice"),
    24: ("scene", "medium shot, the four symbolic objects gathered on one dark table under a warm lamp, scroll, lamp, charkha and scale, one clear lesson condensing"),
    25: ("scene", "split-frame, left a man silent beside a cracked boundary wall, right the same man standing and speaking firmly at an office table, silence not always the answer"),
    26: ("scene", "wide shot, a man pausing beneath a three-way stone archway, one path gated, one path with a listening well, one path with a raised speaking stone, when to stop listen and speak"),
    27: ("host", "medium shot, @Host seated at the Thinker's Study desk in the STUDY pose, hands folded on the desk, oxblood mantle over his shoulders, introducing himself directly to the viewer"),
    28: ("host", "medium shot, @Host in the Thinker's Study in the STUDY pose, brass lamp and dark map behind him, speaking calmly of human behaviour power and society"),
    29: ("host", "wide shot, the Thinker's Study in full, bookshelves and dark map in shadow, @Host seated composed at the desk in the STUDY pose, things seen yet left ununderstood"),
    30: ("scene", "editorial graphic, a brass compass on dark velvet surrounded by four smooth stones arranged around it, speaking pausing bounding and conserving, the video's four lessons"),
    31: ("scene", "close-up, a hand pulling a glowing red cable out of a loud vibrating radio on a table, energy reclaimed from a useless argument"),
    32: ("host", "medium shot, @Host in the Thinker's Study in the STILL pose, calm direct address, an invitation to begin held in his steady gaze"),
    33: ("host", "wide shot, @Host in the JUDGE pose in the Thinker's Study, a heavy door behind him now open one hand's width, a furled white flag in a wooden stand by the desk, chapter one of not making every matter a fight"),
    34: ("scene", "editorial graphic, a tabletop battlefield of small paper swords while one man sheathes his own blade and walks off-frame, not every matter becomes a war"),
    35: ("host", "medium shot, @Host in the Thinker's Study in the STUDY pose, leaning slightly forward into lamplight, telling the viewer to listen closely"),
    36: ("scene", "medium shot, a man facing a glass shadow-box inside which a smaller copy of himself lunges and snarls, the first fight is the habit within"),
    37: ("scene", "object close-up, the shadow-box lid pressing shut as the lunging copy strains against the glass, the habit locked under observation"),
    38: ("scene", "two-shot, a faceless man in a doorway pointing down at a seated worker with his tools on the floor, TOWN / BAZAAR lane, the words you cannot do this"),
    39: ("scene", "close-up, the seated worker's mouth half-open to answer, one hand half-raised with a ready reply, restrained"),
    40: ("scene", "medium shot, a man lifting one blank trophy after another onto a high shelf toward an uninterested silhouette walking away, proving himself endlessly"),
    41: ("scene", "close-up, one jabbing finger pressed forward at a long shadow on a plaster wall, the argument sharpening"),
    42: ("host", "medium shot, @Host in the Thinker's Study in the THINKER pose, hand against his jaw, one genuine question asked of himself before any reply"),
    43: ("scene", "wide shot, a crossroads of two blank wooden planks over a dark road, one pointing toward a lit workshop, one toward a shouting crowd, is the reply necessary"),
    44: ("scene", "two-shot over an office desk, two colleagues returning one blank sheet of paper to the clear centre of the table, a work misunderstanding clarified, INSTITUTION"),
    45: ("scene", "close-up, a hand placing a solid stone weight onto a weighing scale as fog thinks away from the other pan, facts laid out plainly"),
    46: ("scene", "wide shot, a man pouring his lamp oil onto dozens of tiny scattered floor fires while his own desk lamp dims, energy wasted on every disagreement"),
    47: ("scene", "medium shot, a ship's wooden wheel held steady while dozens of paper notes blow past its spokes, direction not set by comments"),
    48: ("scene", "object close-up, a rough stone sharpening a blade steadily on a workbench, RURAL / FARM / WORKSHOP, useful criticism honing the work"),
    49: ("scene", "close-up, a thrown stone cracking the glass face of a compass held in a man's hands, bad criticism trying to steal the decision"),
    50: ("scene", "medium shot, warm lamplight on a man's face while two figures clap softly in the dark beyond the pool of light, praise enjoyed quietly"),
    51: ("scene", "wide shot, a man walking toward rows of empty applauding chairs while his own dim workbench waits behind him, acting only for praise"),
    52: ("scene", "object close-up, a brass compass on a dark map with one hand steadying it toward its own north, direction chosen for oneself"),
    53: ("scene", "object close-up, three stones stacked tallest-first on a dark desk in a deliberate order, priorities set"),
    54: ("scene", "close-up, lamp oil poured slowly through a small funnel into one lantern, energy spent deliberately"),
    55: ("host", "medium shot, @Host in the Thinker's Study in the EXPLAIN pose, one restrained hand extended toward a chessboard and route map on the desk, strategic thinking introduced"),
    56: ("scene", "high-angle wide, a war-room table with a faintly lit map, carved pieces and three lit options laid out, reading the situation and the people in it"),
    57: ("scene", "close-up, a carved piece held above the chessboard while the rival's reply position already waits one move ahead, consequences weighed before the step"),
    58: ("scene", "medium shot, the same strategy board now sitting on a modern office desk beside a closed laptop, ancient strategic thinking applied to today"),
    59: ("scene", "two-shot, a colleague leaning across a cubicle table with a pointed finger while the other man's hands stay still on the desk, INSTITUTION office provocation"),
    60: ("scene", "two-shot across a shop counter, a buyer slamming his palm down while the shopkeeper's pen hovers over an unsigned blank pad, TOWN / BAZAAR, pressure for a rushed decision"),
    61: ("scene", "close-up, one hand yanking another into a handshake over a blank page while a small sandglass runs empty beside it, forced promises under conversation pressure"),
    62: ("host", "medium shot, @Host in the Thinker's Study in the STILL pose, unhurried, making clear that instant reaction is rarely required"),
    63: ("scene", "close-up, a magnifying glass held over a cluttered desk scene, first understand the situation"),
    64: ("scene", "close-up, two hands gathering scattered blank file cards into one neat stack, gather the necessary information"),
    65: ("scene", "medium shot, three identical unlit lanterns on a shelf with one hand hovering between them, see your options"),
    66: ("scene", "close-up, one lantern now lit and lifted decisively from the shelf, then decide"),
    67: ("scene", "split-frame, left a man drawing every curtain shut in distrust, right the same man at a clear table with one glass of water and an open door, neither blind suspicion nor secrecy"),
    68: ("scene", "close-up, a hand placing three dark tokens into three correct slots of a wooden tray, word time and decision used in the right situation"),
    69: ("scene", "object close-up, the strategy map with one route drawn in soft ash and no footprint yet on it, understand before you move"),
    70: ("scene", "close-up, one boot stepping onto the drawn route at last, the step taken after understanding"),
    71: ("scene", "object close-up, a blank stone inscription tablet beside a lamp and a closed leather book, a practical lesson rather than a literal quote"),
    72: ("scene", "two-shot, an office desk where a colleague cuts in mid-sentence while the other man rises with mouth open, voice escalating louder than the interrupter, INSTITUTION"),
    73: ("scene", "close-up, the second man's face hardening mid-shout as lamp shadows jump on the wall, the escalation taking over"),
    74: ("scene", "wide shot, the real topic as a blank sheet slid off the table's edge and ignored while two arguing shadows fill the room, the argument gone personal"),
    75: ("scene", "close-up, a hand pressing a bicycle brake lever slowly and firmly, motion coming to a stop, learn to pause"),
    76: ("scene", "two-shot, a seated man raising one calm open hand toward an interrupter while he finishes his sentence, let me finish my point"),
    77: ("scene", "two-shot, the same man now leaning back listening steadily as the other speaks, both figures under one lamp, then I will hear your view"),
    78: ("scene", "close-up, a neat rope boundary laid across the table in front of the man with one plain card resting beside it, his point made and his limit set"),
    79: ("scene", "split-frame, left a fist slamming a table in impulse, right a hand placing one stone deliberately on a board, impulse against a chosen reply"),
    80: ("host", "medium shot, @Host in the Thinker's Study in the STUDY pose, composed and unhurried, no need to prove oneself everywhere"),
    81: ("scene", "object close-up, three blank scrolls rolled tight and set upright in a quiver-like holder with purpose, words given direction"),
    82: ("scene", "wide shot, a small river's flow guided by one dug channel around a rock, reactions given direction"),
    83: ("scene", "medium shot, a gardener's hands tending one potted plant on a windowsill while a storm rages beyond the glass, attention kept on what can be changed"),
    84: ("host", "wide shot, @Host in the JUDGE pose in the Thinker's Study, a brass tiller handle mounted on a stand beside the desk, chapter two of mastering the mind"),
    85: ("scene", "wide shot, a calm man sitting perfectly still in a busy city square at dusk, pigeons unstartled around him, outward calm"),
    86: ("scene", "medium shot, the same man seated at home while dozens of tiny bells ring themselves in the air around his head, the inner noise recognised"),
    87: ("scene", "medium shot, a man walking out of a lit debate-room door into a dark quiet corridor, leaving the argument"),
    88: ("scene", "medium shot, the man in his armchair as the debate re-forms itself in smoke above him, two arguing silhouettes restarting inside the mind"),
    89: ("scene", "wide shot, the man walking home at night while a replaying shadow-speech trails behind him still arguing, the argument following him home"),
    90: ("scene", "close-up, the man at his table at night, an unwritten reply hovering as a blank page in the dark above him, what he never answered"),
    91: ("scene", "object close-up, the blank page folding itself into a paper dart aimed at an empty doorway, how he could have proved the other wrong"),
    92: ("scene", "split-frame, left the man's body walking through his front door, right his glowing attention-thread still knotted around the office chair he left, the mind stuck behind"),
    93: ("host", "medium shot, @Host in the Thinker's Study in the STUDY pose, calm instruction, see your thoughts but do not chase each one"),
    94: ("scene", "object close-up, an old book open at blank pages beside a small meditation lamp and a pair of reading spectacles, a lesson on the trained mind"),
    95: ("scene", "wide shot, an empty lecture hall with one lit lamp on the lectern, faint red threads of sound converging into the lamp, concentration gathered"),
    96: ("scene", "editorial metaphor, scattered iron filings drawn into one ordered straight line beneath a lamp-magnet, the mind's power centred not scattered"),
    97: ("scene", "medium shot, the ordered line of filings lying like a clear path across a modern work desk, the lesson tied to daily life"),
    98: ("scene", "close-up, a man's face turned toward a thorn-shaped comment stuck in his shoulder while his work dims in front of him, attention snagged on a remark"),
    99: ("scene", "medium shot, two small silhouettes boxing inside the dome of a desk lamp's light over an unsigned decision sheet, an old argument looping at decision time"),
    100: ("scene", "wide shot, a man on a lit path pulled backward by several grey threads attached to onlookers' mouths, opinions stealing attention from the goal"),
    101: ("host", "medium shot, @Host in the Thinker's Study in the STILL pose, calm and direct, outward silence alone is not enough"),
    102: ("scene", "close-up, a hand gathering loose red threads back onto one spool on a dark desk, the attention brought home"),
    103: ("scene", "object close-up, an old photograph lying face-down on a table while a hand turns the lamp away from it, an old memory not relived"),
    104: ("scene", "close-up, a boiling kettle with its whistle held down by one steady hand, steam contained, anger not instantly acted on"),
    105: ("scene", "medium shot, a wall shadow shaped like a burglar while the true cause is only a hanging coat, unchecked worry mistaken for truth"),
    106: ("scene", "close-up, a man with eyes closed before a still dark bowl of water reflecting red lamplight, looking first at what moves within"),
    107: ("scene", "object close-up, a simple worn practice mat and a small water bowl on a quiet floor, one small exercise"),
    108: ("scene", "close-up, the man's chest rising slowly under a plain shirt, one candle flame bending slightly with each breath, attention on the breath"),
    109: ("scene", "medium shot, the man's shoulders dropping and loosening under warm lamplight, silhouette softening, the body released"),
    110: ("scene", "wide shot, a night window with faint red threads of city sound drifting inward toward the man's listening ear, the surroundings heard"),
    111: ("scene", "close-up, one leaf floating across the still dark bowl as the man's gaze follows it without pursuit, a thought recognised"),
    112: ("scene", "close-up, the leaf drifting out of frame as the man's gaze returns steadily to the candle, attention returned to the present"),
    113: ("scene", "medium shot, leaves floating freely in the dark bowl while the man's hands rest quietly on his knees, thoughts not forcibly stopped"),
    114: ("scene", "editorial metaphor, a queue of floating leaves before a small closed gate with its latch held shut by a calm hand, thoughts not given command of the next action"),
    115: ("scene", "close-up, red embers glowing in a dark hearth behind a calm seated man, anger rising without seizing him"),
    116: ("scene", "close-up, a hand setting a cup down slowly on the table before answering the blank open letter beside it, a considered reply"),
    117: ("scene", "close-up, a phone glowing urgently in a slightly shaking hand in a dark room, restlessness"),
    118: ("scene", "medium shot, the phone placed face-down on the table beside a small sandglass, the hand now still, time taken before messaging"),
    119: ("scene", "medium shot, a man standing steady under a rain of small stones on an umbrella-like shield, jaw set, insult absorbed without collapse"),
    120: ("scene", "close-up, one finger choosing calmly among three levers of a dark switch panel, deciding what is fitting"),
    121: ("host", "medium shot, @Host in the Thinker's Study in the STUDY pose, hands folded, naming the practice of feeling observing then stepping"),
    122: ("scene", "wide shot, a narrow clear channel of water opening steadily between two dark banks, the gap between reaction and behaviour widening"),
    123: ("host", "medium shot, @Host in the Thinker's Study in the STILL pose, laying down one rule from today"),
    124: ("host", "wide shot, @Host in the JUDGE pose in the Thinker's Study, a tall sandglass on the desk beside him, chapter three of pausing before the reply"),
    125: ("scene", "close-up, a hand closing a snuffer lid over a glowing red paper dart in a dish, angry replies not sent at once"),
    126: ("scene", "close-up, a pen hovering above a blank approval box while another hand presses down on the signer's wrist and the pen lifts away, no quick yes under pressure"),
    127: ("scene", "close-up, a cracked bronze shield lying on the floor while a man's foot pauses mid-step over it, no decisions the instant insult lands"),
    128: ("scene", "object close-up, a wristwatch with a blank dial held still under one thumb, a few seconds of pause"),
    129: ("scene", "medium shot, a sandglass turned to its long slow side while the man waits beside it, more time taken when needed"),
    130: ("scene", "medium shot, three unlit candles set in a row before the man at his table, three questions asked of himself"),
    131: ("scene", "close-up, the first candle lit, one bent red thread leading to it from outside the frame, what influenced me just now"),
    132: ("scene", "close-up, the second candle lit beside a small door standing ajar, is a reply needed at this moment"),
    133: ("scene", "close-up, the third candle lit beside two stones, one smooth and one cracked, will the reply solve or only vent"),
    134: ("host", "medium shot, @Host in the Thinker's Study in the STUDY pose, the three candles now standing lit on the desk before him, the questions made a practice"),
    135: ("scene", "object close-up, a blank-grid weekly calendar page with one day circled by a simple drawn ring, a charkha's shadow falling across it, one silent day each week"),
    136: ("scene", "medium shot, a charkha at rest in lamplight while a faceless crowd of admirers fades at the edge of the dark, silence kept for work not for effect"),
    137: ("scene", "object close-up, a closed blank diary, an ordered stack of files and a lit lamp arranged on a tidy desk, time taken to think and organise"),
    138: ("host", "medium shot, @Host in the Thinker's Study in the STILL pose, one practical lesson drawn from the practice"),
    139: ("scene", "medium shot, a mute stone statue with a sealed mouth standing ignored as a man turns back to his own desk, silence not merely a refusal to answer"),
    140: ("scene", "wide shot, a quiet hourglass-shaped room of warm lamplight where the man re-orders his shelves and files, silence used to reorganise attention"),
    141: ("scene", "close-up, a phone screen glowing with an abstract jagged red shape as an angry message arrives, the man's knuckles white on the table"),
    142: ("scene", "object close-up, a blank reply-scroll unrolling fast off the edge of a dark table, a long reply written in hot haste"),
    143: ("scene", "object close-up, the scroll unrolling into three long cascading folds over the table edge, one line then another then another"),
    144: ("scene", "close-up, the phone placed face-down on the wooden table mid-glow as the hand withdraws, stop, put the phone down"),
    145: ("scene", "medium shot, the same phone re-read under a calmer lamp later in the quiet room, the jagged shape now small, the message reread after a pause"),
    146: ("scene", "object close-up, the long scroll cut down to one short folded card left at the centre of the table, only what needs saying kept"),
    147: ("scene", "close-up, excess folds of the blank scroll swept into a wastebasket while the single card remains, accusations and excuses removed"),
    148: ("scene", "object close-up, a clear glass lens placed squarely over the single card on the table, the purpose to make the point clear"),
    149: ("scene", "close-up, a heavy dark ink bottle stopped mid-pour by a thin glass wall, the flood of anger kept from spilling onto the other person"),
    150: ("scene", "wide shot, a conference table in cool shade with warm accent lamps, one man listening steadily while colleagues speak, criticism heard in a meeting"),
    151: ("scene", "close-up, the man nodding and placing a solid stone weight on his own side of a small scale, correct facts accepted"),
    152: ("scene", "close-up, a foggy glass weight in the scale's other pan replaced with a clear stone, wrong facts clarified"),
    153: ("scene", "medium shot, two half-raised fists settling back into two seated silhouettes under the conference lamp, disagreement kept from becoming a personal fight"),
    154: ("host", "medium shot, @Host in the JUDGE pose in the Thinker's Study, brief and controlled, fewer words clearer message restrained behaviour"),
    155: ("scene", "wide shot, a man walking deliberately slower but still steadily toward a lit doorway, never merely going slow"),
    156: ("scene", "editorial metaphor, a lamp turned up in the gap between a bright impulse-spark and the man's hand, understanding given room before the impulse"),
    157: ("host", "medium shot, @Host in the Thinker's Study in the STILL pose, setting up the line to remember before any instant reaction"),
    158: ("scene", "object close-up, a carved blank seal-stamp pressed once into dark wax on a letter, think first then answer, the mark of the practice"),
    159: ("host", "medium shot, @Host in the Thinker's Study in the STILL pose, direct address, a call to choose one's own reactions"),
    160: ("host", "wide shot, @Host in the JUDGE pose in the Thinker's Study, a brass weighing scale on the desk beside him, chapter four of asking the necessary question"),
    161: ("host", "medium shot, @Host in the Thinker's Study in the STUDY pose, grave and still, one very important thing held before the viewer"),
    162: ("scene", "medium shot, a man watching silently as a small fire starts in a wastebasket, making no move, silence that is not wisdom"),
    163: ("scene", "split-frame, left a man stepping calmly around a barking stray dog on a lane, right the same silence leaving a family gate locked on someone inside, silence saving and silence failing"),
    164: ("scene", "object close-up, the gate's iron lock growing heavier as faceless shadows walk past it unchecked, injustice left unchallenged"),
    165: ("scene", "wide shot, a painted ancient Indian assembly hall fading into view, rows of elders, dice on the floor, the remembered scene of the question"),
    166: ("scene", "object close-up, two ancient dice resting on a dark game board beside the edge of a woman's shawl on the stone floor, restraint and gravity, the stake already lost"),
    167: ("scene", "medium shot, a lone woman standing upright in the assembly, one hand raised not in anger but in question, elders silhouetted around her"),
    168: ("scene", "object close-up, the king's own carved piece lying already in the lost pile beside the dice, the right to stake questioned"),
    169: ("scene", "close-up, a tilting brass weighing scale with one pan fully empty, the woman's steady gaze upon it, on what basis the authority"),
    170: ("scene", "wide shot, the assembly as a vast ring of seated silhouettes with one small lit upright figure at the centre, more than a personal insult"),
    171: ("scene", "object close-up, three heavy objects on a stone dais, a seal, a scale and a lamp, authority justice and dharma at stake"),
    172: ("scene", "medium shot, rows of elders' faces turned downward into shadow, the empty scale unanswered before the woman's call"),
    173: ("scene", "close-up, one raised hand's shadow crossing two different lines of the floor, the important difference her question reveals"),
    174: ("scene", "medium shot, the woman's steady unflinching stance, a hot coal left untouched at her feet, not merely a reaction of feeling"),
    175: ("scene", "object close-up, the dice board split cleanly in half by one line of lamplight, the underlying contradiction of the situation laid bare"),
    176: ("host", "medium shot, @Host in the JUDGE pose in the Thinker's Study, a stern warning against silence in the face of injustice"),
    177: ("scene", "wide shot, the ancient hall's carved columns dissolving upward into modern office pillars, the example brought to today's life"),
    178: ("scene", "medium shot, a junior colleague's chair pushed back in a corridor of identical desks while others look away, mistreatment at the office"),
    179: ("scene", "medium shot, a family dinner table where one woman's chair sits at the edge, her words sinking as quiet ripples in a water glass, a voice suppressed at home"),
    180: ("scene", "close-up, a shopkeeper's hand pressed under a heavy paperweight on a blank contract at his counter, unfair terms forced in business"),
    181: ("scene", "close-up, a rope boundary on a floor stepped over again and again by the same pair of shoes, a limit violated repeatedly"),
    182: ("host", "medium shot, @Host in the Thinker's Study in the STUDY pose, explaining that silence here means the right step after reading the situation"),
    183: ("scene", "medium shot, the man stepping over the fallen rope to re-set it firmly between its posts, not endlessly enduring"),
    184: ("scene", "editorial metaphor, one small raised finger outweighing a mountain of paper speeches on a weighing scale, the right question stronger than a long speech"),
    185: ("scene", "close-up, the scale tipping fully to the single question's side, the quiet power of asking well"),
    186: ("scene", "object close-up, a loudspeaker lying unpowered and silent on a table, no need to shout every time"),
    187: ("scene", "close-up, a single clean lens held up to a fogged window pane, a clear question asked"),
    188: ("scene", "object close-up, three solid stones lined up neatly on a table's edge, the facts laid out"),
    189: ("scene", "close-up, a rope boundary laid again in one clear straight line across the floor, the limit stated"),
    190: ("scene", "medium shot, two hands joining to lift one heavy box at a doorway, help asked for when needed"),
    191: ("host", "medium shot, @Host in the Thinker's Study in the STILL pose, calm composure, learn to stay calm"),
    192: ("scene", "close-up, a shaded lamp lifted clear of its cover, light restored to the room, the voice not lost"),
    193: ("scene", "medium shot, a firm hand on the tiller of a small boat on dark water, self-control held steady"),
    194: ("scene", "wide shot, passers-by ignoring a cracked wall in the street while one man stops to measure the crack, injustice not treated as normal"),
    195: ("scene", "editorial graphic, one composed figure standing with a quiet lamp in one hand and a firm boundary-staff in the other, silence and courage no longer opposites"),
    196: ("host", "wide shot, @Host in the JUDGE pose in the Thinker's Study, a bronze shield-plate mounted on a stand by the desk, chapter five of never making silence a weakness"),
    197: ("scene", "medium shot, a man absorbing one sandbag blow after another as the bags pile around him, hollow endurance mistaking itself for silence"),
    198: ("scene", "medium shot, the man's own small lamp pushed to the floor edge of the table while other lamps fill the tabletop, one's own needs pushed back forever"),
    199: ("scene", "close-up, a calm hand held out at chest height to stop a foot crossing a doorway threshold, self-control does not mean allowing crossings"),
    200: ("scene", "object close-up, a clear brass bell struck once in a silent hall, its sound ringing true, speaking plainly where speech is needed"),
    201: ("scene", "close-up, a hand placing the decisive stone firmly on a game board, deciding where a decision is needed"),
    202: ("scene", "medium shot, a man handed box after box by the same figure until the boxes rise past his shoulder height, tasks repeatedly asked beyond his capacity"),
    203: ("scene", "close-up, tired eyes and sagging shoulders under a dim hanging bulb, the man exhausted"),
    204: ("scene", "medium shot, the man's own half-built shelf project dark and untouched in the corner of the room, his own work unfinished"),
    205: ("scene", "medium shot, the man's hand raising a small white cloth each time a new box arrives at the door, saying yes every time"),
    206: ("scene", "wide shot, the loader's shadow on the wall twice the size of the loader himself while the man shrinks beneath it, fear of the other's displeasure"),
    207: ("host", "medium shot, @Host in the Thinker's Study in the STILL pose, resolute, the habit changed from today"),
    208: ("scene", "medium shot, the man's posture straightening under the dim bulb, a level line of warm light drawn across the room, speaking in a calm voice"),
    209: ("scene", "two-shot, the two figures now seated across a small table, one explaining his need, the other listening steadily, I understand you need help"),
    210: ("scene", "close-up, the man's calm closed palm resting on the offered box, refusal without war, this time I cannot do it"),
    211: ("scene", "object close-up, one plain unadorned message-stone placed at the centre of the table, the point simply and clearly kept"),
    212: ("scene", "object close-up, extra blank scrolls endlessly appended to one small message-card at the table's edge, no compulsion to justify at length"),
    213: ("scene", "close-up, a hand signing for a loan of lamp-oil it cannot repay while the oil jar stands nearly empty, promises beyond capacity"),
    214: ("scene", "close-up, a compass needle pulled off its north by an external iron bar laid across the dial, the decision changed only to keep someone pleased"),
    215: ("scene", "medium shot, a rope boundary deliberately strung across another man's doorway as a trap while its setter dims his lamp in malice, boundaries turned into harassment"),
    216: ("scene", "medium shot, a glowing phone left deliberately unanswered on a table while a man walks away with a hidden smirk, silence used to teach a lesson"),
    217: ("scene", "wide shot, three small bridges over a dark stream being cut one after another by a single hand, silence used to break relationships"),
    218: ("host", "medium shot, @Host in the Thinker's Study in the STUDY pose, making silence a boundary rather than a game"),
    219: ("scene", "object close-up, a bundle of puppet strings released and dropped onto a dark table, not held, no game of controlling the other"),
    220: ("scene", "close-up, a man locking his working hours inside a small wooden drawer with the key in his own hand, time kept safe"),
    221: ("scene", "medium shot, a porch lantern lit only at chosen hours while a visiting silhouette waits politely at the gate, availability decided"),
    222: ("scene", "medium shot, a chair pushed back from a table where a shouting match brews, the man already walking out into the corridor, leaving an unfair conversation"),
    223: ("scene", "medium shot, the same man speaking steadily at the corridor's end to a supervisor, posture straight, one blank folder under his arm, the point stated firmly when needed"),
    224: ("scene", "wide shot, two figures standing on equal low plinths in lamplight, neither raised above the other, self-respect without belittling others"),
    225: ("scene", "close-up, one lamp held steady between two pairs of hands, dignity on both sides respected"),
    226: ("host", "medium shot, @Host in the Thinker's Study in the STILL pose, direct address, the pledge of self-respect held before the viewer"),
    227: ("scene", "object close-up, a jeweller's small scale weighing a single hour like gold under a brass lamp, respect brought into the work"),
    228: ("scene", "wide shot, one lantern lighting only one desk in a dark office while a scattered man's sparks die on every other table, energy not scattered everywhere"),
    229: ("scene", "object close-up, a long banner being quietly rolled back up before it was ever hung on the wall, plans not always announced"),
    230: ("host", "wide shot, @Host in the JUDGE pose in the Thinker's Study, a short iron bar and a smith's glove on a stand by the desk, chapter six of stronger work over more words"),
    231: ("scene", "object close-up, a blacksmith's anvil with one strong bar of iron being shaped under a single forge-light, RURAL / FARM / WORKSHOP, the work made strong"),
    232: ("scene", "medium shot, a half-grown seedling in a pot carried too early out to a lit stage of empty chairs, ideas rushed before their time"),
    233: ("scene", "medium shot, the man watering the same seedling under his lamp while the audience's chairs stay empty, continuing without waiting for praise"),
    234: ("scene", "object close-up, a small charkha and one candle beside a single blank lesson-card on a dark desk, one more useful point from the practice of silence"),
    235: ("scene", "close-up, the charkha at work in the quiet, its thread continuing steadily, silence never meaning distance from the work"),
    236: ("scene", "wide shot, shutters closing on a noisy street while inside the man returns to a lit workbench, outside noise reduced to return to the work"),
    237: ("scene", "wide shot, a silent man seated beside an unfinished wooden bridge over a dark stream, one goal-marker post planted on the far bank, silence alone never completes a goal"),
    238: ("scene", "object close-up, three blank plan-planks aligned in order on a dark route-board, the plan made"),
    239: ("scene", "close-up, a boot stepping onto the first plank of the unfinished bridge, the first step taken"),
    240: ("scene", "close-up, the man kneeling to inspect a bridge joint honestly under lamplight, the real state of the work examined"),
    241: ("scene", "split-frame, left a boy announcing a study timetable to a mirror, right the same boy's open book at night with real pages turned, announcing exam prep against daily study"),
    242: ("scene", "split-frame, left a man pitching a shop plan at a tea stall, right the same man kneeling to hear a real customer's problem at the counter, announcing a business against serving the first customer"),
    243: ("scene", "split-frame, left a man declaring change at a dinner table, right the same man alone at dawn breaking one old habit, speaking of change against working on it"),
    244: ("host", "medium shot, @Host in the Thinker's Study in the STUDY pose, warning that intention is not achievement"),
    245: ("scene", "object close-up, a single laid brick with a palace's grand shadow projected on the wall above it, a beginning mistaken for completion"),
    246: ("scene", "medium shot, a shower of paper medals falling onto an empty workbench, praise mistaken for proof of progress"),
    247: ("scene", "close-up, one honest wooden ruler laid across real finished bricks on the workbench, progress measured by the real work"),
    248: ("scene", "object close-up, an end-of-day desk with one candle and four small pebbles arranged in a row on the wood, done learned fixed and next, the daily questions answered by the work itself"),
    249: ("scene", "two-shot, two men walking a quiet path under one shared lantern, one speaking and one listening, trusted advice and accountability"),
    250: ("scene", "close-up, a finger pressed once to the lips and then turning firmly toward the workbench, one thing to remember"),
    251: ("scene", "wide shot, a scaffold of quiet wooden supports rising around a half-built structure at night, the arrangement for finishing more important than announcing the goal"),
    252: ("scene", "medium shot, a man's gaze drawn back from a neighbour's brightly lit terrace to his own loom and lamp, energy returned from comparison to the work"),
    253: ("scene", "wide shot, a steady line of small footprints climbing a dark hill with no watcher present, one's own pace and the next step, a little further every day"),
    254: ("scene", "medium shot, the man working at one bench with a tool, a closed book and a small watering can nearby, work learning and improvement given time"),
    255: ("host", "medium shot, @Host in the Thinker's Study in the STILL pose, direct address, the pledge of quiet hard work"),
    256: ("scene", "object close-up, three threads of different colours braiding into one strong rope at a dark table, the whole lesson bound into three rules"),
    257: ("host", "medium shot, @Host in the Thinker's Study in the STUDY pose, a small sandglass set before him on the desk, the first rule, pause"),
    258: ("scene", "close-up, a hot iron rod lifted from the fire and set on a cooling stone, the quick emotion given time"),
    259: ("scene", "medium shot, a man pausing at a fogged crossroads to wipe one clear pane in the air before choosing, the situation understood before answering"),
    260: ("scene", "object close-up, a closed sluice gate beneath heavy rain-clouds, emotion not instantly converted into action"),
    261: ("host", "medium shot, @Host in the Thinker's Study in the STUDY pose, a clean brass lens set before him on the desk, the second rule, observe"),
    262: ("scene", "close-up, a man leaning forward to hear a low voice across a lamp-lit table, what the other is actually saying"),
    263: ("scene", "object close-up, a knot in a rope shown close while the rope's real fray sits one foot away in shadow, the true problem located"),
    264: ("scene", "object close-up, a map-board with one province's puzzle-piece missing from its place, the incomplete information marked by absence"),
    265: ("scene", "close-up, an old cracked lens held over a new scene, distorting it, a hasty judgement from an old experience"),
    266: ("scene", "close-up, the man's ear turned toward three faint sound-threads in the dark, attention gathered to listen carefully"),
    267: ("scene", "object close-up, solid stones being separated from hollow pebbles on a dark cloth, facts recognised"),
    268: ("scene", "close-up, a fog-glass weight lifted off a small scale and replaced by a true stone, assumption not taken for fact"),
    269: ("scene", "object close-up, the chessboard and the focused lamp-beam sharing one desk beneath the Thinker statuette, strategic reading of the situation and the training of attention"),
    270: ("scene", "close-up, the lamp-beam landing squarely on the man's own working hands, the lesson brought to one's own work"),
    271: ("scene", "medium shot, a veil lifted halfway off a table of dark objects, first understanding what actually stands before you"),
    272: ("scene", "close-up, the desk lamp swung deliberately onto exactly one object among many, attention placed where it belongs"),
    273: ("host", "medium shot, @Host in the Thinker's Study in the STUDY pose, one carved step-stone set before him on the desk, the third rule, choose"),
    274: ("scene", "close-up, a hand hovering over three carved step-stones and then pressing down firmly on one, the next step chosen with thought"),
    275: ("scene", "object close-up, a clear brass bell struck once in a silent hall, speak when speaking is needed"),
    276: ("scene", "close-up, a man placing his own misplaced stone back on the board with a slight nod, admit the mistake"),
    277: ("scene", "close-up, a rope boundary re-strung taut between two posts, the crossed limit stated clearly"),
    278: ("scene", "medium shot, a chair pushed back from a circle of arguing shadows in a dim room, stepping out of a pointless argument"),
    279: ("scene", "medium shot, the man's gaze re-anchored to his loom and lamp after drifting, attention returned to the work"),
    280: ("host", "medium shot, @Host in the JUDGE pose in the Thinker's Study, raising one still hand toward justice, speaking out properly against wrongdoing"),
    281: ("scene", "object close-up, a coiled steel spring at rest on a dark table, tension held, pausing is not weakness"),
    282: ("scene", "object close-up, a lighthouse lens rotating slowly in the dark, watchful, observing is not inaction"),
    283: ("scene", "wide shot, a dam's gate opened at the right hour releasing one clear flow of water, speaking at the right time is not defeat"),
    284: ("scene", "object close-up, a sandglass, a lens and a step-stone set together on the man's daily table, the three rules remembered in every conversation"),
    285: ("scene", "object close-up, three engraved blank medallions on dark cloth, a pause-glass, an eye-stone and a step-stone, pause observe choose"),
    286: ("host", "medium shot, @Host in the Thinker's Study in the STUDY pose, composed, no need to control others"),
    287: ("scene", "close-up, three threads, reaction attention and words, being braided steadily between two calm hands, used with more wisdom"),
    288: ("scene", "close-up, the braided rope holding a real weight on an iron hook, the practice strengthening the behaviour"),
    289: ("scene", "medium shot, a man at his doorway listening calmly to a critic's dark silhouette while a small plant on the windowsill turns toward the lamplight, one small change begun"),
    290: ("scene", "close-up, a hand pressed flat on the table holding back a rising shout as one deep breath is drawn, the pause practised before the reaction"),
    291: ("scene", "close-up, a fogged pane wiped once with a cloth to reveal the true shape of the disturbance outside, the problem seen clearly"),
    292: ("scene", "split-frame, left a man stating a rope boundary at a doorway, right the same man walking past a baited argument untouched, stating the limit and saving the energy"),
    293: ("scene", "wide shot, a man's progress shown as stacked finished bricks beside a tall pile of discarded speech-scrolls, progress measured by real effort not words"),
    294: ("scene", "close-up, one honest ruler laid across the real bricks only, the scroll pile ignored to the side"),
    295: ("scene", "object close-up, the chessboard's final quiet position with one hand withdrawn from the frame, the strategic lesson remembered"),
    296: ("scene", "close-up, the lamp-beam and a trained steady eye aligned in one line, the mind and attention trained"),
    297: ("scene", "object close-up, the charkha paused beside one candle marking a quiet hour, time taken to think"),
    298: ("scene", "medium shot, one raised open hand remembered as a painted seal on the assembly wall, the right question before injustice, courage"),
    299: ("scene", "wide shot, four different objects, a board, a lamp, a charkha and a scale, standing together on one long dark table, four examples sharing one invitation to think"),
    300: ("scene", "medium shot, a clean workshop bench where worn old tools are set aside and chosen ones laid out, the response chosen with understanding and wisdom"),
    301: ("scene", "close-up, a sleepwalker's reaching hand caught gently mid-grab by the waking man's other hand, the reaction not left to habit"),
    302: ("scene", "close-up, one deliberate tool lifted from the rack and held steady, the response chosen with understanding and discernment"),
    303: ("scene", "wide shot, a silent man on a roadside expecting applause while faceless silhouettes pass without stopping, silence will not make everyone respect you"),
    304: ("scene", "object close-up, a sandcastle wall rising on a shoreline as the tide approaches, silence built on the hope that others will change"),
    305: ("scene", "medium shot, the silence now purposeful, a man choosing words like measured medicine from a wooden box, the response selected with more wisdom"),
    306: ("host", "medium shot, @Host in the Thinker's Study in the STILL pose, steady and final, this is the real change"),
    307: ("host", "medium shot, @Host in the Thinker's Study in the STILL pose, direct address, the call to commit to the change"),
    308: ("scene", "medium shot, the man's resolute silhouette standing in the lamplight of the quiet study doorway, the commitment taken up"),
    309: ("host", "medium shot, @Host in the Thinker's Study in the STUDY pose, hands folded, the whole video condensed into one line"),
    310: ("scene", "wide shot, a still lake at night holding the dark hills' reflection, silence where silence is right"),
    311: ("scene", "wide shot, one lighthouse stroke sweeping across dark water at the needed moment, speaking when the voice is needed"),
    312: ("scene", "close-up, a man pressing his own seal onto each day's small decision-card laid in a wooden tray, responsibility for one's own decisions in every situation"),
    313: ("host", "medium shot, @Host in the Thinker's Study in the STILL pose, the true strength of silence held in his composure"),
    314: ("scene", "close-up, the three braided threads resting in the man's open palm and glowing softly, how he influences others and how he chooses his response attention and words"),
    315: ("host", "medium shot, @Host seated at the Thinker's Study desk in the STUDY pose, oxblood mantle over his shoulders, signing off as A. K. Chandradipti of Talk2Society"),
    316: ("scene", "wide shot, the Thinker's Study shelves with books, globe, bust and Thinker statuette in warm lamplight, the channel's world of understanding people power and society"),
    317: ("scene", "wide shot, a dark city at dawn seen from a high window, faceless crowds below, one game-board piece on the sill and a society's rooftops beyond, understand people see the game of power understand society"),
    318: ("host", "wide shot, @Host in the Thinker's Study in the STILL pose, the heavy door behind him now fully open onto first light, build your path in reality"),
}


def ts2sec(s: str) -> float:
    h, m, rest = s.strip().split(":")
    sec, ms = rest.split(",")
    return int(h) * 3600 + int(m) * 60 + int(sec) + int(ms) / 1000


def parse_srt(path: Path):
    text = path.read_text(encoding="utf-8")
    cues = []
    for b in re.split(r"\n\s*\n", text.strip()):
        lines = b.strip().split("\n")
        if len(lines) >= 2 and "-->" in lines[1]:
            n = int(lines[0].strip())
            start_str = lines[1].split("-->")[0].strip()
            cues.append({"n": n, "start_str": start_str, "start": ts2sec(start_str)})
    cnt = defaultdict(int)
    for c in cues:
        h, m, s_ms = c["start_str"].split(":")
        s, ms = s_ms.split(",")
        base = f"{int(h) * 60 + int(m)}-{int(s):02d}"
        cnt[base] += 1
        c["label"] = base if cnt[base] == 1 else f"{base}-{ms}"
    return cues, cnt


def main():
    cues, cnt = parse_srt(ROOT / "tv9.srt")
    n_cues = len(cues)
    assert n_cues == 318, f"expected 318 cues, got {n_cues}"
    assert set(SCENES) == set(range(1, n_cues + 1)), "SCENES must cover cues 1..318 exactly"

    collisions = {b: [f"#{c['label']}" for c in cues if c["label"].split('-')[0] + '-' + c['label'].split('-')[1] == b]
                  for b, k in cnt.items() if k > 1}

    out = []
    out.append("#Host")
    out.append(HOST_PLATE)
    out.append("")
    host_cues = []
    for c in cues:
        kind, desc = SCENES[c["n"]]
        if kind == "host":
            host_cues.append(c["n"])
        prompt = f"{desc}, {STYLE}"
        assert prompt.endswith("16:9 horizontal composition")
        out.append(f"#{c['label']}")
        out.append(prompt)
        out.append("")
    pack = ROOT / "prompts" / "TV9_Image_Prompts_full.txt"
    pack.write_text("\n".join(out).rstrip() + "\n", encoding="utf-8")

    (ROOT / "prompts" / "style_phrase_v9.txt").write_text(STYLE + "\n", encoding="utf-8")
    (ROOT / "prompts" / "host_prompt_v9.txt").write_text(HOST_PLATE + "\n", encoding="utf-8")

    manifest = {
        "episode": "tv9",
        "srt": "tv9.srt",
        "srt_reference": "tv9_srt_reference.txt",
        "vo_master": "audio/tv9_master.mp3",
        "vo_parts_github": ["TV9 P1.mp3", "TV9 P2.mp3", "TV9 P3.mp3"],
        "vo_part_durations_sec": [508.68, 529.48, 246.52],
        "vo_total_sec": 1284.67,
        "cue_count": n_cues,
        "scene_count": n_cues,
        "host_plate": "prompts/host_prompt_v9.txt",
        "images_dir": "images_tv9/",
        "label_range": [f"#{cues[0]['label']}", f"#{cues[-1]['label']}"],
        "collisions": collisions,
        "style_version": "V7",
        "host_cues": host_cues,
        "labels": [f"#{c['label']}" for c in cues],
    }
    (ROOT / "prompts" / "manifest_tv9.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"cues={n_cues} scenes={n_cues} host_cues={len(host_cues)}")
    print(f"label_range=#{cues[0]['label']}..#{cues[-1]['label']}")
    print(f"collisions={collisions}")
    print(f"pack={pack} bytes={pack.stat().st_size}")
    # sanity: locked phrase byte-identical across scenes
    body = pack.read_text(encoding="utf-8")
    assert body.count(STYLE) == n_cues + 0, "style phrase mismatch"
    print("locked style phrase byte-identical on all scenes: OK")


if __name__ == "__main__":
    main()
