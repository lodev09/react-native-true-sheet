import {
  createElement,
  Fragment,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';

import BottomSheet, {
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

import {
  BottomSheetContext,
  getPresent,
  getDismiss,
  getResize,
  getDismissAll,
} from './TrueSheetProvider.web';
import type {
  TrueSheetProps,
  TrueSheetRef,
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
const DEFAULT_ELEVATION = 4;

const DEFAULT_GRABBER_COLOR = 'rgba(0, 0, 0, 0.3)';
const DEFAULT_GRABBER_WIDTH = 32;
const DEFAULT_GRABBER_HEIGHT = 4;

/**
 * Converts elevation to CSS box-shadow based on Material Design 3 elevation system.
 * Uses a combination of ambient and key shadows for realistic depth.
 */
const getElevationShadow = (elevation: number): string => {
  if (elevation <= 0) return 'none';

  const ambientY = elevation * 0.5;
  const ambientBlur = elevation * 1.5;
  const ambientOpacity = 0.08 + elevation * 0.01;

  const keyY = elevation;
  const keyBlur = elevation * 2;
  const keyOpacity = 0.12 + elevation * 0.02;

  return `0px ${ambientY}px ${ambientBlur}px rgba(0, 0, 0, ${ambientOpacity}), 0px ${keyY}px ${keyBlur}px rgba(0, 0, 0, ${keyOpacity})`;
};

const renderSlot = (slot: TrueSheetProps['header'] | TrueSheetProps['footer']) => {
  if (!slot) return null;
  if (isValidElement(slot)) return slot;
  return createElement(slot);
};

const TrueSheetComponent = forwardRef<TrueSheetRef, TrueSheetProps>((props, ref) => {
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
    elevation = DEFAULT_ELEVATION,
    grabber = true,
    grabberOptions,
    maxHeight,
    header,
    headerStyle,
    footer,
    footerStyle,
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
    stackBehavior = 'switch',
    style,
  } = props;

  const { height: windowHeight } = useWindowDimensions();
  const defaultName = useId();
  const sheetName = name ?? defaultName;
  const bottomSheetContext = useContext(BottomSheetContext);
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const initialDetentIndexRef = useRef(initialDetentIndex);
  const currentIndexRef = useRef(0);
  const isPresenting = useRef(false);
  const isDismissing = useRef(false);
  const isMinimized = useRef(false);
  const isDragging = useRef(false);

  const presentResolver = useRef<(() => void) | null>(null);
  const dismissResolver = useRef<(() => void) | null>(null);

  const animatedPosition = useSharedValue(windowHeight);
  const animatedIndex = useSharedValue(0);

  const [snapIndex, setSnapIndex] = useState(initialDetentIndex);
  const [isMounted, setIsMounted] = useState(false);

  const isNonModal = stackBehavior === 'none';

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

        // Resolve present promise
        if (presentResolver.current) {
          presentResolver.current();
          presentResolver.current = null;
        }

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
    // Remove from stack when dismissed
    bottomSheetContext?.removeFromStack(sheetName);

    // Resolve dismiss promise
    if (dismissResolver.current) {
      dismissResolver.current();
      dismissResolver.current = null;
    }

    onDidDismiss?.({ nativeEvent: null } as DidDismissEvent);

    // Reset states since sheet is being dismissed
    isMinimized.current = false;
    isDismissing.current = false;
    isDragging.current = false;
  }, [sheetName]);

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
        onWillDismiss?.({ nativeEvent: null } as WillDismissEvent);
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

      const height = grabberOptions?.height ?? DEFAULT_GRABBER_HEIGHT;
      const borderRadius = grabberOptions?.cornerRadius ?? height / 2;

      return (
        <BottomSheetHandle
          {...handleProps}
          style={[styles.handle, { paddingTop: grabberOptions?.topMargin }]}
          indicatorStyle={{
            height,
            borderRadius,
            width: grabberOptions?.width ?? DEFAULT_GRABBER_WIDTH,
            backgroundColor: grabberOptions?.color ?? DEFAULT_GRABBER_COLOR,
          }}
        />
      );
    },
    [grabber, grabberOptions]
  );

  const footerComponent = useMemo(
    () =>
      footer
        ? (footerProps: BottomSheetFooterProps) => (
            <BottomSheetFooter
              style={StyleSheet.flatten([styles.footer, footerStyle])}
              {...footerProps}
            >
              {renderSlot(footer)}
            </BottomSheetFooter>
          )
        : undefined,
    [footer, footerStyle]
  );

  // For scrollable, we render the child directly
  const ContainerComponent = scrollable ? Fragment : BottomSheetView;

  const dismissInternal = useCallback(() => {
    return new Promise<void>((resolve) => {
      dismissResolver.current = resolve;
      isDismissing.current = true;
      if (isNonModal) {
        bottomSheetRef.current?.close();
      } else {
        bottomSheetModalRef.current?.dismiss();
      }
    });
  }, [isNonModal]);

  const sheetMethodsRef = useRef<TrueSheetRef & { dismissDirect?: () => Promise<void> }>({
    present: (index = 0) => {
      return new Promise<void>((resolve) => {
        presentResolver.current = resolve;
        setSnapIndex(index);
        isPresenting.current = true;
        if (isNonModal) {
          bottomSheetRef.current?.snapToIndex(index);
        } else {
          bottomSheetContext?.pushToStack(sheetName);
          bottomSheetModalRef.current?.present();
        }
      });
    },
    dismiss: async () => {
      const sheetsAbove = bottomSheetContext?.getSheetsAbove(sheetName) ?? [];

      // Dismiss all sheets above sequentially since gorhom/bottom-sheet doesn't support cascade dismiss
      for (const sheet of sheetsAbove) {
        await bottomSheetContext?.dismissDirect(sheet);
      }

      // Then dismiss this sheet
      await dismissInternal();
    },
    dismissChildren: () => {
      return new Promise<void>((resolve) => {
        // Dismiss only sheets above, keeping this sheet presented
        const sheetsAbove = bottomSheetContext?.getSheetsAbove(sheetName) ?? [];
        const immediateChild = sheetsAbove[sheetsAbove.length - 1];
        if (immediateChild) {
          // Dismiss the immediate child - gorhom will dismiss all sheets above it
          bottomSheetContext?.dismissDirect(immediateChild).then(resolve);
          return;
        }

        resolve();
      });
    },
    dismissDirect: () => dismissInternal(),
    resize: async (index: number) => {
      if (isNonModal) {
        bottomSheetRef.current?.snapToIndex(index);
      } else {
        bottomSheetModalRef.current?.snapToIndex(index);
      }
    },
  });

  useImperativeHandle(ref, () => sheetMethodsRef.current);

  // Register with context provider
  useEffect(() => {
    bottomSheetContext?.register(sheetName, sheetMethodsRef);
    return () => {
      bottomSheetContext?.unregister(sheetName);
    };
  }, [sheetName]);

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

  const sheetContent = (
    <ContainerComponent>
      {header && <View style={headerStyle}>{renderSlot(header)}</View>}
      {scrollable ? children : <View style={style}>{children}</View>}
    </ContainerComponent>
  );

  const sharedProps = {
    style: [
      styles.root,
      {
        backgroundColor,
        borderTopLeftRadius: cornerRadius,
        borderTopRightRadius: cornerRadius,
        boxShadow: getElevationShadow(elevation),
      },
    ],
    index: snapIndex,
    enablePanDownToClose: dismissible,
    enableContentPanningGesture: draggable,
    enableHandlePanningGesture: draggable,
    animatedPosition,
    animatedIndex,
    handleComponent,
    onChange: handleChange,
    onAnimate: handleAnimate,
    enableDynamicSizing: hasAutoDetent,
    maxDynamicContentSize: maxHeight,
    snapPoints: snapPoints.length > 0 ? snapPoints : undefined,
    backdropComponent,
    backgroundComponent: null,
    footerComponent,
  };

  if (isNonModal) {
    return (
      <BottomSheet ref={bottomSheetRef} onClose={handleDismiss} {...sharedProps}>
        {sheetContent}
      </BottomSheet>
    );
  }

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      name={sheetName}
      animateOnMount
      onDismiss={handleDismiss}
      stackBehavior={stackBehavior}
      {...sharedProps}
    >
      {sheetContent}
    </BottomSheetModal>
  );
});

interface TrueSheetStatic {
  present: (name: string, index?: number) => Promise<void>;
  dismiss: (name: string) => Promise<void>;
  resize: (name: string, index: number) => Promise<void>;
  dismissAll: () => Promise<void>;
}

export const TrueSheet = TrueSheetComponent as typeof TrueSheetComponent & TrueSheetStatic;

TrueSheet.present = async (name: string, index?: number) => {
  const present = getPresent();
  if (!present) {
    throw new Error('TrueSheet.present(): TrueSheetProvider is not mounted.');
  }
  return present(name, index);
};

TrueSheet.dismiss = async (name: string) => {
  const dismiss = getDismiss();
  if (!dismiss) {
    throw new Error('TrueSheet.dismiss(): TrueSheetProvider is not mounted.');
  }
  return dismiss(name);
};

TrueSheet.resize = async (name: string, index: number) => {
  const resize = getResize();
  if (!resize) {
    throw new Error('TrueSheet.resize(): TrueSheetProvider is not mounted.');
  }
  return resize(name, index);
};

TrueSheet.dismissAll = async () => {
  const dismissAll = getDismissAll();
  if (!dismissAll) {
    throw new Error('TrueSheet.dismissAll(): TrueSheetProvider is not mounted.');
  }
  return dismissAll();
};

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
  },
  handle: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    paddingVertical: 10,
    pointerEvents: 'none',
  },
  footer: {
    pointerEvents: 'box-none',
  },
});
