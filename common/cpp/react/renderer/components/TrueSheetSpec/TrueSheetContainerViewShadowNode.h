#pragma once

#include <jsi/jsi.h>
#include <react/renderer/components/TrueSheetSpec/EventEmitters.h>
#include <react/renderer/components/TrueSheetSpec/Props.h>
#include <react/renderer/components/TrueSheetSpec/TrueSheetContainerViewState.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>

namespace facebook::react {

JSI_EXPORT extern const char TrueSheetContainerViewComponentName[];

/*
 * `ShadowNode` for <TrueSheetContainerView> component.
 */
class JSI_EXPORT TrueSheetContainerViewShadowNode final
    : public ConcreteViewShadowNode<
          TrueSheetContainerViewComponentName,
          TrueSheetContainerViewProps,
          TrueSheetContainerViewEventEmitter,
          TrueSheetContainerViewState> {
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

 public:
  void adjustLayoutWithState();
};

} // namespace facebook::react
