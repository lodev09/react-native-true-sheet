import { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TrueSheet, TrueSheetProvider } from '@lodev09/react-native-true-sheet';

import {
  BasicSheet,
  BlankSheet,
  FlatListSheet,
  FlashListSheet,
  GestureSheet,
  LegendListSheet,
  NavigationSheet,
  PromptSheet,
  ScrollViewSheet,
} from '../components/sheets';
import { Button, Spacer } from '../components';
import { BLUE, GAP, LIGHT_GRAY, SPACING } from '../utils';

export interface StandardScreenProps {
  onNavigateToTest?: () => void;
  onNavigateToModal?: () => void;
  onNavigateToMap?: () => void;
}

export const StandardScreen = ({
  onNavigateToTest,
  onNavigateToModal,
  onNavigateToMap,
}: StandardScreenProps) => {
  const basicSheet = useRef<TrueSheet>(null);
  const promptSheet = useRef<TrueSheet>(null);
  const scrollViewSheet = useRef<TrueSheet>(null);
  const flatListSheet = useRef<TrueSheet>(null);
  const flashListSheet = useRef<TrueSheet>(null);
  const legendListSheet = useRef<TrueSheet>(null);
  const gestureSheet = useRef<TrueSheet>(null);
  const blankSheet = useRef<TrueSheet>(null);
  const navigationSheet = useRef<TrueSheet>(null);

  const presentBasicSheet = async (index = 0) => {
    await basicSheet.current?.present(index);
    console.log('Sheet 1 present async');
  };

  return (
    <TrueSheetProvider>
      <View style={styles.content}>
        <View style={styles.heading}>
          <Text style={styles.title}>True Sheet</Text>
          <Text style={styles.subtitle}>The true native bottom sheet experience.</Text>
        </View>

        <Button text="Navigate to Test" onPress={onNavigateToTest} />
        <Button text="Open Modal" onPress={onNavigateToModal} />
        <Button text="Open Navigation Sheet" onPress={() => navigationSheet.current?.present()} />
        <Button text="Navigate to Map" onPress={onNavigateToMap} />
        <Spacer />
        <Button text="TrueSheet View" onPress={() => presentBasicSheet(0)} />
        <Button text="TrueSheet Prompt" onPress={() => promptSheet.current?.present()} />
        <Button text="TrueSheet ScrollView" onPress={() => scrollViewSheet.current?.present()} />
        <Button text="TrueSheet FlatList" onPress={() => flatListSheet.current?.present()} />
        <Button text="TrueSheet FlashList" onPress={() => flashListSheet.current?.present()} />
        <Button text="TrueSheet LegendList" onPress={() => legendListSheet.current?.present()} />
        <Button text="TrueSheet Gestures" onPress={() => gestureSheet.current?.present()} />
        <Button text="Blank Sheet" onPress={() => blankSheet.current?.present()} />

        <BasicSheet ref={basicSheet} onNavigateToTest={onNavigateToTest} />
        <PromptSheet ref={promptSheet} />
        <ScrollViewSheet ref={scrollViewSheet} />
        <FlatListSheet ref={flatListSheet} />
        <FlashListSheet ref={flashListSheet} />
        <LegendListSheet ref={legendListSheet} />
        <GestureSheet ref={gestureSheet} />
        <BlankSheet ref={blankSheet} />
        <NavigationSheet ref={navigationSheet} />
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
