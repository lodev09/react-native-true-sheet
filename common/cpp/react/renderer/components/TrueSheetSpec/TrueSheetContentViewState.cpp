#include "TrueSheetContentViewState.h"

namespace facebook::react {

#ifdef ANDROID
folly::dynamic TrueSheetContentViewState::getDynamic() const {
  return folly::dynamic::object("naturalHeight", naturalHeight);
}
#endif

} // namespace facebook::react
