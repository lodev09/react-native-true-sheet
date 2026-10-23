import { Platform, StyleSheet, View } from 'react-native';
import { MapView, Polyline, type MapViewProps, type Coordinate } from '@lugg/maps';

import { BLUE } from '../utils';

const CENTER = {
  latitude: 9.306743705457553,
  longitude: 123.30474002203727,
};

const S = 0.0034; // scale
const SLANT = 0.3; // italic shear
const OX = -4.6; // offset to center horizontally
const OY = -0.3; // offset to center vertically
const SAMPLES = 10;

type XY = [number, number];

const pt = ([x, y]: XY): Coordinate => ({
  latitude: CENTER.latitude + (y + OY) * S,
  longitude: CENTER.longitude + (x + y * SLANT + OX) * S,
});

const catmullRom = (points: XY[]): XY[] => {
  const result: XY[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)] as XY;
    const p1 = points[i] as XY;
    const p2 = points[i + 1] as XY;
    const p3 = points[Math.min(i + 2, points.length - 1)] as XY;
    for (let s = 0; s < SAMPLES; s++) {
      const t = s / SAMPLES;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (k: 0 | 1) =>
        0.5 *
        (2 * p1[k] +
          (-p0[k] + p2[k]) * t +
          (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 +
          (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
      result.push([f(0), f(1)]);
    }
  }
  result.push(points[points.length - 1] as XY);
  return result;
};

// Script glyphs on a 1-unit x-height, written as one continuous pen stroke.
// runs[0] flows from the previous glyph, later runs start at a cusp, and a
// number retraces that many control points back over the previous run.
// prettier-ignore
const GLYPHS: Record<string, { w: number; runs: (XY[] | number)[] }> = {
  T: {
    w: 1,
    runs: [
      [[-0.3, 1.95], [0.1, 2.18], [0.7, 2.22], [1.3, 2.15], [1.8, 2.24], [2.05, 2.4]],
      3,
      [[0.62, 1.5], [0.48, 0.65], [0.32, 0.15], [0.12, 0], [0.02, 0.12], [0.18, 0.24], [0.5, 0.25]],
    ],
  },
  r: {
    w: 0.75,
    runs: [
      [[0.12, 0.6], [0.22, 1.02]],
      [[0.18, 0.5], [0.15, 0]],
      [[0.22, 0.5], [0.36, 0.85], [0.55, 0.98], [0.72, 0.9]],
    ],
  },
  u: {
    w: 1,
    runs: [
      [[0.2, 1]],
      [[0.12, 0.45], [0.2, 0.08], [0.42, 0], [0.62, 0.15], [0.74, 0.55], [0.8, 1]],
      [[0.74, 0.4], [0.77, 0.08], [0.88, 0.02], [1, 0.25]],
    ],
  },
  e: {
    w: 0.85,
    runs: [
      [[0.35, 0.45], [0.62, 0.75], [0.6, 1], [0.38, 1.02], [0.18, 0.75], [0.15, 0.3], [0.3, 0.03], [0.6, 0], [0.85, 0.25]],
    ],
  },
  S: {
    w: 1.55,
    runs: [
      [[0.2, 0.35], [0.45, 0.1], [0.95, 0], [1.3, 0.2], [1.45, 0.6], [1.35, 0.98], [1.05, 1.3], [0.72, 1.58], [0.58, 1.9], [0.72, 2.2], [1.05, 2.32], [1.45, 2.28], [1.8, 2.08]],
    ],
  },
  h: {
    w: 1,
    runs: [
      [[0.3, 1.8], [0.25, 1], [0.18, 0]],
      [[0.25, 0.55], [0.42, 0.88], [0.62, 0.97], [0.76, 0.72], [0.73, 0.25], [0.81, 0.02], [1, 0.25]],
    ],
  },
  t: {
    w: 0.9,
    runs: [
      [[0.25, 0.75], [0.42, 1.6]],
      [[0.32, 0.6], [0.32, 0.15], [0.45, 0], [0.7, 0.05], [0.9, 0.35], [1, 0.8], [0.85, 1.05], [0.45, 1.1], [0, 1.05]],
    ],
  },
};

const write = (text: string): Coordinate[] => {
  const runs: (XY[] | number)[] = [];
  let x = 0;
  for (const char of text) {
    const glyph = GLYPHS[char]!;
    glyph.runs.forEach((run, i) => {
      if (typeof run === 'number') {
        runs.push(run);
        return;
      }
      const points = run.map(([px, py]): XY => [px + x, py]);
      const prev = runs[runs.length - 1];
      if (i === 0 && Array.isArray(prev)) prev.push(...points);
      else runs.push(points);
    });
    x += glyph.w;
  }

  const path: XY[] = [];
  let sampled: XY[] = [];
  for (const run of runs) {
    if (typeof run === 'number') {
      path.push(...sampled.slice(-run * SAMPLES - 1, -1).reverse());
    } else {
      const pen = path[path.length - 1];
      sampled = catmullRom(pen ? [pen, ...run] : run);
      path.push(...(pen ? sampled.slice(1) : sampled));
    }
  }
  return path.map(pt);
};

const TRUE_SHEET = write('TrueSheet');

export const Map = (props: Omit<MapViewProps, 'style'> & { style?: MapViewProps['style'] }) => {
  const { style, children, ...rest } = props;

  if (Platform.OS === 'web') {
    return <View style={styles.map}>{children}</View>;
  }

  return (
    <MapView
      style={[styles.map, style]}
      initialCoordinate={CENTER}
      initialZoom={14}
      provider="google"
      {...rest}
    >
      <Polyline
        coordinates={TRUE_SHEET}
        strokeWidth={5}
        strokeColors={['#0a4da0', '#4da6ff']}
        animated
        animatedOptions={{ easing: 'easeInOut', delay: 1200, duration: 4000 }}
      />
      {children}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
    backgroundColor: BLUE,
  },
});
