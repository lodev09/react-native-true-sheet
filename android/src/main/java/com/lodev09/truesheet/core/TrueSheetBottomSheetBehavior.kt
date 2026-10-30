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

  private var nestedDragged = false
  private var nestedReleaseVelocity = 0f
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

  private fun releaseState(child: V, dragged: Boolean, velocityX: Float, velocityY: Float): Int? {
    if (!isDraggable || !dragged) return null
    return shortReleaseState(child, velocityY) ?: flungState(child, velocityX, velocityY)
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
  // already does, except that it settles a downward fling between its half and collapsed stops
  // at the nearer one, so a fling down from the half stop (the top one with two detents) would
  // settle back unless released past halfway. Below the collapsed stop the dismiss threshold decides.
  private fun flungState(child: V, velocityX: Float, velocityY: Float): Int? {
    if (isFitToContents || velocityY <= FLING_VELOCITY_DP.dpToPx() || abs(velocityX) > velocityY) return null
    // Material's half and collapsed offsets, from the inputs it computes them with
    val parentHeight = (child.parent as View).height
    val halfTop = (parentHeight * (1 - halfExpandedRatio)).toInt()
    val collapsedTop = parentHeight - peekHeight
    val settlesBack = child.top >= halfTop && child.top - halfTop < collapsedTop - child.top
    return if (settlesBack) STATE_COLLAPSED else null
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
    if (releaseState(child, nestedDragged, 0f, nestedReleaseVelocity) != null) return true
    // Don't consume flings — let the ScrollView decelerate naturally
    if (!scrollingExpandsSheet) return false
    return super.onNestedPreFling(coordinatorLayout, child, target, velocityX, velocityY)
  }

  override fun onStopNestedScroll(coordinatorLayout: CoordinatorLayout, child: V, target: View, type: Int) {
    if (type == ViewCompat.TYPE_TOUCH) {
      releaseState(child, nestedDragged, 0f, nestedReleaseVelocity)?.let {
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
    // Material releases the sheet when its dragging pointer lifts, which isn't always the
    // first one down, and can lift before the others
    val lifted = event.actionMasked == MotionEvent.ACTION_UP || event.actionMasked == MotionEvent.ACTION_POINTER_UP
    if (lifted && wasDragging && state != STATE_DRAGGING) {
      val pointerId = event.getPointerId(event.actionIndex)
      velocityTracker?.computeCurrentVelocity(1000)
      val velocityX = velocityTracker?.getXVelocity(pointerId) ?: 0f
      val velocityY = velocityTracker?.getYVelocity(pointerId) ?: 0f
      releaseState(child, true, velocityX, velocityY)?.let { state = it }
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
