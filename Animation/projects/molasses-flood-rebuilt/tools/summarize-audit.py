#!/usr/bin/env python3
"""Compact all-frame evidence, explicitly separating measurement from judgment."""
import hashlib
import json
from pathlib import Path
import statistics

PROJECT = Path(__file__).resolve().parents[1]
OUT = PROJECT.parents[1] / 'output/molasses-flood-rebuilt'
OLD = PROJECT.parents[1] / 'output/molasses-flood-v2/old-audit'
AUDIT = OUT / 'all-frame-audit'


def load(file):
    return json.loads(Path(file).read_text())


def distribution(values):
    if not values:
        return None
    ordered = sorted(values)
    return {
        'samples': len(values),
        'minimum': min(values),
        'median': statistics.median(values),
        'p95': ordered[round((len(ordered) - 1) * .95)],
        'maximum': max(values),
    }


def flow_summary(rows):
    reliable = [r['environmentProxy'] for r in rows
                if r.get('environmentProxy', {}).get('tracks', 0) >= 15
                and r['environmentProxy'].get('inlierRatio', 0) >= .6]
    return {
        'reliableProxyPairs': len(reliable),
        'environmentTranslationPixelsPerFrame': distribution([
            (r['tx'] ** 2 + r['ty'] ** 2) ** .5 for r in reliable]),
        'adjacentMeanAbsoluteDifference': distribution([
            r['meanAbsoluteDifference'] for r in rows if 'meanAbsoluteDifference' in r]),
        'largeChangeCandidates': sum(bool(r.get('largeChangeCandidate')) for r in rows),
    }


def main():
    final = PROJECT / 'delivery/molasses-flood-rebuilt-narrated-720p.mp4'
    summary = load(AUDIT / 'summary.json')
    rows = load(AUDIT / 'per-frame.json')
    qa = load(PROJECT / 'delivery/QA.json')
    assert len(rows) == summary['decodedFrames'] == qa['video']['frames'] == 5344
    assert summary['sha256'] == qa['sha256']
    assert hashlib.sha256(final.read_bytes()).hexdigest() == qa['sha256']
    assert all(r['meanLuma'] > 3 and r['lumaStdDev'] > 3 for r in rows), 'Blank/dark frame candidate'
    telemetry = load(OUT / 'molasses-picture.camera.json')
    report = {
        'file': final.name,
        'sha256': summary['sha256'],
        'decodedFrames': len(rows),
        'adjacentPairs': len(rows) - 1,
        'allFrameAtlasPages': summary['allFrameAtlasPages'],
        'frameAtlasLocation': 'Animation/output/molasses-flood-rebuilt/all-frame-audit/',
        'newFilm': flow_summary(rows),
        'camera': {
            'frameSamples': len(telemetry),
            'speed': distribution([frame['cameraSpeed'] for frame in telemetry]),
            'belowMovementThreshold': sum(frame['cameraSpeed'] < .035 for frame in telemetry),
        },
        'limits': [
            'Each frame was machine decoded/measured, not individually manually inspected at native resolution.',
            'Flow is a screen-space feature-fit proxy, not recovered camera ground truth.',
            'Large-change candidates can be occlusion, fast movement, rewind, captions or actual discontinuity.',
            'A nonblank frame test is not a composition or artistic-quality test.',
            'Technical checks do not imply user aesthetic approval.',
        ],
    }
    if (OLD / 'per-frame.json').is_file():
        report['rejectedFilm'] = flow_summary(load(OLD / 'per-frame.json'))
        report['rejectedFilm']['sourceSettledFrames'] = 4341
        report['rejectedFilm']['sourceSettledPercentage'] = 81.2312874251497
    destination = PROJECT / 'delivery/FRAME_AUDIT.json'
    destination.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
