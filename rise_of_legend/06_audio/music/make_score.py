#!/usr/bin/env python3
"""
Rise of Legend — score bed  (original, generated from code)
===========================================================
Synthesises the 120.00 s music bed for episode 1 with NumPy only: sine drones,
noise wind, sub booms, a bowed shimmer and a low pulse. Nothing is sampled or
downloaded, so the score is original by construction — there is no master
recording, no library cue and no third-party sample in it.

Mood map (matches the beats in ../../timeline.json):
  0.0 – 38.0   cold open / museum         drone + wind, two soft booms
 38.0 – 60.0   break-in, the catch        lower, pulse enters, impact at 60
 60.0 – 104.0  courtyard lesson           warm drone, no pulse, shimmer at 86
104.0 – 120.0  rooftop / villain / title  pulse returns, big boom at 117.2, tail

Output: 06_audio/music/score_ep01.wav  (48 kHz, mono, 16-bit, 120.000 s)

Usage:
  python3 rise_of_legend/06_audio/music/make_score.py
"""
from pathlib import Path
import wave

import numpy as np

SR = 48000
DUR = 120.0
N = int(SR * DUR)
t = np.arange(N) / SR
HERE = Path(__file__).resolve().parent

# cue anchors (seconds) — same five VO cues the edit is cut to
CUES = [2.0, 38.0, 60.0, 104.0, 117.2]


def env_adsr(n, a=0.02, d=0.2, s=0.6, r=0.5, sus=0.7):
    a_n, d_n, r_n = int(a * n), int(d * n), int(r * n)
    s_n = max(0, n - a_n - d_n - r_n)
    e = np.concatenate([
        np.linspace(0, 1, max(1, a_n), endpoint=False),
        np.linspace(1, sus, max(1, d_n), endpoint=False),
        np.full(s_n, sus),
        np.linspace(sus, 0, max(1, r_n)),
    ])
    return np.resize(e, n)


def drone(freq, gain, lfo_hz, lfo_depth, phase=0.0):
    """Sustained tone with slow amplitude drift and a touch of detune."""
    vib = 1.0 + 0.0016 * np.sin(2 * np.pi * 0.21 * t + phase)
    tone = (np.sin(2 * np.pi * freq * t * vib + phase)
            + 0.32 * np.sin(2 * np.pi * freq * 2.002 * t + phase * 0.7)
            + 0.16 * np.sin(2 * np.pi * freq * 3.004 * t))
    lfo = 1.0 - lfo_depth + lfo_depth * (0.5 + 0.5 * np.sin(2 * np.pi * lfo_hz * t
                                                          + phase))
    return gain * tone * lfo


def lowpass(x, cutoff):
    """One-pole low-pass (cheap, but enough for wind and booms)."""
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):                        # 5.7M samples, a few seconds
        acc = (1 - a) * x[i] + a * acc
        y[i] = acc
    return y


def wind(gain, cutoff=420.0, seed=3):
    rng = np.random.default_rng(seed)
    n = lowpass(rng.normal(0, 1, N), cutoff)
    swell = 0.55 + 0.45 * np.sin(2 * np.pi * 0.035 * t + 1.2)
    return gain * n / (np.max(np.abs(n)) + 1e-9) * swell


def boom(at, gain, f0=92.0, f1=32.0, length=3.2):
    """Pitch-dropping sub hit."""
    n = int(length * SR)
    if at >= DUR:
        return np.zeros(N)
    tt = np.arange(n) / SR
    f = f0 * np.exp(-tt * 2.0) + f1
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-tt * 1.5)
    click = np.random.default_rng(7).normal(0, 1, n) * np.exp(-tt * 60) * 0.25
    sig = (body + click) * (1 - np.exp(-tt * 200))
    out = np.zeros(N)
    i0 = int(at * SR)
    m = min(n, N - i0)
    out[i0:i0 + m] = sig[:m] * gain
    return out


def shimmer(at, gain, length=9.0, root=440.0):
    n = int(length * SR)
    if at + length > DUR:
        n = int((DUR - at) * SR)
    tt = np.arange(n) / SR
    partials = [1.0, 1.5, 2.0, 2.66, 3.0, 4.0]
    sig = np.zeros(n)
    for k, p in enumerate(partials):
        sig += (0.9 / (k + 1)) * np.sin(2 * np.pi * root * p * tt
                                        + np.sin(2 * np.pi * (0.3 + k * 0.11) * tt))
    trem = 0.6 + 0.4 * np.sin(2 * np.pi * 0.7 * tt)
    e = np.concatenate([np.linspace(0, 1, int(n * 0.22)),
                        np.ones(int(n * 0.30)),
                        np.linspace(1, 0, n - int(n * 0.22) - int(n * 0.30))])
    out = np.zeros(N)
    i0 = int(at * SR)
    out[i0:i0 + n] = sig[:N - i0] * trem * e * gain
    return out


def pulse(at, gain, length=1.1, f=58.0):
    n = int(length * SR)
    tt = np.arange(n) / SR
    sig = np.sin(2 * np.pi * f * tt) * np.exp(-tt * 5.5) * (1 - np.exp(-tt * 120))
    out = np.zeros(N)
    i0 = int(at * SR)
    m = min(n, N - i0)
    if m > 0:
        out[i0:i0 + m] = sig[:m] * gain
    return out


def section_gain(start, end, fade=1.2):
    """Slow cross-faded section gain so the bed breathes with the edit."""
    g = np.zeros(N)
    a, b = int(start * SR), int(end * SR)
    g[a:b] = 1.0
    f = int(fade * SR)
    if a - f >= 0:
        g[a - f:a] = np.linspace(0, 1, f)
    if b + f <= N:
        g[b:b + f] = np.linspace(1, 0, f)
    return g


def main() -> None:
    mix = np.zeros(N)

    # --- drones: A1 root, fifth, octave, minor third high
    mix += drone(55.0, 0.150, 0.043, 0.35)
    mix += drone(82.5, 0.085, 0.061, 0.40, phase=0.9)
    mix += drone(110.0, 0.055, 0.029, 0.30, phase=2.1)
    mix += drone(164.8, 0.030, 0.037, 0.55, phase=4.0)
    mix += drone(196.0, 0.018, 0.019, 0.6, phase=1.4)      # G, the unease

    # --- wind / room tone
    mix += wind(0.055)
    mix += wind(0.030, cutoff=90.0, seed=11)

    # --- sub hits on the story turns
    for at, g in ((2.0, 0.32), (38.0, 0.30), (60.0, 0.55),
                  (104.0, 0.34), (117.2, 0.62)):
        mix += boom(at, g)
    mix += boom(86.0, 0.22, f0=70.0, f1=38.0, length=2.4)   # five panels ignite

    # --- shimmer over the transformation, and a thin one under the title
    mix += shimmer(85.2, 0.055)
    mix += shimmer(112.0, 0.030, length=8.0, root=660.0)

    # --- pulse: only while the tension runs (break-in), and in the last act
    for k, at in enumerate(np.arange(40.0, 59.0, 2.0)):
        mix += pulse(float(at), 0.16)
    for k, at in enumerate(np.arange(106.0, 116.0, 1.6)):
        mix += pulse(float(at), 0.20)

    # --- section shaping: quiet museum, open courtyard, tight finale
    gate = (section_gain(0.0, 38.0, 2.0) * 0.85
            + section_gain(38.0, 60.0, 1.0) * 1.0
            + section_gain(60.0, 104.0, 1.5) * 0.72
            + section_gain(104.0, 120.0, 1.0) * 1.05)
    mix *= np.clip(gate, 0, 1.2)

    # --- edits the picture demands (see 06_audio/README.md):
    #     no music under the whisper (0:00-0:08), total silence at S25 (ether-step)
    def hole(t0, t1, ramp=0.35):
        a, b = int(t0 * SR), int(t1 * SR)
        r = max(1, int(ramp * SR))
        mix[a:b] = 0.0
        mix[max(0, a - r):a] *= np.linspace(1, 0, min(r, a - max(0, a - r)))
        mix[b:min(N, b + r)] *= np.linspace(0, 1, min(r, N - b))

    hole(0.0, 7.9, 1.4)          # whisper: drone creeps in as the lamp lights
    hole(94.0, 97.4, 0.30)       # ether-step: absolute silence, the fifth breath

    # --- global fades
    fo = int(7.0 * SR)
    mix[-fo:] *= np.linspace(1, 0, fo)

    # --- gentle top-end roll-off, then normalise to a bed level
    mix = lowpass(mix, 5200.0)
    mix = mix / (np.max(np.abs(mix)) + 1e-9) * 0.62
    mix = np.tanh(mix * 1.15) * 0.85                     # soft knee, no clipping
    rms = np.sqrt(np.mean(mix ** 2))
    target = 10 ** (-27.0 / 20.0)                        # ≈ -27 dBFS RMS bed
    mix *= target / (rms + 1e-9)
    mix = np.clip(mix, -0.98, 0.98)

    out = HERE / "score_ep01.wav"
    with wave.open(str(out), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((mix * 32767).astype("<i2").tobytes())
    print(f"score: {out}  {N / SR:.3f}s  peak {np.max(np.abs(mix)):.2f}  "
          f"rms {20 * np.log10(np.sqrt(np.mean(mix ** 2)) + 1e-12):.1f} dBFS")


if __name__ == "__main__":
    main()
