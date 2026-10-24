#!/usr/bin/env bash
# TV9 TV7-plus build: 16 OOM-safe 20-cue packs, then one master-VO assemble.
# Run from anywhere; outputs are cached under ignored output/tv9_packs/.
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
EP=tv9
SRT=tv9.srt
IMAGES=images_tv9
CLASSES=prompts/tv9_cue_classes.json
PACK_DIR=output/tv9_packs
mkdir -p "$PACK_DIR"

for a in $(seq 0 20 300); do
  b=$((a + 19))
  (( b > 317 )) && b=317
  echo "=== TV9 PACK ${a}-${b} / 317 ==="
  python3 -u build_tv7plus.py \
    --srt "$SRT" --name "$EP" --images "$IMAGES" --cue-class "$CLASSES" \
    --res 1920x1080 --crf 20 --preset medium \
    --pack-start "$a" --pack-end "$b" --pack-dir "$PACK_DIR"
done

echo "=== TV9 ASSEMBLE ==="
python3 -u build_tv7plus.py \
  --srt "$SRT" --name "$EP" --images "$IMAGES" --cue-class "$CLASSES" \
  --res 1920x1080 --crf 20 --preset medium \
  --assemble --pack-dir "$PACK_DIR"
echo "TV9_ALL_DONE"
