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

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)

    if (w != lastWidth || h != lastHeight) {
      lastWidth = w
      lastHeight = h
      delegate?.headerViewDidChangeSize(w, h)
    }
  }

  companion object {
    const val TAG_NAME = "TrueSheet"
  }
}
