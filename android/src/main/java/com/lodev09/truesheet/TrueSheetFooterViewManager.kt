package com.lodev09.truesheet

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.PointerEvents
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.annotations.ReactProp

/**
 * ViewManager for TrueSheetFooterView
 * Manages the footer area of the sheet
 */
@ReactModule(name = TrueSheetFooterViewManager.REACT_CLASS)
class TrueSheetFooterViewManager : ViewGroupManager<TrueSheetFooterView>() {

  override fun getName(): String = REACT_CLASS

  override fun createViewInstance(reactContext: ThemedReactContext): TrueSheetFooterView = TrueSheetFooterView(reactContext)

  @ReactProp(name = "pointerEvents")
  fun setPointerEvents(view: TrueSheetFooterView, pointerEventsStr: String?) {
    view.setPointerEvents(PointerEvents.parsePointerEvents(pointerEventsStr))
  }

  companion object {
    const val REACT_CLASS = "TrueSheetFooterView"
  }
}
