#pragma once

#ifdef ANDROID
#include <folly/dynamic.h>
#include <react/renderer/mapbuffer/MapBuffer.h>
#include <react/renderer/mapbuffer/MapBufferBuilder.h>
#endif

namespace facebook::react {

/*
 * State for <TrueSheetContentView> component.
 * Set from native when a ScrollView is pinned so the shadow node bounds the
 * content to the container via flexShrink (see TrueSheetContentViewShadowNode).
 */
class TrueSheetContentViewState final {
 public:
  TrueSheetContentViewState() = default;

#ifdef ANDROID
  TrueSheetContentViewState(
      TrueSheetContentViewState const &previousState,
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
