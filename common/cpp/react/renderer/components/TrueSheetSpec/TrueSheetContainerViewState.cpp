#include "TrueSheetContainerViewState.h"

namespace facebook::react {

#ifdef ANDROID
folly::dynamic TrueSheetContainerViewState::getDynamic() const {
  return folly::dynamic::object("scrollableBounded", scrollableBounded);
}
#endif

} // namespace facebook::react
