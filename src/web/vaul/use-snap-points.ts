// @ts-nocheck — vendored upstream, incompatible with noUncheckedIndexedAccess
import React from 'react';
import { set, isVertical } from './helpers';
import { TRANSITIONS, VELOCITY_THRESHOLD } from './constants';
import { useControllableState } from './use-controllable-state';
import type { DrawerDirection } from './types';

export function useSnapPoints({
  activeSnapPointProp,
  setActiveSnapPointProp,
  snapPoints,
  drawerRef,
  overlayRef,
  fadeFromIndex,
  onSnapPointChange,
  direction = 'bottom',
  container,
  snapToSequentialPoint,
  isOpen,
  contentHeight,
  detachedOffset = 0,
}: {
  activeSnapPointProp?: number | string | null;
  setActiveSnapPointProp?(snapPoint: number | null | string): void;
  snapPoints?: (number | string)[];
  fadeFromIndex?: number;
  drawerRef: React.RefObject<HTMLDivElement | null>;
  overlayRef: React.RefObject<HTMLDivElement | null>;
  onSnapPointChange(activeSnapPointIndex: number): void;
  direction?: DrawerDirection;
  container?: HTMLElement | null | undefined;
  snapToSequentialPoint?: boolean;
  isOpen?: boolean;
  contentHeight?: number;
  detachedOffset?: number;
}) {
  const [activeSnapPoint, setActiveSnapPoint] = useControllableState<string | number | null>({
    prop: activeSnapPointProp,
    defaultProp: snapPoints?.[0],
    onChange: setActiveSnapPointProp,
  });

  const [windowDimensions, setWindowDimensions] = React.useState(
    typeof window !== 'undefined'
      ? {
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
        }
      : undefined
  );

  React.useEffect(() => {
    function onResize() {
      setWindowDimensions({
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
      });
    }
    window.addEventListener('resize', onResize);

    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isLastSnapPoint = React.useMemo(
    () => activeSnapPoint === snapPoints?.[snapPoints.length - 1] || null,
    [snapPoints, activeSnapPoint]
  );

  const activeSnapPointIndex = React.useMemo(
    () => snapPoints?.findIndex((snapPoint) => snapPoint === activeSnapPoint) ?? null,
    [snapPoints, activeSnapPoint]
  );

  const shouldFade =
    (snapPoints &&
      snapPoints.length > 0 &&
      (fadeFromIndex || fadeFromIndex === 0) &&
      !Number.isNaN(fadeFromIndex) &&
      snapPoints[fadeFromIndex] === activeSnapPoint) ||
    !snapPoints;

  const snapPointsOffset = React.useMemo(() => {
    const containerSize = container
      ? {
          width: container.getBoundingClientRect().width,
          height: container.getBoundingClientRect().height,
        }
      : typeof window !== 'undefined'
        ? { width: window.innerWidth, height: window.innerHeight }
        : { width: 0, height: 0 };

    // Shrink the effective vertical area by detachedOffset so snap math
    // reserves a fixed gap at the bottom — the floating card stays offset
    // from the viewport edge through drag, snap and resize.
    const effectiveHeight = Math.max(0, containerSize.height - (detachedOffset || 0));

    return (
      snapPoints?.map((snapPoint) => {
        // 'auto' resolves to measured content height. Falls back to half the
        // container so the initial snap is close to final before ResizeObserver
        // reports a real measurement.
        const resolved =
          snapPoint === 'auto'
            ? `${contentHeight && contentHeight > 0 ? contentHeight : effectiveHeight / 2}px`
            : snapPoint;
        const isPx = typeof resolved === 'string';
        let snapPointAsNumber = 0;

        if (isPx) {
          snapPointAsNumber = parseInt(resolved, 10);
        }

        if (isVertical(direction)) {
          const height = isPx
            ? snapPointAsNumber
            : windowDimensions
              ? resolved * effectiveHeight
              : 0;

          if (windowDimensions) {
            return direction === 'bottom'
              ? effectiveHeight - height
              : -effectiveHeight + height;
          }

          return height;
        }
        const width = isPx
          ? snapPointAsNumber
          : windowDimensions
            ? resolved * containerSize.width
            : 0;

        if (windowDimensions) {
          return direction === 'right' ? containerSize.width - width : -containerSize.width + width;
        }

        return width;
      }) ?? []
    );
  }, [snapPoints, windowDimensions, container, contentHeight, detachedOffset]);

  const activeSnapPointOffset = React.useMemo(
    () => (activeSnapPointIndex !== null ? snapPointsOffset?.[activeSnapPointIndex] : null),
    [snapPointsOffset, activeSnapPointIndex]
  );

  // Detached-only: the drawer sits inside a clip wrapper. When drag overshoots
  // below the lowest detent we translate the wrapper by the excess so the
  // whole floating card follows the pointer instead of the drawer sliding
  // behind the wrapper's rounded-bottom clip.
  const setDetachedWrapperTransform = (y: number, animated: boolean) => {
    if (!drawerRef.current || !isVertical(direction)) return;
    const wrapper = drawerRef.current.closest<HTMLElement>('[data-vaul-detached-wrapper]');
    if (!wrapper) return;
    set(wrapper, {
      transition: animated
        ? `transform ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`
        : 'none',
      transform: `translate3d(0, ${y}px, 0)`,
    });
  };

  const snapToPoint = React.useCallback(
    (dimension: number) => {
      const newSnapPointIndex =
        snapPointsOffset?.findIndex((snapPointDim) => snapPointDim === dimension) ?? null;
      onSnapPointChange(newSnapPointIndex);

      set(drawerRef.current, {
        transition: `transform ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`,
        transform: isVertical(direction)
          ? `translate3d(0, ${dimension}px, 0)`
          : `translate3d(${dimension}px, 0, 0)`,
      });

      // Snapping implies drag overshoot (if any) should be undone.
      setDetachedWrapperTransform(0, true);

      if (
        snapPointsOffset &&
        newSnapPointIndex !== snapPointsOffset.length - 1 &&
        fadeFromIndex !== undefined &&
        newSnapPointIndex !== fadeFromIndex &&
        newSnapPointIndex < fadeFromIndex
      ) {
        set(overlayRef.current, {
          transition: `opacity ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`,
          opacity: '0',
          pointerEvents: 'none',
        });
      } else {
        set(overlayRef.current, {
          transition: `opacity ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`,
          opacity: '1',
          pointerEvents: 'auto',
        });
      }

      setActiveSnapPoint(snapPoints?.[Math.max(newSnapPointIndex, 0)]);
    },
    [drawerRef.current, snapPoints, snapPointsOffset, fadeFromIndex, overlayRef, setActiveSnapPoint]
  );

  React.useEffect(() => {
    if (!isOpen) return;
    if (activeSnapPoint || activeSnapPointProp) {
      const newIndex =
        snapPoints?.findIndex(
          (snapPoint) => snapPoint === activeSnapPointProp || snapPoint === activeSnapPoint
        ) ?? -1;
      if (snapPointsOffset && newIndex !== -1 && typeof snapPointsOffset[newIndex] === 'number') {
        snapToPoint(snapPointsOffset[newIndex] as number);
      }
    }
  }, [isOpen, activeSnapPoint, activeSnapPointProp, snapPoints, snapPointsOffset, snapToPoint]);

  function onRelease({
    draggedDistance,
    closeDrawer,
    velocity,
    dismissible,
  }: {
    draggedDistance: number;
    closeDrawer: () => void;
    velocity: number;
    dismissible: boolean;
  }) {
    if (fadeFromIndex === undefined) return;

    const currentPosition =
      direction === 'bottom' || direction === 'right'
        ? (activeSnapPointOffset ?? 0) - draggedDistance
        : (activeSnapPointOffset ?? 0) + draggedDistance;
    const isOverlaySnapPoint = activeSnapPointIndex === fadeFromIndex - 1;
    const isFirst = activeSnapPointIndex === 0;
    const hasDraggedUp = draggedDistance > 0;

    if (isOverlaySnapPoint) {
      set(overlayRef.current, {
        transition: `opacity ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`,
      });
    }

    // Distance-based dismiss: when overshooting past the lowest detent by more
    // than half of its visible height, commit to dismiss regardless of
    // velocity — lets a slow drag-down still close the sheet.
    if (
      dismissible &&
      (direction === 'bottom' || direction === 'right') &&
      currentPosition > snapPointsOffset[0]
    ) {
      const viewportDim = isVertical(direction) ? window.innerHeight : window.innerWidth;
      const effectiveDim = Math.max(0, viewportDim - (detachedOffset || 0));
      const visibleAtLowest = Math.max(0, effectiveDim - snapPointsOffset[0]);
      const overshoot = currentPosition - snapPointsOffset[0];
      if (overshoot > visibleAtLowest * 0.5) {
        closeDrawer();
        return;
      }
    }

    if (!snapToSequentialPoint && velocity > 2 && !hasDraggedUp) {
      if (dismissible) closeDrawer();
      else snapToPoint(snapPointsOffset[0]); // snap to initial point
      return;
    }

    if (!snapToSequentialPoint && velocity > 2 && hasDraggedUp && snapPointsOffset && snapPoints) {
      snapToPoint(snapPointsOffset[snapPoints.length - 1] as number);
      return;
    }

    // Find the closest snap point to the current position
    const closestSnapPoint = snapPointsOffset?.reduce((prev, curr) => {
      if (typeof prev !== 'number' || typeof curr !== 'number') return prev;

      return Math.abs(curr - currentPosition) < Math.abs(prev - currentPosition) ? curr : prev;
    });

    const dim = isVertical(direction) ? window.innerHeight : window.innerWidth;
    if (velocity > VELOCITY_THRESHOLD && Math.abs(draggedDistance) < dim * 0.4) {
      const dragDirection = hasDraggedUp ? 1 : -1; // 1 = up, -1 = down

      // Don't do anything if we swipe upwards while being on the last snap point
      if (dragDirection > 0 && isLastSnapPoint && snapPoints) {
        snapToPoint(snapPointsOffset[snapPoints.length - 1]);
        return;
      }

      if (isFirst && dragDirection < 0 && dismissible) {
        closeDrawer();
      }

      if (activeSnapPointIndex === null) return;

      snapToPoint(snapPointsOffset[activeSnapPointIndex + dragDirection]);
      return;
    }

    snapToPoint(closestSnapPoint);
  }

  function onDrag({ draggedDistance }: { draggedDistance: number }) {
    if (activeSnapPointOffset === null) return;
    const newValue =
      direction === 'bottom' || direction === 'right'
        ? activeSnapPointOffset - draggedDistance
        : activeSnapPointOffset + draggedDistance;

    // Don't do anything if we exceed the last(biggest) snap point
    if (
      (direction === 'bottom' || direction === 'right') &&
      newValue < snapPointsOffset[snapPointsOffset.length - 1]
    ) {
      return;
    }
    if (
      (direction === 'top' || direction === 'left') &&
      newValue > snapPointsOffset[snapPointsOffset.length - 1]
    ) {
      return;
    }

    // Past the lowest detent: cap the drawer and translate the detached
    // wrapper by the excess so the floating card follows the pointer.
    if ((direction === 'bottom' || direction === 'right') && newValue > snapPointsOffset[0]) {
      const excess = newValue - snapPointsOffset[0];
      set(drawerRef.current, {
        transform: isVertical(direction)
          ? `translate3d(0, ${snapPointsOffset[0]}px, 0)`
          : `translate3d(${snapPointsOffset[0]}px, 0, 0)`,
      });
      setDetachedWrapperTransform(excess, false);
      return;
    }

    setDetachedWrapperTransform(0, false);
    set(drawerRef.current, {
      transform: isVertical(direction)
        ? `translate3d(0, ${newValue}px, 0)`
        : `translate3d(${newValue}px, 0, 0)`,
    });
  }

  function getPercentageDragged(absDraggedDistance: number, isDraggingDown: boolean) {
    if (
      !snapPoints ||
      typeof activeSnapPointIndex !== 'number' ||
      !snapPointsOffset ||
      fadeFromIndex === undefined
    )
      return null;

    // fadeFromIndex === 0 means every snap point is fully dimmed. Only the dismiss drag
    // (toward close from the smallest detent) should fade the overlay out, interpolating
    // opacity by distance from the smallest snap to the fully-dismissed position.
    if (fadeFromIndex === 0) {
      if (activeSnapPointIndex === 0 && !isDraggingDown) {
        const activeOffset = snapPointsOffset[activeSnapPointIndex];
        if (activeOffset === undefined) return 0;
        const windowDim = isVertical(direction) ? window.innerHeight : window.innerWidth;
        const dismissOffset =
          direction === 'bottom' || direction === 'right' ? windowDim : -windowDim;
        const dismissRange = Math.abs(dismissOffset - activeOffset);
        return dismissRange > 0 ? Math.min(1, absDraggedDistance / dismissRange) : 0;
      }
      return 0;
    }

    // If this is true we are dragging to a snap point that is supposed to have an overlay
    const isOverlaySnapPoint = activeSnapPointIndex === fadeFromIndex - 1;
    const isOverlaySnapPointOrHigher = activeSnapPointIndex >= fadeFromIndex;

    if (isOverlaySnapPointOrHigher && isDraggingDown) {
      return 0;
    }

    // Don't animate, but still use this one if we are dragging away from the overlaySnapPoint
    if (isOverlaySnapPoint && !isDraggingDown) return 1;
    if (!shouldFade && !isOverlaySnapPoint) return null;

    // Either fadeFrom index or the one before
    const targetSnapPointIndex = isOverlaySnapPoint
      ? activeSnapPointIndex + 1
      : activeSnapPointIndex - 1;

    // Get the distance from overlaySnapPoint to the one before or vice-versa to calculate the opacity percentage accordingly
    const snapPointDistance = isOverlaySnapPoint
      ? snapPointsOffset[targetSnapPointIndex] - snapPointsOffset[targetSnapPointIndex - 1]
      : snapPointsOffset[targetSnapPointIndex + 1] - snapPointsOffset[targetSnapPointIndex];

    const percentageDragged = absDraggedDistance / Math.abs(snapPointDistance);

    if (isOverlaySnapPoint) {
      return 1 - percentageDragged;
    } else {
      return percentageDragged;
    }
  }

  return {
    isLastSnapPoint,
    activeSnapPoint,
    shouldFade,
    getPercentageDragged,
    setActiveSnapPoint,
    activeSnapPointIndex,
    onRelease,
    onDrag,
    snapPointsOffset,
  };
}
