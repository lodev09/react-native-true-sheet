package com.lodev09.truesheet

import android.graphics.Color
import android.util.Log
import android.view.WindowManager
import com.facebook.react.bridge.ColorPropConverter
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableType
import com.facebook.react.common.MapBuilder
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.annotations.ReactProp
import com.lodev09.truesheet.core.Utils

class TrueSheetViewManager : ViewGroupManager<TrueSheetView>() {
  override fun getName() = TAG

  override fun createViewInstance(reactContext: ThemedReactContext): TrueSheetView = TrueSheetView(reactContext)

  override fun onDropViewInstance(view: TrueSheetView) {
    super.onDropViewInstance(view)
    view.onDropInstance()
  }

  override fun addEventEmitters(reactContext: ThemedReactContext, view: TrueSheetView) {
    val dispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, view.id)
    dispatcher?.let {
      view.eventDispatcher = it
    }
  }

  override fun onAfterUpdateTransaction(view: TrueSheetView) {
    super.onAfterUpdateTransaction(view)
    view.configureIfShowing()
  }

  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> =
    mutableMapOf(
      TrueSheetEvent.MOUNT to MapBuilder.of("registrationName", "onMount"),
      TrueSheetEvent.PRESENT to MapBuilder.of("registrationName", "onPresent"),
      TrueSheetEvent.DISMISS to MapBuilder.of("registrationName", "onDismiss"),
      TrueSheetEvent.SIZE_CHANGE to MapBuilder.of("registrationName", "onSizeChange"),
      TrueSheetEvent.DRAG_BEGIN to MapBuilder.of("registrationName", "onDragBegin"),
      TrueSheetEvent.DRAG_CHANGE to MapBuilder.of("registrationName", "onDragChange"),
      TrueSheetEvent.DRAG_END to MapBuilder.of("registrationName", "onDragEnd"),
      TrueSheetEvent.CONTAINER_SIZE_CHANGE to MapBuilder.of("registrationName", "onContainerSizeChange")
    )

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
