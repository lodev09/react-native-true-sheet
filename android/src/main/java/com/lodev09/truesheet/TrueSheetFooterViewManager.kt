package com.lodev09.truesheet

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager

/**
 * ViewManager for TrueSheetFooterView
 * Manages the footer area of the sheet
 */
@ReactModule(name = TrueSheetFooterViewManager.REACT_CLASS)
class TrueSheetFooterViewManager : ViewGroupManager<TrueSheetFooterView>() {

  override fun getName(): String = REACT_CLASS

  override fun createViewInstance(reactContext: ThemedReactContext): TrueSheetFooterView {
    return TrueSheetFooterView(reactContext)
  }

  override fun needsCustomLayoutForChildren(): Boolean = false

  companion object {
    const val REACT_CLASS = "TrueSheetFooterView"
  }
}