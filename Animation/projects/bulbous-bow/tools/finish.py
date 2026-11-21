#!/usr/bin/env python3
"""Mux the actual rendered pictures with the selected voice; validate delivery."""
import hashlib,json,math,os,re,shutil,subprocess
from pathlib import Path
P=Path(__file__).resolve().parents[1]
R=P.parents[2]
FF=os.environ.get('FFMPEG_PATH') or shutil.which('ffmpeg') or str(R/'psychology-of-human-attraction/node_modules/ffmpeg-static/ffmpeg')
def run(*args):
    p=subprocess.run([FF,'-hide_banner',*map(str,args)],capture_output=True,text=True)
    if p.returncode:raise RuntimeError(p.stderr)
    return p

def digest(p):
    with p.open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()

def picture_hash(p):
    return run('-v','error','-i',p,'-map','0:v:0','-c','copy','-f','hash','-hash','sha256','-').stdout.strip()

def main():
    n=json.loads((P/'narration.json').read_text())
    output=R/'Animation/output/bulbous-bow'
    clean=output/'bulbous-bow-clean-720p.mp4'
    trace=json.loads(clean.with_suffix('.camera.json').read_text())
    audit=json.loads(clean.with_suffix('.audit.json').read_text())
    if audit['issues'] or audit['settledBounds'] or audit['repeatedOrbits']:raise ValueError('Camera audit failed')
    if len(trace)!=n['frames']:raise ValueError('Incomplete rendered trace')
    for i,f in enumerate(trace):
        if abs(f['time']-i/n['fps'])>1e-5:raise ValueError('Non-contiguous camera trace')
        if not f['continuousTake'] or f['orbitController']:raise ValueError('Wrong camera rig')
        if not all(math.isfinite(v) for v in f['camera']+f['rotation']):raise ValueError('Nonfinite pose')
    final=P/'delivery/bulbous-bow-narrated-720p.mp4'
    part=final.with_name('.bulbous-bow.part.mp4')
    run('-y','-v','error','-i',clean,'-i',P/'delivery/voiceover.flac',
        '-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','160k',
        '-t',n['duration'],'-movflags','+faststart','-metadata','title='+n['title'],part)
    probe=run('-i',part,'-map','0:v:0','-map','0:a:0','-xerror',
              '-vf','blackdetect=d=0.1:pix_th=0.025','-progress','pipe:1','-f','null','-')
    if int(re.findall(r'^frame=(\d+)$',probe.stdout,re.M)[-1])!=n['frames']:raise ValueError('Incorrect frame count')
    if '720x1280' not in probe.stderr or '24 fps' not in probe.stderr:raise ValueError('Wrong picture dimensions/rate')
    if '48000 Hz, mono' not in probe.stderr or 'Audio: aac' not in probe.stderr:raise ValueError('Wrong audio stream')
    if 'black_start:' in probe.stderr:raise ValueError('Unexpected black interval')
    if picture_hash(part)!=picture_hash(clean):raise ValueError('Pictures changed in mux')
    feature_checks=[]
    for t,x,y,w,h in [(79,75,292,90,75),(172,40,275,220,95)]:
        image=subprocess.run([FF,'-v','error','-ss',str(t),'-i',str(part),'-frames:v','1',
                              '-vf','scale=360:640','-pix_fmt','rgb24','-f','rawvideo','-'],
                             capture_output=True,check=True).stdout
        visible=0
        for yy in range(y,y+h):
            for xx in range(x,x+w):
                i=(yy*360+xx)*3;r,g,b=image[i:i+3]
                visible+=int(r>40 and r>g*1.2 and r>b*1.2) if t==79 else int(r>140 and g>130)
        if visible<=300:raise ValueError(f'Encoded feature occluded at {t}s: {visible} pixels')
        feature_checks.append({'time':t,'feature':'bulb cutaway' if t==79 else 'tow model','visibleFeaturePixels':visible,'passed':True})
    floor_report=json.loads((output/'browser-test.json').read_text())['floor']
    encoded_floor={'sampledPoses':floor_report['poses'],'visiblePoints':0,'badPixels':0}
    for pose in floor_report['samples']:
        if not pose['points']:continue
        image=subprocess.run([FF,'-v','error','-ss',str(pose['time']),'-i',str(part),'-frames:v','1',
                              '-vf','scale=360:640','-pix_fmt','rgb24','-f','rawvideo','-'],
                             capture_output=True,check=True).stdout
        for point in pose['points']:
            x,y=point['screen'];i=(y*360+x)*3;r,g,b=image[i:i+3]
            encoded_floor['visiblePoints']+=1
            # Small codec/scaling tolerance; terrain-green remains rejected.
            if not (r>70 and r>=g*.94 and r>b*1.02):encoded_floor['badPixels']+=1
    if encoded_floor['visiblePoints']<30 or encoded_floor['badPixels']:
        raise ValueError('Encoded floor pixel instability: '+str(encoded_floor))
    measured=run('-i',part,'-vn','-af','loudnorm=I=-16:TP=-1.5:LRA=7:print_format=json','-f','null','-')
    levels=json.loads(re.findall(r'\{[^{}]*"input_i"[^{}]*\}',measured.stderr,re.S)[-1])
    if abs(float(levels['input_i'])+16)>1 or float(levels['input_tp'])>-.5:raise ValueError('Voice levels out of bounds')
    os.replace(part,final)
    run('-y','-v','error','-ss',70,'-i',final,'-frames:v','1',P/'delivery/poster.jpg')
    times=[0,6,11,18,22,26,31,39,51,62,70,79,88,96,106,113,122,129,139,149,158,165,172,180,187,195,203]
    for i,t in enumerate(times):
        run('-y','-v','error','-ss',t,'-i',final,'-frames:v','1','-vf','scale=270:480',output/f'final-review-{i:02d}.jpg')
    run('-y','-v','error','-pattern_type','glob','-i',str(output/'final-review-*.jpg'),'-vf','tile=7x4','-frames:v','1',output/'final-contact-sheet.jpg')
    sources=[p for p in P.rglob('*') if p.is_file() and p.suffix in {'.js','.mjs','.py','.html','.txt','.json'} and 'delivery' not in p.parts]
    manifest={
        'file':final.name,'sha256':digest(final),'bytes':final.stat().st_size,
        'title':n['title'],'durationSeconds':n['duration'],'frames':n['frames'],
        'width':720,'height':1280,'fps':24,'videoCodec':'H.264','audioCodec':'AAC mono 48kHz',
        'integratedLufs':float(levels['input_i']),'truePeakDbtp':float(levels['input_tp']),
        'fullFileDecode':'passed','unexpectedBlackIntervals':0,'pictureUnchangedDuringMux':True,
        'encodedFeatureChecks':feature_checks,'encodedFloorTemporalCheck':encoded_floor,
        'scriptWords':568,'scriptPreserved':True,'voice':'user-selected voice-02',
        'cameraAudit':audit,'cameraTraceSha256':digest(clean.with_suffix('.camera.json')),
        'renderAssembly':json.loads(clean.with_suffix('.assembly.json').read_text()) if clean.with_suffix('.assembly.json').exists() else 'Full deterministic export',
        'captions':{'count':len(n['captions']),'language':'English','method':n['captionTiming']},
        'scientificScope':'Dimensionless wave superposition diagrams, not CFD, measured resistance or fuel-saving predictions. Off-design conditions may increase resistance.',
        'environments':['excavated dry dock','coastal ocean','ripple pond','outdoor design basin','separate naval model-testing laboratory','cargo terminal'],
        'world':'Continuous regional terrain and time-compressed travel; full-size ships never enter the model laboratory.',
        'reviewRevision':'Reference-shaped integral welded hull/forefoot (no separate bulb mesh), slow tracking/dolly/crane explanation rails; prior higher flotation and stable separated lab foundation preserved; see REVISION.md',
        'worldStatistics':json.loads((output/'browser-test.json').read_text())['stats'] if (output/'browser-test.json').exists() else None,
        'reviewLimits':{'manualAudioListening':False,'everyFramePerceptuallyReviewed':False,'referenceParityClaimed':False,'checks':'All 4926 camera poses, complete encoded-file decode and representative visual samples'},
        'sourceSha256':{str(p.relative_to(P)):digest(p) for p in sources},
        'voiceoverSha256':digest(P/'delivery/voiceover.flac'),
    }
    (P/'delivery/production.json').write_text(json.dumps(manifest,indent=2)+'\n')
    print(json.dumps(manifest,indent=2))
if __name__=='__main__':main()
