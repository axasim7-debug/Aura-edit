"""Analyze a (pre-cut) song for aura edits.

Output: beats.json = {bpm, duration, drop, beats: [{t, level}]}
  level 4 = drop, 3 = strong kick / downbeat, 2 = beat / snare, 1 = weak onset (hats, cowbell)

Usage:
  python analyze_audio.py song.mp3 -o beats.json [--drop 3.42] [--start 12.0 --end 27.0]
"""
import argparse
import json

import librosa
import numpy as np


def low_band_energy(y, sr, hop):
    """RMS of the sub/bass band (< 150 Hz) per frame: what an aura edit hits on."""
    S = np.abs(librosa.stft(y, n_fft=2048, hop_length=hop))
    freqs = librosa.fft_frequencies(sr=sr, n_fft=2048)
    return np.sqrt((S[freqs < 150] ** 2).mean(axis=0))


def find_drop(times, low, beat_period):
    """The drop = the biggest jump in sustained low-band energy (one bar after vs one bar before)."""
    hop_t = times[1] - times[0]
    win = max(1, int(round(4 * beat_period / hop_t)))
    best, best_i = -np.inf, 0
    for i in range(win, len(low) - win):
        score = low[i : i + win].mean() - low[i - win : i].mean()
        if score > best:
            best, best_i = score, i
    return float(times[best_i])


def analyze(path, start=None, end=None, drop=None):
    y, sr = librosa.load(path, sr=22050, mono=True, offset=start or 0.0,
                         duration=(end - (start or 0.0)) if end else None)
    hop = 256  # ~11.6 ms at 22.05 kHz: well under one video frame
    duration = len(y) / sr

    # Tempo from the full-band onset envelope (used for the bpm value and drop window size).
    onset_env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
    tempo, _ = librosa.beat.beat_track(onset_envelope=onset_env, sr=sr, hop_length=hop)
    bpm = float(np.atleast_1d(tempo)[0])

    # Kicks / 808s: onsets of the low band only. beat_track alone often locks onto hats.
    kick_env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop, fmax=200, n_mels=32)
    kick_frames = librosa.onset.onset_detect(onset_envelope=kick_env, sr=sr, hop_length=hop,
                                             backtrack=True, delta=0.2)
    kick_times = librosa.frames_to_time(kick_frames, sr=sr, hop_length=hop)

    # Everything else (snares, claps, hats, cowbell).
    all_frames = librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr, hop_length=hop,
                                            backtrack=True)
    all_times = librosa.frames_to_time(all_frames, sr=sr, hop_length=hop)

    low = low_band_energy(y, sr, hop)
    times = librosa.frames_to_time(np.arange(len(low)), sr=sr, hop_length=hop)
    low_n = low / (low.max() + 1e-9)

    def low_after(t, win=0.08):
        i0 = int(np.searchsorted(times, t))
        i1 = int(np.searchsorted(times, t + win))
        return float(low_n[i0 : max(i1, i0 + 1)].max()) if i0 < len(low_n) else 0.0

    beat_period = 60.0 / bpm if bpm > 0 else 0.5
    if drop is None:
        drop = find_drop(times, low, beat_period)

    beats = [{"t": float(t), "level": 3} for t in kick_times if low_after(t) > 0.35]
    kick_set = np.array([b["t"] for b in beats])

    # Snap the drop to the nearest real kick so the hardest cut lands on a transient.
    if len(kick_set):
        drop = float(kick_set[np.argmin(np.abs(kick_set - drop))])

    strength = onset_env[all_frames] if len(all_frames) else np.array([])
    thr = np.percentile(strength, 60) if len(strength) else 0
    for t, s in zip(all_times, strength):
        if len(kick_set) and np.min(np.abs(kick_set - t)) < 0.06:
            continue
        beats.append({"t": float(t), "level": 2 if s >= thr else 1})

    beats = [b for b in beats if abs(b["t"] - drop) > 0.03]
    beats.append({"t": drop, "level": 4})
    beats.sort(key=lambda b: b["t"])
    for b in beats:
        b["t"] = round(b["t"], 4)

    return {"bpm": round(bpm, 2), "duration": round(duration, 3), "drop": round(drop, 4), "beats": beats}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("audio")
    ap.add_argument("-o", "--out", default="beats.json")
    ap.add_argument("--start", type=float)
    ap.add_argument("--end", type=float)
    ap.add_argument("--drop", type=float, help="force drop time (seconds) if auto-detection is wrong")
    a = ap.parse_args()
    res = analyze(a.audio, a.start, a.end, a.drop)
    with open(a.out, "w") as f:
        json.dump(res, f, indent=1)
    lv = {k: sum(1 for b in res["beats"] if b["level"] == k) for k in (1, 2, 3, 4)}
    print(f"bpm={res['bpm']} duration={res['duration']}s drop={res['drop']}s levels={lv}")


if __name__ == "__main__":
    main()
