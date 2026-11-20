import { useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { TrueSheet } from '@lodev09/react-native-true-sheet';

import { Button } from '@example/shared/components';
import {
  BORDER_RADIUS,
  DARK,
  DARK_GRAY,
  GAP,
  LIGHT_GRAY,
  SPACING,
  times,
} from '@example/shared/utils';

import {
  ReproScreen,
  useDelayedMount,
  useFocusedInitialDetentIndex,
} from '../../components/ReproScreen';

const ROWS = times(40, (i) => i);
const DETENTS = ['Half', 'Full'];

export default function ReproScrollHandoff() {
  const sheetMounted = useDelayedMount();
  const initialDetentIndex = useFocusedInitialDetentIndex();
  const sheet = useRef<TrueSheet>(null);
  const list = useRef<FlatList>(null);
  const [detent, setDetent] = useState<string>();
  const [dismissals, setDismissals] = useState(0);

  return (
    <ReproScreen
      title="Repro scroll handoff"
      description="iOS: at Full, scroll down, flick back to the top and swipe down again right away. The sheet should follow to Half."
    >
      <Text testID="handoff-status" style={styles.status}>
        Detent: {detent ?? '–'} · Dismissed: {dismissals}
      </Text>
      <Button text="Present" onPress={() => sheet.current?.present()} />
      {sheetMounted && (
        <TrueSheet
          ref={sheet}
          detents={[0.5, 1]}
          initialDetentIndex={initialDetentIndex}
          dimmed={false}
          backgroundColor={DARK}
          scrollableRef={list}
          onDidPresent={(e) => setDetent(DETENTS[e.nativeEvent.index])}
          onDetentChange={(e) => setDetent(DETENTS[e.nativeEvent.index])}
          onDidDismiss={() => {
            setDetent(undefined);
            setDismissals((count) => count + 1);
          }}
        >
          <FlatList
            ref={list}
            testID="handoff-list"
            data={ROWS}
            keyExtractor={(row) => String(row)}
            contentContainerStyle={styles.content}
            indicatorStyle="white"
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Text style={styles.rowText}>Row {item + 1}</Text>
              </View>
            )}
          />
        </TrueSheet>
      )}
    </ReproScreen>
  );
}

const styles = StyleSheet.create({
  status: {
    color: LIGHT_GRAY,
    fontSize: 16,
  },
  content: {
    padding: SPACING,
    paddingTop: SPACING * 2,
    gap: GAP,
  },
  row: {
    backgroundColor: DARK_GRAY,
    borderRadius: BORDER_RADIUS,
    padding: SPACING,
  },
  rowText: {
    color: LIGHT_GRAY,
    fontSize: 16,
  },
});
