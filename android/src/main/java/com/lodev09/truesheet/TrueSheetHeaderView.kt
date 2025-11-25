package com.lodev09.truesheet

import android.annotation.SuppressLint
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.views.view.ReactViewGroup

/**
 * Delegate interface for header view size changes
 */
interface TrueSheetHeaderViewDelegate {
  fun headerViewDidChangeSize(width: Int, height: Int)
}

/**
 * Header view that holds the header content
 * Positioned at the top of the sheet content area
 */
@SuppressLint("ViewConstructor")
class TrueSheetHeaderView(context: ThemedReactContext) : ReactViewGroup(context) {
  var delegate: TrueSheetHeaderViewDelegate? = null

  private var lastWidth = 0
  private var lastHeight = 0

  override fun onLayout(
    changed: Boolean,
    left: Int,
    top: Int,
    right: Int,
    bottom: Int
  ) {
    super.onLayout(changed, left, top, right, bottom)

    // Notify delegate when header size changes
    val newWidth = right - left
    val newHeight = bottom - top

    if (newWidth != lastWidth || newHeight != lastHeight) {
      lastWidth = newWidth
      lastHeight = newHeight

      // Notify delegate of size change
      delegate?.headerViewDidChangeSize(newWidth, newHeight)
    }
  }
}
