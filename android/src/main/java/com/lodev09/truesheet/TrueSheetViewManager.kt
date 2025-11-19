package com.lodev09.truesheet

import android.graphics.Color
import android.view.WindowManager
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableType
import com.facebook.react.common.MapBuilder
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.annotations.ReactProp
import com.lodev09.truesheet.core.Utils

/**
 * ViewManager for TrueSheetView - Fabric architecture
 * Main sheet component that manages the bottom sheet dialog
 */
@ReactModule(name = TrueSheetViewManager.REACT_CLASS)
class TrueSheetViewManager : ViewGroupManager<TrueSheetView>() {

  override fun getName(): String = REACT_CLASS

  override fun createViewInstance(reactContext: ThemedReactContext): TrueSheetView {
    return TrueSheetView(reactContext)
  }

  override fun onDropViewInstance(view: TrueSheetView) {
    super.onDropViewInstance(view)
    view.onDropInstance()
  }

  override fun onAfterUpdateTransaction(view: TrueSheetView) {
    super.onAfterUpdateTransaction(view)
    view.configureIfShowing()
  }

  override fun needsCustomLayoutForChildren(): Boolean = true

  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> =
    mutableMapOf(
      TrueSheetEvent.MOUNT to MapBuilder.of("registrationName", "onMount"),
      TrueSheetEvent.WILL_PRESENT to MapBuilder.of("registrationName", "onWillPresent"),
      TrueSheetEvent.DID_PRESENT to MapBuilder.of("registrationName", "onDidPresent"),
      TrueSheetEvent.WILL_DISMISS to MapBuilder.of("registrationName", "onWillDismiss"),
      TrueSheetEvent.DID_DISMISS to MapBuilder.of("registrationName", "onDidDismiss"),
      TrueSheetEvent.DETENT_CHANGE to MapBuilder.of("registrationName", "onDetentChange"),
      TrueSheetEvent.DRAG_BEGIN to MapBuilder.of("registrationName", "onDragBegin"),
      TrueSheetEvent.DRAG_CHANGE to MapBuilder.of("registrationName", "onDragChange"),
      TrueSheetEvent.DRAG_END to MapBuilder.of("registrationName", "onDragEnd"),
      TrueSheetEvent.POSITION_CHANGE to MapBuilder.of("registrationName", "onPositionChange")
    )

  // ==================== Props ====================

  @ReactProp(name = "detents")
  fun setDetents(view: TrueSheetView, detents: ReadableArray?) {
    if (detents == null) {
      view.setDetents(arrayOf(0.5, 1.0))
      return
    }

    val result = ArrayList<Any>()
    for (i in 0 until detents.size()) {
      when (detents.getType(i)) {
        ReadableType.Number -> {
          val value = detents.getDouble(i)
          result.add(value)
        }
        else -> {
          // Skip invalid types
        }
      }
    }

    view.setDetents(result.toTypedArray())
  }

  @ReactProp(name = "background", defaultInt = Color.WHITE)
  fun setBackground(view: TrueSheetView, color: Int) {
    view.setBackground(color)
  }

  @ReactProp(name = "cornerRadius", defaultDouble = -1.0)
  fun setCornerRadius(view: TrueSheetView, radius: Double) {
    if (radius >= 0) {
      view.setCornerRadius(Utils.toPixel(radius))
    }
  }

  @ReactProp(name = "grabber", defaultBoolean = true)
  fun setGrabber(view: TrueSheetView, grabber: Boolean) {
    view.setGrabber(grabber)
  }

  @ReactProp(name = "dismissible", defaultBoolean = true)
  fun setDismissible(view: TrueSheetView, dismissible: Boolean) {
    view.setDismissible(dismissible)
  }

  @ReactProp(name = "dimmed", defaultBoolean = true)
  fun setDimmed(view: TrueSheetView, dimmed: Boolean) {
    view.setDimmed(dimmed)
  }

  @ReactProp(name = "dimmedIndex", defaultInt = 0)
  fun setDimmedIndex(view: TrueSheetView, index: Int) {
    view.setDimmedIndex(index)
  }

  @ReactProp(name = "initialIndex", defaultInt = -1)
  fun setInitialIndex(view: TrueSheetView, index: Int) {
    view.initialIndex = index
  }

  @ReactProp(name = "initialIndexAnimated", defaultBoolean = true)
  fun setInitialIndexAnimated(view: TrueSheetView, animate: Boolean) {
    view.initialIndexAnimated = animate
  }

  @ReactProp(name = "maxHeight", defaultDouble = 0.0)
  fun setMaxHeight(view: TrueSheetView, height: Double) {
    if (height > 0) {
      view.setMaxHeight(Utils.toPixel(height).toInt())
    }
  }

  @ReactProp(name = "edgeToEdge", defaultBoolean = false)
  fun setEdgeToEdge(view: TrueSheetView, edgeToEdge: Boolean) {
    view.setEdgeToEdge(edgeToEdge)
  }

  @ReactProp(name = "keyboardMode")
  fun setKeyboardMode(view: TrueSheetView, mode: String?) {
    val softInputMode = when (mode) {
      "pan" -> WindowManager.LayoutParams.SOFT_INPUT_ADJUST_PAN
      else -> WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE
    }
    view.setSoftInputMode(softInputMode)
  }

  @ReactProp(name = "blurTint")
  fun setBlurTint(view: TrueSheetView, tint: String?) {
    // iOS-specific prop - no-op on Android
    view.setBlurTint(tint)
  }

  companion object {
    const val REACT_CLASS = "TrueSheetView"
  }
}