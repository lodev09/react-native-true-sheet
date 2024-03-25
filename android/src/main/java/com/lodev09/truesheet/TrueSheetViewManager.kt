package com.lodev09.truesheet

import android.annotation.SuppressLint
import android.view.LayoutInflater
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager

class TrueSheetViewManager : ViewGroupManager<TrueSheetView>() {
  override fun getName() = NAME

  @SuppressLint("InflateParams")
  override fun createViewInstance(reactContext: ThemedReactContext): TrueSheetView {
     return TrueSheetView(reactContext)
  }

  companion object {
    const val NAME = "TrueSheetView"
  }
}
