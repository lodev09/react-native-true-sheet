/// <reference lib="dom" />
import { useEffect, useState } from 'react';

import { FOOTER_INSET } from './layout';
import { getScrollParent } from './vaul/use-prevent-scroll';
import type { KeyboardViewport } from './vaul/types';

// Subpixel tolerance between the visual and layout viewport heights
const VIEWPORT_EPSILON = 1;

const readKeyboardViewport = (): KeyboardViewport | undefined => {
  const vv = window.visualViewport;
  if (!vv) return undefined;
  const layoutHeight = document.documentElement.clientHeight;
  // Pinch-zoom shrinks the visual viewport too — scaling it back out leaves
  // only what the keyboard covers.
  if (vv.height * vv.scale >= layoutHeight - VIEWPORT_EPSILON) return undefined;
  return { top: vv.offsetTop, height: vv.height, layoutHeight };
};

const isSameViewport = (a: KeyboardViewport | undefined, b: KeyboardViewport | undefined) =>
  a === b ||
  (a !== undefined &&
    b !== undefined &&
    a.top === b.top &&
    a.height === b.height &&
    a.layoutHeight === b.layoutHeight);

/**
 * Tracks the visual viewport while a soft keyboard shrinks it. iOS Safari and
 * Chrome (default `interactive-widget`) keep the layout viewport — and every
 * fixed element — full height under the keyboard, so the sheet has to be laid
 * out against the visual viewport instead.
 */
export function useKeyboardViewport(enabled: boolean): KeyboardViewport | undefined {
  const [viewport, setViewport] = useState<KeyboardViewport | undefined>();

  useEffect(() => {
    const vv = window.visualViewport;
    if (!enabled || !vv) {
      setViewport(undefined);
      return undefined;
    }

    const update = () => {
      const next = readKeyboardViewport();
      setViewport((current) => (isSameViewport(current, next) ? current : next));
    };

    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [enabled]);

  return viewport;
}

/**
 * Scrolls the focused field in `container` back above its scroll parent's
 * bottom edge, clearing a floating footer. The browser only reveals it on
 * focus — before the sheet fits above the keyboard.
 */
export function revealFocusedElement(container: HTMLElement) {
  const focused = document.activeElement;
  if (!(focused instanceof HTMLElement) || !container.contains(focused)) return;
  const scroller = getScrollParent(focused);
  if (!container.contains(scroller)) return;
  const footerInset = parseFloat(getComputedStyle(scroller).getPropertyValue(FOOTER_INSET)) || 0;
  const overflow =
    focused.getBoundingClientRect().bottom -
    (scroller.getBoundingClientRect().bottom - footerInset);
  if (overflow > 0) scroller.scrollTop += overflow;
}
