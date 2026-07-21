package com.lodev09.truesheet.core

import android.annotation.SuppressLint
import android.content.Context
import android.content.res.Configuration
import android.view.MotionEvent
import android.view.View
import android.view.ViewConfiguration
import android.view.ViewGroup
import android.widget.EditText
import androidx.coordinatorlayout.widget.CoordinatorLayout
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.facebook.react.uimanager.PointerEvents
import com.facebook.react.uimanager.ReactPointerEventsView
import com.facebook.react.uimanager.TouchTargetHelper
import com.lodev09.truesheet.utils.isDescendantOf

interface TrueSheetCoordinatorLayoutDelegate {
  fun coordinatorLayoutDidLayout(changed: Boolean)
  fun coordinatorLayoutDidChangeConfiguration()
  fun findScrollView(): ViewGroup?
  fun findSheetView(): TrueSheetBottomSheetView?
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

  // Horizontal-dominance tracking. iOS lets horizontal child gestures win over
  // the sheet's vertical pan; we mirror that by locking out BottomSheetBehavior
  // interception once the first significant movement of a stream is horizontal.
  private var streamInitialX = 0f
  private var streamInitialY = 0f
  private var streamHorizontalLocked = false
  private var streamDirectionDecided = false

  // Native-gesture-claim tracking. RNGH handlers activate past BottomSheetBehavior's
  // drag slop and never call requestDisallowInterceptTouchEvent, so the sheet would
  // steal vertical gestures (e.g. a vertical pan) before they can activate. While the
  // touch is inside a descendant GestureHandlerRootView we hold off interception within
  // a grace distance; once a child claims the gesture (relayed from the RootView impls
  // via childDidClaimNativeGesture) we yield the rest of the stream, mirroring iOS.
  private var streamHasGestureRoot = false
  private var streamGestureClaimed = false

  // Whether the sheet owns vertical drags for this stream: the touch target is inside
  // the sheet but outside the pinned scrollable (e.g. a header overlaying it), with
  // nothing vertically scrollable along its chain. Such targets consume the stream
  // natively (no nested scroll), and BottomSheetBehavior won't intercept because the
  // scrollable's bounds still contain the point (touchingScrollingChild) — intercept
  // manually.
  private var streamSheetDraggable = false
  private var streamDraggableEditText = false

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

  override fun requestDisallowInterceptTouchEvent(disallowIntercept: Boolean) {
    // RN's ReactEditText fires this(true) on ACTION_DOWN, killing sheet drag over an input.
    // Swallow only that case — nothing between the touched EditText and the sheet scrolls
    // (an overflowing multiline EditText or an input inside a scrollable that can actually
    // scroll still scrolls). Other children (maps, sliders, scrollables) keep the standard
    // disallow contract.
    if (disallowIntercept && streamDraggableEditText) return
    super.requestDisallowInterceptTouchEvent(disallowIntercept)
  }

  /**
   * Resolves the stream's touch target (respecting zIndex and pointerEvents) and
   * decides whether the sheet may drag from it — inside the sheet, outside the pinned
   * scrollable, and nothing along the target's chain scrolls vertically.
   */
  private fun updateStreamTargetFlags(ev: MotionEvent) {
    streamSheetDraggable = false
    streamDraggableEditText = false

    val sheet = delegate?.findSheetView() ?: return
    val target = TouchTargetHelper.findTargetPathAndCoordinatesForTouch(ev.x, ev.y, this, FloatArray(2))
      .firstNotNullOfOrNull { it.getView() } ?: return
    if (target !== sheet && !target.isDescendantOf(sheet)) return

    // A pinned scrollable that can scroll (or hosts pull-to-refresh) owns its
    // touches — nested scrolling drags the sheet. When it can't scroll (e.g.
    // the sheet is fully expanded and the content fits) it eats the gesture
    // instead, so fall through and let the sheet drag from it — an EditText
    // target needs the disallow-intercept swallow or its stream dies.
    val scrollView = delegate?.findScrollView()
    if (scrollView != null && (target === scrollView || target.isDescendantOf(scrollView))) {
      val hasRefreshControl = scrollView.parent is SwipeRefreshLayout
      if (hasRefreshControl || scrollView.scrollY > 0 || scrollView.canScrollVertically(1)) return
    }

    var view: View? = target
    while (view != null && view !== this) {
      if (view.canScrollVertically(1) || view.canScrollVertically(-1)) return
      view = view.parent as? View
    }

    streamSheetDraggable = true
    streamDraggableEditText = target is EditText
  }

  private fun findDescendantViewAt(view: View, rawX: Int, rawY: Int, predicate: (View) -> Boolean): View? {
    val loc = IntArray(2)
    view.getLocationOnScreen(loc)
    if (rawX < loc[0] || rawX > loc[0] + view.width || rawY < loc[1] || rawY > loc[1] + view.height) return null
    if (predicate(view)) return view
    if (view is ViewGroup) {
      for (i in 0 until view.childCount) {
        findDescendantViewAt(view.getChildAt(i), rawX, rawY, predicate)?.let { return it }
      }
    }
    return null
  }

  /**
   * Called by descendant RootView implementations (controller, footer) when a child
   * starts a native gesture — e.g. an RNGH handler activated or a scrollable began
   * scrolling. Yields sheet interception for the rest of the touch stream.
   */
  fun childDidClaimNativeGesture() {
    streamGestureClaimed = true
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

      streamInitialX = ev.rawX
      streamInitialY = ev.rawY
      streamHorizontalLocked = false
      streamDirectionDecided = false
      streamGestureClaimed = false
      streamHasGestureRoot = findDescendantViewAt(this, ev.rawX.toInt(), ev.rawY.toInt()) {
        it.javaClass.name == GESTURE_HANDLER_ROOT_VIEW_CLASS
      } != null
      updateStreamTargetFlags(ev)
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

    if (streamGestureClaimed) {
      if (action == MotionEvent.ACTION_UP || action == MotionEvent.ACTION_CANCEL) {
        streamGestureClaimed = false
      }
      return false
    }

    // Hold off BottomSheetBehavior within the grace distance so a gesture handler
    // under the touch can activate and claim the stream first.
    if (streamHasGestureRoot &&
      action == MotionEvent.ACTION_MOVE &&
      kotlin.math.abs(ev.rawY - streamInitialY) < touchSlop * GESTURE_CLAIM_SLOP_FACTOR
    ) {
      return false
    }

    val scrollView = delegate?.findScrollView()
    val hasRefreshControl = scrollView?.parent is SwipeRefreshLayout
    val cannotScroll = scrollView != null &&
      !hasRefreshControl &&
      scrollView.scrollY == 0 &&
      !scrollView.canScrollVertically(1)

    if (cannotScroll || streamSheetDraggable) {
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

  companion object {
    private const val GESTURE_HANDLER_ROOT_VIEW_CLASS = "com.swmansion.gesturehandler.react.RNGestureHandlerRootView"
    private const val GESTURE_CLAIM_SLOP_FACTOR = 3
  }
}
