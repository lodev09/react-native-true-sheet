import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { TrueSheetProvider, type TrueSheet } from '@lodev09/react-native-true-sheet';

import { BLUE, GAP, SPACING } from '../utils';
import { Button } from '../components';
import { BasicSheet, PromptSheet, FlatListSheet } from '../components/sheets';

interface TestScreenProps {
  onGoBack: () => void;
}

export const TestScreen = ({ onGoBack }: TestScreenProps) => {
  const basicSheet = useRef<TrueSheet>(null);
  const promptSheet = useRef<TrueSheet>(null);
  const flatListSheet = useRef<TrueSheet>(null);

  return (
    <TrueSheetProvider>
      <View style={styles.content}>
        <Button text="Back Sheet" onPress={onGoBack} />
        <Button text="Basic Sheet" onPress={() => basicSheet.current?.present()} />
        <Button text="Prompt Sheet" onPress={() => promptSheet.current?.present()} />
        <Button text="FlatList Sheet" onPress={() => flatListSheet.current?.present()} />

        <BasicSheet dimmed={false} ref={basicSheet} />
        <PromptSheet ref={promptSheet} />
        <FlatListSheet ref={flatListSheet} />
      </View>
    </TrueSheetProvider>
  );
};

const styles = StyleSheet.create({
  content: {
    backgroundColor: BLUE,
    flex: 1,
    padding: SPACING,
    gap: GAP,
  },
});
