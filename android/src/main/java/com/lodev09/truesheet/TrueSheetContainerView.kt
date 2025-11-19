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
   * Get the total content height (content + footer)
   */
  fun getTotalContentHeight(): Int {
    var height = 0
    contentView?.let { height += it.measuredHeight }
    footerView?.let { height += it.measuredHeight }
    return height
  }

  /**
   * Get only the content view height (excluding footer)
   */
  fun getContentHeight(): Int = contentView?.measuredHeight ?: 0

  /**
   * Get only the footer view height
   */
  fun getFooterHeight(): Int = footerView?.measuredHeight ?: 0
}
