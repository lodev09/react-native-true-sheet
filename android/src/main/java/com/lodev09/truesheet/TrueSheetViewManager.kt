package com.lodev09.truesheet

import android.graphics.Color
import android.util.Log
import android.view.WindowManager
import com.facebook.react.bridge.ColorPropConverter
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableType
import com.facebook.react.common.MapBuilder
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.annotations.ReactProp
import com.lodev09.truesheet.core.Utils

class TrueSheetViewManager : ViewGroupManager<TrueSheetView>() {
  override fun getName() = TAG

  override fun createViewInstance(reactContext: ThemedReactContext): TrueSheetView = TrueSheetView(reactContext)

  override fun onDropViewInstance(view: TrueSheetView) {
    super.onDropViewInstance(view)
    view.onHostDestroy()
  }

  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any>? =
    MapBuilder.builder<String, Any>()
      .put(TrueSheetEvent.MOUNT, MapBuilder.of("registrationName", "onMount"))
      .put(TrueSheetEvent.PRESENT, MapBuilder.of("registrationName", "onPresent"))
      .put(TrueSheetEvent.DISMISS, MapBuilder.of("registrationName", "onDismiss"))
      .put(TrueSheetEvent.SIZE_CHANGE, MapBuilder.of("registrationName", "onSizeChange"))
      .put(TrueSheetEvent.DRAG_BEGIN, MapBuilder.of("registrationName", "onDragBegin"))
      .put(TrueSheetEvent.DRAG_CHANGE, MapBuilder.of("registrationName", "onDragChange"))
      .put(TrueSheetEvent.DRAG_END, MapBuilder.of("registrationName", "onDragEnd"))
      .put(TrueSheetEvent.CONTAINER_SIZE_CHANGE, MapBuilder.of("registrationName", "onContainerSizeChange"))
      .build()

  @ReactProp(name = "edgeToEdge")
  fun setEdgeToEdge(view: TrueSheetView, edgeToEdge: Boolean) {
    view.setEdgeToEdge(edgeToEdge)
  }

  @ReactProp(name = "maxHeight")
  fun setMaxHeight(view: TrueSheetView, height: Double) {
    view.setMaxHeight(Utils.toPixel(height).toInt())
  }

  @ReactProp(name = "dismissible")
  fun setDismissible(view: TrueSheetView, dismissible: Boolean) {
    view.setDismissible(dismissible)
  }

  @ReactProp(name = "dimmed")
  fun setDimmed(view: TrueSheetView, dimmed: Boolean) {
    view.setDimmed(dimmed)
  }

  @ReactProp(name = "initialIndex")
  fun setInitialIndex(view: TrueSheetView, index: Int) {
    view.initialIndex = index
  }

  @ReactProp(name = "initialIndexAnimated")
  fun setInitialIndexAnimated(view: TrueSheetView, animate: Boolean) {
    view.initialIndexAnimated = animate
  }

  @ReactProp(name = "keyboardMode")
  fun setKeyboardMode(view: TrueSheetView, mode: String) {
    val softInputMode = when (mode) {
      "pan" -> WindowManager.LayoutParams.SOFT_INPUT_ADJUST_PAN
      else -> WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE
    }

    view.setSoftInputMode(softInputMode)
  }

  @ReactProp(name = "dimmedIndex")
  fun setDimmedIndex(view: TrueSheetView, index: Int) {
    view.setDimmedIndex(index)
  }

  @ReactProp(name = "contentHeight")
  fun setContentHeight(view: TrueSheetView, height: Double) {
    view.setContentHeight(Utils.toPixel(height).toInt())
  }

  @ReactProp(name = "footerHeight")
  fun setFooterHeight(view: TrueSheetView, height: Double) {
    view.setFooterHeight(Utils.toPixel(height).toInt())
  }

  @ReactProp(name = "cornerRadius")
  fun setCornerRadius(view: TrueSheetView, radius: Double) {
    view.setCornerRadius(Utils.toPixel(radius))
  }

  @ReactProp(name = "background")
  fun setBackground(view: TrueSheetView, colorName: Double) {
    val color = runCatching { ColorPropConverter.getColor(colorName, view.context) }.getOrDefault(Color.WHITE)
    view.setBackground(color)
  }

  @ReactProp(name = "sizes")
  fun setSizes(view: TrueSheetView, sizes: ReadableArray) {
    val result = ArrayList<Any>()
    for (i in 0 until minOf(sizes.size(), 3)) {
      when (sizes.getType(i)) {
        ReadableType.Number -> result.add(sizes.getDouble(i))

        // React Native < 0.77 used String for getString, but 0.77
        // changed it to String?. Suppress the error for older APIs.
        @Suppress("UNNECESSARY_SAFE_CALL")
        ReadableType.String
        -> sizes.getString(i)?.let { result.add(it) }

        else -> Log.d(TAG, "Invalid type")
      }
    }

    view.setSizes(result.toArray())
  }

  companion object {
    const val TAG = "TrueSheetView"
  }
}
