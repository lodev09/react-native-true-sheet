import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTrueSheetNavigation } from '@lodev09/react-native-true-sheet/navigation/expo-router';

import { BLUE, LIGHT_GRAY, SPACING } from '@example/shared/utils';

// Repro: on iOS 26 a small auto detent (<= 150) resolves the footer's bottom
// inset to 0, but the late-mounted footer's first layout is seeded with the
// full window inset — watch for the footer shrinking right after present.
const SmallFooter = () => (
  <View style={styles.footer}>
    <Text style={styles.footerText}>SMALL FOOTER</Text>
  </View>
);

export default function SmallFooterSheet() {
  const navigation = useTrueSheetNavigation();

  useEffect(() => {
    navigation.setOptions({
      footer: <SmallFooter />,
      footerStyle: { backgroundColor: 'red' },
    });
  }, [navigation]);

  return (
    <View style={styles.sheetContent}>
      <Text style={styles.sheetTitle}>Small Footer Sheet</Text>
      <Text style={styles.sheetSubtitle}>Auto detent ≤ 150 + late footer</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sheetContent: {
    backgroundColor: 'yellow',
    height: 120,
    padding: SPACING,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  sheetSubtitle: {
    fontSize: 12,
    color: LIGHT_GRAY,
  },
  footer: {
    backgroundColor: BLUE,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 0,
  },
  footerText: {
    color: 'white',
    fontWeight: '600',
  },
});
