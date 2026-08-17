#include "TrueSheetContentViewShadowNode.h"

#include <limits>

#include <react/renderer/components/view/conversions.h>
#include <react/renderer/core/LayoutConstraints.h>
#include <react/renderer/core/LayoutContext.h>

namespace facebook::react {

using namespace yoga;

extern const char TrueSheetContentViewComponentName[] = "TrueSheetContentView";

// measure() lays out a clone of this node, which re-enters layout() on the
// clone — guard so the measurement pass doesn't measure again recursively.
static thread_local bool gIsMeasuringNaturalHeight = false;

void TrueSheetContentViewShadowNode::adjustLayoutWithState() {
  ensureUnsealed();

  auto state = std::static_pointer_cast<
      const TrueSheetContentViewShadowNode::ConcreteState>(getState());
  auto stateData = state->getData();

  auto &props = getConcreteProps();

  // When a ScrollView is pinned under an auto detent, fill the container so
  // descendant flex layouts (flex:1 wrappers, the ScrollView itself) resolve
  // against a definite height and the viewport is bounded — natural layout is
  // circular there since the sheet height derives from the content's natural
  // height instead (see updateNaturalHeightIfNeeded). For fixed detents,
  // content lays out naturally like a regular view.
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

void TrueSheetContentViewShadowNode::layout(LayoutContext layoutContext) {
  ConcreteViewShadowNode::layout(layoutContext);
  updateNaturalHeightIfNeeded(layoutContext);
}

// The natural height is the height the content wants when unbounded — the
// source for the auto detent. Once the container bounds the content
// (scrollableBounded), the committed layout no longer reflects it, so lay out
// a clone of the subtree with an unconstrained height. Yoga respects the
// user's styles: an explicit-height ScrollView keeps its height while a
// flexible one expands to its content — no ScrollView discovery involved.
void TrueSheetContentViewShadowNode::updateNaturalHeightIfNeeded(
    const LayoutContext &layoutContext) {
  if (gIsMeasuringNaturalHeight) {
    return;
  }

  auto stateData = getStateData();
  auto size = getLayoutMetrics().frame.size;

  Float naturalHeight = size.height;
  if (stateData.scrollableBounded) {
    auto constraints = LayoutConstraints{};
    constraints.minimumSize = {size.width, 0};
    constraints.maximumSize = {size.width, std::numeric_limits<Float>::infinity()};
    constraints.layoutDirection = getLayoutMetrics().layoutDirection;

    gIsMeasuringNaturalHeight = true;
    naturalHeight = measure(layoutContext, constraints).height;
    gIsMeasuringNaturalHeight = false;
  }

  if (stateData.naturalHeight != naturalHeight) {
    stateData.naturalHeight = naturalHeight;
    setStateData(std::move(stateData));
  }
}

} // namespace facebook::react
