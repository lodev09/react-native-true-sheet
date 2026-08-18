import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTrueSheetNavigation } from '@lodev09/react-native-true-sheet/navigation/expo-router';

import { DARK_BLUE, GAP, LIGHT_GRAY, SPACING } from '@example/shared/utils';

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
      footerStyle: { backgroundColor: DARK_BLUE },
    });
  }, [navigation]);

  return (
    <View style={styles.sheetContent}>
      <Text style={styles.sheetTitle}>Small Footer Sheet</Text>
      <Text style={styles.sheetSubtitle}>Small auto detent with a late-mounted footer.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sheetContent: {
    padding: SPACING,
    gap: GAP,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  sheetSubtitle: {
    fontSize: 14,
    color: LIGHT_GRAY,
    marginBottom: SPACING,
  },
  footer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING / 2,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    color: 'white',
  },
});
