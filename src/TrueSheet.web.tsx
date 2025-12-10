import {
  createElement,
  Fragment,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';

import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetFooter,
  type BottomSheetFooterProps,
  BottomSheetHandle,
  type BottomSheetHandleProps,
  BottomSheetModal,
  BottomSheetView,
  type SNAP_POINT_TYPE,
} from '@gorhom/bottom-sheet';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';

import { TrueSheetContext, type TrueSheetInstanceMethods } from './TrueSheetProvider.web';
import type {
  TrueSheetProps,
  DetentChangeEvent,
  DidBlurEvent,
  DidDismissEvent,
  DidFocusEvent,
  DidPresentEvent,
  MountEvent,
  PositionChangeEvent,
  WillBlurEvent,
  WillDismissEvent,
  WillFocusEvent,
  WillPresentEvent,
  DragBeginEvent,
  DragChangeEvent,
  DragEndEvent,
} from './TrueSheet.types';

const DEFAULT_CORNER_RADIUS = 16;
const DEFAULT_GRABBER_COLOR = 'rgba(0, 0, 0, 0.3)';

const renderSlot = (slot: TrueSheetProps['header'] | TrueSheetProps['footer']) => {
  if (!slot) return null;
  if (isValidElement(slot)) return slot;
  return createElement(slot);
};

export interface TrueSheetRef {
  present: (index?: number, animated?: boolean) => Promise<void>;
  dismiss: (animated?: boolean) => Promise<void>;
  resize: (index: number) => Promise<void>;
}

export const TrueSheet = forwardRef<TrueSheetRef, TrueSheetProps>((props, ref) => {
  const {
    name,
    detents = [0.5, 1],
    dismissible = true,
    draggable = true,
    dimmed = true,
    dimmedDetentIndex = 0,
    children,
    scrollable = false,
    initialDetentIndex = -1,
    backgroundColor = '#ffffff',
    cornerRadius = DEFAULT_CORNER_RADIUS,
    grabber = true,
    grabberOptions,
    maxHeight,
    header,
    footer,
    onMount,
    onWillPresent,
    onDidPresent,
    onWillDismiss,
    onDidDismiss,
    onDetentChange,
    onPositionChange,
    onDragBegin,
    onDragChange,
    onDragEnd,
    onWillFocus,
    onDidFocus,
    onWillBlur,
    onDidBlur,
    style,
  } = props;

  const { height: windowHeight } = useWindowDimensions();
  const sheetContext = useContext(TrueSheetContext);
  const modalRef = useRef<BottomSheetModal>(null);
  const initialDetentIndexRef = useRef(initialDetentIndex);
  const currentIndexRef = useRef(0);
  const isPresenting = useRef(false);
  const isDismissing = useRef(false);
  const isMinimized = useRef(false);
  const isDragging = useRef(false);

  const animatedPosition = useSharedValue(windowHeight);
  const animatedIndex = useSharedValue(0);

  const [snapIndex, setSnapIndex] = useState(initialDetentIndex);
  const [isMounted, setIsMounted] = useState(false);

  useDerivedValue(() => {
    onPositionChange?.({
      nativeEvent: {
        position: animatedPosition.value,
        index: animatedIndex.value,
        detent: detents[animatedIndex.value] ?? 0,
        realtime: true,
      },
    } as PositionChangeEvent);
  });

  const hasAutoDetent = detents.includes('auto');

  const containerHeight = maxHeight ?? windowHeight;
  const snapPoints = useMemo(
    () =>
      detents
        .filter((detent): detent is number => detent !== 'auto' && typeof detent === 'number')
        .map((detent) => Math.min(1, Math.max(0.1, detent)) * containerHeight),
    [detents, containerHeight]
  );

  const handleChange = useCallback(
    (index: number, _position: number, _type: SNAP_POINT_TYPE) => {
      const previousIndex = currentIndexRef.current;
      currentIndexRef.current = index;

      // Handle drag end
      if (isDragging.current && !isPresenting.current) {
        isDragging.current = false;
        onDragEnd?.({
          nativeEvent: {
            index,
            position: animatedPosition.value,
            detent: detents[index] ?? 0,
          },
        } as DragEndEvent);
      }

      if (!isPresenting.current && !isMinimized.current && previousIndex !== index && index >= 0) {
        onDetentChange?.({
          nativeEvent: {
            index,
            position: animatedPosition.value,
            detent: detents[index] ?? 0,
          },
        } as DetentChangeEvent);
      }

      if (isPresenting.current) {
        isPresenting.current = false;

        onDidPresent?.({
          nativeEvent: {
            index,
            position: animatedPosition.value,
            detent: detents[index] ?? 0,
          },
        } as DidPresentEvent);

        onDidFocus?.({ nativeEvent: null } as DidFocusEvent);
      }

      // Fire onDidBlur when sheet reaches minimized state (index -1 but still mounted)
      if (isMinimized.current && index === -1) {
        onDidBlur?.({ nativeEvent: null } as DidBlurEvent);
      }

      // Fire onDidFocus when sheet is restored from minimized state
      if (isMinimized.current && index >= 0) {
        isMinimized.current = false;
        onDidFocus?.({ nativeEvent: null } as DidFocusEvent);
      }
    },
    [detents, animatedPosition]
  );

  const handleDismiss = useCallback(() => {
    onDidDismiss?.({ nativeEvent: null } as DidDismissEvent);

    // Reset states since sheet is being dismissed
    isMinimized.current = false;
    isDismissing.current = false;
    isDragging.current = false;
  }, []);

  const handleAnimate = useCallback(
    (_fromIndex: number, toIndex: number) => {
      // Detect drag begin (when not presenting or dismissing)
      if (!isPresenting.current && !isDismissing.current && !isDragging.current && toIndex >= 0) {
        isDragging.current = true;
        onDragBegin?.({
          nativeEvent: {
            index: currentIndexRef.current,
            position: animatedPosition.value,
            detent: detents[currentIndexRef.current] ?? 0,
          },
        } as DragBeginEvent);
      }

      // Drag change during animation
      if (isDragging.current && toIndex >= 0) {
        onDragChange?.({
          nativeEvent: {
            index: toIndex,
            position: animatedPosition.value,
            detent: detents[toIndex] ?? 0,
          },
        } as DragChangeEvent);
      }

      if (isPresenting.current) {
        onWillPresent?.({
          nativeEvent: {
            index: toIndex,
            position: animatedPosition.value,
            detent: detents[toIndex] ?? 0,
          },
        } as WillPresentEvent);

        // Focus events fire together with present events
        onWillFocus?.({ nativeEvent: null } as WillFocusEvent);
      }

      // Detect if sheet is being restored (will focus)
      if (isMinimized.current && toIndex >= 0) {
        onWillFocus?.({ nativeEvent: null } as WillFocusEvent);
      }

      if (toIndex === -1 && !isPresenting.current) {
        // Will be handled as blur if the sheet doesn't actually dismiss
        isMinimized.current = true;
        onWillBlur?.({ nativeEvent: null } as WillBlurEvent);

        if (isDismissing.current) {
          onWillDismiss?.({ nativeEvent: null } as WillDismissEvent);
        }
      }
    },
    [detents, animatedPosition]
  );

  const backdropComponent = useCallback(
    (backdropProps: BottomSheetBackdropProps) => {
      if (!dimmed) {
        return null;
      }
      return (
        <BottomSheetBackdrop
          {...backdropProps}
          opacity={0.5}
          appearsOnIndex={dimmedDetentIndex}
          disappearsOnIndex={dimmedDetentIndex - 1}
          pressBehavior={dismissible ? 'close' : 'none'}
        />
      );
    },
    [dimmed, dimmedDetentIndex, dismissible]
  );

  const handleComponent = useCallback(
    (handleProps: BottomSheetHandleProps) => {
      if (!grabber) {
        return null;
      }
      return (
        <BottomSheetHandle
          {...handleProps}
          style={[
            styles.handle,
            grabberOptions?.topMargin !== undefined && { paddingTop: grabberOptions.topMargin },
          ]}
          indicatorStyle={[
            styles.handleIndicator,
            grabberOptions?.width !== undefined && { width: grabberOptions.width },
            grabberOptions?.height !== undefined && { height: grabberOptions.height },
            grabberOptions?.cornerRadius !== undefined && {
              borderRadius: grabberOptions.cornerRadius,
            },
            { backgroundColor: grabberOptions?.color ?? DEFAULT_GRABBER_COLOR },
          ]}
        />
      );
    },
    [grabber, grabberOptions]
  );

  const footerComponent = useMemo(
    () =>
      footer
        ? (footerProps: BottomSheetFooterProps) => (
            <BottomSheetFooter {...footerProps}>{renderSlot(footer)}</BottomSheetFooter>
          )
        : undefined,
    [footer]
  );

  // For scrollable, we render the child directly
  const ContainerComponent = scrollable ? Fragment : BottomSheetView;

  const sheetMethodsRef = useRef<TrueSheetInstanceMethods>({
    present: async (index = 0) => {
      setSnapIndex(index);
      isPresenting.current = true;
      modalRef.current?.present();
    },
    dismiss: async () => {
      isDismissing.current = true;
      modalRef.current?.dismiss();
    },
    resize: async (index: number) => {
      modalRef.current?.snapToIndex(index);
    },
  });

  useImperativeHandle(ref, () => sheetMethodsRef.current);

  // Register with context provider
  useEffect(() => {
    if (name) {
      sheetContext?.register(name, sheetMethodsRef);
    }
    return () => {
      if (name) {
        sheetContext?.unregister(name);
      }
    };
  }, [name, sheetContext]);

  // Auto-present on mount if initialDetentIndex is set
  useEffect(() => {
    if (initialDetentIndexRef.current >= 0) {
      sheetMethodsRef.current.present(initialDetentIndexRef.current);
    }
  }, []);

  // Handle mount event after first render
  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true);
      onMount?.({ nativeEvent: null } as MountEvent);
    }
  }, [isMounted, onMount]);

  return (
    <BottomSheetModal
      ref={modalRef}
      name={name}
      style={[
        styles.root,
        { backgroundColor, borderTopLeftRadius: cornerRadius, borderTopRightRadius: cornerRadius },
      ]}
      index={snapIndex}
      animateOnMount
      enablePanDownToClose={dismissible}
      enableContentPanningGesture={draggable}
      enableHandlePanningGesture={draggable}
      animatedPosition={animatedPosition}
      animatedIndex={animatedIndex}
      handleComponent={handleComponent}
      onChange={handleChange}
      onAnimate={handleAnimate}
      enableDynamicSizing={hasAutoDetent}
      maxDynamicContentSize={maxHeight}
      snapPoints={snapPoints.length > 0 ? snapPoints : undefined}
      onDismiss={handleDismiss}
      stackBehavior="switch"
      backdropComponent={backdropComponent}
      footerComponent={footerComponent}
    >
      <ContainerComponent>
        <View style={[styles.container, style]}>
          {renderSlot(header)}
          {children}
        </View>
      </ContainerComponent>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
  },
  container: {},
  handle: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    paddingVertical: 10,
    pointerEvents: 'none',
  },
  handleIndicator: {
    width: 36,
    height: 5,
  },
});
