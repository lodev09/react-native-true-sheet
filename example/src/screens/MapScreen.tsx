import { useRef, useState } from 'react';
import {
  Platform,
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

import { Button, Header, Spacer } from '../components';
import { BLUE, DARK, GAP, GRAY, HEADER_HEIGHT, SPACING } from '../utils';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BasicSheet,
  BlankSheet,
  FlatListSheet,
  GestureSheet,
  PromptSheet,
  ScrollViewSheet,
} from '../components/sheets';
import { useAppNavigation } from '../hooks';

const AnimatedButton = Animated.createAnimatedComponent(TouchableOpacity);

export const MapScreen = () => {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { animatedPosition } = useReanimatedTrueSheet();
  const navigation = useAppNavigation();

  const sheetRef = useRef<TrueSheet>(null);

  const basicSheet = useRef<TrueSheet>(null);
  const promptSheet = useRef<TrueSheet>(null);
  const scrollViewSheet = useRef<TrueSheet>(null);
  const flatListSheet = useRef<TrueSheet>(null);
  const gestureSheet = useRef<TrueSheet>(null);
  const blankSheet = useRef<TrueSheet>(null);

  const [scrollViewLoading, setScrollViewLoading] = useState(false);

  const presentBasicSheet = async (index = 0) => {
    await basicSheet.current?.present(index);
    console.log('Sheet 1 present async');
  };

  const presentScrollViewSheet = () => {
    setScrollViewLoading(true);
    requestAnimationFrame(async () => {
      await scrollViewSheet.current?.present();
      setScrollViewLoading(false);
    });
  };

  const floatingControlStyles: StyleProp<ViewStyle> = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: Math.min(-(insets.bottom + HEADER_HEIGHT), -(height - animatedPosition.value)),
      },
    ],
  }));

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
        style={[styles.floatingControl, floatingControlStyles]}
        onPress={() => sheetRef.current?.resize(0)}
      />
      <ReanimatedTrueSheet
        detents={[(HEADER_HEIGHT + insets.bottom) / height, 0.7, 1]}
        ref={sheetRef}
        initialDetentIndex={0}
        dimmedDetentIndex={2}
        dismissible={false}
        edgeToEdgeFullScreen
        style={[styles.content, { paddingBottom: insets.bottom + SPACING }]}
        backgroundColor={Platform.select({ default: DARK })}
        onLayout={(e) => {
          console.log(`Sheet layout ${e.nativeEvent.layout.width}x${e.nativeEvent.layout.height}`);
        }}
        onWillPresent={handleWillPresent}
        // onPositionChange={(e) => {
        //   'worklet';

        //   const { detent, position, index } = e.nativeEvent;
        //   console.log(`index: ${index}, detent: ${detent}, position: ${position}`);
        // }}
        onDidPresent={() => {
          console.log('Sheet is presented');
        }}
        onDidFocus={() => {
          console.log('Sheet is focused');
        }}
        onWillFocus={() => {
          console.log('Sheet will focus');
        }}
        onWillBlur={() => {
          console.log('Sheet will blur');
        }}
        onDidBlur={() => {
          console.log('Sheet is blurred');
        }}
        onMount={() => {
          // sheetRef.current?.present(1)
          console.log('Sheet is ready!');
        }}
        header={<Header onLayout={(e) => console.log(e.nativeEvent.layout.height)} />}
      >
        <View style={styles.heading}>
          <Text style={styles.title}>True Sheet 💩</Text>
          <Text style={styles.subtitle}>The true native bottom sheet experience.</Text>
        </View>
        <Button text="TrueSheet View" onPress={() => presentBasicSheet(0)} />
        <Button text="TrueSheet Prompt" onPress={() => promptSheet.current?.present()} />
        <Button
          text="TrueSheet ScrollView"
          loading={scrollViewLoading}
          disabled={scrollViewLoading}
          onPress={presentScrollViewSheet}
        />
        <Button text="TrueSheet FlatList" onPress={() => flatListSheet.current?.present()} />
        <Button text="TrueSheet Gestures" onPress={() => gestureSheet.current?.present()} />
        <Button text="Blank Sheet" onPress={() => blankSheet.current?.present()} />
        <Button text="Navigate to Modal" onPress={() => navigation.navigate('ModalStack')} />
        <Spacer />
        <Button text="Expand" onPress={() => sheetRef.current?.resize(2)} />
        <Button text="Collapse" onPress={() => sheetRef.current?.dismiss()} />
        <BasicSheet ref={basicSheet} />
        <PromptSheet ref={promptSheet} />
        <ScrollViewSheet ref={scrollViewSheet} />
        <GestureSheet ref={gestureSheet} />
        <BlankSheet ref={blankSheet} />
      </ReanimatedTrueSheet>
      <FlatListSheet ref={flatListSheet} />
    </View>
  );
};

const styles = StyleSheet.create({
  floatingControl: {
    position: 'absolute',
    right: SPACING,
    bottom: SPACING,
    height: SPACING * 3,
    width: SPACING * 3,
    borderRadius: (SPACING * 3) / 2,
    backgroundColor: Platform.select({ ios: 'rgba(0, 0, 0, 0.3)', android: DARK }),
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: Platform.select({ ios: StyleSheet.hairlineWidth }),
    elevation: 4,
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
  },
  heading: {
    marginBottom: SPACING,
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
