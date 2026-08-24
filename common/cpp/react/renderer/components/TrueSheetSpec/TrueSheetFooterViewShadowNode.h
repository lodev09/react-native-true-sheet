#pragma once

#include <jsi/jsi.h>
#include <react/renderer/components/TrueSheetSpec/EventEmitters.h>
#include <react/renderer/components/TrueSheetSpec/Props.h>
#include <react/renderer/components/TrueSheetSpec/TrueSheetFooterViewState.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>

namespace facebook::react {

JSI_EXPORT extern const char TrueSheetFooterViewComponentName[];

/*
 * `ShadowNode` for <TrueSheetFooterView> component.
 */
class JSI_EXPORT TrueSheetFooterViewShadowNode final
    : public ConcreteViewShadowNode<
          TrueSheetFooterViewComponentName,
          TrueSheetFooterViewProps,
          TrueSheetFooterViewEventEmitter,
          TrueSheetFooterViewState> {
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

 public:
  void adjustLayoutWithState();
};

} // namespace facebook::react
