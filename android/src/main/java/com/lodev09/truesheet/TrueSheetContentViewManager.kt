package com.lodev09.truesheet

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager

/**
 * ViewManager for TrueSheetContentView
 * Manages the main content area of the sheet
 */
@ReactModule(name = TrueSheetContentViewManager.REACT_CLASS)
class TrueSheetContentViewManager : ViewGroupManager<TrueSheetContentView>() {

  override fun getName(): String = REACT_CLASS

  override fun createViewInstance(reactContext: ThemedReactContext): TrueSheetContentView {
    return TrueSheetContentView(reactContext)
  }

  override fun needsCustomLayoutForChildren(): Boolean = false

  companion object {
    const val REACT_CLASS = "TrueSheetContentView"
  }
}