package com.lodev09.truesheet

import android.annotation.SuppressLint
import android.view.ViewParent
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.views.view.ReactViewGroup

/**
 * Delegate interface for peek view size changes
 */
interface TrueSheetPeekViewDelegate {
  fun peekViewDidChangeSize(width: Int, height: Int)
}

/**
 * Peek view that marks part of the content as the sheet's peek content.
 * The peek detent covers the content through this view's bottom edge.
 */
@SuppressLint("ViewConstructor")
class TrueSheetPeekView(context: ThemedReactContext) : ReactViewGroup(context) {
  var delegate: TrueSheetPeekViewDelegate? = null

  override fun onLayout(
    changed: Boolean,
    left: Int,
    top: Int,
    right: Int,
    bottom: Int
  ) {
    super.onLayout(changed, left, top, right, bottom)

    attachToContainerView()

    // Position changes matter too — the peek's offset within the content
    // affects the peek detent.
    if (changed) {
      delegate?.peekViewDidChangeSize(width, height)
    }
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    attachToContainerView()
  }

  /**
   * Peek can be nested anywhere within the content, so it attaches itself to the
   * nearest container instead of being mounted by it. The container also searches
   * for it when the content is added to cover the initial (bottom-up) mount order.
   */
  private fun attachToContainerView() {
    if (delegate != null) return

    var parent: ViewParent? = parent
    while (parent != null && parent !is TrueSheetContainerView) {
      parent = parent.parent
    }

    (parent as? TrueSheetContainerView)?.attachPeekView(this)
  }

  /**
   * Called by the ViewManager when the view is dropped (Fabric unmount)
   */
  fun detachFromContainerView() {
    (delegate as? TrueSheetContainerView)?.detachPeekView(this)
  }

  companion object {
    const val TAG_NAME = "TrueSheet"
  }
}
