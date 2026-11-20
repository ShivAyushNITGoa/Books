"""TV12 revision: continuous subpixel motion, heuristic 2.5D, centered dissolves.
Run from repository root. Requires numpy, opencv-python-headless, imageio-ffmpeg.
Depth is a soft center/lower-frame heuristic, NOT an estimated scene depth map.
"""
from pathlib import Path
import subprocess
import cv2
import numpy as np
import imageio_ffmpeg

ROOT = Path(__file__).resolve().parents[1]
W, H, FPS, SECONDS = 1280, 720, 24, 30
STARTS = [0, 3, 7, 9, 14, 18, 22, 26, 29]
LABELS = ['0-00','0-03','0-07','0-09','0-14','0-18','0-22','0-26','0-29']
DISSOLVE = 0.5

def render():
    cv2.setNumThreads(2)
    images = [cv2.imread(str(ROOT/'images_tv12'/f'{label}.jpg')) for label in LABELS]
    if any(im is None for im in images):
        raise RuntimeError('Missing source image')
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    # Smooth continuous displacement avoids cutout edges and doubled subjects.
    depth = np.exp(-(((xx/W-.5)/.40)**2 + ((yy/H-.60)/.65)**2)*1.5)
    depth = (depth * .8 + (yy/H)*.2).astype(np.float32)
    def frame(i, t):
        im = images[i]
        ih, iw = im.shape[:2]
        end = STARTS[i+1] if i+1 < len(STARTS) else SECONDS
        u = np.clip((t-STARTS[i]+DISSOLVE/2)/(end-STARTS[i]+DISSOLVE), 0, 1)
        ease = u*u*(3-2*u)
        # Small constant-direction glide and shallow push, without oscillations.
        z = 1.018 + .025*ease
        scale = min(iw/W, ih/H)/z
        direction = 1 if (i//3)%2 == 0 else -1
        travel = (ease-.5)*direction
        mx = (xx-W/2)*scale + iw/2 + travel*8 + depth*travel*5
        my = (yy-H/2)*scale + ih/2 + (ease-.5)*2 + depth*(ease-.5)*2
        return cv2.remap(im, mx.astype(np.float32), my.astype(np.float32), cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT_101)
    out = ROOT/'output/tv12_demo_v2_smooth_depth.mp4'
    out.parent.mkdir(exist_ok=True)
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    cmd = [ff,'-y','-hide_banner','-loglevel','warning','-f','rawvideo','-pix_fmt','bgr24',
           '-s',f'{W}x{H}','-r',str(FPS),'-i','pipe:0','-i',str(ROOT/'video 12 full audio.mp3'),
           '-map','0:v:0','-map','1:a:0','-t',str(SECONDS),
           '-vf','scale=in_range=full:out_range=tv,format=yuv420p',
           '-c:v','libx264','-preset','medium','-crf','20','-color_range','tv',
           '-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709',
           '-c:a','aac','-b:a','160k','-ar','48000','-movflags','+faststart',str(out)]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    try:
        for n in range(SECONDS*FPS):
            t = n/FPS
            i = max(j for j,s in enumerate(STARTS) if s <= t)
            near = next((j for j in range(1,len(STARTS)) if abs(t-STARTS[j]) < DISSOLVE/2), None)
            if near is not None:
                a = (t-STARTS[near]+DISSOLVE/2)/DISSOLVE
                a = a*a*(3-2*a)
                result = cv2.addWeighted(frame(near-1,t),1-a,frame(near,t),a,0)
            else:
                result = frame(i,t)
            p.stdin.write(result.tobytes())
            if n%120 == 0:
                print(f'{n}/{SECONDS*FPS} frames',flush=True)
    finally:
        p.stdin.close()
    if p.wait():
        raise RuntimeError('FFmpeg failed')
    print(out, flush=True)

if __name__ == '__main__':
    render()
