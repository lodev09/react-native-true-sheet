package com.lodev09.truesheet.core

import android.annotation.SuppressLint
import android.content.Context
import android.content.res.Configuration
import android.view.MotionEvent
import android.view.ViewConfiguration
import android.view.ViewGroup
import androidx.coordinatorlayout.widget.CoordinatorLayout
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.facebook.react.uimanager.PointerEvents
import com.facebook.react.uimanager.ReactPointerEventsView
import com.lodev09.truesheet.utils.isDescendantOf

interface TrueSheetCoordinatorLayoutDelegate {
  fun coordinatorLayoutDidLayout(changed: Boolean)
  fun coordinatorLayoutDidChangeConfiguration()
  fun findScrollView(): ViewGroup?
  fun findSheetView(): TrueSheetBottomSheetView?
  fun findFooterView(): android.view.View?
}

/**
 * Custom CoordinatorLayout that hosts the bottom sheet and dim view.
 * Implements ReactPointerEventsView to allow touch events to pass through
 * to underlying React Native views when appropriate.
 */
@SuppressLint("ViewConstructor")
class TrueSheetCoordinatorLayout(context: Context) :
  CoordinatorLayout(context),
  ReactPointerEventsView {

  var delegate: TrueSheetCoordinatorLayoutDelegate? = null

  private val touchSlop: Int = ViewConfiguration.get(context).scaledTouchSlop
  private var dragging = false
  private var initialY = 0f
  private var activePointerId = 0

  // True when the active touch stream began inside the footer. Latched on
  // ACTION_DOWN so we never let BottomSheetBehavior intercept events that
  // belong to the footer's own gesture handling.
  private var footerOwnsTouchStream = false

  // Horizontal-dominance tracking. iOS lets horizontal child gestures win over
  // the sheet's vertical pan; we mirror that by locking out BottomSheetBehavior
  // interception once the first significant movement of a stream is horizontal.
  private var streamInitialX = 0f
  private var streamInitialY = 0f
  private var streamHorizontalLocked = false
  private var streamDirectionDecided = false

  init {
    layoutParams = LayoutParams(
      LayoutParams.MATCH_PARENT,
      LayoutParams.MATCH_PARENT
    )

    clipChildren = false
    clipToPadding = false
  }

  override fun onLayout(
    changed: Boolean,
    l: Int,
    t: Int,
    r: Int,
    b: Int
  ) {
    super.onLayout(changed, l, t, r, b)
    delegate?.coordinatorLayoutDidLayout(changed)
  }

  override fun onConfigurationChanged(newConfig: Configuration?) {
    super.onConfigurationChanged(newConfig)
    delegate?.coordinatorLayoutDidChangeConfiguration()
  }

  override val pointerEvents: PointerEvents
    get() = PointerEvents.BOX_NONE

  private fun isPointInFooter(ev: MotionEvent, footer: android.view.View): Boolean {
    val loc = IntArray(2)
    footer.getLocationOnScreen(loc)
    val x = ev.rawX.toInt()
    val y = ev.rawY.toInt()
    return x >= loc[0] && x <= loc[0] + footer.width &&
      y >= loc[1] && y <= loc[1] + footer.height
  }

  /**
   * Clears stale `nestedScrollingChildRef` from BottomSheetBehavior.
   *
   * The cached `nestedScrollingChildRef` can become stale when a child sheet
   * with a ScrollView is dismissed and its ScrollView returns to this hierarchy.
   */
  private fun clearStaleNestedScrollingChildRef() {
    val sheet = delegate?.findSheetView() ?: return
    val behavior = sheet.behavior ?: return
    try {
      val field = behavior.javaClass.superclass.getDeclaredField("nestedScrollingChildRef")
      field.isAccessible = true
      @Suppress("UNCHECKED_CAST")
      val ref = field.get(behavior) as? java.lang.ref.WeakReference<android.view.View> ?: return
      val view = ref.get()
      if (view == null || !view.isDescendantOf(sheet)) {
        ref.clear()
      }
    } catch (_: Exception) {}
  }

  /**
   * Intercepts touch events for ScrollViews that can't scroll (content < viewport),
   * allowing the sheet to be dragged in these cases.
   *
   * TODO: Remove this workaround once NestedScrollView is merged into react-native core.
   * See: https://github.com/facebook/react-native/pull/44099
   */
  override fun onInterceptTouchEvent(ev: MotionEvent): Boolean {
    val action = ev.actionMasked

    if (action == MotionEvent.ACTION_DOWN) {
      clearStaleNestedScrollingChildRef()

      // Latch footer ownership at the very top of the dispatch so
      // BottomSheetBehavior never gets to set `ignoreEvents = false` for a
      // touch that belongs to the footer.
      val footer = delegate?.findFooterView()
      footerOwnsTouchStream = footer != null && footer.isShown && isPointInFooter(ev, footer)

      streamInitialX = ev.rawX
      streamInitialY = ev.rawY
      streamHorizontalLocked = false
      streamDirectionDecided = false
    }

    if (footerOwnsTouchStream) {
      if (action == MotionEvent.ACTION_UP || action == MotionEvent.ACTION_CANCEL) {
        footerOwnsTouchStream = false
      }
      return false
    }

    // Decide gesture direction on first significant movement of the stream.
    // If horizontal wins, lock out BottomSheetBehavior for the rest of the stream
    // so child handlers (carousels, swipe buttons, etc.) can claim the touch.
    if (!streamDirectionDecided && action == MotionEvent.ACTION_MOVE) {
      val dx = kotlin.math.abs(ev.rawX - streamInitialX)
      val dy = kotlin.math.abs(ev.rawY - streamInitialY)
      if (dx > touchSlop || dy > touchSlop) {
        streamDirectionDecided = true
        streamHorizontalLocked = dx > dy
      }
    }

    if (streamHorizontalLocked) {
      if (action == MotionEvent.ACTION_UP || action == MotionEvent.ACTION_CANCEL) {
        streamHorizontalLocked = false
        streamDirectionDecided = false
      }
      return false
    }

    val scrollView = delegate?.findScrollView()
    val hasRefreshControl = scrollView?.parent is SwipeRefreshLayout
    val cannotScroll = scrollView != null &&
      !hasRefreshControl &&
      scrollView.scrollY == 0 &&
      !scrollView.canScrollVertically(1)

    if (cannotScroll) {
      when (ev.action and MotionEvent.ACTION_MASK) {
        MotionEvent.ACTION_DOWN -> {
          dragging = false
          initialY = ev.y
          activePointerId = ev.getPointerId(0)
        }

        MotionEvent.ACTION_MOVE -> {
          val pointerIndex = ev.findPointerIndex(activePointerId)
          if (pointerIndex != -1) {
            val y = ev.getY(pointerIndex)
            val deltaY = initialY - y
            if (kotlin.math.abs(deltaY) > touchSlop) {
              dragging = true
              parent?.requestDisallowInterceptTouchEvent(true)
            }
          }
        }

        MotionEvent.ACTION_UP,
        MotionEvent.ACTION_CANCEL -> {
          dragging = false
        }
      }
    } else {
      dragging = false
    }

    return dragging || super.onInterceptTouchEvent(ev)
  }

  @SuppressLint("ClickableViewAccessibility")
  override fun onTouchEvent(ev: MotionEvent): Boolean {
    if (dragging) {
      when (ev.action and MotionEvent.ACTION_MASK) {
        MotionEvent.ACTION_UP,
        MotionEvent.ACTION_CANCEL -> {
          dragging = false
        }
      }
      // Let parent CoordinatorLayout handle the touch for BottomSheetBehavior
      return super.onTouchEvent(ev)
    }
    return super.onTouchEvent(ev)
  }
}
