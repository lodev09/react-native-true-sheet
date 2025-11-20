package com.lodev09.truesheet

import android.annotation.SuppressLint
import androidx.core.view.isNotEmpty
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.views.view.ReactViewGroup

/**
 * Container view that manages the bottom sheet content and holds content and footer views.
 * Simplified to be a lightweight content manager - events are now handled via dialog delegate.
 */
@SuppressLint("ViewConstructor")
class TrueSheetContainerView(private val reactContext: ThemedReactContext) : ReactViewGroup(reactContext) {

  /**
   * Reference to content view (first child)
   */
  val contentView: TrueSheetContentView?
    get() = if (isNotEmpty() && getChildAt(0) is TrueSheetContentView) {
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

  init {
    // Container should not clip children to allow footer to position absolutely
    clipChildren = false
    clipToPadding = false
  }
}
