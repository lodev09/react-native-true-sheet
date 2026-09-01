#pragma once

#include <react/renderer/components/TrueSheetSpec/TrueSheetOverlayViewShadowNode.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>

namespace facebook::react {

/*
 * Descriptor for <TrueSheetOverlayView> component.
 */
class TrueSheetOverlayViewComponentDescriptor final
    : public ConcreteComponentDescriptor<TrueSheetOverlayViewShadowNode> {
  using ConcreteComponentDescriptor::ConcreteComponentDescriptor;

  void adopt(ShadowNode &shadowNode) const override {
    static_cast<TrueSheetOverlayViewShadowNode &>(shadowNode).adjustLayoutWithState();
    ConcreteComponentDescriptor::adopt(shadowNode);
  }
};

} // namespace facebook::react
