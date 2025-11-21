import { useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  TrueSheet,
  ReanimatedTrueSheet,
  useReanimatedTrueSheet,
  type WillPresentEvent,
} from '@lodev09/react-native-true-sheet';
import MapView from 'react-native-maps';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { Button, DemoContent, Footer, Spacer } from '../components';
import { BLUE, DARK, DARK_BLUE, FOOTER_HEIGHT, GAP, GRAY, SPACING } from '../utils';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BasicSheet,
  BlankSheet,
  FlatListSheet,
  GestureSheet,
  PromptSheet,
  ScrollViewSheet,
} from '../components/sheets';

const AnimatedButton = Animated.createAnimatedComponent(TouchableOpacity);

export const MapScreen = () => {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { animatedPosition } = useReanimatedTrueSheet();

  const sheetRef = useRef<TrueSheet>(null);

  const basicSheet = useRef<TrueSheet>(null);
  const promptSheet = useRef<TrueSheet>(null);
  const scrollViewSheet = useRef<TrueSheet>(null);
  const flatListSheet = useRef<TrueSheet>(null);
  const gestureSheet = useRef<TrueSheet>(null);
  const blankSheet = useRef<TrueSheet>(null);

  const [contentCount, setContentCount] = useState(0);

  const presentBasicSheet = async (index = 0) => {
    await basicSheet.current?.present(index);
    console.log('Sheet 1 present async');
  };

  const $floatingButtonStyles: StyleProp<ViewStyle> = [
    styles.floatingButton,
    useAnimatedStyle(() => ({
      transform: [{ translateY: Math.min(-insets.bottom, -(height - animatedPosition.value)) }],
    })),
  ];

  const addContent = () => {
    setContentCount((prev) => prev + 1);
  };

  const removeContent = () => {
    setContentCount((prev) => Math.max(0, prev - 1));
  };

  const handleWillPresent = (e: WillPresentEvent) => {
    const { index, position: yPosition } = e.nativeEvent;
    console.log(`Sheet will present to index: ${index} at position ${yPosition}`);
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialCamera={{
          altitude: 18000,
          zoom: 14,
          center: {
            latitude: 9.306743705457553,
            longitude: 123.30474002203727,
          },
          pitch: 0,
          heading: 0,
        }}
        userInterfaceStyle="dark"
      />
      <AnimatedButton
        activeOpacity={0.6}
        style={$floatingButtonStyles}
        onPress={() => sheetRef.current?.resize(0)}
      />
      <ReanimatedTrueSheet
        detents={['auto', 1]}
        ref={sheetRef}
        blurTint="dark"
        backgroundColor={DARK}
        dimmedIndex={2}
        // dismissible={false}
        cornerRadius={12}
        style={styles.content}
        initialDetentIndex={0}
        onWillPresent={handleWillPresent}
        // onPositionChange={(e) => {
        //   'worklet';
        //   console.log(`position changed at UI thread: ${e.nativeEvent.position}`);
        // }}
        onDidPresent={() => {
          console.log('Sheet is presented');
        }}
        // initialDetentAnimated={false}
        onMount={() => {
          // sheetRef.current?.present(1)
          console.log('Sheet is ready!');
        }}
        footer={<Footer />}
      >
        <View style={styles.heading}>
          <Text style={styles.title}>True Sheet 💩</Text>
          <Text style={styles.subtitle}>The true native bottom sheet experience.</Text>
        </View>
        {Array.from({ length: contentCount }, (_, i) => (
          <DemoContent key={i} color={DARK_BLUE} />
        ))}
        <Button text="TrueSheet View" onPress={() => presentBasicSheet(0)} />
        <Button text="TrueSheet Prompt" onPress={() => promptSheet.current?.present()} />
        <Button text="TrueSheet ScrollView" onPress={() => scrollViewSheet.current?.present()} />
        <Button text="TrueSheet FlatList" onPress={() => flatListSheet.current?.present()} />
        <Button text="TrueSheet Gestures" onPress={() => gestureSheet.current?.present()} />
        <Button text="Blank Sheet" onPress={() => blankSheet.current?.present()} />

        <Button text={`Add Content (${contentCount})`} onPress={addContent} />
        {contentCount > 0 && <Button text="Remove Content" onPress={removeContent} />}

        <Spacer />
        <Button text="Expand" onPress={() => sheetRef.current?.resize(1)} />
        <Button text="Dismiss" onPress={() => sheetRef.current?.dismiss()} />
        <BasicSheet ref={basicSheet} />
        <PromptSheet ref={promptSheet} />
        <ScrollViewSheet ref={scrollViewSheet} />
        <FlatListSheet ref={flatListSheet} />
        <GestureSheet ref={gestureSheet} />
        <BlankSheet ref={blankSheet} />
      </ReanimatedTrueSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    right: SPACING,
    bottom: SPACING,
    height: SPACING * 3,
    width: SPACING * 3,
    borderRadius: (SPACING * 3) / 2,
    backgroundColor: DARK_BLUE,
    shadowColor: DARK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  container: {
    backgroundColor: BLUE,
    justifyContent: 'center',
    flex: 1,
  },
  map: {
    flex: 1,
  },
  content: {
    padding: SPACING,
    gap: GAP,
    paddingBottom: FOOTER_HEIGHT + SPACING,
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
    color: GRAY,
  },
});
