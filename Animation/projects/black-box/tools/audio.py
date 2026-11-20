#!/usr/bin/env python3
"""Assemble original-rate narration, measured chapter timing and sentence captions."""
import os,shutil,subprocess,wave,json,math,tempfile
from pathlib import Path
P=Path(__file__).resolve().parents[1];R=P.parents[2]
FF=os.environ.get('FFMPEG_PATH') or shutil.which('ffmpeg') or str(R/'psychology-of-human-attraction/node_modules/ffmpeg-static/ffmpeg')
def run(*args):
 p=subprocess.run([FF,'-hide_banner','-y',*map(str,args)],capture_output=True,text=True)
 if p.returncode:raise RuntimeError(p.stderr)
 return p
# Boundaries lie inside pauses measured in the selected narration takes.
lines=[
 [(0,3.17,'Imagine designing the most important recorder on an airplane…'),(3.17,5.39,'And then painting it bright orange.'),(5.39,None,"Because that's exactly what engineers did.")],
 [(0,2.9,'You see, this little device records crucial flight data'),(2.9,5.45,'and cockpit conversations.'),(5.45,None,'And if a plane crashes, investigators need to find it.')],
 [(0,1.25,"But there's one problem."),(1.25,3.30,'Everyone calls it the black box.'),(3.30,5.76,"So you'd expect it to be black, right?"),(5.76,None,'Well, that would be a terrible idea.')],
 [(0,1.19,'After a crash,'),(1.19,3.58,'the recorder could end up buried in wreckage,'),(3.58,4.95,'hidden in forests,'),(4.95,None,'or lying deep underwater.')],
 [(0,2.31,'And a black box in all that darkness?'),(2.31,3.59,'Good luck finding it.'),(3.59,6.94,'So engineers chose a completely different colour.'),(6.94,None,'Bright, highly visible orange.')],
 [(0,3.86,'They also added reflective markings to help search teams spot it,'),(3.86,None,'and underwater locator beacons to help find it beneath the sea.')],
 [(0,1.61,"And here's the funny part…"),(1.61,4.22,'The device everyone calls a black box'),(4.22,None,'is actually designed to stand out like a traffic cone.')],
 [(0,2.03,'Because when an airplane disappears,'),(2.03,4.09,'the last thing investigators need…'),(4.09,None,"is a recorder that's good at hiding.")]]
def main():
 chapters=[];captions=[];start=.35;paths=[]
 for i,cues in enumerate(lines,1):
  src=P/'assets/narration'/f'{i:02d}.flac'
  if not src.exists():run('-v','error','-i',R/f'Animation/output/black-box/vo/{i:02d}.wav','-c:a','flac',src)
  with tempfile.NamedTemporaryFile(suffix='.wav') as f:
   run('-v','error','-i',src,'-ar','48000','-ac','1','-c:a','pcm_s16le',f.name)
   with wave.open(f.name) as w:d=w.getnframes()/w.getframerate()
  chapters.append({'index':i,'start':round(start,6),'speechEnd':round(start+d,6),'end':round(start+d+.35,6),'source':src.name})
  for a,b,txt in cues:captions.append({'start':round(start+a,6),'end':round(start+(b if b is not None else d),6),'text':txt})
  start+=d+.35;paths.append(src)
 duration=math.ceil((start+.65)*24)/24
 manifest={'title':'Why the black box is orange','voice':'User-selected English narrator voice-01','fps':24,'duration':duration,'frames':round(duration*24),'chapters':chapters,'captions':captions,'audioPolicy':'Original speech rate; no pitch shift or time stretch. Only chapter pauses added.'}
 (P/'timeline.json').write_text(json.dumps(manifest,indent=2)+'\n')
 def stamp(t):
  m=round(t*1000);return f'{m//3600000:02d}:{m//60000%60:02d}:{m//1000%60:02d},{m%1000:03d}'
 (P/'delivery/captions.srt').write_text('\n\n'.join(f"{i}\n{stamp(c['start'])} --> {stamp(c['end'])}\n{c['text']}" for i,c in enumerate(captions,1))+'\n')
 args=[]
 for p in paths:args.extend(['-i',p])
 filters=[];labels=[]
 for i,ch in enumerate(chapters):
  filters.append(f'[{i}:a]aresample=48000,adelay={round(ch["start"]*1000)},apad,atrim=duration={duration}[a{i}]');labels.append(f'[a{i}]')
 filters.append(''.join(labels)+f'amix=inputs=8:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=7,aresample=48000[out]')
 run('-v','error',*args,'-filter_complex',';'.join(filters),'-map','[out]','-ac','1','-c:a','flac',P/'delivery/voiceover.flac')
 print(json.dumps({k:v for k,v in manifest.items() if k not in ('captions','audioPolicy')},indent=2))
if __name__=='__main__':main()
