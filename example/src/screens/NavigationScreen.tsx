import { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TrueSheet } from '@lodev09/react-native-true-sheet';

import {
  BasicSheet,
  BlankSheet,
  FlatListSheet,
  GestureSheet,
  PromptSheet,
  ScrollViewSheet,
} from '../components/sheets';
import { Button, Spacer } from '../components';
import { BLUE, LIGHT_GRAY, SPACING } from '../utils';
import { useAppNavigation } from '../hooks';

export const NavigationScreen = () => {
  const basicSheet = useRef<TrueSheet>(null);
  const promptSheet = useRef<TrueSheet>(null);
  const scrollViewSheet = useRef<TrueSheet>(null);
  const flatListSheet = useRef<TrueSheet>(null);
  const gestureSheet = useRef<TrueSheet>(null);
  const blankSheet = useRef<TrueSheet>(null);

  const navigation = useAppNavigation();

  const presentBasicSheet = async (index = 0) => {
    await basicSheet.current?.present(index);
    console.log('Sheet 1 present async');
  };

  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <Text style={styles.title}>True Sheet 💩</Text>
        <Text style={styles.subtitle}>The true native bottom sheet experience.</Text>
      </View>

      <Button text="Navigate to Screen" onPress={() => navigation.navigate('Child')} />
      <Spacer />

      <Button text="TrueSheet View" onPress={() => presentBasicSheet(0)} />
      <Button text="TrueSheet Prompt" onPress={() => promptSheet.current?.present()} />
      <Button text="TrueSheet ScrollView" onPress={() => scrollViewSheet.current?.present()} />
      <Button text="TrueSheet FlatList" onPress={() => flatListSheet.current?.present()} />
      <Button text="TrueSheet Gestures" onPress={() => gestureSheet.current?.present()} />
      <Button text="Blank Sheet" onPress={() => blankSheet.current?.present()} />

      <BasicSheet ref={basicSheet} />
      <PromptSheet ref={promptSheet} />
      <ScrollViewSheet ref={scrollViewSheet} />
      <FlatListSheet ref={flatListSheet} />
      <GestureSheet ref={gestureSheet} />
      <BlankSheet ref={blankSheet} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: BLUE,
    justifyContent: 'center',
    flex: 1,
    padding: SPACING,
  },
  heading: {
    marginBottom: SPACING * 2,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: 500,
    color: 'white',
  },
  subtitle: {
    lineHeight: 24,
    color: LIGHT_GRAY,
  },
});
