package com.lodev09.truesheet

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager

/**
 * ViewManager for TrueSheetContainerView
 * Container that holds content and footer views
 */
@ReactModule(name = TrueSheetContainerViewManager.REACT_CLASS)
class TrueSheetContainerViewManager : ViewGroupManager<TrueSheetContainerView>() {

  override fun getName(): String = REACT_CLASS

  override fun createViewInstance(reactContext: ThemedReactContext): TrueSheetContainerView = TrueSheetContainerView(reactContext)

  companion object {
    const val REACT_CLASS = "TrueSheetContainerView"
  }
}
