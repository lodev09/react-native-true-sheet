const ACCESSORS = ['getScrollableNode', 'getNativeScrollRef'] as const;

// Resolves a `scrollableRef` value to its scroll node: a native tag on native,
// a DOM node on web. Imperative-handle lists (e.g. LegendList, FlashList) are
// not host components, so they go through the accessors ScrollView/FlatList
// also expose. A composite result is resolved again until it yields a tag or
// host node. `getScrollResponder` is skipped: it returns the ScrollView class
// instance, which findNodeHandle resolves to its first host child (the
// SwipeRefreshLayout on Android when a refreshControl is set).
export function resolveScrollable(scrollable: unknown): unknown {
  if (!scrollable || typeof scrollable !== 'object') return scrollable;
  for (const name of ACCESSORS) {
    const accessor = (scrollable as Record<string, unknown>)[name];
    if (typeof accessor !== 'function') continue;
    let node: unknown;
    try {
      node = accessor.call(scrollable);
    } catch {
      // e.g. LegendList forwarding to a custom scroll component that lacks it
      continue;
    }
    if (node != null && node !== scrollable) return resolveScrollable(node);
  }
  return scrollable;
}
