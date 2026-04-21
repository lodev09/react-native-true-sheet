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
import type {
  PositionChangeEvent,
  SheetDetent,
  TrueSheetMethods,
  TrueSheetProps,
  TrueSheetStaticMethods,
} from './TrueSheet.types';
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

const TrueSheetComponent = forwardRef<TrueSheetMethods, TrueSheetProps>((props, ref) => {
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
    dimmed = true,
    dimmedDetentIndex = 0,
    onPositionChange,
  } = props;

  const validDetents = useMemo(
    () => detents.filter((d): d is SheetDetent => typeof d === 'number' || d === 'auto'),
    [detents]
  );

  const snapPointsProps = useMemo<
    { snapPoints: SheetDetent[]; fadeFromIndex: number } | { snapPoints?: undefined }
  >(() => {
    if (validDetents.length < 2) return {};
    return { snapPoints: validDetents, fadeFromIndex: dimmedDetentIndex };
  }, [validDetents, dimmedDetentIndex]);

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isLandscapeOrTablet = windowWidth >= 600 || windowWidth > windowHeight;

  const colorScheme = useColorScheme();
  const backgroundColor =
    backgroundColorProp ??
    (colorScheme === 'dark' ? COLOR_SURFACE_CONTAINER_LOW_DARK : COLOR_SURFACE_CONTAINER_LOW_LIGHT);

  const [isOpen, setIsOpen] = useState(false);
  const [activeSnapPoint, setActiveSnapPoint] = useState<SheetDetent | null>(
    () => validDetents[0] ?? null
  );

  // Keep activeSnapPoint valid if detents change (e.g., prop updates).
  useEffect(() => {
    if (validDetents.length === 0) return;
    setActiveSnapPoint((current) =>
      current != null && validDetents.includes(current) ? current : validDetents[0]!
    );
  }, [validDetents]);

  const validDetentsRef = useRef(validDetents);
  validDetentsRef.current = validDetents;

  const handleSetActiveSnapPoint = useCallback((snapPoint: number | string | null) => {
    setActiveSnapPoint(
      snapPoint == null ? null : typeof snapPoint === 'number' || snapPoint === 'auto'
        ? (snapPoint as SheetDetent)
        : null
    );
  }, []);

  const handlePositionChange = useCallback(
    (position: number) => {
      onPositionChange?.({
        nativeEvent: {
          position,
          index: 0,
          detent: 1,
          realtime: true,
        },
      } as PositionChangeEvent);
    },
    [onPositionChange]
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open && isOpen) {
        setIsOpen(false);
      }
    },
    [isOpen]
  );

  const methods = useMemo<TrueSheetMethods>(
    () => ({
      present: async (index = 0) => {
        const detent = validDetentsRef.current[index];
        if (detent === undefined) {
          throw new Error(
            `TrueSheet: present index (${index}) is out of bounds. detents array has ${validDetentsRef.current.length} item(s)`
          );
        }
        setActiveSnapPoint(detent);
        setIsOpen(true);
      },
      dismiss: async () => {
        setIsOpen(false);
      },
      resize: async (index) => {
        const detent = validDetentsRef.current[index];
        if (detent === undefined) {
          throw new Error(
            `TrueSheet: resize index (${index}) is out of bounds. detents array has ${validDetentsRef.current.length} item(s)`
          );
        }
        setActiveSnapPoint(detent);
      },
      dismissStack: async () => {
        setIsOpen(false);
      },
    }),
    []
  );

  useImperativeHandle(ref, () => methods, [methods]);

  const methodsRef = useRef<TrueSheetMethods | null>(methods);
  useRegisterSheet(name, methodsRef);

  const mergedContentStyle = useMemo<React.CSSProperties>(
    () => ({
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      backgroundColor: backgroundColor as string,
      maxWidth: isLandscapeOrTablet ? (maxContentWidth ?? DEFAULT_MAX_WIDTH) : undefined,
      marginLeft: isLandscapeOrTablet ? (anchor === 'left' ? anchorOffset : 'auto') : undefined,
      marginRight: isLandscapeOrTablet ? (anchor === 'right' ? anchorOffset : 'auto') : undefined,
    }),
    [backgroundColor, isLandscapeOrTablet, maxContentWidth, anchor, anchorOffset]
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
      onPositionChange={handlePositionChange}
      dismissible={dismissible}
      modal={dimmed}
      activeSnapPoint={activeSnapPoint}
      setActiveSnapPoint={handleSetActiveSnapPoint}
      {...snapPointsProps}
    >
      <Drawer.Portal>
        <Drawer.Overlay style={overlayStyle} />
        <Drawer.Content style={mergedContentStyle}>
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

export const TrueSheet = TrueSheetComponent as typeof TrueSheetComponent & TrueSheetStaticMethods;

const rejectStatic = async (): Promise<never> => {
  throw new Error(STATIC_METHOD_ERROR);
};

TrueSheet.present = rejectStatic;
TrueSheet.dismiss = rejectStatic;
TrueSheet.dismissStack = rejectStatic;
TrueSheet.resize = rejectStatic;
TrueSheet.dismissAll = rejectStatic;
