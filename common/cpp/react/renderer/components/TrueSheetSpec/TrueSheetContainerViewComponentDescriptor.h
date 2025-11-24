#pragma once

#include <react/renderer/components/TrueSheetSpec/TrueSheetContainerViewShadowNode.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>

namespace facebook::react {

/*
 * Descriptor for <TrueSheetContainerView> component.
 */
class TrueSheetContainerViewComponentDescriptor final
    : public ConcreteComponentDescriptor<TrueSheetContainerViewShadowNode> {
  using ConcreteComponentDescriptor::ConcreteComponentDescriptor;

  void adopt(ShadowNode &shadowNode) const override {
    auto &concreteShadowNode =
        static_cast<TrueSheetContainerViewShadowNode &>(shadowNode);
    concreteShadowNode.adjustLayoutWithState();

    ConcreteComponentDescriptor::adopt(shadowNode);
  }
};

} // namespace facebook::react
