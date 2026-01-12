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

#if !defined(ANDROID)
    concreteShadowNode.setEventDispatcher(eventDispatcher_);
#endif
  }
};

} // namespace facebook::react
