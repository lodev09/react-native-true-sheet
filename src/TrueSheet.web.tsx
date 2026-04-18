/// <reference lib="dom" />
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { View, useColorScheme, useWindowDimensions } from 'react-native';

import { Drawer } from './web/vaul';
import type { TrueSheetRefMethods } from './web/types';
import type { PositionChangeEvent, TrueSheetProps } from './TrueSheet.types';
import { useRegisterSheet } from './TrueSheetProvider.web';
import {
  COLOR_SURFACE_CONTAINER_LOW_DARK,
  COLOR_SURFACE_CONTAINER_LOW_LIGHT,
  DEFAULT_ANCHOR_OFFSET,
  DEFAULT_GRABBER_COLOR_DARK,
  DEFAULT_GRABBER_COLOR_LIGHT,
  DEFAULT_GRABBER_HEIGHT,
  DEFAULT_GRABBER_TOP_MARGIN,
  DEFAULT_GRABBER_WIDTH,
  DEFAULT_MAX_WIDTH,
} from './web/constants';

const TrueSheetComponent = forwardRef<TrueSheetRefMethods, TrueSheetProps>((props, ref) => {
  const {
    children,
    name,
    dismissible = true,
    style,
    backgroundColor: backgroundColorProp,
    maxContentWidth,
    anchor = 'center',
    anchorOffset = DEFAULT_ANCHOR_OFFSET,
    grabber = true,
    grabberOptions,
    detents = [0.5, 1],
    onPositionChange,
  } = props;

  const numericDetents = useMemo(
    () => detents.filter((d): d is number => typeof d === 'number'),
    [detents]
  );

  const snapPoints = useMemo(
    () => (numericDetents.length >= 2 ? numericDetents : undefined),
    [numericDetents]
  );

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isLandscapeOrTablet = windowWidth >= 600 || windowWidth > windowHeight;

  const colorScheme = useColorScheme();
  const backgroundColor =
    backgroundColorProp ??
    (colorScheme === 'dark' ? COLOR_SURFACE_CONTAINER_LOW_DARK : COLOR_SURFACE_CONTAINER_LOW_LIGHT);

  const [isOpen, setIsOpen] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const rafIdRef = useRef<number | null>(null);
  const lastPositionRef = useRef<number>(-1);

  const stopPolling = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  const pollPosition = useCallback(() => {
    const el = contentRef.current;
    if (el) {
      const position = el.getBoundingClientRect().top;
      if (position !== lastPositionRef.current) {
        lastPositionRef.current = position;
        onPositionChange?.({
          nativeEvent: {
            position,
            index: 0,
            detent: 1,
            realtime: true,
          },
        } as PositionChangeEvent);
      }
    }
    rafIdRef.current = requestAnimationFrame(pollPosition);
  }, [onPositionChange]);

  useEffect(() => {
    if (isOpen && rafIdRef.current === null) {
      pollPosition();
    }
  }, [isOpen, pollPosition]);

  useEffect(() => stopPolling, [stopPolling]);

  const handleAnimationEnd = useCallback(
    (open: boolean) => {
      if (!open) {
        stopPolling();
        lastPositionRef.current = -1;
      }
    },
    [stopPolling]
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open && isOpen) {
        setIsOpen(false);
      }
    },
    [isOpen]
  );

  const methods = useMemo<TrueSheetRefMethods>(
    () => ({
      present: async () => {
        setIsOpen(true);
      },
      dismiss: async () => {
        setIsOpen(false);
      },
      resize: async () => {},
      dismissStack: async () => {
        setIsOpen(false);
      },
    }),
    []
  );

  useImperativeHandle(ref, () => methods, [methods]);

  const methodsRef = useRef<TrueSheetRefMethods | null>(methods);
  useRegisterSheet(name, methodsRef);

  const mergedContentStyle = useMemo<React.CSSProperties>(
    () => ({
      position: 'fixed',
      left: 0,
      right: 0,
      bottom: 0,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      ...(snapPoints ? { top: 0 } : { height: `${(numericDetents[0] ?? 0.5) * 100}vh` }),
      backgroundColor: backgroundColor as string,
      maxWidth: isLandscapeOrTablet ? (maxContentWidth ?? DEFAULT_MAX_WIDTH) : undefined,
      marginLeft: isLandscapeOrTablet ? (anchor === 'left' ? anchorOffset : 'auto') : undefined,
      marginRight: isLandscapeOrTablet ? (anchor === 'right' ? anchorOffset : 'auto') : undefined,
    }),
    [
      snapPoints,
      numericDetents,
      backgroundColor,
      isLandscapeOrTablet,
      maxContentWidth,
      anchor,
      anchorOffset,
    ]
  );

  const defaultGrabberColor =
    colorScheme === 'dark' ? DEFAULT_GRABBER_COLOR_DARK : DEFAULT_GRABBER_COLOR_LIGHT;

  const grabberHeight = grabberOptions?.height ?? DEFAULT_GRABBER_HEIGHT;

  const handleStyle = useMemo<React.CSSProperties>(
    () => ({
      height: grabberHeight,
      width: grabberOptions?.width ?? DEFAULT_GRABBER_WIDTH,
      borderRadius: grabberOptions?.cornerRadius ?? grabberHeight / 2,
      backgroundColor: (grabberOptions?.color ?? defaultGrabberColor) as string,
      opacity: 1,
      marginTop: grabberOptions?.topMargin ?? DEFAULT_GRABBER_TOP_MARGIN,
    }),
    [grabberOptions, grabberHeight, defaultGrabberColor]
  );

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={handleOpenChange}
      onAnimationEnd={handleAnimationEnd}
      dismissible={dismissible}
      snapPoints={snapPoints}
    >
      <Drawer.Portal>
        <Drawer.Overlay style={overlayStyle} />
        <Drawer.Content ref={contentRef} style={mergedContentStyle}>
          <Drawer.Title style={visuallyHiddenStyle}>Sheet</Drawer.Title>
          {grabber && <Drawer.Handle style={handleStyle} />}
          <View style={style}>{children}</View>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
});

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
};

const visuallyHiddenStyle: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

const STATIC_METHOD_ERROR =
  'Static methods are not supported on web. Use the useTrueSheet() hook instead.';

interface TrueSheetStatic {
  present: (name: string, index?: number) => Promise<void>;
  dismiss: (name: string) => Promise<void>;
  dismissStack: (name: string) => Promise<void>;
  resize: (name: string, index: number) => Promise<void>;
  dismissAll: () => Promise<void>;
}

export const TrueSheet = TrueSheetComponent as typeof TrueSheetComponent & TrueSheetStatic;

TrueSheet.present = async () => {
  throw new Error(STATIC_METHOD_ERROR);
};
TrueSheet.dismiss = async () => {
  throw new Error(STATIC_METHOD_ERROR);
};
TrueSheet.dismissStack = async () => {
  throw new Error(STATIC_METHOD_ERROR);
};
TrueSheet.resize = async () => {
  throw new Error(STATIC_METHOD_ERROR);
};
TrueSheet.dismissAll = async () => {
  throw new Error(STATIC_METHOD_ERROR);
};
