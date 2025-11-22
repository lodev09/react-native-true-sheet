package com.lodev09.truesheet

import android.annotation.SuppressLint
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.views.view.ReactViewGroup

/**
 * Delegate interface for footer view size changes
 */
interface TrueSheetFooterViewDelegate {
  fun footerViewDidChangeSize(width: Int, height: Int)
}

/**
 * Footer view that holds the footer content
 * This is the second child of TrueSheetContainerView
 * Positioned absolutely at the bottom of the sheet
 */
@SuppressLint("ViewConstructor")
class TrueSheetFooterView(context: ThemedReactContext) : ReactViewGroup(context) {
  var delegate: TrueSheetFooterViewDelegate? = null

  private var lastWidth = 0
  private var lastHeight = 0

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    super.onLayout(changed, left, top, right, bottom)

    // Notify delegate when footer size changes
    val newWidth = right - left
    val newHeight = bottom - top

    if (newWidth != lastWidth || newHeight != lastHeight) {
      lastWidth = newWidth
      lastHeight = newHeight

      // Notify delegate of size change
      delegate?.footerViewDidChangeSize(newWidth, newHeight)
    }
  }
}
