#pragma once

#include <memory>

#ifdef ANDROID
#include <folly/dynamic.h>
#include <react/renderer/mapbuffer/MapBuffer.h>
#include <react/renderer/mapbuffer/MapBufferBuilder.h>
#endif

namespace facebook::react {

/*
 * State for <TrueSheetView> component.
 * Contains the container dimensions from native.
 */
class TrueSheetViewState final {
 public:
  using Shared = std::shared_ptr<const TrueSheetViewState>;

  TrueSheetViewState() = default;

#ifdef ANDROID
  TrueSheetViewState(
      TrueSheetViewState const &previousState,
      folly::dynamic data)
      : containerWidth(static_cast<float>(data["containerWidth"].getDouble())),
        containerHeight(static_cast<float>(data["containerHeight"].getDouble())) {}
#endif

  float containerWidth{0};
  float containerHeight{0};

#ifdef ANDROID
  folly::dynamic getDynamic() const;
  MapBuffer getMapBuffer() const {
    return MapBufferBuilder::EMPTY();
  }
#endif
};

} // namespace facebook::react
