#pragma once

#include <react/renderer/components/TrueSheetSpec/TrueSheetViewShadowNode.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>

namespace facebook::react {

/*
 * Descriptor for <TrueSheetView> component.
 */
class TrueSheetViewComponentDescriptor final
    : public ConcreteComponentDescriptor<TrueSheetViewShadowNode> {
  using ConcreteComponentDescriptor::ConcreteComponentDescriptor;

  void adopt(ShadowNode &shadowNode) const override {
    auto &concreteShadowNode =
        static_cast<TrueSheetViewShadowNode &>(shadowNode);
    concreteShadowNode.adjustLayoutWithState();

    ConcreteComponentDescriptor::adopt(shadowNode);
  }
};

} // namespace facebook::react
