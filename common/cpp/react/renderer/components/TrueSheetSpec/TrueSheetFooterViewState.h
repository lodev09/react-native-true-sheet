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
 * pads the footer's bottom edge, and with the footer's native translation so
 * measure() matches where it's drawn (see TrueSheetFooterViewShadowNode).
 */
class TrueSheetFooterViewState final {
 public:
  TrueSheetFooterViewState() = default;

#ifdef ANDROID
  TrueSheetFooterViewState(TrueSheetFooterViewState const &previousState, folly::dynamic data)
      : bottomInset(static_cast<float>(data["bottomInset"].getDouble())),
        translateY(static_cast<float>(data["translateY"].getDouble())),
        initialized(true) {
  }
#endif

  float bottomInset{0};
  // Native slide off the Yoga position — above the keyboard, or riding the
  // sheet below its lowest detent (Android)
  float translateY{0};
  // True once native has pushed a real inset — until then the shadow node
  // seeds the layout from TrueSheetInsets (see TrueSheetFooterViewShadowNode)
  bool initialized{false};

#ifdef ANDROID
  folly::dynamic getDynamic() const;
  MapBuffer getMapBuffer() const {
    return MapBufferBuilder::EMPTY();
  }
#endif
};

}  // namespace facebook::react
