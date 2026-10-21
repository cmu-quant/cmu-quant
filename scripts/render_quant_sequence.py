"""Render the calm, fixed-camera hero. Requires Python, numpy, Pillow, and ffmpeg.
Usage: python3 scripts/render_quant_sequence.py OUTPUT_DIRECTORY
Seeded random walks are decorative simulations, not market data.
"""
from pathlib import Path
import subprocess
import sys
import numpy as np
from PIL import Image, ImageDraw

W, H, FPS, FRAMES = 1920, 1080, 24, 240
OUT = Path(sys.argv[1] if len(sys.argv) > 1 else "media/render")
OUT.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(22627)
ORIGIN = np.array([530., 540.])
STEPS, COUNT = 260, 180
x = np.linspace(ORIGIN[0], 1750, STEPS + 1)
walks = np.c_[np.zeros(COUNT), np.cumsum(rng.normal(0, 10.5, (COUNT, STEPS)), axis=1)]
# Frame the complete simulation, including outliers, without moving the camera.
path_scale = 410 / np.max(np.abs(walks))
walks *= path_scale
delays = rng.uniform(0, .45, COUNT)
levels = rng.uniform(.32, .72, COUNT)
particles = rng.normal(0, 1, (130, 2)) * np.array([63, 40])
phases = rng.uniform(0, 2 * np.pi, (130, 2))
radii = rng.uniform(.6, 1.4, 130)
blue = np.array([122,149,184])
warm = np.array([237,230,218])
gold = np.array([201,168,76])
red = np.array([196,18,48])

def smooth(a, b, value):
    u = np.clip((value-a)/(b-a), 0., 1.)
    return float(u*u*(3-2*u))

# A compact soft origin; no lens flare, bloom pass, or camera transformation.
yy, xx = np.mgrid[-65:66, -65:66]
rr = np.hypot(xx, yy)
core = np.exp(-(rr/8.5)**4)
halo = .18 * np.exp(-(rr/20)**2)
light = np.clip(core[...,None]*warm + halo[...,None]*blue, 0, 255).astype(np.uint8)
highlight = walks[24]
# Keep the highlighted sample reasonably central, without changing its jagged increments.
highlight = highlight - np.linspace(0, highlight[-1] * .55, STEPS + 1)

def line(draw, ys, end, color, width=1):
    n = min(STEPS, max(0, int(end)))
    if n < 1:
        return
    pts = list(zip(x[:n+1], ORIGIN[1] + ys[:n+1]))
    if n < STEPS:
        f = end - n
        pts.append((x[n] + (x[n+1]-x[n])*f, ORIGIN[1]+ys[n]+(ys[n+1]-ys[n])*f))
    draw.line(pts, fill=tuple(int(v) for v in color), width=width)

def render(t):
    im = Image.new("RGB", (W,H))
    d = ImageDraw.Draw(im)
    # The cloud eases outward slowly and dissolves as the first trajectories appear.
    spread = smooth(.15, 1.85, t)
    particle_alpha = smooth(.1, .8, t) * (1-smooth(2.0, 3.15, t))
    for i, p in enumerate(particles):
        pos = ORIGIN + p*spread + 1.3*np.sin(phases[i] + t*.9)*spread
        r = radii[i]
        color = tuple(int(c*particle_alpha*.65) for c in warm)
        d.ellipse((pos[0]-r,pos[1]-r,pos[0]+r,pos[1]+r),fill=color)
    # Lines grow left-to-right within fixed world coordinates.
    for i, ys in enumerate(walks):
        growth = smooth(2.0+delays[i], 5.9+delays[i], t)
        opacity = levels[i] * smooth(2.0+delays[i], 2.75+delays[i], t)
        line(d, ys, STEPS*growth, blue*opacity)
    boundary_alpha = smooth(5.0, 6.9, t) * .43
    envelope = 1.7 * 10.5 * path_scale * np.sqrt(np.arange(STEPS+1))
    for side in (-1,1):
        line(d, envelope*side, STEPS, gold*boundary_alpha)
    red_growth = smooth(6.1, 7.8, t)
    line(d, highlight, STEPS*red_growth, red*smooth(6.1,6.7,t)*.93, width=2)
    # The opening sphere softens to a small origin as the particles spread.
    origin_scale = 1 - .66*smooth(.45, 2.2, t)
    glow = Image.fromarray((light*origin_scale).astype(np.uint8))
    im.paste(glow,(int(ORIGIN[0])-65,int(ORIGIN[1])-65),Image.fromarray(np.clip((core+halo)*255,0,255).astype(np.uint8)))
    fade = 1-smooth(8.0,9.8,t)
    if fade < 1:
        im = Image.fromarray((np.asarray(im)*fade).astype(np.uint8))
    return im

cmd = ["ffmpeg","-hide_banner","-loglevel","error","-y","-f","rawvideo",
       "-pixel_format","rgb24","-video_size",f"{W}x{H}","-framerate",str(FPS),
       "-i","-","-an","-c:v","libx264","-preset","medium","-crf","19",
       "-pix_fmt","yuv420p","-g","6","-keyint_min","6","-sc_threshold","0",
       "-bf","0","-movflags","+faststart",str(OUT/"quant-sequence.mp4")]
p = subprocess.Popen(cmd,stdin=subprocess.PIPE)
try:
    for frame in range(FRAMES):
        im = render(frame/FPS)
        p.stdin.write(im.tobytes())
        if frame == 0:
            im.save(OUT/"hero-calm-origin.jpg", quality=95)
        if frame in (0,36,84,144,180,239):
            im.resize((768,432),Image.Resampling.LANCZOS).save(OUT/f"review-{frame:03}.jpg", quality=88)
finally:
    p.stdin.close()
if p.wait():
    raise SystemExit("ffmpeg failed")
print(f"Rendered {FRAMES} frames at {FPS}fps; fixed camera, pure-black final frame.")

