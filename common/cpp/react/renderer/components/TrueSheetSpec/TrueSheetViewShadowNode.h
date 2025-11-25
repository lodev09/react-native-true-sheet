#pragma once

#include <jsi/jsi.h>
#include <react/renderer/components/TrueSheetSpec/EventEmitters.h>
#include <react/renderer/components/TrueSheetSpec/Props.h>
#include <react/renderer/components/TrueSheetSpec/TrueSheetViewState.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>

namespace facebook::react {

JSI_EXPORT extern const char TrueSheetViewComponentName[];

/*
 * `ShadowNode` for <TrueSheetView> component.
 */
class JSI_EXPORT TrueSheetViewShadowNode final
    : public ConcreteViewShadowNode<
          TrueSheetViewComponentName,
          TrueSheetViewProps,
          TrueSheetViewEventEmitter,
          TrueSheetViewState> {
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

 public:
  void adjustLayoutWithState();
};

} // namespace facebook::react
