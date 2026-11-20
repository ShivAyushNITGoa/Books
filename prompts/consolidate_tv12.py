"""Consolidate saved batch records without inventing missing source prompts."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
P = ROOT / 'prompts'
records = {}
for batch in sorted(P.glob('tv12_batch[0-9]*.json'), key=lambda p: int(p.stem.removeprefix('tv12_batch'))):
    for scene in json.loads(batch.read_text())['scenes']:
        if scene.get('status') == 'blocked_by_moderation':
            continue
        records[scene['label']] = (scene, batch.name)

inventory = json.loads((P / 'tv12_image_verification.json').read_text())['images']
assert len(inventory) == 302
scenes = []
for cue, item in enumerate(inventory, 1):
    image = ROOT / item['image']
    assert image.is_file(), image
    assert hashlib.sha256(image.read_bytes()).hexdigest() == item['sha256'], image
    saved, source = records.get(item['label'], ({}, None))
    if saved:
        assert saved['cue'] == cue, (cue, saved)
    scenes.append(dict(cue=cue, **item,
        prompt=saved.get('generation_prompt', saved.get('prompt')),
        prompt_source=source,
        prompt_status='archived' if saved else 'not_archived',
        references=saved.get('references', []) if saved else None))
missing = [s['cue'] for s in scenes if s['prompt'] is None]
manifest = dict(episode='tv12', style_version='V7', cue_count=302, scene_count=302,
    label_range=['#0-00', '#20-30'], images_dir='images_tv12/',
    images_complete=True, prompt_archive_complete=not missing,
    archived_prompt_count=302-len(missing), missing_prompt_cues=missing,
    host_plate='refs/Host.jpg', host_plate_exists=(ROOT/'refs/Host.jpg').exists(),
    host_plate_note='Canonical host plate absent. Later host images used images_tv12/1-13.jpg for continuity, not an authenticated likeness reference.',
    scenes=scenes)
(P/'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n')
text = ['TALK2SOCIETY TV12 — CONSOLIDATED SAVED PROMPT ARCHIVE (V7)',
        'Image inventory: 302/302. Prompt archive: '+str(302-len(missing))+'/302.',
        'PARTIAL SOURCE ARCHIVE: cues 1–49 have images but no saved prompt records.',
        'Missing prompts are explicitly marked below; they have not been reconstructed.',
        'Canonical refs/Host.jpg is absent. See manifest.json for references and provenance.']
for scene in scenes:
    text += ['', f"{scene['label']} [cue {scene['cue']}]", scene['prompt'] or '[SOURCE PROMPT NOT ARCHIVED — image exists]']
(P/'tv12_image_prompts.txt').write_text('\n'.join(text)+'\n')
print(f'Images verified: {len(scenes)}; archived prompts: {302-len(missing)}; missing prompts: {len(missing)}')
