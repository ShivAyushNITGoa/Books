#!/usr/bin/env python3
"""Reproducible selected-voice assembly, measurements and pause-aware captions.

Caption timing follows measured speech activity and word weights, not forced
phonetic alignment. No words are rewritten and no take is sped up to fit a shot.
"""
import array
import hashlib
import json
import math
import os
from pathlib import Path
import re
import shutil
import subprocess

PROJECT = Path(__file__).resolve().parents[1]
REPO = PROJECT.parents[2]
ENCODER = os.environ.get('FFMPEG_PATH') or shutil.which('ffmpeg') or next(
    (str(p) for p in [REPO / 'Animation/node_modules/ffmpeg-static/ffmpeg',
                     REPO / 'psychology-of-human-attraction/node_modules/ffmpeg-static/ffmpeg']
     if p.is_file()), 'ffmpeg')
RATE = 48000
FPS = 24


def run(*args, binary=False):
    result = subprocess.run([ENCODER, '-hide_banner', '-v', 'error', *map(str, args)],
                            capture_output=True)
    if result.returncode:
        raise RuntimeError(result.stderr.decode(errors='replace'))
    return result.stdout if binary else result.stdout.decode()


def timestamp(seconds):
    milliseconds = round(seconds * 1000)
    hours, milliseconds = divmod(milliseconds, 3600000)
    minutes, milliseconds = divmod(milliseconds, 60000)
    seconds, milliseconds = divmod(milliseconds, 1000)
    return f'{hours:02}:{minutes:02}:{seconds:02},{milliseconds:03}'


def speech_bins(pcm):
    samples = array.array('h', pcm)
    window = RATE // 50
    values = []
    for i in range(0, len(samples), window):
        part = samples[i:i + window]
        values.append(math.sqrt(sum(v * v for v in part) / max(1, len(part))) / 32768)
    threshold = max(0.008, max(values) * 0.025)
    active = [i for i, value in enumerate(values) if value > threshold]
    if not active:
        raise ValueError('Selected narration take is silent')
    # Include brief intra-word/phrase gaps, but not long pauses between clauses.
    expanded = sorted(set(j for i in active for j in range(max(0, i - 2), min(len(values), i + 3))))
    return values, expanded


def caption_groups(text):
    words = text.split()
    result = []
    current = []
    for word in words:
        current.append(word)
        punctuation = bool(re.search(r'[.!?…]$', word))
        if len(current) >= 8 or punctuation and len(current) >= 3:
            result.append(' '.join(current))
            current = []
    if current:
        if result and len(current) < 3:
            result[-1] += ' ' + ' '.join(current)
        else:
            result.append(' '.join(current))
    return result


def main():
    takes = json.loads((PROJECT / 'audio/takes.json').read_text())
    body = (PROJECT / 'script.txt').read_text().split('\n\n', 1)[1]
    assert ' '.join(body.split()) == ' '.join(' '.join(t['text'].split()) for t in takes)
    output = REPO / 'Animation/output/molasses-flood'
    output.mkdir(parents=True, exist_ok=True)
    silence = bytes(round(0.30 * RATE) * 2)
    data = bytearray(bytes(round(0.35 * RATE) * 2))
    chapters, captions, amplitudes = [], [], []
    for take in takes:
        path = PROJECT / 'audio' / take['file']
        pcm = run('-i', path, '-ac', 1, '-ar', RATE, '-f', 's16le', '-', binary=True)
        duration = len(pcm) / (RATE * 2)
        start = len(data) / (RATE * 2)
        rms, bins = speech_bins(pcm)
        groups = caption_groups(take['text'])
        weights = [len(re.sub(r'[^a-zA-Z0-9]', '', group)) + len(group.split()) * 2 for group in groups]
        total = sum(weights)
        consumed = 0
        for group, weight in zip(groups, weights):
            a = bins[min(len(bins) - 1, round(consumed / total * (len(bins) - 1)))] / 50
            consumed += weight
            b = (bins[min(len(bins) - 1, round(consumed / total * (len(bins) - 1)))] + 1) / 50
            captions.append({'start': round(start + a, 6), 'end': round(start + b, 6), 'text': group})
        chapters.append({
            'index': take['index'], 'start': round(start, 6),
            'speechStart': round(start + bins[0] / 50, 6),
            'speechEnd': round(start + (bins[-1] + 1) / 50, 6),
            'end': round(start + duration + 0.30, 6),
            'duration': duration, 'text': take['text'], 'source': 'audio/' + take['file'],
            'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
        })
        amplitudes.append({'start': start, 'step': 0.02, 'rms': [round(v, 4) for v in rms]})
        data.extend(pcm)
        data.extend(silence)
    for cue, following in zip(captions, captions[1:]):
        cue['end'] = min(cue['end'], following['start'])
    frames = math.ceil((len(data) / (RATE * 2) + 0.7) * FPS)
    duration = frames / FPS
    data.extend(bytes(round(duration * RATE) * 2 - len(data)))
    raw = output / 'selected-voice.pcm'
    raw.write_bytes(data)
    voice = PROJECT / 'delivery/voiceover.flac'
    run('-y', '-f', 's16le', '-ar', RATE, '-ac', 1, '-i', raw,
        '-af', 'loudnorm=I=-16:TP=-1.5:LRA=7', '-ar', RATE, '-c:a', 'flac', voice)
    metadata = {
        'title': 'The Day a Giant Wave of Molasses Destroyed a City Street',
        'voice': 'Previously selected English narration voice-02, reused for continuity',
        'fps': FPS, 'duration': duration, 'frames': frames,
        'chapters': chapters, 'captions': captions,
        'captionTiming': 'Measured speech activity plus word weights; not forced aligned',
        'voiceoverSha256': hashlib.sha256(voice.read_bytes()).hexdigest(),
    }
    (PROJECT / 'narration.json').write_text(json.dumps(metadata, indent=2) + '\n')
    (PROJECT / 'audio/amplitude.json').write_text(json.dumps(amplitudes) + '\n')
    srt = '\n\n'.join(f"{i}\n{timestamp(c['start'])} --> {timestamp(c['end'])}\n{c['text']}"
                       for i, c in enumerate(captions, 1)) + '\n'
    (PROJECT / 'delivery/captions.srt').write_text(srt)
    print(json.dumps({'duration': duration, 'frames': frames, 'captions': len(captions),
                      'chapters': [(c['index'], c['start'], c['end']) for c in chapters]}, indent=2))


if __name__ == '__main__':
    main()
