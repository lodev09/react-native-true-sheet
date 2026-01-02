package com.lodev09.truesheet

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.PointerEvents
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.annotations.ReactProp

/**
 * ViewManager for TrueSheetContentView
 * Manages the main content area of the sheet
 */
@ReactModule(name = TrueSheetContentViewManager.REACT_CLASS)
class TrueSheetContentViewManager : ViewGroupManager<TrueSheetContentView>() {

  override fun getName(): String = REACT_CLASS

  override fun createViewInstance(reactContext: ThemedReactContext): TrueSheetContentView = TrueSheetContentView(reactContext)

  @ReactProp(name = "pointerEvents")
  fun setPointerEvents(view: TrueSheetContentView, pointerEventsStr: String?) {
    view.setPointerEvents(PointerEvents.parsePointerEvents(pointerEventsStr))
  }

  companion object {
    const val REACT_CLASS = "TrueSheetContentView"
  }
}
