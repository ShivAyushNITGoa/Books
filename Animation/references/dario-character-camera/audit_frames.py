#!/usr/bin/env python3
"""Frame-complete reference diagnostics; NOT recovered 3D camera ground truth.
Requires numpy, opencv-python-headless and Pillow. Writes scratch files only to
an explicitly supplied output folder. Source media is not copied into the report.
"""
import argparse,csv,hashlib,json,math
from pathlib import Path
import cv2,numpy as np
from PIL import Image,ImageDraw,ImageFont
p=argparse.ArgumentParser();p.add_argument('video',type=Path);p.add_argument('output',type=Path);a=p.parse_args();a.output.mkdir(parents=True,exist_ok=True)
cap=cv2.VideoCapture(str(a.video));fps=cap.get(cv2.CAP_PROP_FPS);width=int(cap.get(3));height=int(cap.get(4))
if not cap.isOpened() or fps<=0 or width<=0 or height<=0:raise ValueError('Cannot open valid source video')
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',9)
smallfont=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',7)
rows=[];prev=None;prevhist=None;sheet=None;sheetno=0;overview=[]
mask=np.ones((640,360),np.uint8)*255
# Broad proxy for environment features: avoid common caption band, central cast.
mask[360:475,:]=0;mask[235:640,105:255]=0;mask[:12,:]=0

def affine(old,new,featuremask):
 pts=cv2.goodFeaturesToTrack(old,maxCorners=220,qualityLevel=.015,minDistance=6,mask=featuremask)
 if pts is None or len(pts)<8:return {}
 nxt,status,_=cv2.calcOpticalFlowPyrLK(old,new,pts,None,winSize=(21,21),maxLevel=3)
 valid=status[:,0].astype(bool);x=pts[valid,0];y=nxt[valid,0]
 valid=np.isfinite(y).all(axis=1)&(y[:,0]>=0)&(y[:,0]<360)&(y[:,1]>=0)&(y[:,1]<640);x=x[valid];y=y[valid]
 if len(x)<8:return {}
 M,inliers=cv2.estimateAffinePartial2D(x,y,method=cv2.RANSAC,ransacReprojThreshold=2.0,maxIters=1000)
 if M is None:return {}
 ok=inliers[:,0].astype(bool);delta=y-x;pred=cv2.transform(x.reshape(-1,1,2),M)[:,0]
 return {'tracks':int(len(x)),'inlierRatio':float(ok.mean()),'scale':float(np.hypot(M[0,0],M[1,0])),
 'rotationDegrees':float(math.degrees(math.atan2(M[1,0],M[0,0]))),'tx':float(M[0,2]),'ty':float(M[1,2]),
 'medianFlowX':float(np.median(delta[:,0])),'medianFlowY':float(np.median(delta[:,1])),
 'residualPixels':float(np.median(np.linalg.norm(pred-y,axis=1)))}
i=0
while True:
 ok,bgr=cap.read()
 if not ok:break
 gray=cv2.cvtColor(cv2.resize(bgr,(360,640)),cv2.COLOR_BGR2GRAY)
 hsv=cv2.cvtColor(cv2.resize(bgr,(180,320)),cv2.COLOR_BGR2HSV);hist=cv2.calcHist([hsv],[0,1],None,[32,32],[0,180,0,256]);cv2.normalize(hist,hist)
 record={'frame':i,'seconds':i/fps,'meanLuma':float(gray.mean()),'lumaStdDev':float(gray.std())}
 if prev is not None:
  record['meanAbsoluteDifference']=float(np.abs(gray.astype(float)-prev).mean())
  record['histogramDistance']=float(cv2.compareHist(prevhist,hist,cv2.HISTCMP_BHATTACHARYYA))
  record['global']=affine(prev,gray,None);record['environmentProxy']=affine(prev,gray,mask)
  record['largeChangeCandidate']=bool(record['meanAbsoluteDifference']>28 and record['histogramDistance']>.25)
 rows.append(record)
 rgb=cv2.cvtColor(bgr,cv2.COLOR_BGR2RGB)
 # Every decoded frame is represented once, in row-major order, 180/page.
 if i%180==0:
  if sheet is not None:sheet.save(a.output/f'all-frames-{sheetno:02d}.jpg',quality=84)
  sheetno+=1;sheet=Image.new('RGB',(960,1380),'#16191f');draw=ImageDraw.Draw(sheet)
  draw.text((8,4),f'PAGE {sheetno:02d} | frames {i} onward | {i/fps:.3f}s | 15 columns x 12 rows | EVERY frame',font=font,fill='white')
 tile=Image.fromarray(rgb).resize((64,114));drawtile=ImageDraw.Draw(tile);drawtile.rectangle((0,0,63,10),fill='#151821');drawtile.text((1,0),str(i),font=smallfont,fill='white')
 sheet.paste(tile,((i%180)%15*64,12+(i%180)//15*114))
 if i%60==0:
  tile=Image.fromarray(rgb).resize((180,320));d=ImageDraw.Draw(tile);d.rectangle((0,0,179,18),fill='#151821');d.text((4,2),f'{i/fps:06.2f}s / f{i}',font=font,fill='white');overview.append(tile)
 prev=gray;prevhist=hist;i+=1
cap.release()
if sheet is not None:sheet.save(a.output/f'all-frames-{sheetno:02d}.jpg',quality=84)
for start in range(0,len(overview),20):
 sheet=Image.new('RGB',(900,1280),'#16191f')
 for j,im in enumerate(overview[start:start+20]):sheet.paste(im,(j%5*180,j//5*320))
 sheet.save(a.output/f'overview-{start//20+1:02d}.jpg',quality=91)
(a.output/'per-frame.json').write_text(json.dumps(rows,separators=(',',':')))
fields=['frame','relativeSeconds','meanLuma','lumaStdDev','meanAbsoluteDifference','histogramDistance','largeChangeCandidate']
for group in ['global','environmentProxy']:
 for key in ['tracks','inlierRatio','scale','rotationDegrees','tx','ty','medianFlowX','medianFlowY','residualPixels']:fields.append(f'{group}.{key}')
with (a.output/'per-frame-audit.csv').open('w') as f:
 w=csv.DictWriter(f,fieldnames=fields,lineterminator='\n');w.writeheader()
 for r in rows:
  line={'frame':r['frame'],'relativeSeconds':round(r['seconds'],6)}
  for key in fields[2:]:
   if '.' in key:group,column=key.split('.');value=r.get(group,{}).get(column,'')
   else:value=r.get(key,'')
   line[key]=round(value,6) if isinstance(value,float) else value
  w.writerow(line)
summary={'fileBytes':a.video.stat().st_size,'sha256':hashlib.sha256(a.video.read_bytes()).hexdigest(),'width':width,'height':height,'fps':fps,'decodedFrames':i,'pictureDurationSeconds':i/fps,'adjacentFramePairs':i-1,'allFrameAtlasPages':sheetno,'atlasFramesPerPage':180,'overviewStepFrames':60,'largeChangeCandidates':[{'frame':r['frame'],'seconds':r['seconds']} for r in rows if r.get('largeChangeCandidate')],'caveats':['Affine feature flow is a screen-space diagnostic, not a measured 3D camera or focal length.','The fixed environment mask can include actors and moving graphics.','Cuts, occlusion, blur, lighting and depth parallax can invalidate a fit.','All-frame atlases are thumbnail-resolution evidence, not full-resolution facial inspection.']}
(a.output/'summary.json').write_text(json.dumps(summary,indent=2)+'\n');print(json.dumps(summary,indent=2))
