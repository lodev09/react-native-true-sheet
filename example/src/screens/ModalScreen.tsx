import { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { TrueSheet } from '@lodev09/react-native-true-sheet';

import { BLUE, GAP, LIGHT_GRAY, SPACING } from '../utils';
import { Button, Spacer } from '../components';
import { BasicSheet, PromptSheet, ScrollViewSheet } from '../components/sheets';
import { useAppNavigation } from '../hooks';

export const ModalScreen = () => {
  const basicSheet = useRef<TrueSheet>(null);
  const promptSheet = useRef<TrueSheet>(null);
  const scrollViewSheet = useRef<TrueSheet>(null);

  const navigation = useAppNavigation();

  return (
    <View style={styles.content}>
      <View style={styles.heading}>
        <Text style={styles.title}>Modal Screen</Text>
        <Text style={styles.subtitle}>
          This is a fullScreenModal opened from a TrueSheet. You can present sheets from here too!
        </Text>
      </View>

      <Button text="TrueSheet View" onPress={() => basicSheet.current?.present()} />
      <Button text="TrueSheet Prompt" onPress={() => promptSheet.current?.present()} />
      <Button text="TrueSheet ScrollView" onPress={() => scrollViewSheet.current?.present()} />
      <Spacer />
      <Button text="Navigate Test" onPress={() => navigation.navigate('Test')} />
      <Button text="Dimiss Modal" onPress={() => navigation.goBack()} />

      <BasicSheet ref={basicSheet} />
      <PromptSheet ref={promptSheet} />
      <ScrollViewSheet ref={scrollViewSheet} />
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
