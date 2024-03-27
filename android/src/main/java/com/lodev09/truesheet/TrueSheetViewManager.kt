package com.lodev09.truesheet

import android.view.LayoutInflater
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewGroupManager

class TrueSheetViewManager : ViewGroupManager<TrueSheetView>() {
  override fun getName() = NAME

  override fun createViewInstance(reactContext: ThemedReactContext): TrueSheetView {
    return TrueSheetView(reactContext)
  }

  override fun onDropViewInstance(view: TrueSheetView) {
    super.onDropViewInstance(view)
    view.onDropInstance()
  }

  override fun addEventEmitters(reactContext: ThemedReactContext, view: TrueSheetView) {
    val dispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, view.id)
    if (dispatcher != null) {
      view.setEventDispatcher(dispatcher)
    }
  }

  companion object {
    const val NAME = "TrueSheetView"
  }
}
