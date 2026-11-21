#!/usr/bin/env python3
"""Optional targeted re-export assembly after final-encode visual review.

All replacement frames use the same deterministic camera/time/world. Ranges
include the quaternion filter's temporal support. This does not introduce cuts
or retime narration. A normal full export from current source needs no assembly.
"""
import hashlib,json,os,shutil,subprocess
from pathlib import Path
P=Path(__file__).resolve().parents[1];R=P.parents[2]
O=R/'Animation/output/bulbous-bow'
FF=os.environ.get('FFMPEG_PATH') or shutil.which('ffmpeg') or str(R/'psychology-of-human-attraction/node_modules/ffmpeg-static/ffmpeg')
def digest(p):
    with p.open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()
def main():
    clean=O/'bulbous-bow-clean-720p.mp4';original=O/'initial-clean-720p.mp4'
    if not original.exists():
        shutil.copyfile(clean,original)
        shutil.copyfile(clean.with_suffix('.camera.json'),original.with_suffix('.camera.json'))
    replacements=[(64,87,'reveal-corrected'),(159,182,'laboratory-corrected'),(199,205.25,'ending-corrected')]
    trace=json.loads(original.with_suffix('.camera.json').read_text())
    assert len(trace)==4926
    for start,end,name in replacements:
        part=json.loads((O/(name+'.camera.json')).read_text())
        assert len(part)==round((end-start)*24)
        for i,f in enumerate(part):assert abs(f['time']-(start+i/24))<1e-6
        trace[round(start*24):round(end*24)]=part
    part=O/'assembled.part.mp4'
    args=[FF,'-y','-hide_banner','-loglevel','warning',
          '-t','64','-i',str(original),'-i',str(O/'reveal-corrected.mp4'),
          '-ss','87','-t','72','-i',str(original),'-i',str(O/'laboratory-corrected.mp4'),
          '-ss','182','-t','17','-i',str(original),'-i',str(O/'ending-corrected.mp4')]
    graph=';'.join(f'[{i}:v]setpts=PTS-STARTPTS[v{i}]' for i in range(6))
    graph+=';'+''.join(f'[v{i}]' for i in range(6))+'concat=n=6:v=1:a=0,format=yuv420p[out]'
    args+=['-filter_complex',graph,'-map','[out]','-an','-c:v','libx264','-preset','fast','-crf','18',
           '-r','24','-frames:v','4926','-color_range','tv','-colorspace','bt709',
           '-color_primaries','bt709','-color_trc','bt709','-movflags','+faststart',str(part)]
    subprocess.run(args,check=True)
    os.replace(part,clean)
    clean.with_suffix('.camera.json').write_text(json.dumps(trace))
    shutil.copyfile(O/'ending-corrected.audit.json',clean.with_suffix('.audit.json'))
    clean.with_suffix('.assembly.json').write_text(json.dumps({
        'method':'Deterministic frame-range replacement after visual QA; contiguous 24 fps, unchanged programme time; H.264 re-encode on assembly',
        'replacementRangesSeconds':replacements,'frames':4926,'initialPictureSha256':digest(original),
        'replacementSha256':{name:digest(O/(name+'.mp4')) for _,_,name in replacements},
        'assembledPictureSha256':digest(clean),
    },indent=2)+'\n')
    print('Assembled 4926 contiguous frames and actual camera trace.')
if __name__=='__main__':main()
