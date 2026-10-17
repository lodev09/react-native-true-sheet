import { forwardRef, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  TrueSheet,
  TrueSheetPeek,
  type FoldOptions,
  type TrueSheetProps,
} from '@lodev09/react-native-true-sheet';

import { BLUE, DARK, DARK_BLUE, DARK_GRAY, GAP, GRAY, LIGHT_GRAY, SPACING } from '../../utils';
import { Button } from '../Button';
import { ButtonGroup } from '../ButtonGroup';

type HingeBehavior = NonNullable<FoldOptions['hingeBehavior']>;

const BEHAVIORS: HingeBehavior[] = ['none', 'avoid', 'snap'];

const HINTS: Record<HingeBehavior, string> = {
  none: 'The player rests on the hinge. Expanding still crosses it.',
  avoid: 'The player rests on the hinge, and nothing expands past it.',
  snap: 'Half-fold and the player rises to the hinge. Unfold and it goes back.',
};

const QUEUE = [
  { title: 'Wait', artist: 'M83' },
  { title: 'Intro', artist: 'The xx' },
  { title: 'Holocene', artist: 'Bon Iver' },
  { title: 'Teardrop', artist: 'Massive Attack' },
];

interface FoldableSheetProps extends TrueSheetProps {}

export const FoldableSheet = forwardRef((props: FoldableSheetProps, ref: Ref<TrueSheet>) => {
  const sheetRef = useRef<TrueSheet>(null);

  const [behavior, setBehavior] = useState<HingeBehavior>('snap');
  const [playing, setPlaying] = useState(true);

  useImperativeHandle<TrueSheet | null, TrueSheet | null>(ref, () => sheetRef.current);

  return (
    <TrueSheet
      ref={sheetRef}
      name="foldable"
      detents={['peek', 0.6, 1]}
      foldOptions={{ hingeDetentIndex: 1, hingeBehavior: behavior }}
      dimmedDetentIndex={1}
      backgroundColor={DARK}
      {...props}
    >
      <View style={styles.content}>
        <TrueSheetPeek style={styles.nowPlaying}>
          <View style={styles.artwork} />
          <View style={styles.track}>
            <Text style={styles.title}>Midnight City</Text>
            <Text style={styles.subtitle}>M83</Text>
          </View>
          <Button
            style={styles.playButton}
            text={playing ? '❚❚' : '▶'}
            onPress={() => setPlaying(!playing)}
          />
        </TrueSheetPeek>

        <View>
          <View style={styles.progress}>
            <View style={styles.progressFill} />
          </View>
          <View style={styles.times}>
            <Text style={styles.time}>1:42</Text>
            <Text style={styles.time}>4:03</Text>
          </View>
        </View>

        <ButtonGroup>
          <Button text="⏮" />
          <Button text={playing ? 'Pause' : 'Play'} onPress={() => setPlaying(!playing)} />
          <Button text="⏭" />
        </ButtonGroup>

        <View style={styles.section}>
          <Text style={styles.label}>foldOptions.hingeBehavior</Text>
          <ButtonGroup>
            {BEHAVIORS.map((value) => (
              <Button
                key={value}
                text={`'${value}'`}
                style={value === behavior ? styles.selected : styles.unselected}
                onPress={() => setBehavior(value)}
              />
            ))}
          </ButtonGroup>
          <Text style={styles.hint}>{HINTS[behavior]}</Text>
          <Text style={styles.note}>Tabletop on iOS 27.1+ foldables, like the iPhone Duo.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Up Next</Text>
          {QUEUE.map((item) => (
            <View key={item.title} style={styles.queueItem}>
              <View style={styles.queueArtwork} />
              <View style={styles.track}>
                <Text style={styles.queueTitle}>{item.title}</Text>
                <Text style={styles.subtitle}>{item.artist}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </TrueSheet>
  );
});

const ARTWORK_SIZE = SPACING * 3;

const styles = StyleSheet.create({
  content: {
    padding: SPACING,
    paddingTop: SPACING * 2,
    gap: SPACING,
  },
  nowPlaying: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: GAP,
  },
  artwork: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: GAP,
    backgroundColor: BLUE,
  },
  track: {
    flex: 1,
  },
  title: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
  subtitle: {
    color: GRAY,
    fontSize: 14,
  },
  playButton: {
    width: ARTWORK_SIZE,
    padding: 0,
  },
  progress: {
    height: 4,
    borderRadius: 2,
    backgroundColor: DARK_GRAY,
  },
  progressFill: {
    width: '42%',
    height: 4,
    borderRadius: 2,
    backgroundColor: LIGHT_GRAY,
  },
  times: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  time: {
    color: GRAY,
    fontSize: 12,
  },
  section: {
    gap: GAP,
  },
  label: {
    color: GRAY,
    fontSize: 13,
    fontWeight: '600',
  },
  selected: {
    backgroundColor: BLUE,
  },
  unselected: {
    backgroundColor: DARK_BLUE,
    opacity: 0.6,
  },
  hint: {
    color: LIGHT_GRAY,
    lineHeight: 20,
  },
  note: {
    color: GRAY,
    fontSize: 12,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: GAP,
  },
  queueArtwork: {
    width: SPACING * 2.5,
    height: SPACING * 2.5,
    borderRadius: GAP / 2,
    backgroundColor: DARK_GRAY,
  },
  queueTitle: {
    color: 'white',
    fontSize: 15,
  },
});

FoldableSheet.displayName = 'FoldableSheet';
