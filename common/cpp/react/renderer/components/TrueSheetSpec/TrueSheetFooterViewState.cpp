#include "TrueSheetFooterViewState.h"

namespace facebook::react {

#ifdef ANDROID
folly::dynamic TrueSheetFooterViewState::getDynamic() const {
  return folly::dynamic::object("bottomInset", bottomInset);
}
#endif

} // namespace facebook::react
