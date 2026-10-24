"""Scan a full movie so its aura moments can be picked without watching it end to end.

Outputs in OUT_DIR:
  subs_<n>_<lang>.srt   every text subtitle track (PGS/VobSub image subs are listed but not extracted)
  scenes.json           [{i, start, end, dur, lines:[subtitle text in that scene]}]
  sheet_NN.png          contact sheets: one frame per scene, labelled "#scene  hh:mm:ss"
  scenes.txt            human-readable index: scene, time, duration, dialogue

Usage:
  python scan_movie.py MOVIE.mkv OUT_DIR [--threshold 0.3] [--fast] [--per-sheet 48]

  default: decode every frame at low resolution (exact cuts; ~10-25 min for a 2h HEVC film)
  --fast : keyframes only (quick, but misses cuts that are not on keyframes)
"""
import argparse
import json
import os
import re
import subprocess


def run(cmd, **kw):
    return subprocess.run(cmd, check=True, capture_output=True, text=True, **kw)


def probe_streams(path):
    out = run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", path]).stdout
    return json.loads(out)


def hms(t):
    t = int(t)
    return f"{t // 3600:02d}:{t % 3600 // 60:02d}:{t % 60:02d}"


def parse_srt(path):
    lines = []
    txt = open(path, encoding="utf-8", errors="replace").read()
    for block in re.split(r"\n\s*\n", txt.strip()):
        m = re.search(r"(\d+):(\d+):(\d+)[,.](\d+)\s*-->\s*(\d+):(\d+):(\d+)[,.](\d+)", block)
        if not m:
            continue
        g = [int(x) for x in m.groups()]
        a = g[0] * 3600 + g[1] * 60 + g[2] + g[3] / 1000
        b = g[4] * 3600 + g[5] * 60 + g[6] + g[7] / 1000
        text = " ".join(block[m.end():].strip().splitlines())
        text = re.sub(r"<[^>]+>|\{[^}]+\}", "", text).strip()
        if text:
            lines.append({"start": round(a, 3), "end": round(b, 3), "text": text})
    return lines


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("movie")
    ap.add_argument("out")
    ap.add_argument("--threshold", type=float, default=0.3)
    ap.add_argument("--fast", action="store_true", help="keyframes only (quick but misses many cuts)")
    ap.add_argument("--per-sheet", type=int, default=48)
    ap.add_argument("--min-scene", type=float, default=0.6)
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)

    info = probe_streams(a.movie)
    duration = float(info["format"]["duration"])
    print(f"duration {hms(duration)}")

    # 1) subtitles
    srts = []
    for s in info["streams"]:
        if s["codec_type"] != "subtitle":
            continue
        lang = s.get("tags", {}).get("language", "und")
        title = s.get("tags", {}).get("title", "")
        print(f"subtitle #{s['index']} {lang} {s['codec_name']} {title}")
        if s["codec_name"] in ("subrip", "ass", "ssa", "mov_text", "webvtt", "text"):
            out = os.path.join(a.out, f"subs_{s['index']}_{lang}.srt")
            run(["ffmpeg", "-y", "-v", "error", "-i", a.movie, "-map", f"0:{s['index']}", "-c:s", "srt", out])
            srts.append((lang, out))
    # prefer English for dialogue lookup
    srts.sort(key=lambda x: (x[0] not in ("eng", "en"), x[0]))
    subs = parse_srt(srts[0][1]) if srts else []
    print(f"{len(subs)} subtitle lines from {srts[0][1] if srts else '—'}")

    # 2) scene cuts
    vf = f"scale=320:-2,select='gt(scene,{a.threshold})',showinfo"
    cmd = ["ffmpeg", "-hide_banner", "-nostats"]
    if a.fast:
        cmd += ["-skip_frame", "nokey"]
    cmd += ["-i", a.movie, "-an", "-sn", "-vf", vf, "-vsync", "vfr", "-f", "null", "-"]
    err = subprocess.run(cmd, capture_output=True, text=True).stderr
    cuts = [float(x) for x in re.findall(r"pts_time:([\d.]+)", err)]
    bounds = [0.0]
    for c in cuts:
        if c - bounds[-1] >= a.min_scene:
            bounds.append(c)
    bounds.append(duration)
    scenes = []
    for i in range(len(bounds) - 1):
        s0, s1 = bounds[i], bounds[i + 1]
        lines = [l["text"] for l in subs if l["end"] > s0 and l["start"] < s1]
        scenes.append({"i": i, "start": round(s0, 3), "end": round(s1, 3), "dur": round(s1 - s0, 3), "lines": lines})
    json.dump(scenes, open(os.path.join(a.out, "scenes.json"), "w"), indent=1, ensure_ascii=False)
    with open(os.path.join(a.out, "scenes.txt"), "w") as f:
        for s in scenes:
            f.write(f"#{s['i']:4d} {hms(s['start'])} ({s['dur']:5.1f}s) {' / '.join(s['lines'])[:160]}\n")
    print(f"{len(scenes)} scenes")

    # 3) contact sheets: middle frame of each scene, labelled
    tmp = os.path.join(a.out, "_frames")
    os.makedirs(tmp, exist_ok=True)
    for s in scenes:
        t = s["start"] + s["dur"] / 2
        label = f"#{s['i']} {hms(s['start'])}".replace(":", "\\:")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.2f}", "-i", a.movie, "-frames:v", "1",
                        "-vf", f"scale=240:-2,drawtext=text='{label}':x=3:y=3:fontsize=14:fontcolor=yellow:box=1:boxcolor=black@0.7",
                        os.path.join(tmp, f"f_{s['i']:05d}.png")], check=False)
    n = a.per_sheet
    for k in range(0, len(scenes), n):
        sheet = os.path.join(a.out, f"sheet_{k // n:02d}.png")
        files = [os.path.join(tmp, f"f_{s['i']:05d}.png") for s in scenes[k:k + n]]
        files = [f for f in files if os.path.exists(f)]
        if not files:
            continue
        lst = os.path.join(tmp, "list.txt")
        open(lst, "w").write("".join(f"file '{os.path.abspath(f)}'\n" for f in files))
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst,
                        "-vf", "tile=8x6:padding=2:color=black", "-frames:v", "1", sheet], check=False)
    print(f"sheets in {a.out}")


if __name__ == "__main__":
    main()
