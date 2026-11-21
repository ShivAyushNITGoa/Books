#!/usr/bin/env python3
"""Rebuild the cue-aligned VO and narrated MP4 without re-encoding the picture.
Run from any directory. Requires FFmpeg (FFMPEG_PATH, PATH or bundle install).
Source voices and explicit, silence-based trim boundaries are versioned.
"""
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile

PROJECT = Path(__file__).resolve().parents[1]
REPO = PROJECT.parents[2]
FF = os.environ.get('FFMPEG_PATH') or shutil.which('ffmpeg')
if not FF:
    candidates = [REPO / 'psychology-of-human-attraction/node_modules/ffmpeg-static/ffmpeg',
                  REPO / 'Animation/node_modules/ffmpeg-static/ffmpeg']
    FF = next((str(p) for p in candidates if p.is_file()), None)
if not FF:
    raise SystemExit('Install FFmpeg or set FFMPEG_PATH')


def run(*args):
    p = subprocess.run([FF, '-hide_banner', *map(str, args)], capture_output=True, text=True)
    if p.returncode:
        raise RuntimeError(p.stderr)
    return p


def digest(p):
    with p.open('rb') as f:
        return hashlib.file_digest(f, 'sha256').hexdigest()


def video_hash(p):
    return run('-v', 'error', '-i', p, '-map', '0:v:0', '-c:v', 'copy', '-f', 'hash', '-hash', 'sha256', '-').stdout.strip()


def main():
    delivery = PROJECT / 'delivery'
    source_video = delivery / 'alexandria-captioned-720p.mp4'
    voice = delivery / 'alexandria-voiceover.flac'
    video = delivery / 'alexandria-narrated-720p.mp4'
    source_dir = PROJECT / 'assets/narration'
    mapping = json.loads((source_dir / 'cue-map.json').read_text())
    if [c['cue'] for c in mapping['cues']] != list(range(1, 16)):
        raise ValueError('Require all 15 cues in chronological order')
    cue_results = []
    with tempfile.TemporaryDirectory(prefix='alexandria-vo-') as tmp:
        tmp = Path(tmp)
        clips = []
        for c in mapping['cues']:
            duration = c['trimEnd'] - c['trimStart']
            rate = max(1.0, duration / 3.82)
            if not 0 < duration < 6 or rate > 1.5:
                raise ValueError('Unexpected cue trim or excessive speed adjustment')
            clip = tmp / ('cue-%02d.wav' % c['cue'])
            # Each output is exactly four seconds at 48 kHz mono. Time stretch
            # changes tempo, not pitch; leave 80 ms pre-roll and >=100 ms tail.
            filters = (f"atrim=start={c['trimStart']}:end={c['trimEnd']},asetpts=PTS-STARTPTS,"
                       f"atempo={rate:.9f},aresample=48000,adelay=80,apad,atrim=duration=4")
            run('-y', '-v', 'error', '-i', source_dir / c['source'], '-af', filters,
                '-ac', '1', '-ar', '48000', '-c:a', 'pcm_s24le', clip)
            clips.append(clip)
            cue_results.append({**c, 'timelineStart': (c['cue'] - 1) * 4,
                                'speechOnsetSeconds': (c['cue'] - 1) * 4 + .08,
                                'tempoMultiplier': round(rate, 6),
                                'sourceSha256': digest(source_dir / c['source'])})
        concat = tmp / 'clips.txt'
        concat.write_text(''.join(f"file '{p.as_posix()}'\n" for p in clips))
        # Two-pass EBU loudness normalization across the entire narration.
        analysis = run(
            '-f', 'concat', '-safe', '0', '-i', concat,
            '-af', 'loudnorm=I=-16:TP=-1.5:LRA=7:print_format=json', '-f', 'null', '-')
        loudness = json.loads(re.findall(r'\{[^{}]*"input_i"[^{}]*\}', analysis.stderr, re.S)[-1])
        norm = ('loudnorm=I=-16:TP=-1.5:LRA=7:linear=true:'
                f"measured_I={loudness['input_i']}:measured_TP={loudness['input_tp']}:"
                f"measured_LRA={loudness['input_lra']}:measured_thresh={loudness['input_thresh']}:"
                f"offset={loudness['target_offset']}")
        staged_voice = tmp / voice.name
        run('-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', concat,
            '-af', norm, '-ar', '48000', '-ac', '1', '-c:a', 'flac', staged_voice)
        os.replace(staged_voice, voice)
        staged_video = delivery / '.alexandria-narrated.part.mp4'
        run('-y', '-v', 'error', '-i', source_video, '-i', voice,
            '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac',
            '-b:a', '160k', '-ar', '48000', '-t', '60', '-movflags', '+faststart',
            '-metadata', 'title=Alexandria — Beneath the Mediterranean (Narrated)', staged_video)
        # Full decode with fatal decoder errors; inspect frame count and stream layout.
        decoded = run('-v', 'error', '-xerror', '-i', staged_video, '-map', '0:v:0',
                      '-map', '0:a:0', '-progress', 'pipe:1', '-f', 'null', '-')
        if re.findall(r'^frame=(\d+)$', decoded.stdout, re.M)[-1] != '1440':
            raise RuntimeError('Narrated export must decode all 1440 frames')
        if video_hash(source_video) != video_hash(staged_video):
            raise RuntimeError('Narration pass changed the encoded picture')
        measure = run('-i', staged_video, '-vn', '-af',
                      'loudnorm=I=-16:TP=-1.5:LRA=7:print_format=json', '-f', 'null', '-')
        measured = json.loads(re.findall(r'\{[^{}]*"input_i"[^{}]*\}', measure.stderr, re.S)[-1])
        if float(measured['input_tp']) > -.5 or abs(float(measured['input_i']) + 16) > 1:
            raise RuntimeError('Narrated delivery failed loudness/peak bounds')
        os.replace(staged_video, video)
    manifest = {'video': video.name, 'videoSha256': digest(video), 'bytes': video.stat().st_size,
                'voiceover': voice.name, 'voiceoverSha256': digest(voice),
                'sourceVideoSha256': digest(source_video), 'durationSeconds': 60,
                'frames': 1440, 'width': 720, 'height': 1280, 'fps': 24,
                'audio': {'codec': 'AAC', 'sampleRate': 48000, 'channels': 1,
                          'measuredIntegratedLufs': float(measured['input_i']),
                          'measuredTruePeakDbtp': float(measured['input_tp'])},
                'pictureBitstreamUnchanged': True, 'fullFileDecode': 'passed',
                'narration': mapping['voice'], 'pronunciation': '1992 is spoken as nineteen ninety-two.',
                'synchronization': mapping['timing'], 'cues': cue_results}
    (delivery / 'narration-production.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(json.dumps({k: v for k, v in manifest.items() if k != 'cues'}, indent=2))


if __name__ == '__main__':
    main()
