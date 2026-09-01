#include "TrueSheetViewShadowNode.h"

#include "TrueSheetLayoutUtils.h"

namespace facebook::react {

extern const char TrueSheetViewComponentName[] = "TrueSheetView";

void TrueSheetViewShadowNode::adjustLayoutWithState() {
  ensureUnsealed();

  const auto &stateData = getStateData();
  applyContainerSizeToYogaNode(
      yogaNode_, getConcreteProps().yogaStyle, stateData.containerWidth, stateData.containerHeight);
}

#if !defined(ANDROID)
void TrueSheetViewShadowNode::setEventDispatcher(
    std::weak_ptr<const EventDispatcher> dispatcher) {
  getStateDataMutable().setEventDispatcher(dispatcher);
}

TrueSheetViewShadowNode::StateData &
TrueSheetViewShadowNode::getStateDataMutable() {
  ensureUnsealed();
  return const_cast<TrueSheetViewShadowNode::StateData &>(getStateData());
}
#endif

} // namespace facebook::react
