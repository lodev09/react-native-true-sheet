package com.lodev09.truesheet

import android.annotation.SuppressLint
import android.view.View
import android.view.ViewGroup
import android.view.accessibility.AccessibilityEvent
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.views.view.ReactViewGroup
import com.lodev09.truesheet.core.TrueSheetOverlayRootView
import com.lodev09.truesheet.core.TrueSheetOverlayRootViewDelegate
import com.lodev09.truesheet.utils.findRootContainerView

/**
 * Hidden host that renders its children in a root view attached to the
 * activity's content view, above every presented sheet.
 */
@SuppressLint("ViewConstructor")
class TrueSheetOverlayView(private val reactContext: ThemedReactContext) :
  ReactViewGroup(reactContext),
  TrueSheetOverlayRootViewDelegate {

  private val rootView = TrueSheetOverlayRootView(reactContext).apply {
    delegate = this@TrueSheetOverlayView
  }

  private var rootContainerView: ViewGroup? = null

  override var eventDispatcher: EventDispatcher? = null

  private var lastWidth = 0
  private var lastHeight = 0

  // Fabric hands back a new StateWrapper on every state commit — including our
  // own pushes — so pushState dedupes against the last pushed size to break the loop
  private var lastStateWidth = 0
  private var lastStateHeight = 0

  var stateWrapper: StateWrapper? = null
    set(value) {
      field = value
      pushState()
    }

  init {
    // The host stays in the React tree for layout only — children render in the root view
    visibility = GONE
  }

  // ==================== View Hierarchy Management ====================

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    attachRootView()
  }

  override fun onDetachedFromWindow() {
    detachRootView()
    super.onDetachedFromWindow()
  }

  private fun attachRootView() {
    if (rootView.parent != null) return

    val container = findRootContainerView(reactContext) ?: return
    container.addView(rootView)
    rootContainerView = container
  }

  private fun detachRootView() {
    rootContainerView?.removeView(rootView)
    rootContainerView = null
  }

  fun onDropInstance() {
    detachRootView()
    rootView.delegate = null
  }

  override fun addView(child: View?, index: Int) {
    rootView.addView(child, index)
  }

  override fun getChildCount(): Int = rootView.childCount

  override fun getChildAt(index: Int): View? = rootView.getChildAt(index)

  override fun removeViewAt(index: Int) {
    rootView.removeViewAt(index)
  }

  // Accessibility: children live in the root view since this view is hidden
  override fun addChildrenForAccessibility(outChildren: ArrayList<View>) {}
  override fun dispatchPopulateAccessibilityEvent(event: AccessibilityEvent): Boolean = false

  // ==================== State ====================

  override fun overlayRootViewDidChangeSize(width: Int, height: Int) {
    if (width == lastWidth && height == lastHeight) return

    lastWidth = width
    lastHeight = height
    pushState()
  }

  private fun pushState() {
    if (lastWidth == 0 && lastHeight == 0) return
    if (lastWidth == lastStateWidth && lastHeight == lastStateHeight) return
    val sw = stateWrapper ?: return

    lastStateWidth = lastWidth
    lastStateHeight = lastHeight
    TrueSheetStateUpdater.updateContainerSize(sw, lastWidth, lastHeight)
  }
}
