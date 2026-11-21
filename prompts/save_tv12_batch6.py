"""Preserve user-supplied TV12 cues 50–59, verbatim scene concepts + locked V7 suffix.
This is a partial prompt archive, not the complete 302-cue pack.
"""
import json
from pathlib import Path
STYLE = "painterly Indian editorial illustration, semi-realistic painted style close to photographic likeness, not cartoon and not photorealistic, visible brushstrokes and canvas texture, rich oxblood red and deep crimson accents, near-black and dark umber shadows, warm amber and aged brass practical light used sparingly, dark red-tinted low-key atmosphere, one controlled light source, soft controlled tonal modelling with deep shadow shapes, realistic human proportions and natural skin tones, restrained expressive faces, grounded Indian setting matching the scene's economic and location tier, clear readable silhouettes, mature graphic-novel painting sensibility, generous negative space, no text, no lettering, no numbers, no captions, no logos, no watermark, no cartoon, no caricature, no glossy 3D, no anime, no neon colours, no cinematic grading, no lens flare, no heavy bokeh, no rim light, 16:9 horizontal composition"
M = "the young Indian man (late twenties, short black hair, plain slate-blue shirt)"
W = "the young Indian woman (mid-twenties, dark hair loose, plain teal-grey kurta)"
rows = [
('3-25', f'medium shot, {M} deflated after no message, head in his hands at a bus-stop bench'),
('3-30', f'medium shot, {M} watching through night café glass as {W} chats with another person, insecurity rising'),
('3-36', f"close-up, {M}'s face lifting with sudden hope at a single small gesture of attention from {W}"),
('3-42', "medium shot, @Host, A. K. Chandradipti at the Thinker's Study, both hands opening, inviting a real question, brass lamp"),
('3-45', f"wide shot, {W} approaching {M}'s table by her own choice, free will, warm doorway light"),
('3-49', 'conceptual, a marionette with cut strings lying beside a free-standing clay figure, control versus freedom'),
('3-53', 'conceptual, two marionettes tangled on one pair of strings under a heavy unseen hand'),
('3-58', f'medium shot, {M} journaling by lamplight, attention finally on his own hand and his own behaviour'),
('4-05', "medium shot, @Host, A. K. Chandradipti at the Thinker's Study holding up one finger, rule-one lockup beat, commanding calm"),
('4-06', "medium shot, @Host, A. K. Chandradipti at the Thinker's Study, palm pressed to the desk, forbidding one-sided effort, brass lamp"),
]
scenes = [dict(cue=i, label='#'+label, image=f'images_tv12/{label}.jpg', prompt=concept+', '+STYLE) for i,(label,concept) in enumerate(rows,50)]
Path('prompts/tv12_batch6.json').write_text(json.dumps({'episode':'tv12','style_version':'V7','partial':True,'scenes':scenes},ensure_ascii=False,indent=2)+'\n')
Path('prompts/tv12_batch6.txt').write_text('\n\n'.join(s['label']+'\n'+s['prompt'] for s in scenes)+'\n')
