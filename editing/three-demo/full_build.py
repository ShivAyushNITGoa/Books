"""Render the full approved TV12 v4 style, QA, then publish to GitHub.
Run from repository root: python3 -u editing/three-demo/full_build.py
Renders resumable 120s chunks, concatenates video and muxes original narration.
Large MP4s go to a GitHub release, not Git history. Source/report push only
uses the existing session branch. A failure stops publication immediately.
"""
import hashlib
import json
import math
import os
from pathlib import Path
import subprocess
import imageio_ffmpeg

ROOT=Path(__file__).resolve().parents[2]
HERE=ROOT/'editing/three-demo'
OUT=ROOT/'output/tv12_full_v4'
BRANCH='arena/9b3286e3-books'
FF=imageio_ffmpeg.get_ffmpeg_exe()

def run(cmd, **kw):
    return subprocess.run([str(x) for x in cmd],check=True,**kw)

def main():
    os.chdir(ROOT)
    branch=subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    if branch!=BRANCH:raise RuntimeError('Wrong branch')
    timeline=json.loads((HERE/'timeline.json').read_text())
    duration=timeline['duration'];frames=round(duration*24)
    OUT.mkdir(parents=True,exist_ok=True)
    # A cache fingerprint prevents resuming chunks from different source/style builds.
    h=hashlib.sha256()
    for file in [HERE/'index.html',HERE/'render.mjs',HERE/'timeline.json',ROOT/'video 12 full audio.mp3']:
        h.update(file.read_bytes())
    for scene in timeline['scenes']:
        h.update((ROOT/'images_tv12'/f"{scene['label']}.jpg").read_bytes())
    fingerprint=h.hexdigest()
    chunks=[]
    for index,start in enumerate(range(0,math.ceil(duration),120),1):
        end=min(start+120,duration)
        dest=OUT/f'tv12_part_{index:02d}.mp4'
        stamp=dest.with_suffix('.complete')
        if not(dest.exists() and stamp.exists() and stamp.read_text()==fingerprint):
            env={**os.environ,'RENDER_FULL':'1','RENDER_FROM':str(start),'RENDER_TO':str(end),'RENDER_OUTPUT':str(dest.relative_to(ROOT))}
            run(['node','render.mjs'],cwd=HERE,env=env)
            run([FF,'-v','error','-i',dest,'-f','null','-'])
            if dest.stat().st_size>=100_000_000:raise RuntimeError(f'Part exceeds 100 MB: {dest}')
            stamp.write_text(fingerprint)
        chunks.append(dest)
        print(f'CHUNK VERIFIED {index}/{math.ceil(duration/120)}',flush=True)
    concat=OUT/'concat.txt'
    concat.write_text(''.join(f"file '{p}'\n" for p in chunks))
    master=OUT/'tv12_full_v4_720p.mp4'
    run([FF,'-y','-v','warning','-f','concat','-safe','0','-i',concat,'-i',ROOT/'video 12 full audio.mp3','-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','160k','-ar','48000','-t',str(duration),'-movflags','+faststart',master])
    run([FF,'-v','error','-i',master,'-f','null','-'])
    # Count decoded frames, independently of container metadata.
    count=run([FF,'-v','error','-i',master,'-map','0:v:0','-f','framemd5','-'],capture_output=True,text=True)
    decoded=sum(1 for line in count.stdout.splitlines() if line and not line.startswith('#'))
    if decoded!=frames:raise RuntimeError(f'Expected {frames} frames, decoded {decoded}')
    report={'status':'technical QA passed; subjective full review pending','duration_seconds':duration,'decoded_frames':decoded,'resolution':'1280x720','fps':24,'scene_count':len(timeline['scenes']),'timing':'provisional image-label timing, no authoritative SRT','style':'Three.js v4 varied smooth camera moves, simulated focus and bas-relief depth','audio':'original GitHub narration AAC encoded, no gain changes or music','parts':[{'name':p.name,'bytes':p.stat().st_size} for p in chunks],'master_sha256':hashlib.sha256(master.read_bytes()).hexdigest(),'source_fingerprint':fingerprint}
    report_path=HERE/'FULL_BUILD_REPORT.json'
    report_path.write_text(json.dumps(report,indent=2)+'\n')
    run(['git','add','.gitignore','editing/three-demo'])
    run(['git','commit','-m','Build full TV12 Three.js video and record render QA'])
    run(['git','push','origin',BRANCH])
    sha=subprocess.check_output(['git','rev-parse','--short','HEAD'],text=True).strip()
    tag='tv12-full-v4-'+sha
    notes='Full TV12 at 720p/24fps using Three.js v4. Original narration, no music or captions. Timing is provisional from image labels (authoritative SRT unavailable). Includes master plus sequential parts under 100 MB. Technical decode/frame-count QA passed; subjective full-video review pending.'
    run(['gh','release','create',tag,'--target',BRANCH,'--title','TV12 full video · Three.js v4 · 720p','--notes',notes,master,*chunks,report_path])
    print('PUBLISHED https://github.com/ShivAyushNITGoa/Books/releases/tag/'+tag,flush=True)

if __name__=='__main__':main()
