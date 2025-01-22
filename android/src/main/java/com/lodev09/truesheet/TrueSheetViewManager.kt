package com.lodev09.truesheet

import android.graphics.Color
import android.util.Log
import android.view.WindowManager
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableType
import com.facebook.react.common.MapBuilder
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.annotations.ReactProp
import com.lodev09.truesheet.core.Utils
import com.lodev09.truesheet.events.ContainerSizeChangeEvent
import com.lodev09.truesheet.events.DismissEvent
import com.lodev09.truesheet.events.MountEvent
import com.lodev09.truesheet.events.PresentEvent
import com.lodev09.truesheet.events.SizeChangeEvent

class TrueSheetViewManager : ViewGroupManager<TrueSheetView>() {
  override fun getName() = TAG

  override fun createViewInstance(reactContext: ThemedReactContext): TrueSheetView = TrueSheetView(reactContext)

  override fun onDropViewInstance(view: TrueSheetView) {
    super.onDropViewInstance(view)
    view.onHostDestroy()
  }

  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any>? =
    MapBuilder.builder<String, Any>()
      .put(MountEvent.EVENT_NAME, MapBuilder.of("registrationName", "onMount"))
      .put(PresentEvent.EVENT_NAME, MapBuilder.of("registrationName", "onPresent"))
      .put(DismissEvent.EVENT_NAME, MapBuilder.of("registrationName", "onDismiss"))
      .put(SizeChangeEvent.EVENT_NAME, MapBuilder.of("registrationName", "onSizeChange"))
      .put(ContainerSizeChangeEvent.EVENT_NAME, MapBuilder.of("registrationName", "onContainerSizeChange"))
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
  fun setBackground(view: TrueSheetView, colorName: String) {
    val color = runCatching { Color.parseColor(colorName) }.getOrDefault(Color.WHITE)
    view.setBackground(color)
  }

  @ReactProp(name = "sizes")
  fun setSizes(view: TrueSheetView, sizes: ReadableArray) {
    val result = ArrayList<Any>()
    for (i in 0 until minOf(sizes.size(), 3)) {
      when (sizes.getType(i)) {
        ReadableType.Number -> result.add(sizes.getDouble(i))
        ReadableType.String -> result.add(sizes.getString(i) as String)
        else -> Log.d(TAG, "Invalid type")
      }
    }

    view.setSizes(result.toArray())
  }

  companion object {
    const val TAG = "TrueSheetView"
  }
}
