package com.lodev09.truesheet

import android.content.Context
import android.util.AttributeSet
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.widget.ScrollView
import androidx.coordinatorlayout.widget.CoordinatorLayout
import com.google.android.material.bottomsheet.BottomSheetBehavior

class TrueSheetBottomSheetBehavior<T : ViewGroup>: BottomSheetBehavior<T> {

  constructor() : super()
  constructor(context: Context, attrs: AttributeSet) : super(context, attrs)

  override fun onInterceptTouchEvent(parent: CoordinatorLayout, child: T, event: MotionEvent): Boolean {
    val isDownEvent = (event.actionMasked == MotionEvent.ACTION_DOWN)
    val expanded = (state == BottomSheetBehavior.STATE_EXPANDED)

    if(isDownEvent && expanded){
      val content = child.getChildAt(0) as ViewGroup
      for(i in 0 until content.childCount){
        val contentChild = content.getChildAt(i)
        val scrolled = (contentChild is ScrollView && contentChild.scrollY > 0)
        if(!scrolled) continue

        val inside = isMotionEventInsideView(contentChild, event)
        if(inside) return false
      }
    }

    return super.onInterceptTouchEvent(parent, child, event)
  }

  private fun isMotionEventInsideView(view: View, event: MotionEvent): Boolean {
    val coords = intArrayOf(0, 0)
    view.getLocationInWindow(coords)
    return (
      event.rawX >= coords[0] && event.rawX <= (coords[0] + view.width) &&
        event.rawY >= coords[1] && event.rawY <= (coords[1] + view.height)
      )
  }
}
