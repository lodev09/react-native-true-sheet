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

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    super.onLayout(changed, left, top, right, bottom)

    // Notify delegate when content size changes
    val newWidth = right - left
    val newHeight = bottom - top

    if (newWidth != lastWidth || newHeight != lastHeight) {
      lastWidth = newWidth
      lastHeight = newHeight

      // Notify delegate of size change
      delegate?.contentViewDidChangeSize(newWidth, newHeight)
    }
  }
}
