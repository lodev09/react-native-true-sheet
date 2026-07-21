package com.lodev09.truesheet

import android.annotation.SuppressLint
import android.view.MotionEvent
import android.view.View
import android.view.ViewParent
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.uimanager.JSPointerDispatcher
import com.facebook.react.uimanager.JSTouchDispatcher
import com.facebook.react.uimanager.PixelUtil.pxToDp
import com.facebook.react.uimanager.PointerEvents
import com.facebook.react.uimanager.RootView
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.views.view.ReactViewGroup
import com.lodev09.truesheet.core.TrueSheetCoordinatorLayout

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
  var stateWrapper: StateWrapper? = null

  private val eventDispatcher: EventDispatcher?
    get() = delegate?.eventDispatcher

  private var lastWidth = 0
  private var lastHeight = 0
  private var bottomInset = 0

  /**
   * Skips the inset while the keyboard is open — an absolute footer rises
   * above the keyboard, so the inset would leave a gap.
   */
  var keyboardVisible = false
    set(value) {
      if (field == value) return
      field = value
      pushBottomInsetState()
    }

  /**
   * Height the footer occupies above the keyboard — its layout height minus
   * the safe-area inset it drops while the keyboard is open.
   */
  val keyboardOcclusionHeight: Int
    get() = maxOf(0, height - if (keyboardVisible) 0 else bottomInset)

  /**
   * Tells the shadow node to pad the footer's bottom edge with the sheet's
   * bottom safe-area inset — the footer owns the sheet's bottom edge, so it
   * absorbs the inset and its background fills it.
   */
  fun setBottomInset(inset: Int) {
    if (bottomInset == inset) return
    bottomInset = inset
    pushBottomInsetState()
  }

  private fun pushBottomInsetState() {
    val sw = stateWrapper ?: return
    val insetDp = (if (keyboardVisible) 0 else bottomInset).toFloat().pxToDp()

    // Synchronous update — the footer must be padded before detents are
    // configured, otherwise the auto detent is set up an inset short
    if (TrueSheetStateUpdater.updateFooterState(sw, insetDp)) return

    // Fallback: async state update
    val newState = WritableNativeMap()
    newState.putDouble("bottomInset", insetDp.toDouble())
    sw.updateState(newState)
  }

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
    findCoordinatorLayout()?.childDidClaimNativeGesture()
    eventDispatcher?.let { dispatcher ->
      jsTouchDispatcher.onChildStartedNativeGesture(ev, dispatcher)
      jsPointerDispatcher?.onChildStartedNativeGesture(childView, ev, dispatcher)
    }
  }

  private fun findCoordinatorLayout(): TrueSheetCoordinatorLayout? {
    var current: ViewParent? = parent
    while (current != null && current !is TrueSheetCoordinatorLayout) {
      current = current.parent
    }
    return current as? TrueSheetCoordinatorLayout
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
