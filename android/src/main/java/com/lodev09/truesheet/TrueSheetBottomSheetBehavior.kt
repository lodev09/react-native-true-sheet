package com.lodev09.truesheet

import android.util.Log
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.widget.ScrollView
import androidx.coordinatorlayout.widget.CoordinatorLayout
import com.google.android.material.bottomsheet.BottomSheetBehavior

class TrueSheetBottomSheetBehavior<T : ViewGroup>() : BottomSheetBehavior<T>() {
  var contentView: ViewGroup? = null

  private fun isInsideSheet(scrollView: ScrollView, event: MotionEvent): Boolean {
    val x = event.x
    val y = event.y

    val position = IntArray(2)
    scrollView.getLocationOnScreen(position)

    val nestedX = position[0]
    val nestedY = position[1]

    val boundRight = nestedX + scrollView.width
    val boundBottom = nestedY + scrollView.height

    return (x > nestedX && x < boundRight && y > nestedY && y < boundBottom) ||
      event.action == MotionEvent.ACTION_CANCEL
  }

  override fun onInterceptTouchEvent(parent: CoordinatorLayout, child: T, event: MotionEvent): Boolean {
    contentView?.let {
      val isDownEvent = (event.actionMasked == MotionEvent.ACTION_DOWN)
      val expanded = state == STATE_EXPANDED

      if (isDownEvent && expanded) {
        for(i in 0 until it.childCount) {
          val contentChild = it.getChildAt(i)
          val scrolled = (contentChild is ScrollView && contentChild.scrollY > 0)

          if (!scrolled) continue
          if (isInsideSheet(contentChild as ScrollView, event)) {
            return false
          }
        }
      }
    }

    return super.onInterceptTouchEvent(parent, child, event)
  }

  companion object {
    const val TAG = "TrueSheetView"
  }
}
