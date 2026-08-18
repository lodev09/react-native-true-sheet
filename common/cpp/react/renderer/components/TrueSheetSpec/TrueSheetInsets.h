#pragma once

namespace facebook::react {

/*
 * Bottom safe-area inset published by the host platform (points/dp) so a
 * late-mounted footer's first layout can be padded before any Fabric state
 * lands (see TrueSheetFooterViewShadowNode).
 */
class TrueSheetInsets {
 public:
  static void setBottomSafeArea(float inset);
  static float bottomSafeArea();
};

} // namespace facebook::react
