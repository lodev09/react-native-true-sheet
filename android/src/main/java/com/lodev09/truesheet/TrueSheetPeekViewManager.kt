package com.lodev09.truesheet

import com.facebook.react.uimanager.PointerEvents
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.annotations.ReactProp

/**
 * ViewManager for TrueSheetPeekView
 * Marks part of the content as the sheet's peek content
 */
class TrueSheetPeekViewManager : ViewGroupManager<TrueSheetPeekView>() {

  override fun getName(): String = REACT_CLASS

  override fun createViewInstance(reactContext: ThemedReactContext): TrueSheetPeekView = TrueSheetPeekView(reactContext)

  override fun onDropViewInstance(view: TrueSheetPeekView) {
    super.onDropViewInstance(view)
    view.detachFromContainerView()
  }

  @ReactProp(name = "pointerEvents")
  fun setPointerEvents(view: TrueSheetPeekView, pointerEventsStr: String?) {
    view.pointerEvents = PointerEvents.parsePointerEvents(pointerEventsStr)
  }

  companion object {
    const val REACT_CLASS = "TrueSheetPeekView"
  }
}
