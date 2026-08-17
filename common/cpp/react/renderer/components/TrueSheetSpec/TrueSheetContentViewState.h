#pragma once

#include <react/renderer/graphics/Float.h>

#ifdef ANDROID
#include <folly/dynamic.h>
#include <react/renderer/mapbuffer/MapBuffer.h>
#include <react/renderer/mapbuffer/MapBufferBuilder.h>
#endif

namespace facebook::react {

/*
 * State for <TrueSheetContentView> component.
 * `scrollableBounded` is set from native when a ScrollView is pinned so the
 * shadow node bounds the content to the container via flexShrink.
 * `naturalHeight` is measured by the shadow node during layout — the height
 * the content wants when unbounded (see TrueSheetContentViewShadowNode).
 */
class TrueSheetContentViewState final {
 public:
  TrueSheetContentViewState() = default;

#ifdef ANDROID
  TrueSheetContentViewState(
      TrueSheetContentViewState const &previousState,
      folly::dynamic data)
      : scrollableBounded(
            data.getDefault("scrollableBounded", previousState.scrollableBounded)
                .getBool()),
        naturalHeight(previousState.naturalHeight) {}
#endif

  bool scrollableBounded{false};
  Float naturalHeight{0};

#ifdef ANDROID
  folly::dynamic getDynamic() const;
  MapBuffer getMapBuffer() const {
    return MapBufferBuilder::EMPTY();
  }
#endif
};

} // namespace facebook::react
