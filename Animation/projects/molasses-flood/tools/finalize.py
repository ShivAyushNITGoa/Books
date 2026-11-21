#!/usr/bin/env python3
"""Mux the complete export, validate actual streams and write compact delivery QA."""
import hashlib,json,re,subprocess
from pathlib import Path
from prepare_audio import ENCODER,PROJECT,REPO
OUT=REPO/'Animation/output/molasses-flood'
D=PROJECT/'delivery'
n=json.loads((PROJECT/'narration.json').read_text())
video=OUT/'molasses-picture.mp4';audio=OUT/'soundtrack.flac'
final=D/'molasses-flood-narrated-720p.mp4'

def run(args,check=True):
    p=subprocess.run([ENCODER,'-hide_banner',*map(str,args)],capture_output=True)
    if check and p.returncode:raise RuntimeError(p.stderr.decode(errors='replace'))
    return p

def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()

assert video.is_file() and audio.is_file(),'First render the complete picture and mix the audio'
D.mkdir(parents=True,exist_ok=True)
run(['-y','-v','warning','-i',video,'-i',audio,'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','160k','-ar','48000','-ac','1','-t',n['duration'],'-movflags','+faststart','-metadata','title=The Day a Giant Wave of Molasses Destroyed a City Street','-metadata','comment=Original stylized reconstruction; historical measurements are estimates. Railway account corrected as documented.',final])
probe=run(['-i',final],check=False).stderr.decode(errors='replace')
(OUT/'final-streams.txt').write_text(probe)
assert '720x1280' in probe and '24 fps' in probe and 'Video: h264' in probe and 'Audio: aac' in probe and '48000 Hz' in probe,probe
full=run(['-v','error','-xerror','-err_detect','explode','-i',final,'-map','0:v:0','-map','0:a:0','-fps_mode','passthrough','-progress','pipe:1','-nostats','-f','null','-'])
progress=full.stdout.decode();(OUT/'full-decode.log').write_text(progress)
frames=int(re.findall(r'^frame=(\d+)$',progress,re.M)[-1]);assert frames==n['frames'],(frames,n['frames'])
assert re.findall(r'^dup_frames=(\d+)$',progress,re.M)[-1]=='0'
assert re.findall(r'^drop_frames=(\d+)$',progress,re.M)[-1]=='0'
loud=run(['-i',final,'-vn','-af','loudnorm=I=-16:TP=-1.5:LRA=7:print_format=json','-f','null','-']).stderr.decode()
measurement=json.loads(loud[loud.rfind('{'):loud.rfind('}')+1]);(OUT/'final-loudness.json').write_text(json.dumps(measurement,indent=2)+'\n')
assert -17.5<float(measurement['input_i'])<-14.5,measurement
assert float(measurement['input_tp'])<-1,measurement
run(['-y','-v','error','-ss','98','-i',final,'-frames:v','1','-q:v','2',D/'poster.jpg'])
# Full-resolution one-per-shot final-file evidence; ignored, not thousands of tracked scratch images.
shots=json.loads((PROJECT/'direction/shots.json').read_text());review=OUT/'decoded-review';review.mkdir(exist_ok=True)
indices=[round(min(s['end']-.05,s['start']+min(2,(s['end']-s['start'])*.7))*n['fps']) for s in shots]
expression='+'.join(f'eq(n,{i})' for i in indices)
run(['-y','-v','error','-i',final,'-vf',f"select='{expression}'",'-fps_mode','passthrough','-frames:v',len(shots),review/'%02d.png'])
browser=json.loads((OUT/'browser-check.json').read_text())
project_tests=(OUT/'project-tests.log').read_text();repo_tests=(OUT/'repository-tests.log').read_text();lock=(OUT/'lock.log').read_text()
assert '# pass 7' in project_tests and '# fail 0' in project_tests
assert '# pass 52' in repo_tests and '# fail 0' in repo_tests
assert not browser['issues'] and not browser['errors'] and len(browser['samples'])==164
assert 'LOCK OK' in lock
runtime=['film.js','world.js','direction/timeline.js','direction/shots.json','narration.json','script.txt','audio/takes.json']
qa={
 'title':n['title'],'file':final.name,'bytes':final.stat().st_size,'sha256':sha(final),
 'video':{'codec':'H.264','canvas':[720,1280],'rendered3dViewport':[540,960],'fps':24,'frames':frames,'duration':n['duration'],'pixelFormat':'yuv420p','colorspace':'BT.709'},
 'audio':{'codec':'AAC','rate':48000,'channels':1,'integratedLUFS':float(measurement['input_i']),'truePeakDBTP':float(measurement['input_tp']),'loudnessRangeLU':float(measurement['input_lra']),'narrationTakes':8,'foleyEvents':10,'music':False},
 'captions':{'count':len(n['captions']),'burnedIn':True,'sidecar':'captions.srt','timing':'Speech activity plus word weights; not forced alignment'},
 'checks':{'fullAudioVideoDecode':'PASS','decodedFrames':frames,'duplicateFrames':0,'droppedFrames':0,'projectTests':{'passed':7,'failed':0},'repositoryTests':{'passed':52,'failed':0},'strictOriginalLock':lock.strip(),'browserSamples':len(browser['samples']),'browserErrors':browser['errors'],'seekChecks':browser['seekChecks'],'shots':len(shots),'sets':len(set(s['world'] for s in shots)),'finalFileReviewFrames':len(list(review.glob('*.png')))},
 'runtimeSha256':{p:sha(PROJECT/p) for p in runtime},
 'limits':['Authored geometry, not a fluid/structural simulation or surveyed geography','Saved working-script comparison, not a separately archived original chat upload','Captions are estimated, no complete manual listening or phonetic lip-sync claim','Technical checks do not imply user aesthetic approval'],
}
(D/'QA.json').write_text(json.dumps(qa,indent=2)+'\n')
print(json.dumps(qa,indent=2))
