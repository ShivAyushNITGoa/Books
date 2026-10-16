#!/usr/bin/env python3
"""
next_batch.py - image generation progress tracker for the TV6 prompt pack.

Order: #Host reference first (images/Host.jpg), then the 482 scenes in
manifest order (images/<label>.jpg).

Usage:
  python3 scripts/next_batch.py            # print next 10 pending (LABEL <TAB> PROMPT)
  python3 scripts/next_batch.py --n 10     # different batch size
  python3 scripts/next_batch.py --log images/0-00.jpg   # record one as done
  python3 scripts/next_batch.py --status   # progress summary
"""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "prompts" / "manifest.json"
LOG = ROOT / "prompts" / "generation_log.jsonl"


def entries():
    m = json.load(open(MANIFEST, encoding="utf-8"))
    out = [{"label": "Host", "prompt": m["host_ref"], "file": "images/Host.jpg"}]
    for s in m["scenes"]:
        out.append({"label": s["label"], "prompt": s["prompt"],
                    "file": f"images/{s['label']}.jpg"})
    return out


def done_labels():
    if not LOG.exists():
        return set()
    return {json.loads(l)["label"] for l in LOG.read_text().splitlines() if l.strip()}


def main():
    args = sys.argv[1:]
    if not args:
        n = 10
    else:
        n = 10
        i = 0
        while i < len(args):
            if args[i] == "--n":
                n = int(args[i + 1]); i += 2
            else:
                i += 1

    ents = entries()
    done = done_labels()
    pending = [e for e in ents if e["label"] not in done]

    if "--status" in args:
        print(f"total {len(ents)}  done {len(done)}  pending {len(pending)}")
        if pending:
            print("next:", pending[0]["label"], " last pending:", pending[-1]["label"])
        return

    if "--log" in args:
        f = args[args.index("--log") + 1]
        label = Path(f).stem
        LOG.parent.mkdir(parents=True, exist_ok=True)
        with LOG.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps({"label": label, "file": f,
                                 "ts": datetime.now(timezone.utc).isoformat()},
                                ensure_ascii=False) + "\n")
        print(f"logged {label}  (done {len(done_labels())}/{len(ents)})")
        return

    for e in pending[:n]:
        print(e["label"] + "\t" + e["prompt"])
    if len(pending) > n:
        print(f"--- {len(pending) - n} more pending after this batch")


if __name__ == "__main__":
    main()
