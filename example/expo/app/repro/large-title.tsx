import { useLayoutEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useNavigation } from 'expo-router';
import { TrueSheet } from '@lodev09/react-native-true-sheet';

// https://github.com/lodev09/react-native-true-sheet/issues/884
// Scroll to confirm the large title collapses, press + to mount a sheet,
// dismiss it, then scroll again — the large title no longer collapses.
export default function ReproLargeTitle() {
  const navigation = useNavigation();
  const [sheetOpen, setSheetOpen] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      unstable_headerRightItems: () => [
        {
          type: 'button',
          icon: { type: 'sfSymbol', name: 'plus' },
          label: 'Open Sheet',
          onPress: () => setSheetOpen(true),
        },
      ],
    });
  }, [navigation]);

  return (
    <>
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        {Array.from({ length: 1000 }, (_, i) => (
          <Text key={i} style={styles.item}>
            Item {i}
          </Text>
        ))}
      </ScrollView>

      {sheetOpen && <TrueSheet initialDetentIndex={0} detents={[0.5]} />}
    </>
  );
}

const styles = StyleSheet.create({
  item: {
    padding: 4,
  },
});
