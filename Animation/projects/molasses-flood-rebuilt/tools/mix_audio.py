#!/usr/bin/env python3
"""Rebuild the unchanged voice/effects mix without modifying the first film.

The selected narration and effects cue ledger are deliberately shared assets.
All temporary PCM and the new lossless mix stay under ignored output/.
"""
import array
import json
import math
import os
from pathlib import Path
import random
import shutil
import subprocess

PROJECT = Path(__file__).resolve().parents[1]
ANIMATION = PROJECT.parents[1]
PREVIOUS = PROJECT.parent / 'molasses-flood'
OUT = ANIMATION / 'output/molasses-flood-rebuilt'
ENCODER = os.environ.get('FFMPEG_PATH') or shutil.which('ffmpeg') or str(
    ANIMATION / 'node_modules/ffmpeg-static/ffmpeg')
RATE = 48000


def main():
    narration = json.loads((PROJECT / 'narration.json').read_text())
    ledger = json.loads((PREVIOUS / 'audio/foley.json').read_text())
    rng = random.Random(ledger['seed'])
    audio = array.array('h', [0]) * round(narration['duration'] * RATE)
    for event in ledger['events']:
        start = event['start']
        length = event['duration']
        kind = event['kind']
        gain = event['gain']
        low = 0
        for i in range(round(length * RATE)):
            t = i / RATE
            noise = rng.uniform(-1, 1)
            low = .975 * low + .025 * noise
            envelope = min(1, t / .35) * min(1, (length - t) / .7)
            if kind == 'rumble':
                value = (low * 3 + .16 * math.sin(t * math.tau * 48)) * envelope
            elif kind == 'metal':
                value = (.4 * math.sin(t * math.tau * 381)
                         + .2 * math.sin(t * math.tau * 613)) * math.exp(-t * 2.5) * envelope
            elif kind == 'wood':
                value = (low * 2 + noise * .1) * math.exp(-t * 1.8) * envelope
            else:
                value = (low * 1.7 + noise * .12) * envelope
            index = round(start * RATE) + i
            if index < len(audio):
                audio[index] = max(-32768, min(32767,
                    audio[index] + round(value * gain * 32767)))
    OUT.mkdir(parents=True, exist_ok=True)
    raw = OUT / 'foley.pcm'
    raw.write_bytes(audio.tobytes())
    command = [ENCODER, '-y', '-hide_banner', '-v', 'error',
        '-i', str(PREVIOUS / 'delivery/voiceover.flac'),
        '-f', 's16le', '-ar', str(RATE), '-ac', '1', '-i', str(raw),
        '-filter_complex',
        '[0:a][1:a]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=7[a]',
        '-map', '[a]', '-ar', str(RATE), '-c:a', 'flac', str(OUT / 'soundtrack.flac')]
    subprocess.run(command, check=True)
    raw.unlink()
    print(f"Mixed complete unchanged narration and {len(ledger['events'])} original effects")


if __name__ == '__main__':
    main()
