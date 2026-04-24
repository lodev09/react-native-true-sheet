/// <reference lib="dom" />
import {
  createElement,
  forwardRef,
  isValidElement,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { View, useColorScheme, useWindowDimensions } from 'react-native';

import { Drawer } from './web/vaul';
import { TRANSITIONS } from './web/vaul/constants';
import type {
  DetentChangeEvent,
  DetentInfoEventPayload,
  DidDismissEvent,
  DidPresentEvent,
  DragBeginEvent,
  DragChangeEvent,
  DragEndEvent,
  MountEvent,
  PositionChangeEvent,
  SheetDetent,
  TrueSheetMethods,
  TrueSheetProps,
  TrueSheetStaticMethods,
  WillDismissEvent,
  WillPresentEvent,
} from './TrueSheet.types';
import { usePortalContainer, useRegisterSheet, useSheetStack } from './TrueSheetProvider.web';
import {
  COLOR_SURFACE_CONTAINER_LOW_DARK,
  COLOR_SURFACE_CONTAINER_LOW_LIGHT,
  DEFAULT_ANCHOR_OFFSET,
  DEFAULT_CORNER_RADIUS,
  DEFAULT_DETACHED_OFFSET,
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
    initialDetentIndex = -1,
    header,
    headerStyle,
    footer,
    footerStyle,
    scrollable = false,
    detached = false,
    detachedOffset = DEFAULT_DETACHED_OFFSET,
    onPositionChange,
    onWillPresent,
    onDidPresent,
    onWillDismiss,
    onDidDismiss,
    onDetentChange,
    onDragBegin,
    onDragChange,
    onDragEnd,
    onMount,
  } = props;

  const validDetents = useMemo(
    () => detents.filter((d): d is SheetDetent => typeof d === 'number' || d === 'auto'),
    [detents]
  );

  const snapPointsProps = useMemo<
    { snapPoints: SheetDetent[]; fadeFromIndex: number } | { snapPoints?: undefined }
  >(() => {
    if (validDetents.length === 0) return {};
    return {
      snapPoints: validDetents,
      fadeFromIndex: Math.min(dimmedDetentIndex, validDetents.length - 1),
    };
  }, [validDetents, dimmedDetentIndex]);

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isLandscapeOrTablet = windowWidth >= 600 || windowWidth > windowHeight;

  const colorScheme = useColorScheme();
  const backgroundColor =
    backgroundColorProp ??
    (colorScheme === 'dark' ? COLOR_SURFACE_CONTAINER_LOW_DARK : COLOR_SURFACE_CONTAINER_LOW_LIGHT);

  const shouldAutoPresent = initialDetentIndex >= 0 && initialDetentIndex < validDetents.length;
  const [isOpen, setIsOpen] = useState(shouldAutoPresent);
  const [activeSnapPoint, setActiveSnapPoint] = useState<SheetDetent | null>(
    () => validDetents[shouldAutoPresent ? initialDetentIndex : 0] ?? null
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
      snapPoint == null
        ? null
        : typeof snapPoint === 'number' || snapPoint === 'auto'
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

  const portalContainer = usePortalContainer();

  const handlePointerDownOutside = (e: Event) => {
    const target = e.target;
    if (!(target instanceof Node)) return;
    // Pointer down that landed outside this sheet's portal container (e.g.,
    // in another screen's tree when navigating) should not close the drawer.
    if (portalContainer && !portalContainer.contains(target)) {
      e.preventDefault();
    }
  };

  const dismissAboveRef = useRef<(animated?: boolean) => Promise<void>>(async () => {});

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
      dismissStack: async (animated) => {
        await dismissAboveRef.current(animated);
      },
    }),
    []
  );

  useImperativeHandle(ref, () => methods, [methods]);

  const methodsRef = useRef<TrueSheetMethods | null>(methods);
  useRegisterSheet(name, methodsRef);

  const drawerContentRef = useRef<HTMLDivElement | null>(null);

  // Present/dismiss events. The sheet settles via a CSS `transform` transition
  // on either the drawer (snap-points on autopresent) or the wrapper (whole-
  // card slide on reopen/dismiss). `Animation.finished` from the Web Animations
  // API tracks whichever is actually running — reflects what the browser is
  // doing, doesn't miss when no transition runs (same-value change), and
  // handles interruptions correctly (a drag/resnap mid-present resolves only
  // once all transform animations drain).
  const onWillPresentRef = useRef(onWillPresent);
  const onDidPresentRef = useRef(onDidPresent);
  const onWillDismissRef = useRef(onWillDismiss);
  const onDidDismissRef = useRef(onDidDismiss);
  const onDetentChangeRef = useRef(onDetentChange);
  const onDragBeginRef = useRef(onDragBegin);
  const onDragChangeRef = useRef(onDragChange);
  const onDragEndRef = useRef(onDragEnd);
  const activeSnapPointRef = useRef(activeSnapPoint);
  useEffect(() => {
    onWillPresentRef.current = onWillPresent;
    onDidPresentRef.current = onDidPresent;
    onWillDismissRef.current = onWillDismiss;
    onDidDismissRef.current = onDidDismiss;
    onDetentChangeRef.current = onDetentChange;
    onDragBeginRef.current = onDragBegin;
    onDragChangeRef.current = onDragChange;
    onDragEndRef.current = onDragEnd;
    activeSnapPointRef.current = activeSnapPoint;
  });

  const computeDetentInfo = useCallback((): DetentInfoEventPayload => {
    const snap = activeSnapPointRef.current;
    const index = snap != null ? validDetentsRef.current.indexOf(snap) : -1;
    const position = drawerContentRef.current?.getBoundingClientRect().top ?? 0;
    const detent = typeof snap === 'number' ? snap : 0;
    return { index, position, detent };
  }, []);

  // Fire onMount once after first render. React-mount is the earliest point
  // the component is ready for imperative calls, matching the native
  // "ready for present" contract. Declared before the present/dismiss effect
  // so it fires first during autopresent (onMount → onWillPresent).
  const onMountRef = useRef(onMount);
  useEffect(() => {
    onMountRef.current = onMount;
  });
  useEffect(() => {
    onMountRef.current?.({ nativeEvent: null } as MountEvent);
  }, []);

  // Start at `false` so a mount with `isOpen=true` (autopresent via
  // `initialDetentIndex`) is detected as a false→true transition and fires
  // `onWillPresent`.
  const wasOpenRef = useRef(false);
  useEffect(() => {
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = isOpen;

    if (!isOpen && !wasOpen) return undefined;

    const present = !wasOpen && isOpen;
    if (present) {
      onWillPresentRef.current?.({ nativeEvent: computeDetentInfo() } as WillPresentEvent);
    } else if (wasOpen && !isOpen) {
      onWillDismissRef.current?.({ nativeEvent: null } as WillDismissEvent);
    } else {
      return undefined;
    }

    const fireDone = () => {
      if (present) {
        onDidPresentRef.current?.({ nativeEvent: computeDetentInfo() } as DidPresentEvent);
      } else {
        onDidDismissRef.current?.({ nativeEvent: null } as DidDismissEvent);
      }
    };

    let canceled = false;
    let rafId = 0;

    const start = () => {
      if (canceled) return;
      const drawer = drawerContentRef.current;
      if (!drawer) {
        // Drawer hasn't mounted yet (Radix Presence defers the portal mount
        // past the first effect pass). Poll until the ref is populated.
        rafId = window.requestAnimationFrame(start);
        return;
      }
      const wrapper = drawer.closest<HTMLElement>('[data-vaul-detached-wrapper]') ?? null;
      const targets = wrapper ? [drawer, wrapper] : [drawer];

      const waitForSettle = (): void => {
        if (canceled) return;
        // Force style recalc so transitions queued by vaul's effects this
        // commit are registered in `getAnimations()`. RAF callbacks run BEFORE
        // the frame's style recalc, and ignoring this returns a stale empty
        // list — we'd fire `did` immediately with nothing queued.

        drawer.offsetHeight;
        const pending = targets.flatMap((el) =>
          el.getAnimations().filter((a) => a.playState !== 'finished')
        );
        if (pending.length === 0) {
          fireDone();
          return;
        }
        // allSettled: resolve even when a transition is canceled (drag /
        // resnap), then re-check — a replacement transition may have started.
        Promise.allSettled(pending.map((a) => a.finished)).then(() => {
          if (!canceled) waitForSettle();
        });
      };

      waitForSettle();
    };

    rafId = window.requestAnimationFrame(start);

    return () => {
      canceled = true;
      window.cancelAnimationFrame(rafId);
    };
  }, [isOpen, computeDetentInfo]);

  // Fire onDetentChange only while open→open. Present/dismiss have their own
  // events and carry detent info via onDidPresent, so we skip those edges.
  const detentChangeStateRef = useRef({ isOpen, activeSnapPoint });
  useEffect(() => {
    const prev = detentChangeStateRef.current;
    detentChangeStateRef.current = { isOpen, activeSnapPoint };
    if (!prev.isOpen || !isOpen) return;
    if (prev.activeSnapPoint === activeSnapPoint) return;
    onDetentChangeRef.current?.({ nativeEvent: computeDetentInfo() } as DetentChangeEvent);
  }, [isOpen, activeSnapPoint, computeDetentInfo]);

  // Vaul's `onDrag` fires once per pointermove while dragging; the first tick
  // after an idle gap marks the drag boundary, so track it via a ref.
  const isDraggingRef = useRef(false);
  const handleDrag = useCallback(() => {
    if (!isDraggingRef.current) {
      isDraggingRef.current = true;
      onDragBeginRef.current?.({ nativeEvent: computeDetentInfo() } as DragBeginEvent);
    }
    onDragChangeRef.current?.({ nativeEvent: computeDetentInfo() } as DragChangeEvent);
  }, [computeDetentInfo]);
  const handleRelease = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    onDragEndRef.current?.({ nativeEvent: computeDetentInfo() } as DragEndEvent);
  }, [computeDetentInfo]);

  const { isNested, dismissAbove, descendants } = useSheetStack(
    methodsRef,
    drawerContentRef,
    isOpen
  );
  dismissAboveRef.current = dismissAbove;

  // Mirror Android: translate this sheet down to match the deepest descendant's
  // top so the whole stack visually aligns. Cascades because every ancestor
  // re-runs whenever the stack (and thus its descendants) changes.
  useEffect(() => {
    const parent = drawerContentRef.current;
    if (!parent) return;

    const transition = `transform ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`;

    if (descendants.length === 0) {
      parent.style.transition = transition;
      parent.style.transform = '';
      return;
    }

    const computeTargetY = () => {
      const parentSnap = parseFloat(parent.style.getPropertyValue('--snap-point-height')) || 0;
      let targetY = parentSnap;
      for (const d of descendants) {
        const node = d.nodeRef.current;
        if (!node) continue;
        const snap = parseFloat(node.style.getPropertyValue('--snap-point-height')) || 0;
        if (snap > targetY) targetY = snap;
      }
      return targetY;
    };

    const apply = () => {
      const targetY = computeTargetY();
      const match = parent.style.transform.match(/translate3d\([^,]*,\s*(-?\d*\.?\d+)px/);
      const currentY = match ? parseFloat(match[1]!) : 0;
      if (Math.abs(currentY - targetY) < 0.5) return;
      parent.style.transition = transition;
      parent.style.transform = `translate3d(0, ${targetY}px, 0)`;
    };

    const raf = requestAnimationFrame(apply);
    // Vaul re-runs snapToPoint on window resize (e.g., mobile keyboard open)
    // which clobbers the cascade transform. Re-apply whenever the parent's
    // inline style changes.
    const observer = new MutationObserver(apply);
    observer.observe(parent, { attributes: true, attributeFilter: ['style'] });

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [descendants, activeSnapPoint]);

  const mergedContentStyle = useMemo<React.CSSProperties>(
    () => ({
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      borderTopLeftRadius: DEFAULT_CORNER_RADIUS,
      borderTopRightRadius: DEFAULT_CORNER_RADIUS,
      backgroundColor: backgroundColor as string,
    }),
    [backgroundColor, detached]
  );

  const defaultGrabberColor =
    colorScheme === 'dark' ? DEFAULT_GRABBER_COLOR_DARK : DEFAULT_GRABBER_COLOR_LIGHT;

  const grabberHeight = grabberOptions?.height ?? DEFAULT_GRABBER_HEIGHT;

  // Footer is rendered inside the wrapper via `detachedSiblings`, so it
  // follows the wrapper on dismiss and drag-overshoot. Positioning is
  // relative to the wrapper (contain: paint creates the containing block).
  const footerFloatStyle = useMemo<React.CSSProperties>(
    () => ({
      position: 'fixed',
      left: 0,
      right: 0,
      bottom: 0,
      // Wrapper has `pointer-events: none` to let clicks fall through; the
      // footer must opt back in.
      pointerEvents: 'auto',
    }),
    []
  );

  // The wrapper holds all horizontal sizing/anchoring so its rounded-bottom
  // clip (when detached) aligns with the drawer's horizontal bounds on
  // desktop — otherwise its corners sit at the far viewport edges.
  const wrapperStyle = useMemo<React.CSSProperties | undefined>(
    () =>
      isLandscapeOrTablet
        ? {
            maxWidth: maxContentWidth ?? DEFAULT_MAX_WIDTH,
            marginLeft: anchor === 'left' ? anchorOffset : 'auto',
            marginRight: anchor === 'right' ? anchorOffset : 'auto',
          }
        : undefined,
    [isLandscapeOrTablet, maxContentWidth, anchor, anchorOffset]
  );

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
      onDrag={handleDrag}
      onRelease={handleRelease}
      dismissible={dismissible}
      repositionInputs={false}
      modal={dimmed}
      nested={isNested}
      detached={detached}
      detachedOffset={detachedOffset}
      detachedRadius={DEFAULT_CORNER_RADIUS}
      detachedWrapperStyle={wrapperStyle}
      activeSnapPoint={activeSnapPoint}
      setActiveSnapPoint={handleSetActiveSnapPoint}
      {...snapPointsProps}
    >
      <Drawer.Portal container={portalContainer ?? undefined}>
        <Drawer.Overlay style={overlayStyle} />
        <Drawer.Content
          ref={drawerContentRef}
          style={mergedContentStyle}
          onPointerDownOutside={handlePointerDownOutside}
          detachedSiblings={
            footer ? (
              <div style={footerFloatStyle}>
                <View style={footerStyle}>
                  {isValidElement(footer) ? footer : createElement(footer)}
                </View>
              </div>
            ) : undefined
          }
        >
          <Drawer.Title style={visuallyHiddenStyle}>Sheet</Drawer.Title>
          {grabber && <Drawer.Handle style={handleStyle} />}
          {header && (
            <View style={headerStyle}>
              {isValidElement(header) ? header : createElement(header)}
            </View>
          )}
          {scrollable ? (
            <div style={scrollableContainerStyle}>
              <View style={style}>{children}</View>
            </div>
          ) : (
            <View style={style}>{children}</View>
          )}
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

const scrollableContainerStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  touchAction: 'pan-y',
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
