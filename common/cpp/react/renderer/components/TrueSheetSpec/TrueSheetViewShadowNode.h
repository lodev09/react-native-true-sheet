#pragma once

#include <jsi/jsi.h>
#include <react/renderer/components/TrueSheetSpec/EventEmitters.h>
#include <react/renderer/components/TrueSheetSpec/Props.h>
#include <react/renderer/components/TrueSheetSpec/TrueSheetViewState.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>

namespace facebook::react {

class EventDispatcher;

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
  using StateData = ConcreteViewShadowNode::ConcreteStateData;

  static ShadowNodeTraits BaseTraits() {
    auto traits = ConcreteViewShadowNode::BaseTraits();
    traits.set(ShadowNodeTraits::Trait::RootNodeKind);
    return traits;
  }

  void adjustLayoutWithState();

#if !defined(ANDROID)
  void setEventDispatcher(std::weak_ptr<const EventDispatcher> dispatcher);

 private:
  StateData &getStateDataMutable();
#endif
};

} // namespace facebook::react
