#include "TrueSheetViewShadowNode.h"

#include <yoga/style/StyleSizeLength.h>

namespace facebook::react {

extern const char TrueSheetViewComponentName[] = "TrueSheetView";

void TrueSheetViewShadowNode::adjustLayoutWithState() {
  ensureUnsealed();

  auto state = std::static_pointer_cast<
      const TrueSheetViewShadowNode::ConcreteState>(getState());
  auto stateData = state->getData();

  // If container dimensions are set from native, override Yoga's dimensions
  if (stateData.containerWidth > 0 || stateData.containerHeight > 0) {
    auto &props = getConcreteProps();
    yoga::Style adjustedStyle = props.yogaStyle;
    auto currentStyle = yogaNode_.style();
    bool needsUpdate = false;

    // Set width if provided
    if (stateData.containerWidth > 0) {
      adjustedStyle.setDimension(yoga::Dimension::Width, yoga::StyleSizeLength::points(stateData.containerWidth));
      if (adjustedStyle.dimension(yoga::Dimension::Width) != currentStyle.dimension(yoga::Dimension::Width)) {
        needsUpdate = true;
      }
    }

    // Set height if provided
    if (stateData.containerHeight > 0) {
      adjustedStyle.setDimension(yoga::Dimension::Height, yoga::StyleSizeLength::points(stateData.containerHeight));
      if (adjustedStyle.dimension(yoga::Dimension::Height) != currentStyle.dimension(yoga::Dimension::Height)) {
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      yogaNode_.setStyle(adjustedStyle);
      yogaNode_.setDirty(true);
    }
  }
}

} // namespace facebook::react
