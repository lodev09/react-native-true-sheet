#include "TrueSheetContainerViewShadowNode.h"

#include <react/renderer/core/LayoutContext.h>
#include <yoga/Yoga.h>
#include <yoga/style/StyleSizeLength.h>

namespace facebook::react {

extern const char TrueSheetContainerViewComponentName[] = "TrueSheetContainerView";

void TrueSheetContainerViewShadowNode::adjustLayoutWithState() {
  ensureUnsealed();

  auto state = std::static_pointer_cast<
      const TrueSheetContainerViewShadowNode::ConcreteState>(getState());
  auto stateData = state->getData();

  // If containerWidth is set from native, override Yoga's width
  if (stateData.containerWidth > 0) {
    auto &props = getConcreteProps();
    yoga::Style adjustedStyle = props.yogaStyle;

    // Set the width to the container width from native
    adjustedStyle.setDimension(yoga::Dimension::Width, yoga::StyleSizeLength::points(stateData.containerWidth));

    auto currentStyle = yogaNode_.style();
    if (adjustedStyle.dimension(yoga::Dimension::Width) != currentStyle.dimension(yoga::Dimension::Width)) {
      yogaNode_.setStyle(adjustedStyle);
      yogaNode_.setDirty(true);
    }
  }
}

} // namespace facebook::react
