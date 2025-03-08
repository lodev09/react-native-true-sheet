package com.lodev09.truesheet.core

import android.annotation.SuppressLint
import android.content.Context
import android.view.MotionEvent
import android.view.View
import com.facebook.react.config.ReactFeatureFlags
import com.facebook.react.uimanager.JSPointerDispatcher
import com.facebook.react.uimanager.JSTouchDispatcher
import com.facebook.react.uimanager.RootView
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.views.view.ReactViewGroup

/**
 * RootSheetView is the ViewGroup which contains all the children of a Modal. It gets all
 * child information forwarded from TrueSheetView and uses that to create children. It is
 * also responsible for acting as a RootView and handling touch events. It does this the same way
 * as ReactRootView.
 *
 *
 * To get layout to work properly, we need to layout all the elements within the Modal as if
 * they can fill the entire window. To do that, we need to explicitly set the styleWidth and
 * styleHeight on the LayoutShadowNode to be the window size. This is done through the
 * UIManagerModule, and will then cause the children to layout as if they can fill the window.
 */
class RootSheetView(private val context: Context?) :
  ReactViewGroup(context),
  RootView {
  private var viewWidth = 0
  private var viewHeight = 0

  private val jSTouchDispatcher = JSTouchDispatcher(this)
  private var jSPointerDispatcher: JSPointerDispatcher? = null

  var sizeChangeListener: ((w: Int, h: Int) -> Unit)? = null
  var eventDispatcher: EventDispatcher? = null

  private val reactContext: ThemedReactContext
    get() = context as ThemedReactContext

  init {
    if (ReactFeatureFlags.dispatchPointerEvents) {
      jSPointerDispatcher = JSPointerDispatcher(this)
    }
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)

    viewWidth = w
    viewHeight = h

    sizeChangeListener?.let { it(viewWidth, viewHeight) }
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

  override fun onChildStartedNativeGesture(childView: View?, ev: MotionEvent) {
    eventDispatcher?.let { eventDispatcher ->
      jSTouchDispatcher.onChildStartedNativeGesture(ev, eventDispatcher)
      jSPointerDispatcher?.onChildStartedNativeGesture(childView, ev, eventDispatcher)
    }
  }

  override fun onChildEndedNativeGesture(childView: View, ev: MotionEvent) {
    eventDispatcher?.let { jSTouchDispatcher.onChildEndedNativeGesture(ev, it) }
    jSPointerDispatcher?.onChildEndedNativeGesture()
  }
}
