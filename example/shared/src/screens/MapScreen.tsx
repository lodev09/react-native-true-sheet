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

import { Button, ButtonGroup, DemoContent, Header, Spacer } from '../components';
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
  onNavigateToTest?: () => void;
  onNavigateToTestStack?: () => void;
}

const MapScreenInner = ({
  MapComponent,
  onNavigateToModal,
  onNavigateToSheetStack,
  onNavigateToTest,
  onNavigateToTestStack,
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
        onPress={() => sheetRef.current?.present(1)}
      />
      <ReanimatedTrueSheet
        name="main"
        detents={[minHeight / height, 'auto', 1]}
        ref={sheetRef}
        initialDetentIndex={1}
        dimmedDetentIndex={1}
        dimmed={false}
        dismissible={false}
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
        pageSizing={false}
      >
        <View style={styles.heading}>
          <Text style={styles.title}>True Sheet</Text>
          <Text style={styles.subtitle}>The true native bottom sheet experience.</Text>
        </View>
        <Button text="TrueSheet View" onPress={() => presentBasicSheet(0)} />
        <Button text="Open Modal" onPress={onNavigateToModal} />
        <Button text="Sheet Navigator" onPress={onNavigateToSheetStack} />
        <ButtonGroup>
          <Button text="Test Screen" onPress={onNavigateToTest} />
          <Button text="Test Stack" onPress={onNavigateToTestStack} />
        </ButtonGroup>
        <Spacer />
        <ButtonGroup>
          <Button text="Prompt" onPress={() => promptSheet.current?.present()} />
          <Button text="Gestures" onPress={() => gestureSheet.current?.present()} />
        </ButtonGroup>
        <ButtonGroup>
          <Button
            text="ScrollView"
            loading={scrollViewLoading}
            disabled={scrollViewLoading}
            onPress={presentScrollViewSheet}
          />
          <Button text="FlatList" onPress={() => flatListSheet.current?.present()} />
        </ButtonGroup>
        <Spacer />
        {showExtraContent && <DemoContent text="Extra content that changes height" />}
        <ButtonGroup>
          <Button
            text={showExtraContent ? 'Remove Content' : 'Add Content'}
            onPress={() => setShowExtraContent(!showExtraContent)}
          />
          <Button text="Expand" onPress={() => sheetRef.current?.resize(2)} />
        </ButtonGroup>
        <ButtonGroup>
          <Button text="Collapse" onPress={() => sheetRef.current?.resize(0)} />
          <Button text="Dismiss" onPress={() => sheetRef.current?.dismiss()} />
        </ButtonGroup>
        <BasicSheet
          ref={basicSheet}
          onNavigateToModal={onNavigateToModal}
          onNavigateToTest={onNavigateToTest}
        />
        <PromptSheet ref={promptSheet} />
        <ScrollViewSheet ref={scrollViewSheet} />
        <FlatListSheet ref={flatListSheet} />
        <GestureSheet ref={gestureSheet} />
      </ReanimatedTrueSheet>
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
});
