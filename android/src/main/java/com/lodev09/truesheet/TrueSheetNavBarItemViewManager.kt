package com.lodev09.truesheet

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.TrueSheetNavBarItemViewManagerDelegate
import com.facebook.react.viewmanagers.TrueSheetNavBarItemViewManagerInterface

/**
 * ViewManager for TrueSheetNavBarItemView
 * Bar item slot re-parented into the nav bar's toolbar
 */
@ReactModule(name = TrueSheetNavBarItemViewManager.REACT_CLASS)
class TrueSheetNavBarItemViewManager :
  ViewGroupManager<TrueSheetNavBarItemView>(),
  TrueSheetNavBarItemViewManagerInterface<TrueSheetNavBarItemView> {

  private val delegate: ViewManagerDelegate<TrueSheetNavBarItemView> = TrueSheetNavBarItemViewManagerDelegate(this)

  override fun getName(): String = REACT_CLASS

  override fun createViewInstance(reactContext: ThemedReactContext): TrueSheetNavBarItemView = TrueSheetNavBarItemView(reactContext)

  override fun getDelegate(): ViewManagerDelegate<TrueSheetNavBarItemView> = delegate

  @ReactProp(name = "slotType")
  override fun setSlotType(view: TrueSheetNavBarItemView, value: String?) {
    view.slotType = TrueSheetNavBarItemView.SlotType.fromString(value)
  }

  companion object {
    const val REACT_CLASS = "TrueSheetNavBarItemView"
  }
}
