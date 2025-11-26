package com.lodev09.truesheet

import android.annotation.SuppressLint
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.views.view.ReactViewGroup

/**
 * Delegate interface for content view size changes
 */
interface TrueSheetContentViewDelegate {
  fun contentViewDidChangeSize(width: Int, height: Int)
}

/**
 * Content view that holds the main sheet content
 * This is the first child of TrueSheetContainerView
 */
@SuppressLint("ViewConstructor")
class TrueSheetContentView(context: ThemedReactContext) : ReactViewGroup(context) {
  var delegate: TrueSheetContentViewDelegate? = null

  private var lastWidth = 0
  private var lastHeight = 0

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)

    if (w != lastWidth || h != lastHeight) {
      lastWidth = w
      lastHeight = h
      delegate?.contentViewDidChangeSize(w, h)
    }
  }

  companion object {
    const val TAG_NAME = "TrueSheet"
  }
}
