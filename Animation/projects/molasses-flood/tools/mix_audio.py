#!/usr/bin/env python3
"""Quiet deterministic original industrial/water foley; no third-party soundtrack."""
import array,json,math,random,subprocess
from pathlib import Path
from prepare_audio import ENCODER,RATE,PROJECT,REPO
shots=json.loads((PROJECT/'direction/shots.json').read_text())
n=json.loads((PROJECT/'narration.json').read_text())
out=REPO/'Animation/output/molasses-flood';out.mkdir(parents=True,exist_ok=True)
audio=array.array('h',[0])*round(n['duration']*RATE)
rng=random.Random(19190115)
events=[]
# Absolute level is deliberately far below narration; silence around the memorial is intentional.
for s in shots:
    action=s['action'];start=s['start'];length=min(3,s['end']-start)
    if action in ['wave','speed']:kind,gain='wash',.013
    elif action=='rupture':kind,gain='rumble',.025;length=6
    elif action=='rumble':kind,gain='rumble',.013
    elif action=='destruction':kind,gain='wood',.016
    elif action=='train':kind,gain='metal',.012
    elif action=='wash':kind,gain='wash',.014;length=6
    else:continue
    start+=.2;events.append(dict(start=start,duration=length,kind=kind,gain=gain))
    low=0
    for i in range(round(length*RATE)):
        t=i/RATE;u=t/length;noise=rng.uniform(-1,1);low=.975*low+.025*noise
        env=min(1,t/.35)*min(1,(length-t)/.7)
        if kind=='rumble':v=(low*3+.16*math.sin(t*math.tau*48))*env
        elif kind=='metal':v=(.4*math.sin(t*math.tau*381)+.2*math.sin(t*math.tau*613))*math.exp(-t*2.5)*env
        elif kind=='wood':v=(low*2+noise*.1)*math.exp(-t*1.8)*env
        else:v=(low*1.7+noise*.12)*env
        ix=round(start*RATE)+i
        if ix<len(audio):audio[ix]=max(-32768,min(32767,audio[ix]+round(v*gain*32767)))
raw=out/'foley.pcm';raw.write_bytes(audio.tobytes())
result=subprocess.run([ENCODER,'-y','-hide_banner','-v','error','-i',str(PROJECT/'delivery/voiceover.flac'),'-f','s16le','-ar',str(RATE),'-ac','1','-i',str(raw),'-filter_complex','[0:a][1:a]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=7[a]','-map','[a]','-ar',str(RATE),'-c:a','flac',str(out/'soundtrack.flac')],capture_output=True)
if result.returncode:raise RuntimeError(result.stderr.decode())
(PROJECT/'audio/foley.json').write_text(json.dumps({'seed':19190115,'description':'Original quiet procedural noise/metal/water cues, no music or distress calls','events':events},indent=2)+'\n')
print(f'Mixed {len(events)} foley events beneath complete voiceover')
