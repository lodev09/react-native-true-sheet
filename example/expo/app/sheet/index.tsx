import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button } from '@example/shared/components';
import { BLUE, GAP, LIGHT_GRAY, SPACING } from '@example/shared/utils';

export default function SheetHomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.content}>
      <View style={styles.heading}>
        <Text style={styles.title}>Sheet Navigator</Text>
        <Text style={styles.subtitle}>
          Using createTrueSheetNavigator with expo-router's withLayoutContext.
        </Text>
      </View>
      <Button text="Open Details Sheet" onPress={() => router.push('/sheet/details')} />
      <Button text="Open Settings Sheet" onPress={() => router.push('/sheet/settings')} />
      <Button text="Navigate to Test" onPress={() => router.push('/test')} />
      <Button text="Go Back" onPress={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    backgroundColor: BLUE,
    justifyContent: 'center',
    flex: 1,
    padding: SPACING,
    gap: GAP,
  },
  heading: {
    marginBottom: SPACING * 2,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '500',
    color: 'white',
  },
  subtitle: {
    lineHeight: 24,
    color: LIGHT_GRAY,
  },
});
