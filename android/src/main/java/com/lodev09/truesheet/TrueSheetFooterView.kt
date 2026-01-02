package com.lodev09.truesheet

import android.annotation.SuppressLint
import android.view.MotionEvent
import android.view.View
import com.facebook.react.uimanager.JSPointerDispatcher
import com.facebook.react.uimanager.JSTouchDispatcher
import com.facebook.react.uimanager.PointerEvents
import com.facebook.react.uimanager.RootView
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.views.view.ReactViewGroup

/**
 * Delegate interface for footer view size changes and event dispatching
 */
interface TrueSheetFooterViewDelegate {
  fun footerViewDidChangeSize(width: Int, height: Int)
  val eventDispatcher: EventDispatcher?
}

/**
 * Footer view that holds the footer content
 * This is the second child of TrueSheetContainerView
 * Positioned absolutely at the bottom of the sheet
 *
 * Implements RootView to handle touch events when positioned outside parent bounds.
 */
@SuppressLint("ViewConstructor")
class TrueSheetFooterView(private val reactContext: ThemedReactContext) :
  ReactViewGroup(reactContext),
  RootView {

  var delegate: TrueSheetFooterViewDelegate? = null

  private val eventDispatcher: EventDispatcher?
    get() = delegate?.eventDispatcher

  private var lastWidth = 0
  private var lastHeight = 0

  private val jsTouchDispatcher = JSTouchDispatcher(this)
  private var jsPointerDispatcher: JSPointerDispatcher? = null

  init {
    jsPointerDispatcher = JSPointerDispatcher(this)
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)

    if (w != lastWidth || h != lastHeight) {
      lastWidth = w
      lastHeight = h
      delegate?.footerViewDidChangeSize(w, h)
    }
  }

  // ==================== RootView Implementation ====================

  override fun onInterceptTouchEvent(event: MotionEvent): Boolean {
    eventDispatcher?.let { dispatcher ->
      jsTouchDispatcher.handleTouchEvent(event, dispatcher, reactContext)
      jsPointerDispatcher?.handleMotionEvent(event, dispatcher, true)
    }
    return super.onInterceptTouchEvent(event)
  }

  override fun onTouchEvent(event: MotionEvent): Boolean {
    if (pointerEvents == PointerEvents.NONE || pointerEvents == PointerEvents.BOX_NONE) {
      return false
    }

    eventDispatcher?.let { dispatcher ->
      jsTouchDispatcher.handleTouchEvent(event, dispatcher, reactContext)
      jsPointerDispatcher?.handleMotionEvent(event, dispatcher, false)
    }
    super.onTouchEvent(event)
    return true
  }

  override fun onInterceptHoverEvent(event: MotionEvent): Boolean {
    eventDispatcher?.let { jsPointerDispatcher?.handleMotionEvent(event, it, true) }
    return super.onHoverEvent(event)
  }

  override fun onHoverEvent(event: MotionEvent): Boolean {
    eventDispatcher?.let { jsPointerDispatcher?.handleMotionEvent(event, it, false) }
    return super.onHoverEvent(event)
  }

  override fun onChildStartedNativeGesture(childView: View?, ev: MotionEvent) {
    eventDispatcher?.let { dispatcher ->
      jsTouchDispatcher.onChildStartedNativeGesture(ev, dispatcher)
      jsPointerDispatcher?.onChildStartedNativeGesture(childView, ev, dispatcher)
    }
  }

  override fun onChildEndedNativeGesture(childView: View, ev: MotionEvent) {
    eventDispatcher?.let { jsTouchDispatcher.onChildEndedNativeGesture(ev, it) }
    jsPointerDispatcher?.onChildEndedNativeGesture()
  }

  override fun handleException(t: Throwable) {
    reactContext.reactApplicationContext.handleException(RuntimeException(t))
  }

  companion object {
    const val TAG_NAME = "TrueSheet"
  }
}
