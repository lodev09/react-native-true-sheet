package com.lodev09.truesheet

import android.content.Context
import android.view.MotionEvent
import android.view.View
import com.facebook.react.bridge.GuardedRunnable
import com.facebook.react.config.ReactFeatureFlags
import com.facebook.react.uimanager.JSPointerDispatcher
import com.facebook.react.uimanager.JSTouchDispatcher
import com.facebook.react.uimanager.RootView
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerModule
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.views.view.ReactViewGroup

/**
 * TrueSheetRootViewGroup is the ViewGroup which contains all the children of a Modal. It gets all
 * child information forwarded from ReactModalHostView and uses that to create children. It is
 * also responsible for acting as a RootView and handling touch events. It does this the same way
 * as ReactRootView.
 *
 *
 * To get layout to work properly, we need to layout all the elements within the Modal as if
 * they can fill the entire window. To do that, we need to explicitly set the styleWidth and
 * styleHeight on the LayoutShadowNode to be the window size. This is done through the
 * UIManagerModule, and will then cause the children to layout as if they can fill the window.
 */
internal class TrueSheetRootViewGroup(context: Context?) : ReactViewGroup(context),
  RootView {
  private var hasAdjustedSize = false
  private var viewWidth = 0
  private var viewHeight = 0
  private var mEventDispatcher: EventDispatcher? = null

  private val mJSTouchDispatcher = JSTouchDispatcher(this)

  private var mJSPointerDispatcher: JSPointerDispatcher? = null

  init {
    if (ReactFeatureFlags.dispatchPointerEvents) {
      mJSPointerDispatcher = JSPointerDispatcher(this)
    }
  }

  fun setEventDispatcher(eventDispatcher: EventDispatcher) {
    mEventDispatcher = eventDispatcher
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)
    viewWidth = w
    viewHeight = h
    updateFirstChildView()
  }

  private fun updateFirstChildView() {
    if (childCount > 0) {
      hasAdjustedSize = false
      val viewTag = getChildAt(0).id
      reactContext.runOnNativeModulesQueueThread(
        object : GuardedRunnable(reactContext) {
          override fun runGuarded() {
            val uiManager: UIManagerModule = reactContext
              .reactApplicationContext
              .getNativeModule(UIManagerModule::class.java) ?: return
            uiManager.updateNodeSize(viewTag, viewWidth, viewHeight)
          }
        })
    } else {
      hasAdjustedSize = true
    }
  }

  override fun addView(child: View, index: Int, params: LayoutParams) {
    super.addView(child, index, params)
    if (hasAdjustedSize) {
      updateFirstChildView()
    }
  }

  override fun handleException(t: Throwable) {
    reactContext.reactApplicationContext.handleException(RuntimeException(t))
  }

  private val reactContext: ThemedReactContext
    get() = context as ThemedReactContext

  override fun onInterceptTouchEvent(event: MotionEvent): Boolean {
    mJSTouchDispatcher.handleTouchEvent(event, mEventDispatcher)
    mJSPointerDispatcher?.handleMotionEvent(event, mEventDispatcher, true)
    return super.onInterceptTouchEvent(event)
  }

  override fun onTouchEvent(event: MotionEvent): Boolean {
    mJSTouchDispatcher.handleTouchEvent(event, mEventDispatcher)
    mJSPointerDispatcher?.handleMotionEvent(event, mEventDispatcher, false)
    super.onTouchEvent(event)

    // In case when there is no children interested in handling touch event, we return true from
    // the root view in order to receive subsequent events related to that gesture
    return true
  }

  override fun onInterceptHoverEvent(event: MotionEvent): Boolean {
    mJSPointerDispatcher?.handleMotionEvent(event, mEventDispatcher, true)
    return super.onHoverEvent(event)
  }

  override fun onHoverEvent(event: MotionEvent): Boolean {
    mJSPointerDispatcher?.handleMotionEvent(event, mEventDispatcher, false)
    return super.onHoverEvent(event)
  }

  override fun onChildStartedNativeGesture(childView: View, ev: MotionEvent) {
    mJSTouchDispatcher.onChildStartedNativeGesture(ev, mEventDispatcher)
    mJSPointerDispatcher?.onChildStartedNativeGesture(childView, ev, mEventDispatcher)
  }

  override fun onChildEndedNativeGesture(childView: View, ev: MotionEvent) {
    mJSTouchDispatcher.onChildEndedNativeGesture(ev, mEventDispatcher)
    mJSPointerDispatcher?.onChildEndedNativeGesture()
  }

  override fun requestDisallowInterceptTouchEvent(disallowIntercept: Boolean) {
    // No-op - override in order to still receive events to onInterceptTouchEvent
    // even when some other view disallow that
  }
}
