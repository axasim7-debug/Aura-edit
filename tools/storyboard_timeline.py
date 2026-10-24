# Cut storyboard sheets (3x3 tiles) into frames and re-tile them in time order with timestamps.
import glob, re, subprocess, sys
vid = sys.argv[1]; per_row = int(sys.argv[2]) if len(sys.argv) > 2 else 12
durs = [float(x) for x in re.findall(rb'duration: ([\d.]+)', open(f'sb_{vid}.mhtml', 'rb').read())]
sheets = sorted(glob.glob(f'sb_{vid}_*.jpg'))
frames = []; t0 = 0.0
for s, d in zip(sheets, durs):
    w, h = map(int, subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', s]).decode().split(','))
    tw, th = 161, 180
    rows = round(h / th); n = 3 * rows
    for k in range(n):
        t = t0 + d * k / 9
        if k >= round(9 * d / 8.85 + 0.49) and d < 8.8: break
        out = f'fr_{vid}_{len(frames):03d}.png'
        subprocess.run(['ffmpeg', '-loglevel', 'quiet', '-y', '-i', s, '-vf',
                        f"crop={tw}:{th}:{(k % 3) * tw}:{(k // 3) * th},drawtext=text='{t:.1f}':x=2:y=2:fontsize=13:fontcolor=yellow:box=1:boxcolor=black"], check=False)
        subprocess.run(['ffmpeg', '-loglevel', 'quiet', '-y', '-i', s, '-vf',
                        f"crop={tw}:{th}:{(k % 3) * tw}:{(k // 3) * th},drawtext=text='{t:.1f}':x=2:y=2:fontsize=13:fontcolor=yellow:box=1:boxcolor=black", out], check=True)
        frames.append(out)
    t0 += d
rows = (len(frames) + per_row - 1) // per_row
subprocess.run(['ffmpeg', '-loglevel', 'quiet', '-y', '-framerate', '1', '-i', f'fr_{vid}_%03d.png', '-vf', f'tile={per_row}x{rows}:color=black', '-frames:v', '1', f'tl_{vid}.png'], check=True)
print(vid, len(frames), 'frames ->', f'tl_{vid}.png')
