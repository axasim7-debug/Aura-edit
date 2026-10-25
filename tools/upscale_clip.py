"""AI-upscale a low-resolution crop with Real-ESRGAN (realesr-general-x4v3) on CPU.

Use it for vertical crops from 1080p / letterboxed sources (e.g. 452x804) instead of a plain
lanczos stretch, which is what makes action shots look smeared after the 9:16 crop.

Usage:
  python upscale_clip.py IN.mp4 OUT.mp4 --model realesr-general-x4v3.pth [--fps 24] [--denoise 0.5]

Pipeline: decode frames -> x4 Real-ESRGAN -> lanczos down to 1080x1920 -> x264 crf 14.
The architecture (SRVGGNetCompact) is defined here so only torch is required.
"""
import argparse
import subprocess

import numpy as np
import torch
from torch import nn
from torch.nn import functional as F


class SRVGGNetCompact(nn.Module):
    def __init__(self, num_feat=64, num_conv=32, upscale=4):
        super().__init__()
        self.upscale = upscale
        body = [nn.Conv2d(3, num_feat, 3, 1, 1), nn.PReLU(num_parameters=num_feat)]
        for _ in range(num_conv):
            body += [nn.Conv2d(num_feat, num_feat, 3, 1, 1), nn.PReLU(num_parameters=num_feat)]
        body += [nn.Conv2d(num_feat, 3 * upscale * upscale, 3, 1, 1)]
        self.body = nn.ModuleList(body)
        self.upsampler = nn.PixelShuffle(upscale)

    def forward(self, x):
        out = x
        for layer in self.body:
            out = layer(out)
        return self.upsampler(out) + F.interpolate(x, scale_factor=self.upscale, mode="nearest")


def probe(path):
    out = subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                                   "stream=width,height,r_frame_rate", "-of", "csv=p=0", path]).decode().strip()
    w, h, r = out.split(",")
    return int(w), int(h), r


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("inp")
    ap.add_argument("out")
    ap.add_argument("--model", required=True)
    ap.add_argument("--fps", default="")
    ap.add_argument("--threads", type=int, default=0)
    a = ap.parse_args()
    if a.threads:
        torch.set_num_threads(a.threads)

    net = SRVGGNetCompact()
    sd = torch.load(a.model, map_location="cpu")
    net.load_state_dict(sd.get("params", sd))
    net.eval()

    w, h, rate = probe(a.inp)
    dec = subprocess.Popen(["ffmpeg", "-v", "error", "-i", a.inp, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                           stdout=subprocess.PIPE)
    vf = "scale=1080:1920:flags=lanczos,setsar=1" + (f",fps={a.fps}" if a.fps else "")
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
                            "-s", f"{w * 4}x{h * 4}", "-r", rate, "-i", "-", "-vf", vf, "-c:v", "libx264",
                            "-preset", "slow", "-crf", "14", "-g", "12", "-pix_fmt", "yuv420p", a.out],
                           stdin=subprocess.PIPE)
    n = 0
    with torch.inference_mode():
        while True:
            buf = dec.stdout.read(w * h * 3)
            if len(buf) < w * h * 3:
                break
            x = torch.from_numpy(np.frombuffer(buf, np.uint8).reshape(h, w, 3).copy()).permute(2, 0, 1)[None].float() / 255
            y = net(x).clamp(0, 1)[0].permute(1, 2, 0).mul(255).round().byte().numpy()
            enc.stdin.write(y.tobytes())
            n += 1
    enc.stdin.close()
    enc.wait()
    dec.wait()
    print(f"{a.out}: {n} frames upscaled from {w}x{h}")


if __name__ == "__main__":
    main()
