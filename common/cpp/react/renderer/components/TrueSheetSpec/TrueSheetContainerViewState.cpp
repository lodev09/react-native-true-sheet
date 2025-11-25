#include "TrueSheetContainerViewState.h"

namespace facebook::react {

#ifdef ANDROID
folly::dynamic TrueSheetContainerViewState::getDynamic() const {
  return folly::dynamic::object("containerWidth", containerWidth)("containerHeight", containerHeight);
}
#endif

} // namespace facebook::react
