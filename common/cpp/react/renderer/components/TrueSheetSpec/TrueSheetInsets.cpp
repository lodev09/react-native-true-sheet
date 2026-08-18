#include "TrueSheetInsets.h"

#include <atomic>

namespace facebook::react {

// Written from the UI thread, read from the layout thread
static std::atomic<float> gBottomSafeArea{0};

void TrueSheetInsets::setBottomSafeArea(float inset) {
  gBottomSafeArea.store(inset, std::memory_order_relaxed);
}

float TrueSheetInsets::bottomSafeArea() {
  return gBottomSafeArea.load(std::memory_order_relaxed);
}

} // namespace facebook::react
