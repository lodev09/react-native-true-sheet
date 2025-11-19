package com.lodev09.truesheet

import android.content.Context
import android.view.ViewGroup
import com.facebook.react.uimanager.ThemedReactContext

/**
 * Container view that holds content and footer views
 * This is the first child of TrueSheetView and manages layout of content/footer
 */
class TrueSheetContainerView(context: Context) : ViewGroup(context) {

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

  override fun onLayout(
    changed: Boolean,
    l: Int,
    t: Int,
    r: Int,
    b: Int
  ) {
    // Content view fills the container
    contentView?.let { content ->
      val contentWidth = r - l
      val contentHeight = content.measuredHeight
      content.layout(0, 0, contentWidth, contentHeight)
    }

    // Footer is positioned absolutely by TrueSheetDialog
    footerView?.let { footer ->
      val footerWidth = r - l
      val footerHeight = footer.measuredHeight
      // Initial layout at bottom, actual position set by TrueSheetDialog
      footer.layout(0, 0, footerWidth, footerHeight)
    }
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    val width = MeasureSpec.getSize(widthMeasureSpec)
    var totalHeight = 0

    // Measure content view
    contentView?.let { content ->
      measureChild(
        content,
        MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
        MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
      )
      totalHeight += content.measuredHeight
    }

    // Measure footer view
    footerView?.let { footer ->
      measureChild(
        footer,
        MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
        MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
      )
      totalHeight += footer.measuredHeight
    }

    setMeasuredDimension(width, totalHeight)
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
