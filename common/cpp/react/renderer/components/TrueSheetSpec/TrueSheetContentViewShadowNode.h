#pragma once

#include <jsi/jsi.h>
#include <react/renderer/components/TrueSheetSpec/EventEmitters.h>
#include <react/renderer/components/TrueSheetSpec/Props.h>
#include <react/renderer/components/TrueSheetSpec/TrueSheetContentViewState.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>

namespace facebook::react {

JSI_EXPORT extern const char TrueSheetContentViewComponentName[];

/*
 * `ShadowNode` for <TrueSheetContentView> component.
 */
class JSI_EXPORT TrueSheetContentViewShadowNode final
    : public ConcreteViewShadowNode<
          TrueSheetContentViewComponentName,
          TrueSheetContentViewProps,
          TrueSheetContentViewEventEmitter,
          TrueSheetContentViewState> {
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

 public:
#pragma mark - LayoutableShadowNode

  void layout(LayoutContext layoutContext) override;

 private:
  void updateNaturalHeightIfNeeded(const LayoutContext &layoutContext);
};

} // namespace facebook::react
