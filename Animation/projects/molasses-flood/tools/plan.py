#!/usr/bin/env python3
"""Derive shot boundaries from the measured narration, never shorten speech to fit."""
import json
from pathlib import Path
P=Path(__file__).resolve().parents[1]
n=json.loads((P/'narration.json').read_text())
# Per paragraph: world, action, label, lens start position, settled position, start aim, settled aim.
def shot(world, action, title, pos, end, aim, endaim=None):
    return dict(world=world,action=action,label=title,position=pos,to=end,target=aim,targetTo=endaim or aim)
specs=[
[
shot('street','wave','BOSTON • 1919',[-13,8,29],[-7,5.5,23],[0,2,0]),
shot('street','destruction','A STREET OVERWHELMED',[-14,7,20],[-9,5,14],[1,2,0]),
shot('rescue','struggle','THICK. HEAVY. DIFFICULT TO ESCAPE.',[-4,3.6,8],[-2.7,2.8,6.4],[0,1.2,0]),
shot('detail','reveal','NOT WATER',[4,3.6,7],[2.5,2.7,5],[0,1.1,0]),
shot('detail','reveal','NOT AN AVALANCHE',[2.5,2.7,5],[-2,3.6,6],[0,1.1,0]),
shot('detail','reveal','MOLASSES',[-2,3.6,6],[0,2.8,5.5],[0,1.1,0]),
],
[
shot('street','ordinary','JANUARY 15, 1919 • NORTH END',[-24,24,43],[-13,15,32],[0,6,-20]),
shot('street','foreshadow','ONE STORAGE TANK',[-20,18,10],[-14,12,3],[0,9,-35]),
shot('street','tank','50 FT TALL • 2.3 MILLION GALLONS',[-29,22,19],[-24,18,10],[0,8,-35]),
shot('factory','barrel','NOT JUST PANCAKE SYRUP',[-5,4,8],[-3,3,6],[0,1.4,0]),
shot('factory','distill','MOLASSES → INDUSTRIAL ALCOHOL',[5,4,10],[3.5,3.1,7],[0,1.5,-1]),
],
[
shot('leak','inspect','BUILT IN 1915',[-5,3.7,8],[-3.5,2.8,6],[0,1.4,0]),
shot('leak','drip','THE WARNING WAS VISIBLE',[-1.5,2.5,5],[-1,2.2,3.7],[0,1.4,-1]),
shot('leak','bucket','CHILDREN COLLECTED THE LEAKS',[4,3.5,7],[2.8,2.6,5],[0,1.2,0]),
shot('leak','paint','BROWN PAINT, NOT A REPAIR',[-4,3.8,7],[-2.8,2.9,5],[0,1.5,-.8]),
],
[
shot('street','ordinary','AN ORDINARY JANUARY AFTERNOON',[-10,6,22],[-7,4.5,16],[0,2,0]),
shot('leak','rumble','AROUND 12:30 P.M.',[-4,3.4,7],[-2.3,2.6,5],[0,1.6,-.7]),
shot('street','rupture','THE STEEL TANK RUPTURED',[-24,18,14],[-18,12,8],[0,7,-24]),
shot('street','wave','REPORTED HEIGHT ≈ 15 FT',[-16,9,25],[-11,7,19],[0,2,0]),
shot('street','speed','ESTIMATED 35 MPH • 56 KM/H',[-13,8,22],[-8,5.5,19],[0,2,1]),
],
[
shot('street','wave','FASTER THAN A PERSON COULD RUN',[0,4.5,26],[-3,3.8,20],[0,2,1]),
shot('street','destruction','HOMES, STREETS AND LIVELIHOODS',[-15,8,20],[-10,5,15],[-3,2,0]),
shot('street','train','DAMAGED SUPPORTS • TRAIN STOPPED SHORT',[14,12,25],[12,8,18],[7,5,-1]),
],
[
shot('rescue','struggle','ESCAPE WAS NOT SIMPLE',[4,3.7,8],[2.8,2.8,6],[0,1.2,0]),
shot('detail','viscosity','DENSITY + VISCOSITY',[-4,4,7],[-2.5,2.8,5.5],[0,1.2,0]),
shot('rescue','struggle','COOLING MADE IT THICKER',[-4,3.4,7],[-3,2.8,5.5],[0,1.2,0]),
shot('rescue','arrive','POLICE • FIRE • NAVY • RED CROSS',[5,4,11],[3.5,3.2,8],[0,1.3,0]),
shot('rescue','rope','RESCUE, ONE PERSON AT A TIME',[-5,4.5,8],[-3.6,3.2,6],[0,1,0]),
shot('memorial','loss','21 PEOPLE KILLED • ABOUT 150 INJURED',[0,5,12],[0,3.6,9],[0,1.5,0]),
],
[
shot('office','evidence','THIS WAS NOT JUST BAD LUCK',[-5,4.3,8],[-3.7,3.1,6],[0,1.3,0]),
shot('office','plate','A PREVENTABLE STRUCTURAL FAILURE',[4,4,8],[2.7,3,6],[0,1.4,0]),
shot('office','measure','THIN STEEL • INADEQUATE TESTING',[-4,4,7],[-2.8,3.3,5.5],[0,1.3,0]),
shot('leak','inspect','REPEATED LEAKS WERE IGNORED',[4,3.7,7],[3,2.8,5],[0,1.4,-.5]),
shot('court','verdict','THE COMPANY WAS HELD RESPONSIBLE',[-5,4,10],[-3,3.2,8],[0,1.8,-1]),
],
[
shot('street','cleanup','THE CLEANUP TOOK WEEKS',[-15,12,30],[-9,8,23],[0,1,0]),
shot('rescue','wash','SALT WATER + SAND',[5,4.5,10],[3.3,3.3,7],[0,1.2,0]),
shot('harbor','brownwater','MOLASSES REACHED THE HARBOR',[-10,9,18],[-7,6.5,14],[0,1,-3]),
shot('office','permit','STRONGER ENGINEERING OVERSIGHT',[4.5,4.2,8],[2.7,3.1,6],[0,1.4,0]),
shot('memorial','remember','THE GREAT MOLASSES FLOOD',[-4,4.5,11],[-2.5,3.5,8],[0,1.5,0]),
shot('street','aftermath','NOT A NATURAL DISASTER',[-20,18,36],[-13,12,28],[0,4,-12]),
shot('leak','final','WARNING SIGNS MATTER',[-5,3.5,8],[-3,2.7,6],[0,1.4,-.5]),
]]
# Merge the tiny question with the NOT WATER paragraph for a readable shot.
paras=[c['text'].split('\n\n') for c in n['chapters']]
paras[0][3:5]=['\n\n'.join(paras[0][3:5])]
shots=[]
for c,pp,ss in zip(n['chapters'],paras,specs):
    assert len(pp)==len(ss),(c['index'],len(pp),len(ss))
    cues=[x for x in n['captions'] if x['start']>=c['start'] and x['start']<c['end']]
    # Piecewise interpolation through measured caption endpoints and cumulative word counts.
    points=[(0,c['speechStart'])];w=0
    for cue in cues:
        w+=len(cue['text'].split());points.append((w,cue['end']))
    def at(word):
        for (wa,ta),(wb,tb) in zip(points,points[1:]):
            if word<=wb:return ta+(tb-ta)*(word-wa)/(wb-wa)
        return c['end']
    consumed=0
    for i,(text,s) in enumerate(zip(pp,ss)):
        start=c['start'] if i==0 else at(consumed)
        consumed+=len(text.split());end=c['end'] if i==len(pp)-1 else at(consumed)
        s.update(id=f"s{len(shots)+1:02}",chapter=c['index'],start=start,end=end,text=text)
        shots.append(s)
shots[0]['start']=0;shots[-1]['end']=n['duration']
# Portrait framing reviewed at native resolution: subject + task must fit, not just the set origin.
for s in shots:
    w,a=s['world'],s['action']
    if w=='leak':
        if a=='drip':s.update(position=[-2.7,3.1,5.4],to=[-2.2,2.6,4.5],target=[-1.5,1.4,-1.5],targetTo=[-1.5,1.4,-1.5])
        else:s.update(position=[-5.5,4.8,11] if s['position'][0]<0 else [5.5,4.8,11],to=[-3.8,3.6,9] if s['to'][0]<0 else [3.8,3.6,9],target=[.3,1.5,-.7],targetTo=[.3,1.5,-.7])
    if w in ['office','factory','court']:
        side=-1 if s['to'][0]<0 else 1
        s.update(position=[side*5,5.5,14.5],to=[side*2.6,4.6,12.5],target=[0,1.5,-.6],targetTo=[0,1.5,-.6])
    if w=='office':s.update(position=[-4.5 if s['position'][0]<0 else 4.5,4.6,11],to=[-2.2 if s['to'][0]<0 else 2.2,3.6,9.5],target=[0,1.3,.1],targetTo=[0,1.3,.1])
    if w=='detail':s.update(position=[-4 if s['position'][0]<0 else 4,4.2,10],to=[-2 if s['to'][0]<0 else 2,3.4,8.3],target=[0,1.7,0],targetTo=[0,1.7,0])
    if w=='rescue':
        s.update(position=[-6 if s['position'][0]<0 else 6,5.8,18],to=[-2 if s['to'][0]<0 else 2,4.8,16],target=[1.5,1.3,0],targetTo=[1.5,1.3,0])
        if a=='struggle':s.update(position=[-4,3.8,9],to=[-2.7,2.8,6.8],target=[-.7,1.1,0],targetTo=[-.7,1.1,0])
    if w=='street' and a in ['ordinary','foreshadow','tank'] and s['chapter']==2:s.update(position=[-43,34,61],to=[-34,27,52],target=[0,8,-30],targetTo=[0,8,-30])
    if w=='street' and a=='rupture':s.update(position=[-35,26,40],to=[-28,20,33],target=[0,7,-28],targetTo=[0,7,-28])
    if w=='street' and a in ['wave','speed','destruction']:
        aim=s['targetTo']
        for k in ['position','to']:s[k]=[aim[i]+(s[k][i]-aim[i])*1.35 for i in range(3)]
    if w=='office' and a=='permit':s['label']='REVIEW • INSPECTION • ACCOUNTABILITY'

(P/'direction/shots.json').write_text(json.dumps(shots,indent=2)+'\n')
lines=['# Shot-by-shot edit decision list','', 'Timing is derived from measured narration activity and word-weight caption landmarks; not forced phoneme alignment. Each shot uses a motivated 0.7–1.1 s transfer followed by a readable settle.','', '| Shot | Seconds | Set / action | On-screen anchor |', '|---|---:|---|---|']
for s in shots:lines.append(f"| {s['id']} | {s['start']:.2f}–{s['end']:.2f} | {s['world']} / {s['action']} | {s['label']} |")
(P/'direction/SHOT_LIST.md').write_text('\n'.join(lines)+'\n')
print(f'{len(shots)} authored shots over {n["duration"]:.3f} seconds')
