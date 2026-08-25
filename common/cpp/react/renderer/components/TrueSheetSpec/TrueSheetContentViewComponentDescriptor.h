#pragma once

#include <react/renderer/components/TrueSheetSpec/TrueSheetContentViewShadowNode.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>

namespace facebook::react {

/*
 * Descriptor for <TrueSheetContentView> component.
 */
class TrueSheetContentViewComponentDescriptor final
    : public ConcreteComponentDescriptor<TrueSheetContentViewShadowNode> {
  using ConcreteComponentDescriptor::ConcreteComponentDescriptor;
};

} // namespace facebook::react
