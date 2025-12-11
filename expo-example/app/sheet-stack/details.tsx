import { StyleSheet, Text, View } from 'react-native';
import { useTrueSheetNavigation } from '@lodev09/react-native-true-sheet/navigation';

import { Button, DemoContent } from '../../src/components';
import { GAP, LIGHT_GRAY, SPACING } from '../../src/utils';

export default function DetailsSheet() {
  const navigation = useTrueSheetNavigation();

  return (
    <View style={styles.sheetContent}>
      <Text style={styles.sheetTitle}>Details Sheet</Text>
      <Text style={styles.sheetSubtitle}>This is a sheet screen using expo-router.</Text>
      <DemoContent />
      <View style={styles.buttons}>
        <Button text="Resize to 100%" onPress={() => navigation.resize(1)} />
        <Button text="Open Settings" onPress={() => navigation.navigate('settings')} />
        <Button text="Go Back" onPress={() => navigation.goBack()} />
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
