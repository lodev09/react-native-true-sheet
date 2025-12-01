import { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { TrueSheet } from '@lodev09/react-native-true-sheet';

import { BLUE, GAP, LIGHT_GRAY, SPACING } from '../utils';
import { Button, Spacer } from '../components';
import { PromptSheet, FlatListSheet } from '../components/sheets';
import { useAppNavigation } from '../hooks';

export const ModalScreen = () => {
  const promptSheet = useRef<TrueSheet>(null);
  const flatlistSheet = useRef<TrueSheet>(null);

  const navigation = useAppNavigation();

  return (
    <View style={styles.content}>
      <View style={styles.heading}>
        <Text style={styles.title}>Modal Screen</Text>
        <Text style={styles.subtitle}>
          This is a fullScreenModal opened from a TrueSheet. You can present sheets from here too!
        </Text>
      </View>

      <Button text="TrueSheet Prompt" onPress={() => promptSheet.current?.present()} />
      <Button text="TrueSheet FlatList" onPress={() => flatlistSheet.current?.present()} />
      <Spacer />
      <Button text="Navigate Test" onPress={() => navigation.navigate('Test')} />
      <Button text="Dimiss Modal" onPress={() => navigation.goBack()} />

      <PromptSheet ref={promptSheet} />
      <FlatListSheet ref={flatlistSheet} />
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
