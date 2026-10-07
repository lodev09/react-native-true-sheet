#!/usr/bin/env python3
"""Track one pixel column of a screen recording, frame by frame.

Prints a line only when the tracked value changes, so an element that stays
put prints once and a 1-frame jump shows up as its own line.

Modes (pixel values are 8-bit gray):
  bright  (first, last) y of pixels in [lo, hi)       e.g. a white pill in the footer
  band    first y of a pixel in [lo, hi)              e.g. the gray grabber
  edge    first y where --run consecutive px >= lo    e.g. a sheet top over a dark map

Example (footer "Default" pill on an iPhone 17 Pro Max recording):
  track_column.py rec.mp4 --x 1155 --y0 2300 --mode bright --lo 200
"""
import argparse
import json
import subprocess


def probe(video):
    out = subprocess.run(
        ['ffprobe', '-v', 'error', '-select_streams', 'v:0',
         '-show_entries', 'stream=width,height,r_frame_rate', '-of', 'json', video],
        check=True, capture_output=True, text=True,
    ).stdout
    stream = json.loads(out)['streams'][0]
    num, den = stream['r_frame_rate'].split('/')
    return stream['width'], stream['height'], float(num) / float(den)


def column(video, x, height):
    # format=gray before crop: a 1px crop of yuv420 fails on chroma subsampling.
    return subprocess.run(
        ['ffmpeg', '-v', 'error', '-i', video,
         '-vf', f'format=gray,crop=1:{height}:{x}:0', '-f', 'rawvideo', '-'],
        check=True, capture_output=True,
    ).stdout


def measure(col, args, y1):
    rng = range(args.y0, y1)
    if args.mode == 'bright':
        ys = [y for y in rng if args.lo <= col[y] < args.hi]
        return (ys[0], ys[-1]) if ys else None
    if args.mode == 'band':
        return next((y for y in rng if args.lo <= col[y] < args.hi), None)
    return next(
        (y for y in rng if y + args.run <= y1 and all(col[y + k] >= args.lo for k in range(args.run))),
        None,
    )


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('video')
    ap.add_argument('--x', type=int, required=True, help='column, in video pixels')
    ap.add_argument('--y0', type=int, default=0)
    ap.add_argument('--y1', type=int, help='exclusive; default: video height')
    ap.add_argument('--mode', choices=['bright', 'band', 'edge'], default='bright')
    ap.add_argument('--lo', type=int, default=200)
    ap.add_argument('--hi', type=int, default=256)
    ap.add_argument('--run', type=int, default=4)
    args = ap.parse_args()

    width, height, fps = probe(args.video)
    y1 = args.y1 or height
    raw = column(args.video, args.x, height)

    prev = object()
    for i in range(len(raw) // height):
        value = measure(raw[i * height:(i + 1) * height], args, y1)
        if value != prev:
            print(f'{i}\tt={i / fps:.2f}s\t{value}')
        prev = value


if __name__ == '__main__':
    main()
