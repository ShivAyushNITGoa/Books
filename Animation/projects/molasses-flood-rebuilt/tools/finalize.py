#!/usr/bin/env python3
"""Mux and validate the actual rebuilt delivery, keeping large evidence ignored.

A completed picture alone is insufficient: every video/audio frame is decoded,
source hashes are checked, browser/test reports are required, and one image per
narration beat is extracted from the final compressed file for visual review.
"""
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess

PROJECT = Path(__file__).resolve().parents[1]
ANIMATION = PROJECT.parents[1]
OUT = ANIMATION / 'output/molasses-flood-rebuilt'
DELIVERY = PROJECT / 'delivery'
ENCODER = os.environ.get('FFMPEG_PATH') or shutil.which('ffmpeg') or str(
    ANIMATION / 'node_modules/ffmpeg-static/ffmpeg')


def run(arguments, check=True):
    process = subprocess.run([ENCODER, '-hide_banner', *map(str, arguments)], capture_output=True)
    if check and process.returncode:
        raise RuntimeError(process.stderr.decode(errors='replace'))
    return process


def sha(file):
    digest = hashlib.sha256()
    with Path(file).open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def load(file):
    return json.loads(Path(file).read_text())


def main():
    narration = load(PROJECT / 'narration.json')
    beats = load(PROJECT / 'direction/beats.json')
    video = OUT / 'molasses-picture.mp4'
    audio = OUT / 'soundtrack.flac'
    final = DELIVERY / 'molasses-flood-rebuilt-narrated-720p.mp4'
    assert video.is_file() and audio.is_file(), 'Render picture and mix audio before finalizing'
    source = load(OUT / 'render-source.json')
    for name, expected in source.items():
        assert sha(PROJECT / name) == expected, f'Source changed during export: {name}'
    browser = load(OUT / 'browser-check.json')
    assert not browser['issues'] and not browser['errors'], 'Browser checks failed'
    assert len(browser['samples']) >= 140
    assert len(browser['seekChecks']) == 12
    tests = (OUT / 'project-tests.log').read_text()
    repository = (OUT / 'repository-tests.log').read_text()
    lock = (OUT / 'lock.log').read_text()
    assert '# fail 0' in tests and '# pass ' in tests
    assert '# fail 0' in repository and '# pass 52' in repository
    assert 'LOCK OK' in lock
    telemetry = load(OUT / 'molasses-picture.camera.json')
    assert len(telemetry) == narration['frames']
    assert all(frame['continuous'] and frame['cameraSpeed'] > .035 for frame in telemetry)
    assert all(frame['railway']['trainFront'] < frame['railway']['gapStart'] for frame in telemetry)
    DELIVERY.mkdir(parents=True, exist_ok=True)
    run(['-y', '-v', 'warning', '-i', video, '-i', audio,
         '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac',
         '-b:a', '160k', '-ar', '48000', '-ac', '1', '-t', narration['duration'],
         '-movflags', '+faststart', '-metadata', f"title={narration['title']}",
         '-metadata', 'comment=Connected-world stylized reconstruction; not CFD or surveyed geography', final])
    probe = run(['-i', final], check=False).stderr.decode(errors='replace')
    (OUT / 'final-streams.txt').write_text(probe)
    for required in ['720x1280', '24 fps', 'Video: h264', 'Audio: aac', '48000 Hz']:
        assert required in probe, probe
    decoded = run(['-v', 'error', '-xerror', '-err_detect', 'explode', '-i', final,
                   '-map', '0:v:0', '-map', '0:a:0', '-fps_mode', 'passthrough',
                   '-progress', 'pipe:1', '-nostats', '-f', 'null', '-'])
    progress = decoded.stdout.decode()
    (OUT / 'full-decode.log').write_text(progress)
    frames = int(re.findall(r'^frame=(\d+)$', progress, re.M)[-1])
    duplicates = int(re.findall(r'^dup_frames=(\d+)$', progress, re.M)[-1])
    dropped = int(re.findall(r'^drop_frames=(\d+)$', progress, re.M)[-1])
    assert frames == narration['frames'], frames
    assert duplicates == dropped == 0
    measured = run(['-i', final, '-vn', '-af',
        'loudnorm=I=-16:TP=-1.5:LRA=7:print_format=json', '-f', 'null', '-']).stderr.decode()
    loudness = json.loads(measured[measured.rfind('{'):measured.rfind('}') + 1])
    assert -17.5 < float(loudness['input_i']) < -14.5, loudness
    assert float(loudness['input_tp']) < -1, loudness
    (OUT / 'final-loudness.json').write_text(json.dumps(loudness, indent=2) + '\n')
    run(['-y', '-v', 'error', '-ss', '140', '-i', final, '-frames:v', '1', '-q:v', '2', DELIVERY / 'poster.jpg'])
    review = OUT / 'decoded-review'
    review.mkdir(exist_ok=True)
    indices = [round(min(b['end'] - .05, b['start'] + min(2, (b['end'] - b['start']) * .7)) * 24) for b in beats]
    select = '+'.join(f'eq(n,{index})' for index in indices)
    run(['-y', '-v', 'error', '-i', final, '-vf', f"select='{select}'",
         '-fps_mode', 'passthrough', '-frames:v', len(beats), review / '%02d.png'])
    report = {
        'title': narration['title'], 'file': final.name,
        'bytes': final.stat().st_size, 'sha256': sha(final),
        'video': {'codec': 'H.264', 'output': [720, 1280], 'rendered3dViewport': [540, 960],
                  'overlayResolution': [720, 1280], 'fps': 24, 'frames': frames,
                  'duration': narration['duration'], 'pixelFormat': 'yuv420p', 'colorspace': 'BT.709'},
        'audio': {'codec': 'AAC', 'sampleRate': 48000, 'channels': 1,
                  'integratedLUFS': float(loudness['input_i']), 'truePeakDBTP': float(loudness['input_tp']),
                  'narrationTakes': 8, 'foleyEvents': 10, 'music': False,
                  'sharedVoiceover': '../molasses-flood/delivery/voiceover.flac'},
        'captions': {'count': len(narration['captions']), 'burnedIn': True, 'sidecar': 'captions.srt',
                     'timing': 'Measured speech activity plus word weights; not forced alignment'},
        'checks': {'fullDecode': 'PASS', 'decodedFrames': frames, 'duplicates': duplicates,
                   'dropped': dropped, 'projectTests': int(re.findall(r'# pass (\d+)', tests)[-1]),
                   'repositoryTests': 52, 'strictOriginalLock': lock.strip(),
                   'browserSamples': len(browser['samples']), 'seekChecks': len(browser['seekChecks']),
                   'browserWarnings': browser['warnings'], 'reviewFrames': len(list(review.glob('*.png')))},
        'camera': load(OUT / 'molasses-picture.audit.json'),
        'sourceSha256': source,
        'limits': ['Authored height-field fluid, not a calibrated fluid/structural simulation',
                   'Connected compositional geography, not an exact historical survey',
                   'Explicit rewind and time-compressed 1925/legal and remembrance staging',
                   'Procedural stylized anatomy; tests do not certify absence of every mesh intersection',
                   'No complete manual audio listening or phonetic lip-sync claim',
                   'Technical checks are not user aesthetic approval'],
    }
    (DELIVERY / 'QA.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
