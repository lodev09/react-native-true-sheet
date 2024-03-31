package com.lodev09.truesheet.core

import android.view.MotionEvent
import android.view.ViewGroup
import android.widget.ScrollView
import androidx.coordinatorlayout.widget.CoordinatorLayout
import com.google.android.material.bottomsheet.BottomSheetBehavior

class SheetBehavior<T: ViewGroup>() : BottomSheetBehavior<T>() {
  var contentView: ViewGroup? = null

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

  companion object {
    const val TAG = "TrueSheetView"

    fun sizeIndexForState(sizeCount: Int, state: Int): Int {
      return when (sizeCount) {
        1 -> {
          return when (state) {
            STATE_EXPANDED -> 0
            else -> -1
          }
        }
        2 -> {
          return when (state) {
            STATE_COLLAPSED -> 0
            STATE_EXPANDED -> 1
            else -> -1
          }
        }
        3 -> {
          return when (state) {
            STATE_COLLAPSED -> 0
            STATE_HALF_EXPANDED -> 1
            STATE_EXPANDED -> 2
            else -> -1
          }
        }
        else -> -1
      }
    }

    fun stateForSizeIndex(sizeCount: Int, index: Int): Int {
      return when (sizeCount) {
        1 -> STATE_EXPANDED
        2 -> {
          return when (index) {
            0 -> STATE_COLLAPSED
            1 -> STATE_EXPANDED
            else -> STATE_HIDDEN
          }
        }
        3 -> {
          return when(index) {
            0 -> STATE_COLLAPSED
            1 -> STATE_HALF_EXPANDED
            2 -> STATE_EXPANDED
            else -> STATE_HIDDEN
          }
        }
        else -> STATE_HIDDEN
      }
    }
  }
}
