package com.lodev09.truesheet

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager

/**
 * ViewManager for TrueSheetHeaderView
 * Manages the header area of the sheet
 */
@ReactModule(name = TrueSheetHeaderViewManager.REACT_CLASS)
class TrueSheetHeaderViewManager : ViewGroupManager<TrueSheetHeaderView>() {

  override fun getName(): String = REACT_CLASS

  override fun createViewInstance(reactContext: ThemedReactContext): TrueSheetHeaderView = TrueSheetHeaderView(reactContext)

  companion object {
    const val REACT_CLASS = "TrueSheetHeaderView"
  }
}
