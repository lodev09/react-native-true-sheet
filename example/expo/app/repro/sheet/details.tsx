import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button } from '@example/shared/components';
import { DARK, GAP, SPACING } from '@example/shared/utils';

export default function ReproSheetDetails() {
  const router = useRouter();

  return (
    <View style={styles.content}>
      <Text style={styles.title}>Repro Details Sheet</Text>
      <Button text="Go Back" onPress={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    backgroundColor: DARK,
    padding: SPACING,
    gap: GAP,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
    color: 'white',
  },
});
