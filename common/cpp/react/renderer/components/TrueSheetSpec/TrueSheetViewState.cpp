#include "TrueSheetViewState.h"

namespace facebook::react {

#ifdef ANDROID
folly::dynamic TrueSheetViewState::getDynamic() const {
  return folly::dynamic::object("containerWidth", containerWidth)("containerHeight", containerHeight);
}
#endif

#if !defined(ANDROID)
void TrueSheetViewState::setEventDispatcher(
    std::weak_ptr<const EventDispatcher> dispatcher) {
  eventDispatcher_ = dispatcher;
}

std::weak_ptr<const EventDispatcher> TrueSheetViewState::getEventDispatcher()
    const noexcept {
  return eventDispatcher_;
}
#endif

} // namespace facebook::react
