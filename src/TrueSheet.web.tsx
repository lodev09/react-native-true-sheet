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
  DidBlurEvent,
  DidDismissEvent,
  DidFocusEvent,
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
  WillBlurEvent,
  WillDismissEvent,
  WillFocusEvent,
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
  DEFAULT_FORM_SHEET_HEIGHT_RATIO,
  DEFAULT_FORM_SHEET_WIDTH,
  DEFAULT_MAX_WIDTH,
} from './web/constants';

const TrueSheetComponent = forwardRef<TrueSheetMethods, TrueSheetProps>((props, ref) => {
  const {
    children,
    name,
    dismissible = true,
    draggable = true,
    cornerRadius,
    style,
    backgroundColor: backgroundColorProp,
    maxContentHeight,
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
    scrollableOptions,
    pageSizing = true,
    detached = false,
    detachedOffset = DEFAULT_DETACHED_OFFSET,
    elevation = 4,
    insetAdjustment = 'automatic',
    initialDetentAnimated = true,
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
    onWillFocus,
    onDidFocus,
    onWillBlur,
    onDidBlur,
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

  // pageSizing=false implies a floating/detached sheet on web — mirrors iOS
  // form-sheet semantics where the sheet is never edge-attached.
  const effectiveDetached = !pageSizing || detached;

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
  const onPositionChangeRef = useRef(onPositionChange);
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
    onPositionChangeRef.current = onPositionChange;
    activeSnapPointRef.current = activeSnapPoint;
  });

  const computeDetentInfo = useCallback((): DetentInfoEventPayload => {
    const snap = activeSnapPointRef.current;
    const index = snap != null ? validDetentsRef.current.indexOf(snap) : -1;
    const position = drawerContentRef.current?.getBoundingClientRect().top ?? 0;
    const detent = typeof snap === 'number' ? snap : 0;
    return { index, position, detent };
  }, []);

  // Mirror Android: interpolate fractional index and detent from the drawer's
  // top-Y so continuous position updates (drag, animation) carry smooth values
  // between detent boundaries. Numeric detent d → top-Y = (1 - d) * effectiveH.
  // 'auto' resolves to the [data-vaul-auto-size-wrapper] element's measured
  // offsetHeight — same signal vaul uses to compute its snap offset.
  const interpolateFromPosition = useCallback(
    (position: number): { index: number; detent: number } => {
      const snaps = validDetentsRef.current;
      const count = snaps.length;
      if (count === 0) return { index: -1, detent: 0 };

      const windowH = window.innerHeight;
      const effectiveH = effectiveDetached ? windowH - detachedOffset : windowH;
      // Matches vaul's height ceiling: min(effectiveH, maxContentHeight).
      const ceiling =
        maxContentHeight !== undefined ? Math.min(effectiveH, maxContentHeight) : effectiveH;

      const autoWrapper = drawerContentRef.current?.querySelector<HTMLElement>(
        '[data-vaul-auto-size-wrapper]'
      );
      const autoHeight = Math.min(autoWrapper?.offsetHeight ?? ceiling / 2, ceiling);

      const positions: number[] = [];
      const values: number[] = [];
      for (let i = 0; i < count; i++) {
        const d = snaps[i];
        if (typeof d === 'number') {
          const h = Math.min(d * effectiveH, ceiling);
          positions.push(effectiveH - h);
          values.push(effectiveH > 0 ? h / effectiveH : 0);
        } else {
          positions.push(effectiveH - autoHeight);
          values.push(effectiveH > 0 ? autoHeight / effectiveH : 0);
        }
      }

      // Absorb subpixel drift from getBoundingClientRect so at-rest positions
      // don't sneak into the below-first branch and emit near-zero negatives
      // like `-1e-8` (which render as "-1" via JS scientific-notation toString).
      const epsilon = 0.5;
      const firstPos = positions[0]!;
      const lastPos = positions[count - 1]!;

      if (position > firstPos + epsilon) {
        // Two ranges: index spans the full animation (windowH of wrapper
        // travel) so it's smooth for driving dependent animations end-to-end;
        // detent tracks the sheet's visible-height ratio (windowH - firstPos)
        // so its 0–values[0] fade has fine resolution while the sheet is still
        // in view. Both clamp to keep outputs in [-1, 0].
        const indexRaw = (position - firstPos) / windowH;
        const detentRaw = (position - firstPos) / Math.max(1, windowH - firstPos);
        const indexProgress = Math.max(0, Math.min(1, indexRaw));
        const detentProgress = Math.max(0, Math.min(1, detentRaw));
        return {
          index: -indexProgress,
          detent: Math.max(0, values[0]! * (1 - detentProgress)),
        };
      }

      if (count === 1) return { index: 0, detent: values[0]! };

      // Clamp into the segment range so subpixel drift at the boundaries
      // resolves cleanly to the nearest segment edge (index 0 or count-1).
      const clamped = Math.max(lastPos, Math.min(firstPos, position));

      for (let i = 0; i < count - 1; i++) {
        const pos = positions[i]!;
        const nextPos = positions[i + 1]!;
        if (clamped >= nextPos && clamped <= pos) {
          const range = pos - nextPos;
          const progress = range > 0 ? (pos - clamped) / range : 0;
          const clampedProgress = Math.max(0, Math.min(1, progress));
          return {
            index: i + clampedProgress,
            detent: values[i]! + clampedProgress * (values[i + 1]! - values[i]!),
          };
        }
      }

      return { index: count - 1, detent: values[count - 1]! };
    },
    [effectiveDetached, detachedOffset, maxContentHeight]
  );

  const handlePositionChange = useCallback(
    (position: number) => {
      const { index, detent } = interpolateFromPosition(position);
      onPositionChangeRef.current?.({
        nativeEvent: { index, position, detent, realtime: true },
      } as PositionChangeEvent);
    },
    [interpolateFromPosition]
  );

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

  // Focus/blur events fire when a descendant sheet appears on top of this one
  // (blur) or when all descendants are dismissed (focus). will-events fire
  // synchronously at the transition boundary; did-events fire once the cascade
  // transform drains. Intermediate count changes (1↔2) don't re-fire — this
  // sheet stays blurred throughout.
  const onWillBlurRef = useRef(onWillBlur);
  const onDidBlurRef = useRef(onDidBlur);
  const onWillFocusRef = useRef(onWillFocus);
  const onDidFocusRef = useRef(onDidFocus);
  useEffect(() => {
    onWillBlurRef.current = onWillBlur;
    onDidBlurRef.current = onDidBlur;
    onWillFocusRef.current = onWillFocus;
    onDidFocusRef.current = onDidFocus;
  });

  const prevDescendantCountRef = useRef(0);
  useEffect(() => {
    const prevCount = prevDescendantCountRef.current;
    const count = descendants.length;
    prevDescendantCountRef.current = count;
    if (!isOpen) return;
    const gained = count > 0 && prevCount === 0;
    const lost = count === 0 && prevCount > 0;
    if (!gained && !lost) return;

    if (gained) {
      onWillBlurRef.current?.({ nativeEvent: null } as WillBlurEvent);
    } else {
      onWillFocusRef.current?.({ nativeEvent: null } as WillFocusEvent);
    }

    const drawer = drawerContentRef.current;
    if (!drawer) return;

    let canceled = false;
    const fireDone = () => {
      if (canceled) return;
      if (gained) onDidBlurRef.current?.({ nativeEvent: null } as DidBlurEvent);
      else onDidFocusRef.current?.({ nativeEvent: null } as DidFocusEvent);
    };
    const rafId = window.requestAnimationFrame(() => {
      if (canceled) return;
      // Force style recalc so the cascade effect's queued transform registers.

      drawer.offsetHeight;
      const pending = drawer.getAnimations().filter((a) => a.playState !== 'finished');
      if (pending.length === 0) {
        fireDone();
        return;
      }
      Promise.allSettled(pending.map((a) => a.finished)).then(() => {
        if (!canceled) fireDone();
      });
    });

    return () => {
      canceled = true;
      window.cancelAnimationFrame(rafId);
    };
  }, [isOpen, descendants.length]);

  const effectiveCornerRadius = cornerRadius ?? DEFAULT_CORNER_RADIUS;

  // Shadow cast upward from the sheet's top edge toward the background. Matches
  // Android's `elevation` semantics roughly — the sheet "lifts" off whatever is
  // behind it. Scales linearly so higher elevation reads as more separation.
  // Applied to the vaul wrapper (not the drawer) as `filter: drop-shadow`: the
  // wrapper clips the drawer (overflow: hidden + contain: paint), which would
  // cut off `box-shadow` on the drawer at the wrapper edges — visible in
  // detached mode (bottom blur clipped in the floating gap) and when the
  // wrapper is narrowed by maxWidth/anchor margins (lateral blur clipped at
  // wrapper edges). drop-shadow on the wrapper follows the post-clip silhouette
  // and isn't clipped by the wrapper itself.
  const dropShadow =
    elevation > 0
      ? `drop-shadow(0 ${-elevation}px ${elevation * 3}px rgba(0, 0, 0, 0.15))`
      : undefined;

  const mergedContentStyle = useMemo<React.CSSProperties>(
    () => ({
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      borderTopLeftRadius: effectiveCornerRadius,
      borderTopRightRadius: effectiveCornerRadius,
      backgroundColor: backgroundColor as string,
      // Lift content above iOS home indicator / bottom safe area when enabled.
      paddingBottom: insetAdjustment === 'automatic' ? 'env(safe-area-inset-bottom, 0px)' : 0,
    }),
    [backgroundColor, effectiveCornerRadius, insetAdjustment]
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

  // Form-sheet style (iOS pageSizing=false): centered floating card with a
  // default width and a height capped to a fraction of the window. We reuse
  // the existing detached mechanic so drag/snap math stays correct — the
  // wrapper is bottom-attached with a computed offset that centers it
  // vertically.
  const isFormSheet = isLandscapeOrTablet && maxContentWidth == null && !pageSizing;

  const effectiveMaxContentHeight =
    maxContentHeight ?? (isFormSheet ? windowHeight * DEFAULT_FORM_SHEET_HEIGHT_RATIO : undefined);

  const effectiveDetachedOffset = isFormSheet
    ? Math.max(0, (windowHeight - (effectiveMaxContentHeight ?? 0)) / 2)
    : detachedOffset;

  // The wrapper holds all horizontal sizing/anchoring so its rounded-bottom
  // clip (when detached) aligns with the drawer's horizontal bounds on
  // desktop — otherwise its corners sit at the far viewport edges.
  // Mirrors iOS setupSheetSizing: maxContentWidth wins (forces pageSizing
  // off). pageSizing on → constrain to readable width (page-sheet);
  // pageSizing off with no maxContentWidth → form-sheet width.
  // Detached without a width constraint applies anchorOffset on both edges so
  // the floating card breathes from the viewport sides.
  const wrapperStyle = useMemo<React.CSSProperties | undefined>(() => {
    const maxWidth = isLandscapeOrTablet
      ? isFormSheet
        ? DEFAULT_FORM_SHEET_WIDTH
        : (maxContentWidth ?? (pageSizing ? DEFAULT_MAX_WIDTH : undefined))
      : undefined;

    const needsMargins = maxWidth != null || effectiveDetached;
    if (!needsMargins && !dropShadow) return undefined;

    const next: React.CSSProperties = {};
    if (dropShadow) next.filter = dropShadow;
    if (!needsMargins) return next;

    let marginLeft: number | string;
    let marginRight: number | string;
    if (isFormSheet) {
      marginLeft = 'auto';
      marginRight = 'auto';
    } else if (maxWidth == null) {
      marginLeft = anchorOffset;
      marginRight = anchorOffset;
    } else {
      marginLeft = anchor === 'left' ? anchorOffset : 'auto';
      marginRight = anchor === 'right' ? anchorOffset : 'auto';
    }

    if (maxWidth != null) next.maxWidth = maxWidth;
    next.marginLeft = marginLeft;
    next.marginRight = marginRight;
    return next;
  }, [
    isLandscapeOrTablet,
    isFormSheet,
    maxContentWidth,
    pageSizing,
    anchor,
    anchorOffset,
    effectiveDetached,
    dropShadow,
  ]);

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
      draggable={draggable}
      handleOnly={scrollable && scrollableOptions?.scrollingExpandsSheet === false}
      repositionInputs={false}
      modal={dimmed}
      nested={isNested}
      detached={effectiveDetached}
      detachedOffset={effectiveDetachedOffset}
      detachedRadius={effectiveCornerRadius}
      maxContentHeight={effectiveMaxContentHeight}
      initialAnimated={initialDetentAnimated}
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
