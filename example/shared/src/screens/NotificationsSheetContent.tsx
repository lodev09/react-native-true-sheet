import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/Button';
import { DemoContent } from '../components/DemoContent';
import { GAP, LIGHT_GRAY, SPACING } from '../utils/constants';

interface NotificationsSheetContentProps {
  onPop: () => void;
  onPop2: () => void;
  onPopToSettings: () => void;
  onPopToDetails: () => void;
  onPopToTop: () => void;
}

export const NotificationsSheetContent = ({
  onPop,
  onPop2,
  onPopToSettings,
  onPopToDetails,
  onPopToTop,
}: NotificationsSheetContentProps) => {
  return (
    <View style={styles.sheetContent}>
      <Text style={styles.sheetTitle}>Notifications Sheet</Text>
      <Text style={styles.sheetSubtitle}>Fourth sheet - deepest in the stack.</Text>
      <DemoContent />
      <View style={styles.buttons}>
        <Button text="pop()" onPress={onPop} />
        <Button text="pop(2)" onPress={onPop2} />
        <Button text="popTo('Settings')" onPress={onPopToSettings} />
        <Button text="popTo('Details')" onPress={onPopToDetails} />
        <Button text="popToTop()" onPress={onPopToTop} />
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
