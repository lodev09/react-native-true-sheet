package com.lodev09.truesheet

import com.facebook.react.bridge.ReadableMap
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.TrueSheetNavBarViewManagerDelegate
import com.facebook.react.viewmanagers.TrueSheetNavBarViewManagerInterface
import com.lodev09.truesheet.events.*

/**
 * ViewManager for TrueSheetNavBarView
 * Config view for the sheet's native navigation bar
 */
@ReactModule(name = TrueSheetNavBarViewManager.REACT_CLASS)
class TrueSheetNavBarViewManager :
  ViewGroupManager<TrueSheetNavBarView>(),
  TrueSheetNavBarViewManagerInterface<TrueSheetNavBarView> {

  private val delegate: ViewManagerDelegate<TrueSheetNavBarView> = TrueSheetNavBarViewManagerDelegate(this)

  override fun getName(): String = REACT_CLASS

  override fun createViewInstance(reactContext: ThemedReactContext): TrueSheetNavBarView = TrueSheetNavBarView(reactContext)

  override fun getDelegate(): ViewManagerDelegate<TrueSheetNavBarView> = delegate

  override fun onDropViewInstance(view: TrueSheetNavBarView) {
    super.onDropViewInstance(view)
    view.detachToolbar()
  }

  override fun onAfterUpdateTransaction(view: TrueSheetNavBarView) {
    super.onAfterUpdateTransaction(view)
    view.finalizeUpdates()
  }

  override fun addEventEmitters(reactContext: ThemedReactContext, view: TrueSheetNavBarView) {
    val dispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, view.id)
    view.eventDispatcher = dispatcher
  }

  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> =
    mutableMapOf(
      SearchChangeEvent.EVENT_NAME to hashMapOf("registrationName" to SearchChangeEvent.REGISTRATION_NAME),
      SearchSubmitEvent.EVENT_NAME to hashMapOf("registrationName" to SearchSubmitEvent.REGISTRATION_NAME),
      SearchFocusEvent.EVENT_NAME to hashMapOf("registrationName" to SearchFocusEvent.REGISTRATION_NAME),
      SearchBlurEvent.EVENT_NAME to hashMapOf("registrationName" to SearchBlurEvent.REGISTRATION_NAME),
      SearchCancelEvent.EVENT_NAME to hashMapOf("registrationName" to SearchCancelEvent.REGISTRATION_NAME)
    )

  // ==================== Props ====================

  @ReactProp(name = "title")
  override fun setTitle(view: TrueSheetNavBarView, value: String?) {
    view.title = value
  }

  @ReactProp(name = "largeTitle", defaultBoolean = false)
  override fun setLargeTitle(view: TrueSheetNavBarView, value: Boolean) {
    view.largeTitle = value
  }

  @ReactProp(name = "tintColor", customType = "Color")
  override fun setTintColor(view: TrueSheetNavBarView, value: Int?) {
    view.tintColor = value
  }

  @ReactProp(name = "titleColor", customType = "Color")
  override fun setTitleColor(view: TrueSheetNavBarView, value: Int?) {
    view.titleColor = value
  }

  @ReactProp(name = "barColor", customType = "Color")
  override fun setBarColor(view: TrueSheetNavBarView, value: Int?) {
    view.barColor = value
  }

  @ReactProp(name = "separatorHidden", defaultBoolean = false)
  override fun setSeparatorHidden(view: TrueSheetNavBarView, value: Boolean) {
    view.separatorHidden = value
  }

  @ReactProp(name = "searchable", defaultBoolean = false)
  override fun setSearchable(view: TrueSheetNavBarView, value: Boolean) {
    view.searchable = value
  }

  @ReactProp(name = "searchOptions")
  override fun setSearchOptions(view: TrueSheetNavBarView, options: ReadableMap?) {
    // cancelText, hideWhenScrolling, and searchPlacement are iOS-specific - no-op on Android
    view.searchPlaceholder = if (options != null && options.hasKey("placeholder")) options.getString("placeholder") else null
  }

  companion object {
    const val REACT_CLASS = "TrueSheetNavBarView"
  }
}
