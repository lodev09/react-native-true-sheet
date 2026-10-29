package com.lodev09.truesheet.core

import android.view.MotionEvent
import android.view.VelocityTracker
import android.view.View
import androidx.coordinatorlayout.widget.CoordinatorLayout
import androidx.core.view.ViewCompat
import com.facebook.react.uimanager.PixelUtil.dpToPx
import com.google.android.material.bottomsheet.BottomSheetBehavior
import kotlin.math.abs

enum class TrueSheetDismissThreshold {
  HALF,
  SHORT;

  companion object {
    fun fromString(value: String?): TrueSheetDismissThreshold =
      when (value) {
        "short" -> SHORT
        else -> HALF
      }
  }
}

class TrueSheetBottomSheetBehavior<V : View> : BottomSheetBehavior<V>() {
  var scrollingExpandsSheet: Boolean = true
  var dismissThreshold: TrueSheetDismissThreshold = TrueSheetDismissThreshold.HALF
  var lowestSheetTop: (() -> Int)? = null

  // Each detent's sheet top, with the state that settles the sheet there.
  var detentStops: (() -> List<Pair<Int, Int>>)? = null

  private var nestedDragged = false
  private var nestedReleaseVelocity = 0f
  private var touchPointerId = MotionEvent.INVALID_POINTER_ID
  private var trackedEventTime = -1L
  private var trackedAction = -1
  private var velocityTracker: VelocityTracker? = null

  init {
    // Material hides once the release point, projected by velocity * friction, passes half
    // the lowest detent. A higher friction lets short flicks dismiss, closer to iOS sheets.
    hideFriction = HIDE_FRICTION
  }

  // Material's first layout registers an IME callback that rides the sheet's translationY
  // with the keyboard. TrueSheet positions sheets for the keyboard itself, and the callback
  // overwrites a parent's stack translation when the keyboard rises mid-translation.
  override fun onLayoutChild(parent: CoordinatorLayout, child: V, layoutDirection: Int): Boolean {
    val handled = super.onLayoutChild(parent, child, layoutDirection)
    ViewCompat.setWindowInsetsAnimationCallback(child, null)
    return handled
  }

  private fun releaseState(child: V, dragged: Boolean, velocityY: Float): Int? {
    if (!isDraggable || !dragged) return null
    return shortReleaseState(child, velocityY) ?: flungState(child, velocityY)
  }

  // With the short threshold, settle at or below the lowest detent like
  // Compose Material3's sheet instead of Material's half-height rule.
  private fun shortReleaseState(child: V, velocityY: Float): Int? {
    if (dismissThreshold != TrueSheetDismissThreshold.SHORT) return null
    val lowestTop = lowestSheetTop?.invoke() ?: return null
    if (child.top < lowestTop) return null
    val hides = if (abs(velocityY) > FLING_VELOCITY_DP.dpToPx()) {
      velocityY > 0
    } else {
      child.top - lowestTop > DISMISS_DISTANCE_DP.dpToPx()
    }
    return if (hides && isHideable) STATE_HIDDEN else STATE_COLLAPSED
  }

  // A fling settles at the next detent the way it goes, like Compose Material3's sheet. Material
  // settles a downward fling at whichever of its half and collapsed stops is nearer, and with two
  // detents its half stop is the top one, so a fling down from there would settle back unless
  // released past halfway.
  private fun flungState(child: V, velocityY: Float): Int? {
    if (abs(velocityY) <= FLING_VELOCITY_DP.dpToPx()) return null
    val stops = detentStops?.invoke() ?: return null
    val next = if (velocityY > 0) {
      stops.filter { it.first > child.top }.minByOrNull { it.first }
    } else {
      stops.filter { it.first < child.top }.maxByOrNull { it.first }
    }
    return next?.second
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
    if (type == ViewCompat.TYPE_TOUCH) {
      if (state == STATE_EXPANDED) {
        nestedDragged = false
      } else if (consumed[1] != 0) {
        nestedDragged = true
      }
    }
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

  private fun trackTouch(event: MotionEvent) {
    if (event.eventTime == trackedEventTime && event.actionMasked == trackedAction) return
    trackedEventTime = event.eventTime
    trackedAction = event.actionMasked
    if (event.actionMasked == MotionEvent.ACTION_DOWN) {
      velocityTracker?.recycle()
      velocityTracker = VelocityTracker.obtain()
      touchPointerId = event.getPointerId(0)
    }
    velocityTracker?.addMovement(event)
  }

  override fun onInterceptTouchEvent(parent: CoordinatorLayout, child: V, event: MotionEvent): Boolean {
    trackTouch(event)
    return super.onInterceptTouchEvent(parent, child, event)
  }

  override fun onTouchEvent(parent: CoordinatorLayout, child: V, event: MotionEvent): Boolean {
    trackTouch(event)
    val wasDragging = state == STATE_DRAGGING
    val handled = super.onTouchEvent(parent, child, event)
    if (event.actionMasked == MotionEvent.ACTION_UP) {
      val velocityY = velocityTracker?.run {
        computeCurrentVelocity(1000)
        getYVelocity(touchPointerId)
      } ?: 0f
      releaseState(child, wasDragging, velocityY)?.let { state = it }
    }
    if (event.actionMasked == MotionEvent.ACTION_UP || event.actionMasked == MotionEvent.ACTION_CANCEL) {
      velocityTracker?.recycle()
      velocityTracker = null
    }
    return handled
  }

  companion object {
    private const val HIDE_FRICTION = 0.3f

    // Compose Material3 SheetState's velocity and positional thresholds
    private const val FLING_VELOCITY_DP = 125f
    private const val DISMISS_DISTANCE_DP = 56f
  }
}
