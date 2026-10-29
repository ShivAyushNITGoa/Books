#!/bin/bash
# TV7-plus full build driver: 17 packs (20 cues each) -> assemble master.
cd /home/user/Books
mkdir -p /home/user/packs_backup
for i in $(seq 0 16); do
  a=$((i*20)); b=$((a+19)); [ $b -gt 329 ] && b=329
  echo "=== PACK $a-$b ==="
  python3 build_tv7plus.py --srt tv8.srt --pack-start "$a" --pack-end "$b" \
    --pack-dir output/tv8_packs 2>&1 | grep -vE "Deprecat|getdata|^  px" | tail -2
  cp -f "output/tv8_packs/pack_$(printf %03d $a)_$(printf %03d $b).mp4" \
    /home/user/packs_backup/ 2>/dev/null
done
echo "=== ASSEMBLE ==="
python3 build_tv7plus.py --srt tv8.srt --assemble --pack-dir output/tv8_packs \
  2>&1 | grep -viE "Deprecat|getdata|^  px" | tail -6
echo "ALL_DONE"
