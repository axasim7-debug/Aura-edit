"""Find a song's "Most replayed" peak on YouTube and download the audio.

The peak of YouTube's replay heatmap is where viewers rewind to: in phonk it is almost
always the drop / the part used in edits. The edit should hit its hardest cut there.

Usage:
  python song_heatmap.py "https://www.youtube.com/watch?v=..." -o song_full.wav [--no-download]

Prints the heatmap as a bar chart, the peak, and a suggested cut (start a few seconds before
the drop so the calm intro has room). Requires yt-dlp (with a JS runtime, e.g. --js-runtimes node).
"""
import argparse
import json
import subprocess
import sys


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("url")
    ap.add_argument("-o", "--out", default="song_full.wav")
    ap.add_argument("--no-download", action="store_true")
    ap.add_argument("--lead", type=float, default=6.0, help="seconds of calm before the peak")
    ap.add_argument("--length", type=float, default=15.0, help="target edit length (seconds)")
    a = ap.parse_args()

    base = ["yt-dlp", "--js-runtimes", "node"]
    info = json.loads(subprocess.check_output(base + ["--dump-json", "--skip-download", "--ignore-no-formats-error", a.url]))
    heat = info.get("heatmap") or []
    print(f"{info.get('title')} | {info.get('duration')}s | {info.get('view_count')} views")

    if not heat:
        print("no heatmap (video too new / too few views) — use analyze_audio.py drop detection instead")
    else:
        top = max(h["value"] for h in heat)
        for h in heat:
            bar = "#" * int(40 * h["value"] / top)
            print(f"{h['start_time']:7.1f}s {bar}")
        peak = max(heat, key=lambda h: h["value"])
        p = (peak["start_time"] + peak["end_time"]) / 2
        start = max(0.0, p - a.lead)
        print(f"\nMOST REPLAYED peak ≈ {p:.1f}s")
        print(f"suggested cut: --start {start:.1f} --end {start + a.length:.1f}  "
              f"(refine the exact drop with analyze_audio.py, then snap start to a beat)")

    if not a.no_download:
        subprocess.check_call(base + ["-f", "ba", "-x", "--audio-format", "wav", "-o", a.out.rsplit(".", 1)[0] + ".%(ext)s", a.url])


if __name__ == "__main__":
    sys.exit(main())
