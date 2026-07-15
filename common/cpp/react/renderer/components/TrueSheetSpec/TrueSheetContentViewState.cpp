#include "TrueSheetContentViewState.h"

namespace facebook::react {

#ifdef ANDROID
folly::dynamic TrueSheetContentViewState::getDynamic() const {
  return folly::dynamic::object("scrollableBounded", scrollableBounded);
}
#endif

} // namespace facebook::react
