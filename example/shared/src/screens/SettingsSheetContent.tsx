import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/Button';
import { DemoContent } from '../components/DemoContent';
import { GAP, LIGHT_GRAY, SPACING } from '../utils/constants';

interface SettingsSheetContentProps {
  onResize: () => void;
  onOpenProfile: () => void;
  onPop: () => void;
}

export const SettingsSheetContent = ({
  onResize,
  onOpenProfile,
  onPop,
}: SettingsSheetContentProps) => {
  return (
    <View style={styles.sheetContent}>
      <Text style={styles.sheetTitle}>Settings Sheet</Text>
      <Text style={styles.sheetSubtitle}>Another sheet in the navigation stack.</Text>
      <DemoContent />
      <View style={styles.buttons}>
        <Button text="Resize to 100%" onPress={onResize} />
        <Button text="Open Profile" onPress={onOpenProfile} />
        <Button text="pop()" onPress={onPop} />
      </View>
    </View>
  );
};

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
