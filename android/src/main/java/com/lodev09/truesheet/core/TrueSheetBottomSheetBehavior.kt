package com.lodev09.truesheet.core

import android.view.View
import androidx.coordinatorlayout.widget.CoordinatorLayout
import com.google.android.material.bottomsheet.BottomSheetBehavior

class TrueSheetBottomSheetBehavior<V : View> : BottomSheetBehavior<V>() {
  var scrollingExpandsSheet: Boolean = true

  init {
    // Material hides once the release point, projected by velocity * friction, passes half
    // the lowest detent. A higher friction lets short flicks dismiss, closer to iOS sheets.
    hideFriction = HIDE_FRICTION
  }

  override fun onNestedPreScroll(
    coordinatorLayout: CoordinatorLayout,
    child: V,
    target: View,
    dx: Int,
    dy: Int,
    consumed: IntArray,
    type: Int
  ) {
    // dy > 0 = user swiping up = sheet expanding
    // Block expansion from scroll, but allow if sheet is already being dragged
    if (!scrollingExpandsSheet && dy > 0 && state != STATE_DRAGGING) return
    super.onNestedPreScroll(coordinatorLayout, child, target, dx, dy, consumed, type)
  }

  override fun onNestedPreFling(
    coordinatorLayout: CoordinatorLayout,
    child: V,
    target: View,
    velocityX: Float,
    velocityY: Float
  ): Boolean {
    // Don't consume flings — let the ScrollView decelerate naturally
    if (!scrollingExpandsSheet) return false
    return super.onNestedPreFling(coordinatorLayout, child, target, velocityX, velocityY)
  }

  companion object {
    private const val HIDE_FRICTION = 0.3f
  }
}
