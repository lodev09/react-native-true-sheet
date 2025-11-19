package com.lodev09.truesheet

import android.content.Context
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.views.view.ReactViewGroup

/**
 * Container view that holds content and footer views
 * This is the first child of TrueSheetView and manages layout of content/footer
 */
class TrueSheetContainerView(context: Context) : ReactViewGroup(context) {

  private val reactContext: ThemedReactContext
    get() = context as ThemedReactContext

  /**
   * Reference to content view (first child)
   */
  val contentView: TrueSheetContentView?
    get() = if (childCount > 0 && getChildAt(0) is TrueSheetContentView) {
      getChildAt(0) as TrueSheetContentView
    } else {
      null
    }

  /**
   * Reference to footer view (second child)
   */
  val footerView: TrueSheetFooterView?
    get() = if (childCount > 1 && getChildAt(1) is TrueSheetFooterView) {
      getChildAt(1) as TrueSheetFooterView
    } else {
      null
    }

  init {
    // Container should not clip children to allow footer to position absolutely
    clipChildren = false
    clipToPadding = false
  }

  /**
   * The content view height
   */
  val contentHeight: Int
    get() = contentView?.height ?: 0

  /**
   * The footer view height
   */
  val footerHeight: Int
    get() = footerView?.height ?: 0
}
