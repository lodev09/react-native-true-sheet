#include "TrueSheetOverlayViewShadowNode.h"

#include "TrueSheetLayoutUtils.h"

namespace facebook::react {

extern const char TrueSheetOverlayViewComponentName[] = "TrueSheetOverlayView";

void TrueSheetOverlayViewShadowNode::adjustLayoutWithState() {
  ensureUnsealed();

  const auto &stateData = getStateData();
  applyContainerSizeToYogaNode(
      yogaNode_, getConcreteProps().yogaStyle, stateData.containerWidth, stateData.containerHeight);
}

} // namespace facebook::react
