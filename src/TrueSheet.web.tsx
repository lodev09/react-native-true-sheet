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
import type { LayoutChangeEvent, ViewStyle } from 'react-native';
import { StyleSheet, useColorScheme, useWindowDimensions, View } from 'react-native';

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
import { measurePeekContentHeight, TrueSheetPeekContext } from './TrueSheetPeek.web';
import { usePortalContainer, useRegisterSheet, useSheetStack } from './TrueSheetProvider.web';
import {
  COLOR_SURFACE_CONTAINER_LOW_DARK,
  COLOR_SURFACE_CONTAINER_LOW_LIGHT,
  DEFAULT_ANCHOR_OFFSET,
  DEFAULT_CORNER_RADIUS,
  DEFAULT_DETACHED_OFFSET,
  DEFAULT_FORM_SHEET_HEIGHT_RATIO,
  DEFAULT_FORM_SHEET_WIDTH,
  DEFAULT_GRABBER_COLOR_DARK,
  DEFAULT_GRABBER_COLOR_LIGHT,
  DEFAULT_GRABBER_HEIGHT,
  DEFAULT_GRABBER_TOP_MARGIN,
  DEFAULT_GRABBER_WIDTH,
  DEFAULT_MAX_WIDTH,
} from './web/constants';
import { Drawer } from './web/vaul';
import { DEFAULT_PEEK_HEIGHT, TRANSITIONS } from './web/vaul/constants';

// First vertically scrollable descendant — web mirror of native's
// findScrollView (RN-web ScrollView/FlatList render a node with
// `overflow-y: auto`; its first child is the content container).
const findVerticalScroller = (root: HTMLElement): HTMLElement | null => {
  for (const el of root.querySelectorAll<HTMLElement>('*')) {
    const { overflowY } = window.getComputedStyle(el);
    if (overflowY === 'auto' || overflowY === 'scroll') return el;
  }
  return null;
};

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
    headerOptions,
    footer,
    footerStyle,
    footerOptions,
    presentation = 'page',
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
    () =>
      detents.filter(
        (d): d is SheetDetent => typeof d === 'number' || d === 'auto' || d === 'peek'
      ),
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
  const isFormSheet = isLandscapeOrTablet && presentation === 'form';

  // A form sheet floats (detached) only on tablet/landscape — mirrors iOS where
  // a form sheet is a centered card on iPad but an edge-attached bottom sheet on
  // a compact iPhone. On mobile portrait it stays edge-attached unless `detached`
  // is explicitly set.
  const effectiveDetached = isFormSheet || detached;

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

  const hasAutoDetent = validDetents.includes('auto');

  const handleSetActiveSnapPoint = useCallback((snapPoint: number | string | null) => {
    setActiveSnapPoint(
      snapPoint == null
        ? null
        : typeof snapPoint === 'number' || snapPoint === 'auto' || snapPoint === 'peek'
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
      return;
    }
    // The footer is rendered via vaul's `detachedSiblings` as a sibling of
    // Drawer.Content inside [data-vaul-detached-wrapper], so Radix treats
    // clicks on it as "outside" the content. Don't dismiss for clicks that
    // landed inside the wrapper.
    if (target instanceof Element) {
      const wrapper = drawerContentRef.current?.closest('[data-vaul-detached-wrapper]');
      if (wrapper && wrapper.contains(target)) {
        e.preventDefault();
      }
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

  // Measured header/footer heights drive the 'peek' snap point — mirrors
  // native, where the controller tracks headerHeight/footerHeight.
  const [headerHeight, setHeaderHeight] = useState(0);
  const [footerHeight, setFooterHeight] = useState(0);

  const handleHeaderLayout = useCallback((e: LayoutChangeEvent) => {
    setHeaderHeight(e.nativeEvent.layout.height);
  }, []);

  const handleFooterLayout = useCallback((e: LayoutChangeEvent) => {
    setFooterHeight(e.nativeEvent.layout.height);
  }, []);

  // DOM refs for live 'peek' measurement in computeDetentGeometry — the
  // state above (which drives vaul's `peekHeight` prop) comes from RN-web
  // `onLayout`, which dispatches a frame after mount: too late for the first
  // willPresent.
  const headerElRef = useRef<View>(null);
  const footerElRef = useRef<View>(null);

  // Distance from the content top to the bottom of a `TrueSheetPeek` rendered
  // within the content — measured by the peek against `contentRef`.
  const [peekContentHeight, setPeekContentHeight] = useState(0);
  const contentRef = useRef<View>(null);
  const peekElRef = useRef<View>(null);
  const peekContext = useMemo(() => ({ contentRef, peekRef: peekElRef, setPeekContentHeight }), []);

  // An absolute (floating) header overlaps the content, so it contributes no
  // height to the 'auto' detent measurement.
  const absoluteHeader = headerOptions?.position === 'absolute';
  const absoluteHeaderRef = useRef(absoluteHeader);
  absoluteHeaderRef.current = absoluteHeader;

  const resolvedHeaderStyle = absoluteHeader ? [absoluteHeaderStyle, headerStyle] : headerStyle;

  // Same for an absolute (floating) footer — rendered via vaul's
  // `detachedSiblings` instead of in the content flow.
  const absoluteFooter = footerOptions?.position === 'absolute';
  const absoluteFooterRef = useRef(absoluteFooter);
  absoluteFooterRef.current = absoluteFooter;

  // A relative footer owns the sheet's bottom edge, so it absorbs the bottom
  // safe-area inset as padding (on top of its own) — mirrors native, where the
  // footer shadow node pads the inset so its background fills it.
  const footerOwnsInset = Boolean(footer) && !absoluteFooter && insetAdjustment === 'automatic';
  const resolvedFooterStyle = useMemo(() => {
    if (!footerOwnsInset) return footerStyle;

    const flat = StyleSheet.flatten(footerStyle);
    const base = flat?.paddingBottom ?? flat?.paddingVertical ?? flat?.padding;
    const baseCss =
      typeof base === 'number' ? `${base}px` : typeof base === 'string' ? base : '0px';
    return [
      footerStyle,
      {
        paddingBottom: `calc(${baseCss} + env(safe-area-inset-bottom, 0px))`,
      } as unknown as ViewStyle,
    ];
  }, [footerOwnsInset, footerStyle]);

  // A relative footer is laid out below the content, so it's pushed off-screen
  // at the peek detent and contributes no height.
  const peekHeight =
    (header ? headerHeight : 0) +
      (footer && absoluteFooter ? footerHeight : 0) +
      peekContentHeight || DEFAULT_PEEK_HEIGHT;

  // Web mirror of native's scrollable handling for 'auto' detents: a plugged
  // scrollable keeps the sized (bounded) layout so its viewport is capped to
  // the visible sheet and can scroll, while the 'auto' height is measured with
  // the viewport replaced by the scrollable's content size — mirrors native
  // `naturalHeight`.
  const [hasBoundedScrollable, setHasBoundedScrollable] = useState(false);
  const [scrollableAutoHeight, setScrollableAutoHeight] = useState(0);
  const pinnedScrollerRef = useRef<HTMLElement | null>(null);

  // Natural content height (header + content + footer, with a pinned
  // scrollable's viewport replaced by its content size) — the height the
  // content wants regardless of the sheet's bounds.
  const measureNaturalHeight = useCallback(() => {
    const contentEl = contentRef.current as unknown as HTMLElement | null;
    if (!contentEl || !contentEl.isConnected) return 0;
    const headerEl = absoluteHeaderRef.current
      ? null
      : (headerElRef.current as unknown as HTMLElement | null);
    const footerEl = absoluteFooterRef.current
      ? null
      : (footerElRef.current as unknown as HTMLElement | null);
    let height =
      (headerEl?.offsetHeight ?? 0) + (footerEl?.offsetHeight ?? 0) + contentEl.offsetHeight;
    const scroller = pinnedScrollerRef.current;
    const scrollContent = scroller?.firstElementChild;
    if (scroller?.isConnected && scrollContent instanceof HTMLElement) {
      height += scrollContent.offsetHeight - scroller.clientHeight;
    }
    return Math.max(0, height);
  }, []);

  useEffect(() => {
    if (!isOpen || !hasAutoDetent) return undefined;

    let canceled = false;
    let rafId = 0;
    let mutationObserver: MutationObserver | null = null;
    let resizeObserver: ResizeObserver | null = null;

    const attach = () => {
      if (canceled) return;
      const drawerEl = drawerContentRef.current;
      if (!drawerEl || !drawerEl.isConnected) {
        // Radix Presence defers the portal mount; poll until the drawer is live.
        rafId = window.requestAnimationFrame(attach);
        return;
      }

      const measure = () => setScrollableAutoHeight(measureNaturalHeight());

      // (Re)pin the first vertical scrollable and observe the nodes whose size
      // feeds the natural height — content growth inside a bounded scroller is
      // invisible to the sheet's own layout (mirrors native's contentSize
      // observation). Resolves the content node live: the layout-branch swap
      // (natural flow ↔ sized) remounts it.
      const observe = () => {
        const contentEl = contentRef.current as unknown as HTMLElement | null;
        const scroller =
          contentEl && contentEl.isConnected ? findVerticalScroller(contentEl) : null;
        pinnedScrollerRef.current = scroller;
        setHasBoundedScrollable(scroller != null);

        resizeObserver?.disconnect();
        resizeObserver = new ResizeObserver(measure);
        if (contentEl?.isConnected) resizeObserver.observe(contentEl);
        const headerEl = headerElRef.current as unknown as HTMLElement | null;
        if (headerEl) resizeObserver.observe(headerEl);
        if (scroller) {
          resizeObserver.observe(scroller);
          if (scroller.firstElementChild) resizeObserver.observe(scroller.firstElementChild);
        }
        measure();
      };

      observe();
      // Watch the whole drawer subtree — catches the scrollable mounting/
      // unmounting AND the layout-branch swap, which remounts the content node
      // (a content-scoped observer would go stale after the swap).
      mutationObserver = new MutationObserver(observe);
      mutationObserver.observe(drawerEl, { childList: true, subtree: true });
    };

    rafId = window.requestAnimationFrame(attach);

    return () => {
      canceled = true;
      window.cancelAnimationFrame(rafId);
      mutationObserver?.disconnect();
      resizeObserver?.disconnect();
    };
  }, [isOpen, hasAutoDetent, measureNaturalHeight]);

  // Below the last detent a vertical touch pan moves the sheet, not the
  // content — `[data-vaul-scroll-locked]` disables vertical touch panning on
  // the scroll container and everything inside it (see vaul/style.css).
  const isScrollLocked =
    validDetents.length > 0 && activeSnapPoint !== validDetents[validDetents.length - 1];

  // Vaul measures the auto-size wrapper's offsetHeight (always, post fork).
  // Track it here so the form sheet can size its card to fit content,
  // clamped between a minimum ratio of the viewport and a maximum derived
  // from `detachedOffset` (the breathing room left at top + bottom of the
  // floating card).
  const [measuredContentHeight, setMeasuredContentHeight] = useState(0);

  const effectiveMaxContentHeight = useMemo<number | undefined>(() => {
    if (maxContentHeight !== undefined) return maxContentHeight;
    if (!isFormSheet) return undefined;
    const min = windowHeight * DEFAULT_FORM_SHEET_HEIGHT_RATIO;
    const max = Math.max(min, windowHeight - 2 * detachedOffset);
    if (measuredContentHeight <= 0) return min;
    return Math.max(min, Math.min(measuredContentHeight, max));
  }, [maxContentHeight, isFormSheet, windowHeight, detachedOffset, measuredContentHeight]);

  // Center the form sheet using the actual visible drawer height. Vaul
  // auto-sizes to content (capped by `maxContentHeight`), so when content is
  // shorter than `effectiveMaxContentHeight`'s min-clamped floor, using that
  // for the offset would push a small sheet below the viewport center.
  const effectiveDetachedOffset = useMemo(() => {
    if (!isFormSheet) return detachedOffset;
    const max = Math.max(0, windowHeight - 2 * detachedOffset);
    const visibleHeight =
      measuredContentHeight > 0
        ? Math.min(measuredContentHeight, max)
        : (effectiveMaxContentHeight ?? 0);
    return Math.max(0, (windowHeight - visibleHeight) / 2);
  }, [isFormSheet, windowHeight, detachedOffset, measuredContentHeight, effectiveMaxContentHeight]);

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

  // Detent geometry — target top-Y (`positions`) and height ratio (`values`)
  // per detent. Mirrors vaul's snap-offset math exactly (same effective
  // height, ceiling, and 'auto'/'peek' resolution) so computed targets match
  // where the drawer actually settles. Numeric detent d → top-Y =
  // (1 - d) * effectiveH. 'auto' and 'peek' are measured live from the DOM
  // (see below). Inputs live in a render-synced ref so the compute callbacks
  // stay referentially stable for the event effects.
  const geometryInputsRef = useRef({
    effectiveDetached,
    effectiveDetachedOffset,
    effectiveMaxContentHeight,
    peekHeight,
    peekContentHeight,
    measuredContentHeight,
  });
  geometryInputsRef.current = {
    effectiveDetached,
    effectiveDetachedOffset,
    effectiveMaxContentHeight,
    peekHeight,
    peekContentHeight,
    measuredContentHeight,
  };

  const computeDetentGeometry = useCallback(() => {
    const inputs = geometryInputsRef.current;
    const windowH = window.innerHeight;
    const effectiveH = inputs.effectiveDetached
      ? windowH - inputs.effectiveDetachedOffset
      : windowH;
    // Matches vaul's height ceiling: min(effectiveH, maxContentHeight).
    const ceiling =
      inputs.effectiveMaxContentHeight !== undefined
        ? Math.min(effectiveH, inputs.effectiveMaxContentHeight)
        : effectiveH;
    // 'auto' resolves to the content's natural height. Read it live — the
    // `measuredContentHeight` state lags mount by a frame (vaul's initial
    // ref-callback measure runs while the portal subtree is still detached,
    // so it reads 0 until the ResizeObserver fires). Falls back to the state
    // value, then to vaul's pre-measure fallback (effectiveHeight / 2).
    const measuredHeight = measureNaturalHeight() || inputs.measuredContentHeight;
    const autoHeight = Math.min(measuredHeight > 0 ? measuredHeight : effectiveH / 2, ceiling);

    // 'peek' is measured live from the DOM (offsetHeight is layout-based, so
    // in-flight transforms don't skew it): the state-driven `peekHeight` prop
    // comes from RN-web onLayout, which dispatches a frame after mount — too
    // late for the first willPresent on autopresent. Ref callbacks can't
    // measure either: they fire while the portal subtree is still detached.
    // Geometry only runs while the drawer is mounted, so the elements are
    // measurable here; fall back to the state value when they're absent.
    const headerEl = headerElRef.current as unknown as HTMLElement | null;
    // A relative footer is pushed off-screen at the peek detent — excluded
    const footerEl = absoluteFooterRef.current
      ? (footerElRef.current as unknown as HTMLElement | null)
      : null;
    const peekEl = peekElRef.current as unknown as HTMLElement | null;
    const contentEl = contentRef.current as unknown as HTMLElement | null;
    const livePeekContentHeight =
      peekEl && contentEl ? measurePeekContentHeight(peekEl, contentEl) : inputs.peekContentHeight;
    const livePeekHeight =
      headerEl || footerEl || peekEl
        ? (headerEl?.offsetHeight ?? 0) + (footerEl?.offsetHeight ?? 0) + livePeekContentHeight ||
          DEFAULT_PEEK_HEIGHT
        : inputs.peekHeight;

    const positions: number[] = [];
    const values: number[] = [];
    for (const d of validDetentsRef.current) {
      const h =
        typeof d === 'number'
          ? Math.min(d * effectiveH, ceiling)
          : d === 'peek'
            ? Math.min(livePeekHeight, ceiling)
            : autoHeight;
      positions.push(effectiveH - h);
      values.push(effectiveH > 0 ? h / effectiveH : 0);
    }
    return { windowH, effectiveH, ceiling, positions, values };
  }, [measureNaturalHeight]);

  // Detent info for lifecycle events. Position/detent come from the active
  // detent's target geometry — not the live DOM rect — so willPresent (drawer
  // not mounted yet), detentChange (animation just started), and didPresent
  // all emit the settled detent position, matching iOS/Android. Drag events
  // pass `live: true` to report the in-flight rect position instead, also
  // matching native.
  const computeDetentInfo = useCallback(
    (live = false): DetentInfoEventPayload => {
      const snap = activeSnapPointRef.current;
      const index = snap != null ? validDetentsRef.current.indexOf(snap) : -1;
      const { windowH, positions, values } = computeDetentGeometry();
      const target = index >= 0 ? positions[index] : undefined;
      const position = live
        ? (drawerContentRef.current?.getBoundingClientRect().top ?? target ?? windowH)
        : (target ?? windowH);
      return { index, position, detent: index >= 0 ? (values[index] ?? 0) : 0 };
    },
    [computeDetentGeometry]
  );

  // Mirror Android: interpolate fractional index and detent from the drawer's
  // top-Y so continuous position updates (drag, animation) carry smooth values
  // between detent boundaries.
  const interpolateFromPosition = useCallback(
    (position: number): { index: number; detent: number } => {
      const { windowH, positions, values } = computeDetentGeometry();
      const count = positions.length;
      if (count === 0) return { index: -1, detent: 0 };

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
    [computeDetentGeometry]
  );

  // Mirror native synchronous layout: while dragging (and through the post-
  // release settle) the sized layout tracks the sheet's visible height in
  // realtime, clamped to the smallest detent — dragging below it slides the
  // sheet out without resizing. Once settled, the inline height is cleared so
  // the CSS calc() owns sizing again (adapts to viewport resizes at rest).
  const sizedLayoutRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const isSettlingAfterDragRef = useRef(false);
  const updateSizedLayoutHeight = useCallback(
    (position: number) => {
      const node = sizedLayoutRef.current;
      if (!node) return;

      const { effectiveH, ceiling, positions } = computeDetentGeometry();
      if (positions.length === 0) return;

      if (isSettlingAfterDragRef.current) {
        const snap = activeSnapPointRef.current;
        const index = snap != null ? validDetentsRef.current.indexOf(snap) : -1;
        const target = index >= 0 ? positions[index]! : null;
        if (target != null && Math.abs(position - target) < 1) {
          isSettlingAfterDragRef.current = false;
          // Restore the calc — height is an inline style, so clearing it would
          // leave the div unsized (React won't re-apply it without a render)
          node.style.height = SIZED_LAYOUT_HEIGHT;
          return;
        }
      }

      // positions[0] is the smallest detent's top-Y — its height is the clamp floor.
      const minHeight = effectiveH - positions[0]!;
      const height = Math.min(Math.max(effectiveH - position, minHeight), ceiling);
      node.style.height = `${height}px`;
    },
    [computeDetentGeometry]
  );

  const handlePositionChange = useCallback(
    (position: number) => {
      if (isDraggingRef.current || isSettlingAfterDragRef.current) {
        updateSizedLayoutHeight(position);
      }
      const { index, detent } = interpolateFromPosition(position);
      onPositionChangeRef.current?.({
        nativeEvent: { index, position, detent, realtime: true },
      } as PositionChangeEvent);
    },
    [interpolateFromPosition, updateSizedLayoutHeight]
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

    if (isOpen === wasOpen) return undefined;

    const present = isOpen;
    if (!present) {
      // Pair willBlur with willDismiss on dismiss — mirrors native iOS
      // emitWillDismissEvents (blur fires before dismiss). willPresent is
      // deferred to `start()` below (needs the mounted drawer's geometry).
      onWillBlurRef.current?.({ nativeEvent: null } as WillBlurEvent);
      onWillDismissRef.current?.({ nativeEvent: null } as WillDismissEvent);
    }

    const fireDone = () => {
      if (present) {
        onDidPresentRef.current?.({ nativeEvent: computeDetentInfo() } as DidPresentEvent);
        onDidFocusRef.current?.({ nativeEvent: null } as DidFocusEvent);
      } else {
        onDidBlurRef.current?.({ nativeEvent: null } as DidBlurEvent);
        onDidDismissRef.current?.({ nativeEvent: null } as DidDismissEvent);
      }
    };

    let canceled = false;
    let rafId = 0;

    const start = () => {
      if (canceled) return;
      const drawer = drawerContentRef.current;
      if (!drawer || !drawer.isConnected) {
        // Drawer hasn't mounted yet (Radix Presence defers the portal mount
        // past the first effect pass), or its subtree isn't attached to the
        // document yet (autopresent commits the portal before the app tree
        // attaches, so nothing is measurable). Poll until it's live.
        rafId = window.requestAnimationFrame(start);
        return;
      }
      if (present) {
        // Emit will-events only once the drawer is mounted and attached —
        // detent geometry ('auto' height, 'peek', form-sheet sizing) is
        // measurable from the DOM here; a synchronous emission would use the
        // pre-measure fallbacks on first present. Pairing willFocus with
        // willPresent mirrors native iOS where viewWillAppear dispatches
        // both; the descendant-stack focus effect handles subsequent
        // transitions.
        onWillPresentRef.current?.({ nativeEvent: computeDetentInfo() } as WillPresentEvent);
        onWillFocusRef.current?.({ nativeEvent: null } as WillFocusEvent);
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
  const handleDrag = useCallback(() => {
    if (!isDraggingRef.current) {
      isDraggingRef.current = true;
      onDragBeginRef.current?.({ nativeEvent: computeDetentInfo(true) } as DragBeginEvent);
    }
    onDragChangeRef.current?.({ nativeEvent: computeDetentInfo(true) } as DragChangeEvent);
  }, [computeDetentInfo]);
  const handleRelease = useCallback(
    (_event: unknown, open: boolean) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      // Track the sized layout through the settle animation only when the sheet
      // stays open — a dismissal slides out at the min-clamped height.
      isSettlingAfterDragRef.current = open;
      onDragEndRef.current?.({ nativeEvent: computeDetentInfo(true) } as DragEndEvent);
    },
    [computeDetentInfo]
  );

  const { isNested, dismissAbove, descendants } = useSheetStack(
    methodsRef,
    drawerContentRef,
    isOpen,
    isFormSheet
  );
  dismissAboveRef.current = dismissAbove;

  // Mirror Android: translate this sheet down to match the deepest descendant's
  // top so the whole stack visually aligns. Cascades because every ancestor
  // re-runs whenever the stack (and thus its descendants) changes.
  useEffect(() => {
    const parent = drawerContentRef.current;
    if (!parent) return;
    // Skip while dismissing: this sheet's stack pop changes `descendants`,
    // which would re-fire the effect and write `wrapper.style.transition =
    // 'clip-path …'`, clobbering vaul's just-written `'transform …'` for the
    // dismiss animation. Vaul fully owns this sheet's transitions on the way
    // out — nothing to align with anymore.
    if (!isOpen) return;
    const parentWrapper = parent.closest<HTMLElement>('[data-vaul-detached-wrapper]');

    const transition = `transform ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`;
    const wrapperTransition = `clip-path ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`;
    const CLIP_NONE = 'inset(0px round 0px)';

    // Animate clip-path on the wrapper. Dedupes via DOM read so repeat ticks
    // (mutation observer) skip identical writes. Seeds CLIP_NONE before the
    // first inset() so the browser interpolates between two inset() shapes —
    // `none → inset()` interpolates inconsistently.
    const setClip = (next: string) => {
      if (!parentWrapper) return;
      const current = parentWrapper.style.clipPath;
      if (current === next) return;
      if (next === CLIP_NONE && !current) return;
      if (!current) {
        parentWrapper.style.transition = '';
        parentWrapper.style.clipPath = CLIP_NONE;
        // eslint-disable-next-line no-void
        void parentWrapper.offsetHeight;
      }
      parentWrapper.style.transition = wrapperTransition;
      parentWrapper.style.clipPath = next;
    };

    if (descendants.length === 0) {
      parent.style.transition = transition;
      parent.style.transform = '';
      setClip(CLIP_NONE);
      return;
    }

    // Track only the immediate child's snap point. Walking deeper descendants
    // would push this sheet further when a grandchild opens, even when our
    // own child didn't move (e.g., child skipped its cascade for a page
    // grandchild) — leaving a visible gap between this sheet and its child.
    const computeTargetY = () => {
      const parentSnap =
        Number.parseFloat(parent.style.getPropertyValue('--snap-point-height')) || 0;
      const node = descendants[0]?.nodeRef.current;
      if (!node) return parentSnap;
      const childSnap = Number.parseFloat(node.style.getPropertyValue('--snap-point-height')) || 0;
      return Math.max(parentSnap, childSnap);
    };

    // When a form-sheet parent has a form-sheet descendant, clip the parent to
    // the child card's viewport box so it doesn't peek above/around. Only
    // applies when this sheet is itself form — a page parent should remain
    // visible behind/around a floating form child. Geometry comes from the
    // child's inline styles (not getBoundingClientRect) to read the at-rest
    // box, unskewed by vaul's slide-in.
    const applyFormClip = () => {
      const form = isFormSheet ? descendants.find((d) => d.isFormSheetRef.current) : undefined;
      if (!form) {
        setClip(CLIP_NONE);
        return;
      }
      const childDrawer = form.nodeRef.current;
      const childWrapper = childDrawer?.closest<HTMLElement>('[data-vaul-detached-wrapper]');
      if (!parentWrapper || !childDrawer || !childWrapper) return;
      const snapY =
        Number.parseFloat(childDrawer.style.getPropertyValue('--snap-point-height')) || 0;
      const childBottomGap = Number.parseFloat(childWrapper.style.bottom) || 0;
      const childMaxW = Number.parseFloat(childWrapper.style.maxWidth) || window.innerWidth;
      const formLeft = (window.innerWidth - childMaxW) / 2;
      const formRight = (window.innerWidth + childMaxW) / 2;
      const formBottom = window.innerHeight - childBottomGap;
      const rect = parentWrapper.getBoundingClientRect();
      const top = Math.max(0, snapY - rect.top);
      const left = Math.max(0, formLeft - rect.left);
      const right = Math.max(0, rect.right - formRight);
      const bottom = Math.max(0, rect.bottom - formBottom);
      const radius = cornerRadius ?? DEFAULT_CORNER_RADIUS;
      setClip(`inset(${top}px ${right}px ${bottom}px ${left}px round ${radius}px)`);
    };

    const apply = () => {
      applyFormClip();
      // Mirror iOS: a page-sheet child fully covers a form-sheet parent, so the
      // cascade push-down has no visible effect — and would briefly peek above
      // the page during the present animation. Leave the parent put.
      const child = descendants[0];
      if (isFormSheet && child && !child.isFormSheetRef.current) {
        parent.style.transition = transition;
        parent.style.transform = '';
        return;
      }
      const targetY = computeTargetY();
      const match = parent.style.transform.match(/translate3d\([^,]*,\s*(-?\d*\.?\d+)px/);
      const currentY = match ? Number.parseFloat(match[1]!) : 0;
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
  }, [descendants, activeSnapPoint, cornerRadius, isFormSheet, isOpen]);

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

  // Definite-height flex layout (per-detent sizing) unless content must be
  // measured in natural flow: 'auto' detents (without a plugged scrollable —
  // those measure via `measureNaturalHeight`) and form-sheet content-fit sizing.
  const useSizedLayout = (!hasAutoDetent || hasBoundedScrollable) && !isFormSheet;

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
      // Clip children to the rounded top so headers/content with their own
      // background don't bleed past the corners. `clip` (not `hidden`): a
      // hidden box is still a scroll container, so browser focus-reveal (e.g.
      // tapping a button near the sheet bottom) can scroll-offset the drawer —
      // shifting content and blocking vaul's shouldDrag walk (scrollTop > 0).
      overflow: 'clip',
      // Lift content above iOS home indicator / bottom safe area when enabled.
      // A relative footer owns the inset instead (see resolvedFooterStyle).
      paddingBottom:
        insetAdjustment === 'automatic' && !footerOwnsInset
          ? 'env(safe-area-inset-bottom, 0px)'
          : 0,
    }),
    [backgroundColor, effectiveCornerRadius, insetAdjustment, footerOwnsInset]
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

  // Form-sheet style (presentation='form'): centered floating card with a
  // default width and a height fit to content. We reuse the existing detached
  // mechanic so drag/snap math stays correct — the wrapper is bottom-attached
  // with a computed offset (`effectiveDetachedOffset`, declared above) that
  // centers it vertically. `presentation` is absolute: when 'form',
  // `maxContentWidth` is ignored and the card uses DEFAULT_FORM_SHEET_WIDTH.

  // The wrapper holds all horizontal sizing/anchoring so its rounded-bottom
  // clip (when detached) aligns with the drawer's horizontal bounds on
  // desktop — otherwise its corners sit at the far viewport edges.
  // - presentation='form' → DEFAULT_FORM_SHEET_WIDTH on tablet/landscape;
  //   `maxContentWidth` is ignored ('form' is absolute).
  // - presentation='page' → `maxContentWidth` (any viewport) or
  //   DEFAULT_MAX_WIDTH (tablet/landscape readability cap).
  // Detached without a width constraint applies anchorOffset on both edges so
  // the floating card breathes from the viewport sides.
  const wrapperStyle = useMemo<React.CSSProperties | undefined>(() => {
    // Mobile portrait ignores width sizing entirely (matches iOS/Android:
    // both apply `maxContentWidth` only when not on a portrait phone).
    // `detached` + `detachedOffset` are still respected via the wrapper.
    const maxWidth = isLandscapeOrTablet
      ? presentation === 'form'
        ? DEFAULT_FORM_SHEET_WIDTH
        : (maxContentWidth ?? DEFAULT_MAX_WIDTH)
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
    presentation,
    anchor,
    anchorOffset,
    effectiveDetached,
    dropShadow,
  ]);

  // Absolute-position the grabber so it overlays the content top-edge
  // instead of consuming flow height — mirrors native iOS/Android, where
  // the grabber sits in the rounded corner zone above the content and
  // doesn't push the header down or inflate the 'auto' detent measurement.
  const handleStyle = useMemo<React.CSSProperties>(
    () => ({
      position: 'absolute',
      top: grabberOptions?.topMargin ?? DEFAULT_GRABBER_TOP_MARGIN,
      left: '50%',
      transform: 'translateX(-50%)',
      height: grabberHeight,
      width: grabberOptions?.width ?? DEFAULT_GRABBER_WIDTH,
      borderRadius: grabberOptions?.cornerRadius ?? grabberHeight / 2,
      backgroundColor: (grabberOptions?.color ?? defaultGrabberColor) as string,
      opacity: 1,
      // Above absolute-positioned headers (which often use zIndex:1 to overlay
      // scroll content) so the grabber stays draggable — critical when
      // `handleOnly` mode means only the grabber can drag the sheet.
      zIndex: 2,
    }),
    [grabberOptions, grabberHeight, defaultGrabberColor]
  );

  return (
    <TrueSheetPeekContext.Provider value={peekContext}>
      <Drawer.Root
        open={isOpen}
        onOpenChange={handleOpenChange}
        onPositionChange={handlePositionChange}
        onDrag={handleDrag}
        onRelease={handleRelease}
        dismissible={dismissible}
        draggable={draggable}
        repositionInputs={false}
        modal={dimmed}
        nested={isNested}
        detached={effectiveDetached}
        detachedOffset={effectiveDetachedOffset}
        detachedRadius={effectiveCornerRadius}
        maxContentHeight={effectiveMaxContentHeight}
        peekHeight={peekHeight}
        initialAnimated={initialDetentAnimated}
        detachedWrapperStyle={wrapperStyle}
        onContentHeightChange={setMeasuredContentHeight}
        contentHeight={
          // Bounded scrollable → the auto-size wrapper measures 0 (sized
          // layout is absolute), so feed vaul the natural height instead.
          hasAutoDetent && hasBoundedScrollable && scrollableAutoHeight > 0
            ? scrollableAutoHeight
            : undefined
        }
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
              footer && absoluteFooter ? (
                <div style={footerFloatStyle}>
                  <View ref={footerElRef} style={footerStyle} onLayout={handleFooterLayout}>
                    {isValidElement(footer) ? footer : createElement(footer)}
                  </View>
                </div>
              ) : undefined
            }
          >
            <Drawer.Title style={visuallyHiddenStyle}>Sheet</Drawer.Title>
            {grabber && <Drawer.Handle style={handleStyle} />}
            {useSizedLayout ? (
              // vaul wraps children in `[data-vaul-auto-size-wrapper]` (display:
              // flow-root) which doesn't honor descendant flex layout. Use an
              // absolute fill sized to the visible portion (via vaul's
              // `--snap-point-height` var) so the inner flex column has a
              // definite height for flex layouts to fill — mirrors native, where
              // the container is sized to the sheet's visible height per detent.
              <div
                ref={sizedLayoutRef}
                style={sizedLayoutStyle}
                data-vaul-scroll-locked={isScrollLocked ? '' : undefined}
              >
                {header && (
                  <View ref={headerElRef} style={resolvedHeaderStyle} onLayout={handleHeaderLayout}>
                    {isValidElement(header) ? header : createElement(header)}
                  </View>
                )}
                {/* Content lays out naturally like native — fill only for auto
                    detents with a plugged scrollable, where natural layout is
                    circular (sheet height derives from the scroll content size).
                    Mirrors the native shadow node's scrollableBounded behavior. */}
                <View
                  ref={contentRef}
                  style={hasAutoDetent && hasBoundedScrollable ? [contentFillStyle, style] : style}
                >
                  {children}
                </View>
                {footer && !absoluteFooter && (
                  <View
                    ref={footerElRef}
                    style={[relativeFooterStyle, resolvedFooterStyle]}
                    onLayout={handleFooterLayout}
                  >
                    {isValidElement(footer) ? footer : createElement(footer)}
                  </View>
                )}
              </div>
            ) : (
              // Natural flow so vaul can measure content height — required for
              // 'auto' detents and form-sheet content-fit sizing.
              <>
                {header && (
                  <View ref={headerElRef} style={resolvedHeaderStyle} onLayout={handleHeaderLayout}>
                    {isValidElement(header) ? header : createElement(header)}
                  </View>
                )}
                <View ref={contentRef} style={style}>
                  {children}
                </View>
                {footer && !absoluteFooter && (
                  <View ref={footerElRef} style={resolvedFooterStyle} onLayout={handleFooterLayout}>
                    {isValidElement(footer) ? footer : createElement(footer)}
                  </View>
                )}
              </>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </TrueSheetPeekContext.Provider>
  );
});

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
};

// Pinned to the sheet's bottom edge — takes up layout space below the content
const relativeFooterStyle = {
  marginTop: 'auto',
} as const;

// Floats over the content so it doesn't take up layout space
const absoluteHeaderStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1,
} as const;

const SIZED_LAYOUT_HEIGHT = 'calc(100% - var(--snap-point-height, 0px))';

const sizedLayoutStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: SIZED_LAYOUT_HEIGHT,
  display: 'flex',
  flexDirection: 'column',
};

const contentFillStyle = {
  flex: 1,
  minHeight: 0,
} as const;

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
