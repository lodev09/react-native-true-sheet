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

void TrueSheetContentViewShadowNode::layout(LayoutContext layoutContext) {
  ConcreteViewShadowNode::layout(layoutContext);
  updateNaturalHeightIfNeeded(layoutContext);
}

// Even auto-height content can be constrained by the container when a
// descendant ScrollView shrinks to fit. Its committed height then hides
// content growth, so only a fixed, non-flexible height can be used directly.
static bool isHeightContainerDerived(const yoga::Style &style) {
  return style.flexGrow().unwrapOrDefault(0) > 0 ||
      style.flexShrink().unwrapOrDefault(0) > 0 ||
      !style.dimension(Dimension::Height).isPoints();
}

// The natural height is the height the content wants when unbounded — the
// source for the auto detent. When the content's height derives from the
// container, the committed layout doesn't reflect it — lay out a clone of the
// subtree with an unconstrained height instead. Yoga respects the user's
// styles: an explicit-height ScrollView keeps its height while a flexible one
// expands to its content — no ScrollView discovery involved.
void TrueSheetContentViewShadowNode::updateNaturalHeightIfNeeded(
    const LayoutContext &layoutContext) {
  if (gIsMeasuringNaturalHeight) {
    return;
  }

  auto stateData = getStateData();
  auto size = getLayoutMetrics().frame.size;

  Float naturalHeight = size.height;
  if (isHeightContainerDerived(getConcreteProps().yogaStyle)) {
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
