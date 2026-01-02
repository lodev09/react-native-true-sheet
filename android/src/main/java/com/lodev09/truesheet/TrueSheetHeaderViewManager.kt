package com.lodev09.truesheet

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.PointerEvents
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.annotations.ReactProp

/**
 * ViewManager for TrueSheetHeaderView
 * Manages the header area of the sheet
 */
@ReactModule(name = TrueSheetHeaderViewManager.REACT_CLASS)
class TrueSheetHeaderViewManager : ViewGroupManager<TrueSheetHeaderView>() {

  override fun getName(): String = REACT_CLASS

  override fun createViewInstance(reactContext: ThemedReactContext): TrueSheetHeaderView = TrueSheetHeaderView(reactContext)

  @ReactProp(name = "pointerEvents")
  fun setPointerEvents(view: TrueSheetHeaderView, pointerEventsStr: String?) {
    view.pointerEvents = PointerEvents.parsePointerEvents(pointerEventsStr)
  }

  companion object {
    const val REACT_CLASS = "TrueSheetHeaderView"
  }
}
