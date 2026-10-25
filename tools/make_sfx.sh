#!/bin/bash
# Synthesize royalty-free SFX for edits (no downloads): sub boom impact + whoosh.
# Usage: tools/make_sfx.sh OUT_DIR
set -e
O=${1:-remotion/public/sfx}; mkdir -p "$O"
# Impact: pitch-dropping sub sine (110->38 Hz) with long decay + short filtered noise transient
ffmpeg -v error -y \
  -f lavfi -i "aevalsrc='0.95*sin(2*PI*(38+72*exp(-t*9))*t)*exp(-t*2.6)':s=48000:d=1.8" \
  -f lavfi -i "anoisesrc=color=brown:d=0.12:a=0.9:r=48000" \
  -filter_complex "[1]lowpass=f=2500,afade=t=out:st=0.0:d=0.12[n];[0][n]amix=inputs=2:weights='1 0.6':normalize=0,aformat=channel_layouts=stereo,alimiter=limit=0.95" \
  "$O/impact.wav"
# Whoosh: band-limited pink noise swelling in and cutting out (place it ~0.3s before the cut)
ffmpeg -v error -y -f lavfi -i "anoisesrc=color=pink:d=0.45:a=0.8:r=48000" \
  -af "highpass=f=350,lowpass=f=7000,afade=t=in:st=0:d=0.32:curve=exp,afade=t=out:st=0.33:d=0.12,aformat=channel_layouts=stereo,volume=5,alimiter=limit=0.9" \
  "$O/whoosh.wav"
ls -la "$O"
