#include "TrueSheetContainerViewShadowNode.h"

#include <react/renderer/components/view/conversions.h>

namespace facebook::react {

using namespace yoga;

extern const char TrueSheetContainerViewComponentName[] = "TrueSheetContainerView";

void TrueSheetContainerViewShadowNode::adjustLayoutWithState() {
  ensureUnsealed();

  auto state = std::static_pointer_cast<
      const TrueSheetContainerViewShadowNode::ConcreteState>(getState());
  auto stateData = state->getData();

  auto &props = getConcreteProps();

  // Auto detents leave the container at its natural height (its layout IS the
  // detent height). When a ScrollView is pinned, fill the sheet instead so the
  // viewport is bounded to the visible space — the natural height is measured
  // from the ScrollView's content size (see ContainerView's autoHeight on each
  // platform).
  auto flexGrow = stateData.scrollableBounded
      ? FloatOptional{1.0f}
      : props.yogaStyle.flexGrow();
  auto flexShrink = stateData.scrollableBounded
      ? FloatOptional{1.0f}
      : props.yogaStyle.flexShrink();

  if (yogaNode_.style().flexGrow() != flexGrow ||
      yogaNode_.style().flexShrink() != flexShrink) {
    yoga::Style adjustedStyle = props.yogaStyle;
    adjustedStyle.setFlexGrow(flexGrow);
    adjustedStyle.setFlexShrink(flexShrink);
    yogaNode_.setStyle(adjustedStyle);
    yogaNode_.setDirty(true);
  }
}

} // namespace facebook::react
