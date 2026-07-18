#pragma once

#include <react/renderer/components/TrueSheetSpec/TrueSheetFooterViewShadowNode.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>

namespace facebook::react {

/*
 * Descriptor for <TrueSheetFooterView> component.
 */
class TrueSheetFooterViewComponentDescriptor final
    : public ConcreteComponentDescriptor<TrueSheetFooterViewShadowNode> {
  using ConcreteComponentDescriptor::ConcreteComponentDescriptor;

  void adopt(ShadowNode &shadowNode) const override {
    auto &concreteShadowNode =
        static_cast<TrueSheetFooterViewShadowNode &>(shadowNode);
    concreteShadowNode.adjustLayoutWithState();

    ConcreteComponentDescriptor::adopt(shadowNode);
  }
};

} // namespace facebook::react
