"""Deterministic, quiet procedural Foley + a 60 Hz voice envelope for animation.
No third-party audio, music or generated speech. Run from the project root.
"""
import json
from pathlib import Path
import wave
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'classroom-v2'
OUT.mkdir(exist_ok=True)
with wave.open(str(ROOT / 'vo/scarcity/voiceover.wav'), 'rb') as f:
    rate, channels = f.getframerate(), f.getnchannels()
    assert f.getsampwidth() == 2 and channels == 1
    voice = np.frombuffer(f.readframes(f.getnframes()), dtype='<i2').astype(np.float64) / 32768

# RMS measured from narration ONLY: Foley never moves a character's mouth.
values = []
for frame in range(1801):
    start = max(0, int((frame / 60 - .017) * rate))
    chunk = voice[start:min(len(voice), start + int(.034 * rate))]
    rms = np.sqrt(np.mean(chunk ** 2)) if len(chunk) else 0
    values.append(round(float(np.clip((rms - .008) / .105, 0, 1)) ** .65, 4))
(OUT / 'voice-envelope.json').write_text(json.dumps({'fps': 60, 'values': values}, separators=(',', ':')))

rng = np.random.default_rng(1975)
fx = np.zeros(len(voice))

def sound(at, duration, kind, gain):
    n = int(duration * rate)
    t = np.arange(n) / rate
    noise = rng.normal(0, 1, n)
    attack = np.minimum(1, t / .008)
    if kind == 'step':
        signal = (.6 * np.sin(2*np.pi*115*t) + .4 * noise) * np.exp(-t*32)
    elif kind == 'wood':
        signal = (np.sin(2*np.pi*620*t) + .35*np.sin(2*np.pi*1480*t) + .2*noise) * np.exp(-t*44)
    elif kind == 'paper':
        filtered = noise - np.roll(noise, 1)
        signal = filtered * np.sin(np.pi * t / duration) ** 2 * .35
    else:  # muted vibration, not a musical notification melody
        signal = np.sin(2*np.pi*145*t) * (.6+.4*np.sin(2*np.pi*24*t)) * np.sin(np.pi*t/duration)**2
    signal *= attack * gain
    start = int(at*rate)
    end = min(len(fx), start+n)
    fx[start:end] += signal[:end-start]

for at in [4.2, 5.65]: sound(at, .18, 'buzz', .025)
for at in [8.03, 8.49, 8.95, 9.41, 9.87, 21.64, 22.14, 22.64, 23.14, 23.64, 24.14]:
    sound(at, .18, 'step', .025)
sound(7.7, .1, 'wood', .025)
sound(11.12, .1, 'wood', .025)
sound(17.25, .1, 'wood', .02)
sound(25.4, .35, 'paper', .016)
sound(28.0, .30, 'paper', .012)
# Mild ducking leaves the narration foremost. Keep a full dB of peak headroom.
mixed = voice + fx * (1 - np.minimum(np.abs(voice)*3, .6))
peak = float(np.max(np.abs(mixed)))
if peak > .891: mixed *= .891 / peak
render_dir = ROOT / 'renders'
render_dir.mkdir(exist_ok=True)
with wave.open(str(render_dir/'classroom-v2-mix.wav'), 'wb') as f:
    f.setnchannels(1); f.setsampwidth(2); f.setframerate(rate)
    f.writeframes((mixed*32767).astype('<i2').tobytes())
print(f'30s Foley mix: peak {20*np.log10(np.max(np.abs(mixed))):.2f} dBFS; envelope: {len(values)} samples')
