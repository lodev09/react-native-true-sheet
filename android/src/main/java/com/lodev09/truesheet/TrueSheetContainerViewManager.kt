package com.lodev09.truesheet

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.PointerEvents
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.annotations.ReactProp

/**
 * ViewManager for TrueSheetContainerView
 * Container that holds content and footer views
 */
@ReactModule(name = TrueSheetContainerViewManager.REACT_CLASS)
class TrueSheetContainerViewManager : ViewGroupManager<TrueSheetContainerView>() {

  override fun getName(): String = REACT_CLASS

  override fun createViewInstance(reactContext: ThemedReactContext): TrueSheetContainerView = TrueSheetContainerView(reactContext)

  @ReactProp(name = "pointerEvents")
  fun setPointerEvents(view: TrueSheetContainerView, pointerEventsStr: String?) {
    view.pointerEvents = PointerEvents.parsePointerEvents(pointerEventsStr)
  }

  companion object {
    const val REACT_CLASS = "TrueSheetContainerView"
  }
}
