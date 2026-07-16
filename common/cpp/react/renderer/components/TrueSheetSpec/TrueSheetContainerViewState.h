#pragma once

#ifdef ANDROID
#include <folly/dynamic.h>
#include <react/renderer/mapbuffer/MapBuffer.h>
#include <react/renderer/mapbuffer/MapBufferBuilder.h>
#endif

namespace facebook::react {

/*
 * State for <TrueSheetContainerView> component.
 * Set from native when a ScrollView is pinned so the shadow node fills the
 * sheet instead of sizing naturally (see TrueSheetContainerViewShadowNode).
 */
class TrueSheetContainerViewState final {
 public:
  TrueSheetContainerViewState() = default;

#ifdef ANDROID
  TrueSheetContainerViewState(
      TrueSheetContainerViewState const &previousState,
      folly::dynamic data)
      : scrollableBounded(data["scrollableBounded"].getBool()) {}
#endif

  bool scrollableBounded{false};

#ifdef ANDROID
  folly::dynamic getDynamic() const;
  MapBuffer getMapBuffer() const {
    return MapBufferBuilder::EMPTY();
  }
#endif
};

} // namespace facebook::react
