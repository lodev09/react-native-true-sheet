#pragma once

#include <react/renderer/components/view/conversions.h>
#include <yoga/node/Node.h>
#include <yoga/style/Style.h>

namespace facebook::react {

/*
 * Overrides a node's Yoga dimensions with the container size reported from
 * native. A zero dimension leaves that axis to Yoga.
 */
inline void applyContainerSizeToYogaNode(
    yoga::Node &node,
    const yoga::Style &baseStyle,
    float containerWidth,
    float containerHeight) {
  if (containerWidth <= 0 && containerHeight <= 0) {
    return;
  }

  yoga::Style adjustedStyle = baseStyle;
  const auto &currentStyle = node.style();
  bool needsUpdate = false;

  if (containerWidth > 0) {
    adjustedStyle.setDimension(yoga::Dimension::Width, yoga::StyleSizeLength::points(containerWidth));
    if (adjustedStyle.dimension(yoga::Dimension::Width) != currentStyle.dimension(yoga::Dimension::Width)) {
      needsUpdate = true;
    }
  }

  if (containerHeight > 0) {
    adjustedStyle.setDimension(yoga::Dimension::Height, yoga::StyleSizeLength::points(containerHeight));
    if (adjustedStyle.dimension(yoga::Dimension::Height) != currentStyle.dimension(yoga::Dimension::Height)) {
      needsUpdate = true;
    }
  }

  if (needsUpdate) {
    node.setStyle(adjustedStyle);
    node.setDirty(true);
  }
}

} // namespace facebook::react
