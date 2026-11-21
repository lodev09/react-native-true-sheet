import { forwardRef, memo, startTransition, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TrueSheet } from '@lodev09/react-native-true-sheet';

import { BLUE, DARK, DARK_BLUE, GAP, GRAY, LIGHT_GRAY, SPACING, times } from '../../utils';
import { Button } from '../Button';

const TILE_COLORS = [BLUE, DARK_BLUE, GRAY, LIGHT_GRAY];

// More than React Native's 1024-view recycle pool, so every expand creates new views
const BALLAST_SIZE = 1500;

// Mounted with the detent change. Creating these views keeps the UI thread busy
// after the sheet schedules its resize, which usually gives the grid time to
// commit first. The timing is opportunistic, not guaranteed.
const Ballast = memo(() => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    {times(BALLAST_SIZE, (i) => (
      <View key={i} collapsable={false} style={styles.ballast} />
    ))}
  </View>
));

/**
 * iOS: commits new content between a detent change and the sheet's resize.
 * Views in that commit must appear in place rather than grow from a zero frame.
 */
export const ResizeRaceSheet = forwardRef<TrueSheet>((_, ref) => {
  const [expanded, setExpanded] = useState(false);
  const [showGrid, setShowGrid] = useState(false);

  const expand = () => {
    setExpanded(true);
    // Usually renders after the detent change starts mounting, but nothing orders
    // it against the resize: a run where the tiles look fine may have missed the race
    startTransition(() => setShowGrid(true));
  };

  const collapse = () => {
    setExpanded(false);
    setShowGrid(false);
  };

  return (
    <TrueSheet
      ref={ref}
      name="resize-race"
      detents={[expanded ? 0.7 : 'auto']}
      backgroundColor={DARK}
      style={styles.content}
      onDidDismiss={collapse}
    >
      <Text style={styles.text}>
        Expands the sheet and mounts a grid that usually lands right before the resize. The tiles
        should appear in place, without growing from the top-left corner.
      </Text>
      <Button
        text={expanded ? 'Collapse' : 'Expand + Grid'}
        onPress={expanded ? collapse : expand}
      />
      {showGrid && (
        <View style={styles.grid}>
          {times(24, (i) => (
            <View
              key={i}
              style={[styles.tile, { backgroundColor: TILE_COLORS[i % TILE_COLORS.length] }]}
            />
          ))}
        </View>
      )}
      {expanded && <Ballast />}
    </TrueSheet>
  );
});

const styles = StyleSheet.create({
  content: {
    padding: SPACING,
    paddingTop: SPACING * 2,
    gap: GAP,
  },
  text: {
    color: LIGHT_GRAY,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP / 2,
  },
  tile: {
    width: '23%',
    height: 72,
    borderRadius: SPACING / 2,
  },
  ballast: {
    width: 1,
    height: 1,
  },
});

ResizeRaceSheet.displayName = 'ResizeRaceSheet';
