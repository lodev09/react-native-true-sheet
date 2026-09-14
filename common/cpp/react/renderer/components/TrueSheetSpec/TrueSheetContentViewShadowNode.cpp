#include "TrueSheetContentViewShadowNode.h"

#include <folly/ScopeGuard.h>
#include <react/renderer/components/view/conversions.h>
#include <react/renderer/core/ComponentDescriptor.h>
#include <react/renderer/core/LayoutConstraints.h>
#include <react/renderer/core/LayoutContext.h>

#include <limits>

namespace facebook::react {

using namespace yoga;

extern const char TrueSheetContentViewComponentName[] = "TrueSheetContentView";

// The measurement pass re-enters layout() on a clone — guard so it doesn't
// measure again recursively.
static thread_local bool gIsMeasuringNaturalHeight = false;

TrueSheetContentViewShadowNode::TrueSheetContentViewShadowNode(
  const ShadowNode &sourceShadowNode, const ShadowNodeFragment &fragment)
    : ConcreteViewShadowNode(sourceShadowNode, fragment),
      measurement_(static_cast<const TrueSheetContentViewShadowNode &>(sourceShadowNode).measurement_),
      measurementSourceChildren_(
        static_cast<const TrueSheetContentViewShadowNode &>(sourceShadowNode).measurementSourceChildren_),
      contentChanged_(static_cast<const TrueSheetContentViewShadowNode &>(sourceShadowNode).contentChanged_ ||
                      fragment.props || fragment.children) {
}

void TrueSheetContentViewShadowNode::layout(LayoutContext layoutContext) {
  // The sizing tree needs Yoga's result, not Fabric state updates or events.
  if (gIsMeasuringNaturalHeight) {
    return;
  }
  ConcreteViewShadowNode::layout(layoutContext);
  updateNaturalHeightIfNeeded(layoutContext);
}

// Every descendant must be detached from React's runtime references before
// Yoga clones it during measurement. Disabling transfer only on the root
// still lets descendant clones replace React's live nodes. Reuse unchanged
// measurement subtrees; Yoga owns copy-on-write when their layout changes.
std::shared_ptr<ShadowNode> TrueSheetContentViewShadowNode::cloneForMeasurement(
  const ShadowNode &node, const Children &previousSourceChildren, const Children &previousMeasurementChildren) {
  auto children = std::make_shared<Children>();
  children->reserve(node.getChildren().size());
  for (size_t index = 0; index < node.getChildren().size(); index++) {
    const auto &child = node.getChildren()[index];
    if (index < previousSourceChildren.size() && ShadowNode::sameFamily(*child, *previousSourceChildren[index])) {
      const auto &previousSource = previousSourceChildren[index];
      const auto &previousMeasurement = previousMeasurementChildren[index];
      children->push_back(child == previousSource ? previousMeasurement
                                                  : cloneForMeasurement(*child, previousSource->getChildren(),
                                                      previousMeasurement->getChildren()));
    } else {
      children->push_back(cloneForMeasurement(*child, {}, {}));
    }
  }

  auto clone = node.getComponentDescriptor().cloneShadowNode(
    node, {.children = children, .state = node.getState(), .runtimeShadowNodeReference = false});
  if (auto content = dynamic_cast<TrueSheetContentViewShadowNode *>(clone.get())) {
    content->measurement_.reset();
    content->measurementSourceChildren_.reset();
  }
  return clone;
}

// The natural height is the height the content wants when unbounded — the
// source for the auto detent. When the content's height derives from the
// container, the committed layout doesn't reflect it — lay out a clone of the
// subtree with an unconstrained height instead. Yoga respects the user's
// styles: an explicit-height ScrollView keeps its height while a flexible one
// expands to its content — no ScrollView discovery involved.
void TrueSheetContentViewShadowNode::updateNaturalHeightIfNeeded(const LayoutContext &layoutContext) {
  auto stateData = getStateData();
  auto size = getLayoutMetrics().frame.size;

  Float naturalHeight = size.height;
  // Auto-height content can also be capped by a shrinking ScrollView. Only
  // a fixed, non-flexible height can be taken from the viewport layout.
  if (yogaNode_.isNodeFlexible() || !getConcreteProps().yogaStyle.dimension(Dimension::Height).isPoints()) {
    auto constraints = LayoutConstraints{};
    constraints.minimumSize = {size.width, 0};
    constraints.maximumSize = {size.width, std::numeric_limits<Float>::infinity()};
    constraints.layoutDirection = getLayoutMetrics().layoutDirection;

    auto measurementContext = layoutContext;
    measurementContext.affectedNodes = nullptr;
    auto errata = YGConfigGetErrata(&yogaConfig_);

    // Yoga's viewport-only clones carry no new props or children. Reuse the
    // intrinsic height across those layouts instead of measuring each drag frame.
    if (contentChanged_ || !measurement_ || !(measurement_->constraints == constraints) ||
        !(measurement_->context == measurementContext) || measurement_->errata != errata) {
      gIsMeasuringNaturalHeight = true;
      auto restoreMeasurement = folly::makeGuard([] { gIsMeasuringNaturalHeight = false; });
      auto measurementNode =
        measurement_ ? cloneForMeasurement(*this, *measurementSourceChildren_, measurement_->root->getChildren())
                     : cloneForMeasurement(*this, {}, {});
      auto &measurement = static_cast<LayoutableShadowNode &>(*measurementNode);
      measurement.layoutTree(measurementContext, constraints);
      measurement_ = std::make_shared<const Measurement>(Measurement{.root = measurementNode,
        .constraints = constraints,
        .context = measurementContext,
        .errata = errata,
        .height = measurement.getLayoutMetrics().frame.size.height});
    }
    naturalHeight = measurement_->height;
  } else {
    measurement_.reset();
  }
  measurementSourceChildren_ = children_;
  contentChanged_ = false;

  if (stateData.naturalHeight != naturalHeight) {
    stateData.naturalHeight = naturalHeight;
    setStateData(std::move(stateData));
  }
}

}  // namespace facebook::react
