"""Cut a source video into a vertical 1080x1920 clip ready for Remotion.

Usage:
  python prepare_clip.py SRC OUT --start 12.3 --end 15.8 [--focus 0.5] [--zoom 1.0] [--fps 30]
                         [--eq contrast=1.1:saturation=0.9] [--interp 60] [--sharpen 0.8] [--audio] [--hdr]

  --focus  horizontal center of the crop (0 = left edge, 1 = right edge) — put the face here
  --zoom   extra punch-in (>1 crops tighter around --focus / --focus-y)
  --interp optical-flow interpolate to this fps first (smoother slow motion), then output --fps
"""
import argparse
import json
import subprocess


def probe(src):
    out = subprocess.check_output([
        "ffprobe", "-v", "error", "-select_streams", "v:0",
        "-show_entries", "stream=width,height", "-of", "json", src])
    s = json.loads(out)["streams"][0]
    return s["width"], s["height"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("out")
    ap.add_argument("--start", type=float, required=True)
    ap.add_argument("--end", type=float, required=True)
    ap.add_argument("--focus", type=float, default=0.5)
    ap.add_argument("--focus-y", type=float, default=0.5)
    ap.add_argument("--zoom", type=float, default=1.0)
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--interp", type=int, default=0)
    ap.add_argument("--eq", default="")
    ap.add_argument("--hdr", action="store_true", help="source is HDR10 (PQ/BT.2020): tone-map to SDR BT.709")
    ap.add_argument("--audio", action="store_true", help="keep the clip's audio (dialogue) as AAC")
    ap.add_argument("--sharpen", type=float, default=0.0, help="unsharp amount after upscaling (0.5-1.0 for low-res sources)")
    a = ap.parse_args()

    w, h = probe(a.src)
    ch = int(h / a.zoom) // 2 * 2
    cw = int(ch * 9 / 16) // 2 * 2
    if cw > w:  # source narrower than 9:16 at this height
        cw = w // 2 * 2
        ch = int(cw * 16 / 9) // 2 * 2
    x = int(min(max(a.focus * w - cw / 2, 0), w - cw))
    y = int(min(max(a.focus_y * h - ch / 2, 0), h - ch))

    vf = [f"crop={cw}:{ch}:{x}:{y}"]
    if a.hdr:
        # mobius keeps skin tones natural and lifts dark films better than hable
        vf.append("zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=mobius:param=0.3:desat=0,"
                  "zscale=t=bt709:m=bt709:r=tv,format=yuv420p")
    vf.append("scale=1080:1920:flags=lanczos,setsar=1")
    if a.interp:
        vf.append(f"minterpolate=fps={a.interp}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1")
    if a.sharpen:
        vf.append(f"unsharp=5:5:{a.sharpen}:5:5:0")
    if a.eq:
        vf.append(f"eq={a.eq}")
    vf.append(f"fps={a.fps}")

    cmd = ["ffmpeg", "-loglevel", "error", "-y", "-ss", str(a.start), "-to", str(a.end), "-i", a.src,
           "-vf", ",".join(vf), *(["-c:a", "aac", "-b:a", "192k"] if a.audio else ["-an"]), "-c:v", "libx264", "-preset", "slow", "-crf", "14",
           "-g", "15", "-pix_fmt", "yuv420p", a.out]
    subprocess.check_call(cmd)
    print(f"{a.out}: crop {cw}x{ch}+{x}+{y} of {w}x{h}, {a.end - a.start:.2f}s")


if __name__ == "__main__":
    main()
