import { StyleSheet } from 'react-native';
import { MapView, Polyline, type MapViewProps, type Coordinate } from '@lugg/maps';

import { BLUE } from '../utils';

const CENTER = {
  latitude: 9.306743705457553,
  longitude: 123.30474002203727,
};

const S = 0.006; // scale
const OX = -0.014; // offset to center horizontally
const OY = 0.003; // offset to center vertically

type XY = [number, number];

const pt = (x: number, y: number): Coordinate => ({
  latitude: CENTER.latitude + y * S + OY,
  longitude: CENTER.longitude + x * S + OX,
});

const catmullRom = (points: XY[], samples = 12): Coordinate[] => {
  if (points.length < 2) return points.map(([x, y]) => pt(x, y));
  const result: Coordinate[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)] as XY;
    const p1 = points[i] as XY;
    const p2 = points[i + 1] as XY;
    const p3 = points[Math.min(i + 2, points.length - 1)] as XY;
    for (let s = 0; s < samples; s++) {
      const t = s / samples;
      const t2 = t * t;
      const t3 = t2 * t;
      result.push(
        pt(
          0.5 *
            (2 * p1[0] +
              (-p0[0] + p2[0]) * t +
              (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
              (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 *
            (2 * p1[1] +
              (-p0[1] + p2[1]) * t +
              (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
              (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
        )
      );
    }
  }
  const last = points[points.length - 1] as XY;
  result.push(pt(last[0], last[1]));
  return result;
};

// "TRUE" above — smaller scale, offset up
const TY = 1.3;
const TS = 0.6;
const tx = (x: number) => 0.85 + x * TS;
const ty = (y: number) => TY + y * TS;

const TRUE_T: Coordinate[] = [
  pt(tx(0.4), ty(0)),
  pt(tx(0.4), ty(1)),
  pt(tx(0), ty(1)),
  pt(tx(0.8), ty(1)),
];

const TRUE_R: Coordinate[] = [
  pt(tx(1.1), ty(0)),
  pt(tx(1.1), ty(1)),
  pt(tx(1.7), ty(1)),
  pt(tx(1.8), ty(0.9)),
  pt(tx(1.8), ty(0.6)),
  pt(tx(1.7), ty(0.5)),
  pt(tx(1.1), ty(0.5)),
  pt(tx(1.8), ty(0)),
];

const TRUE_U: Coordinate[] = [
  pt(tx(2.1), ty(1)),
  pt(tx(2.1), ty(0.2)),
  pt(tx(2.2), ty(0)),
  pt(tx(2.7), ty(0)),
  pt(tx(2.8), ty(0.2)),
  pt(tx(2.8), ty(1)),
];

const TRUE_E: Coordinate[] = [
  pt(tx(3.7), ty(0)),
  pt(tx(3.1), ty(0)),
  pt(tx(3.1), ty(1)),
  pt(tx(3.8), ty(1)),
  pt(tx(3.8), ty(1)),
  pt(tx(3.1), ty(1)),
  pt(tx(3.1), ty(0.5)),
  pt(tx(3.6), ty(0.5)),
];

const S_COORDS = catmullRom([
  [0.8, 1],
  [0.2, 1],
  [0, 0.8],
  [0, 0.6],
  [0.2, 0.5],
  [0.6, 0.5],
  [0.8, 0.4],
  [0.8, 0.2],
  [0.6, 0],
  [0, 0],
]);

// Block letters "SHEET"
const SHEET_COORDS: Coordinate[] = [
  ...S_COORDS,
  // jump → H
  pt(1.2, 0),
  // H
  pt(1.2, 0),
  pt(1.2, 1),
  pt(1.2, 0.5),
  pt(2.0, 0.5),
  pt(2.0, 1),
  pt(2.0, 0),
  // jump → e1
  pt(2.0, 0),
  pt(2.3, 0),
  // e1
  pt(2.3, 0),
  pt(2.3, 1),
  pt(3.0, 1),
  pt(3.0, 1),
  pt(2.3, 1),
  pt(2.3, 0.5),
  pt(2.8, 0.5),
  pt(2.8, 0.5),
  pt(2.3, 0.5),
  pt(2.3, 0),
  pt(3.0, 0),
  // jump → e2
  pt(3.0, 0),
  pt(3.3, 0),
  // e2
  pt(3.3, 0),
  pt(3.3, 1),
  pt(4.0, 1),
  pt(4.0, 1),
  pt(3.3, 1),
  pt(3.3, 0.5),
  pt(3.8, 0.5),
  pt(3.8, 0.5),
  pt(3.3, 0.5),
  pt(3.3, 0),
  pt(4.0, 0),
  // jump → T
  pt(4.0, 0),
  pt(4.55, 0),
  // T
  pt(4.55, 0),
  pt(4.55, 1),
  pt(4.2, 1),
  pt(4.9, 1),
];

export const Map = (props: Omit<MapViewProps, 'style'> & { style?: MapViewProps['style'] }) => {
  const { style, children, ...rest } = props;

  return (
    <MapView
      style={[styles.map, style]}
      initialCoordinate={CENTER}
      initialZoom={14}
      provider="google"
      {...rest}
    >
      <Polyline coordinates={TRUE_T} strokeWidth={4} strokeColors={['#0a4da0']} />
      <Polyline coordinates={TRUE_R} strokeWidth={4} strokeColors={['#0a4da0']} />
      <Polyline coordinates={TRUE_U} strokeWidth={4} strokeColors={['#0a4da0']} />
      <Polyline coordinates={TRUE_E} strokeWidth={4} strokeColors={['#0a4da0']} />
      <Polyline
        coordinates={SHEET_COORDS}
        strokeWidth={5}
        strokeColors={['#0a4da0', '#4da6ff']}
        animated
        animatedOptions={{ easing: 'easeInOut', delay: 1200, duration: 1500 }}
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
