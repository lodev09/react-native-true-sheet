package com.lodev09.truesheet

import android.view.WindowManager
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.PixelUtil.dpToPx
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.TrueSheetViewManagerDelegate
import com.facebook.react.viewmanagers.TrueSheetViewManagerInterface
import com.lodev09.truesheet.core.GrabberOptions
import com.lodev09.truesheet.events.*

/**
 * ViewManager for TrueSheetView - Fabric architecture
 * Main sheet component that manages the bottom sheet dialog
 */
@ReactModule(name = TrueSheetViewManager.REACT_CLASS)
class TrueSheetViewManager :
  ViewGroupManager<TrueSheetView>(),
  TrueSheetViewManagerInterface<TrueSheetView> {

  private val delegate: ViewManagerDelegate<TrueSheetView> = TrueSheetViewManagerDelegate(this)

  override fun getName(): String = REACT_CLASS

  override fun createViewInstance(reactContext: ThemedReactContext): TrueSheetView = TrueSheetView(reactContext)

  override fun onDropViewInstance(view: TrueSheetView) {
    super.onDropViewInstance(view)
    view.onDropInstance()
  }

  override fun onAfterUpdateTransaction(view: TrueSheetView) {
    super.onAfterUpdateTransaction(view)
    view.finalizeUpdates()
  }

  override fun addEventEmitters(reactContext: ThemedReactContext, view: TrueSheetView) {
    val dispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, view.id)
    view.eventDispatcher = dispatcher
  }

  override fun updateState(view: TrueSheetView, props: ReactStylesDiffMap?, stateWrapper: StateWrapper?): Any? {
    view.stateWrapper = stateWrapper
    return null
  }

  override fun getDelegate(): ViewManagerDelegate<TrueSheetView> = delegate

  /**
   * Export custom direct event types for Fabric
   * Uses Kotlin native collections with decoupled event classes
   */
  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> =
    mutableMapOf(
      MountEvent.EVENT_NAME to hashMapOf("registrationName" to MountEvent.REGISTRATION_NAME),
      WillPresentEvent.EVENT_NAME to hashMapOf("registrationName" to WillPresentEvent.REGISTRATION_NAME),
      DidPresentEvent.EVENT_NAME to hashMapOf("registrationName" to DidPresentEvent.REGISTRATION_NAME),
      WillDismissEvent.EVENT_NAME to hashMapOf("registrationName" to WillDismissEvent.REGISTRATION_NAME),
      DidDismissEvent.EVENT_NAME to hashMapOf("registrationName" to DidDismissEvent.REGISTRATION_NAME),
      DetentChangeEvent.EVENT_NAME to hashMapOf("registrationName" to DetentChangeEvent.REGISTRATION_NAME),
      DragBeginEvent.EVENT_NAME to hashMapOf("registrationName" to DragBeginEvent.REGISTRATION_NAME),
      DragChangeEvent.EVENT_NAME to hashMapOf("registrationName" to DragChangeEvent.REGISTRATION_NAME),
      DragEndEvent.EVENT_NAME to hashMapOf("registrationName" to DragEndEvent.REGISTRATION_NAME),
      PositionChangeEvent.EVENT_NAME to hashMapOf("registrationName" to PositionChangeEvent.REGISTRATION_NAME),
      WillFocusEvent.EVENT_NAME to hashMapOf("registrationName" to WillFocusEvent.REGISTRATION_NAME),
      FocusEvent.EVENT_NAME to hashMapOf("registrationName" to FocusEvent.REGISTRATION_NAME),
      WillBlurEvent.EVENT_NAME to hashMapOf("registrationName" to WillBlurEvent.REGISTRATION_NAME),
      BlurEvent.EVENT_NAME to hashMapOf("registrationName" to BlurEvent.REGISTRATION_NAME),
      BackPressEvent.EVENT_NAME to hashMapOf("registrationName" to BackPressEvent.REGISTRATION_NAME)
    )

  // ==================== Props ====================

  @ReactProp(name = "detents")
  override fun setDetents(view: TrueSheetView, value: ReadableArray?) {
    if (value == null || value.size() == 0) {
      view.setDetents(mutableListOf(0.5, 1.0))
      return
    }

    val detents = mutableListOf<Double>()

    IntProgression
      .fromClosedRange(0, value.size() - 1, 1)
      .asSequence()
      .map { idx -> value.getDouble(idx) }
      .toCollection(detents)

    view.setDetents(detents)
  }

  @ReactProp(name = "backgroundColor", customType = "Color")
  override fun setBackgroundColor(view: TrueSheetView, color: Int?) {
    view.setSheetBackgroundColor(color)
  }

  @ReactProp(name = "cornerRadius", defaultDouble = -1.0)
  override fun setCornerRadius(view: TrueSheetView, radius: Double) {
    view.setCornerRadius(radius.dpToPx())
  }

  @ReactProp(name = "grabber", defaultBoolean = true)
  override fun setGrabber(view: TrueSheetView, grabber: Boolean) {
    view.setGrabber(grabber)
  }

  @ReactProp(name = "grabberOptions")
  override fun setGrabberOptions(view: TrueSheetView, options: ReadableMap?) {
    if (options == null) {
      view.setGrabberOptions(null)
      return
    }

    val grabberOptions = GrabberOptions(
      width = if (options.hasKey("width")) options.getDouble("width").toFloat() else null,
      height = if (options.hasKey("height")) options.getDouble("height").toFloat() else null,
      topMargin = if (options.hasKey("topMargin")) options.getDouble("topMargin").toFloat() else null,
      cornerRadius = if (options.hasKey("cornerRadius") &&
        options.getDouble("cornerRadius") >= 0
      ) {
        options.getDouble("cornerRadius").toFloat()
      } else {
        null
      },
      color = if (options.hasKey("color") && !options.isNull("color")) options.getInt("color") else null,
      adaptive = if (options.hasKey("adaptive")) options.getBoolean("adaptive") else true
    )
    view.setGrabberOptions(grabberOptions)
  }

  @ReactProp(name = "dismissible", defaultBoolean = true)
  override fun setDismissible(view: TrueSheetView, dismissible: Boolean) {
    view.setDismissible(dismissible)
  }

  @ReactProp(name = "draggable", defaultBoolean = true)
  override fun setDraggable(view: TrueSheetView, draggable: Boolean) {
    view.setDraggable(draggable)
  }

  @ReactProp(name = "dimmed", defaultBoolean = true)
  override fun setDimmed(view: TrueSheetView, dimmed: Boolean) {
    view.setDimmed(dimmed)
  }

  @ReactProp(name = "dimmedDetentIndex", defaultInt = 0)
  override fun setDimmedDetentIndex(view: TrueSheetView, index: Int) {
    view.setDimmedDetentIndex(index)
  }

  @ReactProp(name = "initialDetentIndex", defaultInt = -1)
  override fun setInitialDetentIndex(view: TrueSheetView, index: Int) {
    view.initialDetentIndex = index
  }

  @ReactProp(name = "initialDetentAnimated", defaultBoolean = true)
  override fun setInitialDetentAnimated(view: TrueSheetView, animate: Boolean) {
    view.initialDetentAnimated = animate
  }

  @ReactProp(name = "maxHeight", defaultDouble = 0.0)
  override fun setMaxHeight(view: TrueSheetView, height: Double) {
    if (height > 0) {
      view.setMaxHeight(height.dpToPx().toInt())
    }
  }

  @ReactProp(name = "backgroundBlur")
  override fun setBackgroundBlur(view: TrueSheetView, tint: String?) {
    // iOS-specific prop - no-op on Android
  }

  @ReactProp(name = "blurOptions")
  override fun setBlurOptions(view: TrueSheetView, options: ReadableMap?) {
    // iOS-specific prop - no-op on Android
  }

  @ReactProp(name = "insetAdjustment")
  override fun setInsetAdjustment(view: TrueSheetView, insetAdjustment: String?) {
    view.setInsetAdjustment(insetAdjustment ?: "automatic")
  }

  @ReactProp(name = "scrollable", defaultBoolean = false)
  override fun setScrollable(view: TrueSheetView, value: Boolean) {
    // iOS-specific prop - no-op on Android
  }

  @ReactProp(name = "pageSizing", defaultBoolean = true)
  override fun setPageSizing(view: TrueSheetView, value: Boolean) {
    // iOS-specific prop - no-op on Android
  }

  companion object {
    const val REACT_CLASS = "TrueSheetView"
    const val TAG_NAME = "TrueSheet"
  }
}
