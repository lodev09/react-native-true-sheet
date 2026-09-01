package com.lodev09.truesheet.core

import android.annotation.SuppressLint
import android.view.MotionEvent
import android.view.View
import android.widget.FrameLayout
import com.facebook.react.uimanager.JSPointerDispatcher
import com.facebook.react.uimanager.JSTouchDispatcher
import com.facebook.react.uimanager.RootView
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.TouchTargetHelper
import com.facebook.react.uimanager.events.EventDispatcher
import com.lodev09.truesheet.utils.TouchEventDeduper

interface TrueSheetOverlayRootViewDelegate {
  val eventDispatcher: EventDispatcher?
  fun overlayRootViewDidChangeSize(width: Int, height: Int)
}

/**
 * Window-level view hosting an overlay's children, attached to the activity's
 * content view above the sheet coordinators.
 *
 * Implements RootView to dispatch touches to JS. Touches that miss every child
 * fall through to the views beneath.
 */
@SuppressLint("ViewConstructor")
class TrueSheetOverlayRootView(private val reactContext: ThemedReactContext) :
  FrameLayout(reactContext),
  RootView {

  var delegate: TrueSheetOverlayRootViewDelegate? = null

  private val eventDispatcher: EventDispatcher?
    get() = delegate?.eventDispatcher

  private val jsTouchDispatcher = JSTouchDispatcher(this)
  private val jsPointerDispatcher = JSPointerDispatcher(this)
  private val touchDeduper = TouchEventDeduper()

  // Whether the current touch stream landed on a child
  private var isHandlingStream = false

  init {
    layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)

    // Draws and receives touches above the sheet coordinators regardless of add order
    translationZ = OVERLAY_Z
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)
    delegate?.overlayRootViewDidChangeSize(w, h)
  }

  override fun dispatchTouchEvent(ev: MotionEvent): Boolean {
    if (ev.actionMasked == MotionEvent.ACTION_DOWN) {
      isHandlingStream = TouchTargetHelper.findTargetTagForTouch(ev.x, ev.y, this) != id
    }
    if (!isHandlingStream) return false
    return super.dispatchTouchEvent(ev)
  }

  // ==================== RootView Implementation ====================

  override fun onInterceptTouchEvent(event: MotionEvent): Boolean {
    eventDispatcher?.let { dispatcher ->
      if (touchDeduper.shouldDispatch(event)) {
        jsTouchDispatcher.handleTouchEvent(event, dispatcher, reactContext)
      }
      jsPointerDispatcher.handleMotionEvent(event, dispatcher, true)
    }
    return super.onInterceptTouchEvent(event)
  }

  override fun requestDisallowInterceptTouchEvent(disallowIntercept: Boolean) {
    // Mirrors ReactSurfaceView: keep receiving onInterceptTouchEvent so
    // jsTouchDispatcher sees the gesture end, but forward the request up the tree.
    parent?.requestDisallowInterceptTouchEvent(disallowIntercept)
  }

  @SuppressLint("ClickableViewAccessibility")
  override fun onTouchEvent(event: MotionEvent): Boolean {
    eventDispatcher?.let { dispatcher ->
      if (touchDeduper.shouldDispatch(event)) {
        jsTouchDispatcher.handleTouchEvent(event, dispatcher, reactContext)
      }
      jsPointerDispatcher.handleMotionEvent(event, dispatcher, false)
    }
    super.onTouchEvent(event)
    return true
  }

  override fun onInterceptHoverEvent(event: MotionEvent): Boolean {
    eventDispatcher?.let { jsPointerDispatcher.handleMotionEvent(event, it, true) }
    return super.onHoverEvent(event)
  }

  override fun onHoverEvent(event: MotionEvent): Boolean {
    eventDispatcher?.let { jsPointerDispatcher.handleMotionEvent(event, it, false) }
    return super.onHoverEvent(event)
  }

  override fun onChildStartedNativeGesture(childView: View?, ev: MotionEvent) {
    eventDispatcher?.let { dispatcher ->
      jsTouchDispatcher.onChildStartedNativeGesture(ev, dispatcher)
      jsPointerDispatcher.onChildStartedNativeGesture(childView, ev, dispatcher)
    }
  }

  override fun onChildEndedNativeGesture(childView: View, ev: MotionEvent) {
    eventDispatcher?.let { jsTouchDispatcher.onChildEndedNativeGesture(ev, it) }
    jsPointerDispatcher.onChildEndedNativeGesture()
  }

  override fun handleException(t: Throwable) {
    reactContext.reactApplicationContext.handleException(RuntimeException(t))
  }

  companion object {
    private const val OVERLAY_Z = 1000f
  }
}
