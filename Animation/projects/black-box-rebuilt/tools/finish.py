#!/usr/bin/env python3
"""Mux narration, validate every frame and the actual rendered camera trace."""
import hashlib,json,math,os,re,shutil,subprocess
from pathlib import Path
P=Path(__file__).resolve().parents[1];R=P.parents[2]
FF=os.environ.get('FFMPEG_PATH') or shutil.which('ffmpeg') or str(R/'psychology-of-human-attraction/node_modules/ffmpeg-static/ffmpeg')
def run(*args):
 p=subprocess.run([FF,'-hide_banner',*map(str,args)],capture_output=True,text=True)
 if p.returncode:raise RuntimeError(p.stderr)
 return p
def digest(p):
 with p.open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()
def stream_hash(p):return run('-v','error','-i',p,'-map','0:v:0','-c','copy','-f','hash','-hash','sha256','-').stdout.strip()
def main():
 timeline=json.loads((P/'narration.json').read_text());output=R/'Animation/output/black-box-rebuilt';clean=output/'black-box-rebuilt-clean-720p.mp4'
 trace=json.loads(clean.with_suffix('.camera.json').read_text())
 visibility=json.loads(clean.with_suffix('.visibility.json').read_text())
 if visibility['frames']!=1561 or visibility['blockedCenterSightlines']:raise ValueError('Recorder sightline audit failed')
 if len(trace)!=timeline['frames']:raise ValueError('Incomplete camera trace')
 for i,frame in enumerate(trace):
  if abs(frame['time']-i/24)>.00001:raise ValueError('Non-contiguous frame time')
  if not frame['continuousTake']:raise ValueError('Continuous take flag missing')
  if not all(math.isfinite(v) for v in frame['camera']+frame['target']):raise ValueError('Non-finite camera')
 def dist(a,b):return sum((x-y)**2 for x,y in zip(a,b))**.5
 max_step=max(dist(a['camera'],b['camera']) for a,b in zip(trace,trace[1:]))
 if max_step>.6:raise ValueError(f'Camera discontinuity: {max_step}')
 gaps=[p['clearance'] for f in trace for p in f['peopleClearance']]
 overlaps=[p['screenOverlap'] for f in trace for p in f['peopleClearance']]
 if min(gaps)<.6 or max(overlaps)>.0001:raise ValueError('Character blocking regression')
 xs=[f['heroNdc'][0] for f in trace]
 if max(xs)-min(xs)<.65:raise ValueError('Subject framing is too centered')
 for f in trace:
  b=f['carrierBounds']
  if b['min'][0]<-.842 or b['max'][0]>.842 or b['min'][1]<-.552 or b['max'][1]>.752:raise ValueError('Carrier crops or enters subtitle area')
 az=[]
 for f in trace:
  a=f['azimuth']
  if az:
   while a-az[-1]>math.pi:a-=math.pi*2
   while a-az[-1]<-math.pi:a+=math.pi*2
  az.append(a)
 az_range=math.degrees(max(az)-min(az))
 if az_range<300:raise ValueError('Camera stays on one side')
 delivery=P/'delivery';part=delivery/'.black-box-narrated.part.mp4';final=delivery/'black-box-rebuilt-narrated-720p.mp4'
 run('-y','-v','error','-i',clean,'-i',P.parent/'black-box/delivery/voiceover.flac','-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','160k','-t',str(timeline['duration']),'-movflags','+faststart','-metadata','title=Why the black box is orange — one continuous camera',part)
 probe=run('-i',part,'-map','0:v:0','-map','0:a:0','-xerror','-vf','blackdetect=d=0.1:pix_th=0.025','-progress','pipe:1','-f','null','-')
 if int(re.findall(r'^frame=(\d+)$',probe.stdout,re.M)[-1])!=timeline['frames']:raise ValueError('Frame count mismatch')
 if '720x1280' not in probe.stderr or '24 fps' not in probe.stderr:raise ValueError('Wrong picture format')
 if '48000 Hz, mono' not in probe.stderr or 'Audio: aac' not in probe.stderr:raise ValueError('Wrong narration stream format')
 if 'black_start:' in probe.stderr:raise ValueError('Unexpected black interval')
 if stream_hash(clean)!=stream_hash(part):raise ValueError('Picture changed during narration mux')
 measure=run('-i',part,'-vn','-af','loudnorm=I=-16:TP=-1.5:LRA=7:print_format=json','-f','null','-')
 levels=json.loads(re.findall(r'\{[^{}]*"input_i"[^{}]*\}',measure.stderr,re.S)[-1])
 if float(levels['input_tp'])>-.5 or abs(float(levels['input_i'])+16)>1:raise ValueError('Audio level out of bounds')
 os.replace(part,final)
 run('-y','-v','error','-ss','43.5','-i',final,'-frames:v','1',delivery/'poster.jpg')
 # All chapters plus entry/exit from the water, orange reveal and final frame.
 times=[0,2,4.3,7.9,10.2,12.6,15,17.4,20,23,25.9,28,29.6,31.2,32.5,35.5,37.5,39.1,41.2,43.5,46.2,49,51.5,54.5,57.8,61.8,timeline['duration']-1/24]
 images=[]
 for i,t in enumerate(times):
  image=output/f'final-review-{i:02d}.jpg';run('-y','-v','error','-ss',t,'-i',final,'-frames:v','1','-vf','scale=270:480',image);images.append(image)
 run('-y','-v','error','-pattern_type','glob','-i',str(output/'final-review-*.jpg'),'-vf','tile=7x4','-frames:v','1',output/'final-contact-sheet.jpg')
 manifest={'file':final.name,'sha256':digest(final),'bytes':final.stat().st_size,'durationSeconds':timeline['duration'],'frames':timeline['frames'],'width':720,'height':1280,'fps':24,'videoCodec':'H.264','audioCodec':'AAC mono 48kHz','integratedLufs':float(levels['input_i']),'truePeakDbtp':float(levels['input_tp']),'fullFileDecode':'passed','unexpectedBlackIntervals':0,'pictureUnchangedDuringMux':True,'blocking':{'clearStaticRecorderCenterSightlines':visibility['frames'],'minimumPersonCarrierClearanceMeters':min(gaps),'maximumPersonRecorderScreenEnvelopeOverlap':max(overlaps),'subjectNdcXRange':[min(xs),max(xs)],'azimuthRangeDegrees':az_range},'continuousCamera':{'rigs':1,'cuts':0,'fov':46,'traceFrames':len(trace),'maximumFrameToFramePositionStep':max_step,'traceSha256':digest(clean.with_suffix('.camera.json'))},'sourceSha256':{os.path.relpath(p,P):digest(p) for p in [P/'film.js',P/'world.js',P/'choreography.js',P/'camera-rig.js',P/'narration.json',P/'script.txt',P.parent/'black-box/delivery/voiceover.flac']}}
 (delivery/'production.json').write_text(json.dumps(manifest,indent=2)+'\n')
 shutil.copyfile(clean.with_suffix('.camera.json'),delivery/'camera-trace.json')
 print(json.dumps(manifest,indent=2))
if __name__=='__main__':main()
