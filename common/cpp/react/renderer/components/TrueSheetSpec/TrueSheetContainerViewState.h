#pragma once

#include <memory>

#ifdef ANDROID
#include <folly/dynamic.h>
#include <react/renderer/mapbuffer/MapBuffer.h>
#include <react/renderer/mapbuffer/MapBufferBuilder.h>
#endif

namespace facebook::react {

/*
 * State for <TrueSheetContainerView> component.
 * Contains the container width from native Auto Layout.
 */
class TrueSheetContainerViewState final {
 public:
  using Shared = std::shared_ptr<const TrueSheetContainerViewState>;

  TrueSheetContainerViewState() = default;

#ifdef ANDROID
  TrueSheetContainerViewState(
      TrueSheetContainerViewState const &previousState,
      folly::dynamic data)
      : containerWidth(static_cast<float>(data["containerWidth"].getDouble())) {}
#endif

  float containerWidth{0};

#ifdef ANDROID
  folly::dynamic getDynamic() const;
  MapBuffer getMapBuffer() const {
    return MapBufferBuilder::EMPTY();
  }
#endif
};

} // namespace facebook::react
