import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/Button';
import { DemoContent } from '../components/DemoContent';
import { GAP, LIGHT_GRAY, SPACING } from '../utils/constants';

interface ProfileSheetContentProps {
  onOpenNotifications: () => void;
  onPop: () => void;
  onPop2: () => void;
  onPopToTop: () => void;
}

export const ProfileSheetContent = ({
  onOpenNotifications,
  onPop,
  onPop2,
  onPopToTop,
}: ProfileSheetContentProps) => {
  return (
    <View style={styles.sheetContent}>
      <Text style={styles.sheetTitle}>Profile Sheet</Text>
      <Text style={styles.sheetSubtitle}>Third sheet in the stack.</Text>
      <DemoContent />
      <View style={styles.buttons}>
        <Button text="Open Notifications" onPress={onOpenNotifications} />
        <Button text="pop()" onPress={onPop} />
        <Button text="pop(2)" onPress={onPop2} />
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
