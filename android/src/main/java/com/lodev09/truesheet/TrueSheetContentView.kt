package com.lodev09.truesheet

import android.annotation.SuppressLint
import android.view.View
import android.view.ViewGroup
import android.widget.ScrollView
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

  private var pinnedScrollView: ScrollView? = null
  private var originalScrollViewPaddingBottom: Int = 0
  private var bottomInset: Int = 0

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)

    if (w != lastWidth || h != lastHeight) {
      lastWidth = w
      lastHeight = h
      delegate?.contentViewDidChangeSize(w, h)
    }
  }

  fun setupScrollViewPinning(bottomInset: Int) {
    this.bottomInset = bottomInset
    applyScrollViewBottomInset()
  }

  private fun applyScrollViewBottomInset() {
    val scrollView = findScrollView(this)

    if (scrollView != pinnedScrollView) {
      // Restore previous scroll view's padding
      pinnedScrollView?.setPadding(
        pinnedScrollView!!.paddingLeft,
        pinnedScrollView!!.paddingTop,
        pinnedScrollView!!.paddingRight,
        originalScrollViewPaddingBottom
      )

      pinnedScrollView = scrollView
      originalScrollViewPaddingBottom = scrollView?.paddingBottom ?: 0
    }

    scrollView?.let {
      it.clipToPadding = false
      it.setPadding(
        it.paddingLeft,
        it.paddingTop,
        it.paddingRight,
        originalScrollViewPaddingBottom + bottomInset
      )
    }
  }

  fun clearScrollViewPinning() {
    pinnedScrollView?.setPadding(
      pinnedScrollView!!.paddingLeft,
      pinnedScrollView!!.paddingTop,
      pinnedScrollView!!.paddingRight,
      originalScrollViewPaddingBottom
    )
    pinnedScrollView = null
    originalScrollViewPaddingBottom = 0
    bottomInset = 0
  }

  fun findScrollView(): ScrollView? = findScrollView(this)

  private fun findScrollView(view: View): ScrollView? {
    if (view is ScrollView) {
      return view
    }

    if (view is ViewGroup) {
      for (i in 0 until view.childCount) {
        val scrollView = findScrollView(view.getChildAt(i))
        if (scrollView != null) {
          return scrollView
        }
      }
    }

    return null
  }

  companion object {
    const val TAG_NAME = "TrueSheet"
  }
}
