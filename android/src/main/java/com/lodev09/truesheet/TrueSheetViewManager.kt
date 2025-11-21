package com.lodev09.truesheet

import android.graphics.Color
import android.view.WindowManager
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.TrueSheetViewManagerDelegate
import com.facebook.react.viewmanagers.TrueSheetViewManagerInterface
import com.lodev09.truesheet.events.*
import com.lodev09.truesheet.utils.PixelUtils

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
    view.showOrUpdate()
  }

  override fun addEventEmitters(reactContext: ThemedReactContext, view: TrueSheetView) {
    val dispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, view.id)
    view.eventDispatcher = dispatcher
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
      SizeChangeEvent.EVENT_NAME to hashMapOf("registrationName" to SizeChangeEvent.REGISTRATION_NAME)
    )

  // ==================== Props ====================

  @ReactProp(name = "detents")
  override fun setDetents(view: TrueSheetView, value: ReadableArray?) {
    if (value == null || value.size() == 0) {
      view.setDetents(mutableListOf(0.5f, 1f))
      return
    }

    val detents = mutableListOf<Any>()

    IntProgression
      .fromClosedRange(0, value.size() - 1, 1)
      .asSequence()
      .map { idx -> value.getDouble(idx) }
      .toCollection(detents)

    view.setDetents(detents)
  }

  @ReactProp(name = "background", defaultInt = Color.WHITE)
  override fun setBackground(view: TrueSheetView, color: Int) {
    view.setBackground(color)
  }

  @ReactProp(name = "cornerRadius", defaultDouble = -1.0)
  override fun setCornerRadius(view: TrueSheetView, radius: Double) {
    if (radius >= 0) {
      view.setCornerRadius(PixelUtils.toPixel(radius))
    }
  }

  @ReactProp(name = "grabber", defaultBoolean = true)
  override fun setGrabber(view: TrueSheetView, grabber: Boolean) {
    view.setGrabber(grabber)
  }

  @ReactProp(name = "dismissible", defaultBoolean = true)
  override fun setDismissible(view: TrueSheetView, dismissible: Boolean) {
    view.setDismissible(dismissible)
  }

  @ReactProp(name = "dimmed", defaultBoolean = true)
  override fun setDimmed(view: TrueSheetView, dimmed: Boolean) {
    view.setDimmed(dimmed)
  }

  @ReactProp(name = "dimmedIndex", defaultInt = 0)
  override fun setDimmedIndex(view: TrueSheetView, index: Int) {
    view.setDimmedIndex(index)
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
      view.setMaxHeight(PixelUtils.toPixel(height).toInt())
    }
  }

  @ReactProp(name = "keyboardMode")
  override fun setKeyboardMode(view: TrueSheetView, mode: String?) {
    val softInputMode = when (mode) {
      "pan" -> WindowManager.LayoutParams.SOFT_INPUT_ADJUST_PAN
      else -> WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE
    }
    view.setSoftInputMode(softInputMode)
  }

  @ReactProp(name = "blurTint")
  override fun setBlurTint(view: TrueSheetView, tint: String?) {
    // iOS-specific prop - no-op on Android
    view.setBlurTint(tint)
  }

  companion object {
    const val REACT_CLASS = "TrueSheetView"
    const val TAG_NAME = "TrueSheet"
  }
}
