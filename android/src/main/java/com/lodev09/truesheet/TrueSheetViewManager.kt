package com.lodev09.truesheet

import android.graphics.Color
import android.util.Log
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableType
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.annotations.ReactProp

class TrueSheetViewManager : ViewGroupManager<TrueSheetView>() {
  override fun getName() = TAG

  override fun createViewInstance(reactContext: ThemedReactContext): TrueSheetView {
    return TrueSheetView(reactContext)
  }

  override fun onDropViewInstance(view: TrueSheetView) {
    super.onDropViewInstance(view)
    view.onHostDestroy()
  }

  override fun addEventEmitters(reactContext: ThemedReactContext, view: TrueSheetView) {
    val dispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, view.id)
    if (dispatcher != null) {
      view.setEventDispatcher(dispatcher)
    }
  }

  @ReactProp(name = "sizes")
  fun setSizes(view: TrueSheetView, sizes: ReadableArray?) {
    if (sizes != null) {
      val result = ArrayList<Any>()
      for (i in 0 until minOf(sizes.size(), 3)) {
        when (sizes.getType(i)) {
          ReadableType.Number -> result.add(sizes.getDouble(i))
          ReadableType.String -> result.add(sizes.getString(i))
          else -> Log.d(TAG, "Invalid type")
        }
      }

      view.setSizes(result.toArray())
    } else {
      view.setSizes(arrayOf("medium", "large"))
    }
  }

  companion object {
    const val TAG = "TrueSheetView"
  }
}
