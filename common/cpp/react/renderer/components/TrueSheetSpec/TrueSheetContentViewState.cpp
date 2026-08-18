#include "TrueSheetContentViewState.h"

namespace facebook::react {

#ifdef ANDROID
folly::dynamic TrueSheetContentViewState::getDynamic() const {
  return folly::dynamic::object("scrollableBounded", scrollableBounded)(
      "naturalHeight", naturalHeight);
}
#endif

} // namespace facebook::react
