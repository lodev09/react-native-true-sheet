#include "TrueSheetContentViewShadowNode.h"

#include <react/renderer/components/view/conversions.h>

namespace facebook::react {

using namespace yoga;

extern const char TrueSheetContentViewComponentName[] = "TrueSheetContentView";

void TrueSheetContentViewShadowNode::adjustLayoutWithState() {
  ensureUnsealed();

  auto state = std::static_pointer_cast<
      const TrueSheetContentViewShadowNode::ConcreteState>(getState());
  auto stateData = state->getData();

  auto &props = getConcreteProps();

  // When a ScrollView is pinned under an auto detent, fill the container so
  // descendant flex layouts (flex:1 wrappers, the ScrollView itself) resolve
  // against a definite height and the viewport is bounded — natural layout is
  // circular there since the sheet height derives from the ScrollView's content
  // size instead (see ContentView's naturalHeight on each platform). For fixed
  // detents, content lays out naturally like a regular view.
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
