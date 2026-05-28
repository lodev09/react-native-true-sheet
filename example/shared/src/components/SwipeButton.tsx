import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, type PressableProps, StyleSheet, Text, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';

import { BLUE, DARK_GRAY, FOOTER_HEIGHT, SPACING } from '../utils';

const TRACK_HEIGHT = FOOTER_HEIGHT;
const TRACK_PADDING = SPACING / 4;
const THUMB_SIZE = TRACK_HEIGHT - TRACK_PADDING * 2;
const DEFAULT_COMPLETE_THRESHOLD = 0.85;
const DEFAULT_RESET_DELAY = 800;
const SNAP_CONFIG = {
  duration: 180,
  easing: Easing.out(Easing.cubic),
};
const FADE_CONFIG = {
  duration: 140,
  easing: Easing.out(Easing.cubic),
};

function getMaxDistance(trackWidth: number, trackPadding: number, thumbSize: number) {
  'worklet';
  return Math.max(trackWidth - trackPadding * 2 - thumbSize, 0);
}

export interface SwipeButtonProps extends Omit<PressableProps, 'onPress' | 'style' | 'children'> {
  children?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  onComplete: () => void | Promise<void>;
  completeThreshold?: number;
  resetOnComplete?: boolean;
  resetDelay?: number;
  style?: ViewStyle;
}

export const SwipeButton = ({
  children = 'Swipe to confirm',
  disabled = false,
  loading = false,
  onComplete,
  completeThreshold = DEFAULT_COMPLETE_THRESHOLD,
  resetOnComplete = false,
  resetDelay = DEFAULT_RESET_DELAY,
  style,
  ...pressableProps
}: SwipeButtonProps) => {
  const translateX = useSharedValue(0);
  const trackWidth = useSharedValue(0);
  const trackPadding = useSharedValue(TRACK_PADDING);
  const thumbSize = useSharedValue(THUMB_SIZE);
  const progress = useSharedValue(0);
  const completed = useSharedValue(false);
  const disabledValue = useSharedValue(disabled);
  const loadingValue = useSharedValue(loading);
  const startX = useSharedValue(0);
  const [presentationActive, setPresentationActive] = useState(false);
  const visualLoading = loading || presentationActive;
  const prevVisualLoading = useRef(visualLoading);
  const mounted = useRef(true);
  const resetTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => {
    completed.value = false;
    progress.value = 0;
    translateX.value = withTiming(0, SNAP_CONFIG);
  }, [completed, progress, translateX]);

  const runComplete = useCallback(() => {
    completed.value = true;

    let completePromise: Promise<void>;
    try {
      completePromise = Promise.resolve(onComplete());
    } catch (error) {
      completePromise = Promise.reject(error);
    }

    void completePromise
      .then(() => {
        if (mounted.current) setPresentationActive(false);
        if (resetOnComplete) resetTimeout.current = setTimeout(reset, resetDelay);
      })
      .catch((error) => {
        if (mounted.current) setPresentationActive(false);
        completed.value = false;
        reset();
        console.error('[SwipeButton] onComplete failed', error);
      });
  }, [completed, onComplete, reset, resetDelay, resetOnComplete]);

  useEffect(() => {
    disabledValue.value = disabled;
  }, [disabled, disabledValue]);

  useEffect(() => {
    loadingValue.value = visualLoading;
    const maxDistance = getMaxDistance(trackWidth.value, trackPadding.value, thumbSize.value);
    if (visualLoading) {
      completed.value = true;
      progress.value = 1;
      translateX.value = withTiming(maxDistance, SNAP_CONFIG);
    } else if (prevVisualLoading.current) {
      reset();
    }
    prevVisualLoading.current = visualLoading;
  }, [
    completed,
    loadingValue,
    progress,
    reset,
    thumbSize,
    trackPadding,
    trackWidth,
    translateX,
    visualLoading,
  ]);

  useEffect(() => {
    return () => {
      mounted.current = false;
      if (resetTimeout.current) clearTimeout(resetTimeout.current);
    };
  }, []);

  const setTrackWidth = useCallback(
    (width: number) => {
      trackWidth.value = width;
      if (visualLoading || completed.value) {
        const maxDistance = getMaxDistance(width, trackPadding.value, thumbSize.value);
        translateX.value = maxDistance;
        progress.value = maxDistance > 0 ? 1 : 0;
      }
    },
    [completed, progress, thumbSize, trackPadding, trackWidth, translateX, visualLoading]
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(!disabled && !visualLoading)
        .onBegin(() => {
          startX.value = translateX.value;
        })
        .onUpdate((event) => {
          if (disabledValue.value || loadingValue.value || completed.value) return;

          const maxDistance = getMaxDistance(trackWidth.value, trackPadding.value, thumbSize.value);
          const nextX = Math.min(Math.max(startX.value + event.translationX, 0), maxDistance);
          translateX.value = nextX;
          progress.value = maxDistance > 0 ? nextX / maxDistance : 0;
        })
        .onEnd(() => {
          if (disabledValue.value || loadingValue.value || completed.value) return;

          const maxDistance = getMaxDistance(trackWidth.value, trackPadding.value, thumbSize.value);
          const shouldComplete =
            maxDistance > 0 && translateX.value >= maxDistance * completeThreshold;

          if (shouldComplete) {
            completed.value = true;
            progress.value = 1;
            translateX.value = withTiming(maxDistance, SNAP_CONFIG, () => {
              scheduleOnRN(runComplete);
            });
            return;
          }

          progress.value = 0;
          translateX.value = withTiming(0, SNAP_CONFIG);
        }),
    [
      completeThreshold,
      completed,
      disabled,
      disabledValue,
      loadingValue,
      progress,
      runComplete,
      startX,
      thumbSize,
      trackPadding,
      trackWidth,
      translateX,
      visualLoading,
    ]
  );

  const fillStyle = useAnimatedStyle(() => ({
    width: thumbSize.value + translateX.value,
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    left: trackPadding.value + thumbSize.value,
    right: trackPadding.value,
    opacity: withTiming(visualLoading ? 0 : 1, FADE_CONFIG),
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled, busy: visualLoading }}
        disabled={disabled || visualLoading}
        style={[styles.track, style]}
        onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
        {...pressableProps}
      >
        <Animated.View pointerEvents="none" style={[styles.fill, fillStyle]} />
        <Animated.View pointerEvents="none" style={[styles.label, labelStyle]}>
          <Text numberOfLines={1} style={styles.labelText}>
            {children}
          </Text>
        </Animated.View>
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </Pressable>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    height: TRACK_HEIGHT,
    padding: TRACK_PADDING,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: DARK_GRAY,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    position: 'absolute',
    left: TRACK_PADDING,
    top: TRACK_PADDING,
    bottom: TRACK_PADDING,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: BLUE,
    overflow: 'hidden',
    zIndex: 2,
  },
  label: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  labelText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#fff',
    zIndex: 3,
  },
});
