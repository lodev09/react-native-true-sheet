import { forwardRef, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TrueSheet } from '@lodev09/react-native-true-sheet';

import { DARK, GAP, GRAY, LIGHT_GRAY, SPACING, times } from '../../utils';
import { Input } from '../Input';

const LOAD_DELAY_MS = 1000;

/**
 * iOS: a search field and a results list mount when results load after the
 * sheet presents, and the sheet expands to show them. The list is the sheet's
 * new scrollable. The new views must appear in place rather than grow from a
 * zero frame (the field's placeholder sliding in from its top-left corner).
 */
export const LateSearchSheet = forwardRef<TrueSheet>((_, ref) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const loadTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [loaded, setLoaded] = useState(false);

  const load = () => {
    clearTimeout(loadTimeout.current);
    loadTimeout.current = setTimeout(() => setLoaded(true), LOAD_DELAY_MS);
  };

  const cancelLoad = () => clearTimeout(loadTimeout.current);

  useEffect(() => () => clearTimeout(loadTimeout.current), []);

  useEffect(() => {
    if (loaded) TrueSheet.resize('late-search', 1);
  }, [loaded]);

  return (
    <TrueSheet
      ref={ref}
      name="late-search"
      detents={[0.6, 1]}
      backgroundColor={DARK}
      scrollableRef={scrollViewRef}
      style={styles.sheet}
      onWillPresent={load}
      onWillDismiss={cancelLoad}
      onDidDismiss={() => setLoaded(false)}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Late Search</Text>
        {loaded && <Input placeholder="Search" />}
      </View>
      {loaded ? (
        <ScrollView ref={scrollViewRef} contentContainerStyle={styles.content}>
          {times(20, (i) => (
            <Text key={i} style={styles.row}>
              Result #{i + 1}
            </Text>
          ))}
        </ScrollView>
      ) : (
        <ActivityIndicator color={LIGHT_GRAY} />
      )}
    </TrueSheet>
  );
});

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
  },
  header: {
    padding: SPACING,
    paddingTop: SPACING * 2,
    gap: GAP,
  },
  title: {
    color: LIGHT_GRAY,
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: SPACING,
    gap: GAP,
  },
  row: {
    color: GRAY,
    fontSize: 16,
  },
});

LateSearchSheet.displayName = 'LateSearchSheet';
