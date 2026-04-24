import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
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
import Animated, {
  FadeInLeft,
  LinearTransition,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
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

interface LogEntry {
  id: number;
  text: string;
}

const LOG_FLASH_MS = 900;
const LOG_IDLE_COLOR = 'rgba(0, 0, 0, 0.55)';

const LogLine = ({ text }: { text: string }) => {
  const age = useSharedValue(0);
  useEffect(() => {
    age.value = withTiming(1, { duration: LOG_FLASH_MS });
  }, [age]);
  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(age.value, [0, 1], [BLUE, LOG_IDLE_COLOR]),
  }));
  return (
    <Animated.View
      entering={FadeInLeft.duration(180)}
      layout={LinearTransition.duration(180)}
      style={[styles.logLine, animatedStyle]}
    >
      <Text style={styles.logText} numberOfLines={1}>
        {text}
      </Text>
    </Animated.View>
  );
};

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
  const { width, height } = useWindowDimensions();
  const { animatedPosition } = useReanimatedTrueSheet();

  const isTablet = useMemo(() => {
    if (Platform.OS === 'ios') return Platform.isPad;
    return Math.min(width, height) >= 600;
  }, [width, height]);

  const sheetRef = useRef<TrueSheet>(null);
  const minHeight = HEADER_HEIGHT + Platform.select({ ios: 0, default: SPACING });

  const basicSheet = useRef<TrueSheet>(null);
  const promptSheet = useRef<TrueSheet>(null);
  const scrollViewSheet = useRef<TrueSheet>(null);
  const flatListSheet = useRef<TrueSheet>(null);
  const gestureSheet = useRef<TrueSheet>(null);

  const [anchorLeft, setAnchorLeft] = useState(false);
  const [scrollViewLoading, setScrollViewLoading] = useState(false);
  const [showExtraContent, setShowExtraContent] = useState(false);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logIdRef = useRef(0);
  const log = useCallback((text: string) => {
    const id = logIdRef.current++;
    setLogs((prev) => [{ id, text }, ...prev].slice(0, 6));
    setTimeout(() => {
      setLogs((prev) => prev.filter((e) => e.id !== id));
    }, 4000);
  }, []);

  const presentBasicSheet = async (index = 0) => {
    await basicSheet.current?.present(index);
    log('basic sheet presented');
  };

  const rapidPresentDismiss = async () => {
    for (let i = 0; i < 5; i++) {
      await basicSheet.current?.present(0);
      await basicSheet.current?.dismiss();
    }
    await basicSheet.current?.present(0);
  };

  const presentScrollViewSheet = () => {
    setScrollViewLoading(true);
    requestAnimationFrame(async () => {
      await scrollViewSheet.current?.present();
      setScrollViewLoading(false);
    });
  };

  const maxContentWidth = anchorLeft ? width * 0.4 : 500;
  const sheetOffset = isTablet ? -(width - maxContentWidth) / 2 + SPACING : 0;

  const floatingControlStyles: StyleProp<ViewStyle> = useAnimatedStyle(() => {
    const translateY = Math.min(-HEADER_HEIGHT, -(height - animatedPosition.value));
    const translateX = withSpring(anchorLeft ? sheetOffset * 2 : sheetOffset, {
      damping: 500,
      stiffness: 1000,
      mass: 3,
      overshootClamping: true,
    });
    return { transform: [{ translateX }, { translateY }] };
  });

  return (
    <View style={styles.container}>
      <MapComponent style={styles.map} />
      <View pointerEvents="none" style={styles.logContainer}>
        {logs.map((entry) => (
          <LogLine key={entry.id} text={entry.text} />
        ))}
      </View>
      <AnimatedButton
        activeOpacity={0.6}
        style={[styles.floatingControl, floatingControlStyles]}
        onPress={() => sheetRef.current?.present(1)}
      />
      <ReanimatedTrueSheet
        name="main"
        detents={[minHeight / height, 'auto', 1]}
        ref={sheetRef}
        initialDetentIndex={0}
        anchor={anchorLeft ? 'left' : 'center'}
        maxContentWidth={maxContentWidth}
        dimmedDetentIndex={1}
        // dismissible={false}
        style={styles.content}
        detached
        onLayout={(e: LayoutChangeEvent) => {
          log(
            `layout ${Math.round(e.nativeEvent.layout.width)}×${Math.round(e.nativeEvent.layout.height)}`
          );
        }}
        onWillPresent={(e: WillPresentEvent) => {
          log(
            `willPresent i:${e.nativeEvent.index} d:${e.nativeEvent.detent} y:${Math.round(e.nativeEvent.position)}`
          );
        }}
        onDidPresent={(e: DidPresentEvent) => {
          log(
            `didPresent i:${e.nativeEvent.index} d:${e.nativeEvent.detent} y:${Math.round(e.nativeEvent.position)}`
          );
        }}
        onDidFocus={() => log('didFocus')}
        onWillFocus={() => log('willFocus')}
        onWillBlur={() => log('willBlur')}
        onDidBlur={() => log('didBlur')}
        onMount={() => log('mounted')}
        onDetentChange={(e: DetentChangeEvent) => {
          log(
            `detentChange i:${e.nativeEvent.index} d:${e.nativeEvent.detent} y:${Math.round(e.nativeEvent.position)}`
          );
        }}
        onWillDismiss={() => log('willDismiss')}
        onDidDismiss={() => log('didDismiss')}
        header={<Header />}
      >
        <View style={styles.heading}>
          <Text style={styles.title}>True Sheet</Text>
          <Text style={styles.subtitle}>The true native bottom sheet experience.</Text>
        </View>
        <Button
          text="TrueSheet View"
          hint="Long press to stress test"
          onPress={() => presentBasicSheet(0)}
          onLongPress={rapidPresentDismiss}
        />
        <Button text="Open Modal" onPress={onNavigateToModal} />
        <Button text="Sheet Navigator" onPress={onNavigateToSheetStack} />
        {isTablet && (
          <ButtonGroup>
            <Button text="Anchor Left" onPress={() => setAnchorLeft(true)} />
            <Button text="Center" onPress={() => setAnchorLeft(false)} />
          </ButtonGroup>
        )}
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
  logContainer: {
    position: 'absolute',
    top: Platform.select({ ios: 60, default: 30 }),
    left: SPACING,
    right: SPACING,
    gap: 4,
    alignItems: 'flex-start',
    zIndex: 10,
  },
  logLine: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    maxWidth: '100%',
  },
  logText: {
    color: 'white',
    fontSize: 11,
    letterSpacing: 0.2,
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
  },
});
