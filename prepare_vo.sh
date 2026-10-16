#!/usr/bin/env bash
# Regenerate audio/tv6_master.mp3 from the two uploaded VO parts.
# build_video.py picks up the FIRST audio file in audio/ as the master VO,
# so that folder must contain ONLY tv6_master.mp3 (this script's output).
set -euo pipefail
cd "$(dirname "$0")"

FFMPEG="${FFMPEG_BIN:-$(python3 -c 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())')}"

mkdir -p audio
"$FFMPEG" -y -hide_banner -loglevel warning \
  -i "TV6  p1.mp3" -i "TV6 p2.mp3" \
  -filter_complex "[0:a][1:a]concat=n=2:v=0:a=1[out]" -map "[out]" \
  -c:a libmp3lame -b:a 128k -ar 44100 -ac 1 audio/tv6_master.mp3

echo "Wrote audio/tv6_master.mp3"
