package com.lodev09.truesheet

import android.annotation.SuppressLint
import android.view.MotionEvent
import android.view.View
import android.view.accessibility.AccessibilityNodeInfo
import com.facebook.react.R
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.config.ReactFeatureFlags
import com.facebook.react.uimanager.JSPointerDispatcher
import com.facebook.react.uimanager.JSTouchDispatcher
import com.facebook.react.uimanager.PixelUtil.pxToDp
import com.facebook.react.uimanager.RootView
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.views.view.ReactViewGroup

/**
 * Delegate interface for TrueSheetRootView lifecycle and state changes
 */
interface TrueSheetRootViewDelegate {
  /**
   * Called when the root view's size changes
   * @param width New width in pixels
   * @param height New height in pixels
   */
  fun onRootViewSizeChanged(width: Int, height: Int)
}

/**
 * TrueSheetRootView is the ViewGroup which contains all the children of a TrueSheet. It gets all
 * child information forwarded from TrueSheetView and uses that to create children. It is
 * also responsible for acting as a RootView and handling touch events. It does this the same way
 * as DialogRootViewGroup in React Native Modal.
 *
 * This implementation is Fabric-only and does not support the legacy architecture.
 */
@SuppressLint("ViewConstructor")
class TrueSheetRootView(private val reactContext: ThemedReactContext) :
  ReactViewGroup(reactContext),
  RootView {

  internal var eventDispatcher: EventDispatcher? = null
  internal var rootViewDelegate: TrueSheetRootViewDelegate? = null

  private val jSTouchDispatcher = JSTouchDispatcher(this)
  private var jSPointerDispatcher: JSPointerDispatcher? = null

  init {
    if (ReactFeatureFlags.dispatchPointerEvents) {
      jSPointerDispatcher = JSPointerDispatcher(this)
    }
  }

  override fun onInitializeAccessibilityNodeInfo(info: AccessibilityNodeInfo) {
    super.onInitializeAccessibilityNodeInfo(info)

    val testId = getTag(R.id.react_test_id) as String?
    if (testId != null) {
      info.viewIdResourceName = testId
    }
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)
    android.util.Log.d(TAG_NAME, "onSizeChanged width: ${w.toFloat().pxToDp()}, height: ${h.toFloat().pxToDp()}")

    // Notify delegate about size change
    rootViewDelegate?.onRootViewSizeChanged(w, h)
  }

  override fun handleException(t: Throwable) {
    reactContext.reactApplicationContext.handleException(RuntimeException(t))
  }

  override fun onInterceptTouchEvent(event: MotionEvent): Boolean {
    eventDispatcher?.let { eventDispatcher ->
      jSTouchDispatcher.handleTouchEvent(event, eventDispatcher, reactContext)
      jSPointerDispatcher?.handleMotionEvent(event, eventDispatcher, true)
    }
    return super.onInterceptTouchEvent(event)
  }

  @SuppressLint("ClickableViewAccessibility")
  override fun onTouchEvent(event: MotionEvent): Boolean {
    eventDispatcher?.let { eventDispatcher ->
      jSTouchDispatcher.handleTouchEvent(event, eventDispatcher, reactContext)
      jSPointerDispatcher?.handleMotionEvent(event, eventDispatcher, false)
    }
    super.onTouchEvent(event)
    // In case when there is no children interested in handling touch event, we return true from
    // the root view in order to receive subsequent events related to that gesture
    return true
  }

  override fun onInterceptHoverEvent(event: MotionEvent): Boolean {
    eventDispatcher?.let { jSPointerDispatcher?.handleMotionEvent(event, it, true) }
    return super.onHoverEvent(event)
  }

  override fun onHoverEvent(event: MotionEvent): Boolean {
    eventDispatcher?.let { jSPointerDispatcher?.handleMotionEvent(event, it, false) }
    return super.onHoverEvent(event)
  }

  @OptIn(UnstableReactNativeAPI::class)
  @Suppress("DEPRECATION")
  override fun onChildStartedNativeGesture(childView: View?, ev: MotionEvent) {
    eventDispatcher?.let { eventDispatcher ->
      jSTouchDispatcher.onChildStartedNativeGesture(ev, eventDispatcher, reactContext)
      jSPointerDispatcher?.onChildStartedNativeGesture(childView, ev, eventDispatcher)
    }
  }

  override fun onChildEndedNativeGesture(childView: View, ev: MotionEvent) {
    eventDispatcher?.let { jSTouchDispatcher.onChildEndedNativeGesture(ev, it) }
    jSPointerDispatcher?.onChildEndedNativeGesture()
  }

  override fun requestDisallowInterceptTouchEvent(disallowIntercept: Boolean) {
    // No-op - override in order to still receive events to onInterceptTouchEvent
    // even when some other view disallow that
  }

  companion object {
    const val TAG_NAME = "TrueSheet"
  }
}
