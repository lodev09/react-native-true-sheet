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

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)

    if (w != lastWidth || h != lastHeight) {
      lastWidth = w
      lastHeight = h
      delegate?.footerViewDidChangeSize(w, h)
    }
  }

  companion object {
    const val TAG_NAME = "TrueSheet"
  }
}
