#include "TrueSheetContainerViewState.h"

namespace facebook::react {

#ifdef ANDROID
folly::dynamic TrueSheetContainerViewState::getDynamic() const {
  return folly::dynamic::object("containerWidth", containerWidth);
}
#endif

} // namespace facebook::react
