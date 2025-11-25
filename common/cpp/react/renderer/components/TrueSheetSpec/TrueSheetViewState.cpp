#include "TrueSheetViewState.h"

namespace facebook::react {

#ifdef ANDROID
folly::dynamic TrueSheetViewState::getDynamic() const {
  return folly::dynamic::object("containerWidth", containerWidth)("containerHeight", containerHeight);
}
#endif

} // namespace facebook::react
