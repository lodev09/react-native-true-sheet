import { useRef, useState, type ComponentType } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  TrueSheet,
  type WillPresentEvent,
  type DidPresentEvent,
  type DetentChangeEvent,
} from '@lodev09/react-native-true-sheet';
import {
  ReanimatedTrueSheet,
  useReanimatedTrueSheet,
} from '@lodev09/react-native-true-sheet/reanimated';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { TrueSheetProvider } from '@lodev09/react-native-true-sheet';
import { ReanimatedTrueSheetProvider } from '@lodev09/react-native-true-sheet/reanimated';

import { Button, DemoContent, Header, Spacer } from '../components';
import { BLUE, DARK, GAP, GRAY, HEADER_HEIGHT, SPACING } from '../utils';

import {
  BasicSheet,
  FlatListSheet,
  GestureSheet,
  PromptSheet,
  ScrollViewSheet,
} from '../components/sheets';

const AnimatedButton = Animated.createAnimatedComponent(TouchableOpacity);

export interface MapScreenProps {
  MapComponent: ComponentType<{ style?: StyleProp<ViewStyle> }>;
  onNavigateToModal?: () => void;
  onNavigateToSheetStack?: () => void;
}

const MapScreenInner = ({
  MapComponent,
  onNavigateToModal,
  onNavigateToSheetStack,
}: MapScreenProps) => {
  const { height } = useWindowDimensions();
  const { animatedPosition } = useReanimatedTrueSheet();

  const sheetRef = useRef<TrueSheet>(null);
  const minHeight = HEADER_HEIGHT + Platform.select({ ios: 0, default: SPACING });

  const basicSheet = useRef<TrueSheet>(null);
  const promptSheet = useRef<TrueSheet>(null);
  const scrollViewSheet = useRef<TrueSheet>(null);
  const flatListSheet = useRef<TrueSheet>(null);
  const gestureSheet = useRef<TrueSheet>(null);

  const [scrollViewLoading, setScrollViewLoading] = useState(false);
  const [showExtraContent, setShowExtraContent] = useState(false);

  const presentBasicSheet = async (index = 0) => {
    await basicSheet.current?.present(index);
    console.log('basic sheet presented');
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
        translateY: Math.min(-HEADER_HEIGHT, -(height - animatedPosition.value)),
      },
    ],
  }));

  return (
    <View style={styles.container}>
      <MapComponent style={styles.map} />
      <AnimatedButton
        activeOpacity={0.6}
        style={[styles.floatingControl, floatingControlStyles]}
        onPress={() => sheetRef.current?.resize(1)}
      />
      <ReanimatedTrueSheet
        name="main"
        detents={[minHeight / height, 'auto', 1]}
        ref={sheetRef}
        initialDetentIndex={0}
        dimmedDetentIndex={1}
        dismissible={false}
        edgeToEdgeFullScreen
        style={styles.content}
        backgroundColor={Platform.select({ ios: undefined, default: DARK })}
        onLayout={(e: LayoutChangeEvent) => {
          console.log(
            `sheet layout width: ${e.nativeEvent.layout.width}, height: ${e.nativeEvent.layout.height}`
          );
        }}
        onWillPresent={(e: WillPresentEvent) => {
          console.log(
            `will present index: ${e.nativeEvent.index}, detent: ${e.nativeEvent.detent}, position: ${e.nativeEvent.position}`
          );
        }}
        onDidPresent={(e: DidPresentEvent) => {
          console.log(
            `did present index: ${e.nativeEvent.index}, detent: ${e.nativeEvent.detent}, position: ${e.nativeEvent.position}`
          );
        }}
        onDidFocus={() => {
          console.log('sheet is focused');
        }}
        onWillFocus={() => {
          console.log('sheet will focus');
        }}
        onWillBlur={() => {
          console.log('sheet will blur');
        }}
        onDidBlur={() => {
          console.log('sheet is blurred');
        }}
        onMount={() => {
          console.log('sheet is ready!');
        }}
        onDetentChange={(e: DetentChangeEvent) => {
          console.log(
            `detent changed to index: ${e.nativeEvent.index}, detent: ${e.nativeEvent.detent}, position: ${e.nativeEvent.position}`
          );
        }}
        onWillDismiss={() => {
          console.log('sheet will dismiss');
        }}
        onDidDismiss={() => {
          console.log('sheet has been dismissed');
        }}
        header={<Header />}
      >
        <View style={styles.heading}>
          <Text style={styles.title}>True Sheet</Text>
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
        <View style={styles.buttonRow}>
          <Button style={styles.rowButton} text="Open Modal" onPress={onNavigateToModal} />
          <Button
            style={styles.rowButton}
            text="Sheet Navigator"
            onPress={onNavigateToSheetStack}
          />
        </View>
        <Spacer />
        {showExtraContent && <DemoContent text="Extra content that changes height" />}
        <View style={styles.buttonRow}>
          <Button
            style={styles.rowButton}
            text={showExtraContent ? 'Remove Content' : 'Add Content'}
            onPress={() => setShowExtraContent(!showExtraContent)}
          />
          <Button
            style={styles.rowButton}
            text="Expand"
            onPress={() => sheetRef.current?.resize(2)}
          />
        </View>
        <View style={styles.buttonRow}>
          <Button
            style={styles.rowButton}
            text="Collapse"
            onPress={() => sheetRef.current?.resize(0)}
          />
          <Button
            style={styles.rowButton}
            text="Dismiss"
            onPress={() => sheetRef.current?.dismiss()}
          />
        </View>
        <BasicSheet ref={basicSheet} />
        <PromptSheet ref={promptSheet} />
        <ScrollViewSheet ref={scrollViewSheet} />
        <GestureSheet ref={gestureSheet} />
      </ReanimatedTrueSheet>
      <FlatListSheet ref={flatListSheet} />
    </View>
  );
};

export const MapScreen = (props: MapScreenProps) => {
  return (
    <TrueSheetProvider>
      <ReanimatedTrueSheetProvider>
        <MapScreenInner {...props} />
      </ReanimatedTrueSheetProvider>
    </TrueSheetProvider>
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
    backgroundColor: Platform.select({ ios: 'rgba(0, 0, 0, 0.3)', default: DARK }),
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: Platform.select({ ios: StyleSheet.hairlineWidth }),
    elevation: 4,
  },
  container: {
    backgroundColor: BLUE,
    justifyContent: 'center',
    flex: 1,
  },
  map: StyleSheet.absoluteFill,
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
    fontWeight: '500',
    color: 'white',
  },
  subtitle: {
    lineHeight: 24,
    color: GRAY,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: GAP,
  },
  rowButton: {
    flex: 1,
  },
});
