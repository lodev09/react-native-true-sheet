import {
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useColorScheme, useWindowDimensions } from 'react-native';
import { Drawer } from 'vaul';

import { SheetContext } from '../web/SheetContext';
import { getElevationShadow, renderSlot } from '../web/utils';
import {
  DEFAULT_CORNER_RADIUS,
  DEFAULT_ELEVATION,
  DEFAULT_MAX_WIDTH,
  COLOR_SURFACE_CONTAINER_LOW_LIGHT,
  COLOR_SURFACE_CONTAINER_LOW_DARK,
  DEFAULT_ANCHOR_OFFSET,
  DEFAULT_DETACHED_OFFSET,
  DEFAULT_GRABBER_COLOR_LIGHT,
  DEFAULT_GRABBER_COLOR_DARK,
  DEFAULT_GRABBER_WIDTH,
  DEFAULT_GRABBER_HEIGHT,
} from '../web/constants';
import type { WebRenderer, TrueSheetRefMethods } from '../web/types';
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
  DragEndEvent,
} from '../TrueSheet.types';

const VaulSheet = forwardRef<TrueSheetRefMethods, TrueSheetProps>((props, ref) => {
  const {
    name,
    detents = [0.5, 1],
    dismissible = true,
    draggable = true,
    dimmed = true,
    dimmedDetentIndex = 0,
    children,
    initialDetentIndex = -1,
    backgroundColor: backgroundColorProp,
    cornerRadius = DEFAULT_CORNER_RADIUS,
    elevation = DEFAULT_ELEVATION,
    grabber = true,
    grabberOptions,
    maxContentHeight,
    maxContentWidth,
    anchor = 'center',
    anchorOffset = DEFAULT_ANCHOR_OFFSET,
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
    onDragEnd,
    onWillFocus,
    onDidFocus,
    onWillBlur,
    onDidBlur,
    detached,
    detachedOffset = DEFAULT_DETACHED_OFFSET,
    stackBehavior = 'switch',
    style,
  } = props;

  const colorScheme = useColorScheme();
  const backgroundColor =
    backgroundColorProp ??
    (colorScheme === 'dark' ? COLOR_SURFACE_CONTAINER_LOW_DARK : COLOR_SURFACE_CONTAINER_LOW_LIGHT);

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isLandscapeOrTablet = windowWidth >= 600 || windowWidth > windowHeight;
  const defaultName = useId();
  const sheetName = name ?? defaultName;
  const context = useContext(SheetContext);

  const [isOpen, setIsOpen] = useState(false);
  const [activeSnapPoint, setActiveSnapPoint] = useState<number | string | null>(null);
  const isMountedRef = useRef(false);
  const isPresenting = useRef(false);
  const isDismissing = useRef(false);
  const isMinimized = useRef(false);
  const isDragging = useRef(false);
  const currentIndexRef = useRef(0);
  const presentResolver = useRef<(() => void) | null>(null);
  const dismissResolver = useRef<(() => void) | null>(null);
  const initialDetentIndexRef = useRef(initialDetentIndex);

  const isNonModal = stackBehavior === 'none';

  const hasAutoDetent = detents.includes('auto');
  const numericDetents = useMemo(
    () =>
      detents
        .filter((d): d is number => d !== 'auto' && typeof d === 'number')
        .map((d) => Math.min(1, Math.max(0.1, d))),
    [detents]
  );

  const snapPoints = hasAutoDetent ? undefined : numericDetents;

  const findDetentIndex = useCallback(
    (snapPoint: number | string | null): number => {
      if (snapPoint == null) return 0;
      const val = typeof snapPoint === 'string' ? parseFloat(snapPoint) : snapPoint;
      const idx = numericDetents.indexOf(val);
      return idx >= 0 ? idx : 0;
    },
    [numericDetents]
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open && !isOpen) return;

      if (!open && isOpen) {
        isDismissing.current = true;

        const sheetsAbove = context?.getSheetsAbove(sheetName) ?? [];
        if (sheetsAbove.length === 0) {
          onWillDismiss?.({ nativeEvent: null } as WillDismissEvent);
        } else {
          isMinimized.current = true;
          onWillBlur?.({ nativeEvent: null } as WillBlurEvent);
        }

        setIsOpen(false);
      }
    },
    [isOpen, sheetName, context, onWillDismiss, onWillBlur]
  );

  const handleAnimationEnd = useCallback(
    (open: boolean) => {
      if (open && isPresenting.current) {
        isPresenting.current = false;
        const index = currentIndexRef.current;

        if (presentResolver.current) {
          presentResolver.current();
          presentResolver.current = null;
        }

        onDidPresent?.({
          nativeEvent: { index, position: 0, detent: numericDetents[index] ?? 0 },
        } as DidPresentEvent);
        onDidFocus?.({ nativeEvent: null } as DidFocusEvent);
      }

      if (!open && isDismissing.current) {
        isDismissing.current = false;
        context?.removeFromStack(sheetName);

        if (dismissResolver.current) {
          dismissResolver.current();
          dismissResolver.current = null;
        }

        if (isMinimized.current) {
          onDidBlur?.({ nativeEvent: null } as DidBlurEvent);
        } else {
          onDidDismiss?.({ nativeEvent: null } as DidDismissEvent);
        }
        isMinimized.current = false;
      }
    },
    [sheetName, context, numericDetents]
  );

  const handleSnapPointChange = useCallback(
    (snapPoint: number | string | null) => {
      setActiveSnapPoint(snapPoint);
      const index = findDetentIndex(snapPoint);
      const previousIndex = currentIndexRef.current;
      currentIndexRef.current = index;

      if (!isPresenting.current && previousIndex !== index) {
        onDetentChange?.({
          nativeEvent: { index, position: 0, detent: numericDetents[index] ?? 0 },
        } as DetentChangeEvent);

        onPositionChange?.({
          nativeEvent: { index, position: 0, detent: numericDetents[index] ?? 0, realtime: false },
        } as PositionChangeEvent);
      }
    },
    [numericDetents, findDetentIndex]
  );

  const handleDrag = useCallback(
    (_event: React.PointerEvent<HTMLDivElement>, _percentageDragged: number) => {
      if (!isDragging.current && !isPresenting.current && !isDismissing.current) {
        isDragging.current = true;
        onDragBegin?.({
          nativeEvent: {
            index: currentIndexRef.current,
            position: 0,
            detent: numericDetents[currentIndexRef.current] ?? 0,
          },
        } as DragBeginEvent);
      }
    },
    [numericDetents]
  );

  const handleRelease = useCallback(
    (_event: React.PointerEvent<HTMLDivElement>, _open: boolean) => {
      if (isDragging.current) {
        isDragging.current = false;
        onDragEnd?.({
          nativeEvent: {
            index: currentIndexRef.current,
            position: 0,
            detent: numericDetents[currentIndexRef.current] ?? 0,
          },
        } as DragEndEvent);
      }
    },
    [numericDetents]
  );

  const shouldShowOverlay = dimmed && currentIndexRef.current >= dimmedDetentIndex;

  const sheetMethodsRef = useRef<TrueSheetRefMethods>({
    present: (index = 0) => {
      return new Promise<void>((resolve) => {
        presentResolver.current = resolve;
        isPresenting.current = true;
        currentIndexRef.current = index;

        if (!isMountedRef.current) {
          isMountedRef.current = true;
          onMount?.({ nativeEvent: null } as MountEvent);
        }

        onWillPresent?.({
          nativeEvent: { index, position: 0, detent: numericDetents[index] ?? 0 },
        } as WillPresentEvent);
        onWillFocus?.({ nativeEvent: null } as WillFocusEvent);

        if (snapPoints && snapPoints[index] != null) {
          setActiveSnapPoint(snapPoints[index]!);
        }

        if (!isNonModal) {
          context?.pushToStack(sheetName);
        }

        setIsOpen(true);
      });
    },
    dismiss: () => {
      return new Promise<void>((resolve) => {
        dismissResolver.current = resolve;
        isDismissing.current = true;
        onWillDismiss?.({ nativeEvent: null } as WillDismissEvent);
        setIsOpen(false);
      });
    },
    dismissStack: () => {
      return new Promise<void>((resolve) => {
        const sheetsAbove = context?.getSheetsAbove(sheetName) ?? [];
        const immediateChild = sheetsAbove[sheetsAbove.length - 1];
        if (immediateChild) {
          context?.dismiss(immediateChild).then(resolve);
          return;
        }
        resolve();
      });
    },
    resize: async (index: number) => {
      if (snapPoints && snapPoints[index] != null) {
        currentIndexRef.current = index;
        setActiveSnapPoint(snapPoints[index]!);
      }
    },
  });

  useImperativeHandle(ref, () => sheetMethodsRef.current);

  useEffect(() => {
    context?.register(sheetName, sheetMethodsRef);
    return () => {
      context?.unregister(sheetName);
    };
  }, [sheetName]);

  useEffect(() => {
    if (initialDetentIndexRef.current >= 0) {
      sheetMethodsRef.current.present(initialDetentIndexRef.current);
    }
  }, []);

  const defaultGrabberColor =
    colorScheme === 'dark' ? DEFAULT_GRABBER_COLOR_DARK : DEFAULT_GRABBER_COLOR_LIGHT;
  const handleHeight = grabberOptions?.height ?? DEFAULT_GRABBER_HEIGHT;

  const grabberStyle: React.CSSProperties = {
    width: grabberOptions?.width ?? DEFAULT_GRABBER_WIDTH,
    height: handleHeight,
    borderRadius: grabberOptions?.cornerRadius ?? handleHeight / 2,
    backgroundColor: String(grabberOptions?.color ?? defaultGrabberColor),
    margin: '0 auto',
    marginTop: grabberOptions?.topMargin ?? 10,
    marginBottom: 10,
  };

  const maxWidth = isLandscapeOrTablet ? (maxContentWidth ?? DEFAULT_MAX_WIDTH) : undefined;

  const contentStyle: React.CSSProperties = {
    backgroundColor: String(backgroundColor),
    borderTopLeftRadius: cornerRadius,
    borderTopRightRadius: cornerRadius,
    borderBottomLeftRadius: detached ? cornerRadius : 0,
    borderBottomRightRadius: detached ? cornerRadius : 0,
    boxShadow: getElevationShadow(elevation),
    maxWidth,
    maxHeight: maxContentHeight,
    marginLeft: isLandscapeOrTablet ? (anchor === 'left' ? anchorOffset : 'auto') : undefined,
    marginRight: isLandscapeOrTablet ? (anchor === 'right' ? anchorOffset : 'auto') : undefined,
    marginBottom: detached ? detachedOffset : undefined,
    marginInline: detached ? anchorOffset : undefined,
    overflow: 'hidden',
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  };

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={handleOpenChange}
      snapPoints={snapPoints}
      activeSnapPoint={activeSnapPoint}
      setActiveSnapPoint={handleSnapPointChange}
      dismissible={dismissible}
      modal={!isNonModal}
      direction="bottom"
      handleOnly={!draggable}
      onDrag={handleDrag}
      onRelease={handleRelease}
      onAnimationEnd={handleAnimationEnd}
    >
      <Drawer.Portal>
        {shouldShowOverlay && <Drawer.Overlay style={overlayStyle} />}
        <Drawer.Content style={contentStyle}>
          {grabber && (
            <Drawer.Handle>
              <div style={grabberStyle} />
            </Drawer.Handle>
          )}
          {header && <div style={headerStyle as React.CSSProperties}>{renderSlot(header)}</div>}
          <div style={style as React.CSSProperties}>{children}</div>
          {footer && (
            <div style={{ position: 'sticky', bottom: 0, ...(footerStyle as React.CSSProperties) }}>
              {renderSlot(footer)}
            </div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
});

export const VaulRenderer: WebRenderer = {
  Sheet: VaulSheet,
};
