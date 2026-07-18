#pragma once

#ifdef ANDROID
#include <folly/dynamic.h>
#include <react/renderer/mapbuffer/MapBuffer.h>
#include <react/renderer/mapbuffer/MapBufferBuilder.h>
#endif

namespace facebook::react {

/*
 * State for <TrueSheetFooterView> component.
 * Set from native with the sheet's bottom safe-area inset so the shadow node
 * pads the footer's bottom edge (see TrueSheetFooterViewShadowNode).
 */
class TrueSheetFooterViewState final {
 public:
  TrueSheetFooterViewState() = default;

#ifdef ANDROID
  TrueSheetFooterViewState(
      TrueSheetFooterViewState const &previousState,
      folly::dynamic data)
      : bottomInset(static_cast<float>(data["bottomInset"].getDouble())) {}
#endif

  float bottomInset{0};

#ifdef ANDROID
  folly::dynamic getDynamic() const;
  MapBuffer getMapBuffer() const {
    return MapBufferBuilder::EMPTY();
  }
#endif
};

} // namespace facebook::react
