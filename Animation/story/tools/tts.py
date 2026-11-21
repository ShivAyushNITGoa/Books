#!/usr/bin/env python3
"""Local English baseline voice. No service, network, shell, or credentials.
Install pinned espeakng-loader; the wheel includes engine + pronunciation data.
"""
import argparse, ctypes, wave
from pathlib import Path
import espeakng_loader

def synthesize(text, output, speed=160):
    lib = espeakng_loader.load_library()
    if lib is None:
        raise RuntimeError('Unable to load eSpeak NG')
    lib.espeak_Initialize.argtypes = [ctypes.c_int, ctypes.c_int, ctypes.c_char_p, ctypes.c_int]
    lib.espeak_Initialize.restype = ctypes.c_int
    rate = lib.espeak_Initialize(2, 0, str(Path(espeakng_loader.get_data_path()).parent).encode(), 0)
    if rate <= 0:
        raise RuntimeError('eSpeak initialization failed')
    callback_type = ctypes.CFUNCTYPE(ctypes.c_int, ctypes.POINTER(ctypes.c_short), ctypes.c_int, ctypes.c_void_p)
    chunks = []
    @callback_type
    def collect(samples, count, events):
        if count > 0 and samples:
            chunks.append(ctypes.string_at(samples, count * 2))
        return 0
    lib.espeak_SetSynthCallback.argtypes = [callback_type]
    lib.espeak_SetSynthCallback(collect)
    lib.espeak_SetVoiceByName.argtypes = [ctypes.c_char_p]
    if lib.espeak_SetVoiceByName(b'en-us') != 0:
        raise RuntimeError('English voice unavailable')
    lib.espeak_SetParameter(1, speed, 0)
    lib.espeak_Synth.argtypes = [ctypes.c_void_p, ctypes.c_size_t, ctypes.c_uint, ctypes.c_int, ctypes.c_uint, ctypes.c_uint, ctypes.c_void_p, ctypes.c_void_p]
    encoded = ctypes.create_string_buffer(text.encode('utf-8'))
    try:
        if lib.espeak_Synth(encoded, len(encoded), 0, 1, 0, 1, None, None) != 0:
            raise RuntimeError('Speech synthesis failed')
        lib.espeak_Synchronize()
        Path(output).parent.mkdir(parents=True, exist_ok=True)
        with wave.open(str(output), 'wb') as out:
            out.setnchannels(1); out.setsampwidth(2); out.setframerate(rate)
            out.writeframes(b''.join(chunks))
    finally:
        lib.espeak_Terminate()

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--text-file', required=True)
    parser.add_argument('--out', required=True)
    parser.add_argument('--speed', type=int, default=160)
    args = parser.parse_args()
    if not 80 <= args.speed <= 300:
        parser.error('speed must be 80–300 words per minute')
    synthesize(Path(args.text_file).read_text(encoding='utf-8'), args.out, args.speed)
