#pragma once

#include <jsi/jsi.h>
#include <react/renderer/components/TrueSheetSpec/EventEmitters.h>
#include <react/renderer/components/TrueSheetSpec/Props.h>
#include <react/renderer/components/TrueSheetSpec/TrueSheetViewState.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>

namespace facebook::react {

JSI_EXPORT extern const char TrueSheetOverlayViewComponentName[];

/*
 * `ShadowNode` for <TrueSheetOverlayView> component.
 * Sized to the window from native (via TrueSheetViewState) so its children
 * lay out against the full window like the sheet's container.
 */
class JSI_EXPORT TrueSheetOverlayViewShadowNode final
    : public ConcreteViewShadowNode<
          TrueSheetOverlayViewComponentName,
          TrueSheetOverlayViewProps,
          TrueSheetOverlayViewEventEmitter,
          TrueSheetViewState> {
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

 public:
  static ShadowNodeTraits BaseTraits() {
    auto traits = ConcreteViewShadowNode::BaseTraits();
    traits.set(ShadowNodeTraits::Trait::RootNodeKind);
    return traits;
  }

  void adjustLayoutWithState();
};

} // namespace facebook::react
