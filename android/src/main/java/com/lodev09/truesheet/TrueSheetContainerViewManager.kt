package com.lodev09.truesheet

import android.view.View
import com.facebook.react.module.annotations.ReactModule
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

  override fun createViewInstance(reactContext: ThemedReactContext): TrueSheetContainerView {
    return TrueSheetContainerView(reactContext)
  }

  override fun needsCustomLayoutForChildren(): Boolean = true

  companion object {
    const val REACT_CLASS = "TrueSheetContainerView"
  }
}