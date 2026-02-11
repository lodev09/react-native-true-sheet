package com.lodev09.truesheet.core

import android.annotation.SuppressLint
import android.content.Context
import android.content.res.Configuration
import android.view.MotionEvent
import android.view.ViewConfiguration
import android.widget.ScrollView
import androidx.coordinatorlayout.widget.CoordinatorLayout
import com.facebook.react.uimanager.PointerEvents
import com.facebook.react.uimanager.ReactPointerEventsView

interface TrueSheetCoordinatorLayoutDelegate {
  fun coordinatorLayoutDidLayout(changed: Boolean)
  fun coordinatorLayoutDidChangeConfiguration()
  fun findScrollView(): ScrollView?
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
  var scrollable: Boolean = false

  private val touchSlop: Int = ViewConfiguration.get(context).scaledTouchSlop
  private var dragging = false
  private var initialY = 0f
  private var activePointerId = 0

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

  /**
   * Clears stale `nestedScrollingChildRef` from BottomSheetBehavior.
   *
   * `BottomSheetBehavior.onLayoutChild` calls `findScrollingChild()` which traverses the
   * entire sheet subtree. When a child sheet with a ScrollView is dismissed, the ScrollView
   * returns to this sheet's view hierarchy. `onLayoutChild` may then capture a ref to that
   * ScrollView even though it doesn't belong to this sheet, blocking drag interactions.
   */
  private fun clearStaleNestedScrollingChildRef() {
    val sheet = getChildAt(0) ?: return
    val params = sheet.layoutParams as? LayoutParams ?: return
    val behavior = params.behavior ?: return
    try {
      val field = behavior.javaClass.getDeclaredField("nestedScrollingChildRef")
      field.isAccessible = true
      @Suppress("UNCHECKED_CAST")
      val ref = field.get(behavior) as? java.lang.ref.WeakReference<android.view.View> ?: return
      val view = ref.get() ?: return
      if (!view.isAttachedToWindow) {
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
    if (!scrollable) {
      if (ev.actionMasked == MotionEvent.ACTION_DOWN) {
        clearStaleNestedScrollingChildRef()
      }
      return super.onInterceptTouchEvent(ev)
    }

    val scrollView = delegate?.findScrollView()
    val cannotScroll = scrollView != null &&
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
