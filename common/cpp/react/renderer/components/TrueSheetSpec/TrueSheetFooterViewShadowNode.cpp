#include "TrueSheetFooterViewShadowNode.h"

#include <react/renderer/components/view/conversions.h>

#include "TrueSheetInsets.h"

namespace facebook::react {

using namespace yoga;

extern const char TrueSheetFooterViewComponentName[] = "TrueSheetFooterView";

void TrueSheetFooterViewShadowNode::adjustLayoutWithState() {
  ensureUnsealed();

  auto state = std::static_pointer_cast<
      const TrueSheetFooterViewShadowNode::ConcreteState>(getState());
  auto stateData = state->getData();

  auto &props = getConcreteProps();

  // Until native pushes the real inset (which requires this node to already
  // exist), seed a late-mounted footer's first layout with the precalculated
  // inset — otherwise it lays out unpadded and forces a second sheet resize.
  float bottomInset = stateData.bottomInset;
  if (!stateData.initialized && props.autoBottomInset) {
    bottomInset = TrueSheetInsets::bottomSafeArea();
  }

  // A footer pinned to the sheet's bottom edge owns the bottom safe-area
  // inset — pad it on top of any style padding so its content clears the
  // home indicator while the background fills the inset.
  auto padding = props.yogaStyle.padding(Edge::Bottom);
  if (bottomInset > 0) {
    // Base bottom padding from the style — Edge::Bottom wins over
    // Vertical/All, mirroring Yoga's own resolution. Points only.
    float base = 0;
    for (auto edge : {Edge::Bottom, Edge::Vertical, Edge::All}) {
      auto length = props.yogaStyle.padding(edge);
      if (length.isDefined()) {
        base = length.isPoints() ? length.value().unwrap() : 0;
        break;
      }
    }
    padding = StyleLength::points(base + bottomInset);
  }

  if (yogaNode_.style().padding(Edge::Bottom) != padding) {
    yoga::Style adjustedStyle = props.yogaStyle;
    adjustedStyle.setPadding(Edge::Bottom, padding);
    yogaNode_.setStyle(adjustedStyle);
    yogaNode_.setDirty(true);
  }
}

} // namespace facebook::react
