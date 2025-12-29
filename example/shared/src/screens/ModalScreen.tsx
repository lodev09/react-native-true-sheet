import { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TrueSheetProvider, type TrueSheet } from '@lodev09/react-native-true-sheet';

import { BLUE, GAP, LIGHT_GRAY, SPACING } from '../utils';
import { Button, Input, Spacer } from '../components';
import { PromptSheet, FlatListSheet } from '../components/sheets';

export interface ModalScreenProps {
  onNavigateToTest?: () => void;
  onDismiss?: () => void;
}

export const ModalScreen = ({ onNavigateToTest, onDismiss }: ModalScreenProps) => {
  const promptSheet = useRef<TrueSheet>(null);
  const flatlistSheet = useRef<TrueSheet>(null);

  return (
    <TrueSheetProvider>
      <View style={styles.content}>
        <Button text="Dismiss Modal" onPress={onDismiss} />
        <View style={styles.heading}>
          <Text style={styles.title}>Modal Screen</Text>
          <Text style={styles.subtitle}>
            This is a fullScreenModal opened from a TrueSheet. You can present sheets from here too!
          </Text>
        </View>
        <Input />
        <Button text="TrueSheet Prompt" onPress={() => promptSheet.current?.present()} />
        <Button text="TrueSheet FlatList" onPress={() => flatlistSheet.current?.present()} />
        <Spacer />
        <Button text="Navigate Test" onPress={onNavigateToTest} />

        <PromptSheet initialDetentIndex={0} ref={promptSheet} dimmed={false} />
        <FlatListSheet ref={flatlistSheet} />
      </View>
    </TrueSheetProvider>
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
