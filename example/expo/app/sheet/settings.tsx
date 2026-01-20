import { StyleSheet, Text, View } from 'react-native';
import { useTrueSheetNavigation } from '@lodev09/react-native-true-sheet/navigation';

import { Button, DemoContent } from '@example/shared/components';
import { GAP, LIGHT_GRAY, SPACING } from '@example/shared/utils';
import { useRouter } from 'expo-router';

export default function SettingsSheet() {
  const navigation = useTrueSheetNavigation();
  const router = useRouter();

  return (
    <View style={styles.sheetContent}>
      <Text style={styles.sheetTitle}>Settings Sheet</Text>
      <Text style={styles.sheetSubtitle}>Another sheet in the navigation stack.</Text>
      <DemoContent />
      <View style={styles.buttons}>
        <Button text="Resize to 100%" onPress={() => navigation.resize(1)} />
        <Button text="Open Profile" onPress={() => router.push('/sheet/profile')} />
        <Button text="Pop to Top (Home)" onPress={() => navigation.popToTop()} />
        <Button text="Go Back" onPress={() => router.back()} />
      </View>
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
