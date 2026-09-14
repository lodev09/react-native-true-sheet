#pragma once

#include <jsi/jsi.h>
#include <react/renderer/components/TrueSheetSpec/EventEmitters.h>
#include <react/renderer/components/TrueSheetSpec/Props.h>
#include <react/renderer/components/TrueSheetSpec/TrueSheetContentViewState.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>
#include <react/renderer/core/LayoutConstraints.h>
#include <react/renderer/core/LayoutContext.h>

namespace facebook::react {

JSI_EXPORT extern const char TrueSheetContentViewComponentName[];

/*
 * `ShadowNode` for <TrueSheetContentView> component.
 */
class JSI_EXPORT TrueSheetContentViewShadowNode final
    : public ConcreteViewShadowNode<TrueSheetContentViewComponentName, TrueSheetContentViewProps,
        TrueSheetContentViewEventEmitter, TrueSheetContentViewState> {
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

 public:
  TrueSheetContentViewShadowNode(const ShadowNode &sourceShadowNode, const ShadowNodeFragment &fragment);

#pragma mark - LayoutableShadowNode

  void layout(LayoutContext layoutContext) override;

 private:
  using Children = std::vector<std::shared_ptr<const ShadowNode>>;

  struct Measurement {
    std::shared_ptr<const ShadowNode> root;
    LayoutConstraints constraints;
    LayoutContext context;
    YGErrata errata;
    Float height;
  };

  std::shared_ptr<const Measurement> measurement_;
  std::shared_ptr<const Children> measurementSourceChildren_;
  bool contentChanged_{true};

  static std::shared_ptr<ShadowNode> cloneForMeasurement(
    const ShadowNode &node, const Children &previousSourceChildren, const Children &previousMeasurementChildren);

  void updateNaturalHeightIfNeeded(const LayoutContext &layoutContext);
};

}  // namespace facebook::react
