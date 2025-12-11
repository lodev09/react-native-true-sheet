import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import type { TrueSheet } from '@lodev09/react-native-true-sheet';

import { BLUE, GAP, SPACING } from '../utils';
import { Button } from '../components';
import { BasicSheet, PromptSheet, FlatListSheet } from '../components/sheets';

export const TestScreen = () => {
  const basicSheet = useRef<TrueSheet>(null);
  const promptSheet = useRef<TrueSheet>(null);
  const flatListSheet = useRef<TrueSheet>(null);

  return (
    <View style={styles.content}>
      <Button text="TrueSheet Prompt" onPress={() => promptSheet.current?.present()} />
      <Button text="TrueSheet FlatList" onPress={() => flatListSheet.current?.present()} />

      <BasicSheet ref={basicSheet} />
      <PromptSheet ref={promptSheet} />
      <FlatListSheet ref={flatListSheet} />
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    backgroundColor: BLUE,
    justifyContent: 'center',
    flex: 1,
    padding: SPACING,
    gap: GAP,
  },
});
