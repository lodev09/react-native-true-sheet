import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { useTrueSheetNavigation } from '@lodev09/react-native-true-sheet/navigation/expo-router';

import { Button, DemoContent, Footer } from '@example/shared/components';
import { DARK, GAP, LIGHT_GRAY, SPACING } from '@example/shared/utils';
import { useRouter } from 'expo-router';

export default function DetailsSheet() {
  const navigation = useTrueSheetNavigation();
  const router = useRouter();
  const sheetRef = useRef<TrueSheet>(null);

  useEffect(() => {
    navigation.setOptions({
      footer: <Footer onPress={() => sheetRef.current?.present()} />,
    });
  }, [navigation]);

  return (
    <View style={styles.sheetContent}>
      <Text style={styles.sheetTitle}>Details Sheet</Text>
      <Text style={styles.sheetSubtitle}>This is a sheet screen using expo-router.</Text>
      <DemoContent />
      <View style={styles.buttons}>
        <Button text="Resize to 100%" onPress={() => navigation.resize(1)} />
        <Button text="Open Settings" onPress={() => router.push('/sheet/settings')} />
        <Button text="Go Back" onPress={() => router.back()} />
      </View>
      <TrueSheet ref={sheetRef} cornerRadius={12} detents={['auto']} backgroundColor={DARK}>
        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Footer Sheet</Text>
          <Text style={styles.sheetSubtitle}>Presented from footer button!</Text>
        </View>
      </TrueSheet>
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
  buttons: {
    gap: GAP,
    marginTop: SPACING,
  },
});
