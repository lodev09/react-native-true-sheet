/// <reference lib="dom" />

const FOOTER_INSET = '--truesheet-footer-inset';

interface SheetLayoutOptions {
  drawer: HTMLElement;
  layout: HTMLElement;
  getContent: () => HTMLElement | null;
  getHeader: () => HTMLElement | null;
  getFooter: () => HTMLElement | null;
  getScrollable: () => HTMLElement | null;
  absoluteHeader: boolean;
  absoluteFooter: boolean;
  footerInsetAdjustment: boolean;
  measureContent: boolean;
  onHeightChange: (height: number) => void;
}

export function observeSheetLayout({
  drawer,
  layout,
  getContent,
  getHeader,
  getFooter,
  getScrollable,
  absoluteHeader,
  absoluteFooter,
  footerInsetAdjustment,
  measureContent,
  onHeightChange,
}: SheetLayoutOptions) {
  let frame = 0;
  let disposed = false;
  let width = -1;
  let height = -1;
  let scroller: HTMLElement | null = null;
  let originalPadding = '';
  let insetPadding = '';
  let appliedInset = 0;
  const observed = new Set<Element>();

  // This tree has no viewport constraint or injected footer inset. Its resize
  // observer catches intrinsic changes without observing the live flex layout.
  const measurement = measureContent ? document.createElement('div') : null;
  if (measurement) {
    Object.assign(measurement.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      display: 'flex',
      flexDirection: 'column',
      visibility: 'hidden',
      pointerEvents: 'none',
    });
    measurement.style.setProperty(FOOTER_INSET, '0px');
    measurement.inert = true;
    measurement.setAttribute('aria-hidden', 'true');
    measurement.setAttribute('data-truesheet-measure', '');
    drawer.appendChild(measurement);
  }

  const measure = () => {
    if (!measurement?.isConnected) return;
    const headerHeight = absoluteHeader ? 0 : (getHeader()?.offsetHeight ?? 0);
    const footerHeight =
      !absoluteFooter || (footerInsetAdjustment && scroller) ? (getFooter()?.offsetHeight ?? 0) : 0;
    const next = measurement.offsetHeight + headerHeight + footerHeight;
    if (height === next) return;
    height = next;
    onHeightChange(next);
  };

  const updateInset = () => {
    let inset = 0;
    const footer = getFooter();
    if (footerInsetAdjustment && scroller && footer) {
      let bottom = scroller.offsetTop + scroller.offsetHeight;
      let parent = scroller.offsetParent;
      while (parent instanceof HTMLElement && parent !== layout) {
        bottom += parent.offsetTop;
        parent = parent.offsetParent;
      }
      if (parent === layout) {
        inset = Math.min(
          footer.offsetHeight,
          Math.max(0, bottom - (layout.clientHeight - footer.offsetHeight))
        );
      }
    }
    if (inset === appliedInset) return;
    appliedInset = inset;
    layout.style.setProperty(FOOTER_INSET, `${inset}px`);
  };

  const resizeObserver = new ResizeObserver(() => {
    if (measurement && width !== layout.clientWidth) {
      width = layout.clientWidth;
      measurement.style.width = `${width}px`;
    }
    updateInset();
    measure();
  });
  const measurementObserver = new ResizeObserver(measure);
  if (measurement) measurementObserver.observe(measurement);

  const restorePadding = () => {
    if (scroller && scroller.style.paddingBottom === insetPadding) {
      scroller.style.paddingBottom = originalPadding;
    }
  };

  const sync = () => {
    if (disposed) return;
    const content = getContent();
    const nextScroller = getScrollable();
    if (nextScroller !== scroller) {
      restorePadding();
      scroller = nextScroller;
      insetPadding = '';
    }
    if (
      footerInsetAdjustment &&
      scroller &&
      (!insetPadding || scroller.style.paddingBottom !== insetPadding)
    ) {
      originalPadding = scroller.style.paddingBottom;
      const base = getComputedStyle(scroller).paddingBottom;
      insetPadding = `calc(${base} + var(${FOOTER_INSET}, 0px))`;
      scroller.style.paddingBottom = insetPadding;
      insetPadding = scroller.style.paddingBottom;
    }

    const nodes = new Set<Element>([layout]);
    for (const node of [getHeader(), getFooter(), scroller]) {
      if (node) nodes.add(node);
    }
    for (const node of observed) {
      if (!nodes.has(node)) {
        resizeObserver.unobserve(node);
        observed.delete(node);
      }
    }
    for (const node of nodes) {
      if (!observed.has(node)) {
        resizeObserver.observe(node);
        observed.add(node);
      }
    }

    if (measurement && content) {
      width = layout.clientWidth;
      measurement.style.width = `${width}px`;
      measurement.replaceChildren(content.cloneNode(true));
    }
    updateInset();
    measure();
  };

  const mutationObserver = new MutationObserver((mutations) => {
    const changed = mutations.some(
      (mutation) => mutation.target !== layout || mutation.type === 'childList'
    );
    if (!changed || frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      sync();
    });
  });

  sync();
  mutationObserver.observe(layout, {
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['style', 'class'],
    subtree: true,
  });
  const footer = getFooter();
  if (absoluteFooter && footer) {
    mutationObserver.observe(footer, { childList: true, characterData: true, subtree: true });
  }

  return {
    measure,
    disconnect: () => {
      disposed = true;
      cancelAnimationFrame(frame);
      mutationObserver.disconnect();
      resizeObserver.disconnect();
      measurementObserver.disconnect();
      restorePadding();
      layout.style.removeProperty(FOOTER_INSET);
      measurement?.remove();
    },
  };
}
