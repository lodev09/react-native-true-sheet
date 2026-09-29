package com.lodev09.truesheet.core

import android.view.MotionEvent
import android.view.VelocityTracker
import android.view.View
import android.view.ViewConfiguration
import androidx.coordinatorlayout.widget.CoordinatorLayout
import androidx.core.view.ViewCompat
import com.facebook.react.uimanager.PixelUtil.dpToPx
import com.google.android.material.bottomsheet.BottomSheetBehavior
import kotlin.math.abs

class TrueSheetBottomSheetBehavior<V : View> : BottomSheetBehavior<V>() {
  var scrollingExpandsSheet: Boolean = true
  var lowestSheetTop: (() -> Int)? = null

  private var nestedDragged = false
  private var nestedReleaseVelocity = 0f
  private var touchDragged = false
  private var touchPointerId = MotionEvent.INVALID_POINTER_ID
  private var touchDownY = 0f
  private var touchSlop = 0
  private var trackedEventTime = -1L
  private var trackedAction = -1
  private var velocityTracker: VelocityTracker? = null

  // Material's hide decision measures against the collapsed height, so a sheet
  // whose lowest detent is tall needs a long drag to dismiss. At or below the
  // lowest detent, settle like Compose Material3's sheet instead.
  private fun releaseState(child: V, dragged: Boolean, velocityY: Float): Int? {
    if (!dragged) return null
    val lowestTop = lowestSheetTop?.invoke() ?: return null
    if (child.top < lowestTop) return null
    val hides = if (abs(velocityY) > DISMISS_VELOCITY_DP.dpToPx()) {
      velocityY > 0
    } else {
      child.top - lowestTop > DISMISS_DISTANCE_DP.dpToPx()
    }
    return if (hides && isHideable) STATE_HIDDEN else STATE_COLLAPSED
  }

  override fun onStartNestedScroll(
    coordinatorLayout: CoordinatorLayout,
    child: V,
    directTargetChild: View,
    target: View,
    axes: Int,
    type: Int
  ): Boolean {
    if (type == ViewCompat.TYPE_TOUCH) {
      nestedDragged = false
      nestedReleaseVelocity = 0f
    }
    return super.onStartNestedScroll(coordinatorLayout, child, directTargetChild, target, axes, type)
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
    if (type == ViewCompat.TYPE_TOUCH && consumed[1] != 0) nestedDragged = true
  }

  override fun onNestedPreFling(
    coordinatorLayout: CoordinatorLayout,
    child: V,
    target: View,
    velocityX: Float,
    velocityY: Float
  ): Boolean {
    nestedReleaseVelocity = -velocityY
    if (releaseState(child, nestedDragged, nestedReleaseVelocity) != null) return true
    // Don't consume flings — let the ScrollView decelerate naturally
    if (!scrollingExpandsSheet) return false
    return super.onNestedPreFling(coordinatorLayout, child, target, velocityX, velocityY)
  }

  override fun onStopNestedScroll(coordinatorLayout: CoordinatorLayout, child: V, target: View, type: Int) {
    if (type == ViewCompat.TYPE_TOUCH) {
      releaseState(child, nestedDragged, nestedReleaseVelocity)?.let {
        nestedDragged = false
        state = it
        return
      }
    }
    super.onStopNestedScroll(coordinatorLayout, child, target, type)
  }

  private fun trackTouch(parent: CoordinatorLayout, event: MotionEvent) {
    if (event.eventTime == trackedEventTime && event.actionMasked == trackedAction) return
    trackedEventTime = event.eventTime
    trackedAction = event.actionMasked
    when (event.actionMasked) {
      MotionEvent.ACTION_DOWN -> {
        velocityTracker?.recycle()
        velocityTracker = VelocityTracker.obtain()
        touchPointerId = event.getPointerId(0)
        touchDownY = event.y
        touchDragged = false
        touchSlop = ViewConfiguration.get(parent.context).scaledTouchSlop
      }

      MotionEvent.ACTION_MOVE -> {
        val index = event.findPointerIndex(touchPointerId)
        if (index >= 0 && abs(event.getY(index) - touchDownY) > touchSlop) touchDragged = true
      }
    }
    velocityTracker?.addMovement(event)
  }

  override fun onInterceptTouchEvent(parent: CoordinatorLayout, child: V, event: MotionEvent): Boolean {
    trackTouch(parent, event)
    return super.onInterceptTouchEvent(parent, child, event)
  }

  override fun onTouchEvent(parent: CoordinatorLayout, child: V, event: MotionEvent): Boolean {
    trackTouch(parent, event)
    val handled = super.onTouchEvent(parent, child, event)
    if (event.actionMasked == MotionEvent.ACTION_UP) {
      val velocityY = velocityTracker?.run {
        computeCurrentVelocity(1000)
        getYVelocity(touchPointerId)
      } ?: 0f
      releaseState(child, touchDragged, velocityY)?.let { state = it }
    }
    if (event.actionMasked == MotionEvent.ACTION_UP || event.actionMasked == MotionEvent.ACTION_CANCEL) {
      velocityTracker?.recycle()
      velocityTracker = null
      touchDragged = false
    }
    return handled
  }

  companion object {
    // Compose Material3 SheetState's velocity and positional thresholds
    private const val DISMISS_VELOCITY_DP = 125f
    private const val DISMISS_DISTANCE_DP = 56f
  }
}
