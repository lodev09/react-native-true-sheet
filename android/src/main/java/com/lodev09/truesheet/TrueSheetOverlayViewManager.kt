package com.lodev09.truesheet

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.PointerEvents
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.annotations.ReactProp

/**
 * ViewManager for TrueSheetOverlayView
 * Renders content above every presented sheet
 */
@ReactModule(name = TrueSheetOverlayViewManager.REACT_CLASS)
class TrueSheetOverlayViewManager : ViewGroupManager<TrueSheetOverlayView>() {

  override fun getName(): String = REACT_CLASS

  override fun createViewInstance(reactContext: ThemedReactContext): TrueSheetOverlayView = TrueSheetOverlayView(reactContext)

  override fun onDropViewInstance(view: TrueSheetOverlayView) {
    super.onDropViewInstance(view)
    view.onDropInstance()
  }

  override fun addEventEmitters(reactContext: ThemedReactContext, view: TrueSheetOverlayView) {
    view.eventDispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, view.id)
  }

  override fun updateState(view: TrueSheetOverlayView, props: ReactStylesDiffMap?, stateWrapper: StateWrapper?): Any? {
    view.stateWrapper = stateWrapper
    return null
  }

  @ReactProp(name = "pointerEvents")
  fun setPointerEvents(view: TrueSheetOverlayView, pointerEventsStr: String?) {
    view.pointerEvents = PointerEvents.parsePointerEvents(pointerEventsStr)
  }

  companion object {
    const val REACT_CLASS = "TrueSheetOverlayView"
  }
}
