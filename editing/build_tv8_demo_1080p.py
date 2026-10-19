#!/usr/bin/env python3
"""TV8 Demo 1080p — advanced but lightweight, no vertical blur wipe.
Renders cues 14-25 (50.55-87.77s, 37.2s) at 1920x1080, segmented then concat.
Features retained: Bezier easing, rack-focus, speed ramp, punch-in/whip, grade by keyword, bloom, dust, sweep, progress orbs, stream-copy audio.
Run: python3 editing/build_tv8_demo_1080p.py --out tv8_demo_adv_1080p.mp4
"""
from __future__ import annotations
import argparse, json, subprocess, sys, hashlib
from pathlib import Path
ROOT=Path.cwd()
sys.path.insert(0, str(ROOT/"editing"))
import build_video as core
FPS=24; W,H=1920,1080
AUDIO=ROOT/"audio/tv8_master.mp3"; SRT=ROOT/"tv8.srt"; IMAGES=ROOT/"images_tv8"; CLASSES=ROOT/"prompts/cue_classes.json"
DARK_KW=["शिकायत","डर","रुकता","रोकता","कमी","मना","टूट","शक"]; LIGHT_KW=["ताकत","काबिल","मौका","कर सकता","सीखो","बनाना","समझो","कदम","आगे","बढ़ाओ"]
def infer_mood(text):
    for k in DARK_KW:
        if k in text: return "dark"
    for k in LIGHT_KW:
        if k in text: return "light"
    return "neutral"
def make_sweep():
    from PIL import Image
    p=Path("/tmp/tv8_sweep_1080.png"); w,h=W*2,H
    im=Image.new("RGBA",(w,h),(0,0,0,0)); px=im.load()
    for y in range(0,h,2):
        for x in range(0,w,2):
            u=x/w; a=max(0.0,1.0-abs(u-0.42)*3.2)**2; v=int(232*a*0.38)
            r,gg,bb=255,216,168
            px[x,y]=(r,gg,bb,v)
            if x+1<w: px[x+1,y]=(r,gg,bb,v)
            if y+1<h:
                px[x,y+1]=(r,gg,bb,v)
                if x+1<w: px[x+1,y+1]=(r,gg,bb,v)
    im.save(p); return p
def make_dust():
    from PIL import Image, ImageDraw
    import random
    p=Path("/tmp/tv8_dust_1080.png"); random.seed(11)
    im=Image.new("RGBA",(W,H),(0,0,0,0)); d=ImageDraw.Draw(im)
    for _ in range(180):
        x=random.randint(0,W-1); y=random.randint(0,H-1); r=random.randint(1,2); a=random.randint(55,95)
        d.ellipse([x-r,y-r,x+r,y+r], fill=(255,230,180,a))
    im.save(p); return p
def make_progress(idx=1,total=10):
    from PIL import Image, ImageDraw
    p=Path(f"/tmp/tv8_prog1080_{idx}.png"); iw,ih=360,44
    im=Image.new("RGBA",(iw,ih),(0,0,0,0)); d=ImageDraw.Draw(im)
    d.rounded_rectangle([0,0,iw-1,ih-1], radius=10, fill=(12,8,6,135), outline=(80,50,30,90), width=1)
    gap,left,cy,r=26,14,ih//2,6
    for i in range(total):
        x=left+i*gap; lit=i<idx
        if lit:
            for g in [9,5]: d.ellipse([x-g,cy-g,x+g,cy+g], fill=(255,200,90,16))
            d.ellipse([x-r,cy-r,x+r,cy+r], fill=(255,190,70,255), outline=(255,230,160,170), width=1)
        else: d.ellipse([x-r,cy-r,x+r,cy+r], outline=(90,70,50,130), width=1)
    im.save(p); return p

def render_cue(ffmpeg, shot, out_path, sweep, dust, prog):
    n=shot["n"]; pol=shot["tag"]; cls=pol.get("class","story"); energy=float(pol.get("energy",0.6)); mood=infer_mood(shot["text"]); ax,ay=core.image_anchor(shot["image"]); nframes=shot["frames"]; dur=shot["dur"]
    seed=int(hashlib.md5(f"s{n}".encode()).hexdigest(),16)%23
    # Bezier multi-phase
    t=f"(on/{max(nframes-1,1)})"; hold=f"min(max(({t}-0.15)/0.70,0),1)"; e=f"({hold}*{hold}*(3-2*{hold}))"; ramp=f"(1+0.16*pow(max(({t}-0.82)/0.18,0),2))"
    z=f"1+{0.024:.4f}*{e}*{ramp}" if cls!="word" else f"1+{0.012:.4f}*{e}"
    if cls=="chapter": z=f"1+{0.016:.4f}*{e}"
    if cls=="host": pan= -0.014
    else: pan= 0.022
    wob=f"0.0013*sin(on*0.117+{seed})+0.0008*sin(on*0.041+{seed+5})"
    x=f"(iw-iw/zoom)*({ax:.3f}+({pan:.4f})*{e})+(iw-iw/zoom)*({wob})"
    y=f"(ih-ih/zoom)*{ay:.3f}+(ih-ih/zoom)*0.0011*sin(on*0.053+{seed+7})"
    do_punch=dur>=3.8 and cls in ("story","punch") and energy>0.74
    do_whip=dur>=4.6 and (n%3==1) and cls=="story"
    # grade
    if mood=="dark": c,sat=1.05,0.88; cb="rs=-0.018:bs=0.022"
    elif mood=="light": c,sat=1.04,1.06; cb="rs=0.020:rm=0.012"
    else: c,sat=1.035,1.00; cb="rs=0.012:bs=-0.004"
    if cls=="chapter": c,sat=1.09,0.84
    br="-0.075*exp(-2.4*t)"
    if cls=="chapter": br+="+0.08*exp(-3.2*t)"
    steps=[]
    # rack focus settle
    steps.append("boxblur=luma_radius=4:luma_power=1:enable='lt(t,0.22)'")
    steps.append("boxblur=luma_radius=2:luma_power=1:enable='between(t,0.22,0.5)'")
    if cls in ("story","punch") and nframes>45: steps.append("tmix=frames=2:weights='0.60 0.40'")
    steps.append(f"eq=brightness='{br}':contrast={c:.3f}:saturation={sat:.3f}:eval=frame")
    steps.append(f"colorbalance={cb}:gs=0.004:bm=-0.008")
    steps.append("rgbashift=rh=1:bh=-1")
    steps.append(f"scale=2048:1152:flags=lanczos,rotate='0.0015*sin(t*0.16+{seed})':fillcolor=black:ow=iw:oh=ih,crop={W}:{H}")
    steps.append("vignette=angle=PI/4.2")
    steps.append("noise=alls=4:allf=t+u")
    chain=",".join(steps)
    # base filter: scale->crop->zoompan->grade chain then split for bloom
    graph=[]
    graph.append(f"[0:v]scale={W}:{H}:force_original_aspect_ratio=increase:flags=lanczos,crop={W}:{H},zoompan=z='{z}':x='{x}':y='{y}':d={nframes}:s={W}x{H}:fps={FPS},{chain},split=2[base][bsrc]")
    graph.append(f"[bsrc]curves=all='0/0 0.62/0 0.84/0.28 1/0.55',gblur=sigma=8[glow]")
    graph.append(f"[base][glow]blend=all_mode=screen:all_opacity=0.10[graded]")
    if do_punch and not do_whip:
        f2=min(int(nframes*0.38), int(2.2*FPS)); f2=max(f2, int(0.9*FPS)); f1=nframes-f2
        ax2=min(0.72, ax+0.07); ay2=min(0.68, ay+0.04)
        graph.append(f"[graded]split=2[g1][g2s]")
        graph.append(f"[g1]trim=start_frame=0:end_frame={f1},setpts=PTS-STARTPTS[p1]")
        graph.append(f"[g2s]scale=iw*1.10:ih*1.10:flags=lanczos,crop={W}:{H}:x='(in_w-out_w)*{ax2:.3f}':y='(in_h-out_h)*{ay2:.3f}',trim=start_frame={f1}:end_frame={nframes},setpts=PTS-STARTPTS[p2]")
        graph.append(f"[p1][p2]concat=n=2:v=1:a=0[pre]")
    elif do_whip:
        f1=int(nframes*0.55); f2=nframes-f1
        graph.append(f"[graded]split=2[w1][w2]")
        graph.append(f"[w1]trim=start_frame=0:end_frame={f1},setpts=PTS-STARTPTS[wh1]")
        graph.append(f"[w2]crop={W}:{H}:x='(in_w-out_w)*(0.12+0.76*(n/{max(f2,1)}))':y='(in_h-out_h)*{ay:.3f}',tmix=frames=2:weights='0.55 0.45',trim=start_frame={f1}:end_frame={nframes},setpts=PTS-STARTPTS[wh2]")
        graph.append(f"[wh1][wh2]concat=n=2:v=1:a=0[pre]")
    else:
        graph.append(f"[graded]trim=end_frame={nframes},setpts=PTS-STARTPTS[pre]")
    graph.append(f"[pre][1:v]overlay=x='-5*mod(n,360)':y='3*mod(n,300)':eval=frame:format=rgb[dusted]")
    graph.append(f"[dusted][2:v]overlay=x=W-w-20:y=H-h-20:eval=frame[withprog]")
    graph.append(f"[withprog][3:v]overlay=x='-w+2*W*(n/{max(nframes,1)})':y=0:eval=frame,format=yuv420p[vid]")
    fc=";".join(graph)
    cmd=[ffmpeg,"-y","-hide_banner","-loglevel","error","-loop","1","-t",f"{dur:.3f}","-i",str(shot["image"]),"-loop","1","-t",f"{dur:.3f}","-i",str(dust),"-loop","1","-t",f"{dur:.3f}","-i",str(prog),"-loop","1","-t",f"{dur:.3f}","-i",str(sweep),"-filter_complex",fc,"-map","[vid]","-frames:v",str(nframes),"-c:v","libx264","-preset","medium","-crf","23","-pix_fmt","yuv420p","-r",str(FPS),str(out_path)]
    r=subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode!=0:
        print(r.stderr[-1500:]); raise RuntimeError(f"cue {n} failed")
    return out_path

def main():
    ap=argparse.ArgumentParser(); ap.add_argument("--out", default="tv8_demo_adv_1080p.mp4"); args=ap.parse_args()
    ffmpeg=core.find_ffmpeg()
    cues_all=core.parse_srt(SRT); class_map={int(k):v for k,v in json.loads(CLASSES.read_text()).items()}
    start_idx=13; end_idx=25
    cues=cues_all[start_idx:end_idx]
    total=cues_all[end_idx]["start"]-cues_all[start_idx]["start"]
    base=cues_all[start_idx]["start"]
    for c in cues: c["start"]-=base; c["end"]-=base
    core.IMG_DIR=IMAGES; idx=core.index_images()
    shots=[]
    for c in cues:
        img=core.find_image(idx,c["label"],c["n"])
        if not img: sys.exit(f"missing {c['label']}")
        shots.append({**c, "image":img, "tag":class_map.get(c["n"],{})})
    target_frames=round(total*FPS)
    for idx_s,s in enumerate(shots[:-1]):
        nxt=cues[idx_s+1]; dur=nxt["start"]-s["start"]; s["dur"]=dur; s["frames"]=max(int(dur*FPS),2)
    last=shots[-1]; last["dur"]=total-last["start"]; last["frames"]=max(target_frames-sum(x["frames"] for x in shots[:-1]),2)
    sweep=make_sweep(); dust=make_dust(); prog=make_progress(1,10)
    out_dir=Path("/tmp/tv8_1080_segs"); out_dir.mkdir(exist_ok=True)
    seg_files=[]
    print(f"TV8 1080p segmented: cues {shots[0]['n']}-{shots[-1]['n']} {total:.2f}s {target_frames}f {len(shots)} imgs @ {W}x{H}")
    for s in shots:
        print(f"  {s['n']:3d} {s['label']:8s} {s['frames']:3d}f {s['dur']:.2f}s {s['tag'].get('class','?'):8s} mood={infer_mood(s['text'])}")
        out=out_dir/f"{s['n']:03d}.mp4"
        render_cue(ffmpeg,s,out,sweep,dust,prog)
        seg_files.append(out)
        print(f"    -> done {out.stat().st_size/1024:.0f}KB")
    lst=out_dir/"concat.txt"; lst.write_text("".join(f"file '{p}'\n" for p in seg_files))
    vid=Path("/tmp/tv8_1080_video.mp4")
    subprocess.run([ffmpeg,"-y","-hide_banner","-loglevel","error","-f","concat","-safe","0","-i",str(lst),"-c","copy",str(vid)], check=True)
    out=ROOT/args.out
    # Mux slice of master audio exactly from base offset, copy (mp3 in mp4)
    subprocess.run([ffmpeg,"-y","-hide_banner","-loglevel","error","-stats","-i",str(vid),"-ss",f"{base:.3f}","-t",f"{total:.3f}","-i",str(AUDIO),"-map","0:v:0","-map","1:a:0","-c:v","copy","-c:a","copy","-t",f"{total:.3f}","-movflags","+faststart",str(out)], check=True)
    print(f"DONE {out} {out.stat().st_size/1e6:.1f} MB @ {W}x{H}")
    subprocess.run([ffmpeg,"-hide_banner","-i",str(out)], check=False)
    return 0
if __name__=="__main__": raise SystemExit(main())
